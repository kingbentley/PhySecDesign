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
  - '{project-root}/_bmad-output/planning-artifacts/ux/ux-PhySecDesign-2026-11-18/design-canvas.md'
---

> **Not ready for development.** Needs spec 2 done; follows Kevin's decisions D-7 to D-10 in SPEC.md with the uncontested review findings applied. Rows marked "held H-n" wait for Kevin's rulings.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After set-up the app opens the prototype to anyone; there is no sign-in page, no account menu, and the set-up done page says signing in has not arrived.

**Approach:** Show S-26 to anyone not signed in once an administrator exists, open the app with an account menu (name, Sign out) after sign-in, change the set-up done page (D-9), and ship Playwright and axe tests in Chromium and WebKit iPhone, on their own servers, including two local installations on one host with different ports. Covers CAP-1, CAP-4, CAP-14 and the on-screen parts of CAP-5, CAP-7, CAP-8, CAP-10 and CAP-11.

## Boundaries & Constraints

**Always:**
- App code JavaScript; sign-in rules imported from `shared/` (standing rule 6). The page loads lazily, as the set-up page does. The S-26 screen on the design canvas is the visual source (A-24).
- UX section 10: 4.5:1 contrast, 2 px focus ring, labelled 16 px fields, usable at 200% zoom; account menu trigger and Sign out at least 44 px on the iPhone viewport and 32 px on desktop; `BrandMark`; white and teal.
- Fields fillable by a password manager: a `<form>`, `autocomplete="username"` and `autocomplete="current-password"`, `type="email"` and `type="password"`.
- The one failure message comes from the server's refusal; the wait sentence is composed on the page with `waitWording` from the refusal's seconds (A-19). The page never says whether an email exists.
- Unknown set-up state: start-up does not read the session and opens the prototype as today (A-8).
- Tests use generated local secrets only, never committed. No manual-only page check.
- `signin.spec.mjs` runs on its own server pair per project (chromium 8793/8794, webkit-iphone 8795/8796), each with its own generated code and state folder, and completes set-up through the API (A-20, V-14). Of `setup.spec.mjs`, only D-9's two assertions change (V-20).

**Never:** Server, route or storage changes (specs 1 and 2). Deploys (spec 4). The four Sites files, `sprint-status.yaml`. Prototype changes beyond the header's account menu. Anything a held finding would decide.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Set-up open | no users | set-up page as before | N/A |
| Signed out | administrator exists | "Sign in to ‹installation name›", labels "Email" and "Password", button "Sign in", no Forgot password link; no prototype (D-8) | N/A |
| `/setup` after set-up, signed out | administrator exists | "Set-up is already complete"; its link to `/` shows the sign-in page (A-25) | N/A |
| Sign in | right email and password | app opens; account menu shows the name and Sign out | N/A |
| Long name | 80-character name, iPhone and 200% zoom | truncated in the header, full text in the menu, no sideways scroll (E-19) | N/A |
| Wrong | wrong password or unknown email | "That email and password do not match." | N/A |
| Wait | an email with no account and its own `CF-Connecting-IP`, over its limit | "Too many attempts. Wait ‹duration› before trying again." (D-8, V-15) | N/A |
| Sign out | menu → Sign out | sign-in page; `context.cookies()` holds no session cookie in either browser; the marker stays (E-15) | N/A |
| Marker in a real browser | sign in, sign out; lock the email from another address with a separate request context and its own `CF-Connecting-IP`; sign in again in the same context | signs in (CA-44, V-1) | N/A |
| Restore | sign in, save a named revision, restore it | account menu still shows the name (V-13) | N/A |
| Two servers, one host | set up and sign in to port A then port B in one context | both stay signed in; `context.cookies()` holds two distinct markers (A-5, V-6) | N/A |
| Session unknown | session read fails | the prototype opens, as story 1.2's D-5 (D-7); which failures count is held (H-1) | N/A |
| Reviewer link | well-formed hash review link, signed out | opens without sign-in (D-7); malformed links and hash changes held (H-9) | N/A |
| Set-up done | just completed (mocked replies in `signin.spec.mjs`, V-20) | "Sign in with the email and password you just chose." and a plain `<a href="/">Sign in</a>` replacing "Open Site Survey Design" (D-9, A-8, E-21) | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/main.jsx` -- `Start()` (line 64 renders set-up at `/setup` whatever the session), `SetupLoadBoundary`, lazy `SetupPage`, `Workspace` (lines 42–46).
- `site-studio/src/admin/setupState.js`, `setupClient.js` (`waitWording`, line 76), `SetupPage.jsx` (done page lines 64–65, already-complete line 76), `setup.css` -- patterns for the page, its client and wording.
- `site-studio/src/App.jsx` -- `app-header` (line ~643); add the account menu only.
- `site-studio/browser-tests/playwright.config.mjs` (`baseURL` line 48, readiness URL line 53), `serve.mjs`, `setup.spec.mjs` -- projects, servers, generated codes, `expectAccessible`, `expectNoSidewaysScroll`, mocked replies (line 302).

## Tasks & Acceptance

**Execution:**
- [ ] Check the real `__Host-` session cookie in both projects on `http://127.0.0.1`, and in Chrome under `npm run dev` on `http://localhost`; record the results here. If WebKit drops it: `wrangler dev --local-protocol https` in `serve.mjs`, `ignoreHTTPSErrors` in both projects and in `webServer`, `https` base and readiness URLs for every server including the extra pairs (D-10, A-16, E-20). Never omit `Secure`.
- [ ] `site-studio/src/admin/signInClient.js`, `SignInPage.jsx`, `signin.css` -- S-26.
- [ ] `site-studio/src/main.jsx` -- session read and routing (D-7, A-8).
- [ ] `site-studio/src/AccountMenu.jsx`, `src/App.jsx` header -- name and Sign out.
- [ ] `site-studio/src/admin/SetupPage.jsx`, `browser-tests/setup.spec.mjs` -- D-9 text, the plain Sign in link, and the two assertions only.
- [ ] `site-studio/browser-tests/playwright.config.mjs`, `serve.mjs` -- the extra server pair per project.
- [ ] `site-studio/browser-tests/signin.spec.mjs` -- matrix rows and axe on the page and the open menu.
- [ ] `site-studio/tests/signin-client.test.mjs` -- refusal mapping and wait wording.
- [ ] Deliberate breakages, each run once and reverted: drop the `autocomplete` attributes; show "No account with that email"; leave the account menu out of the header. Record each failing test's name here (V-22).

**Acceptance Criteria:**
- Given both Playwright projects, when the suite runs, then every matrix row passes and axe reports no serious or critical violation on the sign-in page and with the account menu open.
- Given each deliberate breakage, when the suite runs, then it fails, and the failing tests are recorded in this file.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run test:browser` -- pass in `chromium` and `webkit-iphone`
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
