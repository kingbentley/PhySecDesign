---
title: 'Story 1.5, spec 3: The second sign-in step in the store'
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: 'dc33af9a10e273bf81004bd3e8b9f1c5cfb07774'
route: 'dispatch'
review_loop_iteration: 0
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/SPEC.md'
---

> Builds to D-2, D-3, D-4, D-6, D-13, D-15 and D-22 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs specs 1 and 2. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A correct password signs in at once; there is no state between the password and a session, and no check of a code or recovery code at sign-in.

**Approach:** For an account with two-step verification on, a correct sign-in completion writes a pending row (the ticket's bindings, a 5-minute expiry) and answers a pending token instead of a session. A second-step operation checks a code or a recovery code under story 1.3's counts and wait and, when right, starts the session as a completed sign-in does. Covers the store side of CAP-3, CAP-4, CAP-5 and CAP-6.

## Boundaries & Constraints

**Always:**
- Table `signin_pending` (token hash primary key, account id, email key, address failure row, marker id, stored-hash identity, presented session hash, indexed expiry), created if absent; pruned in bounded steps with the other sign-in tables.
- `complete(ticket, "success")` for an active account with a `two_step` row: the pending token (32 random bytes base64url) and its SHA-256 are made before the synchronous step, alongside `prepareSession`; in the same synchronous step (no await) as the ticket's consumption and the account check (finding 22) it writes a pending row with the ticket's bindings and expiry now + 5 minutes (CA-46), clears no count, writes no session, and answers `{ kind: "pending", identifier, pendingToken }`. Only the hash is stored. Accounts without the row complete exactly as today, answering `{ kind: "signedIn", … }`. Under a key mismatch the pending row is still written (recovery codes work, D-15).
- `attempt` deletes the pending row of the pending cookie the browser presents, if any, in its synchronous step before the wait check, so a refused attempt deletes it too (D-3; finding 23); the pending cookie's hash is made in the crypto phase.
- `secondStep({ cookies, address, method: "code" | "recovery", code, deploymentKey? })`: `address` is the request's `clientAddressKey`, counted and checked exactly as `attempt` does, `UNKNOWN_ADDRESS` included (finding 4); the key is passed by the Worker (D-22). Crypto first (the pending cookie's hash, the session cookie's hash, for `code` the account's decrypted secret and candidate codes, for `recovery` the normalised entry's SHA-256), then one synchronous step:
  1. no live pending row for the presented pending cookie, or the account is inactive or its stored hash changed, or the account has no `two_step` row any more, for either method, nothing counted (orchestrator ruling, 2026-11-22, from this spec's triage row 8), or (for `code`) the `two_step` row's ciphertext is no longer the one decrypted (finding 18) → `second_step_expired` (row deleted if present);
  2. a wait applies → row deleted, `signin_wait` with seconds (D-4). The waits are the email's unless the row has a usable marker, the marker's own, and the request address's; if the row's marker is now in its own wait it is treated as absent and the email's wait applies too, as `attempt` does (finding 36);
  3. compare: `code` against candidates later than the last accepted step, re-read inside this step (D-6); `recovery` by `DELETE … RETURNING` on the account's code with that hash (finding 9);
  4. wrong → raise the email count, the marker count when the row has a usable marker, and a new address row for a known address; if the counts now impose a wait, delete the pending row and answer `signin_wait` with its seconds (finding 3); otherwise `second_step_code_wrong` or `second_step_recovery_code_wrong` (D-13);
  5. right → delete the pending row; set the last accepted step (or the used recovery code is already deleted); clear the email and marker counts and remove the password attempt's address row; end the sessions presented at the password step and now; write the new session with `writeSession`; sign the marker (the row's marker id or a fresh one). Answer as `complete` does for a sign-in.
- A browser holds one pending cookie, so after another tab's password step a second step applies to the newer pending sign-in, which may be another account's; the code is checked against that row's account (finding 33).
- A malformed code or recovery code never reaches this operation (the route's schema refuses it, spec 4); here a value that does not normalise counts as wrong.
- `code` under a key mismatch → `deployment_key_mismatch`, nothing counted, row kept.

**Ask First:** a change to story 1.3's wait, clearing or marker rules.

**Never:** routes, cookies' `Set-Cookie` lines, handlers, pages (specs 4, 8); `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Password, two-step off | ticket, success | session as story 1.3 | N/A |
| Password, two-step on | ticket, success | pending row (hash only), counts unchanged, no session row; token answered | N/A |
| Code right | pending cookie, current code | session row; pending gone; counts cleared; last step set | N/A |
| Code from step −1 or +1 | | accepted | N/A |
| Code reused | the code just accepted, new pending, same or next step's window | nothing signed in; counted | `second_step_code_wrong` |
| Two at once, code | two pending sign-ins (two browsers, two pending tokens) send the same code with `Promise.all` | exactly one session; the other counted (finding 9) | `second_step_code_wrong` |
| Two at once, recovery | two pending sign-ins send one recovery code at once | one session; the code's row deleted once; the other counted | `second_step_recovery_code_wrong` |
| Recovery right | unused code, any case, with spaces | session; that code's row gone; 9 left | N/A |
| Recovery reused | the same code again | counted | `second_step_recovery_code_wrong` |
| Wrong codes | 4 wrong after the password (email count 5) | the fourth starts the wait, deletes the pending row and answers the wait (finding 3) | `second_step_code_wrong` ×3, then `signin_wait` |
| Wait from elsewhere | email put in a wait by other attempts | pending deleted | `signin_wait` |
| Address at threshold | the request's known address at its threshold | pending deleted (finding 4) | `signin_wait` |
| Unknown address | `UNKNOWN_ADDRESS` | no address count or wait (story 1.3's D-11) | N/A |
| Marker | password attempt carried a usable marker; wrong codes | marker count raised with the email count; the marker skips the email's wait, not its own | per row |
| Marker in its own wait | the row's marker reaches its own wait | marker treated as absent; the email's wait applies (finding 36) | `signin_wait` |
| Expiry | second step at 5 min − 1 ms; at 5 min | live; then refused, row pruned | `second_step_expired` |
| No or foreign cookie | no pending cookie; another installation's name; a session token as pending | nothing | `second_step_expired` |
| Pending as session | the pending token presented as the session cookie | `sessionInfo` signed out, cleared | N/A |
| New attempt | sign-in attempt presenting the pending cookie, also one refused with a wait | its row deleted (finding 23) | per attempt |
| Newer pending in the browser | tab A's password step for account X, then tab B's for account Y; second step with X's code | checked against Y's row; refused (finding 33) | `second_step_code_wrong` |
| Account changed | account made inactive, or its hash replaced, between the steps | nothing | `second_step_expired` |
| Secret changed | two-step turned off and on between decrypting and the synchronous step | nothing (finding 18) | `second_step_expired` |
| Turned off, recovery | two-step turned off between the password step and a recovery code | pending deleted; nothing counted (orchestrator ruling, 2026-11-22) | `second_step_expired` |
| Key mismatch | fingerprint of K, second step given K′ | code refused, not counted; recovery code signs in | `deployment_key_mismatch` |
| Sessions replaced | browser presented session S at the password step | S ended at success (CA-47) | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/server/installation/signInStore.ts` -- `complete`, `attempt`, `prune`, `writeSession`, `sessionMarker`, counting; `SignInCompleted` becomes a union with the pending answer.
- `site-studio/server/installation/twoStepStore.ts`, `keyGuard.ts`, `server/auth/totp.ts`, `shared/twoStep.ts` -- from specs 1 and 2.
- `site-studio/server/api/clientAddress.ts` -- `UNKNOWN_ADDRESS`.
- `site-studio/server/installation/Installation.ts` -- register `secondStep`.
- `site-studio/server-tests/signin-store.test.ts` -- patterns; its pinned session-writer list (line 858) gains `secondStep`.

## Build notes (build session, 2026-11-22)

- Read `site-studio/AGENTS.md`, then the code from specs 1 and 2: `server/installation/twoStepStore.ts`, `keyGuard.ts`, `server/auth/totp.ts` (`matchingStep` answers the latest matching candidate step; compare it with `last_step` inside the synchronous step), `shared/twoStep.ts` (`normaliseCode`, `normaliseRecoveryCode`, `PENDING_SIGNIN_TTL_MS`), `server-tests/two-step-store.test.ts` and `server-tests/two-step-fixtures.ts` for patterns.
- Files in scope: `server/installation/signInStore.ts`, `server/installation/Installation.ts`, new `server-tests/second-step-store.test.ts`, the pinned lists and sweeps in `server-tests/signin-store.test.ts`, `setup-store.test.ts`, `invitation-store.test.ts` and `two-step-store.test.ts`, and `server-tests/two-step-fixtures.ts` (a `secondStep` fixture for the sweeps). `twoStepStore.ts` may gain small accessors the second step needs. Two small changes outside the list, allowed: `server/auth/session.ts` may gain only `pendingCookieName(identifier)` = `` `${COOKIE_PREFIX}p-${identifier}` `` (spec 4 adds the cookie lines and `prefixedCookies`); `server/api/handlers.ts` gets only the smallest change that keeps it compiling: if `completeSignIn` answers anything but `kind: "signedIn"`, the sign-in route answers `refused("signin_failed")` with no cookie, so a two-step account cannot sign in with the password alone until spec 4. Any other file needs a reason in the report.
- Keep story 1.3's and 1.4's existing tests unchanged apart from the pinned lists and sweeps. So keep the name `SignInCompleted` for the signed-in answer (adding `kind: "signedIn"`), add `SignInPending` (`{ kind: "pending", identifier, pendingToken }`), and have `complete` return their union (for example `SignInCompletion`). The existing tests read `.sessionToken` from `SignInCompleted`; they must still compile and pass.
- Import cycle: `twoStepStore.ts` imports runtime values from `signInStore.ts` (`cookiesField`, `hashIdentity`) at module top level, so `signInStore.ts` must not import runtime values from `twoStepStore.ts`. Give `SignInStore` what it needs another way, for example an interface type declared in `signInStore.ts` (whether an account has a `two_step` row; its ciphertext and last step; decrypting under the key guard with associated data `two-step:<account id>`; setting the last step; deleting a recovery code by hash with `DELETE … RETURNING`) that `TwoStepStore` implements and `Installation` attaches after constructing both. The recovery-code hash is `sha256Hex` of the normalised code, as `recoveryCodeHash` in `twoStepStore.ts` computes it.
- The pending token is made like a session token (`newSessionToken`, 32 bytes base64url) and hashed with `sessionTokenHash`; a malformed pending cookie counts as none. Prune `signin_pending` in `prune` with the other tables.
- `secondStep` is a write: register it in `Installation.ts` with a schema (`cookies`, `address` as `attempt` takes it, `method` `code` | `recovery`, `code` a bounded string, `deploymentKey` as `deploymentKeyField`, strict) and never retry it. The route's schema (spec 4) refuses malformed codes; here a value that does not normalise counts as wrong.
- Sweeps: every sweep that runs all registered operations needs a `secondStep` fixture that succeeds (a fresh pending sign-in of an account with two-step on and a code later than its last accepted step) so the sessions-table sweep sees it write a session; the two-step tables' sweep (criterion 28) must show `secondStep` and `completeSignIn` changing them only as the spec says (the last accepted step, a used recovery code), and the pending table is a sign-in table. Story 1.3's session-writer test name and list gain `secondStep`.
- Tests use injected `now` values and real codes computed at run time from a secret made in the test (`totpAt`, `stepAt`); concurrency rows use `Promise.all` over two pending tokens. Never write a password, code, recovery code, authenticator secret, deployment key, cookie value or token into any file or log (RFC 6238's published vectors are the one exception). Edit by hand, no bulk search-and-replace. Never run two test runs at once; `git` is slow, use `git --no-pager` with long timeouts. No lint script exists; add none. Do not touch `.claude/`, `Site Studio UX screens.pdf`, `preview.html`, `experiments/`, `sprint-status.yaml`. Do not commit (the build session commits once after review).
- In the report, record each acceptance criterion's proving test title and the deliberate breakages' failing tests (make each breakage, run, record, revert), and list the matrix rows with their tests.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/server/installation/signInStore.ts` -- pending table, the branch in `complete`, the delete in `attempt`, `secondStep`.
- [x] `site-studio/server/installation/Installation.ts` -- `secondStep` operation (a write: never retried).
- [x] `site-studio/server-tests/second-step-store.test.ts` -- matrix rows; the pinned lists updated.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a two-step account's correct password, the pending table holds one 64-hex hash and no column equals the token; the row is gone after a correct second step, after expiry pruning, and in the step where a wait begins (criterion 4, CA-46). → Test: "for a two-step account writes one pending row holding only the token's 64-hex hash, no session, and clears no count (criterion 4)"; "starts a session, deletes the pending row, sets the last step, clears the counts and ends the sessions presented at the password step and now"; "is live at 5 minutes less 1 ms and second_step_expired at 5 minutes, when the row is pruned"; "is pruned by a later attempt once expired"; "raise the email and known address counts as wrong passwords; the fourth after the password starts the wait, deletes the pending row and answers signin_wait (finding 3)"
- Given an accepted code, the same code is refused in a new pending sign-in in the same step and the next one; given two pending sign-ins sending one code at once, exactly one session exists and the other is refused `second_step_code_wrong` (criterion 14). → Test: "is refused second_step_code_wrong and counted in a new pending sign-in, in the same step and the next one"; "sign in exactly once with one code sent with two pending tokens; the other is refused second_step_code_wrong"; "sign in exactly once with one code when both have decrypted before either decides, so the last step is read in the deciding step (D-6)"; "sign in exactly once with one recovery code sent with two pending tokens; its row is deleted once"
- Given wrong codes and wrong recovery codes, the email, marker and address counts rise as for wrong passwords and the same wait follows; a correct code clears them as a sign-in does (criterion 15, CA-15). → Test: "raise the email and known address counts as wrong passwords; the fourth after the password starts the wait, deletes the pending row and answers signin_wait (finding 3)"; "mixes wrong codes and wrong recovery codes in one count, and a correct code clears it as a sign-in does"; "is counted with the email by wrong codes, skips the email's wait, and once in its own wait is treated as absent so the email's wait applies"; "is cleared with the email count by a correct code"
- Given a pending row made at `t`, a second step at `t + 5 min − 1 ms` is live and at `t + 5 min` is `second_step_expired` (criterion 25). → Test: "is live at 5 minutes less 1 ms and second_step_expired at 5 minutes, when the row is pruned"

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The pending row not deleted when a wait begins → Test: "raise the email and known address counts as wrong passwords; the fourth after the password starts the wait, deletes the pending row and answers signin_wait (finding 3)" and "is counted with the email by wrong codes, skips the email's wait, and once in its own wait is treated as absent so the email's wait applies" (made, run, recorded, reverted, 2026-11-22)
- The last accepted step read before the synchronous step instead of inside it → Test: "sign in exactly once with one code when both have decrypted before either decides, so the last step is read in the deciding step (D-6)" (made, run, recorded, reverted, 2026-11-22). The `Promise.all` test through `callObject` did not catch it: the two calls did not interleave between the early read and the deciding step, so the deterministic in-object test was added.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Review Triage Log

Review of 2026-11-22: three layers (blind hunter B, edge-case hunter E, verification gap V) over the diff from `dc33af9`. No intent_gap or bad_spec entries, so no loopback. Before the review the build session corrected one deviation: the implementer had left `kind` off the signed-in answer to keep an exact-shape story 1.3 test unchanged, against the frozen `{ kind: "signedIn", … }`; `SignInCompleted` now carries `kind: "signedIn"`, and that test ("when correct removes its own attempt …", `signin-store.test.ts`) gained the one property. Patches were made by the implementation subagent and checked with the full verification run.

| # | Layer | Finding | Verdict | Evidence | Outcome |
|---|---|---|---|---|---|
| 1 | V2 | A correct recovery code's clearing of counts, ending of presented sessions and unchanged last step are untested | low (pre-verified) | Every success test that checks counts or sessions uses `method: "code"`; moving `clearCounts` under the code branch passes | patch: the recovery-code test checks them |
| 2 | B6 | No console watch over the pending completion and the second step's paths (standing rule 14) | low | Nothing logs today, but no test would catch a token, code or key written to the console | patch: console-watch test added |
| 3 | B7 | The key-mismatch test's name claims a mismatch at the password step, which takes no key | low | `complete` takes no key; the mismatch is only at the second step | patch: renamed |
| 4 | B8 | The marker test's final wait asserts no seconds, so it does not show the email's wait decided it | low | `toMatchObject({ code: "signin_wait" })` only | patch: seconds asserted against the email's wait |
| 5 | B10 | The `secondStep` fixture names the state read `email` and the email `address` | low | Cosmetic; a refused preparation is still caught by the sweep's `ok` check | patch: renamed. Failing the fixture outright: rejected (the sweep already asserts each two-step operation succeeds) |
| 6 | V1 | The interim refusal in the sign-in route for a two-step account has no route test | low | Real; the route is spec 4's and replaces the stopgap | defer: `deferred-work.md`, to spec 4 |
| 7 | B4, E3 | The interim handler answers `signin_failed` to a correct password and leaves the count raised and a pending row | low | Real until spec 4; the orchestrator's instruction for this spec (a two-step account must not sign in with the password alone, smallest change); D-4 clears nothing on a correct password in any case, and the row expires in 5 minutes | rejected (interim by instruction; recorded with row 6's entry) |
| 8 | B1, E1 | A recovery code after two-step was turned off between the steps is counted wrong, not `second_step_expired`; after off and on, the old pending sign-in accepts a new recovery code | low | Real as described. A recovery code of the account's current set after a correct password is a valid second step, so off-and-on again stays allowed; turned off, a recovery code was counted as wrong | fixed after the orchestrator's ruling (2026-11-22): with no `two_step` row, either method answers `second_step_expired`, the row deleted, nothing counted; frozen step 1 and the matrix amended; test "refuse second_step_expired, counting nothing, when two-step was turned off between the password step and a recovery code (orchestrator ruling)" |
| 9 | B2 | Turning two-step off leaves the account's pending rows | low | They cannot complete with a code (`second_step_expired`); with it turned on again they need the password already given and a current factor; they expire in 5 minutes | rejected (no harm shown; touches spec 2's turn-off) |
| 10 | B3, E2 | A stored secret that fails to decrypt is counted as a wrong code | false | With the fingerprint matched and the associated data fixed by the account id, a null decrypt needs corrupted storage; not reachable (as spec 2's triage row 19) | rejected |
| 11 | E4 | `complete` signs in with the password alone when the two-step access is not attached | false | `SignInStore` is constructed only in `Installation`'s constructor, which attaches it in the same constructor before any operation can run | rejected |
| 12 | B5, E5 | The second step's two-step reads and writes are missing from `lastWork()`, and no bounded-work test covers `secondStep` or pending rows in the every-kind pruning test | low | `lastWork()` is read only by story 1.3's attempt and completion tests; pending pruning is shown by "is pruned by a later attempt once expired"; the every-kind test is story 1.3's | rejected (low; no consumer) |
| 13 | B9 | The second step's address is not tied to the password step's | false | The frozen block says `address` is the request's, counted as `attempt` does, and a success removes the password attempt's own row (story 1.3's rule); the code does exactly that | rejected |
| 14 | B11 | Cryptography runs on paths certain to be refused (no pending cookie), and `complete` always makes a pending token | low | Cheap (random bytes and one SHA-256); the frozen block orders crypto first | rejected (low, adds a branch) |
| 15 | B12 | The diff leaves out the spec file | false | By design: the blind layer reviews the code alone, and the spec goes to the edge-case layer as its claims file | rejected |
