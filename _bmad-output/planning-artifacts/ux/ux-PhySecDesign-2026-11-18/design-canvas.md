# Site Survey Design — design canvas

Canvas: https://claude.ai/artifact/NWwzBsnutPwRM7SxjNyQDL (Claude Design, private to Kevin unless shared from the page's Share menu).

Created 2026-11-18, and extended the same day after Kevin confirmed decisions D1–D9, to illustrate the [UX design specification](ux-design-specification.md). The specification governs where the two differ. The screens are static mockups drawn from the specification; they were not rendered and checked after publishing, and they have not been tested with users.

| Artboard | Screen | Shows |
| --- | --- | --- |
| Plan workspace with device inspector | S-01, S-03, S-04 | Project frame with scope, issued reference, view switch and save status; eight areas; basis control; six tool groups; docked analysis strip; device inspector on the Work tab. |
| Pan/tilt/zoom reach and zones | S-06 | Home view counted, position preview not counted, hatched reach, and a zone with its counted result and separate reachable-on-demand line (FR-63). |
| Inventory import, step 3 | S-09 | Review rows: New, Changed, Unchanged and Needs review; current and incoming values with provenance; site-confirmed values protected (FR-58, FR-62). |
| Find a device | S-F2 | Field shell, search, filters, device list grouped by scope category, Awaiting placement entry. |
| Read and record | S-F3, S-F4 | What to do, issued reference, work recorded, checks with Pass, Fail and N/A, per-photo save state, report a change. |
| Place without dragging | S-F5 | Crosshair placement with nudge buttons (FR-57, NFR-3). |
| Verify an imported record | S-F6 | Per-field provenance, confirm as seen, correct with the source value kept, unknown allowed (FR-39, FR-56). |
| Conflict | S-F7 | Saved value beside the pending value per field; additions never conflict (FR-42). |
| Status language | Section 6 | The twelve status families with their values. |
| Overview | S-02 | Progress by floor as counts, remaining work, attention items, activity, backup age. |
| Equipment schedule and cleanup | S-08, S-10 | Placed, Awaiting placement and Historical; filters; cleanup preview with protected records and reasons (FR-8, FR-57, FR-59). |
| Work scope and Changes | S-11 | Planned actions on the plan, a relocation arrow, a replacement pair, scope categories, cancellations (FR-40, FR-41, FR-45, FR-55). |
| Closets and port schedule | S-12 | Closets, a switch port table with allocation and availability as separate columns, a port conflict, an incomplete power check (FR-51). |
| Cable run and length ledger | S-13 | One run across two floors through a riser, with the length arithmetic and its basis per line (FR-9, FR-52). |
| Costs and capacity | S-14 | Estimate by subsystem, percentage lines with their base, an unpriced line and an incomplete total; capacity with unknowns (FR-17–19). |
| Field work progress | S-15 | Phase counts per device, the contradiction warning, the remaining-work list (FR-30, FR-31). |
| Reliability period | S-17 | Definition, a run in progress, provisional availability, the downtime log, a change during the run, an earlier failed attempt (FR-64). |
| Issue and service visit | S-18, S-19 | Issue history in a service scope, the service-visit form with the suggested warranty value (FR-46, FR-65). |
| Records | S-20 | Property history from surveyed baseline to draft revision, the current reference, backups, restore and archive (FR-22, FR-34, FR-37, FR-61). |
| Issue a design | S-22 | Approval step with review, self-approval and bypass at equal weight; what issuing does and does not do (FR-25, FR-26, FR-61). |
| Close out | S-23 | Completed unavailable with reasons; Closed with outstanding items and its note; optional final acceptance (FR-32). |
| Packages | S-37 (the artboard is still titled S-21) | Presets, floors with a Partial notice, options with prices off, a visible failed job, kept editions with cutoffs (FR-33, FR-34). |
| Reviewer view | S-24 | A fixed revision with plan comments and two decisions (FR-24). |
| Sign in; two-step code on a phone | S-26 | Email and password with one failure message; the authenticator step and recovery-code route (FR-67). |
| First-run set-up | S-25 | Set-up code, installation name, first administrator (FR-66). |
| Accept an invitation | S-27 | Single-use invitation, name, password rules as they are met, required two-step notice (FR-67). |
| Projects | S-28 | The page after signing in, with the update-available marker for an administrator (FR-68, FR-72). |
| My account | S-29 | Profile, password, two-step verification and recovery codes, signed-in sessions (FR-67). |
| Administration: Users | S-30 | People with role, state and two-step status; one user's controls (FR-70). |
| Administration: Projects and members | S-31 | Every project with storage and backup; members as Editor or Viewer (FR-68, FR-70). |
| Administration: Software update | S-35 | Installed and available versions, release notes, what the update will do, and the progress and failure states (FR-72, NFR-8). |
| Administration: Backups and restore | S-34 | Backup status including a failure, and the isolated restore with its checks (FR-34, FR-70). |
| Administration: Activity | S-36 | The activity log with filters and export (FR-71). |

The eleven screens above were added on 2026-11-18 for PRD amendment 1.2. On the same day the frames of the Plan workspace, Overview, Equipment and Issue screens were changed to show a signed-in account in place of an unverified name; the Reviewer view keeps its unverified name by design.

## Screens added from a second session on 2026-11-18

These seventeen artboards were added the same day from a separate planning session, to cover what the list above had left undrawn, plus approval assignments and installation recovery at Kevin's request. They follow the specification and PRD 1.2. They were rendered locally at their frame sizes and each screenshot was looked at; ten were corrected for clipped or overlapping content. They were not checked inside the canvas page and have not been tested with users.

| Artboard | Screen | Shows |
| --- | --- | --- |
| Coverage and zones | S-05 | Combined coverage against a named boundary; four zones showing Target met, Shortfall, Uncertain near target and Not demonstrated; views left out with reasons; a single-camera figure kept separate (FR-13, FR-15). |
| Annotations | S-07 | Fence line, dimension, entrance marker and callout in drafting style; the one-time "also block camera views?" prompt; the scale-unknown rule; a linked photo kept on deletion (FR-50). |
| Tablet: plan and device side by side | S-F1 | Field shell on a tablet with the plan beside the device sheet, the issued position as a ghost, and the switch to the desktop workspace. |
| Inventory import, step 1 | S-09 | File, sheet and heading row, with a preview of the first rows and an unsupported-file message. |
| Inventory import, step 2 | S-09 | One row per source column with samples and the suggested field; equipment-type values; the offered earlier mapping; the summary. |
| Inventory import, step 4 | S-09 | Counts of imported, unchanged, skipped, failed and unresolved; links to Awaiting placement and Needs review; rows not imported (FR-56–58, FR-62). |
| Equipment: Camera models | S-08 | Template list with specification status; one template's resolution, lens range, fields of view and source (FR-47). |
| Equipment: Doors and gates | S-08 | Openings with linked components that stay separate equipment; a shared controller counted once (FR-49). |
| Checklists and site checks | S-16 | Common, device-type and site check lists; one starter list by phase; a check with Needs definition (FR-29, FR-43). |
| Records: Compare with the issued design | S-21 | Issued design beside the recorded installation at one scale, with the differences listed (FR-22, FR-26). |
| Close out: warranty step | S-23 | Term, start, provider, note and covered items, with how the status will show afterwards (FR-65). |
| Members and reviewer links | S-01 | Project members by role, and reviewer links with copy, replace and revoke (FR-24, FR-68). |
| Viewer: view-only project | S-01 | The plan workspace for a Viewer: editing controls removed, a View only chip, results shown without recording controls (FR-68, D12). |
| Approval assignments | S-22, S-23 | Design and final acceptance reviewers; an unavailable assignee with Reassign and Continue without approval; reassignment to an account or a named person (FR-23). |
| Administration: Reviewer links | S-32 | Every active link in the installation, revoke with its effects, and the history list (FR-24, FR-70). |
| Administration: Settings | S-33 | Installation, sign-in, email with a failed test, maps and read-only limits (FR-70). |
| Administration: Recover the installation | S-34 | The notice after a whole-installation recovery, what was reset, what to review, and how a recovery is started (FR-34, NFR-7). |

Two details on these artboards go beyond the specification and are open to correction: on the recovery screen, the list of changes the backup does not hold assumes the administrator works from their own notes or an earlier activity export; and the Settings limits are shown as bracketed placeholders.

## Planned feature, not in the PRD: project schedule

Eight artboards in a separate canvas section, "After the POC: project schedule", each titled "Planned, not in PRD". They illustrate the [planned schedule note](../../prds/prd-PhySecDesign-2026-11-16/sources/future-schedule-gantt.md), which is not a requirement; project scheduling remains excluded from PRD 1.2. They carry no screen numbers.

| Artboard | Shows |
| --- | --- |
| Project schedule | Chart grouped by subsystem with phases, work-recorded fill, baseline bars, a today line, Late, At risk, Not scheduled and No work in scope, typed tasks, and a selected row's dates and dependencies. |
| Schedule on a phone | The read-only list of what is late, should have started and is in hand. |
| Baseline history | Dated baselines and a row-by-row comparison with the current schedule. |
| Set a baseline | The confirmation, with what is copied and what does not change. |
| Dependency loop refused | The rows in the loop named, nothing changed, and the way out. |
| Schedule in packages | The optional schedule page in the Design and Closeout packages. |
| Dependency lines and drag to link | Lines between rows, a link being dragged, and the list of links as the non-drag method. |
| Schedule grouped by floor | The same work by floor, with dates read-only there, as Kevin decided on 2026-11-18. |

Choices made in drawing these that the note does not settle are listed in this folder's [decision log](.memlog.md).

## Still not drawn

Everything an earlier version of this record listed as not drawn now has an artboard. The map-style variations noted in the specification remain undrawn.

## Not yet drawn (2026-11-19)

Three screens added by section 18 of the UX specification for agent access are not on the canvas: S-38 My account, Access tokens; S-39 Administration, Settings, Agent access; S-40 Administration, Users, a person's tokens.
