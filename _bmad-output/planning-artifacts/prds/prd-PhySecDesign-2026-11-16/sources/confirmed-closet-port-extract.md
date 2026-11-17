# Confirmed closet/port assignments — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.11. This narrow extraction separates the latest accepted closet/port proposal from the physical inter-floor cable and vertical/drop discussion still pending. It is not finalization or an implementation/test claim.

## Decision authority and boundary

The latest user confirmation accepts the closet/port-assignment approach and asks for cable routing between floors plus vertical/drop allowances next. It supersedes the pending labels in the inspected draft-0.11 [PRD](../prd.md), [addendum](../addendum.md), [canonical log](../.memlog.md), [source index](../source-index.md) and [conversation context](conversation-context.md). Those sources recorded the recommendation before this confirmation.

Accept the named equipment locations, manual port/connection schedule, controller/passive-reference distinctions, honest capacity/reservation checks and associated shared editing/history/export behavior described below. Planned network assignments may cross floors and precede a physical route. **That does not accept physical inter-floor routing, risers or vertical/drop length calculation**; those remain the next OQ-7 cable decision. OQ-8 dependency/archive/restore edge cases and OQ-9 acceptance/limits remain open.

## Accepted capability map

| Capability | PRD impact | Required interpretation |
| --- | --- | --- |
| Named equipment locations | New closet/port FR appended after FR-50 (candidate FR-51); FR-20/49 supporting context | Stable closet/location ID, name such as MDF/IDF, building/floor/map location, notes or survey references. Associate existing cabinets, switches, controllers, recorders and supplies without cloning individual IDs/costs. Distinguish physically present equipment from remote served devices. Group/name edits do not silently move installed equipment or redraw cables. Closet is a container, not an automatic purchase/switch/load. |
| Explicit manual port schedule | New FR; FR-19 | Stable identifiable ports/labels, model/user-sourced capabilities and copper/optical interface type; do not assume all connectors are independent usable ports or PoE-capable. Link specific device/interface, peer switch port or named reservation. Preserve optional cable, patch/outlet labels and source/current-proposed context. |
| Allocation versus condition | New FR; FR-19 | Separate free/reserved/assigned allocation from usable/unavailable/unknown condition. Retain an existing faulty-port connection with a warning instead of erasing it. Unknown inventory cannot yield an exact spare count. Combo/breakout/stack behavior remains unassessed unless explicitly represented. |
| Direct active network connection | FR-9/19 plus new FR | Identified compatible ports at active endpoints; count uplinks at both ends by actual port type. Fiber provides no PoE. Warn about duplicate/conflicting use, missing references and known incompatibilities. A cable/relationship cannot invent an available port. |
| Assignment independent of physical route | FR-9 and new FR | Permit planned/unverified assignments before a route is drawn, including across floors; disclose missing route detail. No fabricated cable, length, installed connection or test. A linked cable's endpoint/port context must agree or display a discrepancy. Current installation and Proposed design keep separate assignments/counts, including retained equipment and intended replacements. |
| Controller and passive references | FR-49 and new FR | Ethernet interfaces remain distinct from controller reader/input/relay/channel and local-power references. Controller-wired reader/contact/lock/REX does not automatically consume Ethernet/PoE; an actual IP-connected instance can. Do not impose Ethernet's direct-link cardinality on shared control buses/common terminals. Passive patch labels, closet membership and opening links do not prove an active switch/PoE association. Detailed wiring/sequence validation and full passive graph are outside scope. |
| Compatible PoE bases and honest unknowns | Expand FR-19; new FR | Known per-port capability/limit/allocation/demand with source/basis; total switch budget separate. Distinguish rated/maximum planning demand, allocation and observed/typical consumption. Missing basis/conversion remains incomplete; do not silently treat device-side watts as switch-side allocation or infer budget from port count. |
| Reservations without duplication | FR-19 and new FR | Specific planned-device reservation uses that device's demand once. Unnamed future reservation may carry an explicit allowance; unknown demand remains visible. Already allocated equipment is not an additional reservation. Current load versus proposed reserve stays distinct; known headroom plus unknown demand is incomplete, not guaranteed sufficient. |
| Property-wide demand and physical identity | FR-19/49; FR-48 remains | Filtering closet/switch/floor cannot drop property demand. Shared controller/recorder/retained equipment is not counted repeatedly in multiple lists. Multi-head camera hardware interfaces/power remain distinct from actual transmitted/recorded streams. |
| Atomic shared assignment changes | FR-42 plus new FR; FR-28/44 | Concurrent editors cannot silently claim the same physical port/connection. Preserve pending edits on conflict and validate related changes together. Show affected dependent assignments rather than deleting them or prior evidence. Meaningful changes follow history/retest rules; group/port edits do not themselves prove actual work or testing. |
| Schedules, history and backup | FR-33/34 plus new FR | Closet equipment list and port/connection schedule in relevant Design/Closeout exports: stable device/port/cable references, current/proposed basis, recorded/pending status, power assumptions, reservations and warnings. Preserve through named revisions and backup, with existing fixed-history and optional-approval rules. |

The accepted example is IDF-2 containing Cabinet CAB-01 and Switch SW-02: port 05 planned for Camera CAM-12, cable reference if known; port 06 reserved for a future device whose demand is unknown; SFP-1 explicitly linked as an uplink. A door reader can instead reference a controller terminal while only the controller's actual Ethernet interface consumes its assigned network port.

Manual planning/documentation is the scope. Live discovery/configuration, automatic assignments, full racks/patch graphs, universal hardware limits, non-PoE electrical calculations and detailed traffic simulation remain outside this extension.

## Four consistency risks for integration

1. **Repeated relationship mistaken for another physical port/device.** One asset/interface may appear under a closet, opening, schedule and reservation; references must not duplicate supply, endpoint demand or power. Uplinks legitimately use a physical endpoint at each end; that differs from counting one device twice.
2. **Power bases and unknowns collapsed.** Compare compatible values, keep switch-side allocation separate from device-side or typical observations, and disclose uncertainty. Free allocation does not prove usable condition; known spare count/headroom cannot be complete with unknown inventory/demand.
3. **Assignments mistaken for cable routes or tested installation.** Accept logical cross-floor planning only. Missing geometry/length/connection verification stays missing; passive labels or closet/opening membership do not establish active connectivity. No plan result grants a Pass.
4. **History/dependency loss.** Keep faulty/unavailable-port assignments and previous evidence. Concurrent assignment or port edits need connected validation; filters/exports must retain unresolved warnings and applicable demand. OQ-8 still owns detailed archive/restore edge decisions.

## Existing implementation baseline

The [delivery/reviews digest](delivery-and-reviews.md) and current source snapshot establish aggregate property-wide endpoint/switch counts and PoE checks, not the new explicit port planner. Cameras are normalized network endpoints, IP intercoms default networked, and other devices can be flagged networked. One copper access port is counted per modeled endpoint, including locally powered equipment with zero PoE allocation.

A direct **same-floor Cat6** route assigns an endpoint only when exactly one distinct switch is linked. No candidate or multiple candidates stay visibly unassigned. Each Cat6 switch-to-switch route consumes one port at each end. Fiber/security routes do not establish copper assignment. Aggregate checks compare endpoint/uplink counts with copper/PoE counts and allocated watts with total/per-port limits; there are no numbered physical ports, optical-port assignments, closet records or controller-terminal topology in this baseline.

Four fingerprints—cables.js, capacity.js, materials.js and projectModel.js—match the 2026-11-16 inventory. Relevant digests remain applicable as static evidence. New accepted requirements must not be described as already implemented.

## Cable estimate basis and next proposal — still pending

Accepted FR-9 currently draws same-floor routes with endpoints, waypoints, family and horizontal length plus slack. Current [cables.js](../../../../../site-studio/src/cables.js) sums horizontal geographic segment distances; endpoints follow device positions. It has no vertical rise/service-loop model. Its billable amount is horizontal length multiplied by one plus slack percentage. Current default/clamped slack and material rates are prototype behavior, not newly adopted universal targets.

The current estimate implementation aggregates cable quantities by family, including saved slack. Confirmed FR-17 already requires **installed route length versus selected supply quantity/basis**, no automatic repurchase of retained runs, no assumption that relocating a 10 m run to 12 m purchases only 2 m, slack once, unknown prices as unpriced and fixed historical estimates unchanged. This required separation is broader than the old automatically derived billable quantity.

The pending cable proposal recommends:

- One stable cable ID across its floor segments, with endpoints, applicable port/terminal references, cable family/specification, work category and estimated/measured basis. Retain Cat6/fiber/security families with a custom low-voltage/control description; no invented electrical rating.
- Manually drawn horizontal segments on relevant floors plus a named riser reference; explicitly entered vertical/riser/drop length. Known mounting heights can inform user entries but must not be added automatically a second time.
- Separate horizontal, vertical, extra allowance and slack breakdown; apply slack once to a declared base. Unknown scale or vertical length yields an incomplete estimate, not a precise-looking complete total. Preserve measured length/override and its basis when layout changes.
- One run counted once across floors; separate cables sharing a pathway retain separate supply quantities. No conduit-fill/pathway or automatic 3D routing engineering.
- Compatibility/maximum-length warnings only from supported chosen-specification or user-entered limits, with unknown limits visible. Do not import a universal maximum for all cable families.
- Existing scoped purchasing and meaningful-change/retest versus record-correction rules. Endpoint/archive replacement edges remain OQ-8.

Logical network assignment and physical cable record remain distinct throughout. The next recommendation can refine this proposal, but the latest closet/port acceptance does not yet approve these physical inter-floor/vertical features or their detailed arithmetic.

Only this source extraction was written; no main documents, application files, tests, broad review or finalization were performed.

## Focused reconciliation — PRD draft 0.12 (2026-11-17)

No actionable discrepancies found in this narrow accepted-scope check.

FR-51 preserves stable closet/group/port/assignment identity, separate containment versus served-device relationships, and no implicit asset duplication, movement, purchase or load. Allocation and condition remain independent; faulty-port connections stay recorded and unknown/shared-connector inventory does not yield an exact spare count. Current/proposed assignments, specific-device reservations counted once, unknown unnamed reserve demand and property-wide demand under filtering are represented.

FR-19/51 retain compatible source-based per-port and total PoE checks, distinguish planning/allocation/observed values, preserve unknowns rather than zeros, and keep physical hardware demand separate from camera views/streams. FR-49/51 separate Ethernet interfaces from controller terminals/local power and passive labels; logical group/opening/patch relationships do not prove connectivity.

FR-9/51 accept planned cross-floor assignments without fabricated physical routes, lengths, installed work or test results. The updated addendum, source index, conversation context and OQ-7 consistently leave physical floor segments, risers, vertical/drop lengths and expanded allowance arithmetic pending. The cable proposal explicitly states FR-9 is not expanded to physical cross-floor routing until confirmation.

FR-42/51 cover shared conflicts and related assignments, preserving pending edits, affected dependencies and prior evidence. FR-33/34/51 carry schedules, basis, references, reservations/warnings and identities through relevant exports, revisions and backups. OQ-8/9 remain open. No new approval gate or field-test Pass is inferred from planning.

Only this reconciliation was appended. No main documents, application files, tests, delegation or broad finalization review were changed/performed.
