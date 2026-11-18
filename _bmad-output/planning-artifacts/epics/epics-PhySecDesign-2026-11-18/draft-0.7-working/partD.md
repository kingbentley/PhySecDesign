## Epic 5: Install, test and close out in the field

**Outcome.** A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package.

**Depends on.** Epics 1 to 4 complete. From Epic 4: named revisions and the floor-deletion guard (story 4.1), camera-model templates (story 4.3), the estimate (story 4.4), approval assignments (story 4.6), reviewer links (story 4.7), the issued design and its approval state (story 4.8), cancellation, correction and the device menu (story 4.9), and packages (story 4.10). From earlier epics: sessions (story 1.5), the first work scope and the project list (story 2.1), saving and conflicts (story 2.2, story 2.3 and story 2.4), guarded floor deletion (story 2.5), device records with lifecycle, the basis control and the acceptance-size fixture (story 2.7), coverage (story 2.8), routes (story 2.9), notes and photos (story 2.10), Delete draft (story 2.11), the project frame, view switch and Overview (story 3.1), the status language (story 3.2) and the inspector tabs (story 3.6). Nothing later: no criterion in this epic needs a story from Epics 6 to 10.

**Why here.** Field recording needs an issued design to compare against, and Epic 6 (existing sites, removal, reopening) builds on the installed marks, checks and issues defined here.

### Story 5.1a: Field shell and the issued-design chip

As a technician, I want the app on my phone to open in a layout made for site work, with the issued design always in view, so that I can use it with one hand and know which design I am building.

Covers: NFR-3, FR-61 (shown where installers start work), UX 8.1, decisions D3 and D4. Screens: S-F1.

**Core behaviour**
- On a phone, a project opens in the field shell: one top row with the floor switcher, save status and account menu, and bottom navigation with Plan and Equipment.
- Directly under the top row a chip is always visible showing the current issued design's identifier and name, its issue date and the active work scope. It is not inside the account menu.
- Tapping the chip opens the issued design read-only, with no editing controls.
- The opened issued design shows its approval state, as story 4.8 defines it, separately from the word Current.
- When a different design is designated current in another browser, the chip shows the new identifier and date within 5 seconds.
- A phone always gets the field shell. A tablet or laptop gets it by available width and can switch between the field shell and the desktop workspace.
- The field shell has no tools for plan alignment, walls, zones, routes, estimate editing or checklist template editing. Coverage can be shown as a layer.

**Refusals and edge cases**
- When nothing is issued for the active scope the chip reads "Not issued" with the work scope, and tapping it explains that no design has been issued.

**Limits and values**
- The choice between field shell and desktop workspace on a tablet or laptop is remembered in that browser. (CD-01)
- Every control is at least 44 px high, form text is at least 16 px, and every input has a visible label.
- At 200% zoom the top row, the chip, the bottom navigation and every form field can be reached and operated, no label or value is cut off, and no form scrolls sideways. (CD-02)

**Access and restore**
- A Viewer sees a "View only" chip in the field shell.

**Evidence to record**
- The shell, the chip and the opened issued design are checked on a real iPhone in Safari, a real iPad in Safari and a real Android phone in Chrome, with the hardware, system and browser versions recorded.

Notes: The bottom navigation gains Work in story 5.7 and Issues in story 5.9b.

### Story 5.1b: Find a device in the field

As a technician, I want to reach one device quickly by search, by list or by tapping the plan, so that I spend my time on the work and not on the app.

Covers: NFR-3 (equipment lookup), UX 8.2 (Find). Screens: S-F2.

**Core behaviour**
- A device can be found by search on identifier, label, name or model, with recently opened devices listed first.
- A device can be found in a list filtered to the current floor.
- A device can be found by tapping its marker on the plan.
- All three ways open the same device sheet.
- A tap that lands near several devices opens a chooser listing them, and choosing one opens its device sheet.
- Opening a device from a search result requests that device and its floor only, not the other floors' plans or devices.

**Limits and values**
- Markers are at least 44 px.
- On the acceptance-size project, search returns results within 1 second in at least 19 of 20 trials.

**Evidence to record**
- The search timing is recorded as a development measurement; the acceptance run is story 10.2.
- The three ways of finding a device are checked on a real iPhone in Safari, a real iPad in Safari and a real Android phone in Chrome.

Notes: Left to later stories: search by room, once devices carry a room value (story 6.2); the filtered lists "Not installed" (story 5.3a), "Checks outstanding" (story 5.7) and the survey filters (story 6.4).

### Story 5.2: The device sheet and the issued reference

As a technician, I want to see what is recorded on site beside what the issued design requires, so that I know what to do at each device and can see where the site differs.

Covers: FR-2 (views), FR-26, FR-41 (base), FR-61, UX 5.3, decision D2. Screens: S-F3, S-03.

**Core behaviour**
- The device sheet shows identity and lifecycle, then states what to do in one sentence. For a Proposed device the sentence begins "Add new" and gives the type, mounting, height and aim from the current issued design.
- The device sheet lists the device's requirements from the current issued design, not from the working draft.
- "Compare with issued" shows issued and recorded values side by side for each field where they differ.
- "Compare with issued" says "No differences" when there are none.
- In Installation view the map has an issued reference toggle. When on, each device's issued position appears as a ghost outline, with a line to the recorded position where the two differ.
- On desktop, the inspector's Work tab shows the same sentence, requirements and "Compare with issued", in place of its "not available yet" text.

**Refusals and edge cases**
- When nothing is issued for the active scope, the device sheet reads "Not issued — no requirements" and shows no draft values as requirements.
- When nothing is issued, "Compare with issued" and the issued reference toggle are unavailable and say why.
- A device added after the design was issued reads "Not in the issued design" in the comparison. (CD-03)

**Evidence to record**
- On a real iPhone and a real Android phone, the device sheet, the comparison and the issued reference toggle are opened and read.

Notes: Left to later stories: condition on the device sheet (story 6.1); the wording for planned actions other than Add new (story 6.6); the device's connection, closet and port (story 7.5).

### Story 5.3a: Mark work Installed and Configured

As a technician, I want to mark a device installed and configured, so that the project shows what work has actually been done.

Covers: FR-30 (work recorded), FR-26 (work started with nothing issued), FR-55 (Delete draft eligibility), the device state model (work recorded per device per scope). Screens: S-F4, S-04 Work tab.

**Core behaviour**
- In this epic a device is in scope when it is Proposed and not cancelled, or became Existing through an Installed mark recorded in the active scope. A device set to Existing by hand or brought in as Existing is not in scope.
- The device sheet of an in-scope device has two separate marks, Installed and Configured.
- Setting a mark records the account's name, the time and the active scope. A device holds at most one Installed and one Configured mark for each work scope.
- Recording Installed on a Proposed device sets its lifecycle value from story 2.7 to Existing, and it appears in Current installation at its recorded location.
- Configured can be set before Installed. The device then shows a neutral notice that it is marked configured but not installed, and nothing is blocked. (CD-04)
- When the first Installed mark of a scope is recorded while nothing is issued for that scope, the mark is saved at once and the project shows the warning "Work started with no issued design".
- The warning carries a link that takes an Editor to issue a design (story 4.8), and it goes away when a design is issued for the scope.
- The field shell's filtered lists gain "Not installed": the in-scope devices with no Installed mark in the active scope.
- On desktop, the inspector's Work tab shows the two marks with the same behaviour.

**Refusals and edge cases**
- When a second person sets a mark that is already set in the scope, no second entry is created. The first name and time stay, and the second person sees who set it.

**Limits and values**
- The warning is shown on the Overview, beside the frame's issued-design chip and beside the field shell's chip. (CD-05)

**Access and restore**
- A Viewer sees the warning without the link to issue.
- A revision restore leaves Installed and Configured marks unchanged.
- Designating a different current issued design leaves the marks unchanged.
- A device with an Installed or Configured mark is not offered Delete draft.
- A Delete draft sent from a stale view after a mark was set is refused with the reason.

Notes: Left to later stories: reversing a mistaken mark (story 5.3b); the rule that a mark changes no phase count (story 5.7); refusing a mark when no scope is active (story 5.12c); marks on existing devices with a planned action (story 6.6); a planned Remove, which is completed by the recorded removal and not by an Installed mark (story 6.8); marks in a later scope (story 6.10); a service scope, which needs no issued design and shows no warning (story 6.12).

### Story 5.3b: Reverse a mistaken mark

As a technician, I want to take back an Installed or Configured mark I set by mistake, so that the record does not claim work that was not done.

Covers: FR-55 (reversing a mistaken Installed or Configured mark), the device state model. Screens: S-04 device menu.

**Core behaviour**
- The device menu of story 4.9 gains "Reverse installed mark". A mistaken Installed mark is reversed with a required reason.
- After the reversal the device returns to Proposed and leaves Current installation.
- The device's notes, photos and other evidence stay attached.
- The reversal is listed in the device's history with actor, time and reason.
- A Configured mark can be cleared with a required reason, kept in the device's history.

**Refusals and edge cases**
- "Reverse installed mark" is not offered for a device that was Existing before the scope. A request for one is refused by the server and the device's lifecycle is unchanged.
- A reversal based on a stale view of the device is returned as a conflict.

**Access and restore**
- A device whose mark was reversed or cleared is still not offered Delete draft.
- A revision restore leaves reversals unchanged.

Notes: Left to later stories: the Needs review flags a reversal raises (story 5.6a); reversing the mark of a relocated device, which returns it to Existing at its earlier location (story 6.6).

### Story 5.3c: Report a change found on site

As a technician, I want to record where the site differs from the drawing, so that the project shows what is actually there without waiting for anyone's review.

Covers: FR-27, FR-26 (the field record is kept apart from the issued design), FR-33 (settings and identifiers recorded for closeout), UX 8.3, decision D6. Screens: S-F4, S-F5.

**Core behaviour**
- "Report a change" on the device sheet offers Moved, Different equipment, Route changed and Other.
- Each report is saved at once as the recorded condition, with the affected identifiers, before and after values, actor, time and a short required reason.
- A photo can be attached to a report and is optional.
- A moved camera appears at its new position in Current installation as soon as the change is saved, without any review step.
- After a field change, the issued design, its package and its approval or bypass record are unchanged, checked by the revision's hash.
- Placing and moving on a touch screen use a fixed crosshair with "Place here" and four nudge buttons. Dragging is available and is never required.
- The device sheet records the installed unit's serial number, IP address and MAC address. Each reads "Not recorded" while empty, and filling one in asks for no reason. (CD-06)
- Adding a note or photo, or setting a mark, asks for no change reason.
- On desktop, the inspector's Work tab offers "Report a change" with the same four kinds.

**Access and restore**
- A revision restore leaves recorded positions, recorded identifiers and recorded field changes unchanged.
- Restoring a revision saved before a camera was moved in the field leaves its recorded position as it is and lists the camera for review.
- Designating a different current issued design leaves recorded positions and field changes unchanged.

**Evidence to record**
- On a real iPhone and a real Android phone, a camera is moved with the crosshair and the nudge buttons, without dragging.

Notes: Left to later stories: the checks a change flags (story 5.6a); refusing a field change when no scope is active (story 5.12c); a planned relocation (story 6.6); recorded removal (story 6.8); changes to ports and power connections (story 7.5).

### Story 5.4a: Checklists and starters

As a designer, I want editable checklists with starters for each device type, so that technicians know what to check and what result is expected.

Covers: FR-29, FR-42 (checklist definitions). Screens: S-16.

**Core behaviour**
- A new project has a common checklist covering identity and location, mounting, cable labels and connections, intended settings and system associations, and observed function.
- Starters exist for camera (dome or bullet), reader, door contact or motion detector, intercom, switch, and cabinet or light, plus a generic starter.
- A device type with no dedicated starter gets the common checklist and the generic starter.
- Every check belongs to Installation, Configuration or Testing and states its task, its method or conditions, and its expected result, with a value and tolerance where the check is measured.
- The applicable core checks are required by default for each in-scope device (story 5.3a), and stay required after the device is marked Installed.
- A project Editor can change, per check, whether it applies, whether it is required or optional, its expected result, and whether a photo or measurement is required.
- The four optional camera checks (direct sun at sunrise or sunset, bright sources at night, a person at the far end of the view, a person behind or in the shadow of a named obstruction) are listed and off by default.
- A far-end or obstruction check can name the zone, range or obstruction it verifies.
- Each change to a checklist definition is saved as a new version with actor and time, and earlier wording and expected results remain readable.

**Refusals and edge cases**
- A check with no expected result shows Needs definition. Needs definition is shown as a flag, not as an outcome.
- When two Editors change the same check definition, the first save is accepted and the second becomes a conflict.

**Limits and values**
- No starter contains a pass threshold supplied by the application. Values and tolerances are entered by the project.

**Access and restore**
- A revision restore leaves the working checklist definitions unchanged.

Notes: Left to later stories: checklist expectations in revisions and the Design package (story 5.4b); recording results (story 5.5a); what a definition change does to recorded results (story 5.6b); applicability by planned action and scope category (story 6.6 and story 6.7); the pan/tilt/zoom starter (story 7.2).

### Story 5.4b: Checklist expectations in revisions and the Design package

As a designer, I want the Design package to list the checks expected for each planned device, so that the installer receives the acceptance expectations with the drawings.

Covers: FR-33 (Design preset: scoped checklist expectations), FR-29 (earlier wording preserved), FR-34 (packages come from a fixed source). Screens: S-37.

**Core behaviour**
- Saving a named revision records, in its snapshot, the checklist definitions in force at that moment and the checks scoped to each planned device. (CD-07)
- The Design package generated from a revision lists, for each planned device identifier, its scoped checks with task, expected result and required or optional status.
- The checklist pages use the same device identifiers as the equipment schedule.
- Generating the package again after the working definitions have changed lists the same expectations as before.

**Access and restore**
- A revision restore never writes the definitions held in a snapshot back to the working checklists.

### Story 5.5a: Record a check's outcome

As a technician, I want to record Pass, Fail or N/A against each check, with the measurement where one is asked for, so that a result is only as good as what was observed.

Covers: FR-30, FR-29 (Needs definition cannot pass), FR-44 (the criteria tested are recorded with the attempt), NFR-3. Screens: S-F4, S-04 Checks tab.

**Core behaviour**
- On the device sheet, checks are grouped as Installation, Configuration and Testing, each showing its task and expected result.
- A check with no attempt reads Not tested.
- The outcome buttons are Pass, Fail and N/A.
- Fail requires a short explanation.
- N/A requires a reason and is counted separately from passes.
- A measured check asks for value, unit and conditions before Pass is offered.
- Recording an outcome on a device that is still Proposed is allowed.
- On desktop, the inspector's Checks tab shows the same checks and records outcomes, in place of its "not available yet" text.

**Refusals and edge cases**
- A check showing Needs definition offers no Pass.
- A measured value must be a number, in the unit the check defines. Anything else is refused with the reason. (CD-08)
- Where a measured check defines a tolerance and the value is outside it, Pass is not offered. (CD-09)
- An outcome submitted against a definition that changed after the page loaded is not recorded. It is returned to the technician with the new definition beside what they entered. (CD-10)

Notes: Left to later stories: attempts, retests and corrections (story 5.5b); photos as evidence (story 5.5c); refusing a result when no scope is active (story 5.12c).

### Story 5.5b: Attempts, retests and corrections

As a technician, I want each retest kept as a new attempt and each mistake corrected without erasing it, so that the history of what was tested is complete.

Covers: FR-31, FR-30, FR-44 (original attempts preserved), FR-55 (Delete draft eligibility; cancelling a proposal that has attempts), AD-4. Screens: S-F4.

**Core behaviour**
- Each recorded outcome is a new attempt with actor, time, the active scope, the wording and expected result it was recorded against, the actual result and its evidence.
- Earlier attempts are listed beneath the check.
- A passing retest leaves the earlier failure and its evidence in the list.
- After a check's definition changes, earlier attempts still show the wording and expected result they were recorded against.
- An attempt entered by mistake is corrected by a correction note with a required reason. The original entry stays visible, marked corrected, and is no longer counted. (CD-11)
- A correction made by mistake is reversed with a required reason. The attempt is counted again and both entries stay on record. (CD-12)
- A proposed device that was never issued and has a test attempt can be cancelled with a reason under story 4.9, and its attempts stay findable under Historical.

**Refusals and edge cases**
- Two people adding attempts to one device both succeed.
- A retried addition does not create a duplicate attempt.

**Access and restore**
- A revision restore leaves attempts and outcomes unchanged.
- Designating a different current issued design leaves attempts unchanged.
- A device with a test attempt is not offered Delete draft.
- A Delete draft sent from a stale view after an attempt was recorded is refused with the reason.

Notes: Left to later stories: flags raised when a condition or definition changes after a Pass (story 5.6a and story 5.6b); the contradiction notice for an attempt on a Proposed device (story 5.7).

### Story 5.5c: Photos and notes as evidence for a check

As a technician, I want to take a photo for a check and see when it is really saved, so that a result never claims evidence that is not stored.

Covers: FR-31 (photos and required evidence), FR-20 (prompts in the field), NFR-2, NFR-3, NFR-5 (site credentials kept out of notes). Screens: S-F4.

**Core behaviour**
- "Take photo" opens the camera and "Choose photo" opens the library.
- A photo taken from a check is attached to that attempt and shows the Uploading, Saved and Failed states of story 2.10.
- Where a check requires a photo, Pass is offered only once a photo has been attached to the attempt.
- Where a check requires a photo, a Pass recorded while the photo is Uploading or Failed reads "Pass pending evidence" and is not counted as passed until the photo is Saved. (CD-13)
- The field note form offers the optional prompts of story 2.10, and they can be skipped.

**Limits and values**
- Note, explanation and reason fields carry the hint "Do not enter passwords or access codes for the site's systems". (CD-14)

**Access and restore**
- A revision restore leaves photos and notes attached to attempts unchanged.

**Evidence to record**
- Taking a photo and choosing one from the library are checked on a real iPhone in Safari, a real iPad in Safari and a real Android phone in Chrome.

Notes: Left to later stories: counting Pass pending evidence as outstanding (story 5.7 and story 5.12a). The photo size limit, allowed types and resumed uploads are story 2.10's.

### Story 5.5d: Large photos over a poor connection

As a technician, I want a large photo to finish uploading when the signal is weak, so that evidence from a basement or a car park is not lost.

Covers: experiment R4, NFR-2, NFR-3.

**Core behaviour**
- A photo at the size limit, taken on a phone, reaches Saved over a slow connection that drops twice, resuming each time from the last accepted part.

**Limits and values**
- The test photo is 25 MiB, the upload is throttled to 400 kbit/s, and the connection is dropped twice during the upload. (CD-15)

**Evidence to record**
- Experiment R4 is run on a real iPhone and a real Android phone under those conditions.
- The architecture's experiment record states the time taken on each phone, whether resume worked, and the decision on the fallback (smaller parts, or a warning before very large files).

### Story 5.6a: A change on site flags the checks it affects

As a technician, I want a change on site to flag the checks it puts in doubt, so that nothing stays passed for a condition that no longer exists.

Covers: FR-28, FR-44 (follow-up flags), FR-55 (follow-up after a reversed Installed mark).

**Core behaviour**
- Needs review and Retest required are shown as flags beside a check, each linked to the change that caused it, the affected device and a reason.
- A flag is not an outcome, and the earlier attempt keeps its recorded outcome.
- A check flagged Retest required is not counted as passed.
- Moving or re-aiming a tested camera, or changing its height or lens, keeps the old attempt and flags its placement, mounting and image checks Retest required.
- A recorded change of equipment or configuration flags that device's settings and function checks Retest required.
- A recorded route change flags the link checks of the devices at the route's ends Retest required.
- A recorded change to a shared switch or power supply lists the devices whose routes end on it as affected and flags their link and function checks Needs review. (CD-16)
- The same list states that other effects are uncertain and need review.
- After an actual move, coverage and other results on the Current basis are recalculated for the new position.
- Reversing an Installed mark flags the device's Configured mark, its recorded check results and its evidence Needs review, linked to the reversal.
- Changing an obstruction or a zone's coverage target recalculates the analysis and flags Needs review each check that names that zone, range or obstruction. (CD-17)
- Flag chips are shown on the device sheet and in the inspector header.

**Refusals and edge cases**
- A cost-only edit, a note or formatting edit, or hiding a layer flags nothing.
- An edit to the proposed design that changes nothing recorded on site, and nothing a check names, flags nothing.

**Access and restore**
- A revision restore leaves flags unchanged.

Notes: Left to later stories: flags from definition and template changes, and how a flag is cleared (story 5.6b); flags for removed, restored and replaced devices (story 6.8 and story 6.9); flags from port and power-connection changes, and Needs connection review (story 7.5).

### Story 5.6b: Definition changes, added checks and clearing a flag

As a designer, I want a changed expectation to call for a retest and a valid retest to clear it, so that current status always reflects current requirements.

Covers: FR-44, FR-28 (additional affected checks), FR-31 (a definition change rewrites no result), FR-47 (applied template changes).

**Core behaviour**
- Changing a check's expected result after a Pass keeps the attempt and flags the check Retest required.
- Removing the expected result shows Needs definition, and the check is no longer counted as passed. (CD-18)
- Applying a changed camera-model template's values (story 4.3) to an installed, tested camera flags its image checks Retest required, linked to that change.
- An Editor can add further affected checks to a change, with actor, time and reason.
- An Editor can record why a suggested check is unaffected, with actor, time and reason, which removes that flag.
- A new Pass recorded against the current condition clears Retest required and keeps the earlier attempts.
- A further change after that retest raises the flag again.

**Refusals and edge cases**
- Editing a template without applying it flags nothing.
- Making a failed check optional, or changing its expectation, leaves the Fail attempt visible and unchanged.
- Recording "unaffected" does not clear an unresolved Fail on that check.
- Recording "unaffected" does not turn missing evidence into N/A.
- Undoing the change, restoring a revision or bypassing an approval does not clear a flag or restore a pass.

### Story 5.7: Phase progress, remaining work and the contradiction warning

As a designer, I want progress by phase and one list of what remains, so that I can see what stands between the project and closeout.

Covers: FR-30, FR-31, the device state model (work recorded and progress are separate), decision D7. Screens: S-15, S-02.

**Core behaviour**
- The Field work area shows, by floor and by device, counts for Installation, Configuration and Testing, for example "4 of 6 passed · 1 failed · 1 retest".
- A phase is shown complete only when every required applicable check has a current Pass with its required evidence, and no Retest required flag or unresolved Fail remains in that phase.
- N/A results are counted separately.
- An optional check that was not performed does not hold a phase back, and a recorded Fail on an optional check stays visible.
- Setting the Installed or Configured mark changes no check outcome and no phase count, and passing checks does not set a mark.
- The remaining-work list holds, across the property: in-scope devices (story 5.3a) with no Installed mark in the active scope, required checks Not tested, required checks at Pass pending evidence, unresolved failures, and checks flagged Retest required or Needs review.
- Each row of the list opens its device.
- A device with no Installed mark whose required Installation checks have all passed shows a neutral notice saying so and offering the two corrections: mark it Installed, or review the checks. Nothing is blocked.
- A device still Proposed that has a recorded test attempt shows the same kind of notice.
- The Overview shows the remaining-work count and phase progress by floor.
- The field shell's bottom navigation gains Work, opening the remaining-work list, and the filtered lists gain "Checks outstanding".

**Refusals and edge cases**
- A phase with no applicable checks reads "No checks in scope" and is never shown as complete.
- A device set to Existing by hand or brought in as Existing is not listed as lacking an Installed mark.

**Limits and values**
- Progress is shown as counts. No percentage bar is shown.

Notes: Left to later stories: site checks in progress and remaining work (story 5.8); open issues (story 5.9b); a required reliability stage with no current Pass (story 5.11b); scope categories and a planned Remove (story 6.7 and story 6.8).

### Story 5.8: Site checks

As a technician, I want checks that belong to the whole project or a floor, so that end-to-end operation and handover are tested and recorded, not assumed from device results.

Covers: FR-43, FR-60 (a floor with site-check history is not deletable). Screens: S-16.

**Core behaviour**
- A project or floor checklist can be edited and covers end-to-end operation and final records: named devices and events reach the intended systems, scoped recordings can be retrieved, identity, time and location records align, and drawings and evidence reflect the recorded installation.
- Each site check records the endpoints, scope and conditions actually tested.
- Site checks use the same outcomes, attempts, evidence, flags and Needs definition rule as device checks.
- Optional starters cover alarm-to-camera call-up, including whether the view or recording is available quickly enough for the project's purpose, and handover of manuals, training, as-built records and the programming list. They are off until enabled.
- A handover check records that an item was delivered. It accepts no file and asks for no judgement of the item.
- Site checks appear as their own row in progress, not inside any device's counts.

**Refusals and edge cases**
- Passing a sampled site check changes no device's check, and a device with no attempt still reads Not tested.
- A required site check with no attempt stays Not tested and stays in the remaining-work list when every device check has passed.
- A floor that has a floor-level site check with an attempt cannot be deleted, and the refusal lists the check.

**Access and restore**
- A revision restore leaves site-check definitions, attempts and flags unchanged.

Notes: Left to later stories: the reliability period, a site check with its own page (story 5.10a).

### Story 5.9a: Raise and track issues

As a technician, I want to raise an issue against a device or a failed check and track what is done about it, so that a known fault is never lost or quietly closed.

Covers: FR-46 (records and dispositions), FR-55 (Delete draft eligibility). Screens: S-18.

**Core behaviour**
- An issue can be raised from a device sheet, a check or a failed attempt, in the field shell and on desktop. It gets a stable identifier, records the active scope and links to its devices, checks and attempts.
- The Issues area lists issues in place of its "not available yet" text, showing identifier, title, linked devices, status, disposition and age.
- An issue's status is Open or Resolved. Its disposition in the active scope is kept separately: none, Include now or Deferred. A deferred issue is Open.
- Include now lets an Editor select the work, the checks and the estimate lines (story 4.4) added to the active scope for the issue.
- Defer requires a short reason. Owner and due date are optional.
- Resolve is available only when a corrective-work entry on the issue (what was done, by whom and when) and a current passing attempt or other current evidence are recorded. (CD-19)
- Resolving keeps the original failure and links the new attempt.
- A resolved or deferred issue can be reopened with a reason, and its history is kept. (CD-20)
- A mistaken or duplicate issue is corrected with a reason, actor and time. A duplicate links to the issue kept, and a corrected issue stays listed with its reason.
- A correction made by mistake is reversed with a reason, and both entries stay on record. (CD-12)
- The issue page shows a timeline of the original failure, attempts, corrections and resolution.

**Refusals and edge cases**
- When two people set a disposition on one issue at the same time, the first is accepted and the second sees a conflict.
- Correcting an issue, making its failed check optional, or changing that check's expectation does not resolve another issue and does not change any attempt's outcome.

**Access and restore**
- A revision restore leaves issues and their dispositions unchanged.
- A device with a linked issue is not offered Delete draft.
- A Delete draft sent from a stale view after an issue was linked is refused with the reason.

Notes: Left to later stories: issues in counts, lists and the Design package (story 5.9b); raising an issue when no scope is active (story 5.12c); carrying unresolved issues into a later scope (story 6.10); service visits on an issue (story 6.12).

### Story 5.9b: Issues in remaining work, counts and the Design package

As a designer, I want open issues to show wherever outstanding work is counted, so that a deferred fault stays in view until it is resolved.

Covers: FR-46 (deferred faults stay visible), FR-33 (Design preset: open issues), FR-68 (project list attention count). Screens: S-28, S-02, S-F2.

**Core behaviour**
- Open issues, deferred ones included, appear in the remaining-work list and in the Overview's count.
- The project list shows, for each project, an attention count: the number of open issues, deferred ones included, plus the checks flagged Needs review, Retest required or Needs definition in the active scope. (CD-21)
- The field shell's bottom navigation gains Issues.
- Saving a named revision records the open issues as they stand at that moment.
- The Design package of story 4.10 lists the issues that were open when its revision was saved, each with its identifier, linked devices and whether it was deferred.

**Refusals and edge cases**
- A resolved or corrected issue is in neither the remaining-work list nor the attention count.

Notes: Left to later stories: cable ends flagged Needs connection review join the attention count (story 6.8 and story 7.5).

### Story 5.10a: Define a reliability period

As a designer, I want to define an optional period of observed operation in stages, so that reliability is tested under terms the project chose.

Covers: FR-64 (definition and stages). Screens: S-17.

**Core behaviour**
- The reliability period is off by default.
- When enabled, the project defines what it covers (selected devices, selected floors or the whole site), its stages, what counts as downtime, and each stage's planned duration and availability target.
- Each stage is required or optional on its own.
- Stages appear with the site checks, not in any device's progress.
- Each change to the definition is recorded with actor and time, and earlier values remain readable.

**Refusals and edge cases**
- A stage with no duration or no target shows Needs definition.

**Limits and values**
- The application supplies no coverage, stage count, downtime definition, duration or target.

**Access and restore**
- A revision restore leaves the reliability definition unchanged.

Notes: Left to later stories: runs (story 5.10b); the downtime log and availability (story 5.11a); outcomes (story 5.11b).

### Story 5.10b: Start, end and stop a run

As a technician, I want to record when each run of a stage starts and ends, and why it stopped if it stopped early, so that the period observed is a matter of record.

Covers: FR-64 (runs and their timing), FR-44 (a change during a run flags the stage). Screens: S-17.

**Core behaviour**
- A person records the start of a run and later its end.
- A run in progress shows elapsed and planned time, has no outcome and is not listed as an attempt.
- Stages can be run in any order.
- Starting a run while required checks, retests or open issues remain in the covered scope, or while an earlier stage has no Pass, shows a warning listing them, and Start remains available.
- Recording an end before the planned duration has elapsed is a stop and asks why: "The system failed to perform", with a required explanation, or "Another reason", with a required reason. The run and its reason are kept. (CD-22)
- A run uses the definition in force when it started. Its covered devices are the Existing devices in the covered selection at that moment. (CD-23)
- Editing the definition or target during a run applies to later runs, and the open run shows a notice that the definition has changed.
- A covered device that is moved, changed or cancelled during a run appears on that run as an entry and flags the stage Needs review, linked to the run. The run is not stopped. (CD-24)
- After such a change a participant records Continue or Restart with a reason.
- Restart ends the current run as stopped for another reason and starts a new run.

**Refusals and edge cases**
- A start or end time can be entered for an earlier moment and cannot be in the future. An end must be later than its start. (CD-25)
- A stage has at most one open run. A second start on that stage is refused, showing who started the open run and when. (CD-26)

**Access and restore**
- A revision restore leaves runs unchanged.

Notes: Left to later stories: a run's outcome, so that until story 5.11b a run can be started, stopped and ended but shows no Pass or Fail; a run still open when the scope is closed (story 5.12b); a recorded removal of a covered device during a run (story 6.8).

### Story 5.11a: Downtime log and availability

As a technician, I want to log outages during a run and have availability worked out from the log, so that the figure is a fact of the record and not an opinion.

Covers: FR-64 (downtime log and availability). Screens: S-17.

**Core behaviour**
- During a run, an outage is logged as its own entry with what was affected, start, end, description and, where it is a fault, a linked issue.
- Each entry records which of the run's covered devices were affected. The default is all of them.
- Entries added by different people all remain.
- Each entry states whether it counts toward availability. An entry that does not count requires a short reason.
- An uncounted entry stays visible and does not change availability.
- An entry with no end reads "continuing". It counts up to the present while the run is open and up to the run's end once it has ended.
- A counted entry counts for its duration multiplied by the share of the run's covered devices it affected.
- Where counted entries overlap, a device affected by more than one is counted once for the time they overlap. (CD-39)
- Availability is the time not down divided by the run's elapsed time, as a percentage, shown beside the target and the totals of counted and uncounted downtime.
- Availability is marked Provisional while the run is open.

**Refusals and edge cases**
- An entry's end must be later than its start.
- Counted time is limited to the run: the part of an outage before the run's start or after its end is not counted.
- There is no field in which to type availability.

**Limits and values**
- Availability is shown to two decimal places. (CD-27)
- A 60-minute run covering four devices, with one counted 12-minute outage affecting one of them, shows 95.00%.

**Access and restore**
- A revision restore leaves downtime entries unchanged.

### Story 5.11b: The outcome of a run

As a designer, I want each ended run to become a Pass or a Fail by rule, so that a reliability stage cannot be passed by assertion.

Covers: FR-64 (outcomes; required stages in remaining work), FR-44 (a recorded outcome is not rewritten).

**Core behaviour**
- When a run's end is recorded after the full planned duration, it becomes one attempt: Pass if availability, before rounding, is at or above the target, and Fail if it is below. (CD-27)
- A run stopped because the system failed to perform becomes an attempt with outcome Fail and its explanation.
- A run stopped for another reason is kept with its log and reason, has no outcome, is not an attempt, and leaves the stage's outcome as it was.
- A new run after a Fail is a new attempt, and the earlier attempt and its log are kept.
- A required stage that has no current Pass appears in the remaining-work list, whatever the states of its runs.
- Once stage 1 has passed, starting stage 2 no longer lists it in the warning.
- The PRD's worked example holds: a one-hour single stage with a 99% target and one counted three-minute outage, affecting all covered devices and linked to an issue, shows 95% and Fail, and the issue stays open; a restarted run with no downtime passes; both attempts are kept.

**Refusals and edge cases**
- A stage showing Needs definition cannot record a Pass.
- A Fail does not close or resolve a linked issue.
- Changing the definition or target after a run has an outcome does not change that outcome.
- After a run has ended, its entries can be changed only by a correction with a reason, actor and time.
- Such a correction does not rewrite the recorded outcome: the attempt shows the recalculated availability beside the recorded one, and the stage is flagged Needs review. (CD-28)

**Access and restore**
- A revision restore leaves outcomes unchanged.

### Story 5.12a: Choose Completed or Closed with outstanding items

As a designer, I want the app to tell me whether the scope can be closed as Completed and why not, so that the closing state is honest.

Covers: FR-32 (the two closing states), FR-25 (approval never gates closing), FR-46 (deferred faults; unknown details), FR-64 (a required stage at closeout). Screens: S-23.

**Core behaviour**
- Close out starts by showing the remaining-work list for the active scope.
- Completed is available only when nothing is outstanding: no in-scope device without an Installed mark, no required check Not tested or at Pass pending evidence, no unresolved Fail, no required retest, no open issue, and no required reliability stage without a current Pass.
- Otherwise Completed is disabled and lists the reasons.
- Closed with outstanding items is always available and requires a short note. A follow-up owner and due date are optional.
- A scope whose own work is finished but which has a deferred issue can be closed only as Closed with outstanding items.

**Refusals and edge cases**
- A missing design approval or final acceptance disables neither choice.
- A bypassed approval does not count as a passed test or retest.
- A device value that reads Unknown or Not recorded, a check that is not in scope and an optional check not performed do not prevent Completed.

Notes: Left to later stories: writing the closeout record (story 5.12b); the warranty step (story 6.12).

### Story 5.12b: Close the scope and write the closeout record

As a designer, I want closing to write one fixed record of the scope from a single moment, so that what was closed can never be changed or half-captured.

Covers: FR-32 (fixed closeout record), FR-42 (closeout), FR-64 (runs at closeout), FR-55 (cancelled proposals in the closeout), FR-60 (closeout context), NFR-1. Screens: S-23.

**Core behaviour**
- Closing writes one fixed, named closeout record from a single consistent point, holding drawings, schedules, the estimate, evidence, field changes, approvals and bypasses, the remaining-work list as outstanding items, the closing note and every reliability run.
- The record's stored file does not change afterwards, checked by its hash.
- The scope's state changes only when the closeout record is stored and its hash verified.
- After closing, the scope's state reads Completed or Closed with outstanding items in the frame, the field shell chip and the project list.
- A proposal cancelled during the scope appears in the closeout record as a change to the scope, with its reason.

**Refusals and edge cases**
- The outstanding list is rechecked on the server at the moment of closing. If something became outstanding after the page loaded, Completed is refused and the new list is shown.
- Closing is refused while the person closing has Unsaved or Conflict items, and those items are listed.
- A failed write of the closeout record shows Failed with Retry, and the scope stays In progress.
- When two Editors close the scope at the same time, one succeeds and the other sees a conflict. There is one closeout record.
- A required stage's run still open at closing is stopped with the reason "Scope closed", has no outcome, and is listed in the closeout record as outstanding. (CD-29)
- An optional stage's run still open at closing is stopped with the reason "Scope closed" and listed in the record as not completed. It does not make a Completed scope show outstanding items.

**Access and restore**
- A revision restore leaves closeout records unchanged.
- A floor held in a closeout record cannot be deleted, and the refusal lists the record.

Notes: Left to later stories: what is accepted after closing (story 5.12c); final acceptance (story 5.12d); the Closeout package (story 5.12e); removed and replaced equipment and connection context in the record (story 6.8); warranty details and service visits in the record (story 6.12).

### Story 5.12c: A closed scope, and a project with no active scope

As a designer, I want clear rules for what can be recorded after the scope is closed, so that nothing is added to a finished scope by accident and a new fault can still be logged.

Covers: FR-32, FR-42 (stale saves), FR-24 (reviewer links after closing), FR-45 (one active scope), FR-46 (issues outside a scope).

**Core behaviour**
- After a project's only scope is closed, the project has no active scope. The frame and the field shell chip show the closed scope's name and state.
- With no active scope an Editor can raise an issue. It is recorded with no scope.
- With no active scope an Editor can defer, resolve, reopen and correct an issue. Include now is unavailable and says why. (CD-30)
- With no active scope, a design edit, an Installed or Configured mark, a test result and a new revision are each refused with "not saved: no active scope — reopen first".
- Design edits here are changes to buildings, floors, plans, devices, routes, zones, obstructions, analysis settings, checklist and site-check definitions, the reliability definition and the estimate. (CD-31)
- With no active scope, a field change, a note or photo, a run start, a revision restore and a designation are refused in the same way. (CD-32)
- Reading, exporting and generating a Design package remain available with no active scope.

**Refusals and edge cases**
- A save of work, results, photos or issues for the closed scope, sent from a tab that was open before closing, is refused and kept for review as "not saved: scope closed". It is not retried. (CD-38)
- Once a scope is closed, a reviewer link to one of that scope's design revisions opens its revision read-only and accepts no comment or decision. (CD-33)

Notes: Left to later stories: refusing a removal with no active scope (story 6.8); reopening into a new scope (story 6.10); warranty and service-visit records, which stay editable with no active scope, and Start service visit (story 6.12).

### Story 5.12d: Final acceptance of the closeout record

As a client reviewer, I want to review the fixed closeout record and give my decision on it, so that acceptance is on record when it is wanted and never holds up the closing.

Covers: FR-23 and FR-24 (final acceptance of a closeout record), FR-25, FR-69 (attribution). Screens: S-23, S-24.

**Core behaviour**
- The final-acceptance assignee of story 4.6, signed in, opens the fixed closeout record, comments on it and records a decision, Approve or Request changes.
- An Editor can create a reviewer link to the closeout record under the rules of story 4.7, and the named reviewer comments and decides through it.
- An Editor can bypass final acceptance. The bypass is recorded on that closeout record as Bypassed, with the account, the time and an optional reason.
- Decisions, comments and bypasses are separate entries added beside the closeout record. The record's stored file and hash are unchanged by them.
- Final acceptance is recorded after closing, with no active scope needed, and is never a condition of closing. (CD-34)

**Refusals and edge cases**
- A decision or a bypass changes neither the scope's Completed or Closed with outstanding items state nor any outcome.
- A Request changes decision reopens nothing.

**Access and restore**
- A Viewer who is the final-acceptance assignee can comment and decide. Any other Viewer is refused by the server.
- A revision restore leaves final-acceptance decisions, comments and bypasses unchanged.

Notes: Left to later stories: decisions in the Closeout package (story 5.12e); keeping or changing assignments for a later scope (story 6.10).

### Story 5.12e: Closeout package

As a designer, I want a Closeout package generated from the closeout record, so that the client receives what was installed, tested and left open exactly as it was closed.

Covers: FR-33 (Closeout preset), FR-34 (generated from a fixed closeout), FR-64 (runs in the package), FR-69 (unverified name in the package), NFR-6. Screens: S-37.

**Core behaviour**
- The Closeout package is generated from the closeout record, with the final-acceptance entries recorded up to the package's cutoff, and never from live records.
- It is generated, split, verified, retained and downloaded under the rules of the Design package in story 4.10.
- The package shows recorded installation plans and status, changes from the issued design, recorded settings and identifiers, phase summaries, every attempt of the scope with earlier failures and corrections, notes and photos, outstanding issues, and approvals or bypasses as they stood at its cutoff.
- A proposal cancelled during the scope is shown as a change to the scope, with its reason.
- For each reliability run the package shows its dates, planned and actual duration, downtime log with the devices affected, availability, target and outcome.
- A decision made through a reviewer link is printed with its name marked not verified.
- A package generated after a later decision is a new edition with its own cutoff, and the earlier edition is unchanged.
- Before closing, a preview is generated from a fixed preview record written from one consistent point in the same form as the closeout record. (CD-35)
- A preview is labelled "Draft, In progress" on every page and closes nothing.

**Refusals and edge cases**
- Leaving out required photo evidence labels the package "Evidence-limited summary" on every page and names what was omitted.
- A package limited to some floors is labelled Partial and still carries the property-wide closeout state and the full list of outstanding issues.

**Limits and values**
- Photos are two to a page, each captioned with its device or note reference.

Notes: Left to later stories: removed and replaced equipment and connection context (story 6.8); warranty details and service visits (story 6.12); closet, port and inter-floor schedules (story 7.7).

### Story 5.13: Lost connection and conflicts on a phone

As a technician, I want my entries kept when the signal drops and shown clearly when they clash with someone else's, so that I do not lose work or overwrite a colleague's.

Covers: FR-21, FR-42, NFR-2, NFR-3. Screens: S-F7.

**Core behaviour**
- With no connection, a persistent banner reads "Not connected. Your entries are kept on this page until you are back online. Keep this page open."
- Each unsaved mark, outcome, note and photo shows Unsaved.
- A photo taken with no connection stays on the page as Unsaved and uploads when the connection returns.
- An Installed mark set with no connection while nothing is issued is kept and saved on reconnection like any other mark, with no prompt.
- On reconnection the app reads the current state before retrying.
- An entry that had already been saved is not sent again, and no duplicate attempt, note, photo or mark appears.
- A conflict on a device opens a per-field comparison: the saved value, who saved it and when, beside the pending value.
- For each field the technician keeps the saved value or reapplies their own, and the version is checked again on save.
- A change saved by someone else to a device whose form is open is not applied to the form. A notice names who updated it and offers to review.
- If the session ends while a device sheet is open, the sheet asks the technician to sign in again and keeps what was entered on the page.
- After the same account signs in again, the entries kept on the page are saved, and an interrupted photo upload continues under story 2.10's rules.

**Refusals and edge cases**
- A pending entry refused because the technician's access was removed, reduced or deactivated stays visible as "not saved: access changed", can be copied, and is not retried.
- A mark or attempt sent from a stale or reconnecting page onto a device that was cancelled or corrected meanwhile is refused and kept for review as "not saved: device cancelled or corrected". The device is unchanged. (CD-36)

**Limits and values**
- The per-field comparison shows without sideways scrolling on a screen 360 px wide. (CD-37)

**Evidence to record**
- After a reload on a real iPhone and a real Android phone, every entry that showed Saved is still present.

Notes: Left to later stories: refusing a stale save onto a removed device (story 6.8) and into an archived project (story 6.11), both using the comparison built here. A stale save into a closed scope is story 5.12c.
