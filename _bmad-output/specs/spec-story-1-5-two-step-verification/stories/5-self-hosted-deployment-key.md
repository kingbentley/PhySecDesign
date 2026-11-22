---
title: 'Story 1.5, spec 5: The self-hosted deployment key'
type: 'feature'
created: '2026-11-22'
status: 'ready-for-dev'
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

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/deploy/selfhost/config.capnp` -- the binding.
- [ ] `site-studio/deploy/selfhost/smoke.mjs` -- the key, the four runs above.
- [ ] `site-studio/server-tests/host-config.test.ts` -- the binding check.

**Acceptance Criteria** (the builder records each proving check or test after the arrow; finding 34):
- Given a self-hosted run with the variable, two-step verification is turned on and a person signs in with a code before and after a restart (CAP-10, CAP-3, standing rule 7). → Check: …
- Given a run without the variable on fresh storage, turning on is refused `deployment_key_missing` (CAP-10, D-16). → Check: …
- Given a restart with another key, a recovery code signs in, a code is refused `deployment_key_mismatch`, and the log line appears once (criterion 23, supporting). → Check: …

**Deliberate breakages** (each must fail the smoke suite or the tests; record which):
- The binding written as `text` instead of `fromEnvironment` → …
- The no-variable run on the first storage (it must then report a mismatch, failing the `no_key` check) → …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
