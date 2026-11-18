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
