# Hand-overs between parts, draft 0.7 (old story numbers; suffixes are the split pieces)

## Split map so far
- 1.3 -> 1.3a sign in/out, R9; 1.3b invite and accept
- 1.7 -> 1.7a membership and access gate; 1.7b installation roles, deactivation, last administrator
- 1.8 -> 1.8a Administration area, users table; 1.8b reset links, two-step reset and require; 1.8c projects table and members; 1.8d locked-out administrator recovery command (Cloudflare)
- 1.10 -> 1.10a settings (installation, sign-in, maps); 1.10b require two-step for everyone; 1.10c email and forgotten password; 1.10d experiment R13

## From part A (Epic 1)
- 2.6 (B): must carry "an upload in progress keeps its session in use" and edge case 45 (parts kept on session end, resume after the same account signs in). Drop its duplicate maps-key visibility notice (1.10a has it); keep only delivery of the key.
- 2.13 (B): recovery command is story 1.8d; deployment key is story 1.4 with story 1.10a. The self-hosted smoke suite needs a named list of cases.
- 4.1 (C): add one test that a revision restore changes no installation record (accounts, sessions, invitations, members, settings, log).
- 9.7 and 9.1 (F): 1.2 and 1.4 state that a redeploy never regenerates the deployment key or set-up code and the key is printed once; reference, do not restate. 9.1 documents the recovery command and keeping the key off the account.
- 6.5 (E): bulk cleanup outcome belongs in the project change log, not the administrator activity log.

## Split map, Epic 4
- 4.1 -> 4.1a save revisions, Records timeline, revision identifier, floor guard; 4.1b compare and restore
- 4.6 -> 4.6a approval assignments; 4.6b request review, comment, decide by account; 4.6c bypass per revision, five review states
- 4.7 -> 4.7a reviewer link opens, comments, decides; 4.7b replace, revoke, expire, administrator list
- 4.8 -> 4.8a issue and designate current reference; 4.8b supersede, re-designate, compare with working
- 4.10 -> 4.10a package contents from saved revision; 4.10b page layout, options, R15; 4.10c volumes, upload, verification, size limits; 4.10d editions kept exactly, redownload
- 4.2 now creates optional serial number, IP address, MAC address and room-or-area fields on every device.

## From part C (Epic 4)
- 5.4 (D): carries the "Evidence-limited summary" label for a package that leaves out a required photo.
- 8.5 (F): carries "abandoned edition parts do not count toward usage" and counting kept editions toward usage.
- 2.7 (B): must NOT add serial/IP/MAC/room fields (4.2 has them). 5.1 search on room, 5.12 and 6.2 rely on 4.2.
- Later stories adding records (5.12 closeouts, Epic 8 backups, 6.11 archive) each add their own Records timeline entry (timeline created in 4.1a).
- 4.8a no longer carries the chip reading "Not issued"; 3.1 keeps it.
- 3.2 (B): status components need "Changes requested" and "No review" beside Approved, Bypassed, Awaiting decision.
- 5.1 (D): issued design shows Approved, Changes requested, Awaiting decision or Bypassed.
- 3.1 / Epic 2 (B): say how the prototype's Materials, Capacity, Revisions and Review dialogs behave until 4.1a, 4.4, 4.5 and 4.6b replace them.
- 2.6 (B): parts are kept when a session ends and resume after the same account signs in; discarded only on an access change (4.10c assumes this).
- 2.11 (B): "a floor whose only devices are deleted drafts counts as unused" must not override "a floor held in a saved revision cannot be deleted" (that guard is in 4.1a).
- 5.12 (D): with no active scope, refuse saving a revision, issuing or designating, and cancel or correct. Generating a package of an already saved revision and recording a reviewer decision remain allowed (they change no design content).
- 5.3 or 5.13 (D): a mark or attempt saved from a stale page onto a cancelled or corrected device is refused and kept for review.
- 5.3 (D): carries the "Work started with no issued design" warning.
- 6.12 (E): carries "a service scope needs no issued design".

## Split map, Epics 6-7
- 6.2 -> 6.2a choose file and sheet; 6.2b map the inventory columns
- 6.3 -> 6.3a review and match import rows; 6.3b apply import, report result
- 6.6 -> 6.6a planned actions on existing equipment; 6.6b Current, Proposed and Changes views
- 6.8 -> 6.8a record removal, archive the device; 6.8b removal review and cable ends
- 6.9 -> 6.9a restore the same archived device; 6.9b reconnect cables, link a replacement
- 6.12 -> 6.12a warranty records and calculated status; 6.12b service visits on an issue; 6.12c Start service visit, service scope
- 7.2 -> 7.2a stored positions and resting view; 7.2b reach on demand layer
- 7.5 -> 7.5a closets and port schedules; 7.5b port claims, power, capacity; 7.5c ports through removal, restore, deletion
- 7.6 -> 7.6a runs between floors, named risers; 7.6b length ledger and supply quantity

## From part E (Epics 6-7)
- RULING (coordinator): device fields serial number, IP address, MAC address and room-or-area are created in 4.2 (earlier). 6.1 must not create them again; 6.1 keeps manufacturer, source asset ID and installation date if 4.2 lacks them, and makes nothing else. Search on room works from 4.2 on.
- RULING (coordinator): the closeout record is written on closing (5.12) and is not changed afterwards. Warranty and service visits are separate records; the Closeout package reads the fixed record plus warranty and visit records as they stand at the package cutoff, as it does for decisions. 6.12a must not say the closeout record is written after the warranty step.
- 5.12 (D): owns the general no-active-scope rule and its label "not saved: no active scope — reopen first". E states only local cases (6.8a removal refused, 6.9a restore refused, 6.12a warranty edits allowed, 6.12b visit corrections allowed).
- 5.7 and 5.12 (D): 6.7 redefines in-scope from then on as Work now devices plus required checks of Work now and Inspect-or-test-only devices; a planned Remove or Replace predecessor is listed "Removal not recorded" and cleared by the recorded removal in 6.8a.
- 5.3 (D): limit "returns to Proposed" on reversing an Installed mark to add-new devices; 6.6a carries the reversal for a device Existing before the scope. 6.12c: no "Work started with no issued design" warning in a service scope.
- 3.6 (B): later stories fill the inspector: 6.6a Work tab planned action; 7.5a port assignments and replaces the Connections placeholder; 7.6a cable runs in Connections; 7.3 Doors and gates tab in Equipment. (Also 5.3 and 5.5 must fill the desktop Work and Checks tabs: review D12.)
- 2.5 (B): Notes list of later floor-deletion blockers should name story 7.4 (annotations) and story 7.5 (closets), with 6.8 and 7.6.
- 5.6 (D): drop "port or power" from its flagging criterion; 7.5b carries it.
- 5.9 (D): attention count is extended by cable ends (6.8b) and ports (7.5c) flagged Needs connection review -- stated in those stories, nothing to do in 5.9.
- 1.9 (A): no bulk-cleanup event needed (project change log has it). Done.
- 10.2 (F): inventory preview and import timings in 6.2a and 6.3b are development measurements; acceptance run stays in 10.2.

## Split map, Epic 5
- 5.1 -> 5.1a field shell and issued-design chip; 5.1b find a device in the field
- 5.3 -> 5.3a mark Installed and Configured; 5.3b reverse a mistaken mark; 5.3c report a change found on site
- 5.4 -> 5.4a checklists and starters; 5.4b expectations in revisions and package
- 5.5 -> 5.5a record a check's outcome; 5.5b attempts, retests, corrections; 5.5c photos as check evidence; 5.5d experiment R4
- 5.6 -> 5.6a site changes flag affected checks; 5.6b definition changes and clearing flags
- 5.9 -> 5.9a raise and track issues; 5.9b issues in counts and package
- 5.10 -> 5.10a define the reliability period; 5.10b start, end, stop a run
- 5.11 -> 5.11a downtime log and availability; 5.11b outcome of a run
- 5.12 -> 5.12a choose Completed or outstanding; 5.12b close and write closeout record; 5.12c closed scope, no active scope (owns the rule and label); 5.12d final acceptance of closeout record; 5.12e Closeout package
- 5.2, 5.7, 5.8, 5.13 unchanged

## Split map, Epics 2-3
- 2.2 -> 2.2a autosave, versioned items, save status; 2.2b lost connection, access, session end
- 2.6 -> 2.6a property lookup and map views; 2.6b import, align, lock a plan; 2.6c plan originals stored on server
- 2.7 -> 2.7a device records, lifecycle, basis, search, Room-or-area field; 2.7b acceptance-size fixture and first timings
- 2.8 -> 2.8a coverage in worker, Updating status; 2.8b DORI and zone target results; 2.8c sampling, time allowance, saved summaries, R2
- 2.10 -> 2.10a notes, measurements, constraints as entries; 2.10b photos with originals stored
- 2.11 -> 2.11a undo and redo own edits; 2.11b Delete draft for accidental devices
- 2.13 -> 2.13a image, Compose, bundled HTTPS; 2.13b operator's own HTTPS proxy; 2.13c deployment key and administrator recovery; 2.13d named smoke-suite case list
- 3.1 -> 3.1a project frame and view switch; 3.1b eight areas as routes

## RULINGS (coordinator) on overlaps
- Device fields: "Room or area" is created in 2.7a and searchable from then on. Serial number, IP address and MAC address are created in 4.2. Stories 4.2 (room), 5.3c and 6.1 must NOT create these again; they use them. 5.1b can search on room again.
- "Evidence-limited summary" for a package that leaves out a required photo: 5.12e owns it for the Closeout package; 5.4b owns it for the Design package if required photos affect the Design package, else nowhere else.
- Small functional project: 10.1 only. Fixture extension to 8 GiB: 8.2 only. Fixture script: 2.7b.
- With no active scope: survey notes and photos (2.10) are refused like other field records; 5.12c lists them.
- Approval state list (Approved, Changes requested, Bypassed, Awaiting decision, No review) lives in the 3.2 component and is used by 4.6c/4.8a/5.1a.

## From part B (Epics 2-3)
- 1.2 (A): on Cloudflare too, a deployment with no administrator issues a new set-up code and invalidates the old one; none once an administrator exists.
- 4.1a (C): puts the first entries on the Records timeline; 3.1b creates Records as an empty timeline page (so 4.1a adds entries, not the page).
- 4.9 (C): a device that is or has been Existing has no delete control from 2.7a onward; 4.9 is the first way to remove a mistaken one.
- 5.5 (D): field note form reuses 2.10a's on-form warning against entering site passwords or access codes.
- 8.1 and 8.4 (F): carry "a PDF password is absent from every backup".
- 8.3 (F): 2.13c refuses to start when records exist and the key file is missing; recovery without the key goes through 8.3.
- 9.1 (F): the published instructions say to keep a copy of the key off the server.
- 10.1/10.2 (F): timings in 2.2a, 2.6b, 2.7b, 2.8c, 2.10b, 3.5, 5.1b, 6.2a, 6.3b are development measurements; acceptance runs stay in 10.2.

## From part D (Epic 5)
- 7.7 (E): closet, port and inter-floor schedules in the Closeout package.
- 4.6/4.7 (C): 5.12d records a final-acceptance bypass on the closeout record itself and relies on 4.7's link rules.
- 2.5 (B): two more floor-deletion blockers exist: a floor-level site check with an attempt (5.8) and a floor held in a closeout record (5.12b); 2.5 Notes should name them.
- 6.8 (E): label "not saved: device removed"; 5.13 uses "not saved: device cancelled or corrected".
