# Confirmed shared editing decision extract

Recorded 2026-11-17 for guided PRD refinement. Sources are the accepted OQ-2 recommendation in the [addendum](../addendum.md), the [current PRD](../prd.md), and the latest user confirmation supplied for this task. At extraction time, the preceding files still describe OQ-2 as awaiting confirmation; the latest explicit confirmation supersedes that label.

**Decision status:** Kevin accepted the shared-editing approach and asked for it to be added to the PRD. OQ-2 is resolved at the product-behavior level. He requested the next recommendation about OQ-3 device checklists/pass criteria; OQ-3 has not been accepted. OQ-3–OQ-9 remain open. Preserve stable requirement IDs, draft status, and the distinction between confirmed behavior, downstream design and future acceptance targets. This is not implementation or finalization.

## Confirmed behavior

### Shared persistence, autosave, and update visibility

- Use one authoritative server-saved project with durable records and attachments. Acknowledged saves survive closing a browser and an ordinary service restart.
- Treat a photo as saved only after its upload and record association both succeed; expose partial failures.
- Autosave completed edits, rather than each intermediate drag movement. Show Saving, Saved, Unsaved, and Conflict states; aggregate project status must not conceal an item that is pending or conflicted.
- Other connected browsers receive saved changes promptly. Refresh when returning to the tab and offer manual refresh. Incoming updates must not overwrite an active form, drag, text entry, or other local unsaved work.
- No live cursors or character-by-character joint editing is required.

### Conflict handling and related operations

- Use version checks on editable items such as devices, routes, zones, checklist definitions, and floor/project settings. Independent items may save concurrently.
- If the same item changed after it was loaded, reject the stale save even when the two users changed different fields. Preserve the attempted input and show the saved versus attempted change.
- Let the user accept the saved version or deliberately reapply selected intended edits to the latest version. Recheck the version on resubmission; no blind overwrite or silent whole-object merge.
- Validate dependent records and current project state together for connected operations: device removal/replacement and connections, floor removal and its contents, archive/restore/closeout, and comparable project-wide actions.
- Stale clients cannot recreate removed records, write into archived projects, or bypass relationships by treating each individual record as independent.

### Evidence and retry behavior

- New notes, photo attachments, test attempts, and reviewer decisions are separate identified additions. Preserve prior evidence; concurrent independent additions coexist.
- Retrying one action must not create duplicate evidence or decisions. A timeout does not prove that a save failed, so retry/recovery must determine whether the original action succeeded.
- Editing a mutable existing entry uses its version. Correcting protected test/approval history adds a record rather than rewriting the original. Preserve test checklist wording and applicable context with each attempt.

### Connectivity, undo, and snapshots

- On connection failure, show unsaved state and retain pending input while the page stays open. Pause server-dependent actions and retry/revalidate when connectivity returns.
- This does not commit durable offline capture, continued background offline work, or pending-input recovery after closing the page.
- Ordinary undo/redo applies to the current browser session's recent working edits. Use an internal session identifier; a display name is not reliable ownership or identity.
- An undo records a new reversal and checks the affected versions/dependencies. If another edit changed them, explain the conflict and offer review. Do not revert another participant's work, erase evidence, or modify fixed revisions. Redo uses the same guards.
- Named snapshots, issuing, full revision restoration, and closeout use a consistent server-saved version and revalidate current project state. Resolve the initiating user's relevant pending/conflicting work before snapshotting.
- Other clients' unsaved edits are neither included nor represented as saved. Closeout rechecks current outstanding work. Full revision restore is a deliberate guarded project operation, not ordinary session undo.

## Requirement mapping

| Requirement | Confirmed addition or refinement |
| --- | --- |
| **FR-2 — Shared online project** | One authoritative durable shared record; connected clients receive saved changes, refresh on tab return/manual request, and preserve unsaved local input. Replace its stale OQ-2 deferral with the confirmed behavior/new conflict requirement. Keep OQ-1 link scope and unverified attribution intact. |
| **FR-21 — Save and recover edits** | Autosave completed edits; four visible save/conflict states; preserve pending input while page remains open; pause/revalidate on connectivity loss; duplicate-safe retry; guarded current-session undo/redo that records reversal and preserves protected history. |
| **FR-22 — Named revisions and comparison** | Take revisions and restore from a consistent server-saved version. Revalidate current state and dependencies, resolve initiating-session relevant pending work, and never silently include remote unsaved work. Keep full restoration distinct from ordinary undo. |
| **FR-24 — Revision-specific review** | Add identified reviewer-decision records with duplicate-safe retries and preserved prior decisions. Corrections to protected approval history append records. Do not alter fixed revision binding or let conflict recovery grant editing access. |
| **FR-31 — Evidence and retesting** | Concurrent notes/photos/test additions coexist; retries do not duplicate them; photo saved status includes upload plus association. Mutable record updates are version-checked; protected corrections preserve earlier attempts, wording and context. |
| **FR-32 — Explicit closeout** | Revalidate saved state, dependencies and current outstanding work before producing a consistent fixed closeout. Unresolved initiating-session relevant input cannot silently disappear into a purportedly complete snapshot. Technical consistency checks do not add mandatory design or acceptance approval. |
| **NFR-2 — Shared-save clarity** | Successful acknowledgement means durable shared state surviving browser close/ordinary service restart; aggregate status exposes pending/conflicted items, partial attachment saves and uncertain outcomes. Explicitly distinguish durable acknowledged saves from temporary pending-input retention. |
| **Optional appended shared-conflict FR** | Centralize independent-item concurrency, stale same-item rejection even across different fields, saved/attempted comparison, explicit selected reapplication with revalidation, and atomic validation of dependent/project-wide changes. Preserve FR-1–FR-41 IDs. Cross-reference rather than duplicating incompatible conflict rules across FRs. |
| **Related FR-26/FR-28/FR-35–FR-38** | Issuing, field changes, device connections/removal/replacement, archival, reopening and restoration inherit the same state/dependency checks without changing the already confirmed lifecycle policies. |

## Details that remain downstream

- **Timing:** about five seconds was explicitly a proposed POC update target for OQ-9 validation. The accepted direction is prompt saved-update visibility; do not silently turn the example into a guaranteed deadline or production SLA. Establish measurable timing with the representative acceptance fixture.
- **Transport:** polling was offered as a sufficient initial option, not a required architecture. Polling, push transport, and update cadence can be selected downstream while preserving the accepted behavior.
- **Storage and hosting:** no database, file-storage vendor, hosting vendor, replication model, backup schedule, recovery-time objective, or recovery-point objective was chosen. Ordinary-restart persistence is accepted; disaster recovery targets remain OQ-9/architecture.
- **Implementation primitives:** ETags/If-Match are an example of conditional writes. Exact versions, record boundaries, transaction design and idempotency mechanisms belong to architecture. The accepted no-lost-update, dependency-validation and duplicate-safe behavior is the requirement.
- **Other product questions:** OQ-3 checklist content/applicability/pass criteria and phase progress, OQ-4 retest triggers, OQ-5 scope/defect disposition, OQ-6 package details, OQ-7 catalog/network extensions, OQ-8 archive edges, and OQ-9 measurable acceptance remain open. OQ-2 acceptance does not answer them.

## Four consistency risks

1. **Saved versus pending durability.** Browser-close/restart survival applies to acknowledged server saves; page-open pending input has a narrower guarantee. Do not display Saved after a partial photo upload, hide an item conflict under aggregate Saved, or claim offline recovery that was not accepted.
2. **Per-item conflicts versus cross-record invariants.** Independent edits may coexist, but removal/replacement/floor/archive/restore/closeout must validate connected records and state together. Otherwise a stale save could recreate a removed asset, revive an old connection, or modify an archived project despite item-level checks.
3. **Evidence retries and session undo versus history/identity.** Duplicate-safe append operations must preserve concurrent additions and protected history. Undo ownership comes from the internal session, never a selectable display name; its reversal cannot erase another editor's changes or fixed approval/test evidence. Review-link permissions remain unchanged.
4. **Consistent closeout versus workflow gates and open questions.** Snapshot/closeout must reconcile initiating-session relevant pending work and current outstanding items, without pretending remote unsaved work was saved. This is state consistency, not a new mandatory approval gate. Keep Completed/Closed with outstanding items truthful and OQ-3–OQ-9 unresolved; do not adopt five-second performance, polling, or a storage vendor as firm product choices.

## Integration cleanup

Update the OQ-2 addendum heading, PRD open-question status, source index, conversation context and latest memory entries to distinguish the newly confirmed behavior from the still-open OQ-3 recommendation. Earlier pending labels may remain in historical memory as chronology. Preserve OQ numbering; do not renumber OQ-3–OQ-9. No tests were run and no main PRD/addendum/application files were edited for this extraction.

## Narrow reconciliation against draft 0.3 — 2026-11-17

**Result: no actionable inconsistencies found in the accepted shared-editing integration.** Reviewed the relevant PRD clauses, confirmed addendum section, source-index status and conversation context only. No application files were changed, no tests were run, and no broad review or finalization was performed.

- **Undo versus restoration:** FR-21 limits ordinary undo/redo to the session's own working edits, records reversals and guards changed items/dependencies. The confirmed addendum specifies an internal browser-session identifier rather than display-name identity. FR-22 explicitly separates full revision restoration as a guarded project action preserving fixed history.
- **Saved versus pending durability:** NFR-2 guarantees browser-close/ordinary-restart survival for acknowledged records and attachments, while explicitly limiting pending-input retention to the open page. FR-21 exposes the four states; FR-31 requires both photo upload and association before Saved. No durable offline-capture commitment was introduced.
- **Same-item and dependent conflicts:** FR-42 allows independent items, preserves and compares stale attempted edits, rechecks selected reapplication, and rejects silent merging/overwriting. Its connected-operation paragraph covers records/state together and rejects stale recreation or writes to archived projects. The confirmed addendum explicitly includes same-item changes to different fields.
- **Evidence and retries:** FR-24/FR-31 and FR-42 retain distinct concurrent additions and duplicate-safe retries while preserving protected decisions, attempts and checklist context. The addendum explicitly handles uncertain timeout outcomes and version checks for mutable entries.
- **Snapshots and closeout:** FR-22 requires consistent saved versions and initiating-user pending/conflict resolution; FR-32 rechecks current outstanding work. FR-42 prevents mixed-version fixed snapshots. The confirmed addendum explicitly applies these guards to issuing, restoration and closeout, excludes other clients' unsaved work, and does not change optional approval rules.
- **Downstream choices:** The PRD accepts visibility within a few seconds while reserving exact timing and persistence implementation. The addendum explicitly labels about-five-second timing, transport/storage choices and versioning primitives as suggestions or OQ-9 work. Polling is not made a mandatory technology and no vendor is selected.
- **Decision status:** PRD, addendum, source index and conversation context consistently mark OQ-2 accepted and OQ-3 pending. The checklist/pass/phase details remain in the proposal section; OQ-3–OQ-9 remain open.

This disposition confirms consistency of the guided update, not acceptance of the next checklist recommendation or verification of its implementation.
