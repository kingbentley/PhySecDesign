import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import jsQR from "jsqr";
import { signInServers } from "./playwright.config.mjs";
import { addressFor, useOwnAddress } from "./test-addresses.mjs";
import {
  codeForStep,
  currentCode,
  nextCode,
  signInWithPassword,
  signInWithRecoveryCode,
  stepAt,
  turnOnThroughApi,
  wrongCode,
} from "./two-step-helpers.mjs";

// My account's two-step verification section, the set-up flow and the offer after accepting an
// invitation (story 1.5, spec 7; CAP-1, CAP-2, CAP-7, CAP-8, CAP-13, CAP-14) against the real built
// Worker, which has a per-run test deployment key (finding 17). The tests use the first sign-in
// server of each project, set up with signin.spec.mjs's administrator, never the baseURL server.
// Each test makes its own account through an invitation, with an email no other spec uses and
// distinct per project. Codes are computed by the tests' own RFC 6238 helper from the key the page
// shows (or the start reply, when turned on through the API). Each test opens one address.

// Serial, as each server holds one installation. Tests run several deliberately slow scrypt hashes,
// and those that need two codes wait for the next 30-second step.
test.describe.configure({ mode: "serial", timeout: 150_000 });

// signin.spec.mjs's administrator, so whichever file runs first sets the server up the same way.
const ADMIN = {
  installationName: "Harbourside Facilities",
  name: "Robin Example",
  email: "robin.admin@harbourside.example",
  password: "a long and correct sign-in passphrase",
};
const APP = { "x-site-survey-design": "1" };
const PASSWORD = "a two-step tester's long passphrase";
const WRONG_PASSWORD = "not this person's passphrase at all";
const STATE_PATH = "/api/v1/account/two-step";
const FILE_NAME = "site-survey-design-recovery-codes.txt";
const OFF_TEXT = "After your password, signing in will also ask for a code from an authenticator app on your phone, so a stolen password alone is not enough.";
const NO_KEY =
  "Two-step verification is not available on this installation yet: it has no deployment key. Ask an administrator.";
const MISMATCH =
  "Two-step verification cannot be checked on this installation: its deployment key does not match the one its secrets were saved with. Ask an administrator to deploy it again with the original key.";

const servers = (testInfo) => signInServers(testInfo.project.name);
// Distinct per project, and per repeat under `--repeat-each` (each test makes its own account).
const emailFor = (label, testInfo) =>
  `${label}.${testInfo.project.name}${testInfo.repeatEachIndex ? `.r${testInfo.repeatEachIndex}` : ""}.twostep@harbourside.example`;

/** Fails on any serious or critical axe violation (standing rule 15). */
async function expectAccessible(page, include) {
  let builder = new AxeBuilder({ page });
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  expect(serious, "serious or critical axe violations").toEqual([]);
}

/**
 * Compares values that hold a key or codes without printing them on failure (only `what` is
 * reported). Arrays are compared item by item; line ends are compared as LF (the Windows clipboard
 * answers CRLF).
 */
function expectSecretEqual(actual, expected, what) {
  const plain = (value) => (Array.isArray(value) ? JSON.stringify(value) : String(value ?? "").replace(/\r\n/g, "\n"));
  expect(plain(actual) === plain(expected), what).toBe(true);
}

/** Checks that `text` holds `part`, without printing either on failure. */
function expectSecretIn(text, part, what) {
  expect(String(text).includes(part), what).toBe(true);
}

/** The dialog's and the pages' targets are 44 px (standing rule 5); the account menu's are 32 px on desktop. */
async function expectTarget(locator, minimum = 44) {
  const box = await locator.boundingBox();
  expect(box.height, "target height").toBeGreaterThanOrEqual(minimum);
}

/** Completes set-up through the API, unless it is already complete (as signin.spec.mjs does). */
async function completeSetup(request, server) {
  const state = await request.get(`${server.origin}/api/v1/setup/state`);
  if ((await state.json()).state === "closed") return;
  const reply = await request.post(`${server.origin}/api/v1/setup`, {
    headers: { origin: server.origin, ...APP },
    data: { code: server.code, installationName: ADMIN.installationName, name: ADMIN.name, email: ADMIN.email, password: ADMIN.password },
  });
  expect(reply.status(), "set-up through the API").toBe(200);
}

/** Invites `invitee` as the administrator from a separate request context; answers the link on the https:// origin. */
async function createInvitation(playwright, origin, invitee) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const signIn = await api.post(`${origin}/api/v1/session/sign-in`, {
      headers: { origin, ...APP },
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    expect(signIn.status(), "sign-in through the API").toBe(200);
    const reply = await api.post(`${origin}/api/v1/invitations`, {
      headers: { origin, ...APP },
      data: { email: invitee.email, name: invitee.name, role: "standard" },
    });
    expect(reply.status(), "invite through the API").toBe(200);
    const { link } = await reply.json();
    const url = new URL(link);
    return `${origin}${url.pathname}${url.hash}`;
  } finally {
    await api.dispose();
  }
}

/**
 * Makes an account through an invitation accepted with the browser context's request, which
 * shares the context's cookies, so the browser is signed in as it. Answers `{ email, name, password }`.
 */
async function newAccount(playwright, context, origin, email, name) {
  const link = await createInvitation(playwright, origin, { email, name });
  const reply = await context.request.post(`${origin}/api/v1/invitations/accept`, {
    headers: { origin, ...APP },
    data: { secret: link.split("#")[1], name, password: PASSWORD },
  });
  expect(reply.status(), "accept through the API").toBe(200);
  return { email, name, password: PASSWORD };
}

/**
 * Starts watching for an element to appear: a heading (h1 to h4) with exactly `text`, or the role
 * "alert" region once it holds exactly `text`. When it first appears, records whether it already
 * has focus. A MutationObserver callback runs right after the task that changed the page, so focus
 * moved in the same task (a layout effect) is seen, and focus moved later (a passive effect, after
 * which a keystroke or a fill could already have gone to the field the step put on screen) is not.
 * It tells the two apart only for an element shown after an `await` (a reply, a loaded module):
 * React runs the effects of an update made straight from a click before the next input anyway.
 */
async function watchFocusOnAppear(page, kind, text) {
  await page.evaluate(({ kind: watched, text: wanted }) => {
    const seen = (window.__focusOnAppear ??= {});
    const observers = (window.__focusObservers ??= {});
    // A second watch for the same text replaces the first.
    observers[wanted]?.disconnect();
    delete seen[wanted];
    const find = () => (watched === "heading"
      ? [...document.querySelectorAll("h1, h2, h3, h4")].find((element) => element.textContent === wanted)
      : [...document.querySelectorAll('[role="alert"]')].find((element) => element.textContent === wanted));
    // Already there: it did not appear while watched, so the check cannot pass.
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

/** What `watchFocusOnAppear` recorded for `text`: true, false, or undefined if it never appeared. */
async function focusedOnAppear(page, text) {
  return page.evaluate((wanted) => window.__focusOnAppear?.[wanted], text);
}

async function setVisibility(page, state) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

/** Hides and shows the page, then waits for the session read the app makes on showing (D-16). */
async function hideAndShow(page) {
  await setVisibility(page, "hidden");
  const read = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/session");
  await setVisibility(page, "visible");
  await read;
}

const dialog = (page) => page.getByRole("dialog", { name: "My account" });

async function openMyAccount(page) {
  await page.locator(".account-trigger").click();
  await page.getByRole("button", { name: "My account" }).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByTestId("two-step-chip").or(dialog(page).getByTestId("two-step-load-failed"))).toBeVisible();
}

/** Opens the app once, signed in by the context's cookies, and waits for the account menu. */
async function openApp(page, origin, name) {
  await page.goto(`${origin}/`);
  await expect(page.getByTestId("account-name")).toHaveText(name);
}

/** The key as the page shows it, without its spaces. */
async function shownKey(scope) {
  return (await scope.getByTestId("two-step-key").textContent()).replace(/\s/g, "");
}

/** The recovery codes as the page lists them. */
async function shownCodes(scope) {
  return scope.getByTestId("two-step-codes").locator("li").allTextContents();
}

/**
 * Rasterises the drawn QR code in the page (its SVG serialised, loaded as an image from a Blob
 * address, drawn at 6 pixels per module on a white canvas) and decodes it with jsQR in Node.
 */
async function decodeQr(page) {
  const image = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="two-step-qr"]');
    const modules = Number(svg.getAttribute("viewBox").split(" ")[2]);
    const size = modules * 6;
    const copy = svg.cloneNode(true);
    copy.setAttribute("width", String(size));
    copy.setAttribute("height", String(size));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
    try {
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, size, size);
      context.imageSmoothingEnabled = false;
      context.drawImage(picture, 0, 0, size, size);
      const bytes = context.getImageData(0, 0, size, size).data;
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      return { size, data: btoa(binary) };
    } finally {
      URL.revokeObjectURL(url);
    }
  });
  const decoded = jsQR(new Uint8ClampedArray(Buffer.from(image.data, "base64")), image.size, image.size);
  return decoded?.data ?? null;
}

/**
 * Chooses Download codes in `scope` and checks the file: its name, the installation and account
 * lines, and each of `codes` (compared without printing them).
 */
async function expectDownloadedCodes(page, scope, email, codes) {
  const downloading = page.waitForEvent("download");
  await scope.getByRole("button", { name: "Download codes" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe(FILE_NAME);
  const text = await readFile(await download.path(), "utf8");
  expectSecretIn(text, `\nInstallation: ${ADMIN.installationName}\n`, "the file names the installation");
  expectSecretIn(text, `\nAccount: ${email}\n`, "the file names the account");
  expect(codes).toHaveLength(10);
  for (const code of codes) expectSecretIn(text, `\n${code}`, "the file holds each code");
}

/** Makes `navigator.clipboard.writeText` reject in the page, until `restoreClipboard`. */
async function makeClipboardFail(page) {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("denied")) } });
  });
}

/** Removes the failing clipboard, so the browser's own is used again. */
async function restoreClipboard(page) {
  await page.evaluate(() => { delete navigator.clipboard; });
}

/** The code field's attributes for a phone's keypad and code autofill (CAP-13, finding 27). */
async function expectCodeField(field) {
  await expect(field).toHaveAttribute("inputmode", "numeric");
  await expect(field).toHaveAttribute("autocomplete", "one-time-code");
  await expect(field).toHaveAttribute("pattern", "[0-9]*");
  await expect(field).toHaveAttribute("maxlength", "12");
  await expect(field).toHaveCSS("font-size", "16px");
  expect(await field.evaluate((element) => element.form.noValidate)).toBe(true);
  await expect(field).toHaveAccessibleDescription(/6 digits\. Spaces are ignored\./);
}

test.beforeEach(async ({ request }, testInfo) => {
  await completeSetup(request, servers(testInfo)[0]);
});

test("Open My account, off: the menu's My account opens a labelled dialog showing Off with Turn on, and Escape and Close return focus to the menu (axe: off)", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("off", testInfo), "Olga Off");
  await openApp(page, server.origin, account.name);
  await page.locator(".account-trigger").click();
  await expectTarget(page.getByRole("button", { name: "My account" }), testInfo.project.name === "webkit-iphone" ? 44 : 32);
  // The dialog shows once its code has loaded, after the click: focus must be in it as it appears.
  await watchFocusOnAppear(page, "heading", "My account");
  await page.getByRole("button", { name: "My account" }).click();
  const panel = dialog(page);
  await expect(panel).toBeVisible();
  expect(await focusedOnAppear(page, "My account"), "the dialog's heading has focus as it appears").toBe(true);
  await expect(panel).toHaveAttribute("aria-modal", "true");
  await expect(panel.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
  const chip = panel.getByTestId("two-step-chip");
  await expect(chip).toHaveText("Off");
  // A label and a shape (an empty circle), not colour alone (standing rule 3).
  await expect(chip.locator("svg circle")).toHaveCount(1);
  await expect(chip.locator("svg path")).toHaveCount(0);
  await expect(panel.getByText(OFF_TEXT)).toBeVisible();
  const turnOn = panel.getByRole("button", { name: "Turn on two-step verification" });
  for (const target of [turnOn, panel.getByRole("button", { name: "Close" })]) await expectTarget(target);
  // Focus moved into the dialog, and (in Chromium, whose Tab reaches buttons) stays there.
  expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  if (testInfo.project.name === "chromium") {
    for (let index = 0; index < 4; index += 1) await page.keyboard.press("Tab");
    expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await expectAccessible(page, ".my-account-panel");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(page.locator(".account-trigger")).toBeFocused();
  await openMyAccount(page);
  await panel.getByRole("button", { name: "Close" }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator(".account-trigger")).toBeFocused();
});

test("Turn on, Wrong password, Wrong code, Copy, Download, Codes once, Visibility (My account): the QR decodes to the start reply's URI, a computed code turns it on, and the 10 codes are shown once (axe: steps 1 to 3, on)", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const chromium = testInfo.project.name === "chromium";
  if (chromium) await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.origin });
  // Its own network address: the wrong password below is a counted failure (test-addresses.mjs).
  await useOwnAddress(page, testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("turnon", testInfo), "Tara Turnon");
  await openApp(page, server.origin, account.name);
  await openMyAccount(page);
  const panel = dialog(page);
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();

  // Step 1: the password.
  await expect(panel.getByRole("heading", { name: "Confirm it is you" })).toBeVisible();
  await expect(panel.getByText("Enter your password to set up two-step verification.")).toBeVisible();
  const password = panel.getByLabel("Password");
  await expect(password).toBeFocused();
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expect(password).toHaveCSS("font-size", "16px");
  expect(await password.evaluate((element) => element.form.noValidate)).toBe(true);
  for (const name of ["Continue", "Cancel"]) await expectTarget(panel.getByRole("button", { name }));
  await expectAccessible(page, ".my-account-panel");
  await password.fill(WRONG_PASSWORD);
  await panel.getByRole("button", { name: "Continue" }).click();
  const alert = panel.getByRole("alert");
  await expect(alert).toHaveText("That password is not correct.");
  await expect(alert).toBeFocused();
  await expect(panel.getByRole("heading", { name: "Confirm it is you" })).toBeVisible();

  // Step 2: the QR code and the key.
  await password.fill(PASSWORD);
  const started = page.waitForResponse((response) => new URL(response.url()).pathname === `${STATE_PATH}/start`);
  await watchFocusOnAppear(page, "heading", "Scan this code with your authenticator app");
  await panel.getByRole("button", { name: "Continue" }).click();
  const start = await (await started).json();
  await expect(panel.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeVisible();
  expect(await focusedOnAppear(page, "Scan this code with your authenticator app"), "step 2's heading has focus as it appears").toBe(true);
  const qr = panel.getByRole("img", { name: `QR code to add ${ADMIN.installationName} to your authenticator app` });
  await expect(qr).toBeVisible();
  expect(await qr.evaluate((element) => element.tagName.toLowerCase())).toBe("svg");
  expectSecretEqual(await decodeQr(page), start.otpauthUri, "the QR code decodes to the start reply's URI");
  const key = await shownKey(panel);
  expectSecretEqual(key, start.secret, "the key shown is the start reply's");
  const grouped = await panel.getByTestId("two-step-key").textContent();
  expect(/^([A-Z2-7]{4} )*[A-Z2-7]{1,4}$/.test(grouped), "the key is shown in groups of four").toBe(true);
  await expect(panel.getByTestId("two-step-entry-name")).toHaveText(
    `Choose a time-based key. The entry will be named ${ADMIN.installationName}:${account.email}.`,
  );
  const code = panel.getByLabel("Code from the app");
  await expectCodeField(code);
  for (const name of ["Turn on", "Cancel", "Copy key"]) await expectTarget(panel.getByRole("button", { name }));
  await expectAccessible(page, ".my-account-panel");

  // Copy key: the clipboard in Chromium only; the failure text in both.
  if (chromium) {
    await panel.getByRole("button", { name: "Copy key" }).click();
    await expect(panel.getByTestId("two-step-key-copy-status")).toHaveText("Copied");
    expectSecretEqual(await page.evaluate(() => navigator.clipboard.readText()), key, "the clipboard holds the key");
  }
  await makeClipboardFail(page);
  await panel.getByRole("button", { name: "Copy key" }).click();
  await expect(panel.getByTestId("two-step-key-copy-status")).toHaveText("The key could not be copied. Select it and copy it.");
  expectSecretEqual((await page.evaluate(() => window.getSelection().toString())).replace(/\s/g, ""), key, "the key is selected");
  await restoreClipboard(page);

  // Hidden and shown again, the step and the key stay.
  await hideAndShow(page);
  await expect(panel.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeVisible();
  expectSecretEqual(await shownKey(panel), key, "the key is still shown");

  // A wrong code is refused, keeping step 2 and the field.
  const wrong = wrongCode(key);
  const codeWrong = "That code does not match. Check that the app shows this installation and try the newest code.";
  await code.fill(wrong);
  await watchFocusOnAppear(page, "alert", codeWrong);
  await panel.getByRole("button", { name: "Turn on" }).click();
  await expect(alert).toHaveText(codeWrong);
  await expect(alert).toBeFocused();
  expect(await focusedOnAppear(page, codeWrong), "the alert has focus as its message appears").toBe(true);
  expectSecretEqual(await code.inputValue(), wrong, "the field keeps the code typed");

  // A current code from the key shown, typed with a space, turns it on.
  const { code: current } = currentCode(key);
  await code.fill(`${current.slice(0, 3)} ${current.slice(3)}`);
  const confirmed = page.waitForResponse((response) => new URL(response.url()).pathname === `${STATE_PATH}/confirm`);
  await watchFocusOnAppear(page, "heading", "Save your recovery codes");
  await panel.getByRole("button", { name: "Turn on" }).click();
  const { recoveryCodes } = await (await confirmed).json();

  // Step 3: the codes, once.
  await expect(panel.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  expect(await focusedOnAppear(page, "Save your recovery codes"), "step 3's heading has focus as it appears").toBe(true);
  const codes = await shownCodes(panel);
  expect(codes).toHaveLength(10);
  expectSecretEqual(codes, recoveryCodes, "the codes shown are the confirm reply's");
  expect(codes.every((shown) => /^[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/.test(shown)), "codes in four groups of four").toBe(true);
  for (const name of ["Copy codes", "Download codes", "I have saved my codes"]) await expectTarget(panel.getByRole("button", { name }));
  await expectAccessible(page, ".my-account-panel");
  await hideAndShow(page);
  expectSecretEqual(await shownCodes(panel), codes, "the codes are still shown");

  // Download: the file the wording names, with the 10 codes and the account's email.
  const downloading = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Download codes" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe(FILE_NAME);
  const text = await readFile(await download.path(), "utf8");
  expect(text.startsWith("Site Survey Design recovery codes\n"), "the file's first line").toBe(true);
  expectSecretIn(text, `\nInstallation: ${ADMIN.installationName}\n`, "the file names the installation");
  expectSecretIn(text, `\nAccount: ${account.email}\n`, "the file names the account");
  expect(/\nMade: \d{1,2} [A-Z][a-z]+ \d{4}, \d{2}:\d{2}\n/.test(text), "the file says when it was made").toBe(true);
  for (const shown of codes) expectSecretIn(text, `\n${shown}`, "the file holds each code");
  expect(text.includes("\r"), "the file has LF line ends").toBe(false);

  // Copy codes: the clipboard in Chromium only; the failure text in both.
  if (chromium) {
    await panel.getByRole("button", { name: "Copy codes" }).click();
    await expect(panel.getByTestId("two-step-codes-copy-status")).toHaveText("Copied");
    expectSecretEqual(await page.evaluate(() => navigator.clipboard.readText()), codes.join("\n"), "the clipboard holds the codes");
  }
  await makeClipboardFail(page);
  await panel.getByRole("button", { name: "Copy codes" }).click();
  await expect(panel.getByTestId("two-step-codes-copy-status")).toHaveText("The codes could not be copied. Select them and copy them, or download them.");
  expectSecretIn(await page.evaluate(() => window.getSelection().toString()), codes[0], "the codes are selected");

  await panel.getByRole("button", { name: "I have saved my codes" }).click();
  await expect(panel.getByTestId("two-step-chip")).toHaveText("On");
  // The button that had focus is gone: the section heading has it.
  await expect(panel.getByRole("heading", { name: "Two-step verification" })).toBeFocused();
  await expect(panel.getByTestId("two-step-chip").locator("svg path")).toHaveCount(1);
  await expect(panel.getByTestId("two-step-count")).toHaveText("Recovery codes left: 10 of 10");
  await expect(panel.getByRole("button", { name: "Make fresh recovery codes" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Turn off two-step verification" })).toBeVisible();
  await expectAccessible(page, ".my-account-panel");

  // Codes once: closed and opened again, only the count.
  await panel.getByRole("button", { name: "Close" }).click();
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-count")).toHaveText("Recovery codes left: 10 of 10");
  await expect(panel.getByTestId("two-step-codes")).toHaveCount(0);
  const shownNow = await panel.textContent();
  expect(codes.some((shown) => shownNow.includes(shown)), "no code is shown after reopening").toBe(false);
});

test("No key / mismatch, a failed read, Set-up replaced or expired (replies mocked): the wording's text, Turn off kept on a mismatch, Try again, and back to the start", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("mocked", testInfo), "Mo Mocked");
  const isState = (url) => new URL(url).pathname === STATE_PATH;
  const stateReply = (body) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await openApp(page, server.origin, account.name);
  const panel = dialog(page);

  // No key: the message, no buttons.
  await page.route(isState, (route) => route.fulfill(stateReply({ enabled: false, recoveryCodesRemaining: 0, availability: "no_key", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-availability")).toHaveText(NO_KEY);
  await expect(panel.getByTestId("two-step-chip")).toHaveText("Off");
  await expect(panel.locator(".two-step-section").getByRole("button")).toHaveCount(0);
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);

  // A mismatched key while on: the message, the recovery-code line, and only Turn off.
  await page.route(isState, (route) => route.fulfill(stateReply({ enabled: true, recoveryCodesRemaining: 7, availability: "key_mismatch", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-availability")).toHaveText(MISMATCH);
  await expect(panel.getByText("You can still sign in with a recovery code.")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Turn off two-step verification" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Make fresh recovery codes" })).toHaveCount(0);
  await expectAccessible(page, ".my-account-panel");
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);

  // On with no recovery codes left: the wording's line in place of the count.
  await page.route(isState, (route) => route.fulfill(stateReply({ enabled: true, recoveryCodesRemaining: 0, availability: "available", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-count")).toHaveText("No recovery codes left. Make a fresh set so you can still sign in if you lose your phone.");
  await expect(panel.getByRole("button", { name: "Make fresh recovery codes" })).toBeVisible();
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);

  // No key while on: the message, the count, and only Turn off.
  await page.route(isState, (route) => route.fulfill(stateReply({ enabled: true, recoveryCodesRemaining: 4, availability: "no_key", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-availability")).toHaveText(NO_KEY);
  await expect(panel.getByTestId("two-step-count")).toHaveText("Recovery codes left: 4 of 10");
  await expect(panel.locator(".two-step-section").getByRole("button")).toHaveCount(1);
  await expect(panel.getByRole("button", { name: "Turn off two-step verification" })).toBeVisible();
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);

  // A mismatched key while off: the message only, no recovery-code line and no buttons.
  await page.route(isState, (route) => route.fulfill(stateReply({ enabled: false, recoveryCodesRemaining: 0, availability: "key_mismatch", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-availability")).toHaveText(MISMATCH);
  await expect(panel.getByText("You can still sign in with a recovery code.")).toHaveCount(0);
  await expect(panel.locator(".two-step-section").getByRole("button")).toHaveCount(0);
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);

  // The session read failing once the app is open: could not be loaded, and Try again reads again.
  const isSession = (url) => new URL(url).pathname === "/api/v1/session";
  await page.route(isSession, (route) => route.abort("connectionrefused"));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-load-failed")).toBeVisible();
  await page.unroute(isSession);
  await panel.getByRole("button", { name: "Try again" }).click();
  await expect(panel.getByTestId("two-step-chip")).toHaveText("Off");
  await expect(panel.getByRole("heading", { name: "Two-step verification" })).toBeFocused();
  await panel.getByRole("button", { name: "Close" }).click();

  // A failed read: the message and Try again, which reads again.
  await page.route(isState, (route) => route.abort("connectionrefused"));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-load-failed")).toHaveText("Two-step verification could not be loaded. Check the connection and try again.");
  await expectAccessible(page, ".my-account-panel");
  await page.unroute(isState);
  await panel.getByRole("button", { name: "Try again" }).click();
  await expect(panel.getByTestId("two-step-chip")).toHaveText("Off");
  await expect(panel.getByRole("heading", { name: "Two-step verification" })).toBeFocused();

  // Cancel with the read after it failing: could not be loaded, focus on the section heading (not
  // fallen out of the dialog with the Cancel button), and Try again reads again.
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();
  await expect(panel.getByRole("heading", { name: "Confirm it is you" })).toBeVisible();
  await page.route(isState, (route) => route.abort("connectionrefused"));
  await panel.getByRole("button", { name: "Cancel" }).click();
  await expect(panel.getByTestId("two-step-load-failed")).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Two-step verification" })).toBeFocused();
  await page.unroute(isState);
  await panel.getByRole("button", { name: "Try again" }).click();
  await expect(panel.getByTestId("two-step-chip")).toHaveText("Off");

  // A wait on the password: the sign-in page's composed wording.
  await page.route(`**${STATE_PATH}/start`, (route) => route.fulfill({
    status: 429,
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "signin_wait", message: "Too many attempts. Wait before trying again.", retryAfterSeconds: 60 } }),
  }));
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();
  await panel.getByLabel("Password").fill(PASSWORD);
  await panel.getByRole("button", { name: "Continue" }).click();
  await expect(panel.getByRole("alert")).toHaveText("Too many attempts. Wait 1 minute before trying again.");
  await page.unroute(`**${STATE_PATH}/start`);

  // A set-up replaced in another tab or expired: back to the start with the refusal. The start
  // reply is mocked with a key made up here, so no real set-up is changed.
  const madeUpKey = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  await page.route(`**${STATE_PATH}/start`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      setupId: "0123456789abcdef0123456789abcdef",
      secret: madeUpKey,
      otpauthUri: `otpauth://totp/Mocked:${encodeURIComponent(account.email)}?secret=${madeUpKey}&issuer=Mocked&algorithm=SHA1&digits=6&period=30`,
      installationName: "Mocked",
      email: account.email,
    }),
  }));
  await page.route(`**${STATE_PATH}/confirm`, (route) => route.fulfill({
    status: 409,
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "two_step_setup_expired", message: "This set-up has expired or was replaced. Start again." } }),
  }));
  await panel.getByRole("button", { name: "Continue" }).click();
  // The step has moved focus to its heading by the time it shows, so the fill below cannot lose
  // its text to a later focus move (the cause of this test's earlier intermittent failure).
  await expect(panel.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeFocused();
  await panel.getByLabel("Code from the app").fill(codeForStep(madeUpKey, stepAt()));
  await panel.getByRole("button", { name: "Turn on" }).click();
  await expect(panel.getByRole("heading", { name: "Confirm it is you" })).toBeVisible();
  await expect(panel.getByRole("alert")).toHaveText("This set-up has expired or was replaced. Start again.");
  await expect(panel.getByRole("alert")).toBeFocused();
  await expect(panel.getByTestId("two-step-key")).toHaveCount(0);
  await page.unroute(`**${STATE_PATH}/start`);
  await page.unroute(`**${STATE_PATH}/confirm`);

  // The state read answering not signed in: the sign-in page, and the dialog gone.
  await panel.getByRole("button", { name: "Close" }).click();
  await page.route(isState, (route) => route.fulfill({
    status: 401,
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "not_signed_in", message: "Sign in to do this." } }),
  }));
  await page.locator(".account-trigger").click();
  await page.getByRole("button", { name: "My account" }).click();
  await expect(page.getByRole("heading", { name: `Sign in to ${ADMIN.installationName}` })).toBeVisible();
  await expect(panel).toHaveCount(0);
});

test("Count after use: a recovery code used at sign-in leaves 9 of 10", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("count", testInfo), "Cora Count");
  const on = await turnOnThroughApi(context.request, server.origin, PASSWORD);
  const used = await signInWithRecoveryCode(playwright, server.origin, account, on.recoveryCodes[0]);
  expect(used.status, "sign-in with a recovery code").toBe(200);
  await openApp(page, server.origin, account.name);
  await openMyAccount(page);
  await expect(dialog(page).getByTestId("two-step-chip")).toHaveText("On");
  await expect(dialog(page).getByTestId("two-step-count")).toHaveText("Recovery codes left: 9 of 10");
});

test("Fresh codes and Leak: set-up and a fresh set with a code of a later step send only same-origin requests, keep nothing in storage, the address or the console, and the old codes are then refused at sign-in", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  // Its own network address, for the page and the sign-ins below: the old recovery code's refusal
  // is a counted failure (test-addresses.mjs).
  await useOwnAddress(page, testInfo);
  const address = addressFor(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("fresh", testInfo), "Fern Fresh");
  const lines = [];
  page.on("console", (message) => lines.push(message.text()));
  // The prototype's map asks for tiles from another host when it opens; they are refused here, and
  // the requests are recorded only from the moment My account opens.
  await page.route((url) => new URL(url).origin !== server.origin, (route) => route.abort());
  // Every storage write from the page's first script on, so a value written and removed again
  // before a check is still seen (pull request 13, review round 1).
  await page.addInitScript(() => {
    const writes = (window.__storageWrites = []);
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function recordedSetItem(name, value) {
      writes.push(String(name), String(value));
      return setItem.call(this, name, value);
    };
  });
  await openApp(page, server.origin, account.name);
  await page.waitForLoadState("networkidle");
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  const href = await page.evaluate(() => location.href);
  await openMyAccount(page);
  const panel = dialog(page);

  /** Nothing secret in storage, the address or the console; every request same-origin and the app's own. */
  async function expectNoLeak(secrets) {
    const seen = await page.evaluate(() => {
      const values = [];
      for (const store of [localStorage, sessionStorage]) {
        for (let index = 0; index < store.length; index += 1) {
          const name = store.key(index);
          values.push(name, store.getItem(name));
        }
      }
      return { values, writes: window.__storageWrites ?? null, href: location.href };
    });
    expect(seen.href).toBe(href);
    expect(Array.isArray(seen.writes), "storage writes are recorded").toBe(true);
    for (const secret of secrets) {
      for (const value of seen.values) expect(value.includes(secret), "a stored value holds a secret").toBe(false);
      for (const value of seen.writes) expect(value.includes(secret), "a storage write held a secret").toBe(false);
      for (const line of lines) expect(line.includes(secret), "a console message holds a secret").toBe(false);
      for (const url of requests) expect(url.includes(secret), "a request address holds a secret").toBe(false);
    }
    for (const url of requests) {
      const parsed = new URL(url);
      expect(parsed.origin, `request to ${parsed.origin}`).toBe(server.origin);
      // The download's own Blob address stays in the page; anything else is the app's API or files.
      if (parsed.protocol === "blob:") continue;
      expect(parsed.pathname.startsWith("/api/v1/") || parsed.pathname.startsWith("/assets/"), `request for ${parsed.pathname}`).toBe(true);
    }
  }

  // Set-up.
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();
  await panel.getByLabel("Password").fill(PASSWORD);
  await panel.getByRole("button", { name: "Continue" }).click();
  await expect(panel.getByTestId("two-step-key")).toBeVisible();
  const key = await shownKey(panel);
  const grouped = await panel.getByTestId("two-step-key").textContent();
  await expectNoLeak([key, grouped]);
  const first = currentCode(key);
  await panel.getByLabel("Code from the app").fill(first.code);
  await panel.getByRole("button", { name: "Turn on" }).click();
  await expect(panel.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  const oldCodes = await shownCodes(panel);
  const variants = (codes) => codes.flatMap((code) => [code, code.replace(/-/g, "")]);
  await expectNoLeak([key, grouped, ...variants(oldCodes)]);
  await panel.getByRole("button", { name: "I have saved my codes" }).click();
  await expect(panel.getByTestId("two-step-count")).toHaveText("Recovery codes left: 10 of 10");

  // Fresh codes: the password and a code of a later step than the one just accepted.
  test.setTimeout(180_000);
  await panel.getByRole("button", { name: "Make fresh recovery codes" }).click();
  await expect(panel.getByRole("heading", { name: "Make fresh recovery codes" })).toBeVisible();
  await expect(panel.getByText("Your current recovery codes stop working.")).toBeVisible();
  const freshPassword = panel.getByLabel("Password");
  const freshCode = panel.getByLabel("Code from the app");
  const makeFresh = panel.getByRole("button", { name: "Make fresh codes" });
  // The page's own checks: an empty password and a 5-digit code are named by their fields, unsent.
  await freshCode.fill("12345");
  await makeFresh.click();
  await expect(freshPassword).toHaveAttribute("aria-invalid", "true");
  await expect(freshPassword).toHaveAccessibleDescription("Enter your password, of at most 1024 characters.");
  await expect(freshPassword).toBeFocused();
  await freshPassword.fill(PASSWORD);
  await freshCode.fill("12345");
  await makeFresh.click();
  await expect(freshCode).toHaveAttribute("aria-invalid", "true");
  await expect(freshCode).toHaveAccessibleDescription(/Enter the 6 digits from your authenticator app\./);
  await expect(freshCode).toBeFocused();
  // A wrong code is refused in the focused alert, the form kept.
  const wrongFresh = wrongCode(key);
  await freshCode.fill(wrongFresh);
  await makeFresh.click();
  const freshAlert = panel.getByRole("alert");
  await expect(freshAlert).toHaveText("That code does not match. Check that the app shows this installation and try the newest code.");
  await expect(freshAlert).toBeFocused();
  await expect(panel.getByRole("heading", { name: "Make fresh recovery codes" })).toBeVisible();
  expectSecretEqual(await freshCode.inputValue(), wrongFresh, "the field keeps the code typed");
  expectSecretEqual(await freshPassword.inputValue(), PASSWORD, "the field keeps the password typed");
  const later = await nextCode(key, first.step);
  await freshCode.fill(later.code);
  await expectCodeField(freshCode);
  await makeFresh.click();
  await expect(panel.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  const freshCodes = await shownCodes(panel);
  expect(freshCodes).toHaveLength(10);
  expect(freshCodes.some((code) => oldCodes.includes(code)), "the fresh set shares no code with the old").toBe(false);
  await expectNoLeak([key, grouped, ...variants(oldCodes), ...variants(freshCodes)]);
  // The fresh set's file names the installation from the session read and holds the new codes.
  await expectDownloadedCodes(page, panel, account.email, freshCodes);
  await panel.getByRole("button", { name: "I have saved my codes" }).click();
  await expect(panel.getByTestId("two-step-count")).toHaveText("Recovery codes left: 10 of 10");
  await expectNoLeak([key, grouped, ...variants(oldCodes), ...variants(freshCodes)]);

  // An old code is refused at sign-in; a fresh one signs in.
  const old = await signInWithRecoveryCode(playwright, server.origin, account, oldCodes[0], { address });
  expect(old.status).toBe(401);
  expect(old.body?.error?.code).toBe("second_step_recovery_code_wrong");
  expect((await signInWithRecoveryCode(playwright, server.origin, account, freshCodes[0], { address })).status).toBe(200);
});

test("Turn off: a wrong password is refused and leaves it on; the password turns it off, the chip shows Off, and sign-in needs only the password", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  // Its own network address, for the page and the sign-ins below: the wrong password is a counted
  // failure, and so is a sign-in left at its second step (test-addresses.mjs).
  await useOwnAddress(page, testInfo);
  const address = addressFor(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("turnoff", testInfo), "Toby Turnoff");
  await turnOnThroughApi(context.request, server.origin, PASSWORD);
  await openApp(page, server.origin, account.name);
  await openMyAccount(page);
  const panel = dialog(page);
  await expect(panel.getByTestId("two-step-chip")).toHaveText("On");
  await panel.getByRole("button", { name: "Turn off two-step verification" }).click();
  await expect(panel.getByRole("heading", { name: "Turn off two-step verification" })).toBeVisible();
  await expect(panel.getByText("Signing in will need only your password, and your recovery codes stop working.")).toBeVisible();
  const password = panel.getByLabel("Password");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expectAccessible(page, ".my-account-panel");
  await password.fill(WRONG_PASSWORD);
  await panel.getByRole("button", { name: "Turn off", exact: true }).click();
  await expect(panel.getByRole("alert")).toHaveText("That password is not correct.");
  await expect(panel.getByRole("alert")).toBeFocused();
  const stillOn = await signInWithPassword(playwright, server.origin, account, { address });
  expect(stillOn.body).toEqual({ secondStep: true });
  await password.fill(PASSWORD);
  await panel.getByRole("button", { name: "Turn off", exact: true }).click();
  await expect(panel.getByText("Two-step verification is off.")).toBeVisible();
  await expect(panel.getByTestId("two-step-chip")).toHaveText("Off");
  await expect(panel.getByRole("heading", { name: "Two-step verification" })).toBeFocused();
  await expect(panel.getByRole("button", { name: "Turn on two-step verification" })).toBeVisible();
  const passwordOnly = await signInWithPassword(playwright, server.origin, account, { address });
  expect(passwordOnly.status).toBe(200);
  expect(passwordOnly.body).toEqual({ name: account.name });
});

/**
 * Opens an invitation link in the page and accepts it with PASSWORD. With `watchOffer`, also
 * watches whether the offer's heading has focus as it appears (it shows after two replies).
 */
async function acceptOnPage(page, link, { watchOffer = false } = {}) {
  await page.goto(link);
  await expect(page.getByRole("heading", { name: `Join ${ADMIN.installationName}` })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  if (watchOffer) await watchFocusOnAppear(page, "heading", "Protect your account");
  await page.getByRole("button", { name: "Set password and sign in" }).click();
}

const offerHeading = (page) => page.getByRole("heading", { name: "Protect your account" });

test("Offer, Skip: accepting an invitation with two-step available shows Protect your account with both buttons, and Skip for now opens the app at / (axe: the offer)", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const name = "Oscar Offer";
  const link = await createInvitation(playwright, server.origin, { email: emailFor("offer", testInfo), name });
  await acceptOnPage(page, link, { watchOffer: true });
  await expect(offerHeading(page)).toBeVisible();
  expect(await focusedOnAppear(page, "Protect your account"), "the offer's heading has focus as it appears").toBe(true);
  await expect(page.getByText(
    "Turn on two-step verification now? After your password, signing in will also ask for a code from an authenticator app on your phone. You can turn it on later from My account.",
  )).toBeVisible();
  await expect(page).toHaveURL(`${server.origin}/invite`);
  for (const button of ["Set up two-step verification", "Skip for now"]) await expectTarget(page.getByRole("button", { name: button }));
  await expectAccessible(page);
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByTestId("account-name")).toHaveText(name);
  await expect(page).toHaveURL(`${server.origin}/`);
});

test("Offer, no key: with the state read answering no_key (mocked), accepting opens the app at / with no offer", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const name = "Nina Nokey";
  const email = emailFor("offernokey", testInfo);
  const link = await createInvitation(playwright, server.origin, { email, name });
  await page.route((url) => new URL(url).pathname === STATE_PATH, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ enabled: false, recoveryCodesRemaining: 0, availability: "no_key", email }),
  }));
  await acceptOnPage(page, link);
  await expect(page.getByTestId("account-name")).toHaveText(name);
  await expect(page).toHaveURL(`${server.origin}/`);
  await expect(offerHeading(page)).toHaveCount(0);
});

test("Offer, no key: with the state read failing, accepting opens the app at / with no offer (finding 14)", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const name = "Fay Failread";
  const link = await createInvitation(playwright, server.origin, { email: emailFor("offerfail", testInfo), name });
  await page.route((url) => new URL(url).pathname === STATE_PATH, (route) => route.abort("connectionrefused"));
  await acceptOnPage(page, link);
  await expect(page.getByTestId("account-name")).toHaveText(name);
  await expect(page).toHaveURL(`${server.origin}/`);
  await expect(offerHeading(page)).toHaveCount(0);
});

test("Set up from the offer, Visibility (offer): the password and a code turn it on, the steps and codes stay on hide and show, Continue to Site Survey Design opens the app, and My account shows On", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const name = "Seth Setup";
  const email = emailFor("offersetup", testInfo);
  const link = await createInvitation(playwright, server.origin, { email, name });
  await acceptOnPage(page, link);
  await expect(offerHeading(page)).toBeVisible();
  await page.getByRole("button", { name: "Set up two-step verification" }).click();
  // Cancel returns to the offer.
  await expect(page.getByRole("heading", { name: "Confirm it is you" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(offerHeading(page)).toBeVisible();
  await page.getByRole("button", { name: "Set up two-step verification" }).click();
  await expectAccessible(page);
  await page.getByLabel("Password").fill(PASSWORD);
  const started = page.waitForResponse((response) => new URL(response.url()).pathname === `${STATE_PATH}/start`);
  await page.getByRole("button", { name: "Continue" }).click();
  const start = await (await started).json();
  await expect(page.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeVisible();
  expectSecretEqual(await decodeQr(page), start.otpauthUri, "the QR code decodes to the start reply's URI");
  await expectCodeField(page.getByLabel("Code from the app"));
  await expectAccessible(page);
  const key = await shownKey(page);
  await setVisibility(page, "hidden");
  await setVisibility(page, "visible");
  await expect(page.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeVisible();
  expectSecretEqual(await shownKey(page), key, "the key is still shown");
  // Cancel on step 2 also returns to the offer; setting up again starts afresh with a new key.
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(offerHeading(page)).toBeVisible();
  await expect(page.getByTestId("two-step-key")).toHaveCount(0);
  await page.getByRole("button", { name: "Set up two-step verification" }).click();
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeVisible();
  const newKey = await shownKey(page);
  await page.getByLabel("Code from the app").fill(currentCode(newKey).code);
  await page.getByRole("button", { name: "Turn on" }).click();
  await expect(page.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  const codes = await shownCodes(page);
  expect(codes).toHaveLength(10);
  await expectAccessible(page);
  // The offer's file names the installation and the account from the start reply.
  await expectDownloadedCodes(page, page, email, codes);
  await setVisibility(page, "hidden");
  await setVisibility(page, "visible");
  expectSecretEqual(await shownCodes(page), codes, "the codes are still shown");
  await expect(page.getByRole("button", { name: "I have saved my codes" })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to Site Survey Design" }).click();
  await expect(page.getByTestId("account-name")).toHaveText(name);
  await expect(page).toHaveURL(`${server.origin}/`);
  await openMyAccount(page);
  await expect(dialog(page).getByTestId("two-step-chip")).toHaveText("On");
  await expect(dialog(page).getByTestId("two-step-count")).toHaveText("Recovery codes left: 10 of 10");
});

// Pull request 13, CodeRabbit review round 1 (2026-11-24).

/** A JSON reply for `route.fulfill`. */
const jsonReply = (body, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

/** A made-up start reply for `key`, so no real set-up is changed. */
function madeUpStart(key, email) {
  return {
    setupId: "0123456789abcdef0123456789abcdef",
    secret: key,
    otpauthUri: `otpauth://totp/Mocked:${encodeURIComponent(email)}?secret=${key}&issuer=Mocked&algorithm=SHA1&digits=6&period=30`,
    installationName: ADMIN.installationName,
    email,
  };
}

/** A base32 key (RFC 4648's alphabet) and 10 recovery codes (Crockford's base32, as D-9), made up at run time. */
function madeUpKey() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from({ length: 32 }, () => alphabet[randomInt(32)]).join("");
}
function madeUpCodes() {
  const alphabet = "0123456789abcdefghjkmnpqrstvwxyz";
  return Array.from({ length: 10 }, () => Array.from({ length: 16 }, () => alphabet[randomInt(32)]).join(""));
}

/** Holds every request `matches` until the returned `release()`; `arrived` settles at the first. */
function holdRoute(page, matches, reply) {
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let arrive;
  const arrived = new Promise((resolve) => { arrive = resolve; });
  const urls = [];
  const ready = page.route(matches, async (route) => {
    urls.push(route.request().url());
    arrive();
    await held;
    await (reply ? route.fulfill(reply) : route.continue());
  });
  return { ready, arrived, release: () => release(), urls };
}

/** Lets the page finish what it was doing: two animation frames and a task. */
async function settlePage(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)))));
}

/** A new account with the app open, for the round-1 tests. */
async function round1Account(page, context, playwright, testInfo, label, name) {
  const [server] = servers(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor(label, testInfo), name);
  await openApp(page, server.origin, account.name);
  return account;
}
const isStatePath = (url) => new URL(url).pathname === STATE_PATH;

test("Round 1, mocked replies: a mismatch with no codes left has no recovery-code line, and one with a code left has it", async ({ page, context, playwright }, testInfo) => {
  const account = await round1Account(page, context, playwright, testInfo, "round1line", "Rhea Round");
  const isState = isStatePath;
  const panel = dialog(page);

  // A mismatch while on with no recovery codes left: the recovery-code line is not shown, as no
  // code is left to sign in with (MyAccount.jsx:168).
  await page.route(isState, (route) => route.fulfill(jsonReply({ enabled: true, recoveryCodesRemaining: 0, availability: "key_mismatch", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByTestId("two-step-availability")).toHaveText(MISMATCH);
  await expect(panel.getByText("You can still sign in with a recovery code.")).toHaveCount(0);
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);
  // With one code left, the line shows.
  await page.route(isState, (route) => route.fulfill(jsonReply({ enabled: true, recoveryCodesRemaining: 1, availability: "key_mismatch", email: account.email })));
  await openMyAccount(page);
  await expect(panel.getByText("You can still sign in with a recovery code.")).toBeVisible();
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);
});

test("Round 1, mocked replies: Cancel waits for a held turn-off", async ({ page, context, playwright }, testInfo) => {
  const account = await round1Account(page, context, playwright, testInfo, "round1cancel", "Cal Cancel");
  const isState = isStatePath;
  const panel = dialog(page);

  // Turning off with its reply held: Cancel does nothing until the reply comes (MyAccount.jsx:150).
  await page.route(isState, (route) => route.fulfill(jsonReply({ enabled: true, recoveryCodesRemaining: 3, availability: "available", email: account.email })));
  const turnOff = holdRoute(page, `**${STATE_PATH}/turn-off`, jsonReply({ enabled: false }));
  await turnOff.ready;
  await openMyAccount(page);
  await panel.getByRole("button", { name: "Turn off two-step verification" }).click();
  await panel.getByLabel("Password").fill(PASSWORD);
  await panel.getByRole("button", { name: "Turn off", exact: true }).click();
  await turnOff.arrived;
  const cancel = panel.getByRole("button", { name: "Cancel" });
  await expect(cancel).toHaveAttribute("aria-disabled", "true");
  // Forced: Playwright waits for an aria-disabled button to become usable before clicking.
  await cancel.click({ force: true });
  // Escape and Close do nothing while the turn-off is in flight either (finding 2's ruling).
  await page.keyboard.press("Escape");
  await panel.getByRole("button", { name: "Close" }).click({ force: true });
  await settlePage(page);
  await expect(panel.getByRole("heading", { name: "Turn off two-step verification" })).toBeVisible();
  turnOff.release();
  await expect(panel.getByText("Two-step verification is off.")).toBeVisible();
  await panel.getByRole("button", { name: "Close" }).click();
  await page.unroute(isState);
  await page.unroute(`**${STATE_PATH}/turn-off`);
});

/** Mocks the state read (naming `stateEmail`), and start replies for `keys` in turn, for `account`. */
async function mockSetUpReplies(page, account, keys, stateEmail) {
  await page.route(isStatePath, (route) => route.fulfill(jsonReply({ enabled: false, recoveryCodesRemaining: 0, availability: "available", email: stateEmail })));
  let starts = 0;
  await page.route(`**${STATE_PATH}/start`, (route) => route.fulfill(jsonReply(madeUpStart(keys[Math.min(starts++, keys.length - 1)], account.email))));
}

/** Turns on in My account up to step 2 (the key shown). */
async function toScanStep(page) {
  const panel = dialog(page);
  await panel.getByLabel("Password").fill(PASSWORD);
  await panel.getByRole("button", { name: "Continue" }).click();
  await expect(panel.getByRole("heading", { name: "Scan this code with your authenticator app" })).toBeFocused();
}

test("Round 1, mocked replies: a copy of an earlier key that settles after the set-up was started again says nothing about the new key", async ({ page, context, playwright }, testInfo) => {
  const account = await round1Account(page, context, playwright, testInfo, "round1copy", "Cora Copy");
  const panel = dialog(page);
  const keys = [madeUpKey(), madeUpKey()];
  await mockSetUpReplies(page, account, keys, account.email);
  await page.route(`**${STATE_PATH}/confirm`, (route) => route.fulfill(jsonReply({ error: { code: "two_step_setup_expired", message: "This set-up has expired or was replaced. Start again." } }, 409)));
  // A clipboard whose write stays pending until the test releases it (TwoStepSetup.jsx:131-134).
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => new Promise((resolve) => { window.__releaseCopy = resolve; }) },
    });
  });
  await openMyAccount(page);
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();
  await toScanStep(page);
  await panel.getByRole("button", { name: "Copy key" }).click();
  await panel.getByLabel("Code from the app").fill(codeForStep(keys[0], stepAt()));
  await panel.getByRole("button", { name: "Turn on" }).click();
  await expect(panel.getByRole("alert")).toHaveText("This set-up has expired or was replaced. Start again.");
  await toScanStep(page);
  expectSecretEqual(await shownKey(panel), keys[1], "the second start's key is shown");
  await page.evaluate(() => window.__releaseCopy());
  await settlePage(page);
  await expect(panel.getByTestId("two-step-key-copy-status")).toHaveText("");
  await restoreClipboard(page);
  await page.unroute(isStatePath);
  await page.unroute(`**${STATE_PATH}/start`);
  await page.unroute(`**${STATE_PATH}/confirm`);
});

test("Round 1, mocked replies: the set-up's codes file names the start reply's account, not the state read's", async ({ page, context, playwright }, testInfo) => {
  const account = await round1Account(page, context, playwright, testInfo, "round1file", "Fay File");
  const panel = dialog(page);
  const keys = [madeUpKey()];
  // The state read names another account (MyAccount.jsx:316-318).
  await mockSetUpReplies(page, account, keys, "someone.else@harbourside.example");
  await page.route(`**${STATE_PATH}/confirm`, (route) => route.fulfill(jsonReply({ recoveryCodes: madeUpCodes() })));
  await openMyAccount(page);
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();
  await toScanStep(page);
  await panel.getByLabel("Code from the app").fill(codeForStep(keys[0], stepAt()));
  await panel.getByRole("button", { name: "Turn on" }).click();
  await expect(panel.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  await expectDownloadedCodes(page, panel, account.email, await shownCodes(panel));
  await page.unroute(isStatePath);
  await page.unroute(`**${STATE_PATH}/start`);
  await page.unroute(`**${STATE_PATH}/confirm`);
});

test("Round 1, dialog held open: while fresh codes or a set-up start is in flight, Escape and Close do nothing and focus stays in the dialog; the codes show on release, and after a failed request Escape closes it", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const account = await newAccount(playwright, context, server.origin, emailFor("heldopen", testInfo), "Hal Held");
  const isState = (url) => new URL(url).pathname === STATE_PATH;
  await openApp(page, server.origin, account.name);
  const panel = dialog(page);
  const close = panel.getByRole("button", { name: "Close" });

  // Fresh codes held: Escape and Close leave the dialog open; on release the codes show.
  await page.route(isState, (route) => route.fulfill(jsonReply({ enabled: true, recoveryCodesRemaining: 3, availability: "available", email: account.email })));
  const fresh = holdRoute(page, `**${STATE_PATH}/recovery-codes`, jsonReply({ recoveryCodes: madeUpCodes() }));
  await fresh.ready;
  await openMyAccount(page);
  await panel.getByRole("button", { name: "Make fresh recovery codes" }).click();
  await panel.getByLabel("Password").fill(PASSWORD);
  await panel.getByLabel("Code from the app").fill(codeForStep(madeUpKey(), stepAt()));
  await panel.getByRole("button", { name: "Make fresh codes" }).click();
  await fresh.arrived;
  await expect(close).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  // Forced: Playwright waits for an aria-disabled button to become usable before clicking.
  await close.click({ force: true });
  await settlePage(page);
  await expect(panel).toBeVisible();
  // Focus stays trapped in the dialog while it is held open.
  for (let index = 0; index < 4; index += 1) await page.keyboard.press("Tab");
  expect(await panel.evaluate((element) => element.contains(document.activeElement)), "focus stays in the dialog").toBe(true);
  fresh.release();
  await expect(panel.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  await expect(close).not.toHaveAttribute("aria-disabled", "true");
  await panel.getByRole("button", { name: "I have saved my codes" }).click();
  await page.unroute(`**${STATE_PATH}/recovery-codes`);
  await page.unroute(isState);
  await close.click();
  await expect(panel).toHaveCount(0);

  // A set-up start held, then failing on the network: held open while in flight, and once the
  // refusal shows, Escape closes the dialog (the guard cleared on failure too).
  let releaseStart;
  const startHeld = new Promise((resolve) => { releaseStart = resolve; });
  let startArrived;
  const startRouted = new Promise((resolve) => { startArrived = resolve; });
  await page.route(`**${STATE_PATH}/start`, async (route) => {
    startArrived();
    await startHeld;
    await route.abort("connectionrefused");
  });
  await page.route(isState, (route) => route.fulfill(jsonReply({ enabled: false, recoveryCodesRemaining: 0, availability: "available", email: account.email })));
  await openMyAccount(page);
  await panel.getByRole("button", { name: "Turn on two-step verification" }).click();
  await panel.getByLabel("Password").fill(PASSWORD);
  await panel.getByRole("button", { name: "Continue" }).click();
  await startRouted;
  await page.keyboard.press("Escape");
  await settlePage(page);
  await expect(panel).toBeVisible();
  releaseStart();
  await expect(panel.getByRole("alert")).not.toHaveText("");
  await expect(close).not.toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await page.unroute(`**${STATE_PATH}/start`);
  await page.unroute(isState);
});

test("Round 1, account menu: Escape while My account is loading cancels it", async ({ page, context }, testInfo) => {
  const [server] = servers(testInfo);
  // The administrator, who has both My account and Invite a person.
  const signIn = await context.request.post(`${server.origin}/api/v1/session/sign-in`, {
    headers: { origin: server.origin, ...APP },
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(signIn.status(), "sign-in through the API").toBe(200);
  await openApp(page, server.origin, ADMIN.name);
  const trigger = page.locator(".account-trigger");
  const invite = page.getByRole("dialog", { name: "Invite a person" });
  /** Imports a held chunk from the page too, so the app's own wait for it has been answered. */
  const importedInPage = (url) => page.evaluate((src) => import(src).then(() => undefined), url);

  // Escape while My account's code is loading: the menu closes, and the dialog never opens
  // (AccountMenu.jsx:53-55).
  const myAccountChunk = holdRoute(page, /\/assets\/MyAccount-[^/]*\.js$/);
  await myAccountChunk.ready;
  await trigger.click();
  await page.getByRole("button", { name: "My account" }).click();
  await myAccountChunk.arrived;
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "My account" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  myAccountChunk.release();
  await importedInPage(myAccountChunk.urls[0]);
  await settlePage(page);
  await expect(dialog(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.unroute(/\/assets\/MyAccount-[^/]*\.js$/);
});

test("Round 1, account menu: of two dialogs chosen while the first is loading, only the last opens", async ({ page, context }, testInfo) => {
  const [server] = servers(testInfo);
  const signIn = await context.request.post(`${server.origin}/api/v1/session/sign-in`, {
    headers: { origin: server.origin, ...APP },
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(signIn.status(), "sign-in through the API").toBe(200);
  const trigger = page.locator(".account-trigger");
  const invite = page.getByRole("dialog", { name: "Invite a person" });
  const importedInPage = (url) => page.evaluate((src) => import(src).then(() => undefined), url);

  // Invite a person still loading, then My account: only the last chosen opens, and the invite
  // panel, released afterwards, never mounts beside it (AccountMenu.jsx:55). My account's code is
  // not held: WebKit may serve it from its memory cache after the first half (no request), so the
  // test does not depend on whether it is fetched again.
  await page.goto(`${server.origin}/`);
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  const inviteChunk = holdRoute(page, /\/assets\/InvitePanel-[^/]*\.js$/);
  await inviteChunk.ready;
  await trigger.click();
  await page.getByRole("button", { name: "Invite a person" }).click();
  await inviteChunk.arrived;
  await page.getByRole("button", { name: "My account" }).click();
  await expect(dialog(page)).toBeVisible();
  inviteChunk.release();
  await importedInPage(inviteChunk.urls[0]);
  await settlePage(page);
  await expect(dialog(page)).toBeVisible();
  await expect(invite).toHaveCount(0);
  await page.unroute(/\/assets\/InvitePanel-[^/]*\.js$/);
});
