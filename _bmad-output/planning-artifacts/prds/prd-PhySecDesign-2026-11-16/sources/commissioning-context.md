# Commissioning workflow reference notes

**Finalization status — 2026-11-17:** The [PRD 1.0](../prd.md) is final; the dated source/discovery notes below retain their historical context. Current scope and owner responsibilities are in the PRD/addendum, with review evidence in the [disposition](../review-disposition.md).

Initial reference review: 2026-11-16; source-status reconciliation: 2026-11-17. These notes preserve the chronological discussion supporting Kevin's planning, installation, configuration and testing workflow. All known product choices in OQ-1–10 and PM-1/PM-2 are now resolved; document finalization is in progress. The current [PRD](../prd.md) and [decision log](../.memlog.md) govern accepted scope. Earlier candidate or pending language describes its historical discussion stage and is superseded where subsequent confirmations are recorded below. See the [reference-context reconciliation](../reconcile-reference-context.md). Software implementation and acceptance remain separate later work.

## User direction

The desired POC outcome includes optional installer handoff, documenting installation/testing/not-installed work with notes and photos, commissioning the site, exporting or archiving the project for later revisions, and archiving removed devices. The four named phases are confirmed. Approvals are optional and bypassable, with client/site-owner approvers assigned per project; internal users may handle their own approvals. Detailed completion conditions were still being elicited at intake; the later closeout, checklist and retest decisions below now define the confirmed POC behaviour.

## Limited external grounding

- [UFGS 28 08 10 — Electronic Security System Acceptance Testing](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf) describes planning, conducting, and documenting acceptance tests for integrated security systems, with designated witnessing and review responsibilities. This supports discussing test evidence and an explicit acceptance decision. It does not establish the particular tests, gates, or legal obligations for Site Studio projects.
- [Axis — Solving challenges for system integrators across the entire system lifecycle](https://newsroom.axis.com/en-in/article/smarter-way-manage-surveillance-projects) describes verification following installation and handing documentation to the customer, with training and supporting records for ongoing use. This provides vendor context for a handover milestone; it does not establish a requirement to use Axis products or automatically test real devices.

These are narrow reference checks, not a full commissioning standard, complete PSP review, or a claim that a specific contract applies. No long source passages are reproduced.

A follow-up check of UFGS 28 08 10 sections 3.3.5.1 and 3.3.5.3 confirms its emphasis on test logs, explanations of failures, corrective actions, retests, and tracked deficiencies. That specification treats unresolved failures as unsuccessful acceptance. The confirmed app option to close with outstanding items is a distinct project-management choice, not a representation that those tests passed or that this specification was met.

## Confirmed product interpretation

Keep recommended, optional design review/approval before installation and acceptance/handover after testing. Keep ongoing operation, later design revisions, and device removal/archiving available after commissioning. Keep project phases, project closeout, approval status, and individual device/test progress distinct. The confirmed flexible closeout behavior is recorded in `prd.md`; core evidence/archive behavior, checklist criteria and targeted retesting are now confirmed; full template wording remains implementation/domain setup. The archival edge cases that were open at this stage were subsequently confirmed in FR-53–55.

## Removed-device archive reference

[SiteOwl physical security asset management](https://getsiteowl.com/physical-security-asset-management-software/) describes retaining device histories and archiving retired devices while keeping the current register focused on active equipment. This supports the general historical-record pattern. Site Studio restoration behavior, calculation exclusions, and replacement links are confirmed product choices, not verified SiteOwl features. Kevin confirmed the recommended core archive model; missing-floor/cable handling and historical report inclusion were still undefined at that stage and were subsequently confirmed through FR-33/34/53/54. Whole-project archival and reopening are now confirmed.

## Field documentation recommendation

A further check of UFGS 28 08 10 sections 3.3.5 and 3.4 supports keeping test results, failures, correction/retest records, testing participants, and a chronological final report. Kevin confirmed the Site Studio approach of project-editable device-type checklists, notes/photos and explicit test outcomes for the POC. The particular labels and evidence defaults are product choices; no complete device test library or certification baseline has been defined. Installer use spans phones, tablets and laptops in a shared online project, with offline capture outside the POC scope.

## Installer-change approach

UFGS 28 08 10 section 3.2 calls for checking and updating redline drawings during pre-acceptance work. That supports retaining a representation of actual field conditions. Kevin confirmed the Site Studio model allowing permitted installers to edit a shared working installation record while retaining a fixed issued revision, before/after change history and optional review. This is a product choice, not adoption of the source specification's government approval requirements. Shared demo access is sufficient for the POC; individual sign-in accounts are not required.

## Later work and property continuity

The official [SiteOwl asset-management guide](https://getsiteowl.com/physical-security-asset-management-software/) describes keeping device histories through changes and retaining archived device records. This informs the continuity goal, not a required project hierarchy. Kevin confirmed the Site Studio POC model of one continuing property project with fixed closeout records, read-only archival, and a new named revision for later work. Stable device identities, scoped estimates/evidence, and visible unresolved items are retained; prior approvals or passes do not automatically qualify the new work. This is a Site Studio product decision, not a verified SiteOwl project hierarchy.

## Checklist criteria discussion — 2026-11-17

Rechecked UFGS 28 08 10 sections 3.1.3, 3.1.5 and 3.3.5 for the method/expected-result, test-log, failure/correction/retest pattern. These inform the OQ-3 recommendation in the addendum. Kevin subsequently confirmed the device-starter, pass/evidence, phase-completion and project-level-check approach. Final wording and project-specific criteria remain implementation/domain setup. No full PSP or manufacturer test library, required approval gates, numerical performance values or compliance acceptance is adopted.

## Retest-trigger discussion — 2026-11-17

Consulted UFGS 28 08 10 sections 3.2, 3.3.1 and 3.3.5 for camera positioning/view review and retained failure, corrective-action and retest records. The OQ-4 rule table, distinction between proposed work/record correction/actual change, and historical-result versus current-follow-up behavior are now confirmed Site Studio product choices following Kevin’s “Looks good” response. These references do not impose mandatory government approval gates or a complete automatic dependency/retest engine.

## Work-scope and issue-carryover discussion — 2026-11-17

Rechecked UFGS 28 08 10 sections 3.3.5.1 and 3.3.5.3 for failure explanations, correction/retest records and tracked outstanding deficiencies. This supports preserving issue histories only. Kevin subsequently confirmed one active work scope, scope-specific costs and checks, and persistent deferred issues with explicit outstanding-items closeout. These are confirmed Site Studio product choices, not source-prescribed behavior or adoption of mandatory government acceptance gates.

## Export package discussion — 2026-11-17

The [export reference digest](export-package-reference.md) checks official UFGS report/test-record sections and the CCTV Design Tool output guide. It supports discussing updated records, tests, correction/retest history and outstanding work, with separate visual and tabular outputs. Kevin subsequently confirmed the OQ-6 design/closeout packages, defaults, evidence layout and exact-file retention recorded in the addendum and PRD. Optional approvals, visible incomplete work, and the distinction between estimated analysis and observed tests remain confirmed; no mandatory contractual acceptance or certification is adopted.

## Equipment and cable scope discussion — 2026-11-17

The [equipment/cable reference digest](equipment-cable-reference.md) supplies limited official examples of generic devices, door component relationships, individual switch ports and cable-height inputs. The then-pending OQ-7 topics were noncamera catalog/template additions, independent opening/component identities, closet locations, explicit connection traits/ports and manual vertical cable allowances. Subsequent confirmations define the adopted scope in FR-49–52; they do not add unconfirmed noncamera template automation. The camera-model template direction was subsequently confirmed. Existing checklist criteria, targeted retests, scope costing and optional approvals remain confirmed. No universal wiring recipe, electrical engineering calculation or gate/egress compliance model is adopted.

## Camera-model clarification — 2026-11-17

Kevin explicitly requested model-specific camera templates with resolution, FoV and focal-length inputs for fixed/adjustable-lens DORI calculations. The [camera optical reference digest](camera-template-reference.md) distinguishes model/mode-dependent angles, physical scene dimensions, active sensor dimensions and varifocal settings. Model selection supplies analysis inputs; it does not establish on-site image performance, satisfy a field check, change DORI thresholds or, by itself, accept the other OQ-7 proposals; those received separate confirmations below.

## Panoramic-camera discussion — 2026-11-17

The [panoramic reference digest](panoramic-camera-reference.md) records official distinctions between independent optical heads, stitched outputs and single-sensor fisheyes, including nonuniform detail and raw/dewarped mode differences. Kevin subsequently confirmed the separate asset/view/stream model and bounded POC support in the addendum; calibrated panoramic DORI remains follow-on scope. A 360-degree indication does not establish uniform DORI, no obstructions or field acceptance. DORI thresholds, optional approvals and existing evidence/retest rules are unchanged.

The confirmed extension keeps supported head results, illustrative panoramic previews and unassessed detail distinct in plans, zone metrics and exported evidence. Not assessed is an analysis status, not another commissioning test outcome. Device demand is independent of optical-head/display-view count, while configured transmitted/recorded streams determine applicable bandwidth/storage estimates. The additional equipment/linked-opening group was subsequently confirmed under OQ-7; site annotations and connection/cable details were open at that stage and were subsequently confirmed in FR-50–52.

## Additional equipment and annotation discussion — 2026-11-17

Kevin confirmed extra equipment types and linked door/gate components with independent physical records, costs and lifecycle evidence. Added types can use the common/project-defined generic checklist; no universal door/gate sequence, wiring rule or automatic pass is introduced. The [site annotation reference digest](site-annotation-reference.md) supports discussing ordinary labels, lines/arrows, dimensions and drawing layers. Kevin subsequently confirmed the annotation scope, preserving separate roles for survey evidence, analytical zones, obstructions and cable records.

## Closet and port discussion — 2026-11-17

The [closet/port reference digest](closet-port-reference.md) supplies official context for grouped equipment, port/interface capabilities, separate power-demand/allocation/consumption meanings, controller terminals and passive patching. Kevin subsequently confirmed the manual location/assignment schedule with explicit assumptions, current/proposed separation and unknown-input warnings. Planned assignment or closet membership is not observed connectivity, installed work or a test Pass. Physical cross-floor routing/vertical allowances were subsequently confirmed; no universal port/wiring limit, live management or electrical certification is adopted.

## Physical cable routing discussion — 2026-11-17

The [inter-floor cable reference digest](interfloor-cable-reference.md) supports discussing editable cross-floor paths, height inputs, run schedules and separate patch leads. Kevin subsequently confirmed the explicit floor/riser/drop breakdown and allowance formula, recorded in FR-52 and resolving OQ-7. No floor height, percentage, cable limit or compliance standard is imposed. A drawn/estimated or measured route remains distinct from installed state and a passing field test; existing evidence/change/closeout rules continue to apply.

## Cable lifecycle discussion — 2026-11-17

The [connection-lifecycle reference digest](connection-lifecycle-reference.md) supports asset histories and inactive archives; the checked sources do not define automatic cable reuse, port release or restoration semantics. Kevin subsequently confirmed Site Studio behavior that keeps run history, explicitly reconciles current endpoints and occupancy, validates replacement/restored assignments and preserves appropriate retest follow-up. Device removal is not proof of cable removal or a released port, and historical Pass is not current connection verification. These cable-lifecycle rules are now confirmed in FR-53; changed-floor restoration was subsequently confirmed under FR-54, while accidental deletion was the remaining OQ-8 decision at that stage and was subsequently confirmed in FR-55. Optional approvals and established actual/proposed, evidence and closeout rules remain unchanged.

## Changed-floor restoration discussion — 2026-11-17

The [floor-restoration reference digest](floor-restoration-reference.md) records official floor-editing and inactive-asset-history examples without establishing competitor restore behavior. Kevin subsequently confirmed the Site Studio approach in FR-54: retain the old location/evidence, use the current destination plan with explicit placement confirmation, and avoid automatic floor recreation or project rollback. A drawing correction is distinct from an actual physical relocation; restoring an asset record does not complete installation or pass current tests. Cable connections already follow confirmed FR-53 safeguards.

## Accidental draft-deletion discussion — 2026-11-17

The [draft-deletion reference digest](draft-deletion-reference.md) reuses verified official design-editing/undo and inactive-asset-history references. Kevin subsequently confirmed Site Studio eligibility and dependency safeguards in FR-55: separate an accidental proposed placement from a surveyed/installed/field-evidenced asset, preserve records in snapshots and evidence history, and distinguish cancellation or record correction from actual removal. Undo is a guarded working edit and does not assert a physical restoration or passing test.

## POC software acceptance discussion — 2026-11-17

At this historical discussion stage, OQ-8 was resolved and OQ-9 proposed a complete workflow demonstration plus measured counts, browser/device/accessibility, response-time, file-budget and recovery criteria. The [acceptance baseline](poc-acceptance-baseline.md) distinguishes existing constants and historical QA from unmeasured shared editing, field-device and complete-package recovery work. [Official accessibility references](poc-acceptance-reference.md) guide focused checks without claiming conformance. Software acceptance is distinct from a site's field commissioning: fixture calculations and working UI do not establish security performance, certify DORI or turn recorded site failures into Pass. All new acceptance numbers and recovery targets awaited confirmation at that stage. Subsequent browser/usability, performance/fidelity and file/recovery decisions below now resolve OQ-9; the confirmed targets remain unmeasured product requirements.

## Larger-property acceptance input — 2026-11-17

Kevin supplied a 10-building property with 600 devices including 150 physical cameras, about 20–30 plans, up to about 60 cameras on the busiest plan and one usual/two concurrent users. The software-acceptance proposal at that stage distinguished small functional tests from a larger scale fixture and required re-evaluating earlier numeric performance/file candidates. The later scale and numeric-target confirmations below supersede that pending status; current capacity remains unverified. This does not change site test criteria, evidence/closeout rules or the distinction between modeled coverage and field commissioning.

## Confirmed POC scale test — 2026-11-17

Kevin confirmed the smaller functional plus larger real-site acceptance approach. NFR-4/SM-5/A-2 now capture that scope; exact workload construction remains engineering work. Remaining OQ-9 targets were unapproved at that stage and were subsequently confirmed through the browser/usability, performance/fidelity and file/recovery decisions below. Finalizing the product requirements document is separate from passing software acceptance or commissioning a physical site. Neither the scale confirmation nor future document finalization changes recorded field outcomes or supplies certification evidence.

## Imported inventory and site verification — 2026-11-17

Spreadsheet equipment intake followed by survey verification/addition is now confirmed in FR-39/56. Importing a source assertion does not establish installation, observed connection state, verified location or a field-test Pass. Corrections retain source provenance and prior evidence. Import formats, re-import matching and missing-location behaviour were under discussion at that stage and were subsequently confirmed in FR-57–59/62; existing commissioning requirements remain unchanged.

## Imported records awaiting placement — 2026-11-17

FR-57 now confirms the import-only Awaiting placement list. Placement, site verification, installation and test results remain distinct, with source history preserved. Missing geometry does not erase otherwise applicable demand or turn unknown input into zero. The newly requested bulk-cleanup direction and re-import rules awaited definition at that stage and were subsequently confirmed in FR-58/59; a mistaken data record must not be confused with documented removal of real equipment.

## Confirmed inventory reconciliation and cleanup — 2026-11-17

FR-58/59 now confirm reviewed duplicate/re-import handling and guarded bulk cleanup. Spreadsheet updates preserve verified evidence by default, do not establish field work or a passing test, and cannot reactivate an archived device automatically. Cleanup of a mistaken unused record is distinct from actual equipment removal; verified/issued/field-evidenced records and dependencies retain the existing correction/archive/history protections. Formats/mapping and the other party proposals were pending at that stage and were subsequently confirmed in FR-60–62.

## Container deletion confirmed; issued-reference proposal at this stage — 2026-11-17

FR-60 now limits floor/building deletion to unused drafts without dependent records or historical references. Actual/archived equipment, connections and commissioning evidence cannot disappear through container deletion; blocked dependencies stay visible. Existing missing-floor restoration remains supported. PM-2's current issued-design designation was proposed at that stage and was subsequently confirmed in FR-61. It does not imply approval, overwrite field evidence or change actual installation/test status.

## Confirmed current issued installation reference — 2026-11-17

FR-61 now confirms the current issued-design designation per active work scope. Current, Approved and actual installation/test status remain separate. Superseding an issue preserves its exact PDFs and decisions, does not transfer approval, and does not rewrite field evidence. The separate spreadsheet-mapping proposal at that stage likewise preserved imported source assertions as distinct from observed field work or passing tests; its subsequent confirmation in FR-62 resolves OQ-10.

## Confirmed spreadsheet mapping and software acceptance discussion — 2026-11-17

FR-62 resolves OQ-10 while preserving the distinction between imported source labels and observed installation/test evidence. A mapped spreadsheet status cannot create a verified Pass. The remaining OQ-9 discussions at that stage concerned tested browsers/tasks, responsiveness/fidelity and file/recovery policies; they do not replace physical-site commissioning criteria. The browser/task matrix and later numerical/file/recovery targets were subsequently confirmed below.

## Browser acceptance confirmed; numerical targets pending at this stage — 2026-11-17

NFR-3/SM-4 now confirm the browser/task and focused usability matrix. The then-pending performance/accuracy targets concerned software processing and independent calculations under known inputs; their subsequent confirmation does not certify field imagery, installation quality or a physical-site Pass. Analytical near-target uncertainty remains distinct from the established field-test outcomes. File/recovery targets were pending at that stage and were subsequently confirmed below.

## Confirmed software performance/accuracy; recovery discussion — 2026-11-17

The accepted numerical goals validate software behavior and supported reference calculations, not physical imaging or a commissioning Pass. FR-13/15 now preserve analysis freshness and near-target uncertainty separately from field outcomes. The then-proposed file/recovery policy required retaining captured evidence and exact historical packages without silent omission, and distinguishing ordinary zero-loss acknowledged saves from a catastrophic recovery point. Original-file retention and multi-volume packages were pending proposals at that stage and were subsequently confirmed below; prior source originals never retained cannot be fabricated.

## File/recovery policy confirmed; requirements ready for final review — 2026-11-17

Original/evidence retention, complete multi-volume exports, file/job budgets and daily/isolated recovery policy are now confirmed under FR-34 and the acceptance tables. Restoring a backup recovers recorded state as of its disclosed recovery point; it does not verify current physical conditions or turn prior observations into new Pass results. All known product decisions are resolved, and document finalization is in progress through reconciliation, current-document review and consolidation. Final PRD status has not yet been set. Software implementation and measured acceptance are separate later work.
