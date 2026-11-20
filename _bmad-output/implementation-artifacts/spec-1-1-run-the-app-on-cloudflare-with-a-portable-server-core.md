---
title: 'Story 1.1: Run the app on Cloudflare with a portable server core'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'dispatch'
baseline_commit: '93b65f593beae260d0d9d809dd8ec9c6fce07cef'
review_loop_iteration: 0
story_key: '1-1-run-the-app-on-cloudflare-with-a-portable-server-core'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/site-studio/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Site Studio is a Vite app with a dev-only review middleware and a static "Sites" Worker; there is no server build, so no later story (accounts, projects on the server, updates, agents) has anything to stand on.

**Approach:** Add one TypeScript Worker build inside `site-studio/` that serves the existing app and a declared `/api/v1/` API, with the two SQLite Durable Object classes, the data-format version and conversion runner, the one-version-at-a-time rule, the alarm schedule, and the file-store and update interfaces. The same bundle starts under `workerd` for self-hosting, proven by a CI smoke test. Acceptance is epics draft 0.7, story 1.1, in full.

## Boundaries & Constraints

**Always:**
- Exactly two DO classes, `ProjectRoom` and `Installation` (fixed name `installation`), both in migration `v1` `new_sqlite_classes`.
- Only allowed platform features: DOs with SQLite, DO alarms, web-standard APIs. No D1, Workflows, Queues, cron triggers or KV in either host config.
- Host-specific code only in `server/files/` and `server/update/`.
- Every route under `/api/v1/` (or `/mcp`, `/.well-known/`) is declared in `shared/` with input and reply schemas. Every refusal is `{ error: { code, message, field? } }` and never echoes an entered value.
- Exact dependency versions, including the existing caret ranges. Use the R7 versions: vite 6.4.2, @cloudflare/vite-plugin 1.70.0, wrangler 4.164.0, vitest 5.1.1, @cloudflare/vitest-plugin 1.8.4.
- The existing app code stays JavaScript and its behaviour is unchanged. `shared/` and `server/` are TypeScript.

**Never:**
- Changing or removing the existing tests. Breaking the four Sites files (`worker/index.js`, `scripts/prepare-sites-build.mjs`, `.openai/hosting.json`, `tests/sites-worker.test.mjs`) or their `dist/client`, `dist/server`, `dist/.openai` outputs.
- Writing the Worker build output to `dist/server`.
- Unauthenticated write routes. Accounts, set-up, set-up codes and deployment keys belong to stories 1.2–1.5.
- Real conversions, the update record or the Update control (Epic 9). The Docker image (story 2.21).
- Editing `experiments/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Status | `GET /api/v1/status` | 200 `{ release, installation: { dataFormat, createdAt } }` | N/A |
| Bad input | Declared route, body fails schema | 400 refusal naming the field | code `invalid_input` |
| Undeclared API path | `GET /api/v1/nope` | 404 refusal | code `not_found` |
| Version mismatch | Object called with another release | Refused, nothing written, object aborts, new start id. Caller retries once | Then 503 `updating`, "updating, try again shortly", `Retry-After` |
| Mismatch within 30 s | Second mismatch less than 30 s after a stop | Refused without stopping again | code `updating` |
| Data newer | Recorded format > build's | Requests refused with an explanation | code `data_newer_than_build` |
| Data older | Recorded format < build's | Requests refused | code `update_not_completed` |
| Version-independent call | Marked call, any release | Answered | N/A |
| Review links when deployed | `/api/reviews/*` on the Worker | 404 refusal | code `not_available` |

**Decisions (Kevin, 2026-11-19):**
- Review links stay dev-only (Vite middleware) for now. The deployed Worker refuses `/api/reviews/*` with `not_available` until reviewer links move to the server in a later epic.
- Deploy the Worker `site-studio-test` to the "PhySec Site Studio" Cloudflare test account (wrangler is already logged in) during this story, check its HTTPS `workers.dev` address, and record the URL and plan in Implementation Notes.
- Keep the spec whole (about 2,400 tokens) rather than splitting it.

</frozen-after-approval>

## Code Map

- `site-studio/package.json`, `package-lock.json` -- npm, `"type":"module"`, Node 22.13+. No aggregate `test` script yet. Pin all versions.
- `site-studio/vite.config.mjs` -- `react()` and the `createReviewApi` middleware plugin; outDir `dist/client`; `fs.deny`. Add `cloudflare({ configPath: 'deploy/cloudflare/wrangler.jsonc' })` after the review plugin, so its middleware still runs first in dev.
- `site-studio/server/reviewApi.mjs` -- dev review API. Do not change it.
- `site-studio/worker/index.js` and `scripts/prepare-sites-build.mjs` -- the K7 Sites package. Keep it. `npm run build` must still produce its three outputs.
- `experiments/r7-vite-plugin/` -- reuse the `wrangler.jsonc` shape (assets SPA fallback, `run_worker_first`, sqlite migration), the `vitest.config.mjs` (`cloudflareTest({ wrangler: { configPath } })`) and the DO pattern (`sql.exec`, `transactionSync`). Do not install the deprecated `vitest-pool-workers`. R7 needed `--legacy-peer-deps` once; pinning should avoid that, otherwise record why.
- `experiments/r8-workerd-server/config.capnp` -- the self-host shape: disk `do-storage`, `enableSql`, `uniqueKey`, `localDisk`, socket. Point the ASSETS binding at a disk service for `dist/client`.
- `_bmad-output/planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md` §10 (lines 471–512) -- folder layout inside `site-studio/`.
- No `.github/` exists yet. Create `.github/workflows/test.yml` at the repository root.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/package.json` -- add pinned devDeps (the above, plus typescript, zod, workerd matching wrangler's) and scripts: `test` (node unit tests), `test:server` (vitest), `typecheck`, `smoke:selfhost`, `deploy:cloudflare`. Prove a clean `npm ci`.
- [x] `site-studio/tsconfig.json` -- strict, covering `shared/`, `server/`, `server-tests/`.
- [x] `site-studio/shared/` -- `release.ts` (release version from package.json via a Vite `define`, plus `DATA_FORMAT_VERSION = 1`), `refusal.ts` (codes and wording), `enteredText.ts` (schema with source enum and ref, unused), `routes.ts` (declarations: method, path, input and reply schemas).
- [x] `site-studio/server/index.ts` -- entry: route `/api/v1/*`, `/mcp`, `/.well-known/*` through the declarations; validate; the object-call helper attaches the release header, retries once, then returns 503. Everything else goes to ASSETS with SPA fallback.
- [x] `site-studio/server/objects/` -- shared base: start id, `_meta` (format version, created at, last stop) and the version guard (abort at most once per 30 s, logging both versions), the format-version guard, the version-independent marker, and `runConversions(list)` (empty list, never called on start). Also `alarmSchedule.ts` (schedule table, earliest alarm wins).
- [x] `site-studio/server/project-room/ProjectRoom.ts`, `server/installation/Installation.ts` -- the two classes on the base.
- [x] `site-studio/server/files/FileStore.ts`, `server/update/UpdateHost.ts` -- interfaces only.
- [x] `site-studio/deploy/cloudflare/wrangler.jsonc` -- name, compat date, assets, `run_worker_first`, both DO bindings, migration v1, `workers_dev: true`, no banned bindings.
- [x] `site-studio/deploy/selfhost/config.capnp`, `smoke.mjs` -- run the built bundle under workerd; smoke: start, read status `createdAt`, kill, restart, read the same value.
- [x] `site-studio/server-tests/` -- vitest config and tests for every matrix row: format version after restart, sample conversion applied once, version mismatch (busy object, nothing kept, new start id), 30 s limit across a restart, alarm schedule, schema refusal naming the field, refusal codes, a guard that host configs have no banned bindings, routes declared.
- [x] `.github/workflows/test.yml` -- ubuntu, Node 22: `npm ci`, `npm test`, `typecheck`, `test:server`, `build`, `test:sites`, `smoke:selfhost`.
- [x] `site-studio/README.md` -- the new commands and the host layout.

**Acceptance Criteria:**
- Given `npm run dev`, when the app is opened in Chrome, then it loads through the Worker and `/api/v1/status` answers, with review links still working in dev.
- Given a clean checkout, when CI runs, then every step passes, including the existing node tests and `test:sites` unchanged.
- Given the deployed test Worker, when its `workers.dev` URL is opened over HTTPS, then the app and `/api/v1/status` load.

## Design Notes

The version check runs before any write, so a refused call cannot leave partial data. The stop time is written to `_meta` first, then `ctx.abort()`. Format bookkeeping in `_meta` is never touched by conversions. The self-hosted smoke test uses the installation's `createdAt`, which is recorded on first creation, as its saved value, so no unauthenticated write route is needed.

## Verification

**Commands** (in `site-studio/`):
- `npm ci && npm test && npm run typecheck && npm run test:server` -- all pass
- `npm run build && npm run test:sites` -- pass; `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json` and the Worker bundle all exist
- `npm run smoke:selfhost` -- the value is the same after the restart

**Manual checks:**
- `npm run dev`, then open the app in the browser pane: the app works, the console has no new errors, and review links work.

## Implementation Notes

- Install: the pinned set installed cleanly with `npm ci`, without `--legacy-peer-deps`. `zod` is pinned to 4.6.6 (the version `@cloudflare/vitest-plugin` 1.8.4 uses), `typescript` 5.9.3, `@cloudflare/workers-types` 5.20261117.1 and `workerd` 1.20261117.1 (wrangler 4.164.0's). `@cloudflare/vite-plugin` 1.70.0 brings its own nested wrangler 4.163.0. The two caret ranges are pinned to the locked 2.1.10 and 1.9.4.
- Build output: the Worker bundle is `dist/worker/index.js` (Vite environment `worker`). The client outDir is set per environment, because a top-level `build.outDir` made the Cloudflare plugin nest both outputs inside `dist/client`.
- Object calls use `fetch` to the object with the `x-site-studio-release` header. A version stop writes `_meta.last_stop_at`, calls `storage.sync()`, then `ctx.abort()`; the caller sees an error carrying `site-studio:version-stop` (or `durableObjectReset`) and retries on a fresh stub. A version-independent call skips only the release check; the data-format check still applies. A call with no release header is refused without a stop.
- `npm test` runs every `tests/*.test.mjs` except the Sites test (it needs a build) through `scripts/run-unit-tests.mjs`.
- Self-hosted: `deploy/selfhost/config.capnp` embeds `dist/worker/index.js`; ASSETS is a disk service over `dist/client`, so the entry maps `/` to `index.html` and fills in content types the disk service leaves as `application/octet-stream`.
- Cloudflare deploy (superseded by the 2026-11-20 entry below): **not done at first.** Wrangler on this workstation is not signed in (`wrangler whoami`: not authenticated; its config folder holds no token). `wrangler deploy --dry-run --name site-studio-test` passes and lists the two Durable Object bindings and ASSETS. To finish: `npx wrangler login` (Kevin), then `npm run deploy:cloudflare -- --name site-studio-test` in `site-studio/`, open the printed `https://site-studio-test.<subdomain>.workers.dev/` and `/api/v1/status`, and record the URL and plan here.
- Review pass 1 (2026-11-19): 35 findings from three layers; 14 fixed as ten patches, 3 deferred to `deferred-work.md`, 18 rejected (see the Review Triage Log). After the patches, verified by the orchestrator: typecheck clean, server tests 40/40, unit tests 133/133, build, Sites test 4/4, self-hosted smoke test passing with its new checks. Not exercised: the smoke script's clean-up when a check fails (read, not run).
- **Open at completion:** the third acceptance criterion (deployed `workers.dev` address over HTTPS) is not yet checked, because the Cloudflare deploy waits on `npx wrangler login` by Kevin. CI has not yet run on GitHub.
- Cloudflare deploy, 2026-11-20 (after Kevin's `wrangler login`): deployed `site-studio-test` to the "PhySec Site Studio" account (Wrangler 4.164.0), at https://site-studio-test.physec-site-studio.workers.dev, version `ae728b9b-001e-416c-a0a1-1d8ebf32e7da`. The first attempt uploaded the Worker but failed on a follow-up `GET /workers/workers/site-studio-test` with "This Worker does not exist" (code 10007) immediately after creation; a second `wrangler deploy` completed. Checked over HTTPS: `/` and an app route serve the app, which renders in the browser with no console errors; `/api/v1/status` answers 200 (release 0.0.0, data format 1); `/api/v1/nope` and `/api` answer `not_found`; `/api/reviews/…` answers `not_available`. The third acceptance criterion is met.
- Plan: Wrangler does not report the account's plan, and Durable Objects with SQLite also run on the free plan, so this deploy does not show that the account is on Workers Paid. Check it in the Cloudflare dashboard.
- Noticed, not required by this story: plain `http://` on the `workers.dev` address answers 200 rather than redirecting (story 1.2 requires a redirect or refusal), and Wrangler warned that preview URLs are on by default because `preview_urls` is not set in `wrangler.jsonc`.

## Spec Change Log

## Review Triage Log

Review pass 1 (2026-11-19). Layers: blind hunter (B), edge-case hunter (E), verification gap (V). Route: P = patch, D = defer, R = rejected.

| # | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|
| E1 | Old object code gets a new release's call for an operation it lacks and answers not_found instead of a version stop | medium | `ObjectBase.fetch` looks the operation up before `guardRelease`, so the caller gets not_found and does not retry during the post-deploy window | P |
| E2, B12a | `ObjectBase.fetch` parses the body with no guard | low | Only `callObject` calls objects and it always sends `JSON.stringify(input)`; no unparseable body can reach an object | R |
| E3, B3a, V-O2 | A throwing alarm handler loses its work, because `takeDue` deletes rows before the handlers run | medium | `alarmSchedule.ts` `takeDue` deletes and re-arms first; a retry of `alarm()` finds nothing due | P |
| B3b | `alarm()` runs handlers without the format check that `fetch` applies | low | `alarm()` has no `formatRefusal` check; a handler could run on data the build cannot read; the fix is one early return | P |
| E4, V-O3 | `callObject` retries on any `durableObjectReset`, which could repeat a committed write | maybe-false | Every current operation is a read (`status`); it matters only once a write operation exists, and whether the abort reason reaches the caller in the deployed runtime is unverified | D |
| E5, B12b | `callObject` assumes a JSON reply | low | Objects answer only `jsonResponse` or refusals built by our own code; an unexpected runtime error is thrown as a rejection, not a non-JSON 200 | R |
| E6, B6a | Body size counts UTF-16 units and buffers chunked bodies before the check | low | Real but bounded: the platform caps request bodies, and no route takes a body yet; byte counting is a direct correction | P (byte count only) |
| E7, B6b | A non-numeric `content-length` skips the declared-size check | low | `Number("abc")` is NaN and `NaN > MAX` is false; the fix is a direct correction | P |
| E8, B6c | HEAD on a GET route answers 405 | low | Real, unlikely in use, and the fix adds a branch | R |
| B6d | Wrong content type, oversized body and bad JSON share field-less 400 `invalid_input` | low | Real but a design preference; adding codes adds public surface before a body route exists | R |
| B6e | Repeated query parameters keep only the last | low | Real, no current route has a query, and the fix adds logic | R |
| E9, B5 | A refusal for an unknown key repeats the key, which is entered text, in `field` | medium | `checkInput` pushes `issue.keys[0]`; `?sk_live_abc123` comes back as `field`, against "never repeats an entered value" | P |
| E10 | `/mcp/...` and `/.well-known` (no slash) are answered with the app's page | low | `index.ts` sends them to assets; the fix is a direct correction of the address check | P |
| E11 | Exactly `/api` gets the app's page on Cloudflare because `run_worker_first` lacks it | low | `/api/*` does not match `/api`; the fix adds entries to `run_worker_first` | P |
| E12, B10a | Self-hosted, a directory path without a trailing slash may serve the disk service's listing | low | The comment in `assets.ts` itself says the disk service lists directories, and only paths ending in `/` are handled; the built files are public anyway, so this exposes file names only | P |
| B10b | Self-hosted page and asset responses carry no security headers | low | Real, and the hosts differ, but headers for pages belong with the first story that serves account pages; adding a header policy is new surface | R |
| E13 | `AlarmSchedule.schedule` accepts NaN or Infinity | low | Only object code calls it; not reachable from input | R |
| E14, B8a, V-O1 | `fail()` in the smoke test exits without killing workerd or removing its storage | medium | `process.exit` skips the `finally` blocks; a CI failure leaves an orphaned process | P |
| E15, B8b | The smoke test's readiness `fetch` has no timeout, and CI has no `timeout-minutes` | medium | A socket that accepts and never answers hangs past the 20 s deadline, and the CI job waits up to 6 hours | P |
| E16 | Port race between `freePort` and workerd starting | low | Rare, and the fix adds retry logic | R |
| E17 | `run-unit-tests.mjs` with no files falls back to discovery | low | The tests folder holds about 20 files; unreachable in practice | R |
| E18 | The alarm test may be flaky if a past alarm fires automatically | maybe-false | Passed on three runs here (two by the implementer, one in triage); would need the plugin's alarm behaviour checked | R (would only be low) |
| B1 | The release is always "0.0.0", so the version rule never fires between deployments | low | By design: the release changes with each published release (story 9.2), and before the first release standing rule 8 re-creates test installations rather than protecting them; a per-build identifier would change AD-20 | R |
| B2 | An object stops itself when an older caller reaches it | false | AD-20 (architecture line 356) stops on any different version so the object restarts on whatever is deployed; after a rollback the older release is the deployed one, and the 30 s limit (CA-41) covers restarts on the same code | R |
| B4 | The format check blocks version-independent operations and the operations an update will need | maybe-false | The spec reads version-independent as release-only; Epic 9 (story 9.4) defines how the update reaches an unconverted object, so whether an exemption is needed is not settled here | D |
| B7 | The request-body path of `readInput` has no tests | medium | The content-type, size and JSON branches never run; story 1.2 adds the first body route | P |
| B9, V2 | The self-hosted smoke test never fetches a built script, an unknown API address or a directory path | medium | The real disk service's content types are only tested against a fake; a wrong type would leave a blank page self-hosted | P |
| B11a | `config.capnp` default paths mix bases, and `data/do` is not ignored | low | The defaults apply only without the documented `--directory-path` flags, which the README and smoke test always pass | R |
| B11b | The compatibility date is in two files with no check that they match | low | Real drift risk against "same behaviour on both hosts"; the fix is one assertion | P |
| B12c | Object-call retries run immediately, with no wait | low | One retry on a fresh stub is what AD-20 asks; a wait adds latency | R |
| B13a | CI runs on both push and pull_request | low | Duplicate runs cost minutes only; branches are pushed without pull requests here, so push is needed | R |
| B13b | `createdAt` in the status reply is only `z.string()` | low | The comment says ISO 8601 and the check is a direct correction (`z.iso.datetime()`) | P |
| V1 | The built release is never checked against package.json | medium | `api.test.ts` compares `RELEASE` with itself; dropping the `define` would ship "0.0.0-dev" unnoticed | P |
| V3 | No check that the review middleware still answers before the Worker in dev | low | Development only; needs a dev-server harness; checked by hand in this story | D |
