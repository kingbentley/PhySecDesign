import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signInServers } from "./playwright.config.mjs";

// The sign-in page (S-26), the account menu and sign-out (story 1.3, CAP-1, CAP-4, CAP-5, CAP-14)
// against the real built Worker. Each project has its own pair of servers: the first holds the
// installation most tests use, completed through the API; the second is set up by the test of two
// installations on one host and holds the administrator with an 80-character name (A-20, V-14).
// Requests with no `CF-Connecting-IP` come from the unknown address, which has no address limit
// (D-11); tests that produce failures from a known address stay under 20 (V-15).

// Serial, as each server holds one installation. Each sign-in runs a deliberately slow scrypt hash,
// and the first test also meets six freshly started servers, so a test may take longer than 30 s.
test.describe.configure({ mode: "serial", timeout: 90_000 });

const ADMIN = {
  installationName: "Harbourside Facilities",
  name: "Robin Example",
  email: "robin.admin@harbourside.example",
  password: "a long and correct sign-in passphrase",
};
const LONG_NAME = "Alexandra Bartholomew-Fitzgerald Montgomery-Wellington of the Harbourside Estate";
const SECOND = {
  installationName: "Second Installation",
  name: LONG_NAME,
  email: "second.admin@harbourside.example",
  password: "another long and correct passphrase",
};
const REVIEW_LINK = `#review=${"a".repeat(32)}.${"b".repeat(64)}`;
const SESSION_COOKIE = /^__Host-ssd-[0-9a-f]{32}$/;
const MARKER_COOKIE = /^__Host-ssd-m-[0-9a-f]{32}$/;
const ONE_MESSAGE = "That email and password do not match.";

const servers = (testInfo) => signInServers(testInfo.project.name);

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

/** Completes set-up through the API (A-20), unless it is already complete. */
async function completeSetup(request, server, admin) {
  const state = await request.get(`${server.origin}/api/v1/setup/state`);
  if ((await state.json()).state === "closed") return;
  const reply = await request.post(`${server.origin}/api/v1/setup`, {
    headers: { origin: server.origin, "x-site-survey-design": "1" },
    data: { code: server.code, installationName: admin.installationName, name: admin.name, email: admin.email, password: admin.password },
  });
  expect(reply.status(), "set-up through the API").toBe(200);
}

const signInHeading = (page, installationName = ADMIN.installationName) =>
  page.getByRole("heading", { name: `Sign in to ${installationName}` });

async function fillSignIn(page, email, password) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signIn(page, origin, admin = ADMIN) {
  await page.goto(`${origin}/`);
  await expect(signInHeading(page, admin.installationName)).toBeVisible();
  await fillSignIn(page, admin.email, admin.password);
  await expect(page.getByTestId("account-name")).toHaveText(admin.name);
}

async function openAccountMenu(page) {
  await page.locator(".account-trigger").click();
  await expect(page.getByRole("group", { name: "Account" })).toBeVisible();
}

async function cookiesNamed(context, pattern) {
  return (await context.cookies()).filter((cookie) => pattern.test(cookie.name));
}

/** Ends the browser's session through the API from a separate request context; the browser keeps its cookie. */
async function endSessionThroughApi(playwright, context, origin) {
  const [session] = await cookiesNamed(context, SESSION_COOKIE);
  expect(session, "the browser holds a session cookie").toBeTruthy();
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  const reply = await api.post(`${origin}/api/v1/session/sign-out`, {
    headers: { origin, "x-site-survey-design": "1", cookie: `${session.name}=${session.value}` },
    data: {},
  });
  expect(reply.status()).toBe(200);
  await api.dispose();
}

async function setVisibility(page, state) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

function minimumTarget(testInfo) {
  return testInfo.project.name === "webkit-iphone" ? 44 : 32;
}

test.beforeEach(async ({ request }, testInfo) => {
  await completeSetup(request, servers(testInfo)[0], ADMIN);
});

test("the set-up done page says to sign in, with a plain Sign in link (D-9)", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.route("**/api/v1/setup/state", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ state: "open" }) }));
  await page.route("**/api/v1/setup", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ installationName: "Mocked", email: "mocked@example.test" }) }));
  await page.goto(`${server.origin}/setup`);
  await page.getByLabel("Set-up code").fill("MOCKEDCODEMOCKEDCODE2345");
  await page.getByLabel("Name of this installation").fill("Mocked");
  await page.getByLabel("Your name").fill("Mocked Person");
  await page.getByLabel("Email").fill("mocked@example.test");
  await page.getByLabel("Password", { exact: true }).fill("a mocked long password");
  await page.getByLabel("Password again").fill("a mocked long password");
  await page.getByRole("button", { name: "Create administrator and finish" }).click();
  await expect(page.getByTestId("setup-done-next")).toHaveText("Sign in with the email and password you just chose.");
  const link = page.getByRole("link", { name: "Sign in" });
  await expect(link).toHaveAttribute("href", "/");
  expect(await link.evaluate((element) => element.outerHTML)).toBe('<a href="/">Sign in</a>');
  await expect(page.getByRole("link", { name: "Open Site Survey Design" })).toHaveCount(0);
  await expectAccessible(page);
});

test("signed out, the sign-in page names the installation and asks only for email and password, with no prototype", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.goto(`${server.origin}/`);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator(".studio-label")).toHaveCount(0);
  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("autocomplete", "username");
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expect(email).toHaveCSS("font-size", "16px");
  await expect(password).toHaveCSS("font-size", "16px");
  expect(await email.evaluate((element) => element.form !== null && element.form === document.querySelector("form"))).toBe(true);
  expect(await password.evaluate((element) => element.form !== null)).toBe(true);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(/forgot/i)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});

test("at /setup after set-up a signed-out visitor sees set-up is complete, and its link shows the sign-in page", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.goto(`${server.origin}/setup`);
  await expect(page.getByRole("heading", { name: "Set-up is already complete" })).toBeVisible();
  await page.getByRole("link", { name: "Open Site Survey Design" }).click();
  await expect(signInHeading(page)).toBeVisible();
});

test("a wrong password and an unknown email get the same one message, which repeats nothing typed", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.goto(`${server.origin}/`);
  const alert = page.getByRole("alert");
  for (const [email, password] of [[ADMIN.email, "not the right password"], ["nobody.here@harbourside.example", ADMIN.password]]) {
    const reply = page.waitForResponse("**/api/v1/session/sign-in");
    await fillSignIn(page, email, password);
    expect((await reply).status()).toBe(401);
    await expect(alert).toHaveText(ONE_MESSAGE);
    await expect(alert).toBeFocused();
    await expect(page.locator("main")).not.toContainText(email);
    await expect(page.getByLabel("Password")).toHaveValue("");
  }
  await expectAccessible(page);
});

test("after too many attempts for an email with no account the page states the wait", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  // Its own network address, so no other test meets this wait (V-15).
  await page.setExtraHTTPHeaders({ "CF-Connecting-IP": "192.0.2.61" });
  await page.goto(`${server.origin}/`);
  const email = "no.account.wait@harbourside.example";
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const reply = page.waitForResponse("**/api/v1/session/sign-in");
    await fillSignIn(page, email, `wrong password number ${attempt}`);
    expect((await reply).status(), `attempt ${attempt}`).toBe(401);
    // The page has shown the refusal (and emptied the password) before the next attempt is typed.
    await expect(page.getByRole("alert")).toHaveText(ONE_MESSAGE);
  }
  const reply = page.waitForResponse("**/api/v1/session/sign-in");
  await fillSignIn(page, email, "wrong password number 6");
  expect((await reply).status()).toBe(429);
  // The wait is counted from the fifth failure, so a second may pass before the reply.
  await expect(page.getByRole("alert")).toHaveText(/^Too many attempts\. Wait (1 minute|5\d seconds) before trying again\.$/);
  await expectAccessible(page);
});

test("signing in opens the app with an account menu holding the name and Sign out", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.goto(`${server.origin}/`);
  // The email in another letter case with spaces around it still signs in (CAP-2).
  await fillSignIn(page, `  ${ADMIN.email.toUpperCase()} `, ADMIN.password);
  const trigger = page.locator(".account-trigger");
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  await expect(page.locator(".studio-label")).toHaveText("Site Survey Design");
  const minimum = minimumTarget(testInfo);
  const triggerBox = await trigger.boundingBox();
  expect(triggerBox.height).toBeGreaterThanOrEqual(minimum);
  expect(triggerBox.width).toBeGreaterThanOrEqual(minimum);
  expect(triggerBox.x + triggerBox.width).toBeLessThanOrEqual(page.viewportSize().width);
  await openAccountMenu(page);
  await expect(page.getByTestId("account-full-name")).toHaveText(ADMIN.name);
  const signOut = page.getByRole("button", { name: "Sign out" });
  await expect(signOut).toBeVisible();
  const signOutBox = await signOut.boundingBox();
  expect(signOutBox.height).toBeGreaterThanOrEqual(minimum);
  expect(signOutBox.x).toBeGreaterThanOrEqual(0);
  expect(signOutBox.x + signOutBox.width).toBeLessThanOrEqual(page.viewportSize().width);
  await expectAccessible(page, ".account-menu");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Account" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("signing out shows the sign-in page, removes the session cookie and keeps the marker", async ({ page, context }, testInfo) => {
  const [server] = servers(testInfo);
  await signIn(page, server.origin);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toHaveLength(1);
  await openAccountMenu(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator(".studio-label")).toHaveCount(0);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toEqual([]);
  expect(await cookiesNamed(context, MARKER_COOKIE)).toHaveLength(1);
});

test("when the server does not confirm sign-out the page stays signed in and says so", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signIn(page, server.origin);
  await page.route("**/api/v1/session/sign-out", (route) => route.fulfill({ status: 500, body: "" }));
  await openAccountMenu(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("group", { name: "Account" }).getByRole("alert")).toHaveText("You are still signed in. Try again.");
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  await expect(signInHeading(page)).toHaveCount(0);
});

test("a session ended elsewhere shows the sign-in page, not the prototype, and its cookie is cleared", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  await signIn(page, server.origin);
  await endSessionThroughApi(playwright, context, server.origin);
  expect(await cookiesNamed(context, SESSION_COOKIE)).toHaveLength(1);
  await page.goto(`${server.origin}/`);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page.locator(".studio-label")).toHaveCount(0);
  await expect.poll(async () => (await cookiesNamed(context, SESSION_COOKIE)).length).toBe(0);
});

test("when the tab becomes visible again after a sign-out elsewhere, the sign-in page shows (D-16)", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  await signIn(page, server.origin);
  await setVisibility(page, "hidden");
  await endSessionThroughApi(playwright, context, server.origin);
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  await setVisibility(page, "visible");
  await expect(signInHeading(page)).toBeVisible();
});

test("restoring a named revision leaves the account menu showing the name (V-13)", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await signIn(page, server.origin);
  await page.getByRole("button", { name: "Revisions" }).click();
  await page.getByLabel("Revision name").fill("Before the rename");
  await page.getByRole("button", { name: "Save revision" }).click();
  await expect(page.getByRole("button", { name: "Restore Before the rename" })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  // Change the draft, so the restore below really replaces it.
  const projectPanel = page.getByRole("button", { name: "Project & layers" });
  if (await projectPanel.isVisible()) await projectPanel.click();
  await page.getByRole("button", { name: "Manage" }).click();
  await page.getByRole("button", { name: "Rename project" }).click();
  await page.getByLabel("Project name").fill("Renamed before the restore");
  await page.getByLabel("Project name").press("Enter");
  await expect(page.locator(".breadcrumb strong")).toHaveText("Renamed before the restore");
  await page.getByRole("button", { name: "Revisions", exact: true }).click();
  await page.getByRole("button", { name: "Restore Before the rename" }).click();
  await expect(page.getByText("Restored Before the rename.")).toBeVisible();
  await expect(page.locator(".breadcrumb strong")).not.toHaveText("Renamed before the restore");
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  await page.reload();
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
});

test("keeps separate sessions and markers on one host; not isolated", async ({ page, context, request }, testInfo) => {
  const [first, second] = servers(testInfo);
  await completeSetup(request, second, SECOND);
  await signIn(page, first.origin);
  await signIn(page, second.origin, SECOND);
  await page.goto(`${first.origin}/`);
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
  await page.goto(`${second.origin}/`);
  await expect(page.getByTestId("account-name")).toHaveText(SECOND.name);
  // One host name: the browser holds both installations' cookies for it (D-12).
  const sessions = await cookiesNamed(context, SESSION_COOKIE);
  const markers = await cookiesNamed(context, MARKER_COOKIE);
  expect(new Set(sessions.map((cookie) => cookie.name)).size).toBe(2);
  expect(markers).toHaveLength(2);
  expect(new Set(markers.map((cookie) => cookie.name)).size).toBe(2);
});

test("an 80-character name is cut short in the header and shown in full in the menu, with no sideways scroll", async ({ page, request }, testInfo) => {
  const [, second] = servers(testInfo);
  await completeSetup(request, second, SECOND);
  expect([...LONG_NAME].length).toBe(80);
  // On desktop, 200% zoom is a 640 px wide window; the iPhone profile keeps its own viewport.
  if (testInfo.project.name !== "webkit-iphone") await page.setViewportSize({ width: 640, height: 900 });
  await signIn(page, second.origin, SECOND);
  const name = page.getByTestId("account-name");
  expect(await name.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  const box = await page.locator(".account-trigger").boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await openAccountMenu(page);
  const full = page.getByTestId("account-full-name");
  await expect(full).toHaveText(LONG_NAME);
  const fullBox = await full.boundingBox();
  expect(fullBox.x).toBeGreaterThanOrEqual(0);
  expect(fullBox.x + fullBox.width).toBeLessThanOrEqual(page.viewportSize().width);
  await expectNoSidewaysScroll(page);
  await expectAccessible(page, ".account-menu");
});

test("where there is no server the prototype opens: a session read or set-up state answering 404 or not JSON", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  const cases = [
    ["**/api/v1/session", { status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "x" } }) }],
    ["**/api/v1/session", { status: 200, contentType: "text/html", body: "<!doctype html><title>x</title>" }],
    ["**/api/v1/setup/state", { status: 404, body: "" }],
    ["**/api/v1/setup/state", { status: 200, contentType: "text/html", body: "<!doctype html><title>x</title>" }],
  ];
  for (const [pattern, reply] of cases) {
    await page.route(pattern, (route) => route.fulfill(reply));
    await page.goto(`${server.origin}/`);
    await expect(page.locator(".studio-label"), `${pattern} ${reply.status}`).toHaveText("Site Survey Design");
    await expect(page.locator(".account-trigger")).toHaveCount(0);
    await expect(signInHeading(page)).toHaveCount(0);
    await page.unroute(pattern);
  }
});

test("when the session read cannot be checked the page says so, offers Try again, and opens no prototype", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  const heading = page.getByRole("heading", { name: "Sign-in cannot be checked" });
  const failures = [
    ["a 500", (route) => route.fulfill({ status: 500, body: "" })],
    ["a 503 updating", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "updating", message: "x" } }) })],
    ["a failed request", (route) => route.abort("connectionrefused")],
    ["no answer within 5 seconds", () => new Promise(() => {})],
  ];
  for (const [name, handler] of failures) {
    await page.route("**/api/v1/session", handler);
    await page.goto(`${server.origin}/`);
    await expect(heading, name).toBeVisible();
    await expect(page.locator(".studio-label")).toHaveCount(0);
    await page.unroute("**/api/v1/session");
  }
  await page.route("**/api/v1/session", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto(`${server.origin}/`);
  await expect(heading).toBeVisible();
  await expectAccessible(page);
  let reads = 0;
  await page.unroute("**/api/v1/session");
  page.on("request", (request) => { if (request.url().endsWith("/api/v1/session")) reads += 1; });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(signInHeading(page)).toBeVisible();
  expect(reads).toBe(1);
});

test("a well-formed reviewer link opens without sign-in; a malformed one shows the sign-in page", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  const reviewHeading = page.getByRole("heading", { name: /^(Review unavailable|Opening revision review)$/ });
  await page.goto(`${server.origin}/${REVIEW_LINK}`);
  await expect(reviewHeading).toBeVisible();
  await expect(signInHeading(page)).toHaveCount(0);
  await page.goto(`${server.origin}/#review=x`);
  await expect(signInHeading(page)).toBeVisible();
  await expect(reviewHeading).toHaveCount(0);
});

test("a reviewer link that arrives by a hash change on the sign-in page opens the review without a reload", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  await page.goto(`${server.origin}/`);
  await expect(signInHeading(page)).toBeVisible();
  await page.evaluate((hash) => {
    window.__notReloaded = true;
    location.hash = hash;
  }, REVIEW_LINK);
  await expect(page.getByRole("heading", { name: /^(Review unavailable|Opening revision review)$/ })).toBeVisible();
  expect(await page.evaluate(() => window.__notReloaded)).toBe(true);
});

test("empty fields are explained on the page, the email field is focused, and nothing is sent", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  let sent = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/v1/session/sign-in")) sent += 1; });
  await page.goto(`${server.origin}/`);
  await page.getByRole("button", { name: "Sign in" }).click();
  const email = page.getByLabel("Email");
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("Enter your email address, of at most 254 characters.");
  await expect(page.getByLabel("Password")).toHaveAttribute("aria-invalid", "true");
  expect(sent).toBe(0);
});

test("Try again on 'Set-up cannot be checked' after set-up shows the sign-in page, or at /setup that set-up is complete", async ({ page }, testInfo) => {
  const [server] = servers(testInfo);
  for (const address of ["/", "/setup"]) {
    await page.route("**/api/v1/setup/state", (route) => route.fulfill({ status: 500, body: "" }));
    await page.goto(`${server.origin}${address}`);
    await expect(page.getByRole("heading", { name: "Set-up cannot be checked" })).toBeVisible();
    await page.unroute("**/api/v1/setup/state");
    await page.getByRole("button", { name: "Try again" }).click();
    if (address === "/") await expect(signInHeading(page)).toBeVisible();
    else await expect(page.getByRole("heading", { name: "Set-up is already complete" })).toBeVisible();
    await expect(page.locator(".studio-label")).toHaveCount(0);
  }
});

test("when the tab becomes visible after signing in from another tab, the sign-in page opens the app (D-16)", async ({ page, context }, testInfo) => {
  const [server] = servers(testInfo);
  await page.goto(`${server.origin}/`);
  await expect(signInHeading(page)).toBeVisible();
  await setVisibility(page, "hidden");
  // Shares the browser's cookies, as another tab would.
  const reply = await context.request.post(`${server.origin}/api/v1/session/sign-in`, {
    headers: { origin: server.origin, "x-site-survey-design": "1" },
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(reply.status()).toBe(200);
  await expect(signInHeading(page)).toBeVisible();
  await setVisibility(page, "visible");
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
});

test("with the marker, the account holder signs in from the same browser while the email is locked elsewhere", async ({ page, context, playwright }, testInfo) => {
  const [server] = servers(testInfo);
  await signIn(page, server.origin);
  await openAccountMenu(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(signInHeading(page)).toBeVisible();
  // Lock the email from another address, with no cookies (CA-44, V-1).
  const attacker = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  let locked = false;
  for (let attempt = 1; attempt <= 6 && !locked; attempt += 1) {
    const reply = await attacker.post(`${server.origin}/api/v1/session/sign-in`, {
      headers: { origin: server.origin, "x-site-survey-design": "1", "CF-Connecting-IP": "192.0.2.62" },
      data: { email: ADMIN.email, password: `not the password ${attempt}` },
    });
    locked = reply.status() === 429;
  }
  await attacker.dispose();
  expect(locked, "the email is locked").toBe(true);
  await fillSignIn(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("account-name")).toHaveText(ADMIN.name);
});
