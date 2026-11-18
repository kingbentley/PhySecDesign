# Remaining POC acceptance refinement

Prepared 2026-11-17 as focused guided-discovery extraction, not a formal reviewer gate, accepted new requirement, software test result or PRD finalization. Read the current [source index](../source-index.md) and [decision log](../.memlog.md) first, then [PRD](../prd.md) NFRs/SMs/OQ-9, the [addendum](../addendum.md) acceptance section, and the [prior readiness](prd-finalization-readiness.md), [acceptance baseline](poc-acceptance-baseline.md) and [reference](poc-acceptance-reference.md) extracts.

At read time the files were draft 0.23 and still marked spreadsheet formats/mapping as pending. The parent supplies the user's latest acceptance of those details; do not ask that decision again. This note concerns remaining OQ-9 acceptance only and leaves recording the latest importer decision to the parent.

## Confirmed scope versus candidates and evidence

| Class | Current meaning |
| --- | --- |
| Confirmed test approach | A small functional fixture plus the larger real-site scale test: one property, about 10 buildings, 600 total devices including 150 physical cameras, roughly 20–30 plans, about 60 cameras on the busiest plan, one usual/two concurrent users. NFR-4, SM-5 and resolved A-2 already record this. |
| Confirmed workflow obligations | Shared online work; phones/tablets/laptops; preserved identities/evidence/history, honest save/conflict states and durable acknowledged records; fixed packages; optional approvals/handoff. Spreadsheet intake, placement, re-import/cleanup safeguards, and current-issued-design behavior are now part of the workflow to exercise. |
| Unapproved acceptance choices | Exact browser/device/task matrix and usability/accessibility checks; response/fidelity thresholds; file/media/report/backup budgets; catastrophic recovery targets and backup policy. Latest scale or importer acceptance does not approve these. |
| Earlier numbers retained for discussion | 250 ms feedback, 2 s save, 5 s propagation, 3 s coverage at the former small fixture, 5 s warm plan open, 10 s photo, 15 s PDF preview, 60 s report generation, 100-page/80 MiB report, 50 MiB aggregate media, 500 MiB backup, daily/seven-generation backup and 24-hour/60-minute loss/recovery objectives. These remain unapproved and unmeasured. Current code may have some similarly named limits; that coincidence does not establish product acceptance. |
| Actual implementation evidence | Historical desktop/resized-width QA, authored unit assertions and existing input/work caps. These do not establish a real mobile browser matrix, shared lifecycle workflow, performance at 600 devices/60 cameras on one plan, or complete retained-package recovery. |

Physical cameras, optical views/heads and configured streams remain separate workload dimensions. Do not equate 60 physical cameras with exactly 60 analysis views, treat schema maxima as supported scale, use the earlier small-fixture counts as permanent ceilings, or split a property to evade the confirmed scale test.

## Recommended discussion order

### 1. Browser/device, task and basic accessibility matrix — discuss next

Recommend one concise proposal for Kevin to accept or adjust:

| Candidate environment | Candidate acceptance tasks |
| --- | --- |
| Windows laptop, Chrome and Edge | Full design-to-closeout/later-work flow: spreadsheet/PDF intake, alignment, device/cable editing, analysis, estimates, revisions/review, field records, packages and portable backup/restore. Include the confirmed larger fixture for the operations it exercises. |
| Real iPhone, Safari | Field workflow: find a device in list/plan, inspect current issued reference and checklist, verify/locate imported equipment, add a discovered device, enter work/results/notes, capture/select a supported photo, save and recover from visible conflict/failure, reload and confirm acknowledged work. |
| Real iPad, Safari | The same field workflow, including usable plan navigation/selection and evidence entry on the larger display. Full desktop panel density or every design task need not be a tablet acceptance requirement. |
| Real Android phone, Chrome | The same field workflow, with actual touch and supported photo capture/selection behavior. |

Record device models, OS/browser versions, viewport/orientation and the tested build. Select exact builds when preparing/running acceptance; a version recorded in a test report is not an indefinite browser-support commitment. Use real devices for the field path; resized desktop windows alone do not establish it. Online operation remains sufficient.

Recommend the following limited checks across those tasks, all still awaiting confirmation:

- Keyboard operation for tested desktop tasks, visible/logical focus and no keyboard traps; dialogs return focus predictably.
- Clear labels and actionable errors, including photo/import/save/conflict states.
- Readable enlarged forms and controls, using 200% zoom as the existing proposed check rather than an already accepted threshold.
- Consequential states distinguishable by text/icons as well as color: Pass/Fail, Not assessed, Awaiting placement, Unsaved and Conflict.
- Essential touch/map/edit actions have an equivalent way to complete the task without precision dragging or hover-only controls. Keyboard support and a single-pointer drag alternative are separate checks.
- Readable text and discernible selected/focused controls and meaningful plan graphics against representative imagery. Exact measured contrast/target-size values can be recorded in the UX acceptance details; the old approximately 44 CSS-pixel target is still a candidate.

This is a practical POC task/accessibility baseline, not a WCAG conformance or certification claim. The [existing official-source digest](poc-acceptance-reference.md) grounds the distinction; no new research or standards adoption is needed to discuss the product choice.

The immediate question should concern this matrix only. Do not make accepting it silently accept the timing, file, fidelity or disaster-recovery tables.

### 2. Responsiveness together with analysis fidelity — subsequent discussion

After the environment/task matrix is settled, agree named operation expectations at the confirmed scale. Separate control feedback, durable metadata save, propagation, upload completion, plan loading, combined coverage/all affected zones and export completion. Define the analytical view/edge/area workload and acceptable fidelity alongside time; a faster result from silently coarser sampling is not equivalent.

The earlier 3-second/1-meter small-fixture candidate cannot simply be transferred to the larger site. The baseline demonstrates bounded computation and possible coarsening/rejection, not a measured runtime. Likewise, illustrative/unassessed panoramic outputs must remain unassessed. Accuracy tolerances and benchmark trial rules are still candidates; engineering should prepare realistic workload/measurement details for the product decision.

Include spreadsheet parsing/mapping/preview/commit and duplicate-safe re-import in the later workload plan, because these tasks are now confirmed. Exact rows/bytes/timing follow from the inventory fixture and should not be invented by this extraction.

### 3. Input/output budgets and backup/recovery — subsequent discussion

Budget input PDFs/images/spreadsheets, retained processed media, exact historical packages and complete backups together for the 20–30-plan property and its evidence/history. Per-file maxima and aggregate limits must fit the declared manifest; earlier 50/80/500 MiB figures are not accepted proof of adequacy. Preserve complete required evidence, stable history and explicit failure/partial-output behavior.

Separate already-confirmed ordinary restart durability from the still-open catastrophic recovery policy: backup frequency/retention, maximum recoverable data-loss window and recovery-time objective. Define a restore exercise and its measurement boundary without treating an export button or downloaded file as restoration evidence. Storage/container/transport mechanisms remain architecture choices.

## Meaningful gaps to carry forward

1. OQ-9 presently bundles three different decisions. Resolve the device/task/accessibility group first, then retain the other groups explicitly pending.
2. Addendum acceptance prose uses imperative wording below an overall pending label. On confirmation, mark only the accepted subsection confirmed; keep old numerical candidates visibly pending or historical so they cannot be mistaken for defaults.
3. The acceptance exercise should cover the newly confirmed inventory/import and issued-reference/container safeguards through the existing all-FRs rule and updated test manifest. Its older five-step example predates these additions; it need not grow into another feature-definition exercise.
4. Exact fixture construction, hardware/build records and measurement mechanics can be owned by engineering/UX and assigned revisit conditions. Do not make every test parameter a new user-discovery question or require implementation to pass before the PRD can eventually be finalized.

## Verification boundary

Six relevant files still match the source inventory: projectStorage.js, coverage.js, survey.js, pdfImportUtils.js, designReport.js and design-qa.md. No app tests, browser checks, load benchmarks or new web research were run. Only this extraction was written; no main PRD/addendum/log edits or finalization occurred.
