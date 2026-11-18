# Site Studio — PRD addendum

Supporting context for [PRD draft 0.19](prd.md), updated 2026-11-17. This document preserves implementation detail and evidence boundaries for later UX and architecture work. Current mechanisms and numeric limits are not automatically permanent product requirements.

## Existing implementation and new work

The existing Site Studio application is a React/Vite map editor with browser-local project storage and a separate local revision-review API. The [design/coverage digest](sources/design-and-coverage.md) and [delivery/review digest](sources/delivery-and-reviews.md) identify the relevant source files and tests.

| Area | Current implementation | Consequence for the PRD |
| --- | --- | --- |
| Project state | One IndexedDB draft; portable project files and full named revisions. | Shared persisted editing in FR-2 requires new work. Local autosave alone is insufficient. |
| Review | Fixed layout snapshots, revocable reviewer bearer links, pinned comments, decisions, local server persistence. | Reuse the version-specific review concept; it does not implement full project collaboration, verified identity, or field updates. |
| Review contents | Reduced snapshot omits survey/photos, costs, capacity, detailed equipment notes/models, and camera-analysis settings. | A review snapshot is not a full named backup, issued installation record, or complete closeout package. |
| Hosting | Vite development/preview serves the local review API; the separate static Sites package does not. | Implement the confirmed access model, select hosting in architecture, and implement the confirmed shared-save/conflict model before claiming online workflow acceptance. |
| Field/lifecycle | Survey notes, existing/proposed devices, revisions and review are present. | Installation/configuration/tests, issued-design history, device archives, fixed closeout and reopened work are new capabilities. |

Recorded demo participant names do not authenticate people. Owner/reviewer bearer credentials and private review files are not project-export content. No production access model is selected by this draft.

## Maps, plans, and equipment

Current mapping uses OpenStreetMap, optional configured Google mapping, USGS imagery for the US satellite option, and Photon address lookup. Provider coverage, availability, keys, attribution, and usage conditions need appropriate implementation handling. No new provider contract or live-key validation is asserted.

A floor currently holds an image overlay with geographic position, rotation, uniform scale, opacity and lock state. Two-point alignment uses a similarity transform; it does not correct perspective or a distorted drawing. PDF import parses the original file and handles its password locally, then renders the selected page to an image, with current 50 MB input and 3,200-pixel render limits. The original PDF and editable CAD geometry are not retained by that import. Keep those distinctions visible when defining report/backup expectations.

The generic catalog has nine entries across eight types, including dome/bullet camera variants, reader, light, door contact, intrusion sensor, intercom, switch, and cabinet. Additional equipment types and linked door/gate records are now confirmed in FR-7/49, beyond this implementation snapshot. Site annotations and explicit closet/port planning are now confirmed in FR-50/51; physical inter-floor/riser planning is now confirmed in FR-52. Related controls do not prove those capabilities exist.

## Analysis conventions

Camera coverage is a sampled 2.5D planning model using rectilinear optics, a target plane, and finite-height obstructions. It does not simulate a complete scene, lighting, lens distortion, or real video quality, and it does not establish certified performance. Single-camera analysis and floor-wide combined analysis have different area semantics. Combined results use a common target height and all eligible active floor cameras, independently of presentation visibility. Boundaries include their full areas, including solid interiors and fallback margins; excluded/unsupported cameras must be disclosed.

The current DORI implementation uses thresholds of 25, 63, 125 and 250 pixels per meter for Detect, Observe, Recognize and Identify, following its documented IEC 62676-4:2014 convention. This records the prototype's convention; it is not an independent standards validation or a claim about current editions. Combined DORI takes the best unobstructed individual camera. Seen/below-Detect, unseen, and overlap describe different results.

Named security-zone polygons have independent target levels and qualifying percentages. Their whole polygon is the denominator. Clean contours improve presentation over sampled results; they do not turn those results into exact vector-area measurements. Current analysis caps, effective sampling and supported-input warnings belong in the acceptance fixture discussion, not an untested scale claim.

## Cost, cable, capacity, and evidence boundaries

Routes currently connect same-floor endpoints using Cat6, fiber or security cable, with waypoints and horizontal length plus slack. Automatic vertical distance, engineered pathways, validated physical port assignments, and a complete network topology are not implied.

Storage estimates use bitrate, recording percentage and retention with decimal storage units. Simultaneous stream bandwidth sums full configured bitrates; recording percentage does not reduce that bandwidth. Capacity planning includes active endpoints, one copper-port demand per IP endpoint where applicable, drawn Cat6 uplinks, switch total/per-port PoE limits, unassigned demand and ambiguous connection warnings. Preserve property-wide demand even when a selected switch or floor is incomplete. These estimates do not validate actual vendor equipment behavior or guarantee recording performance.

Materials include equipment/cable allowances, manual accessories, and optional labor. Later-work costing must retain historical estimates and distinguish retained assets from chargeable additions/changes. OQ-5 now confirms work categories and cost treatment below; detailed control layout belongs to UX.

Survey images are resized previews, currently limited to six photos per note and 24 MB encoded photos per design; they are not an original-resolution evidence archive. Current device deletion removes routes and converts surviving survey references to floor pins. The newly required archive behavior must deliberately preserve device/connection/evidence history instead; its current-route behavior is now confirmed in FR-53, changed-floor restoration in FR-54 and draft deletion, cancellation and correction in FR-55.

## Revisions and deliverables

The prototype currently has 40 session undo steps, 20 full named revisions, and a 100 MB portable project limit including duplicated revision data. Review snapshots have a separate 64 MB bound. These limits need reassessment for shared lifecycle records, repeated closeouts, and retained photos; they are not newly accepted retention targets. Existing version 1/version 2 project migration must be considered when adding the new records.

Current PDF output uses Letter/A4 landscape raster pages at 216 dpi with annotated plans, legends, schedules, zones and survey content. It does not embed live basemap tiles or editable/searchable vector drawing content. OQ-6 now confirms the package manifest, quantity/capacity defaults, optional costs, configuration/test evidence, approval records, pagination and exact historical-package retention below. These are new requirements beyond the captured export implementation.

Keep four records distinct: full named project revisions; reduced shared review snapshots; fixed issued-design references; and fixed closeout records. The existing CSV covers materials/estimates; separate equipment/cable schedule CSVs are not an established capability or committed addition. A printable PDF or CSV does not replace the complete editable project archive. Their source versions and disclosure boundaries must be explicit.

## Confirmed demo access model

Confirmed 2026-11-17; capabilities are in FR-2/23–25 and NFR-5. Use one hosted HTTPS demo with a revocable project edit link shared by trusted designers/installers and separate revocable links for designated reviewers of fixed design/closeout versions. Design and Installation are work views; they do not grant permissions. Editors can manage reviewer links and use the confirmed self-approval/bypass workflow. Display names are demo attribution, not verified identity: anyone holding a link can exercise that link's permissions.

Enforce project/revision scope on the server for records and stored drawings/photos. Keep access credentials out of portable projects. Use sample or sanitized nonconfidential data; confidential client use needs a separate access/data decision. This is consistent with [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); the two-link model is a Site Studio product decision. Hosting vendor selection belongs to architecture, while the shared-update product behavior is confirmed under OQ-2 and its implementation belongs to architecture.

## Confirmed existing-site workflow

Confirmed 2026-11-17; see FR-39–41 and the linked cost, analysis, testing and archive requirements. The surveyed baseline, proposed work, and actual installation need distinct representations while retaining stable asset identity. A survey entry may be based on an old plan, a site observation or an explicit estimate; unknown model/date/condition/specifications must not be fabricated. Recording a survey is not proof of commissioning.

Current/proposed analysis population is a deliberate domain choice, independent of display-layer visibility. Proposed replacements must avoid accidental double-counting, while planned removal must not archive the current physical record. Retained equipment still contributes applicable demand despite having no repurchase cost. Known failures and unknown inputs need visible treatment; a planning calculation remains an estimate. Exact data representation and migration from the current existing/proposed flag belong to architecture.

Existing cables need retained-versus-changed cost treatment, with endpoint/archive behavior now confirmed in FR-53. Scoped checks and known existing defects must respect the confirmed closeout rules; OQ-3 defines the checklist/applicability policy and OQ-4 defines targeted retesting; broader issue disposition is confirmed under OQ-5 below. Manual placement and existing survey controls suffice for initial POC intake. The general inventory/history pattern is consistent with [SiteOwl’s asset-management description](https://getsiteowl.com/physical-security-asset-management-software/); the precise actions and view rules are confirmed Site Studio choices.

## Confirmed shared-update and conflict model

Confirmed 2026-11-17. Kevin accepted the shared-editing approach and requested its inclusion in the PRD. Product behavior is captured in FR-2/21/22/24/31/32/42 and NFR-2. Exact storage/transport choices, and versioning primitives remain implementation suggestions; the five-second timing was subsequently confirmed as an acceptance target under OQ-9.

### Shared state and normal saves

Keep one authoritative server-saved project with durable records and attachments. Acknowledged saves must survive closing a browser and an ordinary service restart. Only report an attached photo as saved once its upload and record association have succeeded; partial failures remain visible. Database/file-storage selection belongs to architecture; backup/recovery targets were subsequently confirmed under OQ-9.

Autosave completed edits, rather than every drag intermediate. Show Saving, Saved, Unsaved and Conflict states with aggregate project status that never hides a pending item. Refresh other connected browsers within a few seconds—five seconds is the acceptance target confirmed under OQ-9. Refresh on returning to the tab and provide a manual refresh. Incoming updates must not replace a form, drag or text entry with local unsaved work. Polling is a sufficient initial transport; no live cursors or character-by-character joint editing is required.

### Conflicts and related records

Use version checks on editable items (device, route, zone, checklist definition, floor/project settings). Different independent items can save concurrently. If the same item has changed since it was loaded—even in another field—reject the stale save, retain the user's pending input, and show the saved change alongside the attempted change. Let the user accept the saved version or review and reapply selected intended edits to the latest version. Recheck that version when saving again; do not offer a blind overwrite or silently merge the entire object.

Protect related operations together: device removal/replacement and connections, floor removal and its contents, and archive/restore/closeout must validate their affected records and current project state as one operation. A stale tab must not recreate removed records or write into an archived project. Exact record boundaries and transactions are architecture work; independent item editing cannot bypass these relationships.

An HTTP implementation can use strong versions/ETags and conditional writes such as If-Match, whose failed precondition prevents a stale write; see [RFC 9110 section 13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1). The standard supports lost-update protection; it does not choose our conflict UI, record granularity or timing targets.

### Evidence, recovery and undo

Add new notes, photo attachments, test attempts and reviewer decisions as separate identified entries, retaining earlier evidence. Concurrent additions should coexist; retries of one action should not create duplicates. Editing an existing mutable entry uses its version; corrections to protected test/approval history add records rather than rewriting the originals. Preserve checklist wording and applicable context with each attempt.

If connectivity fails, show the unsaved state and retain pending input while the page is open; pause server-dependent work and retry/revalidate on reconnection. Do not promise durable offline capture, background offline work or recovery after closing the page. A timeout can occur after a successful server save, so retries must determine whether that action already succeeded.

Undo applies to the current browser session's recent working edits, using an internal session identifier rather than trusting the display name. It creates a new recorded reversal and checks affected versions. If another edit has changed the relevant item or dependencies, explain why direct undo cannot proceed and offer review. It must not roll back another person's work, erase evidence, or modify fixed revisions. Redo uses the same guards.

Named snapshots, issuing, restoration and closeout use a consistent server-saved version and revalidate project state. Resolve the initiating user's relevant pending/conflicting edits before taking the snapshot. Other clients' unsaved edits are not included or represented as saved. Closeout rechecks current outstanding work. A full revision restore is a deliberate guarded project action, separate from ordinary undo.

### POC acceptance example

Two browsers edit different cameras: both changes persist. Both then change the same camera: the first accepted save remains, the second is retained as a visible conflict, and selected edits can be reapplied after review. Independent photo/test additions both survive; retrying one does not duplicate it. An undo after another person's related edit is blocked for review, and a brief connection failure never displays unsaved work as saved. Neither issuing nor closeout captures an inconsistent mix of versions.

## Confirmed checklist and pass-criteria model

Confirmed 2026-11-17. Kevin accepted the checklist approach. Product requirements are captured in FR-29–31/43: common/type-specific editable starters, project-defined expectations, observed outcomes, independent phase progress and scoped site checks. Final wording and site/manufacturer-specific values remain implementation/domain setup. Optional-by-default photos and optional approvals are unchanged.

### Template structure and project setup

Use a short common checklist plus device-type sections grouped into Installation, Configuration and Testing. Use the same camera starter for dome/bullet variants; cover the existing reader, door contact, motion detector, intercom, switch, cabinet and light types, with a generic fallback. Default the applicable core identity/location, installation, key configuration and basic functional checks to required for new/changed in-scope equipment. Enable feature-specific or extended checks only where relevant to the project. Projects can add/remove or mark checks required/optional and adjust applicability; later edits must preserve attempts and unresolved issues. The additional doors/gates/controllers and related equipment are now confirmed separately in FR-7/49. Use the common and generic project-defined starter where a dedicated type starter is not defined; a related-system observation can be recorded against the device or project-level check. An association does not pass the linked component or validate the whole opening sequence.

During planning, select the assets/work in scope, apply starter templates, and fill project-specific expectations. A check contains a plain-language task, method/conditions, expected result or value/tolerance where applicable, required/optional status, applicability, and evidence requirement. A placeholder expectation such as “per project” needs a value/reference before that check can be recorded as passing; show Needs definition as a readiness flag, not a fifth test outcome. Manufacturer/site procedures and any applicable requirements provide device-specific acceptance values; no universal height, frame rate, illuminance, voltage or alarm delay is invented.

Common installation checks: asset identity/label and actual location agree with the installation record; mounting/enclosure condition meets the selected installation criteria; known cable labels/endpoints and intended power connection are recorded. Unknown legacy serial/model/install-date values remain unknown unless that information is explicitly required for the scoped work. Common configuration checks: intended device/system name and nonsecret settings/associations match the project; applicable recording, event or operating parameters are recorded. Do not store live passwords or access codes. Common testing checks: perform the relevant function and verify its result at the intended receiving system/location.

### Starter functional checks

| Device type | Suggested checks and expected result examples |
| --- | --- |
| Camera (dome/bullet) | Live image appears in the intended viewing system under the correct ID; framing/focus meets the named scene/checkpoints and conditions; configured stream values match the project; a test recording can be located and played back with the intended camera ID/time. Separate day/night or event-trigger behavior only when applicable/in scope. |
| Reader | Valid and invalid test credentials produce the project's specified permitted/denied behavior and correct events at the associated system. Linked door actions are checked only against the project's specified sequence and scope. |
| Door contact | Open/closed transitions produce the correct state/event for the named input at the receiving system. Test tamper behavior only if supported and selected. |
| Motion detector | The specified test movement/location produces the intended zone event at the receiving system; record conditions and any specified return-to-normal behavior. |
| Intercom | A test call reaches the intended destination; audio in both directions and video where fitted meet the defined result. Any release action is tested only where included in the site's defined sequence. |
| Switch | Intended endpoints/uplink connect as specified, labels/associations are recorded, and measured/reported power demand fits the selected equipment's limits under the specified test load. Do not substitute the design's PoE estimate for this observation. |
| Cabinet | Identity/location, mounting, enclosure/lock operation, equipment arrangement and cable labels match the selected installation criteria. Record project-required power/bonding inspection evidence through the appropriate procedure; the template does not certify electrical compliance. |
| Light | The selected control/manual/automatic operation works under the specified conditions. If an illumination target is required, record the specified measurement and location/conditions; do not invent a default threshold. |
| Generic equipment | Identify the intended function, how it will be exercised, where its result is observed and what outcome is acceptable. Leave undefined checks unperformed rather than automatically passing them. |

These are confirmed editable starter categories, not a complete manufacturer, PSP, electrical, fire/egress or other compliance test library. Door release/egress and other requirement-dependent behavior must use the project's applicable criteria; no universal lock fail-state is selected here. Refine full wording for each starter during implementation/domain review.

### Result and evidence rules

Retain Pass, Fail, Not tested and Not applicable. Pass means the technician records an observed result meeting the configured expectation and supplies required fields/evidence. For a simple binary check, the explicit observation/outcome is sufficient; numeric or condition-specific checks need the requested measured/observed values, units and conditions. Unknown or missing criteria, an unperformed test, a missing required measurement, or a modeled DORI/PoE result cannot supply a field-test Pass. A completed test whose observed result does not meet its defined expected result is Fail, with a brief explanation. Not applicable requires a reason tied to the feature or scoped work; it must not be used as an excuse for a failed or unavailable test.

Photos remain optional unless the project requires them. Capture actor/time and preserve the checklist wording, expected result, applicable device/design context and evidence with each attempt. Retests/corrections add records without erasing prior failures. Changing a criterion or making a failed check optional cannot silently rewrite old results or resolve the failure; targeted review/retest rules are confirmed below, while broader issue disposition is confirmed under OQ-5 below.

### Progress, completion and existing buildings

Track Installation, Configuration and Testing separately. For each phase, show counts of required applicable checks passed, failed and not tested, with Not applicable listed separately. A phase is complete only when its required applicable checks and evidence are satisfied for the current condition, with no required retest or unresolved failure remaining in that phase. A phase with no applicable checks displays No checks in scope rather than 100% passed. Optional unperformed checks do not block completion, but any recorded failure remains visible and needs resolution or the existing explicit outstanding-items closeout path. Work on different devices/phases can continue independently; no new mandatory approval gate is introduced.

New or changed equipment receives relevant checks. Retained untouched devices receive only the explicitly scoped assessment/tests; inventory or old records never become a current pass automatically. Known defects remain visible. OQ-5 confirms that documented deferred/out-of-scope defects remain outstanding at closeout under FR-32/46. Missing approvals remain separately bypassable.

### Site-level checks and example

Add a small editable project/floor checklist for applicable end-to-end functions: named devices/events appear at the intended receiving systems, selected camera recordings can be retrieved, IDs/timestamps/location records align, and the final drawings and evidence reflect recorded installation. Link checks to affected devices and record exactly which endpoints/conditions were exercised. Do not infer every device passed from a sample. Longer-duration, recovery, integration or night-condition checks are included only when scoped; setting a retention value is distinct from demonstrating the actual available history.

Example camera check: “Retrieve and play the recorded test segment for CAM-12 in the specified viewing system; confirm the camera identity, picture and timestamp against the test.” A successful observed playback can Pass; a missing recording is Fail; an unperformed check remains Not tested. Save the actual result, actor/time and any project-required evidence. The POC records manual observations rather than executing hardware tests.

This action/expected-result/log structure is informed by [UFGS 28 08 10 sections 3.1.3, 3.1.5 and 3.3.5](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf). Its contractual approval requirements and test values are not adopted. The starter categories, progress rules and applicability choices above are confirmed Site Studio behavior.

## Confirmed targeted retest model

Confirmed 2026-11-17 when Kevin answered “Looks good.” Use a small change-to-check rule table that flags affected devices/checks and records why they need review or retesting. OQ-4 is resolved in FR-28/31/32/44; broader work-scope and issue disposition is now confirmed under OQ-5.

### Distinguish intended work, recorded corrections and actual changes

A proposed design edit recomputes its planning analysis and updates intended work/checks; it does not claim the installation changed or invalidate an unchanged field record. An actual recorded installation/configuration/condition change flags checks affected by that new condition. A record-only correction (for example correcting an old drawing to match what was already installed) retains its reason/source and needs review of relevant documentation/evidence, without automatically treating it as physical work. Existing meaningful-change before/after, actor/time and reason records supply the context.

### Default trigger rules

| Change | Default affected review/retest scope |
| --- | --- |
| Formatting, cost allowance, or a note unrelated to function | Update documentation/estimate history; no automatic functional retest. A changed real device/system identity is not merely cosmetic. |
| Camera physically moved/re-aimed, height/lens/focus changed | Recheck affected placement/mounting and actual image/framing/focus/scene checkpoints. Include connectivity/recording checks when associated cable or stream settings changed. |
| Recording, network, controller/VMS association, sensor or intercom behavior settings changed | Recheck the affected configured values, connectivity and corresponding observed function/event/playback at the receiving system. Do not reset unrelated installation checks. |
| Physical cable, termination, port or power connection changed | Recheck appropriate connection/link/power and affected endpoint function against project criteria. A corrected route drawing alone follows the record-correction rule. |
| Shared switch/power/integration change | Flag checks for the changed equipment and the connected or associated devices/functions known to be affected. Display missing/uncertain relationships for manual scope review instead of assuming no impact. |
| Device repaired, physically replaced or returned to service | Run relevant installation, configuration and functional checks for the changed condition. A physical replacement uses its new linked ID; a restored device retains its ID but does not automatically inherit old passes. A mistaken archival corrected without physical work follows the record-correction review path. |
| Real wall/obstruction/scene changed, zone target changed, or required criterion changed | Recompute affected analysis and review which scene checks or acceptance conditions are no longer covered by existing evidence. Flag those for field retest where the physical condition/expectation changed; an analytical edit alone is not a field-test outcome. |

A core rule table and manual selection of additional affected checks are sufficient for the POC. Use recorded connections/associations; do not claim complete impact discovery from the current partial topology. Reopening a project, changing a price or hiding a display layer does not itself require every device to be tested again. New-work scope and unknown/out-of-scope issue disposition follow the confirmed OQ-5 rules below.

### History, applicability and follow-up

Keep original attempts and outcomes unchanged. Show a dated earlier Pass as historical evidence with a separate Needs review or Retest required follow-up flag when appropriate; these flags are not new test outcomes. A required check for the changed condition can show Not tested until a new attempt is performed. Creating a pending requirement must not fabricate a performed test or change the old Pass to Fail.

Each flag identifies the triggering change, affected device/check and reason. Let an editor add affected checks or document why a suggested check is genuinely unaffected—for example, a record-only correction supported by the original observation. Keep that disposition with actor/time. Such a reason is not a waiver of a still-applicable required check, an unresolved failure, or a prerequisite to recording actual field conditions. Failure and missing evidence must not be relabeled Not applicable merely to clear a flag. Issue and scope disposition follow the confirmed OQ-5 rules; deferral keeps the issue open.

A new attempt records the device/check context and conditions actually tested. Clear a required retest only when its current requirements are satisfied, including required evidence, and the relevant condition has not changed again. If a later concurrent change occurs, keep the attempt but retain the follow-up for the newer context. Undo or restoration must not silently restore a passing current status. Unaffected checks retain their evidence; a change does not cause a blanket property-wide reset.

### Closeout and review

Required pending retests and unresolved failures remain in device/floor/project remaining-work summaries and closeout exports. They prevent Completed under the existing rules; explicit Closed with outstanding items remains available with its note/list. Fixed prior closeouts and approvals remain unchanged. Approval bypass does not satisfy a retest, and recording an actual field change is not blocked by a new approval gate.

Example: CAM-12 passed a recorded scene check, then its actual aim changed. Keep the dated Pass and its original context, flag the relevant scene checks as Retest required, and recompute planned/recorded coverage as appropriate. The technician records a new attempt under the changed aim. A cost-only edit to the same camera does not create another retest.

The scope-specific failure/correction/retest record pattern is consistent with [UFGS 28 08 10 sections 3.2, 3.3.1 and 3.3.5](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf). This is product-design guidance, not adoption of that specification's government approval gates, universal retest matrix or certification obligations. The trigger rules and follow-up behavior above are confirmed Site Studio product choices.

## Confirmed work scope, estimates and issue carryover

Confirmed 2026-11-17 when Kevin accepted the approach and requested its addition to the PRD. OQ-5 is resolved in FR-17/32/38/45/46. Keep one active named work scope within the continuing property project. Initial work and each later reopened work cycle have their own scope, estimate and evidence. Multiple named design revisions can belong to the same scope: saving a layout alternative does not start a new job or duplicate its costs. Earlier issued revisions and closeouts remain fixed.

### Select work without losing the installed context

| Scope category | Purpose | Estimate and testing treatment |
| --- | --- | --- |
| Work now | Add, relocate, service/reconfigure, replace or remove equipment/routes. | Relevant parts, supply quantities and optional labor; applicable installation/configuration/tests and required retests. |
| Inspect/test only | Assess selected existing equipment without planning a purchase. | Relevant scoped checks and optional inspection/testing labor; no automatic hardware repurchase. |
| Reference only | Retain unchanged installed equipment as property context. | Include applicable coverage/capacity; exclude from new purchases and automatic recommissioning. |

Preselect planned changes transparently and let editors adjust scope with a recorded reason for meaningful changes. Unknown baseline details do not automatically become failed tests or work orders. Keep unknown inputs and documented faults visible. A dependency affected by current work must be reviewed under the confirmed retest rules; choosing Reference only cannot silently clear its required retest or unresolved failure. Add the relevant work/checks, or explicitly defer the outstanding item. Scope changes recalculate the current estimate/checks without changing fixed issued scopes or adding a mandatory approval gate.

### Estimate this work cycle

Charge new/replacement hardware and cable, selected accessories and optional labor for this scope. Retained equipment/cable is not automatically purchased again; relocation, servicing and removal can have explicit labor/parts. Reuse unit rates when useful, but do not carry old quantities into a fresh estimate unless the editor explicitly copies selected lines. Keep unknown prices visibly unpriced rather than implying a known zero cost.

Distinguish total installed route length from cable to supply. A route changing from 10 m to 12 m might require a full new run, not just 2 m of purchased cable. Record the supply quantity for the planned work explicitly, include slack once, and retain the basis. This remains an estimate; no automatic engineering or live vendor pricing is promised. Preserve earlier estimates with their fixed revisions/closeouts.

### Carry issues across revisions

Maintain a small property issue list with stable IDs linked to devices, checks, work scopes and earlier attempts. Reopening carries unresolved items forward without duplicating them or altering earlier closeout snapshots. Editors can:

- Include now: add the relevant work/checks and costs to the current scope.
- Defer: leave the issue open with a brief reason and optional owner/due date; keep it visible in the remaining-work list, closeout and later reopened work.
- Resolve: record the corrective work and appropriate current evidence/retest. Preserve the original failure and link the resolution/new attempt.

Correct mistaken or duplicate issue records with an explanation, actor/time and a link to the canonical issue where applicable. Correction does not turn a real failure into Pass. Archive/replacement alone does not resolve an underlying gap: record how the completed work addresses the applicable requirement and any necessary checks. Do not add an accepted-risk action that silently closes a genuine unresolved defect.

### Closeout remains explicit

Preserve the existing three project states. The selected work scope can show its work finished while unresolved property issues remain; its closeout is then Closed with outstanding items, with the brief note and remaining list. Completed is available only when no documented unresolved issues or required unfinished checks remain under the confirmed completion rules. Out-of-scope or deferred defects remain outstanding rather than disappearing when scope is edited. This rule does not require every unchanged legacy device to be newly tested: unknown inventory details and unscoped tests are distinct from documented faults and required follow-ups.

Example: the lobby camera upgrade is finished, but an existing parking-lot camera fault is deferred. Show the lobby scope as finished and the property closeout as Closed with outstanding items. Carry the parking-lot issue into later work; do not mark it passed, repurchase unchanged devices or rewrite the older package.

The retained failure/correction/retest and punch-list record pattern is supported by [UFGS 28 08 10 sections 3.3.5.1 and 3.3.5.3](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf). Its government acceptance gates are not adopted. The scope categories, costing choices and deferred-issue closeout policy above are confirmed Site Studio product choices.

## Confirmed design and closeout export packages

Confirmed 2026-11-17 when Kevin accepted the package structure and requested its addition to the PRD. Use two presets in one export flow, with PDF as the readable package and separate editable backup/estimate CSV downloads. OQ-6 is resolved in FR-33/34 and NFR-6.

### Package contents

| Section | Design package | Closeout package |
| --- | --- | --- |
| Cover and contents | Property/address, work scope, named revision, Draft or Issued status, issue/export dates, units, included floors/sections and recorded approval/bypass status. | Same identity plus fixed closeout reference and Completed or Closed with outstanding items. A preview before closure is clearly marked Draft/In progress. |
| Plans | Proposed design with labeled devices/routes, retained context, planned actions, floor legend and installation notes. | Recorded actual installation, status of incomplete work, departures from issued design, removed/replaced device references and unresolved issues. Do not depict uninstalled proposed work as installed. |
| Coverage and zones | Separate optional coverage/DORI sheets with legends, target/achieved zone values, shortfalls, basis and assumptions. | Equivalent current-installation analysis, labeled as a planning estimate alongside actual field evidence. |
| Equipment and cable schedules | IDs, type/model, floor/location, mounting, planned action, work category, known endpoints, route lengths and supply quantities where relevant. | Recorded installation/settings and known serial/legacy labels, actual endpoints and status; distinguish measured from estimated values and preserve unknowns. |
| Capacity and quantities | Include quantities and storage/bandwidth/port/PoE estimate summary by default, with assumptions and unassigned/unknown demand. | Include recorded-configuration capacity estimates with the same disclosures; estimates do not prove observed system performance. |
| Field work and evidence | Survey notes, measurements, installation constraints and attached photos; include the scoped checklist/expectations for installation handoff. | Installation/configuration/testing summary plus detailed results, expected/observed values, conditions, actor/time, relevant correction/retest history and supporting notes/photos. |
| Outstanding work and decisions | Open design issues, known property faults/deferred work and recorded version-specific review decisions. | All unresolved property issues, brief closeout note, optional owner/due date, and recorded approval/bypass/acceptance history as of the package edition. |

Show Pass, Fail, Not tested and Not applicable separately; preserve required retest/Needs review flags and reasoned N/A. Neither Installed, a modeled calculation nor optional approval implies a field-test Pass. The detailed closeout evidence appendix includes attempts from the current scope and relevant earlier evidence for carried issues, with stable device/check/attempt references. Complete lifetime history remains in the editable project archive; every old revision need not fill the current PDF.

Prices and labor costs are optional, off by default for both packages. Include quantities without prices and add the scope-specific estimate/CSV only when selected. Cost omission is a report choice, not a new access-permission mechanism or deletion of stored estimates. Capacity remains property-wide for the selected analysis basis, including retained demand; label any selected-floor subset explicitly.

### Readable pages and explicit omissions

Start with the existing Letter/A4 landscape PDF output. Use a clean equipment/routes sheet per floor and separate coverage sheets to reduce clutter. Retain legends, page numbers, revision identification, floor names, units and readable scale information where supported by the drawing basis. Do not promise a fixed print scale for fit-to-page output. Keep tables and long notes readable over continuation pages with repeated headings; never truncate rows or evidence silently.

Include relevant attached photos by default, with an option to omit optional photos for a compact package. Use two photos per page initially, preserving aspect ratio and associating captions with device/note IDs, floor and recorded date when available. If required photo evidence is excluded, label the export as an evidence-limited summary and identify the omission; it is not a complete evidence package. Missing fields remain Unknown/Not recorded, and required unavailable files are reported rather than substituted with blank pages. Current stored survey previews do not become original-resolution photographs through export.

Default to all floors. Selected-floor exports are labeled Partial with the included floors in the manifest; retain the property-wide closeout outcome and outstanding-issue summary so filtering cannot hide unresolved work. The main complete closeout package covers all floors. Existing plan imagery/geometry can be exported; live basemap/satellite tiles are not embedded by default. Disclose the missing background, preserve applicable attribution and keep provider-enabled map export as separate future scope.

### Fixed packages and portable recovery

Generate from a consistent saved named revision or fixed closeout, resolving the initiating editor's relevant pending/conflicting edits first. A draft preview can use an identified saved snapshot without issuing, approving or closing the project. Preserve the exact issued-design and closeout PDFs with the property, plus a manifest identifying source snapshot, work scope, package edition, export time, included sections/floors and known omissions. Keep these files available after project archival; package retention is included in backup/recovery. Numeric size/storage limits were subsequently confirmed under OQ-9.

Redownloading a historical package returns the retained file. Regeneration or later approval information creates a new dated package edition tied to the same fixed source and a stated decision-history cutoff; it does not overwrite the earlier PDF or claim later edits were part of it. Later corrections to installation records use the normal new-revision/closeout history. Review links still refer to their fixed records, and a static PDF does not update when decisions change.

Offer the complete editable project backup separately from the PDF and optional materials/estimate CSV. Preserve captured drawings, attachments, revisions, issued/closeout history, issue records and removed-device history with stable IDs; keep link credentials and live passwords out. The existing editable format is JSON; the packaging/storage mechanism for retained PDF assets belongs to architecture, without promising raw original drawings/photos that were never retained. A generation failure remains visible and retryable; do not label a partial file or incomplete asset bundle successfully complete. Export itself never approves or closes work and does not require an approval.

### Evidence boundary

The closeout structure draws on the test logs, updated records, correction/retest and report organization in [UFGS 28 08 10 sections 3.3.4–3.4.3](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf#page=9). The [official CCTV Design Tool output guide](https://docs.cctvdesigntool.com/quick-start/generating-outputs.html) separates visual plans, reports and tabular outputs. These are limited precedents, not adoption of contractual approvals, certification requirements or additional competitor functionality. The [export reference digest](sources/export-package-reference.md) records the source boundaries. Package presets, defaults, pagination and exact-file retention above are confirmed Site Studio product choices.

## Confirmed camera-model templates — OQ-7 refinement

Confirmed 2026-11-17 from Kevin's explicit request to create reusable definitions for specific camera models, including resolution, FoV height/width, focal length and the other inputs needed for DORI with fixed and adjustable lenses. An engineer should be able to search/select a known model number. This adds FR-47 and refines FR-7/10; it does not confirm the rest of the catalog/cable proposal.

### Model definitions and imaging profiles

| Information | Treatment |
| --- | --- |
| Identity | Manufacturer, model number, relevant lens/variant and a reusable template identity. Search by model number/manufacturer and retain the generic-camera option. |
| Resolution/mode | Explicit image width × height in pixels for the mode used in analysis, with aspect/crop/capture-mode context where applicable. Do not assume advertised maximum megapixels equals the selected output. |
| Lens | Fixed or adjustable/varifocal. Store a fixed focal length or supported minimum/maximum, plus a reusable default; each placed varifocal camera has its own selected focal length. |
| Field of view | Horizontal and vertical angles in degrees, tied to the relevant mode and focal setting. Preserve published wide/tele or other measured profiles when supplied. |
| Sensor geometry | Active imaging width/height in millimeters when available; a nominal optical-format label is separate reference information, not a millimeter dimension. |
| Source and confidence | Optional datasheet/reference and entered values, distinguishing sourced, derived, estimated and unknown information. Retain the source/version context used by a design. |

Store camera specifications separately from per-instance location, mounting height, aim/tilt, chosen mode/focal setting and installation context. Templates can provide convenient defaults, but placing two copies creates separate device IDs and allows different installations. Existing target-height, obstruction, boundary and zone inputs still determine coverage analysis. Catalog model data does not replace field verification or change the current DORI threshold convention.

### FoV and sufficient calculation inputs

FoV angles describe the selected camera/lens profile. Physical scene width and height require a distance and reference plane; show those values as calculated results at the stated location rather than treating them as permanent model dimensions. For a tilted/mounted camera, retain the existing modeled target-plane geometry and obstruction effects instead of assuming a simple flat scene at every point.

Use an explicit coherent optical basis for analysis. Manufacturer H/V FoV for a stated profile may supply that basis; compatible active sensor dimensions plus focal length may derive it. Preserve source specifications alongside derived values. When entries disagree or the current geometry cannot represent them consistently, flag the limitation and require an explicit supported basis or disclosed estimate rather than silently changing the datasheet fields. The exact normalization/calibration algorithm remains architecture/implementation work.

Fixed-lens profiles do not offer an arbitrary optical focal-length slider. Varifocal instances constrain the selected focal length to supported limits and recalculate modeled FoV/coverage/DORI. Continuous intermediate settings require enough optical data for that calculation. If only wide/tele profiles are known, keep those profiles usable and identify additional input or an explicit approximation needed for an intermediate setting; do not silently interpolate degree values or present invented specifications as manufacturer data. Digital zoom, special projection and unsupported modes must not be represented as verified optical performance.

An incomplete template can retain known details without earning a complete DORI result. Missing/unsupported inputs remain visible, and generic defaults must not masquerade as verified model specifications. Different stream/capture modes can change resolution and framing; analysis uses the selected mode rather than automatically inheriting the maximum-resolution profile. Manufacturer-published DORI distances may be retained as labeled reference data, not substituted for recalculation under the actual placed-camera settings.

### Reuse, history and current prototype limits

Allow creation, editing and duplication of reusable camera definitions and model-number selection during placement. Preserve template identity/version or a snapshot of the values on the placed instance, named revisions, exports/backups and relevant test context. Later template edits do not silently change placed cameras or fixed issued/closeout records. Applying updated values is explicit and follows current/proposed distinctions, change history and the existing affected-check review/retest rules. Existing project/revision permissions continue to apply; this clarification does not grant review links permission to edit templates.

The current prototype has two generic camera presets, model-text search, horizontal pixel width and freely adjustable focal length within generic limits. It derives HFOV from lens/sensor width and VFOV from aspect ratio; it has no reusable user-model library, pixel-height/mode profiles or fixed/varifocal constraints. Its normalization can reject manufacturer FoV values that disagree with its ideal lens/sensor calculation. These gaps require deliberate implementation; this document update does not claim they are already fixed.

The [implementation extract](sources/camera-model-template-extract.md) and [optical reference digest](sources/camera-template-reference.md) distinguish source facts from this product direction. They are limited input/geometry references, not a new standards edition, full manufacturer database or certification claim.

## Confirmed equipment/cable scope — OQ-7 resolved

Initially proposed 2026-11-17 after export-package confirmation, then refined and accepted in successive guided decisions. Camera-model templates, bounded multi-view/panoramic support, additional equipment/linked openings, site annotations, closets/ports and physical inter-floor routing are now confirmed in FR-7/47–52 and related clauses. The latest routing acceptance resolves OQ-7; OQ-8 lifecycle edges were subsequently resolved in FR-53–55; OQ-9 acceptance/limits was resolved on 2026-11-18.

The accepted scope supports generic equipment and model-specific cameras, a basic controlled opening, explicit manual switch-port assignments and transparent cable estimates. It builds on the existing same-floor route baseline without treating the new requirements as implemented. Full vendor catalogs, rack/patch-panel engineering, automatic routing and detailed electrical calculations remain outside the POC extension.

### Confirmed equipment families and opening relationships

Confirmed 2026-11-17 when Kevin accepted the additional types and linked door/gate components. Keep the existing dome/bullet cameras, readers, door contacts, intrusion sensors, intercoms, lights, switches and cabinets. Add generic door and gate records, access controller/control panel, lock/strike, request-to-exit device, low-voltage power supply and recorder/NVR entries, plus a generic custom-equipment fallback. Existing door-contact records remain contacts; do not migrate them into doors. User-entered manufacturer/model-specific camera templates are confirmed. The confirmed multi-view section below supports conventional heads and illustrative panoramic previews; detailed calibrated fisheye/stitched DORI remains follow-on scope. Automatic manufacturer libraries and live product pricing remain outside the proposed expansion.

Each record has a stable ID, type, optional manufacturer/model, floor/location/mounting, notes and relevant entered planning values. Preserve unknown values. Camera templates are explicitly required under FR-47; this equipment confirmation does not add a dedicated noncamera template library or catalog automation. Other reuse mechanics remain downstream refinement. Model entries describe planning inputs, not independently verified manufacturer compatibility.

A door or gate is a named physical opening with optional links to selected readers, contacts, lock/strike, REX, intercom, controller or other equipment. Label side/direction where useful. Linked components retain individual IDs, costs, cable connections, checks and lifecycle history. An opening does not automatically create a fixed bill of materials, consume a network/PoE port or imply all components are installed/passing. An explicitly priced door/gate asset can have its own cost; do not also price a template bundle containing the same component costs. Associations do not create physical cable runs. Shared controllers or supplies can link to several openings without cloned purchases or duplicated demand. Editing a link does not archive a component, erase its evidence or imply installation/test completion. Gate-specific operating/safety sequences remain project-defined checks, not a new simulation engine.

### Confirmed closets, ports and assignments

Confirmed 2026-11-17 when Kevin accepted the closet/port approach and requested its addition to the PRD. Use named equipment locations and a manual port/connection schedule under FR-51. Explicit logical assignments can cross floors; the subsequently confirmed physical inter-floor routing and allowance model is recorded below.

#### Named equipment locations

Create a closet/location record with stable ID, name (for example MDF or IDF-2), building/floor/map location and notes or survey references. Associate existing cabinet, switch, controller, recorder and power-supply assets, preserving their individual IDs and costs. A closet is a location/container, not an extra switch, purchase or electrical load. Distinguish equipment physically located there from remote devices served by it. Changing a group/name does not silently move installed equipment or redraw its cables.

Keep this as an equipment list, with optional cabinet associations. Full rack-unit layouts and rack/patch-panel engineering are deferred. Existing project permissions, survey evidence and revision history apply; no new identity or collaboration system is proposed.

#### Explicit switch ports and connections

For each switch, enter or select model-sourced port identities/labels and known capabilities. A simple port schedule contains:

| Field | Confirmed treatment |
| --- | --- |
| Port label and type | Identify copper Ethernet or optical/SFP interfaces and any supported distinctions. Do not assume every connector is an independent usable port or all ports support PoE. |
| Assignment | Link a specific device/interface, a peer switch port for an uplink, or a named reservation. Keep unassigned devices visible. |
| Availability/condition | Show free, reserved or assigned allocation separately from usable, unavailable or unknown condition. An existing connection on a faulty/unavailable port remains recorded with a warning; do not erase it to make the port list look consistent. |
| Power basis | Known PoE capability, per-port limit/allocation and planned demand, with source/basis and unknowns. Total switch PoE budget is a separate value. |
| Supporting references | Cable ID when drawn/known, optional patch-panel/outlet labels, notes and current/proposed source context. |

A valid direct network connection uses identified compatible ports at its active endpoints. Count uplinks at both ends according to their actual port types; optical fiber does not supply PoE. Show duplicate/conflicting use, missing references and known incompatibilities rather than silently assigning an available-looking port. Reservations, unavailable ports and free ports are explicit; unknown inventory cannot produce an exact spare count. Specialized combo/breakout/stack behavior is unassessed unless represented explicitly, not inferred from a connector total.

Permit planned assignments before a physical route is drawn and across floors: identify them as planned/unverified where appropriate, with route detail missing. An assignment does not fabricate a cable, routed length or installed/tested connection. When a cable record is linked, its endpoint/port context must agree or show the discrepancy. Current installation and Proposed design retain their separate assignments and counts, including existing equipment and intended replacements. Port changes follow the existing meaningful-change/retest rules.

#### Controller and passive termination references

Keep Ethernet interfaces distinct from controller reader/input/relay terminals and local power connections. A controller-wired reader/contact/lock/REX does not automatically consume a switch port or PoE budget; an explicitly IP-connected version can. Record controller/channel labels and known specifications, but do not impose the one-direct-Ethernet-link rule on shared control buses or common terminals. Detailed controller wiring/sequence validation is outside this POC.

Optional patch-panel/outlet/termination labels can explain a connection without a complete passive-connectivity graph. A patching label does not itself establish an active switch assignment or PoE source. Require the explicit supported network association for capacity attribution and leave ambiguous/unassigned demand visible. Closet membership and linked-opening associations also do not establish connectivity.

#### Capacity checks without invented certainty

Show port counts by relevant type and allocation/condition, known assigned PoE demand, reserved allowances and the remaining known budget. Compare per-port limits and total switch budget separately, using compatible power bases. Distinguish rated/maximum planning demand, allocation and observed/typical consumption; missing conversion or source information remains incomplete rather than silently treating device-side watts as switch-side allocation. Do not infer power budget from port count or treat unknown loads as known zero.

A reservation for a specific planned device uses that device's demand once. An unnamed future reservation can carry an explicit planning allowance; if its demand is unknown, disclose that uncertainty. Keep current load and proposed reserved demand distinguishable. An already allocated device must not also be charged as an extra reservation. Known headroom plus unknown demand is an incomplete assessment, not a guaranteed passing capacity result. Non-PoE supply calculations and detailed network traffic simulation remain outside this extension.

Preserve property-wide demand regardless of the chosen closet/switch/floor filter. A multi-head camera consumes its actual hardware interfaces/power, and configured streams retain the separate bandwidth/storage rules. Existing controller, recorder or retained devices are not duplicated merely because they appear in multiple relationship lists.

#### Editing, outputs and limits

Apply the existing conflict/dependency rules when a port is assigned or moved so two editors cannot silently claim the same physical connection. Retain the user's pending edit on conflict. Equipment/port changes must not quietly erase dependent assignments or earlier evidence; show affected connections for resolution, under confirmed FR-53; changed/deleted-floor restoration follows confirmed FR-54, and draft deletion follows confirmed FR-55.

Add a closet equipment list and port/connection schedule to the relevant design/closeout exports. Show stable device/port/cable references, current/proposed basis, recorded or pending status, power assumptions, reservations and unresolved warnings. Preserve these records through named revisions and backup. Group/port edits do not imply that actual field work or a test occurred.

Example: IDF-2 contains Cabinet CAB-01 and Switch SW-02. Port 05 is planned for Camera CAM-12 with a cable reference where available; port 06 is reserved for a future device with its demand still unknown; SFP-1 is an explicitly recorded uplink to another switch. A door reader can instead reference a controller terminal, with only the controller's actual network interface assigned to an Ethernet port.

This is manual design and installation documentation. Live discovery, switch configuration, automatic port assignment, full rack/patch graphs and universal hardware limits are deferred. The [closet/port reference digest](sources/closet-port-reference.md) records official examples of [model-specific port capabilities](https://help.axis.com/en-us/axis-t8524-poe%2B-network-switch), [separate power values/budgets](https://help.axis.com/en-us/axis-s2216-mk-ii) and [controller connector types](https://help.axis.com/en-us/axis-a1601). They inform the confirmed distinctions without imposing a universal wiring rule or capacity guarantee.

### Confirmed inter-floor routes and vertical/drop allowances

Confirmed 2026-11-17 when Kevin accepted the routing and allowance model, requested its addition to the PRD and asked about cable connections during archive/replacement/restoration next. Keep a cable run as one identified record across its physical route, using manually drawn floor segments, named riser references and explicit lengths. FR-9/17/33/42/52 capture this accepted model, resolving OQ-7. The [focused extraction](sources/confirmed-interfloor-routing-extract.md) distinguishes these requirements from the current same-floor implementation.

#### One run across several plans

Give each physical run a stable cable ID, cable family/specification, from/to terminations and associated device/port or controller-terminal references. Preserve Cat6, fiber and security cable families with custom description where needed. Keep its network assignment distinct from its physical path; passive termination labels do not invent active connectivity or a complete patch graph.

Draw the ordered horizontal pieces on their respective floors. Place named riser/continuation points on relevant plans, with the same riser identity and referenced from/to floors. Each floor displays its own segment and a continuation label such as CBL-014 via Riser R-01 to Floor 2. Calculate each horizontal piece using that floor's known scale; do not draw an imaginary diagonal through unrelated floor coordinates or assume plans align automatically.

A floor segment is part of the same run, not a second cable purchase. Multiple cables may share a riser reference, but each includes its own physical length. Full pathway capacity, automatic 3D routing and fiber-core/breakout engineering are not added by the riser reference.

#### Length components and their basis

| Component | Confirmed POC treatment |
| --- | --- |
| Horizontal segments | Sum the drawn, scaled pieces on the relevant floors; expose missing or unscaled sections. |
| Inter-floor/riser transitions | Enter each transition's route length, from/to floors, units and source/basis. Use a complete span or its component spans once, not both. No assumed distance follows from floor numbers. |
| Endpoint rises/drops | Enter the non-overlapping path from the routing elevation to the actual device or termination. Mounting height helps only when the route elevation is known; do not automatically add the full mounting height. |
| Fixed service loops/extra length | Enter the allowance at each relevant end/location once, with its purpose visible. |
| Optional percentage allowance | Apply one selected percentage to the route subtotal once per run. Do not compound floor-level, run-level and project-level slack. No universal percentage is mandated. |

Transitions/drops can be measured or estimated, with a drawing/survey reference or note. Include offsets/detours in the appropriate drawn or entered portion, without counting the same portion twice. Missing values remain unknown; zero means explicitly no additional length for that component. The known subtotal remains visible, but missing scale or required components prevent presenting it as a complete estimate.

Use this confirmed convention:

- Route subtotal R = horizontal segments + inter-floor transitions + endpoint rises/drops.
- Suggested supply estimate Q = R + fixed service loops/extra length + (selected percentage × R).

The percentage is applied to R, excluding the separately entered fixed loops. Example only: 20 m on Floor 1 + 12 m on Floor 2 + 6 m transition + 2 m drops gives R = 40 m. With 2 m of fixed loops and a user-entered 10% allowance, Q = 40 + 2 + 4 = 46 m. Neither the example height nor 10% becomes a project default or installation standard.

#### Supply, patch leads and recorded measurements

Follow the confirmed work-scope cost rules: the suggested quantity is useful for a new/replacement run, while retained cable does not become a new purchase. Keep an explicit user-selected supply quantity/basis separate from installed route length; relocation is not automatically charged as the length difference. Preserve manual overrides and flag relevant geometry changes for review instead of silently replacing them. Keep ordering/reel rounding separate from the calculated estimate.

Record separately purchased patch/equipment leads as explicit cable/accessory entries or references. Exclude them from a fixed-run allowance when already counted separately; an explicitly included portion must not also appear as another purchased quantity. This does not create a full passive topology solver or assume that the fixed run represents a complete tested channel.

Keep measured installed length as a separate value with its source/context. Do not add design slack to an already measured total or overwrite the prior design estimate. Existing horizontal-only route data retains that disclosed basis until reviewed; migration must not invent verified vertical/drop values or silently declare an old partial estimate complete.

#### Editing, warnings and exports

Maintain Current installation and Proposed design context under the existing rules. Preserve cable, segment and riser references in revisions, undo/shared edits, backup and exports. Changes affecting shared references/dependencies require the existing conflict checks. A changed physical path/termination can trigger appropriate retesting; a record-only correction follows the existing correction rule. Drawing, estimating or measuring a cable does not mark it installed or passed.

Flag missing segments/landings, unknown scale/lengths, endpoint/assignment mismatches and known type/length-limit violations. Compare a specified limit only against a matching stated basis (for example a fixed run versus a complete channel); do not invent one length limit for every cable family. Keep unresolved values visible in schedules rather than interpreting them as zero. Device/archive/replacement endpoint behavior follows the confirmed FR-53 model; changed-floor restoration follows confirmed FR-54, and draft deletion follows confirmed FR-55.

Show per-floor continuation labels and a property-wide schedule with run ID, endpoints/ports, floors/riser, horizontal/vertical/drop breakdown, fixed loops, percentage/base, suggested supply quantity, selected purchasing quantity and measured length where recorded. Aggregate each run once by cable type and work scope even when it appears on several plan sheets. Keep uncertainty and selected/partial-floor context visible in the confirmed export packages.

The [inter-floor cable reference digest](sources/interfloor-cable-reference.md) records [editable cross-floor connections](https://docs.cctvdesigntool.com/quick-start/creating-connections.html), [individual/grouped schedules](https://docs.cctvdesigntool.com/ui-guide/connection-manager.html), and the [distinction between fixed cabling and patch leads](https://www.flukenetworks.com/blog/cabling-chronicles/channel-permanent-link-patch-cords-mptl-e2e-oh-my). The manual segmentation and allowance formula above are confirmed Site Studio product choices, not source-prescribed engineering rules.

### POC limits and reference boundary

Defer a comprehensive vendor catalog, automatic equipment discovery, live device configuration, access credential administration, full rack/patch-panel engineering, automatic 3D/path routing, voltage-drop/conduit-fill calculations and automatic code/compliance verification. Required manufacturer/project criteria can be captured in notes/checklists without claiming those calculations are implemented. The catalog and manual routing remain useful with incomplete existing-site information, with gaps disclosed.

The [equipment/cable reference digest](sources/equipment-cable-reference.md) records official examples of [generic device placement](https://docs.cctvdesigntool.com/quick-start/adding-devices.html), [doors linked to individual components](https://help.axis.com/en-us/axis-camera-station-secure-entry), [per-port switch configuration](https://help.axis.com/en-us/axis-network-switch-configuration-guide) and [height-aware connection estimates](https://docs.cctvdesigntool.com/ui-guide/device-sidebar.html). These support the direction, not the exact Site Studio scope or a universal wiring standard. The camera-model, bounded multi-view and additional equipment/linked-opening decisions are confirmed. Annotations, closet/port assignments and physical cable routing were subsequently confirmed, resolving OQ-7.

## Confirmed panoramic and multi-view camera support

Confirmed 2026-11-17 when Kevin accepted the approach, requested its addition to the PRD and asked what remains for equipment/cable planning. FR-48 extends the camera templates in FR-47, with linked coverage/zone/capacity and history clauses. The additional equipment/linked-opening, annotation, closet/port and physical-routing choices were subsequently confirmed, resolving OQ-7.

### Separate the physical camera, optical views and streams

Keep one physical asset for the housing/model, mount, cost, installation history and actual network/power requirements. Give each supported head/optical view its own stable child identity, resolution/mode, lens setting and direction/tilt. A compact body can share a mounting point as a disclosed approximation. A head can be adjusted only as its model permits; its condition/settings and test references remain identifiable. Do not create several billable camera bodies to simulate several lenses.

Keep configured streams distinct from views: bandwidth/storage uses streams actually transmitted/recorded and their settings, while ports/PoE use the hardware's actual interfaces and requirements. Four lenses do not imply four network connections; one dewarped image displayed in four panels does not automatically mean four additional recorded streams. Conversely, separately transported/recorded streams do contribute demand. Existing optional accessory/license allowances can represent explicit additional costs without assuming a universal licensing rule.

### Confirmed POC support levels

| Arrangement | Confirmed behavior |
| --- | --- |
| Several independent conventional heads | Model each supported rectilinear head with its own pixels, FoV, selected lens, bearing and tilt. Combine visible footprints and use the best eligible unobstructed view for DORI. Keep head identity inspectable. |
| Single-sensor fisheye | Place and document the physical camera, lens/output profile and mounting orientation. Show an explicitly illustrative 360-degree or directional footprint only when its mounting/extent and chosen range are known. DORI remains Not assessed until a supported projection/calibration model is available. |
| Stitched multisensor panorama | Preserve the source-head and stitched-output distinction. Where source heads have usable supported optical data, evaluate those as explicitly identified views; do not claim their results describe a differently stitched recording. Composite-output DORI remains Not assessed without a supported projection/sampling profile. |

Example: a four-head 4 × 5 MP camera has four 5 MP views, not 20 MP in each direction. A template presets the heads; the engineer can aim them as the hardware allows. Keep body cost and actual hardware demand separate from the configured head streams. Multiple heads sharing one housing are not multiple independent physical cameras.

### Combined coverage and zone honesty

Use distinct analytic view IDs beneath the parent asset. Union the supported visible areas; at a location choose the best eligible single view without adding pixel densities. Distinguish overlapping views from overlapping physical camera bodies. Multiple views from the same raw capture are also not independent captured detail. Preserve the existing Current installation/Proposed design basis, condition exclusions, boundary, target height and DORI thresholds.

A 360-degree description states surrounding angular coverage, not unlimited range, uniform detail or freedom from wall/obstruction shadows. Illustrative fisheye/panorama footprints must be visually distinct from assessed geometry/DORI. They receive no automatic credit toward a required zone percentage. Keep the complete zone polygon as the denominator; do not remove unassessed regions to improve its score. Report supported-view coverage and unassessed contributions clearly. A target already met by assessed views can remain met; otherwise missing panoramic analysis cannot prove either a pass or that the actual site is blind. Use wording such as Not covered by assessed views with an unassessed-camera notice rather than an unconditional 100% blind claim.

### What calibrated fisheye/panorama DORI would require

Model number, focal length and a 360-degree label are insufficient. A credible evaluated output needs known source resolution and active-image/crop data, lens/ray-to-pixel projection or calibration, selected raw/dewarped/stitched output and its effective sampling, mounting orientation, and target-plane geometry. Detail can vary by image location. Interpolating a larger output cannot be treated as newly captured optical detail, and dividing total megapixels equally into invented cones is not a supported shortcut.

Manufacturer DORI distances may be retained as conditional reference values, with their mounting/output assumptions. A small set of published distances does not itself define a full-floor DORI contour. Use independent-head support and fisheye/stitched inventory plus clearly illustrative coverage in the initial POC; detailed calibrated panoramic DORI is deferred follow-on scope. Keep the template/view representation capable of identifying a later supported profile without declaring such a solver implemented.

### Existing implementation and lifecycle boundary

The current solver evaluates one rectilinear view per camera and deduplicates IDs. Reusing a parent ID for several heads would omit views; cloning whole camera devices would inflate equipment/demand. It also reports area uncovered when no eligible cameras exist, which must not be presented as proof of blindness when unsupported panoramic views are present. These are implementation gaps for the confirmed support, not fixes made during this planning discussion.

The extension must preserve parent/child identities and selected profiles through revisions, field evidence, exports and backup. Per-head changes affect relevant checks; shared hardware changes can affect multiple heads under the existing retest policy. Whole-device archive/replacement and endpoint changes follow FR-35/36/53; changed-floor restoration follows confirmed FR-54. Exports identify assessed views, unsupported outputs and illustrative footprints. No approvals become mandatory and no planning result becomes a field-test Pass.

The [official reference digest](sources/panoramic-camera-reference.md) distinguishes independent heads, stitched panoramas and fisheye/dewarped views using [Axis panoramic documentation](https://whitepapers.axis.com/en-us/panoramic-cameras). The [fisheye datasheet](https://www.axis.com/dam/public/permalink/263167/datasheet-axis-m4338-plve-panoramic-camera-en-US_263167.pdf#page=7) illustrates nonuniform pixel density and conditional DORI distances. The [scope extract](sources/panoramic-camera-scope-extract.md) records current implementation limits. These sources ground the distinctions; the support levels above are confirmed Site Studio product choices.

## Confirmed site annotations

Confirmed 2026-11-17 when Kevin accepted the annotation scope, requested its addition to the PRD and asked about network closets/ports next. Use a small plan-markup layer explaining site and installation intent, reusing existing zones and survey evidence. FR-50 and linked evidence/export/shared-edit clauses capture the accepted behavior.

### Confirmed tools

| Tool | Intended use |
| --- | --- |
| Named lines/polylines | Fence runs, perimeter references and other site boundaries, with a label and basic line style. These describe the drawing; they do not automatically become physical barriers or cable runs. |
| Entrance markers and direction arrows | Identify pedestrian, vehicle or service entrances and intended direction. Optionally reference an existing door/gate record for lookup without creating another device or moving its physical record. |
| Named areas using existing zones | Label parking, loading, restricted or other site areas with the existing zone polygons. Keep a DORI requirement optional; an area without a target does not acquire one merely because it is named. Avoid a second competing coverage-zone system. |
| Text/callouts and simple dimensions | Short installation labels, optional leader lines and two-point distance annotations. Use the existing survey note/photo records for detailed observations and evidence. |

Attach each mark to its selected plan/floor, including an outdoor site plan. Retain a stable annotation ID, name/type, position/points and note/reference. Support select/move, point/text edits, simple colour/line style, locking, deletion and an annotation visibility layer. Keep labels readable without colour alone. Existing save/conflict/undo and revision rules extend to these editable marks; no new collaboration mode is needed.

### Measurements and evidence

A calculated dimension uses a known map/plan scale, shows its units and is labeled as a plan-derived estimate. If the scale is unavailable or unverified, identify that limitation rather than inventing a precise physical length. A technician’s field measurement remains a distinct recorded observation with its note/source; it does not silently become the calculated value. Do not equate a straight-line dimension with a routed cable or its supply quantity.

Reuse device/floor survey notes and photos instead of creating a second attachment store. A callout or entrance mark can reference an existing note/device/opening; deleting the mark does not delete the underlying record, issue or evidence. Stable references and earlier fixed revisions remain preserved. Device/cable archive/restore dependencies follow FR-53; changed-floor restoration follows FR-54, and draft deletion follows FR-55.

### Keep drawing intent distinct from calculations

A fence/perimeter line is descriptive markup. Use the existing wall/obstruction tool, with supported height/type inputs, when an object should block modeled camera visibility. Likewise, use existing security zones and their explicit settings for DORI targets, and the cable tool for actual route records. No annotation automatically changes an analysis boundary, coverage percentage, equipment quantity, cable cost or power demand. Hiding a mark is a presentation choice, not removal of the linked object or a change to analysis.

Direction arrows describe intended movement or a reference; they do not calculate routes or certify an evacuation/access-control sequence. The POC does not add a specialist symbol catalogue or CAD dimensioning/constraint system through this annotation proposal. Existing issue and field-change workflows remain the place to record actual defects or physical changes that need action/retesting.

### Exports and an example

Include annotations by default in the selected floor-plan sheets, using their labels, styles and a concise legend. Allow optional annotation visibility choices with omitted content identified under the confirmed export-manifest rules. Retain relevant property-wide outstanding issues even if their callout or floor is hidden. Preserve annotation geometry/references in editable backups and named revisions; the annotations do not become equipment schedule rows.

Example: draw a fence line labeled North perimeter, place a Vehicle entrance marker linked to Gate G-01, label the loading area using an existing zone, and add a callout referencing the survey photo of a proposed mounting surface. A simple dimension can show the estimated span; actual camera occlusion and cable length still use their respective tools.

The [official reference digest](sources/site-annotation-reference.md) records common [text/measurement drawing tools](https://docs.cctvdesigntool.com/quick-start/) and [separate visibility layers](https://docs.cctvdesigntool.com/ui-guide/layers.html). These are limited precedents; the Site Studio tools, reuse of zones/evidence and behavior above are confirmed product choices.

## Confirmed cable connection lifecycle — OQ-8 refinement

Confirmed 2026-11-17 when Kevin accepted the cable lifecycle approach, requested its addition to the PRD and asked about restoration after floor changes/deletion next. Keep cable runs independent of device lifecycle, preserving historical associations while explicitly reconciling current connections. FR-35/36/53 and linked clauses capture the accepted behavior; the [focused extraction](sources/confirmed-cable-lifecycle-extract.md) distinguishes it from current prototype deletion. Changed/deleted-floor restoration was subsequently confirmed in FR-54; draft deletion was subsequently confirmed in FR-55.

### Removing a device

Preview all known affected cable ends, interfaces, port/terminal assignments and dependents when actual removal is recorded. End the removed device’s active association and retain its last connection as history. Keep the cable record, stable run ID, geometry, lengths, notes and test history by default. Mark its unresolved current endpoint/disposition Needs connection review; do not automatically remove or archive the cable, assert that it was disconnected at both ends, or require an invented disposition before the actual device removal can be saved.

For each affected connection, let an editor explicitly record retained cable with a disconnected/unassigned end, reuse/reassignment to another device, actual cable removal/retirement, or an unresolved disposition needing follow-up. Record actor/time and the relevant change context under the existing field-change policy. Archive a cable only when its actual removal/retirement is documented; retain its history. A planned Remove/Replace action changes proposed intent, not current cable state or occupancy.

### Reusing cable for a replacement

Give a different physical device a new linked asset ID. Select which retained cable, termination and port assignments to reuse; validate current/proposed context, known compatibility and conflicting claims. A retained physical cable keeps its run ID with a dated endpoint change. A different replacement cable gets a new linked run ID. Do not duplicate a cable purchase merely because its endpoint changed, or transfer the old device’s identity, installation evidence or passing results to the new device.

Keep physical termination references separate from logical network associations: a cable can still terminate at an unchanged outlet/patch panel even when the attached device or patch lead changes. No full patching graph is implied. A planned reuse remains planned; it does not assert physical reconnection or a successful field test.

### Restoring the same physical device

Restore the same asset ID and history, showing earlier connections as historical choices rather than live assignments. Reconnect explicitly after checking the selected location, active cable/termination, port availability, compatible references and any active replacement. Do not reclaim a reassigned port, overwrite a replacement, resurrect a removed cable or silently restore an old relationship. Unresolved connections remain visible and unassigned for follow-up. The changed/deleted-floor destination follows confirmed FR-54; draft deletion follows confirmed FR-55.

### Port occupancy, evidence and dependent devices

Device demand and port occupancy are distinct. Exclude the actually removed device’s demand under FR-35, but do not declare its former port free: a retained cable can remain plugged in, or the port can be reserved for a replacement. Preserve known physical occupancy/reservation or mark availability unresolved until explicitly released or reassigned. Do not keep a historical device association as a current assignment or invent zero remaining load when an unknown active endpoint remains. Keep unknown or unassigned demand visible under FR-19/51.

Removing shared equipment such as a switch or controller flags its known affected connections/dependencies for reconciliation; it does not archive downstream devices or erase their demand and evidence. A connection record alone must not claim that every dependent function failed where alternate paths or incomplete information remain. Apply existing dependency checks atomically, including concurrent reuse/release/restore attempts.

Preserve previous test outcomes and fixed issued/closeout packages. Changed or restored connections trigger appropriate review/retest under FR-44; an old Pass does not establish current fitness. Show affected connection status in plans and schedules, preserve it in revisions/backups, and surface unresolved installation issues through the established scope and closeout rules. This introduces no mandatory approval gate or automatic pass/fail.

Example: archive CAM-01, retain CBL-014 and mark its endpoint for review while switch port 05 remains occupied/reserved as recorded. Explicitly reuse CBL-014 for replacement CAM-02. Restoring CAM-01 later keeps its history but cannot take CAM-02’s connection. The [reference digest](sources/connection-lifecycle-reference.md) identifies limited official asset-history/archive precedents; these cable/port semantics are confirmed Site Studio product choices, not verified competitor behavior.

## Confirmed restoration after floor changes — OQ-8 refinement

Recommended 2026-11-17 after cable-lifecycle confirmation and subsequently confirmed by Kevin; FR-54 and linked FR-1/36/42 clauses capture the accepted behavior, mapped in the [focused extraction](sources/confirmed-floor-restoration-extract.md). Use a short guided restore that preserves the archived device’s identity/history and requires confirmation of its destination before completing restoration into the active plan. Cable/port safeguards in FR-53 apply to the restored device’s connections. Device restoration is an individual record operation, not a rollback of the entire project to an old revision.

### Find the floor by identity and confirm placement

| Original floor context | Proposed POC behavior |
| --- | --- |
| Same floor, unchanged drawing/location basis | Show its current name and preview the previous device position for confirmation. Do not silently complete restoration or reconnect it. |
| Renamed floor only | Match its stable floor ID, not its display name. Suggest the former position when the geometry basis is still applicable, preserving the historical name in older context. |
| Replaced drawing, changed scale/alignment, or materially changed layout | Open the current floor plan and require the editor to review/reposition the device. Old coordinates are historical reference, not proof of the current location. If the prior mapping is uncertain, require an explicit new placement rather than fabricate a transformed pin. |
| Deleted floor or unresolved original floor reference | Require the editor to choose a current floor in the same property, or create a floor through the normal workflow and then place the device. A newly created floor has its own identity even if its name matches the old one. Do not automatically recreate the old floor or guess a substitute by name. |

For the POC, require a valid destination floor and an explicitly confirmed position before completing active restoration. If the editor is not ready to choose, cancel/leave the device archived with its history intact; a floor independently created through the normal workflow remains a separate action. Do not add a separate unplaced-device queue in this scope. Missing verified scale or drawing data remains visible under existing analysis rules—selecting a floor/point does not establish its physical accuracy or require inventing a measurement.

### Preserve the old record and review affected references

Retain the original floor identity/label, prior location and captured plan/revision context with dated installation, notes/photos and tests. Earlier evidence remains linked to the conditions observed; it is not relabeled as evidence at the new location. Show an old plan only if it was retained. Missing historical drawing/transform information stays explicitly unavailable. Record the restored device’s selected floor/location, actor/time and meaningful change context without rewriting fixed revisions or closeouts.

Following FR-53, prior cable/port choices remain historical until explicitly revalidated. A different floor or location may invalidate a route endpoint/drop or riser reference; flag affected parts for review without deleting the retained run or moving unrelated segments. Do not draw an invented inter-floor line, infer new vertical lengths, reconnect automatically or claim installation/test completion. Existing work-scope costing still applies; restoring the same physical asset does not create a replacement purchase.

Recalculate supported current/proposed analysis only using the selected location and known inputs, identifying unresolved route/scale/coverage assumptions. Apply existing change/retest rules: actual return to service or relocation needs appropriate current checks, while a supported drawing-only correction does not by itself establish a physical move. Historical passing results remain historical.

Apply normal shared-edit safeguards if the destination floor, drawing basis, device or dependencies change during restoration. Preserve the pending choices and ask the editor to review the new saved context instead of committing onto a deleted or stale plan. Reopen an archived project under its existing lifecycle policy before editing it; restoration does not bypass project scope or history.

Example: CAM-01’s original Floor 2 drawing has been replaced after remodeling. Restore its original ID, open the current Floor 2 plan and confirm its new position. Keep the old installation photo and location in history; review the affected CBL-014 endpoint and required checks before claiming the current connection or test status. Detailed floor-deletion policy and accidental draft-placement deletion are not resolved by this model. Draft deletion was subsequently confirmed in FR-55; floor deletion was subsequently confirmed in FR-56. The [floor-restoration reference digest](sources/floor-restoration-reference.md) records limited official floor-editing and inactive-asset-history precedents; the restore flow above is a confirmed Site Studio product choice, not verified competitor behavior.

## Confirmed draft deletion, cancellation and correction — OQ-8 resolved

Confirmed 2026-11-18 when Kevin accepted the reviewed proposal and its three choices. FR-55 and linked FR-21/35/36 clauses capture the behavior. The [draft-deletion reference](sources/draft-deletion-reference.md) holds the earlier five-point proposal; the confirmed model differs from it in two places, noted below.

### Choose the action from the record’s history

Eligibility for Delete draft depends on what the record carries, not on its existing/proposed flag: no notes/photos, test attempts or linked issues, and no inclusion in an issued design, surveyed baseline or closeout. Inclusion in an ordinary named revision does not block deletion, and that revision keeps its copy. The earlier proposal excluded every record representing an existing asset; Kevin instead confirmed that a just-placed existing-condition record with no such history is deletable, because mis-clicks during survey are routine.

Issued-but-never-installed equipment uses Cancel from design with a short reason. It is not archived, because archive records an actual physical removal. A record entered in error that is already in a surveyed baseline or carries evidence uses Correct record, marked mistaken or duplicate with a reason, like the issue correction in FR-46. Physically removed equipment continues to use the FR-35 archive.

### Dependents, undo and limits

An isolated eligible placement is removed in one action with no dialog; a preview appears only when dependencies exist. The earlier proposal preserved every dependent as detached. Kevin confirmed that dependent routes, reservations/assignments and associations that are themselves eligible drafts are removed with the record. Retained or installed cables, occupied ports, shared equipment, linked components, evidence and issues are never cascaded; they are detached and marked for connection review under FR-53.

Undo is the guarded own-session undo of FR-21. It restores the draft and its uncontested draft relationships, and leaves any relationship since claimed elsewhere unresolved. No action here records physical removal, releases an actual port, resolves an issue or changes a test outcome, and no approval gate is added. Deleted IDs are not reused.

The current prototype deletes a device together with its routes and converts surviving survey references to floor pins, with no eligibility check, cancellation or correction action. FR-55 does not define deleting a floor together with its contents; that was subsequently confirmed in FR-56.

## Confirmed acceptance targets and limits — OQ-9 resolved

Confirmed 2026-11-18 when Kevin accepted the tabled proposal and its five choices: phones are field-only; photos are stored resized, not as originals; WCAG 2.1 AA applies with a map-canvas exemption; the sizes, timings and limits stand as tabled; and backups are nightly with 7-day retention and no uptime promise. The PRD’s acceptance section holds the full fixture, ceiling and target tables, with NFR-2/3/4 and A-2 pointing to them.

These are targets for the future shared application, not measurements. The current prototype differs: 40 session undo steps, 20 named revisions, a 100 MB portable project limit, a 64 MB review-snapshot bound, photo previews capped at 1,600 px and 24 MB per design, and combined analysis capped at 500 cameras. It has no server-held project, so it has no server backup. The 50 MB PDF import limit and six photos per note carry over unchanged. The five-second shared-update figure, previously a suggestion, is now the acceptance target; polling remains a sufficient transport.

Because photos are stored resized, a closeout package is a record of resized evidence images, not an original-resolution archive. Hosting, database, file storage and the backup mechanism remain architecture choices that must meet these targets.

## Confirmed floor deletion, retirement and moves — OQ-10 resolved

Confirmed 2026-11-18 when Kevin accepted the tabled proposal and its four choices, and asked for the move action to be included. FR-56 and linked FR-1/54/55 clauses capture the behavior. It extends the FR-55 principle to floors: the action depends on what the floor holds, and nothing with history is destroyed.

A floor is deleted outright only when it is empty or holds draft-only items and was never in an issued design, surveyed baseline or closeout. While any active record with history remains, removal is blocked and each such record must be handled individually. Kevin rejected a one-step “remove the floor and archive everything on it” because it would record physical removals nobody verified. When only history remains, the floor is retired: out of the active list and current calculations, read-only with its drawing, and reinstatable with the same identity.

Floor-level drawing content (overlay, zones, obstructions, annotations, analysis settings) is removed with a deleted floor and is recoverable only by own-session undo or a named revision. A draft cable segment on a deleted floor is removed and its run becomes incomplete; a retained or installed run blocks deletion.

Move to another floor is new scope added by this decision. It keeps IDs, evidence and history, requires a confirmed position on the destination, and for records with history must be identified as a record correction or an actual relocation. Cables and port assignments are flagged for review, never rerouted automatically.

The current prototype removes a floor together with all its contents in one step, has no retire or reinstate state, cannot remove a building and has no move-between-floors operation.

## Confirmed delivery slices

Confirmed 2026-11-18 when Kevin accepted the tabled slicing and its five choices: a cut line with slices 1–4 as core acceptance and slice 5 as extended; the fixture tested in two stages; return-visit history before extended modelling; camera-model templates in slice 2; and a Delivery slices section in the PRD with no change to requirement IDs or wording.

The order reflects dependency, not importance. Shared server-saved records come first because issued designs, field evidence, conflict checks and fixed packages all assume them; the prototype’s local browser storage cannot carry them. FR-7, FR-9, FR-19 and FR-33 are delivered in parts as tabled in the PRD. Slice boundaries are a planning decision and can be revisited during architecture without reopening the requirements themselves.

## Source and verification boundaries

The [source index](source-index.md) and [baseline extract](sources/draft-baseline-extract.md) record inventory checks, historical QA, stale documentation and unverified defects. No application tests, builds, browser flows or Google live-key checks were rerun for this draft.

The [external](sources/reference-context.md) and [commissioning](sources/commissioning-context.md) digests provide limited context, not a full PSP review, adopted standard, mandatory approval gates or evidence of a competitor's project hierarchy. Domain-specific tests and compliance claims need additional sources.

The PRD and decision log supersede proposal labels in the [preserved discovery notes](sources/discovery-notes.md). Detailed UX, architecture and test templates remain downstream work.
