# Confirmed work-scope, costing and issue-carryover extract

Recorded 2026-11-17 for guided PRD refinement. Sources: [current PRD](../prd.md), the preceding OQ-5 recommendation in the [addendum](../addendum.md), the [canonical memory](../.memlog.md), and Kevin's latest explicit confirmation: “Yes, let's use that approach for the POC and add it to the PRD. What do you recommend for the design and closeout export packages next?” Export baseline evidence additionally comes from [delivery and reviews](delivery-and-reviews.md).

**Decision status:** OQ-5 is accepted at the product-behavior level; preceding pending labels are superseded. The user requests an OQ-6 recommendation, not acceptance of any new export manifest/layout. Keep OQ-6–OQ-9 open, preserve stable FR IDs and draft status, and distinguish implementation evidence from future requirements. This extraction changes no main documents or application files and reports no new test pass.

## Accepted work-scope model

- Keep one active named work scope inside the continuing property project. Initial work and each later reopened work cycle have their own scope, estimate and evidence.
- Several named design revisions/alternatives can belong to one scope. Saving another layout does not create another job or duplicate costs. Earlier issued scope/revision/closeout records remain fixed.
- Use three scope categories, separately from the existing planned-action choices:

| Scope category | Accepted meaning |
| --- | --- |
| **Work now** | Add, relocate, service/reconfigure, replace or remove equipment/routes; include relevant parts/supply quantities, optional labor, applicable installation/configuration/tests and required retests. |
| **Inspect/test only** | Selected existing equipment receives scoped checks and optional inspection/testing labor, without an automatic hardware purchase. |
| **Reference only** | Retained unchanged installation remains property context and contributes applicable coverage/capacity; no automatic purchase or recommissioning. |

Preselect planned changes transparently and allow editor adjustment with a recorded reason for meaningful scope changes. Recompute the current estimate/checks without rewriting fixed issued scopes or creating an approval gate. Unknown baseline details stay visible but do not automatically become failures/work orders.

Reference only cannot clear an affected dependency's required retest or unresolved failure. Use the accepted targeted-impact rules; include relevant work/checks or explicitly defer the still-outstanding item. Scope selection is not a test outcome or issue-resolution action.

## Accepted estimate treatment

- Charge this scope's selected new/replacement hardware/cable, accessories and optional labor. Retained equipment/cable is not purchased again merely because it remains on the plan. Relocation, service and removal may carry explicit parts/labor.
- Reuse unit rates when useful, but start fresh quantities; carry prior quantities only when an editor deliberately copies selected lines. Preserve historical estimates with fixed revisions/closeouts.
- Show unknown prices as unpriced, not a known zero price. Continue presenting estimates as planning allowances rather than supplier quotes or live vendor prices.
- Distinguish installed/drawn route length from cable supply quantity. Extending a 10 m route to 12 m does not establish that only 2 m must be purchased; a full replacement run may be needed. Record selected supply quantity and basis explicitly and include slack once.
- This acceptance does not add automatic engineered supply calculation, procurement integration, tax/freight policy or mandatory labor inclusion.

## Accepted property issues and closeout

- Maintain property issues with stable IDs linked to devices/checks/work scopes and earlier attempts. Reopening carries unresolved issues forward without duplication or changes to earlier closeout snapshots.
- **Include now:** add relevant work/checks and costs to current scope.
- **Defer:** retain the issue as open with a brief reason and optional owner/due date. Keep it visible in remaining-work summaries, closeout and later work.
- **Resolve:** record corrective work plus appropriate current evidence/retest, preserving the original failure and linking its resolution/new attempt.
- Correct mistaken or duplicate issue records with explanation and actor/time, linking the canonical issue where applicable. Correcting an issue record does not turn a real test failure into Pass.
- Archive/replacement alone does not resolve an underlying requirement gap. Record how completed work addresses that requirement and its necessary checks. Do not add an accepted-risk action that silently closes a genuine unresolved defect.
- Keep In progress, Completed and Closed with outstanding items. **The selected scope can be finished while property closeout remains Closed with outstanding items** because documented deferred/out-of-scope issues are still open. Retain the closeout note and list.
- Completed requires no documented unresolved issues or required unfinished checks under the accepted completion rules. Scope edits cannot make a known fault disappear.
- This does not require blanket testing of every legacy device. Unknown inventory attributes/unscoped tests remain distinct from documented faults and required follow-ups. Optional approvals remain separate and do not clear issues or tests.

## Affected requirements

| Requirement/group | Accepted refinement |
| --- | --- |
| **Terms/lifecycle state definitions and FR-32** | Distinguish scope progress from property closeout; deferred/out-of-scope documented issues remain outstanding. Do not let existing in-scope shorthand suggest scope exclusion permits Completed with known unresolved issues. |
| **FR-17–FR-18** | Scope-specific quantities, explicitly unpriced unknowns, retained-asset exclusions, selected copying of old lines, explicit cable supply quantity/basis and single slack allowance; labor remains optional. |
| **FR-22/FR-38** | Several design revisions may share one work scope; reopening establishes a fresh work cycle with preserved history, scoped costs/checks and nonduplicated open issues. A layout revision alone is not a new job. |
| **FR-28/FR-31/FR-44** | Reference-only or deferred status cannot satisfy required impact review/retest, hide a failure or rewrite test outcomes. Resolution uses appropriate current evidence; prior results remain. |
| **FR-33/FR-34** | Preserve issues, dispositions, scope identity and evidence relationships in closeout/history/backups; printable package details still belong to OQ-6. |
| **FR-35/FR-36/FR-37** | Archive/replacement/project archival preserve issue identity/history; device retirement alone does not establish resolution of the underlying gap. |
| **FR-40/FR-41** | Work scope is distinct from planned actions and actual state; reference equipment remains in applicable current/proposed analysis/capacity despite exclusion from purchases/testing scope. |
| **Potential appended work-scope/issue requirements** | Give active scope selection and stable property-issue dispositions clear observable rules without renumbering FR-1–FR-44. Connect scope categories, retained context, estimating and fixed historical records. |

## Four integration risks

1. **Scope finished versus property Completed.** Explicitly reconcile the old in-scope completion phrasing with the newly accepted deferred/out-of-scope issue rule. An upgrade can be finished while its closeout is Closed with outstanding items. Unknown inventory/unselected tests must not be inflated into documented defects or blanket recommissioning requirements.
2. **Scope category versus action/evidence.** Work now/Inspect-test only/Reference only classify scope, while retain/relocate/service/replace/remove/add describe planned work. Neither categorization can alter actual conditions, clear a required retest, erase a failure or turn a planned replacement/archive into evidence-backed resolution.
3. **Route geometry versus supply/cost.** Do not charge all retained route length, assume only the length delta is bought, double-apply slack, duplicate old quantities on reopen, or display unknown prices as known zero. Keep supply basis and historical estimates visible.
4. **Issue disposition versus test history.** Defer stays open; Resolve needs current relevant work/evidence; mistaken/duplicate correction retains audit context and canonical linkage. None changes a historic outcome, waives a real unresolved failure through accepted risk, modifies a fixed closeout or creates mandatory signoff.

## OQ-6 input: already-confirmed export outcomes

The following commitments already exist and should constrain the next recommendation rather than be presented as new unresolved product choices:

- FR-33 requires selected/all-floor labeled PDF plans, coverage/DORI legends, zones, equipment/cable schedules, survey notes and optional photos, extended to communicate actual installation/configuration/testing, field changes, approval/bypass and remaining work.
- Package metadata identifies project, revision, current/proposed analysis basis, issue date, units and closeout outcome where applicable. Plan IDs must connect to schedules/evidence. Modeled coverage remains labeled as an estimate.
- Field/configuration/test evidence and outstanding-work inclusion are confirmed. A-1/OQ-6 leave summary/detail level, precise sections/layout, photo pagination and cost/capacity inclusion open.
- Fixed closeouts retain installation/drawings/schedules, estimates, evidence, changes, approvals/bypasses and outstanding items. **Retaining estimates in a fixed closeout record is distinct from requiring a cost section in every printed/share package.**
- Required follow-ups and now-accepted deferred/out-of-scope issues remain visible in closeout exports. Older packages cannot be rewritten by later changes/dispositions.
- FR-34 distinguishes printable PDFs, materials/estimate CSVs and complete editable portable backups. Future complete backups preserve stable IDs/relationships, attachments, named/issued/closeout history, removed devices and lifecycle evidence, without access credentials.
- NFR-6 requires source-version/units clarity, readable labels and evidence relationships, and visible export failures rather than silently presenting incomplete output as complete. Historical package retention versus reproducible regeneration remains OQ-6.

## OQ-6 input: observed implementation boundaries

These are static baseline findings from the delivery digest/addendum, not newly accepted requirements or fresh verification.

| Area | Current evidence | Consequence for OQ-6 recommendation |
| --- | --- | --- |
| PDF selection/preview | Current/all-floor export, Letter/A4 landscape, combined visibility/DORI/no coverage choices, optional survey photos; progress/cancel/page preview. | These mechanisms are a starting point. Do not claim the expanded lifecycle packet exists already. |
| Current packet contents | Labeled plans, equipment/cable schedules, zone requirements and survey notes/measurements/photos; long content continues onto pages. | Existing packet has **no capacity, cost/BOM or shared-review-decision sections**. Field/test/issue records require new composition work. |
| Plan rendering | Imported image plus devices/routes/zones/walls/survey references, metric scale/north/legend/source-sheet identity; schematic fallback if no drawing and warnings for image failure. No live basemap tiles. | Do not promise embedded satellite/map imagery or silently drop failed source images. |
| PDF format | Raster pages at 216 dpi, JPEG quality 0.94, PDF 1.4; no selectable/searchable text or editable vector layers. | Current output is a static document; searchable/vector output is not established or silently committed. |
| Coverage output | Recomputed planning coverage with sampling/excluded-camera disclosure; requested 0.75 m grid, maximum 10,000 cells. | Do not represent report coverage as exact engineering/field evidence; these existing numeric limits are not newly fixed acceptance targets. |
| Export size | Aborts after accumulated encoded JPEG page bytes exceed 80 MiB before final assembly; not a precise final-file-size cap. | Package size/photo pagination/recovery limits need explicit design; do not promise arbitrary packet size. |
| Photo evidence | Browser-processed metadata-free bounded JPEG previews, not archived originals; six photos/note and aggregate encoded limits in baseline. | Do not imply original-resolution or original-metadata evidence is already retained. Future retained evidence policy and readable pagination need definition. |
| Materials CSV | Estimate lines with item/category, proposed/existing quantity, unit, USD unit cost/line total; optional labor inclusion retained in saved estimates. | CSV is materials/estimate output, not an equipment/cable schedule export or editable full backup. Separate schedule CSVs are neither established nor committed. |
| Portable backup | Current v2 normalized project JSON embeds drawings/records/photos/full named revisions; v1 migration supported; 100 MiB file limit, repeated snapshot assets can duplicate size. | Future lifecycle backup must extend existing schema and migration; storage limits are not accepted lifecycle retention guarantees. |
| Review representation | Fixed but reduced layout snapshot omits survey/photos, costs, capacity, detailed models/notes/optics and analysis settings. | A reviewer link is currently not a complete design/closeout packet or full backup. Define shared package scope deliberately without implying omitted evidence is already present. |
| Review portability | Existing server review comments/decisions and owner/reviewer access are separate from project backup. Current portable data excludes review rooms and credentials. | Future preservation of review/approval history is new work; credentials still must remain excluded. Link revocation cannot remove previously recorded decision history. |
| Record identity | Full named revisions, reduced review snapshots, fixed issued references and fixed closeout records are distinct. | Packages need explicit source scope/revision/basis and fixed history; never equate PDF/CSV/review links with the editable project archive. |

## OQ-6 questions still pending

Recommend an explicit design/installation packet and a closeout packet, but keep the proposed manifest, default inclusions, detail/appendix choices, cost/capacity presentation, photo layout and historical-package retention/reproduction pending until Kevin responds. Define whether the shared revision-review experience receives the same selected information or a stated subset; do not assume current layout-only review provides parity. Do not silently add new output formats, automatic original-evidence retention, editable CAD/vector exports, basemap licensing, separate schedule CSVs or universal compliance certificates.

Any package recommendation should preserve already-agreed actual-condition/evidence/issue truth, optional approvals, confirmed demo-data/access limits and consistent saved snapshot rules. OQ-6 acceptance has not occurred. OQ-7–OQ-9 likewise remain open.

## Narrow reconciliation against draft 0.6 — 2026-11-17

**Result: no actionable discrepancies found in the accepted OQ-5 integration.** Reviewed the relevant PRD/addendum clauses and current index/conversation status only; no broad package critique, main-document edit, application test or finalization was performed.

- **Scope versus actions:** FR-45 explicitly separates Work now/Inspect-test only/Reference only from planned actions and actual installation/test state. It preserves reference analysis/capacity, optional inspection labor, meaningful-change history and affected dependencies. FR-38 keeps multiple design revisions within one active work cycle without duplicate jobs/costs.
- **Quantities and historical costs:** FR-17 requires scope-specific supply quantities, explicitly unpriced unknowns, deliberate copying of earlier lines, installed-length versus supply distinction, a retained quantity basis and slack exactly once. Its check covers full replacement-run estimating rather than an automatic route-length delta. Prior fixed estimates remain preserved.
- **Deferred faults versus completion:** The Outstanding item/Completed definitions and FR-32 explicitly include documented deferred/out-of-scope property issues. Finishing a selected scope cannot produce Completed while such issues remain; Closed with outstanding items remains available. Unknown inventory and unscoped tests remain distinct from faults. Approval optionality is unchanged.
- **Issue evidence/history:** FR-46 keeps stable linked IDs, nonduplicated carryover, open reasoned deferral, evidence-backed resolution and auditable mistaken/duplicate corrections. Archive/replacement/scope changes do not silently resolve real defects or alter test outcomes; earlier closeouts remain fixed.
- **Next decision boundary:** PRD, addendum, source index and latest conversation section identify OQ-5 as accepted and OQ-6 as pending. FR-33/34, A-1 and NFR-6 retain the previously confirmed export outcomes while the new package presets, defaults, pagination and exact-file retention remain explicitly proposed. OQ-6–OQ-9 stay open.

This records consistency of guided draft 0.6; it does not accept the pending OQ-6 export proposal or verify its implementation.
