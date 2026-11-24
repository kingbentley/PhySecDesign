---
title: 'Story 1.5 follow-up: focus timing on the remaining pages and per-test addresses in the browser tests'
type: 'bugfix'
created: '2026-11-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Focus moves made in passive `useEffect`s after a reply can run after typing has started and lose keystrokes (story 1.5 spec 7's webkit-iphone failure); the set-up page, the invitation page and the invite panel still use them, and the sign-in page's first-step alert and "Sign-in cannot be checked" heading have no test that would see the race. Separately, every browser test request without its own `CF-Connecting-IP` is counted under one known address (127.0.0.1) with the 20-failure limit, so failures from one spec file can push another file's tests into "Too many attempts", while `signin.spec.mjs`'s header comment says the opposite.

**Approach:** Make every focus move that follows a reply or a newly shown view on those three pages a `useLayoutEffect` (focus calls made straight in a handler stay); add focus-on-appear checks (`watchFocusOnAppear`) for each element that appears after a reply, including the sign-in page's first-step alert and `SignInUnknown`'s heading; say which elements are shown only by a click and get no check. Correct the header comment and give every failure-producing test its own address through one shared helper, keeping the tests that exercise the per-address limit meaningful. Name the best-fitting story as proposed owner of the screen-reader deferred entry. No change to `server/` or `shared/`. Source: the orchestrator's task of 2026-11-23 for story 1.5's follow-up before its pull request (Part A; Part B, the deliberate-breakage audit, is recorded in `_bmad-output/specs/spec-story-1-5-two-step-verification/breakage-audit.md`).

</frozen-after-approval>

## Implementation Notes

Workflow: `bmad-build`, oneshot route (the catalog has no `bmad-quick-dev`; Build is its implementation flow). Review: Blind Hunter (the oneshot layer) plus Edge Case Hunter and Verification Gap, each a fresh subagent on model `opus` at effort `high` (Kevin's instruction, relayed by the orchestrator).

Files changed:
- `site-studio/src/admin/SetupPage.jsx`, `InvitationPage.jsx`, `InvitePanel.jsx`: every focus move after a reply or a newly shown view is a `useLayoutEffect` (`useFocusOnMount`, the form or accept alert, the panel's Email field, the result heading, and the panel's Escape and Tab-trap listener, the last from review finding BH9). Focus calls made straight in a handler are unchanged.
- `site-studio/browser-tests/two-step-helpers.mjs`: the watch is one in-page function, `installFocusWatch`, used by `watchFocusOnAppear` and by the new `watchFocusOnAppearFromLoad` (an init script, for a view shown as a page opens); options `match: "contains"` (an alert known only in part, or holding a button's text) and `fresh` (ignore matching elements already shown); `signInWithPassword` and `signInWithRecoveryCode` take an optional `address`.
- `site-studio/browser-tests/test-addresses.mjs` (new): `addressFor(testInfo)` = `fd00:<file>:<repeat>:<line>::1`, and `useOwnAddress(page, testInfo)`.
- `site-studio/browser-tests/signin.spec.mjs`: header comment corrected; checks for the first step's alert (first refusal only: the second shows the same text), `SignInUnknown`'s heading (focus asserted, and on appear, in all eight cases), "Set-up is complete" (mocked set-up), "Set-up is already complete" (on load, and after Try again), "Set-up cannot be checked" (on load); the wrong-password test has its own address and, for `--repeat-each`, its own account (`accountThroughApi`, no two-step) and unknown email per project and repeat, in place of the administrator's email and a fixed unknown one (both would reach the email limit of 5 by the sixth repeat).
- `site-studio/browser-tests/setup.spec.mjs`: checks for the alert (each refusal, with focus first moved to the code field, review finding BH6), "Set-up cannot be checked" (each case and address), "Set-up is complete" and "Set-up is already complete" (on load and after the 409); the wrong-code test has its own address.
- `site-studio/browser-tests/invitation.spec.mjs`: checks for the panel's Email field on opening, the result heading, the panel alert, the "no longer works" heading (malformed fragment, 410 read, refused accept), the reopen heading, "The invitation cannot be checked" (each pass), the updating view's "Invitation" heading (reply held, `fresh` watch, review finding BH7) and the accept alert (failed and busy); `emailFor` takes `testInfo` in every test whose invitation is accepted (review finding BH4).
- `site-studio/browser-tests/two-step.spec.mjs`: Turn on, Fresh codes and Turn off use their own address, for the page and their API sign-ins.
- `_bmad-output/implementation-artifacts/deferred-work.md`: four entries updated (two focus entries and the address entry closed; the screen-reader entry given story 3.4 as proposed owner), one added (the stale comment in `server/api/clientAddress.ts`).
- Third commit (rulings of 2026-11-24 below): `site-studio/browser-tests/setup.spec.mjs` (file timeout 120 s, with a comment on why), `site-studio/server/api/clientAddress.ts` (header comment only), `deferred-work.md` (the clientAddress entry closed, the screen-reader owner confirmed, `net::ERR_TOO_MANY_RETRIES` added to the story 10.1 entry) and this file.

Not checked, as shown only by a click: the invite panel's empty form after "Invite another person" (React flushes a click's effects before the click ends). Said in a test comment.

Proof the checks can fail: with every focus move on the four pages turned back into a passive `useEffect` (one import alias per file) and serial mode lifted, each new check failed in both chromium and webkit-iphone, except the invite panel's Email field, which failed only in webkit-iphone (said in its test comment); within a looped test only the first failing case was observed. The updating view's check, added after review, failed in both projects the same way. All reverted.

Choices the brief did not settle: per-test addresses only on failure-producing tests (not a file-wide `beforeEach`), so the other tests are unchanged; IPv6 `fd00::/16` addresses so the scheme cannot overlap `second-step.spec.mjs`'s 10.0.0.0/8 one, which is left as it is; the three tests that exercise a limit on purpose keep their 192.0.2.x addresses; `setup.spec.mjs` cannot run under `--repeat-each` (its set-up closes the installation), so it was run as ten whole-file runs instead; the review layers beyond the oneshot's Blind Hunter were added for coverage.

Orchestrator rulings of 2026-11-24 (Claude, accepted on Kevin's instruction), after its check of `a00745c` and `6d8ea60`, taken in a third commit:
1. The WebKit first-test timeout in `setup.spec.mjs` is fixed now, not deferred: the file's `test.describe.configure` gets a file-level timeout of 120 s, as `second-step.spec.mjs` has, with a comment giving the cold-launch timings from the trace. No assertion timeout is raised and no retry added. Fair only if the time goes on launching the browser, not on the app, so each proof run's first WebKit test duration is recorded in Verification.
2. `server/api/clientAddress.ts`'s header comment is corrected in this commit, a comment-only change (the ban on `server/` lifted for that comment alone): under Wrangler's local runtime (Miniflare) a request without the header is given the client's address, 127.0.0.1, and counted under it; the unknown bucket applies only where nothing sets the header. What it says about stories 2.21 and 2.22 is unchanged. The deferred-work entry is closed.
3. The screen-reader entry's owner is confirmed as story 3.4, with story 10.6 for the VoiceOver check on a real iPhone. The epics are not edited: a screen-reader criterion in either story is Kevin's decision, and the entry says it waits for it.
4. `net::ERR_TOO_MANY_RETRIES` is added to the story 10.1 machine-limit entry in `deferred-work.md`, beside `net::ERR_NO_BUFFER_SPACE`.
Also accepted, no action: `bmad-build` oneshot in place of a quick flow the catalog lacks; the two extra review layers; the amended audit commit; the audit's differences from the records; the IPv6 address scheme; whole-file runs for set-up; BH5, BH8, EC2, EC3 and the rejected parts of BH10 and BH11 as reasoned; BH9 untested. The third commit is a test timeout and comments only, so no review layers were run for it.

Surprises: the WebKit "Turn on" test once timed out at 150 s with four "Create page" steps of 33 to 40 s each while three review subagents were running; see Verification.

## Verification

Run one at a time in `site-studio/` on 2026-11-23, after the last Part A change, with Playwright's output in the session's scratch folder (no trace in the repository) and "TLS handshake failed" lines filtered out:

- `npm run typecheck` clean; `npm test` 231 pass, 0 fail; `npm run test:server` 509 pass in 36 files; `npm run build` passes; `npm run test:sites` 4 pass; `npm run smoke:selfhost` passes.
- `npm run test:browser` (build, then the whole suite): first run 148 passed, 1 failed, 23 did not run. The failure was chromium's "the link opened in a new browser shows the inviter, …" (unchanged by this work): the page showed "The invitation page could not be loaded" because the request for a stylesheet chunk (`/assets/account-*.css`) failed with `net::ERR_TOO_MANY_RETRIES`, a local network failure of the kind the build notes name for `ERR_NO_BUFFER_SPACE`; serial mode skipped the rest of that file. Rerun once (build, then the whole suite): 172 of 172 passed in 20.7 minutes.
- `--repeat-each 10`, both projects, every test changed or added:
  - `signin.spec.mjs` (5 tests): 100 of 100.
  - `invitation.spec.mjs` (15 tests): 300 of 300.
  - `two-step.spec.mjs` (Turn on, Fresh codes, Turn off): 60 of 60, including the WebKit "Turn on" that had timed out once.
  - `setup.spec.mjs` cannot repeat within one run (its set-up closes the installation), so it was run as whole-file runs: 14 runs, 9 complete (34 of 34 each). In the other five (runs 4, 5, 6, 11 and 14), the file's first test, "shows the set-up page with every field …" (then line 63, unchanged), timed out at 30 s: in WebKit "while setting up \"page\"" (runs 4, 6, 11 and 14), and in run 5 in both projects; serial mode then skipped the rest of that project. The changed set-up tests never failed: they completed and passed in chromium in 13 of 14 runs and in webkit-iphone in 9 of 14. The traces of runs 4, 5, 6 and 11 were cleared by the next run (they shared one output folder). Run 14's trace (after `a00745c`, kept outside the repository) found the cause: the first WebKit test of a run pays the browser's cold start inside its own 30 s timeout, 26.8 s to launch WebKit, 6.6 s to create the context and 23.4 s to create the page, before the test's first step. The orchestrator's check reproduced it once in three runs. Fixed in the third commit (ruling 1 above).

Third commit (2026-11-24, after rulings 1 to 4), run one at a time in `site-studio/`, Playwright's output and traces in the session's scratch folder:

- `npm run typecheck` clean; `npm test` 231 pass, 0 fail; `npm run test:server` 509 pass in 36 files; `npm run build` passes.
- `setup.spec.mjs` with the 120 s file timeout, ten whole-file runs in a row, both projects, `--trace on`: 34 of 34 in every run, no failure, skip or flaky result (3.4 to 5.0 minutes a run). The first test (now line 66) took, in webkit-iphone, 3.6, 4.6, 2.1, 4.2, 2.4, 7.4, 11.7, 11.7, 7.6 and 2.2 s (runs 1 to 10), and in chromium 8.7 to 11.1 s. The slowest WebKit first tests (runs 7 and 8) spent their time starting the browser: in run 7's trace, 13.6 s of fixtures (launch 4.5 s, page 9.0 s) against about 1.3 s for the test's own steps (navigate 0.4 s, first visible check 0.9 s); in run 8's, 7.8 s of fixtures (launch 2.0 s, context 1.2 s, page 4.6 s) against the same 1.3 s. None came near the old 30 s on these runs, so they show the time goes on the browser's start, not the app; the 30 s cases were the cold starts above.
- `npm run test:browser` (build, then the whole suite, with Playwright's output in the scratch folder): 172 of 172 passed in 19.6 minutes.


## Review Triage Log

Reviewers: Blind Hunter (BH), Edge Case Hunter (EC), Verification Gap (VG); each a fresh subagent on `opus` at effort `high`. VG reported no verification gaps in the focus checks or the addresses, and two other findings (VG1, VG2).

| # | Finding | Verdict | Outcome and evidence |
|---|---|---|---|
| BH1 | The spec file was a stub: status in progress, no notes, no record that the checks can fail | low | Patched: Implementation Notes, this log and Verification written; status set at the end. |
| BH2, EC5, VG2 | `deferred-work.md` not yet updated: no owner for the screen-reader entry, focus entries still open | low | Patched: the review ran before the records were written; all four entries updated. |
| BH3 | `server/api/clientAddress.ts` says the local runtime puts every headerless request in one bucket, which this change shows is wrong | low | Deferred (the task forbids `server/`): new entry in `deferred-work.md`, proposed owner stories 2.21 and 2.22. |
| BH4, EC1, VG1 | `invitation.spec.mjs`'s `emailFor(label, testInfo)` used with `testInfo` by one accepting test only; four others (accept, admin, twin, othertab) would fail a second repeat | medium | Patched: all five pass `testInfo`; repeat 0's emails are unchanged. |
| BH5 | The fixed-address limit tests (192.0.2.44, .61, .62) are not safe under `--repeat-each` | low | Rejected: pre-existing, unchanged by this work and not run with repeats; `test-addresses.mjs`'s header now says so. |
| BH6 | `setup.spec.mjs` "other refusals": from the second refusal, the alert may still hold focus (a WebKit click does not move it), so the check could pass on a passive effect | medium | Patched: focus is moved to the code field before each watch and send. |
| BH7, EC4 | The invitation page's updating view gets no focus check | medium | Patched: the read reply is held until the checking view shows, then a `fresh` watch (new helper option) waits for the new "Invitation" heading; turned passive on purpose, it failed in both projects. |
| BH8 | A view shown again after a Try again that fails again (re-keyed `StateUnknown`, `CannotCheck`) is not checked | low | Rejected: the re-keyed view runs the same `useFocusOnMount` on mount that the first appearance checks; no existing test has a failing Try again, and adding one is beyond the brief. |
| BH9 | The invite panel's Escape and Tab-trap `keydown` listener is still registered in a passive effect, so a key pressed as the panel appears could escape the trap | low | Patched: `useLayoutEffect` (one word; `useEffect` no longer imported there). Not separately tested. |
| BH10 | Two `addressFor`s with different schemes; `invitation.spec.mjs` listed but unused; the project left out silently | low | Patched in part: the header names `second-step.spec.mjs`'s own `addressFor`, says why the project is left out and why invitation keeps its number. Rejected: renaming or merging the two (merging would change all of second-step's tests). |
| BH11 | `test-addresses.mjs`'s header covers only the sign-in limit, names no Miniflare version, and no test asserts the 127.0.0.1 behaviour | low | Patched: set-up code limit and versions (miniflare 5.20261116.0-beta, wrangler 4.164.0) named. Rejected: a test of Miniflare's own behaviour (it would test the runtime, not the app). |
| BH12 | Helper doc comments stale (`watchFocusOnAppear` "as two-step.spec.mjs's watch does", `focusedOnAppear` names one watch, the init script's lifetime unsaid) | low | Patched. |
| EC2 | Two tests on one source line would share an address | false | No test in these files is declared in a loop or a factory; each `test(` is on its own line. |
| EC3 | Two watches with the same text and different kinds overwrite each other | low | Rejected: no test does so; the JSDoc now says results are kept by text. |
