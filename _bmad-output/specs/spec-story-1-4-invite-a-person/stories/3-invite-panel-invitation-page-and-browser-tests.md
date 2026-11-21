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

> Runs after spec 2. Builds to Kevin's decisions D-1, D-2, D-3, D-5, D-7, D-8, D-9 and D-11 in SPEC.md. Visual source: the S-27 and S-30 screens on the design canvas (`design-canvas.md`); the S-30 panel's project list is left out (story 1.7).

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing on screen lets an administrator invite anyone or an invited person accept; the page tells accounts apart only by name.

**Approach:** Add "Invite a person" to an administrator's account menu, the invite panel, the `/invite` page in the start-up flow with a live password rule list, the switch of the page's account comparison to `accountId`, and Playwright and axe tests in Chromium and WebKit iPhone. Covers CAP-1, CAP-3's page, CAP-4's list, CAP-5's message, CAP-9's page side and CAP-10.

## Boundaries & Constraints

**Always:**
- The menu item shows only when the session's `role` is `administrator`. The panel is a labelled dialog with focus moved into it, Escape and a Close button returning focus to the menu trigger.
- Panel fields: Email, Name, Role (radio group, Standard user selected by default). Field checks use `inviteInput` from `shared/invitation.ts`. On success the panel shows the link in a read-only field, Copy (`navigator.clipboard.writeText`, with "Copied" announced), the expiry date, and "Invite another person". Closing discards the link (D-9). A refusal shows its message by the named field; `not_signed_in` shows the sign-in page.
- `/invite` and `/invite/` after set-up show the invitation page whatever the session. It reads the fragment once, then `history.replaceState` to `/invite` with no fragment, keeping the secret in memory only (D-1, D-8). No fragment → "Open the invitation link again to continue."
- The page reads the invitation and shows the inviter, the installation, the role and the email (read-only); Name prefilled and editable (D-7); Password and Password again; the rule list from `passwordRules`, each item's state in text and an icon shape as well as colour, in a polite live region. Fields labelled, 16 px, `autocomplete` `name` and `new-password`, a hidden `username` field with the email so password managers save the pair.
- `invitation_unusable` replaces the form with the D-3 message; a network failure, timeout or 5xx shows "The invitation cannot be checked" with Try again (as story 1.3's pages); `signin_busy` asks to try again shortly.
- After a successful accept, `location.replace('/')` loads the app in a fresh document (D-2), signed in as the new account.
- `src/main.jsx` keys `<App>` on `accountId` and the visibility re-read compares `accountId` (CAP-9). After a sign-in it reads the session once to learn `accountId` and `role` (the sign-in reply carries only the name). `isSessionReply` accepts the two new fields. The menu receives `role`.
- UX section 10 (contrast, 2 px focus ring, 200% zoom, 44 px targets on the iPhone viewport, 32 px on desktop) in the white and teal direction with `BrandMark` on the invitation page (standing rule 5).
- The app stays JavaScript; page modules load lazily as the sign-in page does, so the prototype's bundle does not grow by the page's rules.

**Never:** Server, `shared/` rules or route changes (specs 1 and 2). Changes to story 1.2's or story 1.3's browser tests beyond what CAP-9 requires (none expected). Deploys.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Administrator opens menu | signed in as admin | "Invite a person" present; opens the panel | N/A |
| Standard user opens menu | signed in as a standard user | no "Invite a person" | N/A |
| Invite | email, name, role | link `https://…/invite#…`, Copy, expiry date | N/A |
| Invite existing email | admin's own email | message by Email; no link | `invitation_email_taken` |
| Open link | new browser context | inviter, installation, role, email shown; address bar `…/invite` with no fragment | N/A |
| Typing a password | 5 characters, then 12, then the email | length not met → met; "not your email" met → not met | N/A |
| Accept | name, matching passwords | app opens, account menu shows the name, no "Invite a person" | N/A |
| Reuse link | same link after acceptance | form replaced by the unusable message with "ask an administrator" | `invitation_unusable` |
| Expired link | invitation read mocked to answer 410 | same message | `invitation_unusable` |
| Reload after opening | fragment already removed | "Open the invitation link again to continue." | N/A |
| Read fails | invitation read aborted / 500 (mocked) | "The invitation cannot be checked", Try again | N/A |
| Same-name account in another tab | tab A as account X, tab B signs in as Y with X's name; A becomes visible | A reloads as Y | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/src/AccountMenu.jsx`, `src/account-menu.css` -- the menu item and its role prop.
- `site-studio/src/App.jsx` (line 654) -- passes `account`; `src/main.jsx` -- `Start`, `Signed`, the visibility re-read, the `/invite` branch.
- `site-studio/src/admin/SignInPage.jsx`, `signInClient.js`, `signin.css`, `setupState.js` -- page, client and "cannot be checked" patterns; `isSessionReply`.
- `site-studio/browser-tests/signin.spec.mjs`, `playwright.config.mjs` -- helpers for set-up, sign-in, cookies, mocked replies and axe.

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/src/admin/invitationClient.js` -- invite, read and accept calls with the app's header; outcome mapping; no message repeats an entered value.
- [ ] `site-studio/src/admin/InvitePanel.jsx`, `src/AccountMenu.jsx` -- the item and the panel.
- [ ] `site-studio/src/admin/InvitationPage.jsx`, `src/admin/invitation.css`, `src/main.jsx` -- the page, the `/invite` branch, the `accountId` comparison.
- [ ] `site-studio/tests/invitation-client.test.mjs` -- outcome mapping and the rule list's text.
- [ ] `site-studio/browser-tests/invitation.spec.mjs` -- matrix rows, axe on the panel (form and link) and the page (form and unusable), the same-name test for story 1.3's D-16; each test uses its own email.

**Acceptance Criteria:**
- Given an administrator signed in, the account menu holds "Invite a person" and it opens the invite panel (criterion 1).
- Given the panel filled with email, name and role, the administrator receives a link to copy: the link field holds `…/invite#` plus 43 characters, Copy puts it on the clipboard in Chromium, and the expiry date is shown (criterion 2).
- Given the link opened in a new context, the page shows the inviter's name and the installation's name (criterion 3).
- Given a password typed into the page, each of story 1.2's rules shows as met only once it is met, and a password that breaks one cannot be submitted (criterion 5).
- Given the link opened, the address bar holds `…/invite` with no fragment; together with spec 1's length and hash-only tests and spec 2's log watch and header test, standing rule 14 is shown (criterion 7).
- Given a used link, and an expired one (mocked read), the page says the link no longer works and to ask an administrator for a new one (criterion 11).
- Given a standard user signed in after accepting, the account menu has no "Invite a person"; together with spec 2's `administrator_only` route test, criterion 14 is shown.
- axe finds no serious or critical violation on the panel and the page in both states; three deliberate breakages ("Invite a person" shown to a standard user, the fragment left in the address bar, the rule list not updating) each fail a named test, recorded below (CAP-10).

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run test:browser` -- pass in `chromium` and `webkit-iphone`
