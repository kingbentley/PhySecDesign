# Panoramic and multiple-lens camera scope extract

Recorded 2026-11-17 for guided PRD discussion. Sources: [PRD draft 0.8](../prd.md), [addendum](../addendum.md), [camera-template extract](camera-model-template-extract.md), and read-only inspection of coverage.js, dori.js, capacity.js and materials.js.

**Status: proposal input only.** The user asked how multiple-lens and 360-degree fisheye cameras should be handled. This is not acceptance of a new projection model or expansion of FR-47. The already accepted requirement is reusable specific-model templates with supported fixed/varifocal optics. The addendum currently says specialized projection analysis, including fisheye or stitched multisensor views, was not included by that clarification. Any bounded exception described below must be offered as a proposal and explicitly accepted before being promoted to requirements. Other OQ-7 catalog/closet/port/cable proposals and OQ-8/OQ-9 remain open.

## Current baseline relevant to the question

| Area | Current implementation/accepted requirement | Consequence |
| --- | --- | --- |
| Camera device record | One device ID carries one position/height/aim, one focal/FOV/aspect configuration and one imageWidth. FR-47 adds reusable model/mode data as future work, not a parent/view schema. | No physical parent with separately identified views is implemented or yet accepted. |
| Supported geometry | coverage.js uses one rectilinear frustum, HFOV at most 160 degrees, a derived VFOV and a flat target plane with height-aware obstructions. Generic focal/sensor assumptions are canonical. | A raw 360-degree image cannot be passed through this model as an ordinary camera with FOV=360. Merely adding a model number or splitting an image into arbitrary cones does not validate its geometry/detail. |
| Per-view image detail | dori.js consumes horizontal stream pixel width. coverage.js estimates horizontal pixels/metre using that view's HFOV and optical depth. | Input must describe the evaluated sensor/optical/output view, not blindly reuse total body megapixels or a stitched panorama's full width for every lens/view. |
| Combined coverage | computeCombinedCoverage takes camera-like records, rejects more than 500, skips repeated IDs and ineligible settings, and uses one common target plane. | Reusing one parent ID for multiple views would skip duplicates. View identities and analysis workload limits need explicit design. |
| Combined DORI | Each sample uses the maximum eligible unobstructed view band, not a sum of image density. | Preserve best-view semantics if adding views. Overlapping lenses do not manufacture higher detail by adding pixel counts. |
| Overlap metric | The solver counts unobstructed model entries as one or at least two cameras. | Several views from one physical body may create geometric overlap, but that must not be described as independent physical-device redundancy. |
| Unsupported/empty analysis | With no active supported models, the current solver marks the analysis boundary 100% uncovered and places it in the Unseen DORI band; excluded/invalid models have warnings. | An unsupported fisheye contribution cannot be fed into this fallback and presented as proof the physical site is blind. Unsupported analysis needs visible unassessed/partial semantics. |
| Costs | materials.js counts each proposed device record as equipment supply. | Making each view a separate purchasable camera duplicates body cost unless the data model separates physical assets from analysis views. |
| Network/power | capacity.js counts every networked camera device as an endpoint with a port/PoE allocation. | View count is not a physical-port or power-demand count. Use actual parent interfaces/power traits rather than assuming one port per rendered view. |
| Streaming | capacity.js currently gives each camera device one bitrate, recording percentage and storage row; bandwidth sums full configured bitrates. | Multi-stream behavior needs explicit stream records or an equivalent association. Display crops/dewarped views need not be separate transported or recorded streams. |

These are static source observations, not test results. The existing numeric limits and implementation shape do not automatically define the desired panoramic feature scope.

## Bounded model to propose

### Physical camera, optical views and streams are different records

Propose one physical camera asset for the purchased/installed body, with its own stable device ID, model/template, location/mount, serial/legacy identity, costs, actual network/power connections, work scope and lifecycle history. Do not manufacture independent physical cameras merely to get multiple analysis cones.

Attach separately identified **views** for supported lenses/sensors or supported virtual views. A view has a stable view ID beneath the parent, a source sensor/profile, mode/resolution, optical basis, direction/tilt and any supported lens setting. Placement/location inheritance and per-head orientation should be explicit. A static analytic view is not automatically an independent stream, physical interface or purchasable asset.

Keep configured **streams** distinct: record which stream(s) are actually transported and/or recorded and their bitrate/recording assumptions. Several display/dewarped views derived from one transmitted source should not multiply source bandwidth/storage. If multiple distinct streams are transmitted/recorded, count their configured demand. Do not assume that every multi-lens model has exactly one physical port; parent interface/power traits remain model/site input.

### Multiple rectilinear lenses

A practical proposed first step is multiple supported rectilinear view profiles under one body. Each lens/view uses its own supported resolution, FoV, focal setting and orientation, while reusing the established plane/obstruction calculations. A four-sensor body can display four analytic views without four body purchases or four assumed ports.

Calculate the union of view coverage and best eligible unobstructed view detail at each location. Preserve per-view results and identify which view supplies a result. Do not sum pixels across overlapping sensors or assign the whole multi-sensor image's pixel width independently to each lens.

For stitched output, a published total resolution alone does not establish each sector's usable rectilinear input. Use separately sourced supported optical profiles or leave unsupported stitched-detail analysis unassessed. Supporting raw stitching/dewarping geometry would be a further explicit modeling decision.

### Fisheye/360-degree cameras

Propose that the physical asset can be inventoried and scheduled even when its projection is unsupported. A schematic circular coverage indication, if offered, must be visually labeled illustrative/unassessed rather than be counted as quantitative DORI or accepted coverage.

For quantitative analysis, require a supported projection/calibrated mapping or a sufficiently specified supported rectilinear dewarped view with its actual effective source/mode/pixel geometry. A raw fisheye frame cannot be treated as a normal pinhole rectangle with 360-degree HFOV or copied into several arbitrarily high-resolution cones. Selecting a model or supplying a nominal DORI distance does not supply missing projection data.

A bounded POC option is to analyze only such supported defined views and keep the raw fisheye/stitched image's remaining contribution visibly **not assessed**. Preserve known information and prompt for the missing model inputs; do not invent field performance. This is a proposed exception to the current specialized-projection deferral, not an already accepted feature or a commitment to build a universal dewarping engine.

## Analysis and reporting safeguards to propose

- Preserve the current 25/63/125/250 px/m convention, best-view combination rule, target-plane/obstruction context and estimate-versus-field-result separation unless the user explicitly changes them.
- Use distinct parent and view identities so the combined solver does not deduplicate siblings or confuse them with separate installed bodies. View limits/workload need to be discussed under OQ-9; 500 current model entries is not a tested 500-body panoramic promise.
- Distinguish **view overlap** from physical-camera count. Two views on one device can overlap geometrically, but their common body/power/network failure is not independent redundancy.
- Keep an unsupported projection or unknown view visibly excluded/unassessed. Supported-view results may still be shown with their exact population and boundary, but cannot be described as a complete assessment of all installed cameras. Unseen by supported modeled views is not a verified claim that an unmodeled fisheye cannot see the area.
- Do not add Not assessed as a new field-test outcome. It is calculation/support metadata, separate from Pass/Fail/Not tested/Not applicable and from Needs review/Retest required follow-ups.
- Cost and equipment schedules count physical assets; view breakdowns explain analysis. Capacity counts actual physical interfaces/power and configured transported/recorded streams. Retained/current/proposed work-scope and replacement exclusions still apply.
- Evidence can relate to a specific view/stream as well as its parent. Changing one head's aim flags relevant view checks; moving/replacing the whole body may affect several views. Preserve old tested context, unresolved issues and fixed revisions; no blanket automatic Pass/Fail.
- Export packages and portable history need stable parent/view/stream relationships and the same unsupported-analysis disclosures. Do not render a 360-degree schematic as certified quantitative coverage in a closeout report.

## Clauses needing an explicit proposed exception/update if accepted

| Clause | Proposed addition; not an accepted edit now |
| --- | --- |
| **Addendum OQ-7 deferral** | Explicitly distinguish deferred general fisheye/stitched projection engines from any accepted bounded parent/multiple-supported-view capability. Do not remove the existing deferral merely because the user asked a question. |
| **FR-47 / FR-7** | Reusable multi-lens/projection-aware model definitions; one physical asset with stable subordinate view and stream identities; supported versus unassessed profiles. |
| **FR-10** | Per-view orientation and supported optical input/calibration, with unsupported projection/setting treatment. Existing rectilinear limits remain honest until deliberately extended. |
| **FR-12–FR-14** | Union/best-view analysis, parent-aware overlap labels, explicit included/excluded views and partial/unassessed results that do not falsely claim blind areas or sum density. |
| **FR-17 / FR-19** | Parent supply cost and actual port/power demand versus configured stream bandwidth/storage; prevent duplicated demand for derived display views. |
| **FR-22 / FR-28 / FR-31 / FR-44** | Retained parent/view/stream versions, changed-context impact and evidence links. Parent move/replacement and single-view changes have appropriately scoped effects. |
| **FR-33 / FR-34** | Packages/backups preserve relationships, physical quantity versus analytic-view details and explicit unsupported/partial assessment labels. |
| **OQ-9** | Representative body/view/stream counts, render/analysis budgets and supported projection/profile acceptance fixtures. No automatic scale commitment. |

## Four main risks

1. **False geometry/detail:** applying pinhole formulas, full panorama pixels or invented cones to raw fisheye/stitched data creates unsupported DORI precision. Accept only a bounded supported optical basis or show not assessed.
2. **Double counting and identity loss:** separate camera-device clones duplicate body cost/ports/PoE, while reusing one ID makes the existing solver drop siblings. Separate physical parent, view and stream identities and their accounting.
3. **Unsupported mistaken for blind or redundant:** current no-eligible fallback says 100% uncovered. Preserve explicit assessment population; unsupported fisheye is not proof of actual blindness, and same-body view overlap is not independent device redundancy.
4. **Question mistaken for acceptance:** keep this document and any proposed exception visibly pending. The earlier accepted model-template clarification does not authorize universal fisheye/stitched simulation, automatic vendor accuracy or the remaining OQ-7 equipment/cable additions.

The next user-facing recommendation can present the bounded physical-parent/multiple-supported-view approach, the separate fisheye support/data limit and the accounting distinction, then seek the user's decision within guided discovery. No requirements are promoted by this extraction.
