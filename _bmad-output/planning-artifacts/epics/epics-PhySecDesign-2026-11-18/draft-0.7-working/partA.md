## Epic 1: Install, sign in and manage people

**Outcome.** An organisation can deploy Site Studio on Cloudflare, set it up, invite people, and control who can see and change each project.

**Depends on.** Nothing earlier and nothing later. Inside the epic each story needs only the stories before it.

**Why here.** Every later story needs to know who is acting and what they may do, so accounts come before the first shared project and no temporary access scheme is built and thrown away.

### Story 1.1: Run the app on Cloudflare with a portable server core

As an organisation's administrator, I want Site Studio served by one server build that runs on Cloudflare and also starts under the self-hosted runtime, so that my organisation can use either host.

Covers: AD-1, AD-16, AD-17, AD-20 (data-format version, conversion runner, one version at a time), AD-22 (route declarations, reason codes), architecture section 10, experiments R7 and R8.

**Core behaviour**
- When the local development command runs, the existing app loads from the locally run Worker through Cloudflare's Vite plugin.
- The existing unit and browser tests pass against that locally served app with no test changed or removed.
- The Worker has exactly two Durable Object classes, a project room and the installation object, each with SQLite storage.
- The file-store and update interfaces are defined in the server.
- The project room and the installation object each record a data-format version when first created, and a test reads it back after a restart.
- A conversion runner, when called, applies the listed conversions in order from the recorded data-format version to the build's version. It is never started by an object starting.
- The runner's list is empty, and a test with one sample conversion called directly shows the conversion applied once and the recorded version raised.
- Every build carries a release version. The entry code attaches it to every call to an object, and an object attaches its own to every call it makes to another object.
- An object that receives a call carrying a different version refuses the call and stops itself, so that it starts again on the code now deployed; the caller tries once more and otherwise answers "updating, try again shortly".
- A test calls a busy object with a version other than its own and finds the call refused, nothing written by it kept, and the object started again with a new start identifier.
- On a Cloudflare account on the Workers Paid plan, the deploy command makes the app reachable over HTTPS at a `workers.dev` address.
- The static "Sites" package and its test still work (K7).
- Every server route other than the application's own pages and files is under `/api/v1/`, and declares, in the shared module, a schema for its input and its reply; the only other addresses allowed are an MCP endpoint at `/mcp` and standard discovery addresses under `/.well-known/`, which declare their schemas in the same way.
- A request whose input does not match its route's schema is refused with the field named.
- Every refusal carries a reason code as well as its wording.
- The shared route declarations offer an entered-text value type, which wraps each value with its source (member, agent, reviewer link, import, file name or PDF text) and a reference to where it came from; at this point no route uses it.

**Refusals and edge cases**
- An object whose recorded data-format version is newer than the build's refuses requests with an explanation.
- An object whose recorded data-format version is older than the build's refuses requests and says that an update was not completed.
- An object stops itself at most once in 30 seconds; a call from a different version within that time after a stop is refused without stopping again. (CA-41)
- The time of a stop is written to the object's own storage before it stops, so that the limit holds across the restart.
- A call marked as version-independent is answered whatever the caller's version; at this point no call is so marked.
- An object that uses its alarm for more than one kind of work keeps a schedule of due times and always sets its one alarm to the earliest; setting one never removes another.
- Each stop and each such refusal is written to the runtime log with both versions.

**Limits and values**
- The configuration for each host declares no D1, Workflows, Queues, scheduled-trigger or KV binding.
- Dependency versions are pinned, and a clean install from the lock file succeeds in continuous integration.

**Evidence to record**
- One server test runs inside Cloudflare's runtime using `@cloudflare/vitest-plugin`.
- A self-hosted configuration starts the same built bundle under Cloudflare's open-source runtime, and a smoke test in continuous integration shows a value saved, the process restarted, and the value read back.
- The HTTPS address is checked on a deployed Cloudflare test installation.

Notes: The version rule is in this story, not with the Update control, because the first update depends on the first release already obeying it (AD-20, K20). Left to later stories: the update record and its refusals (story 9.3a); conversions and the return (story 9.3b); moving between released versions (story 9.5a self-hosted, story 9.7a on Cloudflare). Experiments R7 and R8 were run early; see the experiments record. R7 met an install problem, which the pinned versions avoid or the repository documents.

### Story 1.2: Set up a new installation

As an organisation's administrator, I want a one-time set-up step that only the person who installed Site Studio can complete, so that I become its first administrator and nobody else can.

Covers: FR-66 (set-up; Cloudflare host), NFR-5 (password storage), AD-12, AD-21 (set-up code on redeploy). Screens: S-25.

**Core behaviour**
- The Cloudflare deploy command generates a random set-up code, supplies it to the installation as a secret and prints it once in the deployment output. (CA-01)
- An installation with no users shows the set-up page when opened.
- The step asks for the set-up code, the installation's name and the first administrator's name, email and password.
- The page states that it disappears once an administrator exists.
- On completion exactly one administrator exists, and the page confirms the installation's name and the administrator's email.
- The password is stored only as a salted scrypt hash (N = 131,072, r = 8, p = 1, a 32-byte result), with the parameters stored beside the hash.

**Refusals and edge cases**
- Once any user exists, the set-up page and its request are refused, and the set-up code no longer works.
- A wrong or missing set-up code is refused.
- Two set-up requests sent at the same moment create one administrator; the second is refused.
- Deploying again to an installation that has an administrator generates no set-up code and does not make set-up available.
- Deploying again to an installation with no users prints a new set-up code, and the earlier code stops working. (CA-02)
- On a deployed Cloudflare test installation, a plain HTTP request is redirected to HTTPS or refused.
- Of two test installations deployed from the same build, completing set-up on one leaves the other still offering set-up with its own code.

**Limits and values**
- The set-up code has at least 20 characters. (CA-01)
- The password must have 12 to 128 characters and must not equal the account's email address; there are no other composition rules. (CA-03)
- The installation's name must be 1 to 80 characters. (CA-04)
- After 5 wrong codes, further attempts from any address are refused for 1 minute, doubling after each further failure up to 15 minutes, and the page says how long to wait. (CA-05)

**Access and restore**
- A revision restore leaves accounts and the installation's name unchanged.

Notes: Left to later stories: the sign-in page showing the installation's name, and two installations sharing no sign-in or session (story 1.3a); two installations sharing no project (story 1.6) and no file (story 2.14); the self-hosted set-up code, printed in the server output (story 2.13a); installation instructions (story 9.1).

### Story 1.3a: Sign in and sign out

As an administrator, I want to sign in with my email and password and sign out again, so that only I can act as my account.

Covers: FR-67 (sign-in, sign-out), NFR-5, AD-12, experiment R9. Screens: S-26.

**Core behaviour**
- An installation that has an administrator shows the sign-in page, with the installation's name, to anyone not signed in.
- The administrator created in story 1.2 signs in with their email and password.
- The session is held in a cookie that scripts cannot read, marked Secure and SameSite=Lax.
- The server stores only a hash of the session token.
- An account menu in the existing header shows the signed-in user's name and Sign out.
- Sign out ends the session, and a later request with its cookie is refused.

**Refusals and edge cases**
- A wrong email or password gives one message, whether or not the email has an account.
- After repeated failed sign-ins, further attempts are refused for a wait, and the page says how long to wait. (CA-07)
- The wait is the same for an email with no account.
- A successful sign-in clears that email's failure count.
- The count of failed sign-ins for an email address is kept by the entered address in a short-lived store, and is not read from any log, so it applies equally to an address that has no account.
- A request that changes anything with a session cookie, and a sign-in request, is refused unless it comes from the app's own origin and carries the header the app adds, so that another site cannot sign a person in to an account of its choosing.
- An account of one test installation cannot sign in to another deployed from the same build, and a session cookie from one is refused by the other.

**Limits and values**
- The failure message reads "That email and password do not match."
- The wait starts after 5 failed sign-ins in a row for one email, or 20 from one network address within 15 minutes. (CA-07)
- The wait is 1 minute, doubling after each further failure up to 15 minutes. (CA-07)
- The sign-in fields are labelled, use 16 px text and can be filled by a password manager.

**Access and restore**
- A revision restore leaves sessions unchanged.

**Evidence to record**
- On a deployed Cloudflare test installation the scrypt hash is accepted without a platform error, and sign-in completes in under 1 second at the median of 20 sign-ins. (CA-08)
- A password hash made on one host verifies on the other.

Notes: Left to later stories: invitations (story 1.3b); the second sign-in step (story 1.4); My account in the account menu (story 1.5); the activity log, which records a failed sign-in for an address with no account only as "unknown address" and so cannot supply the failure count (story 1.9); "Forgot password" (story 1.10c). Experiment R9 was run on 2026-11-19: Cloudflare refuses a PBKDF2 call above 100,000 iterations, so the 600,000-iteration hash first planned was replaced by scrypt, which worked on both hosts with identical results and added about 0.36 s to a request on Cloudflare.

### Story 1.3b: Invite a person

As an administrator, I want to invite a colleague who then sets their own password, so that each person has their own account.

Covers: FR-67 (invitation), AD-12. Screens: S-27, S-30 invite panel.

**Core behaviour**
- An administrator's account menu holds "Invite a person", which opens the invite panel.
- An administrator invites a person by email, name and role (administrator or standard user) and receives a link to copy.
- The invitation page shows who invited the person and the installation's name.
- The person sets a name and a password and is signed in.
- The password must meet the password rules of story 1.2, and the page shows each rule as it is met.
- The new password is stored in the form story 1.2 states.

**Refusals and edge cases**
- There is no open registration: no page or request creates an account without an invitation.
- An invitation works once.
- A used or expired link says so and tells the person to ask an administrator for a new one.
- Inviting an email that already has an account is refused, and the administrator is told so. (CA-10)
- Inviting an email that has an unused invitation replaces the earlier link, which stops working. (CA-10)
- A standard user's account menu has no "Invite a person", and a standard user's invite request is refused.

**Limits and values**
- An invitation expires 7 days after it is issued. (CA-09)

**Access and restore**
- A revision restore leaves invitations unchanged.

Notes: Left to later stories: the invite action moves into Administration, with pending invitations listed and cancellable (story 1.8a and story 1.8b); refusing an invitation for a deactivated account (story 1.8a); the administrator changing how long an invitation lasts (story 1.10a); sending the link by email (story 1.10c).

### Story 1.4: Two-step verification

As a designer, I want to protect my account with an authenticator app, so that a stolen password is not enough.

Covers: FR-67 (two-step verification), AD-12, AD-17, AD-21 (deployment key), UX decision D14. Screens: S-26, S-27, S-29.

**Core behaviour**
- A user turns it on by scanning a code and confirming with one generated code.
- The user is then shown recovery codes once, with Copy and Download; the codes cannot be displayed again.
- With it on, a correct password alone does not sign in; a current code does.
- "Use a recovery code" accepts a recovery code in place of a generated code, once.
- The account page shows how many recovery codes remain.
- A user makes a fresh set of recovery codes by giving their password and a current code, and the old set stops working. (CA-13)
- A person who has just accepted an invitation is offered two-step set-up and can skip it.
- Recovery codes are stored only as hashes.
- The authenticator secret is stored encrypted with a deployment key that the deploy command generates and supplies to the installation as a secret. (CA-14)
- The deploy command prints the deployment key once, when it creates it, with an instruction to keep a copy outside the Cloudflare account.
- When the operator supplies a deployment key kept from an earlier installation, the deploy command uses it and generates none.

**Refusals and edge cases**
- A code that has been accepted is refused if used again.
- Wrong codes and wrong recovery codes count toward the same limit and wait as wrong passwords in story 1.3a. (CA-15)
- Turning it off asks for the password. (CA-13)
- Neither the authenticator secret nor a recovery code appears in any reply after set-up.
- The deploy command generates the deployment key only when the installation has none: a test deploys again and then signs in with a two-step code set up before.

**Limits and values**
- A set holds 10 recovery codes. (CA-11)
- Codes are 6 digits and change every 30 seconds; a code from the step just before or just after the current one is accepted. (CA-12)
- The code field asks for a numeric keypad and offers code autofill on a phone.

**Access and restore**
- A revision restore leaves two-step set-up and recovery codes unchanged.

Notes: Left to later stories: the two-step controls on the My account page (story 1.5 places them there); reset or requirement by an administrator for one user (story 1.8b); requirement for everyone (story 1.10b); the self-hosted key file (story 2.13c).

### Story 1.5: My account and sessions

As a designer, I want to manage my password and see where I am signed in, so that I stay in control of my access.

Covers: FR-67 (password change, sessions, sign out everywhere, session end), UX section 17.3. Screens: S-29.

**Core behaviour**
- My account is reached from the account menu and shows the user's name and email, with the two-step controls of story 1.4.
- A user changes their name.
- A user changes their password by giving the current one; the new one must meet the password rules of story 1.2.
- A password change signs out every other session of that account. (CA-16)
- A user sees each signed-in session with its device (browser and system), time of last use and network address, with the current session marked.
- A session shows a country or city where the host supplies one. (CA-17)
- "Sign out everywhere else" ends the other sessions, and each is refused on its next request.
- A session ends after a period without use. (CA-19)
- Only a request that results from something the person does, such as opening a page, saving, uploading or any other deliberate action, counts as use of the session. (CA-19)
- A request the page sends by itself, such as an automatic check for other people's changes, does not count as use, so a page left open still reaches the idle limit. (CA-19)
- When a session ends while a page is open, the page asks the user to sign in again in place.
- After the same account signs in, input pending on that page, such as an unsaved name on My account, is still there and can be saved.

**Refusals and edge cases**
- If a different account signs in on that page, the earlier account's pending input is neither shown to it nor sent. (CA-20)
- That input stays bound to the earlier account and is offered again only when that account signs in on the same browser. (CA-20)

**Limits and values**
- The period without use is 24 hours. (CA-18)

Notes: Left to later stories: ending sessions by deactivation (story 1.7b); the administrator changing the 24-hour period (story 1.10a); pending project edits kept the same way (story 2.2b); an upload in progress counting as use and resuming after sign-in (story 2.6c).

### Story 1.6: Projects list and creating a project

As a designer, I want to land on my projects after signing in, so that I can open the property I work on.

Covers: FR-66 (installations share no projects), FR-68 (project creation), UX decision D11. Screens: S-28.

**Core behaviour**
- After signing in, an administrator sees every project by name, and a Create project action.
- An administrator creates a project by giving its name; it appears in the list without reloading the page, and its creator is recorded.
- Each project has its own address, and opening a project from the list goes to that address.
- A project's address loads the existing app, whose data is still held only in the browser.
- A user whose list holds exactly one project, an administrator included, goes straight to it after signing in. (CA-22)
- The projects list is reachable from the account menu and by its own address, including for a user who was sent straight to a project.

**Refusals and edge cases**
- A standard user sees no Create project action, and a standard user's create request is refused.
- A project created on one test installation is not listed on, and its address is refused by, another deployed from the same build.

**Limits and values**
- A project's name has 1 to 120 characters, and two projects may have the same name. (CA-21)
- A user with no project sees "You have not been added to a project yet. Ask an administrator."

**Access and restore**
- A revision restore leaves a project's name and recorded creator unchanged.

Notes: Left to later stories: membership, so until then every standard user sees the empty message (story 1.7a); project data held on the server, and scope state and last activity on the list (story 2.1); the attention count (story 5.9b); project creation by standard users (story 1.10a).

### Story 1.7a: Project membership and the access gate

As an administrator, I want access decided by role and project membership on the server, so that people see and change only what they should.

Covers: FR-68, FR-69, NFR-5, AD-12, AD-17, AD-22 (route classes, the actor's via field).

**Core behaviour**
- Every request passes one access gate that identifies the caller and decides from their installation role and project membership.
- An administrator's server functions add a user to a project as Editor or Viewer, change that role and remove the user.
- A standard user's project list shows only the projects they belong to, each with their role; an administrator's list shows every project.
- Server tests, using one test route marked as a project read and one marked as a project change, show the gate's decision for each case: an administrator may read and change any project, an Editor may read and change their own project, a Viewer may read their project and is refused any change, and a non-member and an ended session are refused.
- Removing a member or changing a role takes effect on that person's next request: a test changes a role and shows that the very next request is decided by the new role, with no delay from any held lookup.
- The actor recorded on every action is the signed-in account and its name at the time, supplied by the gate.
- The actor record has a `via` field, empty for a signed-in person.
- After a user is renamed, records made earlier, such as a project's creator and an invitation's sender, still show the earlier name.

**Refusals and edge cases**
- Every route declares one class: public, reviewer link, read, draft change, person only, administrator only or update secret; a test route that declares none is refused.
- A signed-in Editor is accepted on a test route marked person only, and decided by role and membership as on any other change.
- The membership functions called by a standard user, including an Editor of that project, are refused.
- A signed-in standard user who requests the address or the record of a project they do not belong to is refused by the server.
- A change refused because access changed (no longer a member, or role too low) returns a reason distinct from "not signed in".
- A request that names a different actor in its body is recorded under the signed-in account.

**Access and restore**
- A revision restore leaves a project's members and their roles unchanged.

Notes: Left to later stories: installation roles and deactivation (story 1.7b); the screens for members (story 1.8c); a Viewer reading an open project and being refused a save (story 2.1); pending project edits refused because access changed (story 2.2b); the Viewer who is an approval assignee (story 4.6b). Downloads and exports are shown under the gate by the stories that add them.

### Story 1.7b: Installation roles, deactivation and the last administrator

As an administrator, I want to change a person's installation role and deactivate an account, so that access ends when it should and one administrator always remains.

Covers: FR-67 (deactivation), FR-68 (installation role, last administrator), NFR-5, AD-12.

**Core behaviour**
- An administrator's server functions change a user's installation role, deactivate an account and reactivate it.
- A deactivated account cannot sign in.
- Deactivating an account ends all of its sessions at that moment, and each is refused on its next request.
- After the account is reactivated, a cookie from a session that existed before the deactivation is still refused, and the person must sign in again.
- A reactivated user can sign in again with the same password.
- A role change takes effect on that person's next request.
- Records a deactivated user made earlier, such as invitations sent and projects created, still show their name.

**Refusals and edge cases**
- The same functions called by a standard user are refused.
- The gate's server tests of story 1.7a gain the case of a deactivated account, which is refused.
- A change refused because the account was deactivated returns the access-changed reason of story 1.7a.
- The last administrator cannot be demoted or deactivated.
- Only active accounts that have accepted their invitation count as administrators for this rule. (CA-23)
- Two requests sent at the same moment that would together remove the last two administrators leave one administrator; the second request is refused.

Notes: Left to later stories: the screens for these actions (story 1.8a); cancelling a deactivated account's links (story 1.8b).

### Story 1.8a: Administration: users

As an administrator, I want one place to see and manage people, so that I can give and withdraw access without help.

Covers: FR-70 (Users), FR-67 (deactivation), UX decision D10. Screens: S-30.

**Core behaviour**
- Administration is a separate area reached from the account menu, with Users in a left-hand list.
- The Users table shows name, email, role, state (Invited with the invitation's expiry, Active, Deactivated), two-step verification (On or Off), projects and last sign-in.
- Invite is in Users, and the account-menu action of story 1.3b is removed.
- When inviting, an administrator optionally chooses projects and a role in each, which apply when the invitation is accepted.
- A user's detail lets an administrator change the name and installation role, sign the user out everywhere, deactivate and reactivate.
- Deactivating explains that the person's records keep their name.

**Refusals and edge cases**
- A standard user does not see Administration, cannot open its pages by address and is refused by each of its server functions.
- Inviting the email of a deactivated account is refused, and the administrator is told the account is deactivated. (CA-10)
- The last administrator's role and Deactivate controls are disabled, with the reason shown.
- When an administrator's role is removed while they have an unsaved change open in Administration, the save is refused and shown as "not saved: access changed".
- What they entered stays on the page and is not retried.

Notes: Left to later stories: reset links, two-step reset and requirement (story 1.8b); Projects (story 1.8c); Activity (story 1.9); Settings (story 1.10a); Reviewer links (story 4.7b); Backups (story 8.1c); Software (story 9.4).

### Story 1.8b: Administration: reset links and two-step control

As an administrator, I want to issue a password reset, and reset or require two-step verification for one person, so that I can get a colleague back in and keep their account protected.

Covers: FR-70 (Users: require or reset two-step verification, issue a password reset), FR-67 (administrator reset link). Screens: S-27, S-30.

**Core behaviour**
- A user's detail lets an administrator issue a password reset link, which the administrator copies.
- Using the link sets a new password and ends all of that account's sessions. (CA-25)
- A password reset leaves two-step verification on. (CA-25)
- A user's detail lets an administrator reset that user's two-step verification: the user then signs in with the password alone and is offered set-up again.
- After a reset, the user's old recovery codes no longer work. (CA-26)
- A user's detail lets an administrator require two-step verification for that user, and remove the requirement.
- A user for whom it is required and who has not set it up must do so at their next sign-in before doing anything else, and a session already signed in can do nothing but set it up from its next request.
- The Users table shows "Required but not set up" for such a user.
- Users lists unused invitations and reset links with their expiry, and each can be cancelled.

**Refusals and edge cases**
- A reset link works once.
- A cancelled link says it is no longer valid.
- Deactivating an account cancels its unused invitation and reset links. (CA-28)
- An invitation or reset link opened for an account that has since been deactivated is refused. (CA-28)
- While two-step verification is required for a user, their attempt to turn it off is refused with the reason.

**Limits and values**
- A reset link issued by an administrator expires after 24 hours. (CA-24)

**Access and restore**
- A revision restore leaves reset links and two-step requirements unchanged.

Notes: Left to later stories: requiring two-step verification for everyone (story 1.10b); reset by email (story 1.10c).

### Story 1.8c: Administration: projects and members

As an administrator, I want to see every project and manage who belongs to each, so that the right people can open the right properties.

Covers: FR-70 (Projects), FR-68. Screens: S-31.

**Core behaviour**
- Administration's left-hand list gains Projects.
- The Projects table shows every project with its name, members and creation date, and has Create project.
- A project's row opens its members: add a user as Editor or Viewer, change a role, remove.
- Removing explains that the person's earlier entries stay.

**Refusals and edge cases**
- The members controls are absent for a standard user who is the project's Editor.

Notes: Left to later stories: scope state and last activity in the table (story 2.1); Archive and Un-archive (story 6.11); latest backup (story 8.1c); stored size (story 8.5).

### Story 1.8d: Recovery when the only administrator is locked out

As the person who controls my organisation's Cloudflare account, I want a command that lets a locked-out administrator back in, so that losing a password or a phone does not lose the installation.

Covers: FR-70 (administrator recovery, Cloudflare host), AD-12.

**Core behaviour**
- A command documented in the repository, run by a person who controls the Cloudflare account, names an administrator account and prints a one-time recovery code.
- With the code, that account sets a new password and has its two-step verification reset. (CA-29)
- Using the code ends all of that account's sessions.

**Refusals and edge cases**
- The code works once.
- A wrong or expired code is refused.
- No page or request in the app issues a recovery code.

**Limits and values**
- The code expires 1 hour after it is printed. (CA-30)

Notes: Left to later stories: the activity-log entries for issuing and using the code (story 1.9); the self-hosted form of the command (story 2.13c); the command in the published instructions (story 9.1).

### Story 1.9: Activity log

As an administrator, I want a log of sign-ins and administrative changes, so that I can see what happened and when.

Covers: FR-71. Screens: S-36.

**Core behaviour**
- Administration's left-hand list gains Activity, which shows each entry's time, actor, what changed and detail, newest first.
- Sign-in events add entries: sign-in, failed sign-in including a failed second step, sign-out and sign out everywhere.
- Credential events add entries: password change and reset, recovery codes renewed, and two-step verification turned on, turned off, reset, required and no longer required for a user.
- Invitation and link events add entries: invitation issued, accepted and cancelled, and reset link issued and cancelled.
- Account and project events add entries: set-up completed, role and membership changes, deactivation and reactivation, and project creation.
- Issuing and using the recovery code of story 1.8d each add an entry; the issue is recorded as made from the host, with the account it names.
- A failed sign-in entry records the network address, and the email only when it matches an account. (CA-32)
- When the text entered matches no account, the entry reads "unknown address" and the text entered is not stored. (CA-32)
- Failed sign-ins and administrative changes are each marked by an icon and a label.
- An administrator filters by person, kind of event and date, and exports the filtered log as a CSV file. (CA-31)

**Refusals and edge cases**
- No entry contains a password, token, code or link: a test signs in, invites, resets and fails a sign-in, then searches the stored log for each secret used and finds none.
- No page or server function edits or removes an entry.
- A standard user cannot open Activity or call its functions.

**Limits and values**
- Entries are never removed by age: an entry given a date several years in the past in a test is still listed and exported.

**Access and restore**
- A revision restore leaves the activity log unchanged.

Notes: Left to later stories, which add their own events: settings changes (story 1.10a); access tokens and actions made with them (story 1.10e); reviewer links and link decisions (story 4.7a and story 4.7b); archiving (story 6.11); backups and restores (Epic 8); updates (Epic 9). The log is included in the installation's backups by Epic 8.

### Story 1.10a: Settings: installation, sign-in and maps

As an administrator, I want to set how the installation behaves, so that it fits my organisation.

Covers: FR-70 (Settings), FR-67 (session period, invitation life), FR-68 (project creation by standard users), FR-71 (settings changes), AD-17. Screens: S-33.

**Core behaviour**
- Administration's left-hand list gains Settings, grouped as Installation, Sign-in and Maps.
- Each group saves on its own and says what changed.
- Installation holds the name, and a changed name shows on the sign-in page.
- Sign-in holds the period without use after which a session ends, how long an invitation lasts, and whether standard users may create projects.
- A changed session period applies to existing sessions on their next request. (CA-34)
- A changed invitation life applies to invitations issued afterwards. (CA-34)
- When standard users are allowed to create projects, a standard user sees Create project, creates one, becomes its Editor and cannot add members.
- Maps holds optional provider keys; a saved key is stored encrypted with the deployment key of story 1.4.
- A saved secret is shown in Settings only as its last characters, never again in full. (CA-35)
- Each change is recorded in the activity log with the earlier and new value, except that a secret is recorded only as changed.

**Refusals and edge cases**
- A value outside a setting's bounds is refused with the bounds shown.
- When project creation by standard users is turned off again, projects already created keep their members. (CA-36)

**Limits and values**
- The session period accepts 15 minutes to 30 days. (CA-33)
- The invitation life accepts 1 to 30 days. (CA-33)
- A saved secret shows its last 4 characters. (CA-35)
- The Maps group states beside the Google mapping key that this key is visible in the browsers of signed-in users. (CA-37)

**Access and restore**
- A revision restore leaves settings unchanged.

Notes: Left to later stories: requiring two-step verification (story 1.10b); the Email group (story 1.10c); delivering the Google mapping key to members' browsers and removing the prototype's per-session key dialog (story 2.6a); the Limits group (story 8.5); the GitHub token for Cloudflare updates, stored the same way (story 9.7b).

### Story 1.10b: Require two-step verification for everyone

As an administrator, I want to require two-step verification for every account, so that no account in my organisation is protected by a password alone.

Covers: FR-67 (required two-step verification), FR-70 (Settings), AD-12. Screens: S-27, S-30, S-33.

**Core behaviour**
- The Sign-in group of Settings gains "Require two-step verification".
- When it is turned on, a user without two-step verification must set it up at their next sign-in before doing anything else.
- A session already signed in without it can do nothing but set it up from its next request.
- A person accepting an invitation must set it up before doing anything else.
- The Users table shows "Required but not set up" for every account without it.
- Turning the setting on or off is recorded in the activity log.

**Refusals and edge cases**
- While it is required, a user's attempt to turn two-step verification off is refused with the reason.
- An administrator can still reset a user's two-step verification, and that user must then set it up again at their next sign-in.

Notes: This story applies to every account the behaviour that story 1.8b builds for one user.

### Story 1.10c: Optional email and forgotten passwords

As an administrator, I want Site Studio to send invitations and password resets by email when I connect an email service, so that I do not have to pass every link on by hand.

Covers: FR-67 (reset by email), FR-70 (Settings: optional email sending), AD-18. Screens: S-26, S-30 invite panel, S-33.

**Core behaviour**
- Settings gains an Email group: off, or the details of an HTTP email service, whose key is stored and shown as story 1.10a states for secrets.
- With an HTTP email service configured, "Send a test message" reports success or the service's error.
- With email working, the invite panel offers "Email it" beside the link to copy.
- With email working, "Forgot password" on the sign-in page sends a reset link.
- Using the emailed link sets a new password, ends all of that account's sessions and leaves two-step verification on.
- Without email, "Forgot password" says "Ask an administrator for a reset link".
- Without email, every invitation and reset is a link the administrator copies, and nothing else stops working.
- A change to the Email group and each reset link sent are recorded in the activity log, without the link.

**Refusals and edge cases**
- A failed invitation send is reported with the link still offered.
- "Forgot password" gives the same reply for every email, and no message is sent for an unknown or deactivated account. (CA-39)
- An emailed reset link works once.

**Limits and values**
- An emailed reset link expires after 1 hour. (CA-38)
- At most 3 reset messages are sent to one account in an hour. (CA-39)

Notes: Left to later stories: SMTP (story 1.10d).

### Story 1.10d: Experiment R13: email by SMTP on both hosts

As an administrator who runs my own mail server, I want to know whether Site Studio can send by SMTP, so that I am offered it only if it works on my host.

Covers: AD-18, experiment R13.

**Core behaviour**
- If R13 passed on both hosts, the Email group offers SMTP server details, with the password stored and shown as story 1.10a states for secrets, and "Send a test message" works through SMTP. (CA-40)
- If R13 did not pass on both hosts, the Email group offers only the HTTP email service. (CA-40)
- R13 passes on a host when a message sent from that host by SMTP, signing in with a user name and password, is delivered to a real mailbox; a connection that reaches the point of signing in is not a pass.
- Where SMTP is offered, the self-hosted configuration has a documented deployment setting that allows outbound connections to a mail server on a private network and adds an organisation's own certificate authority to those the runtime trusts.

**Refusals and edge cases**
- Without that setting, a self-hosted installation refuses to connect to a mail server on a private address or one whose certificate comes from an authority the runtime does not trust.
- On Cloudflare, the Email group states that a mail server on a private address and port 25 cannot be reached, and points to no deployment setting.
- The SMTP password is sent only over an encrypted connection: a server that offers neither encryption from the first byte nor an upgrade to it is refused, and the test message says that the server does not offer a secure connection.
- A failure after the connection was made and while encryption was being set up is reported as the secure connection to the mail server failing, with the reason in the server log; the message does not guess a reason.
- A failure before a connection was made is reported as the server not being reached, and a refusal by the server gives the server's reply.
- On a self-hosted installation, the Email group states, beside the SMTP server details, that a private mail server or a private certificate authority needs the deployment setting and cannot be enabled from Settings.

**Limits and values**
- Connecting to the mail server times out after 10 seconds and each reply after 30 seconds, and the test message reports which timed out. (CA-42)

**Evidence to record**
- Experiment R13 has a recorded result on a deployed Cloudflare test installation for a message sent by SMTP through the runtime's outbound sockets, signing in to a real mailbox: delivered, which is a pass, or not delivered, with the reason, which leads to the HTTP-only Email group above.
- Experiment R13 has a recorded result for the same send under the self-hosted configuration of story 1.1.
- Under the self-hosted configuration, a test mail server on a private address with a certificate from a test authority is refused without the deployment setting and accepts a message with it, and the result is recorded.
- A send to a server whose certificate names another host, and one to a server whose certificate comes from an untrusted authority, each produce the secure-connection message above, and the runtime log is checked to hold the reason.

Notes: The self-hosted image is story 2.13a; this experiment uses the configuration of story 1.1 because it comes earlier. R13 was run early on 2026-11-19. From Cloudflare, encrypted connections to two public mail services reached the point of signing in, and port 25 is prohibited there; a complete delivery from Cloudflare was not shown. On a server a message was delivered with both usual forms of encrypted SMTP; it found that a mail server on a private network or with a private certificate authority needs a line of runtime configuration, and that certificate failures reach the application only as a generic error, with the reason in the server log.

### Story 1.10e: Personal access tokens for agents

As a designer, I want to give an AI agent its own token that acts for me, so that it can prepare work in my projects while I keep the decisions and can cut it off at any time.

Covers: FR-73, FR-74, FR-75 (refusal of person-only routes), FR-76 (agent-access switch), NFR-5 (tokens), AD-5, AD-12, AD-17, AD-22. Screens: S-29, S-30, S-33, S-36, S-38, S-39, S-40.

**Core behaviour**
- Settings gains an Agent access group with an on/off switch, off in a new installation, and the maximum token lifetime. (CG-03)
- My account gains Access tokens. While agent access is on, Create token asks for a name, the kind (Read only, or Read and draft), all of my projects or chosen ones, and an expiry. (CG-01)
- The created token is shown once with Copy, beside the addresses of the API and the MCP endpoint, and "You will not see this token again."
- The installation object stores only the SHA-256 hash of the token, with its owner, name, kind, projects, expiry and last use; a request's token is found by its hash and compared in constant time.
- A token is accepted only in the `Authorization: Bearer` header.
- A request with a token is decided by the gate as its owner, limited by the token's kind and projects.
- "All of my projects" is checked against the owner's membership at each request, so it covers projects joined later and drops projects left.
- An administrator's token reaches only projects the administrator is a member of, never every project in the installation, and the project list called with it returns only those projects. (CG-10)
- An administrator becomes a member of a project as anyone else does, through the project's members.
- A read-only token is accepted on read routes only; a read-and-draft token also on draft-change routes.
- A read-and-draft token is decided per project by the owner's role there: it may change a project where its owner is an Editor and only read one where its owner is a Viewer.
- A test route marked person only refuses every token with the reason code and wording "needs a person", and the same route accepts the owner signed in.
- An administrator-only route refuses every token, including an administrator's, with "needs a person".
- A public route accepts a request carrying a token and ignores the token; a reviewer-link route and an update-secret route refuse a token. (CG-22)
- Every draft change made with a token carries an operation identifier, held per token for 24 hours, and a repeated identifier returns the stored result without applying the change again (AD-5). (CG-33)
- An operation identifier carries the time it was made, and its age is measured on the server's clock: one dated more than 5 minutes ahead of the server is refused with "identifier from the future", and one more than 24 hours old is refused with "identifier expired". (CG-33)
- A stored result is kept until 24 hours after its identifier's time, so every identifier still accepted finds its result and a late retry never repeats a change. (CG-33)
- A repeated identifier sent with a different request is refused with "identifier reused".
- A change made with a token is recorded under its owner and the owner's name at that time, with `via` naming the token.
- My account lists the person's tokens with name, kind, projects, expiry, created and last used, and Revoke, whether agent access is on or off.
- A user's detail in Administration lists that user's tokens with Revoke, and the Users table shows a count of active tokens.
- The activity log records token creation, revocation and expiry; an expiry is recorded by an alarm at the expiry time.
- Each activity entry made with a token shows "via agent" and the token's name, and Activity gains an "Agent actions" filter.

**Refusals and edge cases**
- With agent access off, every token request is refused with HTTP 403 and the reason code "agent access is off".
- Turning agent access on again restores the tokens that are neither expired nor revoked.
- A token is refused after it expires or is revoked.
- A token is refused for a project outside its list, and for a project its owner no longer belongs to, from the very next request.
- A role change, deactivation or removal applies to the owner's tokens on the next request, exactly as to a session.
- Deactivating an account revokes all its tokens, and reactivating the account does not bring them back. (CG-27)
- Removing the owner from a project drops that project from the list of every token limited to chosen projects, and adding the owner back does not restore it. (CG-28)
- An unknown, malformed or revoked token is refused with one reason code, "token not accepted", and does not say which.
- A value starting with `ssat_` in a query string is refused with the reason code "token in address" and is never logged.
- A token request is not subject to the origin-and-header rule of sessions, and a session request still is.
- A request that carries both a session cookie and a token is refused. (CG-05)
- A token cannot create a project; the request is refused with "needs a person". (CG-24)
- An expiry that is not later than now, or beyond the installation's maximum, is refused with the reason and the maximum stated.
- Lowering the maximum lifetime shortens every existing token whose expiry is beyond the new maximum, counted from its creation; a token whose new expiry has passed expires at once, and the activity log records each. (CG-20)
- When the maximum is below 90 days, Create token offers the maximum as its default.
- Recovering the whole installation from a backup revokes every token, and revoked tokens stay listed as revoked. (CG-25)
- No log entry, record or export contains a token: a test creates and uses one, then searches the stored log and records for it and finds none.

**Limits and values**
- A token's expiry is 90 days unless changed and at most 1 year, and an administrator can lower the maximum. (CG-02)
- A token starts with `ssat_` and holds at least 32 random bytes. (CG-06)
- A token may make 300 requests a minute, counting each API call made inside an MCP tool call; further requests receive HTTP 429 with `Retry-After`. (CG-04)
- All of one person's tokens together may make 600 requests a minute, and a person may hold at most 10 active tokens, active meaning neither expired nor revoked. (CG-13)
- Creating an eleventh active token is refused with the limit stated.
- After 20 refused token requests in a minute from one network address, further requests from it with an unknown or refused token receive HTTP 429 with `Retry-After`; requests with a valid token are not affected. (CG-14)
- Rate counters are kept in memory, last use is written at most once a minute per token, and the per-address check runs before the installation object is consulted.
- A self-hosted installation takes the client's address from `X-Forwarded-For` only when the request comes from a proxy listed in its configuration, and from the connection otherwise.
- An expired or revoked token stays listed, greyed, for 30 days. (CG-07)

**Access and restore**
- A revision restore leaves tokens and the agent-access setting unchanged.

**Evidence to record**
- The gate's server tests of story 1.7a and story 1.7b are repeated with a read-only token and with a read-and-draft token for each route class and caller case, including a Viewer's token and an administrator's token.

Notes: Story 1.1 declares every route with its schema, and story 1.7a gives every route its class and adds the `via` field; this story adds the caller kind that uses them. It builds on Administration's Users (story 1.8a), the activity log (story 1.9) and Settings (story 1.10a), all earlier in this epic. The API description and the MCP endpoint come in Epic 11. From Epic 2 on, standing rule 2 makes each story test its routes with both kinds of token.
