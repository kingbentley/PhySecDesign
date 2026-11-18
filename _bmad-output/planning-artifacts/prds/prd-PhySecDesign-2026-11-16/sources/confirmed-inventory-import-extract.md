# Confirmed inventory import followed by site survey — source extract

Prepared 2026-11-17 during the ongoing BMAD party-mode discussion, against PRD draft 0.18. This is a narrow source extraction, not a party persona turn, consensus claim, implementation or finalization review.

## Latest confirmed direction

User: “It could be either. I'd like to import an existing spreadsheet when available, then verify or add devices during the site survey.”

This confirms an additional POC intake path: **import an existing equipment spreadsheet when available, then verify/update that inventory and add discovered devices during the site survey**. Manual survey entry remains available when no spreadsheet exists. It supersedes the FR-39 statement that bulk import is not required; automatic device discovery remains outside the confirmed request.

Read [source-index.md](../source-index.md) and the current [canonical log](../.memlog.md) first, then the relevant [PRD](../prd.md), [addendum](../addendum.md), [conversation context](conversation-context.md) and [party round 1](party-review-round-1.md). The round-1 manual-intake question is now answered by the user; the separate floor/building deletion and current-issued-reference suggestions have **not** been accepted by this answer.

The parent checked all 148 inventory files: 147 unchanged, with the same .gitignore-only drift. This is source freshness, not evidence that a spreadsheet importer exists. Current portable project import/export is a different capability from importing an external equipment inventory.

## Proposed requirement mapping

Update FR-39's intake sentence/check and append candidate **FR-56** without renumbering existing requirements.

| Confirmed capability | Requirement mapping | Acceptance interpretation |
| --- | --- | --- |
| Existing spreadsheet as an intake source | FR-39 and new FR-56 | Let the user start an existing-site inventory from an available spreadsheet, while retaining manual intake. Remove the blanket bulk-import deferral; do not remove the separate automatic-discovery exclusion. Specific supported formats/import mechanics are undecided. |
| Import then survey | FR-39/20/56; existing-site journey | Imported records form document-sourced inventory for subsequent field verification and updates. Technicians can verify available details, correct them with context and add equipment discovered on site. Import success alone is not survey completion or a verified installed record. |
| Preserve source and unknowns | FR-39/28/31/56 | Distinguish spreadsheet/old-document facts, estimates and actual site observations. Missing model/date/location/condition/connection/specification remains unknown; recording/importing today does not invent original installation date, compatibility or a test Pass. Exact provenance fields and original workbook retention still require design. |
| Preserve identity through verification | FR-7/8/39/56 and NFR-1 | Keep stable internal device identity and original legacy/external labels. Updating an imported record during survey must not create a different physical asset merely because its name/model/location becomes more accurate. Physical replacement still follows new linked-ID rules. |
| Add newly discovered equipment | FR-39/40/56 | Adding an item to inventory during survey is not automatically purchasing or physically installing a new asset. Distinguish newly discovered existing equipment from proposed new equipment under the existing planned/actual/scope rules. |
| Keep baseline and evidence history | FR-22/28/31/34/39/56 | Preserve document-source context and later observations/corrections in the existing history model. Retain a named baseline before planning changes without treating every imported value as field-confirmed. Prior revisions/evidence remain fixed. |
| Shared project and integrity | FR-2/21/42/56 | Import and later survey work belong to the same property project. Existing durable-save, conflict/dependency and duplicate-safe action rules apply; detailed batch commit/rollback and duplicate handling are not yet selected. |
| Intake evidence in acceptance | Existing journey/SM-1/SM-5, when refined | Include representative spreadsheet intake followed by survey verification/addition in the functional/real-site test plan. A pre-seeded 600-device fixture alone does not demonstrate this newly requested onboarding workflow. Exact importer row/file limits remain unconfirmed. |

Compact FR-56 intent, for the main author to refine: “Import an available equipment spreadsheet into the property's inventory, retaining document-source context and unknowns, then verify or update the same records and add discovered equipment during the site survey. Preserve stable identities and distinguish imported information from field observations and test evidence. Manual entry remains available when no spreadsheet is supplied.”

## Unresolved import mechanics — do not silently adopt

- **Formats:** spreadsheet input is confirmed, but CSV, XLSX, XLS or any other exact format list is not. No cloud-drive/live-sheet connector or two-way synchronization is requested.
- **Columns and mapping:** accepted fields, required columns, mapping UI/templates, data types/units, enum conversion, preview/error treatment and partial-versus-atomic acceptance are still to be defined.
- **Identity and duplicates:** exact external key, duplicate detection, ambiguous matches and row-versus-asset identity treatment remain open. A row position or reused label must not silently replace stable internal identity.
- **Re-import:** initial intake is confirmed; update/merge versus append, repeated-upload behavior, changed source rows, deletions absent from a later file, and preservation of newer field data need explicit policy. Do not promise automatic synchronization or a merge strategy from this user statement.
- **Location:** spreadsheets may have only building/floor/room text or no useful location. How names map to stable building/floor IDs and how an item obtains a plan position remain undecided. Do not create coordinates, floors or verified physical locations from a missing or ambiguous cell.
- **Staging and original file retention:** whether incomplete rows stay in an import preview/staging area, can become unplaced inventory records, or must be resolved before commit is not selected. Retaining a source filename/import event is not the same as promising an archive of every original workbook or attachment.
- **Advanced imported entities:** importing cable geometry, port topology, camera optical templates, pictures, checklist attempts or historical packages is not implied by an equipment spreadsheet. Model text does not independently establish calibrated optics, actual connectivity or commissioning evidence.

These should be explicit intake decisions or bounded implementation choices before importing semantics are treated as complete. They do not reopen settled OQ-1–8 behavior; OQ-9 remains open for the previously pending acceptance policy, with import workload included as relevant.

## FR-54 restoration boundary

FR-54's “no separate unplaced-device queue” is part of **restoring archived devices**: require a valid floor and confirmed point before active restoration, otherwise cancel and leave the device archived.

The new user request does not by itself approve an import staging list, an active unplaced inventory state or a general queue. Neither silently prohibit import staging by overgeneralizing the restoration rule nor silently weaken FR-54. Clarify the missing-location/import-commit model explicitly, including whether staged rows are already active assets and how they affect schedules, totals, analysis, survey tasks and recovery. Until then, keep the restoration behavior unchanged and record staging as pending.

## Conflicts and boundaries to flag

1. **Direct supersession:** FR-39 currently says “Manual placement and survey entry suffice for POC intake; bulk import and automatic discovery are not required.” Split it: spreadsheet-assisted intake is now required; manual entry stays available; automatic discovery remains unconfirmed/out of scope. The addendum's manual-only intake summary and round-1 tradeoff labels also need current-status updates while preserving historical discussion.
2. **Imported does not mean verified.** Do not turn source rows into confirmed placement, known hardware traits, original dates, installation completion or a Pass. Survey updates need provenance; one checked value must not silently certify all unknown/source-only attributes.
3. **Stable asset identity versus repeated input.** Survey edits preserve the imported asset's ID; repeated files or matching labels do not justify duplicate assets or overwriting newer field evidence without an agreed policy.
4. **Imported existing inventory is not an accidental proposed placement.** A missing Installed flag or lack of field verification does not establish FR-55 quick-delete eligibility. Erroneous/duplicate source records require the appropriate history-preserving correction/eligibility review, rather than pretending an actual device was removed or never existed.

No other settled product conflict was found. Only this extraction was written; no main documents, app changes/tests, research, party persona statements, extra agents or broad review were performed.
