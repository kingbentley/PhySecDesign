---
title: 'Story 1.2, spec 3: Playwright and the set-up page'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '08ec674ed5185e9a6b7d38d89e6e56dd9ba7c8ac'
review_loop_iteration: 0
story_key: '1-2-set-up-a-new-installation'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/brownfield.md'
  - '{project-root}/site-studio/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Specs 1 and 2 made set-up work through `/api/v1/setup/state` and `/api/v1/setup`, but no page uses them, and no browser test exists (K24, standing rule 15).

**Approach:** Add the S-25 set-up page in `src/admin/` at `/setup`, shown whenever set-up is open, with its already-complete state (D-5), and set up Playwright (desktop Chromium, WebKit with an iPhone profile, axe) against the built Worker served by `wrangler dev`, with its CI job. Covers CAP-3, CAP-12 and the screen side of CAP-4 and CAP-7; D-1 to D-6 are frozen.

## Boundaries & Constraints

**Always:**
- The page is JavaScript (React) and loads lazily; field hints use the rules in `shared/setup.ts` themselves. It sends `x-site-survey-design: 1`. Messages never repeat an entered value.
- Labelled 16 px fields, errors tied to fields (`aria-invalid`, `aria-describedby`), a visible 2 px focus ring, 4.5:1 text, single column and no sideways scroll at iPhone width; `BrandMark` and "Site Survey Design"; teal `#007e73`.
- `@playwright/test` exactly `1.63.0`, `@axe-core/playwright` exactly `4.14.0`. Each project gets its own server, empty state folder and random code, written to a gitignored, mode-600 `.dev.vars`. No route that resets state.

**Never:** Deploying or Cloudflare (spec 4); sign-in (story 1.3); `playwright install` or a WebKit install here; touching `experiments/`, the four Sites files, pre-story-1.2 tests or `sprint-status.yaml`; committing a code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open | state `open`, any address | address becomes `/setup`; form with code, installation name, name, email, password, password again; the disappear statement | N/A |
| Closed at `/setup` | state `closed` | "Set-up is already complete", no form, link to the app | N/A |
| Closed elsewhere | state `closed` | the prototype as today | N/A |
| State unknown | route fails (e.g. Sites package) | prototype; at `/setup` a message with Try again | N/A |
| Client hint | a field breaks a D-4 rule, or passwords differ | not sent; message under the field; first bad field focused | N/A |
| Success | valid input, right code | "Set-up is complete" with installation name and email from the reply | N/A |
| Wrong code | `setup_code_wrong` | message, code field focused | N/A |
| Wait | `setup_wait` | wait in minutes and seconds, and that deploying again issues a fresh code | N/A |
| Field refusal | `invalid_input` with `field` | that field's message, field focused | unknown field → general message |
| Closed on send | `setup_closed` | switches to already complete | N/A |
| Other | not configured, origin, network, other | a fixed general message for each | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/main.jsx` -- `Workspace`; add the state check and the lazy set-up page.
- `site-studio/src/styles.css` -- `body{min-width:860px}`: the set-up page must lift it at phone width.
- `site-studio/src/BrandMark.jsx` -- the logo.
- `site-studio/shared/setup.ts` -- `installationNameField`, `personNameField`, `emailField`, `passwordField`, `passwordEqualsEmail`, maxima.
- `site-studio/shared/routes.ts` -- `APP_HEADER`, `APP_HEADER_VALUE`; `shared/refusal.ts` codes.
- `dist/worker/wrangler.json` -- written by `npm run build`; `wrangler dev -c` it with `--persist-to`, `--env-file`, `--port`, `--ip 127.0.0.1`. Local runtime passes a client's `CF-Connecting-IP` through, so the wait test uses its own address bucket.
- Canvas `project/Setup.dc.html` (read 2026-11-20): one card on `#F6F8F6`; code, installation name, then a "First administrator" fieldset (name, email, password, password again, two columns), helper texts, button "Create administrator and finish".

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/src/admin/setupState.js` (state fetch, kept out of the set-up chunk), `setupClient.js` -- set-up post with the header, refusal-to-message mapping, wait wording, client field checks.
- [x] `site-studio/src/admin/SetupPage.jsx`, `setup.css` -- S-25 form, success and already-complete states.
- [x] `site-studio/src/main.jsx` -- state check before choosing the page.
- [x] `site-studio/browser-tests/playwright.config.mjs`, `serve.mjs`, `setup.spec.mjs` -- projects, servers, tests, axe helper.
- [x] `site-studio/package.json`, `package-lock.json` -- pinned dev dependencies (plus `playwright-core` 1.63.0, so axe's open peer range does not pull a second copy); `test:browser` (build, then Playwright).
- [x] `.gitignore` -- `.dev.vars`, `browser-tests/.local/`, Playwright output.
- [x] `site-studio/README.md` -- local set-up code for `npm run dev`, `browser-tests/`, `test:browser` (added in review).
- [x] `.github/workflows/test.yml` -- new `browser` job: `npm ci`, `npx playwright install --with-deps chromium webkit`, `npm run test:browser`, upload traces on failure. Existing job unchanged.

**Acceptance Criteria:**
- Given each state (form, field error, wrong code, wait, success, already complete), when axe runs, then no serious or critical violation.
- Given a temporarily broken page or an injected axe violation, when the suite runs, then it fails (evidence recorded below, change reverted).
- Given the Chromium project locally, when `npm run test:browser -- --project=chromium` runs, then every test passes; WebKit runs in CI.

## Implementation Notes

- Implemented and reviewed inline: this runtime has no subagent tool, so no implementation subagent or independent reviewer subagents were launched. Sprint status sync skipped on the orchestrator's instruction (`sprint-status.yaml` is managed outside this run). The epic-1 context file is older than some planning files; it was used as adopted by SPEC.md (as specs 1 and 2 did), not recompiled.
- Design canvas opened (`project/Setup.dc.html`). Followed: card layout, field order and labels, "First administrator" fieldset with two columns, "Password again", button wording, `#007E73`, DM Sans. Changed: brand line uses `BrandMark` and "Site Survey Design" (AGENTS.md); statement wording follows the story ("disappears once an administrator exists"); the code hint names the Cloudflare deployment only (self-hosted printing is story 2.21).
- Files: `src/admin/setupState.js`, `setupClient.js`, `SetupPage.jsx`, `setup.css`; `src/main.jsx`; `browser-tests/playwright.config.mjs`, `serve.mjs`, `setup.spec.mjs`; `package.json`, `package-lock.json`; root `.gitignore`; `.github/workflows/test.yml` (new `browser` job only); `README.md`. No route changed.
- The set-up page is a lazy chunk (`SetupPage-*.js`, about 98 kB with zod); the main bundle only gains the state check.
- `serve.mjs` runs `wrangler dev` on `dist/worker/wrangler.json` with `--env-file` pointing at a mode-600 `.dev.vars` in `browser-tests/.local/<project>/`. Checked: when a developer's `deploy/cloudflare/.dev.vars` is copied into `dist/worker/` by the build, `--env-file` still wins (suite passed with a different developer code present).
- Both projects' servers start on every run (ports 8791, 8792); `--project=chromium` runs only the Chromium tests.
- The lock file was written with npm 12.2.3: npm 10.9.9 and 11.6.2 also deleted the existing `libc` fields of 36 entries; npm 12 added only the new packages. `npm ci` with npm 10.9.9 (CI's) then installed from it and every command passed.
- Broken-page evidence (each reverted, sources diffed against saved copies):
  1. Labels replaced by plain text in `SetupPage.jsx`: test "shows the set-up page..." failed (`expect(locator).toBeVisible()` on `getByLabel`).
  2. Hint colour set to `#c0c8c4` in `setup.css`: the same test failed on axe: `color-contrast: #setup-code-hint, #setup-installationName-hint, #setup-password-hint, fieldset > .setup-hint`.
  3. Confirmation showing the installation name in place of the email: "completes set-up..." failed (expected `avery.admin@westbrook.example`, received `Westbrook Security`).
- WebKit (`webkit-iphone`, iPhone 15 profile) not run locally: no WebKit browser here; it runs in CI (deferred-work entry to check the first run).

## Spec Change Log

## Review Triage Log

Reviewers run inline by the implementing agent (no subagent tool), so not independent.

| # | Layer | Finding | Verdict | Route / evidence |
|---|---|---|---|---|
| 1 | blind | A code over 256 characters passed the page's check, and the server's `invalid_input` on `code` then read "Enter the set-up code." | low | patch: the page now uses `setupCodeField` from `shared/setup.ts`; message "Enter the set-up code exactly as it was shown." |
| 2 | blind | `npm run dev` now opens set-up on a fresh local state, with no code configured, so developers cannot reach the prototype and the README did not say how | medium | patch: README explains `SETUP_CODE` in git-ignored `deploy/cloudflare/.dev.vars` and resetting `.wrangler/state`; the behaviour itself is the story's ("no users shows the set-up page") |
| 3 | blind | `@axe-core/playwright`'s peer range pulled `playwright-core` 1.65.1 beside 1.63.0 | medium | patch: `playwright-core` pinned exactly to 1.63.0; `npm ls` shows one copy |
| 4 | blind | `npm install` (npm 10) deleted `libc` fields from 36 existing lock entries | low | patch: lock regenerated with npm 12.2.3 (additions only), then `npm ci` with npm 10 |
| 5 | blind | Double submit before `sending` is set could send twice | false | React flushes state from a discrete event before the next one; the second click sees `sending` true |
| 6 | blind | `history.replaceState` to `/setup` drops a review-link hash | low | rejected: only while no administrator exists, when review links do not apply; fix would add branches |
| 7 | blind | CI trace artifacts may contain the per-run set-up code typed into the form | low | rejected: the code belongs to a throwaway local installation that ends with the job; nothing is committed |
| 8 | edge | A developer `.dev.vars` copied to `dist/worker/` could override the test code | false | tried: with a different code in `deploy/cloudflare/.dev.vars` the suite still passed; `--env-file` wins |
| 9 | edge | `waitWording` with neither `retryAfterSeconds` nor `Retry-After` shows "1 second" | low | rejected: the server always sends both on `setup_wait` (spec 2 matrix) |
| 10 | edge | Fixed ports 8791/8792 can collide with a running server | low | rejected: Playwright fails at start-up with a clear port error; `reuseExistingServer` is false |
| 11 | edge | The wait test relies on the local runtime passing `CF-Connecting-IP` through | low | rejected: if a Wrangler upgrade stops this, the test fails loudly rather than passing wrongly |
| 12 | edge | The alert region is `display:none` when empty, which some screen readers may not announce on change | low | rejected: focus moves to the alert when it is filled, so it is read; axe passes |
| 13 | verification-gap | Client hints for installation name, name, email and password-equals-email had no browser test | medium | patch: "a field that breaks a rule..." now submits an empty form (code focused, four messages), a bad email (focused) and the email as password |
| 14 | verification-gap | Matrix row "Field refusal, unknown field → general message" had no test | low | patch: added to "other refusals each show their own message" |
| 15 | verification-gap | The CI `browser` job and the WebKit project have not run | medium (unverified) | defer: `deferred-work.md`; no WebKit or push here |

## Design Notes

Page address `/setup` (SPEC leaves it to implementation). With set-up open the page is shown at any address and the address is replaced with `/setup`, so "an installation with no users shows the set-up page when opened" holds. Retries are off: the tests share one installation per project, so a retried test would meet a changed state; traces are kept on failure instead. The canvas's "two-step verification next" line and version footer are left out: story 1.2 has neither.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server && npm run build && npm run test:sites && npm run smoke:selfhost` -- exit 0
- `npm run test:browser -- --project=chromium` -- all pass

**Result (2026-11-20):** `npm test` 146 pass; `npm run typecheck` 0; `npm run test:server` 13 files, 113 tests; `npm run build` 0; `npm run test:sites` 4 pass; `npm run smoke:selfhost` passed; `npm run test:browser -- --project=chromium` 10 passed. No lint script exists.
