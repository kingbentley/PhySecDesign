# Delivery and lifecycle reconciliation

Reviewed 2026-11-17 against unchanged PRD draft 0.27 and its addendum. Scope: original delivery-and-reviews/project-docs evidence; commissioning and existing-site direction; accepted checklist/retest/work-scope, lifecycle, inventory, export and recovery decisions. Static document reconciliation only. No main-document/application edits, test execution, browser storage or private review-data access.

## Result

**No substantive accepted capability omission, policy conflict, or unsupported implementation/acceptance claim found in prd.md + addendum.md within this scope.** The documents distinguish the browser-local prototype from required hosted collaboration, commissioning, lifecycle archives, complete exports and recovery. Linked evidence preserves historical QA limits and the unverified comparison defect. One adjacent source-index status correction and two optional terminology changes are listed below; none requires a new product decision.

## Captured themes

| Input/theme | Current coverage | Reconciliation |
| --- | --- | --- |
| Original surveys and evidence | FR-20; addendum.md:43; FR-34; NFR-2 | Device/floor context, measurements, notes/photos and preservation through removal remain. New original-plus-preview retention is explicitly future work; old resized-only evidence is not presented as an original archive. |
| Original BOM, accessories, labor and CSV | FR-17/18/45; addendum.md:199 | Manual accessories/optional labor, inclusion without deletion and separate CSV remain. Accepted scoped quantities, unpriced unknowns, retained-asset exclusion, deliberate carryover and distinct cable supply basis supersede the original all-project purchase model. |
| Original capacity planning | FR-19; addendum.md:39; FR-51 | Bitrate/retention versus simultaneous bandwidth, port/power limits, retained demand and unassigned/unknowns remain. Expanded physical-interface and stream accounting is required behavior, not claimed implemented topology. |
| Original persistence, revisions and review | FR-21–25; addendum.md:7–17 and :45–57 | Browser draft/full backup versus reduced local review snapshot is explicit. New shared saved-state/conflict/guarded undo rules replace insufficient local mechanisms without asserting implementation. Fixed-version links, revocation, comments and decision history remain; unverified attribution and separate permissions are clear. |
| Initial commissioning/continuing property | UJ-1–4; terms/state tables; FR-26–38 | Solo workflow and optional handoff/approvals, separate installation/configuration/test states, actual field edits, fixed issued/closeout records, project/device archives and later work are represented. |
| Existing-site survey and planned work | FR-39–41; FR-17/19/35; addendum.md:59 | Unknown legacy data/provenance, fixed surveyed baseline, stable same/new physical identities, retained/relocate/service/replace/remove/add actions and explicit current/proposed basis are present. Planning cannot invent physical work, erase retained demand or double-count replacements. |
| Checklist and pass criteria | FR-29–31/43; addendum.md:99–145 | Common/type/generic starters, project-defined methods/expectations, four outcomes, Needs definition readiness, required evidence, independent phase progress, no-checks-in-scope and scoped site observations are covered. No universal hardware criteria or modeled-analysis Pass is inferred. |
| Targeted retest | FR-28/44; addendum.md:147–183 | Proposed/actual/correction distinctions, small trigger table and manual affected-check review, old outcome preservation, current-context follow-up and concurrent-change safeguards remain. Undo/restore/approval cannot silently requalify old Pass evidence. |
| Work scope and issue carryover | FR-17/32/38/45/46; addendum.md:185–221 | One active work cycle, multiple revisions, Work now/Inspect-test only/Reference only, fresh quantities and stable issues with Include now/Defer/Resolve are present. Deferred faults remain outstanding; unknown inventory is not automatically a fault or blanket recommissioning mandate. |
| Design and closeout delivery | FR-33/34; addendum.md:223–257 | Both presets, defaults, current-scope attempts/relevant older evidence, all-floor versus Partial, evidence-limited summaries, optional costs, photos, property-wide faults and capacity, same source/cutoff and exact retained editions are present. PDF/CSV/editable backup are distinct; export grants no approval or closure. |
| Cable/device lifecycle | FR-35/36/53; addendum.md:492–520 | Actual removal versus proposal, retained run identity/history, explicit reuse/reassignment, occupancy versus removed-device demand, known downstream dependencies, validated reconnection and required follow-up remain. No automatic cable deletion, free port, inherited evidence or current Pass. |
| Restoration and cleanup | FR-54/55/59/60; addendum.md:522–575 and :650–666 | Stable floor identity and confirmed destination, cancellation leaving the device archived, retained old context, quick eligible draft deletion, issued proposal cancellation, auditable correction, protected dependency/history checks and guarded undo are represented. Import-only placement does not bypass archive restoration. Container deletion has its own stricter eligibility. |
| Current issued design | FR-26/45/61; addendum.md:668–676 | One deliberate current issue per active scope, Not issued before issue, field-entry visibility, fixed superseded history, no inherited approval, guarded concurrent designation and unchanged working installation are present. |
| Spreadsheet intake and reconciliation | FR-56–59/62; addendum.md:623–690 | CSV/.xlsx sheet/header/mapping, minimum label-or-ID, unknowns, values-only parsing, source provenance, selected-row previews/outcomes, duplicate-safe stable-ID matching, verified-value protection, import-only Awaiting placement and protected bulk cleanup are present. No inferred coordinates, connectivity, optics or field-test Pass; no archived auto-reactivation. |
| File/media/export/recovery acceptance | FR-4/6/20/21/33/34; NFR-2/4/6; acceptance tables; addendum.md:742–782 | Original retention, per-volume/edition/project/backup budgets, independent transfer/processing clocks, durable output completion, daily seven-generation/pre-maintenance backups, ordinary-save durability, 24-hour catastrophic point and prepared 60-minute isolated recovery are consistent with the final accepted extraction. Revoked access cannot be reactivated by recovery. |

The final accepted file numbers match: 100 MiB source PDF; 25 MiB source image/photo; 10 MiB inventory; 250 pages/100 MiB per PDF volume; 1 GiB edition; 8 GiB retained project; 10 GiB final backup with 8 GiB payload. Processing targets also match: PDF preview 30 s, photo processing 10 s, inventory preview/application 30 s each, retained edition 5 min, portable backup 10 min and post-upload validation/restore 15 min. These remain acceptance targets, not measured capability. Source: sources/confirmed-file-recovery-extract.md:11–62; prd.md:590–613; addendum.md:746–782.

## Actual gap and minimal fixes

### DL-1 — Adjacent source-index row still describes accepted numerical targets as pending

- Location: source-index.md:56, Larger-site scale extract row: numerical thresholds “remain pending and capacity unverified.”
- Current accepted policy: prd.md:574–613 and :667; addendum.md:710–782 confirm the numerical performance, file/export and recovery targets while preserving unverified implementation/capacity.
- Minimal fix: change the row to say its historical numerical proposals were subsequently confirmed/refined in the accepted extracts; measured capacity remains unverified. Alternatively explicitly qualify “were pending when this source was written.”
- Severity/scope: source-status cleanup only; no FR or product-policy gap. The underlying historical source should retain its chronology.

### DL-2 — Optional wording: distinguish already-confirmed requirements from already-implemented options

- prd.md:190 says editors retain the “existing self-approval/bypass options”; addendum.md:764 says keep the “existing Design/Closeout presets.” In context these refer to earlier confirmed product choices, not the prototype.
- The actual prototype evidence describes local approve/request-changes decisions and one printable design packet, not implemented bypass tracking or the two accepted delivery presets (sources/delivery-and-reviews.md, shared review/PDF sections; addendum.md:12–15 and :49).
- Minimal optional edit: replace “existing” with “confirmed” in these two phrases. No new behavior is needed: FR-23/25 and FR-33 already specify the accepted behavior, and the document-wide implementation boundary is clear.
- Severity/scope: terminology precision only; not a substantive unsupported implementation claim in the complete document.

## Evidence caveats retained correctly

- The original current-state limits—one IndexedDB draft, 40 undo steps, 20 revisions, 100 MB portable JSON, reduced 64 MB review snapshots and resized survey images—are labeled prototype mechanisms, not permanent new retention limits (addendum.md:11–15, :43–49).
- The local review API is explicitly separate from static Sites hosting and full shared project editing (addendum.md:7–17). Full issue/closeout/package/recovery state is new work.
- The potential missing VideoCamera import in RevisionPanel remains an unconfirmed static defect candidate in sources/draft-baseline-extract.md:38 and source-index.md:130, referenced by addendum.md:801. It is not presented as reproduced, fixed or a new product requirement. No runtime work is necessary for this source reconciliation.
- Historical QA, stale README statements and unperformed present-day acceptance are preserved as evidence boundaries (sources/project-docs.md:63–101; addendum.md:799–805). No old pass is used to establish the new delivery/lifecycle acceptance targets.
- External commissioning/asset references support patterns only. Optional approvals, manual technician observations, explicit outstanding-items closure and the absence of a PSP/compliance claim remain intact (prd.md:37, :237, :333, :675; addendum.md:125, :145, :183, :803).

## Inputs inspected

Original sources: sources/delivery-and-reviews.md and sources/project-docs.md. Later sources: commissioning-context; confirmed-access-existing-site; confirmed-checklist; confirmed-retest; confirmed-work-scope; confirmed-export-package; confirmed-cable-lifecycle; confirmed-floor-restoration; confirmed-draft-deletion; confirmed-inventory-import; confirmed-import-placement; confirmed-import-reconciliation; confirmed-container-deletion; confirmed-current-issue; confirmed-spreadsheet-scope; confirmed-file-recovery extracts. Associated export/connection/recovery digests remain linked reference context, not additional requirements. Current prd.md and addendum.md remained byte-for-byte unchanged throughout this pass.
