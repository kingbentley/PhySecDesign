# Product direction recovered from this conversation

Recorded 2026-11-16. This is a condensed record of the user's instructions visible in this chat, not a complete transcript or access to other chats. Implementation evidence is in the other source digests.



**Current status — 2026-11-17:** [PRD 1.0 is final](../prd.md). The dated discussion below preserves historical proposal states; later confirmations and the final PRD supersede them. See the [review disposition](../review-disposition.md) and [planning handoff](../handoff.md).

## Original purpose and audience

The user wants a web application for physical security professionals to place cameras and other objects on a site plan or map and plan a security project before implementation. The original request was for screen mockups, referencing CCTV Design Tool, SiteOwl, JVSG, and IPVM's calculator.

The user selected the Site Studio direction, then asked to combine Google Maps or an open-source map option with site plans over map tiles. The accepted visual reference is `design-mockups/04-map-overlay-studio.png`, as recorded in the workspace instructions. The user later explicitly called this a proof of concept and asked for an ordered feature sequence.

## Requested capabilities, in context

| Area | User's expressed intent |
| --- | --- |
| Property context | Search by address, use satellite imagery, and line up the site plan with the actual buildings. |
| Drawing alignment | Match two drawing corners to two building corners and automatically rotate and uniformly scale the overlay. |
| PDF input | Import a PDF, choose the needed page, and align that sheet over the satellite map. |
| Equipment | Place cameras, readers, doors, intercoms, sensors, gates, switches, and cabinets, with models, mounting details, and unique IDs. The requested list is broader than the current generic catalog. |
| Connections | Draw pathways to network closets, estimate cable lengths with slack, and identify connection endpoints. Explicit closet and physical-port management must be checked against the implemented subset. |
| Camera analysis | Adjust lenses, mounting height, and field of view; account for walls and obstructions; reveal blind spots. |
| Combined analysis | See all cameras' combined coverage, overlapping coverage, and areas no camera can see. |
| Image detail | Display Detect, Observe, Recognize, and Identify coverage in both camera and combined views. |
| Presentation of coverage | Replace visibly pixelated coverage with a cleaner vector/cone appearance. This visual request does not establish that the calculation itself is continuous or exact. |
| Security zones | Draw and name areas on each floor, set DORI targets such as Identify across 90% of an entrance, and see shortfalls while adjusting cameras. The 90% entrance is a user example, not a universal mandated target. |
| Survey | Attach photographs, measurements, installation constraints, and observations to a device or a position on a floor plan. |
| Deliverables | Print/share PDF plans with labels, coverage legends, equipment/cable schedules, and survey notes/photos. |
| Capacity | Estimate recording storage and bandwidth from camera settings and retention; show switch-port and PoE demand. |
| Costs | Total equipment, cable, accessories, and optional installation labor. |
| Recovery and alternatives | Autosave, undo changes, save named revisions, compare layouts, and distinguish existing equipment from proposed changes. |
| Collaboration | Share a named revision with specific reviewers, collect comments pinned to the floor plan, and see who approved which version. Desired reviewer identity is distinct from the present prototype's bearer-link behavior. |
| Installation handoff and execution | Optionally hand the project to an installer; document when devices are installed, tested, or not installed, including photos and notes. |
| Commissioning | Track planning, installation, configuration, and testing, plus appropriate additional phases to be discussed. |
| Building lifecycle | Export or archive project work for later revisions and archive devices removed during the building's lifecycle. |

These requests are inputs for discovery. A requested feature, a visible control, an implementation, and verified acceptance are separate kinds of evidence; the PRD must not silently treat them as equivalent.

## Domain grounding

The user originally wanted PSP documentation to inform what belongs in the software. No PSP reference documents are present among the supplied planning inputs. During this intake, Kevin said there were no additional inputs beyond the existing app and conversation. This does not establish that the PSP source collection has been reviewed or that the product meets any professional standard.

## Planning decisions confirmed on 2026-11-16

- BMAD is installed at the workspace root; planning should build from the existing prototype.
- The user requested that the PRD have access to everything built so far. A durable source index and source inventory address continuity between planning sessions.
- No additional product inputs were supplied at intake.
- At intake, carry forward the existing proof-of-concept scope. The success-outcome discussion subsequently extended the intended POC workflow through installation, commissioning, and building lifecycle records, as recorded below.
- Use the **guided path**, discussing product decisions before drafting requirements.
- Start with **vision and features**.

The canonical record for new planning decisions is the run's `.memlog.md`, maintained through BMAD's memory script. This source note preserves prior conversation context without replacing that decision log.

## Confirmed successful outcome

Kevin described a professional finding a property, importing its floor plan, placing devices, checking coverage, routing cables, estimating costs, and sharing a complete design package for review and installation. The project should then support installer handoff, installation documentation, and tracking commissioning phases. Devices removed during the building's lifecycle should be archived.

His clarification explicitly makes installer handoff optional. A user should be able to create a project, add devices while analyzing the space, record installed/tested/not-installed work, add photos and notes, commission the site, and export or archive the work for later revisions.

When asked about commissioning phases, Kevin named **planning, installation, configuration, and testing**, and invited other appropriate additions. Review/approval and acceptance/handover were recommended as additions; Kevin subsequently clarified their optional nature and assignment policy below. Later confirmations settle the core closeout and archive policies below; detailed checklist criteria and edge cases remain open.

## Confirmed approval policy

The client or site owner should approve the design and accept the completed site. The app must allow different people to be assigned to those approvals for each project. All approvals are recommended rather than required, and any approval can be bypassed. Internal projects may be handled and approved by the user doing the work; a separate external approver is not required.

Display a bypass distinctly from an actual approval to preserve accurate history. No mandatory bypass reason was requested.

## Confirmed closeout policy

Kevin initially requested a recommendation for unfinished installations or failed tests and then confirmed that the proposed approach fits. The confirmed states are In progress, Completed, and Closed with outstanding items. Closure with outstanding items retains one brief closeout note and the remaining items in exports, permits reopening, and preserves failed tests and retest history. Follow-up owners and due dates remain optional, and approvals remain separate and optional.

## Confirmed removed-device archive policy

Kevin requested an archive recommendation and then confirmed that it fits. Retain all recorded device identity, last location, settings, connections, photos, notes, installation history, and test results. Capture removal date, who recorded it, an optional reason, and any replacement link. Hide archived devices from the normal working plan and exclude them from current coverage, equipment totals, and capacity calculations. Keep a searchable archive, an optional historical-plan view, and archived records in project backups. Restore the same record and ID; a different physical replacement receives a new ID linked to its predecessor.

Detailed handling of cables, missing floors during restoration, and historical report inclusion remains open. Whole-project archival and reopening were confirmed subsequently.

## Confirmed field documentation

After requesting a recommendation, Kevin confirmed the checklist-and-evidence approach for the POC. Use editable starter templates by device type for installation, configuration and testing; attach notes/photos; capture expected and actual results; distinguish Pass, Fail, Not tested and Not applicable. Failures and Not applicable prompt a short explanation. Photos are optional unless the project requires them. Record who entered a result and when, preserve prior attempts on retesting, and carry unresolved work into closeout reporting.

## Confirmed field platform and shared work

Kevin said installers will use a mix of phones, tablets and laptops. He then confirmed online access is sufficient for the POC, so offline recording and later synchronization are outside its scope. Designers and installers should work in the same shared online project rather than exchange project files as their primary collaboration workflow. This requirement goes beyond the current browser-local draft and local revision-review implementation.

## Confirmed installer-change model

After requesting a recommendation, Kevin confirmed direct installer updates with a preserved issued design for the POC. Installers with editing permission update the working plan, while the issued named revision remains fixed. Record meaningful changes with before/after values, actor, time and a short reason; photos stay optional. Recalculate affected coverage/estimates and flag tests that may need repeating. Review remains optional, and later changes do not inherit the issued design's approval.

## Confirmed shared demo access

Kevin selected shared demo access for the POC instead of individual sign-in accounts and account-based project invitations. The shared online project requirement remains. On 2026-11-17 Kevin confirmed the access model: one hosted HTTPS demo, revocable project edit links, separate links for reviewing fixed design/closeout versions, server-enforced scope, unverified display-name attribution, and sample/sanitized project data. Individual accounts remain unnecessary. The hosting vendor is an architecture detail; the shared-update model was subsequently confirmed under OQ-2.

## Confirmed later work and draft authorization

Kevin confirmed: “Yes, let’s keep one project per property and reopen it with new revisions for later work. Go ahead and consolidate everything we’ve agreed on into the first full PRD draft.”

This adopts the preceding recommendation: one continuing property project, fixed closeout records, read-only project archives, and reopening into a new named revision with the same device IDs and history. New work gets a fresh scoped estimate and its own evidence. Old approvals/test results do not automatically qualify new work; unresolved items remain visible, and reopening does not restore removed devices or resolve issues automatically.

The first full draft consolidates the existing capabilities and confirmed decisions, retaining detailed access/concurrency, checklist content, package layout, scope/carryover mechanics, archive edge cases, and measurable acceptance targets as explicit open questions. The PRD remains a draft; this request is not final approval or an instruction to implement it.

## Confirmed existing-building workflow and next question

On 2026-11-17 Kevin confirmed the existing-site survey/upgrade approach and explicitly requested that it be added to the PRD. Capture existing devices/known routes with stable IDs, legacy labels, provenance, photos/notes and unknown attributes; preserve a surveyed baseline. Plan retain, relocate, service/reconfigure, replace, remove or add work separately from actual conditions. Current installation, Proposed design and Changes views avoid double-counted replacements; actual documented removal triggers archive. Retained assets contribute applicable analysis/capacity without automatic repurchase. Inventorying a device does not make it pass; scope tests for new/changed or explicitly selected existing equipment, keeping known defects visible. Detailed scope/retest/out-of-scope issue rules remain open.

Kevin also accepted the demo access model and asked for recommendations on shared updates/editing conflicts next. OQ-1 is resolved at the product level. The OQ-2 recommendation was subsequently confirmed as recorded below.

## Confirmed shared editing and next checklist discussion

On 2026-11-17 Kevin accepted the shared-editing approach and requested its addition to the PRD. Autosave and visible Saving/Saved/Unsaved/Conflict states, independent-item concurrent edits, explicit same-item conflict comparison/reapplication, separate evidence additions, duplicate-safe retries, updates within a few seconds, guarded own-session undo, retained pending input while the page is open, and fixed consistent saved snapshots are confirmed. Exact polling/transport, five-second timing, storage and recovery implementation remain architecture/OQ-9 details.

Kevin then requested recommendations for device checklists and pass criteria. Kevin subsequently confirmed OQ-3: common and device-specific starters, observable expected results, pass/evidence rules, phase completion and scoped site-level checks. Existing optional approvals, test outcomes and historical evidence policies remain confirmed.

## Confirmed checklist criteria and next retest discussion

On 2026-11-17 Kevin answered Yes to the OQ-3 recommendation. The POC uses common/type-specific editable Installation/Configuration/Testing templates, project-defined methods/expectations, core applicable checks required by default, and project-selectable extras. Pass requires an observed result meeting the expectation with required data/evidence; Fail/Not tested/Not applicable remain distinct. N/A requires a reason and is not a pass or a failed-test waiver. Separate phase completion requires applicable required passes/evidence and no unresolved phase failures; no applicable checks is not displayed as 100% passed. Photos remain optional unless required, prior attempts are preserved, existing equipment tests stay scoped, and a small editable site-level checklist records end-to-end functions/final records. Optional approvals remain separate.

The OQ-4 recommendation subsequently received confirmation, recorded below. OQ-5 scope/defect disposition is not silently decided.

## Confirmed targeted retesting and next scope discussion

On 2026-11-17 Kevin answered “Looks good” to the OQ-4 recommendation. The POC distinguishes proposed work, supported record-only corrections and actual changes; applies targeted review/retest triggers to affected geometry, settings, connections, shared dependencies, repairs/replacements/return to service and changed scene/criteria; and avoids functional retests for unrelated cosmetic/cost edits. Use known associations and expose uncertain impact for review. Preserve original outcomes and evidence, adding separate Needs review/Retest required flags with triggering context. Allow reasoned genuinely-unaffected dispositions without waiving required checks or failures. New attempts must apply to the current tested condition; later changes, undo, restoration and approval bypass cannot silently satisfy retesting. Required retests block Completed while explicit Closed with outstanding items remains available.

PRD draft 0.5 resolves OQ-4 and adds FR-44 while preserving earlier IDs. The OQ-5 scope, cost and issue-carryover recommendation was subsequently confirmed, as recorded below.

## Confirmed work scope and next export discussion

On 2026-11-17 Kevin accepted the OQ-5 approach, requested its addition to the PRD and asked for recommendations on design and closeout export packages next. Use one active named work scope per property work cycle, with multiple design revisions in it and Work now/Inspect-test only/Reference only categories. Estimate only the current work’s selected supply quantities, accessories and optional labor; do not automatically repurchase retained assets or carry earlier quantities forward. Distinguish installed route length from cable to supply, retain the quantity basis and apply slack once. Preserve prior estimates and unknown-price disclosures.

Keep stable property issue IDs across revisions with Include now, reasoned Defer and evidence-backed Resolve actions. Preserve prior outcomes, link corrective work/retests and keep meaningful corrections in history. Scope edits, archival or replacement alone cannot silently clear a real fault or required follow-up. A finished selected scope with deferred/out-of-scope property faults uses Closed with outstanding items; unknown legacy attributes and unscoped tests are not automatically faults. Approvals remain optional and historical closeouts unchanged.

PRD draft 0.6 resolves OQ-5 and adds FR-45/46 while preserving earlier IDs. OQ-6 subsequently received confirmation, recorded below.

## Confirmed export packages and next catalog/cable discussion

On 2026-11-17 Kevin accepted the package structure, requested its addition to the PRD and asked for equipment catalog/cable planning recommendations next. Use Design and Closeout PDF presets with labeled plans, schedules, appropriate evidence and explicit status. Design includes proposed work and installation expectations; closeout includes recorded installation, field changes, current-scope tests and relevant failures/retests, removed/replaced records, outstanding issues and approval/bypass history. Include quantities and capacity estimates by default; prices/labor costs are optional and off by default.

Use separate clean/coverage sheets, readable continuation pages and captioned photos initially two per page. Default to all floors; clearly label partial floor/evidence exports while retaining property-wide closeout outcome and outstanding issues. Keep raster/omitted-map-background and captured-image limitations explicit. Retain exact issued/closeout PDFs and manifests with the property and backup/recovery; regeneration or later decisions create a new dated edition tied to a fixed source and stated decision cutoff. Keep editable project backups and optional estimate CSV separate. Export does not require/grant approval or change closeout state.

PRD draft 0.7 resolves OQ-6/A-1 through FR-33/34 and NFR-6, preserving all 46 FR IDs. OQ-7 is the active question. The addendum proposes generic door/gate and related equipment records, project templates, site annotations, named closets, switch-port assignments and manual inter-floor cable estimates. The camera-template part was subsequently refined and confirmed below; other catalog/cable additions remain pending. The current door item is still a contact and the current route/capacity model has no explicit ports or risers.

## Confirmed model-specific camera templates

On 2026-11-17 Kevin clarified that reusable templates must represent specific camera models. Engineers can create templates with camera resolution, FoV height/width, lens focal length and other inputs needed to calculate DORI for fixed and adjustable lenses, then find/select known model numbers. This confirms the camera-template subpart of OQ-7, not the remaining proposed door/gate, closet, port or cable scope.

PRD draft 0.8 adds FR-47 and refines FR-7/10: explicit pixel width/height and capture/stream profiles, fixed versus supported varifocal ranges/selected setting, H/V FoV in degrees, active sensor dimensions where known, and source/unknown-input treatment. Physical scene width/height depends on a stated distance/plane and is derived. Keep model defaults separate from each camera’s placement, height, aim/tilt and operating lens/mode. Template revisions do not silently change installed/issued/tested devices, and explicit updates follow existing history/retest rules. The current DORI convention is unchanged; these requirements are not implemented by this documentation edit.

The remaining OQ-7 equipment/cable proposal and OQ-8/9 remain open.

## Multi-lens and fisheye discussion — pending recommendation

On 2026-11-17 Kevin asked how to handle cameras with multiple lenses and fisheye cameras spanning 360 degrees. This is a question, not confirmation of additional scope. The addendum recommends one physical camera asset with distinct optical view IDs and configured streams; independent supported heads receive their own geometry/resolution and best-view combined DORI. Hardware costs/ports/PoE remain separate from view and stream counts.

The proposal distinguished independent heads, stitched multisensor output and single-sensor fisheye/dewarped views. It was subsequently confirmed below; the earlier question alone did not constitute acceptance.

## Confirmed multi-view support and remaining catalog/cable decisions

On 2026-11-17 Kevin accepted the panoramic-camera approach, requested its addition to the PRD and asked what remains to decide for the equipment catalog and cable planning. Confirm one physical asset with stable view identities and configured streams, eligible conventional-head coverage/DORI, best-view combination without summed density, and separate body costs/interfaces/power versus actual stream demand. Include fisheye/stitched catalog placement and clearly illustrative previews when mounting/extent/range are known; their unsupported DORI remains Not assessed. Detailed calibrated panoramic DORI is deferred follow-on scope.

Keep the full zone denominator and no automatic target credit for illustrative outputs. A target already satisfied by supported views remains met, but missing panoramic analysis cannot prove a pass or that the actual site is blind. Preserve head/profile/stream context through evidence, revisions, exports and backup, with existing retest and optional-approval rules. These are requirements, not implemented features.

PRD draft0.9 adds FR-48 and related coverage/zone/capacity/history refinements, preserving earlier IDs. OQ-7 is partly resolved: camera templates and bounded panoramic support are settled. Remaining proposed groups are (1) additional catalog types and linked door/gate components, (2) site annotations, (3) closets/ports/connections and (4) inter-floor/vertical cable allowances. The additional catalog group was subsequently confirmed below; the camera acceptance alone did not approve those other groups. OQ-8 archive/restore edges and OQ-9 acceptance/limits remain separate.

## Confirmed additional equipment and next annotation discussion

On 2026-11-17 Kevin accepted the additional equipment types and linked door/gate components, requested their addition to the PRD and asked for site annotation recommendations next. Add generic doors/gates, access controllers/control panels, locks/strikes, request-to-exit devices, low-voltage power supplies, NVR/recorder and custom records alongside the existing types. Preserve the distinction between a physical opening and the existing door-contact records. Linked components retain independent identity, costs, work states, tests, notes/photos and history; a shared controller/supply is not duplicated per opening. Associations do not invent cables/ports, fixed bundles, installed state or test passes. Use existing scope/cost/lifecycle rules and common/generic project-defined checks.

PRD draft0.10 adds FR-49 and updates FR-7/29. Dedicated noncamera template-library/automation behavior was not added by this confirmation; camera templates remain explicitly required. Remaining OQ-7 groups are site annotations, closets/ports/connections and inter-floor/vertical cable detail. The addendum’s site annotation proposal uses named perimeter lines, entrance markers/arrows, existing zones for area labels, callouts and scaled dimensions, with existing survey evidence and clear separation from calculations. Kevin subsequently confirmed that scope below.

## Confirmed annotations and next closet/port discussion

On 2026-11-17 Kevin accepted the annotation scope, requested its addition to the PRD and asked about network closets and port assignments next. Confirm named fence/perimeter lines, entrance markers/arrows with optional existing-record references, existing zones for named areas with optional targets, text/callouts and scaled two-point dimensions. Calculated dimensions are plan estimates with units/scale limitations; field measurements stay separate survey observations. Reuse survey evidence, preserve linked records on annotation deletion/hiding, and keep markup separate from obstructions, analysis boundaries, cable/cost records and power demand. Include annotations in selected exported plans by default and preserve geometry/references with normal shared editing, undo/revisions and backups.

PRD draft0.11 adds FR-50 and related FR-20/33/42 clauses, preserving earlier IDs. Remaining OQ-7 groups are closets/ports/connections and inter-floor/vertical cable detail. The addendum now proposes named closet equipment groups and manual port schedules with explicit network/terminal identities, current/proposed assignments, reservations/availability, source-based power checks and unresolved-demand reporting. Logical cross-floor assignments are distinct from the still-pending physical route/vertical-length scope. The closet/port approach was subsequently confirmed below; OQ-8/9 remain separate later questions.

## Confirmed closets/ports and next physical routing discussion

On 2026-11-17 Kevin accepted the closet/port-assignment approach, requested its addition to the PRD and asked for routing between floors and vertical/drop allowances next. Confirm named closet/location groups with individual assets, explicit manual port/terminal references, separate allocation and condition, planned/current assignments and reservations, cable/passive references, known compatible power bases and incomplete assessment of unknowns. Keep hardware demand distinct from view/stream counts and controller terminals distinct from Ethernet; preserve property-wide demand, concurrency/dependency checks, schedules and history. Logical assignments may cross floors before physical routes are drawn, without creating installed work or test results.

PRD draft0.12 adds FR-51 and linked FR-9/19/33/42/49 behavior. The remaining OQ-7 choice is physical inter-floor routing and allowances. The addendum proposes one run ID with ordered floor segments and named risers, explicit transition/drop lengths, fixed service-loop allowances and a selected percentage applied once to the route subtotal. Keep patch leads, supply quantity and measured installed length separate, disclose incomplete inputs and count each physical run once. The illustrative 40 m route + 2 m loops + 10% of route = 46 m does not set a default. Kevin subsequently confirmed this cable proposal below; OQ-8/9 stay open.

## Confirmed routing and next cable-lifecycle discussion

On 2026-11-17 Kevin accepted the routing/allowance model, requested its addition to the PRD and asked about cable connections when devices are archived, replaced or restored. Confirm one physical run ID across ordered per-floor segments and named risers; each floor uses its own scale. Enter transition/drop lengths with units/source, count each portion once and distinguish unknown from explicit zero. Use R = horizontal + transitions + endpoint drops; suggested Q = R + fixed loops/extras + selected percentage × R, applied once excluding fixed extras. Preserve separate selected supply quantity/basis, ordering rounding and measured installed total, without duplicate patch-lead quantities or inventing vertical inputs for legacy horizontal-only data. Keep history, source context, shared-reference conflict checks, matching-basis warnings and per-floor continuation/property-wide schedules.

Draft0.13 adds FR-52 and linked FR-9/17/33/42 clauses, resolving OQ-7 without changing earlier IDs. OQ-8 and OQ-9 remain open. The pending cable-lifecycle proposal keeps retained runs/history independent from device removal; explicitly reconciles endpoints and reuse/removal; preserves port occupancy/reservations until verified release; uses new linked IDs for physical replacements and explicit validated reconnection on restoration. Prior tests remain historical with appropriate current-context follow-up. Kevin subsequently confirmed the cable-lifecycle proposal below. Changed/deleted-floor restoration and accidental draft deletion remain separate OQ-8 details.

## Confirmed cable lifecycle and next floor-restoration discussion

On 2026-11-17 Kevin accepted the cable lifecycle approach, requested its addition to the PRD and asked about restoring devices whose original floor changed or was deleted. Confirm independent retained cable records/history, explicit endpoint disposition, no automatic cable removal/port release, new linked physical replacement IDs, retained-run identity on reuse and explicit validated reconnection on same-device restoration. Preserve known occupancy/reservations and unknowns, shared-equipment dependents, historical evidence and appropriate current-context retest; planned changes do not assert field work. Draft0.14 adds FR-53 and related clauses without closing OQ-8.

The next pending recommendation is a guided per-device restore using stable floor identity and an explicitly confirmed destination/position. An unchanged or renamed floor can suggest its prior location; changed drawings/scale/alignment require review/repositioning. A missing floor requires selection or normal creation of a current floor, without silent recreation or matching by name. Preserve original location/plan/evidence context; no whole-project revision rollback, automatic cable reconnection or inherited Pass. Cancel if placement is not ready, leaving the device archived; separately creating a floor remains an independent action. Kevin subsequently confirmed changed-floor restoration below; accidental draft deletion remains open, with acceptance/limits still OQ-9.

## Confirmed floor restoration and next accidental-deletion discussion

On 2026-11-17 Kevin explicitly accepted the floor-restoration approach, requested its addition to the PRD and asked about deleting accidental draft placements. Confirm stable floor identity, a valid current destination floor and explicitly confirmed position before completing per-device restoration. Preview prior placement on an unchanged/renamed floor; review/reposition on changed drawing/scale/alignment/layout; choose an existing or normally created floor when the original is missing. Cancel if not ready, leaving the device archived; a separately created floor remains independent. Preserve original identity/location/evidence and current checks, without automatic floor recreation, whole-project rollback, cable reconnection or inherited Pass.

Draft0.15 adds FR-54 and related clauses while preserving prior FR IDs. Accidental draft deletion remains the final OQ-8 detail; OQ-9 is unchanged. The next pending proposal distinguishes quick deletion with guarded Undo for eligible unissued proposed placements, cancellation of issued/approved planned items, and actual-removal archive or explained record correction for real/historical equipment. Preserve snapshots, notes/photos/comments/issues and shared cable/port dependencies; a blank installation flag alone is insufficient to establish delete eligibility. No extra recycle-bin workflow or indefinite undo guarantee is proposed. Kevin subsequently confirmed this draft-deletion approach below.

## Confirmed draft deletion and next acceptance discussion

On 2026-11-17 Kevin accepted the draft-deletion approach, requested its addition to the PRD and asked about POC acceptance criteria and limits. Confirm quick Delete draft with Undo for eligible unissued, never-installed/surveyed proposed placements without field evidence; history-based eligibility; explicit dependency effects without cable/component/evidence cascades; exclusive planned-reservation checks; preserved snapshots/history; issued-proposal cancellation and actual-removal/archive versus explained record correction. Guard undo against changed floors, reused ports, later edits and changed eligibility. Draft0.16 adds FR-55 and resolves OQ-8; OQ-9 remains open.

The next pending acceptance proposal combines the complete design-to-lifecycle demonstration, critical failure/access/history checks and a bounded measured envelope. Proposed upper fixture: one property, two buildings/four plans, 100 devices, 40 assessed views (20 per plan), 100 runs, 10 zones, explicit geometry limits, 100 processed photos, 20 revisions and at least four retained packages, with two editors and one reviewer. Real desktop and field-device workflows, focused accessibility, numerical reference fixtures and explicit timing/byte/recovery boundaries are proposed. Separate 50 MiB source-PDF/media budgets, 80 MiB final-report/100-page targets and 500 MiB complete backup need implementation work; they are not existing capabilities. Daily independent backups/seven daily generations, up-to-24-hour catastrophic recovery point and a 60-minute recovery exercise are also pending. No confirmed requirement is silently dropped to meet size/timing.

Per the updated workspace instructions, the source index and canonical log were read and all148 inventoried files checked: only .gitignore changed;147 other fingerprints are unchanged. The historical inventory was not rewritten. No application tests or acceptance flows were run.

## Larger-site scale clarification — 2026-11-17

Kevin asked whether the proposed limits could be increased and explained that his sites are much larger. In follow-up he supplied 10 buildings; 600 total devices including 150 cameras; 2–3 floor/site plans per building; up to about 60 cameras on the busiest plan; and probably one user at a time, occasionally two. Approximately 20–30 plans is the arithmetic estimate from the building/plan inputs. Physical camera counts are distinct from optical views and configured streams, which remain to be specified.

Draft0.17 records this real-site planning profile in NFR-4/A-2 and the addendum. The revised recommendation is a small functional fixture plus a larger POC scale fixture based on these inputs. The earlier 2-building/100-device/three-participant example is superseded as the representative target, not made a permanent product ceiling. Larger support needs engineering and validation; changing a limit alone does not establish performance. Analytical geometry/views, realistic connections/evidence/history, timings and media/report/backup budgets must be defined against the larger profile. The prior numerical acceptance proposal is not approved, and OQ-9 remains open. No application changes or load tests were performed.

## Confirmed larger scale test and finalization readiness — 2026-11-17

Kevin accepted using the real-site profile for the POC larger scale test and requested its addition to the PRD, then asked what remains before finalization. Confirm a small functional fixture alongside the larger property with 10 buildings, 600 devices including 150 physical cameras, about 20–30 plans, up to about 60 cameras on the busiest plan and one usual/two simultaneous users. Draft0.18 confirms this in NFR-4/SM-5 and resolves A-2 without adding functional requirements or approving earlier numeric limits.

OQ-9 remains for browser/device/accessibility acceptance, responsiveness and analytical fidelity, and media/report/backup/recovery limits. These product choices need resolution or explicit owned deferral/revisit conditions. Exact fixture construction and benchmark mechanics are downstream engineering tasks; the agreed scale and confirmed features remain fixed. Final decision/input reconciliation, current-document review, open-item disposition and structure/prose polish remain before marking the PRD final. No application implementation/testing or complete PSP review is required to finalize this noncompliance POC document; no compliance or tested-capacity claim is introduced.

## Party-mode decision — spreadsheet intake before survey, 2026-11-17

Asked how a large existing-site inventory begins, Kevin said it could be either an existing spreadsheet or collection during the survey, and explicitly requested importing a spreadsheet when available, then verifying or adding devices during the survey. Draft0.19 updates FR-39 and adds FR-56, superseding the earlier bulk-equipment-import deferral. Imported source information stays distinct from site verification and does not create installed/tested outcomes. Formats, mapping, matching/re-import and missing-floor/position handling remain OQ-10; proposed import staging has not been accepted and must be distinguished from FR-54 restoration. Other party proposals remain pending.

## Party-mode decision — Awaiting placement; duplicate/re-import and bulk-cleanup discussion

On 2026-11-17 Kevin accepted an Awaiting placement list for imported devices and requested its addition to the PRD. He asked for duplicate/re-import recommendations and said a bulk-delete option would help. Draft0.20 adds FR-57 and updates FR-8/54/56: imported inventory without floor/position remains visible with identity/source hints, can be placed and verified during survey, and does not fabricate geometry, installation or test outcomes. Otherwise applicable property demand/unknowns remain visible. Archived restoration still requires a confirmed destination; this is an import-only distinction.

Bulk delete is requested direction; exact eligibility and behavior remain pending. The party proposes stable-ID matching with ambiguity review, New/Unchanged/Changed/Needs review previews, protection of site-verified values, no clearing from blank cells, no deletion for missing spreadsheet rows, guarded retries/concurrent changes, and explicit bulk cleanup of eligible drafts or erroneous unused import records. Imported existing assets are not automatically deletable drafts. Protect pre-existing/verified/issued/field-evidenced or subsequently changed records and linked evidence/connections. Formats and these matching/update/cleanup mechanics remain OQ-10. The party has not concluded.

## Confirmed duplicate/re-import and bulk-cleanup scope — 2026-11-17

Kevin explicitly accepted the recommended duplicate/re-import approach and bulk-delete scope, requested its addition to the PRD and asked for the remaining party findings. Draft0.21 adds FR-58/59: stable property/source identifiers, New/Unchanged/Changed/Needs review previews with batch handling, no duplicate creation on re-import/retry, retained verified values by default, explicit reviewed changes, no erasure from blank cells or absent rows, and no automatic archived-record restoration.

Bulk cleanup allows selected eligible drafts and confirmed mistaken unused import-created records after a selected-count and eligible/blocked preview. It protects verified/issued/installed/tested records, later edits, dependent evidence/history and matched pre-existing devices. Preserve activity and guarded own-session undo; data cleanup does not document physical removal. Current-version/dependency checks continue to apply. Formats and sheet/column mapping remain OQ-10; floor/building deletion (PM-1), current issued installation reference (PM-2) and OQ-9 acceptance policy remain pending. No app implementation, finalization or party wrap-up is implied.

## Confirmed floor/building deletion and current-issued-design discussion — 2026-11-17

Kevin accepted the rule that only unused draft floors/buildings without dependent records or historical references can be deleted, and requested its addition to the PRD. Draft0.22 FR-60 and linked FR-1/42/54 preserve blocked containers with visible dependency reasons and no cascading loss. Device/import cleanup remains FR-55/59, and prior missing-floor recovery remains FR-54. A full retirement/relocation subsystem is not added.

Kevin asked for the current-issued-design recommendation next; he has not accepted PM-2. The proposal is one deliberately designated current issued design per active work scope, visibly identified for installers, with superseded issues retained and clearly marked in the live app. Saving a draft/exporting a preview does not promote it; field work and exact historical PDFs/approvals remain unchanged. Optional approvals and existing conflict/history rules continue; detailed proposal is in the addendum. OQ-9 and formats/mapping under OQ-10 remain open; party mode continues.

## Confirmed current-issued-design approach; spreadsheet format discussion — 2026-11-17

Kevin accepted the current-issued-design recommendation and asked to add it to the PRD, then requested recommendations for spreadsheet formats and column mapping. Draft0.23 adds FR-61 and linked FR-26/42/45 clauses: one deliberately designated current fixed issued revision per active work scope, visible issue/revision/date and separate approval state, no promotion by draft save or preview export, retained superseded issues and exact PDFs, untouched field work, and actor/time/conflict history. This resolves PM-2 without changing optional approval or claiming installation/test completion.

OQ-10 remains pending. The recommendation is UTF-8 CSV and Excel .xlsx, one chosen tabular sheet/header, suggested but editable column/type/location mappings, inventory identity/type/model/serial/network/location/notes fields, explicit unknowns, and the existing duplicate/verified-data preview. Offer a sample template and remembered project mapping with revalidation; exclude automatic model/connection creation and source-status-as-field-evidence. Detailed proposed handling and file/worksheet boundaries are in the addendum. OQ-9 acceptance remains open; no application work or PRD finalization occurred and party mode continues.

## Confirmed spreadsheet scope; remaining POC acceptance — 2026-11-17

Kevin accepted the spreadsheet formats and column-mapping scope and requested its addition to the PRD, then asked for recommendations on remaining POC acceptance criteria. Draft0.24 adds FR-62 and updates FR-56, resolving OQ-10. CSV/.xlsx, selected sheet/header, suggested editable mappings, minimal inventory identity and explicit unknowns, reviewed row outcomes, preserved identifiers/source evidence, and a sample template plus previewed reuse of the project mapping are confirmed. Unsupported legacy/macro/protected/live integrations remain deferred; actual implementation and resource limits are separate.

OQ-9 is the remaining product-decision group. Recommend resolving it in three guided stages: browser/device/task and focused usability matrix first; responsiveness with analysis fidelity second; media/report/backup boundaries and recovery objectives third. The proposed first matrix uses Windows Chrome/Edge for the desktop workflow and real iPhone/iPad Safari plus Android Chrome for field/review tasks, with recorded environments and keyboard/focus/labels/zoom/noncolor/drag-alternative checks. This matrix is pending, not accepted. Confirmed 10-building/600-device scale and existing integrity rules remain unchanged; older numerical candidates are not adopted and no software acceptance or PRD finalization occurred.

## Confirmed browser/usability scope; performance and accuracy discussion — 2026-11-17

Kevin accepted the browser/usability acceptance scope and requested its addition to the PRD. Draft0.25 updates NFR-3/SM-4: Windows Chrome/Edge desktop workflow and real iPhone/iPad Safari plus Android Chrome field/review tasks, recorded environments, durable saved state after reload, visible conflicts/errors, labeled controls, keyboard/focus, 200% zoom, usable touch/drag alternatives and noncolor status. Apply to both confirmed fixtures without requiring full desktop drafting density on phones or claiming universal/full-conformance support.

Kevin asked for performance/analysis targets next. The pending proposal is 250 ms control feedback,1 s inventory lookup,2 s ordinary durable metadata save,5 s peer propagation after save,10 s first project open,5 s warm plan switch and10 s completed active busiest-plan combined/DORI/all-zone analysis after a committed edit. Use declared real workload/hardware/network and at least19of20 timing trials per operation; no accuracy/integrity failure is excused. Independent supported optical reference error target1%, zone-area target2 percentage points, effective spacing no coarser than1 m with finer sampling as needed, and explicit near-target uncertainty/refinement. The zone tolerance is not a certified live error bound or proof of correct threshold classification. Existing solver limits require engineering; targets are unapproved/unmeasured. File/media/report/backup timing and recovery remain the next OQ-9 group.

## Confirmed performance/accuracy; file and recovery recommendations — 2026-11-17

Kevin accepted the proposed performance/analysis-accuracy targets and requested their addition to the PRD. Draft0.26 updates NFR-4/SM-5, FR-13/15 and the acceptance table:250 ms feedback,1 s lookup,2 s ordinary durable save,5 s peer propagation after save,10 s initial usable plan,5 s warm plan switch and10 s complete busiest-plan combined/DORI/all-zone result. At least19of20 timing trials must meet targets, with data/access/calculation integrity on every applicable trial. Known-input optical reference target1%, zone-reference target2 percentage points, sampling<=1 m with finer refinement, honest uncertainty near thresholds, no rounding-created Target met or silent fidelity reduction. This is accepted scope, not measured implementation support.

Kevin asked about filelimits, exports, backups and recovery next. Pending recommendations: PDF100 MiB, source image/photo25 MiB, CSV/.xlsx10 MiB;250 pages/100 MiB per PDF volume with complete-edition manifest and1 GiB totaledition budget;8 GiB retained project payload and10 GiB portable container. New original drawing/photo retention with previews is explicitly proposed, not already adopted. Use meaningful1200-photo sizing examples and count all retained editions/history within aggregate capacity. Proposed job processing clocks are separate from transfer. Daily seven successful generations plus pre-maintenance backup; zero-loss ordinary acknowledged state remains confirmed, while catastrophic24h recovery point/60min automated retrieval+restore goals remain proposed. Large user-file transfers cannot be hidden within the60min claim. Details and clocks are in the addendum; OQ-9 remains open and party mode continues.

## Confirmed file/export/backup/recovery scope and finalization readiness — 2026-11-17

Kevin accepted the file/export/backup/recovery scope, requested its addition to the PRD and asked what remains before finalization. Draft0.27 resolves OQ-9, completing all known OQ-1–10 product decisions plus PM-1/PM-2. Accepted inputs:PDF100 MiB,image/photo25 MiB,CSV/.xlsx10 MiB;PDFvolume250 pages/100 MiB,completeedition1 GiB,retainedproject8 GiB,portablebackup10 GiB. Retain new originals+previews, complete numbered PDF editions/manifests and all required history within aggregate limits; legacy originals never retained stay unavailable. Filejobprocessing clocks are separate fromtransfer and keep the agreed30s/10s/30s/5min/10min/15min bounds.

Accept daily independentlystored completebackups with7successfuldailygenerations pluspremaintenance backup, zero ordinary acknowledged-save loss, catastrophicrecoverypoint<=24h and automatedretrieval/restore<=60min in thepreparedrecoveryenvironment. Isolated restore verifies IDs/evidence/history/exactPDFs and preserves workingdata onfailure; oldcredentials/revokedlinks are not reactivated. OriginalPDF parsing/passwordhandling remainslocal while the sourcefile andpreview are retained aftersuccessfulimport.

Main crossrefs FR-4/6/20/21/33/34, NFR-2/4/6 and acceptance tables now capture these decisions. Superseded small-fixture candidates are preserved in a historical source instead of active policy tables. Remaining documentwork: fullcanonicaldecisionaudit and input reconciliation, currentrubric/reviewerpass withfindingdisposition, then structural/proseconsolidation and finalstatus. Known productchoicesareclosed, butfocusedchecks are notthefinalgate. Architecture/UX/domain-template/testmanifest responsibilities are assigned toroles/revisitmilestones in theaddendum; implementation/load/recoverytests are downstream softwareacceptance, not prerequisites tofinalizerequirements. Party mode has not been formally wrapped and the PRD remains draft.


## Finalized requirements baseline — 2026-11-17

Kevin authorized the remaining BMAD finalization work. Completed the canonical decision audit, reconciliation of prototype/design/delivery/reference inputs, current rubric and consistency review, finding disposition, structural/prose passes and post-consolidation fidelity checks. PRD 1.0 retains 62 FRs and Checks, six NFRs and five success measures. No new product question remains. Preserved draft0.27 snapshots and all historical decision records. Clarified archived append-only export editions and timing batches without changing accepted scope or targets. No application implementation or runtime acceptance test was performed; UX, architecture, stories and measured software acceptance follow the handoff. Party-mode discussion is closed.

## Parallel session and proposed amendment 1.1 — 2026-11-18

A cloud session started on 2026-11-18 from the repository as it stood just before PRD 1.0 was committed, at draft 0.15. Unaware of 1.0, it ran its own review rounds with Kevin and reached a draft 0.28, including its own answers to questions 1.0 had already settled and its own FR-55 to FR-59. On discovering the divergence, Kevin chose to keep PRD 1.0 as the baseline and port only what was new. The parallel draft is preserved under sources/parallel-session-draft-0.28. Proposed amendment 1.1 adds FR-63 (pan/tilt/zoom cameras), FR-64 (optional reliability period) and FR-65 (warranty and service visits), with small additions to FR-7/18/20/29/43, drawn from a review of PSP reference material. The device state model and delivery slices from that session are not yet ported. Differences between that session’s decisions and PRD 1.0 are listed in the amendment status for Kevin’s choice and are not applied.
