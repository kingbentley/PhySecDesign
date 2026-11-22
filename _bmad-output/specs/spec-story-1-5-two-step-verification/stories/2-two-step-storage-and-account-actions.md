---
title: 'Story 1.5, spec 2: Two-step storage and account actions'
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
- Every operation identifies the account from this installation's session cookie with `liveSessionAccount`; none → `not_signed_in`. Operations that encrypt, decrypt or report availability take the deployment key in their input, optional, bounded to 64 characters (D-22).
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

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/server/installation/twoStepStore.ts`, `Installation.ts` -- tables and the six operations, each taking `now`.
- [ ] `site-studio/server/installation/signInStore.ts` -- counting made callable for account checks; no rule changed.
- [ ] `site-studio/server-tests/two-step-store.test.ts` -- matrix rows; `setup-store.test.ts`'s pinned operations list updated.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a confirmed set-up, the `recovery_codes` table holds exactly 10 rows of 64-hex SHA-256 and no column equals a code (criteria 10, 24). → Test: …
- Given a confirmed set-up under key K, the `two_step` row holds a `v1.` value that decrypts to the secret under K and associated data `two-step:<account id>`, contains none of the secret's bytes, and is refused under K′ (criterion 11). → Test: …
- Given each registered operation run with fixture input, comparing the two-step tables before and after shows that only `accountCheck`, `startTwoStep`, `confirmTwoStep`, `turnOffTwoStep`, `renewRecoveryCodes`, the bounded pruning (and, after spec 3, the sign-in operations) change them (criterion 28, standing rule 9). → Test: …
- Given a wrong password for turn on, turn off or fresh codes, nothing changes and the email count is one higher; five in a row put the email in a wait (D-5). → Test: …

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- Counts cleared after a correct password with a wrong fresh-codes code → Test: …
- Confirm accepts an earlier set-up's identifier → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
