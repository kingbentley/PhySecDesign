---
title: 'Story 1.5, spec 8: The second-step page'
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
---

> Builds to D-3, D-13, D-20 (as amended by finding 20) and D-21 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs specs 1 to 5, and spec 7's `browser-tests/two-step-helpers.mjs` and per-run key. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The sign-in reply can say a second step is needed, but the sign-in page cannot ask for a code or a recovery code.

**Approach:** When the sign-in reply is `{ secondStep: true }`, the sign-in page shows the second step in place: a code field built for phones, "Use a recovery code", "Back to sign in", and the refusals of D-13, returning to the password form when the pending sign-in has ended. Covers the page side of CAP-3, CAP-4 and CAP-13, CAP-2's recovery-code sign-in, and CAP-14 for this screen.

## Boundaries & Constraints

**Always:**
- `src/admin/signInClient.js`: `signInOutcome` gains `{ kind: 'secondStep' }` for a success body that is exactly `{ secondStep: true }`; a new `submitSecondStep({ method, code })` maps `second_step_code_wrong`, `second_step_recovery_code_wrong`, `second_step_expired`, `signin_wait`, `deployment_key_mismatch` and the existing codes; existing kinds unchanged. `tests/signin-client.test.mjs` gains the cases.
- `src/admin/SignInPage.jsx`: on `secondStep` the password is cleared from state and the second step shows with `wording.md`'s text; the form is `noValidate` (finding 27); the code field: `type="text"`, `inputmode="numeric"`, `autocomplete="one-time-code"`, `pattern="[0-9]*"`, `maxlength="12"`, labelled, 16 px; the recovery field: `autocomplete="off"`, `autocapitalize="none"`, `spellcheck="false"`. Each mode's field is checked with `shared/twoStep.ts`'s normaliser before sending (standing rule 6).
- `second_step_expired` and `signin_wait` return to the password form with the message (the wait composed as story 1.3 does); "Back to sign in" returns without a request (D-3). A correct step calls `onSignedIn` as a sign-in does, so the session is read and the app opens.
- `deployment_key_mismatch` on a code: the page shows that message followed by "You can still sign in with a recovery code.", switches to recovery mode and moves focus to its field (finding 26).
- Focus moves to the second step's heading when it appears and to the alert on a refusal; the mode switch keeps focus on the new field.
- Known limit (finding 33): a browser holds one pending sign-in; after another tab's password step, this page's second step applies to that newer sign-in, which may be another account's, and a code for the first account is refused as wrong.
- Browser tests in `browser-tests/second-step.spec.mjs` on `signInServers(project)[0]`, importing `browser-tests/two-step-helpers.mjs` (never another spec file; finding 15), with accounts turned on through the API by a helper, each with its own email; a test that needs a second code in the same account waits for the next 30-second step (keep such waits to the few tests that need them).
- Criterion 27's real-phone part is deferred to story 10.6 under standing rule 15 (D-20 as amended); spec 9 offers Kevin an optional phone check.
- Deliberate breakages, each failing the suite, names recorded here when built: the code field without `one-time-code`; a reused recovery code accepted; the page staying on the second step after `second_step_expired`.

**Ask First:** a change to the first step's behaviour or wording (story 1.3).

**Never:** server, route or store changes; My account (spec 7); a manual-only check; `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Password, two-step on | right password | second step shown; no account menu; password field cleared | N/A |
| Code | current computed code with a space | app opens with the account menu | N/A |
| Wrong code | "000000" (not current) | stays; field kept for correction | `second_step_code_wrong` in the alert |
| Recovery code | "Use a recovery code", a saved code in upper case | app opens | N/A |
| Recovery code reused | the same code in a later sign-in | stays | `second_step_recovery_code_wrong` |
| Bad shape | "12345" or a 15-character recovery code | no request | field message |
| Expired | pending cookie removed in the test (other-browser case) | password form with the message | `second_step_expired` |
| Wrong codes to the wait | 4 wrong codes | after the third `second_step_code_wrong`, the fourth returns to the password form with the wait (finding 3) | `signin_wait` |
| Key mismatch | code reply mocked `deployment_key_mismatch` | the message and the recovery line; recovery mode, focus on its field (finding 26) | N/A |
| Back to sign in | button | password form, no request | N/A |
| Reload | reload on the second step | sign-in page (D-3) | N/A |
| Phone attributes | WebKit iPhone | `inputmode`, `autocomplete`, `pattern`, `maxlength` as stated; 16 px | N/A |
| Two-step off | an account without it | signs in as before, no second step | N/A |
| axe | code mode, recovery mode, a refusal shown | no serious or critical violation | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/admin/SignInPage.jsx`, `signInClient.js`, `postJson.js`, `waitWording.js`, `signin.css` -- the page and its client.
- `site-studio/shared/twoStep.ts` -- normalisers (spec 1).
- `site-studio/tests/signin-client.test.mjs` -- client cases (it may import only `shared/refusal.ts`; the normaliser's use on the page is tested in `server-tests/`).
- `site-studio/browser-tests/two-step-helpers.mjs` (spec 7), `signin.spec.mjs` -- helpers.

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/src/admin/signInClient.js`, `SignInPage.jsx`, `signin.css` -- the second step.
- [ ] `site-studio/tests/signin-client.test.mjs` -- new kinds and refusals.
- [ ] `site-studio/browser-tests/second-step.spec.mjs` -- matrix rows.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given "Use a recovery code" and a saved code, the person is signed in, and the same code is refused at a later sign-in (criterion 6). → Test: …
- Given WebKit with an iPhone profile, the code field has `inputmode="numeric"`, `autocomplete="one-time-code"` and `pattern="[0-9]*"` (criterion 27, its automated part; the real-phone part deferred to story 10.6, D-20). → Test: …
- Given axe in code mode, recovery mode and with a refusal shown, no serious or critical violation (standing rule 15). → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
- `npm run test:browser` -- pass (about 10 minutes; run from a short checkout path)
