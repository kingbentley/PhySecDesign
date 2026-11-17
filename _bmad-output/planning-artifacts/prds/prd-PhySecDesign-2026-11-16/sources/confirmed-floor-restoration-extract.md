# Confirmed restoration after floor changes — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.14. Narrow extraction of the accepted floor-restoration proposal, with the existing deletion/undo/history boundaries for the next recommendation. This is not finalization or an application implementation claim.

## Authority and acceptance boundary

The latest user explicitly accepts the floor-restoration approach and asks for a recommendation on deleting accidental draft placements. This confirms the complete **Proposed restoration after floor changes — awaiting confirmation under OQ-8** block inspected in the [addendum](../addendum.md), superseding the preceding pending labels in the [PRD](../prd.md), [canonical log](../.memlog.md), [source index](../source-index.md) and [conversation context](conversation-context.md).

OQ-7 remains resolved. OQ-8 now has confirmed cable-lifecycle and changed/deleted-floor restoration behavior; **accidental draft-placement deletion remains the next unresolved decision**. OQ-9 acceptance/limits stays open. This acceptance does not establish a general destructive floor-deletion policy: the proposal explicitly left detailed floor deletion outside its destination-restoration scope. Do not infer permission to delete floor contents or rewrite history from the fact that restoration can handle a missing floor.

## Accepted mapping to stable requirements

Append candidate **FR-54** for destination validation and preserved restoration context, keeping existing FR IDs. Update FR-36 and relevant floor/dependency/lifecycle references to point to it; retain FR-53 for connection validation.

| Confirmed behavior | Requirement implications | Acceptance interpretation |
| --- | --- | --- |
| Per-device restoration | New FR-54; FR-36/22 | Restore the archived device's same ID/history as an individual operation. Do not roll the whole project back to an old revision, restore unrelated assets or overwrite current state to recover one item. |
| Unchanged or renamed original floor | FR-1/36/54 | Match stable floor ID rather than name. Show current floor name and preview former position when its geometry basis remains applicable; require placement confirmation. Preserve historical floor name in old context. |
| Replaced drawing, changed alignment/scale or layout | FR-4/5/54 | Open current floor plan and require review/repositioning. Old coordinates are historical reference, not verified current placement. If mapping is uncertain, explicitly place anew rather than inventing a coordinate transform. |
| Deleted or unresolved original floor | FR-1/36/54 | Choose an existing floor in the same property or create one through the normal workflow, then place the device. A new floor has its own identity even when named like the old one. No automatic old-floor recreation or name-based substitution. |
| Valid destination before active restoration | FR-36/54 | Require valid destination floor and explicitly confirmed point before completing active restoration. If not ready, cancel/leave device archived with history intact. A separately created floor remains an independent action. No new unplaced-device queue. |
| Unknown drawing/scale remains honest | FR-4/5/13/54 | Selecting a floor/point does not verify physical accuracy or invent a measurement. Missing scale/drawing data remains visible under existing analysis rules; do not impose a new requirement to fabricate verified scale merely to record a location. |
| Historical evidence and drawing context | FR-20/22/31/34/35/54 | Retain original floor identity/label, old location, captured plan/revision context, dated installation/evidence/tests. Prior observations stay tied to old conditions, not relabeled to the new place. Show old plan only if retained; missing drawing/transform data stays unavailable. Record selected destination, actor/time and meaningful change context without changing fixed revisions/closeouts. |
| Cable and shared-reference review | FR-42/52/53/54 | Old cable/port choices remain historical until revalidated. Flag affected endpoints/drops/risers after location change without deleting retained run, moving unrelated segments, inventing inter-floor line/vertical lengths or automatically reconnecting. |
| Work scope, analysis and tests | FR-17/28/31/44/45/54 | Same physical asset restoration is not a replacement purchase. Recalculate supported current/proposed analysis from selected location and known inputs, disclosing unresolved assumptions. Actual return to service/relocation uses appropriate current checks; a supported drawing-only correction does not by itself establish physical movement. No automatic installed/tested state or inherited current Pass. |
| Concurrent changes and project archival | FR-21/37/38/42/54 | Revalidate floor, drawing basis, device and dependencies before save; preserve pending choices and show new context if changed. Do not commit to deleted/stale floor. Reopen an archived project through its existing workflow before editing; restoration bypasses neither scope nor history. |

Accepted example: CAM-01 returns after Floor 2's drawing was replaced during remodeling. Keep CAM-01's ID; review/confirm placement on the current plan; retain old photo/location as history; review CBL-014 endpoint and appropriate checks before treating connection/test context as current.

## Conflicts and risks

No conflict with settled product rules was found. Integration needs these distinctions:

1. **Floor name versus identity and geometry.** Renaming does not create a different floor; a recreated same-name floor does not inherit old identity. Changed plan alignment does not prove actual movement or justify an invented coordinate transform.
2. **Restoration versus evidence/connection revival.** Destination confirmation is not physical accuracy, completed installation, reconnection or test acceptance. Preserve earlier evidence context and use FR-53/retest rules.
3. **Cancellation and concurrent state.** Leave an unfinished restoration archived; preserve pending choices on conflict without committing to stale context. A separately created destination floor is not automatically undone by canceling device restoration.
4. **Unaccepted deletion rules.** This confirmation settles missing-floor destination behavior, not accidental draft deletion eligibility or a broad floor-cascade policy. Keep the next deletion recommendation pending.

## Existing rules that bound accidental draft deletion — no new deletion policy yet

| Settled rule | Consequence for the next recommendation |
| --- | --- |
| FR-21 autosave and session undo/redo | Undo is a new guarded history action for the current session's own recent edits. Check later edits/dependencies; do not erase another participant's work, protected evidence or fixed records. Do not promise universally safe undo merely because deletion is reversible in a local prototype. |
| FR-22 named revisions | Removing something from current working design must not rewrite prior named/issued/closeout context. Whole-revision restoration is deliberate and guarded, not the routine way to recover an accidental placement. |
| FR-35 actual-removal archive | Archival records actual removed equipment. Deleting an accidental draft mark must not falsely record field removal; conversely, deleting an installed/evidenced asset must not bypass archive/history. Eligibility and alternative action labels remain the next decision. |
| FR-36/53 identity and connections | Same physical asset retains ID; physical replacement gets a new linked ID. Established cable/port lifecycle survives device removal. Do not reuse another asset's ID or erase retained cable/port history through a draft-deletion shortcut. |
| FR-42 connected changes | Revalidate device and affected routes/assignments/references atomically. A stale client cannot recreate deleted data or silently erase newer shared work. Concurrent deletion, editing, evidence additions and reuse need current-context review. |
| FR-49 linked openings/components | Removing an opening/component association does not erase independent related assets, costs, evidence or history. A shared controller must not disappear because one draft relationship is removed. |
| FR-50 annotation references | Deleting a callout/marker preserves linked evidence/issues. The same principle prevents a draft-cleanup action from implicitly deleting a real survey/photo or property issue. |
| FR-46 issue carryover and FR-32 closeout | Deletion must not dispose of unresolved faults or hide required remaining work. Mistaken/duplicate issue correction has its own audited rationale; removing a placement is not resolving an actual defect. |
| FR-17/19 current supply/demand | Genuine working-design removal can change the selected proposed scope estimate/capacity, while fixed prior values remain. Reconcile current/proposed and actual retained records; do not release occupied ports or remove real installed demand on a mere draft cleanup. |
| FR-37 archived project | Read-only archive remains read-only until explicit reopening; draft deletion does not bypass this boundary. |

Decision points for the upcoming **pending** recommendation:

- Define an accidental draft placement narrowly enough to distinguish an uninstalled proposal from a surveyed existing asset, actual field record, or replacement/restoration with history.
- Define how saved/issued references, notes/photos, attempts, issues, dependent draft routes and reservations affect eligibility. Prior snapshots can remain preserved even when the working design changes; do not assume “appeared in any revision” automatically means physical removal occurred.
- State whether a reviewed current-design removal/cancellation is available for previously proposed/issued but never installed equipment, rather than fabricating physical archival. Exact labels/criteria are not settled yet.
- Preview affected dependencies and distinguish removable draft-only relations from retained physical cable/port/evidence records. Avoid automatic broad cascades into shared components.
- Explain recoverability through guarded own-session undo and preserved history; a later conflict or reassigned connection may require review rather than blind resurrection.

These are scope questions and guardrails, not an accepted draft-deletion implementation or a new approval gate.

## Relevant source freshness

The previous narrow extraction documented stable floor IDs, plan-only alignment changes, destructive prototype floor/device deletion and whole-design snapshot restoration. No broader source ingest or application changes were needed here. Current fingerprints again match the 2026-11-16 inventory:

| File | SHA-256 |
| --- | --- |
| App.jsx | dad0ccbe56cf92fe243d9a7a72989337b581f26438ecb263997c3c9782703c43 |
| FloorManager.jsx | 9c90a7cc4ee57ec1abcc3b8c5e08ab917e8e24d282cb33a3b197bb49b315c54b |
| projectModel.js | f5328eaa57af55f3000d6e148c9e40805d70b6bbbc465061295156abc7510388 |
| survey.js | 94fee7edec5a44ce7f2b4172006514c7c8e3371d210f4994dbb40f701002cd39 |

Only this extraction was written. No main documents, application files, tests, delegation or broad finalization review were changed/performed.
