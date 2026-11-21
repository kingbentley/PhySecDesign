---
title: 'Story 1.3, spec 4: Acceptance on Cloudflare'
type: 'chore'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: 'e7d405985a4b1f90584874bcfeb819ff72b40dd7'
review_loop_iteration: 0
story_key: '1-3-sign-in-and-sign-out'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/4-acceptance-on-cloudflare.md'
---

> Runs after specs 1 to 3. Story 1.2's spec 4 found the cloud session could not reach Cloudflare; plan to run from Kevin's workstation.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Five of story 1.3's criteria name a deployed Cloudflare test installation, which local runs cannot prove.

**Approach:** Deploy the build to two test Workers on the "PhySec Site Studio" account, complete set-up on each with different administrator emails, deploy the `deploy/probe/` Worker spec 2 built, run the checks below in order, and record the results in this file and `deferred-work.md`. Covers CAP-10 across Workers, CAP-12, CAP-13's Cloudflare part, and the deployed parts of CAP-2 and CAP-3.

## Boundaries & Constraints

**Always:** Test account only. B's administrator uses a different email from A's; record both emails, never a password or set-up code (V-4). Checks 3 and 4 send no cookies (A-6). Extra Workers and the probe deleted afterwards.

**Never:** Application changes; a failure found here goes back to its spec as a follow-up. Deploying the probe is allowed; it is a test Worker, not the app (V-3).

## Checks

Run in this order; check 4 is the last check against A (V-19).

| # | Check | Pass |
|---|-------|------|
| 1 | Sign in on `https://` to test Worker A | 200; session `Set-Cookie` `__Host-` with A's identifier, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000`, no `Domain`; marker `Set-Cookie` likewise with `Max-Age=31536000` |
| 2 | scrypt on Cloudflare (R9) | no platform error in `wrangler tail` across the checks |
| 3 | 20 sign-ins in a row, timed at the client, no cookies kept | median under 1 s (CA-08) |
| 5 | A's administrator email and password on Worker B | refused with the one message |
| 6 | A's session cookie sent to B | not signed in on B |
| 6b | A's token sent under B's cookie name | not signed in on B (V-4) |
| 7 | Sign out on A, then the old cookie on A's session read and on sign-out | both 200, "not signed in", each with a clearing `Set-Cookie` (D-7 amended, D-13) |
| 8 | `deploy/probe/` on the test account: the fixture and a wrong password | the fixture verifies, the wrong password does not; probe deleted afterwards (D-6, V-3) |
| 9 | 25 wrong sign-ins for an email with no failures, each carrying a valid marker for it, at once over 25 connections | exactly 5 checked against the password, 20 receive the wait (A-6, D-2 amended) |
| 4 | After confirming A's email has no failures: 25 wrong sign-ins for it at once, no cookies, over 25 separate connections (`node:https` agents, keep-alive off) | exactly 5 `signin_failed` and 20 `signin_wait` (CA-43, V-19) |

Check 9 runs on a fresh email key: use B, or wait for A's counts to clear, and record which.

</frozen-after-approval>

## Verification

Record each check's outcome, times, Worker names and the two administrator emails here; add or close entries in `deferred-work.md`.

### Run of 2026-11-21 02:35–02:45 UTC (2026-11-20, 20:35–20:45 local, UTC−6), Kevin's workstation

**Outcome: every check passed** (1, 2, 3, 5, 6, 6b, 7, 8, 9, 4), with the caveats in the table. The Workers and the probe were deleted afterwards and the account's Worker list is back to what it was.

- **Who and how.** Run by a Claude Code session started by the story 1.3 orchestrator session, with `bmad-build` (this spec was `ready-for-dev`, so step 3). The session ran everything itself; see Implementation Notes.
- **Build.** Branch `story/1.3` at `e7d405985a4b1f90584874bcfeb819ff72b40dd7` (specs 1 to 3), working tree clean apart from untracked files outside `site-studio/`. `npm run build`, then `node scripts/deploy-cloudflare.mjs --name <worker>`. Node 24.18.0, and the project's own Wrangler (`site-studio/node_modules`, 4.164.0, through `npx`).
- **Account.** `wrangler whoami` (02:35 UTC) showed one account: "PhySec Site Studio" (`318ca49fe7ac20168231459fc13d47f0`). Workers before the run (Cloudflare API list, 02:36 UTC): `site-studio-test` only (created 2026-11-20T00:41:27Z, modified 2026-11-20T17:39:41Z). It was not touched.
- **Workers created in this run.**
  - A = `site-studio-test-13a`, deployed 02:37:32–02:37:42 (version `a83d566c-6b29-4280-b1e8-63495488d1b6`), set up 02:40:09 with administrator **`admin-a@example.com`** ("Administrator A", installation "Test installation A").
  - B = `site-studio-test-13b`, deployed 02:37:42–02:37:51 (version `02b3a200-342e-433f-9965-a2ba1ed8feab`), set up 02:40:10 with administrator **`admin-b@example.com`** ("Administrator B", installation "Test installation B").
  - Probe = `site-studio-password-probe`, built and deployed by Wrangler from the same commit with `npx wrangler deploy --config deploy/probe/wrangler.jsonc`. That file's compatibility date and flags (2026-11-01, `nodejs_compat`) equal the app's in `deploy/cloudflare/wrangler.jsonc`. Deployed 02:40:21–02:40:33 (version `1d04ec4c-e8f8-46c1-9adc-eba1b0110c1a`).
  - Each set-up code went from the deploy command's output into a scratch file and from there into the set-up request. The administrator passwords were random and kept only in scratch files. None of these values was displayed or recorded, and the scratch files were deleted after the run. The scratch folder is the session's own folder under Kevin's Windows profile. The script's `mode: 0o600` has no effect on Windows, so the files' privacy came from that folder's access rights, not from the mode.
- **Scripts.** `experiments/story-1-3-cloudflare-acceptance/checks.mjs` (throwaway, not part of the app). Every request goes over its own `node:https` agent with keep-alive off, carries `Origin` set to the Worker's address and the app header, and sends cookies only where a check names them. Output prints cookie names with the identifier shortened and the value replaced by `<value>`. The committed file is the version after the check 5 fix (see check 5). Checks 9 and 4 ran with it; checks 1 to 7 ran with the earlier version, which differed only in the refusal-body paths. In the burst lines, the time after "sent" is when the first reply arrived, not when the requests went out (they went out together, a few milliseconds after the command's start line).
- **Tail.** `wrangler tail --format json` on A and B from before set-up (02:40:08) to after check 4 (02:42:30). It was kept in scratch only for check 2's pass/fail fact and deleted afterwards.

| # | Time (UTC) | Result | Evidence |
|---|---|---|---|
| 1 | 02:40:54 | **pass** | `POST https://…13a…/api/v1/session/sign-in` with A's email and password: 200 `{"name":"Administrator A"}` (865 ms), exactly two `Set-Cookie`. Session: `__Host-ssd-<id>`, `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`, no `Domain`. Marker: `__Host-ssd-m-<id>`, same attributes with `Max-Age=31536000`, no `Domain`. Both carry the same identifier, the one A's reply issued, which differs from B's (seen at 02:41:10). The new cookie then read on A as `{"signedIn":true,"name":"Administrator A",…}`. |
| 2 | 02:40:08–02:42:30 | **pass** | Tail of A: 87 events, tail of B: 46 events, every outcome `ok`, no exceptions, no error-level logs, no memory-limit or other platform error. The events are Worker requests plus some of the installation object's internal calls. For A: 47 sign-in, 3 session-read, 2 sign-out and 1 set-up requests, plus 34 object calls (`signInAttempt` 16, `completeSignIn` 11, `sessionInfo` 3, `endSession` 2, `setupAttempt` 1, `createFirstAdministrator` 1). That is fewer object calls than were made, so they are not a full count. Every sign-in request the script sent appears (A 1 + 20 + 1 + 25 = 47, B 1 + 1 + 25 = 27), each `ok`, so every scrypt check (real and stand-in) and both set-up hashes ran without a platform error (R9). |
| 3 | 02:40:55–02:41:07 | **pass** | 20 sign-ins on A one after another, each over a new connection with no cookies: all 200. Times at the client: min 453 ms, **median 524 ms**, max 880 ms (under 1 s, CA-08). Each includes the TLS handshake of a new connection. |
| 5 | 02:41:08 | **pass** | A's email and password on B: 401 `{"error":{"code":"signin_failed","message":"That email and password do not match."}}`, no `Set-Cookie`. The script's first two assertions printed FAIL because the script read `code` at the top level instead of under `error`. The pass rests on the printed reply, read by hand, not on the script's assertions. The script was fixed before checks 9 and 4, and check 5 was not re-sent, so B's count for A's email stayed at one failure. |
| 6 | 02:41:09 | **pass** | A's session cookie on `GET https://…13b…/api/v1/session`: 200 `{"signedIn":false,"installationName":"Test installation B"}`, with no `Set-Cookie`, so B ignores and never clears a cookie named for another installation (criterion 17). The same cookie then still read as signed in on A. |
| 6b | 02:41:11 | **pass** | Prepared by one sign-in of B's administrator on B (02:41:10, 200), which gave B's cookie names and a marker. A's token under B's session cookie name, sent to B: 200 `{"signedIn":false,…}` with a clearing `Set-Cookie` for B's own name (`=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`) (V-4). |
| 7 | 02:41:12 | **pass** | Sign-out on A with check 1's cookie: 200 `{"signedIn":false}`, clearing `Set-Cookie` (`Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`), no marker `Set-Cookie`. The old cookie then got 200 `{"signedIn":false,…}` on the session read and 200 `{"signedIn":false}` on sign-out, each with the clearing `Set-Cookie` (D-7 amended, D-13). |
| 8 | 02:41:55; deleted 02:41:56–02:42:04 | **pass** | `GET https://site-studio-password-probe…/verify`: 200 `{"fixture":true,"wrongPassword":false,"runtime":"Cloudflare-Workers"}`. The committed fixture made under workerd verifies on Cloudflare, and the wrong password does not (D-6, CAP-13). `wrangler delete --name site-studio-password-probe`: "Successfully deleted". |
| 9 | 02:42:28 | **pass, with a caveat** | Run on **B** (a fresh email key, as the spec allows). `admin-b@example.com` had no failures: the run's output shows every request sent to B, and that email's only attempt before the burst was the successful sign-in at 02:41:10. Check 5's failure was for A's email. No confirming sign-in was sent right before the burst, unlike check 4. Then 25 wrong sign-ins for it at once over 25 separate connections, each carrying only B's marker cookie from 02:41:10: **5 × 401 `signin_failed`, 20 × 429 `signin_wait`** (`Retry-After: 60`), no `Set-Cookie`. Caveat: these replies would be the same without a marker, because five marker failures also raise the email count to its limit. The run shows the limit holds for marker holders at once on Cloudflare. It does not show which count imposed the wait; the server tests (spec 1, spec 2) decide that. |
| 4 | 02:42:30 | **pass** | A's email count was cleared first by a correct sign-in (02:42:30, 200), since a success clears the email's count; A had had no failures since set-up. Then 25 wrong sign-ins for `admin-a@example.com` at once, **no cookies**, over 25 separate `node:https` agents with keep-alive off: **exactly 5 × 401 `signin_failed` and 20 × 429 `signin_wait`** (`Retry-After: 60`), no `Set-Cookie` (CA-43, V-19). This was the last request to A. |

"Checked against the password" in checks 9 and 4 is read from the replies: a `signin_failed` comes only after the Worker's scrypt check and the completing call, and a `signin_wait` only from the object's count before any check. The tail's object-call entries are not a complete count, so they were not used for this.

**Clean-up.** `wrangler delete --name site-studio-test-13a` (02:44:11–02:44:19) and `--name site-studio-test-13b` (02:44:19–02:44:26): "Successfully deleted" each. The Cloudflare API list after clean-up (02:44 UTC) shows `site-studio-test` only, with the same created and modified times as before. The private scratch files (deploy logs with the codes, passwords, cookies, tails) were deleted.

**Not run or not shown.**
- The browser steps of the success signal (the sign-in page, the account menu) were not driven on Cloudflare. This spec's checks are API checks; the page and menu are covered by spec 3's browser tests in local runs. Kevin accepted that local coverage on 2026-11-20 ("Accept local coverage"), so no deployed browser run is planned.
- Check 9 does not tell the marker's count apart from the email's (see its row). So CAP-12's last sentence is met as the spec's pass column words it (5 checked, 20 waits), but the deployed run does not show that the marker's count is what limits it. The server tests do (`signin-store.test.ts`, `signin-routes.test.ts`). Kevin accepted the server-test coverage for this on 2026-11-20 ("Accept the server-test coverage for check 9's marker count"), so no deployed CA-44 check is planned.
- D-5's memory claim (five hashes at once without the queue) stays unproven, as SPEC.md plans. Check 9 and check 4 ran five real checks in one burst through the queue without error, which says nothing about running without it.

### Follow-up after the code review (2026-11-21, 18:22–18:30 UTC, Kevin's workstation)

Purpose: the code review added `enable_request_signal` to the compatibility flags and made the start-up reads fail closed (`code-review.md`) after the run above. Kevin asked for a short deployed check before merging. Run by this session, with the same rules as above.

- **Account and build:** `wrangler whoami` showed only "PhySec Site Studio". Before the run the Worker list held only `site-studio-test`, unchanged since 2026-11-20T17:39:41Z. The build is `story/1.3` at `548ca1e`.
- **Worker:** a temporary `site-studio-test-13c`, deployed 18:23:50–18:24:07 with `node scripts/deploy-cloudflare.mjs --name site-studio-test-13c` (version `673b22c5-fea1-4fe6-b1fb-35ad1b2b9b8a`). Cloudflare accepted the build with `nodejs_compat` and `enable_request_signal`, with no error. It was set up at 18:27:06 with administrator **`admin-c@example.com`** ("Administrator C", installation "Test installation C"). The set-up code and password were held only in scratch files, never shown or recorded, and deleted afterwards.
- **Scripts:** throwaway, in the session's scratch folder, not committed.

| Time (UTC) | Check | Result |
|---|---|---|
| 18:27:06 | Set-up | 200 with the installation's name and email |
| 18:27:07 | `GET /` | 200 `text/html` |
| 18:27:07 | Session read with no cookie | 200 `{"signedIn":false,"installationName":"Test installation C"}` |
| 18:27:07 | Wrong password | 401 `signin_failed` with the one message |
| 18:27:08 | Sign-in | 200 `{"name":"Administrator C"}`. The session cookie (`Max-Age=2592000`) and the marker (`Max-Age=31536000`) are both `HttpOnly; Secure; SameSite=Lax; Path=/` with no `Domain`, and carry the same identifier |
| 18:27:08 | Session read with the cookie | signed in, as "Administrator C" |
| 18:27:08 | Sign-out | 200 `{"signedIn":false}`, with exactly one `Set-Cookie`, clearing the session cookie (`Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`) |
| 18:27:08 | The old cookie on the session read | not signed in, with the clearing `Set-Cookie` |
| 18:29:09–18:29:10 | With `wrangler tail` running: a session read, two wrong sign-ins (401 `signin_failed`), a sign-in the client abandoned after 50 ms, and another session read | The tail held 10 events, every outcome `ok`, no exceptions and no error-level logs. The abandoned sign-in did not appear in the tail; it most likely never reached the Worker within 50 ms. |

**What this shows:** Cloudflare deploys and runs the review build with `enable_request_signal`. Set-up, the one sign-in refusal, sign-in with both cookies, the session read, sign-out and the replayed cookie behave as in the first run.

**What it does not show:**
- A request aborted *while waiting in the hash queue* on Cloudflare. That needs the queue held busy, which a single client cannot arrange; the route tests cover it.
- The fail-closed start-up in a browser on Cloudflare. That is page logic, covered by the unit and browser tests; the deployed API replies above are the declared ones the page expects.
- The first tail missed the main run because it connected too late, so the platform-error check rests on the second, shorter tailed run.

**Clean-up:** `wrangler delete --name site-studio-test-13c` (18:29:41–18:29:47) answered "Successfully deleted". The Worker list afterwards holds only `site-studio-test`, with the same times as before, and the scratch files holding the code and logs were deleted.

## Implementation Notes

- **For Kevin to note (a deviation from the workflow, on this session's judgment, not authorised by anyone).** Step 3 says to hand the spec to an implementation subagent with nothing added. This session did the run itself instead, because the orchestrator's operating rules for the account go beyond this spec: the account check, the before and after Worker lists, touching only Workers created in the run, no recorded secrets, and keeping the tail only as check 2's fact. The dispatch rule forbids passing those to a subagent.
- Sprint status not synced: the orchestrator said to leave `sprint-status.yaml` alone.
- No application file changed. The only new code is the throwaway script under `experiments/`.

## Review Triage Log

Three context-free reviewer subagents (blind, edge-case, verification-gap) read the diff since `e7d4059`; the edge-case layer also read this file afterwards. No code under `site-studio/` changed. The Workers were deleted, so no check was re-run, and the committed script is left as it ran checks 9 and 4. Findings on the script's robustness are rejected when they would not change any recorded result.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| 1 | blind | The "resolved" `deferred-work.md` entry claims more than the run showed (marker count, success signal) | medium | patch: entry now "narrowed", naming both open parts |
| 2 | blind | The browser part of the success signal has no deferred entry | low | patch: named as open part (2) of that entry, for Kevin to accept or run |
| 3 | blind | Progress should go as `update` lines under existing entries (D-5, story 1.2 scrypt items) | low | patch: update lines added under the three entries |
| 4 | blind | Check 9 has no confirming sign-in before the burst | low | rejected (cannot re-run): the run output lists every request to B; the row now says how "no failures" was established and that no confirming sign-in was sent |
| 5 | blind, edge | Check 9 cannot tell the marker count from the email count | low | patch: row and "Not run or not shown" say the pass column is met but the marker path is shown only by server tests (verification-gap layer confirmed `signin-store.test.ts:383, 408, 588`, `signin-routes.test.ts:467`); the deferred entry leaves a deployed CA-44 check to Kevin |
| 6 | blind | The committed script is not the one that printed check 5's FAIL lines | low | patch: the record says which version ran which checks and that check 5's pass rests on the printed reply |
| 7 | blind, edge | The burst's "sent" time is the first reply's arrival | low | patch: record says so (script left as run) |
| 8 | blind | `burst()` prints but does not assert no `Set-Cookie`, `Retry-After` and no other reply kinds | false (as a gap in the evidence) | the printed counts object has exactly two keys summing to 25, `any Set-Cookie: false` and `Retry-After` 60, recorded as printed |
| 9 | blind | Tail event counts (87, 46) not reconciled with requests sent | low | patch: check 2 row breaks the 87 down by path and says object-call entries are incomplete |
| 10 | blind | Which Wrangler binary was used | low | patch: the project's own 4.164.0 through `npx` |
| 11 | blind, edge | `mode: 0o600` has no effect on Windows | low | patch: record says privacy came from the scratch folder's access rights |
| 12 | blind | Account ID and `workers.dev` subdomain committed | false | neither is a secret; both are already in story 1.2 spec 4's committed record |
| 13 | blind | How the probe was built is not recorded | low | patch: command, commit and the equal compatibility settings recorded |
| 14 | blind | Skipping step 3's subagent hand-off should be flagged for Kevin | low | patch: Implementation Notes mark it for Kevin to note |
| 15 | blind | UTC and local dates mixed | low | patch: heading and `deferred-work.md` give the local date (2026-11-20, UTC−6) beside UTC |
| 16 | edge | No request timeout or response-error handler | low | rejected: throwaway script run once; a hang would show, and none happened |
| 17 | edge | `Promise.all` loses the other replies if one request fails | low | rejected: none failed; a failure would throw loudly |
| 18 | edge | Re-running `setup-x` overwrites the saved password | low | rejected: run once; the Workers are deleted |
| 19 | edge | A deploy log with several codes would send the first | false | each deploy's output was written to a fresh file (`*>`), one code each |
| 20 | edge | `parseSetCookie` mishandles a pair without `=` | low | rejected: every Set-Cookie line printed has `=` |
| 21 | edge | Duplicate cookie kinds: the last silently wins | low | rejected: check 1 asserts exactly two lines, one of each kind |
| 22 | edge | Missing state gives a TypeError instead of a clear message (several commands) | low | rejected: loud failure, did not occur |
| 23 | edge | `check8` with no URL or a path | low | rejected: run once with the bare origin |
| 24 | edge | Check 8 does not assert the runtime is Cloudflare | low | rejected: the reply's `runtime: "Cloudflare-Workers"` is recorded in check 8's row |
| 25 | edge | "A's identifier" is inferred, not independently checked | low | patch: wording now "the one A's reply issued, which differs from B's" |
| 26 | verification-gap | No gaps; check 9's marker gap already filed and covered by server tests; counts 47 and 27 add up | — | noted |
