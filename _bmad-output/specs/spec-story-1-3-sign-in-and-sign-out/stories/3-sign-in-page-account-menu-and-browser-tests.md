---
title: 'Story 1.3, spec 3: Sign-in page, account menu and browser tests'
type: 'feature'
created: '2026-11-20'
status: 'draft'
route: 'dispatch'
baseline_commit: ''
review_loop_iteration: 0
story_key: '1-3-sign-in-and-sign-out'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> **Not ready for development.** Needs spec 2 done; follows Kevin's decisions D-7 to D-10 in SPEC.md; the spec awaits an adversarial review before it is marked ready.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After set-up the app opens the prototype to anyone; there is no sign-in page, no account menu, and the set-up done page says signing in has not arrived.

**Approach:** Show S-26 to anyone not signed in once an administrator exists, open the app with an account menu (name, Sign out) after sign-in, change the set-up done text (D-9), and ship Playwright and axe tests in Chromium and WebKit iPhone, including two local installations on one host with different ports. Covers CAP-1, CAP-4, CAP-14 and the on-screen parts of CAP-5, CAP-7 and CAP-10.

## Boundaries & Constraints

**Always:**
- App code JavaScript; sign-in rules imported from `shared/` (standing rule 6). The page loads lazily, as the set-up page does.
- UX section 10: 4.5:1 contrast, 2 px focus ring, labelled 16 px fields, usable at 200% zoom; `BrandMark`; white and teal.
- Fields fillable by a password manager: a `<form>`, `autocomplete="username"` and `autocomplete="current-password"`, `type="email"` and `type="password"`.
- The one failure message and the wait come from the server's refusal; the page never says whether an email exists.
- Tests use generated local secrets only, never committed. No manual-only page check.

**Never:** Server, route or storage changes (specs 1 and 2). Deploys (spec 4). The four Sites files, `sprint-status.yaml`. Prototype changes beyond the header's account menu.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Set-up open | no users | set-up page as before | N/A |
| Signed out | administrator exists | "Sign in to ‹installation name›", labels "Email" and "Password", button "Sign in", no Forgot password link; no prototype (D-8) | N/A |
| Sign in | right email and password | app opens; account menu shows the name and Sign out | N/A |
| Wrong | wrong password or unknown email | "That email and password do not match."; focus stays usable | N/A |
| Wait | over a limit | "Too many attempts. Wait ‹duration› before trying again." (D-8; duration worded as set-up's `waitWording`) | N/A |
| Sign out | menu → Sign out | sign-in page; old session refused | N/A |
| Two servers, one host | sign in to port A then port B in one context | both stay signed in | N/A |
| Session unknown | server unreachable | the prototype opens, as story 1.2's D-5 (D-7) | N/A |
| Reviewer link | hash review link, signed out | opens without sign-in (D-7) | N/A |
| Set-up done | just completed | "Sign in with the email and password you just chose." and a Sign in link (D-9) | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/main.jsx` -- `Start()`, `SetupLoadBoundary`, lazy `SetupPage`.
- `site-studio/src/admin/setupState.js`, `setupClient.js`, `SetupPage.jsx`, `setup.css` -- patterns for the page, its client and wording.
- `site-studio/src/App.jsx` -- `app-header` (line ~643); add the account menu only.
- `site-studio/browser-tests/playwright.config.mjs`, `serve.mjs`, `setup.spec.mjs` -- projects, servers, generated codes, `expectAccessible`, `expectNoSidewaysScroll`.

## Tasks & Acceptance

**Execution:**
- [ ] Check WebKit and a `Secure` cookie on `http://127.0.0.1`; if WebKit drops it, serve the local test servers over HTTPS with `ignoreHTTPSErrors` (D-10). Never omit `Secure`.
- [ ] `site-studio/src/admin/signInClient.js`, `SignInPage.jsx`, `signin.css` -- S-26.
- [ ] `site-studio/src/main.jsx` -- session read and routing (D-7).
- [ ] `site-studio/src/AccountMenu.jsx`, `src/App.jsx` header -- name and Sign out.
- [ ] `site-studio/src/admin/SetupPage.jsx`, `browser-tests/setup.spec.mjs` -- D-9 text and its two assertions only.
- [ ] `site-studio/browser-tests/signin.spec.mjs`, `playwright.config.mjs`, `serve.mjs` -- matrix rows, axe, second server pair.
- [ ] `site-studio/tests/signin-client.test.mjs` -- refusal mapping and wait wording.

**Acceptance Criteria:**
- Given both Playwright projects, when the suite runs, then every matrix row passes and axe reports no serious or critical violation on the sign-in page and with the account menu open.
- Given a deliberately broken sign-in page, when the suite runs, then it fails.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run test:browser` -- pass in `chromium` and `webkit-iphone`
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
