# Confirmed imported-device Awaiting placement list — source extract

Prepared 2026-11-17 during the ongoing BMAD party-mode discussion, against PRD draft 0.19. Narrow source extraction only; no party persona simulation, consensus claim or broad review.

## Authority and acceptance boundary

The latest user explicitly accepts an **Awaiting placement list for imported devices**, requests its addition to the PRD, asks for duplicate/re-import recommendations and says bulk delete would help.

This confirms the previously proposed import-only list in the [addendum](../addendum.md): imported inventory lacking a usable floor/map position can remain identifiable for later survey/placement, retaining source building/floor/room hints without invented pins or coverage. It supersedes the pending placement-list labels in [FR-56/OQ-10](../prd.md), [source-index.md](../source-index.md), [canonical log](../.memlog.md) and [conversation context](conversation-context.md).

Read the source index and canonical log before extraction. The parent rechecked all 148 inventory files: 147 unchanged and the same .gitignore drift. No application behavior or tests have changed.

Duplicate matching, repeat-import updates and precise bulk-delete behavior are **not approved by this answer**. Bulk delete is now a requested convenience direction; its eligible record classes, selection/preview/recovery and dependency treatment need a concrete bounded proposal. Formats/mapping remain unresolved as well. OQ-10 is partly resolved, not closed; OQ-9 and other unaccepted party suggestions remain open.

## Candidate FR-57 and linked changes

Append **FR-57** for imported inventory awaiting placement. Update FR-56's missing-placement deferral and the OQ-10 status; preserve all existing IDs.

| Accepted behavior / inherited constraint | Requirements | Interpretation |
| --- | --- | --- |
| Import-only Awaiting placement list | New FR-57; FR-56/8/39 | Keep imported device records lacking a usable floor or position in a clearly labeled, accessible inventory/survey list. Preserve source location hints and unknowns; don't require invented coordinates merely to retain inventory for later survey. |
| Same record from import to placement | FR-7/39/56/57; NFR-1 | Keep stable internal identity and external/legacy labels through list review, verification and placement. Placing the item should not create a second physical device or leave both a duplicate list record and active map record. Exact duplicate/re-import identification remains undecided. |
| Source data versus observation | FR-20/28/31/39/56/57 | Imported model/location/condition remains source-based until appropriately verified. Placing a pin, choosing a floor or editing one value does not automatically confirm every attribute, original installation date, hardware operation, observed connection or test result. Preserve prior source/context and later observations/corrections. |
| Honest physical/analysis status | FR-12–15/19/41/57 | Awaiting placement describes incomplete location, not physical nonexistence, actual removal or a test outcome. Show location-dependent analysis as unavailable/unassessed for that record; invent no map pin, footprint, cable endpoint/path or coverage credit. Missing placement cannot prove actual site blindness or justify a smaller zone denominator. |
| Costs and property demand | FR-17/19/40/45/51/57 | Retain visible inventory and applicable known/source-based demand under the selected current/proposed basis, with unknowns/unassigned quantities disclosed. Lack of position alone is not zero demand. Retained existing assets are not repurchased; new-work supply quantities remain explicitly scoped. Do not double-count list and placed representations. |
| Shared history and delivery | FR-21/22/33/34/42/57 | Existing saved-state, concurrent-edit, stable-reference and fixed-history protections apply. List review/placement must not overwrite newer survey work. Preserve pending-location context in appropriate inventory/schedule/backup representations; do not portray unplaced items as verified floor-map geometry. Exact screen/export arrangement is implementation design. |
| Keep restoration separate | FR-36/54/57 | Import-only waiting behavior does not reopen archived-device restoration. Restore still needs valid destination floor and confirmed position before activation; cancel leaves the archived device archived. |

A compact requirement intent is: “Provide an Awaiting placement list for imported devices without a usable floor/map position, preserving source location hints, unknowns, provenance and stable identity. Allow later survey verification and placement of the same records without fabricated geometry, duplicate assets or implied installation/test completion. Keep this intake behavior separate from FR-54's archived-device restoration rule.”

A useful acceptance example is an imported camera with source hint “Building B / second floor / corridor” but no usable point. It stays in Awaiting placement with the source hint. Survey placement resolves the appropriate current floor/point on the same ID while the remaining imported facts retain their provenance; no automatic Pass, cable route, port assignment or repurchase follows.

## FR-54 reconciliation

The current FR-54 says no separate unplaced-device queue **within archived-device restoration**. The newly accepted list is an explicit **import-only intake case**, so it can coexist without weakening that rule.

Clarify both clauses' scope in the main draft: imported inventory may await placement; a restore operation may not bypass destination confirmation by sending an archived record to that list. Do not extend the list to arbitrary manual placement, moved/restored devices or a general lifecycle queue without a separate decision. No automatic floor recreation/name matching follows from retaining spreadsheet location hints.

## Duplicate/re-import and bulk-delete boundaries — still pending

### Identity and repeat imports

The user asks for a recommendation, not a selected matching algorithm. Still undecided:

- Supported spreadsheet formats/sheets/columns and mapping/validation limits.
- Reliable external identifiers, duplicate candidates, same-batch duplicates and ambiguous matches. Neither a name, source row position nor a missing serial number alone proves identity.
- Append versus update, chosen-field updates, preservation of newer verified observations, repeated-upload detection, partial failures and commit/rollback mechanics.
- What absence from a later source means. Do not infer actual removal, deletion, archive, cancellation or issue resolution merely because a row disappears.
- How source provenance is retained per import/correction and how conflicts are presented; retain historical evidence rather than silently replacing it.

These decisions must preserve existing same-asset IDs, distinct replacement IDs, shared-edit checks and fixed history. Import or placement alone cannot grant a Pass or resurrect a previously removed/archived asset.

### Requested bulk-delete direction

Bulk deletion is requested, but no blanket “select any imported rows and erase” rule is accepted. Existing FR-55 protects individual eligibility; any proposed batch action must account for each record's origin/history and dependencies.

An imported source may describe real existing equipment despite lacking field confirmation or placement. Such a record is **not automatically an eligible accidental proposed draft**. Unplaced/unsurveyed/unchecked Installed must not serve as shortcuts around retained evidence, physical archive rules or explained duplicate/error correction. Removing a staging row from a preview, deleting an eligible committed draft, cancelling an issued proposal and correcting an imported existing-asset record are potentially different operations; the batch policy must define which it offers.

Do not treat selection as permission to silently cascade-delete shared assets, cable/riser records, notes/photos/comments/issues, release physically occupied ports or erase earlier imports/revisions. Do not make re-import into a bulk-deletion mechanism. Detailed preview, mixed-eligibility handling, recovery and concurrency rules remain to be recommended and accepted; inherited history/scope protections continue meanwhile.

## Key consistency risks

1. **Missing placement becomes missing asset or zero demand.** Keep inventory visible; qualify location-dependent analysis and applicable demand without invented certainty or duplicate counts.
2. **Placing becomes verifying everything.** Source hints, current placement, actual physical status and performed tests remain distinct, with stable identity and provenance through updates.
3. **Import list weakens restoration.** State the intake-only exception explicitly; FR-54 still requires a confirmed current destination for archived-device restoration.
4. **Bulk cleanup erases consequential records.** User requested convenience, not accepted indiscriminate purge/merge behavior. Real-source records, verified observations, dependencies and historical issues need the existing protections and an explicit batch design.

Only this extraction was written. No main documents, application changes/tests, research, new approved proposals, extra agents or party persona turns were produced.

## Focused reconciliation — PRD draft 0.20 (2026-11-17)

No actionable discrepancies found in the accepted Awaiting placement scope.

FR-8/56/57 represent an accessible property-level list for imported records without usable placement, preserving identity, source hints, notes and unknowns. Later survey placement uses the same ID and preserves source history; placement, site verification, actual installation and test outcomes remain distinct. Unplaced geometry is excluded/identified as unassessed without inventing pins or coverage, while otherwise applicable property-level demand, unknowns and unassigned inputs remain visible under existing basis/scope rules. The list does not create purchases or duplicate records, and shared-save/history/backup/export safeguards apply.

FR-54 and the addendum explicitly retain the archived-device destination/confirmed-position rule; restoration does not enter the import-only list. New survey discoveries still use the normal add-device workflow. The latest conversation section and source-index summary agree with this boundary; earlier draft-0.19 discussion is superseded by the subsequent placement confirmation.

FR-56/OQ-10 and the addendum keep file formats/column mapping, matching/re-import mechanics and requested bulk cleanup safeguards unresolved. The addendum labels matching/re-import rules pending and bulk cleanup a proposed boundary; no CSV/XLSX choice, matching algorithm, default update/clear rule or deletion eligibility was promoted to accepted scope. Imported existing equipment is not automatically an eligible disposable draft. OQ-9 and other unaccepted party proposals remain open.

Only this reconciliation was appended. No main-document/application edits, tests, broad review or party persona turn were performed.
