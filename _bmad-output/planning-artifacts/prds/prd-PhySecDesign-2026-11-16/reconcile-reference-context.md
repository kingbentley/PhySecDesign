# Reconciliation — external reference context and PSP boundary

Reviewed: 2026-11-17. Target: PRD/addendum draft 0.27 and current source-index.md. Input: sources/reference-context.md, sources/commissioning-context.md, and the external-reference boundaries linked from the current documents. No new external research, application testing or main-document edits were performed.

## Captured

| Input theme | Current treatment | Result |
| --- | --- | --- |
| CCTV Design Tool: map/plan design, camera/FOV planning, routes, equipment lists and outputs | FR-3–18, FR-33/34 and FR-52 retain the relevant workflow. Prototype versus new requirements remains explicit at prd.md:35. | Captured without treating competitor capabilities as implemented Site Studio functionality. |
| SiteOwl: reusable design data, existing inventory and lifecycle history | FR-35–41 and FR-47 preserve inventory, same-asset history, replacements and camera templates. addendum.md:65 explicitly calls the detailed action/view model a Site Studio choice. | Captured within confirmed scope; no obligation to copy every vendor template, warranty or planning feature. |
| JVSG: optical/detail planning, cable quantities, capacity and exports | FR-9–19 and FR-33/34 cover the relevant planning themes. Full 3D/lighting simulation and certified calculations are excluded at prd.md:37. | No missing requirement follows merely from the comparator having broader features. |
| IPVM: observed public guest controls | The original digest retains its limitation: controls were observed, outputs and calculation accuracy were not tested. The PRD does not claim IPVM validation or copy that observation into software acceptance evidence. | Evidence boundary preserved. |
| No supplied PSP collection | prd.md:675, addendum.md:797/803 and source-index.md:128 preserve the absence of a complete review. Domain-specific checklist content requires later sources; PSP review is not silently made a PRD-finalization gate. | Captured. |
| Limited commissioning, optics and accessibility references | Optional approvals remain explicit. addendum.md:31 qualifies the IEC 62676-4:2014 DORI convention; :183/:261 separate UFGS precedent from contractual gates; :296 separates optical context from certification; :617 limits W3C checks to the tested tasks. | No unsupported compliance claim found in these passages. |
| Current numerical capacity/performance targets | prd.md:665–673 and addendum.md:797 distinguish confirmed product targets from measured capacity and future software acceptance. | No competitor benchmark or completed-testing claim inferred. |

## Actionable gaps

1. **Refresh or explicitly historicize pending labels in the commissioning digest.** sources/commissioning-context.md:7, :20 and :24 still describe completion/archive details as unsettled; :56/:66 describe OQ-7 items as pending; :82 retains an open deletion decision; :94/:98/:102 retain pending acceptance language. Later sections and current FR-49–55/NFR-3/4 contradict those as current statements. Add a clear chronological/superseded-status notice or update those clauses to the confirmed decisions, preserving the original limited-source boundaries. This is source-pack consistency, not a missing PRD requirement.
2. **Remove stale open-decision wording from the source index.** source-index.md:129 still says detailed success criteria remain guided decisions, and :177 says remaining product choices are owned open questions. The same index at :170–171 and prd.md:667–669 say all known product decisions are closed. Mark the first-draft statement explicitly historical and update the limitation paragraph to distinguish finalized requirements from unperformed implementation/acceptance work.

No additional external-input requirement gap was identified. No unsupported compliance or current external factual assertion was found in the inspected PRD/addendum passages. This finding checks consistency with the dated source pack; it is not a fresh validation of vendor offerings or standards editions. Line references identify the reviewed draft and may move during consolidation.
