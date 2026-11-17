# Draft decision extract

Prepared 2026-11-16 for consolidation of the **first full PRD draft**. This is a decision extraction, not a completed PRD, implementation specification, fresh validation, or approval of the document. Keep the PRD status **draft**.

Sources: [current PRD](../prd.md), [decision memory](../.memlog.md), [conversation context](conversation-context.md), and the latest user confirmation supplied for this consolidation:

> Yes, let's keep one project per property and reopen it with new revisions for later work. Go ahead and consolidate everything we've agreed on into the first full PRD draft.

Treat this confirmation as adoption of the immediately preceding later-work recommendation. The older source passages describing that recommendation as unconfirmed are stale and should be reconciled during consolidation.

## Settled product requirements

### Purpose and POC boundary

- Serve physical security professionals carrying a property from discovery and design through installation, configuration, testing, closeout, and later building changes.
- Preserve the proof-of-concept framing. These agreements expand the intended POC beyond the current design prototype; they do not establish production readiness or production operating targets.
- Support creation of a project, property lookup, plan import, equipment placement, space/coverage analysis, cable routing, cost estimates, and a shareable design/installation package.
- Installer handoff is optional. The person doing the work can continue without a separate installer or approver.
- Previously expressed design requirements remain inputs: address/satellite context, two-point drawing alignment, selected PDF-page import, security equipment, routes/endpoints, camera and combined DORI coverage, obstructions/blind spots, named security zones and target shortfalls, surveys, PDF plans/schedules/photos, storage/bandwidth/PoE estimates, costs, autosave/undo, named revisions/comparisons, and existing-versus-proposed equipment. Detailed implementation and verified acceptance must be grounded in the separate baseline sources. The 90% entrance DORI target is an example, not a universal requirement.

### Shared online work and field access

- Designers and installers work in the **same persisted shared online project**. File exchange is not the primary collaboration mechanism; portable exports and backups remain useful.
- Installer workflows support phones, tablets, and laptops.
- Online access is sufficient. Offline capture and later synchronization are outside this POC scope.
- Shared demo access is sufficient. Individual accounts and account-based invitations are not required.
- Captured names provide demo attribution, not verified identity. Shared demo access does not waive revision/history preservation or imply that current browser-local storage already meets shared-project needs.

### Approvals, phases, and closeout

- Core phases are planning, installation, configuration, and testing. Design review/approval and final acceptance/handover are optional checkpoints.
- The expected approving party is the client or site owner. Assign people per project and checkpoint; the same person can handle both, and an internal-project user can approve their own work.
- Every approval can be bypassed. Separate reviewer assignment, sign-off, and an external approval process cannot be prerequisites for progressing work. No mandatory bypass reason was requested.
- Preserve the distinction between actual approval and bypass. Neither changes installation facts or test results.
- Keep project closeout separate from approval, device state, and archival state.
- Use **In progress**, **Completed**, and **Closed with outstanding items**. Completed means no unfinished in-scope work, applicable unperformed required tests, or unresolved failures remain. Explicit closure with outstanding items retains the open work and a brief project-level closeout note. Follow-up owner and due date are optional.
- Outstanding work appears in the remaining-work list and closeout export. Offer continued work or explicit closure with outstanding items rather than silently declaring completion.
- Retain failures, correction notes, and retests. Approval, bypass, or closure never converts Fail or Not tested to Pass.
- Allow reopening while preserving the preceding closeout record.

### Installation, configuration, and test evidence

- Provide reusable editable starter checklists by device type plus a generic option. Project teams can tailor checks and expected outcomes.
- Technicians perform the checks and record the results; computed coverage is not a field-test pass.
- Keep installation outcome, configuration work, and testing separate. Installed does not imply configured, passing, or operational.
- Record expected and actual results, actor/time, notes, and optional photos. Projects may require photos/evidence; the default is optional.
- Individual test outcomes are **Pass**, **Fail**, **Not tested**, and **Not applicable**. Require short explanations for Fail and Not applicable; do not count Not applicable as a Pass.
- Retain successive test attempts, correction notes, and attached evidence. Preserve the wording and expected result associated with past evidence when templates or checklists change.
- Show progress by device/floor and a project remaining-work summary, feeding closeout and its exported records.

### Installer changes and issued design

- Authorized installers directly update the shared working installation plan without waiting for optional design review.
- Preserve a named fixed issued-design revision as a reference even when approval or separate handoff is skipped. Approval/bypass belongs to its own revision.
- Meaningful equipment, location, or cable changes record affected IDs, before/after values, actor, time, and a short reason; photos are optional. Routine checklist entries and uploads retain history without a design-change reason each time.
- Compare working installation with the issued design; new issued revisions add records instead of overwriting prior ones.
- Recalculate affected coverage, routes, estimates, and capacity. Highlight affected targets and checks that may need review/retest. Preserve original test evidence.
- Reviewers may request follow-up; such requests cannot erase observed installation conditions. Saving actual conditions is nonblocking, while follow-up remains visible.
- Approval of an issued design does not automatically approve later changes or revisions.
- Closeout drawings reflect the current installation record while retaining issued-design references and remaining work.

### Device archives and replacements

- Archive devices reversibly, retaining captured identity, location, settings, connections, installation/configuration history, tests/retests, notes/photos, and other evidence. Do not require an identity field that was never captured merely to archive the record.
- Record removal/archive date and actor, with optional reason and replacement link where applicable.
- Hide archived equipment from the normal working plan and active schedule; exclude it from current coverage, active counts, current equipment estimates, and capacity/PoE totals.
- Preserve previous revision/report values. Provide a searchable archive and an optional historical-plan view with archived labeling; include archived records in portable backups.
- Restore the same device ID/history and record restoration. Restoration cannot overwrite an active replacement or make historical passing tests proof of the restored installation.
- A different physical replacement gets a new ID linked to its predecessor.
- Device archive, project archive, closeout, and permanent deletion remain distinct concepts.

### Continuing property project and later revisions — now confirmed

- Keep **one continuing project per property**, reopening it with named revisions for later work. Separate concurrent jobs within the property are not required for this POC model. The prior recommendation included a property/campus model; avoid imposing a new campus boundary rule beyond the agreed property continuity.
- On completion or explicit closure with outstanding items, preserve a fixed named closeout record of installation, drawings, schedules, estimates, evidence, approvals/bypasses, changes, and remaining work.
- When inactive, the project may be archived. Archived projects stay searchable, viewable, and exportable, with editing paused until reopening. Device archives and all preceding revisions survive project archival.
- Reopen from the latest installation record into a new named working revision, retaining project/device IDs, describing the new scope, and returning current work to In progress. Keep the previous closeout fixed.
- Preserve active/archived equipment, locations, connections, evidence, and replacement history together. Reopening does not automatically restore removed devices.
- Create a fresh estimate for the new scope while retaining prior estimates. Do not charge existing installed equipment/cabling again solely because it remains on the plan.
- New or changed work receives its own checklist/test evidence. Earlier results remain dated history and do not automatically satisfy new-work checks.
- Carry unresolved items forward visibly. Reopening does not resolve them; later disposition remains recorded.
- Issue and close the new work with new fixed records. Approval assignments can be reused or changed, but previous decisions do not automatically apply; approval remains optional.

## Prior assumptions superseded by explicit confirmations

| Prior proposal or open question | Current settled position |
| --- | --- |
| Design review and acceptance might be required gates or need external reviewers. | Both are recommended, bypassable checkpoints with project-specific assignees; self-approval is allowed. |
| Closeout handling of unfinished work or failed tests was undecided. | Three project states, explicit outstanding-item closure with note/list, retained evidence, and reopening are confirmed. |
| Removed-device retention/restoration was undecided. | Reversible archive retaining history, current-calculation exclusions, same-ID restoration, and linked new-ID replacements are confirmed. |
| Technician evidence could be only freeform notes/photos. | Editable device-type checklists, explicit result states, expected/actual evidence, actor/time, retest history, and optional photos by default are confirmed. |
| Field devices or offline needs were unknown. | Phones, tablets, and laptops; online-only POC is confirmed. |
| Files might be the primary designer/installer exchange mechanism. | Shared online project is required; file export is supplemental. |
| Installers might only submit proposed changes. | Direct authorized updates to working installation, fixed issued design, history, and optional nonblocking review are confirmed. |
| Named reviewers imply individual sign-ins and account invitations. | Shared demo access and demo attribution are sufficient for the POC; identity is not verified. |
| Later work might require separate linked projects; whole-project archival was undecided. | Latest confirmation adopts continuing property project, fixed closeouts, read-only archives, and reopening into named revisions with scoped estimates/evidence. |
| A complete PRD should wait for every discovery detail. | User authorizes the first full draft now, with genuinely unresolved details explicitly recorded and status remaining draft. |

## Genuinely unresolved questions

These need definition without reopening the settled product choices above.

1. **Shared-work design:** exact demo-access mechanism, how editing permissions/roles are demonstrated, saved-update visibility, concurrent-edit handling, and recoverable failure behavior. Shared demo access is not a decision to use browser-local project state.
2. **Checklist details:** starter content for each supported type, required versus optional checks, project-specific pass criteria, applicable system-level checks, and precise phase-progress/completion rules. Checklist structure and honest result states are settled.
3. **Changed-work evidence:** rules mapping particular field changes/restorations to review/retest requirements, plus how new-work scope selects existing assets and appropriate checks without silently inheriting old passes.
4. **Scope and carryover mechanics:** how users select new work, distinguish retained equipment from chargeable additions/changes, and record dispositions of carried-over outstanding items. Preservation, visibility, fresh scoped estimates, and no automatic resolution are settled.
5. **Package/report details:** final installer/reviewer/closeout package manifest and layout; current versus historical device inclusion; representation of prior closeouts/revisions and evidence attachments. Current package must reflect actual installation and visible outstanding work; fixed historical records remain intact.
6. **Device/cable edge cases:** treatment of current routes and endpoints when a device is archived/replaced/restored; restoration with a deleted or changed floor/connection; permanent deletion of accidental draft placements.
7. **No-handoff interaction details:** how the same participant selects responsibilities and views progress when there is no separate installer handoff. Supporting that workflow is settled.
8. **Engineering and acceptance targets:** architecture/persistence design and measurable performance, scale, accessibility, supported-browser/device acceptance, backup/recovery, and deployment targets have not been agreed here. Define or label them as proposed; do not invent production commitments.

## Contradictions and drafting risks to watch

1. **Optional approval versus honest completion:** bypassing sign-off must remain possible, but it cannot satisfy unfinished work, unperformed tests, unresolved failures, or retest needs. Completed and Closed with outstanding items must stay distinct; Not applicable is not a passing test.
2. **Shared project versus shared demo access:** simplified access does not remove shared persistence/update needs. Captured actor names do not provide verified identity or a production security/audit assurance. The existing browser-local draft and revision-review service are baseline evidence, not proof of the new collaboration requirement.
3. **Revision approval versus actual field conditions:** issued approvals remain attached to immutable revisions; field edits are allowed and record reality immediately. Correction requests cannot erase history, and later working/issued revisions cannot inherit approval accidentally.
4. **Reopened scope, costs, and tests versus historical evidence:** reopened work must preserve fixed prior closeouts while deriving a new scope, estimate, and appropriate checks. Do not rebill retained assets, erase carried issues, revive archived devices, or convert historic passes into current proof merely by reopening.
5. **Requirement versus implementation versus external guidance:** original feature requests, current code, prior test evidence, and these new decisions are different evidence classes. No fresh tests were run for this extraction. UFGS and SiteOwl references provide context, not adopted mandatory gates, a reviewed PSP source set, certification, or proof that the POC already meets the expanded requirements.
