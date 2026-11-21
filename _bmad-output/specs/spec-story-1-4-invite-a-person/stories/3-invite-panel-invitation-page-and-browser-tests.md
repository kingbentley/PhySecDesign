---
title: 'Story 1.4, spec 3: Invite panel, invitation page and browser tests'
type: 'feature'
created: '2026-11-21'
status: 'ready-for-dev'
route: 'dispatch'
baseline_commit: ''
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
- [ ] `site-studio/src/admin/invitationClient.js` -- invite, read and accept calls with the app's header; outcome mapping; no message repeats an entered value; imports only `shared/refusal.ts` from `shared/`.
- [ ] `site-studio/src/admin/InvitePanel.jsx`, `src/AccountMenu.jsx` -- the item and the lazily loaded panel.
- [ ] `site-studio/src/admin/InvitationPage.jsx`, `src/admin/invitationRules.js`, `src/admin/invitation.css`, `src/main.jsx` -- the page, its rule list's text, the `/invite` branch, the fragment capture, the `accountId` comparison.
- [ ] `site-studio/src/admin/setupState.js` -- `readSession` and `isSessionReply` for `accountId` and `role`.
- [ ] `site-studio/tests/invitation-client.test.mjs` -- outcome mapping; `tests/signin-client.test.mjs` gains the `accountId` and `role` cases (brownfield.md).
- [ ] `site-studio/server-tests/invitation-page-text.test.ts` -- the rule list's text and states from `invitationRules.js` (review finding 8).
- [ ] `site-studio/browser-tests/invitation.spec.mjs` -- matrix rows, axe on the panel (form and link) and the page (form and unusable), the same-name test for story 1.3's D-16; each test uses its own email.
- [ ] `site-studio/deploy/selfhost/smoke.mjs` -- `GET /invite` carries `Referrer-Policy: no-referrer` (review finding 5).

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
