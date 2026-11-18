---
title: "Site Studio — UX Design Specification"
status: draft 0.5, aligned with final PRD 1.2 after its review on 2026-11-18; design decisions D1-D14 confirmed by Kevin
created: 2026-11-18
inputs: "PRD 1.0 with proposed amendments 1.1 and 1.2 (FR-1–72, NFR-1–8, SM-1–6)"
method: BMAD Create UX, followed by hand (the BMAD skills are not installed in the cloud checkout)
---

# Site Studio — UX Design Specification

This document turns the [PRD](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into screens, flows and interface rules. It covers FR-1–62, the proposed FR-63–65 and, in section 17, FR-66–72 from proposed amendment 1.2. It adds no product scope. Where it makes a choice the PRD leaves open, the choice is listed under [Confirmed design decisions](#12-confirmed-design-decisions). Kevin confirmed all of them, D1 to D14, on 2026-11-18.

Three kinds of statement are kept apart throughout:

- **Prototype today** — what the running application does, observed on 2026-11-18.
- **Required** — what the PRD asks for, cited by FR or NFR number.
- **Proposed** — the design this document sets out to meet the requirement. The nine choices in section 12 are confirmed; the rest of the design detail is open to review on the canvas.

Screens are numbered S-01 to S-36, and S-F1 to S-F7 for the field, so architecture, epics and stories can refer to them. The key screens are drawn on a design canvas; see [Visual designs](#13-visual-designs).

## 1. Summary

The prototype is a good desktop drafting tool for one person. Its map-first, white and teal direction is right and is kept. The PRD asks for much more than drafting: a shared record that follows a property through survey, design, installation, testing, closeout and return visits, used on phones as well as laptops.

The design work therefore has four parts:

1. **Restructure the desktop workspace** so it holds eight areas of work instead of one map with dialogs, without losing the map-first feel.
2. **Design a separate field experience for phones and tablets** built around one loop: find a device, see what is required, record what was done.
3. **Create one status language** so that proposed, existing, installed, tested, estimated and unknown never look alike. Most of the PRD's rules are about not overstating what is known.
4. **Fix the prototype's measurable weaknesses**: small text, low contrast, undersized touch targets and dialogs that will not hold 600 devices.

## 2. Users and their situations

The PRD names three roles, which one person may hold at once. Since amendment 1.2 each person signs in with an account, and an administrator looks after the installation (FR-66–70); section 17 designs those screens. A client reviewing through a link still has no account, and the name they give is not verified.

| Role | Where they work | What they need from the interface |
| --- | --- | --- |
| Designer (security professional) | Desk, Windows laptop, large screen, long sessions | Dense drafting tools, fast analysis feedback, schedules, estimates, comparison and packages. |
| Installer or technician | On site, phone or tablet, one hand, gloves, glare, patchy signal | Find one device quickly, read its requirements, record work, results and photos with few taps, and trust that it saved. |
| Client or reviewer | Any device, occasional, through a reviewer link | Read a fixed revision, comment on the plan, approve or request changes. Nothing else. |

Two situations shape the design more than the roles do:

- **Desk work is exploratory.** The designer tries things, compares and undoes. The interface favours direct manipulation and immediate feedback.
- **Field work is transactional.** The technician records facts, one at a time, that must not be lost or misattributed. The interface favours large controls, explicit confirmation of what saved, and no way to edit the design by accident.

## 3. Experience principles

These settle disagreements between screens. Each comes from a rule the PRD repeats.

1. **The map is the workspace.** Lists, schedules and forms support it and link back to it. Any device shown in a list can be located on its plan in one action (FR-8).
2. **Never look more certain than the record.** Unknown, estimated, not assessed, not tested and incomplete each have their own appearance. A total that depends on unknown inputs says so beside the number (FR-13, FR-19, FR-41, FR-51).
3. **Plans and facts look different.** Design intent (proposed devices, planned actions, modeled coverage) and recorded facts (installed marks, test attempts, measured lengths) use different visual treatments everywhere they appear (FR-28, FR-30, FR-40).
4. **Nothing is silently lost or changed.** Every save state is visible. A conflict keeps the user's input beside the saved value. History is added to, never rewritten (FR-21, FR-42, NFR-1, NFR-2).
5. **Warn, do not block.** Approvals can be bypassed, contradictions are flagged and work continues. The interface blocks only where the PRD does, and then explains why (FR-25, FR-30, FR-55, FR-60).
6. **The field view is a different job, not a smaller desktop.** It removes drafting tools and adds recording tools (NFR-3).
7. **Progress is counted, not coloured.** Progress shows counts of passed, failed and outstanding checks. More green must not hide failures (PRD counter-metrics).

## 4. Prototype audit

Observed on the running prototype at 1440 × 900, 820 × 1180 and 390 × 844 on 2026-11-18. Captures are in [audit/](audit/).

### What works and is kept

- The three-column layout with a persistent geographic map matches the chosen mockup closely.
- Direct manipulation of the plan and devices, with numeric fields for the same values in the inspector.
- Assumptions are stated beside analysis results (target height, sampling, "Geometric coverage estimate").
- Every map marker is a focusable button with a spoken name, such as "C-01 — Northwest parking".
- No horizontal page scrolling at any tested width.
- The guided two-point alignment and the PDF page picker are complete, well-behaved flows.

### What needs to change

| # | Finding | Evidence | Why it matters | Severity |
| --- | --- | --- | --- | --- |
| A1 | Equipment, Materials, Capacity, Revisions and Review open as dialogs over the map. | [Equipment dialog](audit/prototype-desktop-equipment-dialog.png) | A dialog cannot hold a 600-device schedule with filters, a port schedule or an import review, and it hides the map it should link to. | High |
| A2 | Text is small. On desktop 91 of 130 visible text items are 12 px or smaller, some 9 px. | Measured | Hard to read on a laptop for long sessions and on any phone. | High |
| A3 | Secondary text is pale. 51 desktop text items fall below a 4.5:1 contrast ratio, the lowest near 2:1. | Measured | Fails the contrast check in NFR-3 and is unreadable in daylight. | High |
| A4 | The phone layout is the desktop layout made narrow. The header, tab row and panel buttons take about 150 px before the map starts. The tool dock is clipped and scrolls sideways. The coverage card covers a third of the map. | [Phone](audit/prototype-phone-390.png) | A technician cannot complete the NFR-3 field tasks comfortably. Drafting tools they should not use are the most prominent controls. | High |
| A5 | Touch targets are small. On the phone 18 of 37 visible buttons are under 44 px in one dimension; several are 23 to 29 px. Markers are 32 px. | Measured | Mis-taps on site, especially with gloves. | High |
| A6 | Phone form fields use 10 to 14 px text. | Measured | iPhone Safari zooms the page when a field under 16 px is focused, which breaks the layout mid-entry. | Medium |
| A7 | The floating "Camera coverage" card sits over the map and the tool dock, and the scale bar sits under the dock. | [Desktop](audit/prototype-desktop-1440.png) | Overlapping controls; the legend hides the area being analysed. | Medium |
| A8 | The tool dock has twelve equal buttons. | [Desktop](audit/prototype-desktop-1440.png) | The PRD adds annotations, doors, closets and more equipment types. A flat row will not scale. | Medium |
| A9 | "Combined coverage", zones, survey notes, walls and cable routes are buttons low in the left panel, below the fold at 900 px height. | Observed | Core analysis is hard to find. | Medium |
| A10 | Device state is one "Proposed" pill. Save state is "Saved locally". | [Desktop](audit/prototype-desktop-1440.png) | The PRD needs lifecycle, condition, planned action, work recorded, test outcome, analysis status and four save states to be distinct. | High (new scope) |
| A11 | The phone properties panel is a side drawer with its own scroll inside the page. | [Phone properties](audit/prototype-phone-390-properties.png) | Nested scrolling is awkward by touch, and the map is cut to a strip. | Medium |
| A12 | An "Align plan" hint and plan handles show on every load, including on phones. | [Phone](audit/prototype-phone-390.png) | A technician could move the plan by accident. Alignment should be a deliberate desktop action. | Medium |

Not yet present in any form, and designed in this document: the shared project and its save states, the Design and Installation views, the existing-site survey, inventory import and placement, planned actions and work scope, checklists and test results, issues, closets and ports, inter-floor runs, issued designs, closeout, warranties and service visits, and the reliability period.

## 5. Information architecture

### 5.1 Project frame (S-01)

**Proposed.** Every screen sits inside one frame that answers four questions at all times: which property, which work, which reference, and is my work saved.

| Element | Content | Source |
| --- | --- | --- |
| Property | Property name, with a switcher back to the project list. | FR-1 |
| Work scope chip | Scope name and state: In progress, Completed, or Closed with outstanding items. A service scope carries a "Service" label. | FR-32, FR-45, FR-65 |
| Issued design chip | "Issued: Rev B, 12 Nov" or "Not issued", opening the reference. Approval state shows separately as Approved, Bypassed or Awaiting decision. Current never implies approved. | FR-61 |
| View switch | Design or Installation. A view preference only; it grants nothing. | FR-2 |
| Save status | Saving, Saved, Unsaved or Conflict, with a count. Opens the list of pending and conflicting items. | FR-21, NFR-2 |
| Account menu | Amended for 1.2. The signed-in user's name and their role in this project, with My account and Sign out. Administrators also see Administration. A Viewer sees a "View only" chip. | FR-67–69 |
| Members and reviewer links | Amended for 1.2. Who belongs to this project and in which role (managed by administrators), and reviewer links, which Editors create, copy, replace and revoke. | FR-24, FR-68 |
| Archived banner | When the project is archived: "Archived — view, search and export only", with Un-archive. | FR-37 |

### 5.2 Areas of work

**Proposed.** Eight full-page areas replace the prototype's tabs and dialogs. The top tab row from the mockup is kept on desktop.

| Area | Holds | Main requirements |
| --- | --- | --- |
| Overview (S-02) | Scope status, remaining work, phase progress by floor, attention items, backup age, recent activity. | FR-31, FR-32, FR-34 |
| Plan (S-03) | The map workspace: plans, equipment, coverage, zones, obstructions, annotations, routes, survey pins. | FR-1–6, FR-9–16, FR-50, FR-63 |
| Equipment (S-08) | Property-wide schedule; Awaiting placement; historical records; inventory import; camera-model templates; doors and their components. | FR-7, FR-8, FR-47–49, FR-56–59, FR-62 |
| Connections (S-12) | Closets, port schedules, cable runs and risers. | FR-9, FR-51–53 |
| Costs and capacity (S-14) | Estimate with subsystems and percentage lines; storage, bandwidth, port and power capacity. | FR-17–19 |
| Field work (S-15) | Checklists, device and site checks, reliability period, remaining-work list. | FR-29–31, FR-43, FR-44, FR-64 |
| Issues (S-18) | Property issues, their disposition in this scope, and service visits. | FR-46, FR-65 |
| Records (S-20) | Surveyed baseline, named revisions, issued designs, reviews, closeouts, packages, backups, archive. | FR-22–26, FR-32–38, FR-61 |

### 5.3 View and basis are two separate controls

The PRD has two ideas that could be confused: the Design and Installation views (FR-2) and the Current installation, Proposed design and Changes views (FR-41).

**Proposed.**

- **View** (in the frame) chooses the tools. Design shows drafting and analysis tools. Installation shows recording tools and the issued reference.
- **Basis** (on the map and at the top of every schedule and result) chooses the population: Current installation, Proposed design, or Changes. It is always visible as a labelled control, never implied.
- Switching view sets a sensible default basis (Design to Proposed design, Installation to Current installation) and says so in a brief notice. The user can change basis freely in either view.
- Hiding a layer never changes the basis or any total (FR-12, FR-41). The layer panel states this once, beside the visibility controls.

## 6. The status language

This is the centre of the design. Each family below has a fixed set of values, and each value has an icon or shape as well as a colour and a text label (NFR-3). Families are never merged into one badge.

| Family | Values | Appearance | Source |
| --- | --- | --- | --- |
| Lifecycle | Proposed, Existing, Removed | Marker outline: dashed for Proposed, solid for Existing. Removed appears only in the historical view, grey with a "Removed" label. | State model |
| Placement | Placed, Awaiting placement | No marker and no coverage for Awaiting placement; a tray entry instead. | FR-57 |
| Condition | Working, Faulty, Unknown | Small glyph on the marker: none, warning triangle, question mark. | State model |
| Planned action | None, Retain, Relocate, Service, Replace, Remove, Add new | Corner glyph on the marker in Changes: pin, arrow, wrench, swap, cross, plus. Relocation draws an arrow from current to planned position. | FR-40 |
| Scope category | Work now, Inspect or test only, Reference only | Text chip in lists and the inspector. Reference-only markers are drawn lighter in Installation view. | FR-45 |
| Work recorded | Installed or not; configured or not | Two check boxes that only a person sets. Shown as facts with name and time. | FR-30 |
| Test outcome | Pass, Fail, Not tested, Not applicable | Tick in a circle, cross in a circle, empty circle, dash. | FR-30 |
| Follow-up flag | Needs review, Retest required, Needs definition, Needs connection review | Amber flag chip beside the check or record, linked to its cause. Never replaces the outcome. | FR-29, FR-44, FR-53 |
| Analysis status | Final, Updating, Not assessed, Uncertain near target | Chip on every result. Updating greys the number. Not assessed uses a hatched fill on the map. | FR-13, FR-15 |
| Value basis | Estimated, Measured, Unknown, Unpriced | Suffix on the value: "46 m est.", "41.2 m measured", "Unknown", "Unpriced". Never a blank or a zero. | FR-17, FR-52 |
| Provenance | Imported, Old document, Estimate, Site-confirmed | Small chip beside a field, with source detail on demand. | FR-39, FR-56 |
| Save state | Saving, Saved, Unsaved, Conflict | Frame status plus a mark on the affected item. | FR-21 |
| Record end state | Deleted draft, Cancelled, Corrected | Listed under Historical with the reason. | FR-55 |
| Issue state | Open, Deferred, Resolved | Chip, with the disposition for this scope shown separately. | FR-46 |
| Warranty status | Not started, In warranty, Expired, Unknown | Chip with "as of" date. No record means Unknown. | FR-65 |

Rules that apply across families:

- **Colour roles.** Teal is for actions, selection and brand. Coverage keeps the prototype's colours (teal for one view, purple for overlap, red for unseen). Pass uses a distinct green with a tick; Fail uses red with a cross; follow-up flags use amber. No status relies on colour alone.
- **Modeled and recorded results never share a row.** A zone shows "Modeled: Identify over 92% of area" and, separately, "Field check: Not tested". A modeled result never ticks a field check (FR-30).
- **Contradiction warning.** When work recorded and checks disagree, the device shows a neutral notice, for example "All required installation checks passed, but this device is marked not installed." It offers the two possible corrections and blocks nothing (FR-30).
- **Totals with gaps.** Any total, percentage or headroom that depends on unknown inputs is labelled "Incomplete" with a count of the unknowns and a link to them. It is never styled as a pass (FR-19, FR-51).

## 7. Desktop design

### 7.1 Plan workspace (S-03)

The three columns are kept. Changes from the prototype are marked.

**Left panel — property and layers.**

- Buildings and floors as a tree, each floor with its device count and an amber mark when it has attention items. Floor management moves here from a separate dialog (FR-1, FR-60).
- An **Awaiting placement** row under the tree with its count. It opens a tray of imported records, filterable by building, floor or room hint (FR-57).
- Layers grouped as Equipment, Analysis (coverage, DORI, reach, zones), Site (obstructions, annotations, survey pins) and Connections (routes, risers). Each has a visibility control (FR-50). Changed: analysis and drawing actions leave this panel and move to the tool dock and analysis panel (A9).

**Centre — map.**

- Top left: property search. Top right: map style. Top centre: the basis control from 5.3.
- **Tool dock, regrouped (A8).** Six slots: Select, Place (equipment types and Awaiting placement), Draw (wall, obstruction, zone, analysis boundary), Annotate (line, marker, arrow, text, dimension), Route, and Note (survey note or photo). Each group opens a short menu and remembers the last tool used. Measure joins Annotate as a temporary dimension.
- **Analysis strip, replacing the floating card (A7).** A docked strip at the bottom left shows the active analysis, its basis, target height, sampling and status chip, with the legend. It never covers the dock or scale bar.
- Plan alignment handles show only while the plan is unlocked and Alignment is open, and never in Installation view (A12).
- In Installation view the map adds an **issued reference** toggle. It shows the issued position of each device as a ghost outline, with a line to the recorded position where they differ (FR-26, FR-61).

**Right panel — inspector.**

With nothing selected it shows the floor: drawing, alignment, analysis settings and combined results. With a device selected it shows the device inspector (S-04).

### 7.2 Device inspector (S-04)

The header shows what the device is and its state in one glance: ID and legacy label, name, type and model, lifecycle, condition, and any flags. Below are six tabs.

| Tab | Content | Source |
| --- | --- | --- |
| Details | Identity, model, mounting, location, enclosure and alarm interface for cameras, notes. Each field can show provenance. Linked door or components. Warranty block. | FR-7, FR-39, FR-49, FR-65 |
| Optics (cameras) | Model template and profile; per-view lens, resolution, bearing, tilt, target height, range. For pan/tilt/zoom cameras, the Positions list (7.4). | FR-10, FR-47, FR-48, FR-63 |
| Work | Planned action and scope category for this scope, with unavailable choices disabled and the reason shown. Work recorded marks. Connections and port. | FR-40, FR-45, FR-51 |
| Checks | Installation, Configuration and Testing checks with outcome, flags and attempt history. | FR-29–31, FR-44 |
| Evidence | Notes, photos and measurements with author and time. Optional survey prompts. | FR-20 |
| History | Changes with before and after values, actor, time and reason; predecessor and replacement links. | FR-27, FR-36 |

**Removing a device.** The device menu offers exactly the action that applies and explains the others (FR-35, FR-55):

| Situation | Action offered | Behaviour |
| --- | --- | --- |
| Accidental proposed placement, never issued, no evidence | Delete draft | Immediate, with an Undo notice. No confirmation dialog. |
| Proposed, issued or approved, or carrying evidence | Cancel proposal | Asks for a short reason. Record stays listed. |
| Proposed, marked installed by mistake | Reverse installed mark | Asks for a reason. Evidence stays, flagged Needs review. |
| Existing on site, being taken out | Record removal | Shows affected cables and ports first (FR-53). Archives the device. |
| Existing, entered in error or duplicated | Correct record | Asks for a reason and the record to keep. |

A "Why can't I delete this?" link lists what makes the device ineligible. A connected draft shows its dependencies before deletion.

### 7.3 Coverage and zones (S-05)

- The analysis panel lists covered, overlap and unseen area with the boundary and denominator named, then each zone with its target, achieved percentage and one of four results: Target met, Shortfall, Not demonstrated (relevant views unassessed) or Uncertain near target (FR-13, FR-15).
- Excluded and unsupported views are listed under the result with the reason, not hidden in a tooltip.
- While a camera is being adjusted, affected zone results stay visible and update; numbers grey with an Updating chip until final (FR-15, NFR-4).
- Single-camera and combined percentages are never shown in the same position or style, so they are not mistaken for each other (FR-13).
- Multi-view cameras show one marker with a view count. The Optics tab lists each view. Fisheye and stitched outputs draw a hatched "Illustrative — DORI not assessed" preview (FR-48).

### 7.4 Pan/tilt/zoom cameras (S-06, FR-63)

- **Positions list** in the Optics tab: named stored positions with pan, tilt and zoom. One is marked Home with a house icon. A camera without a home position shows "No home position — not counted in coverage" as a flag on the device and in the analysis panel.
- **Counted view.** The home position draws like any camera view and is the only one counted.
- **Preview.** Choosing another position draws its coverage with a dashed outline and a banner on the map: "Preview of 'Loading dock' — not counted". Totals do not move. Leaving the camera ends the preview.
- **Reach.** A layer named "Reachable on demand" draws the reach as an outline with a light hatch, visibly different from covered area. Hover or tap shows the best achievable detail at that point, labelled "one place at a time". Without optical data only the outline shows, with "Detail not assessed".
- **Zones.** A zone row keeps its counted result and adds a second, quieter line: "Reachable on demand by PTZ-01: 80% of zone, up to Recognize". The target is judged on the first line only, and the second line carries no tick.
- Limits (pan and tilt) are edited as numbers and as arc handles on the map, with number fields as the non-drag alternative.

### 7.5 Annotations (S-07, FR-50)

Annotations have their own layer and their own tool group. They use a drafting style (thin dark lines, plain labels) that is clearly not the analysis style. Three safeguards make the PRD's separation visible:

- Drawing a fence line offers, once, "Also block camera views? Add an obstruction." It does nothing unless accepted.
- A dimension on a plan without a valid scale reads "Scale unknown" instead of a length.
- Deleting markup that references a photo or issue says the referenced record is kept.

### 7.6 Equipment (S-08)

A full-page table replaces the dialog (A1). Three segments: **Placed**, **Awaiting placement** and **Historical** (removed, cancelled, corrected, each with its reason) (FR-8).

- Search across ID, legacy label, name, model, serial and address. Filters for building, floor, type, lifecycle, planned action, scope category, flags and verification state. Results within one second at 600 devices (acceptance table).
- Selecting a row opens the same inspector as the map, as a side panel. "Locate" opens the right floor with the device selected.
- Optional columns include warranty status (FR-65) and provenance.
- Multi-select enables bulk cleanup (7.8).
- Secondary tabs within Equipment: **Camera models** (templates, FR-47) and **Doors and gates** (openings with linked components, FR-49).

### 7.7 Inventory import (S-09, FR-56, FR-58, FR-62)

A four-step full page with a visible step indicator. Nothing changes in the project until the last step is confirmed.

1. **File and sheet.** Drop or choose a .csv or .xlsx file. Choose the sheet and the header row from a preview of the first rows. A link downloads the sample template. Unsupported files fail here with a plain reason.
2. **Map columns.** One row per source column: its heading, three sample values, the suggested field, and a choice to change or ignore it. Equipment-type values map the same way, with Unknown type available. Unmapped and ignored columns are counted in a summary. If the project's last mapping fits these headings it is offered, not applied.
3. **Review rows.** Four groups with counts: New, Changed, Unchanged, Needs review. Changed rows show the current and incoming value side by side with the source of each. Site-confirmed values are locked by default and need a deliberate choice to overwrite. Row errors show inline with Fix or Skip. Rows are ticked explicitly; group-level select is available for straightforward rows.
4. **Result.** Counts of imported, skipped, failed, conflicted and unresolved, with links: "42 records are awaiting placement", "6 need review".

Identifiers display exactly as in the file; an uncertain conversion (such as a lost leading zero) is flagged on the row.

### 7.8 Bulk cleanup (S-10, FR-59)

Selecting records or an import batch and choosing "Clean up" opens a preview: how many are selected, how many can be removed, and each blocked record with its reason. Confirming applies only to eligible records, shows the outcome per record and offers Undo where dependencies still allow it.

### 7.9 Work scope and Changes (S-11, FR-40, FR-41, FR-45)

- With basis set to Changes, the map draws planned actions (glyphs, relocation arrows, replacement links) and a side list groups devices by action, followed by cancellations and corrections against the issued design.
- A scope panel lists Work now, Inspect or test only and Reference only, with the estimate and required checks each implies. Moving an item that has a required retest or open issue warns that the item stays outstanding.

### 7.10 Connections (S-12, S-13, FR-9, FR-51–53)

- **Closets.** A list of named locations with the equipment each contains.
- **Port schedule.** One table per switch. Each port shows label, type, allocation (Free, Reserved, Assigned), availability (Usable, Unavailable, Unknown), endpoint, cable reference and power. Allocation and availability are separate columns. Conflicting claims are highlighted on both rows. The power summary shows budget, known allocation, reservations and unknown loads, and reads "Incomplete — 3 loads unknown" when that is the case.
- **Cable runs.** A list with one row per physical run. The detail shows terminations, the ordered segments by floor, risers, and a length ledger written out as arithmetic:

  | Component | Length | Basis |
  | --- | --- | --- |
  | Horizontal segments | 32 m | From plan scale |
  | Inter-floor transitions | 6 m | Entered, estimated |
  | Endpoint drops | 2 m | Entered, estimated |
  | **Route subtotal** | **40 m** | |
  | Fixed extras (service loops) | 2 m | Entered |
  | Allowance, 10% of route | 4 m | Selected |
  | **Suggested supply** | **46 m est.** | |
  | Measured installed length | Not recorded | |

  A missing component makes the estimate "Incomplete", with the known subtotal still shown.
- On the plan, a riser is a marker with a continuation label such as "to Level 2 via Riser R-1". Selecting it lists the runs that use it.
- Recording a device removal opens a review of its cable ends and ports with a disposition for each: retained and disconnected, reused, removed, or unresolved. Unresolved is allowed and stays flagged (FR-53).

### 7.11 Costs and capacity (S-14, FR-17–19)

- **Estimate.** A full-page table with an inclusion tick per line, grouped by category or by subsystem. Grouping is a display choice and the total is identical. Percentage lines sit in their own section, each showing its base and result. Unpriced lines read "Unpriced", and a total that includes them reads "Incomplete — 3 lines unpriced". Retained equipment appears under "Retained, not purchased" so its absence from the total is explained.
- **Capacity.** Storage, bandwidth, ports and power each state the basis, the inputs and any unassigned or unknown demand. Prices and capacity are estimates and are labelled so.

### 7.12 Field work on desktop (S-15, S-16)

- **Progress.** A table by floor and device with three phase columns. Each cell shows counts, for example "4 of 6 passed · 1 failed · 1 retest", or "No checks in scope". No percentage bar is shown for an empty phase (FR-31).
- **Remaining work.** One list of outstanding items across the property: unfinished work, unperformed required checks, required retests and open issues. This list feeds closeout (FR-32).
- **Checklists.** Editors for the common checklist, device-type starters and site checks: applicability, required or optional, expected result, evidence required. A check with no expected result shows Needs definition (FR-29, FR-43).

### 7.13 Reliability period (S-17, FR-64)

A site check with its own page.

- **Definition.** What it covers, what counts as downtime, and for each stage a planned duration and availability target. Missing values show Needs definition.
- **Start.** If work is outstanding, a notice lists it; Start remains available.
- **Running.** Elapsed and planned time, availability so far marked Provisional, the target, and totals of counted and uncounted downtime. A changed covered device appears as a flagged entry with "Continue" or "Restart", each asking for a reason.
- **Downtime log.** Each entry has what was affected, start, end (or "continuing"), description, linked issue, and whether it counts, with a reason when it does not. All entries stay visible.
- **End or stop.** End run computes the outcome. Stop run asks why: "The system failed to perform" records a Fail; "Another reason" keeps the run and its log with no outcome.
- Availability is computed and never typed.

### 7.14 Issues, service visits and warranty (S-18, S-19, FR-46, FR-65)

- **Issue list.** Stable ID, title, linked devices, state, disposition in this scope (Include now, Defer, Resolve) and age. An issue carried from an earlier scope says so.
- **Issue page.** A timeline: the original failure, attempts, service visits, corrections and resolution. Resolve is available only with corrective work and current evidence recorded.
- **Service visit form.** Reported when and how, visit time, fault found, work done, parts used, time spent, who attended, and under warranty. The last field is prefilled with a visible suggestion and its reason, for example "Suggested: Yes — installation warranty runs to 12 Nov 2027", and can be changed. The form states that a visit does not resolve the issue and changes no estimate.
- **Start service visit.** When no scope is active, one action opens a short confirmation that says what will happen: the project reopens into a new service scope with this issue included. An archived project asks to be un-archived first.
- **Warranty.** Recorded at closeout (term, start date defaulting to the closeout date, provider, note, covered items) and optionally per device. Status always shows its "as of" date. Equipment with no warranty recorded shows Unknown.

### 7.15 Records, issuing and closeout (S-20–S-23)

- **Records timeline (S-20).** One chronological list of the surveyed baseline, named revisions, issued designs (Current or Superseded), reviews, closeouts, package editions and backups. Each entry opens read-only. The latest backup shows its age and any failure (FR-34).
- **Compare (S-21).** Two revisions, or the issued design against the working installation, side by side at one scale with a list of changed devices and settings (FR-22, FR-26).
- **Issue a design (S-22).** Three steps: choose the revision; record approval, request review or bypass (all equal in weight, reason optional for bypass); confirm it becomes the current reference. Saving or exporting a draft never does this (FR-25, FR-61).
- **Restore a revision.** A guarded dialog states what will change (design content) and what will not (recorded positions, work, evidence, tests, issues), and lists items that cannot be restored (FR-22).
- **Close out (S-23).** Step one shows the remaining-work list. Step two offers Completed, disabled with the reasons when anything is outstanding, and Closed with outstanding items, which requires a short note. Step three records the warranty. Step four generates the Closeout package. Missing approval never disables either choice (FR-32).
- **Packages.** Choose Design or Closeout, floors and options (prices off by default). A partial selection is labelled Partial before export. Long jobs show progress and can fail visibly with Retry. Each retained edition lists its source revision and cutoff (FR-33, FR-34).

### 7.16 Reviewer view (S-24, FR-24)

A reviewer link opens a reduced frame: the fixed revision, its floors, comment pins and two decisions (Approve, Request changes). It asks for a display name first and says the name is not verified. There is no route from it to the working project.

## 8. Field design for phones and tablets

### 8.1 Shell (S-F1)

**Proposed.** Below the desktop layout width the frame changes to a field shell. A tablet in landscape may use either; the choice is offered, not forced (see decision D3).

- **Top bar, one row:** floor switcher, save status, and an account menu holding property, scope, issued reference, the user's name and role, My account and Sign out.
- **Bottom navigation, four items:** Plan, Equipment, Work, Issues. A fifth, More, holds Records and review.
- **No drafting tools.** No plan alignment, walls, zones, routes, estimate editing or template editing. Coverage is viewable as a layer.
- All controls are at least 44 px high. Form text is 16 px or larger (A5, A6).

### 8.2 The core loop: find, read, record

**Find (S-F2).** Three ways in, all leading to the same device sheet:

- Search by ID, label, name, room or model, from the Equipment tab. Recent devices are listed first.
- Filtered lists: "My floor", "Not installed", "Checks outstanding", "Imported, not verified", "Awaiting placement".
- Tapping a marker on the plan. Markers enlarge to 44 px, and a tap near several devices opens a short chooser instead of guessing.

**Read (S-F3).** The device sheet rises from the bottom over the plan and expands to full height. Its top section answers "what am I supposed to do here?":

- Identity, lifecycle and condition.
- The planned action in a sentence: "Add new — 4 MP dome, ceiling mount at 3.2 m, aimed at the lobby doors".
- Requirements from the current issued design, with "Compare with issued" showing issued and recorded values side by side where they differ (FR-61).
- Connection: closet, switch and port, cable ID.

**Record (S-F4).** Below, in the order work happens:

- **Work recorded.** Two large toggles, Installed and Configured, each stamped with name and time.
- **Checks.** Grouped as Installation, Configuration and Testing, with counts. Each check shows its task and expected result. Outcome is a three-button row: Pass, Fail, N/A. Fail opens a required short explanation. N/A opens a required reason. A measured check asks for value, unit and conditions before Pass is available. Earlier attempts are listed beneath (FR-30, FR-31).
- **Photo and note.** "Take photo" opens the camera directly; "Choose photo" opens the library. Each photo shows Uploading, then Saved, or Failed with Retry. It is not shown as saved until the upload and its link to the record have both succeeded (FR-31, NFR-2).
- **Report a change.** For "the camera is not where the drawing says" and similar: Moved, Different equipment, Route changed, Other. It records the change at once with a short reason, then lists the checks it has flagged (FR-27, FR-28).
- **Raise an issue**, linked to the device.

### 8.3 Placing and moving without dragging (S-F5)

Dragging a small marker on a phone is unreliable, so every placement has a non-drag method (NFR-3):

- **Crosshair placement.** The plan moves under a fixed crosshair at the centre of the screen. "Place here" confirms. This is the default on touch screens for placing an Awaiting placement record, adding a discovered device, moving a device and dropping a note pin.
- **Nudge buttons** move the selected item by a small step in four directions.
- On desktop, arrow keys nudge the selected item and the inspector accepts typed coordinates, bearing and limits.

### 8.4 Surveying an existing site (S-F6, FR-39, FR-56, FR-57)

The same shell, with survey filters. An imported record's sheet shows each value with its provenance chip.

- "Confirm as seen" confirms one value; "Confirm all shown" confirms the visible set. Confirmed values become Site-confirmed with name and time.
- Correcting a value keeps the earlier one in view: "Spreadsheet: P3245 · Site: P3265".
- Unknown stays a valid answer for any field. Nothing forces a guess.
- "Place on plan" starts crosshair placement on a chosen floor. The record keeps its ID.
- "Add device found on site" creates a new existing device at the crosshair.
- Optional prompts (lighting, shadows, uneven ground, mount rigidity) are offered and can be skipped (FR-20).

### 8.5 Connection loss and conflicts (S-F7)

- **Connection lost.** A persistent banner: "Not connected. Your entries are kept on this page until you are back online. Keep this page open." Each unsaved entry shows Unsaved. On reconnection the app checks current state before retrying, and never duplicates an entry that had already been saved (FR-21).
- **Conflict.** The affected item opens a comparison: the saved value, who saved it and when, beside the user's pending value, field by field. For each field the user keeps the saved value or reapplies their own, then saves again. Nothing is merged silently. The same pattern is used on desktop in a side panel (FR-42).
- **Additions never conflict.** Two people adding notes, photos or attempts to one device both succeed; the sheet simply shows both.
- **Incoming changes** to a form the user is filling in are held and announced ("This device was updated by Sam — review"), not applied under their hands.

### 8.6 Tablet

Tablets use the field shell with the plan and the device sheet side by side. In landscape at desktop width the user can switch to the desktop workspace for light editing. The acceptance matrix asks for field tasks on iPad, not drafting (NFR-3).

## 9. Key flows

Each flow lists its screens in order. The PRD's journeys are the source.

| Flow | Journey | Screens |
| --- | --- | --- |
| Start a property and align a plan | UJ-1 | S-01 → S-03 (search, import plan, two-point alignment) |
| Bring in an inventory and survey it | UJ-1 | S-09 import → S-08 Awaiting placement → S-F6 verify and place → Records: save surveyed baseline |
| Design changes on an existing site | UJ-1 | S-03 with basis Proposed → S-04 Work tab → S-11 Changes → S-05 coverage → S-12 connections → S-14 estimate |
| Issue the design | UJ-1 | S-20 save revision → S-22 issue (approve, review link or bypass) → S-21 package |
| Install and test | UJ-2 | S-F2 find → S-F3 read → S-F4 record → S-F7 if needed → S-15 progress |
| Record a field change | UJ-2 | S-F4 report a change → flagged checks → S-21 compare with issued |
| Run a reliability period | UJ-2 | S-17 define → start → log downtime → end → attempt |
| Close out | UJ-3 | S-15 remaining work → S-23 close out → warranty → package |
| Return for service | UJ-4 | S-18 issue → Start service visit → S-19 visit → check → S-23 close out |
| Return for new work | UJ-4 | S-20 reopen → new scope → S-11 scope → as UJ-1 from design |
| Review as a client | UJ-1, UJ-3 | S-24 |

## 10. Visual foundation

The white and teal direction is kept. These rules address the audit findings.

| Topic | Rule | Fixes |
| --- | --- | --- |
| Type sizes | Desktop: body 14 px, secondary 13 px, nothing below 12 px, and 12 px only for map labels and table metadata. Field: body 16 px, secondary 14 px. | A2, A6 |
| Text contrast | Body and secondary text at least 4.5:1 against its background. The pale grey-green label colour is replaced by a darker neutral. | A3 |
| Graphic contrast | Markers, outlines, icons and focus rings at least 3:1 against both the plan and satellite imagery. Markers keep a white halo. | NFR-3 |
| Targets | Field: 44 px minimum. Desktop: 32 px minimum for buttons, 24 px for dense table actions. | A5 |
| Focus | A visible 2 px focus ring on every interactive element, including markers. | NFR-3 |
| Zoom | Forms and task screens remain usable at 200% zoom: single column, no clipped labels, no horizontal scrolling. | NFR-3 |
| Fills | Covered area uses solid tints. Reach, illustrative previews and not-assessed areas use hatching. Proposed items use dashed outlines. | Principle 3 |
| Numbers | Units always shown. Estimated and measured values are labelled. Rounding never changes a pass or fail decision. | FR-15, FR-52 |

## 11. Components

New or changed components that the build will need. Existing prototype components not listed are kept.

| Component | Purpose |
| --- | --- |
| Project frame | Property, scope, issued reference, view, save status, account menu, members and reviewer links. |
| Basis control | Current installation, Proposed design, Changes. Used on the map and on every schedule and result. |
| Status chip set | One component with the families in section 6. |
| Device marker | Type icon, lifecycle outline, condition glyph, action glyph, attention mark; 32 px desktop, 44 px field. |
| Device inspector / device sheet | The same content as a desktop side panel and a field bottom sheet. |
| Check row | Task, expected result, outcome buttons, flags, attempts. |
| Evidence entry | Note, photo or measurement with author, time and its own save state. |
| Conflict comparison | Saved value beside pending value, per field. |
| Provenance field | A field with a source chip and prior values on demand. |
| Data table | Sticky header, filters, column chooser, multi-select, row to inspector. |
| Stepper | For import, issuing, closeout and packages. |
| Length ledger | Cable length arithmetic with basis per line. |
| Incomplete total | A total with its count of unknowns and a link to them. |
| Reason prompt | A short required or optional reason for cancel, correct, N/A, change and stop. |
| Crosshair placer | Non-drag placement on touch screens. |
| Timeline | For records, issues and device history. |
| Job progress | For import, package and backup jobs, with visible failure and retry. |

## 12. Confirmed design decisions

These are the points where this document chose something the PRD leaves open. Kevin confirmed all nine as recommended on 2026-11-18. They are UX design decisions, not new product requirements; D3 in particular sets a layout default and does not add a pixel rule to the PRD.

| # | Question | Confirmed |
| --- | --- | --- |
| D1 | Replace the tab row's dialogs with eight full-page areas (5.2)? | Yes. Dialogs cannot hold the schedules, import review or port tables. |
| D2 | Keep View (Design or Installation) and Basis (Current, Proposed, Changes) as two controls (5.3)? | Yes, with the view setting a default basis. One merged control would hide which population a number uses. |
| D3 | How does a device get the field shell? The PRD deliberately sets no pixel rule. | By available width as a default, with a manual switch on tablets and laptops. Phones always get the field shell, and it can place devices and record moves as NFR-3 and FR-27 require. |
| D4 | Leave drafting tools off phones entirely (8.1)? | Yes. The acceptance matrix does not ask for them, and it removes the risk of accidental design edits on site. |
| D5 | Regroup twelve tools into six groups (7.1)? | Yes. Worth a quick check with you on which tools you reach for most. |
| D6 | Make crosshair placement the default on touch screens (8.3)? | Yes, with dragging still available. |
| D7 | Show progress as counts instead of percentage bars (7.12)? | Yes, to respect the PRD's counter-metric about green indicators. |
| D8 | Offer one removal action chosen by eligibility, with an explanation link (7.2)? | Yes. It prevents the wrong action being picked and teaches the rules in place. |
| D9 | Import as a desktop task only? | Design it for desktop and keep it readable on a tablet. Verification and placement are the phone tasks. |

## 13. Visual designs

Every screen in this document is drawn on a design canvas, except the map-style variations noted there, so each can be reviewed and commented on directly. The canvas link and the list of screens it holds are recorded in [design-canvas.md](design-canvas.md). The canvas illustrates this specification; where they differ, this document governs until the difference is resolved.

## 14. Requirements coverage

Every functional requirement has a home. Requirements that govern behaviour without a screen of their own are listed against the screens where their effects show.

| Screens | Requirements |
| --- | --- |
| S-01 Frame, account menu, members and reviewer links, save status | FR-2, FR-21, FR-37, FR-42, FR-61, FR-68, NFR-2, NFR-5 |
| S-03 Plan workspace | FR-1, FR-3–6, FR-9, FR-11, FR-50, FR-60 |
| S-04 Device inspector | FR-7, FR-10, FR-20, FR-27, FR-35, FR-36, FR-40, FR-49, FR-54, FR-55 |
| S-05–S-06 Coverage, zones, pan/tilt/zoom | FR-10–16, FR-47, FR-48, FR-63 |
| S-08–S-10 Equipment, import, cleanup | FR-7, FR-8, FR-47, FR-49, FR-56–59, FR-62 |
| S-11 Scope and Changes | FR-40, FR-41, FR-45 |
| S-12–S-13 Connections | FR-9, FR-51–53 |
| S-14 Costs and capacity | FR-17–19 |
| S-15–S-17 Field work, reliability period | FR-28–31, FR-43, FR-44, FR-64 |
| S-18–S-19 Issues, service, warranty | FR-46, FR-65 |
| S-20–S-23 Records, issuing, closeout, packages | FR-22–26, FR-32–34, FR-37, FR-38, FR-61 |
| S-24 Reviewer | FR-24 |
| S-F1–S-F7 Field | FR-20, FR-27, FR-30, FR-31, FR-39, FR-56, FR-57, NFR-3, SM-4 |

## 15. Not designed here

- Exact PDF package layout. The PRD and addendum already fix its contents; page design is a separate task once the screens are agreed.
- Checklist wording, which is project-defined and owned by Kevin and domain review.
- Mechanisms for saving, syncing, storage and jobs, which belong to architecture. This document states only what the user must see: the four save states, per-entry upload state, held incoming updates, per-field conflict comparison and job progress with failure.
- Usability testing. Nothing here has been tested with users or on real devices. NFR-3 requires that before acceptance.

## 16. What architecture should take from this

- The interface needs a save state per item and per evidence entry, not only per project.
- Conflict comparison needs the saved version, its author and time, and the pending values, per field.
- Incoming changes must be deliverable to a client without being applied to a form or drag in progress.
- Analysis results need a status (Final, Updating, Not assessed) and must be cancellable and restartable as inputs change, within the 10-second target.
- The field shell loads one floor and one device at a time and should not need the whole property in memory to open a device from a search result.
- Import, package and backup jobs need progress, visible failure and retry.

## 17. Accounts, administration and updates (amendment 1.2)

PRD amendment 1.2 replaced edit links with accounts and added self-hosting, administrator controls and updates from the interface (FR-66–72). This section designs those screens, S-25 to S-36. It follows the choices Kevin made on 2026-11-18: email and password, accounts to edit with reviewer links kept, and the roles Administrator, Editor and Viewer. Kevin confirmed the design choices made here, D10 to D14 below, on the same day.

### 17.1 What changes in the screens already designed

| Place | Change |
| --- | --- |
| Project frame (S-01) | The unverified display name is replaced by an account menu: the user's name, their role in this project, My account, and Sign out. Administrators also see Administration. Share becomes "Members and reviewer links". |
| Every record of who did something | Shows the account's name. Only a reviewer-link name carries the label "name not verified". |
| Viewer in a project | Editing controls are removed, not greyed out, and a persistent "View only" chip sits in the frame. The device sheet shows results and evidence without the recording controls. A Viewer can search, download packages and files that already exist, and export schedules and estimates; Create package and Download backup are absent. A Viewer who is the assigned reviewer of a fixed revision sees the comment and decision controls on that revision only. |
| Approval assignments (S-22, S-23) | An assignee is chosen from the project's members and administrators, or entered as a named person who will get a reviewer link. If an assigned account is deactivated or removed, the assignment shows "Unavailable" with Reassign and Continue without approval. |
| Archive and portable backup | Editors and administrators see Archive, Un-archive and Download backup on Records (S-20). Importing a backup is offered wherever Create project is. |
| Reviewer view (S-24) | Unchanged. It still asks for a name and labels it not verified. A signed-in member reviewing the same revision sees their account name instead. |
| Field shell (S-F1) | Opens at sign-in when there is no session. If the session ends while a device sheet is open, the sheet asks the user to sign in again and keeps what they had entered. |
| Records (S-20) | Decisions show whether they were made by an account or through a link. |

### 17.2 Getting in

**First-run set-up (S-25, FR-66).** Shown only when the installation has no users. One page: the set-up code from the server output, the installation's name, and the first administrator's name, email and password. It states that this page disappears once an administrator exists.

**Sign in (S-26, FR-67).** Email and password, then a second step for the authenticator code when two-step verification is on, with "Use a recovery code" beneath. One message covers every failure: "That email and password do not match." After repeated failures it says how long to wait. "Forgot password" either sends an email or, where email is not set up, says "Ask an administrator for a reset link". Fields are 16 px and labelled, and work with password managers.

**Accept an invitation or reset a password (S-27, FR-67).** Opened from a single-use link. Shows who invited the person and to which installation, asks for their name and a password, and shows the password rules as they are met. An expired or used link says so and tells the person to ask for a new one. After setting a password, the person is offered two-step verification, or required to set it up if the administrator requires it.

**Projects (S-28, FR-68).** The page after signing in. Lists the projects the user belongs to with property name, role, scope state, last activity and attention count. A user with one project goes straight to it. Administrators see every project and a Create project action; standard users see Create only if the administrator allows it. An empty list says "You have not been added to a project yet. Ask an administrator."

### 17.3 My account (S-29, FR-67)

- **Profile:** name and email.
- **Password:** change it, which signs out other sessions.
- **Two-step verification:** turn on with a code to scan, confirm with one code, then show recovery codes once with Copy and Download. Turning off asks for the password.
- **Where you are signed in:** each session with device, place of last use and time, and "Sign out everywhere else".

### 17.4 Administration (S-30 to S-36, FR-70–72)

Administration is its own area with a left-hand list: Users, Projects, Reviewer links, Settings, Backups, Software, Activity. It is reached from the account menu and is never shown to standard users.

**Users (S-30).** A table of name, email, role, state (Invited, Active, Deactivated), two-step verification (On, Off, Required but not set up), projects and last sign-in. Invite opens a panel for email, name and role, with optional projects to add them to; it ends with a link to copy and, where email is set up, "Email it". A user's row opens their detail: change role, issue a password reset, reset two-step verification, sign them out everywhere, deactivate. Deactivating explains that their records keep their name. The last administrator's role and Deactivate controls are disabled with the reason.

**Projects (S-31).** A table of every project with state, members, last activity, stored size and latest backup. A project's row opens its members: add a user as Editor or Viewer, change a role, remove. Removing explains that the person's earlier entries stay. Create project, Archive and Un-archive are here.

**Reviewer links (S-32).** Every active link with project, revision, named reviewer, created by and last used. Revoke on each row. Revoked links move to a history list with their decisions intact.

**Settings (S-33).** Grouped as Installation (name), Sign-in (session length, require two-step verification, who may create projects), Email (off, or server details with Send a test message), Maps (optional provider keys) and Limits (the storage limits, read-only where the host fixes them). A saved secret shows only its last characters. Each group saves on its own and says what changed.

**Backups (S-34).** Each project and the installation's own records, with latest backup, age and outcome. A warning appears when the backup location is the same disk as the live data on a self-hosted installation. Back up now starts one. Restoring one project opens a three-step flow: choose a backup and see its date and the loss window; build and check a separate copy, with each check listed; then, only if every check passes, "Make this copy current", which states that this project's reviewer links are cancelled and must be issued again, and that nobody is signed out. Recovering the whole installation after a loss is a separate action. Afterwards everyone is signed out, every reviewer link is cancelled, and a notice names the recovery point and asks the administrator to review users and members changed since then.

**Software (S-35, FR-72).** The most consequential screen, so it is laid out as a sequence the administrator can follow.

| State | What is shown |
| --- | --- |
| Up to date | Installed version, when it was installed, when updates were last checked, and Check now. |
| Checks turned off | Installed version and "Update checks are off", with the manual steps. |
| Update available | The new version, its release notes, what the update will do in order, how long users will be interrupted, and Update now. |
| Cloudflare without one-step deployment | The same, with numbered manual steps in place of the button. |
| Updating | A full-page progress list: signature checked, backup taken, new version installed, data converted, checked. Each step shows done, in progress or waiting. No other control is available. |
| Done | The new version and a link to the release notes. |
| Failed and returned | Which step failed, a plain statement that the earlier version and its data are running again, and the log entry. |
| Failed and not returned | A prominent warning that never reads as success, what state the installation is in, and the steps to recover by hand: command-line steps when self-hosted, deployment steps on Cloudflare. |

Other signed-in users see a banner before the update starts ("An update starts in 2 minutes. Your unsaved work will be kept on this page.") and a full-page "Updating" notice while it runs, which clears by itself.

**Activity (S-36, FR-71).** A table of time, who, what and detail, newest first, with filters for person, kind of event and date, and Export. Failed sign-ins and administrative changes are visually distinct by an icon and label. No entry shows a secret.

### 17.5 Status language additions

| Family | Values | Appearance |
| --- | --- | --- |
| Account state | Invited, Active, Deactivated | Chip. Invited shows when the invitation expires. |
| Role | Administrator, Editor, Viewer | Text chip beside the name. "View only" in the frame for a Viewer. |
| Attribution | Account, Name not verified | The label "name not verified" follows only a reviewer-link name. |
| Two-step verification | On, Off, Required but not set up | Chip in the user table and on My account. |
| Software | Up to date, Update available, Updating, Update failed | Chip beside the version; a dot on Administration in the account menu when an update is available. |
| Backup | Succeeded with age, Failed, Never | Chip with the age always shown. |

### 17.6 Confirmed design decisions

| # | Question | Confirmed |
| --- | --- | --- |
| D10 | Administration as a separate area reached from the account menu, not a ninth project tab? | Yes. It concerns the installation, not one property. |
| D11 | A projects list as the page after signing in, skipped when a user has exactly one project? | Yes. |
| D12 | For a Viewer, remove editing controls and show "View only", instead of showing them disabled? | Yes. Disabled controls on every screen would be noise. |
| D13 | Lock the whole interface during an update, with a two-minute warning to signed-in users? | Yes. Saving cannot work while the server restarts. |
| D14 | Show recovery codes once only, with Copy and Download? | Yes. It is the usual, safe pattern. |

### 17.7 Requirements coverage for amendment 1.2

| Screens | Requirements |
| --- | --- |
| S-25 First-run set-up | FR-66 |
| S-22, S-23 approval assignments; S-24 | FR-23, FR-24 as amended |
| S-34 Backups, S-20 Records | FR-34 as amended, NFR-7 |
| Every screen, enforced on the server | NFR-5 |
| S-26 Sign in, S-27 Invitation and reset, S-29 My account | FR-67 |
| S-28 Projects, S-31 Administration: Projects, S-01 account menu and View only | FR-68 |
| S-01, S-04 History, S-20, S-24, packages | FR-69 |
| S-30 Users, S-31 Projects, S-32 Reviewer links, S-33 Settings, S-34 Backups | FR-70 |
| S-36 Activity | FR-71 |
| S-35 Software | FR-72, NFR-8 |
