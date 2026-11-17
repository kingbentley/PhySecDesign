# Confirmed cable connection lifecycle — source extract

Prepared 2026-11-17 for guided refinement of PRD draft 0.13. Narrow extraction of the newly accepted cable-lifecycle block and the floor-restoration context for the next recommendation. This is not finalization, broad review or implementation/test evidence.

## Decision authority and boundary

Latest user confirmation: “Yes, let's use that cable lifecycle approach for the POC and add it to the PRD. What do you recommend for restoring devices when their original floor has changed or been deleted?”

This accepts the complete **Proposed cable connection lifecycle — awaiting confirmation under OQ-8** block inspected in the [addendum](../addendum.md). It supersedes that block's pending labels and the corresponding earlier labels in the [PRD](../prd.md), [canonical log](../.memlog.md), [source index](../source-index.md) and [conversation context](conversation-context.md).

OQ-7 remains resolved. OQ-8 is **partly resolved**: cable/port behavior during archive, replacement and restoration is now confirmed; restoration destination when a floor changed/disappeared and deletion of accidental draft placements remain open. OQ-9 acceptance/limits remains open. Asking for a floor-restoration recommendation does not accept new floor behavior.

## Accepted requirement mapping

| Confirmed behavior | Stable FR implications | Required interpretation |
| --- | --- | --- |
| Device removal previews known dependencies | FR-35/42 and new lifecycle FR appended after FR-52 (candidate FR-53) | Show affected cable ends, interfaces, port/terminal assignments and known dependents. Record actual device removal without requiring an invented cable disposition first. Planned Remove/Replace still changes only proposed intent. |
| Cable survives endpoint removal | FR-35/52 plus new FR | End the removed device's active association; retain its previous connection as history. Keep stable cable ID, geometry, lengths, notes and test history by default. Unresolved endpoint/disposition receives Needs connection review, not automatic cable deletion/archive or a claim both ends were disconnected. |
| Explicit cable disposition | New FR; FR-27/40/45/46 context | Record retained/disconnected/unassigned end, reuse/reassignment, actual cable removal/retirement, or unresolved disposition. Record actor/time/change context. Archive cable only after documented actual removal/retirement; preserve history. No new mandatory approval gate. |
| Different physical replacement | FR-36/49/52 and new FR | Different device gets a new linked asset ID. Explicitly select retained cable/termination/port reuse and validate current/proposed basis, known compatibility and conflicting claims. Same physical cable keeps run ID and dated endpoint change; different replacement cable gets new linked run ID. |
| Preserve supply/evidence identity | FR-17/31/33/34 plus new FR | Endpoint change alone does not purchase another cable. Reuse transfers no predecessor identity, installation evidence or Pass to the replacement. Physical fixed termination can remain at an outlet/patch panel while device/patch lead changes; logical network association stays distinct. No full patching graph. |
| Restore same physical device explicitly | FR-36/51 and new FR | Same asset ID/history; earlier connections are historical choices, not live assignments. Reconnect only through explicit action after checking location, active cable/termination, port availability, compatibility and active replacement. Never reclaim another assignment, overwrite a replacement, resurrect removed cable or silently restore links. Unresolved connections remain visible/unassigned. |
| Device demand versus physical port occupancy | FR-19/35/51 and new FR | Actually removed device no longer contributes active device demand. Its port is not automatically free: retain known cable occupancy/reservation, or unresolved availability until explicit release/reassignment. Historical device association is not a current assignment. Unknown active endpoint/load stays unknown rather than zero. |
| Shared infrastructure removal | FR-19/42/44/51 and new FR | Removing switch/controller flags known affected connections/dependencies; it does not archive downstream equipment or erase its demand/evidence. Do not declare all dependent functions failed when alternatives or unknowns exist. Apply connected changes atomically, including concurrent reuse/release/restore. |
| Retest, history and delivery | FR-31/32/33/34/44 plus new FR | Preserve original outcomes/fixed packages; changed/restored connections receive appropriate current-context review/retest. Show connection status in plans/schedules/revisions/backups, and unresolved installation issues under established scope/closeout rules. No automatic Pass/Fail or mandatory approval gate. |

Needs connection review is an unresolved connection/work flag, **not a fifth test outcome**. Four check outcomes remain Pass, Fail, Not tested and Not applicable. Historical evidence is preserved without claiming it qualifies a different current context.

Accepted example: archive CAM-01; retain CBL-014 with endpoint review while switch port 05 remains occupied/reserved as actually recorded. Explicitly reuse the same cable for new CAM-02. Later restoring CAM-01 preserves its identity/history but cannot take CAM-02's connection.

## Integration conflicts and risks to watch

No conflict with settled product decisions was found in the accepted block. The following are implementation/integration boundaries:

1. **History erased by prototype deletion.** FR-35 already promises captured connections; new FR-53 must make clear that device archival ends active association while preserving cable identity and past endpoints/evidence. Current destructive route deletion cannot implement this behavior.
2. **Ghost demand or fictional free port.** Excluding removed-device demand does not establish cable disconnection/port availability. Preserve occupancy/reservation/unknowns independently, without retaining a historical device as live load. Surviving downstream devices remain in property demand when a switch is removed.
3. **Restore/reuse becomes implicit installation.** Same-device restoration and new-device replacement need explicit validated connection changes, distinct identities and current-context evidence. Cable reuse does not duplicate purchase or inherit the old device's Pass.
4. **Scope/status spillover.** Mark only cable-lifecycle portion of OQ-8 confirmed. Needs connection review is not a test outcome or universal failure. Floor destination and accidental-draft deletion remain unresolved; prior closure/approval rules and OQ-9 remain unchanged.

## Floor-restoration context for the next recommendation — not accepted policy

Confirmed foundations:

- FR-1 keeps each floor's drawing, devices/routes, barriers/zones, notes and analysis independent with property-wide context.
- FR-3–5 preserve geographic placement across map styles and give each floor a drawing overlay with independent position/rotation/uniform scale and alignment preview/apply/undo.
- FR-22 distinguishes a deliberate guarded **whole revision restore** from normal undo. Restoring one archived device is not authorization to replace current project contents with an older floor/revision.
- FR-35/36 keep the device's original identity, last location and history; a changed physical replacement is a new ID. New accepted cable rules require location/current connection checks but leave the exact destination workflow open.
- FR-42 validates connected state on save, including floor contents/archive/restoration. Stale clients cannot write into deleted/archived context or recreate removed items silently.
- Earlier fixed revisions/reports/evidence remain unchanged. Reopening the property is not automatic device restoration.

Useful distinctions for the pending floor recommendation:

| Situation | Existing evidence or constraint | Decision still needed |
| --- | --- | --- |
| Same floor ID renamed | Floor identity is separate from display name | Resolve by stable identity rather than matching names; define how old/current names and historical context appear. |
| Same floor ID, drawing replaced/realigned | Drawing overlay can change without transforming device geographic coordinates | Review current plan/location instead of assuming historical coordinates are newly verified or moving all equipment with the image. Define what the user checks before restoration. |
| Different floor recreated with the same name | New floor creation generates a new ID | Do not silently treat the new floor as the old one based only on its name. Define explicit destination mapping/placement. |
| Original floor missing | Current model has no archived-floor destination/restore workflow | Select an existing destination or deliberately create/recover suitable floor context; the exact options and unresolved-placement treatment remain recommendations, not accepted scope. |
| Building/floor context materially changed | Old cables/segments/risers and current assignments may no longer fit | Reconcile location and affected dependencies without recreating removed routes, stealing ports or transferring historical test validity. |
| Recovery from a past revision | Named revisions preserve floor snapshots | Consult historical location/drawing context without silently replacing the current project or restoring every old floor asset. |

The next recommendation should explicitly define whether an unresolved destination leaves the device archived or permits a separate unresolved-location state, and how that state affects active schedules/coverage/capacity. Neither option is settled by current acceptance; avoid inventing a valid analysis location. Accidental draft deletion is a separate later OQ-8 question.

## Narrow current-source evidence

- [App.jsx](../../../../../site-studio/src/App.jsx:188): addFloor creates a new generated floor ID and blank plan. Rename handler at line 662 updates only the matching floor's name, preserving its ID.
- [App.jsx](../../../../../site-studio/src/App.jsx:65): floor updates target ID; setPlan updates only that floor's plan. Image/PDF replacement at lines 451/465 and alignment at lines 629–637 change plan data, not device coordinates. This supports distinguishing overlay changes from physical placement.
- [projectModel.js](../../../../../site-studio/src/projectModel.js:353): normalizes unique building/floor IDs, validates a floor's building reference, stores per-floor contents and rejects a missing active floor. No name-based identity matching is present.
- [App.jsx](../../../../../site-studio/src/App.jsx:194): removeFloor filters the entire floor from the current project, choosing another active floor when necessary. [FloorManager.jsx](../../../../../site-studio/src/FloorManager.jsx) warns that drawing/devices/routes/barriers/survey notes/photos will be removed and keeps at least one floor. This prototype delete behavior is not a historical floor archive/restoration workflow.
- [projectModel.js](../../../../../site-studio/src/projectModel.js:420): named revisions store normalized design snapshots, including floors. [App.jsx](../../../../../site-studio/src/App.jsx:583) restores the whole selected design into working state; it does not selectively restore an archived device into changed floor context.
- The previously inspected removeDevice at App.jsx:213 removes connected routes while survey.js:20 preserves device notes at their last location. That is the existing lifecycle gap, not the desired archive policy.

## Relevant fingerprint check

All five files match the 2026-11-16 inventory:

| File | SHA-256 |
| --- | --- |
| App.jsx | dad0ccbe56cf92fe243d9a7a72989337b581f26438ecb263997c3c9782703c43 |
| FloorManager.jsx | 9c90a7cc4ee57ec1abcc3b8c5e08ab917e8e24d282cb33a3b197bb49b315c54b |
| projectModel.js | f5328eaa57af55f3000d6e148c9e40805d70b6bbbc465061295156abc7510388 |
| alignment.js | 6e45c0ec663f16a79366ab8ce4eb8ff2b74a3241e9862c659c1c91b2a3e324b3 |
| survey.js | 94fee7edec5a44ce7f2b4172006514c7c8e3371d210f4994dbb40f701002cd39 |

Only this extraction was written. No main documents, application files, tests, delegation or broad finalization review were changed/performed.

## Focused reconciliation — PRD draft 0.14 (2026-11-17)

The accepted cable-lifecycle block is represented in FR-35/36/53 and linked capacity, connection and history clauses. No dropped functional detail was found: removal preserves independent runs/history and allows unresolved disposition; replacements use new IDs with explicit retained-cable reuse; restoration does not silently reclaim connections; removed-device demand and physical port occupancy remain distinct; shared-equipment removal retains downstream records/demand without inventing universal failures; concurrent changes, actor/time/context, retests, schedules and fixed evidence remain protected.

Two stale **addendum** status references require updating:
- Line 65, existing-site discussion: “endpoint/archive behavior still OQ-8” should reference confirmed FR-53, leaving changed/deleted-floor restoration and accidental draft deletion under OQ-8.
- Line 354, closet/port editing discussion: “archive/restore edge decisions still under OQ-8” should make the same distinction; the general connection lifecycle is now confirmed.

The main PRD's OQ-8 status is correctly partial: cable/port lifecycle confirmed, destination after floor change/deletion and accidental draft deletion still open. OQ-9 remains open. The separate addendum heading **Proposed restoration after floor changes — awaiting confirmation under OQ-8** and its introduction explicitly keep the location rule pending. No accidental acceptance of that proposal was found. Context/index synchronization was outside this requested recheck.

Reported the two stale labels to the main-document author. Only this reconciliation was appended; no main-document/application edits, tests or broad finalization review were performed.

## Disposition of focused findings

The main editor corrected both stale addendum labels and an earlier current-route summary to reference confirmed FR-53. Changed/deleted-floor restoration and accidental draft deletion remain OQ-8. Mechanical verification confirmed 53 consecutive requirements/checks, valid local references and seven unchanged relevant application fingerprints.
