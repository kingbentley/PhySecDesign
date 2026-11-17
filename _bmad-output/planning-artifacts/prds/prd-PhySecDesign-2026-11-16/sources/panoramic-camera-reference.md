# Panoramic camera reference for OQ-7

Research date: **2026-11-17** (America/Chicago). Official Axis technical documentation and datasheets checked. The support levels below are recommendations for the user's scope decision, not accepted PRD requirements or implemented capabilities.

## Three different optical arrangements

| Arrangement | Distinction relevant to Site Studio |
| --- | --- |
| Independent multidirectional heads | Several sensors/lenses share one housing, but each head has its own direction and optical setting. Model separate views beneath one physical asset. |
| Stitched multisensor panorama | Several overlapping source images are projected and stitched into one panoramic image. The composite projection is not equivalent to one very wide rectilinear lens. |
| Single-sensor fisheye | One lens/sensor captures a circular wide-angle view. Panorama, quad and virtual PTZ views can be derived from that same capture; they are not additional physical sensors. |

Axis explicitly distinguishes these arrangements and describes spherical/cylindrical stitching, movable heads, and fisheye dewarping. [Axis, *Panoramic cameras*, July 2025](https://whitepapers.axis.com/en-us/panoramic-cameras).

## Evidence that affects the data model

- **Per-head resolution:** AXIS P3737-PLE specifies four channels, each up to 2592×1944, with per-head horizontal FoV of 99°–37°. Its combined “4×5 MP” description does not give any individual head 20 MP. [Datasheet, page 2](https://www.axis.com/dam/public/ae/f3/76/datasheet-axis-p3737-ple-panoramic-camera-en-US-558296.pdf#page=2).
- **Lens count is not port count:** that same model specifies a physical RJ45 PoE connection and device-level power requirements. Power also depends on operating conditions such as IR use. [Datasheet, page 4](https://www.axis.com/dam/public/ae/f3/76/datasheet-axis-p3737-ple-panoramic-camera-en-US-558296.pdf#page=4). Treat this as a model example, not a rule that all multi-lens cameras have one connection.
- **“360°” needs context:** AXIS M4338-PLVE advertises 360° coverage while specifying 185° horizontal and vertical lens angles and a 3536×3536 output. A ceiling-mounted circular view's surrounding azimuth is different from a rectilinear horizontal viewing angle. [Datasheet, pages 1–2](https://www.axis.com/dam/public/permalink/263167/datasheet-axis-m4338-plve-panoramic-camera-en-US_263167.pdf#page=2).
- **Raw versus dewarped output:** Axis VAPIX distinguishes the non-dewarped overview from transformed views and gives each mode its own valid resolutions, rotations and mounting dependencies. [Dewarped views](https://developer.axis.com/vapix/network-video/dewarped-views/). Store the selected output/profile; do not reuse a raw-image resolution indiscriminately for every virtual view.
- **Detail is nonuniform:** the M4338-PLVE datasheet gives different center/corner DORI distances and explicitly notes variation across the image. [Datasheet, page 7](https://www.axis.com/dam/public/permalink/263167/datasheet-axis-m4338-plve-panoramic-camera-en-US_263167.pdf#page=7). Axis also documents density changes, lost corner data and stretching during horizon straightening. [Horizon straightening](https://whitepapers.axis.com/en-us/horizon-straightening). A large dewarped output is not evidence of equally large independent optical detail everywhere.

## Recommended bounded POC support

1. **Separate hardware, optical views and streams.** Keep one physical camera identity, mount, cost and actual network/power connections. Give each head/view a stable child identity, optical profile, resolution and aim. Associate configured streams with their source views. Port/PoE demand follows hardware specifications; bandwidth/storage follows the streams actually transmitted or recorded. Lens count, stream count and device count are different quantities.
2. **Support independent heads first.** Reuse the existing rectilinear analysis for each supported head, with its own resolution, selected lens setting, bearing and tilt. Combine footprints as a union and detail as the best eligible unobstructed view, never a sum of megapixels or densities. Show which head contributes. Preserve known head failures and unknown settings in current-installation analysis. A shared mounting point can be a documented approximation for a compact housing.
3. **Represent fisheye and stitched cameras without fabricating DORI.** Allow their identity, specifications and configured views in the catalog/inventory. A placement aid may show explicitly approximate panoramic coverage when its angular extent, mounting and chosen range are known. Until a suitable projection model exists, label DORI **Not assessed** and do not credit that illustration toward a zone's DORI target. Do not feed 180°/360° into the existing rectilinear tangent formula or divide total pixels equally among invented sectors.
4. **Require a credible mapping before detailed panoramic DORI.** The evaluated output needs a known capture/dewarp/stitch profile, source sampling and active-image/crop information, a supported ray-to-pixel projection or documented calibration, mounting orientation and target-plane geometry. Account for effective sampling after transformation; interpolation or digital zoom must not manufacture detail. Manufacturer DORI distances can be retained as reference values with their stated conditions, but are insufficient by themselves to generate a trustworthy full-floor contour. If usable per-head streams are available, evaluate those explicitly rather than silently attributing their detail to a different stitched recording.

Retain the current **25 / 63 / 125 / 250 px/m** Detect / Observe / Recognize / Identify convention and existing analysis boundaries. Predicted coverage remains a planning estimate, not a field-test Pass, analytics guarantee, standards-compliance claim, or guarantee that 360° coverage has no occlusions. Advanced fisheye calibration and stitch simulation are separate scope choices.
