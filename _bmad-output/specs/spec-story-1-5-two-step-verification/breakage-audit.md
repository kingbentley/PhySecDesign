# Story 1.5: deliberate-breakage audit

Part B of story 1.5's follow-up before its pull request, 2026-11-23. Each "Deliberate breakage" recorded in specs 1 to 8 was made again on the tip after the follow-up's Part A (commit `a00745c`), the named test run (browser tests after `npm run build`), the failure compared with the record, the change reverted, and `git status` checked clean (only the untracked `.claude/` and `Site Studio UX screens.pdf`) before the next. Commands were run one at a time in `site-studio/`; Playwright's output went to the session's scratch folder, one folder per run. After the last revert the app was rebuilt, and no `test-results` or `playwright-report` folder is in the repository.

"Failed as recorded" is yes only when the recorded test failed at the recorded assertion or for the recorded reason. Where a record gives the breakage's intent but not the exact edit, the edit was made from the record's words; the note says so.

## Results

| Spec | Breakage | Test run | Failed as recorded | Note |
|---|---|---|---|---|
| 1 | The window accepts step +2 (`candidateSteps` loop bound raised by one, `server/auth/totp.ts`) | `server-tests/two-step-rules.test.ts` | yes | "TOTP › accepts the codes of steps −1, 0 and +1 around now and refuses −2 and +2": four steps received, three expected. |
| 1 | `encrypt` stores a second fingerprint instead of refusing (`commit` updates the row) | `server-tests/deployment-key.test.ts` | yes | "deployment-key guard › refuses the second of two first encryptions under different keys": refusal `ok`, not `deployment_key_mismatch`. |
| 2 | Counts cleared after a correct password with a wrong fresh-codes code | `server-tests/two-step-store.test.ts` | yes | Made from the record's words: a separately committed `clearCounts` straight after `consumeTicket` when the outcome is success. The named test and the two recorded "also failed" tests failed (email count 0, not 1 or 2). One more failed: "a key refused at the completion (D-15) › answers deployment_key_mismatch from startTwoStep and renewRecoveryCodes after the ticket is consumed, leaving the counts raised", which checks the same counts. |
| 2 | Confirm accepts an earlier set-up's identifier (both identifier comparisons removed in `confirmTwoStep`) | `server-tests/two-step-store.test.ts` | yes | "starting and confirming a set-up (D-10) › replaces an earlier set-up when started again, and refuses the earlier identifier two_step_setup_expired (finding 5)". |
| 3 | The pending row not deleted when a wait begins | `server-tests/second-step-store.test.ts` | yes | Made by removing the delete where a wrong code starts the wait. Both recorded tests failed (a pending row left, 1 not 0). |
| 3 | The last accepted step read before the synchronous step | `server-tests/second-step-store.test.ts` | yes | "sign in exactly once with one code when both have decrypted before either decides, …": two sign-ins, one expected. |
| 4 | The handler passes `DEPLOYMENT_KEY` through when it is null | `server-tests/two-step-routes.test.ts` | yes | Made in `deploymentKeyInput` (`server/api/handlers.ts`). The named test and its "empty" twin failed (`deploymentKey` present in the object call); so did the two second-step twins ("with DEPLOYMENT_KEY null/empty after turning on, …"), which the record does not name. |
| 4 | The second-step route not `appOriginOnly` (`shared/routes.ts`) | `signin-declarations.test.ts`, `second-step-routes.test.ts`, `two-step-routes.test.ts` | yes | 8 failed, as recorded: 3 in the declarations file, the declaration test and the three origin tests in second-step-routes, the origin test in two-step-routes. The declarations file ran first alone (a script error passed only one file); the other two were run next with the breakage still made. |
| 5 | The binding written as `text = ""` instead of `fromEnvironment` (`deploy/selfhost/config.capnp`) | `server-tests/host-config.test.ts`, then build and `npm run smoke:selfhost` | yes | The host-config test failed; the smoke suite failed in the first start with the recorded message ("… answered 200 with fingerprint none and key none, not none and present."). |
| 5 | The no-variable run on the first storage (`smoke.mjs`'s third run given `storage`, not `bareStorage`) | build and `npm run smoke:selfhost` | yes | Made from the record's words. The recorded message: "Without a deployment key on empty storage: … answered 200 with fingerprint stored and key none, not none and none." workerd's log events listed only `deployment_key_missing`; the record also names the guard's line for a stored fingerprint and no key. No smoke storage folder was left behind. |
| 6 | The key printed after the put | `npm test` | yes | The three recorded tests failed; one more failed, "Wrangler closing with a non-zero code: …", which the record does not name. 227 pass, 4 fail. |
| 6 | The key printed twice | `npm test` | yes | The five recorded tests failed, plus "Wrangler closing with a non-zero code: …". 225 pass, 6 fail. |
| 6 | The command deletes a key it did not put in this run (`deleteSecret` on rule 3's mismatch path) | `npm test` | yes | The two recorded tests failed, plus "Settle in rule 3: …" (it asserts no delete). 228 pass, 3 fail. |
| 6 | The delete follows the first `mismatch` reply (settled on the first qualifying reply) | `npm test` | yes | The 10 recorded tests failed: the five "Settle: …" rows, "Settle in rule 3: …", "Stored, supplied, matches, through main's key-state builder: …" and the three `waitForSettledKeyState` tests. |
| 7 | Codes still shown after reopening My account (kept in a module-level variable, listed in the overview) | `two-step.spec.mjs`, chromium | yes | "Turn on, …" failed at its codes-once check (`two-step-codes` count 1, not 0, line 471). |
| 7 | The QR missing (not rendered) | `two-step.spec.mjs`, chromium | yes | Same test, at `await expect(qr).toBeVisible()` (line 370). |
| 7 | The QR drawn from a different string (`digits=6` changed to `digits=8`) | `two-step.spec.mjs`, chromium | yes | Same test: "the QR code decodes to the start reply's URI". |
| 7 | Download writing no codes (an empty list passed to the file) | `two-step.spec.mjs`, chromium | yes | Same test: "the file holds each code". |
| 7 | The offer not shown after accepting (`location.replace('/')` straight away) | `two-step.spec.mjs`, chromium | yes | "Offer, Skip: …" failed at the offer's heading (line 805). |
| 7 | The secret written to `sessionStorage` | `two-step.spec.mjs`, chromium | yes | "Fresh codes and Leak: …" failed: "a stored value holds a secret". |
| 8 | The code field without `autocomplete="one-time-code"` | `second-step.spec.mjs`, chromium and webkit-iphone | yes | "Password, two-step on, Code, Phone attributes, axe (code mode): …" failed at its `autocomplete` assertion in both projects. |
| 8 | A reused recovery code accepted (the page treats a refused recovery code as signed in, calling `onSignedIn`; no reply mocked) | `second-step.spec.mjs`, chromium | yes | "Recovery code, Recovery code reused, axe (recovery mode): …": the refusal's alert was not shown. |
| 8 | The page staying on the second step after `second_step_expired` (narrowed to the expired reply alone) | `second-step.spec.mjs`, chromium | yes | Made in `signInClient.js` (the expired reply mapped to a refusal shown in place). "Expired: …" failed at the sign-in heading (line 288). |

## Totals

23 breakages over specs 1 to 8, 24 runs (spec 8's first in both projects). All 23 failed the suite as recorded. None could not be made, and none passed.

Differences from the records, none a finding: five breakages also failed tests the record does not name (spec 2's first, spec 4's first, spec 6's first three); spec 5's second listed one workerd log event where the record names two. Four breakages were made from the records' words, which give no exact edit, so the place of the edit was chosen here: spec 2's first, spec 3's first, spec 4's first and spec 5's second (each row says how).

Spec 9's breakages are against fakes before a deployed run on Cloudflare and were out of this audit's scope.
