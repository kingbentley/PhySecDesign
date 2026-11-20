# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product direction

- Preserve the white/teal Site Studio visual direction from ../design-mockups/04-map-overlay-studio.png.
- Keep the geographic basemap persistent; imported site plans overlay map tiles, with device locations in geographic coordinates.
- Offer OpenStreetMap without a key and official Google Maps as an optional configured source.
- Keep plan move/rotation/scale/opacity/locking and camera/device placement directly accessible.

- Add address/place lookup and satellite/aerial imagery for locating properties and aligning plans against real building footprints. Keep map style switches from moving the plan or devices.

- Two-point alignment must match plan points to building points using translation, rotation and uniform scale; preview before applying, preserve aspect ratio and device coordinates, and support cancellation and undo.

- PDF import must process files locally, let users preview and choose one page, preserve page aspect ratio/identity, and feed the selected sheet into the existing satellite-map and two-point alignment workflow.

- This is a proof of concept. Implement the ordered workflow: multiple buildings/floors with browser-local saving, generic equipment catalog/schedule, same-floor cable routing, then illustrative bill of materials and CSV. Preserve independent floor plans/devices/routes and portable v1 project migration. Keep production hosting, live vendor catalogs and certified engineering calculations out of scope.

- Coverage analysis is a POC rectilinear-camera projection on a chosen horizontal target plane. Link lens/FOV through sensor size; mounting height, tilt and opaque wall/obstruction heights affect visible area. Highlight selected-camera visible, blocked and near-blind regions; persist barriers per floor. Keep assumptions and sample resolution visible; do not imply detection, DORI, lighting or certification guarantees.

- Combined coverage must evaluate the entire analysis area on the active floor: red for 0 cameras, teal for exactly 1, and purple for 2 or more. Include all floor cameras regardless of display-layer visibility and use enabled barriers. Preserve the single-camera view's separate visible/blocked/near-blind meanings.

- Default combined bounds use the uploaded plan image extent, which can include sheet margins; without a drawing, use camera surroundings (or the floor's map area when empty). Let users draw a simple polygon, edit its corners, and restore default bounds. Do not imply that the image extent is a recognized building interior.

- Combined analysis uses one common target height per floor, defaulting to 0 m, independently of individual camera target heights. Exclude and visibly warn about cameras with invalid geometry or mounting heights at or below that plane. Keep the analysis boundary, target height, sampling resolution, and assumptions visible. Persist custom bounds and common target height per floor through browser autosave and v2 export, with compatible defaults for older v2 projects.

- Combined percentages use the entire sampled analysis area, including solid-obstruction footprints. Covered counts each point seen by at least one camera once; overlap is the subset seen by 2 or more and must not be added again to Covered. Unseen is the remaining area within the boundary. Keep this a local 2.5D POC without full 3D, lighting simulation, or performance guarantees.

- DORI is an optional pixel-density overlay in both camera and combined coverage. Use the IEC 62676-4:2014 DORI thresholds, persist each camera’s horizontal video stream resolution, and keep visible areas below Detect distinct from unseen areas. Combined DORI uses the highest level from any single unobstructed camera at each point on the common target plane.

- Security zones are named floor polygons independent of the overall coverage boundary. Persist their type, outline and optional DORI requirement. Measure the percentage of the entire zone that meets or exceeds its selected level at the floor's common target height. Keep zone results visible when choosing and adjusting a camera.

- Keep survey notes and photos local to the project. A note belongs to one floor and is linked to either a device on that floor or a map point. Preserve a device's survey records as pins at its last location if the device is removed.

- Capacity estimates use editable average bitrate, recording percentage and project retention. Model one copper access port per network endpoint plus drawn Cat6 switch uplink ends. Compare assigned PoE allocations with each switch's port and power limits, and show unassigned endpoint demand separately.

- Keep recent project edits undoable during the browser session. Named revisions capture the full local project, round-trip in portable backups, and compare floor layouts at the same scale. Restoring a revision must leave the saved versions intact and support undo.

- Keep shared reviews tied to immutable named revisions. The local review API uses separate revocable bearer links for each invited reviewer, records floor-pin comments and timestamped decisions, and keeps owner keys out of portable project files. Keep review files out of static routes.

- The PhySec logo is the survey clipboard with a dome camera, chosen on 2026-11-20 with the line "Site Survey Design". It replaced the shield chosen earlier that day and the room-and-camera mark of 2026-11-19. Its source files and usage notes are in `../design-references/logo/`. In the app, draw it with `BrandMark` from `src/BrandMark.jsx`, not a stock icon; it uses the logo's own colours, while the interface keeps teal `#007e73`. The browser tab icon is the logo's camera alone, because the whole logo is unreadable at 16 pixels. The icons in `public/` are copies of the files in that folder.
