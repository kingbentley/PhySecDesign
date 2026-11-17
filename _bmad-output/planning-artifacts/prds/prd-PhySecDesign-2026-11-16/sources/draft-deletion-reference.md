# Accidental draft-device deletion reference

Prepared: 2026-11-17 (America/Chicago), using official references already verified in this research pack; no additional web search.

Purpose: distinguish ordinary design editing from changes that must preserve asset history. The scope below is proposed for discussion, not confirmed or implemented.

## Relevant references

- **Design work includes reversible editing.** CCTV Design Tool's Quick Start documents object selection/manipulation, copy/cut/paste and undo/redo controls. This supports an ordinary editing workflow, but does not establish which deletions are undoable or how dependent cables, ports and evidence behave. [Quick Start, Bottom toolbar, Object selection and Keyboard shortcuts](https://docs.cctvdesigntool.com/quick-start/)
- **Real asset history remains useful after retirement.** SiteOwl describes device histories containing installation, service and modification information, and archives that retain inactive devices while keeping the current asset view clear. This supports history-preserving treatment of real equipment, not a requirement to retain every accidental design placement. [Physical security asset management, Detailed device histories and Historical asset archives](https://getsiteowl.com/use-cases-asset-management/)

Neither reference specifies Site Studio's draft eligibility, issued-design boundary, dependency handling or conflict behaviour during undo. Those safeguards are product choices.

## Proposed POC behaviour

1. **Offer Delete draft for genuinely provisional placements.** Eligibility means an accidental or unwanted draft that was never installed, never represented a real existing asset, has no field evidence, and has not appeared in an issued design baseline/deliverable. A proposed status alone is insufficient if the record already carries historical obligations.
2. **Preserve consequential records.** For issued, field-evidenced or real existing assets, use an appropriate cancellation, correction or archive action with a dated reason/history entry. Correct an erroneous record without asserting that physical equipment was removed. Do not erase earlier issued context or field evidence merely to clean the current drawing.
3. **Preview dependencies when they exist.** Show affected cable/run references, port reservations/assignments, linked equipment and notes/evidence before committing the change. An isolated accidental placement should remain quick to remove. Draft deletion must not cascade into deleting retained cables, shared components or evidence; preserve affected references with an explicit unresolved/detached state where necessary.
4. **Provide undo within its stated editing scope.** Retain enough of the removed draft and its prior relationships to reverse the edit. Undo may restore an uncontested draft relationship, but cannot take a port now assigned to another device, overwrite later edits, discard another record or silently assert a physical connection. Surface any conflict and leave the affected relationship unresolved for review.
5. **Keep draft and field effects separate.** Deleting or undoing a draft changes proposed design records only. It does not release actual field ports, disconnect installed cables, restore an archived real asset or produce a passing test result. Existing archive/restoration rules continue to govern physical assets.

This is a small editing distinction, not a new approval process, immutable audit guarantee, retention mandate, full revision-control system or promise of undo across every session/import/export. The available undo scope must be clear to the user.
