---
id: SPEC-story-1-2-set-up-a-new-installation
companions:
  - acceptance-trace.md
  - brownfield.md
  - ../../planning-artifacts/epics/epics-PhySecDesign-2026-11-18/epics.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/cloudflare-limits.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/design-canvas.md
  - ../../implementation-artifacts/epic-1-context.md
  - ../../implementation-artifacts/spec-1-1-run-the-app-on-cloudflare-with-a-portable-server-core.md
  - ../../implementation-artifacts/deferred-work.md
  - ../../../site-studio/AGENTS.md
sources:
  - ../../planning-artifacts/sprint-change-proposal-2026-11-20-browser-tests.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Story 1.2: Set up a new installation

The acceptance contract is story 1.2 of epics draft 0.7 (`epics.md`, "### Story 1.2"), read with standing rules 1–15 and the definition of done. Where this spec summarises a criterion, the story's wording governs. `acceptance-trace.md` maps every criterion to a capability.

## Why

A mandate and a foundation. FR-66 requires that only the person who installed Site Survey Design can create its first administrator, and that the set-up step is gone once one exists. Story 1.1 left a deployed Worker with no accounts. Every later Epic 1 story (sign-in, invitations, roles) needs this first administrator, an installation name and a recorded public address. Story 1.2 is also the first story with a screen, so under K24 it sets up the Playwright browser tests that every later screen story relies on.

## Capabilities

- **CAP-1**
  - **intent:** The Cloudflare deploy command issues a set-up code only while set-up is open, so the installer alone holds it.
  - **success:** Deploying to an installation with no users prints a random code of at least 20 characters once, supplied as a Worker secret. Deploying again with no users prints a new code: the earlier one is refused and the wrong-code counts are reset. Deploying to an installation that has an administrator prints no code and does not reopen set-up. The command decides from CAP-2's route (CA-01, CA-02, CA-45, CA-52).
- **CAP-2**
  - **intent:** Anyone can learn whether set-up is open, and nothing else.
  - **success:** A public read-only route answers only "open" or "closed". A schema test shows the reply has no other field.
- **CAP-3**
  - **intent:** An installation with no users presents the set-up page (S-25), and only then.
  - **success:** Opening a no-user installation shows the page asking for the set-up code, the installation's name and the first administrator's name, email and password, with a statement that the page disappears once an administrator exists. Once any user exists, the set-up address shows "set-up is already complete", its request is refused and the code no longer works; the rest of the app shows the prototype as today (D-5).
- **CAP-4**
  - **intent:** Completing set-up makes the installer the one first administrator and names the installation.
  - **success:** Exactly one administrator exists afterwards. The installation's name and its public address are recorded, the address taken from where the set-up page was opened (CA-57). The page confirms the name and the administrator's email. Of two set-up requests sent at the same moment, one creates the administrator and the other is refused.
- **CAP-5**
  - **intent:** Set-up input meets the account and naming rules.
  - **success:** A password of 11 or 129 characters, or one equal to the email, is refused, with no other composition rule (CA-03). An installation name of 0 or 81 characters is refused (CA-04). An administrator name of 0 or 81 characters, an email failing a light format check or over 254 characters, and a password equal to the email in any letter case are refused; the email is stored lower-cased (D-4). A missing code is refused.
- **CAP-6**
  - **intent:** The password is never stored in recoverable form.
  - **success:** Storage holds only a salted scrypt hash (N = 131,072, r = 8, p = 1, 32-byte result) with its parameters beside it. A test reads the stored row and finds no password (K19, AD-12, NFR-5).
- **CAP-7**
  - **intent:** The set-up code cannot be guessed, and an attacker cannot lock the installer out for good.
  - **success:**
    - A wrong code is refused.
    - After 5 wrong codes from one address, that address waits 1 minute, doubling after each further failure up to 15 minutes. After 100 wrong codes within an hour from all addresses together, every attempt is refused until the hour has passed (CA-05). A per-address count clears 15 minutes after its last failure; attempts during a wait are refused and not counted; the cap is a rolling 60 minutes (D-3).
    - Counts are kept in the installation object's storage and raised before the code is checked. They hold across Worker copies, across a restart and under simultaneous requests (CA-43).
    - The page states the wait and that deploying again issues a fresh code (CA-45).
- **CAP-8**
  - **intent:** Another site cannot drive set-up from a visitor's browser.
  - **success:** A set-up request from another origin, or without the app's header, is refused (standing rule 13).
- **CAP-9**
  - **intent:** The deployed installation is reached only over HTTPS.
  - **success:** On a deployed Cloudflare test installation, a plain HTTP request is redirected to HTTPS (FR-66 check). The Worker redirects only when Cloudflare's request metadata marks the request as plain HTTP, so a self-hosted Worker behind its web server never redirects (D-1).
- **CAP-10**
  - **intent:** Installations deployed from one build are independent.
  - **success:** Two test installations are deployed from the same build. Completing set-up on one leaves the other still offering set-up with its own code.
- **CAP-11**
  - **intent:** Accounts and the installation's name are outside project revisions.
  - **success:** A revision restore leaves accounts and the installation's name unchanged. Both live only in the installation object, which no restore path writes (standing rule 9).
- **CAP-12**
  - **intent:** Screens get repeatable browser tests from this story on (K24).
  - **success:**
    - `site-studio/browser-tests/` holds Playwright and `@axe-core/playwright`, both pinned. They run against the built app served locally by Cloudflare's runtime, in desktop Chromium and in WebKit with an iPhone viewport, each run from empty local storage.
    - One test completes set-up and finds the installation's name and the administrator's email confirmed. Another shows a wrong code refused with the wait stated.
    - axe finds no serious or critical violation on the set-up page.
    - CI installs the browsers and runs the tests on every push and pull request, keeping a trace when a test fails.
    - A deliberately broken set-up page makes the tests fail.

## Constraints

- One server build for both hosts. Host-specific code goes only in `server/files/` and `server/update/`, and there are no D1, Workflows, Queues, scheduled-trigger or KV bindings (AD-16, standing rule 7).
- Every new route is under `/api/v1/` and declared in `shared/routes.ts` with input and reply schemas. A refusal carries a reason code, may name a field, and never repeats an entered value (AD-22, story 1.1).
- Rate and failure counts live in the installation object's SQLite storage and are raised before the check. A count in a Worker's own memory is only an extra guard (CA-43).
- The set-up code, the password and its hash never appear in logs, records, replies or refusals (NFR-5, AD-17). The code is compared in constant time.
- The set-up code used by local runs and CI is a local secret and is never committed.
- The existing app stays JavaScript, with the set-up screen in `src/admin/`. `shared/` and `server/` stay TypeScript. Dependency versions are exact, and existing tests are unchanged (K6, story 1.1).
- The new screen meets UX section 10: 4.5:1 text contrast, a visible 2 px focus ring, labelled 16 px fields, and usability at 200% zoom. It follows the white and teal direction and the `BrandMark` logo (standing rule 5, `site-studio/AGENTS.md`).
- Browser tests cover the flows and on-screen refusals. Rules and edge cases stay in server tests that run in Cloudflare's runtime (standing rule 15).
- Criteria that name a deployed Cloudflare test installation are checked there (definition of done).
- `callObject` retries only on the version-stop reason, once a deployed installation shows that reason reaches the caller; if it cannot be told apart, write operations are never retried (D-2).
- The set-up page ships with its own browser tests in Chromium, WebKit with an iPhone viewport and axe; no page check is manual-only (D-6, standing rule 15).

## Non-goals

- The sign-in page, sessions and showing the installation's name at sign-in (story 1.3).
- Invitations (story 1.4).
- The deployment key and its fingerprint (story 1.5), although choice CA-52 also covers them.
- The self-hosted set-up code printed in the server output (story 2.21), and self-hosted proxy address rules (story 2.22).
- Installation instructions (story 9.1).
- Changing the public address in Settings (story 1.15).
- Route classes (story 1.8) and activity-log entries (story 1.14).
- Two installations sharing no sign-in, project or file (stories 1.3, 1.7 and 2.25).

## Success signal

- On a fresh Cloudflare test installation, the installer runs the deploy command and gets a code. Opening the `https://` address shows S-25, and completing it confirms the installation's name and the administrator's email. A second deploy prints no code, and the set-up page is then refused.
- In CI, the Playwright suite shows the same flow and the wrong-code wait passing in Chromium and WebKit, with axe clean.

## Assumptions

- R11 showed that running Durable Objects keep old code for minutes after a deployment. So the code is checked in the Worker entry against the current secret, and the installation object receives only a fingerprint of the code; counts reset when the fingerprint changes. Confirm this on a deployed installation.
- The password is hashed only after the count is raised and the code verified. Wrong codes therefore cost no scrypt work, and at most one 128 MiB hash runs per accepted attempt.
- The no-users check and the administrator insert run in one synchronous installation-object step after hashing, because input gates do not cover non-storage awaits.
- The public address is the origin of the accepted set-up request. Standing rule 13 already requires that origin to equal the request URL's origin.
- A missing code is refused by schema (`invalid_input`, field `code`) and does not raise the wrong-code count.
- On Cloudflare the network address is `CF-Connecting-IP`. Without it, as on the local runtime, requests share one bucket.
- Self-hosted, with no set-up code secret configured, set-up is refused until story 2.21.
- New installation-object tables are added under data format 1 with create-if-absent. Pre-release installations are re-created, not converted (standing rule 8).
- Each Playwright project runs against its own preview server, with its own empty Durable Object state and its own generated code. No test-only reset route ships in the build.
- The app header's name and the set-up page's address are implementation choices.

## Decisions (Kevin, 2026-11-20)

- **D-1** (was OQ-1) The HTTP-to-HTTPS redirect is in the Worker and fires only when Cloudflare's request metadata marks the request as plain HTTP. Self-hosted never sees that signal, so it cannot loop; AD-16 keeps the self-hosted redirect in the bundled web server. Kevin rules this does not breach standing rule 7.
- **D-2** (was OQ-2) `callObject` retries only on the version-stop reason, after a deployed installation shows the reason reaches the caller. If it cannot be distinguished, writes are never retried.
- **D-3** (was OQ-3) A per-address wrong-code count clears 15 minutes after its last failure. Attempts during a wait are refused and not counted. The 100-per-hour cap is a rolling 60 minutes.
- **D-4** (was OQ-4) The administrator's name has 1–80 characters. The email passes a light format check, has at most 254 characters and is stored lower-cased. "Password not equal to the email" ignores case.
- **D-5** (was OQ-5) After set-up the app shows the prototype as today. The set-up address shows "set-up is already complete", and its request is refused.
- **D-6** Spec order: Playwright is set up together with the set-up page, so the page's implementation spec ships its own browser and axe tests.
