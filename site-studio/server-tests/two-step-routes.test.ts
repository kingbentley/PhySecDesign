import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { REFUSALS } from "../shared/refusal";
import {
  APP_HEADER,
  APP_HEADER_VALUE,
  deploymentKeyStateReply,
  recoveryCodesReply,
  ROUTE_LIST,
  ROUTES,
  twoStepStartReply,
  twoStepStateReply,
  twoStepTurnOffReply,
} from "../shared/routes";
import { normalisePassword } from "../shared/setup";
import { base32Decode, normaliseRecoveryCode, otpauthUri } from "../shared/twoStep";
import { HASH_QUEUE_MAX_WAITING, hashPassword, hashQueue, type PasswordHash } from "../server/auth/password";
import { stepAt, totpAt } from "../server/auth/totp";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import type { Installation } from "../server/installation/Installation";
import { DEPLOYMENT_KEY_TABLE } from "../server/installation/keyGuard";
import { RECOVERY_CODES_TABLE, TWO_STEP_SETUPS_TABLE, TWO_STEP_TABLE } from "../server/installation/twoStepStore";
import {
  abortedWhileQueued,
  awayFromStepEnd,
  codeSource,
  get,
  installationFor,
  jarFrom,
  KEY_STATE_PATH,
  ORIGIN,
  post,
  readSession,
  refusalOf,
  SECOND_STEP_PATH,
  seedAccount,
  setCookiesOf,
  signedIn,
  signIn,
  signOut,
  startedByRoutes,
  TWO_STEP_CONFIRM_PATH,
  TWO_STEP_PATH,
  TWO_STEP_RECOVERY_CODES_PATH,
  TWO_STEP_START_PATH,
  TWO_STEP_TURN_OFF_PATH,
  turnedOnByRoutes,
  type Installed,
  type Wrap,
} from "./signin-helpers";
import { newDeploymentKey } from "./two-step-fixtures";

// The account two-step routes and the deployment-key state route (story 1.5, spec 4): turning on
// (start and confirm), turning off, fresh recovery codes, the state read, the public key-state read,
// the key passed from the Worker's env on each call (D-22), the origin and session rules, the reply
// sweep and the log watch (CAP-1, CAP-2, CAP-6, CAP-7, CAP-9, CAP-10 route side). Each test has its
// own installation object; every key, secret and code is made at run time.

const PASSWORD = "correct horse battery staple";
const WRONG = "not the right password at all";
const EMAIL = "dana@acme.test";

/** One real hash of PASSWORD, made once and copied into seeded accounts. */
let hash: PasswordHash;

beforeAll(async () => {
  hash = await hashPassword(normalisePassword(PASSWORD));
});

/** An installation with one account, signed in; answers it and the browser's cookies. */
async function signedInAccount(name: string, wrap?: Wrap) {
  const installed = installationFor(`two-step-routes:${name}`, wrap);
  await seedAccount(installed.stub, { email: EMAIL, hash });
  const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
  return { installed, cookies };
}

/** The env of the same installation namespace with another `DEPLOYMENT_KEY` (or none). */
function withKey(installed: Installed, key: string | null | undefined): Env {
  const changed = { ...installed.env, DEPLOYMENT_KEY: key } as Env;
  if (key === undefined) delete (changed as { DEPLOYMENT_KEY?: unknown }).DEPLOYMENT_KEY;
  return changed;
}

function rows(installed: Installed, table: string): Promise<Record<string, SqlStorageValue>[]> {
  return runInDurableObject(installed.stub, (_i, state) => state.storage.sql.exec(`SELECT * FROM ${table}`).toArray());
}

function countsOf(installed: Installed) {
  return runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.counts());
}

function state(target: Env, cookies: Record<string, string>) {
  return get(target, TWO_STEP_PATH, { cookies });
}

async function stateOf(target: Env, cookies: Record<string, string>) {
  const response = await state(target, cookies);
  expect(response.status, await response.clone().text()).toBe(200);
  return response.json() as Promise<{ enabled: boolean; recoveryCodesRemaining: number; availability: string; email: string }>;
}

async function keyStateOf(target: Env) {
  const response = await get(target, KEY_STATE_PATH);
  expect(response.status, await response.clone().text()).toBe(200);
  return response.json() as Promise<{ fingerprint: string; key: string }>;
}

/** Signs in with the password for a two-step account and completes the second step with a recovery code; answers the reply. */
async function signInWithRecoveryCode(target: Env, code: string) {
  const pending = await signIn(target, EMAIL, PASSWORD);
  expect(await pending.clone().json()).toEqual({ secondStep: true });
  return post(target, SECOND_STEP_PATH, { method: "recovery", code }, { cookies: jarFrom(pending) });
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

/** A wrap recording each object call's operation and parsed input. */
function recorder() {
  const recorded: { operation: string; input: Record<string, unknown> | null }[] = [];
  const wrap: Wrap = (operation, init, send) => {
    recorded.push({ operation, input: JSON.parse(String(init?.body ?? "null")) });
    return send();
  };
  return { recorded, wrap };
}

describe("the two-step route declarations", () => {
  it("declare the account routes as person-only routes under /api/v1/account/two-step, every non-GET one appOriginOnly, and the key-state read public", () => {
    expect([ROUTES.twoStepState.method, ROUTES.twoStepState.path]).toEqual(["GET", "/api/v1/account/two-step"]);
    expect(ROUTES.twoStepState.readsSessionCookie).toBe(true);
    expect(ROUTES.twoStepState.appOriginOnly).toBeUndefined();
    for (const [id, path] of [
      ["twoStepStart", "/api/v1/account/two-step/start"],
      ["twoStepConfirm", "/api/v1/account/two-step/confirm"],
      ["twoStepTurnOff", "/api/v1/account/two-step/turn-off"],
      ["twoStepRecoveryCodes", "/api/v1/account/two-step/recovery-codes"],
    ] as const) {
      expect([ROUTES[id].method, ROUTES[id].path], id).toEqual(["POST", path]);
      expect(ROUTES[id].appOriginOnly, id).toBe(true);
      expect(ROUTES[id].readsSessionCookie, id).toBe(true);
    }
    expect([ROUTES.deploymentKeyState.method, ROUTES.deploymentKeyState.path]).toEqual(["GET", "/api/v1/deployment-key/state"]);
    expect(ROUTES.deploymentKeyState.readsSessionCookie).toBeUndefined();
    expect(ROUTES.deploymentKeyState.appOriginOnly).toBeUndefined();
  });

  it("declare strict replies, with exactly 10 recovery codes", () => {
    expect(recoveryCodesReply.safeParse({ recoveryCodes: Array(10).fill("a") }).success).toBe(true);
    expect(recoveryCodesReply.safeParse({ recoveryCodes: Array(9).fill("a") }).success).toBe(false);
    expect(recoveryCodesReply.safeParse({ recoveryCodes: Array(10).fill("a"), extra: 1 }).success).toBe(false);
    expect(twoStepTurnOffReply.safeParse({ enabled: false, secret: "x" }).success).toBe(false);
    expect(deploymentKeyStateReply.safeParse({ fingerprint: "stored", key: "matches", value: "x" }).success).toBe(false);
  });
});

describe("GET /api/v1/account/two-step", { timeout: 60_000 }, () => {
  it("for an account with it off answers enabled false, no codes, available and the account's email (D-12)", async () => {
    const { installed, cookies } = await signedInAccount("state-off");
    const response = await state(installed.env, cookies);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([]);
    const body = await response.json();
    expect(body).toEqual({ enabled: false, recoveryCodesRemaining: 0, availability: "available", email: EMAIL });
    expect(twoStepStateReply.parse(body)).toEqual(body);
  });
});

describe("POST /api/v1/account/two-step/start and confirm", { timeout: 120_000 }, () => {
  it("start with the right password answers the set-up identifier, the secret, the authenticator address, the installation's name and the email (Start; D-12)", async () => {
    const { installed, cookies } = await signedInAccount("start");
    const response = await post(installed.env, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies });
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.getSetCookie()).toEqual([]);
    const body = (await response.json()) as { setupId: string; secret: string; otpauthUri: string; installationName: string; email: string };
    expect(twoStepStartReply.parse(body)).toEqual(body);
    expect(Object.keys(body).sort()).toEqual(["email", "installationName", "otpauthUri", "secret", "setupId"]);
    expect(body.setupId).toMatch(/^[0-9a-f]{32}$/);
    expect(base32Decode(body.secret)).toHaveLength(20);
    expect(body).toMatchObject({ installationName: "Acme Security", email: EMAIL });
    expect(body.otpauthUri).toBe(otpauthUri({ secret: body.secret, installationName: "Acme Security", email: EMAIL }));
    // The stored set-up holds ciphertext, never the secret.
    const setups = await rows(installed, TWO_STEP_SETUPS_TABLE);
    expect(setups).toHaveLength(1);
    expect(JSON.stringify(setups)).not.toContain(body.secret);
    expect((await stateOf(installed.env, cookies)).enabled).toBe(false);
  });

  it("start with a wrong password is refused 403 two_step_password_wrong and nothing is set up (Start, wrong password; criterion 17)", async () => {
    const { installed, cookies } = await signedInAccount("start-wrong");
    const response = await post(installed.env, TWO_STEP_START_PATH, { password: WRONG }, { cookies });
    expect(response.status).toBe(403);
    expect(await refusalOf(response, [WRONG])).toEqual({ code: "two_step_password_wrong", message: REFUSALS.two_step_password_wrong.message });
    expect(await rows(installed, TWO_STEP_SETUPS_TABLE)).toEqual([]);
    expect(await rows(installed, TWO_STEP_TABLE)).toEqual([]);
    expect((await stateOf(installed.env, cookies)).enabled).toBe(false);
    // The wrong password was counted as a wrong sign-in password (D-5).
    expect((await countsOf(installed)).byEmail[0]!.failures).toBe(1);
  });

  for (const [what, key] of [
    ["unset", undefined],
    ["null", null],
    ["empty", ""],
  ] as const) {
    it(`with DEPLOYMENT_KEY ${what}, start is refused 503 deployment_key_missing before the password is counted, the state reads no_key and the key state none, and no object call is given a deploymentKey (Start, no key; D-22, finding 6)`, async () => {
      const { recorded, wrap } = recorder();
      const { installed, cookies } = await signedInAccount(`no-key-${what}`, wrap);
      const target = withKey(installed, key);
      const before = await countsOf(installed);
      recorded.length = 0;

      const start = await post(target, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies });
      expect(start.status).toBe(503);
      expect(await refusalOf(start, [PASSWORD])).toEqual({ code: "deployment_key_missing", message: REFUSALS.deployment_key_missing.message });
      expect(await countsOf(installed)).toEqual(before);
      expect(await rows(installed, TWO_STEP_SETUPS_TABLE)).toEqual([]);

      expect((await stateOf(target, cookies)).availability).toBe("no_key");
      expect(await keyStateOf(target)).toEqual({ fingerprint: "none", key: "none" });
      const confirm = await post(target, TWO_STEP_CONFIRM_PATH, { setupId: "0".repeat(32), code: "123456" }, { cookies });
      expect((await refusalOf(confirm, [])).code).toBe("two_step_setup_expired");
      const fresh = await post(target, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: "123456" }, { cookies });
      expect((await refusalOf(fresh, [PASSWORD])).code).toBe("two_step_off");

      expect(recorded.map((call) => call.operation).sort()).toEqual(["accountCheck", "accountCheck", "confirmTwoStep", "deploymentKeyState", "twoStepState"]);
      for (const call of recorded) expect(call.input === null ? {} : call.input, call.operation).not.toHaveProperty("deploymentKey");
    });
  }

  // startTwoStep and renewRecoveryCodes cannot be reached without a key: accountCheck refuses first
  // (deployment_key_missing before a first set-up, deployment_key_mismatch once a fingerprint is
  // stored), so the second step is the remaining operation that would carry the key.
  for (const [what, key] of [
    ["null", null],
    ["empty", ""],
  ] as const) {
    it(`with DEPLOYMENT_KEY ${what} after turning on, a code at the second step is refused 503 deployment_key_mismatch keeping the pending cookie, a recovery code signs in, and no secondStep input has a deploymentKey (D-22, D-15)`, async () => {
      const { recorded, wrap } = recorder();
      const { installed, cookies } = await signedInAccount(`no-key-second-step-${what}`, wrap);
      const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
      const target = withKey(installed, key);
      recorded.length = 0;

      const pending = await signIn(target, EMAIL, PASSWORD);
      expect(await pending.json()).toEqual({ secondStep: true });
      const jar = jarFrom(pending);
      const code = await on.codes.next();
      const refused = await post(target, SECOND_STEP_PATH, { method: "code", code }, { cookies: jar });
      expect(refused.status).toBe(503);
      expect(await refusalOf(refused, [code, ...Object.values(jar)])).toEqual({
        code: "deployment_key_mismatch",
        message: REFUSALS.deployment_key_mismatch.message,
      });
      expect(refused.headers.getSetCookie()).toEqual([]);

      const recovered = await post(target, SECOND_STEP_PATH, { method: "recovery", code: on.recoveryCodes[0]! }, { cookies: jar });
      expect(recovered.status, await recovered.clone().text()).toBe(200);
      expect(await recovered.json()).toEqual({ name: "Dana Admin" });

      const secondSteps = recorded.filter((call) => call.operation === "secondStep");
      expect(secondSteps).toHaveLength(2);
      for (const call of secondSteps) expect(call.input).not.toHaveProperty("deploymentKey");
    });
  }

  it("passes the Worker's key, when it has one, to every operation that encrypts, decrypts or reports it, and to no other (D-22)", async () => {
    const { recorded, wrap } = recorder();
    const { installed, cookies } = await signedInAccount("key-passed", wrap);
    const key = installed.env.DEPLOYMENT_KEY!;
    expect(key.length).toBeGreaterThan(0);
    recorded.length = 0;
    const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    await stateOf(installed.env, cookies);
    await keyStateOf(installed.env);
    expect((await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: await on.codes.next() }, { cookies })).status).toBe(200);
    const pending = await signIn(installed.env, EMAIL, PASSWORD);
    expect((await post(installed.env, SECOND_STEP_PATH, { method: "code", code: await on.codes.next() }, { cookies: jarFrom(pending) })).status).toBe(200);
    expect((await post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }, { cookies })).status).toBe(200);

    const withKeyOps = ["twoStepState", "deploymentKeyState", "startTwoStep", "confirmTwoStep", "renewRecoveryCodes", "secondStep"];
    for (const call of recorded) {
      const input = call.input ?? {};
      const purpose = input.purpose;
      const needs = withKeyOps.includes(call.operation) || (call.operation === "accountCheck" && purpose !== "turn_off");
      if (needs) expect(input.deploymentKey, call.operation).toBe(key);
      else expect(input, `${call.operation} ${String(purpose)}`).not.toHaveProperty("deploymentKey");
    }
    expect(new Set(recorded.map((call) => call.operation))).toEqual(
      new Set([...withKeyOps, "accountCheck", "turnOffTwoStep", "signInAttempt", "completeSignIn"]),
    );
  });

  it("with a full hash queue, start, turn off and fresh codes are refused 503 signin_busy with Retry-After 5 before anything is counted (Full queue)", async () => {
    const { installed, cookies } = await signedInAccount("busy");
    const before = await countsOf(installed);
    installed.calls.clear();
    const release = fillHashQueue();
    const replies: Response[] = [];
    try {
      replies.push(await post(installed.env, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies }));
      replies.push(await post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }, { cookies }));
      replies.push(await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: "123456" }, { cookies }));
    } finally {
      await release();
    }
    for (const response of replies) {
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("5");
      expect(await refusalOf(response, [PASSWORD])).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
    }
    expect(installed.calls.size).toBe(0);
    expect(await countsOf(installed)).toEqual(before);
  });

  it("start, turn off and fresh codes aborted while waiting in the hash queue answer 503 signin_busy after counting, and never reach their completion (D-5, E-17)", async () => {
    const { installed, cookies } = await signedInAccount("abort-queued");
    const failures = async () => (await countsOf(installed)).byEmail[0]?.failures ?? 0;
    const cases = [
      ["start", TWO_STEP_START_PATH, { password: PASSWORD }, "startTwoStep"],
      ["turn off", TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }, "turnOffTwoStep"],
      ["fresh codes", TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: "123456" }, "renewRecoveryCodes"],
    ] as const;
    for (const [what, path, body, completion] of cases) {
      // Start needs it off; turning off and fresh codes need it on.
      if (what === "turn off") await turnedOnByRoutes(installed.env, cookies, PASSWORD);
      const before = await failures();
      installed.calls.clear();
      const response = await abortedWhileQueued(installed.env, path, body, cookies);
      expect(response.status, what).toBe(503);
      expect(await refusalOf(response, [PASSWORD]), what).toEqual({ code: "signin_busy", message: REFUSALS.signin_busy.message });
      expect(installed.calls.get("accountCheck"), what).toBe(1);
      expect(installed.calls.get(completion), what).toBeUndefined();
      expect(await failures(), what).toBe(before + 1);
    }
  });

  it("confirm with its setupId and a current code turns it on and answers 10 recovery codes, stored only as hashes (Confirm; criteria 1, 10, 24)", async () => {
    const { installed, cookies } = await signedInAccount("confirm");
    const started = await startedByRoutes(installed.env, cookies, PASSWORD);
    await awayFromStepEnd();
    const response = await post(installed.env, TWO_STEP_CONFIRM_PATH, { setupId: started.setupId, code: await totpAt(started.secret, stepAt(Date.now())) }, { cookies });
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = (await response.json()) as { recoveryCodes: string[] };
    expect(recoveryCodesReply.parse(body)).toEqual(body);
    expect(body.recoveryCodes).toHaveLength(10);
    for (const code of body.recoveryCodes) expect(code).toMatch(/^[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/);
    expect(await stateOf(installed.env, cookies)).toEqual({ enabled: true, recoveryCodesRemaining: 10, availability: "available", email: EMAIL });
    const stored = JSON.stringify(await rows(installed, RECOVERY_CODES_TABLE));
    for (const code of body.recoveryCodes) {
      expect(stored).not.toContain(code);
      expect(stored).not.toContain(normaliseRecoveryCode(code)!);
    }
  });

  it("confirm with a set-up identifier replaced by starting again is refused 409 two_step_setup_expired and turns nothing on (Confirm, replaced; D-10)", async () => {
    const { installed, cookies } = await signedInAccount("confirm-replaced");
    const first = await startedByRoutes(installed.env, cookies, PASSWORD);
    await startedByRoutes(installed.env, cookies, PASSWORD);
    await awayFromStepEnd();
    const response = await post(installed.env, TWO_STEP_CONFIRM_PATH, { setupId: first.setupId, code: await totpAt(first.secret, stepAt(Date.now())) }, { cookies });
    expect(response.status).toBe(409);
    expect(await refusalOf(response, [first.secretText])).toEqual({ code: "two_step_setup_expired", message: REFUSALS.two_step_setup_expired.message });
    expect((await stateOf(installed.env, cookies)).enabled).toBe(false);
    expect(await rows(installed, RECOVERY_CODES_TABLE)).toEqual([]);
  });

  it("start while it is on is refused 409 two_step_already_on", async () => {
    const { installed, cookies } = await signedInAccount("already-on");
    await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const response = await post(installed.env, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies });
    expect(response.status).toBe(409);
    expect((await refusalOf(response, [PASSWORD])).code).toBe("two_step_already_on");
  });
});

describe("POST /api/v1/account/two-step/turn-off", { timeout: 120_000 }, () => {
  it("with a wrong password is refused 403 two_step_password_wrong and leaves it on (Turn off, wrong password; criterion 16)", async () => {
    const { installed, cookies } = await signedInAccount("off-wrong");
    await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const response = await post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: WRONG }, { cookies });
    expect(response.status).toBe(403);
    expect(await refusalOf(response, [WRONG])).toEqual({ code: "two_step_password_wrong", message: REFUSALS.two_step_password_wrong.message });
    expect(await stateOf(installed.env, cookies)).toMatchObject({ enabled: true, recoveryCodesRemaining: 10 });
    expect(await rows(installed, TWO_STEP_TABLE)).toHaveLength(1);
  });

  it("with the password turns it off and deletes the secret and codes; no session is ended and signing in then needs only the password (CAP-7, D-10)", async () => {
    const { installed, cookies } = await signedInAccount("off");
    await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const response = await post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }, { cookies });
    expect(response.status, await response.clone().text()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ enabled: false });
    expect(twoStepTurnOffReply.parse(body)).toEqual(body);
    expect(await rows(installed, TWO_STEP_TABLE)).toEqual([]);
    expect(await rows(installed, RECOVERY_CODES_TABLE)).toEqual([]);
    expect(await (await readSession(installed.env, { cookies })).json()).toMatchObject({ signedIn: true });
    const again = await signIn(installed.env, EMAIL, PASSWORD);
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ name: "Dana Admin" });
  });
});

describe("POST /api/v1/account/two-step/recovery-codes", { timeout: 120_000 }, () => {
  it("with the password and a current code answers 10 new codes; an old code is then refused at the second step and a new one accepted (Fresh codes; criterion 8)", async () => {
    const { installed, cookies } = await signedInAccount("fresh");
    const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const response = await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: await on.codes.next() }, { cookies });
    expect(response.status, await response.clone().text()).toBe(200);
    const body = (await response.json()) as { recoveryCodes: string[] };
    expect(recoveryCodesReply.parse(body)).toEqual(body);
    for (const code of body.recoveryCodes) expect(on.recoveryCodes).not.toContain(code);

    const old = await signInWithRecoveryCode(installed.env, on.recoveryCodes[0]!);
    expect(old.status).toBe(401);
    expect((await refusalOf(old, [on.recoveryCodes[0]!])).code).toBe("second_step_recovery_code_wrong");
    const fresh = await signInWithRecoveryCode(installed.env, body.recoveryCodes[0]!);
    expect(fresh.status, await fresh.clone().text()).toBe(200);
    expect((await stateOf(installed.env, cookies)).recoveryCodesRemaining).toBe(9);
  });

  it("with the right password and a wrong code is refused 403 two_step_code_wrong and the old set is kept (Fresh codes, wrong code)", async () => {
    const { installed, cookies } = await signedInAccount("fresh-wrong-code");
    const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const right = await on.codes.next();
    const wrongCode = right === "000000" ? "111111" : "000000";
    const before = await rows(installed, RECOVERY_CODES_TABLE);
    const response = await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: wrongCode }, { cookies });
    expect(response.status).toBe(403);
    expect(await refusalOf(response, [wrongCode, PASSWORD])).toEqual({ code: "two_step_code_wrong", message: REFUSALS.two_step_code_wrong.message });
    expect(await rows(installed, RECOVERY_CODES_TABLE)).toEqual(before);
    expect((await signInWithRecoveryCode(installed.env, on.recoveryCodes[0]!)).status).toBe(200);
  });

  it("with a wrong password is refused 403 two_step_password_wrong and the old set is kept (criterion 8)", async () => {
    const { installed, cookies } = await signedInAccount("fresh-wrong-password");
    const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const before = await rows(installed, RECOVERY_CODES_TABLE);
    const response = await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: WRONG, code: await on.codes.next() }, { cookies });
    expect(response.status).toBe(403);
    expect((await refusalOf(response, [WRONG])).code).toBe("two_step_password_wrong");
    expect(await rows(installed, RECOVERY_CODES_TABLE)).toEqual(before);
  });
});

describe("the origin and session rules", { timeout: 120_000 }, () => {
  const changing = [
    [TWO_STEP_START_PATH, { password: PASSWORD }],
    [TWO_STEP_CONFIRM_PATH, { setupId: "0".repeat(32), code: "123456" }],
    [TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }],
    [TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: "123456" }],
    [SECOND_STEP_PATH, { method: "code", code: "123456" }],
  ] as const;

  it("refuse each new non-GET route from another origin, without Origin or without the app's header with origin_refused before any object call (Origin; criterion 19)", async () => {
    const { installed, cookies } = await signedInAccount("origin");
    const cookie = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    installed.calls.clear();
    for (const [path] of changing) {
      for (const headers of [
        { origin: "https://evil.example.test", [APP_HEADER]: APP_HEADER_VALUE },
        { [APP_HEADER]: APP_HEADER_VALUE },
        { origin: ORIGIN },
      ] as Record<string, string>[]) {
        const response = await handleRequest(
          new Request(ORIGIN + path, { method: "POST", headers: { "content-type": "application/json", cookie, ...headers }, body: "not json at all" }),
          installed.env,
        );
        expect(response.status, path).toBe(403);
        expect((await refusalOf(response, [])).code, path).toBe("origin_refused");
        expect(response.headers.getSetCookie(), path).toEqual([]);
      }
    }
    expect(installed.calls.size).toBe(0);
    expect(await countsOf(installed)).toMatchObject({ byEmail: [] });
  });

  it("refuse each account route without a session with 401 not_signed_in and change nothing (No session)", async () => {
    const { installed } = await signedInAccount("no-session");
    const before = await countsOf(installed);
    const read = await state(installed.env, {});
    expect(read.status).toBe(401);
    expect(await refusalOf(read, [])).toEqual({ code: "not_signed_in", message: REFUSALS.not_signed_in.message });
    for (const [path, body] of changing.slice(0, 4)) {
      const response = await post(installed.env, path, body, {});
      expect(response.status, path).toBe(401);
      expect((await refusalOf(response, [PASSWORD])).code, path).toBe("not_signed_in");
    }
    expect(await countsOf(installed)).toEqual(before);
    expect(await rows(installed, TWO_STEP_SETUPS_TABLE)).toEqual([]);
  });
});

describe("the deployment key (D-18, D-22)", { timeout: 120_000 }, () => {
  it("GET /api/v1/deployment-key/state answers none/present before a first set-up, stored/matches after it, stored/mismatch with another key and stored/none with none, never the fingerprint (Key state)", async () => {
    const { installed, cookies } = await signedInAccount("key-state");
    const replies: string[] = [];
    const read = async (target: Env) => {
      const response = await get(target, KEY_STATE_PATH);
      expect(response.status).toBe(200);
      expect(response.headers.getSetCookie()).toEqual([]);
      const text = await response.text();
      replies.push(text);
      const body = JSON.parse(text);
      expect(deploymentKeyStateReply.parse(body)).toEqual(body);
      return body;
    };
    expect(await read(installed.env)).toEqual({ fingerprint: "none", key: "present" });
    expect(await read(withKey(installed, undefined))).toEqual({ fingerprint: "none", key: "none" });
    await startedByRoutes(installed.env, cookies, PASSWORD);
    expect(await read(installed.env)).toEqual({ fingerprint: "stored", key: "matches" });
    expect(await read(withKey(installed, newDeploymentKey()))).toEqual({ fingerprint: "stored", key: "mismatch" });
    expect(await read(withKey(installed, null))).toEqual({ fingerprint: "stored", key: "none" });
    expect(await read(withKey(installed, "not a key"))).toEqual({ fingerprint: "stored", key: "none" });

    const [row] = await rows(installed, DEPLOYMENT_KEY_TABLE);
    const fingerprint = String(row!.fingerprint);
    expect(fingerprint.length).toBeGreaterThan(0);
    for (const text of replies) {
      expect(text).not.toContain(fingerprint);
      expect(text).not.toContain(installed.env.DEPLOYMENT_KEY!);
    }
  });

  it("judges each request by the Worker's key of that request: a key changed between two requests to the same running object changes the answer (D-22)", async () => {
    const { installed, cookies } = await signedInAccount("key-changed");
    const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const other = withKey(installed, newDeploymentKey());
    expect(await keyStateOf(installed.env)).toEqual({ fingerprint: "stored", key: "matches" });
    expect(await keyStateOf(other)).toEqual({ fingerprint: "stored", key: "mismatch" });
    expect((await stateOf(other, cookies)).availability).toBe("key_mismatch");
    expect((await stateOf(installed.env, cookies)).availability).toBe("available");
    // The fresh-codes action under each key, one after the other, on the same object.
    const refused = await post(other, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: await on.codes.next() }, { cookies });
    expect(refused.status).toBe(503);
    expect((await refusalOf(refused, [PASSWORD, other.DEPLOYMENT_KEY!])).code).toBe("deployment_key_mismatch");
    const accepted = await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: await on.codes.next() }, { cookies });
    expect(accepted.status, await accepted.clone().text()).toBe(200);
  });

  it("under a mismatched key reads key_mismatch, refuses setting up and fresh codes 503 deployment_key_mismatch before counting, and still turns off (Mismatched key; criterion 23)", async () => {
    const { installed, cookies } = await signedInAccount("mismatch");
    const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
    const other = withKey(installed, newDeploymentKey());
    expect(await stateOf(other, cookies)).toEqual({ enabled: true, recoveryCodesRemaining: 10, availability: "key_mismatch", email: EMAIL });
    const before = await countsOf(installed);
    const fresh = await post(other, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: await on.codes.next() }, { cookies });
    expect(fresh.status).toBe(503);
    expect(await refusalOf(fresh, [PASSWORD, other.DEPLOYMENT_KEY!])).toEqual({ code: "deployment_key_mismatch", message: REFUSALS.deployment_key_mismatch.message });
    expect(await countsOf(installed)).toEqual(before);

    const off = await post(other, TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }, { cookies });
    expect(off.status, await off.clone().text()).toBe(200);
    // Setting up again under the other key is refused: a fingerprint of the first key is stored.
    const start = await post(other, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies });
    expect(start.status).toBe(503);
    expect((await refusalOf(start, [PASSWORD])).code).toBe("deployment_key_mismatch");
  });
});

describe("the reply sweep (criterion 20)", { timeout: 300_000 }, () => {
  it("finds the authenticator secret only in the start reply and recovery codes only in the confirm and fresh-codes replies, over every route after set-up (Reply sweep)", async () => {
    const { installed, cookies } = await signedInAccount("reply-sweep");
    type RouteId = keyof typeof ROUTES;
    const replies: { id: RouteId; text: string }[] = [];
    const keep = async (id: RouteId, response: Response) => {
      const { status, headers, body } = { status: response.status, headers: [...response.headers.entries()].flat().join(" "), body: await response.text() };
      replies.push({ id, text: `${status} ${headers} ${body}` });
      return { status, body };
    };

    // Set-up and confirm, kept as replies of their routes.
    const startReply = await keep("twoStepStart", await post(installed.env, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies }));
    expect(startReply.status).toBe(200);
    const started = JSON.parse(startReply.body) as { setupId: string; secret: string };
    const secret = base32Decode(started.secret)!;
    await awayFromStepEnd();
    const confirmStep = stepAt(Date.now()) - 1;
    const confirmReply = await keep(
      "twoStepConfirm",
      await post(installed.env, TWO_STEP_CONFIRM_PATH, { setupId: started.setupId, code: await totpAt(secret, confirmStep) }, { cookies }),
    );
    expect(confirmReply.status).toBe(200);
    const firstCodes = (JSON.parse(confirmReply.body) as { recoveryCodes: string[] }).recoveryCodes;
    const codes = codeSource(secret, confirmStep);

    // Every route once more, in a state after set-up. A route added without an entry is a type error.
    const calls: Record<RouteId, () => Promise<Response>> = {
      status: () => get(installed.env, ROUTES.status.path),
      setupState: () => get(installed.env, ROUTES.setupState.path),
      setup: () => post(installed.env, ROUTES.setup.path, { code: installed.setupCode, installationName: "X", name: "X", email: "x@acme.test", password: PASSWORD }),
      session: () => readSession(installed.env, { cookies }),
      signIn: () => signIn(installed.env, EMAIL, PASSWORD),
      signOut: () => signOut(installed.env, {}),
      invite: () => post(installed.env, ROUTES.invite.path, { email: "robin@acme.test", name: "Robin", role: "standard" }, { cookies }),
      invitationRead: () => post(installed.env, ROUTES.invitationRead.path, { secret: "a".repeat(43) }),
      acceptInvite: () => post(installed.env, ROUTES.acceptInvite.path, { secret: "a".repeat(43), name: "Robin", password: "a brand new long password" }),
      secondStep: async () => {
        const pending = await signIn(installed.env, EMAIL, PASSWORD);
        return post(installed.env, SECOND_STEP_PATH, { method: "code", code: await codes.next() }, { cookies: jarFrom(pending) });
      },
      twoStepState: () => state(installed.env, cookies),
      // While it is on: refused two_step_already_on, holding no secret.
      twoStepStart: () => post(installed.env, TWO_STEP_START_PATH, { password: PASSWORD }, { cookies }),
      twoStepConfirm: () => post(installed.env, TWO_STEP_CONFIRM_PATH, { setupId: started.setupId, code: "123456" }, { cookies }),
      // A wrong password: refused, holding no code.
      twoStepRecoveryCodes: () => post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: WRONG, code: "123456" }, { cookies }),
      twoStepTurnOff: () => post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: WRONG }, { cookies }),
      deploymentKeyState: () => get(installed.env, KEY_STATE_PATH),
    };
    for (const route of ROUTE_LIST) {
      const id = route.id as RouteId;
      await keep(id, await calls[id]());
    }
    // A successful fresh set, kept as its route's reply.
    const freshReply = await keep(
      "twoStepRecoveryCodes",
      await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: await codes.next() }, { cookies }),
    );
    expect(freshReply.status, freshReply.body).toBe(200);
    const freshCodes = (JSON.parse(freshReply.body) as { recoveryCodes: string[] }).recoveryCodes;
    expect(new Set(replies.map((reply) => reply.id))).toEqual(new Set(Object.keys(ROUTES)));

    const codeForms = (code: string) => [code, normaliseRecoveryCode(code)!];
    const holdsSecret = replies.filter((reply) => reply.text.includes(started.secret)).map((reply) => reply.id);
    expect(holdsSecret).toEqual(["twoStepStart"]);
    const holdsFirst = replies.filter((reply) => firstCodes.some((code) => codeForms(code).some((form) => reply.text.includes(form)))).map((reply) => reply.id);
    expect(holdsFirst).toEqual(["twoStepConfirm"]);
    const holdsFresh = replies.filter((reply) => freshCodes.some((code) => codeForms(code).some((form) => reply.text.includes(form)))).map((reply) => reply.id);
    expect(holdsFresh).toEqual(["twoStepRecoveryCodes"]);
    for (const reply of replies) expect(reply.text, reply.id).not.toContain(installed.env.DEPLOYMENT_KEY!);
  });
});

describe("the logs (criterion 20)", { timeout: 300_000 }, () => {
  it("hold no secret, code, recovery code, key, password or cookie value over set-up, a second step with a code and with a recovery code, a fresh set and turning off (Log watch)", async () => {
    const lines: string[] = [];
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const saved = methods.map((method) => console[method]);
    for (const method of methods) {
      console[method] = (...args: unknown[]) => {
        lines.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg) ?? String(arg))).join(" "));
      };
    }
    const forbidden: string[] = [PASSWORD, WRONG];
    try {
      const { installed, cookies } = await signedInAccount("logs");
      forbidden.push(...Object.values(cookies), installed.env.DEPLOYMENT_KEY!);
      const on = await turnedOnByRoutes(installed.env, cookies, PASSWORD);
      forbidden.push(on.secretText, on.confirmCode, ...on.recoveryCodes, ...on.recoveryCodes.map((code) => normaliseRecoveryCode(code)!));

      const pending = await signIn(installed.env, EMAIL, PASSWORD);
      const jar = jarFrom(pending);
      forbidden.push(...Object.values(jar));
      const code = await on.codes.next();
      forbidden.push(code);
      // A wrong code first, refused and kept out of the logs too.
      const wrongCode = code === "000000" ? "111111" : "000000";
      forbidden.push(wrongCode);
      expect((await post(installed.env, SECOND_STEP_PATH, { method: "code", code: wrongCode }, { cookies: jar })).status).toBe(401);
      const withCode = await post(installed.env, SECOND_STEP_PATH, { method: "code", code }, { cookies: jar });
      expect(withCode.status).toBe(200);
      forbidden.push(...setCookiesOf(withCode).map((cookie) => cookie.value).filter((value) => value.length > 0));

      const recoveryPending = await signIn(installed.env, EMAIL, PASSWORD);
      const recoveryJar = jarFrom(recoveryPending);
      forbidden.push(...Object.values(recoveryJar));
      const withRecovery = await post(installed.env, SECOND_STEP_PATH, { method: "recovery", code: on.recoveryCodes[0]! }, { cookies: recoveryJar });
      expect(withRecovery.status).toBe(200);
      forbidden.push(...setCookiesOf(withRecovery).map((cookie) => cookie.value).filter((value) => value.length > 0));

      const freshCode = await on.codes.next();
      forbidden.push(freshCode);
      const fresh = await post(installed.env, TWO_STEP_RECOVERY_CODES_PATH, { password: PASSWORD, code: freshCode }, { cookies });
      expect(fresh.status).toBe(200);
      const freshCodes = ((await fresh.json()) as { recoveryCodes: string[] }).recoveryCodes;
      forbidden.push(...freshCodes, ...freshCodes.map((value) => normaliseRecoveryCode(value)!));

      // A key mismatch logs its one line, without key material.
      const otherKey = newDeploymentKey();
      forbidden.push(otherKey);
      expect((await keyStateOf(withKey(installed, otherKey))).key).toBe("mismatch");
      expect((await post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: WRONG }, { cookies })).status).toBe(403);
      expect((await post(installed.env, TWO_STEP_TURN_OFF_PATH, { password: PASSWORD }, { cookies })).status).toBe(200);
      const [user] = await rows(installed, "users");
      forbidden.push(String(user!.password_hash), String(user!.password_salt));
    } finally {
      methods.forEach((method, index) => (console[method] = saved[index]!));
    }
    for (const value of forbidden) {
      expect(value.length).toBeGreaterThan(0);
      for (const line of lines) expect(line).not.toContain(value);
    }
  });
});
