# PhySec Site Studio — proof-of-concept goal

Status: **Complete — core workflow verified on 2026-11-16.**

Goal: demonstrate a complete local property-planning workflow from imported and aligned drawings through equipment placement, routed cable estimates and an automatically derived bill of materials. Preserve the existing white/teal map-first design.

## Recommended sequence and result

1. **Buildings, floors and local saving — complete.** The project model comes first because equipment, routes and estimates need stable floor ownership. Each floor has an independent drawing/alignment, devices and routes. IndexedDB restores the working draft; portable v2 exports retain the property and migrate supported v1 files.
2. **Generic catalog and equipment schedule — complete.** Nine generic entries across eight types provide consistent device identities for routing and quantity aggregation. Devices have editable names, model descriptions, mounting notes, design intent and proposed/existing status. The schedule spans the property.
3. **Cable routes — complete.** Same-floor devices can be connected directly or through drawn waypoints. Editable endpoints, paths, cable type and 0–100% slack feed estimated quantities. Endpoints follow device positions; removing a device removes its connections.
4. **Materials estimate and CSV — complete.** Proposed device counts and routed cable quantities generate the estimate. Existing equipment is counted separately. Editable USD allowances persist with the project; CSV includes quantities, units and costs.

## Acceptance evidence

- Browser workflow created Building A / Level 2 and a separate Gatehouse, retaining the original ground-floor drawing and its 11 devices.
- Imported PDF page 2 on Level 2, placed C-07 and SW-01 from the catalog, and verified floor switching isolates each drawing and its devices.
- Saved a two-bend cable route: 57.5 m drawn, approximately 63.3 m with 10% slack. Coordinate search kept route editing active; canceling a third-point edit preserved the saved path.
- Materials aggregated 13 proposed devices and 63.25 m of cable across the property. Changing the camera unit allowance from $450 to $500 changed the total from $4,558.76 to $4,908.76.
- Explicit browser reload restored all three floors, the PDF image, devices, route and edited allowance.
- Two-point alignment applied to Level 2 with a -6.1° rotation and 114.3 m drawing width.
- Automated tests cover v1 migration, v2 portable JSON round trips with actual sample image bytes, PDF metadata, reference integrity, serialization/recovery failures, cable geometry/slack, proposed versus existing quantities, and CSV escaping.
- **66 tests passed. Production build and Sites packaging passed.** Desktop and compact layouts were checked; the compact dialog overflow found during QA was fixed.
- See [design-qa.md](design-qa.md) for details and [qa/poc-materials-compact.jpg](qa/poc-materials-compact.jpg) for the captured materials screen.

This is a core-flow POC acceptance pass, not an exhaustive test of every browser, device type, or production-scale drawing set. Google Maps still needs live credential testing.

## Deliberate scope

- Browser/device-local saving and portable project backup. Shared reviews run on the local preview server with reviewer-specific links.
- One drawing or selected PDF page per floor; additional pages belong on additional floors. No CAD editing or several simultaneous plan overlays on one floor.
- Generic equipment and illustrative USD allowances; no live manufacturer catalog, procurement or suitability validation.
- Same-floor cable routes use horizontal distances plus entered slack. Vertical runs, risers and installation conditions need separate allowance.
- The original estimate covered equipment and cable. The expanded estimate adds manual accessories and optional installation labor. Allow separately for tax and freight.
- Illustrative camera coverage; no certified performance calculations or PSP compliance claim.
- Undo and redo cover the last 40 project edits in a session. Named revisions save with the project and support floor comparison and restore.

Production features and licensed-reference requirements traceability should be scoped after reviewing this demonstration.

## Next phase — feature backlog

**Security zone polygons are implemented.** Users can draw, name and edit areas on a floor, choose a zone type, and optionally set a minimum DORI level and required percentage. The zone shows the qualifying percentage and highlights gaps at the floor's common target height. Analysis stays visible while adjusting a camera. Zones save with the floor and travel in portable project exports.

**Site survey notes and photos are implemented.** Notes attach to a floor pin or device and include labeled measurements, installation notes and local image attachments. Fence lines and entrance markers remain on the zone backlog.

| Order | Feature | Current state and remaining work |
| --- | --- | --- |
| 1 | Security zones and boundaries | Named areas for entrances, parking, perimeters and restricted areas are available. Fence lines and entrance markers remain. |
| 1 | Camera coverage analysis | Individual and combined visibility, overlap and DORI estimates use lens, stream resolution, mounting geometry and obstructions. Named zones can now apply these estimates to a requirement. |
| 2 | Site survey notes and photos | Floor pins and device notes support photos, labeled measurements, installation constraints and observations. Survey records are included in portable project files. |
| 3 | Drawing and report exports | The PDF design packet includes labeled floor plans, coverage legends, equipment and cable schedules, zone requirements, and survey notes and photos. Portable project JSON and materials CSV remain available. |
| 4 | Equipment catalog | Generic cameras, readers, door contacts, intercoms, sensors, switches and cabinets already have IDs and editable model and mounting details. Add gates and expand model, mounting and accessory options. |
| 4 | Cable routes and connections | Same-floor connections already track endpoints, waypoints, length and slack. Add network closet and port assignments and allowances for risers and vertical runs. |
| 4 | Capacity planning | Editable camera bitrate and recording time feed bandwidth and retention storage. Per-switch port and PoE checks use direct Cat6 connections and flag unassigned demand. Settings persist in the project. |
| 4 | Bill of materials and estimates | Materials combines calculated equipment and cable with editable accessory and installation labor lines. The labor setting controls the estimate total and CSV, and project saves retain all lines. |
| 5 | Autosave, undo and revisions | Browser autosave and project backups retain named revisions. The editor supports undo and redo, undoable restores, and side-by-side comparison of a floor with device changes. |
| 6 | Collaboration and approvals | Local review sessions share fixed layouts with named reviewers via revocable links. Reviewers pin floor comments or record approvals and change requests. Decisions are timestamped for that revision. Hosted identity and deployment remain future work. |

Use the [ASIS PSP Body of Knowledge](https://www.asisonline.org/globalassets/certification/documents/physical-security-professional----bok.pdf) to organize follow-up discovery across assessment, design and implementation. Track each verified reference, the workflow it affects and its acceptance check separately from this feature backlog.
