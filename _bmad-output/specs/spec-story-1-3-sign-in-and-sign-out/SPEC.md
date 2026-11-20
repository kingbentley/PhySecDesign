---
id: SPEC-story-1-3-sign-in-and-sign-out
status: decisions frozen (D-1 to D-10, Kevin, 2026-11-20); awaiting an adversarial review before it is marked ready for development
companions:
  - acceptance-trace.md
  - brownfield.md
  - ../spec-story-1-2-set-up-a-new-installation/SPEC.md
  - ../../planning-artifacts/epics/epics-PhySecDesign-2026-11-18/epics.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/cloudflare-limits.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md
  - ../../implementation-artifacts/epic-1-context.md
  - ../../implementation-artifacts/deferred-work.md
  - ../../../site-studio/AGENTS.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete contract for what to build, test, and validate. Source documents are for traceability only.

# Story 1.3: Sign in and sign out

The acceptance contract is story 1.3 of epics draft 0.7 (`epics.md`, "### Story 1.3"), read with standing rules 1–15 and the definition of done. Where this spec summarises a criterion, the story's wording governs. `acceptance-trace.md` maps all 25 criteria to capabilities. Story 1.2's decisions (its `SPEC.md`) still hold, except its D-10, which D-9 below amends; story 1.2's D-9 (Unicode) binds this story directly. In this file a bare "D-n" is one of this story's decisions; story 1.2's are written "story 1.2's D-n".

**Status: decisions frozen, not ready for development.** Kevin ruled on all ten open questions on 2026-11-20 (Decisions below). The spec awaits an adversarial review before it is marked ready for development.

## Why

A mandate and a foundation. FR-67 and NFR-5 require that only an account's owner can act as it, that a wrong password reveals nothing about which emails have accounts, and that repeated failures are slowed. Story 1.2 left an installation with one administrator who cannot sign in: after set-up the prototype opens to anyone. Every later Epic 1 story (invitations, two-step verification, My account, the access gate) acts on a signed-in account, so sessions, the sign-in page and sign-out come next.

## Capabilities

- **CAP-1**
  - **intent:** Once an administrator exists, anyone not signed in meets the sign-in page (S-26), which names the installation.
  - **success:** Opening an installation that has an administrator, without a session, shows the sign-in page headed "Sign in to ‹installation name›", with no prototype. The fields "Email" and "Password" are labelled, use 16 px text and are filled by a password manager (`autocomplete` `username` and `current-password`); the button reads "Sign in"; there is no "Forgot password" link (D-8). While set-up is open, the set-up page shows as before. When the session cannot be read, the prototype opens, and reviewer hash links open without sign-in (D-7).
- **CAP-2**
  - **intent:** An account holder signs in with email and password, and a failure reveals nothing about which emails have accounts.
  - **success:** The administrator from story 1.2 signs in. The email is compared after `normaliseEmail` and the password checked after `normalisePassword` against the stored scrypt hash with its stored parameters (story 1.2's D-9). A wrong email or a wrong password gets one refusal, "That email and password do not match.", with the same code, status and body whether or not the email has an account.
- **CAP-3**
  - **intent:** A signed-in browser holds a session that scripts cannot read, that only this installation receives, and that the server cannot leak.
  - **success:** The `Set-Cookie` of a sign-in is `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age` 30 days, with no `Domain`, named `__Host-` plus the installation's random identifier, which the installation object creates once and keeps (D-1). Storage holds only a hash of the token; a test reads the sessions table and finds no token. Two sign-ins issue two different tokens (CA-47). The server records each session's sign-in and last-use times and refuses a session 30 days after its sign-in (D-4).
- **CAP-4**
  - **intent:** The signed-in user can see who they are and sign out from the existing header.
  - **success:** The app header shows an account menu with the user's name and Sign out, on desktop and on the iPhone viewport.
- **CAP-5**
  - **intent:** Sign out ends the session for good.
  - **success:** After Sign out, the session cookie is cleared, the sign-in page shows, and a request that carries the old cookie is refused as not signed in. The marker stays (D-3).
- **CAP-6**
  - **intent:** The time a refusal takes does not reveal whether an email has an account.
  - **success:** For an email with no account, the password is checked against a fixed stand-in hash with the same scrypt parameters, through the same hash queue as a real check (D-5). A test finds the median times of 20 refusals for each case within 100 ms of each other (CA-58).
- **CAP-7**
  - **intent:** Repeated failed sign-ins are slowed, for every email and every address alike, and the limit holds under attempts sent at once.
  - **success:**
    - After 5 failures in a row for one email, further attempts wait 1 minute × 2^(n−5), at most 15 minutes, after the last failure. An email's count clears 15 minutes after its wait ends (D-2, CA-07).
    - Address failures are counted over a rolling 15 minutes. At 20 or more, attempts from that address wait 1 minute × 2^(n−20), at most 15 minutes, after the last failure (D-2, CA-07).
    - Attempts during a wait are refused and not counted (D-2).
    - The page says "Too many attempts. Wait ‹duration› before trying again." The wait and its wording are the same for an email with no account (D-8).
    - A successful sign-in clears that email's count and removes its own attempt from the address count; the rest of the address count stays (D-2).
    - Counts by entered email and by network address are kept in the installation object's storage, never read from a log, and so apply equally to an email with no account (CA-43).
    - An attempt is counted before its password is checked and the count is lowered only when the password proves correct, so of attempts sent at once no more than the limit are checked (CA-43).
- **CAP-8**
  - **intent:** Someone who knows an email cannot lock its owner out of a browser the owner has signed in from.
  - **success:** After a successful sign-in the browser holds a marker: an `HttpOnly`, `Secure`, `__Host-` cookie with the account's identifier and an expiry, signed with HMAC-SHA-256 under a random key kept in the installation object. It lasts 1 year, is renewed at each sign-in, is kept on sign-out, and a browser holds one, for the account last signed in (D-3). While that email is in a wait, an attempt carrying its valid marker is held and counted only per address (D-2). A test locks an email from one address, then signs in with the correct password from a browser holding the marker (CA-44).
- **CAP-9**
  - **intent:** Another site cannot sign a person in to an account of its choosing, or sign them out.
  - **success:** The sign-in request, the sign-out request and any other request that changes anything with a session cookie are refused (`origin_refused`) unless their `Origin` equals the app's origin and they carry the app's header (standing rule 13).
- **CAP-10**
  - **intent:** Installations share no sign-in.
  - **success:** Of two test installations deployed from one build, an account of one cannot sign in to the other, and a session cookie from one is refused by the other. Two installations on one host name with different ports each keep their own session: signing in to one does not sign the person out of the other.
- **CAP-11**
  - **intent:** Sessions are outside project revisions.
  - **success:** A revision restore leaves sessions unchanged. Sessions live only in the installation object, which no restore path writes (standing rule 9).
- **CAP-12**
  - **intent:** Sign-in works and holds its limits on real Cloudflare.
  - **success:** On a deployed Cloudflare test installation: the scrypt hash is accepted without a platform error (R9); sign-in completes in under 1 second at the median of 20 sign-ins (CA-08); of 25 wrong sign-ins for one email sent at once over several connections, at most 5 are checked against the password and the other 20 receive the wait (CA-43).
- **CAP-13**
  - **intent:** A password hash made on one host verifies on the other.
  - **success:** A committed known-answer fixture (salt, hash and parameters for a test password) verifies in the server tests, under the self-hosted runtime through a small probe bundle run by the smoke test, and on Cloudflare through a throwaway probe Worker on the test account, deleted afterwards (D-6).
- **CAP-14**
  - **intent:** The sign-in page and the account menu get repeatable browser tests.
  - **success:** Playwright tests in `site-studio/browser-tests/`, in desktop Chromium and WebKit with an iPhone viewport, sign in and find the account menu with the name, sign out and find the sign-in page, and show a wrong password refused with the one message and a wait stated. axe finds no serious or critical violation on the sign-in page or with the account menu open (standing rule 15). The set-up done page's next step reads "Sign in with the email and password you just chose." with a Sign in link (D-9).

## Constraints

- One server build for both hosts. Host-specific code only behind `server/files/` and `server/update/` (plus story 1.2's D-1/D-8 transport code), exactly two Durable Object classes, and no D1, Workflows, Queues, scheduled-trigger or KV bindings (AD-16, standing rule 7).
- Every new route is under `/api/v1/` and declared in `shared/routes.ts` with input and reply schemas. A refusal carries a reason code, may name a field or a wait in seconds, and never repeats an entered value (AD-22).
- Sign-in failure counts live in the installation object's SQLite storage and are raised before the password is checked. A count in a Worker's own memory is only an extra guard (CA-43).
- The password, its hash, the session token, the marker and the email of a failed attempt never appear in logs, replies or refusals. Only hashes of session tokens are stored (NFR-5, AD-17).
- Passwords are checked as `normalisePassword(password)` and emails compared as `normaliseEmail(email)`, from `shared/setup.ts` (story 1.2's D-9).
- One scrypt hash runs at a time per Worker isolate: real checks, stand-in checks and set-up hashing share one queue (D-5).
- `Secure` is always set on the session and marker cookies, on every host and in local runs (D-10).
- Rules the page and the server share are written once in `shared/`, in TypeScript, with tests (standing rule 6). The app stays JavaScript; `shared/` and `server/` stay TypeScript. Dependency versions are exact. Tests that existed before story 1.2 are unchanged; of story 1.2's browser tests, only the two assertions D-9 changes are updated.
- `callObject` keeps story 1.2's D-2 as amended: reads may be retried once after any reset; writes (counting an attempt, creating or ending a session) only on the shown version-stop reason.
- New screen parts meet UX section 10 (4.5:1 contrast, a visible 2 px focus ring, labelled 16 px fields, usable at 200% zoom) in the white and teal direction with `BrandMark` (standing rule 5).
- Browser tests cover flows and on-screen refusals. Limits, timing, cookie attributes and the marker are tested in server tests in Cloudflare's runtime (standing rule 15).
- Criteria that name a deployed Cloudflare test installation are checked there, on the "PhySec Site Studio" test account (definition of done).

## Non-goals

- Invitations (story 1.4).
- The second sign-in step and its pending token, CA-46 (story 1.5).
- My account, the session list, the idle limit CA-18, sign out everywhere, and the pending-input warning on sign-out CA-48 (story 1.6).
- The access gate and route classes (story 1.8); deactivation (story 1.9).
- The recovery code clearing the wait (story 1.13); activity-log entries for sign-in (story 1.14).
- "Forgot password" (story 1.17); access tokens (story 1.19).
- Refusing sign-in while an update record exists (story 9.3, AD-20).
- Self-hosted proxy address rules (story 2.22).
- Moving project data to the server (Epic 2). Until then the browser's local project stays for whoever signs in next on that browser (D-7).

## Success signal

- On a deployed Cloudflare test installation, the administrator opens the `https://` address, sees the sign-in page with the installation's name, signs in, finds their name in the account menu, signs out, and the old cookie is then refused. Wrong passwords show one message and then a wait.
- In local and CI runs, the server tests show the cookie attributes, the timing parity, the limits under simultaneous attempts and the marker; the Playwright suite shows sign-in and sign-out passing in Chromium and WebKit with axe clean.

## Assumptions

- The Worker, not the installation object, runs scrypt, as at set-up. The object counts the attempt and returns the stored hash or a stand-in signal with a one-time ticket. The Worker verifies. A second object call consumes the ticket and, on success, lowers the counts, clears the email's count and stores the new session's hash.
- The sign-in schema refuses only a missing, empty or over-long email or password (`invalid_input`, not counted). Any other value takes the one-message path, so a password that breaks the set-up rules is simply wrong.
- Counts by email are keyed by the normalised email and stored as its SHA-256, so storage keeps no list of typed addresses.
- Signing in from a browser that already holds a session for this installation ends that earlier session, so a planted token cannot survive sign-in.
- An account with `active = 0` gets the one message. Deactivation itself is story 1.9.
- A public read route reports whether the caller is signed in, the account's name if so, and the installation's name. The sign-in page shows that name to anyone, so this reveals nothing more.
- The network address is set-up's `clientAddressKey` (`CF-Connecting-IP`, IPv6 by /64, absent gives one shared bucket).
- New installation-object tables are created if absent under data format 1. Pre-release installations are re-created, not converted (standing rule 8).
- The installation identifier (D-1) is created when the installation object is first created, before set-up, and never changes.
- Until story 1.6, last use is recorded at sign-in and on the session read the app makes when it opens (D-4).
- The wait's duration is worded as at set-up ("2 minutes 30 seconds", `waitWording`) (D-8).
- "Two installations on one host with different ports" is a browser cookie-jar behaviour, checked by a local browser test against two local servers in one browser context. `workers.dev` addresses cannot differ by port.
- "A cookie from one installation is refused by the other" and "an account cannot sign in to the other" are checked on two deployed test Workers, as in story 1.2 spec 4, with a local server test that a cookie under a foreign installation identifier or an unknown token is refused.
- Sign-in is not yet refused during an update: the update record arrives with story 9.3.

## Decisions (Kevin, 2026-11-20)

Kevin accepted every recommended option for the ten open questions ("Accept all 10 and then run an adversarial review using a bmad workflow on the story before we proceed", relayed by the orchestrator session).

- **D-1** (was OQ-1) The cookie name carries a random identifier that the installation object creates once and keeps. It differs for two installations of one build on one host with different ports and does not change with the public address.
- **D-2** (was OQ-2) (i) A per-email count clears 15 minutes after its wait ends, as story 1.2's D-3. (ii) Address failures are counted over a rolling 15 minutes; the wait is 1 minute × 2^(n−20), at most 15 minutes, after the last failure (1 minute × 2^(n−5) for an email). (iii) Attempts during a wait are refused and not counted. (iv) A success removes its own attempt from the address count; the rest stays. (v) An attempt carrying a valid marker for the entered email counts per address only.
- **D-3** (was OQ-3) The marker is an `HttpOnly`, `Secure`, `__Host-` cookie holding the account's identifier and an expiry, signed with HMAC-SHA-256 under a random key kept in the installation object. It lasts 1 year, is renewed at each sign-in, is kept on sign-out, and a browser holds one, for the account last signed in.
- **D-4** (was OQ-4) The session cookie's `Max-Age` is 30 days. The server records sign-in and last-use times and refuses a session 30 days after sign-in (CA-47). The idle limit (CA-18) waits for story 1.6.
- **D-5** (was OQ-5) One scrypt hash at a time per Worker isolate, through a queue used alike for real, stand-in and set-up hashes.
- **D-6** (was OQ-6) A committed known-answer fixture is verified by the server tests, by the self-hosted smoke test through a small probe bundle under workerd, and on Cloudflare by a throwaway probe Worker on the test account, deleted afterwards.
- **D-7** (was OQ-7) When the session cannot be read, story 1.2's D-5 behaviour stays: the prototype opens. Reviewer hash links open without sign-in. The browser's local project stays for whoever signs in next on that browser until Epic 2.
- **D-8** (was OQ-8) Heading "Sign in to ‹installation name›"; labels "Email" and "Password"; button "Sign in"; the wait "Too many attempts. Wait ‹1 minute› before trying again.", the same for every email; no "Forgot password" link until story 1.17.
- **D-9** (was OQ-9; amends story 1.2's D-10) The set-up done page says "Sign in with the email and password you just chose." with a Sign in link, in place of "Signing in arrives in a coming update; until then the app opens as before." The two `setup.spec.mjs` assertions on that text and on the prototype opening after set-up are updated. Story 1.2's `SPEC.md` is not edited; the amendment is recorded here.
- **D-10** (was OQ-10) Spec 3 first checks whether WebKit keeps a `Secure` cookie on `http://127.0.0.1`. If it drops it, the local test servers are served over HTTPS (Wrangler's local HTTPS, `ignoreHTTPSErrors` in Playwright). `Secure` is never omitted.

## Notes for Kevin

Points that writing the rulings down showed are not settled. None is decided here; the implementing specs follow the assumptions above unless Kevin rules otherwise.

- **D-2 (ii) leaves a gap like the one story 1.2's D-3 was amended for.** With a rolling 15-minute address window and a 15-minute maximum wait, an address that waits out a 15-minute wait finds its earlier failures gone from the window and gets about 20 fresh attempts. The address limit is therefore about 20 attempts per 15 to 30 minutes.
- **D-3 and shared browsers.** One marker per browser means two people sharing a browser displace each other's marker. Whether a password change (story 1.6) or a reset (stories 1.11, 1.17) invalidates markers is not settled.
- **D-4 last use.** Which requests count as use before story 1.6 is not settled; AD-12 says only deliberate actions count. The assumption above records it at sign-in and on the app's opening session read.
- **D-1 timing.** D-1 does not say when the identifier is created; the assumption above creates it with the installation object.
- **D-8 duration format.** "‹1 minute›" leaves the format open; the assumption above reuses set-up's wording.
- **Decision labels.** This story's D-1 to D-10 reuse the labels of story 1.2's decisions; this spec writes "story 1.2's D-n" for those.
