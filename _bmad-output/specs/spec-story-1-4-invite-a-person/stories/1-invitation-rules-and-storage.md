---
title: 'Story 1.4, spec 1: Invitation rules and storage'
type: 'feature'
created: '2026-11-21'
status: 'done'
route: 'dispatch'
baseline_commit: '802424cdc404d8f23f28e238c43dad759133016a'
review_loop_iteration: 0
story_key: '1-4-invite-a-person'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> Builds to Kevin's decisions D-3, D-4, D-6, D-9, D-10 and D-11 (the refusal wordings) in SPEC.md. Amended on 2026-11-21 after the spec review (`review-spec.md`), with Kevin's agreement ("Apply all 29"); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The installation object has users and sessions but nowhere to keep invitations, no rule for who may invite, and no way to create an account other than set-up.

**Approach:** Add the invitation rules once in `shared/`, the four new refusals, and to the installation object an invitation store: create an invitation for a signed-in administrator (refusing an email with an account, replacing a pending one, returning the secret once), read one by the secret's hash, accept one in a single transaction that creates the account and starts its session, and prune expired rows. Covers the storage side of CAP-1, CAP-2, CAP-5, CAP-6, CAP-7 and CAP-8, and `role` in `SessionInfo` (CAP-9).

## Boundaries & Constraints

**Always:**
- Exactly two object classes; new table created if absent under data format 1 (standing rule 8). No host-specific code. Exact versions; no new dependency.
- Secret: 32 bytes from `crypto.getRandomValues`, base64url without padding (43 characters), generated in `createInvitation` and returned once; only its SHA-256 (64 hex) stored (CA-55).
- At most one invitation row per email (`UNIQUE`). Creating an invitation deletes any row for the email, live or expired, before inserting, in one transaction (CA-10; review finding 12). A used invitation's row is deleted when it is used (D-3).
- Expiry = issue time + 7 days (CA-09), indexed; expired rows pruned in bounded steps (at most 20 per call) in `createInvitation` and `acceptInvitation`, never in `invitationInfo`.
- `createInvitation` identifies the inviter from this installation's session cookie as `sessionInfo` does, in the same synchronous step as the write: no live session → `not_signed_in`; an inactive account's session is no live session, so it is `not_signed_in` too, as in `sessionInfo`; an active account that is not `administrator` → `administrator_only` (D-6; review finding 9).
- An email that matches any `users.email` (after `normaliseEmail`, story 1.3's D-15) → `invitation_email_taken`, field `email`, at invite and again at accept.
- `acceptInvitation` takes the secret's hash, the name, the Worker's password hash and the presented cookies; its hash input reuses `createFirstAdministratorInput`'s `passwordHash` schema, which pins the scrypt parameters (review finding 10). In one synchronous transaction: the invitation is live, its email is free, the user is inserted with the invitation's email and role and the given name and hash (story 1.2's columns), the invitation row is deleted, the presented session (this installation's name only) is ended, the new session's hash stored with sign-in and last-use time = now. Returns the session token, the marker for the new account (a fresh marker id) and the identifier (D-4).
- Store operations take `now`. No secret, password, hash or token in a log, refusal or diagnostic.
- `shared/` and `server/` TypeScript; tests from before story 1.2 unchanged.

**Never:** Routes, route declarations, handlers or the router (spec 2). Pages or browser tests (spec 3). `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Administrator invites | live admin session; new email; name; role | row: secret hash, email, name, role, inviter id, issued, expires = now + 7 d; returns secret (43 chars), expiry, public address | N/A |
| Standard user invites | live session of an active `standard` account | nothing written | `administrator_only` |
| Inactive inviter | session of an account with `active = 0` (set directly) | nothing written (review finding 9) | `not_signed_in` |
| No session | no, ended, expired, unknown or foreign-named cookie | nothing written | `not_signed_in` |
| Email has an account | email equal to a user's after trim and lower case | nothing written | `invitation_email_taken`, field `email` |
| Email differs only in Unicode form | NFC vs NFD of a user's email | not equal (story 1.3's D-15); invitation created | N/A |
| Re-invite pending email | unused invitation for the email | earlier row gone; earlier hash reads unusable; new hash reads live | N/A |
| Re-invite after expiry | the email's earlier invitation expired and was not pruned | the new one is created (review finding 12) | N/A |
| Read live | hash of a live secret | inviter's current name, installation name, email, suggested name, role (D-10) | N/A |
| Read live after a rename | the inviter's `users.name` changed directly after the invite | the read answers the changed name (D-10; review finding 16) | N/A |
| Read unusable | unknown, used, replaced or expired hash (at and after 7 days; live just before) | nothing written | `invitation_unusable` |
| Accept | live hash, name, hash fields, cookies | user inserted (scrypt parameters beside the hash), invitation gone, session row, token, marker, identifier | N/A |
| Accept an administrator invitation | invitation with role `administrator` | the user is an administrator; `sessionInfo` answers `role: administrator` (review finding 14) | N/A |
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
- `site-studio/server/installation/setupStore.ts` -- `users` and `settings` schema; the user insert in `createFirstAdministrator` to mirror; `createFirstAdministratorInput`'s `passwordHash` schema to reuse; `parseOperationInput`.
- `site-studio/server/installation/signInStore.ts` -- session lookup in `sessionInfo`, session and marker creation in `complete`; factor a shared "start a session" helper rather than copy it.
- `site-studio/server/installation/Installation.ts` -- register the new operations.
- `site-studio/server-tests/setup-store.test.ts`, `signin-store.test.ts`, `helpers.ts`, `signin-helpers.ts` -- patterns; pinned lists and shapes that change are listed in brownfield.md.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/invitation.ts` -- `INVITATION_TTL_MS` (7 days), `INVITATION_SECRET_LENGTH` (43), `isWellFormedInvitationSecret`, `inviteInput` (`email`, `name`, `role` in `administrator` | `standard`), `invitationSecretField` (1–256 characters), `acceptInput` = `{ secret: invitationSecretField, name: personNameField, password: passwordField }` (review finding 10), and `passwordRules(password, email)` returning the two story 1.2 rules with `met` flags, for the page's list; with an empty password neither rule is met (review finding 28) -- standing rule 6.
- [x] `site-studio/shared/refusal.ts` -- `invitation_email_taken` (409), `invitation_unusable` (410), `not_signed_in` (401), `administrator_only` (403), wording per D-11.
- [x] `site-studio/server/installation/invitationStore.ts`, `Installation.ts` -- `invitations` table with indexed `expires_at`; operations `createInvitation`, `invitationInfo` (read-only), `acceptInvitation`, each taking `now`; bounded pruning.
- [x] `site-studio/server/installation/signInStore.ts` -- shared session-start helper used by `complete` and `acceptInvitation`; `SessionInfo` signed-in branch gains `role`.
- [x] `site-studio/server-tests/invitation-rules.test.ts`, `invitation-store.test.ts` -- matrix rows; the pinned lists and shapes in `setup-store.test.ts` and `signin-store.test.ts` updated (brownfield.md).

**Acceptance Criteria:**
- Given an invitation created at `t`, when it is read at `t + 7 d − 1 ms` it is live, and at `t + 7 d` it is `invitation_unusable` (criterion 15, CA-09).
- Given a created invitation, the returned secret is 43 base64url characters (32 bytes), and the invitations table holds its 64-hex SHA-256 and no column equal to the secret (criterion 7, building block).
- Given an accepted invitation, a second accept with the same hash is refused; given two accepts at once, exactly one user and one session exist (criterion 10).
- Given a pending invitation for an email, inviting that email again makes the earlier hash `invitation_unusable` and the new one live (criterion 13, CA-10).
- Given each registered operation run with fixture input, comparing the invitations table before and after shows that only `createInvitation`, `acceptInvitation` and the bounded pruning change it; `invitationInfo` changes nothing (criterion 16, standing rule 9).
- Given each registered operation, only `createFirstAdministrator` and `acceptInvitation` insert into `users` (criterion 8, building block).
- Given an active `standard` account's live session, `createInvitation` is refused `administrator_only` and writes nothing (criterion 14, building block).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Review Triage Log

Review of 2026-11-21 (bmad-build step 4, loop 0): Blind Hunter (B), Edge Case Hunter (E) and Verification Gap (V) on the diff from `802424c`. Verification Gap found no gaps. No intent_gap or bad_spec entry, so no loopback; nothing deferred.

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| E1, B1 | `acceptInvitation` writes through `SignInStore.exec` without resetting `work`, so `lastWork()` after an accept mixes the last sign-in's work with the accept's | low | True, but `lastWork()` is documented and used only for the bounded-work test of attempts and completions; nothing reads it after an accept, and a fix needs a new reset path | rejected (low, not met in use; fix adds surface) |
| E2, B3 | Invitations of an inviter later deactivated or demoted stay readable and acceptable | false | SPEC.md Assumptions: "the invitation stays usable if the inviter later changes (deactivation's effect on invitations is story 1.10)" | rejected |
| E3 | The fresh-marker test presents a marker with a made-up signature, so it could not catch reuse of a valid presented marker's id | low | Real: an unsigned marker would be discarded by any correct reader; fix is test-only | patch: the test presents a validly signed marker |
| V1, B10 | `InvitationStore.rows()` has no caller | low | Searched; tests read the table with SQL | patch: deleted |
| B2 | Accepting starts a session but does not prune expired sessions | false | Story 1.3 (A-14, `signInStore.ts` header) prunes sessions "during attempts and completions only"; the spec asks accept to prune invitations, which it does | rejected |
| B4 | `invitationInfo` answers live when an account with the email appeared after the invite | low | Unreachable in the product: users are inserted only by set-up (before any invitation) and by accepting the one invitation row for that email; only a test-only insert reaches it, and accept refuses it (matrix row) | rejected (not met in use) |
| B5 | The password-not-email rule is not held by the object | false | SPEC.md Assumptions put the check in the Worker's accept handler after the invitation read (spec 2); the object never sees the password | rejected |
| B6 | `invitationInfo` answers a broken invariant (no inviter or settings row) as `invitation_unusable` | low | Real; inconsistent with `createInvitation`'s plain error | patch: plain Error |
| B7 | A test's comment says "many expired invitations" but sets up one live one | low | Real | patch: test set-up/comment aligned |
| B8 | The pruning test's "oldest expiries go first" is never checked | low | Real: asserted only after all expired rows are gone | patch: survivors checked after the first create |
| B9 | The Unicode-form tests rely on NFD literals surviving editors | low | Real (bytes checked: NFD present today) | patch: escapes and an nfc !== nfd assertion |
| B11 | `acceptInvitation`'s role check is unreachable and differs from `invitationInfo` | low | The table's `CHECK (role IN (...))` guarantees the value | patch: check deleted |
| B12 | The task list omits `setupStore.ts` | — | Fix edits this build's spec; the Code Map already names `setupStore.ts` for the shared insert and hash schema | rejected (spec edit) |
| B13 | The spec records no verification evidence | — | Fix edits this build's spec; verification is recorded in the commit report | rejected (spec edit) |
| B14 | Secret byte count (32) and length (43) are defined separately | low | Both are tested to agree (`create` test decodes the secret to 32 bytes; rules test pins 43); a derivation adds nothing users meet | rejected (low) |
| B15 | Nothing caps pending invitations | low | Only a live administrator session can create rows, one per email; listing and cancelling are stories 1.10/1.11; a cap is added complexity the intent does not ask for | rejected (low) |

Patches applied by the implementation subagent (E3, V1/B10, B6, B7, B8, B11) and, for B9, by the build session after the subagent left the raw NFD literals in place. Full verification re-run afterwards: `npm test` 160 passed, `npm run typecheck` clean, `npm run test:server` 25 files and 305 tests passed, `npm run build` passed, `npm run test:sites` 4 passed, `npm run smoke:selfhost` passed. `sprint-status.yaml` was not synced (out of this build's scope).

## Matrix and acceptance tests

Tests are in `site-studio/server-tests/invitation-store.test.ts` (S) and `invitation-rules.test.ts` (R), named by their `describe` › `it`.

| Matrix row | Test |
|---|---|
| Administrator invites | S: creating an invitation › for a signed-in administrator stores the secret's hash, email, name, role, inviter, issue and expiry, and answers the secret once |
| Standard user invites | S: creating an invitation › for an active standard account's live session is refused administrator_only and writes nothing |
| Inactive inviter | S: creating an invitation › for an inactive administrator's session is refused not_signed_in and writes nothing |
| No session | S: creating an invitation › with no live session is refused not_signed_in and writes nothing |
| Email has an account | S: creating an invitation › for an email with an account, after trim and lower case, is refused invitation_email_taken … |
| Email differs only in Unicode form | S: creating an invitation › for an email differing … only in Unicode form is created; R: the invite input › does not normalise the email's Unicode form |
| Re-invite pending email | S: creating an invitation › for an email with a pending invitation replaces it … |
| Re-invite after expiry | S: creating an invitation › for an email whose earlier invitation expired and was not pruned is created |
| Read live | S: reading an invitation › answers the inviter's current name, the installation's name, the email, the suggested name and the role |
| Read live after a rename | S: reading an invitation › answers the inviter's changed name after a rename |
| Read unusable | S: reading an invitation › is unusable for an unknown or used hash …; › is live just before 7 days and unusable at and after 7 days; creating › … replaces it (replaced hash) |
| Accept | S: accepting an invitation › inserts the account with the invitation's email and role … and starts a session |
| Accept an administrator invitation | S: accepting an invitation › of an administrator invitation makes an administrator … |
| Accept twice | S: accepting an invitation › twice with the same hash is refused the second time and writes nothing |
| Accept at once | S: accepting an invitation › twice at once creates one account and one session; the other is refused |
| Accept while signed in | S: accepting an invitation › while signed in as another account ends that session and starts one for the new account, with a fresh marker |
| Accept, email taken meanwhile | S: accepting an invitation › is refused invitation_email_taken when an account with the email appeared meanwhile |
| Many expired rows | S: pruning expired invitations › removes at most 20 expired rows per create or accept, and none per read |
| Restart | S: a restart › leaves an invitation live with the same expiry |
| Session info | S: accepting an invitation › inserts the account … (session read with `role`); `signin-store.test.ts` session read test (`role: "administrator"`) |

| Acceptance criterion | Test |
|---|---|
| 7-day boundary (criterion 15) | S: reading an invitation › is live just before 7 days and unusable at and after 7 days |
| 43-character secret, hash only (criterion 7) | S: creating an invitation › for a signed-in administrator … |
| Single use, concurrent accepts (criterion 10) | S: accepting › twice with the same hash …; › twice at once … |
| Re-invite replaces (criterion 13) | S: creating › for an email with a pending invitation replaces it … |
| Only create, accept and pruning change invitations (criterion 16) | S: the installation object's operations › change the invitations table only in createInvitation and acceptInvitation, and insert into users only in createFirstAdministrator and acceptInvitation |
| Only set-up and accept insert users (criterion 8) | same test as criterion 16 |
| Standard user refused (criterion 14) | S: creating › for an active standard account's live session is refused administrator_only and writes nothing |
