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
