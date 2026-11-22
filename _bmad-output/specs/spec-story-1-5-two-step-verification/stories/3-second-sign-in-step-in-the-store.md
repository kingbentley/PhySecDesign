---
title: 'Story 1.5, spec 3: The second sign-in step in the store'
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
  1. no live pending row for the presented pending cookie, or the account is inactive or its stored hash changed, or (for `code`) the `two_step` row's ciphertext is no longer the one decrypted (finding 18) → `second_step_expired` (row deleted if present);
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
| Key mismatch | fingerprint of K, second step given K′ | code refused, not counted; recovery code signs in | `deployment_key_mismatch` |
| Sessions replaced | browser presented session S at the password step | S ended at success (CA-47) | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/server/installation/signInStore.ts` -- `complete`, `attempt`, `prune`, `writeSession`, `sessionMarker`, counting; `SignInCompleted` becomes a union with the pending answer.
- `site-studio/server/installation/twoStepStore.ts`, `keyGuard.ts`, `server/auth/totp.ts`, `shared/twoStep.ts` -- from specs 1 and 2.
- `site-studio/server/api/clientAddress.ts` -- `UNKNOWN_ADDRESS`.
- `site-studio/server/installation/Installation.ts` -- register `secondStep`.
- `site-studio/server-tests/signin-store.test.ts` -- patterns; its pinned session-writer list (line 858) gains `secondStep`.

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/server/installation/signInStore.ts` -- pending table, the branch in `complete`, the delete in `attempt`, `secondStep`.
- [ ] `site-studio/server/installation/Installation.ts` -- `secondStep` operation (a write: never retried).
- [ ] `site-studio/server-tests/second-step-store.test.ts` -- matrix rows; the pinned lists updated.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a two-step account's correct password, the pending table holds one 64-hex hash and no column equals the token; the row is gone after a correct second step, after expiry pruning, and in the step where a wait begins (criterion 4, CA-46). → Test: …
- Given an accepted code, the same code is refused in a new pending sign-in in the same step and the next one; given two pending sign-ins sending one code at once, exactly one session exists and the other is refused `second_step_code_wrong` (criterion 14). → Test: …
- Given wrong codes and wrong recovery codes, the email, marker and address counts rise as for wrong passwords and the same wait follows; a correct code clears them as a sign-in does (criterion 15, CA-15). → Test: …
- Given a pending row made at `t`, a second step at `t + 5 min − 1 ms` is live and at `t + 5 min` is `second_step_expired` (criterion 25). → Test: …

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The pending row not deleted when a wait begins → Test: …
- The last accepted step read before the synchronous step instead of inside it → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
