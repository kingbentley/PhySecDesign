# Discovery notes before first full draft

Relative links have been adjusted for this preserved copy’s location.

Historical capture of guided discovery on 2026-11-16. Later confirmations in `.memlog.md` and the consolidated PRD supersede proposal labels here. This is retained for rationale and source continuity.

---
title: "Site Studio — Product Requirements"
status: draft
created: 2026-11-16
updated: 2026-11-16
phase: discovery
working_mode: guided
entry_point: vision-and-features
---

# Site Studio — Product Requirements

This workspace is in guided discovery with Kevin. The product remains a proof of concept, with an intended workflow extending from physical-security design through installation, commissioning, and building lifecycle records. The sections below record confirmed direction and proposals for discussion; detailed requirements and acceptance rules remain to be developed together.

The [source index](../source-index.md) records the existing implementation, project documents, design references, and test evidence. The source index describes the current baseline; it does not make those implementation choices permanent product requirements.

## Confirmed vision

Site Studio should let a physical security professional carry a project from finding and analyzing a property through design, review, installation, and commissioning. The project should remain useful for later building changes, with completed work and removed devices retained as historical records.

Installer handoff is optional. The workflow must support both handing the project to an installer and continuing without a separate handoff.

## Confirmed end-to-end outcome

For Kevin to consider the POC successful, a professional should be able to:

1. Create a project, find the property, and import its floor plan.
2. Place devices while analyzing the space and checking coverage.
3. Route cables and estimate costs.
4. Share a complete design package for review and installation, optionally handing the project to an installer.
5. Document installation and testing progress, including devices not installed, with photos and notes.
6. Commission the site through tracked phases.
7. Export or archive the work for later revisions, and archive devices removed during the building's lifecycle.

These are desired outcomes, not claims that all of them are implemented. Existing design, survey, report, revision, and review capabilities provide a starting point. Installation/commissioning workflows and device lifecycle archives are newly confirmed scope beyond that baseline.

## Confirmed shared project and field platform

Designers and installers must work in the same shared online project for the POC. Exchanging project files is not the primary collaboration workflow; portable files remain useful for backup and export.

Installer workflows must support a mix of phones, tablets, and laptops. An internet connection is sufficient for the POC: offline field capture and later synchronization are outside this POC scope.

The shared project must retain saved work so participants can access the same project records across those devices. Shared demo access is sufficient for the POC; individual sign-in accounts and account-based project invitations are not required. Named project assignments and review workflows remain useful, but recorded participant names are demo attribution rather than verified individual identities.

The exact shared-access mechanism, role demonstration, update visibility, and concurrent-edit handling remain to be specified. Shared demo access does not change the requirement to preserve each issued revision and its history.

This extends the implementation baseline. The current browser-local project draft and local immutable revision-review service do not provide shared editing of the full project. Shared project persistence and participant access need to be designed; production deployment and operating targets have not been established by this decision.

## Confirmed approval policy

Design approval and final site acceptance are recommended, optional checkpoints. The expected approving party is the client or site owner, with the actual people assigned separately for each project. The two checkpoints can have different assignees or the same person. For an internal project, the user doing the work may also perform the approval.

Any approval can be bypassed. Assigning a separate reviewer, receiving a sign-off, or completing an external approval process must not be required to progress through the project. Approval settings are project-specific rather than a universal requirement for every job.

For accurate history, the proposed presentation distinguishes an actual approval from a bypass. Bypassing an approval does not change installation records or test results. This representation follows from the optional approval policy; no mandatory bypass reason or external authorization is assumed.

## Commissioning workflow under discussion

Kevin explicitly named **planning, installation, configuration, and testing**, and invited appropriate additions. The following sequence includes recommended review and acceptance checkpoints, which Kevin confirmed must remain optional. Completion evidence below is proposed, not yet an agreed set of blocking rules.

| Phase | Purpose and proposed completion evidence | Decision status |
| --- | --- | --- |
| Planning | Property, drawings, equipment, coverage, routes, and estimates form a design package ready for review or installation. | Phase confirmed; completion criteria proposed |
| Design review and approval | When requested, the project's designated person reviews a named design version for installation. The checkpoint can be bypassed. | Optional approval and project-specific assignment confirmed |
| Installation | Device installation progress, including work not installed, is recorded with relevant notes and photos. | Phase confirmed; treatment of incomplete work unresolved |
| Configuration | Device and system configuration work is recorded as ready for testing. | Phase confirmed; required configuration records unresolved |
| Testing | Test outcomes and supporting evidence are recorded; failures and outstanding work remain visible. | Phase confirmed; tests and pass criteria unresolved |
| Acceptance and handover | When requested, the project's designated person accepts the site and final installation records. Approval can be bypassed; installer handoff is also optional. | Optional approval and project-specific assignment confirmed; closeout behavior confirmed below |

Ongoing building records, later revisions, and removed-device archiving continue after commissioning; they are not a final commissioning checkpoint. Device installation, testing, and archival state should be discussed separately from project phases so a site can accurately represent devices at different points in the work. The exact state model remains open.

The recommendation to distinguish documented testing from acceptance is informed by [UFGS electronic security acceptance-testing guidance](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf), which addresses test planning, results, witnessing, and review. It is context for the proposed app workflow, not an adopted contract or a claim of compliance. Supporting source notes are in [commissioning references](commissioning-context.md).

## Confirmed closeout behavior

Kevin confirmed the recommended approach to unfinished installation work and failed tests. Project closeout is separate from approval: an approval may be bypassed without changing the evidence of what was installed or tested.

| Project state | Confirmed meaning |
| --- | --- |
| In progress | Work or testing remains open; normal continuation is expected. |
| Completed | No unfinished work, unperformed required tests, or unresolved failures remain within the agreed project scope. The required test criteria still need definition. Approval may have been performed or bypassed. |
| Closed with outstanding items | The user explicitly closes the project while unfinished work or unresolved failures remain. The remaining items and closeout note are retained and visible. Approval may have been performed or bypassed. |

Confirmed behavior:

- If there are outstanding items, offer continued work or explicit closure with outstanding items; do not silently label the project Completed.
- Show the affected devices, missing installation/configuration work, unperformed tests, and failed tests in a remaining-work list and the exported closeout package.
- Ask for one brief project-level closeout note when closing with outstanding items. Assigning follow-up owners and due dates can remain optional for the POC.
- Retain the actual test results and later retests. Closing a project, bypassing approval, or giving approval does not turn a failure or an unperformed test into a pass.
- Allow reopening the project to finish work while retaining the earlier closeout record.

This flexible closeout status is a confirmed product choice. The commissioning references support preserving failure, corrective-action, and retest evidence; they do not establish that closing with unresolved issues constitutes successful acceptance.

## Confirmed removed-device archive behavior

Kevin confirmed reversible device archiving with all recorded history retained. The core behavior below is agreed; detailed edge cases are listed separately for later discussion.

Archive a device without erasing its record. Keep it out of the current design by default while making its history searchable. Here, inclusion in the current design does not imply that a device is installed, tested, or operational; those facts remain separate.

| Information | Confirmed archive contents |
| --- | --- |
| Identity | Original device ID, name, type, make/model, and serial number if captured. Do not require a previously absent field just to archive a record. |
| Location and design | Last building/floor and position, mounting/optical settings, configuration details already recorded, and links to the relevant saved designs. |
| Work evidence | Installation/configuration history, test results including failures and retests, photos, measurements, notes, and other attached records already captured. |
| Removal record | Removal/archive date, who recorded it, an optional reason, and a link to a replacement device when applicable. |
| Connections | Historical cable/connection references so the prior installation remains understandable. |

Confirmed behavior:

- Hide archived devices from the normal working plan and active equipment schedule. Provide a searchable archive and an optional historical-plan view with clear archived labels.
- Exclude archived devices from current camera coverage, active device counts, current equipment estimates, and capacity/PoE demand. Preserve previous revision and report values. Detailed handling of active routes connected to an archived device remains open.
- Include archived records in portable project backups. How to include historical devices in printable reports remains to be decided; current reports should not present removed devices as active equipment.
- Allow restoring the same device record to the current design with its ID and history intact. Record the restoration. Handling missing former floors or connections remains an edge case to define.
- Treat a different physical replacement as a new device ID linked to its predecessor. Restoring an archived record must not overwrite an active replacement or imply that an old passing test proves the present installation has passed.
- Keep archiving distinct from permanent deletion. The policy for deleting accidental draft placements is a separate decision.

This keeps device archiving separate from project closeout and whole-project archiving. Whole-project archive behavior still needs definition.

The historical-record approach is consistent with the archive pattern described in [SiteOwl's physical security asset-management guide](https://getsiteowl.com/physical-security-asset-management-software/). Restoration, current-calculation exclusions, and replacement linking above are confirmed Site Studio product choices, not claims about that product.

## Confirmed installation, configuration, and testing records

Kevin confirmed the combination of reusable device-type checklists and notes/photos for the POC. The record behavior below is agreed; the example checks still need tailoring to the actual equipment and project.

Provide small starter checklists for the equipment types in the catalog, plus a generic checklist for other devices. Let the project team adjust the checks and expected results for its project. For the POC, technicians perform the work and checks and record the results in Site Studio.

| Phase | Example checklist content to tailor to the project | Supporting record |
| --- | --- | --- |
| Installation | Confirm the actual device and location, mounting, labels, and cable/power connections; record changes from the design or work not installed. | Device identity/location, installation outcome, notes, and useful photos. |
| Configuration | Record applicable network address, recorder/controller association, and operational settings. For a camera, examples include stream and recording settings. | Relevant configuration values, who recorded the work, and when. |
| Testing | Check the device's intended function and its connection to the wider system against a stated expected result. Camera examples include live image, recorded playback, and the intended view; other device types use their own checks. | Expected result, actual outcome, observations, and optional photos or attachments. |

These are starter examples, not a universal installation or commissioning test procedure. Test criteria must suit the actual device and project. Calculated coverage does not automatically mark a field check as passed.

Confirmed record behavior:

- Keep installation outcome, configuration work, and test results separate. A device can be installed while configuration remains incomplete or a test has failed.
- Use **Pass**, **Fail**, **Not tested**, and **Not applicable** for individual test results. Not applicable is visibly distinct from Pass and carries a short explanation.
- Record who entered a completion/result and when. Let the technician add notes and photos at any stage; default photo attachments to optional, with project-specific evidence requirements where needed.
- Ask for a brief note on a failed test so the remaining-work list identifies the issue. Allow correction notes and a new test attempt without replacing the earlier result or evidence.
- Show progress by device and floor, with a project summary of remaining installation/configuration work and failed or unperformed applicable tests.
- Feed unresolved work and tests into the confirmed closeout behavior. Bypassing approval does not complete a checklist or change a test result.
- Preserve the checklist wording and expected result associated with recorded evidence. Later template or project-checklist edits must not silently rewrite past results.
- Include the completed records and outstanding items in the review/installation closeout package, alongside the existing drawings, schedules, and notes.

The emphasis on retained results, failures, corrections, and retests is informed by [UFGS electronic security test-log and final-report guidance](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf), sections 3.3.5 and 3.4. Editable templates, result labels, and POC evidence defaults are confirmed Site Studio product choices rather than requirements imported from that source.

## Confirmed installer changes and installation record

Kevin confirmed direct installer updates with a preserved issued design for the POC. Users with installer editing permission update the shared working installation plan; the issued design remains a fixed reference.

| Record | Purpose |
| --- | --- |
| Issued design | A named, fixed revision of the intended design at the start of installation. Its approval or bypass status stays attached to that revision. This reference can be created even when a separate installer handoff or approval is skipped. |
| Working installation plan | The shared record of the actual installation as field work proceeds. Authorized installers update device locations, equipment and cable routes here; designers can see the saved changes and compare them with the issued design. |

Confirmed behavior:

- Let installers save actual field changes without waiting for an approval. Keep formal approval optional under the confirmed project policy; bypassing an approval is separate from granting editing access.
- Mark meaningful device/equipment/cable design changes as changed in the field. Record the affected IDs, before/after values, actor, time, and a brief reason. Supporting photos are optional. Routine checklist completions and photo uploads retain their own history without requiring a design-change explanation every time.
- Preserve the issued revision and show a comparison or change list against the working installation plan. Later issued revisions are additional records rather than replacements for the earlier history.
- Update current coverage, routes, equipment estimates and capacity calculations from the current working plan where those inputs changed. Highlight affected coverage targets and remaining work for attention.
- Preserve earlier test results. When a field change could invalidate a prior check, flag the device/check for review or retest rather than automatically treating an old pass as evidence for the changed installation. The precise affected-check rules still need definition.
- Apply the confirmed archive/replacement policy: record a different physical replacement under a new ID linked to the archived predecessor. Retain removed-device and connection history.
- Let the designer or assigned reviewer inspect changes and request follow-up. Review does not block recording actual site conditions. A request to correct a field change creates visible follow-up work; it does not silently erase the recorded installation state or evidence.
- Do not copy the issued revision's approval onto later changes. Review/approval, a recorded bypass, and unresolved change requests remain visible separately from installation and test progress.
- Build closeout drawings from the current installation record, retaining the issued-design reference and outstanding-item list. Closeout still uses the confirmed Completed or Closed with outstanding items distinction.

For example, an installer moving a camera to clear an obstruction records the actual position and a short reason. The issued drawing retains the intended position; the current drawing reflects the move, its coverage is recalculated, and relevant checks can be reviewed or repeated. No designer approval is required to save that observation.

Keeping drawings current with field conditions is consistent with the redline-drawing checks in [UFGS electronic security pre-acceptance guidance](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf), section 3.2. Direct editing permissions, fixed issued revisions, and optional review are confirmed Site Studio product choices; this reference does not override the user's optional-approval policy.

## Proposed later work at the same property

Kevin requested a recommendation on reopening the existing project versus creating a separate linked project. For the POC, recommend one continuing project per property or campus, with a new named working revision for later work. This approach is proposed, not yet confirmed. Different properties can still have different projects; separate concurrent jobs within one property are not needed for this POC model.

Recommended workflow:

1. **Preserve the closeout.** At completion or closure with outstanding items, retain a fixed named record of the installation, drawings, schedules, estimates, notes/photos, checklist and test evidence, approvals or bypasses, changes, and remaining work. Later edits do not rewrite that record.
2. **Archive when inactive.** An archived project remains searchable, viewable, and exportable, with editing paused until it is reopened. Project archiving preserves its device archives and all earlier revisions.
3. **Reopen as a new revision.** Start a named revision from the latest installation record, for example an entrance upgrade, while retaining the same project and device IDs. Return the current work to In progress and describe the new scope. The prior closeout remains a fixed historical record.
4. **Continue the property history.** Keep active and archived equipment, locations, connections, notes/photos, test history, and replacement links together. Reopening does not restore removed devices automatically; device restoration remains an explicit action under the confirmed archive policy.
5. **Record the new work separately.** Make a fresh estimate for the new scope, with prior estimates retained. Existing installed equipment and cabling should not be charged again merely because they remain on the plan. New or changed work receives its own checklist/test evidence; prior results remain dated history rather than automatic passes for the new work.
6. **Keep unresolved work visible.** Carry forward unresolved items for attention. Reopening does not resolve them, and any later disposition remains recorded under the confirmed closeout approach.
7. **Issue and close the new revision.** Preserve a new issued-design reference when installation begins, retaining the earlier references. Approval assignments may be reused or changed, but prior approval decisions do not automatically apply to the new revision. Approvals remain optional. Close the new work with another fixed record.

For example, a property project can retain an Initial installation closeout, reopen for an Entrance camera upgrade, and later reopen for an East wing expansion. Each named revision preserves what was planned, changed, tested and closed at that point, without duplicating device identities into disconnected project records.

This uses the prototype's existing named-revision concept as a starting point. Shared lifecycle records, fixed closeout evidence, scoped estimates and archival behavior still require implementation; the current local snapshots do not establish those capabilities by themselves. Exact rules for selecting the new work scope, handling carried-over issues, and historical report layout remain to be specified.

[SiteOwl's asset-management guide](https://getsiteowl.com/physical-security-asset-management-software/) describes continuous device histories and retained retired-device records. That supports continuity of the property record; the choice to use one project with later revisions is a Site Studio POC recommendation, not a claim about SiteOwl's project structure.

## Decisions still to make

- Whether to adopt one continuing property project with new named revisions for later work and read-only project archiving until reopening.
- The shared demo access mechanism, role demonstration, update visibility, and concurrent-edit handling across users/devices.
- Define the starter checks and project-specific pass criteria within the confirmed checklist/evidence model.
- What the complete installer/reviewer package contains, and how installation changes produce a final record of what was actually installed.
- Historical report inclusion, carried-over outstanding-item disposition, and the detailed handling of cables and draft-placement deletion.
- How progress and responsibilities work when the installer handoff is skipped.
