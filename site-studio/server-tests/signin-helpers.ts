import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { expect } from "vitest";
import { APP_HEADER, APP_HEADER_VALUE, ROUTES } from "../shared/routes";
import { base32Decode, TOTP_STEP_SECONDS, TOTP_WINDOW } from "../shared/twoStep";
import { stepAt, totpAt } from "../server/auth/totp";
import { hashQueue } from "../server/auth/password";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import type { Installation } from "../server/installation/Installation";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";
import type { PasswordHash } from "../server/auth/password";

// Shared by the story 1.3 route suites (spec 2): an installation object of the test's own, request
// builders for the three sign-in routes, cookie parsing and the refusal check. No real code,
// password or address is used; every value is made up for the test.

export const ORIGIN = "https://survey.acme.test";
export const SESSION_PATH = "/api/v1/session";
export const SIGN_IN_PATH = "/api/v1/session/sign-in";
export const SIGN_OUT_PATH = "/api/v1/session/sign-out";
export const SETUP_PATH = "/api/v1/setup";

export type Wrap = (operation: string, init: RequestInit | undefined, send: (init?: RequestInit) => Promise<Response>) => Promise<Response>;

export interface Installed {
  env: Env;
  stub: DurableObjectStub<Installation>;
  /** Calls to each object operation, by name. */
  calls: Map<string, number>;
  setupCode: string;
}

export function randomCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(18))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** An environment whose installation object belongs to this test alone, with its own set-up code. */
export function installationFor(name: string, wrap?: Wrap): Installed {
  const calls = new Map<string, number>();
  const scoped = (objectName: string) => env.INSTALLATION.idFromName(`signin-routes:${name}:${objectName}`);
  const namespace = {
    idFromName: scoped,
    get: (id: DurableObjectId) => {
      const real = env.INSTALLATION.get(id);
      return {
        fetch: (input: string, init?: RequestInit) => {
          const operation = new URL(input).pathname.slice(1);
          calls.set(operation, (calls.get(operation) ?? 0) + 1);
          const send = (changed?: RequestInit) => real.fetch(input, changed ?? init);
          return wrap ? wrap(operation, init, send) : send();
        },
      };
    },
  };
  const setupCode = randomCode();
  const scopedEnv = { ...env, INSTALLATION: namespace, SETUP_CODE: setupCode } as unknown as Env;
  return { env: scopedEnv, stub: env.INSTALLATION.get(scoped("installation")), calls, setupCode };
}

export interface RequestOptions {
  /** `null` sends none. Defaults to the app's origin. */
  origin?: string | null;
  /** `null` sends none. Defaults to the app's header value. */
  header?: string | null;
  /** `CF-Connecting-IP`; none by default (the unknown address). */
  address?: string;
  /** Cookies to send, by name. */
  cookies?: Record<string, string>;
  /** Marks the request as arriving over TLS on Cloudflare, so the reply goes through the HSTS copy. */
  https?: boolean;
}

function headersFor(options: RequestOptions, json: boolean): Record<string, string> {
  const headers: Record<string, string> = json ? { "content-type": "application/json" } : {};
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  const header = options.header === undefined ? APP_HEADER_VALUE : options.header;
  if (origin !== null) headers.origin = origin;
  if (header !== null) headers[APP_HEADER] = header;
  if (options.address) headers["cf-connecting-ip"] = options.address;
  if (options.cookies && Object.keys(options.cookies).length > 0) {
    headers.cookie = Object.entries(options.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
  return headers;
}

function build(url: string, init: RequestInit, https?: boolean): Request {
  return https ? new Request(url, { ...init, cf: { tlsVersion: "TLSv1.3" } } as RequestInit) : new Request(url, init);
}

export function post(target: Env, path: string, body: unknown, options: RequestOptions = {}): Promise<Response> {
  const init = { method: "POST", headers: headersFor(options, true), body: JSON.stringify(body) };
  return handleRequest(build(ORIGIN + path, init, options.https), target);
}

export function get(target: Env, path: string, options: RequestOptions = {}): Promise<Response> {
  // A plain GET from the page: no Origin, no app header.
  const headers = headersFor({ origin: null, header: null, ...options }, false);
  return handleRequest(build(ORIGIN + path, { headers }, options.https), target);
}

export function signIn(target: Env, email: string, password: string, options: RequestOptions = {}): Promise<Response> {
  return post(target, SIGN_IN_PATH, { email, password }, options);
}

export function signOut(target: Env, options: RequestOptions = {}): Promise<Response> {
  return post(target, SIGN_OUT_PATH, {}, options);
}

export function readSession(target: Env, options: RequestOptions = {}): Promise<Response> {
  return get(target, SESSION_PATH, options);
}

export interface ParsedCookie {
  name: string;
  value: string;
  /** Attribute names in lower case; flags map to `true`. */
  attributes: Record<string, string | true>;
  line: string;
}

export function parseSetCookie(line: string): ParsedCookie {
  const [pair, ...rest] = line.split(";");
  const equals = pair!.indexOf("=");
  const attributes: Record<string, string | true> = {};
  for (const part of rest) {
    const text = part.trim();
    if (!text) continue;
    const at = text.indexOf("=");
    if (at === -1) attributes[text.toLowerCase()] = true;
    else attributes[text.slice(0, at).trim().toLowerCase()] = text.slice(at + 1).trim();
  }
  return { name: pair!.slice(0, equals).trim(), value: pair!.slice(equals + 1).trim(), attributes, line };
}

export function setCookiesOf(response: Response): ParsedCookie[] {
  return response.headers.getSetCookie().map(parseSetCookie);
}

/** The cookies a browser would keep from a reply: set ones by name, cleared ones removed. */
export function jarFrom(response: Response, jar: Record<string, string> = {}): Record<string, string> {
  const next = { ...jar };
  for (const cookie of setCookiesOf(response)) {
    if (cookie.attributes["max-age"] === "0") delete next[cookie.name];
    else next[cookie.name] = cookie.value;
  }
  return next;
}

/** Signs in and answers the browser's cookies, failing the test unless the reply is 200. */
export async function signedIn(target: Env, email: string, password: string, options: RequestOptions = {}): Promise<Record<string, string>> {
  const response = await signIn(target, email, password, options);
  expect(response.status, await response.clone().text()).toBe(200);
  return jarFrom(response, options.cookies);
}

/** Completes set-up through its route, so the administrator's password is hashed as in production. */
export async function completeSetup(
  installed: Installed,
  account: { email: string; password: string; name?: string; installationName?: string },
): Promise<void> {
  const response = await post(installed.env, SETUP_PATH, {
    code: installed.setupCode,
    installationName: account.installationName ?? "Acme Security",
    name: account.name ?? "Dana Admin",
    email: account.email,
    password: account.password,
  });
  expect(response.status, await response.clone().text()).toBe(200);
}

/**
 * Adds an account straight to the users table with a given hash, and names the installation, so a
 * suite pays for one scrypt hash however many accounts it needs.
 */
export async function seedAccount(
  stub: DurableObjectStub<Installation>,
  account: { email: string; hash: PasswordHash; name?: string; active?: 0 | 1 },
): Promise<string> {
  const id = crypto.randomUUID();
  await runInDurableObject(stub, (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r, password_p,
         password_key_length, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, 'administrator', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      account.email,
      account.name ?? "Dana Admin",
      account.active ?? 1,
      account.hash.algorithm,
      account.hash.n,
      account.hash.r,
      account.hash.p,
      account.hash.keyLength,
      account.hash.salt,
      account.hash.hash,
      new Date().toISOString(),
    );
    state.storage.sql.exec(
      `INSERT OR IGNORE INTO ${SETTINGS_TABLE} (id, installation_name, public_address, set_up_at) VALUES (1, 'Acme Security', ?, ?)`,
      ORIGIN,
      new Date().toISOString(),
    );
  });
  return id;
}

/** The refusal's error, after checking that neither its text nor its headers carry an entered value. */
export async function refusalOf(response: Response, entered: string[]) {
  const text = await response.text();
  const headers = [...response.headers.entries()].flat().join(" ");
  for (const value of entered) {
    expect(text).not.toContain(value);
    expect(headers).not.toContain(value);
  }
  const body = JSON.parse(text) as { error: { code: string; message: string; field?: string; retryAfterSeconds?: number } };
  expect(Object.keys(body)).toEqual(["error"]);
  return body.error;
}

/** Everything a reply shows a client: status, headers and body text. */
export async function wholeReply(response: Response): Promise<{ status: number; headers: [string, string][]; body: string }> {
  return { status: response.status, headers: [...response.headers.entries()].sort(), body: await response.text() };
}

// Two-step verification through the routes (story 1.5, spec 4). Codes are computed at run time from
// the secret the start reply answered; nothing is written to a file.

export const SECOND_STEP_PATH = ROUTES.secondStep.path;
export const TWO_STEP_PATH = ROUTES.twoStepState.path;
export const TWO_STEP_START_PATH = ROUTES.twoStepStart.path;
export const TWO_STEP_CONFIRM_PATH = ROUTES.twoStepConfirm.path;
export const TWO_STEP_TURN_OFF_PATH = ROUTES.twoStepTurnOff.path;
export const TWO_STEP_RECOVERY_CODES_PATH = ROUTES.twoStepRecoveryCodes.path;
export const KEY_STATE_PATH = ROUTES.deploymentKeyState.path;

/** Waits, when the clock is within two seconds of a 30-second step's end, until the next step begins. */
export async function awayFromStepEnd(): Promise<void> {
  const into = Date.now() % (TOTP_STEP_SECONDS * 1000);
  const left = TOTP_STEP_SECONDS * 1000 - into;
  if (left < 2000) await new Promise((resolve) => setTimeout(resolve, left + 50));
}

/**
 * Codes for one account, each of a step later than the last one used (D-6) and inside the window:
 * the later of the next unused step and the current one. Throws when the next unused step is
 * already ahead of the window, so a test that uses too many codes says so instead of failing oddly.
 */
export function codeSource(secret: Uint8Array, lastStep: number) {
  let last = lastStep;
  return {
    async next(): Promise<string> {
      const now = stepAt(Date.now());
      const step = Math.max(last + 1, now);
      if (step > now + TOTP_WINDOW) throw new Error("No unused step is inside the window: the test used too many codes.");
      last = step;
      return totpAt(secret, step);
    },
  };
}

export interface StartedByRoutes {
  setupId: string;
  /** The start reply's secret as text (base32), as the page shows it. */
  secretText: string;
  secret: Uint8Array;
  reply: Record<string, unknown>;
}

/** Starts a set-up through the start route with the password, failing the test unless it answers 200. */
export async function startedByRoutes(target: Env, cookies: Record<string, string>, password: string): Promise<StartedByRoutes> {
  const response = await post(target, TWO_STEP_START_PATH, { password }, { cookies });
  expect(response.status, await response.clone().text()).toBe(200);
  const reply = (await response.json()) as { setupId: string; secret: string };
  return { setupId: reply.setupId, secretText: reply.secret, secret: base32Decode(reply.secret)!, reply };
}

export interface TurnedOnByRoutes extends StartedByRoutes {
  /** The ten recovery codes the confirm reply answered, formatted. */
  recoveryCodes: string[];
  /** The code the confirm sent. */
  confirmCode: string;
  /** Codes for the account from the step after the one the confirm used. */
  codes: ReturnType<typeof codeSource>;
}

/**
 * Turns two-step verification on through the start and confirm routes. The confirm uses the code of
 * the step before the current one (inside the window), so two more codes are usable at once.
 */
export async function turnedOnByRoutes(target: Env, cookies: Record<string, string>, password: string): Promise<TurnedOnByRoutes> {
  const started = await startedByRoutes(target, cookies, password);
  await awayFromStepEnd();
  const step = stepAt(Date.now()) - TOTP_WINDOW;
  const confirmCode = await totpAt(started.secret, step);
  const response = await post(target, TWO_STEP_CONFIRM_PATH, { setupId: started.setupId, code: confirmCode }, { cookies });
  expect(response.status, await response.clone().text()).toBe(200);
  const { recoveryCodes } = (await response.json()) as { recoveryCodes: string[] };
  return { ...started, recoveryCodes, confirmCode, codes: codeSource(started.secret, step) };
}

/** Holds the isolate's hash queue's running slot (nothing waiting) until released. */
export function holdHashSlot() {
  let release!: () => void;
  const running = hashQueue.run(() => new Promise<void>((resolve) => (release = resolve)));
  expect(hashQueue.stats().active).toBe(1);
  return async () => {
    release();
    await running;
  };
}

export async function until(condition: () => boolean, what: string) {
  const deadline = Date.now() + 10_000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}.`);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/**
 * A POST from the app, with the browser's cookies, that is aborted while it waits in the hash
 * queue, as a client disconnecting does; answers its reply.
 */
export async function abortedWhileQueued(target: Env, path: string, body: unknown, cookies: Record<string, string> = {}): Promise<Response> {
  const release = holdHashSlot();
  const controller = new AbortController();
  try {
    const waitingBefore = hashQueue.stats().waiting;
    const headers: Record<string, string> = { "content-type": "application/json", origin: ORIGIN, [APP_HEADER]: APP_HEADER_VALUE };
    const cookie = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    if (cookie) headers.cookie = cookie;
    const pending = handleRequest(new Request(ORIGIN + path, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal }), target);
    await until(() => hashQueue.stats().waiting === waitingBefore + 1, "the request to wait in the hash queue");
    controller.abort();
    expect(hashQueue.stats().waiting).toBe(waitingBefore);
    return await pending;
  } finally {
    await release();
  }
}
