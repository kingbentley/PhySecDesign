# Baseline reconciliation — PRD draft 0.1

Reviewed 2026-11-16. Inputs: [prd.md](prd.md), [addendum.md](addendum.md), [baseline extract](sources/draft-baseline-extract.md), and the original [project-document](sources/project-docs.md), [design/coverage](sources/design-and-coverage.md), [delivery/review](sources/delivery-and-reviews.md), and [reference](sources/reference-context.md) digests. This is a reconciliation of a first full draft, not final approval or an application acceptance run. No main document, application, private review data, test or external source was changed/used during this pass.

## Overall result

The draft covers every major baseline area and accurately separates new shared/field/lifecycle requirements from existing local behavior. It preserves the key distinction between full revisions, reduced review snapshots, issued designs and closeouts; sampled coverage versus field evidence; optional approval versus actual completion; and prototype limits versus untested production targets. The original requested doors/gates, fence/entrance markers, closets/ports and vertical routing remain visible in OQ-7 rather than being presented as implemented or discarded. No fresh-test, production-readiness, vendor or compliance overclaim was found.

Five focused edits would prevent qualitative baseline regressions or unmarked scope expansion. These need not add new FR IDs.

## Actionable gaps

### B-1 — Retain drawing-only transforms and local PDF processing explicitly

**Draft:** FR-3 preserves coordinates during map changes, but FR-4/FR-5 checks (prd.md:91–101) do not say that moving, replacing or aligning a drawing leaves geographic devices and barriers in place. FR-6 says Upload a PDF; neither it nor addendum.md:23 preserves local parsing/rendering and local password handling.

**Baseline:** Devices/barriers are geographically independent of drawing geometry. Import/replacement and two-point alignment change only the drawing. PDF contents/password are handled locally; only the selected raster and source-page identity enter portable state. Sources: design/coverage digest, Maps/lookup/drawings/alignment; project-document digest, Product intent, citing site-studio/AGENTS.md:13–22 and src/App.jsx:434, :456, :598, :629.

**Edit:** Add an invariant/check to FR-4/FR-5 that drawing movement/replacement/alignment cannot move equipment or barriers. Preserve local PDF page/password processing in FR-6 or the addendum, distinguishing it from subsequent shared storage of the chosen raster. This is retained behavior, not a demand that the shared project remain browser-only.

### B-2 — Preserve camera aiming and linked optical controls

**Draft:** FR-10 lists lens/FOV, resolution, height, tilt and range but omits bearing, sensor width and aspect ratio, and does not explicitly preserve lens/FOV linkage. The addendum describes rectilinear optics without retaining those controls.

**Baseline:** Bearing is directly adjustable; focal length and HFOV remain linked through sensor width; VFOV follows aspect ratio. These change the planning footprint and cannot be safely reduced to an unspecified lens/FOV field. Source: design/coverage digest, Single-camera and combined coverage, citing src/CameraControls.jsx:80, :102, :104, :127 and src/coverage.js:20.

**Edit:** Include bearing and the linked lens/FOV/sensor/aspect inputs in FR-10, and make its check verify that linked values remain consistent while aim/optics changes update the footprint. Keep numeric bounds in the addendum/acceptance work rather than freezing them as product requirements.

### B-3 — Keep optional zone targets and DORI views

**Draft:** The Security zone definition and FR-15 (prd.md:139) describe a required DORI level, with no no-requirement state. FR-14 does not retain the optional DORI overlay, and FR-15 does not explicitly require zone results to remain visible while selecting/adjusting a camera.

**Baseline:** A named typed zone can have no requirement or a target level/percentage. DORI is an optional individual/combined view. Required-zone feedback deliberately remains visible while a camera is selected and adjusted. Sources: project-document digest, Product intent; design/coverage digest, DORI/security zones, citing site-studio/AGENTS.md:36–38, src/securityZones.js:3, :15 and src/App.jsx:782.

**Edit:** Define security zones as polygons with optional requirements; preserve zone type. State that DORI can be enabled/disabled without changing saved optics/results, and that applicable zone feedback remains visible while aiming cameras. This prevents existing annotation-only zones from becoming mandatory acceptance targets.

### B-4 — Preserve the recording-percentage versus bandwidth distinction

**Draft:** FR-19 describes storage and bandwidth together as based on bitrate and recording percentage/schedule assumptions. Addendum.md:39 explains storage but leaves the simultaneous bandwidth calculation unspecified. A future implementation could apply recorded percentage to both and still read as compliant.

**Baseline:** Storage uses recording percentage; simultaneous bandwidth sums the full configured stream bitrates regardless of recorded-time percentage. Source: delivery/review digest, Capacity planning, citing src/capacity.js:54, :134 and src/CapacityPanel.jsx:110.

**Edit:** Add one sentence/check to FR-19 or the analysis conventions: changing recording percentage changes the recorded storage estimate, while simultaneous stream bandwidth remains based on full configured streams. No new sizing model or engineering guarantee is needed.

### B-5 — Mark schedule CSV as new scope or narrow the wording

**Draft:** FR-34 says schedule/estimate CSVs. The existing baseline only provides the materials/estimate CSV; equipment and cable schedules are provided on screen and in PDF. The new standalone schedule CSV is not identified as a proposed addition or an OQ-6 manifest decision.

**Baseline:** Delivery/review digest, Materials/accessories/labor/CSV and Printable PDF delivery, citing src/materials.js:87, :95, src/App.jsx:507 and src/designReport.js:140, :169.

**Edit:** Use materials/estimate CSV for retained scope, or explicitly label separate equipment/cable schedule CSV export as a proposed OQ-6 decision. The broader complete-package outcome does not itself establish every additional export format as confirmed.

## No change needed for these major risks

- FR-17/18/19 retain estimates, manual accessories, optional labor, capacity and unassigned demand rather than allowing commissioning work to eclipse them.
- FR-12/13/14 preserve union/overlap, full-area denominators, hidden-layer independence, common-plane differences, best-single-camera DORI and sampling limitations.
- FR-20 and FR-35/36 deliberately supersede destructive device deletion with retained history and replacement identity; route/floor edge cases remain OQ-8.
- FR-21/22/34 preserve undo, full portable revisions and legacy migration; OQ-2 correctly carries shared undo/concurrency decisions.
- FR-33/34 and the addendum distinguish printable output from complete editable backup and identify reduced current PDF/review contents.
- Numerical source caps, the possible revision icon defect, historical QA and missing PSP material are stated as evidence boundaries rather than new guarantees.

All remaining detailed baseline affordances stay discoverable in the linked extraction and original digests. These five edits address the materially ambiguous or changed contracts; they do not require transcribing every existing control and numeric limit into the PRD.

## Disposition — 2026-11-16

Rechecked only B-1 through B-5 against the revised PRD and addendum. **All five are addressed; no remaining gap within this recheck scope.**

| Finding | Disposition and evidence |
| --- | --- |
| B-1 | Addressed. FR-4's check preserves equipment/barriers during drawing movement, replacement and alignment. FR-6 and the addendum explicitly keep original PDF/password processing local while permitting the selected raster/source identity in shared state. |
| B-2 | Addressed. FR-10 retains bearing, sensor width, aspect ratio and linked focal-length/FOV inputs. Its check distinguishes geometric footprint changes from resolution-only detail changes. |
| B-3 | Addressed. The zone definition and FR-15 retain typed polygons with no target or an optional target, with feedback visible during camera adjustment. FR-14 makes DORI optional without mutating saved optics/calculations. |
| B-4 | Addressed. FR-19 and the addendum explicitly distinguish recorded storage from simultaneous full-stream bandwidth; FR-19 checks that recording percentage does not reduce bandwidth. |
| B-5 | Addressed. FR-34 now names materials/estimate CSV. The addendum states that separate equipment/cable schedule CSVs are neither established capability nor a committed addition. |

This disposition closes these document-reconciliation findings only. It is not final PRD approval or evidence of application implementation/testing. No main document or application was edited in this recheck.
