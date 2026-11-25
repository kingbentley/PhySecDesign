---
title: 'Story 1.5, spec 8: The second-step page'
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: '640d17d83dd885d7a148c39f624fee5f925250ed'
route: 'dispatch'
review_loop_iteration: 0
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/wording.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/stories/7-my-account-set-up-and-offer.md'
---

> Builds to D-3, D-13, D-20 (as amended by finding 20) and D-21 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs specs 1 to 5, and spec 7's `browser-tests/two-step-helpers.mjs` and per-run key. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The sign-in reply can say a second step is needed, but the sign-in page cannot ask for a code or a recovery code.

**Approach:** When the sign-in reply is `{ secondStep: true }`, the sign-in page shows the second step in place: a code field built for phones, "Use a recovery code", "Back to sign in", and the refusals of D-13, returning to the password form when the pending sign-in has ended. Covers the page side of CAP-3, CAP-4 and CAP-13, CAP-2's recovery-code sign-in, and CAP-14 for this screen.

## Boundaries & Constraints

**Always:**
- `src/admin/signInClient.js`: `signInOutcome` gains `{ kind: 'secondStep' }` for a success body that is exactly `{ secondStep: true }`; a new `submitSecondStep({ method, code })` maps `second_step_code_wrong`, `second_step_recovery_code_wrong`, `second_step_expired`, `signin_wait`, `deployment_key_mismatch` and the existing codes; existing kinds unchanged. `tests/signin-client.test.mjs` gains the cases.
- `src/admin/SignInPage.jsx`: on `secondStep` the password is cleared from state and the second step shows with `wording.md`'s text; the form is `noValidate` (finding 27); the code field: `type="text"`, `inputmode="numeric"`, `autocomplete="one-time-code"`, `pattern="[0-9]*"`, `maxlength="12"`, labelled, 16 px; the recovery field: `autocomplete="off"`, `autocapitalize="none"`, `spellcheck="false"`. Each mode's field is checked with `shared/twoStep.ts`'s normaliser before sending (standing rule 6).
- `second_step_expired` and `signin_wait` return to the password form with the message (the wait composed as story 1.3 does); "Back to sign in" returns without a request (D-3). A correct step calls `onSignedIn` as a sign-in does, so the session is read and the app opens.
- `deployment_key_mismatch` on a code: the page shows that message followed by "You can still sign in with a recovery code.", switches to recovery mode and moves focus to its field (finding 26).
- Focus moves to the second step's heading when it appears and to the alert on a refusal; the mode switch keeps focus on the new field.
- Known limit (finding 33): a browser holds one pending sign-in; after another tab's password step, this page's second step applies to that newer sign-in, which may be another account's, and a code for the first account is refused as wrong.
- Browser tests in `browser-tests/second-step.spec.mjs` on `signInServers(project)[0]`, importing `browser-tests/two-step-helpers.mjs` (never another spec file; finding 15), with accounts turned on through the API by a helper, each with its own email; a test that needs a second code in the same account waits for the next 30-second step (keep such waits to the few tests that need them).
- Criterion 27's real-phone part is deferred to story 10.6 under standing rule 15 (D-20 as amended); spec 9 offers Kevin an optional phone check.
- Deliberate breakages, each failing the suite, names recorded here when built: the code field without `one-time-code`; a reused recovery code accepted; the page staying on the second step after `second_step_expired`.

**Ask First:** a change to the first step's behaviour or wording (story 1.3).

**Never:** server, route or store changes; My account (spec 7); a manual-only check; `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Password, two-step on | right password | second step shown; no account menu; password field cleared | N/A |
| Code | current computed code with a space | app opens with the account menu | N/A |
| Wrong code | "000000" (not current) | stays; field kept for correction | `second_step_code_wrong` in the alert |
| Recovery code | "Use a recovery code", a saved code in upper case | app opens | N/A |
| Recovery code reused | the same code in a later sign-in | stays | `second_step_recovery_code_wrong` |
| Bad shape | "12345" or a 15-character recovery code | no request | field message |
| Expired | pending cookie removed in the test (other-browser case) | password form with the message | `second_step_expired` |
| Wrong codes to the wait | 4 wrong codes | after the third `second_step_code_wrong`, the fourth returns to the password form with the wait (finding 3) | `signin_wait` |
| Key mismatch | code reply mocked `deployment_key_mismatch` | the message and the recovery line; recovery mode, focus on its field (finding 26) | N/A |
| Back to sign in | button | password form, no request | N/A |
| Reload | reload on the second step | sign-in page (D-3) | N/A |
| Phone attributes | WebKit iPhone | `inputmode`, `autocomplete`, `pattern`, `maxlength` as stated; 16 px | N/A |
| Two-step off | an account without it | signs in as before, no second step | N/A |
| axe | code mode, recovery mode, a refusal shown | no serious or critical violation | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/admin/SignInPage.jsx`, `signInClient.js`, `postJson.js`, `waitWording.js`, `signin.css` -- the page and its client.
- `site-studio/shared/twoStep.ts` -- normalisers (spec 1).
- `site-studio/tests/signin-client.test.mjs` -- client cases (it may import only `shared/refusal.ts`; the normaliser's use on the page is tested in `server-tests/`).
- `site-studio/browser-tests/two-step-helpers.mjs` (spec 7), `signin.spec.mjs` -- helpers.

## Build notes (build session, 2026-11-23)

- **Read first:** `E:\dev\PhySecDesign\AGENTS.md` and `site-studio/AGENTS.md` (white and teal direction, `BrandMark`). Then spec 7's file (in `context:`), above all its "Follow-up after the orchestrator's check" note, which explains the focus race this spec must not repeat. The frozen block above is the contract; if something in it cannot be built as written or contradicts the code, stop and report instead of deciding.
- **Orchestrator ruling, 2026-11-23 (Claude, on Kevin's instruction):** every focus move on the sign-in page that follows a reply or a newly shown view, the existing first-step ones as well as the new second-step ones, is made so that focus has moved by the time the view can be used: a `useLayoutEffect` (as spec 7 did), never a passive `useEffect`. In `SignInPage.jsx` that includes the first step's refusal alert and `SignInUnknown`'s heading. Focus calls made straight in a handler stay direct calls. The browser tests check, with spec 7's `MutationObserver` approach (`watchFocusOnAppear` in `browser-tests/two-step.spec.mjs`), that the element already has focus as it appears, for: the second step's heading after the sign-in reply, the field a mode switch shows (both by the link-style buttons and by the `deployment_key_mismatch` reply), and a refusal's alert (a wrong code). This changes no wording and no first-step behaviour a person can see.
- **Files in scope:** `site-studio/src/admin/signInClient.js`, `SignInPage.jsx`, `signin.css`; `tests/signin-client.test.mjs`; new `browser-tests/second-step.spec.mjs`; `browser-tests/two-step-helpers.mjs` (only to add helpers this spec needs; keep existing exports unchanged); new `site-studio/src/admin/secondStepRules.js` and new `site-studio/server-tests/second-step-page-text.test.ts` (below). `browser-tests/signin.spec.mjs` only if an existing sign-in test must change; say which and why. Nothing else: no file under `server/`, `shared/`, `deploy/`, `scripts/`, `experiments/`, no `src/account/` file, not `browser-tests/two-step.spec.mjs`, `playwright.config.mjs` or `serve.mjs`, not `sprint-status.yaml`. Do not touch the untracked `.claude/`, `Site Studio UX screens.pdf`, `preview.html`. If you need another file, stop and say which and why.
- **Why `secondStepRules.js`:** `tests/signin-client.test.mjs` runs under Node and `signInClient.js` may import only `shared/refusal.ts` among `shared/` files (Code Map). The field check before sending (standing rule 6) uses `normaliseCode` and `normaliseRecoveryCode` from `shared/twoStep.ts`, so it goes in a small module the page imports, for example `checkSecondStepCode(method, value)` answering `{ code }` (the normalised value) or `{ error }` (the field message from `wording.md`), tested in `server-tests/second-step-page-text.test.ts` as `server-tests/invitation-page-text.test.ts` tests `invitationRules.js`. Send the normalised value (so a long pasted recovery code with spaces stays inside the server's 64-character bound).
- **Do not reuse `CodeField` from `src/account/TwoStepSetup.jsx`:** its label is "Code from the app", not this screen's "Code", and that module imports `qrcode-generator`, which would then load with the sign-in page. Write the code and recovery fields in `SignInPage.jsx` (its `Field` pattern), with exactly the frozen block's attributes: code `type="text"`, `inputMode="numeric"`, `autoComplete="one-time-code"`, `pattern="[0-9]*"`, `maxLength={CODE_FIELD_MAX_LENGTH}` (12), the hint "6 digits. Spaces are ignored." tied by `aria-describedby`; recovery `autoComplete="off"`, `autoCapitalize="none"`, `spellCheck={false}`. 16 px text (the existing `.signin-field input` rule). After `npm run build`, check that no chunk loaded by the sign-in page contains `qrcode-generator` and report the chunk names you checked.
- **The client** (`signInClient.js`): `signInOutcome` gains `{ kind: 'secondStep' }` only for a 2xx body whose only key is `secondStep` with the value `true`; every existing kind and test unchanged. Add a pure `secondStepOutcome(status, body, retryAfter)` and `submitSecondStep({ method, code }, fetcher, options)` posting to `/api/v1/session/second-step` through `postJson` with the sign-in deadline. Kinds: `signedIn` (`{ name }` exactly, as `signInOutcome`); `refused` for `second_step_code_wrong` and `second_step_recovery_code_wrong` (the message from the reply, else `REFUSALS`; the page stays on the second step and keeps the field's value); `restart` for `second_step_expired` (its message) and `signin_wait` (composed with `waitMessage` exactly as `signInOutcome` does); `keyMismatch` for `deployment_key_mismatch` (its message); `field` for `invalid_input` naming `code`; every other code and no answer as `signInOutcome` maps it (`SIGN_IN_MESSAGES`), staying on the second step. Never put a code in a message.
- **The page** (`SignInPage.jsx`): one component with a view of `password`, `code` or `recovery`. On `secondStep`: clear the password from state, keep the email, show heading "Two-step verification" (`h1`, `tabIndex={-1}`, focused in a layout effect) and every text from `wording.md` "Sign in, second step (S-26)" word for word; the lead names `installationName`. "Use a recovery code" and "Use a code from your authenticator app" are `type="button"` link-style buttons that switch mode, clear the field error and the alert, and move focus to the new mode's field. "Back to sign in" (a `type="button"`, under both modes) returns to the password form with no request, the email kept, focus on the password field. `restart`: back to the password form with the message in the alert (alert focused). `keyMismatch`: the alert holds the message then "You can still sign in with a recovery code.", the page switches to recovery mode and focus goes to the recovery field (not the alert). `signedIn`: call `onSignedIn({ name })` as the first step does. One request at a time (the existing `inFlight` guard); the button reads "Checking…" while sending, with `aria-disabled`. Link-style buttons are at least 44 px tall (standing rule 5) and styled in `signin.css` in the same direction.
- **Browser tests** (`second-step.spec.mjs`): on `signInServers(project.name)[0]`, complete set-up through the API if needed with signin.spec.mjs's administrator (same as `two-step.spec.mjs` does). Import helpers only from `two-step-helpers.mjs` (finding 15): move nothing out of `two-step.spec.mjs`; add to the helpers file the ones you need (set-up, invitation, account creation, axe, `watchFocusOnAppear` extended with a field kind, an `emailFor` that adds the project and `repeatEachIndex`), with emails no other spec uses (for example `….secondstep@harbourside.example`). Create each account and turn two-step on from a separate request context (`playwright.request.newContext`), so the test's browser holds no session or marker for that account and signs in through the page. Each test's title names its matrix row(s). Navigate once per test (the Reload row's `page.reload()` is that row). Expired: remove only the pending cookie (`__Host-ssd-p-…`) from the browser context. Key mismatch: `page.route` on the exact second-step path, fulfilling 503 with the `deployment_key_mismatch` body. Wrong codes to the wait: send wrong codes until the matrix's outcome and assert it; if the server's counts make it differ from the matrix, stop and report. Recovery reused: use the same saved code in a later sign-in (a sign-in page in a fresh context, or after signing out) and expect `second_step_recovery_code_wrong`. Two-step off: an account without it signs in straight to the app. Bad shape: assert no request was sent (`page.on('request')`). Phone attributes in `webkit-iphone` (assert in both projects is fine; the acceptance criterion names WebKit), plus computed `font-size` 16 px. axe with `@axe-core/playwright` on code mode, recovery mode and a refusal shown (no serious or critical). Never print a code, recovery code, key or password in a test title, assertion message or log (compare without printing, as `two-step.spec.mjs`'s `expectSecretEqual` does). Raise the timeout with `test.setTimeout` only for tests that wait for the next 30-second step, and keep such waits few.
- **Deliberate breakages** (make each, build, run `second-step.spec.mjs`; record the project(s) and the failing test's title under a "Deliberate breakages" heading after Tasks; revert; rebuild): 1) the code field without `autocomplete="one-time-code"`; 2) a reused recovery code accepted (simulate on the page side, for example by mocking the second reply only if no page-only change can show it; say what you did); 3) the page staying on the second step after `second_step_expired`. Record each acceptance criterion's proving test title after its arrow. Leave the frozen block untouched.
- **Commands you run**, in `site-studio/`, one at a time, never two at once: `npm test`, `npm run typecheck`, `npm run test:server`, `npm run build`, then `npx playwright test --config browser-tests/playwright.config.mjs second-step.spec.mjs` and `… signin.spec.mjs` (each starts six servers; build first). The build session runs the full suites afterwards. Chromium has failed one script request with `net::ERR_NO_BUFFER_SPACE` ("The sign-in page could not be loaded"): a machine limit; rerun once and report it. Before each rerun, copy any failure's trace out of `test-results/`. `git` is slow: `git --no-pager`, long timeouts. No lint script; add none. Edit by hand; no bulk search-and-replace, no `sed`. Do not commit.
- **Secrets:** never write a password, code, recovery code, authenticator secret, deployment key, cookie value or token into any file, log or report. Tests generate theirs at run time and do not print them.
- **Report** every choice you made that this spec does not settle, every file touched, each command's counts, and anything that failed once.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/src/admin/signInClient.js`, `SignInPage.jsx`, `signin.css` -- the second step.
- [x] `site-studio/tests/signin-client.test.mjs` -- new kinds and refusals.
- [x] `site-studio/browser-tests/second-step.spec.mjs` -- matrix rows.
- [x] `site-studio/src/admin/secondStepRules.js`, `server-tests/second-step-page-text.test.ts` -- the field check before sending (build notes).
- [x] `site-studio/browser-tests/two-step-helpers.mjs` -- helpers added (existing exports unchanged).

## Deliberate breakages

Built 2026-11-23. Each was made, built and run with `second-step.spec.mjs` in the chromium project (serial, so the run stops at the first failure), then reverted. Every one failed the suite:

1. The code field without `autocomplete="one-time-code"` failed "Password, two-step on, Code, Phone attributes, axe (code mode): the right password shows the second step with no session, and a current code typed with a space opens the app" at its `autocomplete` assertion. It failed in chromium, and again in webkit-iphone (the project criterion 27 names) when made a second time after the review.
2. A reused recovery code accepted. A page-only change: the page treated a refused recovery code as signed in (it called `onSignedIn`). No reply was mocked. This failed "Recovery code, Recovery code reused, axe (recovery mode): a saved code in upper case signs in, and the same code is refused at a later sign-in": the refusal's alert was not shown.
3. The page staying on the second step after `second_step_expired` failed "Expired: with the pending cookie removed, a code returns to the password form with the expired message" at the sign-in heading. A first, wider version also kept the page on the second step after `signin_wait`; it failed "Wrong code, Wrong codes to the wait, …" first. It was narrowed to the expired reply alone and run again.

After the reverts and a rebuild, `second-step.spec.mjs` passed 16 of 16 in both projects.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given "Use a recovery code" and a saved code, the person is signed in, and the same code is refused at a later sign-in (criterion 6). → Test: "Recovery code, Recovery code reused, axe (recovery mode): a saved code in upper case signs in, and the same code is refused at a later sign-in"
- Given WebKit with an iPhone profile, the code field has `inputmode="numeric"`, `autocomplete="one-time-code"` and `pattern="[0-9]*"` (criterion 27, its automated part; the real-phone part deferred to story 10.6, D-20). → Test: "Password, two-step on, Code, Phone attributes, axe (code mode): the right password shows the second step with no session, and a current code typed with a space opens the app" (webkit-iphone; asserted in chromium too)
- Given axe in code mode, recovery mode and with a refusal shown, no serious or critical violation (standing rule 15). → Tests:
  - Code mode: "Password, two-step on, Code, Phone attributes, axe (code mode): the right password shows the second step with no session, and a current code typed with a space opens the app"
  - Recovery mode: "Recovery code, Recovery code reused, axe (recovery mode): a saved code in upper case signs in, and the same code is refused at a later sign-in"
  - A refusal shown: "Wrong code, Wrong codes to the wait, axe (a refusal shown): a wrong code stays with the field kept, a mode switch clears the alert, and the fourth wrong code returns to the password form with the wait"
  - Also checked with the mismatch message shown in recovery mode: "Invalid code from the server, Key mismatch (replies mocked): invalid_input naming code marks the field; the mismatch message and the recovery line show, the page switches to recovery mode with focus on its field, and the sent code is cleared"

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
- `npm run test:browser` -- pass (about 10 minutes; run from a short checkout path)

**Results** (implementation session, 2026-11-23, each run alone in `site-studio/`): `npm test` 231 of 231; `npm run typecheck` clean; `npm run test:server` 509 of 509 in 36 files; `npm run build` passed; `second-step.spec.mjs` 16 of 16 in both projects, first run and again after the breakages; `signin.spec.mjs` 42 of 42, unchanged. `qrcode-generator` is only in `TwoStepSetup-*.js`. The chunks the sign-in page loads are `SignInPage`, `index`, `setup`, `twoStep`, `signInClient`, `postJson`, `waitWording` and `routes`; none contains it. `test:sites`, `smoke:selfhost` and the full `test:browser` were left to the build session.

**After the review's fixes** (2026-11-23):
- The page:
  - "Back to sign in" ends the abandoned request's hold on the page. A stale request's `finally` no longer resets the sending state.
  - The mode switch does nothing while a request is in flight.
  - The code lead's fallback now uses `||`.
  - The sent code is cleared after a key mismatch.
- The tests:
  - New test "In flight, Back to sign in while sending: …".
  - An `invalid_input` row added to the mismatch test, now "Invalid code from the server, Key mismatch (replies mocked): …".
  - The alert's focus is checked on wrong codes 2 and 3, and a mode switch clears the alert ("Wrong code, …").
  - The expired alert's focus is checked as it appears ("Expired: …").
- Results:
  - `second-step.spec.mjs`: 18 of 18 in both projects.
  - The first run had 2 failures, one in each project, both in the new in-flight test, which had sent two requests. The test caused it, not the page: Playwright's `click()` waits for an `aria-disabled` button to become usable, which here lasted until the page's 30-second deadline, and then it clicked. The test now clicks with `force`.
  - Breakage 1 was then rerun in webkit-iphone as recorded above, reverted, and the app rebuilt.

**After the build session's first full run** (2026-11-23): `npm run test:browser` gave 162 passed, 2 failed, 8 not run. The failure was `two-step.spec.mjs`'s "Turn off: …" in both projects: the turn-off with the right password answered 429 ("Too many attempts. Wait 1 minute before trying again."; trace and page snapshot kept outside the repository). It passed alone and with only `second-step.spec.mjs` before it. Cause: when a request has no `CF-Connecting-IP`, the local runtime (Miniflare) sets it to the client's address, 127.0.0.1 (`node_modules/miniflare/dist/src/workers/core/entry.worker.js`, line 5263). So every browser test without its own header shares one known address with its 20-failure limit over 15 minutes, not the unknown address `signin.spec.mjs`'s header comment describes. The second steps this spec's tests leave unfinished added about ten failures there, which pushed the later test over. Fix in this spec's file only: each test's page sends its own private address (`addressFor`: the test's line and repeat index). The other files' reliance on the shared address is recorded in `deferred-work.md`.

**Results** (build session, 2026-11-23, after the last change, each run alone in `site-studio/`):
- `npm run typecheck` clean; `npm test` 231 of 231; `npm run test:server` 509 of 509 in 36 files; `npm run build` passed; `npm run test:sites` 4 of 4; `npm run smoke:selfhost` passed.
- `npm run test:browser`: 172 of 172 (15.2 minutes).
- `second-step.spec.mjs` alone, five times in a row: 18 of 18 each (9 tests in each project).
- `--repeat-each 15` for the six tests with a mocked reply or a focus check ("Password, two-step on, …", "Wrong code, …", "Recovery code, …", "Expired: …", "Invalid code from the server, Key mismatch …", "In flight, …"): 90 of 90 in chromium, 90 of 90 in webkit-iphone.
- After the build, `qrcode-generator` (found by its `getModuleCount`) is only in `TwoStepSetup-*.js`. `SignInPage-*.js` imports `index`, `setup`, `signInClient` and `twoStep`; none contains it.
- Existing tests changed: none (`signin.spec.mjs`, `two-step.spec.mjs` and `invitation.spec.mjs` are unchanged). `two-step-helpers.mjs` gained helpers; its existing exports are unchanged.
- Not run here: a screen reader, a real phone (deferred to story 10.6, D-20), Cloudflare (spec 9).

**Orchestrator rulings, 2026-11-23 (Claude, accepted on Kevin's instruction)**, after the orchestrator's check of `1c3f3d4`:
1. The code lead's fallback "Site Survey Design" when no installation name is read is accepted as written: it is the product's name, matches the first step's own fallback behaviour, and set-up requires a name, so it should never show. It is added to `wording.md` under "Sign in, second step (S-26)" as a note.
2. The shared test address (every browser request without its own `CF-Connecting-IP` counted as 127.0.0.1) is owned by story 1.5, the follow-up before its pull request, with the deliberate-breakage audit; not story 10.1, because this story's tests exposed it and the next test file added would trip it again. The `deferred-work.md` entry says the owner is confirmed.
3. The mode-switch focus check's limit (after a click it cannot tell a layout effect from a passive one) is accepted with no action: the reply-driven checks prove the shared effect.
Also accepted with no action: the other choices listed below, the two files outside the given list, and the nine rejected triage rows as reasoned.

**The TLS lines in the browser runs** (follow-up to the orchestrator's check, 2026-11-23): the servers print "TLS handshake failed: received fatal alert: CertificateUnknown" for Chromium and "… UnknownCA" for WebKit, once for each new browser connection. Each browser rejects Wrangler's self-signed local certificate and sends that alert, and Playwright's `ignoreHTTPSErrors` then lets the page go ahead. A throwaway probe logged none for 20 requests through Playwright request contexts, and 8 (Chromium) and 11 (WebKit) for one page load. They predate this spec: `signin.spec.mjs` alone logged 614 at `640d17d` and 599 at `1c3f3d4`. No code in this spec causes them beyond opening pages, and the fix belongs to the test servers' set-up (`playwright.config.mjs`, `serve.mjs`), outside this spec's files, so it is recorded in `deferred-work.md`. No code changed.

**Choices this spec did not settle** (implementation and build sessions):
- The code lead falls back to "Site Survey Design" when the session read gives no installation name. This is text `wording.md` does not have; an installation name is required at set-up, so it is not expected to show (raised with the orchestrator).
- A late `signedIn` reply after "Back to sign in" still opens the app (the server has signed the person in); any other late reply is ignored, and "Back to sign in" frees the password form at once. The mode switch does nothing while a request is in flight.
- The code and recovery fields keep separate values; a mode switch keeps them and clears the field error and the alert. After a key mismatch the sent code is cleared.
- The key-mismatch alert holds the message and "You can still sign in with a recovery code." as one text joined by a space.
- "Back to sign in" is a link-style button like the mode switches; the email is kept and focus goes to the password field.
- `spellCheck={false}` only on the recovery field, as the frozen block lists.
- The wrong code is `wrongCode(secret)` (a code of no step near now), not the matrix's "000000", which can be a current code.
- One test waits for the next 30-second step (code mode, 150-second timeout).
- `SIGN_IN_ADMIN` and the set-up helper in `two-step-helpers.mjs` repeat `signin.spec.mjs`'s and `two-step.spec.mjs`'s copies, which this spec did not change (finding 15; Review Triage Log row 20).
- The in-flight test's second click uses `click({ force: true })` (Playwright otherwise waits for an `aria-disabled` button), and it waits a fixed 500 ms after releasing the held reply before checking that nothing changed.
- Each test sends its own `CF-Connecting-IP` (above).

## Review Triage Log

Review round 1 (2026-11-23), on the diff since `640d17d`: Blind Hunter (BH), Edge Case Hunter (ECH) and Verification Gap (VG), each a fresh subagent on Opus (`opus`) at high effort. One row per finding.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | BH 2, ECH 1, VG other 1 | "Back to sign in" during a second-step request leaves `inFlight` and `sending` set, so the password form reads "Signing in…" and ignores submits until the abandoned reply arrives | medium | Confirmed: `backToSignIn` raised only the run counter; `submit` returns while `inFlight.current` is true, for up to the 30-second deadline | patch (Back clears both; a stale request's `finally` no longer resets them) |
| 2 | BH 1, ECH 2 | A mode switch during a request lets the late reply land under the other mode (a code refusal under the recovery lead, a field error on an unmounted field) | low | Confirmed: `switchMode` did not check `inFlight` or raise the run counter; the fix is one guard line | patch (the mode switch does nothing while a request is in flight) |
| 3 | BH 2 (second part) | A sign-in that succeeds after "Back to sign in" still opens the app, and this is not recorded as a choice | false | The server has already signed the person in and set the session cookie; ignoring it would show a sign-in page over a live session, which the next read would undo. Recorded as an implementation choice below | reject |
| 4 | ECH 3 | A code answered `deployment_key_missing` shows "Sign-in could not be completed" and never offers recovery codes | false | Unreachable: a `two_step` row exists only after an encryption, which stores the fingerprint; with a fingerprint stored, a missing key is status `missing`, refused `deployment_key_mismatch` (`server/installation/twoStepStore.ts` line 190; `keyGuard.ts` line 139 answers `deployment_key_missing` only when nothing is stored) | reject |
| 5 | BH 3 | The recovery line and the switch to recovery mode are applied even if a recovery code got `deployment_key_mismatch` | false | Unreachable: a recovery code is checked by its SHA-256 alone, with no decryption, so the second step never answers a recovery code with a key refusal (`signInStore.ts` `secondStep`, D-15 applies to codes only) | reject |
| 6 | ECH 4, BH 4 | The code lead uses `?? 'Site Survey Design'`, so an empty name gives "…code for ."; the fallback is text `wording.md` lacks | low | Confirmed that the test differs from the first step's truthiness test; a direct correction. The fallback's wording is raised with the orchestrator (an installation name is required at set-up, so it is not expected to show) | patch (`||`); wording question to the orchestrator |
| 7 | BH 14 | After a key mismatch the code that was sent stays in state and reappears on switching back | low | Confirmed by reading `submitSecondStepForm`; a one-line correction | patch |
| 8 | VG 1, BH 6 | The stale-reply guard after "Back to sign in" is untested | medium | Pre-verified gap | patch (held reply, Back, released refusal: password form, empty alert, focus on the password, button usable) |
| 9 | VG 2, BH 5 | "Checking…", `aria-disabled` and one request at a time are untested | medium | Pre-verified gap | patch (held reply, double click, one request) |
| 10 | VG 3, BH 6 | A mode switch clearing a shown refusal is untested | low | Pre-verified gap | patch (in "Wrong code, …") |
| 11 | VG 4 | `SignInUnknown`'s heading focus (moved to a layout effect) is asserted nowhere | low | Pre-verified gap; the check belongs in `signin.spec.mjs` ("when the session read cannot be checked…"), which this spec changes only when a sign-in test must change, and the ruling's list of checks leaves it out. Together with row 13's first-step alert | defer |
| 12 | VG 5, BH 6 | A server `invalid_input` naming `code` is never shown by the page in a test | low | Pre-verified gap (filed as defer since the page's check runs first); a mocked reply makes it cheap | patch |
| 13 | BH 8 | Focus after the restart path, "Back to sign in", the first step's alert and `SignInUnknown`'s heading is checked only with `toBeFocused`, which a passive effect also passes | low | Real for the expired alert (shown after a reply): patched with a focus-on-appear check. "Back to sign in" is a click, where React runs the effects before the next input, so no check can tell the two apart. The first step's alert and `SignInUnknown` are `signin.spec.mjs`'s tests | patch (expired alert); first step and `SignInUnknown` deferred with row 11; Back rejected |
| 14 | BH 7 | The wrong-code loop does not assert that the alert takes focus again for the same message | low | Confirmed by reading the test; one assertion per pass | patch |
| 15 | ECH 5, VG other 2 | The mode switch's focus-on-appear check cannot tell a layout effect from a passive one, since React flushes a click's effects before the next input | false (as a defect) | True of the check, as spec 7's row 28 found; the code uses a layout effect, and the shared `focusTo` effect is proven by the reply-driven checks (the heading after sign-in and the recovery field after a key mismatch). The check stays because the orchestrator's ruling asks for it; its limit is reported to the orchestrator | reject |
| 16 | BH 9 | The wrong code is `wrongCode(secret)`, not the matrix's "000000"; choices are unrecorded | false | "000000" can be a current code; `wrongCode` gives a code valid for no step near now, which is what the row means ("not current"). The record of choices is part of this spec's records, completed below | reject |
| 17 | BH 10 | The results line "16 of 16 in both projects" can be misread | n/a | The fix edits this build's spec (the results are rewritten at the end of the build) | reject |
| 18 | BH 11 | Deliberate breakage 1 ran only in chromium though criterion 27 names WebKit iPhone | low | Confirmed from the record | patch (run again in webkit-iphone and recorded) |
| 19 | BH 12 | The axe criterion's proving titles are abbreviated | n/a | The fix edits this build's spec; the titles are written out in full with the round's patches | reject |
| 20 | BH 13 | `SIGN_IN_ADMIN`, `expectSecretEqual` and the set-up helper repeat code in `signin.spec.mjs` and `two-step.spec.mjs`; `expectAccessible`'s `include` is unused | low | Real duplication; finding 15 bars a spec file from importing another, and the build notes kept `two-step.spec.mjs` and `signin.spec.mjs` out of scope, so consolidating means editing them. A drift would fail loudly (the administrator's sign-in in `accountThroughApi` throws), not silently. `include` keeps the helper's signature the same as the spec files' | reject |
| 21 | BH 15 | `aria-describedby` reads the error before the hint, while the hint is drawn above the error | low | The same order as spec 7's `CodeField` (error first, so the reason is heard first); cosmetic | reject |

## Pull request 13, CodeRabbit review round 1 (2026-11-24)

Dated notes; the frozen block above is unchanged. Record: `../review-round-1.md`.
- **A late success after "Back to sign in" no longer opens the app** (orchestrator ruling of 2026-11-24, Claude, accepted on Kevin's instruction). This replaces the implementation choice recorded above ("A late `signedIn` reply after 'Back to sign in' still opens the app") and triage row 3's rejection: the person has left that sign-in and may be signing in as another account. The page now checks `secondStepRun` before acting on any reply. A second ruling the same day (after the round's review layers): the browser must not keep a session that the page does not show, so a late success for a run the person left ends that session with the existing sign-out route and nothing changes on screen; if the page has already handed over to the app (someone signed in meanwhile), it reloads after the sign-out, so it shows the truth (signed out). A sign-out that is not confirmed leaves things as they are. A client change only; no new wording.
- **Round 2 (2026-11-24, `../review-round-2.md`; orchestrator ruling, option (b), Claude, accepted on Kevin's instruction):** "Back to sign in" now abandons a second-step request in flight: it is aborted, so a reply whose headers have not arrived is dropped by the browser with its cookies (shown in Chromium and WebKit by a browser test with a local server), and a late success can no longer replace a newer sign-in's session or clear its pending cookie. The browser can store a success's cookies a task before the page sees the reply, so (second ruling the same day, option (a)) the page signs out whenever it abandons a second step in flight, whether or not it saw a success; the next password submit waits for that sign-out (each try is bounded by the sign-out's own 15-second deadline); if it is not confirmed, the submit first tries it once more and is then sent either way. Cost, accepted: a sign-in made in another tab while this tab's second step was in flight is signed out when the person goes back here. A success whose body misses the client's time limit counts as a sign-in (the page reads the session). The page going away mid-request abandons it the same way and signs out with round 1's `endLeftSession` (sign-out, then reload). A mode switch cannot happen mid-request. On "Back to sign in", `endLeftSession` remains as a fallback that a real server can no longer reach. Residues: an unconfirmed sign-out with no later sign-in leaves that session live (a reload would open that account) until the next sign-in or a sign-out; and a second step the server completed after the abort leaves a session whose token no browser holds, until it expires (`deferred-work.md`, story 1.6).
- **Orchestrator ruling on the frozen block's reading (2026-11-24, Claude, accepted on Kevin's instruction; Kevin may overrule):** the frozen block's "'Back to sign in' returns without a request (D-3)" and matrix row 58 ("password form, no request") are read as "without a sign-in request, and with no request at all when none is in flight". With a second step in flight, Back cancels that request and sends the sign-out (orchestrator rulings of 2026-11-24 on pull request 13 round 2, (b) then (a)), because the alternative leaves another account's session in the browser unseen. The frozen block itself is not edited.
- The stale-reply browser test waits for the page to have read the held reply's body (a counter on `Response.prototype.json`) instead of 500 ms.
