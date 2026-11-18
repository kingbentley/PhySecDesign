# Confirmed current issued-design reference

Date: 2026-11-17. Guided draft refinement; no application implementation or formal finalization.

## Authority and evidence

Kevin explicitly accepted the current-issued-design recommendation and requested its addition to the PRD. He asked for spreadsheet formats/column-mapping recommendations next; those choices are not accepted.

Read the current [source index](../source-index.md) and [canonical log](../.memlog.md), relevant FR-24/26/33/34/42/45 in [draft 0.22 PRD](../prd.md), and the PM-2 block in the [addendum](../addendum.md). That pending block supplies the accepted recommendation; its current pending label is superseded by the latest user confirmation. The new decision resolves PM-2 without reopening the accepted PM-1 container guard. All 148 inventory fingerprints were checked: 147 unchanged, with only the same documented .gitignore drift. No tests or app changes.

## Accepted capabilities and requirement mapping

| Accepted capability | Mapping and boundaries |
| --- | --- |
| One deliberately designated current issued reference per active work scope | Expand FR-26 or add a linked current-reference requirement, preserving existing IDs. Use a fixed named issued revision, not the mutable working record. Before issuance, show Not issued; the existing requirement to preserve an issue when installation begins still applies even when approval/handoff is skipped. Later work must not silently inherit the previous scope's issue. Link FR-38/45 scope identity. |
| Clear field-work reference | Show issue/revision identity, date, work scope and separate approval/bypass state where field work starts and when viewing the issued plan; provide a direct way to open that reference. Current issued design and working installation/as-built remain distinguishable. |
| Deliberate changes only | Saving a draft, creating an alternative or exporting a preview does not promote it. Record designation changes with actor/time and retain the sequence. FR-21/42 must guard concurrent designation changes so two editors cannot silently establish conflicting current references. |
| Superseded issues remain inspectable | Mark earlier issues Superseded in the live project and point to the current issue. Keep fixed revisions, comments, version-specific approvals, exact PDF files and designation history. FR-24/33/34 remain authoritative; no historical byte rewriting or recall of downloaded copies is implied. Any newly generated edition retains its source and decision/status cutoff. |
| Current is distinct from Approved | An issue's approval never transfers to another issue. Designation does not certify installation or passing tests. Preserve optional/bypassable approvals and do not add mandatory approval or installer acknowledgement. Link FR-23–26 as necessary. |
| Field record remains independent | Changing the reference must not roll back or overwrite placement, notes/photos, configuration, tests or actual connections. Use existing revision comparison to reveal differences against the working installation; meaningful actual changes follow existing history/retest rules. Merely changing the reference does not itself document physical work. |

## Minimal cross-reference work

- Connect FR-26 to the designated-current rule and clarify successive issues versus the one current reference for the active scope.
- Connect FR-42 to the shared scope/designation record and its history; this is a dependent shared change, not a last-write-wins label.
- Preserve FR-24's revision-specific decisions and FR-33/34 exact package retention/cutoff. A live Superseded label must not imply alteration of earlier downloaded or retained PDF bytes.
- Connect FR-38/45 reopening/work-scope semantics so the new scope starts without silently adopting the old scope's issue.
- Update active PM-2 pending labels in main/addendum/index/context and append a subsequent decision to the historical party record. Preserve historical chronology rather than rewriting earlier pending discussions as though already accepted.

## Consistency risks

1. Avoid an impossible mandatory-one-reference-before-issuance rule: Not issued is valid until the scope has an issue; installation-start issuance remains required by FR-26.
2. Keep designation separate from approval, physical changes, test outcomes and fixed PDF contents. The pointer can change while evidence, approvals and older files retain their original associations.
3. Validate the work-scope/current-reference relationship together under shared editing. A later scope or stale client must not silently replace the active scope's intended reference.
4. Supersession belongs to current live-project context; a historical package must remain identifiable by its retained source, edition and cutoff rather than be retroactively rewritten.

## Still open

OQ-10 now concerns supported spreadsheet formats and sheet/column mapping only; existing import, placement, reconciliation and bulk-cleanup rules remain confirmed. CSV versus Excel, worksheet handling and mapping details require their own decision. OQ-9 browser/accessibility, performance/fidelity, file/media/report/backup and recovery acceptance remain pending. No final approval, implementation claim or end of party mode is implied.

No inherent conflict was found between the accepted PM-2 scope and the existing fixed-history/optional-approval/field-record rules. The pending labels and explicit designation cross-references are the needed draft updates.


## Focused reconciliation — draft 0.23

No actionable discrepancy found in FR-61, linked FR-26/42/45, the confirmed current-issued-design addendum block, or current index/context. One deliberately designated fixed reference is scoped to the active work; Not issued remains valid before issuance, while installation-start issuance still follows FR-26. Drafts and preview exports do not promote themselves, and later scopes do not silently inherit old references.

Field records, revision-specific decisions and exact historical PDF bytes remain preserved. Current stays distinct from Approved/installed/tested; no inherited approval or new mandatory gate is added. Designation actor/time and shared conflict checks are explicit. PM-2 is resolved, while the CSV/.xlsx and column-mapping block is clearly an unaccepted OQ-10 recommendation; OQ-9 remains open. Status is draft 0.23/guided refinement, with no implementation, acceptance-pass or finalization claim. This was a narrow documentation check only.
