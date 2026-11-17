# Confirmed site annotations — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.10. Narrow extraction of the latest accepted site-annotation proposal and the remaining closet/port discussion baseline. This is not finalization or an implementation claim.

## Decision authority and scope

The latest user confirmation accepts the site-annotation recommendation and asks for network closets/port assignments next. It supersedes the pending labels in the inspected draft-0.10 [PRD](../prd.md), [addendum](../addendum.md), [source index](../source-index.md), [canonical log](../.memlog.md) and [conversation context](conversation-context.md). Those files recorded the proposal before this confirmation.

Accepted markup: named lines/polylines; entrance markers and direction arrows; named areas using existing security-zone polygons with optional DORI targets; short text/callouts, optional leaders and simple two-point dimensions. Include floor/site-plan ownership, stable identity, basic editing/style/locking/visibility, existing save/conflict/undo/history behavior, survey-evidence references and plan exports/backups. Do not promote the separate closet/port or expanded cable proposals by this confirmation. OQ-8 archive/dependency edge cases and OQ-9 acceptance/limits remain open.

## Mapping to requirements

| Accepted behavior | Existing/new requirement | Scope and acceptance implication |
| --- | --- | --- |
| Named lines/polylines, entrance markers/arrows, text/callouts and simple dimensions | New annotation FR, appended after FR-49 (candidate FR-50) | Each belongs to its selected plan/floor, including an outdoor site plan, with stable ID, name/type, position/points and note/reference. Support select/move, point/text edits, simple colour/line style, locking, deletion and annotation-layer visibility. Labels remain understandable without colour alone. |
| Named parking/loading/restricted/other areas | FR-15 plus reference from new FR | Reuse existing zone polygons rather than creating a second competing coverage-zone model. DORI target stays optional. A descriptive name or annotation layer never assigns a target, modifies the full zone denominator or claims target achievement. |
| Simple dimensions | New FR; FR-20 distinction | Calculated length uses a known map/plan scale, displays units and is labeled a plan-derived estimate. Unknown/unverified scale is identified, with no invented precise physical measurement. A technician's field measurement stays an independently recorded observation with its note/source. A straight-line dimension is neither routed cable length nor cable supply quantity. |
| Linked notes/device/opening records | FR-20 and new FR; FR-49 identity rules remain | Reuse survey notes/photos instead of a second attachment store. A callout/entrance mark may reference an existing note, device or opening for lookup without creating another asset or moving that asset. Removing markup preserves its underlying record, issue and evidence. Preserve stable references and fixed prior revisions; OQ-8 continues to own detailed archive/restore dependency behavior. |
| Separate descriptive markup from analysis | New FR cross-references FR-9/11/15/19 | Fence/perimeter marks do not automatically obstruct camera views. Use an explicit supported wall/obstruction for intended occlusion, an explicitly configured zone for coverage targets and actual cable-route records for cable calculations. Markup automatically changes none of the analysis boundary, coverage percentage, equipment quantity, cable cost or power demand. |
| Concurrent edits and reversibility | FR-42 plus FR-21/22 | Extend existing item-level conflict checks, pending-input preservation, autosave/undo and named-revision behavior to annotation edits. No separate collaboration/permission model is implied. A hide operation remains presentation-only and does not delete linked records or change analysis. |
| Packages and editable backup | FR-33 and FR-34 plus new FR | Include annotations by default on selected floor-plan sheets with labels/styles and concise legend. Optional visibility/omission choices must be identified under existing export-manifest rules. Relevant property-wide outstanding issues survive hidden callouts/floors. Preserve geometry/references in named revisions and editable backup. Markup does not become equipment schedule rows. |

A useful acceptance example is the accepted proposal's fence line “North perimeter,” Vehicle entrance linked to Gate G-01, loading area using an existing untargeted zone, and callout linked to a mounting-surface survey photo. Show a scaled plan-estimate dimension; verify the mark alone changes no occlusion/cable calculation or equipment demand. Removing/hiding the callout leaves the photo, linked records and outstanding issues intact, including in appropriate closeout summaries.

Arrows describe intended movement/reference only: no route calculation or certification of evacuation/access-control sequences. This decision adds neither a specialist symbol library nor a CAD dimensioning/constraint system. Actual defects/physical changes continue through existing issue and field-change/retest workflows; markup edits do not serve as evidence that work happened or passed.

## Consistency risks

1. **Calculated versus observed measurement.** Keep units, scale confidence and plan-estimate labeling together; do not substitute calculated spans for field observations or cable/supply quantities. Existing map geometry is not proof that an imported plan is correctly scaled.
2. **Markup versus analytical objects.** Preserve the zone/barrier/cable distinctions even when drawings look similar. A fence line or entrance marker must not silently change occlusion, a DORI target/denominator, counts or costs. Hiding a linked area/marker must not disable the underlying analytical object.
3. **References and exports.** Deleting markup must not delete linked evidence; hiding a callout or floor cannot hide an unresolved property issue from required closeout summaries. Export omissions and fixed source/edition rules still apply.
4. **Acceptance spillover.** Resolve only annotation scope within OQ-7. Closets/ports and expanded cable routing remain pending; no full CAD, routing/sequence simulation, second evidence store or new permission model is established.

## Existing implementation evidence

The [design/coverage digest](design-and-coverage.md) identifies geographically anchored floor-specific walls/obstructions, named zone polygons with optional targets, plan drawing alignment and a map ruler. The [delivery/reviews digest](delivery-and-reviews.md) identifies floor-point/device-anchored survey notes, measurements/photos, and existing report plans. These are useful primitives, not an already implemented generic annotation layer.

Current source fingerprints for MapCanvas.jsx, securityZones.js, survey.js, projectModel.js, capacity.js and cables.js all match the 2026-11-16 inventory. Existing digest evidence therefore remains applicable; no runtime verification was performed. Current prototype limits/defaults are not newly accepted numerical POC requirements.

## Next discussion: closet/port proposal — still pending

The existing addendum proposes:

- Named network/security closets with building/floor/location and associated cabinets, switches, controllers and supplies. A closet is a location/container rather than a switch, an automatic load or a rack-layout model. Rack-unit engineering and automatic patch-panel topology are deferred.
- Explicit switch port identities/types, user/model-supplied PoE capabilities and known per-port/total budgets, with uplink/reserved designations and assigned/reserved/free/unassigned demand. Warn about duplicate use, incompatible media/types and exceeded known budgets; unknown limits stay unassessed. Copper/fiber uplinks use applicable physical ports and fiber supplies no PoE.
- Distinct network-interface, controller-I/O/terminal, external-power and passive-object associations. Logical opening links do not invent ports or power. A controller-connected reader/contact/lock is not automatically an IP/PoE endpoint; an actual IP reader can be modeled by its entered traits. Non-PoE supply loading remains a manual recorded value/note, not an electrical engineering engine.
- Explicit supported inter-floor network assignments and copper/fiber uplinks, retaining ambiguous/unassigned demand. Physical cable route, logical component association and network assignment stay distinct. Use the selected Current installation/Proposed design basis with applicable retained demand and no accidental replacement duplication. This is planning, not live discovery/configuration/performance verification.

These are recommendation inputs, not confirmed requirements. Numbered ports/controller terminals and inter-floor connectivity require explicit next approval. Detailed physical cable segmentation, risers and vertical/drop/slack allowances remain the later cable group.

## Current capacity/connection baseline for that discussion

The present implementation aggregates property-wide camera/storage/bandwidth and endpoint/switch demand with floor/building labels. Every modeled network endpoint consumes one copper access port, including a locally powered endpoint with zero PoE allocation. Cameras normalize as networked and IP intercoms default that way; other types can be enabled as networked.

Assignment currently requires a direct **same-floor Cat6** route to exactly one distinct switch. Zero or multiple switch candidates remain explicitly unassigned. A switch-to-switch Cat6 route consumes one port at each end; fiber/security routes do not establish copper access assignment. Switch checks use aggregate copper/PoE counts, total watts and per-port ceiling; they do not model numbered physical ports, optical-port occupancy or controller-terminal topology. Unassigned demand remains in property totals and within-limit labels describe assigned load only.

Current cable records connect distinct same-floor devices through manually placed waypoints and compute horizontal geographic distance plus configured slack. They do not establish closets, risers, physical vertical length or verified connectivity. Accepted FR-19/48 already require body/interface power to remain separate from actual transmitted/recorded stream demand; the current camera-per-device implementation is an earlier baseline, not evidence that the multi-view requirement is built.

Storage/bandwidth and PoE are planning estimates, not a recorder compatibility/throughput, network performance, RAID or certified electrical model. Adding a closet/port planner should preserve these evidence boundaries and the existing unknown/unassigned-demand rules rather than converting incomplete topology into a pass.

## Focused reconciliation — PRD draft 0.11 (2026-11-17)

No actionable discrepancies found in the narrow annotation-scope check.

FR-50 captures the accepted tools, floor/site-plan ownership, stable identities, basic edits/style/lock/visibility, and shared save/conflict/undo/revision behavior. Calculated dimensions require known scale, units and an explicit plan-estimate label; unknown/unverified scale is disclosed, and field measurements remain distinct survey observations. Existing zones retain optional DORI targets; explicit barrier/zone/cable records retain their separate analytical roles. Markup creates no automatic occlusion, coverage changes, equipment demand, route length or supply quantity.

FR-20/50 reuse existing survey evidence and preserve linked device/opening/note records, issues and evidence when markup is hidden/deleted. FR-33/34/50 provide default annotation inclusion on selected plan sheets, readable labels/legends, explicit optional omissions, retained outstanding-issue summaries and preserved geometry/references in fixed revisions/editable backups. FR-42 explicitly includes annotations in same-item conflict protection.

The confirmed addendum section, source index and latest conversation context agree with these requirements. Remaining OQ-7 choices are closets/ports/connections and expanded physical cable routing/vertical allowances; the expanded port proposal is explicitly awaiting confirmation. Proposed logical cross-floor assignments do not accept physical inter-floor routes or fabricate cable lengths, installation or verified connectivity. FR-9 remains the accepted same-floor route baseline. OQ-8/9 remain open.

Only this reconciliation was appended. No main documents, application files, tests or broad finalization review were changed/performed.
