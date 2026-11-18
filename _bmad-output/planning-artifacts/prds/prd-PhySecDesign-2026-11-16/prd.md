---
title: "Site Studio — Product Requirements"
status: draft
version: "0.28"
created: 2026-11-16
updated: 2026-11-18
phase: guided-refinement
working_mode: guided
entry_point: vision-and-features
---

# Site Studio — Product Requirements

Site Studio is a web application for physical security professionals to take a property from initial design through installation, commissioning, and later changes. A professional should be able to find a property, align a floor plan, place equipment, analyze coverage, route cables, estimate costs, and share a complete design package. The same project then supports documenting actual installation, configuration, tests, and closeout.

**This is PRD draft 0.28 for the proof of concept.** It consolidates Kevin's confirmed decisions and the existing prototype capabilities. It is not final approval, a claim that all requirements are implemented, or a compliance specification. One continuing project represents a property; later work reopens that project with new named revisions while preserving its history.

The [source index](source-index.md) distinguishes implementation evidence from product decisions. The [addendum](addendum.md) records technical context, current limits, and evidence boundaries. The confirmed scope includes existing-building workflows, shared demo editing, commissioning checklists, targeted change-to-retest rules, scoped estimates, continuing issue records, design/closeout export packages and reusable camera-model templates with bounded multi-head/panoramic support, additional equipment types, linked door/gate components, site annotations, manual closet/port planning, inter-floor cable routing with explicit allowances and preserved cable connections through device lifecycle changes, with guided restoration onto current floors, history-based draft deletion, cancellation and correction, floor deletion, retirement and moves, pan/tilt/zoom cameras, an optional reliability period, and warranty and service-visit records. No owned open question remains; later candidates are listed below.

## Users and POC scope

The primary user is a security professional designing and managing a property. An installer or technician records field conditions and performs checks. A client or site owner can review the design and accept the completed site. One person may perform all these roles: separate installer handoff and approvals are optional.

| Area | POC commitment |
| --- | --- |
| Project continuity | One project per property, with buildings/floors, named revisions, fixed issued designs and closeouts, and reopening for later work. |
| Collaboration | Designers and installers share persisted online records with autosave, updates within a few seconds, per-item conflict detection, separate evidence entries, and guarded undo of their own edits. Portable files supplement this workflow. |
| Access | One hosted HTTPS demo; revocable project edit links and separate reviewer links to fixed revisions. Individual accounts are not required; display names are unverified attribution. Use sample or sanitized nonconfidential project data. |
| Existing buildings | Survey and preserve the starting condition, plan retained/changed equipment, compare current/proposed conditions, and document actual work. |
| Field devices | Phones, tablets, and laptops; online access is sufficient. |
| Workflow and commissioning | Planning, installation, configuration, testing, and closeout, with editable common/device/site checklists, observed pass criteria and separate phase progress. Design approval and final acceptance remain optional. |
| Approvals | Project-specific assignees; separate people, the same person, or self-approval. Every approval is bypassable. |
| Existing capabilities | Retain map/plan alignment, equipment, routes, coverage/DORI/zones, surveys, estimates, capacity, recovery, revisions, review, and exports. |

The current prototype provides a local design workspace and a limited revision-review service. Shared project editing, the explicit existing-site survey/change workflow, field commissioning, preserved issued designs, lifecycle archives, and continuing-property work are new requirements. Related existing controls do not establish that these workflows are already implemented.

The POC does not require offline capture/synchronization, production identity or enterprise access controls, simultaneous independent jobs within one property, automated hardware configuration or testing, vendor-certified catalogs or pricing, native CAD/BIM editing, full 3D/lighting simulation, or certified engineering calculations. It also excludes risk-assessment records, specifications and bid documents, procurement, personnel management, project scheduling, elevation and detail drawings, service levels and spares, and backup-power design. Production availability, tenancy, and security commitments require later definition.

## End-to-end journeys

These journeys organize the workflow Kevin described; they are not additional customer research or invented personas.

- **UJ-1 — Design and issue.** A security professional creates the property project, finds the site, imports and aligns drawings, surveys existing devices/routes where present, saves a surveyed baseline, plans retained/changed/new equipment, models obstructions and required zones, adjusts coverage, connects equipment, and reviews cost/capacity estimates. They save a named revision, obtain or bypass design approval, and preserve an issued design for installation.
- **UJ-2 — Install and test.** The designer continues or hands the same shared project to an installer. Using a phone, tablet, or laptop online, the technician records installation/configuration progress, notes, photos, actual equipment or route changes, and checklist results. In the field view, a moved device or changed route is flagged for a plan update with a note and optional photo; the repositioning itself is done in the design workspace, which needs a window at least 1280 px wide. The issued design remains available for comparison; affected calculations and checks are revisited.
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
| Planned action | Intended retain, relocate, service/reconfigure, replace, remove, or add work; distinct from observed installation and test outcomes. |
| Analysis basis | Explicit Current installation or Proposed design population/settings used by a calculation; display-layer visibility does not select this basis. |
| Issued design | Fixed named revision used as the installation reference, whether approved or bypassed. |
| Working installation | Editable record of current field conditions, distinct from the issued design. |
| Closeout record | Fixed record of a completed or explicitly closed scope, including its evidence and outstanding items. |
| Test attempt | Dated record of a check's wording, expected/actual result, outcome, actor, and evidence. Retesting adds history. |
| Outstanding item | Unfinished in-scope work, an applicable required check not performed, a required follow-up/retest, or a documented unresolved property issue, including deferred/out-of-scope faults. Unknown inventory details and unscoped tests are not automatically faults. |
| Archive | Retained history excluded from normal active work. Archiving a device and archiving a project are separate actions. |
| DORI | Estimated image-detail levels: Detect, Observe, Recognize, and Identify. These are planning estimates, not field-test results. |
| Security zone | Named floor area with a zone type and an optional coverage target, expressed as a DORI level and qualifying-area percentage. |

Trade terms and their closest equivalents here, for recognition only:

| Trade term | Equivalent in this document |
| --- | --- |
| Punch list | The remaining-work list of outstanding items. |
| As-built drawings | The recorded installation plans in the Closeout package. |
| Site or system acceptance testing | Testing-phase device checks together with site-level checks (FR-29–31/43). |
| Field test | A check a technician performs on site and records as an observation. |
| Commissioning | The installation, configuration and testing phases through closeout. |
| Reliability or operational availability test | The optional reliability period (FR-58). |
| Repair log | The service visits recorded on an issue (FR-59). |

Words used in more than one sense:

- **Views.** The Design and Installation views of FR-2 are working modes of the same project. Current installation and Proposed design in FR-41 are the bases a plan, schedule or analysis uses, and Changes compares them. The design workspace is the wide layout and offers both the Design and the Installation view. The field view is the layout of the Installation view shown in any window narrower than 1280 px; wider windows get the design workspace, whatever the device.
- **Retire.** Retiring a cable in FR-53 means taking it physically out of service. Retiring a floor in FR-56 is a reversible record state.
- **Archive.** The Archive term above is a record state. The portable archive of FR-34 is a backup file.
- **Reopen.** Reopening means starting a new work scope under FR-38. Returning an archived project to editing is un-archiving under FR-37 and starts no work by itself.
- **Phase.** A phase is Installation, Configuration or Testing. The parts of a reliability period in FR-58 are called stages; lifecycle stages and acceptance stages are always named in full.

The workflow is planning → installation → configuration → testing → closeout. Work on different devices may be at different points in this workflow. Design approval and final acceptance are optional checkpoints; installation, test outcome, approval, closeout, and archive state must remain distinct.

| Current work state | Meaning |
| --- | --- |
| In progress | Work is underway or has been reopened. |
| Completed | No unfinished in-scope work, applicable unperformed required checks/retests, or documented unresolved property issues remain. |
| Closed with outstanding items | The user explicitly closes the scope with a brief project-level note; remaining items and evidence stay visible. Follow-up owners and due dates are optional. |

The selected scope can show its work finished while documented property issues remain; close that work as Closed with outstanding items. Deferral or exclusion from scope does not resolve a fault.

Archiving pauses editing and retains view/search/export access. Un-archiving restores editing and is explicit; it starts no work by itself. Reopening for later work starts a new work scope under FR-38 without changing previous closeout records. Approval, bypass, or closure cannot turn a failed or unperformed test into a pass.

### Device state model

Confirmed 2026-11-18. This consolidates the device states used across the requirements into one set of product rules. It adds no workflow of its own: the contradiction warning below is delivered by FR-30 and the record lists by FR-8 and FR-41. Storage and representation belong to architecture. Cable runs, ports and camera views keep their own rules under FR-48 and FR-51–53.

**Stored on the device**

| Axis | Values | Changes when |
| --- | --- | --- |
| Lifecycle | Proposed → Installed → Removed. Restoration returns a Removed device to Installed. | Actual installation, removal or restoration is recorded. A surveyed existing device starts at Installed. |
| Condition | Working, Faulty, Unknown | A person records it. It applies while the device is Installed and starts as Unknown. |

“Existing” and “proposed” are these lifecycle stages, not a separate flag: Installed means the device is recorded as on site, and Proposed means it is not yet on site. Recording an actual removal archives the device in the same step, so Removed and archived are one state under FR-35; there is no removed-but-unarchived device. An installed mark recorded in error can be reversed to Proposed under FR-55. Restoration records that the device is on site again under FR-36/54. It does not verify the installation, so affected checks are flagged under FR-28/44. A replacement is a new record linked to its predecessor. It starts Proposed with Add new and becomes Installed when its installation is recorded. The predecessor stays Installed until its own removal is recorded.

A Faulty device is not credited as functioning in a current operational estimate under FR-41. Unknown condition is disclosed as an assumption under FR-13. Condition is not changed automatically by a test outcome. Each view of a multi-view camera carries its own condition under FR-48. Where a requirement says a device or view has failed, it means the Faulty condition. Port availability has its own values under FR-51.

Three actions end a record instead of advancing it, all under FR-55. Delete draft leaves no active record; its ID is not given to a different record, and an earlier named revision keeps its copy. Cancel from design marks a never-installed device that has history as cancelled. Correct record marks an entry as mistaken or duplicate. Cancelled and corrected records are excluded from the current plan, totals and calculations. They stay listed in the Changes view and in a searchable record list, with their reason and evidence, under FR-8 and FR-41.

**Stored per device for each work scope**

| Axis | Values |
| --- | --- |
| Planned action | None, Retain, Relocate, Service/reconfigure, Replace, Remove, Add new |
| Scope category | Work now, Inspect/test only, Reference only |
| Work recorded | Installation done or not done; configuration done or not done |

None means no decision has been recorded for the device in this scope; Retain is an explicit decision to keep it. Work recorded applies to Work now items and is a fact a technician records. Recording installation done advances the lifecycle where the action requires it: an Add new device becomes Installed, a relocated device takes its new recorded location, and a recorded removal makes the device Removed. The planned action then stays on the scope as the record of what was done. Fixed issued designs and closeout records keep the values they captured.

**Derived, never set by hand**

| Roll-up | Derived from |
| --- | --- |
| Installation, Configuration and Testing phase progress | The device’s checks, under FR-31 |
| Attention indicators: follow-up flags (Needs review, Retest required), readiness (Needs definition), Needs connection review, analysis status (Not assessed) and open issues | Its checks, cable ends and port assignments, camera views and linked issues |
| Current installation membership | Installed devices at their recorded locations |
| Proposed design membership | Installed devices without a planned Remove or Replace, a replaced device explicitly intended to remain under FR-41, relocated devices at their planned positions, and Proposed devices |

Work recorded and phase progress are separate. A technician’s installed or configured mark does not complete a phase, and passing checks do not set the mark. Show a warning when they contradict each other, such as all required installation checks passed on a device still marked not installed, or a test attempt recorded against a Proposed device. The warning blocks nothing and changes no outcome.

**Combinations that cannot be chosen**

These apply when a planned action is chosen. Once the work for an action is recorded, the action remains as history and the resulting lifecycle stage is expected: an Add new device that is now Installed is not a contradiction.

- Retain, Relocate, Service/reconfigure, Replace or Remove for a Proposed device; an unwanted proposed device is deleted or cancelled under FR-55.
- Add new for a device that is already Installed.
- Any new planned action for a Removed, cancelled or corrected device.
- Replace without a linked successor record.
- Work now with a planned action of None or Retain; these take Inspect/test only or Reference only under FR-45.

## Functional requirements

Requirements use stable, globally numbered IDs. Each check describes observable acceptance behavior; it is not a report of tests already passed.

### Property workspace and drawing alignment

**FR-1 — Property, buildings, and floors.** Create and maintain a property project with named buildings/floors. Preserve stable floor identities through renaming; a newly created floor has a distinct identity even when it reuses an earlier name. Keep each floor's drawing, equipment, routes, obstructions, zones, notes, and analysis settings independent. An inter-floor cable run under FR-52 is one record with segments on several floors. Provide property-wide schedules with floor context. Deleting or retiring a floor and moving records between floors follow FR-56.

**Check:** Switching floors preserves each floor's content and does not mix its geometry or results with another floor.

**FR-2 — Shared online project.** Provide a hosted HTTPS demo with revocable, replaceable project-specific editing links. Designers and installers use the same persisted project and can switch between Design and Installation views in the design workspace; a window narrower than 1280 px shows the field view under NFR-3. Enter or select a display name for action history; neither a name nor a view selection grants permissions. The same participant can perform design, field work, and closeout without separate handoff or individual accounts.

**Check:** Saved changes become visible in other connected browsers within a few seconds without file exchange or overwriting unfinished local input. An edit link cannot access unrelated projects, and revoked links are rejected. FR-21/42 define saves and conflicts and NFR-2 sets the timing target; persistence implementation remains architecture work.

**FR-3 — Property lookup and map views.** Search by address or coordinates and use street/open-source mapping and satellite/aerial imagery; support optional configured Google mapping. Preserve geographic placement when switching map styles/providers and disclose provider availability or lookup failures.

**Check:** The user finds a property, switches to imagery, and retains the aligned plan and device positions.

**FR-4 — Drawing overlays.** Import a floor-plan image over the map and adjust position, rotation, uniform scale, opacity, and lock state. Associate it with the chosen floor.

**Check:** A locked, aligned plan remains positioned after floor changes and save/reload; changing opacity reveals the building beneath it. Moving, replacing, or aligning the drawing leaves geographically placed equipment and barriers unchanged.

**FR-5 — Two-point alignment.** Match two plan points to two map points and preview the resulting translation, rotation, and uniform scale before applying. Support cancel and undo; reject degenerate point selections without damaging the prior alignment.

**Check:** Two corresponding building corners align after applying; cancel preserves the prior plan and undo restores it.

**FR-6 — PDF plan import.** Import a PDF, preview/select a page, and place that page as the floor overlay. Process the original PDF and its password locally; the chosen raster and source-page identity can then enter the shared project. Handle password, cancellation, unsupported/invalid file, and rendering failures clearly. Retain the source filename/page identity.

**Check:** A selected page from a multipage PDF can be aligned through FR-4/FR-5. Importing a rasterized sheet does not imply editable CAD or retention of the original PDF.

### Equipment and cable routes

**FR-7 — Equipment catalog and identity.** Retain cameras, readers, door contacts, intrusion sensors, intercoms, lights, switches and cabinets. Add generic doors, gates, access controllers/control panels, locks/strikes, request-to-exit devices, low-voltage power supplies, recorders/NVRs and custom equipment records. Maintain unique IDs, type/model, mounting details, location, and notes. For cameras, also record enclosure type and any alarm interface where known, and show them in schedules; neither creates a connection or an integration. Distinguish existing versus proposed equipment and planned actions from installation, testing, and archive states, as set out in the device state model. Preserve legacy asset labels alongside stable internal IDs; see FR-39–41 for existing sites. Support user-defined camera-model selection under FR-47. Keep existing door-contact records distinct from the new door/opening records; linked components follow FR-49. Site annotations follow FR-50 and closets/port assignments follow FR-51; physical inter-floor cable detail follows FR-52.

**Check:** Two similar devices remain individually identifiable in the plan, schedules, evidence, and revision history. Existing door-contact data remains a contact, and creating a door/gate or custom record does not invent installed components, cable connections or known specifications.

**FR-8 — Equipment schedules.** Find and inspect equipment across the property, identify its building/floor, and locate it on the plan. Distinguish active and historical records. Historical records include removed, cancelled and corrected records, each searchable with its reason and evidence under FR-35 and FR-55.

**Check:** Selecting a scheduled device opens the correct floor/location; a removed device is labeled historical rather than counted as active. A cancelled or corrected record is found in the same list with its reason.

**FR-9 — Cable pathways and connections.** Draw editable routes between identifiable physical terminations, using ordered per-floor segments and named riser/continuation references for inter-floor runs. Select cable type and retain one stable run ID across all segments. Use each floor’s own scale and the explicit transition/drop and allowance model in FR-52. Keep physical route/termination references distinct from logical assignments in FR-51; a planned assignment does not create a cable, physical length or installed connection.

**Check:** Moving an endpoint or waypoint updates the applicable route estimate and identifies supply overrides needing review. A multi-floor run shows both terminations and floor continuations, with estimates, allowances and recorded measurements distinct; it appears once in property totals.

### Coverage, DORI, and required zones

**FR-10 — Camera controls and visibility.** Adjust bearing, lens/field of view, active sensor dimensions, aspect ratio, image resolution, mounting height, tilt, and analysis range. Apply the selected camera-model/profile limits and maintain a coherent optical basis: sourced field-of-view angles or compatible sensor/focal-length geometry. Keep derived values consistent without silently overwriting manufacturer specifications. Show each supported camera view's visible coverage, obstruction shadows, and near blind area using the selected target height and documented geometry assumptions. Distinguish illustrative panoramic previews under FR-48. Pan/tilt/zoom cameras follow FR-57.

**Check:** Changing aim or optical geometry updates the footprint and affected metrics; changing resolution updates image-detail results without necessarily changing the footprint. Linked optical values stay consistent, and a single-camera percentage identifies its own analysis area.

**FR-11 — Walls and obstructions.** Draw/edit floor-specific walls and solid obstructions with height and enabled state. Use their geometry when estimating camera visibility.

**Check:** An obstruction creates a shadow where it blocks sight; changing its height or enabled state changes the result when the modeled sightline permits it.

**FR-12 — Combined camera coverage.** Show the union of all eligible camera views on the floor for the selected Current installation or Proposed design basis, overlapping coverage, and areas not covered by the assessed views. Distinguish overlap between views from overlap between physical camera bodies. Visibility controls must not silently remove cameras from the combined calculation.

**Check:** Overlap counts once in covered area and separately as overlap; hiding a camera's visual layer does not change combined totals. Two heads in one housing are not counted as two physical cameras. Below-Detect detail is not mislabeled unseen, and unsupported views are disclosed under FR-13.

**FR-13 — Analysis boundary and assumptions.** Support a floor analysis boundary and common target height for combined analysis. Identify the selected current/proposed basis, effective boundary, denominator, included/excluded devices/views, condition/specification assumptions, and sampling limits. Without a custom boundary, disclose the fallback area. Keep full-boundary semantics, including solid interiors and margins, explicit.

**Check:** Editing a boundary changes the analyzed area; unsupported/excluded views and approximation limits remain visible. Missing panoramic analysis is Not assessed and cannot prove the actual site is blind. If no eligible views exist while relevant unsupported views remain, report the unassessed/incomplete analysis rather than an unconditional 100% blind claim. Single-camera and combined percentages are not presented as interchangeable.

**FR-14 — DORI coverage.** Offer an optional DORI overlay showing Detect, Observe, Recognize, and Identify regions for individual and combined views. Toggling its visibility does not change saved optics or calculations. At each location, combined DORI uses the best eligible unobstructed single optical view, without adding pixel density across heads, cameras or derived views. Explain the threshold convention and inputs.

**Check:** Two below-target views do not become Identify merely by overlapping, including heads in one housing. Seen areas below Detect remain distinct from unseen areas. The implementation convention is recorded in the addendum.

**FR-15 — Security zones and shortfalls.** Draw, name, and type floor polygons, with either no coverage requirement or a selected DORI level and qualifying-area percentage. Show achieved percentage and deficient area for targeted zones as cameras or obstructions change; keep that feedback visible while a camera is selected and adjusted. Use each zone's full polygon and a consistent target plane for its result. Illustrative/unsupported views receive no DORI credit and unassessed regions remain in the denominator. A target met by assessed views remains met; otherwise distinguish an assessed shortfall from a target not demonstrated because relevant views remain unassessed.

**Check:** An entrance with an Identify target of 90% shows whether that chosen target is met and where it falls short. The example does not become a universal default or a field-test pass.

**FR-16 — Clean coverage presentation.** Render cone-like/vector contours with readable DORI layers and legends. Keep displayed percentages consistent with the underlying analysis and disclose approximation.

**Check:** Improving contour appearance does not change numeric results or imply continuous, exact visibility calculations.

### Costs, capacity, and survey evidence

**FR-17 — Equipment and cable estimates.** Estimate the active work scope using editable supply quantities, unit costs and allowances, with subtotals and assumptions. Include new/replacement equipment and cable, selected accessories and optional labor; retained assets are not repurchased automatically. Relocation, service, removal and scoped inspection/testing can have explicit parts/labor. Reuse rates or explicitly copy selected lines, without automatically carrying earlier quantities into the new scope. Show unknown prices as unpriced rather than known zero.

Distinguish installed route length from cable to supply for the planned work. Record the supply quantity and basis using FR-52, with slack included once; a changed route does not imply purchasing only the length difference. Preserve estimates in fixed prior revisions/closeouts.

**Check:** Retaining an installed camera contributes applicable analysis/capacity without a new purchase. Changing a 10 m route to 12 m allows an explicitly estimated replacement run rather than automatically charging 2 m, without doubled slack. Unknown prices remain visible and estimates are not presented as supplier quotes.

**FR-18 — Accessories and optional labor.** Add manual accessory lines and optional installation labor with quantities, units, rates, inclusion controls, and subtotals alongside equipment/cable costs. Export the estimate to CSV.

Add percentage lines such as contingency, tax, markup or bonding. Each states its percentage and the base it applies to: chosen categories of included direct costs, and earlier percentage lines only when explicitly selected. Show the base and the result, apply each line once, and give it the same inclusion control as other lines. No percentage is prescribed. A base containing unpriced items makes the result incomplete, not zero.

Offer subtotals by subsystem, such as video, access control, intrusion, communications, network and power, and cabling. Assign each line to one subsystem by default from its equipment type, and allow the assignment to be changed. Subsystem grouping is a presentation of the same lines and never changes the total.

**Check:** Excluding labor changes the included total without deleting entered rates or quantities. A 10% contingency on equipment and cable shows its base and amount and changes when that base changes; excluding it restores the prior total. Subsystem subtotals sum to the same total as the ungrouped estimate, and a shared item appears under one subsystem only.

**FR-19 — Capacity planning.** Estimate recording storage from the streams actually recorded, their bitrates, recording percentage/schedule assumptions and retention. Estimate simultaneous stream bandwidth from the streams actually transmitted, independent of the percentage of time recorded. Do not duplicate demand for display-only dewarped views; separate transported/recorded streams do contribute demand. Estimate property-wide switch-port and PoE requirements for the explicitly selected current/proposed basis using endpoint demand, connections, uplinks, switch budgets, and per-port limits. Count actual physical interfaces/power requirements independently of optical-head count; a multi-head camera is one asset with its documented hardware demands. Include applicable retained equipment regardless of purchase cost. Use explicit supported network/port assignments, including logical links across floors and copper/fiber uplinks, instead of treating same-floor Cat6 proximity as the only association. Show unassigned demand, ambiguous assignments, and unknown specifications; missing information must not silently become zero demand. Per-port and total PoE checks use compatible entered power bases and known budgets under FR-51.

**Check:** Retention/bitrate changes update storage. Changing recording percentage changes storage without reducing simultaneous stream bandwidth. A four-head camera does not automatically require four ports or four copies of device power, and four displayed crops do not automatically become four recorded streams. A missing or ambiguous switch connection cannot silently remove its demand or produce a reassuring capacity result. Report units and overhead assumptions.

**FR-20 — Survey notes and photos.** Attach notes, measurements, installation constraints, and photos to a device or floor location. Offer optional prompts for lighting, shadows, uneven terrain and mount rigidity; the answers are observations and do not feed coverage analysis. Annotations can reference these records without creating a second evidence store. Preserve their context through moves and archival; retain the last recorded location when a device is no longer on the active plan.

**Check:** The user locates evidence from either the plan or device record; device removal does not erase its notes/photos or silently attach them to a replacement.

### Recovery, revisions, and review

**FR-21 — Save and recover edits.** Automatically save completed working edits and display Saving, Saved, Unsaved and Conflict status without hiding pending items. On connection failure, retain pending input while the page stays open and recheck current state before retrying. Support portable backup recovery and undo/redo of the current session’s own recent working edits, including draft deletion under FR-55. Record a reversal as new history and check the affected items: if later edits or dependencies make reversal unsafe, explain the conflict and require review. Do not erase another person’s work, protected evidence, or fixed historical records. Durable offline capture remains outside scope.

**Check:** A supported edit autosaves and its true save state is visible. A failed request retains unsaved input while the page is open. Undo/redo cannot silently reverse another participant’s later change, and the user can review why a reversal needs attention. Retrying a save does not duplicate an action that already succeeded.

**FR-22 — Named revisions and comparison.** Save named versions, compare layouts at a common scale and inspect changed devices/settings, and restore a prior design into working state without deleting subsequent historical records. Include full revision content in portable project backups and support existing project-format migration. Named snapshots and restoration use a consistent server-saved version and validate the current project state. Resolve the initiating user’s relevant pending/conflicting edits before snapshot creation; other clients’ unsaved work is not represented as included. A full restoration is a deliberate guarded project action, separate from ordinary undo and the per-device restoration in FR-54.

A full restoration restores design content only: proposed devices, planned positions, routes, zones, obstructions, annotations and settings. It never changes recorded facts. Lifecycle stage, recorded actual positions, recorded work, evidence, test attempts, issues, cancellations, corrections, archive state and retired floors stay as they are. A draft deleted since that revision returns with its original ID, and a floor deleted since then returns with its original identity and its restored draft content. Where restored content refers to a device since Removed or a floor since retired, leave that item out and list it for review.

**Check:** Restoring a design preserves its drawing/equipment context, remains reversible, and does not rewrite prior issued designs, approvals, test attempts, or closeouts. Restoring a revision saved before a camera was removed does not make that camera Installed again; it is listed for review. A draft deleted since that revision returns with its original ID. A camera moved in the field after that revision keeps its recorded actual position.

**FR-23 — Project approval assignments.** Assign design reviewers and final acceptance reviewers per project. Permit different people, the same person, or self-approval. Reuse or change assignments for later work without requiring individual accounts. Assignments and displayed participant names do not verify the person holding a link.

**Check:** A solo internal project can proceed through the workflow without a second participant.

**FR-24 — Revision-specific review.** Give each designated reviewer a separate revocable, replaceable link to a fixed design or closeout revision. Allow viewing the shared revision, floor-plan comments, and approval/change decisions; show the recorded display name, time, and version. Review access cannot edit the working project or browse unrelated projects. Project editors manage reviewer links and retain the existing self-approval/bypass options. Preserve earlier decisions after link revocation. Record new reviewer decisions as distinct entries with duplicate-safe retries; later decisions do not erase prior ones.

**Check:** Changing the working layout does not change the shared revision or transfer its approval to a later version. Demo attribution remains distinguishable from verified identity.

**FR-25 — Optional approvals.** Allow every approval checkpoint to be bypassed. Record bypass distinctly from approval; a reason is optional. Approval and bypass must not alter actual installation/test outcomes or grant additional access.

**Check:** Work can proceed without sign-off, while a failed test remains Fail and outstanding work remains visible.

### Installation, configuration, and testing

**FR-26 — Issued design and field record.** Preserve a fixed named issued design when installation starts, even if separate handoff or approval is skipped. Let users compare it with the working installation. Issuing another design creates another fixed reference.

**Check:** Direct field changes leave the original issued layout/settings and its approval or bypass record unchanged.

**FR-27 — Direct installer changes.** Allow participants with project editing access to update actual device positions, equipment, and routes directly. From the field view, a participant flags a device or route as moved or changed with a note and optional photo. This raises Needs review on the item under FR-44, linked to the note in place of a change record, and it clears when the plan is updated in the design workspace. The flag is not itself the change record. For meaningful design changes, retain affected IDs, before/after values, actor, time, and a short reason; photos are optional. Routine checklist entries and evidence uploads do not each require a design-change reason.

**Check:** In the design workspace, a moved camera is saved as actual field condition immediately, with a traceable change record. In the field view, the flag is saved with its note and stays open until the move is recorded; the retest flags of FR-28 are raised when the move itself is recorded. Optional review cannot erase that field record.

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

Offer these optional camera checks, off by default and enabled where the scene warrants them: a camera facing sunrise or sunset is not degraded by direct sun; the night image stays usable where vehicle headlights or other bright sources occur; a person at the far end of the intended view is discernible to the level the project specifies; and a person behind a named obstruction or in its shadow is visible or hidden as the design assumes. A far-end or obstruction check can reference the zone, range or modeled obstruction it verifies. Its outcome is field evidence shown beside the modeled estimate; it neither changes the modeled result nor is implied by it. A pan/tilt/zoom starter follows FR-57.

Detailed examples are in the addendum. Apply the common checklist and project-defined generic starter to added equipment where a dedicated starter is not defined. An opening or component association does not pass a related device or prove the complete sequence works. These starters do not establish a complete PSP/manufacturer/compliance library, universal wiring/fail-state criteria or automated hardware testing.

**Check:** A project can tailor its starter to the scoped work and preserve all past attempts. An undefined expected result is flagged Needs definition and cannot produce a new Pass; this is readiness information, not a fifth test outcome. Unknown legacy details remain unknown unless the scoped check specifically requires them.

**FR-30 — Separate field outcomes.** Record installed/not-installed work, configuration progress, and test outcomes separately; the device state model relates these recorded facts to derived phase progress. Show the non-blocking contradiction warning it describes. Tests support Pass, Fail, Not tested, and Not applicable. Pass requires a technician-recorded observation meeting the configured expectation and any required data/evidence; measured checks need the requested value, units and conditions. A completed test whose observed result does not meet its defined expected result is Fail with a short explanation. An unperformed test remains Not tested. Not applicable requires a reason and is counted separately from passes; it cannot excuse a failed or merely unavailable test.

**Check:** Installed does not imply configured or passing; predicted DORI does not automatically satisfy an on-site test. Inventorying an existing device creates no passing result. New/changed work receives applicable checks; unchanged devices are not automatically recommissioned merely because they were inventoried, but can be explicitly included in assessment/test scope. Known defects remain visible. Project applicability is explicit; FR-28/44 define targeted retest behavior, while FR-45/46 define scope and issue disposition without bypassing FR-32. Missing criteria, required measurements/evidence, or a modeled DORI/PoE result cannot supply a new field-test Pass. A device still marked not installed whose required installation checks have all passed shows the contradiction warning, and nothing is blocked.

**FR-31 — Evidence and retesting.** Capture expected/actual results, actor/time, notes, photos, correction notes, and successive attempts. New notes, photo attachments and test attempts are separate identified entries so concurrent additions coexist. Retrying an addition does not duplicate it; corrections preserve protected prior evidence and checklist context. Photos are optional unless the project makes them required, and are shown as saved only after their upload and record association succeed. Show separate Installation, Configuration and Testing progress by device/floor and a project remaining-work summary. A phase is complete when required applicable checks have Pass results applicable to the current tested condition, required evidence is present, and no required retest or unresolved failure remains in that phase. List Not applicable separately; show No checks in scope when none apply. Optional unperformed checks do not block completion, but recorded failures remain visible. Work on different devices/phases can continue independently without a new approval gate.

**Check:** A passing retest retains the preceding failure and its evidence. Unperformed required checks, unresolved failures, and required follow-ups remain visible to closeout. An empty or all-inapplicable phase is not displayed as 100% passed. Making a failed check optional or changing its expectation does not silently rewrite the result or resolve its issue.

### Closeout, exports, and property history

**FR-32 — Explicit closeout.** Support In progress, Completed, and Closed with outstanding items as defined above. Require a brief project-level note for the last state and retain the remaining-work list; follow-up owner/due date are optional. Preserve a fixed named closeout record, including drawings, schedules, estimates, evidence, changes, approvals/bypasses, outstanding items, reliability runs, warranty records and service visits. Recheck current outstanding work and capture a consistent server-saved version; concurrent changes must not produce a mixed or stale closeout.

**Check:** An unfinished installation, applicable failed/unperformed required test, required pending retest, or documented unresolved property issue prevents Completed but permits explicit Closed with outstanding items. Finishing the selected scope does not hide a deferred or out-of-scope fault. Missing approval alone does not prevent closure, and approval bypass cannot satisfy a required test/retest.

**FR-33 — Design and closeout PDF packages.** FR-33 is specified in six lettered parts, each with its own check; a reference to FR-33 means all of them. The confirmed manifest and layout details are in the addendum.

**FR-33a — Presets and contents.** Provide two presets over the saved project record:

| Preset | Contents |
| --- | --- |
| Design | Proposed labeled floor plans, retained context/planned actions, equipment and cable schedules, installation notes, survey evidence and scoped checklist expectations. |
| Closeout | Recorded installation plans/status, changes from the issued design, known settings/identifiers, removed/replaced equipment references, phase summaries, detailed current-scope test attempts and relevant earlier correction/retest evidence, notes/photos, outstanding property issues and version-specific approval/bypass records. |

The Closeout preset also carries reliability runs under FR-58, and warranty details and service visits under FR-59.

**Check:** A design package links planned device IDs to schedules and installation checks. A closeout package preserves actual conditions, failures/retests and all unresolved property issues even when a subset of floors is exported.

**FR-33b — Identification and status.** Identify property, work scope, named source revision, package edition, issue/export dates, units, included floors/sections, approval/decision cutoff and Draft/Issued or closeout status. Default to all floors. Mark selected-floor output Partial while retaining the property-wide closeout outcome and outstanding-issue summary. A pre-closeout preview remains Draft/In progress; export neither approves nor closes work and requires no approval.

**Check:** Every package states its property, work scope, source revision, edition, dates, units and included floors/sections. A selected-floor export is marked Partial and still carries the property-wide closeout outcome and outstanding-issue summary. A preview before closeout is labeled Draft/In progress, and exporting changes no approval or closure state.

**FR-33c — Defaults and honest evidence.** Include quantities and capacity estimates by default; prices/labor costs are optional and off by default. Offer separate coverage/DORI sheets with zone targets/results/shortfalls and explicit analysis basis, assumptions and limits. Property-wide capacity includes applicable retained demand. Recorded configuration and modeled coverage/capacity do not prove a field-test Pass. Keep outcomes, N/A reasons and required review/retest flags distinct; preserve unknown or unrecorded values and distinguish measured from estimated quantities.

**Check:** Optional cost/photo choices do not alter saved records, outcomes or permissions, and an incomplete package is visibly identified.

**FR-33d — Layout, photos and omissions.** Use readable Letter/A4 landscape pages, separate clean plan and coverage sheets, continued tables/notes with headings, and captioned photos initially two per page with stable device/note references. Include relevant attached photos by default; optional photos can be omitted. Excluding required photo evidence makes the output an explicitly evidence-limited summary. Identify omitted backgrounds/sections; report unavailable required files and generation failures without silently truncating evidence or declaring an incomplete package complete. Live basemap/satellite tiles are outside the default raster PDF export.

**Check:** Tables and notes continue across pages with headings, and photos carry captions with their device/note references. Excluding a required photo labels the output an evidence-limited summary. An omitted background or section is identified, and an unavailable required file or failed generation is reported rather than yielding a package presented as complete.

**FR-33e — Lifecycle and connection context.** Include retained/disconnected, reassigned, removed and unresolved connection context under FR-53, keeping historical endpoints distinct from current assignments.

**Check:** A closeout package for a scope in which a device was removed shows its retained cable as disconnected, reassigned or unresolved, with the historical endpoint distinct from any current assignment.

**FR-33f — Extended-modelling content.** Include closet equipment and port/connection schedules with current/proposed basis, reservations, known power assumptions and unresolved warnings. Show floor-to-floor cable continuations and FR-52 length/allowance breakdowns; count each physical run once in property-wide schedules and totals even when it appears on several floor sheets. Include selected plan annotations by default, with readable labels/styles and concise legends; identify optional markup omissions without hiding property-wide outstanding issues. Identify assessed camera views, unsupported panoramic outputs and illustrative footprints in analysis sheets.

**Check:** A run crossing two floors shows a continuation on each floor sheet with its length/allowance breakdown and counts once in property-wide totals. Closet and port schedules state their current/proposed basis, reservations and unresolved warnings. An omitted optional annotation layer is identified. A fisheye footprint is marked illustrative and an unsupported panoramic output is identified as such.

**FR-34 — Fixed packages and portable archive.** Generate from a consistent saved named revision or fixed closeout, resolving the initiating editor’s relevant pending/conflicting edits first. Retain the exact issued-design and closeout PDFs and their source/edition/content manifests with the property for historical download, project archival and backup/recovery. Redownload returns the retained file; regeneration or later decision information creates a new dated edition with the same fixed source and an explicit decision-history cutoff. Never overwrite the earlier package or substitute later installation edits into it.

Keep PDFs, optional materials/estimate CSVs and complete editable project backups distinct. A backup preserves captured drawings, records, attachments, named revisions, issued/closeout history and packages, continuing issues, removed devices and lifecycle evidence. Preserve stable IDs/relationships and earlier supported project data during migration; exclude access credentials and live passwords. Do not claim original drawings/photos that were never retained. Package storage/container details belong to architecture; numeric limits are in the acceptance targets. Failed generation remains visible and retryable.

**Check:** Later edits or approval decisions cannot change a previously downloaded package. A new edition identifies its source and cutoff. Reimporting a valid complete backup preserves captured evidence, archived records and retained package relationships; a PDF/CSV is not offered as an editable complete backup.

**FR-35 — Removed-device archive.** Archive after actual removal is documented; a planned Remove/Replace action alone must not archive the current installation record. Never-installed or mistakenly recorded items follow FR-55 instead. Recording the actual removal archives the device in the same step. Reversibly archive removed equipment with its captured identity/model/settings, last location, connections, installation/configuration records, tests/retests, notes/photos, and history. Record removal actor/date, optional reason, and replacement link. Exclude it from the normal active plan/schedule, coverage, equipment totals, and capacity/PoE demand while preserving previous revision/report values. Preserve and reconcile affected cable/port records under FR-53; device removal does not automatically remove cables or release ports.

**Check:** A searchable archive and optional historical plan view expose the labeled removed record; archiving never requires metadata that was not captured or deletes its evidence.

**FR-36 — Restore or replace.** Restore an archived device with the same ID/history and a recorded restoration. Give a different physical replacement a new linked ID. Do not overwrite an active replacement or automatically treat old tests as evidence of the restored installation. Cable reuse and reconnection follow FR-53. Placement on a changed, retired or unresolved floor follows FR-54; draft deletion, design cancellation and record correction follow FR-55.

**Check:** The user can follow predecessor/replacement history without mixing their identities, results, or active counts.

**FR-37 — Project archive.** Allow an inactive property project to be archived with editing paused and search/view/export retained. Preserve all device archives, revisions, closeouts, evidence, and outstanding items.

**Check:** Reading or exporting an archived project cannot change its records; un-archiving is explicit.

**FR-38 — Later work at the same property.** Reopen the same project from its latest installation into a new active named work scope and working revision with In progress status. Multiple design revisions within this scope do not create separate work cycles or duplicate costs. Retain project/device IDs and fixed prior closeouts. Create a fresh scope-specific estimate and checks; retained installed assets are not charged again merely for remaining on the plan. Keep unresolved items visible and record their later disposition. Issue and close the new work with new records; assignments can be reused or changed. A service visit can open such a scope in one step under FR-59, where the estimate is optional.

**Check:** Reopening does not restore removed devices, resolve old issues, inherit old approvals/passes, or alter previous closeout packages. New/changed work receives its own evidence. Scope selection and issue carryover follow FR-45/46.

### Existing-site surveys and upgrade planning

**FR-39 — Surveyed starting condition.** Start an existing-building project by placing existing equipment and known cable routes on its plans. Capture available asset labels, model, location, mounting, condition, connections, photos and notes. Keep stable internal IDs and legacy labels. Allow unknown attributes and distinguish old-document information, estimates, and site-confirmed observations. Save a named surveyed-baseline revision before planning changes; later visits begin from the latest installation in the continuing property project.

**Check:** A camera with unknown model or installation date can be inventoried without inventing those details or a test pass. Recording it today does not set its original installation date. Later changes preserve the surveyed baseline, provenance and device identity. Manual placement and survey entry suffice for POC intake; bulk import and automatic discovery are not required.

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

**FR-41 — Current, proposed and changes views.** Offer Current installation, Proposed design and Changes views. Current installation reflects recorded field conditions; Proposed design reflects intended end-state actions; Changes compares them and also lists cancellations and corrections under FR-55 against the issued design. Label which basis supplies each schedule and analysis result. Include applicable retained assets independently of purchase cost, and count a replacement rather than both devices in the proposed end state unless both are explicitly intended to remain. Visual layer hiding does not change the selected analysis population.

**Check:** A planned replacement leaves the old device in Current installation until actual removal and shows the new device in Proposed design without double-counting. Unknown specifications remain visibly unassessed or explicitly estimated, never silently zero demand or verified coverage. A known failed camera is not credited as functioning in a current operational coverage estimate; a planned return to service is separately labeled. Geometry/DORI remains a planning estimate. Actual work updates the field record without modifying fixed survey, issued or closeout revisions.

### Shared update integrity

**FR-42 — Concurrent edits and conflict resolution.** Allow independent items to save concurrently. Check the saved version of each edited floor/drawing basis, device, closet, port/assignment, cable run/segment, shared riser, zone, annotation, checklist definition or setting before accepting a change. If that item changed since it was loaded, retain the pending edit and show the latest saved values alongside it. Let the user accept the saved version or review/reapply selected intended changes to the latest version; check again when saving. Incoming updates must not overwrite an unfinished local form or drag. Do not silently merge or overwrite same-item conflicts.

Validate connected changes together, including devices/routes, floor contents, archive/restoration and closeout. A stale tab must not recreate a removed item, write into an archived project, or leave related records inconsistent. Record boundaries, versioning and transaction mechanisms belong to architecture.

**Check:** Two browsers can save independent camera edits. When both edit one camera, the first accepted save remains and the other becomes a visible, recoverable conflict. Concurrent evidence additions both survive and retries do not duplicate them. A stale save following removal/archive is rejected for review, and dependent changes or fixed snapshots cannot commit a partial mix of versions.

### Site-level commissioning checks

**FR-43 — End-to-end site checks.** Provide a small editable project/floor checklist for applicable end-to-end operation and final records: named devices/events reach the intended systems, scoped recordings can be retrieved, identity/time/location records align, and drawings/evidence reflect the recorded installation. Link each check to the endpoints, scope and conditions actually tested. Use the same outcome, evidence and history rules as device checks. Extra night, recovery, integration or duration checks are enabled only where scoped. Optional starters cover alarm-to-camera call-up, including whether the view or recording is available quickly enough for the project’s purpose, and handover of manuals, training, as-built records and the programming list. A handover check records that an item was delivered; it does not store the item or judge its adequacy. An optional reliability period follows FR-58. Technicians perform the tests and enter observations; the POC does not execute hardware tests.

**Check:** A sampled site check does not mark untested devices passed, a configured retention setting does not prove available recording history, and device pass totals do not automatically satisfy an unperformed required end-to-end check. Optional approval and explicit outstanding-items closeout remain independent.

### Retest follow-up and historical results

**FR-44 — Targeted retest history.** Preserve original attempts and outcomes when conditions change. Show Needs review or Retest required as separate follow-up flags linked to the triggering change, affected device/check and reason; they are not new test outcomes. A new requirement for the changed condition remains Not tested until performed, without fabricating an attempt or changing an old Pass to Fail. Unaffected checks retain their evidence.

Allow editors to add affected checks or record why a suggestion is genuinely unaffected, with actor/time and supporting context. This does not waive a still-applicable required check or unresolved failure, relabel missing evidence as Not applicable, or add an approval gate for recording actual conditions. Broader scope and issue disposition follow FR-45/46.

Record the condition and criteria actually tested with each new attempt. Clear required retesting only when current requirements/evidence are satisfied and the relevant condition has not changed again. A later concurrent change preserves the attempt but leaves follow-up for the newer context. Undo, restoration or approval bypass cannot silently restore current passing status. Required follow-ups remain in device/floor/project summaries and closeout exports; fixed prior closeouts remain unchanged.

**Check:** A camera’s dated Pass remains inspectable after its aim changes, while required image checks stay outstanding for the new aim. A valid current retest can satisfy those checks without erasing history. A further change after testing keeps the new follow-up open, and a supported record-only correction can be documented as unaffected without dismissing an unrelated failure.

### Current work scope and continuing issues

**FR-45 — Select the work scope.** Maintain one active named work scope per property work cycle, linked to its design revisions, estimate and evidence. Categorize devices/routes as Work now (add, relocate, service/reconfigure, replace or remove), Inspect/test only, or Reference only. These categories are distinct from planned action and actual installation/test state. Preselect planned changes transparently; allow scope adjustments with actor/time and a reason for meaningful changes. Recompute current costs/checks without altering fixed prior records or adding mandatory approvals.

Reference-only assets retain applicable site coverage/capacity without automatic purchase or recommissioning. Selected inspections can have checks and optional labor without equipment purchase. Review known affected dependencies under FR-28/44: changing scope cannot silently clear required checks or failures. Include affected work or explicitly defer its outstanding item. Unknown baseline details alone do not create failed tests or work orders.

**Check:** A lobby upgrade can include changed cameras, an inspection-only retained camera and reference equipment. Saving a second layout preserves the same scope and estimate. Moving an affected dependency to Reference only leaves its required retest/issue visible.

**FR-46 — Property issue carryover.** Keep stable issue IDs linked to relevant devices, checks, scopes and attempts. Carry unresolved issues into later work without duplicating them or rewriting prior closeout snapshots. Support Include now (select work/checks/costs), Defer (retain an open item with a brief reason and optional owner/due date), and Resolve (record corrective work and appropriate current evidence/retest). Preserve the original failure and link the resolution/new attempt. Service visits recorded on an issue follow FR-59.

Allow explained corrections of mistaken/duplicate issue records with actor/time and a canonical issue link where applicable. Corrections, archive, replacement or scope edits must not silently resolve genuine defects or turn prior outcomes into Pass. When removal/replacement addresses a requirement, record the actual corrective work and necessary checks. Keep deferred/out-of-scope faults visible in remaining-work lists and closeout exports; a finished scope with such issues uses Closed with outstanding items.

**Check:** A finished lobby upgrade with a deferred parking-lot fault closes with outstanding items and carries the same issue into the next scope. A valid later resolution links evidence and retains the earlier failure and closeout. Unknown legacy attributes and unscoped tests do not automatically prevent completion.

### Camera models and reusable optical templates

**FR-47 — Camera-model templates.** Let users create, edit, duplicate and search reusable camera definitions by manufacturer, model number and lens/variant, then select a definition when placing a camera. Retain the generic camera option and represent physical assets, their optical views and configured streams under FR-48. Pan/tilt/zoom ranges follow FR-57. Record image resolution as width × height in pixels for the selected capture/stream mode, fixed or adjustable/varifocal lens type, focal length or supported focal-length range, and horizontal/vertical field of view in degrees with their applicable mode/focal setting. Store active imaging dimensions in millimeters when known, and distinguish them from nominal sensor-format labels. Preserve specification source and unknown values; incomplete templates must not silently become verified generic specifications.

A fixed-lens profile uses its defined focal length. A varifocal profile supplies supported limits and a selected focal setting for each placed camera; changing it updates the supported coverage/DORI calculations. Require sufficient consistent optical data for the evaluated setting, disclose approximations and flag unsupported/missing input. Selecting a lower-resolution/cropped mode uses that mode’s pixels and framing, not automatically the model maximum. Model FoV angles are distinct from physical scene width/height, which are calculated at a stated distance/plane.

Keep location, mounting height, aim/tilt, selected operating mode/focal setting and site conditions on each camera instance, with reusable defaults where useful. Analysis also uses the existing target plane, obstructions, zones and DORI convention; model specifications alone do not certify on-site performance. Preserve template identity/version or captured values with each instance/revision, evidence and backup. Later template edits must not silently change placed/issued/tested cameras; explicitly applying changed values follows the existing change/retest rules.

**Check:** An engineer searches a known model number and places two uniquely identified cameras using its specifications. A fixed-lens instance cannot masquerade as a continuously adjustable lens; two varifocal instances can use different supported focal settings and produce their respective coverage/DORI results. A resolution/mode change uses the correct pixels/framing. Missing optical inputs stay visible, physical FoV dimensions identify their distance, and a later template edit leaves fixed historical designs and evidence unchanged.

### Multi-head and panoramic camera support

**FR-48 — Physical cameras, views and streams.** Keep one physical asset with stable child view IDs and associated configured streams. A pan/tilt/zoom camera is a single-view camera under FR-57, not a multi-view arrangement. Preserve device cost, mounting/history and actual hardware demand independently of view/stream count. Supported heads retain individual resolution/mode, lens limits/setting, bearing, tilt and condition; a shared mounting point for a compact body is a disclosed approximation. Model templates can preset these views without multiplying purchased bodies.

| Arrangement | POC support |
| --- | --- |
| Independent conventional heads | Analyze each eligible rectilinear head using its own inputs; combine under FR-12–15 and expose which head supplies the result. |
| Single-sensor fisheye | Catalog and place the device; show a clearly illustrative 360-degree/directional preview only when mounting, angular extent and chosen range are known. DORI is Not assessed. |
| Stitched panorama | Keep source-head and composite-output profiles distinct. Evaluate usable supported source heads explicitly; do not attribute those results to a different stitched recording. Composite DORI is Not assessed. |

Detailed calibrated fisheye/stitched DORI is follow-on scope, requiring a supported projection and effective-sampling profile. Do not substitute 360 degrees into rectilinear optics, distribute total megapixels among invented sectors, or infer extra captured detail from dewarping/upscaling. Manufacturer distances remain conditional references, not automatic full-floor contours. Not assessed is an analysis status, not a fifth commissioning outcome.

Preserve parent/view/stream identities, selected profiles and source distinctions through revisions, evidence, exports and backup. Per-head or shared-hardware changes follow existing targeted retest rules. Keep failed/unknown head conditions visible for the chosen analysis basis; actual device archive/replacement and cable-lifecycle rules in FR-35/36/53 apply; changed-floor placement follows FR-54; draft deletion and correction follow FR-55.

**Check:** A four-head template creates one physical camera with four independently inspectable views, using each head’s own resolution and optical settings. It does not lose heads through duplicate analysis IDs or inflate body cost/PoE. A fisheye preview remains visually distinct from assessed DORI, receives no target credit and does not cause unsupported exclusions to be reported as proof of blindness. Historical issued views/results remain unchanged after later edits.

### Additional equipment and linked openings

**FR-49 — Door/gate and component records.** Give a door or gate its own physical opening identity, location and available model/details. Link selected readers, contacts, locks/strikes, request-to-exit devices, intercoms, controllers, power supplies or custom equipment, with side/direction labels where useful. Linked components remain individual physical records with their own IDs, locations, costs, planned actions, installation/configuration/test state, notes/photos and history. A shared controller or power supply can serve several openings without being cloned or charged for each link.

Find the associated records from the opening and identify their relationships in schedules/exports while preserving individual component IDs. Associations express the planned/recorded relationship; they do not automatically create cables, switch ports, hardware quantities, power demand or a fixed component bundle. An explicitly priced door/gate can have its own cost, but component costs must not be counted again as an implicit assembly total. Retained assets and work categories follow the existing scope rules.

Unknown specifications stay unknown or explicitly estimated. Use documented device/connection traits for applicable capacity inputs; a linked reader/contact/lock is not automatically an IP/PoE endpoint. Cataloging a controller, PSU or NVR does not add a wiring simulator, electrical-load calculation or guaranteed recorder-performance model. Explicit closet/port planning follows FR-51.

Editing a link does not remove/archive its component, transfer its evidence or imply installation/test completion. Preserve relationships in revisions and recorded evidence; meaningful changes follow existing history/retest rules. Gate/door operating checks use project-defined expected behavior. Apply current device lifecycle and FR-53 connection/dependency rules individually; changed-floor restoration follows FR-54; draft deletion and correction follow FR-55.

**Check:** Door D-01 links to its reader, contact, lock and controller, with separate records and costs. Linking the same controller to Door D-02 does not create a second controller purchase or device demand. A retained door can receive a proposed new reader without becoming a new door purchase or a passing installation. Removing an association preserves the component and its prior evidence; no physical cable or port is fabricated.

### Site annotations and plan measurements

**FR-50 — Site annotations.** Provide named fence/perimeter lines or polylines, entrance markers and direction arrows, and short text/callouts with optional leader lines. Reuse existing zone polygons for named parking/loading/restricted or other areas, with DORI targets optional. Allow simple two-point dimensions using a known map/plan scale, with units and an explicit plan-derived estimate label; unknown/unverified scale remains visible rather than yielding a precise-looking physical length. Preserve field measurements as distinct survey observations.

Attach each mark to its selected plan/floor, including outdoor site plans, with a stable ID, name/type, geometry and note/reference. Support selection/movement, point/text editing, basic colour/line style, locking, deletion and annotation visibility. Extend existing save/conflict/undo/revision rules, keeping labels intelligible without colour alone. Include annotations in selected PDF plan sheets by default and preserve geometry/references in editable backups and named revisions.

An annotation may reference an existing opening/device/survey record without creating another asset or moving the physical record. Deleting or hiding markup does not delete linked records, issues or evidence; earlier fixed revisions remain unchanged and outstanding-work summaries stay visible under the export rules. A dimension is not a routed cable or supply quantity.

Keep drawing intent separate from analytical functions: use explicit wall/obstruction records for visibility blocking, zone settings for DORI targets and cable records for routes/costs. Markup alone does not change coverage boundaries/results, equipment counts or power demand. Visibility is a presentation choice; arrows do not calculate routes or validate an operating sequence. Specialist CAD constraints and symbol libraries are outside this annotation scope.

**Check:** A North perimeter fence line, a vehicle-entrance marker linked to Gate G-01, a named zone and a survey-photo callout remain identifiable after save/undo/reload/export. The line casts no modeled shadow until an explicit obstruction exists. A dimension with no valid scale reports that limitation, and deleting a callout preserves its referenced photo/issue. Hiding markup does not hide required outstanding-work summaries or change analysis.

### Closets, ports and connection planning

**FR-51 — Closet and port schedules.** Create named network/security equipment locations with stable ID, building/floor/map location, notes and survey references. Group individually identified cabinets, switches, controllers, recorders and power supplies; keep physical containment distinct from remote devices served. A closet adds no implicit hardware cost/load, and a group/name change does not move installed devices or redraw routes.

Provide a manual switch-port schedule with model-sourced or entered labels/types/capabilities, endpoint/interface or peer-switch assignment, reservations, cable/termination references and notes. Keep allocation (free/reserved/assigned) distinct from availability/condition (usable/unavailable/unknown); preserve an existing connection on an unavailable port with its warning. Identify conflicting direct connections, missing references and known type/PoE incompatibilities. Unknown inventory or unmodeled shared-connector behavior must not produce an exact available-port count. Count uplinks at their actual ports on both ends; optical links carry no PoE.

Permit planned assignments across floors before routes exist, with missing physical route/verification clearly identified. Preserve Current installation and Proposed design assignments separately. A linked cable's endpoint/port context must agree or show a discrepancy. Closet membership, an opening association or a passive patch label does not establish network connectivity. Keep controller terminals/local power separate from Ethernet interfaces; controller-wired devices do not automatically consume IP ports, and Ethernet exclusivity rules do not substitute for control-bus/terminal validation.

Record separate total-switch PoE budgets, per-port limits/allocations and load assumptions with source/basis. Compare compatible values; distinguish rated/maximum planning demand, allocation and observed/typical consumption. Show known subtotals, reservations and unknown demand without inventing conversions or treating missing input as zero. A named planned device contributes once; an unnamed reservation can have an explicit allowance or unknown demand. Separate current load from proposed reservations. Known headroom with unresolved loads is an incomplete assessment, not a guaranteed capacity pass. Preserve property-wide demand while filtering locations and retain separate hardware/view/stream counting rules.

Apply shared conflict/dependency safeguards to assignments so concurrent editors cannot silently claim the same direct port connection. Changes must not erase dependent assignments or prior evidence; retain pending edits and show affected connections for resolution. Preserve closet/port/assignment identities and context in revisions, exports and backups, including source basis, reservations and warnings. Port edits follow meaningful-change/retest rules; they do not record installation or a field-test Pass. Cable/port archive, replacement and reconnection behavior follows FR-53; changed-floor restoration follows FR-54; draft deletion and correction follow FR-55. Live discovery/configuration, automatic assignment, full rack/patch graphs and detailed electrical/traffic calculations are outside this POC extension.

**Check:** IDF-2 groups its actual equipment without duplicate purchases. SW-02 port 05 can be planned for a camera on another floor while its route remains missing; port 06 can be reserved with unknown power. Conflicting claims are surfaced, an unavailable connected port retains its record, and unknown loads prevent a reassuring complete capacity result. A controller terminal reference does not fabricate an Ethernet port or PoE source. Export and restored revisions preserve these distinctions.

### Inter-floor cable routes and allowances

**FR-52 — Physical runs, length components and supply quantities.** Represent one physical cable run with a stable ID, cable family/specification, physical terminations and associated device/interface references. Draw ordered horizontal segments on their respective scaled floors, joined by named riser/continuation points with stable identities and from/to floors. Do not infer an inter-floor diagonal from unrelated plan coordinates. Multiple runs can reference one riser; each retains its own length and is counted once across sheets.

Enter inter-floor transition lengths and endpoint rises/drops with units and measured/estimated source. Drops connect the routing elevation to the actual termination; do not blindly add full mounting height. Count each physical portion once, including offsets/detours; use a complete vertical span or its component spans, not both. Unknown scale or required length components make the estimate incomplete, with the known subtotal visible; explicit zero means no additional length. Keep migrated horizontal-only routes labeled with their limited basis until reviewed.

Use route subtotal R = horizontal segments + inter-floor transitions + endpoint rises/drops. Suggested supply Q = R + fixed service loops/extra length + (selected percentage × R). Identify fixed extras by location/purpose and apply the percentage once, excluding fixed extras; do not stack floor/run/project slack. No floor height or percentage is prescribed. Keep selected supply quantity/basis and any ordering/reel rounding separate; preserve manual overrides and flag affected changes for review. Retained cable is not automatically purchased, and relocation is not automatically priced as a length difference. Separately purchased patch/equipment leads must not also be included in run allowances. A fixed run does not by itself represent a complete tested channel.

Keep measured installed length with its source/context separate from the prior design estimate. Do not add design slack to an already measured total. Preserve Current installation and Proposed design context, run/segment/riser identities, revisions, backups and guarded dependent edits. Physical changes can trigger appropriate retests under FR-44; drawing or measuring a route does not mark it installed or passed.

Show missing segments/landings, unknown scale/lengths, mismatched assignments and known type/length-limit violations. Compare limits only on matching stated bases; no universal limit applies to all cable families. Export per-floor continuation labels and a property-wide schedule of run IDs, terminations/ports, floors/risers, horizontal/vertical/drop breakdown, fixed extras, percentage/base, suggested and selected supply quantities, measured length and completeness. Aggregate each run once by cable type and work scope, with partial-sheet context disclosed. Automatic 3D routing, pathway-capacity calculations and detailed fiber-core/breakout engineering are outside this POC scope. Device/archive endpoint changes follow FR-53.

**Check:** A run with 20 m and 12 m horizontal segments, a 6 m transition and 2 m drops has R = 40 m; 2 m fixed loops and an explicitly selected 10% give Q = 46 m, with no duplicated floor/run slack. This is an illustration, not a default. The same run appears on two sheets but once in totals. Removing a required transition value leaves an incomplete estimate; recording a measured installed total preserves the estimate without adding slack again.

### Cable connections through device lifecycle changes

**FR-53 — Retained runs and explicit endpoint changes.** When actual device removal is recorded, show known affected cable ends, interfaces, port/terminal assignments and dependencies. End the removed device’s active association and retain its historical connection. Keep each cable’s stable run ID, route, lengths, notes and evidence by default; mark unresolved current endpoint/disposition Needs connection review. Permit explicit retained/disconnected or unassigned, reused/reassigned, actually removed/retired, or unresolved dispositions. Do not require an invented answer to record actual device removal. Archive a cable only when its actual removal/retirement is documented. Planned actions affect proposed intent, not current connections or occupancy.

A different physical replacement device gets a new linked ID. Explicitly select retained cables/terminations/ports to reuse, validating context, known compatibility and conflicts. Retained physical cable keeps its run ID with dated endpoint history; a different replacement cable gets a new linked run ID. Do not duplicate purchases or transfer the predecessor’s installation evidence or passing results. Keep physical termination references distinct from logical associations, including unchanged outlets/patch panels when a device or lead changes.

Restoring the same device preserves its ID/history and presents prior connections as historical choices. Reconnect explicitly after checking the selected location under FR-54, active cable/termination, current availability, compatibility and active replacements. Do not reclaim a reassigned port, overwrite another device’s connection or resurrect a removed cable. Unresolved connections remain visible for follow-up.

Separate device demand from port occupancy. Remove the archived device’s demand under FR-35 without declaring its former port free. Preserve known occupancy/reservations or unresolved availability until explicitly released/reassigned. A historical device link is not a current assignment; unknown remaining endpoints/load do not become zero. Removing shared equipment flags known dependent connections for reconciliation without archiving downstream devices, erasing their demand/evidence or asserting unsupported functional failures.

Apply existing shared-edit/dependency safeguards to concurrent archive, release, reuse and restore actions. Record actor/time and meaningful change context; preserve previous tests and fixed issued/closeout packages. Current changed/restored connections receive appropriate review/retest under FR-44, with unresolved installation issues handled through established scope/closeout rules. Show dispositions and historical/current distinctions in plans, schedules, revisions and backups. No approval gate or automatic field-test Pass is introduced.

**Check:** Archiving CAM-01 preserves CBL-014 and its history, ends CAM-01’s active association and leaves unresolved disposition visible; switch port 05 does not automatically become free. Explicitly reusing the cable for CAM-02 retains the cable ID without duplicating its purchase. Restoring CAM-01 cannot steal CAM-02’s assignment or inherit a current Pass. Removing a shared switch flags known connections without archiving its downstream devices.

### Restoring devices onto current floors

**FR-54 — Confirmed destination and preserved location history.** Restore an individual archived device with its existing ID/history, separately from whole-project revision restoration. Require a valid current floor in the same property and an explicitly confirmed position before completing active restoration. Match the original floor by stable identity, not name. On an unchanged or merely renamed floor, preview the former position for confirmation. On a replaced drawing or changed scale, alignment or layout, require placement review/repositioning; uncertain old coordinates must not become an invented current position.

If the original floor is retired, let the user reinstate it under FR-56 or choose another current floor. If it cannot be resolved, for example after migration or import, let the user choose an existing floor or create one through the normal workflow and then place the device. Do not automatically recreate a missing floor or treat a new same-named floor as the original. A retired floor must be reinstated under FR-56 before it can be the destination. If placement is not ready, allow cancellation leaving the device archived and its history intact; a separately created floor remains a separate action. Do not add a separate unplaced-device queue for this POC. Unknown scale/drawing inputs remain disclosed rather than fabricated to permit restoration.

Preserve the former floor identity/label, location, captured plan/revision context and dated evidence. Record the new placement, actor/time and meaningful change context without relabeling old photos/tests as evidence at the new location or changing fixed historical packages. Display a historical drawing only when retained; missing historical context stays unavailable. Selecting a point does not certify physical location accuracy, installation or a field-test Pass, and restoring the same asset does not create a replacement purchase.

Apply FR-53 to connections: review affected endpoints, drops and riser references without deleting retained runs, moving unrelated segments, inventing inter-floor paths/lengths or reconnecting automatically. Recalculate supported analysis using the selected context and known inputs, disclosing unresolved assumptions. Actual return to service/relocation receives appropriate checks under FR-28/44; a supported drawing-only correction does not establish a physical move. Validate the current floor/drawing/device/dependencies at save; preserve pending choices for review if they changed or the destination was deleted. Un-archive an archived project under its existing policy before editing it.

**Check:** Restoring CAM-01 after its Floor 2 drawing is replaced requires placement confirmation on the current drawing while preserving the old location/photo/test context. A renamed floor retains its identity; a new Floor 2 cannot silently substitute for a retired or unresolved one. Cancellation leaves CAM-01 archived, and a concurrent destination change prevents a stale restore. Previous cables/ports and test passes are not automatically reinstated.

### Deleting, cancelling and correcting draft records

**FR-55 — Draft deletion, design cancellation and record correction.** Offer the removal action that matches a placed record’s history, not its existing/proposed label. This applies to equipment, openings, closets and cable runs; annotation deletion follows FR-50.

A record has history when it carries notes/photos, test attempts or linked issues, has recorded installation or configuration work, or was included in an issued design, surveyed baseline or closeout record. Lifecycle stage alone is not history.

| Record history | Action | Treatment |
| --- | --- | --- |
| No history | Delete draft | Remove from the working design without a required reason. Guarded own-session undo under FR-21. |
| A Proposed device with history, never recorded as installed, whether or not it was in an issued design | Cancel from design | Remove from the working design with a short reason, actor and time. Its notes and photos are kept. Where it was in an issued design, that design is unchanged and the cancellation appears as a change from it. |
| Recorded in error and carrying history | Correct record | Mark as mistaken or duplicate with a reason, actor, time and a canonical-record link where applicable. Retain its evidence and prior fixed context. |
| Actually installed and then physically removed | Archive | FR-35 applies unchanged. |

A recorded installation or configuration mark made in error can be reversed with a reason, actor and time. The device and its history are kept, a device marked Installed in error returns to Proposed, and its evidence and test attempts stay in place with Needs review under FR-44. Reversal is a correction: it removes and archives nothing.

A just-placed existing-condition record with no such history is deletable like any other draft. Appearing only in an ordinary named revision does not block deletion; that revision keeps its copy. An isolated eligible placement is removed directly, without a confirmation dialog. When dependencies exist, preview them before committing.

Remove dependent routes, port reservations/assignments and associations with the record only when they are themselves eligible drafts. Never cascade into cables that have history, occupied ports, shared equipment, linked components, survey evidence or issues. Detach them and keep them, and mark the affected cable ends and port assignments Needs connection review under FR-53. Deleting a multi-view camera removes its own draft views and streams, not other assets. Do not give a deleted record’s ID to a different record.

Undo restores the deleted draft and its uncontested draft relationships. It cannot reclaim a port or relationship since assigned elsewhere, overwrite later edits or assert a physical connection; such relationships stay unresolved for review. None of these actions records a physical removal, archives an asset, releases an actual port, resolves a property issue or changes a test outcome. Cancellation and correction are history entries, not approval gates. Recompute the current proposed estimate, capacity and checks; fixed revisions, issued designs and closeouts keep their values. Validate the record and its dependencies at save under FR-42; a stale client cannot recreate a deleted record. Deleting or retiring a floor together with its contents follows FR-56.

**Check:** A camera placed by mistake is deleted in one action and returns with undo. Deleting a draft camera with a draft-only route and port reservation previews and removes all three, while a retained cable attached to another draft is detached for review rather than deleted. A proposed reader in the issued design offers Cancel from design, not Delete draft, and the issued package is unchanged. A duplicate surveyed camera with a photo is corrected with a reason and keeps the photo. Undo after another editor has taken the port restores the device without that assignment.

### Deleting and retiring floors, and moving records between floors

**FR-56 — Floor deletion, retirement and moves.** Offer the floor action that matches what the floor holds. Never remove a floor by cascading over records that carry history.

| Floor contents | Action | Treatment |
| --- | --- | --- |
| Empty, or holding only items eligible for Delete draft under FR-55, with no floor-level notes/photos, and never included in an issued design, surveyed baseline or closeout | Delete floor | Preview the counts, then remove the floor and its contents. Guarded own-session undo under FR-21. |
| Any active record that is not eligible for Delete draft under FR-55 | Blocked | List each blocking record with the action it needs: cancel or correct under FR-55, move to another floor, or archive after actual removal under FR-35, or FR-53 for a cable run. |
| No blocking records, but history remains: archived devices, cancelled or corrected records, floor-level notes/photos, or inclusion in an issued design, surveyed baseline or closeout | Retire floor | Remove any remaining draft-only items first, with a preview. Remove the floor from the active floor list, current analysis and current totals. Keep it read-only with its drawing for historical views. It can be reinstated with the same identity. |

The drawing overlay, zones, obstructions, annotations and analysis settings are removed with a deleted floor and kept with a retired one. A draft cable segment on a deleted floor is removed and its run is marked incomplete under FR-52; a run with history under FR-55 blocks deletion, and a run without history is removed like any other draft. Issues linked to a retired floor stay open and visible at closeout under FR-46. Removing a building applies these rules to each of its floors. Named revisions, issued designs, closeouts and their retained packages keep their copy of the floor in every case.

Move selected equipment, openings, closets and survey notes to another current floor in the same property, keeping their IDs, evidence and history. Require an explicitly confirmed position on the destination. For a record with history, identify the move as a record correction, with a reason, or as an actual relocation; an item eligible for Delete draft moves without either. A correction keeps existing evidence applicable and triggers documentation review only. An actual relocation preserves the former location and flags affected checks under FR-28/44. A planned future relocation remains a planned action under FR-40. Cable runs and port assignments are not moved or rerouted automatically; affected endpoints, drops and riser references are marked for review under FR-52/53.

Retiring, reinstating or moving is a history entry with actor and time, not an approval gate. None of these actions records a physical removal, archives a device, resolves an issue or changes a test outcome. Restoring an archived device follows FR-54; a retired floor must be reinstated before it can be the destination. Validate the floor, its contents and dependencies at save under FR-42; a stale client cannot recreate a deleted floor or write to a retired one.

**Check:** A floor added by mistake with two draft cameras is deleted after a preview and returns with undo. A floor holding an installed camera that has history cannot be deleted; the camera is listed with its available actions. After that camera’s actual removal is archived, the floor can be retired and still shows the camera’s former location and photo in the historical view. A surveyed camera recorded on a duplicate floor is moved to the correct floor as a correction and keeps its ID, photo and test history without a new retest flag, while its cable endpoint is marked for review. A deferred issue on a retired floor still appears in the closeout’s outstanding items.

### Pan/tilt/zoom cameras

**FR-57 — Resting view, stored positions and reach.** Represent a pan/tilt/zoom camera as one physical asset with one view and its configured streams; it is not a multi-view camera under FR-48. Its model template under FR-47 adds the pan range, the tilt range and the zoom range, given as the widest and narrowest field of view or the equivalent focal-length range. Each placed camera can carry its own pan and tilt limits within the model’s range. Unknown ranges and limits stay unknown.

Let each placed camera hold named stored positions, each with pan, tilt and zoom, and mark one as home. The home position is the resting view. Analyze it under FR-10 as a varifocal camera at the home settings; it is the only view of this camera counted in combined coverage, DORI and zone results under FR-12–15. Until a home position is defined, the camera contributes no assessed coverage and is disclosed as unassessed under FR-13. Any other stored position can be previewed with its own coverage and DORI. A preview is labeled as such and changes no counted result.

Show the camera’s reach as a separate layer labeled reachable on demand: the area it could view within its limits, analysis range and modeled obstructions at the selected target height. Reach is never counted as covered or as overlap. Where an area within reach is otherwise uncovered, identify it as reachable on demand instead of as having no camera view. Within reach, show the best detail achievable at the narrowest field of view, labeled as achievable in one place at a time. This is not a DORI coverage result. Without sufficient optical data, show the reach outline alone with detail Not assessed.

A zone shows its counted result as today and, separately, which cameras can reach it on demand, how much of it and at what achievable detail. Judge the zone’s target on the counted result only.

Provide a pan/tilt/zoom starter under FR-29: limits stop where intended; pan, tilt and zoom controls operate; each stored position shows its intended scene; the camera returns to home where that is configured; and limits or positions keep it from facing bright light sources. An alarm-driven position is checked only where scoped under FR-43. Changing a stored position or limit on the installed camera is a meaningful change under FR-27/28 and flags the checks for that position; a proposed edit updates the design without flagging field checks. Changing the home position also changes counted coverage and the zone results that depend on it.

Count one device, its documented power demand and its configured streams under FR-19; stored positions multiply nothing. Preserve positions, limits and the home designation through revisions, evidence, exports and backups, and identify the resting view, previews and reach distinctly in analysis sheets under FR-33f. Guard tours, auto-tracking, time-share coverage figures and live control of a camera are outside the POC.

**Check:** A roof camera with its home position on the car-park entrance contributes only that view to combined coverage and to the entrance zone. The loading-dock zone, within reach but outside every counted view, keeps its counted shortfall and separately shows that the camera can reach it on demand with its achievable detail; that line does not meet the target. Previewing a second stored position changes no totals. Narrowing a pan limit shrinks the reach. Changing the home position changes counted coverage and flags that position’s checks. The camera remains one device with one power demand.

### Optional reliability period

**FR-58 — Reliability period and downtime log.** Offer an optional site-level check, off by default, for a period of observed operation after testing. A period is one or more stages. The project defines what the period covers, the number of stages, what counts as downtime, and each stage’s planned duration and availability target. Prescribe none of these. Each stage is a site-level check with its own attempts under FR-31 and FR-43. It is required or optional on its own and counts in project-level Testing progress, not in any device’s.

A person records the start and the end of each run. A run in progress has no outcome and is not yet an attempt; it becomes one attempt when its end is recorded, unless it was stopped for a reason other than failure as described below. The POC observes nothing itself: it has no automatic monitoring, alerts or connection to the installed system.

Log each outage during a run as a separate entry with what was affected, its start and end time, a description and a linked issue under FR-46. Each entry states whether it counts toward availability under the project’s definition, with a short reason when it does not. Every entry stays visible in the run and in exports. An outage with no recorded end counts as continuing. Entries added by different participants coexist.

Compute availability as the time not down divided by the total elapsed time of the run, as a percentage, from the counted entries; overlapping entries are not counted twice. Show it beside the target with the counted and uncounted downtime totals, and mark it provisional while the run is open. Availability is never entered by hand.

Apply the outcomes of FR-30. A Pass requires a recorded start and end, the full planned duration and the target met. A full run that misses the target is Fail. A run stopped because the system failed to perform is Fail with an explanation. A run stopped for another reason is kept with its log and the reason. It has no outcome and is not an attempt, and the check’s outcome is unchanged. A stage with no duration or target defined shows Needs definition and cannot pass. Repeating or restarting creates a new attempt and keeps earlier attempts and their logs. Changing the definition or target afterwards does not rewrite a recorded outcome.

Allow a run to start while work is outstanding, with a warning listing the outstanding required checks, retests and open issues in the covered scope. Show an actual change to covered equipment recorded during a run on that run, and flag the check Needs review under FR-44, linked to that run; a participant records whether the run continues or restarts, with a reason. Neither case is blocked and no approval is added.

Treat each stage as required or optional like any other check. FR-32 is unchanged: a required stage that is running, failed or not started prevents Completed and permits Closed with outstanding items. The Closeout package shows each run’s dates, planned and actual duration, downtime log, availability, target and outcome under FR-33a.

**Check:** A project enables a one-hour, single-stage period with a 99% target. A technician starts it, logs a three-minute counted camera outage linked to an issue, and ends it: availability shows 95%, the attempt is Fail and the issue stays open. After the correction, a restarted run with no downtime passes, and both attempts appear in the Closeout package. An uncounted entry stays visible without changing availability. Moving a covered camera during a run flags the check for review without stopping the run. A run stopped early for scheduling reasons is kept with its reason and leaves the check’s outcome as it was. A stage with no target shows Needs definition and cannot pass. While a required stage is unpassed, the scope can close only with outstanding items.

### Warranty records and service visits

**FR-59 — Warranty and service-visit records.** Record an installation warranty on a work scope: its term, start date, provider and a note. The start date defaults to that scope’s closeout date and can be set to another date. Until its start date, a recorded warranty is Not started. By default it covers equipment and cable newly installed in that scope, and the covered items can be adjusted. Optionally record a manufacturer warranty on an individual device with its own term, start date and provider. A device covered by more than one warranty shows each separately.

Calculate each warranty’s end date and its status as of a stated date: Not started, In warranty, Expired or Unknown. Equipment with no warranty recorded is Unknown, never Expired; this includes surveyed existing equipment. Changes to a warranty record are history entries with actor and time. Show warranty details on the device record, as an optional schedule column and in the Closeout package, and show the status for information when an issue is raised on a device. Warranty status is a recorded calculation, not a contractual determination.

Record service visits as separate entries on an issue under FR-46. Each visit holds when and how the fault was reported, when the visit took place, the fault found, the work done, the parts used, the time spent, who attended and whether the visit was under warranty: Yes, No or Unknown. Suggest that last value from the warranty records as of the visit date and allow it to be changed. An issue can hold several visits; concurrent additions coexist and corrections preserve earlier entries.

A visit does not resolve its issue. Resolution still requires the recorded corrective work and appropriate current evidence or retest under FR-46. Actual changes made during a visit are recorded and flagged under FR-27/28, and a part that is itself a replaced device follows FR-36 and FR-53. Parts used and time spent are records only: they change no estimate and produce no invoice.

During an open work scope, record visits in that scope. When no scope is active, a single Start service visit action reopens the project under FR-38 into a new work scope marked as service, with a default name and the issue included. The mark is a label; the one-active-scope rule, the scope’s closeout under FR-32 and all history rules are unchanged, and an estimate for the scope is optional. An archived project is un-archived under FR-37 first. Earlier closeout records and their warranty details stay fixed.

Expiry reminders, response-time or service-level tracking, spares stock and contract management are outside the POC.

**Check:** A scope closes with a 12-month installation warranty, and its new cameras show In warranty from the closeout date with the calculated end date. A surveyed existing camera with no warranty recorded shows Unknown. Months later a fault is reported with no scope active: Start service visit reopens the project into a service scope with the issue included. The technician records the reported and visit times, the fault found, a replaced power supply, the time spent and a suggested under-warranty value of Yes. The issue stays open until a current check passes. The estimate is unchanged. A second visit on the same issue is kept beside the first, the original closeout record is unchanged, and the service scope’s closeout shows both visits.

## Experience and cross-cutting quality

Preserve the selected [white/teal map-first direction](../../../../design-mockups/04-map-overlay-studio.png): project/floors/layers, central map and drawing, contextual properties, and direct placement tools. In windows narrower than 1280 px, the field view supports locating a device, viewing its requirements and recording work, photos and results. The design workspace supports detailed design and comparison. These are POC quality targets, confirmed in the acceptance targets, not production service commitments.

- **NFR-1 — Record integrity.** Stable device/view/stream IDs and revision associations must survive save/reload, restore, export/import, archive, replacement, and reopening. Fixed issued/closeout records and prior evidence remain unchanged by later edits.
- **NFR-2 — Shared-save clarity.** Saved means acknowledged, durably persisted shared records and associated attachments that survive browser closure and an ordinary service restart. Conflicts and failed saves remain visible; pending input survives while the page is open. Never silently overwrite another participant’s work or declare an incomplete upload saved. Distinguish pending local changes from server-saved state. A saved change appears in other open browsers within 5 seconds and a save is acknowledged within 2 seconds. Back up the server automatically each night, retain backups for 7 days and demonstrate one restore during acceptance. Browser-close recovery of unsaved input, durable offline capture, uptime and recovery of changes newer than the last nightly backup after server loss are not promised.
- **NFR-3 — Usability and accessibility.** Support the mixed field-device workflow with readable controls, labeled inputs, keyboard access where applicable, and status indicators that do not rely on color alone. Support the confirmed browser and screen-size matrix. Window width decides the layout, not the device: a window at least 1280 px wide gets the design workspace, and a narrower window gets the field view, which supports field work only. Meet WCAG 2.1 AA for forms, lists, schedules and the field view; map-canvas drawing is exempt provided every device is reachable through the schedules. The matrix and checks are in the acceptance targets.
- **NFR-4 — Honest analysis and responsiveness.** Use bounded analysis, disclose unsupported inputs, sampling and effective resolution, and keep controls usable during import/analysis/export. Meet the confirmed response-time targets on the acceptance fixture and remain functional up to the supported ceiling; no promise is implied beyond it.
- **NFR-5 — Demo access boundary.** Enforce the confirmed project-edit and revision-review permissions on the server for records, drawings/photos, and other files. Reject revoked links and access outside their project/revision scope. Display names are unverified attribution; anyone holding a link can exercise its permissions. Use sample or sanitized nonconfidential data, keep live credentials out of notes and exports, and require a separate access/data decision for confidential client use. The HTTPS hosting vendor remains an architecture choice; individual accounts are not required.
- **NFR-6 — Consistent deliverables.** Exports identify their source revision and units, retain readable labels/legends and evidence relationships, and report failures rather than silently presenting incomplete output as complete. Retain exact issued/closeout package files; later regeneration creates a separately identified edition under FR-34.

## POC success and acceptance

The acceptance exercise uses a representative property with multiple floors, cameras and other equipment, an obstruction, a required coverage zone, routes, cost/capacity assumptions, and survey evidence. It includes an existing-site survey with unknown details, retained equipment/cable, and a planned replacement that becomes documented actual work, then follows the four journeys through later work. The confirmed fixture, ceiling and targets follow the measures below.

| Measure | Acceptance evidence |
| --- | --- |
| SM-1 — Complete workflow | UJ-1 through UJ-4 can be completed, including the solo-user/no-handoff path, in the shared project without file exchange as the primary collaboration method. |
| SM-2 — Preserved history | No silent historical mutation across representative field moves, checklist edits, retests, replacement, archives, restore, and reopening. Stable identities and fixed records remain inspectable. |
| SM-3 — Honest outcomes | Bypass, not installed, Fail, Not tested, Not applicable, explicit outstanding-item closeout, and reopening produce distinct correct status and export evidence. |
| SM-4 — Cross-device field use | Saved changes appear on another supported device; separate-item edits and evidence additions coexist, same-item conflicts preserve pending input, and guarded undo does not erase others’ work. A technician can locate equipment and record evidence; save failure is visible while pending input remains available in the open page. |

Counter-metrics: more green indicators, a higher modeled coverage percentage, or faster closure must not hide failures, unresolved work, calculation limits, or unverified attribution. Reducing data entry must not erase device history, necessary evidence, or estimate distinctions. Acceptance covers the FRs and NFRs within the agreed fixture/limits; the draft itself is not an acceptance pass. No application tests or builds were rerun for this documentation work.

### Acceptance fixture, supported ceiling and targets

Confirmed 2026-11-18 (OQ-9). The fixture is the project actually exercised for acceptance; the ceiling is the largest project the POC is expected to handle without failure. Beyond the ceiling, behavior is unsupported rather than promised. None of these targets has been measured yet.

| Area | Acceptance fixture | Supported ceiling |
| --- | --- | --- |
| Property | 2 buildings, 4 floors and 1 outdoor site plan | 10 floors |
| Equipment | 60 devices, including 30 cameras (one four-head, one fisheye, one pan/tilt/zoom) | 300 devices; 100 cameras per floor |
| Cabling and network | 40 cable runs (2 inter-floor), 2 closets, 3 switches | 300 cable runs |
| Evidence and markup | 40 photos, 6 security zones, 10 annotations | 300 photos; 6 per note |
| History | 3 ordinary named revisions, 1 surveyed baseline, 2 issued designs, 3 closeouts, 3 work scopes (initial, upgrade and service) | 50 named revisions |
| Concurrent editors | 3 browsers | 5 browsers |

The fixture also carries these conditions: an existing-site survey with unknown details, retained equipment and cable, an obstruction, a targeted zone, field changes, a failed test and retest, a replacement, a removal and restoration, a reopened upgrade scope, a deliberately short reliability period with one logged outage and one restart, and a warranty record on the first scope with two service visits on one issue in a service scope opened by the one-step action.

| Area | Target |
| --- | --- |
| Browsers | Latest two versions of Chrome, Edge, Firefox and Safari on desktop; Safari on iPhone and iPad; Chrome on Android. |
| Screen sizes | Window width decides the layout, not the device. A window at least 1280 px wide gets the design workspace, which supports design and field work. A narrower window, down to 360 px, gets the field view, which supports field work only: locating a device, viewing its requirements, recording work, photos and results, flagging a moved device or route for a plan update, raising an issue, logging a reliability outage, starting and recording a service visit, and reviewing or approving through a reviewer link. Closeout, restoring an archived device and anything that needs a position on the plan require the design workspace, so a phone or a narrow tablet can flag a move but not make it. |
| Accessibility | WCAG 2.1 AA for forms, lists, schedules and the field view, shown by an automated scan with no serious or critical findings and a manual keyboard pass. Drawing on the map canvas is exempt, provided every device is reachable and inspectable through the schedules. |
| Shared updates | A saved change appears in other open browsers within 5 seconds; a save is acknowledged within 2 seconds. |
| Analysis | One camera’s coverage updates within 1 second of finishing an edit. Combined floor analysis completes within 5 seconds with a progress indicator. |
| Loading and export | The project opens within 5 seconds on broadband. A full fixture PDF package generates within 60 seconds with progress. A photo upload completes within 10 seconds on a typical mobile connection. |
| Photos | Stored resized to 2,048 px on the longest edge. Originals are not retained. |
| File limits | 50 MB per PDF plan import; 500 MB per project including retained packages; 100 MB per PDF package. Exceeding a limit is reported and never silently truncates content. |
| Backup and recovery | Automatic nightly server backup retained for 7 days, with one restore demonstrated during acceptance. Acknowledged saves survive an ordinary service restart. A portable backup export and re-import preserves the complete project under FR-34. |
| Not promised | Uptime, support hours, or recovery of changes newer than the last nightly backup after loss of the server. |

The fixture is exercised in the two stages defined in the delivery slices. Measure timings on the fixture with one mid-range laptop and one mid-range phone, at the fixture’s three concurrent browsers.

## Delivery slices

Confirmed 2026-11-18. The slices set the build order and the acceptance cut line. They do not change any requirement’s ID, wording or confirmed status. Each slice ends with an outcome that can be demonstrated from start to finish.

| Slice | Demonstrable outcome | Requirements |
| --- | --- | --- |
| 1. Shared foundation | The existing design tool running as one shared online project | FR-1–6, FR-8, FR-10–16, FR-20–22, FR-42; base parts of FR-7 and FR-9; the Delete draft row of FR-55 and the Delete floor row of FR-56 |
| 2. Design and issue (UJ-1 for a new site) | A design is estimated, reviewed, issued and exported as a fixed package | FR-17–19, FR-23–26, FR-33b–d, FR-34, FR-47; the Cancel and Correct rows of FR-55; the Design preset of FR-33a; part of FR-7 |
| 3. Install, test and close out (UJ-2, UJ-3) | A technician records work and tests on a phone, and the scope closes honestly | FR-27–32, FR-41, FR-43, FR-44, FR-58; issue records from FR-46; the Closeout preset of FR-33a; the field view under NFR-3 |
| 4. Existing sites and return visits (UJ-4, and UJ-1 for an existing site) | An existing building is surveyed, upgraded and later reopened with its history | FR-33e, FR-35–40, FR-45, FR-53, FR-54, FR-59; the rest of FR-56; issue carryover from FR-46 |
| 5. Extended modelling | Richer design detail | FR-33f, FR-48–52, FR-57; extension parts of FR-9 and FR-19 |

Six requirements are delivered in parts, and FR-33 is delivered by its lettered parts:

| Requirement | Earlier part | Later part |
| --- | --- | --- |
| FR-7 | Slice 1: the current catalog, identity and existing/proposed distinction | Slice 2: the added equipment types and camera-model selection. Linked openings, annotations and closets arrive with FR-49–51 in slice 5. |
| FR-9 | Slice 1: same-floor routes with stable run IDs | Slice 5: inter-floor segments, risers and the FR-52 length model |
| FR-19 | Slice 2: storage, bandwidth, and port/PoE estimates from recorded connections | Slice 5: explicit port assignments under FR-51 and multi-head hardware/stream accounting under FR-48 |
| FR-55 | Slice 1: Delete draft, with its dependents and undo | Slice 2: Cancel from design and Correct record, once issued designs exist. Reversing an installed mark arrives in slice 3. |
| FR-56 | Slice 1: Delete floor for empty or draft-only floors | Slice 4: blocking, retirement, reinstatement and moves between floors |
| FR-46 | Slice 3: stable issue records linked to devices, checks and attempts, with resolution | Slice 4: Include now and Defer across scopes, and carryover into later work |
| FR-33 | Slice 2: FR-33b–d and the Design preset of FR-33a. Slice 3: the Closeout preset of FR-33a, with the field-outcome rules of FR-33c applied to it. | Slice 4: FR-33e and the Closeout preset’s removed/replaced equipment references, warranty details and service visits. Slice 5: FR-33f. |

Slice 1 is largely a port: these capabilities exist in the prototype against local browser storage and must be rebuilt on shared server-saved records. Slices 2 and 3 use one implicit work scope; scope selection (FR-45) and issue carryover across scopes arrive in slice 4, when a second scope first exists. Issue records themselves arrive in slice 3, because closeout and the reliability period depend on them.

In slices 1 and 2 no installation work is recorded. Devices can be placed as existing or proposed, as in the prototype, and every analysis includes all placed devices. The choice between the Current installation and Proposed design bases, and the Changes view (FR-41), arrive in slice 3 with field recording. Planned actions on existing equipment (FR-40) arrive in slice 4; in slice 3 the only planned action is Add new. The closeout record of FR-32 gains warranty records and service visits in slice 4. A clause that refers to a record type from a later slice takes effect when that slice is delivered. NFR-1, NFR-2 and NFR-4 to NFR-6 apply from slice 1, as does NFR-3 for the design workspace; the field view arrives in slice 3, and before then a window narrower than 1280 px is not supported.

**Acceptance cut line.** Slices 1–4 are core acceptance: they cover UJ-1 to UJ-4 and SM-1 to SM-4. Slice 5 is extended acceptance and can follow. The acceptance fixture is exercised in two stages:

| Stage | After | Fixture content |
| --- | --- | --- |
| Core | Slice 4 | The confirmed fixture without the four-head, fisheye and pan/tilt/zoom cameras, closets and port schedules, inter-floor runs, linked openings and annotations. Cameras are conventional single-view models and all routes are same-floor. The outdoor site plan is an ordinary floor record with its own drawing. |
| Extended | Slice 5 | The remaining fixture items, plus a recheck that the results and totals of the core subset, and the packages already retained, are unchanged by the additions, apart from identified differences that follow from the slice 5 changes to port assignments and route lengths. |

The supported ceiling and all timing, browser, accessibility, storage and backup targets apply at core acceptance, with package generation timed on the core fixture. The POC is fully accepted only when both acceptance stages pass.

## Open questions and assumptions

**Resolved OQ-1 (2026-11-17):** the shared demo access model is confirmed in FR-2/23–25 and NFR-5: revocable project editing and revision-review links, unverified display names, server-enforced scope, HTTPS hosting, and sample/sanitized data. Hosting vendor selection remains architecture work.

**Resolved OQ-2 (2026-11-17):** per-item autosave/conflict checks, updates within a few seconds, preserved pending input, separate evidence entries, duplicate-safe retries, own-session guarded undo, and consistent saved snapshots are confirmed in FR-2/21/22/24/31/32/42 and NFR-2. Timing and backup targets were subsequently confirmed under OQ-9; transport and storage design remain architecture work.

**Resolved OQ-3 (2026-11-17):** common/device-specific editable starters, project-defined expected results, required/optional applicability, observed outcomes/evidence, independent phase progress and scoped site checks are confirmed in FR-29–31/43. Final template wording and project/manufacturer values belong to implementation/domain setup; retest behavior and broader defect disposition are now confirmed under OQ-4/OQ-5.

**Resolved OQ-4 (2026-11-17):** targeted change-to-check rules, proposed/actual/correction distinctions, preserved historical outcomes, separate review/retest follow-ups and current-context completion safeguards are confirmed in FR-28/31/32/44. Work-scope and unresolved-issue disposition are now confirmed under OQ-5.

**Resolved OQ-5 (2026-11-17):** one active work scope with Work now/Inspect-test only/Reference only categories, scoped supply/accessory/labor estimates, stable continuing issues and explicit outstanding-items closeout are confirmed in FR-17/32/38/45/46. Multiple revisions can belong to one scope; deferred faults remain visible without automatically recommissioning unchanged equipment.

**Resolved OQ-6 (2026-11-17):** Design/Closeout PDF presets, detailed current-scope evidence, quantity/capacity defaults, optional costs/photos, explicit partial/omission labels, and exact historical-package retention are confirmed in FR-33/34 and NFR-6. Editable backups and estimate CSVs remain separate. Export does not require or grant approval.

**Confirmed OQ-7 camera-template refinement (2026-11-17):** user-created, model-number-selectable camera definitions with explicit resolution, H/V FoV and fixed/varifocal optical inputs are confirmed in FR-7/10/47. Additional equipment, annotation, connection and physical-routing scope is confirmed below.

**Confirmed OQ-7 multi-view refinement (2026-11-17):** separate physical assets/views/streams, supported conventional-head analysis, illustrative fisheye/stitched previews with DORI Not assessed, honest combined/zone results and hardware-versus-stream accounting are confirmed in FR-10/12–15/19/47/48. Detailed calibrated panoramic DORI is follow-on scope. Physical inter-floor routing and vertical/drop allowances are confirmed below.

**Confirmed OQ-7 equipment refinement (2026-11-17):** the additional generic equipment types and linked door/gate components are confirmed in FR-7/29/49. Components retain separate identity, costs, work state and evidence; associations do not create implicit hardware/connections or test passes.

**Confirmed OQ-7 annotation refinement (2026-11-17):** perimeter lines, entrance markers/arrows, existing zones for named areas, callouts and scaled dimensions are confirmed in FR-20/33/42/50. Preserve separate field evidence, analytical tools and plan-derived estimates. Closets/port assignments and expanded physical cable routing are confirmed below.

**Confirmed OQ-7 connection refinement (2026-11-17):** named closet equipment groups, manual switch-port/terminal references, planned/current assignments and reservations, explicit known-budget/unknown-load checks and connection schedules are confirmed in FR-9/19/33/42/49/51. Logical assignments may cross floors; physical inter-floor route geometry and vertical/drop allowances are confirmed below.

**Resolved OQ-7 (2026-11-17):** the accepted routing model completes the equipment/cable scope. One run ID across ordered floor segments/risers, explicit transition/drop lengths, fixed extras plus one percentage allowance, distinct supply/measured quantities and honest incomplete estimates are confirmed in FR-9/17/33/42/52. Earlier OQ-7 camera, equipment, annotation and closet/port decisions remain settled.

**Confirmed OQ-8 cable-lifecycle refinement (2026-11-17):** independent retained cable records, historical endpoint links, explicit reuse/disconnection/removal, preserved port occupancy and validated restoration with appropriate retesting are confirmed in FR-35/36/53 and related clauses. Changed-floor restoration and draft deletion are subsequently confirmed below.

**Confirmed OQ-8 floor-restoration refinement (2026-11-17):** stable floor identity, explicit placement on the current plan, destination selection/creation when missing, preserved historical location/evidence and cancellable per-device restoration are confirmed in FR-1/36/42/54 and related clauses. Draft deletion is subsequently confirmed below.

**Resolved OQ-8 (2026-11-18):** history-based Delete draft, Cancel from design and Correct record actions, removal of eligible draft-only dependents, detachment rather than cascade for retained or shared records, and guarded own-session undo are confirmed in FR-21/35/36/55. Existing-condition records with no baseline or evidence history are deletable as drafts. Deleting a floor together with its contents was subsequently confirmed under OQ-10.

**Resolved OQ-9 (2026-11-18):** the acceptance fixture and supported ceiling, browser and screen-size matrix with phones as field-only (refined on 2026-11-18 to a window-width rule), WCAG 2.1 AA with a map-canvas exemption, timing targets, resized photo storage, file limits and nightly 7-day backups are confirmed in NFR-2/3/4, A-2 and the acceptance targets. No uptime commitment is made. The targets are unmeasured until the acceptance exercise.

**Resolved OQ-10 (2026-11-18):** Delete floor for empty or draft-only floors, blocking with a list of required actions while active records with history remain, Retire floor with reinstatement when only history remains, removal of floor-level drawing content with a deleted floor, and a Move to another floor action distinguishing corrections from actual relocations are confirmed in FR-1/54/55/56.

OQ-1 through OQ-10 are resolved and no owned open question remains. The build order and acceptance cut line are confirmed in the delivery slices, and device states are consolidated in the device state model. This does not make the draft final, authorize deployment or claim architecture readiness.

**Resolved A-1 — Package presentation.** OQ-6 confirms the two presets, evidence/detail choices, photo pagination and cost/capacity defaults in FR-33/34 and the addendum. Detailed visual styling remains UX work; output must preserve visible actual conditions and outstanding work.

**Resolved A-2 — Acceptance fixture.** The fixture size and conditions are confirmed in the acceptance targets. Existing fictional project fixtures can seed it, extended with the conditions listed there. Building the fixture is implementation work.

**PSP references (reviewed 2026-11-18).** The public ASIS PSP examination outline was read and mapped to this draft; it lists topics, not requirements. Kevin shared pages from Patterson, *Implementing Physical Protection Systems* (2nd edition), and a public Department of Energy assessment guide was read in part. Their findings informed optional checklist items, two camera fields, survey prompts and estimate lines in FR-7/18/20/29/43. Checklist content remains project-defined, and no PSP or other compliance claim is made. The [reference digest](sources/psp-reference-reading.md) holds the mapping and paraphrased findings.

**After-POC candidates (not requirements).** Test level and frequency with reminders; a pre-delivery test stage; a separate test report; drawn riser diagrams; standard security symbols; a note of substitute protection while equipment is faulty; maintenance trend summaries; life-cycle costing; and a reason field on zone targets.

**Resolved from the reference review (2026-11-18).** Pan/tilt/zoom cameras, the optional reliability period, and warranty and service-visit records were discussed individually and confirmed in FR-57, FR-58 and FR-59. Nothing from that review remains under discussion. Limited external references inform discussion but do not impose contractual gates, certify calculations, or override the optional approval policy.

## Supporting records

Use the [source index](source-index.md) for implementation and design evidence, the [addendum](addendum.md) for technical boundaries, the [conversation context](sources/conversation-context.md) for intent, and the [decision log](.memlog.md) for the canonical history. The [preserved discovery notes](sources/discovery-notes.md) retain the earlier discussion; their old proposal labels are superseded by confirmed decisions here.

Review this draft as a whole before committing detailed UX, architecture, and implementation scope. Keep the FR IDs when deriving later work.
