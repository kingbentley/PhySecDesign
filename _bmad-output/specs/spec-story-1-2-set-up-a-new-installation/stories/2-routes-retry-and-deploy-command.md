---
title: 'Story 1.2, spec 2: Routes, retry and deploy command'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '398e0f0d3c35f9f49d64e87455bff25a1f03b767'
review_loop_iteration: 0
story_key: '1-2-set-up-a-new-installation'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spec 1 left set-up rules, hashing and storage with no way in: no route answers whether set-up is open or performs it, `callObject` may repeat a committed write (deferred item 1), plain HTTP is served, and the deploy command issues no set-up code.

**Approach:** Declare and implement the public set-up state route and the set-up route (origin and header check, code checked in the Worker against the secret, hash after acceptance, `Retry-After` on waits), the D-1 redirect, the D-2 retry rule, IPv6 /64 address grouping, and a deploy script that issues a code only while set-up is open. Covers CAP-1, CAP-2, CAP-4, the route half of CAP-7, CAP-8 and CAP-9; D-1 to D-6 are frozen.

## Boundaries & Constraints

**Always:**
- Routes under `/api/v1/`, declared in `shared/routes.ts` with input and reply schemas; refusals `{ error: { code, message, field?, retryAfterSeconds? } }` never echo an entered value.
- Exactly two object classes. Host-specific code only in `server/files/`, `server/update/` and the D-1 redirect. Exact dependency versions, no new dependency. Existing tests (before story 1.2) unchanged.
- The object receives the fingerprint of the configured code (the Worker secret), never of the entered one. Counts raised before the code is compared; hash only after the code is accepted.
- The set-up code is never logged, committed or written to disk by the deploy script; the smoke test's code is random per run.

**Never:** Pages, Playwright or CI changes (spec 3). Deploying, `wrangler secret put` or login against Cloudflare (spec 4). Touching `experiments/`, the four Sites files or `sprint-status.yaml`. A route that resets state.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| State | `GET /api/v1/setup/state` | `{ state: "open" \| "closed" }`, no other field | N/A |
| Set-up | same origin, app header, valid input, right code, no users | 200 `{ installationName, email }`; one administrator; public address = request origin | N/A |
| Closed | a user exists | refused; state reads closed | `setup_closed` 409 |
| Wrong code | wrong code, under limits | refused and counted | `setup_code_wrong` 403 |
| Waiting | address or installation over the limits | refused, not counted, `Retry-After` header = `retryAfterSeconds` | `setup_wait` 429 |
| Missing code / bad field | schema failure | refused, not counted, field named, value never echoed | `invalid_input` 400 |
| No secret | `SETUP_CODE` unset or empty, no users | refused, nothing counted | `setup_code_not_configured` 503 |
| Cross-site | `Origin` absent or ≠ request origin, or app header absent or wrong | refused before the body is read | `origin_refused` 403 |
| Simultaneous | two correct requests at once | one administrator, the other refused | `setup_closed` |
| Plain HTTP | `request.cf.tlsVersion === ""` | 308 to the `https:` URL | N/A |
| No signal | no `request.cf` (self-hosted) or TLS | served normally | N/A |
| Retry | object throws with the version-stop reason | retried once, reads and writes | then `updating` |
| Reset, no reason | `durableObjectReset` without the reason | reads retried once; writes not retried | error reaches the entry (`internal_error`) |
| Address | IPv6 `CF-Connecting-IP` | counted as its /64; IPv4 whole; absent → one shared bucket | N/A |
| Deploy, open | state route says open | code (≥20 chars, crypto RNG) put as secret `SETUP_CODE`, printed once | N/A |
| Deploy, closed | state route says closed | no code, no secret put | N/A |
| Deploy, unreachable | state route never answers validly | no code; exit non-zero | message names the address |

</frozen-after-approval>

## Code Map

- `site-studio/shared/routes.ts` -- `ROUTES`, `declareRoute`, `RouteDeclaration` (add `appOriginOnly`), `checkInput`; add `APP_HEADER`, `setupStateReply`, `setupReply`.
- `site-studio/shared/setup.ts` -- reuse `setupInput`, `SETUP_STATES`.
- `site-studio/shared/refusal.ts` -- codes exist (spec 1); `RefusalBody.retryAfterSeconds`.
- `site-studio/server/http.ts` -- `refusalBodyResponse`: add `retry-after` from `retryAfterSeconds`.
- `site-studio/server/api/router.ts` -- origin check before `readInput`; pass `{ request, url }` to handlers.
- `site-studio/server/api/handlers.ts` -- `RouteHandlers` mapped type gains a context argument.
- `site-studio/server/objects/call.ts`, `versionGuard.ts` -- keep `isVersionStop` as is (existing tests use it); add a reason-only test and an `idempotent` option.
- `site-studio/server/auth/setupCode.ts`, `password.ts` -- `setupCodeFingerprint`, `setupCodesMatch`, `hashPassword`.
- `site-studio/server/installation/Installation.ts` -- ops `setupState`, `setupAttempt` (returns ticket), `createFirstAdministrator`.
- `site-studio/server/index.ts` -- redirect first; `server/env.ts` gains `SETUP_CODE?: string`.
- `site-studio/deploy/cloudflare/wrangler.jsonc` -- `run_worker_first` must become `true`: today pages bypass the Worker, so D-1 could not redirect them.
- `site-studio/deploy/selfhost/smoke.mjs` -- extend; `embed` paths resolve from the config's folder.
- `site-studio/scripts/run-unit-tests.mjs` -- picks up `tests/*.test.mjs` automatically.
- Wrangler 4.164: `WRANGLER_OUTPUT_FILE_PATH` gets an ND-JSON `{type:"deploy", worker_name, targets}` line; `wrangler secret put KEY --name W` reads the value from piped stdin.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/routes.ts` -- declare `setupState` (GET `/api/v1/setup/state`) and `setup` (POST `/api/v1/setup`, `appOriginOnly`), `APP_HEADER` `x-site-survey-design: 1`.
- [x] `site-studio/server/http.ts`, `server/api/router.ts`, `server/api/handlers.ts` -- `Retry-After`; origin check → `origin_refused`; context; the two handlers in the order: secret present → `setupAttempt` → compare → hash → `createFirstAdministrator`.
- [x] `site-studio/server/api/clientAddress.ts` -- `CF-Connecting-IP`, IPv6 grouped by /64, IPv4-mapped as IPv4, absent or unparsable → `"unknown"`.
- [x] `site-studio/server/objects/call.ts`, `versionGuard.ts` -- D-2: retry on the shown reason always, on a bare reset only when `idempotent`; status and state calls pass it.
- [x] `site-studio/server/httpsRedirect.ts`, `server/index.ts`, `deploy/cloudflare/wrangler.jsonc` -- D-1 redirect; Worker first for every path.
- [x] `site-studio/scripts/deploy-cloudflare.mjs`, `package.json` -- `deploy:cloudflare` = build then the script: deploy, read the address, poll the state route, if open put and print the code.
- [x] `site-studio/deploy/selfhost/smoke.mjs`, `.gitignore` -- temporary config with a random `SETUP_CODE` text binding; complete set-up; after restart the state reads closed.
- [x] `site-studio/server-tests/setup-routes.test.ts`, `call-retry.test.ts`, `client-address.test.ts`, `https-redirect.test.ts`; `site-studio/tests/deploy-cloudflare.test.mjs` -- matrix rows.

**Acceptance Criteria:**
- Given any refusal in these tests, when its text and headers are read, then no entered code, password, email or name appears.
- Given the built bundle under workerd, when the smoke test completes set-up, then scrypt ran there (`nodejs_compat` exercised) and the state reads closed after a restart.

## Implementation Notes

- Implemented directly from this spec: the runtime offers no subagent tool, so no implementation subagent was launched. The spec is about 2,000 tokens, above the 1,600 guide; kept whole because the routes, retry rule and deploy script are one user goal (set-up reachable end to end) and there was no human to choose a split (spec_checkpoint false).
- Sprint status sync skipped on the orchestrator's instruction (`sprint-status.yaml` is managed outside this run).
- `run_worker_first: true` made the Worker serve `/@vite/client` in `npm run dev`, which `serveAsset`'s directory-listing guard turned into a 404 (no extension, not HTML). The guard now also lets `text/javascript` through; a disk-service listing (JSON) is still refused. Checked by hand with `vite` (root, `/src/main.jsx`, `/@vite/client`, `/@react-refresh`, `/api/reviews/x` from the local review middleware all answer as before) and by `server-tests/worker-first.test.ts`.
- `callObject` gained an `options.idempotent` flag; the `status` and `setupState` handlers set it. `isVersionStop` is unchanged (existing tests use it); `isVersionStopShown` is the reason-only test. In the local runtime the abort reason reaches the caller (`call-retry.test.ts`); the deployed check is spec 4's.
- The set-up handler refuses `setup_code_not_configured` without counting, but answers `setup_closed` instead once a user exists, so a closed installation never says a code is missing.
- The smoke test writes `deploy/selfhost/.smoke-<pid>.capnp` (ignored by git, mode 600, deleted in `finally`) with a random per-run `SETUP_CODE` text binding; the bundle imports `node:crypto` and the set-up request hashes under workerd.
- Self-hosted client address: `CF-Connecting-IP` if present, else the shared `unknown` bucket. The self-hosted web server must set or strip that header (stories 2.21, 2.22).
- The set-up code is compared exactly (case and spaces matter); the page (spec 3) may trim what is pasted.
- Deferred-work items closed by this spec (entries left unedited, as the workflow requires): IPv6 /64 grouping (`clientAddress.ts`), and the self-hosted `nodejs_compat` smoke item (the bundle now imports `node:crypto` and the smoke test hashes). Item 1 is handled except for the deployed check; item (d) stays deferred (new entries at the end of `deferred-work.md`).
- Verification after the review patch: `npm test` (146), `npm run typecheck`, `npm run test:server` (13 files, 113 tests), `npm run build`, `npm run test:sites`, `npm run smoke:selfhost` all exit 0. No lint script exists.

## Design Notes

Deploy order is deploy → ask → put secret, not ask → put → deploy: on a first deploy there is no address to ask until Wrangler reports it, and `wrangler secret put` deploys a new version at once. Between the two steps the new code runs with the earlier secret (or none: `setup_code_not_configured`), which is harmless. The code is 24 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 symbols, `byte & 31`, no bias, 120 bits), compared exactly.

Self-hosted client address: the same `CF-Connecting-IP` header if present, else the shared bucket; the bundled web server must set or strip it (stories 2.21, 2.22).

Item (d) stays deferred: "newest fingerprint wins" needs a deploy time, and a Cloudflare rollback restores the older secret, which would then block set-up until a redeploy.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass; the smoke output shows set-up completed
