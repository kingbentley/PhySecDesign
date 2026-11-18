# Party-mode PRD discussion — round 1

Date: 2026-11-17. Source: PRD draft 0.18 and its addendum, source index and canonical log. Installed BMAD room: John, Mary, Sally, Winston and Amelia, in configured session mode. This is an interactive pre-finalization discussion, not the formal final reviewer gate or an application test. At the opening of this round no proposed change was accepted; subsequent confirmations are recorded below.

## Candidate clarifications

### PM-1 — Deleting a floor/building with dependent records

FR-1 supports property/building/floor maintenance; FR-42 requires dependency integrity; FR-54 defines restoration when the original floor is missing; FR-55 protects device draft deletion. The addendum explicitly leaves the broader floor-deletion workflow outside those decisions. The rule for deleting a container with active devices, routes/risers, survey evidence or historical references is not explicit.

Proposed POC clarification: permit quick deletion only for an unused draft floor/building with no dependent records or issued/history references. Otherwise preserve the container and require deliberate resolution; do not cascade-remove assets, evidence or connections. A complete floor-retirement/relocation subsystem is not proposed by this first-round guard. Subsequently accepted as FR-60 in draft0.22; see the decision below.

### PM-2 — Which issued design is current for installation

FR-26 preserves successive issued designs; FR-24 preserves revision-specific reviews; FR-33/34 identify exact exported editions. These establish immutable history but do not explicitly designate the current issued reference for the active work scope or how an installer recognizes a superseded issue.

Proposed clarification: one designated current issued reference per active work scope, with old issued records retained and visibly superseded in the live project. Show the issue/revision identity where an installer starts work. Changing the current reference does not overwrite field records, inherit approvals, modify old PDF bytes or create a mandatory approval gate. Offline downloaded PDFs remain the retained historical edition; the app cannot retract copies already distributed. Subsequently accepted as FR-61 in draft0.23; see the decision below.

## Scale-related tradeoff, not a missing requirement

### PM-3 — Manual intake versus a seeded large fixture

FR-39 explicitly permits manual placement/survey entry and defers bulk import/automatic discovery. This is an accepted scope choice. The later 600-device scale makes its usability tradeoff worth checking with Kevin; it does not implicitly authorize CSV import or bulk editing. A seeded large fixture can demonstrate processing/performance while a smaller functional fixture tests manual intake; it cannot by itself establish that onboarding an existing 600-device inventory is practical. Ask how existing inventory normally arrives before proposing any scope change.

FR-8 already covers finding and locating equipment. A concrete technician lookup task using a real-style label/building/floor would strengthen its acceptance test rather than require a new search module by default.

## Existing coverage and boundaries

- FR-4 already specifies that moving/replacing/aligning the drawing leaves geographically placed equipment and barriers unchanged; that behavior is not a newly discovered omission.
- FR-35/36/53–55 already protect device/cable history, restoration and guarded draft deletion.
- Optional approvals, honest closeout, retests and issue carryover are settled; this discussion does not reopen them.
- OQ-9 remains the known acceptance-policy group, including browser/accessibility, timing/fidelity, file and recovery targets.
- Source drift check read all148 inventory files:147 match; only previously recorded .gitignore drift remains. No application changes/tests or PRD finalization occurred.

The party remains open. Findings are proposals/clarifications for discussion, not consensus, adopted requirements or a final review verdict.

## Subsequent user decision

Kevin confirmed spreadsheet import when available, followed by survey verification/correction and additions. PM-3’s workflow direction is adopted in draft0.19 FR-39/56; formats, mapping, matching and missing-location behavior remain OQ-10. PM-1/PM-2 remain unaccepted. This does not end the party or approve an import staging list.

## Subsequent import-placement decision

Kevin accepted Awaiting placement for imported records (draft0.20 FR-57), then requested duplicate/re-import recommendations and bulk-delete capability. Matching/update and bulk-cleanup rules remain pending under OQ-10. PM-1/PM-2 remain unaccepted; party mode continues.

## Subsequent import-reconciliation decision

Kevin accepted the duplicate/re-import approach and bulk-delete scope, now FR-58/59 in draft0.21. Stable-ID matching, reviewed previews, verified-data protection, duplicate-safe operations and guarded cleanup are confirmed. CSV/Excel format and sheet/column mapping choices remain OQ-10; PM-1 floor/building deletion and PM-2 current issued-reference designation remain unaccepted. OQ-9 acceptance policy is still open. Return to the narrow PM-1 guard next: quick deletion of unused draft containers only, visible blocking dependencies/history, with no cascade or new floor-retirement subsystem assumed. This remains a proposal for user discussion, not a final reviewer verdict or end of the party.

## Subsequent floor/building deletion decision

Kevin accepted PM-1 and requested its addition to the PRD. FR-60 in draft0.22 allows deletion only for unused draft floors/buildings with no dependent records or historical references, explains blockers and prevents cascades. Existing guarded saves/Undo and FR-54 missing-floor recovery remain. The [focused extraction](confirmed-container-deletion-extract.md) records this scope.

PM-2 is now the discussion topic, not an accepted requirement: one explicit current issued reference per active scope, visible identifier/date/status, preserved superseded PDFs/approvals and field work, no promotion merely by saving/exporting, and existing optional-approval/conflict rules. OQ-9 and OQ-10 formats/mapping remain open. The party continues.

## Subsequent current-issued-design decision

Kevin accepted PM-2, now FR-61 in draft0.23: explicitly designate one current issued design per active scope, show its revision/date and separate approval state, preserve superseded packages/decisions, protect field updates and record guarded designation changes. The [focused extraction](confirmed-current-issue-extract.md) records the accepted scope. PM-1 and PM-2 are resolved; OQ-10 formats/mapping and OQ-9 acceptance remain open.

The current party discussion recommends bounded CSV/.xlsx intake with selectable sheet/header, previewed column/type/location mapping, minimal inventory fields, explicit unknowns and reusable project mapping/template convenience. This recommendation is pending; the accepted FR-56–59 duplicate/provenance/placement/cleanup rules remain intact. The party continues.

## Subsequent spreadsheet-scope decision and acceptance discussion

Kevin accepted the CSV/.xlsx and column-mapping scope, now FR-62 in draft0.24; OQ-10 is resolved. The [focused extraction](confirmed-spreadsheet-scope-extract.md) records the accepted inventory/map/preview boundaries. PM-1/PM-2 and bounded intake are settled.

OQ-9 remains: the [acceptance refinement](remaining-acceptance-refinement.md) recommends browser/device/task and focused usability scope next, followed by responsiveness paired with fidelity and then file/evidence/package/recovery budgets. The proposed first matrix and older numerical values remain unapproved. Confirmed real-site scale stays intact; neither party review nor the documentation edits establish tested capacity or complete formal finalization. The party continues.

## Subsequent browser/usability decision and performance discussion

Kevin accepted the browser/task matrix and focused usability checks, now NFR-3/SM-4 in draft0.25. The [focused extraction](confirmed-browser-usability-extract.md) records the accepted scope. OQ-9 now retains numerical performance/fidelity and file/recovery decisions.

The [performance/accuracy extraction](performance-accuracy-refinement.md) supports the pending proposal: keep quick UI feedback separate from completed all-zone analysis and durable shared saves, declare real views/geometry/hardware, use independently computed reference checks, and refine/label uncertain threshold cases. A2-percentage-point error target alone can still misclassify a90% zone. Earlier small-fixture speed/file candidates remain unapproved; no capacity has been demonstrated. Party mode continues.

## Subsequent performance/accuracy decision and file/recovery discussion

Kevin accepted the performance/accuracy goals, now NFR-4/SM-5 and FR-13/15 in draft0.26. The [confirmation extraction](confirmed-performance-accuracy-extract.md) separates accepted targets from unmeasured support. OQ-9 now contains only file/media/export/backup and recovery choices.

The [file/recovery extraction](file-recovery-refinement.md) checks the current pending budget proposal: larger retained-content allowance, originals plus previews, complete numbered PDF volumes/manifests and separate transfer/processing/recovery clocks.1200 photos need600 pages before other content, and10 GiB upload at5 Mbps alone takes about4.77 hours. The60min catastrophe target must use measured automated backup retrieval inside the recovery environment. These are proposals; no file policy or full PRD finalization is accepted by the performance confirmation. The party continues.

## Subsequent file/recovery decision and readiness check

Kevin accepted the file/export/backup/recovery scope, now captured in draft0.27 FR-4/6/20/21/33/34, NFRs and acceptance tables. The [confirmation extraction](confirmed-file-recovery-extract.md) records the accepted boundaries. OQ-9 is resolved; all known OQ-1–10 and PM-1/PM-2 product choices are settled.

The [readiness extraction](finalization-readiness-after-acceptance.md) identifies remaining full decision/input reconciliation, a current-document reviewer pass with disposition, and structural/prose consolidation before final status. These tasks are distinct from the completed focused checks and later implementation/testing. [Superseded numerical candidates](superseded-acceptance-candidates.md) are preserved as history. This is not a formal final-review verdict or a declaration that the POC software has passed; no automatic party wrap-up or PRD finalization occurred.
