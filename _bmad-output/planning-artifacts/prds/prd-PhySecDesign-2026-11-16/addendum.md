# Site Studio — PRD addendum

Supporting context for [final PRD 1.0](prd.md), updated 2026-11-17; a section on proposed amendment 1.1 was added on 2026-11-18. This domain reference preserves accepted models, technical detail and examples for UX, architecture and implementation. Sections explicitly distinguish prototype behavior from confirmed requirements and unmeasured acceptance targets. Current mechanisms and numeric prototype limits are not automatically permanent product requirements.

- [Implementation baseline and migration context](#implementation-baseline-and-migration-context)
- [Property context, work scope and issued design](#property-context-work-scope-and-issued-design)
- [Access, shared editing and record integrity](#access-shared-editing-and-record-integrity)
- [Inventory intake and survey verification](#inventory-intake-and-survey-verification)
- [Equipment and camera models](#equipment-and-camera-models)
- [Closets, ports and physical cable routes](#closets-ports-and-physical-cable-routes)
- [Site annotations](#site-annotations)
- [Commissioning, evidence and targeted retesting](#commissioning-evidence-and-targeted-retesting)
- [Archive, restoration and cleanup](#archive-restoration-and-cleanup)
- [Design and closeout packages](#design-and-closeout-packages)
- [POC acceptance and operating targets](#poc-acceptance-and-operating-targets)
- [Downstream responsibilities and evidence boundaries](#downstream-responsibilities-and-evidence-boundaries)

## Implementation baseline and migration context

### Application and hosting baseline

The existing Site Studio application is a React/Vite map editor with browser-local project storage and a separate local revision-review API. The [design/coverage digest](sources/design-and-coverage.md) and [delivery/review digest](sources/delivery-and-reviews.md) identify the relevant source files and tests.

| Area | Current implementation | Consequence for the PRD |
| --- | --- | --- |
| Project state | One IndexedDB draft; portable project files and full named revisions. | Shared persisted editing in FR-2 requires new work. Local autosave alone is insufficient. |
| Review | Fixed layout snapshots, revocable reviewer bearer links, pinned comments, decisions, local server persistence. | Reuse the version-specific review concept; it does not implement full project collaboration, verified identity, or field updates. |
| Review contents | Reduced snapshot omits survey/photos, costs, capacity, detailed equipment notes/models, and camera-analysis settings. | A review snapshot is not a full named backup, issued installation record, or complete closeout package. |
| Hosting | Vite development/preview serves the local review API; the separate static Sites package does not. | Implement the confirmed access model, select hosting in architecture, and implement the confirmed shared-save/conflict model before claiming online workflow acceptance. |
| Field/lifecycle | Survey notes, existing/proposed devices, revisions and review are present. | Installation/configuration/tests, issued-design history, device archives, fixed closeout and reopened work are new capabilities. |

Recorded demo participant names do not authenticate people. Owner/reviewer bearer credentials and private review files are not project-export content. No production access model is selected by this POC.

### Maps, plan import and original assets

Current mapping uses OpenStreetMap, optional configured Google mapping, USGS imagery for the US satellite option, and Photon address lookup. Provider coverage, availability, keys, attribution, and usage conditions need appropriate implementation handling. No new provider contract or live-key validation is asserted.

A floor currently holds an image overlay with geographic position, rotation, uniform scale, opacity and lock state. Two-point alignment uses a similarity transform; it does not correct perspective or a distorted drawing. PDF import parses the original file and handles its password locally, then renders the selected page to an image, with current 50 MB input and 3,200-pixel render limits. The prototype import does not retain the original PDF or editable CAD geometry. The confirmed FR-6/34 scope now requires new original PDFs plus previews to be retained; it does not retroactively create originals missing from existing records or add editable CAD import.

The generic catalog has nine entries across eight types, including dome/bullet camera variants, reader, light, door contact, intrusion sensor, intercom, switch, and cabinet. Additional equipment types and linked door/gate records are now confirmed in FR-7/49, beyond this implementation snapshot. Site annotations and explicit closet/port planning are now confirmed in FR-50/51; physical inter-floor/riser planning is now confirmed in FR-52. Related controls do not prove those capabilities exist.

### Routing, capacity and survey baseline

Routes currently connect same-floor endpoints using Cat6, fiber or security cable, with waypoints and horizontal length plus slack. Automatic vertical distance, engineered pathways, validated physical port assignments, and a complete network topology are not implied.

Storage estimates use bitrate, recording percentage and retention with decimal storage units. Simultaneous stream bandwidth sums full configured bitrates; recording percentage does not reduce that bandwidth. Capacity planning includes active endpoints, one copper-port demand per IP endpoint where applicable, drawn Cat6 uplinks, switch total/per-port PoE limits, unassigned demand and ambiguous connection warnings. Preserve property-wide demand even when a selected switch or floor is incomplete. These estimates do not validate actual vendor equipment behavior or guarantee recording performance.

Materials include equipment/cable allowances, manual accessories, and optional labor. Later-work costing must retain historical estimates and distinguish retained assets from chargeable additions/changes. The work-scope model defines cost treatment; detailed controls belong to UX.

Survey images are resized previews, currently limited to six photos per note and 24 MB encoded photos per design; they are not an original-resolution evidence archive. FR-20/34 now require retaining new original photos alongside previews; older missing originals remain unavailable. Current device deletion removes routes and converts surviving survey references to floor pins. The newly required archive behavior must deliberately preserve device/connection/evidence history instead; its current-route behavior is now confirmed in FR-53, with changed-floor restoration confirmed in FR-54 and draft deletion confirmed in FR-55.

### Revision and export baseline

The prototype currently has 40 session undo steps, 20 full named revisions, and a 100 MB portable project limit including duplicated revision data. Review snapshots have a separate 64 MB bound. These limits need reassessment for shared lifecycle records, repeated closeouts, and retained photos; they are not newly accepted retention targets. Existing version 1/version 2 project migration must be considered when adding the new records.

Current PDF output uses Letter/A4 landscape raster pages at 216 dpi with annotated plans, legends, schedules, zones and survey content. It does not embed live basemap tiles or editable/searchable vector drawing content. The accepted package model adds manifests, quantity/capacity defaults, optional costs, field evidence, decisions, pagination and exact historical retention beyond this exporter.

Keep four records distinct: full named project revisions; reduced shared review snapshots; fixed issued-design references; and fixed closeout records. The existing CSV covers materials/estimates; separate equipment/cable schedule CSVs are not an established capability or committed addition. A printable PDF or CSV does not replace the complete editable project archive. Their source versions and disclosure boundaries must be explicit.

## Property context, work scope and issued design

### Surveyed baseline, proposed work and actual installation

The surveyed baseline, proposed work and actual installation have distinct representations with stable asset identity (FR-39–41). A survey entry may come from an old plan, observation or explicit estimate; unknown model/date/condition/specifications must not be fabricated. A survey is not proof of commissioning.

Current/proposed analysis population is a deliberate domain choice, independent of display-layer visibility. Proposed replacements must avoid accidental double-counting, while planned removal must not archive the current physical record. Retained equipment still contributes applicable demand despite having no repurchase cost. Known failures and unknown inputs need visible treatment; a planning calculation remains an estimate. Exact data representation and migration from the current existing/proposed flag belong to architecture.

Existing cables use retained-versus-changed cost treatment and FR-53 endpoint/archive rules. Scoped checks and existing defects follow the checklist, retest and closeout models. Inventory intake supports manual survey and reviewed spreadsheet import (FR-56–59/62). The general inventory/history pattern is consistent with [SiteOwl’s asset-management description](https://getsiteowl.com/physical-security-asset-management-software/); the precise actions and view rules are confirmed Site Studio choices.

### Work scope, costs and outstanding issues

Keep one active named work scope within the continuing property project (FR-17/32/38/45/46). Initial and reopened work cycles have their own scope, estimate and evidence. Multiple named design revisions can belong to one scope: saving a layout alternative does not start a new job or duplicate costs. Earlier issued revisions and closeouts remain fixed.

#### Select work without losing the installed context

| Scope category | Purpose | Estimate and testing treatment |
| --- | --- | --- |
| Work now | Add, relocate, service/reconfigure, replace or remove equipment/routes. | Relevant parts, supply quantities and optional labor; applicable installation/configuration/tests and required retests. |
| Inspect/test only | Assess selected existing equipment without planning a purchase. | Relevant scoped checks and optional inspection/testing labor; no automatic hardware repurchase. |
| Reference only | Retain unchanged installed equipment as property context. | Include applicable coverage/capacity; exclude from new purchases and automatic recommissioning. |

Preselect planned changes transparently and let editors adjust scope with a recorded reason for meaningful changes. Unknown baseline details do not automatically become failed tests or work orders. Keep unknown inputs and documented faults visible. A dependency affected by current work must be reviewed under the confirmed retest rules; choosing Reference only cannot silently clear its required retest or unresolved failure. Add the relevant work/checks, or explicitly defer the outstanding item. Scope changes recalculate the current estimate/checks without changing fixed issued scopes or adding a mandatory approval gate.

#### Estimate this work cycle

Charge new/replacement hardware and cable, selected accessories and optional labor for this scope. Retained equipment/cable is not automatically purchased again; relocation, servicing and removal can have explicit labor/parts. Reuse unit rates when useful, but do not carry old quantities into a fresh estimate unless the editor explicitly copies selected lines. Keep unknown prices visibly unpriced rather than implying a known zero cost.

Distinguish total installed route length from cable to supply. A route changing from 10 m to 12 m might require a full new run, not just 2 m of purchased cable. Record the supply quantity for the planned work explicitly, include slack once, and retain the basis. This remains an estimate; no automatic engineering or live vendor pricing is promised. Preserve earlier estimates with their fixed revisions/closeouts.

#### Carry issues across revisions

Maintain a small property issue list with stable IDs linked to devices, checks, work scopes and earlier attempts. Reopening carries unresolved items forward without duplicating them or altering earlier closeout snapshots. Editors can:

- Include now: add the relevant work/checks and costs to the current scope.
- Defer: leave the issue open with a brief reason and optional owner/due date; keep it visible in the remaining-work list, closeout and later reopened work.
- Resolve: record the corrective work and appropriate current evidence/retest. Preserve the original failure and link the resolution/new attempt.

Correct mistaken or duplicate issue records with an explanation, actor/time and a link to the canonical issue where applicable. Correction does not turn a real failure into Pass. Archive/replacement alone does not resolve an underlying gap: record how the completed work addresses the applicable requirement and any necessary checks. Do not add an accepted-risk action that silently closes a genuine unresolved defect.

#### Closeout remains explicit

Preserve the existing three project states. The selected work scope can show its work finished while unresolved property issues remain; its closeout is then Closed with outstanding items, with the brief note and remaining list. Completed is available only when no documented unresolved issues or required unfinished checks remain under the confirmed completion rules. Out-of-scope or deferred defects remain outstanding rather than disappearing when scope is edited. This rule does not require every unchanged legacy device to be newly tested: unknown inventory details and unscoped tests are distinct from documented faults and required follow-ups.

Example: the lobby camera upgrade is finished, but an existing parking-lot camera fault is deferred. Show the lobby scope as finished and the property closeout as Closed with outstanding items. Carry the parking-lot issue into later work; do not mark it passed, repurchase unchanged devices or rewrite the older package.

The retained failure/correction/retest and punch-list record pattern is supported by [UFGS 28 08 10 sections 3.3.5.1 and 3.3.5.3](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf). Its government acceptance gates are not adopted. The scope categories, costing choices and deferred-issue closeout policy above are confirmed Site Studio product choices.

### Current issued installation reference

Deliberately designate one current issued design for each active work scope, using a fixed named issued revision (FR-26/61). The [focused extraction](sources/confirmed-current-issue-extract.md) records the scope. Saving a draft, making an alternative or exporting a preview must not change the installation reference. Before an issue exists, show Not issued; installation start requires issuance even when handoff or approval is skipped. A later scope must not silently adopt the prior scope’s issue.

Show the current issue identifier/revision name, issue date, work scope and approval/bypass state prominently at the field-work entry and when viewing the issued plan, with a direct action to open it. Distinguish the fixed issued reference from the editable working installation/as-built record. Record designation changes with actor/time and preserve the sequence of prior references. Existing shared conflict checks must prevent two editors from silently designating conflicting current issues.

When a different issue is deliberately made current, mark the earlier issue Superseded in the live project and link to the current one. Retain its exact PDF files, source revision, comments, approvals and designation history; approval of one issue does not transfer to another. Do not alter previously generated PDF bytes or claim to recall already downloaded copies. New editions retain their own source/status cutoff under FR-34. Approval remains recommended and bypassable; current does not mean approved, installed or tested.

Changing the reference must not roll back or overwrite field placements, notes/photos, configuration, tests or actual connection records. Use existing revision comparison to show changes against the working installation and apply existing meaningful-change/retest rules when actual work is recorded. Do not require a new formal installer acknowledgement or approval gate.

## Access, shared editing and record integrity

### Demo access

Use one hosted HTTPS demo with a revocable project edit link shared by trusted designers/installers and separate revocable links for designated reviewers of fixed design/closeout versions (FR-2/23–25, NFR-5). Design and Installation are work views, not permissions. Editors can manage reviewer links and use self-approval/bypass. Display names are unverified demo attribution: anyone holding a link can exercise its permissions.

Enforce project/revision scope on the server for records and stored drawings/photos. Keep access credentials out of portable projects. Use sample or sanitized nonconfidential data; confidential client use needs a separate access/data decision. This is consistent with [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); the two-link model is a Site Studio product decision. Hosting vendor and shared-update implementation choices belong to architecture.

### Shared editing and common safeguards

FR-2/21/22/24/31/32/42 and NFR-2 define shared editing. Storage/transport choices and versioning primitives remain architecture decisions. The accepted peer-update target is five seconds after durable save under the declared test conditions.

#### Shared state and normal saves

Keep one authoritative server-saved project with durable records and attachments. Acknowledged saves must survive closing a browser and an ordinary service restart. Only report an attached photo as saved once its upload and record association have succeeded; partial failures remain visible. Database/file-storage selection remains architecture work; backup/recovery targets are now confirmed in FR-34 and the acceptance section below.

Autosave completed edits, rather than every drag intermediate. Show Saving, Saved, Unsaved and Conflict states with aggregate project status that never hides a pending item. Refresh other connected browsers within a few seconds—the confirmed target is within five seconds after durable save under the recorded test conditions. Refresh on returning to the tab and provide a manual refresh. Incoming updates must not replace a form, drag or text entry with local unsaved work. Polling is a sufficient initial transport; no live cursors or character-by-character joint editing is required.

#### Conflicts and related records

Use version checks on editable items (device, route, zone, checklist definition, floor/project settings). Different independent items can save concurrently. If the same item has changed since it was loaded—even in another field—reject the stale save, retain the user's pending input, and show the saved change alongside the attempted change. Let the user accept the saved version or review and reapply selected intended edits to the latest version. Recheck that version when saving again; do not offer a blind overwrite or silently merge the entire object.

Protect related operations together: device removal/replacement and connections, floor removal and its contents, and archive/restore/closeout must validate their affected records and current project state as one operation. A stale tab must not recreate removed records or write into an archived project. Exact record boundaries and transactions are architecture work; independent item editing cannot bypass these relationships.

An HTTP implementation can use strong versions/ETags and conditional writes such as If-Match, whose failed precondition prevents a stale write; see [RFC 9110 section 13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1). The standard supports lost-update protection; it does not choose our conflict UI, record granularity or timing targets.

#### Evidence, recovery and undo

Add new notes, photo attachments, test attempts and reviewer decisions as separate identified entries, retaining earlier evidence. Concurrent additions should coexist; retries of one action should not create duplicates. Editing an existing mutable entry uses its version; corrections to protected test/approval history add records rather than rewriting the originals. Preserve checklist wording and applicable context with each attempt.

If connectivity fails, show the unsaved state and retain pending input while the page is open; pause server-dependent work and retry/revalidate on reconnection. Do not promise durable offline capture, background offline work or recovery after closing the page. A timeout can occur after a successful server save, so retries must determine whether that action already succeeded.

Undo applies to the current browser session's recent working edits, using an internal session identifier rather than trusting the display name. It creates a new recorded reversal and checks affected versions. If another edit has changed the relevant item or dependencies, explain why direct undo cannot proceed and offer review. It must not roll back another person's work, erase evidence, or modify fixed revisions. Redo uses the same guards.

Named snapshots, issuing, restoration and closeout use a consistent server-saved version and revalidate project state. Resolve the initiating user's relevant pending/conflicting edits before taking the snapshot. Other clients' unsaved edits are not included or represented as saved. Closeout rechecks current outstanding work. A full revision restore is a deliberate guarded project action, separate from ordinary undo.

#### POC acceptance example

Two browsers edit different cameras: both changes persist. Both then change the same camera: the first accepted save remains, the second is retained as a visible conflict, and selected edits can be reapplied after review. Independent photo/test additions both survive; retrying one does not duplicate it. An undo after another person's related edit is blocked for review, and a brief connection failure never displays unsaved work as saved. Neither issuing nor closeout captures an inconsistent mix of versions.

## Inventory intake and survey verification

An existing-site project can begin with a spreadsheet or a survey. Import available inventory, then verify/correct it and add newly discovered devices during the survey (FR-39/56). The [source extraction](sources/confirmed-inventory-import-extract.md) records this workflow.

Imported values remain source claims until verified. Surveyors can correct/enrich records and add discovered devices, using the identity, history, unknown-input and evidence rules. Import does not authorize automatic discovery or connection creation.

### Formats, fields and column mapping

Use a bounded equipment-inventory importer for UTF-8 CSV (.csv) and ordinary Excel (.xlsx), with one selected tabular worksheet, selectable header row and one physical device per data row (FR-62). For CSV, confirm the delimiter and parsed columns. Defer legacy .xls, macro-enabled/password-protected workbooks and live cloud-sheet connections; offer conversion. Do not automatically treat spreadsheet layout, drawings, embedded photos or multiple camera heads as separate devices. The [focused extraction](sources/confirmed-spreadsheet-scope-extract.md) records this scope.

Use a short workflow: choose file/sheet/header, map columns, review interpreted rows and proposed effects, then import the selected valid rows. Suggest familiar headings but let the user change or ignore each mapping. Make unmapped columns visible rather than silently treating them as imported. Show required-field gaps, invalid values, conflicting mappings and duplicate/matching results before commit; let users correct the source/mapping or explicitly skip affected rows. Reuse FR-58's New/Unchanged/Changed/Needs review preview and verified-field protection; do not introduce another conflicting import policy.

Start with inventory fields: source asset ID and optional existing Site Studio ID, label/name, equipment type, manufacturer/model, serial number, IP/MAC address, building/floor/room hints and descriptive notes. Require at least a usable label or source asset ID per new row; source IDs are strongly encouraged for repeat imports but incomplete inventories remain usable. Map equipment type or choose an explicit batch default, including generic/custom Unknown when the source cannot establish a type. Preserve unknown attributes. Generate internal IDs for new records without reliable source IDs; later ambiguous re-imports require explicit review instead of matching by name alone or blindly creating duplicates.

Resolve source type labels to supported catalog categories through a small value-mapping step (for example CCTV to Camera). Let users confirm building/floor matches to existing project records or retain unresolved location hints in Awaiting placement. Do not create floors, coordinates, cable runs, port assignments or optical models solely from free-text names. Model numbers can remain inventory text until deliberately linked to a suitable catalog definition; missing lens/resolution data is not inferred. Existing/proposed intake context can use an explicit, previewed batch choice; an imported installation or test-status column remains a source claim and cannot become verified field evidence or a Pass.

Preserve identifier strings and leading zeros where present in the source; flag uncertain conversions rather than silently coercing identifiers, dates or numeric values. Read ordinary cell values or available stored formula results only, without calculating formulas, running macros or refreshing external links; missing/error results require review or a values-only source. Credentials remain excluded under NFR-5. Exact parser and formula/format handling belong to implementation and must satisfy this visible behavior.

Offer a downloadable sample template and remember the project's last confirmed column mapping, proposing it only when the new headers fit and always allowing preview/edit. Defer a general transformation/scripting or organization-wide mapping-management system. Preserve selected source filename/sheet/row and mapped-value provenance for later survey/re-import diagnosis; do not silently retain ignored sensitive columns as imported attributes. Plan the import exercise against the confirmed 600-device profile, without making that count a hard row ceiling. Exact file/resource limits are now confirmed in the acceptance section; parser/workload implementation belongs to engineering. These format/mapping choices are confirmed; they do not establish implemented importer support or acceptance results.

FR-57–59 define Awaiting placement, reviewed matching/re-import and guarded bulk cleanup. The [reconciliation extraction](sources/confirmed-import-reconciliation-extract.md) preserves the source decision; FR-62 defines supported formats and mapping.

### Matching, reviewed updates and re-import

Use the existing Site Studio device ID when present and valid for this property. Otherwise match only a reliably unique, stable source asset ID within a declared source/property context. Names, IP addresses, row positions and location hints can assist review but must not silently establish identity. Preserve IDs as strings, including leading zeros. Conflicting or duplicate keys, matches to archived devices and indications of a different physical replacement require explicit review, not automatic merge, restoration or identity reuse.

Preview New, Unchanged, Changed and Needs review rows, including duplicate keys within the file. Show current and incoming values with source/verification context. Skip unchanged data and identify already-applied rows/retries without duplicate creation. Offer clearly scoped batch selection of straightforward new rows and reviewed changes, without requiring a separate confirmation for every ordinary row; unmatched or ambiguous rows are not guessed into existing assets. Mapping/source-batch records should make later diagnosis possible; row order alone is not a durable matching key.

For updates, keep site-verified/current evidence by default and require deliberate reviewed corrections with the existing change reason/history and impact rules. A changed spreadsheet value is not observed physical work or a new field-test Pass. Blank cells do not erase existing values by default; use explicit correction controls where clearing is intended. A record absent from a later spreadsheet remains in the project—absence is not proof of physical removal or authorization to delete/archive it. Re-import never silently reactivates an archived record. Validate current record versions/dependencies when applying the preview and make skipped/failed/conflicted rows and retry outcomes visible.

### Awaiting placement and survey verification

- Imported rows missing a usable floor or map position remain in Awaiting placement (FR-57), with source building/floor/room hints and stable identity preserved. No invented pin or coverage is created; otherwise applicable property demand and unknown/unassigned inputs remain visible under existing rules. Placement during survey keeps the same ID and does not itself establish a test Pass. FR-54 still requires a destination before archived-device restoration; the list is an explicit import-only distinction.
- A field screen could filter the imported batch by building, floor or verification state, locate an existing record, add notes/photos, confirm/correct information and add an unlisted device. FR-8 already requires equipment lookup; details are UX/acceptance work.

## Equipment and camera models

FR-7/47–52 cover generic equipment, model-specific cameras, linked openings, annotations, explicit closets/ports and physical inter-floor routing. Lifecycle rules are in FR-53–55; the acceptance section defines operating targets.

The accepted scope supports generic equipment and model-specific cameras, a basic controlled opening, explicit manual switch-port assignments and transparent cable estimates. It builds on the existing same-floor route baseline without treating the new requirements as implemented. Full vendor catalogs, rack/patch-panel engineering, automatic routing and detailed electrical calculations remain outside the POC extension.

### Equipment families and linked openings

Keep the existing dome/bullet cameras, readers, door contacts, intrusion sensors, intercoms, lights, switches and cabinets. Add generic door and gate records, access controller/control panel, lock/strike, request-to-exit device, low-voltage power supply and recorder/NVR entries, plus a generic custom-equipment fallback. Existing door-contact records remain contacts; do not migrate them into doors. User-entered manufacturer/model-specific camera templates are confirmed. The confirmed multi-view section below supports conventional heads and illustrative panoramic previews; detailed calibrated fisheye/stitched DORI remains follow-on scope. Automatic manufacturer libraries and live product pricing remain outside the confirmed POC scope.

Each record has a stable ID, type, optional manufacturer/model, floor/location/mounting, notes and relevant entered planning values. Preserve unknown values. Camera templates are explicitly required under FR-47; this equipment confirmation does not add a dedicated noncamera template library or catalog automation. Other reuse mechanics remain downstream refinement. Model entries describe planning inputs, not independently verified manufacturer compatibility.

A door or gate is a named physical opening with optional links to selected readers, contacts, lock/strike, REX, intercom, controller or other equipment. Label side/direction where useful. Linked components retain individual IDs, costs, cable connections, checks and lifecycle history. An opening does not automatically create a fixed bill of materials, consume a network/PoE port or imply all components are installed/passing. An explicitly priced door/gate asset can have its own cost; do not also price a template bundle containing the same component costs. Associations do not create physical cable runs. Shared controllers or supplies can link to several openings without cloned purchases or duplicated demand. Editing a link does not archive a component, erase its evidence or imply installation/test completion. Gate-specific operating/safety sequences remain project-defined checks, not a new simulation engine.

### Prototype camera-analysis conventions

Camera coverage is a sampled 2.5D planning model using rectilinear optics, a target plane, and finite-height obstructions. It does not simulate a complete scene, lighting, lens distortion, or real video quality, and it does not establish certified performance. Single-camera analysis and floor-wide combined analysis have different area semantics. Combined results use a common target height and all eligible active floor cameras, independently of presentation visibility. Boundaries include their full areas, including solid interiors and fallback margins; excluded/unsupported cameras must be disclosed.

The prototype defaults to the drawing image extent, then camera surroundings, then the floor’s stored map area. These fallbacks do not recognize a building interior. It initializes the common target plane to 0 m and excludes rectilinear cameras whose lenses are at or below it, with an explanation. These are current implementation conventions, not independently validated engineering rules.

The current DORI implementation uses thresholds of 25, 63, 125 and 250 pixels per meter for Detect, Observe, Recognize and Identify, following its documented IEC 62676-4:2014 convention. This records the prototype's convention; it is not an independent standards validation or a claim about current editions. Combined DORI takes the best unobstructed individual camera. Seen/below-Detect, unseen, and overlap describe different results.

Named security-zone polygons have independent target levels and qualifying percentages. Their whole polygon is the denominator. Clean contours improve presentation over sampled results; they do not turn those results into exact vector-area measurements. Current analysis caps, effective sampling and supported-input warnings belong in the acceptance fixture discussion, not an untested scale claim.

### Reusable camera-model templates

Engineers can create reusable camera definitions and search/select a known manufacturer/model number (FR-7/10/47). Definitions include resolution, horizontal/vertical FoV, focal length and sufficient inputs for DORI with fixed and adjustable lenses.

#### Model definitions and imaging profiles

| Information | Treatment |
| --- | --- |
| Identity | Manufacturer, model number, relevant lens/variant and a reusable template identity. Search by model number/manufacturer and retain the generic-camera option. |
| Resolution/mode | Explicit image width × height in pixels for the mode used in analysis, with aspect/crop/capture-mode context where applicable. Do not assume advertised maximum megapixels equals the selected output. |
| Lens | Fixed or adjustable/varifocal. Store a fixed focal length or supported minimum/maximum, plus a reusable default; each placed varifocal camera has its own selected focal length. |
| Field of view | Horizontal and vertical angles in degrees, tied to the relevant mode and focal setting. Preserve published wide/tele or other measured profiles when supplied. |
| Sensor geometry | Active imaging width/height in millimeters when available; a nominal optical-format label is separate reference information, not a millimeter dimension. |
| Source and confidence | Optional datasheet/reference and entered values, distinguishing sourced, derived, estimated and unknown information. Retain the source/version context used by a design. |

Store camera specifications separately from per-instance location, mounting height, aim/tilt, chosen mode/focal setting and installation context. Templates can provide convenient defaults, but placing two copies creates separate device IDs and allows different installations. Existing target-height, obstruction, boundary and zone inputs still determine coverage analysis. Catalog model data does not replace field verification or change the current DORI threshold convention.

#### FoV and sufficient calculation inputs

FoV angles describe the selected camera/lens profile. Physical scene width and height require a distance and reference plane; show those values as calculated results at the stated location rather than treating them as permanent model dimensions. For a tilted/mounted camera, retain the existing modeled target-plane geometry and obstruction effects instead of assuming a simple flat scene at every point.

Use an explicit coherent optical basis for analysis. Manufacturer H/V FoV for a stated profile may supply that basis; compatible active sensor dimensions plus focal length may derive it. Preserve source specifications alongside derived values. When entries disagree or the current geometry cannot represent them consistently, flag the limitation and require an explicit supported basis or disclosed estimate rather than silently changing the datasheet fields. The exact normalization/calibration algorithm remains architecture/implementation work.

Fixed-lens profiles do not offer an arbitrary optical focal-length slider. Varifocal instances constrain the selected focal length to supported limits and recalculate modeled FoV/coverage/DORI. Continuous intermediate settings require enough optical data for that calculation. If only wide/tele profiles are known, keep those profiles usable and identify additional input or an explicit approximation needed for an intermediate setting; do not silently interpolate degree values or present invented specifications as manufacturer data. Digital zoom, special projection and unsupported modes must not be represented as verified optical performance.

An incomplete template can retain known details without earning a complete DORI result. Missing/unsupported inputs remain visible, and generic defaults must not masquerade as verified model specifications. Different stream/capture modes can change resolution and framing; analysis uses the selected mode rather than automatically inheriting the maximum-resolution profile. Manufacturer-published DORI distances may be retained as labeled reference data, not substituted for recalculation under the actual placed-camera settings.

#### Reuse, history and current prototype limits

Allow creation, editing and duplication of reusable camera definitions and model-number selection during placement. Preserve template identity/version or a snapshot of the values on the placed instance, named revisions, exports/backups and relevant test context. Later template edits do not silently change placed cameras or fixed issued/closeout records. Applying updated values is explicit and follows current/proposed distinctions, change history and the existing affected-check review/retest rules. Existing project/revision permissions continue to apply; this clarification does not grant review links permission to edit templates.

The current prototype has two generic camera presets, model-text search, horizontal pixel width and freely adjustable focal length within generic limits. It derives HFOV from lens/sensor width and VFOV from aspect ratio; it has no reusable user-model library, pixel-height/mode profiles or fixed/varifocal constraints. Its normalization can reject manufacturer FoV values that disagree with its ideal lens/sensor calculation. These gaps require deliberate implementation; this document update does not claim they are already fixed.

The [implementation extract](sources/camera-model-template-extract.md) and [optical reference digest](sources/camera-template-reference.md) distinguish source facts from this product direction. They are limited input/geometry references, not a new standards edition, full manufacturer database or certification claim.

### Physical cameras, optical views and streams

FR-48 extends camera templates with distinct physical assets, optical views and configured streams, preserving coverage, capacity and history relationships.

#### Separate the physical camera, optical views and streams

Keep one physical asset for the housing/model, mount, cost, installation history and actual network/power requirements. Give each supported head/optical view its own stable child identity, resolution/mode, lens setting and direction/tilt. A compact body can share a mounting point as a disclosed approximation. A head can be adjusted only as its model permits; its condition/settings and test references remain identifiable. Do not create several billable camera bodies to simulate several lenses.

Keep configured streams distinct from views: bandwidth/storage uses streams actually transmitted/recorded and their settings, while ports/PoE use the hardware's actual interfaces and requirements. Four lenses do not imply four network connections; one dewarped image displayed in four panels does not automatically mean four additional recorded streams. Conversely, separately transported/recorded streams do contribute demand. Existing optional accessory/license allowances can represent explicit additional costs without assuming a universal licensing rule.

#### POC support levels

| Arrangement | Confirmed behavior |
| --- | --- |
| Several independent conventional heads | Model each supported rectilinear head with its own pixels, FoV, selected lens, bearing and tilt. Combine visible footprints and use the best eligible unobstructed view for DORI. Keep head identity inspectable. |
| Single-sensor fisheye | Place and document the physical camera, lens/output profile and mounting orientation. Show an explicitly illustrative 360-degree or directional footprint only when its mounting/extent and chosen range are known. DORI remains Not assessed until a supported projection/calibration model is available. |
| Stitched multisensor panorama | Preserve the source-head and stitched-output distinction. Where source heads have usable supported optical data, evaluate those as explicitly identified views; do not claim their results describe a differently stitched recording. Composite-output DORI remains Not assessed without a supported projection/sampling profile. |

Example: a four-head 4 × 5 MP camera has four 5 MP views, not 20 MP in each direction. A template presets the heads; the engineer can aim them as the hardware allows. Keep body cost and actual hardware demand separate from the configured head streams. Multiple heads sharing one housing are not multiple independent physical cameras.

#### Combined coverage and zone honesty

Use distinct analytic view IDs beneath the parent asset. Union the supported visible areas; at a location choose the best eligible single view without adding pixel densities. Distinguish overlapping views from overlapping physical camera bodies. Multiple views from the same raw capture are also not independent captured detail. Preserve the existing Current installation/Proposed design basis, condition exclusions, boundary, target height and DORI thresholds.

A 360-degree description states surrounding angular coverage, not unlimited range, uniform detail or freedom from wall/obstruction shadows. Illustrative fisheye/panorama footprints must be visually distinct from assessed geometry/DORI. They receive no automatic credit toward a required zone percentage. Keep the complete zone polygon as the denominator; do not remove unassessed regions to improve its score. Report supported-view coverage and unassessed contributions clearly. A target already met by assessed views can remain met; otherwise missing panoramic analysis cannot prove either a pass or that the actual site is blind. Use wording such as Not covered by assessed views with an unassessed-camera notice rather than an unconditional 100% blind claim.

#### What calibrated fisheye/panorama DORI would require

Model number, focal length and a 360-degree label are insufficient. A credible evaluated output needs known source resolution and active-image/crop data, lens/ray-to-pixel projection or calibration, selected raw/dewarped/stitched output and its effective sampling, mounting orientation, and target-plane geometry. Detail can vary by image location. Interpolating a larger output cannot be treated as newly captured optical detail, and dividing total megapixels equally into invented cones is not a supported shortcut.

Manufacturer DORI distances may be retained as conditional reference values, with their mounting/output assumptions. A small set of published distances does not itself define a full-floor DORI contour. Use independent-head support and fisheye/stitched inventory plus clearly illustrative coverage in the initial POC; detailed calibrated panoramic DORI is deferred follow-on scope. Keep the template/view representation capable of identifying a later supported profile without declaring such a solver implemented.

#### Existing implementation and lifecycle boundary

The current solver evaluates one rectilinear view per camera and deduplicates IDs. Reusing a parent ID for several heads would omit views; cloning whole camera devices would inflate equipment/demand. It also reports area uncovered when no eligible cameras exist, which must not be presented as proof of blindness when unsupported panoramic views are present. These are implementation gaps for the confirmed support, not fixes made during this planning discussion.

The extension must preserve parent/child identities and selected profiles through revisions, field evidence, exports and backup. Per-head changes affect relevant checks; shared hardware changes can affect multiple heads under the existing retest policy. Whole-device archive/replacement and endpoint changes follow FR-35/36/53; changed-floor restoration follows confirmed FR-54. Exports identify assessed views, unsupported outputs and illustrative footprints. No approvals become mandatory and no planning result becomes a field-test Pass.

The [official reference digest](sources/panoramic-camera-reference.md) distinguishes independent heads, stitched panoramas and fisheye/dewarped views using [Axis panoramic documentation](https://whitepapers.axis.com/en-us/panoramic-cameras). The [fisheye datasheet](https://www.axis.com/dam/public/permalink/263167/datasheet-axis-m4338-plve-panoramic-camera-en-US_263167.pdf#page=7) illustrates nonuniform pixel density and conditional DORI distances. The [scope extract](sources/panoramic-camera-scope-extract.md) records current implementation limits. These sources ground the distinctions; the support levels above are confirmed Site Studio product choices.

## Closets, ports and physical cable routes

### Equipment locations and explicit connections

Use named equipment locations and a manual port/connection schedule (FR-51). Logical assignments can cross floors without asserting that a physical route is drawn or installed.

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

Apply the existing conflict/dependency rules when a port is assigned or moved so two editors cannot silently claim the same physical connection. Retain the user's pending edit on conflict. Equipment/port changes must not quietly erase dependent assignments or earlier evidence; show affected connections for resolution, under confirmed FR-53; changed/deleted-floor restoration follows FR-54 and draft deletion follows FR-55.

Add a closet equipment list and port/connection schedule to the relevant design/closeout exports. Show stable device/port/cable references, current/proposed basis, recorded or pending status, power assumptions, reservations and unresolved warnings. Preserve these records through named revisions and backup. Group/port edits do not imply that actual field work or a test occurred.

Example: IDF-2 contains Cabinet CAB-01 and Switch SW-02. Port 05 is planned for Camera CAM-12 with a cable reference where available; port 06 is reserved for a future device with its demand still unknown; SFP-1 is an explicitly recorded uplink to another switch. A door reader can instead reference a controller terminal, with only the controller's actual network interface assigned to an Ethernet port.

This is manual design and installation documentation. Live discovery, switch configuration, automatic port assignment, full rack/patch graphs and universal hardware limits are deferred. The [closet/port reference digest](sources/closet-port-reference.md) records official examples of [model-specific port capabilities](https://help.axis.com/en-us/axis-t8524-poe%2B-network-switch), [separate power values/budgets](https://help.axis.com/en-us/axis-s2216-mk-ii) and [controller connector types](https://help.axis.com/en-us/axis-a1601). They inform the confirmed distinctions without imposing a universal wiring rule or capacity guarantee.

### Inter-floor cable runs and length allowances

Keep one identified cable run across its physical route, with manually drawn floor segments, named risers and explicit lengths (FR-9/17/33/42/52). The [focused extraction](sources/confirmed-interfloor-routing-extract.md) distinguishes this model from the same-floor prototype.

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

Flag missing segments/landings, unknown scale/lengths, endpoint/assignment mismatches and known type/length-limit violations. Compare a specified limit only against a matching stated basis (for example a fixed run versus a complete channel); do not invent one length limit for every cable family. Keep unresolved values visible in schedules rather than interpreting them as zero. Device/archive/replacement endpoint behavior follows the confirmed FR-53 model; changed-floor restoration follows FR-54 and draft deletion follows FR-55.

Show per-floor continuation labels and a property-wide schedule with run ID, endpoints/ports, floors/riser, horizontal/vertical/drop breakdown, fixed loops, percentage/base, suggested supply quantity, selected purchasing quantity and measured length where recorded. Aggregate each run once by cable type and work scope even when it appears on several plan sheets. Keep uncertainty and selected/partial-floor context visible in the confirmed export packages.

The [inter-floor cable reference digest](sources/interfloor-cable-reference.md) records [editable cross-floor connections](https://docs.cctvdesigntool.com/quick-start/creating-connections.html), [individual/grouped schedules](https://docs.cctvdesigntool.com/ui-guide/connection-manager.html), and the [distinction between fixed cabling and patch leads](https://www.flukenetworks.com/blog/cabling-chronicles/channel-permanent-link-patch-cords-mptl-e2e-oh-my). The manual segmentation and allowance formula above are confirmed Site Studio product choices, not source-prescribed engineering rules.

### Engineering scope and references

Defer a comprehensive vendor catalog, automatic equipment discovery, live device configuration, access credential administration, full rack/patch-panel engineering, automatic 3D/path routing, voltage-drop/conduit-fill calculations and automatic code/compliance verification. Required manufacturer/project criteria can be captured in notes/checklists without claiming those calculations are implemented. The catalog and manual routing remain useful with incomplete existing-site information, with gaps disclosed.

The [equipment/cable reference digest](sources/equipment-cable-reference.md) records official examples of [generic device placement](https://docs.cctvdesigntool.com/quick-start/adding-devices.html), [doors linked to individual components](https://help.axis.com/en-us/axis-camera-station-secure-entry), [per-port switch configuration](https://help.axis.com/en-us/axis-network-switch-configuration-guide) and [height-aware connection estimates](https://docs.cctvdesigntool.com/ui-guide/device-sidebar.html). These support the direction, not the exact Site Studio scope or a universal wiring standard.

## Site annotations

Use a small plan-markup layer for site and installation intent, reusing zones and survey evidence (FR-50 and linked evidence/export/shared-edit requirements).

### Annotation tools

| Tool | Intended use |
| --- | --- |
| Named lines/polylines | Fence runs, perimeter references and other site boundaries, with a label and basic line style. These describe the drawing; they do not automatically become physical barriers or cable runs. |
| Entrance markers and direction arrows | Identify pedestrian, vehicle or service entrances and intended direction. Optionally reference an existing door/gate record for lookup without creating another device or moving its physical record. |
| Named areas using existing zones | Label parking, loading, restricted or other site areas with the existing zone polygons. Keep a DORI requirement optional; an area without a target does not acquire one merely because it is named. Avoid a second competing coverage-zone system. |
| Text/callouts and simple dimensions | Short installation labels, optional leader lines and two-point distance annotations. Use the existing survey note/photo records for detailed observations and evidence. |

Attach each mark to its selected plan/floor, including an outdoor site plan. Retain a stable annotation ID, name/type, position/points and note/reference. Support select/move, point/text edits, simple colour/line style, locking, deletion and an annotation visibility layer. Keep labels readable without colour alone. Existing save/conflict/undo and revision rules extend to these editable marks; no new collaboration mode is needed.

### Measurements and evidence

A calculated dimension uses a known map/plan scale, shows its units and is labeled as a plan-derived estimate. If the scale is unavailable or unverified, identify that limitation rather than inventing a precise physical length. A technician’s field measurement remains a distinct recorded observation with its note/source; it does not silently become the calculated value. Do not equate a straight-line dimension with a routed cable or its supply quantity.

Reuse device/floor survey notes and photos instead of creating a second attachment store. A callout or entrance mark can reference an existing note/device/opening; deleting the mark does not delete the underlying record, issue or evidence. Stable references and earlier fixed revisions remain preserved. Device/cable archive/restore dependencies follow FR-53; changed-floor restoration follows FR-54 and draft deletion follows FR-55.

### Keep drawing intent distinct from calculations

A fence/perimeter line is descriptive markup. Use the existing wall/obstruction tool, with supported height/type inputs, when an object should block modeled camera visibility. Likewise, use existing security zones and their explicit settings for DORI targets, and the cable tool for actual route records. No annotation automatically changes an analysis boundary, coverage percentage, equipment quantity, cable cost or power demand. Hiding a mark is a presentation choice, not removal of the linked object or a change to analysis.

Direction arrows describe intended movement or a reference; they do not calculate routes or certify an evacuation/access-control sequence. The POC does not add a specialist symbol catalogue or CAD dimensioning/constraint system through this confirmed annotation scope. Existing issue and field-change workflows remain the place to record actual defects or physical changes that need action/retesting.

### Exports and an example

Include annotations by default in the selected floor-plan sheets, using their labels, styles and a concise legend. Allow optional annotation visibility choices with omitted content identified under the confirmed export-manifest rules. Retain relevant property-wide outstanding issues even if their callout or floor is hidden. Preserve annotation geometry/references in editable backups and named revisions; the annotations do not become equipment schedule rows.

Example: draw a fence line labeled North perimeter, place a Vehicle entrance marker linked to Gate G-01, label the loading area using an existing zone, and add a callout referencing the survey photo of a proposed mounting surface. A simple dimension can show the estimated span; actual camera occlusion and cable length still use their respective tools.

The [official reference digest](sources/site-annotation-reference.md) records common [text/measurement drawing tools](https://docs.cctvdesigntool.com/quick-start/) and [separate visibility layers](https://docs.cctvdesigntool.com/ui-guide/layers.html). These are limited precedents; the Site Studio tools, reuse of zones/evidence and behavior above are confirmed product choices.

## Commissioning, evidence and targeted retesting

### Checklist model and phase progress

FR-29–31/43 define common/type-specific editable starters, project-defined expectations, observed outcomes, independent phase progress and scoped site checks. Final wording and site/manufacturer-specific values belong to implementation/domain setup. Photos and approvals remain optional by default.

#### Template structure and project setup

Use a short common checklist plus device-type sections grouped into Installation, Configuration and Testing. Use the same camera starter for dome/bullet variants; cover the existing reader, door contact, motion detector, intercom, switch, cabinet and light types, with a generic fallback. Default the applicable core identity/location, installation, key configuration and basic functional checks to required for new/changed in-scope equipment. Enable feature-specific or extended checks only where relevant to the project. Projects can add/remove or mark checks required/optional and adjust applicability; later edits must preserve attempts and unresolved issues. The additional doors/gates/controllers and related equipment are now confirmed separately in FR-7/49. Use the common and generic project-defined starter where a dedicated type starter is not defined; a related-system observation can be recorded against the device or project-level check. An association does not pass the linked component or validate the whole opening sequence.

During planning, select the assets/work in scope, apply starter templates, and fill project-specific expectations. A check contains a plain-language task, method/conditions, expected result or value/tolerance where applicable, required/optional status, applicability, and evidence requirement. A placeholder expectation such as “per project” needs a value/reference before that check can be recorded as passing; show Needs definition as a readiness flag, not a fifth test outcome. Manufacturer/site procedures and any applicable requirements provide device-specific acceptance values; no universal height, frame rate, illuminance, voltage or alarm delay is invented.

Common installation checks: asset identity/label and actual location agree with the installation record; mounting/enclosure condition meets the selected installation criteria; known cable labels/endpoints and intended power connection are recorded. Unknown legacy serial/model/install-date values remain unknown unless that information is explicitly required for the scoped work. Common configuration checks: intended device/system name and nonsecret settings/associations match the project; applicable recording, event or operating parameters are recorded. Do not store live passwords or access codes. Common testing checks: perform the relevant function and verify its result at the intended receiving system/location.

#### Starter functional checks

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

#### Result and evidence rules

Retain Pass, Fail, Not tested and Not applicable. Pass means the technician records an observed result meeting the configured expectation and supplies required fields/evidence. For a simple binary check, the explicit observation/outcome is sufficient; numeric or condition-specific checks need the requested measured/observed values, units and conditions. Unknown or missing criteria, an unperformed test, a missing required measurement, or a modeled DORI/PoE result cannot supply a field-test Pass. A completed test whose observed result does not meet its defined expected result is Fail, with a brief explanation. Not applicable requires a reason tied to the feature or scoped work; it must not be used as an excuse for a failed or unavailable test.

Photos remain optional unless the project requires them. Capture actor/time and preserve the checklist wording, expected result, applicable device/design context and evidence with each attempt. Retests/corrections add records without erasing prior failures. Changing a criterion or making a failed check optional cannot silently rewrite old results or resolve the failure; use the targeted-retest and property-issue disposition rules.

#### Progress, completion and existing buildings

Track Installation, Configuration and Testing separately. For each phase, show counts of required applicable checks passed, failed and not tested, with Not applicable listed separately. A phase is complete only when its required applicable checks and evidence are satisfied for the current condition, with no required retest or unresolved failure remaining in that phase. A phase with no applicable checks displays No checks in scope rather than 100% passed. Optional unperformed checks do not block completion, but any recorded failure remains visible and needs resolution or the existing explicit outstanding-items closeout path. Work on different devices/phases can continue independently; no new mandatory approval gate is introduced.

New or changed equipment receives relevant checks. Retained untouched devices receive only the explicitly scoped assessment/tests; inventory or old records never become a current pass automatically. Known defects remain visible. Documented deferred/out-of-scope defects remain outstanding at closeout (FR-32/46). Missing approvals remain separately bypassable.

#### Site-level checks and example

Add a small editable project/floor checklist for applicable end-to-end functions: named devices/events appear at the intended receiving systems, selected camera recordings can be retrieved, IDs/timestamps/location records align, and the final drawings and evidence reflect recorded installation. Link checks to affected devices and record exactly which endpoints/conditions were exercised. Do not infer every device passed from a sample. Longer-duration, recovery, integration or night-condition checks are included only when scoped; setting a retention value is distinct from demonstrating the actual available history.

Example camera check: “Retrieve and play the recorded test segment for CAM-12 in the specified viewing system; confirm the camera identity, picture and timestamp against the test.” A successful observed playback can Pass; a missing recording is Fail; an unperformed check remains Not tested. Save the actual result, actor/time and any project-required evidence. The POC records manual observations rather than executing hardware tests.

This action/expected-result/log structure is informed by [UFGS 28 08 10 sections 3.1.3, 3.1.5 and 3.3.5](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf). Its contractual approval requirements and test values are not adopted. The starter categories, progress rules and applicability choices above are confirmed Site Studio behavior.

### Targeted review and retesting

Use a change-to-check rule table that flags affected devices/checks and records why review or retesting is needed (FR-28/31/32/44). Work scope and issue disposition follow the property/work-scope model.

#### Distinguish intended work, recorded corrections and actual changes

A proposed design edit recomputes its planning analysis and updates intended work/checks; it does not claim the installation changed or invalidate an unchanged field record. An actual recorded installation/configuration/condition change flags checks affected by that new condition. A record-only correction (for example correcting an old drawing to match what was already installed) retains its reason/source and needs review of relevant documentation/evidence, without automatically treating it as physical work. Existing meaningful-change before/after, actor/time and reason records supply the context.

#### Default trigger rules

| Change | Default affected review/retest scope |
| --- | --- |
| Formatting, cost allowance, or a note unrelated to function | Update documentation/estimate history; no automatic functional retest. A changed real device/system identity is not merely cosmetic. |
| Camera physically moved/re-aimed, height/lens/focus changed | Recheck affected placement/mounting and actual image/framing/focus/scene checkpoints. Include connectivity/recording checks when associated cable or stream settings changed. |
| Recording, network, controller/VMS association, sensor or intercom behavior settings changed | Recheck the affected configured values, connectivity and corresponding observed function/event/playback at the receiving system. Do not reset unrelated installation checks. |
| Physical cable, termination, port or power connection changed | Recheck appropriate connection/link/power and affected endpoint function against project criteria. A corrected route drawing alone follows the record-correction rule. |
| Shared switch/power/integration change | Flag checks for the changed equipment and the connected or associated devices/functions known to be affected. Display missing/uncertain relationships for manual scope review instead of assuming no impact. |
| Device repaired, physically replaced or returned to service | Run relevant installation, configuration and functional checks for the changed condition. A physical replacement uses its new linked ID; a restored device retains its ID but does not automatically inherit old passes. A mistaken archival corrected without physical work follows the record-correction review path. |
| Real wall/obstruction/scene changed, zone target changed, or required criterion changed | Recompute affected analysis and review which scene checks or acceptance conditions are no longer covered by existing evidence. Flag those for field retest where the physical condition/expectation changed; an analytical edit alone is not a field-test outcome. |

A core rule table and manual selection of additional affected checks are sufficient for the POC. Use recorded connections/associations; do not claim complete impact discovery from the current partial topology. Reopening a project, changing a price or hiding a display layer does not itself require every device to be tested again. Use the work-scope model for unknown/out-of-scope issue disposition.

#### History, applicability and follow-up

Keep original attempts and outcomes unchanged. Show a dated earlier Pass as historical evidence with a separate Needs review or Retest required follow-up flag when appropriate; these flags are not new test outcomes. A required check for the changed condition can show Not tested until a new attempt is performed. Creating a pending requirement must not fabricate a performed test or change the old Pass to Fail.

Each flag identifies the triggering change, affected device/check and reason. Let an editor add affected checks or document why a suggested check is genuinely unaffected—for example, a record-only correction supported by the original observation. Keep that disposition with actor/time. Such a reason is not a waiver of a still-applicable required check, an unresolved failure, or a prerequisite to recording actual field conditions. Failure and missing evidence must not be relabeled Not applicable merely to clear a flag. Deferral under the work-scope model keeps the issue open.

A new attempt records the device/check context and conditions actually tested. Clear a required retest only when its current requirements are satisfied, including required evidence, and the relevant condition has not changed again. If a later concurrent change occurs, keep the attempt but retain the follow-up for the newer context. Undo or restoration must not silently restore a passing current status. Unaffected checks retain their evidence; a change does not cause a blanket property-wide reset.

#### Closeout and review

Required pending retests and unresolved failures remain in device/floor/project summaries and closeout exports, using the property closeout policy. Approval bypass does not satisfy a retest, and actual field changes require no new approval gate.

Example: CAM-12 passed a recorded scene check, then its actual aim changed. Keep the dated Pass and its original context, flag the relevant scene checks as Retest required, and recompute planned/recorded coverage as appropriate. The technician records a new attempt under the changed aim. A cost-only edit to the same camera does not create another retest.

The scope-specific failure/correction/retest record pattern is consistent with [UFGS 28 08 10 sections 3.2, 3.3.1 and 3.3.5](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf). This is product-design guidance, not adoption of that specification's government approval gates, universal retest matrix or certification obligations. The trigger rules and follow-up behavior above are confirmed Site Studio product choices.

## Archive, restoration and cleanup

### Choose draft deletion, cancellation or record correction

Provide quick Delete draft for accidental proposed placements while preserving consequential records through cancellation, correction or actual-removal archive (FR-55). The [focused extraction](sources/confirmed-draft-deletion-extract.md) records eligibility, dependencies, evidence and recovery boundaries.

#### Choose the action from the record’s history

| Record context | Confirmed POC action |
| --- | --- |
| Accidental proposed placement, never installed or surveyed as an existing asset, not included in an issued/approved design, with no actual installation/configuration/test evidence | Delete draft removes it from the working design and applicable proposed schedules, coverage, capacity and estimates; offer immediate Undo. Retain its stable ID and deletion/change history for guarded recovery. An untouched starter checklist is not field evidence. |
| Previously issued/approved planned device that will not be installed | Cancel the planned item in the current working revision with a short reason. Preserve its issued representation, comments and decisions, and show the scope change in comparison/closeout. Cancellation is not actual removal, a failed test or an approval of the changed design. |
| Existing, installed, commissioned or field-evidenced equipment | Do not offer quick draft deletion. Use the existing actual-removal/archive workflow for real removal. For a duplicate or erroneous record, make a history-preserving record correction with a reason and reference to the retained record when applicable; do not fabricate a physical removal. |

Eligibility follows the record’s origin and history, not merely an unchecked Installed box, visibility, a Draft project label or the absence of a price/serial number. A saved draft revision alone does not prevent editing the current design; its captured content remains unchanged. If eligibility is ambiguous, require review/correction rather than guessing that the asset never existed. Planning notes may be retained with their original record/location context; they do not become installation evidence merely because a draft exists.

#### Keep simple deletion quick and dependent changes explicit

For an isolated eligible draft, perform Delete draft with a visible Undo action without an obligatory confirmation dialog or reason. Record actor/time under the existing shared-edit history. If there are connections, linked opening components, notes/photos, comments, reservations or other dependencies, show what will be affected before committing. Never silently delete another physical record, shared controller/switch, retained cable, riser, issue or evidence.

Keep affected existing/shared cable records and historical endpoint references, showing a deliberate unresolved/unassigned proposed endpoint where necessary. Offer removal of a dedicated disposable draft cable only when explicitly selected and it independently satisfies draft eligibility; do not cascade-delete routes by default. Release only the deleted proposal’s identifiable planned reservation, after checking that no current connection or other reservation depends on it. Current port occupancy and physical connections remain governed by FR-53. Preserve linked notes/photos/comments and their original context; show where they remain accessible instead of orphaning them or relabeling them as observations elsewhere. Do not treat a drawing correction or draft deletion as repair/resolution of an outstanding site issue.

A cancelled never-installed proposal leaves the current proposed equipment/capacity/supply totals, but its cancellation and change remain in schedules/history as appropriate. Keep any explicitly recorded work, committed cost or outstanding disposition visible; cancellation does not erase them or assert a refund. Changing a proposed placement does not remove a surveyed existing asset or its current demand.

#### Guard undo and retain snapshots

Apply the existing own-session undo, saved-version/dependency checks and duplicate-safe retry policy. Undo restores the same draft identity only if its floor/placement and dependent records remain valid; conflicts require review, including placement on a changed floor, a reused port or another editor’s changes. Do not recreate deleted floors, steal reassigned ports or erase later work. Undoing a draft deletion is a design edit, not evidence of a physical return to service.

Keep named revisions, issued designs, reviews, closeouts and associated evidence unchanged. Deletion affects current working content and records a history event; it is not permanent erasure of the property record. Do not add a separate recycle-bin UI or arbitrary retention duration for this POC. Durable recovery follows existing retained revisions/history/backups; immediate Undo remains limited to supported own-session edits, not a promise of indefinite cross-session undo. FR-60 container deletion and FR-59 bulk cleanup preserve this history policy.

Example: an extra accidentally placed CAM-099 can be deleted with Undo. If it was already issued to the installer, cancel the planned item in the working revision and preserve the issued design. If it represents a real surveyed camera, use actual removal/archive or an explained record correction. The [reference digest](sources/draft-deletion-reference.md) distinguishes ordinary design editing from retained asset history; the eligibility and safeguards above are confirmed Site Studio product choices.

### Guarded bulk cleanup

Provide selection by explicit rows or a clearly identified import batch/filter, with the selected scope/count and affected records visible before confirmation. Allow bulk cleanup for eligible disposable drafts under FR-55 and confirmed erroneous, unused import-created records under FR-59. Imported existing equipment is not automatically a deletable draft: source claims, survey verification, issued references, field work, evidence and linked dependencies must be checked. Removal of a mistaken import record is a recorded data correction, not documentation that physical equipment was removed.

Preview eligible and blocked records with reasons. Preserve matched pre-existing devices, site-verified/issued/installed/tested records and records with later edits or protected dependencies; route them through the existing cancellation/correction/actual-removal archive policy as appropriate. Do not cascade-delete shared equipment, retained routes/risers, notes/photos, issues or history, and do not free occupied ports. An import batch may contain both newly created and matched/updated records; bulk cleanup must not erase the latter merely because they appear in that batch. Apply the existing correction/history rules to mistaken-record cleanup; it does not change physical installation status or resolve an outstanding site issue.

Recheck eligibility and versions at execution; if the preview is stale, surface the changed selection rather than silently deleting newly protected records. Keep a per-record outcome and batch history. Apply existing guarded own-session undo, retaining original IDs and respecting later floor/port/record changes. Repeating the request must not duplicate changes. Scope-wide filters must not silently grow the selected set after confirmation. These are confirmed user-visible safeguards; no bulk hard-purge or mass archive is included. Importer implementation and detailed control layout remain downstream work.

### Unused floor and building deletion

Only unused draft floors/buildings with no dependent records or historical references are deletable (FR-60). The [focused extraction](sources/confirmed-container-deletion-extract.md) distinguishes this container rule from device/import cleanup.

An empty visible floor is not sufficient: check current content, archived device/location references, cross-floor routes/risers, survey evidence and retained revisions, issued designs and closeouts. A building's child floors are dependencies too; deleting a building does not cascade through them. Explain the records preventing deletion and preserve their accessible context. FR-55/59 may resolve eligible item-level mistakes, but deleting current items does not erase their historical references or authorize deleting a formerly used floor. Ordinary creation/deletion audit entries for an otherwise unused container are retained for recovery; they are not themselves evidence of operational use.

Check current versions and dependent changes together so a concurrent placement, evidence addition or new historical reference blocks a stale deletion. Retain action history and use existing own-session guarded Undo with the same identity, without overwriting later changes. FR-54 still handles older missing or unresolved floors during device restoration; this is not permission to delete a referenced floor now. No full floor/building retirement, automatic relocation or history purging is introduced.

### Device removal, cable reuse and connection history

Keep cable runs independent of device lifecycle, preserving historical associations while explicitly reconciling current connections (FR-35/36/53). The [focused extraction](sources/confirmed-cable-lifecycle-extract.md) distinguishes this model from prototype deletion. Floor-aware restoration and draft deletion follow FR-54/55.

#### Removing a device

Preview all known affected cable ends, interfaces, port/terminal assignments and dependents when actual removal is recorded. End the removed device’s active association and retain its last connection as history. Keep the cable record, stable run ID, geometry, lengths, notes and test history by default. Mark its unresolved current endpoint/disposition Needs connection review; do not automatically remove or archive the cable, assert that it was disconnected at both ends, or require an invented disposition before the actual device removal can be saved.

For each affected connection, let an editor explicitly record retained cable with a disconnected/unassigned end, reuse/reassignment to another device, actual cable removal/retirement, or an unresolved disposition needing follow-up. Record actor/time and the relevant change context under the existing field-change policy. Archive a cable only when its actual removal/retirement is documented; retain its history. A planned Remove/Replace action changes proposed intent, not current cable state or occupancy.

#### Reusing cable for a replacement

Give a different physical device a new linked asset ID. Select which retained cable, termination and port assignments to reuse; validate current/proposed context, known compatibility and conflicting claims. A retained physical cable keeps its run ID with a dated endpoint change. A different replacement cable gets a new linked run ID. Do not duplicate a cable purchase merely because its endpoint changed, or transfer the old device’s identity, installation evidence or passing results to the new device.

Keep physical termination references separate from logical network associations: a cable can still terminate at an unchanged outlet/patch panel even when the attached device or patch lead changes. No full patching graph is implied. A planned reuse remains planned; it does not assert physical reconnection or a successful field test.

#### Restoring the same physical device

Restore the same asset ID and history, showing earlier connections as historical choices rather than live assignments. Reconnect explicitly after checking the selected location, active cable/termination, port availability, compatible references and any active replacement. Do not reclaim a reassigned port, overwrite a replacement, resurrect a removed cable or silently restore an old relationship. Unresolved connections remain visible and unassigned for follow-up. The changed/deleted-floor destination follows confirmed FR-54; draft-deletion behavior follows FR-55.

#### Port occupancy, evidence and dependent devices

Device demand and port occupancy are distinct. Exclude the actually removed device’s demand under FR-35, but do not declare its former port free: a retained cable can remain plugged in, or the port can be reserved for a replacement. Preserve known physical occupancy/reservation or mark availability unresolved until explicitly released or reassigned. Do not keep a historical device association as a current assignment or invent zero remaining load when an unknown active endpoint remains. Keep unknown or unassigned demand visible under FR-19/51.

Removing shared equipment such as a switch or controller flags its known affected connections/dependencies for reconciliation; it does not archive downstream devices or erase their demand and evidence. A connection record alone must not claim that every dependent function failed where alternate paths or incomplete information remain. Apply existing dependency checks atomically, including concurrent reuse/release/restore attempts.

Preserve previous test outcomes and fixed issued/closeout packages. Changed or restored connections trigger appropriate review/retest under FR-44; an old Pass does not establish current fitness. Show affected connection status in plans and schedules, preserve it in revisions/backups, and surface unresolved installation issues through the established scope and closeout rules. This introduces no mandatory approval gate or automatic pass/fail.

Example: archive CAM-01, retain CBL-014 and mark its endpoint for review while switch port 05 remains occupied/reserved as recorded. Explicitly reuse CBL-014 for replacement CAM-02. Restoring CAM-01 later keeps its history but cannot take CAM-02’s connection. The [reference digest](sources/connection-lifecycle-reference.md) identifies limited official asset-history/archive precedents; these cable/port semantics are confirmed Site Studio product choices, not verified competitor behavior.

### Restore a device onto a current floor

Use a guided restore that preserves the archived device’s identity/history and requires confirmation of its destination before active restoration (FR-54, with FR-53 cable safeguards). Restoration is an individual-record operation, not a project rollback. The [focused extraction](sources/confirmed-floor-restoration-extract.md) records its scope and implementation boundaries.

#### Find the floor by identity and confirm placement

| Original floor context | Confirmed POC behavior |
| --- | --- |
| Same floor, unchanged drawing/location basis | Show its current name and preview the previous device position for confirmation. Do not silently complete restoration or reconnect it. |
| Renamed floor only | Match its stable floor ID, not its display name. Suggest the former position when the geometry basis is still applicable, preserving the historical name in older context. |
| Replaced drawing, changed scale/alignment, or materially changed layout | Open the current floor plan and require the editor to review/reposition the device. Old coordinates are historical reference, not proof of the current location. If the prior mapping is uncertain, require an explicit new placement rather than fabricate a transformed pin. |
| Deleted floor or unresolved original floor reference | Require the editor to choose a current floor in the same property, or create a floor through the normal workflow and then place the device. A newly created floor has its own identity even if its name matches the old one. Do not automatically recreate the old floor or guess a substitute by name. |

For the POC, require a valid destination floor and an explicitly confirmed position before completing active restoration. If the editor is not ready to choose, cancel/leave the device archived with its history intact; a floor independently created through the normal workflow remains a separate action. FR-57 Awaiting placement is for imported inventory, not archived-device restoration. Missing verified scale or drawing data remains visible under existing analysis rules—selecting a floor/point does not establish its physical accuracy or require inventing a measurement.

#### Preserve the old record and review affected references

Retain the original floor identity/label, prior location and captured plan/revision context with dated installation, notes/photos and tests. Earlier evidence remains linked to the conditions observed; it is not relabeled as evidence at the new location. Show an old plan only if it was retained. Missing historical drawing/transform information stays explicitly unavailable. Record the restored device’s selected floor/location, actor/time and meaningful change context without rewriting fixed revisions or closeouts.

Following FR-53, prior cable/port choices remain historical until explicitly revalidated. A different floor or location may invalidate a route endpoint/drop or riser reference; flag affected parts for review without deleting the retained run or moving unrelated segments. Do not draw an invented inter-floor line, infer new vertical lengths, reconnect automatically or claim installation/test completion. Existing work-scope costing still applies; restoring the same physical asset does not create a replacement purchase.

Recalculate supported current/proposed analysis only using the selected location and known inputs, identifying unresolved route/scale/coverage assumptions. Apply existing change/retest rules: actual return to service or relocation needs appropriate current checks, while a supported drawing-only correction does not by itself establish a physical move. Historical passing results remain historical.

Apply normal shared-edit safeguards if the destination floor, drawing basis, device or dependencies change during restoration. Preserve the pending choices and ask the editor to review the new saved context instead of committing onto a deleted or stale plan. Reopen an archived project under its existing lifecycle policy before editing it; restoration does not bypass project scope or history.

Example: CAM-01’s original Floor 2 drawing has been replaced after remodeling. Restore its original ID, open the current Floor 2 plan and confirm its new position. Keep the old installation photo and location in history; review the affected CBL-014 endpoint and required checks before claiming the current connection or test status. FR-60 permits only unused-draft container deletion; already-missing historical floor references still use this restoration rule. The [floor-restoration reference digest](sources/floor-restoration-reference.md) records limited official floor-editing and inactive-asset-history precedents; the restore flow above is a confirmed Site Studio product choice, not verified competitor behavior.

## Design and closeout packages

Use Design and Closeout presets in one export flow, with readable PDFs and separate editable backup/materials-estimate CSV downloads (FR-33/34, NFR-6).

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

Generate from a consistent saved named revision or fixed closeout, resolving the initiating editor's relevant pending/conflicting edits first. A draft preview can use an identified saved snapshot without issuing, approving or closing the project. Preserve the exact issued-design and closeout PDFs with the property, plus a manifest identifying source snapshot, work scope, package edition, export time, included sections/floors and known omissions. Keep these files available after project archival and in backup/recovery. An archived project may append a deliberately generated package edition and manifest from a fixed source; its business records, source revisions and earlier PDF bytes remain frozen. Apply the accepted file/edition budgets and multi-volume rules.

Redownloading a historical package returns the retained file. Regeneration or later approval information creates a new dated package edition tied to the same fixed source and a stated decision-history cutoff; it does not overwrite the earlier PDF or claim later edits were part of it. Later corrections to installation records use the normal new-revision/closeout history. Review links still refer to their fixed records, and a static PDF does not update when decisions change.

Offer the complete editable project backup separately from the PDF and optional materials/estimate CSV. Preserve captured drawings, attachments, revisions, issued/closeout history, issue records and removed-device history with stable IDs; keep link credentials and live passwords out. The prototype editable format is JSON; asset-container packaging belongs to architecture. Retain new originals under the data-retention policy; label older originals unavailable when they were never retained. A generation failure remains visible and retryable; do not label a partial file or incomplete asset bundle successfully complete. Export itself never approves or closes work and does not require an approval.

### Complete editions and numbered volumes

Use the confirmed package presets, defaults, omission labels and fixed edition semantics. When needed, split a complete edition by building or logical section into numbered PDF volumes with a manifest identifying the same property, work scope, source revision, edition, included floors/sections, volume list and completeness. Offer the edition as one downloadable package while retaining the exact constituent PDF files and manifest for later download and backup. A single PDF remains appropriate when it fits. All volumes must use the same fixed saved source; do not mix revisions while a job runs.

At two photos per page, 1200 photos alone require 600 pages before plans/tables. A 250-page volume limit therefore cannot be treated as a complete-property page limit. Choose volume boundaries from actual readable output; stop/report failure if the full edition cannot fit the aggregate budget, and offer only explicitly labeled scope/optional-content changes. Required evidence omitted from a summary must remain visibly omitted, as already agreed. No apparently Complete package may silently exclude records to fit a bound.

Illustrative acceptance payload: 30 source PDFs averaging 20 MiB = 600 MiB; 30 plan previews at 4 MiB = 120 MiB; 1200 original photos averaging 2 MiB = 2400 MiB; 1200 thumbnails averaging 0.25 MiB = 300 MiB; four retained editions with four 100 MiB volumes each = 1600 MiB; and 300 MiB for records/history. Total 5320 MiB ≈ 5.20 GiB. Replacing the source PDFs with thirty 100 MiB files makes 7720 MiB ≈ 7.54 GiB, still under 8 GiB. These are sizing examples, not mandatory per-device photo counts or revision caps. Every edition/preview/readability assumption needs actual output validation; four 1 GiB editions plus all other maxima would not fit merely because each item is individually allowed.

### Package references

The closeout structure draws on the test logs, updated records, correction/retest and report organization in [UFGS 28 08 10 sections 3.3.4–3.4.3](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf#page=9). The [official CCTV Design Tool output guide](https://docs.cctvdesigntool.com/quick-start/generating-outputs.html) separates visual plans, reports and tabular outputs. These are limited precedents, not adoption of contractual approvals, certification requirements or additional competitor functionality. The [export reference digest](sources/export-package-reference.md) records the source boundaries. Package presets, defaults, pagination and exact-file retention above are confirmed Site Studio product choices.

## POC acceptance and operating targets

Accept the POC through a complete lifecycle exercise, focused failure/integrity checks and measured operating envelopes, using both a manageable functional fixture and the confirmed larger-site profile (NFR-4/SM-5/A-2). All FRs/NFRs remain in scope. These are test requirements, not measured support or permanent product ceilings; increasing configuration limits alone does not prove capacity. The [scale-input extract](sources/large-site-scale-extract.md), [test-scope confirmation](sources/confirmed-scale-test-extract.md) and [acceptance baseline extract](sources/poc-acceptance-baseline.md) preserve source and implementation boundaries.

### Fixtures and workload manifest

| Dimension | Confirmed scale scope / remaining fixture definition |
| --- | --- |
| Property and plans | One continuing property containing about 10 buildings and 2–3 floor/site plans per building, approximately 20–30 in total. Confirm exact plan count and areas in the test manifest; do not split one real property into artificial projects merely to satisfy a small fixture. |
| Equipment and cameras | About 600 total devices including 150 physical cameras; up to about 60 physical cameras on the busiest plan. Declare supported heads/views, unsupported panoramic outputs and transmitted/recorded streams separately from physical camera counts.  |
| Cabling, ports and geometry | Derive realistic routes, segments/risers, controller connections, switch/port inventory, floor areas, barriers/edges and zones from the larger fixture.  |
| Evidence and retained history | Include meaningful installation/test/photo evidence, revisions, later-work cycles and exact package editions at the larger scale. Set counts and combined byte budgets from a declared manifest; historical sample counts do not define the complete larger-site profile or retention caps. |
| Concurrent use | Usually one participant, sometimes two. Test two concurrent editors and editor/reviewer combinations with the agreed conflict, evidence and access checks.  |

Use a smaller functional fixture (for example about 50 assets) for frequent checks and independently calculated examples. Include the confirmed larger fixture in POC acceptance so success on a small project alone cannot stand in for the user’s representative site. Engineering defines the exact workload manifest against the accepted browser, fidelity, performance and recovery criteria.

Measure property-wide open/save/schedule/cost/capacity operations across all 600 records, active-plan interaction and analysis on the busiest plan, and whole-property deliverables/recovery across all plans and retained history. Selected-plan presentation must not silently drop property-wide demand, records or outstanding issues. Unsupported/unassessed camera profiles remain disclosed rather than credited as assessed coverage.

Disclose operation/resource limits before failure and provide useful warnings or safe rejection, preserving saved data and available pending input. Never truncate records, silently drop evidence, purge history or require arbitrary property splitting to fit a small test. Resource guards remain necessary and can change after validation; their implementation must not bake the earlier sample counts into the project model as permanent business limits. Rendering, analysis, file handling and recovery approaches belong to architecture and need evidence at the intended scale.

### Lifecycle exercise and failure cases

Use a fictional existing property with a modest core of about 50 physical assets, expanded to the larger fixture in [Fixtures and workload manifest](#fixtures-and-workload-manifest). Include surveyed unknowns, retained and proposed equipment, conventional and multi-head cameras, an explicitly unassessed panoramic view, linked door/gate components, shared control/network equipment, obstructions, DORI zones, inter-floor routes and photos. Exercise all agreed FR checks using this fixture or small targeted companion fixtures; a successful demonstration alone does not waive failed requirements.

1. Find the property, import/select a PDF page, align it over the map, name floors and capture an existing-site baseline. Exercise a supported live map/address/satellite path on the demo; provider failure must be explicit and preserve work. A configured OSM-based/non-Google mapping and imagery path suffices for the POC. An optional Google path is only described as verified if actually configured/tested.
2. Place/edit devices and model templates; inspect coverage/DORI/zone shortfalls, unassessed views and unknowns. Route across floors, assign ports and estimate scoped equipment/cable/accessory/labor and capacity without duplicate hardware, streams, runs or slack.
3. Issue a named design, share it for review and optionally bypass/self-approve. An installer updates the shared working record, records installation/configuration/tests/photos and a field change while the issued record stays fixed. Exercise both handoff and solo-user paths.
4. Record a failed test and retest, a not-installed item, a documented N/A, an unresolved property issue and both permitted closeout outcomes. Completion requires the agreed conditions; approval or bypass never turns failure into Pass. Produce complete Design and Closeout packages and verify regenerated editions preserve prior files.
5. Reopen later work, replace/archive equipment, explicitly reuse cables, restore onto a renamed/changed/missing-floor context and exercise draft deletion/Undo versus cancellation/correction. Preserve historical identities, evidence, outstanding issues, packages and appropriate new checks.

Also deliberately test simultaneous independent edits, conflicting same-item/port edits, duplicate retries, stale archive/floor/deletion actions, interrupted upload/save, revoked and out-of-scope links, failed/oversized import/export, and guarded undo. No silently lost acknowledged work, unauthorized scope access, corrupted history, fabricated test results or falsely complete exports is acceptable. All blocking workflow/integrity/access defects must be fixed; cosmetic issues may be documented with owner/disposition if they do not prevent a required task.

The accepted matrix covers browser/device tasks and focused usability. Performance/analysis fidelity and file/recovery targets are specified in the adjacent acceptance subsections. The [acceptance refinement extraction](sources/remaining-acceptance-refinement.md) distinguishes confirmed requirements from implementation evidence.

### Browser, device and usability matrix

| Environment | Required POC demonstration |
| --- | --- |
| Windows laptop, Chrome and Edge | Complete the supported desktop workflow: property/setup and spreadsheet intake, design/analysis/routes/estimates, issue/review, field-record updates, closeout, exports and editable backup/recovery. |
| Real iPhone and iPad, Safari | Complete field and permitted review tasks: locate the device, inspect its current plan/issued reference and checklist, verify/correct imported information, confirm placement for an unplaced record, record notes/results and capture/select photos, resolve or retain conflicts, confirm durable saved state after reload, and review/comment/record decisions within the link's permissions. |
| Real Android phone, Chrome | Complete the same field and permitted review tasks. |

Use named representative devices and the stable browser/OS builds selected for acceptance, recording versions, viewport/orientation, build and network conditions. This is the minimum tested matrix, not support for every hardware/version combination. Online operation is sufficient; phone/tablet acceptance does not require full desktop drafting panel density or all desktop design tasks. Include these workflows in the confirmed small functional and larger real-site fixtures; do not use a tiny mobile inventory as the sole evidence that lookup/field work succeeds on the representative property.

For the required tasks, verify keyboard navigation where applicable, visible focus without traps, labeled inputs/errors, readable forms at 200% zoom, usable touch controls, text/icon distinctions for outcomes/save/conflict states, and an alternative to essential drag-only actions. Check meaningful text/control/overlay contrast and preserve access to the task at the tested screen sizes. Keyboard-only operation alone does not prove a usable touch alternative. Record actual observations and test evidence; this focused matrix is not a full accessibility-conformance claim or a requirement to add an unrelated automated audit system.

Point selection or position controls can provide alternatives to essential dragging; keyboard access alone does not establish a touch alternative. Record measured text/control/graphic contrast, including plan overlays. The earlier 44 CSS px suggestion is UX guidance, not an additional accepted numeric threshold. The [W3C preliminary checks](https://www.w3.org/WAI/test-evaluate/preliminary/), [drag alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) guide these focused checks; see the [reference digest](sources/poc-acceptance-reference.md).

Every required task must be completable with the agreed integrity/access behavior. Blocking workflow, misleading status or inaccessible required controls must be corrected; nonblocking presentation issues can be recorded with an owner/disposition. Detailed fixtures and test mechanisms belong to engineering/UX. The [focused extraction](sources/confirmed-browser-usability-extract.md) records this matrix. The complete workload includes all 20–30 plans plus retained history/evidence; the 600-device acceptance scenario is not a permanent product cap.

### Performance and analysis accuracy

These accepted targets are not measured capability (NFR-4/SM-5, FR-13/15). The [confirmation extraction](sources/confirmed-performance-accuracy-extract.md) records their scope; the [performance/accuracy extraction](sources/performance-accuracy-refinement.md) records implementation limits and the boundary-classification concern.

#### Timing targets and completion boundaries

| Operation | Confirmed target | What completion means |
| --- | --- | --- |
| Selection, button or direct-edit feedback | Within 250 ms | The control/selection responds; this does not claim an analytical result is finished. |
| Find/filter equipment in the 600-device inventory | Within 1 second | Correct results are usable, including unplaced and relevant historical state as selected. |
| Ordinary single-item metadata save | Within 2 seconds of committing the edit | Durable shared acknowledgement; bulk import and attachment uploads are separate operations. |
| Show a saved update on the other connected client | Within 5 seconds of durable save | Correct shared state appears without replacing unfinished local input; conflicts remain visible. |
| First project open | Within 10 seconds | The selected saved plan/drawing and devices are usable, not just an empty canvas or skeleton. Coverage can remain explicitly Updating until its own result completes. |
| Switch to a saved plan in a warm project | Within 5 seconds | Required plan/drawing/device content is usable; record cache conditions. |
| Recalculate combined visibility/DORI and all targeted zones on the active busiest plan | Within 10 seconds after a committed camera/barrier/zone edit | All eligible declared views and all targeted zones use the current input version and required fidelity; partial or stale output is not complete. |

Apply ordinary UI/lookup/save tasks on their accepted desktop and field environments; the full combined-analysis benchmark is part of the desktop design workload. Field clients must identify pending/stale analysis rather than label old output current. Keep controls usable while analysis runs; a drag preview may be provisional and clearly labeled. A later edit invalidates an earlier calculation's claim to be current. Do not satisfy the target by omitting devices/zones, counting only visible layers or silently lowering fidelity.

Use the declared small and larger fixtures. Before benchmarking, record and lock the actual active optical-view/stream count, plan dimensions/boundary, barrier edges, zones/vertices and relevant evidence bytes; camera bodies are not interchangeable with views. Use representative hardware from NFR-3, recorded browser/build, and a repeatable online connection, with the recorded reference conditions for the accepted target; the existing proposed benchmark connection is at least 20 Mbps down/5 Mbps up and service round-trip latency no more than 100 ms. Engineering must confirm and record the representative test connection rather than imply these throughput figures were separately measured or guaranteed. Exact representative hardware/workload choices belong to the test manifest and must not be simplified solely to make the target pass.

For each repeated timed operation, use batches of 20 trials with meaningful workload variation and require at least 19 successes in each batch; retain all timings, outliers and errors. Additional batches must meet the same rule. Accuracy/integrity/access checks must pass every applicable trial; the timing percentile does not excuse data loss or a wrong result. Report cold versus warm loads and third-party geocoder/map latency separately. A blocked required task is not a pass because only application processing was fast. These POC goals require engineering and measurement; they are not production uptime commitments or a promise for arbitrary scenes with the same camera count.

#### Calculation accuracy and sampling

- Independently calculate supported, nonsingular rectilinear optical examples from the same known inputs. Target FoV dimensions and DORI threshold distances within 1% of the reference. Preserve the project's existing DORI conventions; this is not calibration of fisheye/panoramic output or a guarantee of real image quality.
- Validate full-polygon zone qualifying percentages within 2 percentage points of an independent sufficiently fine or analytic reference on declared fixtures. Exercise thin/small/concave zones, obstruction shadows, height transitions, overlap and target-boundary cases; a thin wall must not be bypassed by treating the visibility ray test as a coarse raster.
- Use effective sample spacing no coarser than 1 m for the assessed fixture, refining further where zone size or boundary detail needs it. A 1 m grid alone does not prove the accuracy tolerance. Missing samples or unresolved geometry cannot become a confident zero or successful target. Sampling area/spacing and exclusions remain disclosed; clean vector rendering is separate from numerical fidelity.
- The 2-percentage-point benchmark tolerance is not a certified live-zone error bound and does not guarantee correct threshold classification. For example, a true 89% result estimated as 90.5% meets that tolerance but crosses a 90% target. Where boundary uncertainty could change the target decision, refine or show an analysis-only Near target—refine analysis/uncertain result until sufficient reference or conservative evidence supports the decision. Do not create a confident Target met from display rounding, or relabel this analytical state as a field-test outcome. Full computed values determine ordinary threshold comparisons; unsupported views receive no invented credit.
- Independently verify equipment/port/hardware counts, physical-camera versus view/stream accounting, cost totals at the stated currency-rounding convention, cable components/slack applied once, and bandwidth/storage/PoE units and compatible bases. Use exact counts/arithmetic conventions rather than a blanket percentage allowance. Known unknowns remain unknown rather than zero. Union/overlap and best-single-view DORI behavior must match the confirmed functional rules.

If speed and fidelity cannot both be met on the agreed workload, improve the implementation or bring back an explicit target change. Do not silently coarsen analysis or redefine the fixture after results. The existing sampled solver/work budget is evidence of work needed, not evidence these targets have passed. Bulk import, media/PDF processing, report/backup generation and transfer times use the confirmed size/recovery policy below; superseded byte/page/recovery candidates are not additional requirements.

### File, evidence, backup and recovery limits

These initial POC boundaries require implementation and validation; they are not measured capacity or permanent building/device/history ceilings (FR-34, NFR-2/4/6). The [confirmation extraction](sources/confirmed-file-recovery-extract.md) records behavior, and the [sizing extract](sources/file-recovery-refinement.md) checks arithmetic and original-retention/multiple-volume treatment.

#### File and project budgets

| Item | Confirmed boundary |
| --- | --- |
| Source site-plan PDF | 100 MiB per file. |
| Source image or survey photo | 25 MiB per file. |
| CSV/.xlsx inventory | 10 MiB per file; demonstrate the confirmed 600-device import and re-import workflow. This is not a 600-row hard limit. |
| PDF export volume | 250 pages and 100 MiB final PDF bytes; split at whichever bound requires it while preserving legibility. |
| Complete design/closeout edition | 1 GiB across its PDF volumes and edition manifest. All included content must fit together. |
| Retained project content | 8 GiB including original/processed media, retained distinct older assets, records/history and exact package editions. |
| Complete portable backup | 10 GiB final container bytes, with an 8 GiB logical project-payload boundary and validated manifest. |

The figures use binary units (1 GiB=1024 MiB). Per-file maxima cannot all be independently filled beyond the aggregate project/edition budgets. Show usage and a clear warning before a new operation would exceed a limit; fail safely without losing the saved project. Do not silently truncate schedules/evidence, purge revisions, replace originals with lower-quality images or split one property into arbitrary projects. Resource limits can be revisited; evidence/history retention is not capped by a device count or revision age. Parser/decompressed-image/page complexity guards and temporary working space must be declared and validated by engineering rather than inferred from compressed file size alone.

Retain new uploaded original drawings and photos plus usable lightweight previews; this confirmed extension requires implementation beyond the prototype. PDF parsing/password handling remains local, and passwords are not stored with the retained source file. Reference one shared retained source PDF across selected sheets/revisions instead of creating needless original copies. An accepted attachment is not Saved until its required original, derived files and relationships are durable. Preview/export image processing can optimize display, but must not silently destroy the retained original. For older prototype records where only a processed image was retained, preserve what exists and label the original unavailable; do not fabricate it. Evidence and drawing detail must stay readable on the accepted devices and in exports.

#### File-job processing targets

Measure processing after the relevant bytes are available to the processing step, with transfers recorded separately. Confirmed targets: selected PDF-page preview within 30 seconds; photo preview/processing within 10 seconds; 600-row inventory preview within 30 seconds and confirmed import application within 30 seconds; complete retained PDF edition within 5 minutes; complete portable backup generation within 10 minutes; and portable backup validation/restore within 15 minutes once uploaded bytes are available. Generation completion includes required durable output/manifest checks, not merely a queued job. Apply the ordinary accepted UI feedback/freshness rules while work runs, with visible progress, failures and safe cancellation where supported. Test long jobs at least three times on the declared full-size/readable fixture and meet every stated bound; correctness/integrity remain mandatory.

Do not promise these elapsed times from file selection over an unspecified connection. Transfers have their own measured start/end and visible status. A 100 MiB upload at 5 Mbps takes at least about 2.8 minutes before overhead; 10 GiB takes about 4.77 hours. A failed upload must retain the saved project and must not mark the attachment or backup complete. Detailed storage/streaming/job mechanisms are architecture choices; the present browser-local prototype does not demonstrate these budgets.

#### Automatic backups and recovery

Create at least daily automatic complete recovery backups, retaining at least seven successful daily generations independently of the live project, plus a complete backup before migrations or destructive maintenance. Keep backup age, success/failure and the latest valid recovery point visible; schedule with enough margin to keep the latest successful backup no more than 24 hours old. Retention rotation removes backup generations, not revisions/devices/evidence from the continuing project. At maximum-size 10 GiB portable-equivalent containers, seven generations plus one maintenance copy could require 80 GiB of backup storage, separate from 8 GiB live payload and temporary workspace; shared/incremental storage may differ only if each retained generation remains fully recoverable.

Keep zero loss of acknowledged records/attachments for ordinary browser closure or service restart, as already confirmed in NFR-2. For catastrophic store loss, use a recovery point no older than 24 hours and restoration to a usable project within 60 minutes after recovery begins in the documented prepared recovery environment. The 60-minute exercise includes automated backup retrieval, validation and restoring records/assets/access configuration; it cannot depend on a multi-hour user upload over a 5 Mbps connection. Display the restored recovery-point timestamp and the potential loss window; do not fabricate records after that point or imply that its issued-design designation reflects later lost changes. Record environment/preparation assumptions and total elapsed time; this is a POC recovery target, not a production availability guarantee. If the latest valid backup is older or recovery misses the target, show that failure rather than claim compliance.

Demonstrate actual recovery into an isolated destination, including stable IDs/relationships, original/processed media, archived devices, revisions, unresolved issues, exact historical PDF volumes/manifests and the current issued-reference designation/history. Verify completeness/content integrity before a deliberate switch; incomplete/invalid restores must not overwrite a working project. Portable project backups exclude credentials; recovery must not reactivate revoked bearer links or claim old access grants are current. Re-establish authorized access under the existing demo model. A PDF report is not an editable backup, and a successful backup download is not proof of restoration. These product requirements are confirmed; their implementation and acceptance evidence remain outstanding.

## Proposed amendment 1.1 — reference-based additions

Added 2026-11-18. These notes support FR-63–65 and the small additions proposed in the PRD. They were confirmed by Kevin in a parallel session and have not been through the finalization review. The [amendment status](amendment-1.1-status.md) records what was ported and what was not; the [reference digest](sources/psp-reference-reading.md) holds the sources.

### What the references are, and their limits

| Source | Use | Limit |
| --- | --- | --- |
| ASIS PSP examination outline (public, updated 2022) | Topic-level map of what the requirements cover | A topic list with no requirements, criteria or test values |
| Patterson, *Implementing Physical Protection Systems*, 2nd edition | Test stages, the reliability test, warranty, repair logs, design-package contents and estimating | Only pages Kevin shared were read; findings are paraphrased and no book text is stored |
| Department of Energy *Physical Security Systems Assessment Guide* (December 2016) | Camera field tests and the maintenance chain | Assessment guidance for high-security nuclear sites, read in part, partly analog-era |

None is adopted as a standard and no compliance claim is made. Against the outline, the requirements are strong on electronic-system design, installation, commissioning, as-built records and replacement, and nearly silent on risk assessment, bidding and procurement, and personnel.

### Pan/tilt/zoom cameras (FR-63)

Three sources assumed such cameras while the requirements gave every camera one fixed aim. The governing choice is that only the home position, the resting view, is counted in combined coverage and zone targets, because the camera views one place at a time. Reach is a separate reachable-on-demand layer showing the best detail achievable at the narrowest field of view, and it earns no credit. Reach reuses the existing visibility calculation swept across the pan limits from the mounting point. Guard tours, auto-tracking and time-share coverage figures are out of scope.

### Optional reliability period (FR-64)

The idea is Patterson’s reliability or operational availability test. The requirement reuses the confirmed check, attempt, issue and retest rules; its one new element is a downtime log from which availability is computed. It differs from the source deliberately: nothing is prescribed, where he describes about 30 days in two phases; it warns and records but never blocks, where he requires all deficiencies corrected first and no repairs without written permission; and availability is defined as time not down divided by total elapsed time, where his printed formula can be read two ways. People enter every start, end and outage, so a recorded availability is only as complete as the log.

### Warranty and service visits (FR-65)

Two warranty levels are kept because their clocks differ: the installer’s runs from a scope’s closeout, while a manufacturer’s belongs to an individual device, including a later replacement. Status is calculated and informational, and equipment with no warranty recorded is Unknown. Service visits fill the middle of a chain the requirements already had at both ends: an issue records the fault, and resolution requires a closing check. A service call after closeout reopens the project into a work scope marked as service through one action, so no separate service track exists; each such scope ends with its own closeout record. A service scope starts with no current issued design under FR-61.

### Small additions

The optional camera checks in FR-29 include two that verify the model in the field: a person at the far end of the view, and a person behind an obstruction or in its shadow. They sit beside the modeled estimate and never alter it. FR-43 gains optional checks for alarm-to-camera call-up and handover. FR-7 gains camera enclosure type and alarm interface. FR-20 gains survey prompts that are observations only. FR-18 gains percentage lines with a stated base and subsystem subtotals that never change the total.

### Clarifications adopted from the parallel session

Kevin kept PRD 1.0 on every point where the parallel session disagreed with it, and adopted four clarifications where 1.0 was silent.

- **Reversing a mistaken mark (FR-55).** A proposed device marked installed or configured in error can be returned to not installed with a reason. The record, its notes and its attempts are kept, and the reversal never makes the record eligible for quick deletion.
- **Whole-revision restore (FR-22).** A restore changes design content only. Recorded actual positions, recorded work, evidence, issues and archive state are facts and are never rolled back. Deleted floors are not brought back.
- **Un-archiving versus reopening (FR-37).** Leaving the archive is its own explicit action and starts no work scope; reopening for later work remains FR-38.
- **Cancelled and corrected records (FR-8/41).** They stay listed and searchable with their reason, and the Changes view lists them against the current issued design.

### Device state model

The model in the PRD’s Terms section consolidates states that the requirements already use, for the architecture stage that the handoff asks to decide lifecycle identities. It was adapted to PRD 1.0: the middle lifecycle stage is named Existing, not Installed, because an import must not establish actual installation; a Placement axis covers the Awaiting placement list; and provenance is stated not to be a device state. The prototype stores a single existing/proposed flag and has none of the other axes.

## Downstream responsibilities and evidence boundaries

The [readiness extraction](sources/finalization-readiness-after-acceptance.md) distinguishes completed product decisions from downstream delivery responsibilities.

The following details are already assigned to downstream planning roles; they are not new unowned product-scope questions. Roles describe responsibility without assigning or contacting external people.

| Detail | Owner role | Definition/revisit milestone |
| --- | --- | --- |
| Shared persistence, version/transaction boundaries, file/job handling, access configuration, backup storage and automated retrieval/restore mechanisms | Architecture + engineering | Architecture decisions before related implementation commitments; demonstrate integrity and recovery during acceptance. |
| Exact representative hardware/browser builds/network, physical cameras versus views/streams, plan/edge/zone geometry, evidence/history manifests, decoded-resource guards and benchmark procedures | Engineering + QA, with Kevin confirming representativeness | Declare workload before performance/capacity benchmarks; preserve the confirmed real-site profile and numerical goals. |
| Responsive task flows, detailed controls/status/error presentation, mapping screens and package layout | UX + engineering | UX validation and relevant story acceptance before the implementation is treated as usable. |
| Final type-specific checklist wording, project expectations and manufacturer/site values | Kevin/domain reviewer + engineering | Before using the relevant checks for actual field commissioning; no invented default or compliance claim. |

Implementation, testing and measured capacity/recovery evidence follow the finalized PRD. They are required to accept the POC software, not prerequisites for finalizing its requirements. Detailed mechanisms may change while preserving accepted behavior; a material scope/target change must return to the product decision record. Full PSP review/certification is not claimed or silently added as a document-finalization gate.

### Source and verification boundaries

The [source index](source-index.md) and [baseline extract](sources/draft-baseline-extract.md) record inventory checks, historical QA, stale documentation and unverified defects. No application tests, builds, browser flows or Google live-key checks were rerun for this documentation review.

The [external](sources/reference-context.md) and [commissioning](sources/commissioning-context.md) digests provide limited context, not a full PSP review, adopted standard, mandatory approval gates or evidence of a competitor's project hierarchy. Domain-specific tests and compliance claims need additional sources.

The PRD and decision log supersede proposal labels in the [preserved discovery notes](sources/discovery-notes.md). Detailed UX, architecture and test templates remain downstream work.

### Historical acceptance candidates

Earlier small-fixture timing/file examples are preserved in the [historical candidate record](sources/superseded-acceptance-candidates.md). They are not additional requirements. Use [Performance and analysis accuracy](#performance-and-analysis-accuracy) and [File, evidence, backup and recovery limits](#file-evidence-backup-and-recovery-limits) for current targets; actual implementation and acceptance evidence are still outstanding.
