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
