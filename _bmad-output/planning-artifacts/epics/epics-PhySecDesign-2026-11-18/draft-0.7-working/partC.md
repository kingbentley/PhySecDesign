## Epic 4: Design, estimate and issue

**Outcome.** A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package.

**Depends on.** Epics 1, 2 and 3 complete. Within them this epic uses the sign-in throttle of story 1.3a, sessions from story 1.5, Administration from story 1.8a, the activity log from story 1.9, multi-part uploads from story 2.6c, device records and the Room or area field from story 2.7a, the acceptance-size project from story 2.7b, Delete draft from story 2.11b, the prototype import from story 2.12, self-hosted file storage from story 2.14, the Records timeline page and the Costs and capacity page from story 3.1b, the status and approval-state components from story 3.2 and the Historical segment from story 3.5. Nothing later: every criterion in this epic can be tested with the stories before it.

**Why here.** Installation work in Epic 5 starts from an issued design, so revisions, review and issuing come before the field.

### Story 4.1a: Save named revisions and list them in the Records timeline

As a designer, I want to save the design as a named revision that never changes afterwards, so that I can try alternatives without losing a version I may need again.

Covers: FR-1 (deletion guard for floors held in revisions), FR-22 (saving, prototype revisions), FR-34 (snapshots), FR-60 (historical references), NFR-1, AD-8. Screens: S-20.

**Core behaviour**
- An Editor saves a named revision of the active scope.
- The revision records its name, an identifier given by the server, its scope, the account that saved it and the time.
- Each named revision is listed as an entry on the Records timeline, which takes the place of the prototype's Revisions dialog.
- A revision opens read-only from the timeline.
- The snapshot is taken at one saved version of the project. Another person's edit that the server accepted after that version is not in it.
- After later edits to the working project, the revision's stored file has the same hash as when it was saved.
- Importing a version 1 or version 2 prototype project file that holds named revisions creates each as a named revision of the project's first scope, with its name and saved date, and each can be opened. (CC-04)
- After such an import the import review no longer lists named revisions as not imported.

**Refusals and edge cases**
- If any of the saving user's own edits is still Unsaved or in Conflict, the save is refused and those items are listed. Once none remain, the revision can be saved. (CC-02)
- A revision is listed only when its snapshot file is stored and its hash has been verified.
- A failed snapshot write shows as Failed with Retry and lists no revision.
- Saving a second revision with a name already used in the scope is refused with the reason. (CC-03)
- Deleting a floor that any saved revision contains is refused, and the refusal lists those revisions.
- A floor deletion sent from a page loaded before a revision containing that floor was saved is refused in the same way, and the floor is unchanged.

**Limits and values**
- Identifiers read "Rev A", "Rev B" and so on, in the order revisions are saved within the scope, and are never reused. (CC-01)

Notes: Left to later stories: compare and restore (story 4.1b); the timeline's other entries, each added by the story that creates the record; revisions of a later scope (story 6.10); revision content in portable backups (story 8.4a).

### Story 4.1b: Compare revisions and restore one into the working design

As a designer, I want to compare two revisions and restore an earlier one, so that I can see what changed and go back without losing the record of what happened since.

Covers: FR-22 (compare, restore), AD-7. Screens: S-20, S-21.

**Core behaviour**
- Two revisions can be compared side by side at one scale.
- The comparison lists the devices and settings that were added, removed or changed.
- A revision imported from a prototype file can be compared like any other.
- Before a restore is confirmed, a dialog states what will change (design content) and what will not (everything else in the project), and lists each item the restore will leave as it is, with the reason.
- A restore replaces the working design content with the content held in the snapshot: proposed devices and their planned positions, proposed routes, zones, obstructions and analysis settings return to the revision's values.
- A restore leaves unchanged the recorded attributes of every device whose lifecycle is Existing, and every survey note and photo.
- A draft device deleted since the revision returns with its original identifier.
- A restore deletes no revision. Revisions saved after the restored one stay in the timeline with unchanged hashes.
- The person who restored can undo the restore in the same session. (CC-05)

**Refusals and edge cases**
- A restore is one versioned operation. A save that another person based on the state before the restore is returned to them as a conflict, with their value kept on their page.
- The undo is refused with an explanation if any restored item has been changed since.
- Restore is not offered for a revision imported from a prototype file. (CC-06)

**Access and restore**
- A restore changes no installation record: accounts, sessions, invitations, project members, settings and the activity log's earlier entries are the same before and after.

Notes: This story sets the principle that a restore replaces design content only; each later story that adds a kind of record says what a restore does to it. Left to later stories: a camera moved in the field after the revision (story 5.3c) or removed after it (story 6.8a); the test that an earlier scope's revision cannot be restored (story 6.10).

### Story 4.2: More equipment types and device fields

As a designer, I want to record doors, gates, controllers, locks, power supplies, recorders and custom equipment, so that the design covers the whole system and not only cameras and sensors.

Covers: FR-7.

**Core behaviour**
- Doors, gates, access controllers, locks and strikes, request-to-exit devices, low-voltage power supplies, recorders and custom equipment can each be created, placed on a floor and edited.
- Each new record has its own unchanging identifier, a type, a model, mounting details, a location and notes, and lifecycle Proposed by default.
- Each new type appears in the plan, the equipment schedule and its export, and in search.
- Cameras record enclosure type and alarm interface, and both show in the schedule.
- Every device, of the earlier types and the new ones, has optional fields for serial number, IP address and MAC address. They show in the inspector and the equipment schedule.

**Refusals and edge cases**
- A door-contact record created before this story is still a contact afterwards and is not turned into a door.
- Creating a door, gate or custom record creates no other record: no components, no cables, no connections.
- A new record's model and specification fields are empty until someone fills them.
- Recording an enclosure type or an alarm interface creates no connection.

**Limits and values**
- An empty enclosure type, alarm interface, serial number, IP address or MAC address reads "Not recorded".

**Access and restore**
- A revision holds devices of the new types with their fields, and a restore treats them as story 4.1b treats any device.
- A proposed device of a new type is eligible for Delete draft on the conditions of story 2.11b.

Notes: Left to later stories: linked components of doors and gates (story 7.3).

### Story 4.3: Camera-model templates

As a designer, I want reusable camera definitions by manufacturer, model and lens, so that I enter a camera's optics once and coverage uses the real figures.

Covers: FR-47. Screens: S-08 Camera models.

**Core behaviour**
- Templates can be created, edited, duplicated and searched by manufacturer, model number and lens or variant.
- A template records resolution as width by height in pixels for each capture mode.
- A template records lens type (fixed or varifocal) and focal length or focal-length range.
- A template records horizontal and vertical field of view in degrees, with the mode and focal setting they apply to.
- A template records the active imaging dimensions in millimetres where known, and the source of the specification.
- When placing a camera, the designer picks a template or the generic camera. The generic camera stays available.
- Two cameras placed from one varifocal template can hold different focal settings within the template's range, and each gives its own coverage and DORI result.
- Changing a camera's resolution or mode makes its results use that mode's pixels and framing, not the model's maximum.
- Editing a template afterwards leaves cameras already placed, saved revisions and survey evidence unchanged.
- A placed camera shows that its template has changed and takes the new values only when an Editor applies them to it. (CC-08)

**Refusals and edge cases**
- A camera placed from a fixed-lens template cannot be given another focal length.
- A focal setting outside a varifocal template's range is refused.
- A missing optical value shows as Unknown in the template and on the camera.
- A result that needs a missing value shows as not assessed with the missing input named; no generic value is substituted. (CC-09)

**Access and restore**
- A revision restore leaves templates unchanged. A camera that a restore returns holds the optical values recorded in the revision, and shows that its template has changed if it has. (CC-10)

Notes: Left to later stories: the retest that applying changed values triggers on a tested camera (story 5.6b); several views and streams per camera (story 7.1); pan/tilt/zoom ranges (story 7.2a).

### Story 4.4: Estimate with labour, percentage lines and subsystems

As a designer, I want an estimate with equipment, cable, accessory, labour and percentage lines grouped by subsystem, so that I can give a budget figure that shows what it rests on.

Covers: FR-17, FR-18, FR-22 (estimate lines in revisions and in the prototype file). Screens: S-14.

**Core behaviour**
- The estimate belongs to the active scope and is shown on the Costs and capacity page, where it replaces the prototype's Materials content.
- Equipment and cable lines carry an editable supply quantity, unit cost and allowance, and each category shows a subtotal.
- Manual accessory lines and labour lines can be added with a quantity, a unit and a rate.
- Every line has an inclusion tick.
- Excluding labour lowers the included total by the labour amount and keeps the entered rates and quantities.
- A percentage line states its percentage and the categories it applies to, and shows its base and its amount.
- A 10% contingency on equipment and cable changes when that base changes, and excluding it returns the total to its earlier value.
- Each equipment, cable, accessory and labour line sits in exactly one subsystem, set from its equipment type by default and changeable.
- Percentage lines sit in their own section outside the subsystems.
- The subsystem subtotals plus the percentage lines add up to the same total as the ungrouped view.
- The estimate is labelled an estimate and states its assumptions.
- The estimate exports to CSV with the same lines, inclusion states, subtotals and total.
- Importing a prototype project file brings its costs in as estimate lines, and the import review no longer lists costs as not imported.

**Refusals and edge cases**
- An earlier percentage line is part of a later percentage line's base only when it is explicitly selected.
- A line with no price reads Unpriced, not zero.
- A total or percentage amount that includes an unpriced line reads Incomplete with the number of unpriced lines.
- A prototype cost the estimate cannot represent is listed for review in the import review.

**Access and restore**
- A named revision saved after this story holds the estimate lines, and a restore returns them.

Notes: Left to later stories: the cancelled group (story 4.9); retained equipment that is not purchased again (story 6.6a); reusing rates or copying lines into a later scope (story 6.10); cable supply quantity from the length ledger (story 7.6b).

### Story 4.5: Capacity estimates

As a designer, I want storage and bandwidth estimates that follow the recorded streams, so that I can size the recorder and the network.

Covers: FR-19 (base). Screens: S-14.

**Core behaviour**
- Storage follows each recorded stream's bitrate, recording percentage and retention. Changing retention or bitrate changes storage.
- Bandwidth follows the streams sent. Changing the recording percentage changes storage and leaves bandwidth unchanged.
- Each figure states its units, its inputs and its overhead assumptions, and is labelled an estimate.
- The capacity figures are shown on the Costs and capacity page, where they replace the prototype's Capacity content.

**Refusals and edge cases**
- A camera with no bitrate recorded is listed as unknown demand, and no camera is counted as zero.
- With any such camera the total reads Incomplete with the count of those cameras. (CC-11)

**Access and restore**
- A revision holds the bitrate, recording percentage and retention inputs, and a restore returns them. (CC-12)

Notes: Left to later stories: multi-head cameras and display-only views (story 7.1); port and power capacity, and demand with no assigned switch (story 7.5b).

### Story 4.6a: Approval assignments

As a designer, I want to say who reviews a design and who gives final acceptance, so that everyone can see whose sign-off is expected.

Covers: FR-23, FR-25 (an assignment gives no access), FR-69. Screens: S-23.

**Core behaviour**
- An Editor assigns a design reviewer and a final-acceptance reviewer for the project.
- An assignee is an account that is a member or an administrator, or a named person who will use a reviewer link.
- The same person can hold both assignments, and an Editor can assign themselves.
- Each assignment shows the assignee, the account that made it and the time.
- An Editor can change an assignment at any time.

**Refusals and edge cases**
- Assigning an account that is neither a member of the project nor an administrator is refused with the reason.
- When an assignee's account is deactivated, removed from the project or stops qualifying, the assignment shows Unavailable with Reassign and Continue without approval.
- An assignment gives no account any access to the project that it did not have.
- With no reviewer assigned, no control in the project is disabled for want of an approval.

**Access and restore**
- A revision restore leaves assignments unchanged.

Notes: Left to later stories: decisions by the design reviewer's account (story 4.6b); what Continue without approval records (story 4.6c); links for named people (story 4.7a); the final-acceptance decision on a closeout record (story 5.12d); keeping or changing assignments for a later scope (story 6.10).

### Story 4.6b: Request a review, comment and decide by account

As a reviewer with an account, I want to comment on a saved revision and record my decision, so that my sign-off is on record against the exact design I looked at.

Covers: FR-24 (decisions by account), FR-69 (decisions name the account). Screens: S-22, S-23.

**Core behaviour**
- An Editor requests a design review of a saved revision. The request records the account and the time.
- A signed-in Editor or administrator, or a Viewer who is the design-review assignee, can pin comments on the plan of a saved revision.
- The same people can record a decision on it, Approve or Request changes, under their account. An Editor who is the assignee can approve their own revision.
- A decision records the account with its name at the time, the time and the revision.
- A later decision adds a new entry and the earlier ones stay listed.
- Requests, comments and decisions are listed with the revision in the Records timeline, in place of the prototype's Review dialog.
- After the working layout is edited, the reviewed revision and its decisions are unchanged.

**Refusals and edge cases**
- A comment or decision from a Viewer who is not the assignee is refused by the server.
- Requesting a review when no design reviewer is assigned is refused with a prompt to assign one. (CC-14)
- A decision retried with the same operation identifier is recorded once.
- After an assignee's account is deactivated or removed from the project, its earlier decisions stay listed and its next attempt to decide is refused.
- A decision submitted by a Viewer whose assignment was reassigned while their page was open is refused with the reason, and the text they typed stays on the page. (CC-15)
- A decision changes no device record, note or photo, and gives no account any access it did not have.

**Access and restore**
- A revision restore leaves requests, comments and decisions unchanged.

Notes: Left to later stories: bypass and the review state shown for a revision (story 4.6c); decisions by people without accounts (story 4.7a).

### Story 4.6c: Bypass a review, and the review state of a revision

As a designer, I want to bypass a review and to see at a glance where each revision stands, so that sign-off never blocks the work and a bypass is never mistaken for an approval.

Covers: FR-25, FR-69 (bypasses name the account). Screens: S-22, S-23.

**Core behaviour**
- An Editor can bypass the design review of a saved revision, whatever has been recorded on it.
- A bypass is recorded on that one revision, as Bypassed and never as Approved, with the account, the time and an optional reason.
- Bypassing one revision changes the state of no other revision.
- Each saved revision shows one review state, drawn with the approval-state component of story 3.2: No review, Awaiting decision, Approved, Changes requested or Bypassed.
- The state is No review when nothing is recorded on the revision, Awaiting decision after a request with no decision since, and Approved or Changes requested after the latest decision. (CC-16)
- A revision saved later starts at No review.
- Once a revision is bypassed its state stays Bypassed. A decision recorded afterwards is kept and labelled as made after the bypass. (CC-17)
- Continue without approval on an Unavailable assignment records a bypass on the revision being reviewed.

**Refusals and edge cases**
- A bypass retried with the same operation identifier is recorded once.
- A bypass changes no device record, note or photo, and gives no account or link any access it did not have.
- With every review bypassed, no control in the project is disabled for want of an approval.

**Access and restore**
- A revision restore leaves bypasses and review states unchanged.

Notes: Left to later stories: the state shown in the frame for the issued design (story 4.8a); bypass of final acceptance on a closeout record (story 5.12d).

### Story 4.7a: Reviewer links: open one revision, comment and decide

As a client reviewer, I want to open one revision from a link, comment on the plan and give my decision without an account, so that I can review a design without being given the project.

Covers: FR-24 (reviewer links), FR-69 (unverified name in the interface), FR-71 (link events), NFR-5. Screens: S-24.

**Core behaviour**
- An Editor creates a reviewer link for one saved revision and for the named person assigned as design reviewer. (CC-18)
- "Members and reviewer links" lists the project's links with their revision and named reviewer, and an Editor can copy a link from it.
- A link opens only its revision, read-only, with its floors and comment pins.
- The reviewer enters a name before anything else, and the page says the name is not verified.
- The reviewer can pin comments on the plan and submit a decision, Approve or Request changes.
- Each decision shows the entered name, the time and the revision.
- A later decision through the same link is added as a new entry. Earlier entries stay listed and the latest is shown as the reviewer's current decision.
- A decision through a link sets the revision's review state as an account's decision does in story 4.6c.
- A decision made through a link is labelled with the name marked "not verified", in the review list and in the Records timeline. A decision made by an account shows the account name without that mark.
- A decision through a link adds an activity-log entry with the entered name marked not verified.
- Creating a link adds an activity-log entry with the acting account. No entry contains the link's token.

**Refusals and edge cases**
- The server refuses a request from the link for the working project, another revision, another project or a file that the revision does not contain.
- Creating a link when the design reviewer is an account, or when none is assigned, is refused with the reason.
- A decision retried, or submitted from two browsers with the same operation identifier, is recorded once.
- A submission with no name, or over a limit below, is refused with the reason.

**Limits and values**
- The name is required and is at most 80 characters. (CC-19)
- A comment is at most 2,000 characters, and a link accepts at most 200 comments. (CC-20)

**Access and restore**
- A revision restore leaves links and what was recorded through them unchanged.

Notes: Left to later stories: replacing, revoking, expiry and the administrator's list (story 4.7b); the unverified-name label in packages (story 4.10a); links to a closeout record (story 5.12d). This replaces the prototype's development-only review service.

### Story 4.7b: Reviewer links: replace, revoke, expire and oversee

As a designer or an administrator, I want to replace, revoke and oversee reviewer links, so that an unauthenticated link never stays open longer or wider than intended.

Covers: FR-24 (revocable, replaceable links), FR-70 (Reviewer links), FR-71, NFR-5. Screens: S-24, S-32.

**Core behaviour**
- Editors can replace and revoke their project's links.
- Replacing a link makes the old one stop working at once.
- Revoking or replacing a link keeps its earlier comments and decisions.
- A link expires 30 days after it was created, and an Editor replaces it to give more time.
- Replacing and revoking a link each add an activity-log entry with the acting account. No entry contains the link's token.
- An administrator sees every active link in the installation with its project, revision, named reviewer, creator and last use, and can revoke any.
- Revoked links move to a history list with their decisions.

**Refusals and edge cases**
- After a link is revoked or replaced, its next request is refused. Text already typed stays on the page and nothing is recorded.
- A request through an expired link is refused and nothing is recorded.
- When the assignment a link serves is reassigned, or the review of its revision is bypassed, the link still shows the revision and accepts no new comment or decision. (CC-21)
- A standard user cannot open the installation's list of links.

**Limits and values**
- A revoked or replaced link reads "This link is no longer valid", and an expired one reads "This link has expired". (CC-23)
- After 20 requests with invalid link tokens from one network address within 15 minutes, further link requests from that address are refused for 1 minute, doubling after each further failure up to 15 minutes: the figures story 1.3a uses for failed sign-ins. (CC-22)

Notes: Left to later stories: a link whose revision is superseded (story 4.8b); whose scope is closed (story 5.12c); whose project is archived (story 6.11); links cancelled by a restored project (story 8.2b) or a recovered installation (story 8.3a).

### Story 4.8a: Issue a design as the current reference

As a designer, I want to issue a named revision and mark it as the current reference, so that installers know exactly which design they are building.

Covers: FR-25 (issuing without approval), FR-26, FR-55 (an issued device is not a deletable draft), FR-61. Screens: S-22, S-01.

**Core behaviour**
- An Editor issues a saved revision of the active scope in three steps: choose the revision, then record an approval, request a review or bypass, then confirm that it becomes the current reference.
- The three choices in the second step are offered with equal weight, and each records what story 4.6b or story 4.6c records.
- A revision can be issued with its review bypassed, or while a requested review is still awaiting a decision. (CC-24)
- After issuing, the frame's issued-design chip shows the revision's identifier, its name, the issue date and the scope.
- The chip opens the issued design read-only.
- The issued design's review state shows separately from Current, as Approved, Changes requested, Awaiting decision or Bypassed.
- Each designation records the account and the time, and the Records timeline lists every designation in order.
- Designating changes no working record: every device, position, note and photo is the same before and after.
- Saving a new revision, or exporting the estimate or a schedule, leaves the designation unchanged.

**Refusals and edge cases**
- When two people designate at once, one succeeds and the other sees a conflict naming the revision that is now current.
- A Request changes decision recorded after issuing changes the state shown to Changes requested and leaves the designation unchanged.

**Access and restore**
- A revision restore leaves the designation and its history unchanged.
- A proposed device contained in an issued design is not offered Delete draft, and the "Why can't I delete this?" link gives that reason.
- A Delete draft sent from a view loaded before the design was issued is refused with the reason, and the device is unchanged.

Notes: Left to later stories: superseding and comparing with the working project (story 4.8b); the issued-design strip where installers start work (story 5.1a and story 5.2); the warning when work starts with nothing issued (story 5.3a); the test that an earlier scope's revision cannot be designated, and a later scope starting at Not issued (story 6.10); a service scope, which needs no issued design (story 6.12c). An issued revision is never at No review, because the second step always records a decision, a request or a bypass.

### Story 4.8b: Supersede an issued design and compare it with the working project

As a designer, I want to issue a later revision in place of an earlier one and compare what was issued with the project as it stands, so that the reference can move on without the earlier one being lost.

Covers: FR-24 (decisions kept), FR-26 (another fixed reference, comparison), FR-61 (deliberate change of designation). Screens: S-20, S-21, S-22.

**Core behaviour**
- When Revision B is made current after A, A is marked Superseded and links to the current one.
- A's snapshot, comments and decisions can still be opened, and its hash is unchanged.
- B shows no approval because A was approved: B's review state comes only from requests, decisions and bypasses recorded on B.
- A superseded revision can be made current again. The history then shows both of its designations, and the revision that was current is marked Superseded. (CC-25)
- The issued design can be compared with the working project in the compare view of story 4.1b.
- After the working layout is edited, the issued snapshot's hash and its decisions and bypass are unchanged.

**Refusals and edge cases**
- A reviewer link to a superseded revision still shows that revision and accepts no new comment or decision. (CC-21)
- A decision recorded by an account on a superseded revision is kept and labelled as made after it was superseded. (CC-27)

Notes: Left to later stories: proof that field records are untouched by a change of reference (story 5.3a and story 5.3c).

### Story 4.9: Cancel a proposal and correct a record

As a designer, I want to cancel a proposal that will not be installed, or correct a record entered in error, so that the design is right without deleting history or inventing a removal.

Covers: FR-55 (cancellation, correction), UX decision D8. Screens: S-04 device menu.

**Core behaviour**
- Of Delete draft, Cancel proposal and Correct record, the device menu offers the one that applies to the device.
- A "Why can't I delete this?" link lists what makes the device ineligible for the others.
- A proposed device in an issued design is cancelled with a short reason. The issued snapshot still shows it, and the compare view shows it as cancelled.
- A proposed device that was never issued and carries a survey note or photo is cancelled with a reason. Its identifier, history, notes and photos stay findable.
- A cancelled device leaves the proposed plan, the proposed schedule, the estimate total and the capacity totals.
- The cancelled device's estimate line is kept with its entered quantity and cost in a "Cancelled" group outside the total. An Editor can tick it as a committed cost, and it then counts in the total under that label. (CC-28)
- An Existing device entered in error or twice is corrected with a reason and, for a duplicate, a reference to the record that is kept. The correction is recorded as a correction, not as a removal.
- A cancellation or correction records the account, the time and the reason.
- Cancelled and corrected records are listed under Historical in Equipment with their reason, and are found by search.
- A cancellation or correction made by mistake is reversed with a reason. The device returns to where it was, and both entries stay in its history.

**Refusals and edge cases**
- A proposed device that is eligible for Delete draft is offered Delete draft, not Cancel proposal.
- A cancellation, correction or reversal with no reason is refused. (CC-29)
- A cancellation or correction based on a stale view of the device is returned as a conflict.

**Access and restore**
- A revision restore leaves cancellations and corrections unchanged, and its dialog lists a cancelled device that the revision still holds as proposed.

Notes: Left to later stories, each adding its own action to the device menu: reversing a mistaken Installed mark (story 5.3b) and recording a removal (story 6.8a). Also left: cancelling a proposal that carries test attempts (story 5.5b); the cancelled item in the closeout (story 5.12b).

### Story 4.10a: Design package: contents drawn from a saved revision

As a designer, I want a Design package generated from a saved revision with everything an installer needs in it, so that what I hand over matches one fixed design.

Covers: FR-33 (Design preset contents), FR-34 (fixed source and cutoff), FR-69 (unverified name in packages). Screens: S-37.

**Core behaviour**
- A package is generated from a saved revision, never from the working project.
- The cover and the manifest identify the property, the scope, the revision, the edition, the issue and export dates, the units, the floors included, the decision cutoff and Draft or Issued status.
- A package of a revision that is not issued reads Draft.
- The package contains proposed floor plans with labelled devices and routes, Existing equipment shown as context, and a legend.
- The package contains the equipment and cable schedules, the quantities and the capacity summary.
- The package contains survey notes, measurements and photos.
- The package contains the review requests, decisions and bypasses recorded on the revision.
- Every device identifier on a plan sheet matches its row in the equipment schedule.
- Design content is taken from the revision's snapshot. Review entries are separate records added over time, and the package prints those recorded up to its cutoff.
- The cutoff is the time generation started. (CC-30)
- Survey notes, measurements and photos are printed as recorded up to the time the revision was saved. (CC-31)
- A decision made through a reviewer link is printed with its name marked not verified. A decision made by an account is printed with the account name, without that mark.
- At this story the generated PDF is saved by the browser, no edition is kept on the server, and the cover reads "Not retained".

**Refusals and edge cases**
- Generate is disabled, with the reason, when the selection produces no pages.
- A required file that cannot be read fails the generation with the file named; no blank page takes its place.

Notes: Left to later stories: page layout and options (story 4.10b); volumes and upload (story 4.10c); kept editions (story 4.10d); scoped checklist expectations linked by device identifier (story 5.4b); open issues (story 5.9b); the Closeout preset (story 5.12e); planned actions and retained context (story 6.6b); the extended-model sheets (story 7.7).

### Story 4.10b: Design package: page layout and options

As a designer, I want the package laid out on readable pages with clear options for what is included, so that it prints well and nothing is left out without saying so.

Covers: FR-33 (layout, options, omission labels), NFR-6, AD-11 (smaller pages), experiment R15. Screens: S-37.

**Core behaviour**
- Coverage and DORI sheets are separate from the plan sheets and optional.
- Each coverage or DORI sheet shows zone targets, results and shortfalls with the basis, assumptions and limits of the analysis.
- A table or note that runs over a page continues with its heading repeated, and no row is cut off.
- Each photo is captioned with its device or note identifier, floor and date.
- Prices and labour costs can be turned on for a package. Turning them on changes no saved record and no one's access.
- Photos can be left out, and the package then names what was omitted.
- Schedule and table pages are written as real text that can be selected and searched.
- Plan and photo pages are images at the JPEG quality chosen in experiment R15.

**Refusals and edge cases**
- A selection of some floors is labelled Partial before generation and on every page, and the manifest lists the floors included.
- A plan background that is not included, such as a live map, is named as omitted.

**Limits and values**
- Pages are Letter or A4 landscape.
- Photos are two to a page.
- Prices and labour costs are off by default, and all floors are selected by default.

**Evidence to record**
- Experiment R15 is run and recorded: plan and photo pages printed at JPEG quality 0.94, 0.85 and 0.75 and compared by a person, with the chosen quality and the reason written down.

Notes: Experiment R1 found the prototype's pages at 570 to 710 KiB each, which reaches 100 MiB at about 150 pages; text pages and the R15 quality bring that down.

### Story 4.10c: Design package: volumes, upload and verification

As a designer, I want a large package split into volumes and uploaded reliably, so that a big property still produces one complete, checked edition.

Covers: FR-33 (volumes, limits), FR-34 (failed generation visible and retryable), NFR-6, AD-4, AD-11, experiments R1 and R6. Screens: S-37.

**Core behaviour**
- All volumes of an edition come from the one revision.
- A volume is split at the page or size limit below, whichever comes first, and volumes are numbered.
- The manifest lists every volume and its hash.
- Each volume uploads in equal parts with progress and time remaining.
- Each volume is released from memory before the next is generated.
- The screen says the tab must stay open.
- The server checks each completed file's size and hash against the declared values.
- The edition is listed, in Packages and in the Records timeline, only when every volume and the manifest are stored and verified. Its cover no longer reads "Not retained".

**Refusals and edge cases**
- A size or hash mismatch shows Failed with Retry.
- A failed edition shows as Failed, is not listed as an edition, and can be retried.
- After a dropped connection the upload resumes from the last accepted part.
- When the volumes generated so far reach the edition limit, generation stops, the edition shows Failed with the reason, and the volumes already stored are discarded. (CC-32)
- That failure offers a smaller floor selection or fewer optional contents. Nothing is left out silently to fit.
- If the tab is closed during generation or upload, no edition is listed, generation can be started again, and the parts already stored are discarded as an unfinished upload under story 2.6c.
- If the person's role changes to Viewer or their membership is removed during upload, the next part is refused, the stored parts are discarded and no edition is listed.
- If the session ends between parts, the stored parts are kept, and after the same account signs in again in the open tab the upload resumes from the last accepted part. (CC-33)

**Limits and values**
- A volume is at most 250 pages and 100 MiB.
- An edition is at most 1 GiB across its volumes and manifest.
- An upload in progress counts as use of the session, so an edition that takes longer than the 24-hour idle period is not cut off by it.

**Evidence to record**
- Generation time and upload time are reported separately.
- On the acceptance-size project from story 2.7b, generating a complete edition takes no more than 5 minutes, not counting upload. (CC-34)

Notes: Experiments R1 and R6 were run early and their results are in the architecture. The 5-minute timing here is a development measurement; the acceptance run is story 10.2c. Left to later stories: counting editions toward project storage usage, and abandoned parts not counting (story 8.5).

### Story 4.10d: Design package: editions kept exactly

As a designer, I want every generated edition kept exactly as it was, so that what I handed over can always be downloaded again unchanged.

Covers: FR-34 (fixed packages, editions), FR-61 (packages of a superseded issue; export does not designate). Screens: S-20, S-37.

**Core behaviour**
- Edition numbers are given by the server.
- Each kept edition lists its source revision, its date and its decision cutoff.
- Downloading an edition again returns the same bytes.
- Regenerating, or generating after a later decision, creates a new dated edition with its own cutoff and leaves the earlier one unchanged.
- Generating a package of a revision that is not the current reference leaves the designation unchanged.
- After a revision is superseded, its editions are still listed and download with the same bytes as before.

**Refusals and edge cases**
- Two people generating for one revision at once get two editions with different numbers.

**Access and restore**
- A revision restore leaves every edition unchanged.

Notes: Left to later stories: appending an edition to an archived project (story 6.11); editions in backups (story 8.1a and story 8.4a).
