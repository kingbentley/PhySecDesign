# File, export, backup and recovery refinement — OQ-9 proposal

Prepared 2026-11-17 for the confirmed larger property profile:10 buildings, about600 devices/150 physical cameras,20–30 plans and one usual/two concurrent users. Read source-index.md, .memlog.md, current FR-20/21/33/34/NFR-2 and the older unapproved file/recovery candidates. The parent reports performance acceptance is now confirmed; this extraction does not reopen it. All file/storage/recovery numbers and **new original-file retention** below are pending recommendations, not accepted requirements or tested capability. No app/main/log edits or tests were performed.

## Confirmed obligations that the proposal must preserve

- Evidence belongs to stable device/floor records and survives archive/replacement without reassignment to another physical device (FR-20).
- Saved means acknowledged durable records **and their required associated files**, surviving browser closure and ordinary service restart. Failed requests retain pending input in the open page; retry is duplicate-safe. Unsaved browser-close recovery and durable offline capture are not promised (FR-21/NFR-2).
- Design/Closeout packages include the agreed selected content, default all floors, detailed current-scope evidence and continuing property issues. Required-photo omission is explicitly evidence-limited; two captioned photos/page is the initial layout. A completed package cannot silently truncate evidence to fit a cap (FR-33).
- Exact issued/closeout PDFs and manifests remain downloadable, with new editions rather than overwrites. Complete backup preserves captured media, records, revisions, history, issues, archives, relationships and retained packages; access credentials/live passwords are excluded. Missing legacy originals cannot be invented (FR-34).

## Current source boundary

The existing app handles a50 MiB local PDF,12 MiB plan image,20 MiB photo, one selected raster per floor and bounded3,200 px/10-million-pixel PDF raster. Survey photos become metadata-free JPEG previews, at most700,000 data-URL characters each and24 Mi-characters per design. It does not retain originals. Portable JSON is capped at100 MiB and duplicates full design/revision assets;20 revisions and40 session undo steps are local implementation limits. The PDF writer holds encoded page images and stops after80 MiB JPEG payload, before final assembly. It has no multi-volume edition, exact-package server archive, spreadsheet intake, full shared-project restore or automated recovery-backup implementation.

Evidence: site-studio/src/pdfImportUtils.js:1–23; src/pdfImport.js:148–152; src/App.jsx:434–451, :500–514; src/survey.js:1–5, :34–67; src/projectModel.js:8–10, :406–420, :454 onward; src/designReport.js:12–33. The source-based limits and historical QA in [poc-acceptance-baseline.md](poc-acceptance-baseline.md) do not establish the proposed larger envelope.

## Pending recommendation selected for discussion

| Layer | Candidate | Meaning and caution |
| --- | --- | --- |
| Source input | PDF ≤100 MiB; image/photo ≤25 MiB; CSV/.xlsx ≤10 MiB | Source-file byte guards, not a guarantee that every file decodes cheaply. Add decoded-dimension/page/worksheet-cell/text/decompressed-work bounds and clear unsupported/corrupt feedback. Preserve the previous project on failure. |
| Newly retained media | Original drawings/photos **plus** derived plan/photo previews | This is new POC scope beyond today's previews-only behavior. Preserve exact source bytes/provenance and preview relationship; disclose resolution/metadata differences. Label legacy originals Unavailable if never captured. |
| Retained property payload | ≤8 GiB | All unique retained originals/previews, current data, earlier referenced assets, history and exact package volumes/manifests count. This is not8 GiB per revision or only the current plan. No automatic history/evidence deletion to stay under it. |
| Report volume | ≤250 pages **and** ≤100 MiB final PDF bytes | Split on whichever bound is reached first. The existing80 MiB JPEG counter is not a final-file guard. Preserve readable captions, repeated headings and references. |
| Complete edition | ≤1 GiB across all volumes/manifests | One immutable edition/set tied to one fixed source and decision cutoff. A single PDF is only a volume of that edition; no arbitrary volume-count assumption. Report completeness at the set level. |
| Complete portable backup | ≤10 GiB | A self-contained desktop package of the≤8 GiB retained property plus schema/manifests/container overhead. Include assets once with complete references; do not nest earlier recovery backup files inside it. File bytes and logical payload are separate measures. |
| Recovery generations | At least7 complete daily generations plus pre-migration/destructive-maintenance protection | Separate from live-project and within-project revision retention. Specify pre-maintenance retention explicitly; rotating recovery copies must not erase history inside a project. |

All individual maxima cannot be used independently of the aggregate guards. Prefer visible used/remaining capacity and an explicit operation-level failure before accepting unretainable data. Counts below are benchmark quantities, not automatic purging/retention limits. The25 MiB image/photo proposal does not itself commit support for every codec; the accepted real-device photo workflow still needs a supported capture/picker path and clear handling of formats not supported.

### Original retention and shared source PDFs

Keep PDF parsing/page selection local as already required. Retaining the original in the shared project is a **new explicit upload/retention step**, distinct from local parsing; do not continue claiming the original is never uploaded if this proposal is accepted. Never store its entered password as project content. An encrypted original can remain byte-identically encrypted and require its password again; the retained selected raster remains usable without inventing a recoverable password.

A100 MiB multi-sheet PDF used by30 plans should be stored once as a source asset with30 page/preview references, not copied30 times merely because pages belong to different floors or revisions. Different source files/versions remain distinct. Preserve filename/page/provenance and historical references; deduplication must not merge physical evidence identities or overwrite earlier content. The same principle applies to reused media across revisions and duplicate-safe upload retries. This is an observable nonduplication/storage requirement; exact hashing, container and database design remain architecture work.

## Sizing arithmetic

| Representative retained content | MiB |
| --- | ---: |
|30 original PDFs ×20 MiB |600 |
|30 selected plan previews ×4 MiB |120 |
|1,200 original photos ×2 MiB |2,400 |
|1,200 photo previews ×0.25 MiB |300 |
|4 retained editions ×4 PDF volumes ×100 MiB |1,600 |
|Records/history allowance |300 |
|**Total** |**5,320 =5.195 GiB** |
|Remaining under8 GiB |2,872 =2.805 GiB |

If all30 source PDFs instead consume100 MiB each, total becomes7,720 MiB =7.539 GiB, leaving472 MiB under8 GiB. This is still arithmetically coherent, but leaves little room for new distinct drawings/photos/editions. A single100 MiB source reused for30 pages would count100 MiB of original bytes, not3,000 MiB. Conversely,1,200 original photos each at the25 MiB input maximum would alone consume30,000 MiB and cannot coexist under the8 GiB aggregate. Communicate this before uploads; do not reduce original bytes while still calling them originals.

Four400 MiB editions each fit the1 GiB edition cap. The sample leaves generous backup-container headroom **only if content is referenced without repeated copies**. Base64 encoding8 GiB of binary assets alone expands to about10.67 GiB before metadata, already exceeding10 GiB. Today's monolithic repeated-asset JSON cannot be treated as adequate. Demonstrating multi-GiB desktop export/restore on ordinary laptops requires bounded-memory handling; avoid a promise that the whole archive fits in browser RAM. Mechanism selection is architecture work.

### Readable multi-volume output

1,200 photos at two/page require600 pages before clean/coverage plans, schedules, checklist attempts, notes and manifests. At250 pages/volume this needs **at least3 volumes for photos alone**. Thirty clean plus thirty coverage sheets add60 pages. Four volumes leave340 more pages for all remaining material, so the example can be plausible but must be proven by an actual readable manifest; detailed notes/attempts can expand. A250-page single-PDF cap is not a complete-site package limit.

Recommend one edition manifest listing every volume, byte/page count, source/edition/cutoff and integrity value. Identify Volume n of N and that a volume is not the complete set. Generate all volumes from the same fixed saved source; final edition status requires every required volume/manifest to be present and validated. Partial generation/download is visibly incomplete and retryable. A user-chosen floor/photo-limited summary remains separately labeled under FR-33; automatic volume splitting must not quietly turn a complete requested package into such a summary. Retain exact historical bytes for the whole set; do not regenerate a missing old volume from current data.

## Transfers, processing and recovery

Ideal transfer arithmetic excludes protocol overhead, retries and processing:

-100 MiB report volume at5 Mbps upload:2.80 minutes.
-10 GiB backup at5 Mbps:4.77 hours; at20 Mbps:71.58 minutes. Thus even the20 Mbps reference download cannot deliver10 GiB within60 minutes before restore processing.
- To transfer10 GiB within30 minutes and leave30 minutes for validation/restore requires at least47.72 Mbps sustained throughput for transfer alone. This is not a promised service rate.

Measure local source decoding/preview, server durable upload/association, report generation, package retention, export construction, network transfer and restore validation separately. Large jobs need progress, useful failures and safe retry/cancellation behavior; ordinary two-second metadata-save and ten-second project-open goals cannot be applied to full archives. The normal project-open path should not need all original media or retained reports downloaded. New file-job duration goals should be tied to these byte/page/complexity fixtures, not inherited from the old500 MiB example.

**Two different recovery promises:**

1. **Ordinary restart/browser closure:** no acknowledged record or required attachment disappears. This is already confirmed, not relaxed to a daily-backup recovery point. Do not show Saved while original/preview association is incomplete if both are required by the new retention policy.
2. **Catastrophic store loss:** pending recommendation is latest successful complete backup with a snapshot/recovery point no more than24 hours old, restored within60 minutes once the documented recovery environment is available. This must use an automated accessible backup path in that environment, not depend on a user downloading/reuploading10 GiB over5 Mbps. Include recovery-side retrieval, integrity checking, database/media restore, relationship validation and usable service within the timed exercise. Exclude desktop portable transfer only because it is a separate recovery method with separately measured time; do not quietly exclude the actual recovery environment's backup fetch.

Daily scheduling alone does not prove a≤24-hour recovery point. Record snapshot cutoff and successful completion, retry failed jobs, retain the last good backup and surface stale/failed protection. Backup rotation must never delete the last usable generation while a replacement is incomplete. The environment-available prerequisite must be concrete, not a way to exclude substantial restore work after a failure.

**Capacity for recovery copies:**7×8 GiB logical payload =56 GiB, plus one pre-maintenance8 GiB copy =64 GiB logical backup data. If complete containers reach10 GiB each, the corresponding physical archive allowance is70+10 =80 GiB, plus up to8 GiB live content and temporary restore/build space. Compression/dedup may reduce actual storage but is not a justification to provision only64 GiB for potentially80 GiB of files. Recovery generations live separately from the live store/failure domain; a backup directory lost with that store does not meet catastrophic recovery.

Demonstrate isolated restore with schema/manifest validation, IDs/relationships, counts, historical/removed records, issue/test context, originals/previews and byte-identical exact PDF volumes/manifests. A malformed or incomplete backup must not overwrite the live project. Portable recovery excludes credentials; re-establish project/reviewer access under the accepted policy rather than silently reviving old bearer links. Existence of a download/export file is not proof of recoverability.

## Compact recommendation

The8 GiB retained /10 GiB complete-backup proposal is coherent for the stated representative manifest with originals and previews. Preserve original-file retention as an explicit new product decision; deduplicate shared source bytes, use complete-edition multi-volume manifests, count all retained history/packages and separate the server recovery objective from slow desktop transfer. The60-minute catastrophic goal is an unmeasured recovery-infrastructure target whose automated retrieval must be included. No proposed byte/page/time number is accepted or verified by this extraction.

## Pending-proposal sanity reconciliation — 2026-11-17

Reviewed only the addendum section Proposed file, export, backup and recovery scope — OQ-9. **No meaningful issue was found in this narrow check.** Original retention and multi-volume editions are explicitly new pending proposals; legacy originals remain unavailable rather than invented. The8 GiB retained payload,10 GiB final backup container,1 GiB edition and250-page/100 MiB PDF-volume boundaries distinguish aggregate from per-file limits. The5,320/7,720 MiB examples and80 GiB for seven maximum containers plus one maintenance copy are consistent. All retained assets/history count and no automatic evidence purge is permitted.

Processing clocks start after relevant inputs are available, separate transfers are visible, and completion requires durable validated outputs. The30-second PDF/600-row preview/apply,10-second photo,5-minute edition,10-minute backup generation and15-minute portable validation/restore goals remain unmeasured proposals, with all three long-job runs required to satisfy their bounds and no correctness/integrity exception. Parser/decoded/complexity/workspace guards remain explicit engineering work; compressed file sizes do not imply unlimited decoding support.

Ordinary acknowledged-save durability remains distinct from24-hour catastrophic recovery point and60-minute prepared-environment restoration, which includes automated retrieval and validation rather than a slow desktop upload. Backup generation rotation does not remove project history; restored access cannot silently revive revoked links. The proposal preserves all key boundaries identified by the extraction and does not claim the current prototype implements them. No main/log/app edits, tests or formal review were performed.
