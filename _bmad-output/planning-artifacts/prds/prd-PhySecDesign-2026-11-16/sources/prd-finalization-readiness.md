# PRD finalization readiness — narrow extraction

Recorded 2026-11-17 against draft 0.17. This is a readiness note, not finalization, a new full rubric review, implementation verification, or acceptance approval.

Inputs: [source index](../source-index.md), [canonical decision log](../.memlog.md), [current PRD](../prd.md), [addendum](../addendum.md), [review disposition](../review-disposition.md), and the installed BMAD PRD finalization instructions. The latest user confirmation supplied for this extraction accepts the small functional fixture plus the larger real-site scale fixture; it does not approve the remaining numerical metrics or limits.

## Verdict

The functional/product scope is substantially settled. OQ-1 through OQ-8 are resolved, and the latest confirmation settles the two-fixture acceptance approach and its real-site profile. OQ-9 now concerns the remaining acceptance expectations and operating limits, followed by a final document-wide reconciliation/review/polish pass. The software does not need to be implemented or pass acceptance tests before the requirements document can be finalized.

## Confirmed — do not ask again

- One small, repeatable functional fixture plus a larger scale fixture for one property: approximately 10 buildings, 600 total devices including 150 physical cameras, approximately 20–30 plans, up to about 60 cameras on the busiest plan, and one usual/two simultaneous users.
- The 55 functional requirements and settled workflow decisions: optional approvals/handoff, shared demo access, direct field updates with preserved issued design, independent test evidence, explicit closeout, continuing property/work scopes, existing-site planning, equipment and bounded camera analysis, physical routes, archives/restoration and guarded deletion.
- Core correctness and data-integrity behavior already stated in the FRs/NFRs, including preserved acknowledged work and history, visible unknowns/unassessed analysis, no duplicate counting, and complete/versioned deliverables.
- PSP documents or a certification claim are not prerequisites for this noncompliance POC. Domain/manufacturer values and checklist wording can be completed through normal implementation/domain setup without reopening the accepted checklist model.

## Remaining product-level acceptance choices

These are one remaining group, OQ-9, rather than additional feature discovery. The old numerical proposal is expressly unapproved and was sized around a smaller workload.

| Choice | What remains to agree | Suggested ownership / timing |
| --- | --- | --- |
| Supported acceptance environments | Which desktop browsers and real phone/tablet configurations must pass the respective design/field tasks, and which focused usability/accessibility checks form the POC baseline. Mixed device classes and online operation are already confirmed; exact versions are not permanent PRD commitments. | Kevin + UX/engineering; record the accepted scope or explicit deferral before final handoff, then lock test versions in the acceptance plan. |
| Responsiveness and analysis quality | User-visible save/peer-update, plan interaction, busiest-plan analysis and long-job expectations, paired with fidelity/accuracy conditions. Do not adopt the earlier small-fixture timing table or improve apparent performance by silently coarsening analysis or removing evidence. | Kevin + engineering; approve target expectations, or explicitly defer their quantified envelope to architecture/test planning before related implementation commitments. |
| Media/report/backup envelope and recovery | Practical input/output limits that accommodate the larger site while preserving complete required evidence/history, plus acceptable catastrophic data-loss window/recovery time and backup retention. Ordinary restart durability is already required. | Kevin + engineering; approve or explicitly defer quantified budgets/recovery policy before architecture/storage commitments and the acceptance plan. |

There is no need to make Kevin choose every byte count or benchmark parameter now. For finalization, choose one clear disposition: adopt a revised measurable acceptance envelope, or carry explicitly named engineering-owned targets with revisit conditions into the downstream plan. A final PRD may contain owned nonblocking deferrals; it must not silently present old candidates as approved, promise unmeasured support, or describe unresolved scope as ready for unconditional implementation.

## Details that can remain downstream

- Exact fixture manifest: precise plan count/areas, analytical heads/views and configured streams separate from physical cameras, barriers/vertices/zones, runs/segments/risers, ports, photo/test/revision/package counts, and aggregate bytes. Derive this from the accepted property profile; do not reinterpret physical camera counts as view or stream limits.
- Test mechanics: recorded hardware/browser builds, connection conditions, cold/warm trials, percentile/sample protocol, provider-latency separation, reference calculations, photo/PDF examples and failure-injection steps. These belong to an engineering-owned acceptance plan.
- Architecture: hosting vendor, storage/container structure, update transport, conflict implementation, processing/rendering strategy, media deduplication, backup mechanics and restoration tooling. They must satisfy the agreed product behavior; selecting them is not prerequisite feature elicitation.
- Detailed visual styling, pagination implementation, final starter-check wording and project/manufacturer-specific values. Their required behavior and relevant defaults are already defined.
- Actual benchmarks, functional tests, load tests, backup restoration and field demonstrations. They establish later software acceptance, not whether the PRD may be marked final.

## Final document work still needed

1. **Synchronize the latest confirmation.** Record the two-fixture decision through the canonical memory script and remove current statements that the acceptance approach itself is pending. In draft 0.17 these remain in A-2/OQ-9, the acceptance introduction, the addendum's acceptance heading/body/conclusion, and source-index summaries. Leave metrics/limits visibly unapproved. Preserve historical proposals as history rather than rewriting the log.
2. **Audit decisions and reconcile inputs.** Walk the canonical log against the PRD/addendum, explicitly capture or set aside each item, and reconcile the original app/conversation/design inputs plus the later confirmed refinements. The first-draft full review predates FR-39–55; focused reconciliations are useful but do not replace a final cross-document consistency pass.
3. **Run the final reviewer pass and triage.** Check the complete current document for contradictions and missing accepted behavior. Resolve product/phase blockers; record owner and revisit condition for nonblockers. Reconcile OQ-9's disposition without reopening OQ-1–8.
4. **Polish structure, then prose.** The main PRD and addendum grew through successive confirmations. Consolidate repetition and historical open-question narration while retaining stable FR IDs, accepted scope, evidence boundaries and decision history. Perform ID/link/status checks after edits; polish is document work, not new product discovery.
5. **Close only after that work is complete and finalization is authorized.** Apply configured handoffs/hooks if any, set the final status/date, append the finalization event through the memory script, and share the artifacts. The current request asks what remains, so this extraction leaves draft status untouched.

## Evidence boundary

Read all 148 inventoried source files for this extraction's drift check: 147 fingerprints match; only the previously recorded .gitignore policy change differs. No application-source drift was found. No app code, tests, builds or load measurements were changed/run. Only this readiness note was written; the PRD, addendum, log and review records were not modified.

## Status after draft 0.18 update

The scale/fixture confirmation is now synchronized in NFR-4/SM-5/resolved A-2, addendum and source context, with its canonical decision recorded through the memory script. Readiness step 1 is complete. Remaining acceptance-policy decisions and final reconciliation/reviewer/open-item/polish work are unchanged; no full finalization review or application acceptance has been performed.
