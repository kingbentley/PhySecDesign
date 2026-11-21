# Brownfield notes: the code story 1.4 builds on

What stories 1.1 to 1.3 left in `site-studio/` that this story depends on or must change, read on 2026-11-21 at `6815a7e` (branch `story/1.4`, cut from `origin/develop`). Paths are under `site-studio/`.

## Where the plan's assumptions meet the code

| Plan says or assumes | Code has | Consequence |
|---|---|---|
| Invite is refused to standard users (criterion 14); the access gate is story 1.8 | No route yet needs a session; story 1.3 deliberately added no `not_signed_in` code (its SPEC, Notes on its D-7) | This story adds the first session-gated route and two refusals as a stop-gap (D-6) |
| The menu shows "Invite a person" to administrators only (criteria 1, 14) | `sessionReply` (`shared/routes.ts`) carries `name` and `installationName` only; `SessionInfo` in `server/installation/signInStore.ts` has `account.id` but no role | The reply gains `role` and `accountId` (D-5). `isSessionReply` in `src/admin/setupState.js` ignores extra fields, so older pages keep working |
| Standing rule 14: the link page is served with `Referrer-Policy: no-referrer` | No response sets `Referrer-Policy`. Pages come from `serveAsset` (`server/assets.ts`) with a fallback to `index.html`; on Cloudflare `run_worker_first: true` and `not_found_handling: single-page-application` (`deploy/cloudflare/wrangler.jsonc`) | The Worker adds the header for `/invite` and `/invite/` on both hosts (D-2) |
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
- `server-tests/signin-declarations.test.ts` (V-12 sweep) must pass unchanged with the new routes.

## Test harness facts

- Browser tests run serially against one server per Playwright project (`browser-tests/playwright.config.mjs`, ports 8791 and 8792) plus sign-in pairs; set-up runs once per server, so each invitation test uses its own email. Servers are HTTPS on `127.0.0.1` (story 1.3's D-10).
- On Windows a checkout path longer than about 60 characters breaks the local Durable Object state path (`deferred-work.md`); run the browser suite from a short path.
