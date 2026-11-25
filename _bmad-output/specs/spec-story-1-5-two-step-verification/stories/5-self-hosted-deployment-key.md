---
title: 'Story 1.5, spec 5: The self-hosted deployment key'
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: 'd2600baa717fdde0106c30ce7bd59dd41ad3f366'
route: 'dispatch'
review_loop_iteration: 0
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/brownfield.md'
---

> Builds to D-16 and D-22 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Split out of spec 4 after the review's "Spec size and order"; built right after spec 4. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Self-hosted, the Worker gets no `DEPLOYMENT_KEY`, so two-step verification cannot be turned on, and the smoke suite does not show the two-step code running under workerd.

**Approach:** Bind `DEPLOYMENT_KEY` from an environment variable in the self-hosted configuration until story 2.23's key file replaces it, and extend the smoke suite to turn two-step verification on and sign in with it before and after a restart, without a key, and with a changed key. Covers the self-hosted part of CAP-10 and the smoke evidence for CAP-3 and CAP-5 (standing rule 7).

## Boundaries & Constraints

**Always:**
- `deploy/selfhost/config.capnp` gains `(name = "DEPLOYMENT_KEY", fromEnvironment = "DEPLOYMENT_KEY")` in the Worker's bindings (D-16), with a comment that story 2.23 replaces it with the key file; never a `text` binding holding a key.
- `deploy/selfhost/smoke.mjs` starts workerd with a key generated for the run (32 bytes, base64url, `node:crypto`) in that variable, only in the child's environment, never in a file or the output. Before and after its restart it turns two-step verification on through the API (password, start, confirm with a code computed by its own RFC 6238 helper), signs in with the password and a code of a later step, and finds a recovery code accepted once and refused the second time.
- A start with no variable runs on a separate empty storage directory (otherwise the stored fingerprint makes it a mismatch) and finds the two-step state `no_key` and start refused `deployment_key_missing`; an unset `fromEnvironment` binding is `null`, which spec 4's handlers treat as no key (finding 6, finding 31).
- A restart on the first storage with a different key finds the state `key_mismatch`, a recovery code still signing in, a code refused `deployment_key_mismatch`, and the `deployment_key_mismatch` log line exactly once in workerd's output (finding 31).
- `server-tests/host-config.test.ts` checks that the self-hosted `DEPLOYMENT_KEY` binding is `fromEnvironment` and that `config.capnp` holds no `text` binding named `DEPLOYMENT_KEY`.
- The smoke output names checks and outcomes only.

**Ask First:** a change to how the smoke suite supplies the set-up code (story 1.2).

**Never:** routes, handlers, stores or pages; a key in `config.capnp`, the temporary smoke configuration, a file or the output; `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| With a key | variable set | two-step on; code sign-in; recovery code once | N/A |
| Restart, same key | same storage, same variable | code of a later step signs in | N/A |
| No variable | fresh storage, variable unset | state `no_key`; start refused | `deployment_key_missing` |
| Changed key | first storage, another key | state `key_mismatch`; recovery code signs in; code refused; one log line | `deployment_key_mismatch` |
| Config | `config.capnp` | `fromEnvironment` binding; no `text` key | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/deploy/selfhost/config.capnp`, `smoke.mjs` -- the binding; the smoke run's start-up and checks (it already adds `SETUP_CODE` to a temporary configuration).
- `site-studio/node_modules/workerd/workerd.capnp` lines 757–761 -- `fromEnvironment`, `null` when unset.
- `site-studio/server-tests/host-config.test.ts` -- configuration checks.

## Build notes (build session, 2026-11-22)

- Read `site-studio/AGENTS.md`. What specs 1 to 4 left, read only: `shared/routes.ts` (paths and reply schemas: `POST /api/v1/session/sign-in` answers `{ name }` or `{ secondStep: true }` with the pending cookie `__Host-ssd-p-…`; `POST /api/v1/session/second-step` takes `{ method: "code" | "recovery", code }`; `GET /api/v1/account/two-step` answers `{ enabled, recoveryCodesRemaining, availability: "available" | "no_key" | "key_mismatch", email }`; `POST /api/v1/account/two-step/start` `{ password }` answers `{ setupId, secret, otpauthUri, installationName, email }`; `/confirm` `{ setupId, code }` answers `{ recoveryCodes }` (10); public `GET /api/v1/deployment-key/state` answers `{ fingerprint, key }`), `shared/twoStep.ts` (6 digits, 30-second step, window ±1, the base32 secret), `server/auth/totp.ts` (HMAC-SHA-1, RFC 6238), `server/auth/deploymentKey.ts` (`parseDeploymentKey`: 32 bytes, unpadded base64url, `randomBytes(32).toString("base64url")` in Node), `server/installation/keyGuard.ts` (the log line, once per object start, written with `console.log`), `server/api/handlers.ts` (`deploymentKeyInput`: a `null` or empty `DEPLOYMENT_KEY` counts as no key). The refusal codes are in the reply body's `error.code`.
- Files in scope: `site-studio/deploy/selfhost/config.capnp`, `site-studio/deploy/selfhost/smoke.mjs`, `site-studio/server-tests/host-config.test.ts`. The RFC 6238 helper (HMAC-SHA-1 with `node:crypto`, base32 decode) goes inside `smoke.mjs`, written independently of `server/auth/totp.ts` (it cannot import TypeScript, and an independent helper cross-checks it). Any other file needs a reason in the report. Not in scope: routes, handlers, stores, pages, browser tests, `scripts/`, `experiments/`, `sprint-status.yaml`.
- The key: generated once per run in `smoke.mjs`, and a second, different one for the changed-key run; passed only through `spawn`'s `env` (`{ ...process.env, DEPLOYMENT_KEY: key }`). For the no-variable run, pass a copy of `process.env` with `DEPLOYMENT_KEY` deleted, so a variable in the caller's shell cannot leak in. `withServer` takes the storage directory and the key (or none) as arguments. The temporary configuration keeps only the `SETUP_CODE` line it adds today; do not change how the set-up code is supplied (Ask First).
- Order, keeping every existing check: run 1 (first storage, key A) as today, then turn two-step verification on with the signed-in cookies (start with the password, confirm with a computed code), check the state reads `enabled: true`, `availability: "available"`, sign in with the password (expect `{ secondStep: true }` and a pending cookie only), complete the second step with a code, and use one recovery code at the second step (accepted), then the same recovery code again on a new pending sign-in (refused `second_step_recovery_code_wrong`). Run 2 (first storage, key A): the existing checks, plus a password sign-in and a code of a step later than any used before signs in. Run 3 (a second, new empty storage directory, no variable): complete set-up there with the same set-up code, sign in, find the state's `availability` `"no_key"`, the key state `{ fingerprint: "none", key: "none" }`, and start refused `deployment_key_missing`. Run 4 (first storage, key B): the key state `{ fingerprint: "stored", key: "mismatch" }`; a password sign-in gives a pending cookie; a code at the second step is refused `deployment_key_mismatch` (the pending cookie is kept); an unused recovery code on that pending cookie then signs in; the two-step state reads `"key_mismatch"`; and workerd's output holds the line `{"event":"deployment_key_mismatch","object":"installation"}` exactly once. Delete both storage directories and the temporary configuration in `finally`. Mind the existing failure counts: wrong recovery or wrong codes may count toward the admin email's wait (five failures), so keep failures for that email few.
- The last-step rule: a code is accepted only for a step later than the last accepted step, within ±1 of now. Keep the last step used; for each code take `max(last + 1, stepAt(now) - 1)`, and only if that is above `stepAt(now) + 1` wait until the next step begins. Avoid waits where the window allows; print how long any wait was if one happens (no code).
- workerd's output: capture the child's stdout and stderr (`stdio: ["ignore", "pipe", "pipe"]`) to count the log line; do not echo it during a passing run. On a failure, print only the event names of lines that parse as JSON with an `event` field, never raw output. Workers' `console.log` may go to either stream; count over both.
- Never print a reply body from start, confirm, fresh codes or the second step: failure messages give the status and `error.code` only. The smoke output names checks and outcomes only. Never write a password, code, recovery code, authenticator secret, deployment key, cookie value or token into any file, log or message.
- `host-config.test.ts`: a new test that the non-comment text of `config.capnp` has `(name = "DEPLOYMENT_KEY", fromEnvironment = "DEPLOYMENT_KEY")` inside the Worker's bindings, and no binding named `DEPLOYMENT_KEY` with `text`, `json`, `data` or any other kind. `config.capnp` gets the binding with a comment that story 2.23 replaces it with the key file (D-16).
- Deliberate breakages (make, run, record what failed, revert): 1) the binding as `(name = "DEPLOYMENT_KEY", text = "")` (never a key value) → the host-config test and, after `npm run build`, the smoke suite; 2) the no-variable run on the first storage → the `no_key` check fails (the state then reads `key_mismatch`). Record each after its arrow in Tasks & Acceptance below, and each acceptance criterion's proving check after its arrow (name the smoke check by its output line or failure message).
- Commands, in `site-studio/`, one at a time, never two test runs at once: `npm run typecheck`, `npm run test:server` (a few minutes), `npm run build`, `npm run smoke:selfhost`. The build session runs the rest. Edit by hand, no bulk search-and-replace. `git` is slow: `git --no-pager`, long timeouts. No lint script; add none. Do not touch `.claude/`, `Site Studio UX screens.pdf`, `preview.html`. Do not commit. Report how long the smoke suite takes.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/deploy/selfhost/config.capnp` -- the binding.
- [x] `site-studio/deploy/selfhost/smoke.mjs` -- the key, the four runs above.
- [x] `site-studio/server-tests/host-config.test.ts` -- the binding check.

**Acceptance Criteria** (the builder records each proving check or test after the arrow; finding 34):
- Given a self-hosted run with the variable, two-step verification is turned on and a person signs in with a code before and after a restart (CAP-10, CAP-3, standing rule 7). → Check: smoke output lines "first start: two-step verification turned on, signed in with a code, a recovery code accepted once and refused the second time" and "after restart: signed in with the password and a code of a later step"; host-config test "self-hosted: binds DEPLOYMENT_KEY from the environment and never as a value in the file".
- Given a run without the variable on fresh storage, turning on is refused `deployment_key_missing` (CAP-10, D-16). → Check: smoke output line "start without a key: two-step verification not available (no_key), turning on refused deployment_key_missing".
- Given a restart with another key, a recovery code signs in, a code is refused `deployment_key_mismatch`, and the log line appears once (criterion 23, supporting). → Check: smoke output line "restart with a changed key: key mismatch reported, a code refused deployment_key_mismatch, a recovery code signed in, the log line written once".

**Deliberate breakages** (each must fail the smoke suite or the tests; record which):
- The binding written as `text` instead of `fromEnvironment` → host-config test "self-hosted: binds DEPLOYMENT_KEY from the environment and never as a value in the file" failed; after `npm run build` the smoke suite failed in the first start: "The deployment-key state: GET /api/v1/deployment-key/state answered 200 with fingerprint none and key none, not none and present." (an empty `text` binding counts as no key). Reverted.
- The no-variable run on the first storage (it must then report a mismatch, failing the `no_key` check) → the smoke suite failed in the no-key run at its first check, the public key state, before set-up: "Without a deployment key on empty storage: GET /api/v1/deployment-key/state answered 200 with fingerprint stored and key none, not none and none." (workerd's log events: `deployment_key_missing`, the guard's line for a stored fingerprint and no key). The two-step state read is not reached, since set-up is already closed on that storage and the administrator's sign-in needs a second step. Reverted.

**Build record (2026-11-22):** `npm test` (181 pass), `npm run typecheck`, `npm run test:server` (34 files, 490 tests), `npm run build`, `npm run test:sites` and `npm run smoke:selfhost` pass. The smoke suite takes about 13 s (three consecutive passing runs, 12.9–13.1 s; a run whose codes must wait for the next step took 72 s, measured after the orchestrator's check below). A first full run found the mismatch line twice: a 22 s wait for the code meant to be refused let workerd evict the idle installation object, which logged again on its restart (correct once-per-start behaviour). The refused code is now of the current step with no wait.

**Final verification (build session, 2026-11-22, after the review's patches):** run one at a time in `site-studio/`: `npm run typecheck` clean; `npm test` 181 pass; `npm run test:server` 34 files, 490 tests pass; `npm run build`; `npm run test:sites` 4 pass; `npm run smoke:selfhost` twice in a row, passing in 16 s and 25 s with no authenticator wait (the subagent's single run after the patches took 82 s, also with no wait; the cause was not found and did not repeat). The run-2 output line now ends "…, the same code refused the second time". The smoke output was read after the final run: check names and outcomes only, no key, secret, code, recovery code, cookie value or token; no temporary configuration or storage directory was left behind. `sprint-status.yaml` was not changed (outside this spec's scope; the orchestrator updates it).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Review Triage Log

Review of 2026-11-22: three layers (blind hunter B, edge-case hunter E, verification gap V) over the diff from `d2600ba`. The verification-gap layer found no gaps; its two other findings are in rows 11 and 18. No intent_gap or bad_spec entries, so no loopback. Patches were made by the implementation subagent and checked with the full verification run.

| # | Layer | Finding | Verdict | Evidence | Outcome |
|---|---|---|---|---|---|
| 1 | E1 | workerd's stdout and stderr are appended to one string, so a chunk of one stream can split a line of the other and the mismatch line goes uncounted | low | Both `data` handlers append to the same `output`; chunk boundaries are not line boundaries | patch: the streams kept apart and joined on read |
| 2 | E2, B11 | The host-config comment stripper flips its quote state on an escaped `\"` | low | `config.capnp` holds no escaped quote; a change that adds one would make the test fail loudly, not pass wrongly | rejected (low, unlikely) |
| 3 | E3 | The fourth run's `dataFormat` is never compared with the first start's | low | Only the second run's is compared | patch |
| 4 | E4 | Non-string recovery codes in the confirm reply would surface later as a misleading refusal | false | `recoveryCodesReply` in `shared/routes.ts` is a strict array of 10 strings, and a wrong code would fail the run loudly at the second step | rejected |
| 5 | E5, B2 | Breakage 2 fails at the public key-state check (`stored`/`none`), not at the `no_key` check the frozen block names, and reports a missing key rather than a mismatch | low | Real: on the first storage set-up is closed and the administrator's sign-in needs a second step, so the two-step state read cannot be reached; the breakage still fails the smoke suite on the same fact, as the frozen block requires. The fix would edit this build's spec | rejected (fix edits the spec; reported to the orchestrator) |
| 6 | B1 | No smoke run restarts the first storage without the variable on purpose | low | The scenario (fingerprint stored, no key) is ruled by D-15 and tested at the route in spec 4 (`two-step-routes.test.ts` and `second-step-routes.test.ts`, the null and empty key rows); the frozen matrix names four runs, not this one | rejected (covered by the server tests) |
| 7 | B3 | The changed-key run does not check that the recovery code was used up | low | `expectTwoStepState` in run 4 leaves out `recoveryCodesRemaining` | patch: `recoveryCodesRemaining: 8` |
| 8 | B4 | The changed-key run would not notice another `deployment_key_*` event | low | Runs 1 to 3 use `expectNoKeyEvents`; run 4 only counts the mismatch line | patch: the run's key events must be exactly `deployment_key_mismatch` |
| 9 | B5 | The code refused for the mismatch is of a used step, so the check relies on the key being checked before the last-step rule | false | The step rule matches the code against the decrypted secret, which cannot be read without the key, so the key refusal necessarily comes first (`signInStore.ts`, `keyGuard.ts`) | rejected |
| 10 | B6 | workerd evicts an idle installation object and the restarted object logs the line again; "exactly once" depends on run 4 being short | low | The wording (`wording.md`, "Runtime log") and D-15 say once per object start, which is what happens; run 4 takes about a second | rejected (matches the ruled wording) |
| 11 | B7, V other 2 | With workerd's output captured, a start-up failure gives no cause | low | "workerd exited before it answered." with no exit code | patch: the exit code or signal in that message; raw output still never printed |
| 12 | B8 | The waiting branch of `nextCode` did not run in the final passing runs; "up to about 35 s" is an estimate | low | Real; forcing it needs a test switch or a timed start | rejected (low; the estimate is reported as one) |
| 13 | B9 | The RFC 6238 self-test does not cover `base32Bytes` or a counter above 32 bits | low | Step 1 only, from ASCII bytes | patch: the base32 seed and the T = 20000000000 vector |
| 14 | B10 | No smoke evidence that a used code is refused under workerd (CAP-5, "a code works once") | low | The intent names smoke evidence for CAP-5; only a later step's code is shown accepted | patch: run 2 resends its accepted code on a new pending sign-in, refused `second_step_code_wrong` |
| 15 | B11 | The bindings regex stops at a nested list; `indexOf` of -1 is not handled; the temporary smoke configuration is not checked for a key | low | No binding holds a list; a missing `const siteStudio` fails the test loudly; `writeSmokeConfig` adds only the `SETUP_CODE` line and the base file is checked | rejected (low, unlikely) |
| 16 | B12 | `if (accept)` inside `nextCode`'s loop is dead | low | The early return leaves `accept` true there | patch |
| 17 | B12 | The 2-second margin departs from the build notes unrecorded; the diff's status reads `in-progress`; the build record gives no versions | false | The margin keeps the rule (`max(last + 1, …)`) and only avoids a step change in flight; the status is `in-review` in the file under review; the versions are pinned in `package.json` | rejected |
| 18 | V other 1 | The self-hosted run instructions do not say `DEPLOYMENT_KEY` must be set | low | `config.capnp`'s run comment and `README.md` omit it | patch: one line in `config.capnp`'s run comment; README deferred: `deferred-work.md`, to story 2.21 or 2.23 |

## After the orchestrator's check

The orchestrator accepted 338f1d7, including breakage 2 as recorded, and ruled two follow-ups in `smoke.mjs` (2026-11-22, build session):

- **The code wait, exercised.** `SMOKE_FORCE_CODE_WAIT=1` (off by default, read only by `smoke.mjs`, documented in its header) makes the first accepted code take the latest step the installation accepts, so the next accepted code must wait. The switch is kept. Waits can occur only in `nextCode` for a code expected to sign in: the confirm and the code sign-in of the first start, and the code sign-in of the restart. The changed-key run's only code is one expected to be refused, which never waits, so no wait sits between the mismatch line and its count. Forced run: two waits (26.6 s in the first start, 29.2 s after the restart), every check passed, the changed-key run found the mismatch line exactly once and no other key event; 72 s in all. Normal runs after the change: 16.9 s and 16.6 s, no wait.
- **workerd's start-up errors.** When workerd exits before it answers (and only then), its stderr is printed after the failure, without any line holding the set-up code or either key; every other failure prints event names only. Shown once by hand with two deliberately broken temporary configurations, then reverted: a parse error on the `SETUP_CODE` line printed two lines naming the temporary configuration's file, line and column with "Parse error." and "Missing field name."; an unknown field holding the code printed one line naming the position and the field's name. Neither quoted a value, and no line was withheld. The withholding filter is a guard for an error that might quote the configuration; it was not exercised.
- Commands, one at a time in `site-studio/`: `npm run build`; `npm run smoke:selfhost` twice and once with `SMOKE_FORCE_CODE_WAIT=1`, all passing; `npm run typecheck` clean; `npm test` 181 pass.

## Pull request 13, CodeRabbit review rounds (2026-11-24)

Dated notes; the frozen block is unchanged. Round 1 (`../review-round-1.md`): the restart's code is taken after the password step; key-state failures show only recognised values; a main guard so the file can be imported. Round 2 (`../review-round-2.md`): the replay check (a used code refused on a new pending sign-in) counts only while that code's step is still accepted when it is sent (`codeStillAccepted`, two seconds to spare); otherwise a fresh code signs in on that pending sign-in and the replay is tried again, at most three times. Round 3 (2026-11-25, `../review-round-3.md`): that window is bounded above too, so a code ahead of the server's window (the host clock moved back), which the server refuses with the same refusal as a replay, proves nothing either.
