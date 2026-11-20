# Acceptance trace: story 1.3 criteria to capabilities

Each criterion of story 1.3 (epics draft 0.7) in the story's order, with the capability whose `success` proves it and the spec (from `stories.yaml`) that delivers the evidence. The criteria are shortened here; the story's wording governs. "Where checked": S = server test in Cloudflare's runtime (`server-tests/`), B = Playwright browser test in desktop Chromium and WebKit iPhone (`browser-tests/`), D = deployed Cloudflare test installation, H = self-hosted smoke test under workerd, U = unit test in Node (`tests/`).

| # | Group | Criterion (short) | CAP | Where checked | Spec |
|---|---|---|---|---|---|
| 1 | Core | With an administrator, anyone not signed in sees the sign-in page with the installation's name | CAP-1 | B; S (public session route returns the name) | 2, 3 |
| 2 | Core | The story 1.2 administrator signs in with email and password | CAP-2 | S, B, H, D | 2, 3, 4 |
| 3 | Core | Cookie: HttpOnly, Secure, SameSite=Lax, `__Host-` plus installation identifier, no Domain, path `/` | CAP-3 | S (`Set-Cookie` parsed); D (observed on `https://`) | 2, 4 |
| 4 | Core | Server stores only a hash of the token; a new token at each sign-in (CA-47) | CAP-3 | S (sessions table read; two sign-ins, two tokens) | 1, 2 |
| 5 | Core | Account menu in the existing header shows the name and Sign out | CAP-4 | B | 3 |
| 6 | Core | Sign out ends the session; a later request with its cookie is refused | CAP-5 | S, B | 2, 3 |
| 7 | Refusal | Wrong email or password: one message, whether or not the email has an account | CAP-2 | S (identical status, code and body), B (message shown) | 2, 3 |
| 8 | Refusal | Unknown email checked against a stand-in hash; medians of 20 refusals per case within 100 ms (CA-58) | CAP-6 | S (timing test) | 2 |
| 9 | Refusal | After repeated failures attempts wait, and the page says how long (CA-07) | CAP-7 | S (wait and seconds), B (wait stated) | 1, 2, 3 |
| 10 | Refusal | The wait is the same for an email with no account | CAP-7 | S | 1, 2 |
| 11 | Refusal | A successful sign-in clears that email's count | CAP-7 | S | 1, 2 |
| 12 | Refusal | Counts by email and by address in installation storage, not from logs, so they apply to unknown emails (CA-43) | CAP-7 | S (store tests, restart) | 1 |
| 13 | Refusal | Counted before the check, lowered only when correct; attempts sent at once cannot all pass (CA-43) | CAP-7 | S (simultaneous attempts) | 1, 2 |
| 14 | Refusal | Marker: while an email waits, a browser with its marker is held only per address; test locks then signs in (CA-44) | CAP-8 | S (marker cookie sent by the test) | 1, 2 |
| 15 | Refusal | Cookie requests that change anything, and sign-in, refused without the app's origin and header (standing rule 13) | CAP-9 | S (sign-in, sign-out) | 2 |
| 16 | Refusal | Account of one deployed installation cannot sign in to another; a cookie from one is refused by the other | CAP-10 | D (two Workers); S (foreign identifier or unknown token refused) | 2, 4 |
| 17 | Refusal | Two installations on one host with different ports each keep their own session | CAP-10 | B (two local servers, one browser context) | 3 |
| 18 | Limits | Failure message reads "That email and password do not match." | CAP-2 | S (refusal wording), B (on screen) | 2, 3 |
| 19 | Limits | Wait starts after 5 in a row for one email or 20 from one address within 15 minutes (CA-07) | CAP-7 | S (pure rule tests and store tests; D-2) | 1 |
| 20 | Limits | Wait is 1 minute, doubling to 15 minutes (CA-07) | CAP-7 | S | 1 |
| 21 | Limits | Fields labelled, 16 px text, password-manager fillable | CAP-1 | B (labels, computed font size, `autocomplete` and `name` attributes) | 3 |
| 22 | Access and restore | A revision restore leaves sessions unchanged | CAP-11 | S (sessions only in the installation object; no restore operation writes it) | 1 |
| 23 | Evidence | Deployed: scrypt accepted without platform error; median sign-in under 1 s over 20 (CA-08) | CAP-12 | D | 4 |
| 24 | Evidence | Deployed: of 25 wrong sign-ins for one email at once, at most 5 checked, 20 receive the wait (CA-43) | CAP-12 | D; S (same shape locally) | 2, 4 |
| 25 | Evidence | A password hash made on one host verifies on the other | CAP-13 | S, H, D (committed fixture and probes, D-6) | 2, 4 |
| — | Standing rule 15 | Browser tests for the screens, Chromium and WebKit iPhone, axe clean on sign-in page and account menu | CAP-14 | B; CI job | 3 |
| — | D-9 | Set-up done page: "Sign in with the email and password you just chose." with a Sign in link; two story 1.2 assertions updated | CAP-14 | B | 3 |

Every capability is reached by at least one criterion; CAP-14 comes from standing rule 15 rather than a story criterion. The story's Covers line (FR-67 sign-in and sign-out, NFR-5, AD-12, R9, S-26) is met by CAP-1 to CAP-13.
