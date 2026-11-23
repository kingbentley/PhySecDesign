// Helpers for the two-step verification browser tests (story 1.5, spec 7, finding 15). Kept out of
// any *.spec.mjs file, which Playwright would register as tests. The codes are computed here by an
// RFC 6238 implementation of the tests' own on Node's `crypto`, written independently of shared/
// and the server, from the key the page shows or, for "turn on through the API", from the start
// reply. Nothing here prints or writes a key, a code or a password.
import { createHmac } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const APP = { "x-site-survey-design": "1" };
const STEP_SECONDS = 30;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32 (either case, spaces ignored, no padding) to bytes. */
export function base32Bytes(text) {
  const clean = text.replace(/\s/g, "").toUpperCase();
  let buffer = 0;
  let bits = 0;
  const bytes = [];
  for (const character of clean) {
    const value = BASE32.indexOf(character);
    if (value < 0) throw new Error("The key is not base32.");
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
    buffer &= (1 << bits) - 1;
  }
  return Buffer.from(bytes);
}

/** The time step of `ms` (Unix milliseconds): RFC 6238 with T0 = 0 and X = 30 seconds. */
export function stepAt(ms = Date.now()) {
  return Math.floor(ms / 1000 / STEP_SECONDS);
}

/** The 6-digit code of time step `step` for the base32 `key` (RFC 4226 over RFC 6238, HMAC-SHA-1). */
export function codeForStep(key, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", base32Bytes(key)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

/** The current code and its step for `key`. */
export function currentCode(key) {
  const step = stepAt();
  return { step, code: codeForStep(key, step) };
}

/**
 * Waits until the time step is later than `step` (a code accepted at `step` is refused again in
 * the same window, D-6), then answers the current code and its step. At most 30 seconds.
 */
export async function nextCode(key, step) {
  while (stepAt() <= step) await sleep(250);
  return currentCode(key);
}

/** A code that is never valid around now: the one of a step an hour away, unless it happens to match. */
export function wrongCode(key) {
  const now = stepAt();
  const near = new Set([now - 1, now, now + 1].map((step) => codeForStep(key, step)));
  for (let offset = 120; ; offset += 1) {
    const code = codeForStep(key, now + offset);
    if (!near.has(code)) return code;
  }
}

/**
 * Turns two-step verification on through the API for the session `request` holds (a browser
 * context's request shares its cookies). Answers `{ secret, otpauthUri, recoveryCodes, step }`;
 * `step` is the time step of the code that confirmed it.
 */
export async function turnOnThroughApi(request, origin, password) {
  const headers = { origin, ...APP };
  const start = await request.post(`${origin}/api/v1/account/two-step/start`, { headers, data: { password } });
  if (start.status() !== 200) throw new Error(`Starting the set-up through the API answered ${start.status()}.`);
  const { setupId, secret, otpauthUri } = await start.json();
  const { step, code } = currentCode(secret);
  const confirm = await request.post(`${origin}/api/v1/account/two-step/confirm`, { headers, data: { setupId, code } });
  if (confirm.status() !== 200) throw new Error(`Confirming the set-up through the API answered ${confirm.status()}.`);
  const { recoveryCodes } = await confirm.json();
  return { secret, otpauthUri, recoveryCodes, step };
}

/**
 * Signs in with the password and then a recovery code, from a new request context with no cookies
 * (another browser). Answers the second step's status and parsed body; the context is disposed.
 */
export async function signInWithRecoveryCode(playwright, origin, { email, password }, recoveryCode) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const headers = { origin, ...APP };
    const first = await api.post(`${origin}/api/v1/session/sign-in`, { headers, data: { email, password } });
    if (first.status() !== 200) throw new Error(`Signing in through the API answered ${first.status()}.`);
    const reply = await first.json();
    if (reply.secondStep !== true) throw new Error("Signing in through the API did not ask for a second step.");
    const second = await api.post(`${origin}/api/v1/session/second-step`, { headers, data: { method: "recovery", code: recoveryCode } });
    let body = null;
    try { body = await second.json(); } catch { body = null; }
    return { status: second.status(), body };
  } finally {
    await api.dispose();
  }
}

// The helpers below were added for the second-step page's tests (story 1.5, spec 8). They repeat
// what two-step.spec.mjs keeps for itself (finding 15: a spec file never imports another), so that
// file is left as it is.

/** signin.spec.mjs's administrator, so whichever file runs first sets the server up the same way. */
export const SIGN_IN_ADMIN = {
  installationName: "Harbourside Facilities",
  name: "Robin Example",
  email: "robin.admin@harbourside.example",
  password: "a long and correct sign-in passphrase",
};

/**
 * An email no other spec uses: `label`, the project and, under `--repeat-each`, the repeat, so each
 * test's account is its own. `suffix` names the spec, for example "secondstep".
 */
export function emailFor(label, testInfo, suffix) {
  const repeat = testInfo.repeatEachIndex ? `.r${testInfo.repeatEachIndex}` : "";
  return `${label}.${testInfo.project.name}${repeat}.${suffix}@harbourside.example`;
}

/** Completes set-up through the API with SIGN_IN_ADMIN, unless it is already complete. */
export async function completeSetupThroughApi(request, server) {
  const state = await request.get(`${server.origin}/api/v1/setup/state`);
  if ((await state.json()).state === "closed") return;
  const reply = await request.post(`${server.origin}/api/v1/setup`, {
    headers: { origin: server.origin, ...APP },
    data: {
      code: server.code,
      installationName: SIGN_IN_ADMIN.installationName,
      name: SIGN_IN_ADMIN.name,
      email: SIGN_IN_ADMIN.email,
      password: SIGN_IN_ADMIN.password,
    },
  });
  if (reply.status() !== 200) throw new Error(`Set-up through the API answered ${reply.status()}.`);
}

/**
 * Makes a standard account through an invitation, from separate request contexts (the administrator's
 * and the new person's), so the test's browser holds no session or marker for it. With `twoStep`,
 * also turns two-step verification on through the API. Answers `{ email, name, password }` and, with
 * `twoStep`, `secret`, `recoveryCodes` and `step` (the time step of the code that confirmed it).
 */
export async function accountThroughApi(playwright, origin, { email, name, password, twoStep = true }) {
  const admin = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  let link;
  try {
    const signIn = await admin.post(`${origin}/api/v1/session/sign-in`, {
      headers: { origin, ...APP },
      data: { email: SIGN_IN_ADMIN.email, password: SIGN_IN_ADMIN.password },
    });
    if (signIn.status() !== 200) throw new Error(`The administrator's sign-in through the API answered ${signIn.status()}.`);
    const invite = await admin.post(`${origin}/api/v1/invitations`, { headers: { origin, ...APP }, data: { email, name, role: "standard" } });
    if (invite.status() !== 200) throw new Error(`Inviting through the API answered ${invite.status()}.`);
    ({ link } = await invite.json());
  } finally {
    await admin.dispose();
  }
  const person = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const accept = await person.post(`${origin}/api/v1/invitations/accept`, {
      headers: { origin, ...APP },
      data: { secret: new URL(link).hash.slice(1), name, password },
    });
    if (accept.status() !== 200) throw new Error(`Accepting through the API answered ${accept.status()}.`);
    if (!twoStep) return { email, name, password };
    const on = await turnOnThroughApi(person, origin, password);
    return { email, name, password, secret: on.secret, recoveryCodes: on.recoveryCodes, step: on.step };
  } finally {
    await person.dispose();
  }
}

/** Fails on any serious or critical axe violation (standing rule 15). */
export async function expectAccessible(page, include) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  let builder = new AxeBuilder({ page });
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  if (serious.length > 0) throw new Error(`Serious or critical axe violations: ${serious.join("; ")}`);
}

/**
 * Starts watching for an element to appear, as two-step.spec.mjs's watch does: a heading (h1 to h4)
 * with exactly `text`, the role "alert" region once it holds exactly `text`, or (kind "field") an
 * input whose label reads exactly `text`. When it first appears, records whether it already has
 * focus. A MutationObserver callback runs right after the task that changed the page, so focus moved
 * in the same task (a layout effect) is seen, and focus moved later (a passive effect) is not; this
 * tells the two apart for an element shown after an `await` (a reply). An element already shown
 * when the watch begins records a failing value.
 */
export async function watchFocusOnAppear(page, kind, text) {
  await page.evaluate(({ kind: watched, text: wanted }) => {
    const seen = (window.__focusOnAppear ??= {});
    const observers = (window.__focusObservers ??= {});
    observers[wanted]?.disconnect();
    delete seen[wanted];
    const find = () => {
      if (watched === "heading") return [...document.querySelectorAll("h1, h2, h3, h4")].find((element) => element.textContent === wanted);
      if (watched === "field") {
        return [...document.querySelectorAll("input, textarea")].find((element) =>
          [...(element.labels ?? [])].some((label) => label.textContent === wanted));
      }
      return [...document.querySelectorAll('[role="alert"]')].find((element) => element.textContent === wanted);
    };
    if (find()) {
      seen[wanted] = "already shown when the watch began";
      return;
    }
    const observer = new MutationObserver(() => {
      const element = find();
      if (!element) return;
      seen[wanted] = document.activeElement === element;
      observer.disconnect();
      delete observers[wanted];
    });
    observers[wanted] = observer;
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }, { kind, text });
}

/** What `watchFocusOnAppear` recorded for `text`: true, false, a reason it could not pass, or undefined if it never appeared. */
export async function focusedOnAppear(page, text) {
  return page.evaluate((wanted) => window.__focusOnAppear?.[wanted], text);
}

/** Signs in with the password alone from a new request context; answers the status and parsed body. */
export async function signInWithPassword(playwright, origin, { email, password }) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const reply = await api.post(`${origin}/api/v1/session/sign-in`, { headers: { origin, ...APP }, data: { email, password } });
    let body = null;
    try { body = await reply.json(); } catch { body = null; }
    return { status: reply.status(), body };
  } finally {
    await api.dispose();
  }
}
