---
title: "Site Studio — Epics and Stories"
status: draft 0.3 for Kevin's review; passed the sprint-planning readiness gate with concerns on 2026-11-18
created: 2026-11-18
inputs: "final PRD 1.2; UX design specification 0.5; architecture 2.1"
method: BMAD Create Epics and Stories, followed by hand (the BMAD skills are not installed in the cloud checkout)
---

# Site Studio — Epics and Stories

This document breaks [final PRD 1.2](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and early experiments (R-numbers). It adds no requirement.

It is a draft. The epic order, the story boundaries and the acceptance criteria are proposals for Kevin to review. Nothing here has been built.

**What changed from draft 0.1.** Draft 0.1 covered FR-1–65 for a Cloudflare-only server opened by links. It is kept beside this file as `epics-draft-0.1-pre-amendment-1.2.md.txt`. This draft adds an epic for accounts and administration and an epic for self-hosting and updates, splits recovery from acceptance, renumbers the rest, and updates the stories that the PRD review changed: reviewer assignments and Viewer rights, revision restore, the reliability period, archiving, service visits, backups and recovery. Story numbers therefore differ from draft 0.1.

**Draft 0.3** applies the readiness check of 2026-11-18: criteria that depended on later epics moved out of Epic 1, three large stories split, four UX decisions cited, and the Packages screen renumbered S-37. Headings use the form the BMAD sprint-planning script reads.

## How to read it

- **Ten epics and 87 stories**, each epic ending in something a person can use and demonstrate.
- **Stories** are sized to be built and verified in one sitting. A story depends only on stories before it, except where a story names a later one that adds to it.
- **Acceptance criteria** say what must be observable. They draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** below apply to every story and are not repeated.

### Rules that apply throughout

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every server route sits behind the access gate (AD-12). From Epic 2 on, each story's write paths are tested as an Editor and shown to be refused for a Viewer and for a signed-in user who is not a member. The actor recorded is always the signed-in account.
3. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
4. Fixed records and stored files are never modified (AD-3, AD-8).
5. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
6. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (AD-15).
7. Server code is written in the portable core against the host interfaces, and its tests pass on both hosts (AD-16). A new record shape comes with its data conversion (AD-20).
8. A story is done when its criteria pass in a browser against the locally run server, its automated tests pass on both hosts, and the existing tests still pass.

## Requirement coverage

Every functional requirement appears in at least one story. This table is generated from each story's "Covers" line. Where a requirement is split, the first story listed delivers its base and the later ones complete it.

| Requirement | Stories | Requirement | Stories |
| --- | --- | --- | --- |
| FR-1 | 2.5 | FR-37 | 6.11 |
| FR-2 | 2.1, 2.3, 5.2 | FR-38 | 6.10 |
| FR-3 | 2.6 | FR-39 | 6.1 |
| FR-4 | 2.6 | FR-40 | 6.6 |
| FR-5 | 2.6 | FR-41 | 5.2, 6.6 |
| FR-6 | 2.6 | FR-42 | 2.4, 5.13 |
| FR-7 | 2.7, 4.2 | FR-43 | 5.8 |
| FR-8 | 2.7, 3.5, 6.4 | FR-44 | 5.6 |
| FR-9 | 2.9, 7.6 | FR-45 | 6.7 |
| FR-10 | 2.8 | FR-46 | 5.9, 6.10 |
| FR-11 | 2.8 | FR-47 | 4.3 |
| FR-12 | 2.8 | FR-48 | 7.1 |
| FR-13 | 2.8 | FR-49 | 7.3 |
| FR-14 | 2.8 | FR-50 | 7.4 |
| FR-15 | 2.8 | FR-51 | 7.5 |
| FR-16 | 2.8 | FR-52 | 7.6 |
| FR-17 | 4.4 | FR-53 | 6.8 |
| FR-18 | 4.4 | FR-54 | 6.9 |
| FR-19 | 4.5, 7.1, 7.5 | FR-55 | 2.11, 4.9 |
| FR-20 | 2.10, 5.5 | FR-56 | 6.4 |
| FR-21 | 2.2, 2.11, 5.13 | FR-57 | 6.4 |
| FR-22 | 2.12, 4.1 | FR-58 | 6.3 |
| FR-23 | 4.6 | FR-59 | 6.5 |
| FR-24 | 4.6, 4.7 | FR-60 | 2.5 |
| FR-25 | 4.6 | FR-61 | 4.8 |
| FR-26 | 4.8, 5.2 | FR-62 | 6.2 |
| FR-27 | 5.3 | FR-63 | 7.2 |
| FR-28 | 5.6 | FR-64 | 5.10, 5.11 |
| FR-29 | 5.4 | FR-65 | 6.12 |
| FR-30 | 5.3, 5.5, 5.7 | FR-66 | 1.2, 9.1, 9.2 |
| FR-31 | 5.5, 5.7 | FR-67 | 1.3, 1.4, 1.5, 1.10 |
| FR-32 | 5.12 | FR-68 | 1.6, 1.7, 1.8, 6.11, 8.4 |
| FR-33 | 4.10, 5.12, 7.7 | FR-69 | 1.6, 2.1 |
| FR-34 | 4.1, 4.10, 8.1, 8.2, 8.3, 8.4 | FR-70 | 1.8, 1.10, 4.7, 8.1, 8.2, 8.5 |
| FR-35 | 6.8 | FR-71 | 1.9, 4.7, 8.1, 9.6, 9.7 |
| FR-36 | 6.9 | FR-72 | 9.3, 9.5, 9.6, 9.7, 9.8 |

| Quality requirement or measure | Stories |
| --- | --- |
| NFR-1 Record integrity | 4.1, 6.8, 6.9, 8.2 |
| NFR-2 Shared-save clarity | 2.2, 5.5, 5.13 |
| NFR-3 Browser, field and accessibility | 3.2, 3.3, 5.1, 10.3 |
| NFR-4 Honest analysis and responsiveness | 2.8, 10.2 |
| NFR-5 Access boundary | 1.3, 1.6, 4.7, 8.3 |
| NFR-6 Consistent deliverables | 4.10, 5.12 |
| NFR-7 Same product on either host | 8.4, 9.1, 10.4 |
| NFR-8 Safe updates | 9.4, 9.6, 9.7, 9.8 |
| SM-1 | 10.3 |
| SM-2 | 10.3 |
| SM-3 | 10.3 |
| SM-4 | 10.3 |
| SM-5 | 10.1, 10.2 |
| SM-6 | 9.2, 10.4 |

| Early experiment | Story |
| --- | --- |
| R1 | 4.10 |
| R2 | 2.8 |
| R3 | 8.2 |
| R4 | 5.1 |
| R5 | 8.4 |
| R6 | 4.10 |
| R7 | 1.1 |
| R8 | 1.1 |
| R9 | 1.3 |
| R10 | 9.8 |
| R11 | 9.7, 9.8 |
| R12 | 9.1 |

## Epic 1: Install, sign in and manage people

**Outcome.** An organisation can deploy Site Studio on Cloudflare, set it up, invite people, and control who can see and change each project.

**Why first.** Every later story needs to know who is acting and what they may do. The architecture lists the project foundation before accounts; here they are swapped so that the first shared project is built on real sign-in, not on a temporary access scheme that would be thrown away. Story 1.1 still lays the foundation both need.

### Story 1.1: Run the app on Cloudflare with a portable server core

As the developer, I want the existing app served by a Cloudflare Worker, with the server written against the five host interfaces, so that everything later runs on either host.

Covers: AD-1, AD-15, AD-16, experiments R7 and R8.

- Given the repository, when the local development command runs, then the existing app loads from the locally run Worker with no change in behaviour, and the existing tests still pass.
- The server code is split into a portable core and host adapters. Nothing in the core imports from a host.
- A minimal Node adapter exists from this story on, so the core test suite runs against both hosts in continuous integration. One trivial project-store test passes on both.
- Given a Cloudflare account on the Workers Paid plan, when the deploy command runs, then the app is reachable over HTTPS at a `workers.dev` address.
- Experiment R7 (Cloudflare's Vite plugin and Vitest integration with Vite 6.4 and React 19) is run first and its result recorded; the fallback is used if it fails.
- Experiment R8 (whether Cloudflare's open-source runtime could host the Cloudflare build on a server) is tried and its result recorded. Two adapters remain the plan unless Kevin decides otherwise.
- The static "Sites" package and its test are left working (K7).

### Story 1.2: Set up a new installation

As the person who installed Site Studio, I want a one-time set-up step, so that I become its first administrator and nobody else can.

Covers: FR-66 (set-up; Cloudflare host), AD-12. Screens: S-25.

- Given an installation with no users, when it is opened, then the set-up page is shown; with any user present it is not reachable.
- The step asks for the set-up code produced at deployment, the installation's name and the first administrator's name, email and password.
- Given a wrong or missing set-up code, then set-up is refused.
- On completion one administrator exists, the installation's name shows on the sign-in page, and the set-up step cannot be run again.
- A plain HTTP request is redirected or refused.

### Story 1.3: Invite a person and sign in

As an administrator, I want to invite a colleague who then sets a password and signs in, so that each person has their own account.

Covers: FR-67 (invitation, sign-in), NFR-5, AD-12, experiment R9. Screens: S-26, S-27, S-30 invite panel.

- An administrator invites a person by email, name and role and receives a link to copy. There is no open registration.
- The invitation works once and expires after the period the administrator has set; a used or expired link says so.
- The invited person sets a name and password, with the password rules shown as they are met, and is signed in.
- A wrong email or password gives one message that does not reveal whether the email has an account; repeated failures are slowed.
- Passwords are stored only as salted hashes. Experiment R9 chooses the method that meets current guidance within the Worker's processor allowance, and the choice is recorded.
- The session is held in a cookie that scripts cannot read, sent only over HTTPS; only a hash of it is stored.
- Requests that change anything are refused unless they come from the app's own origin.

### Story 1.4: Two-step verification

As a user, I want to protect my account with an authenticator app, so that a stolen password is not enough.

Covers: FR-67 (two-step verification), UX decision D14. Screens: S-26, S-29.

- A user turns it on by scanning a code and confirming with one generated code, and is then shown recovery codes once, with Copy and Download.
- With it on, a correct password alone does not sign in; a current code does; a recovery code works once.
- An administrator can require it for everyone. A user who has not set it up when it becomes required must do so at their next sign-in before doing anything else.
- Turning it off asks for the password. An administrator can reset it for a user who has lost their device.
- The code step works on a phone, with a numeric keypad and code autofill.

### Story 1.5: My account and sessions

As a user, I want to manage my password and see where I am signed in, so that I stay in control of my access.

Covers: FR-67 (password change, sessions, sign-out). Screens: S-29.

- A user changes their name, and changes their password by giving the current one.
- A user sees their signed-in sessions and can sign out everywhere else; those sessions are refused on their next request.
- A session ends after the period without use that the administrator has set.
- Given a session that ends while a page is open, when the user signs in again, then input pending on that page is still there.
- Deactivating an account ends its sessions and prevents sign-in. Everything the person recorded keeps their name.

### Story 1.6: Roles, membership and the access gate

As an administrator, I want access decided by role and project membership on the server, so that people see and change only what they should.

Covers: FR-68, FR-69, NFR-5, AD-12.

- Every request, including every file download, passes one access gate that identifies the caller and decides from their role and membership. A route not marked public, reviewer-link or signed-in is refused.
- A standard user reaches a project only as its Editor or Viewer. An administrator can open every project as an Editor.
- A Viewer's attempt to change anything is refused by the server, not merely hidden in the interface; a Viewer can read. Each later story that adds a way to change or download something shows the same for its own feature.
- Removing a member, changing a role or deactivating an account takes effect on that person's next request.
- The last administrator cannot be demoted or deactivated.
- The actor recorded on every action is the signed-in account and its name at the time, supplied by the gate and never by the browser. Renaming a user leaves earlier records showing the earlier name.

### Story 1.7: Projects list and creating a project

As a user, I want to land on my projects after signing in, so that I can open the property I work on.

Covers: FR-68 (project creation), UX decision D11. Screens: S-28.

- After signing in, a user sees the projects they belong to with role, scope state, last activity and attention count; a user with exactly one project goes straight to it.
- An administrator sees every project and can create one. A standard user can create one only when the administrator has allowed it, becomes its Editor, and cannot add members.
- A user with no project sees a plain message to ask an administrator.
- An administrator sees an update-available marker here once story 9.5 is built.

### Story 1.8: Administration: users and project members

As an administrator, I want one place to manage people and who belongs to each project.

Covers: FR-70 (Users, Projects), FR-68, UX decision D10. Screens: S-30, S-31.

- Administration is a separate area reached from the account menu, and no standard user can open it or call its functions.
- Users: invite; change name and role; issue a password reset link; reset two-step verification; sign a user out everywhere; deactivate and reactivate. The table shows role, state, two-step status, projects and last sign-in.
- Projects: every project with state, members and last activity; add and remove members and set each as Editor or Viewer; create a project.
- Only administrators change a project's members.
- Deactivating or removing someone explains that their records keep their name.

### Story 1.9: Activity log

As an administrator, I want a log of sign-ins and administrative changes, so that I can see what happened and when.

Covers: FR-71. Screens: S-36.

- Sign-ins and failed sign-ins, sign-outs, password and two-step changes, invitations, role and membership changes, deactivations and reactivations, project creation, settings changes and every other administrator control each add an entry with time, actor and what changed.
- No entry contains a password, token, code or link.
- An administrator filters by person, kind of event and date, and exports the log. A standard user cannot read it.
- Entries cannot be edited or removed. The log is kept for the life of the installation.
- Later stories add their own events: reviewer links (4.7), archiving (6.11), backups and restores (Epic 8) and updates (Epic 9).

### Story 1.10: Settings and optional email

As an administrator, I want to set how the installation behaves, so that it fits my organisation.

Covers: FR-70 (Settings), FR-67 (reset by email), AD-17, AD-18. Screens: S-33.

- Settings cover the installation's name; the period without use after which a session ends; how long an invitation lasts; whether standard users may create projects; whether two-step verification is required; optional email sending; and optional map-provider keys.
- Each change takes effect and is recorded in the activity log.
- A saved secret, such as an email password or a map key, is stored encrypted and shown only masked.
- With email configured, a test message can be sent, invitations can be emailed and a user can reset a forgotten password by email. Without it, every invitation and reset is a link the administrator copies, and nothing else stops working.

## Epic 2: One shared project online

**Outcome.** The existing design tool runs as one shared project. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work.

Issued designs, field evidence, conflict checks and fixed packages all assume a shared server-saved record, and the prototype saves only in the browser.

### Story 2.1: Open a project as a member and work in it together

As an Editor, I want to open a project I belong to and have its records held on the server, so that my colleagues and I work on one copy.

Covers: FR-2, FR-69, AD-2, AD-5.

- Given a project and a member, when the member opens it, then it loads from that project's own store; a signed-in standard user who is not a member cannot open it or its files.
- Each project has its own store with a single writer, so two projects share no records.
- A Viewer sees the project with editing controls removed and a "View only" mark.
- Every accepted change records the signed-in account as its actor.
- An administrator opens a project they were never added to and can edit it.

### Story 2.2: Save edits to the shared project and show the save state

As a designer, I want my edits saved to the shared project automatically with a truthful status, so that I know my work is safe.

Covers: FR-21, NFR-2, AD-5. Screens: S-01.

- Given a committed edit, when it is saved, then the item shows Saving, then Saved once the server has acknowledged it, and the saved value survives closing the browser and restarting the service.
- Given a lost connection, when an edit is made, then it shows Unsaved, stays on the page, and the frame status counts it.
- Given a save whose reply was lost, when it is retried with the same operation identifier, then the change is applied once only.
- Drag intermediates are not saved; the completed move is.
- The frame's save status opens a list of pending and conflicting items.

### Story 2.3: See other people's changes within seconds

As a designer, I want changes saved by someone else to appear without reloading, so that we work from the same picture.

Covers: FR-2, AD-6, AD-7.

- Given two browsers on one project, when one saves a change, then the other shows it within 5 seconds.
- Given a form or drag in progress, when an incoming change affects that item, then the local input is not replaced and the user is told the item was updated.
- Given a tab that regains focus, then it checks for changes at once.
- Each accepted operation is recorded in the change log with actor name, session, time and before and after values.

### Story 2.4: Resolve a conflict without losing either edit

As a designer, I want a clash on the same item shown side by side, so that I can choose what to keep.

Covers: FR-42. Screens: S-F7 pattern on desktop.

- Given two browsers editing the same camera, when both save, then the first is accepted and the second becomes a visible conflict that keeps its pending values.
- Given a conflict, when it is opened, then the saved value, who saved it and when are shown beside the pending value for each differing field, and the user can keep the saved value or reapply their own per field.
- Given reapplied choices, when saved, then the version is checked again.
- Given two browsers editing different cameras, when both save, then both succeed.
- Nothing is merged silently.

### Story 2.5: Buildings and floors on the server, with guarded deletion

As a designer, I want buildings and floors kept as separate records, so that each floor's content stays independent and nothing referenced can be deleted by accident.

Covers: FR-1, FR-60. Screens: S-03 left panel.

- Given several floors, when switching between them, then each keeps its own drawing, equipment, routes, obstructions, zones, notes and analysis settings.
- Given a renamed floor, then its identity is unchanged; a new floor with a reused name has a new identity.
- Given an unused draft floor or empty draft building, when deleted, then it is removed and can be undone.
- Given a floor with any device, cable or riser reference, survey record, child floor or historical reference, when deletion is attempted, then it is refused with the blocking records listed.
- Given a deletion request made from a stale view, when new content has been added, then it is refused.

### Story 2.6: Property lookup and plans stored with their originals

As a designer, I want to find the property and import, align and lock a plan whose original file is kept, so that the drawing can be traced and reused.

Covers: FR-3, FR-4, FR-5, FR-6, AD-3, AD-4, AD-10. Screens: S-03.

- Address and coordinate lookup, street and aerial views and optional Google mapping behave as in the prototype; choosing a result moves the view only.
- Given an image or a PDF page, when imported, then the original file and a preview are uploaded in parts with visible progress, and the plan shows Saved only when both are stored and referenced.
- Given a password-protected PDF, then the password is used in the browser only and is absent from every request, record and backup.
- Given one PDF used for two floors, then it is stored once.
- Position, rotation, scale, opacity, lock and two-point alignment with preview, cancel and undo behave as in the prototype, and moving a plan does not move equipment.
- Given a file over its limit or of an unsupported type, then it is refused with a plain reason and nothing is changed.
- A plan imported by the prototype without its original shows "original not available".

### Story 2.7: Equipment as individual records, findable across the property

As a designer, I want every device kept as its own record with a stable identity, so that it can be found, located and followed through its life.

Covers: FR-7 (base), FR-8 (base). Screens: S-03, S-08.

- Given two similar devices, then each has its own unchanging identifier and its own label, shown in the plan and the schedule.
- Given the equipment list, when a placed device is chosen, then its floor opens with the device selected.
- Search by identifier, label, name and model returns correct results within 1 second for 600 devices.
- Each device is a separately versioned item.

### Story 2.8: Coverage, DORI and zones computed off the main thread, with an honest status

As a designer, I want coverage analysis to keep the interface responsive and to say when a result is current, so that I never read a stale number as final.

Covers: FR-10–16, NFR-4, AD-9, experiment R2. Screens: S-05.

- Camera controls, obstructions, combined coverage, analysis boundary, common target height, DORI and zones give the same results as the prototype for the same inputs.
- Given a changed input, then affected results show Updating until the calculation for the current inputs completes, and controls stay usable.
- Given hidden layers, then totals do not change.
- Excluded and unsupported views are listed with the reason.
- The last final summary per floor is saved with a fingerprint of its inputs.
- Experiment R2 is run on the busiest-plan fixture and its timing recorded. A miss is reported with the fallback chosen; it is not hidden by lowering fidelity.

### Story 2.9: Cable routes on one floor

As a designer, I want to draw and edit routes between devices on a floor, so that cable can be estimated.

Covers: FR-9 (base).

- Routes with waypoints, cable type and length estimate behave as in the prototype and are saved as versioned items with stable run identifiers.
- Given a moved endpoint, then the estimate updates.
- Removing a device no longer deletes its routes silently; the route remains with its end marked for review. Full handling arrives in story 6.8.

### Story 2.10: Survey notes and photos as separate entries

As a surveyor, I want notes, measurements and photos attached to a device or a point on the floor, so that evidence is kept with its place.

Covers: FR-20 (base). Screens: S-04 Evidence tab.

- Given a note or photo, when added, then it is a separate entry with author name and time, and two people adding to the same device both succeed.
- Given a photo, then its original and a preview are stored, and it shows Saved only after the upload and the entry have both succeeded.
- Given a retried addition, then no duplicate appears.
- Evidence can be reached from the plan and from the device.

### Story 2.11: Undo my own recent edits, and delete an accidental draft

As a designer, I want to undo my own recent edits and remove a device I placed by mistake, so that slips are cheap to fix.

Covers: FR-21 (undo), FR-55 (Delete draft), AD-7.

- Given my own recent edit, when undone, then a new reversal is recorded and the item returns to its earlier value.
- Given that someone else has since changed the item or something that depends on it, when I undo, then the undo is refused with an explanation and nothing of theirs is changed.
- Given an accidental proposed device with no evidence, when Delete draft is chosen, then it disappears at once with an Undo notice and no confirmation dialog; its identity and history are kept.
- Given a device with evidence, an issue or a connection, then Delete draft is not offered and the reason is available.

### Story 2.12: Bring in a project saved by the prototype

As Kevin, I want to import a project file exported from the prototype, so that existing work is not lost.

Covers: FR-22 (format migration), AD-14.

- Given a version 1 or version 2 portable project file, when imported, then a new shared project is created with its floors, plans, devices, routes, obstructions, zones, notes, costs and named revisions.
- Given content the new model cannot represent exactly, then it is listed for review, not dropped silently.
- Original drawings that the old file never held are marked "original not available".

## Epic 3: A workspace that holds the whole job

**Outcome.** The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure.

This epic can proceed alongside Epic 2 once story 1.1 is done.

### Story 3.1: Project frame and eight areas

As any user, I want to see which property, scope and reference I am working in and to move between areas, so that I always know where I am.

Covers: UX 5.1, 5.2, 17.1, decisions D1 and D12. Screens: S-01, S-02.

- The frame shows property, work scope and state, issued design, view switch, save status and the account menu with the user's name and role in this project. Administrators also see Administration. A Viewer sees "View only".
- "Members and reviewer links" shows who belongs to the project; managing reviewer links arrives in story 4.7.
- Items whose features do not exist yet show a neutral "Not issued" or are omitted, not faked.
- Overview, Plan, Equipment, Connections, Costs and capacity, Field work, Issues and Records are routes loaded on demand; a direct address or reload opens the same area.
- Existing dialogs for equipment, materials, capacity, revisions and review become pages.

### Story 3.2: Status language components

As any user, I want every status drawn the same way everywhere, so that I can read the state of things at a glance.

Covers: UX section 6, NFR-3.

- One component renders each family in the status reference with label and shape; no status depends on colour alone.
- A total that depends on unknown inputs renders as Incomplete with a count and a link.
- Device markers show lifecycle by outline (dashed or solid) and condition by glyph.

### Story 3.3: Readable text, contrast, targets and focus

As any user, I want text I can read and controls I can hit, so that long sessions and field use are comfortable.

Covers: NFR-3, UX section 10, audit findings A2, A3, A5, A6.

- No text is smaller than 12 px on desktop; body text is 14 px.
- All text meets 4.5:1 contrast and all markers, icons and focus rings meet 3:1, measured and recorded.
- Every interactive element shows a visible focus ring and can be reached by keyboard.
- Forms remain usable at 200% zoom with no horizontal scrolling.

### Story 3.4: Plan workspace regrouped

As a designer, I want grouped tools and a docked analysis summary, so that the map is not covered and tools are easy to find.

Covers: UX 7.1, decision D5, audit findings A7, A8, A9, A12. Screens: S-03.

- The tool dock has six groups, each remembering its last tool.
- The analysis strip replaces the floating card and never overlaps the dock or scale bar.
- Layers are grouped, with the note that hiding a layer does not change totals.
- Plan alignment handles appear only while the plan is unlocked and Alignment is open.

### Story 3.5: Equipment as a full page

As a designer, I want the schedule as a full table with filters, so that a large property is workable.

Covers: FR-8, audit finding A1. Screens: S-08.

- The table shows 600 devices with a sticky header, search, filters and a column chooser.
- Choosing a row opens the device inspector beside the table; Locate opens its floor.
- Segments for Awaiting placement and Historical are present and empty until their stories arrive.

### Story 3.6: Device inspector with tabs

As a designer, I want one inspector layout for every device, so that I know where each kind of information is.

Covers: UX 7.2. Screens: S-04.

- The header shows identifier, name, type and state chips.
- Tabs for Details, Optics (cameras), Work, Checks, Evidence and History exist; a tab whose feature is not built yet says so plainly.
- The History tab lists the device's changes from the change log.

## Epic 4: Design, estimate and issue

**Outcome.** A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package.

### Story 4.1: Named revisions as fixed snapshots, with compare and restore

Covers: FR-22, FR-34 (snapshots), NFR-1, AD-8. Screens: S-20, S-21.

- Given my pending edits, when I save a named revision, then they are resolved first and the snapshot is taken at one consistent point.
- Given a saved revision, when later edits are made, then the revision's stored file is unchanged, checked by its hash.
- Two revisions can be compared at one scale with a list of changed devices and settings.
- Given a restore, then design content returns: proposed devices, planned positions, planned actions, scope categories, proposed routes, proposed port assignments, zones, obstructions, annotations, estimate lines and settings.
- A restore never changes recorded positions and routes, current connections and port assignments, recorded work, checklist definitions and checks, evidence, tests, issues, cancellations, corrections or archive state. Items that cannot be restored are listed.
- A restore can be undone and does not delete later revisions.

### Story 4.2: More equipment types and camera fields

Covers: FR-7.

- Doors, gates, access controllers, locks and strikes, request-to-exit devices, power supplies, recorders and custom equipment can be created.
- Cameras record enclosure type and alarm interface, shown in the schedule; neither creates a connection.
- Existing door-contact records remain contacts.
- Creating a record invents no components, cables or specifications.

### Story 4.3: Camera-model templates

Covers: FR-47. Screens: S-08 Camera models.

- Templates can be created, edited, duplicated and searched by manufacturer, model and lens.
- A fixed-lens instance cannot be given another focal length; two varifocal instances can hold different settings and give their own results.
- A resolution or mode change uses that mode's pixels and framing.
- Missing optical inputs stay visibly missing.
- Editing a template later does not change placed cameras, fixed revisions or evidence.

### Story 4.4: Estimate with labour, percentage lines and subsystems

Covers: FR-17, FR-18. Screens: S-14.

- Excluding labour changes the included total and keeps the entered rates.
- A 10% contingency on chosen categories shows its base and amount and follows the base.
- Subsystem subtotals add up to the ungrouped total, and each line sits in one subsystem.
- An unpriced line reads Unpriced and makes the total, and any percentage on it, Incomplete.
- The estimate exports to CSV.
- Retained equipment is not purchased again; that rule is completed in story 6.6.
- A Viewer can export the estimate and cannot change it.

### Story 4.5: Capacity estimates

Covers: FR-19 (base). Screens: S-14.

- Storage follows recorded streams, bitrate, recording percentage and retention; bandwidth follows streams sent and is not reduced by the recording percentage.
- Units and overhead assumptions are stated.
- Unassigned demand and unknown specifications are shown and never counted as zero.

### Story 4.6: Approval assignments and decisions by account

Covers: FR-23, FR-24 (decisions by account), FR-25. Screens: S-22, S-23.

- Design and final-acceptance reviewers are assigned per project. An assignee is an account that is a member or an administrator, or a named person who will use a reviewer link. The same person, or self-approval, is allowed.
- A signed-in Editor or administrator, or a Viewer who is the assignee, comments on a fixed revision and records a decision under their account. A Viewer who is not the assignee cannot.
- A decision records who, when and which revision; later decisions do not erase earlier ones; a retry does not duplicate.
- When an assignee's account is deactivated, removed from the project or stops qualifying, the assignment shows as unavailable and an Editor reassigns or bypasses.
- Every approval can be bypassed; bypass is recorded as bypass, with an optional reason.

### Story 4.7: Reviewer links for people without accounts

Covers: FR-24 (reviewer links), FR-70 (Reviewer links), FR-71, NFR-5. Screens: S-24, S-32.

- A reviewer link opens one fixed revision, allows comments on the plan and one decision, and cannot reach the working project or another project.
- The reviewer enters a name, which is recorded as not verified. A decision through a link and a decision by an account look different in the interface and, later, in the package.
- Editors create, copy, replace and revoke their project's reviewer links. Revoking keeps earlier decisions.
- An administrator sees every active link in the installation, with project, revision and named reviewer, and can revoke any.
- Link creation and revocation appear in the activity log.
- This replaces the prototype's development-only review service.

### Story 4.8: Issue a design and designate the current reference

Covers: FR-26, FR-61. Screens: S-22, S-01.

- Before issuing, the frame shows Not issued.
- Given Revision B made current after A, then A is marked Superseded and its package and decisions stay available.
- Saving or exporting a draft revision does not change the designation.
- B does not inherit A's approval.
- Given two people designating at once, then one succeeds and the other sees a conflict.
- Designating changes nothing recorded on site.

### Story 4.9: Cancel a proposal and correct a record

Covers: FR-55 (cancellation, correction, mark reversal), UX decision D8. Screens: S-04 device menu.

- The device menu offers the one action that applies and a "Why can't I delete this?" explanation.
- An issued camera that will not be installed is cancelled with a reason; its issued representation survives and it leaves proposed totals.
- An unissued proposal that carries evidence can be cancelled with a reason.
- A duplicate is corrected with a reason and a reference to the record kept, without recording a removal.
- A mistaken installed mark on a proposed device is reversed with a reason; evidence stays and is flagged Needs review.
- Cancelled and corrected records are listed under Historical with their reason.

### Story 4.10: Design package, generated once and kept exactly

Covers: FR-33 (Design preset), FR-34 (fixed packages), NFR-6, AD-11, experiments R1 and R6. Screens: S-37.

- A package is generated from a saved revision, never from live records.
- It identifies property, scope, revision, edition, dates, units, floors included and Draft or Issued status.
- Prices are off by default; a partial floor selection is labelled Partial on every page.
- Each volume and the manifest are uploaded and the edition is listed only when all are stored and verified; a failure is shown and can be retried.
- Downloading again returns the same bytes. Regenerating creates a new edition with its own cutoff.
- Experiment R1 is run at full size and recorded. If it fails, the server-side fallback is brought to Kevin before this story is called done.
- A Viewer can download an existing package and cannot create one.

## Epic 5: Install, test and close out in the field

**Outcome.** A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package.

### Story 5.1: Field shell on phones and tablets

Covers: NFR-3, UX 8.1, 8.2, decisions D3 and D4, experiment R4. Screens: S-F1, S-F2.

- On a phone the app opens the field shell: one top row, bottom navigation, no drafting tools.
- A laptop or tablet can switch between the field shell and the desktop workspace.
- A device can be found by search, by filtered list or by tapping its 44 px marker; a tap near several devices opens a chooser.
- Opening a device from search does not require loading the whole property.
- Experiment R4 is started here: opening and searching on a real iPhone and Android phone over a throttled connection.

### Story 5.2: Installation view, current installation and the issued reference

Covers: FR-2 (views), FR-26, FR-41 (base), UX 5.3, decision D2. Screens: S-F3, S-03.

- The view switch offers Design and Installation and grants nothing.
- The basis control is always visible and labelled on the map and on each schedule and result.
- The device sheet states what to do in a sentence and shows requirements from the current issued design.
- "Compare with issued" shows issued and recorded values side by side where they differ; on the map the issued position appears as a ghost outline.

### Story 5.3: Record work done and changes found on site

Covers: FR-27, FR-30 (work recorded). Screens: S-F4, S-F5.

- Installed and Configured are separate marks, each recorded with name and time, and neither completes a phase.
- A moved camera is saved at once as the actual position, with before and after values, actor, time and a short reason.
- Placement and moves on a touch screen use the crosshair and nudge buttons; dragging is not required (decision D6).
- Routine checklist entries and photos need no change reason.

### Story 5.4: Checklists and starters

Covers: FR-29. Screens: S-16.

- A common checklist, device-type starters and a generic fallback exist, grouped as Installation, Configuration and Testing.
- A project can change applicability, required or optional status, expected results and evidence requirements.
- A check with no expected result shows Needs definition and cannot be passed.
- Changing a template keeps earlier wording, expected results and attempts.
- The optional camera checks are available and off by default.

### Story 5.5: Record outcomes, attempts and evidence

Covers: FR-30, FR-31, FR-20, NFR-2. Screens: S-F4.

- Outcomes are Pass, Fail, Not tested and Not applicable. Fail needs a short explanation; Not applicable needs a reason and is counted separately.
- A measured check needs value, unit and conditions before Pass is available.
- Each attempt is a new entry; a passing retest keeps the earlier failure and its evidence.
- A photo shows Uploading, then Saved or Failed with Retry, and is never shown as saved early.
- "Take photo" opens the camera and "Choose photo" opens the library on iPhone and Android.
- Two people adding attempts or photos to one device both succeed.

### Story 5.6: Changes flag the checks they affect

Covers: FR-28, FR-44.

- Moving a tested camera keeps the old attempt and flags the relevant current checks as Retest required, linked to the change.
- A cost-only edit, or hiding a layer, flags nothing.
- A shared-equipment change lists known affected devices and states that other effects are uncertain.
- An editor can add affected checks or record why a suggestion is unaffected.
- A further change after a retest reopens the follow-up; undo, restore and bypass never restore a pass.

### Story 5.7: Phase progress, remaining work and the contradiction warning

Covers: FR-30, FR-31, decision D7. Screens: S-15, S-02.

- Progress shows counts per phase by device and floor; a phase with nothing in scope reads "No checks in scope" and is never shown as complete.
- The remaining-work list holds unfinished work, required checks not tested, failures, required retests and open issues.
- A device marked not installed whose required installation checks have passed shows the neutral contradiction notice; nothing is blocked.

### Story 5.8: Site checks

Covers: FR-43. Screens: S-16.

- A project or floor checklist covers end-to-end operation and final records, using the same outcomes and history as device checks.
- Passing a sampled site check does not pass untested devices, and device passes do not satisfy a required site check.
- Optional starters cover alarm-to-camera call-up and handover items.

### Story 5.9: Issues

Covers: FR-46 (records). Screens: S-18.

- An issue has a stable identifier and links to devices, checks and attempts.
- It can be included now, deferred with a reason, or resolved with corrective work and current evidence.
- Resolving keeps the original failure and links the new attempt.
- A mistaken or duplicate issue is corrected with a reason; correction never resolves a real defect.

### Story 5.10: Define and run a reliability period

Covers: FR-64 (definition, runs, outcomes). Screens: S-17.

- The check is off by default. The project defines what it covers, as a selection of devices, floors or the whole site, its stages, what counts as downtime, and each stage's duration and target. A stage with no duration or target shows Needs definition and cannot pass.
- A person records the start and the end of a run. A run in progress has no outcome.
- Stages can be run in any order. Starting a run with work outstanding, or before an earlier stage has passed, shows a warning and proceeds.
- A full run that meets its target is Pass; one that misses is Fail; a run stopped because the system failed is Fail with an explanation; a run stopped for another reason is kept with no outcome.
- A covered camera moved during a run flags the check without stopping the run.
- A required stage that has not passed prevents Completed and permits closing with outstanding items.

### Story 5.11: Downtime log and availability

Covers: FR-64 (downtime log, availability).

- An outage is logged with what was affected, start, end and description, and is linked to an issue where it is a fault.
- Each entry states whether it counts, with a reason when it does not. An uncounted entry stays visible and does not change availability.
- Overlapping counted entries are not counted twice, and an entry with no end counts as continuing.
- Availability is computed from the counted entries, shown beside the target and marked provisional while the run is open. It is never entered by hand.
- The PRD's worked example holds: a one-hour stage with a 99% target and one counted three-minute outage shows 95% and Fail; a restarted clean run passes; both attempts are kept and appear in the Closeout package.

### Story 5.12: Close out, with a Closeout package

Covers: FR-32, FR-33 (Closeout preset), NFR-6. Screens: S-23, S-37.

- Completed is available only when nothing is outstanding; otherwise it is disabled with the reasons.
- Closed with outstanding items needs a short note and keeps the remaining-work list.
- Missing approval does not prevent closing, and bypass does not satisfy a required test.
- The outstanding list is rechecked at the moment of closing, and the closeout record is one consistent snapshot.
- The Closeout package shows recorded installation, changes from the issued design, attempts, photos, outstanding issues and approvals or bypasses, including when only some floors are chosen.

### Story 5.13: Lost connection and conflicts on a phone

Covers: FR-21, FR-42, NFR-2. Screens: S-F7.

- With no connection, a banner explains that entries are kept on this page and each unsaved entry is marked.
- On reconnection the app checks current state before retrying and never duplicates an entry.
- A conflict opens the per-field comparison sized for a phone.
- A save into an archived project or onto a removed device is refused for review.

## Epic 6: Existing sites and return visits

**Outcome.** An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact.

### Story 6.1: Existing equipment, condition, provenance and the surveyed baseline

Covers: FR-39, device state model.

- A device has lifecycle (Proposed, Existing, Removed) and, while Existing, a condition that starts as Unknown.
- Each value can carry provenance: imported, old document, estimate or site-confirmed.
- A camera with unknown model or installation date can be recorded without inventing either; recording it today does not set its installation date.
- A surveyed baseline can be saved as a fixed revision before planning changes.

### Story 6.2: Import a CSV or Excel inventory with column mapping

Covers: FR-62, AD-10, UX decision D9. Screens: S-09 steps 1 and 2.

- An .xlsx file with a title row imports from the chosen sheet and header row; a CSV with different headings maps to the same fields.
- Suggested mappings can be corrected; unmapped and ignored columns are disclosed.
- Asset ID 00042 stays 00042; an uncertain conversion is flagged.
- Formulas, macros and external links are never run; legacy .xls, macro-enabled and password-protected files fail clearly and change nothing.
- A sample template can be downloaded, and the project's last mapping is offered only when the headings fit.

### Story 6.3: Review rows, apply, and re-import safely

Covers: FR-58. Screens: S-09 steps 3 and 4.

- Rows are grouped as New, Changed, Unchanged and Needs review, with current and incoming values and their sources.
- Re-uploading the same inventory creates no extra devices.
- Duplicate names or conflicting identifiers go to Needs review; names, addresses and location hints never establish identity alone.
- Site-confirmed values are kept unless deliberately replaced; blank cells erase nothing; missing rows delete nothing; an archived match stays archived.
- A record changed by someone else since the preview comes back as a conflict.
- The result reports imported, skipped, failed, conflicted and unresolved counts.

### Story 6.4: Awaiting placement, and verifying on site

Covers: FR-56, FR-57, FR-8. Screens: S-08, S-F5, S-F6.

- An imported record with no position sits in Awaiting placement, searchable, with its hints, and has no map marker, no coverage and no test result.
- Its applicable property-level demand is still counted and the omitted coverage is disclosed.
- On a phone, a technician can confirm or correct each value, keeping the source value in view, and place the record with the crosshair; it keeps its identifier and import history.
- Placing does not confirm installation or pass any check.
- A device found on site that was not in the spreadsheet can be added.

### Story 6.5: Bulk cleanup of mistaken records

Covers: FR-59. Screens: S-10.

- A selection or an import batch can be previewed: how many are eligible, and each blocked record with its reason.
- Site-confirmed, issued, installed, tested or otherwise evidenced records and shared dependencies are blocked.
- Eligibility is rechecked on confirmation; a newly added test invalidates a stale preview.
- The outcome is logged per record and can be undone while dependencies allow.

### Story 6.6: Planned actions, and Current, Proposed and Changes

Covers: FR-40, FR-41. Screens: S-11, S-04 Work tab.

- A device can be planned as Retain, Relocate, Service, Replace, Remove or Add new; choices that the state model forbids are disabled with the reason.
- A planned replacement leaves the old device in Current installation and shows the new one in Proposed design, without double counting.
- Planning a move does not change the current position.
- A faulty camera is not credited in a current operational coverage estimate.
- Retained equipment and cable are not purchased; relocation and replacement costs are explicit.
- Changes shows relocation arrows, replacement pairs, and cancellations and corrections against the issued design.

### Story 6.7: Work scope categories

Covers: FR-45. Screens: S-11.

- One active named scope links its revisions, estimate and evidence.
- Devices and routes are Work now, Inspect or test only, or Reference only, preselected from planned actions and adjustable with a reason.
- Reference-only equipment still counts in coverage and capacity and is not recommissioned.
- Moving an item that has a required retest or open issue to Reference only leaves that item outstanding.

### Story 6.8: Record a removal, archive the device and settle its connections

Covers: FR-35, FR-53, NFR-1. Screens: S-04, S-12.

- Recording an actual removal archives the device with its identity, settings, last location, connections, tests, notes and photos, and takes it out of active plans, totals and demand.
- A planned removal alone archives nothing.
- Its cable keeps its run identifier and history; each end and port gets a disposition, and unresolved is allowed and flagged Needs connection review.
- The former port is not declared free automatically.
- Removing a shared switch flags known connections and does not archive downstream devices.
- All of this is one operation; a stale tab cannot leave a port pointing at a removed device.

### Story 6.9: Restore the same device, or link a replacement

Covers: FR-36, FR-54, NFR-1.

- Restoring keeps the device's identifier and history and needs a confirmed position on a valid current floor.
- On an unchanged or renamed floor the former position is offered for confirmation; on a replaced drawing the position must be reviewed.
- A deleted floor is not recreated, and a new floor with the same name is not treated as the original.
- Cancelling leaves the device archived.
- Earlier cables, ports and passes are not reinstated automatically; reconnection is explicit and cannot take a port now used by another device.
- A different physical replacement has a new linked identifier.

### Story 6.10: Reopen for later work, carrying issues forward

Covers: FR-38, FR-46 (carryover). Screens: S-20, S-18.

- Reopening creates a new scope and working revision from the latest installation, with a fresh estimate and checks.
- It does not restore removed devices, resolve old issues, inherit approvals or passes, or change earlier closeout packages.
- An unresolved issue carries into the new scope with the same identifier and awaits a disposition.
- A scope finished with a deferred fault closes with outstanding items.

### Story 6.11: Archive and un-archive a project

Covers: FR-37, FR-68. Screens: S-20, S-31.

- An Editor of the project, or an administrator, can archive it and un-archive it. A Viewer cannot.
- An archived project can be searched, viewed and exported, and cannot be edited.
- Exporting may add a new retained edition without reopening work.
- Un-archiving is explicit and starts no scope.
- A stale tab cannot write into an archived project.
- Archiving and un-archiving appear in the activity log.

### Story 6.12: Warranty and service visits

Covers: FR-65. Screens: S-19, S-23 warranty step.

- A scope's installation warranty has term, start date (default the closeout date), provider, note and covered items; a device can also carry a manufacturer warranty, and each is shown separately.
- Status is shown as of a stated date: Not started, In warranty or Expired. Equipment with no warranty recorded is Unknown, never Expired.
- With no scope active, Start service visit reopens the project into a service scope with the issue included. For an archived project, the action first asks to un-archive it.
- A visit records reported and visit times, fault, work, parts, time, attendee and under-warranty. The last is prefilled: Yes if any warranty covering the device is In warranty, No if all are Not started or Expired, Unknown if none is recorded.
- Field changes made during a visit are recorded with their reason although the service scope has no issued design.
- A visit does not resolve the issue and changes no estimate; a second visit sits beside the first; the original closeout record is unchanged.

## Epic 7: Extended modelling

**Outcome.** The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors.

### Story 7.1: Cameras with several views and streams

Covers: FR-48, FR-19 (views and streams).

- A four-head template creates one physical camera with four separately inspectable views, each with its own optics.
- It counts as one device for cost, port and power.
- A fisheye preview is drawn as illustrative, gets no DORI or target credit, and its exclusion is not reported as blindness.
- Displayed crops do not become recorded streams.

### Story 7.2: Pan/tilt/zoom cameras

Covers: FR-63. Screens: S-06.

- The PRD's worked example holds: the home position alone contributes to coverage and to the entrance zone; the loading dock keeps its shortfall and separately shows that it is reachable on demand.
- Previewing another stored position changes no totals and is labelled as a preview.
- Narrowing a pan limit shrinks the reach; unknown limits show no reach and are disclosed as unassessed.
- Without a home position the camera contributes nothing and is flagged.
- Changing the home position on an installed camera changes counted coverage and flags that position's checks.
- Limits can be edited as numbers as well as by handles.

### Story 7.3: Doors and gates with linked components

Covers: FR-49. Screens: S-08 Doors and gates.

- Door D-01 links to its reader, contact, lock and controller, each a separate record with its own cost.
- Linking the same controller to D-02 creates no second purchase or demand.
- Removing a link keeps the component and its evidence.
- No cable or port is created by a link.

### Story 7.4: Site annotations

Covers: FR-50. Screens: S-07.

- Fence lines, entrance markers, arrows, text callouts and two-point dimensions can be drawn, edited, locked, hidden and deleted.
- A fence line blocks no camera view until an obstruction is added; the offer to add one appears once.
- A dimension on a plan without a valid scale reads "Scale unknown".
- Deleting a callout keeps the photo or issue it referenced.
- Hiding markup changes no analysis and does not hide outstanding-work summaries.

### Story 7.5: Closets and port schedules

Covers: FR-51, FR-19 (ports and power). Screens: S-12.

- A closet groups its actual equipment and adds no cost or load.
- A port shows allocation and availability separately; a port on another floor can be planned before a route exists.
- Two people claiming one port cannot both succeed unnoticed; the conflict is shown on both.
- A faulty connected port keeps its record with a warning.
- Unknown loads make the power check Incomplete, never a pass.
- A controller terminal creates no Ethernet port or power source.

### Story 7.6: Cable runs between floors and the length ledger

Covers: FR-9, FR-52. Screens: S-13.

- One run keeps one identifier across its floor segments and riser.
- The PRD's worked example holds: 20 m and 12 m segments, a 6 m transition and 2 m of drops give 40 m; 2 m fixed and 10% give 46 m.
- The run appears on two sheets and once in totals.
- A missing component makes the estimate Incomplete with the known subtotal shown.
- A measured installed length is kept beside the estimate without adding allowance again.
- Routes migrated from story 2.9 are labelled as horizontal-only until reviewed.

### Story 7.7: Package sheets for the extended model

Covers: FR-33 (remaining contents). Screens: S-37.

- Packages include closet and port schedules, inter-floor continuations and length breakdowns, annotations by default, and analysis sheets that distinguish assessed views, illustrative previews, the resting view and reach.
- Each run is counted once across volumes.

## Epic 8: Backups and recovery

**Outcome.** Projects and the installation's own data are backed up daily, a project or a whole installation can be recovered, and a project can be moved as a portable backup.

This epic can start once Epic 4 is done.

### Story 8.1: Daily backups of projects and of the installation's data

Covers: FR-34, FR-70 (Backups), FR-71, AD-13. Screens: S-34, S-02.

- A complete backup of each project is made at least daily into separate storage, with a manifest of records and file hashes.
- The installation's own data is backed up on the same schedule: accounts with password hashes and two-step secrets, roles, memberships, settings with their protected secrets, and the activity log.
- Seven successful daily generations are kept, plus one before any update or data conversion. Rotation removes nothing from a live project or from the activity log.
- Administration shows each project's and the installation's latest backup, its age and any failure, and can start a backup. The Overview and Records show the project's backup age.
- A backup more than 24 hours old, or a failed one, is shown as a failure, not hidden.
- Backups and their failures appear in the activity log.

### Story 8.2: Restore one project into an isolated copy, then switch

Covers: FR-34, FR-70 (Backups), NFR-1, experiment R3. Screens: S-34.

- An administrator restores a project from a chosen backup into a separate copy, which is checked for identifiers, relationships, file hashes, snapshots, package files and the issued-design history.
- A failed or incomplete restore leaves the working project untouched.
- Making the copy current is a deliberate administrator action. It cancels that project's reviewer links, so Editors issue new ones, and signs nobody out.
- The restored project shows its recovery point and the possible loss window.
- Experiment R3 is run at full size and the elapsed time recorded against the 60-minute target.

### Story 8.3: Recover a whole installation

Covers: FR-34, NFR-5, AD-13.

- A documented procedure, run from outside the interface, rebuilds an installation from its backups: the installation's data and every project.
- Afterwards accounts, roles and memberships are as they were at the recovery point, every session is ended and every reviewer link is cancelled.
- Administrators see a notice naming the recovery point and asking them to review users and members changed since then.
- The recovery is demonstrated into an isolated destination within the 60-minute target and its elapsed time recorded.
- Live passwords for the site's own systems are in no backup.

### Story 8.4: Portable backup, out and back in

Covers: FR-34, FR-68, NFR-7, AD-14, experiment R5.

- An Editor or administrator creates a complete portable backup of a project as a job and downloads it; a Viewer cannot. Creation and transfer are reported separately.
- It contains records, snapshots, files and packages, and no accounts, passwords, sessions or links. The names of the people who acted travel as text.
- Importing one creates a new project and is allowed to whoever may create projects. Replacing a live project from a backup is an administrator action.
- In the receiving installation the actors' names show as recorded and are linked to no account, account approval assignments arrive unassigned, and members are set again.
- A backup made by a newer version than the installation is refused with an explanation.
- A PDF or CSV is never offered as a backup.
- Experiment R5 is run at full size.

### Story 8.5: Limits and usage

Covers: acceptance table for files and project content; FR-70 (limits shown).

- Each file limit and the 8 GiB project budget is enforced on the server.
- Usage is shown to Editors. Administration shows each project's stored size, and Settings show the storage limits and current usage, which cannot be raised from the interface.
- A warning appears before an operation would exceed a limit.
- Reaching a limit never truncates an export, lowers the quality of a kept original, removes history or loses saved work.

## Epic 9: Host it yourself and update from the interface

**Outcome.** An organisation can run Site Studio on its own server, and an administrator on either host can install a new signed release with one action and get the earlier version back if it fails.

Story 9.1 can start any time after Epic 2, since the core has run on both hosts since story 1.1. Stories 9.4 to 9.8 need Epic 8, because an update takes a backup first.

### Story 9.1: Run Site Studio on your own server

As an organisation's administrator, I want to run Site Studio on a Linux server with Docker, so that our data stays on our own machine.

Covers: FR-66 (self-hosted), NFR-7, AD-1, AD-16, experiment R12.

- The Node adapters for the project store, installation store, file store and jobs are complete, and the whole core test suite passes on both hosts.
- One Docker image and a Compose file start the application, the updater and an optional web server providing HTTPS. HTTPS is required.
- Records are kept on a persistent volume and survive a restart and an abrupt power loss with no acknowledged save lost.
- The installer asks for a backup location and the interface warns when it is the same disk as the live data.
- First-run set-up (story 1.2) works with the set-up code printed in the server output.
- Experiment R12 (SQLite durability and locking on a typical virtual-machine disk) is run and unsupported storage is documented.

### Story 9.2: Published installation instructions

As someone installing Site Studio, I want instructions I can follow without help.

Covers: FR-66 (instructions), SM-6.

- Instructions exist for a self-hosted server and for a Cloudflare account, and state which kinds of server are supported.
- A person who has not seen the project follows each from a fresh server and a fresh Cloudflare account to a working sign-in page, using nothing but the instructions; where they got stuck is recorded and fixed.
- The Cloudflare instructions cover deploying from the organisation's own copy of the repository and setting up one-step deployment for updates.

### Story 9.3: Signed public releases

As Kevin, I want a release produced the same way every time, so that installations can trust what they install.

Covers: FR-72 (publication), AD-19.

- Tagging a version starts a workflow that runs the full test suite against both hosts, builds the Docker image and the Cloudflare bundle, signs both and publishes a release with its version number and notes.
- The signature ties the build to this repository's release workflow; a build made any other way does not verify.
- Each release states the data-format version it needs.
- Making the repository public is Kevin's action on GitHub and is done when the first release is ready (K15), after a check that nothing private is in the history.

### Story 9.4: Data conversions between versions

Covers: NFR-8, AD-20.

- Every project store and the installation store record their data-format version.
- The server carries every conversion since the first release, so an installation two or more releases behind converts directly to the latest.
- Conversions run per project inside a transaction, after the pre-update backup.
- The server refuses to start against data newer than itself, with an explanation.
- Each new record shape arrives with its conversion and a test that converts data from the previous release.

### Story 9.5: Installed version and update check

Covers: FR-72 (version, check). Screens: S-35, S-28.

- Administrators see the installed version and when updates were last checked.
- The installation checks the public release list at least once every 24 hours while running, and on request. The request carries no project or user data.
- With a newer release, administrators see its version and notes and an update-available marker; a standard user sees neither.
- The check can be turned off; then nothing contacts the release list and the installed version is still shown.

### Story 9.6: Update a self-hosted installation from the interface

Covers: FR-72, NFR-8, FR-71, AD-21, UX decision D13. Screens: S-35.

- Only an administrator can start an update, and nothing installs without that action.
- The steps run in order: verify the signature; warn signed-in users; stop accepting changes of every kind; take a complete backup of every project and of the installation's data; install the new version and convert data; check that the sign-in page is served, a project opens and a save is acknowledged.
- A release with a bad signature is refused. If the signature or the backup fails, nothing is installed and changes are accepted again.
- Users see a warning before saving stops and a full-page notice while it runs; unsaved edits are still in their pages afterwards.
- The update and its outcome are recorded in the activity log.
- The same steps can be run from a command line on the server.

### Story 9.7: When a self-hosted update fails

Covers: FR-72 (return), NFR-8, FR-71, AD-21, experiment R11. Screens: S-35.

- If a step after installation begins fails, the earlier version and the backed-up data return, and the failed attempt is then recorded in the activity log so that the record survives the return.
- A return ends no sessions and cancels no reviewer links.
- If the return itself fails, the installation says so plainly, never reports success, and shows the manual recovery steps.
- Experiment R11 breaks an update at each step and confirms each outcome.

### Story 9.8: Update a Cloudflare installation from the interface

Covers: FR-72, NFR-8, AD-21, experiments R10 and R11. Screens: S-35.

- With one-step deployment set up, the Update control verifies the signature, warns users, stops accepting changes, takes the backup and starts the organisation's own deployment of the release, which converts data and runs the same check.
- A bad signature is refused and nothing is deployed.
- If the deployment, the conversion or the check fails, the earlier version is redeployed, the backed-up data returns and the failure is recorded afterwards.
- Without one-step deployment, the screen shows the exact steps to do it by hand, including the backup and the way back, and they work.
- Experiment R10 chooses the trigger and records what it needs stored. Experiment R11 is repeated on a test Cloudflare account, including whether redeploying an earlier version is dependable.

## Epic 10: Acceptance

**Outcome.** The proof of concept is measured against the PRD's acceptance profile on Cloudflare, and then on a self-hosted installation.

### Story 10.1: Acceptance fixtures and the workload manifest

Covers: acceptance profile, SM-5.

- A small functional project and a larger one exist: about 10 buildings, 600 devices including 150 cameras, 20 to 30 plans and about 60 cameras on the busiest plan.
- The manifest records plans, boundaries, geometry, zones, cameras against views and streams, connections, evidence volumes, hardware and network.
- Kevin confirms the larger fixture is representative before any benchmark is run.

### Story 10.2: Measure performance and accuracy on Cloudflare

Covers: NFR-4, SM-5.

- Each timed operation in the acceptance table is run on the Cloudflare installation in batches of 20, with at least 19 in each batch meeting its target; all results and outliers are kept.
- Optical and DORI references agree within 1% and zone references within 2 percentage points, at sampling no coarser than 1 m.
- Long file jobs are run three times at full size.
- Every miss is reported as a miss. No fixture is simplified to pass.

### Story 10.3: Walk the journeys on real devices

Covers: NFR-3, SM-1 to SM-4.

- UJ-1 to UJ-5 are completed on the Cloudflare installation, including the solo path with every approval bypassed.
- The desktop workflow and the administrator screens are shown on a Windows laptop in Chrome and Edge; the field tasks on a real iPhone and iPad in Safari and an Android phone in Chrome, with versions recorded.
- Signing in, two-step verification, accepting an invitation and changing a password are shown on each environment.
- Labels, keyboard access, focus, 200% zoom, touch alternatives to dragging and non-colour status are checked and recorded on both fixtures.
- Bypass, not installed, Fail, Not tested, Not applicable, closing with outstanding items and reopening each show a distinct, correct status on screen and in the package.
- Passing stories 10.2 and 10.3 is enough to accept the proof of concept on Cloudflare.

### Story 10.4: Repeat on a self-hosted installation and show both hosts are one product

Covers: NFR-7, SM-6.

- The runs of stories 10.2 and 10.3 are repeated on a self-hosted installation. Self-hosting is not described as supported until they pass.
- Following only the published instructions, a person installs on a fresh server and a fresh Cloudflare account, creates accounts with each role and sees role and membership limits enforced.
- On each host an update to a newer published release is installed from the interface with data intact, and a deliberately broken update returns to the earlier version.
- A project backed up on each host is restored on the other.
- On each host an administrator reviews the activity log and confirms that backups are succeeding.

## Open points for Kevin

1. **Accounts before the shared project.** The architecture's suggested order builds the project foundation first and accounts second. This draft puts accounts first (Epic 1), so the shared project is built on real sign-in from the start. Say if you would rather keep the architecture's order.
2. **Where self-hosting sits.** Epic 9 is late, but the server runs on both hosts in tests from story 1.1, and story 9.1 can be pulled forward to any point after Epic 2 if you want a self-hosted demo early.
3. **Epic 7 (extended modelling)** still comes after return visits. Say if you want pan/tilt/zoom cameras or closets and ports earlier.
4. **Experiments.** Each of R1 to R12 is attached to the first story that depends on it. A failed experiment brings its decision back to you before that story is called done.
5. **No estimates are given.** Sizing belongs to sprint planning, the BMAD step after an implementation-readiness check of the PRD, UX, architecture and these epics together.
