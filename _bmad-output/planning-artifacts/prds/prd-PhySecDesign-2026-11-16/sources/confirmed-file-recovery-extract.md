# Confirmed file, export, backup and recovery scope

Date: 2026-11-17. Accepted product/acceptance policy during guided refinement; not implementation evidence, successful recovery evidence or final PRD signoff.

## Authority and sources

Kevin explicitly accepted the latest file/export/backup/recovery recommendation and asked what remains before finalizing. This completes OQ-9's product-policy decisions. It does not implement the requirements, prove capacity or complete formal finalization.

Read the current [source index](../source-index.md) and [canonical log](../.memlog.md), FR-20/21/33/34 and NFR-2/6 in [draft 0.26 PRD](../prd.md), and the latest file/recovery block in the [addendum](../addendum.md). Its proposed labels are superseded by this confirmation; older small-fixture candidates remain historical. No application or recovery tests were run.

## Accepted resource boundaries

| Item | Accepted boundary |
| --- | --- |
| Source site-plan PDF | 100 MiB per file |
| Source image/survey photo | 25 MiB per file |
| CSV/.xlsx inventory | 10 MiB per file; exercise 600-device import/re-import, not a permanent 600-row ceiling |
| PDF volume | 250 pages and 100 MiB final PDF bytes; split when either boundary requires it |
| Complete design/closeout edition | 1 GiB across included PDF volumes and edition manifest |
| Retained project content | 8 GiB, including original/processed media, retained distinct older assets, records/history and exact package editions |
| Complete portable backup | 10 GiB final container, with 8 GiB logical project payload and validated manifest |

Use binary units: 1 GiB = 1024 MiB. Per-file maxima share the aggregate budgets; accepting each maximum does not mean every asset can simultaneously fill it. Show usage and warn before exceeding a limit; fail safely without losing the saved project. Do not silently truncate evidence/schedules, purge revisions, lower original quality or split the property into arbitrary projects. Engineering must declare/validate parser, decompressed image/page complexity and temporary-space limits. Increasing tested budgets requires engineering/validation, not a product claim of unlimited scale.

## Originals and complete editions

- Retain new uploaded original drawings/photos plus usable lightweight previews. Share the retained source PDF across selected sheets/revisions instead of unnecessary original copies.
- An attachment is Saved only after required originals, derived files and relationships are durable. Processing for display/export must not destroy the original. Preserve older prototype assets as available and explicitly identify originals that were never retained.
- Keep the existing presets, optional costs, explicit partial/omission labels and fixed source/edition rules. Split complete editions as needed into numbered building/logical-section volumes; retain exact PDFs and a common manifest identifying property, scope, source revision, edition, included floors/sections, volume list and completeness.
- Offer the edition as one downloadable package; a single PDF remains valid when it fits. Every volume uses the same fixed saved source.
- A 250-page volume limit is not a complete-property page cap. Preserve readable evidence; if the complete edition exceeds its aggregate budget, report failure and offer only explicit scope/optional-content adjustments. Omitted required evidence remains visibly omitted; it cannot be hidden behind Complete.
- The illustrative 1200-photo/retained-edition payloads establish sizing examples, not mandatory photo counts, revision caps or proven output sizes.

## Accepted processing targets

Measure from when relevant bytes are available to the processing step, separately from transfer time.

| Processing operation | Target |
| --- | --- |
| Selected PDF-page preview | 30 seconds |
| Photo preview/processing | 10 seconds |
| 600-row inventory preview | 30 seconds |
| Confirmed inventory application | 30 seconds |
| Complete retained PDF edition | 5 minutes |
| Complete portable backup generation | 10 minutes |
| Portable backup validation and restoration after upload | 15 minutes |

Completion includes required durable outputs/manifests, not just queue acceptance. Keep ordinary UI feedback/freshness, visible progress/failures and safe cancellation where supported. Exercise long jobs at least three times on the declared full-size/readable fixture; every run must meet its bound and correctness/integrity requirements.

Transfer start/end and status are separately measured. Do not promise these durations from file selection on an unspecified connection. Failed upload preserves the saved project and cannot be labelled complete. A 100 MiB upload at 5 Mbps alone takes about 2.8 minutes, and 10 GiB about 4.77 hours before overhead; these examples explain the separate clocks, not accepted upload-time guarantees.

## Accepted backups and recovery

- At least daily automatic complete recovery backups, with at least seven successful daily generations independently retained from the live project; additionally take a complete backup before migrations/destructive maintenance.
- Show backup age, success/failure and latest valid recovery point. Schedule with margin so the latest successful point is no older than 24 hours. Backup rotation does not purge project revisions/assets/evidence.
- Budget backup storage separately from live payload and temporary space. Seven maximum-size 10 GiB portable-equivalent generations plus a maintenance copy could require 80 GiB; alternative storage is valid only if every retained generation remains fully recoverable.
- Keep zero loss of acknowledged records/attachments across ordinary browser closure or service restart under NFR-2.
- For catastrophic store loss, recover from a point no older than 24 hours and restore a usable project within 60 minutes after recovery begins in the documented prepared environment. This includes automated retrieval, validation and restoration; it must not depend on a multi-hour user upload.
- Show the actual restored recovery-point timestamp and potential loss window. Do not fabricate later records or imply that the restored issued-reference designation includes later lost changes. Record preparation/environment and total elapsed time; report stale backup or missed recovery targets honestly.
- Demonstrate an actual isolated restore preserving stable IDs/relationships, originals/previews, archived devices, revisions, unresolved issues, exact historical PDF volumes/manifests and current-issued-reference designation/history.
- Verify completeness/content integrity before a deliberate switch. Invalid/incomplete restoration cannot overwrite the working project. Portable backups exclude credentials; recovery cannot reactivate revoked bearer links or imply old access grants remain current. Re-establish authorized access under the existing demo model.
- A PDF is not an editable project backup, and successful download is not proof of restoration. These are POC targets, not production availability commitments.

## Required cross-references

| Clause | Required update/boundary |
| --- | --- |
| FR-20; drawing input clauses as appropriate | Add new-original retention plus readable previews, preserve existing evidence context and disclose unavailable legacy originals. |
| FR-21 / NFR-2 | Link portable/automatic recovery without weakening normal acknowledged-save durability. Separate pending input, durable attachment completion and catastrophic loss window. |
| FR-33 / NFR-6 | Add complete numbered PDF volumes/manifest, same fixed source and aggregate completeness; retain optional evidence/cost choices and honest omissions. |
| FR-34 | Retain exact constituent files/manifests and complete backup relationships; update the old pending-numeric-limits wording. Include original/preview assets and guarded isolated restoration. |
| FR-61 / NFR-5 | Preserve issued-reference history at the actual recovery point and re-establish current authorized access; do not roll back revocation through old credentials. |
| Acceptance criteria / OQ-9 / A-2 / current status | Record confirmed resource/processing/backup/recovery tables; resolve OQ-9 while keeping engineering manifests, mechanisms and verification outstanding. Maintain draft status until the separate finalization process. |

## Consistency risks

1. Separate per-volume, edition, logical-project and final-backup budgets; no silent truncation or historical purge can reconcile an over-budget operation. Shared retained originals should not be counted as duplicate physical assets merely because many pages/revisions reference them.
2. The 15-minute portable restore starts after uploaded bytes are available; the 60-minute catastrophe exercise includes automated fetch in a prepared environment. Neither promises a 10 GiB client upload within that time.
3. The 24-hour catastrophic recovery point does not weaken zero loss on ordinary restart, and the recovered record must visibly disclose its time boundary.
4. Restoring access configuration cannot mean reinstating embedded portable credentials or previously revoked links. Keep authorized-access restoration separate from blindly replaying old grants.

No inherent contradiction with existing evidence, optional approvals or immutable package history was found. The new original-retention and multiple-volume requirements need explicit FR coverage, while numeric/recovery criteria and status text complete OQ-9. Product-policy closure is not software acceptance or automatic PRD finalization.

Source freshness: all 148 inventoried files checked; 147 unchanged, only the same documented .gitignore drift.


## Focused reconciliation — draft 0.27

One stale FR-6 Check initially contradicted new original-PDF retention. The parent corrected it; reread confirms retained source PDF/page association and preview, local-only password absent from records/backups, no implied editable CAD and explicit unavailable legacy originals. This finding is addressed; no actionable discrepancy remains.

FR-4/6/20/34 consistently retain new source images/PDFs/photos and previews while preserving older available content. FR-21/34 and NFR-2 retain normal acknowledged-save durability separately from catastrophic recovery. FR-33/34 and NFR-6 preserve complete same-source numbered volumes/manifests and exact historical files.

The accepted limits and clocks match: PDF 100 MiB; image/photo 25 MiB; inventory 10 MiB; volume 250 pages/100 MiB; edition 1 GiB; project 8 GiB; backup 10 GiB container/8 GiB payload. Post-byte-availability processing remains PDF 30 s, photo 10 s, inventory preview/application 30 s each, edition 5 min, backup 10 min and portable validation/restore 15 min, with transfer times separate. Daily/seven successful independent generations, pre-maintenance backup, at-most-24-hour catastrophe point and 60-minute prepared automated recovery retain isolated validation and revoked-link safeguards.

OQ-9 is resolved and current policy-open labels are removed; all known product choices are settled without implying implementation or measured support. Downstream roles/milestones and full finalization work remain explicit, with status draft 0.27/guided refinement. Historical candidate sections are preserved in the linked superseded-acceptance-candidates.md record rather than treated as current requirements. No application tests or broad finalization review were performed.
