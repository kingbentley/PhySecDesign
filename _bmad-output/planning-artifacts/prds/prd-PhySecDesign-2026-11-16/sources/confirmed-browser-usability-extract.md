# Confirmed browser and focused usability acceptance

Date: 2026-11-17. Accepted acceptance scope during guided PRD refinement; no claim of completed testing or formal finalization.

## Authority and evidence

Kevin accepted the proposed browser/device/task and usability matrix. This confirms one part of OQ-9; numerical responsiveness/analysis fidelity and media/report/backup/recovery decisions remain pending.

Read the current [source index](../source-index.md) and [canonical log](../.memlog.md), NFR-2/3/4, SM-4/5 and OQ-9 in [draft 0.24 PRD](../prd.md), and the latest matrix in the [addendum](../addendum.md). The new explicit confirmation supersedes that matrix's pending label, not the still-pending numerical targets. No application testing was performed.

## Accepted matrix

| Environment | Required demonstration |
| --- | --- |
| Windows laptop, both Chrome and Edge | Supported complete desktop workflow: property/setup and spreadsheet intake, design/analysis/routes/estimates, issuing/review, field-record updates, closeout, exports and editable backup/recovery. |
| Real iPhone and real iPad, Safari | Find equipment; inspect current plan, current issued reference and checklist; verify/correct imported records and place an Awaiting placement record; capture/select photos and record notes/results; handle visible conflicts; verify saved records after reload; perform review/comment/decision actions permitted by the access link. |
| Real Android phone, Chrome | The same field and permitted-review tasks as the Apple mobile matrix. |

Use named representative physical devices and the stable browser/OS builds selected for acceptance; record versions, viewport/orientation, application build and network conditions. These are the minimum required acceptance environments, not a promise for every device/browser combination. Online operation is sufficient. Phone/tablet acceptance does not require the full desktop drafting workload or desktop panel density.

Exercise required tasks with both the smaller functional fixture and the confirmed larger property profile: about 10 buildings, 600 devices including 150 physical cameras, roughly 20–30 plans, up to about 60 physical cameras on the busiest plan, one usual/two concurrent users. A tiny mobile inventory alone is insufficient evidence for property-scale lookup/field work. Physical camera counts remain distinct from views/streams; exact test manifests remain engineering work.

## Accepted focused usability and task completion

- Required tasks must remain completable with existing integrity and access behavior. Show errors/conflicts, retain pending edits as already required, and verify acknowledged saved state after reload. Browser-close recovery of unsaved input and offline capture are not newly promised.
- Verify labeled inputs/errors, applicable keyboard navigation, visible focus without traps, readable forms at 200% zoom, usable touch controls and an alternative to essential drag-only actions.
- Distinguish outcomes/save/conflict states through text or icons as well as color; check meaningful text/control/overlay contrast and task access at tested screen sizes.
- A keyboard alternative alone does not demonstrate a usable touch alternative. Record actual observations and evidence.
- Correct blocking workflows, misleading status or inaccessible required controls. Nonblocking presentation issues may retain an owner/disposition.
- This focused acceptance scope is not a complete accessibility-conformance claim or a requirement for an unrelated automated audit subsystem.

## Minimal requirement mapping

| Existing clause | Needed update |
| --- | --- |
| NFR-3 | Record the accepted environment/task matrix and focused usability requirements; replace its blanket statement that this matrix remains undecided. Link the detailed addendum rather than adding a new functional capability. |
| SM-4 | Require evidence from the accepted real mobile environments and desktop browsers, including device lookup, imported-record verification/placement, current issued reference, photos/checklists, permitted review and saved reload/conflict behavior. |
| NFR-2 / FR-21/42 | Preserve the distinction between durably acknowledged saved work and pending edits. The matrix tests existing integrity rules; it does not weaken them or adopt new timing/backup targets. |
| NFR-4 / SM-5 / A-2 | Link both accepted fixtures; do not turn the real-site profile into a capacity claim or permanent product ceiling. |
| FR-24/57/61 and existing field/evidence FRs | Task coverage must respect review permissions, import-only placement and the distinction between current issue, editable installation, approval and observed tests. No new field state or approval gate is implied. |
| OQ-9 and active status text | Record browser/usability as a confirmed refinement; narrow the remaining questions to responsiveness/analysis fidelity and media/report/backup/recovery limits. OQ-10 remains resolved. |

## Consistency risks and open boundaries

1. Avoid claiming this matrix has passed or that emulation alone demonstrates the explicitly required real mobile tasks. The accepted matrix is future acceptance scope.
2. Do not silently elevate a review link to project editing merely because the matrix includes field and review tasks: demonstrate each under its existing permissions.
3. Readability at 200% zoom applies to forms/task completion; it does not require identical desktop panel density or full drafting controls on phones. Essential drag alternatives must work for the relevant input mode.
4. Preserve zero loss of acknowledged saved work across ordinary restart/reload under NFR-2 separately from catastrophic backup recovery objectives. Pending timing, fidelity, byte/page, retention and recovery candidates are not approved by this matrix.

No inherent conflict was found with current requirements. NFR-3, SM-4, the detailed addendum and current OQ-9/status language need the accepted-versus-pending distinction; a new FR is unnecessary.

Source freshness check: all 148 inventory files read; 147 unchanged, with only the previously documented .gitignore drift.


## Focused reconciliation — draft 0.25

No actionable discrepancy found. NFR-3/SM-4 and the confirmed addendum matrix retain Windows Chrome/Edge desktop coverage; real iPhone and iPad Safari plus Android phone Chrome field/review tasks; recorded environments; both fixtures; saved reload/error/conflict behavior; labels, keyboard/focus, 200% form zoom, touch/essential-drag alternatives, noncolor status and detailed contrast/task-access checks. Existing permission and saved-versus-pending boundaries remain intact, without requiring full desktop drafting on phones or claiming full accessibility conformance.

The entire functional-requirement section is unchanged from draft 0.24, with all 62 FRs retained. Main acceptance criteria contain the confirmed scale and usability figures but no newly adopted performance/fidelity/file/recovery numbers. Current index/context and OQ-9 distinguish the settled browser matrix from the explicitly pending timing/accuracy recommendation and upcoming file/recovery decisions. Draft 0.25 remains guided refinement; no implementation, test-pass or finalization claim is made. No application checks or broader review were performed.
