# Confirmed inter-floor routing and allowances — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.12. This narrow extract records the accepted routing proposal and separates the next archive/replacement/restore questions. It is not finalization or a claim of implementation or fresh test results.

## Decision authority and OQ-7 disposition

The latest user confirmation accepts the routing/allowance model and asks how cable connections should behave when devices are archived, replaced or restored. This supersedes the pending routing labels in the inspected [PRD](../prd.md), [addendum](../addendum.md), [canonical log](../.memlog.md), [source index](../source-index.md) and [conversation context](conversation-context.md).

The accepted recommendation is the addendum's complete **Proposed inter-floor routes and vertical/drop allowances** section: identified runs with ordered per-floor segments/riser references, explicit length components and calculation basis, distinct supply/measured values, warnings, history and exports. This was the final remaining OQ-7 group; **OQ-7 can now be marked resolved** while preserving the recorded deferrals. The latest acceptance does not resolve OQ-8 archive/restore/deletion edges or OQ-9 acceptance/limits. The next cable-lifecycle proposal must remain pending until confirmed.

## Accepted capability mapping

| Behavior | Requirement impact | Scope and acceptance detail |
| --- | --- | --- |
| One physical cable run across plans | Expand FR-9; new routing FR appended after FR-51 (candidate FR-52) | Stable cable ID, family/specification, from/to terminations and device/port/controller-terminal references. Keep network assignment separate from physical route; passive labels do not invent active connectivity or a complete patch graph. Retain Cat6/fiber/security with custom description where needed. |
| Ordered floor segments and risers | New FR; FR-9 | Draw horizontal pieces on their own floors with named riser/continuation identity and from/to-floor references. Each sheet shows its segment and continuation label. Calculate using each floor's known scale; do not draw a fictitious diagonal between unrelated floor coordinates or assume plans align. |
| Shared riser, separate runs | New FR; FR-17/33 | Each run is counted once across floor sheets. Several cables may reference the same riser, but each has its own physical length/supply quantity. No full pathway-capacity, automatic 3D route or fiber-core/breakout engineering. |
| Explicit transitions and endpoint drops | New FR | Enter transition route length/from-to floors/units/source; use a full span or its component spans once, never both. Endpoint rise/drop covers the non-overlapping path from routing elevation to actual termination. Mounting height is useful only with known routing elevation; neither floor numbers nor mounting height automatically invent a route distance. |
| Transparent allowance arithmetic | New FR; FR-17 | Route subtotal R = horizontal segments + inter-floor transitions + endpoint rises/drops. Suggested supply Q = R + fixed service loops/extra length + (selected percentage × R). Apply the percentage once to R, excluding separately entered fixed loops; no compounded floor/run/project slack. No universal percentage/default is established. |
| Known, unknown and measured basis | New FR; FR-17/20 | Show source/units and estimated/measured basis; missing values stay unknown and explicit zero means no extra component. Show known subtotal but flag incomplete scale/components. Preserve manually measured length/overrides and flag relevant geometry changes for review rather than silently overwriting. |
| Supply versus installed length | FR-17; new FR | Selected purchasing quantity/basis remains separate from calculated suggestion and installed route length. Retained cable is not repurchased automatically; relocation is not an automatic length-difference purchase. Ordering/reel rounding remains separate. |
| Patch/equipment leads | FR-17/18; new FR | Separately purchased leads are explicit cable/accessory entries/references. Do not include the same portion in fixed-run allowance and another purchase quantity. No assumption that a fixed run equals a complete tested channel. |
| Recorded installed measurement and migration | New FR; FR-34 | Store measured installed length and source/context separately; do not add design slack to an already measured total or overwrite prior design estimate. Legacy horizontal-only data keeps that basis until reviewed; migration invents no verified vertical/drop values or complete-estimate status. |
| Shared edits, current/proposed and retests | FR-42 plus FR-21/22/28/44; new FR | Preserve cable/segment/riser references through shared edits, undo, revisions and backups. Validate changed shared references/dependencies together. Physical path/termination changes can require scoped retest; record corrections follow the existing distinct rule. Drawing/estimating/measuring is not installation or a Pass. |
| Warnings and schedules | FR-33/34; new FR | Show missing segments/landings, unknown scale/length, endpoint-assignment mismatch and supported type/length-limit warnings. A limit must match the stated basis, such as fixed run versus complete channel. Export continuation labels plus property-wide run/endpoints/ports/floors/riser/component lengths/loops/percentage base/suggested and selected supply/measured value. Aggregate each run once by family/work scope; preserve uncertainty and partial-floor context. |

The accepted arithmetic example is illustrative only: 20 m + 12 m horizontal, 6 m transition and 2 m drops give R = 40 m; 2 m fixed loops plus a selected 10% of R give Q = 46 m. It sets neither a default height nor 10% slack nor an installation standard.

## Routing integration risks

1. **Duplicate distance or purchase.** Avoid counting a complete riser span plus its subspans, full mounting height plus entered endpoint drop, loops twice, compounded percentages, patch leads twice, or a single cable once per floor. Shared riser identity is not a shared single cable quantity.
2. **False precision/completion.** Unknown scale or omitted required components must not become zero or a complete total. Preserve explicit measured/estimated/source basis and horizontal-only migration limits.
3. **Mixed quantities and limit bases.** Keep R, Q, selected supply and observed installed measurement distinct. Retain overrides; compare specified limits only with matching fixed-run/channel basis.
4. **History and endpoint assumptions.** Accepted routing preserves references/history but does not settle archive/replacement behavior. A route or assignment must not silently become installed, tested or reconnected from geometry alone.

## Next discussion: already confirmed device lifecycle constraints

| Existing requirement | Settled rule relevant to cable endpoints |
| --- | --- |
| FR-35 Removed-device archive | Archive only after actual removal is documented, never merely because Remove/Replace is planned. Preserve captured ID/model/settings, last location, **connections**, phase/test/retest records, notes/photos and history; record removal actor/date, optional reason and replacement link. Exclude removed equipment from normal active plan/schedule, coverage, equipment totals and capacity/PoE demand; fixed historical values remain. |
| FR-36 Restore or replace | Restore the same physical device with the same ID/history and recorded restoration. A different physical replacement receives a new linked ID. Do not overwrite an active replacement or automatically make old tests current. Cable/floor/deletion details remain OQ-8. |
| FR-37 Project archive | Pause editing; preserve view/search/export, all archives/revisions/closeouts/evidence/outstanding items. Reading/exporting does not modify records. |
| FR-38 Later work | Reopen the same property into a new named work scope and working revision with In progress; preserve IDs/prior closeouts, fresh scoped estimates/checks, outstanding issues. Reopening does not restore removed equipment, resolve faults or inherit passes/approvals. |
| FR-40/41 Existing-site work | Planned actions/current installation/proposed design remain distinct. Plan a replacement with a new ID linked to its predecessor; preserve current installation until actual work is recorded. |
| FR-49/51 Relationships and port state | Editing a logical relationship does not erase/archive its component or evidence. Preserve assignments and dependencies for resolution. Port free/reserved/assigned allocation differs from usable/unavailable/unknown condition; a faulty connection stays recorded. Logical membership/passive labels do not establish connectivity. |
| FR-19/42/44 Capacity, concurrency and retest | Applicable active demand stays visible even when unassigned; current/proposed bases differ. Connected changes must be consistent under concurrent edits; prior evidence stays historical and changed-condition checks follow existing retest rules. |

These settle preservation and truthful status, but do not yet define what happens to an individual cable's free end, its still-plugged switch end, current assignment, reservation, retirement or later reuse.

## OQ-8 edges and constraints for a pending recommendation

The current OQ-8 explicitly covers current routes/endpoints after device archive/replacement, restoration to changed/deleted floors, and deleting accidental draft placements. The next recommendation can address:

- **Preserve physical cable identity/history.** Removing an endpoint device need not mean its physical cable was removed. Record cable/endpoint disposition explicitly rather than deleting the cable or rewriting prior endpoint history. Define retained/disconnected/removed/reused behavior without inventing new test outcomes.
- **No ghost device demand or silently free port.** An actually removed device no longer contributes active device/PoE demand under FR-35. That does not prove the cable's other end is unplugged or the port usable/free. Preserve known physical occupancy, reservation or unresolved condition separately; do not retain fictional load merely to keep the port occupied. If a switch is removed, surviving downstream devices must not disappear from property demand simply because their assignment is now unresolved.
- **Replacement uses a new device ID.** Reusing a physical cable or switch port should require an explicit, history-preserving current/proposed assignment change, with compatibility/conflict and scoped retest treatment. Do not transfer old identity, installed evidence or Pass to a new physical replacement.
- **Restore is not automatic reconnection.** Proposed safeguard: retain historical connection references but revalidate destination floor, cable/port availability, active replacements and current context before explicitly reconnecting. Do not steal a reassigned port, resurrect an already removed cable or turn old tests into current evidence. This detailed restore behavior is still a recommendation, not newly accepted by routing approval.
- **Changed/deleted floors and accidental drafts.** Decide how restored location/segments are selected if original floor/context is absent, and when unused draft placements may be deleted rather than historically archived. Do not automatically recreate a deleted floor or remove shared segments/risers/evidence as a side effect. Exact safeguards remain OQ-8.

A useful pending example is an old camera removed while its fixed cable remains on switch port 05, then a new camera receives a distinct ID and explicitly reuses that cable; later restoring the old camera cannot steal the new assignment. Cable record, port condition, device demand and historical tests should remain independently understandable throughout.

## Current code behavior and implementation gap

Current [App.jsx](../../../../../site-studio/src/App.jsx:213) removeDevice removes the device **and every connected route from the current floor** (lines 217–218). It preserves device-anchored survey content at the last location via [survey.js](../../../../../site-studio/src/survey.js:20). This is prototype delete behavior, not the confirmed lifecycle archive model and not authority to erase future cable history.

Current [projectModel.js](../../../../../site-studio/src/projectModel.js:143) normalizeRoute requires two distinct devices on the same floor and rejects orphan/cross-floor endpoints. [cables.js](../../../../../site-studio/src/cables.js:15) resolves route endpoints from current device positions; absent endpoints produce no path. The existing capacity model infers same-floor direct Cat6 assignments and has no explicit physical port occupancy/history. These structures will need deliberate evolution for archived endpoints, persistent runs and explicit restored/replaced assignments.

Fingerprints for App.jsx, projectModel.js, survey.js, cables.js and capacity.js match the 2026-11-16 inventory. These are current static source findings, not rerun runtime evidence. Only this extract was written; no main documents, application files, tests, delegation or broad finalization review were performed.

## Focused reconciliation — PRD draft 0.13 (2026-11-17)

Accepted routing is represented in FR-9/17/33/42/52 and the confirmed addendum block: one run across ordered scaled floor segments and named risers; non-overlapping transition/drop lengths; explicit unknowns/legacy horizontal basis; R and Q formula with fixed extras outside the percentage base; distinct selected supply and measured installed values; no duplicated patch leads or per-floor quantities; compatible limit bases; shared dependencies/history and export continuation/breakdown/partial context. No missing behavior was found within those clauses.

One actionable stale-status sentence found during the OQ check: **FR-7** still ended “physical inter-floor cable detail remains OQ-7.” Replace that clause with a reference to the confirmed routing in FR-9/52. It conflicts with the correct resolved-OQ-7 entry and the new routing requirements, although it does not change their substance. Reported to the main-document author for correction; this extract does not edit the PRD.

OQ-7 is otherwise explicitly resolved, with only OQ-8 and OQ-9 in the open-question table. The addendum heading **Proposed cable connection lifecycle — awaiting confirmation under OQ-8** and its introduction clearly state the new removal/reuse/restoration details are pending and do not add accepted requirements. Changed/deleted-floor destinations and accidental draft deletion remain distinct OQ-8 choices. No inadvertent acceptance of the new lifecycle proposal was found.

Only this reconciliation was appended. No broad review, application changes, tests or main-document edits were performed.

## Disposition of focused finding

The main editor corrected the stale FR-7 clause to refer to FR-52 after the focused review. Mechanical verification confirmed 52 consecutive requirements/checks, only OQ-8/9 still open, valid local links and unchanged relevant application fingerprints.
