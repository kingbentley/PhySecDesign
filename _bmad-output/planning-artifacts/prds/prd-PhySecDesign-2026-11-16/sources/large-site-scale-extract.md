# Larger real-site scale — narrow clarification extract

Prepared 2026-11-17 against PRD draft 0.16 and its pending OQ-9 acceptance proposal. No main documents or application files were changed.

## Confirmed user input versus pending acceptance

Latest confirmed real-site input:
- **10 buildings within one property.**
- **600 total device records, including 150 cameras** across those buildings. The camera count is part of the total, not an additional 150 devices.
- **2–3 floor/site plans per building**, implying approximately **20–30 plans across ten buildings**.
- **Up to about 60 physical cameras on the busiest plan**; this is part of the property total, not additional cameras.
- **Usually one user at a time, occasionally two concurrent users.** This is the described usage scenario, not a maximum account/session limit.
- The user questioned whether the proposed POC limits can grow and explained that their sites are substantially larger than the original proposal.

These are planning inputs describing the larger property. They are **not** proof of current application support, acceptance of a complete numerical test envelope, a maximum product cap or approval of every other proposed OQ-9 limit.

The parent recommended a larger POC scale fixture reflecting these counts alongside smaller functional fixtures. **That fixture recommendation remains pending.** The building, device, camera, plan-distribution, busiest-plan and normal/concurrent user inputs are now supplied. They inform the draft-0.17 proposal; they do not create a new functional requirement or prove performance.

## Relationship to the current documents

Read [source-index.md](../source-index.md) and the current [canonical log](../.memlog.md) before this extraction. The inspected [addendum](../addendum.md) still contains the unapproved initial fixture: one property, two buildings/four plans, 100 devices, 40 assessed camera views, 80 streams and related geometry/evidence/user/byte/timing budgets. The latest real-site inputs supersede that small fixture as an adequate description of the user's larger property. They do not automatically replace every proposed limit with a new accepted target.

[FR-1 and FR-38](../prd.md) already establish one continuing property project with multiple buildings/floors, stable identities and later work scopes/revisions. Preserve that model for the ten-building property; do not split it into ten unrelated projects merely to fit the earlier fixture. Property-wide schedules, demand and history remain property-wide even when users work on one selected plan.

NFR-4 and OQ-9 still require an agreed representative size and measured response limits. SM-1–4 and all confirmed feature/integrity rules remain in scope. Bigger scale does not authorize dropping evidence, silently truncating totals, coarsening beyond an agreed fidelity target or changing lifecycle semantics.

## Count distinctions and unanswered dimensions

| Dimension | Current status |
| --- | --- |
| Property/buildings | One property; ten buildings supplied by the user. Not a ten-project model or a proven maximum. |
| Physical equipment | 600 total, including the 150 cameras. Do not double-count opening/component associations or shared controllers. Active/proposed/archived distribution is not specified. |
| Physical cameras | 150 camera bodies. Independent heads, analytical view count, supported versus unassessed views and configured stream count remain unknown. FR-47/48 distinctions still apply. |
| Plans and busiest plan | 2–3 floor/site plans per building, approximately 20–30 across the property; up to about 60 physical cameras on the busiest plan. This is not an analytical-view or stream count. |
| Geometry/analysis load | Per-plan area, obstructions/edges, zones/vertices, camera-head distribution and required sampling/fidelity remain to be established. Total body count alone does not define the largest analysis workload. |
| Shared use | Usually one user; occasionally two concurrent users. Do not reinterpret this as two editors plus an additional reviewer. Specific role/action combinations for validation remain to be selected. |
| Other workload | Actual cable/port counts, photos/check attempts/revisions/retained packages and expected growth remain unconfirmed. |
| Measurable envelope | Timing, device/browser matrix, byte/report/backup budgets and recovery targets remain pending and unmeasured under OQ-9. |

Do not treat 150 property-wide bodies—or about 60 bodies on the busiest plan—as automatically the same number of assessed views or streams. Likewise, do not multiply the old 100-device fixture's file, report, backup, geometry or timing budgets by six. Those depend on evidence volume, plan sizes, configured heads/streams, per-plan workloads and retained history, with different scaling behavior.

## Suggested concise planning clarification

“Your larger-site input is one property with 10 buildings, approximately 20–30 plans and 600 devices, including 150 cameras, with up to about 60 cameras on one plan. Usually one person works at a time, with two concurrent users occasionally. Keep that property together in one continuing project. I recommend using this profile for a larger scale fixture alongside smaller functional tests, while revisiting the geometry, timing, media, report and backup budgets. This is a proposed validation target, not a claim that the current prototype already supports it.”

Do not ask again for building/device/camera totals, plan distribution, busiest-plan camera count or normal/concurrent user count. Reopen the related geometry/fidelity, timing, media, report and backup proposals explicitly: the old small-fixture promises do not carry over automatically. Keep the larger fixture recommendation and its complete numerical envelope pending under OQ-9.

## Evidence boundary

The parent rechecked all 148 inventoried source files for this clarification: 147 remain unchanged; .gitignore has the same previously identified drift. This is reported source freshness, not a load test or implementation-capacity result. No research, application changes/tests, broad review or PRD finalization were performed.

## Final scale-input update — 2026-11-17

The user's final concurrency answer was “probably one user at a time, sometimes two.” The confirmed scenario is now one property, ten buildings, 600 total devices including 150 physical camera bodies, 2–3 plans per building (approximately 20–30), up to about 60 physical cameras on the busiest plan, and one usual/two occasional concurrent users. Analytical views/streams remain distinct and unspecified.

The parent is revising draft 0.17 around a proposed larger POC scale fixture. This extract adds no FR and establishes no verified support or maximum capacity. Numerical geometry/fidelity, performance, media/report/backup and recovery targets remain open under OQ-9. Existing shared-conflict requirements continue to apply even though routine use is usually solo.

## Focused reconciliation — PRD draft 0.17 (2026-11-17)

No actionable discrepancies found in this narrow scale/status check.

NFR-4/A-2, the revised addendum envelope, source index and latest conversation context consistently record one property with about ten buildings, 600 devices including 150 physical cameras, 2–3 plans per building (approximately 20–30), up to about 60 physical cameras on the busiest plan, and one usual/two occasional simultaneous users. Camera bodies remain distinct from analytical heads/views and configured streams. The original two-building/100-device/three-participant example is explicitly superseded as the representative larger-site target, not treated as a product cap.

The small functional plus larger scale fixture remains a recommendation under OQ-9, with no acceptance or proven-capacity claim. Earlier timing thresholds are clearly labeled candidates requiring reevaluation at the larger workload; file/package/recovery candidates are explicitly unapproved and require rebudgeting. No automatic extrapolation, property splitting, evidence omission or silent fidelity reduction is authorized. Current concurrency input is recorded; no stale request/pending-unknown wording for that count was found.

Verified 55 consecutive FR IDs and compared the functional-requirements section with the draft-0.16 text previously read in this session: it is unchanged. OQ-9 remains the sole open question; no new FR or implementation support claim was added. Only this reconciliation was appended, with no broad review or application testing.
