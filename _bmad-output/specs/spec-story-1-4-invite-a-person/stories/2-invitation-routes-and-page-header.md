---
title: 'Story 1.4, spec 2: Invitation routes and the page header'
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
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/stories/1-invitation-rules-and-storage.md'
---

> Runs after spec 1. Builds to Kevin's decisions D-1, D-2, D-4, D-5 and D-6 in SPEC.md.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spec 1's operations are not reachable: there is no route to invite, read or accept an invitation, the session reply cannot tell the page the account's role or identity, and no page is served without a referrer.

**Approach:** Declare and handle three routes, build the link on the public address, hash the accepted password through the queue, set the session and marker cookies on acceptance, extend the session reply, and add `Referrer-Policy: no-referrer` to the `/invite` page. Covers CAP-6 and the server side of CAP-1, CAP-2, CAP-3, CAP-4, CAP-7 and CAP-9.

## Boundaries & Constraints

**Always:**
- Routes (D-1: the secret only ever in a JSON body):
  - `POST /api/v1/invitations` (`invite`): input `inviteInput`; reply `{ link, expiresAt }`, where `link` = recorded public address + `/invite#` + secret, and `expiresAt` is ISO 8601 UTC. `appOriginOnly`, `readsSessionCookie`.
  - `POST /api/v1/invitations/read` (`invitationRead`): input `{ secret }`; reply `{ inviterName, installationName, email, name, role }`. `appOriginOnly`; reads no cookie.
  - `POST /api/v1/invitations/accept` (`acceptInvitation`): input `acceptInput`; reply `{ name }`. `appOriginOnly`, `readsSessionCookie`.
- A secret that is not 43 base64url characters is answered `invitation_unusable` without an object call. Otherwise the Worker passes `sha256Hex(secret)`, never the secret.
- Accept order: `hashQueue.hasRoom()` else `signin_busy`; the read (idempotent, retried once after a bare reset); `passwordEqualsEmail(password, invitation email)` → `invalid_input`, field `password`; `hashPassword(password, signal)`, with `HashQueueBusy` or an aborted signal → `signin_busy`; `acceptInvitation`, never retried after a bare reset; reply sets `sessionCookieLine` and `markerCookieLine` (D-4). `createInvitation` is never retried after a bare reset either.
- `sessionReply`'s signed-in branch gains `accountId` (string) and `role` (`administrator` | `standard`) (D-5). `signInReply` stays `{ name }` (story 1.3's V-10 pins its shape); the page reads the session after signing in (spec 3).
- `Referrer-Policy: no-referrer` is set on the HTML response for `/invite` and `/invite/`, on both hosts, through the Worker; no other page changes (D-2).
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
| Accept, password rules | 11 characters; equal to the email in another case | 400, field `password`; invitation still live | `invalid_input` |
| Accept, wrong origin or no header | otherwise valid | refused; invitation still live | `origin_refused` |
| Accept, full queue | 1 running and 20 waiting | 503 with `Retry-After: 5`; nothing counted; invitation still live | `signin_busy` |
| Accept while signed in | admin cookie presented | admin's session ended; reply sets the new account's cookies | N/A |
| Accept, bare reset on `acceptInvitation` | injected reset | not retried | `internal_error` or `updating` as `callObject` answers |
| `/invite` page | `GET /invite`, `GET /invite/`, `Accept: text/html` | `index.html` with `Referrer-Policy: no-referrer`; `GET /` has no such header | N/A |
| Logs | invite, read, accept, refused accept with `console` watched | no secret, password or hash in any line | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/routes.ts` -- declarations and reply schemas; `sessionReply`, `signInReply`.
- `site-studio/server/api/handlers.ts` -- handlers; `busyOrGone`, `installation(env)`; `session` adds the two fields.
- `site-studio/server/api/router.ts` -- unchanged unless a test shows a gap.
- `site-studio/server/index.ts`, `server/assets.ts` -- where the `/invite` header is added around `serveAsset`.
- `site-studio/server/auth/session.ts`, `marker.ts`, `password.ts` -- cookie lines, `sha256Hex`, the queue.
- `site-studio/server-tests/signin-routes.test.ts`, `signin-retry.test.ts`, `signin-declarations.test.ts`, `signin-helpers.ts` -- route test patterns, bare-reset injection, the V-12 sweep.

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/shared/routes.ts` -- three declarations; reply schemas; `sessionReply` fields.
- [ ] `site-studio/server/api/handlers.ts` -- `invite`, `invitationRead`, `acceptInvitation`; `session` returns `accountId` and `role`.
- [ ] `site-studio/server/index.ts` (or `server/assets.ts`) -- `Referrer-Policy: no-referrer` for `/invite` and `/invite/`.
- [ ] `site-studio/server-tests/invitation-routes.test.ts` -- matrix rows; the log watch; the registration sweep.
- [ ] `site-studio/server-tests/invitation-retry.test.ts` -- bare reset: `invitationRead` retried once, `createInvitation` and `acceptInvitation` not.

**Acceptance Criteria:**
- Given a live invitation and the app's origin and header, when it is accepted, then the reply sets this installation's `__Host-` session cookie and marker for the new account, the session read then answers `signedIn: true` with the new name, its `accountId` and `role`, and a session cookie the browser presented before is no longer signed in (criterion 4).
- Given an accepted invitation, the users row holds `scrypt`, N = 131,072, r = 8, p = 1, key length 32 and a salt and hash, `verifyPassword` accepts the password, and `POST /api/v1/session/sign-in` with the email and password succeeds (criterion 6).
- Given `ROUTE_LIST` and the installation object's registered operations, only `setup` and `acceptInvitation` reach an operation that inserts into `users` (criterion 8).
- Given an accept request with another `Origin`, or without the app's header, it is refused `origin_refused` and the invitation stays live (criterion 9).
- Given an email that has an account, `POST /api/v1/invitations` answers 409 `invitation_email_taken` with field `email` and the agreed wording (criterion 12, CA-10).
- Given a standard user's session, `POST /api/v1/invitations` answers 403 `administrator_only` (criterion 14, building block).
- Given `console` watched over invite, read, accept and a refused accept, no line contains the secret, the password or its hash (criterion 7, building block); `GET /invite` carries `Referrer-Policy: no-referrer` (CAP-2).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
