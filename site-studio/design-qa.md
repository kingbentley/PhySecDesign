# Design QA

Final result: passed for the local OpenStreetMap prototype.

Reference: ../design-mockups/04-map-overlay-studio.png
Desktop viewport: 1440 × 1024
Initial capture: qa/initial-desktop.jpg
Final desktop capture: qa/final-desktop.jpg
Compact capture: qa/preview.jpg
Narrow desktop: qa/narrow-desktop.jpg

The source image and final desktop screenshot were reviewed together in the same comparison input. The implementation preserves the white/teal editor, three-column workspace, persistent geographic map, selected plan overlay, security layers, floating tools, and alignment inspector.

Initial findings and corrections:
- P2: Small desktop labels. Increased navigation, sidebar, toolbar, and inspector typography.
- P2: North arrow pointed left. Corrected icon rotation.
- P2: Plan was difficult to read over labeled tiles. Default opacity increased to 94%; the slider retains full control.
- P2: Placement toolbar briefly blocked by the lock toast. Moved notifications to the top.
- P2: The narrow Codex pane clipped side panels. Added compact Project & layers / Properties toggles and direct Import plan access below 850px. Verified both panels open and page width equals viewport width (732px).

Recheck: corrected typography, north arrow, opacity, and toast placement were visually inspected. At 1024 × 768, page width equals viewport width. At the normal compact preview width, the full map, tools, attribution, and panel toggles are visible. No outstanding blocking visual defects.

Intentional differences from the generated reference:
- Live OpenStreetMap cartography and a fictional sample drawing replace the invented street map. The sample drawing is not a surveyed plan of the real location.
- Session draft and export wording replace a misleading Saved status; the prototype has no server persistence.
- Only the implemented floor is listed. Coordinates search is explicit; no address geocoder is implied.
- One proportional resize handle and center move handle are implemented; rotation and dimensions are editable in the inspector.
- Native Phosphor icon components are used consistently.

Browser verification:
- OpenStreetMap tiles and attribution load.
- Imported PNG displayed as a geographic overlay; existing devices were retained.
- Plan drag, width, rotation, opacity, and lock controls work.
- Camera placement, editing, dragging, bearing/FOV, and layer visibility work.
- Two-point measurement produced a distance.
- Export contained the embedded plan image, alignment, and 12 devices.
- Reopening that export restored the added C-07 camera and plan alignment.
- Google setup dialog and return to OpenStreetMap work.
- Compact panel toggles work with no horizontal page overflow.
- No browser warning/error messages observed during the verified default flow.

Build and checks:
- Production Vite build and Sites packaging pass.
- Four bundled hosting tests pass.
- Build reports a nonblocking JavaScript bundle size warning; code splitting remains production work.

Limits:
- Google Maps runtime requires a configured browser key and was not verified with live credentials.
- Coverage fans and measurement are conceptual aids, not certified DORI/PPF or obstruction analysis.
- The initial image-only limitation is superseded by the PDF import update below. Native CAD requires export to PDF or an image.
- No database, multi-user workflow, undo history, or automatic persistence.
- PSP requirements are not yet fully traced to licensed reference material.


## Address search and aerial view update — 2026-11-16

Final result: passed.

The user's new direction adds address lookup and building imagery to the existing map-overlaid plan design. The earlier coordinates-only behavior and street-only no-key basemap are superseded.

Implemented:
- Photon address/place search with a selectable results list and local coordinate parsing.
- Explicit-submit lookup, bounded cache, cancellation, timeout, no-results and validation messages.
- Street / Satellite controls. No-key Satellite uses USGS/USDA U.S. aerial imagery; Google still requires the user's configured key.
- Close zoom uses dynamic NAIP Plus imagery; wider zoom uses cached USGS imagery.
- Bring plan here / Bring plan to map center, 50% overlay, and hide/show comparison shortcuts.
- Movement respects alignment locking; device coordinates remain unchanged when relocating a plan.

Browser evidence:
- A real address query for 233 S Wacker Dr, Chicago, IL returned Willis Tower.
- Selecting it navigated the map; Bring plan here placed the drawing at latitude 41.87874, longitude -87.63596 and 50% opacity.
- Bring plan here was disabled while alignment was locked and enabled after unlocking.
- Invalid coordinates 91, 0 produced a validation message locally.
- Loaded a USGSNAIPPlus image in the browser (885 × 911, opacity 1) and inspected recognizable buildings.
- Compared plan image bounds and parent position/size/rotation/opacity before and after Street/Satellite switching; identical.
- Reviewed the full desktop layout and normal 732px preview; no horizontal page overflow.
- Final screenshots: qa/address-satellite-desktop.jpg and qa/address-satellite-compact.jpg.
- One development hot-reload warning occurred while the map effect dependency list changed; a fresh page loaded the new engine correctly.

Verification:
- 8 geocoder tests and 4 hosting tests pass (12 total).
- High-resolution imagery lifecycle checks cover stale responses, failed refresh, successful recovery, and disposal.
- Production build passes; existing nonblocking bundle-size warning remains.
- React review covered request cancellation, event-driven fetches, bounded caching, stable effect dependencies, cleanup, explicit button labels, and avoiding map reconstruction when changing view style.

Visual corrections during verification:
- Kept aerial-source text in the existing canvas note so it does not overlap the distance scale.
- Hid the plan-drag hint when the plan is hidden.
- Compact panels preserve the map-first workflow.

Limitations:
- The no-key imagery option is intended for U.S. sites; image date and resolution vary.
- The fictional sample drawing has not been surveyed or aligned to the real property shown.
- Photon public demo service has no availability guarantee; configure a hosted/self-managed endpoint for production.
- Google Maps remains unverified with live credentials.


## Two-point alignment update — 2026-11-16

Final result: passed.

Added guided source → building → preview alignment to the plan inspector. The source drawing appears fully opaque while selecting source points, hides for target selection, and previews the calculated position/rotation/uniform scale without changing the saved plan until Apply. Existing device coordinates remain unchanged.

Verification:
- 23 automated tests pass: 11 alignment/geometry tests, 8 geocoding tests, and 4 hosting tests.
- Production build passes. Existing nonblocking bundle-size warning remains.
- Map picking/marker helper checks passed for rotated source inversion, outside-image rejection, longitude wrapping, preview click suppression, and marker coincidence.
- Live browser selection produced rotation -4.346874962699189°, width 110.3m (displayed), scale 0.788× from a 140m plan.
- At the 1440×1024 desktop preview, source and target marker centers matched exactly in CSS pixels: pair 1 at (529,501), pair 2 at (861,629).
- Apply committed the result and exposed Undo last alignment.
- Undo restored width140m, rotation0°, and the original geographic center.
- Focusing and leaving the rounded Width field retained the exact image transform; no precision was lost without an edit.
- Outside-image source clicks and duplicate building points generated useful errors and did not advance the workflow.
- Back returned to the source step with its two picks retained.
- Escape cancelled the workflow and preserved the original plan.
- Compact View plan points displayed the source image and both numbered anchors.
- Normal viewport override was restored and the preview tab left open.

Visual inspection:
- Desktop guide uses the existing right inspector; compact guide sits below the useful map area.
- Device markers, coverage, and editing handles are hidden during alignment to avoid intercepting picks.
- The original sidebar and global editing actions are inert during the workflow.
- A matching miniature remains available while choosing target points.
- The scale bar was moved above the compact guide to avoid control overlap.
- Final screenshots: qa/two-point-alignment-preview.jpg and qa/two-point-alignment-compact.jpg.

Implementation:
- Rendering, source picking, and solving share one local-metre Web Mercator geometry model.
- Leaflet plan images use unrounded projected positions so both anchors can match consistently across zoom levels.
- The solver handles horizontal/vertical baselines, clockwise rotation, translation, aspect ratio, high latitudes, and short date-line crossings.
- Invalid coordinates, poorly separated anchors, and unreasonable resulting dimensions are rejected.
- Google engine integration was implemented, but live Google credential testing remains unavailable.

Scope: this is a uniform two-point similarity alignment. It does not rectify perspective/skew or validate an inaccurate source drawing. The sample plan remains fictional.


## PDF site plan import update — 2026-11-16

Final result: passed for local PDF import and the existing OpenStreetMap/USGS alignment flow.

Implemented:
- PDF import up to 50 MB, processed locally with bundled PDF.js worker, fonts, CMaps, image decoders and color profile.
- Six-page thumbnail batches, large preview, page labels, previous/next controls and direct page-number selection.
- Local password prompt, invalid-file feedback, bounded raster rendering, and cancellation/worker cleanup.
- One selected page replaces the current overlay at the map center, preserves aspect ratio, and opens Satellite plus Alignment controls.
- Export embeds the selected page image and source filename/page metadata; it excludes the original document and password.
- Three-page fictional sample drawing set provided in the import dialog.

Browser verification:
- A real local-file chooser upload opened the three-page PDF and its native page labels.
- Page 2 imported at 3200 × 2262 pixels, with PDF · Page 2 of 3 shown in the plan sidebar.
- Completed source-point selection, satellite reference-point selection, preview and Apply alignment using the imported page; the result displayed -6.1° rotation, 114.3 m width and Undo last alignment.
- Canceling a page picker preserved the existing plan. The sample importer also cancels pending fetches on close, Escape, replacement or unmount; its close-and-reopen flow was verified after the cancellation fix.
- A nine-page packet paginated to sheets 7–9; selecting/importing page 8 returned the correct label A-101-3 and full-resolution dimensions.
- An AES-256 protected PDF rejected an incorrect password, accepted the correct password, and rendered its three pages.
- An invalid PDF showed a useful error with Choose another file recovery.
- Portrait page 3 retained 990 × 1400 preview dimensions and 11.7 × 16.5 inch sheet metadata.
- Inspected desktop and compact 732 px picker layouts; controls and previews remained visible.
- No warning/error console messages were observed in the isolated production-component QA flow.
- Screenshots: qa/pdf-page-picker.jpg, qa/pdf-aligned-overlay.jpg, qa/pdf-portrait-compact.jpg.

Verification:
- All 32 automated tests pass: 11 alignment, 8 geocoding, 9 PDF import and 4 hosting.
- Production build and required Sites packaging pass, with local PDF resources present in dist/client. The existing nonblocking bundle-size warning remains.

Limits:
- PDF pages become raster overlays, up to 3200 pixels on the longest side; this is not PDF/CAD editing or cropping. Import one page at a time.
- The original PDF is not retained in exported projects; select another page by importing the drawing again.
- The fictional fixture does not match the real building footprint. Two points align position, rotation and uniform scale; they do not validate an architectural drawing or compensate for perspective.
- During map verification the detailed USGS imagery request failed once, and the app correctly retained the available overview imagery with an explanatory notice.


## Connected property-planning POC — 2026-11-16

Final result: **passed for the scoped local proof of concept.**

Sequence implemented:
1. Buildings/floors, independent plans/devices/routes, browser-local IndexedDB saving and portable v2 project format with v1 migration.
2. Nine generic catalog entries across eight device types, editable properties and a property-wide equipment schedule.
3. Same-floor cable routes with direct links, bend points, editable paths, estimated lengths and slack.
4. Cross-floor materials aggregation, editable illustrative USD allowances and CSV export.

Browser evidence:
- Added Level 2 to Building A and added a separate Gatehouse (three total floors).
- New floors were blank and had no inherited equipment. The original ground floor retained its drawing and 11 devices.
- Imported sample PDF page 2 to Level 2, placed a camera as C-07 and a PoE switch as SW-01. Switching floors hid the other floor's cameras and restored the appropriate image.
- Saved a two-waypoint Cat6 route, 57.5 m horizontal path / 63.3 m displayed with 10% slack (materials showed 63.25 m at its precision).
- Materials showed 13 proposed devices and $4,558.76. Editing the camera allowance to $500 changed seven camera line items by a combined $350 and total to $4,908.76.
- Triggered the CSV export control. CSV content/escaping/quantities are independently covered by pure tests.
- Explicit reload restored the three-floor project, selected PDF, route and cost override.
- Edited the route, searched local coordinates, added a third waypoint, then canceled. The prior two-waypoint route and estimate remained.
- Saved-route endpoint placeholders are disabled; the inspector displays the route name rather than an internal identifier.
- Applied two-point alignment on Level 2: -6.1° rotation, 114.3 m width, uniform scale 0.816×. Equipment and routes remained geographic.
- Checked the materials dialog at 732 px and 1440 px widths. Corrected a CSS specificity issue that allowed the wide dialog to clip at compact width. Post-fix compact dialog bounds were x14.64–717.36 within 732 px, and desktop width was 1100 px within 1440 px.
- Compact project panel exposed all floors; document width equaled viewport width. No warning/error console logs observed during the final browser checks.
- Reset temporary viewport overrides and retained the local preview tab.
- Valid captured proof: qa/poc-materials-compact.jpg. A desktop capture had browser compositor artifacts and was discarded.

Correctness fixes during integration:
- Shared import generation ownership and aborts prevent late image/PDF/sample/project imports from mutating a newer floor/session or reopening dismissed UI.
- Coordinate search preserves route mode; explicit selection cancels a route draft consistently.
- Blank-floor guidance disappears during equipment placement or once devices exist.
- Schema, UI and estimate limits agree for costs and slack.
- Device removal removes its connected routes; external imports validate same-floor references and globally unique device IDs.

Validation:
- 66 automated tests passed: 11 alignment, 8 geocoding, 9 PDF import, 19 model/storage, 6 cable, 9 materials, 4 hosting.
- Production build passed after all fixes, including the compact dialog CSS.
- Local PDF worker/resources and required client/server/hosting packaging remain intact.
- Existing nonblocking Vite bundle-size advisory remains.
- Portable round-trip tests embed the actual sample image bytes and retain multiple floors, active-floor selection, PDF page metadata, cable waypoints/endpoints/slack and costs. Credential fields are excluded.
- Persistence tests cover initial restoration before writing, serialized snapshots, write failure and recovery.

Limitations remain those recorded in POC-ROADMAP.md. This verification covers the core demonstration workflow; it is not exhaustive production browser or scale testing.


## Camera coverage and obstructions — 2026-11-16

Final result: **passed for the local proof of concept.**

Implemented:
- Selected-camera target-plane coverage using linked lens focal length / horizontal field of view, sensor width, aspect ratio, mounting height, tilt, bearing and analysis distance.
- Floor-specific wall polylines and solid obstruction polygons with editable heights, enabled state and draggable vertices.
- Finite-height line-of-sight blocking: green visible coverage, muted red blocked coverage and an amber conservative centerline near-blind approximation. The legend and inspector identify this approximation.
- Bounded sampling with the actual sample resolution shown, invalid-geometry feedback, browser-local saving and portable project round trips. Existing v2 projects without barriers or sensor data migrate compatibly.

Browser evidence:
- A 3 m wall blocked 61% of the initial selected view; lowering it to 1 m reduced blocking to 12%. Disabling it reduced blocking to 0%.
- Raising the camera from 3.2 m to 6 m reduced low-wall blocking to 5%, verifying finite-height occlusion behavior.
- Changing the lens to 8 mm produced a 43.6 degree horizontal field of view. Setting a 90 degree field of view calculated a 3.2 mm lens with the default 6.4 mm sensor.
- With the camera restored to 3.2 m height / 90 degree HFOV, a 1 m wall blocked 11%; adding a 2 m solid obstruction increased blocking to 21%. Extending a wall vertex by dragging increased it to 24%.
- Ground floor retained zero barriers; Level 2 retained its two barriers. Reload restored optics, both barriers and the coverage result. Equipment schedule Locate returned to the correct camera and floor.
- At 1440 x 1024, the camera geometry controls, barrier list and map analysis were visible together. At 732 x 900, the document dimensions exactly matched the viewport with no page overflow; properties remained usable.
- Fixed an absolute-label containing-block issue that had allowed document vertical overflow. The final production CSS includes the fix.
- Final browser warning/error log query returned no entries. Temporary viewport override was reset, and the preview tab was retained.
- Screenshots: qa/camera-coverage-desktop.jpg, qa/camera-coverage-compact.jpg and qa/coverage-wall-edit.jpg.

Validation:
- All 89 automated tests pass, including 14 coverage geometry tests and 28 model/storage tests.
- Independent geometry review covered frustum equations, downward-facing footprint area, low-wall shadow termination, cameras above/inside obstacles, raised target planes and area statistics. Duplicate consecutive polygon vertices were fixed and regression-tested.
- Solid obstruction validation rejects crossing/touching nonadjacent edges; concave simple polygons remain supported. Unfinished drawing drafts cannot crash coverage.
- Production build passed after the final layout change. Sites packaging and bundled PDF.js resources remain intact; the existing nonblocking Vite bundle-size advisory remains.

Scope and limits:
- Analysis currently displays one selected camera at a time on a horizontal target plane with opaque, finite-height barriers. It is a sampled geometric estimate, not terrain or full 3D scene simulation.
- The amber near-blind area is a conservative centerline approximation rather than an exact complete below-frustum footprint.
- No lighting, image-quality, lens-distortion, DORI or detection guarantee is implied.
- Leaflet/USGS was verified live; Google integration was code-reviewed without live credentials. Satellite detail depends on the imagery service.


## Combined camera coverage — 2026-11-16

Implemented:
- All-camera analysis for the active floor on one common horizontal target plane, with zero-camera uncovered, one-camera visible and two-or-more-camera overlap categories. Overlap is a subset of covered area and is counted once.
- Analysis across the entire boundary, including regions outside every camera frustum. Existing opaque finite-height walls and solid obstructions remain part of the line-of-sight model.
- Site plan extent by default; camera surroundings when no drawing exists; custom simple polygons with drawing, cancel/undo, draggable corners and Fit area on map.
- Independent per-floor boundary and common target height, saved in the backward-compatible v2 project format and portable exports. Camera-specific target heights remain unchanged.

Browser verification:
- On Level 2, added C-08 alongside C-07 and drew a four-corner analysis boundary. At target 0 m, the 4,574.6 m² area reported18.1% covered / 1.3% overlap / 81.9% unseen.
- Widening C-08 to 110 degree horizontal FOV increased covered area to 21.3% and overlap to 2.9%; unseen decreased to 78.7%.
- Moving one boundary corner reduced area to 4,180.2 m², retained974.8 m²covered and132.2 m²overlap, and recomputed percentages to 23.3% covered / 3.2% overlap / 76.7% unseen.
- A 4 m common plane excluded both 3.2 m cameras with explicit explanation and correctly showed 100% uncovered rather than empty or misleading statistics.
- A no-camera floor showed its entire14,700 m² fallback area uncovered. Returning to Level 2 restored its custom boundary and both cameras, without mixing floors.
- Finish area was disabled with only two corners. Canceling that redraw preserved the saved boundary and metrics.
- Set common target 1.5 m, waited for Saved locally and explicitly reloaded. The target, custom boundary, two cameras, optics and barriers restored; analysis showed 24.7% covered / 4.5% overlap / 75.3% unseen.
- Switching to the single C-07 view still used its individual target 0 m and24% blocked result, confirming common-plane analysis did not mutate camera settings. Switching back restored the combined metrics.
- Fit area on map framed the custom boundary; street/satellite switching preserved analysis.
- At 1440x1024 and732x900, document dimensions exactly matched viewport dimensions with no page overflow. The combined inspector scrolls independently; compact Properties can close to expose the map legend.
- Final browser warning/error log query returned no entries. Viewport override was reset and the live preview tab retained.
- Proof: qa/combined-coverage-desktop.jpg and qa/combined-coverage-compact.jpg.

Independent checks:
- Analytic rectangles verified a 600 m²union,400 m²single-camera area,200 m²overlap and1,000 m²uncovered within a 1,600 m²boundary.
- Concave areas retain their cutouts; cameras and barriers outside the analysis boundary can still affect visibility inside it. Duplicate camera IDs cannot inflate overlap.
- Geometry and rendering use independent polygon pieces; Leaflet renders them as a multipolygon rather than treating pieces as holes.

Limits:
- Blind spots are sampled unseen areas within the chosen boundary, including solid obstruction footprints. They do not identify which spaces are accessible or require surveillance.
- Common target height represents one flat floor plane; this is not terrain or full 3D simulation. Grid resolution and excluded-camera warnings are visible. Small gaps and overlaps can be missed at the reported resolution.
- Google integration is code-checked without live credentials; live verification used Leaflet/USGS.

Final validation:
- All **113 automated tests** passed across 11 files, including 14 new combined coverage cases, 5 default-area cases and the expanded model/storage tests.
- Final production build succeeded. Required Sites client/server/hosting packaging and local PDF.js worker/resources remain intact. Only the existing nonblocking Vite bundle-size advisory remains.
- Independent review verified the dense-geometry preparation limit rejects excessive work before sampling, produces no partial coverage and keeps exclusion counts accurate.
- Final result: **passed for the scoped local proof of concept.**
