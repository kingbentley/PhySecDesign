## Epic 6: Existing sites and return visits

**Outcome.** An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact.

**Depends on.** Epics 1 to 5 complete. Nothing later: what removal and restoration do to switch ports is in story 7.5, and what they do to door links is in story 7.3.

### Story 6.1: Existing equipment, condition, provenance and the surveyed baseline

As a designer, I want to record the equipment and cable already on site with what is known about it and how it is known, so that planning starts from the real building and not from guesses.

Covers: FR-39, device state model (condition and provenance).

- A device can be added as Existing during a survey. It is placed on a plan like any other device and creates no purchase line, no Installed mark and no test result.
- A known cable route can be drawn as existing. It keeps a stable run identifier and creates no purchase quantity.
- An Existing device has a condition of Working, Faulty or Unknown. It starts as Unknown, a person sets it, and a test outcome never changes it.
- Each recorded value can carry a provenance of Imported, Old document, Estimate or Site-confirmed, shown as a chip beside the field with the source detail on demand.
- A camera with an unknown model or installation date can be saved with those fields shown as Unknown. Recording it today does not set its installation date.
- A device keeps its internal identifier and can also hold the label already used on site; both are searchable.
- A surveyed baseline can be saved as a fixed named revision, marked as the baseline in Records. It is listed only when its snapshot is stored and its hash verified; a failed save is shown and can be retried.
- Later edits leave the baseline's stored file unchanged, checked by its hash.
- A revision restore leaves condition and provenance unchanged.

Notes: Lifecycle (Proposed, Existing, Removed), the "recorded as existing" mark and the Current and Proposed basis come from story 2.7; this story builds on them and adds no second flag. Story 4.1 already keeps a restore from changing the recorded values of Existing devices. Spreadsheet intake is stories 6.2 to 6.4. Removal is story 6.8.

### Story 6.2: Import a CSV or Excel inventory with column mapping

As a designer, I want to load an equipment spreadsheet and say which column means what, so that an existing inventory does not have to be retyped.

Covers: FR-62, AD-10, UX decision D9. Screens: S-09 steps 1 and 2.

- An .xlsx file with a title row is read from the chosen sheet and header row, with a preview of the first rows. A CSV with different headings maps to the same fields, after its delimiter and parsed columns are confirmed.
- Columns can be mapped to source asset ID, existing Site Studio ID, name, type, manufacturer, model, serial number, IP address, MAC address, building, floor and room hints, and notes.
- Suggested mappings can be corrected. Unmapped and ignored columns are listed before the next step.
- A default equipment type, including Unknown, can be set for rows whose type is missing or not recognised.
- A row with neither a usable name nor a source asset ID is shown as an error and cannot be imported until it is corrected or skipped.
- Asset ID 00042 stays 00042. A value whose conversion is uncertain, such as a long number or a date-like identifier, is flagged on its row.
- Formulas, macros and external links are never run. A cell with a stored formula result is read as that result; a cell with an error or no stored result is flagged for review.
- A legacy .xls, macro-enabled or password-protected file, a file over 10 MiB, and a file with more than 5,000 data rows are each refused at step 1 with a plain reason, and the saved inventory is unchanged.
- A file with no data rows, a header row with duplicate headings, or two columns mapped to one field stops at mapping with a plain reason, and nothing changes.
- A sample template can be downloaded.
- The project's last confirmed mapping is offered only when the headings fit, and can be edited before it is used.
- The fixture script of story 2.7 also produces a 600-row inventory as .xlsx and .csv. The file is parsed in the browser, and the page stays usable while that file is parsed.
- The source file and the confirmed mapping are kept with the import batch and can be opened from it.

### Story 6.3: Review rows, apply, and re-import safely

As a designer, I want to see what an import would add or change before it happens, so that a spreadsheet cannot overwrite what was confirmed on site or create duplicates.

Covers: FR-58, FR-62 (row review and result). Screens: S-09 steps 3 and 4.

- Rows are grouped as New, Changed, Unchanged and Needs review, with counts. A Changed row shows the current and incoming values side by side with the source of each.
- A row matches an existing device only by a valid Site Studio ID for this property or by a source asset ID that is unique in the file and the project. Names, addresses and location hints never establish identity alone.
- Duplicate names, duplicate rows in the file and conflicting identifiers go to Needs review.
- Rows are ticked explicitly. A group-level select is offered for New and Unchanged rows without errors.
- A row error is shown inline with Fix and Skip.
- Re-uploading the same inventory creates no extra devices and lists its rows as Unchanged.
- Site-confirmed values are locked by default. Replacing one takes a deliberate choice on that row, is recorded with a reason, and keeps the earlier value in the device's history.
- A blank cell erases nothing, and a device missing from the file is neither deleted nor archived.
- Imported values carry the Imported provenance. An import sets no Installed or Configured mark and no check outcome, whatever the source columns say.
- A record changed by someone else since the preview comes back as a conflict, with the choice made for that row kept for review.
- When two people apply the same file at the same time, New rows are matched again at the moment of applying, and each device is created once.
- An apply interrupted part-way reports which rows were applied. Continuing applies only the remaining rows and creates no duplicates.
- The result reports imported, skipped, failed, conflicted and unresolved counts, with links to the records awaiting placement and those needing review.

Notes: A row that matches a removed device is handled in story 6.8.

### Story 6.4: Awaiting placement, and verifying on site

As a technician, I want to find imported records that have no position, check them against what is really there and place them, so that the inventory becomes a verified survey.

Covers: FR-56, FR-57, FR-8 (Awaiting placement). Screens: S-08, S-F5, S-F6.

- An imported record with no confirmed floor or position sits in Awaiting placement with its building, floor and room hints. It has no map marker, no coverage and no test result.
- The Awaiting placement list is searchable and can be filtered by building, floor or room hint. Its count stays visible while one floor is shown.
- Choosing an unplaced record in the equipment list opens its Awaiting placement entry, not a floor.
- Capacity estimates still count the unplaced device's applicable demand, and coverage results state how many devices are omitted because they are unplaced.
- On a phone, a technician can confirm or correct each value. A confirmed value becomes Site-confirmed, and the imported value stays in view as the earlier source.
- The technician places the record with the crosshair on a chosen floor. It keeps its identifier and import history, and no second device is created.
- Placing sets no Installed mark, confirms no other value and passes no check.
- A device found on site that was not in the spreadsheet can be added from the same screen as an Existing device.
- A project with no spreadsheet can be surveyed by adding every device by hand.

### Story 6.5: Bulk cleanup of mistaken records

As a designer, I want to remove a batch of mistaken records in one step after seeing what would go, so that a bad import can be undone without touching real equipment.

Covers: FR-59. Screens: S-10.

- A selection of records, or one import batch, can be previewed: how many are selected, how many can be removed, and each blocked record with its reason.
- Only accidental drafts that qualify for Delete draft and unused records created by an import can be removed.
- A device that existed before the batch and was only matched by it is blocked. Membership of a batch alone never makes a record removable.
- Site-confirmed, issued, approved, installed, tested or otherwise evidenced records are blocked, as is equipment that other records depend on.
- Eligibility is checked again on confirmation. A test added or an edit made since the preview blocks that record and it is reported, not removed.
- Removing a record removes no other device, cable, note, photo or issue.
- The outcome is listed per record and appears in the activity log.
- The cleanup can be undone by the person who ran it. Undo is refused for a record whose floor has since been deleted or which someone else has since changed, and those records are listed.

### Story 6.6: Planned actions, and Current, Proposed and Changes

As a designer, I want to say what will happen to each existing device and see the site as it is, as it will be, and the difference, so that an upgrade is planned without rewriting the record of what is there.

Covers: FR-40, FR-41, FR-33 (planned actions in the Design package), device state model (relocation). Screens: S-11, S-04 Work tab.

- An Existing device can be planned as Retain, Relocate, Service or reconfigure, Replace or Remove. A new device is Add new. A device with no decision shows None.
- A choice the state model forbids is disabled with its reason: any action except Add new on a Proposed device, Add new on an Existing device, and any new action on a removed, cancelled or corrected device.
- Choosing Replace creates a new Proposed device with its own identifier, linked to its predecessor. Replace cannot be saved without that link.
- A planned replacement leaves the old device in Current installation and shows the new one in Proposed design. Proposed counts include the replacement and not the predecessor, unless the predecessor is marked to remain.
- Planning a relocation shows the planned position in Proposed design and leaves the current position unchanged in Current installation.
- Recording Installed on a device with a planned Relocate makes the planned position its recorded location in Current installation, and the earlier location stays in its history.
- A planned Remove leaves the device in Current installation and takes it out of Proposed design.
- A Faulty camera is not credited in a coverage estimate on the Current installation basis. One with a planned return to service is credited on the Proposed basis and labelled as a planned return to service.
- Retained equipment and retained cable create no purchase line and appear in the estimate under "Retained, not purchased". Relocation, service and replacement costs are entered as explicit lines.
- A device with unknown specifications is shown as unassessed or estimated in each result, never as zero demand or as coverage.
- The basis control gains Changes beside Current installation and Proposed design. Changes shows relocation arrows, replacement pairs and a list of devices grouped by action, followed by cancellations and corrections against the current issued design.
- The device sheet's one-sentence instruction begins with the planned action for Retain, Relocate, Service or reconfigure, Replace and Remove, as it does for Add new.
- The Design package shows each device's planned action on plan sheets and in the equipment schedule, with retained equipment shown as context and not as a purchase.
- Planned actions are saved in a named revision and returned by a revision restore.

Notes: Recording the work (story 5.3) is what changes Current installation. The rule that hiding a layer changes no analysis is in story 5.2. Recording a removal is story 6.8. This story is large; splitting planned actions from the Changes view is a question for Kevin.

### Story 6.7: Work scope categories

As a designer, I want to mark each device and route as worked on now, only inspected, or only shown for reference, so that the estimate and the checks cover exactly the work in this scope.

Covers: FR-45. Screens: S-11.

- The scope panel names the active scope and lists its revisions, its estimate and its evidence. Saving a second named revision keeps the same scope and the same estimate.
- Each device and route in the scope is Work now, Inspect or test only, or Reference only.
- The category is preselected from the planned action: Add new, Relocate, Service or reconfigure, Replace and Remove give Work now; None and Retain give Reference only.
- A device with a planned action of None or Retain cannot be set to Work now; the reason is shown.
- Changing a category is recorded with actor and time, and asks for a reason when it moves an item out of Work now.
- The scope panel shows the estimate and the required checks that each category implies, and both update when a category changes.
- The applicable core checks of story 5.4 are required by default for each Work now device. An Inspect or test only device has no check required by default; an Editor selects the checks that apply to it. A Reference only device gets no checks.
- Reference-only equipment still counts in coverage and capacity and creates no purchase line.
- An Inspect or test only device can have a labour line without an equipment purchase.
- Moving an item that has a required retest or an open issue to Reference only shows a warning and leaves that item in the remaining-work list.
- Scope categories are saved in a named revision and returned by a revision restore.

Notes: The first scope is created with the project in story 2.1. A second scope is created by reopening in story 6.10, which carries the rule that only one scope is active at a time, and that a later scope starts at Not issued with assignments, rates and copied estimate lines offered for reuse.

### Story 6.8: Record a removal, archive the device and settle its connections

As a technician, I want to record that a device has actually been taken out and say what became of its cables, so that the record matches the site and nothing about the device is lost.

Covers: FR-35, FR-53, FR-8 (historical records), FR-33 (removed equipment and connection context), FR-42, FR-58 (archived match), FR-60 (archived device references), FR-68 (attention count), NFR-1. Screens: S-04, S-12.

- The device menu of story 4.9 offers Record removal for an Existing device. Recording a removal, with its date and an optional reason and replacement link, makes the device Removed and archives it in the same step. The actor and time are recorded.
- The archived device keeps its identity, model, settings, last location, connections, work marks, checks and attempts, notes and photos. No field has to be filled in to archive it.
- A removed device leaves the active plan and schedule, coverage, equipment totals and capacity demand. Earlier revisions and packages are unchanged.
- A planned Remove or Replace alone archives nothing.
- A removed device is found by search under Historical in Equipment, labelled Removed, with its evidence. An optional historical layer shows it on the plan at its last location.
- Before the removal is confirmed, a review lists the device's cable ends, its open issues, its required retests and any open reliability run that covers it.
- Open issues and required retests on the device stay in the remaining-work list after removal. Removal resolves no issue.
- An open reliability run that covers the device is flagged and keeps running.
- Each affected cable end gets a disposition: retained and disconnected, reused, removed, or unresolved. Unresolved is allowed and is flagged Needs connection review.
- The cable keeps its run identifier, route, lengths, notes and evidence. The device's connection to it is ended and kept as history. A cable is archived only when its own removal is recorded.
- Recording the removal of a switch flags the cable ends connected to it for review and archives no other device.
- For a Replace action, the work shows as done only when the successor's installation and the predecessor's removal are both recorded. The predecessor's notes, photos and passes stay with the predecessor.
- The removal and its dispositions are one operation. A stale tab cannot leave a cable end actively connected to a removed device.
- A save onto a removed device from a stale tab or a reconnecting phone is refused and kept for review, not applied and not discarded.
- A revision restore leaves a removed device archived and its dispositions unchanged, and lists for review a removed device that the revision still holds.
- A floor that holds a removed device's last location cannot be deleted; the refusal lists the device.
- The project list's attention count of story 5.9 includes cable ends flagged Needs connection review.
- A re-imported row that matches a removed device goes to Needs review; it does not reactivate the device and creates no new one.
- The closeout record and the Closeout package list removed and replaced equipment and the retained, reassigned, removed and unresolved cable ends, with historical ends shown apart from current connections.

Notes: Port dispositions and the rule that a former port is not declared free are in story 7.5. A door link on a removed component is in story 7.3.

### Story 6.9: Restore the same device, or link a replacement

As a technician, I want to put an archived device back on the plan as the same record, or record a different unit as its replacement, so that history follows the physical equipment.

Covers: FR-36, FR-54, FR-53 (reconnection and reuse), NFR-1.

- Restoring keeps the device's identifier and history, records who restored it and when, and makes it Existing with condition Unknown.
- Restoring needs a position confirmed by the user on a current floor of the same property. The device never enters Awaiting placement.
- On an unchanged or renamed floor the former position is offered for confirmation. On a floor whose drawing, scale or alignment has changed, the position must be set again.
- When the original floor was deleted, the user chooses another current floor. The deleted floor is not recreated, and a new floor with the same name is not treated as the original.
- Cancelling leaves the device archived with its history intact.
- A restore is refused when the chosen floor or the device has changed since the restore screen opened, and the choices made are kept for review.
- When the device's label or asset ID is now used by another active device, the restore asks for a label decision before it can be confirmed.
- Earlier photos and attempts keep their former floor and location. Earlier passes are not counted for the restored device, and its checks are flagged Retest required.
- Earlier cable connections are offered as historical choices and are not reinstated. Reconnecting is an explicit step and cannot take a cable end now connected to another device or bring back a removed cable.
- Restoring creates no purchase line.
- A different physical replacement has a new identifier linked to its predecessor. Each keeps its own history, results and counts, and the link can be followed in both directions.
- A retained cable chosen for the replacement keeps its run identifier and creates no purchase line. The replacement inherits no installation evidence and no pass from the predecessor.

Notes: Reconnecting a restored device to a switch port is in story 7.5.

### Story 6.10: Reopen for later work, carrying issues forward

As a designer, I want to reopen a finished project for new work at the same property, so that later work starts from what is installed and keeps the earlier records fixed.

Covers: FR-38, FR-45 (one active scope), FR-46 (carryover). Screens: S-20, S-18.

- Reopening a project whose last scope is closed creates a new named scope, In progress, and a working revision from the latest installation. Project and device identifiers are unchanged.
- The new scope has its own empty estimate and its own checks. Equipment already installed creates no purchase line. Rates and chosen lines can be copied from the earlier estimate; no quantity is carried over automatically.
- The new scope starts at Not issued and with no approvals; review assignments are offered for reuse and can be changed.
- Reopening restores no removed device, resolves no issue, carries no approval or pass into the new scope, and leaves earlier closeout records and packages unchanged, checked by hash.
- Reopening is refused while a scope is active. When two people reopen at the same moment, one scope is created and the second person is taken to it.
- An unresolved issue appears in the new scope with the same identifier and awaits a disposition: Include now, Defer or Resolve. It is not duplicated.
- A scope finished with a deferred fault can be closed only as Closed with outstanding items.
- A revision of an earlier scope can be opened and compared. It cannot be restored into the new scope or designated as its current issued design.

Notes: Reopening an archived project is in story 6.11. Start service visit, which reopens into a service scope, is story 6.12.

### Story 6.11: Archive and un-archive a project

As an Editor or an administrator, I want to archive a project that is no longer being worked on and un-archive it when needed, so that finished records stay readable and cannot be changed by accident.

Covers: FR-37, FR-68, FR-42. Screens: S-20, S-31.

- An Editor of the project can archive and un-archive it from Records, and an administrator can do so from Records or from Administration: Projects. A Viewer cannot.
- The projects list and Administration: Projects show the archived state.
- Archiving is refused, with the reasons listed, while a scope is In progress or while an inventory import or a package upload is running in the project.
- An archived project shows the banner "Archived — view, search and export only". It can be searched, viewed and exported and cannot be edited.
- Viewing and exporting leave its design, installation, evidence, decisions and earlier packages unchanged. Downloading an earlier package returns the same bytes.
- Exporting may add a new retained package edition without un-archiving the project.
- Un-archiving is an explicit action, starts no scope and changes no record.
- Reopen on an archived project first asks to un-archive it.
- A save into an archived project from a stale tab or a reconnecting phone is refused and kept for review as "not saved: project archived"; it is not retried.
- When two people archive at the same moment, the project is archived once and the second person sees that it already is.
- A revision restore is refused while the project is archived, and no restore changes the archive state or its history.
- While the project is archived, a reviewer link opens its revision read-only and accepts no comment or decision.
- Archiving and un-archiving appear in the activity log with actor and time.

### Story 6.12: Warranty and service visits

As a technician, I want to record the warranty on an installation and each visit made to fix a fault, so that anyone can see what is covered and what was done.

Covers: FR-65, FR-33 (warranty and service visits). Screens: S-19, S-23 warranty step.

- A scope's installation warranty has a term in whole months, of at least 1, a start date, a provider, a note and covered items. The start date defaults to the scope's closeout date and can be changed.
- Covered items default to the equipment and cable newly installed in that scope and can be adjusted.
- A device can also carry a manufacturer warranty with its own term, start date and provider. A device with both shows each separately.
- Each warranty shows its calculated end date, which is the start date plus the term, and its status as of a stated date: Not started before the start date, In warranty from the start date to the end date inclusive, Expired after it.
- A warranty recorded on a scope that is not yet closed, with no start date entered, shows Not started.
- Equipment with no warranty recorded shows Unknown, never Expired. This includes surveyed existing equipment.
- Changing a warranty's term, start date, provider or covered items is recorded with actor and time, and the earlier values stay in its history.
- Warranty details are shown on the device record and as an optional column in the equipment schedule. When an issue is raised on a device, the device's warranty status is shown on the issue.
- A service visit is recorded on an issue with when and how the fault was reported, the visit time, the fault found, the work done, the parts used, the time spent, who attended and whether it was under warranty.
- The visit time cannot be earlier than the reported time, and neither can be in the future.
- Under warranty is prefilled as of the visit date, with its reason shown, and can be changed: Yes if any warranty covering the device is In warranty, No if all are Not started or Expired, Unknown if none is recorded or the issue concerns no device.
- During an open scope, a visit is recorded in that scope and no new scope is started.
- With no scope active, Start service visit, after a confirmation that says what will happen, reopens the project into a new scope marked as service, named "Service visit" with the date, with the issue included and no estimate required. For an archived project, the action first asks to un-archive it.
- When two people use Start service visit at the same moment, one service scope is created.
- A camera re-aimed during a visit is recorded with its reason and flags its checks, although the service scope has no issued design.
- A visit does not resolve the issue, which stays open until corrective work and a current passing check are recorded. A visit changes no estimate.
- A second visit on the same issue sits beside the first. A corrected visit keeps its earlier entry.
- The service scope's closeout record shows every visit made in it. The original scope's closeout record and its warranty details are unchanged, checked by hash.
- The closeout record and the Closeout package show the scope's warranty details and every service visit recorded in the scope.
- A revision restore leaves warranties and service visits unchanged.

Notes: A part used in a visit that is itself a replaced device follows stories 6.8 and 6.9. This story is large; splitting warranty records from service visits is a question for Kevin.

## Epic 7: Extended modelling

**Outcome.** The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors.

**Depends on.** Epics 1 to 5 complete. Story 7.3 also needs story 6.8, story 7.5 needs stories 6.8 and 6.9, and story 7.7 needs stories 7.1 to 7.6. Nothing later.

### Story 7.1: Cameras with several views and streams

As a designer, I want one camera body to carry several views and streams, so that multi-head and panoramic cameras are analysed honestly and bought once.

Covers: FR-48, FR-19 (views and streams).

- A four-head template creates one physical camera with four views. Each view has its own stable identifier, resolution, lens setting, bearing, tilt and condition, and can be inspected separately.
- Each of the four views is analysed with its own inputs, and a combined result names the view that supplies it.
- The camera counts as one device in the estimate and contributes one device's power demand to capacity, whatever its number of views.
- Capacity counts only the streams configured as recorded or transmitted. Four displayed crops add no stream.
- A fisheye camera's preview is drawn as illustrative and only when its mounting, angular extent and chosen range are known. Its DORI is Not assessed and it earns no credit toward a zone target.
- An area seen only by a fisheye or composite view is reported as Not assessed, not as having no camera view. A zone whose target is unmet and that such a view is in range of shows Not demonstrated, not Shortfall.
- A stitched-panorama camera keeps its source-head profiles apart from its composite output. Source heads are analysed individually, and the composite's DORI is Not assessed.
- A view marked Faulty is not credited on the Current installation basis; the camera's other views still are.
- Changing one head's settings on an installed camera flags that head's checks only.
- An issued design keeps the views and results it captured after the camera is edited.

### Story 7.2: Pan/tilt/zoom cameras

As a designer, I want a pan/tilt/zoom camera to count only where it rests and to show separately where it could look, so that coverage is not overstated.

Covers: FR-63, FR-29 (pan/tilt/zoom starter). Screens: S-06.

- A camera-model template can hold a pan range, a tilt range and a zoom range. A placed camera can hold its own pan and tilt limits within the model's range. Unknown ranges and limits are shown as Unknown.
- A placed camera holds named stored positions, each with pan, tilt and zoom, and one can be marked Home.
- The PRD's worked example holds: the home position alone contributes to combined coverage and to the entrance zone; the loading-dock zone keeps its counted shortfall and separately shows that the camera can reach it on demand, with the achievable detail, and that line does not meet the target.
- Previewing another stored position draws it with a dashed outline and a "not counted" banner and changes no totals.
- Reach is drawn as a separate layer named "Reachable on demand", visibly different from covered area, and is never counted as covered or as overlap.
- A point within reach shows the best achievable detail there, labelled "one place at a time".
- Narrowing a pan limit shrinks the reach.
- With unknown pan or tilt limits no reach is drawn and the camera's reach is disclosed as unassessed. With limits but no optical data, the outline is drawn with "Detail not assessed".
- Without a home position the camera contributes no counted coverage and is flagged "No home position — not counted in coverage".
- The camera counts as one device with one power demand, and stored positions add no streams.
- Changing the home position on an installed camera changes counted coverage and the zone results that depend on it, and flags that position's checks. Changing another stored position flags that position's checks, and changing a limit flags the limit checks.
- Editing a stored position on a proposed camera flags no field check.
- Limits can be edited as numbers as well as by handles.
- A pan/tilt/zoom checklist starter offers these checks: limits stop where intended; pan, tilt and zoom controls operate; each stored position shows its intended scene; the camera returns to home; limits or positions keep it from facing bright light.
- Positions, limits and the home mark are kept in a named revision. A revision restore returns them for a proposed camera and leaves those of an installed camera unchanged.

Notes: Package sheets that show the resting view, previews and reach are in story 7.7.

### Story 7.3: Doors and gates with linked components

As a designer, I want a door or gate to be its own record linked to its reader, contact, lock and controller, so that an opening can be read as a whole without any component being counted twice.

Covers: FR-49. Screens: S-08 Doors and gates.

- A door or gate has its own identifier, location and details, and can be created with no components.
- Door D-01 links to its reader, contact, lock and controller. Each stays a separate record with its own identifier, location, cost, planned action, work marks, checks and notes. A link can carry a side or direction label.
- The door lists its components, each component names its door, and the equipment schedule shows the relationship.
- Linking the same controller to D-02 creates no second purchase line and no second demand.
- A door with its own entered price appears as its own estimate line, and the costs of its components are not added to that line.
- A retained door can receive a proposed new reader. The door gets no purchase line and no Installed mark from it.
- Creating a link creates no cable, no port assignment and no power demand, and marks nothing installed or tested.
- Removing a link keeps the component and its evidence.
- Recording the removal of a linked component lists the door link in the removal review of story 6.8, and the link is kept as history on the door.

### Story 7.4: Site annotations

As a designer, I want to mark fences, entrances, directions, notes and dimensions on a plan, so that the drawing explains the site without changing any analysis.

Covers: FR-50. Screens: S-07.

- Fence lines, entrance markers, direction arrows, text callouts with an optional leader line, and two-point dimensions can be drawn on any plan, including an outdoor site plan. Each has a name and a stable identifier.
- An annotation can be selected, moved, edited, restyled with a colour and line style, locked, hidden and deleted. A locked annotation cannot be moved or edited until it is unlocked.
- Each annotation shows a text label, so its meaning does not depend on colour.
- Annotations are the same after save, undo and reload. They are saved in a named revision and returned by a revision restore.
- A fence line blocks no camera view until an obstruction is added. The offer to add one appears once for each line.
- A dimension on a plan with a valid scale shows its length with units, labelled as an estimate from the plan. On a plan without a valid scale it reads "Scale unknown".
- A dimension creates no cable route and no supply quantity.
- An entrance marker can reference a gate, and a callout can reference a photo or an issue. Neither creates another record or moves the one referenced.
- Deleting a callout keeps the photo or issue it referenced.
- Hiding or deleting markup changes no coverage result, equipment count or power demand, and does not hide the remaining-work list.

### Story 7.5: Closets and port schedules

As a designer, I want to record equipment closets and which device is on which switch port, so that port and power capacity can be checked and a port is never claimed twice.

Covers: FR-51, FR-19 (ports and power), FR-53 (port dispositions), FR-55 (ports on undo). Screens: S-12.

- A closet has a name, a stable identifier and a floor location. It groups its actual cabinets, switches, controllers, recorders and power supplies, and adds no cost and no load.
- Renaming or regrouping a closet moves no device and redraws no route.
- Each switch has a port schedule. A port shows label, type, endpoint, cable reference and power, with allocation (Free, Reserved, Assigned) and availability (Usable, Unavailable, Unknown) in separate columns.
- A port on another floor can be planned for a camera before a route exists, and shows that the route is missing. A port can be reserved with unknown power.
- Current installation and Proposed design assignments are kept separately. Assigning a port sets no Installed mark and passes no check.
- When two people claim one port, one succeeds. The other sees a conflict with the claim kept as a pending edit, and the conflict is highlighted on both rows.
- A connection on an Unavailable port keeps its record and shows a warning.
- The power summary shows the budget, known allocation, reservations and unknown loads. With any unknown load it reads Incomplete, with the count, and never shows a pass.
- With unknown inventory on a switch, the count of available ports is shown as unknown, not as a number.
- A controller terminal creates no Ethernet port and no power source, and a device wired to a controller uses no switch port.
- A cable whose end disagrees with its port assignment is shown as a discrepancy on both.
- Port and power capacity estimates use these assignments and list unassigned demand separately.
- The removal review of story 6.8 also lists the device's port and terminal assignments, each with a disposition: retained and disconnected, reused, removed, or unresolved. Unresolved is flagged Needs connection review and is included in the attention count.
- After a removal the device's demand is gone and its former port is not shown as Free until someone releases or reassigns it.
- Recording the removal of a switch flags its port assignments for review and archives no downstream device.
- Restoring a device under story 6.9 offers its earlier port as a historical choice and does not reinstate it. Reconnecting cannot take a port now assigned to another device.
- Delete draft on a proposed device with a planned port assignment lists the assignment in its preview and, on confirmation, releases only that device's own reservation. A device with a Current installation port assignment is not eligible, and the reason is listed.
- A Delete draft sent from a stale view, after someone assigned the device a port, is refused with the reason.
- Undoing a draft deletion or a bulk cleanup does not reclaim a port that has since been assigned to another device; the undo reports it.
- A revision restore returns proposed port assignments and leaves current assignments, availability and removal dispositions unchanged.

Notes: This story is large; splitting closets and port schedules from the removal, restore and undo rules is a question for Kevin.

### Story 7.6: Cable runs between floors and the length ledger

As a designer, I want one cable run to cross floors through a named riser with its length built up part by part, so that cable quantities are right and each run is counted once.

Covers: FR-9, FR-52, FR-60 (riser references). Screens: S-13.

- A riser is a named point with a stable identifier and from and to floors. Several runs can use one riser, and selecting it lists them.
- One run keeps one identifier across its ordered floor segments and its riser, and its detail shows both terminations.
- Each segment is measured with its own floor's scale. No length between floors is taken from plan coordinates.
- Transition and drop lengths are entered with units and marked measured or estimated.
- The PRD's worked example holds: 20 m and 12 m segments, a 6 m transition and 2 m of drops give a route subtotal of 40 m; 2 m of fixed extras and a selected 10% give 46 m. The ledger shows this as arithmetic, with the percentage applied once and not to the fixed extras.
- The run appears on two floors, each with a continuation label such as "to Level 2 via Riser R-1", and once in totals.
- Removing a required transition value makes the estimate Incomplete with the known subtotal shown. An entered zero is accepted as no extra length.
- A plan without a valid scale makes the estimate Incomplete.
- Moving an endpoint or waypoint updates the estimate and flags a manually entered supply quantity for review.
- A measured installed length is kept beside the estimate with its source, and no allowance is added to it.
- A run that exceeds a stated length limit for its cable type is flagged. No limit is applied to a cable type that has none recorded.
- Drawing or measuring a run sets no Installed mark and passes no check.
- Routes drawn under story 2.9 are converted and labelled horizontal-only until reviewed.
- A floor that a riser or a run segment refers to cannot be deleted; the refusal lists the riser and the runs.

### Story 7.7: Package sheets for the extended model

As a designer, I want packages to carry the closets, ports, inter-floor runs, annotations and camera analysis detail, so that the printed record matches the model.

Covers: FR-33 (remaining contents). Screens: S-37.

- Design and Closeout packages include closet equipment and port schedules, stating the Current or Proposed basis, reservations, power assumptions and unresolved warnings.
- The Closeout package shows port dispositions from removals, with historical endpoints apart from current assignments.
- Floor sheets show inter-floor continuation labels, and a run schedule lists each run's identifier, terminations, floors and risers, length breakdown, fixed extras, percentage, suggested and selected supply, measured length and completeness.
- Each run is counted once in schedules and totals across sheets and volumes.
- Annotations appear on plan sheets by default with their labels and a legend. When they are left out, the package says so, and the outstanding-issue summary is still included.
- Analysis sheets mark assessed views, illustrative fisheye previews and unassessed panoramic outputs differently.
- Analysis sheets show a pan/tilt/zoom camera's resting view as counted, and its previews and reach as not counted, each labelled.
- Equipment schedules show each door with its linked components and their own identifiers.

Notes: Extends the Design package of story 4.10 and the Closeout package of story 5.12.

