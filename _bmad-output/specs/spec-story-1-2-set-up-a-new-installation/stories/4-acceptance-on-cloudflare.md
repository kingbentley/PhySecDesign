---
title: 'Story 1.2, spec 4: Acceptance on Cloudflare'
type: 'chore'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '054a8be6ae2c407a12e3003d3033d418892ccb60'
review_loop_iteration: 0
story_key: '1-2-set-up-a-new-installation'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/acceptance-trace.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Specs 1–3 built and tested set-up locally, but the criteria that name a deployed Cloudflare test installation (CAP-1, CAP-4, CAP-9, CAP-10), the D-2 reason check, scrypt memory under two concurrent hashes and the Workers Paid plan are unchecked, and the deploy command cannot target a Worker name other than `site-studio`.

**Approach:** Let the deploy command take `--name <worker>`, deploy the story 1.2 build to `site-studio-test` and a second, temporary `site-studio-test-b` on the "PhySec Site Studio" test account, run checks 1–11 against their `workers.dev` addresses, record each with its request, result and time, write an evidence table for every acceptance criterion, then delete `site-studio-test-b`. D-1 to D-6 are frozen.

## Boundaries & Constraints

**Always:**
- Only account `318ca49fe7ac20168231459fc13d47f0`, with `CLOUDFLARE_API_TOKEN=placeholder-replaced-by-proxy`; only the Worker names `site-studio-test` and `site-studio-test-b`; only `workers.dev` addresses. Test data only.
- Set-up codes and the administrator password live only in mode-600 files in the scratchpad; the spec and report call them code A1, A2, B1.
- A temporary diagnostic for D-2 (logging in `callObject` and a build release override) is reverted before commit; `git diff` shows only the `--name` change and its test.
- Leave `site-studio-test` deployed with story 1.2 and set up; delete `site-studio-test-b` and confirm it is gone.

**Never:** The name `site-studio`; any other Worker, zone, DNS, KV, D1, R2 or account setting; `wrangler login`; the 100-per-hour cap against Cloudflare (server tests cover it); touching `experiments/`, the four Sites files, pre-story-1.2 tests, frozen records or `sprint-status.yaml`; committing a code; a push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Deploy, named | `node scripts/deploy-cloudflare.mjs --name W` | `wrangler deploy --name W`; secret put on W | missing value after `--name` → exit 1, nothing deployed |
| Deploy, no name | no `--name` | `wrangler deploy` as before | N/A |
| Deployed check fails | a check needs a product decision or more than a small fix | stop, record, leave code uncommitted | report options and a recommendation |

</frozen-after-approval>

## Code Map

- `site-studio/scripts/deploy-cloudflare.mjs` -- `main()` reads only `--url`; add `--name`, passed to `wrangler deploy`. `runDeploy` already takes the Worker name for `secret put` from Wrangler's output (`readDeployOutput`).
- `site-studio/tests/deploy-cloudflare.test.mjs` -- story 1.2 test; add the argument parsing case.
- `site-studio/.wrangler/deploy/config.json` -- redirects `wrangler deploy` to `dist/worker/wrangler.json` (name `site-studio`), so `--name` is required for the test Workers.
- `site-studio/server/objects/call.ts` -- D-2: `isVersionStopShown` retries on the reason; a bare `durableObjectReset` retries only idempotent calls. Diagnostic: log the caught error's message and flags.
- `site-studio/server/objects/ObjectBase.ts:164-176` -- `guardRelease` aborts with `site-studio:version-stop` only when the caller's release differs; every build has the same release (`shared/release.ts`, Vite `define` from `package.json` in `vite.config.mjs`), so the D-2 check needs two builds with different temporary releases.
- `site-studio/server/auth/password.ts` -- `scrypt` with `maxmem` 256 MiB, called through the callback API.
- `site-studio/server/api/handlers.ts:61-94` -- set-up order; `publicAddress: context.url.origin` is not readable from outside, so the diagnostic build also logs it.
- `site-studio/browser-tests/` -- Playwright 1.63.0 Chromium is preinstalled; a scratchpad script drives the deployed page.
- Workers before this spec: `site-studio-test` only (created 2026-11-20T00:41Z). Subdomain `physec-site-studio`.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/scripts/deploy-cloudflare.mjs`, `tests/deploy-cloudflare.test.mjs` -- exported `parseDeployArgs(argv)` for `--url` and `--name`; `wrangler deploy --name W` when given -- the test Workers need another name.
- [x] Deployed checks 1–11 (scratchpad scripts; all blocked, each recorded with its reason) -- record request, result and time under Implementation Notes. Follow-up 2026-11-20: run from Kevin's workstation; results recorded below. Second follow-up 2026-11-20 (17:36–17:58 UTC): HSTS, D-2 with two releases, the D-7 change-over and the full browser suite in both projects, from Kevin's workstation; recorded under "Second follow-up run".
- [x] This file -- the acceptance evidence table (all 28 criteria and the Notes rule).
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- add entries for what the checks settle or leave open.

**Acceptance Criteria:**
- Given the checks, when the spec is done, then each of 1–11 has a result or a reason it was not run, and `site-studio-test-b` is absent from the account's Worker list.
- Given the commit, when it is read, then it holds no set-up code or password and no diagnostic code.

## Implementation Notes

- Implemented and reviewed inline: this runtime has no subagent tool, so no implementation subagent or independent reviewer subagents were launched. Sprint status sync skipped on the orchestrator's instruction (`sprint-status.yaml` is managed outside this run). No human in the session (`spec_checkpoint: false`).
- **Outcome (cloud session, superseded by the follow-up run under Deployed checks): blocked by this cloud session's network, not by the code.** No deployment of story 1.2 reached Cloudflare, so none of the deployed checks could run. Two separate blocks, both in the session's egress proxy:
  1. **Asset upload refused.** `wrangler deploy` uploads the app's changed files to `POST /accounts/<id>/workers/assets/upload` with a short-lived upload token from the preceding `assets-upload-session` call in its `Authorization` header. The environment's network secret ("Cloudflare API token (Workers edit)") is injected into the `Authorization` header of every request to `api.cloudflare.com`, which most likely overwrites that upload token: the session call answered 200 and every upload answered `401 Unauthorized` (Wrangler debug log, 2026-11-20T13:40:24Z; Wrangler reported "Received a malformed response from the API" at 13:39:54Z). Story 1.2 changed 11 assets (the set-up page among them), so the upload cannot be skipped. The Worker script itself was never uploaded.
  2. **The `workers.dev` hosts are not allowed.** `GET https://site-studio-test.physec-site-studio.workers.dev/api/v1/setup/state` answered `403 Forbidden (agent proxy: no rule or network setting allows this host)` (13:39:16Z). The environment allows only `site-studio-experiments.physec-site-studio.workers.dev` among Worker addresses. Plain `http://` requests are not carried by the proxy at all (HTTPS CONNECT only), so check 6 cannot run from any cloud session.
  The proxy README says not to route around these; no environment change was proposed, because adding hosts needs a person to approve and would not fix the asset upload.
- Workers on the account, before and after (API list, 13:36:38Z and 13:41:38Z): `site-studio-test` only. `site-studio-test` is unchanged: still version `ae728b9b-001e-416c-a0a1-1d8ebf32e7da` from story 1.1, no secrets (the secrets list was empty), Durable Object namespaces `site-studio-test_Installation` and `site-studio-test_ProjectRoom`, both SQLite. `site-studio-test-b` was never created, so there was nothing to delete. No set-up code was generated: the deploy command failed before asking the state route.
- Code change: `scripts/deploy-cloudflare.mjs` gains `--name <worker>` (exported `parseDeployArgs`, `wranglerDeployArgs`); an option without a value or an unknown option now stops the command before anything is deployed (it was ignored before). Two tests in `tests/deploy-cloudflare.test.mjs` ("deploys under --name when given...", "refuses an option without a value or an unknown option..."). Story 1.1's note `npm run deploy:cloudflare -- --name site-studio-test` now works as written.

### Deployed checks (2026-11-20, UTC)

**Follow-up run, Kevin's workstation (2026-11-20, 17:06–17:20 UTC).** The cloud session above could not deploy, so Kevin ran the checks from his workstation and reported the results below; this file records them as reported (nothing was re-run from the cloud session, and nothing was committed from the workstation). Build: `origin/story/1.2` at `aaa0ab8d` (the story 1.2 build with spec 5's fixes), Wrangler 4.164.0, signed in to the "PhySec Site Studio" account (`318ca49f…`). Deployed with `node scripts/deploy-cloudflare.mjs --name site-studio-test` (installation A) and `--name site-studio-test-b` (installation B). The codes are called A1, A2, B1 and B2 here; their values are not recorded.

Deploys of A: 17:06:49 first deploy, code A1 issued, secret put, exit 0; 17:08:25 and 17:12:21 redeploys with no users, a new code each time (A2 is the 17:12:21 one); 17:19:14 redeploy after set-up: "Set-up is already complete, so no set-up code was issued", exit 0. Deploys of B: 17:07:16 code B1; 17:09:18 redeploy (that code was lost); 17:16:56 redeploy, code B2.

| # | Check | Result |
|---|---|---|
| 1 | CAP-1: code on first deploy, new code on redeploy with no users (earlier refused, counts reset), no code after set-up | **pass.** Each redeploy of A with no users issued a new code; the earlier code A1 then got 403 `setup_code_wrong`; the redeploy after set-up (17:19:14) issued no code and exited 0. That a redeploy resets the counts was not reported (server test only; see row 23). **Second run:** the reset was observed on `site-studio-test-c` (D11.2). |
| 2 | CAP-2: state route replies only open/closed | **pass.** `GET /api/v1/setup/state` on A and B: 200 `{"state":"open"}`, `state` the only key; with a query string: 400 `invalid_input`; after set-up: `{"state":"closed"}`. |
| 3 | CAP-4 and the page over `https://`, public address, two simultaneous set-ups | **pass.** `GET /` and `GET /setup` over `https://`: 200 `text/html`. Two simultaneous correct set-ups on B (17:19:04, fresh counts): one 200 `{"installationName":"Test installation B","email":"admin-b@example.test"}`, one 409 `setup_closed`. After set-up, a correct code: 409 `setup_closed`. An earlier run on A was invalid: its second request got 429 `setup_wait` (`Retry-After: 120`) because check 4's attempts were still counted; A then had one administrator and state closed. Public address: not readable from outside (the requests carried `Origin` = the `workers.dev` address and were accepted); the evidence for recording it stays the server test. |
| 4 | CAP-7: wrong code counted, `Retry-After` after 5 (the 100/hour cap is left to server tests by design) | **pass.** On A, wrong codes 1–5 (the first was the old code A1): 403 `setup_code_wrong`; the 6th: 429 `setup_wait`, `Retry-After: 60`, body `retryAfterSeconds` 60; a correct code during the wait: also 429 `setup_wait`. The 100/hour cap was not tested, by design. |
| 5 | CAP-8: other origin and missing header refused | **pass.** `POST /api/v1/setup` with no `Origin`, with `Origin: https://evil.example`, and with the installation's own origin but no `x-site-survey-design` header: each 403 `origin_refused`. |
| 6 | CAP-9 / D-1 / D-8: plain `http://` | **pass.** `GET http://…/`: 308, `Location: https://site-studio-test.physec-site-studio.workers.dev/`. `GET http://…/api/v1/setup/state` and `POST http://…/api/v1/setup`: 403 `https_required`. Whether `https://` replies carry `Strict-Transport-Security` was **not reported**. **Second run:** reported, pass (D6.2). |
| 7 | CAP-10: two installations independent | **pass.** After A's set-up, B stayed open; A2 on B: 403 `setup_code_wrong`; B's own code set B up, then both were closed. B1 was refused because B had been redeployed at 17:09:18; B2 worked. |
| 8 | D-2: does the version-stop reason reach the caller | **still open.** `site-studio:version-stop` appeared in no `wrangler tail` log (A tailed from 17:12, B from 17:17; every outcome `ok`). No build with a different temporary release was made, so a version stop was never actually triggered: the check did not exercise it. Writes are never retried after a bare reset (`call.ts`), so the failure mode is safe. **Second run:** partly shown (D8.2). |
| 9 | scrypt memory, two hashes at once | **pass, with a caveat.** In check 3's run on B both requests hashed (the accepted one 529 ms, the refused one 742 ms); no exceeded-memory or other errors, every outcome `ok`. The logs do not show directly that the two hashes overlapped in time. |
| 10 | Workers Paid plan | **pass.** The dashboard shows Paid ($5/month + usage). |
| 11 | Deferred item (d) / D-7 window: fingerprints alternating during a deploy | **not run.** No request was answered by an old copy with `setup_code_replaced`, so neither D-7's refusal on Cloudflare nor how long the window lasts was observed. **Second run:** run (D11.2): no old copy answered. |

Clean-up: `site-studio-test` left deployed with story 1.2 and set up (administrator `admin-a@example.test`). `site-studio-test-b` deleted with `wrangler delete` at 17:20.

The cloud-session result for every check above was "not run" (see **Outcome** above); the table now holds the workstation results.

### Second follow-up run (Kevin's workstation, 2026-11-20, 17:36–17:58 UTC)

Reported by Kevin and recorded here as reported; nothing was re-run from this session. Setup: a separate git worktree of `origin/story/1.2` at `aaa0ab8d` (the same build as the first run), `npm ci`, Wrangler 4.164.0 signed in to "PhySec Site Studio" (`318ca49f…`). Workers used: `site-studio-test` and a temporary `site-studio-test-c` (installation C). Codes are called C1 and C2; their values are not recorded. Commits on `story/1.2` after `aaa0ab8` (`2774fa0` and the commit recording this run) change documentation only, so the results apply to the branch's code as it stands.

| # | Check | Result |
|---|---|---|
| D6.2 | D-8: HSTS on `https://` replies, none on `http://` | **pass** (17:36:40). `https://site-studio-test.physec-site-studio.workers.dev/`: 200 with `Strict-Transport-Security: max-age=31536000`. `HEAD https://…/api/v1/setup/state`: 405 (HEAD not allowed), still with HSTS; `GET`: 200 with HSTS. `http://…/`: 308 to `https://`, no HSTS. `http://…/api/v1/setup/state` (HEAD and GET): 403, no HSTS. |
| D8.2 | D-2: a real version stop on Cloudflare | **partly shown.** `package.json` version set to 0.0.1 (not committed) and deployed to `site-studio-test` 17:37:15–17:38:00 (version `df6e6f47…`, no code issued, set-up complete); then back to 0.0.0 and redeployed 17:39:09.8–17:39:43.6 (version `1a79f83a…`, no code). `wrangler tail` ran throughout, with `GET /api/v1/status` every 200 ms from 17:38:35.9 to 17:42:36.2 (943 replies). The tail held exactly one entry with `site-studio:version-stop`, at 17:39:42: `POST https://object.internal/status - Unknown`, log `{"event":"version_stop","object":"installation","ownRelease":"0.0.1","callerRelease":"0.0.0"}`, `[ERROR] Error: site-studio:version-stop: release 0.0.1 called by 0.0.0`; the next object call at 17:39:42 was `Ok`. Every status reply was 200 (no 503 `updating`, no `Retry-After`). Release 0.0.1 answered from 17:38:35.900 to 17:39:41.827 (258 replies), then 0.0.0 from 17:39:42.073 to the end (685), never back. The first 0.0.0 reply took 1,467 ms (the others 40–70 ms), consistent with the new Worker calling the old object, getting the version stop and retrying. The loop ran 2 min 53 s after the deploy finished. `package.json` reverted; worktree clean. **What it shows:** on Cloudflare the object raises the version stop with its reason, the reason appears in the logs, and a read recovers on retry with no 503. **What it does not show:** that the caller's caught error carries the reason, because `/status` is an idempotent read and reads are retried after any reset (D-2 as amended). D-2's write rule (retry a write only when the reason is shown) is still unproven on Cloudflare; it fails safe, since a write is not retried otherwise. |
| D11.2 | D-7 / item (d): code change-over during a redeploy | **run; no old copy observed.** `site-studio-test-c` deployed 17:39:56–17:40:15 (code C1). A loop sent a wrong-code `POST /api/v1/setup` (valid body, code `WRONGWRONGWRONGWRONG`) every second from 17:42:16.0 to 17:48:50.0: 360 requests. Redeployed 17:42:19.0–17:42:28.4 (code C2, secret put). Replies: 409 `setup_code_replaced` 0; 403 `setup_code_wrong` 12; 429 `setup_wait` 348. Sequence: 17:42:16.0 403×5 (counted under C1); 17:42:22.1 429×6 (`Retry-After: 60`); 17:42:28.7 403×5 (counts restarted under C2's fingerprint, 0.3 s after the deploy finished); 17:42:34.4 429×54 (60 s); 17:43:34.1 403×1 then 429×109 (120 s); 17:45:35.1 403×1 then 429×179 (240 s, `Retry-After` counting down). The loop stopped about 6.4 min after the redeploy. After a 2-minute pause, one `POST` with C2 at 17:51:22.9: 200 `{"installationName":"Test C","email":"tester-c@example.test"}`; state then closed. **What it shows:** on this deploy no request was answered by an old Worker copy (window 0 in this run), the counts reset once, on the new fingerprint, and the wait doubled 60 → 120 → 240 s on Cloudflare. **What it does not show:** the `setup_code_replaced` refusal itself on Cloudflare (no old copy answered); that stays covered by server tests only. One run cannot show that a window never occurs. |
| B.2 | Browser suite, Chromium and WebKit (iPhone) | **pass.** Playwright 1.63.0: `npx playwright install webkit chromium` succeeded. A first run failed before any test: the `webServer` timed out after 120 s because the local `wrangler dev` answered an internal error on `/api/v1/setup/state`; the worktree path was so long that `browser-tests/.local/<project>/state/…` plus a Durable Object file name exceeded Windows' 260-character path limit (the same build with a short state folder answered `{"state":"open"}`). Rerun from a short-path worktree (`C:\Users\Kevin\AppData\Local\Temp\ss12`), same commit, `npm ci`, `npm run test:browser`, finished 17:58:23: exit 0, 34 passed (2.6 min): `chromium` 17 passed, 0 failed; `webkit-iphone` 17 passed, 0 failed. This is a local run, not CI: the CI `browser` job (browser install, run on push and pull request, trace upload) has still not run. |

Clean-up: `package.json` reverted, git clean, nothing committed or pushed from the workstation. `site-studio-test-c` deleted at 17:53:20 ("Successfully deleted"; later "This Worker does not exist on your account. [code: 10007]"). `site-studio-test` left deployed at release 0.0.0 (version `1a79f83a…`), set up.

### Still to do after the follow-up

Updated after the second follow-up run.

- D-2 write rule (check 8, narrowed): D8.2 showed the version stop and its reason on Cloudflare and a read recovering, but not that the caller's caught error carries the reason. To prove the write rule, a write path (or a temporary diagnostic in `callObject`) must show the caught error's message in the Worker during a version stop. Until then writes are not retried after a reset (safe as built).
- D-7 window (check 11, item (d)): closed as "not observed on 2026-11-20"; the `setup_code_replaced` refusal path is covered by server tests only. Nothing more is planned unless a later deploy shows old copies answering.
- ~~HSTS on a deployed `https://` reply (D-8)~~: done (D6.2).
- ~~WebKit~~: done locally (B.2: `webkit-iphone` 17/17). CI (criterion 28) remains: the `browser` job's install, run on push and pull request, and trace upload have not run (CI minutes exhausted on 2026-11-20).
- New, Windows only: `npm run test:browser` fails from a long checkout path (see `deferred-work.md`).

### Acceptance evidence (story 1.2)

S = `server-tests/` (Cloudflare's runtime, vitest), U = `tests/` (node), B = `browser-tests/setup.spec.mjs` (Chromium, run 2026-11-20 in the cloud session: 10 passed; then both projects on Kevin's workstation at `aaa0ab8`, check B.2: `chromium` 17/17 and `webkit-iphone` 17/17), D = deployed check above (Kevin's workstation, 2026-11-20; D6.2, D8.2 and D11.2 are the second run). The workstation runs were at `aaa0ab8`; later commits on `story/1.2` are documentation only. CI has not run (CI minutes exhausted on 2026-11-20), so the browser suite has passed locally in both projects but never in CI (row 28).

| # | Criterion (short) | Evidence | Result |
|---|---|---|---|
| 1 | Deploy command generates a code, supplies it as a secret, prints it once | U `deploy-cloudflare.test.mjs` "issues, supplies and prints one code when set-up is open"; D1 (first deploy of A: code issued, secret put, exit 0) | pass (stubbed Wrangler and deployed) |
| 2 | No users: the set-up page is shown | B "shows the set-up page with every field and the statement when set-up is open"; D3 (`GET /setup` over `https://`: 200 `text/html`) | pass (Chromium and WebKit, B.2; and deployed) |
| 3 | Asks for code, installation name, admin name, email, password | B same test | pass (Chromium and WebKit, B.2) |
| 4 | States that the page disappears once an administrator exists | B same test | pass (Chromium and WebKit, B.2) |
| 5 | Exactly one administrator; confirms name and email | S `setup-routes.test.ts` "creates exactly one administrator, confirms name and email, ..."; B "completes set-up and confirms ..."; D3 (B: one 200 with the installation name and email, one 409); D11.2 (C2: 200 with the installation name and email) | pass (local and deployed; Chromium and WebKit, B.2) |
| 6 | Records the public address from where set-up was opened | S "creates exactly one administrator ... records the public address ...", "records the origin the page was opened on, including a port"; D3 (set-up from the `workers.dev` origin accepted; the recorded value is not readable from outside) | pass (server test; the trace names S only) |
| 7 | Password only as scrypt N=131,072 r=8 p=1, 32 bytes, parameters beside it | S `setup-store.test.ts` "holds a salted scrypt hash with its parameters and never the password", "are pinned to scrypt N = 131,072 ..."; `password.test.ts` "uses salted scrypt ...", RFC 7914 vector | pass |
| 8 | Deploy command asks the public route, issues a code only when open | S `setup-routes.test.ts` "answers only open or closed ..."; U "prints and supplies no code when set-up is closed", "issues no code and fails when the state route never answers"; D1, D2 | pass (local and deployed) |
| 9 | Once a user exists, page and request refused, code stops working | S "refuses set-up once a user exists, and the code no longer works"; B "after set-up the set-up address says set-up is already complete ...", "a set-up sent after another has finished is refused ..."; D3 (correct code after set-up: 409 `setup_closed`), D2 (`closed`) | pass (local and deployed; Chromium and WebKit, B.2) |
| 10 | Wrong or missing code refused | S "refuses a wrong code and counts it ...", "refuses a missing code by schema ..."; `setup-rules.test.ts` "refuses a missing or empty code ..."; B "a wrong code is refused ..."; D4; D11.2 (403 `setup_code_wrong`) | pass (local and deployed; Chromium and WebKit, B.2) |
| 11 | Other origin or missing app header refused | S "refuses requests from another origin or without the app's header ..."; D5 | pass (local and deployed) |
| 12 | Two simultaneous requests create one administrator | S `setup-routes.test.ts` "creates one administrator from two correct requests sent at the same moment"; `setup-store.test.ts` "leave exactly one administrator ..."; D3 (B, 17:19:04: one 200, one 409 `setup_closed`; the logs do not show that the two reached the server at the same moment, see D9) | pass (server test decides; the deployed outcome is consistent with it) |
| 13 | Redeploy with an administrator: no code, set-up stays closed | U "prints and supplies no code when set-up is closed"; D1 (A, 17:19:14: no code, exit 0), D2 (`closed`) | pass (stubbed and deployed) |
| 14 | Redeploy with no users: new code, earlier code stops working | U "issues a new code on each deploy while set-up stays open"; S "refuses the earlier code once a new code is configured, and the new code resets the counts"; D1 (A1 refused with 403 `setup_code_wrong` after the redeploys), D7 (B1 refused after B's redeploy, B2 worked); D11.2 (C2 worked after C's redeploy) | pass (stubbed, fingerprint change and deployed) |
| 15 | Deployed: plain HTTP redirected or refused | S `https-redirect.test.ts` "redirects a request Cloudflare marks as plain HTTP ...", "sends HSTS for one year ...", `worker-first.test.ts` "routes every Cloudflare request through the Worker"; D6 (308 for the page, 403 `https_required` under `/api/`); D6.2 (HSTS `max-age=31536000` on `https://` replies, including a 405; none on `http://` replies) | pass (local and deployed, HSTS included) |
| 16 | Two installations: set-up on one leaves the other open with its own code | D7 | pass (deployed) |
| 17 | Code at least 20 characters | U "has at least 20 characters from the unambiguous alphabet" | pass |
| 18 | Password 12–128, not the email, no composition rules | S `setup-rules.test.ts` "accepts 12 and 128 ...", "has no composition rule ...", "refuses a password equal to the email in any letter case ..."; B "a field that breaks a rule is not sent ..." | pass (server; browser part Chromium and WebKit, B.2) |
| 19 | Installation name 1–80 | S "accepts 1 and 80 characters and refuses 0 and 81, naming the field" | pass |
| 20 | 5 wrong per address: 1 min doubling to 15 min; page says how long | S `setup-store.test.ts` "make an address wait 1 minute after 5, doubling ...", "keep a 15-minute wait ..."; S `setup-routes.test.ts` "... then imposes the wait with Retry-After"; B "wrong codes are counted: after five ..."; D4 (6th wrong code: 429, `Retry-After: 60`; a correct code during the wait also refused); D11.2 (waits of 60, 120 and 240 s in turn, `Retry-After` counting down) | pass (local; Chromium and WebKit, B.2; deployed first wait and doubling 60 → 120 → 240 s; the 15-minute cap server tests only) |
| 21 | 100 wrong per hour: all refused until the hour passes | S "refuse every address after 100 within a rolling hour ..."; deliberately not run against Cloudflare | pass |
| 22 | Counts in installation storage, raised before the check, hold across copies, restart, simultaneous requests | S "are raised before the check and hold across an object restart", "count every one of several attempts sent at once"; D3/D4 (A's counted attempts still applied in a later run: 429, `Retry-After: 120`) | pass locally (restart, simultaneous) and across requests on Cloudflare; "across Worker copies" holds by construction (one installation object keeps the counts) but was **not observed**: no check showed which Worker copy answered |
| 23 | New code resets the count; waiting message says redeploying issues a fresh code | S "start again when a new code's fingerprint arrives", "refuses the earlier code once a new code is configured ..."; B "wrong codes are counted ..."; D11.2 (after C's redeploy, five 403s again before the next wait: counts restarted under C2's fingerprint) | pass (local; Chromium and WebKit, B.2; reset after a redeploy observed on Cloudflare) |
| 24 | Revision restore leaves accounts and installation name unchanged | S "live only in the installation object, which offers no restore ..." | pass |
| 25 | Playwright pinned, built app on local Cloudflare runtime, Chromium + WebKit iPhone, empty storage | `package.json` pins 1.63.0 / 4.14.0; `browser-tests/playwright.config.mjs`, `serve.mjs`; Chromium run in the cloud session; B.2 (both projects, empty storage per run, on Kevin's workstation) | pass (Chromium and WebKit, B.2, locally; on Windows only from a short checkout path, see `deferred-work.md`) |
| 26 | Browser test completes set-up; another shows a wrong code refused with the wait | B "completes set-up ...", "wrong codes are counted ..." | pass (Chromium and WebKit, B.2) |
| 27 | axe: no serious or critical violation | B: six tests run the axe helper (`expectAccessible`) on the form, field-error, wrong-code, wait, success and already-complete states; spec 3's broken-page evidence (contrast change caught) | pass (Chromium and WebKit, B.2) |
| 28 | CI installs browsers, runs on push and PR, keeps a trace on failure | `.github/workflows/test.yml` job `browser`; `trace: "retain-on-failure"` | not run: CI has not run (CI minutes exhausted on 2026-11-20). The suite itself passed locally in both projects (B.2), but the CI job's browser install, run on push and pull request, and trace upload are unproven |
| — | Local set-up code is a local secret, never committed | `.gitignore` (`.dev.vars`, `browser-tests/.local/`); `serve.mjs` writes a mode-600 file per run; `git ls-files` lists no `.dev.vars`, `git grep` finds no code | pass |

**Definition of done: not met.** Story 1.2's definition of done is not met. What remains:
1. Criterion 28: the CI `browser` job has never run (CI minutes exhausted on 2026-11-20); the browser suite has passed only locally (B.2).
2. Criterion 22, "across Worker copies": holds by construction (one installation object keeps the counts) but was not observed; D11.2 saw no old copy answer.
3. SPEC.md's D-2 constraint ("once a deployed installation shows that reason reaches the caller"): partly shown (D8.2). The version stop and its reason appear on Cloudflare and a read recovers, but the caller's caught error was not shown to carry the reason, so the write rule is unproven; it fails safe (writes are not retried after a reset).

Not blocking but recorded: check 9's two hashes were not shown to overlap; the D-7 `setup_code_replaced` refusal is covered by server tests only (not observed on Cloudflare on 2026-11-20); `npm run test:browser` fails on Windows from a long checkout path.

Summary (29 rows): 27 pass with nothing left (1–21, 23–27 and Notes; 6's recorded address is not readable deployed and 12's simultaneity is decided by the server test, neither needed by the trace); 1 passes with a part not observed (22: "across Worker copies" by construction only); 1 has no evidence (28: CI not run, CI minutes exhausted). Outside the table, D-2's write rule (check 8) is partly shown and stays open in narrowed form; D-7's window (check 11, item (d)) was not observed on 2026-11-20 and is closed with the refusal path left to server tests.

## Spec Change Log

- 2026-11-20, follow-up (`bmad-build`, documentation only): recorded the deployed checks Kevin ran from his workstation at 17:06–17:20 UTC against `aaa0ab8d`, replacing the "not run" results of the cloud session; rewrote the evidence table and its summary (from 7 / 8 / 12 / 2 to 15 / 1 / 12 / 1); replaced the "To finish" instructions (now carried out) with "Still to do after the follow-up". The frozen Intent is unchanged; its "Always" rule on naming the codes is followed (A1, A2, B1, B2). Tasks unchanged. No code, test or `sprint-status.yaml` change (sprint sync skipped on the orchestrator's instruction).

- 2026-11-20, second follow-up (`bmad-build`, documentation only): recorded Kevin's second workstation run (17:36–17:58 UTC, `aaa0ab8d`): D6.2 (HSTS), D8.2 (a real version stop with two releases), D11.2 (code change-over during a redeploy) and B.2 (browser suite, both projects). Pointers added to checks 1, 6, 8 and 11 of the first run; "Still to do after the follow-up" rewritten; evidence rows 2–5, 9, 10, 14, 15, 18, 20, 23, 25–28 and the legend updated; summary recomputed (from 15 / 1 / 12 / 1 to 27 / 1 / 0 / 1) with the definition of done stated first. The frozen Intent is unchanged; codes are named C1 and C2 and not recorded. Tasks: one line added to the deployed-checks task. No code, test or `sprint-status.yaml` change (sprint sync skipped on the orchestrator's instruction).

## Review Triage Log

Reviewers run inline by the implementing agent (no subagent tool), so not independent. Layers: blind and edge-case on the code diff; verification-gap on the code and on the evidence table.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| 1 | blind | Before this change an unknown option was ignored, so `npm run deploy:cloudflare -- --dry-run` deployed for real | false (as a defect of this diff) | the change now refuses it before anything is deployed; tested ("refuses an option ... unknown option") |
| 2 | blind | `--name=foo` (equals form) is refused as unknown | low | rejected: the message names the accepted form; supporting it adds a branch for a form nobody documented |
| 3 | blind | A repeated option (`--name a --name b`) silently keeps the last | low | rejected: unlikely, and the deploy output names the Worker it deployed to |
| 4 | edge | `--name` with a value starting `--` or blank | false | refused (`needs a value`), tested with `--name --url ...` and `--name " "` |
| 5 | verification-gap | `main()`'s wiring of `name` into `wranglerDeployArgs` runs in no test: dropping it would deploy to `site-studio` and pass every test | low | rejected as a new item: it is the open deferred item "the deploy command's own wiring ... runs in no automated test", which the deployed checks close; still open (they did not run). **Follow-up:** closed by D1 and D7 (deploys to `site-studio-test` and `site-studio-test-b` by `--name`) |
| 6 | verification-gap | Evidence row 27 said every browser test runs axe; six of ten do | low | patch: row names the six states |
| 7 | verification-gap | Evidence row 18 said "pass" though its browser part is Chromium only | low | patch: row says WebKit not run |
| 8 | verification-gap | Evidence row 22 counted "across Worker copies" as passed with no test observing more than one Worker copy | medium | patch: row and summary say it holds by construction and was not observed on Cloudflare |
| 9 | verification-gap | Every row naming D, plus 16 and 28, lacks its deciding evidence | medium | defer: recorded in the table and in `deferred-work.md` (deployed acceptance not run; CI and WebKit already deferred by spec 3). **Follow-up:** the D rows and 16 now have it; 28 stays open |

**Follow-up review (2026-11-20).** One layer, verification-gap, on the updated evidence table and Deployed checks, run inline by the agent that wrote them (no subagent tool), so not independent. Blind and edge-case layers skipped: the follow-up changes no code.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| F1 | verification-gap | Check 1's description had dropped "counts reset" from the original check, so an unobserved part of CAP-1 read as passed | medium | patch: description restored; the row says the reset was not reported and points to row 23 |
| F2 | verification-gap | Row 12 counted D3 as deployed proof of simultaneity, but one 200 and one 409 is also what two sequential requests give, and the logs do not show overlap (D9's caveat) | low | patch: row says the server test decides and the deployed outcome is only consistent with it |
| F3 | verification-gap | Row 7 cited D9 (memory) as evidence for the hash's parameters, which D9 does not observe | low | patch: D9 removed from row 7 (it stays the evidence for the scrypt-memory item) |
| F4 | verification-gap | Check 3 paraphrased the reported "fresh counts" as "no counted attempts on B" | low | patch: the reported wording is used |
| F5 | verification-gap | The later `Retry-After: 120` on A might show the 1-minute wait doubling on Cloudflare (row 20) | maybe-false | rejected: not claimed; the report does not say which attempt number it answered, so the doubling stays server-test evidence |
| F6 | verification-gap | Row 15 is counted as fully passing although D-8's HSTS header on a deployed reply was not reported | false | the criterion is "plain HTTP redirected or refused", which D6 shows; HSTS is a CAP-9 clause covered by the server test, and the row and "Still to do" say it was not reported |

**Second follow-up review (2026-11-20).** One layer, verification-gap, on the second-run records, the updated evidence table and the summary, run inline by the agent that wrote them (no subagent tool), so not independent. Blind and edge-case layers skipped: no code changed.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| G1 | verification-gap | D8.2 could be read as proving D-2: the reason appears in the tail, but that entry is the object's own error log, and the caller only retried a read, which it does after any reset | medium | patch: D8.2, "Still to do", the summary and `deferred-work.md` say "partly shown" and name what would prove the write rule |
| G2 | verification-gap | D11.2's zero 409s could be read as showing D-7 on Cloudflare or as showing no window ever occurs | medium | patch: D11.2 says the refusal was not exercised, the window was 0 in this one run, and one run cannot show none occurs; item (d) closed as "not observed", not "shown" |
| G3 | verification-gap | Rows 2–5, 9, 10, 18, 20, 23, 25–27 now pass in WebKit from a local run, while the trace's WebKit expectation sits beside CI; a local pass could hide a CI-only failure (browser install, headless WebKit on Linux) | low | patch: row 28 and the definition of done keep CI open and say the suite passed only locally; the WebKit rows cite B.2 as a workstation run |
| G4 | verification-gap | Row 22 might count D11.2 as "across copies" evidence | false | not claimed: row 22 unchanged; D11.2 saw no old copy |
| G5 | verification-gap | Row 23's deployed reset rests on the inference that five 403s after the redeploy mean counts restarted, not that the wait simply expired | low | kept: the 429 wait was `Retry-After: 60` from 17:42:22.1, so it had not expired at 17:42:28.7; the 403s there come only from fresh counts under C2's fingerprint, as reported |
| G6 | verification-gap | B.2 ran at `aaa0ab8`, not at the branch head | false | the commits after it (`2774fa0` and this one) change documentation only (`git diff aaa0ab8 HEAD --stat` lists only the spec and `deferred-work.md`); the legend says so |

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server && npm run build && npm run test:sites && npm run smoke:selfhost && npm run test:browser -- --project=chromium --trace off` -- all exit 0
