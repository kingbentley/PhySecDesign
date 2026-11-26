# Acceptance trace: story 1.5 criteria to capabilities and specs

The 28 criteria of story 1.5 (epics draft 0.7), numbered here in the story's order, with the capability whose `success` proves it and the one spec that owns it: the spec whose acceptance criteria declare it met. An earlier spec may supply a building-block test, named under "Supporting". The criteria are shortened; the story's wording governs. "Where checked": S = server test in Cloudflare's runtime (`server-tests/`), B = Playwright test in desktop Chromium and WebKit iPhone (`browser-tests/`), U = unit test in Node (`tests/`), H = self-hosted smoke test, C = deployed run on the Cloudflare test account (spec 9, D-19).

Specs, in build order: 1 rules, cryptography and the key guard; 2 two-step storage and account actions; 3 the second sign-in step in the store; 4 routes and cookies; 5 the self-hosted deployment key; 6 the deploy command's key; 7 My account, set-up and the offer; 8 the second-step page; 9 acceptance on Cloudflare.

| # | Group | Criterion (short) | CAP | Where checked | Owner | Supporting |
|---|---|---|---|---|---|---|
| 1 | Core | Turned on with the password, a scanned code and one generated code (CA-13) | CAP-1 | B (QR decoded to the start reply's URI and key shown; code computed from the key confirms) | 7 | 2 (start, confirm), 4 (routes) |
| 2 | Core | Recovery codes shown once, with Copy and Download; never displayed again | CAP-2 | B (list, Copy, Download's file; reopening shows only the count) | 7 | 2 (codes made once), 4 (no read answers them) |
| 3 | Core | With it on, a correct password alone does not sign in; a current code does | CAP-3 | S (route: `{ secondStep: true }`, no session or marker cookie, session read signed out; code then signs in) | 4 | 3 (store), 5 (H), 8 (page) |
| 4 | Core | Pending token: hash only, bound to the browser, nothing but the second step; discarded on success, expiry, or when the wait begins (CA-46) | CAP-4 | S (table holds the hash; row gone after success, at 5 min, at the wait) | 3 | 4 (cookie attributes) |
| 5 | Core | Second step success issues a new session token in place of any earlier one (CA-47) | CAP-3 | S (route: new cookie; the presented session refused afterwards) | 4 | 3 |
| 6 | Core | "Use a recovery code" accepts a recovery code once | CAP-2 | B (signs in; same code refused next time) | 8 | 3 (S: once, two at once), 5 (H) |
| 7 | Core | The account page shows how many recovery codes remain | CAP-2 | B (10, then 9 after one is used) | 7 | 2 (state read) |
| 8 | Core | Fresh set with password and a current code; the old set stops working (CA-13) | CAP-2 | S (route: wrong password, wrong code refused; old code refused, new accepted) | 4 | 2 (store), 7 (B) |
| 9 | Core | After accepting an invitation, set-up is offered and can be skipped | CAP-8 | B (offer shown when available; skip opens the app; set-up from the offer turns it on) | 7 | — |
| 10 | Core | Recovery codes stored only as hashes | CAP-2 | S (table: 64-hex hashes, no code) | 2 | 1 (normalise and hash) |
| 11 | Core | Secret stored encrypted with the deployment key that the deploy command generates and supplies (CA-14) | CAP-10 | S (row holds `v1.` ciphertext, no secret bytes; decrypts only with the key) | 2 | 1 (cipher), 4 (key passed on), 5 (H), 6 (supplies), 9 (C: check 1 of the run of 2026-11-24, the command generated and supplied the key, passed) |
| 12 | Core | The deploy command prints the key once, at creation, with the keep-a-copy instruction | CAP-11 | U (`runDeploy` with fakes: printed once, before the put; not on a second run) | 6 | 9 (C: check 1 of the run of 2026-11-24, passed) |
| 13 | Core | An operator-supplied key is used and none generated | CAP-11 | U | 6 | 9 (C, second Worker: check 6 of the run of 2026-11-24, passed) |
| 14 | Refusals | An accepted code is refused if used again | CAP-5 | S (same step, and the next step's window; two pending sign-ins with one code sign in once) | 3 | 1 (last-step rule), 2 (at set-up) |
| 15 | Refusals | Wrong codes and recovery codes share the limit and wait of wrong passwords (CA-15) | CAP-6 | S (email, marker, address counts; wait; clearing) | 3 | 2 (account actions, D-5) |
| 16 | Refusals | Turning off asks for the password | CAP-7 | S (route: wrong password refused, still on) | 4 | 2, 7 (B) |
| 17 | Refusals | Turning on with a wrong password is refused | CAP-1 | S (route: refused, nothing stored) | 4 | 2 |
| 18 | Refusals | Pending token refused after expiry, for anything else, or from another browser (CA-46) | CAP-4 | S (route: no cookie, other browser's, expired; as a session cookie; to session read, invite, account actions) | 4 | 3 |
| 19 | Refusals | Second step from another origin or without the header refused (standing rule 13) | CAP-9 | S (and every new account action; declaration sweep's pinned list) | 4 | — |
| 20 | Refusals | Neither the secret nor a recovery code in any reply after set-up | CAP-9 | S (route sweep; `console` watch) | 4 | 2, 7 (B: leak test on the page) |
| 21 | Refusals | Key generated only when absent: a test deploys again and signs in with a code set up before | CAP-11 | C | 9 | 6 (U) |
| 22 | Refusals | The deploy command finds an existing key in the secret list and never replaces it (CA-52) | CAP-11 | U (fake list with the key: no put; supplied key not used) | 6 | 9 (C: check 3 of the run of 2026-11-24, passed) |
| 23 | Refusals | Fingerprint stored; a mismatched key reads and writes no encrypted value and says so (CA-52) | CAP-10 | S (key guard given another key, and none: refusals, state read, log line) | 1 | 2 (encrypted ops), 4 (route message), 5 (H: restart with another key), 7 (B: My account message) |
| 24 | Limits | 10 recovery codes in a set (CA-11) | CAP-2 | S | 2 | 1 (constant) |
| 25 | Limits | Pending token lasts 5 minutes (CA-46) | CAP-4 | S (injected time: live at 5 min − 1 ms, refused at 5 min) | 3 | 4 (`Max-Age=300`) |
| 26 | Limits | 6 digits, 30-second step, one step either side (CA-12) | CAP-5 | S (RFC 6238 vectors; steps −2, −1, 0, +1, +2) | 1 | 3 |
| 27 | Limits | Numeric keypad and code autofill on a phone | CAP-13 | B (attributes in WebKit iPhone) | 8 | 7 (set-up field); 9 (optional phone check); real phone in story 10.6 (D-20) |
| 28 | Access and restore | A revision restore leaves two-step set-up and recovery codes unchanged | CAP-12 | S (operation sweep over the two-step tables) | 2 | 3 |
| — | Standing rule 15 | Browser tests and axe for My account, the offer and the second step | CAP-14 | B | 7 and 8 (each for its screens) | — |
| — | Standing rule 7 | The self-hosted smoke suite covers the new area | CAP-10, CAP-3 | H | 5 | — |
| — | Spec 6's rulings (2026-11-22) | The pinned Wrangler's secret list output, failed and non-interactive secret commands, how long key-state replies differ after a put, and the deploy command's restore paths, shown for real (checks 9 to 14, added 2026-11-23) | CAP-11 | C | 9 | 6 (U, fakes) |
| — | Deferred work | Marker count and clearing for second-step failures; hash queue for account actions | CAP-6 | S | 3 (sign-in), 2 (account actions) | 4 (busy refusal) |

Notes on two criteria:
- **Criterion 23** (finding 38): deleting a ciphertext, as turning off does under a mismatch, is neither reading nor writing an encrypted value; D-15 keeps it working on purpose, with recovery codes (hashes), so that people keep a way in.
- **Criterion 27** (finding 20): the automated part (the attributes the browser acts on) is spec 8's; the real-phone part is deferred to story 10.6 under standing rule 15 (D-20 as amended, recorded in `.memlog.md` and `deferred-work.md`), and spec 9 offers Kevin an optional check on his phone during the deployed run. In spec 9's run of 2026-11-24 that check was declined (no terminal), so the real-phone part stays with story 10.6 (orchestrator ruling of 2026-11-24, Claude, accepted on Kevin's instruction).

Owners: spec 1 owns 23, 26; spec 2 owns 10, 11, 24, 28; spec 3 owns 4, 14, 15, 25; spec 4 owns 3, 5, 8, 16, 17, 18, 19, 20; spec 5 owns no criterion (standing rule 7's smoke evidence, supporting 3, 6, 11 and 23); spec 6 owns 12, 13, 22; spec 7 owns 1, 2, 7, 9; spec 8 owns 6, 27; spec 9 owns 21. Every criterion has one owner; every capability is reached (CAP-14 from standing rule 15). The Covers line (FR-67 two-step verification, AD-12, AD-17, AD-21 deployment key, D14, S-26, S-27, S-29) is met by CAP-1 to CAP-13.
