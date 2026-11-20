---
title: 'Story 1.3, spec 3: Sign-in page, account menu and browser tests'
type: 'feature'
created: '2026-11-20'
status: 'ready-for-dev'
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

> Needs spec 2 done. Follows Kevin's decisions in SPEC.md (D-7 as amended, D-8 to D-10, D-12 to D-14, D-16) and the applied review findings.

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
- Set-up state read: a 404 or a reply that is not the declared JSON (no server, the Sites package) opens the prototype; a network failure, no answer within 5 s, a 5xx or `updating` shows story 1.2's "Set-up cannot be checked" page with Try again at every address, and the session is not read (D-7 amended again).
- Session read: a 404 or a reply that is not the declared JSON (no server) opens the prototype; a network failure, no answer within 5 s, a 5xx or `updating` shows "Sign-in cannot be checked" with Try again (D-7 amended).
- Only a well-formed reviewer link skips sign-in, also when it arrives by a hash change on the sign-in page (D-14). The page re-reads the session when it becomes visible (D-16). Sign-out shows the sign-in page only after the server confirms it (E-6).
- Tests use generated local secrets only, never committed. No manual-only page check.
- `signin.spec.mjs` runs on its own server pair per project (chromium 8793/8794, webkit-iphone 8795/8796), each with its own generated code and state folder, and completes set-up through the API (A-20, V-14). Of `setup.spec.mjs`, only D-9's two assertions and the test "when the state cannot be read, the prototype opens and the set-up address offers to try again" (lines 265–276, D-7 amended again) change (V-20).

**Never:** Server, route or storage changes (specs 1 and 2). Deploys (spec 4). The four Sites files, `sprint-status.yaml`. Prototype changes beyond the header's account menu.

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
| Sign out fails | sign-out reply mocked as 500 | page stays signed in and says "You are still signed in. Try again." (E-6) | N/A |
| Ended session in the browser | a session ended through the API, cookie still held | the sign-in page shows, not the prototype; the cookie is cleared (D-7 amended, A-2) | N/A |
| Tab becomes visible | signed in; sign out through the API while the page is hidden; make it visible | sign-in page shows (D-16, E-16) | N/A |
| Marker in a real browser | sign in, sign out; lock the email from another address with a separate request context and its own `CF-Connecting-IP`; sign in again in the same context | signs in (CA-44, V-1) | N/A |
| Restore | sign in, save a named revision, restore it | account menu still shows the name (V-13) | N/A |
| Two servers, one host (test named "keeps separate sessions and markers on one host; not isolated") | set up and sign in to port A then port B in one context | both stay signed in; `context.cookies()` holds two distinct markers (A-5, V-6, D-12) | N/A |
| No server | session read mocked as 404 | the prototype opens (D-7 amended) | N/A |
| No server, set-up state | set-up state mocked as 404 | the prototype opens (D-7 amended again) | N/A |
| Set-up state fails | set-up state mocked as 500, 503 `updating`, aborted, or unanswered for 5 s, at `/` and at `/setup` | "Set-up cannot be checked" with Try again, no prototype; Try again shows the set-up page once the read succeeds; axe clean (D-7 amended again; replaces story 1.2's test at `setup.spec.mjs` 265–276) | N/A |
| Session read fails | session read mocked as 500, 503 `updating`, aborted, or unanswered for 5 s | "Sign-in cannot be checked" with Try again; Try again reads again and shows the sign-in page once the read succeeds; axe clean (D-7 amended, A-3, E-5) | N/A |
| Reviewer link | well-formed hash review link, signed out | opens without sign-in (D-7, D-14) | N/A |
| Malformed reviewer link | `#review=x`, signed out | sign-in page (D-14, A-23) | N/A |
| Review link by hash change | on the sign-in page, the hash changes to a well-formed review link | the review page opens without a reload (D-14, E-21) | N/A |
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
- [ ] `site-studio/src/admin/setupState.js` -- tell "no server" (404, or not the declared JSON) apart from "cannot be checked" (network failure, timeout, 5xx, `updating`) (D-7 amended again).
- [ ] `site-studio/src/main.jsx` -- set-up state and session read routing (D-7 amended and amended again, D-14), with story 1.2's "Set-up cannot be checked" page at every address, the "Sign-in cannot be checked" page, `hashchange` on the sign-in page, `visibilitychange` re-read (D-16).
- [ ] `site-studio/src/AccountMenu.jsx`, `src/App.jsx` header -- name and Sign out.
- [ ] `site-studio/src/admin/SetupPage.jsx`, `browser-tests/setup.spec.mjs` -- D-9 text, the plain Sign in link, the two D-9 assertions, and the test at lines 265–276 rewritten to the "Set-up state fails" row (a 500 at `/` shows "Set-up cannot be checked", not the prototype); nothing else in `setup.spec.mjs` changes.
- [ ] `site-studio/browser-tests/playwright.config.mjs`, `serve.mjs` -- the extra server pair per project.
- [ ] `site-studio/browser-tests/signin.spec.mjs` -- matrix rows and axe on the page and the open menu.
- [ ] `site-studio/tests/signin-client.test.mjs` -- refusal mapping and wait wording.
- [ ] Deliberate breakages, each run once and reverted: drop the `autocomplete` attributes; show "No account with that email"; leave the account menu out of the header. Record each failing test's name here (V-22).

**Acceptance Criteria:**
- Given both Playwright projects, when the suite runs, then every matrix row passes and axe reports no serious or critical violation on the sign-in page, on the "Sign-in cannot be checked" page and with the account menu open.
- Given each deliberate breakage, when the suite runs, then it fails, and the failing tests are recorded in this file.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run test:browser` -- pass in `chromium` and `webkit-iphone`
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
