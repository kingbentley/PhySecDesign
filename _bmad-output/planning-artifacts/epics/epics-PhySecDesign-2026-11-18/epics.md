---
title: "Site Studio — Epics and Stories"
status: draft 0.6; epic order confirmed by Kevin; story content revised after an independent review and not yet confirmed
created: 2026-11-18
inputs: "final PRD 1.2; UX design specification 0.5; architecture 3.0"
method: BMAD Create Epics and Stories; reviewed with BMAD Review
---

# Site Studio — Epics and Stories

This document breaks [final PRD 1.2](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and experiments (R-numbers). It adds no requirement.

## Status

- **Draft 0.6**, 2026-11-18. 10 epics, 89 stories. Nothing here has been built.
- **Confirmed by Kevin:** the epic order (accounts first; the self-hosted image at the end of Epic 2; extended modelling after return visits).
- **Reconciled between epics.** Each of the six parts the draft was revised in has had a second pass to agree shared wording, values and hand-overs with the others. That pass was done by the same authors; no independent reader has checked the result.
- **Not confirmed:** the story boundaries and acceptance criteria. Draft 0.6 applies the [independent review](review-epics-draft-0.5.md) of draft 0.5. The revision itself has not been independently reviewed.
- **For Kevin to confirm:** the choices listed in [Choices made in draft 0.6](#choices-made-in-draft-06), where the PRD, UX specification and architecture gave no value and a criterion needed one.
- **Not done:** sizing, which belongs to sprint planning.
- Earlier drafts are described in [Revision history](#revision-history).

## The epics

| Epic | Outcome | Stories | Depends on |
| --- | --- | --- | --- |
| 1. Install, sign in and manage people | An organisation can deploy Site Studio on Cloudflare, set it up, invite people, and control who can see and change each project. | 10 | Nothing earlier and nothing later. Inside the epic each story needs only the stories before it. |
| 2. One shared project online | The existing design tool runs as one shared project, on Cloudflare and on your own server. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work. | 15 | Epic 1 complete. Nothing later. |
| 3. A workspace that holds the whole job | The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure. | 6 | Epic 1 complete and story 2.1. Story 3.1 also needs story 2.2, whose save status it moves into the frame. Story 3.2 needs story 2.7 for device lifecycle. Story 3.5 needs story 2.7. Story 3.6 needs story 2.3, and stories 2.10 and 2.11 for its Evidence tab and device menu. Nothing later. |
| 4. Design, estimate and issue | A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package. | 10 | Epics 1, 2 and 3 complete. Nothing later: every criterion in this epic can be tested with the stories before it. |
| 5. Install, test and close out in the field | A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package. | 13 | Epic 4 complete (named revisions 4.1, approval assignments 4.6, reviewer links 4.7, the issued design 4.8, cancellation and correction 4.9, packages 4.10); from earlier epics, saving and conflicts (2.2 to 2.4), device records with lifecycle and the acceptance-size fixture (2.7), notes and photos (2.10), the project frame (3.1) and the first work scope (2.1). Nothing later: no criterion in this epic needs a story from Epics 6 to 10. |
| 6. Existing sites and return visits | An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact. | 12 | Epics 1 to 5 complete. Nothing later: what removal and restoration do to switch ports is in story 7.5, and what they do to door links is in story 7.3. |
| 7. Extended modelling | The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors. | 7 | Epics 1 to 5 complete. Story 7.3 also needs story 6.8, story 7.5 needs stories 6.8 and 6.9, and story 7.7 needs stories 7.1 to 7.6. Nothing later. |
| 8. Backups and recovery | Projects and the installation's own data are backed up daily, a project or a whole installation can be recovered, and a project can be moved as a portable backup. | 5 | Epics 1 to 7. The backup and restore checks name records from all of them: revisions and packages (Epic 4), evidence and issues (Epic 5), removed devices and archive state (Epic 6), connections (Epic 7). The self-hosted parts need stories 2.13 to 2.15. Nothing later. |
| 9. Install from published instructions and update from the interface | Anyone can install Site Studio on either host from published instructions, and an administrator can install a new signed release with one action and get the earlier version back if it fails. | 7 | Story 9.1 needs stories 1.2, 2.13 to 2.15 and 8.1. Story 9.2 needs story 2.13. Story 9.3 needs stories 1.1 and 8.1. Story 9.4 needs story 9.2. Stories 9.5 to 9.7 need all of Epic 8 and stories 9.2 to 9.4, because an update takes a backup first and restores it on failure. Nothing later. |
| 10. Acceptance | The proof of concept is measured against the PRD's acceptance profile on Cloudflare, and then on a self-hosted installation. Passing stories 10.2 and 10.3 is enough to accept the proof of concept on Cloudflare; a self-hosted installation is not described as supported until story 10.4 passes. | 4 | Epics 1 to 9 complete. Nothing later. |

## How to read it

- **Stories** are sized to be built and verified in one sitting. A story's criteria can be tested using only the stories before it.
- Each story has a user-story sentence, a **Covers** line naming the requirements, architecture decisions and experiments it delivers, and **acceptance criteria**. Every criterion is something a tester can observe.
- A **Notes** line, where present, holds what is not a criterion: a later story that extends this one, an experiment's finding, or an action for Kevin.
- Criteria draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** apply to every story and are not repeated in them.
- [Requirement coverage](#requirement-coverage) is at the end.

### Standing rules

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every server route sits behind the access gate (AD-12). From Epic 2 on, each story's write paths are tested as an Editor and shown to be refused for a Viewer and for a signed-in user who is not a member. The one exception is story 4.6: a Viewer who is the approval assignee can comment and decide, and those tests accept the assigned Viewer and refuse any other. For a signed-in action, the actor recorded is always the signed-in account. An action through a reviewer link (story 4.7) records the name the reviewer entered, marked not verified.
3. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
4. Fixed records and stored files are never modified (AD-3, AD-8).
5. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
6. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (architecture section 10, decision K6).
7. The server is one build for both hosts. Host-specific code lives only behind the file-store and update interfaces, and no platform feature outside the list in AD-16 is used. Server tests run in Cloudflare's runtime, and the self-hosted smoke suite is extended for each new area once story 2.13 has built it.
8. From the first published release onward, a changed record shape comes with its data conversion (AD-20). Before that release there is no earlier data to convert.
9. A story that adds a kind of record states whether a revision restore replaces it or leaves it unchanged (story 4.1 sets the principle).
10. Performance criteria are measured against the acceptance-size test project that story 2.7 generates.

### Definition of done

A story is done when its criteria pass in a browser against the locally run server, its automated tests pass, the self-hosted smoke suite passes once it exists, and the existing tests still pass. Where a criterion names a deployed Cloudflare test installation or a real phone or tablet, it is tested there.

## Epic 1: Install, sign in and manage people

**Outcome.** An organisation can deploy Site Studio on Cloudflare, set it up, invite people, and control who can see and change each project.

**Depends on.** Nothing earlier and nothing later. Inside the epic each story needs only the stories before it.

**Why here.** Every later story needs to know who is acting and what they may do. The architecture lists the project foundation before accounts; here they are swapped so that the first shared project is built on real sign-in, not on a temporary access scheme that would be thrown away. Story 1.1 still lays the foundation both need.

### Story 1.1: Run the app on Cloudflare with a portable server core

As an organisation's administrator, I want Site Studio served by one server build that runs on Cloudflare and also starts under the self-hosted runtime, so that my organisation can use either host.

Covers: AD-1, AD-16, AD-17, AD-20 (data-format version and conversion runner), architecture section 10, experiments R7 and R8.

- When the local development command runs, the existing app loads from the locally run Worker through Cloudflare's Vite plugin with no change in behaviour, and the existing tests still pass.
- The Worker has exactly two Durable Object classes, a project room and the installation object, each with SQLite storage.
- One server test runs inside Cloudflare's runtime using `@cloudflare/vitest-plugin`.
- A self-hosted configuration starts the same built bundle under Cloudflare's open-source runtime, and a smoke test in continuous integration shows a value saved, the process restarted, and the value read back.
- The file-store and update interfaces are defined in the server, and the configuration for each host declares no D1, Workflows, Queues, scheduled-trigger or KV binding.
- The project room and the installation object each record a data-format version when first created, and a test reads it back after a restart.
- A conversion runner compares the recorded data-format version with the build's version each time an object starts and applies the listed conversions in order. Its list is empty, and a test with one sample conversion shows the conversion applied once and the recorded version raised.
- An object whose recorded data-format version is newer than the build's refuses requests with an explanation.
- On a Cloudflare account on the Workers Paid plan, the deploy command makes the app reachable over HTTPS at a `workers.dev` address. This is checked on a deployed Cloudflare test installation.
- Dependency versions are pinned, and a clean install from the lock file succeeds in continuous integration.
- The static "Sites" package and its test still work (K7).

Notes: Experiments R7 and R8 were run early; see the experiments record. R7 met an install problem, which the pinned versions avoid or the repository documents. No Durable Object class is added later without Kevin's decision. Story 9.3 adds the behaviour and tests for moving between released versions, and adds the pending-update recovery rule to the refusal above. From the first published release onward, a changed record shape comes with its conversion.

### Story 1.2: Set up a new installation

As an organisation's administrator, I want a one-time set-up step that only the person who installed Site Studio can complete, so that I become its first administrator and nobody else can.

Covers: FR-66 (set-up; Cloudflare host), AD-12. Screens: S-25.

- The Cloudflare deploy command generates a random set-up code of at least 20 characters, supplies it to the installation as a secret and prints it once in the deployment output.
- An installation with no users shows the set-up page when opened. Once any user exists, the page and its request are refused.
- The step asks for the set-up code, the installation's name and the first administrator's name, email and password. The page states that it disappears once an administrator exists.
- The password must have 12 to 128 characters and must not equal the account's email address; there are no other composition rules. The installation's name must be 1 to 80 characters.
- A wrong or missing set-up code is refused. After 5 wrong codes, further attempts from any address are refused for 1 minute, doubling after each further failure up to 15 minutes, and the page says how long to wait.
- On completion exactly one administrator exists, the installation's name shows on the sign-in page, and the set-up code no longer works.
- Two set-up requests sent at the same moment create one administrator; the second is refused.
- Deploying again to an installation that has users does not make set-up available.
- On a deployed Cloudflare test installation, a plain HTTP request is redirected to HTTPS or refused.
- Two test installations deployed from the same build share nothing: an account, a session and a project created on one are unknown to the other.

Notes: The self-hosted set-up code, printed in the server output, is part of story 2.13. That two installations share no files is shown once files exist (stories 2.6 and 2.13). Installation instructions are story 9.1.

### Story 1.3: Invite a person and sign in

As an administrator, I want to invite a colleague who then sets a password and signs in, so that each person has their own account.

Covers: FR-67 (invitation, sign-in, sign-out), NFR-5, AD-12, experiment R9. Screens: S-26, S-27, S-30 invite panel.

- An administrator invites a person by email, name and role (administrator or standard user) and receives a link to copy. There is no open registration, and no page or request creates an account without an invitation.
- An invitation works once and expires 7 days after it is issued. A used or expired link says so and tells the person to ask an administrator for a new one.
- Inviting an email that already has an active or deactivated account is refused, and the administrator is told that account's state. Inviting an email that has an unused invitation replaces the earlier link, which stops working.
- The invitation page shows who invited the person and the installation's name. The person sets a name and a password and is signed in.
- The password must meet the password rules of story 1.2, and the page shows each rule as it is met.
- A wrong email or password gives one message, "That email and password do not match.", whether or not the email has an account.
- After 5 failed sign-ins in a row for one email, or 20 from one network address within 15 minutes, further attempts are refused for 1 minute, doubling after each further failure up to 15 minutes. The page says how long to wait, and the wait is the same for an email with no account.
- A successful sign-in clears that email's failure count.
- Passwords are stored only as salted PBKDF2-SHA256 hashes made through Web Crypto at 600,000 iterations, with the parameters stored beside each hash.
- Experiment R9 has a recorded result from a deployed Cloudflare test installation: the 600,000-iteration hash is accepted without a platform error and sign-in completes in under 1 second at the median of 20 sign-ins. If it does not pass, the fallback taken (a lower count within current published guidance, or Argon2id in WebAssembly) is recorded with the result and used.
- The session is held in a cookie that scripts cannot read, marked Secure and SameSite=Lax. The server stores only a hash of the session token.
- A request that changes anything is refused unless it comes from the app's own origin and carries the header the app adds.
- Sign out, in an account menu in the existing header that shows the user's name, ends the session, and a later request with its cookie is refused.
- The sign-in fields are labelled, use 16 px text and can be filled by a password manager.

Notes: The administrator can change how long an invitation lasts from story 1.10. Pending invitations are listed and can be cancelled from story 1.8. The second sign-in step is story 1.4, and "Forgot password" is story 1.10.

### Story 1.4: Two-step verification

As a designer, I want to protect my account with an authenticator app, so that a stolen password is not enough.

Covers: FR-67 (two-step verification), UX decision D14. Screens: S-26, S-27, S-29.

- A user turns it on by scanning a code and confirming with one generated code, and is then shown 10 recovery codes once, with Copy and Download. The codes cannot be displayed again.
- Codes are 6 digits and change every 30 seconds. A code from the step just before or just after the current one is accepted, and a code that has been accepted is refused if used again.
- With it on, a correct password alone does not sign in; a current code does. "Use a recovery code" accepts a recovery code once, and the same recovery code is refused afterwards.
- Wrong codes and wrong recovery codes count toward the same limit and wait as wrong passwords in story 1.3.
- My account shows how many recovery codes remain. A user makes a fresh set by giving their password and a current code, and the old set stops working.
- Turning it off asks for the password.
- A person who has just accepted an invitation is offered two-step set-up and can skip it.
- The code step works on a phone, with a numeric keypad and code autofill.
- Recovery codes are stored only as hashes. The authenticator secret is stored encrypted with a key that the deploy command generates and supplies to the installation as a secret, and neither appears in any reply after set-up.

Notes: Reset by an administrator arrives in story 1.8. Making two-step verification required, and refusing to turn it off while required, arrive in story 1.10.

### Story 1.5: My account and sessions

As a designer, I want to manage my password and see where I am signed in, so that I stay in control of my access.

Covers: FR-67 (password change, sessions, sign out everywhere, session end), UX section 17.3. Screens: S-29.

- My account is reached from the account menu and shows the user's name and email.
- A user changes their name.
- A user changes their password by giving the current one. The new one must meet the password rules of story 1.2, and the change signs out every other session of that account.
- A user sees each signed-in session with its device (browser and system), time of last use and network address, with a country or city where the host supplies one. The current session is marked.
- "Sign out everywhere else" ends the other sessions, and each is refused on its next request.
- A session ends after 24 hours without use. Every request that passes sign-in counts as use, so an upload in progress keeps its session in use.
- When a session ends while a page is open, the page asks the user to sign in again in place. After the same account signs in, input pending on that page is still there and can be saved.
- If a different account signs in on that page, the earlier pending input is shown but is not sent.

Notes: The administrator can change the 24-hour period from story 1.10. Deactivation, which also ends sessions, is story 1.8. Pending project edits are kept the same way from story 2.2.

### Story 1.6: Projects list and creating a project

As a designer, I want to land on my projects after signing in, so that I can open the property I work on.

Covers: FR-68 (project creation), UX decision D11. Screens: S-28.

- After signing in, an administrator sees every project by name, and a Create project action.
- An administrator creates a project by giving its name, 1 to 120 characters. It appears in the list at once, and its creator is recorded.
- Each project has its own address. Opening a project from the list goes to that address.
- A user whose list holds exactly one project goes straight to it after signing in.
- The projects list is reachable from the account menu and by its own address, including for a user who was sent straight to a project.
- A user with no project sees "You have not been added to a project yet. Ask an administrator." A standard user sees no Create project action.

Notes: Until story 2.1 a project's address loads the existing app, whose data is still held only in the browser. Membership arrives in story 1.7, so until then every standard user sees the empty message; from 1.7 the list shows only their projects with their role. Scope state and last activity are added to the list by story 2.1 and the attention count by story 5.9. Project creation by standard users is a setting in story 1.10.

### Story 1.7: Roles, membership and the access gate

As an administrator, I want access decided by role and project membership on the server, so that people see and change only what they should.

Covers: FR-68, FR-69, NFR-5, AD-12, AD-17.

- Every request passes one access gate that identifies the caller and decides from their installation role and project membership. A test route not marked public, reviewer-link, signed-in or administrator-only is refused.
- An administrator's server functions add a user to a project as Editor or Viewer, change that role and remove the user. The same functions called by a standard user, including an Editor of that project, are refused.
- A standard user's project list shows only the projects they belong to, each with their role. An administrator's list shows every project.
- A signed-in standard user who requests the address or the record of a project they do not belong to is refused by the server.
- Server tests show the gate's decision for each case: an administrator may read and change any project; an Editor may read and change their own project; a Viewer may read their project and is refused any change; a non-member, a deactivated account and an ended session are refused.
- Removing a member, changing a role or deactivating an account takes effect on that person's next request. A test changes a role and shows that the very next request is decided by the new role, with no delay from any held lookup.
- A change refused because access changed (no longer a member, role too low, account deactivated) returns a reason distinct from "not signed in".
- The last administrator cannot be demoted or deactivated. Only active accounts that have accepted their invitation count as administrators for this rule.
- Two requests sent at the same moment that would together remove the last two administrators leave one administrator; the second request is refused.
- The actor recorded on every action is the signed-in account and its name at the time, supplied by the gate. A request that names a different actor in its body is recorded under the signed-in account.
- After a user is renamed, records made earlier, such as a project's creator and an invitation's sender, still show the earlier name.

Notes: The screens for members and roles are story 1.8. Story 2.1 shows a Viewer reading an open project and being refused a save; file downloads, package downloads, schedule and estimate exports and portable backups are shown under the gate by the stories that add them (rule 2). Pending edits refused because access changed are shown as "not saved: access changed" by story 1.8 for administration and story 2.2 for project edits. The Viewer who is an approval assignee is story 4.6.

### Story 1.8: Administration: users and project members

As an administrator, I want one place to manage people and who belongs to each project, so that I can give and withdraw access without help.

Covers: FR-70 (Users, Projects), FR-67 (deactivation, administrator reset link), FR-68, UX decision D10. Screens: S-30, S-31.

- Administration is a separate area reached from the account menu, with Users and Projects in a left-hand list. A standard user does not see it, cannot open its pages by address and is refused by each of its server functions.
- The Users table shows name, email, role, state (Invited with the invitation's expiry, Active, Deactivated), two-step verification (On or Off), projects and last sign-in.
- From Users an administrator invites a person, optionally choosing projects and a role in each, which apply when the invitation is accepted.
- A user's detail lets an administrator change the name and installation role, issue a password reset link, reset two-step verification, sign the user out everywhere, deactivate and reactivate.
- A password reset link is copied by the administrator, works once and expires after 24 hours. Using it sets a new password, ends all of that account's sessions and leaves two-step verification on.
- After two-step verification is reset, the user signs in with the password alone, their old recovery codes no longer work, and they are offered set-up again.
- Deactivating an account ends its sessions on their next request, prevents sign-in and cancels its unused invitation and reset links. A reactivated user can sign in again with the same password.
- Deactivating or removing someone explains that their records keep their name, and records they made earlier, such as invitations sent and projects created, still show it.
- Users lists unused invitations and reset links with their expiry, and each can be cancelled. A cancelled link says it is no longer valid.
- An invitation or reset link opened for an account that has since been deactivated is refused.
- The last administrator's role and Deactivate controls are disabled, with the reason shown.
- The Projects table shows every project with its name, members and creation date, and has Create project.
- A project's row opens its members: add a user as Editor or Viewer, change a role, remove. Removing explains that the person's earlier entries stay.
- Only administrators change a project's members: the members controls are absent for a standard user who is the project's Editor.
- When an administrator's role is removed while they have an unsaved change open in Administration, the save is refused and shown as "not saved: access changed"; what they entered stays on the page and is not retried.
- When the only administrator cannot sign in, a documented command run by a person who controls the Cloudflare account prints a one-time code. With it, a named administrator account sets a new password and has its two-step verification reset. The code works once and expires after 1 hour.

Notes: "Required but not set up" is added to the two-step column by story 1.10. The Projects table gains scope state and last activity with story 2.1, Archive and Un-archive with story 6.11, latest backup with story 8.1 and stored size with story 8.5. The self-hosted form of the recovery command arrives with story 2.13. The recovery command is a new safeguard proposed by the review, for Kevin to confirm. Reviewer links, Settings, Backups, Software and Activity join the left-hand list in stories 4.7, 1.10, 8.1, 9.4 and 1.9.

### Story 1.9: Activity log

As an administrator, I want a log of sign-ins and administrative changes, so that I can see what happened and when.

Covers: FR-71. Screens: S-36.

- Each of these adds an entry with time, actor and what changed: set-up completed; sign-in; failed sign-in, including a failed second step; sign-out and sign out everywhere; password change and reset; two-step verification turned on, turned off, reset and recovery codes renewed; invitation issued, accepted and cancelled; reset link issued and cancelled; role and membership changes; deactivation and reactivation; project creation; and use of the administrator recovery command.
- A failed sign-in entry records the email entered and the network address, whether or not the email has an account.
- No entry contains a password, token, code or link. A test signs in, invites, resets and fails a sign-in, then searches the stored log for each secret used and finds none.
- Activity shows time, who, what and detail, newest first. Failed sign-ins and administrative changes are each marked by an icon and a label.
- An administrator filters by person, kind of event and date, and exports the filtered log as a CSV file.
- A standard user cannot open Activity or call its functions.
- No page or server function edits or removes an entry.
- Entries are never removed by age: an entry given a date several years in the past in a test is still listed and exported.

Notes: Later stories add their own events: settings changes (1.10), reviewer links and link decisions (4.7), archiving (6.11), backups and restores (Epic 8) and updates (Epic 9). The log is included in the installation's backups by Epic 8.

### Story 1.10: Settings and optional email

As an administrator, I want to set how the installation behaves, so that it fits my organisation.

Covers: FR-70 (Settings), FR-67 (session period, invitation life, required two-step verification, reset by email), FR-68 (project creation by standard users), FR-71 (settings changes), AD-17, AD-18, experiment R13. Screens: S-33.

- Settings are grouped as Installation (name), Sign-in (the period without use after which a session ends, how long an invitation lasts, whether two-step verification is required, whether standard users may create projects), Email and Maps (optional provider keys). Each group saves on its own and says what changed.
- Each change is recorded in the activity log with the earlier and new value, except that a secret is recorded only as changed.
- A changed installation name shows on the sign-in page.
- The session period accepts 15 minutes to 30 days, and a changed period applies to existing sessions on their next request. The invitation life accepts 1 to 30 days and applies to invitations issued afterwards. A value outside these bounds is refused with the bounds shown.
- A saved secret, such as an email service key or a map key, is stored encrypted with the deployment key of story 1.4, and is shown in Settings only as its last 4 characters, never again in full.
- The Maps group states beside the Google mapping key that this key is visible in the browsers of signed-in users.
- With an HTTP email service configured, "Send a test message" reports success or the service's error.
- With email working, the invite panel offers "Email it" beside the link to copy, and a failed send is reported with the link still offered.
- With email working, "Forgot password" on the sign-in page sends a reset link that works once and expires after 1 hour. Using it ends all of that account's sessions and leaves two-step verification on.
- "Forgot password" gives the same reply for every email. No message is sent for an unknown or deactivated account, and at most 3 messages are sent to one account in an hour.
- Without email, "Forgot password" says "Ask an administrator for a reset link", every invitation and reset is a link the administrator copies, and nothing else stops working.
- Experiment R13 has a recorded result: a message sent by SMTP through the runtime's outbound sockets to a test server, on a deployed Cloudflare test installation and under the self-hosted configuration of story 1.1. SMTP settings are offered only if it passed on both; otherwise only the HTTP email service is offered.
- When two-step verification is made required, a user without it must set it up at their next sign-in before doing anything else, and a session already signed in without it can do nothing but set it up from its next request.
- While it is required, turning it off is refused with the reason, a person accepting an invitation must set it up, and the Users table shows "Required but not set up" for accounts without it.
- When standard users are allowed to create projects, a standard user sees Create project, creates one, becomes its Editor and cannot add members.
- When that setting is turned off again, projects already created keep their members.

Notes: The Limits group (storage limits and current usage, read-only) arrives with story 8.5. A stored Google mapping key is delivered to members' browsers by story 2.6, which also removes the prototype's per-session key dialog. The GitHub token used for Cloudflare updates is stored the same way by story 9.7.

## Epic 2: One shared project online

**Outcome.** The existing design tool runs as one shared project, on Cloudflare and on your own server. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work.

**Depends on.** Epic 1 complete. Nothing later.

**Why here.** Issued designs, field evidence, conflict checks and fixed packages all assume a shared server-saved record, and the prototype saves only in the browser. The self-hosted image is built at the end of this epic (stories 2.13 to 2.15), at Kevin's decision, so that both hosts are exercised from early on.

### Story 2.1: Open a project as a member and work in it together

As a designer (an Editor), I want to open a project I belong to and have its records held on the server, so that my colleagues and I work on one copy.

Covers: FR-2, FR-45 (first work scope), FR-68 (project list), FR-69, AD-2, AD-5. Screens: S-28, S-31.

- A member who opens a project sees it loaded from that project's own store. A signed-in standard user who is not a member cannot open the project or any of its files, including by typing its address.
- Two projects share no records: a change saved in one never appears in the other.
- Creating a project asks for the name of its first work scope, with "Initial design" filled in as the default. The project is created with that scope, in the state In progress, as its active scope.
- The first scope records the account that created it and the time.
- A scope name that is empty or longer than 80 characters is refused with the reason, and no project is created.
- The project list shows, for each project, its active scope's name and state and the time of its last activity. For a project with no saved change yet, the last activity is its creation.
- The Projects table in Administration (story 1.8) shows the same scope name, scope state and last activity for every project.
- A Viewer opens and reads the project with editing controls removed and a "View only" mark in the header. A change request sent to the project as a Viewer is refused by the server.
- An administrator opens a project they were never added to and can edit it.

Notes: Every later record that belongs to a work cycle (survey entries in 2.10, revisions in 4.1, the estimate in 4.4, field evidence in Epic 5) carries the active scope; each of those stories states it. Scope categories and later scopes arrive in story 6.7 and reopening in 6.10. The attention count on the project list arrives in story 5.9. Story 3.1 moves the "View only" mark into the project frame.

### Story 2.2: Save edits to the shared project and show the save state

As a designer, I want my edits saved to the shared project automatically with a truthful status, so that I know my work is safe.

Covers: FR-21, FR-68 (access changes), NFR-2, AD-5. Screens: S-01.

- An edit to anything the prototype can edit (a building, floor, plan placement, device, route, obstruction, zone, note or analysis setting) is saved to the server when it is committed, with no Save button. Opened in a second browser, the project shows the saved value.
- A committed edit shows Saving on its item, then Saved once the server has acknowledged it. The saved value survives closing the browser and restarting the service.
- On the locally run server, a single-item save is acknowledged within 2 seconds in at least 19 of 20 trials, and the trial results are recorded.
- With the connection lost, an edit shows Unsaved and stays on the page. The header status counts the unsaved items.
- When the connection returns, unsaved edits are sent again without the user doing anything and become Saved.
- A save whose reply was lost is retried with the same operation identifier, and the change is applied once only.
- While an item is dragged, intermediate positions are not saved; the completed move is saved as one change.
- The save status is a small element in the existing prototype header showing Saving, Saved or Unsaved with a count. Choosing it opens a list of the items not yet saved.
- Closing or reloading the page with unsaved items first shows the browser's leave-page warning.
- If the user's role is changed to Viewer, their membership is removed or their account is deactivated while they hold unsaved edits, the next save is refused. Those edits stay on the page marked "not saved: access changed", their values can be copied, and they are not sent again.
- Each refused item in the save-status list shows its own reason, and items refused for different reasons are listed together.
- When the session ends while project edits are unsaved, they stay on the page and are saved after the same account signs in again. If a different account signs in on that page, they are shown and not sent.
- A saved edit updates the project's last activity in the project list.

Notes: Plan images stay in the browser's own storage until story 2.6 stores them on the server. The Conflict state joins the status in story 2.4. Later stories add their own refusal reasons to the list, such as "not saved: project archived" (6.11) and "not saved: project was restored" (8.2). Story 3.1 moves the status into the project frame. The 2-second target is measured again against the large fixture in story 2.7 and at acceptance in story 10.2.

### Story 2.3: See other people's changes within seconds

As a designer, I want changes saved by someone else to appear without reloading, so that we work from the same picture.

Covers: FR-2, FR-69, AD-6, AD-7.

- With two browsers on one project, a change saved in one is shown in the other within 5 seconds, without a reload.
- While a form is being filled in or an item is being dragged, an incoming change to that item does not replace the local input. The user is told that the item was updated and by whom.
- A tab that regains focus checks for changes at once. A hidden tab does not check.
- Each accepted operation adds one change-log entry with the actor's account and name at that time, the session, the time, and the values before and after.
- A change-log entry cannot be edited or removed through any route.
- A member who opens the project after being away sees the current saved state, however many changes were made meanwhile.

### Story 2.4: Resolve a conflict without losing either edit

As a designer, I want a clash on the same item shown side by side, so that I can choose what to keep.

Covers: FR-42, FR-21 (Conflict status). Screens: S-F7 pattern on desktop.

- When two browsers edit the same camera and both save, the first save is accepted. The second becomes a conflict that is shown on the item and keeps its pending values.
- When two browsers edit different cameras and both save, both succeed.
- The header save status shows Conflict with a count, and its list includes the conflicting items.
- Opening a conflict shows, for each field that differs, the saved value, who saved it and when, beside the pending value. For each field the user keeps the saved value or reapplies their own.
- Saving the reapplied choices checks the item's version again. If the item has changed once more, a new conflict is shown and nothing is overwritten.
- Choosing the saved value for every field clears the conflict and saves nothing.
- An edit left Unsaved during a lost connection, whose item someone else changed meanwhile, becomes a conflict on reconnection; it does not overwrite the other person's change.
- A conflict stays on the page until the user resolves it. It is never merged or dropped without the user's choice.
- An operation that changes several items is applied completely or not at all: if one of its items conflicts, none of its changes is saved.

### Story 2.5: Buildings and floors on the server, with guarded deletion

As a designer, I want buildings and floors kept as separate records, so that each floor's content stays independent and nothing referenced can be deleted by accident.

Covers: FR-1, FR-60. Screens: S-03 left panel.

- With several floors, switching between them shows each floor's own drawing placement, equipment, routes, obstructions, zones, notes and analysis settings. Content and results from one floor never appear on another.
- A renamed floor or building keeps its identity. A new floor that reuses an earlier name has a new identity.
- Opening a project loads its list of buildings and floors and the content of the selected floor only. Another floor's content is requested when that floor is first opened.
- A floor that holds no device, route, obstruction, zone or note can be deleted. A building with no floors can be deleted.
- Deleting a floor that holds any device, route, obstruction, zone or note is refused, the blocking records are listed, and the floor and its content are unchanged. Hiding layers or clearing the visible plan does not make a floor eligible.
- Deleting a building that still has a floor is refused, with its floors listed.
- The last remaining floor of a project, and the last remaining building, cannot be deleted; the reason is shown.
- A deletion requested from a stale view, after content was added to the floor in another browser, is refused with the new content listed.
- A refused deletion never deletes or moves any other record.

Notes: Later stories add their own blocking records to this rule: a stored plan (2.6), survey entries (2.10), a reference from a named revision (4.1), a removed device (6.8) and a riser reference (7.6). Undoing a floor or building deletion arrives with undo in story 2.11. The 5-second plan-switch target is measured against the large fixture in story 2.7.

### Story 2.6: Property lookup and plans stored with their originals

As a designer, I want to find the property and import, align and lock a plan whose original file is kept, so that the drawing can be traced and reused.

Covers: FR-3, FR-4, FR-5, FR-6, FR-70 (saved map key in use), AD-3, AD-4, AD-10. Screens: S-03.

- Searching by address or by coordinates moves the map view to the result and changes nothing else. A lookup that fails or a provider that is unavailable shows a plain message.
- Street mapping from OpenStreetMap works with no key. Switching between street and aerial views leaves the aligned plan and every device at the same geographic position.
- With a Google mapping key saved in Settings (story 1.10), Google mapping is offered to every member of every project without anyone entering a key. Without a saved key it is not offered. The prototype's per-session key dialog is removed.
- The Google mapping key is sent only to signed-in users' browsers, and Settings states that this key is visible to them.
- An imported plan image, or one chosen page of a PDF, is placed on the selected floor. Its position, rotation, uniform scale, opacity and lock state can be changed, and they are the same after a floor change and after a reload.
- Moving, aligning or replacing a plan leaves equipment and obstructions at their geographic positions.
- Two-point alignment shows a preview of the move, rotation and scale before it is applied. Cancel leaves the earlier alignment unchanged. Choosing the same point twice is refused, and the earlier alignment is unchanged.
- On import, the original file and a preview are uploaded in 8 MiB parts with visible progress. The plan shows Saved only when both files are stored, checked and referenced by the floor.
- The server checks the hash and size of each completed upload against the values the browser declared. A mismatch shows Failed with Retry, and the file is not referenced.
- An upload interrupted by a lost connection or a closed tab resumes from the last accepted part when the same file is chosen again.
- An unfinished upload is discarded after 7 days. A completed file that no record references is removed by a daily clean-up once it is 24 hours old.
- If the user's role is changed to Viewer, their membership is removed or their session ends between parts, the next part is refused, the parts already stored are discarded, and the plan shows "not saved: access changed" or the sign-in prompt.
- A PDF's password is used in the browser only. It is absent from every request, record and backup. A wrong password asks again, and cancelling leaves the floor unchanged.
- A plan placed from a PDF keeps the source file name and the page number, and both are shown with the plan.
- One PDF used for two floors is stored once.
- A PDF over 100 MiB, an image over 25 MiB, a file that is not PDF, PNG, JPEG or WebP, and a file that is empty, truncated or unreadable are each refused with a plain reason. Nothing is stored or referenced, and the floor's earlier plan is unchanged.
- A floor that holds a stored plan cannot be deleted (story 2.5's rule).

Notes: Undoing an applied alignment arrives with undo in story 2.11. Self-hosted file storage arrives in story 2.14; until then these criteria are tested on Cloudflare's runtime. Under story 1.5 every request counts as use of the session, so an upload in progress keeps its session in use. Project storage usage and the enforcement of the project budget arrive in story 8.5.

### Story 2.7: Equipment as individual records, findable across the property

As a designer, I want every device kept as its own record with a stable identity, so that it can be found, located and followed through its life.

Covers: FR-7 (base), FR-8 (base), FR-41 (Current and Proposed, base), NFR-4 and SM-5 (large fixture and timings). Screens: S-03, S-08.

- Two similar devices each have their own unchanging identifier and their own label, shown in the plan and in the equipment list.
- Each device is saved as its own versioned item: two people editing two different devices both succeed.
- Every device has a lifecycle value of Proposed, Existing or Removed. A newly placed device is Proposed.
- An Editor can set a device to Proposed or Existing, as the prototype's status field allows. Removed cannot be chosen.
- A device once saved as Existing is marked as having been recorded as existing, and that mark stays if it is set back to Proposed.
- The plan and the equipment list have a basis control with Current installation and Proposed design, and the basis in use is always labelled. Current installation shows Existing devices only; Proposed design shows Existing and Proposed devices.
- Choosing a placed device in the equipment list opens its floor with the device selected.
- Search by identifier, label, name and model returns correct results.
- A script generates the acceptance-size test project through the server's own operations: 10 buildings, 25 plans, 600 devices of which 150 are cameras with 60 on the busiest plan, and obstructions, 20 targeted zones and routes on the busiest plan. A declared share of its devices is Existing. The same seed produces the same project.
- The same script also generates the small functional project, with several floors, cameras and other equipment, an obstruction, a targeted zone and routes.
- The script takes an option to add plan files up to a stated total size, and a run up to 8 GiB is shown to complete.
- Against that fixture on the locally run server, each of these meets its target in at least 19 of 20 trials, with all results recorded: search and filter within 1 second; selection and direct-edit feedback within 250 ms; a single-item save acknowledged within 2 seconds; a change seen in a second browser within 5 seconds; the project open and usable within 10 seconds; a switch to another saved plan within 5 seconds.

Notes: Story 5.3 adds that recording Installed makes an add-new device Existing and that a relocation takes its recorded location. Story 6.1 adds existing-site inventory, condition and provenance; removal and the Removed value are handled in story 6.8; the Changes basis arrives in story 6.6. More equipment types arrive in story 4.2. Later stories extend the fixture script for their own record types (2.10 does so for survey entries). Story 10.1 keeps the fixture manifest, Kevin's confirmation of it and the independent reference calculations.

### Story 2.8: Coverage, DORI and zones computed off the main thread, with an honest status

As a designer, I want coverage analysis to keep the interface responsive and to say when a result is current, so that I never read a stale or uncertain number as final.

Covers: FR-10–16, NFR-4, AD-9, experiment R2. Screens: S-05.

- Changing a camera's bearing, lens or field of view, mounting height, tilt or range changes its footprint and the results that depend on it. Changing resolution changes image-detail results without changing the footprint. Linked optical values stay consistent with each other.
- An enabled wall or obstruction with a height shadows the camera views it blocks. A disabled one does not.
- Combined coverage is calculated for the basis selected in story 2.7, and the result names that basis. Overlap is counted once in covered area and shown separately as overlap.
- Hiding a camera or a layer does not change any total.
- Editing the analysis boundary changes the analysed area. The result names the boundary and the denominator in use. Without a custom boundary the fallback area is stated.
- The floor's common target height is saved separately from each camera's own target height, and combined and zone results use it.
- Cameras left out of the calculation are listed under the result, each with the reason.
- If every camera on the floor is left out, the result is shown as Not assessed, not as 100% unseen.
- A single camera's percentage and the combined percentage are labelled differently and never shown in the same position.
- Turning the DORI overlay on or off changes no saved value and no result. At each point, combined DORI is the best single unobstructed view; two overlapping views below a level do not add up to that level. An area seen below Detect is shown differently from an unseen area.
- A zone with a target shows its achieved percentage, its deficient area, and one of four results: Target met, Shortfall, Not demonstrated or Uncertain near target. A zone without a target shows no result.
- A zone's result uses its full polygon; any part of the zone that was not assessed stays in the denominator.
- Target met is shown only when the percentage calculated with every sampling cell on a zone or threshold edge counted as not qualifying still reaches the target. Shortfall is shown only when the percentage with those cells counted as qualifying is still below the target.
- When neither holds, the calculation is repeated once at half the spacing. If the result is still undecided, it is shown as Uncertain near target with both percentages.
- When the target is not met and a camera in range of the zone was left out of the calculation, the result is Not demonstrated, not Shortfall.
- Rounding for display never changes a result: 89.96% against a 90% target is not shown as Target met.
- After an input changes, the affected results show Updating until the calculation for the current inputs completes. Controls stay usable throughout, and zone results stay visible while a camera is adjusted.
- Sampling is 1 m or finer on every plan, and the spacing used is shown with the result. A calculation that would exceed its time allowance of 10 seconds is shown as Incomplete with the reason; sampling is never coarsened to finish in time.
- The prototype's fixed work budget and cell cap are removed. On the busiest plan of the fixture from story 2.7, sampling is 1 m or finer.
- The contour mesh has its own size limit; above it the map shows the sampled overlay instead. The numbers are the same with either presentation, and the result says it is an estimate.
- The polygon clipping step uses one boundary for both its inside test and its intersection: a test case with a camera footprint crossing the boundary gives the same area by both paths.
- The last final summary for each floor is saved with a fingerprint of its inputs. On reopening, a summary whose fingerprint no longer matches is shown as Updating, not as final.
- The busiest plan of the fixture is timed in a Web Worker in a browser, with 60 cameras and all 20 zones, and the result is recorded. It completes within 10 seconds of a committed edit in at least 19 of 20 trials.

Notes: Experiment R2 found that the prototype's work budget and cell cap coarsen sampling to 6 to 12 m on the acceptance workload, and that without them 60 cameras and 20 zones finish in under half a second at 0.5 m. The contour-mesh limit and the single clipping boundary were raised in review of the R2 experiment copies and are prototype behaviour to correct. Unsupported and illustrative views (fisheye, stitched) arrive in story 7.1, which extends Not demonstrated and Not assessed to them. Accuracy against independent reference calculations is checked in stories 10.1 and 10.2.

### Story 2.9: Cable routes on one floor

As a designer, I want to draw and edit routes between devices on a floor, so that cable can be estimated.

Covers: FR-9 (base).

- A route is drawn between two devices on one floor with waypoints and a cable type, and shows a length estimate labelled as an estimate, in the floor's own scale.
- Each route is saved as its own versioned item with a run identifier that does not change when the route is edited.
- Moving an endpoint device or a waypoint updates the estimate.
- Deleting a device that a route ends on does not delete the route. The route stays, with that end shown as unassigned and marked for review.
- A route with an unassigned end is still counted in cable totals and is listed as needing review.
- A floor's routes are requested when the floor is opened, not when the project is opened.

Notes: Story 2.11 adds the dependency preview shown before a connected draft is deleted. Removal of an installed device and its connections is handled in story 6.8; runs between floors and the length ledger in story 7.6.

### Story 2.10: Survey notes and photos as separate entries

As a designer, I want notes, measurements and photos attached to a device or a point on the floor, so that evidence is kept with its place.

Covers: FR-20 (base), FR-45 (scope on evidence), AD-3. Screens: S-04 Evidence tab.

- A note, measurement or photo is added to a device or to a point on a floor as a separate entry showing its author's name and the time. It records the active scope.
- Two people adding entries to the same device at the same time both succeed, and both entries are shown.
- A photo's original and a preview are stored. The entry shows Saved only after the upload and the entry have both succeeded; until then it shows Uploading or Failed with Retry.
- A photo over 25 MiB, or one that is not JPEG, PNG or WebP, or is empty or unreadable, is refused with a plain reason and no entry is added.
- A photo upload interrupted by a lost connection resumes from the last accepted part. A retried addition does not create a duplicate entry.
- The note form offers optional prompts for lighting, shadows, uneven terrain and mount rigidity. Leaving them empty is allowed. Their answers are shown with the entry and change no coverage result.
- Evidence is reached from the plan, by its pin, and from the device.
- Moving a device keeps its entries with it. An entry attached to a point on the floor keeps its position.
- Adding an entry never changes or removes an earlier entry.
- A floor that holds a survey entry cannot be deleted (story 2.5's rule).
- The fixture script from story 2.7 also generates survey notes and photos, in numbers it declares.

Notes: Photo capture on phones over poor connections is tested in story 5.5 (experiment R4).

### Story 2.11: Undo my own recent edits, and delete an accidental draft

As a designer, I want to undo and redo my own recent edits and remove a device I placed by mistake, so that slips are cheap to fix.

Covers: FR-21 (undo and redo), FR-5 (undo of an alignment), FR-55 (Delete draft), AD-7.

- Undoing my own recent edit records a new reversal in the change log, and the item returns to its earlier value.
- Redoing an undone edit records a new operation, and the item returns to the value I had set. Making a new edit after an undo clears the redo list.
- Undo and redo cover my last 40 edits made in the open page. Reloading the page or signing out empties both lists.
- If someone else has since changed the item, or something that depends on it, my undo or redo is refused with an explanation that names the later change. Nothing of theirs is changed.
- Undo never removes or alters a survey entry or a photo.
- Undoing an applied plan alignment restores the earlier alignment.
- Deleting an unused floor or building can be undone, and it returns with the same identity.
- An accidental proposed device that has no survey entry, no route and was never recorded as Existing can be removed with Delete draft. It disappears at once with an Undo notice and no confirmation dialog, and leaves the equipment list, coverage results and cable totals.
- Undoing a draft deletion returns the device with the same identifier. Its change history is kept in both cases.
- Delete draft on a proposed device that has routes first shows a preview listing each route affected. On confirmation the device is deleted and each route is kept with that end shown as unassigned and marked for review.
- In that preview a route is deleted with the device only if the user selects it, and only if the route has no survey entry and its other end is also unassigned or on the same device.
- Delete draft is not offered for a device that has a survey entry or photo, or that is or has been Existing. A "Why can't I delete this?" link lists the reasons.
- A Delete draft sent from a stale view, after someone else added a survey entry or a route to the device, is refused with the reason, and the device is unchanged.
- Undoing a draft deletion is refused, with the reason, if the device's floor has since been deleted. A floor whose only devices are deleted drafts counts as unused under story 2.5.
- A retried Delete draft or undo is applied once only.

Notes: Cancelling a proposal that cannot be deleted, and correcting a record, arrive in story 4.9. Later stories add their own conditions that make a device ineligible for Delete draft: inclusion in an issued design (4.8), an Installed or Configured mark (5.3), a test attempt (5.5), an issue (5.9) and a Current installation port assignment (7.5, which also covers "undo cannot reclaim a port reassigned by someone else"). Full revision restore is a separate guarded action in story 4.1.

### Story 2.12: Bring in a project saved by the prototype

As an administrator, I want to import a project file exported from the prototype, so that existing work is not lost.

Covers: FR-22 (format migration), AD-14.

- Importing a version 1 or version 2 prototype project file creates a new shared project with its buildings, floors, plans, devices, routes, obstructions, zones and notes. Each device keeps the identifier and label it had in the file, and its Proposed or Existing status.
- Import is offered wherever Create project is, to the same people: administrators, and standard users when they are allowed to create projects. The importer becomes the project's Editor under the same rule.
- The import asks for the first work scope's name as story 2.1 does, with "Initial design" as the default.
- The file is checked completely before anything is created. A file that is not valid JSON, is truncated, is over 100 MiB, or is not a version 1 or version 2 prototype project file is refused with a plain reason, and no project is created.
- An import that fails part-way leaves no project in the project list and no stored files.
- Before the import is confirmed, a review list names everything in the file that will not be brought in or cannot be represented exactly. Nothing is dropped without being listed.
- Costs and named revisions in the file are named in that review list as not imported.
- Plan images held in the file are stored as previews, and each such plan shows "original not available".
- Imported notes show that they came from the prototype file and the date of the import; no author is invented for them. The import itself is recorded with the importing account as its actor.
- Importing the same file twice creates two separate projects.

Notes: Story 4.1 adds named revisions to this import and story 4.4 adds costs; each then removes its item from the "not imported" list. The portable backup of the new format is story 8.4.

### Story 2.13: Run Site Studio on your own server

As an organisation's administrator, I want to run Site Studio on a Linux server with Docker over HTTPS, so that our data stays on our own machine.

Covers: FR-66 (self-hosted), FR-70 (administrator recovery, self-hosted), NFR-7, AD-1, AD-16, AD-17.

- One Docker image holds Cloudflare's open-source runtime at a pinned version, the same Worker bundle that is deployed to Cloudflare, and its configuration. It is built for x64 and arm64 on a glibc base, and the image starts on both.
- A Compose file starts the application and a bundled web server that provides HTTPS. With only a host name set, a browser reaches the sign-in page over HTTPS.
- The bundled web server obtains and renews a certificate for the configured host name automatically, or uses certificate files the operator supplies. Both ways are shown to work.
- A plain HTTP request to the bundled web server is redirected to HTTPS.
- By default the application's own port is not published on the host; only the web server's ports are.
- An operator who uses their own HTTPS proxy turns the bundled web server off and lists the proxy's address in a trusted-proxy setting. Forwarded-protocol and forwarded-address headers are believed only from an address on that list; by default the list holds the bundled web server only.
- A request that reaches the application without HTTPS, directly or through a trusted proxy that reports plain HTTP, is refused and serves no page and no data.
- Session cookies are always marked Secure, and sign-in works both through the bundled web server and through an operator's proxy on the trusted list.
- First-run set-up (story 1.2) works with the set-up code printed in the server output.
- On first start the server generates the deployment key that stories 1.4 and 1.10 encrypt with, and writes it to a key file in a folder set in the Compose file, separate from the records and files folders. The server output says where the file is and that a copy must be kept off the server.
- After a restart, two-step verification secrets and Settings secrets saved earlier still work.
- When the only administrator cannot sign in, a documented command run on the server prints a one-time code. As in story 1.8, a named administrator account uses it to set a new password and have its two-step verification reset; the code works once and expires after 1 hour, and its use is in the activity log.
- Two installations started from the same image with separate volumes share no users or projects: an account on one cannot sign in to the other, and a project on one is not listed on the other.
- The self-hosted smoke suite from story 1.1 runs against the image and passes. It covers everything in Epic 1 and stories 2.1 to 2.12 that does not store a file.

Notes: File storage on the server's disk is story 2.14, which adds the file cases to the smoke suite. Durability on real disks is story 2.15. The updater container arrives in story 9.5 and the published installation instructions in story 9.1. The supported kinds of server are stated in the instructions (9.1) from the results of story 2.15.

### Story 2.14: Files on the server's own disk

As an organisation's administrator, I want plans and photos kept on my server's own disk and checked for damage, so that a self-hosted installation stores files as reliably as Cloudflare does.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-3, AD-4, AD-16.

- On a self-hosted installation, a plan and a photo uploaded through the interface are stored in the live files folder through the runtime's disk service, and are shown again after a restart.
- Each stored file's SHA-256 hash and size are kept in the project's records.
- Upload is in equal 8 MiB parts and resumes from the last accepted part, with the same requests and replies as on Cloudflare. An unfinished upload is discarded after 7 days.
- When an upload completes, the server computes the file's hash and size and compares them with the declared values. A mismatch shows Failed with Retry, and the file is not referenced.
- A download is streamed, and a range request returns exactly the bytes asked for.
- A stored file whose size or hash no longer matches its record is reported as damaged when it is requested; it is not served as if it were good.
- A file is stored under its content hash and is never overwritten. The same content uploaded twice is stored once.
- Every download passes the access gate: a user who is not a member is refused a file even with its exact address.
- The live files folder and the backup location are two separate settings in the Compose file, and the backup location has no default value. The server refuses to start if the backup location is left unset, naming the missing setting, and if both settings point to the same folder, with an explanation.
- Two installations with separate volumes share no files: a file address from one is refused on the other.
- One set of file-store tests passes against both the Cloudflare file store and the disk file store.
- The self-hosted smoke suite gains the file cases (upload a plan and a photo, restart, read back whole and by range) and passes against the image. It now covers everything in Epics 1 and 2.

Notes: The backup location is first written by story 8.1, which also warns when it is on the same disk as the live data. Behaviour when the disk is full is in story 2.15.

### Story 2.15: Records survive crashes and power loss

As an organisation's administrator, I want every acknowledged save to survive a crash or a power cut on my server, so that Saved means the same as it does on Cloudflare.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-2, experiment R12.

- Records are kept on a persistent volume named in the Compose file. They are still there after the containers are stopped and started, and after the containers are removed and recreated from the image.
- With saves running continuously, the application container is force-killed 50 times. After each restart every save that was acknowledged is present, and no project fails to open.
- Experiment R12 is run on a typical virtual-machine disk with the power cut during saves, at least 20 times. No acknowledged save is lost and no project fails to open, and the result is recorded.
- Experiment R12 is also run with the records volume on a network disk (NFS), and the result is recorded. Storage that loses an acknowledged save or fails to lock is listed as unsupported in the experiment record.
- If R12 fails on the typical virtual-machine disk, the story is not done and the result goes to Kevin for a decision; the fallback the architecture names is to require local disk for records.
- A second application container started on a records volume that is already in use refuses to start, with an explanation, and the first keeps working.
- When the records volume is full, a save is not acknowledged: the item shows Unsaved with the reason, and nothing already saved is damaged.
- When the files volume is full, an upload part is refused with the reason, the upload shows Failed with Retry, and no file is referenced.
- While either volume is full, administrators see a storage-full notice in Administration naming the volume.
- After space is freed, saves and uploads succeed again without a restart.

Notes: Story 9.1 states the supported kinds of server and storage in the published instructions, from this story's results. A full backup disk is handled in story 8.1.

## Epic 3: A workspace that holds the whole job

**Outcome.** The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure.

**Depends on.** Epic 1 complete and story 2.1. Story 3.1 also needs story 2.2, whose save status it moves into the frame. Story 3.2 needs story 2.7 for device lifecycle. Story 3.5 needs story 2.7. Story 3.6 needs story 2.3, and stories 2.10 and 2.11 for its Evidence tab and device menu. Nothing later.

**Why here.** Epics 4 to 7 each add full pages, and those pages need the frame and the status components to exist first.

### Story 3.1: Project frame and eight areas

As a designer, I want to see which property, scope and reference I am working in and to move between areas, so that I always know where I am.

Covers: UX 5.1, 5.2, 17.1, decisions D1 and D12, FR-2 (views), FR-21 (save status). Screens: S-01, S-02.

- Every project screen sits inside one frame showing the property name, the active work scope's name and state, the issued design, the view switch, the save status and the account menu.
- The property name opens the project list.
- The issued design shows "Not issued".
- The save status from story 2.2 is shown in the frame, not in the prototype header, with Saving, Saved, Unsaved or Conflict and a count. It opens the list of pending and conflicting items.
- The account menu of Epic 1 moves from the prototype header into the frame. It shows the user's name and role in this project, with My account and Sign out. Administrators also see Administration. A Viewer sees a "View only" chip in the frame.
- The view switch offers Design and Installation. Switching it changes no permission: a Viewer gains no editing control in either view.
- Switching the view sets the basis (story 2.7) to Proposed design for Design and Current installation for Installation, and a brief notice says so. The user can then change the basis.
- "Members and reviewer links" lists who belongs to the project and each person's role. It offers no control to change them.
- Overview, Plan, Equipment, Connections, Costs and capacity, Field work, Issues and Records are separate routes, each loaded when first opened. A direct address or a reload opens the same area.
- A direct address to an area of a project the user does not belong to is refused.
- Overview shows the active scope's name and state, each floor with its device count, and recent activity from the change log.
- The prototype's Materials and Capacity dialogs open as the Costs and capacity page, and its Revisions and Review dialogs as the Records page, with their content unchanged.
- Connections, Field work and Issues each say plainly that the area is not available yet. No placeholder figures or sample records are shown anywhere in the frame or the areas.

Notes: The issued design chip is filled by story 4.8; managing reviewer links arrives in story 4.7 and members are managed by administrators in Administration (story 1.8). The Installation view's recording tools arrive in Epic 5. The archived banner arrives in story 6.11. The Equipment dialog becomes a page in story 3.5. This story is large; the frame (first eight criteria) and the area routes (the rest) can be built as two sittings.

### Story 3.2: Status language components

As a designer, I want every status drawn the same way everywhere, so that I can read the state of things at a glance.

Covers: UX section 6, NFR-3.

- One component renders every family and value in the UX status reference, each with a text label and an icon or shape.
- A status reference page in the development build shows every family and value. Viewed in greyscale, every value in a family can still be told from the others.
- The statuses already in the app use the component: save state (story 2.2), lifecycle (story 2.7) and analysis status (story 2.8), including Updating, Not assessed and Uncertain near target.
- Device markers on the plan show lifecycle by outline: dashed for Proposed, solid for Existing.
- The marker component draws a condition glyph (none for Working, a warning triangle for Faulty, a question mark for Unknown), shown on the reference page.
- The incomplete-total component shows "Incomplete" with a count of unknown inputs and a link to them, and is never styled as a pass. It is shown on the reference page.
- Two different families are never combined into one badge.

Notes: Condition is recorded on devices from story 6.1, and totals with unknown inputs first appear in stories 4.4 and 4.5; those stories use these components.

### Story 3.3: Readable text, contrast, targets and focus

As a designer, I want text I can read and controls I can hit, so that long sessions and field use are comfortable.

Covers: NFR-3, UX section 10, audit findings A2, A3, A5, A6.

- On desktop no text is smaller than 12 px, body text is 14 px, and 12 px is used only for map labels and table metadata.
- All text meets a contrast ratio of 4.5:1 against its background. The measurements are recorded for every screen that exists at this story.
- Markers, icons and focus rings meet 3:1 against both the plan and aerial imagery, measured and recorded. Markers keep a white halo.
- Desktop buttons are at least 32 px in each dimension, and actions in dense tables at least 24 px.
- On a screen 390 px wide, form field text is at least 16 px, and focusing a field on iPhone Safari does not zoom the page.
- Every interactive element, including map markers, shows a visible 2 px focus ring and can be reached and operated by keyboard.
- Forms remain usable at 200% zoom: one column, no clipped labels and no horizontal scrolling.
- Every input has a visible label, and every error message names its field.

Notes: The 44 px touch targets of the field shell are in story 5.1. Screens added later meet these rules under standing rule 5.

### Story 3.4: Plan workspace regrouped

As a designer, I want grouped tools and a docked analysis summary, so that the map is not covered and tools are easy to find.

Covers: UX 7.1, decision D5, audit findings A7, A8, A9, A12. Screens: S-03.

- The left panel shows buildings and floors as a tree, each floor with its device count. Adding, renaming and deleting floors and buildings (story 2.5) is done there, not in a dialog.
- The tool dock has six groups: Select, Place, Draw, Annotate, Route and Note. Each opens a short menu and remembers the last tool used in it.
- Every tool the prototype offered is in one of the groups: equipment types under Place; wall, obstruction, zone and analysis boundary under Draw; Measure under Annotate; survey note and photo under Note.
- The analysis strip replaces the floating card. It shows the active analysis, its basis, target height, sampling, status chip and legend, and at 1440 × 900 and 1280 × 720 it overlaps neither the dock nor the scale bar.
- Layers are grouped as Equipment, Analysis, Site and Connections, each with a visibility control, with a note beside them that hiding a layer does not change totals.
- Plan alignment handles appear only while the plan is unlocked and Alignment is open, and never in the Installation view.
- With nothing selected, the right panel shows the floor's drawing, alignment, analysis settings and combined results.

Notes: The annotation tools join the Annotate group in story 7.4, and Awaiting placement joins Place and the left panel in story 6.4. Attention marks on floors arrive with issues and checks in Epic 5.

### Story 3.5: Equipment as a full page

As a designer, I want the schedule as a full table with filters, so that a large property is workable.

Covers: FR-8, FR-68 (Viewer export), NFR-6, audit finding A1. Screens: S-08.

- The Equipment page replaces the prototype's Equipment dialog. Its table shows the 600 devices of the fixture from story 2.7 with a sticky header, and scrolling stays responsive.
- Each row shows the device's identifier, label, name, type, model, building, floor and lifecycle. A column chooser hides and shows columns.
- Search covers identifier, label, name and model. Filters cover building, floor, type and lifecycle. Results appear within 1 second on the fixture.
- The basis control from story 2.7 is at the top of the table, and the table lists the devices of the selected basis.
- Choosing a row opens that device's properties in a panel beside the table. Locate opens its floor with the device selected.
- The table has three segments: Placed, Awaiting placement and Historical. The last two are present and each says that it has no records yet.
- The filtered table exports as a CSV file holding the rows and columns shown. The file names the project, the basis and the time of export.
- A Viewer can search, filter and export the table and has no control that changes a device.
- A search or filter with no matches says so; it does not show an empty table without explanation.

Notes: Awaiting placement is filled by story 6.4, and Historical by stories 4.9 and 6.8. Multi-select for bulk cleanup arrives in story 6.5. The side panel takes its tabbed layout in story 3.6.

### Story 3.6: Device inspector with tabs

As a designer, I want one inspector layout for every device, so that I know where each kind of information is.

Covers: UX 7.2. Screens: S-04.

- The same inspector opens for a device selected on the plan and for a row chosen on the Equipment page.
- The header shows the device's identifier, label, name, type, model and its lifecycle chip.
- Tabs for Details, Optics, Work, Checks, Evidence and History are present. Optics appears for cameras only.
- Details holds the device's identity, model, mounting, location and notes. Optics holds the camera controls of story 2.8.
- Evidence lists the device's survey entries from story 2.10 with author and time, and adds new ones.
- History lists the device's changes from the change log, each with its values before and after, the actor and the time.
- Work and Checks each say plainly that the feature is not available yet.
- The device menu offers Delete draft where story 2.11 allows it, and otherwise the "Why can't I delete this?" link.
- A Viewer sees every tab and its content with no control that changes or adds anything.

Notes: Work is filled by stories 5.3, 6.6 and 7.5; Checks by stories 5.4 and 5.5. Condition and flag chips join the header in stories 6.1 and 5.6. The other device-menu actions arrive with their stories (4.9, 6.8).

## Epic 4: Design, estimate and issue

**Outcome.** A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package.

**Depends on.** Epics 1, 2 and 3 complete. Nothing later: every criterion in this epic can be tested with the stories before it.

**Why here.** Installation work in Epic 5 starts from an issued design, so revisions, review and issuing come before the field.

### Story 4.1: Named revisions as fixed snapshots, with compare and restore

As a designer, I want to save the design as a named revision and later compare or restore it, so that I can try alternatives without losing a version I may need again.

Covers: FR-1 (deletion guard for floors held in revisions), FR-22, FR-34 (snapshots), FR-60 (historical references), NFR-1, AD-8. Screens: S-20, S-21.

- An Editor saves a named revision of the active scope. The revision records its name, its scope, the account that saved it and the time, and appears in the Records timeline.
- Saving a revision first resolves the saving user's own pending edits. If any of that user's edits is still Unsaved or in Conflict, the save is refused and those items are listed; the revision can be saved once none remain.
- The snapshot is taken at one saved version of the project. Another person's edit that the server accepted after that version is not in it.
- A revision is listed only when its snapshot file is stored and its hash has been verified. A failed write shows as Failed with Retry and lists no revision.
- After later edits to the working project, the revision's stored file has the same hash as when it was saved.
- Saving a second revision with a name already used in the scope is refused with the reason.
- Two revisions can be compared side by side at one scale, with a list of the devices and settings that were added, removed or changed.
- A revision opens read-only. A Viewer can open and compare revisions and cannot save or restore one.
- Before a restore is confirmed, a dialog states what will change (design content) and what will not (everything else in the project), and lists any item that cannot be restored.
- A restore replaces the working design content with the content held in the snapshot and changes nothing else: proposed devices and their planned positions, proposed routes, zones, obstructions and analysis settings return to the revision's values.
- A restore leaves unchanged the recorded attributes of every device whose lifecycle is Existing, and every survey note and photo.
- A draft device deleted since the revision returns with its original identifier when its floor still exists.
- Restored content that refers to a floor that no longer exists is left out and listed for review.
- A restore is one versioned operation. A save that another person based on the state before the restore is returned to them as a conflict, with their value kept on their page.
- The person who restored can undo the restore in the same session. The undo is refused with an explanation if any restored item has been changed since.
- A restore deletes no revision. Revisions saved after the restored one stay in the timeline with unchanged hashes.
- Deleting a floor that any saved revision contains is refused, and the refusal lists those revisions.
- Importing a version 1 or version 2 prototype project file that holds named revisions creates each as a named revision of the project's first scope, with its name and saved date, and each can be opened and compared. The import review no longer lists named revisions as not imported.

Notes: Decision 5 applies. Restore is limited to the active scope's revisions; with only one scope before story 6.10, that story carries the test that an earlier scope's revision cannot be restored. This story states the principle; each later story that adds a record type a restore must not touch carries its own criterion (4.9, 5.3, 5.4, 5.5, 5.9, 6.8, 6.11, 7.2, 7.5). Each later story that adds design content carries the criterion that a revision holds it and a restore returns it: estimate lines in 4.4, planned actions in 6.6, scope categories in 6.7, annotations in 7.4, proposed port assignments in 7.5. The cases in the FR-22 Check of a camera moved in the field or removed after the revision are proved in 5.3 and 6.8. Revision content in portable backups is story 8.4.

### Story 4.2: More equipment types and camera fields

As a designer, I want to record doors, gates, controllers, locks, power supplies, recorders and custom equipment, so that the design covers the whole system and not only cameras and sensors.

Covers: FR-7.

- Doors, gates, access controllers, locks and strikes, request-to-exit devices, low-voltage power supplies, recorders and custom equipment can each be created, placed on a floor and edited.
- Each new record has its own unchanging identifier, a type, a model, mounting details, a location and notes, and lifecycle Proposed by default.
- Each new type appears in the plan, the equipment schedule and its export, and in search.
- Cameras record enclosure type and alarm interface. Both show in the schedule, read "Not recorded" when empty, and neither creates a connection.
- A door-contact record created before this story is still a contact afterwards and is not turned into a door.
- Creating a door, gate or custom record creates no other record: no components, no cables, no connections. Its model and specification fields are empty until someone fills them.

Notes: Doors and gates gain linked components in story 7.3.

### Story 4.3: Camera-model templates

As a designer, I want reusable camera definitions by manufacturer, model and lens, so that I enter a camera's optics once and coverage uses the real figures.

Covers: FR-47. Screens: S-08 Camera models.

- Templates can be created, edited, duplicated and searched by manufacturer, model number and lens or variant.
- A template records resolution as width by height in pixels for each capture mode, lens type (fixed or varifocal), focal length or focal-length range, horizontal and vertical field of view in degrees with the mode and focal setting they apply to, the active imaging dimensions in millimetres where known, and the source of the specification.
- When placing a camera, the designer picks a template or the generic camera. The generic camera stays available.
- A camera placed from a fixed-lens template cannot be given another focal length.
- Two cameras placed from one varifocal template can hold different focal settings within the template's range, and each gives its own coverage and DORI result. A setting outside the range is refused.
- Changing a camera's resolution or mode makes its results use that mode's pixels and framing, not the model's maximum.
- A missing optical value shows as Unknown in the template and on the camera. A result that needs it shows as not assessed with the missing input named; no generic value is substituted.
- Editing a template afterwards leaves cameras already placed, saved revisions and survey evidence unchanged. A placed camera shows that its template has changed and takes the new values only when an Editor applies them to it.
- A Viewer can search and open templates and cannot change them.

Notes: Several views and streams per camera are story 7.1; pan/tilt/zoom ranges are story 7.2. The retest that applying changed values triggers on a tested camera arrives with flags in story 5.6.

### Story 4.4: Estimate with labour, percentage lines and subsystems

As a designer, I want an estimate with equipment, cable, accessory, labour and percentage lines grouped by subsystem, so that I can give a budget figure that shows what it rests on.

Covers: FR-17, FR-18, FR-22 (estimate lines in revisions and in the prototype file). Screens: S-14.

- The estimate belongs to the active scope. Equipment and cable lines carry an editable supply quantity, unit cost and allowance, and each category shows a subtotal.
- Manual accessory lines and labour lines can be added with a quantity, a unit and a rate. Every line has an inclusion tick.
- Excluding labour lowers the included total by the labour amount and keeps the entered rates and quantities.
- A percentage line states its percentage and the categories it applies to, and shows its base and its amount. An earlier percentage line is part of the base only when it is explicitly selected.
- A 10% contingency on equipment and cable changes when that base changes, and excluding it returns the total to its earlier value.
- Each equipment, cable, accessory and labour line sits in exactly one subsystem, set from its equipment type by default and changeable. Percentage lines sit in their own section outside the subsystems.
- The subsystem subtotals plus the percentage lines add up to the same total as the ungrouped view.
- A line with no price reads Unpriced, not zero. A total or percentage amount that includes it reads Incomplete with the number of unpriced lines.
- The estimate is labelled an estimate and states its assumptions.
- The estimate exports to CSV with the same lines, inclusion states, subtotals and total.
- A named revision saved after this story holds the estimate lines, and a restore returns them.
- Importing a prototype project file brings its costs in as estimate lines. A cost the estimate cannot represent is listed for review, and the import review no longer lists costs as not imported.
- A Viewer can open and export the estimate and cannot change it.

Notes: Retained equipment is not purchased again; that rule and the "Retained, not purchased" group arrive with planned actions in story 6.6. Cable supply quantity and its basis follow the length ledger in story 7.6. Reusing rates or copying lines into a later scope belongs with later scopes in story 6.10.

### Story 4.5: Capacity estimates

As a designer, I want storage and bandwidth estimates that follow the recorded streams, so that I can size the recorder and the network.

Covers: FR-19 (base). Screens: S-14.

- Storage follows each recorded stream's bitrate, recording percentage and retention. Changing retention or bitrate changes storage.
- Bandwidth follows the streams sent. Changing the recording percentage changes storage and leaves bandwidth unchanged.
- Each figure states its units, its inputs and its overhead assumptions, and is labelled an estimate.
- A camera with no bitrate recorded is listed as unknown demand. The total then reads Incomplete with the count of such cameras, and no camera is counted as zero.
- A Viewer can read the capacity page and cannot change its inputs.

Notes: Multi-head cameras and display-only views are story 7.1. Port and power capacity, and demand with no assigned switch, are story 7.5.

### Story 4.6: Approval assignments and decisions by account

As a designer, I want to say who reviews a design and who gives final acceptance, and to record or bypass their decision, so that sign-off is on record when it is wanted and never blocks the work.

Covers: FR-23, FR-24 (decisions by account), FR-25, FR-69 (approvals and bypasses name the account). Screens: S-22, S-23.

- An Editor assigns a design reviewer and a final-acceptance reviewer for the project. An assignee is an account that is a member or an administrator, or a named person who will use a reviewer link.
- The same person can hold both assignments, and an Editor can assign themselves and approve their own revision.
- A signed-in Editor or administrator, or a Viewer who is the assignee, can pin comments on the plan of a saved revision and record a decision, Approve or Request changes, under their account. A Viewer who is not the assignee is refused by the server.
- A decision records the account with its name at the time, the time and the revision. A later decision adds a new entry and the earlier ones stay listed.
- A decision retried with the same operation identifier is recorded once.
- When an assignee's account is deactivated, removed from the project or stops qualifying, the assignment shows Unavailable with Reassign and Continue without approval. That account's earlier decisions stay listed, and its next attempt to decide is refused.
- A decision submitted by a Viewer whose assignment was reassigned while their page was open is refused with the reason, and the text they typed stays on the page.
- Any approval can be bypassed by an Editor. A bypass is recorded as Bypassed, never as Approved, with the account, the time and an optional reason.
- A decision recorded after the assignment was bypassed is kept and labelled as made after the bypass.
- An approval or a bypass changes no device record, note or photo, and gives no account or link any access it did not have.
- With no reviewer assigned, or with every approval bypassed, no control in the project is disabled for want of an approval.
- After the working layout is edited, the reviewed revision and its decisions are unchanged, and a revision saved later shows no decision.

Notes: Decisions by people without accounts are story 4.7. The decision on a closeout record by the final-acceptance assignee is story 5.12; this story delivers the assignment only. Keeping or changing assignments for a later scope is story 6.10.

### Story 4.7: Reviewer links for people without accounts

As a client reviewer, I want to open one revision from a link, comment on the plan and give my decision without an account, so that I can review a design without being given the project.

Covers: FR-24 (reviewer links), FR-69 (unverified name in the interface), FR-70 (Reviewer links), FR-71, NFR-5. Screens: S-24, S-32.

- An Editor creates a reviewer link for one saved revision and one named reviewer. Editors can copy, replace and revoke their project's links. Replacing a link makes the old one stop working at once.
- A link opens only its revision, read-only, with its floors and comment pins. The server refuses a request from the link for the working project, another revision, another project or a file that the revision does not contain.
- The reviewer enters a name before anything else. The name is required, is at most 80 characters, and the page says it is not verified.
- The reviewer can pin comments on the plan and submit a decision, Approve or Request changes. Each decision shows the entered name, the time and the revision.
- A later decision through the same link is added as a new entry; earlier entries stay listed and the latest is shown as the reviewer's current decision.
- A decision retried, or submitted from two browsers with the same operation identifier, is recorded once.
- A decision made through a link is labelled with the name marked "not verified". A decision made by an account shows the account name without that mark. Both labels show in the review list and the Records timeline.
- A decision through a link adds an activity-log entry with the entered name marked not verified.
- Link creation, replacement and revocation appear in the activity log with the acting account. No entry contains the link's token.
- Revoking a link keeps its earlier comments and decisions.
- After a link is revoked or replaced, its next request is refused with "This link is no longer valid". Text already typed stays on the page and nothing is recorded.
- A link expires 30 days after it was created. An expired link shows "This link has expired", and an Editor replaces it to give more time.
- When the assignment the link serves is reassigned or bypassed, the link still shows the revision and accepts no new comment or decision.
- A comment is at most 2,000 characters and a link accepts at most 200 comments; a submission over either limit is refused with the reason.
- After 20 requests with invalid link tokens from one network address within 15 minutes, further link requests from that address are refused for 1 minute, doubling after each further failure up to 15 minutes.
- An administrator sees every active link in the installation with its project, revision, named reviewer, creator and last use, and can revoke any. Revoked links move to a history list with their decisions.
- A standard user cannot open the installation's list of links.

Notes: This replaces the prototype's development-only review service. The unverified-name label in packages is in story 4.10. What a link does when its revision is superseded is in story 4.8; when its scope is closed, in 5.12; when its project is archived, in 6.11. A restored project or a recovered installation cancels links in stories 8.2 and 8.3. Links to a closeout record are story 5.12.

### Story 4.8: Issue a design and designate the current reference

As a designer, I want to issue a named revision and mark it as the current reference, so that installers know exactly which design they are building.

Covers: FR-25 (issuing without approval), FR-26, FR-55 (an issued device is not a deletable draft), FR-61. Screens: S-22, S-01.

- Before any design is issued in the active scope, the frame's issued-design chip reads "Not issued".
- An Editor issues a saved revision of the active scope in three steps: choose the revision; record an approval, request a review or bypass; confirm that it becomes the current reference.
- A revision can be issued with its approval bypassed, or while a requested review is still awaiting a decision.
- After issuing, the frame shows the revision's identifier, its name, the issue date and the scope, and the chip opens the issued design read-only.
- Approval state shows separately from Current, as Approved, Bypassed or Awaiting decision.
- Each designation records the account and the time, and the Records timeline lists every designation in order.
- When Revision B is made current after A, A is marked Superseded. A's snapshot, comments and decisions can still be opened and its hash is unchanged.
- B shows no approval because A was approved; B's approval state comes only from decisions and bypasses recorded on B.
- A superseded revision can be made current again. The history then shows both of its designations, and the revision that was current is marked Superseded.
- Saving a new revision, or exporting the estimate or a schedule, leaves the designation unchanged.
- When two people designate at once, one succeeds and the other sees a conflict naming the revision that is now current.
- Designating changes no working record: every device, position, note and photo is the same before and after.
- The issued design can be compared with the working project in the compare view. After the working layout is edited, the issued snapshot's hash and its approval or bypass record are unchanged.
- A proposed device contained in an issued design is not offered Delete draft, and the "Why can't I delete this?" link gives that reason. A Delete draft sent from a view loaded before the design was issued is refused with the reason, and the device is unchanged.
- A reviewer link to a superseded revision still shows that revision and accepts no new comment or decision.
- A decision recorded by an account on a superseded revision is kept and labelled as made after it was superseded.
- A Viewer can open the issued design and cannot issue or designate.

Notes: The issued-design strip where installers start work is stories 5.1 and 5.2, which also prove that field records are untouched by a change of reference. Designation is limited to the active scope's revisions; story 6.10 carries the test that an earlier scope's revision cannot be designated. A later scope starts at Not issued (story 6.10), and a service scope needs no issued design (story 6.12).

### Story 4.9: Cancel a proposal and correct a record

As a designer, I want to cancel a proposal that will not be installed, or correct a record entered in error, so that the design is right without deleting history or inventing a removal.

Covers: FR-55 (cancellation, correction), UX decision D8. Screens: S-04 device menu.

- The device menu offers the one action that applies to the device: Delete draft, Cancel proposal or Correct record. A "Why can't I delete this?" link lists what makes the device ineligible for the others.
- A proposed device in an issued design is cancelled with a short reason. The issued snapshot still shows it, and the compare view shows it as cancelled.
- A proposed device that was never issued and carries a survey note or photo is cancelled with a reason. Its identifier, history, notes and photos stay findable.
- A proposed device that is eligible for Delete draft is offered Delete draft, not Cancel proposal.
- A cancelled device leaves the proposed plan, the proposed schedule, the estimate and the capacity totals.
- An Existing device entered in error or twice is corrected with a reason and, for a duplicate, a reference to the record that is kept. The correction is recorded as a correction, not as a removal, and Delete draft is not offered for an Existing device.
- A cancellation or correction records the account, the time and the reason. The reason is required.
- Cancelled and corrected records are listed under Historical in Equipment with their reason, and are found by search.
- A cancellation or correction made by mistake is reversed with a reason. The device returns to where it was, and both entries stay in its history.
- A cancellation or correction based on a stale view of the device is returned as a conflict.
- A revision restore leaves cancellations and corrections unchanged, and lists a cancelled device that the revision still holds as proposed.

Notes: Reversing a mistaken Installed mark is story 5.3, and recording a removal is story 6.8; each adds its action to this menu. Cancelling a proposal that carries test attempts is proved in story 5.5, and the cancelled item's appearance in the closeout in 5.12. Reversing a cancellation or correction is a handling rule the PRD does not state; see the choices list.

### Story 4.10: Design package, generated once and kept exactly

As a designer, I want to generate a Design package from a saved revision and have the exact files kept, so that what I hand over can always be downloaded again unchanged.

Covers: FR-33 (Design preset), FR-34 (fixed packages), FR-61 (packages of a superseded issue; export does not designate), FR-69 (unverified name in packages), NFR-6, AD-11, experiments R1, R6 and R15. Screens: S-37.

- A package is generated from a saved revision, never from the working project. All volumes of an edition come from that one revision.
- The cover and the manifest identify the property, the scope, the revision, the edition, the issue and export dates, the units, the floors included, the decision cutoff and Draft or Issued status. A package of a revision that is not issued reads Draft.
- The Design package contains: proposed floor plans with labelled devices and routes, Existing equipment shown as context, and a legend; equipment and cable schedules; quantities and the capacity summary; survey notes, measurements and photos; and the review decisions recorded up to the cutoff.
- Every device identifier on a plan sheet matches its row in the equipment schedule.
- Coverage and DORI sheets are separate from the plan sheets and optional. Each shows zone targets, results and shortfalls with the basis, assumptions and limits of the analysis.
- Pages are Letter or A4 landscape. A table or note that runs over a page continues with its heading repeated, and no row is cut off.
- Photos are two to a page, each captioned with its device or note identifier, floor and date.
- Prices and labour costs are off by default. Turning them on changes no saved record and no one's access.
- Optional photos can be left out. A package that leaves out a required photo is labelled "Evidence-limited summary" and names what was omitted.
- A selection of some floors is labelled Partial before generation and on every page, and the manifest lists the floors included.
- Generate is disabled, with the reason, when the selection produces no pages.
- A plan background that is not included, such as a live map, is named as omitted. A required file that cannot be read fails the generation with the file named; no blank page takes its place.
- A decision made through a reviewer link is printed with its name marked not verified. A decision made by an account is printed with the account name, without that mark.
- Schedule and table pages are written as real text that can be selected and searched. Plan and photo pages are images at the JPEG quality chosen in experiment R15.
- Experiment R15 is run and recorded: plan and photo pages printed at JPEG quality 0.94, 0.85 and 0.75 and compared by a person, with the chosen quality and the reason written down.
- A volume is split at 250 pages or 100 MiB, whichever comes first, and volumes are numbered. The manifest lists every volume and its hash.
- An edition that would exceed 1 GiB fails with the reason before anything is stored, and offers a smaller floor selection or fewer optional contents. Nothing is left out silently to fit.
- Each volume uploads in equal parts with progress and time remaining, resumes from the last accepted part after a dropped connection, and is released from memory before the next is generated. The screen says the tab must stay open.
- An upload in progress counts as use of the session, so an edition that takes longer than the 24-hour idle period is not cut off by it.
- The server checks each completed file's size and hash against the declared values. A mismatch shows Failed with Retry.
- The edition is listed only when every volume and the manifest are stored and verified. A failed edition shows as Failed and can be retried.
- If the tab is closed or the person's access ends during generation or upload, no edition is listed, the parts already stored are discarded and do not count toward usage, and generation can be started again.
- Edition numbers are given by the server. Two people generating for one revision at once get two editions with different numbers.
- Downloading an edition again returns the same bytes. Regenerating, or generating after a later decision, creates a new dated edition with its own cutoff and leaves the earlier one unchanged.
- Generating a package of a revision that is not the current reference leaves the designation unchanged.
- After a revision is superseded, its editions are still listed and download with the same bytes as before.
- Generation time and upload time are reported separately. On the acceptance-size project from story 2.7, generating a complete edition takes no more than 5 minutes, not counting upload.
- A Viewer can download an existing package and cannot create one.

Notes: Experiment R1 found the prototype's pages at 570 to 710 KiB each, which reaches 100 MiB at about 150 pages; R1 and R6 were run early and their results are in the architecture. Later stories add to the Design package: scoped checklist expectations linked by device identifier (5.4), open issues (5.9), planned actions and retained context by action (6.6), and the extended-model sheets (7.7). The Closeout preset is story 5.12, and appending an edition to an archived project is story 6.11. This story is large; if it does not fit one sitting, the natural cut is contents and layout first, then splitting, upload and retention.

## Epic 5: Install, test and close out in the field

**Outcome.** A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package.

**Depends on.** Epic 4 complete (named revisions 4.1, approval assignments 4.6, reviewer links 4.7, the issued design 4.8, cancellation and correction 4.9, packages 4.10); from earlier epics, saving and conflicts (2.2 to 2.4), device records with lifecycle and the acceptance-size fixture (2.7), notes and photos (2.10), the project frame (3.1) and the first work scope (2.1). Nothing later: no criterion in this epic needs a story from Epics 6 to 10.

**Why here.** Field recording needs an issued design to compare against, and Epic 6 (existing sites, removal, reopening) builds on the installed marks, checks and issues defined here.

### Story 5.1: Field shell on phones and tablets

As a technician, I want the app on my phone to open in a layout made for finding one device and recording work, so that I can use it with one hand on site.

Covers: NFR-3, FR-61 (shown where installers start work), UX 8.1, 8.2, decisions D3 and D4. Screens: S-F1, S-F2.

- On a real iPhone in Safari and a real Android phone in Chrome, a project opens in the field shell: one top row with the floor switcher, save status and account menu, and bottom navigation with Plan and Equipment.
- Directly under the top row a chip is always visible showing the current issued design's identifier and name, its issue date and the active work scope. It is not inside the account menu. Tapping it opens the issued design read-only.
- When nothing is issued for the active scope the chip reads "Not issued" with the work scope, and tapping it explains that no design has been issued.
- The opened issued design shows its approval state (Approved, Bypassed or Awaiting decision) separately from the word Current, and has no editing controls.
- When a different design is designated current in another browser, the chip shows the new identifier and date within 5 seconds.
- The field shell has no tools for plan alignment, walls, zones, routes, estimate editing or checklist template editing. Coverage can be shown as a layer.
- A phone always gets the field shell. A tablet or laptop gets it by available width and can switch between the field shell and the desktop workspace; the choice is remembered in that browser.
- A device can be found by search on identifier, label, name, room or model, with recently opened devices listed first; by a list filtered to the current floor; or by tapping its marker.
- Markers are at least 44 px. A tap that lands near several devices opens a chooser listing them, and choosing one opens its device sheet.
- All three ways of finding a device open the same device sheet.
- On the acceptance-size project, search returns results within 1 second, and opening a device from a search result requests that device and its floor only, not the other floors' plans or devices.
- Every control is at least 44 px high, form text is at least 16 px, inputs have visible labels, and the shell remains usable at 200% zoom.
- A Viewer sees a "View only" chip in the field shell.

Notes: Kevin accepted that the issued reference and work scope are shown as a visible chip that opens the issued reference, not inside the account menu (FR-61, UX 8.1 as changed on 2026-11-18). The bottom navigation gains Work in story 5.7 and Issues in story 5.9; the filtered lists gain "Not installed" in 5.3, "Checks outstanding" in 5.7 and the survey filters in Epic 6. Experiment R4 has moved to story 5.5.

### Story 5.2: Installation view, current installation and the issued reference

As a technician, I want to see what is recorded on site beside what the issued design requires, so that I know what to do at each device and can see where the site differs.

Covers: FR-2 (views), FR-26, FR-41 (base), FR-61, UX 5.3, decision D2. Screens: S-F3, S-03.

- The view switch offers Design and Installation. Switching view changes the tools shown and grants nothing: a Viewer in Installation view still cannot change anything, and the server refuses the attempt.
- The basis control of story 2.7 stays a separate control from the view switch. Installation view starts on Current installation and Design view on Proposed design, and either can be changed.
- The device sheet shows identity and lifecycle, then states what to do in one sentence. For a Proposed device the sentence begins "Add new" and gives the type, mounting, height and aim from the current issued design.
- The device sheet lists the device's requirements from the current issued design, not from the working draft.
- "Compare with issued" shows issued and recorded values side by side for each field where they differ, and says "No differences" when there are none.
- In Installation view the map has an issued reference toggle. When on, each device's issued position appears as a ghost outline, with a line to the recorded position where the two differ.
- When nothing is issued for the active scope, the device sheet reads "Not issued — no requirements", shows no draft values as requirements, and "Compare with issued" and the issued reference toggle are unavailable with that reason.
- A device added after the design was issued reads "Not in the issued design" in the comparison.
- On a real iPhone and a real Android phone, the device sheet, the comparison and the issued reference toggle can be opened and read.

Notes: The basis control and its labelling are story 2.7's; the rule that hiding a layer does not change what an analysis counts is in story 6.6, with the Changes basis. Condition on the device sheet arrives with story 6.1. The wording for planned actions other than Add new (Retain, Relocate, Service, Replace, Remove) arrives in story 6.6.

### Story 5.3: Record work done and changes found on site

As a technician, I want to mark work as done and record where the site differs from the drawing, so that the project shows what is actually installed.

Covers: FR-27, FR-30 (work recorded), FR-26, FR-55 (reversing a mistaken Installed mark), the device state model. Screens: S-F4, S-F5.

- Installed and Configured are two separate marks on the device sheet. Setting either records the account's name, the time and the active scope, and neither changes any check outcome or phase count.
- Recording Installed on a Proposed (add-new) device sets its lifecycle value from story 2.7 to Existing; no second field is added. It now appears in Current installation at its recorded location.
- Configured can be set before Installed. The device then shows a neutral notice that it is marked configured but not installed, and nothing is blocked.
- When a second person sets a mark that is already set, no second entry is created; the first name and time stay and the second person sees who set it.
- The device menu of story 4.9 gains "Reverse installed mark". A mistaken Installed mark is reversed with a required reason. The device returns to Proposed and leaves Current installation; its notes, photos and other evidence stay attached, and the reversal is listed in the device's history with actor and time.
- A Configured mark can be cleared with a required reason, kept in the device's history.
- When nothing is issued for the active scope, setting the first Installed or Configured mark opens a one-step prompt to issue the current working design first, with approval bypass offered. Cancelling the prompt leaves the mark unset. Notes and photos are not affected.
- "Report a change" offers Moved, Different equipment, Route changed and Other. Each is saved at once as the recorded condition with the affected identifiers, before and after values, actor, time and a short required reason; a photo is optional.
- A moved camera appears at its new position in Current installation as soon as the change is saved, without any review step.
- After a field change, the issued design, its package and its approval or bypass record are unchanged, checked by the revision's hash.
- Placing and moving on a touch screen use a fixed crosshair with "Place here" and four nudge buttons; dragging is available and is never required (decision D6).
- Adding a note or photo, or setting a mark, asks for no change reason.
- The field shell's filtered lists include "Not installed".
- A revision restore leaves Installed and Configured marks, recorded positions and recorded field changes unchanged. Restoring a revision saved before a camera was moved in the field leaves its recorded position as it is and lists the camera for review.
- A device with an Installed or Configured mark is not offered Delete draft, and a Delete draft sent from a stale view after a mark was set is refused with the reason.
- A Viewer sees the marks and field changes and has no controls to set or report them.

Notes: Flagging the Configured mark, check results and evidence after a reversal or a field change is story 5.6. Story 6.6 introduces the Relocate planned action and must carry the state-model rule that recording installation of a relocated device makes its new recorded location the current one; planned Relocate cannot be chosen before 6.6, so that criterion cannot be tested here. Recorded removal is story 6.8.

### Story 5.4: Checklists and starters

As a designer, I want editable checklists with starters for each device type, so that technicians know what to check and what result is expected.

Covers: FR-29, FR-33 (Design preset: checklist expectations), FR-42 (checklist definitions). Screens: S-16.

- A new project has a common checklist covering identity and location, mounting, cable labels and connections, intended settings and system associations, and observed function.
- Starters exist for camera (dome or bullet), reader, door contact or motion detector, intercom, switch, and cabinet or light, plus a generic starter. A device type with no dedicated starter gets the common checklist and the generic starter.
- Every check belongs to Installation, Configuration or Testing and states its task, its method or conditions, and its expected result, with a value and tolerance where the check is measured.
- The applicable core checks are required by default for each Proposed device of the active scope.
- A project Editor can change, per check, whether it applies, whether it is required or optional, its expected result, and whether a photo or measurement is required.
- A check with no expected result shows Needs definition and offers no Pass. Needs definition is shown as a flag, not as an outcome.
- The four optional camera checks (direct sun at sunrise or sunset, bright sources at night, a person at the far end of the view, a person behind or in the shadow of a named obstruction) are listed and off by default. A far-end or obstruction check can name the zone, range or obstruction it verifies.
- No starter contains a pass threshold supplied by the application; values and tolerances are entered by the project.
- Each change to a checklist definition is saved as a new version with actor and time, and earlier wording and expected results remain readable.
- When two Editors change the same check definition, the first save is accepted and the second becomes a conflict.
- The Design package generated from a revision lists, for each planned device identifier, its scoped checks with task, expected result and required or optional status, using the same device identifiers as the equipment schedule.
- Saving a named revision records, in its snapshot, the checklist definitions in force at that moment. The Design package uses those, so generating it again after the definitions change lists the same expectations.
- A revision restore leaves the working checklist definitions unchanged; the definitions held in the snapshot are never written back.
- A Viewer can read checklists and cannot change them.

Notes: The pan/tilt/zoom starter (FR-63) belongs to story 7.2. Applicability by planned action and scope category (changed, retained or reference-only equipment) arrives in stories 6.6 and 6.7. What happens to recorded results when a definition changes is in stories 5.5 and 5.6.

### Story 5.5: Record outcomes, attempts and evidence

As a technician, I want to record each check's result with its evidence, and each retest as a new attempt, so that the history of what was tested is kept.

Covers: FR-30, FR-31, FR-20, NFR-2, NFR-3, AD-4, experiment R4. Screens: S-F4.

- On the device sheet, checks are grouped as Installation, Configuration and Testing, each showing its task and expected result. A check with no attempt reads Not tested.
- The outcome buttons are Pass, Fail and N/A. Fail requires a short explanation. N/A requires a reason and is counted separately from passes.
- A measured check asks for value, unit and conditions before Pass is offered. The value must be a number, and the unit is the one the check defines; anything else is refused with the reason.
- Where a measured check defines a tolerance and the value is outside it, Pass is not offered.
- Each attempt is a new entry with actor, time, the active scope, the wording and expected result it was recorded against, the actual result and its evidence. A passing retest leaves the earlier failure and its evidence in the list.
- After a check's definition changes, earlier attempts still show the wording and expected result they were recorded against.
- An attempt submitted against a definition that changed after the page loaded is not recorded; it is returned to the technician with the new definition beside what they entered.
- An attempt entered by mistake is corrected by a correction note with a reason; the original entry stays visible, marked corrected, and is no longer counted.
- "Take photo" opens the camera and "Choose photo" opens the library, on a real iPhone in Safari and a real Android phone in Chrome.
- A photo attached to an attempt follows story 2.10's rules: it shows Uploading, then Saved once the file and its entry are both stored, or Failed with Retry, and is never shown as Saved before that.
- The field note form offers the optional prompts of story 2.10 and they can be skipped.
- Where a check requires a photo, a Pass recorded while the photo is Uploading or Failed reads "Pass pending evidence" and is not counted as passed until the photo is Saved.
- Two people adding attempts, notes or photos to one device both succeed, and a retried addition does not create a duplicate.
- Recording an attempt on a device still Proposed is allowed.
- A revision restore leaves attempts, outcomes, notes and photos unchanged.
- A proposed device that was never issued and has a test attempt can be cancelled with a reason (story 4.9), and its attempts stay findable under Historical.
- A device with a test attempt is not offered Delete draft, and a Delete draft sent from a stale view after an attempt was recorded is refused with the reason.
- A Viewer sees outcomes, attempts and photos and has no recording controls.
- Experiment R4 is run and its result recorded in the architecture's experiment record: a 25 MiB photo uploaded from a real iPhone and a real Android phone over a connection throttled to 400 kbit/s upload with two forced drops. The record states the time taken, whether resume worked, and the decision on the fallback (smaller parts, or a warning before very large files).

Notes: The photo size limit, allowed types, resumed uploads and the prompts themselves are story 2.10's; an upload in progress counts as session use under story 1.5. The contradiction notice for an attempt on a Proposed device is story 5.7. Flags raised when a definition changes after a Pass are story 5.6.

### Story 5.6: Changes flag the checks they affect

As a technician, I want a change on site to flag the checks it puts in doubt, so that nothing stays passed for a condition that no longer exists.

Covers: FR-28, FR-44, FR-47 (applied template changes), FR-55 (follow-up after a reversed Installed mark).

- Needs review and Retest required are shown as flags beside a check, each linked to the change that caused it, the affected device and a reason. They are not outcomes, and the earlier attempt keeps its recorded outcome.
- Moving or re-aiming a tested camera, or changing its height or lens, keeps the old attempt and flags its placement, mounting and image checks Retest required.
- A check flagged Retest required is not counted as passed.
- Applying a changed camera-model template's values (story 4.3) to an installed, tested camera flags its image checks Retest required, linked to that change. Editing the template without applying it flags nothing.
- A recorded change of equipment, configuration, cable, port or power connection flags that device's settings, link and function checks.
- A recorded change to a shared switch or power supply lists the devices known to connect to it as affected, and states that other effects are uncertain and need review.
- A cost-only edit, a note or formatting edit, hiding a layer, or an edit to the proposed design that changes nothing recorded on site flags nothing.
- After an actual move, coverage and other results on the Current basis are recalculated for the new position.
- Reversing an Installed mark flags the device's Configured mark, its recorded check results and its evidence Needs review, linked to the reversal.
- Changing a check's expected result after a Pass keeps the attempt and flags the check Retest required. Removing the expected result shows Needs definition, and the check is no longer counted as passed.
- Making a failed check optional, or changing its expectation, leaves the Fail attempt visible and unchanged.
- An Editor can add further affected checks to a change, or record why a suggested check is unaffected, with actor, time and reason.
- Recording "unaffected" does not clear an unresolved Fail on that check and does not turn missing evidence into N/A.
- A new Pass recorded against the current condition clears Retest required and keeps the earlier attempts.
- A further change after that retest raises the flag again. Undoing the change, restoring a revision or bypassing an approval does not clear a flag or restore a pass.
- A revision restore leaves flags unchanged.

Notes: Flags for restored, replaced and removed devices are added by stories 6.8 and 6.9; connection flags (Needs connection review) by story 7.5.

### Story 5.7: Phase progress, remaining work and the contradiction warning

As a designer, I want progress by phase and one list of what remains, so that I can see what stands between the project and closeout.

Covers: FR-30, FR-31, decision D7. Screens: S-15, S-02.

- Field work shows, by floor and by device, counts for Installation, Configuration and Testing, for example "4 of 6 passed · 1 failed · 1 retest". No percentage bar is shown.
- A phase is shown complete only when every required applicable check has a current Pass with its required evidence, and no Retest required flag or unresolved Fail remains in that phase.
- A phase with no applicable checks reads "No checks in scope" and is never shown as complete. N/A results are counted separately.
- An optional check that was not performed does not hold a phase back; a recorded Fail on an optional check stays visible.
- Setting the Installed or Configured mark changes no phase count, and passing checks does not set a mark.
- The remaining-work list holds, across the property, devices of the active scope not marked Installed, required checks Not tested, unresolved failures and checks flagged Retest required or Needs review. Each row opens its device.
- A device not marked Installed whose required Installation checks have all passed shows a neutral notice saying so and offering the two corrections (mark it Installed, or review the checks). Nothing is blocked.
- A device still Proposed that has a recorded test attempt shows the same kind of notice.
- The Overview shows the active scope's state, the remaining-work count and phase progress by floor.
- The field shell's bottom navigation gains Work, opening the remaining-work list, and the filtered lists gain "Checks outstanding".

Notes: Site checks join progress and remaining work in story 5.8, open and deferred issues in story 5.9, and an unpassed required reliability stage in story 5.11.

### Story 5.8: Site checks

As a technician, I want checks that belong to the whole project or a floor, so that end-to-end operation and handover are tested and recorded, not assumed from device results.

Covers: FR-43. Screens: S-16.

- A project or floor checklist can be edited and covers end-to-end operation and final records: named devices and events reach the intended systems, scoped recordings can be retrieved, identity, time and location records align, and drawings and evidence reflect the recorded installation.
- Each site check records the endpoints, scope and conditions actually tested.
- Site checks use the same outcomes, attempts, evidence, flags and Needs definition rule as device checks.
- Passing a sampled site check changes no device's check, and a device with no attempt still reads Not tested.
- A required site check with no attempt stays Not tested and stays in the remaining-work list when every device check has passed.
- Optional starters cover alarm-to-camera call-up, including whether the view or recording is available quickly enough for the project's purpose, and handover of manuals, training, as-built records and the programming list. They are off until enabled.
- A handover check records that an item was delivered; it accepts no file and asks for no judgement of the item.
- Site checks appear as their own row in progress, not inside any device's counts.

Notes: The reliability period, a site check with its own page, is stories 5.10 and 5.11.

### Story 5.9: Issues

As a technician, I want to raise an issue against a device or a failed check and track what is done about it, so that a known fault is never lost or quietly closed.

Covers: FR-46 (records), FR-33 (Design preset: open issues), FR-55 (Delete draft eligibility), FR-68 (project list attention count). Screens: S-18, S-28.

- An issue can be raised from a device sheet, a check or a failed attempt, in the field shell and on desktop. It gets a stable identifier, records the active scope and links to its devices, checks and attempts.
- The issue list shows identifier, title, linked devices, state (Open, Deferred or Resolved), disposition in the active scope and age.
- Include now lets an Editor select the work and checks added to the active scope for the issue.
- Defer requires a short reason; owner and due date are optional. A deferred issue stays open.
- Resolve is available only when corrective work and a current passing attempt or other current evidence are recorded. Resolving keeps the original failure and links the new attempt.
- A resolved or deferred issue can be reopened with a reason, and its history is kept.
- When two people set a disposition on one issue at the same time, the first is accepted and the second sees a conflict.
- A mistaken or duplicate issue is corrected with a reason, actor and time, and a duplicate links to the issue kept. A corrected issue stays listed with its reason.
- Correcting an issue, making its failed check optional, or changing that check's expectation does not resolve another issue and does not change any attempt's outcome.
- Open and deferred issues appear in the remaining-work list and in the Overview's count.
- The issue page shows a timeline of the original failure, attempts, corrections and resolution.
- The project list shows, for each project, an attention count: the number of open issues plus checks flagged Needs review, Retest required or Needs definition in the active scope.
- The Design package of story 4.10 lists the open and deferred issues as they stood when its revision was saved, each with its identifier and linked devices.
- A device with a linked issue is not offered Delete draft, and a Delete draft sent from a stale view after an issue was linked is refused with the reason.
- The field shell's bottom navigation gains Issues.
- A revision restore leaves issues and their dispositions unchanged.
- A Viewer can read issues and cannot raise or change them.

Notes: Carrying unresolved issues into a later scope is story 6.10. Service visits on an issue are story 6.12. Later record types that add attention indicators (Needs connection review in 7.5) add to the count in their own stories.

### Story 5.10: Define and run a reliability period

As a designer, I want to define an optional period of observed operation and record when each run starts and ends, so that reliability is tested under terms the project chose.

Covers: FR-64 (definition, stages, runs and their timing). Screens: S-17.

- The reliability period is off by default. When enabled, the project defines what it covers (selected devices, selected floors or the whole site), its stages, what counts as downtime, and each stage's planned duration and availability target. The application supplies none of these values.
- Each stage is required or optional on its own and appears with the site checks, not in any device's progress.
- A stage with no duration or no target shows Needs definition.
- A person records the start of a run and later its end. A run in progress shows elapsed and planned time, has no outcome and is not listed as an attempt.
- Start and end times can be entered for an earlier moment and cannot be in the future; an end must be later than its start.
- A stage has at most one open run. A second start on that stage is refused, showing who started the open run and when.
- Stages can be run in any order.
- Starting a run while required checks, retests or open issues remain in the covered scope, or while an earlier stage has not passed, shows a warning listing them, and Start remains available.
- Recording an end before the planned duration has elapsed is a stop and asks why: "The system failed to perform", with a required explanation, or "Another reason", with a required reason. The run and its reason are kept.
- A run uses the definition in force when it started. Editing the definition or target during a run applies to later runs, and the open run shows a notice that the definition has changed.
- A covered device that is moved, changed or cancelled during a run appears on that run as an entry and flags the stage Needs review, linked to the run. The run is not stopped. A participant records Continue or Restart with a reason.
- Restart ends the current run as stopped for another reason and starts a new run.
- A Viewer can read the definition and runs and cannot change them.

Notes: Outcomes, the downtime log and availability are story 5.11; until then a run can be started, stopped and ended but shows no Pass or Fail. A recorded removal of a covered device during a run is story 6.8's to handle, and archiving a project with an open run is story 6.11's.

### Story 5.11: Downtime log and availability

As a technician, I want to log outages during a run and have availability and the outcome worked out from the log, so that the result is a fact of the record and not an opinion.

Covers: FR-64 (downtime log, availability, outcomes).

- During a run, an outage is logged as its own entry with what was affected, start, end, description and, where it is a fault, a linked issue. Entries added by different people all remain.
- Each entry states whether it counts toward availability; an entry that does not count requires a short reason. An uncounted entry stays visible and does not change availability.
- An entry's end must be later than its start. An entry with no end reads "continuing" and counts up to the present while the run is open and up to the run's end once it has ended.
- Counted time is limited to the run: the part of an outage before the run's start or after its end is not counted.
- Overlapping counted entries are counted once for the time they overlap.
- A counted entry counts for its whole duration whether it affected one covered device or all of them.
- Availability is the time not down divided by the run's elapsed time, as a percentage shown to two decimal places, beside the target and the totals of counted and uncounted downtime. It is marked Provisional while the run is open. There is no field in which to type it.
- When a run's end is recorded after the full planned duration, it becomes one attempt: Pass if availability, before rounding, is at or above the target, and Fail if it is below.
- A run stopped because the system failed to perform becomes an attempt with outcome Fail and its explanation.
- A run stopped for another reason is kept with its log and reason, has no outcome, is not an attempt, and leaves the stage's outcome as it was.
- A stage showing Needs definition cannot record a Pass.
- A new run after a Fail is a new attempt; the earlier attempt and its log are kept. A Fail does not close or resolve a linked issue.
- Changing the definition or target after a run has an outcome does not change that outcome.
- After a run has ended, its entries can be changed only by a correction with a reason, actor and time. The recorded outcome is not rewritten: the attempt shows the recalculated availability beside the recorded one, and the stage is flagged Needs review.
- A required stage that is not started, running or failed appears in the remaining-work list.
- Once stage 1 has passed, starting stage 2 no longer lists it in the warning.
- The PRD's worked example holds: a one-hour single stage with a 99% target and one counted three-minute outage linked to an issue shows 95% and Fail, and the issue stays open; a restarted run with no downtime passes; both attempts are kept.
- A revision restore leaves the definition, runs, downtime entries and outcomes unchanged.

### Story 5.12: Close out, with a Closeout package

As a designer, I want to close the active scope as Completed or as Closed with outstanding items and produce a Closeout package, so that the record says honestly what was installed, tested and left open.

Covers: FR-32, FR-33 (Closeout preset), FR-23 and FR-24 (final acceptance of a closeout record), FR-25, FR-42 (closeout), FR-64 (closeout), NFR-6. Screens: S-23, S-37.

- Close out starts by showing the remaining-work list for the active scope.
- Completed is available only when nothing is outstanding: no in-scope device unmarked as installed, no required check Not tested, no unresolved Fail, no required retest, no open or deferred issue. Otherwise it is disabled and lists the reasons.
- Closed with outstanding items requires a short note; a follow-up owner and due date are optional. The remaining-work list is kept in the closeout record.
- A required reliability stage that is not started, running or failed prevents Completed and permits Closed with outstanding items.
- A missing design approval or final acceptance disables neither choice, and a bypassed approval does not count as a passed test or retest.
- The outstanding list is rechecked on the server at the moment of closing. If something became outstanding after the page loaded, Completed is refused and the new list is shown.
- When two Editors close the scope at the same time, one succeeds and the other sees a conflict; there is one closeout record.
- Closing writes one fixed, named closeout record from a single consistent point, holding drawings, schedules, the estimate, evidence, field changes, approvals and bypasses, outstanding items and every reliability run. Its stored file does not change afterwards, checked by its hash.
- A run still open at closing is stopped with the reason "Scope closed", has no outcome, and is listed in the closeout record as outstanding.
- After closing, the scope's state reads Completed or Closed with outstanding items in the frame, the field shell chip and the project list.
- A save of work, results, photos or issues for the closed scope from a tab that was open before closing is refused and kept for review as "not saved: scope closed"; it is not retried.
- An Editor can create a reviewer link to the closeout record under the rules of story 4.7.
- Once a scope is closed, a reviewer link to one of that scope's design revisions opens its revision read-only and accepts no comment or decision. A link to the closeout record still accepts them.
- A proposal cancelled during the scope appears in the closeout record and the Closeout package as a change to the scope, with its reason.
- The final-acceptance assignee (assigned in story 4.6), by account or through a reviewer link, opens the fixed closeout record, comments and records a decision on it. A bypass is recorded as a bypass, with an optional reason. Neither a decision nor a bypass changes the scope's Completed or Closed with outstanding items state, or any outcome.
- A decision made through a reviewer link is labelled as made by a name that is not verified, in the interface and in the Closeout package.
- The Closeout package is generated from the closeout record, never from live records, and is retained and downloaded under the same rules as the Design package of story 4.10.
- The Closeout package shows recorded installation plans and status, changes from the issued design, known settings and identifiers, phase summaries, every attempt of the scope with earlier failures and corrections, notes and photos, outstanding issues, and approvals or bypasses as they stood at its cutoff.
- For each reliability run the package shows its dates, planned and actual duration, downtime log, availability, target and outcome.
- Photos are captioned with their device or note reference, two to a page. Leaving out required photo evidence labels the package "Evidence-limited summary" on every page.
- A package limited to some floors is labelled Partial and still carries the property-wide closeout state and the full list of outstanding issues.
- A package generated before closing is labelled Draft, In progress, and closes nothing.
- A Viewer can download an existing Closeout package and cannot close the scope or create a package.

Notes: Story 6.12 adds the warranty step, warranty details and service visits to the closeout record and package. Story 6.8 adds removed, replaced and unresolved connection context. Stories 7.5 to 7.7 add closet, port and inter-floor schedules. Starting new work after closing is story 6.10. This story is large (closing, final acceptance and the package); if it does not fit one sitting, split the package criteria into a following story when the epics are next renumbered.

### Story 5.13: Lost connection and conflicts on a phone

As a technician, I want my entries kept when the signal drops and shown clearly when they clash with someone else's, so that I do not lose work or overwrite a colleague's.

Covers: FR-21, FR-42, NFR-2, NFR-3. Screens: S-F7.

- With no connection, a persistent banner reads "Not connected. Your entries are kept on this page until you are back online. Keep this page open." Each unsaved mark, outcome, note and photo shows Unsaved.
- A photo taken with no connection stays on the page as Unsaved and uploads when the connection returns.
- On reconnection the app reads the current state before retrying. An entry that had already been saved is not sent again, and no duplicate attempt, note, photo or mark appears.
- A conflict on a device opens a per-field comparison that fits a phone screen: the saved value, who saved it and when, beside the pending value. For each field the technician keeps the saved value or reapplies their own, and the version is checked again on save.
- A change saved by someone else to a device whose form is open is not applied to the form; a notice names who updated it and offers to review.
- If the session ends while a device sheet is open, the sheet asks the technician to sign in again and keeps what was entered on the page.
- A pending entry refused because the technician's access was removed, reduced or deactivated stays visible as "not saved: access changed", can be copied, and is not retried.
- After a reload on a real iPhone and a real Android phone, every entry that showed Saved is still present.

Notes: Refusing a stale save into an archived project is story 6.11's criterion, and refusing one onto a removed device is story 6.8's; both use the comparison built here. A stale save into a closed scope is in story 5.12.

## Epic 6: Existing sites and return visits

**Outcome.** An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact.

**Depends on.** Epics 1 to 5 complete. Nothing later: what removal and restoration do to switch ports is in story 7.5, and what they do to door links is in story 7.3.

### Story 6.1: Existing equipment, condition, provenance and the surveyed baseline

As a designer, I want to record the equipment and cable already on site with what is known about it and how it is known, so that planning starts from the real building and not from guesses.

Covers: FR-39, device state model (condition and provenance).

- A device can be added as Existing during a survey. It is placed on a plan like any other device and creates no purchase line, no Installed mark and no test result.
- A known cable route can be drawn as existing. It keeps a stable run identifier and creates no purchase quantity.
- An Existing device has a condition of Working, Faulty or Unknown. It starts as Unknown, a person sets it, and a test outcome never changes it.
- Each recorded value can carry a provenance of Imported, Old document, Estimate or Site-confirmed, shown as a chip beside the field with the source detail on demand.
- A camera with an unknown model or installation date can be saved with those fields shown as Unknown. Recording it today does not set its installation date.
- A device keeps its internal identifier and can also hold the label already used on site; both are searchable.
- A surveyed baseline can be saved as a fixed named revision, marked as the baseline in Records. It is listed only when its snapshot is stored and its hash verified; a failed save is shown and can be retried.
- Later edits leave the baseline's stored file unchanged, checked by its hash.
- A revision restore leaves condition and provenance unchanged.

Notes: Lifecycle (Proposed, Existing, Removed), the "recorded as existing" mark and the Current and Proposed basis come from story 2.7; this story builds on them and adds no second flag. Story 4.1 already keeps a restore from changing the recorded values of Existing devices. Spreadsheet intake is stories 6.2 to 6.4. Removal is story 6.8.

### Story 6.2: Import a CSV or Excel inventory with column mapping

As a designer, I want to load an equipment spreadsheet and say which column means what, so that an existing inventory does not have to be retyped.

Covers: FR-62, AD-10, UX decision D9. Screens: S-09 steps 1 and 2.

- An .xlsx file with a title row is read from the chosen sheet and header row, with a preview of the first rows. A CSV with different headings maps to the same fields, after its delimiter and parsed columns are confirmed.
- Columns can be mapped to source asset ID, existing Site Studio ID, name, type, manufacturer, model, serial number, IP address, MAC address, building, floor and room hints, and notes.
- Suggested mappings can be corrected. Unmapped and ignored columns are listed before the next step.
- A default equipment type, including Unknown, can be set for rows whose type is missing or not recognised.
- A row with neither a usable name nor a source asset ID is shown as an error and cannot be imported until it is corrected or skipped.
- Asset ID 00042 stays 00042. A value whose conversion is uncertain, such as a long number or a date-like identifier, is flagged on its row.
- Formulas, macros and external links are never run. A cell with a stored formula result is read as that result; a cell with an error or no stored result is flagged for review.
- A legacy .xls, macro-enabled or password-protected file, a file over 10 MiB, and a file with more than 5,000 data rows are each refused at step 1 with a plain reason, and the saved inventory is unchanged.
- A file with no data rows, a header row with duplicate headings, or two columns mapped to one field stops at mapping with a plain reason, and nothing changes.
- A sample template can be downloaded.
- The project's last confirmed mapping is offered only when the headings fit, and can be edited before it is used.
- The fixture script of story 2.7 also produces a 600-row inventory as .xlsx and .csv. The file is parsed in the browser, and the page stays usable while that file is parsed.
- The source file and the confirmed mapping are kept with the import batch and can be opened from it.

### Story 6.3: Review rows, apply, and re-import safely

As a designer, I want to see what an import would add or change before it happens, so that a spreadsheet cannot overwrite what was confirmed on site or create duplicates.

Covers: FR-58, FR-62 (row review and result). Screens: S-09 steps 3 and 4.

- Rows are grouped as New, Changed, Unchanged and Needs review, with counts. A Changed row shows the current and incoming values side by side with the source of each.
- A row matches an existing device only by a valid Site Studio ID for this property or by a source asset ID that is unique in the file and the project. Names, addresses and location hints never establish identity alone.
- Duplicate names, duplicate rows in the file and conflicting identifiers go to Needs review.
- Rows are ticked explicitly. A group-level select is offered for New and Unchanged rows without errors.
- A row error is shown inline with Fix and Skip.
- Re-uploading the same inventory creates no extra devices and lists its rows as Unchanged.
- Site-confirmed values are locked by default. Replacing one takes a deliberate choice on that row, is recorded with a reason, and keeps the earlier value in the device's history.
- A blank cell erases nothing, and a device missing from the file is neither deleted nor archived.
- Imported values carry the Imported provenance. An import sets no Installed or Configured mark and no check outcome, whatever the source columns say.
- A record changed by someone else since the preview comes back as a conflict, with the choice made for that row kept for review.
- When two people apply the same file at the same time, New rows are matched again at the moment of applying, and each device is created once.
- An apply interrupted part-way reports which rows were applied. Continuing applies only the remaining rows and creates no duplicates.
- The result reports imported, skipped, failed, conflicted and unresolved counts, with links to the records awaiting placement and those needing review.

Notes: A row that matches a removed device is handled in story 6.8.

### Story 6.4: Awaiting placement, and verifying on site

As a technician, I want to find imported records that have no position, check them against what is really there and place them, so that the inventory becomes a verified survey.

Covers: FR-56, FR-57, FR-8 (Awaiting placement). Screens: S-08, S-F5, S-F6.

- An imported record with no confirmed floor or position sits in Awaiting placement with its building, floor and room hints. It has no map marker, no coverage and no test result.
- The Awaiting placement list is searchable and can be filtered by building, floor or room hint. Its count stays visible while one floor is shown.
- Choosing an unplaced record in the equipment list opens its Awaiting placement entry, not a floor.
- Capacity estimates still count the unplaced device's applicable demand, and coverage results state how many devices are omitted because they are unplaced.
- On a phone, a technician can confirm or correct each value. A confirmed value becomes Site-confirmed, and the imported value stays in view as the earlier source.
- The technician places the record with the crosshair on a chosen floor. It keeps its identifier and import history, and no second device is created.
- Placing sets no Installed mark, confirms no other value and passes no check.
- A device found on site that was not in the spreadsheet can be added from the same screen as an Existing device.
- A project with no spreadsheet can be surveyed by adding every device by hand.

### Story 6.5: Bulk cleanup of mistaken records

As a designer, I want to remove a batch of mistaken records in one step after seeing what would go, so that a bad import can be undone without touching real equipment.

Covers: FR-59. Screens: S-10.

- A selection of records, or one import batch, can be previewed: how many are selected, how many can be removed, and each blocked record with its reason.
- Only accidental drafts that qualify for Delete draft and unused records created by an import can be removed.
- A device that existed before the batch and was only matched by it is blocked. Membership of a batch alone never makes a record removable.
- Site-confirmed, issued, approved, installed, tested or otherwise evidenced records are blocked, as is equipment that other records depend on.
- Eligibility is checked again on confirmation. A test added or an edit made since the preview blocks that record and it is reported, not removed.
- Removing a record removes no other device, cable, note, photo or issue.
- The outcome is listed per record and appears in the activity log.
- The cleanup can be undone by the person who ran it. Undo is refused for a record whose floor has since been deleted or which someone else has since changed, and those records are listed.

### Story 6.6: Planned actions, and Current, Proposed and Changes

As a designer, I want to say what will happen to each existing device and see the site as it is, as it will be, and the difference, so that an upgrade is planned without rewriting the record of what is there.

Covers: FR-40, FR-41, FR-33 (planned actions in the Design package), device state model (relocation). Screens: S-11, S-04 Work tab.

- An Existing device can be planned as Retain, Relocate, Service or reconfigure, Replace or Remove. A new device is Add new. A device with no decision shows None.
- A choice the state model forbids is disabled with its reason: any action except Add new on a Proposed device, Add new on an Existing device, and any new action on a removed, cancelled or corrected device.
- Choosing Replace creates a new Proposed device with its own identifier, linked to its predecessor. Replace cannot be saved without that link.
- A planned replacement leaves the old device in Current installation and shows the new one in Proposed design. Proposed counts include the replacement and not the predecessor, unless the predecessor is marked to remain.
- Planning a relocation shows the planned position in Proposed design and leaves the current position unchanged in Current installation.
- Recording Installed on a device with a planned Relocate makes the planned position its recorded location in Current installation, and the earlier location stays in its history.
- A planned Remove leaves the device in Current installation and takes it out of Proposed design.
- A Faulty camera is not credited in a coverage estimate on the Current installation basis. One with a planned return to service is credited on the Proposed basis and labelled as a planned return to service.
- Retained equipment and retained cable create no purchase line and appear in the estimate under "Retained, not purchased". Relocation, service and replacement costs are entered as explicit lines.
- A device with unknown specifications is shown as unassessed or estimated in each result, never as zero demand or as coverage.
- The basis control gains Changes beside Current installation and Proposed design. Changes shows relocation arrows, replacement pairs and a list of devices grouped by action, followed by cancellations and corrections against the current issued design.
- The device sheet's one-sentence instruction begins with the planned action for Retain, Relocate, Service or reconfigure, Replace and Remove, as it does for Add new.
- The Design package shows each device's planned action on plan sheets and in the equipment schedule, with retained equipment shown as context and not as a purchase.
- Planned actions are saved in a named revision and returned by a revision restore.

Notes: Recording the work (story 5.3) is what changes Current installation. The rule that hiding a layer changes no analysis is in story 5.2. Recording a removal is story 6.8. This story is large; splitting planned actions from the Changes view is a question for Kevin.

### Story 6.7: Work scope categories

As a designer, I want to mark each device and route as worked on now, only inspected, or only shown for reference, so that the estimate and the checks cover exactly the work in this scope.

Covers: FR-45. Screens: S-11.

- The scope panel names the active scope and lists its revisions, its estimate and its evidence. Saving a second named revision keeps the same scope and the same estimate.
- Each device and route in the scope is Work now, Inspect or test only, or Reference only.
- The category is preselected from the planned action: Add new, Relocate, Service or reconfigure, Replace and Remove give Work now; None and Retain give Reference only.
- A device with a planned action of None or Retain cannot be set to Work now; the reason is shown.
- Changing a category is recorded with actor and time, and asks for a reason when it moves an item out of Work now.
- The scope panel shows the estimate and the required checks that each category implies, and both update when a category changes.
- The applicable core checks of story 5.4 are required by default for each Work now device. An Inspect or test only device has no check required by default; an Editor selects the checks that apply to it. A Reference only device gets no checks.
- Reference-only equipment still counts in coverage and capacity and creates no purchase line.
- An Inspect or test only device can have a labour line without an equipment purchase.
- Moving an item that has a required retest or an open issue to Reference only shows a warning and leaves that item in the remaining-work list.
- Scope categories are saved in a named revision and returned by a revision restore.

Notes: The first scope is created with the project in story 2.1. A second scope is created by reopening in story 6.10, which carries the rule that only one scope is active at a time, and that a later scope starts at Not issued with assignments, rates and copied estimate lines offered for reuse.

### Story 6.8: Record a removal, archive the device and settle its connections

As a technician, I want to record that a device has actually been taken out and say what became of its cables, so that the record matches the site and nothing about the device is lost.

Covers: FR-35, FR-53, FR-8 (historical records), FR-33 (removed equipment and connection context), FR-42, FR-58 (archived match), FR-60 (archived device references), FR-68 (attention count), NFR-1. Screens: S-04, S-12.

- The device menu of story 4.9 offers Record removal for an Existing device. Recording a removal, with its date and an optional reason and replacement link, makes the device Removed and archives it in the same step. The actor and time are recorded.
- The archived device keeps its identity, model, settings, last location, connections, work marks, checks and attempts, notes and photos. No field has to be filled in to archive it.
- A removed device leaves the active plan and schedule, coverage, equipment totals and capacity demand. Earlier revisions and packages are unchanged.
- A planned Remove or Replace alone archives nothing.
- A removed device is found by search under Historical in Equipment, labelled Removed, with its evidence. An optional historical layer shows it on the plan at its last location.
- Before the removal is confirmed, a review lists the device's cable ends, its open issues, its required retests and any open reliability run that covers it.
- Open issues and required retests on the device stay in the remaining-work list after removal. Removal resolves no issue.
- An open reliability run that covers the device is flagged and keeps running.
- Each affected cable end gets a disposition: retained and disconnected, reused, removed, or unresolved. Unresolved is allowed and is flagged Needs connection review.
- The cable keeps its run identifier, route, lengths, notes and evidence. The device's connection to it is ended and kept as history. A cable is archived only when its own removal is recorded.
- Recording the removal of a switch flags the cable ends connected to it for review and archives no other device.
- For a Replace action, the work shows as done only when the successor's installation and the predecessor's removal are both recorded. The predecessor's notes, photos and passes stay with the predecessor.
- The removal and its dispositions are one operation. A stale tab cannot leave a cable end actively connected to a removed device.
- A save onto a removed device from a stale tab or a reconnecting phone is refused and kept for review, not applied and not discarded.
- A revision restore leaves a removed device archived and its dispositions unchanged, and lists for review a removed device that the revision still holds.
- A floor that holds a removed device's last location cannot be deleted; the refusal lists the device.
- The project list's attention count of story 5.9 includes cable ends flagged Needs connection review.
- A re-imported row that matches a removed device goes to Needs review; it does not reactivate the device and creates no new one.
- The closeout record and the Closeout package list removed and replaced equipment and the retained, reassigned, removed and unresolved cable ends, with historical ends shown apart from current connections.

Notes: Port dispositions and the rule that a former port is not declared free are in story 7.5. A door link on a removed component is in story 7.3.

### Story 6.9: Restore the same device, or link a replacement

As a technician, I want to put an archived device back on the plan as the same record, or record a different unit as its replacement, so that history follows the physical equipment.

Covers: FR-36, FR-54, FR-53 (reconnection and reuse), NFR-1.

- Restoring keeps the device's identifier and history, records who restored it and when, and makes it Existing with condition Unknown.
- Restoring needs a position confirmed by the user on a current floor of the same property. The device never enters Awaiting placement.
- On an unchanged or renamed floor the former position is offered for confirmation. On a floor whose drawing, scale or alignment has changed, the position must be set again.
- When the original floor was deleted, the user chooses another current floor. The deleted floor is not recreated, and a new floor with the same name is not treated as the original.
- Cancelling leaves the device archived with its history intact.
- A restore is refused when the chosen floor or the device has changed since the restore screen opened, and the choices made are kept for review.
- When the device's label or asset ID is now used by another active device, the restore asks for a label decision before it can be confirmed.
- Earlier photos and attempts keep their former floor and location. Earlier passes are not counted for the restored device, and its checks are flagged Retest required.
- Earlier cable connections are offered as historical choices and are not reinstated. Reconnecting is an explicit step and cannot take a cable end now connected to another device or bring back a removed cable.
- Restoring creates no purchase line.
- A different physical replacement has a new identifier linked to its predecessor. Each keeps its own history, results and counts, and the link can be followed in both directions.
- A retained cable chosen for the replacement keeps its run identifier and creates no purchase line. The replacement inherits no installation evidence and no pass from the predecessor.

Notes: Reconnecting a restored device to a switch port is in story 7.5.

### Story 6.10: Reopen for later work, carrying issues forward

As a designer, I want to reopen a finished project for new work at the same property, so that later work starts from what is installed and keeps the earlier records fixed.

Covers: FR-38, FR-45 (one active scope), FR-46 (carryover). Screens: S-20, S-18.

- Reopening a project whose last scope is closed creates a new named scope, In progress, and a working revision from the latest installation. Project and device identifiers are unchanged.
- The new scope has its own empty estimate and its own checks. Equipment already installed creates no purchase line. Rates and chosen lines can be copied from the earlier estimate; no quantity is carried over automatically.
- The new scope starts at Not issued and with no approvals; review assignments are offered for reuse and can be changed.
- Reopening restores no removed device, resolves no issue, carries no approval or pass into the new scope, and leaves earlier closeout records and packages unchanged, checked by hash.
- Reopening is refused while a scope is active. When two people reopen at the same moment, one scope is created and the second person is taken to it.
- An unresolved issue appears in the new scope with the same identifier and awaits a disposition: Include now, Defer or Resolve. It is not duplicated.
- A scope finished with a deferred fault can be closed only as Closed with outstanding items.
- A revision of an earlier scope can be opened and compared. It cannot be restored into the new scope or designated as its current issued design.

Notes: Reopening an archived project is in story 6.11. Start service visit, which reopens into a service scope, is story 6.12.

### Story 6.11: Archive and un-archive a project

As an Editor or an administrator, I want to archive a project that is no longer being worked on and un-archive it when needed, so that finished records stay readable and cannot be changed by accident.

Covers: FR-37, FR-68, FR-42. Screens: S-20, S-31.

- An Editor of the project can archive and un-archive it from Records, and an administrator can do so from Records or from Administration: Projects. A Viewer cannot.
- The projects list and Administration: Projects show the archived state.
- Archiving is refused, with the reasons listed, while a scope is In progress or while an inventory import or a package upload is running in the project.
- An archived project shows the banner "Archived — view, search and export only". It can be searched, viewed and exported and cannot be edited.
- Viewing and exporting leave its design, installation, evidence, decisions and earlier packages unchanged. Downloading an earlier package returns the same bytes.
- Exporting may add a new retained package edition without un-archiving the project.
- Un-archiving is an explicit action, starts no scope and changes no record.
- Reopen on an archived project first asks to un-archive it.
- A save into an archived project from a stale tab or a reconnecting phone is refused and kept for review as "not saved: project archived"; it is not retried.
- When two people archive at the same moment, the project is archived once and the second person sees that it already is.
- A revision restore is refused while the project is archived, and no restore changes the archive state or its history.
- While the project is archived, a reviewer link opens its revision read-only and accepts no comment or decision.
- Archiving and un-archiving appear in the activity log with actor and time.

Notes: The list of running jobs that block archiving is extended by story 8.1 with backup and restore jobs.

### Story 6.12: Warranty and service visits

As a technician, I want to record the warranty on an installation and each visit made to fix a fault, so that anyone can see what is covered and what was done.

Covers: FR-65, FR-33 (warranty and service visits). Screens: S-19, S-23 warranty step.

- A scope's installation warranty has a term in whole months, of at least 1, a start date, a provider, a note and covered items. The start date defaults to the scope's closeout date and can be changed.
- Covered items default to the equipment and cable newly installed in that scope and can be adjusted.
- A device can also carry a manufacturer warranty with its own term, start date and provider. A device with both shows each separately.
- Each warranty shows its calculated end date, which is the start date plus the term, and its status as of a stated date: Not started before the start date, In warranty from the start date to the end date inclusive, Expired after it.
- A warranty recorded on a scope that is not yet closed, with no start date entered, shows Not started.
- Equipment with no warranty recorded shows Unknown, never Expired. This includes surveyed existing equipment.
- Changing a warranty's term, start date, provider or covered items is recorded with actor and time, and the earlier values stay in its history.
- Warranty details are shown on the device record and as an optional column in the equipment schedule. When an issue is raised on a device, the device's warranty status is shown on the issue.
- A service visit is recorded on an issue with when and how the fault was reported, the visit time, the fault found, the work done, the parts used, the time spent, who attended and whether it was under warranty.
- The visit time cannot be earlier than the reported time, and neither can be in the future.
- Under warranty is prefilled as of the visit date, with its reason shown, and can be changed: Yes if any warranty covering the device is In warranty, No if all are Not started or Expired, Unknown if none is recorded or the issue concerns no device.
- During an open scope, a visit is recorded in that scope and no new scope is started.
- With no scope active, Start service visit, after a confirmation that says what will happen, reopens the project into a new scope marked as service, named "Service visit" with the date, with the issue included and no estimate required. For an archived project, the action first asks to un-archive it.
- When two people use Start service visit at the same moment, one service scope is created.
- A camera re-aimed during a visit is recorded with its reason and flags its checks, although the service scope has no issued design.
- A visit does not resolve the issue, which stays open until corrective work and a current passing check are recorded. A visit changes no estimate.
- A second visit on the same issue sits beside the first. A corrected visit keeps its earlier entry.
- The service scope's closeout record shows every visit made in it. The original scope's closeout record and its warranty details are unchanged, checked by hash.
- The closeout record and the Closeout package show the scope's warranty details and every service visit recorded in the scope.
- A revision restore leaves warranties and service visits unchanged.

Notes: A part used in a visit that is itself a replaced device follows stories 6.8 and 6.9. This story is large; splitting warranty records from service visits is a question for Kevin.

## Epic 7: Extended modelling

**Outcome.** The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors.

**Depends on.** Epics 1 to 5 complete. Story 7.3 also needs story 6.8, story 7.5 needs stories 6.8 and 6.9, and story 7.7 needs stories 7.1 to 7.6. Nothing later.

### Story 7.1: Cameras with several views and streams

As a designer, I want one camera body to carry several views and streams, so that multi-head and panoramic cameras are analysed honestly and bought once.

Covers: FR-48, FR-19 (views and streams).

- A four-head template creates one physical camera with four views. Each view has its own stable identifier, resolution, lens setting, bearing, tilt and condition, and can be inspected separately.
- Each of the four views is analysed with its own inputs, and a combined result names the view that supplies it.
- The camera counts as one device in the estimate and contributes one device's power demand to capacity, whatever its number of views.
- Capacity counts only the streams configured as recorded or transmitted. Four displayed crops add no stream.
- A fisheye camera's preview is drawn as illustrative and only when its mounting, angular extent and chosen range are known. Its DORI is Not assessed and it earns no credit toward a zone target.
- An area seen only by a fisheye or composite view is reported as Not assessed, not as having no camera view. A zone whose target is unmet and that such a view is in range of shows Not demonstrated, not Shortfall.
- A stitched-panorama camera keeps its source-head profiles apart from its composite output. Source heads are analysed individually, and the composite's DORI is Not assessed.
- A view marked Faulty is not credited on the Current installation basis; the camera's other views still are.
- Changing one head's settings on an installed camera flags that head's checks only.
- An issued design keeps the views and results it captured after the camera is edited.

### Story 7.2: Pan/tilt/zoom cameras

As a designer, I want a pan/tilt/zoom camera to count only where it rests and to show separately where it could look, so that coverage is not overstated.

Covers: FR-63, FR-29 (pan/tilt/zoom starter). Screens: S-06.

- A camera-model template can hold a pan range, a tilt range and a zoom range. A placed camera can hold its own pan and tilt limits within the model's range. Unknown ranges and limits are shown as Unknown.
- A placed camera holds named stored positions, each with pan, tilt and zoom, and one can be marked Home.
- The PRD's worked example holds: the home position alone contributes to combined coverage and to the entrance zone; the loading-dock zone keeps its counted shortfall and separately shows that the camera can reach it on demand, with the achievable detail, and that line does not meet the target.
- Previewing another stored position draws it with a dashed outline and a "not counted" banner and changes no totals.
- Reach is drawn as a separate layer named "Reachable on demand", visibly different from covered area, and is never counted as covered or as overlap.
- A point within reach shows the best achievable detail there, labelled "one place at a time".
- Narrowing a pan limit shrinks the reach.
- With unknown pan or tilt limits no reach is drawn and the camera's reach is disclosed as unassessed. With limits but no optical data, the outline is drawn with "Detail not assessed".
- Without a home position the camera contributes no counted coverage and is flagged "No home position — not counted in coverage".
- The camera counts as one device with one power demand, and stored positions add no streams.
- Changing the home position on an installed camera changes counted coverage and the zone results that depend on it, and flags that position's checks. Changing another stored position flags that position's checks, and changing a limit flags the limit checks.
- Editing a stored position on a proposed camera flags no field check.
- Limits can be edited as numbers as well as by handles.
- A pan/tilt/zoom checklist starter offers these checks: limits stop where intended; pan, tilt and zoom controls operate; each stored position shows its intended scene; the camera returns to home; limits or positions keep it from facing bright light.
- Positions, limits and the home mark are kept in a named revision. A revision restore returns them for a proposed camera and leaves those of an installed camera unchanged.

Notes: Package sheets that show the resting view, previews and reach are in story 7.7.

### Story 7.3: Doors and gates with linked components

As a designer, I want a door or gate to be its own record linked to its reader, contact, lock and controller, so that an opening can be read as a whole without any component being counted twice.

Covers: FR-49. Screens: S-08 Doors and gates.

- A door or gate has its own identifier, location and details, and can be created with no components.
- Door D-01 links to its reader, contact, lock and controller. Each stays a separate record with its own identifier, location, cost, planned action, work marks, checks and notes. A link can carry a side or direction label.
- The door lists its components, each component names its door, and the equipment schedule shows the relationship.
- Linking the same controller to D-02 creates no second purchase line and no second demand.
- A door with its own entered price appears as its own estimate line, and the costs of its components are not added to that line.
- A retained door can receive a proposed new reader. The door gets no purchase line and no Installed mark from it.
- Creating a link creates no cable, no port assignment and no power demand, and marks nothing installed or tested.
- Removing a link keeps the component and its evidence.
- Recording the removal of a linked component lists the door link in the removal review of story 6.8, and the link is kept as history on the door.

### Story 7.4: Site annotations

As a designer, I want to mark fences, entrances, directions, notes and dimensions on a plan, so that the drawing explains the site without changing any analysis.

Covers: FR-50. Screens: S-07.

- Fence lines, entrance markers, direction arrows, text callouts with an optional leader line, and two-point dimensions can be drawn on any plan, including an outdoor site plan. Each has a name and a stable identifier.
- An annotation can be selected, moved, edited, restyled with a colour and line style, locked, hidden and deleted. A locked annotation cannot be moved or edited until it is unlocked.
- Each annotation shows a text label, so its meaning does not depend on colour.
- Annotations are the same after save, undo and reload. They are saved in a named revision and returned by a revision restore.
- A fence line blocks no camera view until an obstruction is added. The offer to add one appears once for each line.
- A dimension on a plan with a valid scale shows its length with units, labelled as an estimate from the plan. On a plan without a valid scale it reads "Scale unknown".
- A dimension creates no cable route and no supply quantity.
- An entrance marker can reference a gate, and a callout can reference a photo or an issue. Neither creates another record or moves the one referenced.
- Deleting a callout keeps the photo or issue it referenced.
- Hiding or deleting markup changes no coverage result, equipment count or power demand, and does not hide the remaining-work list.

### Story 7.5: Closets and port schedules

As a designer, I want to record equipment closets and which device is on which switch port, so that port and power capacity can be checked and a port is never claimed twice.

Covers: FR-51, FR-19 (ports and power), FR-53 (port dispositions), FR-55 (ports on undo). Screens: S-12.

- A closet has a name, a stable identifier and a floor location. It groups its actual cabinets, switches, controllers, recorders and power supplies, and adds no cost and no load.
- Renaming or regrouping a closet moves no device and redraws no route.
- Each switch has a port schedule. A port shows label, type, endpoint, cable reference and power, with allocation (Free, Reserved, Assigned) and availability (Usable, Unavailable, Unknown) in separate columns.
- A port on another floor can be planned for a camera before a route exists, and shows that the route is missing. A port can be reserved with unknown power.
- Current installation and Proposed design assignments are kept separately. Assigning a port sets no Installed mark and passes no check.
- When two people claim one port, one succeeds. The other sees a conflict with the claim kept as a pending edit, and the conflict is highlighted on both rows.
- A connection on an Unavailable port keeps its record and shows a warning.
- The power summary shows the budget, known allocation, reservations and unknown loads. With any unknown load it reads Incomplete, with the count, and never shows a pass.
- With unknown inventory on a switch, the count of available ports is shown as unknown, not as a number.
- A controller terminal creates no Ethernet port and no power source, and a device wired to a controller uses no switch port.
- A cable whose end disagrees with its port assignment is shown as a discrepancy on both.
- Port and power capacity estimates use these assignments and list unassigned demand separately.
- The removal review of story 6.8 also lists the device's port and terminal assignments, each with a disposition: retained and disconnected, reused, removed, or unresolved. Unresolved is flagged Needs connection review and is included in the attention count.
- After a removal the device's demand is gone and its former port is not shown as Free until someone releases or reassigns it.
- Recording the removal of a switch flags its port assignments for review and archives no downstream device.
- Restoring a device under story 6.9 offers its earlier port as a historical choice and does not reinstate it. Reconnecting cannot take a port now assigned to another device.
- Delete draft on a proposed device with a planned port assignment lists the assignment in its preview and, on confirmation, releases only that device's own reservation. A device with a Current installation port assignment is not eligible, and the reason is listed.
- A Delete draft sent from a stale view, after someone assigned the device a port, is refused with the reason.
- Undoing a draft deletion or a bulk cleanup does not reclaim a port that has since been assigned to another device; the undo reports it.
- A revision restore returns proposed port assignments and leaves current assignments, availability and removal dispositions unchanged.

Notes: This story is large; splitting closets and port schedules from the removal, restore and undo rules is a question for Kevin.

### Story 7.6: Cable runs between floors and the length ledger

As a designer, I want one cable run to cross floors through a named riser with its length built up part by part, so that cable quantities are right and each run is counted once.

Covers: FR-9, FR-52, FR-60 (riser references). Screens: S-13.

- A riser is a named point with a stable identifier and from and to floors. Several runs can use one riser, and selecting it lists them.
- One run keeps one identifier across its ordered floor segments and its riser, and its detail shows both terminations.
- Each segment is measured with its own floor's scale. No length between floors is taken from plan coordinates.
- Transition and drop lengths are entered with units and marked measured or estimated.
- The PRD's worked example holds: 20 m and 12 m segments, a 6 m transition and 2 m of drops give a route subtotal of 40 m; 2 m of fixed extras and a selected 10% give 46 m. The ledger shows this as arithmetic, with the percentage applied once and not to the fixed extras.
- The run appears on two floors, each with a continuation label such as "to Level 2 via Riser R-1", and once in totals.
- Removing a required transition value makes the estimate Incomplete with the known subtotal shown. An entered zero is accepted as no extra length.
- A plan without a valid scale makes the estimate Incomplete.
- Moving an endpoint or waypoint updates the estimate and flags a manually entered supply quantity for review.
- A measured installed length is kept beside the estimate with its source, and no allowance is added to it.
- A run that exceeds a stated length limit for its cable type is flagged. No limit is applied to a cable type that has none recorded.
- Drawing or measuring a run sets no Installed mark and passes no check.
- Routes drawn under story 2.9 are converted and labelled horizontal-only until reviewed.
- A floor that a riser or a run segment refers to cannot be deleted; the refusal lists the riser and the runs.

### Story 7.7: Package sheets for the extended model

As a designer, I want packages to carry the closets, ports, inter-floor runs, annotations and camera analysis detail, so that the printed record matches the model.

Covers: FR-33 (remaining contents). Screens: S-37.

- Design and Closeout packages include closet equipment and port schedules, stating the Current or Proposed basis, reservations, power assumptions and unresolved warnings.
- The Closeout package shows port dispositions from removals, with historical endpoints apart from current assignments.
- Floor sheets show inter-floor continuation labels, and a run schedule lists each run's identifier, terminations, floors and risers, length breakdown, fixed extras, percentage, suggested and selected supply, measured length and completeness.
- Each run is counted once in schedules and totals across sheets and volumes.
- Annotations appear on plan sheets by default with their labels and a legend. When they are left out, the package says so, and the outstanding-issue summary is still included.
- Analysis sheets mark assessed views, illustrative fisheye previews and unassessed panoramic outputs differently.
- Analysis sheets show a pan/tilt/zoom camera's resting view as counted, and its previews and reach as not counted, each labelled.
- Equipment schedules show each door with its linked components and their own identifiers.

Notes: Extends the Design package of story 4.10 and the Closeout package of story 5.12.

## Epic 8: Backups and recovery

**Outcome.** Projects and the installation's own data are backed up daily, a project or a whole installation can be recovered, and a project can be moved as a portable backup.

**Depends on.** Epics 1 to 7. The backup and restore checks name records from all of them: revisions and packages (Epic 4), evidence and issues (Epic 5), removed devices and archive state (Epic 6), connections (Epic 7). The self-hosted parts need stories 2.13 to 2.15. Nothing later.

### Story 8.1: Daily backups of projects and of the installation's data

As an administrator, I want every project and the installation's own data backed up each day to separate storage, so that a lost store costs at most a day of work.

Covers: FR-34, FR-70 (Backups), FR-71, AD-13. Screens: S-34, S-31, S-02, S-20.

- A complete backup of each project is made at least once every 24 hours into the backup area, with a manifest listing every record file and every file hash.
- The installation's own data is backed up on the same schedule: accounts with password hashes and two-step secrets, roles, memberships, settings with their protected secrets, and the activity log.
- A backup is made through the server from one consistent point of the project's records; a save acknowledged while the backup runs is not lost and is either wholly in that backup or wholly in the next.
- A backup job interrupted by a server restart continues from its last completed step and finishes without starting again.
- Seven successful daily generations are kept for each project and for the installation's data. A failed backup does not count as one of the seven and removes no earlier generation.
- A backup can also be taken marked "before an update or data conversion"; the most recent one so marked is kept in addition to the seven and is not removed by daily rotation.
- Rotation removes a file from the backup area only when no kept generation lists it, and removes nothing from a live project or from the activity log.
- Backup storage does not count against a project's 8 GiB budget.
- Administration (S-34) lists each project and the installation's own data with the latest backup, its age and its outcome: Succeeded with age, Failed or Never. The Projects table (S-31) shows each project's latest backup.
- Archiving or un-archiving a project is refused, with the reason, while a backup or restore job for that project is running, and a backup that falls due during an archive waits for it.
- An administrator starts a backup of one project or of the installation's data with Back up now; a standard user cannot open the screen or call the function.
- Only one backup job runs for a project at a time: Back up now pressed while one is running shows the running job and starts no second one, and a daily backup that falls due while a manual one runs waits for it and is then skipped if that one succeeded.
- The Overview (S-02) and Records (S-20) show the project's latest backup age to its members.
- A latest successful backup more than 24 hours old, or a failed backup, is shown as a failure with its age, on S-34 and on the project's Overview.
- Each backup, its outcome and each failure appears in the activity log with time and actor (the administrator, or "scheduled").
- On Cloudflare the backup area is a second storage bucket, separate from the live bucket, created by the Cloudflare deployment; a deployment without it fails with a message naming the missing bucket.
- Self-hosted, backups are written to the backup folder set in the Compose file (story 2.14), and to nowhere else.
- Self-hosted, when the backup location is on the same disk as the live data the server still starts, and S-34 shows a warning that a disk failure would lose both.
- When the backup area is full or cannot be written, the backup is shown as Failed with that reason, live saves continue to be accepted, and no earlier generation is damaged.

Notes: There is no installer; AD-13's "the installer asks for it" is met by the Compose settings of story 2.14, which keeps the live and backup folders separate and refuses to start if they are the same folder. This story adds the same-disk warning and the advice, repeated in story 9.1's instructions, to place the backup folder on another disk or machine. Story 9.5 takes the "before an update" backup through this story's job.

### Story 8.2: Restore one project into an isolated copy, then switch

As an administrator, I want to restore a project from a backup into a separate copy and check it before it replaces anything, so that a bad restore never damages the working project.

Covers: FR-34, FR-70 (Backups), NFR-1, experiment R3. Screens: S-34.

- An administrator chooses one of a project's kept backups and sees its date and the loss window (the time between that backup and now) before starting.
- The restore builds a separate copy that members cannot see or open, and the working project stays open and usable while it is built.
- A backup written at an older data-format version is converted in the copy before it is checked; a backup written at a newer version than the server is refused with an explanation.
- The copy is checked, and each check is listed with its result: record counts against the manifest; device, view and stream identifiers and their relationships; file hashes of originals and previews; named revisions and their snapshots; removed devices; outstanding issues; package volumes and their manifests; and the issued-design designation history.
- If any check fails or the restore is interrupted, "Make this copy current" is not offered and the working project is unchanged.
- Making the copy current is offered only to an administrator, only after every check has passed, and states before confirmation that this project's reviewer links are cancelled and that nobody is signed out.
- Before the switch a backup of the working project as it then stands is taken and kept as "before restore"; if that backup fails the switch does not happen.
- After the switch every reviewer link of that project is refused, no session is ended, and other projects are unaffected.
- A save sent from a page that was open before the switch is refused, stays visible on that page as "not saved: project was restored", is not retried, and changes nothing in the restored project.
- The restored project shows its recovery point and the possible loss window on the Overview and Records, and does not show any revision, decision or issued designation made after that point.
- A copy that has not been made current is listed on S-34 with its size and can be discarded by an administrator; one project has at most one such copy, and starting another restore asks to replace it.
- Starting a restore, each failed check, the switch and a discarded copy appear in the activity log.
- The fixture script of story 2.7 is extended to add files up to the 8 GiB limit.
- Experiment R3: a restore of that 8 GiB project is timed from start to a usable project on Cloudflare and on a self-hosted server, and each elapsed time is recorded against the 60-minute target with the preparation assumed.

Notes: R3's fallback, if the target is missed, is to restore by reference first and copy files in the background (architecture section 12); the decision is recorded with the result. Story 8.4 uses this story's copy, check and switch flow with a portable backup as the source.

### Story 8.3: Recover a whole installation

As an organisation's administrator, I want a written procedure that rebuilds the whole installation from its backups, so that we can recover after losing the server or the account's storage.

Covers: FR-34, NFR-5, AD-13.

- A published procedure, run from outside the interface, rebuilds an installation in an empty destination from the backup area: the installation's own data and every project.
- The procedure states that the deployment key which protects stored secrets is kept outside the backups and is needed for recovery.
- With the key, after recovery accounts, roles, memberships and settings are as they were at the recovery point, and a user signs in with the password and two-step verification they had at that point.
- Without the key, the procedure completes with a stated flag: two-step verification is reset for every account, stored settings secrets (email, map keys, the GitHub token) are cleared and shown as needing re-entry, and this is recorded in the activity log.
- After recovery every session that existed before is refused, every reviewer link is refused, and every invitation and password-reset link issued before recovery is refused.
- Administrators see a notice naming the recovery point, stating that passwords, roles, memberships and deactivations are as they were then, and asking them to review users and members changed since; it stays until an administrator dismisses it.
- Each project shows its own recovery point and possible loss window, as in story 8.2.
- Where the installation's data and the project backups do not match, the procedure reports it and the notice lists it: a project in the catalogue with no usable backup is listed as not recovered and cannot be opened, and a project backup with no catalogue entry is recovered with no members and listed for an administrator to assign.
- Each restored project passes the checks of story 8.2 before it can be opened; one that fails is listed as not recovered and the others remain usable.
- The recovery, its recovery point and each project not recovered appear in the recovered installation's activity log, whose earlier entries up to the recovery point are intact.
- The recovery is run into an isolated destination on Cloudflare and on a self-hosted server, with the installation's data and a project of 8 GiB, and each elapsed time is recorded against the 60-minute target with the preparation assumed.
- An automated test over the record shapes of the project room and the installation object fails if any has a field for a site system's password or access code, so that no backup can carry one in a dedicated field.
- A backup of the installation's data contains no session token, link token, recovery code or password in readable form: a test searches a backup for the known test values and finds none.

Notes: NFR-5's rule that live credentials for the site's own systems stay out of notes cannot be enforced on free text; the criterion above covers record fields only, and the user guidance on note fields belongs to the stories that add them. Password hashes, two-step secrets and protected settings secrets are in the installation backup by requirement (FR-34).

### Story 8.4: Portable backup, out and back in

As a designer (an Editor), I want to download a complete backup of a project and bring it into this or another installation, so that a project can be kept outside the system or moved between hosts.

Covers: FR-34, FR-68, FR-51 and FR-63 (kept through a portable backup), NFR-1, NFR-7, AD-14, experiment R5.

- An Editor or an administrator starts a portable backup of a project as a job and downloads the result; a Viewer's request to create or download one is refused by the server.
- Creating the file and transferring it are shown as separate steps, each with progress and any failure; a failed creation is shown as Failed and can be retried.
- Only one portable-backup job runs for a project at a time, and a job interrupted by a server restart continues from its last completed step.
- The finished file is kept for download for 24 hours, then removed; it does not count against the project's 8 GiB budget.
- The file holds the project's records, named revisions and snapshots, files, packages with their manifests, issues, removed devices, a manifest with hashes, and the data-format version.
- The file holds no accounts, password hashes, sessions, invitation or reset links, reviewer-link tokens or memberships; the names of the people who acted are present as text.
- A portable backup larger than 10 GiB, or of a project over the 8 GiB payload boundary, is not produced; the job stops with the reason and the project is unchanged.
- Importing a portable backup is offered to whoever may create projects: administrators, and standard users when the setting of story 1.10 allows it. It creates a new project and changes no existing one.
- A standard user who imports becomes the new project's Editor; no other member is added, and an administrator sets the rest.
- Before any project is created the upload is validated: the manifest is read, every hash is checked, and a container over 10 GiB or a project payload over 8 GiB is refused.
- A file that is corrupt, truncated, not a portable backup, or over the limits is refused with the reason and no project appears in any list.
- An import that fails or is interrupted after validation leaves no partial project; the importer sees Failed and can start again.
- A backup written at an older data-format version is converted during import; one written at a newer version than the installation is refused with an explanation naming both versions.
- In the imported project, device, view and stream identifiers and their relationships, revisions, evidence, removed devices, issues, pan/tilt/zoom positions, limits and home marks, closets and port schedules, and package files are the same as in the source, and a retained package downloads byte for byte.
- In the imported project the actors' names show as recorded and are linked to no account, approval assignments made to accounts arrive unassigned, and no reviewer link from the source works.
- Replacing a live project from a portable backup is offered only to an administrator and uses the flow of story 8.2 with the uploaded file as its source: a separate copy, the same listed checks, a backup of the working project, a deliberate "Make this copy current", that project's reviewer links cancelled, nobody signed out, and saves from pages open before the switch refused as "not saved: project was restored".
- A replacement is refused before the copy is built when the backup's project identity differs from the live project's, with the advice to import it as a new project.
- A PDF or CSV export is never offered or accepted as a backup: choosing one at import is refused with the reason.
- Creating, downloading, importing and replacing each appear in the activity log.
- Experiment R5: a 10 GiB portable backup of an 8 GiB project is built, validated and restored on Cloudflare and on a self-hosted server, three times each, with creation timed against 10 minutes and validation and restoration against 15 minutes, transfer times recorded separately.
- A portable backup made on a self-hosted installation imports on a Cloudflare test installation of the same version, and one made on Cloudflare imports self-hosted, each passing the checks above.

Notes: The newer-version refusal relies on the data-format version recorded since story 1.1. R5's fallback, if one ZIP cannot be built in alarm-driven steps, is numbered parts with a manifest (architecture section 12); the decision is recorded with the result. The R5 project is the 8 GiB project of story 8.2.

### Story 8.5: Limits and usage

As a designer (an Editor), I want to see how much of each limit a project uses and be warned before I exceed one, so that a large job fails safely and never damages saved work.

Covers: acceptance table for files and project content; FR-70 (limits shown). Screens: S-33, S-31.

- The server refuses, with the limit named, a source site-plan PDF over 100 MiB, a source image or photo over 25 MiB, and a CSV or .xlsx inventory over 10 MiB, whatever the browser sent.
- A package volume is closed at 250 pages or 100 MiB, an edition over 1 GiB across its volumes and manifest is refused, and a project's retained content cannot exceed 8 GiB (1 GiB = 1024 MiB).
- The 8 GiB count includes originals, previews, distinct older files, records and history, and retained editions; it excludes backups and unfinished uploads that are later discarded.
- Editors and Viewers see the project's current usage against the 8 GiB budget on Records.
- The Projects table in Administration (S-31) shows each project's stored size, and Settings shows each storage limit and current usage as read-only values with no control to raise them.
- Before an upload, package generation, inventory import or portable-backup import starts, the server compares its declared size with the remaining budget; if it would exceed a limit, the user sees a warning naming the limit and the amount over, and nothing is sent.
- Space is reserved when an upload or job starts and released when it fails or is abandoned, so that of two uploads started together that would jointly exceed the budget, the later one is refused before sending and the earlier one completes.
- A warning is shown on Records and to administrators on S-31 when a project's usage reaches 90% of the 8 GiB budget.
- Reaching a limit never truncates an export, lowers the quality of a kept original, removes history, or loses saved work: after a refused operation the project's records and files are the same as before it.
- A project at its limit can still be opened, searched, exported, backed up and downloaded as a portable backup.

Notes: Earlier stories apply individual limits where they add each file type (2.6, 4.10, 6.2); this story completes server-side enforcement, the budget count, reservation and the usage displays. The limits are the PRD's initial boundaries and are changed only in code, with validation.

## Epic 9: Install from published instructions and update from the interface

**Outcome.** Anyone can install Site Studio on either host from published instructions, and an administrator can install a new signed release with one action and get the earlier version back if it fails.

**Depends on.** Story 9.1 needs stories 1.2, 2.13 to 2.15 and 8.1. Story 9.2 needs story 2.13. Story 9.3 needs stories 1.1 and 8.1. Story 9.4 needs story 9.2. Stories 9.5 to 9.7 need all of Epic 8 and stories 9.2 to 9.4, because an update takes a backup first and restores it on failure. Nothing later.

### Story 9.1: Published installation instructions

As an organisation's administrator, I want installation instructions I can follow without help, so that I can bring up Site Studio on our own server or our own Cloudflare account.

Covers: FR-66 (instructions), SM-6.

- Instructions for installing are published in the repository for a self-hosted server and for a Cloudflare account.
- They state which servers are supported (a Linux machine with Docker, x64 or arm64, virtual or physical), which kinds of disk are supported and unsupported according to the R12 results of story 2.15, what is not supported (no Docker, Windows Server, Kubernetes), and that Cloudflare needs the Workers Paid plan.
- The self-hosted instructions cover: getting the image and Compose file, HTTPS by the bundled web server or by the operator's own proxy with the trusted-proxy setting, the live and backup folder settings and why the backup folder should be on another disk, the deployment key and keeping a copy outside the server, and where the one-time set-up code appears.
- The Cloudflare instructions cover: deploying from the organisation's own copy of the repository, the two storage buckets the deployment creates, the deployment key, and where the one-time set-up code appears.
- A person who has not seen the project follows the self-hosted instructions on a fresh server and reaches a working sign-in page over HTTPS, completes the set-up step, and sees a plain HTTP request redirected or refused, using nothing but the instructions.
- The same person follows the Cloudflare instructions on a fresh Cloudflare account to the same result.
- Each place where that person got stuck or needed something not written is recorded, the instructions are corrected, and the corrected step is followed again successfully.
- Two installations made from the instructions share no users, projects or files: an account of one cannot sign in to the other, and a file address from one is refused by the other.

Notes: Instructions for updating are not here: story 9.5 adds them for a self-hosted server and story 9.7 for Cloudflare, including one-step deployment. Until story 9.2 publishes a release, the self-hosted instructions use an image built from the repository; story 9.2 changes them to name the published image. The recovery procedure is story 8.3.

### Story 9.2: Signed public releases

As Kevin, I want a release produced the same way every time, so that installations can trust what they install.

Covers: FR-72 (publication), FR-66 (instructions name the release), AD-19.

- Pushing a version tag starts a workflow that runs the test suite, builds the one Worker bundle, builds the Docker image for x64 and arm64 from that bundle and the pinned runtime, runs the self-hosted smoke suite against the image, signs the bundle and the image, and publishes a release with its version number and notes.
- If the tests or the smoke suite fail, nothing is signed or published.
- The image is published to GitHub's container registry under the same version.
- Verifying a published bundle or image against this repository's release workflow succeeds; the same check on a build made any other way, or on a published file altered by one byte, fails.
- Each release states the data-format version it needs, the runtime version it pins, and whether it changes a Durable Object class.
- The installation instructions of story 9.1 name the published image and release, and a fresh self-hosted install from the published image reaches the sign-in page.

Notes: Making the repository public is Kevin's action on GitHub, done when the first release is ready (K15), after a check that nothing private is in the history. Signing is keyless (K14).

### Story 9.3: Data conversions between versions

As an administrator, I want stored data converted safely when a new version needs a different shape, so that an update never leaves projects unreadable or half converted.

Covers: NFR-8, AD-20, experiment R14.

- The server carries every conversion since the first release: a data set written at each earlier data-format version converts directly to the current one, and a test for each earlier version compares the result with expected records.
- The test suite fails if a data-format version has no conversion and conversion test.
- A project's conversion runs inside one transaction: a conversion made to fail part-way leaves that project's records exactly as they were, at their earlier version.
- If the conversion of any project or of the installation's data fails, the server reports the conversion as failed, names the project, and opens no project for normal use.
- A project room whose data is not yet at the server's version refuses every request until its conversion has succeeded.
- With no pending-update marker, the refusal of story 1.1 for data newer than the build still applies, and its explanation names both versions.
- A server that starts and finds a pending-update marker naming a version other than its own serves nothing except the restore of the pre-update backup, whether or not the data format changed, and performs it before opening any project; afterwards the data is at the server's own version.
- The marker is kept in the installation object, records which projects have been restored, and is cleared only when every project and the installation's own data are back. A restore stopped part-way resumes at the next start and ends with the same result.
- If that restore fails, the server keeps serving nothing, says plainly that the return did not complete, and does not report success.
- A test compares the Durable Object classes in the deployment configuration with the two fixed in story 1.1 and fails if a class is added, renamed or removed.
- Experiment R14: the release workflow starts the new image, with its pinned runtime, against a data folder written by the previous release and confirms that it reads and converts correctly; a release that fails this is not published.

Notes: The data-format version and the conversion runner exist since story 1.1 (with an empty list of conversions); standing rule 7 requires each changed record shape from the first published release onward to bring its conversion. In this story the pending-update marker and the newer data are set up by tests; stories 9.5 and 9.7 set the marker in a real update, and stories 9.6 and 9.7 use the restore. The pre-update backup is the "before an update" generation of story 8.1. Before a second release exists, R14 is exercised with a data folder written by an earlier tagged build and a test conversion. R14's fallback is to hold the runtime version and move data by portable backup.

### Story 9.4: Installed version and update check

As an administrator, I want to see which version is installed and whether a newer one exists, so that I can decide when to update.

Covers: FR-72 (version, check). Screens: S-35, S-28.

- Administrators see the installed version, when it was installed and when updates were last checked, on Software (S-35).
- The installation reads the public release list at least once every 24 hours while running, and when an administrator presses Check now.
- The check request carries no project data, no user data and nothing identifying the installation: a test captures the request and finds only the public address and standard headers.
- With a newer release published, administrators see its version and release notes on S-35 and an update-available dot on Administration in the account menu, on every page including the Projects list (S-28).
- A standard user sees no version notice, no dot and no Update control, and a direct call to the software functions is refused.
- A release is offered only if its version is higher than the installed one; an installed version that is newer than, or absent from, the list shows "Up to date" with no offer to install an older release.
- A check that fails or reads a malformed list shows the time and reason of the failure, keeps the result of the last successful check, and raises no update-available dot of its own.
- With the check turned off, nothing contacts the release list, the installed version is still shown, and S-35 reads "Update checks are off".
- Turning the check on or off appears in the activity log.

Notes: The update-available marker was moved here from story 1.6. The Update control itself arrives in story 9.5 (self-hosted) and story 9.7 (Cloudflare), and each adds its manual steps to the "Update checks are off" state of S-35.

### Story 9.5: Update a self-hosted installation from the interface

As an administrator of a self-hosted installation, I want to install a new release with one action, so that updating needs no command line and loses no saved work.

Covers: FR-72, NFR-8, FR-71, AD-21, UX decision D13. Screens: S-35.

- With a newer release available, S-35 shows what the update will do in order, how long users will be interrupted, and Update now; only an administrator can use it, and nothing installs without that action.
- The Compose file gains the updater container, the only part allowed to start and stop containers; the application reaches it over a private connection protected by a shared secret, and it accepts only versions from the configured repository.
- The steps run in this order: verify the image's signature; warn signed-in users; stop accepting changes of every kind; take a complete backup of every project and of the installation's data; install the new version and convert data; check that the sign-in page is served, a project opens and a test save is acknowledged.
- A release with a bad signature is refused before users are warned, nothing is installed, and the refusal is shown and logged.
- If the backup fails, nothing is installed, changes are accepted again, and the failure is shown and logged.
- Signed-in users see a banner two minutes before saving stops ("An update starts in 2 minutes. Your unsaved work will be kept on this page.") and a full-page "Updating" notice while it runs, which clears by itself.
- No save, upload, administrative change or reviewer-link decision is acknowledged between the start of the backup and the new version starting; a test that sends saves throughout finds every acknowledged one present afterwards.
- While changes are stopped, sign-in is not offered: the sign-in page shows the Updating notice, existing sessions stay valid, and no activity-log entry other than the update's own is written.
- The administrator's screen shows the progress list (signature checked, backup taken, new version installed, data converted, checked), each step done, in progress or waiting, with no other control available.
- Only one update runs at a time: while one runs, or while a backup or restore job is running, Update, Back up now and Restore are disabled with the reason, and a second administrator's request is refused by the server.
- A daily backup that falls due during an update does not start until the update has finished.
- After a successful update S-35 shows the new version and a link to its notes, and every project opens with its data intact.
- A page that was open during the update still holds its unsaved edits afterwards and submits them; an edit the new version cannot accept stays listed as not saved with its content readable, and the page then asks the user to reload without reloading by itself.
- An installation two releases behind updates directly to the latest in one update, with its data converted.
- The update, each step and its outcome are recorded in the activity log with the administrator who started it.
- The same steps can be run from a command line on the server and produce the same result and log entries.
- Published instructions for updating a self-hosted installation cover adding the updater container to an existing Compose file, Update now, the command-line equivalent and what users will see; a person follows them on a test server from one published release to the next.

Notes: The pre-update backup is the "before an update" generation of story 8.1. What happens when a step after installation begins fails is story 9.6.

### Story 9.6: When a self-hosted update fails

As an administrator of a self-hosted installation, I want a failed update to put back the earlier version and its data and tell me so, so that a bad release never leaves us without a working system.

Covers: FR-72 (return), NFR-8, FR-71, AD-21, experiment R11. Screens: S-35.

- If installing, converting or the health check fails, the updater restores the pre-update backup and starts the earlier image, and S-35 shows which step failed and a plain statement that the earlier version and its data are running again.
- A conversion failure for any one project counts as a failed step and returns the whole installation; no project is left at the new version.
- After a return, every save acknowledged before the update is present, and changes are accepted again.
- The failed attempt is recorded in the activity log after the return, so that the entry is present in the returned installation.
- A return ends no sessions and cancels no reviewer links: a user signed in before the update continues without signing in again, and a reviewer link issued before it still opens.
- If the return itself fails, S-35 and the sign-in page show a prominent warning that never reads as success, state what condition the installation is in, and show the command-line steps to recover by hand.
- The updater records each step durably before starting it; after the server loses power or the updater is killed at any step, on restart it accepts changes again if installation had not begun, and returns to the earlier version and the backup if it had. The installation is never left refusing changes with no update running.
- The published update instructions describe going back by hand after an update that passed its checks and was found broken later: install the earlier version and restore the pre-update backup from the command line, with the statement that changes made since the update are lost. The procedure is run once on a test server and works.
- Experiment R11 (self-hosted part): an update is broken at each step in turn on a test server (signature, backup, image swap, conversion, each health check, the return, and a forced kill between steps), and the observed outcome of each is recorded and matches the criteria above.

Notes: R11's fallback is to hold back the release of the Update control until every step returns cleanly. The Cloudflare part of R11 is in story 9.7.

### Story 9.7: Update a Cloudflare installation from the interface

As an administrator of a Cloudflare installation, I want Update to start our own deployment of the new release and to come back safely if it fails, so that updating on Cloudflare is as safe as on our own server.

Covers: FR-72, NFR-8, FR-71, AD-21, experiments R10, R11 and R16. Screens: S-35, S-33.

- An administrator stores a GitHub token for the organisation's copy of the repository in Settings; it is kept as the other settings secrets of story 1.10 are, encrypted and showing only its last 4 characters, and saving or replacing it is logged without its value.
- Before anything is stopped, Update checks that the token can start the update workflow in the organisation's copy and that the named release exists in the public release list; if either check fails, the reason is shown, no user is warned and changes continue to be accepted.
- After those checks the control warns signed-in users as in story 9.5, stops accepting changes of every kind, takes the complete backup, sets the pending-update marker, and starts a run of the update workflow through GitHub, naming the release to install.
- If the backup fails or the run cannot be started, nothing is deployed, the marker is cleared, changes are accepted again, and the attempt is shown and logged.
- If no result arrives from the run within 30 minutes of starting it, the installation asks GitHub to cancel the run, clears the marker, accepts changes again, and shows and logs the attempt as "no result".
- The release's signature is verified by the workflow, not by the Worker; with a bad signature the workflow deploys nothing and reports the refusal, and the installation accepts changes again and shows and logs it.
- With a good signature the workflow deploys the release and waits for the health check: the sign-in page is served, a project opens and a test save is acknowledged; on success the marker is cleared and S-35 shows the new version.
- If the health check fails, the workflow redeploys the previous version with Cloudflare's rollback command.
- The earlier version, finding the pending-update marker, serves nothing except the restore of the pre-update backup, which it performs before opening any project; it then accepts changes again and records the failed attempt in the activity log.
- An earlier version that finds newer data and no pending-update marker refuses to start and gives the explanation of story 9.3.
- A return ends no sessions and cancels no reviewer links.
- If the rollback or the restore cannot be completed, the installation shows the warning of story 9.6 with Cloudflare deployment steps to recover by hand, and never reports success.
- No save is acknowledged between the start of the backup and the new version starting, and pages open during the update keep their unsaved edits as in story 9.5.
- Only one update runs at a time, and Update is disabled with the reason while a backup or restore job is running.
- For a release marked as changing a Durable Object class, the control says before starting that an automatic return is not available and shows the manual procedure in place of Update now.
- Without a token, S-35 shows numbered steps to run the workflow by hand, including taking the backup first and the way back; a person follows them on a test Cloudflare account and the update and a return both work.
- Published instructions for updating on Cloudflare cover keeping the organisation's copy of the repository, creating the token with the permission found in R16, storing it in Settings to set up one-step deployment, and the manual steps; a person follows them on a test Cloudflare account from one published release to the next.
- An installation two releases behind updates directly to the latest with its data converted, on a test Cloudflare account.
- Every attempt and its outcome is recorded in the activity log with the administrator who started it.
- Experiment R11 (Cloudflare part): an update is broken at each step on a test Cloudflare account (bad token, missing release, backup, run not started, no result, bad signature, failed health check, failed restore), each observed outcome is recorded, and Cloudflare's rollback command is confirmed to behave as documented.
- Experiment R16: a fine-grained token with only the Actions permission is tried; the narrowest permission that starts the run is recorded and used in the instructions, or the classic `repo` scope is documented if none narrower works.

Notes: Experiment R10 was run on 2026-11-18 and chose the workflow run over a deploy hook, which cannot name a version. AD-21 puts signature verification in the workflow; a Worker is not asked to check a keyless signature. All criteria here are tested on a deployed Cloudflare test installation. Open point for R11 to examine: a run that deploys after the 30-minute limit has passed, when changes are being accepted again and the marker is cleared; if R11 shows GitHub's cancel cannot be relied on, the rule is revisited with Kevin.

## Epic 10: Acceptance

**Outcome.** The proof of concept is measured against the PRD's acceptance profile on Cloudflare, and then on a self-hosted installation. Passing stories 10.2 and 10.3 is enough to accept the proof of concept on Cloudflare; a self-hosted installation is not described as supported until story 10.4 passes.

**Depends on.** Epics 1 to 9 complete. Nothing later.

**Why here.** BMAD asks that every epic deliver user value. This one is a verification milestone and is kept deliberately: the PRD's success measures SM-1 to SM-6 can only be shown by one run across everything built. It has no story for fixing what it finds; a miss goes back to the story that owns the behaviour.

### Story 10.1: Acceptance fixtures and the workload manifest

As Kevin, the product owner, I want the test workload written down and confirmed before anything is measured, so that results cannot be made to pass by changing the fixture afterwards.

Covers: acceptance profile, SM-5, NFR-4 (reference calculations).

- A small functional project of about 50 devices, built for this story, and the larger project produced by the story 2.7 script are loaded on the Cloudflare test installation; the larger one has about 10 buildings, 600 devices including 150 physical cameras, 20 to 30 plans, and about 60 cameras on the busiest plan.
- The fixtures contain what the functional coverage needs: several floors, cameras and other equipment, an obstruction, a targeted zone, routes, costs and capacity, survey evidence, an existing-site survey with unknown details, retained equipment and cable, and a planned replacement recorded as actual work.
- A written manifest records, for each fixture, the plans, boundaries and geometry, zones, physical cameras against analytical views and configured streams, connections, evidence and history volumes, stored size, and the hardware, browsers and network conditions of the test.
- The manifest declares the parser, decoded-image and page-complexity guards and the temporary space the jobs use.
- Independent reference values are produced outside the application's code, by hand or by a separate script, for a stated set of optical, field-of-view and DORI cases and zone qualifying-area cases, and for counts, units, rounding and allowance arithmetic in the schedules and estimate; the cases, the method and the values are recorded.
- Kevin confirms in writing that the larger fixture is representative, and the manifest is fixed at that point, before any benchmark is run; a later change to the fixture is recorded as a new manifest version and the affected runs are repeated.

Notes: The generator script is delivered by story 2.7 so that earlier stories measure against the same project; this story adds the manifest, the confirmation and the reference calculations.

### Story 10.2: Measure performance and accuracy on Cloudflare

As Kevin, the product owner, I want every timed target and accuracy tolerance measured at full size on Cloudflare, so that acceptance rests on recorded results.

Covers: NFR-4, SM-5.

- Each timed operation in the PRD's performance table is run on the Cloudflare installation against the larger fixture in batches of 20, with at least 19 in each batch meeting its target: feedback within 250 ms, search within 1 second, save acknowledgement within 2 seconds, shared update within 5 seconds, project open within 10 seconds, plan switch within 5 seconds, and busiest-plan analysis within 10 seconds.
- All results, conditions and outliers are kept, and every trial is checked to have preserved data, access and calculation integrity.
- The runs are made with one user, and repeated with two users working at once, including two-user editing conflicts on the same item and a review decision made while the other user edits; each conflict keeps the pending input and overwrites neither user's work.
- Optical, field-of-view and DORI results agree with the story 10.1 reference values within 1%, and zone qualifying-area results within 2 percentage points, at sampling no coarser than 1 m.
- A near-target zone result is shown as uncertain or refined, never as a confident Target met, in each reference case chosen for it.
- Counts, units, rounding and allowance arithmetic in the schedules and estimate match the independent reference values of story 10.1 exactly.
- Property-wide schedules, cost and capacity are shown to include all 600 devices, with physical cameras counted separately from views and streams.
- Each long file job is run three times at full size and meets its bound each time: PDF-page preview 30 seconds, photo processing 10 seconds, inventory preview and confirmed import 30 seconds each, a complete retained edition 5 minutes, portable backup creation 10 minutes, portable backup validation and restoration 15 minutes; transfer times are recorded separately.
- The isolated recovery of story 8.3 is run at full size on Cloudflare, with the recovery point no more than 24 hours old and a usable project within 60 minutes, and the elapsed time and preparation are recorded.
- Controls stay usable during import, analysis and export, and incomplete analysis is marked Updating in every run observed.
- Every miss is reported as a miss with its figures, and no fixture is simplified, and no camera or zone omitted, to pass.

### Story 10.3: Walk the journeys on real devices

As Kevin, the product owner, I want the user journeys walked on the real browsers and devices on Cloudflare, so that the proof of concept is accepted on what people can actually do.

Covers: NFR-3, SM-1 to SM-4, FR-66 and FR-72 (Cloudflare parts of their Checks).

- UJ-1 to UJ-5 are completed on the Cloudflare installation, including the solo path with every approval bypassed, with no file exchange used as the way of working together.
- The desktop workflow and the administrator screens are shown on a Windows laptop in Chrome and Edge; the field tasks on a real iPhone and iPad in Safari and an Android phone in Chrome, with hardware, operating system and browser versions and test conditions recorded.
- The field tasks shown are: equipment lookup, current plan against the issued reference, checklist inspection, verifying and placing imported devices, notes, photos and results, save and conflict handling, and permitted review actions; each leaves saved state that is still there after a reload.
- Signing in, two-step verification, accepting an invitation and changing a password are shown on each environment.
- Labels and error messages, keyboard access, visible focus, 200% zoom, touch alternatives to dragging and non-colour status are checked and recorded on both fixtures.
- A change saved on one device appears on another; edits to separate items and evidence additions by two people both remain; a same-item conflict keeps the pending input; guarded undo removes nobody else's work; a failed save is visible with its input still on the page.
- No fixed record changes across a field move, a checklist edit, a retest, a replacement, an archive, a revision restore and a reopening: the earlier package downloads byte for byte and earlier evidence is unchanged.
- Bypass, not installed, Fail, Not tested, Not applicable, closing with outstanding items and reopening each show a distinct, correct status on screen and in the package.
- FR-66 on Cloudflare: following only the published instructions, a fresh Cloudflare account reaches a working sign-in page over HTTPS; a plain HTTP request is redirected or refused; a person without the set-up code cannot complete set-up; set-up names the installation, creates one administrator and cannot be run again; a second installation shares no users, projects or files with the first.
- FR-72 on Cloudflare: an administrator sees a newer published release and its notes while a standard user sees no Update control; Update with one-step deployment installs it with data intact and open pages keep their unsaved edits; users are warned before saving stops and no save is acknowledged between the backup and the new version starting; a release with a bad signature is refused; an update made to fail part-way returns to the earlier version with its data and the failed attempt is in the activity log afterwards; a return made to fail is reported as failed, never as success; an installation two releases behind updates directly; with the check turned off nothing contacts the release list; without one-step deployment the manual steps are displayed and work.
- In UJ-5 the administrator reviews the activity log, filters it by person, exports it, and confirms on the Backups screen that backups are succeeding.

### Story 10.4: Repeat on a self-hosted installation and show both hosts are one product

As Kevin, the product owner, I want the same acceptance run passed on a self-hosted installation and the two hosts shown to be one product, so that self-hosting can be described as supported.

Covers: NFR-7, SM-6, FR-66 and FR-72 (self-hosted parts of their Checks).

- The runs of stories 10.2 and 10.3 are repeated in full on a self-hosted installation of the same version, with its hardware and disk recorded; self-hosting is not described as supported in the repository or the instructions until they pass.
- FR-66 self-hosted: following only the published instructions, a fresh supported server reaches a working sign-in page over HTTPS, a plain HTTP request is redirected or refused, and the set-up step behaves as on Cloudflare.
- FR-72 self-hosted: pressing Update produces a backup, the new version and intact data; a bad signature is refused; an update made to fail part-way leaves the earlier version running with its data and reports it; a return made to fail is reported as failed; the failed attempt is in the activity log after the return.
- On each host, the person who followed the instructions creates an administrator, an Editor and a Viewer and sees role and membership limits enforced: a non-member cannot open the project, and a Viewer's save is refused by the server.
- On each host an update to a newer published release is installed from the interface with data intact (on Cloudflare with one-step deployment set up), and a deliberately broken update returns to the earlier version.
- A project backed up on each host is restored on the other and passes the checks of story 8.4.
- The same feature list and the same refusals are observed on both hosts; each difference that hosting makes unavoidable, such as how an update is triggered, is stated in the interface and in the instructions.
- On each host an administrator reviews the activity log and confirms that backups are succeeding.

Notes: SM-6 needs both hosts and is complete only when this story passes.

## Order and validation

**Order, confirmed by Kevin on 2026-11-18.**

- Accounts and sign-in come first (Epic 1), then the shared project (Epic 2).
- The self-hosted image is built at the end of Epic 2, not in Epic 9.
- Extended modelling (Epic 7) stays after existing sites and return visits.

**Checks run on draft 0.6.**

| Check | Result |
| --- | --- |
| Every FR, NFR and SM appears in at least one story | Pass, by script: FR-1 to FR-72, NFR-1 to NFR-8, SM-1 to SM-6. This shows each is named, not that each Check is fully met; the independent review found parts of requirements missing in draft 0.5, and draft 0.6 adds them. |
| Every architecture decision and experiment is cited | Pass, by script: AD-1 to AD-14, AD-16 to AD-21, R1 to R16. |
| Every story has a user-story sentence, a Covers line and criteria | Pass, by script. |
| Criteria testable with earlier stories only | Revised in draft 0.6 after the review found about a dozen that were not. A script confirms that no criterion names a later story; it cannot confirm that no criterion silently needs one. A second independent read is the remaining check. |
| Starter template | Not applicable. The architecture names none; story 1.1 sets up the project around the existing prototype. |
| Records created only when needed | Pass, with one stated exception: story 1.1 creates both Durable Object classes, because the architecture fixes the classes from the first release. |
| Story size | Not settled. Stories 2.6, 2.8, 3.1, 4.10, 5.12, 6.6, 6.8, 6.12 and 7.5 are large after this revision; each is a candidate for splitting, which would renumber stories and is left for Kevin to decide. |
| Epics deliver user value | Pass for Epics 1 to 9. Epic 10 is a verification milestone, kept deliberately; its intro says why. |
| Repeated changes to the same files across epics | Considered. Epics 4 to 7 all extend the device record and the plan workspace. They are kept separate because each ends in a different demonstrable outcome and field feedback from Epic 5 can change Epics 6 and 7. |

## Requirement coverage

Generated from each story's "Covers" line. Where a requirement is split, the first story listed delivers its base and the later ones complete it.

| Requirement | Stories |
| --- | --- |
| FR-1 | 2.5, 4.1 |
| FR-2 | 2.1, 2.3, 3.1, 5.2 |
| FR-3 | 2.6 |
| FR-4 | 2.6 |
| FR-5 | 2.6, 2.11 |
| FR-6 | 2.6 |
| FR-7 | 2.7, 4.2 |
| FR-8 | 2.7, 3.5, 6.4, 6.8 |
| FR-9 | 2.9, 7.6 |
| FR-10 | 2.8 |
| FR-11 | 2.8 |
| FR-12 | 2.8 |
| FR-13 | 2.8 |
| FR-14 | 2.8 |
| FR-15 | 2.8 |
| FR-16 | 2.8 |
| FR-17 | 4.4 |
| FR-18 | 4.4 |
| FR-19 | 4.5, 7.1, 7.5 |
| FR-20 | 2.10, 5.5 |
| FR-21 | 2.2, 2.4, 2.11, 3.1, 5.13 |
| FR-22 | 2.12, 4.1, 4.4 |
| FR-23 | 4.6, 5.12 |
| FR-24 | 4.6, 4.7, 5.12 |
| FR-25 | 4.6, 4.8, 5.12 |
| FR-26 | 4.8, 5.2, 5.3 |
| FR-27 | 5.3 |
| FR-28 | 5.6 |
| FR-29 | 5.4, 7.2 |
| FR-30 | 5.3, 5.5, 5.7 |
| FR-31 | 5.5, 5.7 |
| FR-32 | 5.12 |
| FR-33 | 4.10, 5.4, 5.9, 5.12, 6.6, 6.8, 6.12, 7.7 |
| FR-34 | 4.1, 4.10, 8.1, 8.2, 8.3, 8.4 |
| FR-35 | 6.8 |
| FR-36 | 6.9 |
| FR-37 | 6.11 |
| FR-38 | 6.10 |
| FR-39 | 6.1 |
| FR-40 | 6.6 |
| FR-41 | 2.7, 5.2, 6.6 |
| FR-42 | 2.4, 5.4, 5.12, 5.13, 6.8, 6.11 |
| FR-43 | 5.8 |
| FR-44 | 5.6 |
| FR-45 | 2.1, 2.10, 6.7, 6.10 |
| FR-46 | 5.9, 6.10 |
| FR-47 | 4.3, 5.6 |
| FR-48 | 7.1 |
| FR-49 | 7.3 |
| FR-50 | 7.4 |
| FR-51 | 7.5, 8.4 |
| FR-52 | 7.6 |
| FR-53 | 6.8, 6.9, 7.5 |
| FR-54 | 6.9 |
| FR-55 | 2.11, 4.8, 4.9, 5.3, 5.6, 5.9, 7.5 |
| FR-56 | 6.4 |
| FR-57 | 6.4 |
| FR-58 | 6.3, 6.8 |
| FR-59 | 6.5 |
| FR-60 | 2.5, 4.1, 6.8, 7.6 |
| FR-61 | 4.8, 4.10, 5.1, 5.2 |
| FR-62 | 6.2, 6.3 |
| FR-63 | 7.2, 8.4 |
| FR-64 | 5.10, 5.11, 5.12 |
| FR-65 | 6.12 |
| FR-66 | 1.2, 2.13, 2.14, 2.15, 9.1, 9.2, 10.3, 10.4 |
| FR-67 | 1.3, 1.4, 1.5, 1.8, 1.10 |
| FR-68 | 1.6, 1.7, 1.8, 1.10, 2.1, 2.2, 3.5, 5.9, 6.8, 6.11, 8.4 |
| FR-69 | 1.7, 2.1, 2.3, 4.6, 4.7, 4.10 |
| FR-70 | 1.8, 1.10, 2.6, 2.13, 4.7, 8.1, 8.2, 8.5 |
| FR-71 | 1.9, 1.10, 4.7, 8.1, 9.5, 9.6, 9.7 |
| FR-72 | 9.2, 9.4, 9.5, 9.6, 9.7, 10.3, 10.4 |
| NFR-1 Record integrity | 4.1, 6.8, 6.9, 8.2, 8.4 |
| NFR-2 Shared-save clarity | 2.2, 2.14, 2.15, 5.5, 5.13 |
| NFR-3 Browser, field and accessibility | 3.2, 3.3, 5.1, 5.5, 5.13, 10.3 |
| NFR-4 Honest analysis and responsiveness | 2.7, 2.8, 10.1, 10.2 |
| NFR-5 Access boundary | 1.3, 1.7, 4.7, 8.3 |
| NFR-6 Consistent deliverables | 3.5, 4.10, 5.12 |
| NFR-7 Same product on either host | 2.13, 2.14, 2.15, 8.4, 10.4 |
| NFR-8 Safe updates | 9.3, 9.5, 9.6, 9.7 |
| SM-1 | 10.3 |
| SM-2 | 10.3 |
| SM-3 | 10.3 |
| SM-4 | 10.3 |
| SM-5 | 2.7, 10.1, 10.2 |
| SM-6 | 9.1, 10.4 |

| Experiment | Status | Story |
| --- | --- | --- |
| R1 | Done; see the experiments record | 4.10 |
| R2 | Done; see the experiments record | 2.8 |
| R3 | To run | 8.2 |
| R4 | To run | 5.5 |
| R5 | To run | 8.4 |
| R6 | Done; see the experiments record | 4.10 |
| R7 | Done; see the experiments record | 1.1 |
| R8 | Done; see the experiments record | 1.1 |
| R9 | To run | 1.3 |
| R10 | Done; see the experiments record | 9.7 |
| R11 | To run | 9.6, 9.7 |
| R12 | To run | 2.15 |
| R13 | To run | 1.10 |
| R14 | To run | 9.3 |
| R15 | To run | 4.10 |
| R16 | To run | 9.7 |

## Choices made in draft 0.6

The review found criteria that could not be tested because no document gave a value or a rule. Draft 0.6 fills each with a conventional default so that the story can be built and checked. There are 218. They are proposals: Kevin has not confirmed them, and changing one changes only the criterion that states it.

| Story | Choice made | Why |
| --- | --- | --- |
| Format: `story | choice made | why` |
| 1.1 | An object whose recorded data-format version is newer than the build's refuses requests with an explanation | AD-20 conversions are forward-only; this is the base behaviour that story 9.3 extends with the pending-update recovery rule |
| 1.1 | "Dependency versions are pinned" is tested by a clean install from the lock file in continuous integration | Gives the R7 install problem an observable check |
| 1.2 | On Cloudflare the deploy command generates the set-up code (random, at least 20 characters), supplies it as a secret and prints it once in the deployment output | Architecture says only "shown in the server output or the deployment output"; a Worker has no server output visible at deploy time |
| 1.2 | Wrong set-up codes: after 5, attempts from any address are refused for 1 minute, doubling to a 15-minute maximum | Same pattern as sign-in; a fresh install is exposed to guessing (review edge case 4) |
| 1.2 | Installation name is 1 to 80 characters | Needs a bound; fits a sign-in page heading |
| 1.3 | Invitation lasts 7 days by default | Conventional; long enough to pass a link on by hand |
| 1.2 | Password (all accounts, stated in 1.2 and reused by 1.3 and 1.5): 12 to 128 characters, must not equal the email, no composition rules | Follows current published guidance (length over composition); architecture section 15 left it open |
| 1.3 | Sign-in slowing: 5 failures in a row per email, or 20 per network address in 15 minutes, then a 1-minute wait doubling to 15 minutes; the same wait for unknown emails | AD-12 says "slowed per account and per address"; UX S-26 says the page states how long to wait; the same wait avoids revealing which emails exist |
| 1.3 | PBKDF2-SHA256 at 600,000 iterations | The count measured in experiment R8 and named in AD-12 |
| 1.3 | R9 passes if the hash is accepted without a platform error and median sign-in is under 1 second over 20 sign-ins | R9 needed a pass condition; R8 measured about 75 ms, so 1 second leaves a wide margin |
| 1.3 | Session cookie is SameSite=Lax | AD-12 says "only to this site"; Lax lets a person arriving from an emailed link stay signed in, and change requests are separately checked for origin and header |
| 1.3 | Inviting an email with an existing account is refused with that account's state; re-inviting a pending email replaces the earlier link | One account per email, one live invitation (review edge case 5) |
| 1.3 | A minimal account menu (name, Sign out) is added to the existing prototype header in this story; My account, Projects and Administration join it in 1.5, 1.6 and 1.8 | Sign-out and later entry points need a place before the project frame of story 3.1 |
| 1.4 | 10 recovery codes | Conventional number |
| 1.4 | Codes are 6 digits on a 30-second step; one step either side is accepted; an accepted code cannot be reused | Standard authenticator-app behaviour and clock tolerance |
| 1.4 | Wrong second-step and recovery codes share the limit and wait of wrong passwords | Stops a six-digit code being guessed once the password is known (review edge case 8) |
| 1.4 | A fresh set of recovery codes needs the password and a current code | Review edge case 9; conventional |
| 1.4 | The authenticator secret is stored encrypted with a deployment key that the deploy command generates and supplies as a secret | AD-17 states this for settings secrets only; the same protection is applied to two-step secrets, as review edge case 60 assumes |
| 1.5 | Session ends after 24 hours without use by default | Conservative for accounts that can change project records; a technician signs in once a working day; the administrator can lengthen it in 1.10 |
| 1.5 | Every request that passes sign-in counts as use of the session | So a long upload is not ended by the idle period (review edge case 14) |
| 1.5 | Sessions list shows device, time of last use and network address, with a country or city only where the host supplies one | UX asks for "place of last use"; a self-hosted server has no location source |
| 1.5 | Pending input is kept only for the same account; if another account signs in on that page it is shown but not sent | Prevents one person's input being saved under another's name (review edge case 12) |
| 1.6 | Project name is 1 to 120 characters; duplicate names are allowed | Needs a bound; properties can share names |
| 1.6 | The administrator who sees exactly one project in the installation is also sent straight to it, with the list reachable from the account menu | UX D11 says "a user with exactly one project" without excluding administrators |
| 1.6 | Until story 2.1 a project's address loads the existing prototype app with browser-only data | Something must be at the address before the shared project exists |
| 1.7 | "Last administrator" counts only active accounts that have accepted their invitation, and the check and change happen in one write | Review edge cases 2 and 3 |
| 1.7 | Membership is set through administrator-only server functions in this story; the screens come in 1.8 | Keeps the gate testable before the administration screens exist |
| 1.8 | Administrator-issued reset link expires after 24 hours | Passed on by hand, so longer than an emailed link, but short |
| 1.8 | A password reset ends all the account's sessions and never turns two-step verification off | AD-12 ends sessions on password change; review edge case 11 |
| 1.8 | Deactivation cancels the account's unused invitation and reset links; a link opened for a deactivated account is refused | Review edge case 7 |
| 1.8 | After an administrator resets two-step verification, old recovery codes stop working and the user is offered set-up again | A reset should leave nothing of the old set-up usable |
| 1.8 | Recovery when the only administrator cannot sign in: a documented command run by whoever controls the host prints a one-time code, valid 1 hour, that lets a named administrator account set a new password and resets its two-step verification; logged | Review edge case 1; not in the PRD, so Kevin should confirm this explicitly. Same trust basis as the set-up code (control of the host) |
| 1.8 | The Projects table in this story shows name, members and creation date only | State, last activity, stored size and latest backup cannot be tested until stories 2.1, 6.11, 8.1 and 8.5 |
| 1.9 | Export is a CSV file of the filtered log | FR-71 says "export" without a format; CSV matches the estimate export |
| 1.9 | A failed sign-in entry records the email entered and the network address, whether or not an account exists | Needed to investigate guessing; FR-71 forbids only passwords, tokens and codes |
| 1.10 | Session period accepts 15 minutes to 30 days; invitation life accepts 1 to 30 days | Review edge case 16 asks for bounds |
| 1.10 | A changed session period applies to existing sessions on their next request; a changed invitation life applies to invitations issued afterwards | FR-70 Check: "changes the session period and sees it take effect" |
| 1.10 | Emailed reset link expires after 1 hour; at most 3 reset messages per account per hour; same reply for every email | Conventional; review edge case 17 |
| 1.10 | A saved secret shows only its last 4 characters | UX S-33 says "only its last characters" |
| 1.10 | The activity log records settings changes with earlier and new value, but a secret only as "changed" | FR-71: no secret in the log |
| 1.10 | SMTP is offered only if R13 passes on both hosts; the self-hosted run uses the self-hosted configuration from story 1.1 | The self-hosted image does not exist until story 2.13 |
| 1.10 | Turning off "standard users may create projects" leaves existing projects and their members unchanged | Edge of FR-68 |
| 1.10 | Settings state beside the Google mapping key that it is visible in signed-in users' browsers; other secrets are never shown in full | Story 2.6 delivers the key to browsers, which a Maps key requires (review finding 12) |
| 2.1 | First scope name is required and at most 80 characters | The authorities give no length; a bound is needed for the frame chip and lists |
| 2.2 | The 2-second save acknowledgement is first measured on the locally run server (19 of 20 trials), then again on the fixture in 2.7 | The fixture does not exist before 2.7; the 19-of-20 rule is the PRD's |
| 2.2 | Unsaved edits are retried automatically on reconnection; leaving the page with unsaved items shows the browser's leave warning | FR-21 says pending input is kept "while the page stays open"; the warning protects that |
| 2.2 | Plan images stay in browser storage until 2.6 | Avoids saving large images through the small-operation route before the file store is used |
| 2.3 | A hidden tab does not poll | AD-6 says polling runs "while the page is visible" |
| 2.4 | An operation on several items is all-or-nothing when one item conflicts | AD-2 and AD-5: "apply every change or none" |
| 2.5 | A floor is "unused" only if it holds no device, route, obstruction, zone or note (later: plan, survey entry, revision reference, removed device, riser) | FR-60 says eligibility comes from content, not an empty visible plan |
| 2.5 | The last floor and the last building of a project cannot be deleted | Conservative; a project with no floor has nowhere to work and the PRD does not describe one |
| 2.6 | Supported plan types are PDF, PNG, JPEG and WebP | What the prototype accepts today |
| 2.6 | Limits are 100 MiB per PDF and 25 MiB per image | PRD file acceptance table (the prototype's 50 MB PDF limit is replaced) |
| 2.6 | An unfinished upload is discarded after 7 days | Matches R2's behaviour found in experiment R6, so both hosts agree |
| 2.6 | A completed file that no record references is removed by a daily clean-up once 24 hours old | Review edge case 20; 24 hours leaves time for a retry of the referencing save |
| 2.6 | Google mapping key is delivered to signed-in users only, to all projects, and Settings says it is browser-visible | Review finding 12; a Maps JavaScript key must reach the browser |
| 2.7 | An Editor can set Proposed or Existing by hand, as the prototype's status field does; Removed cannot be chosen | Keeps the prototype's ability to record existing equipment until 6.1; removal is 6.8 |
| 2.7 | A device once saved as Existing keeps a "recorded as existing" mark | FR-55 judges Delete draft from origin and history, not the current flag |
| 2.7 | Basis rule before Epic 6: Current installation = Existing devices; Proposed design = Existing and Proposed | PRD state model, without planned actions, which arrive in 6.6 |
| 2.7 | Fixture: 10 buildings, 25 plans, 600 devices, 150 cameras, 60 on the busiest plan, 20 targeted zones there, fixed seed, loaded through the server's own operations | PRD acceptance profile; 20 zones is the R2 experiment's workload |
| 2.7 | All timing targets of the PRD table except analysis are measured here on the locally run server, 19 of 20 trials | Review finding 10; they cannot sit in 2.1, 2.2 or 2.5 because the fixture arrives in 2.7 |
| 2.8 | Target met needs the lower bound (edge cells counted as not qualifying) to reach the target; Shortfall needs the upper bound to miss it; otherwise refine once at half spacing, then show Uncertain near target with both figures | FR-15 and the addendum require "refine or flag"; bounding by edge cells is the conservative conventional method |
| 2.8 | Not demonstrated is shown when the target is not met and a camera in range of the zone was left out of the calculation | FR-15; the only unassessed views before story 7.1 are cameras excluded for plane, settings or disabled state |
| 2.8 | Time allowance for one calculation is 10 seconds | The PRD's target for the busiest plan |
| 2.8 | All cameras excluded gives Not assessed, not 100% unseen | FR-13 Check |
| 2.9 | A route with an unassigned end stays in cable totals and is listed for review | FR-55: keep cable records and mark unassigned ends; nothing silently dropped |
| 2.10 | Photo types JPEG, PNG and WebP; 25 MiB limit | Prototype's accepted types; PRD limit |
| 2.11 | Undo and redo cover the last 40 edits made in the open page; reload or sign-out clears them | 40 is the prototype's limit; FR-55 says no cross-session undo is required |
| 2.11 | A new edit after an undo clears the redo list | Conventional |
| 2.11 | Delete draft with no confirmation only for a proposed device with no survey entry, no route and never recorded as Existing; with routes, a preview and confirmation | FR-55: isolated draft immediate; connected draft previews |
| 2.11 | In the preview a route may be deleted with the device only if selected, has no survey entry and has no other assigned end | FR-55 "dedicated disposable draft cable only when explicitly selected and independently eligible" |
| 2.11 | A floor whose only devices are deleted drafts counts as unused; undo of the draft deletion is then refused | FR-55 "do not recreate deleted floors" |
| 2.12 | Prototype project file limit 100 MiB | The prototype's own limit for these files |
| 2.12 | Until 4.1 and 4.4, costs and named revisions in the file are listed as "not imported" | Cross-epic move; keeps "nothing dropped silently" true meanwhile |
| 2.12 | Imported notes carry "from the prototype file" and the import date, with no author | The old file holds no author; FR-69 forbids inventing one |
| 2.12 | Importing the same file twice makes two projects | No identity in the old file is trusted for de-duplication |
| 2.13 | Bundled web server gets and renews its certificate automatically for the host name, or uses operator-supplied certificate files | Architecture leaves the certificate method open; these two cover public and private servers |
| 2.13 | Plain HTTP is redirected by the bundled web server and refused by the application itself | FR-66 Check allows either; refusing at the application protects operators' own proxies |
| 2.13 | Trusted-proxy list defaults to the bundled web server only; forwarded headers from other addresses are ignored; application port not published by default | Conservative default so headers cannot be forged |
| 2.13 | Smoke suite in 2.13 excludes file cases; 2.14 adds them | Dependency rule: the disk file store is 2.14 |
| 2.14 | Backup location is a separate Compose setting with no default; server refuses to start if it is the same folder as the live files or is left unset (8.1 adds the same-disk warning) | Review finding 25: backups must not land in the live folder |
| 2.14 | A stored file whose size or hash no longer matches is reported as damaged on request | AD-16 gives the disk store a stored hash and size; this is their use |
| 2.15 | 50 forced kills | Experiment R8 used 45; rounded up |
| 2.15 | At least 20 power cuts on the virtual-machine disk; network disk tested on NFS | R12 names the disks but no count; 20 matches the PRD's trial size |
| 2.15 | A second container on a volume in use refuses to start | R12 covers "durability and locking"; conservative handling |
| 2.15 | Storage-full notice is shown to administrators in Administration | Review edge case 23; Administration is the only administrator surface that exists by Epic 2 |
| 3.1 | Before Epic 5 the Installation view exists as a switch that only sets the default basis | UX 5.3; recording tools do not exist yet |
| 3.1 | Materials and Capacity dialogs become the Costs and capacity page, Revisions and Review the Records page; Equipment is left to 3.5 | Review finding 28: one owner per conversion |
| 3.2 | A development-only status reference page is the place of test for values no feature uses yet | Makes "one component renders each family" observable |
| 3.3 | Phone-width form fields are 16 px, tested at 390 px | UX section 10 and audit finding A6, which the story's Covers line already listed |
| 3.4 | The analysis strip is checked at 1440 × 900 and 1280 × 720 | 1440 × 900 is the audit size; 1280 × 720 is a common smaller laptop size |
| 3.5 | Deleted drafts are not listed under Historical | PRD FR-8 and FR-55 (no recycle-bin view) over UX section 6, which lists "Deleted draft" there; Kevin to confirm |
| 3.5 | Schedule CSV holds the rows and columns shown and names project, basis and export time | Review finding 21 and NFR-6 |
| 2.7 | The fixture script also makes the small functional project and can add plan files up to 8 GiB | Asked for by Epics 8 to 10 so that backup and limit tests have full-size data |
| 2.13 | Self-hosted deployment key is generated on first start into a key file in its own Compose-set folder, apart from records and files | Epic 1 encrypts with a deployment key; 8.3 keeps it outside backups; generating it avoids a weak operator-chosen key |
| 2.13 | Self-hosted administrator recovery is a command run on the server, with the same one-time code rules as 1.8 (once, 1 hour) | Mirrors Epic 1's Cloudflare command; the command itself is a review safeguard not in the PRD, for Kevin to confirm |
| 2.13 | "Two installations share no files" is shown in 2.14, users and projects in 2.13 | The disk file store does not exist until 2.14 |
| 4.1 | A second revision with a name already used in the same scope is refused | "Named" revisions are told apart by name in the timeline, the issue step and packages; the PRD does not say whether names may repeat |
| 4.1 | Saving a revision is refused while the saving user has Unsaved or Conflict items, instead of saving without them | FR-22 says the user's pending edits are resolved first; refusing is the conservative reading and never yields a snapshot that silently omits edits |
| 4.1 | Restore can be undone only by the person who restored, in the same session, and only if no restored item has changed since | Follows the undo rule in AD-7; the PRD says only that a restore "remains reversible" |
| 4.1 | A floor contained in any saved revision cannot be deleted | FR-60 lists "retained revision context" as a block on deletion; the consequence is that a floor becomes permanent once a revision is saved |
| 4.1 | Revisions in an imported prototype file become revisions of the project's first scope and can be opened and compared; whether they can also be restored is not promised | The old file's revisions hold less than the new snapshot; opening and comparing is the least that keeps them |
| 4.3 | A camera whose template was edited shows that the template has changed and takes new values only when an Editor applies them | FR-47 forbids silent change and mentions "explicitly applying changed values"; this is the smallest control that does both |
| 4.3 | A missing optical value makes the dependent result "not assessed" with the input named; no generic value is used | FR-47: incomplete templates must not silently become generic specifications |
| 4.5 | A camera with no bitrate makes the storage and bandwidth totals read Incomplete with a count | Same wording as the estimate's unpriced lines (UX 7.11); FR-19 says missing data is never zero |
| 4.6 | The two decisions an account can record are Approve and Request changes | Same pair the UX gives the reviewer view (S-24); FR-24 says "approval/change decisions" |
| 4.6 | A Viewer whose assignment was reassigned while their page was open is refused; an Editor's or administrator's decision after a bypass is kept and labelled "after the bypass" | A former assignee Viewer no longer has the right to decide; Editors always may, so their late decision is kept but marked |
| 4.7 | Several decisions per link: each submission is a new entry, earlier ones stay, the latest is shown as current | FR-24: "later decisions do not erase prior ones"; lets a client approve after requesting changes without a new link |
| 4.7 | Reviewer name is required, at most 80 characters | Prevents an anonymous decision; 80 is a conventional display-name limit |
| 4.7 | A reviewer link expires 30 days after creation, fixed (no setting); an Editor replaces it to extend | The PRD sets no expiry; an unauthenticated link that never expires is the riskier default. Kevin may prefer no expiry or a different period |
| 4.7 | A link becomes read-only (no new comments or decisions) when its assignment is reassigned or bypassed, and when its revision is superseded (4.8) | Stops an unverified person writing into a record that has moved on, while keeping what they can read; the PRD is silent |
| 4.7 | Comment limit 2,000 characters; 200 comments per link | Bounds what an unauthenticated link can write; values are conventional |
| 4.7 | Invalid link tokens are slowed with story 1.3's per-address figures: 20 from one network address in 15 minutes, then refused for 1 minute, doubling to 15 minutes | Round 2 asks for Epic 1's values so sign-in and reviewer links behave alike |
| 4.7 | The message for a revoked or replaced link is "This link is no longer valid"; for an expired one, "This link has expired" | Plain wording; no source text exists |
| 4.8 | A superseded revision can be designated current again; history shows both designations | FR-61 lets an Editor "deliberately designate a different issue"; refusing would force a duplicate revision |
| 4.8 | A revision can be issued while a requested review is still awaiting a decision | FR-25 and FR-61: approval is optional and never a gate |
| 4.8 | A decision by an account on a superseded revision is kept and labelled "after it was superseded" | FR-24 keeps every decision; the label prevents it reading as approval of the current reference |
| 4.9 | A cancellation or correction made by mistake can be reversed with a reason; both entries stay in history | The PRD gives a reversal only for a mistaken Installed mark; without one a wrongly cancelled device is unrecoverable. This is new behaviour for Kevin to confirm |
| 4.9 | The reason is required for cancellation, correction and their reversal | FR-55 says "with a short reason"; taken as mandatory |
| 4.10 | The label for a package without a required photo is "Evidence-limited summary" | Wording taken from FR-33 |
| 4.10 | An edition over 1 GiB fails before anything is stored and offers a smaller floor selection or fewer optional contents | Addendum limits table and "stop/report failure if the full edition cannot fit" |
| 4.10 | An upload in progress counts as session use | Same rule and wording as story 2.6; story 1.5 says every request counts as use |
| 4.10 | The 5-minute target for a complete edition is measured on generation only, on the 2.7 fixture, in this story; the three repeated runs stay in 10.2 | PRD target "Complete retained design/closeout edition within 5 minutes" with transfers recorded separately |
| 4.10 | Parts stored for an edition that is abandoned are discarded and never count toward usage | Review edge cases 20 and 35; consistent with R2's own 7-day abort of unfinished uploads |
| 5.1 | The field-shell or desktop choice on a tablet or laptop is remembered in that browser | D3 says the switch is offered, not forced; remembering it avoids asking each visit. No pixel rule is added. |
| 5.1 | The issued design chip shows the revision's name as well as identifier, issue date and work scope | FR-61 and UX 8.1 both list the name; Kevin's wording listed identifier, issue date and scope. |
| 5.2 | A device added after issuing reads "Not in the issued design" in Compare with issued | The PRD is silent; showing blank issued values would look like a requirement. |
| 5.3 | Configured does not require Installed; a neutral notice is shown and nothing is blocked | UX principle "warn, do not block"; the state model keeps the two marks separate. |
| 5.3 | A second person setting an already-set mark creates no second entry; the first name and time stay | The mark is one fact per device; avoids duplicate history. |
| 5.3 | A Configured mark can be cleared with a required reason | The PRD defines reversal only for Installed; the same rule is the conventional match. |
| 5.3 | With nothing issued, the first Installed or Configured mark in a scope prompts to issue the current working design first (bypass offered); cancelling leaves the mark unset; notes and photos are not held back | FR-26 requires a fixed issued design "when installation starts, even if separate handoff or approval is skipped". This blocks one action, so Kevin should confirm it over a warn-and-proceed alternative. |
| 5.4 | Saving a revision records the checklist definitions in force in its snapshot (a 5.4 criterion); the Design package uses those and restore never writes them back | 4.10 generates only from a saved revision; live definitions would make an edition unrepeatable. |
| 5.5 | A measured value must be a number in the unit the check defines; outside a defined tolerance, Pass is not offered | FR-30: a result not meeting its expectation is Fail. |
| 5.5 | An attempt entered against a definition that changed after the page loaded is returned for review, not recorded | FR-44 requires the criteria actually tested to be recorded with each attempt. |
| 5.5 | A corrected attempt stays visible, marked corrected, and is no longer counted | FR-31 "corrections preserve protected prior evidence". |
| 5.5 | A Pass whose required photo is not yet Saved reads "Pass pending evidence" and is not counted | FR-30: Pass requires any required evidence; NFR-2 forbids showing an incomplete upload as saved. |
| 5.5 | Experiment R4 conditions: a 25 MiB photo (the PRD's photo limit), upload throttled to 400 kbit/s, two forced drops | The architecture names no profile; 400 kbit/s is a common "slow mobile" setting and 25 MiB is the worst allowed case. |
| 5.6 | Removing a passed check's expected result shows Needs definition and stops counting the pass; changing it flags Retest required | FR-31 Check and FR-44: old attempts are never rewritten, new requirement is Not tested until performed. |
| 5.9 | Attention count on the project list = open issues plus checks flagged Needs review, Retest required or Needs definition in the active scope | Follows the state model's "attention indicators"; unfinished work is left out so every active project does not show a large number. |
| 5.9 | A resolved or deferred issue can be reopened with a reason | The PRD is silent; without it a wrongly resolved defect cannot be put right. |
| 5.10 | Run start and end times may be backdated but not set in the future; end must follow start | A person records them, often after the fact; future times cannot be observations. |
| 5.10 | One open run per stage; a second start is refused | Prevents overlapping runs being judged as one. |
| 5.10 | An end recorded before the planned duration has elapsed is treated as a stop and asks for the reason | FR-64: Pass needs the full planned duration; only stops have reasons. |
| 5.10 | A run is judged on the definition in force at its start; later edits apply to later runs and show a notice on the open run | FR-64 says a later definition change does not rewrite an outcome; the same rule mid-run is the consistent one. |
| 5.10 | A covered device cancelled during a run is treated like a moved one: shown on the run, flags Needs review, run not stopped | FR-64 covers "an actual change to covered equipment"; cancellation is the only other change available by this story. |
| 5.11 | A counted outage counts as full downtime for its whole duration however many covered devices it affected (no weighting) | FR-64's formula uses time down only; what counts is the project's own definition, applied per entry. |
| 5.11 | Availability is shown to two decimal places and compared with the target before rounding | The PRD example (95%) needs no decimals; two is conventional and avoids a rounded value appearing to meet a target it missed. |
| 5.11 | After a run ends, downtime entries change only by logged correction; the recorded outcome is not rewritten, the recalculated availability is shown beside it and the stage is flagged Needs review | FR-44: an old outcome is never changed; a new run is the way to a new outcome. |
| 5.12 | A run still open at closing is stopped with the reason "Scope closed", has no outcome, and is listed as outstanding | FR-64 permits closing with outstanding items while a stage is running; this stops a run staying open inside a fixed record. |
| 5.12 | A stale-tab save into a closed scope is refused and held for review | Same rule the PRD gives for an archived project (FR-42). |
| 5.12 | Final acceptance is recorded on the fixed closeout record after closing, never as a precondition | FR-24 reviews "a fixed closeout revision"; FR-32 says missing approval does not prevent closure. |
| 5.9 | The Design package lists open and deferred issues as they stood when its revision was saved | Addendum "Outstanding work and decisions"; packages come only from a saved revision, so the snapshot records them as it does checklist definitions. |
| 5.12 | Closing a scope makes reviewer links to its design revisions read-only (no new comment or decision); the refusal label for a stale save is "not saved: scope closed" | Matches 6.11's rule and label form for an archived project. |
| 6.2 | An inventory file with more than 5,000 data rows is refused at step 1 | Review edge case 52 asks for a stated row limit; the PRD sets only 10 MiB per file and says 600 devices is not a ceiling. 5,000 is about eight times the acceptance inventory and keeps browser parsing bounded. |
| 6.2 | The 10 MiB inventory file limit is enforced in this story, at step 1 | The limit is in the PRD's acceptance table; story 8.5 comes later, so the import needs its own check to be testable. |
| 6.3 | A row matches by source asset ID only when that ID is unique in the file and in the project | The PRD says "reliably unique stable source asset ID" without defining reliable; uniqueness in both places is the simplest test. |
| 6.3 | Group-level select is offered for New and Unchanged rows without errors only | The UX says group select is for "straightforward rows"; Changed and Needs review rows need a decision each. |
| 6.5 | Only the person who ran a bulk cleanup can undo it | The PRD applies own-session undo (FR-21/55) to cleanup; nothing says another person may undo it. |
| 6.7 | Preselected category: Add new, Relocate, Service, Replace and Remove give Work now; None and Retain give Reference only | The PRD says "preselect planned changes transparently" and forbids Work now for None and Retain; Reference only is the default that adds no checks or cost. |
| 6.7 | A reason is asked for only when a category change moves an item out of Work now | The PRD asks for a reason "for meaningful changes" without defining them; dropping work from the scope is the change that matters. |
| 6.9 | A restored device returns as Existing with condition Unknown | The state model says condition starts as Unknown and restoration does not verify the installation. |
| 6.9 | A restored device's checks are flagged Retest required | The PRD says old tests are not evidence of the restored installation and affected checks are flagged under FR-28/44. |
| 6.9 | A label or asset ID clash on restore must be decided before the restore is confirmed | Review edge case 55; the PRD is silent. |
| 6.10 | Simultaneous reopen by two people creates one scope and takes the second person to it | Review edge case 56; follows the one-active-scope rule. |
| 6.10 | A revision of an earlier scope cannot be designated the current issued design of the new scope | FR-61 designates "for the active work scope"; review edge case 33. |
| 6.11 | Archiving is refused while a scope is In progress, or while an inventory import or package upload is running | FR-37 says "archive an inactive property project", and FR-65 assumes an archived project has no active scope. Review edge cases 46 and 57. Kevin may prefer to allow archiving with an open scope after a warning. |
| 6.11 | While a project is archived, a reviewer link opens read-only and accepts no comment or decision; it works again after un-archiving if not expired or revoked | Review edge case 31; an archived project cannot be edited. |
| 6.11 | A refused save into an archived project is kept as "not saved: project archived" and not retried | Matches shared decision 11 for access changes. |
| 6.12 | Warranty term is entered in whole months, minimum 1 | The PRD's example is "12-month"; review edge case 58 asks that zero and negative terms be refused. |
| 6.12 | End date is the start date plus the term; In warranty runs from the start date to the end date inclusive | The PRD says the end date is calculated but not how; the UX example reads "runs to 12 Nov 2027". |
| 6.12 | A warranty on a scope not yet closed, with no start date entered, shows Not started | Review edge case 58; the default start is the closeout date, which does not exist yet. |
| 6.12 | A visit time cannot be earlier than the reported time, and neither can be in the future | Review edge case 58; visits are records of what happened, and scheduling is outside the proof of concept. |
| 6.12 | The default name of a service scope is "Service visit" followed by the date | The PRD says "a default name" without giving one. |
| 6.12 | Simultaneous Start service visit by two people creates one service scope | Review edge case 56. |
| 7.2 | Reach, preview and no-home wording taken from UX 7.4 ("Reachable on demand", "one place at a time", "No home position — not counted in coverage") | The UX gives the text. |
| 7.5 | When two people claim one port, the first save wins and the second is kept as a pending edit in conflict | The PRD says both must not succeed silently and pending edits are retained; first-save-wins is the rule used for every other versioned item. |
| 7.5 | A former port stays as it was (not Free) after a removal until someone releases or reassigns it | FR-53 says the port is not declared free automatically; this states what it shows instead. |
| 6.7 | Core checks are required by default for Work now devices; an Inspect or test only device has none required until an Editor selects them; Reference only gets none | Story 5.4 sets the default for Proposed devices only; the PRD says selected inspections can have checks and reference-only equipment is not recommissioned. |
| 6.8 | Cable ends and ports flagged Needs connection review are included in the project list's attention count | The state model lists Needs connection review among the attention indicators; story 5.9 leaves later indicators to their own stories. |
| 7.5 | A proposed device with only a planned port assignment can still be deleted as a draft after a preview, releasing its own reservation; one with a Current installation assignment cannot | FR-55 asks for a dependency preview and release of the proposal's own planned reservation, so a planned assignment alone does not block deletion. |
| 8.1 | A backup location on the same disk as live data is allowed, with a warning on S-34 | UX 17.4 specifies a warning, not a refusal |
| 8.1 | One backup job per project at a time; Back up now during a running job shows that job; a daily backup due during a manual one waits and is skipped if the manual one succeeded | Avoids two jobs writing one generation; simplest rule |
| 8.1 | A failed backup does not count toward the seven kept generations and removes none | PRD says seven successful generations |
| 8.1 | Only the most recent "before an update or data conversion" backup is kept beside the seven | AD-13 says "plus one" |
| 8.1 | A missing second bucket makes the Cloudflare deployment fail with a message | Safer than starting with no backup area |
| 8.2 | A backup of the working project is taken before the switch and kept as "before restore"; the switch does not happen if it fails | FR-34 requires a backup before destructive maintenance; makes a mistaken switch recoverable |
| 8.2 | At most one unswitched restored copy per project; it stays until an administrator discards or replaces it (no timed deletion) | Bounds storage without inventing a retention period |
| 8.2 | Saves from pages open before the switch are refused, shown as "not saved: project was restored", and not retried | Same pattern as shared decision 11 for access changes |
| 8.2 | Older-format backups are converted in the copy; newer-format backups are refused | Follows AD-20 and NFR-7 |
| 8.3 | The deployment key is kept outside backups; recovery without it resets two-step verification for every account and clears stored settings secrets, logged | Secrets encrypted with the key cannot be read without it; accounts must stay usable |
| 8.3 | Recovery cancels outstanding invitation and password-reset links as well as sessions and reviewer links | A link used after the recovery point would otherwise work again |
| 8.3 | A project in the catalogue with no usable backup is listed as not recovered; a project backup with no catalogue entry is recovered with no members | Nothing is silently dropped or made reachable without an administrator's decision |
| 8.3 | The recovery notice stays until an administrator dismisses it | PRD requires the notice but gives no duration |
| 8.3 | "No live site passwords in backups" is tested as: no record shape has a field for one | Free-text notes cannot be policed; the review asked for a testable control |
| 8.4 | A finished portable backup file is kept for download for 24 hours, then removed, and does not count against the project budget | PRD says backup storage is separate; a short conventional holding period |
| 8.4 | One portable-backup job per project at a time | Same rule as 8.1 |
| 8.4 | A standard user who imports becomes the new project's Editor | FR-68: import "follows the same rule" as project creation |
| 8.4 | Replacing a live project is refused when the backup's project identity differs from the live project's | Prevents replacing the wrong project; importing as new remains available |
| 8.5 | A warning is shown when a project reaches 90% of the 8 GiB budget, in addition to the warning before an operation that would exceed a limit | PRD says "warn before exceeding"; 90% is a conventional threshold |
| 8.5 | Space is reserved when an upload or job starts and released on failure | Stops two concurrent uploads jointly exceeding the budget |
| 8.5 | Viewers as well as Editors see project usage on Records | Usage is read-only information; a Viewer can open the project |
| 9.4 | A failed or malformed update check keeps the last good result and shows the failure time and reason | Avoids a false or stale update marker |
| 9.4 | A release is offered only if its version is higher than the installed one | Never offers a downgrade (NFR-8) |
| 9.5 | The signature is verified before users are warned | Avoids interrupting users for a release that will be refused; PRD order puts verification first |
| 9.5 | Sign-in is not offered while changes are stopped; existing sessions stay valid | PRD stops "changes of every kind"; a sign-in writes a session and a log entry that a return would lose |
| 9.5 | Update, Back up now and Restore are disabled while an update, backup or restore runs; a daily backup due during an update waits | One maintenance job at a time |
| 9.5 | After an update an open page submits its pending edits; any the new version cannot accept stay listed as not saved and the page asks for a reload without reloading by itself | Keeps unsaved input visible, as FR-21 and NFR-2 require |
| 9.6 | After power loss or a killed updater: accept changes again if installation had not begun, otherwise return to the earlier version and backup | Returning is the conservative choice once the image may have changed |
| 9.6 | Going back after an update that passed its checks is a documented command-line procedure, not an interface control | AD-20 says going back means restoring the pre-update backup with the earlier version; no new control is invented |
| 9.7 | 30 minutes without a result from the update run: ask GitHub to cancel it, clear the marker, accept changes again, log "no result" | The brief requires a stated limit; 30 minutes allows for a queued run and a full deploy |
| 9.7 | The token and the existence of the release are checked before users are warned or changes stopped | Shared decision 8 |
| 9.7 | The workflow, not the Worker, verifies the signature | AD-21 |
| 9.7 | For a release that changes a Durable Object class, the manual procedure is shown in place of Update now | AD-21: it "is installed by the documented manual procedure" |
| 10.1 | A change to the fixture after Kevin's confirmation makes a new manifest version and the affected runs are repeated | PRD forbids redefining the fixture after results |
| 10.2/10.3 | The Cloudflare FR-66 and FR-72 Checks are placed in 10.3; the two-user conflict runs, independent arithmetic check and full-size recovery run in 10.2 | Shared decision 10 left the split open |
| 8.1 | Archiving or un-archiving is refused while a backup or restore job for that project runs | Follow-up from Epic 6: an archive must not interleave with a backup or restore; matches 6.11's refusal while other jobs run |
| 10.1 | The small functional project has about 50 devices and is built in 10.1, not by the 2.7 script | The addendum suggests about 50 assets; 2.7 generates only the acceptance-size project |

## Revision history

- **Draft 0.1** covered FR-1–65 for a Cloudflare-only server opened by links. It is kept beside this file as `epics-draft-0.1-pre-amendment-1.2.md.txt`.
- **Draft 0.2** was rewritten for final PRD 1.2: an epic for accounts and administration, an epic for self-hosting and updates, recovery split from acceptance, and the stories the PRD review changed. Story numbers differ from draft 0.1.
- **Draft 0.3** applied the first readiness check: criteria that depended on later epics moved out of Epic 1, three large stories split, four UX decisions cited, and the Packages screen renumbered S-37.
- **Draft 0.4** followed architecture 3.0 and the experiments run on 2026-11-18: one server build for both hosts, the coverage sampling fix, smaller package pages with resumable upload, and Cloudflare updates through a GitHub Actions run.
- **Draft 0.5** settled the epic order with Kevin, moved the self-hosted image to story 2.13, renumbered Epic 9 and swapped stories 1.6 and 1.7.
- **Draft 0.6** applies the independent review of draft 0.5 (28 adversarial findings, 76 edge cases, 13 structure recommendations) and the automated review of the pull request. Main changes:
  - every story now has a user-story sentence, and notes are separated from criteria;
  - criteria that needed later stories moved to those stories;
  - the first work scope, the device lifecycle, the data-format version and the large test project are introduced where they are first needed (stories 2.1, 2.7, 1.1 and 2.7);
  - missing parts of requirements were added, among them closeout contents, final acceptance, schedule export, redo and analysis uncertainty;
  - handling was added for the edge cases the review listed;
  - story 2.13 was split in three, giving stories 2.14 and 2.15;
  - a Cloudflare update that fails after converting data now has a defined way back;
  - status, the epic overview and the standing rules moved to the front, and coverage tables and history to the end.
  - No existing story was renumbered.
