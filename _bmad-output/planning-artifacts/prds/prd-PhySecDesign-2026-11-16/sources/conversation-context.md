# Product direction recovered from this conversation

Recorded 2026-11-16. This is a condensed record of the user's instructions visible in this chat, not a complete transcript or access to other chats. Implementation evidence is in the other source digests.

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

The next pending recommendation is a guided per-device restore using stable floor identity and an explicitly confirmed destination/position. An unchanged or renamed floor can suggest its prior location; changed drawings/scale/alignment require review/repositioning. A missing floor requires selection or normal creation of a current floor, without silent recreation or matching by name. Preserve original location/plan/evidence context; no whole-project revision rollback, automatic cable reconnection or inherited Pass. Cancel if placement is not ready, leaving the device archived; separately creating a floor remains an independent action. Kevin subsequently confirmed this floor-restoration approach below.

## Confirmed floor restoration and next draft-deletion discussion

Kevin accepted the floor-restoration approach and asked for a recommendation on deleting accidental draft placements; he reconfirmed the acceptance on 2026-11-18 during a PRD review. Draft0.15 adds FR-54 and linked FR-1/36/42 clauses without changing earlier IDs. The acceptance does not establish a general floor-deletion policy. Accidental draft deletion was then the remaining OQ-8 decision.

## Confirmed draft deletion — OQ-8 resolved

On 2026-11-18, after a multi-perspective review of draft0.15, Kevin accepted the draft-deletion proposal and all three of its choices. Choose the action from a record’s history: Delete draft when it has no evidence, attempts or issues and was never in an issued design, surveyed baseline or closeout; Cancel from design, with a reason, when issued but never installed; Correct record, with a reason, when entered in error but already in a baseline or carrying evidence; archive only for actual removal. A just-placed existing-condition record is deletable as a draft. Eligible draft-only routes and reservations are removed with the device; retained or shared records are detached for review. Undo is the guarded own-session undo. Draft0.16 adds FR-55 and linked FR-21/35/36 clauses without changing earlier IDs. Floor deletion with contents is not defined; OQ-9 acceptance/limits remains open.

## Confirmed acceptance targets — OQ-9 resolved

On 2026-11-18 Kevin accepted the acceptance proposal and all five of its choices. Phones are field-only, with design on tablets and laptops. Photos are stored resized to 2,048 px, not as originals. WCAG 2.1 AA applies to forms, lists, schedules and the field view, with map-canvas drawing exempt. The tested fixture (2 buildings, 4 floors plus a site plan, 60 devices, 40 runs, 40 photos, 3 browsers) and supported ceiling (10 floors, 300 devices, 300 runs, 300 photos, 5 browsers) stand as tabled, with the timing and file limits in the PRD. Backups are nightly with 7-day retention and no uptime promise. Draft0.17 records these in NFR-2/3/4, A-2 and the acceptance section. OQ-10, deleting a floor with its contents, was recorded as a new undiscussed open question.

## Confirmed floor deletion, retirement and moves — OQ-10 resolved

On 2026-11-18 Kevin accepted the floor-deletion proposal and all four of its choices, explicitly including the move action. Delete a floor only when it is empty or draft-only and was never in an issued design, surveyed baseline or closeout. Block removal while active records with history remain, listing the action each needs; no one-step archive of everything on a floor. Retire a floor when only history remains, keeping it read-only and reinstatable. Floor-level drawing content goes with a deleted floor. Move to another floor keeps IDs and history, needs a confirmed destination position and is identified as a correction or an actual relocation. Draft0.18 adds FR-56 and linked FR-1/54/55 clauses. No owned open question remains; the draft is still not final.

## Confirmed delivery slices

On 2026-11-18 Kevin accepted five delivery slices and all five related choices. Slice 1 is the shared foundation, slice 2 design and issue, slice 3 install/test/close out, slice 4 existing sites and return visits, and slice 5 extended modelling (FR-48–52). Slices 1–4 are core acceptance and slice 5 is extended; the fixture is tested in two stages. Return-visit history precedes extended modelling, camera-model templates sit in slice 2, and FR-7/9/19/33 are delivered in parts. Draft0.19 adds the Delivery slices section without changing any requirement ID or wording.

## Confirmed FR-33 split

On 2026-11-18 Kevin accepted dividing FR-33 into lettered parts FR-33a–f (presets and contents; identification and status; defaults and honest evidence; layout, photos and omissions; lifecycle and connection context; extended-modelling content), keeping the FR-33 number so existing references stay valid. It is a restructure only, with confirmed sentences moved unchanged and a check per part. Draft0.20 also cites the lettered parts in the delivery slices.

## Confirmed device state model

On 2026-11-18 Kevin accepted a consolidated device state model and all five related choices. A device stores a lifecycle stage (Proposed, Installed, Removed) and a condition (Working, Faulty, Unknown). For each work scope it stores a planned action, a scope category and recorded installation/configuration work. Phase progress, attention flags and Current/Proposed membership are derived. Existing versus proposed is the lifecycle stage; recorded removal archives in one step; recorded work is separate from check-derived progress with a non-blocking warning on contradiction. Draft0.21 adds the subsection under Terms and lifecycle rules, with storage left to architecture.

## PSP reference review in progress

On 2026-11-18 the public ASIS PSP Body of Knowledge outline linked from the roadmap was read and mapped to the PRD. The PRD is strong on electronic-system design, installation, commissioning and replacement, and nearly silent on risk assessment, procurement and personnel. Kevin said he holds three licensed references on Kindle: Patterson, *Implementing Physical Protection Systems: A Practical Guide*; Garcia, *The Design and Evaluation of Physical Protection Systems*, 2nd edition; and Fischer, *Introduction to Security*. They have not been consulted. Kevin was unsure whether to write up five related proposals, so they remain pending and the PRD is unchanged at draft0.21. A six-question reading task is recorded in the PSP reference digest; Kevin will answer by notes or highlights, whichever is easier.

## Confirmed reference-based amendments

On 2026-11-18 Kevin shared further Patterson pages, decided to keep the DORI convention, found nothing in Fischer, and accepted a four-way sort of about twenty candidates. Group A was written into draft0.22: optional camera checks, optional site checks for alarm call-up and handover, camera enclosure and alarm-interface fields, survey prompts, percentage estimate lines with subsystem subtotals, and trade-term equivalents. The PSP dependency is reclassified with no compliance claim. Group B is to be discussed one at a time in this order: pan/tilt/zoom cameras, an optional reliability period, a warranty record. Groups C and D are listed in the PRD as after-POC candidates and exclusions.

## Confirmed pan/tilt/zoom cameras

On 2026-11-18 Kevin accepted the pan/tilt/zoom proposal and all six choices. Such a camera is one asset with one view, named stored positions and a home. Only the home view counts toward combined coverage and zone targets; other positions are previews; reach is a separate reachable-on-demand layer showing best achievable detail at full zoom, with no credit. Guard tours, auto-tracking and time-share figures are out of scope. Draft0.23 adds FR-57 in slice 5 and one such camera in the extended fixture. Remaining group B items: an optional reliability period, then a warranty record.

## Confirmed optional reliability period

On 2026-11-18 Kevin accepted the reliability-period proposal and all six choices. It is an optional site-level check, off by default, with project-defined duration, phases, downtime definition and availability target and nothing prescribed. People record each run’s start, end and outages; each outage links to an issue and states whether it counts; the software computes availability. Starting with work outstanding and changing equipment during a run are warned and flagged, never blocked. Existing outcome, retest and closeout rules apply. Draft0.24 adds FR-58 in slice 3, with a short period in the core fixture. The remaining group B item is a warranty record with service-visit fields.

## Confirmed warranty and service-visit records

On 2026-11-18 Kevin accepted the warranty proposal and all six choices. An installation warranty sits on a work scope and starts by default at its closeout date; an optional manufacturer warranty sits on a device; status is calculated and informational, with no reminders or service-level tracking. Service visits are entries on an issue with reported and visit times, fault found, work done, parts, time and an under-warranty value; they never resolve the issue and change no estimate. A service call after closeout reopens the project into a work scope marked as service through one action. Draft0.25 adds FR-59 in slice 4. All three individually discussed items from the reference review are now confirmed.

## Consistency pass and draft0.26

On 2026-11-18 Kevin asked for a fresh read of the whole draft. Mechanical checks were clean; an independent read found 25 inconsistencies, nearly all in that day’s additions. Kevin approved the batch of reconciliations and accepted five suggestions: Cancel from design covers any proposed device with history; whole-revision restore affects design content only; issue records and the Current/Proposed/Changes views move to slice 3; an open reliability run is in progress and a run stopped for a non-failure reason has no outcome; a phone flags a moved device for a plan update while repositioning needs the design workspace. Draft0.26 applies them. Whether a tablet narrower than 1280 px can reposition a device is undecided.

## Window-width rule

On 2026-11-18 Kevin settled the point left open by the consistency pass: window width decides the layout, not the device. At least 1280 px gets the design workspace; narrower gets the field view, which can flag a moved device or route but not reposition it. Draft0.27 applies this to journey 2, FR-27, NFR-3, the Terms note and the screen-size target.

## Second consistency pass and draft0.28

On 2026-11-18 a second independent read of draft0.27 found the earlier contradictions closed, one new contradiction about cable runs, and smaller items. Kevin approved the batch and accepted three suggestions: an installed mark recorded in error can be reversed with a reason; a whole-revision restore never changes recorded actual positions; the field view also supports raising issues, logging outages, service visits and reviewer approval. Draft0.28 applies them. The missing VideoCamera import in the revision comparison was also reproduced and fixed that day. Stopping whole-document reads was recommended but not explicitly confirmed by Kevin; the suggested next stages are architecture and UX.
