# Confirmed unused-draft container deletion

Date: 2026-11-17. Guided PRD refinement, not finalization or implementation verification.

## Authority and sources

Kevin explicitly accepted the unused-draft-only floor/building deletion recommendation and requested its addition to the PRD, then asked about the current issued design. That confirms PM-1 only; PM-2 remains a proposal.

Read the current [source index](../source-index.md) and [canonical log](../.memlog.md), then the relevant FR-1/4/21/22/26/33/34/42/54/55/59 clauses in [PRD draft 0.21](../prd.md), [addendum](../addendum.md) floor-restoration and party scope clauses, and PM-1/PM-2 in [party review round 1](party-review-round-1.md). Checked all 148 inventory fingerprints: 147 unchanged; only the previously documented .gitignore drift remains. No application work or tests.

## Accepted scope and mapping

| Accepted scope | Mapping / required relationship |
| --- | --- |
| Quick deletion is limited to an unused draft floor or building with no dependent active records or historical references. | Add a stable container-deletion requirement, candidate FR-60; link FR-1 maintenance to it. Eligibility is about actual dependencies and retained context, not the project being labelled Draft. An apparently empty plan alone is insufficient. |
| A container with dependent assets, routes/risers, evidence or retained historical references is blocked, with visible reasons/affected records. | FR-60 with FR-42 and FR-22/26/33/34: preserve the container and require deliberate resolution; never silently cascade-remove dependent content or damage old revisions, issued designs, reviews, packages or evidence. Building-level eligibility must include its floor/dependency context. |
| Device cleanup and container deletion retain separate eligibility. | FR-55/59 do not authorize deleting their parent floor/building. A draft device can be eligible for cleanup while a container is protected by historical references. Bulk cleanup cannot be used as an automatic cascade or as proof that all container references are gone. |
| Shared edits and recovery remain guarded. | FR-21/42: validate current container/dependency state at execution, including concurrent additions; preserve activity and supported guarded own-session undo without erasing another editor's work or fixed records. Do not introduce an indefinite recycle bin or hard-purge promise. |
| The change does not create a full retirement/relocation workflow. | No automatic floor/building retirement, bulk relocation, evidence transfer, physical equipment removal, or cascading rewrite is accepted. Blocked containers remain preserved under existing rules until dependencies can be deliberately resolved. |
| Floor restoration remains valid and distinct. | FR-54 still handles unresolved/deleted legacy floor references and changed drawings by requiring an explicit valid destination and preserving former context. A stricter current deletion guard neither eliminates those cases nor authorizes guessing/recreating a missing floor. FR-4 drawing replacement/alignment remains different from deleting the floor. |

## PM-2 is still a recommendation

The existing FR-26 creates successive immutable issued designs; FR-24 and FR-33/34 preserve revision-specific approval and exact package history. The still-pending PM-2 recommendation is one explicitly designated current issued reference per active work scope, with the issue/revision shown where installation work starts and older references visibly superseded in the live project.

Designation would not overwrite field edits, inherit approval, mutate retained PDF bytes or impose a new mandatory approval gate. Old downloaded PDFs cannot be retracted; their original edition remains historical. This confirmation does not yet add that capability or settle who changes the designation or its detailed interaction.

## Conflicts and cross-reference work to watch

1. Current active addendum/index status still calls both PM-1 and PM-2 unaccepted. Update PM-1's current disposition while retaining PM-2, OQ-9 and OQ-10 formats/mapping as pending; historical proposal text can remain when clearly superseded.
2. FR-55 allows device working-content deletion despite a named draft snapshot; the new container rule is more restrictive when historical container references exist. State that distinction rather than importing device eligibility into container deletion or relaxing protected context.
3. Preserve FR-54's missing-floor handling. The accepted prevention rule applies to present deletion, not a claim that older/imported data can never contain unresolved floor references.
4. Clarify that no dependent-record cascade includes building children and shared cross-floor routes/risers. Current-version checks must catch a dependency created after the deletion preview; a visually empty plan is not proof of eligibility.

The floor-restoration addendum sentence saying that its original confirmation did not cover a broader floor-deletion workflow remains true historically, but should point to the newly accepted narrow guard. The earlier draft-device block excluding broad floor deletion should likewise distinguish the new bounded guard from the still-unrequested full retirement subsystem. No substantive conflict with fixed history, optional approvals or current-issued-reference proposals is inherent in the accepted scope.


## Focused reconciliation — draft 0.22

No actionable discrepancy found in FR-60, linked FR-1/42/54, the confirmed addendum block or current index/context. The rule is limited to unused draft containers; active/archived references, child floors and retained history block deletion with visible reasons. No dependent-record cascade, automatic relocation or full retirement workflow is added. Concurrent dependency checks and guarded same-identity Undo preserve later work; ordinary creation/deletion audit entries do not falsely imply operational use.

FR-54 explicitly retains recovery for already-missing/unresolved floors while new deletion follows FR-60. Device/import cleanup remains separately governed by FR-55/59. Current labels resolve PM-1 and keep PM-2 explicitly proposed, with OQ-9 and OQ-10 formats/mapping open. PRD status remains draft 0.22/guided refinement, without an implementation or finalization claim. Earlier concerns about active pending labels are addressed. No application checks or broad review were performed.
