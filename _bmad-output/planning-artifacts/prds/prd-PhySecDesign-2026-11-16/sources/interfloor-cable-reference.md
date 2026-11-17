# Interfloor cable routing reference

Research date: 2026-11-17 (America/Chicago).

Purpose: narrow primary-source grounding for a POC model of routes across floors and cable allowances. The recommendations are proposed PRD scope, not claims about implemented Site Studio behaviour or universal installation rules.

## Official-source evidence

- **Editable routes can cross floors.** CCTV Design Tool keeps connection creation active when changing floors and allows added/moved points to describe a physical cable route. [Creating Connections, Creating the connection and Editing connections](https://docs.cctvdesigntool.com/quick-start/creating-connections.html)
- **Height affects estimated length.** Its floor documentation identifies floor heights as cable-calculation inputs. The 11 June 2024 release also introduced device mounting heights in cable calculations. These sources establish relevant inputs, but do not prescribe a universal floor height or prove that mounting height equals the cable drop. [Floors](https://docs.cctvdesigntool.com/ui-guide/floors.html), [Official changelog, 11 June 2024](https://www.cctvdesigntool.com/changelog)
- **Schedules preserve individual runs and aggregate quantities.** CCTV Design Tool documents connection rows with start, end, type and calculated length, grouped totals by type, and CSV export. JVSG's official history records cable lists in PDF reports and total lengths by cable type. [Connection Manager, Connections Overview and Exporting connections](https://docs.cctvdesigntool.com/ui-guide/connection-manager.html), [JVSG release history, Cable List entries](https://www.jvsg.com/what-is-new/)
- **Fixed cable and patch leads have different boundaries.** Fluke Networks distinguishes a complete channel, including relevant patch/equipment cords, from its fixed permanent-link portion, which excludes end cords. This is useful terminology for avoiding duplicate quantities; this note does not adopt that article's numerical limits or certification requirements. [Channel and Permanent Link sections](https://www.flukenetworks.com/blog/cabling-chronicles/channel-permanent-link-patch-cords-mptl-e2e-oh-my)

## Recommended POC model

This model is an inference for a manageable POC; the sources do not establish its particular data structure or allowance formula.

1. **One physical run, one ID:** identify the cable type, physical from/to terminations and associated devices/ports. Give the run an ordered list of floor route segments and transitions. Each floor shows its own segment and continuation label using the same run ID; reports count the run once.
2. **Named risers:** use a stable riser ID/name with an anchor on each relevant floor. A run references the riser and its from/to floors. Each floor's horizontal polyline uses that floor's scale. Do not infer a cross-floor distance from unrelated drawing coordinates or assume automatic floor alignment.
3. **Explicit vertical and drop lengths:** enter each interfloor transition length and each endpoint rise/drop separately, with units and a source/status such as measured or estimated. Include real offsets or detours in the entered path length. A missing value remains unknown. Device mounting height alone does not determine a drop without the route elevation. Do not add a height-derived length when the same portion is already in a manual segment.
4. **Transparent allowances:** enter fixed service-loop lengths at the relevant ends/locations. Optionally apply one user-selected extra-length percentage to the route subtotal, once per run. Keep loops and percentage visible separately; do not compound percentages at floor, run and project levels.
5. **Separate patch leads:** default the fixed-run quantity to exclude separately itemised patch/equipment cords. Record their references/quantities independently. If a run is explicitly defined to include such a portion, prevent that same portion being counted again in the cable quantity. A fixed run is not automatically a complete channel.

For this proposed convention:

- Route subtotal `R` = sum of scaled floor segments + explicit transition lengths + non-overlapping endpoint drops.
- Planning cable quantity `Q` = `R` + fixed service-loop lengths + `(optional extra percentage × R)`.

The percentage is a dimensionless fraction in this formula. Show the chosen basis and units. `Q` is a planning/supply estimate, not a verified installed length or test result. Keep measured as-built length as a separate value with evidence. Each cable using a shared riser includes its own transition length once; sharing the pathway does not divide the cable quantity between runs.

A schedule should expose run ID, endpoints, floors/riser, route subtotal, vertical/drop components, fixed loops, optional percentage, estimated quantity and completeness status. Unknown or unscaled components make the total incomplete rather than zero. Aggregate each run once by cable type; keep any purchasing pack/reel rounding separate.

No default floor height, mandatory slack amount, universal cable limit, automatic route finding, pathway capacity, firestopping design, 3D coordination or automatic code-compliance assessment is proposed.
