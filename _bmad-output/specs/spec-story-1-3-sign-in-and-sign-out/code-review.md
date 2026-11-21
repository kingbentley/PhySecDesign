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

## Group 2: page, account menu and browser tests

`site-studio/src`, `site-studio/browser-tests`, `site-studio/tests`: 16 files, +1,327 / −87, at `120e82e`. **Result:** 1 decision needed, 4 patch, 0 defer, 19 rejected.

### Review Findings

- [ ] [Review][Decision] The "no server" fallback opens the prototype on a real server [`site-studio/src/admin/setupState.js:25-50, 85-109`]
  - **The code:** the start-up reads decide whether a server exists. In `readJson` a 5xx, `updating`, a network failure or a timeout is "cannot be checked". Every other non-success reply is `NO_SERVER` (`if (!response.ok) return NO_SERVER`), and so is any reply that is not exactly the declared shape (`isSessionReply`, the one-key check in `readSetupState`). "No server" opens the prototype with no sign-in page.
  - **How a real server reaches it:**
    1. A 4xx refusal in the server's own JSON envelope, for example a 401/403 from an access gateway in front of a self-hosted installation, a 429, or `origin_refused`/`https_required`.
    2. After the set-up state has answered `closed` (so a server is known to be there), the session read answering 404 or an unexpected shape. Durable Object copies running code from before story 1.3 can do this for minutes after a deploy or rollback (R11).
    3. A later story adding a field to the session reply (the menu's comment says the role comes later). The exact-keys check would turn that into "no server" unless someone remembers to change it, and no test ties it to `sessionReply` in `shared/routes.ts`.
  - **What the spec says:** SPEC.md's note on D-7 amended reads "no server" as "the session read answers 404 or a reply that is not the declared JSON", and lists the cannot-be-checked cases as a network failure, 5 seconds, a 5xx or `updating`. The code follows that literally. D-7 amended's ruling itself says "the prototype opens only where there is no server", which these three cases contradict.
  - **What tests cover:** only 404 and non-JSON replies are tested as "no server".
  - **Options:**
    1. Fail closed once a server has shown itself. A reply in the server's refusal envelope (`{ error: { code } }`), and any session read after the set-up state answered `open` or `closed` that is not the declared reply, show "cannot be checked". "No server" stays for 404 and non-JSON on the first read. The shape checks accept extra keys, so a later field does not hide sign-in. Tests cover each case.
    2. Only make the refusal envelope (case 1) "cannot be checked", and leave cases 2 and 3 as the note reads.
    3. Keep the note's literal reading, and record cases 1 to 3 as accepted.
  - **Sources:** acceptance auditor, edge-case hunter, blind hunter.
  - **Resolved (Kevin, 2026-11-21): option 1, fail closed.**
    - It follows D-7 amended's ruling ("the prototype opens only where there is no server") where the note's literal reading departs from it.
    - The Sites package still counts as no server: its worker (`worker/index.js`) answers an API read with the assets' plain 404. `npm run dev` answers it with the HTML page, which is non-JSON on the first read.
    - It becomes the first patch below.
- [x] [Review][Patch] Fail closed once a server has shown itself [`site-studio/src/admin/setupState.js`, `site-studio/src/main.jsx`, `site-studio/tests/signin-client.test.mjs`, `site-studio/browser-tests/signin.spec.mjs`]
  - A reply in the refusal envelope (`{ error: { code } }`, any status) is "cannot be checked".
  - A session read made after the set-up state answered `open` or `closed` is "cannot be checked" whenever it is not the declared reply, including a 404 or non-JSON reply.
  - The shape checks accept extra keys, so a later field does not hide sign-in.
  - "No server" stays for a 404 or non-JSON reply to the set-up state read.
  - Unit tests cover each case, and a browser test covers a closed set-up state followed by a 404 session read.
  - **Applied:**
    - In `readJson`, a 404 is no server, and a refusal envelope with any other status cannot be checked. `readSession` never answers "no server": it is made only after the set-up state answered (at start-up, on Try again and on the visibility re-read), so a 404, non-JSON or wrong-shape reply is `unknown`.
    - `isSessionReply` and `readSetupState` ignore extra fields.
    - Unit tests in `tests/signin-client.test.mjs` cover 401, 403 and 429 refusals, a 404, non-JSON and wrong shape on the session read, and an extra field on each read.
    - The "Sign-in cannot be checked" browser test adds a 404, a 403 refusal and a wrong-shape session read.
    - The comment in `main.jsx` says the new rule.
- [x] [Review][Patch] The two pages word the busy refusal differently [`site-studio/src/admin/setupClient.js`]
  - **The gap:** the set-up page now says "Site Survey Design is busy. Try again shortly." (the server's message), and its comment says this is the sign-in page's message. The sign-in page says "Site Survey Design is busy. Try again in a moment." (`signInClient.js:19`). The node test compares the sign-in page with its own constant, so it cannot catch the difference.
  - **The fix:** this review's group 1 patch introduced the mismatch. Use the sign-in page's wording on the set-up page, correct the comment, and pin both texts in their tests.
  - **Sources:** acceptance auditor, edge-case hunter, verification gap, blind hunter.
  - **Applied:** the set-up page says "Site Survey Design is busy. Try again in a moment.". Both `setup-client.test.ts` and `signin-client.test.mjs` pin that sentence.
- [x] [Review][Patch] A failed sign-out's error is still shown when the menu is reopened [`site-studio/src/AccountMenu.jsx:16, 63`]
  - **The gap:** `error` is cleared only when a new sign-out starts. After a failure, closing and reopening the menu shows "You are still signed in. Try again." although nothing has been tried since.
  - **The fix:** clear the error whenever the menu opens or closes.
  - **Sources:** edge-case hunter, blind hunter.
  - **Applied:** `setMenu()` clears it for the trigger, Escape and a press outside. The "sign-out not confirmed" browser test reopens the menu and finds no alert.
- [x] [Review][Patch] No test closes the account menu by clicking outside it [`site-studio/browser-tests/signin.spec.mjs`]
  - **The gap:** the menu closes on a `pointerdown` outside it (`AccountMenu.jsx:23`), but every test closes it with Escape or never closes it. Deleting the listener would pass the suite.
  - **The fix:** a test that opens the menu, clicks elsewhere in the header, and finds the "Account" group gone.
  - **Source:** verification gap.
  - **Applied:** the account-menu test reopens the menu, clicks the header's label, and finds the group gone.
- [x] [Review][Patch] The account menu's trigger does not say it is the account menu [`site-studio/src/AccountMenu.jsx:56-68`]
  - **The gap:** its accessible name is only the person's name, so a screen reader announces "Robin Example, collapsed, button", with nothing saying it opens the account menu.
  - **The fix:** give the trigger an accessible name such as "Account: ‹name›" (the visible text unchanged), and have a test find it by role and that name.
  - **Source:** blind hunter.
  - **Applied:** the trigger has `aria-label="Account: ‹name›"`, and the account-menu test finds it by that role and name.

**Verification after the group 2 patches (2026-11-21, Windows workstation, Node 24.18.0):**
- `npm test` (160), `npm run typecheck`, `npm run test:server` (264), `npm run test:sites` and `npm run smoke:selfhost` passed.
- `npm run test:browser`: 76 passed, 38 in `chromium` and 38 in `webkit-iphone`, on the third run. The two failed runs before it:
  - **First run:** two failures.
    - The old browser test "where there is no server the prototype opens" still expected a session-read 404 to open the prototype, which Kevin's fail-closed decision reverses. It now covers the set-up state only, and its session-read cases moved to the "Sign-in cannot be checked" test.
    - In WebKit the outside-click step clicked `.studio-label`, which is hidden on the iPhone viewport. It now clicks the header's top-left corner.
  - **Second run:** in WebKit, "after too many attempts … states the wait" submitted an empty password. Every refusal shows the same message, so from the second attempt on, the alert check passed on the previous attempt's alert, and the next password was typed before the page emptied the field. The test now also waits for the empty field. This race was already in spec 3's test, not added by this review.

## Group 3: deploy, probe, smoke test and the spec 4 script

`site-studio/deploy`, `site-studio/scripts`, `experiments/story-1-3-cloudflare-acceptance`: 9 files, +654 / −13, at `d635abe`. **Result:** 0 decision needed, 3 patch, 0 defer, 18 rejected.

### Review Findings

- [x] [Review][Patch] No test requires `enable_request_signal` [`site-studio/server-tests/host-config-flags.test.ts:16-22`]
  - **The gap:** the flag test checks that the Cloudflare flags contain `nodejs_compat` and that the self-hosted list equals them, and the probe checks that its own flags equal the app's. Removing `enable_request_signal` from all three files passes every test. The abort route tests use the test's own signal, so they pass without the flag.
  - **The fix:** assert that the Cloudflare flags contain `enable_request_signal`. The existing equality check carries it to the self-hosted list.
  - **Source:** verification gap.
  - **Applied:** `host-config-flags.test.ts` asserts it, and its title names both flags.
- [x] [Review][Patch] The fixture's recorded origin no longer names the probe's flags [`site-studio/deploy/probe/password-fixture.ts:18`]
  - **The gap:** the origin says the fixture was made "with compatibility date 2026-11-01 and nodejs_compat". The probe's flags now also hold `enable_request_signal`, added by group 1's patch after the fixture was made.
  - **The fix:** add to the origin that the flag was added afterwards, that it does not change scrypt's output, and that the fixture verified with it under workerd (the smoke test of 2026-11-21). The fixture stays as it is.
  - **Sources:** acceptance auditor, edge-case hunter, blind hunter.
  - **Applied:** one sentence added to `PASSWORD_FIXTURE.origin`. The hash, salt and `madeAt` are unchanged.
- [x] [Review][Patch] The smoke test's sign-out check does not name the cookie it cleared [`site-studio/deploy/selfhost/smoke.mjs:237-238`]
  - **The gap:** it fails with "did not clear the session cookie alone" but checks only that one `Set-Cookie` has `Max-Age=0`, so clearing the marker instead would pass. The route tests check this exactly; the smoke test is the self-hosted run of it.
  - **The fix:** check that the cleared cookie is the session cookie (the name from sign-in without `m-`), with the full clearing attributes.
  - **Sources:** acceptance auditor, edge-case hunter, blind hunter.
  - **Applied:** `signOut` in `smoke.mjs` requires exactly one `Set-Cookie`, naming the session cookie, with `Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`. `signIn` finds the marker by its `__Host-ssd-m-` prefix (`MARKER_PREFIX`).

**Verification after the group 3 patches (2026-11-21):** `npm test` (160), `npm run typecheck`, `npm run test:server` (264), `npm run build` and `npm run smoke:selfhost` passed. The smoke test passed with the stricter sign-out check, and the probe verified the fixture under workerd. The first smoke run failed because `MARKER_PREFIX` was declared below the code that runs at load; it was moved up with the other constants. The browser suite was not rerun: none of its files, or the app's, changed in this group.

### Rejected

- **`checks.mjs` script robustness** (edge-case hunter; blind hunter): rejected as carried. The findings are no request timeout, a TypeError when state is missing, no check of `check8`'s argument, a password overwritten by re-running `setup-x`, a mis-parsed `Set-Cookie` without `=`, and the burst's "sent" time being the first reply's. Spec 4's review triaged each one (its rows 7, 16 to 18 and 20 to 23): the script is a throwaway, run once against Workers since deleted, and kept as it ran. Spec 4's record explains the "sent" time.
- **An inherited command name such as `toString` runs a prototype method** (edge-case hunter): low. The script is run by hand with the documented names.
- **`check1` checks the reply's key but not the name's value** (blind hunter): low. Spec 4's record prints the reply, `{"name":"Administrator A"}`.
- **`checks.mjs` has no `check2`** (edge-case hunter's claim): false as a defect. Spec 4's record says check 2 came from `wrangler tail`, kept only as its pass/fail fact, as the run's rules required.
- **Check 9 cannot tell the marker's count from the email's** (acceptance auditor; blind hunter): rejected as already accepted. Kevin accepted the server-test coverage on 2026-11-20 (spec 4's record, `deferred-work.md`).
- **The probe's compatibility check ignores the self-hosted configuration** (acceptance auditor; edge-case hunter, with its claim on the `wrangler.jsonc` comment): false. `host-config-flags.test.ts` holds the self-hosted flags equal to the Cloudflare ones, and `probe.mjs` holds the probe's equal to the Cloudflare ones, so all three stay equal.
- **`compatibilityOf()` would read a commented-out setting** (edge-case hunter; blind hunter): low. No such line exists in either file.
- **Another process could take the probe's port before workerd binds it** (edge-case hunter): low. It is a local test run on a freshly freed port.
- **The probe waits 5 s if workerd was already killed by a signal** (edge-case hunter): low. It costs time only, on a failure path.
- **On Windows a drive-letter case difference could stop `probe.mjs` running when called directly** (edge-case hunter): low. Node gives both paths the same case, and the smoke test calls `runProbe` directly anyway.
- **`workerd` without a string export throws a TypeError** (edge-case hunter): low. The pinned package exports one, and a change would fail loudly.
- **The deployed probe serves `/make` to anyone, and its errors are uncaught** (acceptance auditor; edge-case hunter; blind hunter): low. The probe is deployed only for spec 4's check, and was deleted within two minutes (spec 4's record).
- **`/verify` returns `navigator.userAgent`, which nothing reads** (blind hunter): false. Spec 4's record uses it to show the check ran on Cloudflare (`"runtime":"Cloudflare-Workers"`).
- **The probe only proves one direction** (blind hunter): false as a defect. CAP-13 asks for a fixture made under the self-hosted runtime that verifies on each host, which is what is done.
- **The smoke test's marker check `includes("-m-")` could match a session cookie** (edge-case hunter; verification gap): false. Identifiers are 32 hex digits (`IDENTIFIER_PATTERN`), so a session cookie's name cannot contain `-m-`.
- **The smoke test does not treat a past `Expires` as cleared** (edge-case hunter): false. The server clears only with `Max-Age=0` (`clearSessionCookieLine`).
- **The burst checks do not assert the wait's wording** (acceptance auditor): low. The route tests in Cloudflare's runtime pin the message; the deployed check is about counts.
- **`run-unit-tests.mjs` runs every node test with `--experimental-strip-types`** (acceptance auditor; blind hunter): low. No older test file changed and all pass; the warning appears only on Node 22.13 to 22.17.

### Rejected

- **Accounts are told apart by display name** (edge-case hunter; blind hunter): rejected as already recorded. `deferred-work.md` holds it from spec 3: unreachable with one account, and it is for story 1.4 or 1.6 to add an account identifier to the session reply.
- **A signed-out re-read ignores a changed installation name** (edge-case hunter): low. The installation's name cannot change in story 1.3.
- **One Escape closes both the menu and a prototype dialog** (edge-case hunter): low. The menu and a modal are not normally open together, and nothing is lost.
- **An empty name would show a blank menu** (edge-case hunter): false. Names are at least one character after trimming (`personNameField`), so the server never sends an empty one.
- **The page is blank while the set-up and session reads are pending, up to 5 s each** (edge-case hunter; blind hunter): low. Story 1.2's set-up read already rendered nothing while pending, and a waiting state would be a new screen part.
- **`signInPorts` with more than two entries collides** (edge-case hunter): false. The configuration has exactly two.
- **The hanging-route test may exceed the default timeout** (edge-case hunter): low. It passes in both projects. Raise the timeout if it ever fails.
- **Local projects are not cleared at sign-out** (blind hunter): false as a defect. SPEC.md's non-goals and D-7 keep the browser's local project for whoever signs in next until Epic 2, and story 1.7's CA-49 clears it later.
- **A sign-out chunk that fails to load reads as "still signed in"** (blind hunter): low. It needs a deploy during an open session, and reloading fixes it.
- **`signin.spec.mjs` runs serially and the last test leaves the administrator locked** (blind hunter): low. It is test hygiene with no failing case. Serial mode keeps the shared server's counts predictable.
- **The browser tests do not show `signin_busy`, a server field refusal or a network failure on the page** (blind hunter): low. `tests/signin-client.test.mjs` covers the mapping of each refusal, and standing rule 15 puts refusal details in lower-level tests.
- **`submitSignIn` and `requestSignOut` are not called with a fake fetcher** (blind hunter): low. Both run against the built Worker in the browser suite, so a wrong header, method or body would fail it.
- **The two-installations test does not assert exactly two session cookies** (blind hunter): low. Each browser context starts empty, so a leftover cookie cannot occur.
- **The set-up done page's "Sign in" link may be under 44 px on the iPhone** (acceptance auditor): rejected. D-9 and A-8 chose a plain link in place of the button. Making it a button-sized target would edit Kevin's decision.
- **The Sign out button's width is not checked** (acceptance auditor): low. Its height is checked, and the button spans the panel's width.
- **No test at 200% zoom for the sign-in page or the cannot-be-checked page** (acceptance auditor): low. The 80-character-name test runs at the narrow width that 200% zoom gives, and the pages are single-column forms.
- **The three deliberate breakages are not evidenced** (acceptance auditor): false. Spec 3's file records them (`stories/3-sign-in-page-account-menu-and-browser-tests.md:92`).
- **"No account with that email" is not asserted absent in the browser** (acceptance auditor): low. The page shows only the client's mapped messages, which the node test pins.
- **The comment says browser requests have no `CF-Connecting-IP`, which is unverified under `wrangler dev`** (acceptance auditor): low. The suite stays far under 20 failures from any one address either way.
