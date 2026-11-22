---
title: "Story 1.5, spec 6: The deploy command's deployment key"
type: 'feature'
created: '2026-11-22'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
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
  - Key in the list: no put; the "kept" line, and the "not used" line when a key was supplied.
  - Key not in the list: ask the key state (null → the "state unreadable" line, exit 1, nothing generated or put). Then:
    - `fingerprint: "none"`, key supplied: put it; the "supplied" line.
    - `fingerprint: "none"`, none supplied: generate; print the key and the keep-a-copy lines **before** the put (finding 1); put; if the put fails, print the "may or may not have been stored" line and exit 1.
    - `fingerprint: "stored"`, key supplied (the operator's claim that it is the original, finding 2): put it; poll the key state until `key` is `matches` or `mismatch`; `matches` → the "supplied" line; `mismatch` → the "not the original" line, exit 1; no answer in time → the "not confirmed" line, exit 1.
    - `fingerprint: "stored"`, none supplied: the "encrypted values but no key" line, exit 1, nothing generated or put.
  - Then story 1.2's set-up-code steps unchanged. Printed order: the deploy line, the key lines, then the set-up lines (finding 29).
- The key is put with `wrangler secret put DEPLOYMENT_KEY --name <worker>` on standard input only. A generated key is printed exactly once; a supplied key is never printed. A key in the list is never replaced.
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
| Stored, supplied, mismatch | as above; state then `mismatch` | put; the "not the original" line | exit 1 |
| Stored, supplied, no answer | state never `matches` or `mismatch` in time | put; the "not confirmed" line | exit 1 |
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

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/scripts/deploy-cloudflare.mjs` -- key handling, order, messages, captured output, child environment, `listSecrets` and `askKeyState` wired in `main`.
- [ ] `site-studio/tests/deploy-cloudflare.test.mjs` -- matrix rows.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a first deploy, the key is printed once with the keep-a-copy instruction before it is put, and put once; a second run prints none (criterion 12). → Test: …
- Given a valid supplied key, it is put and nothing is generated or printed (criterion 13). → Test: …
- Given a secret list that holds `DEPLOYMENT_KEY`, no put of it happens, with or without a supplied key (criterion 22, CA-52). → Test: …

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The key printed after the put → Test: …
- The key printed twice → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck` -- pass
- `npm run build && npm run test:sites` -- pass
