# Review of the story 1.5 spec: Two-step verification

- **Reviewed:** `SPEC.md`, `decisions.md` (D-1 to D-22), `wording.md`, `acceptance-trace.md`, `brownfield.md`, `stories.yaml`, `.memlog.md` and the eight files under `stories/`, as they stand untracked on `story/1.5` at `1dd821e`.
- **Workflow:** `bmad-review` with three lenses: adversarial (ADV), edge cases (EDGE) and verification gaps (VER). One reviewer ran them one after another, without subagents, so the lenses are not independent of each other.
- **Checked against:**
  - story 1.5 in `epics.md` (lines 326–368), its 28 criteria, standing rules 1–15 and the definition of done (lines 131–151);
  - choices CA-11 to CA-15, CA-46, CA-47, CA-52 and CA-55 in `draft-0.7-working/choicesA.md`;
  - AD-12, AD-17, AD-21 and AD-22 in `architecture.md`, and `cloudflare-limits.md`;
  - UX S-26, S-27 and S-29 (sections 17.2 and 17.3) and decision D14;
  - `deferred-work.md` entries that name story 1.5;
  - the code in `site-studio/` at `1dd821e` (files listed at the end).
- **Severities:** high (fix before building), medium (fix in the spec before the spec file it names is built), low (fix when convenient, or note).
- No password, key, code, cookie value or token appears in this file.

Several proposed changes fall inside `<frozen-after-approval>` blocks. The spec files are still drafts, so they can be changed now, but Kevin should see each change that alters a decision.

## Summary

| Severity | Count | Findings |
|---|---|---|
| High | 2 | 1–2 |
| Medium | 18 | 3–20 |
| Low | 21 | 21–41 |

**What holds up.** The counting design of D-4 and D-5 is sound. With story 1.3's constants (`shared/signin.ts`: 5 free failures, a 1-minute wait that doubles, counts cleared 15 minutes after a wait ends), an attacker who has the password but no marker gets 4 code guesses from a clear count. After that, every new password attempt raises the email count into a wait before the second step can use it, so no further guess is possible until the count clears (about 16 minutes). That is roughly 15 guesses an hour against 3 valid codes in 10^6, about 0.1% a day. The owner's marker keeps the owner out of that wait. A signed-in session cannot learn anything from codes without the password, because the password is checked first and a wrong one consumes the ticket. I found no existing log or error path that records an operation's input: `ObjectBase.fetch` returns refusals with a field name only and rethrows other errors, `server/index.ts` logs only `error.message`, `parseOperationInput` turns zod failures into `invalid_input` with a field, and `callObject`'s own error names only the operation.

---

## High

### 1. A generated key can be lost: it is printed only after a successful `secret put` (ADV, EDGE)

- **Lens:** adversarial, edge cases.
- **Where:** spec 5, "Always" bullets 4 and 5; D-17; `scripts/deploy-cloudflare.mjs:141-149` (the pattern being copied).
- **Evidence:**
  - Spec 5 puts the key, then prints it. The existing set-up-code flow does the same: `await putSecret(...)` at line 142, then the code is printed at line 145. If `putSecret` throws, `main` prints only `Deploy failed: wrangler secret exited with N.` (line 232) and the value is gone.
  - That is harmless for a set-up code, because the next deploy issues a new one. It is not harmless for the deployment key. A `wrangler secret put` that fails after Cloudflare stored the value (a dropped connection, a killed terminal, a timeout) leaves a key in the Worker that nobody has ever seen. The next run lists the secret, prints "The Worker already has a deployment key, so none was generated", and AD-21's "shown once at creation so that it can be kept outside the Cloudflare account" is broken for good. Stories 8.7 and 8.8 (recovery with the key) then cannot work for that installation.
- **Recommended change:** in spec 5 and D-17:
  - Print the generated key and the keep-a-copy text **before** the put.
  - If the put fails, exit 1 with a new `wording.md` line: "The key above may or may not have been stored. Keep it, and run the command again with it in SITE_SURVEY_DEPLOYMENT_KEY."
  - Add matrix rows: "put fails after generating" (key printed once, exit 1) and "rerun with that key supplied while the list now holds it" ("not used" line, exit 0).

### 2. The "stored, no key" stop refuses the very rerun its message asks for (ADV)

- **Lens:** adversarial.
- **Where:** spec 5, "Always" bullet 5 ("a key state of `stored` while the Worker has no key stops the command") and the matrix row "Encrypted values, no key"; `wording.md`, deploy line "Encrypted values but no key"; D-18.
- **Evidence:**
  - `wording.md` tells the operator: "Supply the original key in SITE_SURVEY_DEPLOYMENT_KEY and run the command again."
  - Spec 5 stops whenever the list lacks the key and the state is `stored`, whatever is supplied. The matrix has no row with a supplied key in that state. A builder who follows the text literally stops the rerun too, so an installation rolled back to a version without the secret (the AD-21 case D-18 was written for) can never get its key back through the command.
- **Recommended change:**
  - Spec 5: "When the list lacks `DEPLOYMENT_KEY` and the state is `stored`, a supplied key is put (the operator's claim that it is the original). Without one, the command stops."
  - Add the matrix row "list lacks it; state `stored`; valid supplied key → put, 'supplied' line".
  - Optionally (see finding 10), have the key-state route tell the command afterwards whether the Worker's key now matches the stored fingerprint, so a wrong original is caught at once rather than at the next sign-in.

## Medium

### 3. A wrong code that starts the wait answers "code wrong", and the next one answers "expired"; spec 7 expects the wait message (ADV)

- **Lens:** adversarial.
- **Where:** spec 3, step 4 of `secondStep` and the matrix row "Wrong codes" ("`second_step_code_wrong`, then `second_step_expired`"); spec 7, matrix row "Wrong codes to the wait" ("password form with the wait | `signin_wait`"); D-4.
- **Evidence:**
  - Spec 3 deletes the pending row when a wrong code starts a wait, but still answers `second_step_code_wrong`.
  - The next submission finds no row. Step 1 runs before the wait check of step 2, so the answer is `second_step_expired`, and the page shows "This sign-in has expired. Sign in again with your email and password." The person is never told to wait.
  - They then retype the password and get `signin_wait`. Spec 7's browser test cannot pass as written.
- **Recommended change:** in spec 3 step 4: "If the counts now impose a wait, delete the pending row and answer `signin_wait` with its seconds (the pending cookie is cleared by the route, spec 4)." Change spec 3's matrix row to "the fourth answers `signin_wait` and deletes the pending row". D-4 already says the token is "discarded in the step where a wait begins"; this makes the reply match it.

### 4. The second step has no address in its input, so the address count and wait cannot apply (ADV)

- **Lens:** adversarial.
- **Where:** spec 3, `secondStep({ cookies, method, code, deploymentKey? })`, steps 2 and 4; `signin_pending` columns; D-4; CAP-6.
- **Evidence:**
  - Step 2 checks "the known address's" wait, and step 4 adds "a new address row for a known address".
  - The input carries no address, and the pending row stores only the password attempt's address failure row id (`address_failure_id` in `signin_tickets`, `signInStore.ts:122`). That row may already have been pruned, and on success it is deleted.
  - `attempt` takes `address` explicitly (`signInStore.ts:370`), and `clientAddressKey(context.request)` is what the handler passes (`handlers.ts:190`).
- **Recommended change:**
  - Add `address` (the request's `clientAddressKey`) to `secondStep`'s input in spec 3 and to the handler in spec 4. Count and check it exactly as `attempt` does, `UNKNOWN_ADDRESS` included.
  - Add a matrix row: "known address at its threshold: second step refused `signin_wait`, pending deleted".

### 5. "Replaced by starting again" cannot be told apart from a wrong code (ADV, EDGE)

- **Lens:** adversarial, edge cases (two tabs).
- **Where:** CAP-1 ("a set-up … replaced by starting again, is refused `two_step_setup_expired`"); spec 2, `confirmTwoStep` and the matrix row "Start again"; D-10; spec 6, matrix row "Set-up expired".
- **Evidence:**
  - `confirmTwoStep({ cookies, code })` has only the code. When tab B restarts set-up, tab A's code, made from A's secret, is compared with B's secret and answered `two_step_code_wrong` ("Check that the app shows this installation and try the newest code"). That misleads the person: their app is right and the set-up was replaced.
  - Spec 2's matrix says only "the earlier secret's codes do not confirm", without the refusal.
- **Recommended change:**
  - `startTwoStep` stores and answers a random set-up identifier (not secret). `twoStepConfirm`'s input becomes `{ setupId, code }`.
  - When the identifier is not the live row's, answer `two_step_setup_expired`. Spec 2's matrix row then names that refusal, and spec 4's reply schema gains `setupId`.

### 6. Self-hosted, an unset `DEPLOYMENT_KEY` is `null`, not absent (EDGE)

- **Lens:** edge cases.
- **Where:** D-16; spec 4, "Always" bullet on `Env.DEPLOYMENT_KEY`; spec 2 ("the deployment key in their input, optional, bounded to 64 characters"); `brownfield.md` row "Self-hosted runs before story 2.23".
- **Evidence:**
  - `node_modules/workerd/workerd.capnp:757-761` says of `fromEnvironment`: "If the environment variable isn't set, the binding value is `null`."
  - `JSON.stringify` keeps `null`, so a schema with `.optional()` refuses the operation `invalid_input`. Every two-step operation then fails on a self-hosted installation started without the variable, instead of answering `no_key` and `deployment_key_missing`, and My account shows "could not be loaded".
- **Recommended change:**
  - Type `DEPLOYMENT_KEY?: string | null` in `Env`.
  - The handler passes the key only when it is a non-empty string (`typeof key === "string" && key !== ""`), and otherwise omits the field.
  - Spec 4's smoke check "a run with no variable finds `deployment_key_missing`" stays and proves it. Add a route test with `DEPLOYMENT_KEY: null` in the env passed to `handleRequest`.

### 7. The page has no email for the download file and the entry-name line (ADV)

- **Lens:** adversarial.
- **Where:** `wording.md` (step 2 "The entry will be named ‹installation name›:‹email›", the download file's "Account: ‹email›"); spec 4, replies of `twoStepStart` (`{ secret, otpauthUri }`), `twoStepConfirm` and `twoStepRecoveryCodes` (`{ recoveryCodes }`), `twoStepState`; spec 2, `startTwoStep` ("answers … the installation's name and the email").
- **Evidence:**
  - The session reply (`handlers.ts:160-169`) carries name, account id, role and installation name, with no email.
  - Fresh codes have no `otpauthUri` to read an email from, and spec 4's start reply drops the two fields spec 2's operation answers.
  - A builder must invent a source or leave the line blank.
- **Recommended change:** spec 4: `twoStepStart` answers `{ setupId, secret, otpauthUri, installationName, email }`, and `twoStepState` gains `email` (the signed-in person's own, so it reveals nothing). Spec 6 takes both from there. The reply sweep of CAP-9 is unaffected.

### 8. Nothing tests that the QR code encodes the right URI (VER)

- **Lens:** verification gaps.
- **Where:** D-8; spec 6, matrix row "Turn on" and its deliberate breakages ("the QR or key missing"); CAP-14 ("The tests compute codes with their own RFC 6238 implementation").
- **Evidence:**
  - Every browser test computes codes "from the key the page shows", which is the text key. A QR code drawn from the wrong string, a truncated URI, or modules drawn transposed would pass the whole suite. Criterion 1 ("scanning a code") is then met only by the text path.
  - The deliberate breakage checks only that the QR is present.
- **Recommended change:** add to spec 6 either:
  - (a) a dev-only QR decoder (for example `jsqr`, Ask First as SPEC.md requires for dependencies) in the browser test, which rasterises the SVG and asserts the decoded text equals the start reply's `otpauthUri`; or
  - (b) a server-side test in `two-step-page-text.test.ts` that feeds a fixed URI to the encoder and compares its module matrix with one recorded from an independent encoder.

  Add a deliberate breakage "QR drawn from a different string".

### 9. The concurrency test for single use can pass without testing the last-step rule (VER, EDGE)

- **Lens:** verification gaps, edge cases.
- **Where:** spec 3, matrix row "Two at once" ("`second_step_code_wrong` or `second_step_expired`"); AC 2 of spec 3; acceptance trace row 6 ("3 (S: once, concurrency)").
- **Evidence:**
  - Two requests that carry the same pending cookie race on the pending row, not on the code. One deletes the row, the other gets `second_step_expired`, and the last-accepted-step check never runs.
  - The row as written accepts that outcome.
  - No row covers two recovery-code sign-ins at once with one code, although the trace says spec 3 supplies it.
- **Recommended change:**
  - Make the row: "two pending sign-ins (two browsers, two pending tokens) send the same code with `Promise.all`: exactly one session; the other `second_step_code_wrong`, counted".
  - Add the same for one recovery code ("the other `second_step_recovery_code_wrong`; the code's row deleted once").
  - State in spec 3 that the sync step uses `DELETE … RETURNING` on the recovery code and re-reads `last accepted step` inside the step.

### 10. Two deploys at once can each generate a key; the printed one may not be the Worker's (EDGE, ADV)

- **Lens:** edge cases (a second deploy racing the first), adversarial.
- **Where:** D-17; spec 5, "Always" bullet 3; `wording.md`.
- **Evidence:**
  - List, then state, then put is check-then-act. Two runs on a new Worker (a slow first run restarted from another terminal, or a GitHub workflow alongside a manual run in Epic 9) both see no key, both generate one, and the second `secret put` silently replaces the first.
  - The first run's operator keeps a copy that never matches. Nothing is encrypted yet, so the installation works, and the mismatch surfaces only at recovery.
- **Recommended change:**
  - At minimum, add to spec 5 and the deploy wording: "Run one deploy at a time for a Worker". Record the race in `deferred-work.md` for Epic 9's workflow.
  - Better: after the put, the command asks the key-state route, and the route also reports the Worker key's fingerprint (`{ fingerprint: "none" | "stored", workerKey: "<64 hex>" | null }`). HKDF output reveals nothing about the key. The command compares it with its own key's fingerprint and, if they differ, says that another deploy replaced the key and prints nothing further. That also closes finding 2's "wrong original" case. If Kevin prefers the route to stay minimal, keep the warning only.

### 11. `askKeyState` has no retry, no timeout and no line for "unreadable" (EDGE)

- **Lens:** edge cases.
- **Where:** spec 5, "Always" bullet 5 ("a state that cannot be read (null) stops the command like a failed listing … with `wording.md`'s lines"); `wording.md`, deploy lines; `deploy-cloudflare.mjs:93-113` (`waitForSetupState`).
- **Evidence:**
  - A Worker deployed for the first time "can take a while to become reachable" (line 91), and for about a minute some copies still run the earlier code (line 43), which answers 404 for a route it does not have.
  - The set-up state is polled for up to 120 s. The key state, as specified, is asked once, and null stops the command after the deploy, with the "secrets could not be listed" line, which is untrue in this case.
- **Recommended change:**
  - Spec 5: `askKeyState` polls like `waitForSetupState` (same timeout and retry constants, a 200 reply parsed exactly as `{ fingerprint: "none" | "stored" }`, anything else retried).
  - `wording.md` gains: "‹address›/api/v1/deployment-key/state did not say whether this installation holds encrypted values, so no deployment key was generated or supplied. Run the command again."
  - Add a matrix row with a 404 then 200 sequence.

### 12. Spec 8's check 7 cannot measure what it names, and D-19 promises a check spec 8 does not make (VER)

- **Lens:** verification gaps.
- **Where:** spec 8, check 7; D-19 ("whether a running object sees a key put after it started"); D-22's reason, which cites `cloudflare-limits.md`.
- **Evidence:**
  - Check 7 times "how long after check 1's deploy command ends the two-step state read first answers `available`". That read needs a signed-in session (spec 4: `readsSessionCookie`; spec 2: `not_signed_in`), and there is no account until check 2.
  - The deploy command puts `DEPLOYMENT_KEY` before `SETUP_CODE`. Each put deploys a new version that carries the earlier secrets, so any copy that accepts the set-up code already has the key. The lag cannot be observed this way.
  - Under D-22 the object never reads its own `env`, so "whether a running object sees a key put after it started" is not exercised at all.
  - `cloudflare-limits.md` line 18 covers code updates only. It says nothing about bindings or secrets, so D-22's "by every sign, the bindings it started with" and "a new Worker version takes a secret within about a second" are not recorded there.
- **Recommended change:**
  - Drop the timing from check 7, or replace it with something measurable. For example: on 15b after its deploy, poll the public key-state route and record when it first answers 200. Keep the "platform error for HKDF or AES-GCM" observation.
  - Reword D-19 to drop the running-object claim.
  - Reword D-22's reason as an assumption: "not recorded in `cloudflare-limits.md`; D-22 removes the dependence".

### 13. Spec 8 does not pin the account, the Worker names' absence, the deletion command or what `wrangler tail` may carry (ADV)

- **Lens:** adversarial (running safely and cleaning up).
- **Where:** spec 8, "Always" and "Ask First"; check 7's `wrangler tail`.
- **Evidence:**
  - Nothing checks that Wrangler is signed in to the "PhySec Site Studio" account before the first deploy. The workstation's Wrangler login is shared with other work.
  - Nothing checks that `site-studio-test-15a` and `-15b` do not already exist. A leftover 15a from a failed run already holds a key, so check 1 would fail, or worse, pass on stale state.
  - "Deleted at the end" names no command.
  - `wrangler tail` streams each request's details. Whether it redacts `Cookie` headers is not stated anywhere in the spec. The spec says "outcomes only" but not how raw tail output is kept off the screen and out of files.
- **Recommended change:** add to spec 8:
  1. Before the first deploy, run `wrangler whoami` and stop unless the account named is "PhySec Site Studio". Pass that account's id as `CLOUDFLARE_ACCOUNT_ID` to every Wrangler call.
  2. Run `wrangler secret list --name <w>` for both names and stop unless both answer "not found".
  3. Delete with `wrangler delete --name <w> --force` in a `finally`, then check that both are gone.
  4. Read tail as `--format json` into memory only, keep event outcome and exception names, and never print or write raw events.
  5. The administrator's password is generated by the script and kept only in memory.

### 14. The offer, and turning on, are reachable when two-step verification cannot be turned on; the password is counted before the key is checked (EDGE)

- **Lens:** edge cases.
- **Where:** spec 6, offer bullet and matrix row "Offer"; D-11; spec 2, `accountCheck` (refuses before counting only `two_step_already_on` and `two_step_off`).
- **Evidence:**
  - With `no_key` (a self-hosted install before story 2.23 without the variable) or `key_mismatch`, the offer still says "Turn on two-step verification now?".
  - The person types their password. `accountCheck` counts it, the hash runs, and only then does `startTwoStep` refuse `deployment_key_missing` or `deployment_key_mismatch`. A person who retries a few times walks themselves into `signin_wait`.
- **Recommended change:**
  - Spec 2: `accountCheck` for `turn_on` and `fresh_codes` refuses `deployment_key_missing` or `deployment_key_mismatch` before counting, and takes the key in its input.
  - Spec 6: after a successful accept, read `GET /api/v1/account/two-step`. Show the offer only when `availability` is `available`; otherwise (and when the read fails) load `/`.
  - Add a matrix row "offer with `no_key`: app opens".

### 15. The browser-test helpers would be imported from a spec file (ADV)

- **Lens:** adversarial (buildable in order).
- **Where:** spec 7, Code Map ("`browser-tests/signin.spec.mjs`, `two-step.spec.mjs` -- helpers") and header ("spec 6's browser-test helpers … are reused"); spec 6, "codes computed by an RFC 6238 helper in the test file".
- **Evidence:** Playwright registers the tests of any `*.spec.mjs` file that is imported, so importing spec 6's helper from `two-step.spec.mjs` into `second-step.spec.mjs` runs spec 6's tests twice (or fails on duplicate titles).
- **Recommended change:**
  - Spec 6 owns a new `browser-tests/two-step-helpers.mjs` with the RFC 6238 helper, "turn on through the API", "wait for the next step" and "sign in with a recovery code".
  - Both spec files import it. Spec 7's Code Map names that module, not a spec file.

### 16. "The secret reaches no other server, storage or log" has no test on the page side (VER)

- **Lens:** verification gaps.
- **Where:** CAP-1 bullet 2; spec 6, the `TwoStepSetup` bullet ("never in storage, the address bar or a log"); SPEC "Never" ("Send the authenticator secret or its QR code to any server other than the installation, or keep it in browser storage or the address bar").
- **Evidence:** spec 6's matrix and breakages test the QR's presence, the codes' one-time display and Download, but nothing would fail if the encoder fetched a script, the page put the URI in `sessionStorage`, or the URL gained a fragment.
- **Recommended change:** spec 6 adds a browser test over set-up and fresh codes. It records every request (`page.on('request')`) and asserts each is same-origin `/api/v1/…` or the app's own assets. It asserts that `localStorage` and `sessionStorage` hold neither the key nor any code, that `location.href` is unchanged, and that no console message contains them. Add the matching deliberate breakage ("secret written to `sessionStorage`").

### 17. The SPEC forbids writing a key to any file, while the browser servers get one in `.dev.vars` (ADV)

- **Lens:** adversarial (contradiction).
- **Where:** SPEC "Never" bullet 1 ("Write a … deployment key … into any file"); SPEC Assumptions ("a per-run `DEPLOYMENT_KEY` in their mode-600 `.dev.vars`"); spec 6 (`serve.mjs`, `playwright.config.mjs`); `browser-tests/serve.mjs:34-35`.
- **Evidence:**
  - Both are stated as rules. A builder following "Never" cannot follow spec 6.
  - On this Windows workstation, `mode: 0o600` has no effect.
- **Recommended change:** either
  - (a) scope the rule: "never a real deployment key; a per-run test key may go only into a gitignored file under `browser-tests/.local/`, deleted when the run ends"; or
  - (b) avoid the file. Wrangler 4 reads process environment variables as bindings when `CLOUDFLARE_INCLUDE_PROCESS_ENV=true` is set; the builder confirms this against the pinned 4.164.0 before relying on it.

  Either way, state it in SPEC and spec 6.

### 18. Decisions made after the crypto phase must re-check the row they used (EDGE)

- **Lens:** edge cases (two requests at once, a change between steps).
- **Where:** spec 3, `secondStep` "crypto first … then one synchronous step"; spec 2, `renewRecoveryCodes` and the "re-reads every row it decides on" bullet; spec 1, "`encrypt` stores the fingerprint with the first value, in the caller's transaction".
- **Evidence:**
  - Durable Object input gates do not close while `crypto.subtle` runs, so other requests interleave.
  - Candidates computed from a secret decrypted before the sync step stay valid if, meanwhile, the person turned two-step off (and on again with a new secret). The sync step would then accept a code of the old secret, or set `last accepted step` on a row that no longer exists.
  - Likewise, two first encryptions under different keys (two Worker versions during a manual secret change) could both find no fingerprint in the async phase.
- **Recommended change:** add to spec 2 and spec 3:
  - "The sync step re-reads the `two_step` row and proceeds only if its ciphertext equals the one decrypted; otherwise `second_step_expired` (sign-in) or `two_step_code_wrong` (fresh codes)."
  - Spec 1: "`encrypt`'s sync step inserts the fingerprint if absent and refuses `deployment_key_mismatch` if a different one is now stored."
  - Add one matrix row for each.

### 19. When counts clear for fresh codes is ambiguous (ADV)

- **Lens:** adversarial.
- **Where:** spec 2, the completions bullet ("a success clears the email and marker counts and removes its address row") and `renewRecoveryCodes` ("else `two_step_code_wrong` with counts left raised").
- **Evidence:** "success" is the password outcome. Read literally, a correct password with a wrong code clears the counts first, so code guesses on fresh codes would never count, which defeats D-5's "the code given for fresh codes … counted".
- **Recommended change:** spec 2: "Counts clear only when the whole action succeeds: for `turn_on` and `turn_off` a correct password; for `fresh_codes` a correct password and a correct code. A correct password with a wrong code leaves the counts raised." Add the matrix row "fresh codes, right password, wrong code: email count one higher".

### 20. The real-phone criterion and the definition of done disagree; spec 8's deployed run is a cheap place to settle it (VER)

- **Lens:** verification gaps.
- **Where:** D-20; acceptance trace row 27; `epics.md:151` (definition of done: "Where a criterion names … a real phone or tablet, it is tested there") and `epics.md:147` (standing rule 15: "still checked there (story 10.6)").
- **Evidence:** criterion 27 names "on a phone". Under the definition of done, story 1.5 is not done until that is tested on a phone. Under standing rule 15 the check belongs to story 10.6. D-20 picks one reading without saying the other exists.
- **Recommended change:** keep D-20's automated attribute check, and add to spec 8 an optional step for Kevin: on his iPhone, open 15a's sign-in, reach the second step, and record whether the numeric keypad and the code autofill suggestion appear. Nothing secret is recorded, and it costs one minute on a Worker that already exists. If Kevin declines, record in `.memlog.md` that criterion 27's device part is deferred to story 10.6 under standing rule 15.

## Low

### 21. Spec 1 and spec 4 both own `server/env.ts` (ADV)
- **Where:** spec 1 Code Map ("add `DEPLOYMENT_KEY?: string` to `Env`") and Tasks; spec 4 Tasks ("`server/env.ts` -- handlers, cookies, `DEPLOYMENT_KEY`").
- **Change:** give it to spec 1 only. Spec 4 reads it. Fold in finding 6's `| null`.

### 22. Spec 3's "same transaction that consumes the ticket" does not match the code, and the pending token's crypto has no place (ADV)
- **Where:** spec 3, `complete` bullet; `signInStore.ts:480-503` (the ticket is deleted in one `transactionSync`, the account is checked, then a second `transactionSync` writes).
- **Change:** say "in the same synchronous step (no await) as the ticket's consumption". The pending token and its SHA-256 are made before that step, alongside `prepareSession`.

### 23. `attempt` deletes the pending row only if it is not refused, and no sign-in reply clears the pending cookie (EDGE)
- **Where:** spec 3 ("`attempt` deletes the pending row of the pending cookie the browser presents"); `signInStore.ts:405` (the wait throws before any write); spec 4 (the pending cookie is cleared only by second-step replies).
- **Change:** delete the presented pending row before the wait check (in the same synchronous step). Every sign-in reply that is not `{ secondStep: true }` carries `clearPendingCookieLine` when a pending cookie was presented. Add a route test.

### 24. A colon in the installation name breaks the authenticator label (EDGE)
- **Where:** D-7; spec 1, `otpauthUri` ("every part percent-encoded"); matrix row "URI".
- **Evidence:** in the Key URI format, the label's issuer and account are separated by ":" or its encoded form "%3A". Neither part may contain a colon, so percent-encoding a colon inside the installation name still reads as a separator.
- **Change:** spec 1 removes or replaces ":" in the issuer and label parts. Add "Site: North" to the matrix.

### 25. A reused code is told "does not match", and retrying it counts (EDGE)
- **Where:** `wording.md`, `second_step_code_wrong`; D-6 (last-step rule).
- **Evidence:** right after turning on, or a sign-in on another device, the current code is refused for up to 60 s. The person retypes the same code, and each retry raises the email count.
- **Change:** "That code does not match or was already used. Wait for the next code in your authenticator app and try again."

### 26. The second-step page has no text for a key mismatch (EDGE)
- **Where:** spec 7 maps `deployment_key_mismatch`; `wording.md` "Sign in, second step" has no line for it.
- **Change:** show the `deployment_key_mismatch` message followed by "You can still sign in with a recovery code.", and switch to recovery mode with focus on its field.

### 27. Fields with `pattern="[0-9]*"` must sit in `noValidate` forms (EDGE)
- **Where:** CAP-13 ("spaces typed or pasted are ignored"); spec 6 and spec 7 code fields. `SignInPage.jsx:150` already has `noValidate`; the new My account and offer forms are not specified.
- **Change:** state `noValidate` for every form with a code field, and give `maxlength` a number (for example 12) instead of "long enough for spaces".

### 28. `listSecrets` cannot read Wrangler's output through `runWrangler` as it stands; the child inherits the operator's key (ADV)
- **Where:** spec 5 ("through `runWrangler`, reading its standard output"); `deploy-cloudflare.mjs:194-200` (`stdio: [..., "inherit", "inherit"]`, `env = process.env`).
- **Change:** spec 5 says `runWrangler` gains a captured-output mode for `secret list`. It parses the first JSON array in the output and treats anything else as a failed listing. It removes `SITE_SURVEY_DEPLOYMENT_KEY` from every Wrangler child's environment.

### 29. The Worker name and the order of printed lines now matter on a closed installation (EDGE)
- **Where:** spec 5 order; `deploy-cloudflare.mjs:133-140` (`workerName` is checked only on the open path).
- **Change:** check `workerName` right after the deploy, because the key steps need it whatever the set-up state. Fix the print order: deploy line, key lines, then set-up lines.

### 30. A malformed `DEPLOYMENT_KEY` secret (put by hand) has no defined behaviour (EDGE)
- **Where:** spec 1, `parseDeploymentKey` and `keyStatus`.
- **Change:** "a key that does not parse counts as absent". The one log line gains `"reason":"malformed"`. Add a matrix row.

### 31. The smoke suite's "no variable" run needs fresh storage, and a changed key is not exercised self-hosted (VER)
- **Where:** spec 4 smoke bullet.
- **Change:** run the no-variable start on a separate empty storage directory (otherwise the stored fingerprint makes it `mismatch`). Add a restart with a different key: state `key_mismatch`, a recovery code still signs in, and the log line appears once.

### 32. The self-hosted key in an environment variable is readable through `docker inspect` (ADV)
- **Where:** D-16.
- **Change:** no change for this story. Add a `deferred-work.md` entry for story 2.23 ("the env variable is visible to anyone who can inspect the container; the key file replaces it").

### 33. Fresh codes in two tabs leave one tab showing dead codes; second steps for two accounts in two tabs share one pending cookie (EDGE)
- **Where:** spec 2, `renewRecoveryCodes`; D-3.
- **Change:** note both in spec 6 and spec 7. When My account shows codes, it re-reads the state on focus and says "These codes were replaced" if the count or set changed. A second step after another tab's password step applies to the newer pending sign-in. Add one server test that the code is checked against the newer pending row's account.

### 34. The specs name test files, not tests; only specs 6 and 7 list deliberate breakages (VER)
- **Where:** each spec's Acceptance Criteria.
- **Change:** each AC names the test title (`describe › it`) it is proved by, recorded when built. Specs 1 to 5 each list two deliberate breakages, for example spec 3 "pending row not deleted at the wait", spec 5 "key printed twice".

### 35. Switching to the authenticator app on a phone fires a session read mid-set-up (EDGE)
- **Where:** `main.jsx:126-153` (`visibilitychange` handler); spec 6.
- **Evidence:** same-account reads return early and `/invite` is exempt from reloads, so state should survive.
- **Change:** add a browser test: hide and show the page (emulated `visibilitychange`) at step 2 and step 3, in My account and in the offer. The step and the codes stay.

### 36. The marker's own wait at the second step is not spelled out (EDGE)
- **Where:** spec 3, step 2 ("the email's unless the row has a usable marker, the marker's").
- **Change:** "if the row's marker is now in its own wait, it is treated as absent and the email's wait applies too", as `attempt` does (`signInStore.ts:389-391`).

### 37. AD-12's "recovery codes at least 20 characters" reads against D-9's 16 (ADV)
- **Where:** `architecture.md:252`; D-9.
- **Evidence:** the AD-12 sentence derives from CA-55, which concerns the administrator recovery code of story 1.13 (`choicesA.md:53`; standing rule 14), but its wording does not say so.
- **Change:** D-9 cites CA-55 and standing rule 14 to show that the 20-character rule does not apply here. Ask for AD-12's sentence to say "the administrator recovery code" at the next architecture edit.

### 38. Criterion 23's "reads and writes no encrypted value" against turning off (ADV)
- **Where:** acceptance trace row 23; D-15.
- **Change:** state in the trace that deleting a ciphertext (turning off under a mismatch) is not reading or writing an encrypted value, and that D-15 keeps it on purpose.

### 39. Turning on or off ends no session: no test (VER)
- **Where:** D-10; spec 2 matrix.
- **Change:** add rows "turn on / turn off / fresh codes: the account's other session still live".

### 40. Epic 9: a pre-1.5 installation updated by the workflow would get its key put mid-update (ADV)
- **Where:** AD-21 ("no Worker secret may be changed while an update is under way"); D-17.
- **Change:** add a `deferred-work.md` entry for story 9.3 or 9.12: the update workflow must either refuse to install a release that needs a key the Worker lacks, or put it before the update begins.

### 41. Small inaccuracies in `brownfield.md` and the route declarations (ADV)
- **Where:**
  - `brownfield.md`, "Existing tests" bullet on `tests/deploy-cloudflare.test.mjs` ("around lines 31–107"): `runDeploy(` is called at lines 72 to 148.
  - Spec 4: standing rule 2 says every route declares its class (AD-22), and every change to one's own two-step set-up is person only.
- **Change:** correct the range. In spec 4, add a comment on each new route naming its future class (`person only` for the account routes, `public` for the key-state route), for story 1.8.

Every other claim I checked in `brownfield.md` is true:
- `signInOutcome` accepts exactly `{ name }` (`signInClient.js:48-49`).
- `location.replace('/')` is at `InvitationPage.jsx:147`.
- `prefixedCookies`' pattern admits only `m-` (`session.ts:84`).
- `Env` has no secret beyond `SETUP_CODE`.
- `raiseCount`, `liveCount` and `prune` are private.
- The pinned lists are at `signin-store.test.ts:804/858`, `setup-store.test.ts:606-608` and `signin-declarations.test.ts:26-32`.
- The browser ports are 8791 to 8796.
- Wrangler is 4.164.0.
- `fromEnvironment` is at `workerd.capnp:757`.
- There is no QR package in `package.json`.

---

## The proposed decisions

| D | Stands? | Why, in one line |
|---|---|---|
| D-1 | Stands | A dialog with only the two-step section meets criterion 7 without taking story 1.6's scope, and follows `AccountMenu`'s on-demand pattern. |
| D-2 | Stands | A `__Host-` `HttpOnly` `SameSite=Strict` cookie is the browser binding CA-46 asks for. `prefixedCookies` needs only the `p-` alternative. |
| D-3 | Stands | Losing at most 5 minutes on reload is cheap. Add finding 23 (delete before the wait check, clear the cookie). |
| D-4 | Stands, with finding 3 | The arithmetic holds (4 guesses from a clear count, none until it clears). The reply when the wait begins must be `signin_wait`, and the input needs the address (finding 4). |
| D-5 | Stands, with findings 14 and 19 | Counting account-action passwords is what makes CA-13 protect an open session. Check key availability before counting, and clear counts only on full success. |
| D-6 | Stands | SHA-1 is the only algorithm all apps honour. The last-step rule is what makes criterion 14 hold across three steps. |
| D-7 | Stands, with finding 24 | Per-installation issuer is right. Strip colons. |
| D-8 | Stands, with finding 8 | A small MIT encoder with no dependencies, drawn by React, is lower risk than new code. It needs a decode test. |
| D-9 | Stands | 80 bits with SHA-256 resists an offline search, and CA-55's 20 characters is about another code (finding 37). |
| D-10 | Stands, with finding 5 | Password before the secret is right. Starting again needs a set-up identifier to answer "replaced". |
| D-11 | Stands, with finding 14 | Offering in place keeps CA-13 exact and needs no stored flag. Read availability first. |
| D-12 | Stands, with finding 7 | Keeping the public session read unchanged is right. The two-step read and the start reply must carry the email. |
| D-13 | Stands, with finding 25 | Specific messages after a correct password reveal nothing new. Mention "already used". |
| D-14 | Stands | HKDF and AES-GCM with per-record associated data and a version prefix, all in Web Crypto on both hosts. |
| D-15 | Stands | Under a mismatch, recovery codes are hashes, not encrypted values, so CA-52 holds. Anyone who can change the Worker's secrets can already deploy code, so the fallback gives an attacker nothing. Without it people would be locked out. |
| D-16 | Stands, with finding 6 | Same code on both hosts now. An unset variable is `null` in workerd. |
| D-17 | **Change** (findings 1, 2, 10, 11) | Keep the order and the environment variable. Print before the put, accept a supplied key when `stored`, poll the state, and warn about concurrent deploys. |
| D-18 | Stands | The route reveals only whether anything was ever encrypted. Consider finding 10's Worker-key fingerprint. |
| D-19 | Stands, with findings 12 and 13 | A real redeploy is the only proof of criterion 21. Fix check 7 and tighten the safety steps. |
| D-20 | **Change, partly** (finding 20) | Keep the automated attribute check. Add Kevin's one-minute phone check during spec 8, or record the deferral to story 10.6 explicitly. |
| D-21 | Stands, with findings 11, 25 and 26 | One list to approve. It lacks three lines. |
| D-22 | Stands, with finding 12 | Passing the key on each call avoids depending on when a running object sees a new secret. No existing log or error path records an operation's input (see Summary). Its cited evidence is not in `cloudflare-limits.md`. |

No recommended option is wrong enough to overturn outright. D-17 needs its steps changed and D-20 needs an addition; every other decision stands as recommended, with the spec fixes named.

## Spec size and order

- The order 1 → 8 builds. Spec 5's unit tests need no route; its real `askKeyState` needs spec 4's route.
- Specs 1, 2, 3, 5, 7 and 8 are each one session's work.
- Spec 4 is the heaviest: the sign-in reply change, a cookie family, seven routes, `Env`, the self-hosted binding, a smoke suite with turn-on and sign-in before and after a restart, and three sweeps. Consider moving the self-hosted part (`config.capnp`, `smoke.mjs`, `host-config.test.ts`, findings 6 and 31) into its own spec 4b, built after spec 4.
- Spec 6 is large but cohesive.
- File overlap: `server/env.ts` (finding 21) and the browser helpers (finding 15). The repeated edits to `Installation.ts`, `signInStore.ts` and `setup-store.test.ts`'s pinned list are sequential and fine.
- Specs 1 to 5 never run `npm run test:browser`, although spec 4 changes `prefixedCookies` and the sign-in handler. Consider adding it to spec 4's verification so a regression in story 1.3's and 1.4's browser tests is caught before spec 6.

## Coverage of the story's criteria

Every one of the 28 criteria has exactly one owning spec, and the owner's Acceptance Criteria name it. The test files are named, but no test titles are yet (finding 34). Criterion 21 depends on Kevin's go-ahead for spec 8. Criterion 27's device part depends on finding 20.

## What I did not read or could not check

- **Read in part only:**
  - `setupStore.ts` (only `parseOperationInput`), `smoke.mjs` (only its start-up and the `SETUP_CODE` binding), `SignInPage.jsx` (only the form tag) and `shared/routes.ts` (lines 100–243);
  - the test files (only the pinned-list lines `brownfield.md` cites);
  - the story 1.3 and 1.4 `SPEC.md` files (searched, not read in full).
- **Not read:** `invitationStore.ts`, `password.ts`, `marker.ts`, `InvitePanel.jsx`, `invitationClient.js`, `setupState.js`, `epic-1-context.md`, the PRD, and story 1.3's spec 4 acceptance record that spec 8 is patterned on.
- **Not checked by running:**
  - whether `wrangler secret list --format json` prints anything besides the JSON;
  - whether `wrangler tail` redacts `Cookie` headers;
  - whether `CLOUDFLARE_INCLUDE_PROCESS_ENV` works in Wrangler 4.164.0;
  - the current release and licence of `qrcode-generator`.

  No command was run against Cloudflare or a local server.
- I did not check the UX canvas screens for S-26, S-27 and S-29, only the specification's text.

## Disposition

Applied on 2026-11-22 by the spec-writing session on the orchestrator's instruction: every finding as recommended, with the orchestrator's choices where a finding offered options (rulings "Claude, accepted on Kevin's instruction, 2026-11-22"). Spec numbers below are the new ones: the self-hosted part of old spec 4 became spec 5, and old specs 5 to 8 became 6 to 9.

| # | Disposition | Where changed |
|---|---|---|
| 1 | Applied: the generated key is printed before the put; a failed put says it may have been stored; matrix rows for the failure and the rerun | spec 6 (Always, matrix, breakage); `wording.md` deploy lines; D-17 |
| 2 | Applied: with `stored` and no key in the list, a supplied key is put; the command then polls the key state and exits 1 on `mismatch` (ruled shape of the route, not the Worker key's fingerprint) | spec 6; spec 1 and spec 4 (route reply); `wording.md` ("not the original", "not confirmed"); D-17, D-18 |
| 3 | Applied: the wrong code that starts a wait answers `signin_wait` and deletes the pending row | spec 3 (step 4, matrix); spec 8 (matrix); D-4 |
| 4 | Applied: `secondStep` takes the request's `address`, counted as `attempt` does; matrix row | spec 3; spec 4 (handler passes `clientAddressKey`); D-4 |
| 5 | Applied: a set-up identifier from start, sent with confirm; a replaced set-up answers `two_step_setup_expired` | spec 2; spec 4 (start reply, confirm input); spec 7; CAP-1; D-10, D-12 |
| 6 | Applied: `DEPLOYMENT_KEY?: string \| null`; the handler passes the key only as a non-empty string; route test with `null` | spec 1 (`Env`); spec 4; spec 5; `brownfield.md`; D-16 |
| 7 | Applied: start answers `installationName` and `email`; the state read gains `email` | spec 2; spec 4; spec 7; D-12 |
| 8 | Applied as option (a): a pinned dev-only QR decoder in the browser test, compared with the start reply's URI, licence confirmed by the builder; fallback (b) only if unworkable in both projects, reported; breakage "QR drawn from a different string" | spec 7; SPEC.md Ask First; `brownfield.md`; D-8 |
| 9 | Applied: two pending sign-ins with one code, and one recovery code twice at once; `DELETE … RETURNING` and the last step re-read inside the step | spec 3 (Always, matrix, AC); D-6 |
| 10 | Applied: the "one deploy at a time" line on every run and in spec 6; `deferred-work.md` entry for Epic 9; the Worker key's fingerprint is not published (ruled) | spec 6; `wording.md`; `deferred-work.md`; D-17, D-18 |
| 11 | Applied: `askKeyState` polls like `waitForSetupState`, exact reply shape, its own unreadable line; 404-then-200 row | spec 6; `wording.md` |
| 12 | Applied: check 7 now records when the public key-state route first answers 200 after a deploy, and keeps the HKDF/AES-GCM observation; D-19 drops the running-object claim; D-22's reason reworded | spec 9; D-19, D-22; SPEC.md Assumptions |
| 13 | Applied: `wrangler whoami` and the account id on every call; Worker names checked absent; `wrangler delete --force` in a `finally`; tail as JSON in memory only; password generated in memory | spec 9; D-19 |
| 14 | Applied: `accountCheck` refuses `deployment_key_missing`/`mismatch` before counting for turn on and fresh codes; the offer only when availability is `available` | spec 2; spec 7; CAP-8; D-5, D-11 |
| 15 | Applied: helpers in `browser-tests/two-step-helpers.mjs`, owned by spec 7, imported by specs 7 and 8 | spec 7; spec 8; `brownfield.md` |
| 16 | Applied: a browser leak test over requests, storage, address and console; breakage "secret written to `sessionStorage`" | spec 7; CAP-1 |
| 17 | Applied as option (a): Never scoped to real keys; a per-run test key only in the gitignored `.dev.vars` the servers already use, removed at the end of the run | SPEC.md Never and Assumptions; spec 7; `brownfield.md` |
| 18 | Applied: the synchronous step re-reads the ciphertext it decrypted; `encrypt` inserts the fingerprint if absent and refuses a different one; matrix rows | spec 1; spec 2; spec 3; D-15 |
| 19 | Applied: counts clear only when the whole action succeeds; matrix row | spec 2; D-5 |
| 20 | Applied: automated attribute check kept; the real-phone part deferred to story 10.6 under standing rule 15 (`.memlog.md`, `deferred-work.md`); an optional step for Kevin in spec 9 | spec 8; spec 9 (check 8); `acceptance-trace.md`; CAP-13; D-20 |
| 21 | Applied: `server/env.ts` owned by spec 1 only | spec 1; spec 4 (Code Map: read only) |
| 22 | Applied: "the same synchronous step (no await) as the ticket's consumption"; the pending token made beside `prepareSession` | spec 3 |
| 23 | Applied: `attempt` deletes the presented pending row before its wait check; every non-`secondStep` sign-in reply clears the pending cookie; route test | spec 3; spec 4; CAP-4; D-3 |
| 24 | Applied: ":" replaced by a space in the issuer and label parts; matrix row "Site: North" | spec 1; D-7 |
| 25 | Applied: `second_step_code_wrong` says "or was already used" and to wait for the next code | `wording.md`; D-13 |
| 26 | Applied: on a key mismatch the second step shows the message and the recovery line, and switches to recovery mode | spec 8; `wording.md`; D-13 |
| 27 | Applied: `noValidate` on every form with a code field; `maxlength="12"` | spec 7; spec 8; spec 1 (`CODE_FIELD_MAX_LENGTH`); CAP-13 |
| 28 | Applied: a captured-output mode for `secret list`, first JSON array parsed; the operator's key removed from every Wrangler child's environment | spec 6; `brownfield.md` |
| 29 | Applied: `workerName` checked right after the deploy; printed order deploy, key, set-up | spec 6; `brownfield.md` |
| 30 | Applied: a key that does not parse counts as absent; the log line gains `"reason":"malformed"`; matrix row | spec 1; D-14 |
| 31 | Applied: the no-variable run on fresh storage; a restart with a different key | spec 5; D-16 |
| 32 | Applied: no change in this story; `deferred-work.md` entry for story 2.23 | `deferred-work.md`; D-16 |
| 33 | Applied in part as ruled: notes in specs 3, 7 and 8 and the server test that a code is checked against the newer pending row's account; the "These codes were replaced" re-read is not built and is recorded as a known limit in spec 7 | spec 3 (matrix row); spec 7 (known limit); spec 8 (known limit); SPEC.md Non-goals |
| 34 | Applied: every spec file's acceptance criteria have a place for the proving test's title; specs without deliberate breakages each list two | specs 1–9 |
| 35 | Applied: a browser test hides and shows the page at steps 2 and 3, in My account and the offer | spec 7 |
| 36 | Applied: a marker in its own wait is treated as absent at the second step; matrix row | spec 3; D-4 |
| 37 | Applied: D-9 cites CA-55 and standing rule 14; no change to `architecture.md`; `deferred-work.md` entry for AD-12's sentence | D-9; `deferred-work.md` |
| 38 | Applied: the trace says deleting a ciphertext is not reading or writing one | `acceptance-trace.md`; D-15 |
| 39 | Applied: matrix rows that each change leaves another session live | spec 2 |
| 40 | Applied: `deferred-work.md` entry for stories 9.3 and 9.12 | `deferred-work.md` |
| 41 | Applied: the test-file line range corrected; a comment on each new route naming its future class | `brownfield.md`; spec 4 |
| Spec size and order | Applied: the self-hosted part split into spec 5, built right after spec 4; later specs renumbered 6 to 9 with every cross-reference edited by hand; `npm run test:browser` added to spec 4's verification | `stories/`; `stories.yaml`; `acceptance-trace.md`; SPEC.md |
