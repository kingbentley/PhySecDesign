import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { REFUSALS, refusalBody } from "../shared/refusal";
import { APP_HEADER, APP_HEADER_VALUE, ROUTES, secondStepReply, signInReply } from "../shared/routes";
import { normalisePassword } from "../shared/setup";
import { ADDRESS_FREE_FAILURES, ADDRESS_WINDOW_MS } from "../shared/signin";
import { markerCookieName } from "../server/auth/marker";
import { HASH_QUEUE_MAX_WAITING, hashPassword, hashQueue, type PasswordHash } from "../server/auth/password";
import { newSessionToken, PENDING_MAX_AGE_SECONDS, pendingCookieName, sessionCookieName, sessionTokenHash } from "../server/auth/session";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import type { Installation } from "../server/installation/Installation";
import { ADDRESS_FAILURES_TABLE, PENDING_TABLE } from "../server/installation/signInStore";
import {
  abortedWhileQueued,
  get,
  installationFor,
  jarFrom,
  ORIGIN,
  post,
  readSession,
  refusalOf,
  SECOND_STEP_PATH,
  seedAccount,
  setCookiesOf,
  signedIn,
  signIn,
  TWO_STEP_CONFIRM_PATH,
  TWO_STEP_PATH,
  TWO_STEP_RECOVERY_CODES_PATH,
  TWO_STEP_START_PATH,
  TWO_STEP_TURN_OFF_PATH,
  turnedOnByRoutes,
  type Installed,
  type ParsedCookie,
  type RequestOptions,
  type Wrap,
} from "./signin-helpers";
import { newDeploymentKey } from "./two-step-fixtures";

// The second sign-in step through the routes (story 1.5, spec 4): the sign-in reply for an account
// with two-step verification on, the pending sign-in cookie and its clearing, and the second-step
// route (CAP-3, CAP-4, CAP-6, CAP-9, CAP-10 route side). Each test has its own installation object.
// Two-step verification is turned on through the routes with the deployment key the test
// configuration generates; every code is computed at run time from the secret the start answered.

const PASSWORD = "correct horse battery staple";
const WRONG = "not the right password at all";
const EMAIL = "dana@acme.test";
const KNOWN_ADDRESS = "198.51.100.9";

/** One real hash of PASSWORD, made once and copied into seeded accounts. */
let hash: PasswordHash;

beforeAll(async () => {
  hash = await hashPassword(normalisePassword(PASSWORD));
});

async function seeded(name: string): Promise<Installed> {
  const installed = installationFor(`second-step-routes:${name}`);
  await seedAccount(installed.stub, { email: EMAIL, hash });
  return installed;
}

/** An account with two-step verification on, turned on through the routes from a signed-in browser. */
async function twoStepAccount(name: string) {
  const installed = await seeded(name);
  const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
  const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
  return { installed, cookies, on, identifier: await identifierOf(installed) };
}

function identifierOf(installed: Installed): Promise<string> {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.identifier());
}

function countsOf(installed: Installed) {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.counts());
}

function pendingCount(installed: Installed): Promise<number> {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.pendingCount());
}

/** Signs in with the right password for a two-step account and answers the browser's cookies, now holding the pending cookie. */
async function pendingSignIn(target: Env, jar: Record<string, string> = {}, options: RequestOptions = {}): Promise<Record<string, string>> {
  const response = await signIn(target, EMAIL, PASSWORD, { ...options, cookies: jar });
  expect(response.status, await response.clone().text()).toBe(200);
  expect(await response.json()).toEqual({ secondStep: true });
  return jarFrom(response, jar);
}

function secondStep(target: Env, body: unknown, options: RequestOptions = {}): Promise<Response> {
  return post(target, SECOND_STEP_PATH, body, options);
}

function expectPendingCookie(cookie: ParsedCookie | undefined, identifier: string) {
  expect(cookie?.name).toBe(pendingCookieName(identifier));
  expect(cookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(cookie?.attributes).toEqual({ httponly: true, secure: true, samesite: "Strict", path: "/", "max-age": String(PENDING_MAX_AGE_SECONDS) });
}

/** The reply's lines clearing a pending cookie, by name. */
function pendingClears(response: Response): string[] {
  return setCookiesOf(response)
    .filter((cookie) => cookie.name.startsWith("__Host-ssd-p-"))
    .map((cookie) => {
      expect(cookie.value).toBe("");
      expect(cookie.attributes).toEqual({ httponly: true, secure: true, samesite: "Strict", path: "/", "max-age": "0" });
      return cookie.name;
    });
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

describe("POST /api/v1/session/sign-in with two-step verification (story 1.5)", { timeout: 120_000 }, () => {
  it("for an account with two-step verification on answers { secondStep: true } with only the pending cookie, no session or marker line, and the session read answers signed out; a current code then signs in (criterion 3)", async () => {
    const { installed, on, identifier } = await twoStepAccount("criterion-3");
    const response = await signIn(installed.env, EMAIL, PASSWORD);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ secondStep: true });
    expect(signInReply.parse(body)).toEqual(body);
    const cookies = setCookiesOf(response);
    expect(cookies).toHaveLength(1);
    expectPendingCookie(cookies[0], identifier);
    expect(cookies.some((cookie) => cookie.name === sessionCookieName(identifier) || cookie.name === markerCookieName(identifier))).toBe(false);

    // Only the token's SHA-256 is stored.
    const token = cookies[0]!.value;
    const stored = await runInDurableObject(installed.stub, (_i, state) =>
      state.storage.sql.exec<{ token_hash: string }>(`SELECT token_hash FROM ${PENDING_TABLE}`).toArray().map((row) => row.token_hash),
    );
    expect(stored).toEqual([await sessionTokenHash(token)]);

    const jar = jarFrom(response);
    const read = await readSession(installed.env, { cookies: jar });
    expect(read.headers.getSetCookie()).toEqual([]);
    expect(await read.json()).toEqual({ signedIn: false, installationName: "Acme Security" });

    const done = await secondStep(installed.env, { method: "code", code: await on.codes.next() }, { cookies: jar });
    expect(done.status, await done.clone().text()).toBe(200);
    const doneBody = await done.json();
    expect(doneBody).toEqual({ name: "Dana Admin" });
    expect(secondStepReply.parse(doneBody)).toEqual(doneBody);
    const after = jarFrom(done, jar);
    expect(after[pendingCookieName(identifier)]).toBeUndefined();
    expect(await (await readSession(installed.env, { cookies: after })).json()).toMatchObject({ signedIn: true, name: "Dana Admin" });
  });

  it("for an account with it off answers { name } with the session and marker cookies, and clears this installation's pending cookie when one is presented (Sign in, off; finding 23)", async () => {
    const installed = await seeded("off");
    const identifier = await identifierOf(installed);
    const plain = await signIn(installed.env, EMAIL, PASSWORD);
    expect(plain.status).toBe(200);
    expect(await plain.json()).toEqual({ name: "Dana Admin" });
    expect(setCookiesOf(plain).map((cookie) => cookie.name).sort()).toEqual([markerCookieName(identifier), sessionCookieName(identifier)].sort());

    const foreign = pendingCookieName("b".repeat(32));
    const withPending = await signIn(installed.env, EMAIL, PASSWORD, {
      cookies: { [pendingCookieName(identifier)]: newSessionToken(), [foreign]: newSessionToken() },
    });
    expect(withPending.status).toBe(200);
    expect(await withPending.json()).toEqual({ name: "Dana Admin" });
    expect(setCookiesOf(withPending).map((cookie) => cookie.name).sort()).toEqual(
      [markerCookieName(identifier), pendingCookieName(identifier), sessionCookieName(identifier)].sort(),
    );
    expect(pendingClears(withPending)).toEqual([pendingCookieName(identifier)]);
  });

  it("with a pending cookie presented answers a wrong password, a wait and a full hash queue with the line clearing it, and never clears another installation's pending cookie (Sign in with a pending cookie; finding 23, D-3)", async () => {
    const { installed, identifier } = await twoStepAccount("refusals-clear");
    const foreign = pendingCookieName("c".repeat(32));
    let jar = { ...(await pendingSignIn(installed.env)), [foreign]: newSessionToken() };
    expect(await pendingCount(installed)).toBe(1);

    const wrong = await signIn(installed.env, EMAIL, WRONG, { cookies: jar });
    expect(wrong.status).toBe(401);
    expect((await refusalOf(wrong, [WRONG, ...Object.values(jar)])).code).toBe("signin_failed");
    expect(pendingClears(wrong)).toEqual([pendingCookieName(identifier)]);
    expect(setCookiesOf(wrong)).toHaveLength(1);
    // The attempt discarded the pending sign-in the browser presented (D-3).
    expect(await pendingCount(installed)).toBe(0);
    jar = jarFrom(wrong, jar);
    expect(jar[foreign]).toBeDefined();

    // Wrong passwords until the email's wait (this browser has no marker), each with a pending cookie presented.
    let waiting: Response | null = null;
    for (let attempt = 0; attempt < 8 && !waiting; attempt += 1) {
      const presented = { ...jar, [pendingCookieName(identifier)]: newSessionToken() };
      const response = await signIn(installed.env, EMAIL, WRONG, { cookies: presented });
      expect(pendingClears(response)).toEqual([pendingCookieName(identifier)]);
      if (response.status === 429) waiting = response;
      else {
        expect(response.status).toBe(401);
        await response.arrayBuffer();
      }
    }
    expect(waiting).not.toBeNull();
    const error = await refusalOf(waiting!, [WRONG]);
    expect(error.code).toBe("signin_wait");
    expect(waiting!.headers.get("retry-after")).toBe(String(error.retryAfterSeconds));

    const release = fillHashQueue();
    let busy: Response;
    try {
      busy = await signIn(installed.env, EMAIL, PASSWORD, { cookies: { ...jar, [pendingCookieName(identifier)]: newSessionToken() } });
    } finally {
      await release();
    }
    expect(busy.status).toBe(503);
    expect(busy.headers.get("retry-after")).toBe("5");
    expect((await refusalOf(busy, [PASSWORD])).code).toBe("signin_busy");
    expect(pendingClears(busy)).toEqual([pendingCookieName(identifier)]);
  });
});

describe("the pending cookie on refusals after counting and when the identifier cannot be read", { timeout: 120_000 }, () => {
  it("a sign-in aborted while it waits in the hash queue answers 503 signin_busy with exactly one Set-Cookie, clearing this installation's pending cookie and not another installation's (finding 23)", async () => {
    const installed = await seeded("abort-queued");
    const identifier = await identifierOf(installed);
    const foreign = pendingCookieName("e".repeat(32));
    installed.calls.clear();
    const response = await abortedWhileQueued(
      installed.env,
      ROUTES.signIn.path,
      { email: EMAIL, password: PASSWORD },
      { [pendingCookieName(identifier)]: newSessionToken(), [foreign]: newSessionToken() },
    );
    expect(response.status).toBe(503);
    expect(await refusalOf(response, [PASSWORD])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
    expect(setCookiesOf(response)).toHaveLength(1);
    expect(pendingClears(response)).toEqual([pendingCookieName(identifier)]);
    expect(installed.calls.get("signInAttempt")).toBe(1);
    expect(installed.calls.get("completeSignIn")).toBeUndefined();
  });

  it("when the identifier read is refused, a second step answered second_step_expired and a sign-in refused with a wait keep their own code and status and set no cookie", async () => {
    const wrap: Wrap = (operation, _init, send) =>
      operation === "sessionInfo"
        ? Promise.resolve(Response.json(refusalBody("updating"), { status: 503 }))
        : send();
    const installed = installationFor("second-step-routes:identifier-refused", wrap);
    await seedAccount(installed.stub, { email: EMAIL, hash });
    const identifier = await identifierOf(installed);
    const presented = { [pendingCookieName(identifier)]: newSessionToken() };

    const expired = await secondStep(installed.env, { method: "code", code: "123456" }, { cookies: presented });
    expect(expired.status).toBe(401);
    expect((await refusalOf(expired, Object.values(presented))).code).toBe("second_step_expired");
    expect(expired.headers.getSetCookie()).toEqual([]);

    // A wait from the address: the attempt answers no identifier, so the read is needed.
    const now = Date.now();
    await runInDurableObject(installed.stub, (_i, state) => {
      for (let index = 0; index < ADDRESS_FREE_FAILURES; index += 1) {
        state.storage.sql.exec(`INSERT INTO ${ADDRESS_FAILURES_TABLE} (address, at, clears_at) VALUES (?, ?, ?)`, KNOWN_ADDRESS, now, now + ADDRESS_WINDOW_MS);
      }
    });
    const waiting = await signIn(installed.env, EMAIL, WRONG, { cookies: presented, address: KNOWN_ADDRESS });
    expect(waiting.status).toBe(429);
    expect((await refusalOf(waiting, [WRONG, ...Object.values(presented)])).code).toBe("signin_wait");
    expect(waiting.headers.getSetCookie()).toEqual([]);
    expect(installed.calls.get("sessionInfo")).toBeGreaterThan(0);
  });
});

describe("POST /api/v1/session/second-step", { timeout: 120_000 }, () => {
  it("is a POST, appOriginOnly and reads the session cookie (standing rule 13)", () => {
    expect(ROUTES.secondStep.method).toBe("POST");
    expect(ROUTES.secondStep.path).toBe("/api/v1/session/second-step");
    expect(ROUTES.secondStep.appOriginOnly).toBe(true);
    expect(ROUTES.secondStep.readsSessionCookie).toBe(true);
  });

  it("with the pending cookie and a current code sets a new session cookie and the marker, clears the pending cookie, and the session the browser presented before is refused afterwards (criterion 5, CA-47)", async () => {
    const { installed, cookies: before, on, identifier } = await twoStepAccount("criterion-5");
    expect(await (await readSession(installed.env, { cookies: before })).json()).toMatchObject({ signedIn: true });
    const jar = await pendingSignIn(installed.env, before);
    // The pending sign-in leaves the presented session alone until the second step.
    expect(jar[sessionCookieName(identifier)]).toBe(before[sessionCookieName(identifier)]);

    const done = await secondStep(installed.env, { method: "code", code: await on.codes.next() }, { cookies: jar });
    expect(done.status, await done.clone().text()).toBe(200);
    expect(await done.json()).toEqual({ name: "Dana Admin" });
    const set = setCookiesOf(done);
    expect(set.map((cookie) => cookie.name).sort()).toEqual([markerCookieName(identifier), pendingCookieName(identifier), sessionCookieName(identifier)].sort());
    expect(pendingClears(done)).toEqual([pendingCookieName(identifier)]);
    const after = jarFrom(done, jar);
    expect(after[sessionCookieName(identifier)]).not.toBe(before[sessionCookieName(identifier)]);

    expect(await (await readSession(installed.env, { cookies: after })).json()).toMatchObject({ signedIn: true });
    const old = await readSession(installed.env, { cookies: before });
    expect(await old.json()).toMatchObject({ signedIn: false });
    const oldState = await get(installed.env, TWO_STEP_PATH, { cookies: before });
    expect(oldState.status).toBe(401);
    expect((await refusalOf(oldState, [])).code).toBe("not_signed_in");
  });

  it("with a recovery code signs in once; the same code is then refused second_step_recovery_code_wrong, keeping the pending cookie, and the count drops by one (criterion 6)", async () => {
    const { installed, on } = await twoStepAccount("recovery-once");
    const code = on.recoveryCodes[0]!;
    const first = await pendingSignIn(installed.env);
    const used = await secondStep(installed.env, { method: "recovery", code }, { cookies: first });
    expect(used.status, await used.clone().text()).toBe(200);
    expect(await used.json()).toEqual({ name: "Dana Admin" });
    const session = jarFrom(used, first);

    const second = await pendingSignIn(installed.env);
    const again = await secondStep(installed.env, { method: "recovery", code: code.toUpperCase().replace(/-/g, " ") }, { cookies: second });
    expect(again.status).toBe(401);
    expect(await refusalOf(again, [code, ...Object.values(second)])).toEqual({
      code: "second_step_recovery_code_wrong",
      message: REFUSALS.second_step_recovery_code_wrong.message,
    });
    expect(again.headers.getSetCookie()).toEqual([]);
    expect(await pendingCount(installed)).toBe(1);

    const state = await get(installed.env, TWO_STEP_PATH, { cookies: session });
    expect(await state.json()).toMatchObject({ enabled: true, recoveryCodesRemaining: 9 });
  });

  it("with a wrong code answers second_step_code_wrong, counts it as a wrong password and keeps the pending cookie", async () => {
    const { installed, on } = await twoStepAccount("wrong-code");
    const jar = await pendingSignIn(installed.env, {}, { address: KNOWN_ADDRESS });
    const right = await on.codes.next();
    const wrongCode = right === "000000" ? "111111" : "000000";
    const before = await countsOf(installed);
    const response = await secondStep(installed.env, { method: "code", code: wrongCode }, { cookies: jar, address: KNOWN_ADDRESS });
    expect(response.status).toBe(401);
    expect(await refusalOf(response, [wrongCode, right, ...Object.values(jar)])).toEqual({
      code: "second_step_code_wrong",
      message: REFUSALS.second_step_code_wrong.message,
    });
    expect(response.headers.getSetCookie()).toEqual([]);
    const after = await countsOf(installed);
    expect(after.byEmail[0]!.failures).toBe(before.byEmail[0]!.failures + 1);
    expect(after.byAddress.filter((row) => row.address === KNOWN_ADDRESS)).toHaveLength(
      before.byAddress.filter((row) => row.address === KNOWN_ADDRESS).length + 1,
    );
    expect(await pendingCount(installed)).toBe(1);
    // The pending sign-in still completes with the right code.
    expect((await secondStep(installed.env, { method: "code", code: right }, { cookies: jar, address: KNOWN_ADDRESS })).status).toBe(200);
  });

  it("without a pending cookie, from another browser, or with an unknown one is refused 401 second_step_expired; this installation's pending cookie is cleared and another installation's never (No pending cookie)", async () => {
    const { installed, on, identifier } = await twoStepAccount("expired-browser");
    await pendingSignIn(installed.env);
    const code = await on.codes.next();

    const none = await secondStep(installed.env, { method: "code", code });
    expect(none.status).toBe(401);
    expect(await refusalOf(none, [code])).toEqual({ code: "second_step_expired", message: REFUSALS.second_step_expired.message });
    // Nothing was presented, so nothing is set or cleared, and no session starts.
    expect(none.headers.getSetCookie()).toEqual([]);

    const foreign = pendingCookieName("d".repeat(32));
    const other = await secondStep(installed.env, { method: "code", code }, { cookies: { [foreign]: newSessionToken() } });
    expect(other.status).toBe(401);
    expect((await refusalOf(other, [code])).code).toBe("second_step_expired");
    expect(other.headers.getSetCookie()).toEqual([]);

    const unknown = await secondStep(installed.env, { method: "code", code }, { cookies: { [pendingCookieName(identifier)]: newSessionToken() } });
    expect(unknown.status).toBe(401);
    expect((await refusalOf(unknown, [code])).code).toBe("second_step_expired");
    expect(pendingClears(unknown)).toEqual([pendingCookieName(identifier)]);
    expect(setCookiesOf(unknown)).toHaveLength(1);
  });

  it("refuses a pending cookie after 5 minutes with second_step_expired and clears it (criterion 18)", async () => {
    const { installed, on, identifier } = await twoStepAccount("expired-time");
    const jar = await pendingSignIn(installed.env);
    // Age the pending row past its expiry; nothing in production code is shortened.
    await runInDurableObject(installed.stub, (_i, state) => state.storage.sql.exec(`UPDATE ${PENDING_TABLE} SET expires_at = ?`, Date.now() - 1));
    const response = await secondStep(installed.env, { method: "code", code: await on.codes.next() }, { cookies: jar });
    expect(response.status).toBe(401);
    expect((await refusalOf(response, Object.values(jar))).code).toBe("second_step_expired");
    expect(pendingClears(response)).toEqual([pendingCookieName(identifier)]);
    expect(setCookiesOf(response)).toHaveLength(1);
    expect(await pendingCount(installed)).toBe(0);
  });

  it("finds that a pending cookie allows nothing else: as a session cookie or sent to the session read, invite and the account routes it is not signed in (Pending elsewhere; criterion 18)", async () => {
    const { installed, on, identifier } = await twoStepAccount("pending-elsewhere");
    const jar = await pendingSignIn(installed.env);
    const token = jar[pendingCookieName(identifier)]!;
    const asSession = { [sessionCookieName(identifier)]: token };

    for (const cookies of [jar, asSession]) {
      const read = await readSession(installed.env, { cookies });
      expect(await read.json()).toMatchObject({ signedIn: false });
      const state = await get(installed.env, TWO_STEP_PATH, { cookies });
      expect(state.status).toBe(401);
      expect((await refusalOf(state, [token])).code).toBe("not_signed_in");
      for (const [path, body] of [
        [ROUTES.invite.path, { email: "robin@acme.test", name: "Robin", role: "standard" }],
        [TWO_STEP_START_PATH, { password: PASSWORD }],
        [TWO_STEP_CONFIRM_PATH, { setupId: "0".repeat(32), code: "123456" }],
        [TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }],
        [TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: "123456" }],
      ] as const) {
        const response = await post(installed.env, path, body, { cookies });
        expect(response.status, path).toBe(401);
        expect((await refusalOf(response, [token, PASSWORD])).code, path).toBe("not_signed_in");
      }
    }
    // Presented as a session cookie it is no pending sign-in either.
    const code = await on.codes.next();
    const wrongName = await secondStep(installed.env, { method: "code", code }, { cookies: asSession });
    expect(wrongName.status).toBe(401);
    expect((await refusalOf(wrongName, [token])).code).toBe("second_step_expired");
    // Under its own name it still completes the sign-in.
    expect((await secondStep(installed.env, { method: "code", code }, { cookies: jar })).status).toBe(200);
  });

  it("refuses a code that does not normalise for its method as 400 invalid_input naming code, and counts nothing (Bad code shape)", async () => {
    const { installed } = await twoStepAccount("bad-shape");
    const jar = await pendingSignIn(installed.env);
    const before = await countsOf(installed);
    installed.calls.clear();
    for (const body of [
      { method: "code", code: "12a456" },
      { method: "code", code: "1234567" },
      { method: "code", code: " 1 2 3 4 5 6 7 " },
      { method: "recovery", code: "abc" },
      { method: "recovery", code: "x".repeat(65) },
    ]) {
      const response = await secondStep(installed.env, body, { cookies: jar });
      expect(response.status, body.code).toBe(400);
      expect(await refusalOf(response, [body.code]), body.code).toEqual({ code: "invalid_input", message: REFUSALS.invalid_input.message, field: "code" });
      expect(response.headers.getSetCookie()).toEqual([]);
    }
    expect(installed.calls.size).toBe(0);
    expect(await countsOf(installed)).toEqual(before);
    expect(await pendingCount(installed)).toBe(1);
  });

  it("from a known address at its wait threshold answers signin_wait with its seconds and clears the pending cookie, judging the second step's own address (Address; finding 4)", async () => {
    const { installed, on, identifier } = await twoStepAccount("address-wait");
    // The password step from the unknown address, which has no count.
    const jar = await pendingSignIn(installed.env);
    const now = Date.now();
    await runInDurableObject(installed.stub, (_i, state) => {
      for (let index = 0; index < ADDRESS_FREE_FAILURES; index += 1) {
        state.storage.sql.exec(
          `INSERT INTO ${ADDRESS_FAILURES_TABLE} (address, at, clears_at) VALUES (?, ?, ?)`,
          KNOWN_ADDRESS,
          now,
          now + ADDRESS_WINDOW_MS,
        );
      }
    });
    const response = await secondStep(installed.env, { method: "code", code: await on.codes.next() }, { cookies: jar, address: KNOWN_ADDRESS });
    expect(response.status).toBe(429);
    const error = await refusalOf(response, Object.values(jar));
    expect(error.code).toBe("signin_wait");
    expect(error.retryAfterSeconds).toBeGreaterThan(0);
    expect(response.headers.get("retry-after")).toBe(String(error.retryAfterSeconds));
    expect(pendingClears(response)).toEqual([pendingCookieName(identifier)]);
    expect(setCookiesOf(response)).toHaveLength(1);
    expect(await pendingCount(installed)).toBe(0);
  });

  it("under a mismatched deployment key refuses a code 503 deployment_key_mismatch, keeping the pending cookie, and a recovery code still signs in (Mismatched key; criterion 23)", async () => {
    const { installed, on } = await twoStepAccount("key-mismatch");
    const other = { ...installed.env, DEPLOYMENT_KEY: newDeploymentKey() } as Env;
    const jar = await pendingSignIn(other);
    const code = await on.codes.next();
    const refused = await secondStep(other, { method: "code", code }, { cookies: jar });
    expect(refused.status).toBe(503);
    expect(await refusalOf(refused, [code, other.DEPLOYMENT_KEY!, installed.env.DEPLOYMENT_KEY!])).toEqual({
      code: "deployment_key_mismatch",
      message: REFUSALS.deployment_key_mismatch.message,
    });
    expect(refused.headers.getSetCookie()).toEqual([]);
    expect(await pendingCount(installed)).toBe(1);

    const recovered = await secondStep(other, { method: "recovery", code: on.recoveryCodes[1]! }, { cookies: jar });
    expect(recovered.status, await recovered.clone().text()).toBe(200);
    expect(await recovered.json()).toEqual({ name: "Dana Admin" });
  });

  for (const [what, options] of [
    ["another Origin", { origin: "https://evil.example.test" }],
    ["no Origin", { origin: null }],
    ["no app header", { header: null }],
  ] as const) {
    it(`with ${what} is refused origin_refused before any object call, keeping the pending sign-in (Origin; criterion 19)`, async () => {
      const { installed, on } = await twoStepAccount(`origin-${what.replace(/\W/g, "")}`);
      const jar = await pendingSignIn(installed.env);
      installed.calls.clear();
      const cookie = Object.entries(jar)
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
      const headers: Record<string, string> = { "content-type": "application/json", cookie };
      if (!("origin" in options)) headers.origin = ORIGIN;
      else if (options.origin !== null) headers.origin = options.origin;
      if (!("header" in options)) headers[APP_HEADER] = APP_HEADER_VALUE;
      const code = await on.codes.next();
      const response = await handleRequest(
        new Request(ORIGIN + SECOND_STEP_PATH, { method: "POST", headers, body: JSON.stringify({ method: "code", code }) }),
        installed.env,
      );
      expect(response.status).toBe(403);
      expect((await refusalOf(response, [code])).code).toBe("origin_refused");
      expect(response.headers.getSetCookie()).toEqual([]);
      expect(installed.calls.size).toBe(0);
      expect(await pendingCount(installed)).toBe(1);
    });
  }
});
