---
id: SPEC-story-1-3-sign-in-and-sign-out
status: not ready for development (decisions D-1 to D-10 frozen, Kevin, 2026-11-20; review applied in part; nine rulings pending, H-1 to H-9)
companions:
  - acceptance-trace.md
  - brownfield.md
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

# Story 1.3: Sign in and sign out

The acceptance contract is story 1.3 of epics draft 0.7 (`epics.md`, "### Story 1.3"), read with standing rules 1–15 and the definition of done. Where this spec summarises a criterion, the story's wording governs. `acceptance-trace.md` maps all 25 criteria to capabilities. Story 1.2's decisions (its `SPEC.md`) still hold, except its D-10, which D-9 below amends, and its D-5, which this story amends: after set-up a signed-out visitor sees the sign-in page, not the prototype. Story 1.2's D-9 (Unicode) binds this story directly. In this file a bare "D-n" is one of this story's decisions; story 1.2's are written "story 1.2's D-n".

**Status: not ready for development.** Kevin's decisions D-1 to D-10 are frozen. Three independent reviews (`review-adversarial.md`, `review-edge-cases.md`, `review-verification-gaps.md`; findings cited A-n, E-n, V-n) were applied in part on 2026-11-20. The findings that overlap later stories are held for nine rulings by Kevin (H-1 to H-9 below) and noted in `deferred-work.md`.

## Why

A mandate and a foundation. FR-67 and NFR-5 require that only an account's owner can act as it, that a wrong password reveals nothing about which emails have accounts, and that repeated failures are slowed. Story 1.2 left an installation with one administrator who cannot sign in: after set-up the prototype opens to anyone. Every later Epic 1 story (invitations, two-step verification, My account, the access gate) acts on a signed-in account, so sessions, the sign-in page and sign-out come next.

## Capabilities

- **CAP-1**
  - **intent:** Once an administrator exists, anyone not signed in meets the sign-in page (S-26), which names the installation.
  - **success:**
    - Opening an installation that has an administrator, without a session, shows the sign-in page headed "Sign in to ‹installation name›", with no prototype. The visual source is the S-26 screen on the design canvas (`design-canvas.md`).
    - The fields "Email" and "Password" are labelled, use 16 px text and are filled by a password manager (`autocomplete` `username` and `current-password`). The button reads "Sign in". There is no "Forgot password" link (D-8).
    - While set-up is open, the set-up page shows as before, and the public session read answers `{ signedIn: false, installationName: null }` (E-11).
    - At `/setup` after set-up, a signed-out visitor sees "Set-up is already complete" with its link to `/`, which shows the sign-in page (A-25).
    - When the session cannot be read, the prototype opens, and reviewer hash links open without sign-in (D-7). When the set-up state cannot be read, start-up does not read the session and the prototype opens as today (A-8). What counts as "cannot be read" is held (H-1).
- **CAP-2**
  - **intent:** An account holder signs in with email and password, and a failure reveals nothing about which emails have accounts.
  - **success:**
    - The administrator from story 1.2 signs in. The email is compared after `normaliseEmail` and the password checked after `normalisePassword` against the stored scrypt hash with its stored parameters (story 1.2's D-9). Sign-in succeeds with the email typed in another letter case or with surrounding spaces, and with the password in another Unicode form (V-9).
    - The sign-in input accepts an email of at most 254 code points after `normaliseEmail` and a password of at most 1,024 UTF-16 units before normalisation, so every password set-up accepted can sign in. A 128-emoji password and an NFKC-shrinking (decomposed Hangul) password set at set-up both sign in (A-10, E-10).
    - A wrong email, a wrong password, or the right password for an inactive account gets one refusal, "That email and password do not match.", with the same code, status and body in every case (V-9).
- **CAP-3**
  - **intent:** A signed-in browser holds a session that scripts cannot read, that only this installation's name carries, and that the server cannot leak.
  - **success:**
    - The session cookie is `__Host-<prefix>-<installation id>=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`, with no `Domain`. The identifier is random, created once by the installation object (D-1), survives an object restart and a change of the recorded public address (V-11), and is not cached in a Worker isolate (A-18, E-12).
    - A reply can carry several cookies, appended one by one; a test reads them with `getSetCookie()` after the HSTS copy and finds each (A-9, E-14).
    - Storage holds only a hash of the token; a test reads the sessions table and finds no token. Two sign-ins issue two different tokens (CA-47). Signing in while carrying session X issues a new token and X no longer signs in as the account (V-8; the exact reply for X is held, H-1).
    - The server records each session's sign-in and last-use times and refuses a session 30 days after its sign-in (D-4); tests just under and just over 30 days use an injected time (V-18). Expired sessions are pruned; a session row that no cookie names expires the same way (E-17).
    - Neither the sign-in reply nor the session read contains the token; the sign-in reply equals its declared shape (V-10).
- **CAP-4**
  - **intent:** The signed-in user can see who they are and sign out from the existing header.
  - **success:** The app header shows an account menu with the user's name and Sign out, on desktop and on the iPhone viewport. The trigger and Sign out are at least 44 px on the iPhone viewport and 32 px on desktop (A-24). An 80-character name is truncated in the header, with its full text in the menu and no sideways scroll, also at 200% zoom (E-19).
- **CAP-5**
  - **intent:** Sign out ends the session for good.
  - **success:** After Sign out, the session ends on the server, the session cookie is cleared with its full attributes (`Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`), the browser's cookie store holds no session cookie in either browser, and the sign-in page shows (E-15). The marker stays: the sign-out reply sends no marker `Set-Cookie` (D-3, V-1). Sign-out with an already-ended session, and the reply to a later request carrying the old cookie, are held (H-1, H-8).
- **CAP-6**
  - **intent:** The time a refusal takes does not reveal whether an email has an account.
  - **success:**
    - For an email with no account, or an inactive account, the password is checked against a stand-in hash: a random 16-byte salt and a random 32-byte value with the current parameters, made from no password and never the D-6 fixture, through the same hash queue as a real check (D-5, A-1, E-4).
    - A stand-in check that verifies is still a failure: the ticket marks it, and completion refuses success on it with the one message (A-1, E-4).
    - A test interleaves known-email and unknown-email refusals after a warm-up, 20 of each, and finds the medians within 100 ms of each other (CA-58), each median at least 150 ms. Shown once and recorded in spec 2: the test fails when the stand-in check is skipped (A-21, V-2).
- **CAP-7**
  - **intent:** Repeated failed sign-ins are slowed, for every email and every address alike, and the limit holds under attempts sent at once.
  - **success:**
    - After 5 failures in a row for one email, further attempts wait 1 minute × 2^(n−5), at most 15 minutes, after the last failure. An email's count clears 15 minutes after its wait ends (D-2, CA-07).
    - Address failures are counted over a rolling 15 minutes. At 20 or more, attempts from that address wait 1 minute × 2^(n−20), at most 15 minutes, after the last failure (D-2, CA-07).
    - Attempts during a wait are refused and not counted (D-2).
    - The server's refusal reads "Too many attempts. Wait before trying again." with the wait in seconds; the page says "Too many attempts. Wait ‹duration› before trying again." The wait and its wording are the same for an email with no account (D-8, A-19).
    - A successful sign-in clears that email's count and removes its own attempt from the address count; the rest of the address count stays (D-2).
    - Counts by entered email and by network address are kept in the installation object's storage, never read from a log, and so apply equally to an email with no account (CA-43). An email's key is an HMAC-SHA-256 of the normalised email under a random key kept in the installation object (A-13).
    - Every count row has an indexed clearing time and is pruned in bounded steps; 1,000 distinct email rows leave the work of one attempt unchanged (A-14).
    - An attempt is counted before its password is checked and the count is lowered only when the password proves correct, so of attempts sent at once no more than the limit are checked (CA-43). Attempts sent at once in tests carry no cookies (A-6).
    - Under the self-hosted runtime the counts hold across a restart: one failure before, four after, then the wait (V-17).
- **CAP-8**
  - **intent:** Someone who knows an email cannot lock its owner out of a browser the owner has signed in from.
  - **success:**
    - After a successful sign-in the browser holds a marker: `__Host-<prefix>-m-<installation id>=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`, no `Domain`, holding the account's identifier and an expiry, signed with HMAC-SHA-256 under a random key kept in the installation object. It lasts 1 year, is renewed at each sign-in, is kept on sign-out, and a browser holds one per installation, for the account last signed in there (D-3, A-5, E-13, V-6).
    - Route tests parse the marker's `Set-Cookie`, find a later expiry after a second sign-in and none in the sign-out reply; an expired marker counts as no marker (V-1).
    - While that email is in a wait, an attempt carrying its valid marker is held and counted only per address (D-2). A test locks an email from one address, then signs in with the correct password from a browser holding the marker (CA-44); a Playwright test shows this in a real browser's cookie store (V-1).
- **CAP-9**
  - **intent:** Another site cannot sign a person in to an account of its choosing, or sign them out.
  - **success:** The sign-in request, the sign-out request and any other request that changes anything with a session cookie are refused (`origin_refused`) unless their `Origin` equals the app's origin and they carry the app's header (standing rule 13). A declaration sweep test requires every non-GET route that reads the session cookie to be `appOriginOnly` (V-12).
- **CAP-10**
  - **intent:** Installations share no sign-in.
  - **success:** Of two test installations deployed from one build, with different administrator emails, an account of one cannot sign in to the other, a session cookie from one is refused by the other, and one's token sent under the other's cookie name is refused (V-4). Two installations on one host name with different ports each keep their own session and their own marker: signing in to one does not sign the person out of the other (A-5). How far same-host installations are isolated is held (H-4).
- **CAP-11**
  - **intent:** Sessions are outside project revisions.
  - **success:** A revision restore leaves sessions unchanged. Sessions live only in the installation object. A server test over the installation object's registered operations finds that only sign-in completion, ending a session, the bounded pruning, and the session read's last-use write touch the sessions table (A-4, V-13). A Playwright test signs in, saves a named revision, restores it and finds the account menu still showing the name (V-13).
- **CAP-12**
  - **intent:** Sign-in works and holds its limits on real Cloudflare.
  - **success:** On a deployed Cloudflare test installation: the scrypt hash is accepted without a platform error (R9); sign-in completes in under 1 second at the median of 20 sign-ins (CA-08); of 25 wrong sign-ins for one email with no failures, sent at once with no cookies over 25 separate connections, exactly 5 are checked against the password and 20 receive the wait (CA-43, A-6, V-19). The same 25 carrying a valid marker are limited by the address count alone, at most 20 checked (A-6).
- **CAP-13**
  - **intent:** A password hash made on one host verifies on the other.
  - **success:** A known-answer fixture, made once under the self-hosted runtime by the probe in `deploy/probe/` with the production parameters and committed with its origin recorded, verifies through `verifyPassword` in the server tests, under workerd through the probe run by the smoke test, and on Cloudflare through the same probe deployed to the test account and deleted afterwards. The probe imports `server/auth/password.ts`, uses the app's compatibility date and flags, and is built by Wrangler (`wrangler deploy --dry-run --outdir`). A wrong password fails on each host (D-6, A-22, V-3).
- **CAP-14**
  - **intent:** The sign-in page and the account menu get repeatable browser tests.
  - **success:**
    - Playwright tests in `site-studio/browser-tests/`, in desktop Chromium and WebKit with an iPhone viewport, sign in and find the account menu with the name, sign out and find the sign-in page, and show a wrong password refused with the one message and a wait stated. axe finds no serious or critical violation on the sign-in page or with the account menu open (standing rule 15).
    - The wait test uses an email with no account and its own `CF-Connecting-IP`; tests that produce failures stay under 20 per server (V-15).
    - The set-up done page's next step reads "Sign in with the email and password you just chose.", and a plain link "Sign in" to `/` replaces "Open Site Survey Design" (D-9, A-8, E-21). `signin.spec.mjs` asserts the link with mocked replies (V-20).
    - Three deliberate breakages each fail the suite: the `autocomplete` attributes removed, "No account with that email" shown, the account menu left out of the header; the failing tests' names are recorded in the spec 3 file (V-22).

## Constraints

- One server build for both hosts. Host-specific code only behind `server/files/` and `server/update/` (plus story 1.2's D-1/D-8 transport code), exactly two Durable Object classes, and no D1, Workflows, Queues, scheduled-trigger or KV bindings (AD-16, standing rule 7). The probe in `deploy/probe/` is a separate test Worker, never part of the app's build.
- Every new route is under `/api/v1/` and declared in `shared/routes.ts` with input and reply schemas. A refusal carries a reason code, may name a field or a wait in seconds, and never repeats an entered value (AD-22).
- Sign-in failure counts live in the installation object's SQLite storage and are raised before the password is checked. A count in a Worker's own memory is only an extra guard (CA-43).
- The password, its hash, the session token, the marker and the email of a failed attempt never appear in logs, replies or refusals; a test watching `console` over sign-in, failure, wait and sign-out finds none (V-10). Only hashes of session tokens are stored (NFR-5, AD-17).
- Passwords are checked as `normalisePassword(password)` and emails compared as `normaliseEmail(email)`, from `shared/setup.ts` (story 1.2's D-9).
- One scrypt hash runs at a time per Worker isolate: real checks, stand-in checks and set-up hashing share one queue (D-5). A server test reads the queue's active count and finds its peak is 1, with set-up's hash waiting its turn (A-12, V-7).
- `Secure` is always set on the session and marker cookies, on every host and in local runs (D-10).
- Rules the page and the server share are written once in `shared/`, in TypeScript, with tests (standing rule 6). The app stays JavaScript; `shared/` and `server/` stay TypeScript. Dependency versions are exact, with no new dependency. Tests that existed before story 1.2 are unchanged; of story 1.2's browser tests, only the two assertions D-9 changes are updated.
- `callObject` keeps story 1.2's D-2 as amended: reads may be retried once after any reset; writes only on the shown version-stop reason. Tests inject a bare reset on counting an attempt and on completing it and find no retry, and on the session read and find one (V-16; ending a session is held, H-8).
- New screen parts meet UX section 10 (4.5:1 contrast, a visible 2 px focus ring, labelled 16 px fields, usable at 200% zoom, 44 px targets on the iPhone viewport and 32 px on desktop) in the white and teal direction with `BrandMark` (standing rule 5).
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
- Moving project data to the server (Epic 2). Until then the browser's local project stays for whoever signs in next on that browser (D-7; story 1.7's CA-49 later clears it when a different account signs in).

## Success signal

- On a deployed Cloudflare test installation, the administrator opens the `https://` address, sees the sign-in page with the installation's name, signs in, finds their name in the account menu, signs out, and the old session no longer signs in. Wrong passwords show one message and then a wait.
- In local and CI runs, the server tests show the cookie attributes, the timing parity, the limits under simultaneous attempts and the marker; the Playwright suite shows sign-in and sign-out passing in Chromium and WebKit with axe clean.

## Assumptions

- The Worker, not the installation object, runs scrypt, as at set-up. The object counts the attempt and answers the stored hash or a stand-in signal, the installation's identifier, and a one-time ticket. The ticket records, inside the object, the account (or "stand-in"), the email key, the address key, whether a valid marker was presented, the identity of the stored hash that was handed out, and the hash of any session the browser presented. The Worker verifies. A second object call passes only the ticket and the outcome; it treats a stand-in ticket as a failure, re-checks that the account is still active with the same stored hash, and on success lowers the counts, clears the email's count, ends the presented session and stores the new session's hash (A-1, E-4, E-22).
- The sign-in schema refuses only a missing or empty field, an email over 254 code points after `normaliseEmail`, or a password over 1,024 UTF-16 units before normalisation (`invalid_input`, not counted). Any other value takes the one-message path, so a password that breaks the set-up rules is simply wrong.
- An email's count key is an HMAC-SHA-256 of the normalised email under the object's random key, so a copy of storage does not reveal which addresses were tried by hashing a list of candidates.
- Sessions, count rows and tickets each carry an indexed expiry or clearing time and are deleted in bounded steps during attempts and session reads.
- An infrastructure failure after an attempt is counted (scrypt failing, a reset before completion) leaves the count raised; this is accepted (E-17).
- An account with `active = 0` gets the one message. Deactivation itself is story 1.9.
- The public session read reports whether the caller is signed in, the account's name if so, and the installation's name (`null` while set-up is open). The sign-in page shows that name to anyone, so this reveals nothing more.
- The Worker passes the object every cookie whose name has the session prefix; the object uses the one named with its own identifier. No isolate keeps the identifier.
- The network address is set-up's `clientAddressKey` (`CF-Connecting-IP`, IPv6 by /64, absent gives one shared bucket); its effect on sign-in is held (H-3).
- New installation-object tables are created if absent under data format 1. Pre-release installations are re-created, not converted (standing rule 8).
- The installation identifier (D-1) is created when the installation object is first created, before set-up, and never changes.
- Until story 1.6, last use is recorded at sign-in and on the session read the app makes when it opens (D-4); this is held (H-5).
- The wait's duration on the page is worded as at set-up ("2 minutes 30 seconds", `waitWording`) (D-8).
- "Two installations on one host with different ports" is a browser cookie-jar behaviour, checked by a local browser test against two local servers in one browser context. `workers.dev` addresses cannot differ by port.
- "A cookie from one installation is refused by the other" and "an account cannot sign in to the other" are checked on two deployed test Workers, as in story 1.2 spec 4, with a local server test that a cookie under a foreign installation identifier or an unknown token is refused.
- Sign-in is not yet refused during an update: the update record arrives with story 9.3.

## Decisions (Kevin, 2026-11-20)

Kevin accepted every recommended option for the ten open questions ("Accept all 10 and then run an adversarial review using a bmad workflow on the story before we proceed", relayed by the orchestrator session). None was changed by the review round.

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

## Held review findings

Each waits for a ruling by Kevin; none is applied, and D-1 to D-10 stand until he rules. Each is also recorded, with the later stories it touches, in `deferred-work.md` under "Story 1.3 spec review (2026-11-20): overlaps with later stories".

- **H-1** A-2, A-3, E-5, V-5, V-21: the session read's reply to a dead, foreign or expired cookie (200 "signed out" with the cookie cleared, or 401), and which failures open the prototype under D-7. Waits for a ruling on D-7. Touches stories 9.3, 1.6, 1.7 (CA-49) and 1.8.
- **H-2** A-17, E-1: a marker exempting its holder from the email's wait only, with its own count. Waits for a ruling on D-2 (v) and D-3. Touches stories 1.5 (CA-15), 1.11, 1.13, 1.17 and 1.6.
- **H-3** A-7, E-2: the shared address bucket when the address is unknown or shared, and whether a marker also exempts its holder from the address wait. Waits for a ruling on D-2 and CA-44. Touches stories 2.21, 2.22, 1.14, 1.17, 1.6 and 1.19.
- **H-4** E-3: installations on one host name with different ports are not cookie-isolated; restate CAP-3 and CAP-10. Waits for a ruling on D-1's scope. Touches stories 2.21 and 9.1.
- **H-5** A-4 (last-use part), E-7, V-12 (last-use part): a GET that writes last use. Waits for a ruling on D-4's last-use assumption and standing rule 13. Touches stories 1.6 (CA-18, CA-19), 1.15 and 9.3.
- **H-6** E-8: when counts below the threshold clear, and the address window's reset. Waits for a ruling on D-2 (i) and (ii). Touches stories 1.5 and 1.13.
- **H-7** A-11, A-12 (bound, timeout and the memory record), E-9: the queue's bound, timeout and release on cancellation, and the ticket's lifetime and refusal code. Waits for a ruling on D-5. Touches stories 1.4, 1.5, 1.6, 1.11, 1.13, 1.17 and 9.4.
- **H-8** A-15, E-6 (and V-16's retry of ending a session): idempotent sign-out, retrying `endSession`, and the page after a failed sign-out. Waits for a ruling on CAP-5's sign-out behaviour. Touches stories 1.6 (CA-48), 1.14 and 9.3.
- **H-9** A-23 and E-21 (hash-change part): only a well-formed reviewer link skips sign-in, re-checked on a hash change; E-18: Unicode normalisation of emails; E-16: re-reading the session when a tab becomes visible. Wait for rulings on D-7, story 1.2's D-4 and D-9, and story 1.6's use rule. Touch stories 1.8, 4.10, 4.11, 1.4, 1.10, 1.17 and 1.6.

## Notes for Kevin

Points that writing the rulings and the review down showed are not settled. None is decided here; the implementing specs follow the assumptions above unless Kevin rules otherwise.

- **D-2 (ii) leaves a gap like the one story 1.2's D-3 was amended for.** With a rolling 15-minute address window and a 15-minute maximum wait, an address that waits out a 15-minute wait finds its earlier failures gone from the window and gets about 20 fresh attempts (held as H-6).
- **D-3 and shared browsers.** One marker per browser means two people sharing a browser displace each other's marker. Whether a password change (story 1.6) or a reset (stories 1.11, 1.17) invalidates markers is not settled.
- **D-3 per installation.** Applying A-5 names the marker with the installation's identifier, so "a browser holds one" now reads "one per installation". D-3's text is unchanged.
- **D-4 last use.** Which requests count as use before story 1.6 is not settled; AD-12 says only deliberate actions count (held as H-5).
- **D-1 timing.** D-1 does not say when the identifier is created; the assumption above creates it with the installation object.
- **D-8 duration format.** "‹1 minute›" leaves the format open; the assumption above reuses set-up's wording.
- **Decision labels.** This story's D-1 to D-10 reuse the labels of story 1.2's decisions; this spec writes "story 1.2's D-n" for those.
- **Choices taken where a finding offered alternatives** (each the option that changes least; Kevin can overrule):
  - E-11: while set-up is open the session read answers `installationName: null` and sign-in takes the stand-in path, rather than a new `setup_open` refusal.
  - V-20: the done page's Sign in link is asserted in `signin.spec.mjs` with mocked replies, rather than a third change to story 1.2's `setup.spec.mjs`.
  - A-18, E-12: the identifier is returned by the object with each reply and never cached in an isolate, rather than cached and invalidated.
  - A-19: the server's wait message is fixed and the page composes the duration with `waitWording`, rather than moving `waitWording` into `shared/`.
  - A-8: when the set-up state cannot be read, start-up does not read the session and opens the prototype as today, which keeps story 1.2's test of that case unchanged.
  - V-19: the 25 separate connections use Node's own `node:https` agents with keep-alive off, rather than undici's `Agent`, so no dependency is added.
