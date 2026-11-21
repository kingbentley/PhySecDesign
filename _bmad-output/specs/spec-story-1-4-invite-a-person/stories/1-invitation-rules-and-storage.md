---
title: 'Story 1.4, spec 1: Invitation rules and storage'
type: 'feature'
created: '2026-11-21'
status: 'ready-for-dev'
route: 'dispatch'
baseline_commit: ''
review_loop_iteration: 0
story_key: '1-4-invite-a-person'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> Builds to Kevin's decisions D-3, D-4, D-6, D-9, D-10 and D-11 (the refusal wordings) in SPEC.md.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The installation object has users and sessions but nowhere to keep invitations, no rule for who may invite, and no way to create an account other than set-up.

**Approach:** Add the invitation rules once in `shared/`, the four new refusals, and to the installation object an invitation store: create an invitation for a signed-in administrator (refusing an email with an account, replacing a pending one, returning the secret once), read one by the secret's hash, accept one in a single transaction that creates the account and starts its session, and prune expired rows. Covers the storage side of CAP-1, CAP-2, CAP-5, CAP-6, CAP-7 and CAP-8, and `role` in `SessionInfo` (CAP-9).

## Boundaries & Constraints

**Always:**
- Exactly two object classes; new table created if absent under data format 1 (standing rule 8). No host-specific code. Exact versions; no new dependency.
- Secret: 32 bytes from `crypto.getRandomValues`, base64url without padding (43 characters), generated in `createInvitation` and returned once; only its SHA-256 (64 hex) stored (CA-55).
- At most one invitation row per email (`UNIQUE`); a re-invite deletes the earlier row and inserts the new one in one transaction (CA-10). A used invitation's row is deleted when it is used (D-3).
- Expiry = issue time + 7 days (CA-09), indexed; expired rows pruned in bounded steps (at most 20 per call) in `createInvitation` and `acceptInvitation`, never in `invitationInfo`.
- `createInvitation` identifies the inviter from this installation's session cookie as `sessionInfo` does, in the same synchronous step as the write: no live session → `not_signed_in`; account not active or not `administrator` → `administrator_only` (D-6).
- An email that matches any `users.email` (after `normaliseEmail`, story 1.3's D-15) → `invitation_email_taken`, field `email`, at invite and again at accept.
- `acceptInvitation` takes the secret's hash, the name, the Worker's password hash and the presented cookies. In one synchronous transaction: the invitation is live, its email is free, the user is inserted with the invitation's email and role and the given name and hash (story 1.2's columns), the invitation row is deleted, the presented session (this installation's name only) is ended, the new session's hash stored with sign-in and last-use time = now. Returns the session token, the marker for the new account (a fresh marker id) and the identifier (D-4).
- Store operations take `now`. No secret, password, hash or token in a log, refusal or diagnostic.
- `shared/` and `server/` TypeScript; tests from before story 1.2 unchanged.

**Never:** Routes, route declarations, handlers or the router (spec 2). Pages or browser tests (spec 3). `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Administrator invites | live admin session; new email; name; role | row: secret hash, email, name, role, inviter id, issued, expires = now + 7 d; returns secret (43 chars), expiry, public address | N/A |
| Standard user invites | live session of a `standard` account | nothing written | `administrator_only` |
| No session | no, ended, expired, unknown or foreign-named cookie | nothing written | `not_signed_in` |
| Email has an account | email equal to a user's after trim and lower case | nothing written | `invitation_email_taken`, field `email` |
| Email differs only in Unicode form | NFC vs NFD of a user's email | not equal (story 1.3's D-15); invitation created | N/A |
| Re-invite pending email | unused invitation for the email | earlier row gone; earlier hash reads unusable; new hash reads live | N/A |
| Read live | hash of a live secret | inviter's current name, installation name, email, suggested name, role (D-10) | N/A |
| Read unusable | unknown, used, replaced or expired hash (at and after 7 days; live just before) | nothing written | `invitation_unusable` |
| Accept | live hash, name, hash fields, cookies | user inserted (scrypt parameters beside the hash), invitation gone, session row, token, marker, identifier | N/A |
| Accept twice | same hash after success | nothing written | `invitation_unusable` |
| Accept at once | two accepts for one hash, `Promise.all` | one account, one session; the other refused | `invitation_unusable` |
| Accept while signed in | presented live session of another account | that session ended; new session for the new account | N/A |
| Accept, email taken meanwhile | a user with the email inserted between read and accept (test-only insert) | nothing written | `invitation_email_taken` |
| Many expired rows | 50 expired invitations | each create or accept removes at most 20; `invitationInfo` removes none | N/A |
| Restart | invitation created, object restarted | still live with the same expiry | N/A |
| Session info | live session | adds `role` beside `account.id` and `name` | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/setup.ts` -- reuse `emailField`, `normaliseEmail`, `personNameField`, `passwordField`, `passwordEqualsEmail`, `PASSWORD_MIN`, `PASSWORD_MAX`.
- `site-studio/shared/refusal.ts` -- add the four refusals.
- `site-studio/server/installation/setupStore.ts` -- `users` and `settings` schema; the user insert in `createFirstAdministrator` to mirror; `parseOperationInput`.
- `site-studio/server/installation/signInStore.ts` -- session lookup in `sessionInfo`, session and marker creation in `complete`; factor a shared "start a session" helper rather than copy it.
- `site-studio/server/installation/Installation.ts` -- register the new operations.
- `site-studio/server-tests/setup-store.test.ts`, `signin-store.test.ts`, `helpers.ts`, `signin-helpers.ts` -- patterns; two pinned lists change (brownfield.md).

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/shared/invitation.ts` -- `INVITATION_TTL_MS` (7 days), `INVITATION_SECRET_LENGTH` (43), `isWellFormedInvitationSecret`, `inviteInput` (`email`, `name`, `role` in `administrator` | `standard`), `invitationSecretField` (1–256 characters), `acceptInput` (`secret`, `name`, `password`), and `passwordRules(password, email)` returning the two story 1.2 rules with `met` flags, for the page's list -- standing rule 6.
- [ ] `site-studio/shared/refusal.ts` -- `invitation_email_taken` (409), `invitation_unusable` (410), `not_signed_in` (401), `administrator_only` (403), wording per D-11.
- [ ] `site-studio/server/installation/invitationStore.ts`, `Installation.ts` -- `invitations` table with indexed `expires_at`; operations `createInvitation`, `invitationInfo` (read-only), `acceptInvitation`, each taking `now`; bounded pruning.
- [ ] `site-studio/server/installation/signInStore.ts` -- shared session-start helper used by `complete` and `acceptInvitation`; `SessionInfo` signed-in branch gains `role`.
- [ ] `site-studio/server-tests/invitation-rules.test.ts`, `invitation-store.test.ts` -- matrix rows; `setup-store.test.ts` and `signin-store.test.ts` pinned lists updated (brownfield.md).

**Acceptance Criteria:**
- Given an invitation created at `t`, when it is read at `t + 7 d − 1 ms` it is live, and at `t + 7 d` it is `invitation_unusable` (criterion 15, CA-09).
- Given a created invitation, the returned secret is 43 base64url characters (32 bytes), and the invitations table holds its 64-hex SHA-256 and no column equal to the secret (criterion 7, building block).
- Given an accepted invitation, a second accept with the same hash is refused; given two accepts at once, exactly one user and one session exist (criterion 10).
- Given a pending invitation for an email, inviting that email again makes the earlier hash `invitation_unusable` and the new one live (criterion 13, CA-10).
- Given each registered operation run with fixture input, comparing the invitations table before and after shows that only `createInvitation`, `acceptInvitation` and the bounded pruning change it; `invitationInfo` changes nothing (criterion 16, standing rule 9).
- Given each registered operation, only `createFirstAdministrator` and `acceptInvitation` insert into `users` (criterion 8, building block).
- Given a `standard` account's live session, `createInvitation` is refused `administrator_only` and writes nothing (criterion 14, building block).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
