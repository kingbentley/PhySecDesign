---
title: "Site Studio — Product Requirements"
status: final 1.0 with proposed amendment 1.1
version: "1.1-proposed"
created: 2026-11-16
updated: 2026-11-18
phase: finalized
working_mode: guided
entry_point: vision-and-features
---

# Site Studio — Product Requirements

Site Studio is a web application for physical security professionals to take a property from initial design through installation, commissioning, and later changes. A professional should be able to find a property, align a floor plan, place equipment, analyze coverage, route cables, estimate costs, and share a complete design package. The same project then supports documenting actual installation, configuration, tests, and closeout.

**This is the finalized PRD 1.0 for the proof of concept.** It consolidates Kevin's confirmed decisions and the existing prototype capabilities. Finalization establishes the requirements baseline; implementation, software acceptance and compliance are separate. One continuing project represents a property; later work reopens that project with new named revisions while preserving its history.

**Proposed amendment 1.1 (2026-11-18).** FR-63 to FR-65 and the additions listed under [decision status](#decision-status-and-downstream-work) were confirmed by Kevin in a separate session on 2026-11-18 and are proposed additions to this baseline. They have not been through the finalization review. FR-1–62, NFR-1–6 and SM-1–5 keep their IDs and meaning.

The [source index](source-index.md) distinguishes implementation evidence from product decisions; the [addendum](addendum.md) preserves technical context and limits. Read the [thematic requirements](#functional-requirements), [acceptance criteria](#poc-success-and-acceptance), and [decision status](#decision-status-and-downstream-work) for the confirmed scope and remaining downstream work.

## Users and POC scope

The primary user is a security professional designing and managing a property. An installer or technician records field conditions and performs checks. A client or site owner can review the design and accept the completed site. One person may perform all these roles: separate installer handoff and approvals are optional.

| Area | POC commitment |
| --- | --- |
| Project continuity | One project per property, with buildings/floors, named revisions, fixed issued designs and closeouts, and reopening for later work. |
| Collaboration | Designers and installers share persisted online records with autosave, updates within a few seconds, per-item conflict detection, separate evidence entries, and guarded undo of their own edits. Portable files supplement this workflow. |
| Access | One hosted HTTPS demo; revocable project edit links and separate reviewer links to fixed revisions. Individual accounts are not required; display names are unverified attribution. Use sample or sanitized nonconfidential project data. |
| Existing buildings | Survey and preserve the starting condition, plan retained/changed equipment, compare current/proposed conditions, and document actual work. |
| Field devices | Phones, tablets, and laptops; online access is sufficient. |
| Commissioning | Planning, installation, configuration, testing, and closeout, with editable common/device/site checklists, observed pass criteria and separate phase progress. Design approval and final acceptance remain optional. |
| Approvals | Project-specific assignees; separate people, the same person, or self-approval. Every approval is bypassable. |
| Existing capabilities | Retain map/plan alignment, equipment, routes, coverage/DORI/zones, surveys, estimates, capacity, recovery, revisions, review, and exports. |

The current prototype provides a local design workspace and a limited revision-review service. Shared project editing, the explicit existing-site survey/change workflow, field commissioning, preserved issued designs, lifecycle archives, and continuing-property work are new requirements. Related existing controls do not establish that these workflows are already implemented.

The POC does not require offline capture/synchronization, production identity or enterprise access controls, simultaneous independent jobs within one property, automated hardware configuration or testing, vendor-certified catalogs or pricing, native CAD/BIM editing, full 3D/lighting simulation, or certified engineering calculations. It also excludes risk-assessment records, specifications and bid documents, procurement, personnel management, project scheduling, elevation and detail drawings, service levels and spares, and backup-power design. Production availability, tenancy, and security commitments require later definition.

## End-to-end journeys

These journeys organize the workflow Kevin described; they are not additional customer research or invented personas.

- **UJ-1 — Design and issue.** A security professional creates the property project, finds the site, imports and aligns drawings, imports available equipment inventory or enters it manually, verifies/corrects it and adds discoveries during the survey, records known cable routes, saves a surveyed baseline, plans retained/changed/new equipment, models obstructions and required zones, adjusts coverage, connects equipment, and reviews cost/capacity estimates. They save a named revision, obtain or bypass design approval, and preserve an issued design for installation.
- **UJ-2 — Install and test.** The designer continues or hands the same shared project to an installer. Using a phone, tablet, or laptop online, the technician records installation/configuration progress, notes, photos, actual equipment or route changes, and checklist results. The issued design remains available for comparison; affected calculations and checks are revisited.
- **UJ-3 — Close out honestly.** The team reviews remaining work and evidence, obtains or bypasses final acceptance, and closes the work as Completed or explicitly Closed with outstanding items. The package describes actual installation and remaining issues. A fixed closeout record preserves what was known then.
- **UJ-4 — Return to the property.** Later, the professional opens the same property, consults prior records, and starts a new named working revision from the latest installation. New scope gets its own estimate and checks. Retained equipment, removed-device history, previous closeouts, and unresolved work remain visible.

## Terms and lifecycle rules

| Term | Meaning |
| --- | --- |
| Property project | Continuing record of one property, potentially including multiple buildings and floors. |
| Device | Physical equipment record with a stable ID. A different physical replacement receives a new linked ID. |
| Camera view | Identified optical head/output beneath a camera asset, with its own supported optical profile and direction; not another purchased camera body. |
| Configured stream | A transmitted/recorded output with its own bitrate/settings; its count is independent of physical devices and displayed views. |
| Named revision | Saved version used to recover or compare a design; multiple revisions can belong to the same work scope. |
| Work scope | One active named set of work for the initial or reopened work cycle, with its own estimate and evidence. |
| Surveyed baseline | Fixed named revision of recorded starting conditions, including known uncertainties and source/verification context. |
| Planned action | Intended work (retain, relocate, service/reconfigure, replace, remove, or add), distinct from observed installation and test outcomes. |
| Analysis basis | Explicit Current installation or Proposed design population/settings used by a calculation; display-layer visibility does not select this basis. |
| Issued design | Fixed named revision used as the installation reference, whether approved or bypassed. |
| Working installation | Editable record of current field conditions, distinct from the issued design. |
| Closeout record | Fixed record of a completed or explicitly closed scope, including its evidence and outstanding items. |
| Test attempt | Dated record of a check's wording, expected/actual result, outcome, actor, and evidence. Retesting adds history. |
| Outstanding item | Unfinished in-scope work, an applicable required check not performed, a required follow-up/retest, or a documented unresolved property issue, including deferred/out-of-scope faults. Unknown inventory details and unscoped tests are not automatically faults. |
| Archive | Retained history excluded from normal active work. Archiving a device and archiving a project are separate actions. |
| DORI | Estimated image-detail levels: Detect, Observe, Recognize, and Identify. These are planning estimates, not field-test results. |
| Home position, stored position | A stored position is a named pan, tilt and zoom setting of a pan/tilt/zoom camera. The home position is the stored position where the camera rests; its view, the resting view, is the only one counted in coverage (FR-63). |
| Reach | The area a pan/tilt/zoom camera could view on demand within its limits. Shown separately and never counted as covered (FR-63). |
| Reliability stage, run | A stage is one part of an optional reliability period; a run is one started period of observed operation for a stage, with its downtime log; FR-64 states when a run counts as a test attempt. |
| Service visit | A recorded attendance on an issue, with what was found and done. It never resolves the issue by itself (FR-65). |
| Warranty status | Calculated Not started, In warranty, Expired or Unknown, for information only (FR-65). |
| Security zone | Named floor area with a zone type and an optional coverage target, expressed as a DORI level and qualifying-area percentage. |

Trade terms and their closest equivalents here, for recognition only:

| Trade term | Equivalent in this document |
| --- | --- |
| Punch list | The remaining-work list of outstanding items. |
| As-built drawings | The recorded installation plans in the Closeout package. |
| Site or system acceptance testing | Testing-phase device checks together with site-level checks (FR-29–31/43). |
| Field test | A check a technician performs on site and records as an observation. |
| Commissioning | The installation, configuration and testing phases through closeout. |
| Reliability or operational availability test | The optional reliability period (FR-64). |
| Repair log | The service visits recorded on an issue (FR-65). |

The workflow is planning → installation → configuration → testing → closeout. Work on different devices may be at different points in this workflow; “stage” is reserved for the lifecycle stages of the device state model and the stages of a reliability period. Design approval and final acceptance are optional checkpoints; installation, test outcome, approval, closeout, and archive state must remain distinct.

| Current work state | Meaning |
| --- | --- |
| In progress | Work is underway or has been reopened. |
| Completed | No unfinished in-scope work, applicable unperformed required checks/retests, or documented unresolved property issues remain. |
| Closed with outstanding items | The user explicitly closes the scope with a brief project-level note; remaining items and evidence stay visible. Follow-up owners and due dates are optional. |

The selected scope can show its work finished while documented property issues remain; close that work as Closed with outstanding items. Deferral or exclusion from scope does not resolve a fault.

Archiving pauses editing and retains view/search/export access. Returning an archived project to editing is un-archiving: it is explicit and starts no work by itself. Reopening starts new current work under FR-38 without changing previous closeout records. Approval, bypass, or closure cannot turn a failed or unperformed test into a pass.

### Device state model (proposed 1.1)

This consolidates the device states used across the requirements into one set of product rules and names values the requirements use informally. It adds no workflow of its own: the contradiction warning below is delivered by FR-30 and the record lists by FR-8 and FR-41. Storage and representation belong to architecture. Cable runs, ports and camera views keep their own rules under FR-48 and FR-51–53.

**Stored on the device**

| Axis | Values | Changes when |
| --- | --- | --- |
| Lifecycle | Proposed → Existing → Removed. Restoration returns a Removed device to Existing. | Actual installation, removal or restoration is recorded. A surveyed or imported existing device starts at Existing. |
| Placement | Placed, Awaiting placement | An imported record without a confirmed floor or position waits in the list of FR-57 until it is placed. |
| Condition | Working, Faulty, Unknown | A person records it. It applies while the device is Existing and starts as Unknown. |

“Existing” and “proposed” in FR-7 are these lifecycle stages, not a separate flag. Existing means the record represents equipment on site, whether surveyed, imported or installed under a work scope; Proposed means it is not yet on site. Existing does not by itself mean verified: how each value is known, whether from an old document, an estimate, an imported source or a site-confirmed observation, is recorded as provenance under FR-39 and FR-56 and is not a device state. Recording an actual removal archives the device in the same step, so Removed and archived are one state under FR-35. Restoration records that the device is on site again under FR-36/54; it does not verify the installation, so affected checks are flagged under FR-28/44. A replacement is a new record linked to its predecessor. It starts Proposed and becomes Existing when its installation is recorded, while the predecessor stays Existing until its own removal is recorded.

A Faulty device is not credited as functioning in a current operational estimate under FR-41. Unknown condition is disclosed as an assumption under FR-13. Condition is not changed automatically by a test outcome. Each view of a multi-view camera carries its own condition under FR-48. Where a requirement says a device or view has failed, it means the Faulty condition; port availability has its own values under FR-51.

Three actions end a record instead of advancing it, under FR-55 and FR-59. Delete draft removes an eligible accidental proposed placement from working content and keeps its identity and change history for guarded recovery. Cancellation marks a proposal that will not be installed: an issued or approved one, or an unissued one that is not eligible for Delete draft. Correction marks an erroneous or duplicate record. Cancelled and corrected records are excluded from current totals and calculations and stay listed with their reason under FR-8 and FR-41. A mistaken installed mark is reversed under FR-55, returning the device to Proposed and its work record to not installed.

**Stored per device for each work scope**

| Axis | Values |
| --- | --- |
| Planned action | None, Retain, Relocate, Service/reconfigure, Replace, Remove, Add new |
| Scope category | Work now, Inspect/test only, Reference only |
| Work recorded | Installation done or not done; configuration done or not done |

None means no decision has been recorded for the device in this scope; Retain is an explicit decision to keep it. Work recorded applies to Work now items and is a fact a technician records. Recording installation done advances the lifecycle where the action requires it: an Add new device becomes Existing, a relocated device takes its new recorded location, and a recorded removal makes the device Removed. The planned action then stays on the scope as the record of what was done. Fixed issued designs and closeout records keep the values they captured.

**Derived, never set by hand**

| Roll-up | Derived from |
| --- | --- |
| Installation, Configuration and Testing phase progress | The device’s checks, under FR-31 |
| Attention indicators: follow-up flags (Needs review, Retest required), readiness (Needs definition), Needs connection review, analysis status (Not assessed) and open issues | Its checks, cable ends and port assignments, camera views and linked issues |
| Current installation membership | Existing devices at their recorded locations, leaving out corrected records. A device Awaiting placement is left out of mapped coverage but keeps its applicable property-level demand under FR-57. |
| Proposed design membership | Existing devices without a planned Remove or Replace, a replaced device explicitly intended to remain under FR-41, relocated devices at their planned positions, and Proposed devices that are not cancelled, corrected or deleted |

Work recorded and phase progress are separate. A technician’s installed or configured mark does not complete a phase, and passing checks do not set the mark. Show a warning when they contradict each other, such as all required installation checks passed on a device still marked not installed, or a test attempt recorded against a Proposed device. The warning itself blocks nothing and changes no outcome. Separately, in-scope work still marked not installed is unfinished work under FR-32, so its scope can close only with outstanding items.

**Combinations that cannot be chosen**

These apply when a planned action is chosen. Once the work for an action is recorded, the action remains as history and the resulting lifecycle stage is expected: an Add new device that is now Existing is not a contradiction.

- Retain, Relocate, Service/reconfigure, Replace or Remove for a Proposed device; an unwanted proposed device is deleted or cancelled under FR-55.
- Add new for a device that is already Existing.
- Any new planned action for a Removed, cancelled or corrected device.
- Replace without a linked successor record.
- Work now with a planned action of None or Retain; these take Inspect/test only or Reference only under FR-45.

## Functional requirements

Requirements use stable, globally numbered IDs, retained here in thematic order. Each Check describes observable acceptance behavior, not tests already passed.

All capabilities inherit the record/evidence and revision/backup preservation rules in NFR-1 and FR-34; shared save, conflict, dependency, retry and guarded Undo rules in FR-21/42; and meaningful-change/retest rules in FR-27/28/44. Approvals remain optional under FR-25, and installation/test outcomes require recorded work and evidence under FR-30/31. The local rules and Checks below specify each capability’s additional consequences.

### Property, plans and annotations

**FR-1 — Property, buildings, and floors.** Create and maintain a property project with named buildings/floors. Preserve stable floor identities through renaming; a newly created floor has a distinct identity even when it reuses an earlier name. Keep each floor's drawing, equipment, routes, obstructions, zones, notes, and analysis settings independent. Provide property-wide schedules with floor context. Floor/building deletion is limited to unused drafts under FR-60, preserving dependent records and historical references.

**Check:** Switching floors preserves each floor's content and does not mix its geometry or results with another floor.

**FR-3 — Property lookup and map views.** Search by address or coordinates and use street/open-source mapping and satellite/aerial imagery; support optional configured Google mapping. Preserve geographic placement when switching map styles/providers and disclose provider availability or lookup failures. Provide an OpenStreetMap option without requiring a user-supplied API key. Selecting a lookup result navigates the viewport only; relocating an unlocked drawing is a separate explicit action.

**Check:** The user finds a property, switches to imagery, and retains the aligned plan and device positions.

**FR-4 — Drawing overlays.** Import a floor-plan image over the map and adjust position, rotation, uniform scale, opacity, and lock state. Associate it with the chosen floor. Retain the new source image and a usable preview under FR-34, preserving existing placement controls.

**Check:** A locked, aligned plan remains positioned after floor changes and save/reload; changing opacity reveals the building beneath it. Moving, replacing, or aligning the drawing leaves geographically placed equipment and barriers unchanged.

**FR-5 — Two-point alignment.** Match two plan points to two map points and preview the resulting translation, rotation, and uniform scale before applying. Support cancel and undo; reject degenerate point selections without damaging the prior alignment.

**Check:** Two corresponding building corners align after applying; cancel preserves the prior plan and undo restores it.

**FR-6 — PDF plan import.** Import a PDF, preview/select a page, and place that page as the floor overlay. Process the PDF and its password locally; after successful import retain the source PDF, selected-page preview and source-page identity in the shared project under FR-34. Keep the password local and out of stored records/backups. Reference the same retained original across its selected sheets. Handle password, cancellation, unsupported/invalid file, and rendering failures clearly. Retain the source filename/page identity.

**Check:** A selected page from a multipage PDF can be aligned through FR-4/FR-5 while retaining its source PDF/page association and preview. The password stays local and is absent from saved records/backups. Retained PDF content does not become editable CAD; old records missing originals remain explicitly unavailable.

**FR-50 — Site annotations.** Provide named fence/perimeter lines or polylines, entrance markers and direction arrows, and short text/callouts with optional leader lines. Reuse existing zone polygons for named parking/loading/restricted or other areas, with DORI targets optional. Allow simple two-point dimensions using a known map/plan scale, with units and an explicit plan-derived estimate label; unknown/unverified scale remains visible rather than yielding a precise-looking physical length. Preserve field measurements as distinct survey observations.

Attach each mark to its selected plan/floor, including outdoor site plans, with a stable ID, name/type, geometry and note/reference. Support selection/movement, point/text editing, basic colour/line style, locking, deletion and annotation visibility. Keep labels intelligible without colour alone. Include annotations in selected PDF plan sheets by default and preserve geometry/references in editable backups and named revisions.

An annotation may reference an existing opening/device/survey record without creating another asset or moving the physical record. Deleting or hiding markup does not delete linked records, issues or evidence; earlier fixed revisions remain unchanged and outstanding-work summaries stay visible under the export rules. A dimension is not a routed cable or supply quantity.

Keep drawing intent separate from analytical functions: use explicit wall/obstruction records for visibility blocking, zone settings for DORI targets and cable records for routes/costs. Markup alone does not change coverage boundaries/results, equipment counts or power demand. Visibility is a presentation choice; arrows do not calculate routes or validate an operating sequence. Specialist CAD constraints and symbol libraries are outside this annotation scope.

**Check:** A North perimeter fence line, a vehicle-entrance marker linked to Gate G-01, a named zone and a survey-photo callout remain identifiable after save/undo/reload/export. The line casts no modeled shadow until an explicit obstruction exists. A dimension with no valid scale reports that limitation, and deleting a callout preserves its referenced photo/issue. Hiding markup does not hide required outstanding-work summaries or change analysis.

**FR-60 — Guard floor and building deletion.** Allow deletion only of unused draft floors/buildings with no dependent records or historical references. Determine eligibility from the container's content, relationships and retained history, not merely an empty visible plan or Draft project status. For a building, include its child floors in the dependency check. Check active and archived device references, cable/riser references, plan content, survey evidence and retained revision/issue/closeout context.

When deletion is blocked, identify the dependent records or historical references and retain the container. Do not cascade-delete floors, equipment, connections, notes/photos, issues or historical evidence, or silently relocate them to make the deletion eligible. Existing item-level correction/deletion rules remain available where applicable; clearing the current view does not erase historical dependencies. Broader floor/building retirement and automatic migration are outside this POC rule.

Validate the current container and dependencies together at deletion, retain action history and reject stale requests when new content or references make deletion ineligible. Undo restores the same identity only when context permits. FR-54 handles already-missing/unresolved historical floors; it does not authorize deleting a referenced floor.

**Check:** An unused accidental draft floor or empty draft building can be deleted and safely undone. A device, cable/riser reference, child floor, survey record or retained historical reference blocks deletion with a visible explanation, including references to archived devices. A concurrent placement or new revision reference prevents stale deletion. No dependent record, fixed package or evidence is removed by the container action.

### Shared editing and recovery

**FR-2 — Shared online project.** Provide a hosted HTTPS demo with revocable, replaceable project-specific editing links. Designers and installers use the same persisted project and can switch between Design and Installation views. Enter or select a display name for action history; neither a name nor a view selection grants permissions. The same participant can perform design, field work, and closeout without separate handoff or individual accounts.

**Check:** Saved changes become visible in other connected browsers within a few seconds without file exchange or overwriting unfinished local input. An edit link cannot access unrelated projects, and revoked links are rejected. FR-21/42 define saves and conflicts; timing follows the confirmed acceptance table, while persistence implementation remains architecture work.

**FR-21 — Save and recover edits.** Automatically save completed working edits and display Saving, Saved, Unsaved and Conflict status without hiding pending items. On connection failure, retain pending input while the page stays open and recheck current state before retrying. Support portable backup recovery and undo/redo of the current session’s own recent working edits. Record a reversal as new history and check the affected items: if later edits or dependencies make reversal unsafe, explain the conflict and require review. Do not erase another person’s work, protected evidence, or fixed historical records. Durable offline capture remains outside scope. Complete backups and catastrophic recovery follow FR-34; their recovery-point allowance does not weaken ordinary acknowledged-save durability.

**Check:** A supported edit autosaves and its true save state is visible. A failed request retains unsaved input while the page is open. Undo/redo cannot silently reverse another participant’s later change, and the user can review why a reversal needs attention. Retrying a save does not duplicate an action that already succeeded.

**FR-22 — Named revisions and comparison.** Save named versions, compare layouts at a common scale and inspect changed devices/settings, and restore a prior design into working state without deleting subsequent historical records. Include full revision content in portable project backups and support existing project-format migration. Named snapshots and restoration use a consistent server-saved version and validate the current project state. Resolve the initiating user’s relevant pending/conflicting edits before snapshot creation; other clients’ unsaved work is not represented as included. A full restoration is a deliberate guarded project action, separate from ordinary undo and the per-device restoration in FR-54. Draft deletion/undo preserves snapshots and follows FR-55.

A full restoration restores design content only: proposed devices, planned positions, routes, zones, obstructions, annotations and settings. It never changes recorded facts. Planned actions are design content. Recorded attributes of Existing devices, the stored positions and limits of an installed pan/tilt/zoom camera, recorded actual positions, recorded installation and configuration work, evidence, test attempts, issues, cancellations, corrections and archive state stay as they are. A draft deleted since that revision returns with its original ID where its placement and related records remain valid. Where restored content refers to a device since removed, a floor that no longer exists or a connection since reassigned, leave that item out and list it for review.

**Check:** Restoring a design preserves its drawing/equipment context, remains reversible, and does not rewrite prior issued designs, approvals, test attempts, or closeouts. Restoring a revision saved before a camera was moved in the field, or before it was removed, leaves its recorded position and its removal as they are and lists the affected item for review.

**FR-42 — Concurrent edits and conflict resolution.** Allow independent items to save concurrently. Check the saved version of each edited building, floor/drawing basis, device, closet, port/assignment, cable run/segment, shared riser, zone, annotation, checklist definition, work-scope/current-issued designation or setting before accepting a change. If that item changed since it was loaded, retain the pending edit and show the latest saved values alongside it. Let the user accept the saved version or review/reapply selected intended changes to the latest version; check again when saving. Incoming updates must not overwrite an unfinished local form or drag. Do not silently merge or overwrite same-item conflicts.

Validate connected changes together, including devices/routes, floor contents, archive/restoration, device-draft and floor/building deletion eligibility/dependencies under FR-55/59/60, and closeout. A stale tab must not recreate a removed item, write into an archived project, or leave related records inconsistent. Record boundaries, versioning and transaction mechanisms belong to architecture.

**Check:** Two browsers can save independent camera edits. When both edit one camera, the first accepted save remains and the other becomes a visible, recoverable conflict. Concurrent evidence additions both survive and retries do not duplicate them. A stale save following removal/archive is rejected for review, and dependent changes or fixed snapshots cannot commit a partial mix of versions.

### Inventory, surveys and equipment

**FR-7 — Equipment catalog and identity.** Retain cameras, readers, door contacts, intrusion sensors, intercoms, lights, switches and cabinets. Add generic doors, gates, access controllers/control panels, locks/strikes, request-to-exit devices, low-voltage power supplies, recorders/NVRs and custom equipment records. Maintain unique IDs, type/model, mounting details, location, and notes. For cameras, also record enclosure type and any alarm interface where known, and show them in schedules; neither creates a connection or an integration. Distinguish existing versus proposed equipment and planned actions from installation, testing, and archive states. Preserve legacy asset labels alongside stable internal IDs; see FR-39–41 for existing sites. Support user-defined camera-model selection under FR-47. Keep existing door-contact records distinct from the new door/opening records; linked components follow FR-49. Site annotations follow FR-50 and closets/port assignments follow FR-51; physical inter-floor cable detail follows FR-52.

**Check:** Two similar devices remain individually identifiable in the plan, schedules, evidence, and revision history. Existing door-contact data remains a contact, and creating a door/gate or custom record does not invent installed components, cable connections or known specifications.

**FR-8 — Equipment schedules.** Find and inspect equipment across the property, identify its building/floor, and locate it on the plan. Include imported records awaiting placement under FR-57, clearly distinguished from placed and historical records. Historical records include removed devices and cancelled or corrected records, each searchable with its reason and evidence under FR-35 and FR-55.

**Check:** Selecting a placed device opens the correct floor/location; an unplaced imported device opens its Awaiting placement entry. A removed device is labeled historical rather than counted as active. A cancelled or corrected record is found in the same list with its reason.

**FR-20 — Survey notes and photos.** Attach notes, measurements, installation constraints, and photos to a device or floor location. Offer optional prompts for lighting, shadows, uneven terrain and mount rigidity; the answers are observations and do not feed coverage analysis. Annotations can reference these records without creating a second evidence store. Preserve their context through moves and archival; retain the last recorded location when a device is no longer on the active plan. Retain new original photos alongside usable previews under FR-34; preserve available processed images without fabricating originals missing from older records.

**Check:** The user locates evidence from either the plan or device record; device removal does not erase its notes/photos or silently attach them to a replacement.

**FR-39 — Surveyed starting condition.** Start an existing-building project by placing existing equipment and known cable routes on its plans. Capture available asset labels, model, location, mounting, condition, connections, photos and notes. Keep stable internal IDs and legacy labels. Allow unknown attributes and distinguish old-document information, estimates, and site-confirmed observations. Save a named surveyed-baseline revision before planning changes; later visits begin from the latest installation in the continuing property project.

**Check:** A camera with unknown model or installation date can be inventoried without inventing those details or a test pass. Recording it today does not set its original installation date. Later changes preserve the surveyed baseline, provenance and device identity. Support both manual survey entry and spreadsheet-based equipment intake followed by survey verification/addition under FR-56. Automatic discovery is not required.

**FR-40 — Planned work on existing assets.** Record planned work independently of actual installation, configuration, testing and archive states. Preserve the recorded starting condition until actual work is documented.

| Planned action | Required treatment |
| --- | --- |
| Retain | Same ID/history; no automatic repurchase. Explicitly scoped survey/test labor can be estimated. |
| Relocate | Same ID/history; preserve original location and plan the new position, with applicable labor/new cable. |
| Service/reconfigure | Same ID/history; record intended work/settings, parts/labor allowances and applicable checks. |
| Replace | New proposed device ID linked to its predecessor, with purchase and applicable removal/installation cost. |
| Remove | Planned removal remains visible; archive the old device only after recorded actual removal. |
| Add new | New proposed ID with purchase, installation and testing scope. |

**Check:** Retained equipment and cable do not become purchase quantities merely because they are on the plan. Planning a move or replacement does not overwrite the current location, archive the predecessor, or fabricate completed work. Existing cable reuse and new/changed cable costs stay distinguishable; endpoint/archive changes follow FR-53.

**FR-41 — Current, proposed and changes views.** Offer Current installation, Proposed design and Changes views. Current installation reflects recorded field conditions; Proposed design reflects intended end-state actions; Changes compares them and also lists cancellations and corrections under FR-55 against the current issued design. Label which basis supplies each schedule and analysis result. Include applicable retained assets independently of purchase cost, and count a replacement rather than both devices in the proposed end state unless both are explicitly intended to remain. Visual layer hiding does not change the selected analysis population.

**Check:** A planned replacement leaves the old device in Current installation until actual removal and shows the new device in Proposed design without double-counting. Unknown specifications remain visibly unassessed or explicitly estimated, never silently zero demand or verified coverage. A known failed camera is not credited as functioning in a current operational coverage estimate; a planned repair is separately labeled. Geometry/DORI remains a planning estimate. Actual work updates the field record without modifying fixed survey, issued or closeout revisions.

**FR-49 — Door/gate and component records.** Give a door or gate its own physical opening identity, location and available model/details. Link selected readers, contacts, locks/strikes, request-to-exit devices, intercoms, controllers, power supplies or custom equipment, with side/direction labels where useful. Linked components remain individual physical records with their own IDs, locations, costs, planned actions, installation/configuration/test state, notes/photos and history. A shared controller or power supply can serve several openings without being cloned or charged for each link.

Find the associated records from the opening and identify their relationships in schedules/exports while preserving individual component IDs. Associations express the planned/recorded relationship; they do not automatically create cables, switch ports, hardware quantities, power demand or a fixed component bundle. An explicitly priced door/gate can have its own cost, but component costs must not be counted again as an implicit assembly total. Retained assets and work categories follow the existing scope rules.

Unknown specifications stay unknown or explicitly estimated. Use documented device/connection traits for applicable capacity inputs; a linked reader/contact/lock is not automatically an IP/PoE endpoint. Cataloging a controller, PSU or NVR does not add a wiring simulator, electrical-load calculation or guaranteed recorder-performance model. Explicit closet/port planning follows FR-51.

Editing a link does not remove/archive its component, transfer its evidence or imply installation/test completion. Preserve relationship context; gate/door operating checks use project-defined expected behavior. Apply device and connection lifecycle rules individually under FR-35/36/53–55.

**Check:** Door D-01 links to its reader, contact, lock and controller, with separate records and costs. Linking the same controller to Door D-02 does not create a second controller purchase or device demand. A retained door can receive a proposed new reader without becoming a new door purchase or a passing installation. Removing an association preserves the component and its prior evidence; no physical cable or port is fabricated.

**FR-56 — Import inventory and continue the survey.** Allow an existing equipment spreadsheet to supply initial inventory for the selected property when available; retain manual intake when no spreadsheet exists. Let the surveyor verify, correct and enrich imported device records and add devices discovered on site that were absent from the source. Reuse the same device identities and survey/evidence workflow rather than treating the import and field inventory as unrelated records.

Preserve imported information as source-based inventory under FR-39, with its provenance distinguishable from later site-confirmed observations. Import alone must not establish a verified physical location, actual installation, observed connectivity or passing test. Imported records lacking usable placement use the Awaiting placement list in FR-57. Duplicate/re-import behavior and guarded bulk cleanup follow FR-58/59. Supported file formats and sheet/column mapping follow FR-62.

**Check:** A survey can start from an existing spreadsheet, verify and correct an imported device while retaining its identity/source context, and add an unlisted device. A project without a spreadsheet can still start manually. Imported rows do not automatically become site-confirmed assets or passed checks, and survey corrections retain the earlier source information.

**FR-57 — Import-only Awaiting placement list.** Retain imported equipment lacking a known current floor or confirmed map position in a visible property-level Awaiting placement list. Preserve stable device IDs, import provenance, known building/floor/room hints, notes and unknown values. Do not reject or lose a useful imported record solely because its placement is incomplete, or invent a floor, coordinate, connection or map pin.

During the site survey, let the user find the record, verify/correct its information, add evidence and select a valid current floor/position. Placement completes on the same device ID without creating a second asset or erasing source history. Placement, site verification, installation and test outcomes remain separate; resolving placement does not pass checks or prove a physical installation. New survey discoveries still use the normal add-device workflow. Archival restoration continues to require its destination under FR-54 rather than entering this intake list.

Exclude unplaced geometry from mapped coverage and identify the omitted/unassessed contribution. Apply existing current/proposed, condition, scope and unknown-input rules to counts and estimates: missing placement must not silently erase otherwise applicable property-level demand, invent zero load, duplicate an asset or create a new purchase. Keep unassigned location/connection and unknown specifications visible. Keep the list, source context and placement changes available in relevant schedules/exports; a floor-only view must not hide unresolved property inventory as though complete.

**Check:** An imported camera with a building/room hint but no map position remains searchable in Awaiting placement without a fabricated cone or field-test Pass. A technician places and verifies it during the survey with the same ID and retained import history. Applicable demand is not silently lost because location is unresolved, and restoring an archived device still follows FR-54.

**FR-58 — Preview duplicates and re-imports.** Match existing records using a valid Site Studio device ID for the property, or a reliably unique stable source asset ID within its source/property context. Device names, IP addresses and location hints may assist review but cannot alone establish identity. Present ambiguous/conflicting keys, duplicate rows and possible physical replacements for review; never silently merge distinct assets or reuse a removed asset's identity for a replacement.

Preview New, Unchanged, Changed and Needs review rows before applying an import. Show current and incoming values and their source/verification context. Allow straightforward selected rows to be handled together; unresolved matches remain for review. Re-importing the same inventory or retrying an operation must not create additional devices. Retain device IDs and import provenance; skip unchanged values and show applied, skipped, failed or conflicted outcomes.

Keep site-verified values and field evidence unchanged by default; updates require deliberate reviewed changes under existing correction/history and retest-impact rules. Blank cells do not erase information, and absent spreadsheet rows do not delete or archive project devices. Import updates do not establish actual work or passing checks. Archived records require an explicit restoration decision under FR-54; re-import does not reactivate them. Recheck current versions and dependencies when applying a preview under FR-42, retaining choices for review if concurrent changes invalidate it.

**Check:** Re-uploading an inventory creates no extra devices. Duplicate names or conflicting identifiers enter Needs review. A changed row shows the spreadsheet value beside the technician's correction and preserves that correction unless deliberately changed. Blank/missing rows leave existing information intact; an archived match stays archived without explicit restoration. A second editor's change cannot be silently overwritten by an earlier preview.

**FR-62 — Map CSV and Excel inventories.** Support CSV (.csv) and ordinary Excel (.xlsx) equipment inventories, with one physical device per row. Let the user select the worksheet/header row as applicable and preview the parsed data. Suggest familiar column headings and equipment-type values, but allow corrections, explicit defaults including Unknown type, and ignored columns. Show unmapped columns and invalid/conflicting mappings before import.

Map source asset ID, optional existing Site Studio ID, device name/type, manufacturer/model, serial number, IP/MAC address, building/floor/room hints and notes. Require a usable name or source asset ID for each new row; permit missing specifications and preserve unknowns. Encourage stable asset IDs for repeat imports without requiring a complete legacy inventory. Label-only rows receive internal IDs; later ambiguous matches require review under FR-58 rather than name-based identity guesses or duplicate creation.

Use the sequence file/sheet selection, column mapping, row preview, then import of explicitly selected valid rows. Reuse FR-58's New/Unchanged/Changed/Needs review groups and current/incoming-value protection. Show row errors and allow correction or explicit skipping; report imported, skipped, failed/conflicted and unresolved outcomes. Preserve source and mapping context for survey/re-import diagnosis. Missing map placement follows FR-57, and mistaken-record cleanup follows FR-59.

Preserve identifiers and leading zeros where available in the source, flagging uncertain conversions rather than silently changing values. Confirm location matches or keep unresolved hints in Awaiting placement. Do not infer coordinates, cable/port connections or optical specifications from labels/model names. Source installation/test labels are not verified field evidence or passing checks. Read values or available stored formula results without executing formulas, macros or external refreshes; unavailable/error values need review or a values-only source. Defer legacy .xls, macro-enabled/password-protected workbooks and live spreadsheet integrations.

Provide a downloadable sample template and remember the project's last confirmed column mapping, proposing it only when headers fit and allowing a fresh preview/edit before reuse. Detailed parsers and controls are implementation work; resource limits follow the confirmed acceptance table and the 600-device acceptance profile is not a permanent row ceiling.

**Check:** An .xlsx inventory with a title row imports from the selected sheet/header; a CSV with different headings can map to the same fields. A label-only device with unknown specifications remains usable without an invented identity match or test result. Asset ID 00042 stays intact when supplied as such. Invalid or ambiguous rows remain visible for correction/skipping, ignored columns are disclosed, confirmed rows keep provenance, and reused mapping can be corrected before import. Unsupported files fail clearly without changing the saved inventory.

### Camera models and coverage

**FR-10 — Camera controls and visibility.** Adjust bearing, lens/field of view, active sensor dimensions, aspect ratio, image resolution, mounting height, tilt, and analysis range. Apply the selected camera-model/profile limits and maintain a coherent optical basis: sourced field-of-view angles or compatible sensor/focal-length geometry. Keep derived values consistent without silently overwriting manufacturer specifications. Show each supported camera view's visible coverage, obstruction shadows, and near blind area using the selected target height and documented geometry assumptions. Distinguish illustrative panoramic previews under FR-48. Pan/tilt/zoom cameras follow FR-63.

**Check:** Changing aim or optical geometry updates the footprint and affected metrics; changing resolution updates image-detail results without necessarily changing the footprint. Linked optical values stay consistent, and a single-camera percentage identifies its own analysis area.

**FR-11 — Walls and obstructions.** Draw/edit floor-specific walls and solid obstructions with height and enabled state. Use their geometry when estimating camera visibility.

**Check:** An obstruction creates a shadow where it blocks sight; changing its height or enabled state changes the result when the modeled sightline permits it.

**FR-12 — Combined camera coverage.** Show the union of all eligible camera views on the floor for the selected Current installation or Proposed design basis, overlapping coverage, and areas not covered by the assessed views. Distinguish overlap between views from overlap between physical camera bodies. Visibility controls must not silently remove cameras from the combined calculation.

**Check:** Overlap counts once in covered area and separately as overlap; hiding a camera's visual layer does not change combined totals. Two heads in one housing are not counted as two physical cameras. Below-Detect detail is not mislabeled unseen, and unsupported views are disclosed under FR-13.

**FR-13 — Analysis boundary and assumptions.** Support a floor analysis boundary and common target height for combined analysis. Allow users to draw and edit a custom boundary and return to the disclosed default bounds. Persist the floor’s common target height independently of individual-camera target heights, and use that common plane for combined and zone analysis. Identify the selected current/proposed basis, effective boundary, denominator, included/excluded devices/views, condition/specification assumptions, and sampling limits. Without a custom boundary, disclose the fallback area. Keep full-boundary semantics, including solid interiors and margins, explicit. Identify stale/provisional analysis as Updating until results for the current inputs are complete. NFR-4 governs final-result fidelity; clean vector presentation does not establish numerical accuracy.

**Check:** Editing a boundary changes the analyzed area; unsupported/excluded views and approximation limits remain visible. Missing panoramic analysis is Not assessed and cannot prove the actual site is blind. If no eligible views exist while relevant unsupported views remain, report the unassessed/incomplete analysis rather than an unconditional 100% blind claim. Single-camera and combined percentages are not presented as interchangeable.

**FR-14 — DORI coverage.** Offer an optional DORI overlay showing Detect, Observe, Recognize, and Identify regions for individual and combined views. Toggling its visibility does not change saved optics or calculations. At each location, combined DORI uses the best eligible unobstructed single optical view, without adding pixel density across heads, cameras or derived views. Explain the threshold convention and inputs.

**Check:** Two below-target views do not become Identify merely by overlapping, including heads in one housing. Seen areas below Detect remain distinct from unseen areas. The implementation convention is recorded in the addendum.

**FR-15 — Security zones and shortfalls.** Draw, name, and type floor polygons, with either no coverage requirement or a selected DORI level and qualifying-area percentage. Show achieved percentage and deficient area for targeted zones as cameras or obstructions change; keep that feedback visible while a camera is selected and adjusted. Use each zone's full polygon and a consistent target plane for its result. Illustrative/unsupported views receive no DORI credit and unassessed regions remain in the denominator. A target demonstrated by assessed views under the declared analysis accuracy remains met; otherwise distinguish an assessed shortfall from a target not demonstrated because relevant views remain unassessed. Where sampling/boundary uncertainty could change the decision, refine or clearly flag the analytical uncertainty instead of claiming confident Target met. Display rounding cannot create target success; this analytical status is separate from field-test outcomes.

**Check:** An entrance with an Identify target of 90% shows whether that chosen target is met and where it falls short. The example does not become a universal default or a field-test pass.

**FR-16 — Clean coverage presentation.** Render cone-like/vector contours with readable DORI layers and legends. Keep displayed percentages consistent with the underlying analysis and disclose approximation.

**Check:** Improving contour appearance does not change numeric results or imply continuous, exact visibility calculations.

**FR-47 — Camera-model templates.** Let users create, edit, duplicate and search reusable camera definitions by manufacturer, model number and lens/variant, then select a definition when placing a camera. Retain the generic camera option and represent physical assets, their optical views and configured streams under FR-48. Pan/tilt/zoom ranges follow FR-63. Record image resolution as width × height in pixels for the selected capture/stream mode, fixed or adjustable/varifocal lens type, focal length or supported focal-length range, and horizontal/vertical field of view in degrees with their applicable mode/focal setting. Store active imaging dimensions in millimeters when known, and distinguish them from nominal sensor-format labels. Preserve specification source and unknown values; incomplete templates must not silently become verified generic specifications.

A fixed-lens profile uses its defined focal length. A varifocal profile supplies supported limits and a selected focal setting for each placed camera; changing it updates the supported coverage/DORI calculations. Require sufficient consistent optical data for the evaluated setting, disclose approximations and flag unsupported/missing input. Selecting a lower-resolution/cropped mode uses that mode’s pixels and framing, not automatically the model maximum. Model FoV angles are distinct from physical scene width/height, which are calculated at a stated distance/plane.

Keep location, mounting height, aim/tilt, selected operating mode/focal setting and site conditions on each camera instance, with reusable defaults where useful. Analysis also uses the existing target plane, obstructions, zones and DORI convention; model specifications alone do not certify on-site performance. Preserve template identity/version or captured values with each instance/revision, evidence and backup. Later template edits must not silently change placed/issued/tested cameras; explicitly applying changed values follows the existing change/retest rules.

**Check:** An engineer searches a known model number and places two uniquely identified cameras using its specifications. A fixed-lens instance cannot masquerade as a continuously adjustable lens; two varifocal instances can use different supported focal settings and produce their respective coverage/DORI results. A resolution/mode change uses the correct pixels/framing. Missing optical inputs stay visible, physical FoV dimensions identify their distance, and a later template edit leaves fixed historical designs and evidence unchanged.

**FR-48 — Physical cameras, views and streams.** Keep one physical asset with stable child view IDs and associated configured streams. A pan/tilt/zoom camera is a single-view camera under FR-63, not a multi-view arrangement. Preserve device cost, mounting/history and actual hardware demand independently of view/stream count. Supported heads retain individual resolution/mode, lens limits/setting, bearing, tilt and condition; a shared mounting point for a compact body is a disclosed approximation. Model templates can preset these views without multiplying purchased bodies.

| Arrangement | POC support |
| --- | --- |
| Independent conventional heads | Analyze each eligible rectilinear head using its own inputs; combine under FR-12–15 and expose which head supplies the result. |
| Single-sensor fisheye | Catalog and place the device; show a clearly illustrative 360-degree/directional preview only when mounting, angular extent and chosen range are known. DORI is Not assessed. |
| Stitched panorama | Keep source-head and composite-output profiles distinct. Evaluate usable supported source heads explicitly; do not attribute those results to a different stitched recording. Composite DORI is Not assessed. |

Detailed calibrated fisheye/stitched DORI is follow-on scope, requiring a supported projection and effective-sampling profile. Do not substitute 360 degrees into rectilinear optics, distribute total megapixels among invented sectors, or infer extra captured detail from dewarping/upscaling. Manufacturer distances remain conditional references, not automatic full-floor contours. Not assessed is an analysis status, not a fifth commissioning outcome.

Preserve parent/view/stream identities, selected profiles and source distinctions. Apply targeted retesting to per-head/shared-hardware changes and retain failed/unknown head conditions for the selected analysis basis. Device lifecycle follows FR-35/36/53–55.

**Check:** A four-head template creates one physical camera with four independently inspectable views, using each head’s own resolution and optical settings. It does not lose heads through duplicate analysis IDs or inflate body cost/PoE. A fisheye preview remains visually distinct from assessed DORI, receives no target credit and does not cause unsupported exclusions to be reported as proof of blindness. Historical issued views/results remain unchanged after later edits.

**FR-63 — Pan/tilt/zoom cameras: resting view, stored positions and reach.** Represent a pan/tilt/zoom camera as one physical asset with one view and its configured streams; it is not a multi-view camera under FR-48. Its model template under FR-47 adds the pan range, the tilt range and the zoom range; the zoom range is given as the widest and narrowest field of view or the equivalent focal-length range. Each placed camera can carry its own pan and tilt limits within the model’s range. Unknown ranges and limits stay unknown.

Let each placed camera hold named stored positions, each with pan, tilt and zoom, and mark one as home. The home position is the camera’s resting position, and the view at that position is its resting view. Analyze it under FR-10 as a varifocal camera at the home settings; it is the only view of this camera counted in combined coverage, DORI and zone results under FR-12–15. Until a home position is defined, the camera contributes no assessed coverage and is disclosed as unassessed under FR-13. Any other stored position can be previewed with its own coverage and DORI. A preview is labeled as such and changes no counted result.

Show the camera’s reach as a separate layer labeled reachable on demand: the area it could view within its limits, analysis range and modeled obstructions at the selected target height. Reach is never counted as covered or as overlap. Where an area within reach is otherwise uncovered, identify it as reachable on demand instead of as having no camera view. Within reach, show for each location the best detail achievable at the narrowest field of view that can still include that location within the camera’s pan, tilt and zoom limits, labeled as achievable in one place at a time. Near a limit, where only a wider view can include the location, show the detail of that wider view. This is not a DORI coverage result. Without sufficient optical data, show the reach outline alone with detail Not assessed. Draw that outline from the pan and tilt limits, the analysis range and modeled obstructions only, as the locations on the target plane the camera can be pointed toward, without assuming a field of view. Where the known tilt limits cannot point the camera toward the target plane, show no reach there. Where the pan or tilt limits are unknown, show no reach and disclose the camera’s reach as unassessed under FR-13.

A zone shows its counted result under FR-15 and, separately, which cameras can reach it on demand, how much of it and at what achievable detail. Judge the zone’s target on the counted result only.

Provide a pan/tilt/zoom starter under FR-29: limits stop where intended; pan, tilt and zoom controls operate; each stored position shows its intended scene; the camera returns to home where that is configured; and limits or positions keep it from facing bright light sources. An alarm-driven position is checked only where scoped under FR-43. Changing a stored position or limit on the installed camera is a meaningful change under FR-27/28 and flags the checks for that position; a proposed edit updates the design without flagging field checks. Changing the home position also changes counted coverage and the zone results that depend on it.

Count one device, its documented power demand and its configured streams under FR-19; stored positions multiply nothing. Preserve positions, limits and the home designation through revisions, evidence, exports and backups, and identify the resting view, previews and reach distinctly in analysis sheets under FR-33. Guard tours, auto-tracking, time-share coverage figures and live control of a camera are outside the POC.

**Check:** A roof camera with its home position on the car-park entrance contributes only that view to combined coverage and to the entrance zone. The loading-dock zone, within reach but outside every counted view, keeps its counted shortfall and separately shows that the camera can reach it on demand with its achievable detail; reach on demand does not count toward the target. Previewing a second stored position changes no totals. Narrowing a pan limit shrinks the reach. Changing the home position changes counted coverage and flags that position’s checks. The camera remains one device with one power demand. A pan/tilt/zoom camera with no home position contributes no coverage and is listed as unassessed. One whose optics are unknown shows a reach outline with detail Not assessed, and one whose pan or tilt limits are unknown shows no reach.

### Connections and routes

**FR-9 — Cable pathways and connections.** Draw editable routes between identifiable physical terminations, using ordered per-floor segments and named riser/continuation references for inter-floor runs. Select cable type and retain one stable run ID across all segments. Use each floor’s own scale and the explicit transition/drop and allowance model in FR-52. Keep physical route/termination references distinct from logical assignments in FR-51; a planned assignment does not create a cable, physical length or installed connection.

**Check:** Moving an endpoint or waypoint updates the applicable route estimate and identifies supply overrides needing review. A multi-floor run shows both terminations and floor continuations, with estimates, allowances and recorded measurements distinct; it appears once in property totals.

**FR-51 — Closet and port schedules.** Create named network/security equipment locations with stable ID, building/floor/map location, notes and survey references. Group individually identified cabinets, switches, controllers, recorders and power supplies; keep physical containment distinct from remote devices served. A closet adds no implicit hardware cost/load, and a group/name change does not move installed devices or redraw routes.

Provide a manual switch-port schedule with model-sourced or entered labels/types/capabilities, endpoint/interface or peer-switch assignment, reservations, cable/termination references and notes. Keep allocation (free/reserved/assigned) distinct from availability/condition (usable/unavailable/unknown); preserve an existing connection on an unavailable port with its warning. Identify conflicting direct connections, missing references and known type/PoE incompatibilities. Unknown inventory or unmodeled shared-connector behavior must not produce an exact available-port count. Count uplinks at their actual ports on both ends; optical links carry no PoE.

Permit planned assignments across floors before routes exist, with missing physical route/verification clearly identified. Preserve Current installation and Proposed design assignments separately. A linked cable's endpoint/port context must agree or show a discrepancy. Closet membership, an opening association or a passive patch label does not establish network connectivity. Keep controller terminals/local power separate from Ethernet interfaces; controller-wired devices do not automatically consume IP ports, and Ethernet exclusivity rules do not substitute for control-bus/terminal validation.

Record separate total-switch PoE budgets, per-port limits/allocations and load assumptions with source/basis. Compare compatible values; distinguish rated/maximum planning demand, allocation and observed/typical consumption. Show known subtotals, reservations and unknown demand without inventing conversions or treating missing input as zero. A named planned device contributes once; an unnamed reservation can have an explicit allowance or unknown demand. Separate current load from proposed reservations. Known headroom with unresolved loads is an incomplete assessment, not a guaranteed capacity pass. Preserve property-wide demand while filtering locations and retain separate hardware/view/stream counting rules.

Concurrent assignment checks must prevent two editors silently claiming the same direct port connection. Preserve dependent assignments and prior evidence; retain pending edits and show affected connections for resolution. Keep closet/port/assignment identities and context, including source basis, reservations and warnings. Port edits do not record installation or a field-test Pass. Lifecycle behavior follows FR-53–55. Live discovery/configuration, automatic assignment, full rack/patch graphs and detailed electrical/traffic calculations are outside this POC extension.

**Check:** IDF-2 groups its actual equipment without duplicate purchases. SW-02 port 05 can be planned for a camera on another floor while its route remains missing; port 06 can be reserved with unknown power. Conflicting claims are surfaced, an unavailable connected port retains its record, and unknown loads prevent a reassuring complete capacity result. A controller terminal reference does not fabricate an Ethernet port or PoE source. Export and restored revisions preserve these distinctions.

**FR-52 — Physical runs, length components and supply quantities.** Represent one physical cable run with a stable ID, cable family/specification, physical terminations and associated device/interface references. Draw ordered horizontal segments on their respective scaled floors, joined by named riser/continuation points with stable identities and from/to floors. Do not infer an inter-floor diagonal from unrelated plan coordinates. Multiple runs can reference one riser; each retains its own length and is counted once across sheets.

Enter inter-floor transition lengths and endpoint rises/drops with units and measured/estimated source. Drops connect the routing elevation to the actual termination; do not blindly add full mounting height. Count each physical portion once, including offsets/detours; use a complete vertical span or its component spans, not both. Unknown scale or required length components make the estimate incomplete, with the known subtotal visible; explicit zero means no additional length. Keep migrated horizontal-only routes labeled with their limited basis until reviewed.

Use route subtotal R = horizontal segments + inter-floor transitions + endpoint rises/drops. Suggested supply Q = R + fixed service loops/extra length + (selected percentage × R). Identify fixed extras by location/purpose and apply the percentage once, excluding fixed extras; do not stack floor/run/project slack. No floor height or percentage is prescribed. Keep selected supply quantity/basis and any ordering/reel rounding separate; preserve manual overrides and flag affected changes for review. Retained cable is not automatically purchased, and relocation is not automatically priced as a length difference. Separately purchased patch/equipment leads must not also be included in run allowances. A fixed run does not by itself represent a complete tested channel.

Keep measured installed length and its source/context separate from the prior design estimate; do not add design slack to an already measured total. Preserve Current installation and Proposed design context and run/segment/riser identities. Physical changes follow FR-44; drawing or measuring a route does not mark it installed or passed.

Show missing segments/landings, unknown scale/lengths, mismatched assignments and known type/length-limit violations. Compare limits only on matching stated bases; no universal limit applies to all cable families. Export per-floor continuation labels and a property-wide schedule of run IDs, terminations/ports, floors/risers, horizontal/vertical/drop breakdown, fixed extras, percentage/base, suggested and selected supply quantities, measured length and completeness. Aggregate each run once by cable type and work scope, with partial-sheet context disclosed. Automatic 3D routing, pathway-capacity calculations and detailed fiber-core/breakout engineering are outside this POC scope. Device/archive endpoint changes follow FR-53.

**Check:** A run with 20 m and 12 m horizontal segments, a 6 m transition and 2 m drops has R = 40 m; 2 m fixed loops and an explicitly selected 10% give Q = 46 m, with no duplicated floor/run slack. This is an illustration, not a default. The same run appears on two sheets but once in totals. Removing a required transition value leaves an incomplete estimate; recording a measured installed total preserves the estimate without adding slack again.

**FR-53 — Retained runs and explicit endpoint changes.** When actual device removal is recorded, show known affected cable ends, interfaces, port/terminal assignments and dependencies. End the removed device’s active association and retain its historical connection. Keep each cable’s stable run ID, route, lengths, notes and evidence by default; mark unresolved current endpoint/disposition Needs connection review. Permit explicit retained/disconnected or unassigned, reused/reassigned, actually removed/retired, or unresolved dispositions. Do not require an invented answer to record actual device removal. Archive a cable only when its actual removal/retirement is documented. Planned actions affect proposed intent, not current connections or occupancy.

A different physical replacement device gets a new linked ID. Explicitly select retained cables/terminations/ports to reuse, validating context, known compatibility and conflicts. Retained physical cable keeps its run ID with dated endpoint history; a different replacement cable gets a new linked run ID. Do not duplicate purchases or transfer the predecessor’s installation evidence or passing results. Keep physical termination references distinct from logical associations, including unchanged outlets/patch panels when a device or lead changes.

Restoring the same device preserves its ID/history and presents prior connections as historical choices. Reconnect explicitly after checking the selected location under FR-54, active cable/termination, current availability, compatibility and active replacements. Do not reclaim a reassigned port, overwrite another device’s connection or resurrect a removed cable. Unresolved connections remain visible for follow-up.

Separate device demand from port occupancy. Remove the archived device’s demand under FR-35 without declaring its former port free. Preserve known occupancy/reservations or unresolved availability until explicitly released/reassigned. A historical device link is not a current assignment; unknown remaining endpoints/load do not become zero. Removing shared equipment flags known dependent connections for reconciliation without archiving downstream devices, erasing their demand/evidence or asserting unsupported functional failures.

Validate concurrent archive, release, reuse and restore dependencies. Record actor/time and meaningful change context; changed/restored connections follow FR-44, and unresolved installation issues follow the scope/closeout rules. Show dispositions and historical/current distinctions in plans and schedules.

**Check:** Archiving CAM-01 preserves CBL-014 and its history, ends CAM-01’s active association and leaves unresolved disposition visible; switch port 05 does not automatically become free. Explicitly reusing the cable for CAM-02 retains the cable ID without duplicating its purchase. Restoring CAM-01 cannot steal CAM-02’s assignment or inherit a current Pass. Removing a shared switch flags known connections without archiving its downstream devices.

### Work scope, issues, costs and capacity

**FR-17 — Equipment and cable estimates.** Estimate the active work scope using editable supply quantities, unit costs and allowances, with subtotals and assumptions. Include new/replacement equipment and cable, selected accessories and optional labor; retained assets are not repurchased automatically. Relocation, service, removal and scoped inspection/testing can have explicit parts/labor. Reuse rates or explicitly copy selected lines, without automatically carrying earlier quantities into the new scope. Show unknown prices as unpriced rather than known zero.

Distinguish installed route length from cable to supply for the planned work. Record the supply quantity and basis using FR-52, with slack included once; a changed route does not imply purchasing only the length difference. Preserve estimates in fixed prior revisions/closeouts.

**Check:** Retaining an installed camera contributes applicable analysis/capacity without a new purchase. Changing a 10 m route to 12 m allows an explicitly estimated replacement run rather than automatically charging 2 m, without doubled slack. Unknown prices remain visible and estimates are not presented as supplier quotes.

**FR-18 — Accessories and optional labor.** Add manual accessory lines and optional installation labor with quantities, units, rates, inclusion controls, and subtotals alongside equipment/cable costs. Export the estimate to CSV.

Add percentage lines such as contingency, tax, markup or bonding. Each states its percentage and the base it applies to: chosen categories of included direct costs, and earlier percentage lines only when explicitly selected. Show the base and the result, apply each line once, and give it the same inclusion control as other lines. No percentage is prescribed. A base containing unpriced items makes the result incomplete, not zero.

Offer subtotals by subsystem, such as video, access control, intrusion, communications, network and power, and cabling. Assign each line to one subsystem by default from its equipment type, and allow the assignment to be changed. A manual line with no equipment type starts as Unassigned until the user chooses a subsystem. Percentage lines are shown outside the subsystem groups, after them. Subsystem grouping is a presentation of the same lines and never changes the total.

**Check:** Excluding labor changes the included total without deleting entered rates or quantities. A 10% contingency on equipment and cable shows its base and amount and changes when that base changes; excluding it restores the prior total. The grouped view sums to the same total as the ungrouped estimate, and a line that could belong to several subsystems appears under one only. A manual line with no subsystem chosen appears under Unassigned, and a contingency line appears after the subsystem groups; both are included in the grouped view’s total.

**FR-19 — Capacity planning.** Estimate recording storage from the streams actually recorded, their bitrates, recording percentage/schedule assumptions and retention. Estimate simultaneous stream bandwidth from the streams actually transmitted, independent of the percentage of time recorded. Do not duplicate demand for display-only dewarped views; separate transported/recorded streams do contribute demand. Estimate property-wide switch-port and PoE requirements for the explicitly selected current/proposed basis using endpoint demand, connections, uplinks, switch budgets, and per-port limits. Count actual physical interfaces/power requirements independently of optical-head count; a multi-head camera is one asset with its documented hardware demands. Include applicable retained equipment regardless of purchase cost. Use explicit supported network/port assignments, including logical links across floors and copper/fiber uplinks, instead of treating same-floor Cat6 proximity as the only association. Show unassigned demand, ambiguous assignments, and unknown specifications; missing information must not silently become zero demand. Per-port and total PoE checks use compatible entered power bases and known budgets under FR-51.

**Check:** Retention/bitrate changes update storage. Changing recording percentage changes storage without reducing simultaneous stream bandwidth. A four-head camera does not automatically require four ports or four copies of device power, and four displayed crops do not automatically become four recorded streams. A missing or ambiguous switch connection cannot silently remove its demand or produce a reassuring capacity result. Report units and overhead assumptions.

**FR-45 — Select the work scope.** Maintain one active named work scope per property work cycle, linked to its design revisions, estimate and evidence. Its current issued installation reference follows FR-61 and is separate from draft alternatives or previous work scopes. Categorize devices/routes as Work now (add, relocate, service/reconfigure, replace or remove), Inspect/test only, or Reference only. These categories are distinct from planned action and actual installation/test state. Preselect planned changes transparently; allow scope adjustments with actor/time and a reason for meaningful changes. Recompute current costs/checks without altering fixed prior records or adding mandatory approvals.

Reference-only assets retain applicable site coverage/capacity without automatic purchase or recommissioning. Selected inspections can have checks and optional labor without equipment purchase. Review known affected dependencies under FR-28/44: changing scope cannot silently clear required checks or failures. Include affected work or explicitly defer its outstanding item. Unknown baseline details alone do not create failed tests or work orders.

**Check:** A lobby upgrade can include changed cameras, an inspection-only retained camera and reference equipment. Saving a second layout preserves the same scope and estimate. Moving an affected dependency to Reference only leaves its required retest/issue visible.

**FR-46 — Property issue carryover.** Keep stable issue IDs linked to relevant devices, checks, scopes and attempts. Carry unresolved issues into later work without duplicating them or rewriting prior closeout snapshots. Support Include now (select work/checks/costs), Defer (retain an open item with a brief reason and optional owner/due date), and Resolve (record corrective work and appropriate current evidence/retest). Preserve the original failure and link the resolution/new attempt. Service visits recorded on an issue follow FR-65.

Allow explained corrections of mistaken/duplicate issue records with actor/time and a canonical issue link where applicable. Corrections, archive, replacement or scope edits must not silently resolve genuine defects or turn prior outcomes into Pass. When removal/replacement addresses a requirement, record the actual corrective work and necessary checks. Keep deferred/out-of-scope faults visible in remaining-work lists and closeout exports; a finished scope with such issues uses Closed with outstanding items.

**Check:** A finished lobby upgrade with a deferred parking-lot fault closes with outstanding items and carries the same issue into the next scope. A valid later resolution links evidence and retains the earlier failure and closeout. Unknown legacy attributes and unscoped tests do not automatically prevent completion.

### Review and issued designs

**FR-23 — Project approval assignments.** Assign design reviewers and final acceptance reviewers per project. Permit different people, the same person, or self-approval. Reuse or change assignments for later work without requiring individual accounts. Assignments and displayed participant names do not verify the person holding a link.

**Check:** A solo internal project can proceed through the workflow without a second participant.

**FR-24 — Revision-specific review.** Give each designated reviewer a separate revocable, replaceable link to a fixed design or closeout revision. Allow viewing the shared revision, floor-plan comments, and approval/change decisions; show the recorded display name, time, and version. Review access cannot edit the working project or browse unrelated projects. Project editors manage reviewer links and retain the existing self-approval/bypass options. Preserve earlier decisions after link revocation. Record new reviewer decisions as distinct entries with duplicate-safe retries; later decisions do not erase prior ones.

**Check:** Changing the working layout does not change the shared revision or transfer its approval to a later version. Demo attribution remains distinguishable from verified identity.

**FR-25 — Optional approvals.** Allow every approval checkpoint to be bypassed. Record bypass distinctly from approval; a reason is optional. Approval and bypass must not alter actual installation/test outcomes or grant additional access.

**Check:** Work can proceed without sign-off, while a failed test remains Fail and outstanding work remains visible.

**FR-26 — Issued design and field record.** Preserve a fixed named issued design when installation starts, even if separate handoff or approval is skipped. Let users compare it with the working installation. Issuing another design creates another fixed reference. Explicitly designate the current installation reference under FR-61 without changing the working field record.

**Check:** Direct field changes leave the original issued layout/settings and its approval or bypass record unchanged.

**FR-61 — Designate the current issued design.** Maintain one explicitly designated current issued design for the active work scope once it has been issued. Use a fixed named issued revision under FR-26; show Not issued before issuance. Saving a draft, creating an alternative or exporting a preview must not silently change this designation. A later work scope does not automatically inherit the prior scope's issued reference.

Show the current issue/revision identifier, name, issue date and work scope prominently where installers start work, with a direct way to open it. Display its approval or bypass state separately: Current does not mean Approved, installed or tested. Keep the editable working installation record distinct from the fixed reference. Approval remains optional and does not transfer from an earlier issue.

When an editor deliberately designates a different issue as current, mark the previous issue Superseded in the live project while retaining its fixed source, exact PDFs, comments, decisions and designation history. Record who changed the designation and when, using the existing demo-attribution model. Check scope/designation versions under FR-42 so concurrent changes cannot silently create conflicting current references. Preserve historical export bytes and their original cutoff under FR-34; already downloaded copies cannot be updated retroactively.

Changing the reference must not roll back or overwrite field placements, notes/photos, configuration, tests or actual connection records. Use existing comparison to inspect differences from the working installation. Existing meaningful-change/retest rules continue when work is performed; choosing a current issue is not evidence that work happened and introduces no mandatory installer acknowledgement or approval gate.

**Check:** After Revision B is explicitly made current, Revision A is visibly superseded but its original package and decisions remain accessible. The technician's recorded work stays intact; the working plan can be compared with B. Saving Revision C as a draft or exporting it does not promote it. Concurrent designation changes require conflict review, and B does not inherit A's approval.

### Field work and testing

**FR-27 — Direct installer changes.** Allow participants with project editing access to update actual device positions, equipment, and routes directly. For meaningful design changes, retain affected IDs, before/after values, actor, time, and a short reason; photos are optional. Routine checklist entries and evidence uploads do not each require a design-change reason.

**Check:** A moved camera is saved as actual field condition immediately, with a traceable change record. Optional review cannot erase that field record.

**FR-28 — Change effects and follow-up.** Recalculate affected coverage, routes, estimates and capacity. Distinguish proposed work, actual recorded installation/configuration/condition changes, and record-only corrections. A proposed design edit updates intended work and analysis without claiming the installation changed. A correction retains its reason/source and prompts relevant documentation/evidence review; actual changes flag the affected checks.

| Change | Default affected review/retest |
| --- | --- |
| Camera moved/re-aimed or height/lens/focus changed | Relevant placement/mounting and image/framing/focus/scene checks; connectivity/recording when also affected. |
| Configuration, physical cable/termination, port or power connection changed | Changed settings, appropriate link/power checks and affected endpoint/event/playback function against project criteria. |
| Shared switch, power or integration changed | Changed equipment and known affected connected devices/functions; uncertain dependencies require scope review. |
| Device repaired, replaced or returned to service | Relevant installation, configuration and functional checks; preserve replacement/restoration identity rules. |
| Physical obstruction/scene, coverage target or criterion changed | Recompute analysis and review which current requirements lack applicable evidence; flag corresponding field checks. |
| Nonfunctional note/formatting, cost or record-only drawing correction | Documentation/estimate review; no automatic functional retest when actual conditions and requirements are unchanged. |

Use recorded associations and allow additional affected checks to be selected; do not claim complete automatic impact discovery. Requests for correction remain visible without replacing recorded conditions. Later changes do not inherit the issued design’s approval. Follow-up disposition and historical-result behavior are defined in FR-44.

**Check:** Moving a tested camera preserves the old attempt and flags the relevant current checks. A cost-only edit or hiding a display layer does not reset field tests. A shared-equipment change identifies known affected endpoints and exposes uncertain impact rather than silently assuming none.

**FR-29 — Editable checklists.** Provide a short common checklist plus device-type starters and a generic fallback, grouped into Installation, Configuration and Testing. Common checks cover identity/location, mounting, cable labels/connections, intended settings/system associations, and observed function. Default applicable core checks to required for new/changed in-scope equipment; enable extra checks where relevant. Projects can adjust scope, applicability, required/optional status and evidence requirements.

Each check states its task, method/conditions and expected result, including a project-defined value/tolerance where needed. Use the relevant project/manufacturer criteria; do not invent universal performance thresholds. Preserve earlier wording, expected results, attempts and unresolved issues when a template changes.

| Starter | Cover the applicable functions |
| --- | --- |
| Camera (dome/bullet) | Correct live image and identity; framing/focus at specified scene points/conditions; configured stream settings; recording/playback with correct identity/time. |
| Reader | Expected permitted/denied behavior and associated events for test credentials; linked actions only against the project sequence. |
| Door contact / motion detector | Specified state or test action produces the correct input/zone event at the receiving system. |
| Intercom | Call routing and specified audio/video; release action only when included in the project sequence. |
| Switch | Intended connections operate; observed/reported power demand meets specified equipment limits under the selected test load. |
| Cabinet / light | Applicable mounting, enclosure/lock or lighting-control behavior meets project criteria; required measurements use specified conditions. |
| Generic equipment | Define its intended function, test method, observation point and acceptable result. |

Offer these optional camera checks, off by default and enabled where the scene warrants them: a camera facing sunrise or sunset is not degraded by direct sun; the night image stays usable where vehicle headlights or other bright sources occur; a person at the far end of the intended view is discernible to the level the project specifies; and a person behind a named obstruction or in its shadow is visible or hidden as the design assumes. A far-end or obstruction check can reference the zone, range or modeled obstruction it verifies. Its outcome is field evidence shown beside the modeled estimate; it neither changes the modeled result nor is implied by it. A pan/tilt/zoom starter follows FR-63.

Detailed examples are in the addendum. Apply the common checklist and project-defined generic starter to added equipment where a dedicated starter is not defined. An opening or component association does not pass a related device or prove the complete sequence works. These starters do not establish a complete PSP/manufacturer/compliance library, universal wiring/fail-state criteria or automated hardware testing.

**Check:** A project can tailor its starter to the scoped work and preserve all past attempts. An undefined expected result is flagged Needs definition and cannot produce a new Pass; this is readiness information, not a fifth test outcome. Unknown legacy details remain unknown unless the scoped check specifically requires them.

**FR-30 — Separate field outcomes.** Record installed/not-installed work, configuration progress, and test outcomes separately. The device state model relates these recorded facts to derived phase progress; show the non-blocking contradiction warning it describes. Tests support Pass, Fail, Not tested, and Not applicable. Pass requires a technician-recorded observation meeting the configured expectation and any required data/evidence; measured checks need the requested value, units and conditions. A completed test whose observed result does not meet its defined expected result is Fail with a short explanation. An unperformed test remains Not tested. Not applicable requires a reason and is counted separately from passes; it cannot excuse a failed or merely unavailable test.

**Check:** Installed does not imply configured or passing; predicted DORI does not automatically satisfy an on-site test. Inventorying an existing device creates no passing result. New/changed work receives applicable checks; unchanged devices are not automatically recommissioned merely because they were inventoried, but can be explicitly included in assessment/test scope. Known defects remain visible. Project applicability is explicit; FR-28/44 define targeted retest behavior, while FR-45/46 define scope and issue disposition without bypassing FR-32. Missing criteria, required measurements/evidence, or a modeled DORI/PoE result cannot supply a new field-test Pass. A device still marked not installed whose required installation checks have all passed shows the contradiction warning, which itself blocks nothing; the device still counts as unfinished work under FR-32 until installation is recorded.

**FR-31 — Evidence and retesting.** Capture expected/actual results, actor/time, notes, photos, correction notes, and successive attempts. New notes, photo attachments and test attempts are separate identified entries so concurrent additions coexist. Retrying an addition does not duplicate it; corrections preserve protected prior evidence and checklist context. Photos are optional unless the project makes them required, and are shown as saved only after their upload and record association succeed. Show separate Installation, Configuration and Testing progress by device/floor and a project remaining-work summary. A phase is complete when required applicable checks have Pass results applicable to the current tested condition, required evidence is present, and no required retest or unresolved failure remains in that phase. List Not applicable separately; show No checks in scope when none apply. Optional unperformed checks do not block completion, but recorded failures remain visible. Work on different devices/phases can continue independently without a new approval gate.

**Check:** A passing retest retains the preceding failure and its evidence. Unperformed required checks, unresolved failures, and required follow-ups remain visible to closeout. An empty or all-inapplicable phase is not displayed as 100% passed. Making a failed check optional or changing its expectation does not silently rewrite the result or resolve its issue.

**FR-43 — End-to-end site checks.** Provide a small editable project/floor checklist for applicable end-to-end operation and final records: named devices/events reach the intended systems, scoped recordings can be retrieved, identity/time/location records align, and drawings/evidence reflect the recorded installation. Link each check to the endpoints, scope and conditions actually tested. Use the same outcome, evidence and history rules as device checks. Extra night, recovery, integration or duration checks are enabled only where scoped. Optional starters cover alarm-to-camera call-up, including whether the view or recording is available quickly enough for the project’s purpose, and handover of manuals, training, as-built records and the programming list. A handover check records that an item was delivered; it does not store the item or judge its adequacy. An optional reliability period follows FR-64. Technicians perform the tests and enter observations; the POC does not execute hardware tests.

**Check:** A sampled site check does not mark untested devices passed, a configured retention setting does not prove available recording history, and device pass totals do not automatically satisfy an unperformed required end-to-end check. Optional approval and explicit outstanding-items closeout remain independent.

**FR-44 — Targeted retest history.** Preserve original attempts and outcomes when conditions change. Show Needs review or Retest required as separate follow-up flags linked to the triggering change, affected device/check and reason; they are not new test outcomes. A new requirement for the changed condition remains Not tested until performed, without fabricating an attempt or changing an old Pass to Fail. Unaffected checks retain their evidence.

Allow editors to add affected checks or record why a suggestion is genuinely unaffected, with actor/time and supporting context. This does not waive a still-applicable required check or unresolved failure, relabel missing evidence as Not applicable, or add an approval gate for recording actual conditions. Broader scope and issue disposition follow FR-45/46.

Record the condition and criteria actually tested with each new attempt. Clear required retesting only when current requirements/evidence are satisfied and the relevant condition has not changed again. A later concurrent change preserves the attempt but leaves follow-up for the newer context. Undo, restoration or approval bypass cannot silently restore current passing status. Required follow-ups remain in device/floor/project summaries and closeout exports; fixed prior closeouts remain unchanged.

**Check:** A camera’s dated Pass remains inspectable after its aim changes, while required image checks stay outstanding for the new aim. A valid current retest can satisfy those checks without erasing history. A further change after testing keeps the new follow-up open, and a supported record-only correction can be documented as unaffected without dismissing an unrelated failure.

**FR-64 — Reliability period and downtime log.** Offer an optional site-level check, off by default, for a period of observed operation after testing. A period is one or more stages. The project defines what the period covers, the number of stages, what counts as downtime, and each stage’s planned duration and availability target. Prescribe none of these. Each stage is a site-level check with its own attempts under FR-31 and FR-43. It is required or optional on its own and counts in project-level Testing progress, not in any device’s.

A person records the start and the end of each run. A run in progress has no outcome and is not yet an attempt; it becomes one attempt when its end is recorded, unless it was stopped for a reason other than failure as described below. The POC observes nothing itself: it has no automatic monitoring, alerts or connection to the installed system.

Log each outage during a run as a separate entry with what was affected, its start and end time, a description and a linked issue under FR-46. Each entry states whether it counts toward availability under the project’s definition, with a short reason when it does not. Every entry stays visible in the run and in exports. An outage with no recorded end counts as continuing. Entries added by different participants coexist.

Compute availability as the time not down divided by the total elapsed time of the run, as a percentage, from the counted entries; overlapping entries are not counted twice. Show it beside the target with the counted and uncounted downtime totals, and mark it provisional while the run is open. Availability is never entered by hand.

Apply the outcomes of FR-30. A Pass requires a recorded start and end, the full planned duration and the target met. A full run that misses the target is Fail. A run stopped because the system failed to perform is Fail with an explanation. A run stopped for another reason is kept with its log and the reason. It has no outcome and is not an attempt, and the check’s outcome is unchanged. A stage with no duration or target defined shows Needs definition and cannot pass. Repeating or restarting creates a new attempt and keeps earlier attempts and their logs. Changing the definition or target afterwards does not rewrite a recorded outcome.

Allow a run to start while work is outstanding, with a warning listing the outstanding required checks, retests and open issues in the covered scope. When an actual change to covered equipment is recorded during a run, show the change on that run and flag the check Needs review under FR-44, linked to that run; a participant records whether the run continues or restarts, with a reason. Neither case is blocked and no approval is added.

Treat each stage as required or optional like any other check. FR-32 is unchanged: a required stage that is running, failed or not started prevents Completed and permits Closed with outstanding items. The Closeout package shows each run’s dates, planned and actual duration, downtime log, availability, target and outcome under FR-33.

**Check:** A project enables a one-hour, single-stage period with a 99% target. A technician starts it, logs a three-minute counted camera outage linked to an issue, and ends it: availability shows 95%, the attempt is Fail and the issue stays open. After the correction, a restarted run with no downtime passes, and both attempts appear in the Closeout package. An uncounted entry stays visible without changing availability. Moving a covered camera during a run flags the check for review without stopping the run. A run stopped early for scheduling reasons is kept with its reason and leaves the check’s outcome as it was. A stage with no target shows Needs definition and cannot pass. While a required stage is unpassed, the scope can close only with outstanding items.

### Closeout and lifecycle records

**FR-32 — Explicit closeout.** Support In progress, Completed, and Closed with outstanding items as defined above. Require a brief project-level note for the last state and retain the remaining-work list; follow-up owner/due date are optional. Preserve a fixed named closeout record, including drawings, schedules, estimates, evidence, changes, approvals/bypasses, and outstanding items. It also carries reliability runs under FR-64 and warranty records and service visits under FR-65. Recheck current outstanding work and capture a consistent server-saved version; concurrent changes must not produce a mixed or stale closeout.

**Check:** An unfinished installation, applicable failed/unperformed required test, required pending retest, or documented unresolved property issue prevents Completed but permits explicit Closed with outstanding items. Finishing the selected scope does not hide a deferred or out-of-scope fault. Missing approval alone does not prevent closure, and approval bypass cannot satisfy a required test/retest.

**FR-35 — Removed-device archive.** Archive after actual removal is documented; a planned Remove/Replace action alone must not archive the current installation record. Reversibly archive removed equipment with its captured identity/model/settings, last location, connections, installation/configuration records, tests/retests, notes/photos, and history. Record removal actor/date, optional reason, and replacement link. Exclude it from the normal active plan/schedule, coverage, equipment totals, and capacity/PoE demand while preserving previous revision/report values. Preserve and reconcile affected cable/port records under FR-53; device removal does not automatically remove cables or release ports. Distinguish actual removal from draft deletion, planned-item cancellation and record correction under FR-55.

**Check:** A searchable archive and optional historical plan view expose the labeled removed record; archiving never requires metadata that was not captured or deletes its evidence.

**FR-36 — Restore or replace.** Restore an archived device with the same ID/history and a recorded restoration. Give a different physical replacement a new linked ID. Do not overwrite an active replacement or automatically treat old tests as evidence of the restored installation. Cable reuse and reconnection follow FR-53. Placement on a changed/deleted floor follows FR-54; accidental draft deletion and guarded recovery follow FR-55.

**Check:** The user can follow predecessor/replacement history without mixing their identities, results, or active counts.

**FR-37 — Project archive.** Allow an inactive property project to be archived with editing paused and search/view/export retained. Preserve all device archives, revisions, closeouts, evidence, and outstanding items. Un-archiving returns the project to editing, is explicit and starts no work scope; starting later work is reopening under FR-38.

**Check:** Reading and exporting an archived project leave its design, installation, evidence, decisions and prior packages unchanged. Redownload returns the retained bytes. Export may append a separately identified retained edition under FR-34 without reopening work; changing business records requires explicit un-archiving, and starting later work requires reopening under FR-38.

**FR-38 — Later work at the same property.** Reopen the same project from its latest installation into a new active named work scope and working revision with In progress status. Multiple design revisions within this scope do not create separate work cycles or duplicate costs. Retain project/device IDs and fixed prior closeouts. Create a fresh scope-specific estimate and checks; retained installed assets are not charged again merely for remaining on the plan. Keep unresolved items visible and record their later disposition. Issue and close the new work with new records; assignments can be reused or changed. A service visit can open such a scope in one step under FR-65, where the estimate is optional.

**Check:** Reopening does not restore removed devices, resolve old issues, inherit old approvals/passes, or alter previous closeout packages. New/changed work receives its own evidence. Scope selection and issue carryover follow FR-45/46.

**FR-65 — Warranty and service-visit records.** Record an installation warranty on a work scope: its term, start date, provider and a note. The start date defaults to that scope’s closeout date and can be set to another date. Until its start date, a recorded warranty is Not started. By default it covers equipment and cable newly installed in that scope, and the covered items can be adjusted. Optionally record a manufacturer warranty on an individual device with its own term, start date and provider. A device covered by more than one warranty shows each separately.

Calculate each warranty’s end date and its status as of a stated date: Not started, In warranty, Expired or Unknown. Equipment with no warranty recorded is Unknown, never Expired; this includes surveyed existing equipment. Changes to a warranty record are history entries with actor and time. Show warranty details on the device record, as an optional schedule column and in the Closeout package, and show the status for information when an issue is raised on a device. Warranty status is a recorded calculation, not a contractual determination.

Record service visits as separate entries on an issue under FR-46. Each visit holds when and how the fault was reported, when the visit took place, the fault found, the work done, the parts used, the time spent, who attended and whether the visit was under warranty: Yes, No or Unknown. Suggest that last value from the warranty records as of the visit date and allow it to be changed. An issue can hold several visits; concurrent additions coexist and corrections preserve earlier entries.

A visit does not resolve its issue. Resolution still requires the recorded corrective work and appropriate current evidence or retest under FR-46. Actual changes made during a visit are recorded and flagged under FR-27/28, and where a part used is itself a replacement device, that replacement follows FR-36 and FR-53. Parts used and time spent are records only: they change no estimate and produce no invoice.

During an open work scope, record visits in that scope. When no scope is active, a single Start service visit action reopens the project under FR-38 into a new work scope marked as service, with a default name and the issue included. The mark is a label; the one-active-scope rule, the scope’s closeout under FR-32 and all history rules are unchanged, and an estimate for the scope is optional. An archived project is un-archived under FR-37 first. A service scope starts with no current issued design under FR-61. Earlier closeout records and their warranty details stay fixed.

Expiry reminders, response-time or service-level tracking, spares stock and contract management are outside the POC.

**Check:** A scope closes with a 12-month installation warranty, and its new cameras show In warranty from the closeout date with the calculated end date. A surveyed existing camera with no warranty recorded shows Unknown. Months later a fault is reported with no scope active: Start service visit reopens the project into a service scope with the issue included. The technician records the reported and visit times, the fault found, a replacement fuse as a part used, the time spent and a suggested under-warranty value of Yes. The issue stays open until a current check passes. The estimate is unchanged by the part and the time. A second visit on the same issue is kept beside the first, the original closeout record is unchanged, and the service scope’s closeout shows both visits.

**FR-54 — Confirmed destination and preserved location history.** Restore an individual archived device with its existing ID/history, separately from whole-project revision restoration. Require a valid current floor in the same property and an explicitly confirmed position before completing active restoration. Match the original floor by stable identity, not name. On an unchanged or merely renamed floor, preview the former position for confirmation. On a replaced drawing or changed scale, alignment or layout, require placement review/repositioning; uncertain old coordinates must not become an invented current position.

If the original floor is deleted or cannot be resolved, let the user choose an existing floor or create one through the normal workflow and then place the device. This recovery covers already-missing or unresolved references; new floor/building deletion must satisfy FR-60. Do not automatically recreate a deleted floor or treat a new same-named floor as the original. If placement is not ready, allow cancellation leaving the device archived and its history intact; a separately created floor remains a separate action. This archived-device restoration flow requires confirmed placement; it does not use the import-only Awaiting placement list in FR-57. Unknown scale/drawing inputs remain disclosed rather than fabricated to permit restoration.

Preserve the former floor identity/label, location, captured plan/revision context and dated evidence. Record the new placement, actor/time and meaningful change context without relabeling old photos/tests as evidence at the new location. Show a historical drawing only when retained; missing context remains unavailable. Selecting a point does not certify physical location accuracy, installation or a field-test Pass; restoring the same asset creates no replacement purchase.

Apply FR-53 to connections: review affected endpoints, drops and riser references without deleting retained runs, moving unrelated segments, inventing inter-floor paths/lengths or reconnecting automatically. Recalculate supported analysis using the selected context and known inputs, disclosing unresolved assumptions. Actual return to service/relocation receives appropriate checks under FR-28/44; a supported drawing-only correction does not establish a physical move. Validate the current floor/drawing/device/dependencies at save; preserve pending choices for review if they changed or the destination was deleted. Un-archive an archived project under its existing policy before editing it.

**Check:** Restoring CAM-01 after its Floor 2 drawing is replaced requires placement confirmation on the current drawing while preserving the old location/photo/test context. A renamed floor retains its identity; a new Floor 2 cannot silently substitute for a deleted one. Cancellation leaves CAM-01 archived, and a concurrent destination change prevents a stale restore. Previous cables/ports and test passes are not automatically reinstated.

**FR-55 — Delete drafts, cancel proposals and correct records.** Offer Delete draft for accidental proposed placements never installed or surveyed as existing, not included in an issued/approved design and without actual installation/configuration/test evidence. Determine eligibility from origin/history, not an unchecked Installed flag, Draft project label or missing price/serial number; untouched starter checklists are not field evidence. Ambiguous eligibility requires review/correction. An isolated eligible draft can be deleted with immediate Undo, without an obligatory confirmation dialog or reason. Remove it from current working content and applicable proposed schedules/analysis/estimates, retaining its stable identity and actor/time change history for guarded recovery.

For an issued/approved proposal that will not be installed, cancel the planned item in the working revision with a short reason. The same cancellation, with a reason, is available for an unissued proposal that is not eligible for Delete draft, for example because it carries installation, configuration or test evidence; it keeps its identity, history and evidence and is no longer part of the Proposed design. A proposal that is eligible for Delete draft is deleted, not cancelled. Preserve the issued representation, comments/decisions and visible scope change in comparison/closeout. Remove the cancelled proposal from current proposed equipment/capacity/supply totals while retaining recorded work, committed cost and outstanding disposition. Cancellation is not physical removal, a failed test, approval of changed work or a refund. Existing/installed/field-evidenced assets cannot use quick draft deletion: document actual removal through FR-35/53, or correct an erroneous/duplicate record with a reason and retained-record reference where applicable, without fabricating physical removal. A recorded installation or configuration mark made in error on a proposed device can be reversed with a reason, actor and time: the device and its history are kept, a reversed installed mark returns it to not installed, a reversed configuration mark returns it to not configured, and its evidence and test attempts stay in place with Needs review under FR-44. Reversal is a correction. It does not make the record eligible for Delete draft and does not apply to equipment surveyed or imported as existing. If the device is then unwanted, it is cancelled with a reason.

Preview dependencies before deleting a connected draft. Preserve other devices, linked opening components, shared controllers/switches, retained cables/risers, issues and notes/photos/comments with their original accessible context. Keep affected existing/shared cable records and historical endpoints; mark unresolved/unassigned proposed endpoints explicitly. Delete a dedicated disposable draft cable only when explicitly selected and independently eligible. Release only the proposal’s identifiable exclusive planned reservation after checking current connections and other claims. Never silently cascade-delete records/evidence, free an occupied physical port or treat deletion/correction as resolving a site issue.

Apply own-session undo, current eligibility/version/dependency validation and duplicate-safe retries. Restore the same draft ID only when placement and related records remain valid; changed floors, reused ports or later edits require review. Do not recreate deleted floors, steal connections or erase another editor’s work. Undo is a design edit, not evidence of return to service. A draft snapshot does not prevent later working edits. No separate recycle-bin UI, arbitrary retention period or indefinite cross-session undo is required; recovery uses existing supported session undo and retained revisions/history/backups. FR-59 extends cleanup to bulk selection and confirmed mistaken unused import-created records; it does not make imported existing assets eligible for ordinary draft deletion.

**Check:** An isolated accidental CAM-099 can be deleted and undone with the same ID. Connected draft deletion previews effects and preserves shared cable/evidence; a concurrent test entry or issuance makes stale quick deletion ineligible. An issued camera omitted from installation is cancelled with a reason while its issued record survives. A surveyed camera cannot be erased by clearing Installed, and a duplicate is corrected without inventing removal. Undo cannot reclaim a port reassigned by another editor. A proposed camera marked installed by mistake is returned to not installed with a reason and keeps its ID, notes and attempts; it does not thereby become eligible for quick deletion. If it is no longer wanted, it is cancelled with a reason although it was never issued, and its notes and attempts remain findable.

**FR-59 — Select and safely delete eligible records in bulk.** Let the user select explicit records or an identified import batch, then preview the selected count, affected records, eligible deletions and blocked records with reasons before confirming. Scope the operation to the reviewed selection. Allow bulk cleanup of eligible accidental drafts under FR-55 and confirmed mistaken, unused import-created records. Imported existing equipment is not automatically a disposable draft; removal of an erroneous record is data cleanup, not evidence of physical removal.

Protect site-verified, issued/approved, installed/tested and other field-evidenced records, later edits and protected dependent work. Use existing history-preserving cancellation/correction or actual-removal archive workflows for protected records. Batch membership alone never makes a matched pre-existing device eligible for deletion. Preserve shared equipment, retained cables/risers, notes/photos, issues, occupied ports and fixed history; no automatic dependent-record cascade. Any separately selected draft dependency must independently qualify under FR-55.

Revalidate eligibility, record versions and dependencies before applying the confirmed selection; surface changed or blocked records instead of deleting through a stale preview. Keep an activity record and visible per-record outcomes; apply FR-21/42/55 to retries and Undo so identity, later edits and valid floor/connection context remain protected. This does not introduce bulk physical removal, mass archival or permanent history purging.

**Check:** A mistaken batch containing unused new records and a matched existing camera shows which records can be cleaned up and preserves the existing camera. Verified/issued/field-evidenced records and shared dependencies are blocked with reasons. A newly added test or later edit invalidates stale eligibility. Confirmed cleanup is logged and can be undone when current dependencies permit, without recreating a deleted floor, stealing a port or erasing another user's work.

### Deliverables and recovery packages

**FR-33 — Design and closeout PDF packages.** Provide two presets over the saved project record:

| Preset | Contents |
| --- | --- |
| Design | Proposed labeled floor plans, retained context/planned actions, equipment and cable schedules, installation notes, survey evidence and scoped checklist expectations. |
| Closeout | Recorded installation plans/status, changes from the issued design, known settings/identifiers, removed/replaced equipment references, phase summaries, detailed current-scope test attempts and relevant earlier correction/retest evidence, notes/photos, outstanding property issues and version-specific approval/bypass records. |

Include quantities and capacity estimates by default; prices/labor costs are optional and off by default. Offer separate coverage/DORI sheets with zone targets/results/shortfalls and explicit analysis basis, assumptions and limits. Property-wide capacity includes applicable retained demand. Recorded configuration and modeled coverage/capacity do not prove a field-test Pass. Keep outcomes, N/A reasons and required review/retest flags distinct; preserve unknown or unrecorded values and distinguish measured from estimated quantities.

Identify property, work scope, named source revision, package edition, issue/export dates, units, included floors/sections, approval/decision cutoff and Draft/Issued or closeout status. Default to all floors. Mark selected-floor output Partial while retaining the property-wide closeout outcome and outstanding-issue summary. A pre-closeout preview remains Draft/In progress; export neither approves nor closes work and requires no approval.

Use readable Letter/A4 landscape pages, separate clean plan and coverage sheets, continued tables/notes with headings, and captioned photos initially two per page with stable device/note references. Include relevant attached photos by default; optional photos can be omitted. Excluding required photo evidence makes the output an explicitly evidence-limited summary. Identify omitted backgrounds/sections; report unavailable required files and generation failures without silently truncating evidence or declaring an incomplete package complete. Include closet equipment and port/connection schedules with current/proposed basis, reservations, known power assumptions and unresolved warnings. Include retained/disconnected, reassigned, removed and unresolved connection context under FR-53, keeping historical endpoints distinct from current assignments. Show floor-to-floor cable continuations and FR-52 length/allowance breakdowns; count each physical run once in property-wide schedules and totals even when it appears on several floor sheets. Include selected plan annotations by default, with readable labels/styles and concise legends; identify optional markup omissions without hiding property-wide outstanding issues. Identify assessed camera views, unsupported panoramic outputs and illustrative footprints in analysis sheets. Live basemap/satellite tiles are outside the default raster PDF export. The confirmed manifest and layout details are in the addendum.

When needed, split a complete edition into numbered PDF volumes by building or logical section, with one manifest listing all volumes, included content and the common source revision/edition. Deliver the edition together and retain each exact PDF and manifest. All parts use the same fixed source; a per-volume page/byte limit must not silently become a whole-property omission. Apply the confirmed file/edition limits below and report failure if the complete selected scope cannot fit.

The Closeout preset also carries reliability runs under FR-64 and warranty details and service visits under FR-65, and analysis sheets identify a pan/tilt/zoom camera’s resting view, previews and reach under FR-63.

**Check:** A design package links planned device IDs to schedules and installation checks. A closeout package preserves actual conditions, failures/retests and all unresolved property issues even when a subset of floors is exported. Optional cost/photo choices do not alter saved records, outcomes or permissions, and an incomplete package is visibly identified.

**FR-34 — Fixed packages, backups and recovery.** Generate from a consistent saved named revision or fixed closeout, resolving the initiating editor’s relevant pending/conflicting edits first. Retain the exact issued-design and closeout PDFs and their source/edition/content manifests with the property for historical download, project archival and backup/recovery. Redownload returns the retained file; regeneration or later decision information creates a new dated edition with the same fixed source and an explicit decision-history cutoff. Never overwrite the earlier package or substitute later installation edits into it.

Keep PDFs, optional materials/estimate CSVs and complete editable project backups distinct. A backup preserves captured drawings, records, attachments, named revisions, issued/closeout history and packages, continuing issues, removed devices and lifecycle evidence. Preserve stable IDs/relationships and earlier supported project data during migration; exclude access credentials and live passwords. Do not claim original drawings/photos that were never retained. Retain newly imported original drawings/photos with usable previews, preserving source associations and sharing a retained original across its sheets/revisions. Saved attachments require durable originals, required derived files and relationships. Historical originals that were never retained remain unavailable. Package mechanisms belong to architecture; budgets and job targets are confirmed below. Failed generation remains visible and retryable.

Create automatic complete recovery backups at least daily, retaining at least seven successful daily generations independently of the live project, plus a backup before migrations or destructive maintenance. Show backup age/failure and keep the latest successful recovery point no more than 24 hours old. Backup-generation rotation does not purge revision/evidence history inside the continuing project; backup storage is separate from the live-content budget.

For catastrophic store loss, restore a usable project within 60 minutes in the documented prepared recovery environment, including automatic backup retrieval, validation and restoration. Distinguish this from portable-file upload/download time and from ordinary zero-loss acknowledged saves. Display the recovered point in time and potential loss window; do not imply that its records or current issued designation include later lost edits. Record preparation assumptions and measured elapsed time.

Demonstrate recovery in an isolated destination, checking stable IDs/relationships, original/processed evidence, revisions, archived devices, outstanding issues, exact PDF volumes/manifests and issue-designation history before a deliberate switch. Invalid/incomplete restores must leave the working project intact. Do not restore live credentials or reactivate revoked bearer links; re-establish authorized access under the existing model. Backup download alone does not prove recoverability.

**Check:** Later edits or approval decisions cannot change a previously downloaded package. A new edition identifies its source and cutoff. Reimporting a valid complete backup preserves captured evidence, archived records and retained package relationships; a PDF/CSV is not offered as an editable complete backup. An isolated catastrophic-recovery exercise meets the 24-hour recovery-point and 60-minute recovery targets, while a failed restore preserves the working project and old revoked links remain unusable.

## Experience and cross-cutting quality

Preserve the selected [white/teal map-first direction](../../../../design-mockups/04-map-overlay-studio.png) as a simple, professional workspace: project/floors/layers, a central map and drawing, contextual properties, and directly accessible placement and alignment controls. On smaller screens, prioritize locating a device, viewing its requirements, and recording work/photos/results. Desktop supports detailed design and comparison. These are POC acceptance targets, not production service commitments.

- **NFR-1 — Record integrity.** Stable device/view/stream IDs and revision associations must survive save/reload, restore, export/import, archive, replacement, and reopening. Fixed issued/closeout records and prior evidence remain unchanged by later edits.
- **NFR-2 — Shared-save clarity.** Saved means acknowledged, durably persisted shared records and associated attachments that survive browser closure and an ordinary service restart. Conflicts and failed saves remain visible; pending input survives while the page is open. Never silently overwrite another participant’s work or declare an incomplete upload saved. Distinguish pending local changes from server-saved state. Browser-close recovery of unsaved input and durable offline capture are not promised. Original/preview durability and the separately bounded catastrophic recovery path follow FR-34.
- **NFR-3 — Browser, field usability and accessibility acceptance.** Demonstrate the complete desktop workflow on a Windows laptop in Chrome and Edge. On real iPhone/iPad Safari and Android phone Chrome, demonstrate equipment lookup, current-plan/issued-reference and checklist inspection, verification/placement of imported devices, notes/photos/results, save/conflict handling and permitted review actions. Record representative hardware, OS/browser versions and test conditions; online operation is sufficient, and full desktop drafting density is not required on phones. Required tasks must be completable with durable saved state after reload and visible errors/conflicts. Check labeled inputs/errors, keyboard navigation and visible focus where applicable, readable forms at 200% zoom, usable touch controls and alternatives to essential drag-only actions, and status distinctions beyond color. Apply this matrix to both functional and larger-site fixtures; focused checks do not establish universal device support or full accessibility conformance.
- **NFR-4 — Honest analysis and responsiveness.** Use bounded analysis, disclose unsupported inputs, sampling and effective resolution, and keep controls usable during import/analysis/export. Use the confirmed [acceptance profile](#acceptance-profile), declare its workload manifest, and meet the performance targets below. Validate supported optical/FoV/DORI reference calculations within 1% and zone qualifying-area references within 2 percentage points, using effective sampling no coarser than 1 m and finer where needed. Neither spacing nor the reference tolerance guarantees correct arbitrary live-zone threshold classification: refine or flag uncertain near-target results, preserve full-precision decisions and never silently reduce fidelity to meet timing. Verify counts, units, rounding and allowance arithmetic independently. File/export/backup/recovery limits are confirmed in the acceptance tables and FR-34. Supported scale may expand through deliberate engineering and validation; no untested scale promise is implied.
- **NFR-5 — Demo access boundary.** Enforce the confirmed project-edit and revision-review permissions on the server for records, drawings/photos, and other files. Reject revoked links and access outside their project/revision scope. Display names are unverified attribution; anyone holding a link can exercise its permissions. Use sample or sanitized nonconfidential data, keep live credentials out of notes and exports, and require a separate access/data decision for confidential client use. The HTTPS hosting vendor remains an architecture choice; individual accounts are not required.
- **NFR-6 — Consistent deliverables.** Exports identify their source revision and units, retain readable labels/legends and evidence relationships, and report failures rather than silently presenting incomplete output as complete. Retain exact issued/closeout PDF volumes and their complete-edition manifest; later regeneration creates a separately identified edition under FR-34. All volumes identify one consistent saved source and disclose scope/omissions.

## POC success and acceptance

Use the following profile, NFR-3’s browser/task and focused usability matrix, and the performance, fidelity, file/export and recovery criteria below. These are confirmed acceptance requirements, not evidence of a completed test pass. Engineering owns the detailed workload manifest.

### Acceptance profile

| Dimension | Required coverage |
| --- | --- |
| Fixtures | A small functional project and a larger representative property; apply NFR-3’s real-device/browser and usability matrix to both. |
| Functional coverage | Follow UJ-1–4 through later work, including multiple floors, cameras/other equipment, an obstruction, a targeted zone, routes, costs/capacity and survey evidence. Include an existing-site survey with unknown details, retained equipment/cable, and a planned replacement documented as actual work. For amendment 1.1, include one pan/tilt/zoom camera with a home position and a second stored position (FR-63), a deliberately short reliability run with one logged outage and one restart (FR-64), and a warranty record with a service visit opened by the one-step action (FR-65). No separate timing target is set for the reach layer. |
| Larger property | About 10 buildings and 600 devices, including 150 physical cameras; roughly 20–30 plans derived from 2–3 per building, with up to about 60 cameras on the busiest plan. |
| Shared use | One usual user and two simultaneous users, including editing/review conflicts. |
| Declared manifest | Before benchmarking, record the exact plan/boundary/geometry and zones, physical cameras versus analytical views/configured streams, connections, evidence/history volumes, and hardware/network conditions. These counts describe the test workload, not permanent product ceilings. |

### Success measures

| Measure | Acceptance evidence |
| --- | --- |
| SM-1 — Complete workflow | UJ-1 through UJ-4 can be completed, including the solo-user/no-handoff path, in the shared project without file exchange as the primary collaboration method. |
| SM-2 — Preserved history | No silent historical mutation across representative field moves, checklist edits, retests, replacement, archives, restore, and reopening. Stable identities and fixed records remain inspectable. |
| SM-3 — Honest outcomes | Bypass, not installed, Fail, Not tested, Not applicable, explicit outstanding-item closeout, and reopening produce distinct correct status and export evidence. |
| SM-4 — Cross-device field use | Complete NFR-3’s required tasks and usability checks on the declared real devices/browsers in both fixtures. Saved changes appear on another supported device; separate-item edits and evidence additions coexist, same-item conflicts preserve pending input, and guarded undo does not erase others’ work. A technician can locate equipment and record evidence; save failure is visible while pending input remains available in the open page. |
| SM-5 — Representative scale | Exercise property-wide open/save/schedules/cost/capacity, busiest-plan coverage, and complete exports/recovery across the larger acceptance profile and retained history. Include its one-user operation and two-user editing/review conflicts. Preserve physical-camera versus view/stream distinctions, declared fidelity and data integrity; small-fixture success alone does not pass this scale test. Meet the performance/fidelity and file/export/recovery criteria below. |

### Confirmed performance and analysis targets

Apply these POC goals to the declared representative workload and test environments. They are acceptance targets, not evidence that the prototype has passed.

| Operation | Target |
| --- | --- |
| Selection/button/direct-edit feedback | Within 250 ms; analysis may complete separately. |
| Search/filter the 600-device inventory | Usable correct results within 1 second. |
| Ordinary single-item metadata save | Durable acknowledgement within 2 seconds of committing the edit. |
| Shared update on another connected client | Visible within 5 seconds after durable save, preserving pending local input. |
| Initial project open | Usable selected plan/drawing/devices within 10 seconds. |
| Saved-plan switch in an open, warm project | Usable plan/drawing/devices within 5 seconds. |
| Combined visibility/DORI and all targeted zones on the busiest active plan | Complete current-input results within 10 seconds after a committed edit, at required fidelity. |

Require at least 19 of 20 trials per repeated timed operation to meet its target; record conditions, all results and outliers. Every applicable trial must preserve data, access and calculation integrity. Keep controls usable and mark incomplete/stale analysis Updating rather than passing it off as final. Do not simplify the agreed workload or omit cameras/zones to claim a pass. The [addendum](addendum.md) defines completion and reference-calculation boundaries, including the separate near-target uncertainty safeguard. File uploads/imports, report and backup jobs use the separate size-coupled limits below.

### Confirmed file, export and recovery acceptance

| Item | POC boundary |
| --- | --- |
| Source site-plan PDF | 100 MiB per file. |
| Source image/photo | 25 MiB per file. |
| CSV/.xlsx inventory | 10 MiB per file; exercise the representative 600-device inventory. |
| Exported PDF volume | 250 pages and 100 MiB final bytes, preserving legibility. |
| Complete design/closeout edition | 1 GiB across its volumes and manifest. |
| Retained project content | 8 GiB including originals/previews, distinct older assets, records/history and exact editions. |
| Complete portable backup | 10 GiB final container, with the 8 GiB logical project-payload boundary. |

All per-file allowances share the aggregate budgets (1 GiB = 1024 MiB). Show usage and warn before exceeding a limit; fail safely without truncating exports, lowering retained-original quality, purging history or losing the saved project. These are initial POC resource boundaries that can be raised through engineering and validation, not permanent property/device/history ceilings. Engineering must declare parser/decoded-image/page-complexity guards and temporary space in the workload manifest.

| File job, once input bytes are available | Processing target |
| --- | --- |
| Selected PDF-page preview | Within 30 seconds. |
| Photo preview/processing | Within 10 seconds. |
| Representative inventory preview / confirmed import | Within 30 seconds each. |
| Complete retained design/closeout edition | Within 5 minutes. |
| Complete portable backup creation | Within 10 minutes. |
| Portable backup validation/restoration after upload | Within 15 minutes. |

Record transfers separately with visible progress/failure; completion includes required output durability and manifest checks. Run long jobs at least three times on the declared full-size/readable fixture and meet each bound without correctness/integrity exceptions. A large portable transfer over a field connection is not part of the separately defined 60-minute automated catastrophic-recovery path. FR-34 specifies daily/seven-generation backups, the maximum 24-hour recovery-point age, isolated restore checks and unchanged ordinary-save durability. The addendum retains sizing examples and the distinctions between processing, transfer and disaster recovery; no acceptance pass is claimed by this document.

Counter-metrics: more green indicators, a higher modeled coverage percentage, or faster closure must not hide failures, unresolved work, calculation limits, or unverified attribution. Reducing data entry must not erase device history, necessary evidence, or estimate distinctions. Acceptance covers the FRs and NFRs within the agreed fixture/limits; this document itself is not an acceptance pass. No application tests or builds were rerun for this documentation work.

## Decision status and downstream work

No known product question remains open. The resolved OQ-1–10 and subsequent refinements are represented in these requirements; the [decision log](.memlog.md) and [conversation context](sources/conversation-context.md) retain their chronology. Product decisions do not establish implementation or acceptance evidence.

**Proposed amendment 1.1 (2026-11-18).** A parallel session, working from an earlier draft without knowledge of this baseline, produced additions that Kevin confirmed there. Those with no counterpart here are proposed as FR-63 (pan/tilt/zoom cameras), FR-64 (optional reliability period) and FR-65 (warranty and service-visit records), with additions to FR-7/18/20/29/43, pointer sentences in FR-10/32/33/38/46/47/48, a trade-term table, new Terms rows, added exclusions and added functional coverage in the acceptance profile. Where that session decided something this baseline also decides, this baseline stands: Kevin reviewed the differences on 2026-11-18 and kept this baseline on every one except a narrow case adopted afterwards: an unissued proposal that is not eligible for Delete draft can be cancelled with a reason (FR-55). He adopted four clarifications that fill silences here, namely reversing a mistaken installed mark (FR-55), what a whole-revision restore may change (FR-22), un-archiving as distinct from reopening (FR-37), and listing cancelled and corrected records (FR-8/41), together with a consolidated [device state model](#device-state-model-proposed-11) and its contradiction warning (FR-30). The [amendment status](amendment-1.1-status.md) records every item. The amendment has not been through the finalization review.

Architecture, UX, detailed test manifests and domain-template wording remain downstream work with planning owners identified in the [addendum](addendum.md). Owners are planning roles, not assignments to external people. Hosting, transport, storage and recovery mechanisms remain architecture choices within the confirmed product and acceptance boundaries.

**A-1 — Package presentation, resolved.** FR-33/34 define the presets, evidence/detail choices, photo pagination and cost/capacity defaults. Detailed visual styling remains UX work; output must preserve actual conditions and outstanding work.

**A-2 — Acceptance scale and fixture approach, resolved.** The [acceptance profile](#acceptance-profile), NFR-3/4 and SM-4/5 govern the two fixtures and declared workload. Physical-camera counts are distinct from views/streams. The current acceptance targets supersede earlier candidate values without claiming tested support.

**PSP references (reviewed 2026-11-18, proposed 1.1).** The public ASIS PSP examination outline was read and mapped to the requirements; it lists topics, not requirements. Kevin shared pages from Patterson, *Implementing Physical Protection Systems* (2nd edition), and a public Department of Energy assessment guide was read in part. Their findings informed FR-63–65 and the optional checklist items, camera fields, survey prompts and estimate lines added to FR-7/18/20/29/43. Checklist content remains project-defined, and no PSP or other compliance claim is made. The [reference digest](sources/psp-reference-reading.md) holds the mapping and paraphrased findings. Limited external references inform discussion but do not impose contractual gates, certify calculations, or override the optional approval policy.

**After-POC candidates (not requirements).** Test level and frequency with reminders; a pre-delivery test stage; a separate test report; drawn riser diagrams; standard security symbols; a note of substitute protection while equipment is faulty; maintenance trend summaries; life-cycle costing; and a reason field on zone targets.

## Supporting records

Use the [source index](source-index.md) for implementation and design evidence, the [addendum](addendum.md) for technical boundaries, the [conversation context](sources/conversation-context.md) for intent, and the [decision log](.memlog.md) for the canonical history. The [preserved discovery notes](sources/discovery-notes.md) retain the earlier discussion; their old proposal labels are superseded by confirmed decisions here.

Keep the FR IDs stable when deriving UX, architecture, implementation stories and acceptance tests.
