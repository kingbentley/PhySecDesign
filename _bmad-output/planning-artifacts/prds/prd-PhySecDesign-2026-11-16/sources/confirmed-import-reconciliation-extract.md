# Confirmed import reconciliation and bulk-cleanup scope

Date: 2026-11-17. Status: accepted product direction during guided draft refinement; not implementation evidence or formal finalization.

## Authority and sources

Kevin explicitly accepted the last duplicate/re-import and guarded bulk-delete recommendation. This supersedes the earlier pending mechanics labels in draft 0.20 and the historical party discussion. The current source index and canonical log were read before this extraction; the targeted PRD/addendum text was reread while the parent was integrating FR-58/59. Sources: [PRD](../prd.md), [addendum](../addendum.md), [source index](../source-index.md), [canonical log](../.memlog.md), and [party review round 1](party-review-round-1.md). Parent reports checking all 148 inventoried files: 147 unchanged, with the same previously recorded .gitignore drift. This extraction did not rerun application checks.

## Accepted rules and mapping

| Accepted capability | Requirement mapping and boundaries |
| --- | --- |
| Reliable identity | FR-58, FR-36/39/56 and NFR-1: match a valid app device ID within this property or a reliably unique stable source asset ID in declared source/property context. Preserve source IDs as strings, including leading zeros. Names, IPs, row order and location hints are review clues, not identity proof. Conflicting keys, duplicate keys and potential physical replacements require review; a different physical replacement receives a new linked ID. |
| Reviewed import preview | FR-58: New, Unchanged, Changed and Needs review rows; show current/incoming values and source/verification context. Apply selected straightforward rows together; keep unresolved cases for review. Skip unchanged values and recognize repeats/retries so repeated import creates no additional assets. Preserve source/batch provenance and visible applied/skipped/failed/conflicted outcomes. |
| Verified-data protection | FR-58 with FR-20/27–31/39/44/46: preserve current field-confirmed information and evidence by default. Deliberate reviewed corrections follow existing history, reason and impact rules. Blank cells do not erase values by default; omitted rows do not remove or archive assets. Imported changes do not document physical work or a passing test. |
| Archive and placement boundary | FR-36/54/56/57/58: an archived match requires explicit restoration, with a valid current destination under FR-54. Re-import neither reactivates it nor transfers it to the import-only Awaiting placement list to bypass restoration. Unplaced newly imported records retain their stable IDs, unknowns and applicable nonspatial accounting. |
| Guarded bulk selection | FR-59 with FR-55: select explicit records or a clearly identified import batch/filter; preview the selected count, affected records, eligible records and blocked reasons before confirmation. Freeze the reviewed selection; filters must not silently expand it. Eligible accidental drafts and confirmed mistaken, unused import-created records may be cleaned up. Importing equipment described as existing does not automatically make it a draft. |
| Protected records and dependencies | FR-59 with FR-22/24/26/33–36/46/51–55: protect verified, issued/approved, installed/tested or otherwise field-evidenced records, later edits and protected dependencies. Matched pre-existing assets cannot be deleted merely because their row belongs to the batch. Do not cascade into shared equipment, retained cable/risers, notes/photos, issues or history; do not release occupied ports. A separately selected disposable draft dependency must independently qualify. |
| Consistent execution and recovery | FR-21/42/55/58/59 and NFR-1/2: recheck record versions, current eligibility and dependencies at apply time; surface stale/blocked cases. Keep batch activity and per-record outcomes; retries must not duplicate changes. Guarded own-session Undo restores original identities only when current floor/port/record conditions permit; it must not erase later work or fixed records. |
| Correction versus physical removal | FR-35/55/59: mistaken-record cleanup is an auditable data correction. It does not document removal of equipment, resolve a site fault or modify installation/test evidence. Actual equipment removal uses the existing archive workflow; bulk physical removal, mass archival and permanent history purging are not adopted. |

## Required cross-references and retained open decisions

- FR-56 should point to FR-58/59 and narrow OQ-10 to supported spreadsheet formats and sheet/column mapping. FR-55 should point to the bounded bulk extension without making surveyed/imported existing equipment ordinarily disposable. The current edited main/addendum clauses already carry these links.
- Preserve FR-57 and its distinctions among missing placement, field verification, physical installation, analytical inclusion, costs and applicable unknown demand. Matching or placement does not create a second asset or infer purchase quantities/connectivity.
- CSV versus Excel support, sheets/columns and mapping mechanics remain OQ-10. Acceptance of import behavior does not select file formats or a parser.
- PM-1 floor/building container deletion remains unaccepted: guarding dependent containers is a separate proposal from deleting selected devices.
- PM-2 designation of the current issued reference remains unaccepted: reviewed import/bulk cleanup cannot change the issued reference, inherit approval or mutate historical PDF bytes.
- OQ-9 browser/accessibility, timing/fidelity, media/report/backup and recovery targets remain open. The confirmed larger test profile is not proven support.
- PM-3's earlier manual-only intake tradeoff is superseded by FR-56–59, not a reason to reopen the accepted workflow. Historical proposal labels may remain in the preserved party record if clearly followed by the latest disposition.

## Consistency risks to preserve

1. Source identity is only reliable within a defined context. A repeated filename, reordered row, reused IP or similar label cannot establish that an asset is the same physical object.
2. Bulk cleanup eligibility depends on origin, evidence, later edits and dependencies, not batch membership, an unchecked Installed flag or an empty coordinate. A matched pre-existing asset and an imported mistaken unused record require different treatment.
3. Current-version validation must occur at execution, not only preview. Stale imports/deletions and undo must retain later survey evidence, fixed packages and port occupancy.
4. Historical party/status text must not leave current OQ-10 described as awaiting acceptance of matching or bulk rules. Conversely, acceptance must not silently adopt formats, PM-1, PM-2 or OQ-9 targets.

## Focused read result

The current FR-58/59 and confirmed addendum block observed during this extraction represent the accepted behavior, with no substantive conflict found in those clauses. Historical round-1 follow-up text still describes matching/cleanup as pending; it needs a subsequent disposition recording this acceptance (preserving its chronological history). This is a source-status synchronization item, not a new product decision. No main documents were edited by this extraction.


## Focused reconciliation — draft 0.21

Rechecked current FR-55/56/58/59, confirmed addendum rules and latest source-index, canonical-log, conversation-context and party-review dispositions. No actionable discrepancy found. Stable identity and reviewed batch handling, duplicate-safe repeat imports, protected verified values, blanks/absent rows, explicit archive restoration, selected eligible-versus-blocked cleanup, matched-record protection, dependency/version validation, activity and guarded Undo are represented. Import-only FR-57 and physical-removal/correction distinctions remain intact.

The source-status synchronization noted above is now addressed: party-review-round-1 has a subsequent import-reconciliation decision, and current index/context/log consistently narrow OQ-10 to formats/mapping. Earlier pending text is historical and superseded. PM-1, PM-2 and OQ-9 remain pending. This was a narrow documentation reconciliation; no application checks or finalization review.
