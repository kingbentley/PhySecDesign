# Camera-model template decision and implementation extract

Recorded 2026-11-17 for guided PRD refinement. Planning sources: [PRD draft 0.7](../prd.md), the pending OQ-7 section of the [addendum](../addendum.md), [canonical memory](../.memlog.md), and the latest user steering supplied for this task. Implementation inspection covered catalog.js, EquipmentPanel.jsx, App.jsx placement, projectModel.js normalization, dori.js, coverage.js and CameraControls.jsx. No files in the application were changed and no tests were run.

## Confirmed scope and unaccepted remainder

The user explicitly wants **reusable templates for specific camera models**, searchable/selectable by model number, containing resolution, horizontal/vertical field-of-view information, focal length and other inputs needed for DORI analysis. Support both fixed and adjustable lenses.

This confirms/refines the **camera-template part only**. It supersedes any reading of the pending OQ-7 recommendation that specific rectilinear manufacturer/model entries are outside the POC. It does not accept the remaining proposed doors/gates/components, closets, physical ports, annotations, risers or cable expansions. OQ-7 remains partially unresolved; OQ-8/OQ-9 remain open. It also does not require an automatic complete vendor library, live datasheet sync/pricing, new fisheye/360-degree optics, PTZ movement simulation or hardware discovery.

The product should let the user select a reusable model definition and obtain useful optical defaults rather than repeatedly enter the same specifications for every placed camera. A model/template is separate from each installed instance's stable device ID, location, actual lens setting, evidence and lifecycle history. Existing fixed-revision/test-history safeguards continue to apply.

## Current implementation evidence

| Area | Observed behavior | Gap relative to confirmed intent |
| --- | --- | --- |
| Catalog | catalog.js contains two camera choices: Generic 4 MP dome and Generic 8 MP bullet, inside the nine-entry generic catalog. Each holds name/model, unit allowance and default optics/mounting. | No authorable reusable manufacturer/model-definition library, model-number field/variants, template version or per-model data source. |
| Existing search | EquipmentPanel.jsx searches name, model, ID, building/floor and type label case-insensitively in the fixed catalog or placed-device schedule. | Model text search is present; searchable reusable specific-model creation/selection is not. Do not describe search itself as absent. |
| Placement | App.jsx copies a selected catalog entry's defaults/model/catalogId into a newly identified device. Instances retain their own fields. | Useful starting pattern, but no persisted user-template collection or deliberate template update/variant selection flow. |
| Resolution | dori.js stores imageWidth as integer horizontal stream pixels, allowed 160–16,384; generic defaults 2,688 or 3,840. CameraControls exposes it while DORI or zone review is active. | No separately stored stream pixel height, resolution profile/name, megapixel-to-pixel definition, crop/binning mode or model resolution choices. A megapixel label alone is not the consumed DORI input. |
| Lens and horizontal FOV | coverage.js makes focal length in mm plus sensorWidth in mm canonical; HFOV is derived. CameraControls edits either lens or HFOV by updating the other. | No independent choice of published HFOV versus calculated optics as authoritative data; exact model limits/variants absent. |
| Vertical FOV | coverage.js derives VFOV from HFOV and aspectRatio. | No independently entered VFOV, active sensor height or vertical-FOV control/display field in CameraControls. |
| Sensor/aspect | Sensor width is a numeric active-width-style value in mm, default 6.4; aspectRatio defaults 16:9, with 4:3/custom controls. | No sensor-format label field, active width/height pair, mode-specific active area or provenance. The solver cannot consume a textual optical-format label as physical width. |
| Lens class | All cameras expose editable focal length/HFOV under generic lens/sensor/FOV bounds. The dome name says varifocal, but no lens-type/minimum/maximum/model-setting record exists. | Fixed versus adjustable lens behavior is not enforced; even a nominally fixed model can be arbitrarily zoomed in current controls. |
| Placement analysis | Bearing, height, downward tilt, range and target-plane height drive the installed scene; floor barriers/analysis boundary and common plane affect combined analysis. | These are instance/site context, not universal camera-model specifications. Applying a model must not silently rewrite actual position, aim or test context. |
| Model persistence | projectModel.js preserves a free-text model and catalogId plus a fixed known-field optical schema. Normalization rebuilds known fields. | Adding template metadata/IDs/versions/vertical resolution without schema work would drop them on normalization/export/import. |
| Current optics validation | For nonlegacy cameras, projectModel.js rejects HFOV differing by more than 0.1 degree from the focal-length/sensor-width calculation. Legacy cameras preserve old FOV by deriving lens. | A manufacturer's independently published FOV may not fit this exact idealized relationship; an explicit authority/consistency design is needed rather than silently changing entered published values. |

The current generic choices both use a 6.4 mm sensor-width assumption and 16:9 aspect ratio. Their specific resolution/lens/default-height values are preset assumptions, not validated manufacturer data. Current numeric bounds are prototype implementation limits, not newly accepted ranges for all real models.

## Inputs actually consumed by current geometry and DORI

The local implementation uses:

- Horizontal stream pixel width, focal length and sensor width; derived HFOV and VFOV/aspect ratio.
- Camera position, bearing, mounting height, downward tilt, analysis-distance limit and target-plane height.
- Relevant obstruction geometry/heights and the single-camera or combined analysis boundary/context. Combined analysis uses the floor's common target plane, not each camera's independently selected target plane.

In the current ideal rectilinear model:

- HFOV = 2 × atan(sensorWidth / (2 × focalLength)).
- VFOV = 2 × atan(tan(HFOV / 2) / aspectRatio).
- Estimated horizontal pixels per metre at a sample = horizontalPixels / (2 × tan(HFOV / 2) × opticalDepth).

Optical depth is calculated from the target's position relative to aim, tilt and the camera/target height difference; it is not simply an arbitrary map radius. DORI then classifies that estimate against the code's documented 25/63/125/250 px/m convention. This records the existing implementation, not a fresh standards validation or an accepted new threshold edition.

Resolution affects estimated image detail but does not necessarily change the geometric footprint. Lens/FOV/active sensor/aspect change geometry. Bitrate, recording percentage and retention drive separate capacity estimates; they are not terms in this DORI formula.

The solver remains sampled 2.5D visibility on a flat horizontal target plane, with rectilinear optics and finite-height barriers. It does not model fisheye dewarping, lens distortion, terrain, lighting, compression artifacts or guaranteed real image recognition. Specific model metadata does not by itself remove these limitations or make a field check Pass.

## Metadata and control points to define for implementation

The following are design implications/recommendations for fulfilling the confirmed camera-model requirement, not acceptance of all pending OQ-7 equipment/cable additions.

| Field/control group | Needed distinction |
| --- | --- |
| Search identity | A reusable template ID plus manufacturer/model number, display label and lens/mode variant so similarly named models are distinguishable. Current free-text instance model alone is insufficient for a stable reusable definition. |
| Resolution mode | Store explicit active stream width × height in pixels, with mode/aspect information. Retain megapixel/marketing labels only as descriptive metadata; calculate from selected stream inputs. |
| Fixed lens | Record the fixed focal length and supported FOV/profile. The selected model should not silently permit unsupported continuous zoom; model correction/explicit override policy needs a visible control. |
| Adjustable lens | Record supported focal-length range and a selected per-instance setting, with corresponding FOV/calculation inputs. Any supplied endpoint or profile data must be distinguished from interpolated estimates. Exact interpolation/calibration behavior remains implementation design. |
| Optical source | Identify whether calculations use manufacturer-entered H/V angular FOV or lens plus active sensor dimensions under an ideal model. Choose an authoritative consistent basis and flag mismatches; do not treat independently editable conflicting fields as simultaneously exact. |
| Sensor metadata | Keep optical-format label separate from actual active width/height in mm and the selected stream/crop mode. Do not feed a nominal fractional format into sensorWidth or invent physical dimensions from the label. |
| Provenance/unknowns | Record a source/reference and whether each value is entered, derived, estimated or unknown. Unknown inputs must not quietly become generic validated specifications. Source-validation workflow/library sourcing remains to be designed. |
| Template/instance history | Applying a definition creates distinct device instances with explicit selected optics. Template edits must not rewrite issued revisions, captured settings or past test evidence; apply changes deliberately with existing change/retest rules when relevant. |
| Reuse boundary | Specify where definitions are reusable (current project, a personal/workspace library, or portable transfer). Reusable is confirmed; the user has not selected a storage/sharing/import mechanism. Do not constrain reuse to an unstated scope or promise a vendor feed. |
| Coverage readout | If scene width/height is displayed, require a distance and measurement-plane definition and label it as calculated coverage. It is not the same field as HFOV/VFOV degrees. |

Mounting height, aim, tilt, target plane, chosen focal setting and field-observed configuration belong to the placed device/context. A template may supply suggested defaults, but they are not evidence of the actual installed position or tested settings. Power/bitrate defaults, when recorded, remain separate capacity inputs rather than optical-performance guarantees.

## FoV and sensor terminology risks

1. **Angular FOV versus scene dimensions.** Horizontal/vertical FOV angles are degrees. Scene width/height are metres/feet at a specified distance and plane; they vary with distance, tilt and target geometry. Clarify what the user's FoV height/width means in fields/readouts rather than store an unlabeled number. For a plane perpendicular to the optical axis at depth d, a simple rectilinear scene width is 2d × tan(HFOV/2); the tilted ground footprint uses the full existing geometry, not that width as an intrinsic model constant.
2. **Sensor format versus physical active dimensions.** The current solver requires numeric sensor width in mm; a label such as 1/2.8-inch is different metadata and is not an implemented physical-dimension conversion. Active area can also depend on the chosen mode. Keep datasheet/source dimensions distinct from display labels and unknowns.
3. **Published FOV versus ideal linked optics.** Current lens/sensor normalization rejects more than 0.1-degree inconsistency. Real-model templates must choose a supported authoritative calculation basis and clearly label derived/estimated values; otherwise selecting a valid published model could fail import or silently alter its entered FOV. Fixed and adjustable lens limits/profile handling must be explicit.
4. **Confirmed camera refinement versus broad scope/history changes.** Accept model-number reuse/search and fixed/adjustable optical inputs only. Keep other OQ-7 additions pending, preserve immutable instances/revisions/evidence, and do not claim automatic manufacturer accuracy, a complete vendor library or newly supported fisheye/PTZ behavior.

## Affected PRD and context clauses

- **FR-7:** extend the catalog requirement with reusable specific-camera definitions and model-number selection, while retaining the pending status of unrelated OQ-7 additions.
- **FR-10:** support selected fixed/adjustable optics and explicit H/V FOV/resolution interpretation; distinguish template specification from instance placement and chosen lens setting. Preserve current supported-model limits until intentionally extended.
- **FR-13/FR-14:** disclose selected mode/optical basis/unknowns and calculate DORI from actual selected stream dimensions/geometry; preserve planning-estimate and field-verification boundaries.
- **FR-19:** if model templates carry bitrate/PoE metadata, keep those capacity values separate from DORI inputs and do not infer actual observed performance from model choice.
- **FR-22/FR-27/FR-28/FR-31/FR-34/FR-44:** preserve template provenance/applied inputs through snapshots/export and meaningful changes; avoid retroactive updates or invented new test passes after template edits.
- **OQ-7/addendum/context:** record the camera-model requirement as confirmed/refined; remove or qualify the old sentence placing specialized camera models outside scope so ordinary specific rectilinear models are included, while unsupported optical simulation and automatic libraries remain uncommitted. Other catalog/closet/port/cable recommendations remain pending.

Potentially append a distinct camera-template FR after FR-46 if reusable definitions would otherwise overload FR-7. This extraction does not prescribe a new ID or an implementation architecture.

## Narrow reconciliation against draft 0.8 — 2026-11-17

**Result: no actionable discrepancies found in the confirmed camera-template refinement.** Reviewed FR-7/10/47, the confirmed camera addendum, optical reference digest, source index and latest conversation context. No main documents/application files were edited and no tests, broad review or finalization were performed.

- **Confirmed intent:** FR-47 supports creating/editing/duplicating reusable manufacturer/model/lens-variant definitions, model-number search and placement of distinct camera instances, with the generic option retained.
- **Units and optical authority:** FR-10/FR-47 distinguish H/V angular FoV in degrees from scene dimensions at a stated distance/plane, and active imaging millimeters from nominal sensor-format labels. The addendum preserves sourced versus derived values, flags inconsistencies and leaves normalization/calibration implementation explicit rather than forcing published angles into the old solver.
- **Fixed/adjustable optics and modes:** Fixed profiles do not offer arbitrary zoom; varifocal settings use supported limits and sufficient profile data. Unknown intermediate calibration requires explicit supported inputs/approximation. Selected stream/capture pixels and framing govern analysis, rather than advertised maximum resolution or an assumed unchanged crop.
- **Instances and history:** Instance placement, operating mode/focal setting and site context remain separate from reusable defaults. Template identity/version or captured values survive revisions/evidence/backups; later edits cannot silently alter placed, issued or tested cameras. Explicit changes follow existing history/retest rules.
- **Boundaries:** Current DORI conventions, site geometry and field-verification limits are retained. The addendum explicitly lists prototype gaps and says this documentation update does not implement them. PRD/index/context leave the rest of OQ-7 catalog/closet/port/cable scope pending, along with OQ-8/OQ-9.

This disposition checks the accepted camera-model requirement only; it does not accept the broader OQ-7 proposal or claim application capability.
