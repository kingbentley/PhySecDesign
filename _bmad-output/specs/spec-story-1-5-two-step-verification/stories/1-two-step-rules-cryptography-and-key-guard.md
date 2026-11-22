---
title: 'Story 1.5, spec 1: Two-step rules, cryptography and the deployment-key guard'
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
- [ ] `site-studio/shared/twoStep.ts` -- constants, normalisers, base32, `otpauthUri`, inputs (standing rule 6).
- [ ] `site-studio/shared/refusal.ts` -- the new refusals.
- [ ] `site-studio/server/auth/totp.ts`, `server/auth/deploymentKey.ts` -- TOTP, HKDF, AES-GCM, fingerprint.
- [ ] `site-studio/server/installation/keyGuard.ts`, `Installation.ts`, `server/env.ts` -- the `deployment_key` table, the guard, the log line, `deploymentKeyState`.
- [ ] `site-studio/server-tests/vitest.config.mjs` -- a `DEPLOYMENT_KEY` binding generated with `node:crypto` when the configuration loads, never written to a file (for spec 4's route tests; store tests pass keys of their own).
- [ ] `site-studio/server-tests/two-step-rules.test.ts`, `deployment-key.test.ts` -- matrix rows; the pinned operations list in `setup-store.test.ts` gains `deploymentKeyState`.

**Acceptance Criteria** (the builder records each proving test's title, `describe › it`, after the arrow; finding 34):
- Given RFC 6238's SHA-1 vectors, `totpAt` gives their last 6 digits; given codes for steps −2 to +2, exactly −1, 0 and +1 are accepted (criterion 26, CA-12). → Test: …
- Given a fingerprint stored under K, when an operation is given K′ or no key, every encrypt and decrypt is refused `deployment_key_mismatch`, `keyStatus` says so, and one log line without key material is written (criterion 23, CA-52). → Test: …
- Given no key and no fingerprint, encrypt is refused `deployment_key_missing` and nothing is stored. → Test: …
- Given `deploymentKeyState`, it answers each row of the "Key state read" matrix row and changes nothing. → Test: …

**Deliberate breakages** (each must fail the suite; record the failing test's title):
- The window accepts step +2 → Test: …
- `encrypt` stores a second fingerprint instead of refusing → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
