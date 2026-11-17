# Commissioning workflow reference notes

Reviewed 2026-11-16 to support Kevin's request for sensible additions to planning, installation, configuration, and testing.

## User direction

The desired POC outcome includes optional installer handoff, documenting installation/testing/not-installed work with notes and photos, commissioning the site, exporting or archiving the project for later revisions, and archiving removed devices. The four named phases are confirmed. Approvals are optional and bypassable, with client/site-owner approvers assigned per project; internal users may handle their own approvals. Detailed completion conditions are still being elicited.

## Limited external grounding

- [UFGS 28 08 10 — Electronic Security System Acceptance Testing](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf) describes planning, conducting, and documenting acceptance tests for integrated security systems, with designated witnessing and review responsibilities. This supports discussing test evidence and an explicit acceptance decision. It does not establish the particular tests, gates, or legal obligations for Site Studio projects.
- [Axis — Solving challenges for system integrators across the entire system lifecycle](https://newsroom.axis.com/en-in/article/smarter-way-manage-surveillance-projects) describes verification following installation and handing documentation to the customer, with training and supporting records for ongoing use. This provides vendor context for a handover milestone; it does not establish a requirement to use Axis products or automatically test real devices.

These are narrow reference checks, not a full commissioning standard, complete PSP review, or a claim that a specific contract applies. No long source passages are reproduced.

A follow-up check of UFGS 28 08 10 sections 3.3.5.1 and 3.3.5.3 confirms its emphasis on test logs, explanations of failures, corrective actions, retests, and tracked deficiencies. That specification treats unresolved failures as unsuccessful acceptance. The confirmed app option to close with outstanding items is a distinct project-management choice, not a representation that those tests passed or that this specification was met.

## Confirmed product interpretation

Keep recommended, optional design review/approval before installation and acceptance/handover after testing. Keep ongoing operation, later design revisions, and device removal/archiving available after commissioning. Keep project phases, project closeout, approval status, and individual device/test progress distinct. The confirmed flexible closeout behavior is recorded in `prd.md`; core evidence/archive behavior, checklist criteria and targeted retesting are now confirmed; full template wording remains implementation/domain setup, and archival edge cases remain open.

## Removed-device archive reference

[SiteOwl physical security asset management](https://getsiteowl.com/physical-security-asset-management-software/) describes retaining device histories and archiving retired devices while keeping the current register focused on active equipment. This supports the general historical-record pattern. Site Studio restoration behavior, calculation exclusions, and replacement links are confirmed product choices, not verified SiteOwl features. Kevin confirmed the recommended core archive model; missing-floor/cable handling and historical report inclusion still need definition. Whole-project archival and reopening are now confirmed.

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

The [equipment/cable reference digest](equipment-cable-reference.md) supplies limited official examples of generic devices, door component relationships, individual switch ports and cable-height inputs. The remaining OQ-7 recommendations stay pending: noncamera catalog/template additions, independent opening/component identities, closet locations, explicit connection traits/ports and manual vertical cable allowances. The camera-model template direction was subsequently confirmed. Existing checklist criteria, targeted retests, scope costing and optional approvals remain confirmed. No universal wiring recipe, electrical engineering calculation or gate/egress compliance model is adopted.

## Camera-model clarification — 2026-11-17

Kevin explicitly requested model-specific camera templates with resolution, FoV and focal-length inputs for fixed/adjustable-lens DORI calculations. The [camera optical reference digest](camera-template-reference.md) distinguishes model/mode-dependent angles, physical scene dimensions, active sensor dimensions and varifocal settings. Model selection supplies analysis inputs; it does not establish on-site image performance, satisfy a field check, change DORI thresholds or accept the other OQ-7 scope proposals.

## Panoramic-camera discussion — 2026-11-17

The [panoramic reference digest](panoramic-camera-reference.md) records official distinctions between independent optical heads, stitched outputs and single-sensor fisheyes, including nonuniform detail and raw/dewarped mode differences. Kevin subsequently confirmed the separate asset/view/stream model and bounded POC support in the addendum; calibrated panoramic DORI remains follow-on scope. A 360-degree indication does not establish uniform DORI, no obstructions or field acceptance. DORI thresholds, optional approvals and existing evidence/retest rules are unchanged.

The confirmed extension keeps supported head results, illustrative panoramic previews and unassessed detail distinct in plans, zone metrics and exported evidence. Not assessed is an analysis status, not another commissioning test outcome. Device demand is independent of optical-head/display-view count, while configured transmitted/recorded streams determine applicable bandwidth/storage estimates. The additional equipment/linked-opening group was subsequently confirmed under OQ-7; site annotations and connection/cable details remain open.

## Additional equipment and annotation discussion — 2026-11-17

Kevin confirmed extra equipment types and linked door/gate components with independent physical records, costs and lifecycle evidence. Added types can use the common/project-defined generic checklist; no universal door/gate sequence, wiring rule or automatic pass is introduced. The [site annotation reference digest](site-annotation-reference.md) supports discussing ordinary labels, lines/arrows, dimensions and drawing layers. Kevin subsequently confirmed the annotation scope, preserving separate roles for survey evidence, analytical zones, obstructions and cable records.

## Closet and port discussion — 2026-11-17

The [closet/port reference digest](closet-port-reference.md) supplies official context for grouped equipment, port/interface capabilities, separate power-demand/allocation/consumption meanings, controller terminals and passive patching. Kevin subsequently confirmed the manual location/assignment schedule with explicit assumptions, current/proposed separation and unknown-input warnings. Planned assignment or closet membership is not observed connectivity, installed work or a test Pass. Physical cross-floor routing/vertical allowances were subsequently confirmed; no universal port/wiring limit, live management or electrical certification is adopted.

## Physical cable routing discussion — 2026-11-17

The [inter-floor cable reference digest](interfloor-cable-reference.md) supports discussing editable cross-floor paths, height inputs, run schedules and separate patch leads. Kevin subsequently confirmed the explicit floor/riser/drop breakdown and allowance formula, recorded in FR-52 and resolving OQ-7. No floor height, percentage, cable limit or compliance standard is imposed. A drawn/estimated or measured route remains distinct from installed state and a passing field test; existing evidence/change/closeout rules continue to apply.

## Cable lifecycle discussion — 2026-11-17

The [connection-lifecycle reference digest](connection-lifecycle-reference.md) supports asset histories and inactive archives; the checked sources do not define automatic cable reuse, port release or restoration semantics. Kevin subsequently confirmed Site Studio behavior that keeps run history, explicitly reconciles current endpoints and occupancy, validates replacement/restored assignments and preserves appropriate retest follow-up. Device removal is not proof of cable removal or a released port, and historical Pass is not current connection verification. These cable-lifecycle rules are now confirmed in FR-53; changed-floor restoration and accidental deletion remain open within OQ-8. Optional approvals and established actual/proposed, evidence and closeout rules remain unchanged.

## Changed-floor restoration discussion — 2026-11-17

The [floor-restoration reference digest](floor-restoration-reference.md) records official floor-editing and inactive-asset-history examples without establishing competitor restore behavior. The pending Site Studio proposal retains the old location and evidence, uses the current destination plan with explicit placement confirmation, and avoids automatic floor recreation or project rollback. A drawing correction is distinct from an actual physical relocation; restoring an asset record does not complete installation or pass current tests. Cable connections already follow confirmed FR-53 safeguards.
