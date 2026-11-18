# Confirmed performance and analysis-accuracy targets

Date: 2026-11-17. Confirmed acceptance targets during guided refinement; not measured support, an acceptance pass or finalization.

## Authority and evidence

Kevin accepted the proposed performance/analysis targets and asked for file limits, exports, backups and recovery next. This confirms the timing/fidelity portion of OQ-9; file/media/report/backup processing, transfer budgets and catastrophic recovery policy remain open. Earlier file/recovery candidates are not adopted.

Read the current [source index](../source-index.md) and [canonical log](../.memlog.md), FR-13/15, NFR-4, SM-5 and OQ-9 in [draft 0.25 PRD](../prd.md), and the latest [performance/analysis proposal](../addendum.md). The user's latest confirmation supersedes its pending timing/accuracy labels. No runtime tests or benchmarks were performed.

## Accepted timing targets

| Operation | Target | Completion boundary |
| --- | --- | --- |
| Control/selection/direct-edit feedback | 250 ms | Visible control feedback, not a claim that analysis is complete. |
| Find/filter the 600-device inventory | 1 second | Correct usable results, including selected unplaced/historical context. |
| Ordinary single-item metadata save | 2 seconds from committed edit | Durable shared acknowledgement; bulk imports and attachments are separate operations. |
| Other connected client receives the saved update | 5 seconds after durable save | Correct state without overwriting unfinished local input; conflicts remain visible. |
| Initial project open | 10 seconds | Selected saved plan/drawing/devices usable, not merely a skeleton; coverage may remain explicitly Updating. |
| Warm saved-plan switch | 5 seconds | Required plan/drawing/devices usable with cache conditions recorded. |
| Active busiest-plan combined visibility/DORI and all targeted zones after committed camera/barrier/zone edit | 10 seconds | All declared eligible views and targeted zones use current inputs at required fidelity. Partial/stale/provisional output is not completion. |

Use both confirmed fixtures and representative hardware/browser/network conditions. Record the actual active view/stream count, plan boundary/dimensions, barrier edges, zones/vertices and relevant evidence volume before measurement. The larger fixture remains one property, about 10 buildings, 600 devices including 150 physical cameras, roughly 20–30 plans, about 60 physical cameras on the busiest plan, and one usual/two concurrent users. Camera bodies do not specify view/stream workload by themselves.

Apply ordinary UI/lookup/save targets to their accepted desktop and field task environments; full combined-analysis timing is the desktop design workload. Field clients must still distinguish pending/stale analysis. Keep controls usable, show provisional drag feedback honestly, and invalidate an earlier result when its inputs change. No omission of hidden devices/zones or silent fidelity reduction may manufacture a pass.

Run at least 20 varied trials per repeated timed operation and require 19 of 20 to meet the target; retain all timings/outliers/errors. Accuracy, integrity and access behavior must pass every applicable trial. Separate cold/warm observations and third-party geocoder/map latency without counting a blocked required task as success. A target failure requires engineering or explicit renegotiation, not a changed fixture after the fact.

The prior addendum also specifies a proposed repeatable-network reference of at least 20 Mbps down/5 Mbps up and at most 100 ms service RTT. The accepted direction requires declared realistic network conditions; exact benchmark-condition wording belongs in the declared test manifest and must not become an unsupported general service promise. Keep these distinct from future file-transfer targets.

## Accepted accuracy and honesty rules

- Independently verify supported nonsingular rectilinear FoV dimensions and DORI threshold distances from the same known inputs, within 1% of the reference. Preserve current DORI conventions; this is not calibrated fisheye support or a guarantee of observed image quality.
- Verify full-polygon zone qualifying percentages within 2 percentage points of an independent sufficiently fine/analytic reference on declared fixtures, including thin/small/concave zones, shadows, height transitions, overlap and target-boundary cases.
- Use effective sample spacing no coarser than 1 m, refining further when zone size or boundary detail requires it. A 1 m grid alone does not prove accuracy; geometry/ray obstruction tests must not ignore thin walls.
- The 2-percentage-point fixture tolerance is not a certified live-zone error bound or guarantee of correct target classification. Refine or show analysis-only near-target uncertainty when error could change the decision; do not manufacture confident Target met through display rounding. Use full computed values for ordinary comparisons.
- Missing samples/unresolved geometry are not confident zeros or successful targets. Unsupported views receive no invented credit; full boundary/zone denominators and existing best-single-view DORI/union rules remain unchanged.
- Independently verify exact equipment/port/hardware counts, physical assets versus views/streams, cost arithmetic under declared currency rounding, cable components/slack once, bandwidth/storage/PoE units and compatible bases. These checks do not receive a blanket 1% or 2-percentage-point allowance; unknowns remain unknown.
- Analytical Updating/provisional/near-target uncertainty is not a fifth field-test outcome, an automatic Fail or a substitute for observed evidence.

## Minimal mapping and status updates

| Clause | Needed relationship |
| --- | --- |
| NFR-4 | Record the accepted timing/fidelity contract or link its detailed addendum; retain workload disclosure and no measured-capacity claim. |
| FR-13 | Tie disclosed sampling/effective resolution and input-version freshness to final versus provisional/uncertain analysis; retain unsupported/unassessed semantics. |
| FR-15 | Clarify boundary uncertainty/refinement and full-value threshold comparisons without changing zone denominator, unsupported-view credit or the four field-test outcomes. |
| SM-5 | Require representative-scale timed trials with the declared workload and independently checked accuracy/integrity; small-fixture success alone remains insufficient. |
| NFR-2 / FR-21/42 | Ordinary metadata save means durable acknowledgement, peer timing starts afterward, and local pending forms/conflicts are preserved. File upload timings remain separate. |
| OQ-9 / A-2 / current source status | Mark browser/usability and performance/fidelity confirmed; leave file/media/report/backup/recovery targets open. Historical earlier small-fixture candidates remain superseded/unapproved where not expressly adopted. |

## Risks and remaining boundary

1. A fast first frame, cached stale output or incomplete zone result cannot count as an open/analysis completion; timing start/end and input version must be observable.
2. A fixture's 2-percentage-point accuracy pass cannot certify a live near-threshold Target met. Preserve a clear analysis-only uncertainty route without creating a new test outcome.
3. The accepted sample maximum and busiest-plan workload may require substantial changes to the existing bounded solver. Neither current screenshots nor earlier tests establish these targets have passed.
4. Ordinary metadata/peer latency cannot be reused as a promise for photo uploads, bulk imports, PDF/report generation or backup transfer. Those limits, retained-volume budgets and catastrophic recovery objectives remain the next OQ-9 decision.

No inherent conflict with existing history/access/coverage requirements was found. FR-13/15 can be refined without new capability IDs; NFR-4/SM-5 and accepted-versus-pending labels carry most of this update.

Source freshness: all 148 inventory files checked; 147 unchanged, only the same documented .gitignore drift.


## Focused reconciliation — draft 0.26

No actionable discrepancy found in NFR-4, FR-13/15, SM-5, the main performance table or confirmed addendum block. All seven timing targets match the accepted values and completion boundaries: 250 ms feedback; 1 s lookup; 2 s durable ordinary metadata save; 5 s peer update after durable save; 10 s usable initial plan; 5 s warm plan switch; 10 s complete current-input busiest-plan combined visibility/DORI and all targeted zones. The 19-of-20 timing rule retains universal accuracy/integrity/access checks, declared workload/environment and no hidden omission/fidelity reduction.

The 1% supported optical reference tolerance, 2-percentage-point independent zone reference tolerance, no-coarser-than-1 m sampling with further refinement, exact accounting checks and separate near-threshold uncertainty are represented. Stale/provisional output is not final; display rounding cannot manufacture success, unsupported views receive no new credit, and analytical uncertainty does not create a field-test outcome.

The document retains all 62 functional IDs and remains draft/guided refinement. Accepted targets are explicitly distinct from measured capability. OQ-9 is narrowed to file/media/export/backup processing/transfer budgets and recovery. The newly expanded file/recovery block is clearly proposed, including original retention, multiple-volume exports, resource budgets and catastrophic recovery targets; none is promoted to accepted scope by this update. No runtime testing or broad finalization review was performed.
