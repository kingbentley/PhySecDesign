---
id: SPEC-story-1-4-invite-a-person
status: ready for development (decisions D-1 to D-12, Kevin, 2026-11-21)
companions:
  - acceptance-trace.md
  - brownfield.md
  - ../spec-story-1-3-sign-in-and-sign-out/SPEC.md
  - ../spec-story-1-2-set-up-a-new-installation/SPEC.md
  - ../../planning-artifacts/epics/epics-PhySecDesign-2026-11-18/epics.md
  - ../../planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md
  - ../../planning-artifacts/ux/ux-PhySecDesign-2026-11-18/design-canvas.md
  - ../../implementation-artifacts/epic-1-context.md
  - ../../implementation-artifacts/deferred-work.md
  - ../../../site-studio/AGENTS.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete contract for what to build, test, and validate. Source documents are for traceability only.

# Story 1.4: Invite a person

The acceptance contract is story 1.4 of epics draft 0.7 (`epics.md`, "### Story 1.4"), read with standing rules 1–15 and the definition of done. Where this spec summarises a criterion, the story's wording governs. `acceptance-trace.md` maps all 16 criteria to a capability and to the one spec that owns each. Story 1.3's decisions (its `SPEC.md`) still hold; "story 1.3's D-n" names one of them. Choices CA-09 (7 days), CA-10 (refuse an email with an account; a re-invite replaces the earlier link) and CA-55 (standing rule 14) carry rulings ("Claude, accepted on Kevin's instruction, 2026-11-19").

**Status: ready for development.** Kevin's decisions D-1 to D-12 (2026-11-21) are frozen. The spec review (`review-spec.md`, 29 findings) was applied in full on 2026-11-21 on Kevin's instruction ("Apply all 29"); changes it made are marked with their finding, and amendments of D-4, D-9, D-11 and D-12 say so where they stand. In this file a bare "D-n" is one of this story's decisions.

## Why

FR-67 gives each person their own account, created only by an administrator's invitation, with no open registration; the invited person sets their own password. After story 1.3 an installation has exactly one account. Every later Epic 1 story that involves a second person (two-step verification for a designer, projects and members, deactivation) needs invitations first.

## Capabilities

- **CAP-1**
  - **intent:** An administrator invites a person from the account menu and gets a link to pass on.
  - **success:**
    - An administrator's account menu holds "Invite a person", which opens the invite panel (the S-30 invite panel on the design canvas, without its projects list, story 1.7). The panel asks for email, name and role (Standard user or Administrator).
    - Submitting creates an invitation and shows its link once, with Copy and the expiry as local date and time (D-9, D-11 as amended). The link is built on the installation's recorded public address (CA-57, AD-12), never on a request header: `<public address>/invite#<secret>` (D-1).
    - The invitation expires 7 days after it is issued (CA-09); tests just under and just over 7 days use an injected time.
    - The email is compared as `normaliseEmail` (trim, lower case, no Unicode normalisation; story 1.3's D-15) and passes `emailField`; the name passes `personNameField`.
- **CAP-2**
  - **intent:** The secret in the link cannot leak from the server, the logs, the address bar or a referrer.
  - **success:**
    - The secret is 32 random bytes, base64url without padding (43 characters). The server stores only its SHA-256; a test reads the invitations table and finds the hash and no secret (standing rule 14, CA-55).
    - The secret travels in the address's fragment, which no browser sends to a server, and in request bodies only, never a query string (D-1).
    - The `/invite` page is served with `Referrer-Policy: no-referrer` (D-2), whichever asset branch answers. At start-up, before any read, the page takes the secret into memory and removes it from the address bar with `history.replaceState`; a browser test finds the address `…/invite` with no fragment once the page has opened, also when the set-up state cannot be checked (review findings 3 and 5).
    - A test watching `console` over inviting, opening, accepting and a refused accept finds no secret, password or password hash.
- **CAP-3**
  - **intent:** The invited person sees who invited them to which installation, sets a name and password, and is signed in.
  - **success:**
    - The invitation page (S-27) shows the inviter's name and the installation's name, and the invited email (read-only).
    - The person enters a name (prefilled with the administrator's entry, editable; D-7) and a password twice, as at set-up.
    - Accepting creates the account with the invitation's email and role, consumes the invitation, and signs the person in as a sign-in does: a new session cookie and a marker for the new account, and any session the browser presented is ended (D-4). When the browser is signed in already, the page says so before the person submits (D-4 as amended). The page then loads `/` afresh and the app opens with the account menu showing the new name.
- **CAP-4**
  - **intent:** The new password follows story 1.2's rules and storage.
  - **success:**
    - The password must have 12 to 128 characters after NFKC and must not equal the invitation's email ignoring case (CA-03, story 1.2's D-9); the server refuses otherwise (`invalid_input`, field `password`).
    - The page shows each rule as a list item that changes from not met to met as the person types, with the state in text and shape, not colour alone (standing rule 3), announced politely to screen readers.
    - The password is hashed by the Worker through the one hash queue (story 1.3's D-5 amended) and stored as story 1.2 states: scrypt, N = 131,072, r = 8, p = 1, a 32-byte result, parameters beside the hash. A route test reads the users row and verifies the password with `verifyPassword`; the new person then signs in on the sign-in page.
    - A full queue answers `signin_busy` (503, `Retry-After: 5`) before the hash and leaves the invitation usable.
- **CAP-5**
  - **intent:** An invitation is single-use, expires, and is replaced by a re-invite; a link that no longer works says so.
  - **success:**
    - A second accept with the same secret is refused; two accepts sent at once create one account.
    - Re-inviting an email that has an unused invitation replaces it: the earlier secret stops working, the new one works (CA-10). There is at most one live invitation per email.
    - A used, replaced, expired, unknown or malformed (as the page or the Worker checks it) secret gets one refusal, `invitation_unusable`, or the same message on the page without a request (D-3; review finding 11). The page shows "This invitation link no longer works" with the advice to ask an administrator for a new one.
    - Expired invitation rows are pruned in bounded steps during invite and accept operations.
- **CAP-6**
  - **intent:** Only administrators invite, and no account comes into being without an invitation.
  - **success:**
    - A standard user's account menu has no "Invite a person"; a standard user's invite request is refused (`administrator_only`, 403); a request with no live session is refused (`not_signed_in`, 401) (D-6). The check runs inside the installation object in the same operation that writes the invitation.
    - A server test over the installation object's registered operations finds that only `createFirstAdministrator` and `acceptInvitation` insert into `users`. A route sweep calls every declared route, recording the operations each calls, and finds that only the `setup` route reaches `createFirstAdministrator` and only the `acceptInvite` route reaches `acceptInvitation` (review finding 6: the route is `acceptInvite`, the operation `acceptInvitation`).
    - The invite and accept requests are refused (`origin_refused`) without the app's origin and header (standing rule 13); the existing declaration sweep (V-12) covers them, and its pinned list of cookie-reading routes gains `invite` and `acceptInvite` (review finding 1).
- **CAP-7**
  - **intent:** One account per email.
  - **success:** Inviting an email that already has an account (active or not, CA-10) is refused with `invitation_email_taken` naming the field `email`, and the panel says so. Story 1.10 adds the deactivated wording.
- **CAP-8**
  - **intent:** Invitations are outside project revisions.
  - **success:** Invitations live only in the installation object. A server test over its registered operations finds that only `createInvitation`, `acceptInvitation` and the bounded pruning change the invitations table (standing rule 9).
- **CAP-9**
  - **intent:** The page knows which account is signed in and whether it is an administrator.
  - **success:** The session read's signed-in reply adds `accountId` (the account's random identifier) and `role` (D-5); the sign-in reply stays `{ name }`, and the page reads the session after signing in. The page's session read passes both fields on, and a signed-in reply without them cannot be checked, failing closed as story 1.3's D-7 does (review finding 2). The menu shows "Invite a person" only for `administrator`. The visibility re-read (story 1.3's D-16) and the app's key compare `accountId`, not the name; a browser test signs in as a second account with the same name in another tab and finds the first tab reloads as that account (deferred-work item, story 1.3 spec 3).
- **CAP-10**
  - **intent:** The invite panel and the invitation page get repeatable browser tests.
  - **success:**
    - Playwright tests in Chromium and WebKit iPhone: an administrator invites, reads the link, opens it in a new browser context, finds the inviter and installation, sees the rules met, accepts and finds the account menu with the new name and no "Invite a person"; a used link shows the unusable message, and so does an expired one, with the invitation read's reply mocked because the local server has no test clock (expiry itself is a server test); inviting an existing email shows the refusal.
    - axe finds no serious or critical violation with the invite panel open (form and link states) and on the invitation page (form and unusable states) (standing rule 15).
    - Copy is checked by the link field's value in both browsers, and by the clipboard in Chromium only, where Playwright can grant clipboard permission.
    - Four deliberate breakages each fail the suite: "Invite a person" shown to a standard user; the secret left in the address bar; the rules list not updating; the visibility re-read comparing the name instead of `accountId` (review finding 19). The failing tests' names are recorded in the spec 3 file.

## Constraints

- One server build; exactly two Durable Object classes; no new platform feature (AD-16, standing rule 7). New tables created if absent under data format 1 (standing rule 8).
- Every new route is under `/api/v1/`, declared in `shared/routes.ts` with input and reply schemas. A refusal names at most a field, never an entered value (AD-22). Paths stay exact; the secret is never a path or query parameter.
- Invite and accept are `appOriginOnly` and `readsSessionCookie` (standing rule 13, V-12). The invitation read is `appOriginOnly` too, so another site's page cannot test secrets through the user's browser.
- `callObject` keeps story 1.2's D-2 as amended: the invitation read is idempotent and retried once after a bare reset; creating and accepting an invitation are writes, never retried after a bare reset.
- Rules the page and the server share (the invite input, the accept input, the password rule list) live once in `shared/`, in TypeScript, with tests (standing rule 6). The set-up page and its tests are unchanged.
- Passwords hash only through the existing queue; set-up, sign-in and accept share it (story 1.3's D-5 amended).
- No secret, password, hash or session token in a log, refusal or export, or in a reply body other than the invite reply's link; session tokens only in `Set-Cookie` (NFR-5, standing rule 14; review finding 22).
- New screen parts meet UX section 10 in the white and teal direction with `BrandMark` (standing rule 5).
- Browser tests cover flows and on-screen refusals; rules, expiry, replacement and concurrency are server tests in Cloudflare's runtime (standing rule 15). Story 1.2's and story 1.3's browser tests change only where CAP-9 changes the session reply's comparison.

## Non-goals

- The invite action in Administration, the Users table, pending invitations listed and cancellable (stories 1.10, 1.11).
- Adding the person to projects while inviting (story 1.7 adds memberships; the S-30 panel's project list waits).
- Refusing an invitation for a deactivated account and its wording (story 1.10).
- The administrator changing the invitation period (story 1.15); sending the link by email, "Email it" (story 1.17).
- Offering or requiring two-step verification after accepting (story 1.5).
- Activity-log entries for invitations (story 1.14).
- The access gate and route classes (story 1.8); this story's two refusals are a stop-gap the gate replaces.
- Clearing the browser's local project when a different account signs in (story 1.7, CA-49). Until then, a person who accepts an invitation in a browser another account used sees that browser's local project (story 1.3's D-7).

## Success signal

- In local runs: an administrator signs in, invites a colleague, copies the link, and in a second browser the colleague sees the inviter and the installation, watches the password rules turn met, sets a password and lands in the app signed in, with no "Invite a person" in their menu; opening the same link again says it no longer works.
- Server tests show the stored hash only, the 7-day expiry, replacement, single use under concurrent accepts, the refusals, the origin rule and the absence of the secret from logs; the Playwright suite passes in Chromium and WebKit with axe clean.

## Assumptions

- The installation object generates the secret inside `createInvitation`, stores its SHA-256 and returns the secret once; the Worker builds the link from the returned public address. Later reads and the accept pass the Worker-computed SHA-256 of the secret, so the object never receives the secret again.
- The accept handler runs: busy check → invitation read (idempotent) → the password-not-email rule against the invitation's email → hash through the queue → `acceptInvitation`, one synchronous transaction that re-checks the invitation is live and the email free, inserts the user, deletes the invitation, ends the presented session, stores the new session's hash and returns the token and marker. Two accepts at once both hash; the second is refused `invitation_unusable`.
- An invitation row holds the secret's hash, the email (unique), the name, the role, the inviter's account id, the issue time and an indexed expiry. A used or replaced invitation's row is deleted at once (D-3 needs nothing more).
- The invitation read answers the inviter's current name, the installation's name, the invited email, the suggested name and the role; anyone holding the secret may read these. With 32 random bytes no guessing limit is needed; the read and the accept are not counted.
- The secret's schema accepts any string of 1 to 256 characters; one that is not 43 base64url characters is answered `invitation_unusable`, so a truncated copy gets the page's message rather than "not valid". A secret the input schema rejects (empty, over 256 characters or not a string) is answered `invalid_input` with field `secret`, before the handler runs (Kevin, 2026-11-21).
- The inviter must be signed in, active and an administrator at the moment the invitation is written; the invitation stays usable if the inviter later changes (deactivation's effect on invitations is story 1.10).
- Accepting while signed in as anyone ends that session and signs in as the new account (D-4); the marker becomes the new account's (story 1.3's D-3: one per installation, for the account last signed in).
- `/invite` (and `/invite/`) after set-up shows the invitation page whatever the session; while set-up is open the start-up flow sends every address to `/setup` as now; where there is no server the prototype opens.
- The accept reply's busy refusal reuses `signin_busy`, as set-up does.
- The browser's own history may keep the address as first opened, with the fragment; single use and the 7-day expiry limit the harm. No test claims otherwise (review finding 26).

## Decisions (Kevin, 2026-11-21)

Kevin accepted the recommended option on all twelve open questions of the draft ("Accept all 12", relayed by the orchestrator session). D-1 to D-12 are those questions, in the same order; the rejected options are kept for the record.

- **D-1 Link form** (Kevin, 2026-11-21). `<public address>/invite#<secret>`: the fragment never reaches the server, Cloudflare's request logs or a proxy, and the page has its own path for the header.
  - Rejected: `/invite?secret=…` (reaches server and proxy logs, against standing rule 14's "no log").
  - Rejected: `/#invite=…` (no own path, so the no-referrer header would have to cover the whole app).
- **D-2 Scope of `Referrer-Policy: no-referrer`** (Kevin, 2026-11-21). Only on the `/invite` page; after acceptance the page loads `/` afresh so the app's document has the default policy. The prototype loads OpenStreetMap tiles, whose usage policy asks web apps to send a referrer; a fragment is never in a referrer anyway, so this meets standing rule 14 without changing the map.
  - Rejected: every page.
- **D-3 Messages for a link that no longer works** (Kevin, 2026-11-21). One refusal and one page message for used, replaced, expired, unknown and malformed links: "This invitation link no longer works. It may have been used, replaced by a newer invitation, or expired. Ask an administrator for a new one." Nothing is kept after use.
  - Rejected: separate messages for used and expired, which would need used rows kept until expiry.
- **D-4 Accepting signs in like a sign-in** (Kevin, 2026-11-21). A session cookie and a marker for the new account, and a session the browser presented is ended, as story 1.3's V-8 does at sign-in (story 1.3's D-3).
  - Rejected: session only, no marker until the first password sign-in.
  - Addition Kevin agreed on 2026-11-21 (amended 2026-11-21 after the spec review, finding 20): whenever the session read answers signed in, the invitation page says "You are signed in as ‹name›. Setting this password signs you out."
- **D-5 What the session reply adds** (Kevin, 2026-11-21). `accountId` and `role`. The menu needs the role, the deferred-work item asks for a stable account value, and the account's own random identifier reveals nothing to its owner.
  - Rejected: `role` only, keeping the name comparison (the deferred same-name bug would stay).
  - Rejected: a separate "my account" read.
- **D-6 Refusing non-administrators before story 1.8's gate** (Kevin, 2026-11-21). Two new refusals, `not_signed_in` (401, "Sign in to do this.") and `administrator_only` (403, "Only an administrator can do this."), checked inside `createInvitation` from the presented session: one object call decides and writes, with no gap between check and write. Story 1.8 replaces both with route classes.
  - Rejected: a router-level `requires: "administrator"` declaration with its own session lookup.
- **D-7 The invited person's name** (Kevin, 2026-11-21). Prefilled with the administrator's entry, editable.
  - Rejected: fixed as entered by the administrator.
  - Rejected: blank.
- **D-8 After the secret leaves the address bar** (Kevin, 2026-11-21). Kept in the page's memory only; a reload shows "Open the invitation link again to continue." (the link still works until used), per standing rule 14's "no record contains it".
  - Rejected: kept in `sessionStorage` for the tab.
- **D-9 Showing the link** (Kevin, 2026-11-21). Once, in the panel, with Copy and the expiry date; closing the panel discards it, and inviting the same email again issues a fresh link (CA-10).
  - Rejected: retrievable later, which needs the secret stored recoverably, against standing rule 14.
  - Reading (amended 2026-11-21 after the spec review, finding 21): AD-12's "always available for an administrator to copy" is read as "with or without email" (AD-18); a lost link is replaced by inviting again (CA-10).
- **D-10 Who invited** (Kevin, 2026-11-21). The inviter's account id is stored and the page shows that account's current name: one source for names, as story 1.10 lets administrators rename people.
  - Rejected: the inviter's name as it was when inviting.
- **D-11 Wording** (Kevin, 2026-11-21), fixed exactly as proposed: menu item "Invite a person"; panel heading "Invite a person", fields "Email", "Name", "Role" with "Standard user" (default) and "Administrator", button "Create invitation"; result "Invitation link for ‹name›", "Copy link", "Copied", "This link works once and expires on ‹date and time›. Anyone who has it can create this account, so pass it on privately.", where ‹date and time› is the expiry in the browser's local time, for example "28 November 2026, 22:00" (amended 2026-11-21 after the spec review, finding 24; it read "‹date›"); page heading "Join ‹installation name›", line "‹inviter› invited you as a standard user." (or "an administrator."), button "Set password and sign in", rules "12 to 128 characters" and "Not the same as your email"; refusals `invitation_email_taken` "That email already has an account." and `invitation_unusable` as in D-3; a reload's message "Open the invitation link again to continue." Wording that D-11 does not list (the busy, updating, cannot-be-checked, failed-accept, copy-failure and password-mismatch texts, Close and "Invite another person") is listed in spec 3, reused from the sign-in and set-up pages where it exists, and is not a change to D-11 (review findings 7 and 23).
- **D-12 Deployed acceptance** (Kevin, 2026-11-21). No Cloudflare acceptance spec for this story: no story 1.4 criterion names a deployed installation, and the definition of done is the local run. The Worker runs first on Cloudflare (`run_worker_first: true`), so the header is added by the same Worker code on both hosts. Its reason amended 2026-11-21 after the spec review, finding 5: the server tests' `ASSETS` stubs differ from Cloudflare's asset service, so the header is added by path whichever asset branch answers, the route tests use both an SPA-style and a disk-style stub, the browser tests (which run `wrangler dev` on the built Cloudflare configuration) check the header, and the self-hosted smoke suite checks it too.
  - Rejected: a short deployed check of the link's address and the header on the test account.

## Deferred-work items addressed to story 1.4

- **Hash queue (story 1.3's D-5 amended):** taken. Accepting hashes through the one queue, refuses `signin_busy` before hashing when it is full, and a cancelled request releases its slot (CAP-4; spec 2).
- **Emails compared without Unicode normalisation (story 1.3's D-15):** taken. Invitation emails use `normaliseEmail` for the uniqueness check, replacement and the account's email (CAP-1, CAP-7; spec 1).
- **Accounts told apart only by name (story 1.3 spec 3):** taken (D-5). The session reply adds `accountId`; the visibility re-read and the app's key compare it; the "another account reloads the app" browser test is added (CAP-9; specs 2 and 3).
- **Declaration sweep (story 1.3, V-12):** not addressed to this story by name, but binds it: the new non-GET routes that read the session cookie are `appOriginOnly`. The sweep itself passes unchanged; the same file's pinned list of cookie-reading routes gains `invite` and `acceptInvite` (review finding 1).
- Every other open item in `deferred-work.md` names other stories (1.5, 1.6, 1.7, 1.8, 1.11, 1.13, 1.14, 1.17, 2.21, 2.22, 9.x) or no story; none is taken here.
