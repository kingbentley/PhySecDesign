---
title: "Site Studio — Epics and Stories"
status: draft 0.7; epic order and twelve product decisions confirmed by Kevin; story content and the remaining choices not yet confirmed
created: 2026-11-18
inputs: "final PRD 1.2 with amendments 1.3 and 1.4; UX design specification 0.6; architecture 3.1"
method: BMAD Create Epics and Stories; reviewed twice with BMAD Review
---

# Site Studio — Epics and Stories

This document breaks [final PRD 1.2 with amendments 1.3 and 1.4](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and experiments (R-numbers).

## Status

- **Draft 0.7**, 2026-11-18, last changed 2026-11-19. 11 epics, 175 stories, 2361 acceptance criteria. Nothing here has been built.
- **Confirmed by Kevin:** the epic order, and the twelve decisions listed under [Decisions made](#decisions-made).
- **Ruled on Kevin's instruction:** on 2026-11-19 Kevin asked Claude to recommend a ruling on every open choice and to proceed with its recommendations. Every choice below now carries one in its decision column, marked as Claude's and accepted on that instruction: all 16 decisions yes, 207 values and readings as written, and two values changed (CB-07 and CB-17). Kevin can overrule any of them.
- **Not confirmed:** the story boundaries and the acceptance criteria.
- **Reviewed:** drafts 0.5, 0.6 and 0.7 were each read by three independent reviewers ([review of 0.5](review-epics-draft-0.5.md), [review of 0.6](review-epics-draft-0.6.md), [review of 0.7](review-epics-draft-0.7.md)). Draft 0.7 applies the second review. From the third, the findings on the update stories and on story 1.18, and the structure findings on ruling (the decision column, the kind in each ID, tables by epic, experiment states), were applied on 2026-11-19; a second round on the update stories was applied the same day. The other structure findings are open.
- **Updates rewritten for K20 and K21:** on 2026-11-19 Kevin confirmed K20, the redesign of updates (AD-20 and AD-21), with seven fixes. The update stories were rewritten for it, then revised for the review's findings, which also produced K21, sixteen refinements to K20, confirmed by Kevin on 2026-11-19. A second review of the update stories led to K22, Claude's recommendations accepted on Kevin's instruction. Story 1.1, story 9.2 and story 9.3 to story 9.15 follow K21 and K22. Story 9.3 is now the update record and story 9.4 the conversions and the return. Story 9.1 and story 1.18 gained the two findings of experiment R13. The update stories as revised after the second round have not been reviewed a third time.
- **Not applied on purpose:** 30 of the 45 edge cases in the second review. They are handling for rarer situations and remain listed in that review. Leaving them out, and adding any that turn up when the story concerned is built, is Claude's recommendation, accepted on Kevin's instruction of 2026-11-19.
- **Agent access added (PRD amendment 1.3):** on 2026-11-19 Kevin approved the [sprint change proposal](../../sprint-change-proposal-2026-11-19.md) for AI agents. Story 1.1, story 1.3, story 1.8 and story 1.14 gained route declarations, reason codes, route classes and the actor's `via` field; story 1.19 adds personal access tokens; Epic 11 adds the API description, the MCP endpoint, results and import for agents, set-up on both hosts and its acceptance. Standing rule 2 now covers tokens. These additions have not been independently reviewed. Their choices are CG-01 to CG-09: CG-01 to CG-03 were decided by Kevin in the proposal, and CG-04 to CG-09 are open.
- **External tickets added (PRD amendment 1.4):** on 2026-11-19 Kevin approved the [sprint change proposal on external tickets](../../sprint-change-proposal-2026-11-19-external-tickets.md). Story 6.20 adds external tickets on issues, service visits and warranties, and story 11.2 lets an agent find and add them. Choices CE-41 to CE-47 are Kevin's, made in that proposal. Not independently reviewed.
- **Epic 11 reviewed:** on 2026-11-19 Epic 11 and story 1.19 were reviewed with two lenses ([review of Epic 11](review-epic-11.md)): 28 adversarial findings and 37 edge cases. Kevin asked for all of them to be applied, including three new rules (CG-10 to CG-12). Story 1.1, standing rules 2 and 12, Epic 10's introduction, story 1.19 and every Epic 11 story were revised. A second review of all the agent-access and external-ticket material found 63 more problems, applied in full on Kevin's instruction with seven new rules (CG-27 to CG-31, CE-48 and CE-49). The material has not been reviewed a third time. On 2026-11-19 Kevin also ruled on the remaining open choices of agent access: CG-04 to CG-09, CG-13, CG-15, CG-19, CG-26 and CG-36 as written, and CG-16 changed to the PRD's 10 MiB inventory limit with no separate row limit.
- Stories were split and renumbered in this draft. [Numbering changes from draft 0.6](#numbering-changes-from-draft-06) maps old numbers to new.

## Decisions needed from Kevin

Where no source document gave a rule or a value, the stories state one so that they can be built and tested. Each is marked on its criterion with an ID in brackets. Each now has a ruling in its decision column (see Status); the section keeps its name so that links to it still work.

**1. New behaviour or restrictions that no source states (29).** Each needed a yes or a no.

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CA-13 | 1.5 | Turning two-step verification off needs the password; a fresh set of recovery codes needs the password and a current code | No re-check for a signed-in user | No source states it; guards a session left open | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CG-03 | 1.19 | Agent access is off in a new installation until an administrator turns it on | On by default | Sprint change proposal choice D5 | Yes (Kevin, sprint change proposal, 2026-11-19) |
| CG-10 | 1.19 | An administrator's token reaches only projects the administrator is a member of | Every project, as the administrator's role allows | A stolen administrator token would otherwise reach every project (review A12) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-27 | 1.19 | Deactivating an account revokes its tokens for good | Suspend them and restore on reactivation | A reactivated account should not silently regain forgotten tokens (second review F14) | Yes (Kevin, applying the second review, 2026-11-19) |
| CG-28 | 1.19 | Removing the owner from a project drops it from tokens limited to chosen projects | Restore access when the owner is added back | A forgotten token should not silently regain a project (second review F15) | Yes (Kevin, applying the second review, 2026-11-19) |
| CB-19 | 2.16 | A saved survey entry cannot be edited or deleted; a correction is a new entry | Let the author edit an entry, keeping its history | NFR-1 keeps prior evidence unchanged and FR-21 protects evidence from undo | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-26 | 2.21 | Bundled web server gets and renews its certificate automatically, or uses operator-supplied files | Operator-supplied certificate files only | The architecture leaves the certificate method open; the two ways cover public and private servers | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-35 | 2.26 | A storage-full notice naming the volume is shown to administrators in Administration | Show the reason only on the failed save | Only an administrator can free space, and Administration is their one surface at this point | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-03 | 4.1 | A second revision with a name already used in the scope is refused | Allow repeated names, told apart by identifier and date | Revisions are picked by name in the timeline, the issue step and packages; the PRD does not say whether names may repeat | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-06 | 4.2 | A revision imported from a prototype file can be opened and compared but not restored | Offer restore, listing what the old file does not hold | The prototype's revisions hold less than a new snapshot, so a restore would blank content they never recorded | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-14 | 4.8 | Requesting a review is refused until a design reviewer is assigned | Allow a request with no assignee, open to any Editor or administrator | A request with nobody named leaves Awaiting decision with no one to act; no source states either way | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-17 | 4.9 | Once a revision is bypassed its state stays Bypassed; later decisions are kept and labelled "after the bypass" | A later Approve changes the state to Approved | FR-25 records bypass distinctly from approval; keeping the state stops a bypass being overwritten unnoticed | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-21 | 4.11 | A reviewer link still shows its revision but accepts no new comment or decision once its assignment is reassigned, its review is bypassed or its revision is superseded; reassignment does not revoke the previous reviewer's link, which the administrator's list shows as "Read-only: reviewer reassigned" | Keep accepting entries, labelled as late, as for accounts | The PRD says a link keeps pointing at its fixed revision but not whether it stays writable after the record has moved on | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-13 | 5.11 | A Pass whose required photo is still Uploading or Failed reads "Pass pending evidence" and is not counted | Refuse Pass until the photo is Saved | FR-30 requires the evidence for a Pass; NFR-2 forbids showing an incomplete upload as saved | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-20 | 5.17 | A resolved or deferred issue can be reopened with a reason | No reopening; raise a new linked issue | The PRD is silent; without it a wrongly resolved defect cannot be put right | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-25 | 5.20 | Run start and end times may be backdated and may not be in the future | Times fixed to the moment of entry | A person records them, often afterwards; a future time cannot be an observation | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-32 | 5.25 | With no active scope, field changes, survey and field notes and photos, run starts, revision restore, issuing or designating, and cancelling a proposal or correcting a record are refused as well | Accept notes and photos, recorded with no scope | The confirmed rule allows only issues and warranty or service records; each of these carries the active scope or changes the design reference | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-20 | 6.13 | A label or asset ID now used by another active device must be decided before the restore is confirmed | Allow the duplicate and flag both devices | No source covers a clash on restore. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-26 | 6.16 | While a project is archived, every reviewer link, including one to a closeout record, opens read-only and accepts no comment or decision | Keep accepting decisions on fixed records, such as final acceptance of a closeout | FR-37 pauses editing; no source says whether a review decision counts as editing. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-47 | 6.20 | Packages include external tickets only when chosen, off by default; the reviewer view never shows them | Always shown, or never | Internal tracker addresses often should not reach a client (E7) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |
| CE-48 | 6.20 | A link carrying a user name or password is refused | Store it as given | Tracker credentials would otherwise reach exports and backups (second review B30) | Yes (Kevin, applying the second review, 2026-11-19) |
| CE-49 | 6.20 | "Also on" stays within one project and never appears in exports or packages | Across every project the viewer can read | Keeps one customer's tickets out of another's records and documents (second review F4, F6, B28) | Yes (Kevin, applying the second review, 2026-11-19) |
| CF-13 | 8.8 | Recovery without the key needs a stated option, resets two-step verification for all and clears stored settings secrets | Refuse recovery without the key | Secrets encrypted with the key cannot be read; accounts must stay usable | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CG-11 | 11.2 | Downloading a project's portable backup is person only | Allowed to read tokens | A misled agent could otherwise take away whole projects (review A15) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-12 | 11.2 | An agent's change to a verified device clears its verified state; an agent's import row that would change a verified device goes to Needs review | Keep verified | FR-75: an agent's change never establishes a verified state (review A15, A16) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-29 | 11.2 | Only a person can undo an agent's tool call; an undo is refused if items changed since, and never restores verified | Let the token undo its own change | An undo through a token could re-establish a verified state or overwrite later work (second review B6, F19, F20) | Yes (Kevin, applying the second review, 2026-11-19) |
| CG-30 | 11.2 | Deletions made with a token can be reversed by a person; permanently removing files or a project is person only | Deletion by token is person only | Lets agents tidy drafts while keeping every loss recoverable (second review B23) | Yes (Kevin, applying the second review, 2026-11-19) |
| CG-31 | 11.2 | An agent may request a review; its assignee must be a person | Requesting a review is person only | A request decides nothing; the decision stays with a person (second review B33) | Yes (Kevin, applying the second review, 2026-11-19) |
| CG-09 | 11.3 | Where a calculation does not fit one request, agents get it as a job with a second route for the result | Refuse the calculation to agents | FR-77 requires the same results; AD-13's job pattern already exists | Yes (Kevin, 2026-11-19) |

**2. Values nobody specified (89).** Durations, sizes, counts and wording, set to conventional defaults. They can be confirmed as a group; changing one changes only the criterion that carries its ID. They are listed in [Values and readings](#values-and-readings) at the end.

**3. Readings of a source (155).** Places where a requirement could be read two ways and the stories follow one. Also listed at the end, grouped by epic, each with a column for Kevin's decision. They can be confirmed as a group or epic by epic; changing one changes only the criterion that carries its ID.

**4. Open points.**

- The structure findings of the [review of draft 0.7](review-epics-draft-0.7.md) not yet applied (S5 to S11 and S15): optional, none blocks building.

## Decisions made

Kevin, 2026-11-18. These are no longer open and are written into the stories.

1. After a project's only scope is closed and before it is reopened, Editors can raise issues and edit warranty and service-visit records. Other changes are refused with a message to reopen first.
2. On Cloudflare, an update warns users, stops changes and takes the backup before the signature is verified. This differs from the order FR-72 gives and applies to Cloudflare only.
3. Reviewer links expire 30 days after creation.
4. A reviewer link accepts several decisions, each kept.
5. Archiving is refused while a scope is in progress.
6. With nothing issued, the first Installed mark is recorded at once and the project shows a warning with a link to issue a design.
7. A floor held in any saved revision cannot be deleted.
8. A locked-out sole administrator recovers through a documented command run on the host or with the Cloudflare account. This is not in the PRD.
9. A partial outage in a reliability period counts in proportion to the share of covered devices affected.
10. Deleted drafts are not listed under Historical.
11. A mistaken cancellation or correction can be reversed with a reason.
12. Large stories are split and renumbered in this draft.

## How to review this draft

1. Read **Status**, **Decisions needed** and **Decisions made** above.
2. For each story, read the user-story sentence and the lines under **Core behaviour**. Those lines alone should describe the feature.
3. Sample the other groups (**Refusals and edge cases**, **Limits and values**, **Access and restore**, **Evidence to record**) where a story matters most to you.
4. Rule on the first table above; confirm or change the values and readings at the end.

## The epics

| Epic | Outcome | Stories |
| --- | --- | --- |
| 1. Install, sign in and manage people | An organisation can deploy Site Studio on Cloudflare, set it up, invite people, and control who can see and change each project. | 19 |
| 2. One shared project online | The existing design tool runs as one shared project, on Cloudflare and on your own server. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work. | 26 |
| 3. A workspace that holds the whole job | The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure. | 7 |
| 4. Design, estimate and issue | A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package. | 18 |
| 5. Install, test and close out in the field | A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package. | 28 |
| 6. Existing sites and return visits | An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact. | 20 |
| 7. Extended modelling | The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors. | 11 |
| 8. Backups and recovery | Projects and the installation's own data are backed up daily, a project or a whole installation can be recovered, and a project can be moved as a portable backup. | 14 |
| 9. Install from published instructions and update from the interface | Anyone can install Site Studio on either host from published instructions, and an administrator can install a new signed release with one action and get the earlier version back if it fails. | 15 |
| 10. Acceptance | The proof of concept is measured against the PRD's acceptance profile on Cloudflare, and then on a self-hosted installation. Passing story 10.2 to story 10.7 is enough to accept the proof of concept on Cloudflare; a self-hosted installation is not described as supported until story 10.8 and story 10.9 pass. | 9 |
| 11. Work with AI agents | An AI agent acting for a person can find, read and prepare work in Site Studio through a documented API or an MCP endpoint, on Cloudflare or on a private network, while approvals, issuing, closeout and field results stay with people. | 8 |

Each epic's own section states what it depends on.

## How to read it

- A story's criteria can be tested using only the stories before it.
- Each story has a user-story sentence, a **Covers** line naming the requirements, architecture decisions and experiments it delivers, and **acceptance criteria** grouped under up to five labels, always in the same order. Each criterion is one observable result.
- A **Notes** line, where present, says what the story leaves to a later story, or records an experiment's finding. It is not a criterion.
- An ID in brackets at the end of a criterion, such as (CA-03 · value), marks a choice listed in this document and says its kind: a decision (new behaviour, yes or no), a value, or a reading. The letter after C names the part of the plan it was written in: A for Epic 1, B for Epics 2 and 3, C for Epic 4, D for Epic 5, E for Epics 6 and 7, F for Epics 8 to 10, G for agent access (story 1.19 and Epic 11).
- Criteria draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** apply to every story and are not repeated in them.

### Standing rules

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every server route sits behind the access gate (AD-12). From Epic 2 on, each story's write paths are tested as an Editor and shown to be refused for a Viewer and for a signed-in user who is not a member. A Viewer can read and export whatever a story adds, and cannot change it, unless the story says otherwise. The one exception to the refusal is story 4.8: a Viewer who is the approval assignee can comment and decide. For a signed-in action, the actor recorded is always the signed-in account. An action through a reviewer link records the name the reviewer entered, marked not verified. Calls from the update workflow and the updater are a fourth kind of route, checked by the gate with the update secret (AD-20). Every route declares its class (AD-22). From Epic 2 on, each story's write routes are also called with a read-and-draft access token and shown to succeed, unless the route is person only, when the token is refused with "needs a person"; and called with a read-only token and shown to be refused. An action made with a token records its owner with `via` naming the token, and wherever a story shows or exports an actor, such an action shows the owner and "via agent" with the token's name. Approving or deciding a review, bypassing, issuing or designating, closing out or reopening a scope, recording a test outcome, an installed mark or a verified observation, archiving or un-archiving, restoring, creating a reviewer link, creating a project, downloading a portable backup, permanently removing files or a project, and undoing a change are person-only routes (FR-75). An agent may request a review; its assignee is a person. A deletion made with a token can be reversed by a person. A change made with a token to any field of a verified device clears its verified state. Each new administrator-only route is shown to refuse an administrator's token, each new reviewer-link route to refuse any token, and each write route to refuse a read-and-draft token on a project where its owner is a Viewer.
3. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
4. Fixed records and stored files are never modified (AD-3, AD-8).
5. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
6. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (architecture section 10, decision K6).
7. The server is one build for both hosts. Host-specific code lives only behind the file-store and update interfaces, and no platform feature outside the list in AD-16 is used. Server tests run in Cloudflare's runtime, and the self-hosted smoke suite is extended for each new area once story 2.24 has built it.
8. From the first published release onward, a changed record shape comes with its data conversion (AD-20). Before that release there is no earlier data to convert, and a change of record shape re-creates development and test installations instead of converting them. A conversion is the one permitted change to the shape of a fixed record: its content and its files are unchanged.
9. A story that adds a kind of record states, under Access and restore, whether a revision restore replaces it or leaves it unchanged.
10. Performance criteria are measured against the acceptance-size test project that story 2.11 generates. Until story 10.1 fixes the fixture's manifest with Kevin, those measurements guide development and are not acceptance evidence.
11. A save refused because something changed underneath it stays on the page, is not retried, and is labelled "not saved:" followed by the reason. Each story that adds a reason states its wording. An answer of "updating, try again shortly" is not a refusal: the edit stays unsaved and is sent again automatically, as after a lost connection (AD-20). So are the refusals of data newer or older than the server during or after an update.
12. A reply value whose source is not a member of the project, or that an agent added, is returned in the entered-text wrapper of story 1.1 with its source: reviewer-link entries, imported content (which keeps the source "import" after it is applied), names of uploaded files, text read from PDF plans, and anything a token wrote. A value a member edits becomes that member's. Sources and references survive restore and backup. A refusal names a field but never repeats an entered value (AD-22).

### Definition of done

A story is done when its criteria pass in Chrome against the locally run server, its automated tests pass, the self-hosted smoke suite passes once it exists, and the existing tests still pass. Where a criterion names a deployed Cloudflare test installation, another browser, or a real phone or tablet, it is tested there.

## Epic 1: Install, sign in and manage people

**Outcome.** An organisation can deploy Site Studio on Cloudflare, set it up, invite people, and control who can see and change each project.

**Depends on.** Nothing earlier and nothing later. Inside the epic each story needs only the stories before it.

**Why here.** Every later story needs to know who is acting and what they may do, so accounts come before the first shared project and no temporary access scheme is built and thrown away.

### Story 1.1: Run the app on Cloudflare with a portable server core

As an organisation's administrator, I want Site Studio served by one server build that runs on Cloudflare and also starts under the self-hosted runtime, so that my organisation can use either host.

Covers: AD-1, AD-16, AD-17, AD-20 (data-format version, conversion runner, one version at a time), AD-22 (route declarations, reason codes), architecture section 10, experiments R7 and R8.

**Core behaviour**
- When the local development command runs, the existing app loads from the locally run Worker through Cloudflare's Vite plugin.
- The existing unit and browser tests pass against that locally served app with no test changed or removed.
- The Worker has exactly two Durable Object classes, a project room and the installation object, each with SQLite storage.
- The file-store and update interfaces are defined in the server.
- The project room and the installation object each record a data-format version when first created, and a test reads it back after a restart.
- A conversion runner, when called, applies the listed conversions in order from the recorded data-format version to the build's version. It is never started by an object starting.
- The runner's list is empty, and a test with one sample conversion called directly shows the conversion applied once and the recorded version raised.
- Every build carries a release version. The entry code attaches it to every call to an object, and an object attaches its own to every call it makes to another object.
- An object that receives a call carrying a different version refuses the call and stops itself, so that it starts again on the code now deployed; the caller tries once more and otherwise answers "updating, try again shortly".
- A test calls a busy object with a version other than its own and finds the call refused, nothing written by it kept, and the object started again with a new start identifier.
- On a Cloudflare account on the Workers Paid plan, the deploy command makes the app reachable over HTTPS at a `workers.dev` address.
- The static "Sites" package and its test still work (K7).
- Every server route other than the application's own pages and files is under `/api/v1/`, and declares, in the shared module, a schema for its input and its reply; the only other addresses allowed are an MCP endpoint at `/mcp` and standard discovery addresses under `/.well-known/`, which declare their schemas in the same way.
- A request whose input does not match its route's schema is refused with the field named.
- Every refusal carries a reason code as well as its wording.
- The shared route declarations offer an entered-text value type, which wraps each value with its source (member, agent, reviewer link, import, file name or PDF text) and a reference to where it came from; at this point no route uses it.

**Refusals and edge cases**
- An object whose recorded data-format version is newer than the build's refuses requests with an explanation.
- An object whose recorded data-format version is older than the build's refuses requests and says that an update was not completed.
- An object stops itself at most once in 30 seconds; a call from a different version within that time after a stop is refused without stopping again. (CA-41 · value)
- The time of a stop is written to the object's own storage before it stops, so that the limit holds across the restart.
- A call marked as version-independent is answered whatever the caller's version; at this point no call is so marked.
- An object that uses its alarm for more than one kind of work keeps a schedule of due times and always sets its one alarm to the earliest; setting one never removes another.
- Each stop and each such refusal is written to the runtime log with both versions.

**Limits and values**
- The configuration for each host declares no D1, Workflows, Queues, scheduled-trigger or KV binding.
- Dependency versions are pinned, and a clean install from the lock file succeeds in continuous integration.

**Evidence to record**
- One server test runs inside Cloudflare's runtime using `@cloudflare/vitest-plugin`.
- A self-hosted configuration starts the same built bundle under Cloudflare's open-source runtime, and a smoke test in continuous integration shows a value saved, the process restarted, and the value read back.
- The HTTPS address is checked on a deployed Cloudflare test installation.

Notes: The version rule is in this story, not with the Update control, because the first update depends on the first release already obeying it (AD-20, K20). Left to later stories: the update record and its refusals (story 9.3); conversions and the return (story 9.4); moving between released versions (story 9.7 self-hosted, story 9.12 on Cloudflare). Experiments R7 and R8 were run early; see the experiments record. R7 met an install problem, which the pinned versions avoid or the repository documents.

### Story 1.2: Set up a new installation

As an organisation's administrator, I want a one-time set-up step that only the person who installed Site Studio can complete, so that I become its first administrator and nobody else can.

Covers: FR-66 (set-up; Cloudflare host), NFR-5 (password storage), AD-12, AD-21 (set-up code on redeploy). Screens: S-25.

**Core behaviour**
- The Cloudflare deploy command generates a random set-up code, supplies it to the installation as a secret and prints it once in the deployment output. (CA-01 · value)
- An installation with no users shows the set-up page when opened.
- The step asks for the set-up code, the installation's name and the first administrator's name, email and password.
- The page states that it disappears once an administrator exists.
- On completion exactly one administrator exists, and the page confirms the installation's name and the administrator's email.
- The password is stored only as a salted scrypt hash (N = 131,072, r = 8, p = 1, a 32-byte result), with the parameters stored beside the hash.

**Refusals and edge cases**
- Once any user exists, the set-up page and its request are refused, and the set-up code no longer works.
- A wrong or missing set-up code is refused.
- Two set-up requests sent at the same moment create one administrator; the second is refused.
- Deploying again to an installation that has an administrator generates no set-up code and does not make set-up available.
- Deploying again to an installation with no users prints a new set-up code, and the earlier code stops working. (CA-02 · reading)
- On a deployed Cloudflare test installation, a plain HTTP request is redirected to HTTPS or refused.
- Of two test installations deployed from the same build, completing set-up on one leaves the other still offering set-up with its own code.

**Limits and values**
- The set-up code has at least 20 characters. (CA-01 · value)
- The password must have 12 to 128 characters and must not equal the account's email address; there are no other composition rules. (CA-03 · value)
- The installation's name must be 1 to 80 characters. (CA-04 · value)
- After 5 wrong codes, further attempts from any address are refused for 1 minute, doubling after each further failure up to 15 minutes, and the page says how long to wait. (CA-05 · value)

**Access and restore**
- A revision restore leaves accounts and the installation's name unchanged.

Notes: Left to later stories: the sign-in page showing the installation's name, and two installations sharing no sign-in or session (story 1.3); two installations sharing no project (story 1.7) and no file (story 2.25); the self-hosted set-up code, printed in the server output (story 2.21); installation instructions (story 9.1).

### Story 1.3: Sign in and sign out

As an administrator, I want to sign in with my email and password and sign out again, so that only I can act as my account.

Covers: FR-67 (sign-in, sign-out), NFR-5, AD-12, experiment R9. Screens: S-26.

**Core behaviour**
- An installation that has an administrator shows the sign-in page, with the installation's name, to anyone not signed in.
- The administrator created in story 1.2 signs in with their email and password.
- The session is held in a cookie that scripts cannot read, marked Secure and SameSite=Lax.
- The server stores only a hash of the session token.
- An account menu in the existing header shows the signed-in user's name and Sign out.
- Sign out ends the session, and a later request with its cookie is refused.

**Refusals and edge cases**
- A wrong email or password gives one message, whether or not the email has an account.
- After repeated failed sign-ins, further attempts are refused for a wait, and the page says how long to wait. (CA-07 · value)
- The wait is the same for an email with no account.
- A successful sign-in clears that email's failure count.
- The count of failed sign-ins for an email address is kept by the entered address in a short-lived store, and is not read from any log, so it applies equally to an address that has no account.
- A request that changes anything with a session cookie, and a sign-in request, is refused unless it comes from the app's own origin and carries the header the app adds, so that another site cannot sign a person in to an account of its choosing.
- An account of one test installation cannot sign in to another deployed from the same build, and a session cookie from one is refused by the other.

**Limits and values**
- The failure message reads "That email and password do not match."
- The wait starts after 5 failed sign-ins in a row for one email, or 20 from one network address within 15 minutes. (CA-07 · value)
- The wait is 1 minute, doubling after each further failure up to 15 minutes. (CA-07 · value)
- The sign-in fields are labelled, use 16 px text and can be filled by a password manager.

**Access and restore**
- A revision restore leaves sessions unchanged.

**Evidence to record**
- On a deployed Cloudflare test installation the scrypt hash is accepted without a platform error, and sign-in completes in under 1 second at the median of 20 sign-ins. (CA-08 · value)
- A password hash made on one host verifies on the other.

Notes: Left to later stories: invitations (story 1.4); the second sign-in step (story 1.5); My account in the account menu (story 1.6); the activity log, which records a failed sign-in for an address with no account only as "unknown address" and so cannot supply the failure count (story 1.14); "Forgot password" (story 1.17). Experiment R9 was run on 2026-11-19: Cloudflare refuses a PBKDF2 call above 100,000 iterations, so the 600,000-iteration hash first planned was replaced by scrypt, which worked on both hosts with identical results and added about 0.36 s to a request on Cloudflare.

### Story 1.4: Invite a person

As an administrator, I want to invite a colleague who then sets their own password, so that each person has their own account.

Covers: FR-67 (invitation), AD-12. Screens: S-27, S-30 invite panel.

**Core behaviour**
- An administrator's account menu holds "Invite a person", which opens the invite panel.
- An administrator invites a person by email, name and role (administrator or standard user) and receives a link to copy.
- The invitation page shows who invited the person and the installation's name.
- The person sets a name and a password and is signed in.
- The password must meet the password rules of story 1.2, and the page shows each rule as it is met.
- The new password is stored in the form story 1.2 states.

**Refusals and edge cases**
- There is no open registration: no page or request creates an account without an invitation.
- An invitation works once.
- A used or expired link says so and tells the person to ask an administrator for a new one.
- Inviting an email that already has an account is refused, and the administrator is told so. (CA-10 · reading)
- Inviting an email that has an unused invitation replaces the earlier link, which stops working. (CA-10 · reading)
- A standard user's account menu has no "Invite a person", and a standard user's invite request is refused.

**Limits and values**
- An invitation expires 7 days after it is issued. (CA-09 · value)

**Access and restore**
- A revision restore leaves invitations unchanged.

Notes: Left to later stories: the invite action moves into Administration, with pending invitations listed and cancellable (story 1.10 and story 1.11); refusing an invitation for a deactivated account (story 1.10); the administrator changing how long an invitation lasts (story 1.15); sending the link by email (story 1.17).

### Story 1.5: Two-step verification

As a designer, I want to protect my account with an authenticator app, so that a stolen password is not enough.

Covers: FR-67 (two-step verification), AD-12, AD-17, AD-21 (deployment key), UX decision D14. Screens: S-26, S-27, S-29.

**Core behaviour**
- A user turns it on by scanning a code and confirming with one generated code.
- The user is then shown recovery codes once, with Copy and Download; the codes cannot be displayed again.
- With it on, a correct password alone does not sign in; a current code does.
- "Use a recovery code" accepts a recovery code in place of a generated code, once.
- The account page shows how many recovery codes remain.
- A user makes a fresh set of recovery codes by giving their password and a current code, and the old set stops working. (CA-13 · decision)
- A person who has just accepted an invitation is offered two-step set-up and can skip it.
- Recovery codes are stored only as hashes.
- The authenticator secret is stored encrypted with a deployment key that the deploy command generates and supplies to the installation as a secret. (CA-14 · reading)
- The deploy command prints the deployment key once, when it creates it, with an instruction to keep a copy outside the Cloudflare account.
- When the operator supplies a deployment key kept from an earlier installation, the deploy command uses it and generates none.

**Refusals and edge cases**
- A code that has been accepted is refused if used again.
- Wrong codes and wrong recovery codes count toward the same limit and wait as wrong passwords in story 1.3. (CA-15 · reading)
- Turning it off asks for the password. (CA-13 · decision)
- Neither the authenticator secret nor a recovery code appears in any reply after set-up.
- The deploy command generates the deployment key only when the installation has none: a test deploys again and then signs in with a two-step code set up before.

**Limits and values**
- A set holds 10 recovery codes. (CA-11 · value)
- Codes are 6 digits and change every 30 seconds; a code from the step just before or just after the current one is accepted. (CA-12 · value)
- The code field asks for a numeric keypad and offers code autofill on a phone.

**Access and restore**
- A revision restore leaves two-step set-up and recovery codes unchanged.

Notes: Left to later stories: the two-step controls on the My account page (story 1.6 places them there); reset or requirement by an administrator for one user (story 1.11); requirement for everyone (story 1.16); the self-hosted key file (story 2.23).

### Story 1.6: My account and sessions

As a designer, I want to manage my password and see where I am signed in, so that I stay in control of my access.

Covers: FR-67 (password change, sessions, sign out everywhere, session end), UX section 17.3. Screens: S-29.

**Core behaviour**
- My account is reached from the account menu and shows the user's name and email, with the two-step controls of story 1.5.
- A user changes their name.
- A user changes their password by giving the current one; the new one must meet the password rules of story 1.2.
- A password change signs out every other session of that account. (CA-16 · reading)
- A user sees each signed-in session with its device (browser and system), time of last use and network address, with the current session marked.
- A session shows a country or city where the host supplies one. (CA-17 · reading)
- "Sign out everywhere else" ends the other sessions, and each is refused on its next request.
- A session ends after a period without use. (CA-19 · reading)
- Only a request that results from something the person does, such as opening a page, saving, uploading or any other deliberate action, counts as use of the session. (CA-19 · reading)
- A request the page sends by itself, such as an automatic check for other people's changes, does not count as use, so a page left open still reaches the idle limit. (CA-19 · reading)
- When a session ends while a page is open, the page asks the user to sign in again in place.
- After the same account signs in, input pending on that page, such as an unsaved name on My account, is still there and can be saved.

**Refusals and edge cases**
- If a different account signs in on that page, the earlier account's pending input is neither shown to it nor sent. (CA-20 · reading)
- That input stays bound to the earlier account and is offered again only when that account signs in on the same browser. (CA-20 · reading)

**Limits and values**
- The period without use is 24 hours. (CA-18 · value)

Notes: Left to later stories: ending sessions by deactivation (story 1.9); the administrator changing the 24-hour period (story 1.15); pending project edits kept the same way (story 2.3); an upload in progress counting as use and resuming after sign-in (story 2.9).

### Story 1.7: Projects list and creating a project

As a designer, I want to land on my projects after signing in, so that I can open the property I work on.

Covers: FR-66 (installations share no projects), FR-68 (project creation), UX decision D11. Screens: S-28.

**Core behaviour**
- After signing in, an administrator sees every project by name, and a Create project action.
- An administrator creates a project by giving its name; it appears in the list without reloading the page, and its creator is recorded.
- Each project has its own address, and opening a project from the list goes to that address.
- A project's address loads the existing app, whose data is still held only in the browser.
- A user whose list holds exactly one project, an administrator included, goes straight to it after signing in. (CA-22 · reading)
- The projects list is reachable from the account menu and by its own address, including for a user who was sent straight to a project.

**Refusals and edge cases**
- A standard user sees no Create project action, and a standard user's create request is refused.
- A project created on one test installation is not listed on, and its address is refused by, another deployed from the same build.

**Limits and values**
- A project's name has 1 to 120 characters, and two projects may have the same name. (CA-21 · value)
- A user with no project sees "You have not been added to a project yet. Ask an administrator."

**Access and restore**
- A revision restore leaves a project's name and recorded creator unchanged.

Notes: Left to later stories: membership, so until then every standard user sees the empty message (story 1.8); project data held on the server, and scope state and last activity on the list (story 2.1); the attention count (story 5.18); project creation by standard users (story 1.15).

### Story 1.8: Project membership and the access gate

As an administrator, I want access decided by role and project membership on the server, so that people see and change only what they should.

Covers: FR-68, FR-69, NFR-5, AD-12, AD-17, AD-22 (route classes, the actor's via field).

**Core behaviour**
- Every request passes one access gate that identifies the caller and decides from their installation role and project membership.
- An administrator's server functions add a user to a project as Editor or Viewer, change that role and remove the user.
- A standard user's project list shows only the projects they belong to, each with their role; an administrator's list shows every project.
- Server tests, using one test route marked as a project read and one marked as a project change, show the gate's decision for each case: an administrator may read and change any project, an Editor may read and change their own project, a Viewer may read their project and is refused any change, and a non-member and an ended session are refused.
- Removing a member or changing a role takes effect on that person's next request: a test changes a role and shows that the very next request is decided by the new role, with no delay from any held lookup.
- The actor recorded on every action is the signed-in account and its name at the time, supplied by the gate.
- The actor record has a `via` field, empty for a signed-in person.
- After a user is renamed, records made earlier, such as a project's creator and an invitation's sender, still show the earlier name.

**Refusals and edge cases**
- Every route declares one class: public, reviewer link, read, draft change, person only, administrator only or update secret; a test route that declares none is refused.
- A signed-in Editor is accepted on a test route marked person only, and decided by role and membership as on any other change.
- The membership functions called by a standard user, including an Editor of that project, are refused.
- A signed-in standard user who requests the address or the record of a project they do not belong to is refused by the server.
- A change refused because access changed (no longer a member, or role too low) returns a reason distinct from "not signed in".
- A request that names a different actor in its body is recorded under the signed-in account.

**Access and restore**
- A revision restore leaves a project's members and their roles unchanged.

Notes: Left to later stories: installation roles and deactivation (story 1.9); the screens for members (story 1.12); a Viewer reading an open project and being refused a save (story 2.1); pending project edits refused because access changed (story 2.3); the Viewer who is an approval assignee (story 4.8). Downloads and exports are shown under the gate by the stories that add them.

### Story 1.9: Installation roles, deactivation and the last administrator

As an administrator, I want to change a person's installation role and deactivate an account, so that access ends when it should and one administrator always remains.

Covers: FR-67 (deactivation), FR-68 (installation role, last administrator), NFR-5, AD-12.

**Core behaviour**
- An administrator's server functions change a user's installation role, deactivate an account and reactivate it.
- A deactivated account cannot sign in.
- Deactivating an account ends all of its sessions at that moment, and each is refused on its next request.
- After the account is reactivated, a cookie from a session that existed before the deactivation is still refused, and the person must sign in again.
- A reactivated user can sign in again with the same password.
- A role change takes effect on that person's next request.
- Records a deactivated user made earlier, such as invitations sent and projects created, still show their name.

**Refusals and edge cases**
- The same functions called by a standard user are refused.
- The gate's server tests of story 1.8 gain the case of a deactivated account, which is refused.
- A change refused because the account was deactivated returns the access-changed reason of story 1.8.
- The last administrator cannot be demoted or deactivated.
- Only active accounts that have accepted their invitation count as administrators for this rule. (CA-23 · reading)
- Two requests sent at the same moment that would together remove the last two administrators leave one administrator; the second request is refused.

Notes: Left to later stories: the screens for these actions (story 1.10); cancelling a deactivated account's links (story 1.11).

### Story 1.10: Administration: users

As an administrator, I want one place to see and manage people, so that I can give and withdraw access without help.

Covers: FR-70 (Users), FR-67 (deactivation), UX decision D10. Screens: S-30.

**Core behaviour**
- Administration is a separate area reached from the account menu, with Users in a left-hand list.
- The Users table shows name, email, role, state (Invited with the invitation's expiry, Active, Deactivated), two-step verification (On or Off), projects and last sign-in.
- Invite is in Users, and the account-menu action of story 1.4 is removed.
- When inviting, an administrator optionally chooses projects and a role in each, which apply when the invitation is accepted.
- A user's detail lets an administrator change the name and installation role, sign the user out everywhere, deactivate and reactivate.
- Deactivating explains that the person's records keep their name.

**Refusals and edge cases**
- A standard user does not see Administration, cannot open its pages by address and is refused by each of its server functions.
- Inviting the email of a deactivated account is refused, and the administrator is told the account is deactivated. (CA-10 · reading)
- The last administrator's role and Deactivate controls are disabled, with the reason shown.
- When an administrator's role is removed while they have an unsaved change open in Administration, the save is refused and shown as "not saved: access changed".
- What they entered stays on the page and is not retried.

Notes: Left to later stories: reset links, two-step reset and requirement (story 1.11); Projects (story 1.12); Activity (story 1.14); Settings (story 1.15); Reviewer links (story 4.11); Backups (story 8.3); Software (story 9.6).

### Story 1.11: Administration: reset links and two-step control

As an administrator, I want to issue a password reset, and reset or require two-step verification for one person, so that I can get a colleague back in and keep their account protected.

Covers: FR-70 (Users: require or reset two-step verification, issue a password reset), FR-67 (administrator reset link). Screens: S-27, S-30.

**Core behaviour**
- A user's detail lets an administrator issue a password reset link, which the administrator copies.
- Using the link sets a new password and ends all of that account's sessions. (CA-25 · reading)
- A password reset leaves two-step verification on. (CA-25 · reading)
- A user's detail lets an administrator reset that user's two-step verification: the user then signs in with the password alone and is offered set-up again.
- After a reset, the user's old recovery codes no longer work. (CA-26 · reading)
- A user's detail lets an administrator require two-step verification for that user, and remove the requirement.
- A user for whom it is required and who has not set it up must do so at their next sign-in before doing anything else, and a session already signed in can do nothing but set it up from its next request.
- The Users table shows "Required but not set up" for such a user.
- Users lists unused invitations and reset links with their expiry, and each can be cancelled.

**Refusals and edge cases**
- A reset link works once.
- A cancelled link says it is no longer valid.
- Deactivating an account cancels its unused invitation and reset links. (CA-28 · reading)
- An invitation or reset link opened for an account that has since been deactivated is refused. (CA-28 · reading)
- While two-step verification is required for a user, their attempt to turn it off is refused with the reason.

**Limits and values**
- A reset link issued by an administrator expires after 24 hours. (CA-24 · value)

**Access and restore**
- A revision restore leaves reset links and two-step requirements unchanged.

Notes: Left to later stories: requiring two-step verification for everyone (story 1.16); reset by email (story 1.17).

### Story 1.12: Administration: projects and members

As an administrator, I want to see every project and manage who belongs to each, so that the right people can open the right properties.

Covers: FR-70 (Projects), FR-68. Screens: S-31.

**Core behaviour**
- Administration's left-hand list gains Projects.
- The Projects table shows every project with its name, members and creation date, and has Create project.
- A project's row opens its members: add a user as Editor or Viewer, change a role, remove.
- Removing explains that the person's earlier entries stay.

**Refusals and edge cases**
- The members controls are absent for a standard user who is the project's Editor.

Notes: Left to later stories: scope state and last activity in the table (story 2.1); Archive and Un-archive (story 6.16); latest backup (story 8.3); stored size (story 8.14).

### Story 1.13: Recovery when the only administrator is locked out

As the person who controls my organisation's Cloudflare account, I want a command that lets a locked-out administrator back in, so that losing a password or a phone does not lose the installation.

Covers: FR-70 (administrator recovery, Cloudflare host), AD-12.

**Core behaviour**
- A command documented in the repository, run by a person who controls the Cloudflare account, names an administrator account and prints a one-time recovery code.
- With the code, that account sets a new password and has its two-step verification reset. (CA-29 · reading)
- Using the code ends all of that account's sessions.

**Refusals and edge cases**
- The code works once.
- A wrong or expired code is refused.
- No page or request in the app issues a recovery code.

**Limits and values**
- The code expires 1 hour after it is printed. (CA-30 · value)

Notes: Left to later stories: the activity-log entries for issuing and using the code (story 1.14); the self-hosted form of the command (story 2.23); the command in the published instructions (story 9.1).

### Story 1.14: Activity log

As an administrator, I want a log of sign-ins and administrative changes, so that I can see what happened and when.

Covers: FR-71. Screens: S-36.

**Core behaviour**
- Administration's left-hand list gains Activity, which shows each entry's time, actor, what changed and detail, newest first.
- Sign-in events add entries: sign-in, failed sign-in including a failed second step, sign-out and sign out everywhere.
- Credential events add entries: password change and reset, recovery codes renewed, and two-step verification turned on, turned off, reset, required and no longer required for a user.
- Invitation and link events add entries: invitation issued, accepted and cancelled, and reset link issued and cancelled.
- Account and project events add entries: set-up completed, role and membership changes, deactivation and reactivation, and project creation.
- Issuing and using the recovery code of story 1.13 each add an entry; the issue is recorded as made from the host, with the account it names.
- A failed sign-in entry records the network address, and the email only when it matches an account. (CA-32 · reading)
- When the text entered matches no account, the entry reads "unknown address" and the text entered is not stored. (CA-32 · reading)
- Failed sign-ins and administrative changes are each marked by an icon and a label.
- An administrator filters by person, kind of event and date, and exports the filtered log as a CSV file. (CA-31 · value)

**Refusals and edge cases**
- No entry contains a password, token, code or link: a test signs in, invites, resets and fails a sign-in, then searches the stored log for each secret used and finds none.
- No page or server function edits or removes an entry.
- A standard user cannot open Activity or call its functions.

**Limits and values**
- Entries are never removed by age: an entry given a date several years in the past in a test is still listed and exported.

**Access and restore**
- A revision restore leaves the activity log unchanged.

Notes: Left to later stories, which add their own events: settings changes (story 1.15); access tokens and actions made with them (story 1.19); reviewer links and link decisions (story 4.10 and story 4.11); archiving (story 6.16); backups and restores (Epic 8); updates (Epic 9). The log is included in the installation's backups by Epic 8.

### Story 1.15: Settings: installation, sign-in and maps

As an administrator, I want to set how the installation behaves, so that it fits my organisation.

Covers: FR-70 (Settings), FR-67 (session period, invitation life), FR-68 (project creation by standard users), FR-71 (settings changes), AD-17. Screens: S-33.

**Core behaviour**
- Administration's left-hand list gains Settings, grouped as Installation, Sign-in and Maps.
- Each group saves on its own and says what changed.
- Installation holds the name, and a changed name shows on the sign-in page.
- Sign-in holds the period without use after which a session ends, how long an invitation lasts, and whether standard users may create projects.
- A changed session period applies to existing sessions on their next request. (CA-34 · reading)
- A changed invitation life applies to invitations issued afterwards. (CA-34 · reading)
- When standard users are allowed to create projects, a standard user sees Create project, creates one, becomes its Editor and cannot add members.
- Maps holds optional provider keys; a saved key is stored encrypted with the deployment key of story 1.5.
- A saved secret is shown in Settings only as its last characters, never again in full. (CA-35 · value)
- Each change is recorded in the activity log with the earlier and new value, except that a secret is recorded only as changed.

**Refusals and edge cases**
- A value outside a setting's bounds is refused with the bounds shown.
- When project creation by standard users is turned off again, projects already created keep their members. (CA-36 · reading)

**Limits and values**
- The session period accepts 15 minutes to 30 days. (CA-33 · value)
- The invitation life accepts 1 to 30 days. (CA-33 · value)
- A saved secret shows its last 4 characters. (CA-35 · value)
- The Maps group states beside the Google mapping key that this key is visible in the browsers of signed-in users. (CA-37 · reading)

**Access and restore**
- A revision restore leaves settings unchanged.

Notes: Left to later stories: requiring two-step verification (story 1.16); the Email group (story 1.17); delivering the Google mapping key to members' browsers and removing the prototype's per-session key dialog (story 2.7); the Limits group (story 8.14); the GitHub token for Cloudflare updates, stored the same way (story 9.13).

### Story 1.16: Require two-step verification for everyone

As an administrator, I want to require two-step verification for every account, so that no account in my organisation is protected by a password alone.

Covers: FR-67 (required two-step verification), FR-70 (Settings), AD-12. Screens: S-27, S-30, S-33.

**Core behaviour**
- The Sign-in group of Settings gains "Require two-step verification".
- When it is turned on, a user without two-step verification must set it up at their next sign-in before doing anything else.
- A session already signed in without it can do nothing but set it up from its next request.
- A person accepting an invitation must set it up before doing anything else.
- The Users table shows "Required but not set up" for every account without it.
- Turning the setting on or off is recorded in the activity log.

**Refusals and edge cases**
- While it is required, a user's attempt to turn two-step verification off is refused with the reason.
- An administrator can still reset a user's two-step verification, and that user must then set it up again at their next sign-in.

Notes: This story applies to every account the behaviour that story 1.11 builds for one user.

### Story 1.17: Optional email and forgotten passwords

As an administrator, I want Site Studio to send invitations and password resets by email when I connect an email service, so that I do not have to pass every link on by hand.

Covers: FR-67 (reset by email), FR-70 (Settings: optional email sending), AD-18. Screens: S-26, S-30 invite panel, S-33.

**Core behaviour**
- Settings gains an Email group: off, or the details of an HTTP email service, whose key is stored and shown as story 1.15 states for secrets.
- With an HTTP email service configured, "Send a test message" reports success or the service's error.
- With email working, the invite panel offers "Email it" beside the link to copy.
- With email working, "Forgot password" on the sign-in page sends a reset link.
- Using the emailed link sets a new password, ends all of that account's sessions and leaves two-step verification on.
- Without email, "Forgot password" says "Ask an administrator for a reset link".
- Without email, every invitation and reset is a link the administrator copies, and nothing else stops working.
- A change to the Email group and each reset link sent are recorded in the activity log, without the link.

**Refusals and edge cases**
- A failed invitation send is reported with the link still offered.
- "Forgot password" gives the same reply for every email, and no message is sent for an unknown or deactivated account. (CA-39 · value)
- An emailed reset link works once.

**Limits and values**
- An emailed reset link expires after 1 hour. (CA-38 · value)
- At most 3 reset messages are sent to one account in an hour. (CA-39 · value)

Notes: Left to later stories: SMTP (story 1.18).

### Story 1.18: Experiment R13: email by SMTP on both hosts

As an administrator who runs my own mail server, I want to know whether Site Studio can send by SMTP, so that I am offered it only if it works on my host.

Covers: AD-18, experiment R13.

**Core behaviour**
- If R13 passed on both hosts, the Email group offers SMTP server details, with the password stored and shown as story 1.15 states for secrets, and "Send a test message" works through SMTP. (CA-40 · reading)
- If R13 did not pass on both hosts, the Email group offers only the HTTP email service. (CA-40 · reading)
- R13 passes on a host when a message sent from that host by SMTP, signing in with a user name and password, is delivered to a real mailbox; a connection that reaches the point of signing in is not a pass.
- Where SMTP is offered, the self-hosted configuration has a documented deployment setting that allows outbound connections to a mail server on a private network and adds an organisation's own certificate authority to those the runtime trusts.

**Refusals and edge cases**
- Without that setting, a self-hosted installation refuses to connect to a mail server on a private address or one whose certificate comes from an authority the runtime does not trust.
- On Cloudflare, the Email group states that a mail server on a private address and port 25 cannot be reached, and points to no deployment setting.
- The SMTP password is sent only over an encrypted connection: a server that offers neither encryption from the first byte nor an upgrade to it is refused, and the test message says that the server does not offer a secure connection.
- A failure after the connection was made and while encryption was being set up is reported as the secure connection to the mail server failing, with the reason in the server log; the message does not guess a reason.
- A failure before a connection was made is reported as the server not being reached, and a refusal by the server gives the server's reply.
- On a self-hosted installation, the Email group states, beside the SMTP server details, that a private mail server or a private certificate authority needs the deployment setting and cannot be enabled from Settings.

**Limits and values**
- Connecting to the mail server times out after 10 seconds and each reply after 30 seconds, and the test message reports which timed out. (CA-42 · value)

**Evidence to record**
- Experiment R13 has a recorded result on a deployed Cloudflare test installation for a message sent by SMTP through the runtime's outbound sockets, signing in to a real mailbox: delivered, which is a pass, or not delivered, with the reason, which leads to the HTTP-only Email group above.
- Experiment R13 has a recorded result for the same send under the self-hosted configuration of story 1.1.
- Under the self-hosted configuration, a test mail server on a private address with a certificate from a test authority is refused without the deployment setting and accepts a message with it, and the result is recorded.
- A send to a server whose certificate names another host, and one to a server whose certificate comes from an untrusted authority, each produce the secure-connection message above, and the runtime log is checked to hold the reason.

Notes: The self-hosted image is story 2.21; this experiment uses the configuration of story 1.1 because it comes earlier. R13 was run early on 2026-11-19. From Cloudflare, encrypted connections to two public mail services reached the point of signing in, and port 25 is prohibited there; a complete delivery from Cloudflare was not shown. On a server a message was delivered with both usual forms of encrypted SMTP; it found that a mail server on a private network or with a private certificate authority needs a line of runtime configuration, and that certificate failures reach the application only as a generic error, with the reason in the server log.

### Story 1.19: Personal access tokens for agents

As a designer, I want to give an AI agent its own token that acts for me, so that it can prepare work in my projects while I keep the decisions and can cut it off at any time.

Covers: FR-73, FR-74, FR-75 (refusal of person-only routes), FR-76 (agent-access switch), NFR-5 (tokens), AD-5, AD-12, AD-17, AD-22. Screens: S-29, S-30, S-33, S-36, S-38, S-39, S-40.

**Core behaviour**
- Settings gains an Agent access group with an on/off switch, off in a new installation, and the maximum token lifetime. (CG-03 · decision)
- My account gains Access tokens. While agent access is on, Create token asks for a name, the kind (Read only, or Read and draft), all of my projects or chosen ones, and an expiry. (CG-01 · reading)
- The created token is shown once with Copy, beside the addresses of the API and the MCP endpoint, and "You will not see this token again."
- The installation object stores only the SHA-256 hash of the token, with its owner, name, kind, projects, expiry and last use; a request's token is found by its hash and compared in constant time.
- A token is accepted only in the `Authorization: Bearer` header.
- A request with a token is decided by the gate as its owner, limited by the token's kind and projects.
- "All of my projects" is checked against the owner's membership at each request, so it covers projects joined later and drops projects left.
- An administrator's token reaches only projects the administrator is a member of, never every project in the installation, and the project list called with it returns only those projects. (CG-10 · decision)
- An administrator becomes a member of a project as anyone else does, through the project's members.
- A read-only token is accepted on read routes only; a read-and-draft token also on draft-change routes.
- A read-and-draft token is decided per project by the owner's role there: it may change a project where its owner is an Editor and only read one where its owner is a Viewer.
- A test route marked person only refuses every token with the reason code and wording "needs a person", and the same route accepts the owner signed in.
- An administrator-only route refuses every token, including an administrator's, with "needs a person".
- A public route accepts a request carrying a token and ignores the token; a reviewer-link route and an update-secret route refuse a token. (CG-22 · reading)
- Every draft change made with a token carries an operation identifier, held per token for 24 hours, and a repeated identifier returns the stored result without applying the change again (AD-5). (CG-33 · value)
- An operation identifier carries the time it was made, and its age is measured on the server's clock: one dated more than 5 minutes ahead of the server is refused with "identifier from the future", and one more than 24 hours old is refused with "identifier expired". (CG-33 · value)
- A stored result is kept until 24 hours after its identifier's time, so every identifier still accepted finds its result and a late retry never repeats a change. (CG-33 · value)
- A repeated identifier sent with a different request is refused with "identifier reused".
- A change made with a token is recorded under its owner and the owner's name at that time, with `via` naming the token.
- My account lists the person's tokens with name, kind, projects, expiry, created and last used, and Revoke, whether agent access is on or off.
- A user's detail in Administration lists that user's tokens with Revoke, and the Users table shows a count of active tokens.
- The activity log records token creation, revocation and expiry; an expiry is recorded by an alarm at the expiry time.
- Each activity entry made with a token shows "via agent" and the token's name, and Activity gains an "Agent actions" filter.

**Refusals and edge cases**
- With agent access off, every token request is refused with HTTP 403 and the reason code "agent access is off".
- Turning agent access on again restores the tokens that are neither expired nor revoked.
- A token is refused after it expires or is revoked.
- A token is refused for a project outside its list, and for a project its owner no longer belongs to, from the very next request.
- A role change, deactivation or removal applies to the owner's tokens on the next request, exactly as to a session.
- Deactivating an account revokes all its tokens, and reactivating the account does not bring them back. (CG-27 · decision)
- Removing the owner from a project drops that project from the list of every token limited to chosen projects, and adding the owner back does not restore it. (CG-28 · decision)
- An unknown, malformed or revoked token is refused with one reason code, "token not accepted", and does not say which.
- A value starting with `ssat_` in a query string is refused with the reason code "token in address" and is never logged.
- A token request is not subject to the origin-and-header rule of sessions, and a session request still is.
- A request that carries both a session cookie and a token is refused. (CG-05 · reading)
- A token cannot create a project; the request is refused with "needs a person". (CG-24 · reading)
- An expiry that is not later than now, or beyond the installation's maximum, is refused with the reason and the maximum stated.
- Lowering the maximum lifetime shortens every existing token whose expiry is beyond the new maximum, counted from its creation; a token whose new expiry has passed expires at once, and the activity log records each. (CG-20 · reading)
- When the maximum is below 90 days, Create token offers the maximum as its default.
- Recovering the whole installation from a backup revokes every token, and revoked tokens stay listed as revoked. (CG-25 · reading)
- No log entry, record or export contains a token: a test creates and uses one, then searches the stored log and records for it and finds none.

**Limits and values**
- A token's expiry is 90 days unless changed and at most 1 year, and an administrator can lower the maximum. (CG-02 · value)
- A token starts with `ssat_` and holds at least 32 random bytes. (CG-06 · value)
- A token may make 300 requests a minute, counting each API call made inside an MCP tool call; further requests receive HTTP 429 with `Retry-After`. (CG-04 · value)
- All of one person's tokens together may make 600 requests a minute, and a person may hold at most 10 active tokens, active meaning neither expired nor revoked. (CG-13 · value)
- Creating an eleventh active token is refused with the limit stated.
- After 20 refused token requests in a minute from one network address, further requests from it with an unknown or refused token receive HTTP 429 with `Retry-After`; requests with a valid token are not affected. (CG-14 · value)
- Rate counters are kept in memory, last use is written at most once a minute per token, and the per-address check runs before the installation object is consulted.
- A self-hosted installation takes the client's address from `X-Forwarded-For` only when the request comes from a proxy listed in its configuration, and from the connection otherwise.
- An expired or revoked token stays listed, greyed, for 30 days. (CG-07 · value)

**Access and restore**
- A revision restore leaves tokens and the agent-access setting unchanged.

**Evidence to record**
- The gate's server tests of story 1.8 and story 1.9 are repeated with a read-only token and with a read-and-draft token for each route class and caller case, including a Viewer's token and an administrator's token.

Notes: Story 1.1 declares every route with its schema, and story 1.8 gives every route its class and adds the `via` field; this story adds the caller kind that uses them. It builds on Administration's Users (story 1.10), the activity log (story 1.14) and Settings (story 1.15), all earlier in this epic. The API description and the MCP endpoint come in Epic 11. From Epic 2 on, standing rule 2 makes each story test its routes with both kinds of token.

## Epic 2: One shared project online

**Outcome.** The existing design tool runs as one shared project, on Cloudflare and on your own server. Two members can edit different things at once, see each other's changes within seconds and resolve a clash without losing work.

**Depends on.** Epic 1 complete. Nothing later.

**Why here.** Issued designs, field evidence, conflict checks and fixed packages all assume a shared server-saved record, which the prototype lacks, and the self-hosted image is built at the end of this epic so that both hosts are exercised from early on.

### Story 2.1: Open a project as a member and work in it together

As a designer (an Editor), I want to open a project I belong to and have its records held on the server, so that my colleagues and I work on one copy.

Covers: FR-2, FR-45 (first work scope), FR-68 (project list), FR-69, AD-2, AD-5. Screens: S-28, S-31.

**Core behaviour**
- A member who opens a project sees it loaded from that project's own store.
- Creating a project asks for the name of its first work scope, with "Initial design" filled in as the default.
- The project is created with that scope, in the state In progress, as its active scope.
- The first scope records the account that created it and the time.
- The project list shows, for each project, its active scope's name and state and the time of its last activity.
- The Projects table in Administration (story 1.12) shows the same scope name, scope state and last activity for every project.
- A Viewer opens and reads the project with editing controls removed and a "View only" mark in the header.
- An administrator opens a project they were never added to and can edit it.
**Refusals and edge cases**
- A signed-in standard user who is not a member cannot open the project, including by typing its address.
- Two projects share no records: a change saved in one never appears in the other.
- A change request sent to the project as a Viewer is refused by the server.
- A scope name that is empty or too long is refused with the reason, and no project is created.
**Limits and values**
- A scope name has 1 to 80 characters. (CB-01 · value)
- For a project with no saved change yet, the last activity is its creation.
**Access and restore**
- A revision restore leaves the project's work scopes unchanged.

Notes: Left to later stories: scope categories (story 6.10); later scopes and reopening (story 6.15); the attention count on the project list (story 5.18); the "View only" mark in the project frame (story 3.1); refusal of a non-member's request for a project file (story 2.9).

### Story 2.2: Save edits to the shared project and show the save state

As a designer, I want my edits saved to the shared project automatically with a truthful status, so that I know my work is safe.

Covers: FR-21, NFR-2, AD-5. Screens: S-01.

**Core behaviour**
- An edit to anything the prototype can edit (a building, floor, plan placement, device, route, obstruction, zone, note, analysis setting or capacity input) is saved to the server when it is committed, with no Save button.
- Opened in a second browser, the project shows the saved value.
- A committed edit shows Saving on its item, then Saved once the server has acknowledged it.
- The saved value survives closing the browser and restarting the service.
- Each building, floor, plan placement, device, route, obstruction, zone and note is saved as its own versioned item, and each floor's analysis settings are one item.
- While an item is dragged, intermediate positions are not saved; the completed move is saved as one change.
- The save status is a small element in the existing prototype header showing Saving, Saved or Unsaved with a count.
- Choosing the save status opens a list of the items not yet saved.
- A saved edit updates the project's last activity in the project list.
- An Editor can still delete a route, an obstruction or a zone as in the prototype, and each deletion is saved as one operation.
- Capacity inputs (retention, and each camera's bitrate, recorded percentage and power allocation) are saved to the server, and the prototype's Capacity dialog works from the saved values. (CB-02 · reading)
- The prototype's Materials dialog lists equipment and cable quantities from the saved records and offers no cost entry.
- Cost entry, named revisions and review are not offered in a shared project: each says that the feature is not available yet. (CB-03 · reading)
**Refusals and edge cases**
- A save whose reply was lost is retried with the same operation identifier, and the change is applied once only.
- Apart from plan images, no control in a shared project keeps project data only in the browser.
**Evidence to record**
- On the locally run server, a single-item save is acknowledged within 2 seconds in at least 19 of 20 trials, and the results are recorded as a development measurement.

Notes: Left to later stories: lost connections, lost access and ended sessions (story 2.3); the Conflict state (story 2.5); guarded deletion of floors and buildings (story 2.6), of devices (story 2.10) and of survey entries (story 2.16); plan images on the server (story 2.9); named revisions (story 4.1); cost entry in the estimate (story 4.5); capacity estimates in place of the Capacity dialog (story 4.6); review (story 4.8); the status in the project frame (story 3.1); the 2-second target against the large fixture (story 2.11) and at acceptance (story 10.2).

### Story 2.3: Keep unsaved edits through a lost connection, lost access or an ended session

As a designer, I want edits that could not be saved kept in front of me with the reason, so that nothing I typed disappears without my knowing.

Covers: FR-21, FR-68 (access changes), NFR-2. Screens: S-01.

**Core behaviour**
- With the connection lost, an edit shows Unsaved and stays on the page.
- The header status counts the unsaved items.
- When the connection returns, unsaved edits are sent again without the user doing anything and become Saved.
- Closing or reloading the page with unsaved items first shows the browser's leave-page warning.
- When the session ends while project edits are unsaved, they stay on the page and are saved after the same account signs in again.
**Refusals and edge cases**
- If the user's role is changed to Viewer, their membership is removed or their account is deactivated while they hold unsaved edits, the next save is refused.
- Those edits stay on the page marked "not saved: access changed", their values can be copied, and they are not sent again.
- Each refused item in the save-status list shows its own reason, and items refused for different reasons are listed together.
- If a different account signs in on that page, the earlier account's unsaved edits are not shown to it and are not sent.
- Those edits stay bound to the earlier account and are offered again only when that account signs in again in the same browser.

Notes: Left to later stories, each adding its own refusal reason to the list: "not saved: no active scope — reopen first" (story 5.25); "not saved: project archived" (story 6.16); "not saved: project was restored" (story 8.5). An edit that clashes on reconnection becomes a conflict in story 2.5.

### Story 2.4: See other people's changes within seconds

As a designer, I want changes saved by someone else to appear without reloading, so that we work from the same picture.

Covers: FR-2, FR-69, AD-6, AD-7.

**Core behaviour**
- With two browsers on one project, a change saved in one is shown in the other within 5 seconds, without a reload.
- A tab that regains focus checks for changes at once.
- Each accepted operation adds one change-log entry with the actor's account and name at that time, the session, the time, and the values before and after.
- A member who opens the project after being away sees the current saved state, however many changes were made meanwhile.
**Refusals and edge cases**
- While a form is being filled in or an item is being dragged, an incoming change to that item does not replace the local input.
- The user is told that the item was updated and by whom.
- A hidden tab does not check for changes.
- The automatic check for changes, including the one made when a tab regains focus, does not extend the session.
- When the session ends, the page stops checking for changes and shows the sign-in prompt of story 1.6.
- A change-log entry cannot be edited or removed through any route.
**Access and restore**
- A revision restore adds entries to the change log and removes none.

### Story 2.5: Resolve a conflict without losing either edit

As a designer, I want a clash on the same item shown side by side, so that I can choose what to keep.

Covers: FR-42, FR-21 (Conflict status). Screens: S-F7 pattern on desktop.

**Core behaviour**
- When two browsers edit the same camera and both save, the first save is accepted and the second becomes a conflict.
- The conflict is shown on the item and keeps its pending values.
- When two browsers edit different cameras and both save, both succeed.
- The header save status shows Conflict with a count, and its list includes the conflicting items.
- Opening a conflict shows, for each field that differs, the saved value, who saved it and when, beside the pending value.
- For each field the user keeps the saved value or reapplies their own.
- Choosing the saved value for every field clears the conflict and saves nothing.
**Refusals and edge cases**
- Saving the reapplied choices checks the item's version again; if the item has changed once more, a new conflict is shown and nothing is overwritten.
- An edit left Unsaved during a lost connection, whose item someone else changed meanwhile, becomes a conflict on reconnection and does not overwrite the other person's change.
- A conflict stays on the page until the user resolves it, and is never merged or dropped without the user's choice.
- An operation that changes several items is applied completely or not at all: if one of its items conflicts, none of its changes is saved.

### Story 2.6: Buildings and floors on the server, with guarded deletion

As a designer, I want buildings and floors kept as separate records, so that each floor's content stays independent and nothing referenced can be deleted by accident.

Covers: FR-1, FR-60. Screens: S-03 left panel.

**Core behaviour**
- With several floors, switching between them shows each floor's own drawing placement, equipment, routes, obstructions, zones, notes and analysis settings.
- Content and results from one floor never appear on another.
- A renamed floor or building keeps its identity.
- A new floor that reuses an earlier name has a new identity.
- Opening a project loads its list of buildings and floors and the content of the selected floor only.
- Another floor's content is requested when that floor is first opened.
- A floor that holds no device, route, obstruction, zone or note can be deleted.
- A building with no floors can be deleted.
**Refusals and edge cases**
- Deleting a floor that holds any device, route, obstruction, zone or note is refused, the blocking records are listed, and the floor and its content are unchanged.
- Hiding layers or clearing the visible plan does not make a floor eligible for deletion.
- Deleting a building that still has a floor is refused, with its floors listed.
- The last remaining floor of a project, and the last remaining building, cannot be deleted, and the reason is shown. (CB-04 · reading)
- A deletion requested from a stale view, after content was added to the floor in another browser, is refused with the new content listed.
- A refused deletion never deletes or moves any other record.
**Access and restore**
- A revision restore deletes no building or floor and renames none. (CB-05 · reading)

Notes: Left to later stories, each adding its own blocking record to the deletion rule: a stored plan (story 2.9); survey entries (story 2.16); a saved revision that holds the floor (story 4.1); a floor-level site check with an attempt (story 5.16); a closeout record that holds the floor (story 5.24); a removed device's last location (story 6.11); annotations (story 7.5); a closet (story 7.6); a riser reference (story 7.9). Undoing a floor or building deletion is story 2.18. The plan-switch timing is story 2.11.

### Story 2.7: Property lookup and map views

As a designer, I want to find the property by address and switch between street and aerial maps, so that I can place the design where the building really is.

Covers: FR-3, FR-70 (saved map key in use). Screens: S-03.

**Core behaviour**
- Searching by address or by coordinates moves the map view to the result and changes nothing else.
- Street mapping from OpenStreetMap works with no key.
- Switching between street and aerial views leaves the aligned plan and every device at the same geographic position.
- With a Google mapping key saved in Settings (story 1.15), Google mapping is offered to every member of every project without anyone entering a key.
- The prototype's per-session key dialog is removed.
**Refusals and edge cases**
- A lookup that fails, or a provider that is unavailable, shows a plain message.
- Without a saved key, Google mapping is not offered.
- The Google mapping key is sent only to the browsers of signed-in users.

### Story 2.8: Import, align and lock a plan

As a designer, I want to import a plan image or a PDF page and align and lock it on a floor, so that I design over the real drawing.

Covers: FR-4, FR-5, FR-6, AD-10. Screens: S-03.

**Core behaviour**
- An imported plan image, or one chosen page of a PDF, is placed on the selected floor.
- The plan's position, rotation, uniform scale, opacity and lock state can be changed, and they are the same after a floor change and after a reload.
- Moving, aligning or replacing a plan leaves equipment and obstructions at their geographic positions.
- Two-point alignment shows a preview of the move, rotation and scale before it is applied.
- A plan placed from a PDF keeps the source file name and the page number, and both are shown with the plan.
- A PDF's password is used in the browser only and is absent from every request and record.
**Refusals and edge cases**
- Cancelling an alignment leaves the earlier alignment unchanged.
- Choosing the same point twice is refused, and the earlier alignment is unchanged.
- A wrong PDF password asks again, and cancelling leaves the floor unchanged.
- A file that is not PDF, PNG, JPEG or WebP, or that is empty, truncated or unreadable, is refused with a plain reason, and the floor's earlier plan is unchanged.
**Limits and values**
- A PDF over 100 MiB or an image over 25 MiB is refused with the limit named, and the floor's earlier plan is unchanged.
**Access and restore**
- A revision restore returns each floor's plan, placement and alignment to the revision's values.
**Evidence to record**
- The preview of a selected PDF page appears within 30 seconds on a test PDF whose size and page count are recorded, as a development measurement.

Notes: Left to later stories: the original file and its preview stored on the server (story 2.9), until which the plan image stays in the browser's own storage; undoing an applied alignment (story 2.18); the password's absence from backups (story 8.1 and story 8.10).

### Story 2.9: Plans stored on the server with their originals

As a designer, I want a plan's original file kept on the server with a preview, so that the drawing can be traced, shared and reused.

Covers: FR-4 (retained original), FR-6 (retained source PDF), NFR-2, AD-3, AD-4. Screens: S-03.

**Core behaviour**
- On import, the original file and a preview are uploaded in 8 MiB parts with visible progress.
- The plan shows Saved only when both files are stored, checked and referenced by the floor.
- Another member who opens the floor in a second browser sees the plan.
- The server checks the hash and size of each completed upload against the values the browser declared.
- An upload interrupted by a lost connection or a closed tab resumes from the last accepted part when the same file is chosen again.
- One PDF used for two floors is stored once.
**Refusals and edge cases**
- A hash or size mismatch shows Failed with Retry, and the file is not referenced.
- If the user's role is changed to Viewer or their membership is removed between parts, the next part is refused, the parts already stored are discarded, and the plan shows "not saved: access changed".
- Each part accepted while an upload is in progress counts as use of the session.
- If the session ends between parts, the stored parts are kept and the sign-in prompt is shown.
- After the same account signs in again, that upload resumes from the last accepted part.
- A signed-in user who is not a member is refused a plan file, even with its exact address.
- A floor that holds a stored plan cannot be deleted, and the refusal lists the plan.
**Limits and values**
- An unfinished upload is discarded after 7 days. (CB-06 · value)
- A completed file that no record references is removed by a daily clean-up once it is 7 days old. (CB-07 · value)
**Access and restore**
- A revision restore deletes no stored file.

Notes: Left to later stories: file storage on a self-hosted server (story 2.25), until which this story is tested on Cloudflare's runtime; project storage usage and the project budget (story 8.14).

### Story 2.10: Equipment as individual records, findable across the property

As a designer, I want every device kept as its own record with a stable identity, so that it can be found, located and followed through its life.

Covers: FR-7 (base), FR-8 (base), FR-41 (Current and Proposed, base). Screens: S-03, S-08.

**Core behaviour**
- Two similar devices each have their own unchanging identifier and their own label, shown in the plan and in the equipment list.
- Every device has a lifecycle value of Proposed, Existing or Removed, and a newly placed device is Proposed.
- An Editor can set a device to Proposed or Existing, as the prototype's status field allows. (CB-08 · reading)
- A device once saved as Existing is marked as having been recorded as existing, and that mark stays if it is set back to Proposed. (CB-09 · reading)
- A device has an optional "Room or area" text field, shown with its other details. (CB-10 · reading)
- The plan and the equipment list have a basis control with Current installation and Proposed design, and the basis in use is always labelled.
- Current installation shows Existing devices only, and Proposed design shows Existing and Proposed devices. (CB-11 · reading)
- Choosing a placed device in the equipment list opens its floor with the device selected.
- Search by identifier, label, name, room or area, and model returns correct results.
- An Editor can delete a Proposed device that was never recorded as existing, as the prototype allows.
**Refusals and edge cases**
- Removed cannot be chosen as a lifecycle value.
- A device that is or has been Existing has no delete control. (CB-12 · reading)
**Access and restore**
- A revision restore replaces Proposed devices and their positions with the revision's, and leaves the recorded attributes of Existing devices unchanged.

Notes: Left to later stories: more equipment types (story 4.3); Delete draft with its Undo and preview (story 2.19); correcting a device wrongly recorded as existing (story 4.14); Installed making an add-new device Existing (story 5.4); existing-site inventory, condition and provenance (story 6.1); the Changes basis (story 6.9); removal and the Removed value (story 6.11).

### Story 2.11: Acceptance-size test project and first timings

As the product owner, I want a repeatable test project of acceptance size and early timings against it, so that speed problems show long before acceptance.

Covers: NFR-4, SM-5 (large fixture and timings).

**Core behaviour**
- A script generates the acceptance-size test project through the server's own operations.
- The project has 10 buildings, 25 plans and 600 devices, of which 150 are cameras with 60 on the busiest plan, and it has obstructions, 20 targeted zones and routes on the busiest plan. (CB-13 · value)
- A declared share of its devices is Existing.
- The same seed produces the same project.
- The script generates buildings, plans, devices, obstructions, zones and routes only, and takes its counts as options that later stories extend.
**Evidence to record**
- Against that fixture on the locally run server, search and filter return within 1 second in at least 19 of 20 trials.
- Selection and direct-edit feedback appear within 250 ms in at least 19 of 20 trials.
- A single-item save is acknowledged within 2 seconds in at least 19 of 20 trials.
- A change is seen in a second browser within 5 seconds in at least 19 of 20 trials.
- The project is open and usable within 10 seconds in at least 19 of 20 trials.
- A switch to another saved plan completes within 5 seconds in at least 19 of 20 trials.
- All results are recorded as development measurements, not as acceptance evidence.

Notes: Left to later stories: survey notes and photos in the fixture (story 2.17); an inventory file (story 6.2); plan and photo files up to the 8 GiB budget (story 8.6); the small functional project, the workload manifest, its confirmation and the reference calculations (story 10.1); acceptance measurement (story 10.2).

### Story 2.12: Coverage computed off the main thread, with an honest status

As a designer, I want coverage analysis to run without freezing the page and to say when a result is current, so that I never read a stale number as final.

Covers: FR-10, FR-11, FR-12, FR-13, NFR-4, AD-9. Screens: S-05.

**Core behaviour**
- Changing a camera's bearing, lens or field of view, mounting height, tilt or range changes its footprint and the results that depend on it.
- Changing resolution changes image-detail results without changing the footprint.
- Linked optical values stay consistent with each other.
- An enabled wall or obstruction with a height shadows the camera views it blocks, and a disabled one does not.
- Combined coverage is calculated for the basis selected in story 2.10, and the result names that basis.
- Overlap is counted once in covered area and shown separately as overlap.
- Editing the analysis boundary changes the analysed area, and the result names the boundary and the denominator in use.
- The floor's common target height is saved separately from each camera's own target height, and combined and zone results use it.
- Cameras left out of the calculation are listed under the result, each with the reason.
- The calculation runs in a Web Worker, and after an input changes the affected results show Updating until the calculation for the current inputs completes.
- A single camera's percentage and the combined percentage are labelled differently and never shown in the same position.
**Refusals and edge cases**
- Hiding a camera or a layer does not change any total.
- Without a custom boundary, the fallback area is stated.
- If every camera on the floor is left out, the result is shown as Not assessed, not as 100% unseen.
**Limits and values**
- While a calculation runs, selection and direct-edit feedback still appear within 250 ms. (CB-14 · reading)
**Access and restore**
- Obstructions, zones, the analysis boundary and analysis settings are design content that a revision restore returns to the revision's values.

Notes: Left to later stories: DORI and zone results (story 2.13); sampling, the time allowance and saved summaries (story 2.14); unsupported and illustrative views such as fisheye and stitched (story 7.1); accuracy against independent reference calculations (story 10.1 and story 10.3).

### Story 2.13: DORI and zone targets, with uncertain results flagged

As a designer, I want image-detail levels and each zone's result against its target, so that I can see where the design falls short and where the answer is too close to call.

Covers: FR-14, FR-15, FR-16, NFR-4. Screens: S-05.

**Core behaviour**
- Turning the DORI overlay on or off changes no saved value and no result.
- At each point, combined DORI is the best single unobstructed view; two overlapping views below a level do not add up to that level.
- An area seen below Detect is shown differently from an unseen area.
- A zone with a target shows its achieved percentage, its deficient area, and one of four results: Target met, Shortfall, Not demonstrated or Uncertain near target.
- A zone's result uses its full polygon, and any part of the zone that was not assessed stays in the denominator.
- Target met is shown only when the percentage calculated with every sampling cell on a zone or threshold edge counted as not qualifying still reaches the target. (CB-15 · reading)
- Shortfall is shown only when the percentage with those cells counted as qualifying is still below the target.
- When neither holds, the calculation is repeated once at half the spacing.
- If the result is still undecided, it is shown as Uncertain near target with both percentages.
- Zone results stay visible while a camera is adjusted.
**Refusals and edge cases**
- A zone without a target shows no result.
- When the target is not met and a camera in range of the zone was left out of the calculation, the result is Not demonstrated, not Shortfall. (CB-16 · reading)
- Rounding for display never changes a result: 89.96% against a 90% target is not shown as Target met.

Notes: Left to later stories: Not demonstrated and Not assessed for unsupported views (story 7.1).

### Story 2.14: Sampling no coarser than 1 m, a time allowance and saved summaries

As a designer, I want every result computed at a stated fidelity and never quietly coarsened, so that the numbers mean the same on a small plan and a large one.

Covers: NFR-4, AD-9, experiment R2. Screens: S-05.

**Core behaviour**
- Sampling is 1 m or finer on every plan, and the spacing used is shown with the result.
- The prototype's fixed work budget and cell cap are removed.
- The contour mesh has its own size limit; above it the map shows the sampled overlay instead.
- The numbers are the same with either presentation, and the result says it is an estimate.
- The polygon clipping step uses one boundary for both its inside test and its intersection: a test case with a camera footprint crossing the boundary gives the same area by both paths.
- The last final summary for each floor is saved with a fingerprint of its inputs.
- On reopening, a summary whose fingerprint no longer matches is shown as Updating, not as final.
**Refusals and edge cases**
- A calculation that would exceed its time allowance is shown as Incomplete with the reason.
- Sampling is never coarsened to finish in time.
**Limits and values**
- The time allowance for one calculation is 30 seconds; 10 seconds remains the target that is measured. (CB-17 · value)
**Access and restore**
- A revision restore does not bring back saved summaries; they are recalculated from the restored inputs.
**Evidence to record**
- On the busiest plan of the fixture from story 2.11, the spacing shown is 1 m or finer.
- That plan is timed in a Web Worker in a browser with 60 cameras and all 20 zones, and completes within 10 seconds of a committed edit in at least 19 of 20 trials.
- The timing is recorded as a development measurement.

Notes: Experiment R2 found that the prototype's work budget and cell cap coarsen sampling to 6 to 12 m on the acceptance workload, and that without them 60 cameras and 20 zones finish in under half a second at 0.5 m. Examination of the R2 experiment copies found the contour-mesh limit and the two clipping boundaries, which are prototype behaviour to correct. Left to later stories: acceptance measurement (story 10.2).

### Story 2.15: Cable routes on one floor

As a designer, I want to draw and edit routes between devices on a floor, so that cable can be estimated.

Covers: FR-9 (base).

**Core behaviour**
- A route is drawn between two devices on one floor with waypoints and a cable type.
- The route shows a length estimate labelled as an estimate, in the floor's own scale.
- Each route has a run identifier that does not change when the route is edited.
- Moving an endpoint device or a waypoint updates the estimate.
- A floor's routes are requested when the floor is opened, not when the project is opened.
**Refusals and edge cases**
- Deleting a device that a route ends on does not delete the route, as it did in the prototype: the route stays, with that end shown as unassigned and marked for review.
- A route with an unassigned end is still counted in cable totals and is listed as needing review. (CB-18 · reading)
**Access and restore**
- Proposed routes are design content that a revision restore returns to the revision's values.

Notes: Left to later stories: the dependency preview before a connected draft is deleted (story 2.19); removal of an installed device (story 6.11) and the review of its cable ends (story 6.12); runs between floors (story 7.9) and the length ledger (story 7.10).

### Story 2.16: Survey notes and measurements as separate entries

As a designer, I want notes, measurements and installation constraints attached to a device or a point on the floor, so that what was found on site is kept with its place.

Covers: FR-20 (base), FR-45 (scope on evidence), NFR-5 (site credentials kept out of notes). Screens: S-04 Evidence tab.

**Core behaviour**
- A note, a measurement with its unit or an installation constraint is added to a device or to a point on a floor as a separate entry showing its author's name and the time.
- Each entry records the active scope.
- The note form offers optional prompts for lighting, shadows, uneven terrain and mount rigidity, and leaving them empty is allowed.
- The answers to the prompts are shown with the entry and change no coverage result.
- Evidence is reached from the plan, by its pin, and from the device.
- Moving a device keeps its entries with it, and an entry attached to a point on the floor keeps its position.
- Two people adding entries to the same device at the same time both succeed, and both entries are shown.
**Refusals and edge cases**
- Adding an entry never changes or removes an earlier entry.
- A saved entry has no edit or delete control; a correction is added as a new entry. (CB-19 · decision)
- A retried addition does not create a duplicate entry.
- A device that holds a survey entry cannot be deleted, and the refusal names the entry.
- A floor that holds a survey entry cannot be deleted, and the refusal lists the entry.
**Limits and values**
- The entry form shows "Do not enter passwords or access codes for the site's systems." (CB-20 · value)
**Access and restore**
- Survey entries are not design content: a revision restore leaves every entry unchanged.

Notes: Left to later stories: photos (story 2.17); refusal of a new survey entry or photo while the project has no active scope (story 5.25).

### Story 2.17: Survey photos kept with their originals

As a designer, I want photos attached to a device or a point on the floor with the original kept, so that visual evidence can be trusted later.

Covers: FR-20 (photos), NFR-2, AD-3. Screens: S-04 Evidence tab.

**Core behaviour**
- A photo is added to a device or to a point on a floor as its own entry, with its author's name, the time and the active scope.
- The photo's original and a preview are stored.
- The entry shows Uploading, then Saved only after the upload and the entry have both succeeded.
- A photo upload interrupted by a lost connection resumes from the last accepted part.
**Refusals and edge cases**
- A failed upload shows Failed with Retry and is never shown as Saved.
- A photo that is not JPEG, PNG or WebP, or is empty or unreadable, is refused with a plain reason and no entry is added.
- A retried addition does not create a duplicate entry.
- A signed-in user who is not a member is refused a photo file, even with its exact address.
**Limits and values**
- A photo over 25 MiB is refused with the limit named, and no entry is added.
**Access and restore**
- A revision restore leaves every photo entry unchanged and deletes no stored file.
**Evidence to record**
- A photo's preview is shown within 10 seconds of its upload completing, recorded as a development measurement.
- The fixture script from story 2.11 also generates survey notes and photos, in numbers it declares.

Notes: Left to later stories: photo capture on phones over poor connections, experiment R4 (story 5.12).

### Story 2.18: Undo and redo my own recent edits

As a designer, I want to undo and redo my own recent edits, so that slips are cheap to fix.

Covers: FR-21 (undo and redo), FR-5 (undo of an alignment), AD-7.

**Core behaviour**
- Undoing my own recent edit records a new reversal in the change log, and the item returns to its earlier value.
- Redoing an undone edit records a new operation, and the item returns to the value I had set.
- Making a new edit after an undo clears the redo list.
- Undoing an applied plan alignment restores the earlier alignment.
- Deleting an unused floor or building can be undone, and it returns with the same identity.
- Deleting a route, an obstruction or a zone can be undone, and it returns with the same identity.
**Refusals and edge cases**
- If someone else has since changed the item, or something that depends on it, my undo or redo is refused with an explanation that names the later change, and nothing of theirs is changed.
- Undo never removes or alters a survey entry or a photo.
- A retried undo or redo is applied once only.
**Limits and values**
- Undo and redo cover my last 40 edits made in the open page. (CB-21 · value)
- Reloading the page or signing out empties both lists.

Notes: Left to later stories: full revision restore, a separate guarded action (story 4.2); undo and a port reassigned by someone else (story 7.8).

### Story 2.19: Delete an accidental draft device

As a designer, I want to remove a device I placed by mistake in one step, with a way back, so that the design stays clean without risking real records.

Covers: FR-55 (Delete draft).

**Core behaviour**
- Delete draft replaces the plain delete of story 2.10.
- An accidental proposed device that has no survey entry, no route and was never recorded as Existing can be removed with Delete draft.
- The device disappears at once with an Undo notice and no confirmation dialog.
- A deleted draft leaves the equipment list, coverage results and cable totals.
- Undoing a draft deletion returns the device with the same identifier.
- The device's change history is kept whether it stays deleted or is returned.
- Delete draft on a proposed device that has routes first shows a preview listing each route affected.
- On confirmation the device is deleted and each route is kept with that end shown as unassigned and marked for review.
- In that preview a route is deleted with the device only if the user selects it, and only if the route has no survey entry and its other end is also unassigned or on the same device. (CB-22 · reading)
**Refusals and edge cases**
- Delete draft is not offered for a device that has a survey entry or photo, or that is or has been Existing.
- For such a device a "Why can't I delete this?" link lists the reasons.
- A Delete draft sent from a stale view, after someone else added a survey entry or a route to the device, is refused with the reason, and the device is unchanged.
- A floor whose only devices are deleted drafts counts as unused under story 2.6. (CB-23 · reading)
- Undoing a draft deletion is refused, with the reason, if the device's floor has since been deleted.
- A retried Delete draft is applied once only.

Notes: Left to later stories: cancelling a proposal that cannot be deleted, and correcting a record (story 4.14). Later stories add their own conditions that make a device ineligible for Delete draft: inclusion in an issued design (story 4.12); an Installed or Configured mark (story 5.4); a test attempt (story 5.10); an issue (story 5.17); a Current installation port assignment (story 7.8). A floor held in a saved revision stays undeletable even when its only devices are deleted drafts (story 4.1).

### Story 2.20: Bring in a project saved by the prototype

As an administrator, I want to import a project file exported from the prototype, so that existing work is not lost.

Covers: FR-22 (format migration), FR-20 (images from older records), AD-14.

**Core behaviour**
- Importing a version 1 or version 2 prototype project file creates a new shared project with its buildings, floors, plans, devices, routes, obstructions, zones, notes, analysis settings and capacity inputs.
- Each device keeps the identifier and label it had in the file, and its Proposed or Existing status.
- Import is offered wherever Create project is, to the same people, and the importer becomes the project's Editor under the same rule.
- The import asks for the first work scope's name as story 2.1 does, with "Initial design" as the default.
- Before the import is confirmed, a review list names everything in the file that will not be brought in or cannot be represented exactly.
- Costs and named revisions in the file are named in that review list as not imported.
- Plan images held in the file are stored as previews, and each such plan shows "original not available".
- Photos held in the file's notes are stored as previews, and each shows "original not available".
- Imported notes show that they came from the prototype file and the date of the import, and no author is invented for them.
- The import itself is recorded with the importing account as its actor.
**Refusals and edge cases**
- The file is checked completely before anything is created.
- A file that is not valid JSON, is truncated, or is not a version 1 or version 2 prototype project file is refused with a plain reason, and no project is created.
- An import that fails part-way leaves no project in the project list and no stored files.
- Nothing in the file is dropped without being listed.
- Importing the same file twice creates two separate projects. (CB-24 · reading)
**Limits and values**
- A file over 100 MiB is refused with the limit named, and no project is created. (CB-25 · value)
**Access and restore**
- A revision restore leaves the record of the import and the imported notes and photos unchanged.

Notes: Left to later stories: named revisions from the file (story 4.1) and costs from the file (story 4.5), each then removing its item from the "not imported" list; the portable backup of the new format (story 8.10).

### Story 2.21: Run Site Studio on your own server over HTTPS

As an organisation's administrator, I want to start Site Studio on a Linux server with Docker and reach it over HTTPS, so that our data stays on our own machine.

Covers: FR-66 (self-hosted), NFR-7, AD-1, AD-16, AD-17.

**Core behaviour**
- One Docker image holds Cloudflare's open-source runtime at a pinned version, the same Worker bundle that is deployed to Cloudflare, and its configuration.
- The image is built for x64 and arm64 on a glibc base, and it starts on both.
- A Compose file starts the application and a bundled web server that provides HTTPS.
- With only a host name set, a browser reaches the sign-in page over HTTPS.
- The bundled web server obtains and renews a certificate for the configured host name automatically, and that is shown to work. (CB-26 · decision)
- The bundled web server uses certificate files the operator supplies instead, and that is shown to work.
- First-run set-up (story 1.2) works with the set-up code printed in the server output.
- Two installations started from the same image with separate volumes share no users or projects: an account on one cannot sign in to the other, and a project on one is not listed on the other.
**Refusals and edge cases**
- A plain HTTP request to the bundled web server is redirected to HTTPS.
- By default the application's own port is not published on the host; only the web server's ports are.
- A start while no administrator exists prints a new set-up code, and the earlier code stops working.
- Once an administrator exists, no start generates or prints a set-up code.

Notes: Left to later stories: an operator's own proxy (story 2.22); the deployment key and administrator recovery (story 2.23); the smoke suite (story 2.24); files on disk (story 2.25); durability (story 2.26); the published installation instructions (story 9.1); the updater container (story 9.7). The Compose file, the bundled web server, certificate handling, the HTTP-to-HTTPS redirect and the unpublished application port are deployment packaging outside the application build, a host difference that the architecture's AD-16 lists.

### Story 2.22: Run behind your own HTTPS proxy

As an organisation's administrator, I want to put Site Studio behind the HTTPS proxy we already run, so that it fits our network without weakening sign-in.

Covers: FR-66 (self-hosted), NFR-5, AD-17.

**Core behaviour**
- An operator who uses their own HTTPS proxy turns the bundled web server off and lists the proxy's address in a trusted-proxy setting.
- Sign-in works both through the bundled web server and through an operator's proxy on the trusted list.
- Session cookies are always marked Secure.
**Refusals and edge cases**
- Forwarded-protocol and forwarded-address headers are believed only from an address on the trusted list.
- A request that reaches the application without HTTPS, directly or through a trusted proxy that reports plain HTTP, is refused and serves no page and no data. (CB-27 · reading)
**Limits and values**
- By default the trusted list holds the bundled web server only. (CB-28 · value)

### Story 2.23: Deployment key and administrator recovery on your own server

As an organisation's administrator, I want the key that protects stored secrets kept in a file I can copy, and a way back in if I am locked out, so that a restart or a lost password does not cost us the installation.

Covers: FR-66 (self-hosted), FR-70 (administrator recovery, self-hosted), NFR-7, AD-17.

**Core behaviour**
- On first start the server generates the deployment key that story 1.5 and story 1.15 encrypt with, and writes it to a key file in a folder set in the Compose file, separate from the records and files folders. (CB-29 · reading)
- On that first start the server output says where the key file is and that a copy must be kept off the server.
- After a restart, two-step verification secrets and Settings secrets saved earlier still work.
- After the containers are removed and recreated, or a newer image is started, the key file is unchanged and those secrets still work.
- When a key file is already in that folder, including one the operator placed there before the first start, the server uses it and generates no key.
- When the only administrator cannot sign in, a documented command run on the server prints a one-time recovery code.
- A named administrator account uses the code to set a new password and have its two-step verification reset, and the code works once and expires, as in story 1.13.
- The issue of the code and its use each appear in the activity log.
**Refusals and edge cases**
- With records present and the key file missing, the server refuses to start, names the missing file and generates no new key. (CB-30 · reading)

Notes: Left to later stories: recovery of a whole installation with the key (story 8.7) or without it (story 8.8); the instruction to keep the key off the server, in the published instructions (story 9.1).

### Story 2.24: Self-hosted smoke suite for accounts and the shared project

As an organisation's administrator, I want the self-hosted image put through the same automated cases on every build, so that what works on Cloudflare is shown to work on my server.

Covers: NFR-7, AD-16.

**Core behaviour**
- The self-hosted smoke suite from story 1.1 runs against the image in continuous integration and passes.
- Its cases are a named list, each naming the story it stands for. (CB-31 · value)
- Case: set-up with the printed code creates the first administrator.
- Case: an invited user signs in with a password and a two-step code, and again after a restart.
- Case: a Settings secret saved before a restart is still usable after it.
- Case: an Editor's saved edit is read back after a restart.
- Case: a change saved in one session is seen in a second session within 5 seconds.
- Case: two saves to the same item return a conflict to the second.
- Case: a prototype project file is imported and the project opens.
- Case: the sign-in and the project's creation appear in the activity log.
**Refusals and edge cases**
- Case: a signed-in user who is not a member is refused the project, and a Viewer's change is refused.
- Case: a plain HTTP request is redirected or refused.

Notes: Left to later stories: the file cases (story 2.25). Each later area adds its own cases under standing rule 7.

### Story 2.25: Files on the server's own disk

As an organisation's administrator, I want plans and photos kept on my server's own disk and checked for damage, so that a self-hosted installation stores files as reliably as Cloudflare does.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-3, AD-4, AD-16.

**Core behaviour**
- On a self-hosted installation, a plan and a photo uploaded through the interface are stored in the live files folder through the runtime's disk service, and are shown again after a restart.
- Each stored file's SHA-256 hash and size are kept in the project's records.
- Upload is in equal 8 MiB parts and resumes from the last accepted part, with the same requests and replies as on Cloudflare.
- When an upload completes, the server computes the file's hash and size and compares them with the declared values.
- A download is streamed, and a range request returns exactly the bytes asked for.
- A file is stored under its content hash and is never overwritten, and the same content uploaded twice is stored once.
- The live files folder and the backup location are two separate settings in the Compose file, and the backup location has no default value.
**Refusals and edge cases**
- A hash or size mismatch shows Failed with Retry, and the file is not referenced.
- A stored file whose size or hash no longer matches its record is reported as damaged when it is requested, and is not served as if it were good. (CB-32 · reading)
- Every download passes the access gate: a user who is not a member is refused a file even with its exact address.
- The server refuses to start if the backup location is left unset, naming the missing setting. (CB-33 · reading)
- The server refuses to start if both settings point to the same folder, with an explanation.
- Two installations with separate volumes share no files: a file address from one is refused on the other.
**Limits and values**
- An unfinished upload is discarded after 7 days, as on Cloudflare. (CB-06 · value)
**Evidence to record**
- One set of file-store tests passes against both the Cloudflare file store and the disk file store.
- The self-hosted smoke suite gains the file cases (upload a plan and a photo, restart, read back whole and by range) and passes against the image.

Notes: Left to later stories: behaviour when a disk is full (story 2.26); the first write to the backup location (story 8.2); the warning when it is on the same disk as the live data (story 8.3).

### Story 2.26: Records survive crashes and power loss

As an organisation's administrator, I want every acknowledged save to survive a crash or a power cut on my server, so that Saved means the same as it does on Cloudflare.

Covers: FR-66 (self-hosted), NFR-2, NFR-7, AD-2, experiment R12.

**Core behaviour**
- Records are kept on a persistent volume named in the Compose file.
- Records are still there after the containers are stopped and started, and after the containers are removed and recreated from the image.
- After space is freed on a full volume, saves and uploads succeed again without a restart.
**Refusals and edge cases**
- A second application container started on a records volume that is already in use refuses to start, with an explanation, and the first keeps working. (CB-34 · reading)
- When the records volume is full, a save is not acknowledged: the item shows Unsaved with the reason, and nothing already saved is damaged.
- When the files volume is full, an upload part is refused with the reason, the upload shows Failed with Retry, and no file is referenced.
- While either volume is full, administrators see a storage-full notice in Administration naming the volume. (CB-35 · decision)
**Evidence to record**
- With saves running continuously, the application container is force-killed 50 times; after each restart every acknowledged save is present and no project fails to open. (CB-36 · value)
- Experiment R12 is run on a typical virtual-machine disk with the power cut during saves, at least 20 times; no acknowledged save is lost and no project fails to open, and the result is recorded. (CB-37 · value)
- Experiment R12 is also run with the records volume on a network disk (NFS), and the result is recorded.
- Storage that loses an acknowledged save or fails to lock is listed as unsupported in the experiment record.
- If R12 fails on the typical virtual-machine disk, the story is not done; the fallback the architecture names is to require local disk for records.

Notes: Left to later stories: a full backup disk (story 8.2); the supported kinds of server and storage, stated in the published instructions from this story's results (story 9.1).

## Epic 3: A workspace that holds the whole job

**Outcome.** The app has the frame, the eight areas and the status language from the UX specification, and the prototype's measured readability problems are fixed. Later epics add their screens into this structure.

**Depends on.** Epic 1 complete, and Epic 2 through story 2.19. Nothing later.

**Why here.** Epics 4 to 7 each add full pages, and those pages need the frame and the status components to exist first.

### Story 3.1: Project frame

As a designer, I want to see which property, scope and reference I am working in, so that I always know where I am.

Covers: UX 5.1, 17.1, decisions D1 and D12, FR-2 (views), FR-21 (save status). Screens: S-01.

**Core behaviour**
- Every project screen sits inside one frame showing the property name, the active work scope's name and state, the issued design, the view switch, the save status and the account menu.
- The property name opens the project list.
- The issued design shows "Not issued".
- The save status from story 2.2 is shown in the frame, not in the prototype header, with Saving, Saved, Unsaved or Conflict and a count.
- The save status opens the list of pending and conflicting items.
- The account menu of Epic 1 moves from the prototype header into the frame, showing the user's name and role in this project, with My account and Sign out.
- Administrators also see Administration in the account menu.
- A Viewer sees a "View only" chip in the frame.
- The view switch offers Design and Installation.
- Switching the view sets the basis (story 2.10) to Proposed design for Design and Current installation for Installation, and a brief notice says so. (CB-38 · reading)
- The user can then change the basis.
- "Members and reviewer links" lists who belongs to the project and each person's role.
**Refusals and edge cases**
- Switching the view changes no permission: a Viewer gains no editing control in either view.
- "Members and reviewer links" offers no control to change members.

Notes: Left to later stories: the areas as routes (story 3.2); managing reviewer links (story 4.11); the issued design chip filled in (story 4.12); the Installation view's recording tools (story 5.3); the archived banner (story 6.16). Members are managed in Administration (story 1.12).

### Story 3.2: Eight areas, each with its own address

As a designer, I want to move between the areas of a project and return to one by its address, so that the whole job has a place.

Covers: UX 5.2, FR-2 (views). Screens: S-02.

**Core behaviour**
- Overview, Plan, Equipment, Connections, Costs and capacity, Field work, Issues and Records are separate routes, each loaded when first opened.
- A direct address or a reload opens the same area.
- Overview shows the active scope's name and state, each floor with its device count, and recent activity from the change log.
- The Materials and Capacity dialogs open as the Costs and capacity page, with the content they have after story 2.2.
- Records is a timeline page, newest first, to which later stories add their entries; at this story it says that it holds no records yet.
- Connections, Field work and Issues each say plainly that the area is not available yet.
**Refusals and edge cases**
- A direct address to an area of a project the user does not belong to is refused.
- No placeholder figures or sample records are shown anywhere in the frame or the areas.

Notes: Left to later stories: Equipment as a page (story 3.6); the first Records entries, named revisions (story 4.1); the estimate (story 4.5) and capacity estimates (story 4.6) on the Costs and capacity page; Field work (story 5.1); Issues (story 5.17); Connections, with closets and ports (story 7.6) and cable runs (story 7.9).

### Story 3.3: Status language components

As a designer, I want every status drawn the same way everywhere, so that I can read the state of things at a glance.

Covers: UX section 6, NFR-3.

**Core behaviour**
- One component renders every family and value in the UX status reference, each with a text label and an icon or shape.
- The component also renders an approval state with the values Approved, Changes requested, Bypassed, Awaiting decision and No review. (CB-39 · reading)
- A status reference page in the development build shows every family and value.
- The statuses already in the app use the component: save state (story 2.2), lifecycle (story 2.10) and analysis status (story 2.12), including Updating, Not assessed and Uncertain near target.
- Device markers on the plan show lifecycle by outline: dashed for Proposed, solid for Existing.
- The marker component draws a condition glyph (none for Working, a warning triangle for Faulty, a question mark for Unknown), shown on the reference page.
- The incomplete-total component shows "Incomplete" with a count of unknown inputs and a link to them, shown on the reference page.
**Refusals and edge cases**
- Viewed in greyscale, each value in a family differs from every other value in that family both in its label and in its icon or shape.
- The incomplete-total component is never styled as a pass.
- Two different families are never combined into one badge.

Notes: Left to later stories, which use these components: totals with unknown inputs (story 4.5 and story 4.6); approval states (story 4.9); condition on devices (story 6.1).

### Story 3.4: Readable text, contrast, targets and focus

As a designer, I want text I can read and controls I can hit, so that long sessions and field use are comfortable.

Covers: NFR-3, UX section 10, audit findings A2, A3, A5, A6.

**Core behaviour**
- Every interactive element, including map markers, shows a visible focus ring and can be reached and operated by keyboard.
- Every input has a visible label, and every error message names its field.
- Forms at 200% zoom show one column, with no clipped labels and no horizontal scrolling.
- Focusing a form field on iPhone Safari does not zoom the page.
- Markers keep a white halo.
**Limits and values**
- On desktop no text is smaller than 12 px, body text is 14 px, and 12 px is used only for map labels and table metadata.
- All text meets a contrast ratio of 4.5:1 against its background.
- Markers, icons and focus rings meet 3:1 against both the plan and aerial imagery.
- Desktop buttons are at least 32 px in each dimension, and actions in dense tables at least 24 px.
- On a screen 390 px wide, form field text is at least 16 px.
- The focus ring is 2 px.
**Evidence to record**
- The text contrast measurements are recorded for every screen that exists at this story.
- The marker, icon and focus-ring contrast measurements are recorded against both the plan and aerial imagery.

Notes: Left to later stories: the 44 px touch targets of the field shell (story 5.1). Screens added later meet these rules under standing rule 5.

### Story 3.5: Plan workspace regrouped

As a designer, I want grouped tools and a docked analysis summary, so that the map is not covered and tools are easy to find.

Covers: UX 7.1, decision D5, audit findings A7, A8, A9, A12. Screens: S-03.

**Core behaviour**
- The left panel shows buildings and floors as a tree, each floor with its device count.
- Adding, renaming and deleting floors and buildings (story 2.6) is done in the left panel, not in a dialog.
- The tool dock has six groups: Select, Place, Draw, Annotate, Route and Note.
- Each group opens a short menu and remembers the last tool used in it.
- Every tool the prototype offered is in one of the groups: equipment types under Place; wall, obstruction, zone and analysis boundary under Draw; Measure under Annotate; survey note and photo under Note.
- The analysis strip replaces the floating card and shows the active analysis, its basis, target height, sampling, status chip and legend.
- Layers are grouped as Equipment, Analysis, Site and Connections, each with a visibility control, with a note beside them that hiding a layer does not change totals.
- With nothing selected, the right panel shows the floor's drawing, alignment, analysis settings and combined results.
**Refusals and edge cases**
- Plan alignment handles appear only while the plan is unlocked and Alignment is open, and never in the Installation view.
**Limits and values**
- At 1440 × 900 and at 1280 × 720 the analysis strip overlaps neither the dock nor the scale bar. (CB-40 · value)

Notes: Left to later stories: attention marks on floors (story 5.18); Awaiting placement in Place and the left panel (story 6.6); the annotation tools in the Annotate group (story 7.5).

### Story 3.6: Equipment as a full page

As a designer, I want the schedule as a full table with filters, so that a large property is workable.

Covers: FR-8, FR-68 (Viewer export), NFR-6, audit finding A1. Screens: S-08.

**Core behaviour**
- The Equipment page replaces the prototype's Equipment dialog, and its table shows the 600 devices of the fixture from story 2.11 with a sticky header.
- Each row shows the device's identifier, label, name, type, model, room or area, building, floor and lifecycle.
- A column chooser hides and shows columns.
- Search covers identifier, label, name, room or area, and model.
- Filters cover building, floor, type and lifecycle.
- The basis control from story 2.10 is at the top of the table, and the table lists the devices of the selected basis.
- Choosing a row opens that device's properties in a panel beside the table.
- Locate opens the device's floor with the device selected.
- The table has three segments: Placed, Awaiting placement and Historical; the last two are present and each says that it has no records yet.
- The filtered table exports as a CSV file holding the rows and columns shown.
- The exported file names the project, the basis and the time of export. (CB-41 · value)
**Refusals and edge cases**
- A search or filter with no matches says so; it does not show an empty table without explanation.
- A deleted draft is not listed under Historical, or in any other segment.
**Limits and values**
- Search and filter results appear within 1 second on the fixture.
- While the table is scrolled from its first row to its last, no main-thread task lasts longer than 200 ms. (CB-42 · value)

Notes: Left to later stories: the tabbed side panel (story 3.7); Historical filled by cancelled and corrected records (story 4.14) and removed devices (story 6.11); Awaiting placement (story 6.6); multi-select for bulk cleanup (story 6.7); the Doors and gates tab (story 7.4).

### Story 3.7: Device inspector with tabs

As a designer, I want one inspector layout for every device, so that I know where each kind of information is.

Covers: UX 7.2. Screens: S-04.

**Core behaviour**
- The same inspector opens for a device selected on the plan and for a row chosen on the Equipment page.
- The header shows the device's identifier, label, name, type, model and its lifecycle chip.
- Tabs for Details, Optics, Work, Checks, Evidence and History are present, and Optics appears for cameras only.
- Details holds the device's identity, model, mounting, room or area, location and notes.
- Optics holds the camera controls of story 2.12.
- Evidence lists the device's survey entries from story 2.16 and story 2.17 with author and time, and adds new ones.
- History lists the device's changes from the change log, each with its values before and after, the actor and the time.
- Work and Checks each say plainly that the feature is not available yet.
- The device menu offers Delete draft where story 2.19 allows it, and otherwise the "Why can't I delete this?" link.

Notes: Left to later stories: the other device-menu actions (story 4.14 and story 6.11); the Work tab, filled with marks (story 5.4), the planned action (story 6.8) and port assignments (story 7.6); the Checks tab (story 5.7 and story 5.9); flag chips in the header (story 5.13); condition in the header (story 6.1).

## Epic 4: Design, estimate and issue

**Outcome.** A design can be saved as a named revision, estimated, reviewed or bypassed, issued as the fixed installation reference and exported as a retained package.

**Depends on.** Epics 1, 2 and 3 complete. Within them this epic uses the sign-in throttle of story 1.3, sessions from story 1.6, Administration from story 1.10, the activity log from story 1.14, multi-part uploads from story 2.9, device records and the Room or area field from story 2.10, the acceptance-size project from story 2.11, Delete draft from story 2.19, the prototype import from story 2.20, self-hosted file storage from story 2.25, the Records timeline page and the Costs and capacity page from story 3.2, the status and approval-state components from story 3.3 and the Historical segment from story 3.6. Nothing later: every criterion in this epic can be tested with the stories before it.

**Why here.** Installation work in Epic 5 starts from an issued design, so revisions, review and issuing come before the field.

### Story 4.1: Save named revisions and list them in the Records timeline

As a designer, I want to save the design as a named revision that never changes afterwards, so that I can try alternatives without losing a version I may need again.

Covers: FR-1 (deletion guard for floors held in revisions), FR-22 (saving, prototype revisions), FR-34 (snapshots), FR-60 (historical references), NFR-1, AD-8. Screens: S-20.

**Core behaviour**
- An Editor saves a named revision of the active scope.
- The revision records its name, an identifier given by the server, its scope, the account that saved it and the time.
- Each named revision is listed as an entry on the Records timeline, which takes the place of the prototype's Revisions dialog.
- A revision opens read-only from the timeline.
- The snapshot is taken at one saved version of the project. Another person's edit that the server accepted after that version is not in it.
- After later edits to the working project, the revision's stored file has the same hash as when it was saved.
- Importing a version 1 or version 2 prototype project file that holds named revisions creates each as a named revision of the project's first scope, with its name and saved date, and each can be opened. (CC-04 · reading)
- After such an import the import review no longer lists named revisions as not imported.

**Refusals and edge cases**
- If any of the saving user's own edits is still Unsaved or in Conflict, the save is refused and those items are listed. Once none remain, the revision can be saved. (CC-02 · reading)
- A revision is listed only when its snapshot file is stored and its hash has been verified.
- A failed snapshot write shows as Failed with Retry and lists no revision.
- Saving a second revision with a name already used in the scope is refused with the reason. (CC-03 · decision)
- Deleting a floor that any saved revision contains is refused, and the refusal lists those revisions.
- A floor deletion sent from a page loaded before a revision containing that floor was saved is refused in the same way, and the floor is unchanged.

**Limits and values**
- Identifiers read "Rev A", "Rev B" and so on, in the order revisions are saved within the scope, and are never reused. (CC-01 · value)

Notes: Left to later stories: compare and restore (story 4.2); the timeline's other entries, each added by the story that creates the record; revisions of a later scope (story 6.15); revision content in portable backups (story 8.10).

### Story 4.2: Compare revisions and restore one into the working design

As a designer, I want to compare two revisions and restore an earlier one, so that I can see what changed and go back without losing the record of what happened since.

Covers: FR-22 (compare, restore), AD-7. Screens: S-20, S-21.

**Core behaviour**
- Two revisions can be compared side by side at one scale.
- The comparison lists the devices and settings that were added, removed or changed.
- A revision imported from a prototype file can be compared like any other.
- Before a restore is confirmed, a dialog states what will change (design content) and what will not (everything else in the project), and lists each item the restore will leave as it is, with the reason.
- A restore replaces the working design content with the content held in the snapshot: proposed devices and their planned positions, proposed routes, zones, obstructions and analysis settings return to the revision's values.
- A restore leaves unchanged the recorded attributes of every device whose lifecycle is Existing, and every survey note and photo.
- A draft device deleted since the revision returns with its original identifier.
- A restore deletes no revision. Revisions saved after the restored one stay in the timeline with unchanged hashes.
- The person who restored can undo the restore in the same session. (CC-05 · reading)

**Refusals and edge cases**
- A restore is one versioned operation. A save that another person based on the state before the restore is returned to them as a conflict, with their value kept on their page.
- The undo is refused with an explanation if any restored item has been changed since.
- Restore is not offered for a revision imported from a prototype file. (CC-06 · decision)

**Access and restore**
- A restore changes no installation record: accounts, sessions, invitations, project members, settings and the activity log's earlier entries are the same before and after.

Notes: This story sets the principle that a restore replaces design content only; each later story that adds a kind of record says what a restore does to it. Left to later stories: a camera moved in the field after the revision (story 5.6) or removed after it (story 6.11); the test that an earlier scope's revision cannot be restored (story 6.15).

### Story 4.3: More equipment types and device fields

As a designer, I want to record doors, gates, controllers, locks, power supplies, recorders and custom equipment, so that the design covers the whole system and not only cameras and sensors.

Covers: FR-7.

**Core behaviour**
- Doors, gates, access controllers, locks and strikes, request-to-exit devices, low-voltage power supplies, recorders and custom equipment can each be created, placed on a floor and edited.
- Each new record has its own unchanging identifier, a type, a model, mounting details, a location and notes, and lifecycle Proposed by default.
- Each new type appears in the plan, the equipment schedule and its export, and in search.
- Cameras record enclosure type and alarm interface, and both show in the schedule.
- Every device, of the earlier types and the new ones, has optional fields for serial number, IP address and MAC address. They show in the inspector and the equipment schedule.

**Refusals and edge cases**
- A door-contact record created before this story is still a contact afterwards and is not turned into a door.
- Creating a door, gate or custom record creates no other record: no components, no cables, no connections.
- A new record's model and specification fields are empty until someone fills them.
- Recording an enclosure type or an alarm interface creates no connection.

**Limits and values**
- An empty enclosure type, alarm interface, serial number, IP address or MAC address reads "Not recorded".

**Access and restore**
- A revision holds devices of the new types with their fields, and a restore treats them as story 4.2 treats any device.
- A proposed device of a new type is eligible for Delete draft on the conditions of story 2.19.

Notes: Left to later stories: linked components of doors and gates (story 7.4).

### Story 4.4: Camera-model templates

As a designer, I want reusable camera definitions by manufacturer, model and lens, so that I enter a camera's optics once and coverage uses the real figures.

Covers: FR-47. Screens: S-08 Camera models.

**Core behaviour**
- Templates can be created, edited, duplicated and searched by manufacturer, model number and lens or variant.
- A template records resolution as width by height in pixels for each capture mode.
- A template records lens type (fixed or varifocal) and focal length or focal-length range.
- A template records horizontal and vertical field of view in degrees, with the mode and focal setting they apply to.
- A template records the active imaging dimensions in millimetres where known, and the source of the specification.
- When placing a camera, the designer picks a template or the generic camera. The generic camera stays available.
- Two cameras placed from one varifocal template can hold different focal settings within the template's range, and each gives its own coverage and DORI result.
- Changing a camera's resolution or mode makes its results use that mode's pixels and framing, not the model's maximum.
- Editing a template afterwards leaves cameras already placed, saved revisions and survey evidence unchanged.
- A placed camera shows that its template has changed and takes the new values only when an Editor applies them to it. (CC-08 · reading)

**Refusals and edge cases**
- A camera placed from a fixed-lens template cannot be given another focal length.
- A focal setting outside a varifocal template's range is refused.
- A missing optical value shows as Unknown in the template and on the camera.
- A result that needs a missing value shows as not assessed with the missing input named; no generic value is substituted. (CC-09 · reading)

**Access and restore**
- A revision restore leaves templates unchanged. A camera that a restore returns holds the optical values recorded in the revision, and shows that its template has changed if it has. (CC-10 · reading)

Notes: Left to later stories: the retest that applying changed values triggers on a tested camera (story 5.14); several views and streams per camera (story 7.1); pan/tilt/zoom ranges (story 7.2).

### Story 4.5: Estimate with labour, percentage lines and subsystems

As a designer, I want an estimate with equipment, cable, accessory, labour and percentage lines grouped by subsystem, so that I can give a budget figure that shows what it rests on.

Covers: FR-17, FR-18, FR-22 (estimate lines in revisions and in the prototype file). Screens: S-14.

**Core behaviour**
- The estimate belongs to the active scope and is shown on the Costs and capacity page, where it replaces the prototype's Materials content.
- Equipment and cable lines carry an editable supply quantity, unit cost and allowance, and each category shows a subtotal.
- Manual accessory lines and labour lines can be added with a quantity, a unit and a rate.
- Every line has an inclusion tick.
- Excluding labour lowers the included total by the labour amount and keeps the entered rates and quantities.
- A percentage line states its percentage and the categories it applies to, and shows its base and its amount.
- A 10% contingency on equipment and cable changes when that base changes, and excluding it returns the total to its earlier value.
- Each equipment, cable, accessory and labour line sits in exactly one subsystem, set from its equipment type by default and changeable.
- Percentage lines sit in their own section outside the subsystems.
- The subsystem subtotals plus the percentage lines add up to the same total as the ungrouped view.
- The estimate is labelled an estimate and states its assumptions.
- The estimate exports to CSV with the same lines, inclusion states, subtotals and total.
- Importing a prototype project file brings its costs in as estimate lines, and the import review no longer lists costs as not imported.

**Refusals and edge cases**
- An earlier percentage line is part of a later percentage line's base only when it is explicitly selected.
- A line with no price reads Unpriced, not zero.
- A total or percentage amount that includes an unpriced line reads Incomplete with the number of unpriced lines.
- A prototype cost the estimate cannot represent is listed for review in the import review.

**Access and restore**
- A named revision saved after this story holds the estimate lines, and a restore returns them.

Notes: Left to later stories: the cancelled group (story 4.14); retained equipment that is not purchased again (story 6.8); reusing rates or copying lines into a later scope (story 6.15); cable supply quantity from the length ledger (story 7.10).

### Story 4.6: Capacity estimates

As a designer, I want storage and bandwidth estimates that follow the recorded streams, so that I can size the recorder and the network.

Covers: FR-19 (base). Screens: S-14.

**Core behaviour**
- Storage follows each recorded stream's bitrate, recording percentage and retention. Changing retention or bitrate changes storage.
- Bandwidth follows the streams sent. Changing the recording percentage changes storage and leaves bandwidth unchanged.
- Each figure states its units, its inputs and its overhead assumptions, and is labelled an estimate.
- The capacity figures are shown on the Costs and capacity page, where they replace the prototype's Capacity content.

**Refusals and edge cases**
- A camera with no bitrate recorded is listed as unknown demand, and no camera is counted as zero.
- With any such camera the total reads Incomplete with the count of those cameras. (CC-11 · reading)

**Access and restore**
- A revision holds the bitrate, recording percentage and retention inputs, and a restore returns them. (CC-12 · reading)

Notes: Left to later stories: multi-head cameras and display-only views (story 7.1); port and power capacity, and demand with no assigned switch (story 7.7).

### Story 4.7: Approval assignments

As a designer, I want to say who reviews a design and who gives final acceptance, so that everyone can see whose sign-off is expected.

Covers: FR-23, FR-25 (an assignment gives no access), FR-69. Screens: S-23.

**Core behaviour**
- An Editor assigns a design reviewer and a final-acceptance reviewer for the project.
- An assignee is an account that is a member or an administrator, or a named person who will use a reviewer link.
- The same person can hold both assignments, and an Editor can assign themselves.
- Each assignment shows the assignee, the account that made it and the time.
- An Editor can change an assignment at any time.

**Refusals and edge cases**
- Assigning an account that is neither a member of the project nor an administrator is refused with the reason.
- When an assignee's account is deactivated, removed from the project or stops qualifying, the assignment shows Unavailable with Reassign and Continue without approval.
- An assignment gives no account any access to the project that it did not have.
- With no reviewer assigned, no control in the project is disabled for want of an approval.

**Access and restore**
- A revision restore leaves assignments unchanged.

Notes: Left to later stories: decisions by the design reviewer's account (story 4.8); what Continue without approval records (story 4.9); links for named people (story 4.10); the final-acceptance decision on a closeout record (story 5.26); keeping or changing assignments for a later scope (story 6.15).

### Story 4.8: Request a review, comment and decide by account

As a reviewer with an account, I want to comment on a saved revision and record my decision, so that my sign-off is on record against the exact design I looked at.

Covers: FR-24 (decisions by account), FR-69 (decisions name the account). Screens: S-22, S-23.

**Core behaviour**
- An Editor requests a design review of a saved revision. The request records the account and the time.
- A signed-in Editor or administrator, or a Viewer who is the design-review assignee, can pin comments on the plan of a saved revision.
- The same people can record a decision on it, Approve or Request changes, under their account. An Editor who is the assignee can approve their own revision.
- A decision records the account with its name at the time, the time and the revision.
- A later decision adds a new entry and the earlier ones stay listed.
- Requests, comments and decisions are listed with the revision in the Records timeline, in place of the prototype's Review dialog.
- After the working layout is edited, the reviewed revision and its decisions are unchanged.

**Refusals and edge cases**
- A comment or decision from a Viewer who is not the assignee is refused by the server.
- Requesting a review when no design reviewer is assigned is refused with a prompt to assign one. (CC-14 · decision)
- A decision retried with the same operation identifier is recorded once.
- After an assignee's account is deactivated or removed from the project, its earlier decisions stay listed and its next attempt to decide is refused.
- A decision submitted by a Viewer whose assignment was reassigned while their page was open is refused with the reason, and the text they typed stays on the page. (CC-15 · reading)
- A decision changes no device record, note or photo, and gives no account any access it did not have.

**Access and restore**
- A revision restore leaves requests, comments and decisions unchanged.

Notes: Left to later stories: bypass and the review state shown for a revision (story 4.9); decisions by people without accounts (story 4.10).

### Story 4.9: Bypass a review, and the review state of a revision

As a designer, I want to bypass a review and to see at a glance where each revision stands, so that sign-off never blocks the work and a bypass is never mistaken for an approval.

Covers: FR-25, FR-69 (bypasses name the account). Screens: S-22, S-23.

**Core behaviour**
- An Editor can bypass the design review of a saved revision, whatever has been recorded on it.
- A bypass is recorded on that one revision, as Bypassed and never as Approved, with the account, the time and an optional reason.
- Bypassing one revision changes the state of no other revision.
- Each saved revision shows one review state, drawn with the approval-state component of story 3.3: No review, Awaiting decision, Approved, Changes requested or Bypassed.
- The state is No review when nothing is recorded on the revision, Awaiting decision after a request with no decision since, and Approved or Changes requested after the latest decision. (CC-16 · reading)
- A revision saved later starts at No review.
- Once a revision is bypassed its state stays Bypassed. A decision recorded afterwards is kept and labelled as made after the bypass. (CC-17 · decision)
- Continue without approval on an Unavailable assignment records a bypass on the revision being reviewed.

**Refusals and edge cases**
- A bypass retried with the same operation identifier is recorded once.
- A bypass changes no device record, note or photo, and gives no account or link any access it did not have.
- With every review bypassed, no control in the project is disabled for want of an approval.

**Access and restore**
- A revision restore leaves bypasses and review states unchanged.

Notes: Left to later stories: the state shown in the frame for the issued design (story 4.12); bypass of final acceptance on a closeout record (story 5.26).

### Story 4.10: Reviewer links: open one revision, comment and decide

As a client reviewer, I want to open one revision from a link, comment on the plan and give my decision without an account, so that I can review a design without being given the project.

Covers: FR-24 (reviewer links), FR-69 (unverified name in the interface), FR-71 (link events), NFR-5. Screens: S-24.

**Core behaviour**
- An Editor creates a reviewer link for one saved revision and for the named person assigned as design reviewer. (CC-18 · reading)
- "Members and reviewer links" lists the project's links with their revision and named reviewer, and an Editor can copy a link from it.
- A link opens only its revision, read-only, with its floors and comment pins.
- The reviewer enters a name before anything else, and the page says the name is not verified.
- The reviewer can pin comments on the plan and submit a decision, Approve or Request changes.
- Each decision shows the entered name, the time and the revision.
- A later decision through the same link is added as a new entry. Earlier entries stay listed and the latest is shown as the reviewer's current decision.
- A decision through a link sets the revision's review state as an account's decision does in story 4.9.
- A decision made through a link is labelled with the name marked "not verified", in the review list and in the Records timeline. A decision made by an account shows the account name without that mark.
- A decision through a link adds an activity-log entry with the entered name marked not verified.
- Creating a link adds an activity-log entry with the acting account. No entry contains the link's token.

**Refusals and edge cases**
- The server refuses a request from the link for the working project, another revision, another project or a file that the revision does not contain.
- Creating a link when the design reviewer is an account, or when none is assigned, is refused with the reason.
- A decision retried, or submitted from two browsers with the same operation identifier, is recorded once.
- A submission with no name, or over a limit below, is refused with the reason.

**Limits and values**
- The name is required and is at most 80 characters. (CC-19 · value)
- A comment is at most 2,000 characters, and a link accepts at most 200 comments. (CC-20 · value)

**Access and restore**
- A revision restore leaves links and what was recorded through them unchanged.

Notes: Left to later stories: replacing, revoking, expiry and the administrator's list (story 4.11); the unverified-name label in packages (story 4.15); links to a closeout record (story 5.26). This replaces the prototype's development-only review service.

### Story 4.11: Reviewer links: replace, revoke, expire and oversee

As a designer or an administrator, I want to replace, revoke and oversee reviewer links, so that an unauthenticated link never stays open longer or wider than intended.

Covers: FR-24 (revocable, replaceable links), FR-70 (Reviewer links), FR-71, NFR-5. Screens: S-24, S-32.

**Core behaviour**
- Editors can replace and revoke their project's links.
- Replacing a link makes the old one stop working at once.
- Revoking or replacing a link keeps its earlier comments and decisions.
- A link expires 30 days after it was created, and an Editor replaces it to give more time.
- Replacing and revoking a link each add an activity-log entry with the acting account. No entry contains the link's token.
- An administrator sees every active link in the installation with its project, revision, named reviewer, creator and last use, and can revoke any.
- Revoked links move to a history list with their decisions.

**Refusals and edge cases**
- After a link is revoked or replaced, its next request is refused. Text already typed stays on the page and nothing is recorded.
- A request through an expired link is refused and nothing is recorded.
- When the assignment a link serves is reassigned, or the review of its revision is bypassed, the link still shows the revision and accepts no new comment or decision. (CC-21 · decision)
- Reassigning an approval assignment does not revoke an existing reviewer link for the previous reviewer. The link stays read-only until it expires or an Editor revokes or replaces it. (CC-21 · decision)
- The administrator's list of links shows such a link as "Read-only: reviewer reassigned", with the previously named reviewer. (CC-21 · decision)
- A standard user cannot open the installation's list of links.

**Limits and values**
- A revoked or replaced link reads "This link is no longer valid", and an expired one reads "This link has expired". (CC-23 · value)
- After 20 requests with invalid link tokens from one network address within 15 minutes, further link requests from that address are refused for 1 minute, doubling after each further failure up to 15 minutes: the figures story 1.3 uses for failed sign-ins. (CC-22 · value)

Notes: Left to later stories: a link whose revision is superseded (story 4.13); whose scope is closed (story 5.25); whose project is archived (story 6.16); links cancelled by a restored project (story 8.5) or a recovered installation (story 8.7).

### Story 4.12: Issue a design as the current reference

As a designer, I want to issue a named revision and mark it as the current reference, so that installers know exactly which design they are building.

Covers: FR-25 (issuing without approval), FR-26, FR-55 (an issued device is not a deletable draft), FR-61. Screens: S-22, S-01.

**Core behaviour**
- An Editor issues a saved revision of the active scope in three steps: choose the revision, then record an approval, request a review or bypass, then confirm that it becomes the current reference.
- The three choices in the second step are offered with equal weight, and each records what story 4.8 or story 4.9 records.
- A revision can be issued with its review bypassed, or while a requested review is still awaiting a decision. (CC-24 · reading)
- After issuing, the frame's issued-design chip shows the revision's identifier, its name, the issue date and the scope.
- The chip opens the issued design read-only.
- The issued design's review state shows separately from Current, as Approved, Changes requested, Awaiting decision or Bypassed.
- Each designation records the account and the time, and the Records timeline lists every designation in order.
- Designating changes no working record: every device, position, note and photo is the same before and after.
- Saving a new revision, or exporting the estimate or a schedule, leaves the designation unchanged.

**Refusals and edge cases**
- When two people designate at once, one succeeds and the other sees a conflict naming the revision that is now current.
- A Request changes decision recorded after issuing changes the state shown to Changes requested and leaves the designation unchanged.

**Access and restore**
- A revision restore leaves the designation and its history unchanged.
- A proposed device contained in an issued design is not offered Delete draft, and the "Why can't I delete this?" link gives that reason.
- A Delete draft sent from a view loaded before the design was issued is refused with the reason, and the device is unchanged.

Notes: Left to later stories: superseding and comparing with the working project (story 4.13); the issued-design strip where installers start work (story 5.1 and story 5.3); the warning when work starts with nothing issued (story 5.4); the test that an earlier scope's revision cannot be designated, and a later scope starting at Not issued (story 6.15); a service scope, which needs no issued design (story 6.19). An issued revision is never at No review, because the second step always records a decision, a request or a bypass.

### Story 4.13: Supersede an issued design and compare it with the working project

As a designer, I want to issue a later revision in place of an earlier one and compare what was issued with the project as it stands, so that the reference can move on without the earlier one being lost.

Covers: FR-24 (decisions kept), FR-26 (another fixed reference, comparison), FR-61 (deliberate change of designation). Screens: S-20, S-21, S-22.

**Core behaviour**
- When Revision B is made current after A, A is marked Superseded and links to the current one.
- A's snapshot, comments and decisions can still be opened, and its hash is unchanged.
- B shows no approval because A was approved: B's review state comes only from requests, decisions and bypasses recorded on B.
- A superseded revision can be made current again. The history then shows both of its designations, and the revision that was current is marked Superseded. (CC-25 · reading)
- The issued design can be compared with the working project in the compare view of story 4.2.
- After the working layout is edited, the issued snapshot's hash and its decisions and bypass are unchanged.

**Refusals and edge cases**
- A reviewer link to a superseded revision still shows that revision and accepts no new comment or decision. (CC-21 · decision)
- A decision recorded by an account on a superseded revision is kept and labelled as made after it was superseded. (CC-27 · reading)

Notes: Left to later stories: proof that field records are untouched by a change of reference (story 5.4 and story 5.6).

### Story 4.14: Cancel a proposal and correct a record

As a designer, I want to cancel a proposal that will not be installed, or correct a record entered in error, so that the design is right without deleting history or inventing a removal.

Covers: FR-55 (cancellation, correction), UX decision D8. Screens: S-04 device menu.

**Core behaviour**
- Of Delete draft, Cancel proposal and Correct record, the device menu offers the one that applies to the device.
- A "Why can't I delete this?" link lists what makes the device ineligible for the others.
- A proposed device in an issued design is cancelled with a short reason. The issued snapshot still shows it, and the compare view shows it as cancelled.
- A proposed device that was never issued and carries a survey note or photo is cancelled with a reason. Its identifier, history, notes and photos stay findable.
- A cancelled device leaves the proposed plan, the proposed schedule, the estimate total and the capacity totals.
- The cancelled device's estimate line is kept with its entered quantity and cost in a "Cancelled" group outside the total. An Editor can tick it as a committed cost, and it then counts in the total under that label. (CC-28 · reading)
- An Existing device entered in error or twice is corrected with a reason and, for a duplicate, a reference to the record that is kept. The correction is recorded as a correction, not as a removal.
- A cancellation or correction records the account, the time and the reason.
- Cancelled and corrected records are listed under Historical in Equipment with their reason, and are found by search.
- A cancellation or correction made by mistake is reversed with a reason. The device returns to where it was, and both entries stay in its history.

**Refusals and edge cases**
- A proposed device that is eligible for Delete draft is offered Delete draft, not Cancel proposal.
- A cancellation, correction or reversal with no reason is refused. (CC-29 · reading)
- A cancellation or correction based on a stale view of the device is returned as a conflict.

**Access and restore**
- A revision restore leaves cancellations and corrections unchanged, and its dialog lists a cancelled device that the revision still holds as proposed.

Notes: Left to later stories, each adding its own action to the device menu: reversing a mistaken Installed mark (story 5.5) and recording a removal (story 6.11). Also left: cancelling a proposal that carries test attempts (story 5.10); the cancelled item in the closeout (story 5.24).

### Story 4.15: Design package: contents drawn from a saved revision

As a designer, I want a Design package generated from a saved revision with everything an installer needs in it, so that what I hand over matches one fixed design.

Covers: FR-33 (Design preset contents), FR-34 (fixed source and cutoff), FR-69 (unverified name in packages). Screens: S-37.

**Core behaviour**
- A package is generated from a saved revision, never from the working project.
- The cover and the manifest identify the property, the scope, the revision, the edition, the issue and export dates, the units, the floors included, the decision cutoff and Draft or Issued status.
- A package of a revision that is not issued reads Draft.
- The package contains proposed floor plans with labelled devices and routes, Existing equipment shown as context, and a legend.
- The package contains the equipment and cable schedules, the quantities and the capacity summary.
- The package contains survey notes, measurements and photos.
- The package contains the review requests, decisions and bypasses recorded on the revision.
- Every device identifier on a plan sheet matches its row in the equipment schedule.
- Design content is taken from the revision's snapshot. Review entries are separate records added over time, and the package prints those recorded up to its cutoff.
- The cutoff is the time generation started. (CC-30 · value)
- Survey notes, measurements and photos are printed as recorded up to the time the revision was saved. (CC-31 · reading)
- A decision made through a reviewer link is printed with its name marked not verified. A decision made by an account is printed with the account name, without that mark.
- At this story the generated PDF is saved by the browser, no edition is kept on the server, and the cover reads "Not retained".

**Refusals and edge cases**
- Generate is disabled, with the reason, when the selection produces no pages.
- A required file that cannot be read fails the generation with the file named; no blank page takes its place.

Notes: Left to later stories: page layout and options (story 4.16); volumes and upload (story 4.17); kept editions (story 4.18); scoped checklist expectations linked by device identifier (story 5.8); open issues (story 5.18); the Closeout preset (story 5.27); planned actions and retained context (story 6.9); the extended-model sheets (story 7.11).

### Story 4.16: Design package: page layout and options

As a designer, I want the package laid out on readable pages with clear options for what is included, so that it prints well and nothing is left out without saying so.

Covers: FR-33 (layout, options, omission labels), NFR-6, AD-11 (smaller pages), experiment R15. Screens: S-37.

**Core behaviour**
- Coverage and DORI sheets are separate from the plan sheets and optional.
- Each coverage or DORI sheet shows zone targets, results and shortfalls with the basis, assumptions and limits of the analysis.
- A table or note that runs over a page continues with its heading repeated, and no row is cut off.
- Each photo is captioned with its device or note identifier, floor and date.
- Prices and labour costs can be turned on for a package. Turning them on changes no saved record and no one's access.
- Photos can be left out, and the package then names what was omitted.
- Schedule and table pages are written as real text that can be selected and searched.
- Plan and photo pages are images at the JPEG quality chosen in experiment R15.

**Refusals and edge cases**
- A selection of some floors is labelled Partial before generation and on every page, and the manifest lists the floors included.
- A plan background that is not included, such as a live map, is named as omitted.

**Limits and values**
- Pages are Letter or A4 landscape.
- Photos are two to a page.
- Prices and labour costs are off by default, and all floors are selected by default.

**Evidence to record**
- Experiment R15 is run and recorded: plan and photo pages printed at JPEG quality 0.94, 0.85 and 0.75 and compared by a person, with the chosen quality and the reason written down.

Notes: Experiment R1 found the prototype's pages at 570 to 710 KiB each, which reaches 100 MiB at about 150 pages; text pages and the R15 quality bring that down.

### Story 4.17: Design package: volumes, upload and verification

As a designer, I want a large package split into volumes and uploaded reliably, so that a big property still produces one complete, checked edition.

Covers: FR-33 (volumes, limits), FR-34 (failed generation visible and retryable), NFR-6, AD-4, AD-11, experiments R1 and R6. Screens: S-37.

**Core behaviour**
- All volumes of an edition come from the one revision.
- A volume is split at the page or size limit below, whichever comes first, and volumes are numbered.
- The manifest lists every volume and its hash.
- Each volume uploads in equal parts with progress and time remaining.
- Each volume is released from memory before the next is generated.
- The screen says the tab must stay open.
- The server checks each completed file's size and hash against the declared values.
- The edition is listed, in Packages and in the Records timeline, only when every volume and the manifest are stored and verified. Its cover no longer reads "Not retained".

**Refusals and edge cases**
- A size or hash mismatch shows Failed with Retry.
- A failed edition shows as Failed, is not listed as an edition, and can be retried.
- After a dropped connection the upload resumes from the last accepted part.
- When the volumes generated so far reach the edition limit, generation stops, the edition shows Failed with the reason, and the volumes already stored are discarded. (CC-32 · reading)
- That failure offers a smaller floor selection or fewer optional contents. Nothing is left out silently to fit.
- If the tab is closed during generation or upload, no edition is listed, generation can be started again, and the parts already stored are discarded as an unfinished upload under story 2.9.
- If the person's role changes to Viewer or their membership is removed during upload, the next part is refused, the stored parts are discarded and no edition is listed.
- If the session ends between parts, the stored parts are kept, and after the same account signs in again in the open tab the upload resumes from the last accepted part. (CC-33 · reading)

**Limits and values**
- A volume is at most 250 pages and 100 MiB.
- An edition is at most 1 GiB across its volumes and manifest.
- An upload in progress counts as use of the session, so an edition that takes longer than the 24-hour idle period is not cut off by it.

**Evidence to record**
- Generation time and upload time are reported separately.
- On the acceptance-size project from story 2.11, generating a complete edition takes no more than 5 minutes, not counting upload. (CC-34 · reading)

Notes: Experiments R1 and R6 were run early and their results are in the architecture. The 5-minute timing here is a development measurement; the acceptance run is story 10.4. Left to later stories: counting editions toward project storage usage, and abandoned parts not counting (story 8.14).

### Story 4.18: Design package: editions kept exactly

As a designer, I want every generated edition kept exactly as it was, so that what I handed over can always be downloaded again unchanged.

Covers: FR-34 (fixed packages, editions), FR-61 (packages of a superseded issue; export does not designate). Screens: S-20, S-37.

**Core behaviour**
- Edition numbers are given by the server.
- Each kept edition lists its source revision, its date and its decision cutoff.
- Downloading an edition again returns the same bytes.
- Regenerating, or generating after a later decision, creates a new dated edition with its own cutoff and leaves the earlier one unchanged.
- Generating a package of a revision that is not the current reference leaves the designation unchanged.
- After a revision is superseded, its editions are still listed and download with the same bytes as before.

**Refusals and edge cases**
- Two people generating for one revision at once get two editions with different numbers.

**Access and restore**
- A revision restore leaves every edition unchanged.

Notes: Left to later stories: appending an edition to an archived project (story 6.16); editions in backups (story 8.1 and story 8.10).

## Epic 5: Install, test and close out in the field

**Outcome.** A technician with a phone can find a device, read what is required, record work, results and photos, and the scope can be closed honestly with a Closeout package.

**Depends on.** Epics 1 to 4 complete. From Epic 4: named revisions, the Records timeline and the floor-deletion guard (story 4.1), revision restore (story 4.2), the serial number, IP address and MAC address fields (story 4.3), camera-model templates (story 4.4), the estimate (story 4.5), approval assignments (story 4.7), review decisions and bypass (story 4.8 and story 4.9), reviewer links (story 4.10 and story 4.11), the issued design and its approval state (story 4.12), designating a different issued design (story 4.13), cancellation, correction and the device menu (story 4.14), and packages (story 4.15, story 4.16, story 4.17 and story 4.18). From earlier epics: sessions (story 1.6), the first work scope and the project list (story 2.1), saving and conflicts (story 2.2, story 2.3, story 2.4 and story 2.5), guarded floor deletion (story 2.6), device records with lifecycle, the basis control, search and the Room or area field (story 2.10), the acceptance-size fixture (story 2.11), coverage (story 2.12 and story 2.13), routes (story 2.15), notes with their on-form warning (story 2.16), photos (story 2.17), Delete draft (story 2.19), the project frame and view switch (story 3.1), the Overview and the other areas (story 3.2), the status language and its approval-state component (story 3.3) and the inspector tabs (story 3.7). Nothing later: no criterion in this epic needs a story from Epics 6 to 10.

**Why here.** Field recording needs an issued design to compare against, and Epic 6 (existing sites, removal, reopening) builds on the installed marks, checks and issues defined here.

### Story 5.1: Field shell and the issued-design chip

As a technician, I want the app on my phone to open in a layout made for site work, with the issued design always in view, so that I can use it with one hand and know which design I am building.

Covers: NFR-3, FR-61 (shown where installers start work), UX 8.1, decisions D3 and D4. Screens: S-F1.

**Core behaviour**
- On a phone, a project opens in the field shell: one top row with the floor switcher, save status and account menu, and bottom navigation with Plan and Equipment.
- Directly under the top row a chip is always visible showing the current issued design's identifier and name, its issue date and the active work scope. It is not inside the account menu.
- Tapping the chip opens the issued design read-only, with no editing controls.
- The opened issued design shows its approval state (Approved, Changes requested, Awaiting decision, Bypassed or No review) with the component of story 3.3, separately from the word Current.
- When a different design is designated current in another browser, the chip shows the new identifier and date within 5 seconds.
- A phone always gets the field shell. A tablet or laptop gets it by available width and can switch between the field shell and the desktop workspace.
- The field shell has no tools for plan alignment, walls, zones, routes, estimate editing or checklist template editing. Coverage can be shown as a layer.

**Refusals and edge cases**
- When nothing is issued for the active scope the chip reads "Not issued" with the work scope, and tapping it explains that no design has been issued.

**Limits and values**
- The choice between field shell and desktop workspace on a tablet or laptop is remembered in that browser. (CD-01 · reading)
- Every control is at least 44 px high, form text is at least 16 px, and every input has a visible label.
- At 200% zoom the top row, the chip, the bottom navigation and every form field can be reached and operated, no label or value is cut off, and no form scrolls sideways. (CD-02 · value)

**Access and restore**
- A Viewer sees a "View only" chip in the field shell.

**Evidence to record**
- The shell, the chip and the opened issued design are checked on a real iPhone in Safari, a real iPad in Safari and a real Android phone in Chrome, with the hardware, system and browser versions recorded.

Notes: The bottom navigation gains Work in story 5.15 and Issues in story 5.18.

### Story 5.2: Find a device in the field

As a technician, I want to reach one device quickly by search, by list or by tapping the plan, so that I spend my time on the work and not on the app.

Covers: NFR-3 (equipment lookup), UX 8.2 (Find). Screens: S-F2.

**Core behaviour**
- A device can be found by search on identifier, label, name, room or area, or model, with recently opened devices listed first.
- A device can be found in a list filtered to the current floor.
- A device can be found by tapping its marker on the plan.
- All three ways open the same device sheet.
- A tap that lands near several devices opens a chooser listing them, and choosing one opens its device sheet.
- Opening a device from a search result requests that device and its floor only, not the other floors' plans or devices.

**Limits and values**
- Markers are at least 44 px.
- On the acceptance-size project, search returns results within 1 second in at least 19 of 20 trials.

**Evidence to record**
- The search timing on the acceptance-size project is recorded.
- The three ways of finding a device are checked on a real iPhone in Safari, a real iPad in Safari and a real Android phone in Chrome.

Notes: Left to later stories: the filtered lists "Not installed" (story 5.4), "Checks outstanding" (story 5.15) and the survey filters (story 6.6). The search timing is a development measurement; the acceptance run is story 10.2.

### Story 5.3: The device sheet and the issued reference

As a technician, I want to see what is recorded on site beside what the issued design requires, so that I know what to do at each device and can see where the site differs.

Covers: FR-2 (views), FR-26, FR-41 (base), FR-61, UX 5.3, decision D2. Screens: S-F3, S-03.

**Core behaviour**
- The device sheet shows identity and lifecycle, then states what to do in one sentence. For a Proposed device the sentence begins "Add new" and gives the type, mounting, height and aim from the current issued design.
- The device sheet lists the device's requirements from the current issued design, not from the working draft.
- "Compare with issued" shows issued and recorded values side by side for each field where they differ.
- "Compare with issued" says "No differences" when there are none.
- In Installation view the map has an issued reference toggle. When on, each device's issued position appears as a ghost outline, with a line to the recorded position where the two differ.
- On desktop, the inspector's Work tab shows the same sentence, requirements and "Compare with issued", in place of its "not available yet" text.

**Refusals and edge cases**
- When nothing is issued for the active scope, the device sheet reads "Not issued — no requirements" and shows no draft values as requirements.
- When nothing is issued, "Compare with issued" and the issued reference toggle are unavailable and say why.
- A device added after the design was issued reads "Not in the issued design" in the comparison. (CD-03 · value)

**Evidence to record**
- On a real iPhone and a real Android phone, the device sheet, the comparison and the issued reference toggle are opened and read.

Notes: Left to later stories: condition on the device sheet (story 6.1); the wording for planned actions other than Add new (story 6.8); the device's connection, closet and port (story 7.6).

### Story 5.4: Mark work Installed and Configured

As a technician, I want to mark a device installed and configured, so that the project shows what work has actually been done.

Covers: FR-30 (work recorded), FR-26 (work started with nothing issued), FR-55 (Delete draft eligibility), the device state model (work recorded per device per scope). Screens: S-F4, S-04 Work tab.

**Core behaviour**
- In this epic a device is in scope when it is Proposed and not cancelled, or became Existing through an Installed mark recorded in the active scope. A device set to Existing by hand or brought in as Existing is not in scope.
- The device sheet of an in-scope device has two separate marks, Installed and Configured.
- Setting a mark records the account's name, the time and the active scope. A device holds at most one Installed and one Configured mark for each work scope.
- Recording Installed on a Proposed device sets its lifecycle value from story 2.10 to Existing, and it appears in Current installation at its recorded location.
- Configured can be set before Installed. The device then shows a neutral notice that it is marked configured but not installed, and nothing is blocked. (CD-04 · reading)
- When the first Installed mark of a scope is recorded while nothing is issued for that scope, the mark is saved at once and the project shows the warning "Work started with no issued design".
- The warning carries a link that takes an Editor to issue a design (story 4.12), and it goes away when a design is issued for the scope.
- The field shell's filtered lists gain "Not installed": the in-scope devices with no Installed mark in the active scope.
- On desktop, the inspector's Work tab shows the two marks with the same behaviour.

**Refusals and edge cases**
- When a second person sets a mark that is already set in the scope, no second entry is created. The first name and time stay, and the second person sees who set it.

**Limits and values**
- The warning is shown on the Overview, beside the frame's issued-design chip and beside the field shell's chip. (CD-05 · value)

**Access and restore**
- A Viewer sees the warning without the link to issue.
- A revision restore leaves Installed and Configured marks unchanged.
- Designating a different current issued design leaves the marks unchanged.
- A device with an Installed or Configured mark is not offered Delete draft.
- A Delete draft sent from a stale view after a mark was set is refused with the reason.

Notes: Left to later stories: reversing a mistaken mark (story 5.5); the rule that a mark changes no phase count (story 5.15); refusing a mark when no scope is active (story 5.25); marks on existing devices with a planned action (story 6.8); a planned Remove, which is completed by the recorded removal and not by an Installed mark (story 6.11); marks in a later scope (story 6.15); a service scope, which needs no issued design and shows no warning (story 6.19).

### Story 5.5: Reverse a mistaken mark

As a technician, I want to take back an Installed or Configured mark I set by mistake, so that the record does not claim work that was not done.

Covers: FR-55 (reversing a mistaken Installed or Configured mark), the device state model. Screens: S-04 device menu.

**Core behaviour**
- The device menu of story 4.14 gains "Reverse installed mark". A mistaken Installed mark is reversed with a required reason.
- After the reversal an add-new device returns to Proposed and leaves Current installation.
- The device's notes, photos and other evidence stay attached.
- The reversal is listed in the device's history with actor, time and reason.
- A Configured mark can be cleared with a required reason, kept in the device's history.

**Refusals and edge cases**
- "Reverse installed mark" is not offered for a device that was Existing before the scope. A request for one is refused by the server and the device's lifecycle is unchanged.

**Access and restore**
- A device whose mark was reversed or cleared is still not offered Delete draft.
- A revision restore leaves reversals unchanged.

Notes: Left to later stories: the Needs review flags a reversal raises (story 5.13); reversing the mark of a relocated device and of a device that was Existing before the scope, which stays Existing (story 6.8).

### Story 5.6: Report a change found on site

As a technician, I want to record where the site differs from the drawing, so that the project shows what is actually there without waiting for anyone's review.

Covers: FR-27, FR-26 (the field record is kept apart from the issued design), FR-33 (settings and identifiers recorded for closeout), UX 8.3, decision D6. Screens: S-F4, S-F5.

**Core behaviour**
- "Report a change" on the device sheet offers Moved, Different equipment, Route changed and Other.
- Each report is saved at once as the recorded condition, with the affected identifiers, before and after values, actor, time and a short required reason.
- A photo can be attached to a report and is optional.
- A moved camera appears at its new position in Current installation as soon as the change is saved, without any review step.
- After a field change, the issued design, its package and its approval or bypass record are unchanged, checked by the revision's hash.
- Placing and moving on a touch screen use a fixed crosshair with "Place here" and four nudge buttons. Dragging is available and is never required.
- The device sheet shows the serial number, IP address and MAC address fields of story 4.3 for the installed unit, and filling one in asks for no reason.
- Adding a note or photo, or setting a mark, asks for no change reason.
- On desktop, the inspector's Work tab offers "Report a change" with the same four kinds.

**Access and restore**
- A revision restore leaves recorded positions, recorded identifiers and recorded field changes unchanged.
- Restoring a revision saved before a camera was moved in the field leaves its recorded position as it is and lists the camera for review.
- Designating a different current issued design leaves recorded positions and field changes unchanged.

**Evidence to record**
- On a real iPhone and a real Android phone, a camera is moved with the crosshair and the nudge buttons, without dragging.

Notes: Left to later stories: the checks a change flags (story 5.13); refusing a field change when no scope is active (story 5.25); a planned relocation (story 6.8); recorded removal (story 6.11); changes to ports and power connections (story 7.7).

### Story 5.7: Checklists and starters

As a designer, I want editable checklists with starters for each device type, so that technicians know what to check and what result is expected.

Covers: FR-29, FR-42 (checklist definitions). Screens: S-16.

**Core behaviour**
- A new project has a common checklist covering identity and location, mounting, cable labels and connections, intended settings and system associations, and observed function.
- Starters exist for camera (dome or bullet), reader, door contact or motion detector, intercom, switch, and cabinet or light, plus a generic starter.
- A device type with no dedicated starter gets the common checklist and the generic starter.
- Every check belongs to Installation, Configuration or Testing and states its task, its method or conditions, and its expected result, with a value and tolerance where the check is measured.
- The applicable core checks are required by default for each in-scope device (story 5.4), and stay required after the device is marked Installed.
- A project Editor can change, per check, whether it applies, whether it is required or optional, its expected result, and whether a photo or measurement is required.
- The four optional camera checks (direct sun at sunrise or sunset, bright sources at night, a person at the far end of the view, a person behind or in the shadow of a named obstruction) are listed and off by default.
- A far-end or obstruction check can name the zone, range or obstruction it verifies.
- Each change to a checklist definition is saved as a new version with actor and time, and earlier wording and expected results remain readable.

**Refusals and edge cases**
- A check with no expected result shows Needs definition. Needs definition is shown as a flag, not as an outcome.
- When two Editors change the same check definition, the first save is accepted and the second becomes a conflict.

**Limits and values**
- No starter contains a pass threshold supplied by the application. Values and tolerances are entered by the project.

**Access and restore**
- A revision restore leaves the working checklist definitions unchanged.

Notes: Left to later stories: checklist expectations in revisions and the Design package (story 5.8); recording results (story 5.9); what a definition change does to recorded results (story 5.14); applicability by planned action and scope category (story 6.8 and story 6.10); the pan/tilt/zoom starter (story 7.2).

### Story 5.8: Checklist expectations in revisions and the Design package

As a designer, I want the Design package to list the checks expected for each planned device, so that the installer receives the acceptance expectations with the drawings.

Covers: FR-33 (Design preset: scoped checklist expectations), FR-29 (earlier wording preserved), FR-34 (packages come from a fixed source). Screens: S-37.

**Core behaviour**
- Saving a named revision records, in its snapshot, the checklist definitions in force at that moment and the checks scoped to each planned device. (CD-07 · reading)
- The Design package generated from a revision lists, for each planned device identifier, its scoped checks with task, expected result and required or optional status.
- The checklist pages use the same device identifiers as the equipment schedule.
- Generating the package again after the working definitions have changed lists the same expectations as before.

**Access and restore**
- A revision restore never writes the definitions held in a snapshot back to the working checklists.

### Story 5.9: Record a check's outcome

As a technician, I want to record Pass, Fail or N/A against each check, with the measurement where one is asked for, so that a result is only as good as what was observed.

Covers: FR-30, FR-29 (Needs definition cannot pass), FR-44 (the criteria tested are recorded with the attempt), NFR-3. Screens: S-F4, S-04 Checks tab.

**Core behaviour**
- On the device sheet, checks are grouped as Installation, Configuration and Testing, each showing its task and expected result.
- A check with no attempt reads Not tested.
- The outcome buttons are Pass, Fail and N/A.
- Fail requires a short explanation.
- N/A requires a reason and is counted separately from passes.
- A measured check asks for value, unit and conditions before Pass is offered.
- Recording an outcome on a device that is still Proposed is allowed.
- On desktop, the inspector's Checks tab shows the same checks and records outcomes, in place of its "not available yet" text.

**Refusals and edge cases**
- A check showing Needs definition offers no Pass.
- A measured value must be a number, in the unit the check defines. Anything else is refused with the reason. (CD-08 · reading)
- Where a measured check defines a tolerance and the value is outside it, Pass is not offered. (CD-09 · reading)
- An outcome submitted against a definition that changed after the page loaded is not recorded. It is returned to the technician with the new definition beside what they entered. (CD-10 · reading)

Notes: Left to later stories: attempts, retests and corrections (story 5.10); photos as evidence (story 5.11); refusing a result when no scope is active (story 5.25).

### Story 5.10: Attempts, retests and corrections

As a technician, I want each retest kept as a new attempt and each mistake corrected without erasing it, so that the history of what was tested is complete.

Covers: FR-31, FR-30, FR-44 (original attempts preserved), FR-55 (Delete draft eligibility; cancelling a proposal that has attempts), AD-4. Screens: S-F4.

**Core behaviour**
- Each recorded outcome is a new attempt with actor, time, the active scope, the wording and expected result it was recorded against, the actual result and its evidence.
- Earlier attempts are listed beneath the check.
- A passing retest leaves the earlier failure and its evidence in the list.
- After a check's definition changes, earlier attempts still show the wording and expected result they were recorded against.
- An attempt entered by mistake is corrected by a correction note with a required reason. The original entry stays visible, marked corrected, and is no longer counted. (CD-11 · reading)
- A correction made by mistake is reversed with a required reason. The attempt is counted again and both entries stay on record. (CD-12 · reading)
- A proposed device that was never issued and has a test attempt can be cancelled with a reason under story 4.14, and its attempts stay findable under Historical.

**Refusals and edge cases**
- Two people adding attempts to one device both succeed.
- A retried addition does not create a duplicate attempt.

**Access and restore**
- A revision restore leaves attempts and outcomes unchanged.
- Designating a different current issued design leaves attempts unchanged.
- A device with a test attempt is not offered Delete draft.
- A Delete draft sent from a stale view after an attempt was recorded is refused with the reason.

Notes: Left to later stories: flags raised when a condition or definition changes after a Pass (story 5.13 and story 5.14); the contradiction notice for an attempt on a Proposed device (story 5.15).

### Story 5.11: Photos and notes as evidence for a check

As a technician, I want to take a photo for a check and see when it is really saved, so that a result never claims evidence that is not stored.

Covers: FR-31 (photos and required evidence), FR-20 (prompts in the field), NFR-2, NFR-3, NFR-5 (site credentials kept out of notes). Screens: S-F4.

**Core behaviour**
- "Take photo" opens the camera and "Choose photo" opens the library.
- A photo taken from a check is attached to that attempt and shows the Uploading, Saved and Failed states of story 2.17.
- Where a check requires a photo, Pass is offered only once a photo has been attached to the attempt.
- Where a check requires a photo, a Pass recorded while the photo is Uploading or Failed reads "Pass pending evidence" and is not counted as passed until the photo is Saved. (CD-13 · decision)
- The field note form offers the optional prompts of story 2.16, and they can be skipped.
- The field note form and the explanation and reason fields of a check show story 2.16's warning against entering passwords or access codes for the site's systems.

**Access and restore**
- A revision restore leaves photos and notes attached to attempts unchanged.

**Evidence to record**
- Taking a photo and choosing one from the library are checked on a real iPhone in Safari, a real iPad in Safari and a real Android phone in Chrome.

Notes: Left to later stories: counting Pass pending evidence as outstanding (story 5.15 and story 5.23). The photo size limit, allowed types and resumed uploads are set in story 2.17.

### Story 5.12: Large photos over a poor connection

As a technician, I want a large photo to finish uploading when the signal is weak, so that evidence from a basement or a car park is not lost.

Covers: experiment R4, NFR-2, NFR-3.

**Core behaviour**
- A photo at the size limit, taken on a phone, reaches Saved over a slow connection that drops twice, resuming each time from the last accepted part.

**Limits and values**
- The test photo is 25 MiB, the upload is throttled to 400 kbit/s, and the connection is dropped twice during the upload. (CD-15 · value)

**Evidence to record**
- Experiment R4 is run on a real iPhone and a real Android phone under those conditions.
- The architecture's experiment record states the time taken on each phone, whether resume worked, and the decision on the fallback (smaller parts, or a warning before very large files).

### Story 5.13: A change on site flags the checks it affects

As a technician, I want a change on site to flag the checks it puts in doubt, so that nothing stays passed for a condition that no longer exists.

Covers: FR-28, FR-44 (follow-up flags), FR-55 (follow-up after a reversed Installed mark).

**Core behaviour**
- Needs review and Retest required are shown as flags beside a check, each linked to the change that caused it, the affected device and a reason.
- A flag is not an outcome, and the earlier attempt keeps its recorded outcome.
- A check flagged Retest required is not counted as passed.
- Moving or re-aiming a tested camera, or changing its height or lens, keeps the old attempt and flags its placement, mounting and image checks Retest required.
- A recorded change of equipment or configuration flags that device's settings and function checks Retest required.
- A recorded route change flags the link checks of the devices at the route's ends Retest required.
- A recorded change to a shared switch or power supply lists the devices whose routes end on it as affected and flags their link and function checks Needs review. (CD-16 · reading)
- The same list states that other effects are uncertain and need review.
- After an actual move, coverage and other results on the Current basis are recalculated for the new position.
- Reversing an Installed mark flags the device's Configured mark, its recorded check results and its evidence Needs review, linked to the reversal.
- Changing an obstruction or a zone's coverage target recalculates the analysis and flags Needs review each check that names that zone, range or obstruction. (CD-17 · reading)
- Flag chips are shown on the device sheet and in the inspector header.

**Refusals and edge cases**
- A cost-only edit, a note or formatting edit, or hiding a layer flags nothing.
- An edit to the proposed design that changes nothing recorded on site, and nothing a check names, flags nothing.

**Access and restore**
- A revision restore leaves flags unchanged.

Notes: Left to later stories: flags from definition and template changes, and how a flag is cleared (story 5.14); flags for removed, restored and replaced devices (story 6.12, story 6.13 and story 6.14); flags from port and power-connection changes (story 7.7); Needs connection review (story 6.12 and story 7.8).

### Story 5.14: Definition changes, added checks and clearing a flag

As a designer, I want a changed expectation to call for a retest and a valid retest to clear it, so that current status always reflects current requirements.

Covers: FR-44, FR-28 (additional affected checks), FR-31 (a definition change rewrites no result), FR-47 (applied template changes).

**Core behaviour**
- Changing a check's expected result after a Pass keeps the attempt and flags the check Retest required.
- Removing the expected result shows Needs definition, and the check is no longer counted as passed. (CD-18 · reading)
- Applying a changed camera-model template's values (story 4.4) to an installed, tested camera flags its image checks Retest required, linked to that change.
- An Editor can add further affected checks to a change, with actor, time and reason.
- An Editor can record why a suggested check is unaffected, with actor, time and reason, which removes that flag.
- A new Pass recorded against the current condition clears Retest required and keeps the earlier attempts.
- A further change after that retest raises the flag again.

**Refusals and edge cases**
- Editing a template without applying it flags nothing.
- Making a failed check optional, or changing its expectation, leaves the Fail attempt visible and unchanged.
- Recording "unaffected" does not clear an unresolved Fail on that check.
- Recording "unaffected" does not turn missing evidence into N/A.
- Undoing the change, restoring a revision or bypassing an approval does not clear a flag or restore a pass.

### Story 5.15: Phase progress, remaining work and the contradiction warning

As a designer, I want progress by phase and one list of what remains, so that I can see what stands between the project and closeout.

Covers: FR-30, FR-31, the device state model (work recorded and progress are separate), decision D7. Screens: S-15, S-02.

**Core behaviour**
- The Field work area shows, by floor and by device, counts for Installation, Configuration and Testing, for example "4 of 6 passed · 1 failed · 1 retest".
- A phase is shown complete only when every required applicable check has a current Pass with its required evidence, and no Retest required flag or unresolved Fail remains in that phase.
- N/A results are counted separately.
- An optional check that was not performed does not hold a phase back, and a recorded Fail on an optional check stays visible.
- Setting the Installed or Configured mark changes no check outcome and no phase count, and passing checks does not set a mark.
- The remaining-work list holds, across the property: in-scope devices (story 5.4) with no Installed mark in the active scope, required checks Not tested, required checks at Pass pending evidence, unresolved failures, and checks flagged Retest required or Needs review.
- Each row of the list opens its device.
- A device with no Installed mark whose required Installation checks have all passed shows a neutral notice saying so and offering the two corrections: mark it Installed, or review the checks. Nothing is blocked.
- A device still Proposed that has a recorded test attempt shows the same kind of notice.
- The Overview shows the remaining-work count and phase progress by floor.
- The field shell's bottom navigation gains Work, opening the remaining-work list, and the filtered lists gain "Checks outstanding".

**Refusals and edge cases**
- A phase with no applicable checks reads "No checks in scope" and is never shown as complete.
- A device set to Existing by hand or brought in as Existing is not listed as lacking an Installed mark.

**Limits and values**
- Progress is shown as counts. No percentage bar is shown.

Notes: Left to later stories: site checks in progress and remaining work (story 5.16); open issues (story 5.18); a required reliability stage with no current Pass (story 5.22); scope categories, which redefine the in-scope devices and checks from then on (story 6.10); a planned Remove, listed until its removal is recorded (story 6.11).

### Story 5.16: Site checks

As a technician, I want checks that belong to the whole project or a floor, so that end-to-end operation and handover are tested and recorded, not assumed from device results.

Covers: FR-43, FR-60 (a floor with site-check history is not deletable). Screens: S-16.

**Core behaviour**
- A project or floor checklist can be edited and covers end-to-end operation and final records: named devices and events reach the intended systems, scoped recordings can be retrieved, identity, time and location records align, and drawings and evidence reflect the recorded installation.
- Each site check records the endpoints, scope and conditions actually tested.
- Site checks use the same outcomes, attempts, evidence, flags and Needs definition rule as device checks.
- Optional starters cover alarm-to-camera call-up, including whether the view or recording is available quickly enough for the project's purpose, and handover of manuals, training, as-built records and the programming list. They are off until enabled.
- A handover check records that an item was delivered. It accepts no file and asks for no judgement of the item.
- Site checks appear as their own row in progress, not inside any device's counts.

**Refusals and edge cases**
- Passing a sampled site check changes no device's check, and a device with no attempt still reads Not tested.
- A required site check with no attempt stays Not tested and stays in the remaining-work list when every device check has passed.
- A floor that has a floor-level site check with an attempt cannot be deleted, and the refusal lists the check.

**Access and restore**
- A revision restore leaves site-check definitions, attempts and flags unchanged.

Notes: Left to later stories: the reliability period, a site check with its own page (story 5.19).

### Story 5.17: Raise and track issues

As a technician, I want to raise an issue against a device or a failed check and track what is done about it, so that a known fault is never lost or quietly closed.

Covers: FR-46 (records and dispositions), FR-55 (Delete draft eligibility). Screens: S-18.

**Core behaviour**
- An issue can be raised from a device sheet, a check or a failed attempt, in the field shell and on desktop. It gets a stable identifier, records the active scope and links to its devices, checks and attempts.
- The Issues area lists issues in place of its "not available yet" text, showing identifier, title, linked devices, status, disposition and age.
- An issue's status is Open or Resolved. Its disposition in the active scope is kept separately: none, Include now or Deferred. A deferred issue is Open.
- Include now lets an Editor select the work, the checks and the estimate lines (story 4.5) added to the active scope for the issue.
- Defer requires a short reason. Owner and due date are optional.
- Resolve is available only when a corrective-work entry on the issue (what was done, by whom and when) and a current passing attempt or other current evidence are recorded. (CD-19 · reading)
- Resolving keeps the original failure and links the new attempt.
- A resolved or deferred issue can be reopened with a reason, and its history is kept. (CD-20 · decision)
- A mistaken or duplicate issue is corrected with a reason, actor and time. A duplicate links to the issue kept, and a corrected issue stays listed with its reason.
- A correction made by mistake is reversed with a reason, and both entries stay on record. (CD-12 · reading)
- The issue page shows a timeline of the original failure, attempts, corrections and resolution.

**Refusals and edge cases**
- When two people set a disposition on one issue at the same time, the first is accepted and the second sees a conflict.
- Correcting an issue, making its failed check optional, or changing that check's expectation does not resolve another issue and does not change any attempt's outcome.

**Access and restore**
- A revision restore leaves issues and their dispositions unchanged.
- A device with a linked issue is not offered Delete draft.
- A Delete draft sent from a stale view after an issue was linked is refused with the reason.

Notes: Left to later stories: issues in counts, lists and the Design package (story 5.18); raising an issue when no scope is active (story 5.25); carrying unresolved issues into a later scope (story 6.15); service visits on an issue (story 6.18).

### Story 5.18: Issues in remaining work, counts and the Design package

As a designer, I want open issues to show wherever outstanding work is counted, so that a deferred fault stays in view until it is resolved.

Covers: FR-46 (deferred faults stay visible), FR-33 (Design preset: open issues), FR-68 (project list attention count). Screens: S-28, S-02, S-F2.

**Core behaviour**
- Open issues, deferred ones included, appear in the remaining-work list and in the Overview's count.
- The project list shows, for each project, an attention count: the number of open issues, deferred ones included, plus the checks flagged Needs review, Retest required or Needs definition in the active scope. (CD-21 · value)
- The field shell's bottom navigation gains Issues.
- Saving a named revision records the open issues as they stand at that moment.
- The Design package of story 4.15 lists the issues that were open when its revision was saved, each with its identifier, linked devices and whether it was deferred.

**Refusals and edge cases**
- A resolved or corrected issue is in neither the remaining-work list nor the attention count.

Notes: Left to later stories: cable ends flagged Needs connection review and ports flagged the same way join the attention count (story 6.12 and story 7.8).

### Story 5.19: Define a reliability period

As a designer, I want to define an optional period of observed operation in stages, so that reliability is tested under terms the project chose.

Covers: FR-64 (definition and stages). Screens: S-17.

**Core behaviour**
- The reliability period is off by default.
- When enabled, the project defines what it covers (selected devices, selected floors or the whole site), its stages, what counts as downtime, and each stage's planned duration and availability target.
- Each stage is required or optional on its own.
- Stages appear with the site checks, not in any device's progress.
- Each change to the definition is recorded with actor and time, and earlier values remain readable.

**Refusals and edge cases**
- A stage with no duration or no target shows Needs definition.

**Limits and values**
- The application supplies no coverage, stage count, downtime definition, duration or target.

**Access and restore**
- A revision restore leaves the reliability definition unchanged.

Notes: Left to later stories: runs (story 5.20); the downtime log and availability (story 5.21); outcomes (story 5.22).

### Story 5.20: Start, end and stop a run

As a technician, I want to record when each run of a stage starts and ends, and why it stopped if it stopped early, so that the period observed is a matter of record.

Covers: FR-64 (runs and their timing), FR-44 (a change during a run flags the stage). Screens: S-17.

**Core behaviour**
- A person records the start of a run and later its end.
- A run in progress shows elapsed and planned time, has no outcome and is not listed as an attempt.
- Stages can be run in any order.
- Starting a run while required checks, retests or open issues remain in the covered scope, or while an earlier stage has no Pass, shows a warning listing them, and Start remains available.
- Recording an end before the planned duration has elapsed is a stop and asks why: "The system failed to perform", with a required explanation, or "Another reason", with a required reason. The run and its reason are kept. (CD-22 · reading)
- A run uses the definition in force when it started. Its covered devices are the Existing devices in the covered selection at that moment. (CD-23 · reading)
- Editing the definition or target during a run applies to later runs, and the open run shows a notice that the definition has changed.
- A covered device that is moved, changed or cancelled during a run appears on that run as an entry and flags the stage Needs review, linked to the run. The run is not stopped. (CD-24 · reading)
- After such a change a participant records Continue or Restart with a reason.
- Restart ends the current run as stopped for another reason and starts a new run.

**Refusals and edge cases**
- A start or end time can be entered for an earlier moment and cannot be in the future. An end must be later than its start. (CD-25 · decision)
- A stage has at most one open run. A second start on that stage is refused, showing who started the open run and when. (CD-26 · reading)

**Access and restore**
- A revision restore leaves runs unchanged.

Notes: Left to later stories: a run's outcome, so that until story 5.22 a run can be started, stopped and ended but shows no Pass or Fail; a run still open when the scope is closed (story 5.24); a recorded removal of a covered device during a run (story 6.12).

### Story 5.21: Downtime log and availability

As a technician, I want to log outages during a run and have availability worked out from the log, so that the figure is a fact of the record and not an opinion.

Covers: FR-64 (downtime log and availability). Screens: S-17.

**Core behaviour**
- During a run, an outage is logged as its own entry with what was affected, start, end, description and, where it is a fault, a linked issue.
- Each entry records which of the run's covered devices were affected. The default is all of them.
- Entries added by different people all remain.
- Each entry states whether it counts toward availability. An entry that does not count requires a short reason.
- An uncounted entry stays visible and does not change availability.
- An entry with no end reads "continuing". It counts up to the present while the run is open and up to the run's end once it has ended.
- A counted entry counts for its duration multiplied by the share of the run's covered devices it affected.
- Where counted entries overlap, a device affected by more than one is counted once for the time they overlap. (CD-39 · reading)
- Availability is the time not down divided by the run's elapsed time, as a percentage, shown beside the target and the totals of counted and uncounted downtime.
- Availability is marked Provisional while the run is open.

**Refusals and edge cases**
- An entry's end must be later than its start.
- Counted time is limited to the run: the part of an outage before the run's start or after its end is not counted.
- There is no field in which to type availability.

**Limits and values**
- Availability is shown to two decimal places. (CD-27 · value)
- A 60-minute run covering four devices, with one counted 12-minute outage affecting one of them, shows 95.00%.

**Access and restore**
- A revision restore leaves downtime entries unchanged.

### Story 5.22: The outcome of a run

As a designer, I want each ended run to become a Pass or a Fail by rule, so that a reliability stage cannot be passed by assertion.

Covers: FR-64 (outcomes; required stages in remaining work), FR-44 (a recorded outcome is not rewritten).

**Core behaviour**
- When a run's end is recorded after the full planned duration, it becomes one attempt: Pass if availability, before rounding, is at or above the target, and Fail if it is below. (CD-27 · value)
- A run stopped because the system failed to perform becomes an attempt with outcome Fail and its explanation.
- A run stopped for another reason is kept with its log and reason, has no outcome, is not an attempt, and leaves the stage's outcome as it was.
- A new run after a Fail is a new attempt, and the earlier attempt and its log are kept.
- A required stage that has no current Pass appears in the remaining-work list, whatever the states of its runs.
- Once stage 1 has passed, starting stage 2 no longer lists it in the warning.
- The PRD's worked example holds: a one-hour single stage with a 99% target and one counted three-minute outage, affecting all covered devices and linked to an issue, shows 95% and Fail, and the issue stays open.
- In the same example a restarted run with no downtime passes, and both attempts are kept.

**Refusals and edge cases**
- A stage showing Needs definition cannot record a Pass.
- A Fail does not close or resolve a linked issue.
- Changing the definition or target after a run has an outcome does not change that outcome.
- After a run has ended, its entries can be changed only by a correction with a reason, actor and time.
- Such a correction does not rewrite the recorded outcome: the attempt shows the recalculated availability beside the recorded one, and the stage is flagged Needs review. (CD-28 · reading)

**Access and restore**
- A revision restore leaves outcomes unchanged.

### Story 5.23: Choose Completed or Closed with outstanding items

As a designer, I want the app to tell me whether the scope can be closed as Completed and why not, so that the closing state is honest.

Covers: FR-32 (the two closing states), FR-25 (approval never gates closing), FR-46 (deferred faults; unknown details), FR-64 (a required stage at closeout). Screens: S-23.

**Core behaviour**
- Close out starts by showing the remaining-work list for the active scope.
- Completed is available only when nothing is outstanding: every in-scope device has an Installed mark, every required applicable check has a qualifying current Pass, no issue is open, and every required reliability stage has a current Pass.
- A required applicable check at Needs definition, Not tested, Pass pending evidence, Fail or Retest required blocks Completed. A check is at Needs definition, for example, when its expected result was removed after it passed (story 5.14).
- A required reliability stage with a run still open blocks Completed until that run is ended, even when the stage already has a current Pass.
- Otherwise Completed is disabled and lists the reasons.
- Closed with outstanding items is always available and requires a short note. A follow-up owner and due date are optional.
- A scope whose own work is finished but which has a deferred issue can be closed only as Closed with outstanding items.

**Refusals and edge cases**
- A missing design approval or final acceptance disables neither choice.
- A bypassed approval does not count as a passed test or retest.
- A device value that reads Unknown or Not recorded, a check that is not in scope and an optional check not performed do not prevent Completed.

Notes: Left to later stories: writing the closeout record (story 5.24); scope categories, which redefine what is outstanding from then on (story 6.10); the warranty step (story 6.17).

### Story 5.24: Close the scope and write the closeout record

As a designer, I want closing to write one fixed record of the scope from a single moment, so that what was closed can never be changed or half-captured.

Covers: FR-32 (fixed closeout record), FR-42 (closeout), FR-64 (runs at closeout), FR-55 (cancelled proposals in the closeout), FR-60 (closeout context), NFR-1. Screens: S-23.

**Core behaviour**
- Closing writes one fixed, named closeout record from a single consistent point, holding drawings, schedules, the estimate, evidence, field changes, approvals and bypasses, the remaining-work list as outstanding items, the closing note and every reliability run.
- The record's stored file does not change afterwards, checked by its hash.
- The scope's state changes only when the closeout record is stored and its hash verified.
- After closing, the scope's state reads Completed or Closed with outstanding items in the frame, the field shell chip and the project list.
- A proposal cancelled during the scope appears in the closeout record as a change to the scope, with its reason.
- The closeout record is added as an entry on the Records timeline of story 4.1.

**Refusals and edge cases**
- The outstanding list is rechecked on the server at the moment of closing. If something became outstanding after the page loaded, Completed is refused and the new list is shown.
- Closing is refused while the person closing has Unsaved or Conflict items, and those items are listed.
- A failed write of the closeout record shows Failed with Retry, and the scope stays In progress.
- When two Editors close the scope at the same time, one succeeds and the other sees a conflict. There is one closeout record.
- A required stage's run still open at closing is stopped with the reason "Scope closed", has no outcome, and is listed in the closeout record as outstanding. (CD-29 · reading)
- An optional stage's run still open at closing is stopped with the reason "Scope closed" and listed in the record as not completed. It does not make a Completed scope show outstanding items.

**Access and restore**
- A revision restore leaves closeout records unchanged.
- A floor held in a closeout record cannot be deleted, and the refusal lists the record.

Notes: Left to later stories: what is accepted after closing (story 5.25); final acceptance (story 5.26); the Closeout package (story 5.27); removed and replaced equipment and connection context in the record (story 6.12). Warranty and service-visit records are kept apart from the closeout record (story 6.17 and story 6.18).

### Story 5.25: A closed scope, and a project with no active scope

As a designer, I want clear rules for what can be recorded after the scope is closed, so that nothing is added to a finished scope by accident and a new fault can still be logged.

Covers: FR-32, FR-42 (stale saves), FR-24 (reviewer links after closing), FR-45 (one active scope), FR-46 (issues outside a scope).

**Core behaviour**
- After a project's only scope is closed, the project has no active scope. The frame and the field shell chip show the closed scope's name and state.
- With no active scope an Editor can raise an issue. It is recorded with no scope.
- With no active scope an Editor can defer, resolve, reopen and correct an issue. Include now is unavailable and says why. (CD-30 · reading)
- With no active scope, a design edit, an Installed or Configured mark, a test result and a new revision are each refused with "not saved: no active scope — reopen first".
- Design edits here are changes to buildings, floors, plans, devices, routes, zones, obstructions, analysis settings, checklist and site-check definitions, the reliability definition and the estimate. (CD-31 · reading)
- With no active scope, a field change, a survey or field note or photo, a run start, a revision restore, issuing or designating a design, and cancelling a proposal or correcting a record under story 4.14 are refused in the same way. (CD-32 · decision)
- With no active scope, reading, exporting, generating a package from an already saved revision and recording a review decision on a saved revision remain available.

**Refusals and edge cases**
- A save of work, results, photos or issues for the closed scope, sent from a tab that was open before closing, is refused and kept for review as "not saved: scope closed". It is not retried. (CD-38 · value)
- Closing a scope does not by itself change a reviewer link to one of that scope's design revisions. (CD-33 · reading)
- Every other restriction on a reviewer link still applies after closing: a link whose revision is superseded, whose review is bypassed or whose assignment was reassigned stays read-only under story 4.11 and story 4.13. (CD-33 · reading)

Notes: Left to later stories: refusing a removal (story 6.11) and a restore of a removed device (story 6.13) with no active scope; reopening into a new scope (story 6.15); warranty records (story 6.17) and service-visit records (story 6.18), which stay editable with no active scope; Start service visit (story 6.19).

### Story 5.26: Final acceptance of the closeout record

As a client reviewer, I want to review the fixed closeout record and give my decision on it, so that acceptance is on record when it is wanted and never holds up the closing.

Covers: FR-23 and FR-24 (final acceptance of a closeout record), FR-25, FR-69 (attribution). Screens: S-23, S-24.

**Core behaviour**
- The final-acceptance assignee of story 4.7, signed in, opens the fixed closeout record, comments on it and records a decision, Approve or Request changes.
- An Editor can create a reviewer link to the closeout record under the rules of story 4.10 and story 4.11, and the named reviewer comments and decides through it.
- An Editor can bypass final acceptance. The bypass is recorded on that closeout record as Bypassed, with the account, the time and an optional reason.
- Decisions, comments and bypasses are separate entries added beside the closeout record. The record's stored file and hash are unchanged by them.
- Final acceptance is recorded after closing, with no active scope needed, and is never a condition of closing. (CD-34 · reading)

**Refusals and edge cases**
- A decision or a bypass changes neither the scope's Completed or Closed with outstanding items state nor any outcome.
- A Request changes decision reopens nothing.

**Access and restore**
- A Viewer who is the final-acceptance assignee can comment and decide. Any other Viewer is refused by the server.
- A revision restore leaves final-acceptance decisions, comments and bypasses unchanged.

Notes: Left to later stories: decisions in the Closeout package (story 5.27); keeping or changing assignments for a later scope (story 6.15).

### Story 5.27: Closeout package

As a designer, I want a Closeout package generated from the closeout record, so that the client receives what was installed, tested and left open exactly as it was closed.

Covers: FR-33 (Closeout preset), FR-34 (generated from a fixed closeout), FR-64 (runs in the package), FR-69 (unverified name in the package), NFR-6. Screens: S-37.

**Core behaviour**
- The Closeout package is generated from the closeout record, with the final-acceptance entries recorded up to the package's cutoff, and never from live records.
- It is laid out, split, verified, retained and downloaded under the rules of the Design package in story 4.16, story 4.17 and story 4.18.
- The package shows recorded installation plans and status, changes from the issued design, recorded settings and identifiers, phase summaries, every attempt of the scope with earlier failures and corrections, notes and photos, outstanding issues, and approvals or bypasses as they stood at its cutoff.
- A proposal cancelled during the scope is shown as a change to the scope, with its reason.
- For each reliability run the package shows its dates, planned and actual duration, downtime log with the devices affected, availability, target and outcome.
- A decision made through a reviewer link is printed with its name marked not verified.
- A package generated after a later decision is a new edition with its own cutoff, and the earlier edition is unchanged.
- Before closing, a preview is generated from a fixed preview record written from one consistent point in the same form as the closeout record. (CD-35 · reading)
- A preview is labelled "Draft, In progress" on every page and closes nothing.

**Refusals and edge cases**
- Leaving out required photo evidence labels the package "Evidence-limited summary" on every page and names what was omitted.
- A package limited to some floors is labelled Partial and still carries the property-wide closeout state and the full list of outstanding issues.

**Limits and values**
- Photos are two to a page, each captioned with its device or note reference.

Notes: Left to later stories: removed and replaced equipment and connection context (story 6.12); warranty records (story 6.17) and service visits (story 6.18), read as they stand at the package's cutoff; closet, port and inter-floor schedules (story 7.11).

### Story 5.28: Lost connection and conflicts on a phone

As a technician, I want my entries kept when the signal drops and shown clearly when they clash with someone else's, so that I do not lose work or overwrite a colleague's.

Covers: FR-21, FR-42, NFR-2, NFR-3. Screens: S-F7.

**Core behaviour**
- With no connection, a persistent banner reads "Not connected. Your entries are kept on this page until you are back online. Keep this page open."
- Each unsaved mark, outcome, note and photo shows Unsaved.
- A photo taken with no connection stays on the page as Unsaved and uploads when the connection returns.
- An Installed mark set with no connection while nothing is issued is kept and saved on reconnection like any other mark, with no prompt.
- On reconnection the app reads the current state before retrying.
- An entry that had already been saved is not sent again, and no duplicate attempt, note, photo or mark appears.
- A conflict on a device opens a per-field comparison: the saved value, who saved it and when, beside the pending value.
- For each field the technician keeps the saved value or reapplies their own, and the version is checked again on save.
- A change saved by someone else to a device whose form is open is not applied to the form. A notice names who updated it and offers to review.
- If the session ends while a device sheet is open, the sheet asks the technician to sign in again and keeps what was entered on the page.
- After the same account signs in again, the entries kept on the page are saved, and an interrupted photo upload continues under the rules of story 2.17.

**Refusals and edge cases**
- A pending entry refused because the technician's access was removed, reduced or deactivated stays visible as "not saved: access changed", can be copied, and is not retried.
- A mark or attempt sent from a stale or reconnecting page onto a device that was cancelled or corrected meanwhile is refused and kept for review as "not saved: device cancelled or corrected". The device is unchanged. (CD-36 · value)

**Limits and values**
- The per-field comparison shows without sideways scrolling on a screen 360 px wide. (CD-37 · value)

**Evidence to record**
- After a reload on a real iPhone and a real Android phone, every entry that showed Saved is still present.

Notes: Left to later stories: refusing a stale save onto a removed device (story 6.11) and into an archived project (story 6.16), both using the comparison built here. A stale save into a closed scope is story 5.25.

## Epic 6: Existing sites and return visits

**Outcome.** An existing building can be inventoried from a spreadsheet, surveyed, upgraded and returned to later, with its history, warranty and service visits intact.

**Depends on.** Epics 1 to 5 complete. Nothing later.

**Why here.** Planned actions, removal and reopening all act on the installed marks, checks, issues and closeout that Epic 5 defines, and Epic 7's doors, ports and runs build on the removal and restoration rules set here.

### Story 6.1: Existing equipment, condition, provenance and the surveyed baseline

As a designer, I want to record the equipment and cable already on site with what is known about it and how it is known, so that planning starts from the real building and not from guesses.

Covers: FR-39, device state model (condition and provenance).

**Core behaviour**
- A device can be added as Existing during a survey and is placed on a plan like any other device.
- A device added as Existing creates no purchase line, no Installed mark and no test result.
- A known cable route can be drawn as existing. It keeps a stable run identifier and creates no purchase quantity.
- An Existing device has a condition of Working, Faulty or Unknown. It starts as Unknown and a person sets it.
- The condition is shown as a chip in the inspector header and on the device sheet.
- A device record gains optional fields for manufacturer, source asset ID and installation date. An empty one reads "Not recorded".
- Each recorded value can carry a provenance of Imported, Old document, Estimate or Site-confirmed, shown as a chip beside the field with the source detail on demand.
- A camera whose model or installation date is unknown can be saved with those fields empty. Recording it today does not set its installation date.
- The label already used on site is recorded as the device's label, beside its unchanged internal identifier, and search finds the device by either.
- A surveyed baseline can be saved as a fixed named revision, marked as the baseline in Records.

**Refusals and edge cases**
- A test outcome never changes a device's condition.
- A baseline is listed only when its snapshot is stored and its hash verified. A failed save is shown and can be retried.

**Access and restore**
- Later edits leave the baseline's stored file unchanged, checked by its hash.
- A revision restore leaves the condition, provenance and recorded field values of an Existing device unchanged.

Notes: Left for later: spreadsheet intake (story 6.2, story 6.3, story 6.4 and story 6.5); planned work on existing devices (story 6.8); recording a removal (story 6.11).

### Story 6.2: Choose an inventory file and sheet

As a designer, I want to load an equipment spreadsheet and pick the sheet and header row, so that an existing inventory does not have to be retyped.

Covers: FR-62 (file and sheet selection, unsupported files), AD-10. Screens: S-09 step 1.

**Core behaviour**
- Inventory import is a four-step page with a visible step indicator. This story delivers step 1, File and sheet.
- An .xlsx file with a title row is read from the chosen sheet and header row, with a preview of the first rows.
- A CSV file is read after its delimiter and parsed columns are confirmed, with the same preview.
- The file is parsed in the browser.
- Formulas, macros and external links are never run. A cell with a stored formula result is read as that result.
- A sample template can be downloaded.

**Refusals and edge cases**
- A legacy .xls file, a macro-enabled file and a password-protected file are each refused at step 1 with a plain reason, and the saved inventory is unchanged.
- A file over the size limit, or with more data rows than the row limit, is refused at step 1 with the limit named.
- A file with no data rows under the chosen header row cannot go past step 1, and the reason is shown.
- A cell that holds an error, or a formula with no stored result, is flagged for review on its row.

**Limits and values**
- An inventory file can be at most 10 MiB.
- An inventory file can hold at most 5,000 data rows. (CE-01 · value)
- The shared parser refuses a workbook whose uncompressed contents are over 100 MiB, in the browser and on the server, before it parses the workbook. (CE-50 · value)

**Evidence to record**
- The fixture script of story 2.11 also produces a 600-row inventory as .xlsx and as .csv.
- While the 600-row file is parsed, Cancel and the step controls respond within 250 ms. (CE-02 · reading)
- The preview of the 600-row file appears within 30 seconds of choosing the file, in each of three runs, recorded as a development measurement.

Notes: Left for later: server-side enforcement of file limits and the usage display (story 8.14); the acceptance measurement of the 30-second target (story 10.2).

### Story 6.3: Map inventory columns

As a designer, I want to say which column means what, so that a spreadsheet with its own headings fills the right fields.

Covers: FR-62 (column mapping, identifiers, remembered mapping), UX decision D9. Screens: S-09 step 2.

**Core behaviour**
- Step 2 lists one row per source column: its heading, three sample values, the suggested field, and a choice to change or ignore it.
- Columns can be mapped to source asset ID, existing Site Studio ID, name, type, manufacturer, model, serial number, IP address, MAC address, building, floor and room hints, and notes.
- Equipment-type values found in the file are mapped to equipment types in the same way.
- A default equipment type, including Unknown, can be set for rows whose type is missing or not recognised.
- Unmapped and ignored columns are listed, with their count, before the next step.
- Asset ID 00042 stays 00042.
- A value whose conversion is uncertain, such as a long number or a date-like identifier, is flagged on its row.
- The project's last confirmed mapping is offered only when the headings fit, and can be edited before it is used.

**Refusals and edge cases**
- A header row with duplicate headings stops at mapping with a plain reason.
- Two columns mapped to one field stop at mapping with a plain reason.
- Leaving the page at this step changes nothing in the project.

**Access and restore**
- A revision restore leaves the remembered mapping unchanged.

### Story 6.4: Review import rows and match them to devices

As a designer, I want to see what an import would add or change before it happens, so that a spreadsheet cannot overwrite what was confirmed on site or create duplicates.

Covers: FR-58 (matching and preview), FR-62 (row review). Screens: S-09 step 3.

**Core behaviour**
- Step 3 groups rows as New, Changed, Unchanged and Needs review, with counts.
- A Changed row shows the current and incoming values side by side, with the source of each.
- A row matches an existing device by a valid Site Studio ID for this property, or by a source asset ID that is unique in the file and in the project. (CE-03 · reading)
- A row with neither identifier matches the device that an earlier import of this project created from a row with identical mapped values. With no such device it is listed as New. (CE-04 · reading)
- A row matched this way is listed as Unchanged only when its mapped values equal the device's current record. Otherwise it is listed as Changed and shows the differences, like any other matched row. (CE-04 · reading)
- Names, addresses and location hints never establish identity by themselves.
- Re-uploading the same inventory when no device has changed since the import lists every row as Unchanged, including rows that have no identifier.
- Rows are ticked explicitly. A group-level select is offered for New and Unchanged rows without errors. (CE-05 · reading)
- Site-confirmed values are locked by default. Replacing one takes a deliberate choice on that row, with a reason.

**Refusals and edge cases**
- A row whose name is already used by another row or by a device it does not match goes to Needs review.
- Duplicate rows in the file, including two identical rows without identifiers, go to Needs review.
- Rows with conflicting identifiers go to Needs review.
- A row with neither a usable name nor a source asset ID is shown as an error and cannot be imported until it is corrected or skipped.
- A row error is shown inline with Fix and Skip.
- Nothing in the project changes at this step.

Notes: Left for later: applying the ticked rows (story 6.5); a row that matches a removed device (story 6.11).

### Story 6.5: Apply an import and re-import safely

As a designer, I want the rows I ticked applied once and reported clearly, so that repeating or interrupting an import never duplicates or damages records.

Covers: FR-58 (apply, re-import, concurrent changes), FR-62 (result, source and mapping kept), FR-56 (imported records as source-based inventory), FR-57 (Awaiting placement, base). Screens: S-09 step 4, S-08.

**Core behaviour**
- Confirming step 4 applies only the ticked rows and creates an import batch that records the actor, the time, the source file, the sheet and the confirmed mapping.
- The source file and the confirmed mapping can be opened from the import batch.
- A device created by a New row starts as Existing with condition Unknown.
- Imported values carry the Imported provenance.
- Each applied row stores a link to the device it created or matched, together with a fingerprint of the row's mapped values. The match for rows without identifiers uses this link.
- A created device with no confirmed floor or position is Awaiting placement. It is listed in the Awaiting placement segment of Equipment with its building, floor and room hints, and has no map marker.
- A blank cell erases nothing.
- A device missing from the file is neither deleted nor archived.
- A replaced Site-confirmed value is recorded with its reason, and the earlier value stays in the device's history.
- Applying a re-uploaded copy of the same inventory creates no extra devices, whether or not its rows have identifiers.
- The result reports imported, skipped, failed, conflicted and unresolved counts, with links to the records awaiting placement and to those needing review.

**Refusals and edge cases**
- An import sets no Installed or Configured mark and no check outcome, whatever the source columns say.
- A record changed by someone else since the preview comes back as a conflict, with the choice made for that row kept for review.
- When two people apply the same file at the same moment, every New row is matched again at the moment of applying, by identifier and by fingerprint, and each device is created once.
- An apply interrupted part-way reports which rows were applied. Continuing applies only the remaining rows and creates no duplicates.

**Access and restore**
- A revision restore leaves import batches, their source files, and imported devices and values unchanged.

**Evidence to record**
- The confirmed import of the 600-row fixture completes within 30 seconds in each of three runs, recorded as a development measurement.

Notes: Left for later: searching, verifying and placing records that await placement (story 6.6); cleaning up a mistaken batch (story 6.7); the acceptance measurement of the 30-second target (story 10.2).

### Story 6.6: Awaiting placement, and verifying on site

As a technician, I want to find imported records that have no position, check them against what is really there and place them, so that the inventory becomes a verified survey.

Covers: FR-56, FR-57, FR-8 (Awaiting placement). Screens: S-08, S-F5, S-F6.

**Core behaviour**
- The Awaiting placement list is searchable and can be filtered by building, floor or room hint.
- The count of records awaiting placement stays visible while one floor is shown.
- Choosing an unplaced record in the equipment list opens its Awaiting placement entry, not a floor.
- An unplaced record has no coverage and no test result.
- Capacity estimates still count an unplaced device's applicable demand.
- Coverage results state how many devices are omitted because they are unplaced.
- On a phone, a technician can confirm or correct each value. A confirmed value becomes Site-confirmed, and the imported value stays in view as the earlier source.
- The technician places the record with the crosshair on a chosen floor. It keeps its identifier and import history, and no second device is created.
- A device found on site that was not in the spreadsheet can be added from the same screen as an Existing device.
- A project with no spreadsheet can be surveyed by adding every device by hand.
- The field shell's filtered lists gain "Awaiting placement" and "Not site-confirmed". (CE-06 · value)

**Refusals and edge cases**
- Placing sets no Installed mark, confirms no other value and passes no check.

**Access and restore**
- A revision restore leaves placements made here and Site-confirmed values unchanged.

### Story 6.7: Bulk cleanup of mistaken records

As a designer, I want to remove a batch of mistaken records in one step after seeing what would go, so that a bad import can be undone without touching real equipment.

Covers: FR-59. Screens: S-10.

**Core behaviour**
- The Equipment page gains multi-select. A selection of records, or one import batch, can be previewed: how many are selected, how many can be removed, and each blocked record with its reason.
- Only accidental drafts that qualify for Delete draft and unused records created by an import can be removed.
- Confirming removes only the eligible records that were previewed.
- Removing a record removes no other device, cable, note, photo or issue.
- The outcome is listed per record.
- The cleanup, with its per-record outcomes, actor and time, is recorded in the project's change log, where any member of the project can open it. (CE-07 · reading)
- The cleanup can be undone by the person who ran it, in the same session. (CE-08 · reading)
- A record removed by a cleanup is not listed under Historical.

**Refusals and edge cases**
- A device that existed before the batch and was only matched by it is blocked. Membership of a batch never makes a record removable by itself.
- Site-confirmed, issued, approved, installed, tested or otherwise evidenced records are blocked.
- Equipment that other records depend on is blocked.
- Eligibility is checked again on confirmation. A record that gained a test or an edit since the preview is reported and not removed.
- Undo is refused for a record whose floor has since been deleted or which someone else has since changed, and those records are listed.
- A retried cleanup is applied once.

**Access and restore**
- A revision restore returns a draft removed by a cleanup, as it does after any Delete draft, and does not return an import-created record. (CE-09 · reading)

### Story 6.8: Planned actions on existing equipment

As a designer, I want to say what will happen to each existing device, so that an upgrade is planned without rewriting the record of what is there.

Covers: FR-40, FR-55 (reversal on equipment that was already existing), device state model (planned action, relocation, work recorded). Screens: S-04 Work tab.

**Core behaviour**
- The inspector's Work tab shows and sets the device's planned action for the active scope.
- An Existing device can be planned as Retain, Relocate, Service or reconfigure, Replace or Remove. A new device is Add new. A device with no decision shows None.
- Choosing Replace creates a new Proposed device with its own identifier, linked to its predecessor.
- Planning a relocation records a planned position and leaves the current position unchanged.
- Recording Installed on a device with a planned Relocate makes the planned position its recorded location, and the earlier location stays in its history.
- A planned Service or reconfigure holds the intended work and settings as text. Recording Installed for the scope records that work as done and changes neither the device's lifecycle nor its location. (CE-10 · reading)
- Retained equipment and retained cable create no purchase line and appear in the estimate under "Retained, not purchased".
- Relocation, service and replacement costs are entered as explicit estimate lines.
- The device sheet's one-sentence instruction begins with the planned action for Retain, Relocate, Service or reconfigure, Replace and Remove, as it does for Add new.

**Refusals and edge cases**
- A choice the state model forbids is disabled with its reason: any action except Add new on a Proposed device, Add new on an Existing device, and any new action on a removed, cancelled or corrected device.
- Replace cannot be saved without the link to its successor.
- Planning an action changes no recorded location, archives nothing and sets no mark.
- From this story on, "Reverse installed mark" of story 5.5 is also offered for a device that was Existing before the scope. It clears the mark for the scope and leaves the device Existing. (CE-11 · reading)
- Reversing a mistaken Installed mark on a relocated device also returns it to its earlier recorded location.

**Access and restore**
- Planned actions and planned positions are saved in a named revision and returned by a revision restore.

Notes: Left for later: the Changes basis and how each basis shows planned actions (story 6.9); recording a removal (story 6.11).

### Story 6.9: Current installation, Proposed design and Changes

As a designer, I want to see the site as it is, as it will be, and the difference, so that everyone reads the same plan of the upgrade.

Covers: FR-41, FR-33 (planned actions in the Design package). Screens: S-11.

**Core behaviour**
- The basis control gains Changes beside Current installation and Proposed design.
- A planned replacement leaves the old device in Current installation and shows the new one in Proposed design.
- Proposed counts include the replacement and not the predecessor, unless the predecessor is marked to remain.
- A planned relocation shows the planned position in Proposed design and the current position in Current installation.
- A planned Remove leaves the device in Current installation and takes it out of Proposed design.
- Changes draws relocation arrows and replacement pairs on the plan, with a list of devices grouped by action.
- The Changes list is followed by the cancellations and corrections made against the current issued design.
- A Faulty camera is not credited in a coverage estimate on the Current installation basis.
- A Faulty camera with a planned Service or reconfigure is credited on the Proposed basis and labelled as a planned return to service.
- A device with unknown specifications is shown as unassessed or estimated in each result, never as zero demand or as coverage.
- The Design package shows each device's planned action on plan sheets and in the equipment schedule, with retained equipment shown as context and not as a purchase.

### Story 6.10: Work scope categories

As a designer, I want to mark each device and route as worked on now, only inspected, or only shown for reference, so that the estimate and the checks cover exactly the work in this scope.

Covers: FR-45. Screens: S-11.

**Core behaviour**
- The scope panel names the active scope and lists its revisions, its estimate and its evidence.
- Saving a second named revision keeps the same scope and the same estimate.
- Each device and route in the scope is Work now, Inspect or test only, or Reference only.
- The category is preselected from the planned action: Add new, Relocate, Service or reconfigure, Replace and Remove give Work now; None and Retain give Reference only. (CE-12 · reading)
- Changing a category is recorded with actor and time.
- The scope panel shows the estimate and the required checks that each category implies, and both update when a category changes.
- The applicable core checks of story 5.7 are required by default for each Work now device. (CE-13 · reading)
- An Inspect or test only device has no check required until an Editor selects the checks that apply to it.
- A Reference only device gets no checks.
- Reference-only equipment still counts in coverage and capacity and creates no purchase line.
- An Inspect or test only device can have a labour line without an equipment purchase.
- From this story on, the remaining-work list and the closeout count the Work now devices whose work is not recorded, and the required checks of Work now and Inspect or test only devices.
- A Work now device with a planned Add new, Relocate or Service or reconfigure, and a Replace successor, is listed until its Installed mark for the scope is set.
- A device with a planned Remove, and a Replace predecessor, is listed as "Removal not recorded" and is not counted as not installed. (CE-14 · value)

**Refusals and edge cases**
- A device with a planned action of None or Retain cannot be set to Work now, and the reason is shown.
- Moving an item out of Work now asks for a reason. (CE-15 · reading)
- Moving an item that has a required retest or an open issue to Reference only shows a warning and leaves that item in the remaining-work list.
- A Reference only device with unknown details and no selected checks adds nothing to the remaining-work list.

**Access and restore**
- Scope categories are saved in a named revision and returned by a revision restore.

Notes: Left for later: the recorded removal that clears a "Removal not recorded" row (story 6.11); a second scope, created by reopening (story 6.15).

### Story 6.11: Record a removal and archive the device

As a technician, I want to record that a device has actually been taken out, so that the record matches the site and nothing about the device is lost.

Covers: FR-35, FR-8 (historical records), FR-42, FR-58 (archived match), FR-60 (archived device references), NFR-1. Screens: S-04.

**Core behaviour**
- The device menu of story 4.14 offers Record removal for an Existing device.
- Recording a removal, with its date and an optional reason and replacement link, makes the device Removed and archives it in the same step. The actor and time are recorded.
- The archived device keeps its identity, model, settings, last location, connections, work marks, checks and attempts, notes and photos.
- No field has to be filled in to archive a device.
- A removed device leaves the active plan and schedule, coverage, equipment totals and capacity demand.
- Earlier revisions and packages are unchanged by a removal.
- A removed device is found by search under Historical in Equipment, labelled Removed, with its evidence.
- An optional historical layer shows a removed device on the plan at its last location.
- A recorded removal completes a planned Remove: its "Removal not recorded" row leaves the remaining-work list, and no Installed mark is asked for.
- For a planned Replace, the work shows as done only when the successor's installation and the predecessor's removal are both recorded.
- The predecessor's notes, photos and passes stay with the predecessor.

**Refusals and edge cases**
- With no scope active, Record removal is refused with "not saved: no active scope — reopen first".
- A save onto a removed device from a stale tab or a reconnecting phone is refused and kept for review as "not saved: device removed". It is not applied and not discarded. (CE-16 · value)
- A re-imported row that matches a removed device goes to Needs review. It does not reactivate the device and creates no new one.
- A floor that holds a removed device's last location cannot be deleted, and the refusal lists the device.

**Access and restore**
- A revision restore leaves a removed device archived, and lists for review a removed device that the revision still holds.

Notes: Left for later: the removal review, cable ends and what stays outstanding (story 6.12); restoring the device (story 6.13); port dispositions (story 7.8); a door link on a removed component (story 7.4).

### Story 6.12: Review a removal and settle its cable ends

As a technician, I want to see what a removal leaves behind and say what became of each cable, so that open work and loose ends stay visible.

Covers: FR-53 (cable ends and dispositions), FR-35 (reconciling connections), FR-33 (removed equipment and connection context), FR-68 (attention count), NFR-1. Screens: S-04, S-12.

**Core behaviour**
- Before a removal is confirmed, a review lists the device's cable ends, its open issues, its required retests and any open reliability run that covers it.
- Each affected cable end gets a disposition: retained and disconnected, reused, removed, or unresolved.
- Unresolved is allowed and is flagged Needs connection review.
- An unresolved disposition can be set later from the cable, which clears the flag.
- The cable keeps its run identifier, route, lengths, notes and evidence.
- The device's connection to the cable is ended and kept as history.
- A cable is archived only when its own removal is recorded.
- Recording the removal of a switch flags the cable ends connected to it for review and archives no other device.
- Open issues and required retests on the device stay in the remaining-work list after removal. Removal resolves no issue.
- An open reliability run that covers the device is flagged and keeps running.
- The project list's attention count of story 5.18 includes cable ends flagged Needs connection review. (CE-17 · reading)
- A closeout record written from this story on, and its Closeout package, list removed and replaced equipment and the retained, reassigned, removed and unresolved cable ends, with historical ends shown apart from current connections.

**Refusals and edge cases**
- The removal and its dispositions are saved as one operation. A stale tab cannot leave a cable end actively connected to a removed device.

**Access and restore**
- A revision restore leaves cable-end dispositions and ended connections unchanged.

### Story 6.13: Restore the same device

As a technician, I want to put an archived device back on the plan as the same record, so that its history follows the physical equipment.

Covers: FR-36 (restore), FR-54, NFR-1.

**Core behaviour**
- A removed device's Historical record offers Restore. Restoring keeps the device's identifier and history and records who restored it and when.
- A restored device is Existing with condition Unknown. (CE-18 · reading)
- Restoring needs a position confirmed by the user on a current floor of the same property. The device never enters Awaiting placement.
- On an unchanged or renamed floor the former position is offered for confirmation.
- On a floor whose drawing, scale or alignment has changed, the position must be set again.
- A floor is matched by its identity, not its name: a different floor that now carries the original floor's name is not offered the former position.
- Earlier photos and attempts keep their former floor and location.
- Earlier passes are not counted for the restored device, and its checks are flagged Retest required. (CE-19 · reading)
- Restoring creates no purchase line.
- Cancelling leaves the device archived with its history intact.

**Refusals and edge cases**
- A restore is refused when the chosen floor has changed or been deleted, or the device has changed, since the restore screen opened. The choices made are kept for review.
- When the device's label or asset ID is now used by another active device, the restore asks for a label decision before it can be confirmed. (CE-20 · decision)
- With no scope active, a restore is refused with "not saved: no active scope — reopen first". (CE-21 · reading)

**Access and restore**
- A revision restore leaves a restored device, its new position and its restoration record unchanged.

Notes: Left for later: reconnecting cables and linking a replacement (story 6.14); reconnecting to a switch port (story 7.8).

### Story 6.14: Reconnect a restored device, or link a replacement

As a technician, I want to reconnect a restored device deliberately, or record a different unit as its replacement, so that connections and history are never assumed.

Covers: FR-36 (replacement), FR-53 (reconnection and reuse).

**Core behaviour**
- A restored device's earlier cable connections are offered as historical choices and are not reinstated.
- Reconnecting a cable end is an explicit step.
- A different physical replacement has a new identifier linked to its predecessor.
- Predecessor and replacement each keep their own history, results and counts.
- The link can be followed in both directions.
- A retained cable chosen for the replacement keeps its run identifier and creates no purchase line.
- The replacement inherits no installation evidence and no pass from the predecessor.

**Refusals and edge cases**
- Reconnecting cannot take a cable end that is now connected to another device.
- Reconnecting cannot bring back a removed cable.

**Access and restore**
- A revision restore leaves reconnections and the links between a predecessor and its replacement unchanged.

### Story 6.15: Reopen for later work, carrying issues forward

As a designer, I want to reopen a finished project for new work at the same property, so that later work starts from what is installed and keeps the earlier records fixed.

Covers: FR-38, FR-45 (one active scope), FR-46 (carryover). Screens: S-20, S-18.

**Core behaviour**
- Records offers Reopen for a project whose last scope is closed. Reopening creates a new named scope, In progress, and a working revision from the latest installation.
- Project and device identifiers are unchanged by reopening.
- The new scope has its own empty estimate and its own checks.
- Equipment already installed creates no purchase line in the new scope.
- Rates and chosen lines can be copied from the earlier estimate. No quantity is carried over automatically.
- The new scope starts at Not issued and with no approvals.
- Review assignments are offered for reuse and can be changed.
- An unresolved issue appears in the new scope with the same identifier, marked as carried from an earlier scope, and awaits a disposition: Include now, Defer or Resolve. It is not duplicated.
- A scope finished with a deferred fault can be closed only as Closed with outstanding items.
- A revision of an earlier scope can be opened and compared.
- Once the project is reopened, design edits, Installed and Configured marks, test results, removals and new revisions are accepted again.

**Refusals and edge cases**
- Reopening restores no removed device, resolves no issue, and carries no pass into the new scope.
- Reopening leaves earlier closeout records and packages unchanged, checked by hash.
- Reopening is refused while a scope is active.
- When two people reopen at the same moment, one scope is created and the second person is taken to it.
- A revision of an earlier scope cannot be restored into the new scope.
- A revision of an earlier scope cannot be designated as the new scope's current issued design. (CE-23 · reading)

**Access and restore**
- A revision restore changes no scope, no scope's state and no carried issue.

Notes: Left for later: reopening an archived project (story 6.16); Start service visit, which reopens into a service scope (story 6.19).

### Story 6.16: Archive and un-archive a project

As an Editor or an administrator, I want to archive a project that is no longer being worked on and un-archive it when needed, so that finished records stay readable and cannot be changed by accident.

Covers: FR-37, FR-68, FR-42. Screens: S-20, S-31.

**Core behaviour**
- An Editor of the project can archive and un-archive it from Records.
- An administrator can archive and un-archive it from Records or from Administration: Projects.
- The projects list and Administration: Projects show the archived state.
- An archived project can be searched, viewed and exported and cannot be edited. It shows the archive banner.
- Viewing and exporting leave its design, installation, evidence, decisions and earlier packages unchanged.
- Downloading an earlier package from an archived project returns the same bytes.
- Exporting may add a new retained package edition without un-archiving the project.
- Un-archiving is an explicit action, starts no scope and changes no record.
- Reopen on an archived project first asks to un-archive it.
- Archiving and un-archiving each add an entry to the Records timeline and to the activity log, with actor and time.

**Refusals and edge cases**
- Archiving is refused while a scope is In progress, with the reason shown.
- Archiving is refused while an inventory import or a package generation is running in the project, with the reason shown. (CE-24 · reading)
- A save into an archived project from a stale tab or a reconnecting phone is refused and kept for review, and is not retried. (CE-25 · value)
- When two people archive at the same moment, the project is archived once and the second person sees that it already is.
- A revision restore is refused while the project is archived.
- While the project is archived, a reviewer link, including one to a closeout record, opens read-only and accepts no comment or decision. (CE-26 · decision)

**Limits and values**
- The banner reads "Archived — view, search and export only".
- A refused save is labelled "not saved: project archived".

**Access and restore**
- No revision restore changes the archive state or its history.

Notes: Left for later: backup jobs (story 8.3) and restore jobs (story 8.4) that also block archiving.

### Story 6.17: Warranty records

As a designer, I want to record the warranty on an installation and on individual devices, so that anyone can see what is covered and until when.

Covers: FR-65 (warranty records and status), FR-33 (warranty details). Screens: S-23 warranty step, S-19.

**Core behaviour**
- Close out gains a warranty step. A scope's installation warranty has a term, a start date, a provider, a note and covered items.
- The start date defaults to the scope's closeout date and can be changed.
- Covered items default to the equipment and cable newly installed in that scope and can be adjusted.
- A device can also carry a manufacturer warranty with its own term, start date and provider.
- A device covered by more than one warranty shows each separately.
- Each warranty shows its calculated end date, which is the start date plus the term. (CE-27 · reading)
- Each warranty shows its status as of a stated date: Not started before the start date, In warranty from the start date to the end date inclusive, Expired after it.
- Equipment with no warranty recorded shows Unknown, never Expired. This includes surveyed existing equipment.
- Changing a warranty's term, start date, provider or covered items is recorded with actor and time, and the earlier values stay in its history.
- Warranty details are shown on the device record and as an optional column in the equipment schedule.
- When an issue is raised on a device, the device's warranty status is shown on the issue.
- A warranty is its own record, kept apart from the closeout record. The Closeout package shows the warranty details as they stand at the package's cutoff.
- Skipping the warranty step records no warranty.

**Refusals and edge cases**
- A term of zero, a negative term or a part-month term is refused.
- A warranty recorded on a scope that is not yet closed, with no start date entered, shows Not started. (CE-29 · reading)
- With no scope active, a warranty can still be added or changed.
- Adding or changing a warranty, at the warranty step or later, leaves the scope's closeout record unchanged, checked by hash.

**Limits and values**
- A warranty term is entered in whole months, with a minimum of 1. (CE-30 · value)

**Access and restore**
- A revision restore leaves warranties unchanged.

Notes: Left for later: the under-warranty suggestion on a service visit (story 6.18).

### Story 6.18: Service visits

As a technician, I want to record each visit made to fix a fault, so that anyone can see what was found and what was done.

Covers: FR-65 (service visits), FR-46 (visits on an issue), FR-33 (service visits in the Closeout package). Screens: S-19, S-18.

**Core behaviour**
- A service visit is recorded on an issue with when and how the fault was reported, the visit time, the fault found, the work done, the parts used, the time spent, who attended and whether it was under warranty.
- Under warranty is prefilled as of the visit date, with its reason shown, and can be changed.
- The suggestion is Yes if any warranty covering the device is In warranty.
- The suggestion is No if every warranty covering the device is Not started or Expired.
- The suggestion is Unknown if no warranty is recorded or the issue concerns no device.
- During an open scope, a visit is recorded in that scope and no new scope is started.
- A visit does not resolve the issue, which stays open until corrective work and a current passing check are recorded. The form says so.
- A visit changes no estimate.
- A second visit on the same issue sits beside the first, and visits added by two people at the same moment are both kept.
- A corrected visit keeps its earlier entry.
- The issue page's timeline shows each visit.
- The Closeout package of a scope shows every service visit recorded in that scope, as the visits stand at the package's cutoff.
- Recording or correcting a visit leaves every closeout record unchanged, checked by hash.

**Refusals and edge cases**
- The visit time cannot be earlier than the reported time, and neither can be in the future. (CE-31 · reading)
- With no scope active, an existing visit can be corrected and a new visit cannot be recorded. (CE-32 · reading)

**Access and restore**
- A revision restore leaves service visits unchanged.

Notes: Left for later: Start service visit, which lets a new visit be recorded when no scope is active (story 6.19).

### Story 6.19: Start a service visit when no scope is active

As a technician, I want one action that reopens the project for a service call, so that a fault reported months later can be attended and recorded without planning a new project.

Covers: FR-65 (service scope), FR-38 (reopening in one step), FR-26 (field changes without an issued design). Screens: S-18, S-19.

**Core behaviour**
- With no scope active, an issue offers Start service visit. After a confirmation that says what will happen, the project reopens into a new scope marked as service, with the issue included and the visit form open.
- A service scope needs no estimate and can be closed without one.
- A service scope needs no issued design: it starts with none, and issuing one remains available.
- In a service scope, Installed and Configured marks and field changes are recorded with nothing issued, and the warning "Work started with no issued design" is not shown.
- A camera re-aimed during a visit is recorded with its reason and flags its checks, although the service scope has no issued design.
- The service mark is a label only: the scope follows the one-active-scope rule and is closed out like any other scope.
- Starting a service scope leaves the original scope's closeout record, checked by hash, and its warranty records unchanged.
- For an archived project, the action first asks to un-archive it.

**Refusals and edge cases**
- When two people use Start service visit at the same moment, one service scope is created and the second person is taken to it.
- While a scope is active, Start service visit is not offered.

**Limits and values**
- A service scope is named "Service visit" followed by the date, and the name can be changed. (CE-34 · value)

### Story 6.20: External tickets on issues, visits and warranties

As a technician, I want to note the customer's or our own ticket number, with its link, on an issue, a service visit or a warranty, so that anyone can go from Site Studio to the ticket in the other system.

Covers: FR-78, FR-46, FR-65, FR-33 (package option), NFR-5 (links), AD-22 (links never fetched). Screens: S-18, S-19, S-37, S-24.

**Core behaviour**
- An issue, a service visit and a warranty each gain an "External tickets" list, with the hint "A ticket in another system, such as your customer's service desk or your own tracker". (CE-41 · reading)
- Add asks for a ticket number and an optional link, and notes that a link may carry the tracker's own access; a record may hold several external tickets. (CE-42 · value)
- The number is shown exactly as typed and matched, for search, duplicates and "also on", ignoring case and surrounding spaces. (CE-43 · value)
- Each entry shows the number and, when it has a link, the link's host beside a link icon that opens the link in a new tab without sending the project's address.
- An entry an agent added shows the agent mark.
- An external ticket whose number is also on another record of the same project shows "also on" with a link to each such record; archived records are labelled and deleted ones are left out. (CE-45 · reading)
- Adding, changing and removing an external ticket are history entries with actor and time, and a removed one stays in the record's history; adding a removed number again is a new entry. (CE-46 · reading)
- Searching the Issues list by a ticket number finds issues by their own external tickets and those of their service visits.
- The Issues list shows the first external ticket of each issue with "+N" for more.
- Members' CSV exports of issues, visits and warranties include their external tickets in two columns, numbers and links, each listing a record's tickets in the same order with one per line inside the cell, without "also on".
- Making a Design or Closeout package offers "Include external tickets", off by default; with it off the package shows none, with it on it shows each with its number and link as text and no "also on". (CE-47 · decision)
- The field shell's issue and visit forms show and add external tickets as on desktop, and a change made without a connection is queued like other field edits.
- A record after its closeout cutoff still accepts external tickets on its live copy, and the fixed closeout copy never changes.

**Refusals and edge cases**
- A link is trimmed, and is refused with "Enter a web address starting with https:// or http://" unless its scheme is `https` or `http` (in any case) and it has a host; control characters are refused. (CE-44 · value)
- A link with a user name or password is refused with "Remove the user name and password from the link". (CE-48 · decision)
- A number already on the record is refused with "This ticket is already listed", and a number of only spaces, or one containing a line break, a tab or another control character, is refused.
- "Also on" never names a record in another project. (CE-49 · decision)
- A change or removal of an external ticket that changed since it was read is refused with "changed since", showing the current value.
- A queued change refused when the connection returns, because the record changed or the number is already listed, is shown to the technician with the reason.
- In a CSV export, a number or link starting with `=`, `+`, `-` or `@`, or with the full-width form of any of them, is written so that a spreadsheet does not run it as a formula; the method is checked in Excel, LibreOffice and Google Sheets, with a test for each such leading character.
- The server never makes a request to an external ticket's link: a test adds a link to a test server and finds no request reaches it while the ticket is added, shown, searched or exported.
- The reviewer view never shows external tickets. (CE-47 · decision)
- A package already made, and a closeout record, keep the external tickets they held at their cutoff, checked by hash after one is added and another removed.
- Two people adding different external tickets to one record at the same moment both keep theirs.

**Limits and values**
- A ticket number has 1 to 100 characters. (CE-43 · value)
- A link has at most 2,000 characters, counted after an international host name is converted to its ASCII form, and that form is shown as the host. (CE-44 · value)

**Access and restore**
- A revision restore leaves external tickets unchanged.
- External tickets travel in the project's portable backup; on restore their links are checked again by the rules above, a user name and password are removed from a restored link first and the person restoring is told how many links were changed, a link that still fails is kept as text without a link, and "also on" is worked out again.

## Epic 7: Extended modelling

**Outcome.** The design can describe multi-view and pan/tilt/zoom cameras, doors with their components, site annotations, closets and ports, and cable that runs between floors.

**Depends on.** Epics 1 to 6 complete. Nothing later.

**Why here.** These models extend records whose lifecycle, planned actions, removal and restoration are settled in Epic 6, so each extension can state its own rule for them once.

### Story 7.1: Cameras with several views and streams

As a designer, I want one camera body to carry several views and streams, so that multi-head and panoramic cameras are analysed honestly and bought once.

Covers: FR-48, FR-19 (views and streams).

**Core behaviour**
- A four-head template creates one physical camera with four views.
- Each view has its own stable identifier, resolution, lens setting, bearing, tilt and condition, and can be inspected separately.
- Each view is analysed with its own inputs, and a combined result names the view that supplies it.
- The camera counts as one device in the estimate and contributes one device's power demand to capacity, whatever its number of views.
- Capacity counts only the streams configured as recorded or transmitted. Four displayed crops add no stream.
- A fisheye camera's preview is drawn as illustrative, and only when its mounting, angular extent and chosen range are known.
- A fisheye view's DORI is Not assessed, and it earns no credit toward a zone target.
- A stitched-panorama camera keeps its source-head profiles apart from its composite output. Source heads are analysed individually, and the composite's DORI is Not assessed.
- A view marked Faulty is not credited on the Current installation basis, and the camera's other views still are.
- Changing one head's settings on an installed camera flags that head's checks only.
- An issued design keeps the views and results it captured after the camera is edited.

**Refusals and edge cases**
- An area seen only by a fisheye or composite view is reported as Not assessed, not as having no camera view.
- A zone whose target is unmet, and that such a view is in range of, shows Not demonstrated, not Shortfall.

**Access and restore**
- A revision restore returns the views and streams of a Proposed camera and leaves those of an Existing camera, with each view's condition, unchanged.

### Story 7.2: Pan/tilt/zoom cameras: stored positions and the resting view

As a designer, I want a pan/tilt/zoom camera to count only where it rests, so that coverage is not overstated.

Covers: FR-63 (ranges, limits, stored positions, home, checks), FR-29 (pan/tilt/zoom starter). Screens: S-06.

**Core behaviour**
- A camera-model template can hold a pan range, a tilt range and a zoom range.
- A placed camera can hold its own pan and tilt limits within the model's range, edited as numbers or by handles.
- Unknown ranges and limits are shown as Unknown.
- A placed camera holds named stored positions, each with pan, tilt and zoom, and one can be marked Home.
- The home position alone contributes to combined coverage, DORI and zone results. In the PRD's worked example it alone counts toward the entrance zone.
- Previewing another stored position draws it with a dashed outline and a "not counted" banner and changes no totals.
- The camera counts as one device with one power demand, and stored positions add no streams.
- Changing the home position on an installed camera changes counted coverage and the zone results that depend on it, and flags that position's checks.
- Changing another stored position on an installed camera flags that position's checks, and changing a limit flags the limit checks.
- A pan/tilt/zoom checklist starter offers these checks: limits stop where intended; pan, tilt and zoom controls operate; each stored position shows its intended scene; the camera returns to home; limits or positions keep it from facing bright light.

**Refusals and edge cases**
- Without a home position the camera contributes no counted coverage and is flagged "No home position — not counted in coverage".
- Editing a stored position on a proposed camera flags no field check.
- A limit outside the model's known range is refused.

**Access and restore**
- Positions, limits and the home mark are kept in a named revision. A revision restore returns them for a proposed camera and leaves those of an installed camera unchanged.

Notes: Left for later: the reach layer (story 7.3); package sheets that show the resting view, previews and reach (story 7.11).

### Story 7.3: Pan/tilt/zoom cameras: reach on demand

As a designer, I want to see separately where a pan/tilt/zoom camera could look, so that nobody mistakes what it can reach for what it covers.

Covers: FR-63 (reach and achievable detail). Screens: S-06.

**Core behaviour**
- Reach is drawn as a separate layer named "Reachable on demand", visibly different from covered area.
- Reach is never counted as covered or as overlap.
- A point within reach shows the best achievable detail there, labelled "one place at a time".
- An otherwise uncovered area within reach is identified as reachable on demand, not as having no camera view.
- Narrowing a pan limit shrinks the reach.
- A zone shows, apart from its counted result, which cameras can reach it on demand and the area reachable at each DORI level.
- The PRD's worked example holds: the loading-dock zone keeps its counted shortfall and separately shows that the camera can reach it on demand, with the achievable detail, and that line does not meet the target.

**Refusals and edge cases**
- With unknown pan or tilt limits no reach is drawn, and the camera's reach is disclosed as unassessed.
- With limits but no optical data, the reach outline is drawn with "Detail not assessed".

Notes: Left for later: package sheets that show reach as not counted (story 7.11).

### Story 7.4: Doors and gates with linked components

As a designer, I want a door or gate to be its own record linked to its reader, contact, lock and controller, so that an opening can be read as a whole without any component being counted twice.

Covers: FR-49. Screens: S-08 Doors and gates.

**Core behaviour**
- Equipment gains a Doors and gates tab. A door or gate has its own identifier, location and details, and can exist with no components.
- Door D-01 links to its reader, contact, lock and controller. A link can carry a side or direction label.
- Each linked component stays a separate record with its own identifier, location, cost, planned action, work marks, checks and notes.
- The door lists its components, each component names its door, and the equipment schedule shows the relationship.
- Linking the same controller to D-02 creates no second purchase line and no second demand.
- A door with its own entered price appears as its own estimate line, and the costs of its components are not added to that line.
- A retained door can receive a proposed new reader. The door gets no purchase line and no Installed mark from it.
- Removing a link keeps the component and its evidence.
- Recording the removal of a linked component lists the door link in the removal review of story 6.12, and the link is kept as history on the door.

**Refusals and edge cases**
- Creating a link creates no cable, no port assignment and no power demand, and marks nothing installed or tested.

**Access and restore**
- A revision restore returns the links in which the door or the component is Proposed, and leaves links between two Existing records unchanged. (CE-35 · reading)

### Story 7.5: Site annotations

As a designer, I want to mark fences, entrances, directions, notes and dimensions on a plan, so that the drawing explains the site without changing any analysis.

Covers: FR-50, FR-60 (annotations block floor deletion). Screens: S-07.

**Core behaviour**
- Fence lines, entrance markers, direction arrows, text callouts with an optional leader line, and two-point dimensions can be drawn on any plan, including an outdoor site plan.
- Each annotation has a name and a stable identifier.
- An annotation can be selected, moved, edited, restyled with a colour and line style, locked, hidden and deleted.
- Each annotation shows a text label, so its meaning does not depend on colour.
- Annotations are the same after save, undo and reload.
- A dimension on a plan with a valid scale shows its length with units, labelled as an estimate from the plan.
- An entrance marker can reference a gate, and a callout can reference a photo or an issue. Neither creates another record or moves the one referenced.
- Hiding or deleting markup changes no coverage result, equipment count or power demand, and does not hide the remaining-work list.

**Refusals and edge cases**
- A locked annotation cannot be moved or edited until it is unlocked.
- A fence line blocks no camera view until an obstruction is added. The offer to add one appears once for each line.
- A dimension on a plan without a valid scale reads "Scale unknown".
- A dimension creates no cable route and no supply quantity.
- Deleting a callout keeps the photo or issue it referenced.
- A floor that holds an annotation cannot be deleted, and the refusal lists the annotations.

**Access and restore**
- Annotations are saved in a named revision and returned by a revision restore.

### Story 7.6: Closets and port schedules

As a designer, I want to record equipment closets and which device is on which switch port, so that the network side of the design is written down.

Covers: FR-51 (closets, port schedule, assignments), FR-60 (closets block floor deletion). Screens: S-12.

**Core behaviour**
- The Connections area replaces its "not available yet" message with Closets and port schedules.
- A closet has a name, a stable identifier and a floor location. It groups its actual cabinets, switches, controllers, recorders and power supplies, and adds no cost and no load.
- Renaming or regrouping a closet moves no device and redraws no route.
- Each switch has a port schedule. A port shows label, type, endpoint, cable reference and power.
- Allocation (Free, Reserved, Assigned) and availability (Usable, Unavailable, Unknown) are separate columns.
- A port on another floor can be planned for a camera before a route exists, and shows that the route is missing.
- A port can be reserved with unknown power.
- Current installation and Proposed design assignments are kept separately.
- The inspector's Work tab shows a device's port assignments on each basis, with a link to the port schedule.
- The device sheet shows the device's closet, port and cable reference.
- A connection on an Unavailable port keeps its record and shows a warning.
- A controller terminal creates no Ethernet port and no power source, and a device wired to a controller uses no switch port.
- A cable whose end disagrees with its port assignment is shown as a discrepancy on both.

**Refusals and edge cases**
- Assigning a port sets no Installed mark and passes no check.
- A floor that holds a closet cannot be deleted, and the refusal lists the closet.

**Access and restore**
- A revision restore returns proposed port assignments and reservations, and leaves current assignments and port availability unchanged.
- A revision restore leaves closets and their grouping unchanged. (CE-36 · reading)

Notes: Left for later: conflicting claims, power and capacity (story 7.7); ports through removal, restoration and draft deletion (story 7.8); cable runs in Connections (story 7.9).

### Story 7.7: Port claims, power and capacity

As a designer, I want port and power capacity checked from the recorded assignments, so that a port is never claimed twice and unknown loads are never passed off as headroom.

Covers: FR-51 (conflicts, power budgets), FR-19 (ports and power), FR-28 (port or power connection changed), FR-42 (port assignments). Screens: S-12.

**Core behaviour**
- When two people claim one port, the first save succeeds. The other person sees a conflict, with the claim kept as a pending edit and the conflict highlighted on both rows. (CE-37 · reading)
- The power summary shows the budget, known allocation, reservations and unknown loads.
- With any unknown load the power summary reads Incomplete, with the count, and never shows a pass.
- With unknown inventory on a switch, the count of available ports is shown as unknown, not as a number.
- An assignment with a known type or power incompatibility shows a warning on the port.
- Port and power capacity estimates use these assignments on the selected basis and list unassigned demand separately.
- A recorded change to a device's current port or power connection flags its link and power checks, and the function checks that depend on them, Retest required, linked to the change.

**Refusals and edge cases**
- A change to a proposed port assignment flags no field check.

### Story 7.8: Ports through removal, restoration and draft deletion

As a designer, I want ports handled deliberately when a device is removed, restored or deleted, so that a port is never freed or taken back by a side effect.

Covers: FR-53 (port dispositions), FR-55 (ports on Delete draft and undo), FR-68 (attention count). Screens: S-12.

**Core behaviour**
- The removal review of story 6.12 also lists the device's port and terminal assignments, each with a disposition: retained and disconnected, reused, removed, or unresolved.
- An unresolved port disposition is flagged Needs connection review and is included in the attention count.
- After a removal the device's demand is gone, and its former port keeps its allocation and is not shown as Free until someone releases or reassigns it. (CE-38 · reading)
- Recording the removal of a switch flags its port assignments for review and archives no downstream device.
- Restoring a device under story 6.13 offers its earlier port as a historical choice and does not reinstate it.
- Delete draft on a proposed device with a planned port assignment lists the assignment in its preview and, on confirmation, releases only that device's own reservation. (CE-39 · reading)

**Refusals and edge cases**
- Reconnecting a restored device cannot take a port now assigned to another device.
- A device with a Current installation port assignment is not eligible for Delete draft, and the reason is listed.
- A Delete draft sent from a stale view, after someone assigned the device a port, is refused with the reason.
- Undoing a draft deletion or a bulk cleanup does not reclaim a port that has since been assigned to another device, and the undo reports it.

**Access and restore**
- A revision restore leaves port dispositions from removals unchanged.

### Story 7.9: Cable runs between floors through named risers

As a designer, I want one cable run to cross floors through a named riser, so that each run is drawn where it really goes and counted once.

Covers: FR-9, FR-52 (runs, segments and risers), FR-60 (riser references). Screens: S-12, S-13.

**Core behaviour**
- Connections gains a Cable runs list with one row per physical run.
- A riser is a named point with a stable identifier and from and to floors.
- Several runs can use one riser, and selecting the riser lists them.
- One run keeps one identifier across its ordered floor segments and its riser, and its detail shows both terminations.
- The run appears on each of its floors with a continuation label such as "to Level 2 via Riser R-1", and once in totals.
- Each segment is measured with its own floor's scale. No length between floors is taken from plan coordinates.
- Routes drawn under story 2.15 are converted and labelled horizontal-only until reviewed.

**Refusals and edge cases**
- Drawing or measuring a run sets no Installed mark and passes no check.
- A floor that a riser or a run segment refers to cannot be deleted, and the refusal lists the riser and the runs.

**Access and restore**
- A revision restore returns proposed runs with their segments and risers, and leaves existing runs unchanged. (CE-40 · reading)

Notes: Left for later: transition and drop lengths, extras and supply quantities (story 7.10); run schedules in packages (story 7.11).

### Story 7.10: The length ledger

As a designer, I want each run's length built up part by part, so that cable quantities are right and I can see where every metre comes from.

Covers: FR-52 (length components, supply quantity, measured length), FR-9 (estimate updates). Screens: S-13.

**Core behaviour**
- Transition and drop lengths are entered with units and marked measured or estimated.
- The PRD's worked example holds: 20 m and 12 m segments, a 6 m transition and 2 m of drops give a route subtotal of 40 m.
- In the same example, 2 m of fixed extras and a selected 10% give a suggested supply of 46 m.
- The ledger shows this as arithmetic, with the percentage applied once and not to the fixed extras.
- An entered zero is accepted as no extra length.
- Moving an endpoint or waypoint updates the estimate and flags a manually entered supply quantity for review.
- A measured installed length is kept beside the estimate with its source, and no allowance is added to it.
- A run that exceeds a stated length limit for its cable type is flagged.

**Refusals and edge cases**
- Removing a required transition value makes the estimate Incomplete, with the known subtotal shown.
- A plan without a valid scale makes the estimate Incomplete.
- No length limit is applied to a cable type that has none recorded.

**Limits and values**
- The application supplies no percentage, floor height or length limit. Each is entered by the project.

**Access and restore**
- A revision restore returns the ledger entries of proposed runs, and leaves measured installed lengths unchanged.

### Story 7.11: Package sheets for the extended model

As a designer, I want packages to carry the closets, ports, inter-floor runs, annotations and camera analysis detail, so that the printed record matches the model.

Covers: FR-33 (remaining contents). Screens: S-37.

**Core behaviour**
- Design and Closeout packages include closet equipment and port schedules, stating the Current or Proposed basis, reservations, power assumptions and unresolved warnings.
- The Closeout package shows port dispositions from removals, with historical endpoints apart from current assignments.
- Floor sheets show inter-floor continuation labels.
- A run schedule lists each run's identifier, terminations, floors and risers, length breakdown, fixed extras, percentage, suggested and selected supply, measured length and completeness.
- Each run is counted once in schedules and totals across sheets and volumes.
- Annotations appear on plan sheets by default with their labels and a legend.
- Analysis sheets mark assessed views, illustrative fisheye previews and unassessed panoramic outputs differently.
- Analysis sheets show a pan/tilt/zoom camera's resting view as counted, and its previews and reach as not counted, each labelled.
- Equipment schedules show each door with its linked components and their own identifiers.

**Refusals and edge cases**
- When annotations are left out, the package says so, and the outstanding-issue summary is still included.

## Epic 8: Backups and recovery

**Outcome.** Projects and the installation's own data are backed up daily, a project or a whole installation can be recovered, and a project can be moved as a portable backup.

**Depends on.** Epics 1 to 7. The backup and restore checks name records from all of them: revisions, reviewer links and packages (Epic 4), evidence and issues (Epic 5), removed devices and archive state (Epic 6), connections (Epic 7). The Administration area and its Projects table come from story 1.10 and story 1.12, the activity log from story 1.14, the Records timeline from story 4.1, the deployment key from story 1.5 and story 2.23, the Settings screen and the project-creation setting from story 1.15, and the acceptance-size project and its script from story 2.11. The self-hosted parts need story 2.21, story 2.25 and story 2.26. Nothing later.

**Why here.** A backup is only complete once every kind of record exists, and updates in Epic 9 cannot be built until a backup can be taken and restored.

### Story 8.1: Daily backup of each project and of the installation's data

As an administrator, I want every project and the installation's own data backed up each day through the server, so that a lost store costs at most a day of work.

Covers: FR-34, FR-71, NFR-5, AD-13.

**Core behaviour**
- A complete backup of each project is made at least once every 24 hours into the backup area.
- Each backup has a manifest listing every record file and every file hash.
- The installation's own data is backed up on the same schedule: accounts with password hashes and two-step secrets, roles, memberships, settings with their protected secrets, and the activity log.
- A backup is made through the server from one consistent point of the project's records.
- A server function takes a backup marked "before an update or data conversion".
- Each backup and its outcome appears in the activity log with time and actor (the administrator, or "scheduled").

**Refusals and edge cases**
- A save acknowledged while a backup runs is not lost, and is either wholly in that backup or wholly in the next.
- A backup job interrupted by a server restart continues from its last completed step and finishes without starting again.

**Evidence to record**
- A test backs up a project holding a plan imported from a password-protected PDF, searches the backup for the password and finds none.
- A test backs up the installation's data, searches it for the known test session token, link token, recovery code and password, and finds none in readable form.
- An automated test over the record shapes of the project room and the installation object fails if any has a field for a site system's password or access code. (CF-01 · reading)

Notes: Left to later stories: where backups are written and how many are kept (story 8.2); the Backups screen and Back up now (story 8.3); the "before an update" backup taken in a real update (story 9.7 and story 9.13).

### Story 8.2: Backup area, kept generations and rotation

As an administrator, I want backups kept apart from live data and seven successful daily backups retained, so that losing the live store or one bad backup does not lose the project.

Covers: FR-34, AD-13.

**Core behaviour**
- On Cloudflare the backup area is a second storage bucket, separate from the live bucket and created by the Cloudflare deployment.
- Self-hosted, backups are written to the backup folder set in the Compose file (story 2.25), and to nowhere else.
- Rotation removes a file from the backup area only when no kept generation lists it.
- Rotation removes nothing from a live project or from the activity log.

**Refusals and edge cases**
- A Cloudflare deployment without the second bucket fails with a message naming the missing bucket. (CF-02 · reading)
- When the backup area is full or cannot be written, the backup ends as Failed with that reason.
- While the backup area is full, live saves are still acknowledged.
- A failed backup damages and removes no earlier generation, and does not count as one of the seven.

**Limits and values**
- Seven successful daily generations are kept for each project and for the installation's data.
- The backup marked "before an update" of the last successful update is kept until the next successful update, and the one of an attempt under way is kept until that attempt ends; neither is removed by daily rotation. (CF-03 · reading)

**Access and restore**
- A revision restore changes no backup generation.

### Story 8.3: Backups screen and backup status

As an administrator, I want to see the latest backup of everything and start one myself, so that I know backups are succeeding before I rely on them.

Covers: FR-34, FR-70 (Backups), FR-71, AD-13. Screens: S-34, S-31, S-02, S-20.

**Core behaviour**
- Administration gains Backups (S-34), which lists each project and the installation's own data with the latest backup, its age and its outcome.
- An administrator starts a backup of one project or of the installation's data with Back up now.
- The Projects table (S-31) shows each project's latest backup.
- The Overview (S-02) and Records (S-20) show the project's latest backup age to its members.
- A latest successful backup more than 24 hours old is shown as a failure with its age, on S-34 and on the project's Overview.
- A failed backup is shown as a failure with its reason, on S-34 and on the project's Overview.
- Self-hosted, when the backup location is on the same disk as the live data the server still starts, and S-34 shows a warning that a disk failure would lose both.

**Refusals and edge cases**
- Back up now pressed while a backup of the same project is running shows the running job and starts no second one.
- A daily backup that falls due while a manual one runs waits for it, and is skipped if that one succeeded.
- Archiving or un-archiving a project is refused, with the reason, while a backup job for that project is running. (CF-05 · reading)
- A backup that falls due while a project is being archived waits for the archive to finish. (CF-05 · reading)

**Limits and values**
- The outcome reads Succeeded with its age, Failed, or Never.

**Access and restore**
- A standard user cannot open Backups or call its functions.

### Story 8.4: Restore a project into a separate copy and check it

As an administrator, I want to restore a project from a backup into a separate copy and see it checked, so that a bad restore never touches the working project.

Covers: FR-34, FR-70 (Backups), NFR-1, AD-13. Screens: S-34.

**Core behaviour**
- An administrator chooses one of a project's kept backups and sees its date and the loss window (the time between that backup and now) before starting.
- The restore builds a separate copy that members cannot see or open.
- While the copy is built, members can open the working project and their saves are acknowledged.
- A backup written at an older data-format version is converted in the copy before it is checked.
- The copy is checked, and each check is listed with its result: record counts against the manifest; device, view and stream identifiers and their relationships; file hashes of originals and previews; named revisions and their snapshots; removed devices; outstanding issues; package volumes and their manifests; and the issued-design designation history.
- A copy that has not been made current is listed on S-34 with its size and can be discarded by an administrator.
- Starting a restore, each failed check and a discarded copy appear in the activity log.

**Refusals and edge cases**
- A backup written at a newer data-format version than the server is refused with an explanation naming both versions.
- If any check fails or the restore is interrupted, the copy is shown as failed and the working project is unchanged.
- Starting another restore for a project that already has a copy asks to replace that copy. (CF-06 · value)
- Archiving or un-archiving a project is refused, with the reason, while a restore job for that project is running. (CF-05 · reading)

**Limits and values**
- A project has at most one copy that has not been made current, and it stays until an administrator discards or replaces it. (CF-06 · value)

**Access and restore**
- A standard user cannot start a restore, see a copy or discard one.
- A revision restore in the working project leaves a copy unchanged.

Notes: Left to later stories: making the copy current (story 8.5); the timed full-size restore (story 8.6); a portable backup as the source (story 8.12).

### Story 8.5: Make the checked copy current

As an administrator, I want to switch to the restored copy only by a deliberate action after every check has passed, so that the working project is replaced knowingly and can be got back.

Covers: FR-34, FR-70 (Backups), FR-71, NFR-1, AD-13. Screens: S-34, S-02, S-20.

**Core behaviour**
- "Make this copy current" is offered once every check of story 8.4 has passed.
- Before confirmation it states that this project's reviewer links are cancelled and must be issued again, and that nobody is signed out.
- When the administrator confirms, writes to the working project stop, and they stay stopped through the switch, so that no save falls between the backup and the switch.
- With writes stopped, a backup of the working project is taken and kept as "before restore". (CF-07 · reading)
- After the switch members open the restored project in place of the earlier one.
- After the switch every reviewer link of that project is refused.
- The switch ends no session.
- The switch changes no other project.
- The restored project shows its recovery point and the possible loss window on the Overview and Records.
- The restored project shows no revision, decision or issued designation made after its recovery point.
- The switch appears in the activity log.
- The switch is an entry in the project's Records timeline of story 4.1, naming the recovery point.

**Refusals and edge cases**
- "Make this copy current" is not offered for a copy with a failed check or an interrupted restore.
- If the "before restore" backup fails or the administrator cancels the switch, the switch does not happen, the working project is unchanged and writes to it resume.
- A save sent from a page that was open before the switch is refused and changes nothing in the restored project. (CF-08 · reading)
- That save stays visible on its page as "not saved: project was restored" and is not retried. (CF-08 · reading)

**Limits and values**
- The most recent "before restore" backup of each project is kept in addition to the seven daily generations. (CF-07 · reading)
- A later restore of the same project replaces it. (CF-07 · reading)
- An administrator can discard it. (CF-07 · reading)

**Access and restore**
- Only an administrator can make a copy current; a standard user's request is refused by the server.

### Story 8.6: Experiment R3: time a full-size project restore on both hosts

As Kevin, the product owner, I want a full-size restore timed on each host before recovery is relied on, so that the 60-minute target is known to be reachable or the fallback is chosen early.

Covers: FR-34 (recovery target), experiment R3.

**Core behaviour**
- The fixture script of story 2.11 is extended with an option that adds files to the acceptance-size project until it reaches a stated stored size.
- The restore and switch of story 8.4 and story 8.5 are run on an 8 GiB project made that way, on a deployed Cloudflare test installation and on a self-hosted server.

**Limits and values**
- The target is 60 minutes from starting the restore to a project that opens and acknowledges a save.

**Evidence to record**
- The record states the file kinds and counts of the 8 GiB project.
- Every file added for size has distinct content, and the project's stored size, summed from its backup manifest, is between 7.5 and 8 GiB. (CF-09 · value)
- Each elapsed time is recorded against the target, with the preparation assumed.

Notes: R3's fallback, if the target is missed on either host, is to restore by reference first and copy files in the background (architecture section 12); the decision is recorded with the result.

### Story 8.7: Recover a whole installation

As an organisation's administrator, I want a written procedure that rebuilds the whole installation from its backups, so that we can recover after losing the server or the account's storage.

Covers: FR-34, FR-71, NFR-5, AD-13.

**Core behaviour**
- A procedure written in the repository, run from outside the interface, rebuilds an installation in an empty destination from the backup area: the installation's own data and every project.
- The procedure states that the deployment key is kept outside the backups, was shown once when it was created, and is needed for recovery.
- The operator supplies the kept deployment key to the destination, as a deployment secret on Cloudflare or as the key file self-hosted, and the destination uses it and generates none. (CF-10 · reading)
- After recovery, accounts, roles, memberships and settings are as they were at the recovery point.
- After recovery a user signs in with the password and two-step verification they had at the recovery point.
- After recovery every session that existed before is refused.
- After recovery every reviewer link is refused.
- After recovery every invitation and password-reset link issued before it is refused. (CF-11 · reading)
- Administrators see a notice naming the recovery point, stating that passwords, roles, memberships and deactivations are as they were then, and asking them to review users and members changed since.
- Each project shows its own recovery point and possible loss window, as in story 8.5.
- Each restored project passes the checks of story 8.4 before it can be opened.
- The recovery and its recovery point appear in the recovered installation's activity log.
- The activity log's entries up to the recovery point are intact after recovery.

**Limits and values**
- The notice stays until an administrator dismisses it. (CF-12 · value)

Notes: Left to later stories: recovery without the key and with backups that do not match (story 8.8); the timed full-size run (story 8.9); the Cloudflare update token as a stored secret (story 9.13).

### Story 8.8: Recovery without the key, and backups that do not match

As an organisation's administrator, I want recovery to finish and tell me what it could not bring back, so that a lost key or a missing backup does not stop us working.

Covers: FR-34, FR-71, NFR-5, AD-13.

**Core behaviour**
- Without the deployment key the procedure completes only when run with a stated option that accepts the loss of stored secrets. (CF-13 · decision)
- Run that way, two-step verification is reset for every account. (CF-13 · decision)
- Run that way, stored settings secrets (the email and map keys) are cleared and shown in Settings as needing re-entry. (CF-13 · decision)
- A recovery without the key is recorded in the activity log.
- Where the installation's data and the project backups do not match, the procedure reports each mismatch and the notice of story 8.7 lists it.

**Refusals and edge cases**
- A restored project that fails a check is listed as not recovered and cannot be opened.
- With one project not recovered, the other projects can be opened and saved to.
- A project in the catalogue with no usable backup is listed as not recovered and cannot be opened. (CF-14 · reading)
- A project backup with no catalogue entry is recovered with no members and listed for an administrator to assign. (CF-14 · reading)
- Each project not recovered appears in the activity log.

### Story 8.9: Time a whole-installation recovery on both hosts

As Kevin, the product owner, I want a full-size recovery of an installation timed on each host, so that the recovery target is measured before acceptance.

Covers: FR-34 (recovery target), NFR-7, AD-13.

**Core behaviour**
- The procedure of story 8.7 is run into an isolated destination on Cloudflare and on a self-hosted server, with the installation's data and the 8 GiB project of story 8.6.

**Limits and values**
- The target is 60 minutes from starting the procedure to a sign-in that works and a project that opens and acknowledges a save.

**Evidence to record**
- Each elapsed time is recorded against the target, with the preparation assumed.
- Each step of the procedure that needed something not written is recorded, the procedure is corrected, and the corrected step is run again.

### Story 8.10: Create and download a portable backup

As a designer (an Editor), I want to download a complete backup of a project, so that it can be kept outside the system or moved to another installation.

Covers: FR-34, FR-68, FR-71, NFR-5, AD-14.

**Core behaviour**
- An Editor or an administrator starts a portable backup of a project as a job and downloads the result.
- Creating the file and transferring it are shown as separate steps, each with progress and any failure.
- The file holds the project's records, named revisions and snapshots, files, packages with their manifests, issues, removed devices, a manifest with hashes, and the data-format version.
- The file holds no accounts, password hashes, sessions, invitation or reset links, reviewer-link tokens or memberships.
- The names of the people who acted are present in the file as text.
- Creating and downloading each appear in the activity log.

**Refusals and edge cases**
- A failed creation is shown as Failed and can be retried.
- A job interrupted by a server restart continues from its last completed step.
- A request to start a second portable-backup job for a project while one runs shows the running job and starts no other. 
- A portable backup that would be larger than 10 GiB, or of a project over the 8 GiB payload boundary, is not produced: the job stops with the reason and the project is unchanged.

**Limits and values**
- The finished file is kept for download for 24 hours and then removed. (CF-16 · value)

**Access and restore**
- A Viewer's request to create or download a portable backup is refused by the server.
- A revision restore leaves a finished portable backup file unchanged.

**Evidence to record**
- A test makes a portable backup of a project holding a plan imported from a password-protected PDF, searches the file for the password and finds none.

Notes: Left to later stories: importing (story 8.11); replacing a live project (story 8.12); the timed full-size runs (story 8.13).

### Story 8.11: Import a portable backup as a new project

As a designer (an Editor), I want to bring a portable backup into this or another installation as a new project, so that a project can be moved between hosts without changing anything that is already there.

Covers: FR-34, FR-68, FR-71, FR-51 and FR-63 (kept through a portable backup), NFR-1, NFR-7, AD-14.

**Core behaviour**
- Importing a portable backup is offered to whoever may create projects: administrators, and standard users when the setting of story 1.15 allows it.
- An import creates a new project and changes no existing one.
- The new project is given a new project identity and records the identity of its source. (CF-17 · reading)
- A standard user who imports becomes the new project's Editor, and no other member is added. (CF-18 · reading)
- Before any project is created the upload is validated: the manifest is read and every hash is checked.
- A backup written at an older data-format version is converted during import.
- In the imported project, device, view and stream identifiers and their relationships, revisions, evidence, removed devices, issues, pan/tilt/zoom positions, limits and home marks, closets and port schedules, and package files are the same as in the source.
- A retained package in the imported project downloads byte for byte as in the source.
- In the imported project the actors' names show as recorded and are linked to no account.
- Approval assignments made to accounts arrive unassigned.
- No reviewer link from the source works in the imported project.
- Each import appears in the activity log.

**Refusals and edge cases**
- A file that is corrupt, truncated or not a portable backup is refused with the reason, and no project appears in any list.
- A container over 10 GiB is refused with the limit named.
- A container within that limit whose uncompressed project payload is over 8 GiB is refused during validation with the limit named.
- A backup written at a newer data-format version than the installation is refused with an explanation naming both versions.
- An import that fails or is interrupted after validation leaves no partial project; the importer sees Failed and can start again.
- A PDF or CSV export chosen at import is refused with the reason, and neither is offered as a backup anywhere.

### Story 8.12: Replace a live project from a portable backup

As an administrator, I want to replace a live project from a portable backup through the same checked copy and deliberate switch, so that a replacement is as safe as a restore.

Covers: FR-34, FR-68, FR-70 (Backups), FR-71, AD-14. Screens: S-34.

**Core behaviour**
- An administrator uploads a portable backup as the source for the restore flow of story 8.4 and story 8.5: a separate copy, the same listed checks, the "before restore" backup and a deliberate "Make this copy current".
- The upload is validated as in story 8.11 before the copy is built.
- After the switch the project keeps its own identity and its members. (CF-19 · reading)
- Each replacement appears in the activity log.

**Refusals and edge cases**
- A replacement is refused before the copy is built when the backup's project identity is not the live project's own, with the advice to import it as a new project. (CF-20 · reading)

**Access and restore**
- Replacing a live project is offered only to an administrator; an Editor's request is refused by the server.

### Story 8.13: Experiment R5 and moving a project between hosts

As Kevin, the product owner, I want a full-size portable backup built, checked and restored on each host and moved between them, so that the one-file format is known to work at the limit.

Covers: FR-34, NFR-7, AD-14, experiment R5.

**Core behaviour**
- A portable backup of the 8 GiB project of story 8.6 is built, validated and restored on Cloudflare and on a self-hosted server, three times each.
- A portable backup made on a self-hosted installation imports on a Cloudflare test installation of the same version and passes the checks of story 8.11.
- A portable backup made on Cloudflare imports on a self-hosted installation of the same version and passes the same checks.

**Limits and values**
- Creation completes within 10 minutes.
- Validation and restoration after upload complete within 15 minutes.

**Evidence to record**
- Every run's creation, validation and restoration times are recorded, with transfer times recorded separately.

Notes: R5's fallback, if one ZIP cannot be built in alarm-driven steps, is numbered parts with a manifest (architecture section 12); the decision is recorded with the result.

### Story 8.14: Limits and usage

As a designer (an Editor), I want to see how much of the storage budget a project uses and be warned before I exceed it, so that a large job fails safely and never damages saved work.

Covers: acceptance table for files and project content; FR-34 (backup storage separate from the budget); FR-70 (limits shown). Screens: S-20, S-31, S-33.

**Core behaviour**
- Members see the project's current usage against the 8 GiB budget on Records.
- The count includes originals, previews, distinct older files, records and history, and retained package editions.
- The count excludes backups, portable backup files held for download, unfinished uploads that are later discarded, and the stored parts of a package edition that failed or was abandoned.
- The Projects table in Administration (S-31) shows each project's stored size.
- Settings gains a Limits group showing each storage limit and current usage as read-only values, with no control to raise them.
- Before an upload or an inventory import starts, the server compares its declared size with the remaining budget; if it would exceed the budget, the user sees a warning naming the limit and the amount over, and nothing is sent.
- When a portable-backup import is admitted, its declared container size is checked against the 10 GiB container limit, not against the 8 GiB project budget. Over that limit the user sees a warning naming the limit and the amount over, and nothing is sent.
- The uncompressed project payload of a portable backup is checked against the 8 GiB project budget during validation (story 8.11).
- A valid 8 GiB project in a container between 8 GiB and 10 GiB is not refused at admission.
- A package generation, which has no size until it has run, fails with the limit named when it reaches the remaining budget, and its stored parts are discarded. (CF-21 · reading)
- A warning is shown on Records, and to administrators on S-31, when a project's usage reaches 90% of the budget. (CF-22 · value)

**Refusals and edge cases**
- Of two uploads started together that would jointly exceed the budget, the later one is refused before sending and the earlier one completes.
- After an operation is refused for a limit, the project's records, files and history are the same as before it.
- An export that cannot complete within a limit is shown as Failed and is never delivered truncated.
- A project at its budget can still be opened, searched, exported, backed up and downloaded as a portable backup.

**Limits and values**
- The project budget is 8 GiB of retained content, with 1 GiB = 1024 MiB.

## Epic 9: Install from published instructions and update from the interface

**Outcome.** Anyone can install Site Studio on either host from published instructions, and an administrator can install a new signed release with one action and get the earlier version back if it fails.

**Depends on.** The version rule that every update relies on is in story 1.1, so that the first release already obeys it. Story 9.1 needs story 1.2, story 1.5, story 1.13, story 2.21, story 2.22, story 2.23, story 2.25, story 2.26, story 8.2 and story 8.7. Story 9.2 needs story 1.1, story 2.21, story 2.24 and story 9.1. Story 9.3 needs story 1.1, story 1.14 and all of Epic 8, because the update record follows the pre-update backup; story 9.4 needs story 9.3, all of Epic 8 and story 4.10; story 9.5 needs story 9.2, story 9.3 and story 9.4. Story 9.6 needs story 1.10, story 1.14 and story 9.2. Story 9.7 to story 9.15 need all of Epic 8 and story 9.2 to story 9.6, because an update takes a backup first and restores it on failure; story 9.12 and story 9.13 also need the failure warning of story 9.10; story 9.13 also needs the settings secrets of story 1.15. The first release published for organisations is cut only after story 9.10 self-hosted and story 9.13 on Cloudflare, because it must act as the version before in their first update. Nothing later.

**Why here.** Updating safely needs the backup and restore of Epic 8, and the instructions can only be written and followed once both hosts and their backups exist.

### Story 9.1: Published installation instructions

As an organisation's administrator, I want installation instructions I can follow without help, so that I can bring up Site Studio on our own server or our own Cloudflare account.

Covers: FR-66 (instructions), SM-6.

**Core behaviour**
- Instructions for installing are published in the repository for a self-hosted server and for a Cloudflare account.
- They state which servers are supported: a Linux machine with Docker, x64 or arm64, virtual or physical.
- They state which kinds of disk are supported and unsupported, from the R12 results of story 2.26.
- They state what is not supported (no Docker, Windows Server, Kubernetes) and that Cloudflare needs the Workers Paid plan.
- The self-hosted instructions cover: getting the image and Compose file, HTTPS by the bundled web server or by the operator's own proxy with the trusted-proxy setting, the live and backup folder settings and why the backup folder should be on another disk or machine, the deployment key file and keeping a copy off the server, where the one-time set-up code appears, and, for SMTP, the deployment setting of story 1.18 for a mail server on a private network or with a private certificate authority, and where the server log shows why a secure connection failed.
- The Cloudflare instructions cover: deploying from the organisation's own copy of the repository, the two storage buckets the deployment creates, the deployment key of story 1.5 and keeping it outside the Cloudflare account, and where the one-time set-up code appears.
- Both sets name the command that issues a one-time recovery code for a locked-out sole administrator (story 1.13 on Cloudflare, story 2.23 self-hosted), and the recovery procedure of story 8.7.

**Evidence to record**
- A person who has not seen the project follows the self-hosted instructions on a fresh server, using nothing else, and reaches a working sign-in page over HTTPS, completes the set-up step, and sees a plain HTTP request redirected or refused.
- The same person follows the Cloudflare instructions on a fresh Cloudflare account to the same result.
- Each place where that person got stuck or needed something not written is recorded, the instructions are corrected, and the corrected step is followed again successfully.
- Two installations made from the instructions share no users, projects or files: an account of one cannot sign in to the other, and a file address from one is refused by the other.

Notes: Left to later stories: naming the published image in place of one built from the repository (story 9.2); instructions for updating a self-hosted server (story 9.9) and a Cloudflare installation (story 9.14).

### Story 9.2: Signed public releases

As Kevin, I want a release produced the same way every time, so that installations can trust what they install.

Covers: FR-72 (publication), FR-66 (instructions name the release), AD-19.

**Core behaviour**
- Pushing a version tag starts a workflow that runs the test suite and builds the one Worker bundle and, from that bundle and the pinned runtime, the Docker image for x64 and arm64.
- The workflow runs the self-hosted smoke suite of story 2.24 against the image it built.
- The workflow signs the bundle and the image and publishes a release with its version number and notes.
- The image is published to GitHub's container registry under the same version.
- Verifying a published bundle or image against this repository's release workflow succeeds.
- Each release states the data-format version it needs, the runtime version it pins, and whether it changes a Durable Object class.
- The installation instructions of story 9.1 name the published image and release.
- The workflow can also publish to a test channel, marked by a tag prefix and signed by the same workflow; an installation offers and installs test-channel releases only when configured for that channel.

- Each release keeps the route declarations of every route a token may call; a build whose declarations remove or rename a field, narrow a type or add a required input under `/api/v1/` compared with the previous release fails, as does one that removes, renames or changes the inputs of an MCP tool generated from them. (CG-08 · reading)
**Refusals and edge cases**
- If the tests or the smoke suite fail, nothing is signed or published.
- The same verification fails on a build made any other way, and on a published file altered by one byte.

**Evidence to record**
- A fresh self-hosted install from the published image reaches the sign-in page.
- The test channel holds fixture releases N, N+1 and N+2, each adding a data conversion, and deliberately broken variants for the failure tests, all signed by the release workflow.
- Before the repository is made public for the first release (K15), its history is searched for secrets and private files and the result is recorded.

Notes: Signing is keyless (K14).

### Story 9.3: The update record and one version at a time

As an administrator, I want the server to keep one record of an update under way and let only one version act on our data, so that old and new code never both change it and an update can always be finished or undone.

Covers: NFR-8, FR-72, FR-21, AD-12, AD-17, AD-20.

**Core behaviour**
- The update record is a table of its own inside the installation object, in a layout every released version reads. It holds the attempt identifier, the version before and the version being installed, how to reach the version before (its image digest or its Cloudflare version), where the pre-update backup is, a state, a step number, the time at which changes stop, when the version being installed first arrived, and the update's step entries.
- The states are stopping, prepared, installing and returning. Every change of state takes the next number from a step counter kept beside the record, which is never reset, so a new attempt starts above every step number already issued.
- Stopping is written when an administrator starts an update. The time at which changes stop is set when the users' warning begins, and from that time every object refuses changes.
- While the record is stopping, during the warning or the backup, an administrator can cancel, which removes the record and accepts changes again.
- Prepared follows only when the complete pre-update backup has succeeded. A failed backup removes the record and changes are accepted again; a backup interrupted by a restart resumes as a job.
- Installing is set in one step, in which the installation, asked whether an attempt stands, answers yes only if a prepared record exists whose identifier and version being installed both match the question.
- Asked again for the same attempt while the record is installing and before the version being installed has arrived, the installation gives the same yes and returns the way back it stored at the first yes, ignoring any new one.
- A prepared record can be withdrawn, which removes it and accepts changes again at once. An installing record cannot be withdrawn.
- While a record exists, the entry code passes its state and step number with every call.
- Only one version acts: the version before while the record is stopping, prepared or returning, and the version being installed while it is installing. Entry code of the other version answers "updating", and an object of the other version refuses and stops itself as in story 1.1.
- The version before may end an installing attempt in two ways only, and both only set the record to returning: its arrival deadline, while the version being installed has not arrived, and an authenticated request to return for that attempt.
- A read of the record's state is the first call marked version-independent under story 1.1: the installation object answers it from either version, and a test calls it with another version and finds the same start identifier afterwards.
- Entry code that finds a record it may not act on answers "updating" on a public notice that needs no sign-in. When the deployed version may not act in the record's current state, the notice gives the steps to deploy the version that may.
- The calls that ask whether an attempt stands, read its state, report arrival, report a refused signature and ask for a return carry the update secret. They are a fourth kind of route, checked by the access gate, and their log entries name the update workflow or the updater as the actor, with the attempt identifier.
- On Cloudflare the installation creates the update secret on first use, keeps it encrypted as the settings secrets of story 1.15 are, and shows it once to an administrator to copy into the organisation's repository; an administrator can replace it. Self-hosted, the update secret is the updater's shared secret.
- The update's step entries are kept in the record's table and copied into the activity log when the attempt ends.
- Beside the step counter the installation keeps every attempt's outcome: succeeded, returned or withdrawn. A question about an attempt whose record has gone is answered with that outcome.

**Refusals and edge cases**
- From the time changes stop until the record is removed, the only writes accepted are to the record, its counter and the attempt outcomes, to each object's update bookkeeping, the pre-update backup's own job, progress, catalogue and file writes, conversions and restores, the update's step entries, the health check's test save, and the ending of a session.
- A second update is refused while any record exists.
- While a record exists, idle time does not count towards a session's expiry.
- A session ended while a record exists is noted in the update bookkeeping and ended again after any restore of the installation's data.
- A prepared record not followed by a yes within 30 minutes is withdrawn by the installation itself, and the attempt is logged as "no result". (CF-41 · value)
- In the step that sets installing, the installation object sets an arrival deadline 10 minutes after the yes. If it passes before the version being installed has reached the installation object, by a call or by an alarm, the installation, still running the version before, sets the record to returning itself. (CF-40 · value)
- After arrival, the installation keeps its own deadline equal to the time limit after the yes, and sets the record to returning itself when it passes. (CF-42 · value)
- A stopping record whose backup has not finished within that same time limit is removed and changes are accepted again; a returning record that has not finished within it shows the failed-return warning. (CF-42 · value)
- Each object keeps the highest step number it has acted under, and the time it last stopped itself, in an update-bookkeeping table that no conversion touches and no restore replaces.
- The installation object's schedule of due times, from story 1.1, gains the arrival deadline, the update steps and the time limits. Every due time an update sets carries its attempt and step number, does nothing when they no longer match the record, and is removed when the record changes state; the schedule is kept apart from restored data.
- Alarm-driven work does nothing while a record exists, except the update's own backup, conversion and return steps run by the version allowed to act, and the arrival deadline run by the version before. Work that cannot read the record treats it as present and only sets its alarm again.
- A call to an update function without the update secret is refused and logged; a test shows that the attempt identifier alone is refused.
- Routes that set an update record directly exist only in test builds, and a test fails if a release bundle has one.
- A command in release builds, authenticated by the update secret and the deployment key, ends a stuck installing or returning record once the administrator has recovered by hand as the failed-return warning describes, and logs it.
- The prepared time limit, and the removal of a stopping record, run under either version, because they touch only the record.
- No restore replaces the update record or its counter: a test restores the installation's data from a backup taken before a record existed and then reads the record and the counter intact.
- An object running the version being installed converts nothing unless the record is installing; with no record it refuses older data as in story 1.1.
- A server that finds data newer than itself and no record refuses to open it, and its explanation names both versions.

**Access and restore**
- A revision restore leaves the update record, its counter, the attempt outcomes and every object's update bookkeeping unchanged.

Notes: In this story the record and the two versions are set up by tests. The design is K20 with its refinements K21, both confirmed by Kevin, and the additions K22 (AD-20). It replaces the pending-update marker and its hold of earlier drafts. Left to later stories: conversions, the return and the health check (story 9.4); writing and ending the record in a real update (story 9.7 and story 9.10 self-hosted, story 9.12 and story 9.13 on Cloudflare). That sign-in is not offered during an update is in story 9.8.

### Story 9.4: Data conversions, the health check and the way back to backed-up data

As an administrator, I want stored data converted safely when a new version needs a different shape, and put back by the server itself if the update fails, so that an update never leaves projects unreadable, half converted or lost.

Covers: NFR-8, FR-72 (any earlier version to the latest; return), AD-3, AD-20.

**Core behaviour**
- The server carries every conversion since the first release: data at any earlier data-format version converts to the current one in one update, by applying each conversion in order.
- A test for each earlier data-format version compares the converted result with expected records.
- Each object converts its own data: a project room, or the installation object, records the new data-format version in the same transaction of its own store as the conversion's last write.
- An object converts only when it runs the version being installed and is called, or runs its own alarm-driven update step, while the update record is installing; no conversion spans two objects.
- A conversion too large for one transaction builds its result in side tables over several steps and switches to them in one transaction, so the live tables are never part-converted.
- The installation object drives the conversion: it converts its own data, then calls every project in the catalogue in turn in alarm-driven steps, so that projects nobody opens are converted too, and reports the result for each.
- Projects recorded as not recovered are skipped and listed in the result.
- The installation offers a health check: the sign-in route answers through the version being installed, naming that version, in a check mode that writes no session; the first active project opens or, with none, a health-check project room that holds no user data; and a test save to a health-check record is acknowledged.
- An update succeeds only when every project and the installation's own data have converted and the health check has passed. The installation object then, in one transaction of its store, copies the step entries into the activity log, records the outcome, removes the record and accepts changes again.
- An object running the version before, called while the record is returning, restores its own records from the pre-update backup if its data is in the newer format, and does nothing if it is not.
- A restore is built in side tables over as many steps as it needs and switched in one transaction, which also sets the data-format version back.
- The installation object drives the return: it restores its own data, calls every project and the health-check room in turn, and then, in one transaction, copies the step entries and the failed attempt into the activity log, records the outcome, removes the record and accepts changes again.
- A project restore copy not yet made current, or an imported project, whose data is at an older data-format version converts its own data with the same conversions before it is opened, outside any update record, and is never live while it converts.

**Refusals and edge cases**
- A conversion made to fail part-way leaves that project's live records exactly as they were, at their earlier version.
- If the conversion of any project or of the installation's data fails, the conversion is reported as failed, names the project, and no project is opened for normal use.
- An interrupted conversion or restore that uses side tables starts its steps again and ends with the same result.
- A project that refuses a call because of a version difference is called again after 35 seconds, up to 3 times, before it counts as failed. (CF-43 · value)
- A call carrying a lower step number than the object has acted under is refused before any work.
- A conversion or restore switch checks in the same transaction that the record's step number is still the highest the object has seen, and a call carrying a higher one makes the object discard side tables built under a lower one.
- A test runs a return, then a conversion under a higher step number, then a second return: every project and the installation's own data end at the pre-update backup, none part-restored or part-converted.
- A test runs two update attempts in a row and finds the second attempt's conversions accepted by every object.
- A return removes and overwrites no file.
- If the return cannot be completed, the installation keeps refusing changes, says plainly that the return did not complete, shows the manual steps, and never reports success.
- An update cannot start while a project restore copy has not been made current, and Update says why.
- No conversion of the installation's data changes the update record, its counter or any update bookkeeping, and a test fails if one does.
- The test suite fails if a data-format version has no conversion and conversion test.
- A test compares the Durable Object classes in the deployment configuration with the two fixed in story 1.1 and fails if a class is added, renamed or removed, unless the release is marked as changing a class.

**Access and restore**
- A revision restore leaves the health-check record and the health-check project room unchanged; neither holds user data.

Notes: Before a second release exists, these criteria are exercised with test conversions and an update record set by a test build, on the runner of story 1.1. The pre-update backup is the "before an update" backup of story 8.1.

### Story 9.5: Experiment R14: a new runtime reads the previous release's data

As Kevin, I want every release checked against data written by the one before, so that a runtime upgrade that cannot read existing data is never published.

Covers: NFR-8, AD-20, experiment R14.

**Core behaviour**
- The release workflow of story 9.2 starts the new image, with its pinned runtime, against a data folder written by the previous release, and confirms that it opens the data, refuses it as not yet updated, fires an alarm set under the previous release, and reads the installation's own data.
- A test build made from the same commit and runtime converts the same data under an update record set by a test, and the result matches the expected records.

**Refusals and edge cases**
- A release that fails this check is not published.

**Evidence to record**
- Before a second release exists, the check is run with a data folder written by an earlier tagged build and a test conversion, and the result is recorded.

### Story 9.6: Installed version and update check

As an administrator, I want to see which version is installed and whether a newer one exists, so that I can decide when to update.

Covers: FR-72 (version, check), FR-71, AD-21. Screens: S-35, S-28.

**Core behaviour**
- Administrators see the installed version, when it was installed and when updates were last checked, on Software (S-35).
- The installation reads the public release list at least once every 24 hours while running, and when an administrator presses Check now.
- With a newer release published, administrators see its version and release notes on S-35.
- With a newer release published, administrators see an update-available dot on Administration in the account menu, on every page including the Projects list (S-28).
- An administrator can turn the check off and on.
- With the check turned off, nothing contacts the release list and the installed version is still shown.
- Turning the check on or off appears in the activity log.

**Refusals and edge cases**
- A release is offered only if its version is higher than the installed one. (CF-25 · reading)
- An installed version that is newer than, or absent from, the list shows "Up to date" with no offer to install an older release. (CF-25 · reading)
- A check that fails or reads a malformed list shows the time and reason of the failure, keeps the result of the last successful check, and raises no update-available dot of its own. (CF-26 · reading)

**Limits and values**
- With the check turned off, S-35 reads "Update checks are off".

**Access and restore**
- A standard user sees no version notice, no dot and no Update control, and a direct call to the software functions is refused.
- A project revision restore leaves the update-check setting unchanged.

**Evidence to record**
- A test captures the check request and finds only the public address and standard headers: no project data, no user data and nothing identifying the installation.

Notes: Left to later stories: the Update control (story 9.7 self-hosted, story 9.13 on Cloudflare); the manual steps shown beside "Update checks are off" (story 9.9 and story 9.14).

### Story 9.7: Update a self-hosted installation with one action

As an administrator of a self-hosted installation, I want to install a new release with one action, so that updating needs no command line and loses no saved work.

Covers: FR-72, NFR-8, FR-71, AD-20, AD-21. Screens: S-35.

**Core behaviour**
- With a newer release available, S-35 shows what the update will do in order, an estimate of how long changes will be stopped, taken from the stored size and the duration of the last backup, and Update now; nothing installs without that action.
- The Compose file gains the updater container, the only part allowed to start and stop containers.
- The application reaches the updater over a private connection protected by a shared secret, which is also the update secret of story 9.3.
- On Update now, the installation writes the update record as stopping and gives the updater the attempt identifier and the release. The updater verifies the image's signature and pulls the image by its digest before any user is warned. The stop time is set only when the updater has reported the image verified and pulled; if the updater cannot be reached, the record is removed and the refusal is shown before any warning.
- Then: signed-in users are warned; at the stop time changes of every kind stop; a complete backup of every project and of the installation's data is taken as the "before an update" backup of story 8.1; the record becomes prepared; the updater asks whether the attempt stands, giving its identifier, the version and the running image's digest, which the installation stores as the way back while setting the record to installing; the updater removes the old container and then starts the new one by digest; under the new version the installation converts every project and its own data and runs the health check of story 9.4; the updater waits until the installation reports success or failure.
- The administrator's S-35 shows the progress list (signature checked, backup taken, new version installed, data converted, checked), each step done, in progress or waiting.
- After a successful update S-35 shows the new version and a link to its notes, and every project opens with its data intact.
- An installation two releases behind updates directly to the latest in one update, with its data converted.
- The update, each step and its outcome are recorded in the activity log with the administrator who started it.

**Refusals and edge cases**
- The updater refuses a version that is not from the configured repository and channel.
- A release with a bad signature, or an image that cannot be pulled, is refused before users are warned: the record is removed, nothing is installed, and the refusal is shown and logged.
- The updater starts exactly the digest it verified; a tag pointed elsewhere after the check is not used.
- If its yes is refused, or no record exists for its attempt, the updater ends without touching any container and discards the attempt; it waits for a yes no longer than the prepared time limit of story 9.3.
- The application container has no restart policy that could start a replaced image again.
- If the backup fails, the record is removed, nothing is installed, changes are accepted again, and the failure is shown and logged.
- While an update, a backup or a restore job runs, Update, Back up now and Restore are disabled with the reason, and a second administrator's request to update is refused by the server. (CF-27 · reading)
- A daily backup that falls due during an update does not start until the update has finished. (CF-27 · reading)

**Limits and values**
- The updater's time limit after the yes is three times the estimate shown on S-35, at least 30 minutes and at most 5 hours. (CF-42 · value)

**Access and restore**
- Only an administrator can use Update now; a standard user's direct call is refused.

Notes: Left to later stories: what signed-in users and open pages see (story 9.8); the command line and the update instructions (story 9.9); a failure after installation has begun (story 9.10). The releases for "two releases behind" come from the test channel of story 9.2.

### Story 9.8: What people see while an update runs

As a designer, I want to be warned before an update and to keep my unsaved work through it, so that an update interrupts me without costing me anything.

Covers: FR-72, FR-21, NFR-2, NFR-8, AD-20, UX decision D13. Screens: S-35, S-26.

**Core behaviour**
- Signed-in users see a banner before saving stops.
- During the warning or the backup an administrator can cancel the update on S-35, which removes the update record, clears the banner and accepts changes again.
- While the update runs, every page shows a full-page "Updating" notice, which clears by itself when the update ends; an administrator's S-35 shows the progress list instead. (CF-45 · reading)
- A page that was open during the update still holds its unsaved edits afterwards and submits them.
- An edit answered "updating" stays unsaved and is sent again automatically when the update ends, as after a lost connection.
- A page that was warned shows the Updating notice while the server cannot be reached.

**Refusals and edge cases**
- No save, upload, administrative change or reviewer-link decision is acknowledged between the time changes stop and the end of the update or of its return.
- While changes are stopped, sign-in is not offered: the sign-in page shows the Updating notice. (CF-28 · reading)
- While changes are stopped, existing sessions stay valid, and idle time does not count towards their expiry.
- Signing out during an update ends the session.
- While changes are stopped, no activity-log entry other than the update's own is written.
- An edit the new version cannot accept stays listed as not saved with its content readable. (CF-29 · reading)
- After such an edit the page asks the user to reload and does not reload by itself. (CF-29 · reading)

**Limits and values**
- The banner appears two minutes before saving stops and reads "An update starts in 2 minutes. Your unsaved work will be kept on this page."
- An edit the new version cannot accept reads "not saved: this edit does not fit the updated version of Site Studio". (CF-46 · value)

**Evidence to record**
- A test that sends saves throughout an update finds every acknowledged one present afterwards.
- A test with a 15-minute session period across a 20-minute update finds the session still valid afterwards.

### Story 9.9: Self-hosted update from the command line, and the update instructions

As an administrator of a self-hosted installation, I want the same update available from a command line and written instructions for both ways, so that I can update when the interface is not the right tool.

Covers: FR-72, FR-66 (instructions), AD-21. Screens: S-35.

**Core behaviour**
- The steps of story 9.7 can be run from a command line on the server and produce the same result and the same activity-log entries.
- Published instructions for updating a self-hosted installation cover adding the updater container to an existing Compose file, Update now, the command-line equivalent and what users will see.
- With update checks turned off, S-35 on a self-hosted installation shows the command-line steps to update to a named release.

**Evidence to record**
- A person follows the instructions on a test server from one published release to the next, and each place they got stuck is recorded and corrected.

### Story 9.10: When a self-hosted update fails

As an administrator of a self-hosted installation, I want a failed update to put back the earlier version and its data and tell me so, so that a bad release never leaves us without a working system.

Covers: FR-72 (return), NFR-8, FR-71, AD-20, AD-21. Screens: S-35.

**Core behaviour**
- If installing, converting or the health check fails, or the time limit passes, the updater asks the installation to return, presenting the attempt identifier and the update secret. Once the installation confirms that the record is returning, the updater stops the new container and starts the earlier image by its recorded digest. The updater restores nothing itself.
- If the installation answers, by the record or by the attempt's recorded outcome, that the update has succeeded, the updater ends without starting the earlier image.
- If no container answers the request to return within 60 seconds, the updater stops the new container if it is still running, then starts the earlier image by its recorded digest and repeats the request, which the version before accepts while the record is installing; if that version finds the attempt recorded as succeeded, the updater stops the earlier container, waits for it to exit, and starts the new image again. (CF-47 · value)
- The earlier version restores what was converted, as in story 9.4, and reports that the data is back. The updater waits for that report.
- The updater then reports the outcome: S-35 shows which step failed and a plain statement that the earlier version and its data are running again.
- A conversion failure for any one project fails the update and returns the whole installation; no project is left at the new version.
- After a return, every save acknowledged before the update is present, and changes are accepted again.
- After a return, the activity log holds the update's step entries and the failed attempt.
- The published update instructions describe going back by hand after an update that passed its checks and was found broken later: install the earlier version and restore the pre-update backup from the command line, with the statement that changes made since the update are lost. (CF-30 · reading)

**Refusals and edge cases**
- If the return itself fails, S-35 and the sign-in page show a prominent warning that never reads as success.
- That warning states what condition the installation is in and shows the command-line steps to recover by hand.
- The updater records each step durably before starting it.
- After the server loses power or the updater is killed while the record is stopping, the backup resumes on restart; while the record is prepared, the updater asks on restart for the record to be withdrawn, changes are accepted again, and the attempt is logged as interrupted. (CF-31 · reading)
- After the server loses power or the updater is killed once the record is installing or returning, the updater decides on restart from its step log and the record: with the record returning, it stops the new container if it is still running and starts the earlier image; with the record installing and the new image started, it uses the new container if that is still running and otherwise starts the new image, and the update continues, returning only on failure, a refused start counting as one; with the new image never started, it starts the earlier image by its recorded digest, so that the earlier version is running when the passed arrival deadline returns the installation. (CF-31 · reading)
- If the updater stops after its yes and never swaps the image, the arrival deadline sets the record to returning and, with its data unchanged, the installation removes the record and accepts changes again.
- The installation is never left refusing changes with no update running.

**Evidence to record**
- The procedure for going back by hand is run once on a test server and works.

### Story 9.11: Experiment R11, self-hosted: break an update at every step

As Kevin, I want a self-hosted update broken at each step and the outcome recorded, so that the Update control is released only when every failure returns cleanly.

Covers: FR-72 (return), NFR-8, experiment R11.

**Core behaviour**
- On a test server an update is broken at each step in turn: the signature, an image that cannot be pulled, a cancel during the warning, the backup, the updater stopped during the backup, the updater stopped after its yes and before the swap, the image swap, the conversion of one project, each part of the health check, the time limit passing just as the update succeeds, the return, no container answering the request to return, a power loss during the return, a cancel during the backup, and a forced kill between each pair of steps.
- Two updates are run one after the other, and the second succeeds.

**Evidence to record**
- The observed outcome of each case is recorded and matches the criteria of story 9.7 and story 9.10.
- After each return, a user signed in before the update continues without signing in again, and a reviewer link issued before it still opens.
- On an installation at the acceptance size, how long changes stay stopped is measured for a successful update and for a return, split into backup, conversion and restore, and compared with the estimate shown on S-35.
- The time from the yes to the new container answering is measured, and the arrival deadline is confirmed to exceed it with margin.

Notes: R11's fallback is to hold back the release of the Update control until every step returns cleanly. The releases come from the test channel of story 9.2; any used as the version before are built from a commit that contains story 9.3 to story 9.10. The Cloudflare part of R11 is story 9.15.

### Story 9.12: The Cloudflare update workflow

As an administrator of a Cloudflare installation, I want our own deployment of a release to check it, install it and roll back by itself, so that updating on Cloudflare is as safe as on our own server.

Covers: FR-72, NFR-8, FR-71, AD-20, AD-21, experiments R10 and R11.

**Core behaviour**
- The organisation's copy of the repository contains an update workflow that is started with the name of the release to install and the identifier of the attempt it is started for.
- The update secret of story 9.3, copied by an administrator into the organisation's repository, is presented by the workflow on every call to the installation.
- The workflow, not the Worker, verifies the release's signature, and does so before it deploys anything.
- Immediately before deploying, the workflow notes the Cloudflare version now deployed and asks the installation whether its attempt still stands, presenting the identifier, the release and that version. The installation answers yes only for a prepared record with the same identifier and release, and in the same step sets it to installing and stores that version as the way back. (CF-32 · reading)
- With a yes, the workflow deploys the release in Cloudflare's `immediate` code-update mode, so that running Durable Objects are replaced at once.
- Under the new version the installation object converts every project and its own data and runs the health check of story 9.4. The workflow asks the installation for the state of the update until it reports success or failure, and treats "updating" and version refusals as not finished.
- On success the record is removed and S-35 shows the new version.
- If the conversion of any project or the health check fails, or the time limit passes, the workflow asks the installation to return. Once the installation confirms that the record is returning, the workflow redeploys the stored version with Cloudflare's rollback in `immediate` mode or, if the rollback cannot do that, deploys that release's bundle in `immediate` mode.
- The earlier version restores what was converted, as in story 9.4, removes the record, accepts changes again and records the failed attempt in the activity log.

**Refusals and edge cases**
- With a bad signature the workflow deploys nothing and reports the refusal to the installation with its identifier; the installation withdraws only a prepared record with that identifier and release, accepts changes again, and shows and logs the refusal.
- If no prepared record with the same identifier and release exists, the workflow deploys nothing and ends. (CF-32 · reading)
- A run started for a withdrawn attempt deploys nothing even when a newer record names the same release, because its identifier does not match.
- If the reply to its question is lost, the workflow asks again and receives the same yes and the way back stored at the first.
- If the installation answers, by the record or by the attempt's recorded outcome, that the update has succeeded, the workflow ends without a rollback.
- If the installation cannot be reached to confirm a return, the workflow redeploys the stored version and repeats the request to return, which the version before accepts while the record is installing; if that version finds the attempt recorded as succeeded, the workflow deploys the release again.
- If, after deploying, the workflow finds its attempt returning or recorded as returned, it redeploys the stored version itself; an attempt recorded as succeeded is left alone.
- With its class-change input, the workflow never asks for a return and never redeploys an earlier version; the record carries a class-change flag under which the installation never sets returning by itself, and on a failure the public notice shows the recovery from the pre-update backup.
- If the run stops after its yes and before deploying, the arrival deadline makes the installation, still running the version before, set the record to returning, remove it and accept changes again.
- A deployment of the new version that lands after that finds no record and data in an older format, refuses requests as in story 1.1, and its refusal shows the steps to redeploy the previous release.
- If the run deploys the new version and then stops, the installation object completes the conversions and the health check by itself under the new version, an alarm under the new version counting as its arrival, and removes the record on success.
- If that conversion or health check fails with no run left to roll back, the installation sets the record to returning, and the public "updating" notice of story 9.3 gives the steps to redeploy the previous release, after which the earlier version completes the return.
- If the rollback or the restore cannot be completed, the installation shows the warning of story 9.10 with Cloudflare deployment steps to recover by hand, and never reports success.

**Limits and values**
- The workflow's time limit runs from the yes, includes the deployment, and is three times the estimate shown on S-35, at least 30 minutes and at most 5 hours. (CF-42 · value)

**Evidence to record**
- On a deployed Cloudflare test installation, the redeployment rule of story 1.2 and story 1.5 holds for a deployment by the workflow: after an update a user with two-step verification signs in with a current code, and a settings secret saved before the update still works.
- All criteria here are tested on a deployed Cloudflare test installation, with runs started by hand in GitHub and the record set by a test build.

Notes: Experiment R10, run on 2026-11-18, found that a deploy hook cannot name a version, so AD-21 chose the workflow run; it also found that Cloudflare's rollback never undoes data changes. The first part of R11 found that a deployment in `immediate` mode replaced a busy object in about 2 seconds; the second part found that a rollback accepts that mode too, and that a rollback restores the Worker secrets of the version it returns to. Left to later stories: starting the run from the interface (story 9.13); manual steps and releases that change a Durable Object class (story 9.14).

### Story 9.13: Update a Cloudflare installation with one action

As an administrator of a Cloudflare installation, I want Update to start our own deployment of the new release, so that updating needs one action and no visit to GitHub.

Covers: FR-72, NFR-8, FR-70 (Settings), FR-71, AD-17, AD-20, AD-21, experiment R16. Screens: S-35, S-33.

**Core behaviour**
- An administrator stores a GitHub token for the organisation's copy of the repository in Settings.
- The token is kept as the other settings secrets of story 1.15 are: encrypted and showing only its last 4 characters.
- Saving or replacing the token is logged without its value.
- A recovery without the deployment key (story 8.8) clears the token with the other stored secrets.
- With a newer release and a stored token, S-35 shows what the update will do in order, an estimate of how long changes will be stopped, taken from the stored size and the duration of the last backup, and Update now.
- Before anything is stopped, Update reads the update workflow in the organisation's copy with the token, confirming that the token reaches it, and checks that the named release exists in the public release list.
- After those checks the installation writes the update record as stopping, warns signed-in users as in story 9.8, stops accepting changes of every kind at the stop time, takes the complete "before an update" backup, makes the record prepared once that backup has succeeded, and, after noting in the record that the run is being started, starts one run of the workflow of story 9.12 through GitHub, naming the release and the record's attempt identifier; no second run is ever started for that attempt.
- The release's signature is therefore verified after users are warned, changes stopped and the backup taken; S-35 lists the steps in that order and states that this differs from a self-hosted update, which verifies first.
- Every attempt and its outcome is recorded in the activity log with the administrator who started it.

**Refusals and edge cases**
- If either check before stopping fails, the reason is shown, no user is warned and changes continue to be accepted.
- If the backup fails, the record is removed, nothing is deployed, changes are accepted again, and the attempt is shown and logged.
- If GitHub refuses the request to start the run with a client error, the run is confirmed not started: nothing is deployed, the prepared record is withdrawn, changes are accepted again, and the attempt is shown and logged.
- If GitHub answers with a server error, does not answer in time, or the answer is lost, the installation does not treat a run missing from GitHub's list as proof that none exists; it withdraws the prepared record, which succeeds only while the record is still prepared.
- Once the record is withdrawn, no run for this attempt can deploy, because the check of story 9.12 answers yes only to a prepared record with the same identifier; changes are accepted again, and the attempt is shown and logged as "start not confirmed".
- If the record is already installing when the installation tries to withdraw it, a run did start, and the attempt continues as a running update.
- While an update runs a second request to update is refused, and Update is disabled with the reason while a backup or restore job is running.
- When a prepared record is withdrawn for having no yes in time, as story 9.3 states, the installation also asks GitHub to cancel the run, and the attempt is shown and logged as "no result".
- A run for a withdrawn attempt fails the check of story 9.12 and stops without deploying, whether or not GitHub cancelled it.
- If the record is installing, changes stay stopped until the update or the return has completed, whatever the time; a version being installed that never arrives is returned from as in story 9.12.
- If the record is installing and neither the update nor the return can be confirmed complete, the installation stays stopped for changes and shows the warning of story 9.10 with the Cloudflare steps to recover by hand.

**Access and restore**
- A project revision restore leaves the GitHub token unchanged; it is an installation setting.

**Evidence to record**
- Experiment R16: a fine-grained token with only the Actions permission is tried; the narrowest permission that starts the run is recorded, or the classic `repo` scope is recorded if none narrower works.
- On a deployed Cloudflare test installation, a test that sends saves throughout an update finds every acknowledged one present afterwards, and an open page submits its unsaved edits.
- On a test Cloudflare account, an installation two releases behind updates directly to the latest with its data converted.

### Story 9.14: Updating on Cloudflare by hand, and the update instructions

As an administrator of a Cloudflare installation, I want exact steps for updating without one-step deployment and clear warning when a release cannot be returned from, so that I can always update and always know the way back.

Covers: FR-72 (manual steps), FR-66 (instructions), NFR-7, AD-20, AD-21. Screens: S-35.

**Core behaviour**
- Without a stored token, S-35 shows numbered steps to run the workflow by hand in place of Update now, including the backup first and the way back.
- The first manual step is "Prepare for a manual update" on S-35, which writes the update record as stopping, warns users, stops changes, takes the backup and makes the record prepared exactly as Update now does. (CF-34 · reading)
- After preparing, S-35 shows the attempt identifier to enter with the release name when starting the run by hand.
- For a release marked as changing a Durable Object class, S-35 says before starting that no automatic return is available and shows the manual procedure in place of Update now.
- That procedure is: prepare as above; start the workflow by hand with its class-change input; the update then installs, converts and runs the health check as any other, and the record carries the class-change flag of story 9.12, so no automatic return is attempted.
- If such an update fails, the installation stays stopped for changes and S-35 and the sign-in page give the way back: recover the installation from the pre-update backup into a fresh deployment of the earlier version, as story 8.7 describes.
- With update checks turned off, S-35 shows the manual steps with a place to name the release.
- Published instructions for updating on Cloudflare cover keeping the organisation's copy of the repository, copying the update secret shown on S-35 into that copy's secrets, turning off any automatic deployment of that copy, creating the token with the permission recorded by R16, storing it in Settings to set up one-step deployment, the manual steps, and the difference in order from a self-hosted update.

**Refusals and edge cases**
- A manual update prepared and not followed by a run can be cancelled by the administrator: the prepared record is withdrawn and changes are accepted again at once, and a run started by hand for that preparation, queued or later, stops without deploying.
- A manual preparation not followed by a yes in time is withdrawn by the installation, as story 9.3 states.
- A run started for a cancelled preparation deploys nothing after a new preparation for the same release, because the new record carries a new attempt identifier.

**Evidence to record**
- A person follows the manual steps on a test Cloudflare account, and both an update and a return work.
- A person follows the published instructions on a test Cloudflare account from one published release to the next, and each place they got stuck is recorded and corrected.

### Story 9.15: Experiment R11, Cloudflare: break an update at every step

As Kevin, I want a Cloudflare update broken at each step and the outcome recorded, so that the Update control is released only when every failure returns cleanly.

Covers: FR-72 (return), NFR-8, AD-20, experiment R11.

**Core behaviour**
- On a test Cloudflare account an update is broken at each step in turn: a bad token, a missing release, a cancel during the warning, the backup, a run that cannot be started, a prepared record with no yes in time, a run that stops after its yes and before deploying, a run that deploys the new version and then stops with the conversions then passing and then failing, a deployment that lands after the installation has returned by itself, a deployment that lands while the record is returning, a third version deployed during an update, a bad signature, the conversion of one project, the health check, the time limit passing just as the update succeeds, and the restore.
- Two updates are run one after the other, and the second succeeds.

**Refusals and edge cases**
- The answer to the start request is made to be lost while GitHub has accepted the run, in both orders: with the withdrawal reaching the installation before the run's check, and with the run's check reaching it first.
- In the first order the run deploys nothing and changes are accepted again; in the second the attempt continues as a running update and ends as an update or a return.
- With objects kept busy across a deployment and a return, the time each object takes to change version is recorded, and no request is found on which old and new code both acted.
- No object is found to stop itself more often than story 1.1 allows, including while a deployment is still reaching some regions.

**Evidence to record**
- The observed outcome of each case is recorded and matches the criteria of story 9.12 and story 9.13.
- Cloudflare's rollback command is confirmed, with the real update code, to redeploy the named version in `immediate` mode, as the second part of R11 showed with a probe.
- After a rollback, and after a redeployment of a bundle, the update secret and the deployment key are unchanged and the version before accepts the workflow's request to return.
- The time from the yes to the arrival of the new version is measured, and the arrival deadline is confirmed to exceed it with margin.
- After each return, a user signed in before the update continues without signing in again, and a reviewer link issued before it still opens.
- People in at least two regions use the installation during an update and during a return, and what each of them sees is recorded.
- On an installation at the acceptance size, how long changes stay stopped is measured for a successful update and for a return, and compared with the estimate shown on S-35.
- A release that changes a Durable Object class is installed on a test account by the manual procedure of story 9.14, its failure is followed by the way back that story gives, and the result is recorded, including whether Cloudflare refuses a rollback across it.

Notes: R11's fallback is to hold back the release of the Update control until every step returns cleanly. The releases come from the test channel of story 9.2; any used as the version before are built from a commit that contains story 9.3 to story 9.13. A first part was run on 2026-11-19 without the update code: on Cloudflare a deployment or rollback switches the entry code in about half a second and leaves data untouched, Durable Objects in use keep running the previous version for about five minutes when busy, an object asked to stop itself restarted on the new version at once (shown for one object, not yet under load), and a deployment in `immediate` mode replaced a busy object in about 2 seconds. A second part, run on 2026-11-19, showed that a rollback accepts `immediate` mode (a busy object switched about 12 seconds after the command returned) and restores the secrets of the version it returns to. The design that answers this is K20 with its refinements K21 (AD-20).

## Epic 10: Acceptance

**Outcome.** The proof of concept is measured against the PRD's acceptance profile on Cloudflare, and then on a self-hosted installation. Passing story 10.2 to story 10.7 is enough to accept the proof of concept on Cloudflare; a self-hosted installation is not described as supported until story 10.8 and story 10.9 pass.

**Depends on.** Epics 1 to 9 complete. Nothing later.

**Why here.** SM-7, agents doing real work, is shown in Epic 11 and is not part of this acceptance (PRD amendment 1.3). The PRD's success measures SM-1 to SM-6 can only be shown by one run across everything built, so this verification milestone comes last; it has no story for fixing what it finds, and a miss goes back to the story that owns the behaviour.

### Story 10.1: Acceptance fixtures and the workload manifest

As Kevin, the product owner, I want the test workload written down and confirmed before anything is measured, so that results cannot be made to pass by changing the fixture afterwards.

Covers: acceptance profile, SM-5, NFR-4 (reference calculations).

**Core behaviour**
- The fixture script of story 2.11 is extended to build the small functional project.
- The small functional project and the larger, acceptance-size project of story 2.11 are loaded on the Cloudflare test installation.
- The larger project has about 10 buildings, 600 devices including 150 physical cameras, 20 to 30 plans, and about 60 cameras on the busiest plan.
- The fixtures contain what the functional coverage needs: several floors, cameras and other equipment, an obstruction, a targeted zone, routes, costs and capacity, survey evidence, an existing-site survey with unknown details, retained equipment and cable, and a planned replacement recorded as actual work.
- Where the script does not yet produce one of those, this story extends it.
- A written manifest for each of the two fixtures records the plans, boundaries and geometry, zones, physical cameras against analytical views and configured streams, connections, evidence and history volumes, stored size, and the hardware, browsers and network conditions of the test.
- The manifest declares the parser, decoded-image and page-complexity guards and the temporary space the jobs use.
- Independent reference values are produced outside the application's code, by hand or by a separate script, for a stated set of optical, field-of-view and DORI cases and zone qualifying-area cases, and for counts, units, rounding and allowance arithmetic in the schedules and estimate.
- Kevin confirms in writing that the larger fixture is representative, and both manifests are fixed at that point, before any acceptance run.

**Refusals and edge cases**
- A change to a fixture after the confirmation is recorded as a new manifest version, and the affected runs are repeated. (CF-35 · reading)
- Timings recorded by earlier stories against the fixture are development measurements and are not quoted as acceptance evidence.

**Limits and values**
- The small functional project has about 50 devices. (CF-36 · value)

**Evidence to record**
- The reference cases, the method and the values are recorded with the manifest.

### Story 10.2: Measure the timed operations on Cloudflare, with one user and two

As Kevin, the product owner, I want every timed target measured at full size on Cloudflare, so that acceptance rests on recorded results.

Covers: NFR-4, SM-5.

**Core behaviour**
- Each timed operation in the PRD's performance table is run on the Cloudflare installation against the larger fixture in batches of 20.
- The runs are made with one user, and repeated with two users working at once.
- The two-user runs include editing conflicts on the same item and a review decision made while the other user edits.
- Each conflict keeps the pending input and overwrites neither user's work.
- Property-wide schedules, cost and capacity are shown to include all 600 devices, with physical cameras counted separately from views and streams.
- Incomplete analysis is marked Updating in every run observed.

**Refusals and edge cases**
- Every miss is reported as a miss with its figures.
- No fixture is simplified, and no camera or zone omitted, to pass.

**Limits and values**
- At least 19 of the 20 trials in each batch meet the target.
- Selection, button and direct-edit feedback: within 250 ms.
- Search and filter of the 600-device inventory: within 1 second.
- Save acknowledgement for a single item: within 2 seconds.
- A shared update visible on another connected client: within 5 seconds.
- Initial project open: within 10 seconds.
- Switch to another saved plan in an open project: within 5 seconds.
- Busiest-plan analysis after a committed edit: within 10 seconds.
- While an import, an analysis or an export runs, selection and button feedback still meets its 250 ms target in at least 19 of 20 trials. (CF-37 · reading)

**Evidence to record**
- All results, conditions and outliers are kept.
- Every trial is checked to have preserved data, access and calculation integrity, and the check is recorded.

### Story 10.3: Check accuracy and arithmetic against the reference values

As Kevin, the product owner, I want the analysis and the schedule arithmetic compared with independent values, so that the numbers shown can be trusted.

Covers: NFR-4, SM-5.

**Core behaviour**
- Optical, field-of-view and DORI results are compared with the reference values of story 10.1.
- Zone qualifying-area results are compared with the reference values of story 10.1.
- A near-target zone result is shown as uncertain or refined, never as a confident Target met, in each reference case chosen for it.
- Counts, units, rounding and allowance arithmetic in the schedules and estimate match the reference values of story 10.1 exactly.

**Refusals and edge cases**
- Every result outside its tolerance is reported as a miss with its figures.

**Limits and values**
- Optical, field-of-view and DORI results agree within 1%.
- Zone qualifying-area results agree within 2 percentage points, at sampling no coarser than 1 m.

### Story 10.4: Measure the long jobs and a full-size recovery on Cloudflare

As Kevin, the product owner, I want every long job and a whole recovery timed at full size on Cloudflare, so that the file and recovery targets are accepted on recorded results.

Covers: FR-34 (recovery targets), NFR-4, SM-5.

**Core behaviour**
- Each long file job is run three times at full size and meets its bound each time, with no correctness or integrity exception.
- The isolated recovery of story 8.7 is run at full size on Cloudflare.

**Refusals and edge cases**
- Every miss is reported as a miss with its figures.

**Limits and values**
- Selected PDF-page preview: within 30 seconds.
- Photo preview and processing: within 10 seconds.
- Inventory preview: within 30 seconds.
- Confirmed inventory import: within 30 seconds.
- A complete retained design or closeout edition: within 5 minutes.
- Portable backup creation: within 10 minutes.
- Portable backup validation and restoration after upload: within 15 minutes.
- The recovery point used is no more than 24 hours old.
- The recovery reaches a project that opens and acknowledges a save within 60 minutes.

**Evidence to record**
- Transfer times are recorded separately from processing times.
- The recovery's elapsed time and the preparation assumed are recorded.

### Story 10.5: Walk the journeys and show history and outcomes are kept honest

As Kevin, the product owner, I want the user journeys walked end to end on Cloudflare, so that the proof of concept is accepted on what people can actually do.

Covers: SM-1, SM-2, SM-3.

**Core behaviour**
- UJ-1 to UJ-5 are completed on the Cloudflare installation.
- The journeys include the solo path with every approval bypassed.
- No file exchange is used as the way of working together.
- In UJ-5 the administrator reviews the activity log, filters it by person, exports it, and confirms on the Backups screen that backups are succeeding.
- No fixed record changes across a field move, a checklist edit, a retest, a replacement, an archive, a revision restore and a reopening.
- After those actions the earlier package downloads byte for byte and earlier evidence is unchanged.
- Bypass, not installed, Fail, Not tested, Not applicable, closing with outstanding items and reopening each show a distinct, correct status on screen.
- Each of those shows the same distinct status in the package.

**Evidence to record**
- Each journey's steps and any step that could not be completed are recorded.

### Story 10.6: Show the tasks on real devices and browsers

As Kevin, the product owner, I want the desktop and field tasks shown on the real browsers and devices, so that cross-device use is accepted on hardware people carry.

Covers: NFR-3, SM-4.

**Core behaviour**
- The desktop workflow and the administrator screens are shown on a Windows laptop in Chrome and in Edge.
- The field tasks are shown on a real iPhone and a real iPad in Safari and on an Android phone in Chrome.
- The field tasks shown are: equipment lookup, current plan against the issued reference, checklist inspection, verifying and placing imported devices, notes, photos and results, save and conflict handling, and permitted review actions.
- Each field task leaves saved state that is still there after a reload.
- Signing in, two-step verification, accepting an invitation and changing a password are shown on each environment.
- Labels and error messages, keyboard access, visible focus, 200% zoom, touch alternatives to dragging and non-colour status are checked on both fixtures.
- A change saved on one device appears on another.
- Edits to separate items and evidence additions by two people both remain.
- A same-item conflict keeps the pending input.
- Guarded undo removes nobody else's work.
- A failed save is visible with its input still on the page.

**Evidence to record**
- Hardware, operating system and browser versions and the test conditions are recorded.
- The result of each accessibility check is recorded for both fixtures.

### Story 10.7: Show installing and updating on Cloudflare

As Kevin, the product owner, I want the Cloudflare parts of the installation and update Checks shown on a fresh account, so that the proof of concept can be accepted on Cloudflare.

Covers: FR-66 and FR-72 (Cloudflare parts of their Checks).

**Core behaviour**
- FR-66: following only the published instructions, a fresh Cloudflare account reaches a working sign-in page over HTTPS.
- FR-66: a plain HTTP request is redirected or refused.
- FR-66: a person without the set-up code cannot complete set-up.
- FR-66: set-up names the installation, creates one administrator and cannot be run again.
- FR-66: a second installation shares no users, projects or files with the first.
- FR-72: an administrator sees a newer published release and its notes, while a standard user sees no Update control.
- FR-72: Update with one-step deployment installs the release with data intact, and open pages keep their unsaved edits.
- FR-72: users are warned before saving stops, and no save is acknowledged between the backup and the new version starting.
- FR-72: an installation two releases behind updates directly to the latest.
- FR-72: with the check turned off nothing contacts the release list, and the installed version is still shown.
- FR-72: without one-step deployment the manual steps are displayed and work.

**Refusals and edge cases**
- FR-72: a release with a bad signature is refused.
- FR-72: an update made to fail part-way returns to the earlier version with its data, and the failed attempt is in the activity log afterwards.
- FR-72: a return made to fail is reported as failed, never as success.

### Story 10.8: Repeat the acceptance run on a self-hosted installation

As Kevin, the product owner, I want the same acceptance run passed on a self-hosted installation, so that self-hosting can be described as supported.

Covers: NFR-7, SM-1 to SM-5 (self-hosted run), FR-66 and FR-72 (self-hosted parts of their Checks).

**Core behaviour**
- The runs of story 10.2, story 10.3, story 10.4, story 10.5 and story 10.6 are repeated in full on a self-hosted installation of the same version.
- FR-66: following only the published instructions, a fresh supported server reaches a working sign-in page over HTTPS.
- FR-66: a plain HTTP request is redirected or refused, and the set-up step behaves as in story 10.7.
- FR-72: pressing Update produces a backup, the new version and intact data, with open pages recovering their unsaved edits.
- FR-72: an installation two releases behind updates directly to the latest.

**Refusals and edge cases**
- FR-72: a release with a bad signature is refused.
- FR-72: an update made to fail part-way leaves the earlier version running with its data and reports the failure, and the failed attempt is in the activity log after the return.
- FR-72: a return made to fail is reported as failed, never as success.

**Evidence to record**
- The server's hardware and disk are recorded with the results.

### Story 10.9: Show both hosts are one product

As Kevin, the product owner, I want the two hosts shown to behave as one product, so that an organisation can choose either and move between them.

Covers: NFR-7, SM-6.

**Core behaviour**
- On each host, the person who followed the instructions creates an administrator, an Editor and a Viewer.
- On each host a non-member cannot open the project, and a Viewer's save is refused by the server.
- On each host an update to a newer published release is installed from the interface with data intact (on Cloudflare with one-step deployment set up).
- On each host a deliberately broken update returns to the earlier version.
- A project backed up on each host is restored on the other and passes the checks of story 8.11.
- Every item on the comparison list gives the same result on both hosts.
- Each difference that hosting makes unavoidable is stated in the interface and in the instructions: how an update is triggered, when the signature is verified, where the set-up code and the deployment key appear, and where backups are kept.
- Deployment packaging, meaning how HTTPS is provided and how the application is started, is an expected, documented difference between the hosts and is listed in the instructions of story 9.1.
- On each host an administrator reviews the activity log and confirms that backups are succeeding.

**Refusals and edge cases**
- Self-hosting is not described as supported in the repository or the instructions until story 10.8 and this story pass.

**Limits and values**
- The comparison list is: every area of the project frame and every Administration screen opens; and each of these is refused: a Viewer's save, a non-member opening a project, a request on an ended session, a sign-in by a deactivated account, a revoked reviewer link, an expired reviewer link, an upload over its size limit, a portable backup from a newer version, and Update by a standard user. (CF-38 · reading)

Notes: SM-6 needs both hosts and is complete only when this story passes.

## Epic 11: Work with AI agents

**Outcome.** An AI agent acting for a person can find, read and prepare work in Site Studio through a documented API or an MCP endpoint, on Cloudflare or on a private network, while approvals, issuing, closeout and field results stay with people.

**Depends on.** Epics 1 to 8: tokens, route classes and the entered-text field type from Epic 1, and the features the agent uses from Epics 2 to 8. It does not depend on Epic 9 or Epic 10. SM-7 is shown here, outside the acceptance run of Epic 10, as PRD amendment 1.3 states.

**Why here.** The access model was settled in Epic 1 so that every route was born ready for agents; what remains is to describe the API, offer it to agents, and prove it on both hosts. Placing it after Acceptance keeps the confirmed epic order and numbering.

### Story 11.1: API description

As a developer connecting an agent, I want a machine-readable description of the API, so that my agent can call it correctly without reading the code.

Covers: FR-76 (documented, versioned API), AD-22.

**Core behaviour**
- While agent access is on, the server serves an API description at `/api/v1/openapi.json`, generated from the route declarations in the shared module, without the server's version. (CG-23 · reading)
- The description lists every route an access token may call, with its input, its reply, its class and its reason codes, and lists no person-only or administrator-only route.
- The description marks every value that can carry the entered-text wrapper of story 1.1.
- The description states the bearer-token scheme, the HTTP 429 and 503 replies with `Retry-After`, and the reason code `updating`.
- A contract test in continuous integration calls each described route on the built bundle and fails when a route's behaviour differs from its description.
- The description is checked against the previous release's by the same rule as the route declarations, so a field removed or renamed, a type narrowed or a required input added under `/api/v1/` fails the build. (CG-08 · reading)
- A test that renames one field in a declaration shows the build failing.
- A reference page generated from the description is published with the installation instructions.

**Refusals and edge cases**
- A route added without a declaration fails the build.
- With agent access off, the description is not served, and the request receives HTTP 403 with "agent access is off". (CG-23 · reading)
- During an update, an API call receives HTTP 503 with `Retry-After` and the reason code `updating`, as the description states, and not a refusal.

**Limits and values**
- Requests for the description are limited to 60 a minute from one network address. (CG-15 · value)

### Story 11.2: MCP endpoint

As a designer, I want to connect an AI agent to Site Studio through MCP, so that it can work in my projects using tools it discovers by itself.

Covers: FR-75, FR-76 (MCP endpoint), AD-22.

**Core behaviour**
- The server serves an MCP endpoint at `/mcp` using MCP's Streamable HTTP transport, accepting POST and replying with `application/json`, and issues no session identifier. (CG-26 · value)
- The endpoint supports the MCP protocol revisions listed in the installation instructions, read from the protocol-version header. (CG-26 · value)
- The endpoint accepts the same bearer tokens as the API, checked by the same gate.
- Each tool call runs the corresponding route handlers inside the server, through the gate, with the caller's token; it makes no network request to the server's own address.
- Its tools are generated from the route declarations, with names of at most 64 letters, digits, underscores and hyphens. (CG-17 · value)
- Routes are grouped into one tool only within one route class and only by a grouping each route declares, so a tool's name and actions do not depend on how many routes exist.
- The tool list holds no person-only or administrator-only route, and follows the token's kind and the owner's roles: draft tools are listed when the token is read-and-draft and its owner is an Editor on at least one project in the token's scope, and each call is still decided per project.
- A tool that changes anything is one operation: it is applied whole or not at all, and carries an operation identifier, so a repeated call returns the stored result.
- A tool call's whole cost against the rate limits, counted as one unit per route handler it runs, is charged before it starts; if it does not fit, the call is refused with HTTP 429 and `Retry-After`, and a started operation is never stopped by a limit.
- An MCP client connected with a read-and-draft token lists the tools, reads a project and places a camera, and the camera is recorded as via agent.
- An agent searches issues by an external ticket number and adds an external ticket to a service visit, recorded as via agent.
- Entered-text values reach the agent marked, in the tool result's structured content and, as JSON with their source, in its text.
- A person can undo the change made by one tool call as one action from the project's history, however many items it touched; a token cannot undo. (CG-29 · decision)
- An undo is refused, listing the items concerned, when any of them was changed after the tool call, and an undo never brings back a cleared verified state. (CG-29 · decision)
- A change made with a token to any field of a verified device clears its verified state, and the device history shows the change via agent. (CG-12 · decision)
- With a read-only token, an agent lists a project's existing Design and Closeout packages and downloads one.
- An agent may request a review of a revision; the review's assignee must be a person. (CG-31 · decision)
- A deletion made with a token can be reversed by a person from the project's history, and permanently removing files or a project is refused to a token with "needs a person". (CG-30 · decision)

**Refusals and edge cases**
- A CORS preflight (`OPTIONS`) to `/mcp` is answered without a token and runs nothing; it allows any origin to send POST with the `Authorization`, `Content-Type` and protocol-version headers, without credentials. (CG-35 · reading)
- Other refusals are checked in this order, and the first that applies is given: GET or DELETE receives HTTP 405; with agent access off, HTTP 403 "agent access is off"; without a token, HTTP 401 with a `WWW-Authenticate: Bearer` header, carrying `resource_metadata` with the address of the protected-resource metadata wherever that metadata is served, and "token required", from any origin; an unsupported protocol revision, HTTP 400. (CG-35 · reading)
- `/mcp` never accepts a session cookie, so a request without a token runs nothing whatever its origin.
- The 401 without a token carries `Access-Control-Allow-Origin` for any origin, without credentials, and `Access-Control-Expose-Headers: WWW-Authenticate`, so a browser-based client can read the challenge.
- A request with a valid token is answered to any origin without credentials, including a browser-based MCP client; a request to `/api/v1/` with a session cookie is answered to the app's own origin only.
- A call to a tool that is not in the caller's list, including a person-only action, receives the protocol's unknown-tool error.
- A token's request to download a project's portable backup is refused with "needs a person". (CG-11 · decision)
- A tool call refused by the API returns a tool result marked as an error, with the API's reason code and wording.
- A refused change returns the item's current version and value with the reason code "changed since", and overwrites nothing.
- During an update a tool call returns a tool result marked as an error, with the reason code `updating` and the time to retry.

**Limits and values**
- The full tool list for an Editor's read-and-draft token holds at most 60 tools; above that, related routes are grouped into one tool with an action field. (CG-17 · value)

**Evidence to record**
- The endpoint is used from Claude Code and from a second, browser-based MCP client on a deployed Cloudflare test installation and under the self-hosted configuration, and the tool list, its length and one draft change are recorded.
- A contract-test case whose entered text contains the marker syntax shows the text still reaching the agent inside its marked value.

### Story 11.3: Experiment R17, then coverage and estimates for agents

As a designer working with an agent, I want the agent to get the same coverage and estimate figures that I see, so that its suggestions rest on the app's own calculations.

Covers: FR-77 (coverage and estimates), NFR-4, AD-9, AD-13, AD-22, experiment R17.

**Core behaviour**
- Experiment R17 runs the coverage calculation on the acceptance-size test project, inside one request, on a deployed Cloudflare test installation and under the self-hosted configuration, and records CPU time, wall time, peak memory and each host's configured limits.
- The calculation fits one request on a host when it uses at most half of every configured limit; the shipped self-hosted configuration sets the container's CPU and memory limits equal to Cloudflare's, and those are the limits used there. (CG-18 · value)
- If R17 shows the calculation fits on both hosts, an API route returns a floor's coverage results in its reply. (CG-09 · decision)
- If R17 shows it does not fit on one host or on both, the route starts a job on both hosts and a second route returns its result when done, so the two hosts behave alike. (CG-09 · decision)
- A job's first reply gives its identifier and a suggested wait, and the tool's description tells the agent to fetch the result after that wait.
- An API route returns the estimate of the current design.
- Both routes use the calculation and estimate code of the shared module, unchanged from the browser's.
- For the same saved design, counts and categories an agent obtains equal those the app shows in Chrome, and areas and percentages agree to within 0.1 percent or 0.1 percentage points. (CG-19 · value)

**Refusals and edge cases**
- A result whose inputs changed while it was calculated is returned marked as out of date, with the inputs' fingerprint.
- A calculation that exceeds its time allowance returns incomplete with the reason; sampling is never coarsened to finish (AD-9).
- A job's result can be fetched only with the token that started it or by its owner, and only while the token and the owner may still read the project.
- At each step and when its result is fetched, a job checks again that its token is valid, agent access is on and the owner may read the project, and otherwise stops with the reason.
- A job whose floor or project is deleted or archived stops with the reason code "target gone".
- A job running when an update changes the code version is restarted under the new version with the same identifier, and its result says it was restarted.
- A job not finished within 1 hour is given up with the reason, and a result is kept for 24 hours. (CG-34 · value)
- A token may have at most 3 jobs running and a person at most 5; a further job is refused with the limit stated. (CG-34 · value)

**Evidence to record**
- R17's measurements on both hosts are recorded in the experiments record.

### Story 11.4: Inventory import for agents

As a designer, I want an agent to import an equipment spreadsheet into my project, so that it can do the mapping work while I review what it found.

Covers: FR-77 (import), FR-56, FR-58, FR-62, AD-10, AD-22, experiment R17.

**Core behaviour**
- An upload route accepts a CSV or Excel file as the request body and returns a file identifier; the import routes then name that identifier.
- An MCP client's agent gets a file to the upload route through an upload address that the import tool returns, so the file never passes through the model.
- The upload address is unguessable, scoped to its path, usable once, valid for 10 minutes and bound to the token and project; using it checks the token and agent access again and counts against the rate limits. (CG-32 · value)
- The upload address is never written to a log.
- The server parses the file with the shared module's parser.
- The agent proposes a column mapping, receives the preview grouped as New, Unchanged, Changed and Needs review with the preview's fingerprint, and applies selected valid rows.
- Applying is one operation: every selected row is applied, or none is and the reply lists each refused row with its reason.
- The groups, row errors and outcomes equal those the app shows for the same file and mapping.
- Imported devices are recorded as imported by the token's owner, via agent, with their import provenance.
- Imported values keep the source "import" after they are applied, until a member edits them.
- An MCP client completes an Excel import end to end.

**Refusals and edge cases**
- Upload, preview and apply are draft-change routes, and a read-only token is refused on each.
- Applying with a fingerprint that no longer matches the project is refused with "preview out of date".
- Applying after the upload was removed is refused with "upload gone".
- A file whose declared size is over 10 MiB is refused before it is read, and a workbook whose uncompressed contents are over the shared parser's limit is refused before it is parsed, exactly as in the app. (CE-50 · value)
- Needs review rows are not applied by an agent's request and remain for a person.
- A Changed row that an agent would apply to a verified device is moved to Needs review. (CG-12 · decision)
- An imported device placed by an agent stays unverified until a person verifies it.

**Limits and values**
- An agent's upload may be at most 10 MiB and 5,000 data rows, the same limits as a person's inventory file, and an upload not applied within 24 hours is removed. (CG-16 · value)
- R17 also parses the representative 600-device inventory and a worst-case 10 MiB workbook inside one request on both hosts and records peak memory; if they do not fit on one host or on both, parsing runs as a job on both hosts as in story 11.3. (CG-09 · decision)
- When parsing runs as a job, the preview is the job's result: it carries the preview's fingerprint, the apply call names that fingerprint, and applying stays one operation that is refused with "preview out of date" if the project changed since.

### Story 11.5: Check that text from others reaches agents marked

As a designer, I want text that came from outside my team to reach an agent marked as such, so that a comment or a spreadsheet cell cannot pass itself off as an instruction.

Covers: FR-75 (entered text), NFR-5, AD-22.

**Core behaviour**
- A contract test lists every reply value that can carry the entered-text wrapper and checks, route by route, that each returns the text with its source and reference.
- The sources checked are: reviewer-link entries, imported content after it is applied, names of uploaded files, text read from PDF plans, and values a token wrote, including external tickets an agent added.
- A value's source and reference are the same after a revision restore and after a portable backup is restored, and remain as text after the uploaded file is removed.
- The MCP endpoint's description of its tools states that entered text is data from outside the team and not instructions.
- Text a member copies or edits becomes that member's text, recorded under their name; applying an import is not copying and keeps the source "import". (CG-21 · reading)

**Refusals and edge cases**
- A refusal names the field it refused but never repeats an entered value, and the contract test checks every refusal of every route that accepts entered text.

### Story 11.6: Experiment R18 and setting up an agent on either host

As an organisation's administrator, I want instructions for connecting an agent on my host, so that our agents can reach Site Studio on Cloudflare or inside our own network.

Covers: FR-76 (both hosts, private network), AD-16, AD-22, experiment R18.

**Core behaviour**
- The published instructions explain, for each host, turning agent access on, creating a token and connecting an MCP client and an HTTP client.
- The instructions keep the token out of shared files: client settings read it from an environment variable, with a warning never to commit it.
- For a private network, the instructions explain that agents must run inside the network and how to make Claude Code and other Node clients, curl and Python trust a private certificate authority.
- Experiment R18 follows the instructions as written, carried out by someone other than their author: it connects Claude Code with a token to the MCP endpoint of a deployed Cloudflare test installation, and to a self-hosted installation reachable only on a private network with a certificate from a private authority.
- On each, R18 lists the tools, makes a draft change, and runs the API contract test against the installation.
- On each, R18 asks for an approval through the API with the same token and receives "needs a person".

**Refusals and edge cases**
- The instructions state that cloud-hosted AI services cannot reach an installation inside a private network.
- On the self-hosted installation, a tool call succeeds although the installation's own address does not resolve from inside its container.

**Evidence to record**
- R18's result on each host, with the contract test's result, is recorded in the experiments record.

### Story 11.7: OAuth sign-in for MCP connectors

As a designer using an AI service whose connectors require OAuth, I want to connect it by signing in to Site Studio, so that I need not copy a token by hand.

Covers: FR-73, FR-76, AD-22.

**Core behaviour**
- The installation acts as its own OAuth authorisation server for the MCP endpoint and needs no outside identity service.
- A request to `/mcp` without a token receives the `WWW-Authenticate` header with the address of the protected-resource metadata, and the installation serves that metadata and its authorisation-server metadata.
- Connectors register by dynamic client registration (RFC 7591); the installation fetches no client metadata from outside.
- Registration is limited to 20 a hour from one network address, and a registration unused for 30 days is removed. (CG-36 · value)
- Every authorisation uses PKCE with S256, an exactly matching redirect address, a state value and the endpoint as its resource.
- A connector that starts OAuth sends the person to Site Studio's sign-in, including the second step, then to a consent page.
- The consent page shows the redirect address's host prominently, the connector's name marked as given by the connector itself, the token kind, the projects and an expiry, 90 days unless changed and within the installation's maximum.
- On consent the installation issues a token of the chosen kind, bound to that connector, listed under the person's Access tokens with the connector named, and counted among the person's active tokens.
- A refresh replaces the token's value without adding a list entry and never extends access beyond the token's expiry; revoking the token, deactivating the account or recovering the installation ends its refresh grant.

**Refusals and edge cases**
- With agent access off, sign-in for a connector is refused.
- Agent access, the account and its membership are checked again when consent is given, and a change since sign-in refuses it.
- Denying consent returns the OAuth "access denied" reply and issues nothing.
- A person who must set up two-step verification is sent to set it up first.
- A person with no project is told so on the consent page, and no token is issued.
- A person already holding the maximum number of active tokens is told so on the consent page, and no token is issued.
- A redirect address that does not match exactly, or an authorisation without PKCE, is refused.
- Revoking the token from Access tokens ends the connector's access on its next call.

**Limits and values**
- Requests to the OAuth routes are limited to 60 a minute from one network address. (CG-15 · value)

Notes: Optional (sprint change proposal choice D4). Tokens created by hand remain the main way in, and a cloud connector still cannot reach an installation inside a private network.

### Story 11.8: Acceptance: an agent does real work on both hosts

As Kevin, I want to see an agent do a real piece of design work on both hosts, so that I know agents can use Site Studio as intended.

Covers: SM-7, FR-73, FR-74, FR-75, FR-76, FR-77.

**Core behaviour**
- On a deployed Cloudflare test installation, an MCP client acting for an Editor imports an inventory from an Excel file, places a camera, reads its coverage, saves a named draft revision and requests its review with another person as the assignee, each recorded as via agent.
- The agent's attempt to approve the revision, made through the API with the same token, is refused with "needs a person"; the assignee then approves it.
- An exported equipment schedule shows the camera's change as made by the Editor via agent.
- The same run passes on a self-hosted installation reachable only on a private network.

**Evidence to record**
- Each run's tool calls, results and refusals, and the activity log filtered to agent actions, are kept with the acceptance record.

## Order and validation

**Checks run on draft 0.7.**

| Check | Result |
| --- | --- |
| Every FR, NFR and SM appears in at least one story | Pass, by script. This shows each is named, not that each Check is fully met. |
| Every architecture decision and experiment is cited | Pass, by script. |
| Every story has a user-story sentence, a Covers line, grouped criteria and at most one Notes line | Pass, by script. |
| No criterion names a later story | Pass, by script. |
| No criterion silently needs a later story | Revised after the second review found 14 that did. A script cannot check this; only another independent read can. |
| Every choice ID on a criterion is listed, and every listed choice is on at least one criterion | Pass, by script. |
| Starter template | Not applicable. The architecture names none; story 1.1 sets up the project around the existing prototype. |
| Epics deliver user value | Pass for Epics 1 to 9. Epic 10 is a verification milestone, kept deliberately. |
| Repeated changes to the same files across epics | Considered. Epics 4 to 7 all extend the device record and the plan workspace. They are kept separate because each ends in a different demonstrable outcome. |

## Requirement coverage

Generated from each story's Covers line. Where a requirement is split, the first story listed delivers its base and the later ones complete it.

| Requirement | Stories |
| --- | --- |
| FR-1 | 2.6, 4.1 |
| FR-2 | 2.1, 2.4, 3.1, 3.2, 5.3 |
| FR-3 | 2.7 |
| FR-4 | 2.8, 2.9 |
| FR-5 | 2.8, 2.18 |
| FR-6 | 2.8, 2.9 |
| FR-7 | 2.10, 4.3 |
| FR-8 | 2.10, 3.6, 6.6, 6.11 |
| FR-9 | 2.15, 7.9, 7.10 |
| FR-10 | 2.12 |
| FR-11 | 2.12 |
| FR-12 | 2.12 |
| FR-13 | 2.12 |
| FR-14 | 2.13 |
| FR-15 | 2.13 |
| FR-16 | 2.13 |
| FR-17 | 4.5 |
| FR-18 | 4.5 |
| FR-19 | 4.6, 7.1, 7.7 |
| FR-20 | 2.16, 2.17, 2.20, 5.11 |
| FR-21 | 2.2, 2.3, 2.5, 2.18, 3.1, 5.28, 9.3, 9.8 |
| FR-22 | 2.20, 4.1, 4.2, 4.5 |
| FR-23 | 4.7, 5.26 |
| FR-24 | 4.8, 4.10, 4.11, 4.13, 5.25, 5.26 |
| FR-25 | 4.7, 4.9, 4.12, 5.23, 5.26 |
| FR-26 | 4.12, 4.13, 5.3, 5.4, 5.6, 6.19 |
| FR-27 | 5.6 |
| FR-28 | 5.13, 5.14, 7.7 |
| FR-29 | 5.7, 5.8, 5.9, 7.2 |
| FR-30 | 5.4, 5.9, 5.10, 5.15 |
| FR-31 | 5.10, 5.11, 5.14, 5.15 |
| FR-32 | 5.23, 5.24, 5.25 |
| FR-33 | 4.15, 4.16, 4.17, 5.6, 5.8, 5.18, 5.27, 6.9, 6.12, 6.17, 6.18, 6.20, 7.11 |
| FR-34 | 4.1, 4.15, 4.17, 4.18, 5.8, 5.27, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 8.14, 10.4 |
| FR-35 | 6.11, 6.12 |
| FR-36 | 6.13, 6.14 |
| FR-37 | 6.16 |
| FR-38 | 6.15, 6.19 |
| FR-39 | 6.1 |
| FR-40 | 6.8 |
| FR-41 | 2.10, 5.3, 6.9 |
| FR-42 | 2.5, 5.7, 5.24, 5.25, 5.28, 6.11, 6.16, 7.7 |
| FR-43 | 5.16 |
| FR-44 | 5.9, 5.10, 5.13, 5.14, 5.20, 5.22 |
| FR-45 | 2.1, 2.16, 5.25, 6.10, 6.15 |
| FR-46 | 5.17, 5.18, 5.23, 5.25, 6.15, 6.18, 6.20 |
| FR-47 | 4.4, 5.14 |
| FR-48 | 7.1 |
| FR-49 | 7.4 |
| FR-50 | 7.5 |
| FR-51 | 7.6, 7.7, 8.11 |
| FR-52 | 7.9, 7.10 |
| FR-53 | 6.12, 6.14, 7.8 |
| FR-54 | 6.13 |
| FR-55 | 2.19, 4.12, 4.14, 5.4, 5.5, 5.10, 5.13, 5.17, 5.24, 6.8, 7.8 |
| FR-56 | 6.5, 6.6, 11.4 |
| FR-57 | 6.5, 6.6 |
| FR-58 | 6.4, 6.5, 6.11, 11.4 |
| FR-59 | 6.7 |
| FR-60 | 2.6, 4.1, 5.16, 5.24, 6.11, 7.5, 7.6, 7.9 |
| FR-61 | 4.12, 4.13, 4.18, 5.1, 5.3 |
| FR-62 | 6.2, 6.3, 6.4, 6.5, 11.4 |
| FR-63 | 7.2, 7.3, 8.11 |
| FR-64 | 5.19, 5.20, 5.21, 5.22, 5.23, 5.24, 5.27 |
| FR-65 | 6.17, 6.18, 6.19, 6.20 |
| FR-66 | 1.2, 1.7, 2.21, 2.22, 2.23, 2.25, 2.26, 9.1, 9.2, 9.9, 9.14, 10.7, 10.8 |
| FR-67 | 1.3, 1.4, 1.5, 1.6, 1.9, 1.10, 1.11, 1.15, 1.16, 1.17 |
| FR-68 | 1.7, 1.8, 1.9, 1.12, 1.15, 2.1, 2.3, 3.6, 5.18, 6.12, 6.16, 7.8, 8.10, 8.11, 8.12 |
| FR-69 | 1.8, 2.1, 2.4, 4.7, 4.8, 4.9, 4.10, 4.15, 5.26, 5.27 |
| FR-70 | 1.10, 1.11, 1.12, 1.13, 1.15, 1.16, 1.17, 2.7, 2.23, 4.11, 8.3, 8.4, 8.5, 8.12, 8.14, 9.13 |
| FR-71 | 1.14, 1.15, 4.10, 4.11, 8.1, 8.3, 8.5, 8.7, 8.8, 8.10, 8.11, 8.12, 9.6, 9.7, 9.10, 9.12, 9.13 |
| FR-72 | 9.2, 9.3, 9.4, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13, 9.14, 9.15, 10.7, 10.8 |
| FR-73 | 1.19, 11.7, 11.8 |
| FR-74 | 1.19, 11.8 |
| FR-75 | 1.19, 11.2, 11.5, 11.8 |
| FR-76 | 1.19, 11.1, 11.2, 11.6, 11.7, 11.8 |
| FR-77 | 11.3, 11.4, 11.8 |
| FR-78 | 6.20 |
| NFR-1 Record integrity | 4.1, 5.24, 6.11, 6.12, 6.13, 8.4, 8.5, 8.11 |
| NFR-2 Shared-save clarity | 2.2, 2.3, 2.9, 2.17, 2.25, 2.26, 5.11, 5.12, 5.28, 9.8 |
| NFR-3 Browser, field and accessibility | 3.3, 3.4, 5.1, 5.2, 5.9, 5.11, 5.12, 5.28, 10.6 |
| NFR-4 Honest analysis and responsiveness | 2.11, 2.12, 2.13, 2.14, 10.1, 10.2, 10.3, 10.4, 11.3 |
| NFR-5 Access boundary | 1.2, 1.3, 1.8, 1.9, 1.19, 2.16, 2.22, 4.10, 4.11, 5.11, 6.20, 8.1, 8.7, 8.8, 8.10, 11.5 |
| NFR-6 Consistent deliverables | 3.6, 4.16, 4.17, 5.27 |
| NFR-7 Same product on either host | 2.21, 2.23, 2.24, 2.25, 2.26, 8.9, 8.11, 8.13, 9.14, 10.8, 10.9 |
| NFR-8 Safe updates | 9.3, 9.4, 9.5, 9.7, 9.8, 9.10, 9.11, 9.12, 9.13, 9.15 |
| SM-1 | 10.5, 10.8 |
| SM-2 | 10.5, 10.8 |
| SM-3 | 10.5, 10.8 |
| SM-4 | 10.6, 10.8 |
| SM-5 | 2.11, 10.1, 10.2, 10.3, 10.4, 10.8 |
| SM-6 | 9.1, 10.9 |
| SM-7 | 11.8 |

**Experiments**

| Experiment | Status | Story |
| --- | --- | --- |
| R1 | Done; see the experiments record | 4.17 |
| R2 | Done; see the experiments record | 2.14 |
| R3 | To run | 8.6 |
| R4 | To run | 5.12 |
| R5 | To run | 8.13 |
| R6 | Done; see the experiments record | 4.17 |
| R7 | Done; see the experiments record | 1.1 |
| R8 | Done; see the experiments record | 1.1 |
| R9 | Done; see the experiments record | 1.3 |
| R10 | Done; see the experiments record | 9.12 |
| R11 | Partly run; see the experiments record | 9.11, 9.12, 9.15 |
| R12 | To run | 2.26 |
| R13 | Partly run; see the experiments record | 1.18 |
| R14 | Partly run; see the experiments record | 9.5 |
| R15 | To run | 4.16 |
| R16 | To run | 9.13 |
| R17 | To run | 11.3, 11.4 |
| R18 | To run | 11.6 |

**Architecture decisions**

| Architecture decision | Stories |
| --- | --- |
| AD-1 | 1.1, 2.21 |
| AD-2 | 2.1, 2.26 |
| AD-3 | 2.9, 2.17, 2.25, 9.4 |
| AD-4 | 2.9, 2.25, 4.17, 5.10 |
| AD-5 | 1.19, 2.1, 2.2 |
| AD-6 | 2.4 |
| AD-7 | 2.4, 2.18, 4.2 |
| AD-8 | 4.1 |
| AD-9 | 2.12, 2.14, 11.3 |
| AD-10 | 2.8, 6.2, 11.4 |
| AD-11 | 4.16, 4.17 |
| AD-12 | 1.2, 1.3, 1.4, 1.5, 1.8, 1.9, 1.13, 1.16, 1.19, 9.3 |
| AD-13 | 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8, 8.9, 11.3 |
| AD-14 | 2.20, 8.10, 8.11, 8.12, 8.13 |
| AD-16 | 1.1, 2.21, 2.24, 2.25, 11.6 |
| AD-17 | 1.1, 1.5, 1.8, 1.15, 1.19, 2.21, 2.22, 2.23, 9.3, 9.13 |
| AD-18 | 1.17, 1.18 |
| AD-19 | 9.2 |
| AD-20 | 1.1, 9.3, 9.4, 9.5, 9.7, 9.8, 9.10, 9.12, 9.13, 9.14, 9.15 |
| AD-21 | 1.2, 1.5, 9.6, 9.7, 9.9, 9.10, 9.12, 9.13, 9.14 |
| AD-22 | 1.1, 1.8, 1.19, 6.20, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7 |

## Values and readings

**Values nobody specified (89).**

*Epic 1: Install, sign in and manage people (27)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CA-41 | 1.1 | An object stops itself at most once in 30 seconds; a mismatched call within that time is refused without a further stop | No limit on stops | AD-20 (K20 fix 4) limits stops to one in a short interval so that an object restarted on the same code does not restart over and over, and gives no length | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-01 | 1.2 | Set-up code is random, at least 20 characters, printed once in the deployment output | A shorter code, or one the installer chooses | AD-12 says only that a one-time code is shown in the deployment output; no length is given | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-03 | 1.2 | Password: 12 to 128 characters, not equal to the email, no composition rules | 8-character minimum, or composition rules | Architecture section 15 left the rule open; current published guidance favours length over composition | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-04 | 1.2 | Installation name is 1 to 80 characters | A longer bound | No source gives a bound; fits a sign-in page heading | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-05 | 1.2 | Wrong set-up codes: after 5, refused from any address for 1 minute, doubling to 15 minutes | No limit on set-up attempts | No source limits set-up attempts; same pattern as sign-in | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-07 | 1.3 | Sign-in wait: after 5 failures in a row per email or 20 per address in 15 minutes; 1 minute doubling to 15; same wait for unknown emails | Other counts, or a fixed wait | AD-12 says "slowed per account and per address" and gives no figures | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-08 | 1.3 | Median sign-in on Cloudflare is under 1 second over 20 sign-ins | A different time bound | The architecture gives no time bound for sign-in; experiment R9 measured about 0.36 s for the hash alone | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-09 | 1.4 | Invitation lasts 7 days by default | 3 days or 14 days | FR-67 leaves the period to the administrator and names no default | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-11 | 1.5 | 10 recovery codes in a set | 8 or 12 | FR-67 names recovery codes without a count | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-12 | 1.5 | Codes are 6 digits on a 30-second step; one step either side is accepted | Accept the current step only | Standard authenticator-app settings; AD-12 says only "time-based codes" | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-18 | 1.6 | A session ends after 24 hours without use by default | 8 hours or 7 days | FR-67 leaves the period to the administrator and names no default | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-21 | 1.7 | Project name is 1 to 120 characters; duplicate names are allowed | Names must be unique | No source gives a bound; properties can share names | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-24 | 1.11 | A reset link issued by an administrator expires after 24 hours | 1 hour, as for an emailed link | AD-12 says resets expire and gives no period; a link passed on by hand needs longer | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-30 | 1.13 | The recovery code expires after 1 hour | 15 minutes or 24 hours | No source gives a period; it is used at once by the person who ran the command | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-31 | 1.14 | The log exports as a CSV file of the filtered entries | JSON, or the whole log regardless of filter | FR-71 says "export" without a format; CSV matches the estimate export | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-33 | 1.15 | Session period accepts 15 minutes to 30 days; invitation life accepts 1 to 30 days | No bounds | FR-70 makes both settable and gives no bounds | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-35 | 1.15 | A saved secret shows its last 4 characters | Fully masked | UX S-33 says "only its last characters" without a count | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-38 | 1.17 | An emailed reset link expires after 1 hour | 24 hours, as for an administrator's link | AD-12 says resets expire and gives no period | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-39 | 1.17 | "Forgot password" gives the same reply for every email and sends at most 3 messages per account per hour | No sending limit | NFR-5 forbids revealing whether an email has an account; no source limits sends | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-42 | 1.18 | SMTP connect times out after 10 seconds and each reply after 30 seconds | 30 seconds to connect, 60 seconds for each reply | No source gives a limit; a mail server that accepts and never replies would otherwise hang the test message until a platform limit ends it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CG-02 | 1.19 | Token expiry 90 days by default, at most 1 year, maximum lowerable by an administrator | No expiry, or a fixed lifetime | Sprint change proposal choice D2 | Yes (Kevin, sprint change proposal, 2026-11-19) |
| CG-04 | 1.19 | 300 requests a minute per token, then "too many requests" with the time to wait | A lower or higher limit, or none | NFR-5 under amendment 1.3 asks for a limit and names none; generous for one agent, low enough to stop a runaway loop | Yes (Kevin, 2026-11-19) |
| CG-06 | 1.19 | Tokens start with ssat_ and hold at least 32 random bytes | No prefix | A prefix lets secret scanners and people recognise a leaked token | Yes (Kevin, 2026-11-19) |
| CG-07 | 1.19 | An expired or revoked token stays listed, greyed, for 30 days | Removed at once | Lets the owner see why an agent stopped working | Yes (Kevin, 2026-11-19) |
| CG-13 | 1.19 | All of one person's tokens together: 600 requests a minute; at most 10 active tokens per person | No cap per person | Stops the per-token limit being multiplied (review E33, A20) | Yes (Kevin, 2026-11-19) |
| CG-14 | 1.19 | 20 refused token requests a minute from one address, then 429 | No limit on failed tokens | Throttles token guessing (review E32) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-33 | 1.19 | Operation identifiers kept 24 hours per token; reuse with a different request refused; an identifier carries its time, measured on the server's clock: more than 5 minutes ahead is refused, older than 24 hours is refused as expired, and a result is kept until 24 hours after its identifier's time | Kept for ever | Bounds storage while covering any retry (second review F22) | Yes (Kevin, applying the second review, 2026-11-19) |

*Epic 2: One shared project online (12)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CB-01 | 2.1 | Scope name 1 to 80 characters | 120 characters | No source gives a length; the name must fit the frame chip and list rows | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-06 | 2.9 | Unfinished upload discarded after 7 days | 24 hours | Matches Cloudflare's own multipart behaviour seen in experiment R6, so both hosts agree | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-07 | 2.9 | Unreferenced completed file removed by a daily clean-up once 7 days old | 24 hours | Matches CB-06 and outlasts pending input held until its account signs in again | Changed to 7 days (Claude, accepted on Kevin's instruction, 2026-11-19): pending input can wait longer than 24 hours for its account to sign in again (CA-18, CA-20) |
| CB-13 | 2.11 | Fixture has 25 plans and 20 targeted zones on the busiest plan | 30 plans and 10 zones | PRD acceptance profile allows 20 to 30 plans; 20 zones is the workload of experiment R2 | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-17 | 2.14 | Time allowance for one calculation is 30 seconds; 10 seconds stays the measured target | 10 seconds | The PRD target for the busiest plan is measured, not enforced as a cut-off | Changed to 30 seconds (Claude, accepted on Kevin's instruction, 2026-11-19): at 10 seconds a plan that misses the PRD target never shows a result |
| CB-20 | 2.16 | Form wording "Do not enter passwords or access codes for the site's systems." | A longer explanation behind a help link | NFR-5 keeps site credentials out of notes; free text can only be guided | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-21 | 2.18 | Undo and redo cover the last 40 edits in the open page | 100 edits | 40 is the prototype's limit; FR-21 limits undo to the current session | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-25 | 2.20 | Prototype project file limit 100 MiB | 250 MiB | The prototype's own limit for these files | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-28 | 2.22 | Trusted-proxy list defaults to the bundled web server only | Trust any private-network address | Forwarded headers cannot then be forged by another machine | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-31 | 2.24 | Smoke suite is a named list of ten cases, one or more per area of Epics 1 and 2 | Run the full server test suite against the image | A named list makes "covered" checkable and keeps the run short | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-36 | 2.26 | 50 forced kills | 100 | Experiment R8 used 45; rounded up | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-37 | 2.26 | At least 20 power cuts on a virtual-machine disk, and NFS as the network disk | 50 cuts, and SMB as well | R12 names the kinds of disk but no count; 20 matches the PRD's trial size | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 3: A workspace that holds the whole job (3)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CB-40 | 3.5 | Analysis strip checked at 1440 × 900 and 1280 × 720 | 1440 × 900 only | 1440 × 900 is the audit size; 1280 × 720 is a common smaller laptop | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-41 | 3.6 | Schedule CSV holds the rows and columns shown and names project, basis and export time | Always export every column | NFR-6 asks deliverables to state what they show | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-42 | 3.6 | "Scrolling stays responsive" means no main-thread task over 200 ms while scrolling 600 rows | 50 ms | Below the PRD's 250 ms feedback target, so a click during scrolling still meets it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 4: Design, estimate and issue (6)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CC-01 | 4.1 | Revision identifiers read "Rev A", "Rev B" in order of saving within the scope, never reused | A number per project, or the name alone | The UX frame example reads "Issued: Rev B"; no source defines the identifier | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-19 | 4.10 | Reviewer name is required, at most 80 characters | Optional name, or a longer limit | Prevents an anonymous decision; 80 is a conventional display-name limit | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-20 | 4.10 | Comment limit 2,000 characters; 200 comments per link | Higher or no limits | Bounds what an unauthenticated link can write; no source gives figures | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-22 | 4.11 | Invalid link tokens are slowed with the sign-in figures: 20 from one address in 15 minutes, then 1 minute doubling to 15 | Separate, stricter figures for links | NFR-5 asks for abuse limits on unauthenticated access; reusing the sign-in figures keeps one rule | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-23 | 4.11 | Messages: "This link is no longer valid" (revoked or replaced), "This link has expired" (expired) | One message for all three | No source text exists; separate wording tells the reviewer whether to ask for more time | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-30 | 4.15 | A package's decision cutoff is the time generation started | The time the last volume was verified | FR-34 requires an explicit cutoff but does not say which moment it is | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 5: Install, test and close out in the field (9)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CD-02 | 5.1 | At 200% zoom: top row, chip, bottom navigation and form fields operable, nothing cut off, no sideways scrolling of forms | Judge "readable" by eye | NFR-3 asks for readable forms at 200% zoom and gives no measure | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-03 | 5.3 | A device added after issue reads "Not in the issued design" in the comparison | Show blank issued values | The PRD is silent; blank values would read as a requirement | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-05 | 5.4 | The "Work started with no issued design" warning shows on the Overview and beside both issued-design chips | Overview only | No source says where the project shows it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-15 | 5.12 | Experiment R4 conditions: 25 MiB photo, 400 kbit/s upload, two forced drops | 1 Mbit/s and one drop | The architecture names no profile; 25 MiB is the photo limit and 400 kbit/s a common slow-mobile setting | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-21 | 5.18 | Attention count = open issues, deferred included, plus checks flagged Needs review, Retest required or Needs definition in the active scope | Also count unfinished work | Follows the state model's attention indicators; unfinished work would give every active project a large number | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-27 | 5.21 | Availability shown to two decimal places and compared with the target before rounding | Whole percentages | The PRD example needs no decimals; rounding must not make a missed target look met | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-38 | 5.25 | Label "not saved: scope closed" for a stale-tab save into a closed scope, kept for review | Reuse "not saved: no active scope — reopen first" | Same form as the PRD's rule for an archived project under FR-42 | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-36 | 5.28 | Label "not saved: device cancelled or corrected" for a stale mark or attempt onto such a device | Two labels, one for each case | Follows the "not saved: …" form used for other refused saves | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-37 | 5.28 | The per-field conflict comparison fits a 360 px wide screen without sideways scrolling | 320 px | The UX asks for a comparison that fits a phone and names no width | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 6: Existing sites and return visits (11)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CE-01 | 6.2 | At most 5,000 data rows per inventory file | No row limit, only the 10 MiB size limit | The PRD sets only a file size and says 600 devices is not a ceiling; a row bound keeps browser parsing predictable. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-50 | 6.2 | The shared parser refuses a workbook whose uncompressed contents are over 100 MiB, in the browser and on the server | No limit on uncompressed size | A small compressed file can expand far beyond memory; one limit keeps people's and agents' imports identical (CodeRabbit, pull request 3) |  |
| CE-06 | 6.6 | Field list filters named "Awaiting placement" and "Not site-confirmed" | "Unplaced" and "Unverified" | The PRD addendum asks for filtering by verification state and gives no labels. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-14 | 6.10 | A planned removal not yet recorded is listed as "Removal not recorded" | "Not removed" | The state model completes a Remove by the recorded removal; no source gives the row's wording. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-16 | 6.11 | A refused save onto a removed device is labelled "not saved: device removed" | "not saved: device archived" | Follows the wording pattern of the other refused-save labels. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-25 | 6.16 | A refused save into an archived project is labelled "not saved: project archived" and is not retried | Retry after un-archiving | Follows the wording and behaviour of the other refused-save labels. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-30 | 6.17 | Warranty term in whole months, minimum 1 | Days, or months and years | FR-65's example is a 12-month warranty. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-34 | 6.19 | A service scope's default name is "Service visit" followed by the date | "Service" followed by the issue identifier | FR-65 asks for a default name and gives none. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-42 | 6.20 | A record may hold several external tickets | One per record | A visit often has a customer ticket and an internal work order (E2) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |
| CE-43 | 6.20 | Ticket number required, 1 to 100 characters, kept as typed | A numeric or patterned number | Ticket identifiers vary between trackers (E3) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |
| CE-44 | 6.20 | Link optional, http or https only, at most 2,000 characters | Any link, or no link | Blocks script links; keeps the server out of the tracker (E4) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |

*Epic 8: Backups and recovery (5)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CF-06 | 8.4 | An unswitched copy is kept until an administrator discards or replaces it; one per project | Delete an unswitched copy after 7 days | AD-13 gives no period for a copy that is not switched; one copy bounds storage | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-09 | 8.6 | The full-size project is 7.5 to 8 GiB stored, made of distinct-content files | Any size the script reports as 8 GiB | Identical files are stored once, so the stored size must be measured | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-12 | 8.7 | The recovery notice stays until an administrator dismisses it | Hide it after 30 days | FR-34 requires the notice and gives no duration | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-16 | 8.10 | A finished portable backup is kept for download for 24 hours | 7 days | No source gives a period; short holding limits unbudgeted storage | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-22 | 8.14 | Usage warning at 90% of the 8 GiB budget | 80% | PRD says "warn before exceeding" and gives no threshold | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 9: Install from published instructions and update from the interface (6)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CF-40 | 9.3 | If the version being installed has not reached the installation 10 minutes after the yes, the installation returns by itself | 30 minutes | AD-20 (K20 fix 1) gives no period; a deployment normally answers within seconds, and every minute waited is a minute with changes stopped; R11 measures the real time | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-41 | 9.3 | A prepared update record with no yes within 30 minutes is withdrawn by the installation itself | 60 minutes | AD-20 (K21) puts a limit on every waiting state and gives no value; 30 minutes allows for a queued GitHub run, as the earlier limit did | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-42 | 9.3 | The time limit after the yes, after arrival, and for a stopping or returning record is three times the estimate shown before the update, at least 30 minutes and at most 5 hours | A fixed 60 minutes | AD-20 (K21) derives the limit from the estimate; the maximum stays under GitHub's 6-hour job limit | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-43 | 9.4 | A project that refuses a call for a version difference is called again after 35 seconds, up to 3 times, before it counts as failed | Count it as failed at once | Story 1.1 lets an object refuse for 30 seconds after a stop; a refusal then is not a conversion failure | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-46 | 9.8 | An edit the new version cannot accept reads "not saved: this edit does not fit the updated version of Site Studio" | "not saved: changed by an update" | Standing rule 11 asks each new refusal reason to state its wording; no source gives one | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-47 | 9.10 | If no container answers a request to return within 60 seconds, the updater starts the earlier image | 5 minutes | AD-20 (K22) gives no period; a running container answers within seconds | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 10: Acceptance (1)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CF-36 | 10.1 | The small functional project has about 50 devices | About 20 | PRD asks for a small functional project and gives no size | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 11: Work with AI agents (9)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CG-15 | 11.1 | Public description and OAuth routes: 60 requests a minute from one address | No limit | Unauthenticated routes reach the installation object (review E34) | Yes (Kevin, 2026-11-19) |
| CG-17 | 11.2 | Tool names at most 64 letters, digits, underscores and hyphens; at most 60 tools, grouped above that | No limit | MCP clients limit tool names and counts (review A9) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-26 | 11.2 | The MCP endpoint supports the protocol revisions named in the instructions: the current one when built and the one before; JSON replies; no session identifier | Only the newest revision; streamed replies | Clients lag the specification; a stateless endpoint suits both hosts (review A8, A26) | Yes (Kevin, 2026-11-19) |
| CG-18 | 11.3 | A calculation fits one request when it uses at most half of every configured limit | Fits when under the limit | Leaves room for larger floors (review A18) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-19 | 11.3 | Counts and categories equal; areas and percentages within 0.1 percent or 0.1 percentage points | Exactly equal | JavaScript engines may differ in the last digits of maths functions (review A17) | Yes (Kevin, 2026-11-19) |
| CG-34 | 11.3 | Jobs for agents: given up after 1 hour, results kept 24 hours, at most 3 running per token and 5 per person | No limits | One agent must not exhaust alarms or storage (second review F23, F24) | Yes (Kevin, applying the second review, 2026-11-19) |
| CG-16 | 11.4 | Agent upload at most 10 MiB and 5,000 data rows, the same limits as a person's inventory file (CE-01); removed if not applied within 24 hours | 25 MiB with a 5,000-row limit of its own | The PRD caps an inventory file at 10 MiB, and agents must get the same results as people (FR-77) | Changed to 10 MiB with no row limit of its own (Kevin, 2026-11-19); people's 5,000-row limit (CE-01) applies to agents too, found by CodeRabbit's review of pull request 3 |
| CG-32 | 11.4 | Upload address: single use, valid 10 minutes, bound to the token and project | A longer life, or reuse | Short enough not to become a standing credential (second review B15, F25) | Yes (Kevin, applying the second review, 2026-11-19) |
| CG-36 | 11.7 | Client registration: 20 an hour per address; unused registrations removed after 30 days | No limits | Open registration needs abuse limits (second review B20) | Yes (Kevin, 2026-11-19) |

**Readings of a source (155).**

*Epic 1: Install, sign in and manage people (25)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CA-02 | 1.2 | Redeploying to an installation with no users issues a new set-up code and the earlier one stops working | The first code stays valid until set-up is completed | AD-21 forbids regenerating the code only once an administrator exists; a lost code must be replaceable | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-10 | 1.4 | Inviting an email that already has an account, active or deactivated, is refused; re-inviting a pending email replaces the earlier link | Allow several live invitations for one email | FR-67 gives each person one account, so a second account or a second live link for one email would duplicate it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-14 | 1.5 | The authenticator secret is encrypted with the deployment key | Stored unencrypted in the installation object | AD-17 states the key for settings secrets; the same protection is applied to two-step secrets | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-15 | 1.5 | Wrong second-step and recovery codes share the limit and wait of wrong passwords | A separate limit for the second step | AD-12 slows "failed sign-ins"; a failed second step is read as one | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-16 | 1.6 | A password change signs out every other session and keeps the current one | End every session, the current one included | AD-12 says sessions end on password change; the person changing it is read as staying signed in | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-17 | 1.6 | A session shows a country or city only where the host supplies one | Always show a place, from an address lookup | UX section 17.3 asks for place of last use; a self-hosted server has no location source | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-19 | 1.6 | Only requests that result from something the person does (opening a page, saving, uploading, any deliberate action) count as use of the session; automatic checks for other people's changes do not, so a page left open still reaches the 24-hour idle limit | Every request that passes sign-in counts as use | FR-67 says "a period without use" without defining use; open pages check for changes every few seconds, which would otherwise keep a session alive indefinitely | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-20 | 1.6 | Pending input stays bound to its account: a different account signing in on that page neither sees nor sends it, and it is offered again when the first account signs in on that browser | Discard it when a different account signs in | FR-67 covers only the same user signing in again; FR-69 attributes each action to its own account | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-22 | 1.7 | An administrator who sees exactly one project is also sent straight to it | Administrators always land on the list | UX decision D11 says "a user with exactly one project" without excluding administrators | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-23 | 1.9 | Only active accounts that have accepted their invitation count as administrators for the last-administrator rule | An invited administrator counts | FR-68 says "the last administrator"; an account nobody can yet sign in to cannot administer | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-25 | 1.11 | A password reset ends all the account's sessions and leaves two-step verification on | A reset also turns two-step verification off | AD-12 ends sessions on password change; FR-70 lists two-step reset as a separate control | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-26 | 1.11 | After an administrator resets two-step verification, the old recovery codes stop working | Old recovery codes stay valid | FR-70 says "reset"; read as leaving nothing of the old set-up usable | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-28 | 1.11 | Deactivation cancels the account's unused invitation and reset links; a link opened for a deactivated account is refused | Links stay valid and work after reactivation | FR-67 says deactivation prevents sign-in; a link that sets a password would be a way back in | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-29 | 1.13 | The recovery code lets the named administrator set a new password and resets their two-step verification | The code resets the password only | The confirmed recovery command must cover a lost phone as well as a lost password | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-32 | 1.14 | A failed sign-in entry records the network address, and the email only when it matches an account; otherwise "unknown address" and the text entered is not stored | Record the text entered in every case | FR-71 forbids passwords in entries, and a person may type a password into the email field | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-34 | 1.15 | A changed session period applies to existing sessions on their next request; a changed invitation life applies only to invitations issued afterwards | Both apply only to new sessions and invitations | The FR-70 Check says "changes the session period and sees it take effect" | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-36 | 1.15 | Turning off project creation by standard users leaves existing projects and their members unchanged | Projects created by standard users lose their Editor | FR-68 states the setting and is silent on turning it off | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-37 | 1.15 | Settings states beside the Google mapping key that it is visible in signed-in users' browsers | No notice | FR-70 says secrets are never shown again in full; a browser map key cannot be kept from the browser, so the exception is stated | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CA-40 | 1.18 | SMTP is offered only if R13 passes on both hosts | Offer SMTP on whichever host passes | AD-18 says SMTP "is not promised until it passes"; NFR-7 asks both hosts to behave the same | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CG-01 | 1.19 | Two token kinds, read-only and read-and-draft, each optionally limited to named projects | One kind with per-action permissions | Sprint change proposal choice D1 | Yes (Kevin, sprint change proposal, 2026-11-19) |
| CG-05 | 1.19 | A request carrying both a session cookie and a token is refused | Prefer the token, or the session | A request with two identities has no single actor to record | Yes (Kevin, 2026-11-19) |
| CG-20 | 1.19 | Lowering the maximum lifetime shortens existing tokens beyond it, counted from creation | Existing tokens keep their expiry | A policy change should apply at once (review A13, E27) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-22 | 1.19 | A public route ignores a token; reviewer-link and update-secret routes refuse one | Refuse a token everywhere it is not needed | Every route class needs a defined answer (review E31) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-24 | 1.19 | A token cannot create a project | A read-and-draft token may create one | Creating a project adds a membership and a place for data; a person should decide (review A12) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-25 | 1.19 | Recovering the whole installation revokes every token | Tokens return to the recovery point | Matches ending every session on recovery and cannot resurrect a revoked token (review E30) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |

*Epic 2: One shared project online (22)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CB-02 | 2.2 | Capacity inputs are saved to the server and the Capacity dialog keeps working | Hide the Capacity dialog until the capacity story | The prototype saves capacity inputs with the project and FR-19 is existing capability | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-03 | 2.2 | Cost entry, named revisions and review are not offered in a shared project until their own stories build them | Keep them working with data held only in the browser | Browser-only data in a shared project would be unsaved and unattributed, against FR-21 and FR-69 | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-04 | 2.6 | The last floor and the last building of a project cannot be deleted | Allow a project with no floor or building | The prototype refuses to remove the final floor, and the PRD describes no project without a floor or building | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-05 | 2.6 | A revision restore deletes and renames no building or floor | Restore returns names and removes floors added later | FR-22 restores a design without deleting later records | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-08 | 2.10 | An Editor sets Proposed or Existing by hand | Existing only through the existing-site survey story | The prototype's status field does this and the state model allows a surveyed device to start at Existing | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-09 | 2.10 | A device once saved as Existing keeps a "recorded as existing" mark | Judge only the current lifecycle value | FR-55 decides Delete draft from origin and history, not a current flag | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-10 | 2.10 | "Room or area" is an optional free-text field on every device | Location means floor and map position only | FR-7 lists location among device details and the UX field search covers room | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-11 | 2.10 | Current installation shows Existing; Proposed design shows Existing and Proposed | Proposed design shows Proposed only | PRD state model, before planned actions exist | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-12 | 2.10 | A device that is or has been Existing has no delete control until correction exists | Keep the prototype's free deletion for every device | FR-55 allows deletion only of drafts never surveyed as existing | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-14 | 2.12 | "Controls stay usable" means feedback within 250 ms while a calculation runs | A longest-task bound of 50 ms | 250 ms is the PRD's target for selection and direct-edit feedback | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-15 | 2.13 | Target met and Shortfall are decided by bounding with edge cells, then one refinement at half spacing, then Uncertain near target | Flag any result within 2 points of the target | NFR-4 requires refine or flag; bounding by edge cells is the conservative method | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-16 | 2.13 | Not demonstrated when the target is unmet and a camera in range was left out | Show Shortfall with a note | FR-15 separates an unmet target from one that was not fully assessed | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-18 | 2.15 | A route with an unassigned end stays in cable totals and is listed for review | Leave it out of totals until reassigned | FR-55 keeps cable records and marks unassigned ends; nothing is dropped silently | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-22 | 2.19 | A route is deleted with a draft device only if selected, with no survey entry and no other assigned end | Never delete a route with a device | FR-55 allows a disposable draft cable only when explicitly selected and independently eligible | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-23 | 2.19 | A floor whose only devices are deleted drafts counts as unused, and undoing such a deletion is refused once the floor is gone | A deleted draft blocks floor deletion while its Undo is available | FR-55 says not to recreate deleted floors | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-24 | 2.20 | Importing the same prototype file twice creates two projects | Refuse or warn on a second import | The old file carries no project identity that can be trusted | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-27 | 2.22 | The application itself refuses any request that did not arrive over HTTPS | Rely on the web server's redirect alone | FR-66 allows redirect or refusal; refusing in the application also protects an operator's own proxy | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-29 | 2.23 | Self-hosted deployment key is kept in a key file in its own folder, generated on first start unless the operator has placed one there | The operator must always supply the key as a setting | AD-17 keeps the key apart from the records it protects; a generated key is never weak | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-30 | 2.23 | With records present and the key file missing, the server refuses to start | Start with stored secrets unreadable and a warning | A new key must never be generated over existing data, and a silent start would hide the loss | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-32 | 2.25 | A stored file whose hash or size no longer matches is reported as damaged, not served | Serve it and log a warning | AD-16 gives the disk store a stored hash and size; this is their use | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-33 | 2.25 | The server refuses to start when the backup location is unset or is the live files folder | Start and show a warning in Administration | AD-13 says the self-hosted backup area must be apart from the live data; backups in the live folder would be lost with it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-34 | 2.26 | A second application container on a records volume in use refuses to start | Allow it and rely on file locking | Experiment R12 covers durability and locking; two writers risk damage | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 3: A workspace that holds the whole job (2)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CB-38 | 3.1 | Until field recording exists, the Installation view only sets the default basis | Hide the view switch until Epic 5 | UX 5.3 describes the switch as a change of emphasis, not of permission | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CB-39 | 3.3 | Approval state has five values: Approved, Changes requested, Bypassed, Awaiting decision, No review | Three values, without Changes requested and No review | FR-23 to FR-25 allow a request for changes and a design with no reviewer; the UX status table lists no approval family | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 4: Design, estimate and issue (20)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CC-02 | 4.1 | Saving a revision is refused while the saving user has Unsaved or Conflict items | Save without those edits and say which were left out | FR-22 says the user's pending edits are resolved first; refusing never yields a snapshot that silently omits edits | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-04 | 4.1 | Revisions in an imported prototype file become revisions of the project's first scope | List them as attachments outside any scope | FR-22 requires existing project-format migration, and the first scope is the only one an imported project has | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-05 | 4.2 | A restore can be undone only by the person who restored, in the same session, and only if no restored item has changed since | A restore that any Editor can reverse later | FR-22 says a restore stays reversible; AD-7 limits undo to a person's own session edits | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-08 | 4.4 | A camera whose template was edited shows that the template has changed and takes new values only when an Editor applies them | Ask on every template edit which cameras to update | FR-47 forbids silent change and speaks of explicitly applying changed values | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-09 | 4.4 | A result that needs a missing optical value shows as not assessed with the input named | Hide the result | FR-47 says incomplete templates must not silently become generic specifications | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-10 | 4.4 | A revision restore leaves templates unchanged; a restored camera holds the optical values recorded in the revision | Restore templates to their state at the revision | FR-47 says a template edit leaves saved revisions unchanged, so the revision carries the camera's own values | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-11 | 4.6 | With a camera that has no bitrate, the storage and bandwidth totals read Incomplete with a count | Show a total of the known cameras with a footnote | FR-19 says missing data is never zero; same wording as the estimate's unpriced lines in the UX | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-12 | 4.6 | Bitrate, recording percentage and retention are design content: a revision holds them and a restore returns them | Treat them as project settings a restore leaves alone | FR-22 restores a prior design, and the capacity summary printed from a revision must match it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-15 | 4.8 | A Viewer whose assignment was reassigned while their page was open has the decision refused, with their text kept | Accept it and label it as made after reassignment | FR-24 lets a Viewer decide only as the assignee | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-16 | 4.9 | A revision's review state follows what is recorded on it: No review with nothing recorded, Awaiting decision after a request, then Approved or Changes requested from the latest decision | Show Request changes as Awaiting decision | FR-24 allows a change decision and FR-23 allows no reviewer, so each needs a state of its own | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-18 | 4.10 | A reviewer link is created for one saved revision and for the named person assigned as design reviewer | Links for any named person, with no assignment | FR-24 gives a link to each designated reviewer who has no account, and FR-23 makes that person an assignee | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-24 | 4.12 | A revision can be issued while a requested review is still awaiting a decision | Require a decision or a bypass before issuing | FR-25 and FR-61: approval is optional and never a gate | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-25 | 4.13 | A superseded revision can be made current again; history shows both designations | Require saving a new revision to go back | FR-61 lets an Editor deliberately designate a different issue | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-27 | 4.13 | A decision by an account on a superseded revision is kept and labelled "after it was superseded" | Refuse decisions on superseded revisions | FR-24 keeps every decision; the label stops it reading as approval of the current reference | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-28 | 4.14 | A cancelled device's estimate line moves to a "Cancelled" group outside the total; an Editor can tick it as a committed cost, which then counts | Remove the line entirely | FR-55 removes a cancelled proposal from totals while retaining committed cost | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-29 | 4.14 | A reason is required for a cancellation, a correction and a reversal | Optional reason | FR-55 says "with a short reason"; taken as mandatory | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-31 | 4.15 | Survey notes, measurements and photos are printed as recorded up to the time the revision was saved | Print survey evidence up to the decision cutoff | FR-34 forbids substituting later edits into a package; only decisions are given a later cutoff | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-32 | 4.17 | An edition fails when the volumes generated so far reach 1 GiB, and stored volumes are discarded | Estimate the size first and refuse before generating | The addendum says to stop and report failure if the full edition cannot fit; AD-11 generates one volume at a time, so the total is not known beforehand | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-33 | 4.17 | An edition upload follows the plan-upload rule when a session ends (parts kept, resumes after the same account signs in); closing the tab discards it, because the generated volumes are gone | Discard the parts whenever the session ends | Sessions ending must not lose pending input; a generated edition cannot be chosen again like a plan file | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CC-34 | 4.17 | The 5-minute target is measured on generation only, not upload | Measure generation and upload together | The addendum measures processing separately from transfer | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 5: Install, test and close out in the field (24)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CD-01 | 5.1 | The field-shell or desktop choice on a tablet or laptop is remembered in that browser | Ask on each visit | UX decision D3 leaves the switch to the person; remembering it keeps their choice | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-04 | 5.4 | Configured can be set before Installed, with a neutral notice and nothing blocked | Require Installed first | The state model keeps the two facts separate and its warnings block nothing | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-07 | 5.8 | A saved revision's snapshot holds the checklist definitions in force and each device's scoped checks; the Design package uses those | Package reads the working definitions | FR-34 generates from a fixed source; live definitions would make an edition unrepeatable | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-08 | 5.9 | A measured value must be a number in the unit the check defines | Free text for value and unit | FR-30 asks for value and units, and a tolerance can only be compared with a number | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-09 | 5.9 | With a tolerance defined and the value outside it, Pass is not offered | Warn and still allow Pass | FR-30: a result that does not meet its expectation is Fail | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-10 | 5.9 | An outcome submitted against a definition changed since the page loaded is returned, not recorded | Record it against the old wording and flag Retest required | FR-44 requires each attempt to record the criteria actually tested | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-11 | 5.10 | A corrected attempt stays visible, marked corrected, and is no longer counted | Corrected attempt still counted until a retest | FR-31: corrections preserve prior evidence | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-12 | 5.10 | A mistaken correction of an attempt or an issue can be reversed with a reason, both entries kept | Only device cancellations and corrections are reversible | Applies the confirmed rule for device records to the other corrected records | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-16 | 5.13 | A device's own recorded change flags Retest required; devices whose routes end on changed shared equipment are flagged Needs review | Every affected check flagged Needs review | FR-28 separates changed equipment from known affected connected devices; routes are the only recorded association at this point | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-17 | 5.13 | An obstruction or zone-target change flags Needs review the checks that name that zone, range or obstruction | Flag the image checks of every camera viewing the zone | FR-28 says "corresponding field checks"; a named reference is the only recorded link | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-18 | 5.14 | Removing a passed check's expected result shows Needs definition and stops counting the pass | Keep counting the earlier Pass | FR-29: an undefined expected result cannot produce a Pass; FR-44: old attempts are not rewritten | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-19 | 5.17 | Corrective work is a dated entry on the issue: what was done, by whom and when | Infer it from a field change on the linked device | FR-46 requires recorded corrective work and does not say where it is recorded | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-22 | 5.20 | An end recorded before the planned duration has elapsed is a stop and asks for the reason | Accept it as a short full run | FR-64: a Pass needs the full planned duration, and only stops carry reasons | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-23 | 5.20 | A run keeps the definition in force at its start; its covered devices are the Existing devices in the covered selection at that moment | Use the definition and devices as they stand when availability is calculated | FR-64 says a later definition change rewrites no outcome; the weighting needs a fixed device count | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-24 | 5.20 | A covered device cancelled during a run is treated like a moved one: listed on the run, stage flagged, run not stopped | Ignore cancellations | FR-64 covers an actual change to covered equipment | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-26 | 5.20 | One open run per stage; a second start is refused | Allow parallel runs of a stage | FR-64: a stage has one current outcome, and overlapping runs would judge the same hours twice | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-39 | 5.21 | Where counted outages overlap, a device affected by more than one is counted once for the shared time | Sum the weighted entries and cap at 100% | FR-64: overlapping entries are not counted twice, applied per device under weighting | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-28 | 5.22 | A correction to an ended run's log rewrites no outcome; the recalculated figure is shown beside the recorded one and the stage is flagged Needs review | Recalculate the outcome | FR-44: an old outcome is never changed | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-29 | 5.24 | A run still open at closing is stopped with the reason "Scope closed" and has no outcome | Leave the run open after closing | FR-64 permits closing with outstanding items while a stage is running; a fixed record cannot hold an open run | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-30 | 5.25 | With no active scope an issue can be raised, deferred, resolved, reopened and corrected; Include now is unavailable | Raising only | The confirmed rule allows raising issues; Include now adds work to a scope that does not exist | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-31 | 5.25 | "Design edits" refused with no active scope include checklist, site-check and reliability definitions and the estimate | Only plan and device edits | Each belongs to a work scope under FR-45 | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-33 | 5.25 | Closing a scope does not by itself change reviewer links to its design revisions; a link already read-only because its revision is superseded, its review bypassed or its assignment reassigned stays read-only | Make the links read-only once the scope is closed | FR-24 ends a link only by replacement, revocation or expiry; a decision changes no design content | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-34 | 5.26 | Final acceptance is recorded on the fixed closeout record after closing, never before | Offer it as a step before closing | FR-24 reviews a fixed closeout revision; FR-32 says a missing approval does not prevent closure | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CD-35 | 5.27 | A pre-closeout preview is generated from a fixed preview record written at one consistent point | Generate the preview straight from live records | FR-34 allows only a fixed source; FR-33 requires a Draft, In progress preview | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 6: Existing sites and return visits (25)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CE-02 | 6.2 | Cancel and step controls respond within 250 ms while a file is parsed | A longest-task bound in milliseconds | The PRD's 250 ms feedback target is applied to "controls stay usable" during parsing. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-03 | 6.4 | A source asset ID identifies a device only when unique in the file and in the project | Unique in the project only | FR-58 says "reliably unique" without defining it. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-04 | 6.4 | A row with no identifier matches the device an earlier import created from an identical row, by a stored fingerprint of its mapped values; otherwise it is New. The fingerprint only identifies the device: the row is Unchanged only when its values equal the device's current record, otherwise Changed | Send every row without an identifier to Needs review on re-import | FR-58 forbids extra devices on re-import and forbids identity by name alone. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-05 | 6.4 | Group-level select only for New and Unchanged rows without errors | Group select for Changed rows too | The UX specification limits group select to "straightforward rows". | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-07 | 6.7 | Bulk cleanup is recorded in the project's change log, open to project members | Record it in the administrator's activity log as well | FR-59 asks for "an activity record"; FR-71's log is administrator-only and separate from project history. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-08 | 6.7 | Only the person who ran a cleanup can undo it, in the same session | Any Editor can undo it later | FR-59 applies the own-session undo of FR-21 and FR-55. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-09 | 6.7 | A revision restore returns drafts removed by a cleanup but not import-created records | A restore returns neither | FR-22 returns deleted drafts; imported records are existing equipment, which a restore never changes. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-10 | 6.8 | Service or reconfigure work is recorded with the scope's Installed mark; lifecycle and location do not change | A separate "Service done" mark | The state model keeps one work-recorded fact per device per scope for every Work now action. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-11 | 6.8 | Reversing Installed on a device that was already existing clears the scope's mark, keeps it Existing, and returns a relocated device to its earlier location | No reversal on such devices; a field change is recorded instead | FR-55 says reversal to Proposed does not apply to existing equipment but gives no way to undo a mistaken mark on it. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-12 | 6.10 | Preselected category: Add new, Relocate, Service or reconfigure, Replace and Remove give Work now; None and Retain give Reference only | None and Retain give Inspect or test only | FR-45 says "preselect planned changes" and the state model forbids Work now for None and Retain. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-13 | 6.10 | Core checks are required by default for Work now devices only; Inspect or test only gets the checks an Editor selects; Reference only gets none | Core checks also required by default for Inspect or test only | FR-45 says selected inspections "can have checks" and reference equipment is not recommissioned. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-15 | 6.10 | A reason is asked only when a change moves an item out of Work now | A reason for every category change | FR-45 asks for a reason "for meaningful changes" without defining them. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-17 | 6.12 | Cable ends flagged Needs connection review count in the project list's attention count | Shown only inside the project | The state model lists Needs connection review among the attention indicators. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-18 | 6.13 | A restored device returns as Existing with condition Unknown | Keep the condition it had when removed | The state model says restoration does not verify the installation. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-19 | 6.13 | A restored device's checks are flagged Retest required | Flag them Needs review | FR-36 says old tests are not evidence of the restored installation, and FR-28 lists return to service as a retest cause. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-21 | 6.13 | Restoring a device is refused while no scope is active | Allow it and record it with no scope | Restoration is a recorded site fact like removal, and with no active scope only issues, warranties and service visits can be recorded. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-23 | 6.15 | A revision of an earlier scope cannot be designated the new scope's current issued design | Allow it with a warning | FR-61 designates a revision "for the active work scope". | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-24 | 6.16 | Archiving is refused while an inventory import or a package generation is running | Let the job finish in an archived project | An archived project cannot be edited (FR-37), and a running job would still be writing to it. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-27 | 6.17 | End date is the start date plus the term, and In warranty includes the end date | In warranty ends the day before the end date | FR-65 says the end date is calculated; the UX example reads "runs to 12 Nov 2027". | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-29 | 6.17 | A warranty on a scope not yet closed, with no start date entered, shows Not started | Show Unknown | FR-65 says a warranty is Not started until its start date, which defaults to a closeout date that does not exist yet. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-31 | 6.18 | A visit time cannot be earlier than the reported time, and neither can be in the future | Accept any times | FR-65 visits record what happened; scheduling is outside the proof of concept. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-32 | 6.18 | With no scope active, an existing visit can be corrected but a new one needs Start service visit | Record new visits with no scope | FR-65 routes a visit with no active scope through Start service visit. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-41 | 6.20 | Named "External ticket", with a hint naming a customer's service desk or your own tracker | "Customer ticket", or "Ticket" | Fits both customers' tickets and in-house trackers (proposal E1) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |
| CE-45 | 6.20 | The same number may be on several records, each showing "also on" | Refuse a repeated number | One customer ticket can cover several faults (E5) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |
| CE-46 | 6.20 | Removing an external ticket is a history entry; the earlier value stays | Remove it outright | NFR-1 and AD-5 (E6) | Yes (Kevin, sprint change proposal on external tickets, 2026-11-19) |

*Epic 7: Extended modelling (6)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CE-35 | 7.4 | A revision restore returns door links where the door or the component is Proposed and leaves links between two Existing records unchanged | A restore leaves every link unchanged | FR-22 restores design content and never changes recorded facts; a link can be either. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-36 | 7.6 | A revision restore leaves closets and their grouping unchanged | A restore returns closets as design content | FR-22's list of restored content names proposed port assignments but not closets. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-37 | 7.7 | When two people claim one port, the first save wins and the second is kept as a pending edit in conflict | Refuse the second claim outright | FR-51 says both must not succeed silently and pending edits are retained. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-38 | 7.8 | After a removal the former port keeps its allocation until someone releases or reassigns it | Show it as Reserved | FR-53 says the port is not declared free; it does not say what it shows. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-39 | 7.8 | A proposed device with only a planned port assignment can be deleted as a draft, releasing its own reservation; a current assignment blocks deletion | Any port assignment blocks Delete draft | FR-55 asks for a dependency preview and release of the proposal's own planned reservation. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CE-40 | 7.9 | A revision restore returns proposed runs with their segments and risers and leaves existing runs unchanged | A restore leaves risers unchanged, like floors | FR-22 restores proposed routes and never changes recorded routes. | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 8: Backups and recovery (14)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CF-01 | 8.1 | "No live site passwords in backups" is tested as: no record shape has a field for one | Scan free-text notes for likely passwords | NFR-5 keeps site credentials out of backups, and free text cannot be policed by a test | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-02 | 8.2 | A Cloudflare deployment with no second bucket fails, naming it | Start with backups shown as Failed | AD-13 requires a separate backup area on Cloudflare; a deployment without one cannot meet it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-03 | 8.2 | The "before an update" backup of the last successful update is kept until the next successful update, and the one of an attempt under way until it ends | Keep only the most recent pre-update backup | AD-13 says seven "plus one"; an aborted attempt must not replace the backup that the manual way back after a broken update needs (CF-30) | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-05 | 8.3 | Archiving and un-archiving are refused while a backup or restore job for the project runs; a due backup waits for an archive | Let them interleave | AD-13 exports a project at one consistent point, so a backup or restore must hold one archive state | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-07 | 8.5 | A "before restore" backup of the working project is taken before the switch; the most recent one per project is kept in addition to the seven daily generations, is replaced by a later restore of the same project, and can be discarded by an administrator | Switch with no extra backup | FR-34 requires a backup before destructive maintenance | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-08 | 8.5 | A save from a page open before the switch is refused, shown as "not saved: project was restored", not retried | Apply it to the restored project if the base version matches | NFR-1 and NFR-2: a stale save must not silently mix lost work into the recovery point, and must stay visible | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-10 | 8.7 | The operator supplies the kept deployment key to the destination, which generates none | Destination makes a new key and re-encrypts | AD-21: the key is created only when absent | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-11 | 8.7 | Recovery also cancels invitation and password-reset links issued before it | Leave them valid until they expire | AD-13 ends every session and cancels every reviewer link on recovery; a link revoked after the recovery point would otherwise work again | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-14 | 8.8 | Catalogue entry with no backup: listed as not recovered; backup with no catalogue entry: recovered with no members | Stop the whole recovery on any mismatch | FR-34 requires restore checks and FR-68 gives access only by membership; nothing is dropped silently or opened to anyone | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-17 | 8.11 | An import gives the project a new identity and records the source's | Keep the source identity | AD-14: import creates a new project; importing twice, or beside the source, would otherwise give two projects one identity | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-18 | 8.11 | A standard user who imports becomes the new project's Editor | Import creates a project with no members | FR-68: import "follows the same rule" as project creation | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-19 | 8.12 | A replaced project keeps its identity and its members | Members are cleared and set again | Memberships are installation data and not in a portable backup (AD-14) | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-20 | 8.12 | Replacement is refused unless the backup's identity is the live project's own | Allow any backup after a typed confirmation | FR-68 separates replacing a live project from importing; the check stops the wrong project being replaced, and import as new remains | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-21 | 8.14 | A package generation that reaches the remaining budget fails there and its parts are discarded | Estimate the size by a dry run first | Volumes are generated one at a time (AD-11), so no size exists beforehand | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 9: Install from published instructions and update from the interface (10)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CF-25 | 9.6 | A release is offered only if its version is higher than the installed one | Offer the newest listed release whatever is installed | NFR-8: an installation never runs a version older than its data | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-26 | 9.6 | A failed or malformed check keeps the last good result and shows the failure time and reason | Clear the result and show "Unknown" | FR-72 shows whether a newer release exists; a failed check must not show a false or stale answer as current | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-27 | 9.7 | Update, Back up now and Restore are disabled while any of the three runs; a due daily backup waits | Queue them | AD-21 stops changes of every kind and takes one complete backup; a second maintenance job would change what that backup holds | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-28 | 9.8 | Sign-in is not offered while changes are stopped; existing sessions stay valid | Allow sign-in during the update | FR-72 stops "changes of every kind"; a sign-in writes a session and a log entry that a return would lose | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-29 | 9.8 | An edit the new version cannot accept stays listed as not saved, and the page asks for a reload without reloading itself | Reload automatically after the update | FR-21 and NFR-2 keep pending input visible; an automatic reload would discard it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-45 | 9.8 | During an update an administrator's S-35 shows the progress list instead of the full-page notice | The full-page notice for everyone | The UX full-page notice applies to every page, but FR-72 and story 9.5a show the administrator the progress of the steps | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-30 | 9.10 | Going back after an update that passed its checks is a documented command-line procedure | A "Return to previous version" control on Software | AD-20 says going back means restoring the pre-update backup with the earlier version, and the UX specifies no control for it | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-31 | 9.10 | After power loss or a killed updater: a stopping record resumes its backup; a prepared one is withdrawn; an installing one continues on the new container, returns by the arrival deadline on the old one, or starts the new image if neither runs | Always restore the backup | AD-21: a failure before installation resumes normal work; AD-20 (K20): once installing, the installation finishes or fails the update by itself | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-32 | 9.12 | The workflow asks the installation immediately before deploying; with no prepared record for its attempt it stops | Rely on cancelling the run through GitHub | AD-20: the run that will deploy asks whether its attempt still stands, and the installation answers yes only to a prepared record with that identifier | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-34 | 9.14 | Manual steps start with "Prepare for a manual update", which writes the record as stopping, stops changes, backs up and makes it prepared | Manual steps use Back up now and a hand restore, with no record | AD-20: a manual Cloudflare update starts with this step so that the manual path has the same way back | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 10: Acceptance (3)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CF-35 | 10.1 | A fixture change after confirmation makes a new manifest version and affected runs are repeated | Forbid any change | PRD says not to simplify the agreed workload to claim a pass | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-37 | 10.2 | "Controls stay usable" is measured as the 250 ms feedback target, 19 of 20, during import, analysis and export | No main-thread task over 200 ms | PRD sets 250 ms for selection and button feedback | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |
| CF-38 | 10.9 | "Same features and rules" is checked against a named list of screens and nine refusals | Repeat every story's criteria on both hosts | NFR-7 needs an observable comparison; the full runs are already repeated on the self-hosted host | Yes (Claude, accepted on Kevin's instruction, 2026-11-19) |

*Epic 11: Work with AI agents (4)*

| ID | Story | Choice | Alternative | Why | Kevin's decision |
| --- | --- | --- | --- | --- | --- |
| CG-08 | 11.1 | Removing or renaming a field of /api/v1/ needs a new version prefix | Allow changes announced in release notes | Agents built against the description break silently otherwise | Yes (Kevin, 2026-11-19) |
| CG-23 | 11.1 | The API description is served only while agent access is on, without the server's version | Always served, with the version | Avoids revealing the route surface and version of an installation that does not use agents (review A24) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |
| CG-35 | 11.2 | Refusal order on /mcp: preflight answered without a token, then 405, access off, 401 from any origin, protocol 400; no Origin refusal, because /mcp accepts no cookie and runs nothing without a token | Any order | Makes tests deterministic and lets OAuth discovery see 401 first (second review B11) | Yes (Kevin, 2026-11-19); Origin step removed after CodeRabbit's review of pull request 3 found it blocked browser preflight and OAuth discovery |
| CG-21 | 11.5 | Text a member copies from an entered-text field becomes that member's text | Copied text stays marked | The member who copies it vouches for it (review E15) | Yes (Kevin, applying the review of Epic 11, 2026-11-19) |

## Numbering changes from draft 0.6

Stories that were split, added or moved down by a split. A story not listed kept its number.

| Draft 0.6 | Draft 0.7 | Title |
| --- | --- | --- |
| 1.3 (part) | 1.3 | Sign in and sign out |
| 1.3 (part) | 1.4 | Invite a person |
| 1.4 | 1.5 | Two-step verification |
| 1.5 | 1.6 | My account and sessions |
| 1.6 | 1.7 | Projects list and creating a project |
| 1.7 (part) | 1.8 | Project membership and the access gate |
| 1.7 (part) | 1.9 | Installation roles, deactivation and the last administrator |
| 1.8 (part) | 1.10 | Administration: users |
| 1.8 (part) | 1.11 | Administration: reset links and two-step control |
| 1.8 (part) | 1.12 | Administration: projects and members |
| 1.8 (part) | 1.13 | Recovery when the only administrator is locked out |
| 1.9 | 1.14 | Activity log |
| 1.10 (part) | 1.15 | Settings: installation, sign-in and maps |
| 1.10 (part) | 1.16 | Require two-step verification for everyone |
| 1.10 (part) | 1.17 | Optional email and forgotten passwords |
| 1.10 (part) | 1.18 | Experiment R13: email by SMTP on both hosts |
| 1.10 (part) | 1.19 | Personal access tokens for agents |
| 2.2 (part) | 2.2 | Save edits to the shared project and show the save state |
| 2.2 (part) | 2.3 | Keep unsaved edits through a lost connection, lost access or an ended session |
| 2.3 | 2.4 | See other people's changes within seconds |
| 2.4 | 2.5 | Resolve a conflict without losing either edit |
| 2.5 | 2.6 | Buildings and floors on the server, with guarded deletion |
| 2.6 (part) | 2.7 | Property lookup and map views |
| 2.6 (part) | 2.8 | Import, align and lock a plan |
| 2.6 (part) | 2.9 | Plans stored on the server with their originals |
| 2.7 (part) | 2.10 | Equipment as individual records, findable across the property |
| 2.7 (part) | 2.11 | Acceptance-size test project and first timings |
| 2.8 (part) | 2.12 | Coverage computed off the main thread, with an honest status |
| 2.8 (part) | 2.13 | DORI and zone targets, with uncertain results flagged |
| 2.8 (part) | 2.14 | Sampling no coarser than 1 m, a time allowance and saved summaries |
| 2.9 | 2.15 | Cable routes on one floor |
| 2.10 (part) | 2.16 | Survey notes and measurements as separate entries |
| 2.10 (part) | 2.17 | Survey photos kept with their originals |
| 2.11 (part) | 2.18 | Undo and redo my own recent edits |
| 2.11 (part) | 2.19 | Delete an accidental draft device |
| 2.12 | 2.20 | Bring in a project saved by the prototype |
| 2.13 (part) | 2.21 | Run Site Studio on your own server over HTTPS |
| 2.13 (part) | 2.22 | Run behind your own HTTPS proxy |
| 2.13 (part) | 2.23 | Deployment key and administrator recovery on your own server |
| 2.13 (part) | 2.24 | Self-hosted smoke suite for accounts and the shared project |
| 2.14 | 2.25 | Files on the server's own disk |
| 2.15 | 2.26 | Records survive crashes and power loss |
| 3.1 (part) | 3.1 | Project frame |
| 3.1 (part) | 3.2 | Eight areas, each with its own address |
| 3.2 | 3.3 | Status language components |
| 3.3 | 3.4 | Readable text, contrast, targets and focus |
| 3.4 | 3.5 | Plan workspace regrouped |
| 3.5 | 3.6 | Equipment as a full page |
| 3.6 | 3.7 | Device inspector with tabs |
| 4.1 (part) | 4.1 | Save named revisions and list them in the Records timeline |
| 4.1 (part) | 4.2 | Compare revisions and restore one into the working design |
| 4.2 | 4.3 | More equipment types and device fields |
| 4.3 | 4.4 | Camera-model templates |
| 4.4 | 4.5 | Estimate with labour, percentage lines and subsystems |
| 4.5 | 4.6 | Capacity estimates |
| 4.6 (part) | 4.7 | Approval assignments |
| 4.6 (part) | 4.8 | Request a review, comment and decide by account |
| 4.6 (part) | 4.9 | Bypass a review, and the review state of a revision |
| 4.7 (part) | 4.10 | Reviewer links: open one revision, comment and decide |
| 4.7 (part) | 4.11 | Reviewer links: replace, revoke, expire and oversee |
| 4.8 (part) | 4.12 | Issue a design as the current reference |
| 4.8 (part) | 4.13 | Supersede an issued design and compare it with the working project |
| 4.9 | 4.14 | Cancel a proposal and correct a record |
| 4.10 (part) | 4.15 | Design package: contents drawn from a saved revision |
| 4.10 (part) | 4.16 | Design package: page layout and options |
| 4.10 (part) | 4.17 | Design package: volumes, upload and verification |
| 4.10 (part) | 4.18 | Design package: editions kept exactly |
| 5.1 (part) | 5.1 | Field shell and the issued-design chip |
| 5.1 (part) | 5.2 | Find a device in the field |
| 5.2 | 5.3 | The device sheet and the issued reference |
| 5.3 (part) | 5.4 | Mark work Installed and Configured |
| 5.3 (part) | 5.5 | Reverse a mistaken mark |
| 5.3 (part) | 5.6 | Report a change found on site |
| 5.4 (part) | 5.7 | Checklists and starters |
| 5.4 (part) | 5.8 | Checklist expectations in revisions and the Design package |
| 5.5 (part) | 5.9 | Record a check's outcome |
| 5.5 (part) | 5.10 | Attempts, retests and corrections |
| 5.5 (part) | 5.11 | Photos and notes as evidence for a check |
| 5.5 (part) | 5.12 | Large photos over a poor connection |
| 5.6 (part) | 5.13 | A change on site flags the checks it affects |
| 5.6 (part) | 5.14 | Definition changes, added checks and clearing a flag |
| 5.7 | 5.15 | Phase progress, remaining work and the contradiction warning |
| 5.8 | 5.16 | Site checks |
| 5.9 (part) | 5.17 | Raise and track issues |
| 5.9 (part) | 5.18 | Issues in remaining work, counts and the Design package |
| 5.10 (part) | 5.19 | Define a reliability period |
| 5.10 (part) | 5.20 | Start, end and stop a run |
| 5.11 (part) | 5.21 | Downtime log and availability |
| 5.11 (part) | 5.22 | The outcome of a run |
| 5.12 (part) | 5.23 | Choose Completed or Closed with outstanding items |
| 5.12 (part) | 5.24 | Close the scope and write the closeout record |
| 5.12 (part) | 5.25 | A closed scope, and a project with no active scope |
| 5.12 (part) | 5.26 | Final acceptance of the closeout record |
| 5.12 (part) | 5.27 | Closeout package |
| 5.13 | 5.28 | Lost connection and conflicts on a phone |
| 6.2 (part) | 6.2 | Choose an inventory file and sheet |
| 6.2 (part) | 6.3 | Map inventory columns |
| 6.3 (part) | 6.4 | Review import rows and match them to devices |
| 6.3 (part) | 6.5 | Apply an import and re-import safely |
| 6.4 | 6.6 | Awaiting placement, and verifying on site |
| 6.5 | 6.7 | Bulk cleanup of mistaken records |
| 6.6 (part) | 6.8 | Planned actions on existing equipment |
| 6.6 (part) | 6.9 | Current installation, Proposed design and Changes |
| 6.7 | 6.10 | Work scope categories |
| 6.8 (part) | 6.11 | Record a removal and archive the device |
| 6.8 (part) | 6.12 | Review a removal and settle its cable ends |
| 6.9 (part) | 6.13 | Restore the same device |
| 6.9 (part) | 6.14 | Reconnect a restored device, or link a replacement |
| 6.10 | 6.15 | Reopen for later work, carrying issues forward |
| 6.11 | 6.16 | Archive and un-archive a project |
| 6.12 (part) | 6.17 | Warranty records |
| 6.12 (part) | 6.18 | Service visits |
| 6.12 (part) | 6.19 | Start a service visit when no scope is active |
| 6.12 (part) | 6.20 | External tickets on issues, visits and warranties |
| 7.2 (part) | 7.2 | Pan/tilt/zoom cameras: stored positions and the resting view |
| 7.2 (part) | 7.3 | Pan/tilt/zoom cameras: reach on demand |
| 7.3 | 7.4 | Doors and gates with linked components |
| 7.4 | 7.5 | Site annotations |
| 7.5 (part) | 7.6 | Closets and port schedules |
| 7.5 (part) | 7.7 | Port claims, power and capacity |
| 7.5 (part) | 7.8 | Ports through removal, restoration and draft deletion |
| 7.6 (part) | 7.9 | Cable runs between floors through named risers |
| 7.6 (part) | 7.10 | The length ledger |
| 7.7 | 7.11 | Package sheets for the extended model |
| 8.1 (part) | 8.1 | Daily backup of each project and of the installation's data |
| 8.1 (part) | 8.2 | Backup area, kept generations and rotation |
| 8.1 (part) | 8.3 | Backups screen and backup status |
| 8.2 (part) | 8.4 | Restore a project into a separate copy and check it |
| 8.2 (part) | 8.5 | Make the checked copy current |
| 8.2 (part) | 8.6 | Experiment R3: time a full-size project restore on both hosts |
| 8.3 (part) | 8.7 | Recover a whole installation |
| 8.3 (part) | 8.8 | Recovery without the key, and backups that do not match |
| 8.3 (part) | 8.9 | Time a whole-installation recovery on both hosts |
| 8.4 (part) | 8.10 | Create and download a portable backup |
| 8.4 (part) | 8.11 | Import a portable backup as a new project |
| 8.4 (part) | 8.12 | Replace a live project from a portable backup |
| 8.4 (part) | 8.13 | Experiment R5 and moving a project between hosts |
| 8.5 | 8.14 | Limits and usage |
| 9.3 (part) | 9.3 | The update record and one version at a time |
| 9.3 (part) | 9.4 | Data conversions, the health check and the way back to backed-up data |
| 9.3 (part) | 9.5 | Experiment R14: a new runtime reads the previous release's data |
| 9.4 | 9.6 | Installed version and update check |
| 9.5 (part) | 9.7 | Update a self-hosted installation with one action |
| 9.5 (part) | 9.8 | What people see while an update runs |
| 9.5 (part) | 9.9 | Self-hosted update from the command line, and the update instructions |
| 9.6 (part) | 9.10 | When a self-hosted update fails |
| 9.6 (part) | 9.11 | Experiment R11, self-hosted: break an update at every step |
| 9.7 (part) | 9.12 | The Cloudflare update workflow |
| 9.7 (part) | 9.13 | Update a Cloudflare installation with one action |
| 9.7 (part) | 9.14 | Updating on Cloudflare by hand, and the update instructions |
| 9.7 (part) | 9.15 | Experiment R11, Cloudflare: break an update at every step |
| 10.2 (part) | 10.2 | Measure the timed operations on Cloudflare, with one user and two |
| 10.2 (part) | 10.3 | Check accuracy and arithmetic against the reference values |
| 10.2 (part) | 10.4 | Measure the long jobs and a full-size recovery on Cloudflare |
| 10.3 (part) | 10.5 | Walk the journeys and show history and outcomes are kept honest |
| 10.3 (part) | 10.6 | Show the tasks on real devices and browsers |
| 10.3 (part) | 10.7 | Show installing and updating on Cloudflare |
| 10.4 (part) | 10.8 | Repeat the acceptance run on a self-hosted installation |
| 10.4 (part) | 10.9 | Show both hosts are one product |

## Revision history

- **Draft 0.1** covered FR-1–65 for a Cloudflare-only server opened by links. It is kept beside this file as `epics-draft-0.1-pre-amendment-1.2.md.txt`.
- **Draft 0.2** was rewritten for final PRD 1.2.
- **Draft 0.3** applied the first readiness check.
- **Draft 0.4** followed architecture 3.0 and the experiments run on 2026-11-18.
- **Draft 0.5** settled the epic order with Kevin and moved the self-hosted image into Epic 2.
- **Draft 0.6** applied the first independent review: user-story sentences and Notes lines throughout, criteria moved to the stories that can test them, missing parts of requirements added, edge-case handling added.
- **Draft 0.7** applies the second independent review and Kevin's twelve decisions: contradictions between stories removed, hidden dependencies fixed, the update path on Cloudflare corrected, criteria grouped under five labels, large stories split and renumbered, and the choices reduced to those that are really open, each with an ID.
