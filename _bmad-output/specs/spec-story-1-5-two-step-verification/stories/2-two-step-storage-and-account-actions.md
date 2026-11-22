---
title: 'Story 1.5, spec 2: Two-step storage and account actions'
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: 'fbf53512d4b5fd0668d6f7b65d5c7f3b742925b8'
route: 'dispatch'
review_loop_iteration: 0
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> Builds to D-5, D-6, D-9, D-10, D-12, D-15 and D-22 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs spec 1. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The installation object has nowhere to keep an account's authenticator secret, its unconfirmed set-up or its recovery codes, and no counted way to check a signed-in person's password for an account action.

**Approach:** Add a two-step store to the installation object: its tables, a read of the signed-in account's state, a counted check of the password for an account action (a ticket the Worker completes with its outcome, as sign-in does), and the operations to start and confirm set-up, turn off, and make fresh recovery codes. Covers the storage side of CAP-1, CAP-2, CAP-6 (account actions), CAP-7, CAP-10 and CAP-12.

## Boundaries & Constraints

**Always:**
- Tables, created if absent (standing rule 8): `two_step` (account id primary key, secret ciphertext, last accepted step, turned-on time); `two_step_setups` (account id primary key, set-up identifier, secret ciphertext, indexed expiry); `recovery_codes` (code hash primary key, account id indexed, made time); `account_check_tickets` (ticket primary key, account id, session hash, email key, address failure row, marker id, stored-hash identity, purpose `turn_on` | `turn_off` | `fresh_codes`, indexed expiry 5 minutes).
- Every operation identifies the account from this installation's session cookie with `liveSessionAccount`; none → `not_signed_in`. Operations that encrypt, decrypt or report availability take the deployment key in their input, optional, a string of any length or `null` (spec 1's `deploymentKeyField` in `keyGuard.ts` as it is), anything that does not parse counting as no key, never `invalid_input` (orchestrator ruling, 2026-11-22, from spec 1's triage rows 1 and 2) (D-22).
- `twoStepState` (read-only): `{ enabled, recoveryCodesRemaining, availability, email }`, with availability from the key guard (`available`, `no_key` for `none`, `key_mismatch` for `missing` or `mismatch`) and the signed-in account's own email (D-12; finding 7).
- `accountCheck({ cookies, address, purpose, deploymentKey? })`: refuses before counting `two_step_already_on` (turn on while on), `two_step_off` (turn off or fresh codes while off), and, for `turn_on` and `fresh_codes`, `deployment_key_missing` or `deployment_key_mismatch` when the key guard says so (finding 14); then counts exactly as a sign-in attempt for the account's email key, the browser's usable marker and a known address, refusing `signin_wait` while a wait applies (D-5), using `SignInStore`'s counting, made callable rather than copied; answers the stored password hash and a ticket.
- Completions take the ticket, the Worker's outcome and the same cookies; the ticket is consumed whatever the outcome; it must match the purpose, the same live session and the same stored hash; any fault → `two_step_password_wrong`. A failure leaves the counts raised. Counts clear only when the whole action succeeds: for `turn_on` and `turn_off` a correct password, for `fresh_codes` a correct password and a correct code; clearing removes the email and marker counts and the check's address row, as a successful sign-in does (finding 19).
- `startTwoStep` (success): a 20-byte secret from `crypto.getRandomValues`, encrypted with associated data `two-step-setup:<account id>`, and a random 16-byte set-up identifier (not secret, hex), replacing any set-up row, expiry now + 10 minutes (D-10); answers `{ setupId, secret (base32), otpauthUri, installationName, email }` (findings 5, 7). Encrypting stores the fingerprint on first use (spec 1).
- `confirmTwoStep({ cookies, setupId, code, deploymentKey? })`, not counted: a live set-up row whose identifier equals `setupId` (else `two_step_setup_expired`: the set-up expired or was replaced by starting again, finding 5); decrypt and compare the normalised code with the three candidate steps (else `two_step_code_wrong`, the row kept); in one synchronous step that re-reads the set-up row and proceeds only if its ciphertext equals the one decrypted (finding 18), delete the set-up row, insert `two_step` with the secret re-encrypted under `two-step:<account id>` and the matched step as last accepted, and store 10 new recovery codes' SHA-256 (D-9); answer the 10 codes formatted. Already on → `two_step_already_on`.
- `turnOffTwoStep` (success): deletes `two_step`, any set-up row and every recovery code of the account; ends no session (D-10). Allowed under a key mismatch (D-15).
- `renewRecoveryCodes` (success and a code): decrypt, compare with candidates later than the last accepted step (D-6), else `two_step_code_wrong` with counts left raised; on a match, in one synchronous step that re-reads the `two_step` row and proceeds only if its ciphertext equals the one decrypted, otherwise `two_step_code_wrong` (finding 18), set the last accepted step, delete the old codes and store 10 new ones; answer them. Under a key mismatch → `deployment_key_mismatch` (refused before counting, as above).
- Crypto (random bytes, encryption, decryption, candidate codes, code hashes) before each synchronous step; the step re-reads every row it decides on. Expired set-ups and tickets pruned in bounded steps (at most 20) in these operations.
- Store operations take `now`. No secret, code, hash or token in a log, refusal or diagnostic.

**Ask First:** a change to `SignInStore`'s counting rules (only its callability changes here).

**Never:** the sign-in second step or the pending table (spec 3); routes, handlers, pages (specs 4, 7, 8); `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| State, off | live session, nothing set up, key K | `{ enabled: false, recoveryCodesRemaining: 0, availability: "available", email }` | N/A |
| No session | no or dead cookie | nothing read | `not_signed_in` |
| Check, turn on | live session, off | counts raised once; ticket; stored hash | N/A |
| Check while on | purpose `turn_on`, already on | nothing counted | `two_step_already_on` |
| Check, no key | purpose `turn_on` or `fresh_codes`, key state `none` or `mismatch` | nothing counted (finding 14) | `deployment_key_missing` / `deployment_key_mismatch` |
| Check while waiting | email in a wait | nothing counted | `signin_wait` with seconds |
| Wrong password | ticket, outcome failure | nothing set up; counts stay raised | `two_step_password_wrong` |
| Ticket misuse | another purpose, another session, reused, expired, hash changed | nothing written | `two_step_password_wrong` |
| Start | ticket, success | set-up row (identifier, ciphertext, expiry +10 min); answers identifier, 32-char base32 secret, URI, installation name, email; counts cleared | N/A |
| Start again | earlier set-up row | replaced; confirming with the earlier identifier (a code of the earlier secret) | `two_step_setup_expired` (finding 5) |
| Confirm | live set-up, its identifier, current code | `two_step` row, last step = matched; 10 code hashes; 10 codes answered once | N/A |
| Confirm wrong code | live set-up, wrong code | set-up kept; nothing counted | `two_step_code_wrong` |
| Confirm late | set-up at 10 min | nothing written | `two_step_setup_expired` |
| Confirm, row changed | set-up replaced between decrypting and the synchronous step | nothing written (finding 18) | `two_step_setup_expired` |
| State, on | after confirm | `{ enabled: true, recoveryCodesRemaining: 10, availability: "available", email }` | N/A |
| Turn off | ticket purpose `turn_off`, success | no `two_step`, set-up or recovery rows for the account | N/A |
| Fresh codes | ticket `fresh_codes`, success, current later code | old hashes gone, 10 new; last step raised; counts cleared | N/A |
| Fresh codes, right password, wrong code | | old set kept; email count one higher (finding 19) | `two_step_code_wrong` |
| Fresh codes, reused code | code of the step already accepted | old set kept; counts stay raised | `two_step_code_wrong` |
| Fresh codes, row changed | turned off and on again between decrypting and the synchronous step | nothing written (finding 18) | `two_step_code_wrong` |
| Sessions kept | turn on, turn off, fresh codes, each with a second session of the account | the other session still live after each (D-10; finding 39) | N/A |
| Key mismatch | fingerprint of K, operations given K′ | state `key_mismatch`; start and fresh codes refused before counting, confirm refused; turn off works | `deployment_key_mismatch` |
| Stored forms | after confirm | `two_step` holds `v1.` ciphertext without the secret's bytes; `recovery_codes` holds 64-hex hashes, none equal to a code | N/A |
| Restore sweep | every registered operation with fixture input | only the listed operations change the two-step tables | N/A |
| Restart | turned on, object restarted | state unchanged; a current code still confirms a fresh set | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/server/installation/signInStore.ts` -- `attempt`'s counting, `raiseCount`, `liveCount`, `liveSessionAccount`, `presentedSession`, `emailKey`, `prune`; make the counting callable for another kind of attempt.
- `site-studio/server/installation/keyGuard.ts`, `server/auth/totp.ts`, `server/auth/deploymentKey.ts`, `shared/twoStep.ts` -- from spec 1.
- `site-studio/server/installation/setupStore.ts` -- `users` columns, `parseOperationInput`.
- `site-studio/server/installation/Installation.ts` -- register the operations.
- `site-studio/server-tests/signin-store.test.ts`, `invitation-store.test.ts`, `helpers.ts`, `signin-helpers.ts` -- patterns and the pinned lists of brownfield.md.

## Build notes (orchestrator, 2026-11-22)

- Files in scope: `server/installation/twoStepStore.ts` (new), `server/installation/Installation.ts`, `server/installation/signInStore.ts` (callability of the counting only), `server-tests/two-step-store.test.ts` (new), and the pinned operations lists in `server-tests/setup-store.test.ts`, `signin-store.test.ts` and `invitation-store.test.ts`. Any other file needs a reason in the build report. Story 1.3's and 1.4's other tests stay unchanged.
- Spec 1 deferred to this spec (`deferred-work.md`, last entry): no test shows that `matchingStep` in `server/auth/totp.ts` answers the latest of the matching candidate steps. Fresh codes uses the last-accepted-step rule, so pin it here with a test and mark the entry taken.
- Never write a password, code, recovery code, authenticator secret, deployment key, cookie value or token into any file or log; tests generate theirs at run time (RFC 6238's published vectors are the one exception). Edit by hand, no bulk search-and-replace. Never run two test runs at once. No lint script exists; add none. Do not commit (the build session commits once after review).

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/server/installation/twoStepStore.ts`, `Installation.ts` -- tables and the six operations, each taking `now`.
- [x] `site-studio/server/installation/signInStore.ts` -- counting made callable for account checks; no rule changed.
- [x] `site-studio/server-tests/two-step-store.test.ts` -- matrix rows; `setup-store.test.ts`'s pinned operations list updated.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a confirmed set-up, the `recovery_codes` table holds exactly 10 rows of 64-hex SHA-256 and no column equals a code (criteria 10, 24). → Test: "the stored forms (criteria 10, 11, 24) > keeps exactly 10 recovery-code rows of 64-hex SHA-256, none equal to a code"
- Given a confirmed set-up under key K, the `two_step` row holds a `v1.` value that decrypts to the secret under K and associated data `two-step:<account id>`, contains none of the secret's bytes, and is refused under K′ (criterion 11). → Test: "the stored forms (criteria 10, 11, 24) > keeps the secret as v1 ciphertext that decrypts under K with associated data two-step:<account id>, holds none of its bytes and is refused under K′"
- Given each registered operation run with fixture input, comparing the two-step tables before and after shows that only `accountCheck`, `startTwoStep`, `confirmTwoStep`, `turnOffTwoStep`, `renewRecoveryCodes`, the bounded pruning (and, after spec 3, the sign-in operations) change them (criterion 28, standing rule 9). → Test: "the installation object's operations (criterion 28, standing rule 9) > change the two-step tables only in accountCheck, startTwoStep, confirmTwoStep, turnOffTwoStep, renewRecoveryCodes and the bounded pruning" (the pruning itself: "pruning and the restart > deletes at most 20 expired set-ups and tickets per write")
- Given a wrong password for turn on, turn off or fresh codes, nothing changes and the email count is one higher; five in a row put the email in a wait (D-5). → Test: "a wrong password for an account action (D-5) > changes nothing and raises the email count by one, for turn on, turn off and fresh codes; five in a row put the email in a wait"

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- Counts cleared after a correct password with a wrong fresh-codes code → Test: "fresh recovery codes (D-5, D-6) > refuses a wrong code after the right password two_step_code_wrong, keeping the old set, with the email count one higher (finding 19)" (also failed: "refuses the code of the step already accepted …" and "refuses two_step_code_wrong, writing nothing, when two-step was turned off and on again …"). Breakage applied as a committed clear of the counts straight after the ticket was consumed with a success outcome, then reverted.
- Confirm accepts an earlier set-up's identifier → Test: "starting and confirming a set-up (D-10) > replaces an earlier set-up when started again, and refuses the earlier identifier two_step_setup_expired (finding 5)". Breakage applied by removing both identifier comparisons in `confirmTwoStep`, then reverted.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Review Triage Log

Review of 2026-11-22: three layers (blind hunter B, edge-case hunter E, verification gap V) over the diff from `fbf5351`. No intent_gap or bad_spec entries, so no loopback. Patches were made by the implementation session and checked with the full verification run.

| # | Layer | Finding | Verdict | Evidence | Outcome |
|---|---|---|---|---|---|
| 1 | V1 | No test shows a successful action clears the marker count | low (pre-verified) | Every clearing test sends no marker, so `markerId: null` in `clearCounts` would pass | patch: marker cleared after a turn-on and a fresh-codes success |
| 2 | V2, B15 | No test shows another account's marker is ignored by `accountCheck` | low (pre-verified) | Dropping the `marker.accountId === account.id` comparison passes every test | patch: test added |
| 3 | V3, E4, E5, V other, B2 | The sign-in sessions sweep runs the two-step operations in sorted order and ignores results, so `startTwoStep` is refused there and never measured against the sessions table | low (pre-verified) | Sorted order puts `confirmTwoStep` before `startTwoStep`; the fixture falls back to `NO_TICKET`; no `ok` check in that loop | patch: fixture order, `ok` asserted for the two-step operations, fixture comment corrected |
| 4 | B5 | Key refusals raised after a completion consumes its ticket are untested | low | `keyAttempt`'s refusal path in `startTwoStep` and `renewRecoveryCodes` is reached by no test | patch: test added |
| 5 | B6 | Turn-off never meets a set-up row | low | Confirm deletes the set-up, so the delete in `turnOffTwoStep` runs on nothing | patch: seeded set-up row deleted by turn-off |
| 6 | B7 | The `not_signed_in` test's "reading nothing" checks only sign-in counts | low | `countsOf` does not include `account_check_tickets` or the two-step tables | patch: assertions added |
| 7 | B8 | Pruning is tested only through `accountCheck` | low | Removing `prune` from `consumeTicket` passes | patch: a refused completion prunes in the test |
| 8 | B9 | A refused check or confirm rolls its pruning back, unlike the header comment | low | `prune` runs inside the refusing `transactionSync`; the spec asks only for bounded pruning in these operations | patch: comment corrected |
| 9 | E6, B10 | The `matchingStep` search keeps every code it computes | low | `codes.push` per step; the search ends in about a second, but memory is unbounded in principle | patch: only the last three kept. Pinning constants instead: rejected (the run-time search is fast and keeps the test independent) |
| 10 | B11 | The key-field ruling is tested only on the state read and one check | low | `startTwoStep`, `confirmTwoStep`, `renewRecoveryCodes` share the field untested with `null`, `""`, long keys | patch: test added |
| 11 | B14 | `TicketRow.purpose` typed `string` | low | A purpose typo would compile | patch: typed `AccountCheckPurpose` |
| 12 | B1 | `server-tests/two-step-fixtures.ts` is outside the listed files without a reason | false | A reason exists and is given in the build report: three sweeps share the fixtures and importing a test file would register its tests again | rejected (reason in the report, not a code defect) |
| 13 | B3 | `accountCheck` raises sign-in counts but never runs the sign-in store's pruning | low | Real: expired count rows wait for the next sign-in to prune them; live counts filter by `clears_at`, so no rule changes; fixing it makes `SignInStore.prune` public | rejected (low, adds surface) |
| 14 | B4 | `SignInStore.work` accumulates across two-step calls | false | Only `attempt` and `complete` read it through `lastWork`, and both reset it first | rejected |
| 15 | B12 | The spec's Verification section records no run | false | The section lists commands; results go in the build report | rejected |
| 16 | B13 | The deferred-work closure is appended to `evidence:` and cites a title | low | Cosmetic; the orchestrator asked only that it be marked taken | rejected (low) |
| 17 | E1 | A fingerprint first stored by another request between `keyStatus` and the check's synchronous step lets one check count before the start refuses | low | Needs two Workers with different keys at once on an installation with nothing yet encrypted; one count raised; the fix re-classifies inside the step | rejected (low, unlikely, adds a guard) |
| 18 | E2 | A missing settings row in `startTwoStep` throws a plain error after the ticket is consumed | false | An account exists only after set-up writes the settings row (`setupStore.createFirstAdministrator`); not reachable | rejected |
| 19 | E3 | A stored ciphertext that fails to decrypt under the matching key reads as a wrong code | false | With the fingerprint matched and the associated data fixed by the account id, a null decrypt needs corrupted storage; not reachable | rejected |
