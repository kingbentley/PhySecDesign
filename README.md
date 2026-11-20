# Site Survey Design

Site Survey Design is a web application for physical security professionals. It follows one property from the first design through installation, testing, closeout and later changes, all in a single continuing project. A professional finds the property on a map, aligns its floor plans, places cameras and other equipment, checks camera coverage, routes cable, estimates cost and capacity, and shares a design package. The same project then records what was actually installed, how it was configured, what was tested, and what is still outstanding.

**It is a proof of concept, and most of it is not built yet.** The requirements are final: [PRD 1.2 with amendments 1.3 and 1.4](_bmad-output/planning-artifacts/prds/prd-PhySecDesign-2026-11-16/prd.md). A design prototype that saves in one browser works today. The shared, multi-user product the requirements describe is planned as 175 stories, of which the first is done. [What works today](#what-works-today) separates the two.

The product was called Site Studio until 2026-11-20, which is why its folder is still `site-studio/`. This repository, PhySecDesign, holds the app, its planning documents and its design references.

## Who it is for

| Person | What they do with it |
| --- | --- |
| Security designer, consultant or integrator | Surveys the property, designs the system, estimates it, issues the design, and manages the job to closeout. This is the primary user. |
| Installer or technician | Works online from a phone, tablet or laptop on site: finds a device, sees what is required, and records the installation, configuration, photos and test results. |
| Client or site owner | Reviews a fixed revision of the design through a link, without an account, comments on the plan, and approves it or asks for changes. Can also accept the completed site. |
| Administrator | Looks after the organization's own copy of the software: its users, projects, settings, backups and updates. |
| AI agent acting for one of these people | Prepares work, such as importing an inventory or drafting a layout, which a person then decides. |

One person can fill every role. A sole practitioner can design, install, test and close out a job with no handoff, and every approval can be bypassed. A bypass is recorded as a bypass, not as an approval.

It suits organizations that want to hold their own project data. Each organization runs its own installation, on a Linux server it controls or on its own Cloudflare account, and an installation serves that one organization.

The proof of concept is sized for a property of about 10 buildings, 20 to 30 plans and 600 devices, 150 of them cameras, with two people editing at once. That is the acceptance target, not a tested result or a permanent ceiling.

## What it does

This section describes the product the requirements define. Each part says what a person can do, and [What works today](#what-works-today) says how much of it exists.

### Set up the property

- Create one project per property, with named buildings and floors. Each floor keeps its own drawing, equipment, cable routes, obstructions, zones, notes and analysis settings.
- Find the site by address or coordinates, and view it on a street map or on satellite imagery. OpenStreetMap works without an API key, and Google mapping is optional.
- Import a floor plan as an image or as one page of a PDF, and lay it over the map. Adjust its position, rotation, scale and opacity, then lock it.
- Align a plan by matching two points on the drawing to two points on the map, with a preview before applying.
- Mark up the plan with fence lines, entrance markers, arrows, callouts and dimensions. Markup is drawing only and never changes coverage results, equipment counts or cable lengths.

### Record what is already there

- Survey an existing building by placing its equipment and known cable routes on the plans. A detail that nobody knows stays unknown, and each value records where it came from: an old document, an estimate, an import or an observation on site.
- Start from a spreadsheet when one exists. Import a CSV or Excel inventory by mapping its columns, then preview each row as New, Unchanged, Changed or Needs review before applying. Importing the same file again creates no duplicates.
- Keep imported devices that have no known position in an Awaiting placement list until someone places them during the survey.
- Attach notes, measurements and photos to a device or to a spot on the floor.
- Save the survey as a fixed baseline, then plan the work on each existing device: retain, relocate, service, replace or remove.
- Switch between three views: the current installation, the proposed design, and the changes between them.

### Place equipment

- Place cameras, readers, door contacts, intrusion sensors, intercoms, lights, switches and cabinets, and also doors, gates, access controllers, locks, request-to-exit devices, power supplies, recorders and custom equipment.
- Every device has a stable ID that survives moves, revisions, exports and archiving. A physical replacement gets a new ID linked to the device it replaced.
- Link a door or gate to its reader, contact, lock and controller. Each component stays its own record with its own cost and history, and a controller shared by several doors is counted once.
- Search the equipment schedule across the whole property and jump from a row to the device on its floor.

### Model camera coverage

- Build reusable camera models by manufacturer, model and lens, with fixed or varifocal lenses, and pick one when placing a camera.
- Set each camera's aim, lens, resolution, mounting height and tilt, and see the area it views.
- Draw walls and obstructions with heights. They cast shadows where they block a camera's line of sight.
- See combined coverage for a floor: the area covered, the area covered by more than one view, and the area no camera sees, inside an analysis boundary the user can draw.
- Turn on a DORI overlay showing where the image has enough detail to Detect, Observe, Recognize or Identify a person. Two weak views that overlap do not add up to a stronger one.
- Draw security zones with a target, such as Identify across 90% of an entrance, and see the percentage achieved and where it falls short.
- Treat a camera with several lenses as one device with several views. Fisheye and stitched panoramic views are shown as illustrations and marked Not assessed.
- For a pan/tilt/zoom camera, count only its resting view as coverage. The wider area it could turn to is drawn separately as reachable on demand and never counts as covered.

### Connect and size the system

- Draw cable runs between devices, across floors through named risers. A run keeps one ID and is counted once however many sheets it appears on.
- Build a run's length from its horizontal segments, floor-to-floor transitions and drops. The quantity to supply adds service loops and a chosen percentage, applied once.
- Group switches, controllers and recorders into named closets, and keep a port schedule for each switch with assignments, reservations and power budgets.
- Estimate recording storage and network bandwidth from the configured streams, and switch-port and PoE demand from the connections.
- Estimate cost from equipment, cable, accessories and optional labor, with percentage lines such as contingency, tax and markup, and subtotals by subsystem. Export the estimate as CSV.
- An unknown price shows as unpriced, an unknown load keeps a capacity result marked incomplete, and equipment being retained is not priced as a new purchase.

### Review and issue the design

- Save named revisions, compare two of them at the same scale, and restore an earlier design.
- Assign reviewers per project. A reviewer either signs in or uses a revocable link to one fixed revision, and can comment on the plan and approve or request changes.
- Issue a design to create the fixed reference that installers work from. Later edits never alter it, and issuing a newer design marks the earlier one superseded while keeping it.

### Install and test

- Record field conditions directly: where a device actually went, what was actually installed, and how a cable actually runs. A meaningful change keeps the values before and after, who made it, when and why.
- Work through editable checklists grouped as Installation, Configuration and Testing, with starter checks for each device type.
- Record each test as Pass, Fail, Not tested or Not applicable. A Pass needs an observation recorded by a technician, with any measurement or photo the check requires.
- When something changes after a test, such as a camera being re-aimed, the affected checks are flagged for retest. Earlier attempts stay on record.
- Add site-wide checks, such as an alarm calling up the right camera or a recording being retrievable.
- Optionally run a reliability period after testing, with a downtime log from which availability is calculated.
- Track issues with stable IDs. An unresolved issue carries into later work until it is included, deferred with a reason, or resolved with evidence.

### Close out and return later

- Close the work as Completed, or as Closed with outstanding items with a short note. Unfinished work, a failed or unperformed required test, or an open issue prevents Completed, and nothing can hide them.
- A closeout creates a fixed record of the drawings, schedules, estimates, evidence, changes and outstanding items as they were known then.
- A removed device is archived with its history and can be restored under the same ID.
- Reopen the same project for later work at the property. The new work has its own scope, estimate and checks, and earlier closeouts stay unchanged.
- Record warranties with a calculated status, and service visits on an issue: what was reported, found and done, the parts used and the time spent.
- Note a ticket number from a customer's service desk or an in-house tracker on an issue, service visit or warranty. The software stores the reference and never contacts the tracker.
- Archive an inactive project. It stays searchable and exportable.

### Produce packages and backups

- Generate a Design package or a Closeout package as PDF: plans, equipment and cable schedules, coverage sheets, checklists, test evidence, photos and outstanding items. Prices are left out unless chosen.
- The exact files issued are kept. Generating again produces a new dated edition and leaves the earlier one as it was.
- Download a complete portable backup of a project and restore it on another installation.
- Each installation backs itself up at least daily and keeps at least seven daily backups.

### Work together

- People sign in with their own accounts, created by invitation, with optional two-step verification.
- An administrator adds each person to a project as an Editor, who can change it, or a Viewer, who can read it. The server enforces these limits.
- Edits save automatically and appear in other people's browsers within a few seconds.
- Two people can edit different items at the same time. When they edit the same item, the second sees the conflict and decides what to keep; nothing is silently overwritten.
- Every edit, test, approval and administrative action is recorded under the account that made it, and administrators have an activity log of sign-ins and administrative changes.

### Host it and keep it current

- Run it on a Linux server with Docker or on a Cloudflare account. Both offer the same features, and a project backed up on one can be restored on the other.
- Releases are published publicly and signed. An administrator installs an update from the interface: the software takes a backup first and returns to the earlier version if the update fails.

### Work with AI agents

- A person creates access tokens for agents, either read-only or read-and-draft, optionally limited to named projects.
- Every installation offers an HTTP API and an MCP endpoint, including an installation on a private network. Agent access is off until an administrator turns it on.
- Everything an agent changes is recorded under its owner and marked "via agent".
- Agents prepare and people decide. An agent cannot approve a review, issue a design, close out work, record a test result or mark a device installed; each of these is refused with the reason "needs a person".

## How it treats records

These rules run through every feature, and they are the main thing that distinguishes Site Survey Design from a drawing tool.

- **Planned, installed, configured, tested, approved and closed are separate facts.** Marking a device installed does not make it tested. Approving a design does not turn a failed test into a pass. Closing a job does not resolve an open issue.
- **A modeled result is an estimate.** Coverage, DORI, cable length, capacity and cost are planning figures with their assumptions shown. A modeled result never counts as a field test.
- **Unknown stays unknown.** A missing model, price, load or location is shown as missing. It is never treated as zero, verified or passed.
- **History is kept.** Issued designs, closeout records, test attempts and evidence do not change when the project changes later. A correction is added beside the original and does not replace it.

## What it does not do

Site Survey Design is a planning and record-keeping tool. Its coverage, capacity and cost figures are illustrative, not certified engineering, and it makes no compliance claim. It carries no security certification, and an independent security review is required before it is recommended for confidential client data.

The proof of concept leaves out:

- offline capture and later synchronization, so field work needs a connection;
- single sign-on, directory synchronization, several organizations in one installation, licensing and billing;
- connecting to the installed equipment, so no automatic configuration, testing, discovery or monitoring;
- vendor-certified catalogs and pricing;
- CAD or BIM editing, full 3D modeling and lighting simulation;
- risk assessments, specifications and bid documents, procurement, scheduling, and backup-power design.

## What works today

The prototype in [`site-studio/`](site-studio/README.md) is a design workspace for one person. It saves the project in the browser it runs in; there are no accounts and no sharing of a live project.

| Area | Works in the prototype | Specified, not built |
| --- | --- | --- |
| Property and plans | Buildings and floors; address search; street and satellite maps; image and PDF-page import; two-point alignment | Annotations; keeping the original PDF; guarded floor deletion |
| Equipment | Nine generic catalog items of eight types; a property-wide schedule; proposed or existing status | The wider catalog; doors and gates with linked components; inventory import; planned actions and current, proposed and changes views |
| Camera coverage | Single-camera and combined coverage with walls and obstructions; DORI overlay; zones | Camera model templates; multi-view cameras; pan/tilt/zoom cameras |
| Cable and capacity | Same-floor routes with a slack allowance; storage, bandwidth, switch-port and PoE estimates | Runs across floors; closets and port schedules |
| Estimate | Equipment, cable, accessory and labor lines; CSV export | Percentage lines; subsystem subtotals; estimates per work scope |
| Survey | Notes with measurements and photos, on a device or a location | The existing-site survey workflow and baseline |
| Revisions and review | Named revisions, comparison and restore; undo and redo; reviewer links with pinned comments and decisions, on the local development server only | Issued designs; review on a deployed installation |
| Field work and closeout | None | Checklists, tests, issues, closeout, archives, reopening, warranties and service visits |
| Deliverables | A printable design report as PDF; a portable project file | Design and Closeout packages; retained editions; automatic backups |
| Accounts and sharing | None | Accounts, roles, shared editing, the activity log |
| Hosting | One server build that runs on Cloudflare and, self-hosted, under Cloudflare's open-source runtime. It serves the app and a status address only. | Installation instructions, the Docker image, updates from the interface |
| AI agents | None | Tokens, the API and the MCP endpoint |

The planning documents behind this are in [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/): the requirements, the UX specification, the architecture, and the epics and stories. Story progress is in [`sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml).

## Run the prototype

Requires Node.js 22.13 or newer (or Node.js 24+) and npm.

```sh
cd site-studio
npm ci
npm run dev -- --host 127.0.0.1 --port 4174
```

Open <http://127.0.0.1:4174/>. See the [Site Survey Design README](site-studio/README.md) for a walkthrough, build and test commands, deployment to each host, and the prototype's limits. The [POC roadmap](site-studio/POC-ROADMAP.md) describes the prototype's scope; [design QA notes](site-studio/design-qa.md) record verification separately.

## Repository layout

- [`site-studio/`](site-studio/README.md): the app. A React and Vite front end, with a TypeScript server that runs as a Cloudflare Worker.
- [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/): product planning documents.
- [`experiments/`](experiments/README.md): technical experiments run for the architecture, with their records.
- [`design-mockups/`](design-mockups/): visual design mockups.
- [`design-references/`](design-references/README.md): links to external product references.
- [`AGENTS.md`](AGENTS.md): workspace instructions for coding agents.

Dependencies, generated build/PDF.js assets, local environment settings, and private review data are excluded from version control. All files under `_bmad/`, including configuration and customizations, and generated agent skills are also excluded; planning artifacts under `_bmad-output/` are retained. BMAD Core and Method 6.12.4 are used by this workspace.

## License and scope

Original project code and documentation are available under the [MIT License](LICENSE). Third-party dependencies, map data and imagery, and referenced products retain their own terms; see [third-party notices](THIRD_PARTY_NOTICES.md). Vendor reference screenshots are kept outside the public repository.

Site Survey Design is a proof of concept with fictional demonstration drawings. Its coverage, equipment, capacity, and cost estimates are illustrative, not certified engineering or a guarantee of security performance. Validate real designs with qualified professionals and applicable requirements.
