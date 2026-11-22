---
title: 'Pull request 12, CodeRabbit review round 1: four fixes on story 1.4'
type: 'bugfix'
created: '2026-11-21'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/stories/3-invite-panel-invitation-page-and-browser-tests.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Four CodeRabbit findings on pull request 12 (story 1.4), chosen by Kevin for fixing: (1) `invitation-store.test.ts` signs the administrator in at a fixed 2026-11-21 while some tests act on the live clock, so they fail from 2026-12-21; (2) `invitationClient.js` `post()` puts only the fetch under its deadline, not the dynamic load of the app's header; (3) the visibility re-read in `main.jsx` reloads the page when another tab signs in as a different account, which at `/invite` loses the invitation secret and the typed form; (4) the operation sweep in `invitation-store.test.ts` compares user counts, not user identifiers.

**Approach:** (1) Give the `withAdministrator` fixture a sign-in time, `Date.now()` where a test acts on the live clock, `T0` elsewhere; (2) put header loading and the request under one deadline and never start a request after it; (3) on invitation paths apply the new session without reloading, keep the reload elsewhere; (4) compare identifier sets. Each with a test. No changes under `server/` or `shared/`; one commit; nothing pushed.

</frozen-after-approval>

## Implementation Notes

- The catalog has no `bmad-quick-dev` in BMAD 6.12.4; `bmad-build` took its one-shot route (no intent gaps, nothing irreversible, small).
- Each finding was checked against the code first and held. `invitation-routes.test.ts` and `invitation-retry.test.ts` sign in through the real routes on the live clock, so they did not have finding 1's pattern.
- Files: `site-studio/server-tests/invitation-store.test.ts` (fixes 1 and 4), `site-studio/src/admin/invitationClient.js` and `site-studio/server-tests/invitation-page-text.test.ts` (fix 2; the header loader is an option, `loadHeaders`, only so a test can stall it), `site-studio/src/main.jsx` and `site-studio/browser-tests/invitation.spec.mjs` (fix 3), and story 3's spec (round-1 section; triage rows 7 and 19). Nothing under `server/` or `shared/`.
- After the orchestrator's check: the read-fails browser test raced the page's `hashchange` reload by opening the same `/invite` link twice in one document; each pass now starts from `about:blank`. A one-off chromium lazy-chunk failure in "when copying fails …" stays unexplained (trace overwritten).
- Results and test counts are in story 3's spec, section "Pull request review, round 1 (2026-11-21)", and in the commit.

## Review Triage Log

One blind-hunter layer on the uncommitted diff; 14 findings.

| # | Finding | Verdict | Outcome |
|---|---|---|---|
| 1 | Story 3's frozen matrix still says an account switch reloads | low, real | patched: a note in story 3's round-1 section (the frozen block is left as is) |
| 2 | No deliberate breakage recorded for the new guards | low | rejected: the browser test's `__notReloaded` check is the inverse of the same-name test's, which fails on no reload; a breakage run costs a build and browser run |
| 3 | `/invite/` not tested for the new behaviour | low | rejected: both paths go through the one `isInvitePath` check, which the `/invite/` tests already cover |
| 4 | Signed-out/in transitions at `/invite` untested | false | that behaviour is unchanged by this round (it never reloaded) |
| 5 | The new browser test never submits | low | rejected: the accept flow is unchanged and tested elsewhere |
| 6 | `signInClient.js` has the same header-load gap | low, real, old | not fixed in round 1 (out of scope then); fixed on 2026-11-22 at Kevin's request, in a separate commit (story 3's spec, "After round 1") |
| 7 | Two declined items not in `deferred-work.md` | false for this change | Kevin's decisions; the orchestrator replies on GitHub |
| 8 | The prompt-path header test checks one function and not the headers | low, real | patched: all three, with the headers sent |
| 9 | No test for a header load that fails | low, real | patched |
| 10 | The email-taken test relied on a session starting after the injected time | low, real | patched: `T0` session for injected calls, a separate live session for `callObject` |
| 11 | This spec file incomplete | low, real | patched |
| 12 | Round-1 records not linked | low, real | patched: story 3 links this file |
| 13 | The sweep's failure message hides the missing identifier | low, real | patched: it lists removed or replaced identifiers |
| 14 | A timed-out accept's real outcome is unknown | false | `acceptOutcome` already maps no answer to the "may have been set" message (review finding 7 of the build) |
