# Confirmed panoramic-camera support extract

Recorded 2026-11-17 for guided PRD refinement. Sources: [PRD draft 0.8](../prd.md), the preceding panoramic recommendation in the [addendum](../addendum.md), [canonical memory](../.memlog.md), [prior scope extract](panoramic-camera-scope-extract.md), and Kevin's latest confirmation: “Yes, let's use that approach for the POC and add it to the PRD. What remains to decide for the equipment catalog and cable planning?”

**Decision status:** The bounded panoramic approach below is accepted. Its earlier pending labels are superseded. This is a further confirmed camera subpart of OQ-7; the noncamera catalog/opening/location/port/cable proposals remain pending. Advanced calibrated fisheye/stitched DORI remains a separate follow-on scope choice, not a newly accepted solver requirement. OQ-7–OQ-9 remain open and the PRD remains draft. No main documents/application files were edited and no tests were run for this extraction.

## Accepted physical asset, view and stream model

- Keep one physical camera asset for housing/model, mount, purchase cost, installation history and actual network/power requirements.
- Give each supported head/optical view a stable child identity, resolution/mode, lens setting, bearing and tilt. A compact body may share a mounting point as an explicitly disclosed approximation. Adjust a head only as its model permits; retain identifiable condition/settings/test references.
- Do not create multiple billable bodies merely to represent multiple lenses. Physical replacement/archive rules continue to apply to the body and preserved subordinate history.
- Configured streams are distinct from optical/display views. Bandwidth/storage follows streams actually transported/recorded and their selected settings. Physical port/PoE demand follows actual interfaces/device requirements, not the number of views.
- Four lenses do not establish four network connections; four display panels derived from one stream do not automatically create four new recording demands. Conversely, separately transported/recorded streams contribute their own demand.
- Optional accessories/license allowances may represent explicitly selected extra costs; no universal per-view licensing rule is adopted.

## Accepted initial POC support levels

| Arrangement | Accepted initial behavior | Boundary |
| --- | --- | --- |
| Independent conventional heads | Model each supported rectilinear head with its own effective pixels, FoV, lens setting, bearing and tilt. Union supported visibility and use the best eligible unobstructed view for DORI. | Keep each head identifiable; four 5 MP heads do not provide 20 MP in every direction. Same-body heads are not separate independent physical cameras. |
| Single-sensor fisheye | Place/document the physical camera, lens/output profile and orientation. Show explicitly illustrative 360-degree/directional footprint only when mounting/extent/chosen range are known. | Quantitative DORI stays **Not assessed** until a supported projection/calibration model exists. An illustration is not assessed geometry or a zone-target contribution. |
| Stitched multisensor panorama | Preserve source-head versus composite-output identity. Supported source heads with sufficient optical data may be evaluated as explicitly identified views. | Do not claim those results describe a differently stitched recording. Composite-output DORI stays **Not assessed** without a supported projection/sampling profile. |

Raw 360-degree values must not be inserted into the existing rectilinear FOV control, and total megapixels must not be split into fabricated exact cones. Manufacturer DORI distances remain labeled conditional reference data; a few stated distances do not define a complete floor contour.

A future calibrated evaluated output would require source/crop resolution, ray-to-pixel projection/calibration, selected raw/dewarped/stitched output and effective sampling, mounting orientation and target-plane context. Enlarged/interpolated output is not newly captured optical detail. These describe prerequisites for a later supported solver, not an accepted commitment to implement it in the initial POC.

## Accepted combined analysis and zone behavior

- Use distinct analytic view IDs beneath the physical parent. Union supported visible areas and select the best eligible single view at each sample; never sum pixel densities across views.
- Distinguish overlapping optical views from overlapping physical camera bodies. Views from one raw capture do not establish independent captured detail or independent physical-device redundancy.
- Preserve Current installation/Proposed design basis, condition exclusions, complete boundary, common target height and the existing DORI thresholds.
- A 360-degree description means surrounding angular coverage, not unlimited range, uniform detail or absence of wall/obstruction effects.
- Illustrative panoramic footprints are visually distinct from assessed geometry/DORI and receive no automatic zone-target credit. Keep the entire zone polygon as denominator; do not delete unassessed regions to improve its percentage.
- Report supported-view contributions and unassessed-camera/output contributions clearly. A target already met by assessed views can remain met. Otherwise missing panoramic analysis does not establish either a target pass or that the actual site is blind.
- Use wording such as **Not covered by assessed views**, accompanied by the unassessed contribution notice, rather than an unconditional 100% blind claim.
- Not assessed is analysis-support metadata, not a fifth field-test outcome. The existing Pass/Fail/Not tested/Not applicable and review/retest follow-up distinctions remain unchanged.

## Accepted lifecycle, evidence and export boundaries

Retain parent/child identities and selected profiles through named/issued/closeout revisions, field evidence, exports and backup. Per-head changes affect the relevant checks; shared hardware changes may affect several heads under the targeted retest policy. Applying new template values is explicit; old evidence keeps its tested context. No new approval gate or field-test Pass is created by modeled results.

Whole-device archive/replacement, changed-floor restoration and connected endpoint handling continue under accepted lifecycle rules and pending OQ-8 details. Exported packages identify assessed views, unsupported outputs and illustrative footprints. Body quantities and physical demand remain separate from view/stream breakdowns.

## Requirement mapping for integration

| Clause | Accepted refinement |
| --- | --- |
| **FR-7 / FR-47** | Extend camera models/instances with physical-parent, stable view identities and separately configured stream information; explicit independent-head, fisheye and stitched-output support status. Preserve source/profile/version data. |
| **FR-10** | Supported head-specific optical inputs/aim, with model-permitted adjustment; illustrative panoramic placement is distinct from quantitative supported geometry. General calibrated projection remains deferred. |
| **FR-12 / FR-14** | Combine eligible optical views with union visibility and best-view DORI, no density sum; distinguish view overlap from separate physical-camera overlap. Preserve same-capture/detail limitations. |
| **FR-13 / FR-15** | Explicit included/excluded/unassessed views/outputs, whole analysis/zone denominator, no target credit for illustrations and no unsupported-equals-blind inference. Assessed views may independently satisfy a target. |
| **FR-17 / FR-19** | Count parent body/actual hardware interfaces and power separately from configured transported/recorded streams. Do not duplicate body purchases or bandwidth for derivative display panels. This does not accept the broader pending switch-port-management proposal. |
| **FR-22 / FR-27 / FR-28 / FR-31 / FR-44** | Preserve parent/view/stream profile and tested context in history. A head adjustment can affect selected checks; body movement/replacement can affect several. Follow-ups remain scoped and separate from outcomes. |
| **FR-33 / FR-34** | Export/backup stable relationships, physical quantities, assessed versus illustrative/unassessed results, and appropriate source-output labels. Fixed packages remain fixed. |
| **Potential appended panoramic FR** | A dedicated requirement after FR-47 can gather support levels, identities/accounting and analysis truth without overloading the reusable-template requirement. Retain existing IDs. |
| **OQ-7/addendum deferral** | Mark the bounded panoramic subpart accepted and replace the old blanket pending/deferral wording. Preserve explicit deferral of detailed calibrated raw/composite panoramic DORI and the pending noncamera/cable subparts. |
| **OQ-9** | Still owns representative body/view/stream counts, analysis/render budgets and acceptance limits. The current 500 camera-model limit is not a 500 panoramic-body performance guarantee. |

## Four consistency risks

1. **Parent identity versus analysis identity.** Current combined code skips duplicate camera IDs; one parent ID reused by every head loses views. Separate whole-camera clones overcount supply, ports and PoE. Use distinct child view IDs and explicit physical-parent accounting; model supported multiple interfaces without assuming view count equals port count.
2. **Best-view detail versus duplicated pixels/streams.** Do not give each head the panorama's aggregate resolution or sum densities. A source head's analysis does not automatically validate a stitched recording. Count actually transported/recorded streams, not UI panels or every derivative view.
3. **Unassessed versus blind/target pass.** The current no-eligible-camera result labels the whole area uncovered. With unsupported panorama outputs, expose partial assessment instead of claiming actual blindness. Illustrations earn no target credit; the full zone denominator remains, while sufficient independently assessed views can still meet the target.
4. **Bounded acceptance versus a universal fisheye engine.** The user accepted supported independent-head analysis plus fisheye/stitched inventory/illustrations and disclosed unassessed outputs. Detailed calibrated panoramic DORI stays follow-on scope; noncamera catalog/closet/port/riser proposals are still pending. Preserve field verification, immutable evidence and optional approvals.

## Remaining OQ-7 decisions — all still pending

The following are the previously proposed choices to discuss next, not consequences automatically accepted through panoramic support.

### Noncamera catalog and reusable arrangements

- Whether to add actual door/gate assets, access controller/control panel, lock/strike, request-to-exit device, low-voltage power supply, recorder/NVR and a generic custom-equipment fallback.
- Reusable noncamera model/arrangement definitions and their exact boundaries. Existing camera-template behavior is settled; an arrangement must not silently create duplicate component costs or claim verified compatibility.
- Existing door-contact records remain contacts; acceptance of cameras does not approve migration into door assemblies.

### Openings and site context

- Named physical doors/gates linked to individually identified readers/contacts/locks/REX/intercom/controllers, with useful side/direction labels and project-defined sequences.
- Named fence/perimeter lines and entrance markers as annotations, distinct from powered devices, required-coverage zones and explicit optical obstructions.
- No automatic fixed door BOM, cable, electrical demand, passing state or obstruction effect merely from an association/annotation unless separately specified.

### Closets, physical ports and connection traits

- Named network/security closet containers and equipment membership; rack-unit/patch-panel engineering remains proposed for deferral.
- Explicit switch port identities/types, known PoE/per-port/total limits, reservations/uplinks, supported media checks and conflict/unassigned warnings.
- Controller I/O/terminal association versus network interface/power traits; passive/externally powered/controller-connected objects must not automatically count as IP/PoE endpoints.
- Extending network assignments beyond the current direct same-floor Cat6 heuristic to supported inter-floor/copper/fiber links. Panoramic hardware-demand accounting alone does not approve this complete connection editor.

### Cable runs, risers and quantities

- Stable cable/run IDs with known endpoint/port/terminal labels, media/specification, work category and estimated/measured provenance.
- Drawn per-floor horizontal segments plus a named riser and explicitly entered vertical/drop length; visible extra allowance and one declared slack calculation.
- Single identity for an inter-floor run so it is not purchased once per floor; distinct supply for separate cables sharing a pathway.
- Preserving measured/manual overrides and incomplete/unknown length disclosures. Supply quantity remains distinct from installed geometry under already accepted OQ-5.
- Compatibility/entered maximum-length warnings only from known data; no automatic 3D routing, conduit-fill, voltage-drop or universal electrical/compliance calculation is accepted.

OQ-8 archive/restoration/endpoints and OQ-9 measurable acceptance remain separate open questions. Update source-status records to reflect the panoramic confirmation without resolving these remaining decisions.

## Narrow reconciliation against draft 0.9 — 2026-11-17

**Result: no actionable discrepancies found in the accepted panoramic integration.** Reviewed FR-10/12–15/19/47/48 and related history/export wording, the confirmed addendum, source index and latest context. No main edits, tests, broad review or finalization occurred.

- **Identities and accounting:** FR-48 requires stable child view IDs under one physical asset and associated configured streams, avoiding solver deduplication and duplicated body purchases. FR-19 separates actual interfaces/power from optical head count and uses streams actually transmitted/recorded; display-only dewarped panels do not multiply demand.
- **Best-view analysis:** FR-12/FR-14 combine eligible views by union and best single-view detail without summing density. View overlap is distinct from physical-camera overlap, with source-head/composite-output identity retained.
- **Unassessed results and zones:** FR-13/FR-15/FR-48 expose supported versus unassessed outputs, give illustrations no target credit and retain full denominators. Assessed views may independently satisfy a target, while missing panoramic analysis cannot imply actual blindness. Not assessed remains an analysis status, not a fifth commissioning outcome.
- **Support boundary:** Independent supported rectilinear heads receive quantitative analysis; fisheye/stitched inventory and known-context illustrative previews are included. Detailed calibrated panoramic DORI remains deferred, with no invented sector pixels, 360-degree pinhole input or extra captured detail from upscaling.
- **History and acceptance boundary:** Parent/view/stream profiles persist through evidence/revisions/exports/backups and existing targeted retests; implementation gaps remain explicit. PRD/addendum/index/context keep all four noncamera OQ-7 groups pending, alongside OQ-8/OQ-9. No approval gate or automatic field-test pass is introduced.

This disposition confirms guided draft consistency only; it does not approve the remaining OQ-7 equipment/cable proposal or claim implemented panoramic capability.
