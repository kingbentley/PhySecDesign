## Epic 2: One shared project online

**Outcome.** The existing design tool runs as one shared project, on Cloudflare and on your own server. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work.

**Depends on.** Epic 1 complete. Nothing later.

**Why here.** Issued designs, field evidence, conflict checks and fixed packages all assume a shared server-saved record, and the prototype saves only in the browser. The self-hosted image is built at the end of this epic (stories 2.13 to 2.15), at Kevin's decision, so that both hosts are exercised from early on.

### Story 2.1: Open a project as a member and work in it together

As a designer (an Editor), I want to open a project I belong to and have its records held on the server, so that my colleagues and I work on one copy.

Covers: FR-2, FR-45 (first work scope), FR-68 (project list), FR-69, AD-2, AD-5. Screens: S-28, S-31.

- A member who opens a project sees it loaded from that project's own store. A signed-in standard user who is not a member cannot open the project or any of its files, including by typing its address.
- Two projects share no records: a change saved in one never appears in the other.
- Creating a project asks for the name of its first work scope, with "Initial design" filled in as the default. The project is created with that scope, in the state In progress, as its active scope.
- The first scope records the account that created it and the time.
- A scope name that is empty or longer than 80 characters is refused with the reason, and no project is created.
- The project list shows, for each project, its active scope's name and state and the time of its last activity. For a project with no saved change yet, the last activity is its creation.
- The Projects table in Administration (story 1.8) shows the same scope name, scope state and last activity for every project.
- A Viewer opens and reads the project with editing controls removed and a "View only" mark in the header. A change request sent to the project as a Viewer is refused by the server.
- An administrator opens a project they were never added to and can edit it.

Notes: Every later record that belongs to a work cycle (survey entries in 2.10, revisions in 4.1, the estimate in 4.4, field evidence in Epic 5) carries the active scope; each of those stories states it. Scope categories and later scopes arrive in story 6.7 and reopening in 6.10. The attention count on the project list arrives in story 5.9. Story 3.1 moves the "View only" mark into the project frame.

### Story 2.2: Save edits to the shared project and show the save state

As a designer, I want my edits saved to the shared project automatically with a truthful status, so that I know my work is safe.

Covers: FR-21, FR-68 (access changes), NFR-2, AD-5. Screens: S-01.

- An edit to anything the prototype can edit (a building, floor, plan placement, device, route, obstruction, zone, note or analysis setting) is saved to the server when it is committed, with no Save button. Opened in a second browser, the project shows the saved value.
- A committed edit shows Saving on its item, then Saved once the server has acknowledged it. The saved value survives closing the browser and restarting the service.
- On the locally run server, a single-item save is acknowledged within 2 seconds in at least 19 of 20 trials, and the trial results are recorded.
- With the connection lost, an edit shows Unsaved and stays on the page. The header status counts the unsaved items.
- When the connection returns, unsaved edits are sent again without the user doing anything and become Saved.
- A save whose reply was lost is retried with the same operation identifier, and the change is applied once only.
- While an item is dragged, intermediate positions are not saved; the completed move is saved as one change.
- The save status is a small element in the existing prototype header showing Saving, Saved or Unsaved with a count. Choosing it opens a list of the items not yet saved.
- Closing or reloading the page with unsaved items first shows the browser's leave-page warning.
- If the user's role is changed to Viewer, their membership is removed or their account is deactivated while they hold unsaved edits, the next save is refused. Those edits stay on the page marked "not saved: access changed", their values can be copied, and they are not sent again.
- Each refused item in the save-status list shows its own reason, and items refused for different reasons are listed together.
- When the session ends while project edits are unsaved, they stay on the page and are saved after the same account signs in again. If a different account signs in on that page, they are shown and not sent.
- A saved edit updates the project's last activity in the project list.

Notes: Plan images stay in the browser's own storage until story 2.6 stores them on the server. The Conflict state joins the status in story 2.4. Later stories add their own refusal reasons to the list, such as "not saved: project archived" (6.11) and "not saved: project was restored" (8.2). Story 3.1 moves the status into the project frame. The 2-second target is measured again against the large fixture in story 2.7 and at acceptance in story 10.2.

### Story 2.3: See other people's changes within seconds

As a designer, I want changes saved by someone else to appear without reloading, so that we work from the same picture.

Covers: FR-2, FR-69, AD-6, AD-7.

- With two browsers on one project, a change saved in one is shown in the other within 5 seconds, without a reload.
- While a form is being filled in or an item is being dragged, an incoming change to that item does not replace the local input. The user is told that the item was updated and by whom.
- A tab that regains focus checks for changes at once. A hidden tab does not check.
- Each accepted operation adds one change-log entry with the actor's account and name at that time, the session, the time, and the values before and after.
- A change-log entry cannot be edited or removed through any route.
- A member who opens the project after being away sees the current saved state, however many changes were made meanwhile.

### Story 2.4: Resolve a conflict without losing either edit

As a designer, I want a clash on the same item shown side by side, so that I can choose what to keep.

Covers: FR-42, FR-21 (Conflict status). Screens: S-F7 pattern on desktop.

- When two browsers edit the same camera and both save, the first save is accepted. The second becomes a conflict that is shown on the item and keeps its pending values.
- When two browsers edit different cameras and both save, both succeed.
- The header save status shows Conflict with a count, and its list includes the conflicting items.
- Opening a conflict shows, for each field that differs, the saved value, who saved it and when, beside the pending value. For each field the user keeps the saved value or reapplies their own.
- Saving the reapplied choices checks the item's version again. If the item has changed once more, a new conflict is shown and nothing is overwritten.
- Choosing the saved value for every field clears the conflict and saves nothing.
- An edit left Unsaved during a lost connection, whose item someone else changed meanwhile, becomes a conflict on reconnection; it does not overwrite the other person's change.
- A conflict stays on the page until the user resolves it. It is never merged or dropped without the user's choice.
- An operation that changes several items is applied completely or not at all: if one of its items conflicts, none of its changes is saved.

### Story 2.5: Buildings and floors on the server, with guarded deletion

As a designer, I want buildings and floors kept as separate records, so that each floor's content stays independent and nothing referenced can be deleted by accident.

Covers: FR-1, FR-60. Screens: S-03 left panel.

- With several floors, switching between them shows each floor's own drawing placement, equipment, routes, obstructions, zones, notes and analysis settings. Content and results from one floor never appear on another.
- A renamed floor or building keeps its identity. A new floor that reuses an earlier name has a new identity.
- Opening a project loads its list of buildings and floors and the content of the selected floor only. Another floor's content is requested when that floor is first opened.
- A floor that holds no device, route, obstruction, zone or note can be deleted. A building with no floors can be deleted.
- Deleting a floor that holds any device, route, obstruction, zone or note is refused, the blocking records are listed, and the floor and its content are unchanged. Hiding layers or clearing the visible plan does not make a floor eligible.
- Deleting a building that still has a floor is refused, with its floors listed.
- The last remaining floor of a project, and the last remaining building, cannot be deleted; the reason is shown.
- A deletion requested from a stale view, after content was added to the floor in another browser, is refused with the new content listed.
- A refused deletion never deletes or moves any other record.

Notes: Later stories add their own blocking records to this rule: a stored plan (2.6), survey entries (2.10), a reference from a named revision (4.1), a removed device (6.8) and a riser reference (7.6). Undoing a floor or building deletion arrives with undo in story 2.11. The 5-second plan-switch target is measured against the large fixture in story 2.7.

### Story 2.6: Property lookup and plans stored with their originals

As a designer, I want to find the property and import, align and lock a plan whose original file is kept, so that the drawing can be traced and reused.

Covers: FR-3, FR-4, FR-5, FR-6, FR-70 (saved map key in use), AD-3, AD-4, AD-10. Screens: S-03.

- Searching by address or by coordinates moves the map view to the result and changes nothing else. A lookup that fails or a provider that is unavailable shows a plain message.
- Street mapping from OpenStreetMap works with no key. Switching between street and aerial views leaves the aligned plan and every device at the same geographic position.
- With a Google mapping key saved in Settings (story 1.10), Google mapping is offered to every member of every project without anyone entering a key. Without a saved key it is not offered. The prototype's per-session key dialog is removed.
- The Google mapping key is sent only to signed-in users' browsers, and Settings states that this key is visible to them.
- An imported plan image, or one chosen page of a PDF, is placed on the selected floor. Its position, rotation, uniform scale, opacity and lock state can be changed, and they are the same after a floor change and after a reload.
- Moving, aligning or replacing a plan leaves equipment and obstructions at their geographic positions.
- Two-point alignment shows a preview of the move, rotation and scale before it is applied. Cancel leaves the earlier alignment unchanged. Choosing the same point twice is refused, and the earlier alignment is unchanged.
- On import, the original file and a preview are uploaded in 8 MiB parts with visible progress. The plan shows Saved only when both files are stored, checked and referenced by the floor.
- The server checks the hash and size of each completed upload against the values the browser declared. A mismatch shows Failed with Retry, and the file is not referenced.
- An upload interrupted by a lost connection or a closed tab resumes from the last accepted part when the same file is chosen again.
- An unfinished upload is discarded after 7 days. A completed file that no record references is removed by a daily clean-up once it is 24 hours old.
- If the user's role is changed to Viewer, their membership is removed or their session ends between parts, the next part is refused, the parts already stored are discarded, and the plan shows "not saved: access changed" or the sign-in prompt.
- A PDF's password is used in the browser only. It is absent from every request, record and backup. A wrong password asks again, and cancelling leaves the floor unchanged.
- A plan placed from a PDF keeps the source file name and the page number, and both are shown with the plan.
- One PDF used for two floors is stored once.
- A PDF over 100 MiB, an image over 25 MiB, a file that is not PDF, PNG, JPEG or WebP, and a file that is empty, truncated or unreadable are each refused with a plain reason. Nothing is stored or referenced, and the floor's earlier plan is unchanged.
- A floor that holds a stored plan cannot be deleted (story 2.5's rule).

Notes: Undoing an applied alignment arrives with undo in story 2.11. Self-hosted file storage arrives in story 2.14; until then these criteria are tested on Cloudflare's runtime. Under story 1.5 every request counts as use of the session, so an upload in progress keeps its session in use. Project storage usage and the enforcement of the project budget arrive in story 8.5.

### Story 2.7: Equipment as individual records, findable across the property

As a designer, I want every device kept as its own record with a stable identity, so that it can be found, located and followed through its life.

Covers: FR-7 (base), FR-8 (base), FR-41 (Current and Proposed, base), NFR-4 and SM-5 (large fixture and timings). Screens: S-03, S-08.

- Two similar devices each have their own unchanging identifier and their own label, shown in the plan and in the equipment list.
- Each device is saved as its own versioned item: two people editing two different devices both succeed.
- Every device has a lifecycle value of Proposed, Existing or Removed. A newly placed device is Proposed.
- An Editor can set a device to Proposed or Existing, as the prototype's status field allows. Removed cannot be chosen.
- A device once saved as Existing is marked as having been recorded as existing, and that mark stays if it is set back to Proposed.
- The plan and the equipment list have a basis control with Current installation and Proposed design, and the basis in use is always labelled. Current installation shows Existing devices only; Proposed design shows Existing and Proposed devices.
- Choosing a placed device in the equipment list opens its floor with the device selected.
- Search by identifier, label, name and model returns correct results.
- A script generates the acceptance-size test project through the server's own operations: 10 buildings, 25 plans, 600 devices of which 150 are cameras with 60 on the busiest plan, and obstructions, 20 targeted zones and routes on the busiest plan. A declared share of its devices is Existing. The same seed produces the same project.
- The same script also generates the small functional project, with several floors, cameras and other equipment, an obstruction, a targeted zone and routes.
- The script takes an option to add plan files up to a stated total size, and a run up to 8 GiB is shown to complete.
- Against that fixture on the locally run server, each of these meets its target in at least 19 of 20 trials, with all results recorded: search and filter within 1 second; selection and direct-edit feedback within 250 ms; a single-item save acknowledged within 2 seconds; a change seen in a second browser within 5 seconds; the project open and usable within 10 seconds; a switch to another saved plan within 5 seconds.

Notes: Story 5.3 adds that recording Installed makes an add-new device Existing and that a relocation takes its recorded location. Story 6.1 adds existing-site inventory, condition and provenance; removal and the Removed value are handled in story 6.8; the Changes basis arrives in story 6.6. More equipment types arrive in story 4.2. Later stories extend the fixture script for their own record types (2.10 does so for survey entries). Story 10.1 keeps the fixture manifest, Kevin's confirmation of it and the independent reference calculations.

### Story 2.8: Coverage, DORI and zones computed off the main thread, with an honest status

As a designer, I want coverage analysis to keep the interface responsive and to say when a result is current, so that I never read a stale or uncertain number as final.

Covers: FR-10–16, NFR-4, AD-9, experiment R2. Screens: S-05.

- Changing a camera's bearing, lens or field of view, mounting height, tilt or range changes its footprint and the results that depend on it. Changing resolution changes image-detail results without changing the footprint. Linked optical values stay consistent with each other.
- An enabled wall or obstruction with a height shadows the camera views it blocks. A disabled one does not.
- Combined coverage is calculated for the basis selected in story 2.7, and the result names that basis. Overlap is counted once in covered area and shown separately as overlap.
- Hiding a camera or a layer does not change any total.
- Editing the analysis boundary changes the analysed area. The result names the boundary and the denominator in use. Without a custom boundary the fallback area is stated.
- The floor's common target height is saved separately from each camera's own target height, and combined and zone results use it.
- Cameras left out of the calculation are listed under the result, each with the reason.
- If every camera on the floor is left out, the result is shown as Not assessed, not as 100% unseen.
- A single camera's percentage and the combined percentage are labelled differently and never shown in the same position.
- Turning the DORI overlay on or off changes no saved value and no result. At each point, combined DORI is the best single unobstructed view; two overlapping views below a level do not add up to that level. An area seen below Detect is shown differently from an unseen area.
- A zone with a target shows its achieved percentage, its deficient area, and one of four results: Target met, Shortfall, Not demonstrated or Uncertain near target. A zone without a target shows no result.
- A zone's result uses its full polygon; any part of the zone that was not assessed stays in the denominator.
- Target met is shown only when the percentage calculated with every sampling cell on a zone or threshold edge counted as not qualifying still reaches the target. Shortfall is shown only when the percentage with those cells counted as qualifying is still below the target.
- When neither holds, the calculation is repeated once at half the spacing. If the result is still undecided, it is shown as Uncertain near target with both percentages.
- When the target is not met and a camera in range of the zone was left out of the calculation, the result is Not demonstrated, not Shortfall.
- Rounding for display never changes a result: 89.96% against a 90% target is not shown as Target met.
- After an input changes, the affected results show Updating until the calculation for the current inputs completes. Controls stay usable throughout, and zone results stay visible while a camera is adjusted.
- Sampling is 1 m or finer on every plan, and the spacing used is shown with the result. A calculation that would exceed its time allowance of 10 seconds is shown as Incomplete with the reason; sampling is never coarsened to finish in time.
- The prototype's fixed work budget and cell cap are removed. On the busiest plan of the fixture from story 2.7, sampling is 1 m or finer.
- The contour mesh has its own size limit; above it the map shows the sampled overlay instead. The numbers are the same with either presentation, and the result says it is an estimate.
- The polygon clipping step uses one boundary for both its inside test and its intersection: a test case with a camera footprint crossing the boundary gives the same area by both paths.
- The last final summary for each floor is saved with a fingerprint of its inputs. On reopening, a summary whose fingerprint no longer matches is shown as Updating, not as final.
- The busiest plan of the fixture is timed in a Web Worker in a browser, with 60 cameras and all 20 zones, and the result is recorded. It completes within 10 seconds of a committed edit in at least 19 of 20 trials.

Notes: Experiment R2 found that the prototype's work budget and cell cap coarsen sampling to 6 to 12 m on the acceptance workload, and that without them 60 cameras and 20 zones finish in under half a second at 0.5 m. The contour-mesh limit and the single clipping boundary were raised in review of the R2 experiment copies and are prototype behaviour to correct. Unsupported and illustrative views (fisheye, stitched) arrive in story 7.1, which extends Not demonstrated and Not assessed to them. Accuracy against independent reference calculations is checked in stories 10.1 and 10.2.

### Story 2.9: Cable routes on one floor

As a designer, I want to draw and edit routes between devices on a floor, so that cable can be estimated.

Covers: FR-9 (base).

- A route is drawn between two devices on one floor with waypoints and a cable type, and shows a length estimate labelled as an estimate, in the floor's own scale.
- Each route is saved as its own versioned item with a run identifier that does not change when the route is edited.
- Moving an endpoint device or a waypoint updates the estimate.
- Deleting a device that a route ends on does not delete the route. The route stays, with that end shown as unassigned and marked for review.
- A route with an unassigned end is still counted in cable totals and is listed as needing review.
- A floor's routes are requested when the floor is opened, not when the project is opened.

Notes: Story 2.11 adds the dependency preview shown before a connected draft is deleted. Removal of an installed device and its connections is handled in story 6.8; runs between floors and the length ledger in story 7.6.

### Story 2.10: Survey notes and photos as separate entries

As a designer, I want notes, measurements and photos attached to a device or a point on the floor, so that evidence is kept with its place.

Covers: FR-20 (base), FR-45 (scope on evidence), AD-3. Screens: S-04 Evidence tab.

- A note, measurement or photo is added to a device or to a point on a floor as a separate entry showing its author's name and the time. It records the active scope.
- Two people adding entries to the same device at the same time both succeed, and both entries are shown.
- A photo's original and a preview are stored. The entry shows Saved only after the upload and the entry have both succeeded; until then it shows Uploading or Failed with Retry.
- A photo over 25 MiB, or one that is not JPEG, PNG or WebP, or is empty or unreadable, is refused with a plain reason and no entry is added.
- A photo upload interrupted by a lost connection resumes from the last accepted part. A retried addition does not create a duplicate entry.
- The note form offers optional prompts for lighting, shadows, uneven terrain and mount rigidity. Leaving them empty is allowed. Their answers are shown with the entry and change no coverage result.
- Evidence is reached from the plan, by its pin, and from the device.
- Moving a device keeps its entries with it. An entry attached to a point on the floor keeps its position.
- Adding an entry never changes or removes an earlier entry.
- A floor that holds a survey entry cannot be deleted (story 2.5's rule).
- The fixture script from story 2.7 also generates survey notes and photos, in numbers it declares.

Notes: Photo capture on phones over poor connections is tested in story 5.5 (experiment R4).

### Story 2.11: Undo my own recent edits, and delete an accidental draft

As a designer, I want to undo and redo my own recent edits and remove a device I placed by mistake, so that slips are cheap to fix.

Covers: FR-21 (undo and redo), FR-5 (undo of an alignment), FR-55 (Delete draft), AD-7.

- Undoing my own recent edit records a new reversal in the change log, and the item returns to its earlier value.
- Redoing an undone edit records a new operation, and the item returns to the value I had set. Making a new edit after an undo clears the redo list.
- Undo and redo cover my last 40 edits made in the open page. Reloading the page or signing out empties both lists.
- If someone else has since changed the item, or something that depends on it, my undo or redo is refused with an explanation that names the later change. Nothing of theirs is changed.
- Undo never removes or alters a survey entry or a photo.
- Undoing an applied plan alignment restores the earlier alignment.
- Deleting an unused floor or building can be undone, and it returns with the same identity.
- An accidental proposed device that has no survey entry, no route and was never recorded as Existing can be removed with Delete draft. It disappears at once with an Undo notice and no confirmation dialog, and leaves the equipment list, coverage results and cable totals.
- Undoing a draft deletion returns the device with the same identifier. Its change history is kept in both cases.
- Delete draft on a proposed device that has routes first shows a preview listing each route affected. On confirmation the device is deleted and each route is kept with that end shown as unassigned and marked for review.
- In that preview a route is deleted with the device only if the user selects it, and only if the route has no survey entry and its other end is also unassigned or on the same device.
- Delete draft is not offered for a device that has a survey entry or photo, or that is or has been Existing. A "Why can't I delete this?" link lists the reasons.
- A Delete draft sent from a stale view, after someone else added a survey entry or a route to the device, is refused with the reason, and the device is unchanged.
- Undoing a draft deletion is refused, with the reason, if the device's floor has since been deleted. A floor whose only devices are deleted drafts counts as unused under story 2.5.
- A retried Delete draft or undo is applied once only.

Notes: Cancelling a proposal that cannot be deleted, and correcting a record, arrive in story 4.9. Later stories add their own conditions that make a device ineligible for Delete draft: inclusion in an issued design (4.8), an Installed or Configured mark (5.3), a test attempt (5.5), an issue (5.9) and a port assignment (7.5, which also covers "undo cannot reclaim a port reassigned by someone else"). Full revision restore is a separate guarded action in story 4.1.

### Story 2.12: Bring in a project saved by the prototype

As an administrator, I want to import a project file exported from the prototype, so that existing work is not lost.

Covers: FR-22 (format migration), AD-14.

- Importing a version 1 or version 2 prototype project file creates a new shared project with its buildings, floors, plans, devices, routes, obstructions, zones and notes. Each device keeps the identifier and label it had in the file, and its Proposed or Existing status.
- Import is offered wherever Create project is, to the same people: administrators, and standard users when they are allowed to create projects. The importer becomes the project's Editor under the same rule.
- The import asks for the first work scope's name as story 2.1 does, with "Initial design" as the default.
- The file is checked completely before anything is created. A file that is not valid JSON, is truncated, is over 100 MiB, or is not a version 1 or version 2 prototype project file is refused with a plain reason, and no project is created.
- An import that fails part-way leaves no project in the project list and no stored files.
- Before the import is confirmed, a review list names everything in the file that will not be brought in or cannot be represented exactly. Nothing is dropped without being listed.
- Costs and named revisions in the file are named in that review list as not imported.
- Plan images held in the file are stored as previews, and each such plan shows "original not available".
- Imported notes show that they came from the prototype file and the date of the import; no author is invented for them. The import itself is recorded with the importing account as its actor.
- Importing the same file twice creates two separate projects.

Notes: Story 4.1 adds named revisions to this import and story 4.4 adds costs; each then removes its item from the "not imported" list. The portable backup of the new format is story 8.4.

### Story 2.13: Run Site Studio on your own server

As an organisation's administrator, I want to run Site Studio on a Linux server with Docker over HTTPS, so that our data stays on our own machine.

Covers: FR-66 (self-hosted), FR-70 (administrator recovery, self-hosted), NFR-7, AD-1, AD-16, AD-17.

- One Docker image holds Cloudflare's open-source runtime at a pinned version, the same Worker bundle that is deployed to Cloudflare, and its configuration. It is built for x64 and arm64 on a glibc base, and the image starts on both.
- A Compose file starts the application and a bundled web server that provides HTTPS. With only a host name set, a browser reaches the sign-in page over HTTPS.
- The bundled web server obtains and renews a certificate for the configured host name automatically, or uses certificate files the operator supplies. Both ways are shown to work.
- A plain HTTP request to the bundled web server is redirected to HTTPS.
- By default the application's own port is not published on the host; only the web server's ports are.
- An operator who uses their own HTTPS proxy turns the bundled web server off and lists the proxy's address in a trusted-proxy setting. Forwarded-protocol and forwarded-address headers are believed only from an address on that list; by default the list holds the bundled web server only.
- A request that reaches the application without HTTPS, directly or through a trusted proxy that reports plain HTTP, is refused and serves no page and no data.
- Session cookies are always marked Secure, and sign-in works both through the bundled web server and through an operator's proxy on the trusted list.
- First-run set-up (story 1.2) works with the set-up code printed in the server output.
- On first start the server generates the deployment key that stories 1.4 and 1.10 encrypt with, and writes it to a key file in a folder set in the Compose file, separate from the records and files folders. The server output says where the file is and that a copy must be kept off the server.
- After a restart, two-step verification secrets and Settings secrets saved earlier still work.
- When the only administrator cannot sign in, a documented command run on the server prints a one-time code. As in story 1.8, a named administrator account uses it to set a new password and have its two-step verification reset; the code works once and expires after 1 hour, and its use is in the activity log.
- Two installations started from the same image with separate volumes share no users or projects: an account on one cannot sign in to the other, and a project on one is not listed on the other.
- The self-hosted smoke suite from story 1.1 runs against the image and passes. It covers everything in Epic 1 and stories 2.1 to 2.12 that does not store a file.

Notes: File storage on the server's disk is story 2.14, which adds the file cases to the smoke suite. Durability on real disks is story 2.15. The updater container arrives in story 9.5 and the published installation instructions in story 9.1. The supported kinds of server are stated in the instructions (9.1) from the results of story 2.15.

### Story 2.14: Files on the server's own disk

As an organisation's administrator, I want plans and photos kept on my server's own disk and checked for damage, so that a self-hosted installation stores files as reliably as Cloudflare does.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-3, AD-4, AD-16.

- On a self-hosted installation, a plan and a photo uploaded through the interface are stored in the live files folder through the runtime's disk service, and are shown again after a restart.
- Each stored file's SHA-256 hash and size are kept in the project's records.
- Upload is in equal 8 MiB parts and resumes from the last accepted part, with the same requests and replies as on Cloudflare. An unfinished upload is discarded after 7 days.
- When an upload completes, the server computes the file's hash and size and compares them with the declared values. A mismatch shows Failed with Retry, and the file is not referenced.
- A download is streamed, and a range request returns exactly the bytes asked for.
- A stored file whose size or hash no longer matches its record is reported as damaged when it is requested; it is not served as if it were good.
- A file is stored under its content hash and is never overwritten. The same content uploaded twice is stored once.
- Every download passes the access gate: a user who is not a member is refused a file even with its exact address.
- The live files folder and the backup location are two separate settings in the Compose file, and the backup location has no default value. The server refuses to start, with an explanation, if both point to the same folder.
- Two installations with separate volumes share no files: a file address from one is refused on the other.
- One set of file-store tests passes against both the Cloudflare file store and the disk file store.
- The self-hosted smoke suite gains the file cases (upload a plan and a photo, restart, read back whole and by range) and passes against the image. It now covers everything in Epics 1 and 2.

Notes: The backup location is first written by story 8.1, which also makes the server refuse to start when it is not set and warns when it is on the same disk as the live data. Behaviour when the disk is full is in story 2.15.

### Story 2.15: Records survive crashes and power loss

As an organisation's administrator, I want every acknowledged save to survive a crash or a power cut on my server, so that Saved means the same as it does on Cloudflare.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-2, experiment R12.

- Records are kept on a persistent volume named in the Compose file. They are still there after the containers are stopped and started, and after the containers are removed and recreated from the image.
- With saves running continuously, the application container is force-killed 50 times. After each restart every save that was acknowledged is present, and no project fails to open.
- Experiment R12 is run on a typical virtual-machine disk with the power cut during saves, at least 20 times. No acknowledged save is lost and no project fails to open, and the result is recorded.
- Experiment R12 is also run with the records volume on a network disk (NFS), and the result is recorded. Storage that loses an acknowledged save or fails to lock is listed as unsupported in the experiment record.
- If R12 fails on the typical virtual-machine disk, the story is not done and the result goes to Kevin for a decision; the fallback the architecture names is to require local disk for records.
- A second application container started on a records volume that is already in use refuses to start, with an explanation, and the first keeps working.
- When the records volume is full, a save is not acknowledged: the item shows Unsaved with the reason, and nothing already saved is damaged.
- When the files volume is full, an upload part is refused with the reason, the upload shows Failed with Retry, and no file is referenced.
- While either volume is full, administrators see a storage-full notice in Administration naming the volume.
- After space is freed, saves and uploads succeed again without a restart.

Notes: Story 9.1 states the supported kinds of server and storage in the published instructions, from this story's results. A full backup disk is handled in story 8.1.

## Epic 3: A workspace that holds the whole job

**Outcome.** The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure.

**Depends on.** Epic 1 complete and story 2.1. Story 3.1 also needs story 2.2, whose save status it moves into the frame. Story 3.2 needs story 2.7 for device lifecycle. Story 3.5 needs story 2.7. Story 3.6 needs story 2.3, and stories 2.10 and 2.11 for its Evidence tab and device menu. Nothing later.

**Why here.** Epics 4 to 7 each add full pages, and those pages need the frame and the status components to exist first.

### Story 3.1: Project frame and eight areas

As a designer, I want to see which property, scope and reference I am working in and to move between areas, so that I always know where I am.

Covers: UX 5.1, 5.2, 17.1, decisions D1 and D12, FR-2 (views), FR-21 (save status). Screens: S-01, S-02.

- Every project screen sits inside one frame showing the property name, the active work scope's name and state, the issued design, the view switch, the save status and the account menu.
- The property name opens the project list.
- The issued design shows "Not issued".
- The save status from story 2.2 is shown in the frame, not in the prototype header, with Saving, Saved, Unsaved or Conflict and a count. It opens the list of pending and conflicting items.
- The account menu of Epic 1 moves from the prototype header into the frame. It shows the user's name and role in this project, with My account and Sign out. Administrators also see Administration. A Viewer sees a "View only" chip in the frame.
- The view switch offers Design and Installation. Switching it changes no permission: a Viewer gains no editing control in either view.
- Switching the view sets the basis (story 2.7) to Proposed design for Design and Current installation for Installation, and a brief notice says so. The user can then change the basis.
- "Members and reviewer links" lists who belongs to the project and each person's role. It offers no control to change them.
- Overview, Plan, Equipment, Connections, Costs and capacity, Field work, Issues and Records are separate routes, each loaded when first opened. A direct address or a reload opens the same area.
- A direct address to an area of a project the user does not belong to is refused.
- Overview shows the active scope's name and state, each floor with its device count, and recent activity from the change log.
- The prototype's Materials and Capacity dialogs open as the Costs and capacity page, and its Revisions and Review dialogs as the Records page, with their content unchanged.
- Connections, Field work and Issues each say plainly that the area is not available yet. No placeholder figures or sample records are shown anywhere in the frame or the areas.

Notes: The issued design chip is filled by story 4.8; managing reviewer links arrives in story 4.7 and members are managed by administrators in Administration (story 1.8). The Installation view's recording tools arrive in Epic 5. The archived banner arrives in story 6.11. The Equipment dialog becomes a page in story 3.5. This story is large; the frame (first eight criteria) and the area routes (the rest) can be built as two sittings.

### Story 3.2: Status language components

As a designer, I want every status drawn the same way everywhere, so that I can read the state of things at a glance.

Covers: UX section 6, NFR-3.

- One component renders every family and value in the UX status reference, each with a text label and an icon or shape.
- A status reference page in the development build shows every family and value. Viewed in greyscale, every value in a family can still be told from the others.
- The statuses already in the app use the component: save state (story 2.2), lifecycle (story 2.7) and analysis status (story 2.8), including Updating, Not assessed and Uncertain near target.
- Device markers on the plan show lifecycle by outline: dashed for Proposed, solid for Existing.
- The marker component draws a condition glyph (none for Working, a warning triangle for Faulty, a question mark for Unknown), shown on the reference page.
- The incomplete-total component shows "Incomplete" with a count of unknown inputs and a link to them, and is never styled as a pass. It is shown on the reference page.
- Two different families are never combined into one badge.

Notes: Condition is recorded on devices from story 6.1, and totals with unknown inputs first appear in stories 4.4 and 4.5; those stories use these components.

### Story 3.3: Readable text, contrast, targets and focus

As a designer, I want text I can read and controls I can hit, so that long sessions and field use are comfortable.

Covers: NFR-3, UX section 10, audit findings A2, A3, A5, A6.

- On desktop no text is smaller than 12 px, body text is 14 px, and 12 px is used only for map labels and table metadata.
- All text meets a contrast ratio of 4.5:1 against its background. The measurements are recorded for every screen that exists at this story.
- Markers, icons and focus rings meet 3:1 against both the plan and aerial imagery, measured and recorded. Markers keep a white halo.
- Desktop buttons are at least 32 px in each dimension, and actions in dense tables at least 24 px.
- On a screen 390 px wide, form field text is at least 16 px, and focusing a field on iPhone Safari does not zoom the page.
- Every interactive element, including map markers, shows a visible 2 px focus ring and can be reached and operated by keyboard.
- Forms remain usable at 200% zoom: one column, no clipped labels and no horizontal scrolling.
- Every input has a visible label, and every error message names its field.

Notes: The 44 px touch targets of the field shell are in story 5.1. Screens added later meet these rules under standing rule 5.

### Story 3.4: Plan workspace regrouped

As a designer, I want grouped tools and a docked analysis summary, so that the map is not covered and tools are easy to find.

Covers: UX 7.1, decision D5, audit findings A7, A8, A9, A12. Screens: S-03.

- The left panel shows buildings and floors as a tree, each floor with its device count. Adding, renaming and deleting floors and buildings (story 2.5) is done there, not in a dialog.
- The tool dock has six groups: Select, Place, Draw, Annotate, Route and Note. Each opens a short menu and remembers the last tool used in it.
- Every tool the prototype offered is in one of the groups: equipment types under Place; wall, obstruction, zone and analysis boundary under Draw; Measure under Annotate; survey note and photo under Note.
- The analysis strip replaces the floating card. It shows the active analysis, its basis, target height, sampling, status chip and legend, and at 1440 × 900 and 1280 × 720 it overlaps neither the dock nor the scale bar.
- Layers are grouped as Equipment, Analysis, Site and Connections, each with a visibility control, with a note beside them that hiding a layer does not change totals.
- Plan alignment handles appear only while the plan is unlocked and Alignment is open, and never in the Installation view.
- With nothing selected, the right panel shows the floor's drawing, alignment, analysis settings and combined results.

Notes: The annotation tools join the Annotate group in story 7.4, and Awaiting placement joins Place and the left panel in story 6.4. Attention marks on floors arrive with issues and checks in Epic 5.

### Story 3.5: Equipment as a full page

As a designer, I want the schedule as a full table with filters, so that a large property is workable.

Covers: FR-8, FR-68 (Viewer export), NFR-6, audit finding A1. Screens: S-08.

- The Equipment page replaces the prototype's Equipment dialog. Its table shows the 600 devices of the fixture from story 2.7 with a sticky header, and scrolling stays responsive.
- Each row shows the device's identifier, label, name, type, model, building, floor and lifecycle. A column chooser hides and shows columns.
- Search covers identifier, label, name and model. Filters cover building, floor, type and lifecycle. Results appear within 1 second on the fixture.
- The basis control from story 2.7 is at the top of the table, and the table lists the devices of the selected basis.
- Choosing a row opens that device's properties in a panel beside the table. Locate opens its floor with the device selected.
- The table has three segments: Placed, Awaiting placement and Historical. The last two are present and each says that it has no records yet.
- The filtered table exports as a CSV file holding the rows and columns shown. The file names the project, the basis and the time of export.
- A Viewer can search, filter and export the table and has no control that changes a device.
- A search or filter with no matches says so; it does not show an empty table without explanation.

Notes: Awaiting placement is filled by story 6.4, and Historical by stories 4.9 and 6.8. Multi-select for bulk cleanup arrives in story 6.5. The side panel takes its tabbed layout in story 3.6.

### Story 3.6: Device inspector with tabs

As a designer, I want one inspector layout for every device, so that I know where each kind of information is.

Covers: UX 7.2. Screens: S-04.

- The same inspector opens for a device selected on the plan and for a row chosen on the Equipment page.
- The header shows the device's identifier, label, name, type, model and its lifecycle chip.
- Tabs for Details, Optics, Work, Checks, Evidence and History are present. Optics appears for cameras only.
- Details holds the device's identity, model, mounting, location and notes. Optics holds the camera controls of story 2.8.
- Evidence lists the device's survey entries from story 2.10 with author and time, and adds new ones.
- History lists the device's changes from the change log, each with its values before and after, the actor and the time.
- Work and Checks each say plainly that the feature is not available yet.
- The device menu offers Delete draft where story 2.11 allows it, and otherwise the "Why can't I delete this?" link.
- A Viewer sees every tab and its content with no control that changes or adds anything.

Notes: Work is filled by stories 5.3, 6.6 and 7.5; Checks by stories 5.4 and 5.5. Condition and flag chips join the header in stories 6.1 and 5.6. The other device-menu actions arrive with their stories (4.9, 6.8).
