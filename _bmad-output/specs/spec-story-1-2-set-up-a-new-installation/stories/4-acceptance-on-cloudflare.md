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
- [x] Deployed checks 1–11 (scratchpad scripts; all blocked, each recorded with its reason) -- record request, result and time under Implementation Notes.
- [x] This file -- the acceptance evidence table (all 28 criteria and the Notes rule).
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- add entries for what the checks settle or leave open.

**Acceptance Criteria:**
- Given the checks, when the spec is done, then each of 1–11 has a result or a reason it was not run, and `site-studio-test-b` is absent from the account's Worker list.
- Given the commit, when it is read, then it holds no set-up code or password and no diagnostic code.

## Implementation Notes

- Implemented and reviewed inline: this runtime has no subagent tool, so no implementation subagent or independent reviewer subagents were launched. Sprint status sync skipped on the orchestrator's instruction (`sprint-status.yaml` is managed outside this run). No human in the session (`spec_checkpoint: false`).
- **Outcome: blocked by this cloud session's network, not by the code.** No deployment of story 1.2 reached Cloudflare, so none of the deployed checks could run. Two separate blocks, both in the session's egress proxy:
  1. **Asset upload refused.** `wrangler deploy` uploads the app's changed files to `POST /accounts/<id>/workers/assets/upload` with a short-lived upload token from the preceding `assets-upload-session` call in its `Authorization` header. The environment's network secret ("Cloudflare API token (Workers edit)") is injected into the `Authorization` header of every request to `api.cloudflare.com`, which most likely overwrites that upload token: the session call answered 200 and every upload answered `401 Unauthorized` (Wrangler debug log, 2026-11-20T13:40:24Z; Wrangler reported "Received a malformed response from the API" at 13:39:54Z). Story 1.2 changed 11 assets (the set-up page among them), so the upload cannot be skipped. The Worker script itself was never uploaded.
  2. **The `workers.dev` hosts are not allowed.** `GET https://site-studio-test.physec-site-studio.workers.dev/api/v1/setup/state` answered `403 Forbidden (agent proxy: no rule or network setting allows this host)` (13:39:16Z). The environment allows only `site-studio-experiments.physec-site-studio.workers.dev` among Worker addresses. Plain `http://` requests are not carried by the proxy at all (HTTPS CONNECT only), so check 6 cannot run from any cloud session.
  The proxy README says not to route around these; no environment change was proposed, because adding hosts needs a person to approve and would not fix the asset upload.
- Workers on the account, before and after (API list, 13:36:38Z and 13:41:38Z): `site-studio-test` only. `site-studio-test` is unchanged: still version `ae728b9b-001e-416c-a0a1-1d8ebf32e7da` from story 1.1, no secrets (the secrets list was empty), Durable Object namespaces `site-studio-test_Installation` and `site-studio-test_ProjectRoom`, both SQLite. `site-studio-test-b` was never created, so there was nothing to delete. No set-up code was generated: the deploy command failed before asking the state route.
- Code change: `scripts/deploy-cloudflare.mjs` gains `--name <worker>` (exported `parseDeployArgs`, `wranglerDeployArgs`); an option without a value or an unknown option now stops the command before anything is deployed (it was ignored before). Two tests in `tests/deploy-cloudflare.test.mjs` ("deploys under --name when given...", "refuses an option without a value or an unknown option..."). Story 1.1's note `npm run deploy:cloudflare -- --name site-studio-test` now works as written.

### Deployed checks (2026-11-20, UTC)

| # | Check | Result |
|---|---|---|
| 1 | CAP-1: code on first deploy, new code on redeploy with no users (earlier refused, counts reset), no code after set-up | not run: deploy blocked (asset upload 401), state route host blocked |
| 2 | CAP-2: state route replies only open/closed | not run: host blocked |
| 3 | CAP-4 and the page over `https://`, public address, two simultaneous set-ups | not run: no deployment, host blocked |
| 4 | CAP-7: wrong code counted, `Retry-After` after 5 (the 100/hour cap is left to server tests by design) | not run: host blocked |
| 5 | CAP-8: other origin and missing header refused | not run: host blocked |
| 6 | CAP-9 / D-1: plain `http://` gets 308 | not run: host blocked, and the proxy carries no plain HTTP |
| 7 | CAP-10: two installations independent | not run: `site-studio-test-b` could not be deployed |
| 8 | D-2: does the version-stop reason reach the caller | not run: needs two deployments; the code already never retries a write after a bare reset (`call.ts`, `call-retry.test.ts` "does not retry a write after a bare reset", `setup-routes.test.ts` "does not retry a create...") |
| 9 | scrypt memory, two hashes at once | not run: no deployment |
| 10 | Workers Paid plan | not confirmable: `GET /accounts/<id>/subscriptions` and `/billing/profile` answer `Authentication error` (code 10000) with this token; `usage_model` is `standard`, and SQLite Durable Objects also run on the free plan, so neither shows the plan |
| 11 | Deferred item (d), fingerprints alternating during a deploy | not run: needs deployments and the host |

### To finish (Kevin's workstation, or a session whose network allows it)

From `site-studio/`, with Wrangler signed in to the test account: `npm run deploy:cloudflare -- --name site-studio-test` (code A1) and `-- --name site-studio-test-b` (code B1), then checks 1–11 as listed in this spec's Intent and in the story 1.2 spec-4 brief; delete `site-studio-test-b` with `npx wrangler delete --name site-studio-test-b` afterwards. For D-2, two builds with different temporary releases are needed (every build reports the same release, so a deploy alone never triggers a version stop); `wrangler tail` shows whether the caught error carries `site-studio:version-stop`.

### Acceptance evidence (story 1.2)

S = `server-tests/` (Cloudflare's runtime, vitest), U = `tests/` (node), B = `browser-tests/setup.spec.mjs` (Chromium, run 2026-11-20 in this session: 10 passed), D = deployed check above. WebKit (iPhone) has not run anywhere: it runs only in CI, which has not run because `story/1.2` is not pushed. It is "not run" in every B row.

| # | Criterion (short) | Evidence | Result |
|---|---|---|---|
| 1 | Deploy command generates a code, supplies it as a secret, prints it once | U `deploy-cloudflare.test.mjs` "issues, supplies and prints one code when set-up is open"; D1 | pass (stubbed Wrangler); deployed not run |
| 2 | No users: the set-up page is shown | B "shows the set-up page with every field and the statement when set-up is open" | pass (Chromium); WebKit not run |
| 3 | Asks for code, installation name, admin name, email, password | B same test | pass (Chromium); WebKit not run |
| 4 | States that the page disappears once an administrator exists | B same test | pass (Chromium); WebKit not run |
| 5 | Exactly one administrator; confirms name and email | S `setup-routes.test.ts` "creates exactly one administrator, confirms name and email, ..."; B "completes set-up and confirms ..."; D3 | pass locally; deployed not run |
| 6 | Records the public address from where set-up was opened | S "creates exactly one administrator ... records the public address ...", "records the origin the page was opened on, including a port"; D3 | pass locally; deployed not run |
| 7 | Password only as scrypt N=131,072 r=8 p=1, 32 bytes, parameters beside it | S `setup-store.test.ts` "holds a salted scrypt hash with its parameters and never the password", "are pinned to scrypt N = 131,072 ..."; `password.test.ts` "uses salted scrypt ...", RFC 7914 vector | pass |
| 8 | Deploy command asks the public route, issues a code only when open | S `setup-routes.test.ts` "answers only open or closed ..."; U "prints and supplies no code when set-up is closed", "issues no code and fails when the state route never answers"; D1 | pass (route, stubbed command); deployed not run |
| 9 | Once a user exists, page and request refused, code stops working | S "refuses set-up once a user exists, and the code no longer works"; B "after set-up the set-up address says set-up is already complete ...", "a set-up sent after another has finished is refused ..." | pass (Chromium); WebKit not run |
| 10 | Wrong or missing code refused | S "refuses a wrong code and counts it ...", "refuses a missing code by schema ..."; `setup-rules.test.ts` "refuses a missing or empty code ..."; B "a wrong code is refused ..."; D4 | pass locally; deployed not run |
| 11 | Other origin or missing app header refused | S "refuses requests from another origin or without the app's header ..."; D5 | pass locally; deployed not run |
| 12 | Two simultaneous requests create one administrator | S `setup-routes.test.ts` "creates one administrator from two correct requests sent at the same moment"; `setup-store.test.ts` "leave exactly one administrator ..."; D3 | pass locally; deployed not run |
| 13 | Redeploy with an administrator: no code, set-up stays closed | U "prints and supplies no code when set-up is closed"; D1 | pass (stubbed); deployed not run (the trace names D) |
| 14 | Redeploy with no users: new code, earlier code stops working | U "issues a new code on each deploy while set-up stays open"; S "refuses the earlier code once a new code is configured, and the new code resets the counts"; D1 | pass (stubbed, fingerprint change); deployed not run |
| 15 | Deployed: plain HTTP redirected or refused | S `https-redirect.test.ts` "redirects a request Cloudflare marks as plain HTTP ...", `worker-first.test.ts` "routes every Cloudflare request through the Worker"; D6 | pass locally (simulated metadata); deployed not run |
| 16 | Two installations: set-up on one leaves the other open with its own code | D7 only | not run (deploy blocked) |
| 17 | Code at least 20 characters | U "has at least 20 characters from the unambiguous alphabet" | pass |
| 18 | Password 12–128, not the email, no composition rules | S `setup-rules.test.ts` "accepts 12 and 128 ...", "has no composition rule ...", "refuses a password equal to the email in any letter case ..."; B "a field that breaks a rule is not sent ..." | pass (server); browser part Chromium only, WebKit not run |
| 19 | Installation name 1–80 | S "accepts 1 and 80 characters and refuses 0 and 81, naming the field" | pass |
| 20 | 5 wrong per address: 1 min doubling to 15 min; page says how long | S `setup-store.test.ts` "make an address wait 1 minute after 5, doubling ...", "keep a 15-minute wait ..."; S `setup-routes.test.ts` "... then imposes the wait with Retry-After"; B "wrong codes are counted: after five ..."; D4 | pass locally (Chromium); deployed and WebKit not run |
| 21 | 100 wrong per hour: all refused until the hour passes | S "refuse every address after 100 within a rolling hour ..."; deliberately not run against Cloudflare | pass |
| 22 | Counts in installation storage, raised before the check, hold across copies, restart, simultaneous requests | S "are raised before the check and hold across an object restart", "count every one of several attempts sent at once" | pass locally (restart, simultaneous); "across Worker copies" holds by construction (one installation object keeps the counts) but was not observed on Cloudflare |
| 23 | New code resets the count; waiting message says redeploying issues a fresh code | S "start again when a new code's fingerprint arrives", "refuses the earlier code once a new code is configured ..."; B "wrong codes are counted ..."; D1 | pass locally (Chromium); deployed and WebKit not run |
| 24 | Revision restore leaves accounts and installation name unchanged | S "live only in the installation object, which offers no restore ..." | pass |
| 25 | Playwright pinned, built app on local Cloudflare runtime, Chromium + WebKit iPhone, empty storage | `package.json` pins 1.63.0 / 4.14.0; `browser-tests/playwright.config.mjs`, `serve.mjs`; Chromium run here | pass (Chromium); WebKit not run (CI only, not pushed) |
| 26 | Browser test completes set-up; another shows a wrong code refused with the wait | B "completes set-up ...", "wrong codes are counted ..." | pass (Chromium); WebKit not run |
| 27 | axe: no serious or critical violation | B: six tests run the axe helper (`expectAccessible`) on the form, field-error, wrong-code, wait, success and already-complete states; spec 3's broken-page evidence (contrast change caught) | pass (Chromium); WebKit not run |
| 28 | CI installs browsers, runs on push and PR, keeps a trace on failure | `.github/workflows/test.yml` job `browser`; `trace: "retain-on-failure"` | not run: CI has not run (branch not pushed) |
| — | Local set-up code is a local secret, never committed | `.gitignore` (`.dev.vars`, `browser-tests/.local/`); `serve.mjs` writes a mode-600 file per run; `git ls-files` lists no `.dev.vars`, `git grep` finds no code | pass |

Summary (29 rows): 7 pass with nothing left (7, 17, 19, 21, 22, 24, Notes; 22's "across Worker copies" by construction only); 8 pass in Chromium with only WebKit not run (2, 3, 4, 9, 18, 25, 26, 27); 12 pass in local tests with their deployed check not run (1, 5, 6, 8, 10, 11, 12, 13, 14, 15, 20, 23; rows 5, 10, 20 and 23 also lack WebKit); 2 have no evidence (16: deploy blocked; 28: CI not run). Story 1.2's definition of done ("criteria that name a deployed Cloudflare test installation are checked there") is therefore **not met**.

## Spec Change Log

## Review Triage Log

Reviewers run inline by the implementing agent (no subagent tool), so not independent. Layers: blind and edge-case on the code diff; verification-gap on the code and on the evidence table.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| 1 | blind | Before this change an unknown option was ignored, so `npm run deploy:cloudflare -- --dry-run` deployed for real | false (as a defect of this diff) | the change now refuses it before anything is deployed; tested ("refuses an option ... unknown option") |
| 2 | blind | `--name=foo` (equals form) is refused as unknown | low | rejected: the message names the accepted form; supporting it adds a branch for a form nobody documented |
| 3 | blind | A repeated option (`--name a --name b`) silently keeps the last | low | rejected: unlikely, and the deploy output names the Worker it deployed to |
| 4 | edge | `--name` with a value starting `--` or blank | false | refused (`needs a value`), tested with `--name --url ...` and `--name " "` |
| 5 | verification-gap | `main()`'s wiring of `name` into `wranglerDeployArgs` runs in no test: dropping it would deploy to `site-studio` and pass every test | low | rejected as a new item: it is the open deferred item "the deploy command's own wiring ... runs in no automated test", which the deployed checks close; still open (they did not run) |
| 6 | verification-gap | Evidence row 27 said every browser test runs axe; six of ten do | low | patch: row names the six states |
| 7 | verification-gap | Evidence row 18 said "pass" though its browser part is Chromium only | low | patch: row says WebKit not run |
| 8 | verification-gap | Evidence row 22 counted "across Worker copies" as passed with no test observing more than one Worker copy | medium | patch: row and summary say it holds by construction and was not observed on Cloudflare |
| 9 | verification-gap | Every row naming D, plus 16 and 28, lacks its deciding evidence | medium | defer: recorded in the table and in `deferred-work.md` (deployed acceptance not run; CI and WebKit already deferred by spec 3) |

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server && npm run build && npm run test:sites && npm run smoke:selfhost && npm run test:browser -- --project=chromium --trace off` -- all exit 0
