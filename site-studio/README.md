# PhySec · Site Studio

Interactive physical security planning proof of concept based on the white/teal Site Studio design. Site plans overlay a persistent geographic map, and each building floor keeps its own drawing, devices, cable routes, walls, and solid obstructions. A project-wide equipment schedule and bill of materials are derived from those floor designs. Camera coverage views show geometric visibility estimates for one camera or combined coverage across an analysis area on the active floor.

The current POC implementation follows four stages: multi-building/floor projects with local saving, a generic equipment catalog and schedule, same-floor cable routing, and an illustrative materials estimate. See [POC-ROADMAP.md](POC-ROADMAP.md) for the ordered scope and acceptance checklist. End-to-end validation of the combined workflow is pending; [design-qa.md](design-qa.md) records verification separately.

## Run locally

Requires Node.js 22.13 or newer (or Node.js 24+) and npm.

    npm install
    npm run dev -- --host 127.0.0.1 --port 4174

Open http://127.0.0.1:4174/

    npm run build
    npm run test:sites

## Try the workflow

1. Open **Manage** in the Project sidebar. Rename the project, add a building, and add or select a floor. A new building starts with a blank ground floor; additional floors start without a drawing.
2. Search for an address or place and select a result, or enter latitude, longitude. Choose Street or Satellite.
3. Choose **Import site plan** for the active floor and select a PDF, PNG, JPG, or WebP drawing. For a PDF, preview and select one page. Use another floor for an additional PDF page.
4. Use **50% overlay** or **Hide plan** to compare the drawing with the imagery. Move its center handle, resize with its corner handle, or use two-point alignment. Adjust rotation, width, coordinates, and opacity, then lock alignment. Moving a plan retains existing device coordinates.
5. Open **Catalog** in the map toolbar or **Equipment** in the navigation. Choose **Place** beside a generic item, then click its position on the active floor. Select a device to edit its name, model, mounting details, notes, and proposed/existing status. The Equipment **Project schedule** tab lists devices across all buildings and floors; **Locate** returns to a device's floor.
6. Choose **Cable**, select two different devices on the active floor, and choose a cable type and slack allowance. Save immediately for a direct route, or click the map to add bends before **Save route**. Select a saved route to edit its properties or choose **Edit path**.
7. Open **Materials** to review equipment and cable costs. Use **Add accessory** and **Add labor** to enter a description, quantity, unit, and USD unit cost. Turn on **Include installation labor** to add saved labor lines to the estimate and materials CSV.
8. Wait for **Saved locally**, then use **Export** to download a portable `.physec.json` backup. Use **Overview → Open project** to restore an exported project. Older v1 files migrate into a building and floor automatically.

To explore camera visibility, select a camera, use **Wall** or **Obstacle** to trace blocking geometry on that floor, save its height, then select the camera again and adjust its optics and position. See **Camera geometry and obstruction coverage** below.

To compare all cameras on the floor, choose **All cameras · this floor** in the coverage view, then **Area & analysis settings**. Set the common target height and review the default area, or draw a custom boundary. See **Combined floor coverage** below.

At narrow widths, Project & layers and Properties buttons reveal the side panels.

## Buildings, floors, and saving

Each floor has an independent plan image, alignment, device list, route list, and barrier list. Barriers are wall polylines or solid-obstruction polygons, each with a height and a setting that includes or excludes it from visibility calculations. Selecting a floor changes the active design; the equipment schedule and materials estimate aggregate the entire project. Manage supports project/building/floor renaming, adding buildings/floors, and removing a floor with an inline confirmation that names its drawing, device count, route count, and barrier count. The final floor cannot be removed.

The browser saves one current project draft in IndexedDB after changes. The header reports saving, saved, or failed status. This is storage in this browser on this device and site origin; it is not an account, cloud sync, multi-user collaboration, or a backup service. Clearing site data, using another browser/profile, or changing the site's origin can make that draft unavailable. Export regularly, and export immediately if local saving fails.

Portable v2 project files embed floor images and retain buildings, floor names, device properties, camera geometry and stream resolution, routes, barriers, each floor's custom coverage boundary and common target height, PDF page identity, unit-cost overrides, accessory and labor lines, and the installation labor setting. Coverage additions extend v2 without a version bump: earlier v2 projects without barriers load with an empty barrier list, older camera records receive compatible geometry defaults, and floors without combined-coverage settings use the default analysis area and a 0 m common target height. API keys and transient interface state are excluded. Importing a supported v1 file preserves its plan and devices within the new building/floor structure. Opening a project replaces the current working draft, so export any work you want to keep first.

## Site survey

Use **Survey** on the map toolbar and click a location, or select a device and choose **Add device survey note**. Enter a title and installation notes, add labeled measurements with units, attach photos, and choose **Save survey note**. Open a note from the floor's **Site survey** list, a survey pin, or the device inspector.

The prototype accepts up to six JPG, PNG or WebP attachments per note. Photos are resized in the browser and embedded in local saves and portable project files. Device notes follow their device and become map pins at its last location if it is removed.

## Printable design report

Open **Export**, choose the current floor or all floors, and select US Letter or A4 landscape. Choose a combined visibility or DORI layer, or export the plan without coverage. **Preview PDF** builds the packet locally. Use the page selector to check the sheets, then choose **Download PDF**.

The report includes an annotated drawing with a north arrow and scale bar, corresponding equipment and cable schedules, zone requirements, and survey notes with measurements and optional photos. Floors without a drawing get a schematic. Plans use the project's drawing and placement data, with no live map tiles. Pages are rendered at 216 dpi for printing. **Download editable project (JSON)** remains available for transferring the working design.

## Capacity planning

Open **Capacity** to set retention days and edit each camera's average stream bitrate, recorded percentage and switch-side PoE allocation. Storage is the recorded portion of each stream over the retention period, in decimal GB or TB. Aggregate camera bandwidth assumes the configured streams are active together. Generic camera defaults are starting values to replace with the stream settings or measured bitrate for the design.

**Switches** compares assigned copper ports, powered ports and allocated watts with each switch's editable limits, including maximum watts per port. Cameras and IP intercoms start as network endpoints. Enable other IP devices in **Network & PoE**. A direct same-floor Cat6 route to one switch assigns the endpoint to that switch. A Cat6 route between switches counts one copper uplink port at each end. Missing or ambiguous endpoint assignments are flagged and their demand still counts in the project totals.

Use the switch model's rated budgets and switch-side allocations. Allow separately for RAID, recorder overhead, peak traffic and undrawn uplinks. See the [AXIS Site Designer recording guidance](https://help.axis.com/en-us/axis-site-designer) and [Cisco PoE budget guidance](https://www.cisco.com/c/en/us/td/docs/IIOT/switches/ie35xx/sw-config-guide/17-17/b-ie3500-1717-cg/configuring-poe.html). Capacity inputs save with the project and in editable JSON exports.

## Undo and revisions

Use **Undo** and **Redo** above the map, or Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z. Site Studio keeps the last 40 project edits in the current session. Saved drawing changes, devices and their connections, zones, survey records, and estimate settings use the same edit history.

Open **Revisions**, enter a name, and choose **Save revision** to capture the entire property design. **Compare layouts** shows a floor at the same scale in any two saved revisions or in a revision and the working draft. Device changes identify additions, removals, moves, and changes to device properties. **Restore** replaces the working layout with the selected revision. Use **Undo** to recover the previous working layout.

Up to 20 named revisions autosave with the project in IndexedDB and travel in the portable project backup. The project file limit is 100 MB, including revision drawings and photos.

## Sharing and approvals

1. Open **Revisions**, choose **Share & review** beside the named revision, then select **Start review**. It shares a fixed copy of that version’s floor drawings, equipment layout, routes, barriers and zones.
2. Enter each reviewer’s name and email to create an individual link. Copy each link and send it to its assigned reviewer. When sharing across devices, open Site Studio at the address those reviewers can reach before making links. A loopback address works only on the same machine.
3. Reviewers choose a floor and use **Pin comment**. They can submit **Approve revision** or **Request changes**. The designer can see pinned comments and the current and past decisions with names and times in the same revision’s review.
4. Use **Revoke access** to disable an invite or **New link** to replace it. Revoking or replacing a link retains its comments and decision history. Start a separate review for a new revision.

The review service runs in the local Vite dev and preview servers and stores data in the private `.review-data/` directory. The designer’s management key stays in their browser. Invitations are bearer links, so whoever has a link can respond as the named reviewer. Keep this proof of concept on a trusted network. The static Sites package, portable project files and new browser profiles do not carry the review service or owner keys. The review snapshot limit is 64 MB.

## Equipment, cable, and materials

The catalog contains nine generic items across eight types: cameras, credential readers, lights, door contacts, intrusion sensors, intercoms, network switches, and equipment cabinets. Camera choices include a dome and an outdoor bullet. These are editable planning objects, not live vendor models or verified specifications. The schedule can be searched and filtered, and shows each device's building, floor, and proposed/existing status.

Cable routes connect two different devices on the same floor. Supported planning categories are Cat6, fiber optic, and security cable. A route can be direct or contain map waypoints; saved paths can be edited, and endpoint positions follow their devices. The route inspector reports horizontal map distance and distance with a configurable 0–100% slack allowance. Removing a device also removes its connected routes. Cross-floor risers, vertical runs, routing obstacles, cable limits, power budgets, and installation allowances are not engineered by the prototype.

The bill of materials groups proposed equipment by catalog item and cable by type across all floors. Cable quantities include saved slack. Enter accessories and installation labor as project-wide line items. The estimate shows separate equipment, cable, accessory, and labor subtotals. You can switch between materials-only and installed pricing with **Include installation labor**. The CSV includes the lines used in the estimate. Project autosave and portable backups preserve all lines and the labor setting. USD unit costs are planning allowances. Allow separately for taxes and freight.

There is no general undo history. The specific alignment undo and draft-route last-waypoint action remain available in their respective workflows.

## Camera geometry and obstruction coverage

The selected camera uses a rectilinear camera frustum projected onto a horizontal target plane. This is a 2.5D planning model: floor-plan footprints have vertical heights, and the model checks sight lines from the camera to target-plane samples against enabled barriers. Walls and objects are not extracted automatically from the drawing or aerial imagery; trace the barriers you want the calculation to consider.

1. Select a camera on the active floor to open **Camera geometry** and its estimated visibility.
2. Choose **Wall** to trace an open wall line with at least two map points, or **Obstacle** to outline a solid footprint with at least three points. Set **Height above floor** and whether it **Blocks camera views**, then choose **Save wall** or **Save obstruction**. Heights are measured from the same floor level as camera and target heights.
3. Select the camera again. Adjust **Lens focal length** or **Horizontal FOV**; changing either updates the other using the sensor width. Under **Advanced optics**, match sensor width and aspect ratio to the intended camera specification.
4. Adjust **Mounting height**, **Tilt downward**, **Aim / bearing**, and **Target plane height** to study the view. A target height of 0 m analyzes the floor/ground plane; a higher horizontal plane changes the modeled intersections. The target plane must remain below the camera.
5. Set **Analysis distance** to bound the calculation. Inspect the visibility colors and near blind distance, then edit a barrier's shape, height, or blocking setting to compare the result.

| Color | Meaning |
| --- | --- |
| Green | Sampled target-plane area inside the camera view with no modeled barrier blocking the sight line. |
| Red | Sampled area inside the view whose sight line is blocked by an enabled wall or solid obstruction. |
| Amber | Near area below the camera's view; being close to a camera does not by itself make a target visible. |

In the single-camera view, only the selected camera receives this detailed analysis. Its visible/blocked percentages describe sampled points within its target-plane field of view, not the entire floor analysis area or a probability of identification. Barrier height matters: a lower obstruction may permit a sight line over its top. The sampling resolution and the user-entered geometry limit accuracy. Analysis distance is a computational boundary, not a detection range or performance guarantee.

Barriers and camera settings autosave and export with their floor. Moving or realigning a plan image does not move geographically anchored devices or barriers. Visibility geometry does not add barrier materials to the bill of materials or automatically reroute cables.

This model does not simulate lighting, image detail, motion blur, fisheye projection, lens distortion, glass transparency, terrain, or a complete 3D building. It provides geometric estimates for design exploration; it does not certify coverage or guarantee detection or identification.

The lens/FOV relationship uses focal length and sensor dimensions; real lens specifications and image performance need separate verification. Primary references: [Edmund Optics — Understanding Focal Length and Field of View](https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-focal-length-and-field-of-view/) and [Axis — Lenses in surveillance](https://whitepapers.axis.com/en-us/lenses-in-surveillance).

## DORI coverage

Choose **DORI** in the coverage overlay controls for one camera or **All cameras · this floor**. Adjust **Horizontal stream resolution** in camera properties to match the configured video stream. Older projects use the generic 2,688 px default, or 3,840 px for the 8 MP bullet catalog entry. Stream resolution is saved in the project.

The view uses the [IEC 62676-4:2014 DORI thresholds documented by Axis](https://whitepapers.axis.com/en-us/pixel-density-based-on-iec-62676-4-2014) of 25, 63, 125 and 250 px/m for Detect, Observe, Recognize and Identify. Estimates divide horizontal stream pixels by the projected scene width at each visible sample. Use the target plane for the detail height of interest, such as face height. Visible samples below 25 px/m appear separately from blocked or unseen areas.

Combined DORI reports the best unobstructed level reached by any one camera at each sample. The level areas are mutually exclusive. **Detect or better** totals all four DORI levels. Switch back to **Visibility** to see camera counts and overlap. Confirm the estimates in live footage under representative lighting, face angles and stream compression.

## Combined floor coverage

The combined view evaluates the entire analysis area on the active floor and counts how many cameras can see each sampled point. It uses each camera's optics, position, bearing, tilt, mounting height, and analysis distance, together with enabled walls and solid obstructions. All cameras on that floor are considered, including cameras whose display layer is hidden. Cameras on other floors do not contribute.

1. Select a camera, then choose **All cameras · this floor** in **Coverage view**. Open **Area & analysis settings** to inspect the combined results and boundary.
2. Set **Common target height** from 0–10 m. The default 0 m plane represents the floor/ground level. This floor setting replaces individual camera target heights for the combined calculation without changing those camera settings. A camera with invalid geometry or a mounting height at or below the common plane is excluded; review the warning and included-camera count.
3. Review the **Analysis boundary** source. An uploaded plan uses the extent of the whole image, including any blank sheet margins. Without a drawing, the default area surrounds the floor's camera positions and analysis distances. An empty floor uses its map area. These are starting bounds, not an automatically recognized building interior.
4. Use **Draw area** to click at least three corners around the space to evaluate, then **Finish area**. The polygon must enclose an area without crossing its own edges. Use **Edit boundary** to drag corners, **Redraw area** to replace it, or **Use default area** to return to the automatic bounds. Choose **Fit area on map** to frame the analysis boundary after editing custom bounds or opening a saved project.
5. Review **Covered**, **Overlap · 2+ cameras**, **Blind spots**, the area analyzed, actual sampling resolution, and warnings. Adjust camera geometry, enabled barriers, the common target height, or the boundary to compare designs.

| Combined-view color | Camera count at a sample |
| --- | --- |
| Red — blind spot | 0 cameras see the point. This includes samples outside camera views or analysis distances as well as samples blocked by modeled barriers. |
| Teal | Exactly 1 camera sees the point. |
| Purple — overlap | 2 or more cameras see the point. |

Every percentage uses the entire sampled analysis area as its denominator, including solid-obstruction footprints and sheet margins inside the boundary. **Covered** is the area seen by at least one camera; **Blind spots** is the unseen remainder. **Overlap** is a subset of Covered, not an additional area to add to it. Each sampled point counts once toward Covered even when multiple cameras see it. The combined red region therefore means unseen within the chosen boundary; single-camera red means blocked within that camera's view.

The custom boundary and common target height autosave and export independently for each floor. Default bounds are derived from the floor's current plan or camera surroundings; a saved custom boundary remains geographically anchored. Older v2 projects migrate to default bounds and a 0 m common target height when these fields are absent.

This remains a sampled 2.5D geometric estimate. Solid footprints are included in the analysis rather than silently removed from its area, and barrier heights affect sight lines. Sampling can miss fine details or narrow gaps; inspect the reported resolution and confirm the boundary, scale, and geometry. The view does not provide full 3D simulation, lighting analysis, or certified detection and identification guarantees. All calculations and saved drafts remain part of the local browser POC.

## Two-point plan alignment

Open Properties → Alignment → Two-point alignment (unlock the plan first).

1. Pick two distinct points on the plan image, preferably corners far apart.
2. Click Match building. The plan is hidden; pick the corresponding building corners on the imagery in the same order. Use View plan points in the compact guide to reference the source points.
3. Review the calculated rotation, size, and scale. Adjust preview opacity to inspect the match.
4. Apply alignment, then verify the remaining edges before locking.

Back reselects a point/step; Start over resets the selections. Cancel or Escape leaves the plan unchanged. Undo last alignment restores the prior geometry after applying, until another geometry edit or import; unlock the plan before undoing. Devices retain their geographic positions.

The tool solves translation, clockwise rotation, and uniform scaling while preserving aspect ratio. It uses one shared Web Mercator geometry model for rendering, picking, and solving, including unrounded image positioning. It does not correct skew, perspective distortion, or inaccurate source drawings. Closely spaced anchors and unrealistic output dimensions are rejected. Unchanged numerical fields retain the precise alignment values when focus leaves them.

Alignment checks: node --test tests/alignment.test.mjs

## PDF site plan import

Choose Import site plan → Choose a file, then select a PDF up to 50 MB. Browse page thumbnails or enter a page number, inspect the large preview, and choose Use page. The selected sheet replaces the current plan at the map center and opens the satellite-view alignment controls. Use two-point alignment to match two drawing corners to the building.

PDFs are processed locally in the browser using bundled PDF.js resources; the document is not uploaded. Password-protected PDFs prompt for their password locally. Page labels and landscape/portrait aspect ratios are preserved. A selected page is rendered as a bounded high-resolution image (up to 3200 pixels on its longest side); project export embeds this image and its source filename/page identity. The original PDF and its password are not exported. Each floor supports one selected PDF page or image overlay. To retain another page, add/select another floor and import that page there. The prototype does not provide PDF editing, cropping, native CAD import, or multiple simultaneous drawings on the same floor.

Try a sample PDF drawing set in the import dialog to explore three fictional sheets without uploading a file. Canceling the picker leaves the current plan intact.

PDF checks: node --test tests/pdf-import.test.mjs

## Maps

OpenStreetMap street maps work immediately through Leaflet. Satellite mode uses public USGS aerial imagery for U.S. properties, including dynamic NAIP Plus imagery at close zoom. Map-style switches preserve the viewport and design coordinates. Imagery age and detail vary; the sample drawing is fictional, and roof edges in aerial images are not surveyed ground control. The map menu also offers the official Google Maps JavaScript API with street/satellite views. A browser-restricted Google key can be entered for the current session. It is not included in exported project files. Google rendering is implemented but requires live credential testing.

Official references:
- https://leafletjs.com/reference-1.9.4.html
- https://developers.google.com/maps/documentation/javascript/get-api-key
- https://operations.osmfoundation.org/policies/tiles/

Address lookup uses Photon (OpenStreetMap data) on explicit submission, with cancellation, a 10-second timeout, and a bounded result cache. The public demo service is suitable for moderate prototype use, with no uptime guarantee. For deployment, set VITE_GEOCODING_URL to a suitable hosted or self-managed Photon endpoint.

Additional source references:
- https://github.com/komoot/photon#demo-server
- https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer
- https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map

Search checks: node --test tests/geocoding.test.mjs

## Prototype scope

The sample site plan is fictional and shown over real map tiles. Single-camera and combined floor coverage estimates include manually modeled walls and solid obstructions, camera optics, height, tilt, and a target plane. Combined results depend on the chosen analysis boundary and common target height. They remain sampled geometric estimates and do not model lighting, fisheye projection, lens distortion, or certified performance. Camera coverage, equipment specifications, cable quantities, and prices need field and professional verification. PDF page import is supported; native CAD sheets must first be exported as PDF or images.

The POC combines browser-local autosave and portable export with a local review service for pinned comments and approvals. Hosted identity, cloud sync, live vendor pricing and engineering certification remain outside the POC. It makes no PSP compliance claim. Google rendering still requires live credential verification. Plan separately for production map/geocoding services, account and access controls, reliable backup/sync, validated engineering calculations, and requirements traceability using licensed PSP reference materials.

Validation commands for the implemented modules:

    node --test tests/project-model.test.mjs tests/project-storage.test.mjs
    node --test tests/cables.test.mjs tests/materials.test.mjs
    node --test tests/alignment.test.mjs tests/pdf-import.test.mjs tests/geocoding.test.mjs

Run `npm run build` and `npm run test:sites` before a Sites handoff. Implementation status and a test command do not by themselves mean the browser acceptance workflow has passed.

See design-qa.md for visual and functional verification. Source concept: ../design-mockups/04-map-overlay-studio.png.
