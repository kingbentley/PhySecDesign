# Acceptance trace: story 1.4 criteria to capabilities and specs

Each of the 16 criteria of story 1.4 (epics draft 0.7), in the story's order, with the capability whose `success` proves it and the one spec that owns it: the spec whose acceptance criteria declare it met. An earlier spec may supply a building-block test, named under "Supporting". The criteria are shortened; the story's wording governs. "Where checked": S = server test in Cloudflare's runtime (`server-tests/`), B = Playwright test in desktop Chromium and WebKit iPhone (`browser-tests/`), U = unit test in Node (`tests/`), H = self-hosted smoke test. No criterion names a deployed installation (D-12).

| # | Group | Criterion (short) | CAP | Where checked | Owner | Supporting |
|---|---|---|---|---|---|---|
| 1 | Core | An administrator's account menu holds "Invite a person", which opens the invite panel | CAP-1 | B | 3 | 2 (`role` in the session reply) |
| 2 | Core | An administrator invites by email, name and role and receives a link to copy | CAP-1 | B (link read from the panel, Copy checked), S | 3 | 1 (store), 2 (route: link on the public address) |
| 3 | Core | The invitation page shows who invited the person and the installation's name | CAP-3 | B | 3 | 2 (invitation read) |
| 4 | Core | The person sets a name and a password and is signed in | CAP-3 | S (accept sets session and marker cookies; the session read names the new account; a presented session ends) | 2 | 1 (`acceptInvitation`), 3 (browser flow) |
| 5 | Core | The password meets story 1.2's rules and the page shows each rule as it is met | CAP-4 | B (rule list changes as typed), S (spec 1's `passwordRules`; spec 3's rule-list text, review finding 8) | 3 | 2 (server refusal of a short password and of one equal to the email) |
| 6 | Core | The new password is stored in story 1.2's form | CAP-4 | S (users row: scrypt, N, r, p, 32 bytes, parameters beside the hash; `verifyPassword`; the person then signs in) | 2 | — |
| 7 | Core | The secret follows standing rule 14: length checked, only its hash stored, absent from the address bar after opening and from the runtime log (CA-55) | CAP-2 | S (43 base64url characters = 32 bytes; table holds the hash only; `console` watch), B (address bar, also when set-up cannot be checked; `referrer-policy` on the `/invite` responses), H (self-hosted smoke check of `GET /invite`) | 3 | 1 (length, hash only), 2 (log watch, `Referrer-Policy` header with both `ASSETS` stubs) |
| 8 | Refusals | No open registration: no page or request creates an account without an invitation | CAP-6 | S (route sweep recording the operations each route calls: only `setup` reaches `createFirstAdministrator`, only `acceptInvite` reaches `acceptInvitation`; review finding 6) | 2 | 1 (operations that insert into `users`) |
| 9 | Refusals | Accepting from another origin, or without the app's header, is refused (standing rule 13) | CAP-6 | S | 2 | — |
| 10 | Refusals | An invitation works once | CAP-5 | S (second accept refused; two accepts at once create one account) | 1 | 2 (route) |
| 11 | Refusals | A used or expired link says so and says to ask an administrator for a new one | CAP-5 | B (used link live; expired with a mocked read) | 3 | 1, 2 (`invitation_unusable`) |
| 12 | Refusals | Inviting an email that has an account is refused and the administrator told (CA-10) | CAP-7 | S (refusal: `invitation_email_taken`, field `email`, wording), B (panel message; review finding 18) | 2 | 1 (store), 3 (panel shows it) |
| 13 | Refusals | Re-inviting an email with an unused invitation replaces the earlier link, which stops working (CA-10) | CAP-5 | S | 1 | — |
| 14 | Refusals | A standard user's menu has no "Invite a person", and a standard user's invite request is refused | CAP-6 | B (menu), S (`administrator_only`) | 3 | 1 (check in the operation), 2 (route) |
| 15 | Limits | An invitation expires 7 days after it is issued (CA-09) | CAP-1, CAP-5 | S (injected time just under and just over 7 days) | 1 | — |
| 16 | Access and restore | A revision restore leaves invitations unchanged | CAP-8 | S (only the listed operations touch the invitations table) | 1 | — |
| — | Standing rule 15 | Browser tests and axe for the invite panel and the invitation page | CAP-10 | B | 3 | — |
| — | Deferred work | Accounts told apart by `accountId`; another account in another tab reloads the app | CAP-9 | B (fourth deliberate breakage, review finding 19), S, U (`readSession` and `isSessionReply`, review finding 2) | 3 | 2 (reply field) |

Owners: spec 1 owns 10, 13, 15, 16; spec 2 owns 4, 6, 8, 9, 12; spec 3 owns 1, 2, 3, 5, 7, 11, 14. Every capability is reached; CAP-9 comes from deferred work and CAP-10 from standing rule 15. The story's Covers line (FR-67 invitation, AD-12, S-27, the S-30 invite panel) is met by CAP-1 to CAP-8.
