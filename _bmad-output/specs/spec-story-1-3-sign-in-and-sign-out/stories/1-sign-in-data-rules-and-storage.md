---
title: 'Story 1.3, spec 1: Sign-in data, rules and storage'
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
---

> **Not ready for development.** Kevin's decisions D-1 to D-5 in SPEC.md are frozen and the values below follow them, with the uncontested review findings applied. Rows marked "held H-n" wait for Kevin's rulings; build nothing for them beyond what the row states.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.2 left users with password hashes but nowhere to keep sessions, no sign-in failure counts, no installation identifier for the cookie name, no marker key and no stand-in hash.

**Approach:** Add the sign-in rules once in `shared/`, session tokens, the marker, the stand-in hash and the hash queue in `server/auth/`, and to the installation object a sign-in store with its tables and operations: count an attempt before its check (or refuse with a wait) and issue a bound ticket, complete it (lower the counts on success, clear the email's count, store the session's hash), read and end sessions, and prune. Covers the storage side of CAP-3, CAP-6, CAP-7, CAP-8, CAP-11 and the D-5 queue.

## Boundaries & Constraints

**Always:**
- Exactly two object classes; new tables created if absent under data format 1 (standing rule 8). No host-specific code. Exact versions; no new dependency.
- Counts in installation-object SQLite storage, raised before any password check, in one synchronous step with the ticket.
- The ticket is bound inside the object to the account or "stand-in", the email key, the address key, the marker flag, the stored hash's identity and the presented session's hash; completion takes only the ticket and the outcome (A-1, E-22).
- The stand-in is a random salt and a random 32-byte value with the current parameters, made from no password and never the D-6 fixture (A-1, E-4).
- Email keys are HMAC-SHA-256 under a random key in the object (A-13). Every row kind has an indexed expiry or clearing time; pruning is bounded (A-14, E-17).
- Store operations take `now` (V-18). The identifier is created with the object and never changes (D-1, V-11).
- No token, marker, password, hash or entered email in a log, refusal or reply. Only SHA-256 of tokens is stored.
- `shared/` and `server/` TypeScript; tests from before story 1.2 unchanged.

**Never:** Routes or route declarations, router or handler changes, cookies on the wire (spec 2). Pages or browser tests (spec 3). Deploys (spec 4). `experiments/`, the four Sites files, `sprint-status.yaml`. Anything a held finding (H-1 to H-9) would decide.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Known email, under limits | email key, address | counted for email and address; stored hash, identifier, bound ticket | N/A |
| Unknown or inactive email | email key, address | counted the same; stand-in signal, identifier, ticket marked stand-in; same shape | N/A |
| Email waiting | 5+ failures in a row, inside 60 s·2^(n−5) (max 900 s) | refused, not counted (D-2) | `signin_wait` + seconds |
| Email cleared | 15 min after its wait ended | count starts again (D-2 i; below-threshold clearing held, H-6) | N/A |
| Address waiting | 20+ failures in rolling 15 min, inside 60 s·2^(n−20) (max 900 s) | refused, not counted (D-2) | `signin_wait` + seconds |
| Marker valid for the email | email waiting, address not | counted per address only; ticket (CA-44, D-2 v; marker count held, H-2) | N/A |
| Marker expired, for another account, or bad signature | email waiting | treated as no marker (V-1) | `signin_wait` |
| Complete, correct | ticket, success, account active with the same hash | attempt removed from address count, email count cleared, presented session ended, new session hash stored | N/A |
| Complete, stand-in ticket | ticket marked stand-in, outcome success | no session; counts stay raised (A-1, E-4) | `signin_failed` |
| Complete, account changed | account made inactive or its hash replaced between the two calls | no session (E-22) | `signin_failed` |
| Complete, wrong | ticket, failure | counts stay raised; no session | N/A |
| Ticket missing, reused or expired | complete | nothing written (lifetime and code held, H-7) | per H-7 |
| Simultaneous | 25 attempts, one email, no marker | 5 tickets, 20 waits | `signin_wait` |
| Restart | counts raised, identifier read, object restarted | counts, waits and identifier unchanged | N/A |
| Public address changed | settings row updated | identifier unchanged (V-11) | N/A |
| Many emails | 1,000 distinct email rows | one attempt's work unchanged; expired rows pruned in bounded steps (A-14) | N/A |
| Session read | presented cookies, `now` | the one named with this identifier: account id, name, signed-in time; refused at or after 30 days, accepted just before (D-4, V-18); last-use write per D-4's assumption (held, H-5) | `not_signed_in` (reply shape held, H-1) |
| Set-up open | no users | session read reports no installation name (E-11); attempts take the stand-in path | N/A |
| End session | token hash | row removed; later read finds none | N/A |
| Hash queue | two verifies and one set-up hash at once | peak active count 1; the set-up hash waits its turn (A-12, V-7; bound and timeout held, H-7) | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/setup.ts` -- reuse `normaliseEmail`, `normalisePassword`, `EMAIL_MAX`.
- `site-studio/shared/refusal.ts` -- add `signin_failed`, `signin_wait` (fixed message, `retryAfterSeconds`), `not_signed_in`.
- `site-studio/server/auth/password.ts` -- `verifyPassword`, `hashPassword`; add the stand-in and the queue.
- `site-studio/server/installation/setupStore.ts` -- pattern for tables, waits, tickets, `parseOperationInput`; `users` and `settings` read, not changed. Do not copy `deleteClearedAddresses` (lines 255–266).
- `site-studio/server/installation/Installation.ts` -- register the new ops beside the set-up ones.
- `site-studio/server-tests/setup-store.test.ts`, `helpers.ts` -- test patterns (`runInDurableObject`, restart, `Promise.all`, injected `now`).

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/shared/signin.ts` -- input schema (email ≤ 254 code points after `normaliseEmail`; password ≤ 1,024 UTF-16 units before normalisation), limits, wait functions -- standing rule 6.
- [ ] `site-studio/shared/refusal.ts` -- three codes; `signin_failed` "That email and password do not match."; `signin_wait` "Too many attempts. Wait before trying again." (A-19).
- [ ] `site-studio/server/auth/session.ts` -- token (≥ 32 random bytes), SHA-256, session and clearing cookie lines (D-1, D-4, E-15).
- [ ] `site-studio/server/auth/marker.ts` -- marker cookie line `__Host-<prefix>-m-<id>`, account id and expiry, HMAC-SHA-256 under the object's key, 1 year, renewed at sign-in (D-3, A-5).
- [ ] `site-studio/server/auth/password.ts` -- random stand-in; one-at-a-time queue for hashing and verifying, set-up included, with an active count for tests (D-5).
- [ ] `site-studio/server/installation/signInStore.ts`, `Installation.ts` -- tables (sessions, email-key failures, address failures, tickets, identity with the marker and email-key keys), indexed times, bounded pruning; ops `signInAttempt`, `completeSignIn`, `sessionInfo`, `endSession`, each taking `now`.
- [ ] `site-studio/server-tests/signin-rules.test.ts`, `signin-store.test.ts`, `session-token.test.ts`, `hash-queue.test.ts` -- matrix rows.

**Acceptance Criteria:**
- Given a completed sign-in, when the sessions table is read, then it holds a 64-hex token hash and no token.
- Given two completed sign-ins, then their tokens differ (CA-47).
- Given the installation object's registered operations, when each runs with fixture input and the sessions table is compared before and after, then only `completeSignIn`, `endSession`, the bounded pruning and `sessionInfo`'s last-use write change it (CAP-11, A-4, V-13).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
