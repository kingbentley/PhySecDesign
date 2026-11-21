import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { setupCodeVariable } from "./playwright.config.mjs";

// The set-up page (S-25, story 1.2) against the real built Worker. Each project has one fresh
// installation, so these tests run in order: refusals first, then the set-up that closes it.

test.describe.configure({ mode: "serial" });

const ADMIN = {
  installationName: "Westbrook Security",
  name: "Avery Example",
  email: "Avery.Admin@Westbrook.Example",
  password: "correct horse battery staple",
};
const WRONG_CODE = "WRONGCODE7777777777777777";

function setupCode(testInfo) {
  const code = process.env[setupCodeVariable(testInfo.project.name)];
  if (!code) throw new Error("No set-up code for this project: run through playwright.config.mjs.");
  return code;
}

/** Fails on any serious or critical axe violation (standing rule 15). */
async function expectAccessible(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  expect(serious, "serious or critical axe violations").toEqual([]);
}

async function expectNoSidewaysScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

async function openSetup(page) {
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "Set up this installation" })).toBeVisible();
}

async function fill(page, values) {
  const all = { code: WRONG_CODE, ...ADMIN, passwordAgain: values.password ?? ADMIN.password, ...values };
  await page.getByLabel("Set-up code").fill(all.code);
  await page.getByLabel("Name of this installation").fill(all.installationName);
  await page.getByLabel("Your name").fill(all.name);
  await page.getByLabel("Email").fill(all.email);
  await page.getByLabel("Password", { exact: true }).fill(all.password);
  await page.getByLabel("Password again").fill(all.passwordAgain);
}

async function send(page) {
  await page.getByRole("button", { name: "Create administrator and finish" }).click();
}

function refusalReply(code, extra = {}, status = 400) {
  return { status, contentType: "application/json", body: JSON.stringify({ error: { code, message: "x", ...extra } }) };
}

test("shows the set-up page with every field and the statement when set-up is open", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByRole("heading", { name: "Set up this installation" })).toBeVisible();
  for (const label of ["Set-up code", "Name of this installation", "Your name", "Email", "Password again"]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByRole("group", { name: "First administrator" })).toBeVisible();
  await expect(page.getByText("It disappears once an administrator exists.")).toBeVisible();
  await expect(page.getByLabel("Set-up code")).toHaveCSS("font-size", "16px");
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});

test("a field that breaks a rule is not sent, is explained and is focused", async ({ page }) => {
  let sent = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/v1/setup")) sent += 1; });
  await openSetup(page);
  await send(page);
  await expect(page.getByLabel("Set-up code")).toBeFocused();
  for (const [label, message] of [
    ["Set-up code", "Enter the set-up code"],
    ["Name of this installation", "Enter a name of 1 to 80 characters."],
    ["Your name", "Enter your name, 1 to 80 characters."],
    ["Email", "Enter an email address"],
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveAccessibleDescription(new RegExp(message));
  }
  await fill(page, { email: "not-an-email" });
  await send(page);
  await expect(page.getByLabel("Email")).toBeFocused();
  await fill(page, { password: ADMIN.email.toUpperCase() });
  await send(page);
  await expect(page.getByLabel("Password", { exact: true })).toHaveAccessibleDescription(/must not be the same as your email/);
  await fill(page, { password: "short-pass" });
  await send(page);
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toBeFocused();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(password).toHaveAccessibleDescription(/Use 12 to 128 characters\./);
  await expect(page.locator("#setup-password-error")).not.toContainText("short-pass");
  await fill(page, { password: ADMIN.password, passwordAgain: "something else entirely" });
  await send(page);
  await expect(page.getByLabel("Password again")).toBeFocused();
  await expect(page.getByLabel("Password again")).toHaveAccessibleDescription("The two passwords do not match.");
  expect(sent).toBe(0);
  await expectAccessible(page);
});

test("a field refused by the server is explained and focused", async ({ page }) => {
  await page.route("**/api/v1/setup", (route) => route.fulfill(refusalReply("invalid_input", { field: "email" })));
  await openSetup(page);
  await fill(page, {});
  await send(page);
  await expect(page.getByLabel("Email")).toBeFocused();
  await expect(page.getByLabel("Email")).toHaveAccessibleDescription(/Enter an email address/);
  await expectAccessible(page);
});

test("a password refused by the server is explained on the password field and focused", async ({ page }) => {
  await page.route("**/api/v1/setup", (route) => route.fulfill(refusalReply("invalid_input", { field: "password" })));
  await openSetup(page);
  await fill(page, {});
  await send(page);
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toBeFocused();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(password).toHaveAccessibleDescription(/Use 12 to 128 characters, not the same as your email\./);
  await expectAccessible(page);
});

test("the passwords' mismatch is named on the first submit, even when the password also breaks a rule", async ({ page }) => {
  await openSetup(page);
  await fill(page, { password: "short", passwordAgain: "different" });
  await send(page);
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAccessibleDescription(/Use 12 to 128 characters\./);
  await expect(page.getByLabel("Password again")).toHaveAccessibleDescription("The two passwords do not match.");
});

test("a second press while the first set-up request is on its way sends nothing more", async ({ page }) => {
  let sent = 0;
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/api/v1/setup", async (route) => {
    sent += 1;
    await held;
    await route.fulfill(refusalReply("setup_code_wrong", {}, 403));
  });
  await openSetup(page);
  await fill(page, {});
  const form = page.locator("form.setup-form");
  // Two submits in the same moment, before React has re-rendered the button.
  await form.evaluate((element) => { element.requestSubmit(); element.requestSubmit(); });
  await expect(page.getByRole("button", { name: "Creating administrator…" })).toBeVisible();
  await expect.poll(() => sent).toBe(1);
  release();
  await expect(page.getByLabel("Set-up code")).toHaveAccessibleDescription(/That set-up code is not correct\./);
  expect(sent).toBe(1);
});

test("a wrong code is refused with its message and the code field is focused", async ({ page }) => {
  await openSetup(page);
  await fill(page, { code: WRONG_CODE });
  const reply = page.waitForResponse("**/api/v1/setup");
  await send(page);
  expect((await reply).status()).toBe(403);
  const code = page.getByLabel("Set-up code");
  await expect(code).toBeFocused();
  await expect(code).toHaveAccessibleDescription(/That set-up code is not correct\./);
  await expect(page.locator("main")).not.toContainText(WRONG_CODE);
  await expectAccessible(page);
});

test("wrong codes are counted: after five from one address the page states the wait and the fresh-code remedy", async ({ page }) => {
  // Its own network address, so that this wait does not hold up the set-up below. On Cloudflare
  // this header is set by Cloudflare; the local runtime passes it through.
  await page.setExtraHTTPHeaders({ "CF-Connecting-IP": "192.0.2.44" });
  await openSetup(page);
  await fill(page, { code: WRONG_CODE });
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const reply = page.waitForResponse("**/api/v1/setup");
    await send(page);
    expect((await reply).status(), `wrong code ${attempt}`).toBe(403);
  }
  const reply = page.waitForResponse("**/api/v1/setup");
  await send(page);
  expect((await reply).status()).toBe(429);
  const code = page.getByLabel("Set-up code");
  await expect(code).toBeFocused();
  // The wait is counted from the fifth failure, so a second may pass before the reply.
  await expect(code).toHaveAccessibleDescription(/Wait (1 minute|59 seconds) before trying again/);
  await expect(code).toHaveAccessibleDescription(/deploy again to get a fresh set-up code/);
  await expectAccessible(page);
});

test("other refusals each show their own message", async ({ page }) => {
  const replies = [
    [refusalReply("origin_refused", {}, 403), "must be sent from this installation's own page"],
    [refusalReply("setup_code_not_configured", {}, 503), "no set-up code has been issued"],
    [refusalReply("invalid_input", { field: "somethingElse" }), "Some of the details were not accepted."],
    [refusalReply("internal_error", {}, 500), "Set-up could not be completed. Try again."],
    [refusalReply("updating", {}, 503), "Site Survey Design is updating. Try again in a moment."],
    [refusalReply("https_required", {}, 403), "Set-up must be sent over HTTPS."],
    [refusalReply("data_newer_than_build", {}, 503), "from a newer release of Site Survey Design"],
    [null, "The server could not be reached."],
  ];
  let next = 0;
  await page.route("**/api/v1/setup", (route) => {
    const [reply] = replies[next];
    return reply ? route.fulfill(reply) : route.abort("connectionrefused");
  });
  await openSetup(page);
  await fill(page, {});
  for (const [, message] of replies) {
    await send(page);
    const alert = page.getByRole("alert");
    await expect(alert).toContainText(message);
    await expect(alert).toBeFocused();
    if (next === 0) await expectAccessible(page);
    next += 1;
  }
});

test("a request that reached a copy with the earlier code says a new code was issued, on the code field (D-7)", async ({ page }) => {
  await page.route("**/api/v1/setup", (route) => route.fulfill(refusalReply("setup_code_replaced", {}, 409)));
  await openSetup(page);
  await fill(page, {});
  await send(page);
  const code = page.getByLabel("Set-up code");
  await expect(code).toBeFocused();
  await expect(code).toHaveAccessibleDescription(/A new set-up code was issued moments ago\. Wait about a minute/);
  await expectAccessible(page);
});

test("the set-up address also works with a trailing slash", async ({ page }) => {
  await page.goto("/setup/");
  await expect(page.getByRole("heading", { name: "Set up this installation" })).toBeVisible();
});

test("if the set-up page's code cannot be loaded, the page says so and offers a reload", async ({ page }) => {
  await page.route(/\/assets\/SetupPage-[^/]*\.js$/, (route) => route.abort("connectionrefused"));
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "The set-up page could not be loaded" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload" })).toBeVisible();
  await expectAccessible(page);
});

test("at 200% zoom (640 px wide) the form is one column, with no sideways scroll and no clipped label", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await openSetup(page);
  const left = async (label) => (await page.getByLabel(label, { exact: true }).boundingBox()).x;
  const columns = new Set([await left("Your name"), await left("Email"), await left("Password"), await left("Password again")]);
  expect(columns.size, "the administrator's fields share one column").toBe(1);
  await expectNoSidewaysScroll(page);
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll(".setup-page label, .setup-page legend, .setup-page h1, .setup-page button")]
      .filter((element) => element.scrollWidth > element.clientWidth + 1 || element.getBoundingClientRect().right > window.innerWidth)
      .map((element) => element.textContent));
  expect(clipped).toEqual([]);
  await expectAccessible(page);
});

test("when the state cannot be checked, every address says so and offers to try again, with no prototype", async ({ page }) => {
  // Two cases wait out the 5-second read timeout at each address, so the default 30 s is too close
  // on a slow WebKit run (30.7 s on 2026-11-21).
  test.setTimeout(60_000);
  // Story 1.3, D-7 amended again: only "no server" (a 404 or a reply that is not the declared
  // JSON) opens the prototype; a 500, a 503 `updating`, a failed request or no answer within 5 s
  // shows "Set-up cannot be checked", at / and at /setup.
  const failures = [
    ["a 500", (route) => route.fulfill({ status: 500, body: "" })],
    ["a 503 updating", (route) => route.fulfill(refusalReply("updating", {}, 503))],
    ["a failed request", (route) => route.abort("connectionrefused")],
    ["no answer within 5 seconds", () => new Promise(() => {})],
  ];
  for (const [name, handler] of failures) {
    await page.route("**/api/v1/setup/state", handler);
    for (const address of ["/", "/setup"]) {
      await page.goto(address);
      await expect(page.getByRole("heading", { name: "Set-up cannot be checked" }), `${name} at ${address}`).toBeVisible();
      await expect(page.locator(".studio-label")).toHaveCount(0);
    }
    await page.unroute("**/api/v1/setup/state");
  }
  await page.route("**/api/v1/setup/state", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Set-up cannot be checked" })).toBeVisible();
  await expectAccessible(page);
  await page.unroute("**/api/v1/setup/state");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Set up this installation" })).toBeVisible();
  await expect(page).toHaveURL(/\/setup$/);
});

test("completes set-up and confirms the installation's name and the administrator's email", async ({ page }, testInfo) => {
  await openSetup(page);
  // Typed in lower case with surrounding spaces: the code still matches.
  await fill(page, { code: `  ${setupCode(testInfo).toLowerCase()}  ` });
  await send(page);
  await expect(page.getByRole("heading", { name: "Set-up is complete" })).toBeFocused();
  await expect(page.getByTestId("setup-done-installation")).toHaveText(ADMIN.installationName);
  await expect(page.getByTestId("setup-done-email")).toHaveText(ADMIN.email.toLowerCase());
  await expect(page.getByTestId("setup-done-next")).toHaveText("Sign in with the email and password you just chose.");
  await expectNoSidewaysScroll(page);
  await expectAccessible(page);
});

test("after set-up the set-up address says set-up is already complete, and the app shows the sign-in page", async ({ page }) => {
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "Set-up is already complete" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Site Survey Design" })).toHaveAttribute("href", "/");
  await expectAccessible(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: `Sign in to ${ADMIN.installationName}` })).toBeVisible();
  await expect(page.locator(".studio-label")).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/setup$/);
});

test("a set-up sent after another has finished is refused and the page says set-up is already complete", async ({ page }, testInfo) => {
  // The page believes set-up is open (as it would if opened before the other set-up finished);
  // the real server refuses the request.
  await page.route("**/api/v1/setup/state", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ state: "open" }) }));
  await openSetup(page);
  await fill(page, { code: setupCode(testInfo), email: "second@westbrook.example" });
  const reply = page.waitForResponse("**/api/v1/setup");
  await send(page);
  expect((await reply).status()).toBe(409);
  await expect(page.getByRole("heading", { name: "Set-up is already complete" })).toBeFocused();
  await expectAccessible(page);
});
