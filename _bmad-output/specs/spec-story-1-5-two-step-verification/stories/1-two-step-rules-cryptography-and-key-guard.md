---
title: 'Story 1.5, spec 1: Two-step rules, cryptography and the deployment-key guard'
type: 'feature'
created: '2026-11-22'
status: 'done'
baseline_commit: 'eb8d94060e851da37d33902fa7aba830fde63892'
route: 'dispatch'
review_loop_iteration: 0
story_key: '1-5-two-step-verification'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/wording.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> Builds to D-6, D-7, D-9, D-14, D-15, D-18, D-22 and D-21 (refusal wording) in `decisions.md`, each ruled "Claude, accepted on Kevin's instruction, 2026-11-22". Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing in the code computes or checks authenticator codes, formats recovery codes, or encrypts a value under a deployment key, and the installation has no record of which key its secrets use.

**Approach:** Write the shared two-step rules once in `shared/`, the TOTP and key cryptography in `server/auth/`, the new refusals, `DEPLOYMENT_KEY` in `Env`, and in the installation object the stored fingerprint with a guard that every encrypted read and write passes, plus a public read of the key state. Covers CAP-5's rules, CAP-10's guard and the formats of CAP-2.

## Boundaries & Constraints

**Always:**
- `shared/twoStep.ts`: `TOTP_DIGITS` 6, `TOTP_STEP_SECONDS` 30, `TOTP_WINDOW` 1, `TOTP_SECRET_BYTES` 20, `RECOVERY_CODE_COUNT` 10 (CA-11), `RECOVERY_CODE_LENGTH` 16, `PENDING_SIGNIN_TTL_MS` 5 minutes (CA-46), `TWO_STEP_SETUP_TTL_MS` 10 minutes (D-10); `CODE_FIELD_MAX_LENGTH` 12; `normaliseCode` (removes spaces, then exactly 6 ASCII digits or invalid); `normaliseRecoveryCode` (removes spaces and hyphens, lower case, Crockford base32 without i, l, o, u, exactly 16 or invalid); `formatRecoveryCode` (four groups of four, hyphens); `base32Encode`/`base32Decode` (RFC 4648, no padding); `otpauthUri({ secret, installationName, email })` per D-7 with `algorithm=SHA1&digits=6&period=30`: every ":" in the installation name or email is replaced by a space before the parts are percent-encoded, because the label's issuer and account are separated by a colon, encoded or not (finding 24); zod inputs for the routes' bodies (code, recovery code, set-up identifier, password as `signInPasswordField`).
- `server/auth/totp.ts`: `totpAt(secretBytes, step)` by RFC 6238 with HMAC-SHA-1 through `crypto.subtle`; `candidateSteps(now)` = current step −1, 0, +1; comparison of all candidates without early exit.
- `server/auth/deploymentKey.ts`: `parseDeploymentKey` (43 base64url characters decoding to 32 bytes, else null; anything that does not parse, an empty string or `null` included, counts as no key, finding 30); HKDF-SHA-256 with empty salt deriving the AES-256-GCM key (info `site-survey-design/encryption/v1`) and the fingerprint (info `site-survey-design/fingerprint/v1`, 32 bytes, stored as 64 hex); `encryptValue(key, plaintext, associatedData)` → `v1.<base64url IV>.<base64url ciphertext>` with a random 12-byte IV; `decryptValue` refuses any other prefix, a bad tag or other associated data.
- `server/env.ts`: `DEPLOYMENT_KEY?: string | null` (self-hosted, an unset `fromEnvironment` binding is `null`, `workerd.capnp:757-761`; findings 6, 21). This spec owns the file; spec 4 only reads it.
- The key reaches the installation object only inside an operation's input, passed by the Worker from its `env` (D-22); the object never reads `env.DEPLOYMENT_KEY`, never stores the key and caches only the key derived from it for the life of the object, keyed by the fingerprint. A `console` watch over the guard's tests and a refused operation finds no key.
- Fingerprint guard in the installation object (table `deployment_key`, one row, created if absent): `keyStatus(key)` answers `none` (no usable key, nothing stored), `ready` (usable key; fingerprint stored and equal, or none stored), `missing` (fingerprint stored, no usable key) or `mismatch` (fingerprint stored, another key). `encrypt`'s synchronous step inserts the fingerprint if none is stored and refuses `deployment_key_mismatch` if a different one is now stored (two first encryptions under different keys, finding 18); `decrypt` and `encrypt` refuse `deployment_key_mismatch` for `missing` and `mismatch`, and `encrypt` refuses `deployment_key_missing` for `none`. The first time after the object starts that the status is `missing` or `mismatch`, one JSON log line as `wording.md` gives, with `"reason":"malformed"` added when a key was given that does not parse (finding 30), and no key material.
- Operation `deploymentKeyState({ deploymentKey? })` (read-only, D-18 as ruled): `{ fingerprint: "none" | "stored", key: "none" | "present" | "matches" | "mismatch" }`: `key` is `none` when no usable key is given, `present` when one is given and no fingerprint is stored, and `matches` or `mismatch` only when a fingerprint is stored. It never answers the fingerprint or anything derived from the key.
- Refusals added to `shared/refusal.ts` with `wording.md`'s codes, statuses and messages.
- Tests generate their keys and secrets at run time; no key, secret or code literal other than RFC 6238's published test vectors.

**Ask First:** a dependency; a cipher or derivation other than D-14's.

**Never:** routes, handlers, the router, pages, browser tests (specs 4, 7, 8); two-step tables other than `deployment_key` (spec 2); `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| RFC 6238 vectors | SHA-1 seed of RFC 6238 appendix B, times 59, 1111111109, 1111111111, 1234567890, 2000000000, 20000000000 | the published 8-digit values' last 6 digits | N/A |
| Window | code for steps −2, −1, 0, +1, +2 around `now` | −1, 0, +1 match; −2, +2 do not | N/A |
| Code entry | "123 456", " 123456 ", "12345", "1234567", "12a456", full-width digits | first two normalise to "123456"; the rest invalid | invalid → null |
| Recovery entry | "ABCD-efgh jkmn-pqrs", 15 or 17 characters, an `o` or `l` | first normalises; the rest invalid | invalid → null |
| Base32 | 20 random bytes | encode then decode gives the same bytes; 32 characters, no `=` | N/A |
| URI | installation "Acme & Co", email "a+b@x.test" | label and issuer percent-encoded; parameters as D-7 | N/A |
| URI with a colon | installation "Site: North" | no ":" or "%3A" inside the issuer or the label's parts; one separator only (finding 24) | N/A |
| Encrypt and decrypt | key K, value, data `two-step:u1` | round trip; ciphertext lacks the value's bytes | N/A |
| Other data | decrypt with `two-step:u2` | — | refused |
| Other key | value from K decrypted under K′ | — | refused |
| Malformed key | 42 or 44 characters, `+`, decodes to 31 bytes, `""`, `null` | `parseDeploymentKey` null; counts as no key; log line has `reason` `malformed` when a fingerprint is stored and a non-empty string was given | N/A |
| First value | key K, no fingerprint | fingerprint of K stored with the value | N/A |
| Two first values | encrypt under K and K′ interleaved (both find no fingerprint before their synchronous step) | the first stores K's fingerprint; the second is refused (finding 18) | `deployment_key_mismatch` |
| Given another key | fingerprint of K stored, operation given K′ | `keyStatus` `mismatch`; encrypt and decrypt refused; one log line | `deployment_key_mismatch` |
| Given no key | fingerprint stored, no key in the input | `missing`; refused; one log line | `deployment_key_mismatch` |
| No key, nothing stored | no key, no fingerprint | `none`; encrypt refused | `deployment_key_missing` |
| Key state read | no key / K, nothing stored / K after a first value / K′ after it / none after it | `{none,none}`, `{none,present}`, `{stored,matches}`, `{stored,mismatch}`, `{stored,none}`; writes nothing | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/refusal.ts` -- add the refusals.
- `site-studio/shared/signin.ts`, `shared/setup.ts` -- `signInPasswordField`, `characterCount` to reuse.
- `site-studio/server/auth/session.ts`, `marker.ts` -- `toBase64Url`, `fromBase64Url`, `toHex`, HMAC through `crypto.subtle`, to pattern on.
- `site-studio/server/installation/Installation.ts`, `server/env.ts` -- `DEPLOYMENT_KEY?: string | null` in `Env` (read by the Worker only, D-22); register `deploymentKeyState`.
- `site-studio/server-tests/helpers.ts` -- object test patterns.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/twoStep.ts` -- constants, normalisers, base32, `otpauthUri`, inputs (standing rule 6).
- [x] `site-studio/shared/refusal.ts` -- the new refusals.
- [x] `site-studio/server/auth/totp.ts`, `server/auth/deploymentKey.ts` -- TOTP, HKDF, AES-GCM, fingerprint.
- [x] `site-studio/server/installation/keyGuard.ts`, `Installation.ts`, `server/env.ts` -- the `deployment_key` table, the guard, the log line, `deploymentKeyState`.
- [x] `site-studio/server-tests/vitest.config.mjs` -- a `DEPLOYMENT_KEY` binding generated with `node:crypto` when the configuration loads, never written to a file (for spec 4's route tests; store tests pass keys of their own).
- [x] `site-studio/server-tests/two-step-rules.test.ts`, `deployment-key.test.ts` -- matrix rows; the pinned operations list in `setup-store.test.ts` gains `deploymentKeyState`.

**Acceptance Criteria** (the builder records each proving test's title, `describe › it`, after the arrow; finding 34):
- Given RFC 6238's SHA-1 vectors, `totpAt` gives their last 6 digits; given codes for steps −2 to +2, exactly −1, 0 and +1 are accepted (criterion 26, CA-12). → Test: `TOTP › gives the last 6 digits of RFC 6238's SHA-1 test vectors`; `TOTP › accepts the codes of steps −1, 0 and +1 around now and refuses −2 and +2`
- Given a fingerprint stored under K, when an operation is given K′ or no key, every encrypt and decrypt is refused `deployment_key_mismatch`, `keyStatus` says so, and one log line without key material is written (criterion 23, CA-52). → Test: `deployment-key guard › refuses every encrypt and decrypt given another key once a fingerprint is stored, and logs one line without key material`; `deployment-key guard › refuses every encrypt and decrypt given no key once a fingerprint is stored, and logs one line`
- Given no key and no fingerprint, encrypt is refused `deployment_key_missing` and nothing is stored. → Test: `deployment-key guard › refuses to encrypt with no key and nothing stored, and stores nothing`
- Given `deploymentKeyState`, it answers each row of the "Key state read" matrix row and changes nothing. → Test: `deployment-key state read › answers each key state, never the fingerprint, and changes nothing`

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The window accepts step +2 → Test: `TOTP › accepts the codes of steps −1, 0 and +1 around now and refuses −2 and +2` (failed with the `candidateSteps` loop bound raised by one; reverted)
- `encrypt` stores a second fingerprint instead of refusing → Test: `deployment-key guard › refuses the second of two first encryptions under different keys` (failed with `commit` updating the row instead of refusing; reverted)

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Review Triage Log

Review of 2026-11-22: three layers (blind hunter B, edge-case hunter E, verification gap V) over the diff from `eb8d940`. No intent_gap or bad_spec entries, so no loopback.

| # | Layer | Finding | Verdict | Evidence | Outcome |
|---|---|---|---|---|---|
| 1 | B1, E2 | `deploymentKeyField` refuses `null` with `invalid_input` | medium | Frozen rule: `null` counts as no key; `z.string().optional()` refuses `null` before the guard | patch: field accepts `string \| null` |
| 2 | B2, E1, E13 | A key over 64 characters is refused `invalid_input`, not counted as no key | medium | Same frozen rule ("anything that does not parse"); the 64 bound came from spec 2's text, not this spec | patch: no length bound on the operation's key field; test of 44–64 and 65+ characters |
| 3 | B3 | Surrounding whitespace in a key is not trimmed | false | The frozen rule is exactly 43 base64url characters; a padded key is malformed by design, and the log line says `malformed` | rejected |
| 4 | B4 | A malformed key with nothing stored writes no log line | false | `wording.md` logs only when a fingerprint is stored; the spec's matrix row says the same | rejected |
| 5 | B5 | `missing` shows the mismatch message | false | The frozen rule refuses `deployment_key_mismatch` for `missing` (D-15); only the log tells them apart, as ruled | rejected |
| 6 | B6 | Refusal messages name two-step verification though the guard is generic | false | `wording.md` fixes the text (D-21); settings secrets are story 1.15's | rejected |
| 7 | B7 | One log line per start hides a second fault | false | The frozen rule is one line per object start | rejected |
| 8 | B8 | `stored_at` uses `Date.now()` rather than an injected time | low | Real, but nothing reads `stored_at`; the fix adds a parameter | rejected (low, adds surface) |
| 9 | B9 | Recovery entry does not map Crockford's o→0, i/l→1 | false | The frozen matrix says an `o` or `l` is invalid | rejected |
| 10 | B10, V2 | Constants test omits the recovery-code bound and alphabet; the `.max()` bounds are untested | low (V2 pre-verified) | Removing either `.max()` passes every test | patch: tests added |
| 11 | B11 | Unknown `method` refusal does not assert the field | low | Assertion is a one-line addition | patch |
| 12 | B12 | No deploy, `.dev.vars` or README setup for `DEPLOYMENT_KEY` | low | Deploy command is spec 6, self-hosted spec 5, browser servers spec 7; local `wrangler dev` without a key is not covered by any spec | deferred (local dev key) |
| 13 | B13 | No test passes the key through the Worker | false | Routes and the Worker's passing are spec 4, excluded by this spec's Never | rejected |
| 14 | B14, E11 | The derived-key cache holds one slot and thrashes on alternating keys | low | Performance only; the comment's "keyed by its fingerprint" holds | rejected (low) |
| 15 | V1 | No test commits a second value under the stored key | low (pre-verified) | A commit refusing whenever any fingerprint is stored would pass every test | patch: test added |
| 16 | V3 | The ten refusals' statuses and messages are not pinned | low (pre-verified) | `api.test.ts` checks only status ≥ 400 and a message | patch: test added |
| 17 | V4 | The interleaved test does not assert the log line of the refused commit | low (pre-verified) | Removing `logOnce` in `commit` passes | patch: assertion added |
| 18 | V5 | "Latest matching step" of `matchingStep` never exercised | low (pre-verified) | The window test rules out collisions by construction; the caller arrives in spec 2/3 | deferred (V's disposition) |
| 19 | E3 | The public key-state read spends the one log line | false | CAP-10 counts the state read among what reports the mismatch; the frozen rule logs the first time the status is met, by any operation | rejected |
| 20 | E4 | `commit()` may be called outside `transactionSync` | false | Documented caller contract; no caller exists yet, and spec 2 defines the synchronous steps | rejected |
| 21 | E5 | `now` NaN gives NaN steps | false | Every caller passes `Date.now()`; not reachable | rejected |
| 22 | E6 | Negative steps wrap the counter | false | Only before 1970-01-01 00:00:30; not reachable | rejected |
| 23 | E7 | `base32Decode` accepts U+0131 and U+017F, which upper-case to I and S | low | Verified: `"ı".toUpperCase()` is `"I"`; breaks the stated one-spelling rule; a direct guard | patch |
| 24 | E8 | A lone surrogate in a name makes `encodeURIComponent` throw | low | Unlikely (names are typed text); the start operation that builds the URI is spec 2 | rejected (low, unlikely) |
| 25 | E9 | An empty installation name gives an empty issuer | false | `installationNameField` (`shared/setup.ts:64`) requires a trimmed non-empty name | rejected |
| 26 | E10 | `formatRecoveryCode` formats a code of any length | low | Callers pass generated 16-character codes only | rejected (low) |
| 27 | E12 | The spec's arrows record no test titles | medium | True at review time | patch: titles recorded in this file |
