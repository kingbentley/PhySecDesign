---
title: 'Pull request 13, CodeRabbit review round 4: story 1.5 (two-step verification)'
type: 'bugfix'
created: '2026-11-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'a6f74c83810d579c7e9f599cac485de37a0caf2b'
context: ['{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/review-round-3.md', '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/stories/8-second-step-page.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CodeRabbit reviewed `a6f74c8` (pull request 13, round 3's commit) in review `6063436024` and left two inline comments, with no findings in the review body. (1) Spec 8 line 214, Major: when a second step's 200 body did not arrive and the session read that settles it fails, the page shows the refusal but leaves the session the browser may hold, so a later person on a shared browser can reload into the account. (2) Root `AGENTS.md` line 16, Minor: the "Jira keys" bullet claims that the key in the pull request title makes GitHub for Jira show the branch and commits too, which it does not by itself.

**Approach:** Verify each finding against the code first. Fix (1) by having the page end that session the way "Back to sign in" does (the existing sign-out path of `endAbandonedSession`) when the settling read fails or throws, with the existing refusal and no new wording; a read that answers signed in still opens the app, and one that answers signed out sends no sign-out. Prove it with a browser test that fails on `a6f74c8`. Correct (2)'s sentence only, adding no rule about branch names or commits. One new commit on `story/1.5` on top of `a6f74c8`, named paths staged only; not pushed; nothing posted on GitHub or Jira.

</frozen-after-approval>

## Implementation Notes

- **Workflow.** `bmad-build`, one-shot route, as rounds 1 to 3, with step 4's three review layers. This file is the round's spec and record. `sprint-status.yaml` is not touched (a review round, no story status change).
- **The count: 3 findings.** Review `6063436024` on `a6f74c8` has two inline comments (`4699620262`, `4699620278`) and no findings in its body; the third is CodeRabbit's reply `4699638632` (below), counted on the orchestrator's ruling R4. Two CodeRabbit replies on round 3 threads came after it: `4699636940` (`SignInPage.jsx`, reload) withdraws that finding; `4699638632` (`deploy-cloudflare.mjs:161`, which Worker serves the key-state path) does not mark the finding addressed and adds a qualification. Neither is part of review `6063436024`; the first is not counted, the second is (R4).
- **Orchestrator rulings this round** (each "Claude, accepted on Kevin's instruction, 2026-11-25"; Kevin may overrule):
  - R1, a failed session read after a 200 whose body did not arrive: **fix.** When the read that settles it fails or throws (not "signed out"), the page ends that session the way "Back to sign in" does and shows the existing refusal. Existing wording only. A read that answers signed in still opens the app; one that answers signed out needs no sign-out. Accepted cost: a correct code is spent. Accepted residue: if that sign-out is also not confirmed, the session stays until the next visibility check or reload, as in round 2.
  - R2, the Jira key bullet: **correct the sentence only.** The first bullet of `AGENTS.md`'s "Jira keys" now claims only that the key in the pull request title lets GitHub for Jira show the pull request on the story. No rule about branch names or commit messages is added: that convention is the owner's to decide.
- **What changed.**
  - `site-studio/src/admin/signInClient.js`: in `createSecondStepRun`'s `send`, a settling read that answers `unknown` or throws now gives `{ kind: 'refused', message: SIGN_IN_MESSAGES.other, endSession: true }`; signed out gives the refusal without the flag, signed in opens the app as before. Doc comments updated.
  - `site-studio/src/admin/SignInPage.jsx`: `submitSecondStepForm`'s refusal branch calls `endAbandonedSession()` when `endSession` is set, then shows the same refusal. The password submit's prelude (wait for a running sign-out, then retry an unconfirmed one) moved into `finishLeftSignOut()`, now also run before a second step is sent.
  - After the review layers (T1): `finishLeftSignOut`'s one more try goes through `endAbandonedSession({ retry: true })`, so it is tracked in `leftSessionEnding` (a submit started after Back waits for it), is not flagged again when unconfirmed (still one more try, as in round 2), and reloads the page if it is confirmed after the page has gone. `endAbandonedSession` returns its promise. Then (T11, found by the advisor check after the first commit attempt, before this commit): `finishLeftSignOut` waits for `leftSessionEnding` in a loop, since with a code submit and, after Back, a password submit both waiting on the same sign-out, the one that resumes first starts the retry after the other has passed a single check. `backToSignIn`'s comment updated ("the next submit").
  - `site-studio/browser-tests/second-step.spec.mjs`: the round 4 test (its fetch stub moved into `cutSecondStepAndFailReads`); a second test for the unconfirmed case (T1, T3); the "Wrong code" test now asserts no sign-out is sent (T4).
  - `site-studio/tests/signin-client.test.mjs`: the round 3 test's expectations for `endSession`; abandoning during a read that fails gives no `endSession` (T5).
  - `AGENTS.md`: the one bullet (R2).
  - Spec 8: a dated round 4 note outside the frozen block; round 3's residue sentence marked "replaced in round 4, below".
  - `deferred-work.md`: a dated update on the story 1.6 entry (the residue when this sign-out is not confirmed).
- **Amendment after the orchestrator's check (2026-11-25):** two more rulings.
  - R3 (T7): the failed-read sign-out ending a sign-in made in another tab meanwhile is accepted, as round 2 accepted it for Back. No code change.
  - R4, CodeRabbit's reply `4699638632` on the `deploy-cloudflare.mjs:161` thread (an open finding of this round, as the reply does not mark the finding addressed): **fix, narrowly.** Without `--url`, `chooseAddress` picks only a reported whole-host `https://` target whose parsed host, lower-cased, ends in `.workers.dev`; any other reported target is never the default; with none, the command stops with the existing "no https:// address … Run again with --url" line. `--url` handling is unchanged. Existing wording only. Reason: round 3's principle that a finding about too much trust must not leave a default that can widen with a tooling change.
  - What changed for R4: `site-studio/scripts/deploy-cloudflare.mjs` gains `isWorkersDevTarget` (`isWholeHostTarget` plus the host check, on `new URL(...).hostname.toLowerCase()`, not on the text), used by `chooseAddress` without `--url`; its header comment no longer says "the first one Wrangler reports". `site-studio/tests/deploy-cloudflare.test.mjs`: a new test (below), and the two `A_TARGET` fixtures that stood in for the workers.dev address in runs without `--url` are now `https://a.example.workers.dev`. Spec 6: a dated round 4 note outside its frozen block, replacing the default described in its round 2 and round 3 notes. The README's `--url` paragraph says nothing about the default and stays true ("the workers.dev address avoids the question"), so it is unchanged. After the amendment's review layers: test names that described the round 2 default renamed (three), the run-level stop test and three edge assertions added (the bare `https://workers.dev`, a workers.dev target limited to a path, and `https://<host>.workers.dev/*`, which counts as whole-host), the header comment rewrapped, spec 6's note corrected, spec 8's other-tab sentence made its own ruled bullet, and a dated update on deferred-work's story 9.12 entry. Residues of R4, recorded: any `.workers.dev` host qualifies, not only the deployed Worker's own (closing that is story 9.12's identity check, beyond R4's narrow fix); and with no workers.dev target the existing line "The deployment reported no https:// address" also prints when a custom `https://` target was reported (the ruling keeps the existing wording; its "Run again with --url" advice is right). Round 3's record says the default is "only ever the workers.dev address" in Wrangler 4.164's output; that now holds by the code, not by Wrangler's format (this line, not an edit of round 3's record).
- **Choices this session made that the rulings did not settle:**
  - The flag is set in the client and the sign-out is made by the page, so the page's existing mechanism does the work: `endAbandonedSession`'s retry at the next submit when the sign-out is not confirmed, and its reload when the page has gone. No new state.
  - A code sent from the code form while that sign-out runs waits for it (`finishLeftSignOut`, as the password submit has done since round 2). Without it, a retry whose pending sign-in was still live (the 200 having been an intermediary's) could succeed, and the sign-out's reply, which clears the session cookie whatever session was live (`handlers.ts` `signOut`), would then clear the new session. If "Back to sign in" is pressed, or the page goes, during that wait, the code is not sent. Cost: such a retry can show "Checking…" for up to one more sign-out deadline (15 seconds), or two when an unconfirmed sign-out is retried.
  - The one more try of an unconfirmed sign-out, run before either form's submit, is tracked like the first try (T1). Worst case for "Checking…" on the code form: about 65 seconds (15 for a running sign-out, 15 for its retry, then round 3's 35).
  - Consequence, confirmed by ruling R3 (T7): as with Back (round 2's accepted cost), this sign-out ends whatever session the browser holds, so a sign-in made in another tab between the cut-off reply and the failed read is signed out too. It follows from "the way Back does"; R1 named only the spent code.
  - The sign-out does not touch the pending sign-in cookie (`signOut` clears only the session cookie), so after an intermediary's 200 the person can still retry the code; after a real success the pending sign-in is spent and a retry gets the expired message and the password form.

## Findings

| # | File and line | Severity | CodeRabbit's title | Holds? Evidence | Verdict | What changed, or why not | Proving test |
|---|---|---|---|---|---|---|---|
| 1 | spec 8 line 214 (inline, `4699620262`) | Major | Do not leave a hidden session after a failed session read | Yes. On `a6f74c8`, `createSecondStepRun`'s `send` returned the same `{ kind: 'refused', message: SIGN_IN_MESSAGES.other }` for a read that answered signed out and for one that failed or threw (`signInClient.js` lines 196–204), and `submitSecondStepForm`'s refusal branch only showed the message (`SignInPage.jsx` line 347). After a correct code whose 200 body was cut off, the browser held the session cookie while the page said sign-in failed; a reload or the visibility check would open the account. | fix (ruling R1) | A failed or thrown read gives the refusal with `endSession: true`; the page then calls `endAbandonedSession()` (the sign-out "Back to sign in" uses, its retry and its reload) and shows the same refusal. A code sent meanwhile waits for that sign-out (Implementation Notes). | Browser, `browser-tests/second-step.spec.mjs`, "A correct code's 200 cut off and the session read failing (review round 4): the page ends the session as Back does and shows the existing refusal on the code form; a code sent meanwhile waits for that sign-out": fails on a build with `a6f74c8`'s `signInClient.js` and `SignInPage.jsx` in both projects (no sign-out is sent: `waitForRequest` times out after 20 s), passes in both after; T1's browser test covers the unconfirmed case. Unit, `tests/signin-client.test.mjs`, "a 200 whose body misses the time limit is settled by the session …": now expects `endSession: true` for a failed and a thrown read, none for signed out, an ordinary refusal, a wrong-shape body or no answer (failed on `a6f74c8`'s `signInClient.js`: the flag was missing). |
| 2 | `AGENTS.md` line 16 (inline, `4699620278`) | Minor | Include the key in branches and commits too | In part. The bullet claimed that the key in the pull request title makes GitHub for Jira show the pull request, its branch and its commits; the title alone links the pull request. Whether to require the key in branch names and commit messages is the owner's convention to decide, not this review's. | fix the sentence only (ruling R2) | The bullet now says the key in the title lets GitHub for Jira show the pull request on the story. No branch or commit rule added; nothing else in `AGENTS.md` changed. | n/a (documentation) |
| 3 | `scripts/deploy-cloudflare.mjs:161`, reply `4699638632` on the round 3 thread | (thread) | Qualification: `chooseAddress` accepts any whole-host `https://` target, not only workers.dev | Yes. On `c8c338d`, `chooseAddress` took the first target passing `isWholeHostTarget`, which accepts `https://host` and `https://host/*` for any host; "only the workers.dev address" held only because Wrangler 4.164 prints only workers.dev targets with `https://`. No legitimate default today is another host: every test of a run without `--url` used a stand-in for the workers.dev address. | fix, narrowly (ruling R4) | Without `--url`, only a whole-host `https://` target whose parsed host ends in `.workers.dev` is the default (`isWorkersDevTarget`); `--url` unchanged; two test fixtures renamed to a workers.dev host; header comment and spec 6 note. | `tests/deploy-cloudflare.test.mjs`, "without --url reads only a workers.dev address, whatever else Wrangler reports (review round 4)" and "the default address (pull request 13, review round 4) › stops after the deploy, with nothing listed, asked, put or deleted, when Wrangler reports no workers.dev address": both fail on `c8c338d`'s script (89 of 91 pass), pass after (91 of 91). |

## For the orchestrator

- Reply `4699638632` (`deploy-cloudflare.mjs:161`) was put to the orchestrator after the first commit and ruled on (R4): finding 3 above.
- CodeRabbit's reply `4699636940` on the round 3 thread at `SignInPage.jsx` (reload while a second step is pending) withdraws that finding. Nothing to do.

## Checks

After the amendment (R4), run in `site-studio/`, one at a time, after its last change (Node v24.18.0):
- `npm run typecheck`: clean.
- `npm test`: 353 of 353 pass (351 before R4, plus R4's two new tests in `tests/deploy-cloudflare.test.mjs`).
- `npm run test:server`: 37 files, 516 of 516 pass.
- `npm run build`: passes.
- `npm run test:sites`: 4 of 4 pass.
- `npm run smoke:selfhost`: passes, ending "Self-hosted smoke test passed: the value saved on first start was read back after a restart."
- Browser tests: **not rerun after the amendment.** It changes nothing under `site-studio/src` or `site-studio/browser-tests` (`git diff --stat c8c338d -- src browser-tests` is empty), so the orchestrator's instruction allows skipping it. The last run, on `c8c338d`'s code (the same files under those folders): 210 of 210 pass in one run, both projects, no "retry #" line in the log.

Before the amendment, on `c8c338d`'s code, the same seven passed: typecheck clean; `npm test` 351 of 351; `test:server` 516 of 516 in 37 files; build; `test:sites` 4 of 4; `smoke:selfhost`; browser 210 of 210. They had also passed with the same counts on the code before T11, and were run again after it.

Failing-first runs (each source file put in place temporarily from `git show <commit>:…` or from a saved copy, then restored and checked by checksum, then rebuilt):
- Unit, `tests/signin-client.test.mjs` with `a6f74c8`'s `signInClient.js`: 1 of 24 fails (the `endSession` flag missing for a failed read).
- Browser, finding 1's test, on a build with `a6f74c8`'s `signInClient.js` and `SignInPage.jsx`: fails in both projects (no sign-out is sent; `waitForRequest` times out after 20 s).
- Browser, finding 1's test, on a build of the final code with only the code form's `await finishLeftSignOut()` removed: fails in both projects at "no second step sent while the sign-out runs".
- Browser, T1's test in its first shape (retry started, then Back and a password submit), on a build with this round's pre-triage `SignInPage.jsx`: failed in both projects at "no sign-in sent while the retried sign-out runs".
- Browser, T1's test in its final shape (T11: both submits waiting on the first sign-out), on a build with the `SignInPage.jsx` of the first commit attempt (`4162d3d`, tracking but no loop): fails in both projects at "no sign-in sent while the retry runs".
Each passes in both projects on the final build.
- Unit, R4's two tests in `tests/deploy-cloudflare.test.mjs` with `c8c338d`'s `deploy-cloudflare.mjs`: both fail (89 of 91 pass); 91 of 91 after.

Not covered by a test: the page going away (unmount) during the pre-send wait (the `!mounted.current` half of the early return), and the reload when the retry is confirmed after the page has gone. No Wrangler or Cloudflare call was made. Nothing was posted on GitHub or Jira. `sprint-status.yaml` was not changed.

## Review Triage Log

Three review layers on the round's diff (`git diff a6f74c8` of the working tree, plus this file as it then stood), each a fresh read-only subagent started with model `opus` and effort `high` (Kevin's explicit instruction, passed as each call's `model` and `effort`). The Blind Hunter (BH), Edge Case Hunter (ECH) and Verification Gap (VG) layers each reported running on Opus 5.5 (`claude-opus-5-5`); each said it could not see its reasoning effort. BH reported 12 findings (floor 6), ECH 2, VG 3. One row per root cause. The layers reviewed the diff before triage; the triage patches (T1 to T6, T9, T11) were tested as recorded in Checks but not reviewed by a layer.

| # | Layers | Finding | Verdict | Route |
|---|---|---|---|---|
| T1 | BH, ECH | `finishLeftSignOut`'s retried sign-out was awaited but not put in `leftSessionEnding`. Since this round it also runs before a code is sent, and "Back to sign in" can interrupt that wait (no request exists yet, so Back neither abandons nor signs out, and it resets `inFlight`); a password submit then found nothing to wait for and its sign-in could be answered before the retry, whose reply clears the session cookie. Also, a retry confirmed after the page had gone did not reload it | high | patch: the retry runs through `endAbandonedSession({ retry: true })` (tracked, not flagged again, reloads if the page has gone); browser test "The failed-read sign-out not confirmed (review round 4): …", failing first as recorded in Checks |
| T2 | VG, BH | The round 4 browser test checked "no second step while the sign-out runs" once, right after "Checking…" showed, before a wrongly sent request would have been reported; nothing after the release depended on the order | medium | patch: waits two frames before the count, and records the order, asserted as sign-out answered, then second step sent |
| T3 | VG, BH | No test for Back (or the page going) during the pre-send wait, nor for the residue path (the failed-read sign-out not confirmed, retried once at the next submit) | medium | patch: covered by T1's test (unconfirmed sign-out, retry held, Back: no code sent, the password submit waits for the retry, two sign-outs in all). The page-going case is the same line (`!mounted.current`) and has no separate test |
| T4 | VG | Nothing showed that an ordinary refusal sends no sign-out (the page acts only on `endSession`) | low | patch: the "Wrong code" test counts sign-outs after three wrong codes (none) |
| T5 | BH | No unit test for abandoning during a read that then fails or throws (which must not ask for a second sign-out) | low | patch: added to "abandoned during the session read …" |
| T6 | BH | The fetch stub kept session reads failing for the rest of the test | low | patch: reset once the settling read has failed |
| T7 | BH | R1 names one accepted cost; the sign-out also ends a sign-in made in another tab meanwhile, as round 2's Back does | low | recorded (Implementation Notes and spec 8 note), then accepted by ruling R3 |
| T8 | BH | Spec 8's round 4 note presented the session's choice (the code waits for the sign-out) under the orchestrator's ruling; the "Checking…" bound of 35 seconds was not restated | low | patch: the choice moved to its own bullet marked as the session's; bound about 65 seconds stated in both files |
| T9 | BH | `backToSignIn`'s comment still said "the next password submit waits" | low | patch |
| T11 | (this session, after the layers) | With a code submit and, after Back, a password submit both waiting on the same unconfirmed sign-out, the code submit resumed first and started the retry after the password submit had passed its one `leftSessionEnding` check, so the sign-in could go out during the retry: T1's race in another order | high | patch: `while (leftSessionEnding.current) await …`; T1's test reshaped to this order (both submits waiting, the first sign-out answered unconfirmed, the retry held) |
| T10 | BH | This file's "What changed" left out the test files; no checks or triage recorded; "For the orchestrator" section missing; status in progress | low | true of the file as its diff caught it (the Findings and "For the orchestrator" sections were appended after the diff was taken); filled at the end of the round (Findings, this section, Checks, frontmatter), and the test files added to "What changed" |


### Amendment review (R3, R4)

Three layers again on the amendment's diff (`git diff c8c338d`: the R4 code and test, the spec 6 and spec 8 notes, and this file), each a fresh read-only subagent started with model `opus` and effort `high` (Kevin's explicit instruction). Each reported running on Opus 5.5 (`claude-opus-5-5`). BH and ECH said they could not see their effort; VG reported "low (budget value 15 as I can see it)", although the call set `high`. BH reported 11 findings (floor 5), ECH 4, VG no verification gap and 2 other findings. The patches below were tested (Checks) but not reviewed again.

| # | Layers | Finding | Verdict | Route |
|---|---|---|---|---|
| A1 | BH, ECH, VG | Three test names still described the round 2 default ("the first https address", "the first whole-host target"; a `--url` row named "the workers.dev address" with an example.net host) | low | patch: renamed |
| A2 | BH, ECH, VG | With no workers.dev target, "The deployment reported no https:// address" also prints when a custom `https://` target was reported | low | recorded as a residue: R4 keeps the existing wording, and the advice in the line is right |
| A3 | BH | Any `.workers.dev` host qualifies, not only the deployed Worker's (`<worker>.<subdomain>.workers.dev`), so the spec 6 note's "cannot widen" was overstated | medium | recorded and deferred: note reworded to what holds (other hosts cannot widen it), residue named; tying to the Worker is beyond R4's narrow fix and belongs to story 9.12's identity check (dated update on that entry). A rule on the first label was not added: it would be a new behaviour beyond the ruling, and the orchestrator may rule on it |
| A4 | BH | The spec 6 note said a route is never the default, but `https://<host>.workers.dev/*` counts | low | patch: note says so; a test pins it |
| A5 | BH | No run-level test of the new stop; edge cases (apex, path-limited workers.dev) untested | low | patch: run-level test (fails on `c8c338d`) and assertions |
| A6 | BH | The rewrapped header comment was overlong and attached "for a custom domain" to the wrong clause | low | patch |
| A7 | BH | Spec 8's other-tab sentence sat under "Choices of the round's session, not part of the ruling" | low | patch: its own bullet, marked as ruling R3 |
| A8 | BH | This file's Checks and triage did not cover R4 | low | patch: this section and Checks |
| A9 | BH | `isWorkersDevTarget` repeats the URL parse and relies on `isWholeHostTarget` having parsed the value | low | reject: correct as written (the same string was just parsed successfully); a shared helper would touch two round 1 and round 2 functions for no behaviour change |
| A10 | BH | The README does not say that without `--url` only the workers.dev address is used | low | reject under R4 ("existing wording only; no new operator text"); no README sentence is untrue. For the orchestrator if a sentence is wanted |
| A11 | ECH | A non-array `targets` would throw at `.find` | false | for this change: the call and its `?? []` are unchanged from `c8c338d` (and round 2); `readDeployOutput` is outside this amendment |
| A12 | ECH | The frozen Intent does not mention the deploy default | n/a | reject: the frozen block is not edited; the amendment and its rulings are recorded under Implementation Notes, as the orchestrator directed |


## Leftover notes: orchestrator verdicts

Each "Claude, accepted on Kevin's instruction, 2026-11-25" (Kevin may overrule):
1. The session's choice that a code submit waits for a running sign-out ("Checking…" up to about 65 seconds): accepted.
2. Two untested paths, the page going away during the pre-send wait (the `!mounted.current` half of the early return) and the reload when the retried sign-out is confirmed after the page has gone: deferred to story 1.6 (dated update on its entry in `deferred-work.md`).
3. A2, the "no https:// address" line also printing when a custom `https://` target was reported: accepted as recorded; no new wording.
4. A3, any `.workers.dev` host qualifying: deferred to story 9.12, as recorded; no first-label rule.
5. A10, the README silent on the default: accepted; no README sentence.
6. The triage patches (T1 to T6, T9, T11 and the amendment's A1, A4 to A8) were tested but not reviewed by a layer: accepted.

## Draft replies (for the orchestrator to post after approval; not posted)

COMMIT stands for this round's commit hash, filled in when posting.

**Spec 8 line 214 (`4699620262`, a hidden session after a failed session read):**

> Agreed, fixed in COMMIT. When a correct code's 200 arrives without its body (time limit, or cut off) and the session read that settles it fails or throws, the page now ends that session with the same sign-out "Back to sign in" uses, and shows the same refusal on the code form. A read that answers signed in still opens the app, and one that answers signed out sends no sign-out. If that sign-out is not confirmed either, the next submit of either form tries it once more first; otherwise the session stays until a visibility check or a reload opens it, the residue already recorded for an unconfirmed sign-out. A code sent while the sign-out runs waits for its reply, so the reply cannot clear a newer session. A browser test with a real server (the body cut off, the read failing) failed on the previous commit, because no sign-out was sent, and passes now. A second test covers the unconfirmed case. The spec's dated round 4 note records the change.

**`AGENTS.md` line 16 (`4699620278`, the key in branches and commits):**

> Corrected in COMMIT: the sentence now says only that the key in the pull request title lets GitHub for Jira show the pull request on the story. Whether to also require the key in branch names and commit messages is the project owner's convention to decide, so no rule for that is added here.

**`deploy-cloudflare.mjs:161` thread (`4699638632`, the default depends on Wrangler's output format):**

> Agreed, fixed in COMMIT. Without `--url`, the command now asks only a reported whole-host `https://` target whose host is a workers.dev host (the parsed host, lower-cased, ends in `.workers.dev`). A target on any other host, a custom domain or a route, is never the default, whether or not Wrangler prints it with a scheme, so the default no longer depends on Wrangler's output format. With no workers.dev target the command stops and asks for `--url`, as before. `--url` is unchanged: a reported custom domain or `host/*` route is still accepted as the operator's explicit choice, with the trust the README states. A unit test (a scheme-prefixed route alone, a bare custom host alone, a workers.dev target listed after them, and a host that only contains "workers.dev") failed on the previous commit and passes now. The Worker identifying itself in the state reply remains the proper fix, recorded for story 9.12.
