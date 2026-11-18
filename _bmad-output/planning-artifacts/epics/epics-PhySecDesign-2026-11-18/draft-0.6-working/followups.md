# Follow-ups raised by other parts (from Epic 4 agent)
- 5.3: Covers must list FR-55 (reversal of mistaken Installed mark); reversing Installed flags Configured mark and dependent checks; add "Reverse installed mark" to device menu; FR-22 Check: restore leaves a camera's recorded field position as is and lists item for review.
- 5.5: restore leaves evidence and test attempts unchanged; an unissued proposal with test attempts can be cancelled and attempts stay findable (FR-55 Check); upload counts as session use (or 1.5).
- 5.6: applying changed template values to a tested camera triggers a retest (FR-47).
- 5.9: open issues appear in the Design package (addendum "Outstanding work and decisions").
- 5.12: closing a scope makes its reviewer links read-only; final-acceptance decision on the closeout record by account or link (4.6 delivers assignment only); cancelled items shown as a visible scope change in closeout.
- 6.6: planned actions held in revisions and returned by restore; packages show planned actions and retained context by action.
- 6.7: scope categories in revisions/restore; assignments reused or changed for later scopes; later scope starts at Not issued; rates and copied estimate lines for later scope (FR-17).
- 6.8: restore leaves a removal as is and lists for review; add "Record removal" to device menu.
- 6.11: archiving makes reviewer links read-only; appending an edition to an archived project.
- 7.4 annotations and 7.5 proposed port assignments: a revision holds them and restore returns them.
- 1.3/1.5: invalid-token lock-out for reviewer links in 4.7 is 10 in 10 minutes, blocked 15 minutes — sign-in values should match; 1.5 should state an upload in progress counts as session use.

# From Epic 1 agent
- 2.1: scope state and last activity also in Administration Projects table (S-31); show a Viewer reading an open project and being refused a save.
- 2.2: project edit refused for changed access shows "not saved: access changed", kept, not retried; pending project edits kept across session end only for the same account.
- 2.6: deliver the map key saved in Settings to members' browsers; files part of FR-66 Check (two installations share no files) in 2.6 or 2.13.
- 2.13: print the self-hosted set-up code in server output; supply the deployment encryption key (used by 1.4 and 1.10); self-hosted form of administrator recovery command from 1.8.
- 3.1: the account menu (started in the prototype header in Epic 1) moves into the project frame.
- 5.9: project list shows attention count.
- 6.11: Archive/Un-archive and archived state in Administration Projects table.
- 8.1 and 8.5: latest backup and stored size in that table; 8.5 keeps the Settings Limits group.
- 8.3: deployment encryption key kept outside backups and needed for recovery.
- 9.3: 1.1 already refuses requests when data is newer than the build; 9.3 adds the pending-update-marker recovery rule.
- 9.4: update-available marker on the projects list for administrators.
- 9.7: GitHub token stored like other settings secrets (1.10).
- 4.7, 6.11, Epic 8, Epic 9: each adds its own activity-log entries.
- Sole-administrator recovery (1.8) is not in the PRD: flagged as a choice for Kevin.

# From Epic 6-7 agent
- 2.11: must NOT carry "undo cannot reclaim a port reassigned by another editor" (7.5 has it).
- 4.1 and 4.8: must NOT carry criteria about another scope's revisions (restore or designation); 6.10 has them. (Tell Epic 4 agent.)
- 4.7: must not test archive (6.11 has link behaviour for archived projects).
- 5.10/5.12: own the scope-closed case for an open reliability run; removal of a covered device flags the run in 6.8; archive is refused while a scope is In progress (6.11).
- 8.1/8.4: an archive cannot interleave with a running backup or restore; PTZ positions, limits, home mark, closet and port distinctions survive a portable backup (FR-63, FR-51 Checks).
- 5.3/2.7 must deliver lifecycle, Current/Proposed, Installed -> Existing, relocation takes recorded location.
- Candidates for splitting (question for Kevin): 4.10, 6.6, 6.12, 7.5, 6.8.
- Choice for Kevin: 6.11 refuses archiving while a scope is In progress.

# From Epic 8-10 agent
- Epic 8 now depends on Epics 1 to 7 (back matter must not say "after Epic 4").
- 2.13: Compose file includes a backup-location setting with no default (8.1 makes the server refuse to start without it).
- 2.7: fixture generator produces both the small functional project and the acceptance-size one, and files can be added up to 8 GiB.
- 2.6 (and 4.10, 6.2): each states its own file limit when it adds the file type; 8.5 completes enforcement.
- 2.2 / 3.1: the save-status list allows more than one refusal reason ("not saved: access changed", "not saved: project was restored").
- Open point for Kevin (9.7): a workflow run could deploy after the 30-minute limit; flagged for R11.

# From Epic 5 agent
- 6.6: "recording installation of a relocated device makes its new recorded location the current one"; extend 5.2's device-sheet sentence to the other planned actions and add the Changes basis; extend checklist default applicability beyond "required for each Proposed device of the active scope" (6.6/6.7).
- 6.8: removal of a device covered by an open reliability run, or with open issues or required retests.
- 6.11: archiving with an open reliability run (already refused while a scope is In progress).
- 7.2: pan/tilt/zoom checklist starter under FR-29.
- 7.5: decide whether Needs connection review counts in the project-list attention count defined in 5.9.
- 4.1: the snapshot records the checklist definitions in force at save, without restore writing them back (5.4's Design package criterion relies on this) -- but 4.1 precedes checklists, so the criterion belongs in 5.4.
- 2.10: FR-20 optional prompts (lighting, shadows, uneven terrain, mount rigidity) are in 5.5's field note form; keep one set (2.10 for desktop notes or leave to 5.5).
- Candidates for splitting: 5.12.

# From Epic 2-3 agent
- 1.10: say the Google mapping key is browser-visible to signed-in users (2.6 relies on the saved key and removes the per-session dialog).
- Scope on records: 4.1, 4.4 and the Epic 5 evidence stories each state that their records carry the active scope.
- 6.8: a floor holding a removed device cannot be deleted.
- Delete-draft eligibility: 4.8 (in an issued design), 5.3 (Installed or Configured mark), 5.5 (test attempt), 5.9 (issue), 7.5 (port assignment, plus undo-cannot-reclaim-a-port) each add one criterion making the device ineligible and refusing a stale delete.
- Lifecycle: 2.7 keeps the prototype's manual Proposed/Existing choice and a permanent "recorded as existing" mark; 5.3 and 6.1 build on that, not a second flag. Basis in 2.7 is Existing versus Existing plus Proposed; 6.6 extends it with planned actions and Changes.
- Fixture: 2.7's script generates buildings, plans, devices, obstructions, zones and routes; 2.10 adds survey entries; later epics needing full-size data of their own record types extend the script in their own stories.
- 7.1: extend Not demonstrated and Not assessed to unsupported and illustrative views.
- 8.1: 2.14 makes the live and backup folders separate Compose settings and refuses to start if they are the same; 8.1 says where the backup folder is placed, provisions the Cloudflare backup bucket, handles a full backup disk. (Reconcile with Epic 8 agent's request that 2.13 hold a backup-location setting with no default: the setting lives in the Compose file from 2.13/2.14; 8.1 uses it.)
- 9.1: state supported server and storage kinds from 2.15's R12 results.
- 2.12: lists costs and named revisions in the import review as "not imported" until 4.1 and 4.4 add them; 4.1 and 4.4 each remove their item from that list.
- Candidates for splitting: 2.6, 2.8, 3.1.
- Choice for Kevin: 3.5 deleted drafts are not listed under Historical (PRD over UX section 6).
