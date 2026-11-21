---
title: 'Story 1.4, spec 2: Invitation routes and the page header'
type: 'feature'
created: '2026-11-21'
status: 'done'
route: 'dispatch'
baseline_commit: 'aec7866d716c2e5a93a3f29acbda42bd0d222abb'
review_loop_iteration: 0
story_key: '1-4-invite-a-person'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/stories/1-invitation-rules-and-storage.md'
---

> Runs after spec 1. Builds to Kevin's decisions D-1, D-2, D-4, D-5 and D-6 in SPEC.md. Amended on 2026-11-21 after the spec review (`review-spec.md`), with Kevin's agreement ("Apply all 29"); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spec 1's operations are not reachable: there is no route to invite, read or accept an invitation, the session reply cannot tell the page the account's role or identity, and no page is yet served with `Referrer-Policy: no-referrer` (review finding 22).

**Approach:** Declare and handle three routes, build the link on the public address, hash the accepted password through the queue, set the session and marker cookies on acceptance, extend the session reply, and add `Referrer-Policy: no-referrer` to the `/invite` page. Covers CAP-6 and the server side of CAP-1, CAP-2, CAP-3, CAP-4, CAP-7 and CAP-9.

## Boundaries & Constraints

**Always:**
- Routes (D-1: the secret only ever in a JSON body):
  - `POST /api/v1/invitations` (`invite`): input `inviteInput`; reply `{ link, expiresAt }`, where `link` = recorded public address + `/invite#` + secret, and `expiresAt` is ISO 8601 UTC. `appOriginOnly`, `readsSessionCookie`.
  - `POST /api/v1/invitations/read` (`invitationRead`): input `{ secret }`; reply `{ inviterName, installationName, email, name, role }`. `appOriginOnly`; reads no cookie.
  - `POST /api/v1/invitations/accept` (`acceptInvite`; the object operation it calls stays `acceptInvitation`, review finding 6): input `acceptInput`; reply `{ name }`. `appOriginOnly`, `readsSessionCookie`.
- A secret that is not 43 base64url characters is answered `invitation_unusable` without an object call. Otherwise the Worker passes `sha256Hex(secret)`, never the secret.
- Accept order: `hashQueue.hasRoom()` else `signin_busy`; the read (idempotent, retried once after a bare reset); `passwordEqualsEmail(password, invitation email)` → `invalid_input`, field `password`; `hashPassword(password, signal)`, with `HashQueueBusy` or an aborted signal → `signin_busy`; `acceptInvitation`, never retried after a bare reset; reply sets `sessionCookieLine` and `markerCookieLine` (D-4). `createInvitation` is never retried after a bare reset either.
- `sessionReply`'s signed-in branch gains `accountId` (string) and `role` (`administrator` | `standard`) (D-5). `signInReply` stays `{ name }` (story 1.3's V-10 pins its shape); the page reads the session after signing in (spec 3).
- `Referrer-Policy: no-referrer` is added in `handleRequest`/`route` (`server/index.ts`) by request path (`/invite`, `/invite/`), on every response for that path, whichever `serveAsset` branch answered, on both hosts; no other page changes (D-2; review finding 5).
- No secret, password or hash in any `console` call; the invite reply is the only reply that holds the secret.

**Never:** Pages, `src/` or browser tests (spec 3). Changes to set-up or sign-in behaviour beyond the two reply fields. Deploys. `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Invite | admin cookie, app origin and header | 200 `{ link, expiresAt }`; link origin = recorded public address even when the request's host differs | N/A |
| Invite, wrong origin or no header | admin cookie | refused before the body is read | `origin_refused` |
| Invite, standard user / no session | cookie of a `standard` account / none | 403 / 401 | `administrator_only` / `not_signed_in` |
| Invite, email taken | email of an account, other letter case | 409, field `email`, no value repeated | `invitation_email_taken` |
| Invite, bad input | email not passing `emailField`, empty name, unknown role | 400 with the field | `invalid_input` |
| Read | well-formed live secret | 200 with inviter, installation, email, name, role | N/A |
| Read, malformed or unusable | 10 characters; used; replaced | 410, no object call for the malformed one | `invitation_unusable` |
| Accept | live secret, valid name and password, app origin | 200 `{ name }`; session and marker `Set-Cookie`; session read then names the new account with its `accountId` and `role` | N/A |
| Accept with an edited name | name different from the invitation's | the session read answers the edited name (D-7; review finding 13) | N/A |
| Accept, password rules | 11 characters; equal to the email in another case | 400, field `password`; invitation still live | `invalid_input` |
| Accept, wrong origin or no header | otherwise valid | refused; invitation still live | `origin_refused` |
| Accept, full queue | 1 running and 20 waiting | 503 with `Retry-After: 5`; invitation still live (review finding 22) | `signin_busy` |
| Accept, aborted while queued | the request signal aborts while the accept waits in the queue | the queue's waiting count falls back; invitation still live (review finding 15) | `signin_busy` |
| Accept while signed in | admin cookie presented | admin's session ended; reply sets the new account's cookies | N/A |
| Accept, bare reset on `acceptInvitation` | injected reset | not retried | `internal_error` or `updating` as `callObject` answers |
| `/invite` page | `GET /invite`, `GET /invite/`, `Accept: text/html`, against an SPA-style `ASSETS` stub (200 `index.html`) and a disk-style one (404, then `index.html`) | `index.html` with `Referrer-Policy: no-referrer` in both; `GET /` has no such header (review finding 5) | N/A |
| Logs | invite, read, accept, refused accept with `console` watched | no secret, password or hash in any line | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/routes.ts` -- declarations and reply schemas; `sessionReply`, `signInReply`.
- `site-studio/server/api/handlers.ts` -- handlers; `busyOrGone`, `installation(env)`; `session` adds the two fields.
- `site-studio/server/api/router.ts` -- unchanged unless a test shows a gap.
- `site-studio/server/index.ts` -- `handleRequest` and `route`, where the `/invite` header is added around `serveAsset` (`server/assets.ts`).
- `site-studio/server/auth/session.ts`, `marker.ts`, `password.ts` -- cookie lines, `sha256Hex`, the queue.
- `site-studio/server-tests/signin-routes.test.ts`, `signin-retry.test.ts`, `signin-declarations.test.ts`, `signin-helpers.ts`, `api.test.ts`, `worker-first.test.ts` -- route test patterns, bare-reset injection, the V-12 sweep and its pinned list (brownfield.md), `ASSETS` stubs.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/routes.ts` -- three declarations; reply schemas; `sessionReply` fields.
- [x] `site-studio/server/api/handlers.ts` -- `invite`, `invitationRead`, `acceptInvite`; `session` returns `accountId` and `role`.
- [x] `site-studio/server/index.ts` -- `Referrer-Policy: no-referrer` for `/invite` and `/invite/`, by path, on every response.
- [x] `site-studio/server-tests/invitation-routes.test.ts` -- matrix rows; the log watch; the route sweep.
- [x] `site-studio/server-tests/invitation-retry.test.ts` -- bare reset: `invitationRead` retried once, `createInvitation` and `acceptInvitation` not.
- [x] `site-studio/server-tests/signin-declarations.test.ts` -- the pinned list of cookie-reading routes gains `["acceptInvite","POST"]` and `["invite","POST"]`, and its test is renamed to match; the sweep itself passes unchanged (review finding 1). The other existing tests whose shapes change are listed in brownfield.md.

**Acceptance Criteria:**
- Given a live invitation and the app's origin and header, when it is accepted, then the reply sets this installation's `__Host-` session cookie and marker for the new account, the session read then answers `signedIn: true` with the name entered on acceptance (different from the invitation's), its `accountId` and `role`, and a session cookie the browser presented before is no longer signed in (criterion 4; review finding 13).
- Given an accepted invitation, the users row holds `scrypt`, N = 131,072, r = 8, p = 1, key length 32 and a salt and hash, `verifyPassword` accepts the password, and `POST /api/v1/session/sign-in` with the email and password succeeds (criterion 6).
- Given a route sweep that calls every route in `ROUTE_LIST` with valid input, signed in as an administrator where a cookie is read, with `callObject`'s operation names recorded, then only `setup` calls `createFirstAdministrator`, only `acceptInvite` calls `acceptInvitation`, and the `users` row count changes only for those two (criterion 8; review finding 6).
- Given an accept request with another `Origin`, or without the app's header, it is refused `origin_refused` and the invitation stays live (criterion 9).
- Given an email that has an account, `POST /api/v1/invitations` answers 409 `invitation_email_taken` with field `email` and the agreed wording (criterion 12, CA-10).
- Given a standard user's session, `POST /api/v1/invitations` answers 403 `administrator_only` (criterion 14, building block).
- Given a request whose `Host` and `Origin` differ from the recorded public address, the invite reply's `link` starts with the recorded address + `/invite#` (CA-57, AD-12; review finding 17).
- Given `console` watched over invite, read, accept and a refused accept, no line contains the secret, the password or its hash (criterion 7, building block); `GET /invite` and `GET /invite/` carry `Referrer-Policy: no-referrer` with both `ASSETS` stubs (CAP-2).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Review Triage Log

Review of 2026-11-21 (bmad-build step 4, loop 0): Blind Hunter (B), Edge Case Hunter (E) and Verification Gap (V) on the diff from `aec7866` (code and tests only). Before the review, the build session reverted an edit the implementation subagent had made to `site-studio/deploy/selfhost/smoke.mjs` (a `GET /invite` header check): spec 3's Execution list and Verification own that check. No intent_gap or bad_spec entry, so no loopback; nothing deferred.

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| V1, B1 | No test resets the accept route's own `invitationInfo` read; dropping its `idempotent` flag would pass every test | medium | Verified: the read retry test sends only `invitationRead`; the accept retry test resets `acceptInvitation` | patch: retry test on the accept's read (200, cookies set, `invitationInfo` twice, `acceptInvitation` once) |
| B2 | The `updating` outcome of a version-stop reset is untested on the three operations | false | The handlers return `callObject`'s answer unchanged; its mapping of a shown stop to a retry or `updating` is tested in `call-retry.test.ts` ("retries a write once after a shown version stop…", "…then answers updating") | rejected |
| B3 | No test shows a second reset on the read is not retried | false | The retry bound is `callObject`'s, tested in `call-retry.test.ts` ("retries an idempotent read once after a bare reset, then answers updating") | rejected |
| B4 | After a failed accept whose write committed, nothing shows the person can still sign in | low | Real; fix is one assertion | patch: the `acceptInvitation` reset test signs in with the new password |
| B5 | The log watch skips the 500 path and refused invites | low | The only request-failure log (`server/index.ts` `route`) writes the event, path and `error.message`, never the body; the router's one log names the route only; the watch covers the matrix row's invite, read, accept and refused accept | rejected (low; no path logs input) |
| B6 | The log watch omits the session token, marker and the administrator's cookie values | low | Real; values are at hand in the test | patch: accept's `Set-Cookie` values and the administrator's cookies added to the forbidden list |
| B7 | The read route's origin cases are thinner than invite's | low | The origin rule is the router's, applied by declaration (`appOriginOnly`); `signin-declarations.test.ts`'s sweep fails any unguarded declared route; read's "another Origin" case passes | rejected (low) |
| B8 | No route test of expired invitations, or of accept with a replaced secret | low | Expiry and replacement are spec 1's store rules, tested in `invitation-store.test.ts`; the routes map every unusable read to the same 410 tested here for used and replaced secrets | rejected (low) |
| B9 | A secret over 256 characters answers 400 `invalid_input`, not 410 `invitation_unusable` | low | Real: `invitationSecretField` (spec 1) caps input at `INVITATION_SECRET_INPUT_MAX`; no object call either way, and only a hand-made request meets it; changing it edits spec 1's schema | rejected (low; raised for Kevin in the build report) |
| B10 | `sessionReply.role` uses `INVITATION_ROLES` | low | No divergence today: the users table's `CHECK` holds the same two roles; harm is hypothetical | rejected (low) |
| B11 | `accountId` has no shape in the schema | low | The test compares it with the users row's id; the value is never parsed by the server | rejected (low) |
| B12 | The sweep does not show only `invite` reaches `createInvitation` | low | Real; one assertion | patch: `reaching("createInvitation")` is `["invite"]` |
| B13 | No test pins the invite reply as uncached | low | `server/http.ts` sets `no-store` on every JSON reply; the invite reply alone holds the secret | patch: the invite test asserts `cache-control` holds `no-store` |
| B14, E1 | `/invite/index.html`, `/Invite`, `//invite` get no `Referrer-Policy` | false | The intent fixes the paths: "by request path (`/invite`, `/invite/`) … no other page changes" (D-2); the link is always built as `<address>/invite#` | rejected (intent excludes); spec 3's page should show the invitation only at those two paths |
| B15 | The trailing-slash strip on the public address is untested; mixed-case email equality | low | The address is recorded from `URL.origin`, which never ends in `/`; the password-equals-email test already uses two other letter cases | rejected (low) |
| B16 | The spec's ticks carry no verification record; other brownfield tests not checked | — | Fix edits this build's spec; verification is recorded below and in the commit report; of brownfield's shape changes, `signin-store.test.ts` was spec 1's and `tests/signin-client.test.mjs` is spec 3's | rejected (spec edit) |
| E2 | A client that aborts after the hash but before `acceptInvitation` still gets the account made | low | Real but narrow; the person signs in with the password they chose, and an abort can equally fall during the object call, so a guard narrows the window without closing it | rejected (low; adds a guard) |

Patches applied by the implementation subagent (V1/B1, B4, B6, B12, B13), test files only. Full verification re-run by the build session afterwards: `npm test` 160 passed, `npm run typecheck` clean, `npm run build` passed, `npm run test:sites` 4 passed, `npm run smoke:selfhost` passed. `npm run test:server` failed 3 of 339 tests (in 3 files) on its first run, which shared the machine with other work; the failing names were not kept. Three further runs each passed 27 files and 339 tests. `sprint-status.yaml` was not synced (out of this build's scope).

## Matrix and acceptance tests

Tests are in `site-studio/server-tests/invitation-routes.test.ts` (R) and `invitation-retry.test.ts` (T), named by their `describe` › `it`.

| Matrix row | Test |
|---|---|
| Invite | R: POST /api/v1/invitations › for an administrator answers the link on the recorded public address and the expiry 7 days on; › builds the link on the recorded public address even when the request's Host and Origin differ (CA-57, AD-12) |
| Invite, wrong origin or no header | R: POST /api/v1/invitations › with another Origin / no Origin / no app header is refused origin_refused before the body is read |
| Invite, standard user / no session | R: POST /api/v1/invitations › for a standard user's session is refused 403 administrator_only, and with no session 401 not_signed_in (D-6) |
| Invite, email taken | R: POST /api/v1/invitations › for an email with an account, in another letter case, is refused 409 invitation_email_taken naming the field email (CA-10) |
| Invite, bad input | R: POST /api/v1/invitations › with bad input is refused 400 invalid_input naming the field |
| Read | R: POST /api/v1/invitations/read › for a live secret answers the inviter, the installation, the email, the name and the role |
| Read, malformed or unusable | R: POST /api/v1/invitations/read › for a malformed secret answers 410 invitation_unusable without an object call; › for a replaced or used secret answers 410 invitation_unusable |
| Accept | R: POST /api/v1/invitations/accept › creates the account with an edited name, sets the session and marker, and the session read names it with its accountId and role (D-4, D-5, D-7); › of an administrator invitation answers role administrator in the session read |
| Accept with an edited name | R: POST /api/v1/invitations/accept › creates the account with an edited name, … |
| Accept, password rules | R: POST /api/v1/invitations/accept › refuses a password breaking story 1.2's rules with field password, leaving the invitation live |
| Accept, wrong origin or no header | R: POST /api/v1/invitations/accept › with another Origin / no app header is refused origin_refused, leaving the invitation live (criterion 9) |
| Accept, full queue | R: POST /api/v1/invitations/accept › with a full hash queue answers 503 signin_busy with Retry-After 5, leaving the invitation live |
| Accept, aborted while queued | R: POST /api/v1/invitations/accept › aborted while waiting in the hash queue leaves the queue and answers signin_busy, leaving the invitation live |
| Accept while signed in | R: POST /api/v1/invitations/accept › while signed in as the administrator ends that session and sets the new account's cookies (D-4) |
| Accept, bare reset on `acceptInvitation` | T: a bare reset › on acceptInvitation is not retried: one call, the error reaches the client and no cookie is set (also: › on createInvitation is not retried …; › on the invitation read is retried once …; › on the accept's invitation read is retried once and the accept completes) |
| `/invite` page | R: the invitation page › is served with Referrer-Policy: no-referrer at /invite and /invite/ from an SPA-style / a disk-style ASSETS service, and / is not (D-2); › keeps the header on the HTTPS redirect of a plain HTTP request on Cloudflare |
| Logs | R: the logs (criterion 7, building block) › hold no secret, password or hash over invite, read, refused accepts and accept |

| Acceptance criterion | Test |
|---|---|
| Accepted: `__Host-` cookies, session read with the edited name, `accountId`, `role`; earlier cookie signed out (criterion 4) | R: accept › creates the account with an edited name, …; › while signed in as the administrator ends that session … |
| scrypt row, `verifyPassword`, sign-in succeeds (criterion 6) | R: accept › stores the password with scrypt as story 1.2 does, and the person then signs in with it (criterion 6) |
| Route sweep over `ROUTE_LIST`, operation names recorded (criterion 8) | R: the route sweep (criterion 8) › finds that only setup reaches createFirstAdministrator, only acceptInvite reaches acceptInvitation, and only they add users (calls every declared route with valid input, administrator cookies where a cookie is read, records `callObject` operation names and the users row count per route) |
| Accept with another Origin or no header (criterion 9) | R: accept › with another Origin / no app header is refused origin_refused, leaving the invitation live (criterion 9) |
| Email taken, 409, field, wording (criterion 12) | R: invite › for an email with an account, in another letter case, is refused 409 … |
| Standard user, 403 (criterion 14) | R: invite › for a standard user's session is refused 403 administrator_only, … |
| Link on the recorded address when Host and Origin differ (CA-57) | R: invite › builds the link on the recorded public address even when the request's Host and Origin differ |
| Logs; `/invite` header with both stubs (criterion 7, CAP-2) | R: the logs › …; the invitation page › is served with Referrer-Policy: no-referrer … (both stubs) |

Existing tests changed: `signin-declarations.test.ts` (pinned list gains `acceptInvite` and `invite`, test renamed; the sweep unchanged) and `signin-routes.test.ts` (the session read's `toEqual` gains `accountId` and `role`). `server/api/router.ts` and `server/assets.ts` were not changed: no test showed a gap.
