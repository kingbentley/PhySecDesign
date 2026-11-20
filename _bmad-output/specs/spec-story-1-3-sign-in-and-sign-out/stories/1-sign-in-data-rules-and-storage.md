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

> **Not ready for development.** Kevin's decisions D-1 to D-5 in SPEC.md are frozen and the values below follow them; the spec awaits an adversarial review before it is marked ready.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.2 left users with password hashes but nowhere to keep sessions, no sign-in failure counts, no installation identifier for the cookie name, no marker key and no stand-in hash.

**Approach:** Add the sign-in rules once in `shared/`, session tokens, the marker and the stand-in hash in `server/auth/`, and to the installation object a sign-in store with its tables and operations: count an attempt before its check (or refuse with a wait), complete it (lower the counts on success, clear the email's count, store the session's hash), read and end sessions. Covers the storage side of CAP-3, CAP-6, CAP-7, CAP-8 and CAP-11.

## Boundaries & Constraints

**Always:**
- Exactly two object classes; new tables created if absent under data format 1 (standing rule 8). No host-specific code. Exact versions; no new dependency.
- Counts in installation-object SQLite storage, raised before any password check, in one synchronous step with the ticket.
- No token, marker, password, hash or entered email in a log, refusal or reply. Only SHA-256 of tokens and of the normalised email are stored.
- `shared/` and `server/` TypeScript; tests from before story 1.2 unchanged.

**Never:** Routes or route declarations, router or handler changes, cookies on the wire (spec 2). Pages or browser tests (spec 3). Deploys (spec 4). `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Known email, under limits | email key, address | counted for email and address; stored hash + ticket | N/A |
| Unknown or inactive email | email key, address | counted the same; stand-in signal + ticket, same shape | N/A |
| Email waiting | 5+ failures in a row, inside 60 s·2^(n−5) (max 900 s) | refused, not counted (D-2) | `signin_wait` + seconds |
| Email cleared | 15 min after its wait ended | count starts again (D-2 i) | N/A |
| Address waiting | 20+ failures in rolling 15 min, inside 60 s·2^(n−20) (max 900 s) | refused, not counted (D-2) | `signin_wait` + seconds |
| Marker valid for the email | email waiting, address not | counted per address only; ticket (CA-44, D-2 v) | N/A |
| Marker for another account or bad signature | email waiting | treated as no marker | `signin_wait` |
| Complete, correct | ticket, success | attempt removed from address count, email count cleared, session hash stored, earlier presented session ended | N/A |
| Complete, wrong | ticket, failure | counts stay raised; no session | N/A |
| Ticket missing, reused or expired | complete | nothing written | `invalid_input` or `signin_failed` |
| Simultaneous | 25 attempts, one email | 5 tickets, 20 waits | `signin_wait` |
| Restart | counts raised, object restarted | counts and waits unchanged | N/A |
| Session read | token hash | account id, name, signed-in time; last use recorded; refused 30 days after sign-in (D-4) | `not_signed_in` |
| End session | token hash | row removed; later read refused | `not_signed_in` |

</frozen-after-approval>

## Code Map

- `site-studio/shared/setup.ts` -- reuse `normaliseEmail`, `normalisePassword`, `emailField` limits.
- `site-studio/shared/refusal.ts` -- add `signin_failed`, `signin_wait`, `not_signed_in`.
- `site-studio/server/auth/password.ts` -- `verifyPassword`; add the stand-in hash and the hash queue (D-5).
- `site-studio/server/installation/setupStore.ts` -- pattern for tables, waits, tickets, `parseOperationInput`; `users` and `settings` tables are read, not changed.
- `site-studio/server/installation/Installation.ts` -- register the new ops beside the set-up ones.
- `site-studio/server-tests/setup-store.test.ts`, `helpers.ts` -- test patterns (`runInDurableObject`, restart, `Promise.all`).

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/shared/signin.ts` -- sign-in input schema (present and bounded only), limits, wait functions -- standing rule 6.
- [ ] `site-studio/shared/refusal.ts` -- three codes; `signin_failed` wording "That email and password do not match."; `signin_wait` wording "Too many attempts. Wait ‹duration› before trying again." (D-8).
- [ ] `site-studio/server/auth/session.ts` -- token (≥32 random bytes), SHA-256, cookie name from the installation's random identifier (D-1), `Max-Age` 30 days (D-4).
- [ ] `site-studio/server/auth/marker.ts` -- account id and expiry, HMAC-SHA-256 under the object's key, 1 year, renewed at sign-in (D-3).
- [ ] `site-studio/server/auth/password.ts` -- stand-in hash with current parameters; one-at-a-time queue for hashing and verifying, set-up included (D-5).
- [ ] `site-studio/server/installation/signInStore.ts`, `Installation.ts` -- tables (sessions, failures by email key, failures by address, identity, marker key); ops `installationIdentity`, `signInAttempt`, `completeSignIn`, `sessionInfo`, `endSession`.
- [ ] `site-studio/server-tests/signin-rules.test.ts`, `signin-store.test.ts`, `session-token.test.ts` -- matrix rows, restart, simultaneity, CAP-11.

**Acceptance Criteria:**
- Given a completed sign-in, when the sessions table is read, then it holds a 64-hex token hash and no token.
- Given two completed sign-ins, then their tokens differ (CA-47).
- Given any operation other than sign-in completion and ending a session, then the sessions table is unchanged (CAP-11).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
