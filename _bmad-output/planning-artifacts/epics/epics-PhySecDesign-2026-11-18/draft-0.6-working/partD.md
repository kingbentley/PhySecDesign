## Epic 5: Install, test and close out in the field

**Outcome.** A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package.

**Depends on.** Epic 4 complete (named revisions 4.1, approval assignments 4.6, reviewer links 4.7, the issued design 4.8, cancellation and correction 4.9, packages 4.10); from earlier epics, saving and conflicts (2.2 to 2.4), device records with lifecycle and the acceptance-size fixture (2.7), notes and photos (2.10), the project frame (3.1) and the first work scope (2.1). Nothing later: no criterion in this epic needs a story from Epics 6 to 10.

**Why here.** Field recording needs an issued design to compare against, and Epic 6 (existing sites, removal, reopening) builds on the installed marks, checks and issues defined here.

### Story 5.1: Field shell on phones and tablets

As a technician, I want the app on my phone to open in a layout made for finding one device and recording work, so that I can use it with one hand on site.

Covers: NFR-3, FR-61 (shown where installers start work), UX 8.1, 8.2, decisions D3 and D4. Screens: S-F1, S-F2.

- On a real iPhone in Safari and a real Android phone in Chrome, a project opens in the field shell: one top row with the floor switcher, save status and account menu, and bottom navigation with Plan and Equipment.
- Directly under the top row a chip is always visible showing the current issued design's identifier and name, its issue date and the active work scope. It is not inside the account menu. Tapping it opens the issued design read-only.
- When nothing is issued for the active scope the chip reads "Not issued" with the work scope, and tapping it explains that no design has been issued.
- The opened issued design shows its approval state (Approved, Bypassed or Awaiting decision) separately from the word Current, and has no editing controls.
- When a different design is designated current in another browser, the chip shows the new identifier and date within 5 seconds.
- The field shell has no tools for plan alignment, walls, zones, routes, estimate editing or checklist template editing. Coverage can be shown as a layer.
- A phone always gets the field shell. A tablet or laptop gets it by available width and can switch between the field shell and the desktop workspace; the choice is remembered in that browser.
- A device can be found by search on identifier, label, name, room or model, with recently opened devices listed first; by a list filtered to the current floor; or by tapping its marker.
- Markers are at least 44 px. A tap that lands near several devices opens a chooser listing them, and choosing one opens its device sheet.
- All three ways of finding a device open the same device sheet.
- On the acceptance-size project, search returns results within 1 second, and opening a device from a search result requests that device and its floor only, not the other floors' plans or devices.
- Every control is at least 44 px high, form text is at least 16 px, inputs have visible labels, and the shell remains usable at 200% zoom.
- A Viewer sees a "View only" chip in the field shell.

Notes: Kevin accepted that the issued reference and work scope are shown as a visible chip that opens the issued reference, not inside the account menu (FR-61, UX 8.1 as changed on 2026-11-18). The bottom navigation gains Work in story 5.7 and Issues in story 5.9; the filtered lists gain "Not installed" in 5.3, "Checks outstanding" in 5.7 and the survey filters in Epic 6. Experiment R4 has moved to story 5.5.

### Story 5.2: Installation view, current installation and the issued reference

As a technician, I want to see what is recorded on site beside what the issued design requires, so that I know what to do at each device and can see where the site differs.

Covers: FR-2 (views), FR-26, FR-41 (base), FR-61, UX 5.3, decision D2. Screens: S-F3, S-03.

- The view switch offers Design and Installation. Switching view changes the tools shown and grants nothing: a Viewer in Installation view still cannot change anything, and the server refuses the attempt.
- The basis control of story 2.7 stays a separate control from the view switch. Installation view starts on Current installation and Design view on Proposed design, and either can be changed.
- The device sheet shows identity and lifecycle, then states what to do in one sentence. For a Proposed device the sentence begins "Add new" and gives the type, mounting, height and aim from the current issued design.
- The device sheet lists the device's requirements from the current issued design, not from the working draft.
- "Compare with issued" shows issued and recorded values side by side for each field where they differ, and says "No differences" when there are none.
- In Installation view the map has an issued reference toggle. When on, each device's issued position appears as a ghost outline, with a line to the recorded position where the two differ.
- When nothing is issued for the active scope, the device sheet reads "Not issued — no requirements", shows no draft values as requirements, and "Compare with issued" and the issued reference toggle are unavailable with that reason.
- A device added after the design was issued reads "Not in the issued design" in the comparison.
- On a real iPhone and a real Android phone, the device sheet, the comparison and the issued reference toggle can be opened and read.

Notes: The basis control and its labelling are story 2.7's; the rule that hiding a layer does not change what an analysis counts is in story 6.6, with the Changes basis. Condition on the device sheet arrives with story 6.1. The wording for planned actions other than Add new (Retain, Relocate, Service, Replace, Remove) arrives in story 6.6.

### Story 5.3: Record work done and changes found on site

As a technician, I want to mark work as done and record where the site differs from the drawing, so that the project shows what is actually installed.

Covers: FR-27, FR-30 (work recorded), FR-26, FR-55 (reversing a mistaken Installed mark), the device state model. Screens: S-F4, S-F5.

- Installed and Configured are two separate marks on the device sheet. Setting either records the account's name, the time and the active scope, and neither changes any check outcome or phase count.
- Recording Installed on a Proposed (add-new) device sets its lifecycle value from story 2.7 to Existing; no second field is added. It now appears in Current installation at its recorded location.
- Configured can be set before Installed. The device then shows a neutral notice that it is marked configured but not installed, and nothing is blocked.
- When a second person sets a mark that is already set, no second entry is created; the first name and time stay and the second person sees who set it.
- The device menu of story 4.9 gains "Reverse installed mark". A mistaken Installed mark is reversed with a required reason. The device returns to Proposed and leaves Current installation; its notes, photos and other evidence stay attached, and the reversal is listed in the device's history with actor and time.
- A Configured mark can be cleared with a required reason, kept in the device's history.
- When nothing is issued for the active scope, setting the first Installed or Configured mark opens a one-step prompt to issue the current working design first, with approval bypass offered. Cancelling the prompt leaves the mark unset. Notes and photos are not affected.
- "Report a change" offers Moved, Different equipment, Route changed and Other. Each is saved at once as the recorded condition with the affected identifiers, before and after values, actor, time and a short required reason; a photo is optional.
- A moved camera appears at its new position in Current installation as soon as the change is saved, without any review step.
- After a field change, the issued design, its package and its approval or bypass record are unchanged, checked by the revision's hash.
- Placing and moving on a touch screen use a fixed crosshair with "Place here" and four nudge buttons; dragging is available and is never required (decision D6).
- Adding a note or photo, or setting a mark, asks for no change reason.
- The field shell's filtered lists include "Not installed".
- A revision restore leaves Installed and Configured marks, recorded positions and recorded field changes unchanged. Restoring a revision saved before a camera was moved in the field leaves its recorded position as it is and lists the camera for review.
- A device with an Installed or Configured mark is not offered Delete draft, and a Delete draft sent from a stale view after a mark was set is refused with the reason.
- A Viewer sees the marks and field changes and has no controls to set or report them.

Notes: Flagging the Configured mark, check results and evidence after a reversal or a field change is story 5.6. Story 6.6 introduces the Relocate planned action and must carry the state-model rule that recording installation of a relocated device makes its new recorded location the current one; planned Relocate cannot be chosen before 6.6, so that criterion cannot be tested here. Recorded removal is story 6.8.

### Story 5.4: Checklists and starters

As a designer, I want editable checklists with starters for each device type, so that technicians know what to check and what result is expected.

Covers: FR-29, FR-33 (Design preset: checklist expectations), FR-42 (checklist definitions). Screens: S-16.

- A new project has a common checklist covering identity and location, mounting, cable labels and connections, intended settings and system associations, and observed function.
- Starters exist for camera (dome or bullet), reader, door contact or motion detector, intercom, switch, and cabinet or light, plus a generic starter. A device type with no dedicated starter gets the common checklist and the generic starter.
- Every check belongs to Installation, Configuration or Testing and states its task, its method or conditions, and its expected result, with a value and tolerance where the check is measured.
- The applicable core checks are required by default for each Proposed device of the active scope.
- A project Editor can change, per check, whether it applies, whether it is required or optional, its expected result, and whether a photo or measurement is required.
- A check with no expected result shows Needs definition and offers no Pass. Needs definition is shown as a flag, not as an outcome.
- The four optional camera checks (direct sun at sunrise or sunset, bright sources at night, a person at the far end of the view, a person behind or in the shadow of a named obstruction) are listed and off by default. A far-end or obstruction check can name the zone, range or obstruction it verifies.
- No starter contains a pass threshold supplied by the application; values and tolerances are entered by the project.
- Each change to a checklist definition is saved as a new version with actor and time, and earlier wording and expected results remain readable.
- When two Editors change the same check definition, the first save is accepted and the second becomes a conflict.
- The Design package generated from a revision lists, for each planned device identifier, its scoped checks with task, expected result and required or optional status, using the same device identifiers as the equipment schedule. 
- Saving a named revision records, in its snapshot, the checklist definitions in force at that moment. The Design package uses those, so generating it again after the definitions change lists the same expectations.
- A revision restore leaves the working checklist definitions unchanged; the definitions held in the snapshot are never written back.
- A Viewer can read checklists and cannot change them.

Notes: The pan/tilt/zoom starter (FR-63) belongs to story 7.2. Applicability by planned action and scope category (changed, retained or reference-only equipment) arrives in stories 6.6 and 6.7. What happens to recorded results when a definition changes is in stories 5.5 and 5.6.

### Story 5.5: Record outcomes, attempts and evidence

As a technician, I want to record each check's result with its evidence, and each retest as a new attempt, so that the history of what was tested is kept.

Covers: FR-30, FR-31, FR-20, NFR-2, NFR-3, AD-4, experiment R4. Screens: S-F4.

- On the device sheet, checks are grouped as Installation, Configuration and Testing, each showing its task and expected result. A check with no attempt reads Not tested.
- The outcome buttons are Pass, Fail and N/A. Fail requires a short explanation. N/A requires a reason and is counted separately from passes.
- A measured check asks for value, unit and conditions before Pass is offered. The value must be a number, and the unit is the one the check defines; anything else is refused with the reason.
- Where a measured check defines a tolerance and the value is outside it, Pass is not offered.
- Each attempt is a new entry with actor, time, the active scope, the wording and expected result it was recorded against, the actual result and its evidence. A passing retest leaves the earlier failure and its evidence in the list.
- After a check's definition changes, earlier attempts still show the wording and expected result they were recorded against.
- An attempt submitted against a definition that changed after the page loaded is not recorded; it is returned to the technician with the new definition beside what they entered.
- An attempt entered by mistake is corrected by a correction note with a reason; the original entry stays visible, marked corrected, and is no longer counted.
- "Take photo" opens the camera and "Choose photo" opens the library, on a real iPhone in Safari and a real Android phone in Chrome.
- A photo attached to an attempt follows story 2.10's rules: it shows Uploading, then Saved once the file and its entry are both stored, or Failed with Retry, and is never shown as Saved before that.
- The field note form offers the optional prompts of story 2.10 and they can be skipped.
- Where a check requires a photo, a Pass recorded while the photo is Uploading or Failed reads "Pass pending evidence" and is not counted as passed until the photo is Saved.
- Two people adding attempts, notes or photos to one device both succeed, and a retried addition does not create a duplicate.
- Recording an attempt on a device still Proposed is allowed.
- A revision restore leaves attempts, outcomes, notes and photos unchanged.
- A proposed device that was never issued and has a test attempt can be cancelled with a reason (story 4.9), and its attempts stay findable under Historical.
- A device with a test attempt is not offered Delete draft, and a Delete draft sent from a stale view after an attempt was recorded is refused with the reason.
- A Viewer sees outcomes, attempts and photos and has no recording controls.
- Experiment R4 is run and its result recorded in the architecture's experiment record: a 25 MiB photo uploaded from a real iPhone and a real Android phone over a connection throttled to 400 kbit/s upload with two forced drops. The record states the time taken, whether resume worked, and the decision on the fallback (smaller parts, or a warning before very large files).

Notes: The photo size limit, allowed types, resumed uploads and the prompts themselves are story 2.10's; an upload in progress counts as session use under story 1.5. The contradiction notice for an attempt on a Proposed device is story 5.7. Flags raised when a definition changes after a Pass are story 5.6.

### Story 5.6: Changes flag the checks they affect

As a technician, I want a change on site to flag the checks it puts in doubt, so that nothing stays passed for a condition that no longer exists.

Covers: FR-28, FR-44, FR-47 (applied template changes), FR-55 (follow-up after a reversed Installed mark).

- Needs review and Retest required are shown as flags beside a check, each linked to the change that caused it, the affected device and a reason. They are not outcomes, and the earlier attempt keeps its recorded outcome.
- Moving or re-aiming a tested camera, or changing its height or lens, keeps the old attempt and flags its placement, mounting and image checks Retest required.
- A check flagged Retest required is not counted as passed.
- Applying a changed camera-model template's values (story 4.3) to an installed, tested camera flags its image checks Retest required, linked to that change. Editing the template without applying it flags nothing.
- A recorded change of equipment, configuration, cable, port or power connection flags that device's settings, link and function checks.
- A recorded change to a shared switch or power supply lists the devices known to connect to it as affected, and states that other effects are uncertain and need review.
- A cost-only edit, a note or formatting edit, hiding a layer, or an edit to the proposed design that changes nothing recorded on site flags nothing.
- After an actual move, coverage and other results on the Current basis are recalculated for the new position.
- Reversing an Installed mark flags the device's Configured mark, its recorded check results and its evidence Needs review, linked to the reversal.
- Changing a check's expected result after a Pass keeps the attempt and flags the check Retest required. Removing the expected result shows Needs definition, and the check is no longer counted as passed.
- Making a failed check optional, or changing its expectation, leaves the Fail attempt visible and unchanged.
- An Editor can add further affected checks to a change, or record why a suggested check is unaffected, with actor, time and reason.
- Recording "unaffected" does not clear an unresolved Fail on that check and does not turn missing evidence into N/A.
- A new Pass recorded against the current condition clears Retest required and keeps the earlier attempts.
- A further change after that retest raises the flag again. Undoing the change, restoring a revision or bypassing an approval does not clear a flag or restore a pass.
- A revision restore leaves flags unchanged.

Notes: Flags for restored, replaced and removed devices are added by stories 6.8 and 6.9; connection flags (Needs connection review) by story 7.5.

### Story 5.7: Phase progress, remaining work and the contradiction warning

As a designer, I want progress by phase and one list of what remains, so that I can see what stands between the project and closeout.

Covers: FR-30, FR-31, decision D7. Screens: S-15, S-02.

- Field work shows, by floor and by device, counts for Installation, Configuration and Testing, for example "4 of 6 passed · 1 failed · 1 retest". No percentage bar is shown.
- A phase is shown complete only when every required applicable check has a current Pass with its required evidence, and no Retest required flag or unresolved Fail remains in that phase.
- A phase with no applicable checks reads "No checks in scope" and is never shown as complete. N/A results are counted separately.
- An optional check that was not performed does not hold a phase back; a recorded Fail on an optional check stays visible.
- Setting the Installed or Configured mark changes no phase count, and passing checks does not set a mark.
- The remaining-work list holds, across the property, devices of the active scope not marked Installed, required checks Not tested, unresolved failures and checks flagged Retest required or Needs review. Each row opens its device.
- A device not marked Installed whose required Installation checks have all passed shows a neutral notice saying so and offering the two corrections (mark it Installed, or review the checks). Nothing is blocked.
- A device still Proposed that has a recorded test attempt shows the same kind of notice.
- The Overview shows the active scope's state, the remaining-work count and phase progress by floor.
- The field shell's bottom navigation gains Work, opening the remaining-work list, and the filtered lists gain "Checks outstanding".

Notes: Site checks join progress and remaining work in story 5.8, open and deferred issues in story 5.9, and an unpassed required reliability stage in story 5.11.

### Story 5.8: Site checks

As a technician, I want checks that belong to the whole project or a floor, so that end-to-end operation and handover are tested and recorded, not assumed from device results.

Covers: FR-43. Screens: S-16.

- A project or floor checklist can be edited and covers end-to-end operation and final records: named devices and events reach the intended systems, scoped recordings can be retrieved, identity, time and location records align, and drawings and evidence reflect the recorded installation.
- Each site check records the endpoints, scope and conditions actually tested.
- Site checks use the same outcomes, attempts, evidence, flags and Needs definition rule as device checks.
- Passing a sampled site check changes no device's check, and a device with no attempt still reads Not tested.
- A required site check with no attempt stays Not tested and stays in the remaining-work list when every device check has passed.
- Optional starters cover alarm-to-camera call-up, including whether the view or recording is available quickly enough for the project's purpose, and handover of manuals, training, as-built records and the programming list. They are off until enabled.
- A handover check records that an item was delivered; it accepts no file and asks for no judgement of the item.
- Site checks appear as their own row in progress, not inside any device's counts.

Notes: The reliability period, a site check with its own page, is stories 5.10 and 5.11.

### Story 5.9: Issues

As a technician, I want to raise an issue against a device or a failed check and track what is done about it, so that a known fault is never lost or quietly closed.

Covers: FR-46 (records), FR-33 (Design preset: open issues), FR-55 (Delete draft eligibility), FR-68 (project list attention count). Screens: S-18, S-28.

- An issue can be raised from a device sheet, a check or a failed attempt, in the field shell and on desktop. It gets a stable identifier, records the active scope and links to its devices, checks and attempts.
- The issue list shows identifier, title, linked devices, state (Open, Deferred or Resolved), disposition in the active scope and age.
- Include now lets an Editor select the work and checks added to the active scope for the issue.
- Defer requires a short reason; owner and due date are optional. A deferred issue stays open.
- Resolve is available only when corrective work and a current passing attempt or other current evidence are recorded. Resolving keeps the original failure and links the new attempt.
- A resolved or deferred issue can be reopened with a reason, and its history is kept.
- When two people set a disposition on one issue at the same time, the first is accepted and the second sees a conflict.
- A mistaken or duplicate issue is corrected with a reason, actor and time, and a duplicate links to the issue kept. A corrected issue stays listed with its reason.
- Correcting an issue, making its failed check optional, or changing that check's expectation does not resolve another issue and does not change any attempt's outcome.
- Open and deferred issues appear in the remaining-work list and in the Overview's count.
- The issue page shows a timeline of the original failure, attempts, corrections and resolution.
- The project list shows, for each project, an attention count: the number of open issues plus checks flagged Needs review, Retest required or Needs definition in the active scope.
- The Design package of story 4.10 lists the open and deferred issues as they stood when its revision was saved, each with its identifier and linked devices.
- A device with a linked issue is not offered Delete draft, and a Delete draft sent from a stale view after an issue was linked is refused with the reason.
- The field shell's bottom navigation gains Issues.
- A revision restore leaves issues and their dispositions unchanged.
- A Viewer can read issues and cannot raise or change them.

Notes: Carrying unresolved issues into a later scope is story 6.10. Service visits on an issue are story 6.12. Later record types that add attention indicators (Needs connection review in 7.5) add to the count in their own stories.

### Story 5.10: Define and run a reliability period

As a designer, I want to define an optional period of observed operation and record when each run starts and ends, so that reliability is tested under terms the project chose.

Covers: FR-64 (definition, stages, runs and their timing). Screens: S-17.

- The reliability period is off by default. When enabled, the project defines what it covers (selected devices, selected floors or the whole site), its stages, what counts as downtime, and each stage's planned duration and availability target. The application supplies none of these values.
- Each stage is required or optional on its own and appears with the site checks, not in any device's progress.
- A stage with no duration or no target shows Needs definition.
- A person records the start of a run and later its end. A run in progress shows elapsed and planned time, has no outcome and is not listed as an attempt.
- Start and end times can be entered for an earlier moment and cannot be in the future; an end must be later than its start.
- A stage has at most one open run. A second start on that stage is refused, showing who started the open run and when.
- Stages can be run in any order.
- Starting a run while required checks, retests or open issues remain in the covered scope, or while an earlier stage has not passed, shows a warning listing them, and Start remains available.
- Recording an end before the planned duration has elapsed is a stop and asks why: "The system failed to perform", with a required explanation, or "Another reason", with a required reason. The run and its reason are kept.
- A run uses the definition in force when it started. Editing the definition or target during a run applies to later runs, and the open run shows a notice that the definition has changed.
- A covered device that is moved, changed or cancelled during a run appears on that run as an entry and flags the stage Needs review, linked to the run. The run is not stopped. A participant records Continue or Restart with a reason.
- Restart ends the current run as stopped for another reason and starts a new run.
- A Viewer can read the definition and runs and cannot change them.

Notes: Outcomes, the downtime log and availability are story 5.11; until then a run can be started, stopped and ended but shows no Pass or Fail. A recorded removal of a covered device during a run is story 6.8's to handle, and archiving a project with an open run is story 6.11's.

### Story 5.11: Downtime log and availability

As a technician, I want to log outages during a run and have availability and the outcome worked out from the log, so that the result is a fact of the record and not an opinion.

Covers: FR-64 (downtime log, availability, outcomes).

- During a run, an outage is logged as its own entry with what was affected, start, end, description and, where it is a fault, a linked issue. Entries added by different people all remain.
- Each entry states whether it counts toward availability; an entry that does not count requires a short reason. An uncounted entry stays visible and does not change availability.
- An entry's end must be later than its start. An entry with no end reads "continuing" and counts up to the present while the run is open and up to the run's end once it has ended.
- Counted time is limited to the run: the part of an outage before the run's start or after its end is not counted.
- Overlapping counted entries are counted once for the time they overlap.
- A counted entry counts for its whole duration whether it affected one covered device or all of them.
- Availability is the time not down divided by the run's elapsed time, as a percentage shown to two decimal places, beside the target and the totals of counted and uncounted downtime. It is marked Provisional while the run is open. There is no field in which to type it.
- When a run's end is recorded after the full planned duration, it becomes one attempt: Pass if availability, before rounding, is at or above the target, and Fail if it is below.
- A run stopped because the system failed to perform becomes an attempt with outcome Fail and its explanation.
- A run stopped for another reason is kept with its log and reason, has no outcome, is not an attempt, and leaves the stage's outcome as it was.
- A stage showing Needs definition cannot record a Pass.
- A new run after a Fail is a new attempt; the earlier attempt and its log are kept. A Fail does not close or resolve a linked issue.
- Changing the definition or target after a run has an outcome does not change that outcome.
- After a run has ended, its entries can be changed only by a correction with a reason, actor and time. The recorded outcome is not rewritten: the attempt shows the recalculated availability beside the recorded one, and the stage is flagged Needs review.
- A required stage that is not started, running or failed appears in the remaining-work list.
- Once stage 1 has passed, starting stage 2 no longer lists it in the warning.
- The PRD's worked example holds: a one-hour single stage with a 99% target and one counted three-minute outage linked to an issue shows 95% and Fail, and the issue stays open; a restarted run with no downtime passes; both attempts are kept.
- A revision restore leaves the definition, runs, downtime entries and outcomes unchanged.

### Story 5.12: Close out, with a Closeout package

As a designer, I want to close the active scope as Completed or as Closed with outstanding items and produce a Closeout package, so that the record says honestly what was installed, tested and left open.

Covers: FR-32, FR-33 (Closeout preset), FR-23 and FR-24 (final acceptance of a closeout record), FR-25, FR-42 (closeout), FR-64 (closeout), NFR-6. Screens: S-23, S-37.

- Close out starts by showing the remaining-work list for the active scope.
- Completed is available only when nothing is outstanding: no in-scope device unmarked as installed, no required check Not tested, no unresolved Fail, no required retest, no open or deferred issue. Otherwise it is disabled and lists the reasons.
- Closed with outstanding items requires a short note; a follow-up owner and due date are optional. The remaining-work list is kept in the closeout record.
- A required reliability stage that is not started, running or failed prevents Completed and permits Closed with outstanding items.
- A missing design approval or final acceptance disables neither choice, and a bypassed approval does not count as a passed test or retest.
- The outstanding list is rechecked on the server at the moment of closing. If something became outstanding after the page loaded, Completed is refused and the new list is shown.
- When two Editors close the scope at the same time, one succeeds and the other sees a conflict; there is one closeout record.
- Closing writes one fixed, named closeout record from a single consistent point, holding drawings, schedules, the estimate, evidence, field changes, approvals and bypasses, outstanding items and every reliability run. Its stored file does not change afterwards, checked by its hash.
- A run still open at closing is stopped with the reason "Scope closed", has no outcome, and is listed in the closeout record as outstanding.
- After closing, the scope's state reads Completed or Closed with outstanding items in the frame, the field shell chip and the project list.
- A save of work, results, photos or issues for the closed scope from a tab that was open before closing is refused and kept for review as "not saved: scope closed"; it is not retried.
- An Editor can create a reviewer link to the closeout record under the rules of story 4.7.
- From the moment a scope is closed, reviewer links to its design revisions still open their revision and accept no new comment or decision.
- A proposal cancelled during the scope appears in the closeout record and the Closeout package as a change to the scope, with its reason.
- The final-acceptance assignee (assigned in story 4.6), by account or through a reviewer link, opens the fixed closeout record, comments and records a decision on it. A bypass is recorded as a bypass, with an optional reason. Neither a decision nor a bypass changes the scope's Completed or Closed with outstanding items state, or any outcome.
- A decision made through a reviewer link is labelled as made by a name that is not verified, in the interface and in the Closeout package.
- The Closeout package is generated from the closeout record, never from live records, and is retained and downloaded under the same rules as the Design package of story 4.10.
- The Closeout package shows recorded installation plans and status, changes from the issued design, known settings and identifiers, phase summaries, every attempt of the scope with earlier failures and corrections, notes and photos, outstanding issues, and approvals or bypasses as they stood at its cutoff.
- For each reliability run the package shows its dates, planned and actual duration, downtime log, availability, target and outcome.
- Photos are captioned with their device or note reference, two to a page. Leaving out required photo evidence labels the package "Evidence-limited summary" on every page.
- A package limited to some floors is labelled Partial and still carries the property-wide closeout state and the full list of outstanding issues.
- A package generated before closing is labelled Draft, In progress, and closes nothing.
- A Viewer can download an existing Closeout package and cannot close the scope or create a package.

Notes: Story 6.12 adds the warranty step, warranty details and service visits to the closeout record and package. Story 6.8 adds removed, replaced and unresolved connection context. Stories 7.5 to 7.7 add closet, port and inter-floor schedules. Starting new work after closing is story 6.10. This story is large (closing, final acceptance and the package); if it does not fit one sitting, split the package criteria into a following story when the epics are next renumbered.

### Story 5.13: Lost connection and conflicts on a phone

As a technician, I want my entries kept when the signal drops and shown clearly when they clash with someone else's, so that I do not lose work or overwrite a colleague's.

Covers: FR-21, FR-42, NFR-2, NFR-3. Screens: S-F7.

- With no connection, a persistent banner reads "Not connected. Your entries are kept on this page until you are back online. Keep this page open." Each unsaved mark, outcome, note and photo shows Unsaved.
- A photo taken with no connection stays on the page as Unsaved and uploads when the connection returns.
- On reconnection the app reads the current state before retrying. An entry that had already been saved is not sent again, and no duplicate attempt, note, photo or mark appears.
- A conflict on a device opens a per-field comparison that fits a phone screen: the saved value, who saved it and when, beside the pending value. For each field the technician keeps the saved value or reapplies their own, and the version is checked again on save.
- A change saved by someone else to a device whose form is open is not applied to the form; a notice names who updated it and offers to review.
- If the session ends while a device sheet is open, the sheet asks the technician to sign in again and keeps what was entered on the page.
- A pending entry refused because the technician's access was removed, reduced or deactivated stays visible as "not saved: access changed", can be copied, and is not retried.
- After a reload on a real iPhone and a real Android phone, every entry that showed Saved is still present.

Notes: Refusing a stale save into an archived project is story 6.11's criterion, and refusing one onto a removed device is story 6.8's; both use the comparison built here. A stale save into a closed scope is in story 5.12.
