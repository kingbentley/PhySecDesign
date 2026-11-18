---
title: "Site Studio — Epics and Stories"
status: draft 0.6; epic order confirmed by Kevin; story content revised after an independent review and not yet confirmed
created: 2026-11-18
inputs: "final PRD 1.2; UX design specification 0.5; architecture 3.0"
method: BMAD Create Epics and Stories; reviewed with BMAD Review
---

# Site Studio — Epics and Stories

This document breaks [final PRD 1.2](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and experiments (R-numbers). It adds no requirement.

## Status

- **Draft 0.6**, 2026-11-18. {{N_EPICS}} epics, {{N_STORIES}} stories. Nothing here has been built.
- **Confirmed by Kevin:** the epic order (accounts first; the self-hosted image at the end of Epic 2; extended modelling after return visits).
- **Reconciled between epics.** Each of the six parts the draft was revised in has had a second pass to agree shared wording, values and hand-overs with the others. That pass was done by the same authors; no independent reader has checked the result.
- **Not confirmed:** the story boundaries and acceptance criteria. Draft 0.6 applies the [independent review](review-epics-draft-0.5.md) of draft 0.5. The revision itself has not been independently reviewed.
- **For Kevin to confirm:** the choices listed in [Choices made in draft 0.6](#choices-made-in-draft-06), where the PRD, UX specification and architecture gave no value and a criterion needed one.
- **Not done:** sizing, which belongs to sprint planning.
- Earlier drafts are described in [Revision history](#revision-history).

## The epics

{{OVERVIEW}}

## How to read it

- **Stories** are sized to be built and verified in one sitting. A story's criteria can be tested using only the stories before it.
- Each story has a user-story sentence, a **Covers** line naming the requirements, architecture decisions and experiments it delivers, and **acceptance criteria**. Every criterion is something a tester can observe.
- A **Notes** line, where present, holds what is not a criterion: a later story that extends this one, an experiment's finding, or an action for Kevin.
- Criteria draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** apply to every story and are not repeated in them.
- [Requirement coverage](#requirement-coverage) is at the end.

### Standing rules

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every server route sits behind the access gate (AD-12). From Epic 2 on, each story's write paths are tested as an Editor and shown to be refused for a Viewer and for a signed-in user who is not a member. The one exception is story 4.6: a Viewer who is the approval assignee can comment and decide, and those tests accept the assigned Viewer and refuse any other. For a signed-in action, the actor recorded is always the signed-in account. An action through a reviewer link (story 4.7) records the name the reviewer entered, marked not verified.
3. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
4. Fixed records and stored files are never modified (AD-3, AD-8).
5. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
6. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (architecture section 10, decision K6).
7. The server is one build for both hosts. Host-specific code lives only behind the file-store and update interfaces, and no platform feature outside the list in AD-16 is used. Server tests run in Cloudflare's runtime, and the self-hosted smoke suite is extended for each new area once story 2.13 has built it.
8. From the first published release onward, a changed record shape comes with its data conversion (AD-20). Before that release there is no earlier data to convert.
9. A story that adds a kind of record states whether a revision restore replaces it or leaves it unchanged (story 4.1 sets the principle).
10. Performance criteria are measured against the acceptance-size test project that story 2.7 generates.

### Definition of done

A story is done when its criteria pass in a browser against the locally run server, its automated tests pass, the self-hosted smoke suite passes once it exists, and the existing tests still pass. Where a criterion names a deployed Cloudflare test installation or a real phone or tablet, it is tested there.
