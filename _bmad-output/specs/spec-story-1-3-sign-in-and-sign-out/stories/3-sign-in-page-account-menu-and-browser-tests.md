---
title: 'Story 1.3, spec 3: Sign-in page, account menu and browser tests'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '8e5b361e69755dd68c35f2eb4bb8ce096bb7f655'
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
- [x] Check the real `__Host-` session cookie in both projects on `http://127.0.0.1`, and in Chrome under `npm run dev` on `http://localhost`; record the results here. If WebKit drops it: `wrangler dev --local-protocol https` in `serve.mjs`, `ignoreHTTPSErrors` in both projects and in `webServer`, `https` base and readiness URLs for every server including the extra pairs (D-10, A-16, E-20). Never omit `Secure`.
  - **Result (2026-11-20, Playwright 1.63.0, built Worker under `wrangler dev` on `http://127.0.0.1`):** desktop Chromium kept both cookies (`Secure`, `HttpOnly`) and sent them back: the session read answered `signedIn: true`. WebKit (iPhone 15 profile) stored both cookies but did not send them back: the session read answered `signedIn: false`. So WebKit drops it in effect, and the HTTPS change was made: `--local-protocol https` in `serve.mjs`, `ignoreHTTPSErrors` in both projects and every `webServer`, `https` base and readiness URLs for all six servers. Over `https://127.0.0.1` both browsers keep and send the cookies. `Secure` is never omitted.
  - **`http://localhost`:** checked with Playwright's Chromium, not Kevin's own Chrome, against the built Worker under `wrangler dev --ip localhost` over plain HTTP (the same server code `npm run dev` runs, with a throwaway state folder so the workstation's own dev state was not touched): both cookies kept and sent, session read `signedIn: true`. Kevin's own Chrome under `npm run dev` is still to be checked by him.
- [x] `site-studio/src/admin/signInClient.js`, `SignInPage.jsx`, `signin.css` -- S-26.
- [x] `site-studio/src/admin/setupState.js` -- tell "no server" (404, or not the declared JSON) apart from "cannot be checked" (network failure, timeout, 5xx, `updating`) (D-7 amended again).
- [x] `site-studio/src/main.jsx` -- set-up state and session read routing (D-7 amended and amended again, D-14), with story 1.2's "Set-up cannot be checked" page at every address, the "Sign-in cannot be checked" page, `hashchange` on the sign-in page, `visibilitychange` re-read (D-16).
- [x] `site-studio/src/AccountMenu.jsx`, `src/App.jsx` header -- name and Sign out.
- [x] `site-studio/src/admin/SetupPage.jsx`, `browser-tests/setup.spec.mjs` -- D-9 text, the plain Sign in link, the two D-9 assertions, and the test at lines 265–276 rewritten to the "Set-up state fails" row (a 500 at `/` shows "Set-up cannot be checked", not the prototype); nothing else in `setup.spec.mjs` changes.
- [x] `site-studio/browser-tests/playwright.config.mjs`, `serve.mjs` -- the extra server pair per project.
- [x] `site-studio/browser-tests/signin.spec.mjs` -- matrix rows and axe on the page and the open menu.
- [x] `site-studio/tests/signin-client.test.mjs` -- refusal mapping and wait wording.
- [x] Deliberate breakages, each run once and reverted: drop the `autocomplete` attributes; show "No account with that email"; leave the account menu out of the header. Record each failing test's name here (V-22).
  - **Results (2026-11-20, full `playwright test` run on a fresh build for each, then reverted and rebuilt):**
    - `autocomplete` attributes removed from `SignInPage.jsx`: failed in both projects, "signed out, the sign-in page names the installation and asks only for email and password, with no prototype" (`toHaveAttribute`). 2 failed, 36 passed, 32 not run (the serial file stops at its first failure).
    - "No account with that email." shown in place of the failure message: failed in both projects, "a wrong password and an unknown email get the same one message, which repeats nothing typed" (`toHaveText`). 2 failed, 40 passed, 28 not run.
    - Account menu left out of the `App.jsx` header: failed in both projects, "signing in opens the app with an account menu holding the name and Sign out" (`account-name` not found). 2 failed, 44 passed, 24 not run.

**Implementation notes (2026-11-20).**
- `SetupPage.jsx` gained one optional prop besides D-9, `onStateRead`: Try again on "Set-up cannot be checked" hands its new reading to `main.jsx`, which routes it from whichever address the page was shown at (open: the set-up form at `/setup`; closed: the session read, or "already complete" at `/setup`; no server: the prototype). Without it the page could not leave `/` correctly.
- `waitWording` moved unchanged from `setupClient.js` to `src/admin/waitWording.js` (still re-exported by `setupClient.js`), so `signInClient.js` and `tests/signin-client.test.mjs` load it under `node --test` without the set-up rules (shared/routes.ts and shared/setup.ts use extensionless imports Node cannot resolve). For the same reason `signInClient.js` loads the app header from `shared/routes.ts` only when it sends a request, and the session read's shape check is written in `setupState.js` without imports, keeping zod out of the prototype's bundle.
- The account menu's styles are in `src/account-menu.css`. On a phone (at most 500 px) it tightens the header's gap to 6 px and shortens the name, so the 44 px trigger fits inside the iPhone 15 viewport; nothing else in the header changes.
- In `setup.spec.mjs` the title of the test with D-9's second assertion now says "the app shows the sign-in page" instead of "the app is the prototype", to match the changed assertion.
- `signin.spec.mjs` sets its own 90 s test timeout: on this workstation the first test, which meets six freshly started servers, took over 30 s.
- Axe in `signin.spec.mjs` runs on the whole sign-in and "Sign-in cannot be checked" pages, and on `.account-menu` only with the menu open, because the prototype's existing workspace is outside this story.
- After review: `scripts/run-unit-tests.mjs` passes `--experimental-strip-types`, because `tests/signin-client.test.mjs` is the first unit test that imports a `.ts` file and the engines floor (Node 22.13) does not strip types by default. This file is outside the task list.

## Review Triage Log

Review of 2026-11-20 (loop iteration 0): Blind Hunter (BH), Edge Case Hunter (EC), Verification Gap (VG). Diff since `8e5b361`.

| # | Source | Finding | Verdict | Evidence | Route |
|---|--------|---------|---------|----------|-------|
| 1 | BH, EC, VG other | `readJson` treats a non-404 4xx refusal (401, 403 `https_required`/`origin_refused`, 429) on the set-up state or session read as "no server" and opens the prototype | false | The two GET reads can refuse only with 404 (`not_found`) or 5xx: `origin_refused` applies only to `appOriginOnly` routes (`server/api/router.ts:23`), and a page over plain HTTP gets a 308 to HTTPS (`server/httpsRedirect.ts`), so its same-origin reads never meet `https_required`. A proxy's own 4xx page is not the declared JSON, which the frozen text counts as no server. | reject |
| 2 | BH, EC (twice, one a claim) | A connection dropped while the body is read (a `TypeError`, signal not aborted) counts as "no server" | medium | `readJson`'s catch checked only `signal.aborted`, contrary to its comment and D-7 amended (a network failure cannot be checked). | patch: fixed; a read failure not named `SyntaxError` is now "cannot be checked", unit case added. The first fix tested `instanceof SyntaxError` and failed the WebKit "no server" test, because WebKit throws a `DOMException` named `SyntaxError`; it now tests the error's name |
| 3 | BH | Exact-key checks on the state, session and sign-in replies fail open if a later release adds a field | low | The frozen text makes "a reply that is not the declared JSON" no server, and spec 2 makes each reply equal its declared shape (V-10); a story that widens a reply changes the page with it. A stale tab during an update is unlikely and recovers on reload. | reject |
| 4 | BH, EC | Another account is detected only by a changed display name (visibility re-read, `App` key) | medium | Real: the session reply has no account identifier; unreachable while story 1.3 has one account. Fixing it needs a route change, which this spec's Never excludes. | defer (`deferred-work.md`) |
| 5 | BH | Sign-out leaves the browser's local project for the next person | false | D-7 and the story's Non-goals keep the local project for whoever signs in next until Epic 2 (story 1.7's CA-49 clears it later). | reject |
| 6 | BH | The cookie task is ticked while Kevin's own Chrome under `npm run dev` was not checked (Playwright Chromium on `http://localhost` was used) | low | True, and stated in the task's result note above. The fix would edit this build's spec; the open check is reported to the orchestrator for Kevin. | reject (reported) |
| 7 | BH, VG | Try again on "Set-up cannot be checked" is tested only for an "open" reading; the "closed" route (sign-in page at `/`, already complete at `/setup`) is unguarded | medium | Only `setup.spec.mjs`'s test clicks Try again, before set-up completes. | patch: test added to `signin.spec.mjs` |
| 8 | BH, VG | D-16's "signed in from another tab while on the sign-in page opens the app" branch is untested (the different-account reload too) | medium | Only the signed-in → signed-out case was tested. | patch: test added; the different-account test goes with row 4 |
| 9 | VG | The sign-in page's own field checks (messages, `aria-invalid`, focus, nothing sent) are untested | medium | No test submitted empty or malformed fields. | patch: test added |
| 10 | VG other | `tests/signin-client.test.mjs` imports `shared/refusal.ts`, which plain `node --test` loads only from Node 22.18; engines floor is 22.13 | medium | No other unit test imports `.ts`; the runner passed no flag. | patch: `--experimental-strip-types` in `scripts/run-unit-tests.mjs` |
| 11 | BH | Serial mode stops the file at its first failure, hiding later failures | low | True, but deliberate: each server holds one installation and the marker test must lock the email last. Restructuring is more than a direct fix. | reject |
| 12 | BH | On a phone the trigger shows only a few letters of an ordinary name | low | True at 500 px or less; E-19 asks for truncation in the header with the full name in the menu and the `title`. Widening needs header layout changes, which the spec's Never excludes. | reject |
| 13 | BH | The account menu does not close when focus leaves it | low | A disclosure panel need not close on focus loss; Escape and outside clicks close it. A `focusout` guard adds a branch for a rare case. | reject |
| 14 | BH, EC (twice) | Overlapping session reads (visibility, Try again, StrictMode's double effect) can apply out of order | low | Needs a read to start before and finish after a sign-out within one request's time; StrictMode's two reads give the same answer. A sequence guard adds state. | reject |
| 15 | EC | Closing the menu while a sign-out is pending and failing, then reopening, clears the error unseen | low | Real: the trigger cleared the error. Fix is a deletion. | patch: fixed |
| 16 | BH | The wait assertion accepts only "1 minute" or "59 seconds" and may flake on a slow run | low | The sixth request could reach the server more than 2 s after the fifth failure. | patch: accepts 50–59 seconds |
| 17 | BH | The D-9 link test compares the exact `outerHTML` | false | The frozen matrix asks for exactly a plain `<a href="/">Sign in</a>`. | reject |

**Acceptance Criteria:**
- Given both Playwright projects, when the suite runs, then every matrix row passes and axe reports no serious or critical violation on the sign-in page, on the "Sign-in cannot be checked" page and with the account menu open.
- Given each deliberate breakage, when the suite runs, then it fails, and the failing tests are recorded in this file.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run test:browser` -- pass in `chromium` and `webkit-iphone`
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

**Recorded after review fixes (2026-11-20, Windows workstation, Node 24.18.0):** `npm test` 160 passed; `npm run typecheck` clean; `npm run test:server` 23 files, 260 tests passed (no server file changed afterwards); `npm run test:browser` 76 passed, 38 in `chromium` and 38 in `webkit-iphone`; `npm run build`, `npm run test:sites` (4 passed) and `npm run smoke:selfhost` passed. The deliberate breakages above were run before the review fixes.
