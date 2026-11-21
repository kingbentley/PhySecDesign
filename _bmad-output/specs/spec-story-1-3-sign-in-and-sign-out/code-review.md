# Story 1.3 code review (`bmad-code-review`, 2026-11-20)

- **Target:** the commit range `2d15411..903a04e` on `story/1.3`, reviewed in three file groups.
- **Mode:** full, against `SPEC.md`. That file has no Tasks section, so the findings are recorded here.
- **Layers:** blind hunter, edge-case hunter, verification gap and acceptance auditor, each a context-free subagent on the same model as this session.
- **Triage:** done by the session that ran the review, which read the code for every finding except the verification-gap layer's (taken as filed, as the workflow says).

## Group 1: server, shared code and server tests

`site-studio/server`, `site-studio/shared`, `site-studio/server-tests`: 22 files, +3,733 / −25. **Result:** 1 decision needed, 3 patch, 1 defer, 22 rejected.

### Review Findings

- [ ] [Review][Decision] The hash queue's abort path probably never fires on Cloudflare
  - **The code:**
    - Both handlers pass `context.request.signal` to the hash queue (`server/api/handlers.ts:112`, `:172`).
    - A waiter leaves the queue when that signal aborts (`server/auth/password.ts:116-135`).
    - `deploy/cloudflare/wrangler.jsonc` sets only `nodejs_compat`, at compatibility date 2026-11-01.
  - **The risk:** to the reviewer's knowledge (not checked here), a Worker's incoming `request.signal` aborts on client disconnect only with the `enable_request_signal` compatibility flag. Without it, a waiter whose client has gone keeps its slot and still runs a full scrypt hash. Clients that disconnect could then fill the 20 waiting slots, so live users get `signin_busy`.
  - **What tests cover:** the abort branch only on a standalone queue (`hash-queue.test.ts`). No route test sends an abortable request.
  - **Under the flag:** an abort during `verifyPassword` or `hashPassword` rethrows the abort reason. That becomes a logged `internal_error` for a client that has already left. The client never sees it, and the counted attempt stays counted (E-17).
  - **Options:**
    1. Add `enable_request_signal` to the app's and the probe's compatibility flags. Confirm workerd honours it self-hosted, answer an aborted request quietly instead of rethrowing, and add route tests that abort a waiting sign-in and set-up.
    2. Keep the flags as they are: say in `password.ts` and the evidence that the abort release works only where the runtime aborts `request.signal`, and defer.
    3. Defer the whole question to a later story.
  - **Sources:** verification-gap, blind hunter, edge-case hunter.
  - **Resolved (Kevin, 2026-11-20): option 1, add the flag.**
    - Cloudflare's documentation (the Request API page and the changelog of 2026-11-02) confirms the risk. For compatibility dates before 2026-11-17, `request.signal` fires on client disconnect only with `enable_request_signal`. The app's date is 2026-11-01. From 2026-11-17 the signal is on by default.
    - The flag is the narrow change. Moving the date would also bring that date's other new defaults, such as the new module registry.
    - The decision becomes the patch below.
- [x] [Review][Patch] Add `enable_request_signal` and handle an aborted wait quietly [`site-studio/deploy/cloudflare/wrangler.jsonc`, `site-studio/deploy/probe/wrangler.jsonc`, `site-studio/server/api/handlers.ts:111-116, 170-177`, `site-studio/server-tests/signin-routes.test.ts`]
  - Add the flag to the app's and the probe's compatibility flags; the probe refuses to run if the two differ.
  - Confirm the self-hosted runtime (workerd under the smoke test) accepts the flag.
  - In both handlers, when the request's signal has aborted, return quietly instead of rethrowing the abort reason as an internal error.
  - Add route tests that send a sign-in and a set-up with an abortable signal while the queue is held, abort them, and assert the waiting count drops and no hash runs for them.
  - **Applied:**
    - The flag is in `deploy/cloudflare/wrangler.jsonc`, `deploy/selfhost/config.capnp` and `deploy/probe/wrangler.jsonc`; `host-config-flags.test.ts` keeps the first two equal, and `probe.mjs` the first and third.
    - Both handlers answer the busy refusal through `busyOrGone()` when the queue is full or the request's signal has aborted, instead of rethrowing.
    - `signin-routes.test.ts` has a new suite: a sign-in and a set-up wait in the queue, are aborted, leave it, and answer 503 `signin_busy` with the attempt still counted and no session or administrator.
- [x] [Review][Patch] No test for set-up meeting a full queue after its attempt is counted [`site-studio/server-tests/signin-routes.test.ts`]
  - **The gap:** the set-up handler catches `HashQueueBusy` after `setupAttempt` and answers `signin_busy` (`handlers.ts:111-116`). The only set-up busy test fills the queue before the request, so it reaches the earlier `hasRoom()` refusal. Removing the catch would turn a race into a 500 with every test still passing.
  - **The fix:** a test beside "POST /api/v1/setup with a full hash queue", using a wrap that fills the queue once `setupAttempt` answers, as the sign-in race test does. It should assert 503, `Retry-After: 5`, `signin_busy`, one `setupAttempt`, and no `createFirstAdministrator`, then that set-up completes after release.
  - **Sources:** verification-gap, blind hunter.
  - **Applied:** "answers signin_busy when the queue fills after the attempt is counted" in `signin-routes.test.ts`.
- [x] [Review][Patch] The set-up page shows the generic message for `signin_busy` [`site-studio/src/admin/setupClient.js:130-165`]
  - **The gap:** the server now answers set-up with `signin_busy` (503) when the queue is full, but the page's switch has no case for it. The person sees "Set-up could not be completed. Try again." and the `Retry-After` is ignored.
  - **The fix:** a `signin_busy` case giving the server's busy message ("Site Survey Design is busy. Try again shortly."), with a node test.
  - **Source:** blind hunter.
  - **Applied:** a `signin_busy` case and message in `setupClient.js`, tested in `server-tests/setup-client.test.ts` (where the set-up client's tests live, not in node `tests/`).
- [x] [Review][Patch] A failed `loadKeys()` stays cached for the object's lifetime [`site-studio/server/installation/signInStore.ts:266-276`]
  - **The gap:** `this.keys ??= (async () => …)()` keeps a rejected promise. One failed identity read or `importHmacKey` makes every later attempt, completion, session read and sign-out fail until the object is evicted.
  - **The fix:** clear `this.keys` when the promise rejects.
  - **Sources:** blind hunter, edge-case hunter.
  - **Applied:** the promise's `.catch` clears `this.keys` and rethrows. No test injects the failure; it would need a fault in the object's storage or in `crypto.subtle`, which the suites have no hook for.
- [x] [Review][Defer] Email failure rows have no bound when the client address is unknown [`site-studio/server/installation/signInStore.ts`]
  - **The gap:** under D-11 an unknown address (no `CF-Connecting-IP`) meets no address limit. Each attempt for a new email still writes a row, kept 24 hours below the threshold, and pruning removes only expired rows. Without an address, anyone can grow the table by trying distinct emails, at about one row per scrypt check per isolate.
  - **Why deferred:** on Cloudflare the address is always present. It affects local runs and self-hosting behind a proxy that does not pass the address, which is story 2.22's client-address rule (D-11 records that dependency).
  - **Source:** blind hunter.

### Rejected

- **`hash_identity` copies the salt and hash into the tickets table** (acceptance auditor; blind hunter): low. The copy sits in the same object storage as the `users` table, so nothing new is exposed. It lives at most 5 minutes. The fix (an async digest) is more than a direct correction.
- **The restart test does not run self-hosted** (acceptance auditor): false. `deploy/selfhost/smoke.mjs:14-16, 81` does one failure before the workerd restart and four after, then expects the wait (V-17). That file is in group 3.
- **"Twenty or more" from the unknown address tested only at 20** (acceptance auditor): false. The store test uses 25, and the auditor says the two together cover the criterion.
- **Set-up refuses as busy before checking the code** (acceptance auditor): false. SPEC.md's D-5 note says the Worker checks the queue before counting, as at sign-in. Nothing is revealed.
- **A waiting marker is replaced, not cleared, at the next success** (acceptance auditor): low. The browser gets a fresh marker with no count, and the old row expires on its own.
- **Sign-out does not "always succeed" when the object call fails** (blind hunter; edge-case hunter's claim): false. D-13's "always succeeds" covers a live, ended, unknown or absent session, which the code meets. An infrastructure refusal is E-6's "You are still signed in" case, which the page handles.
- **Session rows can be written with no cookie if the reply fails its schema** (blind hunter): false. That mismatch happens only through a code bug, which the route tests rule out, and it fails loudly as `internal_error`.
- **The work counter is shared across interleaved calls** (blind hunter): low. `lastWork()` is a test-only measure, read after sequential calls.
- **Cookie de-duplication's comment** (blind hunter): low. The comment is about keeping the last 64 cookies, not about duplicates. A browser cannot hold two `__Host-` cookies with one name, so no user meets this.
- **`PASSED_COOKIE_NAME` slices another regex's source** (blind hunter): low. It works as written and no change is planned that would break it.
- **The marker format checks are looser than the format** (blind hunter): low. The HMAC rejects any value it did not sign.
- **The marker holds the account id in clear text** (blind hunter): rejected. D-3 (Kevin) puts the account's identifier in the marker; the id is a random UUID, not personal data. Changing it means editing the spec.
- **`verifyPassword` skips the queue for a non-scrypt stored hash** (blind hunter; edge-case hunter): low. Only scrypt hashes can be stored today (`setupStore.ts:343`), so the case cannot be reached. A future algorithm change would have to handle it.
- **A key-length mismatch throws in `timingSafeEqual`** (edge-case hunter): false. `bytesEqual` returns false on unequal lengths before calling it (`password.ts:178`).
- **No index on `sessions.user_id`** (blind hunter): low. No query in story 1.3 needs it, and a later story can add it with `CREATE INDEX IF NOT EXISTS` under data format 1.
- **Other untested failure modes** (blind hunter: a `loadKeys` failure, a reply failing its schema, sign-out refused, concurrent `lastWork`): low. Each is a loud failure or a test-only measure. The set-up race is the patch above.
- **This installation's cookie over 512 characters is ignored, not cleared** (edge-case hunter): low. The person simply reads as signed out, and the next sign-in overwrites the cookie.
- **A query string on `GET /api/v1/session` is refused** (edge-case hunter): false. The page never adds one (`src/admin/setupState.js:13`). The strict empty input matches the set-up state route, by design.
- **Sign-out without a JSON body is refused** (edge-case hunter): false. The app's client always sends `{}` with the app headers (`src/admin/signInClient.js:116-126`). A bodiless POST is not a path the app uses.
