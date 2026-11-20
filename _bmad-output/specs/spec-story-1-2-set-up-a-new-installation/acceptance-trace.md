# Acceptance trace: story 1.2 criteria to capabilities

Each criterion of story 1.2 (epics draft 0.7) is listed in the story's order, with the capability whose `success` proves it. The criteria are shortened here; the story's wording governs. "Where checked" says where the evidence comes from: S = server test in Cloudflare's runtime, B = Playwright browser test, D = deployed Cloudflare test installation, C = CI run.

| # | Group | Criterion (short) | CAP | Where checked |
|---|---|---|---|---|
| 1 | Core | Deploy command generates a random code, supplies it as a secret, prints it once (CA-01) | CAP-1 | D; script unit test |
| 2 | Core | No users: the set-up page is shown | CAP-3 | B |
| 3 | Core | Asks for code, installation name, admin name, email, password | CAP-3 | B |
| 4 | Core | States that the page disappears once an administrator exists | CAP-3 | B |
| 5 | Core | Exactly one administrator; confirms the installation name and admin email | CAP-4 | S, B |
| 6 | Core | Records the public address from where set-up was opened (CA-57) | CAP-4 | S |
| 7 | Core | Password stored only as scrypt N=131,072 r=8 p=1, 32 bytes, parameters beside it | CAP-6 | S |
| 8 | Core | Deploy command asks a public open/closed route and issues a code only when open (CA-52) | CAP-1, CAP-2 | S (route), D (command) |
| 9 | Refusal | Once a user exists, the page and request are refused and the code stops working | CAP-3 | S, B |
| 10 | Refusal | Wrong or missing code refused | CAP-7, CAP-5 | S, B (wrong) |
| 11 | Refusal | Other origin or missing app header refused (standing rule 13) | CAP-8 | S |
| 12 | Refusal | Two simultaneous requests create one administrator | CAP-4 | S |
| 13 | Refusal | Redeploy with an administrator: no code, set-up stays closed | CAP-1 | D |
| 14 | Refusal | Redeploy with no users: new code, earlier code stops working (CA-02) | CAP-1 | D; S (fingerprint change) |
| 15 | Refusal | Deployed: plain HTTP redirected or refused | CAP-9 | D (D-1) |
| 16 | Refusal | Two installations from one build: set-up on one leaves the other open with its own code | CAP-10 | D |
| 17 | Limits | Code at least 20 characters (CA-01) | CAP-1 | script unit test |
| 18 | Limits | Password 12–128, not equal to email, no composition rules (CA-03) | CAP-5 | S (shared rule test), B (one shown error optional) |
| 19 | Limits | Installation name 1–80 (CA-04) | CAP-5 | S |
| 20 | Limits | 5 wrong per address: 1 min wait doubling to 15 min; page says how long (CA-05) | CAP-7 | S, B (wait shown) |
| 21 | Limits | 100 wrong per hour from all addresses: all refused until the hour passes (CA-05) | CAP-7 | S (D-3) |
| 22 | Limits | Counts in installation storage, raised before the check, hold across copies, restart and simultaneous requests (CA-43) | CAP-7 | S |
| 23 | Limits | New code resets the count; waiting message says redeploying issues a fresh code (CA-45) | CAP-7, CAP-1 | S, B (message) |
| 24 | Access and restore | Revision restore leaves accounts and installation name unchanged | CAP-11 | S |
| 25 | Evidence | Playwright set up, pinned, built app on local Cloudflare runtime, Chromium + WebKit iPhone, empty storage | CAP-12 | C |
| 26 | Evidence | Browser test completes set-up; another shows a wrong code refused with the wait | CAP-12 | B |
| 27 | Evidence | axe: no serious or critical violation on the set-up page | CAP-12 | B |
| 28 | Evidence | CI installs browsers, runs on push and PR, keeps a trace on failure | CAP-12 | C |
| — | Notes | Local set-up code supplied as a local secret, never committed | Constraints | C |

Every capability is reached by at least one criterion. CAP-12's "a deliberately broken set-up page makes the tests fail" comes from the success criteria of the 2026-11-20 browser-tests sprint change proposal.
