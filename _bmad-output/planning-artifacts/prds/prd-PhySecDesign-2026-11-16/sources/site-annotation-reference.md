# Site annotation reference

Research date: 2026-11-17 (America/Chicago).

Purpose: narrow official-source grounding for the guided PRD annotation decision. These references describe other products; the POC recommendations below are proposed scope pending the user's decision, not implemented functionality. This check does not assess life-safety requirements or standards compliance.

## Official-source findings

- **Labels, text and measurements are ordinary plan markup.** CCTV Design Tool lists text, labels, rectangles, measurements and legends in its Draw menu, alongside other drawing objects. It also documents moving selected objects and resizing or rotating supported shapes. [Quick Start, Left toolbar and Object selection](https://docs.cctvdesigntool.com/quick-start/)
- **Directional annotation can be a separate object.** CCTV Design Tool's 17 December 2025 release added a plan arrow drawing object. Its change history also records a label tool for text annotation. These support separate annotation tools without treating an arrow as equipment or a cable connection. [Official changelog, 17 December 2025 and Label entry](https://www.cctvdesigntool.com/changelog)
- **Shape geometry has uses beyond camera coverage.** JVSG documents polygons for irregular site features such as paving and roads, and a ruler that displays the angle between lines. This establishes contextual drawing and measurement as useful design-tool capabilities; it does not establish that every polygon is nonanalytic or that a freeform annotation system is required. [JVSG official release history, Polygon tool and Ruler entries](https://www.jvsg.com/what-is-new/)
- **Obstructions have distinct calculation semantics.** CCTV Design Tool describes walls and obstacle objects as affecting camera visibility, with wall blocking dependent on height. Its layer documentation separates labels, walls, connections and camera FOV, and says hiding a layer does not remove its objects or stop calculations. [Drawing Obstacles](https://docs.cctvdesigntool.com/quick-start/drawing-obstacles.html), [Layers](https://docs.cctvdesigntool.com/ui-guide/layers.html)
- **Dimensions require a scale basis.** For uploaded plans, CCTV Design Tool asks the designer to identify a known distance to establish scale for measurements and other spatial calculations. [Creating Project, Setting image scale](https://docs.cctvdesigntool.com/quick-start/creating-project.html)

## Recommended minimum for this POC

This is a product recommendation inferred from the sources and the existing Site Studio workflow, rather than a claim that the references implement every item below.

1. **Text and callouts:** short labels and optional leader lines for room names, installation instructions and explanations. Reuse equipment names/IDs when referring to an existing asset.
2. **Lines and arrows:** a simple line/polyline with optional arrowhead for direction or visual emphasis. A plain text or numbered marker can identify a referenced location without needing a new symbol catalogue.
3. **Area outlines:** a rectangle or polygon with a label and optional translucent fill for contextual highlighting. Circle/ellipse tools and elaborate symbol libraries can wait unless users identify a concrete need.
4. **Dimensions:** a two-point distance label using the plan's established scale and project units. Identify it as a plan-derived estimate; when scale is unavailable, show it as unscaled instead of inventing a physical length. Do not imply a surveyed measurement or a routed cable length.

Use a small shared set of controls: select, move, edit text/points, basic colour/style, delete, undo/redo and annotation visibility. Preserve annotations in the editable project and include the selected visible markup in plan exports.

Keep existing survey notes/photos as the source of observations and evidence; a callout may refer to a note instead of creating a competing note/photo store. Keep existing security zones as the polygons that carry coverage targets and results. An annotation polygon does not change zone area, DORI, coverage or analysis boundaries. An annotation line does not become a wall, obstruction, cable, door/gate relationship or network connection. Visibility of markup is a presentation choice, not an analysis switch.

No automatic routing, evacuation planning, regulated symbol set, life-safety validation or compliance claim is implied. No DORI convention or existing zone semantics are changed by this recommendation.
