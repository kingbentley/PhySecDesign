## Epic 6: Existing sites and return visits

**Outcome.** An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact.

**Depends on.** Epics 1 to 5 complete. Nothing later.

**Why here.** Planned actions, removal and reopening all act on the installed marks, checks, issues and closeout that Epic 5 defines, and Epic 7's doors, ports and runs build on the removal and restoration rules set here.

### Story 6.1: Existing equipment, condition, provenance and the surveyed baseline

As a designer, I want to record the equipment and cable already on site with what is known about it and how it is known, so that planning starts from the real building and not from guesses.

Covers: FR-39, device state model (condition and provenance).

**Core behaviour**
- A device can be added as Existing during a survey and is placed on a plan like any other device.
- A device added as Existing creates no purchase line, no Installed mark and no test result.
- A known cable route can be drawn as existing. It keeps a stable run identifier and creates no purchase quantity.
- An Existing device has a condition of Working, Faulty or Unknown. It starts as Unknown and a person sets it.
- The condition is shown as a chip in the inspector header and on the device sheet.
- A device record gains optional fields for manufacturer, serial number, IP address, MAC address, source asset ID, room and installation date. An empty field reads Unknown.
- Each recorded value can carry a provenance of Imported, Old document, Estimate or Site-confirmed, shown as a chip beside the field with the source detail on demand.
- A camera with an unknown model or installation date can be saved with those fields shown as Unknown. Recording it today does not set its installation date.
- A device keeps its internal identifier and can also hold the label already used on site. Both are searchable, and search also matches the room.
- A surveyed baseline can be saved as a fixed named revision, marked as the baseline in Records.

**Refusals and edge cases**
- A test outcome never changes a device's condition.
- A baseline is listed only when its snapshot is stored and its hash verified. A failed save is shown and can be retried.

**Access and restore**
- Later edits leave the baseline's stored file unchanged, checked by its hash.
- A revision restore leaves the condition, provenance and recorded field values of an Existing device unchanged.

Notes: Left for later: spreadsheet intake (story 6.2a, story 6.2b, story 6.3a and story 6.3b); planned work on existing devices (story 6.6a); recording a removal (story 6.8a).

### Story 6.2a: Choose an inventory file and sheet

As a designer, I want to load an equipment spreadsheet and pick the sheet and header row, so that an existing inventory does not have to be retyped.

Covers: FR-62 (file and sheet selection, unsupported files), AD-10. Screens: S-09 step 1.

**Core behaviour**
- Inventory import is a four-step page with a visible step indicator. This story delivers step 1, File and sheet.
- An .xlsx file with a title row is read from the chosen sheet and header row, with a preview of the first rows.
- A CSV file is read after its delimiter and parsed columns are confirmed, with the same preview.
- The file is parsed in the browser.
- Formulas, macros and external links are never run. A cell with a stored formula result is read as that result.
- A sample template can be downloaded.

**Refusals and edge cases**
- A legacy .xls file, a macro-enabled file and a password-protected file are each refused at step 1 with a plain reason, and the saved inventory is unchanged.
- A file over the size limit, or with more data rows than the row limit, is refused at step 1 with the limit named.
- A file with no data rows under the chosen header row cannot go past step 1, and the reason is shown.
- A cell that holds an error, or a formula with no stored result, is flagged for review on its row.

**Limits and values**
- An inventory file can be at most 10 MiB.
- An inventory file can hold at most 5,000 data rows. (CE-01)

**Evidence to record**
- The fixture script of story 2.7 also produces a 600-row inventory as .xlsx and as .csv.
- While the 600-row file is parsed, Cancel and the step controls respond within 250 ms. (CE-02)
- The preview of the 600-row file appears within 30 seconds of choosing the file, in each of three runs, recorded as a development measurement.

Notes: Left for later: server-side enforcement of file limits and the usage display (story 8.5); the acceptance measurement of the 30-second target (story 10.2).

### Story 6.2b: Map inventory columns

As a designer, I want to say which column means what, so that a spreadsheet with its own headings fills the right fields.

Covers: FR-62 (column mapping, identifiers, remembered mapping), UX decision D9. Screens: S-09 step 2.

**Core behaviour**
- Step 2 lists one row per source column: its heading, three sample values, the suggested field, and a choice to change or ignore it.
- Columns can be mapped to source asset ID, existing Site Studio ID, name, type, manufacturer, model, serial number, IP address, MAC address, building, floor and room hints, and notes.
- Equipment-type values found in the file are mapped to equipment types in the same way.
- A default equipment type, including Unknown, can be set for rows whose type is missing or not recognised.
- Unmapped and ignored columns are listed, with their count, before the next step.
- Asset ID 00042 stays 00042.
- A value whose conversion is uncertain, such as a long number or a date-like identifier, is flagged on its row.
- The project's last confirmed mapping is offered only when the headings fit, and can be edited before it is used.

**Refusals and edge cases**
- A header row with duplicate headings stops at mapping with a plain reason.
- Two columns mapped to one field stop at mapping with a plain reason.
- Leaving the page at this step changes nothing in the project.

**Access and restore**
- A revision restore leaves the remembered mapping unchanged.

### Story 6.3a: Review import rows and match them to devices

As a designer, I want to see what an import would add or change before it happens, so that a spreadsheet cannot overwrite what was confirmed on site or create duplicates.

Covers: FR-58 (matching and preview), FR-62 (row review). Screens: S-09 step 3.

**Core behaviour**
- Step 3 groups rows as New, Changed, Unchanged and Needs review, with counts.
- A Changed row shows the current and incoming values side by side, with the source of each.
- A row matches an existing device by a valid Site Studio ID for this property, or by a source asset ID that is unique in the file and in the project. (CE-03)
- A row with neither identifier matches the device that an earlier import of this project created from a row with identical mapped values, and is listed as Unchanged. With no such device it is listed as New. (CE-04)
- Names, addresses and location hints never establish identity by themselves.
- Re-uploading the same inventory lists every row as Unchanged, including rows that have no identifier.
- Rows are ticked explicitly. A group-level select is offered for New and Unchanged rows without errors. (CE-05)
- Site-confirmed values are locked by default. Replacing one takes a deliberate choice on that row, with a reason.

**Refusals and edge cases**
- A row whose name is already used by another row or by a device it does not match goes to Needs review.
- Duplicate rows in the file, including two identical rows without identifiers, go to Needs review.
- Rows with conflicting identifiers go to Needs review.
- A row with neither a usable name nor a source asset ID is shown as an error and cannot be imported until it is corrected or skipped.
- A row error is shown inline with Fix and Skip.
- Nothing in the project changes at this step.

Notes: Left for later: applying the ticked rows (story 6.3b); a row that matches a removed device (story 6.8a).

### Story 6.3b: Apply an import and re-import safely

As a designer, I want the rows I ticked applied once and reported clearly, so that repeating or interrupting an import never duplicates or damages records.

Covers: FR-58 (apply, re-import, concurrent changes), FR-62 (result, source and mapping kept), FR-56 (imported records as source-based inventory), FR-57 (Awaiting placement, base). Screens: S-09 step 4, S-08.

**Core behaviour**
- Confirming step 4 applies only the ticked rows and creates an import batch that records the actor, the time, the source file, the sheet and the confirmed mapping.
- The source file and the confirmed mapping can be opened from the import batch.
- A device created by a New row starts as Existing with condition Unknown.
- Imported values carry the Imported provenance.
- Each applied row stores a link to the device it created or matched, together with a fingerprint of the row's mapped values. The match for rows without identifiers uses this link.
- A created device with no confirmed floor or position is Awaiting placement. It is listed in the Awaiting placement segment of Equipment with its building, floor and room hints, and has no map marker.
- A blank cell erases nothing.
- A device missing from the file is neither deleted nor archived.
- A replaced Site-confirmed value is recorded with its reason, and the earlier value stays in the device's history.
- Applying a re-uploaded copy of the same inventory creates no extra devices, whether or not its rows have identifiers.
- The result reports imported, skipped, failed, conflicted and unresolved counts, with links to the records awaiting placement and to those needing review.

**Refusals and edge cases**
- An import sets no Installed or Configured mark and no check outcome, whatever the source columns say.
- A record changed by someone else since the preview comes back as a conflict, with the choice made for that row kept for review.
- When two people apply the same file at the same moment, every New row is matched again at the moment of applying, by identifier and by fingerprint, and each device is created once.
- An apply interrupted part-way reports which rows were applied. Continuing applies only the remaining rows and creates no duplicates.

**Access and restore**
- A revision restore leaves import batches, their source files, and imported devices and values unchanged.

**Evidence to record**
- The confirmed import of the 600-row fixture completes within 30 seconds in each of three runs, recorded as a development measurement.

Notes: Left for later: searching, verifying and placing records that await placement (story 6.4); cleaning up a mistaken batch (story 6.5); the acceptance measurement of the 30-second target (story 10.2).

### Story 6.4: Awaiting placement, and verifying on site

As a technician, I want to find imported records that have no position, check them against what is really there and place them, so that the inventory becomes a verified survey.

Covers: FR-56, FR-57, FR-8 (Awaiting placement). Screens: S-08, S-F5, S-F6.

**Core behaviour**
- The Awaiting placement list is searchable and can be filtered by building, floor or room hint.
- The count of records awaiting placement stays visible while one floor is shown.
- Choosing an unplaced record in the equipment list opens its Awaiting placement entry, not a floor.
- An unplaced record has no coverage and no test result.
- Capacity estimates still count an unplaced device's applicable demand.
- Coverage results state how many devices are omitted because they are unplaced.
- On a phone, a technician can confirm or correct each value. A confirmed value becomes Site-confirmed, and the imported value stays in view as the earlier source.
- The technician places the record with the crosshair on a chosen floor. It keeps its identifier and import history, and no second device is created.
- A device found on site that was not in the spreadsheet can be added from the same screen as an Existing device.
- A project with no spreadsheet can be surveyed by adding every device by hand.
- The field shell's filtered lists gain "Awaiting placement" and "Not site-confirmed". (CE-06)

**Refusals and edge cases**
- Placing sets no Installed mark, confirms no other value and passes no check.

**Access and restore**
- A revision restore leaves placements made here and Site-confirmed values unchanged.

### Story 6.5: Bulk cleanup of mistaken records

As a designer, I want to remove a batch of mistaken records in one step after seeing what would go, so that a bad import can be undone without touching real equipment.

Covers: FR-59. Screens: S-10.

**Core behaviour**
- The Equipment page gains multi-select. A selection of records, or one import batch, can be previewed: how many are selected, how many can be removed, and each blocked record with its reason.
- Only accidental drafts that qualify for Delete draft and unused records created by an import can be removed.
- Confirming removes only the eligible records that were previewed.
- Removing a record removes no other device, cable, note, photo or issue.
- The outcome is listed per record.
- The cleanup, with its per-record outcomes, actor and time, is recorded in the project's change log, where any member of the project can open it. (CE-07)
- The cleanup can be undone by the person who ran it, in the same session. (CE-08)
- A record removed by a cleanup is not listed under Historical.

**Refusals and edge cases**
- A device that existed before the batch and was only matched by it is blocked. Membership of a batch never makes a record removable by itself.
- Site-confirmed, issued, approved, installed, tested or otherwise evidenced records are blocked.
- Equipment that other records depend on is blocked.
- Eligibility is checked again on confirmation. A record that gained a test or an edit since the preview is reported and not removed.
- Undo is refused for a record whose floor has since been deleted or which someone else has since changed, and those records are listed.
- A retried cleanup is applied once.

**Access and restore**
- A revision restore returns a draft removed by a cleanup, as it does after any Delete draft, and does not return an import-created record. (CE-09)

### Story 6.6a: Planned actions on existing equipment

As a designer, I want to say what will happen to each existing device, so that an upgrade is planned without rewriting the record of what is there.

Covers: FR-40, FR-55 (reversal on equipment that was already existing), device state model (planned action, relocation, work recorded). Screens: S-04 Work tab.

**Core behaviour**
- The inspector's Work tab shows and sets the device's planned action for the active scope.
- An Existing device can be planned as Retain, Relocate, Service or reconfigure, Replace or Remove. A new device is Add new. A device with no decision shows None.
- Choosing Replace creates a new Proposed device with its own identifier, linked to its predecessor.
- Planning a relocation records a planned position and leaves the current position unchanged.
- Recording Installed on a device with a planned Relocate makes the planned position its recorded location, and the earlier location stays in its history.
- A planned Service or reconfigure holds the intended work and settings as text. Recording Installed for the scope records that work as done and changes neither the device's lifecycle nor its location. (CE-10)
- Retained equipment and retained cable create no purchase line and appear in the estimate under "Retained, not purchased".
- Relocation, service and replacement costs are entered as explicit estimate lines.
- The device sheet's one-sentence instruction begins with the planned action for Retain, Relocate, Service or reconfigure, Replace and Remove, as it does for Add new.

**Refusals and edge cases**
- A choice the state model forbids is disabled with its reason: any action except Add new on a Proposed device, Add new on an Existing device, and any new action on a removed, cancelled or corrected device.
- Replace cannot be saved without the link to its successor.
- Planning an action changes no recorded location, archives nothing and sets no mark.
- Reversing a mistaken Installed mark on a device that was Existing before the scope clears the mark for the scope and leaves the device Existing. (CE-11)
- Reversing a mistaken Installed mark on a relocated device also returns it to its earlier recorded location.

**Access and restore**
- Planned actions and planned positions are saved in a named revision and returned by a revision restore.

Notes: Left for later: the Changes basis and how each basis shows planned actions (story 6.6b); recording a removal (story 6.8a).

### Story 6.6b: Current installation, Proposed design and Changes

As a designer, I want to see the site as it is, as it will be, and the difference, so that everyone reads the same plan of the upgrade.

Covers: FR-41, FR-33 (planned actions in the Design package). Screens: S-11.

**Core behaviour**
- The basis control gains Changes beside Current installation and Proposed design.
- A planned replacement leaves the old device in Current installation and shows the new one in Proposed design.
- Proposed counts include the replacement and not the predecessor, unless the predecessor is marked to remain.
- A planned relocation shows the planned position in Proposed design and the current position in Current installation.
- A planned Remove leaves the device in Current installation and takes it out of Proposed design.
- Changes draws relocation arrows and replacement pairs on the plan, with a list of devices grouped by action.
- The Changes list is followed by the cancellations and corrections made against the current issued design.
- A Faulty camera is not credited in a coverage estimate on the Current installation basis.
- A Faulty camera with a planned Service or reconfigure is credited on the Proposed basis and labelled as a planned return to service.
- A device with unknown specifications is shown as unassessed or estimated in each result, never as zero demand or as coverage.
- The Design package shows each device's planned action on plan sheets and in the equipment schedule, with retained equipment shown as context and not as a purchase.

### Story 6.7: Work scope categories

As a designer, I want to mark each device and route as worked on now, only inspected, or only shown for reference, so that the estimate and the checks cover exactly the work in this scope.

Covers: FR-45. Screens: S-11.

**Core behaviour**
- The scope panel names the active scope and lists its revisions, its estimate and its evidence.
- Saving a second named revision keeps the same scope and the same estimate.
- Each device and route in the scope is Work now, Inspect or test only, or Reference only.
- The category is preselected from the planned action: Add new, Relocate, Service or reconfigure, Replace and Remove give Work now; None and Retain give Reference only. (CE-12)
- Changing a category is recorded with actor and time.
- The scope panel shows the estimate and the required checks that each category implies, and both update when a category changes.
- The applicable core checks of story 5.4 are required by default for each Work now device. (CE-13)
- An Inspect or test only device has no check required until an Editor selects the checks that apply to it.
- A Reference only device gets no checks.
- Reference-only equipment still counts in coverage and capacity and creates no purchase line.
- An Inspect or test only device can have a labour line without an equipment purchase.
- From this story on, the remaining-work list and the closeout count the Work now devices whose work is not recorded, and the required checks of Work now and Inspect or test only devices.
- A Work now device with a planned Add new, Relocate or Service or reconfigure, and a Replace successor, is listed until its Installed mark for the scope is set.
- A device with a planned Remove, and a Replace predecessor, is listed as "Removal not recorded" and is not counted as not installed. (CE-14)

**Refusals and edge cases**
- A device with a planned action of None or Retain cannot be set to Work now, and the reason is shown.
- Moving an item out of Work now asks for a reason. (CE-15)
- Moving an item that has a required retest or an open issue to Reference only shows a warning and leaves that item in the remaining-work list.
- A Reference only device with unknown details and no selected checks adds nothing to the remaining-work list.

**Access and restore**
- Scope categories are saved in a named revision and returned by a revision restore.

Notes: Left for later: the recorded removal that clears a "Removal not recorded" row (story 6.8a); a second scope, created by reopening (story 6.10).

### Story 6.8a: Record a removal and archive the device

As a technician, I want to record that a device has actually been taken out, so that the record matches the site and nothing about the device is lost.

Covers: FR-35, FR-8 (historical records), FR-42, FR-58 (archived match), FR-60 (archived device references), NFR-1. Screens: S-04.

**Core behaviour**
- The device menu of story 4.9 offers Record removal for an Existing device.
- Recording a removal, with its date and an optional reason and replacement link, makes the device Removed and archives it in the same step. The actor and time are recorded.
- The archived device keeps its identity, model, settings, last location, connections, work marks, checks and attempts, notes and photos.
- No field has to be filled in to archive a device.
- A removed device leaves the active plan and schedule, coverage, equipment totals and capacity demand.
- Earlier revisions and packages are unchanged by a removal.
- A removed device is found by search under Historical in Equipment, labelled Removed, with its evidence.
- An optional historical layer shows a removed device on the plan at its last location.
- A recorded removal completes a planned Remove: its "Removal not recorded" row leaves the remaining-work list, and no Installed mark is asked for.
- For a planned Replace, the work shows as done only when the successor's installation and the predecessor's removal are both recorded.
- The predecessor's notes, photos and passes stay with the predecessor.

**Refusals and edge cases**
- A planned Remove or Replace archives nothing by itself.
- With no scope active, Record removal is refused with "not saved: no active scope — reopen first".
- A save onto a removed device from a stale tab or a reconnecting phone is refused and kept for review as "not saved: device removed". It is not applied and not discarded. (CE-16)
- A re-imported row that matches a removed device goes to Needs review. It does not reactivate the device and creates no new one.
- A floor that holds a removed device's last location cannot be deleted, and the refusal lists the device.

**Access and restore**
- A revision restore leaves a removed device archived, and lists for review a removed device that the revision still holds.

Notes: Left for later: the removal review, cable ends and what stays outstanding (story 6.8b); restoring the device (story 6.9a); port dispositions (story 7.5c); a door link on a removed component (story 7.3).

### Story 6.8b: Review a removal and settle its cable ends

As a technician, I want to see what a removal leaves behind and say what became of each cable, so that open work and loose ends stay visible.

Covers: FR-53 (cable ends and dispositions), FR-35 (reconciling connections), FR-33 (removed equipment and connection context), FR-68 (attention count), NFR-1. Screens: S-04, S-12.

**Core behaviour**
- Before a removal is confirmed, a review lists the device's cable ends, its open issues, its required retests and any open reliability run that covers it.
- Each affected cable end gets a disposition: retained and disconnected, reused, removed, or unresolved.
- Unresolved is allowed and is flagged Needs connection review.
- An unresolved disposition can be set later from the cable, which clears the flag.
- The cable keeps its run identifier, route, lengths, notes and evidence.
- The device's connection to the cable is ended and kept as history.
- A cable is archived only when its own removal is recorded.
- Recording the removal of a switch flags the cable ends connected to it for review and archives no other device.
- Open issues and required retests on the device stay in the remaining-work list after removal. Removal resolves no issue.
- An open reliability run that covers the device is flagged and keeps running.
- The project list's attention count of story 5.9 includes cable ends flagged Needs connection review. (CE-17)
- The closeout record and the Closeout package list removed and replaced equipment and the retained, reassigned, removed and unresolved cable ends, with historical ends shown apart from current connections.

**Refusals and edge cases**
- The removal and its dispositions are saved as one operation. A stale tab cannot leave a cable end actively connected to a removed device.

**Access and restore**
- A revision restore leaves cable-end dispositions and ended connections unchanged.

### Story 6.9a: Restore the same device

As a technician, I want to put an archived device back on the plan as the same record, so that its history follows the physical equipment.

Covers: FR-36 (restore), FR-54, NFR-1.

**Core behaviour**
- A removed device's Historical record offers Restore. Restoring keeps the device's identifier and history and records who restored it and when.
- A restored device is Existing with condition Unknown. (CE-18)
- Restoring needs a position confirmed by the user on a current floor of the same property. The device never enters Awaiting placement.
- On an unchanged or renamed floor the former position is offered for confirmation.
- On a floor whose drawing, scale or alignment has changed, the position must be set again.
- A floor is matched by its identity, not its name: a different floor that now carries the original floor's name is not offered the former position.
- Earlier photos and attempts keep their former floor and location.
- Earlier passes are not counted for the restored device, and its checks are flagged Retest required. (CE-19)
- Restoring creates no purchase line.
- Cancelling leaves the device archived with its history intact.

**Refusals and edge cases**
- A restore is refused when the chosen floor has changed or been deleted, or the device has changed, since the restore screen opened. The choices made are kept for review.
- When the device's label or asset ID is now used by another active device, the restore asks for a label decision before it can be confirmed. (CE-20)
- With no scope active, a restore is refused with "not saved: no active scope — reopen first". (CE-21)

**Access and restore**
- A revision restore leaves a restored device, its new position and its restoration record unchanged.

Notes: Left for later: reconnecting cables and linking a replacement (story 6.9b); reconnecting to a switch port (story 7.5c).

### Story 6.9b: Reconnect a restored device, or link a replacement

As a technician, I want to reconnect a restored device deliberately, or record a different unit as its replacement, so that connections and history are never assumed.

Covers: FR-36 (replacement), FR-53 (reconnection and reuse).

**Core behaviour**
- A restored device's earlier cable connections are offered as historical choices and are not reinstated.
- Reconnecting a cable end is an explicit step.
- A different physical replacement has a new identifier linked to its predecessor.
- Predecessor and replacement each keep their own history, results and counts.
- The link can be followed in both directions.
- A retained cable chosen for the replacement keeps its run identifier and creates no purchase line.
- The replacement inherits no installation evidence and no pass from the predecessor.

**Refusals and edge cases**
- Reconnecting cannot take a cable end that is now connected to another device.
- Reconnecting cannot bring back a removed cable.

**Access and restore**
- A revision restore leaves reconnections and the links between a predecessor and its replacement unchanged.

### Story 6.10: Reopen for later work, carrying issues forward

As a designer, I want to reopen a finished project for new work at the same property, so that later work starts from what is installed and keeps the earlier records fixed.

Covers: FR-38, FR-45 (one active scope), FR-46 (carryover). Screens: S-20, S-18.

**Core behaviour**
- Records offers Reopen for a project whose last scope is closed. Reopening creates a new named scope, In progress, and a working revision from the latest installation.
- Project and device identifiers are unchanged by reopening.
- The new scope has its own empty estimate and its own checks.
- Equipment already installed creates no purchase line in the new scope.
- Rates and chosen lines can be copied from the earlier estimate. No quantity is carried over automatically.
- The new scope starts at Not issued and with no approvals.
- Review assignments are offered for reuse and can be changed.
- An unresolved issue appears in the new scope with the same identifier, marked as carried from an earlier scope, and awaits a disposition: Include now, Defer or Resolve. It is not duplicated.
- A scope finished with a deferred fault can be closed only as Closed with outstanding items.
- A revision of an earlier scope can be opened and compared.
- Once the project is reopened, design edits, Installed and Configured marks, test results, removals and new revisions are accepted again.

**Refusals and edge cases**
- Reopening restores no removed device, resolves no issue, and carries no approval or pass into the new scope.
- Reopening leaves earlier closeout records and packages unchanged, checked by hash.
- Reopening is refused while a scope is active.
- When two people reopen at the same moment, one scope is created and the second person is taken to it. (CE-22)
- A revision of an earlier scope cannot be restored into the new scope.
- A revision of an earlier scope cannot be designated as the new scope's current issued design. (CE-23)

**Access and restore**
- A revision restore changes no scope, no scope's state and no carried issue.

Notes: Left for later: reopening an archived project (story 6.11); Start service visit, which reopens into a service scope (story 6.12c).

### Story 6.11: Archive and un-archive a project

As an Editor or an administrator, I want to archive a project that is no longer being worked on and un-archive it when needed, so that finished records stay readable and cannot be changed by accident.

Covers: FR-37, FR-68, FR-42. Screens: S-20, S-31.

**Core behaviour**
- An Editor of the project can archive and un-archive it from Records.
- An administrator can archive and un-archive it from Records or from Administration: Projects.
- The projects list and Administration: Projects show the archived state.
- An archived project can be searched, viewed and exported and cannot be edited. It shows the archive banner.
- Viewing and exporting leave its design, installation, evidence, decisions and earlier packages unchanged.
- Downloading an earlier package from an archived project returns the same bytes.
- Exporting may add a new retained package edition without un-archiving the project.
- Un-archiving is an explicit action, starts no scope and changes no record.
- Reopen on an archived project first asks to un-archive it.
- Archiving and un-archiving appear in the activity log with actor and time.

**Refusals and edge cases**
- Archiving is refused while a scope is In progress, with the reason shown.
- Archiving is refused while an inventory import or a package generation is running in the project, with the reason shown. (CE-24)
- A save into an archived project from a stale tab or a reconnecting phone is refused and kept for review, and is not retried. (CE-25)
- When two people archive at the same moment, the project is archived once and the second person sees that it already is.
- A revision restore is refused while the project is archived.
- While the project is archived, a reviewer link opens its revision read-only and accepts no comment or decision. (CE-26)

**Limits and values**
- The banner reads "Archived — view, search and export only".
- A refused save is labelled "not saved: project archived".

**Access and restore**
- No revision restore changes the archive state or its history.

Notes: Left for later: backup and restore jobs that also block archiving (story 8.1).

### Story 6.12a: Warranty records

As a designer, I want to record the warranty on an installation and on individual devices, so that anyone can see what is covered and until when.

Covers: FR-65 (warranty records and status), FR-33 (warranty details). Screens: S-23 warranty step, S-19.

**Core behaviour**
- Close out gains a warranty step. A scope's installation warranty has a term, a start date, a provider, a note and covered items.
- The start date defaults to the scope's closeout date and can be changed.
- Covered items default to the equipment and cable newly installed in that scope and can be adjusted.
- A device can also carry a manufacturer warranty with its own term, start date and provider.
- A device covered by more than one warranty shows each separately.
- Each warranty shows its calculated end date, which is the start date plus the term. (CE-27)
- Each warranty shows its status as of a stated date: Not started before the start date, In warranty from the start date to the end date inclusive, Expired after it.
- Equipment with no warranty recorded shows Unknown, never Expired. This includes surveyed existing equipment.
- Changing a warranty's term, start date, provider or covered items is recorded with actor and time, and the earlier values stay in its history.
- Warranty details are shown on the device record and as an optional column in the equipment schedule.
- When an issue is raised on a device, the device's warranty status is shown on the issue.
- The closeout record is written after the warranty step, and it and the Closeout package show the warranty details entered there. Skipping the step records no warranty. (CE-28)

**Refusals and edge cases**
- A term of zero, a negative term or a part-month term is refused.
- A warranty recorded on a scope that is not yet closed, with no start date entered, shows Not started. (CE-29)
- With no scope active, a warranty can still be added or changed.
- A warranty changed after closeout leaves that scope's closeout record unchanged, checked by hash.

**Limits and values**
- A warranty term is entered in whole months, with a minimum of 1. (CE-30)

**Access and restore**
- A revision restore leaves warranties unchanged.

Notes: Left for later: the under-warranty suggestion on a service visit (story 6.12b).

### Story 6.12b: Service visits

As a technician, I want to record each visit made to fix a fault, so that anyone can see what was found and what was done.

Covers: FR-65 (service visits), FR-46 (visits on an issue), FR-33 (service visits in the Closeout package). Screens: S-19, S-18.

**Core behaviour**
- A service visit is recorded on an issue with when and how the fault was reported, the visit time, the fault found, the work done, the parts used, the time spent, who attended and whether it was under warranty.
- Under warranty is prefilled as of the visit date, with its reason shown, and can be changed.
- The suggestion is Yes if any warranty covering the device is In warranty.
- The suggestion is No if every warranty covering the device is Not started or Expired.
- The suggestion is Unknown if no warranty is recorded or the issue concerns no device.
- During an open scope, a visit is recorded in that scope and no new scope is started.
- A visit does not resolve the issue, which stays open until corrective work and a current passing check are recorded. The form says so.
- A visit changes no estimate.
- A second visit on the same issue sits beside the first, and visits added by two people at the same moment are both kept.
- A corrected visit keeps its earlier entry.
- The issue page's timeline shows each visit.
- The closeout record and the Closeout package of a scope show every service visit recorded in it.

**Refusals and edge cases**
- The visit time cannot be earlier than the reported time, and neither can be in the future. (CE-31)
- With no scope active, an existing visit can be corrected and a new visit cannot be recorded. (CE-32)

**Access and restore**
- A revision restore leaves service visits unchanged.

Notes: Left for later: Start service visit, which lets a new visit be recorded when no scope is active (story 6.12c).

### Story 6.12c: Start a service visit when no scope is active

As a technician, I want one action that reopens the project for a service call, so that a fault reported months later can be attended and recorded without planning a new project.

Covers: FR-65 (service scope), FR-38 (reopening in one step), FR-26 (field changes without an issued design). Screens: S-18, S-19.

**Core behaviour**
- With no scope active, an issue offers Start service visit. After a confirmation that says what will happen, the project reopens into a new scope marked as service, with the issue included and the visit form open.
- A service scope needs no estimate and can be closed without one.
- A service scope starts with no current issued design, and issuing one remains available.
- In a service scope, Installed and Configured marks and field changes are recorded with nothing issued, and the warning "Work started with no issued design" is not shown.
- A camera re-aimed during a visit is recorded with its reason and flags its checks, although the service scope has no issued design.
- The service mark is a label only: the scope follows the one-active-scope rule and is closed out like any other scope.
- The service scope's closeout record shows every visit made in it.
- The original scope's closeout record and its warranty details are unchanged, checked by hash.
- For an archived project, the action first asks to un-archive it.

**Refusals and edge cases**
- When two people use Start service visit at the same moment, one service scope is created and the second person is taken to it. (CE-33)
- While a scope is active, Start service visit is not offered.

**Limits and values**
- A service scope is named "Service visit" followed by the date, and the name can be changed. (CE-34)

## Epic 7: Extended modelling

**Outcome.** The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors.

**Depends on.** Epics 1 to 6 complete. Nothing later.

**Why here.** These models extend records whose lifecycle, planned actions, removal and restoration are settled in Epic 6, so each extension can state its own rule for them once.

### Story 7.1: Cameras with several views and streams

As a designer, I want one camera body to carry several views and streams, so that multi-head and panoramic cameras are analysed honestly and bought once.

Covers: FR-48, FR-19 (views and streams).

**Core behaviour**
- A four-head template creates one physical camera with four views.
- Each view has its own stable identifier, resolution, lens setting, bearing, tilt and condition, and can be inspected separately.
- Each view is analysed with its own inputs, and a combined result names the view that supplies it.
- The camera counts as one device in the estimate and contributes one device's power demand to capacity, whatever its number of views.
- Capacity counts only the streams configured as recorded or transmitted. Four displayed crops add no stream.
- A fisheye camera's preview is drawn as illustrative, and only when its mounting, angular extent and chosen range are known.
- A fisheye view's DORI is Not assessed, and it earns no credit toward a zone target.
- A stitched-panorama camera keeps its source-head profiles apart from its composite output. Source heads are analysed individually, and the composite's DORI is Not assessed.
- A view marked Faulty is not credited on the Current installation basis, and the camera's other views still are.
- Changing one head's settings on an installed camera flags that head's checks only.
- An issued design keeps the views and results it captured after the camera is edited.

**Refusals and edge cases**
- An area seen only by a fisheye or composite view is reported as Not assessed, not as having no camera view.
- A zone whose target is unmet, and that such a view is in range of, shows Not demonstrated, not Shortfall.

**Access and restore**
- A revision restore returns the views and streams of a Proposed camera and leaves those of an Existing camera, with each view's condition, unchanged.

### Story 7.2a: Pan/tilt/zoom cameras: stored positions and the resting view

As a designer, I want a pan/tilt/zoom camera to count only where it rests, so that coverage is not overstated.

Covers: FR-63 (ranges, limits, stored positions, home, checks), FR-29 (pan/tilt/zoom starter). Screens: S-06.

**Core behaviour**
- A camera-model template can hold a pan range, a tilt range and a zoom range.
- A placed camera can hold its own pan and tilt limits within the model's range, edited as numbers or by handles.
- Unknown ranges and limits are shown as Unknown.
- A placed camera holds named stored positions, each with pan, tilt and zoom, and one can be marked Home.
- The home position alone contributes to combined coverage, DORI and zone results. In the PRD's worked example it alone counts toward the entrance zone.
- Previewing another stored position draws it with a dashed outline and a "not counted" banner and changes no totals.
- The camera counts as one device with one power demand, and stored positions add no streams.
- Changing the home position on an installed camera changes counted coverage and the zone results that depend on it, and flags that position's checks.
- Changing another stored position on an installed camera flags that position's checks, and changing a limit flags the limit checks.
- A pan/tilt/zoom checklist starter offers these checks: limits stop where intended; pan, tilt and zoom controls operate; each stored position shows its intended scene; the camera returns to home; limits or positions keep it from facing bright light.

**Refusals and edge cases**
- Without a home position the camera contributes no counted coverage and is flagged "No home position — not counted in coverage".
- Editing a stored position on a proposed camera flags no field check.
- A limit outside the model's known range is refused.

**Access and restore**
- Positions, limits and the home mark are kept in a named revision. A revision restore returns them for a proposed camera and leaves those of an installed camera unchanged.

Notes: Left for later: the reach layer (story 7.2b); package sheets that show the resting view, previews and reach (story 7.7).

### Story 7.2b: Pan/tilt/zoom cameras: reach on demand

As a designer, I want to see separately where a pan/tilt/zoom camera could look, so that nobody mistakes what it can reach for what it covers.

Covers: FR-63 (reach and achievable detail). Screens: S-06.

**Core behaviour**
- Reach is drawn as a separate layer named "Reachable on demand", visibly different from covered area.
- Reach is never counted as covered or as overlap.
- A point within reach shows the best achievable detail there, labelled "one place at a time".
- An otherwise uncovered area within reach is identified as reachable on demand, not as having no camera view.
- Narrowing a pan limit shrinks the reach.
- A zone shows, apart from its counted result, which cameras can reach it on demand and the area reachable at each DORI level.
- The PRD's worked example holds: the loading-dock zone keeps its counted shortfall and separately shows that the camera can reach it on demand, with the achievable detail, and that line does not meet the target.

**Refusals and edge cases**
- With unknown pan or tilt limits no reach is drawn, and the camera's reach is disclosed as unassessed.
- With limits but no optical data, the reach outline is drawn with "Detail not assessed".

Notes: Left for later: package sheets that show reach as not counted (story 7.7).

### Story 7.3: Doors and gates with linked components

As a designer, I want a door or gate to be its own record linked to its reader, contact, lock and controller, so that an opening can be read as a whole without any component being counted twice.

Covers: FR-49. Screens: S-08 Doors and gates.

**Core behaviour**
- Equipment gains a Doors and gates tab. A door or gate has its own identifier, location and details, and can exist with no components.
- Door D-01 links to its reader, contact, lock and controller. A link can carry a side or direction label.
- Each linked component stays a separate record with its own identifier, location, cost, planned action, work marks, checks and notes.
- The door lists its components, each component names its door, and the equipment schedule shows the relationship.
- Linking the same controller to D-02 creates no second purchase line and no second demand.
- A door with its own entered price appears as its own estimate line, and the costs of its components are not added to that line.
- A retained door can receive a proposed new reader. The door gets no purchase line and no Installed mark from it.
- Removing a link keeps the component and its evidence.
- Recording the removal of a linked component lists the door link in the removal review of story 6.8b, and the link is kept as history on the door.

**Refusals and edge cases**
- Creating a link creates no cable, no port assignment and no power demand, and marks nothing installed or tested.

**Access and restore**
- A revision restore returns the links in which the door or the component is Proposed, and leaves links between two Existing records unchanged. (CE-35)

### Story 7.4: Site annotations

As a designer, I want to mark fences, entrances, directions, notes and dimensions on a plan, so that the drawing explains the site without changing any analysis.

Covers: FR-50, FR-60 (annotations block floor deletion). Screens: S-07.

**Core behaviour**
- Fence lines, entrance markers, direction arrows, text callouts with an optional leader line, and two-point dimensions can be drawn on any plan, including an outdoor site plan.
- Each annotation has a name and a stable identifier.
- An annotation can be selected, moved, edited, restyled with a colour and line style, locked, hidden and deleted.
- Each annotation shows a text label, so its meaning does not depend on colour.
- Annotations are the same after save, undo and reload.
- A dimension on a plan with a valid scale shows its length with units, labelled as an estimate from the plan.
- An entrance marker can reference a gate, and a callout can reference a photo or an issue. Neither creates another record or moves the one referenced.
- Hiding or deleting markup changes no coverage result, equipment count or power demand, and does not hide the remaining-work list.

**Refusals and edge cases**
- A locked annotation cannot be moved or edited until it is unlocked.
- A fence line blocks no camera view until an obstruction is added. The offer to add one appears once for each line.
- A dimension on a plan without a valid scale reads "Scale unknown".
- A dimension creates no cable route and no supply quantity.
- Deleting a callout keeps the photo or issue it referenced.
- A floor that holds an annotation cannot be deleted, and the refusal lists the annotations.

**Access and restore**
- Annotations are saved in a named revision and returned by a revision restore.

### Story 7.5a: Closets and port schedules

As a designer, I want to record equipment closets and which device is on which switch port, so that the network side of the design is written down.

Covers: FR-51 (closets, port schedule, assignments), FR-60 (closets block floor deletion). Screens: S-12.

**Core behaviour**
- The Connections area replaces its "not available yet" message with Closets and port schedules.
- A closet has a name, a stable identifier and a floor location. It groups its actual cabinets, switches, controllers, recorders and power supplies, and adds no cost and no load.
- Renaming or regrouping a closet moves no device and redraws no route.
- Each switch has a port schedule. A port shows label, type, endpoint, cable reference and power.
- Allocation (Free, Reserved, Assigned) and availability (Usable, Unavailable, Unknown) are separate columns.
- A port on another floor can be planned for a camera before a route exists, and shows that the route is missing.
- A port can be reserved with unknown power.
- Current installation and Proposed design assignments are kept separately.
- The inspector's Work tab shows a device's port assignments on each basis, with a link to the port schedule.
- A connection on an Unavailable port keeps its record and shows a warning.
- A controller terminal creates no Ethernet port and no power source, and a device wired to a controller uses no switch port.
- A cable whose end disagrees with its port assignment is shown as a discrepancy on both.

**Refusals and edge cases**
- Assigning a port sets no Installed mark and passes no check.
- A floor that holds a closet cannot be deleted, and the refusal lists the closet.

**Access and restore**
- A revision restore returns proposed port assignments and reservations, and leaves current assignments and port availability unchanged.
- A revision restore leaves closets and their grouping unchanged. (CE-36)

Notes: Left for later: conflicting claims, power and capacity (story 7.5b); ports through removal, restoration and draft deletion (story 7.5c); cable runs in Connections (story 7.6a).

### Story 7.5b: Port claims, power and capacity

As a designer, I want port and power capacity checked from the recorded assignments, so that a port is never claimed twice and unknown loads are never passed off as headroom.

Covers: FR-51 (conflicts, power budgets), FR-19 (ports and power), FR-28 (port or power connection changed), FR-42 (port assignments). Screens: S-12.

**Core behaviour**
- When two people claim one port, the first save succeeds. The other person sees a conflict, with the claim kept as a pending edit and the conflict highlighted on both rows. (CE-37)
- The power summary shows the budget, known allocation, reservations and unknown loads.
- With any unknown load the power summary reads Incomplete, with the count, and never shows a pass.
- With unknown inventory on a switch, the count of available ports is shown as unknown, not as a number.
- An assignment with a known type or power incompatibility shows a warning on the port.
- Port and power capacity estimates use these assignments on the selected basis and list unassigned demand separately.
- A recorded change to a device's current port or power connection flags its link and power checks, and the function checks that depend on them, Retest required, linked to the change.

**Refusals and edge cases**
- A change to a proposed port assignment flags no field check.

### Story 7.5c: Ports through removal, restoration and draft deletion

As a designer, I want ports handled deliberately when a device is removed, restored or deleted, so that a port is never freed or taken back by a side effect.

Covers: FR-53 (port dispositions), FR-55 (ports on Delete draft and undo), FR-68 (attention count). Screens: S-12.

**Core behaviour**
- The removal review of story 6.8b also lists the device's port and terminal assignments, each with a disposition: retained and disconnected, reused, removed, or unresolved.
- An unresolved port disposition is flagged Needs connection review and is included in the attention count.
- After a removal the device's demand is gone, and its former port keeps its allocation and is not shown as Free until someone releases or reassigns it. (CE-38)
- Recording the removal of a switch flags its port assignments for review and archives no downstream device.
- Restoring a device under story 6.9a offers its earlier port as a historical choice and does not reinstate it.
- Delete draft on a proposed device with a planned port assignment lists the assignment in its preview and, on confirmation, releases only that device's own reservation. (CE-39)

**Refusals and edge cases**
- Reconnecting a restored device cannot take a port now assigned to another device.
- A device with a Current installation port assignment is not eligible for Delete draft, and the reason is listed.
- A Delete draft sent from a stale view, after someone assigned the device a port, is refused with the reason.
- Undoing a draft deletion or a bulk cleanup does not reclaim a port that has since been assigned to another device, and the undo reports it.

**Access and restore**
- A revision restore leaves port dispositions from removals unchanged.

### Story 7.6a: Cable runs between floors through named risers

As a designer, I want one cable run to cross floors through a named riser, so that each run is drawn where it really goes and counted once.

Covers: FR-9, FR-52 (runs, segments and risers), FR-60 (riser references). Screens: S-12, S-13.

**Core behaviour**
- Connections gains a Cable runs list with one row per physical run.
- A riser is a named point with a stable identifier and from and to floors.
- Several runs can use one riser, and selecting the riser lists them.
- One run keeps one identifier across its ordered floor segments and its riser, and its detail shows both terminations.
- The run appears on each of its floors with a continuation label such as "to Level 2 via Riser R-1", and once in totals.
- Each segment is measured with its own floor's scale. No length between floors is taken from plan coordinates.
- Routes drawn under story 2.9 are converted and labelled horizontal-only until reviewed.

**Refusals and edge cases**
- Drawing or measuring a run sets no Installed mark and passes no check.
- A floor that a riser or a run segment refers to cannot be deleted, and the refusal lists the riser and the runs.

**Access and restore**
- A revision restore returns proposed runs with their segments and risers, and leaves existing runs unchanged. (CE-40)

Notes: Left for later: transition and drop lengths, extras and supply quantities (story 7.6b); run schedules in packages (story 7.7).

### Story 7.6b: The length ledger

As a designer, I want each run's length built up part by part, so that cable quantities are right and I can see where every metre comes from.

Covers: FR-52 (length components, supply quantity, measured length), FR-9 (estimate updates). Screens: S-13.

**Core behaviour**
- Transition and drop lengths are entered with units and marked measured or estimated.
- The PRD's worked example holds: 20 m and 12 m segments, a 6 m transition and 2 m of drops give a route subtotal of 40 m.
- In the same example, 2 m of fixed extras and a selected 10% give a suggested supply of 46 m.
- The ledger shows this as arithmetic, with the percentage applied once and not to the fixed extras.
- An entered zero is accepted as no extra length.
- Moving an endpoint or waypoint updates the estimate and flags a manually entered supply quantity for review.
- A measured installed length is kept beside the estimate with its source, and no allowance is added to it.
- A run that exceeds a stated length limit for its cable type is flagged.

**Refusals and edge cases**
- Removing a required transition value makes the estimate Incomplete, with the known subtotal shown.
- A plan without a valid scale makes the estimate Incomplete.
- No length limit is applied to a cable type that has none recorded.

**Limits and values**
- The application supplies no percentage, floor height or length limit. Each is entered by the project.

**Access and restore**
- A revision restore returns the ledger entries of proposed runs, and leaves measured installed lengths unchanged.

### Story 7.7: Package sheets for the extended model

As a designer, I want packages to carry the closets, ports, inter-floor runs, annotations and camera analysis detail, so that the printed record matches the model.

Covers: FR-33 (remaining contents). Screens: S-37.

**Core behaviour**
- Design and Closeout packages include closet equipment and port schedules, stating the Current or Proposed basis, reservations, power assumptions and unresolved warnings.
- The Closeout package shows port dispositions from removals, with historical endpoints apart from current assignments.
- Floor sheets show inter-floor continuation labels.
- A run schedule lists each run's identifier, terminations, floors and risers, length breakdown, fixed extras, percentage, suggested and selected supply, measured length and completeness.
- Each run is counted once in schedules and totals across sheets and volumes.
- Annotations appear on plan sheets by default with their labels and a legend.
- Analysis sheets mark assessed views, illustrative fisheye previews and unassessed panoramic outputs differently.
- Analysis sheets show a pan/tilt/zoom camera's resting view as counted, and its previews and reach as not counted, each labelled.
- Equipment schedules show each door with its linked components and their own identifiers.

**Refusals and edge cases**
- When annotations are left out, the package says so, and the outstanding-issue summary is still included.
