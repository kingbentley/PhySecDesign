---
title: 'Pull request 13, CodeRabbit review round 3: story 1.5 (two-step verification)'
type: 'bugfix'
created: '2026-11-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/review-round-2.md', '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/decisions.md', '{project-root}/_bmad-output/specs/spec-story-1-5-two-step-verification/wording.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CodeRabbit reviewed `bfe03ea` (pull request 13, round 2's commit, pushed with its replies on Kevin's direct instruction in this session, 2026-11-25) and left new findings. These came in review `6057216063` (20 inline comments, and findings outside the diff in its body), review `6057232271` (its continuation: two more inline comments, no body findings), issue comment `7161805642` (findings that did not fit the review summary), and replies on two round 2 threads (`4694632812` on spec 8 line 204, `4694611985` on `deploy-cloudflare.mjs`). `bfe03ea` had also committed 81 files of the parked BMAD v7 install (`.agents/skills/bmad/`, `bmod-core-tools/`, `bmod-method/`) by mistake, through `git add -A`. Most of the findings are on those files. Kevin approved starting the round on 2026-11-25.

**Approach:** Take the BMAD v7 files out of the index without touching them on disk, and ignore agent and BMAD tooling. Answer their findings "not ours, removed from the branch". As in rounds 1 and 2: verify each project finding against the code, the decisions, the wording and the frozen blocks; fix what holds with a test that fails first; reject or defer the rest with evidence. Findings that touch a decision, a frozen block, the wording or the abandoned-second-step behaviour go to the orchestrator first. One new commit on `story/1.5` on top of `bfe03ea`, named paths staged only; not pushed; nothing posted on GitHub.

</frozen-after-approval>

## Implementation Notes

- **Workflow.** `bmad-build`, one-shot route, as rounds 1 and 2. This file is the round's spec and record.
- **The count: 68 findings.** 11 are on project code: 2 inline in review `6057216063`, 7 in its body outside the diff, and the 2 thread replies. 57 are on the BMAD v7 files: 18 inline (16 in review `6057216063`, 2 in `6057232271`), 21 in review `6057216063`'s body and 18 in issue comment `7161805642`. The issue comment holds BMAD findings only. Review `6057232271`'s body says only that the review continues from the previous batch. The Intent's "20 inline comments" counts both reviews' inline comments together (18 in `6057216063`, 2 in `6057232271`).
- **The BMAD v7 files.** `git rm -r --cached` on the three folders (81 files out of the index; 81 files, 719,066 bytes, still on disk before and after). On Kevin's instruction of 2026-11-25 ("We should only be pushing the bmad output folder"), relayed by the orchestrator, `.gitignore` now ignores `/.agents/`, `/.claude/` and `/skills-lock.json` whole, in place of the per-folder lines; `/_bmad/*` is kept and `_bmad-output/` stays tracked, as do the root `AGENTS.md` and `site-studio/AGENTS.md` (project instructions). `git ls-files` lists nothing under `.agents`, `.claude` or `_bmad/`. History is not rewritten: `bfe03ea` keeps the files, and this commit removes them from the branch.
- **Orchestrator rulings this round** (each "Claude, accepted on Kevin's instruction, 2026-11-25"; Kevin may overrule):
  - R1, reload while a second step is in flight: **reject.** A reload is not "Back". If the server accepted the code and the browser holds the session, the person at the keyboard typed the correct code, and opening their own account is the true state. Nobody else's sign-in is displaced, and that displacement was the harm behind round 2's ruling (a). Signing them out would burn a correct code (D-6) and add stored state for no protection. Spec 8's matrix row 59 ("reload on the second step → sign-in page") is read as applying while the sign-in is still pending; dated note in spec 8 outside its frozen block. If the reply had not arrived, the reload ends the request and round 2's residue applies (a session no browser holds, until it expires). This session saw no case where someone other than the code's owner gains anything. No code change.
  - R2, cross-tab with an unconfirmed sign-out: **defer (b)**, the residue added in plain words to the story 1.6 entry in `deferred-work.md`, with the `BroadcastChannel` option named.
  - R3, another Worker's narrower route serving the key-state path: **option (c): not changed in code; documented; the proper fix deferred.** The first ruling of the day was "(c) with an ordering change": without `--url` the address would be the workers.dev address, then a custom domain, then a whole-host route. It was built and committed (`81ba82e`, not pushed). The review layers then showed (T1, T5) that before this round the default was only ever the workers.dev address, so a deploy without one stopped and needed `--url`, and that the ordering made a custom domain or a `host/*` route the default with no opt-in. That extended exactly the trust finding 3 questions, and it rested on an unverified claim that only this Worker answers on a custom domain. The orchestrator withdrew the ordering the same day (amended ruling, Claude, accepted on Kevin's instruction, 2026-11-25): a finding about too much trust must not end by granting more of it. So: without `--url` the default is round 2's, the first `https://` target that names its whole host (in Wrangler 4.164's output only the workers.dev address), and `chooseAddress` is byte for byte round 2's. A deploy with no workers.dev address stops with the existing "no https:// address … Run again with --url" line, whose advice works again. `--url` is unchanged from round 2 (a reported custom domain or `host/*` route is accepted, as the operator's explicit choice). The README gains one sentence under `--url`: with it on a custom domain or a `host/*` route, the command trusts that no other Worker's route on that host covers `/api/v1/`, and the workers.dev address avoids the question. No claim is made that a custom domain is safe. The rest is deferred to the existing story 9.12 entry, which names option (b), the Worker identifying itself in the state reply, as the proper fix.
  - R4, a 200 refusal read as a sign-in: **fix as proposed.** A 200 whose body did not arrive (the client's time limit passed, or the body was cut off before its end; the second case added after review layer T2) is settled by a session read: signed in opens the app; signed out, or a failed read, shows the existing refusal. A complete body of the wrong shape stays a refusal. Existing wording only.
  - R5, Back's sign-out confirmed after unmount: **fix as proposed**, with a test.
  - The 57 BMAD findings: "not ours, removed from the branch"; no change to those files; one short reply.
- **Choices this session made that the findings and rulings did not settle:**
  - R4: the session read happens inside `createSecondStepRun`'s `send`, so it is part of the abandonable request: "Back to sign in" during the read discards its result (the read takes no signal; it has its own 5-second deadline) and the page signs out as on any abandon (round 2's ruling (a)); the page code is unchanged for this finding. The code form can therefore show "Checking…" for up to 35 seconds (30 for the request, 5 for the read). To tell a cut-off body from a complete one that is not JSON, `postJson` now reads the body as text and parses it, and reports `bodyUnreadable` (its other callers ignore the flag and see `body: null` as before). Residue: when the read fails while the browser holds the session, the page shows the refusal and does not end that session; a later visibility check or a reload opens it (the person did type a correct code). The "existing refusal" shown is `SIGN_IN_MESSAGES.other`, "Sign-in could not be completed. Try again.", on the code form. The code form has no "could not be checked" text of its own, and the app's "Sign-in cannot be checked" page is for the session read on opening.
  - R3: none left; the code of the withdrawn ordering (`defaultAddress`, its ranking by Wrangler's `(custom domain…)` marking, and its tests) was removed.
  - Row 4: the clock is read again after the sleep; `> deadline` returns null, so a request may still start exactly at the limit and a reply exactly at the limit can still settle.
  - Row 10: `killTree` takes `group` from its caller (the deploy passes it off Windows, where it starts `detached`); a non-group child that has exited (an exit code, or a signal code, review layer T8) is not signalled at all.
  - Row 11: the upper bound has no margin, unlike CodeRabbit's suggestion (`stepAt(now - 2000)`): the smoke test and the installation read one clock, and after a wait `nextCode` takes a code one step ahead about 50 ms into a step, which the margin would refuse on every retry (review layer T3).

## Findings

Project findings (11):

| # | File and line | Severity | CodeRabbit's title | Holds? Evidence | Verdict | What changed, or why not | Proving test |
|---|---|---|---|---|---|---|---|
| 1 | `src/admin/SignInPage.jsx:143` (inline) | Major | Handle reload while second-step verification is still pending | In part. A reload runs no unmount cleanup; if a success's headers had arrived, the new document reads the session and opens the account. But that account is the one whose correct code was typed. | reject (ruling R1) | Matrix row 59 read as applying while the sign-in is pending; dated note in spec 8. No code change. | none (no change) |
| 2 | spec 8 line 204, thread `4694632812` | (thread) | Cross-tab case with an unconfirmed sign-out | Yes, after two failures in a row (headers before the body, then an unconfirmed sign-out): a visible tab B can show B while its requests run as A. | defer (ruling R2) | Story 1.6 entry in `deferred-work.md` updated, `BroadcastChannel` option named. | none (deferred) |
| 3 | `scripts/deploy-cloudflare.mjs:161` (inline) | Major | Verify which Worker serves the key-state path before changing a key | In principle. It needs another Worker with a route covering `/api/v1/` on a host this deploy reaches through a reported `host/*` route (or, unverified, a custom domain); the workers.dev address is not affected. | documented, proper fix deferred (amended ruling R3) | Not changed in code: the default stays the workers.dev address, and `--url` stays as round 2 left it. README sentence under `--url`. Story 9.12 entry updated. A first ruling's address ordering was built, then withdrawn the same day (Implementation Notes). | none (no code change; `chooseAddress` is round 2's, and its round 2 tests stand) |
| 4 | `deploy-cloudflare.mjs:412`, thread `4694611985` | (thread) | A sleep that resumes late starts a request after the deadline | Yes. The pre-sleep check did not cover a late wake-up. | fix | The clock is read again after the sleep. | "starts no key-state request after the limit when a sleep ends late" (failed on `bfe03ea`); "still settles on a reply that arrives exactly at the limit" (guard, passes on both). |
| 5 | `src/admin/signInClient.js:181` (body) | Minor | Do not treat every HTTP 200 refusal as a successful sign-in | Yes; round 2's own choice. A 200 page without a cookie left the person on the code form with no message. | fix (ruling R4) | A 200 whose body did not arrive (time limit, or cut off) is settled by a session read inside the run; a complete body of the wrong shape stays a refusal, with no read. | `tests/signin-client.test.mjs`, "a 200 whose body misses the time limit is settled by the session (review round 3); an abandoned one is not" (failed on `bfe03ea`; also covers a cut-off body and a read that throws); "abandoned during the session read: the read's result is discarded and abandon answers true (review layer)". |
| 6 | `browser-tests/second-step.spec.mjs:555` (body) | Minor | Keep the two-account test within its timeout at a TOTP rollover | No. The file sets `test.describe.configure({ mode: "serial", timeout: 120_000 })` (line 30), so each test has 120 s, not the config's 30 s; two `nextCode` waits take at most about 60 s. | reject | None. (Sent to the orchestrator as "holds" before this was checked; corrected here.) | n/a |
| 7 | `browser-tests/second-step.spec.mjs:505` (body) | Minor | Wait for sign-out to complete before checking the session | Yes (test quality). A fixed 1 s sleep. | fix | Waits for the second-step request's `requestfailed` event and for the sign-out's reply (status 200) before reading the session. | The test itself, "In flight, Back while a correct code is being checked: …", passes in both projects; after the release it also waits for the held route's continue to be tried and two frames (review layer T7). |
| 8 | `browser-tests/second-step.spec.mjs:530-535` (body) | Minor | Hold A's cookie updates as well as its response body | Yes (test gap). `route.fetch()` uses the browser context's request client, which stores the reply's cookies in the browser at once. | fix | A's request is sent from a separate request context holding the browser's cookies of that moment. The test asserts A's code signed in on the server (200) and that the browser holds no session cookie before Back. | "In flight, finding 2's sequence: …": passes in both projects; on a build with `5653be9`'s three sign-in files (no abort) it fails in both projects (B's code 401), so it still shows the bug it guards. |
| 9 | `src/admin/SignInPage.jsx:258` (body) | Minor | Reload after a Back sign-out that completes once the app has opened | Yes. `endAbandonedSession` did not reload when the page had gone. | fix (ruling R5) | Reloads on a confirmed sign-out when the page is unmounted, as `endLeftSession` does. | Browser, "In flight, Back's sign-out confirmed after the app has opened (the visibility check found the stored session): the page reloads and shows the sign-in page" (passes in both projects; on a build with `bfe03ea`'s `SignInPage.jsx` it fails in both projects: no reload comes). |
| 10 | `deploy/acceptance/two-step.mjs:1442-1443` (body) | Minor | Signal a process group only for a child that owns one | Yes (off Windows). An exited tail's former id was signalled as a group. | fix | `killTree(child, { group })`: group signals only for the deploy off Windows; an exited non-group child is left alone; a live one gets SIGKILL itself. Deferred tail entry updated. | "killTree signals a process group only for a child that owns one (review round 3)" (failed on `bfe03ea`). |
| 11 | `deploy/selfhost/smoke.mjs:298` (body) | Minor | Bound the replay-check code above as well as below | Yes. A code ahead of the window is refused as out of window with the replay's refusal. | fix | An upper bound, `step <= stepAt(now) + TOTP_WINDOW`: CodeRabbit's, without its 2-second margin (Implementation Notes, row 11). | `tests/selfhost-smoke.test.mjs`, "does not count a code ahead of the window, …" (failed on `bfe03ea`; it also asserts that a code one step ahead counts 50 ms into a step). |

BMAD v7 findings (57): every one is on `.agents/skills/bmad/`, `.agents/skills/bmod-core-tools/` or `.agents/skills/bmod-method/` (scripts, their tests, help pages, migrations, `SKILL.md`). Verdict for all: **not ours, removed from the branch.** They are BMAD's installer files, committed by mistake in `bfe03ea`; this commit removes them from the branch and ignores the folder. No change was made to those files.

## Checks

Run in `site-studio/`, one at a time, after the last change (Node 24 on this workstation unless stated):
- `npm run typecheck`: clean.
- `npm test`: 354 of 354 pass. Under Node 22 (WSL, a copy without `node_modules`, `npm ci --ignore-scripts`, no credentials): 354 of 354 pass (Node 22.23.2).
- After the amended ruling R3 (the ordering and its three tests removed, the README sentence moved): `npm run typecheck` clean; `npm test` 351 of 351; under Node 22.23.2 (WSL, as above) 351 of 351. The other five checks below were run before that amendment; the orchestrator runs all seven on the amended commit.
- `npm run test:server`: 37 files, 516 of 516 pass.
- `npm run build`: passes.
- `npm run test:sites`: 4 of 4 pass.
- `npm run smoke:selfhost`: passes, ending "Self-hosted smoke test passed: the value saved on first start was read back after a restart." (whether the replay retry loop was entered is not shown: it prints nothing when it retries).
- `npm run test:browser` (build, then Playwright with `--output` in the session's scratch folder): 206 of 206 pass in one run, both projects.

An earlier run of the same list, after the review layers' first patches, stopped at `npm test`: it hung on `tests/post-json.test.mjs` (T20). The run above followed the fix.

Failing-first runs (each before its fix, as recorded in the rows):
- The deploy, acceptance, smoke and sign-in client unit tests ran against `bfe03ea`'s versions of their scripts: `git show bfe03ea:…` was written in place temporarily, then restored.
- The R5 browser test ran against a build with `bfe03ea`'s `SignInPage.jsx`, and finding 2's test against a build with `5653be9`'s three sign-in files. Each ran alone, in both projects. The files were then restored (checksums compared) and rebuilt.

The review layers' later patches (T2, T3, T6, T8) were tested on the new code only. No Wrangler or Cloudflare call was made. `sprint-status.yaml` was not changed.

## Review Triage Log

Three review layers on the round's diff (the working tree against `bfe03ea`, the `.agents` deletions left out, plus this file), each a fresh read-only subagent started with model `opus` and effort `high` (Kevin's explicit instruction, passed as each call's `model` and `effort`). Each reported running on Claude Opus 5.5. The Blind Hunter (BH) reported its reasoning effort as "low (15), as set by the caller", although the call set `high`; the Edge Case Hunter (ECH) and Verification Gap (VG) layers said they could not see theirs. BH reported 9 findings, ECH 11 points (3 of them "none"), VG 11 gaps. One row per root cause.

| # | Layers | Finding | Verdict | Route |
|---|---|---|---|---|
| T1 | BH | R3's ordering also widened the default: a route-only deploy read its `host/*` route without `--url`, extending the trust finding 3 questions to runs without `--url` | medium | led to the amended ruling: the ordering was withdrawn, and the default is round 2's again |
| T2 | ECH, VG | A 200 whose body is cut off part-way came back as a complete body (`body: null`) and became a refusal with no session read, while the browser may hold the session | medium | patch: `postJson` reads the body as text and reports `bodyUnreadable`; a cut-off 200 is settled by the session read like a timed-out one; unit test |
| T3 | ECH | The smoke check's upper bound with its 2 s margin refuses the code `nextCode` takes one step ahead just after a step begins, on every retry: the smoke test would fail three times after any wait | high | patch: no margin on the upper side (one clock); unit test asserts a one-step-ahead code counts 50 ms into a step |
| T4 | BH, ECH, VG | The session read is discarded, not aborted, on Back; the wait can reach 35 s; a throwing read rejected `send`; no test abandons during the read; a doc comment still said `send` resolves as `submitSecondStep` | low | patch: wording corrected (record, spec 8 note), the read wrapped (a throw counts as a failed read), a test abandons during the read, the doc comment rewritten |
| T5 | VG | "Only this Worker answers on a custom domain" had no evidence in the project | medium | led to the amended ruling: no claim is made that a custom domain is safe; the README sentence covers `--url` on a custom domain too |
| T6 | ECH | A custom domain reported `[production: disabled]` outranked a working route; a route with no path counted as whole-host by default | n/a | moot: the ordering was withdrawn (its patch and test removed with it) |
| T7 | BH, ECH | The abort test's assertions ran straight after `release()`, so a late effect of the released reply would not be seen | low | patch: waits for the held route's continue to be tried, then two frames |
| T8 | BH | `killTree` treated a child ended by a signal (`signalCode` set, `exitCode` null) as live | low | patch: either code counts as exited; unit assertion |
| T9 | BH | The custom-domain test used the same host for the route and the domain | n/a | moot: the test was removed with the ordering |
| T10 | ECH | In finding 2's test a throwing `isolated.fetch` hung the test until its timeout; whether a fulfilled reply's `Set-Cookie` is applied was not shown | low | patch: a fetch failure is recorded and fails the test at once. The `Set-Cookie` question is answered by the run on `5653be9`'s files: B's code got 401 there because the fulfilled reply's pending-cookie clear was applied, in both projects |
| T11 | VG | Under the ordering, the line "The deployment reported no https:// address. Run again with --url <https address>." came only when `--url` could not succeed either | n/a | moot under the amended ruling: with round 2's default the line comes when there is no workers.dev address, and `--url` on a reported custom domain or route then works; no new wording |
| T12 | BH, ECH | R5's reload loses anything typed in the app meanwhile; a reviewer link opened by a hash change also unmounts the page and is reloaded; an unconfirmed sign-out after unmount leaves the app signed in as the abandoned account with nothing retrying | low | recorded: the same rule and accepted cost as round 1's `endLeftSession` (a page that shows the truth over one that keeps typed text); the unconfirmed case is round 2's residue |
| T13 | ECH | With `>`, a request can still start at the deadline itself; its reply then lands after it and is discarded, so the wait can overrun by one request's own limit | n/a | reject: intended (row 4: a reply at the limit may still settle); the overrun is bounded by the request's 10 s limit, as before |
| T14 | BH | `send` inlines `postJson` and `secondStepOutcome` instead of calling `submitSecondStep`, and narrows its options | n/a | reject: `submitSecondStep` was exactly those two calls; the page passes no options |
| T15 | BH | Ignoring all of `/.claude/` and `/.agents/` also keeps future shared settings (for example `.claude/settings.json`) out unless forced | n/a | recorded: the owner's instruction of 2026-11-25; nothing under them is tracked |
| T16 | VG | Stale `--url` text in the script's header comment and the README heading; spec 6 said the old default was "the first `https://` target only" | low | patch: header comment, heading "`--url`.", spec 6 note rewritten |
| T17 | VG | Counts and labels in this record: 20 inline comments against 18; "F1"/"F5" labels; the summary reply counted row 3 as fixed | low | patch: note on the count, row numbers, summary reply (counts as amended) |
| T18 | VG | The owner's first name in `.gitignore` and in records | low | patch for `.gitignore` ("the owner's instruction"); the records keep the rulings' required form ("Claude, accepted on Kevin's instruction"), as in rounds 1 and 2; no surname or email anywhere; the draft replies name no one |
| T19 | BH | Checks and triage placeholders unfilled | low | filled (this section and Checks) |
| T20 | (this session's check run) | T2's first patch broke `tests/post-json.test.mjs`: the result always carried a `bodyUnreadable` key (two exact-shape tests failed), and the stalled-body test's stand-in reply had only `json()`, so `npm test` hung on it | high | patch: `bodyUnreadable: true` is added only when the body was cut off, so every other reply keeps its shape; the stand-in reply gets `text()`, as `postJson` now reads text; a new test, "a body cut off before its end is marked unreadable, …" |

## Draft replies (for the orchestrator to post after approval; not posted)

COMMIT stands for this round's commit hash, filled in when posting.

**`SignInPage.jsx:143` (reload while the second step is pending):**

> Not changed, by a recorded ruling. A reload is not "Back to sign in": if the server accepted the code and the browser holds its session, the person reloading is the one who typed the correct code, and opening their own account is the true state; no one else's sign-in is displaced, which was the harm the abort and sign-out of round 2 guard against. Signing them out would burn a correct code. The spec's "reload on the second step → sign-in page" is read as applying while the sign-in is still pending; a dated note records this outside the spec's frozen block. If the reply had not arrived, the reload ends the request, and the recorded residue applies: the server keeps a session no browser holds, until it expires.

**spec 8 line 204 thread (cross-tab with an unconfirmed sign-out):**

> Agreed that it remains, and recorded rather than fixed in this pull request (`deferred-work.md`, the story 1.6 entry, in COMMIT): it needs two failures in a row, a success's headers arriving before its body and then a sign-out that is not confirmed. In that case a visible tab B keeps showing B while its requests run as A, until it is hidden and shown again. The option noted there is for the page to post on a `BroadcastChannel` after abandoning a second step so other tabs run their visibility check at once; that would show A in tab B openly rather than mixed, so it narrows the window without removing the residue.

**`deploy-cloudflare.mjs:161` (which Worker serves the key-state path):**

> Not changed in code; documented in COMMIT; the proper fix recorded. Without `--url` the command reads the state only from the workers.dev address, as before; a deploy without one stops and asks for `--url`. With `--url` on a custom domain or a `host/*` route, which the operator chooses explicitly, the README now says that the command trusts that no other Worker's route on that host covers `/api/v1/`, and that the workers.dev address avoids the question. Refusing such addresses outright would break legitimate installations to guard against the operator's own zone sending that path to another Worker, so it is not done. The proper fix, the Worker identifying itself in the state reply, needs server and configuration changes and is recorded for the story that next deploys and then talks to an installation (story 9.12).

**`deploy-cloudflare.mjs:412` thread (a sleep that resumes late):**

> Fixed in COMMIT. The clock is read again after the sleep, so no request starts after the limit; a reply arriving exactly at the limit can still settle. A fake-clock test where every sleep ends 20 s late failed on the previous commit and passes now.

**Outside-diff findings in the review body (project files):**

> All seven checked. Fixed in COMMIT:
> - `signInClient.js:181`: a 200 whose body did not arrive (the time limit passed, or it was cut off) is now settled by a session read inside the same abandonable request. Signed in opens the app; signed out, or a failed read, shows the existing refusal. A complete body of the wrong shape stays a refusal, with no read.
> - `SignInPage.jsx:258`: a sign-out from "Back to sign in" that is confirmed after the page has gone now reloads it, with a browser test.
> - `two-step.mjs:1442`: only a child started as its own process group is signalled as one; an exited tail is left alone.
> - `smoke.mjs:298`: an upper bound, without the 2-second margin, because the smoke test and the installation share one clock and the margin would refuse the code taken just after a step begins.
> - `second-step.spec.mjs:505`: the test now waits for the abort and the sign-out's reply instead of sleeping.
> - `second-step.spec.mjs:530`: A's request now goes through a separate request context, and the test asserts the browser holds no session cookie before Back.
>
> Not changed: `second-step.spec.mjs:555`. This file sets a 120-second timeout for each of its tests (`test.describe.configure` at the top), so two `nextCode` waits, at most about a minute together, fit.

**Findings on `.agents/skills/bmad/`, `.agents/skills/bmod-core-tools/` and `.agents/skills/bmod-method/` (one reply, on the review):**

> These files are BMAD's own installer files, committed to this branch by mistake. COMMIT removes them from the branch and ignores those folders, so these findings are not this project's code and no change is made to the files.

**Summary reply to the review (all findings):**

> Thanks. All 68 findings were checked; the record is in `_bmad-output/specs/spec-story-1-5-two-step-verification/review-round-3.md`. 57 are on BMAD's installer files, committed by mistake and removed from the branch in COMMIT. Of the 11 on this project's code:
> - Seven are fixed in COMMIT, each code change with a test that failed on the previous commit (the two test-only changes excepted): the late wake-up in the settle wait, the 200 settled by a session read, the reload after a late sign-out, the process group, the smoke code's upper bound, and two browser tests made to wait for events and to keep A's cookies out of the browser.
> - One is documented and deferred: the narrower-route question (a README sentence under `--url`), with the proper fix recorded for story 9.12.
> - One is rejected with evidence: the test timeout is 120 s in that file.
> - The reload while a second step is pending is not changed, by a recorded ruling.
> - The cross-tab residue is recorded for story 1.6.
