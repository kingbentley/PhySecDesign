---
title: "Site Studio — Epics and Stories"
status: draft 0.1 for Kevin's review
created: 2026-11-18
inputs: "PRD 1.0 with proposed amendment 1.1; UX design specification 0.2; architecture 1.0"
method: BMAD Create Epics and Stories, followed by hand (the BMAD skills are not installed in the cloud checkout)
---

# Site Studio — Epics and Stories

This document breaks the [PRD](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and early experiments (R-numbers). It adds no requirement.

It is a draft. The epic order, the story boundaries and the acceptance criteria are proposals for Kevin to review. Nothing here has been built.

**Out of date since PRD amendment 1.2 (2026-11-18).** This document was written for link-based access and a Cloudflare-only server. It does not cover FR-66–72 (self-hosting, accounts, administration, activity log, updates), and stories 1.1, 1.2, 3.6 and Epic 7 assume the earlier architecture. Kevin deferred its revision. Use [architecture 2.0, section 14](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for the current build order until it is revised.

## How to read it

- **Seven epics**, each ending in something a person can use and demonstrate. They follow the five delivery slices kept as [input](../../prds/prd-PhySecDesign-2026-11-16/sources/delivery-slices-input.md), with the workspace restructure and the recovery work drawn out as their own epics.
- **Stories** are sized to be built and verified in one sitting. A story depends only on stories before it.
- **Acceptance criteria** say what must be observable. They draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** below apply to every story and are not repeated.

### Standing rules for every story

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
3. Fixed records and stored files are never modified (AD-3, AD-8).
4. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
5. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (AD-15).
6. A story is done when its criteria pass in a browser against the locally run Worker, its automated tests pass, and the existing tests still pass.

## Requirement coverage

Every functional requirement appears in at least one story. Where one is split, the first story listed delivers its base and the later ones complete it.

| Requirement | Stories | Requirement | Stories |
| --- | --- | --- | --- |
| FR-1 | 1.6 | FR-34 | 3.1, 3.9, 7.1–7.4 |
| FR-2 | 1.2, 1.4, 4.2 | FR-35 | 5.8 |
| FR-3 | 1.7 | FR-36 | 5.9 |
| FR-4, FR-5, FR-6 | 1.7 | FR-37 | 5.11 |
| FR-7 | 1.8, 3.2 | FR-38 | 5.10 |
| FR-8 | 1.8, 2.5, 5.4 | FR-39 | 5.1 |
| FR-9 | 1.10, 6.6 | FR-40 | 5.6 |
| FR-10–16 | 1.9 | FR-41 | 4.2, 5.6 |
| FR-17, FR-18 | 3.4 | FR-42 | 1.5, 4.12 |
| FR-19 | 3.5, 6.1, 6.5 | FR-43 | 4.8 |
| FR-20 | 1.11, 4.5 | FR-44 | 4.6 |
| FR-21 | 1.3, 1.12, 4.12 | FR-45 | 5.7 |
| FR-22 | 1.13, 3.1 | FR-46 | 4.9, 5.10 |
| FR-23, FR-24, FR-25 | 3.6 | FR-47 | 3.3 |
| FR-26 | 3.7, 4.2 | FR-48 | 6.1 |
| FR-27 | 4.3 | FR-49 | 6.3 |
| FR-28 | 4.6 | FR-50 | 6.4 |
| FR-29 | 4.4 | FR-51 | 6.5 |
| FR-30 | 4.3, 4.5, 4.7 | FR-52 | 6.6 |
| FR-31 | 4.5, 4.7 | FR-53 | 5.8 |
| FR-32 | 4.11 | FR-54 | 5.9 |
| FR-33 | 3.9, 4.11, 6.7 | FR-55 | 1.12, 3.8 |
| FR-56, FR-57 | 5.4 | FR-60 | 1.6 |
| FR-58 | 5.3 | FR-61 | 3.7 |
| FR-59 | 5.5 | FR-62 | 5.2 |
| FR-63 | 6.2 | FR-64 | 4.10 |
| FR-65 | 5.12 | | |

| Quality requirement | Stories |
| --- | --- |
| NFR-1 Record integrity | 3.1, 5.8, 5.9, 7.2 |
| NFR-2 Shared-save clarity | 1.3, 4.5, 4.12 |
| NFR-3 Browser, field and accessibility | 2.2, 2.3, 4.1, 7.7 |
| NFR-4 Honest analysis and responsiveness | 1.9, 7.6 |
| NFR-5 Demo access boundary | 1.2, 3.6 |
| NFR-6 Consistent deliverables | 3.9, 4.11 |
| SM-1 to SM-5 | 7.5, 7.6, 7.7 |

## Epic 1 — One shared project online

**Outcome.** The existing design tool runs on Cloudflare as one shared project. Two people can open it by link, edit different things at once, see each other's changes within seconds and resolve a clash without losing work.

**Why first.** Issued designs, field evidence, conflict checks and fixed packages all assume a shared server-saved record, and the prototype saves only in the browser.

### Story 1.1 — Run the app on Cloudflare, locally and deployed

As the developer, I want the existing app served by a Cloudflare Worker with a Durable Object, R2 and D1 available, so that all later work has somewhere to run.

Covers: AD-1, AD-15, experiment R7.

- Given the repository, when the local development command runs, then the existing app loads from the locally run Worker with no change in behaviour, and the existing tests still pass.
- Given the Cloudflare Vite plugin and the Vitest integration, when one trivial Durable Object test runs, then it passes inside Cloudflare's runtime. If either does not work with Vite 6.4 and React 19, the fallback in R7 is used and recorded.
- Given a Cloudflare account on the Workers Paid plan, when the deploy command runs, then the app is reachable over HTTPS at a `workers.dev` address.
- The static "Sites" package and its test are left working (K7).

### Story 1.2 — Create a project and open it by an edit link

As Kevin, I want to create a property project and receive a link that opens it, so that I can share one project without accounts.

Covers: FR-2, NFR-5, AD-2, AD-12. Screens: S-01.

- Given the administrator key, when a project is created, then a project room exists and an edit link is returned once.
- Given a valid edit link, when it is opened, then the project loads; the token is sent as a header and never appears in a request path or log.
- Given a link for project A, when it is used against project B, then access is refused.
- Given a revoked or replaced link, when it is used, then access is refused on the next request.
- On first open the user enters a display name, shown as "not verified"; a random session identifier is created separately.
- Only a hash of the token is stored.

### Story 1.3 — Save edits to the shared project and show the save state

As a designer, I want my edits saved to the shared project automatically with a truthful status, so that I know my work is safe.

Covers: FR-21, NFR-2, AD-5. Screens: S-01.

- Given a committed edit, when it is saved, then the item shows Saving, then Saved once the server has acknowledged it, and the saved value survives closing the browser and restarting the service.
- Given a lost connection, when an edit is made, then it shows Unsaved, stays on the page, and the frame status counts it.
- Given a save whose reply was lost, when it is retried with the same operation identifier, then the change is applied once only.
- Drag intermediates are not saved; the completed move is.
- The frame's save status opens a list of pending and conflicting items.

### Story 1.4 — See other people's changes within seconds

As a designer, I want changes saved by someone else to appear without reloading, so that we work from the same picture.

Covers: FR-2, AD-6, AD-7.

- Given two browsers on one project, when one saves a change, then the other shows it within 5 seconds.
- Given a form or drag in progress, when an incoming change affects that item, then the local input is not replaced and the user is told the item was updated.
- Given a tab that regains focus, then it checks for changes at once.
- Each accepted operation is recorded in the change log with actor name, session, time and before and after values.

### Story 1.5 — Resolve a conflict without losing either edit

As a designer, I want a clash on the same item shown side by side, so that I can choose what to keep.

Covers: FR-42. Screens: S-F7 pattern on desktop.

- Given two browsers editing the same camera, when both save, then the first is accepted and the second becomes a visible conflict that keeps its pending values.
- Given a conflict, when it is opened, then the saved value, who saved it and when are shown beside the pending value for each differing field, and the user can keep the saved value or reapply their own per field.
- Given reapplied choices, when saved, then the version is checked again.
- Given two browsers editing different cameras, when both save, then both succeed.
- Nothing is merged silently.

### Story 1.6 — Buildings and floors on the server, with guarded deletion

As a designer, I want buildings and floors kept as separate records, so that each floor's content stays independent and nothing referenced can be deleted by accident.

Covers: FR-1, FR-60. Screens: S-03 left panel.

- Given several floors, when switching between them, then each keeps its own drawing, equipment, routes, obstructions, zones, notes and analysis settings.
- Given a renamed floor, then its identity is unchanged; a new floor with a reused name has a new identity.
- Given an unused draft floor or empty draft building, when deleted, then it is removed and can be undone.
- Given a floor with any device, cable or riser reference, survey record, child floor or historical reference, when deletion is attempted, then it is refused with the blocking records listed.
- Given a deletion request made from a stale view, when new content has been added, then it is refused.

### Story 1.7 — Property lookup and plans stored with their originals

As a designer, I want to find the property and import, align and lock a plan whose original file is kept, so that the drawing can be traced and reused.

Covers: FR-3, FR-4, FR-5, FR-6, AD-3, AD-4, AD-10. Screens: S-03.

- Address and coordinate lookup, street and aerial views and optional Google mapping behave as in the prototype; choosing a result moves the view only.
- Given an image or a PDF page, when imported, then the original file and a preview are uploaded in parts with visible progress, and the plan shows Saved only when both are stored and referenced.
- Given a password-protected PDF, then the password is used in the browser only and is absent from every request, record and backup.
- Given one PDF used for two floors, then it is stored once.
- Position, rotation, scale, opacity, lock and two-point alignment with preview, cancel and undo behave as in the prototype, and moving a plan does not move equipment.
- Given a file over its limit or of an unsupported type, then it is refused with a plain reason and nothing is changed.
- A plan imported by the prototype without its original shows "original not available".

### Story 1.8 — Equipment as individual records, findable across the property

As a designer, I want every device kept as its own record with a stable identity, so that it can be found, located and followed through its life.

Covers: FR-7 (base), FR-8 (base). Screens: S-03, S-08.

- Given two similar devices, then each has its own unchanging identifier and its own label, shown in the plan and the schedule.
- Given the equipment list, when a placed device is chosen, then its floor opens with the device selected.
- Search by identifier, label, name and model returns correct results within 1 second for 600 devices.
- Each device is a separately versioned item.

### Story 1.9 — Coverage, DORI and zones computed off the main thread, with an honest status

As a designer, I want coverage analysis to keep the interface responsive and to say when a result is current, so that I never read a stale number as final.

Covers: FR-10–16, NFR-4, AD-9, experiment R2. Screens: S-05.

- Camera controls, obstructions, combined coverage, analysis boundary, common target height, DORI and zones give the same results as the prototype for the same inputs.
- Given a changed input, then affected results show Updating until the calculation for the current inputs completes, and controls stay usable.
- Given hidden layers, then totals do not change.
- Excluded and unsupported views are listed with the reason.
- The last final summary per floor is saved with a fingerprint of its inputs.
- Experiment R2 is run on the busiest-plan fixture and its timing recorded. A miss is reported with the fallback chosen; it is not hidden by lowering fidelity.

### Story 1.10 — Cable routes on one floor

As a designer, I want to draw and edit routes between devices on a floor, so that cable can be estimated.

Covers: FR-9 (base).

- Routes with waypoints, cable type and length estimate behave as in the prototype and are saved as versioned items with stable run identifiers.
- Given a moved endpoint, then the estimate updates.
- Removing a device no longer deletes its routes silently; the route remains with its end marked for review. Full handling arrives in story 5.8.

### Story 1.11 — Survey notes and photos as separate entries

As a surveyor, I want notes, measurements and photos attached to a device or a point on the floor, so that evidence is kept with its place.

Covers: FR-20 (base). Screens: S-04 Evidence tab.

- Given a note or photo, when added, then it is a separate entry with author name and time, and two people adding to the same device both succeed.
- Given a photo, then its original and a preview are stored, and it shows Saved only after the upload and the entry have both succeeded.
- Given a retried addition, then no duplicate appears.
- Evidence can be reached from the plan and from the device.

### Story 1.12 — Undo my own recent edits, and delete an accidental draft

As a designer, I want to undo my own recent edits and remove a device I placed by mistake, so that slips are cheap to fix.

Covers: FR-21 (undo), FR-55 (Delete draft), AD-7.

- Given my own recent edit, when undone, then a new reversal is recorded and the item returns to its earlier value.
- Given that someone else has since changed the item or something that depends on it, when I undo, then the undo is refused with an explanation and nothing of theirs is changed.
- Given an accidental proposed device with no evidence, when Delete draft is chosen, then it disappears at once with an Undo notice and no confirmation dialog; its identity and history are kept.
- Given a device with evidence, an issue or a connection, then Delete draft is not offered and the reason is available.

### Story 1.13 — Bring in a project saved by the prototype

As Kevin, I want to import a project file exported from the prototype, so that existing work is not lost.

Covers: FR-22 (format migration), AD-14.

- Given a version 1 or version 2 portable project file, when imported, then a new shared project is created with its floors, plans, devices, routes, obstructions, zones, notes, costs and named revisions.
- Given content the new model cannot represent exactly, then it is listed for review, not dropped silently.
- Original drawings that the old file never held are marked "original not available".

## Epic 2 — A workspace that holds the whole job

**Outcome.** The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure.

This epic can proceed alongside Epic 1 once story 1.1 is done.

### Story 2.1 — Project frame and eight areas

As any user, I want to see which property, scope and reference I am working in and to move between areas, so that I always know where I am.

Covers: UX 5.1, 5.2, decision D1. Screens: S-01, S-02.

- The frame shows property, work scope and state, issued design, view switch, save status, display name and Share. Items whose features do not exist yet show a neutral "Not issued" or are omitted, not faked.
- Overview, Plan, Equipment, Connections, Costs and capacity, Field work, Issues and Records are routes loaded on demand; a direct address or reload opens the same area.
- Existing dialogs for equipment, materials, capacity, revisions and review become pages.

### Story 2.2 — Status language components

As any user, I want every status drawn the same way everywhere, so that I can read the state of things at a glance.

Covers: UX section 6, NFR-3.

- One component renders each family in the status reference with label and shape; no status depends on colour alone.
- A total that depends on unknown inputs renders as Incomplete with a count and a link.
- Device markers show lifecycle by outline (dashed or solid) and condition by glyph.

### Story 2.3 — Readable text, contrast, targets and focus

As any user, I want text I can read and controls I can hit, so that long sessions and field use are comfortable.

Covers: NFR-3, UX section 10, audit findings A2, A3, A5, A6.

- No text is smaller than 12 px on desktop; body text is 14 px.
- All text meets 4.5:1 contrast and all markers, icons and focus rings meet 3:1, measured and recorded.
- Every interactive element shows a visible focus ring and can be reached by keyboard.
- Forms remain usable at 200% zoom with no horizontal scrolling.

### Story 2.4 — Plan workspace regrouped

As a designer, I want grouped tools and a docked analysis summary, so that the map is not covered and tools are easy to find.

Covers: UX 7.1, decision D5, audit findings A7, A8, A9, A12. Screens: S-03.

- The tool dock has six groups, each remembering its last tool.
- The analysis strip replaces the floating card and never overlaps the dock or scale bar.
- Layers are grouped, with the note that hiding a layer does not change totals.
- Plan alignment handles appear only while the plan is unlocked and Alignment is open.

### Story 2.5 — Equipment as a full page

As a designer, I want the schedule as a full table with filters, so that a large property is workable.

Covers: FR-8, audit finding A1. Screens: S-08.

- The table shows 600 devices with a sticky header, search, filters and a column chooser.
- Choosing a row opens the device inspector beside the table; Locate opens its floor.
- Segments for Awaiting placement and Historical are present and empty until their stories arrive.

### Story 2.6 — Device inspector with tabs

As a designer, I want one inspector layout for every device, so that I know where each kind of information is.

Covers: UX 7.2. Screens: S-04.

- The header shows identifier, name, type and state chips.
- Tabs for Details, Optics (cameras), Work, Checks, Evidence and History exist; a tab whose feature is not built yet says so plainly.
- The History tab lists the device's changes from the change log.

## Epic 3 — Design, estimate and issue

**Outcome.** A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package.

### Story 3.1 — Named revisions as fixed snapshots, with compare and restore

Covers: FR-22, FR-34 (snapshots), NFR-1, AD-8. Screens: S-20, S-21.

- Given my pending edits, when I save a named revision, then they are resolved first and the snapshot is taken at one consistent point.
- Given a saved revision, when later edits are made, then the revision's stored file is unchanged, checked by its hash.
- Two revisions can be compared at one scale with a list of changed devices and settings.
- Given a restore, then only design content changes; recorded positions, work, evidence, tests, issues and archive state stay, and items that cannot be restored are listed.
- A restore can be undone and does not delete later revisions.

### Story 3.2 — More equipment types and camera fields

Covers: FR-7.

- Doors, gates, access controllers, locks and strikes, request-to-exit devices, power supplies, recorders and custom equipment can be created.
- Cameras record enclosure type and alarm interface, shown in the schedule; neither creates a connection.
- Existing door-contact records remain contacts.
- Creating a record invents no components, cables or specifications.

### Story 3.3 — Camera-model templates

Covers: FR-47. Screens: S-08 Camera models.

- Templates can be created, edited, duplicated and searched by manufacturer, model and lens.
- A fixed-lens instance cannot be given another focal length; two varifocal instances can hold different settings and give their own results.
- A resolution or mode change uses that mode's pixels and framing.
- Missing optical inputs stay visibly missing.
- Editing a template later does not change placed cameras, fixed revisions or evidence.

### Story 3.4 — Estimate with labour, percentage lines and subsystems

Covers: FR-17, FR-18. Screens: S-14.

- Excluding labour changes the included total and keeps the entered rates.
- A 10% contingency on chosen categories shows its base and amount and follows the base.
- Subsystem subtotals add up to the ungrouped total, and each line sits in one subsystem.
- An unpriced line reads Unpriced and makes the total, and any percentage on it, Incomplete.
- The estimate exports to CSV.
- Retained equipment is not purchased again; that rule is completed in story 5.6.

### Story 3.5 — Capacity estimates

Covers: FR-19 (base). Screens: S-14.

- Storage follows recorded streams, bitrate, recording percentage and retention; bandwidth follows streams sent and is not reduced by the recording percentage.
- Units and overhead assumptions are stated.
- Unassigned demand and unknown specifications are shown and never counted as zero.

### Story 3.6 — Approvers, reviewer links and optional approval

Covers: FR-23, FR-24, FR-25, NFR-5. Screens: S-24, S-22.

- Design and final-acceptance reviewers are assigned per project; the same person or self-approval is allowed.
- A reviewer link opens one fixed revision, allows comments on the plan and one decision, and cannot reach the working project or another project.
- A decision records display name, time and revision; later decisions do not erase earlier ones; a retry does not duplicate.
- Revoking a link keeps its earlier decisions.
- Every approval can be bypassed; bypass is recorded as bypass, with an optional reason.
- This replaces the prototype's development-only review service.

### Story 3.7 — Issue a design and designate the current reference

Covers: FR-26, FR-61. Screens: S-22, S-01.

- Before issuing, the frame shows Not issued.
- Given Revision B made current after A, then A is marked Superseded and its package and decisions stay available.
- Saving or exporting a draft revision does not change the designation.
- B does not inherit A's approval.
- Given two people designating at once, then one succeeds and the other sees a conflict.
- Designating changes nothing recorded on site.

### Story 3.8 — Cancel a proposal and correct a record

Covers: FR-55 (cancellation, correction, mark reversal). Screens: S-04 device menu.

- The device menu offers the one action that applies and a "Why can't I delete this?" explanation.
- An issued camera that will not be installed is cancelled with a reason; its issued representation survives and it leaves proposed totals.
- An unissued proposal that carries evidence can be cancelled with a reason.
- A duplicate is corrected with a reason and a reference to the record kept, without recording a removal.
- A mistaken installed mark on a proposed device is reversed with a reason; evidence stays and is flagged Needs review.
- Cancelled and corrected records are listed under Historical with their reason.

### Story 3.9 — Design package, generated once and kept exactly

Covers: FR-33 (Design preset), FR-34 (fixed packages), NFR-6, AD-11, experiments R1 and R6. Screens: S-21.

- A package is generated from a saved revision, never from live records.
- It identifies property, scope, revision, edition, dates, units, floors included and Draft or Issued status.
- Prices are off by default; a partial floor selection is labelled Partial on every page.
- Each volume and the manifest are uploaded and the edition is listed only when all are stored and verified; a failure is shown and can be retried.
- Downloading again returns the same bytes. Regenerating creates a new edition with its own cutoff.
- Experiment R1 is run at full size and recorded. If it fails, the server-side fallback is brought to Kevin before this story is called done.

## Epic 4 — Install, test and close out in the field

**Outcome.** A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package.

### Story 4.1 — Field shell on phones and tablets

Covers: NFR-3, UX 8.1, 8.2, decisions D3 and D4. Screens: S-F1, S-F2.

- On a phone the app opens the field shell: one top row, bottom navigation, no drafting tools.
- A laptop or tablet can switch between the field shell and the desktop workspace.
- A device can be found by search, by filtered list or by tapping its 44 px marker; a tap near several devices opens a chooser.
- Opening a device from search does not require loading the whole property.
- Experiment R4 is started here: opening and searching on a real iPhone and Android phone over a throttled connection.

### Story 4.2 — Installation view, current installation and the issued reference

Covers: FR-2 (views), FR-26, FR-41 (base), UX 5.3, decision D2. Screens: S-F3, S-03.

- The view switch offers Design and Installation and grants nothing.
- The basis control is always visible and labelled on the map and on each schedule and result.
- The device sheet states what to do in a sentence and shows requirements from the current issued design.
- "Compare with issued" shows issued and recorded values side by side where they differ; on the map the issued position appears as a ghost outline.

### Story 4.3 — Record work done and changes found on site

Covers: FR-27, FR-30 (work recorded). Screens: S-F4, S-F5.

- Installed and Configured are separate marks, each recorded with name and time, and neither completes a phase.
- A moved camera is saved at once as the actual position, with before and after values, actor, time and a short reason.
- Placement and moves on a touch screen use the crosshair and nudge buttons; dragging is not required (decision D6).
- Routine checklist entries and photos need no change reason.

### Story 4.4 — Checklists and starters

Covers: FR-29. Screens: S-16.

- A common checklist, device-type starters and a generic fallback exist, grouped as Installation, Configuration and Testing.
- A project can change applicability, required or optional status, expected results and evidence requirements.
- A check with no expected result shows Needs definition and cannot be passed.
- Changing a template keeps earlier wording, expected results and attempts.
- The optional camera checks are available and off by default.

### Story 4.5 — Record outcomes, attempts and evidence

Covers: FR-30, FR-31, FR-20, NFR-2. Screens: S-F4.

- Outcomes are Pass, Fail, Not tested and Not applicable. Fail needs a short explanation; Not applicable needs a reason and is counted separately.
- A measured check needs value, unit and conditions before Pass is available.
- Each attempt is a new entry; a passing retest keeps the earlier failure and its evidence.
- A photo shows Uploading, then Saved or Failed with Retry, and is never shown as saved early.
- "Take photo" opens the camera and "Choose photo" opens the library on iPhone and Android.
- Two people adding attempts or photos to one device both succeed.

### Story 4.6 — Changes flag the checks they affect

Covers: FR-28, FR-44.

- Moving a tested camera keeps the old attempt and flags the relevant current checks as Retest required, linked to the change.
- A cost-only edit, or hiding a layer, flags nothing.
- A shared-equipment change lists known affected devices and states that other effects are uncertain.
- An editor can add affected checks or record why a suggestion is unaffected.
- A further change after a retest reopens the follow-up; undo, restore and bypass never restore a pass.

### Story 4.7 — Phase progress, remaining work and the contradiction warning

Covers: FR-30, FR-31, decision D7. Screens: S-15, S-02.

- Progress shows counts per phase by device and floor; a phase with nothing in scope reads "No checks in scope" and is never shown as complete.
- The remaining-work list holds unfinished work, required checks not tested, failures, required retests and open issues.
- A device marked not installed whose required installation checks have passed shows the neutral contradiction notice; nothing is blocked.

### Story 4.8 — Site checks

Covers: FR-43. Screens: S-16.

- A project or floor checklist covers end-to-end operation and final records, using the same outcomes and history as device checks.
- Passing a sampled site check does not pass untested devices, and device passes do not satisfy a required site check.
- Optional starters cover alarm-to-camera call-up and handover items.

### Story 4.9 — Issues

Covers: FR-46 (records). Screens: S-18.

- An issue has a stable identifier and links to devices, checks and attempts.
- It can be included now, deferred with a reason, or resolved with corrective work and current evidence.
- Resolving keeps the original failure and links the new attempt.
- A mistaken or duplicate issue is corrected with a reason; correction never resolves a real defect.

### Story 4.10 — Reliability period and downtime log

Covers: FR-64. Screens: S-17.

- The check is off by default; the project defines coverage, stages, downtime, durations and targets, and a stage with none shows Needs definition.
- The PRD's worked example holds: a one-hour stage with a 99% target and one counted three-minute outage shows 95% and Fail; a restarted clean run passes; both attempts are kept.
- An uncounted entry stays visible and does not change availability.
- A covered camera moved during a run flags the check without stopping the run.
- A run stopped for a reason other than failure is kept with no outcome.
- Availability is computed, never entered.

### Story 4.11 — Close out, with a Closeout package

Covers: FR-32, FR-33 (Closeout preset), NFR-6. Screens: S-23, S-21.

- Completed is available only when nothing is outstanding; otherwise it is disabled with the reasons.
- Closed with outstanding items needs a short note and keeps the remaining-work list.
- Missing approval does not prevent closing, and bypass does not satisfy a required test.
- The outstanding list is rechecked at the moment of closing, and the closeout record is one consistent snapshot.
- The Closeout package shows recorded installation, changes from the issued design, attempts, photos, outstanding issues and approvals or bypasses, including when only some floors are chosen.

### Story 4.12 — Lost connection and conflicts on a phone

Covers: FR-21, FR-42, NFR-2. Screens: S-F7.

- With no connection, a banner explains that entries are kept on this page and each unsaved entry is marked.
- On reconnection the app checks current state before retrying and never duplicates an entry.
- A conflict opens the per-field comparison sized for a phone.
- A save into an archived project or onto a removed device is refused for review.

## Epic 5 — Existing sites and return visits

**Outcome.** An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact.

### Story 5.1 — Existing equipment, condition, provenance and the surveyed baseline

Covers: FR-39, device state model.

- A device has lifecycle (Proposed, Existing, Removed) and, while Existing, a condition that starts as Unknown.
- Each value can carry provenance: imported, old document, estimate or site-confirmed.
- A camera with unknown model or installation date can be recorded without inventing either; recording it today does not set its installation date.
- A surveyed baseline can be saved as a fixed revision before planning changes.

### Story 5.2 — Import a CSV or Excel inventory with column mapping

Covers: FR-62, AD-10. Screens: S-09 steps 1 and 2.

- An .xlsx file with a title row imports from the chosen sheet and header row; a CSV with different headings maps to the same fields.
- Suggested mappings can be corrected; unmapped and ignored columns are disclosed.
- Asset ID 00042 stays 00042; an uncertain conversion is flagged.
- Formulas, macros and external links are never run; legacy .xls, macro-enabled and password-protected files fail clearly and change nothing.
- A sample template can be downloaded, and the project's last mapping is offered only when the headings fit.

### Story 5.3 — Review rows, apply, and re-import safely

Covers: FR-58. Screens: S-09 steps 3 and 4.

- Rows are grouped as New, Changed, Unchanged and Needs review, with current and incoming values and their sources.
- Re-uploading the same inventory creates no extra devices.
- Duplicate names or conflicting identifiers go to Needs review; names, addresses and location hints never establish identity alone.
- Site-confirmed values are kept unless deliberately replaced; blank cells erase nothing; missing rows delete nothing; an archived match stays archived.
- A record changed by someone else since the preview comes back as a conflict.
- The result reports imported, skipped, failed, conflicted and unresolved counts.

### Story 5.4 — Awaiting placement, and verifying on site

Covers: FR-56, FR-57, FR-8. Screens: S-08, S-F5, S-F6.

- An imported record with no position sits in Awaiting placement, searchable, with its hints, and has no map marker, no coverage and no test result.
- Its applicable property-level demand is still counted and the omitted coverage is disclosed.
- On a phone, a technician can confirm or correct each value, keeping the source value in view, and place the record with the crosshair; it keeps its identifier and import history.
- Placing does not confirm installation or pass any check.
- A device found on site that was not in the spreadsheet can be added.

### Story 5.5 — Bulk cleanup of mistaken records

Covers: FR-59. Screens: S-10.

- A selection or an import batch can be previewed: how many are eligible, and each blocked record with its reason.
- Site-confirmed, issued, installed, tested or otherwise evidenced records and shared dependencies are blocked.
- Eligibility is rechecked on confirmation; a newly added test invalidates a stale preview.
- The outcome is logged per record and can be undone while dependencies allow.

### Story 5.6 — Planned actions, and Current, Proposed and Changes

Covers: FR-40, FR-41. Screens: S-11, S-04 Work tab.

- A device can be planned as Retain, Relocate, Service, Replace, Remove or Add new; choices that the state model forbids are disabled with the reason.
- A planned replacement leaves the old device in Current installation and shows the new one in Proposed design, without double counting.
- Planning a move does not change the current position.
- A faulty camera is not credited in a current operational coverage estimate.
- Retained equipment and cable are not purchased; relocation and replacement costs are explicit.
- Changes shows relocation arrows, replacement pairs, and cancellations and corrections against the issued design.

### Story 5.7 — Work scope categories

Covers: FR-45. Screens: S-11.

- One active named scope links its revisions, estimate and evidence.
- Devices and routes are Work now, Inspect or test only, or Reference only, preselected from planned actions and adjustable with a reason.
- Reference-only equipment still counts in coverage and capacity and is not recommissioned.
- Moving an item that has a required retest or open issue to Reference only leaves that item outstanding.

### Story 5.8 — Record a removal, archive the device and settle its connections

Covers: FR-35, FR-53, NFR-1. Screens: S-04, S-12.

- Recording an actual removal archives the device with its identity, settings, last location, connections, tests, notes and photos, and takes it out of active plans, totals and demand.
- A planned removal alone archives nothing.
- Its cable keeps its run identifier and history; each end and port gets a disposition, and unresolved is allowed and flagged Needs connection review.
- The former port is not declared free automatically.
- Removing a shared switch flags known connections and does not archive downstream devices.
- All of this is one operation; a stale tab cannot leave a port pointing at a removed device.

### Story 5.9 — Restore the same device, or link a replacement

Covers: FR-36, FR-54, NFR-1.

- Restoring keeps the device's identifier and history and needs a confirmed position on a valid current floor.
- On an unchanged or renamed floor the former position is offered for confirmation; on a replaced drawing the position must be reviewed.
- A deleted floor is not recreated, and a new floor with the same name is not treated as the original.
- Cancelling leaves the device archived.
- Earlier cables, ports and passes are not reinstated automatically; reconnection is explicit and cannot take a port now used by another device.
- A different physical replacement has a new linked identifier.

### Story 5.10 — Reopen for later work, carrying issues forward

Covers: FR-38, FR-46 (carryover). Screens: S-20, S-18.

- Reopening creates a new scope and working revision from the latest installation, with a fresh estimate and checks.
- It does not restore removed devices, resolve old issues, inherit approvals or passes, or change earlier closeout packages.
- An unresolved issue carries into the new scope with the same identifier and awaits a disposition.
- A scope finished with a deferred fault closes with outstanding items.

### Story 5.11 — Archive and un-archive a project

Covers: FR-37. Screens: S-20.

- An archived project can be searched, viewed and exported, and cannot be edited.
- Exporting may add a new retained edition without reopening work.
- Un-archiving is explicit and starts no scope.
- A stale tab cannot write into an archived project.

### Story 5.12 — Warranty and service visits

Covers: FR-65. Screens: S-19, S-23 warranty step.

- A scope's installation warranty has term, start date (default the closeout date), provider, note and covered items; a device can also carry a manufacturer warranty.
- Status is shown as of a stated date; equipment with no warranty recorded is Unknown, never Expired.
- With no scope active, Start service visit reopens the project into a service scope with the issue included.
- A visit records reported and visit times, fault, work, parts, time, attendee and under-warranty, the last prefilled with a visible suggestion.
- A visit does not resolve the issue and changes no estimate; a second visit sits beside the first; the original closeout record is unchanged.

## Epic 6 — Extended modelling

**Outcome.** The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors.

### Story 6.1 — Cameras with several views and streams

Covers: FR-48, FR-19 (views and streams).

- A four-head template creates one physical camera with four separately inspectable views, each with its own optics.
- It counts as one device for cost, port and power.
- A fisheye preview is drawn as illustrative, gets no DORI or target credit, and its exclusion is not reported as blindness.
- Displayed crops do not become recorded streams.

### Story 6.2 — Pan/tilt/zoom cameras

Covers: FR-63. Screens: S-06.

- The PRD's worked example holds: the home position alone contributes to coverage and to the entrance zone; the loading dock keeps its shortfall and separately shows that it is reachable on demand.
- Previewing another stored position changes no totals and is labelled as a preview.
- Narrowing a pan limit shrinks the reach; unknown limits show no reach and are disclosed as unassessed.
- Without a home position the camera contributes nothing and is flagged.
- Changing the home position on an installed camera changes counted coverage and flags that position's checks.
- Limits can be edited as numbers as well as by handles.

### Story 6.3 — Doors and gates with linked components

Covers: FR-49. Screens: S-08 Doors and gates.

- Door D-01 links to its reader, contact, lock and controller, each a separate record with its own cost.
- Linking the same controller to D-02 creates no second purchase or demand.
- Removing a link keeps the component and its evidence.
- No cable or port is created by a link.

### Story 6.4 — Site annotations

Covers: FR-50. Screens: S-07.

- Fence lines, entrance markers, arrows, text callouts and two-point dimensions can be drawn, edited, locked, hidden and deleted.
- A fence line blocks no camera view until an obstruction is added; the offer to add one appears once.
- A dimension on a plan without a valid scale reads "Scale unknown".
- Deleting a callout keeps the photo or issue it referenced.
- Hiding markup changes no analysis and does not hide outstanding-work summaries.

### Story 6.5 — Closets and port schedules

Covers: FR-51, FR-19 (ports and power). Screens: S-12.

- A closet groups its actual equipment and adds no cost or load.
- A port shows allocation and availability separately; a port on another floor can be planned before a route exists.
- Two people claiming one port cannot both succeed unnoticed; the conflict is shown on both.
- A faulty connected port keeps its record with a warning.
- Unknown loads make the power check Incomplete, never a pass.
- A controller terminal creates no Ethernet port or power source.

### Story 6.6 — Cable runs between floors and the length ledger

Covers: FR-9, FR-52. Screens: S-13.

- One run keeps one identifier across its floor segments and riser.
- The PRD's worked example holds: 20 m and 12 m segments, a 6 m transition and 2 m of drops give 40 m; 2 m fixed and 10% give 46 m.
- The run appears on two sheets and once in totals.
- A missing component makes the estimate Incomplete with the known subtotal shown.
- A measured installed length is kept beside the estimate without adding allowance again.
- Routes migrated from story 1.10 are labelled as horizontal-only until reviewed.

### Story 6.7 — Package sheets for the extended model

Covers: FR-33 (remaining contents). Screens: S-21.

- Packages include closet and port schedules, inter-floor continuations and length breakdowns, annotations by default, and analysis sheets that distinguish assessed views, illustrative previews, the resting view and reach.
- Each run is counted once across volumes.

## Epic 7 — Recovery and acceptance

**Outcome.** The project is backed up daily and can be restored and moved, and the proof of concept is measured against the PRD's acceptance profile.

Stories 7.1 to 7.4 can start once Epic 3 is done.

### Story 7.1 — Daily backups with a visible status

Covers: FR-34, AD-13.

- A complete backup of each project is made at least daily into a separate bucket, with a manifest of records and file hashes.
- Seven successful daily generations are kept, plus one before any migration.
- The Overview and Records show the latest backup's age and any failure.
- Rotating generations removes nothing from the live project.

### Story 7.2 — Restore into an isolated copy, then switch

Covers: FR-34, NFR-1, experiment R3.

- A restore builds a separate project from a chosen generation and checks identifiers, relationships, file hashes, snapshots, package files and the issued-design history.
- A failed or incomplete restore leaves the working project untouched.
- Switching is a deliberate administrator action; old links stay revoked and new ones are issued.
- The restored project shows its recovery point and the possible loss window.
- Experiment R3 is run at full size and the elapsed time recorded against the 60-minute target.

### Story 7.3 — Portable backup, out and back in

Covers: FR-34, AD-14, experiment R5.

- A complete portable backup can be created as a job and downloaded; creation and transfer are reported separately.
- It contains records, snapshots, files and packages, and no links or passwords.
- Importing it restores a project with the same identifiers, evidence, archived records and package relationships.
- A PDF or CSV is never offered as a backup.
- Experiment R5 is run at full size.

### Story 7.4 — Limits and usage

Covers: acceptance table for files and project content.

- Each file limit and the 8 GiB project budget is enforced on the server.
- Usage is shown, and a warning appears before an operation would exceed a limit.
- Reaching a limit never truncates an export, lowers the quality of a kept original, removes history or loses saved work.

### Story 7.5 — Acceptance fixtures and the workload manifest

Covers: acceptance profile, SM-5.

- A small functional project and a larger one exist: about 10 buildings, 600 devices including 150 cameras, 20 to 30 plans and about 60 cameras on the busiest plan.
- The manifest records plans, boundaries, geometry, zones, cameras against views and streams, connections, evidence volumes, hardware and network.
- Kevin confirms the larger fixture is representative before any benchmark is run.

### Story 7.6 — Measure performance and accuracy

Covers: NFR-4, SM-5.

- Each timed operation in the acceptance table is run in batches of 20, with at least 19 in each batch meeting its target; all results and outliers are kept.
- Optical and DORI references agree within 1% and zone references within 2 percentage points, at sampling no coarser than 1 m.
- Long file jobs are run three times at full size.
- Every miss is reported as a miss. No fixture is simplified to pass.

### Story 7.7 — Walk the journeys on real devices

Covers: NFR-3, SM-1 to SM-4.

- UJ-1 to UJ-4 are completed in the shared project, including the solo path with every approval bypassed.
- The desktop workflow is shown on a Windows laptop in Chrome and Edge; the field tasks on a real iPhone and iPad in Safari and an Android phone in Chrome, with versions recorded.
- Labels, keyboard access, focus, 200% zoom, touch alternatives to dragging and non-colour status are checked and recorded on both fixtures.
- Bypass, not installed, Fail, Not tested, Not applicable, closing with outstanding items and reopening each show a distinct, correct status on screen and in the package.

## Open points for Kevin

1. **Epic order.** Epic 2 (workspace) is placed second and can run beside Epic 1. Epic 6 (extended modelling) comes after return visits. Say if you would rather see pan/tilt/zoom or closets and ports earlier.
2. **Amendment 1.1.** Stories 4.10, 5.12 and 6.2 build FR-63 to FR-65, which have not been through the PRD's finalization review.
3. **Story 3.9 depends on experiment R1.** If generating a full-size package in the browser fails, the choice of fallback returns to you.
4. **No estimates are given.** Sizing belongs to sprint planning, the next BMAD step after an implementation-readiness check of these documents.
