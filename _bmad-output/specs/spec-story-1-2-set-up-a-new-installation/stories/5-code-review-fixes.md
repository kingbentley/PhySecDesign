---
title: 'Story 1.2, spec 5: Code review fixes'
type: 'bugfix'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '77c9e83aebebbe8b9c2db900b8a57b590c635aeb'
review_loop_iteration: 0
story_key: '1-2-set-up-a-new-installation'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/SPEC.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** An independent code review of story 1.2 (specs 1–4) found gaps: fingerprints alternating during a deploy reset counts and tickets; plain-HTTP API calls are redirected rather than refused and no HSTS is sent; page and server can measure Unicode differently; the code compare is case- and dash-sensitive; the Windows deploy spawn goes through an unquoted shell; and several page robustness, wording and test gaps.

**Approach:** Apply Kevin's decisions of 2026-11-20 (D-7 rollout window, D-8 transport, D-9 Unicode, D-2 amended, D-10 next step) and patches 1–14 of the review round in one commit, each with tests; record the decisions in SPEC.md and `.memlog.md`, and the deferred items in `deferred-work.md`.

**Decisions (Kevin, 2026-11-20):**
- D-7: the installation object remembers replaced fingerprints; an attempt carrying one is refused `setup_code_replaced` ("A new set-up code was issued. Try again in a minute.") without touching counts or tickets; only a never-seen fingerprint resets counts and tickets; a create whose ticket was dropped by a newer fingerprint gets the same refusal. The deploy command says to wait about a minute. Known cost: after a Cloudflare rollback restores an older secret, set-up refuses until the next deploy.
- D-8: plain-HTTP requests (Cloudflare-marked) under `/api/`, `/mcp`, `/.well-known/` are refused with a refusal naming HTTPS; pages keep the D-1 308. Cloudflare HTTPS responses carry `Strict-Transport-Security: max-age=31536000` (no includeSubDomains, no preload); never self-hosted.
- D-9: passwords NFKC, names NFC, in `shared/setup.ts`, before measuring and before hashing/storing. Story 1.3 hashes the same way.
- D-2 amended: idempotent calls may be retried once after any reset; writes only on the shown version-stop reason.
- D-10: the complete page adds "Signing in arrives in a coming update; until then the app opens as before."

## Boundaries & Constraints

**Always:** Story 1.1's Always list and SPEC.md constraints. One commit on `story/1.2`; refusals carry a code and never an entered value; new refusals declared in `shared/refusal.ts`.

**Never:** `experiments/`; the four Sites files; tests that existed before story 1.2; frozen planning records; `sprint-status.yaml`; Cloudflare (no deploy, no account calls); installing WebKit; a push; skipping hooks; committing a code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fingerprint flip A→B→A | stored B, A retired | A refused `setup_code_replaced`, counts unchanged | no ticket issued |
| Dropped ticket | ticket under A, then B arrives, create under A | `setup_code_replaced` | nothing written |
| Plain HTTP API | `cf.tlsVersion: ""`, `/api/v1/...` | refusal `https_required` | page path → 308 |
| HSTS | `cf.tlsVersion` non-empty | header present | absent without `cf` |
| Code entry | ` abcd-efgh ... ` lower case, spaced | matches configured code | — |
| Unicode password | composed vs decomposed é | same hash, length after NFKC | — |

</frozen-after-approval>

## Code Map

- `site-studio/server/installation/setupStore.ts` -- `attempt()` and `createFirstAdministrator()`: add a retired-fingerprint table; refuse retired; reset only on never-seen.
- `site-studio/shared/refusal.ts` -- add `setup_code_replaced` (409) and `https_required` (403).
- `site-studio/server/httpsRedirect.ts`, `server/index.ts` -- D-8: refuse server paths, redirect pages, add HSTS on Cloudflare HTTPS (skip 101).
- `site-studio/shared/setup.ts` -- `normalisePassword` (NFKC), names NFC, `normaliseSetupCode`; used by client and server.
- `site-studio/server/auth/setupCode.ts` -- compare normalised codes.
- `site-studio/scripts/deploy-cloudflare.mjs` -- spawn `node wrangler.js` without a shell on every platform (exported builder); "wait about a minute" line.
- `site-studio/src/admin/{setupState.js,setupClient.js,SetupPage.jsx}`, `src/main.jsx` -- patches 4–10, 14.
- `site-studio/browser-tests/{serve.mjs,setup.spec.mjs}` -- patches 11–13.
- Tests: `server-tests/setup-store.test.ts`, `setup-routes.test.ts`, `https-redirect.test.ts`, `password.test.ts`, `setup-rules.test.ts`, new `server-tests/setup-client.test.ts` (vitest imports the page module; `tsconfig.json` gains `allowJs` so it typechecks), `tests/deploy-cloudflare.test.mjs`.

## Tasks & Acceptance

**Execution:**
- [x] Server: D-7, D-8, D-9, patch 2, with server tests.
- [x] Deploy script: patch 3 and the D-7 line, with unit tests.
- [x] Page: patches 4–10, 14; browser tests 11–13.
- [x] Records: SPEC.md (D-7..D-10, D-2 amended, CAP text), `.memlog.md`, `deferred-work.md`, `stories.yaml` entry 5.

**Acceptance Criteria:**
- Given the seven commands in Verification, when run in `site-studio/`, then each exits 0.
- Given the commit, when read, then it holds no set-up code and touches none of the Never paths.

## Implementation Notes

- Implemented and reviewed inline: this runtime has no subagent tool, so no implementation subagent and no independent reviewer subagents were launched. No human in the session; the spec was approved by the orchestrator's instruction (Kevin's decisions supplied). The spec is above the 1600-token guide and was kept whole on the orchestrator's instruction (one round, one commit). Sprint status sync skipped on the orchestrator's instruction (`sprint-status.yaml` is not touched).
- New refusal codes: `setup_code_replaced` (409, D-7) and `https_required` (403, D-8), in `shared/refusal.ts`.
- D-7: table `setup_code_replaced` (fingerprint, replaced_at) in the installation object; `SetupStore.acceptFingerprint` makes a never-seen fingerprint current (remembering the one it replaces, clearing counts and tickets) and refuses a replaced one before anything is counted; `createFirstAdministrator` refuses a replaced fingerprint with the same code. Deploy command prints `SETTLE_NOTICE` ("Wait about a minute before using it...") after a new code.
- D-8: `server/httpsRedirect.ts` refuses plain-HTTP `/api`, `/mcp`, `/.well-known` (and their sub-paths) and redirects other paths; `withHsts` adds `Strict-Transport-Security: max-age=31536000` when `cf.tlsVersion` is a non-empty string (skips 101). In the local runtime Miniflare marks requests as TLS, so local responses also carry the header; browsers ignore HSTS over plain HTTP.
- D-9: `normalisePassword` (NFKC) inside `passwordField` and `passwordEqualsEmail`; `normaliseName` (trim + NFC) for both name fields; the handler hashes the schema's normalised password. Email unchanged (lower-cased, not NFC), as D-9 names only passwords and names.
- D-2 amended: no code change needed: `callObject` already retried idempotent calls once after any reset (`call-retry.test.ts` "retries an idempotent read once after a bare reset").
- Patch 2/10: `normaliseSetupCode` (remove whitespace and dashes, including Unicode dashes; upper case) in `shared/setup.ts`, used by `setupCodesMatch` on both codes, by the handler's "configured?" check and by the page before sending.
- Patch 3: Wrangler is now started as `node node_modules/wrangler/bin/wrangler.js ...` with `shell: false` on every platform (`wranglerSpawn`), so no `cmd.exe` parses a path or a Worker name.
- Patch 13: the page-logic unit tests are `server-tests/setup-client.test.ts` (vitest imports `src/admin/*.js`); `tsconfig.json` gains `allowJs: true, checkJs: false` so the import typechecks. The double-submit browser test was mutation-checked: with the old `if (sending)` guard it fails (2 requests).
- Tests changed from earlier story 1.2 specs: two store tests now expect `setup_code_replaced` where a replaced fingerprint previously gave `setup_code_wrong`; the HTTPS test now expects a refusal, not a 308, for `/api/...` over plain HTTP; the impossible mixed-case dashed code in `password.test.ts` was replaced with a realistic one.

## Spec Change Log

## Review Triage Log

Reviewers run inline by the implementing agent (no subagent tool), so not independent. Layers: blind hunter, edge-case hunter (with claims check), verification gap, all on the `site-studio/` diff since the baseline.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| 1 | blind | The `setup_code_replaced` table grows by one row per deploy and is never pruned | low | rejected: one row per redeploy before set-up, a handful in practice; pruning adds a branch |
| 2 | blind | `SetupLoadBoundary` also catches render errors and then says the page "could not be loaded" | low | rejected: any failure there leaves the page unusable and a reload is the right remedy |
| 3 | blind | The email is not NFC-normalised while names are | low | rejected: D-9 names passwords and names only; the email is lower-cased and light-checked; noted in Implementation Notes |
| 4 | blind | `setup_code_replaced` shares status 409 with `setup_closed` | false | `submitSetup` and `callObject` dispatch on the reason code, never on the status |
| 5 | blind | Local development responses over `http://127.0.0.1` carry HSTS | false | browsers ignore HSTS received over plain HTTP (RFC 6797 section 8.1); documented in `httpsRedirect.ts` |
| 6 | blind | `serve.mjs` now exits 1 if the runner kills Wrangler with another signal, which might fail the run at teardown | false | the official `npm run test:browser -- --project=chromium --trace off` run exits 0 after teardown |
| 7 | edge | A code of only spaces or dashes passes the server schema and is counted as a wrong attempt | low | rejected: the page refuses it before sending; counting it server-side is the conservative behaviour |
| 8 | edge | `readSetupState` leaves the fetch running after the timeout wins the race | false | the timer calls `controller.abort()`, and the unit test observes the abort |
| 9 | verification-gap | `serve.mjs`'s exit-status rules run in no test | low | rejected: a test would spawn and kill Wrangler; the rule is a few lines and the run's exit was observed |
| 10 | verification-gap | `main()` now starts Wrangler through `wranglerSpawn`, but the real spawn runs in no test | low | carried: the open deferred item "the deploy command's own wiring ... runs in no automated test"; no new entry |
| 11 | verification-gap | D-7's rollout window and D-8's refusal and HSTS are observed only with simulated `request.cf`, never on Cloudflare | medium | defer: new entry in `deferred-work.md` adding three checks to spec 4's deployed checks |

Claims check (edge layer): the Intent and Tasks claims (D-7 to D-10, patches 1–14) were checked against the code; none was falsified.

## Verification

**Commands** (in `site-studio/`):
- `npm test`, `npm run typecheck`, `npm run test:server`, `npm run build`, `npm run test:sites`, `npm run smoke:selfhost`, `npm run test:browser -- --project=chromium --trace off` -- expected: all exit 0. Lint: no script, not applicable. WebKit: not run (not installed).
