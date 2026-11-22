import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signInServers } from "./playwright.config.mjs";

// The invite panel (S-30), the invitation page (S-27) and the account's identity in the page
// (story 1.4, CAP-1, CAP-3, CAP-4, CAP-5, CAP-9, CAP-10) against the real built Worker. The tests
// use the first sign-in server of each project, set up with signin.spec.mjs's administrator, never
// the baseURL server, whose first set-up test needs set-up still open (review finding 4). Every
// account made here has an email no signin.spec.mjs test uses. The invitation read's expiry is
// mocked: the local server has no test clock (expiry itself is a server test).

// Serial, as each server holds one installation. Most tests run two or three deliberately slow
// scrypt hashes (sign-ins and accepts), and the first in each project also launches the browser.
test.describe.configure({ mode: "serial", timeout: 150_000 });

// signin.spec.mjs's administrator, so whichever file runs first sets the server up the same way.
const ADMIN = {
  installationName: "Harbourside Facilities",
  name: "Robin Example",
  email: "robin.admin@harbourside.example",
  password: "a long and correct sign-in passphrase",
};
const APP = { "x-site-survey-design": "1" };
const PASSWORD = "an invited person's long passphrase";
// The link is built on the recorded public address (CA-57). Under `wrangler dev --local-protocol
// https` the Worker sees its requests as http://, so the address set-up recorded here is the
// server's http:// origin; the tests open the link's path and fragment on the server's https://
// origin, as the deployed address would be (D-10 of story 1.3: the browser tests run over HTTPS).
const LINK_PATTERN = /^https?:\/\/127\.0\.0\.1:\d+\/invite#[A-Za-z0-9_-]{43}$/;

/** The link's path and fragment on the test server's own https:// origin. */
function openable(link, origin) {
  const url = new URL(link);
  return `${origin}${url.pathname}${url.hash}`;
}
const UNUSABLE_TITLE = "This invitation link no longer works.";
const UNUSABLE_DETAIL = "It may have been used, replaced by a newer invitation, or expired. Ask an administrator for a new one.";
const ACCEPT_FAILED =
  "Your password may not have been set. Try again; if the link then no longer works, try signing in with your email and this password.";

const servers = (testInfo) => signInServers(testInfo.project.name);
const emailFor = (label) => `${label}.invitee@harbourside.example`;

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

async function expectNoSidewaysScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

function minimumTarget(testInfo) {
  return testInfo.project.name === "webkit-iphone" ? 44 : 32;
}

async function expectTarget(locator, testInfo) {
  const box = await locator.boundingBox();
  expect(box.height, "target height").toBeGreaterThanOrEqual(minimumTarget(testInfo));
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

/** Signs in through `request` (a browser context's request shares its cookies, as another tab would). */
async function signInThroughApi(request, origin, who = ADMIN) {
  const reply = await request.post(`${origin}/api/v1/session/sign-in`, {
    headers: { origin, ...APP },
    data: { email: who.email, password: who.password },
  });
  expect(reply.status(), "sign-in through the API").toBe(200);
}

/** Invites `invitee` as the administrator from a separate request context; returns the link. */
async function createInvitation(playwright, origin, invitee) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    await signInThroughApi(api, origin);
    const reply = await api.post(`${origin}/api/v1/invitations`, {
      headers: { origin, ...APP },
      data: { email: invitee.email, name: invitee.name, role: invitee.role ?? "standard" },
    });
    expect(reply.status(), "invite through the API").toBe(200);
    const { link } = await reply.json();
    expect(link).toMatch(LINK_PATTERN);
    expect(new URL(link).port).toBe(new URL(origin).port);
    return openable(link, origin);
  } finally {
    await api.dispose();
  }
}

/** Accepts an invitation from a separate request context, with no cookies. */
async function acceptThroughApi(playwright, origin, link, name, password = PASSWORD) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const reply = await api.post(`${origin}/api/v1/invitations/accept`, {
      headers: { origin, ...APP },
      data: { secret: link.split("#")[1], name, password },
    });
    expect(reply.status(), "accept through the API").toBe(200);
  } finally {
    await api.dispose();
  }
}

/** A new browser context with the project's device, as another person's browser. */
async function freshBrowser(browser, testInfo) {
  const { defaultBrowserType, trace, screenshot, video, baseURL, ...options } = testInfo.project.use;
  const context = await browser.newContext(options);
  return { context, page: await context.newPage() };
}

async function signInOnPage(page, origin) {
  await page.goto(`${origin}/`);
  await expect(page.getByRole("heading", { name: `Sign in to ${ADMIN.installationName}` })).toBeVisible();
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
}

async function openAccountMenu(page) {
  await page.locator(".account-trigger").click();
  await expect(page.getByRole("group", { name: "Account" })).toBeVisible();
}

const inviteItem = (page) => page.getByRole("button", { name: "Invite a person" });
const panel = (page) => page.getByRole("dialog", { name: "Invite a person" });
const joinHeading = (page) => page.getByRole("heading", { name: `Join ${ADMIN.installationName}` });

async function openInvitePanel(page) {
  await openAccountMenu(page);
  await inviteItem(page).click();
  await expect(panel(page)).toBeVisible();
}

async function fillInvite(page, { email, name, role = "Standard user" }) {
  await panel(page).getByLabel("Email").fill(email);
  await panel(page).getByLabel("Name").fill(name);
  await panel(page).getByRole("radio", { name: role }).check();
  await panel(page).getByRole("button", { name: "Create invitation" }).click();
}

/** The rule list's items as [state text, met] pairs, in order. */
async function ruleStates(page) {
  return page.locator(".invitation-rule").evaluateAll((items) =>
    items.map((item) => [item.querySelector(".invitation-rule-state").textContent, item.dataset.met === "true"]));
}

async function setVisibility(page, state) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

test.beforeEach(async ({ request }, testInfo) => {
  await completeSetup(request, servers(testInfo)[0]);
});

test("an administrator's account menu holds Invite a person, which opens a labelled panel that Escape and Close leave with focus on the menu", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signInOnPage(page, server.origin);
  await openAccountMenu(page);
  await expectTarget(inviteItem(page), testInfo);
  await inviteItem(page).click();
  const dialog = panel(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  // Focus moved into the panel, on its first field.
  await expect(dialog.getByLabel("Email")).toBeFocused();
  await expect(dialog.getByRole("radio", { name: "Standard user" })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Administrator" })).not.toBeChecked();
  await expect(dialog.getByLabel("Email")).toHaveCSS("font-size", "16px");
  for (const name of ["Create invitation", "Close"]) await expectTarget(dialog.getByRole("button", { name }), testInfo);
  await expectNoSidewaysScroll(page);
  await expectAccessible(page, ".invite-panel");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".account-trigger")).toBeFocused();
  await openInvitePanel(page);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".account-trigger")).toBeFocused();
});

test("inviting shows the link once with Copy and the expiry as local date and time; Invite another person starts again", async ({ page, context }, testInfo) => {
  const [server] = servers(testInfo);
  await signInOnPage(page, server.origin);
  await openInvitePanel(page);
  const reply = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/invitations");
  await fillInvite(page, { email: emailFor("copy"), name: "Casey Copy" });
  const { expiresAt } = await (await reply).json();
  const dialog = panel(page);
  const link = dialog.getByLabel("Invitation link for Casey Copy");
  await expect(link).toHaveValue(LINK_PATTERN);
  await expect(link).toHaveJSProperty("readOnly", true);
  const value = await link.inputValue();
  expect(new URL(value).host).toBe(new URL(server.origin).host);
  await expect(dialog.getByTestId("invite-expiry")).toHaveText(
    /^This link works once and expires on \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}, \d{2}:\d{2}\. Anyone who has it can create this account, so pass it on privately\.$/,
  );
  // The expiry the page states is the reply's date and time, in the browser's own time zone.
  const shown = await dialog.getByTestId("invite-expiry").textContent();
  const expected = await page.evaluate((iso) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
    return `${part("day")} ${part("month")} ${part("year")}, ${part("hour")}:${part("minute")}`;
  }, expiresAt);
  expect(shown).toContain(`expires on ${expected}.`);
  await expectAccessible(page, ".invite-panel");
  if (testInfo.project.name === "chromium") {
    // Only Chromium lets Playwright grant clipboard permission (CAP-10).
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.origin });
    await dialog.getByRole("button", { name: "Copy link" }).click();
    await expect(dialog.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
  }
  await dialog.getByRole("button", { name: "Invite another person" }).click();
  await expect(dialog.getByLabel("Email")).toHaveValue("");
  await expect(dialog.getByLabel("Name")).toHaveValue("");
  await expect(dialog.getByRole("textbox", { name: /Invitation link/ })).toHaveCount(0);
  // Closing discards the link: reopening shows the empty form (D-9).
  await dialog.getByRole("button", { name: "Close" }).click();
  await openInvitePanel(page);
  await expect(dialog.getByRole("textbox", { name: /Invitation link/ })).toHaveCount(0);
});

test("when copying fails the link is selected and the panel says to copy it by hand", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("denied")) } });
  });
  await signInOnPage(page, server.origin);
  await openInvitePanel(page);
  await fillInvite(page, { email: emailFor("nocopy"), name: "Noel Copy" });
  const dialog = panel(page);
  await expect(dialog.getByLabel("Invitation link for Noel Copy")).toHaveValue(LINK_PATTERN);
  await dialog.getByRole("button", { name: "Copy link" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Select the link and copy it.");
  expect(await page.evaluate(() => {
    const field = document.getElementById("invite-link");
    return document.activeElement === field && field.selectionStart === 0 && field.selectionEnd === field.value.length;
  })).toBe(true);
});

test("inviting an email that has an account shows the refusal by Email and no link", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signInOnPage(page, server.origin);
  await openInvitePanel(page);
  const reply = page.waitForResponse("**/api/v1/invitations");
  await fillInvite(page, { email: ADMIN.email.toUpperCase(), name: "Robin Again" });
  expect((await reply).status()).toBe(409);
  const email = panel(page).getByLabel("Email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("That email already has an account.");
  await expect(email).toBeFocused();
  await expect(panel(page).getByRole("textbox", { name: /Invitation link/ })).toHaveCount(0);
  await expect(panel(page)).not.toContainText(ADMIN.email.toUpperCase());
});

test("when the invite request gets no answer the panel says so above its button", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signInOnPage(page, server.origin);
  await page.route("**/api/v1/invitations", (route) => route.abort("connectionrefused"));
  await openInvitePanel(page);
  await fillInvite(page, { email: emailFor("noanswer"), name: "Nora Answer" });
  const alert = panel(page).getByRole("alert");
  await expect(alert).toHaveText("The server could not be reached. Check the connection and try again.");
  await expect(alert).toBeFocused();
  // Above the button.
  const alertBox = await alert.boundingBox();
  const buttonBox = await panel(page).getByRole("button", { name: "Create invitation" }).boundingBox();
  expect(alertBox.y + alertBox.height).toBeLessThanOrEqual(buttonBox.y);
});

test("the link opened in a new browser shows the inviter, the installation, the role and the email, with no fragment in the address bar", async ({ browser, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const email = emailFor("open");
  const link = await createInvitation(playwright, server.origin, { email, name: "Olive Open" });
  const { context, page } = await freshBrowser(browser, testInfo);
  try {
    await page.goto(link);
    await expect(joinHeading(page)).toBeVisible();
    await expect(page.getByTestId("invitation-invited-as")).toHaveText(`${ADMIN.name} invited you as a standard user.`);
    await expect(page.getByTestId("invitation-email")).toHaveText(email);
    await expect(page.getByLabel("Name")).toHaveValue("Olive Open");
    // The secret left the address bar once the page opened (criterion 7, D-8).
    await expect(page).toHaveURL(`${server.origin}/invite`);
    expect(await page.evaluate(() => location.hash)).toBe("");
    const name = page.getByLabel("Name");
    const password = page.getByLabel("Password", { exact: true });
    await expect(name).toHaveAttribute("autocomplete", "name");
    await expect(password).toHaveAttribute("autocomplete", "new-password");
    await expect(page.getByLabel("Password again")).toHaveAttribute("autocomplete", "new-password");
    for (const field of [name, password]) await expect(field).toHaveCSS("font-size", "16px");
    // The hidden username field beside the new password, so a password manager saves the pair.
    const username = page.locator('input[autocomplete="username"]');
    await expect(username).toHaveValue(email);
    expect(await username.evaluate((element) => element.form !== null && element.form === document.querySelector("#invitation-password").form)).toBe(true);
    await expect(page.locator(".invitation-brand svg")).toBeVisible();
    await expectTarget(page.getByRole("button", { name: "Set password and sign in" }), testInfo);
    await expectNoSidewaysScroll(page);
    await expectAccessible(page);
  } finally {
    await context.close();
  }
});

test("the /invite page is served with Referrer-Policy: no-referrer, and / is not", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  for (const path of ["/invite", "/invite/"]) {
    const response = await page.goto(`${server.origin}${path}`);
    expect(response.headers()["referrer-policy"], path).toBe("no-referrer");
  }
  const app = await page.goto(`${server.origin}/`);
  expect(app.headers()["referrer-policy"]).toBeUndefined();
});

test("with the set-up state not checkable at the link, the page says so and the address bar holds no fragment", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.route("**/api/v1/setup/state", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto(`${server.origin}/invite#${"B".repeat(43)}`);
  await expect(page.getByRole("heading", { name: "Set-up cannot be checked" })).toBeVisible();
  await expect(page).toHaveURL(`${server.origin}/invite`);
});

test("with the session read not checkable at the link, the invitation page still shows", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("nosession"), name: "Sid Session" });
  await page.route("**/api/v1/session", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await expect(page.getByTestId("invitation-signed-in")).toHaveCount(0);
});

test("the administrator opening a link in their own browser is told that setting the password signs them out", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("signedin"), name: "Sian Signed" });
  await signInThroughApi(context.request, server.origin);
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await expect(page.getByTestId("invitation-signed-in")).toHaveText(`You are signed in as ${ADMIN.name}. Setting this password signs you out.`);
});

test("a malformed fragment says the link no longer works without asking the server", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  let reads = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/v1/invitations/read")) reads += 1; });
  await page.goto(`${server.origin}/invite#abc`);
  await expect(page.getByRole("heading", { name: UNUSABLE_TITLE })).toBeVisible();
  await expect(page.getByTestId("invitation-unusable-detail")).toHaveText(UNUSABLE_DETAIL);
  expect(reads).toBe(0);
  await expect(page).toHaveURL(`${server.origin}/invite`);
});

test("typing a password turns each rule met only once it is met, and a password breaking one is not sent", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  // 12 or more characters, so the password can meet the length rule and equal the email (review finding 28).
  const email = emailFor("rules");
  expect(email.length).toBeGreaterThanOrEqual(12);
  const link = await createInvitation(playwright, server.origin, { email, name: "Rui Rules" });
  let accepts = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/v1/invitations/accept")) accepts += 1; });
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  const password = page.getByLabel("Password", { exact: true });
  await expect(page.locator(".invitation-rule").nth(0)).toContainText("12 to 128 characters");
  await expect(page.locator(".invitation-rule").nth(1)).toContainText("Not the same as your email");
  // The list is announced politely.
  await expect(page.locator('[aria-live="polite"] .invitation-rules')).toHaveCount(1);
  expect(await ruleStates(page)).toEqual([["Not yet met", false], ["Not yet met", false]]);
  await password.fill("abcde");
  await expect.poll(() => ruleStates(page)).toEqual([["Not yet met", false], ["Met", true]]);
  await password.fill("abcdefghijkl");
  await expect.poll(() => ruleStates(page)).toEqual([["Met", true], ["Met", true]]);
  // The icon's shape changes with the state, not only its colour (standing rule 3).
  await expect(page.locator(".invitation-rule").nth(0).locator("svg path")).toHaveCount(1);
  await password.fill(email);
  await expect.poll(() => ruleStates(page)).toEqual([["Met", true], ["Not yet met", false]]);
  await expect(page.locator(".invitation-rule").nth(1).locator("svg circle")).toHaveCount(1);
  // A password breaking a rule is refused on the page.
  await page.getByLabel("Password again").fill(email);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(password).toBeFocused();
  // Differing passwords are refused on the page too.
  await password.fill(PASSWORD);
  await page.getByLabel("Password again").fill(`${PASSWORD} but different`);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(page.getByLabel("Password again")).toHaveAccessibleDescription("The two passwords do not match.");
  expect(accepts).toBe(0);
  await expectAccessible(page);
});

test("accepting with an edited name opens the app as that standard user, with no Invite a person; the used link then no longer works", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("accept"), name: "Avery Accept" });
  const secret = link.split("#")[1];
  const lines = [];
  page.on("console", (message) => lines.push(message.text()));
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await page.getByLabel("Name").fill("Avery Edited");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(page.getByTestId("account-name")).toHaveText("Avery Edited");
  await expect(page).toHaveURL(`${server.origin}/`);
  await openAccountMenu(page);
  await expect(page.getByTestId("account-full-name")).toHaveText("Avery Edited");
  await expect(inviteItem(page)).toHaveCount(0);
  // The same link again: used, so it no longer works (criterion 11).
  await page.goto(link);
  await expect(page.getByRole("heading", { name: UNUSABLE_TITLE })).toBeVisible();
  await expect(page.getByTestId("invitation-unusable-detail")).toHaveText(UNUSABLE_DETAIL);
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expectAccessible(page);
  for (const line of lines) {
    expect(line).not.toContain(secret);
    expect(line).not.toContain(PASSWORD);
  }
});

test("accepting an administrator invitation gives the new account Invite a person", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("admin"), name: "Ada Admin", role: "administrator" });
  await page.goto(link);
  await expect(page.getByTestId("invitation-invited-as")).toHaveText(`${ADMIN.name} invited you as an administrator.`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(page.getByTestId("account-name")).toHaveText("Ada Admin");
  await openAccountMenu(page);
  await expect(inviteItem(page)).toBeVisible();
});

test("an expired link (the read answering 410) says the link no longer works", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.route("**/api/v1/invitations/read", (route) => route.fulfill({
    status: 410,
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "invitation_unusable", message: `${UNUSABLE_TITLE} ${UNUSABLE_DETAIL}` } }),
  }));
  await page.goto(`${server.origin}/invite#${"C".repeat(43)}`);
  await expect(page.getByRole("heading", { name: UNUSABLE_TITLE })).toBeVisible();
  await expect(page.getByTestId("invitation-unusable-detail")).toHaveText(UNUSABLE_DETAIL);
});

test("a reload after opening asks to open the link again", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("reload"), name: "Remy Reload" });
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Open the invitation link again to continue." })).toBeVisible();
  // The link itself still works, opened afresh (from /invite, going to the link would only change
  // the fragment, without loading the page).
  await page.goto("about:blank");
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
});

test("when the invitation read fails the page says it cannot be checked, and Try again reads it again", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("readfail"), name: "Reid Fail" });
  const heading = page.getByRole("heading", { name: "The invitation cannot be checked" });
  for (const [name, handler] of [
    ["a failed request", (route) => route.abort("connectionrefused")],
    ["a 500", (route) => route.fulfill({ status: 500, body: "" })],
  ]) {
    await page.route("**/api/v1/invitations/read", handler);
    // Each pass starts from a fresh document. From /invite, going to the link would change only the
    // fragment, and the page's hashchange reload would then race this pass's checks and the
    // unroute below (pull request 12, round 1).
    await page.goto("about:blank");
    await page.goto(link);
    await expect(heading, name).toBeVisible();
    await expect(page.getByText("The server did not say whether this invitation works. Check the connection and try again.")).toBeVisible();
    await page.unroute("**/api/v1/invitations/read");
  }
  await expectAccessible(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(joinHeading(page)).toBeVisible();
});

test("when the invitation read answers updating the page says so, and Try again reads it again", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("readupdating"), name: "Uma Updating" });
  await page.route("**/api/v1/invitations/read", (route) => route.fulfill({
    status: 503,
    headers: { "content-type": "application/json", "retry-after": "5" },
    body: JSON.stringify({ error: { code: "updating", message: "Site Survey Design is updating. Try again in a moment." } }),
  }));
  await page.goto(link);
  await expect(page.getByText("Site Survey Design is updating. Try again in a moment.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The invitation cannot be checked" })).toHaveCount(0);
  await page.unroute("**/api/v1/invitations/read");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(joinHeading(page)).toBeVisible();
});

test("when accepting fails the page says the password may not have been set, and Try again completes it", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("acceptfail"), name: "Ari Fail" });
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await page.route("**/api/v1/invitations/accept", (route) => route.fulfill({ status: 500, body: "" }));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText(ACCEPT_FAILED);
  await expect(alert).toBeFocused();
  await page.unroute("**/api/v1/invitations/accept");
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("account-name")).toHaveText("Ari Fail");
});

test("when the hash queue is full the page asks to try again in a moment", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("busy"), name: "Bea Busy" });
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await page.route("**/api/v1/invitations/accept", (route) => route.fulfill({
    status: 503,
    headers: { "retry-after": "5" },
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "signin_busy", message: "Site Survey Design is busy. Try again shortly." } }),
  }));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(page.getByRole("alert")).toHaveText("Site Survey Design is busy. Try again in a moment.");
});

test("after a sign-in, a session read answering signed out shows the sign-in page, and one that cannot be checked says so", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  const signInHeading = page.getByRole("heading", { name: `Sign in to ${ADMIN.installationName}` });
  for (const [name, fulfil, expected] of [
    ["signed out", { status: 200, contentType: "application/json", body: JSON.stringify({ signedIn: false, installationName: ADMIN.installationName }) }, signInHeading],
    ["a 500", { status: 500, body: "" }, page.getByRole("heading", { name: "Sign-in cannot be checked" })],
  ]) {
    let reads = 0;
    // The first session read, when the page opens, is the server's; the one after the sign-in is mocked.
    await page.route("**/api/v1/session", (route) => {
      reads += 1;
      return reads === 1 ? route.continue() : route.fulfill(fulfil);
    });
    await page.goto(`${server.origin}/`);
    await expect(signInHeading).toBeVisible();
    const reply = page.waitForResponse("**/api/v1/session/sign-in");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    expect((await reply).status(), name).toBe(200);
    await expect(expected, name).toBeVisible();
    await expect.poll(() => reads, name).toBe(2);
    await expect(page.getByTestId("account-name")).toHaveCount(0);
    await page.unroute("**/api/v1/session");
    // Signed out again on the server, for the next case.
    await page.context().clearCookies();
  }
});

test("a tab signed in as one account reloads as another account of the same name signed in from another tab (story 1.3's D-16)", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const twin = { email: emailFor("twin"), name: ADMIN.name, password: PASSWORD };
  const link = await createInvitation(playwright, server.origin, { email: twin.email, name: twin.name });
  await acceptThroughApi(playwright, server.origin, link, twin.name);
  await signInOnPage(page, server.origin);
  await openAccountMenu(page);
  await expect(inviteItem(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await setVisibility(page, "hidden");
  await page.evaluate(() => { window.__notReloaded = true; });
  // Another tab of the same browser signs in as the other account, which has the same name.
  await signInThroughApi(context.request, server.origin, twin);
  const reloaded = page.waitForEvent("load");
  await setVisibility(page, "visible");
  await reloaded;
  expect(await page.evaluate(() => window.__notReloaded)).toBeUndefined();
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  await openAccountMenu(page);
  await expect(inviteItem(page)).toHaveCount(0);
});

test("at /invite, another account signed in from another tab updates the notice without a reload, keeping the form and what was typed (pull request 12)", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const other = { email: emailFor("othertab"), name: "Olive Othertab", password: PASSWORD };
  await acceptThroughApi(playwright, server.origin, await createInvitation(playwright, server.origin, { email: other.email, name: other.name }), other.name);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("keepform"), name: "Kit Keepform" });
  await signInThroughApi(context.request, server.origin);
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await expect(page.getByTestId("invitation-signed-in")).toHaveText(`You are signed in as ${ADMIN.name}. Setting this password signs you out.`);
  await page.getByLabel("Name").fill("Kit Edited");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await setVisibility(page, "hidden");
  await page.evaluate(() => { window.__notReloaded = true; });
  // Another tab of the same browser signs in as a different account.
  await signInThroughApi(context.request, server.origin, other);
  await setVisibility(page, "visible");
  await expect(page.getByTestId("invitation-signed-in")).toHaveText(`You are signed in as ${other.name}. Setting this password signs you out.`);
  expect(await page.evaluate(() => window.__notReloaded)).toBe(true);
  await expect(joinHeading(page)).toBeVisible();
  await expect(page.getByTestId("invitation-email")).toHaveText(emailFor("keepform"));
  await expect(page.getByLabel("Name")).toHaveValue("Kit Edited");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(PASSWORD);
  await expect(page.getByLabel("Password again")).toHaveValue(PASSWORD);
  await expect(page).toHaveURL(link.split("#")[0]);
});

const refusalReply = (status, error) => ({ status, contentType: "application/json", body: JSON.stringify({ error }) });

test("an invite refused as not signed in shows the sign-in page", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signInOnPage(page, server.origin);
  await page.route("**/api/v1/invitations", (route) =>
    route.fulfill(refusalReply(401, { code: "not_signed_in", message: "Sign in to do this." })));
  await openInvitePanel(page);
  await fillInvite(page, { email: emailFor("signedout"), name: "Sol Signedout" });
  await expect(page.getByRole("heading", { name: `Sign in to ${ADMIN.installationName}` })).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
});

test("an invite refused for its name shows the message by the Name field", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signInOnPage(page, server.origin);
  await page.route("**/api/v1/invitations", (route) =>
    route.fulfill(refusalReply(400, { code: "invalid_input", message: "The request is not valid.", field: "name" })));
  await openInvitePanel(page);
  await fillInvite(page, { email: emailFor("badname"), name: "Nat Badname" });
  const name = panel(page).getByLabel("Name");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription("Enter the person's name, 1 to 80 characters.");
  await expect(name).toBeFocused();
  await expect(panel(page).getByRole("textbox", { name: /Invitation link/ })).toHaveCount(0);
});

test("an accept refused as unusable replaces the form with the no-longer-works message", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("goneaccept"), name: "Gil Gone" });
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await page.route("**/api/v1/invitations/accept", (route) =>
    route.fulfill(refusalReply(410, { code: "invitation_unusable", message: `${UNUSABLE_TITLE} ${UNUSABLE_DETAIL}` })));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(page.getByRole("heading", { name: UNUSABLE_TITLE })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
});

test("an accept refused for its password shows the server's message by the Password field", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("badpassword"), name: "Pat Badpassword" });
  await page.goto(link);
  await expect(joinHeading(page)).toBeVisible();
  await page.route("**/api/v1/invitations/accept", (route) =>
    route.fulfill(refusalReply(400, { code: "invalid_input", message: "The request is not valid.", field: "password" })));
  const password = page.getByLabel("Password", { exact: true });
  await password.fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByRole("button", { name: "Set password and sign in" }).click();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#invitation-password-error")).toHaveText("Use 12 to 128 characters, not the same as your email.");
  await expect(password).toHaveAccessibleDescription(/^Use 12 to 128 characters, not the same as your email\./);
  await expect(password).toBeFocused();
});

test("a link opened at /invite/ shows the invitation, with no fragment in the address bar", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const link = await createInvitation(playwright, server.origin, { email: emailFor("slash"), name: "Sasha Slash" });
  await page.goto(`${server.origin}/invite/#${link.split("#")[1]}`);
  await expect(joinHeading(page)).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("Sasha Slash");
  await expect(page).toHaveURL(`${server.origin}/invite/`);
});

test("a second link opened in a tab already at /invite shows that invitation, with no fragment in the address bar", async ({ page, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  const first = await createInvitation(playwright, server.origin, { email: emailFor("firstlink"), name: "Fern First" });
  const second = await createInvitation(playwright, server.origin, { email: emailFor("secondlink"), name: "Sam Second" });
  await page.goto(first);
  await expect(page.getByLabel("Name")).toHaveValue("Fern First");
  // Opening the second link in the same tab changes only the fragment.
  await page.evaluate((hash) => { location.hash = hash; }, second.split("#")[1]);
  await expect(page.getByLabel("Name")).toHaveValue("Sam Second");
  await expect(page.getByTestId("invitation-email")).toHaveText(emailFor("secondlink"));
  await expect(page).toHaveURL(`${server.origin}/invite`);
});
