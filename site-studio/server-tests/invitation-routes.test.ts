import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { INVITATION_TTL_MS } from "../shared/invitation";
import { REFUSALS } from "../shared/refusal";
import { APP_HEADER, APP_HEADER_VALUE, acceptInviteReply, invitationReadReply, inviteReply, ROUTE_LIST, ROUTES, sessionReply } from "../shared/routes";
import { normalisePassword } from "../shared/setup";
import { markerCookieName } from "../server/auth/marker";
import { HASH_QUEUE_MAX_WAITING, hashPassword, hashQueue, verifyPassword, type PasswordHash } from "../server/auth/password";
import { sessionCookieName, sha256Hex } from "../server/auth/session";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import type { Installation } from "../server/installation/Installation";
import { INVITATIONS_TABLE } from "../server/installation/invitationStore";
import { USERS_TABLE } from "../server/installation/setupStore";
import {
  get,
  installationFor,
  jarFrom,
  ORIGIN,
  post,
  readSession,
  refusalOf,
  seedAccount,
  setCookiesOf,
  signedIn,
  signIn,
  signOut,
  awayFromStepEnd,
  startedByRoutes,
  turnedOnByRoutes,
  type Installed,
} from "./signin-helpers";
import { stepAt, totpAt } from "../server/auth/totp";

// The invitation routes (story 1.4, spec 2): invite, read and accept, the session read's new
// fields, the origin rule, the hash queue, the route sweep, the log watch and the invitation page's
// `Referrer-Policy`. Each test has its own installation object. No real address, password or
// secret is used; every value is made up for the test.

const INVITE_PATH = ROUTES.invite.path;
const READ_PATH = ROUTES.invitationRead.path;
const ACCEPT_PATH = ROUTES.acceptInvite.path;

const ADMIN_EMAIL = "dana@acme.test";
const ADMIN_PASSWORD = "correct horse battery staple";
const INVITEE = "robin.new@acme.test";
const INVITEE_NAME = "Robin New";
const NEW_PASSWORD = "a brand new long password";

/** One real hash of ADMIN_PASSWORD, made once and copied into seeded administrators. */
let adminHash: PasswordHash;

beforeAll(async () => {
  adminHash = await hashPassword(normalisePassword(ADMIN_PASSWORD));
});

interface Admin {
  installed: Installed;
  adminId: string;
  /** The administrator's browser cookies: session and marker. */
  cookies: Record<string, string>;
}

/** An installation with one administrator, signed in. */
async function signedInAdmin(name: string, wrap?: Parameters<typeof installationFor>[1]): Promise<Admin> {
  const installed = installationFor(`inv-${name}`, wrap);
  const adminId = await seedAccount(installed.stub, { email: ADMIN_EMAIL, hash: adminHash });
  const cookies = await signedIn(installed.env, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { installed, adminId, cookies };
}

function invite(admin: Admin, body: unknown = { email: INVITEE, name: INVITEE_NAME, role: "standard" }, cookies = admin.cookies) {
  return post(admin.installed.env, INVITE_PATH, body, { cookies });
}

/** Invites and answers the link's secret, failing the test unless the reply is 200. */
async function invited(admin: Admin, email = INVITEE, role: "standard" | "administrator" = "standard"): Promise<string> {
  const response = await invite(admin, { email, name: INVITEE_NAME, role });
  expect(response.status, await response.clone().text()).toBe(200);
  const { link } = (await response.json()) as { link: string };
  return link.slice(link.indexOf("#") + 1);
}

function readInvitation(target: Env, secret: string, options: Parameters<typeof post>[3] = {}) {
  return post(target, READ_PATH, { secret }, options);
}

function accept(target: Env, body: { secret: string; name?: string; password?: string }, options: Parameters<typeof post>[3] = {}) {
  return post(target, ACCEPT_PATH, { name: INVITEE_NAME, password: NEW_PASSWORD, ...body }, options);
}

function identifierOf(installed: Installed): Promise<string> {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.identifier());
}

function countRows(installed: Installed, table: string): Promise<number> {
  return runInDurableObject(installed.stub, (_i, state) => state.storage.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`).one().n);
}

function userRow(installed: Installed, email: string) {
  return runInDurableObject(installed.stub, (_i, state) =>
    state.storage.sql
      .exec<{
        id: string;
        name: string;
        role: string;
        password_algorithm: string;
        password_n: number;
        password_r: number;
        password_p: number;
        password_key_length: number;
        password_salt: string;
        password_hash: string;
      }>(`SELECT * FROM ${USERS_TABLE} WHERE email = ?`, email)
      .toArray()[0],
  );
}

/** True while the invitation is live: its read answers 200. */
async function isLive(target: Env, secret: string): Promise<boolean> {
  const response = await readInvitation(target, secret);
  await response.arrayBuffer();
  return response.status === 200;
}

/** Holds the isolate's hash queue full (one running, 20 waiting) until released. */
function fillHashQueue() {
  let release!: () => void;
  const running = new Promise<void>((resolve) => (release = resolve));
  const tasks = [hashQueue.run(() => running)];
  for (let index = 0; index < HASH_QUEUE_MAX_WAITING; index += 1) tasks.push(hashQueue.run(async () => undefined));
  expect(hashQueue.hasRoom()).toBe(false);
  return async () => {
    release();
    await Promise.all(tasks);
  };
}

/** Holds the hash queue's running slot (nothing waiting) until released. */
function holdHashSlot() {
  let release!: () => void;
  const running = hashQueue.run(() => new Promise<void>((resolve) => (release = resolve)));
  expect(hashQueue.stats().active).toBe(1);
  return async () => {
    release();
    await running;
  };
}

async function until(condition: () => boolean, what: string) {
  const deadline = Date.now() + 10_000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}.`);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

describe("POST /api/v1/invitations", { timeout: 60_000 }, () => {
  it("is appOriginOnly and reads the session cookie", () => {
    expect(ROUTES.invite.method).toBe("POST");
    expect(ROUTES.invite.appOriginOnly).toBe(true);
    expect(ROUTES.invite.readsSessionCookie).toBe(true);
  });

  it("for an administrator answers the link on the recorded public address and the expiry 7 days on", async () => {
    const admin = await signedInAdmin("invite");
    const before = Date.now();
    const response = await invite(admin);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([]);
    // The only reply holding the secret is never cached.
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = (await response.json()) as { link: string; expiresAt: string };
    expect(inviteReply.parse(body)).toEqual(body);
    expect(Object.keys(body).sort()).toEqual(["expiresAt", "link"]);
    expect(body.link).toMatch(new RegExp(`^${ORIGIN.replace(/\./g, "\\.")}/invite#[A-Za-z0-9_-]{43}$`));
    const expires = Date.parse(body.expiresAt);
    expect(body.expiresAt).toMatch(/Z$/);
    expect(expires).toBeGreaterThanOrEqual(before + INVITATION_TTL_MS);
    expect(expires).toBeLessThanOrEqual(Date.now() + INVITATION_TTL_MS);
  });

  it("builds the link on the recorded public address even when the request's Host and Origin differ (CA-57, AD-12)", async () => {
    const admin = await signedInAdmin("invite-other-host");
    const other = "https://other-host.example.test";
    const cookie = Object.entries(admin.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    const response = await handleRequest(
      new Request(other + INVITE_PATH, {
        method: "POST",
        headers: { "content-type": "application/json", origin: other, [APP_HEADER]: APP_HEADER_VALUE, cookie },
        body: JSON.stringify({ email: INVITEE, name: INVITEE_NAME, role: "standard" }),
      }),
      admin.installed.env,
    );
    expect(response.status).toBe(200);
    const { link } = (await response.json()) as { link: string };
    expect(link.startsWith(ORIGIN + "/invite#")).toBe(true);
    expect(link).not.toContain("other-host");
  });

  for (const [what, options] of [
    ["another Origin", { origin: "https://evil.example.test" }],
    ["no Origin", { origin: null }],
    ["no app header", { header: null }],
  ] as const) {
    it(`with ${what} is refused origin_refused before the body is read`, async () => {
      const admin = await signedInAdmin(`invite-origin-${what.replace(/\W/g, "")}`);
      admin.installed.calls.clear();
      const response = await handleRequest(
        new Request(ORIGIN + INVITE_PATH, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(options.origin === null ? {} : { origin: "origin" in options ? options.origin : ORIGIN }),
            ...("header" in options ? {} : { [APP_HEADER]: APP_HEADER_VALUE }),
            cookie: Object.entries(admin.cookies)
              .map(([name, value]) => `${name}=${value}`)
              .join("; "),
          },
          // Not JSON: had the body been read, the refusal would be invalid_input.
          body: "not json at all",
        }),
        admin.installed.env,
      );
      expect(response.status).toBe(403);
      expect((await refusalOf(response, [])).code).toBe("origin_refused");
      expect(admin.installed.calls.size).toBe(0);
      expect(await countRows(admin.installed, INVITATIONS_TABLE)).toBe(0);
    });
  }

  it("for a standard user's session is refused 403 administrator_only, and with no session 401 not_signed_in (D-6)", async () => {
    const admin = await signedInAdmin("invite-standard");
    await runInDurableObject(admin.installed.stub, (_i, state) => state.storage.sql.exec(`UPDATE ${USERS_TABLE} SET role = 'standard' WHERE id = ?`, admin.adminId));
    const standard = await invite(admin);
    expect(standard.status).toBe(403);
    expect(await refusalOf(standard, [INVITEE, INVITEE_NAME])).toEqual({ code: "administrator_only", message: REFUSALS.administrator_only.message });

    const none = await invite(admin, undefined, {});
    expect(none.status).toBe(401);
    expect(await refusalOf(none, [INVITEE, INVITEE_NAME])).toEqual({ code: "not_signed_in", message: REFUSALS.not_signed_in.message });
    expect(await countRows(admin.installed, INVITATIONS_TABLE)).toBe(0);
  });

  it("for an email with an account, in another letter case, is refused 409 invitation_email_taken naming the field email (CA-10)", async () => {
    const admin = await signedInAdmin("invite-taken");
    const entered = "DANA@Acme.TEST";
    const response = await invite(admin, { email: entered, name: INVITEE_NAME, role: "standard" });
    expect(response.status).toBe(409);
    expect(await refusalOf(response, [entered, ADMIN_EMAIL, INVITEE_NAME])).toEqual({
      code: "invitation_email_taken",
      message: "That email already has an account.",
      field: "email",
    });
    expect(await countRows(admin.installed, INVITATIONS_TABLE)).toBe(0);
  });

  it("with bad input is refused 400 invalid_input naming the field", async () => {
    const admin = await signedInAdmin("invite-bad-input");
    const cases: [unknown, string, string[]][] = [
      [{ email: "not-an-email", name: INVITEE_NAME, role: "standard" }, "email", ["not-an-email"]],
      [{ email: INVITEE, name: "", role: "standard" }, "name", [INVITEE]],
      [{ email: INVITEE, name: INVITEE_NAME, role: "owner" }, "role", [INVITEE, "owner"]],
    ];
    for (const [body, field, entered] of cases) {
      const response = await invite(admin, body);
      expect(response.status, field).toBe(400);
      expect(await refusalOf(response, entered), field).toMatchObject({ code: "invalid_input", field });
    }
    expect(await countRows(admin.installed, INVITATIONS_TABLE)).toBe(0);
  });
});

describe("POST /api/v1/invitations/read", { timeout: 60_000 }, () => {
  it("is appOriginOnly and reads no cookie", () => {
    expect(ROUTES.invitationRead.appOriginOnly).toBe(true);
    expect(ROUTES.invitationRead.readsSessionCookie).toBeUndefined();
  });

  it("for a live secret answers the inviter, the installation, the email, the name and the role", async () => {
    const admin = await signedInAdmin("read");
    const secret = await invited(admin);
    const response = await readInvitation(admin.installed.env, secret);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([]);
    const text = await response.text();
    expect(text).not.toContain(secret);
    const body = JSON.parse(text);
    expect(body).toEqual({ inviterName: "Dana Admin", installationName: "Acme Security", email: INVITEE, name: INVITEE_NAME, role: "standard" });
    expect(invitationReadReply.parse(body)).toEqual(body);
  });

  it("for a malformed secret answers 410 invitation_unusable without an object call", async () => {
    const admin = await signedInAdmin("read-malformed");
    admin.installed.calls.clear();
    for (const secret of ["abcdefghij", "a".repeat(42), "a".repeat(44), "+".repeat(43)]) {
      const response = await readInvitation(admin.installed.env, secret);
      expect(response.status).toBe(410);
      expect(await refusalOf(response, [secret])).toEqual({ code: "invitation_unusable", message: REFUSALS.invitation_unusable.message });
    }
    expect(admin.installed.calls.get("invitationInfo")).toBeUndefined();
    expect(admin.installed.calls.size).toBe(0);
  });

  it("for a replaced or used secret answers 410 invitation_unusable", async () => {
    const admin = await signedInAdmin("read-unusable");
    const replaced = await invited(admin);
    const current = await invited(admin);
    const response = await readInvitation(admin.installed.env, replaced);
    expect(response.status).toBe(410);
    expect((await refusalOf(response, [replaced])).code).toBe("invitation_unusable");
    expect(await isLive(admin.installed.env, current)).toBe(true);

    expect((await accept(admin.installed.env, { secret: current })).status).toBe(200);
    const used = await readInvitation(admin.installed.env, current);
    expect(used.status).toBe(410);
    expect((await refusalOf(used, [current])).code).toBe("invitation_unusable");
  });

  it("with another Origin is refused origin_refused", async () => {
    const admin = await signedInAdmin("read-origin");
    const secret = await invited(admin);
    const response = await readInvitation(admin.installed.env, secret, { origin: "https://evil.example.test" });
    expect(response.status).toBe(403);
    expect((await refusalOf(response, [secret])).code).toBe("origin_refused");
  });
});

describe("POST /api/v1/invitations/accept", { timeout: 120_000 }, () => {
  it("is appOriginOnly and reads the session cookie", () => {
    expect(ROUTES.acceptInvite.appOriginOnly).toBe(true);
    expect(ROUTES.acceptInvite.readsSessionCookie).toBe(true);
  });

  it("creates the account with an edited name, sets the session and marker, and the session read names it with its accountId and role (D-4, D-5, D-7)", async () => {
    const admin = await signedInAdmin("accept");
    const identifier = await identifierOf(admin.installed);
    const secret = await invited(admin);
    const response = await accept(admin.installed.env, { secret, name: "Robin Edited" });
    expect(response.status, await response.clone().text()).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(secret);
    const body = JSON.parse(text);
    expect(body).toEqual({ name: "Robin Edited" });
    expect(acceptInviteReply.parse(body)).toEqual(body);

    const cookies = setCookiesOf(response);
    expect(cookies.map((cookie) => cookie.name).sort()).toEqual([markerCookieName(identifier), sessionCookieName(identifier)].sort());
    for (const cookie of cookies) expect(cookie.name.startsWith("__Host-")).toBe(true);

    const user = await userRow(admin.installed, INVITEE);
    expect(user).toMatchObject({ name: "Robin Edited", role: "standard" });
    const session = await readSession(admin.installed.env, { cookies: jarFrom(response) });
    const read = await session.json();
    expect(read).toEqual({ signedIn: true, name: "Robin Edited", accountId: user!.id, role: "standard", installationName: "Acme Security" });
    expect(sessionReply.parse(read)).toEqual(read);
    expect(await isLive(admin.installed.env, secret)).toBe(false);
  });

  it("stores the password with scrypt as story 1.2 does, and the person then signs in with it (criterion 6)", async () => {
    const admin = await signedInAdmin("accept-hash");
    const secret = await invited(admin);
    expect((await accept(admin.installed.env, { secret })).status).toBe(200);
    const user = (await userRow(admin.installed, INVITEE))!;
    expect(user).toMatchObject({ password_algorithm: "scrypt", password_n: 131_072, password_r: 8, password_p: 1, password_key_length: 32 });
    expect(user.password_salt.length).toBeGreaterThan(0);
    expect(user.password_hash.length).toBeGreaterThan(0);
    const stored: PasswordHash = {
      algorithm: "scrypt",
      n: user.password_n,
      r: user.password_r,
      p: user.password_p,
      keyLength: user.password_key_length,
      salt: user.password_salt,
      hash: user.password_hash,
    };
    expect(await verifyPassword(normalisePassword(NEW_PASSWORD), stored)).toBe(true);
    const signin = await signIn(admin.installed.env, INVITEE, NEW_PASSWORD);
    expect(signin.status).toBe(200);
    expect(await signin.json()).toEqual({ name: INVITEE_NAME });
  });

  it("of an administrator invitation answers role administrator in the session read", async () => {
    const admin = await signedInAdmin("accept-admin");
    const secret = await invited(admin, INVITEE, "administrator");
    const response = await accept(admin.installed.env, { secret });
    expect(response.status).toBe(200);
    expect(await (await readSession(admin.installed.env, { cookies: jarFrom(response) })).json()).toMatchObject({ signedIn: true, role: "administrator" });
  });

  it("while signed in as the administrator ends that session and sets the new account's cookies (D-4)", async () => {
    const admin = await signedInAdmin("accept-signed-in");
    const secret = await invited(admin);
    const response = await accept(admin.installed.env, { secret }, { cookies: admin.cookies });
    expect(response.status).toBe(200);
    const jar = jarFrom(response, admin.cookies);
    const user = (await userRow(admin.installed, INVITEE))!;
    expect(await (await readSession(admin.installed.env, { cookies: jar })).json()).toMatchObject({ signedIn: true, accountId: user.id });
    // The cookie the browser presented before is no longer signed in.
    expect(await (await readSession(admin.installed.env, { cookies: admin.cookies })).json()).toMatchObject({ signedIn: false });
  });

  it("refuses a password breaking story 1.2's rules with field password, leaving the invitation live", async () => {
    const admin = await signedInAdmin("accept-rules");
    const secret = await invited(admin);
    for (const password of ["elevenchars", INVITEE.toUpperCase(), "Robin.New@Acme.Test"]) {
      const response = await accept(admin.installed.env, { secret, password });
      expect(response.status, password).toBe(400);
      expect(await refusalOf(response, [password, secret, INVITEE]), password).toMatchObject({ code: "invalid_input", field: "password" });
    }
    expect(admin.installed.calls.get("acceptInvitation")).toBeUndefined();
    expect(await isLive(admin.installed.env, secret)).toBe(true);
    expect(await userRow(admin.installed, INVITEE)).toBeUndefined();
  });

  for (const [what, options] of [
    ["another Origin", { origin: "https://evil.example.test" }],
    ["no app header", { header: null }],
  ] as const) {
    it(`with ${what} is refused origin_refused, leaving the invitation live (criterion 9)`, async () => {
      const admin = await signedInAdmin(`accept-origin-${what.replace(/\W/g, "")}`);
      const secret = await invited(admin);
      admin.installed.calls.clear();
      const response = await accept(admin.installed.env, { secret }, options);
      expect(response.status).toBe(403);
      expect((await refusalOf(response, [secret, NEW_PASSWORD])).code).toBe("origin_refused");
      expect(response.headers.getSetCookie()).toEqual([]);
      expect(admin.installed.calls.size).toBe(0);
      expect(await isLive(admin.installed.env, secret)).toBe(true);
    });
  }

  it("with a malformed secret answers invitation_unusable without an object call", async () => {
    const admin = await signedInAdmin("accept-malformed");
    admin.installed.calls.clear();
    const response = await accept(admin.installed.env, { secret: "abcdefghij" });
    expect(response.status).toBe(410);
    expect((await refusalOf(response, ["abcdefghij", NEW_PASSWORD])).code).toBe("invitation_unusable");
    expect(admin.installed.calls.size).toBe(0);
  });

  it("with a full hash queue answers 503 signin_busy with Retry-After 5, leaving the invitation live", async () => {
    const admin = await signedInAdmin("accept-busy");
    const secret = await invited(admin);
    admin.installed.calls.clear();
    const release = fillHashQueue();
    let response: Response;
    try {
      response = await accept(admin.installed.env, { secret });
    } finally {
      await release();
    }
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(await refusalOf(response, [secret, NEW_PASSWORD])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(admin.installed.calls.size).toBe(0);
    expect(await isLive(admin.installed.env, secret)).toBe(true);
  });

  it("aborted while waiting in the hash queue leaves the queue and answers signin_busy, leaving the invitation live", async () => {
    const admin = await signedInAdmin("accept-abort");
    const secret = await invited(admin);
    const release = holdHashSlot();
    const controller = new AbortController();
    let response: Response;
    try {
      const waitingBefore = hashQueue.stats().waiting;
      const headers = { "content-type": "application/json", origin: ORIGIN, [APP_HEADER]: APP_HEADER_VALUE };
      const pending = handleRequest(
        new Request(ORIGIN + ACCEPT_PATH, {
          method: "POST",
          headers,
          body: JSON.stringify({ secret, name: INVITEE_NAME, password: NEW_PASSWORD }),
          signal: controller.signal,
        }),
        admin.installed.env,
      );
      await until(() => hashQueue.stats().waiting === waitingBefore + 1, "the accept to wait in the hash queue");
      controller.abort();
      expect(hashQueue.stats().waiting).toBe(waitingBefore);
      response = await pending;
    } finally {
      await release();
    }
    expect(response.status).toBe(503);
    expect((await refusalOf(response, [secret, NEW_PASSWORD])).code).toBe("signin_busy");
    expect(admin.installed.calls.get("acceptInvitation")).toBeUndefined();
    expect(await isLive(admin.installed.env, secret)).toBe(true);
  });
});

describe("the route sweep (criterion 8)", { timeout: 300_000 }, () => {
  it("finds that only setup reaches createFirstAdministrator, only acceptInvite reaches acceptInvitation, and only they add users", async () => {
    type RouteId = keyof typeof ROUTES;
    // What the two-step routes need before they can answer 200 (story 1.5, spec 4): a started
    // set-up for the confirm, two-step verification on for turning off and fresh codes, and a
    // pending sign-in cookie for the second step. Made through the routes before the calls are counted.
    interface TwoStepPrepared {
      setupId: string;
      code: string;
      cookies?: Record<string, string>;
    }
    const prepare: Partial<Record<RouteId, (admin: Admin) => Promise<TwoStepPrepared>>> = {
      twoStepConfirm: async (admin) => {
        const started = await startedByRoutes(admin.installed.env, admin.cookies, ADMIN_PASSWORD);
        await awayFromStepEnd();
        return { setupId: started.setupId, code: await totpAt(started.secret, stepAt(Date.now())) };
      },
      twoStepTurnOff: async (admin) => {
        await turnedOnByRoutes(admin.installed.env, admin.cookies, ADMIN_PASSWORD);
        return { setupId: "", code: "" };
      },
      twoStepRecoveryCodes: async (admin) => {
        const on = await turnedOnByRoutes(admin.installed.env, admin.cookies, ADMIN_PASSWORD);
        return { setupId: "", code: await on.codes.next() };
      },
      secondStep: async (admin) => {
        const on = await turnedOnByRoutes(admin.installed.env, admin.cookies, ADMIN_PASSWORD);
        const pending = await signIn(admin.installed.env, ADMIN_EMAIL, ADMIN_PASSWORD, { cookies: admin.cookies });
        expect(pending.status).toBe(200);
        return { setupId: "", code: await on.codes.next(), cookies: jarFrom(pending, admin.cookies) };
      },
    };
    const none: TwoStepPrepared = { setupId: "", code: "" };

    // Valid input for every declared route; a route added without one is a type error.
    const inputs: Record<RouteId, (secret: string, installed: Installed, two: TwoStepPrepared) => unknown> = {
      status: () => ({}),
      setupState: () => ({}),
      setup: (_secret, installed) => ({
        code: installed.setupCode,
        installationName: "Acme Security",
        name: "Dana Admin",
        email: "sweep-admin@acme.test",
        password: ADMIN_PASSWORD,
      }),
      session: () => ({}),
      signIn: () => ({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      signOut: () => ({}),
      invite: () => ({ email: "sweep-new@acme.test", name: INVITEE_NAME, role: "standard" }),
      invitationRead: (secret) => ({ secret }),
      acceptInvite: (secret) => ({ secret, name: INVITEE_NAME, password: NEW_PASSWORD }),
      secondStep: (_secret, _installed, two) => ({ method: "code", code: two.code }),
      twoStepState: () => ({}),
      twoStepStart: () => ({ password: ADMIN_PASSWORD }),
      twoStepConfirm: (_secret, _installed, two) => ({ setupId: two.setupId, code: two.code }),
      twoStepTurnOff: () => ({ password: ADMIN_PASSWORD }),
      twoStepRecoveryCodes: (_secret, _installed, two) => ({ password: ADMIN_PASSWORD, code: two.code }),
      deploymentKeyState: () => ({}),
    };

    const reached: Record<string, string[]> = {};
    const usersAdded: Record<string, number> = {};
    for (const route of ROUTE_LIST) {
      const id = route.id as RouteId;
      let installed: Installed;
      let cookies: Record<string, string> = {};
      let secret = "";
      let two = none;
      if (id === "setup") {
        installed = installationFor(`inv-sweep-${id}`);
      } else {
        const admin = await signedInAdmin(`sweep-${id}`);
        installed = admin.installed;
        cookies = route.readsSessionCookie ? admin.cookies : {};
        secret = await invited(admin);
        const preparation = prepare[id];
        if (preparation) {
          two = await preparation(admin);
          if (two.cookies) cookies = two.cookies;
        }
      }
      const before = await countRows(installed, USERS_TABLE);
      installed.calls.clear();
      const input = inputs[id](secret, installed, two);
      const response =
        route.method === "GET"
          ? await get(installed.env, route.path, { cookies })
          : await post(installed.env, route.path, input, { cookies });
      expect(response.status, `${id}: ${await response.clone().text()}`).toBe(200);
      reached[id] = [...installed.calls.keys()].sort();
      usersAdded[id] = (await countRows(installed, USERS_TABLE)) - before;
    }

    const reaching = (operation: string) => Object.keys(reached).filter((id) => reached[id]!.includes(operation));
    expect(reaching("createFirstAdministrator")).toEqual(["setup"]);
    expect(reaching("acceptInvitation")).toEqual(["acceptInvite"]);
    expect(reaching("createInvitation")).toEqual(["invite"]);
    expect(Object.keys(usersAdded).filter((id) => usersAdded[id] !== 0).sort()).toEqual(["acceptInvite", "setup"]);
    expect(Object.keys(reached).sort()).toEqual(Object.keys(ROUTES).sort());
  });
});

describe("the logs (criterion 7, building block)", { timeout: 120_000 }, () => {
  it("hold no secret, password or hash over invite, read, refused accepts and accept", async () => {
    const lines: string[] = [];
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const saved = methods.map((method) => console[method]);
    for (const method of methods) {
      console[method] = (...args: unknown[]) => {
        lines.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg) ?? String(arg))).join(" "));
      };
    }
    let secret = "";
    let acceptedCookies: string[] = [];
    let admin: Admin;
    try {
      admin = await signedInAdmin("logs");
      secret = await invited(admin);
      expect((await readInvitation(admin.installed.env, secret)).status).toBe(200);
      expect((await accept(admin.installed.env, { secret }, { origin: "https://evil.example.test" })).status).toBe(403);
      expect((await accept(admin.installed.env, { secret, password: INVITEE.toUpperCase() })).status).toBe(400);
      const accepted = await accept(admin.installed.env, { secret }, { cookies: admin.cookies });
      expect(accepted.status).toBe(200);
      acceptedCookies = setCookiesOf(accepted).map((cookie) => cookie.value);
      expect(acceptedCookies).toHaveLength(2);
      expect((await accept(admin.installed.env, { secret })).status).toBe(410);
      expect((await signOut(admin.installed.env, { cookies: admin.cookies })).status).toBe(200);
    } finally {
      methods.forEach((method, index) => (console[method] = saved[index]!));
    }
    const user = (await userRow(admin.installed, INVITEE))!;
    const forbidden = [secret, await sha256Hex(secret), NEW_PASSWORD, INVITEE.toUpperCase(), ADMIN_PASSWORD, user.password_hash, user.password_salt,
      // The session token and marker the accept reply set, and the administrator's cookie values.
      ...acceptedCookies, ...Object.values(admin.cookies)];
    for (const value of forbidden) {
      expect(value.length).toBeGreaterThan(0);
      for (const line of lines) expect(line).not.toContain(value);
    }
  });
});

describe("the invitation page", () => {
  const html = '<!doctype html><div id="root"></div>';
  const stubs: [string, (path: string) => Response][] = [
    // Cloudflare's assets service with single-page-application handling answers index.html directly.
    ["an SPA-style ASSETS service", () => new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })],
    // A disk service answers 404 for /invite, then index.html, as application/octet-stream.
    [
      "a disk-style ASSETS service",
      (path) =>
        path === "/index.html"
          ? new Response(html, { status: 200, headers: { "content-type": "application/octet-stream" } })
          : new Response("missing", { status: 404 }),
    ],
  ];

  for (const [what, answer] of stubs) {
    it(`is served with Referrer-Policy: no-referrer at /invite and /invite/ from ${what}, and / is not (D-2)`, async () => {
      const fakeEnv = {
        ...env,
        ASSETS: { fetch: async (input: Request | string) => answer(new URL(typeof input === "string" ? input : input.url).pathname) },
      } as unknown as Env;
      for (const path of ["/invite", "/invite/"]) {
        const response = await handleRequest(new Request(ORIGIN + path, { headers: { accept: "text/html" } }), fakeEnv);
        expect(response.status, path).toBe(200);
        expect(response.headers.get("content-type"), path).toMatch(/^text\/html/);
        expect(await response.text(), path).toContain('<div id="root">');
        expect(response.headers.get("referrer-policy"), path).toBe("no-referrer");
      }
      for (const path of ["/", "/invite/other", "/inviter"]) {
        const response = await handleRequest(new Request(ORIGIN + path, { headers: { accept: "text/html" } }), fakeEnv);
        await response.arrayBuffer();
        expect(response.headers.get("referrer-policy"), path).toBeNull();
      }
    });
  }

  it("applies the invitation policy to a cached page response without changing its status or ETag", async () => {
    const fakeEnv = {
      ...env,
      ASSETS: {
        fetch: async () => new Response(null, {
          status: 304,
          headers: { etag: '"invitation-page"', "referrer-policy": "same-origin" },
        }),
      },
    } as unknown as Env;
    for (const [path, policy] of [["/invite?source=email", "no-referrer"], ["/invite-preview", "same-origin"]]) {
      const response = await handleRequest(new Request(ORIGIN + path, {
        headers: { accept: "text/html", "if-none-match": '"invitation-page"' },
      }), fakeEnv);
      expect(response.status, path).toBe(304);
      expect(response.body, path).toBeNull();
      expect(response.headers.get("etag"), path).toBe('"invitation-page"');
      expect(response.headers.get("referrer-policy"), path).toBe(policy);
    }
  });

  it("keeps the header on the HTTPS redirect of a plain HTTP request on Cloudflare", async () => {
    const request = new Request("http://survey.acme.test/invite", { headers: { accept: "text/html" }, cf: { tlsVersion: "" } } as RequestInit);
    const response = await handleRequest(request, env as unknown as Env);
    expect(response.status).toBe(308);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
