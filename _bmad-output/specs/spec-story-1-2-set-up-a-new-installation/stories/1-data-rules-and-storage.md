---
title: 'Story 1.2, spec 1: Data, rules and storage'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '67968d08b1ceed6c2a5b64d9b81a6486cf2de2bb'
review_loop_iteration: 0
story_key: '1-2-set-up-a-new-installation'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.2's set-up needs shared input rules, password hashing and somewhere to keep users, the installation's name and wrong-code counts; story 1.1 left an installation object that answers only its status, and neither host config enables Node-compatible crypto.

**Approach:** Add the D-4 and password rules once in `shared/`, scrypt hashing and constant-time comparison in `server/auth/`, and to the installation object the tables and operations for the set-up state, raising and checking wrong-code counts (D-3) and creating the first administrator atomically; enable `nodejs_compat` on both hosts. Covers CAP-5, CAP-6, the storage half of CAP-7 and CAP-11 of the story SPEC; Decisions D-1 to D-6 there are frozen.

## Boundaries & Constraints

**Always:**
- Exactly two object classes; tables added to `Installation` with create-if-absent under data format 1 (standing rule 8). No host-specific code outside `server/files/` and `server/update/`. Exact dependency versions; no new dependency.
- Password, hash and set-up code never appear in logs, refusals or replies. A refusal names at most a field and may carry a number of seconds to wait.
- Counts live in installation-object SQLite storage and are raised before any code check.
- `shared/` and `server/` stay TypeScript. Existing tests unchanged.

**Never:**
- HTTP routes or route declarations, the origin/header check, the HTTPS redirect, `callObject` changes, the deploy script (spec 2). Pages or Playwright (spec 3). Any deploy (spec 4).
- Touching `experiments/`, the four Sites files or `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid set-up input | name 1–80, email ≤254 with light format, password 12–128 ≠ email | accepted; email trimmed and lower-cased | N/A |
| Bad input | name 0/81, installation name 0/81, password 11/129, password = email in any case, email 255 or no `@`, missing code | refused | `invalid_input` naming the field |
| Raise counts | open, address under limits | count raised for address and installation | N/A |
| Address waiting | ≥5 failures, inside 60 s·2^(n−5) (max 900 s) | refused, not counted | `setup_wait` + seconds |
| Address cleared | ≥15 min since last failure | count starts again | N/A |
| Installation cap | 100 failures in the rolling last 60 min | every address refused, not counted | `setup_wait` + seconds until the oldest leaves the hour |
| New code | fingerprint differs from stored | counts reset, new fingerprint kept | N/A |
| Users exist | any operation that opens set-up | refused | `setup_closed` |
| Concurrent creates | two creates at once | one administrator; the other refused | `setup_closed` |
| Stale fingerprint at create | stored fingerprint changed | refused | `setup_code_wrong` |

</frozen-after-approval>

## Code Map

- `site-studio/shared/refusal.ts` -- `REFUSALS`, `refusalBody`; add codes and an optional `retryAfterSeconds` number.
- `site-studio/shared/routes.ts` -- `checkInput` (first issue's path as field). Do not add routes: `HANDLERS` mapped type requires a handler per route (spec 2).
- `site-studio/server/objects/ObjectBase.ts` -- `ops` map, `OperationRefusal` (extend with seconds), `fetch` turns refusals into bodies.
- `site-studio/server/installation/Installation.ts` -- add tables and ops beside `status`.
- `site-studio/deploy/cloudflare/wrangler.jsonc`, `deploy/selfhost/config.capnp` -- add `nodejs_compat`; dates stay equal.
- `site-studio/server-tests/helpers.ts`, `objects.test.ts` -- reuse `runInDurableObject`, `evictDurableObject`, `callObject`.
- `experiments/cloudflare-probes/worker.js` -- R9 `scryptSync(..., { N, r: 8, p: 1, maxmem: 256 MiB })`; reference only.
- No `@types/node`; declare only the `node:crypto` functions used.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/setup.ts` -- limits, field schemas and `setupInput` (strict; trims names, trims and lower-cases email; password≠email ignoring case; lengths in code points) -- one shared rule (standing rule 6).
- [x] `site-studio/shared/refusal.ts` -- `setup_closed`, `setup_code_wrong`, `setup_wait` (says redeploying issues a fresh code), `setup_code_not_configured`, `origin_refused`; `retryAfterSeconds` option.
- [x] `site-studio/server/auth/password.ts`, `setupCode.ts`, `node-crypto.d.ts` -- scrypt hash/verify with stored parameters and 16-byte salt; code fingerprint (SHA-256 hex) and constant-time compare.
- [x] `site-studio/server/installation/setupStore.ts` + `Installation.ts` -- tables `users`, `settings`, `setup_code`, `setup_failures_by_address`, `setup_failures`; pure wait rules; ops `setupState`, `setupAttempt`, `createFirstAdministrator` (one synchronous transaction, clears counts).
- [x] `site-studio/server/objects/ObjectBase.ts` -- carry seconds from `OperationRefusal`.
- [x] Both host configs -- `nodejs_compat`.
- [x] `site-studio/server-tests/setup-rules.test.ts`, `password.test.ts`, `setup-store.test.ts`, `host-config-flags.test.ts` -- matrix rows, restart, concurrency, CAP-11.

**Acceptance Criteria:**
- Given a created administrator, when the `users` row is read, then it holds scrypt N=131072 r=8 p=1, 32-byte hash and salt, and no column contains the password.
- Given raised counts, when the object restarts, then counts and waits are unchanged.
- Given an administrator, when a project room or any operation other than `createFirstAdministrator` runs, then accounts and the installation's name are unchanged (CAP-11: only the installation object holds them and it has no restore operation).

## Design Notes

Wait for n failures: 0 below 5, else min(60·2^(n−5), 900) s; refused while now < last + wait. A correct code also raises the count (raised before the check); success clears all counts. Entry order is the Worker's (spec 2): `setupAttempt` → compare code → hash → `createFirstAdministrator`, so wrong codes cost no scrypt and the object never awaits between check and insert.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass (bundle loads under workerd with `nodejs_compat`)

## Implementation Notes

- Implemented directly from this spec: the runtime offers no subagent tool, so no implementation subagent was launched.
- Route declarations were not added: `HANDLERS` is a mapped type over `ROUTES`, so a declared route needs its handler (spec 2). The shared schemas (`setupInput`, `SETUP_STATES`) are ready in `shared/setup.ts` for spec 2 to declare.
- Decided here (not visible to users beyond the stated rules): names and the email are trimmed before measuring; lengths count Unicode code points; the light email check needs one `@`, no spaces or control characters, and a domain not starting or ending with a dot (no dot required, for intranet addresses). Passwords are hashed as typed (UTF-8, no Unicode normalisation).
- scrypt uses async `node:crypto.scrypt` with `maxmem` 256 MiB (a ceiling, R9's value); salt 16 random bytes; hash and salt stored base64 in `users` columns beside `password_n/r/p/key_length`. `node:crypto` is typed by a local `server/auth/node-crypto.d.ts`; no `@types/node`.
- `nodejs_compat` is in both host configs; workerd 1.20261117.1 prints that the flag is default from 2026-08-04, so it is redundant on the self-hosted runtime at this compatibility date but kept explicit and equal on both hosts (checked by `host-config-flags.test.ts`).
- Sprint status sync was skipped on the orchestrator's instruction (`sprint-status.yaml` is managed outside this run).
- Verification after the review patch: `npm test`, `npm run typecheck`, `npm run test:server` (8 files, 76 tests), `npm run build`, `npm run test:sites`, `npm run smoke:selfhost` all exit 0.

## Spec Change Log

## Review Triage Log

Review pass 1 (2026-11-20). The runtime has no subagent tool, so the three layers (blind hunter B, edge-case hunter E, verification gap V) were run inline by the session against the staged diff, each following its instruction file; they were not context-free. Route: P = patch, D = defer, R = rejected.

| # | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|
| B1 | Comments say the object receives "the code's fingerprint" without saying it must be the configured code's; spec 2 passing the entered code's fingerprint would let every guess reset the counts | medium | `setupCode.ts` header and the `setupAttempt` op comment were ambiguous; `attempt()` resets counts whenever the fingerprint differs | P (comments in `setupCode.ts`, `setupStore.ts`, `Installation.ts`) |
| B2 | Two set-up requests with the right code at once could run two 128 MiB scrypt hashes in one isolate, above the 128 MB Worker limit | maybe-false | Hashing is in the Worker (spec 2); R9 never ran two at once. Settle on a deployed installation (spec 4 already lists it) | D (medium if true) |
| B3 | `createFirstAdministrator` accepts any positive scrypt parameters and loosely checked base64, so a faulty caller could store an unverifiable hash | low | Only the Worker calls it, with `hashPassword` output; not reachable from user input | R |
| B4 | The public address may be `http:` | false | It is the accepted request's origin (standing rule 13); on Cloudflare D-1 redirects plain HTTP first, and `http:` is needed for the local runtime | R |
| B5 | Fingerprints from old and new Worker copies alternating during a deploy reset the counts repeatedly | low | Only during the minutes after a deploy, codes have 20+ random characters, and the attacker cannot choose the copy | R |
| B6 | `users` has no version column for standing rule 1's versioned edits | low | No edit operation exists yet; before the first release a changed shape re-creates installations (standing rule 8) | R |
| B7 | Names accept control and bidi characters | low | D-4 sets the rules; adding a character rule is a product choice, and display escaping is the page's job (spec 3) | R |
| B8 | The ambient `node:crypto` declaration would clash if `@types/node` were added | low | Not added; would fail loudly at typecheck if it ever were | R |
| B9 | workerd warns that `nodejs_compat` is redundant at this compatibility date | low | Harmless warning; the story requires the flag on both hosts | R |
| B10 | The set-up code's fingerprint stays stored after set-up | low | The code is dead once a user exists (`attempt` refuses first); a SHA-256 of 20+ random characters reveals nothing | R |
| B11 | `toLowerCase` and code-point counting treat Turkish dotless i and combining marks imperfectly | low | Edge cases with no user impact under D-4's wording | R |
| E1 | A clock that moves backwards across restarts lengthens a wait beyond its value | low | Bounded by the skew; Cloudflare clocks are synchronised | R |
| E2 | `publicAddressField` refuses an upper-case host or explicit default port | false | Spec 2 passes `URL.origin`, which is canonical, so a non-canonical value is a caller bug and refusing it is correct | R |
| E3 | Claims check: Intent, Tasks and Acceptance claims (tables, three operations, one transaction, counts cleared on success, code points, `origin_refused`, flags on both hosts) | false | Each traced to the diff; no claim falsified | R |
| V1 | The self-hosted `nodejs_compat` flag is not exercised: the built bundle imports nothing from `node:crypto` yet, so the smoke test passes without it | low | Real gap; closes when spec 2 imports `server/auth` into the entry, after which the smoke test loads a bundle that needs the flag | D |
