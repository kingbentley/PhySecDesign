import { expect, test } from "@playwright/test";
import { signInServers } from "./playwright.config.mjs";
import {
  SIGN_IN_ADMIN,
  accountThroughApi,
  completeSetupThroughApi,
  emailFor as emailWith,
  expectAccessible,
  focusedOnAppear,
  nextCode,
  watchFocusOnAppear,
  wrongCode,
} from "./two-step-helpers.mjs";

// The sign-in page's second step (story 1.5, spec 8; CAP-2's recovery-code sign-in, CAP-3, CAP-4,
// CAP-13, CAP-14; D-3, D-13) against the real built Worker, which has a per-run test deployment key
// (finding 17). The tests use the first sign-in server of each project, set up with signin.spec.mjs's
// administrator, never the baseURL server. Each account is made, and two-step verification turned
// on, from separate request contexts, so the browser signs in through the page. Each email is used
// by no other spec and is distinct per project. Codes are computed by the tests' own RFC 6238 helper
// and never printed. Each test opens one address.
//
// Each test's page sends its own `CF-Connecting-IP` (`addressFor`), distinct per test and per
// repeat. Without one, the local runtime (Miniflare) sets the header to the client's own address,
// 127.0.0.1, so every browser test's failures would share one known address and its 20-failure
// limit (CA-05): the second steps these tests leave unfinished pushed a later file's tests on the
// same server over it (the build session's full run, 2026-11-23).

// Serial, as each server holds one installation. Each sign-in runs a deliberately slow scrypt hash.
test.describe.configure({ mode: "serial", timeout: 120_000 });

const PASSWORD = "a second-step tester's long passphrase";
const SECOND_STEP_PATH = "/api/v1/session/second-step";
const SESSION_COOKIE = /^__Host-ssd-[0-9a-f]{32}$/;
const PENDING_COOKIE = /^__Host-ssd-p-[0-9a-f]{32}$/;
const HEADING = "Two-step verification";
const CODE_LEAD = `Open your authenticator app and enter the 6-digit code for ${SIGN_IN_ADMIN.installationName}.`;
const RECOVERY_LEAD = "Enter one of the recovery codes you saved when you turned on two-step verification. Each code works once.";
const CODE_WRONG = "That code does not match or was already used. Wait for the next code in your authenticator app and try again.";
const RECOVERY_WRONG = "That recovery code does not match, or it has already been used.";
const EXPIRED = "This sign-in has expired. Sign in again with your email and password.";
const MISMATCH =
  "Two-step verification cannot be checked on this installation: its deployment key does not match the one its secrets were saved with. Ask an administrator to deploy it again with the original key.";
const RECOVERY_LINE = "You can still sign in with a recovery code.";
const CODE_FIELD_MESSAGE = "Enter the 6 digits from your authenticator app.";
const RECOVERY_FIELD_MESSAGE = "Enter a recovery code: 16 letters and digits.";

const servers = (testInfo) => signInServers(testInfo.project.name);
const emailFor = (label, testInfo) => emailWith(label, testInfo, "secondstep");

const signInHeading = (page) => page.getByRole("heading", { name: `Sign in to ${SIGN_IN_ADMIN.installationName}` });
const secondHeading = (page) => page.getByRole("heading", { name: HEADING });
const codeField = (page) => page.getByLabel("Code", { exact: true });
const recoveryField = (page) => page.getByLabel("Recovery code", { exact: true });
const passwordField = (page) => page.getByLabel("Password", { exact: true });

async function cookiesNamed(context, pattern) {
  return (await context.cookies()).filter((cookie) => pattern.test(cookie.name));
}

/** Checks that `actual` equals `expected` without printing either on failure. */
function expectSecretEqual(actual, expected, what) {
  expect(String(actual) === String(expected), what).toBe(true);
}

/**
 * Fills the password form on the page and signs in; with `watchHeading`, also records whether the
 * second step's heading has focus as it appears (it shows after the sign-in reply).
 */
async function passwordStep(page, account, { watchHeading = false } = {}) {
  await page.getByLabel("Email").fill(account.email);
  await passwordField(page).fill(account.password);
  if (watchHeading) await watchFocusOnAppear(page, "heading", HEADING);
  const reply = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-in");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await reply;
}

/** Opens the sign-in page once and completes the password step, ending on the second step. */
async function openSecondStep(page, origin, account, options) {
  await page.goto(`${origin}/`);
  await expect(signInHeading(page)).toBeVisible();
  await passwordStep(page, account, options);
  await expect(secondHeading(page)).toBeVisible();
}

/** Submits the shown second-step form and waits for its reply; answers the reply's status. */
async function submitAndWait(page, button) {
  const reply = page.waitForResponse((response) => new URL(response.url()).pathname === SECOND_STEP_PATH);
  await page.getByRole("button", { name: button, exact: true }).click();
  return (await reply).status();
}

/** Records every request to the second-step route, for the "no request" rows. */
function countSecondStepRequests(page) {
  const sent = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === SECOND_STEP_PATH) sent.push(request.method());
  });
  return sent;
}

/** The second step's targets are 44 px tall (standing rule 5). */
async function expectTarget(locator) {
  const box = await locator.boundingBox();
  expect(box.height, "target height").toBeGreaterThanOrEqual(44);
}

/** A private address of the test's own, from its line in this file and its repeat index. */
const addressFor = (testInfo) => `10.${testInfo.repeatEachIndex % 256}.${testInfo.line >> 8}.${testInfo.line & 255}`;

test.beforeEach(async ({ page, request }, testInfo) => {
  await completeSetupThroughApi(request, servers(testInfo)[0]);
  await page.setExtraHTTPHeaders({ "CF-Connecting-IP": addressFor(testInfo) });
});

test("Password, two-step on, Code, Phone attributes, axe (code mode): the right password shows the second step with no session, and a current code typed with a space opens the app", async ({ page, context, playwright }, testInfo) => {
  test.setTimeout(150_000);
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("code", testInfo), name: "Cora Code", password: PASSWORD });
  await openSecondStep(page, server.origin, account, { watchHeading: true });
  expect(await focusedOnAppear(page, HEADING), "the second step's heading has focus as it appears").toBe(true);
  await expect(secondHeading(page)).toBeFocused();
  await expect(page.getByText(CODE_LEAD)).toBeVisible();
  // No account menu, no session and no marker: only the pending cookie (criterion 3).
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
  expect(await cookiesNamed(context, PENDING_COOKIE)).toHaveLength(1);
  // The password is gone from the page: no password field, and nothing on the page holds it.
  await expect(passwordField(page)).toHaveCount(0);
  expect(await page.evaluate((typed) => [...document.querySelectorAll("input")].some((input) => input.value === typed), PASSWORD)).toBe(false);

  // Phone attributes (CAP-13, criterion 27's automated part), asserted in both projects.
  const field = codeField(page);
  await expect(field).toHaveAttribute("type", "text");
  await expect(field).toHaveAttribute("inputmode", "numeric");
  await expect(field).toHaveAttribute("autocomplete", "one-time-code");
  await expect(field).toHaveAttribute("pattern", "[0-9]*");
  await expect(field).toHaveAttribute("maxlength", "12");
  await expect(field).toHaveCSS("font-size", "16px");
  await expect(field).toHaveAccessibleDescription("6 digits. Spaces are ignored.");
  expect(await field.evaluate((element) => element.form.noValidate)).toBe(true);
  for (const name of ["Verify and sign in", "Use a recovery code", "Back to sign in"]) await expectTarget(page.getByRole("button", { name, exact: true }));
  await expectAccessible(page);

  // The set-up confirmed a code at `account.step`; a code is accepted only for a later step (D-6).
  const { code } = await nextCode(account.secret, account.step);
  await field.fill(`${code.slice(0, 3)} ${code.slice(3)}`);
  const sending = page.waitForResponse((response) => new URL(response.url()).pathname === SECOND_STEP_PATH);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  expect((await sending).status()).toBe(200);
  await expect(page.getByTestId("account-name")).toHaveText(account.name);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toHaveLength(1);
  expect(await cookiesNamed(context, PENDING_COOKIE)).toEqual([]);
});

test("Wrong code, Wrong codes to the wait, axe (a refusal shown): a wrong code stays with the field kept, a mode switch clears the alert, and the fourth wrong code returns to the password form with the wait", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("wrong", testInfo), name: "Will Wrong", password: PASSWORD });
  await openSecondStep(page, server.origin, account);
  const wrong = wrongCode(account.secret);
  const alert = page.getByRole("alert");
  // An ordinary refusal sends no sign-out (only a failed session read does; review round 4).
  const signOuts = countRequests(page, "/api/v1/session/sign-out");

  await codeField(page).fill(wrong);
  await watchFocusOnAppear(page, "alert", CODE_WRONG);
  expect(await submitAndWait(page, "Verify and sign in")).toBe(401);
  await expect(alert).toHaveText(CODE_WRONG);
  expect(await focusedOnAppear(page, CODE_WRONG), "the refusal's alert has focus as it appears").toBe(true);
  await expect(alert).toBeFocused();
  await expect(secondHeading(page)).toBeVisible();
  expectSecretEqual(await codeField(page).inputValue(), wrong, "the field keeps the code for correction");
  await expectAccessible(page);

  // A mode switch clears the alert; switching back keeps the code field's value.
  await page.getByRole("button", { name: "Use a recovery code" }).click();
  await expect(page.locator('[role="alert"]')).toHaveText("");
  await page.getByRole("button", { name: "Use a code from your authenticator app" }).click();
  await expect(codeField(page)).toBeVisible();

  // The password attempt counted once and cleared nothing (D-4); wrong codes two and three are
  // refused as wrong, and the fourth starts the wait (finding 3).
  for (const attempt of [2, 3]) {
    expect(await submitAndWait(page, "Verify and sign in"), `wrong code ${attempt}`).toBe(401);
    await expect(alert).toHaveText(CODE_WRONG);
    await expect(alert).toBeFocused();
    await expect(secondHeading(page)).toBeVisible();
  }
  await afterFrames(page);
  expect(signOuts, "no sign-out after a wrong code").toEqual([]);
  expect(await submitAndWait(page, "Verify and sign in"), "wrong code 4").toBe(429);
  await expect(signInHeading(page)).toBeVisible();
  await expect(alert).toHaveText(/^Too many attempts\. Wait .+ before trying again\.$/);
  await expect(alert).toBeFocused();
  await expect(page.getByLabel("Email")).toHaveValue(account.email);
  await expect(passwordField(page)).toHaveValue("");
  await expect(codeField(page)).toHaveCount(0);
});

test("Recovery code, Recovery code reused, axe (recovery mode): a saved code in upper case signs in, and the same code is refused at a later sign-in", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("recovery", testInfo), name: "Rhea Recovery", password: PASSWORD });
  const saved = account.recoveryCodes[0];
  await openSecondStep(page, server.origin, account);

  // The mode switch shows the recovery field with focus already on it, and back again.
  await watchFocusOnAppear(page, "field", "Recovery code");
  await page.getByRole("button", { name: "Use a recovery code" }).click();
  await expect(recoveryField(page)).toBeVisible();
  expect(await focusedOnAppear(page, "Recovery code"), "the recovery field has focus as it appears").toBe(true);
  await expect(recoveryField(page)).toBeFocused();
  await watchFocusOnAppear(page, "field", "Code");
  await page.getByRole("button", { name: "Use a code from your authenticator app" }).click();
  await expect(codeField(page)).toBeVisible();
  expect(await focusedOnAppear(page, "Code"), "the code field has focus as it appears").toBe(true);
  await page.getByRole("button", { name: "Use a recovery code" }).click();

  await expect(page.getByText(RECOVERY_LEAD)).toBeVisible();
  const field = recoveryField(page);
  await expect(field).toHaveAttribute("type", "text");
  await expect(field).toHaveAttribute("autocomplete", "off");
  await expect(field).toHaveAttribute("autocapitalize", "none");
  await expect(field).toHaveAttribute("spellcheck", "false");
  await expect(field).toHaveCSS("font-size", "16px");
  expect(await field.evaluate((element) => element.form.noValidate)).toBe(true);
  for (const name of ["Sign in with recovery code", "Use a code from your authenticator app", "Back to sign in"]) {
    await expectTarget(page.getByRole("button", { name, exact: true }));
  }
  await expectAccessible(page);

  await field.fill(saved.toUpperCase());
  expect(await submitAndWait(page, "Sign in with recovery code")).toBe(200);
  await expect(page.getByTestId("account-name")).toHaveText(account.name);

  // A later sign-in, after signing out, with the same code (criterion 6).
  await page.locator(".account-trigger").click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await passwordStep(page, account);
  await expect(secondHeading(page)).toBeVisible();
  await page.getByRole("button", { name: "Use a recovery code" }).click();
  await recoveryField(page).fill(saved);
  expect(await submitAndWait(page, "Sign in with recovery code")).toBe(401);
  await expect(page.getByRole("alert")).toHaveText(RECOVERY_WRONG);
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(secondHeading(page)).toBeVisible();
  await expect(page.getByTestId("account-name")).toHaveCount(0);
});

test("Bad shape, Back to sign in: a 5-digit code and a 15-character recovery code send no request, and Back to sign in returns to the password form without one", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("shape", testInfo), name: "Shay Shape", password: PASSWORD });
  await openSecondStep(page, server.origin, account);
  const sent = countSecondStepRequests(page);
  // Back with nothing in flight sends no request at all, not even a sign-out (spec 8's note on the
  // frozen block's reading, orchestrator ruling of 2026-11-24).
  const signOuts = countRequests(page, "/api/v1/session/sign-out");

  await codeField(page).fill("12345");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByText(CODE_FIELD_MESSAGE)).toBeVisible();
  await expect(codeField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(codeField(page)).toBeFocused();
  await expect(codeField(page)).toHaveAccessibleDescription(`${CODE_FIELD_MESSAGE} 6 digits. Spaces are ignored.`);

  await page.getByRole("button", { name: "Use a recovery code" }).click();
  await expect(page.getByText(CODE_FIELD_MESSAGE)).toHaveCount(0);
  await recoveryField(page).fill("abcd-efgh-jkmn-pqr");
  await page.getByRole("button", { name: "Sign in with recovery code" }).click();
  await expect(page.getByText(RECOVERY_FIELD_MESSAGE)).toBeVisible();
  await expect(recoveryField(page)).toBeFocused();
  await expect(recoveryField(page)).toHaveAccessibleDescription(RECOVERY_FIELD_MESSAGE);

  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(account.email);
  await expect(passwordField(page)).toHaveValue("");
  await expect(passwordField(page)).toBeFocused();
  await expect(page.locator('[role="alert"]')).toHaveText("");
  await afterFrames(page);
  expect(sent, "no second-step request was sent").toEqual([]);
  expect(signOuts, "Back with nothing in flight sends no sign-out").toEqual([]);
});

test("Expired: with the pending cookie removed, a code returns to the password form with the expired message", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("expired", testInfo), name: "Ezra Expired", password: PASSWORD });
  await openSecondStep(page, server.origin, account);
  expect(await cookiesNamed(context, PENDING_COOKIE)).toHaveLength(1);
  // As if the second step were sent from another browser: only the pending cookie is removed.
  await context.clearCookies({ name: PENDING_COOKIE });
  expect(await cookiesNamed(context, PENDING_COOKIE)).toEqual([]);
  await codeField(page).fill(wrongCode(account.secret));
  await watchFocusOnAppear(page, "alert", EXPIRED);
  expect(await submitAndWait(page, "Verify and sign in")).toBe(401);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(EXPIRED);
  expect(await focusedOnAppear(page, EXPIRED), "the expired message's alert has focus as it appears").toBe(true);
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page.getByLabel("Email")).toHaveValue(account.email);
  await expect(passwordField(page)).toHaveValue("");
});

test("Invalid code from the server, Key mismatch (replies mocked): invalid_input naming code marks the field; the mismatch message and the recovery line show, the page switches to recovery mode with focus on its field, and the sent code is cleared", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("mismatch", testInfo), name: "Mona Mismatch", password: PASSWORD });
  const replies = [
    { status: 400, body: { error: { code: "invalid_input", message: "The request is not valid.", field: "code" } } },
    { status: 503, body: { error: { code: "deployment_key_mismatch", message: MISMATCH } } },
  ];
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, (route) => {
    const { status, body } = replies.shift();
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await openSecondStep(page, server.origin, account);

  // The server refuses the field's form: the page words it under the field.
  await codeField(page).fill(wrongCode(account.secret));
  expect(await submitAndWait(page, "Verify and sign in")).toBe(400);
  await expect(page.getByText(CODE_FIELD_MESSAGE)).toBeVisible();
  await expect(codeField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(codeField(page)).toBeFocused();

  await codeField(page).fill(wrongCode(account.secret));
  await watchFocusOnAppear(page, "field", "Recovery code");
  expect(await submitAndWait(page, "Verify and sign in")).toBe(503);
  await expect(recoveryField(page)).toBeVisible();
  expect(await focusedOnAppear(page, "Recovery code"), "the recovery field has focus as it appears").toBe(true);
  await expect(recoveryField(page)).toBeFocused();
  await expect(page.getByRole("alert")).toHaveText(`${MISMATCH} ${RECOVERY_LINE}`);
  await expect(page.getByText(RECOVERY_LEAD)).toBeVisible();
  await expect(secondHeading(page)).toBeVisible();
  await expectAccessible(page);
  // The code that could not be checked is not shown again.
  await page.getByRole("button", { name: "Use a code from your authenticator app" }).click();
  await expect(codeField(page)).toHaveValue("");
});

/**
 * Counts, per path, the reply bodies the page has finished reading (the clients read each with
 * `response.json()`), so a test can tell when a held reply has reached the page's code. Call before
 * the page loads (pull request 13, review round 1).
 */
async function countBodiesRead(page) {
  await page.addInitScript(() => {
    const read = Response.prototype.json;
    Response.prototype.json = async function json() {
      try {
        return await read.call(this);
      } finally {
        const path = new URL(this.url, location.href).pathname;
        window.__bodiesRead = window.__bodiesRead ?? {};
        window.__bodiesRead[path] = (window.__bodiesRead[path] ?? 0) + 1;
      }
    };
  });
}

/**
 * Waits until the page has read a reply body from `path`, then for two frames and a task, so checks
 * after it see the page once it has acted on that reply, not before.
 */
async function afterBodyRead(page, path) {
  await page.waitForFunction((wanted) => (window.__bodiesRead?.[wanted] ?? 0) >= 1, path);
  await afterFrames(page);
}

/** Two frames and a task: what the page does in response to something that has already happened is done. */
async function afterFrames(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)))));
}

test("Abort before headers (the premise of review round 2's fix): a reply whose request the page aborted before its headers arrived sets no cookie", async ({ page }) => {
  const { createServer } = await import("node:http");
  let releaseReply;
  const replyHeld = new Promise((resolve) => { releaseReply = resolve; });
  let reached;
  const requestReached = new Promise((resolve) => { reached = resolve; });
  let replied;
  const replySent = new Promise((resolve) => { replied = resolve; });
  // A local server: the page at `/`, and `/slow`, which the server completes only when the test
  // releases it, then answers with a cookie.
  const server = createServer(async (request, response) => {
    if (request.url === "/control") {
      // The control: answered at once with a cookie, to show this server's cookies are kept.
      response.writeHead(200, { "set-cookie": "control=kept; Path=/", "content-type": "application/json" });
      response.end("{}");
      return;
    }
    if (request.url === "/slow") {
      reached();
      await replyHeld;
      response.writeHead(200, { "set-cookie": "probe=late; Path=/", "content-type": "application/json" });
      response.end("{}");
      replied();
      return;
    }
    response.writeHead(200, { "content-type": "text/html" });
    response.end("<!doctype html><title>probe</title>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await page.goto(`${origin}/`);
    await page.evaluate(() => {
      window.__probe = new AbortController();
      window.__probeResult = fetch("/slow", { method: "POST", signal: window.__probe.signal }).then(() => "answered", (error) => error.name);
    });
    await requestReached;
    expect(await page.evaluate(() => { window.__probe.abort(); return window.__probeResult; })).toBe("AbortError");
    releaseReply();
    await replySent;
    // Time for a late reply to land, were the browser to apply it.
    await page.waitForTimeout(500);
    await page.evaluate(() => fetch("/control", { method: "POST" }).then((response) => response.text()));
    const names = (await page.context().cookies(origin)).map((cookie) => cookie.name);
    expect(names, "the control's cookie was kept, so the probe could have seen one").toContain("control");
    expect(names, "the aborted request's late reply set no cookie").not.toContain("probe");
  } finally {
    releaseReply();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("In flight, a late success after Back to sign in (mocked): the abandoned request's success never reaches the page, so the app does not open; the password form stays usable", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("latesuccess", testInfo), name: "Lena Late", password: PASSWORD });
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let arrived;
  const routed = new Promise((resolve) => { arrived = resolve; });
  await countBodiesRead(page);
  // Mocked: the success body only, with no session cookie, so nothing on the server changes. Since
  // review round 2 the page aborts the request on "Back to sign in", so the fulfil finds nothing to
  // answer; `answered` settles once it has been tried either way.
  let answered;
  const answerTried = new Promise((resolve) => { answered = resolve; });
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, async (route) => {
    arrived();
    await held;
    try {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ name: account.name }) });
    } catch {
      // Aborted by the page.
    } finally {
      answered();
    }
  });
  await openSecondStep(page, server.origin, account);
  await codeField(page).fill(wrongCode(account.secret));
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await routed;
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(signInHeading(page)).toBeVisible();
  // Opening the app starts with a session read (`onSignedIn` in main.jsx); with no session cookie
  // that read would answer signed out and leave this page showing, so the read itself is what is
  // checked: none may follow the late reply.
  const sessionReads = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/v1/session") sessionReads.push(request.url()); });
  release();
  await answerTried;
  await afterFrames(page);
  expect(sessionReads, "no session read after the late reply").toHaveLength(0);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  await expect(passwordField(page)).toBeFocused();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).not.toHaveAttribute("aria-disabled", "true");
});

// Pull request 13, review round 2 (orchestrator ruling of 2026-11-24, option (b)): "Back to sign in"
// abandons the second-step request in flight. Round 1's real-server late-success tests stood here;
// with the request aborted, a late success can no longer reach the page from a real server, so they
// became the first two tests below.

/** Counts the requests the page sends to `path`. */
function countRequests(page, path) {
  const seen = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname === path) seen.push(request.url()); });
  return seen;
}

test("In flight, Back while a correct code is being checked: the request is abandoned and the page signs out, whatever it had seen; the session read answers signed out", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const context = page.context();
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("abandoned", testInfo), name: "Abe Abandon", password: PASSWORD });
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let arrived;
  const routed = new Promise((resolve) => { arrived = resolve; });
  // Held, then passed to the real server if the browser still wants it (Playwright's continue of a
  // request the page has aborted does nothing, without an error). `continued` settles once that has
  // been tried, so the checks below come after anything the release could cause (review layer).
  let continueTried;
  const continued = new Promise((resolve) => { continueTried = resolve; });
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, async (route) => {
    arrived();
    await held;
    try { await route.continue(); } catch { /* aborted by the page */ } finally { continueTried(); }
  });
  await openSecondStep(page, server.origin, account);
  const signOuts = countRequests(page, "/api/v1/session/sign-out");
  const abandoned = [];
  page.on("requestfailed", (request) => { if (new URL(request.url()).pathname === SECOND_STEP_PATH) abandoned.push(request.url()); });
  const { code } = await nextCode(account.secret, account.step);
  await codeField(page).fill(code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await routed;
  // Waited for, not slept on (review round 3): the abort and the sign-out's reply.
  const failed = page.waitForEvent("requestfailed", (request) => new URL(request.url()).pathname === SECOND_STEP_PATH);
  const signedOut = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-out");
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await failed;
  expect((await signedOut).status(), "the sign-out was answered").toBe(200);
  release();
  await continued;
  await afterFrames(page);
  expect(abandoned, "the page abandoned (aborted) the second-step request").toHaveLength(1);
  // Signed out on every abandon of a second step in flight (orchestrator ruling of 2026-11-24, (a)).
  expect(signOuts, "the page signed out once").toHaveLength(1);
  const session = await context.request.get(`${server.origin}/api/v1/session`);
  expect((await session.json()).signedIn, "the session read answers signed out").toBe(false);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveText("");
  await expect(passwordField(page)).toBeFocused();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).not.toHaveAttribute("aria-disabled", "true");
});

test("In flight, finding 2's sequence: A's second step held, Back, then B (two-step) signs in with password and code while A's reply is released: B's code signs in", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const first = await accountThroughApi(playwright, server.origin, { email: emailFor("seqfirst", testInfo), name: "Ada Seq", password: PASSWORD });
  const second = await accountThroughApi(playwright, server.origin, { email: emailFor("seqsecond", testInfo), name: "Ben Seq", password: PASSWORD });
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let arrived;
  const routed = new Promise((resolve) => { arrived = resolve; });
  const context = page.context();
  let firstHeld = true;
  let firstStatus = null;
  let answered;
  const answerTried = new Promise((resolve) => { answered = resolve; });
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, async (route) => {
    // Only the first account's request is held; the second's goes straight to the server.
    if (!firstHeld) return route.continue();
    firstHeld = false;
    // A's second step reaches the server at once, with A's pending cookie, as a request already on
    // the wire does (a continued request would be sent with the cookies of the moment it is
    // continued, B's); only its reply's delivery to the page is held. It is sent from a separate
    // request context holding the browser's cookies of this moment, because `route.fetch()` stores
    // the reply's cookies in the browser at once (review round 3): A's cookies may reach the browser
    // only with the held reply.
    const isolated = await playwright.request.newContext({ storageState: { cookies: (await context.storageState()).cookies, origins: [] } });
    let response = null;
    try {
      response = await isolated.fetch(route.request());
      firstStatus = response.status();
    } catch (error) {
      // Fails the test at once below (A's status) rather than at its timeout.
      firstStatus = `fetch failed: ${error.message}`;
    }
    arrived();
    try {
      await held;
      if (response) {
        try { await route.fulfill({ response }); } catch { /* aborted by the page */ }
      }
    } finally {
      answered();
      await isolated.dispose();
    }
  });
  await openSecondStep(page, server.origin, first);
  await codeField(page).fill((await nextCode(first.secret, first.step)).code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await routed;
  expect(firstStatus, "A's code signed in on the server").toBe(200);
  expect(await cookiesNamed(context, SESSION_COOKIE), "A's session cookie has not reached the browser").toEqual([]);
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(signInHeading(page)).toBeVisible();
  // B's password step: the page shows B's second step, with B's pending cookie set.
  await passwordStep(page, second);
  await expect(secondHeading(page)).toBeVisible();
  // A's held reply is released now, after B's pending cookie was set, and delivered (or refused,
  // the page having abandoned it) before B's code is sent.
  release();
  await answerTried;
  await afterFrames(page);
  const { code } = await nextCode(second.secret, second.step);
  await codeField(page).fill(code);
  const sending = page.waitForResponse((response) => new URL(response.url()).pathname === SECOND_STEP_PATH);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  expect((await sending).status(), "B's code signs in").toBe(200);
  await expect(page.getByTestId("account-name")).toHaveText(second.name);
});

/**
 * Makes the page's second-step fetch go to the real server and come back with its headers (and so
 * its cookies) at once, while its body is held until `window.__releaseBody()`: the case where a
 * success's headers had already arrived when the person goes back. The page's abort errors the body.
 */
async function holdSecondStepBody(page) {
  await page.addInitScript((path) => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, location.href);
      if (url.pathname !== path) return realFetch(input, init);
      const { signal, ...rest } = init;
      const real = await realFetch(input, rest);
      const text = await real.text();
      let release;
      window.__releaseBody = () => release?.();
      const body = new ReadableStream({
        start(controller) {
          release = () => { try { controller.enqueue(new TextEncoder().encode(text)); controller.close(); } catch { /* errored */ } };
          signal?.addEventListener("abort", () => { try { controller.error(new DOMException("aborted", "AbortError")); } catch { /* closed */ } });
        },
      });
      window.__headersArrived = (window.__headersArrived ?? 0) + 1;
      return new Response(body, { status: real.status, headers: real.headers });
    };
  }, SECOND_STEP_PATH);
}

test("In flight, the gap: a success's cookies are stored but the page has not yet seen the reply when the person goes back: the page signs out anyway, and the session read answers signed out", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const context = page.context();
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("gap", testInfo), name: "Gail Gap", password: PASSWORD });
  // The page's second-step fetch goes to the real server and completes (the browser stores the
  // session cookie), but the page is not given the reply until `window.__releaseReply()`; the
  // page's abort rejects it. So when Back is pressed the cookie is stored and the page knows nothing.
  await page.addInitScript((path) => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, location.href);
      if (url.pathname !== path) return realFetch(input, init);
      const { signal, ...rest } = init;
      const real = await realFetch(input, rest);
      window.__replyStored = true;
      return new Promise((resolve, reject) => {
        window.__releaseReply = () => resolve(real);
        signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    };
  }, SECOND_STEP_PATH);
  await openSecondStep(page, server.origin, account);
  await codeField(page).fill((await nextCode(account.secret, account.step)).code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await page.waitForFunction(() => window.__replyStored === true);
  expect(await cookiesNamed(context, SESSION_COOKIE), "the server's session cookie is in the browser").toHaveLength(1);
  const signedOut = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-out", { timeout: 20_000 }).catch(() => null);
  await page.getByRole("button", { name: "Back to sign in" }).click();
  expect((await signedOut)?.status(), "the page signed out").toBe(200);
  const session = await context.request.get(`${server.origin}/api/v1/session`);
  expect((await session.json()).signedIn, "the session read answers signed out").toBe(false);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveText("");
});

test("In flight, Back's sign-out confirmed after the app has opened (the visibility check found the stored session): the page reloads and shows the sign-in page", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const context = page.context();
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("reopened", testInfo), name: "Rhys Reopened", password: PASSWORD });
  // As in "the gap": the browser stores the success's cookies, the page is never given the reply.
  await page.addInitScript((path) => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, location.href);
      if (url.pathname !== path) return realFetch(input, init);
      const { signal, ...rest } = init;
      const real = await realFetch(input, rest);
      window.__replyStored = true;
      return new Promise((resolve, reject) => {
        window.__releaseReply = () => resolve(real);
        signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    };
  }, SECOND_STEP_PATH);
  // Back's sign-out is held until the app has opened.
  let releaseSignOut;
  const signOutHeld = new Promise((resolve) => { releaseSignOut = resolve; });
  await page.route((url) => new URL(url).pathname === "/api/v1/session/sign-out", async (route) => {
    await signOutHeld;
    await route.continue();
  });
  await openSecondStep(page, server.origin, account);
  await codeField(page).fill((await nextCode(account.secret, account.step)).code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await page.waitForFunction(() => window.__replyStored === true);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toHaveLength(1);
  const signOutSent = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/v1/session/sign-out");
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await signOutSent;
  // The tab's visibility check (D-16) reads the session, which the browser still holds: the app opens.
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByTestId("account-name")).toHaveText(account.name);
  const reloaded = page.waitForEvent("load");
  releaseSignOut();
  await reloaded;
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
});

test("In flight, a success's headers already arrived when the person goes back: that session is ended at once, and the session read answers signed out", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const context = page.context();
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("headers", testInfo), name: "Hedy Headers", password: PASSWORD });
  await holdSecondStepBody(page);
  await openSecondStep(page, server.origin, account);
  await codeField(page).fill((await nextCode(account.secret, account.step)).code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await page.waitForFunction(() => (window.__headersArrived ?? 0) >= 1);
  expect(await cookiesNamed(context, SESSION_COOKIE), "the server's session cookie is in the browser").toHaveLength(1);
  const signedOut = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-out", { timeout: 20_000 }).catch(() => null);
  await page.getByRole("button", { name: "Back to sign in" }).click();
  expect((await signedOut)?.status(), "the page ended the session at once").toBe(200);
  const session = await context.request.get(`${server.origin}/api/v1/session`);
  expect((await session.json()).signedIn, "the session read answers signed out").toBe(false);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  await expect(page.locator('[role="alert"]')).toHaveText("");
  await expect(passwordField(page)).toBeFocused();
});

/**
 * The page's first second-step fetch goes to the real server and completes (the browser stores the
 * session cookie), but the page gets its body cut off part-way; from then on the page's session
 * reads fail as a network error does, until `window.__failSessionReads` is set false. Every other
 * request goes through (review round 4). While `window.__holdSessionReads` is set, a session read
 * goes to the server and is answered there, but the page gets the reply only at
 * `window.__releaseSessionRead()`; `window.__heldReadSignedIn` says what the server answered (review
 * round 5).
 */
async function cutSecondStepAndFailReads(page) {
  await page.addInitScript((path) => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === "string" ? input : input.url, location.href);
      if (url.pathname === "/api/v1/session" && window.__failSessionReads) {
        window.__failedReads = (window.__failedReads ?? 0) + 1;
        throw new TypeError("Failed to fetch");
      }
      if (url.pathname === "/api/v1/session" && window.__holdSessionReads) {
        const real = await realFetch(input, init);
        window.__heldReadSignal = init.signal;
        window.__heldReadSignedIn = (await real.clone().json()).signedIn;
        return new Promise((resolve) => { window.__releaseSessionRead = () => resolve(real); });
      }
      if (url.pathname !== path || window.__cutDone) return realFetch(input, init);
      const real = await realFetch(input, init);
      await real.text();
      window.__cutDone = true;
      window.__failSessionReads = true;
      const body = new ReadableStream({
        start(controller) { controller.enqueue(new TextEncoder().encode('{"na')); controller.error(new TypeError("connection reset")); },
      });
      return new Response(body, { status: real.status, headers: real.headers });
    };
  }, SECOND_STEP_PATH);
}

test("A correct code's 200 cut off and the session read failing (review round 4): the page ends the session as Back does and shows the existing refusal on the code form; a code sent meanwhile waits for that sign-out", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const context = page.context();
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("readfails", testInfo), name: "Reid Readfails", password: PASSWORD });
  await cutSecondStepAndFailReads(page);
  // The sign-out is held, so the test can see the browser still holds the session, and a code sent
  // meanwhile, before it is answered.
  let releaseSignOut;
  const signOutHeld = new Promise((resolve) => { releaseSignOut = resolve; });
  await page.route((url) => new URL(url).pathname === "/api/v1/session/sign-out", async (route) => {
    await signOutHeld;
    await route.continue();
  });
  const secondSteps = countSecondStepRequests(page);
  await openSecondStep(page, server.origin, account);
  await codeField(page).fill((await nextCode(account.secret, account.step)).code);
  const signOutSent = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/v1/session/sign-out", { timeout: 20_000 });
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await signOutSent;
  expect(await page.evaluate(() => window.__failedReads ?? 0), "the settling session read failed").toBeGreaterThanOrEqual(1);
  // Session reads work again from here, so the rest runs under normal conditions.
  await page.evaluate(() => { window.__failSessionReads = false; });
  expect(await cookiesNamed(context, SESSION_COOKIE), "the session is still in the browser while the sign-out is held").toHaveLength(1);
  await expect(page.locator('[role="alert"]')).toHaveText("Sign-in could not be completed. Try again.");
  await expect(secondHeading(page)).toBeVisible();
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  // A code sent while that sign-out runs waits for its reply.
  const order = [];
  page.on("response", (response) => { if (new URL(response.url()).pathname === "/api/v1/session/sign-out") order.push("sign-out answered"); });
  page.on("request", (request) => { if (new URL(request.url()).pathname === SECOND_STEP_PATH) order.push("second step sent"); });
  await codeField(page).fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByRole("button", { name: "Checking…" })).toBeVisible();
  await afterFrames(page);
  expect(secondSteps, "no second step sent while the sign-out runs").toHaveLength(1);
  const signedOut = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-out");
  const retried = page.waitForResponse((response) => new URL(response.url()).pathname === SECOND_STEP_PATH);
  releaseSignOut();
  expect((await signedOut).status(), "the sign-out was answered").toBe(200);
  // The success had consumed the pending sign-in, so the code sent after the sign-out finds it expired.
  expect((await retried).status()).toBe(401);
  expect(secondSteps).toHaveLength(2);
  expect(order, "the code was sent only after the sign-out's reply").toEqual(["sign-out answered", "second step sent"]);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveText(EXPIRED);
  const session = await context.request.get(`${server.origin}/api/v1/session`);
  expect((await session.json()).signedIn, "the session read answers signed out").toBe(false);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
});

test("A visibility read that found the session before the failed-read sign-out was confirmed (review round 5): its answer, arriving after the confirmation, does not open the app; the refusal stays on the code form, and a later read applies", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const context = page.context();
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("staleread", testInfo), name: "Stella Stale", password: PASSWORD });
  const other = await accountThroughApi(playwright, server.origin, { email: emailFor("laterread", testInfo), name: "Lars Later", password: PASSWORD, twoStep: false });
  await countBodiesRead(page);
  // The sign-out's reply is read as text (`postJson.js`): counted here, so the test knows the page has its confirmation.
  await page.addInitScript(() => {
    const read = Response.prototype.text;
    Response.prototype.text = async function text() {
      try {
        return await read.call(this);
      } finally {
        if (new URL(this.url, location.href).pathname === "/api/v1/session/sign-out") window.__signOutsRead = (window.__signOutsRead ?? 0) + 1;
      }
    };
  });
  await cutSecondStepAndFailReads(page);
  // The failed read's sign-out is held, so a visibility read can be answered while the browser still holds the session.
  let releaseSignOut;
  const signOutHeld = new Promise((resolve) => { releaseSignOut = resolve; });
  await page.route((url) => new URL(url).pathname === "/api/v1/session/sign-out", async (route) => {
    await signOutHeld;
    await route.continue();
  });
  await openSecondStep(page, server.origin, account);
  await codeField(page).fill((await nextCode(account.secret, account.step)).code);
  const signOutSent = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/v1/session/sign-out", { timeout: 20_000 });
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await signOutSent;
  await expect(page.locator('[role="alert"]')).toHaveText("Sign-in could not be completed. Try again.");
  // The tab's visibility check (D-16) reads the session; the server answers while the sign-out is held.
  await page.evaluate(() => { window.__failSessionReads = false; window.__holdSessionReads = true; });
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.waitForFunction(() => window.__heldReadSignedIn !== undefined);
  expect(await page.evaluate(() => window.__heldReadSignedIn), "the held read found the session").toBe(true);
  await page.evaluate(() => { window.__holdSessionReads = false; });
  // The sign-out is answered and the page has read its body (the confirmation) before the read's reply reaches it.
  const signedOut = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-out");
  releaseSignOut();
  expect((await signedOut).status(), "the sign-out was answered").toBe(200);
  await page.waitForFunction(() => (window.__signOutsRead ?? 0) >= 1);
  await afterFrames(page);
  const readsBefore = await page.evaluate(() => window.__bodiesRead?.["/api/v1/session"] ?? 0);
  // Released before the read's own 5-second deadline (`readSession`) aborted it; an aborted read answers
  // "cannot be checked", which the page ignores whatever the fix, so the test would prove nothing.
  const abortedAtRelease = await page.evaluate(() => { const aborted = window.__heldReadSignal?.aborted === true; window.__releaseSessionRead(); return aborted; });
  expect(abortedAtRelease, "the held read was still live when released").toBe(false);
  await page.waitForFunction((before) => (window.__bodiesRead?.["/api/v1/session"] ?? 0) > before, readsBefore);
  await afterFrames(page);
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  await expect(secondHeading(page)).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveText("Sign-in could not be completed. Try again.");
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
  // A read started after the confirmation applies as usual: signed in from another tab, the app opens.
  const tab = await context.newPage();
  await tab.setExtraHTTPHeaders({ "CF-Connecting-IP": addressFor(testInfo) });
  await tab.goto(`${server.origin}/`);
  await passwordStep(tab, other);
  await expect(tab.getByTestId("account-name")).toHaveText(other.name);
  await tab.close();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByTestId("account-name")).toHaveText(other.name);
});

test("The failed-read sign-out not confirmed (review round 4): a code submit and, after Back, a password submit both wait for it; the code is never sent, and the sign-in waits for the one retry's reply", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const first = await accountThroughApi(playwright, server.origin, { email: emailFor("retryfirst", testInfo), name: "Rory Retry", password: PASSWORD });
  const second = await accountThroughApi(playwright, server.origin, { email: emailFor("retrysecond", testInfo), name: "Rena Retry", password: PASSWORD, twoStep: false });
  await cutSecondStepAndFailReads(page);
  // The first sign-out is held, then gets no confirmation (a server error); the second, the one
  // retry, is held, then goes through; later ones go through.
  let signOutCalls = 0;
  let releaseFirst;
  const firstHeld = new Promise((resolve) => { releaseFirst = resolve; });
  let releaseRetry;
  const retryHeld = new Promise((resolve) => { releaseRetry = resolve; });
  await page.route((url) => new URL(url).pathname === "/api/v1/session/sign-out", async (route) => {
    signOutCalls += 1;
    if (signOutCalls === 1) { await firstHeld; return route.fulfill({ status: 500, body: "" }); }
    if (signOutCalls === 2) await retryHeld;
    return route.continue();
  });
  const secondSteps = countSecondStepRequests(page);
  await openSecondStep(page, server.origin, first);
  await codeField(page).fill((await nextCode(first.secret, first.step)).code);
  const firstSent = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/v1/session/sign-out", { timeout: 20_000 });
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await firstSent;
  await page.evaluate(() => { window.__failSessionReads = false; });
  await expect(page.locator('[role="alert"]')).toHaveText("Sign-in could not be completed. Try again.");
  // A code submit waits for that sign-out; Back; then a password submit as another account waits too.
  await codeField(page).fill("123456");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByRole("button", { name: "Checking…" })).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await page.getByLabel("Email").fill(second.email);
  await passwordField(page).fill(second.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await afterFrames(page);
  const order = [];
  page.on("response", (response) => { if (new URL(response.url()).pathname === "/api/v1/session/sign-out") order.push("sign-out answered"); });
  page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/v1/session/sign-in") order.push("sign-in sent"); });
  // The first sign-out is answered unconfirmed: one waiter starts the retry, and neither sends anything else meanwhile.
  const retrySent = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/v1/session/sign-out");
  releaseFirst();
  await retrySent;
  await afterFrames(page);
  expect(order, "no sign-in sent while the retry runs").toEqual(["sign-out answered"]);
  releaseRetry();
  await expect(page.getByTestId("account-name")).toHaveText(second.name);
  expect(order).toEqual(["sign-out answered", "sign-out answered", "sign-in sent"]);
  expect(secondSteps, "the code typed before Back was never sent").toHaveLength(1);
  expect(signOutCalls, "the sign-out and one retry, no more").toBe(2);
});

test("In flight, a sign-out from Back still running: the next password submit waits for its reply before the sign-in is sent", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const first = await accountThroughApi(playwright, server.origin, { email: emailFor("waitfirst", testInfo), name: "Wyn Wait", password: PASSWORD });
  const second = await accountThroughApi(playwright, server.origin, { email: emailFor("waitsecond", testInfo), name: "Wes Wait", password: PASSWORD, twoStep: false });
  // The second-step request is held (and abandoned by Back); the sign-out it causes is held too.
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, async (route) => {
    await new Promise(() => {});
    void route;
  });
  let releaseSignOut;
  const signOutHeld = new Promise((resolve) => { releaseSignOut = resolve; });
  await page.route((url) => new URL(url).pathname === "/api/v1/session/sign-out", async (route) => {
    await signOutHeld;
    await route.continue();
  });
  const order = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/v1/session/sign-in") order.push("sign-in sent"); });
  page.on("response", (response) => { if (new URL(response.url()).pathname === "/api/v1/session/sign-out") order.push("sign-out answered"); });
  await openSecondStep(page, server.origin, first);
  order.length = 0;
  await codeField(page).fill((await nextCode(first.secret, first.step)).code);
  const signOutSent = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/v1/session/sign-out");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await signOutSent;
  await page.getByLabel("Email").fill(second.email);
  await passwordField(page).fill(second.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await afterFrames(page);
  expect(order, "no sign-in sent while the sign-out runs").toEqual([]);
  releaseSignOut();
  await expect(page.getByTestId("account-name")).toHaveText(second.name);
  expect(order).toEqual(["sign-out answered", "sign-in sent"]);
});

test("In flight, the sign-out at Back not confirmed: the next password submit first tries it once more, then signs in", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const first = await accountThroughApi(playwright, server.origin, { email: emailFor("unconfirmed", testInfo), name: "Una Confirmed", password: PASSWORD });
  const second = await accountThroughApi(playwright, server.origin, { email: emailFor("unconfirmednext", testInfo), name: "Ned Next", password: PASSWORD, twoStep: false });
  await holdSecondStepBody(page);
  // The first sign-out gets no confirmation (a server error); later ones go through.
  let signOutCalls = 0;
  await page.route((url) => new URL(url).pathname === "/api/v1/session/sign-out", async (route) => {
    signOutCalls += 1;
    if (signOutCalls === 1) return route.fulfill({ status: 500, body: "" });
    return route.continue();
  });
  const order = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/session/sign-out" || path === "/api/v1/session/sign-in") order.push(path);
  });
  await openSecondStep(page, server.origin, first);
  await codeField(page).fill((await nextCode(first.secret, first.step)).code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await page.waitForFunction(() => (window.__headersArrived ?? 0) >= 1);
  order.length = 0;
  const unconfirmed = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session/sign-out");
  await page.getByRole("button", { name: "Back to sign in" }).click();
  expect((await unconfirmed).status()).toBe(500);
  await expect(signInHeading(page)).toBeVisible();
  // The next password submit: the sign-out is tried again first, then the sign-in is sent.
  await passwordStep(page, second);
  await expect(page.getByTestId("account-name")).toHaveText(second.name);
  expect(order, "sign-out at Back, the retry, then the sign-in").toEqual(["/api/v1/session/sign-out", "/api/v1/session/sign-out", "/api/v1/session/sign-in"]);
});


test("In flight, Back to sign in while sending: the button reads Checking…, a second click and a mode switch do nothing, and Back to sign in leaves a usable password form, the held reply abandoned", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("inflight", testInfo), name: "Ivan Inflight", password: PASSWORD });
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let arrived;
  const routed = new Promise((resolve) => { arrived = resolve; });
  // Since review round 2 "Back to sign in" aborts the request, so the fulfil finds nothing to
  // answer; `answered` settles once it has been tried either way.
  let answered;
  const answerTried = new Promise((resolve) => { answered = resolve; });
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, async (route) => {
    arrived();
    await held;
    try {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "second_step_code_wrong", message: CODE_WRONG } }),
      });
    } catch {
      // Aborted by the page.
    } finally {
      answered();
    }
  });
  await openSecondStep(page, server.origin, account);
  const sent = countSecondStepRequests(page);
  await codeField(page).fill(wrongCode(account.secret));
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await routed;
  const checking = page.getByRole("button", { name: "Checking…" });
  await expect(checking).toHaveAttribute("aria-disabled", "true");
  // Forced: Playwright waits for an aria-disabled button to become usable before clicking, which
  // here would last until the page's 30-second deadline.
  await checking.click({ force: true });
  await page.getByRole("button", { name: "Use a recovery code" }).click();
  await expect(codeField(page)).toBeVisible();
  await expect(recoveryField(page)).toHaveCount(0);
  expect(sent, "one second-step request").toHaveLength(1);

  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(signInHeading(page)).toBeVisible();
  release();
  await answerTried;
  await afterFrames(page);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveText("");
  await expect(recoveryField(page)).toHaveCount(0);
  await expect(passwordField(page)).toBeFocused();
  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  await expect(signIn).not.toHaveAttribute("aria-disabled", "true");
  await expect(signIn).toHaveText("Sign in");
  expect(sent, "still one second-step request").toHaveLength(1);
});

test("Reload: reloading on the second step shows the sign-in page again", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("reload", testInfo), name: "Remy Reload", password: PASSWORD });
  await openSecondStep(page, server.origin, account);
  await page.reload();
  await expect(signInHeading(page)).toBeVisible();
  await expect(secondHeading(page)).toHaveCount(0);
  await expect(page.getByTestId("account-name")).toHaveCount(0);
  await expect(page.getByLabel("Email")).toHaveValue("");
});

test("Two-step off: an account without it signs in straight to the app, with no second step", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("off", testInfo), name: "Otto Off", password: PASSWORD, twoStep: false });
  const sent = countSecondStepRequests(page);
  await page.goto(`${server.origin}/`);
  await expect(signInHeading(page)).toBeVisible();
  await passwordStep(page, account);
  await expect(page.getByTestId("account-name")).toHaveText(account.name);
  await expect(secondHeading(page)).toHaveCount(0);
  expect(sent).toEqual([]);
});
