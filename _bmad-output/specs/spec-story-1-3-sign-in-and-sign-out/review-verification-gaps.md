# Review: verification gaps in the story 1.3 spec

- **Workflow:** `bmad-review`, one lens: verification gap (`.agents/skills/bmad-review/references/lens-verification-gap.md`).
- **Content:** documents that define behaviour (docs class): `SPEC.md`, `acceptance-trace.md`, `brownfield.md`, `stories.yaml`, `stories/1` to `stories/4`, as committed on `story/1.3` at `d7c5d84`.
- **Measured against:** story 1.3 in `epics.md` (lines 251–292), standing rules 1–15 and the definition of done (lines 131–151), the choice rows CA-07, CA-08, CA-43, CA-44, CA-47 and CA-58; AD-12 and its refinements in `architecture.md` (lines 219–254); `cloudflare-limits.md`.
- **Harnesses read:** `site-studio/package.json`, `server-tests/vitest.config.mjs`, `server-tests/helpers.ts`, `server-tests/setup-routes.test.ts`, `server-tests/setup-store.test.ts` (time handling), `server-tests/password.test.ts`, `server-tests/call-retry.test.ts` (test names), `browser-tests/playwright.config.mjs`, `browser-tests/serve.mjs`, `browser-tests/setup.spec.mjs`, `deploy/selfhost/smoke.mjs`, `.github/workflows/test.yml`, and the server code they drive (`server/api/router.ts`, `server/httpsRedirect.ts`, `server/auth/password.ts`, `server/installation/setupStore.ts`).
- **Reviewer:** independent; no contact with the other reviewers or their output.
- **Departures from the lens:** the lens assigns no severity. The brief asked for one, so each finding carries High, Medium or Low: High means a criterion's planned evidence could pass while the behaviour is broken, or can't be produced as planned; Medium means a part of a criterion or decision has no test that would fail; Low means the evidence is weaker than the wording, or a test is hard to write as planned. Each finding names its gap shape from the lens.

## Findings

### 1. High. CA-44 (criterion 14) and D-3: the marker is only ever tested as a cookie header the test writes itself

- **Concerns:** criterion 14 ("a test locks an email from one address, then signs in with the correct password from a browser holding the marker"), D-3, CAP-8.
- **Gap shape:** broken verification.
- **Why the evidence falls short:**
  - The trace (row 14) plans only "S (marker cookie sent by the test)". The server test builds the `Cookie` header itself, so it never checks the marker's `Set-Cookie`.
  - Spec 2's acceptance criterion checks "every attribute in CAP-3", and CAP-3 covers only the session cookie. No file gives the marker's name, `Path`, `SameSite` or `Max-Age`. D-3 says `__Host-`, `HttpOnly` and `Secure` and nothing more, and brownfield's code-map row is just as silent.
  - Browsers reject a `__Host-` cookie that lacks `Path=/` or carries a `Domain`. If the marker is set with a different `Path`, a `Domain`, or a `Max-Age` other than one year, every planned test still passes, yet no real browser ever holds the marker. The protection CA-44 exists for, that a stranger cannot lock the owner out, would then be silently missing.
  - Three more parts of D-3 have no assertion in any matrix: "renewed at each sign-in", "kept on sign-out", and "lasts 1 year". Nothing checks that the sign-out reply leaves the marker's `Set-Cookie` out.
  - The store matrix in spec 1 has rows for a marker with a bad signature and for one naming another account, but none for an expired marker. A marker that never expires passes every row.
- **Suggested correction:**
  - Write the marker's full cookie line into D-3 or spec 2: name (see finding 6), `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`, no `Domain`.
  - In `signin-routes.test.ts`, parse the marker's `Set-Cookie` the way the session cookie is parsed, and assert three things: a second sign-in issues a new expiry, the sign-out reply carries no `Set-Cookie` for the marker, and an expired marker counts as no marker. That last one is a store test with an injected `now`, as `setup-store.test.ts` already does.
  - Add one Playwright test, so the criterion's "from a browser" is shown in a real cookie jar: sign in on the page, sign out, lock the administrator's email from another address with `request.post` and a distinct `CF-Connecting-IP`, then sign in again on the page in the same context and see it succeed.

### 2. High. CA-58 (criterion 8): the timing test may pass when the stand-in hash is never run, and may be flaky

- **Concerns:** criterion 8, CAP-6, D-5.
- **Gap shape:** broken verification.
- **Why the evidence falls short:**
  - The only planned check is that the two medians are within 100 ms of each other (spec 2 matrix, "Timing" row).
  - The route tests call `handleRequest` inside the workerd test isolate (`setup-routes.test.ts:75`). There, workerd's clock moves forward only at I/O boundaries. Whether the measured interval actually includes the scrypt work depends on where the next I/O falls. I could not confirm that it does.
  - If the clock does not see the hash, both medians come out near zero and within 100 ms. The test would then also pass when the unknown-email path skips the stand-in hash entirely, which is the exact regression CA-58 exists to catch.
  - The test has no lower bound and no negative control, so it cannot tell "both paths hash" from "the clock saw nothing".
  - Brownfield's plan is 20 known-email refusals followed by 20 unknown-email ones. That order lets drift in machine load (other test files hashing in the same run, CI noise) pull one median and not the other.
- **Suggested correction:**
  - Assert that each median is at least a floor, for example 150 ms, a fraction of the ~0.4 s scrypt time. This proves the clock observed a hash on both paths.
  - Alternate the two cases one by one (A, B, A, B, and so on) rather than in two blocks.
  - Keep the timing file from running alongside other scrypt-heavy files, or record that it does.
  - As a one-time check, recorded in the spec 2 file, show that the test fails when the stand-in check is short-circuited.

### 3. High. Criterion 25 and D-6: the cross-host fixture has no build step, no permitted home, and no rule tying it to the app's code and runtime flags

- **Concerns:** criterion 25 ("A password hash made on one host verifies on the other"), D-6, CAP-13.
- **Gap shape:** other (the evidence can't be produced as planned).
- **Why the evidence falls short:**
  - **No build step.** The smoke test runs only what `npm run build` puts in `dist/` (`smoke.mjs:30`). `build` is `vite build && node scripts/prepare-sites-build.mjs` (`package.json:11`), which makes no probe bundle. Nothing says how the probe is built, and "no new dependency" rules out adding a bundler.
  - **No permitted home.** Spec 2 owns the probe bundle, but both spec 1 and spec 2 forbid `experiments/`. Spec 2 hands the Cloudflare probe Worker to spec 4, and spec 4 forbids "application changes" and lists its files as "records only". Neither probe has a place to live.
  - **Nothing ties the probe to the app.** No file requires either probe to:
    - import the real `server/auth/password.ts` `verifyPassword`;
    - use the production parameters (N = 131,072, r = 8, p = 1, a 32-byte key) and the stored-hash shape;
    - run under the app's own `compatibility_date` and `nodejs_compat` flags.
  - Without those, a probe could pass on its own scrypt call while the app's code path differs, which is what R9 already showed once.
  - A fixture made in Node and verified on each host does show that both compute the same function. That only stands in for "a hash made on one host verifies on the other" if the fixture goes through the app's own verification path under the app's own flags.
- **Suggested correction:**
  - Name the probe's files and their place, for example `deploy/probe/` with its own `wrangler.jsonc` that copies the app's compatibility date and flags. Say how it is built: Wrangler's own bundling (`wrangler deploy --dry-run --outdir`) needs no new dependency.
  - Let spec 4 deploy it, and amend spec 4's "Never" line to allow it.
  - Require the fixture to use the production parameters and to be checked through `verifyPassword`.
  - Add one negative case: the wrong password does not verify on each host.

### 4. Medium. Criterion 16: deployed check 6 passes without testing anything, and check 5 can be set up to prove nothing

- **Concerns:** criterion 16, CAP-10, spec 4 checks 5 and 6.
- **Gap shape:** broken verification.
- **Why the evidence falls short:**
  - **Check 6.** It sends "A's session cookie … to B". The cookie is named with A's identifier (D-1), so B looks for its own cookie name, finds none, and answers "not signed in" whatever B does with tokens. The check proves only that the names differ, which check 1 already shows. It never shows that B would refuse A's token.
  - **Check 5.** It says "A's account on Worker B, refused with the one message". Spec 4 says only "complete set-up on each". If B's administrator is set up with the same email and password as A's, sign-in to B succeeds, and rightly so. If the operator picks a different email for B, the check passes. The outcome depends on an unstated choice.
- **Suggested correction:**
  - Add check 6b: A's token sent under B's cookie name is refused as not signed in. This is the deployed form of spec 2's local "unknown token" row.
  - State in spec 4 that B's administrator uses a different email from A's, and record both emails in the run record, never the passwords.

### 5. Medium. Criterion 6: the spec gives two answers for what "refused" looks like after sign-out

- **Concerns:** criterion 6 ("a later request with its cookie is refused"), CAP-5.
- **Gap shape:** broken verification (a test can't be written to one meaning).
- **Why the evidence falls short:**
  - In spec 2's matrix, the session read with no cookie returns 200 `{ signedIn: false, installationName }`.
  - The row "After sign out" gives `not_signed_in` 401 for an old cookie "on session read or sign-out". The row "Foreign cookie" says "treated as signed out | `not_signed_in`".
  - A public read that answers 401 to a stale cookie but 200 to no cookie behaves differently from "treated as signed out". An implementer must choose, and a test written to either meaning passes against that choice.
  - No route in this story is gated (the access gate is story 1.8). The only server observables of "refused" are therefore the session read and a second sign-out. If the read answers 200 `signedIn: false` for both a stale and a missing cookie, the planned test cannot tell a server-side ended session from a cookie the browser merely dropped.
- **Suggested correction:**
  - Settle one reply in spec 2. One option: the session read answers 200 `signedIn: false` for no cookie, a stale cookie or a foreign cookie, and sign-out answers `not_signed_in` 401 for a stale cookie.
  - Require the test to replay the exact old cookie header after sign-out on both routes.
  - Require the test to read the sessions table and find the row gone. Spec 1 covers this at the store, but no test is planned at the route.

### 6. Medium. D-1, D-3 and criterion 17: nothing names the marker per installation, so two installations on one host overwrite each other's marker unseen

- **Concerns:** criterion 17 ("Two test installations on one host name with different ports each keep their own session"), D-1, D-3.
- **Gap shape:** missing adoption.
- **Why the evidence falls short:**
  - D-1 puts the installation identifier in the session cookie's name precisely because cookies ignore ports. D-3's marker has no such rule, and "a browser holds one" reads as one marker per browser.
  - If the marker's name is fixed, signing in to installation B on port 8794 replaces A's marker. A's owner then loses CA-44's protection on A.
  - The planned two-port browser test (spec 3, "Two servers, one host") checks only that both sessions stay signed in, so it passes.
- **Suggested correction:**
  - Name the marker with the installation identifier too, for example `__Host-<prefix>-m-<installation id>`, and record it under D-1 and D-3.
  - Extend the two-port test: after signing in to A and then B, `context.cookies()` holds two distinct markers.

### 7. Medium. D-5: no planned test shows the one-at-a-time hash queue, or that set-up shares it

- **Concerns:** D-5, the constraint "One scrypt hash runs at a time per Worker isolate … set-up hashing share one queue", brownfield's memory note.
- **Gap shape:** regression gap.
- **Why the evidence falls short:**
  - Spec 1 lists the queue as a task, but none of its acceptance criteria and none of the matrix rows in specs 1 to 3 check it.
  - In the local runtime, the Worker's 128 MB limit (`cloudflare-limits.md:11`) is not enforced the way it is on Cloudflare. Without a queue, five scrypt hashes at once would pass every local test.
  - On Cloudflare, only spec 4 check 4 would expose it, and only indirectly: an error status instead of `signin_failed` or `signin_wait`, and only if those requests share an isolate. If the queue is dropped later, nothing in CI fails.
- **Suggested correction:** add a server test that starts two `verifyPassword` calls and one `hashPassword` call at once and records start and end events through the queue's own hook. It asserts that no two overlap and that the set-up hash waits its turn. The queue needs a small observable for this, such as an "active" counter exported for tests.

### 8. Medium. Criterion 4 (CA-47): ending the earlier session at sign-in is tested only at the store, never along the route that must pass the cookie in

- **Concerns:** criterion 4 ("a new token is issued at each sign-in"), the assumption "Signing in from a browser that already holds a session … ends that earlier session".
- **Gap shape:** caller-path gap (regression gap).
- **Why the evidence falls short:**
  - Spec 1's row "Complete, correct … earlier presented session ended" tests the store with a session hash it is handed.
  - The route must read the existing cookie and pass its hash to `completeSignIn`. Spec 2's matrix has no row for signing in while carrying a valid session cookie. If the handler never passes the presented session, the store test still passes, and an attacker's planted cookie survives sign-in (session fixation).
  - The planned "two sign-ins issue two different tokens" test passes with any random token, whether or not the old session ends.
- **Suggested correction:** add a route row to spec 2: sign in carrying session cookie X, see a new token Y, and find that X is now refused by the session read and by sign-out, as settled in finding 5.

### 9. Medium. Criterion 2 and story 1.2's D-9: no test checks that sign-in normalises the email or the password

- **Concerns:** criterion 2, CAP-2 ("compared after `normaliseEmail` … checked after `normalisePassword`"), and the constraint that binds story 1.2's D-9.
- **Gap shape:** regression gap.
- **Why the evidence falls short:**
  - No matrix row in spec 1, spec 2 or spec 3 signs in with an email that differs in case or surrounding space from the one set up, or with a password that differs only in its Unicode form (NFKC).
  - If the tests type the same strings used at set-up, dropping `normalisePassword` at sign-in passes everything. The administrator who set up with a composed character and later types the decomposed one is then locked out.
- **Suggested correction:**
  - Add rows to spec 2: sign in with `"  DANA@acme.TEST "` and with the password in another Unicode form, and both succeed.
  - Add a route row for an inactive account with the correct password: refused with the one message, and status, code and body identical to a wrong password. Today this exists only as a store row.

### 10. Medium. The constraint that secrets never reach logs or replies is tested only on refusals

- **Concerns:** the constraint "The password, its hash, the session token, the marker and the email of a failed attempt never appear in logs, replies or refusals" (NFR-5, AD-17), and criterion 3 ("a cookie that scripts cannot read").
- **Gap shape:** regression gap.
- **Why the evidence falls short:**
  - Spec 2's only acceptance criterion on this covers "any refusal … its text and headers".
  - Logs: no planned test captures `console` output. The router already logs (`router.ts:38`), and a debug line holding the email of a failed attempt would pass every test.
  - Replies: the success reply of sign-in, and the session read, are never checked for the token. A token in the JSON body would make `HttpOnly` pointless. The router's Zod reply parse strips unknown keys, but only as long as the reply schema doesn't declare such a field.
- **Suggested correction:**
  - In `signin-routes.test.ts`, spy on `console.log`, `console.warn` and `console.error` for the whole sign-in, failure, wait and sign-out sequence. Assert that no captured line holds the email, the password, the token or the marker value.
  - Assert that the sign-in success body exactly equals the declared shape and doesn't contain the token.

### 11. Medium. D-1: nothing shows that the installation identifier survives a restart or a deployment

- **Concerns:** D-1 ("creates once and keeps … does not change with the public address"), and the assumption that it is created with the object.
- **Gap shape:** regression gap.
- **Why the evidence falls short:**
  - Spec 1's restart row covers only failure counts.
  - If `installationIdentity` regenerates the identifier when the object starts, every cookie name changes and everyone is signed out. Under story 1.1's version rule, objects stop themselves on every deployment, so that would happen at each one. No planned test would fail.
  - The self-hosted smoke test already restarts workerd (`smoke.mjs:60`) but would check only `createdAt`.
- **Suggested correction:**
  - Add a store test: read the identity, restart the object (the existing restart pattern), read it again, and find it equal. Then change the recorded public address and find the identity unchanged.
  - In the smoke test, sign in before the restart and check after it that the same cookie still reads as signed in. This also covers part of finding 17.

### 12. Medium. Criterion 15 and standing rule 13: the session read records last use but is a GET with no origin check, and nothing guards later cookie routes

- **Concerns:** criterion 15 ("A request that changes anything with a session cookie … is refused unless it comes from the app's own origin"), D-4's assumption that last use is recorded on the opening session read.
- **Gap shape:** other (a contradiction), plus a missing-adoption guard.
- **Why the evidence falls short:**
  - Under the D-4 assumption, the session read writes last use, so it "changes anything with a session cookie".
  - Brownfield declares it a public GET, and browsers don't send `Origin` on same-origin GETs, so it can't be `appOriginOnly`. A cross-site top-level navigation carries a `SameSite=Lax` cookie and would update last use.
  - The trace (row 15) plans tests only for sign-in and sign-out. As worded, the criterion is therefore met for two routes and contradicted for the third, and no test records which.
  - The router enforces the rule only where a declaration sets `appOriginOnly` (`router.ts:22`). Nothing would flag a later cookie write route declared without it.
- **Suggested correction:**
  - Either rule that a last-use write is not a "change" for standing rule 13, and record it as a decision, or stop writing last use from the GET until story 1.6.
  - Add a declaration sweep test in `server-tests/` over `ROUTES`: every route that reads the session cookie and is not `GET` has `appOriginOnly: true`. This needs the "reads the session cookie" flag brownfield already proposes for `shared/routes.ts`.

### 13. Medium. Criterion 22 (CAP-11): the planned test can't be written as worded, and no restore runs

- **Concerns:** criterion 22 ("A revision restore leaves sessions unchanged"), standing rule 9.
- **Gap shape:** broken verification.
- **Why the evidence falls short:**
  - Spec 1's acceptance criterion reads "Given any operation other than sign-in completion and ending a session, then the sessions table is unchanged". "Any operation" isn't something a test can list: each object operation needs valid input, and the room object has its own.
  - The trace's wording ("sessions only in the installation object; no restore operation writes it") is an argument, not a test.
  - Revision restore exists today only in the browser prototype (local revisions). The one restore a user can actually run while signed in is never exercised. A restore that reloads the app and drops back to the sign-in page, for instance by clearing state the start-up flow relies on, would pass every planned test.
- **Suggested correction:**
  - Replace the spec 1 criterion with two concrete tests:
    - A server test that lists `Installation`'s registered operations and asserts that only `completeSignIn`, `endSession` and the session read touch the sessions table. Assert it by code path, or by running each listed operation with fixture input and diffing the table.
    - A Playwright test: sign in, save a named revision, restore it, and find the account menu still showing the name.

### 14. Medium. Criterion 17: the extra server pair for the two-port test is unspecified and collides with the two-project layout

- **Concerns:** criterion 17, CAP-10, spec 3's task "second server pair".
- **Gap shape:** other (hard to write as planned).
- **Why the evidence falls short:**
  - `playwright.config.mjs` starts one server per project, each with its own set-up code, and runs both projects in one worker (`playwright.config.mjs:17–59`).
  - A single extra pair shared by the `chromium` and `webkit-iphone` projects would be set up by whichever project runs first. The second would then meet closed set-up and existing sessions, and its outcome would depend on the order the projects run in.
  - The extra servers also need their own generated set-up codes, ports and, under D-10, perhaps HTTPS. None of this is planned, so the spec 3 developer must invent it, and a weak version (one pair, the test run in one project only) would leave criterion 17 unshown in WebKit.
- **Suggested correction:** specify one extra pair per project, for example ports 8793–8796, each with its own generated code and state folder in `.local/`. The two-port test completes set-up on both servers through the API and then runs the sign-in sequence in one context.

### 15. Low. Criterion 9 in the browser: the planned wait test can block later tests unless the spec fixes its email and address

- **Concerns:** criterion 9, standing rule 15, spec 3's "Wait" row.
- **Gap shape:** broken verification (flaky through shared state).
- **Why the evidence falls short:**
  - Each Playwright test gets a fresh context, so no test holds a marker. The local server puts every request without `CF-Connecting-IP` in one address bucket.
  - A wait test that locks the administrator's email makes every later sign-in test in that project wait for a minute or more. A run with 20 or more failures from the default bucket makes them all wait.
  - Brownfield notes the budget, but spec 3 doesn't require a remedy, so the suite's result depends on the order tests are written in.
- **Suggested correction:** require in spec 3 that the wait test uses an email with no account (the wait is the same, criterion 10) and its own `CF-Connecting-IP`, as `setup.spec.mjs:179` does. Keep a count of failure-producing tests per project below 20.

### 16. Low. The rule against retrying writes is untested for the new sign-in writes

- **Concerns:** the constraint "`callObject` keeps story 1.2's D-2 as amended … writes (counting an attempt, creating or ending a session) only on the shown version-stop reason".
- **Gap shape:** missing adoption.
- **Why the evidence falls short:**
  - `call-retry.test.ts` checks the rule for set-up's calls ("does not retry a write after a bare reset", line 58; "the read routes … send their object call again", line 95).
  - Nothing planned checks it for `signInAttempt`, `completeSignIn` or `endSession`. If `signInAttempt` were marked `idempotent`, a bare reset would count one attempt twice and lock an account after three real tries, and no test would fail.
- **Suggested correction:** extend `call-retry.test.ts`, or add a row to `signin-routes.test.ts` that uses the `wrap` hook from `setup-routes.test.ts:31`. Inject a bare reset on `signInAttempt` and on `endSession`, and assert one call each and the error reaching the client. Inject one on the session read and assert it is retried.

### 17. Low. Criterion 12: "on both hosts" has no self-hosted evidence for the counts

- **Concerns:** criterion 12 ("kept in the installation object's storage, which is a single instance for the installation on both hosts").
- **Gap shape:** regression gap.
- **Why the evidence falls short:** server tests run under the Cloudflare host configuration (`vitest.config.mjs:17`). The smoke test under the self-hosted configuration restarts workerd on the same storage, but no count is planned to be checked across that restart.
- **Suggested correction:** in `smoke.mjs`, before the restart, make one wrong sign-in for an email with no account. After the restart, show the count held, either by four more failures then a wait, or by reading a count through a test-only route. The first needs no new route.

### 18. Low. D-4: the 30-day boundaries are not pinned

- **Concerns:** D-4 ("refuses a session 30 days after its sign-in"; `Max-Age` 30 days).
- **Gap shape:** regression gap.
- **Why the evidence falls short:**
  - Spec 1's row "refused 30 days after sign-in" gives no boundary.
  - Nothing requires the store operations to take `now`, as `setupStore.ts:283` does. Without it, a test can't move time, and the only way to test the limit is to seed old rows.
  - An off-by-unit error (seconds against milliseconds) would pass a test that seeds a row from 31 days ago.
- **Suggested correction:** require `sessionInfo(hash, now)`. Test just under and just over 30 days after sign-in, and test that last use is updated on the read.

### 19. Low. Criterion 24: deployed check 4 is weaker than the criterion and its run order is unstated

- **Concerns:** criterion 24, CAP-12, spec 4 check 4.
- **Gap shape:** other.
- **Why the evidence falls short:**
  - The criterion says "over several connections", but the check doesn't say how the client opens them. Node's `fetch` reuses pooled connections.
  - The pass rule, "at most 5 `signin_failed`, the rest `signin_wait`", passes with 0 checked and 25 waiting. That would also be the result if the email had been locked earlier in the run.
  - Check 4 locks A's email for at least a minute and adds five failures to the workstation's address. Spec 4 doesn't say that check 4 runs after every check that needs A's administrator to sign in (checks 1, 3, 7).
- **Suggested correction:**
  - Pass only with exactly 5 `signin_failed` and 20 `signin_wait`, after first confirming the email has no failures.
  - Open the connections with an explicit client, for example an undici `Agent` with `connections: 25` and `pipelining: 0`.
  - Fix the check order in spec 4, with check 4 last against A.

### 20. Low. D-9: the new Sign in link has no reachable place for its assertion

- **Concerns:** D-9 ("with a Sign in link"), and the constraint "of story 1.2's browser tests, only the two assertions D-9 changes are updated".
- **Gap shape:** other.
- **Why the evidence falls short:**
  - The done page appears only once per project, inside `setup.spec.mjs`'s completion test (`setup.spec.mjs:278–289`).
  - Asserting the link there would be a third change to story 1.2's tests, which the constraint forbids. Spec 3 instead lists the "Set-up done" row in its own matrix, but by the time `signin.spec.mjs` runs, set-up is closed.
- **Suggested correction:** either allow a third assertion in `setup.spec.mjs` (the link's name and `href`), or state that `signin.spec.mjs` reaches the done page with mocked replies, as `setup.spec.mjs:302–306` already does for the set-up state.

### 21. Low. Criterion 1 against D-7: the exceptions go unrecorded in the trace, and the check runs only in the browser

- **Concerns:** criterion 1 ("shows the sign-in page … to anyone not signed in"), D-7.
- **Gap shape:** other.
- **Why the evidence falls short:**
  - D-7 makes two exceptions: the prototype opens when the session can't be read, and reviewer hash links open without sign-in. The trace marks criterion 1 as met without noting either.
  - The sign-in page is a choice made by the page's own start-up code (brownfield, `src/main.jsx` row), and the same bundle reaches every visitor. The planned browser test shows the default path only.
  - That is acceptable while project data stays in the browser, but the criterion as worded is only partly met.
- **Suggested correction:** record in `acceptance-trace.md` that criterion 1 holds with D-7's two exceptions until story 1.8's gate, and keep the two D-7 rows in spec 3's tests so the exceptions stay deliberate.

### 22. Low. Spec 3's "deliberately broken page fails the run" leaves no record

- **Concerns:** spec 3's acceptance criterion "Given a deliberately broken sign-in page, when the suite runs, then it fails", and standing rule 15.
- **Gap shape:** broken verification.
- **Why the evidence falls short:** it is a one-time mutation check with no stated mutation and no place to record the result, so a reviewer of spec 3 can't tell it was done or what it covered.
- **Suggested correction:** name the mutations, for example: drop the `autocomplete` attributes, show "No account with that email", and leave the account menu out of the header. Record each failing test's name in the spec 3 file.

## Verdict for every criterion

Verdicts describe the evidence the spec plans, not anything built. "Proved" means that if the behaviour broke, a planned test as described would fail.

| # | Criterion (short) | Planned evidence | Verdict | Findings |
|---|---|---|---|---|
| 1 | Sign-in page with the installation's name, to anyone not signed in | B; S | Partly proved | 21 |
| 2 | The story 1.2 administrator signs in | S, B, H, D | Proved for the exact strings typed; normalisation not shown | 9 |
| 3 | Session cookie attributes, `__Host-` plus identifier, no `Domain`, `Path=/` | S (parsed), D | Proved | — |
| 4 | Only a hash stored; a new token at each sign-in (CA-47) | S | Partly proved | 8 |
| 5 | Account menu in the existing header with name and Sign out | B | Proved | — |
| 6 | Sign out ends the session; its cookie later refused | S, B | Partly proved | 5 |
| 7 | One message whether or not the email has an account | S, B | Proved | 9 (inactive account at the route) |
| 8 | Stand-in hash; medians of 20 refusals within 100 ms (CA-58) | S | Partly proved (may pass when it shouldn't, may be flaky) | 2 |
| 9 | Wait after repeated failures; the page says how long (CA-07) | S, B | Proved (browser test needs care) | 15 |
| 10 | The same wait for an email with no account | S | Proved | — |
| 11 | Success clears the email's count | S | Proved | — |
| 12 | Counts in installation storage, both hosts, not from logs (CA-43) | S | Partly proved (no self-hosted evidence) | 17 |
| 13 | Counted before the check; attempts at once cannot all pass (CA-43) | S, D | Proved | — |
| 14 | Marker lets the owner's browser past the email wait (CA-44) | S (hand-made cookie) | Partly proved | 1, 6 |
| 15 | Cookie writes and sign-in refused without the app's origin and header | S (sign-in, sign-out) | Partly proved | 12 |
| 16 | No cross-installation sign-in or cookie | D, S | Partly proved | 4 |
| 17 | Two installations on one host, different ports, keep their own sessions | B | Partly proved (harness unspecified; marker not covered) | 6, 14 |
| 18 | Failure wording | S, B | Proved | — |
| 19 | Wait after 5 for an email or 20 for an address in 15 minutes | S | Proved | — |
| 20 | 1 minute doubling to 15 | S | Proved | — |
| 21 | Fields labelled, 16 px, fillable by a password manager | B (labels, font size, `autocomplete`, `name`) | Proved (by attributes; no real password manager) | — |
| 22 | A revision restore leaves sessions unchanged | S (as worded, can't be written) | Not proved | 13 |
| 23 | Deployed: scrypt accepted; median sign-in under 1 s over 20 (CA-08) | D | Proved, once spec 4 runs | — |
| 24 | Deployed: 25 wrong at once, at most 5 checked, 20 wait (CA-43) | D; S | Partly proved | 19 |
| 25 | A hash made on one host verifies on the other | S, H, D (fixture and probes) | Partly proved (H and D probes can't be produced as planned) | 3 |
| SR 15 | Browser tests in Chromium and WebKit iPhone; axe clean on the page and the open menu | B, CI | Proved | 14, 22 |
| D-1 | Random identifier, kept, different per installation | S, B | Partly proved | 6, 11 |
| D-2 | Count rules (i)–(v) | S (store, injected time) | Proved | — |
| D-3 | Marker attributes, 1 year, renewed, kept on sign-out | S (signature and account rows only) | Partly proved | 1, 6 |
| D-4 | 30 days; sign-in and last-use times | S | Partly proved | 18, 12 |
| D-5 | One hash at a time per isolate, set-up included | none | Not proved | 7 |
| D-6 | Fixture on all three hosts | S; H and D can't be produced as planned | Partly proved | 3 |
| D-7 | Prototype on unknown session; reviewer links open | B | Proved | 21 |
| D-8 | Wording; no Forgot password link | B, U | Proved | — |
| D-9 | Set-up done text and Sign in link | B | Partly proved (the link has no permitted assertion) | 20 |
| D-10 | Check WebKit's `Secure` handling first; HTTPS if needed; never omit `Secure` | Spec 3 task | Proved, provided spec 3 records the check's result | — |

## Count by severity

- High: 3 (findings 1–3)
- Medium: 11 (findings 4–14)
- Low: 8 (findings 15–22)
- Total: 22

## What I could not check

- Whether workerd's clock, inside the vitest test isolate, advances across an in-isolate `node:crypto` scrypt call so that a client-side interval includes the hash. Finding 2 depends on this. I did not run anything.
- Whether `@cloudflare/vitest-plugin` 1.8.4 runs test files concurrently, which affects how noisy the timing test is.
- Whether WebKit in Playwright 1.63 keeps a `Secure` or `__Host-` cookie on `http://127.0.0.1`. This is D-10's own first task.
- Whether `wrangler dev` 4.164.0 passes a client-sent `CF-Connecting-IP` through. I relied on the comment at `setup.spec.mjs:177–178` and story 1.2's passing test.
- Any deployed behaviour: memory under five simultaneous hashes on Cloudflare, routing over several connections, `wrangler tail` coverage.
- The UX specification's S-26 and section 10 (contrast, focus ring, 200% zoom), `epic-1-context.md` and `deferred-work.md`. I did not read them, so the visual criteria are judged only by the tests the spec names.
- The `.memlog.md` in the spec folder, beyond searching it for "marker". It is outside the listed files under review.
- I built, ran and changed nothing apart from writing this file.
