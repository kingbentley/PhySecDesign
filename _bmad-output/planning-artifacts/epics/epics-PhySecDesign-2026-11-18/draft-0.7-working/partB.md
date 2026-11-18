## Epic 2: One shared project online

**Outcome.** The existing design tool runs as one shared project, on Cloudflare and on your own server. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work.

**Depends on.** Epic 1 complete. Nothing later.

**Why here.** Issued designs, field evidence, conflict checks and fixed packages all assume a shared server-saved record, which the prototype lacks, and the self-hosted image is built at the end of this epic so that both hosts are exercised from early on.

### Story 2.1: Open a project as a member and work in it together

As a designer (an Editor), I want to open a project I belong to and have its records held on the server, so that my colleagues and I work on one copy.

Covers: FR-2, FR-45 (first work scope), FR-68 (project list), FR-69, AD-2, AD-5. Screens: S-28, S-31.

**Core behaviour**
- A member who opens a project sees it loaded from that project's own store.
- Creating a project asks for the name of its first work scope, with "Initial design" filled in as the default.
- The project is created with that scope, in the state In progress, as its active scope.
- The first scope records the account that created it and the time.
- The project list shows, for each project, its active scope's name and state and the time of its last activity.
- The Projects table in Administration (story 1.8c) shows the same scope name, scope state and last activity for every project.
- A Viewer opens and reads the project with editing controls removed and a "View only" mark in the header.
- An administrator opens a project they were never added to and can edit it.
**Refusals and edge cases**
- A signed-in standard user who is not a member cannot open the project, including by typing its address.
- Two projects share no records: a change saved in one never appears in the other.
- A change request sent to the project as a Viewer is refused by the server.
- A scope name that is empty or too long is refused with the reason, and no project is created.
**Limits and values**
- A scope name has 1 to 80 characters. (CB-01)
- For a project with no saved change yet, the last activity is its creation.
**Access and restore**
- A revision restore leaves the project's work scopes unchanged.

Notes: Left to later stories: scope categories (story 6.7); later scopes and reopening (story 6.10); the attention count on the project list (story 5.9b); the "View only" mark in the project frame (story 3.1a); refusal of a non-member's request for a project file (story 2.6c).

### Story 2.2a: Save edits to the shared project and show the save state

As a designer, I want my edits saved to the shared project automatically with a truthful status, so that I know my work is safe.

Covers: FR-21, NFR-2, AD-5. Screens: S-01.

**Core behaviour**
- An edit to anything the prototype can edit (a building, floor, plan placement, device, route, obstruction, zone, note, analysis setting or capacity input) is saved to the server when it is committed, with no Save button.
- Opened in a second browser, the project shows the saved value.
- A committed edit shows Saving on its item, then Saved once the server has acknowledged it.
- The saved value survives closing the browser and restarting the service.
- Each building, floor, plan placement, device, route, obstruction, zone and note is saved as its own versioned item, and each floor's analysis settings are one item.
- While an item is dragged, intermediate positions are not saved; the completed move is saved as one change.
- The save status is a small element in the existing prototype header showing Saving, Saved or Unsaved with a count.
- Choosing the save status opens a list of the items not yet saved.
- A saved edit updates the project's last activity in the project list.
- An Editor can still delete a route, an obstruction or a zone as in the prototype, and each deletion is saved as one operation.
- Capacity inputs (retention, and each camera's bitrate, recorded percentage and power allocation) are saved to the server, and the prototype's Capacity dialog works from the saved values. (CB-02)
- The prototype's Materials dialog lists equipment and cable quantities from the saved records and offers no cost entry.
- Cost entry, named revisions and review are not offered in a shared project: each says that the feature is not available yet. (CB-03)
**Refusals and edge cases**
- A save whose reply was lost is retried with the same operation identifier, and the change is applied once only.
- Apart from plan images, no control in a shared project keeps project data only in the browser.
**Evidence to record**
- On the locally run server, a single-item save is acknowledged within 2 seconds in at least 19 of 20 trials, and the results are recorded as a development measurement.

Notes: Left to later stories: lost connections, lost access and ended sessions (story 2.2b); the Conflict state (story 2.4); guarded deletion of floors and buildings (story 2.5), of devices (story 2.7a) and of survey entries (story 2.10a); plan images on the server (story 2.6c); named revisions (story 4.1a); cost entry in the estimate (story 4.4); capacity estimates in place of the Capacity dialog (story 4.5); review (story 4.6b); the status in the project frame (story 3.1a); the 2-second target against the large fixture (story 2.7b) and at acceptance (story 10.2a).

### Story 2.2b: Keep unsaved edits through a lost connection, lost access or an ended session

As a designer, I want edits that could not be saved kept in front of me with the reason, so that nothing I typed disappears without my knowing.

Covers: FR-21, FR-68 (access changes), NFR-2. Screens: S-01.

**Core behaviour**
- With the connection lost, an edit shows Unsaved and stays on the page.
- The header status counts the unsaved items.
- When the connection returns, unsaved edits are sent again without the user doing anything and become Saved.
- Closing or reloading the page with unsaved items first shows the browser's leave-page warning.
- When the session ends while project edits are unsaved, they stay on the page and are saved after the same account signs in again.
**Refusals and edge cases**
- If the user's role is changed to Viewer, their membership is removed or their account is deactivated while they hold unsaved edits, the next save is refused.
- Those edits stay on the page marked "not saved: access changed", their values can be copied, and they are not sent again.
- Each refused item in the save-status list shows its own reason, and items refused for different reasons are listed together.
- If a different account signs in on that page, the earlier account's unsaved edits are not shown to it and are not sent.
- Those edits stay bound to the earlier account and are offered again only when that account signs in again in the same browser.

Notes: Left to later stories, each adding its own refusal reason to the list: "not saved: no active scope — reopen first" (story 5.12c); "not saved: project archived" (story 6.11); "not saved: project was restored" (story 8.2b). An edit that clashes on reconnection becomes a conflict in story 2.4.

### Story 2.3: See other people's changes within seconds

As a designer, I want changes saved by someone else to appear without reloading, so that we work from the same picture.

Covers: FR-2, FR-69, AD-6, AD-7.

**Core behaviour**
- With two browsers on one project, a change saved in one is shown in the other within 5 seconds, without a reload.
- A tab that regains focus checks for changes at once.
- Each accepted operation adds one change-log entry with the actor's account and name at that time, the session, the time, and the values before and after.
- A member who opens the project after being away sees the current saved state, however many changes were made meanwhile.
**Refusals and edge cases**
- While a form is being filled in or an item is being dragged, an incoming change to that item does not replace the local input.
- The user is told that the item was updated and by whom.
- A hidden tab does not check for changes.
- A change-log entry cannot be edited or removed through any route.
**Access and restore**
- A revision restore adds entries to the change log and removes none.

### Story 2.4: Resolve a conflict without losing either edit

As a designer, I want a clash on the same item shown side by side, so that I can choose what to keep.

Covers: FR-42, FR-21 (Conflict status). Screens: S-F7 pattern on desktop.

**Core behaviour**
- When two browsers edit the same camera and both save, the first save is accepted and the second becomes a conflict.
- The conflict is shown on the item and keeps its pending values.
- When two browsers edit different cameras and both save, both succeed.
- The header save status shows Conflict with a count, and its list includes the conflicting items.
- Opening a conflict shows, for each field that differs, the saved value, who saved it and when, beside the pending value.
- For each field the user keeps the saved value or reapplies their own.
- Choosing the saved value for every field clears the conflict and saves nothing.
**Refusals and edge cases**
- Saving the reapplied choices checks the item's version again; if the item has changed once more, a new conflict is shown and nothing is overwritten.
- An edit left Unsaved during a lost connection, whose item someone else changed meanwhile, becomes a conflict on reconnection and does not overwrite the other person's change.
- A conflict stays on the page until the user resolves it, and is never merged or dropped without the user's choice.
- An operation that changes several items is applied completely or not at all: if one of its items conflicts, none of its changes is saved.

### Story 2.5: Buildings and floors on the server, with guarded deletion

As a designer, I want buildings and floors kept as separate records, so that each floor's content stays independent and nothing referenced can be deleted by accident.

Covers: FR-1, FR-60. Screens: S-03 left panel.

**Core behaviour**
- With several floors, switching between them shows each floor's own drawing placement, equipment, routes, obstructions, zones, notes and analysis settings.
- Content and results from one floor never appear on another.
- A renamed floor or building keeps its identity.
- A new floor that reuses an earlier name has a new identity.
- Opening a project loads its list of buildings and floors and the content of the selected floor only.
- Another floor's content is requested when that floor is first opened.
- A floor that holds no device, route, obstruction, zone or note can be deleted.
- A building with no floors can be deleted.
**Refusals and edge cases**
- Deleting a floor that holds any device, route, obstruction, zone or note is refused, the blocking records are listed, and the floor and its content are unchanged.
- Hiding layers or clearing the visible plan does not make a floor eligible for deletion.
- Deleting a building that still has a floor is refused, with its floors listed.
- The last remaining floor of a project, and the last remaining building, cannot be deleted, and the reason is shown. (CB-04)
- A deletion requested from a stale view, after content was added to the floor in another browser, is refused with the new content listed.
- A refused deletion never deletes or moves any other record.
**Access and restore**
- A revision restore deletes no building or floor and renames none. (CB-05)

Notes: Left to later stories, each adding its own blocking record to the deletion rule: a stored plan (story 2.6c); survey entries (story 2.10a); a saved revision that holds the floor (story 4.1a); a floor-level site check with an attempt (story 5.8); a closeout record that holds the floor (story 5.12b); a removed device's last location (story 6.8a); annotations (story 7.4); a closet (story 7.5a); a riser reference (story 7.6a). Undoing a floor or building deletion is story 2.11a. The plan-switch timing is story 2.7b.

### Story 2.6a: Property lookup and map views

As a designer, I want to find the property by address and switch between street and aerial maps, so that I can place the design where the building really is.

Covers: FR-3, FR-70 (saved map key in use). Screens: S-03.

**Core behaviour**
- Searching by address or by coordinates moves the map view to the result and changes nothing else.
- Street mapping from OpenStreetMap works with no key.
- Switching between street and aerial views leaves the aligned plan and every device at the same geographic position.
- With a Google mapping key saved in Settings (story 1.10a), Google mapping is offered to every member of every project without anyone entering a key.
- The prototype's per-session key dialog is removed.
**Refusals and edge cases**
- A lookup that fails, or a provider that is unavailable, shows a plain message.
- Without a saved key, Google mapping is not offered.
- The Google mapping key is sent only to the browsers of signed-in users.

### Story 2.6b: Import, align and lock a plan

As a designer, I want to import a plan image or a PDF page and align and lock it on a floor, so that I design over the real drawing.

Covers: FR-4, FR-5, FR-6, AD-10. Screens: S-03.

**Core behaviour**
- An imported plan image, or one chosen page of a PDF, is placed on the selected floor.
- The plan's position, rotation, uniform scale, opacity and lock state can be changed, and they are the same after a floor change and after a reload.
- Moving, aligning or replacing a plan leaves equipment and obstructions at their geographic positions.
- Two-point alignment shows a preview of the move, rotation and scale before it is applied.
- A plan placed from a PDF keeps the source file name and the page number, and both are shown with the plan.
- A PDF's password is used in the browser only and is absent from every request and record.
**Refusals and edge cases**
- Cancelling an alignment leaves the earlier alignment unchanged.
- Choosing the same point twice is refused, and the earlier alignment is unchanged.
- A wrong PDF password asks again, and cancelling leaves the floor unchanged.
- A file that is not PDF, PNG, JPEG or WebP, or that is empty, truncated or unreadable, is refused with a plain reason, and the floor's earlier plan is unchanged.
**Limits and values**
- A PDF over 100 MiB or an image over 25 MiB is refused with the limit named, and the floor's earlier plan is unchanged.
**Access and restore**
- A revision restore returns each floor's plan, placement and alignment to the revision's values.
**Evidence to record**
- The preview of a selected PDF page appears within 30 seconds on a test PDF whose size and page count are recorded, as a development measurement.

Notes: Left to later stories: the original file and its preview stored on the server (story 2.6c), until which the plan image stays in the browser's own storage; undoing an applied alignment (story 2.11a); the password's absence from backups (story 8.1a and story 8.4a).

### Story 2.6c: Plans stored on the server with their originals

As a designer, I want a plan's original file kept on the server with a preview, so that the drawing can be traced, shared and reused.

Covers: FR-4 (retained original), FR-6 (retained source PDF), NFR-2, AD-3, AD-4. Screens: S-03.

**Core behaviour**
- On import, the original file and a preview are uploaded in 8 MiB parts with visible progress.
- The plan shows Saved only when both files are stored, checked and referenced by the floor.
- Another member who opens the floor in a second browser sees the plan.
- The server checks the hash and size of each completed upload against the values the browser declared.
- An upload interrupted by a lost connection or a closed tab resumes from the last accepted part when the same file is chosen again.
- One PDF used for two floors is stored once.
**Refusals and edge cases**
- A hash or size mismatch shows Failed with Retry, and the file is not referenced.
- If the user's role is changed to Viewer or their membership is removed between parts, the next part is refused, the parts already stored are discarded, and the plan shows "not saved: access changed".
- Each part accepted while an upload is in progress counts as use of the session.
- If the session ends between parts, the stored parts are kept and the sign-in prompt is shown.
- After the same account signs in again, that upload resumes from the last accepted part.
- A signed-in user who is not a member is refused a plan file, even with its exact address.
- A floor that holds a stored plan cannot be deleted, and the refusal lists the plan.
**Limits and values**
- An unfinished upload is discarded after 7 days. (CB-06)
- A completed file that no record references is removed by a daily clean-up once it is 24 hours old. (CB-07)
**Access and restore**
- A revision restore deletes no stored file.

Notes: Left to later stories: file storage on a self-hosted server (story 2.14), until which this story is tested on Cloudflare's runtime; project storage usage and the project budget (story 8.5).

### Story 2.7a: Equipment as individual records, findable across the property

As a designer, I want every device kept as its own record with a stable identity, so that it can be found, located and followed through its life.

Covers: FR-7 (base), FR-8 (base), FR-41 (Current and Proposed, base). Screens: S-03, S-08.

**Core behaviour**
- Two similar devices each have their own unchanging identifier and their own label, shown in the plan and in the equipment list.
- Every device has a lifecycle value of Proposed, Existing or Removed, and a newly placed device is Proposed.
- An Editor can set a device to Proposed or Existing, as the prototype's status field allows. (CB-08)
- A device once saved as Existing is marked as having been recorded as existing, and that mark stays if it is set back to Proposed. (CB-09)
- A device has an optional "Room or area" text field, shown with its other details. (CB-10)
- The plan and the equipment list have a basis control with Current installation and Proposed design, and the basis in use is always labelled.
- Current installation shows Existing devices only, and Proposed design shows Existing and Proposed devices. (CB-11)
- Choosing a placed device in the equipment list opens its floor with the device selected.
- Search by identifier, label, name, room or area, and model returns correct results.
- An Editor can delete a Proposed device that was never recorded as existing, as the prototype allows.
**Refusals and edge cases**
- Removed cannot be chosen as a lifecycle value.
- A device that is or has been Existing has no delete control. (CB-12)
**Access and restore**
- A revision restore replaces Proposed devices and their positions with the revision's, and leaves the recorded attributes of Existing devices unchanged.

Notes: Left to later stories: more equipment types (story 4.2); Delete draft with its Undo and preview (story 2.11b); correcting a device wrongly recorded as existing (story 4.9); Installed making an add-new device Existing (story 5.3a); existing-site inventory, condition and provenance (story 6.1); the Changes basis (story 6.6b); removal and the Removed value (story 6.8a).

### Story 2.7b: Acceptance-size test project and first timings

As the product owner, I want a repeatable test project of acceptance size and early timings against it, so that speed problems show long before acceptance.

Covers: NFR-4, SM-5 (large fixture and timings).

**Core behaviour**
- A script generates the acceptance-size test project through the server's own operations.
- The project has 10 buildings, 25 plans and 600 devices, of which 150 are cameras with 60 on the busiest plan, and it has obstructions, 20 targeted zones and routes on the busiest plan. (CB-13)
- A declared share of its devices is Existing.
- The same seed produces the same project.
- The script generates buildings, plans, devices, obstructions, zones and routes only, and takes its counts as options that later stories extend.
**Evidence to record**
- Against that fixture on the locally run server, search and filter return within 1 second in at least 19 of 20 trials.
- Selection and direct-edit feedback appear within 250 ms in at least 19 of 20 trials.
- A single-item save is acknowledged within 2 seconds in at least 19 of 20 trials.
- A change is seen in a second browser within 5 seconds in at least 19 of 20 trials.
- The project is open and usable within 10 seconds in at least 19 of 20 trials.
- A switch to another saved plan completes within 5 seconds in at least 19 of 20 trials.
- All results are recorded as development measurements, not as acceptance evidence.

Notes: Left to later stories: survey notes and photos in the fixture (story 2.10b); an inventory file (story 6.2a); plan and photo files up to the 8 GiB budget (story 8.2c); the small functional project, the workload manifest, its confirmation and the reference calculations (story 10.1); acceptance measurement (story 10.2a).

### Story 2.8a: Coverage computed off the main thread, with an honest status

As a designer, I want coverage analysis to run without freezing the page and to say when a result is current, so that I never read a stale number as final.

Covers: FR-10, FR-11, FR-12, FR-13, NFR-4, AD-9. Screens: S-05.

**Core behaviour**
- Changing a camera's bearing, lens or field of view, mounting height, tilt or range changes its footprint and the results that depend on it.
- Changing resolution changes image-detail results without changing the footprint.
- Linked optical values stay consistent with each other.
- An enabled wall or obstruction with a height shadows the camera views it blocks, and a disabled one does not.
- Combined coverage is calculated for the basis selected in story 2.7a, and the result names that basis.
- Overlap is counted once in covered area and shown separately as overlap.
- Editing the analysis boundary changes the analysed area, and the result names the boundary and the denominator in use.
- The floor's common target height is saved separately from each camera's own target height, and combined and zone results use it.
- Cameras left out of the calculation are listed under the result, each with the reason.
- The calculation runs in a Web Worker, and after an input changes the affected results show Updating until the calculation for the current inputs completes.
- A single camera's percentage and the combined percentage are labelled differently and never shown in the same position.
**Refusals and edge cases**
- Hiding a camera or a layer does not change any total.
- Without a custom boundary, the fallback area is stated.
- If every camera on the floor is left out, the result is shown as Not assessed, not as 100% unseen.
**Limits and values**
- While a calculation runs, selection and direct-edit feedback still appear within 250 ms. (CB-14)
**Access and restore**
- Obstructions, zones, the analysis boundary and analysis settings are design content that a revision restore returns to the revision's values.

Notes: Left to later stories: DORI and zone results (story 2.8b); sampling, the time allowance and saved summaries (story 2.8c); unsupported and illustrative views such as fisheye and stitched (story 7.1); accuracy against independent reference calculations (story 10.1 and story 10.2b).

### Story 2.8b: DORI and zone targets, with uncertain results flagged

As a designer, I want image-detail levels and each zone's result against its target, so that I can see where the design falls short and where the answer is too close to call.

Covers: FR-14, FR-15, FR-16, NFR-4. Screens: S-05.

**Core behaviour**
- Turning the DORI overlay on or off changes no saved value and no result.
- At each point, combined DORI is the best single unobstructed view; two overlapping views below a level do not add up to that level.
- An area seen below Detect is shown differently from an unseen area.
- A zone with a target shows its achieved percentage, its deficient area, and one of four results: Target met, Shortfall, Not demonstrated or Uncertain near target.
- A zone's result uses its full polygon, and any part of the zone that was not assessed stays in the denominator.
- Target met is shown only when the percentage calculated with every sampling cell on a zone or threshold edge counted as not qualifying still reaches the target. (CB-15)
- Shortfall is shown only when the percentage with those cells counted as qualifying is still below the target.
- When neither holds, the calculation is repeated once at half the spacing.
- If the result is still undecided, it is shown as Uncertain near target with both percentages.
- Zone results stay visible while a camera is adjusted.
**Refusals and edge cases**
- A zone without a target shows no result.
- When the target is not met and a camera in range of the zone was left out of the calculation, the result is Not demonstrated, not Shortfall. (CB-16)
- Rounding for display never changes a result: 89.96% against a 90% target is not shown as Target met.

Notes: Left to later stories: Not demonstrated and Not assessed for unsupported views (story 7.1).

### Story 2.8c: Sampling no coarser than 1 m, a time allowance and saved summaries

As a designer, I want every result computed at a stated fidelity and never quietly coarsened, so that the numbers mean the same on a small plan and a large one.

Covers: NFR-4, AD-9, experiment R2. Screens: S-05.

**Core behaviour**
- Sampling is 1 m or finer on every plan, and the spacing used is shown with the result.
- The prototype's fixed work budget and cell cap are removed.
- The contour mesh has its own size limit; above it the map shows the sampled overlay instead.
- The numbers are the same with either presentation, and the result says it is an estimate.
- The polygon clipping step uses one boundary for both its inside test and its intersection: a test case with a camera footprint crossing the boundary gives the same area by both paths.
- The last final summary for each floor is saved with a fingerprint of its inputs.
- On reopening, a summary whose fingerprint no longer matches is shown as Updating, not as final.
**Refusals and edge cases**
- A calculation that would exceed its time allowance is shown as Incomplete with the reason.
- Sampling is never coarsened to finish in time.
**Limits and values**
- The time allowance for one calculation is 10 seconds. (CB-17)
**Access and restore**
- A revision restore does not bring back saved summaries; they are recalculated from the restored inputs.
**Evidence to record**
- On the busiest plan of the fixture from story 2.7b, the spacing shown is 1 m or finer.
- That plan is timed in a Web Worker in a browser with 60 cameras and all 20 zones, and completes within 10 seconds of a committed edit in at least 19 of 20 trials.
- The timing is recorded as a development measurement.

Notes: Experiment R2 found that the prototype's work budget and cell cap coarsen sampling to 6 to 12 m on the acceptance workload, and that without them 60 cameras and 20 zones finish in under half a second at 0.5 m. Examination of the R2 experiment copies found the contour-mesh limit and the two clipping boundaries, which are prototype behaviour to correct. Left to later stories: acceptance measurement (story 10.2a).

### Story 2.9: Cable routes on one floor

As a designer, I want to draw and edit routes between devices on a floor, so that cable can be estimated.

Covers: FR-9 (base).

**Core behaviour**
- A route is drawn between two devices on one floor with waypoints and a cable type.
- The route shows a length estimate labelled as an estimate, in the floor's own scale.
- Each route has a run identifier that does not change when the route is edited.
- Moving an endpoint device or a waypoint updates the estimate.
- A floor's routes are requested when the floor is opened, not when the project is opened.
**Refusals and edge cases**
- Deleting a device that a route ends on does not delete the route, as it did in the prototype: the route stays, with that end shown as unassigned and marked for review.
- A route with an unassigned end is still counted in cable totals and is listed as needing review. (CB-18)
**Access and restore**
- Proposed routes are design content that a revision restore returns to the revision's values.

Notes: Left to later stories: the dependency preview before a connected draft is deleted (story 2.11b); removal of an installed device (story 6.8a) and the review of its cable ends (story 6.8b); runs between floors (story 7.6a) and the length ledger (story 7.6b).

### Story 2.10a: Survey notes and measurements as separate entries

As a designer, I want notes, measurements and installation constraints attached to a device or a point on the floor, so that what was found on site is kept with its place.

Covers: FR-20 (base), FR-45 (scope on evidence), NFR-5 (site credentials kept out of notes). Screens: S-04 Evidence tab.

**Core behaviour**
- A note, a measurement with its unit or an installation constraint is added to a device or to a point on a floor as a separate entry showing its author's name and the time.
- Each entry records the active scope.
- The note form offers optional prompts for lighting, shadows, uneven terrain and mount rigidity, and leaving them empty is allowed.
- The answers to the prompts are shown with the entry and change no coverage result.
- Evidence is reached from the plan, by its pin, and from the device.
- Moving a device keeps its entries with it, and an entry attached to a point on the floor keeps its position.
- Two people adding entries to the same device at the same time both succeed, and both entries are shown.
**Refusals and edge cases**
- Adding an entry never changes or removes an earlier entry.
- A saved entry has no edit or delete control; a correction is added as a new entry. (CB-19)
- A retried addition does not create a duplicate entry.
- A device that holds a survey entry cannot be deleted, and the refusal names the entry.
- A floor that holds a survey entry cannot be deleted, and the refusal lists the entry.
**Limits and values**
- The entry form shows "Do not enter passwords or access codes for the site's systems." (CB-20)
**Access and restore**
- Survey entries are not design content: a revision restore leaves every entry unchanged.

Notes: Left to later stories: photos (story 2.10b); refusal of a new survey entry or photo while the project has no active scope (story 5.12c).

### Story 2.10b: Survey photos kept with their originals

As a designer, I want photos attached to a device or a point on the floor with the original kept, so that visual evidence can be trusted later.

Covers: FR-20 (photos), NFR-2, AD-3. Screens: S-04 Evidence tab.

**Core behaviour**
- A photo is added to a device or to a point on a floor as its own entry, with its author's name, the time and the active scope.
- The photo's original and a preview are stored.
- The entry shows Uploading, then Saved only after the upload and the entry have both succeeded.
- A photo upload interrupted by a lost connection resumes from the last accepted part.
**Refusals and edge cases**
- A failed upload shows Failed with Retry and is never shown as Saved.
- A photo that is not JPEG, PNG or WebP, or is empty or unreadable, is refused with a plain reason and no entry is added.
- A retried addition does not create a duplicate entry.
- A signed-in user who is not a member is refused a photo file, even with its exact address.
**Limits and values**
- A photo over 25 MiB is refused with the limit named, and no entry is added.
**Access and restore**
- A revision restore leaves every photo entry unchanged and deletes no stored file.
**Evidence to record**
- A photo's preview is shown within 10 seconds of its upload completing, recorded as a development measurement.
- The fixture script from story 2.7b also generates survey notes and photos, in numbers it declares.

Notes: Left to later stories: photo capture on phones over poor connections, experiment R4 (story 5.5d).

### Story 2.11a: Undo and redo my own recent edits

As a designer, I want to undo and redo my own recent edits, so that slips are cheap to fix.

Covers: FR-21 (undo and redo), FR-5 (undo of an alignment), AD-7.

**Core behaviour**
- Undoing my own recent edit records a new reversal in the change log, and the item returns to its earlier value.
- Redoing an undone edit records a new operation, and the item returns to the value I had set.
- Making a new edit after an undo clears the redo list.
- Undoing an applied plan alignment restores the earlier alignment.
- Deleting an unused floor or building can be undone, and it returns with the same identity.
- Deleting a route, an obstruction or a zone can be undone, and it returns with the same identity.
**Refusals and edge cases**
- If someone else has since changed the item, or something that depends on it, my undo or redo is refused with an explanation that names the later change, and nothing of theirs is changed.
- Undo never removes or alters a survey entry or a photo.
- A retried undo or redo is applied once only.
**Limits and values**
- Undo and redo cover my last 40 edits made in the open page. (CB-21)
- Reloading the page or signing out empties both lists.

Notes: Left to later stories: full revision restore, a separate guarded action (story 4.1b); undo and a port reassigned by someone else (story 7.5c).

### Story 2.11b: Delete an accidental draft device

As a designer, I want to remove a device I placed by mistake in one step, with a way back, so that the design stays clean without risking real records.

Covers: FR-55 (Delete draft).

**Core behaviour**
- Delete draft replaces the plain delete of story 2.7a.
- An accidental proposed device that has no survey entry, no route and was never recorded as Existing can be removed with Delete draft.
- The device disappears at once with an Undo notice and no confirmation dialog.
- A deleted draft leaves the equipment list, coverage results and cable totals.
- Undoing a draft deletion returns the device with the same identifier.
- The device's change history is kept whether it stays deleted or is returned.
- Delete draft on a proposed device that has routes first shows a preview listing each route affected.
- On confirmation the device is deleted and each route is kept with that end shown as unassigned and marked for review.
- In that preview a route is deleted with the device only if the user selects it, and only if the route has no survey entry and its other end is also unassigned or on the same device. (CB-22)
**Refusals and edge cases**
- Delete draft is not offered for a device that has a survey entry or photo, or that is or has been Existing.
- For such a device a "Why can't I delete this?" link lists the reasons.
- A Delete draft sent from a stale view, after someone else added a survey entry or a route to the device, is refused with the reason, and the device is unchanged.
- A floor whose only devices are deleted drafts counts as unused under story 2.5. (CB-23)
- Undoing a draft deletion is refused, with the reason, if the device's floor has since been deleted.
- A retried Delete draft is applied once only.

Notes: Left to later stories: cancelling a proposal that cannot be deleted, and correcting a record (story 4.9). Later stories add their own conditions that make a device ineligible for Delete draft: inclusion in an issued design (story 4.8a); an Installed or Configured mark (story 5.3a); a test attempt (story 5.5b); an issue (story 5.9a); a Current installation port assignment (story 7.5c). A floor held in a saved revision stays undeletable even when its only devices are deleted drafts (story 4.1a).

### Story 2.12: Bring in a project saved by the prototype

As an administrator, I want to import a project file exported from the prototype, so that existing work is not lost.

Covers: FR-22 (format migration), FR-20 (images from older records), AD-14.

**Core behaviour**
- Importing a version 1 or version 2 prototype project file creates a new shared project with its buildings, floors, plans, devices, routes, obstructions, zones, notes, analysis settings and capacity inputs.
- Each device keeps the identifier and label it had in the file, and its Proposed or Existing status.
- Import is offered wherever Create project is, to the same people, and the importer becomes the project's Editor under the same rule.
- The import asks for the first work scope's name as story 2.1 does, with "Initial design" as the default.
- Before the import is confirmed, a review list names everything in the file that will not be brought in or cannot be represented exactly.
- Costs and named revisions in the file are named in that review list as not imported.
- Plan images held in the file are stored as previews, and each such plan shows "original not available".
- Photos held in the file's notes are stored as previews, and each shows "original not available".
- Imported notes show that they came from the prototype file and the date of the import, and no author is invented for them.
- The import itself is recorded with the importing account as its actor.
**Refusals and edge cases**
- The file is checked completely before anything is created.
- A file that is not valid JSON, is truncated, or is not a version 1 or version 2 prototype project file is refused with a plain reason, and no project is created.
- An import that fails part-way leaves no project in the project list and no stored files.
- Nothing in the file is dropped without being listed.
- Importing the same file twice creates two separate projects. (CB-24)
**Limits and values**
- A file over 100 MiB is refused with the limit named, and no project is created. (CB-25)
**Access and restore**
- A revision restore leaves the record of the import and the imported notes and photos unchanged.

Notes: Left to later stories: named revisions from the file (story 4.1a) and costs from the file (story 4.4), each then removing its item from the "not imported" list; the portable backup of the new format (story 8.4a).

### Story 2.13a: Run Site Studio on your own server over HTTPS

As an organisation's administrator, I want to start Site Studio on a Linux server with Docker and reach it over HTTPS, so that our data stays on our own machine.

Covers: FR-66 (self-hosted), NFR-7, AD-1, AD-16, AD-17.

**Core behaviour**
- One Docker image holds Cloudflare's open-source runtime at a pinned version, the same Worker bundle that is deployed to Cloudflare, and its configuration.
- The image is built for x64 and arm64 on a glibc base, and it starts on both.
- A Compose file starts the application and a bundled web server that provides HTTPS.
- With only a host name set, a browser reaches the sign-in page over HTTPS.
- The bundled web server obtains and renews a certificate for the configured host name automatically, and that is shown to work. (CB-26)
- The bundled web server uses certificate files the operator supplies instead, and that is shown to work.
- First-run set-up (story 1.2) works with the set-up code printed in the server output.
- Two installations started from the same image with separate volumes share no users or projects: an account on one cannot sign in to the other, and a project on one is not listed on the other.
**Refusals and edge cases**
- A plain HTTP request to the bundled web server is redirected to HTTPS.
- By default the application's own port is not published on the host; only the web server's ports are.
- A start while no administrator exists prints a new set-up code, and the earlier code stops working.
- Once an administrator exists, no start generates or prints a set-up code.

Notes: Left to later stories: an operator's own proxy (story 2.13b); the deployment key and administrator recovery (story 2.13c); the smoke suite (story 2.13d); files on disk (story 2.14); durability (story 2.15); the published installation instructions (story 9.1); the updater container (story 9.5a).

### Story 2.13b: Run behind your own HTTPS proxy

As an organisation's administrator, I want to put Site Studio behind the HTTPS proxy we already run, so that it fits our network without weakening sign-in.

Covers: FR-66 (self-hosted), NFR-5, AD-17.

**Core behaviour**
- An operator who uses their own HTTPS proxy turns the bundled web server off and lists the proxy's address in a trusted-proxy setting.
- Sign-in works both through the bundled web server and through an operator's proxy on the trusted list.
- Session cookies are always marked Secure.
**Refusals and edge cases**
- Forwarded-protocol and forwarded-address headers are believed only from an address on the trusted list.
- A request that reaches the application without HTTPS, directly or through a trusted proxy that reports plain HTTP, is refused and serves no page and no data. (CB-27)
**Limits and values**
- By default the trusted list holds the bundled web server only. (CB-28)

### Story 2.13c: Deployment key and administrator recovery on your own server

As an organisation's administrator, I want the key that protects stored secrets kept in a file I can copy, and a way back in if I am locked out, so that a restart or a lost password does not cost us the installation.

Covers: FR-66 (self-hosted), FR-70 (administrator recovery, self-hosted), NFR-7, AD-17.

**Core behaviour**
- On first start the server generates the deployment key that story 1.4 and story 1.10a encrypt with, and writes it to a key file in a folder set in the Compose file, separate from the records and files folders. (CB-29)
- On that first start the server output says where the key file is and that a copy must be kept off the server.
- After a restart, two-step verification secrets and Settings secrets saved earlier still work.
- After the containers are removed and recreated, or a newer image is started, the key file is unchanged and those secrets still work.
- When a key file is already in that folder, including one the operator placed there before the first start, the server uses it and generates no key.
- When the only administrator cannot sign in, a documented command run on the server prints a one-time recovery code.
- A named administrator account uses the code to set a new password and have its two-step verification reset, and the code works once and expires, as in story 1.8d.
- The issue of the code and its use each appear in the activity log.
**Refusals and edge cases**
- With records present and the key file missing, the server refuses to start, names the missing file and generates no new key. (CB-30)

Notes: Left to later stories: recovery of a whole installation with the key (story 8.3a) or without it (story 8.3b); the instruction to keep the key off the server, in the published instructions (story 9.1).

### Story 2.13d: Self-hosted smoke suite for accounts and the shared project

As an organisation's administrator, I want the self-hosted image put through the same automated cases on every build, so that what works on Cloudflare is shown to work on my server.

Covers: NFR-7, AD-16.

**Core behaviour**
- The self-hosted smoke suite from story 1.1 runs against the image in continuous integration and passes.
- Its cases are a named list, each naming the story it stands for. (CB-31)
- Case: set-up with the printed code creates the first administrator.
- Case: an invited user signs in with a password and a two-step code, and again after a restart.
- Case: a Settings secret saved before a restart is still usable after it.
- Case: an Editor's saved edit is read back after a restart.
- Case: a change saved in one session is seen in a second session within 5 seconds.
- Case: two saves to the same item return a conflict to the second.
- Case: a prototype project file is imported and the project opens.
- Case: the sign-in and the project's creation appear in the activity log.
**Refusals and edge cases**
- Case: a signed-in user who is not a member is refused the project, and a Viewer's change is refused.
- Case: a plain HTTP request is redirected or refused.

Notes: Left to later stories: the file cases (story 2.14). Each later area adds its own cases under standing rule 7.

### Story 2.14: Files on the server's own disk

As an organisation's administrator, I want plans and photos kept on my server's own disk and checked for damage, so that a self-hosted installation stores files as reliably as Cloudflare does.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-3, AD-4, AD-16.

**Core behaviour**
- On a self-hosted installation, a plan and a photo uploaded through the interface are stored in the live files folder through the runtime's disk service, and are shown again after a restart.
- Each stored file's SHA-256 hash and size are kept in the project's records.
- Upload is in equal 8 MiB parts and resumes from the last accepted part, with the same requests and replies as on Cloudflare.
- When an upload completes, the server computes the file's hash and size and compares them with the declared values.
- A download is streamed, and a range request returns exactly the bytes asked for.
- A file is stored under its content hash and is never overwritten, and the same content uploaded twice is stored once.
- The live files folder and the backup location are two separate settings in the Compose file, and the backup location has no default value.
**Refusals and edge cases**
- A hash or size mismatch shows Failed with Retry, and the file is not referenced.
- A stored file whose size or hash no longer matches its record is reported as damaged when it is requested, and is not served as if it were good. (CB-32)
- Every download passes the access gate: a user who is not a member is refused a file even with its exact address.
- The server refuses to start if the backup location is left unset, naming the missing setting. (CB-33)
- The server refuses to start if both settings point to the same folder, with an explanation.
- Two installations with separate volumes share no files: a file address from one is refused on the other.
**Limits and values**
- An unfinished upload is discarded after 7 days, as on Cloudflare. (CB-06)
**Evidence to record**
- One set of file-store tests passes against both the Cloudflare file store and the disk file store.
- The self-hosted smoke suite gains the file cases (upload a plan and a photo, restart, read back whole and by range) and passes against the image.

Notes: Left to later stories: behaviour when a disk is full (story 2.15); the first write to the backup location (story 8.1b); the warning when it is on the same disk as the live data (story 8.1c).

### Story 2.15: Records survive crashes and power loss

As an organisation's administrator, I want every acknowledged save to survive a crash or a power cut on my server, so that Saved means the same as it does on Cloudflare.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-2, experiment R12.

**Core behaviour**
- Records are kept on a persistent volume named in the Compose file.
- Records are still there after the containers are stopped and started, and after the containers are removed and recreated from the image.
- After space is freed on a full volume, saves and uploads succeed again without a restart.
**Refusals and edge cases**
- A second application container started on a records volume that is already in use refuses to start, with an explanation, and the first keeps working. (CB-34)
- When the records volume is full, a save is not acknowledged: the item shows Unsaved with the reason, and nothing already saved is damaged.
- When the files volume is full, an upload part is refused with the reason, the upload shows Failed with Retry, and no file is referenced.
- While either volume is full, administrators see a storage-full notice in Administration naming the volume. (CB-35)
**Evidence to record**
- With saves running continuously, the application container is force-killed 50 times; after each restart every acknowledged save is present and no project fails to open. (CB-36)
- Experiment R12 is run on a typical virtual-machine disk with the power cut during saves, at least 20 times; no acknowledged save is lost and no project fails to open, and the result is recorded. (CB-37)
- Experiment R12 is also run with the records volume on a network disk (NFS), and the result is recorded.
- Storage that loses an acknowledged save or fails to lock is listed as unsupported in the experiment record.
- If R12 fails on the typical virtual-machine disk, the story is not done; the fallback the architecture names is to require local disk for records.

Notes: Left to later stories: a full backup disk (story 8.1b); the supported kinds of server and storage, stated in the published instructions from this story's results (story 9.1).

## Epic 3: A workspace that holds the whole job

**Outcome.** The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure.

**Depends on.** Epic 1 complete, and Epic 2 through story 2.11b. Nothing later.

**Why here.** Epics 4 to 7 each add full pages, and those pages need the frame and the status components to exist first.

### Story 3.1a: Project frame

As a designer, I want to see which property, scope and reference I am working in, so that I always know where I am.

Covers: UX 5.1, 17.1, decisions D1 and D12, FR-2 (views), FR-21 (save status). Screens: S-01.

**Core behaviour**
- Every project screen sits inside one frame showing the property name, the active work scope's name and state, the issued design, the view switch, the save status and the account menu.
- The property name opens the project list.
- The issued design shows "Not issued".
- The save status from story 2.2a is shown in the frame, not in the prototype header, with Saving, Saved, Unsaved or Conflict and a count.
- The save status opens the list of pending and conflicting items.
- The account menu of Epic 1 moves from the prototype header into the frame, showing the user's name and role in this project, with My account and Sign out.
- Administrators also see Administration in the account menu.
- A Viewer sees a "View only" chip in the frame.
- The view switch offers Design and Installation.
- Switching the view sets the basis (story 2.7a) to Proposed design for Design and Current installation for Installation, and a brief notice says so. (CB-38)
- The user can then change the basis.
- "Members and reviewer links" lists who belongs to the project and each person's role.
**Refusals and edge cases**
- Switching the view changes no permission: a Viewer gains no editing control in either view.
- "Members and reviewer links" offers no control to change members.

Notes: Left to later stories: the areas as routes (story 3.1b); managing reviewer links (story 4.7b); the issued design chip filled in (story 4.8a); the Installation view's recording tools (story 5.2); the archived banner (story 6.11). Members are managed in Administration (story 1.8c).

### Story 3.1b: Eight areas, each with its own address

As a designer, I want to move between the areas of a project and return to one by its address, so that the whole job has a place.

Covers: UX 5.2, FR-2 (views). Screens: S-02.

**Core behaviour**
- Overview, Plan, Equipment, Connections, Costs and capacity, Field work, Issues and Records are separate routes, each loaded when first opened.
- A direct address or a reload opens the same area.
- Overview shows the active scope's name and state, each floor with its device count, and recent activity from the change log.
- The Materials and Capacity dialogs open as the Costs and capacity page, with the content they have after story 2.2a.
- Records is a timeline page, newest first, to which later stories add their entries; at this story it says that it holds no records yet.
- Connections, Field work and Issues each say plainly that the area is not available yet.
**Refusals and edge cases**
- A direct address to an area of a project the user does not belong to is refused.
- No placeholder figures or sample records are shown anywhere in the frame or the areas.

Notes: Left to later stories: Equipment as a page (story 3.5); the first Records entries, named revisions (story 4.1a); the estimate (story 4.4) and capacity estimates (story 4.5) on the Costs and capacity page; Field work (story 5.1a); Issues (story 5.9a); Connections, with closets and ports (story 7.5a) and cable runs (story 7.6a).

### Story 3.2: Status language components

As a designer, I want every status drawn the same way everywhere, so that I can read the state of things at a glance.

Covers: UX section 6, NFR-3.

**Core behaviour**
- One component renders every family and value in the UX status reference, each with a text label and an icon or shape.
- The component also renders an approval state with the values Approved, Changes requested, Bypassed, Awaiting decision and No review. (CB-39)
- A status reference page in the development build shows every family and value.
- The statuses already in the app use the component: save state (story 2.2a), lifecycle (story 2.7a) and analysis status (story 2.8a), including Updating, Not assessed and Uncertain near target.
- Device markers on the plan show lifecycle by outline: dashed for Proposed, solid for Existing.
- The marker component draws a condition glyph (none for Working, a warning triangle for Faulty, a question mark for Unknown), shown on the reference page.
- The incomplete-total component shows "Incomplete" with a count of unknown inputs and a link to them, shown on the reference page.
**Refusals and edge cases**
- Viewed in greyscale, each value in a family differs from every other value in that family both in its label and in its icon or shape.
- The incomplete-total component is never styled as a pass.
- Two different families are never combined into one badge.

Notes: Left to later stories, which use these components: totals with unknown inputs (story 4.4 and story 4.5); approval states (story 4.6c); condition on devices (story 6.1).

### Story 3.3: Readable text, contrast, targets and focus

As a designer, I want text I can read and controls I can hit, so that long sessions and field use are comfortable.

Covers: NFR-3, UX section 10, audit findings A2, A3, A5, A6.

**Core behaviour**
- Every interactive element, including map markers, shows a visible focus ring and can be reached and operated by keyboard.
- Every input has a visible label, and every error message names its field.
- Forms at 200% zoom show one column, with no clipped labels and no horizontal scrolling.
- Focusing a form field on iPhone Safari does not zoom the page.
- Markers keep a white halo.
**Limits and values**
- On desktop no text is smaller than 12 px, body text is 14 px, and 12 px is used only for map labels and table metadata.
- All text meets a contrast ratio of 4.5:1 against its background.
- Markers, icons and focus rings meet 3:1 against both the plan and aerial imagery.
- Desktop buttons are at least 32 px in each dimension, and actions in dense tables at least 24 px.
- On a screen 390 px wide, form field text is at least 16 px.
- The focus ring is 2 px.
**Evidence to record**
- The text contrast measurements are recorded for every screen that exists at this story.
- The marker, icon and focus-ring contrast measurements are recorded against both the plan and aerial imagery.

Notes: Left to later stories: the 44 px touch targets of the field shell (story 5.1a). Screens added later meet these rules under standing rule 5.

### Story 3.4: Plan workspace regrouped

As a designer, I want grouped tools and a docked analysis summary, so that the map is not covered and tools are easy to find.

Covers: UX 7.1, decision D5, audit findings A7, A8, A9, A12. Screens: S-03.

**Core behaviour**
- The left panel shows buildings and floors as a tree, each floor with its device count.
- Adding, renaming and deleting floors and buildings (story 2.5) is done in the left panel, not in a dialog.
- The tool dock has six groups: Select, Place, Draw, Annotate, Route and Note.
- Each group opens a short menu and remembers the last tool used in it.
- Every tool the prototype offered is in one of the groups: equipment types under Place; wall, obstruction, zone and analysis boundary under Draw; Measure under Annotate; survey note and photo under Note.
- The analysis strip replaces the floating card and shows the active analysis, its basis, target height, sampling, status chip and legend.
- Layers are grouped as Equipment, Analysis, Site and Connections, each with a visibility control, with a note beside them that hiding a layer does not change totals.
- With nothing selected, the right panel shows the floor's drawing, alignment, analysis settings and combined results.
**Refusals and edge cases**
- Plan alignment handles appear only while the plan is unlocked and Alignment is open, and never in the Installation view.
**Limits and values**
- At 1440 × 900 and at 1280 × 720 the analysis strip overlaps neither the dock nor the scale bar. (CB-40)

Notes: Left to later stories: attention marks on floors (story 5.9b); Awaiting placement in Place and the left panel (story 6.4); the annotation tools in the Annotate group (story 7.4).

### Story 3.5: Equipment as a full page

As a designer, I want the schedule as a full table with filters, so that a large property is workable.

Covers: FR-8, FR-68 (Viewer export), NFR-6, audit finding A1. Screens: S-08.

**Core behaviour**
- The Equipment page replaces the prototype's Equipment dialog, and its table shows the 600 devices of the fixture from story 2.7b with a sticky header.
- Each row shows the device's identifier, label, name, type, model, room or area, building, floor and lifecycle.
- A column chooser hides and shows columns.
- Search covers identifier, label, name, room or area, and model.
- Filters cover building, floor, type and lifecycle.
- The basis control from story 2.7a is at the top of the table, and the table lists the devices of the selected basis.
- Choosing a row opens that device's properties in a panel beside the table.
- Locate opens the device's floor with the device selected.
- The table has three segments: Placed, Awaiting placement and Historical; the last two are present and each says that it has no records yet.
- The filtered table exports as a CSV file holding the rows and columns shown.
- The exported file names the project, the basis and the time of export. (CB-41)
**Refusals and edge cases**
- A search or filter with no matches says so; it does not show an empty table without explanation.
- A deleted draft is not listed under Historical, or in any other segment.
**Limits and values**
- Search and filter results appear within 1 second on the fixture.
- While the table is scrolled from its first row to its last, no main-thread task lasts longer than 200 ms. (CB-42)

Notes: Left to later stories: the tabbed side panel (story 3.6); Historical filled by cancelled and corrected records (story 4.9) and removed devices (story 6.8a); Awaiting placement (story 6.4); multi-select for bulk cleanup (story 6.5); the Doors and gates tab (story 7.3).

### Story 3.6: Device inspector with tabs

As a designer, I want one inspector layout for every device, so that I know where each kind of information is.

Covers: UX 7.2. Screens: S-04.

**Core behaviour**
- The same inspector opens for a device selected on the plan and for a row chosen on the Equipment page.
- The header shows the device's identifier, label, name, type, model and its lifecycle chip.
- Tabs for Details, Optics, Work, Checks, Evidence and History are present, and Optics appears for cameras only.
- Details holds the device's identity, model, mounting, room or area, location and notes.
- Optics holds the camera controls of story 2.8a.
- Evidence lists the device's survey entries from story 2.10a and story 2.10b with author and time, and adds new ones.
- History lists the device's changes from the change log, each with its values before and after, the actor and the time.
- Work and Checks each say plainly that the feature is not available yet.
- The device menu offers Delete draft where story 2.11b allows it, and otherwise the "Why can't I delete this?" link.

Notes: Left to later stories: the other device-menu actions (story 4.9 and story 6.8a); the Work tab, filled with marks (story 5.3a), the planned action (story 6.6a) and port assignments (story 7.5a); the Checks tab (story 5.4a and story 5.5a); flag chips in the header (story 5.6a); condition in the header (story 6.1).
