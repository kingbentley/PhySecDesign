# Confirmed spreadsheet formats and mapping scope

Date: 2026-11-17. Accepted guided-refinement decision; not implementation evidence or PRD finalization.

## Authority and source boundary

Kevin accepted the spreadsheet formats/column-mapping recommendation and asked about remaining acceptance decisions next. This resolves OQ-10; OQ-9 acceptance remains pending.

Read the current [source index](../source-index.md) and [canonical log](../.memlog.md), FR-56–59 and OQ-10 in [draft 0.23 PRD](../prd.md), the pending spreadsheet-format block in the [addendum](../addendum.md), and the latest [conversation context](conversation-context.md). The latest explicit confirmation supersedes that block's pending labels. Checked all 148 inventory fingerprints: 147 unchanged, only the documented .gitignore drift remains. No application edits or tests.

## Accepted capability mapping

| Accepted scope | Requirement relationship |
| --- | --- |
| UTF-8 CSV and ordinary Excel .xlsx | Add candidate FR-62 and link FR-56. Select one tabular worksheet/header at a time, one physical device per row; confirm parsed CSV delimiter/columns. Defer legacy .xls, macro-enabled/protected workbooks and live cloud-sheet connections. Spreadsheet layout, pictures and camera heads are not automatically separate physical assets. |
| Editable column/value mapping | Suggest familiar headings; let users change mappings or ignore columns. Make ignored/unmapped columns visible. Map source type values to supported categories, or use an explicit batch default including generic/custom Unknown. No general transformation/scripting or organization-wide mapping system is implied. |
| Inventory fields and minimum identity | Support source asset ID, optional valid app device ID, label/name, type, manufacturer/model, serial, IP/MAC, building/floor/room hints and notes. A new row requires a usable label or source asset ID; other unknown attributes remain unknown. Strongly encourage stable source IDs without rejecting otherwise useful incomplete inventory. |
| Preview and selected-row application | Reuse FR-58 New/Unchanged/Changed/Needs review, current-versus-source comparison, row errors and visible applied/skipped/failed/conflicted outcomes. Show missing required values, invalid values and mapping conflicts before committing selected valid rows; allow source/mapping correction or explicit skips. Preserve existing concurrent-version and duplicate-safe retry rules. |
| Identifier and provenance fidelity | Preserve identifier strings/leading zeros when present; flag uncertain conversion instead of silently changing IDs/dates/numbers. Preserve selected filename/sheet/row and mapped-value provenance. Source row position is provenance, not a reliable identity key. New records receive stable internal IDs; ambiguous later re-imports require review, not matching by label alone or blindly adding duplicates. |
| Placement and model boundaries | Confirm links to existing buildings/floors or retain unresolved hints in FR-57 Awaiting placement. Do not invent floors/coordinates/connections/ports from free text. A model number may remain text until deliberately linked to a suitable catalog definition; do not infer optics/lens/resolution. Mapping a location hint does not constitute site confirmation. |
| Imported claims are not field evidence | FR-39/56–58 remain authoritative. Explicit previewed existing/proposed batch context is allowed; an imported installation/test-status column cannot establish observed physical work or a Pass. Preserve verified data by default, blanks do not erase, absent rows do not delete, and archived records require explicit restoration. FR-59 cleanup remains unchanged. |
| Values-only execution boundary | Read ordinary cell values or available stored formula results without recalculating formulas, executing macros or refreshing external links. Missing/error results require review or a values-only source. Do not silently retain ignored sensitive columns as imported attributes; credentials remain excluded. Parser choices are downstream implementation. |
| Template and mapping convenience | Supply a downloadable sample template. Remember the project's last confirmed mapping and propose it only when headers fit, always allowing preview/edit. This does not bypass current identity/type/location validation. |

## Cross-references and remaining decisions

- FR-56 should replace the pending-format sentence with a link to the confirmed format/mapping rule. OQ-10 should move to resolved, preserving all FR-56–59 safeguards.
- Link FR-57 for unresolved placement and FR-58 for matching/preview/results rather than defining competing importer behavior. Keep app/source IDs distinct from filename/sheet/row provenance.
- Preserve FR-47/48 model-template and physical-body/view/stream boundaries: inventory model text and one device row do not generate optical inputs or camera views.
- Preserve FR-42 shared-version validation and FR-59 guarded batch cleanup; remembered mapping is a convenience, not authorization to overwrite field-confirmed records.
- Update current main/addendum/index/context pending labels; earlier chronological discussion can remain with a subsequent acceptance disposition.
- Exercise imports within the confirmed larger test profile, without making 600 devices a row ceiling or claiming measured support. Exact file/resource, browser/accessibility, performance/fidelity and recovery targets remain OQ-9.

## Consistency risks

1. An allowable label-only new row is not a reliable re-import match. Stable internal IDs, source context and explicit ambiguity review must preserve FR-58's no-silent-duplicate/no-silent-merge behavior.
2. A confirmed building/floor association is not confirmed map placement or physical verification. Keep Awaiting placement and applicable property demand/unknowns visible until survey completion.
3. Stored formula results may be missing or stale; reading them must not imply calculation or verification. Preserve source claims and flag uncertain parsing.
4. Mapping reuse must not silently import ignored columns, reinterpret identifiers or overwrite verified values when headers/source contents change.

No inherent contradiction with the existing import, placement, history or bulk-cleanup decisions was found. The required update is explicit accepted format/mapping coverage and OQ-10 status; OQ-9 remains the next decision group.


## Focused reconciliation — draft 0.24

No actionable discrepancy found in FR-62, linked FR-56, the confirmed spreadsheet addendum block, or current source-index/context. CSV/.xlsx sheet/header selection, editable mappings/defaults/ignored columns, minimum label-or-source-ID intake, unknowns, selected valid rows, FR-58 preview/results, preserved identifier/provenance, values-only handling, deferred formats and template/reused mapping are represented.

Label-only rows do not silently establish identity on re-import. Location matching preserves hints/Awaiting placement without fabricating coordinates, optical inputs, connections or field verification/test outcomes. Existing verified-data, archive, shared-conflict and bulk-cleanup safeguards remain linked. OQ-10 is resolved; OQ-9 and the new browser/device/task matrix are explicitly pending, with earlier numerical candidates still unapproved. Status remains draft 0.24/guided refinement, without a claim of importer implementation, acceptance success or finalization. This was a narrow documentation reconciliation only.
