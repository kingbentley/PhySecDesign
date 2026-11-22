---
title: 'Story 1.4, spec 3: Invite panel, invitation page and browser tests'
type: 'feature'
created: '2026-11-21'
status: 'done'
route: 'dispatch'
baseline_commit: '3a7424b68a7d578c7adab6d22d6c8938cbaca842'
review_loop_iteration: 0
story_key: '1-4-invite-a-person'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-4-invite-a-person/stories/2-invitation-routes-and-page-header.md'
---

> Runs after spec 2. Builds to Kevin's decisions D-1, D-2, D-3, D-4, D-5, D-7, D-8, D-9 and D-11 in SPEC.md. Visual source: the S-27 and S-30 screens on the design canvas (`design-canvas.md`); the S-30 panel's project list is left out (story 1.7). Amended on 2026-11-21 after the spec review (`review-spec.md`), with Kevin's agreement ("Apply all 29"); each change names its finding.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing on screen lets an administrator invite anyone or an invited person accept; the page tells accounts apart only by name.

**Approach:** Add "Invite a person" to an administrator's account menu, the invite panel, the `/invite` page in the start-up flow with a live password rule list, the switch of the page's account comparison to `accountId`, and Playwright and axe tests in Chromium and WebKit iPhone. Covers CAP-1, CAP-3's page, CAP-4's list, CAP-5's message, CAP-9's page side and CAP-10.

## Boundaries & Constraints

**Always:**
- The menu item shows only when the session's `role` is `administrator`. The panel is a labelled dialog with focus moved into it, Escape and a Close button returning focus to the menu trigger. `InvitePanel` is loaded lazily when the menu item is chosen, as the sign-in page is (review finding 27).
- Panel fields: Email, Name, Role (radio group, Standard user selected by default). Field checks use `inviteInput` from `shared/invitation.ts`. On success the panel shows the link in a read-only field, Copy (`navigator.clipboard.writeText`, with "Copied" announced), the expiry as local date and time (for example "28 November 2026, 22:00"; D-11 as amended, review finding 24), and "Invite another person". If writing to the clipboard fails, the link field is selected and the panel says "Select the link and copy it." (review finding 25). Closing discards the link (D-9). A refusal shows its message by the named field; refusals that name no field, and failures to answer, show above the panel's button (review finding 7); `not_signed_in` shows the sign-in page.
- At module start, before any read, if the path is `/invite` or `/invite/`, `main.jsx` takes the fragment into memory and calls `history.replaceState` to the bare path, so on every later page (set-up open, cannot be checked, no server) the fragment is already gone. The secret is kept in memory only (D-1, D-8; review finding 3). No fragment → "Open the invitation link again to continue." A fragment that fails `isWellFormedInvitationSecret` shows the D-3 message without a request (review finding 11).
- `/invite` and `/invite/` after set-up show the invitation page whatever the session: a closed set-up does not wait on the session read, and the page renders whatever that read answers, including `unknown` (review finding 3). Whenever the session read answers signed in, the page says "You are signed in as ‹name›. Setting this password signs you out." (D-4 as amended, review finding 20).
- The page reads the invitation and shows the inviter, the installation, the role and the email (read-only); Name prefilled and editable (D-7); Password and Password again; the rule list from `passwordRules`, each item's state in text and an icon shape as well as colour, in a polite live region. With an empty password both rules show as not yet met (review finding 28). Fields labelled, 16 px, `autocomplete` `name` and `new-password`, a hidden `username` field with the email so password managers save the pair.
- `invitation_unusable` replaces the form with the D-3 message; a network failure, timeout or 5xx of the invitation read shows "The invitation cannot be checked" with Try again (as story 1.3's pages); `signin_busy` asks to try again in a moment. `invalid_input` naming `password` or `name` shows by that field. Any other accept failure (no answer, a timeout, `internal_error`, `updating`, or any refusal not named here) shows "Your password may not have been set. Try again; if the link then no longer works, try signing in with your email and this password." with Try again (review finding 7).
- After a successful accept, `location.replace('/')` loads the app in a fresh document (D-2), signed in as the new account.
- `readSession` (`src/admin/setupState.js`) returns `accountId` and `role` for a signed-in reply. `isSessionReply` requires, for `signedIn: true`, a string `accountId` and a `role` of `administrator` or `standard`; anything else is `unknown`, which shows "Sign-in cannot be checked" (review finding 2). `src/main.jsx` keys `<App>` on `accountId` and the visibility re-read compares `accountId` (CAP-9). After a sign-in it reads the session once to learn `accountId` and `role` (the sign-in reply carries only the name); if that read is not signed in, the sign-in page shows, and if it cannot be checked, "Sign-in cannot be checked" with Try again (review finding 29). The menu receives `role`.
- `invitationClient.js` imports nothing from `shared/` except `refusal.ts`, as `signInClient.js` does, so `tests/` can load it in Node (review finding 8).
- UX section 10 (contrast, 2 px focus ring, 200% zoom, 44 px targets on the iPhone viewport, 32 px on desktop) in the white and teal direction with `BrandMark` on the invitation page (standing rule 5).
- The app stays JavaScript; page modules load lazily as the sign-in page does, so the prototype's bundle does not grow by the page's rules.
- `invitation.spec.mjs` uses `signInServers(project)[0]` and `completeSetup` with `signin.spec.mjs`'s administrator, never the `baseURL` server, and every account it creates uses an email that no `signin.spec.mjs` test uses. Moving shared helpers into a helper module is allowed, not required (review finding 4). The test email for the rule list has 12 or more characters (review finding 28).

**Wording outside D-11** (review findings 7 and 23), pinned by the tests; where a text already exists on the sign-in or set-up page it is reused:
- Panel: "Invite another person"; "Close"; "Select the link and copy it."; a failure to answer: "The server could not be reached. Check the connection and try again." (sign-in page); refusals with no field show their server message.
- Page: "Password", "Password again" and the mismatch message "The two passwords do not match." (set-up page); "The invitation cannot be checked" with "The server did not say whether this invitation works. Check the connection and try again." and "Try again" (from the sign-in page's "cannot be checked"); busy: "Site Survey Design is busy. Try again in a moment." and updating: "Site Survey Design is updating. Try again in a moment." (sign-in page); "Your password may not have been set. Try again; if the link then no longer works, try signing in with your email and this password."; "You are signed in as ‹name›. Setting this password signs you out." (D-4 as amended); "Open the invitation link again to continue." (D-11).

**Never:** Server, `shared/` rules or route changes (specs 1 and 2); the one exception is the self-hosted smoke suite's check of `GET /invite` (Verification). Changes to story 1.2's or story 1.3's browser tests beyond what CAP-9 requires (none expected). Deploys.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Administrator opens menu | signed in as admin | "Invite a person" present; opens the panel | N/A |
| Standard user opens menu | signed in as a standard user | no "Invite a person" | N/A |
| Invite | email, name, role | link `https://…/invite#…`, Copy, expiry as local date and time | N/A |
| Copy fails | `clipboard.writeText` mocked to reject | the link field is selected; "Select the link and copy it." (review finding 25) | N/A |
| Invite existing email | admin's own email | message by Email; no link | `invitation_email_taken` |
| Invite, no answer | invite request mocked to fail | the network message above the button | N/A |
| Open link | new browser context | inviter, installation, role, email shown; address bar `…/invite` with no fragment | N/A |
| `/invite` headers | `page.goto('/invite')`, `page.goto('/invite/')`, `page.goto('/')` | the first two responses carry `referrer-policy: no-referrer`; the third does not (review finding 5) | N/A |
| Set-up state cannot be checked | set-up state read mocked to 500 at `/invite#…` | "Set-up cannot be checked"; the address bar has no fragment (review finding 3) | N/A |
| Session read cannot be checked | session read mocked to 500 at `/invite#…` | the invitation page still shows (review finding 3) | N/A |
| Signed in while opening | the administrator opens the link in their own browser | "You are signed in as ‹name›. Setting this password signs you out." (review finding 20) | N/A |
| Malformed fragment | `/invite#abc` | the D-3 message; no invitation request sent (review finding 11) | N/A |
| Typing a password | email of 12 or more characters; empty, then 5 characters, then 12, then the email | empty: both not met; length not met → met; "not your email" met → not met (review finding 28) | N/A |
| Passwords differ | Password again differs | "The two passwords do not match."; nothing sent | N/A |
| Accept | name edited from the prefill, matching passwords | app opens, account menu shows the edited name, no "Invite a person" (review finding 13) | N/A |
| Accept as an administrator | invitation with role Administrator | the new account's menu holds "Invite a person" (review finding 14) | N/A |
| Accept fails | accept mocked to 500 | "Your password may not have been set. …" with Try again (review finding 7) | N/A |
| Reuse link | same link after acceptance | form replaced by the unusable message with "ask an administrator" | `invitation_unusable` |
| Expired link | invitation read mocked to answer 410 | same message | `invitation_unusable` |
| Reload after opening | fragment already removed | "Open the invitation link again to continue." | N/A |
| Read fails | invitation read aborted / 500 (mocked) | "The invitation cannot be checked", Try again | N/A |
| Session read after sign-in | sign-in succeeds, the following session read mocked to signed out / to 500 | the sign-in page / "Sign-in cannot be checked" (review finding 29) | N/A |
| Same-name account in another tab | tab A as account X, tab B signs in as Y with X's name; A becomes visible | A reloads as Y | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/AccountMenu.jsx`, `src/account-menu.css` -- the menu item and its role prop.
- `site-studio/src/App.jsx` (line 654) -- passes `account`; `src/main.jsx` -- `Start`, `Signed`, the visibility re-read, the `/invite` branch and the fragment capture at module start.
- `site-studio/src/admin/SignInPage.jsx`, `signInClient.js`, `signin.css`, `setupState.js` -- page, client and "cannot be checked" patterns; `readSession`, `isSessionReply`.
- `site-studio/browser-tests/signin.spec.mjs`, `playwright.config.mjs` -- helpers for set-up, sign-in, cookies, mocked replies and axe; `signInServers`.
- `site-studio/server-tests/setup-client.test.ts` -- the pattern for testing a page module that imports `shared/`.
- `site-studio/deploy/selfhost/smoke.mjs` -- the self-hosted smoke suite.

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/src/admin/invitationClient.js` -- invite, read and accept calls with the app's header; outcome mapping; no message repeats an entered value; imports only `shared/refusal.ts` from `shared/`.
- [x] `site-studio/src/admin/InvitePanel.jsx`, `src/AccountMenu.jsx` -- the item and the lazily loaded panel.
- [x] `site-studio/src/admin/InvitationPage.jsx`, `src/admin/invitationRules.js`, `src/admin/invitation.css`, `src/main.jsx` -- the page, its rule list's text, the `/invite` branch, the fragment capture, the `accountId` comparison.
- [x] `site-studio/src/admin/setupState.js` -- `readSession` and `isSessionReply` for `accountId` and `role`.
- [x] `site-studio/tests/invitation-client.test.mjs` -- outcome mapping; `tests/signin-client.test.mjs` gains the `accountId` and `role` cases (brownfield.md).
- [x] `site-studio/server-tests/invitation-page-text.test.ts` -- the rule list's text and states from `invitationRules.js` (review finding 8).
- [x] `site-studio/browser-tests/invitation.spec.mjs` -- matrix rows, axe on the panel (form and link) and the page (form and unusable), the same-name test for story 1.3's D-16; each test uses its own email.
- [x] `site-studio/deploy/selfhost/smoke.mjs` -- `GET /invite` carries `Referrer-Policy: no-referrer` (review finding 5).

**Acceptance Criteria:**
- Given an administrator signed in, the account menu holds "Invite a person" and it opens the invite panel (criterion 1).
- Given the panel filled with email, name and role, the administrator receives a link to copy: the link field holds `…/invite#` plus 43 characters, Copy puts it on the clipboard in Chromium, and the expiry is shown as local date and time (criterion 2).
- Given the link opened in a new context, the page shows the inviter's name and the installation's name (criterion 3).
- Given a password typed into the page, each of story 1.2's rules shows as met only once it is met, and a password that breaks one cannot be submitted (criterion 5).
- Given the link opened, the address bar holds `…/invite` with no fragment, also when the set-up state read cannot be checked, and the `/invite` responses carry `referrer-policy: no-referrer`; together with spec 1's length and hash-only tests and spec 2's log watch and header test, standing rule 14 is shown (criterion 7).
- Given a used link, and an expired one (mocked read), the page says the link no longer works and to ask an administrator for a new one (criterion 11).
- Given a standard user signed in after accepting, the account menu has no "Invite a person"; together with spec 2's `administrator_only` route test, criterion 14 is shown.
- axe finds no serious or critical violation on the panel and the page in both states; four deliberate breakages ("Invite a person" shown to a standard user, the fragment left in the address bar, the rule list not updating, and the visibility re-read comparing the name instead of `accountId`) each fail a named test, recorded below (CAP-10; review finding 19).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run test:browser` -- pass in `chromium` and `webkit-iphone`
- `npm run smoke:selfhost` -- pass, with the `GET /invite` header check (review finding 5)

## Verification record

Final run on 2026-11-21 by the build session, after the review's patches (the last change), each command run in turn in `site-studio/`: `npm test` 171 passed, 0 failed; `npm run typecheck` clean; `npm run test:server` 28 files, 350 tests passed; `npm run build` passed; `npm run test:sites` 4 passed; `npm run test:browser` 130 passed in `chromium` and `webkit-iphone` together (27 in `invitation.spec.mjs` per project at that run; ruling 1 adds one more, story 1.2's and story 1.3's specs unchanged and passing), none flaky; `npm run smoke:selfhost` passed with the `GET /invite` and `GET /invite/` header check. The `UnknownCA` TLS lines in the browser run's server log are the local servers' self-signed certificate refused by a client, as in earlier stories, and failed nothing. Earlier, during implementation, one `npm run test:server` run timed out once in `setup-store.test.ts`'s scrypt parameter test while a build ran beside it; it passed when re-run and in the final run.

## Deliberate breakages (CAP-10, review finding 19)

Each breakage was applied alone to the built app, before the review's patches, which did not touch the code the breakages changed (the `hashchange` listener added to `invitationAddress.js` does not run when a link is opened in a new page), and `browser-tests/invitation.spec.mjs` run in `chromium` (2026-11-21); the file was restored afterwards. The suite is serial, so the first failing test stops the project; that test is named.

| Breakage | Change made | Failing test |
|---|---|---|
| "Invite a person" shown to a standard user | `src/AccountMenu.jsx`: `isAdministrator = true` | accepting with an edited name opens the app as that standard user, with no Invite a person; the used link then no longer works |
| The secret left in the address bar | `src/admin/invitationAddress.js`: the `history.replaceState` call removed | the link opened in a new browser shows the inviter, the installation, the role and the email, with no fragment in the address bar |
| The rule list not updating | `src/admin/InvitationPage.jsx`: the list built from `''` instead of the typed password | typing a password turns each rule met only once it is met, and a password breaking one is not sent |
| The visibility re-read comparing the name | `src/main.jsx`: `previous.name !== next.name` in place of `previous.accountId !== next.accountId` | a tab signed in as one account reloads as another account of the same name signed in from another tab (story 1.3's D-16) |

## Build notes

- Under `wrangler dev --local-protocol https` the Worker sees requests as `http://`, so the public address set-up records in the browser tests is the server's `http://` origin and the invite link starts with it. The tests check the link's host, path and 43-character fragment, and open its path and fragment on the server's `https://` origin. The link is still built on the recorded address (spec 2); nothing in the server changed.
- Wording this spec leaves open, chosen to match the existing pages: the panel's field hints ("Enter an email address, such as name@example.com, of at most 254 characters.", "Enter the person's name, 1 to 80 characters."), the page's password messages (the set-up page's), the rule states "Met" and "Not yet met", the reload page's line under its heading, and "Checking the invitation…". The panel's `updating` refusal uses the sign-in page's updating text; on the page, an `updating` accept shows the failed-accept message as Always requires, and an `updating` read shows "The invitation cannot be checked" (it is a 503).
- The secret is captured by `src/admin/invitationAddress.js`, imported first in `src/main.jsx`, so it runs before any other app module.

## Kevin's rulings after the build (2026-11-21)

Raised in the build's hand-back; Kevin answered "Let's use your recommendations." These read alongside the frozen block, which is unchanged.

1. **`updating` on the invitation page.** An invitation read answered `updating` shows "Site Survey Design is updating. Try again in a moment." with Try again, instead of "The invitation cannot be checked" (the Always bullet's 5xx case keeps every other 5xx). An `updating` accept still shows the failed-accept message, as the Always bullet says. Test: "when the invitation read answers updating the page says so, and Try again reads it again"; `tests/invitation-client.test.mjs` maps a 503 `updating` read to `updating`.
2. **Try again after a timed-out accept that had succeeded** shows the unusable message; left as it is, since the failed-accept message already says to try signing in (triage row 2).
3. **The invite link's `http://` origin in local runs** (Build notes) is a follow-up in the server, where set-up records the public address; recorded in `deferred-work.md`. No server change in this spec.

Run after ruling 1's change (2026-11-21): `npm test` 172 passed, 0 failed; `npm run typecheck` clean; `npm run build` passed; `npm run test:server` 350 passed; `browser-tests/invitation.spec.mjs` 56 passed (28 per project). Not re-run, because the change touches only the invitation page and its client: the other browser specs, `npm run test:sites` and `npm run smoke:selfhost` (all passed in the final run above). Failed once and then passed: in the first run after the change, `server-tests/invitation-page-text.test.ts` › "sends the secret only in a JSON body, with the app's header, never in the address (D-1)" hit vitest's 5 s timeout on a loaded machine (the first request's dynamic import of `shared/routes.ts`), and the browser run could not start because port 8791 was still held, apparently by a server left from an earlier run that had exited by the time it was checked; both passed when re-run.

## Matrix rows to tests

Every test named here is in `site-studio/browser-tests/invitation.spec.mjs` and runs in both `chromium` and `webkit-iphone` unless marked.

| Matrix row | Test |
|---|---|
| Administrator opens menu | an administrator's account menu holds Invite a person, which opens a labelled panel that Escape and Close leave with focus on the menu |
| Standard user opens menu | accepting with an edited name opens the app as that standard user, with no Invite a person; the used link then no longer works |
| Invite | inviting shows the link once with Copy and the expiry as local date and time; Invite another person starts again (clipboard checked in `chromium` only, CAP-10) |
| Copy fails | when copying fails the link is selected and the panel says to copy it by hand |
| Invite existing email | inviting an email that has an account shows the refusal by Email and no link |
| Invite, no answer | when the invite request gets no answer the panel says so above its button |
| Open link | the link opened in a new browser shows the inviter, the installation, the role and the email, with no fragment in the address bar |
| `/invite` headers | the /invite page is served with Referrer-Policy: no-referrer, and / is not; also `deploy/selfhost/smoke.mjs` |
| Set-up state cannot be checked | with the set-up state not checkable at the link, the page says so and the address bar holds no fragment |
| Session read cannot be checked | with the session read not checkable at the link, the invitation page still shows |
| Signed in while opening | the administrator opening a link in their own browser is told that setting the password signs them out |
| Malformed fragment | a malformed fragment says the link no longer works without asking the server |
| Typing a password | typing a password turns each rule met only once it is met, and a password breaking one is not sent; the rule text and states also in `server-tests/invitation-page-text.test.ts` |
| Passwords differ | typing a password turns each rule met only once it is met, and a password breaking one is not sent (its mismatch step) |
| Accept | accepting with an edited name opens the app as that standard user, with no Invite a person; the used link then no longer works |
| Accept as an administrator | accepting an administrator invitation gives the new account Invite a person |
| Accept fails | when accepting fails the page says the password may not have been set, and Try again completes it |
| Reuse link | accepting with an edited name opens the app as that standard user, with no Invite a person; the used link then no longer works |
| Expired link | an expired link (the read answering 410) says the link no longer works |
| Reload after opening | a reload after opening asks to open the link again |
| Read fails | when the invitation read fails the page says it cannot be checked, and Try again reads it again (aborted and 500) |
| Session read after sign-in | after a sign-in, a session read answering signed out shows the sign-in page, and one that cannot be checked says so |
| Same-name account in another tab | a tab signed in as one account reloads as another account of the same name signed in from another tab (story 1.3's D-16) |

Added by the review (rows 14 to 16 and 18 of the triage log), beyond the matrix: "an invite refused as not signed in shows the sign-in page"; "an invite refused for its name shows the message by the Name field"; "an accept refused as unusable replaces the form with the no-longer-works message"; "an accept refused for its password shows the server's message by the Password field"; "a link opened at /invite/ shows the invitation, with no fragment in the address bar"; "a second link opened in a tab already at /invite shows that invitation, with no fragment in the address bar".

Acceptance criteria: criterion 1 → Administrator opens menu; criterion 2 → Invite; criterion 3 → Open link; criterion 5 → Typing a password; criterion 7 → Open link, `/invite` headers, Set-up state cannot be checked; criterion 11 → Reuse link, Expired link; criterion 14 → Standard user opens menu (with spec 2's `administrator_only` route test); axe and the four breakages (CAP-10) → the axe calls in the tests above and the breakage table.

## Review Triage Log

Review of 2026-11-21 (iteration 0): three layers on the code diff since `3a7424b` (blind hunter, edge-case hunter, verification gap). One row per finding.

| # | Layer | Finding | Verdict | Evidence | Outcome |
|---|---|---|---|---|---|
| 1 | blind | A pointer-down on the panel's backdrop closes it while the one-time link shows, discarding it | medium | `InvitePanel.jsx` closed on any backdrop pointer-down; D-9 makes the link unrecoverable | fixed (patch): the backdrop no longer closes the panel |
| 2 | blind | After a timed-out accept, Try again meeting `invitation_unusable` shows the generic unusable page, dropping the "try signing in" hint | low | Real: the second reply replaces the failed-accept message. Needs a first accept to commit after the 30 s timeout; the fix needs wording the spec does not give | rejected: rare, and the failed-accept message already told the person what to do; Kevin agreed (ruling 2 below) |
| 3 | blind | The reload page says the link "still works until it is used", omitting replacement and expiry | low | Wording chosen in the build, not pinned by the spec | fixed (patch): reworded |
| 4 | blind | An `updating` read or accept on the page never shows the updating wording | low | The code follows the frozen Always bullets (5xx read → cannot be checked; `updating` accept → failed-accept message), but the wording list puts the updating text under Page | fixed after Kevin's ruling 1 below: an `updating` read shows the update wording with Try again |
| 5 | blind | The unusable heading and detail come from splitting the server message on ". " | false | A change to the message is caught: the browser tests pin the heading "This invitation link no longer works." | rejected |
| 6 | blind | After sign-in, the session re-read has no busy state or generation guard | low | `SignInPage` ends its busy state before `onSignedIn`'s read; a second click signs in again, harmlessly; both reads ask the same server state | rejected: unlikely (the read is fast) and the fix reworks `SignInPage`'s in-flight guard |
| 7 | blind | A visibility reload on `/invite` drops the secret mid-form | low | Real only when the same browser holds a session and another tab switches account; the link still works and the page says to open it again | rejected: rare, the harm is a re-open, the fix adds a branch |
| 8 | blind | The focus trap is untested and the background is not inert | low | `aria-modal` is set and axe passes; focus in, Escape and Close (what the spec asks) are tested | rejected |
| 9 | blind | The lazy panel load has no busy state; closing the menu meanwhile still opens the panel | low | Real but the chunk is small and local | rejected |
| 10 | blind | The expiry test checks only the date, from `Date.now()` | medium | The test compared day, month and year only; time unchecked and midnight-sensitive | fixed (patch): compares date and time with the reply's `expiresAt` |
| 11 | blind | The copy status is never reset, so a second copy announces nothing | low | Direct one-line correction | fixed (patch): reset at each attempt |
| 12 | blind | The panel's heading name (trimmed) may differ from the server's normalisation | false | `personNameField` is `trimmedText(PERSON_NAME_MAX)` (`shared/setup.ts:67`): the server trims only | rejected |
| 13 | blind | The smoke suite checks no near-miss path for the header | false | `server-tests/invitation-routes.test.ts:617` checks that `/`, `/invite/other` and `/inviter` carry no header | rejected |
| 14 | verification-gap | The panel's `not_signed_in` and `invalid_input`-field branches are untested in the page | gap | Filed pre-verified | fixed (patch): two browser tests |
| 15 | verification-gap | The accept's `invitation_unusable` and field branches are untested in the page | gap | Filed pre-verified | fixed (patch): two browser tests |
| 16 | verification-gap | `/invite/` with a fragment is untested for the page and the fragment removal | gap | Filed pre-verified | fixed (patch): browser test |
| 17 | verification-gap | A same-account role change on the visibility re-read is untested | gap | Filed pre-verified, disposition defer: no story 1.4 flow changes a role | deferred (`deferred-work.md`, story 1.9) |
| 18 | edge-case | A second link opened in a tab already at `/invite` is a hash-only navigation: the new secret stays in the address bar | medium | No reload happens, so `invitationAddress.js` never runs again (standing rule 14) | fixed (patch): `hashchange` reloads at the invite path, with a browser test |
| 19 | edge-case | Visibility reload on `/invite` after an account switch | low | Same as row 7 | rejected (as row 7) |
| 20 | edge-case | Role dropping to standard while the panel is open | low | Unreachable in story 1.4 | deferred with row 17 (story 1.9) |
| 21 | edge-case | Sign-in button re-enabled during the post-sign-in session read | low | Same as row 6 | rejected (as row 6) |
| 22 | edge-case | The client loads `shared/routes.ts`, though the spec says it imports only `refusal.ts` | false | The spec says "as `signInClient.js` does", and `signInClient.js:87` loads `routes.ts` the same way at request time; the static imports are `refusal.ts` only, so `tests/` loads it in Node (review finding 8's purpose) | rejected |
