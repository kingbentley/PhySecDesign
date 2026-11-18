# Confirmed accidental draft deletion — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.15. Narrow extraction of the latest accepted deletion approach against the complete canonical decision log, current PRD/addendum and conversation/source context. This is not finalization or an application acceptance result.

## Authority, source review and disposition

The latest user accepts the draft-deletion approach and asks for POC acceptance criteria/limits next. This confirms the complete **Proposed accidental draft deletion — awaiting confirmation under OQ-8** block inspected in the [addendum](../addendum.md), superseding the preceding pending labels in the [PRD](../prd.md), [source index](../source-index.md), [canonical log](../.memlog.md) and [conversation context](conversation-context.md).

Read the source index and all 54,066 characters of the canonical log, including initial success/optional-approval decisions and every subsequent confirmation. Historical proposal entries remain historical; later explicit confirmations control. The accepted deletion policy completes the final listed OQ-8 decision, so **OQ-8 should be resolved**. OQ-1–7 remain settled; **OQ-9 is the sole remaining open question**. Asking for acceptance recommendations does not adopt new dataset sizes, timing, device/storage limits or a final signoff.

The parent author checked all 148 inventory entries for this turn: only .gitignore differs, with the other 147 unchanged. This extraction relies on that reported freshness check; it did not rerun application tests or repeat the full hash audit. The .gitignore difference is not a changed product capability.

## Candidate FR-55 and linked requirement mapping

Append **FR-55** for draft deletion, planned-item cancellation and protected correction, retaining all earlier IDs. Update remaining OQ-8 references and related recovery/lifecycle/scope clauses without changing their settled behavior.

| Accepted behavior | Affected FRs | Required interpretation |
| --- | --- | --- |
| Determine action from origin/history | New FR-55; FR-7/35/36/39/40 | Eligible quick deletion means an accidental proposed placement, never installed or surveyed as existing, absent from an issued/approved design, and without actual installation/configuration/test evidence. An untouched starter checklist is not field evidence. Draft label, unchecked Installed field, hiding a layer or missing price/serial do not establish eligibility. |
| Quick isolated Delete draft | FR-55/21/27 | Remove eligible working content and applicable proposed schedules/coverage/capacity/estimate contribution; show immediate Undo. No obligatory dialog or reason for an isolated eligible record. Record actor/time and stable identity/change history for guarded recovery. |
| Saved drafts and planning notes | FR-22/20/55 | A saved draft revision alone does not prevent changing current design; preserve its captured content. Planning notes do not become field evidence merely by existing. Keep original record/location context and make retained material accessible. Ambiguous eligibility requires review/correction, not an assumption that the asset never existed. |
| Issued/approved but never-installed proposal | FR-24/25/26/28/40/45/55 | Cancel planned item in current working revision with a short reason. Preserve issued representation/comments/decisions and show the change in comparison/closeout. Cancellation is not physical removal, a failed test or approval of the changed design. |
| Real or field-evidenced record | FR-35/36/46/55 | No quick draft deletion. Actual physical removal follows archive; duplicate/erroneous data uses a history-preserving correction with reason and retained-record reference where applicable. Do not fabricate a physical removal. |
| Preview dependent changes | FR-42/49/50/51/53/55 | When cables, components, notes/photos/comments, reservations or other dependencies exist, show effects before committing. No silent deletion of independent physical assets, shared controllers/switches, retained cables/risers, issues or evidence. |
| Draft cable and reservation cleanup | FR-9/51/52/53/55 | Existing/shared cable and historical endpoint records survive, with deliberate unresolved/unassigned proposed endpoint if needed. A dedicated disposable draft cable may be removed only if explicitly selected and independently eligible. Release only that proposal's identifiable planned reservation after checking other/current dependencies. No default route cascade or automatic current port release. |
| Retained linked material | FR-20/24/34/46/55 | Preserve notes/photos/comments and original context; identify where they remain accessible rather than orphaning/relabeling them. Deletion/correction does not repair or resolve a real property fault. |
| Cancellation accounting | FR-17/19/40/45/55 | Cancelled never-installed proposal exits current proposed equipment/capacity/supply totals, but cancellation remains visible in appropriate schedule/history. Recorded work, committed cost and unresolved disposition remain; no asserted refund. Existing surveyed assets/current demand do not disappear because a proposal changes. |
| Guarded own-session Undo | FR-21/42/54/55 | Revalidate current version, floor/placement and dependencies, including changed floor, reused port or later editor changes. Restore same draft identity only when valid; otherwise require review. No floor recreation, reassigned-port theft or reversal of later work. Retrying a completed deletion/reversal must not duplicate action. |
| Preserve history and bounded recovery | FR-22/24/33/34/55; NFR-1/2/6 | Named revisions, issued designs, review decisions, closeouts and evidence stay unchanged. Deletion affects current working content and adds history; it is not permanent property-record erasure. No new recycle-bin UI, arbitrary retention duration or indefinite cross-session Undo guarantee. Retained revision/history/backup recovery remains. |
| Separate design action from field lifecycle | FR-28/31/44/53/54/55 | Undoing draft deletion is a design edit, not physical return to service, reconnection, completed installation or a test Pass. Known real installation and existing current-context evidence rules still apply. |

Broad floor deletion and bulk asset cleanup remain outside this specific accepted feature; resolving OQ-8 does not add those workflows.

## Confirmed action distinction

| Example | Accepted action and retained truth |
| --- | --- |
| Extra unissued/uninstalled CAM-099, no consequential dependencies | Delete draft, visible Undo, no mandatory reason/dialog; preserve stable ID/change history. |
| CAM-099 exists in a saved draft snapshot only | Current eligible placement can still be deleted; old snapshot remains inspectable. |
| CAM-099 was issued/approved but will never be installed | Cancel in current revision with reason; preserve issued representation and decisions, and expose scope/cost consequences. |
| Record represents a surveyed/installed/tested camera | Actual removal/archive if the hardware was removed; explained record correction if data is wrong or duplicated. No quick draft deletion. |
| Eligible draft references retained cable/photo/shared controller | Preview and reconcile dependencies while preserving independent physical records and evidence. Explicitly selected, independently eligible draft-only cable is the limited optional cleanup case. |
| User undoes after another editor changed the floor/port/dependency | Guarded review of current context; do not blindly resurrect stale associations. |

## Compatibility with approvals, history and success

No conflict with confirmed optional approvals or immutable history was found. The complete log confirms that approvals are recommended, bypassable and version-specific; solo users can proceed. The new issued/approved distinction chooses a history-preserving cancellation action and reason, **not a requirement for another approval or reviewer**. The changed design does not inherit approval, and prior decisions remain intact.

The accepted policy also matches SM-1 through SM-4 and their counter-metrics:

- **Workflow and solo operation:** an isolated accidental placement remains quick to fix; cancellation/correction do not introduce handoff or external signoff.
- **Preserved history:** remove current working content without erasing named/issued/closeout snapshots, evidence, identity or later edits.
- **Honest outcomes:** cancellation/deletion are design/disposition states, not a fifth test outcome, N/A waiver, physical-removal claim, Pass or repair. Actual failures/required retests/property issues remain governed by FR-31/32/44/46.
- **Shared-device integrity:** own-session Undo, version checks, dependent changes and duplicate-safe retries preserve newer edits; saved versus pending status remains truthful.

For the next OQ-9 recommendation, include representative deletion/cancellation/correction/dependency/undo cases in the agreed acceptance fixture alongside the broader accepted workflow. Do not reduce acceptance to fast deletion or improved “complete” totals. Numeric targets and test setup remain pending; this documentation extraction demonstrates no runtime pass.

## Four integration risks to watch

1. **Eligibility inferred from one field.** Preserve origin/history checks. Untouched starter checks and genuine planning notes are not actual field evidence, while unknown installation status is not proof of never-installed status.
2. **Cancellation becomes approval or erase-all.** Preserve issued comments/decisions, committed costs/work and unresolved issues. No new signoff gate, inherited approval, refund assertion or actual-removal claim.
3. **Cascade versus dependency review.** Do not use the prototype's connected-route deletion for retained physical cables or shared components. Keep evidence accessible and current port occupancy intact; only explicit eligible draft cable/reservation cleanup is allowed.
4. **Undo overpromised.** Recovery is stable-identity and current-context guarded, not indefinite offline/cross-session undo or automatic floor/port resurrection. Existing access, evidence and fixed-record protections still apply.

## Required status edits in the main draft

Mark draft-deletion block confirmed and add FR-55/linked checks. Update OQ-8 to resolved and the affected FR-36/48/49/51/53/54/context references as applicable, while retaining the confirmed distinctions rather than broad “all deletion” language. OQ-9 should remain explicitly pending, with numeric success/limits still to be discussed. Keep the PRD in draft and do not claim completion of implementation, acceptance testing or final product approval.

Only this source extraction was written. No main documents, application files, tests, extra agents or broad finalization review were changed/performed.

## Focused reconciliation — PRD draft 0.16 (2026-11-17)

No actionable discrepancies found in FR-35/36/42/55 and the confirmed addendum block.

The integration preserves history-based quick-delete eligibility, no obligatory dialog/reason for an isolated eligible draft, dependency preview, independently eligible/explicit draft-cable cleanup, planned-reservation safeguards, retained accessible evidence and protected real/shared records. Issued/approved proposals use reasoned cancellation without inherited approval, physical-removal claims, erased recorded work/costs or refund assumptions. Real/field-evidenced assets follow actual-removal archive or explained correction. Saved draft snapshots do not prevent current eligible edits.

FR-42 explicitly includes deletion eligibility/dependencies in connected validation. FR-55 preserves same-ID guarded own-session Undo, current placement/port/version checks, duplicate-safe retries and fixed history, with no indefinite cross-session undo or new recycle bin. The acceptance check correctly rejects stale quick deletion after a concurrent test entry or issuance. These rules retain optional approvals and the existing honest-outcome/history success requirements.

No stale OQ-8 pending labels were found in the main PRD or addendum. OQ-8 is explicitly resolved, and OQ-9 is the only open-question row. The new addendum heading **Proposed POC acceptance criteria and limits — awaiting confirmation under OQ-9** and its introduction clearly identify figures as pending targets, preserve all confirmed FRs/NFRs and distinguish them from measured performance/production guarantees. Context/index synchronization was underway and outside this requested reconciliation.

Only this result was appended. No main documents, application changes, tests or broad finalization review were performed.
