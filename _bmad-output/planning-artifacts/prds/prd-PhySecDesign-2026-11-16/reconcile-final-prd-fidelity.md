# Final PRD consolidation fidelity reconciliation

Date: 2026-11-17. Scope: current prd.md only, compared with sources/pre-finalization-draft-0.27/prd.md.txt. The addendum is still being consolidated and is deliberately outside this pass. No main documents, logs or status were edited.

## Result

**No actionable loss of unique behavior or changed numerical target found.** All 62 stable FR IDs, 62 Checks, six NFRs and five success measures are retained. Requirements are reordered by topic; numbering is unchanged.

Comparison used fresh files after reading the current source index/log. Text comparison excluded only inter-requirement section headings and whitespace boundaries, then every changed requirement was checked semantically against the retained snapshot and the new common guard paragraph.

- 47 FR bodies/checks are unchanged after ignoring moved headings.
- 15 FR bodies/checks changed: FR-3/13/37 and FR-48–57/59/60.
- The sole changed Check is FR-37's deliberate archived-export clarification.
- NFR-1/2/3/5/6 and SM-1–4 are unchanged. NFR-4 and SM-5 now link the central acceptance profile while retaining their unique quality and acceptance requirements.
- Every row in the performance table and both file-size/job-processing tables is unchanged.

## Requirement-by-requirement changed-text disposition

| Requirement | Change | Fidelity disposition |
| --- | --- | --- |
| FR-3 | Adds keyless OpenStreetMap and lookup-result viewport-only navigation; relocating an unlocked drawing remains explicit. | Expected deliberate clarification; prior lookup/provider/geographic-placement behavior and Check retained. |
| FR-13 | Adds boundary draw/edit/reset and independently persisted common target plane for combined/zone analysis. | Expected deliberate clarification; all boundary/denominator/freshness/unsupported-input rules and Check retained. |
| FR-37 | Archive export may append a separately identified retained edition without reopening business work. | Expected deliberate clarification; frozen design/installation/evidence/decisions/prior PDFs, retained-byte redownload and explicit reopening for business changes remain. |
| FR-48 | Shortens repeated history/export/retest/lifecycle paragraph. | Parent/view/stream/profile/source distinctions and failed/unknown heads retained locally; common NFR-1/FR-34 guards and FR-35/36/53–55 retain lifecycle consequences. |
| FR-49 | Shortens common history/retest references. | Link removal does not archive/transfer evidence/pass; component relationships, independent lifecycle and project-defined checks retained. Common guards preserve revisions/evidence. |
| FR-50 | Removes repeated save/conflict/undo sentence. | New common guard applies; annotation IDs, edits, noncolor labels, default PDF inclusion and explicit geometry/reference backup remain. |
| FR-51 | Shortens repeated version/history/export/lifecycle wording. | Unique direct-port collision guard, dependent assignments, pending edits, identities/bases/reservations/warnings and no inferred Pass remain. FR-33 and unchanged Check retain schedules/export distinctions; common guards cover history/retest. |
| FR-52 | Shortens common revision/backup/dependency references. | Separate measured/estimated length, source/context, no second slack, current/proposed identities and no inferred installation/Pass remain. Shared guards retain dependencies/history. |
| FR-53 | Shortens repeated evidence/package/revision/approval clauses. | Concurrent archive/reuse/restore validation, actor/time, current follow-up, and plan/schedule dispositions remain. Common fixed-history, optional-approval and observed-outcome guards retain removed repetitions. |
| FR-54 | Removes repetition about fixed historical packages. | Former location/plan/evidence, no relabeling old observations, unavailable drawings, no fabricated physical state/Pass or replacement purchase remain. Common fixed-history guard applies. |
| FR-55 | Removes repeated snapshot/evidence preservation sentence. | Draft snapshots still do not block working edits; identity, dependent records, issued cancellation, historical recovery and all guarded-delete conditions remain. Common guards preserve fixed records. |
| FR-56 | Shortens repeated unknown/history and downstream-implementation wording. | FR-39 source-based inventory, FR-57 placement, FR-58 verified/history safeguards and FR-62 unknown fields remain explicit links; import cannot establish actual location/installation/connectivity/Pass. |
| FR-57 | Shortens repeated save/history/dependency wording. | Stable identity, hints/source context, same-record placement, no fabricated geometry/demand/purchase, visible unassigned/unknowns and relevant schedules/exports remain; common guards cover persistence/history. |
| FR-59 | Replaces repeated retry/Undo wording with FR-21/42/55 references. | Per-record outcomes, activity, reviewed selection, current eligibility/dependencies, stable IDs/later-edit/floor/connection recovery and no mass archive/purge remain. |
| FR-60 | Shortens common save/conflict/Undo language. | Current container/dependency validation, history, stale-request rejection, same-identity recovery and no authority to delete referenced floors remain; common guards prohibit overwriting later work. |

All remaining FRs—1/2/4–12/14–36/38–47/58/61/62—retain their original body and Check text apart from relocated section headings.

## Cross-cutting and numerical fidelity

The new common paragraph explicitly applies NFR-1/FR-34 preservation; FR-21/42 save/conflict/dependency/retry/Undo; FR-27/28/44 meaningful change/retest; FR-25 optional approval; and FR-30/31 observed work/evidence to every capability. The removed local repetitions do not remove their scope.

The simple professional map-first experience, contextual controls, direct placement/alignment access and field-device priorities are preserved or deliberately clarified. The accepted visual reference is retained.

The central acceptance profile preserves both fixtures, the full lifecycle with existing-site unknowns/retained assets/actual replacement, about 10 buildings and 600 devices including 150 physical cameras, roughly 20–30 plans from 2–3 per building, up to about 60 cameras on the busiest plan, one usual/two concurrent users and a declared physical-camera/view/stream/geometry/evidence/hardware/network manifest. These remain test scope rather than permanent capacity ceilings.

Unchanged numeric requirements include:

- Timing: 250 ms feedback; 1 s lookup; 2 s durable ordinary save; 5 s peer propagation after durable save; 10 s initial usable plan; 5 s warm switch; 10 s complete current-input busiest-plan combined/DORI/all-zone result.
- Timing policy: at least 19 of 20 trials; every applicable trial preserves accuracy/access/integrity, with no omitted devices/zones or hidden reduction of fidelity.
- Accuracy: supported optical references within 1%; zone references within 2 percentage points; no-coarser-than-1 m sampling refined where needed; near-target uncertainty and full-precision decisions remain distinct from field outcomes.
- Browser/usability: Windows Chrome/Edge; real iPhone/iPad Safari and Android Chrome; both fixtures; 200% form zoom and original task/accessibility checks.
- Resources: source PDF 100 MiB; image/photo 25 MiB; inventory 10 MiB; each PDF volume 250 pages/100 MiB; edition 1 GiB; project 8 GiB; backup final container 10 GiB with 8 GiB logical payload. Binary units and aggregate-budget constraints remain.
- File processing after byte availability: PDF preview 30 s; photo 10 s; inventory preview/application 30 s each; complete edition 5 min; backup creation 10 min; uploaded portable backup validation/restore 15 min. All three repeated long-job runs must meet bounds; transfers remain separate.
- Recovery: daily backups, at least seven successful independent daily generations and pre-maintenance copy; at-most-24-hour recovery point; 60-minute prepared automated catastrophic recovery; ordinary acknowledged work remains zero-loss. FR-34 is textually unchanged.
- Domain examples/conventions in unchanged requirements—including the 90% zone example, 40 m route/46 m supply example, two photos per report page and four field-test outcomes—are preserved and not promoted into universal defaults.

## Decision chronology and handoff

Removing the chronological resolved-OQ paragraphs does not remove accepted policy: their functional/NFR/acceptance content remains, and the source log/context retain chronology. The current decision-status section correctly reports no known open product question, with owned architecture/UX/domain/test-manifest work downstream. Draft/finalization-candidate wording does not claim implementation, measured acceptance or completed final signoff.

This pass does not disposition DA-1 in the addendum or validate its consolidation; wait for the separate addendum fidelity pass. No further PRD correction is requested by this comparison.

## Audit fingerprints

- Retained PRD snapshot SHA-256: 60a00d1c77ed7c7da4d2b7802eaa25451b648fd4bda6abd46ab8028cbc5f794d
- Audited consolidated PRD SHA-256: 0fd7dabfb539d3d1998a4f21411e04f1ff17a3af2678eb9013f49aac0545d67c

These identify the compared documents, not a software test or proof of implemented behavior.
