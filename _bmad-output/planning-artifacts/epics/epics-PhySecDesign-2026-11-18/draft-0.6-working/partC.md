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

Notes: Retained equipment is not purchased again; that rule and the "Retained, not purchased" group arrive with planned actions in story 6.6. Cable supply quantity and its basis follow the length ledger in story 7.6. Reusing rates or copying lines into a later scope belongs with later scopes in story 6.7.

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

Notes: Decisions by people without accounts are story 4.7. The decision on a closeout record by the final-acceptance assignee is story 5.12; this story delivers the assignment only. Keeping or changing assignments for a later scope is story 6.7.

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

Notes: The issued-design strip where installers start work is stories 5.1 and 5.2, which also prove that field records are untouched by a change of reference. Designation is limited to the active scope's revisions; story 6.10 carries the test that an earlier scope's revision cannot be designated. A later scope starts at Not issued (story 6.7), and a service scope needs no issued design (story 6.12).

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
