---
id: SPEC-story-1-5-two-step-verification
status: ready for development (decisions D-1 to D-22, Claude, accepted on Kevin's instruction, 2026-11-22)
companions:
  - acceptance-trace.md
  - brownfield.md
  - decisions.md
  - wording.md
  - ../spec-story-1-4-invite-a-person/SPEC.md
  - ../spec-story-1-3-sign-in-and-sign-out/SPEC.md
  - ../spec-story-1-2-set-up-a-new-installation/SPEC.md
  - ../../planning-artifacts/epics/epics-PhySecDesign-2026-11-18/epics.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/cloudflare-limits.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/design-canvas.md
  - ../../implementation-artifacts/epic-1-context.md
  - ../../implementation-artifacts/deferred-work.md
  - ../../../site-studio/AGENTS.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete contract for what to build, test, and validate. Source documents are for traceability only.

# Story 1.5: Two-step verification

The acceptance contract is story 1.5 of epics draft 0.7 (`epics.md`, "### Story 1.5"), read with standing rules 1–15 and the definition of done. Where this spec summarises a criterion, the story's wording governs. `acceptance-trace.md` numbers the story's 28 criteria and maps each to a capability and to the one spec that owns it. The decisions of stories 1.2, 1.3 and 1.4 (their `SPEC.md` files) still hold; "story 1.3's D-n" names one of them. Choices CA-11 (10 codes), CA-12 (6 digits, 30 seconds, one step either side), CA-13 (password to turn on or off; password and code for a fresh set), CA-14 (secret encrypted with the deployment key), CA-15 (shared limit and wait), CA-46 (pending token, 5 minutes), CA-47 (new token after the second step) and CA-52 (key found in the secret list, fingerprint) carry rulings ("Claude, accepted on Kevin's instruction, 2026-11-19").

**Status: ready for development.** D-1 to D-22 in `decisions.md` are decided: each was ruled on 2026-11-22 by the orchestrator session as its recommended option, "Claude, accepted on Kevin's instruction, 2026-11-22", on Kevin's instruction of that day ("Review any questions you bring me and way the pros and cons. Recommend an answer and run with it."). They are Claude's rulings, not Kevin's item-by-item decisions, and Kevin may overrule any. The independent spec review (`review-spec.md`, 41 findings, run by a subagent of the orchestrator) was applied in full with the orchestrator's choices; its Disposition table says what changed where, and changes in the spec files name their finding. In this file a bare "D-n" is one of this story's decisions.

## Why

FR-67 lets a person protect their account with an authenticator app and single-use recovery codes, so a stolen password is not enough; AD-12 says how, and AD-17 and AD-21 say the authenticator secret is encrypted with a deployment key that a redeploy never replaces. After story 1.4 an installation has several people signing in with a password alone. Story 1.11 (administrator reset and requirement), story 1.16 (requirement for everyone), story 1.15 (settings secrets under the same key) and story 2.23 (the self-hosted key file) build on this story.

## Capabilities

- **CAP-1**
  - **intent:** A signed-in person turns on two-step verification with their password, an authenticator app and one generated code.
  - **success:**
    - My account (D-1) shows two-step verification as Off with "Turn on two-step verification". Turning on asks for the password first; a wrong password is refused (`two_step_password_wrong`) and nothing is set up (criterion 17).
    - After the password the page shows a QR code drawn in the browser (D-8) and the same secret as text for manual entry, grouped in fours (D-6, D-7). A browser test decodes the drawn QR and finds the start reply's URI. The secret reaches no other server, address, storage or log, and a browser test watches requests, storage, the address and the console to show it.
    - A current code from the app confirms it (criterion 1). A wrong code is refused (`two_step_code_wrong`) and the set-up stays pending; a set-up not confirmed within 10 minutes, or replaced by starting again (told apart by its set-up identifier), is refused `two_step_setup_expired` (D-10).
    - Turning on while it is on is refused (`two_step_already_on`); with no usable key it is refused before the password is counted (D-5).
- **CAP-2**
  - **intent:** Recovery codes let the person sign in without the app, each once, and are never shown again.
  - **success:**
    - Confirming shows a set of 10 recovery codes (criterion 24) once, with Copy and Download (criterion 2); closing the view leaves them unrecoverable: My account then shows only the count (criterion 7).
    - Codes are 16 characters in four groups (D-9). The installation stores only each code's SHA-256 (criterion 10); a server test reads the table and finds hashes and no code.
    - "Use a recovery code" on the second step accepts a code once; the same code is refused afterwards (criterion 6), and the count drops by one.
    - "Make fresh recovery codes" asks for the password and a current code; the new set replaces the old, and an old code is refused (criterion 8).
- **CAP-3**
  - **intent:** With two-step verification on, a correct password alone does not sign in; a current code or a recovery code completes it with a new session.
  - **success:**
    - A correct password for such an account answers `{ secondStep: true }` (D-12) with no session cookie and no marker; the session read answers signed out (criterion 3).
    - A correct code or recovery code sets a new session cookie and the marker, ends the session the browser presented, and answers `{ name }` (criterion 5); the earlier token is refused afterwards.
    - An account with it off signs in exactly as in story 1.3.
- **CAP-4**
  - **intent:** The state between the password and the second step is a short-lived, browser-bound token that allows nothing else.
  - **success:**
    - The pending token is 32 random bytes in its own `__Host-` cookie, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age=300` (D-2); the installation object stores only its SHA-256 with an expiry 5 minutes after the password check (criteria 4, 25).
    - It is discarded on success, on expiry and when a wait begins (D-4). A second-step request without the cookie, with another browser's or an expired one, is refused `second_step_expired`; presented as a session cookie, or to any route but the second step, it signs nothing in and allows nothing (criterion 18).
    - A new sign-in attempt from the same browser discards the token it presents, even when refused, and every sign-in reply other than `{ secondStep: true }` clears the cookie; a reload shows the sign-in page again (D-3).
- **CAP-5**
  - **intent:** Codes follow the usual authenticator settings and a code works once.
  - **success:**
    - TOTP (RFC 6238) with HMAC-SHA-1, a 20-byte secret, 6 digits and a 30-second step; codes of the step before and after the current one are accepted (criterion 26, CA-12). Server tests use RFC 6238's test vectors and an injected time.
    - A code is accepted only for a time step later than the last one accepted for that account, at set-up and at sign-in, so an accepted code is refused if used again, also in the next step's window (criterion 14, D-6). Two pending sign-ins sending one code at once sign in once, and one recovery code sent twice at once signs in once.
- **CAP-6**
  - **intent:** Wrong codes share the password limit and wait, so guessing stays slowed.
  - **success:**
    - A wrong code or recovery code at the second step raises the email count, the marker count (when the password attempt carried a usable marker) and the request address's count exactly as a wrong password does, and meets the same wait; the wrong code that starts a wait answers `signin_wait`; a correct one clears them as a successful sign-in does (criterion 15, CA-15, D-4).
    - A correct password for an account with two-step verification on clears nothing. Story 1.3's clearing rules apply to these counts.
    - The password and the code given to turn on, turn off or make fresh codes are checked through the one hash queue and counted the same way, and counts clear only when the whole action succeeds (D-5); a full queue answers `signin_busy`.
- **CAP-7**
  - **intent:** Turning two-step verification off needs the password.
  - **success:** "Turn off two-step verification" asks for the password; a wrong one is refused and leaves it on (criterion 16). Turning off deletes the secret and every recovery code; signing in then needs only the password. Other sessions are not ended (D-10).
- **CAP-8**
  - **intent:** A person who has just accepted an invitation is offered set-up and can skip it.
  - **success:** After a successful accept, when two-step verification is available on the installation, the invitation page shows the offer in place (D-11); "Set up two-step verification" runs CAP-1 on that page, asking for the password again (CA-13), and "Skip for now" loads `/` afresh, as does finishing (criterion 9). When it is not available the app opens with no offer. The page keeps `Referrer-Policy: no-referrer` (story 1.4's D-2).
- **CAP-9**
  - **intent:** Secrets stay out of replies, logs and other origins.
  - **success:**
    - Only the set-up start reply holds the authenticator secret, and only the confirm and fresh-codes replies hold recovery codes. A route sweep after set-up finds neither in any other reply, and a `console` watch over set-up, sign-in with a code and with a recovery code, a fresh set and turning off finds no secret, code, recovery code, password, key or token (criterion 20).
    - The second-step request and every new account action are refused (`origin_refused`) without the app's origin and header (criterion 19, standing rule 13); the declaration sweep's pinned list of cookie-reading routes gains them.
- **CAP-10**
  - **intent:** The authenticator secret is encrypted with the deployment key, and a wrong key fails safely and says so.
  - **success:**
    - The secret is stored as AES-256-GCM ciphertext under a key derived from the Worker secret `DEPLOYMENT_KEY` (D-14); a server test reads the row and finds no secret bytes and a value that decrypts only with that key (criterion 11).
    - The Worker passes the key to the installation object with each call that needs it (D-22). The installation stores the key's fingerprint with the first encrypted value (D-15). Given a different or no key, it decrypts and encrypts nothing: setting up and checking a code are refused `deployment_key_mismatch`, the two-step state read and one runtime log line per object start say the key does not match, and recovery codes and turning off still work (criterion 23). A key that does not parse counts as no key.
    - With no key and nothing encrypted, turning on is refused `deployment_key_missing`. Self-hosted, the key comes from the `DEPLOYMENT_KEY` environment variable until story 2.23, an unset one being `null` and counting as no key (D-16).
- **CAP-11**
  - **intent:** The deploy command creates the deployment key once, shows it once, and never replaces it.
  - **success:**
    - The deploy command lists the Worker's secrets. With no `DEPLOYMENT_KEY` and nothing encrypted it generates 32 random bytes, prints the key once with the instruction to keep a copy outside the Cloudflare account, and only then supplies it as that secret; a failed put says the printed key may have been stored (criterion 12).
    - An operator's key in `SITE_SURVEY_DEPLOYMENT_KEY` is used instead and nothing is generated or printed (criterion 13, D-17). When the Worker has lost its key but the installation holds encrypted values, only a supplied key is put, and the command then confirms it against the stored fingerprint and exits 1 on a mismatch (D-17, D-18).
    - A key already in the list is never replaced; a supplied one is then not used, and the command says so (criterion 22, CA-52). Every run says to run one deploy at a time.
    - On the test account, a redeploy prints no key and a two-step code set up before still signs in (criterion 21, D-19).
- **CAP-12**
  - **intent:** Two-step set-up lives outside project revisions.
  - **success:** Two-step rows live only in the installation object; a server test over its registered operations finds that only the listed two-step and sign-in operations change them, and none of the restore path (criterion 28, standing rule 9).
- **CAP-13**
  - **intent:** The code field works well on a phone.
  - **success:** The code fields have `inputmode="numeric"`, `autocomplete="one-time-code"`, `pattern="[0-9]*"`, `maxlength="12"`, 16 px text and a label, in `noValidate` forms; spaces typed or pasted are ignored. Browser tests in WebKit iPhone check the attributes (criterion 27). The real-phone part is deferred to story 10.6 under standing rule 15; spec 9 offers Kevin an optional check on his phone (D-20).
- **CAP-14**
  - **intent:** The new screens get repeatable browser tests.
  - **success:** Playwright tests in Chromium and WebKit iPhone cover turning on (QR decoded and text key shown, confirm, codes with Copy and Download), the count, a fresh set, turning off, the offer and its skip, sign-in with a code, with a recovery code and a used recovery code refused, and a wrong code refused; axe finds no serious or critical violation on My account (off, set-up, codes, on), the offer and the second step (code and recovery code) (standing rule 15). The tests compute codes with their own RFC 6238 implementation in `browser-tests/two-step-helpers.mjs`. Every spec file's acceptance criteria record the title of the test that proves them.

## Constraints

- One server build; exactly two Durable Object classes; no new platform feature (AD-16, standing rule 7). New tables created if absent under data format 1 (standing rule 8). Cryptography only through Web Crypto (`crypto.subtle`), which Workers and workerd both provide.
- Every new route is under `/api/v1/`, declared in `shared/routes.ts` with input and reply schemas. A refusal names at most a field, never an entered value (AD-22). Every new non-GET route is `appOriginOnly` and `readsSessionCookie` (standing rule 13, V-12).
- Password checks go only through the one hash queue (story 1.3's D-5 amended). Counting happens before the check, in one synchronous step in the installation object, as story 1.3's `attempt` does (CA-43).
- The secret is decrypted and codes are checked inside the installation object; the Worker never receives the secret after set-up, and the object never receives a password (story 1.3's split holds). A decision taken in a synchronous step after cryptography re-reads every row it relies on.
- No authenticator secret, code, recovery code, deployment key, password, hash or token in a log, refusal, record outside the installation object or reply other than the three named in CAP-9; tokens only in `Set-Cookie` (NFR-5, standing rule 14).
- `callObject` keeps story 1.2's D-2 as amended: reads retried once after a bare reset; every two-step write and the second step never retried.
- Rules the page and the server share (code and recovery-code formats, inputs, the TOTP parameters, the authenticator URI) live once in `shared/`, in TypeScript, with tests (standing rule 6).
- New screen parts meet UX section 10 in the white and teal direction with `BrandMark`; the On and Off state uses the status language (standing rules 3 and 5).
- Browser tests cover flows and on-screen refusals; rules, counts, expiry, encryption and concurrency are server tests in Cloudflare's runtime (standing rule 15). Story 1.3's and story 1.4's tests change only where this story changes a reply they pin (`brownfield.md`).

### Always

- Build to the decisions in `decisions.md` as ruled; a change to one is recorded in `.memlog.md` before a spec file is built.
- Keep each `stories/N-….md` within its files in scope; one `bmad-build` session per spec file, one at a time per set of files, in the order of `stories.yaml`.
- Run the verification commands each spec file names, in `site-studio/`, and record each proving test's title where the spec file asks.

### Ask First

- Any use of a Cloudflare account (only the "PhySec Site Studio" test account may be used, and only for spec 9, with Kevin's go-ahead for that run).
- Adding any dependency other than D-8's QR encoder and the one dev-only QR decoder of spec 7 (a ruled exception, finding 8), or changing a pinned version.
- Changing a reply shape that an earlier story's tests pin beyond those listed in `brownfield.md`.
- Any change to the deploy command's set-up-code behaviour (story 1.2).

### Never

- Write a password, code, recovery code, authenticator secret, cookie value, token or a real deployment key into any file, log or message. The one exception (finding 17, ruled): a per-run test key may go only into the gitignored `.dev.vars` under `browser-tests/.local/<server>/` that the browser servers already use for the set-up code, removed when the run ends.
- Replace or regenerate an existing deployment key; put a key on a command line.
- Send the authenticator secret or its QR code to any server other than the installation, or keep it in browser storage or the address bar.
- Edit files by bulk search-and-replace; touch the untracked `.claude/`, `Site Studio UX screens.pdf` or `preview.html`; change `sprint-status.yaml` or planning documents from a spec build.

## Non-goals

- My account's profile, password change and sessions (story 1.6); this story's My account holds only the two-step section (D-1).
- An administrator resetting or requiring two-step verification for one user, and the Users table's two-step column (story 1.11); requirement for everyone and set-up forced at sign-in (story 1.16).
- The self-hosted key file and its refusals (story 2.23); recovery of an installation with or without the key (stories 8.7, 8.8); the key in the published instructions (story 9.1); updates and rollbacks keeping the key, and concurrent deploys from the update workflow (stories 9.3, 9.12; `deferred-work.md`).
- Activity-log entries for two-step events (story 1.14); settings secrets under the same key (story 1.15).
- WebAuthn, passkeys, SMS or email codes, remembered devices.
- A required real-phone check of code autofill (story 10.6, D-20); My account telling a tab that its codes were replaced in another tab (a known limit, spec 7).

## Success signal

- In local runs: a designer turns on two-step verification by scanning the QR code with an authenticator app, saves the recovery codes, signs out, and finds that the password alone leads to a code page; the app's code signs them in, a recovery code signs them in once, and a person who has just accepted an invitation is offered set-up and can skip it.
- Server tests show encryption under the key, a mismatched key refused with its message, hashes only for codes and tokens, the shared limit, single use of codes, the 5-minute pending token and the origin rule; the self-hosted smoke suite turns two-step on and signs in with a code across a restart; the Playwright suite passes in Chromium and WebKit with axe clean; on the test account a redeploy keeps the key and an earlier code set-up still signs in.

## Assumptions

- The pending row carries forward the sign-in ticket's bindings (account, email key, address failure row, usable marker, stored-hash identity, presented session hash; story 1.3's applied correction 1); the second step re-checks that the account is active with the same hash, as completion does.
- A second step and a two-step account action are each one object operation: cryptography that needs no storage first (decrypting, the candidate codes, the entry's SHA-256), then one synchronous step that checks the wait, raises or clears counts, re-reads and compares, and writes.
- "After set-up" in criterion 20 is read as: no reply other than the one that creates a secret or a set holds it.
- Turning off also deletes a pending set-up and ends no session; making fresh codes leaves the authenticator unchanged.
- The session read and its reply are unchanged; My account reads `GET /api/v1/account/two-step` (D-12).
- The browser-test servers get a per-run `DEPLOYMENT_KEY` in their gitignored `.dev.vars`, removed at the end of the run (mode 600 has no effect on Windows); the server tests get one generated when the test configuration loads.
- workerd's `fromEnvironment` binding (in `workerd.capnp` of the pinned workerd, lines 757–761, `null` when unset) supplies the self-hosted key (D-16); spec 5 confirms it under the smoke suite.
- Whether a running installation object sees a `DEPLOYMENT_KEY` put after it started is not recorded in `cloudflare-limits.md`; D-22 (the Worker passes the key on each call) removes the dependence.
- The key passes from the Worker to the installation object inside an operation's input (D-22); the review found no log or error path that records an operation's input, and spec 1 checks it with a `console` watch.

## Decisions

All decided: see `decisions.md` (D-1 to D-22), each "Claude, accepted on Kevin's instruction, 2026-11-22", with amendments naming their review finding. `wording.md` holds D-21's text in full.

## Deferred-work items addressed to story 1.5

- **Marker count and second-step failures (story 1.3's D-2 (v) amended):** taken in D-4: second-step failures raise the marker count when the password attempt carried a usable marker.
- **Clearing rules (story 1.3's D-2 (i), (ii) amended):** taken: second-step failures share them (CAP-6).
- **Hash queue (story 1.3's D-5 amended):** taken: turning on, turning off and fresh codes check the password through the queue and answer `signin_busy` when it is full (CAP-6, D-5).
- **Ticket binding (story 1.3 applied correction 1):** taken: it carries over to the pending token (Assumptions).
- **Declaration sweep (V-12):** binds this story: its pinned cookie-reading list gains the new routes (CAP-9).
- Every other open item names other stories; none is taken here. The http public-address item (story 1.4 spec 3) does not touch this story: no link is built.
- New entries this story adds to `deferred-work.md`: concurrent deploys for Epic 9's workflow (finding 10); criterion 27's real-phone part for story 10.6 (finding 20); the environment-variable key visible through container inspection, for story 2.23 (finding 32); AD-12's recovery-code sentence (finding 37); a pre-1.5 installation updated by the workflow needing its key (finding 40).
