# Confirmed export-package decision extract

Recorded 2026-11-17 for guided PRD refinement. Sources: the OQ-6 recommendation preserved in the [addendum](../addendum.md), [canonical memory](../.memlog.md), [PRD draft 0.6](../prd.md), and the latest user acceptance supplied for this task. The equipment/cable baseline below uses [design and coverage](design-and-coverage.md) plus read-only inspection of catalog.js, cables.js and capacity.js.

**Decision status:** OQ-6 is accepted. Its preceding pending labels are superseded at the product-behavior level. The user requests equipment/catalog and cable-planning recommendations next; OQ-7 has not been accepted. OQ-7–OQ-9 remain open. Keep draft status and stable requirement IDs. No main documents/application files were edited and no tests were run for this extraction.

## Accepted package structure and defaults

Provide **Design** and **Closeout** PDF presets within one export flow, with editable project backup and materials/estimate CSV as separate downloads.

| Section | Design | Closeout |
| --- | --- | --- |
| Identity and contents | Property/address, scope, named revision, Draft/Issued status, issue/export dates, units, floors/sections and recorded approval/bypass status. | Same identity plus fixed closeout reference and Completed/Closed with outstanding items. A pre-closeout preview is Draft/In progress. |
| Plans | Proposed end state with IDs, routes, retained context, planned actions, floor legend and installation notes. | Recorded actual installation, incomplete work, departures from issued design, removed/replacement references and unresolved issues. Uninstalled proposals cannot be drawn as installed. |
| Coverage/zones | Separate optional coverage/DORI sheets, target/achieved values, shortfalls, basis and assumptions. | Current-installation analysis with the same planning-estimate disclosure alongside actual field evidence. |
| Schedules | Equipment IDs/model/location/mounting, planned action/work category, known cable endpoints, route length and relevant supply quantity. | Actual records/settings, known serial/legacy labels/endpoints and status; distinguish measured/estimated values and preserve unknowns. |
| Quantity/capacity | Quantities plus storage/bandwidth/port/PoE summary included by default, with assumptions and unknown/unassigned demand. | Recorded-configuration estimates with the same disclosures; not proof of observed system performance. |
| Field evidence | Survey notes/measurements/constraints/photos and scoped checklist expectations for handoff. | Installation/configuration/testing summary plus detailed expected/observed outcomes, conditions, actor/time, relevant corrections/retests and supporting notes/photos. |
| Outstanding work/decisions | Open design issues, known/deferred property faults and version-specific review decisions. | All unresolved property issues, closeout note, optional owner/due date and approval/bypass/acceptance history as of that edition. |

- Keep Pass, Fail, Not tested and Not applicable distinct, alongside separate Needs review/Retest required follow-ups. Installed, modeled coverage/capacity or approval never implies Pass.
- The closeout evidence appendix contains current-scope attempts and relevant earlier evidence for carried issues, with stable device/check/attempt references. Complete lifetime history stays in the editable archive; every old revision need not fill the current PDF.
- **Prices and labor costs are optional and off by default.** Quantities remain present without prices; add the scope-specific estimate/CSV only when selected. Hiding costs is a report choice, not access control or deletion of stored estimates.
- Capacity remains property-wide for the selected current/proposed basis, including retained demand. Any selected-floor capacity subset must be explicitly labeled.

## Accepted readability and omission rules

- Start with Letter/A4 landscape output. Use a clean equipment/routes plan per floor and separate optional coverage sheets.
- Retain page numbers, revision/floor/units, legends and readable scale information where supported. Fit-to-page is not a guarantee of a fixed print scale.
- Continue long tables/notes over pages with repeated headings; do not silently truncate evidence or rows.
- Include relevant attached photos by default. Allow optional photos to be omitted for a compact package. Start with two photos per page, preserving aspect ratio and captions linked to device/note IDs, floor and recorded date when available.
- If required photo evidence is excluded, mark the export **evidence-limited summary**, identify the omission and do not call it a complete evidence package. Required unavailable files produce a visible report/failure rather than blank substitutes.
- Missing attributes remain Unknown/Not recorded. Stored resized previews do not become original-resolution photographs through export.
- Default to **all floors**. Selected-floor output is **Partial** and lists included floors; keep property-wide closeout outcome and outstanding issues visible. The main complete closeout package covers all floors.
- Export existing plan imagery/geometry. Live basemap/satellite tiles are not embedded by default; disclose missing background, preserve applicable attribution and leave provider-enabled map export as separate future scope.

## Accepted fixed-package and backup behavior

- Generate from a consistent saved named revision or fixed closeout, first resolving the initiating editor's relevant pending/conflicting work. A draft preview can use an identified saved snapshot without issuing, approving or closing the project.
- **Retain the exact issued-design and closeout PDF files**, not merely data from which a similar report might later be rebuilt.
- Retain a manifest identifying source snapshot, work scope, package edition, export time, included floors/sections and known omissions. Preserve packages after project archival and include them in backup/recovery; numerical storage/size/recovery targets remain OQ-9.
- Historical redownload returns the retained file. Regeneration or later approval information creates a new dated edition tied to the same fixed source and a stated decision-history cutoff; it never overwrites the previous PDF or pretends later edits existed then.
- Later actual-record corrections use normal new revision/closeout history. Review links stay associated with fixed records; a static PDF does not change when a reviewer later decides.
- Separate editable backup, PDF and optional materials/estimate CSV. Preserve captured assets, attachments, revisions, issued/closeout history, issue records and removed-device history with stable IDs, without link credentials/live passwords.
- Existing editable format is JSON; how retained PDF assets are packaged/stored is architecture work. No promise to recover raw originals never retained. Generation failures remain visible/retryable; partial/incomplete files or asset bundles are not successfully complete.
- Export itself never approves or closes work and never requires approval.

## Requirement mapping

| Existing requirement/record | Accepted change |
| --- | --- |
| **FR-33 — Printable design/installation package** | Two preset contents/defaults, actual versus proposed basis, field/check evidence and relevant history, quantity/capacity inclusion, costs off by default, all-floor/Partial behavior, photo defaults and explicit evidence omissions. Can split fixed-history details into a new FR after FR-46 if needed; retain all existing IDs. |
| **FR-34 — Export and portable archive** | Separate downloads remain; complete backup now includes retained package PDFs/manifests in an architecture-defined packaging mechanism. Preserve lifecycle/issues/history and stable links without access credentials or promised raw originals. |
| **NFR-6 — Consistent deliverables** | Readable continuation pages and references, consistent saved-source basis, visible missing assets/failures, exact-file retention, immutable editions and explicit omission labels. Remove either retained or reproducible as an unresolved alternative. |
| **FR-22/FR-24/FR-26/FR-32** | Fixed source revision/issue/closeout remains distinct from export edition and decision cutoff. Later approvals can produce a new edition, not mutate old files or transfer approval to changed source revisions. Export has no approval/closure side effect. |
| **FR-17/FR-19/FR-45/FR-46** | Scope quantities/costs and property-wide capacity/known faults retain correct basis. A floor filter or hidden cost section cannot remove property issues or misstate the project closeout. |
| **FR-29–FR-31/FR-43/FR-44** | Packages preserve actual expected/observed tests, context and required follow-ups; relevant earlier evidence is included without inventing universal passes or filling the current PDF with all lifetime history. |
| **OQ-6 / A-1** | Mark OQ-6 resolved and replace/remove A-1's stale proposed-package label. Presets, defaults, photo layout and exact historical-file retention are now confirmed. Exact storage/packaging and numerical limits remain architecture/OQ-9. |

## Four integration risks

1. **Partial/evidence-limited output versus complete closeout.** Floor filtering, compact photos and optional coverage sheets cannot hide unresolved property issues, change the property outcome or imply omitted required evidence is included. Keep Partial/evidence-limited labels and manifests distinct from actual workflow completion.
2. **Fixed source versus edition/decision history.** Historical redownload must return the exact retained file. New renderers or later approvals create a new dated edition with a cutoff; they cannot overwrite the old artifact, mutate a fixed source, or make static PDFs appear live.
3. **Costs/capacity versus scope and access.** Prices default off while quantities and capacity default on. Cost omission is not permission enforcement. Retained equipment still contributes capacity, source basis stays explicit, and selected floors must not silently shrink a property-wide estimate or known fault summary.
4. **Expanded deliverable requirement versus current implementation.** Current raster reports lack cost/capacity/review-decision and lifecycle sections, and existing shared review snapshots omit substantial data. Acceptance establishes required new work, not proof of implementation, searchable/vector PDF, original-photo retention, map-tile export rights, separate schedule CSVs or a complete compliance pack.

## Narrow OQ-7 baseline — still input for recommendations

Source inspection on 2026-11-17 is read-only and does not constitute tests or endorsement of baseline choices as permanent requirements.

### Equipment and identity

[Catalog source](../../../../../site-studio/src/catalog.js) has nine generic choices across eight types: dome camera, bullet camera, credential reader, exterior light, magnetic door contact, motion detector, IP intercom, PoE switch and wall cabinet. Cameras share one type. The internal door type means a **door contact**, not a complete door, controlled opening or gate assembly. Type/name/model/mounting fields and editable planning allowances are not a live manufacturer/validated-specification catalog.

The digest confirms editable model/notes, existing/proposed status, stable device identities, active-floor placement and a property-wide schedule. Requested doors/gates, fences/entrance representations, explicit network closets/physical ports and riser support remain OQ-7 inputs; the existing cabinet, reader/contact or zone type does not establish those capabilities.

### Cable routes and floor boundaries

[Cable source](../../../../../site-studio/src/cables.js) defines Cat6, fiber and security cable with illustrative material-only unit rates. Route endpoints are device IDs; waypoints are geographic points and endpoints follow current device coordinates. The project-model/UI evidence restricts routes to two distinct devices on the same floor. Invalid/incomplete endpoints have no drawable path.

Route length is summed horizontal geodesic distance. The current billable helper multiplies that length by one saved slack percentage (default 10%, bounded 0–100%). It does not model vertical rise or explicit service-loop length. The accepted OQ-5 supply-quantity distinction is new product behavior beyond treating every drawn length plus slack as purchase quantity.

Floors have separate drawings/devices/routes and no stored elevations/stacked 3D geometry. Inter-floor risers, vertical allowances, shared cross-floor paths and obstacle-aware auto-routing are not implemented in this baseline. Same-floor drawing restrictions are not proof that cross-floor work has been explicitly excluded forever; prioritization is still OQ-7.

### Port, switch and PoE assumptions

[Capacity source](../../../../../site-studio/src/capacity.js) aggregates property totals while evaluating route-to-switch associations separately within each floor:

- Cameras always count as networked; IP intercoms default networked. Other types can be explicitly networked. Every networked endpoint consumes one copper access-port demand, even with zero PoE allocation.
- A device is assigned to a switch only when direct Cat6 routes identify exactly one distinct same-floor switch candidate. No candidate or multiple candidates remains explicitly unassigned/ambiguous; its demand stays in property totals.
- Each drawn Cat6 switch-to-switch route consumes one copper port at each end. Fiber/security routes do not create modeled copper assignment, optical-port demand or optical-uplink capacity.
- Checks compare endpoint plus uplink port count, powered-endpoint count, aggregate PoE watts and per-endpoint maximum allocation with switch limits. There are no physical port IDs, patch-panel/cross-connect paths, closet membership, multi-interface endpoints or complete topology/throughput validation in this model.
- Generic defaults include an eight-port/eight-PoE-port switch, 60 W total and 30 W per-port limits; camera/intercom allocations are generic assumptions. They are not verified vendor limits or device observations.
- The baseline capacity model does not yet implement the new current/proposed work-scope, archive or full unknown-specification policies merely because generic default fields exist. Known failed coverage credit also does not establish zero physical port/power demand.

## OQ-7 boundaries for the next recommendation

Keep any proposed additions and priorities explicitly pending. Distinguish physical assets/openings/locations from functional devices; logical network association from numbered physical ports; pathway geometry from cable segments/supply quantities; and same-floor drawn distance from explicit inter-floor/riser allowances. Preserve stable IDs, existing-site provenance, retained-versus-new costs, current/proposed analysis, scoped dependency retests and issue history. Do not silently adopt a detailed rack/CAD/BIM/network-engineering system, manufacturer certification, live procurement, automatic discovery or complete cable engineering.

OQ-6 acceptance does not resolve OQ-7 catalog/pathway scope, OQ-8 archive edge cases or OQ-9 measurable limits. All three remain open.

## Narrow reconciliation against draft 0.7 — 2026-11-17

**Result: no actionable discrepancies found in the accepted OQ-6 integration.** Reviewed FR-33/34, NFR-6, resolved OQ-6/A-1, the confirmed package addendum and current index/conversation status. No broad catalog review, main-document edit, application test or finalization was performed.

- **Exact files and editions:** FR-34 requires retained issued-design/closeout PDFs with manifests, historical download/archival/backup availability, and a new dated edition rather than overwrite for regeneration or later decisions. Source snapshot and decision-history cutoff remain explicit; later installation edits cannot be substituted.
- **Consistent source and workflow:** FR-34 resolves relevant initiating-editor pending/conflicting work before generating. The addendum retains saved draft previews and fixed review-record distinctions. FR-33 explicitly makes export independent of approval and closeout state.
- **Partial/evidence limitations:** FR-33 defaults to all floors, labels selected floors Partial and preserves property-wide outcome/issues. Required-photo omission is evidence-limited; missing required files, generation failures and truncated evidence cannot silently appear complete. The addendum preserves photo-preview, fit-to-page and omitted-basemap limits.
- **Defaults and information scope:** Quantities/capacity are included by default, while prices/labor costs default off. Capacity includes applicable retained demand; the addendum labels any subset. Optional cost/photo choices do not change saved records, permissions or outcomes.
- **Evidence/history:** Design and actual closeout content remain distinct; current-scope test attempts and relevant earlier correction/retest evidence retain references, outcomes and follow-up flags. Full lifetime history remains in the separate editable backup, with captured assets and retained package relationships, without credentials or promised raw originals.
- **Decision boundary:** PRD, addendum, index and latest conversation identify OQ-6/A-1 as resolved and OQ-7 as pending. The catalog/ports/riser recommendation remains explicitly proposed; current FR-7/9/19 and implementation claims are not silently expanded. OQ-7–OQ-9 remain open.

This disposition confirms documentation consistency for guided draft 0.7 only; it does not accept the OQ-7 recommendation or verify application behavior.
