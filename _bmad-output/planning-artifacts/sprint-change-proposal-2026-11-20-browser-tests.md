# Sprint change proposal: automated browser tests with Playwright

- **Date:** 2026-11-20
- **Workflow:** `bmad-correct-course`, batch mode
- **Requested by:** Kevin
- **Status:** approved by Kevin on 2026-11-20 and applied the same day: epics (standing rule 15, definition of done, stories 1.1, 1.2, 3.4 and 10.6) and architecture 3.2 (K24). Scope: minor. Next: story 1.2 through `bmad-build`.

## 1. Issue summary

The plans have no automated browser tests.

- The definition of done asks for each story's criteria to "pass in Chrome against the locally run server". Nothing records that check, so it happens by hand once and is never repeated.
- The architecture plans server tests in Cloudflare's runtime (K6) and a self-hosted smoke suite. It says nothing about the screens.
- Story 1.1 asked for "the existing unit and browser tests" to keep passing, but the prototype has no browser tests, only Node unit tests.

This was found after story 1.1 merged, while Kevin was checking what testing was planned. It has not mattered yet, because story 1.1 adds no screens. From story 1.2 on, nearly every story adds pages: set-up, sign-in, invitations, two-step verification, My account, Administration. Without an automated browser layer, a later story can break an earlier screen with nothing to catch it.

**Type:** a gap in the original plan, not a new product requirement.

## 2. Impact analysis

**Epics:**
- **Epic 1** can still be completed as planned.
  - Story 1.2, the first story with a screen, takes on setting up Playwright (Kevin's choice).
  - Story 1.1 is done and changes only in wording: it named browser tests that did not exist.
- **Epics 2 to 11** need no change of scope. A new standing rule makes every story that adds or changes a screen add browser tests.
  - Story 3.4 (accessibility) and story 10.6 (real devices) gain a note on how they relate to the automated checks.
  - No epic is added, removed or reordered.
- **Sprint tracking:** no stories are added or removed, so `sprint-status.yaml` does not change.

**Artifacts:**
- **PRD:** no change. Testing is an engineering practice; NFR-3 and the supported browsers stay as they are.
- **Architecture:** testing rules in section 5, the code layout and test tooling in section 10, the release workflow in section 9, one row in section 11, a new decision K24, and a version note.
- **UX:** no change. The axe check enforces rules UX section 10 already states.

**Technical impact:**
- New pinned development dependencies: `@playwright/test` and `@axe-core/playwright`.
- A new `site-studio/browser-tests/` folder.
- CI installs Chromium and WebKit, which adds a few minutes to each run.

## 3. Recommended approach

**Direct adjustment.** Add the practice to the existing plan, with no rollback and no change to the PRD's scope.

| Option | Viable? | Notes |
|---|---|---|
| Direct adjustment | Yes | Effort low, about one extra day inside story 1.2. Risk low. |
| Rollback | No | Story 1.1 has no screens to test, so reverting it gains nothing. |
| PRD scope review | No | Scope is unaffected. |

**Kevin's choices (2026-11-20):**
- Batch mode.
- The Playwright set-up goes inside story 1.2, not a new story, so nothing is renumbered.
- Every push and pull request runs the tests in desktop Chromium (covering Chrome and Edge) and in WebKit with an iPhone viewport (closest to Safari on iOS). Real devices stay in story 10.6.
- An axe accessibility check runs on every new screen.

**How the tests run:**
- Against the built app served locally by Cloudflare's runtime: `vite preview` with Cloudflare's plugin, the same bundle that is deployed. Not against the development server.
- Each run starts from empty local storage.
- In CI, one retry is allowed, and a trace is kept on failure.

**Risks:**
- WebKit on a Windows workstation behaves slightly differently from WebKit on CI's Linux. CI is the reference.
- Browser tests are slower and flakier than server tests. They should cover each story's main flows and on-screen refusals, while rules stay in the server tests.

## 4. Detailed change proposals

### 4.1 Epics (parts in `draft-0.7-working/`, then reassemble)

**Definition of done** (`front.md`)

OLD:
> A story is done when its criteria pass in Chrome against the locally run server, its automated tests pass, the self-hosted smoke suite passes once it exists, and the existing tests still pass.

NEW:
> A story is done when its criteria pass in Chrome against the locally run server, its automated tests pass, its browser tests pass in desktop Chromium and in WebKit with an iPhone viewport (standing rule 15), the self-hosted smoke suite passes once it exists, and the existing tests still pass.

Rationale: makes the screen checks repeatable rather than manual.

**New standing rule 15** (`front.md`, after rule 14)

NEW:
> 15. From story 1.2 on, a story that adds or changes a screen adds browser tests with Playwright, in `site-studio/browser-tests/`. They cover its Core behaviour flows on that screen and at least one refusal or error that the screen shows. They run against the built app served locally by Cloudflare's runtime, in desktop Chromium and in WebKit with an iPhone viewport, on every push and pull request. Each screen a story adds also passes an axe accessibility check with no serious or critical violations. Rules and edge cases stay in the server tests. A criterion that names a real device, another browser or a deployed installation is still checked there (story 10.6).

Rationale: applies the practice to every later story without repeating it in each.

**Story 1.1** (published 1.1), Core behaviour (the story is done; this only corrects the wording)

OLD:
> The existing unit and browser tests pass against that locally served app with no test changed or removed.

NEW:
> The existing unit tests pass against that locally served app with no test changed or removed. (The prototype had no browser tests; they start with story 1.2.)

Rationale: the criterion named tests that did not exist.

**Story 1.2** (published 1.2), Evidence to record (new group) and Notes

NEW, under a new **Evidence to record** group:
> - Playwright is set up in `site-studio/browser-tests/` with pinned versions. It runs against the built app served locally by Cloudflare's runtime, in desktop Chromium and in WebKit with an iPhone viewport, and each run starts from empty local storage.
> - A browser test completes set-up with a set-up code supplied to the local installation and finds the confirmation of the installation's name and the administrator's email; another shows a wrong code refused with the wait stated.
> - The set-up page passes an axe accessibility check with no serious or critical violations.
> - Continuous integration installs the browsers and runs the browser tests on every push and pull request, keeping a trace when a test fails.

NEW, added to Notes:
> For tests, the local installation's set-up code is supplied as a local secret that is never committed.

Rationale: Kevin's placement choice. Story 1.2 is the first story with a screen.

**Story 3.4** (published 3.4), Notes

NEW, added to Notes:
> The axe checks of standing rule 15 cover each new screen from story 1.2 on. This story makes the full pass, including the prototype's existing screens.

**Story 10.6** (published 10.6), Notes

NEW, added to Notes:
> The browser tests of standing rule 15 run in desktop Chromium and in WebKit with an iPhone viewport on every change. This story is the evidence on real devices and browsers, which emulation does not replace.

**Status and revision history** (`front.md`, `back.md`): one line each recording this change and its approval.

### 4.2 Architecture (`architecture.md`)

**Section 5, rules** (after the test suite line)

NEW:
> - Browser tests use Playwright against the built bundle served locally by Cloudflare's runtime, in desktop Chromium and in WebKit with an iPhone viewport, on every push and pull request, each run from empty local storage. Each new screen passes an axe accessibility check (K24).

**Section 9, release workflow**

OLD:
> A version tag starts a workflow that runs the test suite, builds the one Worker bundle, …

NEW:
> A version tag starts a workflow that runs the test suite, builds the one Worker bundle, runs the browser tests against that bundle, builds the Docker image from the same bundle, …

(Corrected after CodeRabbit's review of pull request 7: the browser tests need the built bundle, so they run after it is built, and the same bundle is published.)

**Section 10, layout**

NEW line after `server-tests/`:
> `  browser-tests/     Playwright browser tests and their configuration`

**Section 10, language and tests (K6)**

NEW sentence appended:
> Browser tests use Playwright with `@axe-core/playwright`, both pinned (K24).

**Section 11, table**

NEW row:
> | New screens are readable and operable | An axe check on every new screen in the browser tests (K24). | The full pass of story 3.4; real devices in story 10.6. |

**Section 13, decisions**

NEW row:
> | K24 | **Automated browser tests.** Playwright against the built bundle served locally by Cloudflare's runtime, in desktop Chromium and in WebKit with an iPhone viewport, on every push and pull request, with an axe check on each new screen. Set up in story 1.2; required of every later story that adds or changes a screen. Approved by Kevin through the [sprint change proposal of 2026-11-20](../../sprint-change-proposal-2026-11-20-browser-tests.md). |

**Version note:** "Version 3.2 (2026-11-20) adds automated browser tests (K24)."

### 4.3 PRD and UX

No change.

## 5. Implementation handoff

**Scope:** minor, a direct adjustment.

| Who | Does what |
|---|---|
| Claude, on Kevin's approval | Applies sections 4.1 and 4.2 to the planning documents on `planning/epic-1-review`, reassembles `epics.md` and records the change. |
| Developer, through `bmad-build` on story 1.2 | Sets up Playwright and axe, writes the set-up flow tests, adds the browser tests to CI. |
| Every later story | Follows standing rule 15. |

**Success criteria:**
- Story 1.2's pull request shows the browser tests passing in CI in both browser projects.
- A deliberately broken set-up page makes them fail.
- An axe violation on a new screen fails the run.
