---
title: 'Story 1.5, spec 4: Routes and cookies'
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: 'a260b61ca6e002062d5596f9ca4f445833c31931'
route: 'dispatch'
review_loop_iteration: 0
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/wording.md'
---

> Builds to D-2, D-5, D-12, D-13, D-18 and D-22 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs specs 1 to 3. The self-hosted binding and smoke suite moved to spec 5 after the review's "Spec size and order". Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The store can hold two-step set-ups and complete a second step, but no route reaches them and the sign-in reply cannot say a code is needed.

**Approach:** Declare and handle the second-step route, the account two-step routes and the deployment-key state route; change the sign-in reply and set and clear the pending cookie; pass the Worker's key to the object; extend the sweeps and the log watch. Covers the route side of CAP-1 to CAP-4, CAP-6, CAP-7, CAP-9 and CAP-10.

## Boundaries & Constraints

**Always:**
- Routes (all declared in `shared/routes.ts` with input and reply schemas, each with a comment naming its future route class for story 1.8: `person only` for the second step and the account routes, `public` for the key-state route; finding 41):
  - `signIn` (changed): reply `{ name }` or `{ secondStep: true }` (D-12); the second sets only the pending cookie. Every sign-in reply that is not `{ secondStep: true }`, refusals included, carries `clearPendingCookieLine` when a pending cookie was presented (finding 23).
  - `secondStep`, `POST /api/v1/session/second-step`: input `{ method: "code" | "recovery", code }`, the code at most `CODE_FIELD_MAX_LENGTH` (12) characters for `code` and 64 for `recovery`, checked by `shared/twoStep.ts`'s normaliser for its method (a value that does not normalise → `invalid_input`, field `code`, not counted); the handler passes `clientAddressKey(context.request)` as `address` (finding 4); reply `{ name }` with the session cookie, the marker and a cleared pending cookie. `second_step_expired` and `signin_wait` also clear the pending cookie.
  - `twoStepState`, `GET /api/v1/account/two-step`: reply `{ enabled, recoveryCodesRemaining, availability, email }` (finding 7); `readsSessionCookie`.
  - `twoStepStart` (`…/two-step/start`, `{ password }`) → `{ setupId, secret, otpauthUri, installationName, email }` (findings 5, 7); `twoStepConfirm` (`…/confirm`, `{ setupId, code }`) → `{ recoveryCodes: string[10] }`; `twoStepTurnOff` (`…/turn-off`, `{ password }`) → `{ enabled: false }`; `twoStepRecoveryCodes` (`…/recovery-codes`, `{ password, code }`) → `{ recoveryCodes: string[10] }`; all `POST`.
  - `deploymentKeyState`, `GET /api/v1/deployment-key/state`: public, read-only, `{ fingerprint: "none" | "stored", key: "none" | "present" | "matches" | "mismatch" }` (D-18 as ruled), the Worker's key passed to the operation.
- Every new non-GET route is `appOriginOnly` and `readsSessionCookie` (standing rule 13, V-12).
- Handlers with a password: `hashQueue.hasRoom()` else `signin_busy`; `accountCheck` (with the key for `turn_on` and `fresh_codes`); `verifyPassword` through the queue (`HashQueueBusy` or an aborted signal → `signin_busy`); the completion with the outcome. Writes never retried after a bare reset; the two reads retried once.
- The key (D-22; finding 6): handlers read `env.DEPLOYMENT_KEY` (typed `string | null | undefined` by spec 1) and pass it as `deploymentKey` only when it is a non-empty string, otherwise omit the field; never logged. A route test passes `DEPLOYMENT_KEY: null` in the env given to `handleRequest` and finds `no_key` and `deployment_key_missing`, not `invalid_input`; another changes the Worker's key between two requests to the same running object and finds the second judged by the new key.
- Cookies: `pendingCookieName(identifier)` = `__Host-ssd-p-<identifier>`; `pendingCookieLine` `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=300`; `clearPendingCookieLine` with the same attributes and `Max-Age=0`; `prefixedCookies` admits the `p-` names (D-2).
- Only the start reply holds a secret and only the confirm and fresh-codes replies hold recovery codes (CAP-9).

**Ask First:** a change to `sessionReply` or to story 1.4's routes.

**Never:** pages, browser tests (specs 7, 8); the self-hosted configuration and smoke suite (spec 5); the deploy command (spec 6); a key in the repository; `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sign in, off | correct password | `{ name }`, session and marker cookies | N/A |
| Sign in, on | correct password | `{ secondStep: true }`, only the pending cookie; session read signed out | N/A |
| Sign in with a pending cookie | wrong password or a wait, pending cookie presented | refusal with `clearPendingCookieLine` (finding 23) | as story 1.3 |
| Second step | pending cookie, current code | `{ name }`, session and marker cookies, pending cleared; the earlier session refused | N/A |
| No pending cookie | another browser, no cookie | pending cleared | `second_step_expired` 401 |
| Pending elsewhere | the pending cookie sent to `session`, `invite`, the account routes | signed out; `not_signed_in` | as stated |
| Bad code shape | "12a456" | not counted | `invalid_input`, field `code` |
| Address | second step from a known address at its threshold | pending cleared | `signin_wait` |
| Start | session, right password | `{ setupId, secret, otpauthUri, installationName, email }` | N/A |
| Start, wrong password | session | nothing set up | `two_step_password_wrong` 403 |
| Start, no key | `DEPLOYMENT_KEY` unset or `null` | nothing counted | `deployment_key_missing` 503 |
| Full queue | queue full | nothing counted | `signin_busy` 503, `Retry-After: 5` |
| Confirm | its `setupId`, current code | `{ recoveryCodes }` (10) | N/A |
| Confirm, replaced | an earlier `setupId` | nothing | `two_step_setup_expired` |
| Turn off, wrong password | session, on | still on | `two_step_password_wrong` |
| Fresh codes | password and current code | 10 new; an old code refused at the second step | N/A |
| Fresh codes, wrong code | right password | old set kept | `two_step_code_wrong` |
| Origin | each new non-GET route from another origin, or without the header | nothing | `origin_refused` |
| No session | each account route without a session | nothing | `not_signed_in` |
| Mismatched key | fingerprint of K, Worker given K′ | state `key_mismatch`; code checks refused; recovery code signs in | `deployment_key_mismatch` 503 |
| Key state | before and after a first set-up; with K′ | `{none,present}`, `{stored,matches}`, `{stored,mismatch}`; no fingerprint value in any reply | N/A |
| Reply sweep | every route after set-up and confirm | no reply but start holds the secret; none but confirm and fresh codes hold a code | N/A |
| Log watch | `console` over set-up, both second steps, fresh codes, turn off | no secret, code, key, password or token | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/routes.ts`, `server/api/handlers.ts`, `server/api/router.ts`, `server/api/clientAddress.ts` -- declarations, handlers, the cookie pass-through, the address.
- `site-studio/server/auth/session.ts` -- `prefixedCookies`, cookie lines.
- `site-studio/server/env.ts` -- read only (spec 1 owns it; finding 21).
- `site-studio/server-tests/signin-routes.test.ts`, `invitation-routes.test.ts`, `signin-declarations.test.ts` -- patterns and pinned lists (brownfield.md).

## Build notes (build session, 2026-11-22)

- Read `site-studio/AGENTS.md`. What specs 1 to 3 left: `shared/twoStep.ts` (`codeField`, `recoveryCodeField`, `secondStepInput` (discriminated on `method`), `twoStepPasswordInput`, `twoStepConfirmInput`, `twoStepRecoveryCodesInput`; use these as the route inputs, do not write new ones); `server/installation/keyGuard.ts` (`deploymentKeyField`, `DeploymentKeyState`, operation `deploymentKeyState` with input `{ deploymentKey? }`); `server/installation/twoStepStore.ts` (operations `twoStepState`, `accountCheck`, `startTwoStep`, `confirmTwoStep`, `turnOffTwoStep`, `renewRecoveryCodes`; read their input schemas there: they are `.strict()`, and `turnOffTwoStepInput` has no `deploymentKey` field, so never send one to it); `server/installation/signInStore.ts` (`completeSignIn` answers `SignInCompletion` = `{ kind: "signedIn", identifier, sessionToken, marker, account, signedInAt }` or `{ kind: "pending", identifier, pendingToken }`; operation `secondStep` with input `{ cookies, address, method, code, deploymentKey? }` answering `SignInCompleted`); `server/auth/session.ts` (`pendingCookieName` exists); `server/api/handlers.ts` (the interim `if (done.kind !== "signedIn") return refused("signin_failed")` line, which this spec replaces). Patterns: `server-tests/signin-helpers.ts` (`installationFor(name, wrap)`, whose `wrap` sees every object call's operation and `init.body`; `post`, `get`, `jarFrom`, `setCookiesOf`, `refusalOf`, `seedAccount`), `server-tests/signin-routes.test.ts`, `server-tests/two-step-fixtures.ts` (`newDeploymentKey`), `server-tests/second-step-store.test.ts` and `two-step-store.test.ts` (computing codes at run time with `totpAt` and `stepAt` from `server/auth/totp.ts`, `base32Decode`).
- Files in scope: `shared/routes.ts`, `server/api/handlers.ts`, `server/api/router.ts` only if the cookie pass-through needs it, `server/auth/session.ts` (cookie lines, `prefixedCookies`), new `server-tests/two-step-routes.test.ts` and `server-tests/second-step-routes.test.ts`, the pinned lists and sweeps in `server-tests/signin-declarations.test.ts`, `server-tests/invitation-routes.test.ts` (its route sweep's `inputs: Record<RouteId, …>` must gain every new route, each answering 200, so give the sweep what each route needs: a pending cookie for `secondStep`, a started set-up for `twoStepConfirm`, two-step on for `twoStepTurnOff` and `twoStepRecoveryCodes`; keep its existing expectations), `server-tests/api.test.ts` if a pin there breaks, and `server-tests/two-step-fixtures.ts` or `signin-helpers.ts` for shared helpers. `server/env.ts` is read only. Not in scope: `src/`, `browser-tests/`, `tests/`, `deploy/selfhost/`, `scripts/`, `experiments/`, `sprint-status.yaml`. Any other file needs a reason in the report.
- The identifier on refusals: the pending cookie must be cleared on refusals that answer no identifier (`second_step_expired`, `signin_wait`, and every sign-in refusal), and a cookie named with another installation's identifier must never be cleared (story 1.3, criterion 17: the browser-test servers share cookies across localhost ports). Where a call already answered the identifier (the sign-in attempt, the completion, a successful second step) use it. Otherwise, only when the request presented a cookie whose name starts with `__Host-ssd-p-`, read the identifier with the existing read-only `sessionInfo` operation given `{ cookies: {} }` (idempotent, retried once), and add `clearPendingCookieLine(identifier)` only when `cookies[pendingCookieName(identifier)]` was presented. If that read is refused, answer the original refusal without the line. Do not change `sessionReply` or the session route. Router-level refusals (`origin_refused`, `invalid_input` from the schema, `method_not_allowed`) are answered before any handler and carry no line; say so in the report.
- Sign-in route: success for an account without two-step → `{ name }` with the session and marker lines, plus the clear line when a pending cookie was presented; `kind: "pending"` → `{ secondStep: true }` with only `pendingCookieLine(identifier, pendingToken)`; every refusal (`signin_busy` before counting, `signin_wait` from the attempt, `signin_failed`, `signin_busy` after counting) with the clear line when a pending cookie was presented. Existing story 1.3 tests that present no pending cookie must pass unchanged. Take spec 3's deferred route test (`_bmad-output/implementation-artifacts/deferred-work.md`, the entry on the interim refusal): a two-step account's correct password answers `{ secondStep: true }` with no session or marker line, and mark the entry taken with the test's title.
- `secondStep` route: input `secondStepInput`; handler passes `{ cookies: context.cookies, address: clientAddressKey(context.request), method, code, ...key }`, never retried. Success: `{ name }`, session and marker lines and the clear line. `second_step_expired` and `signin_wait` (with its seconds) carry the clear line; `second_step_code_wrong`, `second_step_recovery_code_wrong` and `deployment_key_mismatch` keep the pending cookie (no line). Comments on the declarations: `// Route class (story 1.8): person only` for the second step and the account routes, `// Route class (story 1.8): public` for the key-state route.
- Account routes: `twoStepState` (GET, `readsSessionCookie`, not `appOriginOnly`, retried once); `twoStepStart`, `twoStepTurnOff`, `twoStepRecoveryCodes` follow the sign-in route's order: `hashQueue.hasRoom()` else `signin_busy`; `accountCheck` `{ cookies, address, purpose, …key for turn_on and fresh_codes only }`; `verifyPassword(input.password, check.passwordHash, context.request.signal)` catching `HashQueueBusy` or an aborted signal as `busyOrGone()`; then the completion with `{ cookies, ticket, outcome, … }`. `twoStepConfirm` calls `confirmTwoStep` directly. None of these writes is retried. Reply schemas strict; `recoveryCodes` exactly 10 strings.
- The key (D-22): one helper, e.g. `deploymentKeyInput(env)`, answering `{ deploymentKey: env.DEPLOYMENT_KEY }` only when it is a non-empty string and `{}` otherwise. The operations accept `null`, so a handler that passed `null` would still behave correctly: the test for the omission must inspect the object calls' inputs through `installationFor`'s `wrap` (no recorded input has a `deploymentKey` key when the env's key is `null`, `""` or absent; the key is present and equal otherwise). That is the test deliberate breakage 1 must fail. The second key test uses two envs over the same installation namespace (the scoped `env` copied with another `DEPLOYMENT_KEY`) against one running object.
- Cookies: `pendingCookieLine(identifier, token)` = `` `${pendingCookieName(identifier)}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=300` `` (300 from `PENDING_SIGNIN_TTL_MS`); `clearPendingCookieLine(identifier)` the same attributes with an empty value and `Max-Age=0`; `PASSED_COOKIE_NAME` admits `(?:m-|p-)?`. `signin-declarations.test.ts`: the pinned list gains the six new cookie-reading routes (rename the test: the session read is no longer the only GET), and the request-context test gains a `p-` cookie.
- Tests: one `describe` per route family; each matrix row and acceptance criterion gets a named test; titles recorded after the arrows below. The log watch replaces `console.log/info/warn/error/debug` as `invitation-routes.test.ts` does and checks no line holds the secret, any code, recovery code, key, password or cookie value. Use real scrypt hashes made once in `beforeAll` (as `signin-routes.test.ts`); turning on through the routes needs the password three times per set-up, so share set-ups across rows where a row allows it. Codes within one 30-second step are refused by the last-step rule; compute a later step's code (`stepAt(Date.now()) + 1`) rather than waiting. The 5-minute expiry at the route: seed or shorten nothing in production code; age the pending row in storage with `runInDurableObject` (set its `expires_at` to the past).
- Never write a password, code, recovery code, authenticator secret, deployment key, cookie value or token into any file or log; tests generate theirs at run time. Edit by hand, no bulk search-and-replace. Never run two test runs at once; the full server suite takes a few minutes. `git` is slow: `git --no-pager`, long timeouts. No lint script exists; add none. Do not touch `.claude/`, `Site Studio UX screens.pdf`, `preview.html`. Do not commit. Run `npm run typecheck` and `npm run test:server` in `site-studio/` before reporting; the build session runs the rest.
- In the report: each acceptance criterion's proving test title; each matrix row with its test; both deliberate breakages made, run, the failing test's title recorded, reverted; every existing test changed and why; any file touched outside the list.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/routes.ts` -- the declarations, reply schemas and class comments.
- [x] `site-studio/server/api/handlers.ts`, `server/auth/session.ts` -- handlers, cookies, the key passed on.
- [x] `site-studio/server-tests/two-step-routes.test.ts`, `second-step-routes.test.ts` -- matrix rows; `signin-declarations.test.ts`'s pinned list gains the new cookie-reading routes.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given an account with two-step verification on, a correct password answers `{ secondStep: true }` with no session or marker cookie and the session read answers signed out; a current code then signs in (criterion 3). → Test: `second-step-routes.test.ts`, "for an account with two-step verification on answers { secondStep: true } with only the pending cookie, no session or marker line, and the session read answers signed out; a current code then signs in (criterion 3)"
- Given a browser that presented session S, a successful second step sets a new session cookie and S is refused afterwards (criterion 5, CA-47). → Test: `second-step-routes.test.ts`, "with the pending cookie and a current code sets a new session cookie and the marker, clears the pending cookie, and the session the browser presented before is refused afterwards (criterion 5, CA-47)"
- Given fresh codes made with the password and a current code, an old recovery code is refused and a new one accepted; a wrong password or code changes nothing (criterion 8). → Test: `two-step-routes.test.ts`, "with the password and a current code answers 10 new codes; an old code is then refused at the second step and a new one accepted (Fresh codes; criterion 8)", "with the right password and a wrong code is refused 403 two_step_code_wrong and the old set is kept (Fresh codes, wrong code)" and "with a wrong password is refused 403 two_step_password_wrong and the old set is kept (criterion 8)"
- Given turn off or turn on with a wrong password, the state is unchanged (criteria 16, 17). → Test: `two-step-routes.test.ts`, "with a wrong password is refused 403 two_step_password_wrong and leaves it on (Turn off, wrong password; criterion 16)" and "start with a wrong password is refused 403 two_step_password_wrong and nothing is set up (Start, wrong password; criterion 17)"
- Given a pending cookie, it is refused after 5 minutes, from a request without it, and as a session or for any other route (criterion 18). → Test: `second-step-routes.test.ts`, "refuses a pending cookie after 5 minutes with second_step_expired and clears it (criterion 18)", "without a pending cookie, from another browser, or with an unknown one is refused 401 second_step_expired; this installation's pending cookie is cleared and another installation's never (No pending cookie)" and "finds that a pending cookie allows nothing else: as a session cookie or sent to the session read, invite and the account routes it is not signed in (Pending elsewhere; criterion 18)"
- Given each new non-GET route without the app's origin or header, it is refused `origin_refused` (criterion 19). → Test: `two-step-routes.test.ts`, "refuse each new non-GET route from another origin, without Origin or without the app's header with origin_refused before any object call (Origin; criterion 19)"; `second-step-routes.test.ts`, "with another Origin / no Origin / no app header is refused origin_refused before any object call, keeping the pending sign-in (Origin; criterion 19)"; `signin-declarations.test.ts`, "make every non-GET route that reads the session cookie appOriginOnly"
- Given the reply sweep and the log watch, neither the secret nor a recovery code appears outside the start, confirm and fresh-codes replies, and nothing secret is logged (criterion 20). → Test: `two-step-routes.test.ts`, "finds the authenticator secret only in the start reply and recovery codes only in the confirm and fresh-codes replies, over every route after set-up (Reply sweep)" and "hold no secret, code, recovery code, key, password or cookie value over set-up, a second step with a code and with a recovery code, a fresh set and turning off (Log watch)"

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The handler passes `DEPLOYMENT_KEY` through when it is `null` → Test: `two-step-routes.test.ts`, "with DEPLOYMENT_KEY null, start is refused 503 deployment_key_missing before the password is counted, the state reads no_key and the key state none, and no object call is given a deploymentKey (Start, no key; D-22, finding 6)" (and its "empty" twin) failed; reverted
- The second-step route not `appOriginOnly` → Test: `signin-declarations.test.ts`, "make every non-GET route that reads the session cookie appOriginOnly", with `second-step-routes.test.ts`'s three origin tests and "is a POST, appOriginOnly and reads the session cookie (standing rule 13)", and `two-step-routes.test.ts`'s origin test, failed (8 in all); reverted

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
- `npm run test:browser` -- pass: story 1.3's and 1.4's browser tests still pass after the sign-in and cookie changes (review, "Spec size and order"; about 10 minutes, from a short checkout path)

## Review Triage Log

Review of 2026-11-22: three layers (blind hunter B, edge-case hunter E, verification gap V) over the diff from `a260b61`. No intent_gap or bad_spec entries, so no loopback. Patches were made by the implementation subagent and checked with the full verification run. Two changes outside the build notes' file list are explained in the build report, not here: `setup-store.test.ts`'s "password hash parameters at create" block got a 60-second timeout (about a dozen real scrypt hashes timed out twice under the default 5 seconds once the two new hash-heavy suites ran beside it; nothing it tests changed), and the route sweep in `invitation-routes.test.ts` went from 120 to 300 seconds for its seven new routes. Router-level refusals (`origin_refused`, `invalid_input` from the schema, `method_not_allowed`) are answered before any handler and carry no clear line.

| # | Layer | Finding | Verdict | Evidence | Outcome |
|---|---|---|---|---|---|
| 1 | V1 | The account routes' after-counting busy or client-gone branch in `checkAccountPassword` has no test | low (pre-verified) | The full-queue test fills the queue before the request, so `accountCheck` never runs and the catch is never reached | patch: abort test for start, turn off and fresh codes |
| 2 | V2 | The sign-in route's after-counting `signin_busy` is never checked for the pending clear line | low (pre-verified) | The pending-cookie busy test refuses at `hasRoom()` before counting; the only after-counting test sends no cookie | patch: aborted sign-in presenting this and another installation's pending cookie |
| 3 | V3 | The fallback when the identifier read is refused has no test | low (pre-verified) | No route test makes `sessionInfo` fail for these handlers | patch: test with a wrap refusing `sessionInfo` (layer proposed defer; the test is cheap) |
| 4 | V other, B1, B2 | The no-key omission test reaches only four operations; the second step under a missing key is untested | low | Under a null key `startTwoStep` and `renewRecoveryCodes` are unreachable (`accountCheck` refuses first), but `secondStep` is reachable and its input is never recorded; a code there answers `deployment_key_mismatch` (key guard: fingerprint stored, no key) and nothing pins the cookie being kept | patch: second step with a null and an empty key recorded and checked |
| 5 | B5, E4 | The log watch misses the confirm code, the recovery sign-in's pending token, the wrong codes and the normalised fresh codes; `installed!` is used after `finally` | low | The forbidden list is built from formatted fresh codes and the jars it captures only | patch: values added; post-`finally` use made safe |
| 6 | E1, E5 | A thrown `sessionInfo` call inside `pendingClearLines` turns the original refusal into a 500 | low | `callObject` with `idempotent` retries a version stop and answers `updating` after two tries; it throws only on an unexpected failure of the object, when the reply would be an internal error anyway. The build note covers a refused read, which is handled | rejected (unlikely, a catch-all guard would hide real faults) |
| 7 | E2, B7, B8 | A `signin_busy` refusal before counting now waits on one object call when a pending cookie is presented | low | Real: one read-only call, only when a `__Host-ssd-p-` cookie is presented; the frozen block requires the clear line on every sign-in refusal, and the identifier is not known without it | rejected (required by the frozen block) |
| 8 | E3 | A fixed wrong code (`000000` or `111111`) may equal another in-window step's code | low | Chance about 3 in a million per use; the fix adds a search loop | rejected (low, unlikely) |
| 9 | B3 | The confirm route has no wrong-code, used-step or already-on tests | low | These are store rules of spec 2, tested in `two-step-store.test.ts`; the handler passes the refusal through unchanged and no matrix row asks for them at the route | rejected (covered by the store tests) |
| 10 | B4 | Turning off while off is untested at the route | low | `two_step_off` before counting is tested in `two-step-store.test.ts`; the handler passes it through | rejected (covered by the store tests) |
| 11 | B6 | `setup-store.test.ts` and the sweep's timeout changed without a recorded reason | false | The reasons are given in the build report and in this log's preamble; neither changes what a test checks | rejected |
| 12 | B9 | The second step's success clears the pending cookie without checking it was presented | false | A success needs a live pending row found by the presented cookie's hash, so the cookie was presented | rejected |
| 13 | B10 | `fillHashQueue`, `countsOf` and the wrong-code pick are copied into the two new files | low | `signin-routes.test.ts` keeps its own copies too; no caller diverges | rejected (low, cosmetic) |
| 14 | B11 | The sign-in page cannot handle `{ secondStep: true }`, and nothing records it | low | Real until spec 8; pages are outside this spec by its frozen Never; no browser test turns two-step on before spec 7 | defer: `deferred-work.md`, to spec 8 |
| 15 | B12 | Nothing says a malformed key counts as absent | false | D-14 and `server/env.ts` say a value that does not parse counts as no key (finding 30) | rejected |
| 16 | B13 | The sign-in operations' key-free inputs are pinned by a test but not stated in the spec | false | D-22 passes the key only to operations that encrypt, decrypt or report the key's state; the test pins that rule | rejected |
| 17 | B14 | The report items (router refusals without the line, changed tests) have no place in the spec | low | Recorded in this log's preamble and the build report | rejected (recorded here) |
