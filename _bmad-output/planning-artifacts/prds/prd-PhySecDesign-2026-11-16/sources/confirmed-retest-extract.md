# Confirmed targeted retesting decision extract

Recorded 2026-11-17 for guided PRD refinement. Sources: the presented OQ-4 recommendation in the [addendum](../addendum.md), [current PRD](../prd.md), and Kevin's latest Looks good response supplied for this task.

**Decision status:** Kevin accepted the presented targeted review/retest approach. Its pending labels are superseded at the product-behavior level. Keep the PRD draft and preserve stable FR numbering. OQ-5 scope/issue disposition remains open, as do OQ-6–OQ-9; the OQ-4 confirmation does not authorize a failure waiver, new implementation work, finalization, or compliance claims.

## Accepted distinctions

| Kind of change | Required treatment |
| --- | --- |
| Proposed design/intended work | Recalculate its planning analysis and update intended work/checks. Do not claim actual installation changed or invalidate an unchanged field record solely because the proposal changed. |
| Recorded actual installation/configuration/condition change | Flag the checks affected by the changed actual condition. Retain before/after values, actor/time and reason. |
| Record-only correction | Preserve its reason/source and review relevant documentation/evidence. Correcting a drawing to match already-installed reality does not automatically constitute physical work. |

Actual conditions may be recorded immediately under the existing editing policy. Review/retest follow-up is not a new prerequisite approval for saving them. Fixed survey, issued and closeout records remain historical references.

## Accepted default trigger rules

| Change | Targeted review/retest scope |
| --- | --- |
| Formatting, cost allowance, unrelated note | Documentation/estimate history only; no automatic functional retest. Changing a real device/system identity is not merely cosmetic. |
| Physical camera move/re-aim or height/lens/focus change | Affected placement/mounting and actual image/framing/focus/scene checks. Add connectivity/recording checks when associated cable/stream inputs changed. |
| Recording, network, controller/VMS association, sensor/intercom behavior settings | Changed configured values, connectivity and corresponding observed function/event/playback at the receiving system; preserve unrelated installation checks. |
| Physical cable, termination, port or power connection | Appropriate connection/link/power and affected endpoint function against project criteria. A route-drawing correction alone uses the record-correction path. |
| Shared switch/power/integration | Changed equipment and known connected/associated affected devices/functions. Show missing/uncertain relationships for manual scope review rather than assuming no effect. |
| Repair, physical replacement, return to service | Relevant installation/configuration/function checks for the changed condition. Replacement uses a new linked device ID; restored device retains its ID without inheriting current passes. Correcting a mistaken archive with no physical work uses the correction-review path. |
| Real wall/obstruction/scene, zone target or required criterion | Recompute affected analysis and review evidence coverage. Flag affected scene/acceptance checks for field retest where physical conditions/expectations changed. An analytical edit is not a field outcome. |

A core rule table plus manual selection of additional affected checks is sufficient. Use recorded relationships; do not claim complete impact discovery from incomplete topology. Reopening, changing a price, or hiding a display layer does not trigger blanket property-wide retesting. Scope and unknown/out-of-scope issue disposition remain OQ-5.

## Accepted history and follow-up behavior

- Preserve every original test attempt and its original **Pass, Fail, Not tested or Not applicable** outcome.
- Display earlier passes as dated historical evidence when relevant, with a separate **Needs review** or **Retest required** follow-up flag. These are not new test outcomes. A required check for the changed condition may be Not tested until a new attempt occurs; creating it must not fabricate a performed attempt or convert the preceding Pass to Fail.
- Identify the triggering change, affected device/check and reason for each follow-up.
- Editors may add affected checks or document that a suggested check is genuinely unaffected, supported by the relevant condition/evidence. Record disposition actor/time. This does not waive a still-applicable required check, missing evidence or unresolved failure.
- Do not use Not applicable to conceal failure or missing evidence merely to clear a flag. Detailed issue waiver/scope disposition stays OQ-5.
- A new attempt captures the actual device/check context and conditions tested. Clear required retest only when the current requirement and required evidence are satisfied and the relevant condition has not changed again.
- If a later concurrent change occurs, retain the earlier new attempt and keep follow-up for the newer context. An acknowledgement of an old-context pass cannot silently clear new-context work.
- Undo or restoration cannot automatically reinstate a passing current status. Preserve their recorded history and review applicability to the actual condition. Unaffected checks retain their evidence; no blanket reset is adopted.

## Completion, export and approval boundaries

Required pending retests and unresolved failures appear in device/floor/project remaining-work summaries and closeout exports. They prevent Completed under the existing rules. Explicit Closed with outstanding items remains available with its note/list. A historical Pass by itself does not satisfy a current changed-condition requirement.

Keep fixed earlier closeouts and approvals unchanged. Approval bypass cannot satisfy testing or retesting. Saving actual field conditions remains nonblocking under the existing optional-approval model. The accepted UFGS-informed pattern is scoped evidence/correction/retest history; it does not adopt government signoff gates, a universal retest matrix or certification obligations.

## Requirement mapping

| Existing or suggested requirement grouping | Accepted refinement |
| --- | --- |
| **FR-28 — Change effects and follow-up** | Main home for three change categories, targeted trigger rules, known relationships/manual additions, visible uncertainty, recalculation and separate review/retest flags. Replace its stale OQ-4 deferral with the confirmed policy and appropriate addendum reference. |
| **FR-27 — Direct installer changes** | Retain immediate actual-change recording and meaningful-change audit facts; distinguish actual changes from proposed actions and record corrections without adding an approval gate. |
| **FR-29–FR-30 — Check definitions/outcomes** | Criterion edits preserve old attempts; four outcomes remain exact. Needs review/Retest required are separate follow-up data, not new outcomes or automatic failures. A changed-condition required check may remain Not tested. |
| **FR-31 — Evidence, retesting and phase completion** | Preserve old context; new attempts record current context; completion requires current applicable evidence and no required pending retest/unresolved failure. Concurrent subsequent changes retain newer follow-up; do not let an old preserved Pass satisfy the new condition. |
| **FR-32/FR-33 — Closeout and package** | Show pending required retests and unresolved failures in remaining work and exported closeout, block Completed while they remain, and preserve explicit outstanding-items closure plus fixed previous closeouts. |
| **FR-21/FR-22 — Undo and restore** | Guard reversals/restoration without silently restoring a current pass or rewriting protected tests/follow-ups. Same-ID record restoration is not proof of physical operation. |
| **FR-25/FR-26 — Optional approvals/issued design** | Approval remains version-specific and bypassable; it does not clear follow-ups or change outcomes. Actual field observations remain saveable without review approval. |
| **FR-35/FR-36/FR-38 — Archive, replace, later work** | New physical replacements keep linked new IDs; return-to-service checks reflect real changed conditions. Mistaken archival corrections use documented correction review. Reopening alone never resets every device or inherits historic passes. |
| **FR-40/FR-41 — Planned versus actual conditions** | Proposed views affect intended analysis/work only; actual and correction categories govern appropriate evidence review. Display-layer hiding is not a retest trigger. |
| **FR-42/FR-43 — Shared consistency/site checks** | Version/context guards prevent stale attempts clearing later changes; known dependent endpoints and scoped site functions receive relevant follow-up without inferring complete topology or universal affected-device scope. |
| **Optional appended follow-up requirement** | If FR-28 becomes too dense, separate historical results/current follow-up, genuinely-unaffected dispositions, context-safe clearing, and summary/export behavior into one new ID after FR-43. Preserve existing IDs. |

## Four consistency risks

1. **Historical outcome versus current follow-up.** Never add Needs review/Retest required as fifth/sixth outcomes, mutate an old Pass to Fail, fabricate a performed attempt, or count a historical Pass as current satisfaction after a relevant condition changed. FR-31's phase-completion wording needs explicit current applicability/pending-retest handling.
2. **Targeted impact versus blanket resets and invented topology.** Proposed edits, record corrections and actual changes differ. A cost change, layer toggle, reopened project or corrected mistaken archive is not automatic physical work requiring every check again. Use known dependencies and explicit uncertainty/manual review; do not silently assume missing relationships mean no impact.
3. **Unaffected rationale versus unresolved-failure waiver.** A recorded explanation may establish that a suggested check is genuinely unaffected, but cannot waive an applicable required check, missing evidence or existing failure. Keep OQ-5 scope/disposition open, Not applicable honest, and Completed versus Closed with outstanding items distinct. Approval bypass does not clear retests.
4. **Concurrent retests/undo versus restored passing status.** New evidence must remain tied to the condition actually tested. Later changes preserve the attempt but keep new follow-up; undo/restore cannot erase audit history or automatically reinstate a current pass. Fixed closeouts/approvals stay fixed while the current work reflects unresolved follow-up.

## Integration cleanup

Mark OQ-4 resolved in the current PRD, addendum, source index, context and memory, preserving historical pending entries as chronology. Keep OQ-5–OQ-9 open and any next recommendation explicitly unaccepted. No main documents or application files were changed, no application tests were run, and no broad finalization review was performed for this extraction.

## Narrow reconciliation against draft 0.5 — 2026-11-17

**Result: no actionable discrepancies found in the accepted OQ-4 integration.** Reviewed the relevant PRD/addendum requirements, source index, and latest conversation/commissioning context only. Main documents were read only; no application tests, broad review or finalization was performed.

- **Triggers and scope:** FR-28 preserves proposed/actual/correction distinctions, targeted default rules, recorded dependencies, manual additions and visible uncertain impact. Cosmetic/cost/layer changes do not reset tests. The confirmed addendum retains detailed trigger boundaries without claiming complete topology or a blanket reset.
- **Outcomes versus follow-ups:** FR-30 retains four outcomes. FR-44 keeps original attempts intact, identifies separate Needs review/Retest required flags and their triggering context, and does not fabricate attempts or turn a historic Pass into Fail. Unaffected rationale cannot waive a required check, unresolved failure or missing evidence.
- **Freshness and completion:** FR-31 now requires passes applicable to the current tested condition and no required retest/unresolved failure. FR-44 ties new attempts to actual conditions/criteria and preserves follow-up after later concurrent changes; undo/restoration cannot silently reinstate a current pass.
- **Closeout and approvals:** FR-32 explicitly prevents Completed with required retests outstanding while permitting explicit Closed with outstanding items. FR-44 carries required follow-ups into summaries/exports and preserves fixed closeouts. Approval bypass cannot satisfy retests, and recording actual conditions has no new approval gate.
- **Decision boundary:** PRD, addendum, source index, conversation context and commissioning context consistently identify OQ-4 as accepted. OQ-5 remains an explicitly pending recommendation; its scope categories, stable issue-list mechanics and proposed out-of-scope/deferred-issue closeout treatment have not been promoted to accepted requirements. OQ-5–OQ-9 remain open.

This reconciliation confirms documentation consistency for the guided update only. It does not accept the OQ-5 proposal or verify application behavior.
