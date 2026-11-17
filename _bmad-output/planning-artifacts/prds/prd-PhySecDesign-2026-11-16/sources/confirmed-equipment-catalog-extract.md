# Confirmed additional equipment and linked openings — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.9. This is a narrow decision extraction, not finalization or an implementation/test claim. Only this source document was written.

## Authority and acceptance boundary

The latest user confirmation accepts the additional equipment/catalog group and linked door/gate components and asks for the site-annotation recommendation next. It supersedes the pending status of that first group in the draft-0.9 [PRD](../prd.md), [addendum](../addendum.md), [canonical log](../.memlog.md) and [conversation context](conversation-context.md) inspected for this extraction. The older pending labels describe the preceding state.

Accepted: doors, gates, access controllers/control panels, locks/strikes, request-to-exit (REX) devices, low-voltage power supplies, recorder/NVR records and custom equipment, with individually identified linked components. Existing catalog families and confirmed camera-model/multi-view decisions remain in scope.

Acceptance does **not** establish a dedicated reusable noncamera template library, arrangement-instantiation automation, manufacturer catalog integration or live pricing. Existing editable model metadata and common/type-specific/generic checklists apply. Noncamera reuse mechanics remain downstream refinement; this does not reopen the accepted equipment group. The earlier addendum's reusable-project-template suggestion must not be promoted wholesale by this narrower confirmation.

The three remaining OQ-7 groups are still pending: site annotations; named closets and explicit switch-port/controller-terminal connections; inter-floor routes and vertical/drop allowances. OQ-8 archive/restore/cable-endpoint edge cases and OQ-9 acceptance/limits remain separate open questions.

## Confirmed capability mapping

| Accepted capability | Draft-0.9 requirement impact | Required interpretation |
| --- | --- | --- |
| Extra equipment families and custom fallback | Expand FR-7 and its check; FR-8 schedules inherit the new records | Stable internal ID, type, optional manufacturer/model, floor/location/mounting, notes and relevant entered planning values. Preserve unknowns; model entry is not proof of compatibility. |
| Distinguish an opening from its contact | FR-7 identity and a new opening/component relationship FR, appended after FR-48 | A door or gate names a physical opening. Existing magnetic door-contact records remain contacts with their existing identity/history; no silent migration into an opening. |
| Link selected components to a door/gate | New relationship FR (candidate FR-49) | Optional reader, contact, lock/strike, REX, intercom, controller and other equipment associations, with side/direction labels where useful. Each component retains its own ID, location, supply cost, connection records, installation/configuration/check records and lifecycle history. |
| Associate shared infrastructure | New relationship FR; FR-19 and FR-40 implications | Several openings can reference the same controller asset. A new opening link does not clone that controller, purchase it again or manufacture another installed instance. Associations and actual physical cables/ports remain distinct. |
| Estimate openings and component work | FR-17, with FR-18/45 existing scope rules | A separately supplied door/gate can have an explicit price. Itemized component supply must not also appear inside a charged bundle for the same supply. Existing/retained components are not automatic repurchases, and unknown price remains unpriced. |
| Preserve hardware demand semantics | FR-19; new relationship FR | An opening or association consumes no automatic IP/PoE port or power. Actual component/interface traits govern applicable demand; a controller-connected contact/reader/lock is not automatically its own network endpoint. Do not infer live connectivity from logical association. Numbered port/terminal editors and broader topology remain pending. |
| Apply honest independent checks | FR-29–31, FR-43/44 where existing rules apply | Use applicable device-type/common checks or generic fallback, project-defined expectations and independent component phase records. An opening association cannot mark components installed/configured/tested or propagate Pass. Gate operation/safety sequences can be project-defined observed checks, not a simulation or compliance engine. Exactly four test outcomes remain. |
| Plan opening/component work independently | FR-40 plus FR-28/35/36/44/45 | Relocation, service, replacement and removal remain plans until actual work is recorded. Adding/relinking an opening association does not itself move, replace, archive or complete linked equipment. Preserve stable relationships and historical context under existing history/retest rules; do not settle OQ-8 endpoint/archive edge cases here. |
| Preserve identity in delivery/history | Existing FR-22/33/34 applies; include the relationship in new FR | Revisions, schedules, exports and backups distinguish opening identity from component identity and retain applicable relationships/context. No new export preset or approval gate is implied. |

A compact new FR can state relationship behavior and check: two openings share one controller; each has separately identified selected components; adding/removing a logical link does not duplicate assets/costs or create cable/port/work/test completion. Avoid prescribing storage schema or an automatic opening assembly builder.

## Source baseline and consistency risks

The static [design/coverage digest](design-and-coverage.md) records nine fixed generic choices across eight types. Current [catalog.js](../../../../../site-studio/src/catalog.js) explicitly uses type key “door” for **Door contact**, with catalog ID “door-contact” and model Generic magnetic contact. The new opening concept needs a distinct semantic identity; renaming the existing type without preserving its meaning would corrupt historical records. New catalog families/relationships are requirements, not currently implemented capabilities.

Four consistency risks for the main draft:

1. **Opening/contact identity collision.** Preserve existing contact semantics and IDs when adding actual doors/gates. An opening's relationship is not a replacement for component identity, mounting or evidence.
2. **Shared/bundled double counting.** One controller may serve multiple openings. References must not clone it or repeat supply/demand/history; separately priced opening assets and itemized component costs must not duplicate the same bundle supply.
3. **Association mistaken for engineering or completion.** Links do not create cable runs, switch ports, terminal assignments, power, installation records or Pass outcomes. Keep actual equipment traits, independent checks and observed results; ports/closets and detailed cable planning remain pending.
4. **Acceptance spillover.** Resolve the equipment/opening part of OQ-7 only. Keep annotation, closet/port and vertical-route proposals pending, and do not quietly add a noncamera template library or automatic arrangement instantiation.

## Site-annotation baseline for the next recommendation — not accepted scope

| Existing primitive | What it already represents | Boundary for the next discussion |
| --- | --- | --- |
| Floor-owned geographic plan objects | Each floor owns drawing/alignment, devices, routes, barriers, zones, notes and analysis polygon; objects are geographically anchored | No current building-footprint/elevation/stacked-3D model. A general annotation system is not implied by the existing drawing overlay. |
| Wall polylines and solid-obstruction polygons, FR-11 | Named editable geometry, height and explicit blocks-views/enabled behavior; contributes to supported optical analysis | A fence/perimeter annotation must not automatically become an opaque wall. Use a separately explicit supported obstruction for intended modeled occlusion; no transparent-fence or terrain solver is established. |
| Named security-zone polygons, FR-15 | Entrance/restricted/parking/perimeter/other areas, optional DORI/area target, full polygon denominator | An entrance-zone type is not an entrance marker. A perimeter area is not a fence line. An annotation invents no coverage requirement, denominator change or achieved target. |
| Survey notes/measurements/photos, FR-20 | Floor-location point or same-floor device anchor; title, notes, labeled numeric measurements and photos; device notes follow position | Existing map pins capture observations. Clarify how visual labels/lines relate to these records without automatically creating equipment or duplicating evidence. |
| Map ruler, imported plan and delivery | Geographic measurement; drawing overlay with alignment/opacity/lock; plan/report includes existing equipment, paths, barriers, zones and survey references | Useful context, not arbitrary CAD editing. A future annotation proposal should explicitly cover display/legend/export persistence if adopted, without claiming current implementation. |

The pending addendum recommendation is limited to named fence/perimeter lines and entrance markers with notes, distinct from powered equipment and required-coverage zones, with no automatic occlusion/purchases/electrical demand and with plan/legend inclusion. It is input to the next guided decision, **not** accepted by the equipment confirmation. Detailed geometry controls, symbols, associations and export behavior can be recommended explicitly; do not infer arbitrary CAD shapes, land-parcel surveying, routing, automatic access-control sequences or certification.

The [delivery/reviews digest](delivery-and-reviews.md) establishes the survey baseline and its current browser photo previews, not an archival-original evidence service. Current source limits and historical authored tests remain implementation evidence, not new POC acceptance targets.

## Evidence freshness

Read the current source index and canonical log before extraction. Compared inventory SHA-256 values for catalog.js, MapCanvas.jsx, BarrierInspector.jsx, securityZones.js, survey.js and projectModel.js against current files: all six match the 2026-11-16 snapshot. Relevant digests remain applicable as static evidence. Opened current catalog.js directly to verify the door-contact key. No tests, application edits, broad review or PRD finalization were performed.

## Focused reconciliation — PRD draft 0.10 (2026-11-17)

Checked FR-7/17/19/29/40/49, the OQ-7 boundary, addendum, source index and latest conversation context against this extract. The accepted equipment behavior is represented: existing contacts stay distinct from openings; components retain separate identity/costs/planned and actual work/evidence; shared controllers or supplies are not cloned or counted per link; links infer no cables, ports, demand, installation or Pass; retained supply and meaningful-change/history/retest rules apply. Added types use common/generic starters where a dedicated starter is absent. Noncamera library/automation is not a hard requirement. No missing functional behavior was found in this narrow check.

One actionable documentation ambiguity: under addendum heading **Confirmed equipment families and opening relationships**, the final paragraph starts “Add fence/perimeter lines and entrance markers…” without an inline pending label. The section introduction, remaining-decision table and separate **Site annotations — recommendation awaiting confirmation** section correctly keep annotation scope pending, but the paragraph's placement beneath a confirmed heading can imply acceptance when read alone. Move that paragraph into the pending annotation section or prefix it explicitly **Pending site-annotation proposal**. No FR change is required.

Closet/port and cable proposals, OQ-8 and OQ-9 remain pending. The canonical log read for this check still ended at the earlier draft-0.9 event; its latest equipment decision/event can be appended by the main-document author as part of the current turn. That is a concurrent bookkeeping observation, not a product-scope contradiction. Only this reconciliation was appended; no main documents, application files or tests were changed.
