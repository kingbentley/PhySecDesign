---
title: 'Story 1.5, spec 4: Routes and cookies'
type: 'feature'
created: '2026-11-22'
status: 'ready-for-dev'
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

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/shared/routes.ts` -- the declarations, reply schemas and class comments.
- [ ] `site-studio/server/api/handlers.ts`, `server/auth/session.ts` -- handlers, cookies, the key passed on.
- [ ] `site-studio/server-tests/two-step-routes.test.ts`, `second-step-routes.test.ts` -- matrix rows; `signin-declarations.test.ts`'s pinned list gains the new cookie-reading routes.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given an account with two-step verification on, a correct password answers `{ secondStep: true }` with no session or marker cookie and the session read answers signed out; a current code then signs in (criterion 3). → Test: …
- Given a browser that presented session S, a successful second step sets a new session cookie and S is refused afterwards (criterion 5, CA-47). → Test: …
- Given fresh codes made with the password and a current code, an old recovery code is refused and a new one accepted; a wrong password or code changes nothing (criterion 8). → Test: …
- Given turn off or turn on with a wrong password, the state is unchanged (criteria 16, 17). → Test: …
- Given a pending cookie, it is refused after 5 minutes, from a request without it, and as a session or for any other route (criterion 18). → Test: …
- Given each new non-GET route without the app's origin or header, it is refused `origin_refused` (criterion 19). → Test: …
- Given the reply sweep and the log watch, neither the secret nor a recovery code appears outside the start, confirm and fresh-codes replies, and nothing secret is logged (criterion 20). → Test: …

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The handler passes `DEPLOYMENT_KEY` through when it is `null` → Test: …
- The second-step route not `appOriginOnly` → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
- `npm run test:browser` -- pass: story 1.3's and 1.4's browser tests still pass after the sign-in and cookie changes (review, "Spec size and order"; about 10 minutes, from a short checkout path)
