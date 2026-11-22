---
title: 'Story 1.5, spec 7: My account, set-up and the offer'
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
  - '{project-root}/_bmad-output/planning-artifacts/ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md'
---

> Builds to D-1, D-7, D-8, D-10, D-11, D-12 and D-21 in `decisions.md` ("Claude, accepted on Kevin's instruction, 2026-11-22"). Needs specs 1 to 5. Amended after the spec review (`review-spec.md`); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The routes let a signed-in person turn two-step verification on and off and renew codes, but no screen offers them, and accepting an invitation goes straight into the app.

**Approach:** Add "My account" to the account menu, opening a dialog with only the "Two-step verification" section (D-1); build the set-up flow (password, QR code and text key, confirm, recovery codes with Copy and Download) once and use it there and in the offer the invitation page shows after a successful accept (D-11); add fresh codes and turning off; test them in Playwright and axe. Covers CAP-1, CAP-2 (page side), CAP-7 (page side), CAP-8 and CAP-14 for these screens.

## Boundaries & Constraints

**Always:**
- `src/AccountMenu.jsx` gains "My account" for every signed-in person, loading `src/account/MyAccount.jsx` on demand as "Invite a person" loads its panel; closing returns focus to the menu button.
- The dialog reads `GET /api/v1/account/two-step` when opened and after each change, and shows `wording.md`'s states: Off, On with "Recovery codes left: ‹n› of 10", `no_key`, `key_mismatch`, and a failed read with Try again. The On and Off chip has a label and a shape (standing rule 3).
- `src/account/TwoStepSetup.jsx` (shared by My account and the offer): step 1 password (`autocomplete="current-password"`); step 2 the QR code drawn as inline SVG by React from the start reply's `otpauthUri` with the D-8 encoder loaded only here (no `innerHTML`, no image URL, no network request), the key grouped in fours with Copy key, the entry-name line built from the start reply's `installationName` and `email` (finding 7), and the code field with CAP-13's attributes; confirm sends the start reply's `setupId` with the code (finding 5); step 3 the 10 codes as a list, Copy codes, Download codes (a `Blob` with `wording.md`'s file, its account line from the state read's `email`, revoked after use) and "I have saved my codes". The secret, the URI and the codes live only in component state and are dropped when the view closes; never in storage, the address bar or a log.
- Every form with a code field is `noValidate`, and code fields have `maxlength="12"` (finding 27).
- Fresh codes (password and code) and turning off (password) as `wording.md` gives; refusals shown in the dialog's alert, which takes focus; the wait composed with `waitWording`; `signin_busy`, network and `updating` with the sign-in page's wording (reused).
- `src/admin/InvitationPage.jsx`: after a successful accept the page reads `GET /api/v1/account/two-step`; only when `availability` is `available` does it show the offer, in place of `location.replace('/')`; otherwise, and when the read fails, it loads `/` (finding 14). "Skip for now" and "Continue to Site Survey Design" call `location.replace('/')` (story 1.4's D-2 holds: the page keeps no-referrer and the app loads afresh).
- Dialog semantics as the invite panel: `role="dialog"`, labelled by its heading, focus moved in and kept, Escape closes; 44 px targets, 16 px fields, visible focus (standing rule 5).
- Known limit, not built (finding 33, ruled): when fresh codes are made in two tabs, the tab whose set was replaced keeps showing dead codes until it is closed; My account does not re-read on focus to say so.
- Browser-test helpers live in a new `browser-tests/two-step-helpers.mjs` (not a spec file, which Playwright would register; finding 15): an RFC 6238 helper, "turn on through the API", "wait for the next step" and "sign in with a recovery code". Tests in `browser-tests/two-step.spec.mjs` run on `signInServers(project)[0]` (never the `baseURL` server, story 1.4's finding), each with an email no other spec uses; codes are computed from the key the page shows.
- The per-run test key (finding 17, ruled): `playwright.config.mjs` generates one per server as it does set-up codes, and `serve.mjs` writes it only into the gitignored `.dev.vars` under `browser-tests/.local/<server>/` that already holds the set-up code, and removes that file when the run ends. No real deployment key is ever written to a file.
- QR decode (finding 8, ruled option (a)): a dev-only QR decoder (for example `jsqr`), pinned to an exact version with its licence confirmed by the builder, decodes the drawn QR in the browser test (rasterised from the SVG) and the test asserts the text equals the start reply's `otpauthUri`, in both browser projects. If decoding the rendered SVG proves unworkable in both projects, the builder falls back to option (b) (a server test comparing the encoder's module matrix for a fixed URI with one recorded from an independent encoder) and reports it.
- Leak test (finding 16): over set-up and fresh codes, a test records every request (`page.on('request')`) and finds each same-origin `/api/v1/…` or the app's own assets; `localStorage` and `sessionStorage` hold neither the key nor any code; `location.href` is unchanged; no console message contains them.
- Visibility (finding 35): hiding and showing the page (emulated `visibilitychange`) at step 2 and step 3, in My account and in the offer, keeps the step and the codes.
- Deliberate breakages, each failing the suite, names recorded here when built: the codes still shown after reopening My account; the QR or key missing; the QR drawn from a different string (finding 8); Download writing no codes; the offer not shown after accepting; the secret written to `sessionStorage` (finding 16).
- `invitation.spec.mjs`'s tests that expect the app after accepting choose "Skip for now" first.

**Ask First:** any dependency beyond D-8's encoder and the one dev-only QR decoder (a ruled exception, finding 8); any change to the sign-in page (spec 8).

**Never:** server, route or store changes (specs 1 to 5); the second-step page (spec 8); a manual-only check (standing rule 15); a real key, code or password in a test file; `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open My account, off | signed in, two-step off | chip "Off", "Turn on two-step verification" | N/A |
| Turn on | right password; code from the shown key | QR and key shown; the QR decodes to the start reply's URI; then 10 codes with Copy and Download; then chip "On", "Recovery codes left: 10 of 10" | N/A |
| Wrong password | step 1 | stays on step 1 | `two_step_password_wrong` in the alert |
| Wrong code | step 2 | stays on step 2, field kept | `two_step_code_wrong` |
| Set-up replaced or expired | step 2 after another tab started again, or after 10 min (reply mocked) | back to the start | `two_step_setup_expired` |
| Codes once | close and reopen after step 3 | only the count | N/A |
| Download | Download codes | a file named as `wording.md` holding the 10 codes and the account's email | N/A |
| Copy | Copy codes, Copy key | field values checked in both browsers; clipboard in Chromium only | copy failure text |
| Count after use | one recovery code used at sign-in (helper) | "9 of 10" | N/A |
| Fresh codes | password and a code of a later step | new list; old code refused at sign-in (helper) | as refusals |
| Turn off | password | chip "Off"; sign-in needs only the password | `two_step_password_wrong` |
| No key / mismatch | read reply mocked `no_key`, `key_mismatch` | `wording.md`'s text; mismatch keeps Turn off | N/A |
| Offer | accept an invitation, availability `available` | "Protect your account" with both buttons | N/A |
| Offer, no key | accept with availability `no_key` (reply mocked), or the read failing | the app at `/`, no offer (finding 14) | N/A |
| Skip | "Skip for now" | the app at `/` with the account menu | N/A |
| Set up from the offer | password, code | codes; "Continue to Site Survey Design" opens the app; My account shows On | N/A |
| Leak | set-up and fresh codes | only same-origin requests; nothing in storage, address or console | N/A |
| Visibility | hide and show at steps 2 and 3 | step and codes kept | N/A |
| axe | My account off, set-up steps 1–3, on; the offer | no serious or critical violation | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/AccountMenu.jsx`, `src/admin/InvitePanel.jsx` -- menu item, on-demand loading, dialog and Copy patterns.
- `site-studio/src/admin/InvitationPage.jsx` (line 147), `invitationClient.js`, `postJson.js`, `waitWording.js`, `signInClient.js` (`SIGN_IN_MESSAGES`) -- the accept flow and reused wording.
- `site-studio/src/main.jsx` (lines 126–153) -- the visibility re-read.
- `site-studio/src/BrandMark.jsx`, `src/admin/invitation.css`, `signin.css` -- visual direction.
- `site-studio/browser-tests/invitation.spec.mjs`, `signin.spec.mjs`, `serve.mjs`, `playwright.config.mjs` -- helpers, servers, `.dev.vars`.

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/package.json`, `package-lock.json` -- the D-8 encoder and the dev-only QR decoder, exact versions.
- [ ] `site-studio/src/account/MyAccount.jsx`, `TwoStepSetup.jsx`, `twoStepClient.js`, `account.css` -- the dialog, the flow and its requests.
- [ ] `site-studio/src/AccountMenu.jsx`, `src/admin/InvitationPage.jsx` -- the menu item and the offer.
- [ ] `site-studio/browser-tests/two-step-helpers.mjs`, `two-step.spec.mjs`, `serve.mjs`, `playwright.config.mjs`, `invitation.spec.mjs` -- helpers, tests, the per-run key, skip after accepting.
- [ ] `site-studio/server-tests/two-step-page-text.test.ts` -- the page's rules that use `shared/twoStep.ts` (code normalising, the download text), as `invitation-page-text.test.ts` does.

**Acceptance Criteria** (the builder records each proving test's title after the arrow; finding 34):
- Given a signed-in person, turning on with the password, the QR code (decoding to the start reply's URI) and the key shown, and a computed code turns two-step verification on (criterion 1). → Test: …
- Given step 3, the 10 codes are shown with Copy and Download, the downloaded file holds them, and after closing, My account shows only the count (criteria 2, 7). → Test: …
- Given an accepted invitation with two-step available, the offer is shown; "Skip for now" opens the app; setting up from the offer turns it on (criterion 9). → Test: …
- Given axe on each state listed, no serious or critical violation (standing rule 15). → Test: …

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
- `npm run test:browser` -- pass (about 10 minutes; run from a short checkout path)
