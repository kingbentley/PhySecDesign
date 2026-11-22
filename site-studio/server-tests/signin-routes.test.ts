import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { REFUSALS } from "../shared/refusal";
import { APP_HEADER, APP_HEADER_VALUE, ROUTES, sessionReply, signInReply, signOutReply } from "../shared/routes";
import { handleRequest } from "../server/index";
import { normalisePassword } from "../shared/setup";
import { MARKER_MAX_AGE_SECONDS, SESSION_MAX_AGE_SECONDS } from "../shared/signin";
import { HASH_QUEUE_MAX_WAITING, hashPassword, hashQueue, type PasswordHash } from "../server/auth/password";
import { markerCookieName } from "../server/auth/marker";
import { newSessionToken, sessionCookieName, sessionTokenHash } from "../server/auth/session";
import { HSTS_HEADER, HSTS_VALUE } from "../server/httpsRedirect";
import type { Env } from "../server/env";
import type { Installation } from "../server/installation/Installation";
import { SESSIONS_TABLE, SIGNIN_TABLES } from "../server/installation/signInStore";
import {
  completeSetup,
  installationFor,
  jarFrom,
  ORIGIN,
  post,
  readSession,
  refusalOf,
  seedAccount,
  SETUP_PATH,
  SIGN_IN_PATH,
  setCookiesOf,
  signedIn,
  signIn,
  signOut,
  wholeReply,
  type Installed,
  type ParsedCookie,
} from "./signin-helpers";

// The sign-in routes (story 1.3, spec 2): the public session read, sign-in and sign-out, with their
// cookies, refusals and the origin rule (CAP-1 server side, CAP-2, CAP-3 cookie side, CAP-5,
// CAP-7 and CAP-8 through the routes, CAP-9, CAP-10 local). Each test has its own installation
// object. Every refusal is checked for the entered email, password, token and marker.

const PASSWORD = "correct horse battery staple";
const WRONG = "not the right password at all";
const EMAIL = "dana@acme.test";

/** One real hash of PASSWORD, made once and copied into seeded accounts. */
let hash: PasswordHash;

beforeAll(async () => {
  hash = await hashPassword(normalisePassword(PASSWORD));
});

async function seeded(name: string, wrap?: Parameters<typeof installationFor>[1]): Promise<Installed> {
  const installed = installationFor(name, wrap);
  await seedAccount(installed.stub, { email: EMAIL, hash });
  return installed;
}

function identifierOf(installed: Installed): Promise<string> {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.identifier());
}

function countsOf(installed: Installed) {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.counts());
}

function sessionsOf(installed: Installed) {
  return runInDurableObject(installed.stub, (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${SESSIONS_TABLE} ORDER BY token_hash`).toArray());
}

function expectSessionCookie(cookie: ParsedCookie | undefined, identifier: string) {
  expect(cookie?.name).toBe(sessionCookieName(identifier));
  expect(cookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(cookie?.attributes).toEqual({ httponly: true, secure: true, samesite: "Lax", path: "/", "max-age": String(SESSION_MAX_AGE_SECONDS) });
}

function expectMarkerCookie(cookie: ParsedCookie | undefined, identifier: string) {
  expect(cookie?.name).toBe(markerCookieName(identifier));
  expect(cookie?.value).toMatch(/^v1\./);
  expect(cookie?.attributes).toEqual({ httponly: true, secure: true, samesite: "Lax", path: "/", "max-age": String(MARKER_MAX_AGE_SECONDS) });
}

/** The one clearing line of this installation's session cookie, with its full attributes (E-15). */
function expectClearsSession(response: Response, identifier: string) {
  const cookies = setCookiesOf(response);
  expect(cookies).toHaveLength(1);
  expect(cookies[0]!.name).toBe(sessionCookieName(identifier));
  expect(cookies[0]!.value).toBe("");
  expect(cookies[0]!.attributes).toEqual({ "max-age": "0", path: "/", secure: true, httponly: true, samesite: "Lax" });
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

describe("GET /api/v1/session", { timeout: 60_000 }, () => {
  it("is a public read: no origin rule, and it reads the session cookie", () => {
    expect(ROUTES.session.method).toBe("GET");
    expect(ROUTES.session.appOriginOnly).toBeUndefined();
    expect(ROUTES.session.readsSessionCookie).toBe(true);
  });

  it("while set-up is open answers not signed in with no installation name (E-11)", async () => {
    const { env: target } = installationFor("read-setup-open");
    const response = await readSession(target);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.json()).toEqual({ signedIn: false, installationName: null });
  });

  it("with no cookie once an administrator exists answers not signed in with the installation's name", async () => {
    const installed = installationFor("read-signed-out");
    await completeSetup(installed, { email: EMAIL, password: PASSWORD });
    const response = await readSession(installed.env);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.json()).toEqual({ signedIn: false, installationName: "Acme Security" });
  });

  it("with a valid cookie answers signed in, the name and the installation's name, never the token", async () => {
    const installed = await seeded("read-signed-in");
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    const response = await readSession(installed.env, { cookies });
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([]);
    const text = await response.text();
    for (const value of Object.values(cookies)) expect(text).not.toContain(value);
    const body = JSON.parse(text);
    const userId = (await runInDurableObject(installed.stub, (_i, state) => state.storage.sql.exec<{ id: string }>("SELECT id FROM users").one())).id;
    expect(body).toEqual({ signedIn: true, name: "Dana Admin", accountId: userId, role: "administrator", installationName: "Acme Security" });
    expect(sessionReply.parse(body)).toEqual(body);
  });

  it("writes nothing: last use and every sign-in table are unchanged after reads (D-4 amended)", async () => {
    const installed = await seeded("read-only");
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    const everything = () =>
      runInDurableObject(installed.stub, (_instance, state) => SIGNIN_TABLES.map((table) => state.storage.sql.exec(`SELECT * FROM ${table} ORDER BY 1`).toArray()));
    const before = await everything();
    const lastUse = (await sessionsOf(installed))[0]!.last_used_at;
    for (let index = 0; index < 3; index += 1) expect((await readSession(installed.env, { cookies })).status).toBe(200);
    expect(await everything()).toEqual(before);
    expect((await sessionsOf(installed))[0]!.last_used_at).toBe(lastUse);
  });

  it("answers a dead cookie under this installation's own name as not signed in and clears it (D-7 amended, A-2, E-5)", async () => {
    const installed = await seeded("read-dead");
    const other = await seeded("read-dead-other");
    const identifier = await identifierOf(installed);
    const own = sessionCookieName(identifier);
    const userId = (await runInDurableObject(installed.stub, (_i, state) => state.storage.sql.exec<{ id: string }>("SELECT id FROM users").one())).id;

    // An expired session: its row is still there, 30 days after its sign-in.
    const expired = newSessionToken();
    const now = Date.now();
    await runInDurableObject(installed.stub, async (_instance, state) => {
      state.storage.sql.exec(
        `INSERT INTO ${SESSIONS_TABLE} (token_hash, user_id, signed_in_at, last_used_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
        await sessionTokenHash(expired),
        userId,
        now - SESSION_MAX_AGE_SECONDS * 1000,
        now - SESSION_MAX_AGE_SECONDS * 1000,
        now,
      );
    });
    // Another installation's live token presented under this installation's name.
    const otherCookies = await signedIn(other.env, EMAIL, PASSWORD);
    const otherToken = otherCookies[sessionCookieName(await identifierOf(other))]!;

    for (const [label, value] of [
      ["expired", expired],
      ["unknown", newSessionToken()],
      ["another installation's token", otherToken],
      ["malformed", "not-a-token"],
      ["empty", ""],
    ] as const) {
      const response = await readSession(installed.env, { cookies: { [own]: value } });
      expect(response.status, label).toBe(200);
      expectClearsSession(response, identifier);
      expect(await response.json(), label).toEqual({ signedIn: false, installationName: "Acme Security" });
    }
    // The other installation's session is untouched.
    expect(await (await readSession(other.env, { cookies: otherCookies })).json()).toMatchObject({ signedIn: true });
  });

  it("ignores a cookie named with another installation's identifier and never clears it (criterion 17, CAP-10)", async () => {
    const installed = await seeded("read-foreign-name");
    const foreign = sessionCookieName("f".repeat(32));
    const foreignMarker = markerCookieName("f".repeat(32));
    const alone = await readSession(installed.env, { cookies: { [foreign]: newSessionToken(), [foreignMarker]: "v1.x" } });
    expect(alone.headers.getSetCookie()).toEqual([]);
    expect(await alone.json()).toEqual({ signedIn: false, installationName: "Acme Security" });

    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    const both = await readSession(installed.env, { cookies: { [foreign]: newSessionToken(), ...cookies } });
    expect(both.headers.getSetCookie()).toEqual([]);
    expect(await both.json()).toMatchObject({ signedIn: true });

    // A dead own cookie beside the foreign one: only the own name is cleared.
    const identifier = await identifierOf(installed);
    const dead = await readSession(installed.env, { cookies: { [foreign]: newSessionToken(), [sessionCookieName(identifier)]: newSessionToken() } });
    expectClearsSession(dead, identifier);
  });
});

describe("POST /api/v1/session/sign-in", { timeout: 120_000 }, () => {
  it("signs the set-up administrator in: the declared reply, and session and marker as two Set-Cookie lines after the HSTS copy", async () => {
    const installed = installationFor("signin-setup-admin");
    await completeSetup(installed, { email: EMAIL, password: PASSWORD });
    const identifier = await identifierOf(installed);
    const response = await signIn(installed.env, EMAIL, PASSWORD, { https: true });
    expect(response.status).toBe(200);
    expect(response.headers.get(HSTS_HEADER)).toBe(HSTS_VALUE);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const cookies = setCookiesOf(response);
    expect(cookies).toHaveLength(2);
    expectSessionCookie(cookies[0], identifier);
    expectMarkerCookie(cookies[1], identifier);
    for (const cookie of cookies) expect(cookie.line.toLowerCase()).not.toContain("domain");

    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ name: "Dana Admin" });
    expect(signInReply.parse(JSON.parse(text))).toEqual(JSON.parse(text));
    for (const cookie of cookies) expect(text).not.toContain(cookie.value);

    // Storage holds the token's hash only.
    const sessions = await sessionsOf(installed);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.token_hash).toBe(await sessionTokenHash(cookies[0]!.value));
    expect(JSON.stringify(sessions)).not.toContain(cookies[0]!.value);
  });

  it("accepts the email in another case with spaces and the password in another Unicode form (V-9)", async () => {
    const installed = installationFor("signin-normalised");
    const composed = "café crème brûlée";
    await completeSetup(installed, { email: "Dana@Acme.test", password: composed });
    await signedIn(installed.env, "  DANA@acme.TEST ", composed.normalize("NFD"));
  });

  it("signs in with a 128-emoji password and with an NFKC-shrinking password set at set-up (A-10, E-10)", async () => {
    const emoji = "\u{1F600}".repeat(128);
    expect(emoji.length).toBe(256);
    // 128 Hangul syllables typed as 384 decomposed jamo: NFKC composes them back to 128.
    const hangul = "한".repeat(128);
    expect(normalisePassword(hangul).length).toBe(128);
    for (const [label, password] of [["emoji", emoji], ["hangul", hangul]] as const) {
      const installed = installationFor(`signin-long-${label}`);
      await completeSetup(installed, { email: EMAIL, password });
      await signedIn(installed.env, EMAIL, password);
    }
  });

  it("gives one identical refusal for a wrong password, an unknown email, an inactive account and a ticket fault (D-5 amended)", async () => {
    let breakTicket = false;
    const installed = await seeded("signin-identical", async (operation, init, send) => {
      if (operation === "completeSignIn" && breakTicket) {
        const body = JSON.parse(String(init?.body));
        return send({ ...init, body: JSON.stringify({ ...body, ticket: "a".repeat(64) }) });
      }
      return send();
    });
    await seedAccount(installed.stub, { email: "gone@acme.test", hash, name: "Gone Person", active: 0 });

    const replies = [];
    for (const [email, password] of [
      [EMAIL, WRONG],
      ["nobody@acme.test", PASSWORD],
      ["gone@acme.test", PASSWORD],
    ] as const) {
      const response = await signIn(installed.env, email, password);
      await refusalOf(response.clone(), [email, password]);
      replies.push(await wholeReply(response));
    }
    breakTicket = true;
    const faulted = await signIn(installed.env, EMAIL, PASSWORD);
    await refusalOf(faulted.clone(), [EMAIL, PASSWORD]);
    replies.push(await wholeReply(faulted));

    expect(replies[0]!.status).toBe(401);
    expect(JSON.parse(replies[0]!.body)).toEqual({ error: { code: "signin_failed", message: "That email and password do not match." } });
    expect(replies[0]!.headers.some(([name]) => name === "set-cookie" || name === "retry-after")).toBe(false);
    for (const reply of replies.slice(1)) expect(reply).toEqual(replies[0]);
    expect(await sessionsOf(installed)).toEqual([]);
  });

  it("does not match an email that differs from the stored one only in Unicode normalisation: the stand-in path (D-15, E-18)", async () => {
    const standIns: boolean[] = [];
    const installed = installationFor("signin-email-form", async (operation, _init, send) => {
      const response = await send();
      if (operation === "signInAttempt" && response.ok) standIns.push(((await response.clone().json()) as { value: { standIn: boolean } }).value.standIn);
      return response;
    });
    await seedAccount(installed.stub, { email: "josé@acme.test", hash });
    const response = await signIn(installed.env, "josé@acme.test", PASSWORD);
    expect(response.status).toBe(401);
    expect((await refusalOf(response, ["josé@acme.test", PASSWORD])).code).toBe("signin_failed");
    await signedIn(installed.env, "JOSÉ@acme.test", PASSWORD);
    expect(standIns).toEqual([true, false]);
  });

  it("makes an email wait after 5 failures with Retry-After equal to the body's seconds, the same for an unknown email (D-2, A-19)", async () => {
    const installed = await seeded("signin-wait");
    const waits = [];
    for (const email of [EMAIL, "nobody@acme.test"]) {
      for (let index = 0; index < 5; index += 1) expect((await signIn(installed.env, email, WRONG)).status).toBe(401);
      const before = await countsOf(installed);
      // Even the right password waits, and the attempt is not counted.
      const response = await signIn(installed.env, email, PASSWORD);
      expect(response.status).toBe(429);
      const error = await refusalOf(response.clone(), [email, PASSWORD, WRONG]);
      expect(error.code).toBe("signin_wait");
      expect(error.message).toBe("Too many attempts. Wait before trying again.");
      expect(error.retryAfterSeconds).toBeGreaterThan(55);
      expect(error.retryAfterSeconds).toBeLessThanOrEqual(60);
      expect(response.headers.get("retry-after")).toBe(String(error.retryAfterSeconds));
      expect(await countsOf(installed)).toEqual(before);
      waits.push({ status: response.status, code: error.code, message: error.message, headers: [...response.headers.keys()].sort() });
    }
    expect(waits[1]).toEqual(waits[0]);
  });

  it("refuses as busy before counting when 20 wait in the hash queue, the same for every email, with Retry-After: 5 (D-5 amended)", async () => {
    const installed = await seeded("signin-busy");
    const release = fillHashQueue();
    let replies;
    try {
      replies = [];
      for (const email of [EMAIL, "nobody@acme.test"]) {
        const response = await signIn(installed.env, email, PASSWORD);
        await refusalOf(response.clone(), [email, PASSWORD]);
        replies.push(await wholeReply(response));
      }
    } finally {
      await release();
    }
    expect(replies[0]!.status).toBe(503);
    expect(JSON.parse(replies[0]!.body)).toEqual({ error: { code: "signin_busy", message: REFUSALS.signin_busy.message } });
    expect(replies[0]!.headers).toContainEqual(["retry-after", "5"]);
    expect(replies[1]).toEqual(replies[0]);
    expect(installed.calls.get("signInAttempt")).toBeUndefined();
    const counts = await countsOf(installed);
    expect([counts.byEmail, counts.byAddress, counts.tickets]).toEqual([[], [], 0]);
  });

  it("answers signin_busy when the queue fills after counting, leaving the count raised (D-5 amended)", async () => {
    let release: (() => Promise<void>) | null = null;
    const installed = await seeded("signin-busy-race", async (operation, _init, send) => {
      const response = await send();
      if (operation === "signInAttempt" && release === null) release = fillHashQueue();
      return response;
    });
    let response: Response;
    try {
      response = await signIn(installed.env, EMAIL, PASSWORD);
    } finally {
      if (release) await (release as () => Promise<void>)();
    }
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await refusalOf(response, [EMAIL, PASSWORD])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
    expect(installed.calls.get("signInAttempt")).toBe(1);
    expect(installed.calls.get("completeSignIn")).toBeUndefined();
    expect((await countsOf(installed)).byEmail.map((row) => row.failures)).toEqual([1]);
    expect(await sessionsOf(installed)).toEqual([]);
  });

  it("while set-up is open refuses with the one message, no cookie and no session (E-11)", async () => {
    const installed = installationFor("signin-setup-open");
    const response = await signIn(installed.env, EMAIL, PASSWORD);
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await refusalOf(response, [EMAIL, PASSWORD])).toEqual({ code: "signin_failed", message: REFUSALS.signin_failed.message });
    expect(await sessionsOf(installed)).toEqual([]);
  });

  it("imposes no address wait on the unknown address: 20 failures over different emails, then a marker holder signs in (D-11, E-2)", async () => {
    const installed = await seeded("signin-unknown-address");
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    for (let index = 0; index < 20; index += 1) expect((await signIn(installed.env, `person${index}@acme.test`, WRONG)).status).toBe(401);
    expect((await countsOf(installed)).byAddress).toEqual([]);
    await signedIn(installed.env, EMAIL, PASSWORD, { cookies });
  });

  it("refuses bad input naming the field, without counting it", async () => {
    const installed = await seeded("signin-bad-input");
    const longEmail = "a".repeat(255 - "@acme.test".length) + "@acme.test";
    const cases: [Record<string, unknown>, string][] = [
      [{ password: PASSWORD }, "email"],
      [{ email: "", password: PASSWORD }, "email"],
      [{ email: "   ", password: PASSWORD }, "email"],
      [{ email: EMAIL }, "password"],
      [{ email: EMAIL, password: "" }, "password"],
      [{ email: longEmail, password: PASSWORD }, "email"],
      [{ email: EMAIL, password: "x".repeat(1025) }, "password"],
    ];
    for (const [body, field] of cases) {
      const response = await post(installed.env, "/api/v1/session/sign-in", body);
      expect(response.status, JSON.stringify(body).slice(0, 80)).toBe(400);
      const error = await refusalOf(response, [PASSWORD, longEmail, "x".repeat(1025)]);
      expect(error).toEqual({ code: "invalid_input", message: REFUSALS.invalid_input.message, field });
    }
    expect(installed.calls.get("signInAttempt")).toBeUndefined();
    // At the bounds the input is accepted and takes the one-message path.
    for (const body of [
      { email: "a".repeat(254 - "@acme.test".length) + "@acme.test", password: PASSWORD },
      { email: EMAIL, password: "x".repeat(1024) },
    ]) {
      expect((await post(installed.env, "/api/v1/session/sign-in", body)).status).toBe(401);
    }
  });

  it("refuses another origin or a missing header before the body is read (CAP-9)", async () => {
    const installed = await seeded("signin-origin");
    const cases: { origin: string | null; header: string | null }[] = [
      { origin: null, header: APP_HEADER_VALUE },
      { origin: "https://evil.example", header: APP_HEADER_VALUE },
      { origin: "http://survey.acme.test", header: APP_HEADER_VALUE },
      { origin: "null", header: APP_HEADER_VALUE },
      { origin: ORIGIN, header: null },
      { origin: ORIGIN, header: "0" },
    ];
    for (const options of cases) {
      for (const path of ["/api/v1/session/sign-in", "/api/v1/session/sign-out"]) {
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (options.origin !== null) headers.origin = options.origin;
        if (options.header !== null) headers[APP_HEADER] = options.header;
        const request = new Request(ORIGIN + path, { method: "POST", headers, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
        const response = await handleRequest(request, installed.env);
        expect(response.status, `${path} ${JSON.stringify(options)}`).toBe(403);
        expect(request.bodyUsed).toBe(false);
        expect(response.headers.getSetCookie()).toEqual([]);
        expect(await refusalOf(response, [EMAIL, PASSWORD])).toEqual({ code: "origin_refused", message: REFUSALS.origin_refused.message });
      }
    }
    expect(installed.calls.size).toBe(0);
  });

  it("signing in while carrying session X issues a new token Y; X then reads as not signed in and is cleared (V-8)", async () => {
    const installed = await seeded("signin-carrying");
    const identifier = await identifierOf(installed);
    const name = sessionCookieName(identifier);
    const first = await signedIn(installed.env, EMAIL, PASSWORD);
    const second = await signedIn(installed.env, EMAIL, PASSWORD, { cookies: first });
    expect(second[name]).not.toBe(first[name]);
    const old = await readSession(installed.env, { cookies: { [name]: first[name]! } });
    expectClearsSession(old, identifier);
    expect(await old.json()).toEqual({ signedIn: false, installationName: "Acme Security" });
    expect(await (await readSession(installed.env, { cookies: second })).json()).toMatchObject({ signedIn: true });
    expect(await sessionsOf(installed)).toHaveLength(1);
  });

  it("renews the marker at a second sign-in with a later expiry (V-1)", async () => {
    const installed = await seeded("signin-marker-renewed");
    const marker = markerCookieName(await identifierOf(installed));
    const first = await signedIn(installed.env, EMAIL, PASSWORD);
    const second = await signedIn(installed.env, EMAIL, PASSWORD, { cookies: first });
    const expiry = (value: string) => Number(value.split(".")[3]);
    expect(expiry(second[marker]!)).toBeGreaterThan(expiry(first[marker]!));
  });

  it("lets the marker holder sign in from address Q while the email is locked from address P (CA-44)", async () => {
    const installed = await seeded("signin-marker-exempts");
    const q = "192.0.2.50";
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD, { address: q });
    for (let index = 0; index < 5; index += 1) expect((await signIn(installed.env, EMAIL, WRONG, { address: "203.0.113.66" })).status).toBe(401);
    // Without the marker the email waits, from Q too.
    const locked = await signIn(installed.env, EMAIL, PASSWORD, { address: q });
    expect(locked.status).toBe(429);
    await refusalOf(locked, [EMAIL, PASSWORD]);
    await signedIn(installed.env, EMAIL, PASSWORD, { address: q, cookies });
  });

  it("of 25 wrong attempts for one email sent at once, with no cookies, checks at most 5 and gives 20 the wait (A-6)", async () => {
    const installed = await seeded("signin-at-once");
    const responses = await Promise.all(Array.from({ length: 25 }, () => signIn(installed.env, EMAIL, WRONG)));
    const statuses = responses.map((response) => response.status);
    expect(statuses.filter((status) => status === 401)).toHaveLength(5);
    expect(statuses.filter((status) => status === 429)).toHaveLength(20);
    expect(installed.calls.get("completeSignIn")).toBe(5);
    for (const response of responses) await refusalOf(response, [EMAIL, WRONG]);
  });
});

describe("POST /api/v1/setup with a full hash queue", { timeout: 60_000 }, () => {
  it("answers signin_busy with Retry-After: 5, as sign-in does (deferred from spec 1)", async () => {
    const installed = installationFor("setup-busy");
    const release = fillHashQueue();
    let response: Response;
    try {
      response = await post(installed.env, SETUP_PATH, {
        code: installed.setupCode,
        installationName: "Acme Security",
        name: "Dana Admin",
        email: EMAIL,
        password: PASSWORD,
      });
    } finally {
      await release();
    }
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(await refusalOf(response, [installed.setupCode, PASSWORD, EMAIL])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
    // Refused before counting: no set-up attempt was used up.
    expect(installed.calls.get("setupAttempt")).toBeUndefined();
    // No administrator was created, so set-up is still open and works once the queue has room.
    await completeSetup(installed, { email: EMAIL, password: PASSWORD });
  });

  it("answers signin_busy when the queue fills after the attempt is counted, leaving it counted (story 1.3 code review)", async () => {
    let release: (() => Promise<void>) | null = null;
    const installed = installationFor("setup-busy-race", async (operation, _init, send) => {
      const response = await send();
      if (operation === "setupAttempt" && release === null) release = fillHashQueue();
      return response;
    });
    let response: Response;
    try {
      response = await post(installed.env, SETUP_PATH, setupBody(installed));
    } finally {
      if (release) await (release as () => Promise<void>)();
    }
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(await refusalOf(response, [installed.setupCode, PASSWORD, EMAIL])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
    expect(installed.calls.get("setupAttempt")).toBe(1);
    expect(installed.calls.get("createFirstAdministrator")).toBeUndefined();
    await completeSetup(installed, { email: EMAIL, password: PASSWORD });
  });
});

function setupBody(installed: Installed) {
  return { code: installed.setupCode, installationName: "Acme Security", name: "Dana Admin", email: EMAIL, password: PASSWORD };
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

/** A POST from the app whose signal the test can abort, as a client disconnecting does. */
function abortablePost(target: Env, path: string, body: unknown, signal: AbortSignal): Promise<Response> {
  const headers = { "content-type": "application/json", origin: ORIGIN, [APP_HEADER]: APP_HEADER_VALUE };
  return handleRequest(new Request(ORIGIN + path, { method: "POST", headers, body: JSON.stringify(body), signal }), target);
}

describe("a request whose client goes away while it waits for the hash queue (enable_request_signal)", { timeout: 60_000 }, () => {
  for (const kind of ["sign-in", "set-up"] as const) {
    it(`${kind}: leaves the queue without hashing and answers quietly, the attempt staying counted`, async () => {
      const installed = kind === "sign-in" ? await seeded("abort-signin") : installationFor("abort-setup");
      const release = holdHashSlot();
      const controller = new AbortController();
      let response: Response;
      try {
        const waitingBefore = hashQueue.stats().waiting;
        const pending =
          kind === "sign-in"
            ? abortablePost(installed.env, SIGN_IN_PATH, { email: EMAIL, password: PASSWORD }, controller.signal)
            : abortablePost(installed.env, SETUP_PATH, setupBody(installed), controller.signal);
        await until(() => hashQueue.stats().waiting === waitingBefore + 1, "the request to wait in the hash queue");
        controller.abort();
        expect(hashQueue.stats().waiting).toBe(waitingBefore);
        response = await pending;
      } finally {
        await release();
      }
      expect(response.status).toBe(503);
      expect(response.headers.getSetCookie()).toEqual([]);
      expect(await refusalOf(response, [installed.setupCode, PASSWORD, EMAIL])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
      if (kind === "sign-in") {
        expect(installed.calls.get("signInAttempt")).toBe(1);
        expect(installed.calls.get("completeSignIn")).toBeUndefined();
        expect((await countsOf(installed)).byEmail.map((row) => row.failures)).toEqual([1]);
        expect(await sessionsOf(installed)).toEqual([]);
      } else {
        expect(installed.calls.get("setupAttempt")).toBe(1);
        expect(installed.calls.get("createFirstAdministrator")).toBeUndefined();
        await completeSetup(installed, { email: EMAIL, password: PASSWORD });
      }
    });
  }
});

describe("POST /api/v1/session/sign-out", { timeout: 60_000 }, () => {
  it("ends the session, clears the cookie with its full attributes and sends no marker cookie (CAP-5, D-3)", async () => {
    const installed = await seeded("signout");
    const identifier = await identifierOf(installed);
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    expect(await sessionsOf(installed)).toHaveLength(1);
    const response = await signOut(installed.env, { cookies, https: true });
    expect(response.status).toBe(200);
    expect(response.headers.get(HSTS_HEADER)).toBe(HSTS_VALUE);
    const body = await response.json();
    expect(body).toEqual({ signedIn: false });
    expect(signOutReply.parse(body)).toEqual(body);
    expectClearsSession(response, identifier);
    expect(response.headers.getSetCookie().some((line) => line.startsWith(markerCookieName(identifier)))).toBe(false);
    expect(await sessionsOf(installed)).toEqual([]);
  });

  it("after sign-out, the exact old cookie gets not signed in and a clearing cookie on the read and on sign-out (V-5)", async () => {
    const installed = await seeded("signout-replay");
    const identifier = await identifierOf(installed);
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    expect((await signOut(installed.env, { cookies })).status).toBe(200);

    const read = await readSession(installed.env, { cookies });
    expect(read.status).toBe(200);
    expectClearsSession(read, identifier);
    expect(await read.json()).toEqual({ signedIn: false, installationName: "Acme Security" });

    const again = await signOut(installed.env, { cookies });
    expect(again.status).toBe(200);
    expectClearsSession(again, identifier);
    expect(await again.json()).toEqual({ signedIn: false });
    expect(await sessionsOf(installed)).toEqual([]);
  });

  it("succeeds and clears the session cookie with an ended, malformed or no cookie (D-13)", async () => {
    const installed = await seeded("signout-no-session");
    const identifier = await identifierOf(installed);
    for (const cookies of [{}, { [sessionCookieName(identifier)]: newSessionToken() }, { [sessionCookieName(identifier)]: "junk" }]) {
      const response = await signOut(installed.env, { cookies });
      expect(response.status).toBe(200);
      expectClearsSession(response, identifier);
    }
  });

  it("passes on an updating refusal when the object keeps refusing: no Set-Cookie, and the session is kept", async () => {
    let refuse = false;
    const installed = await seeded("signout-updating", async (operation, _init, send) => {
      if (refuse && (operation === "endSession" || operation === "sessionInfo")) {
        return Response.json({ error: { code: "updating", message: "x" } }, { status: 503 });
      }
      return send();
    });
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    refuse = true;

    const out = await signOut(installed.env, { cookies });
    expect(out.status).toBe(503);
    expect(out.headers.get("retry-after")).not.toBeNull();
    expect(out.headers.getSetCookie()).toEqual([]);
    expect((await refusalOf(out, [EMAIL, PASSWORD, ...Object.values(cookies)])).code).toBe("updating");
    expect(await sessionsOf(installed)).toHaveLength(1);

    const read = await readSession(installed.env, { cookies });
    expect(read.status).toBe(503);
    expect(read.headers.get("retry-after")).not.toBeNull();
    expect(read.headers.getSetCookie()).toEqual([]);
    expect((await refusalOf(read, Object.values(cookies))).code).toBe("updating");
  });

  it("clears only this installation's own name; another installation's cookie gets no Set-Cookie (criterion 17)", async () => {
    const installed = await seeded("signout-foreign");
    const identifier = await identifierOf(installed);
    const foreign = sessionCookieName("e".repeat(32));
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD, { cookies: { [foreign]: newSessionToken() } });
    expect(cookies[foreign]).toBeDefined();
    const response = await signOut(installed.env, { cookies });
    expectClearsSession(response, identifier);
    expect(await sessionsOf(installed)).toEqual([]);
  });
});

describe("logs (V-10)", { timeout: 60_000 }, () => {
  it("hold no email, password, token or marker over sign-in, failure, wait and sign-out", async () => {
    const installed = await seeded("logs");
    const lines: string[] = [];
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const saved = methods.map((method) => console[method]);
    for (const method of methods) {
      console[method] = (...args: unknown[]) => {
        lines.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg) ?? String(arg))).join(" "));
      };
    }
    let cookies: Record<string, string> = {};
    // Another installation's cookie on the same host, presented beside this one's.
    const foreign = { [sessionCookieName("f".repeat(32))]: newSessionToken() };
    try {
      cookies = await signedIn(installed.env, EMAIL, PASSWORD, { address: "198.51.100.40" });
      for (let index = 0; index < 5; index += 1) await signIn(installed.env, "Secret.Person@acme.test", WRONG, { address: "198.51.100.41" });
      expect((await signIn(installed.env, "Secret.Person@acme.test", WRONG, { address: "198.51.100.41" })).status).toBe(429);
      expect((await readSession(installed.env, { cookies: { ...foreign, ...cookies } })).status).toBe(200);
      expect((await signOut(installed.env, { cookies: { ...foreign, ...cookies } })).status).toBe(200);
    } finally {
      methods.forEach((method, index) => (console[method] = saved[index]!));
    }
    const text = lines.join("\n").toLowerCase();
    for (const value of [EMAIL, PASSWORD, WRONG, "secret.person", ...Object.values(cookies), ...Object.values(foreign)]) {
      expect(text).not.toContain(value.toLowerCase());
    }
  });
});

describe("two installations (CAP-10, local part)", { timeout: 60_000 }, () => {
  it("share no sign-in: neither account, nor cookie, nor token under the other's name works on the other", async () => {
    const a = installationFor("two-a");
    const b = installationFor("two-b");
    await seedAccount(a.stub, { email: "admin-a@acme.test", hash });
    await seedAccount(b.stub, { email: "admin-b@acme.test", hash });
    const [idA, idB] = [await identifierOf(a), await identifierOf(b)];
    expect(idA).not.toBe(idB);

    // A's account cannot sign in to B.
    const crossed = await signIn(b.env, "admin-a@acme.test", PASSWORD);
    expect(crossed.status).toBe(401);
    await refusalOf(crossed, ["admin-a@acme.test", PASSWORD]);

    const jarA = await signedIn(a.env, "admin-a@acme.test", PASSWORD);
    const tokenA = jarA[sessionCookieName(idA)]!;
    // A's cookie, sent to B on the same host, is ignored by B and never cleared.
    const ignored = await readSession(b.env, { cookies: jarA });
    expect(ignored.headers.getSetCookie()).toEqual([]);
    expect(await ignored.json()).toMatchObject({ signedIn: false });
    // Signing in to B and out of B leaves A's cookie alone, and A's session live.
    const jarBoth = await signedIn(b.env, "admin-b@acme.test", PASSWORD, { cookies: jarA });
    expect(Object.keys(jarBoth).sort()).toEqual([sessionCookieName(idA), markerCookieName(idA), sessionCookieName(idB), markerCookieName(idB)].sort());
    const outOfB = await signOut(b.env, { cookies: jarBoth });
    expectClearsSession(outOfB, idB);
    expect(await (await readSession(a.env, { cookies: jarFrom(outOfB, jarBoth) })).json()).toMatchObject({ signedIn: true });

    // A's token under B's cookie name is refused by B and cleared under B's name.
    const underB = await readSession(b.env, { cookies: { [sessionCookieName(idB)]: tokenA } });
    expectClearsSession(underB, idB);
    expect(await underB.json()).toMatchObject({ signedIn: false });
  });
});
