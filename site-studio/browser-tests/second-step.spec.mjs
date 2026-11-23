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
  expect(sent, "no second-step request was sent").toEqual([]);
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

test("In flight, Back to sign in while sending: the button reads Checking…, a second click and a mode switch do nothing, and Back to sign in leaves a usable password form when the held reply arrives", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await accountThroughApi(playwright, server.origin, { email: emailFor("inflight", testInfo), name: "Ivan Inflight", password: PASSWORD });
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let arrived;
  const routed = new Promise((resolve) => { arrived = resolve; });
  await page.route((url) => new URL(url).pathname === SECOND_STEP_PATH, async (route) => {
    arrived();
    await held;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "second_step_code_wrong", message: CODE_WRONG } }),
    });
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
  const reply = page.waitForResponse((response) => new URL(response.url()).pathname === SECOND_STEP_PATH);
  release();
  expect((await reply).status()).toBe(401);
  // The page reads the held reply's body after the response event; give it a moment to act on it,
  // so the checks below see the page after the late reply, not before.
  await page.waitForTimeout(500);
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
