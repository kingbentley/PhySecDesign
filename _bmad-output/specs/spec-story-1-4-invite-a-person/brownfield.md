# Brownfield notes: the code story 1.4 builds on

What stories 1.1 to 1.3 left in `site-studio/` that this story depends on or must change, read on 2026-11-21 at `6815a7e` (branch `story/1.4`, cut from `origin/develop`). Paths are under `site-studio/`.

## Where the plan's assumptions meet the code

| Plan says or assumes | Code has | Consequence |
|---|---|---|
| Invite is refused to standard users (criterion 14); the access gate is story 1.8 | No route yet needs a session; story 1.3 deliberately added no `not_signed_in` code (its SPEC, Notes on its D-7) | This story adds the first session-gated route and two refusals as a stop-gap (D-6) |
| The menu shows "Invite a person" to administrators only (criteria 1, 14) | `sessionReply` (`shared/routes.ts`) carries `name` and `installationName` only; `SessionInfo` in `server/installation/signInStore.ts` has `account.id` but no role | The reply gains `role` and `accountId` (D-5). `readSession` in `src/admin/setupState.js` builds a new object with `name` and `installationName` only, so it must pass the two fields on, and `isSessionReply` must require them (review finding 2) |
| Standing rule 14: the link page is served with `Referrer-Policy: no-referrer` | No response sets `Referrer-Policy`. Pages come from `serveAsset` (`server/assets.ts`) with a fallback to `index.html`; on Cloudflare `run_worker_first: true` and `not_found_handling: single-page-application` (`deploy/cloudflare/wrangler.jsonc`) | The Worker adds the header for `/invite` and `/invite/` on both hosts, by path in `handleRequest`/`route` (`server/index.ts`), whichever `serveAsset` branch answered: the server tests' `ASSETS` stubs answer like the disk service, while Cloudflare's SPA handling answers `index.html` directly (D-2; review finding 5) |
| Links use the recorded public address (AD-12, CA-57) | `settings.public_address` is written at set-up from the request origin (`setupStore.createFirstAdministrator`) | The invite reply builds the link from it |
| "The page shows each rule as it is met" | The set-up page checks rules on submit and shows one hint (`src/admin/setupClient.js`, `FIELD_HINTS.password`); no live list exists | A shared rule list is new; the set-up page stays as it is |
| Route declarations | Paths are exact, "no path parameters yet" (`RouteDeclaration.path`) | Invitation routes are fixed paths with the secret (or nothing) in the JSON body |
| One account per email | `users.email` is `UNIQUE`; `role` is `CHECK (role IN ('administrator','standard'))`; `active` exists (0 or 1) | No change to `users`; accept inserts with the invitation's role |

## Pieces to reuse

- `server/auth/password.ts`: `hashQueue.hasRoom()`, `hashPassword(password, signal)`, `HashQueueBusy`; `server/api/handlers.ts` `busyOrGone()` maps a full queue or a gone client to `signin_busy`.
- `server/auth/session.ts`: `toBase64Url`, `sha256Hex`, `newSessionToken`, `sessionTokenHash`, `sessionCookieLine`, `prefixedCookies`. `server/auth/marker.ts`: `newMarkerId`, `makeMarker`, `markerCookieLine`.
- `signInStore.complete` writes the session row and builds the marker; accept needs the same steps. A small shared helper in `signInStore.ts` (start a session for a user, ending the presented one) avoids a second copy. `sessionInfo`'s session lookup (by this installation's cookie name, live, active account) is what `createInvitation` needs to identify the inviter.
- `setupStore.createFirstAdministrator`'s user insert is the shape accept must write (same columns, parameters beside the hash).
- `shared/setup.ts`: `emailField`, `normaliseEmail`, `personNameField`, `passwordField`, `passwordEqualsEmail`, `PASSWORD_MIN`, `PASSWORD_MAX`. `src/admin/waitWording.js` is not needed.
- `server/api/router.ts`: `appOriginOnly`, `readsSessionCookie`, `requestContext`; replies carry cookies through `HandlerResult.cookies`.
- `src/AccountMenu.jsx` (props `name`, `onSignedOut`), `src/App.jsx` line 654 renders it from `account`; `src/main.jsx` `Start` and `Signed` decide which page shows and key `<App>` on the name.

## Existing tests this story must touch

- `server-tests/setup-store.test.ts` (around line 608) pins the exact list of installation-object operations; the new operations join that list, nothing else changes (as story 1.3 spec 1 did).
- `server-tests/signin-store.test.ts` line 802, "is changed only by completeSignIn, endSession and the bounded pruning": `acceptInvitation` also writes a session row, so its expected writers gain `acceptInvitation` (CAP-11 of story 1.3 still holds: no restore path writes sessions). The test's name changes to match.
- `src/main.jsx`'s name comparison and `browser-tests/signin.spec.mjs`'s tests of story 1.3's D-16: the comparison moves to `accountId` (CAP-9); the existing tests should pass unchanged.
- `server-tests/signin-declarations.test.ts`: the pinned list of cookie-reading routes (its third test) gains `["acceptInvite","POST"]` and `["invite","POST"]`, and that test is renamed; the sweep itself (the first test) passes unchanged (review finding 1).
- Shapes the session reply's new fields change (review finding 2; not named by the review, found while applying it): `tests/signin-client.test.mjs` lines 103, 108 and 133 (`readSession`'s result gains the two fields, and a signed-in reply without them is no longer a session reply) gain the new fields and the review's new cases; `server-tests/signin-routes.test.ts` line 136 (`toEqual` on the session read's body) gains `accountId` and `role`; `server-tests/signin-store.test.ts` line 694 (`toEqual` on `SessionInfo`) gains `role`.

## Test harness facts

- Browser tests run serially against one server per Playwright project (`browser-tests/playwright.config.mjs`, ports 8791 and 8792) plus sign-in pairs; set-up runs once per server. The `baseURL` server belongs to `setup.spec.mjs`, whose first test needs set-up still open, and `invitation.spec.mjs` runs before it in name order, so the invitation tests use `signInServers(project)[0]` with `signin.spec.mjs`'s `completeSetup` and administrator, and each uses an email no `signin.spec.mjs` test uses (review finding 4). Servers are HTTPS on `127.0.0.1` (story 1.3's D-10).
- `npm test` runs `tests/*.test.mjs` in Node with type stripping, which needs `.ts` extensions in imports; `shared/` files import each other without them, so a module that `tests/` loads may import only `shared/refusal.ts` (as `signInClient.js` does), and page modules that use other `shared/` rules are tested in `server-tests/`, as `setup-client.test.ts` does (review finding 8).
- On Windows a checkout path longer than about 60 characters breaks the local Durable Object state path (`deferred-work.md`); run the browser suite from a short path.
