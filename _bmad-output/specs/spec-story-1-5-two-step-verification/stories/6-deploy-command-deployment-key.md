---
title: "Story 1.5, spec 6: The deploy command's deployment key"
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: 'b7e7d6606dc818c14cf1d68c77d5f19415ceb345'
route: 'dispatch'
review_loop_iteration: 2
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/wording.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/SPEC.md'
---

> Builds to D-17 (as amended by findings 1, 2, 10 and 11), D-18 (as ruled), D-22 and D-21 (deploy lines) in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs spec 4's deployment-key state route. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The deploy command supplies only the set-up code; nothing creates, keeps or accepts a deployment key.

**Approach:** Extend `runDeploy` so that it learns from the Worker's secret list whether a key exists, generates one only when none exists and the installation holds no encrypted values, uses an operator's key when given (also to restore a key the Worker lost), confirms a restored key against the stored fingerprint, never replaces one, and shows a generated key before storing it. Covers CAP-11 in unit tests; spec 9 runs it on Cloudflare.

## Boundaries & Constraints

**Always:**
- `runDeploy` gains injected `listSecrets(workerName)` (resolves to the names, or throws), `askKeyState(address)` (`{ fingerprint, key }` or null), `env` (for `SITE_SURVEY_DEPLOYMENT_KEY`) and `generateKey` (32 bytes from `node:crypto` `randomBytes`, base64url without padding).
- The real `listSecrets` runs `wrangler secret list --name <worker> --format json` through a captured-output mode of `runWrangler`, parses the first JSON array in its standard output and treats anything else as a failed listing (finding 28). Every Wrangler child is started with `SITE_SURVEY_DEPLOYMENT_KEY` removed from its environment (finding 28).
- The real `askKeyState` polls `GET <address>/api/v1/deployment-key/state` as `waitForSetupState` polls (same timeout and retry constants); only a 200 reply that is exactly `{ fingerprint: "none" | "stored", key: "none" | "present" | "matches" | "mismatch" }` counts, anything else is retried; at the time limit it is null (finding 11).
- A supplied key is checked first (43 base64url characters decoding to 32 bytes); a malformed one stops the command before deploying, with `wording.md`'s line.
- Every run first prints the "one deploy at a time" line (finding 10).
- Order (D-17): deploy; check `workerName` at once, since the key steps need it whatever the set-up state (finding 29); list the Worker's secrets.
  - Key in the list, nothing supplied: no put, no key-state check; the "kept" line (orchestrator ruling, 2026-11-22, rule 4).
  - Key in the list, key supplied: no put; ask the key state with the same polling (orchestrator ruling, 2026-11-22, rule 3):
    - `fingerprint: "none"`: the "kept" and "not used" lines, exit 0 (no settling: nothing is compared).
    - `fingerprint: "stored"`: the "confirming" line, then wait for a **settled** answer (below). Settled `matches`: the "kept" and "not used" lines, exit 0. Settled `mismatch`: nothing changed; the "Worker's key is not the original" line naming the Worker, exit 1.
    - no readable first answer, or no settled answer within the settle limit: the "kept" line and the "Worker's key not confirmed" line, exit 1.
  - **Settled answer** (orchestrator ruling on stale replies, 2026-11-22): whenever the command decides on the Worker's key against a stored fingerprint (rules 1 and 3), an answer counts only once every readable reply over a continuous 60 seconds gives the same `key`, `matches` or `mismatch`, with at least 21 such replies (the 3-second `STATE_RETRY_MS` of `waitForSetupState` over 60 seconds, counting both ends), so one reply followed by silence never counts. Any other reply (the other value, `none`, `present`, `fingerprint: "none"`, an unreadable, failed or non-200 reply) restarts the 60 seconds. The limit for a settled answer is 180 seconds; without one by then it is "not confirmed" and nothing is deleted. The clock and the delay are injected.
  - Key not in the list: ask the key state (null → the "state unreadable" line, exit 1, nothing generated or put). Then:
    - `fingerprint: "none"`, key supplied: put it; the "supplied" line. If the put fails, the "supplied key may or may not have been stored" line, exit 1 (orchestrator ruling, 2026-11-22, rule 5).
    - `fingerprint: "none"`, none supplied: generate; print the key and the keep-a-copy lines **before** the put (finding 1); put; if the put fails, print the "may or may not have been stored" line and exit 1.
    - `fingerprint: "stored"`, key supplied (the operator's claim that it is the original, finding 2): put it (a failed put → the "supplied key may or may not have been stored" line, exit 1, rule 5); print the "confirming" line and wait for a settled answer (above); settled `matches` → the "supplied" line; settled `mismatch` → delete `DEPLOYMENT_KEY` again with `wrangler secret delete DEPLOYMENT_KEY --name <worker>`, then the "not the original, removed again" line, exit 1; if that delete fails, the "not the original, could not be removed" line naming the Worker, exit 1 (orchestrator ruling, 2026-11-22, rule 1); no answer in time → the "not confirmed" line, the key stays, exit 1 (rule 2).
  - The command deletes a key only in that one case: the key this run put, after a settled `mismatch` for it. Never any other key, never on "not confirmed" (orchestrator ruling, 2026-11-22, rule 1).
    - `fingerprint: "stored"`, none supplied: the "encrypted values but no key" line, exit 1, nothing generated or put.
  - Then story 1.2's set-up-code steps unchanged. Printed order: the deploy line, the key lines, then the set-up lines (finding 29).
- The key is put with `wrangler secret put DEPLOYMENT_KEY --name <worker>` on standard input only. A generated key is printed exactly once; a supplied key is never printed. A key in the list is never replaced or deleted. `runDeploy` gains an injected `deleteSecret(workerName, name)` beside `putSecret` (orchestrator ruling, 2026-11-22).
- The Worker passes the key to the installation object on each call (D-22), so no step waits for objects to restart.

**Ask First:** a change to the set-up-code steps or messages (story 1.2); any real Wrangler or Cloudflare call in tests.

**Never:** put the key on a command line or in a file; log it; use a Cloudflare account (spec 9 does, with Kevin's go-ahead); `experiments/`, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First deploy | list without the key; state `none`; nothing supplied | deploy; key printed once, then put; then set-up code | N/A |
| Put fails after generating | `putSecret` throws | key printed once; the "may or may not" line (finding 1) | exit 1 |
| Rerun with that key | list now holds the key; that key supplied | not put; "kept" and "not used" lines | exit 0 |
| Redeploy, key kept | list has `DEPLOYMENT_KEY` | no generate, no put, "kept" line; set-up steps as before | N/A |
| Supplied, no key yet | valid supplied key; list without the key; state `none` | that key put; nothing generated or printed | N/A |
| Supplied, key exists | valid supplied key; list has it | not put; "not used" line | N/A |
| Supplied, malformed | 42 characters | nothing deployed | exit 1, line |
| Stored, supplied, matches | list lacks it; state `stored`; valid supplied key; state then `matches` | put; "supplied" line (finding 2) | N/A |
| Stored, supplied, mismatch, delete succeeds | as above; state then `mismatch` | put; then deleted again; the "not the original, removed again" line (ruling, rule 1) | exit 1 |
| Stored, supplied, mismatch, delete fails | as above; `deleteSecret` throws | put; delete tried once; the "could not be removed" line naming the Worker (ruling, rule 1) | exit 1 |
| Rerun with the original after a removed key | list lacks it; state `stored`; valid supplied key; state then `matches` | put; "supplied" line (ruling) | N/A |
| Stored, supplied, no answer | state never `matches` or `mismatch` in time | put; not deleted; the "not confirmed" line (ruling, rule 2) | exit 1 |
| Key in list, supplied, fingerprint none | list has it; state `none` | not put, not deleted; "kept" and "not used" lines (ruling, rule 3) | exit 0 |
| Key in list, supplied, matches | list has it; state `stored`, `matches` | not put, not deleted; "kept" and "not used" lines (ruling, rule 3) | exit 0 |
| Key in list, supplied, mismatch | list has it; state `stored`, `mismatch` | not put, not deleted; the "Worker's key is not the original" line (ruling, rule 3) | exit 1 |
| Key in list, supplied, no answer | list has it; no settling state in time | not put, not deleted; "kept" and "Worker's key not confirmed" lines (ruling, rule 3) | exit 1 |
| Settle: flip within the window | rule 1; replies `mismatch` for 30 s, then `matches` steadily | settles on `matches`; nothing deleted; "supplied" line (ruling on stale replies) | N/A |
| Settle: 59 seconds then a change | rule 1; `mismatch` for 59 s, then `matches` steadily | the window restarts; settles on `matches`; nothing deleted | N/A |
| Settle: steady mismatch | rule 1; `mismatch` on every reply | deleted once, after the 60-second window, not before; "removed again" line | exit 1 |
| Settle: alternating to the limit | rule 1; `mismatch` and `matches` alternating until 180 s | "not confirmed"; nothing deleted | exit 1 |
| Settle: unreadable reply restarts | rule 1; `mismatch`, a 404 at 40 s, then `mismatch` | the window restarts at the next readable reply; deleted only 60 s after it | exit 1 |
| Settle in rule 3 | key in list, supplied, `stored`; the four settle cases above | flip and change settle on `matches` ("kept", "not used", exit 0); steady `mismatch` gives the "not the original" line only after the window; alternating gives "not confirmed"; never a put or delete | as stated |
| Supplied put fails, then rerun | `putSecret` throws (the key was stored); rerun with the same key, list has it, state `matches` | first run: the "supplied key may or may not" line, exit 1; rerun: not put, "kept" and "not used" (ruling, rule 5) | exit 1, then 0 |
| Stored, nothing supplied | list lacks it; state `stored` | nothing generated or put | exit 1, line |
| State unreadable | 404 then 200 `{ none, none }` | retried; key generated (finding 11) | N/A |
| State never readable | only 404s until the time limit | nothing generated or put | exit 1, the "state unreadable" line |
| Listing fails | `listSecrets` throws, or output with no JSON array | nothing generated or put | exit 1, line |
| No Worker name | deploy reports none, set-up closed | nothing generated or put (finding 29) | exit 1 |
| Child environment | `SITE_SURVEY_DEPLOYMENT_KEY` set | absent from every Wrangler child's environment | N/A |
| Two runs | second run's list has the key | key printed only by the first | N/A |
| Output | every run | the "one deploy at a time" line first; the key appears only on its one printed line, never in errors | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/scripts/deploy-cloudflare.mjs` -- `runDeploy`, `runWrangler` (lines 194–200 inherit output and environment today), `waitForSetupState`, `main`, `wranglerSpawn`.
- `site-studio/tests/deploy-cloudflare.test.mjs` -- the existing fakes (`runDeploy(` at lines 72–148); each gains `listSecrets` and `askKeyState` (holding a key, so existing cases keep their meaning).
- `node_modules/wrangler` 4.164.0 -- `secret list` prints JSON `[{ name, type }]`.

## Build notes (build session, 2026-11-22)

- **No Cloudflare, no real Wrangler, of any kind.** Never run `wrangler` or `npm run deploy:cloudflare`, not even `wrangler whoami` or `secret list`; never start `scripts/deploy-cloudflare.mjs`'s `main`. Every outside effect is a fake in the tests. Spec 9 makes the deployed run, with Kevin's go-ahead. Reading `node_modules/wrangler` is allowed; running it is not.
- Read `site-studio/AGENTS.md`. Files in scope: `site-studio/scripts/deploy-cloudflare.mjs` and `site-studio/tests/deploy-cloudflare.test.mjs`. Any other file needs a reason in the report. Not in scope: the server, routes, pages, browser tests, `deploy/selfhost/`, `experiments/`, `sprint-status.yaml`. Story 1.2's set-up-code steps and their messages stay exactly as they are (Ask First: stop and report instead of changing them).
- Every line the command prints comes word for word from the "Deploy command" section of `wording.md`; add no other text. Blank lines around the key line, as the set-up code has them, are allowed. Error lines go to `printError`, the rest to `print`.
- What the pinned Wrangler does (read in `node_modules/wrangler/wrangler-dist/cli.js`, about line 308043): `secret list --format json` writes `JSON.stringify(secrets, null, "  ")` to standard output, so the array spans several lines; `fetchSecrets` returns the API's `[{ name, type }]`. Parse it with a pure exported function (for example `parseSecretList(text)`) that finds the first text from a `[` that parses as a JSON array (try each `[`, and each later `]` as its end, so a `[WARNING]`-style line before it is skipped), and answers the names, or null when there is no such array or an entry is not an object with a string `name`. Null, or a thrown error, is a failed listing. In the captured mode the child's standard output is piped and collected, and its standard error is still inherited so Wrangler's own errors reach the operator.
- The child environment: one exported pure function that copies an environment without `SITE_SURVEY_DEPLOYMENT_KEY`, matched without regard to case (Windows environment names are case-insensitive), used inside `runWrangler` for every child, including the deploy's `{ ...process.env, WRANGLER_OUTPUT_FILE_PATH }`. To test it without starting Wrangler, let `runWrangler` (or a factory that builds `deploy`, `listSecrets` and `putSecret` for `main`) take an injected `spawnImpl` defaulting to `node:child_process` `spawn`; the test passes a fake that records each child's options and ends with exit 0 (and, for the deploy, writes a deploy entry to `WRANGLER_OUTPUT_FILE_PATH` in a temporary directory the test removes). The test sets the variable in the environment it passes, and asserts that no child of the deploy, the listing and both puts received it.
- The supplied key: `env.SITE_SURVEY_DEPLOYMENT_KEY`. Undefined or the empty string means none supplied (as the Worker treats an empty `DEPLOYMENT_KEY` as no key); anything else must match `/^[A-Za-z0-9_-]{43}$/`, decode with `Buffer.from(value, "base64url")` to 32 bytes and re-encode to the same text (the server's `parseDeploymentKey` in `server/auth/deploymentKey.ts` refuses a non-canonical last character the same way); otherwise the malformed line, exit 1, before `deploy` is called. The generated key: `randomBytes(32).toString("base64url")`, 43 characters, injected as `generateKey`.
- Order in `runDeploy`: print the "one deploy at a time" line; check the supplied key; `deploy()`; check `workerName` at once (the existing message, unchanged); choose the address (the existing message, unchanged); list the secrets; the key steps of the spec's Always list; then story 1.2's steps from `askState` on, unchanged. "The deploy line" in the printed order is Wrangler's own deploy output, which comes before the key lines; story 1.2's "Deployed to ‹address›. …" lines are set-up lines and stay after the key lines and unchanged.
- `askKeyState(address, accept)`: the real one (an exported `waitForKeyState`, built like `waitForSetupState`, with the same `STATE_TIMEOUT_MS`, `STATE_RETRY_MS` and per-request time limit) polls `GET <address>/api/v1/deployment-key/state` and answers the first 200 reply that is exactly `{ fingerprint: "none" | "stored", key: "none" | "present" | "matches" | "mismatch" }` (an exported exact parser, like `parseSetupState`) and for which `accept(reply)` holds (default: any); anything else is retried; at the time limit, null. The first ask uses the default; the confirmation after putting a supplied key uses `accept = (reply) => reply.key === "matches" || reply.key === "mismatch"`. Null on the confirmation is the "not confirmed" line.
- A failed put of a **generated** key is caught in `runDeploy`: the "may or may not have been stored" line, exit 1. A failed put of a supplied key may throw to `main` as today (`Deploy failed: …`); no error message may ever contain a key.
- Existing tests: each harness gains `listSecrets` answering a list that holds `DEPLOYMENT_KEY` (and `askKeyState`, which is then not called), plus an empty `env`, so every existing case keeps its meaning. Where an existing assertion no longer holds as written (for example `calls.out` deep-equal to `[]`, now that the first line is always printed), change it to the narrowest assertion with the same meaning and list each change in the report. The test "issues no code when the deployment reports nothing, even with --url" must still find "Worker's name".
- New tests: one per matrix row, the row's name in the test title. Fakes keep one shared ordered event log (prints, puts, generate calls) so "printed before the put" is checked by order. The leak test covers every row: the generated key appears in `print` output exactly once and in no `printError` line; a supplied key appears in neither, ever. A two-run test shares one fake Worker whose `putSecret` adds the name to its list. Keys are generated at run time in the tests; never write one in a file.
- Deliberate breakages (make, run `npm test`, record the failing test's title, revert): 1) move the key's print after the put; 2) print the key line twice. Record each after its arrow in Tasks & Acceptance below, and each acceptance criterion's proving test title after its arrow. Leave the frozen block untouched.
- Update the header comment of `deploy-cloudflare.mjs` to describe the key steps. Edit by hand, no bulk search-and-replace, no `sed`. Commands, in `site-studio/`, one at a time, never two test runs at once: `npm test`, `npm run typecheck`, `npm run build`, `npm run test:sites`. `git` is slow: `git --no-pager`, long timeouts. No lint script; add none. Do not touch `.claude/`, `Site Studio UX screens.pdf`, `preview.html`. Do not commit.

### Build notes, round 2 (after the orchestrator ruling of 2026-11-22)

- **Start from the code already in the working tree** (round 1, uncommitted). KEEP: `KEY_LINES` and every line in it except the changed `notOriginal`; `generateDeploymentKey`, `isDeploymentKey`, `parseKeyState`, `parseSecretList`, `childEnvironment`, `keyConfirmed`, `waitForKeyState`, `runWrangler` (capture, `close`, `spawnImpl`), `createWranglerActions`, the order in `runDeploy`, story 1.2's lines; the test harness (`keyHarness`, `assertNoLeak`, `fakeSpawn`) and every round-1 test whose matrix row is unchanged. Round 1's diff is in `C:\Users\Kevin\AppData\Roaming\Claude\side-session-notes\local_f1ffae76-ec6d-4b17-84ee-06a1cf7cd849\spec6-round1.patch` for reference.
- **The frozen block now carries rules 1 to 5** (marked "orchestrator ruling"). Build them, with each new or changed line word for word from `wording.md`'s "Deploy command" section (`‹worker›` is the reported Worker name). Add `KEY_LINES` entries for the new lines; error lines go to `printError`.
- `deleteSecret(workerName, name)`: injected into `runDeploy`; in `createWranglerActions` it runs `wrangler secret delete <name> --name <worker>` through `runWrangler` with `input: ""` (standard input piped and ended). Wrangler 4.164.0's `secret delete` has no `--force` flag; it asks for confirmation (`confirm2`, `cli.js` about line 141647) only when standard input and output are both terminals, and otherwise takes its fallback "yes" (`isNonInteractiveOrCI`, about line 35408), so a piped standard input makes it non-interactive. Its child environment goes through `childEnvironment` like every other.
- Rule 3's poll: `askKeyState(address, accept)` with `accept = (reply) => reply.fingerprint === "none" || keyConfirmed(reply)` (export it beside `keyConfirmed`). On `mismatch` print only the "Worker's key is not the original" line (not "kept"); on null the "kept" line then the "Worker's key not confirmed" line.
- Rule 1: `deleteSecret` is called only after this run's own put of a supplied key, and only when the confirmation answered `mismatch`. A throw from it gives the "could not be removed" line. Rule 5: catch a failed put of a supplied key in both branches (fingerprint `none` and `stored`) and print the "supplied key may or may not" line, exit 1; no error line contains a key.
- Also fix these round-1 review findings (Review Triage Log rows): 5, export a small builder (for example `createKeyStateAsker(options)`) that `main` uses for `askKeyState`, forwarding `accept` into `waitForKeyState`'s options, and test the restore row through it with a fake `fetchImpl`; 10, give `child.stdin` an `error` listener in `runWrangler` so an EPIPE cannot crash the process (the exit code still decides); 13, build `KEY_LINES.stateUnreadable` from `DEPLOYMENT_KEY_STATE_PATH`; 15, have the harness tell a confirmation poll by comparing `accept` with the exported predicates, not by `accept.length`; 17, a test with set-up `open`, a stored fingerprint and a supplied key that matches, showing `SETUP_CODE` is put only after the confirmation.
- Tests: the harness gains a `deleteSecret` fake recording into the event log (and removing the name from the fake Worker); one test per new or changed matrix row, the row's name in the title; every existing row that lists the key with a key supplied now gives the fake a key state (round-1 rows "Rerun with that key" and "Supplied, key exists"); assert no `deleteSecret` call in every row except "mismatch, delete succeeds/fails". The child-environment test also covers the delete child. Update the row rename "Stored, supplied, mismatch" → "…, delete succeeds".
- Third deliberate breakage: make the command delete a key it did not put in this run (for example call `deleteSecret` on rule 3's mismatch path), run `npm test`, record the failing test's title below, revert.
- Same rules as before: no real Wrangler or Cloudflare call of any kind; edit by hand; run `npm test`, `npm run typecheck`, `npm run build`, `npm run test:sites` one at a time in `site-studio/`; do not commit; do not touch the untracked `.claude/`, `Site Studio UX screens.pdf`, `preview.html`. Update the acceptance and breakage records below; leave the Review Triage Log to the build session.

### Build notes, round 3 (after the orchestrator ruling on stale replies, 2026-11-22)

- **Start from the code in the working tree** (round 2, uncommitted). KEEP everything round 2 built (rules 1 to 5, `KEY_LINES`, `createKeyStateAsker`, `createWranglerActions` with `deleteSecret`, the harness, every test whose row is unchanged). Change only what the settled answer needs, plus the three patches below.
- The settled answer, as the frozen block defines it: an exported `waitForSettledKeyState(address, { fetchImpl, sleep, now, settleMs = 60_000, timeoutMs = 180_000, retryMs = STATE_RETRY_MS, minReplies = 21 })` that polls the key-state route and answers `{ fingerprint: "stored", key: "matches" | "mismatch" }` once the same value has come on every readable reply for at least `settleMs` and on at least `minReplies` replies in a row (the run starts at the first such reply's time), or null at `timeoutMs`. Any other reply, including an unreadable one, a failed request or a non-200 answer, ends the run, and the next qualifying reply starts a new one. Export the constants (`KEY_SETTLE_MS`, `KEY_SETTLE_TIMEOUT_MS`, `KEY_SETTLE_MIN_REPLIES`) with a comment on how 21 follows from 60 s at 3 s.
- `runDeploy` gains an injected `settleKeyState(address)` for rules 1 and 3 (the confirmation after the put, and rule 3 once its first answer says `fingerprint: "stored"`); `askKeyState` stays for the first ask (any exact reply). `createKeyStateAsker`, or a sibling builder that `main` uses, provides both with the same injected `fetchImpl`, `sleep` and `now`. Print `wording.md`'s "Checking the key in SITE_SURVEY_DEPLOYMENT_KEY with this installation. This takes at least a minute." on standard output (`print`) right before each settle. Rule 3: first ask with `askKeyState(address)`; null → "kept" and "Worker's key not confirmed", exit 1; `fingerprint: "none"` → "kept" and "not used", exit 0, no settle; `stored` → the line, then the settle. Remove `keyChecked` if nothing needs it any more.
- Tests: the new matrix rows ("Settle: …" and "Settle in rule 3") run `runDeploy` with the real `waitForSettledKeyState` through the builder, a fake `fetchImpl` answering by the fake clock's time, and an injected `sleep` that advances the clock, so no real waiting. Assert the delete count and that a delete, when it happens, comes only after the clock has passed 60 s from the start of the steady run. The existing rule-1 and rule-3 rows keep their meaning with a fake `settleKeyState`. A unit test of `waitForSettledKeyState` covers: fewer than 21 replies over 60 s (slow requests) does not settle; a single reply then 60 s of failed requests does not settle.
- Fourth deliberate breakage: make the delete follow the first `mismatch` reply (for example settle on the first qualifying reply), run `npm test`, record the failing test's title under Deliberate breakages, revert.
- Patches from review round 2 (Review Triage Log): row 19, extend `fakeSpawn` with a per-command close code and add a test that drives `runDeploy` with `createWranglerActions(...)` so that a non-zero close of a supplied put gives `[KEY_LINES.suppliedPutFailed]`, of a generated put `[KEY_LINES.putFailed]`, and of the delete after a settled mismatch `[KEY_LINES.notRemoved("site-studio")]`, each exit 1; row 26, the header comment names the one-deploy-at-a-time line as printed first; row 33, the summary "Output" test asserts each row's expected exit code.
- Same rules as before: no real Wrangler or Cloudflare call; edit by hand; `npm test`, `npm run typecheck`, `npm run build`, `npm run test:sites` one at a time in `site-studio/`; do not commit; do not touch `.claude/`, `Site Studio UX screens.pdf`, `preview.html`; leave the frozen block and the Review Triage Log alone; update the acceptance and breakage records.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/scripts/deploy-cloudflare.mjs` -- key handling, order, messages, captured output, child environment, `listSecrets` and `askKeyState` wired in `main`.
- [x] `site-studio/tests/deploy-cloudflare.test.mjs` -- matrix rows.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a first deploy, the key is printed once with the keep-a-copy instruction before it is put, and put once; a second run prints none (criterion 12). → Test: "First deploy: the key is printed once with the keep-a-copy lines before it is put, put once, then the set-up code" and "Two runs: the second run's list holds the key, so the key is printed only by the first"
- Given a valid supplied key, it is put and nothing is generated or printed (criterion 13). → Test: "Supplied, no key yet: that key is put; nothing generated or printed"
- Given a secret list that holds `DEPLOYMENT_KEY`, no put of it happens, with or without a supplied key (criterion 22, CA-52). → Test: "Redeploy, key kept: no generate, no put, the kept line; the set-up steps as before" and "Supplied, key exists: not put; the not-used line" (round 2 also: the four "Key in list, supplied, …" tests, none of which puts or deletes; round 3 also: "Settle in rule 3: …", which never puts or deletes)

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The key printed after the put → Test: "First deploy: the key is printed once with the keep-a-copy lines before it is put, put once, then the set-up code" (also failed: "Put fails after generating: …", "Output: every run prints …"; reverted)
- The key printed twice → Test: "First deploy: the key is printed once with the keep-a-copy lines before it is put, put once, then the set-up code" (also failed: "Put fails after generating: …", "State unreadable: …", "Two runs: …", "Output: every run prints …"; reverted)
- The command deletes a key it did not put in this run (orchestrator ruling, 2026-11-22) → Test: "Key in list, supplied, mismatch: not put, not deleted; the Worker's-key-is-not-the-original line naming the Worker, exit 1" (made by calling `deleteSecret` on rule 3's mismatch path; also failed: "Output: every run prints …"; reverted)
- The delete follows the first `mismatch` reply (orchestrator ruling on stale replies, 2026-11-22) → Test: "Settle: steady mismatch: deleted once, after the 60-second window, not before; the removed-again line, exit 1" (made by settling `waitForSettledKeyState` on the first qualifying reply; also failed: the other four "Settle: …" rows, "Settle in rule 3: …", "Stored, supplied, matches, through main's key-state builder: …" and the three `waitForSettledKeyState` unit tests; reverted)

**Final verification (build session, 2026-11-22, after review round 3's patches):** run one at a time in `site-studio/` by the build session: `npm run typecheck` clean; `npm test` 224 pass, 0 fail; `npm run build` passes (the usual chunk-size warning); `npm run test:sites` 4 pass; `npm run test:server` 34 files, 490 tests pass. Main's wiring is proven by "main's options: createMainOptions with a supplied key and fingerprint none puts that key, generates nothing, exit 0". No Wrangler or Cloudflare call was made at any point; `sprint-status.yaml` was not changed (the orchestrator updates it).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck` -- pass
- `npm run build && npm run test:sites` -- pass

## Review Triage Log

Review round 1 (2026-11-22): Blind Hunter (BH), Edge Case Hunter (ECH) and Verification Gap (VG), each a fresh Opus subagent on the diff since `b7e7d66`. One row per finding.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | BH 1, ECH 1, ECH claim 1 | After `mismatch`, the wrong supplied key stays in `DEPLOYMENT_KEY`; the "not the original" line says to supply the original and run again, but the rerun lists the key, takes the kept path ("kept", "not used", exit 0) and never puts the original | high | `supplyDeploymentKey`: the put precedes the confirmation and nothing removes the secret; the kept path returns 0 without asking the key state. Matches the frozen text ("Key in the list: no put"; "A key in the list is never replaced") | intent_gap (grouped with 2–4) |
| 2 | ECH 2 | After "not confirmed", a rerun with the same key (as its line says) takes the kept path and exits 0 unconfirmed | high | Same root cause as 1: the confirmation exists only on the run that puts | intent_gap (group 1) |
| 3 | BH 2 | The kept path never checks a supplied key, or the Worker's key, against a stored fingerprint | high | Same root cause as 1 | intent_gap (group 1) |
| 4 | ECH 5 (consequence) | A supplied put that fails after storing leaves an unconfirmed key that later runs keep | medium | Same root cause as 1 | intent_gap (group 1) |
| 5 | VG gap | `main()` forwards `accept` to `waitForKeyState` through a closure that no test exercises | low | Confirmed: every test supplies its own `askKeyState`; breaking line 506 would leave the suite green | patch (moot until group 1 is resolved) |
| 6 | VG other, BH 3, ECH 4, ECH 5 | A failed put of a supplied key is not caught; it ends in `main`'s `Deploy failed: wrangler secret exited with N.` | low | Real, exit 1 with Wrangler's own error on standard error; the Build notes allow it, and a dedicated line would be new wording (D-21 forbids) | reject (the stored-case consequence is row 4) |
| 7 | ECH 3, BH 4, ECH claim 3 | With the list lacking the key, a key state of `present` (a concurrent deploy) is ignored and a key is generated over it | medium | Real only for two deploys at once, which D-17 and finding 10 accept as a race, warned by the first line and deferred to Epic 9 | reject (intent accepts the race) |
| 8 | ECH 6, BH 5 | `parseSecretList` takes the first array, so a warning holding `[]` before the listing reads as an empty list | false | Wrangler 4.164.0's logger writes warnings with `console.warn` (`cli.js` about line 71114, to standard error, which is inherited, not captured); with `--format json` no banner is printed; standard output holds only the JSON. The frozen text requires the first array | reject |
| 9 | ECH 7 | An earlier array of non-objects makes the listing fail instead of trying the next array | low | Real only for output Wrangler does not print; fails safe (exit 1, nothing generated) | reject |
| 10 | ECH 8 | `child.stdin.end(input)` has no error handler; an EPIPE when Wrangler exits before reading would crash the process after the key is printed, skipping the "may or may not" line | low | `runWrangler` attaches no `stdin` error listener; the key is already printed, so nothing is lost, but the line is skipped | patch (moot until group 1 is resolved) |
| 11 | ECH 9, BH 6 | A supplied key with surrounding whitespace is refused as malformed | low | Spec-conformant (43 characters exactly); the refusal is safe and its line accurate; trimming is new behaviour | reject |
| 12 | ECH deletion, BH 7 | The no-Worker-name check now runs on a closed installation and its message mentions only the set-up code | false | Intended (finding 29, matrix row "No Worker name"); the message is story 1.2's and stays unchanged (Ask First) | reject |
| 13 | BH 8 | `KEY_LINES.stateUnreadable` hard-codes the route path instead of `DEPLOYMENT_KEY_STATE_PATH` | low | Duplicate source of truth; a direct correction | patch (moot until group 1 is resolved) |
| 14 | BH 9 | Captured listing output is never shown, and `runWrangler`'s capture mode has no direct test of a non-zero exit or several chunks | low | Wrangler's errors go to the inherited standard error, so the operator sees them; the test gap is minor | reject |
| 15 | BH 10 | The harness tells the confirmation poll by `accept.length > 0` | low | Fragile to a refactor of `keyConfirmed`; comparing with the exported `keyConfirmed` is a direct correction | patch (moot until group 1 is resolved) |
| 16 | BH 11 | No README or deploy guide describes `SITE_SURVEY_DEPLOYMENT_KEY`, the printed key or recovery | low | Real; operator documentation is not in this spec's files | defer |
| 17 | BH 12 | No test shows `SETUP_CODE` is put only after a restored key is confirmed with set-up open | low | The order follows from the code (the set-up steps run only after `supplyDeploymentKey` returns 0); one assertion would pin it | patch (moot until group 1 is resolved) |

**Outcome of round 1:** group 1 (rows 1–4) is an intent_gap, rooted in the frozen block (the kept path and "never replaces"), so the cascade stops there and the patch and defer rows wait. `review_loop_iteration` is 1. The code is left uncommitted in the working tree, not reverted, until the orchestrator rules; the full diff is saved in the shared notes folder (`spec6-round1.patch`).

**Resolution of group 1:** orchestrator ruling, 2026-11-22 (Claude, on Kevin's instruction): option (a), rules 1 to 5, now in the frozen block, `wording.md`, D-17 and `.memlog.md`. Patch rows 5, 10, 13, 15 and 17 are carried into "Build notes, round 2"; row 16 goes to `deferred-work.md` at the end of the review.

Review round 2 (2026-11-22, after the ruling's build): the same three layers on the diff since `b7e7d66`. Carried rows are marked.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 18 | ECH 2, ECH 3 | A Worker copy still on an earlier version answers the confirmation poll: after a quick rerun with the original key, a copy still holding the previous run's wrong key answers `mismatch`, and rule 1 deletes the original and says it is not the original (or a stale copy holding the original answers `matches` for a wrong key) | medium | The command's own `SETTLE_NOTICE` (D-7) records that some copies run the earlier version for about a minute after a deploy; the key-state reply carries no version, and `waitForKeyState` returns the first settling reply. The frozen rule 1 ("`mismatch` → delete") acts on that single reply | intent_gap |
| 19 | VG gap | No test drives `runWrangler` with a non-zero close, so a regression that resolved on any code would turn a failed put or delete into reported success | medium | Confirmed: `fakeSpawn` always closes with 0; every failure test replaces the action with a throwing fake | patch (moot until row 18 is resolved) |
| 20 | ECH 4, BH 2, ECH claim | (carried, row 7) the first key-state reply's `key` is ignored when the list lacks the key | carried | Code unchanged there; intent accepts the race | reject |
| 21 | ECH 4, BH 1 | (carried, row 8) a decoy `[]` before the listing | carried | Wrangler's warnings go to standard error | reject |
| 22 | ECH 5 | Each request's own 10 s limit can overrun the poll's deadline | low | Real, same as story 1.2's `waitForSetupState`; at most one request's limit | reject |
| 23 | ECH 6 | A captured standard output that errors, or a grandchild holding the pipe, could crash or hang `runWrangler` | maybe-false | Would need Wrangler to leave a process holding standard output after `secret list`; nothing seen in its source suggests it; if true, low | reject |
| 24 | ECH 7, BH 11 | A spawn error followed by `close` with `null`, or a signal, reports "exited with null" | low | Real, cosmetic; the first settle wins and exit is 1 | reject |
| 25 | BH 3 | A plain redeploy never checks the Worker's key | false | Rule 4 of the ruling keeps it unchecked on purpose | reject |
| 26 | BH 4 | The header comment says Wrangler's output comes first, but the one-deploy-at-a-time line is printed before it | low | Real; a direct comment correction | patch (moot until row 18 is resolved) |
| 27 | BH 5 | (carried, row 12) the no-Worker-name message | carried | Story 1.2's message, unchanged (Ask First) | reject |
| 28 | BH 6, BH 7 | The "Worker's key is not the original" exit prints no "kept" line while the not-confirmed exit does; "kept" and "not used" repeat a clause | false | As ruled and worded: the mismatch line itself begins "The Worker already has a deployment key"; both lines are `wording.md`'s | reject |
| 29 | BH 8 | A stored generated key gets no confirmation line | false | `wording.md` gives none; adding text is not allowed (D-21) | reject |
| 30 | BH 9 | `deleteSecret` relies on piped empty standard input making `secret delete` non-interactive | false for the pinned source | `confirm2` takes its fallback "yes" when standard input or output is not a terminal (`cli.js` about lines 141647 and 35395); listed as an assumption for spec 9's deployed run | reject |
| 31 | BH 10 | (carried, row 11) whitespace around a supplied key | carried | Spec-conformant refusal | reject |
| 32 | BH 12 | The `SETUP_CODE` put is not guarded | false | Story 1.2's step, unchanged (Ask First); it throws to `main`'s "Deploy failed" with exit 1 | reject |
| 33 | BH 13 | The summary "Output" test never checks exit codes | low | Real; one expected code per row is a direct addition | patch (moot until row 18 is resolved) |
| 34 | BH 14 | The title "State unreadable: … is retried" reads oddly | false | The title is the matrix row's name, as the Build notes require | reject |

**Outcome of round 2:** row 18 is an intent_gap (frozen rule 1 acts on a single reply), so the cascade stops again; `review_loop_iteration` is 2. Code left uncommitted in the working tree; the question went to the orchestrator.

**Resolution of row 18:** orchestrator ruling on stale replies, 2026-11-22 (Claude, on Kevin's instruction): option (a), the settled answer, now in the frozen block, `wording.md`, D-17 and `.memlog.md`. Patch rows 19, 26 and 33 are carried into "Build notes, round 3".

Review round 3 (2026-11-22, after the settle build): the same three layers on the diff since `b7e7d66`.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 35 | VG gap 1 | `main()`'s options (`env: process.env`, `settleKeyState`, `deleteSecret`) are run by no test; dropping `env` would silently ignore an operator's key | medium | Confirmed: `main` is not exported and every test builds `runDeploy`'s options itself | patch |
| 36 | VG gap 2, BH 11 | The `stdin` EPIPE guard in `runWrangler`, and a `close` with `null`, have no test | low | Confirmed: `fakeSpawn`'s `stdin` never emits `error` | patch (EPIPE test; the `null` code is row 24, rejected) |
| 37 | BH 3 | The "checking" line names the key in SITE_SURVEY_DEPLOYMENT_KEY, but on rule 3's path the Worker's key is checked; the Worker's-key-not-confirmed line implies a comparison of the supplied key that never happens | medium | Confirmed against `supplyDeploymentKey`: the route compares only the Worker's key; both lines were drafted in this build | patch (`wording.md` reworded: "Checking the deployment key with this installation. This takes at least a minute." and "The Worker did not say whether its deployment key matches the secrets this installation holds. Nothing was changed. Run the command again.") |
| 38 | BH 2 | With the key in the list, a supplied key that differs from the Worker's matching key still ends "kept", "not used", exit 0 | false | Both lines are accurate: the supplied key is reported as not used, and nothing claims it matches; rule 3 as ruled | reject |
| 39 | BH 11 | `createKeyStateAsker` forwards an `accept` that no caller passes any more | low | Confirmed: rules 1 and 3 call `askKeyState(address)` only; dead path | patch (remove the forwarding and `waitForKeyState`'s `accept` with their tests) |
| 40 | BH 12 | The output-table test picks deleting rows as `rows[10]`, `rows[11]`; a comment in "Rerun with that key" says a check settles where none does | low | Confirmed; direct corrections | patch |
| 41 | ECH 2 | Stale copies answering longer than 60 s would still settle on a stale value | maybe-false | The ruling sets 60 s and sends the measurement to spec 9, which reports back if copies last longer | reject (covered by the ruling's spec 9 check) |
| 42 | ECH 3, BH 8 | More than about 5.5 s per request can never reach 21 replies; the deadline can overrun by one request's 10 s | low | Real; the minimum is ruled and the outcome is the safe "not confirmed" | reject |
| 43 | ECH 5 | A 200 reply whose body is not JSON leaves the body uncancelled | false | `response.json()` reads the whole body before failing to parse, so nothing is left open | reject |
| 44 | ECH 1, BH 1 | (carried, rows 8 and 21) a decoy `[]` before the listing | carried | Wrangler's warnings go to standard error | reject |
| 45 | ECH 4 | (carried, rows 7 and 20) the first key state's `key` is ignored when the list lacks the key | carried | Intent accepts the race | reject |
| 46 | BH 4 | (carried, row 30) the delete is not checked by listing again | carried | Pinned source takes "yes" without a terminal; spec 9 assumption | reject |
| 47 | BH 5 | (carried, rows 12 and 27) the no-Worker-name message | carried | Story 1.2's message (Ask First) | reject |
| 48 | BH 6 | (carried, rows 11 and 31) whitespace around a supplied key | carried | Spec-conformant refusal | reject |
| 49 | BH 7 | No test ties `KEY_LINES` to `wording.md` | low | A planning file read by the app's unit tests would couple them to `_bmad-output/`; review checks the text | reject |
| 50 | BH 9 | After "not confirmed", a rerun gets the manual-delete line instead of an automatic removal | false | As ruled: rule 2 keeps the key, rule 3 refuses with the manual command | reject |
| 51 | BH 10 | (carried, row 28) the "kept" line differs between the two key-in-list failures | carried | As worded | reject |

**Outcome of round 3:** no intent_gap or bad_spec; patches 35, 36, 37, 39 and 40 go to the implementation subagent; row 16 is deferred at the end.

**Final outcomes:** patched and verified: rows 5, 10, 13, 15, 17 (round 2's build), 19, 26, 33 (round 3's build), 35, 36, 37, 39, 40 (round 3's patches); resolved by orchestrator rulings: rows 1–4 and 18; deferred to `deferred-work.md`: row 16; every other row rejected as logged.

## Pull request 13, CodeRabbit review round 1 (2026-11-24)

Dated notes; the frozen block above is unchanged. Record: `../review-round-1.md`.
- **`--url` is tied to the Worker** (orchestrator ruling of 2026-11-24, Claude, accepted on Kevin's instruction; D-17's amendment). After the deploy and the address choice, a `--url` whose host is not one Wrangler reported for this deploy (an `https://` target, a custom domain, a route pattern without a wildcard; compared exactly, without regard to case; narrowed by the builder, and confirmed by the orchestrator on 2026-11-24, to routes covering the whole host, `host/*`, and to an address with no explicit port) stops the command with `KEY_LINES.urlNotReported`, exit 1, before any key step and before the set-up-code steps. The deploy has already run at that point (the reported hosts are known only after it), which is the order the command already had for every key-step stop. The matrix has no row for this; the tests are named in the round record.
- **A settled answer must complete within 180 seconds.** `waitForSettledKeyState` now answers null for a reply that completes after its deadline, even one that would settle the run; the frozen block's "within 180 seconds" was read as the reply's completion time (the builder's reading, confirmed by the orchestrator on 2026-11-24). Each request's own 10-second limit can still carry the last poll past the deadline (rows 22 and 42, rejected), but such a reply now decides nothing.
- **The `[]` decoy is rejected a fourth time** (CodeRabbit's outside-diff finding on `parseSecretList`): rows 8, 21 and 44 above; Wrangler writes warnings to standard error, which is not captured, and the frozen block requires the first JSON array.
- **Round 2 (2026-11-24, `../review-round-2.md`)**: the key-state and set-up-state requests refuse redirects (`redirect: "error"`), so a redirect counts as an unreadable reply and can never hand the key decision to another Worker (orchestrator ruling, Claude, accepted on Kevin's instruction); a route reported with its scheme counts only when it covers the whole host (`https://host/*`), as the bare form already did, and `https://host/` (the root alone) does not; without `--url` the address is the first https target that names its whole host (Wrangler prints the workers.dev address as `https://<host>` with no path, so a route limited to a path is never chosen); an explicit port in `--url` is read from the text as written, in any spelling the URL parser accepts (`https:host:443`, backslashes, leading control characters), so `:443` is refused too; and the settle wait starts no request after its 180-second limit. A permanent redirect on the address now shows as the state-unreadable line after the wait; that line does not say a redirect was refused (a reason would be new wording).
- **Round 3 (2026-11-25, `../review-round-3.md`)**: the address asked without `--url` is unchanged from round 2 (the first `https://` target naming its whole host, which in Wrangler 4.164's output is only the workers.dev address); a deploy without one still stops with the "no https:// address … Run again with --url" line. A first ruling the same day made a custom domain, then a `host/*` route, the default; the review layers showed that this extended, without any opt-in, the trust in a route that CodeRabbit's finding questions, and rested on an unverified claim that only this Worker answers on a custom domain, so the orchestrator withdrew it the same day (pure option (c); Claude, accepted on Kevin's instruction). `--url` is unchanged: with it on a custom domain or a `host/*` route the command trusts that no other Worker's route on that host covers `/api/v1/` (README sentence; proper fix deferred to story 9.12). The settle wait reads the clock again after each sleep, so a sleep that ends late starts no request after the limit.
- **The deployed run of 2026-11-24 (spec 9) used the earlier command.** It never passed `--url`, so the new check would not have changed it; nor did any of its settles end near the 180-second limit (each check took 62–67 seconds).
