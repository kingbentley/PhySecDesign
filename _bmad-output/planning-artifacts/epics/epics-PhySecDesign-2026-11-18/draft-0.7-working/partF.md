## Epic 8: Backups and recovery

**Outcome.** Projects and the installation's own data are backed up daily, a project or a whole installation can be recovered, and a project can be moved as a portable backup.

**Depends on.** Epics 1 to 7. The backup and restore checks name records from all of them: revisions, reviewer links and packages (Epic 4), evidence and issues (Epic 5), removed devices and archive state (Epic 6), connections (Epic 7). The Administration area and its Projects table come from story 1.8a and story 1.8c, the activity log from story 1.9, the Records timeline from story 4.1a, the deployment key from story 1.4 and story 2.13c, the Settings screen and the project-creation setting from story 1.10a, and the acceptance-size project and its script from story 2.7b. The self-hosted parts need story 2.13a, story 2.14 and story 2.15. Nothing later.

**Why here.** A backup is only complete once every kind of record exists, and updates in Epic 9 cannot be built until a backup can be taken and restored.

### Story 8.1a: Daily backup of each project and of the installation's data

As an administrator, I want every project and the installation's own data backed up each day through the server, so that a lost store costs at most a day of work.

Covers: FR-34, FR-71, NFR-5, AD-13.

**Core behaviour**
- A complete backup of each project is made at least once every 24 hours into the backup area.
- Each backup has a manifest listing every record file and every file hash.
- The installation's own data is backed up on the same schedule: accounts with password hashes and two-step secrets, roles, memberships, settings with their protected secrets, and the activity log.
- A backup is made through the server from one consistent point of the project's records.
- A server function takes a backup marked "before an update or data conversion".
- Each backup and its outcome appears in the activity log with time and actor (the administrator, or "scheduled").

**Refusals and edge cases**
- A save acknowledged while a backup runs is not lost, and is either wholly in that backup or wholly in the next.
- A backup job interrupted by a server restart continues from its last completed step and finishes without starting again.

**Evidence to record**
- A test backs up a project holding a plan imported from a password-protected PDF, searches the backup for the password and finds none.
- A test backs up the installation's data, searches it for the known test session token, link token, recovery code and password, and finds none in readable form.
- An automated test over the record shapes of the project room and the installation object fails if any has a field for a site system's password or access code. (CF-01)

Notes: Left to later stories: where backups are written and how many are kept (story 8.1b); the Backups screen and Back up now (story 8.1c); the "before an update" backup taken in a real update (story 9.5a and story 9.7b).

### Story 8.1b: Backup area, kept generations and rotation

As an administrator, I want backups kept apart from live data and seven successful daily backups retained, so that losing the live store or one bad backup does not lose the project.

Covers: FR-34, AD-13.

**Core behaviour**
- On Cloudflare the backup area is a second storage bucket, separate from the live bucket and created by the Cloudflare deployment.
- Self-hosted, backups are written to the backup folder set in the Compose file (story 2.14), and to nowhere else.
- Rotation removes a file from the backup area only when no kept generation lists it.
- Rotation removes nothing from a live project or from the activity log.

**Refusals and edge cases**
- A Cloudflare deployment without the second bucket fails with a message naming the missing bucket. (CF-02)
- When the backup area is full or cannot be written, the backup ends as Failed with that reason.
- While the backup area is full, live saves are still acknowledged.
- A failed backup damages and removes no earlier generation, and does not count as one of the seven.

**Limits and values**
- Seven successful daily generations are kept for each project and for the installation's data.
- The backup marked "before an update" of the last successful update is kept until the next successful update, and the one of an attempt under way is kept until that attempt ends; neither is removed by daily rotation. (CF-03)

**Access and restore**
- A revision restore changes no backup generation.

### Story 8.1c: Backups screen and backup status

As an administrator, I want to see the latest backup of everything and start one myself, so that I know backups are succeeding before I rely on them.

Covers: FR-34, FR-70 (Backups), FR-71, AD-13. Screens: S-34, S-31, S-02, S-20.

**Core behaviour**
- Administration gains Backups (S-34), which lists each project and the installation's own data with the latest backup, its age and its outcome.
- An administrator starts a backup of one project or of the installation's data with Back up now.
- The Projects table (S-31) shows each project's latest backup.
- The Overview (S-02) and Records (S-20) show the project's latest backup age to its members.
- A latest successful backup more than 24 hours old is shown as a failure with its age, on S-34 and on the project's Overview.
- A failed backup is shown as a failure with its reason, on S-34 and on the project's Overview.
- Self-hosted, when the backup location is on the same disk as the live data the server still starts, and S-34 shows a warning that a disk failure would lose both.

**Refusals and edge cases**
- Back up now pressed while a backup of the same project is running shows the running job and starts no second one.
- A daily backup that falls due while a manual one runs waits for it, and is skipped if that one succeeded.
- Archiving or un-archiving a project is refused, with the reason, while a backup job for that project is running. (CF-05)
- A backup that falls due while a project is being archived waits for the archive to finish. (CF-05)

**Limits and values**
- The outcome reads Succeeded with its age, Failed, or Never.

**Access and restore**
- A standard user cannot open Backups or call its functions.

### Story 8.2a: Restore a project into a separate copy and check it

As an administrator, I want to restore a project from a backup into a separate copy and see it checked, so that a bad restore never touches the working project.

Covers: FR-34, FR-70 (Backups), NFR-1, AD-13. Screens: S-34.

**Core behaviour**
- An administrator chooses one of a project's kept backups and sees its date and the loss window (the time between that backup and now) before starting.
- The restore builds a separate copy that members cannot see or open.
- While the copy is built, members can open the working project and their saves are acknowledged.
- A backup written at an older data-format version is converted in the copy before it is checked.
- The copy is checked, and each check is listed with its result: record counts against the manifest; device, view and stream identifiers and their relationships; file hashes of originals and previews; named revisions and their snapshots; removed devices; outstanding issues; package volumes and their manifests; and the issued-design designation history.
- A copy that has not been made current is listed on S-34 with its size and can be discarded by an administrator.
- Starting a restore, each failed check and a discarded copy appear in the activity log.

**Refusals and edge cases**
- A backup written at a newer data-format version than the server is refused with an explanation naming both versions.
- If any check fails or the restore is interrupted, the copy is shown as failed and the working project is unchanged.
- Starting another restore for a project that already has a copy asks to replace that copy. (CF-06)
- Archiving or un-archiving a project is refused, with the reason, while a restore job for that project is running. (CF-05)

**Limits and values**
- A project has at most one copy that has not been made current, and it stays until an administrator discards or replaces it. (CF-06)

**Access and restore**
- A standard user cannot start a restore, see a copy or discard one.
- A revision restore in the working project leaves a copy unchanged.

Notes: Left to later stories: making the copy current (story 8.2b); the timed full-size restore (story 8.2c); a portable backup as the source (story 8.4c).

### Story 8.2b: Make the checked copy current

As an administrator, I want to switch to the restored copy only by a deliberate action after every check has passed, so that the working project is replaced knowingly and can be got back.

Covers: FR-34, FR-70 (Backups), FR-71, NFR-1, AD-13. Screens: S-34, S-02, S-20.

**Core behaviour**
- "Make this copy current" is offered once every check of story 8.2a has passed.
- Before confirmation it states that this project's reviewer links are cancelled and must be issued again, and that nobody is signed out.
- When the administrator confirms, writes to the working project stop, and they stay stopped through the switch, so that no save falls between the backup and the switch.
- With writes stopped, a backup of the working project is taken and kept as "before restore". (CF-07)
- After the switch members open the restored project in place of the earlier one.
- After the switch every reviewer link of that project is refused.
- The switch ends no session.
- The switch changes no other project.
- The restored project shows its recovery point and the possible loss window on the Overview and Records.
- The restored project shows no revision, decision or issued designation made after its recovery point.
- The switch appears in the activity log.
- The switch is an entry in the project's Records timeline of story 4.1a, naming the recovery point.

**Refusals and edge cases**
- "Make this copy current" is not offered for a copy with a failed check or an interrupted restore.
- If the "before restore" backup fails or the administrator cancels the switch, the switch does not happen, the working project is unchanged and writes to it resume.
- A save sent from a page that was open before the switch is refused and changes nothing in the restored project. (CF-08)
- That save stays visible on its page as "not saved: project was restored" and is not retried. (CF-08)

**Limits and values**
- The most recent "before restore" backup of each project is kept in addition to the seven daily generations. (CF-07)
- A later restore of the same project replaces it. (CF-07)
- An administrator can discard it. (CF-07)

**Access and restore**
- Only an administrator can make a copy current; a standard user's request is refused by the server.

### Story 8.2c: Experiment R3: time a full-size project restore on both hosts

As Kevin, the product owner, I want a full-size restore timed on each host before recovery is relied on, so that the 60-minute target is known to be reachable or the fallback is chosen early.

Covers: FR-34 (recovery target), experiment R3.

**Core behaviour**
- The fixture script of story 2.7b is extended with an option that adds files to the acceptance-size project until it reaches a stated stored size.
- The restore and switch of story 8.2a and story 8.2b are run on an 8 GiB project made that way, on a deployed Cloudflare test installation and on a self-hosted server.

**Limits and values**
- The target is 60 minutes from starting the restore to a project that opens and acknowledges a save.

**Evidence to record**
- The record states the file kinds and counts of the 8 GiB project.
- Every file added for size has distinct content, and the project's stored size, summed from its backup manifest, is between 7.5 and 8 GiB. (CF-09)
- Each elapsed time is recorded against the target, with the preparation assumed.

Notes: R3's fallback, if the target is missed on either host, is to restore by reference first and copy files in the background (architecture section 12); the decision is recorded with the result.

### Story 8.3a: Recover a whole installation

As an organisation's administrator, I want a written procedure that rebuilds the whole installation from its backups, so that we can recover after losing the server or the account's storage.

Covers: FR-34, FR-71, NFR-5, AD-13.

**Core behaviour**
- A procedure written in the repository, run from outside the interface, rebuilds an installation in an empty destination from the backup area: the installation's own data and every project.
- The procedure states that the deployment key is kept outside the backups, was shown once when it was created, and is needed for recovery.
- The operator supplies the kept deployment key to the destination, as a deployment secret on Cloudflare or as the key file self-hosted, and the destination uses it and generates none. (CF-10)
- After recovery, accounts, roles, memberships and settings are as they were at the recovery point.
- After recovery a user signs in with the password and two-step verification they had at the recovery point.
- After recovery every session that existed before is refused.
- After recovery every reviewer link is refused.
- After recovery every invitation and password-reset link issued before it is refused. (CF-11)
- Administrators see a notice naming the recovery point, stating that passwords, roles, memberships and deactivations are as they were then, and asking them to review users and members changed since.
- Each project shows its own recovery point and possible loss window, as in story 8.2b.
- Each restored project passes the checks of story 8.2a before it can be opened.
- The recovery and its recovery point appear in the recovered installation's activity log.
- The activity log's entries up to the recovery point are intact after recovery.

**Limits and values**
- The notice stays until an administrator dismisses it. (CF-12)

Notes: Left to later stories: recovery without the key and with backups that do not match (story 8.3b); the timed full-size run (story 8.3c); the Cloudflare update token as a stored secret (story 9.7b).

### Story 8.3b: Recovery without the key, and backups that do not match

As an organisation's administrator, I want recovery to finish and tell me what it could not bring back, so that a lost key or a missing backup does not stop us working.

Covers: FR-34, FR-71, NFR-5, AD-13.

**Core behaviour**
- Without the deployment key the procedure completes only when run with a stated option that accepts the loss of stored secrets. (CF-13)
- Run that way, two-step verification is reset for every account. (CF-13)
- Run that way, stored settings secrets (the email and map keys) are cleared and shown in Settings as needing re-entry. (CF-13)
- A recovery without the key is recorded in the activity log.
- Where the installation's data and the project backups do not match, the procedure reports each mismatch and the notice of story 8.3a lists it.

**Refusals and edge cases**
- A restored project that fails a check is listed as not recovered and cannot be opened.
- With one project not recovered, the other projects can be opened and saved to.
- A project in the catalogue with no usable backup is listed as not recovered and cannot be opened. (CF-14)
- A project backup with no catalogue entry is recovered with no members and listed for an administrator to assign. (CF-14)
- Each project not recovered appears in the activity log.

### Story 8.3c: Time a whole-installation recovery on both hosts

As Kevin, the product owner, I want a full-size recovery of an installation timed on each host, so that the recovery target is measured before acceptance.

Covers: FR-34 (recovery target), NFR-7, AD-13.

**Core behaviour**
- The procedure of story 8.3a is run into an isolated destination on Cloudflare and on a self-hosted server, with the installation's data and the 8 GiB project of story 8.2c.

**Limits and values**
- The target is 60 minutes from starting the procedure to a sign-in that works and a project that opens and acknowledges a save.

**Evidence to record**
- Each elapsed time is recorded against the target, with the preparation assumed.
- Each step of the procedure that needed something not written is recorded, the procedure is corrected, and the corrected step is run again.

### Story 8.4a: Create and download a portable backup

As a designer (an Editor), I want to download a complete backup of a project, so that it can be kept outside the system or moved to another installation.

Covers: FR-34, FR-68, FR-71, NFR-5, AD-14.

**Core behaviour**
- An Editor or an administrator starts a portable backup of a project as a job and downloads the result.
- Creating the file and transferring it are shown as separate steps, each with progress and any failure.
- The file holds the project's records, named revisions and snapshots, files, packages with their manifests, issues, removed devices, a manifest with hashes, and the data-format version.
- The file holds no accounts, password hashes, sessions, invitation or reset links, reviewer-link tokens or memberships.
- The names of the people who acted are present in the file as text.
- Creating and downloading each appear in the activity log.

**Refusals and edge cases**
- A failed creation is shown as Failed and can be retried.
- A job interrupted by a server restart continues from its last completed step.
- A request to start a second portable-backup job for a project while one runs shows the running job and starts no other. 
- A portable backup that would be larger than 10 GiB, or of a project over the 8 GiB payload boundary, is not produced: the job stops with the reason and the project is unchanged.

**Limits and values**
- The finished file is kept for download for 24 hours and then removed. (CF-16)

**Access and restore**
- A Viewer's request to create or download a portable backup is refused by the server.
- A revision restore leaves a finished portable backup file unchanged.

**Evidence to record**
- A test makes a portable backup of a project holding a plan imported from a password-protected PDF, searches the file for the password and finds none.

Notes: Left to later stories: importing (story 8.4b); replacing a live project (story 8.4c); the timed full-size runs (story 8.4d).

### Story 8.4b: Import a portable backup as a new project

As a designer (an Editor), I want to bring a portable backup into this or another installation as a new project, so that a project can be moved between hosts without changing anything that is already there.

Covers: FR-34, FR-68, FR-71, FR-51 and FR-63 (kept through a portable backup), NFR-1, NFR-7, AD-14.

**Core behaviour**
- Importing a portable backup is offered to whoever may create projects: administrators, and standard users when the setting of story 1.10a allows it.
- An import creates a new project and changes no existing one.
- The new project is given a new project identity and records the identity of its source. (CF-17)
- A standard user who imports becomes the new project's Editor, and no other member is added. (CF-18)
- Before any project is created the upload is validated: the manifest is read and every hash is checked.
- A backup written at an older data-format version is converted during import.
- In the imported project, device, view and stream identifiers and their relationships, revisions, evidence, removed devices, issues, pan/tilt/zoom positions, limits and home marks, closets and port schedules, and package files are the same as in the source.
- A retained package in the imported project downloads byte for byte as in the source.
- In the imported project the actors' names show as recorded and are linked to no account.
- Approval assignments made to accounts arrive unassigned.
- No reviewer link from the source works in the imported project.
- Each import appears in the activity log.

**Refusals and edge cases**
- A file that is corrupt, truncated or not a portable backup is refused with the reason, and no project appears in any list.
- A container over 10 GiB is refused with the limit named.
- A container within that limit whose uncompressed project payload is over 8 GiB is refused during validation with the limit named.
- A backup written at a newer data-format version than the installation is refused with an explanation naming both versions.
- An import that fails or is interrupted after validation leaves no partial project; the importer sees Failed and can start again.
- A PDF or CSV export chosen at import is refused with the reason, and neither is offered as a backup anywhere.

### Story 8.4c: Replace a live project from a portable backup

As an administrator, I want to replace a live project from a portable backup through the same checked copy and deliberate switch, so that a replacement is as safe as a restore.

Covers: FR-34, FR-68, FR-70 (Backups), FR-71, AD-14. Screens: S-34.

**Core behaviour**
- An administrator uploads a portable backup as the source for the restore flow of story 8.2a and story 8.2b: a separate copy, the same listed checks, the "before restore" backup and a deliberate "Make this copy current".
- The upload is validated as in story 8.4b before the copy is built.
- After the switch the project keeps its own identity and its members. (CF-19)
- Each replacement appears in the activity log.

**Refusals and edge cases**
- A replacement is refused before the copy is built when the backup's project identity is not the live project's own, with the advice to import it as a new project. (CF-20)

**Access and restore**
- Replacing a live project is offered only to an administrator; an Editor's request is refused by the server.

### Story 8.4d: Experiment R5 and moving a project between hosts

As Kevin, the product owner, I want a full-size portable backup built, checked and restored on each host and moved between them, so that the one-file format is known to work at the limit.

Covers: FR-34, NFR-7, AD-14, experiment R5.

**Core behaviour**
- A portable backup of the 8 GiB project of story 8.2c is built, validated and restored on Cloudflare and on a self-hosted server, three times each.
- A portable backup made on a self-hosted installation imports on a Cloudflare test installation of the same version and passes the checks of story 8.4b.
- A portable backup made on Cloudflare imports on a self-hosted installation of the same version and passes the same checks.

**Limits and values**
- Creation completes within 10 minutes.
- Validation and restoration after upload complete within 15 minutes.

**Evidence to record**
- Every run's creation, validation and restoration times are recorded, with transfer times recorded separately.

Notes: R5's fallback, if one ZIP cannot be built in alarm-driven steps, is numbered parts with a manifest (architecture section 12); the decision is recorded with the result.

### Story 8.5: Limits and usage

As a designer (an Editor), I want to see how much of the storage budget a project uses and be warned before I exceed it, so that a large job fails safely and never damages saved work.

Covers: acceptance table for files and project content; FR-34 (backup storage separate from the budget); FR-70 (limits shown). Screens: S-20, S-31, S-33.

**Core behaviour**
- Members see the project's current usage against the 8 GiB budget on Records.
- The count includes originals, previews, distinct older files, records and history, and retained package editions.
- The count excludes backups, portable backup files held for download, unfinished uploads that are later discarded, and the stored parts of a package edition that failed or was abandoned.
- The Projects table in Administration (S-31) shows each project's stored size.
- Settings gains a Limits group showing each storage limit and current usage as read-only values, with no control to raise them.
- Before an upload or an inventory import starts, the server compares its declared size with the remaining budget; if it would exceed the budget, the user sees a warning naming the limit and the amount over, and nothing is sent.
- When a portable-backup import is admitted, its declared container size is checked against the 10 GiB container limit, not against the 8 GiB project budget. Over that limit the user sees a warning naming the limit and the amount over, and nothing is sent.
- The uncompressed project payload of a portable backup is checked against the 8 GiB project budget during validation (story 8.4b).
- A valid 8 GiB project in a container between 8 GiB and 10 GiB is not refused at admission.
- A package generation, which has no size until it has run, fails with the limit named when it reaches the remaining budget, and its stored parts are discarded. (CF-21)
- A warning is shown on Records, and to administrators on S-31, when a project's usage reaches 90% of the budget. (CF-22)

**Refusals and edge cases**
- Of two uploads started together that would jointly exceed the budget, the later one is refused before sending and the earlier one completes.
- After an operation is refused for a limit, the project's records, files and history are the same as before it.
- An export that cannot complete within a limit is shown as Failed and is never delivered truncated.
- A project at its budget can still be opened, searched, exported, backed up and downloaded as a portable backup.

**Limits and values**
- The project budget is 8 GiB of retained content, with 1 GiB = 1024 MiB.

## Epic 9: Install from published instructions and update from the interface

**Outcome.** Anyone can install Site Studio on either host from published instructions, and an administrator can install a new signed release with one action and get the earlier version back if it fails.

**Depends on.** The version rule that every update relies on is in story 1.1, so that the first release already obeys it. Story 9.1 needs story 1.2, story 1.4, story 1.8d, story 2.13a, story 2.13b, story 2.13c, story 2.14, story 2.15, story 8.1b and story 8.3a. Story 9.2 needs story 1.1, story 2.13a, story 2.13d and story 9.1. Story 9.3a needs story 1.1, story 1.9 and all of Epic 8, because the update record follows the pre-update backup; story 9.3b needs story 9.3a, all of Epic 8 and story 4.7a; story 9.3c needs story 9.2, story 9.3a and story 9.3b. Story 9.4 needs story 1.8a, story 1.9 and story 9.2. Story 9.5a to story 9.7d need all of Epic 8 and story 9.2 to story 9.4, because an update takes a backup first and restores it on failure; story 9.7a and story 9.7b also need the failure warning of story 9.6a; story 9.7b also needs the settings secrets of story 1.10a. The first release published for organisations is cut only after story 9.6a self-hosted and story 9.7b on Cloudflare, because it must act as the version before in their first update. Nothing later.

**Why here.** Updating safely needs the backup and restore of Epic 8, and the instructions can only be written and followed once both hosts and their backups exist.

### Story 9.1: Published installation instructions

As an organisation's administrator, I want installation instructions I can follow without help, so that I can bring up Site Studio on our own server or our own Cloudflare account.

Covers: FR-66 (instructions), SM-6.

**Core behaviour**
- Instructions for installing are published in the repository for a self-hosted server and for a Cloudflare account.
- They state which servers are supported: a Linux machine with Docker, x64 or arm64, virtual or physical.
- They state which kinds of disk are supported and unsupported, from the R12 results of story 2.15.
- They state what is not supported (no Docker, Windows Server, Kubernetes) and that Cloudflare needs the Workers Paid plan.
- The self-hosted instructions cover: getting the image and Compose file, HTTPS by the bundled web server or by the operator's own proxy with the trusted-proxy setting, the live and backup folder settings and why the backup folder should be on another disk or machine, the deployment key file and keeping a copy off the server, where the one-time set-up code appears, and, for SMTP, the deployment setting of story 1.10d for a mail server on a private network or with a private certificate authority, and where the server log shows why a secure connection failed.
- The Cloudflare instructions cover: deploying from the organisation's own copy of the repository, the two storage buckets the deployment creates, the deployment key of story 1.4 and keeping it outside the Cloudflare account, and where the one-time set-up code appears.
- Both sets name the command that issues a one-time recovery code for a locked-out sole administrator (story 1.8d on Cloudflare, story 2.13c self-hosted), and the recovery procedure of story 8.3a.

**Evidence to record**
- A person who has not seen the project follows the self-hosted instructions on a fresh server, using nothing else, and reaches a working sign-in page over HTTPS, completes the set-up step, and sees a plain HTTP request redirected or refused.
- The same person follows the Cloudflare instructions on a fresh Cloudflare account to the same result.
- Each place where that person got stuck or needed something not written is recorded, the instructions are corrected, and the corrected step is followed again successfully.
- Two installations made from the instructions share no users, projects or files: an account of one cannot sign in to the other, and a file address from one is refused by the other.

Notes: Left to later stories: naming the published image in place of one built from the repository (story 9.2); instructions for updating a self-hosted server (story 9.5c) and a Cloudflare installation (story 9.7c).

### Story 9.2: Signed public releases

As Kevin, I want a release produced the same way every time, so that installations can trust what they install.

Covers: FR-72 (publication), FR-66 (instructions name the release), AD-19.

**Core behaviour**
- Pushing a version tag starts a workflow that runs the test suite and builds the one Worker bundle and, from that bundle and the pinned runtime, the Docker image for x64 and arm64.
- The workflow runs the self-hosted smoke suite of story 2.13d against the image it built.
- The workflow signs the bundle and the image and publishes a release with its version number and notes.
- The image is published to GitHub's container registry under the same version.
- Verifying a published bundle or image against this repository's release workflow succeeds.
- Each release states the data-format version it needs, the runtime version it pins, and whether it changes a Durable Object class.
- The installation instructions of story 9.1 name the published image and release.
- The workflow can also publish to a test channel, marked by a tag prefix and signed by the same workflow; an installation offers and installs test-channel releases only when configured for that channel.

**Refusals and edge cases**
- If the tests or the smoke suite fail, nothing is signed or published.
- The same verification fails on a build made any other way, and on a published file altered by one byte.

**Evidence to record**
- A fresh self-hosted install from the published image reaches the sign-in page.
- The test channel holds fixture releases N, N+1 and N+2, each adding a data conversion, and deliberately broken variants for the failure tests, all signed by the release workflow.
- Before the repository is made public for the first release (K15), its history is searched for secrets and private files and the result is recorded.

Notes: Signing is keyless (K14).

### Story 9.3a: The update record and one version at a time

As an administrator, I want the server to keep one record of an update under way and let only one version act on our data, so that old and new code never both change it and an update can always be finished or undone.

Covers: NFR-8, FR-72, FR-21, AD-12, AD-17, AD-20.

**Core behaviour**
- The update record is a table of its own inside the installation object, in a layout every released version reads. It holds the attempt identifier, the version before and the version being installed, how to reach the version before (its image digest or its Cloudflare version), where the pre-update backup is, a state, a step number, the time at which changes stop, when the version being installed first arrived, and the update's step entries.
- The states are stopping, prepared, installing and returning. Every change of state takes the next number from a step counter kept beside the record, which is never reset, so a new attempt starts above every step number already issued.
- Stopping is written when an administrator starts an update. The time at which changes stop is set when the users' warning begins, and from that time every object refuses changes.
- While the record is stopping, during the warning or the backup, an administrator can cancel, which removes the record and accepts changes again.
- Prepared follows only when the complete pre-update backup has succeeded. A failed backup removes the record and changes are accepted again; a backup interrupted by a restart resumes as a job.
- Installing is set in one step, in which the installation, asked whether an attempt stands, answers yes only if a prepared record exists whose identifier and version being installed both match the question.
- Asked again for the same attempt while the record is installing and before the version being installed has arrived, the installation gives the same yes and returns the way back it stored at the first yes, ignoring any new one.
- A prepared record can be withdrawn, which removes it and accepts changes again at once. An installing record cannot be withdrawn.
- While a record exists, the entry code passes its state and step number with every call.
- Only one version acts: the version before while the record is stopping, prepared or returning, and the version being installed while it is installing. Entry code of the other version answers "updating", and an object of the other version refuses and stops itself as in story 1.1.
- The version before may end an installing attempt in two ways only, and both only set the record to returning: its arrival deadline, while the version being installed has not arrived, and an authenticated request to return for that attempt.
- A read of the record's state is the first call marked version-independent under story 1.1: the installation object answers it from either version, and a test calls it with another version and finds the same start identifier afterwards.
- Entry code that finds a record it may not act on answers "updating" on a public notice that needs no sign-in. When the deployed version may not act in the record's current state, the notice gives the steps to deploy the version that may.
- The calls that ask whether an attempt stands, read its state, report arrival, report a refused signature and ask for a return carry the update secret. They are a fourth kind of route, checked by the access gate, and their log entries name the update workflow or the updater as the actor, with the attempt identifier.
- On Cloudflare the installation creates the update secret on first use, keeps it encrypted as the settings secrets of story 1.10a are, and shows it once to an administrator to copy into the organisation's repository; an administrator can replace it. Self-hosted, the update secret is the updater's shared secret.
- The update's step entries are kept in the record's table and copied into the activity log when the attempt ends.
- Beside the step counter the installation keeps every attempt's outcome: succeeded, returned or withdrawn. A question about an attempt whose record has gone is answered with that outcome.

**Refusals and edge cases**
- From the time changes stop until the record is removed, the only writes accepted are to the record, its counter and the attempt outcomes, to each object's update bookkeeping, the pre-update backup's own job, progress, catalogue and file writes, conversions and restores, the update's step entries, the health check's test save, and the ending of a session.
- A second update is refused while any record exists.
- While a record exists, idle time does not count towards a session's expiry.
- A session ended while a record exists is noted in the update bookkeeping and ended again after any restore of the installation's data.
- A prepared record not followed by a yes within 30 minutes is withdrawn by the installation itself, and the attempt is logged as "no result". (CF-41)
- In the step that sets installing, the installation object sets an arrival deadline 10 minutes after the yes. If it passes before the version being installed has reached the installation object, by a call or by an alarm, the installation, still running the version before, sets the record to returning itself. (CF-40)
- After arrival, the installation keeps its own deadline equal to the time limit after the yes, and sets the record to returning itself when it passes. (CF-42)
- A stopping record whose backup has not finished within that same time limit is removed and changes are accepted again; a returning record that has not finished within it shows the failed-return warning. (CF-42)
- Each object keeps the highest step number it has acted under, and the time it last stopped itself, in an update-bookkeeping table that no conversion touches and no restore replaces.
- The installation object's schedule of due times, from story 1.1, gains the arrival deadline, the update steps and the time limits. Every due time an update sets carries its attempt and step number, does nothing when they no longer match the record, and is removed when the record changes state; the schedule is kept apart from restored data.
- Alarm-driven work does nothing while a record exists, except the update's own backup, conversion and return steps run by the version allowed to act, and the arrival deadline run by the version before. Work that cannot read the record treats it as present and only sets its alarm again.
- A call to an update function without the update secret is refused and logged; a test shows that the attempt identifier alone is refused.
- Routes that set an update record directly exist only in test builds, and a test fails if a release bundle has one.
- A command in release builds, authenticated by the update secret and the deployment key, ends a stuck installing or returning record once the administrator has recovered by hand as the failed-return warning describes, and logs it.
- The prepared time limit, and the removal of a stopping record, run under either version, because they touch only the record.
- No restore replaces the update record or its counter: a test restores the installation's data from a backup taken before a record existed and then reads the record and the counter intact.
- An object running the version being installed converts nothing unless the record is installing; with no record it refuses older data as in story 1.1.
- A server that finds data newer than itself and no record refuses to open it, and its explanation names both versions.

**Access and restore**
- A revision restore leaves the update record, its counter, the attempt outcomes and every object's update bookkeeping unchanged.

Notes: In this story the record and the two versions are set up by tests. The design is K20 with its refinements K21, both confirmed by Kevin, and the additions K22 (AD-20). It replaces the pending-update marker and its hold of earlier drafts. Left to later stories: conversions, the return and the health check (story 9.3b); writing and ending the record in a real update (story 9.5a and story 9.6a self-hosted, story 9.7a and story 9.7b on Cloudflare). That sign-in is not offered during an update is in story 9.5b.

### Story 9.3b: Data conversions, the health check and the way back to backed-up data

As an administrator, I want stored data converted safely when a new version needs a different shape, and put back by the server itself if the update fails, so that an update never leaves projects unreadable, half converted or lost.

Covers: NFR-8, FR-72 (any earlier version to the latest; return), AD-3, AD-20.

**Core behaviour**
- The server carries every conversion since the first release: data at any earlier data-format version converts to the current one in one update, by applying each conversion in order.
- A test for each earlier data-format version compares the converted result with expected records.
- Each object converts its own data: a project room, or the installation object, records the new data-format version in the same transaction of its own store as the conversion's last write.
- An object converts only when it runs the version being installed and is called, or runs its own alarm-driven update step, while the update record is installing; no conversion spans two objects.
- A conversion too large for one transaction builds its result in side tables over several steps and switches to them in one transaction, so the live tables are never part-converted.
- The installation object drives the conversion: it converts its own data, then calls every project in the catalogue in turn in alarm-driven steps, so that projects nobody opens are converted too, and reports the result for each.
- Projects recorded as not recovered are skipped and listed in the result.
- The installation offers a health check: the sign-in route answers through the version being installed, naming that version, in a check mode that writes no session; the first active project opens or, with none, a health-check project room that holds no user data; and a test save to a health-check record is acknowledged.
- An update succeeds only when every project and the installation's own data have converted and the health check has passed. The installation object then, in one transaction of its store, copies the step entries into the activity log, records the outcome, removes the record and accepts changes again.
- An object running the version before, called while the record is returning, restores its own records from the pre-update backup if its data is in the newer format, and does nothing if it is not.
- A restore is built in side tables over as many steps as it needs and switched in one transaction, which also sets the data-format version back.
- The installation object drives the return: it restores its own data, calls every project and the health-check room in turn, and then, in one transaction, copies the step entries and the failed attempt into the activity log, records the outcome, removes the record and accepts changes again.
- A project restore copy not yet made current, or an imported project, whose data is at an older data-format version converts its own data with the same conversions before it is opened, outside any update record, and is never live while it converts.

**Refusals and edge cases**
- A conversion made to fail part-way leaves that project's live records exactly as they were, at their earlier version.
- If the conversion of any project or of the installation's data fails, the conversion is reported as failed, names the project, and no project is opened for normal use.
- An interrupted conversion or restore that uses side tables starts its steps again and ends with the same result.
- A project that refuses a call because of a version difference is called again after 35 seconds, up to 3 times, before it counts as failed. (CF-43)
- A call carrying a lower step number than the object has acted under is refused before any work.
- A conversion or restore switch checks in the same transaction that the record's step number is still the highest the object has seen, and a call carrying a higher one makes the object discard side tables built under a lower one.
- A test runs a return, then a conversion under a higher step number, then a second return: every project and the installation's own data end at the pre-update backup, none part-restored or part-converted.
- A test runs two update attempts in a row and finds the second attempt's conversions accepted by every object.
- A return removes and overwrites no file.
- If the return cannot be completed, the installation keeps refusing changes, says plainly that the return did not complete, shows the manual steps, and never reports success.
- An update cannot start while a project restore copy has not been made current, and Update says why.
- No conversion of the installation's data changes the update record, its counter or any update bookkeeping, and a test fails if one does.
- The test suite fails if a data-format version has no conversion and conversion test.
- A test compares the Durable Object classes in the deployment configuration with the two fixed in story 1.1 and fails if a class is added, renamed or removed, unless the release is marked as changing a class.

**Access and restore**
- A revision restore leaves the health-check record and the health-check project room unchanged; neither holds user data.

Notes: Before a second release exists, these criteria are exercised with test conversions and an update record set by a test build, on the runner of story 1.1. The pre-update backup is the "before an update" backup of story 8.1a.

### Story 9.3c: Experiment R14: a new runtime reads the previous release's data

As Kevin, I want every release checked against data written by the one before, so that a runtime upgrade that cannot read existing data is never published.

Covers: NFR-8, AD-20, experiment R14.

**Core behaviour**
- The release workflow of story 9.2 starts the new image, with its pinned runtime, against a data folder written by the previous release, and confirms that it opens the data, refuses it as not yet updated, fires an alarm set under the previous release, and reads the installation's own data.
- A test build made from the same commit and runtime converts the same data under an update record set by a test, and the result matches the expected records.

**Refusals and edge cases**
- A release that fails this check is not published.

**Evidence to record**
- Before a second release exists, the check is run with a data folder written by an earlier tagged build and a test conversion, and the result is recorded.

### Story 9.4: Installed version and update check

As an administrator, I want to see which version is installed and whether a newer one exists, so that I can decide when to update.

Covers: FR-72 (version, check), FR-71, AD-21. Screens: S-35, S-28.

**Core behaviour**
- Administrators see the installed version, when it was installed and when updates were last checked, on Software (S-35).
- The installation reads the public release list at least once every 24 hours while running, and when an administrator presses Check now.
- With a newer release published, administrators see its version and release notes on S-35.
- With a newer release published, administrators see an update-available dot on Administration in the account menu, on every page including the Projects list (S-28).
- An administrator can turn the check off and on.
- With the check turned off, nothing contacts the release list and the installed version is still shown.
- Turning the check on or off appears in the activity log.

**Refusals and edge cases**
- A release is offered only if its version is higher than the installed one. (CF-25)
- An installed version that is newer than, or absent from, the list shows "Up to date" with no offer to install an older release. (CF-25)
- A check that fails or reads a malformed list shows the time and reason of the failure, keeps the result of the last successful check, and raises no update-available dot of its own. (CF-26)

**Limits and values**
- With the check turned off, S-35 reads "Update checks are off".

**Access and restore**
- A standard user sees no version notice, no dot and no Update control, and a direct call to the software functions is refused.
- A project revision restore leaves the update-check setting unchanged.

**Evidence to record**
- A test captures the check request and finds only the public address and standard headers: no project data, no user data and nothing identifying the installation.

Notes: Left to later stories: the Update control (story 9.5a self-hosted, story 9.7b on Cloudflare); the manual steps shown beside "Update checks are off" (story 9.5c and story 9.7c).

### Story 9.5a: Update a self-hosted installation with one action

As an administrator of a self-hosted installation, I want to install a new release with one action, so that updating needs no command line and loses no saved work.

Covers: FR-72, NFR-8, FR-71, AD-20, AD-21. Screens: S-35.

**Core behaviour**
- With a newer release available, S-35 shows what the update will do in order, an estimate of how long changes will be stopped, taken from the stored size and the duration of the last backup, and Update now; nothing installs without that action.
- The Compose file gains the updater container, the only part allowed to start and stop containers.
- The application reaches the updater over a private connection protected by a shared secret, which is also the update secret of story 9.3a.
- On Update now, the installation writes the update record as stopping and gives the updater the attempt identifier and the release. The updater verifies the image's signature and pulls the image by its digest before any user is warned. The stop time is set only when the updater has reported the image verified and pulled; if the updater cannot be reached, the record is removed and the refusal is shown before any warning.
- Then: signed-in users are warned; at the stop time changes of every kind stop; a complete backup of every project and of the installation's data is taken as the "before an update" backup of story 8.1a; the record becomes prepared; the updater asks whether the attempt stands, giving its identifier, the version and the running image's digest, which the installation stores as the way back while setting the record to installing; the updater removes the old container and then starts the new one by digest; under the new version the installation converts every project and its own data and runs the health check of story 9.3b; the updater waits until the installation reports success or failure.
- The administrator's S-35 shows the progress list (signature checked, backup taken, new version installed, data converted, checked), each step done, in progress or waiting.
- After a successful update S-35 shows the new version and a link to its notes, and every project opens with its data intact.
- An installation two releases behind updates directly to the latest in one update, with its data converted.
- The update, each step and its outcome are recorded in the activity log with the administrator who started it.

**Refusals and edge cases**
- The updater refuses a version that is not from the configured repository and channel.
- A release with a bad signature, or an image that cannot be pulled, is refused before users are warned: the record is removed, nothing is installed, and the refusal is shown and logged.
- The updater starts exactly the digest it verified; a tag pointed elsewhere after the check is not used.
- If its yes is refused, or no record exists for its attempt, the updater ends without touching any container and discards the attempt; it waits for a yes no longer than the prepared time limit of story 9.3a.
- The application container has no restart policy that could start a replaced image again.
- If the backup fails, the record is removed, nothing is installed, changes are accepted again, and the failure is shown and logged.
- While an update, a backup or a restore job runs, Update, Back up now and Restore are disabled with the reason, and a second administrator's request to update is refused by the server. (CF-27)
- A daily backup that falls due during an update does not start until the update has finished. (CF-27)

**Limits and values**
- The updater's time limit after the yes is three times the estimate shown on S-35, at least 30 minutes and at most 5 hours. (CF-42)

**Access and restore**
- Only an administrator can use Update now; a standard user's direct call is refused.

Notes: Left to later stories: what signed-in users and open pages see (story 9.5b); the command line and the update instructions (story 9.5c); a failure after installation has begun (story 9.6a). The releases for "two releases behind" come from the test channel of story 9.2.

### Story 9.5b: What people see while an update runs

As a designer, I want to be warned before an update and to keep my unsaved work through it, so that an update interrupts me without costing me anything.

Covers: FR-72, FR-21, NFR-2, NFR-8, AD-20, UX decision D13. Screens: S-35, S-26.

**Core behaviour**
- Signed-in users see a banner before saving stops.
- During the warning or the backup an administrator can cancel the update on S-35, which removes the update record, clears the banner and accepts changes again.
- While the update runs, every page shows a full-page "Updating" notice, which clears by itself when the update ends; an administrator's S-35 shows the progress list instead. (CF-45)
- A page that was open during the update still holds its unsaved edits afterwards and submits them.
- An edit answered "updating" stays unsaved and is sent again automatically when the update ends, as after a lost connection.
- A page that was warned shows the Updating notice while the server cannot be reached.

**Refusals and edge cases**
- No save, upload, administrative change or reviewer-link decision is acknowledged between the time changes stop and the end of the update or of its return.
- While changes are stopped, sign-in is not offered: the sign-in page shows the Updating notice. (CF-28)
- While changes are stopped, existing sessions stay valid, and idle time does not count towards their expiry.
- Signing out during an update ends the session.
- While changes are stopped, no activity-log entry other than the update's own is written.
- An edit the new version cannot accept stays listed as not saved with its content readable. (CF-29)
- After such an edit the page asks the user to reload and does not reload by itself. (CF-29)

**Limits and values**
- The banner appears two minutes before saving stops and reads "An update starts in 2 minutes. Your unsaved work will be kept on this page."
- An edit the new version cannot accept reads "not saved: this edit does not fit the updated version of Site Studio". (CF-46)

**Evidence to record**
- A test that sends saves throughout an update finds every acknowledged one present afterwards.
- A test with a 15-minute session period across a 20-minute update finds the session still valid afterwards.

### Story 9.5c: Self-hosted update from the command line, and the update instructions

As an administrator of a self-hosted installation, I want the same update available from a command line and written instructions for both ways, so that I can update when the interface is not the right tool.

Covers: FR-72, FR-66 (instructions), AD-21. Screens: S-35.

**Core behaviour**
- The steps of story 9.5a can be run from a command line on the server and produce the same result and the same activity-log entries.
- Published instructions for updating a self-hosted installation cover adding the updater container to an existing Compose file, Update now, the command-line equivalent and what users will see.
- With update checks turned off, S-35 on a self-hosted installation shows the command-line steps to update to a named release.

**Evidence to record**
- A person follows the instructions on a test server from one published release to the next, and each place they got stuck is recorded and corrected.

### Story 9.6a: When a self-hosted update fails

As an administrator of a self-hosted installation, I want a failed update to put back the earlier version and its data and tell me so, so that a bad release never leaves us without a working system.

Covers: FR-72 (return), NFR-8, FR-71, AD-20, AD-21. Screens: S-35.

**Core behaviour**
- If installing, converting or the health check fails, or the time limit passes, the updater asks the installation to return, presenting the attempt identifier and the update secret. Once the installation confirms that the record is returning, the updater stops the new container and starts the earlier image by its recorded digest. The updater restores nothing itself.
- If the installation answers, by the record or by the attempt's recorded outcome, that the update has succeeded, the updater ends without starting the earlier image.
- If no container answers the request to return within 60 seconds, the updater starts the earlier image by its recorded digest and repeats the request, which the version before accepts while the record is installing; if that version finds the attempt recorded as succeeded, the updater starts the new image again. (CF-47)
- The earlier version restores what was converted, as in story 9.3b, and reports that the data is back. The updater waits for that report.
- The updater then reports the outcome: S-35 shows which step failed and a plain statement that the earlier version and its data are running again.
- A conversion failure for any one project fails the update and returns the whole installation; no project is left at the new version.
- After a return, every save acknowledged before the update is present, and changes are accepted again.
- After a return, the activity log holds the update's step entries and the failed attempt.
- The published update instructions describe going back by hand after an update that passed its checks and was found broken later: install the earlier version and restore the pre-update backup from the command line, with the statement that changes made since the update are lost. (CF-30)

**Refusals and edge cases**
- If the return itself fails, S-35 and the sign-in page show a prominent warning that never reads as success.
- That warning states what condition the installation is in and shows the command-line steps to recover by hand.
- The updater records each step durably before starting it.
- After the server loses power or the updater is killed while the record is stopping, the backup resumes on restart; while the record is prepared, the updater asks on restart for the record to be withdrawn, changes are accepted again, and the attempt is logged as interrupted. (CF-31)
- After the server loses power or the updater is killed once the record is installing or returning, the updater decides on restart from its step log and the record: with the record returning, it starts the earlier image; with the record installing and the new image started, it starts the new image and the update continues, returning only on failure; with the new image never started, the arrival deadline returns the installation. (CF-31)
- If the updater stops after its yes and never swaps the image, the arrival deadline sets the record to returning and, with its data unchanged, the installation removes the record and accepts changes again.
- The installation is never left refusing changes with no update running.

**Evidence to record**
- The procedure for going back by hand is run once on a test server and works.

### Story 9.6b: Experiment R11, self-hosted: break an update at every step

As Kevin, I want a self-hosted update broken at each step and the outcome recorded, so that the Update control is released only when every failure returns cleanly.

Covers: FR-72 (return), NFR-8, experiment R11.

**Core behaviour**
- On a test server an update is broken at each step in turn: the signature, an image that cannot be pulled, a cancel during the warning, the backup, the updater stopped during the backup, the updater stopped after its yes and before the swap, the image swap, the conversion of one project, each part of the health check, the time limit passing just as the update succeeds, the return, no container answering the request to return, a power loss during the return, a cancel during the backup, and a forced kill between each pair of steps.
- Two updates are run one after the other, and the second succeeds.

**Evidence to record**
- The observed outcome of each case is recorded and matches the criteria of story 9.5a and story 9.6a.
- After each return, a user signed in before the update continues without signing in again, and a reviewer link issued before it still opens.
- On an installation at the acceptance size, how long changes stay stopped is measured for a successful update and for a return, split into backup, conversion and restore, and compared with the estimate shown on S-35.
- The time from the yes to the new container answering is measured, and the arrival deadline is confirmed to exceed it with margin.

Notes: R11's fallback is to hold back the release of the Update control until every step returns cleanly. The releases come from the test channel of story 9.2; any used as the version before are built from a commit that contains story 9.3a to story 9.6a. The Cloudflare part of R11 is story 9.7d.

### Story 9.7a: The Cloudflare update workflow

As an administrator of a Cloudflare installation, I want our own deployment of a release to check it, install it and roll back by itself, so that updating on Cloudflare is as safe as on our own server.

Covers: FR-72, NFR-8, FR-71, AD-20, AD-21, experiments R10 and R11.

**Core behaviour**
- The organisation's copy of the repository contains an update workflow that is started with the name of the release to install and the identifier of the attempt it is started for.
- The update secret of story 9.3a, copied by an administrator into the organisation's repository, is presented by the workflow on every call to the installation.
- The workflow, not the Worker, verifies the release's signature, and does so before it deploys anything.
- Immediately before deploying, the workflow notes the Cloudflare version now deployed and asks the installation whether its attempt still stands, presenting the identifier, the release and that version. The installation answers yes only for a prepared record with the same identifier and release, and in the same step sets it to installing and stores that version as the way back. (CF-32)
- With a yes, the workflow deploys the release in Cloudflare's `immediate` code-update mode, so that running Durable Objects are replaced at once.
- Under the new version the installation object converts every project and its own data and runs the health check of story 9.3b. The workflow asks the installation for the state of the update until it reports success or failure, and treats "updating" and version refusals as not finished.
- On success the record is removed and S-35 shows the new version.
- If the conversion of any project or the health check fails, or the time limit passes, the workflow asks the installation to return. Once the installation confirms that the record is returning, the workflow redeploys the stored version with Cloudflare's rollback in `immediate` mode or, if the rollback cannot do that, deploys that release's bundle in `immediate` mode.
- The earlier version restores what was converted, as in story 9.3b, removes the record, accepts changes again and records the failed attempt in the activity log.

**Refusals and edge cases**
- With a bad signature the workflow deploys nothing and reports the refusal to the installation with its identifier; the installation withdraws only a prepared record with that identifier and release, accepts changes again, and shows and logs the refusal.
- If no prepared record with the same identifier and release exists, the workflow deploys nothing and ends. (CF-32)
- A run started for a withdrawn attempt deploys nothing even when a newer record names the same release, because its identifier does not match.
- If the reply to its question is lost, the workflow asks again and receives the same yes and the way back stored at the first.
- If the installation answers, by the record or by the attempt's recorded outcome, that the update has succeeded, the workflow ends without a rollback.
- If the installation cannot be reached to confirm a return, the workflow redeploys the stored version and repeats the request to return, which the version before accepts while the record is installing; if that version finds the attempt recorded as succeeded, the workflow deploys the release again.
- If, after deploying, the workflow finds its attempt returning or recorded as returned, it redeploys the stored version itself; an attempt recorded as succeeded is left alone.
- With its class-change input, the workflow never asks for a return and never redeploys an earlier version; the record carries a class-change flag under which the installation never sets returning by itself, and on a failure the public notice shows the recovery from the pre-update backup.
- If the run stops after its yes and before deploying, the arrival deadline makes the installation, still running the version before, set the record to returning, remove it and accept changes again.
- A deployment of the new version that lands after that finds no record and data in an older format, refuses requests as in story 1.1, and its refusal shows the steps to redeploy the previous release.
- If the run deploys the new version and then stops, the installation object completes the conversions and the health check by itself under the new version, an alarm under the new version counting as its arrival, and removes the record on success.
- If that conversion or health check fails with no run left to roll back, the installation sets the record to returning, and the public "updating" notice of story 9.3a gives the steps to redeploy the previous release, after which the earlier version completes the return.
- If the rollback or the restore cannot be completed, the installation shows the warning of story 9.6a with Cloudflare deployment steps to recover by hand, and never reports success.

**Limits and values**
- The workflow's time limit runs from the yes, includes the deployment, and is three times the estimate shown on S-35, at least 30 minutes and at most 5 hours. (CF-42)

**Evidence to record**
- On a deployed Cloudflare test installation, the redeployment rule of story 1.2 and story 1.4 holds for a deployment by the workflow: after an update a user with two-step verification signs in with a current code, and a settings secret saved before the update still works.
- All criteria here are tested on a deployed Cloudflare test installation, with runs started by hand in GitHub and the record set by a test build.

Notes: Experiment R10, run on 2026-11-18, found that a deploy hook cannot name a version, so AD-21 chose the workflow run; it also found that Cloudflare's rollback never undoes data changes. The first part of R11 found that a deployment in `immediate` mode replaced a busy object in about 2 seconds; whether a rollback accepts that mode is untried (story 9.7d). Left to later stories: starting the run from the interface (story 9.7b); manual steps and releases that change a Durable Object class (story 9.7c).

### Story 9.7b: Update a Cloudflare installation with one action

As an administrator of a Cloudflare installation, I want Update to start our own deployment of the new release, so that updating needs one action and no visit to GitHub.

Covers: FR-72, NFR-8, FR-70 (Settings), FR-71, AD-17, AD-20, AD-21, experiment R16. Screens: S-35, S-33.

**Core behaviour**
- An administrator stores a GitHub token for the organisation's copy of the repository in Settings.
- The token is kept as the other settings secrets of story 1.10a are: encrypted and showing only its last 4 characters.
- Saving or replacing the token is logged without its value.
- A recovery without the deployment key (story 8.3b) clears the token with the other stored secrets.
- With a newer release and a stored token, S-35 shows what the update will do in order, an estimate of how long changes will be stopped, taken from the stored size and the duration of the last backup, and Update now.
- Before anything is stopped, Update reads the update workflow in the organisation's copy with the token, confirming that the token reaches it, and checks that the named release exists in the public release list.
- After those checks the installation writes the update record as stopping, warns signed-in users as in story 9.5b, stops accepting changes of every kind at the stop time, takes the complete "before an update" backup, makes the record prepared once that backup has succeeded, and, after noting in the record that the run is being started, starts one run of the workflow of story 9.7a through GitHub, naming the release and the record's attempt identifier; no second run is ever started for that attempt.
- The release's signature is therefore verified after users are warned, changes stopped and the backup taken; S-35 lists the steps in that order and states that this differs from a self-hosted update, which verifies first.
- Every attempt and its outcome is recorded in the activity log with the administrator who started it.

**Refusals and edge cases**
- If either check before stopping fails, the reason is shown, no user is warned and changes continue to be accepted.
- If the backup fails, the record is removed, nothing is deployed, changes are accepted again, and the attempt is shown and logged.
- If GitHub refuses the request to start the run with a client error, the run is confirmed not started: nothing is deployed, the prepared record is withdrawn, changes are accepted again, and the attempt is shown and logged.
- If GitHub answers with a server error, does not answer in time, or the answer is lost, the installation does not treat a run missing from GitHub's list as proof that none exists; it withdraws the prepared record, which succeeds only while the record is still prepared.
- Once the record is withdrawn, no run for this attempt can deploy, because the check of story 9.7a answers yes only to a prepared record with the same identifier; changes are accepted again, and the attempt is shown and logged as "start not confirmed".
- If the record is already installing when the installation tries to withdraw it, a run did start, and the attempt continues as a running update.
- While an update runs a second request to update is refused, and Update is disabled with the reason while a backup or restore job is running.
- When a prepared record is withdrawn for having no yes in time, as story 9.3a states, the installation also asks GitHub to cancel the run, and the attempt is shown and logged as "no result".
- A run for a withdrawn attempt fails the check of story 9.7a and stops without deploying, whether or not GitHub cancelled it.
- If the record is installing, changes stay stopped until the update or the return has completed, whatever the time; a version being installed that never arrives is returned from as in story 9.7a.
- If the record is installing and neither the update nor the return can be confirmed complete, the installation stays stopped for changes and shows the warning of story 9.6a with the Cloudflare steps to recover by hand.

**Access and restore**
- A project revision restore leaves the GitHub token unchanged; it is an installation setting.

**Evidence to record**
- Experiment R16: a fine-grained token with only the Actions permission is tried; the narrowest permission that starts the run is recorded, or the classic `repo` scope is recorded if none narrower works.
- On a deployed Cloudflare test installation, a test that sends saves throughout an update finds every acknowledged one present afterwards, and an open page submits its unsaved edits.
- On a test Cloudflare account, an installation two releases behind updates directly to the latest with its data converted.

### Story 9.7c: Updating on Cloudflare by hand, and the update instructions

As an administrator of a Cloudflare installation, I want exact steps for updating without one-step deployment and clear warning when a release cannot be returned from, so that I can always update and always know the way back.

Covers: FR-72 (manual steps), FR-66 (instructions), NFR-7, AD-20, AD-21. Screens: S-35.

**Core behaviour**
- Without a stored token, S-35 shows numbered steps to run the workflow by hand in place of Update now, including the backup first and the way back.
- The first manual step is "Prepare for a manual update" on S-35, which writes the update record as stopping, warns users, stops changes, takes the backup and makes the record prepared exactly as Update now does. (CF-34)
- After preparing, S-35 shows the attempt identifier to enter with the release name when starting the run by hand.
- For a release marked as changing a Durable Object class, S-35 says before starting that no automatic return is available and shows the manual procedure in place of Update now.
- That procedure is: prepare as above; start the workflow by hand with its class-change input; the update then installs, converts and runs the health check as any other, and the record carries the class-change flag of story 9.7a, so no automatic return is attempted.
- If such an update fails, the installation stays stopped for changes and S-35 and the sign-in page give the way back: recover the installation from the pre-update backup into a fresh deployment of the earlier version, as story 8.3a describes.
- With update checks turned off, S-35 shows the manual steps with a place to name the release.
- Published instructions for updating on Cloudflare cover keeping the organisation's copy of the repository, copying the update secret shown on S-35 into that copy's secrets, turning off any automatic deployment of that copy, creating the token with the permission recorded by R16, storing it in Settings to set up one-step deployment, the manual steps, and the difference in order from a self-hosted update.

**Refusals and edge cases**
- A manual update prepared and not followed by a run can be cancelled by the administrator: the prepared record is withdrawn and changes are accepted again at once, and a run started by hand for that preparation, queued or later, stops without deploying.
- A manual preparation not followed by a yes in time is withdrawn by the installation, as story 9.3a states.
- A run started for a cancelled preparation deploys nothing after a new preparation for the same release, because the new record carries a new attempt identifier.

**Evidence to record**
- A person follows the manual steps on a test Cloudflare account, and both an update and a return work.
- A person follows the published instructions on a test Cloudflare account from one published release to the next, and each place they got stuck is recorded and corrected.

### Story 9.7d: Experiment R11, Cloudflare: break an update at every step

As Kevin, I want a Cloudflare update broken at each step and the outcome recorded, so that the Update control is released only when every failure returns cleanly.

Covers: FR-72 (return), NFR-8, AD-20, experiment R11.

**Core behaviour**
- On a test Cloudflare account an update is broken at each step in turn: a bad token, a missing release, a cancel during the warning, the backup, a run that cannot be started, a prepared record with no yes in time, a run that stops after its yes and before deploying, a run that deploys the new version and then stops with the conversions then passing and then failing, a deployment that lands after the installation has returned by itself, a deployment that lands while the record is returning, a third version deployed during an update, a bad signature, the conversion of one project, the health check, the time limit passing just as the update succeeds, and the restore.
- Two updates are run one after the other, and the second succeeds.

**Refusals and edge cases**
- The answer to the start request is made to be lost while GitHub has accepted the run, in both orders: with the withdrawal reaching the installation before the run's check, and with the run's check reaching it first.
- In the first order the run deploys nothing and changes are accepted again; in the second the attempt continues as a running update and ends as an update or a return.
- With objects kept busy across a deployment and a return, the time each object takes to change version is recorded, and no request is found on which old and new code both acted.
- No object is found to stop itself more often than story 1.1 allows, including while a deployment is still reaching some regions.

**Evidence to record**
- The observed outcome of each case is recorded and matches the criteria of story 9.7a and story 9.7b.
- Cloudflare's rollback command is confirmed to behave as documented, and whether it can redeploy a named version in `immediate` mode is recorded; if it cannot, the return by deploying that release's bundle is the one tested.
- After a rollback, and after a redeployment of a bundle, the update secret and the deployment key are unchanged and the version before accepts the workflow's request to return.
- The time from the yes to the arrival of the new version is measured, and the arrival deadline is confirmed to exceed it with margin.
- After each return, a user signed in before the update continues without signing in again, and a reviewer link issued before it still opens.
- People in at least two regions use the installation during an update and during a return, and what each of them sees is recorded.
- On an installation at the acceptance size, how long changes stay stopped is measured for a successful update and for a return, and compared with the estimate shown on S-35.
- A release that changes a Durable Object class is installed on a test account by the manual procedure of story 9.7c, its failure is followed by the way back that story gives, and the result is recorded, including whether Cloudflare refuses a rollback across it.

Notes: R11's fallback is to hold back the release of the Update control until every step returns cleanly. The releases come from the test channel of story 9.2; any used as the version before are built from a commit that contains story 9.3a to story 9.7b. A first part was run on 2026-11-19 without the update code: on Cloudflare a deployment or rollback switches the entry code in about half a second and leaves data untouched, Durable Objects in use keep running the previous version for about five minutes when busy, an object asked to stop itself restarted on the new version at once (shown for one object, not yet under load), and a deployment in `immediate` mode replaced a busy object in about 2 seconds. The design that answers this is K20 with its refinements K21 (AD-20).

## Epic 10: Acceptance

**Outcome.** The proof of concept is measured against the PRD's acceptance profile on Cloudflare, and then on a self-hosted installation. Passing story 10.2a to story 10.3c is enough to accept the proof of concept on Cloudflare; a self-hosted installation is not described as supported until story 10.4a and story 10.4b pass.

**Depends on.** Epics 1 to 9 complete. Nothing later.

**Why here.** The PRD's success measures SM-1 to SM-6 can only be shown by one run across everything built, so this verification milestone comes last; it has no story for fixing what it finds, and a miss goes back to the story that owns the behaviour.

### Story 10.1: Acceptance fixtures and the workload manifest

As Kevin, the product owner, I want the test workload written down and confirmed before anything is measured, so that results cannot be made to pass by changing the fixture afterwards.

Covers: acceptance profile, SM-5, NFR-4 (reference calculations).

**Core behaviour**
- The fixture script of story 2.7b is extended to build the small functional project.
- The small functional project and the larger, acceptance-size project of story 2.7b are loaded on the Cloudflare test installation.
- The larger project has about 10 buildings, 600 devices including 150 physical cameras, 20 to 30 plans, and about 60 cameras on the busiest plan.
- The fixtures contain what the functional coverage needs: several floors, cameras and other equipment, an obstruction, a targeted zone, routes, costs and capacity, survey evidence, an existing-site survey with unknown details, retained equipment and cable, and a planned replacement recorded as actual work.
- Where the script does not yet produce one of those, this story extends it.
- A written manifest for each of the two fixtures records the plans, boundaries and geometry, zones, physical cameras against analytical views and configured streams, connections, evidence and history volumes, stored size, and the hardware, browsers and network conditions of the test.
- The manifest declares the parser, decoded-image and page-complexity guards and the temporary space the jobs use.
- Independent reference values are produced outside the application's code, by hand or by a separate script, for a stated set of optical, field-of-view and DORI cases and zone qualifying-area cases, and for counts, units, rounding and allowance arithmetic in the schedules and estimate.
- Kevin confirms in writing that the larger fixture is representative, and both manifests are fixed at that point, before any acceptance run.

**Refusals and edge cases**
- A change to a fixture after the confirmation is recorded as a new manifest version, and the affected runs are repeated. (CF-35)
- Timings recorded by earlier stories against the fixture are development measurements and are not quoted as acceptance evidence.

**Limits and values**
- The small functional project has about 50 devices. (CF-36)

**Evidence to record**
- The reference cases, the method and the values are recorded with the manifest.

### Story 10.2a: Measure the timed operations on Cloudflare, with one user and two

As Kevin, the product owner, I want every timed target measured at full size on Cloudflare, so that acceptance rests on recorded results.

Covers: NFR-4, SM-5.

**Core behaviour**
- Each timed operation in the PRD's performance table is run on the Cloudflare installation against the larger fixture in batches of 20.
- The runs are made with one user, and repeated with two users working at once.
- The two-user runs include editing conflicts on the same item and a review decision made while the other user edits.
- Each conflict keeps the pending input and overwrites neither user's work.
- Property-wide schedules, cost and capacity are shown to include all 600 devices, with physical cameras counted separately from views and streams.
- Incomplete analysis is marked Updating in every run observed.

**Refusals and edge cases**
- Every miss is reported as a miss with its figures.
- No fixture is simplified, and no camera or zone omitted, to pass.

**Limits and values**
- At least 19 of the 20 trials in each batch meet the target.
- Selection, button and direct-edit feedback: within 250 ms.
- Search and filter of the 600-device inventory: within 1 second.
- Save acknowledgement for a single item: within 2 seconds.
- A shared update visible on another connected client: within 5 seconds.
- Initial project open: within 10 seconds.
- Switch to another saved plan in an open project: within 5 seconds.
- Busiest-plan analysis after a committed edit: within 10 seconds.
- While an import, an analysis or an export runs, selection and button feedback still meets its 250 ms target in at least 19 of 20 trials. (CF-37)

**Evidence to record**
- All results, conditions and outliers are kept.
- Every trial is checked to have preserved data, access and calculation integrity, and the check is recorded.

### Story 10.2b: Check accuracy and arithmetic against the reference values

As Kevin, the product owner, I want the analysis and the schedule arithmetic compared with independent values, so that the numbers shown can be trusted.

Covers: NFR-4, SM-5.

**Core behaviour**
- Optical, field-of-view and DORI results are compared with the reference values of story 10.1.
- Zone qualifying-area results are compared with the reference values of story 10.1.
- A near-target zone result is shown as uncertain or refined, never as a confident Target met, in each reference case chosen for it.
- Counts, units, rounding and allowance arithmetic in the schedules and estimate match the reference values of story 10.1 exactly.

**Refusals and edge cases**
- Every result outside its tolerance is reported as a miss with its figures.

**Limits and values**
- Optical, field-of-view and DORI results agree within 1%.
- Zone qualifying-area results agree within 2 percentage points, at sampling no coarser than 1 m.

### Story 10.2c: Measure the long jobs and a full-size recovery on Cloudflare

As Kevin, the product owner, I want every long job and a whole recovery timed at full size on Cloudflare, so that the file and recovery targets are accepted on recorded results.

Covers: FR-34 (recovery targets), NFR-4, SM-5.

**Core behaviour**
- Each long file job is run three times at full size and meets its bound each time, with no correctness or integrity exception.
- The isolated recovery of story 8.3a is run at full size on Cloudflare.

**Refusals and edge cases**
- Every miss is reported as a miss with its figures.

**Limits and values**
- Selected PDF-page preview: within 30 seconds.
- Photo preview and processing: within 10 seconds.
- Inventory preview: within 30 seconds.
- Confirmed inventory import: within 30 seconds.
- A complete retained design or closeout edition: within 5 minutes.
- Portable backup creation: within 10 minutes.
- Portable backup validation and restoration after upload: within 15 minutes.
- The recovery point used is no more than 24 hours old.
- The recovery reaches a project that opens and acknowledges a save within 60 minutes.

**Evidence to record**
- Transfer times are recorded separately from processing times.
- The recovery's elapsed time and the preparation assumed are recorded.

### Story 10.3a: Walk the journeys and show history and outcomes are kept honest

As Kevin, the product owner, I want the user journeys walked end to end on Cloudflare, so that the proof of concept is accepted on what people can actually do.

Covers: SM-1, SM-2, SM-3.

**Core behaviour**
- UJ-1 to UJ-5 are completed on the Cloudflare installation.
- The journeys include the solo path with every approval bypassed.
- No file exchange is used as the way of working together.
- In UJ-5 the administrator reviews the activity log, filters it by person, exports it, and confirms on the Backups screen that backups are succeeding.
- No fixed record changes across a field move, a checklist edit, a retest, a replacement, an archive, a revision restore and a reopening.
- After those actions the earlier package downloads byte for byte and earlier evidence is unchanged.
- Bypass, not installed, Fail, Not tested, Not applicable, closing with outstanding items and reopening each show a distinct, correct status on screen.
- Each of those shows the same distinct status in the package.

**Evidence to record**
- Each journey's steps and any step that could not be completed are recorded.

### Story 10.3b: Show the tasks on real devices and browsers

As Kevin, the product owner, I want the desktop and field tasks shown on the real browsers and devices, so that cross-device use is accepted on hardware people carry.

Covers: NFR-3, SM-4.

**Core behaviour**
- The desktop workflow and the administrator screens are shown on a Windows laptop in Chrome and in Edge.
- The field tasks are shown on a real iPhone and a real iPad in Safari and on an Android phone in Chrome.
- The field tasks shown are: equipment lookup, current plan against the issued reference, checklist inspection, verifying and placing imported devices, notes, photos and results, save and conflict handling, and permitted review actions.
- Each field task leaves saved state that is still there after a reload.
- Signing in, two-step verification, accepting an invitation and changing a password are shown on each environment.
- Labels and error messages, keyboard access, visible focus, 200% zoom, touch alternatives to dragging and non-colour status are checked on both fixtures.
- A change saved on one device appears on another.
- Edits to separate items and evidence additions by two people both remain.
- A same-item conflict keeps the pending input.
- Guarded undo removes nobody else's work.
- A failed save is visible with its input still on the page.

**Evidence to record**
- Hardware, operating system and browser versions and the test conditions are recorded.
- The result of each accessibility check is recorded for both fixtures.

### Story 10.3c: Show installing and updating on Cloudflare

As Kevin, the product owner, I want the Cloudflare parts of the installation and update Checks shown on a fresh account, so that the proof of concept can be accepted on Cloudflare.

Covers: FR-66 and FR-72 (Cloudflare parts of their Checks).

**Core behaviour**
- FR-66: following only the published instructions, a fresh Cloudflare account reaches a working sign-in page over HTTPS.
- FR-66: a plain HTTP request is redirected or refused.
- FR-66: a person without the set-up code cannot complete set-up.
- FR-66: set-up names the installation, creates one administrator and cannot be run again.
- FR-66: a second installation shares no users, projects or files with the first.
- FR-72: an administrator sees a newer published release and its notes, while a standard user sees no Update control.
- FR-72: Update with one-step deployment installs the release with data intact, and open pages keep their unsaved edits.
- FR-72: users are warned before saving stops, and no save is acknowledged between the backup and the new version starting.
- FR-72: an installation two releases behind updates directly to the latest.
- FR-72: with the check turned off nothing contacts the release list, and the installed version is still shown.
- FR-72: without one-step deployment the manual steps are displayed and work.

**Refusals and edge cases**
- FR-72: a release with a bad signature is refused.
- FR-72: an update made to fail part-way returns to the earlier version with its data, and the failed attempt is in the activity log afterwards.
- FR-72: a return made to fail is reported as failed, never as success.

### Story 10.4a: Repeat the acceptance run on a self-hosted installation

As Kevin, the product owner, I want the same acceptance run passed on a self-hosted installation, so that self-hosting can be described as supported.

Covers: NFR-7, SM-1 to SM-5 (self-hosted run), FR-66 and FR-72 (self-hosted parts of their Checks).

**Core behaviour**
- The runs of story 10.2a, story 10.2b, story 10.2c, story 10.3a and story 10.3b are repeated in full on a self-hosted installation of the same version.
- FR-66: following only the published instructions, a fresh supported server reaches a working sign-in page over HTTPS.
- FR-66: a plain HTTP request is redirected or refused, and the set-up step behaves as in story 10.3c.
- FR-72: pressing Update produces a backup, the new version and intact data, with open pages recovering their unsaved edits.
- FR-72: an installation two releases behind updates directly to the latest.

**Refusals and edge cases**
- FR-72: a release with a bad signature is refused.
- FR-72: an update made to fail part-way leaves the earlier version running with its data and reports the failure, and the failed attempt is in the activity log after the return.
- FR-72: a return made to fail is reported as failed, never as success.

**Evidence to record**
- The server's hardware and disk are recorded with the results.

### Story 10.4b: Show both hosts are one product

As Kevin, the product owner, I want the two hosts shown to behave as one product, so that an organisation can choose either and move between them.

Covers: NFR-7, SM-6.

**Core behaviour**
- On each host, the person who followed the instructions creates an administrator, an Editor and a Viewer.
- On each host a non-member cannot open the project, and a Viewer's save is refused by the server.
- On each host an update to a newer published release is installed from the interface with data intact (on Cloudflare with one-step deployment set up).
- On each host a deliberately broken update returns to the earlier version.
- A project backed up on each host is restored on the other and passes the checks of story 8.4b.
- Every item on the comparison list gives the same result on both hosts.
- Each difference that hosting makes unavoidable is stated in the interface and in the instructions: how an update is triggered, when the signature is verified, where the set-up code and the deployment key appear, and where backups are kept.
- Deployment packaging, meaning how HTTPS is provided and how the application is started, is an expected, documented difference between the hosts and is listed in the instructions of story 9.1.
- On each host an administrator reviews the activity log and confirms that backups are succeeding.

**Refusals and edge cases**
- Self-hosting is not described as supported in the repository or the instructions until story 10.4a and this story pass.

**Limits and values**
- The comparison list is: every area of the project frame and every Administration screen opens; and each of these is refused: a Viewer's save, a non-member opening a project, a request on an ended session, a sign-in by a deactivated account, a revoked reviewer link, an expired reviewer link, an upload over its size limit, a portable backup from a newer version, and Update by a standard user. (CF-38)

Notes: SM-6 needs both hosts and is complete only when this story passes.
