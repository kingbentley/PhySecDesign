# Confirmed POC scale-test approach — source extract

Prepared 2026-11-17 against PRD draft 0.17. Narrow extraction of the newly accepted smaller-functional-plus-larger-real-site testing approach. This is not a full PRD finalization review, implementation claim or completed performance test.

## Decision authority and source review

The latest user accepted using the real-site profile for the POC's larger scale test (“Yes, add it to the PRD”) and asked what remains before finalization. This confirms the approach previously proposed in NFR-4/A-2, the success section and the [addendum](../addendum.md): retain smaller functional fixtures **and** include a larger scale fixture based on the supplied property. It supersedes pending labels for that approach in draft 0.17 and [large-site-scale-extract.md](large-site-scale-extract.md). Earlier extraction/reconciliation entries remain historical.

Read the current [source index](../source-index.md) and the complete current [canonical log](../.memlog.md), 59,674 characters at this read. The previously fully reviewed 54,003-character decision body is unchanged; read the updated header and all subsequent entries as well. The latest acceptance is supplied by the current user turn and is newer than the log's final draft-0.17 event.

The parent's fresh 148-file audit found 147 unchanged and the same .gitignore-only drift. This is source freshness, not runtime evidence. No application-source changes or tests are implied.

## What is now confirmed

| Aspect | Confirmed testing approach or supplied profile | Boundary |
| --- | --- | --- |
| Two fixture sizes | Smaller functional projects for repeatable lifecycle/integrity checks, plus a larger real-site scale fixture in POC validation | Passing the small fixture alone cannot establish readiness for the representative larger property. “About 50” small-fixture assets remains an illustrative implementation choice, not a newly fixed limit. |
| Property model | One continuing property project containing ten buildings | No artificial division into ten independent projects to fit the older sample. This is a representative test profile, not a permanent maximum. |
| Equipment | 600 total devices, **including** 150 physical cameras | Do not count 750 devices or derive view/stream counts from body count. Active/proposed/archived mix and detailed device distribution still need a declared fixture. |
| Plans | 2–3 floor/site plans per building, approximately 20–30 total | The total is an arithmetic estimate; declare the chosen exact manifest and plan areas rather than silently selecting or implying a verified exact count. |
| Busiest plan | Up to about 60 physical cameras on one plan | Supported heads/views, unsupported panoramic outputs, streams and geometric workload are separate. No implied 60-view or 60-stream limit. |
| Concurrent use | Usually one user, occasionally two simultaneous users | Preserve shared-conflict/evidence/access checks. The superseded two-editors-plus-third-reviewer example is not required by this decision. Specific two-user role/action combinations can be specified in the test plan. |
| Existing requirements | All confirmed feature, evidence, identity, access and honest-analysis semantics continue to apply | Scale testing does not permit truncated records, hidden outstanding work, reduced evidence, property splitting or silently coarser analysis to manufacture a pass. |

The earlier two-building/100-device example is superseded as the representative larger-site test. Current support at 600 devices/150 cameras is **not** proven by accepting the test requirement; engineering must later provide evidence. Increasing a numeric configuration cap alone does not establish performance.

## Minimal main-document mapping — no new FR

| Location | Minimal update |
| --- | --- |
| **NFR-4** | Change the scale profile from merely planning input awaiting fixture confirmation to the **confirmed POC validation profile**, exercised with smaller functional fixtures and a larger test. Retain explicit pending workload/fidelity/timing/file/recovery decisions and no untested-capacity promise. |
| **A-2** | Rename/reframe as confirmed acceptance-fixture approach. Retain exact stated physical counts and approximate plan/busiest-plan qualifiers. Explain that analytical/evidence manifest and pass thresholds remain unresolved under OQ-9. Do not preserve wording that the two-size approach itself still awaits approval. |
| **POC success introduction / SM-1** | State that workflow checks use manageable fixtures and POC validation also includes the confirmed larger-site fixture; small-project success alone does not demonstrate the larger case. Avoid requiring every small numerical reference case to use the full large dataset. |
| **SM-4**, if useful | Tie shared-use validation to the supplied one-usual/two-concurrent scenario while retaining independent edits, conflicts, evidence, durable saves and guarded Undo. Do not reinstate an automatic third participant. |
| **Addendum and source context** | Separate **confirmed fixture approach/profile** from **pending workload and measurable limits**. Update the introductory, fixture-table and closing pending language narrowly. Preserve candidate labels around device/browser, accessibility, timing, media/report/backup and recovery proposals. |
| **OQ-9** | Keep open, narrowed to detailed workload/measurement conditions and remaining acceptance thresholds. OQ-1–8 remain settled. |
| **FR-1–55** | No new FR or functional-scope rewrite is needed for this acceptance-planning confirmation. |

A compact replacement intent is: “POC validation uses smaller functional fixtures plus a larger test representing one property with 10 buildings, 600 devices including 150 physical cameras, approximately 20–30 plans and up to about 60 physical cameras on its busiest plan, with one usual/two concurrent users. Detailed workloads and measurable acceptance limits remain OQ-9; the test requirement does not claim existing support.”

## Still unconfirmed within OQ-9

This acceptance does **not** adopt every neighboring recommendation:

- **Analytical and evidence workload:** exact selected plan manifest/areas, camera heads/views/streams, barriers/edges, zones/vertices, realistic cable/port topology, photo/check/history/package volumes and combinations.
- **Timing and measurement conditions:** per-operation thresholds, hardware/network conditions, repeated-trial rules, cold/warm cases and whole-property versus selected-plan boundaries. Earlier 250 ms/2 s/5 s/3 s and long-job values remain candidates, especially the older 20-view analysis example.
- **Fidelity and calculation tolerances:** effective sampling, numerical-reference tolerances and explicit handling of unsupported inputs. Do not silently exchange fidelity for speed.
- **Browser/device and focused accessibility acceptance:** phones/tablets/laptops and online operation are already confirmed, but the detailed Chrome/Edge/Safari/Android matrix, versions/hardware and proposed measured usability/accessibility targets have not been approved by this scale decision.
- **File, report and backup budgets:** source/processed media, aggregate retained evidence, report bytes/pages, complete retained-package/history backup, and resource failure behavior at the selected larger workload. Old small-fixture byte figures are unapproved candidates, not automatically suitable larger-site budgets.
- **Recovery schedule and objectives:** proposed daily/seven-generation backups and catastrophic recovery time/point still need agreement. Existing durable Saved semantics across browser closure/ordinary restart remain confirmed and must not be weakened.

The remaining PRD work is to make this acceptance contract concrete and agree its pending parts, then perform the appropriate final document review. Actual load/acceptance testing is later implementation evidence; it must not be fabricated or confused with approving the PRD. This extraction does not perform that final review or declare the PRD finalized.

## Consistency risks

1. **Over-broad acceptance:** “Yes” confirms the scale-test approach, not all earlier browser/timing/storage/recovery numbers.
2. **Count confusion:** physical bodies versus views/streams; 150 included in 600; approximately 20–30 plans and about 60 on the busiest plan retain their qualifiers.
3. **Too-weak success evidence:** keep the large test mandatory in the agreed validation approach; successful small fixtures alone are insufficient for the representative-site claim.
4. **Premature capacity/finalization claim:** a required test profile is neither a product cap nor a passed benchmark. Keep OQ-9 open for remaining decisions, retain draft status and do not modify the 55 FRs.

Only this extraction was written. No main-document edits, application changes/tests, research, extra agents or broad finalization review were performed.

## Focused reconciliation — PRD draft 0.18 (2026-11-17)

No actionable discrepancies found.

NFR-4, SM-5 and resolved A-2 now confirm smaller functional fixtures plus the larger real-site test: one continuing property with about ten buildings, 600 total devices including 150 physical camera bodies, roughly 20–30 plans, up to about 60 cameras on the busiest plan, and one usual/two concurrent users. Analytical heads/views/streams remain separate, with exact geometry/evidence manifest construction assigned to engineering. SM-5 prevents small-fixture success from substituting for the representative scale test, without claiming an already-passed benchmark or permanent product cap.

The addendum, source index and latest context agree on the confirmed approach. Earlier timing/fidelity, browser/accessibility, media/report/backup and catastrophic-recovery candidates remain explicitly open under OQ-9; ordinary durable-save/restart semantics remain the previously confirmed requirement. OQ-9 is still open, and no blanket acceptance of surrounding numerical/browser/recovery proposals was introduced.

Verified 55 consecutive FR IDs and unchanged functional-requirements text against the previously read draft 0.17. Only NFR/success/assumption planning scope changed. No finalization or implemented-capacity claim was found within this narrow check.

Only this reconciliation was appended. No main-document edits, application tests or full finalization review were performed.
