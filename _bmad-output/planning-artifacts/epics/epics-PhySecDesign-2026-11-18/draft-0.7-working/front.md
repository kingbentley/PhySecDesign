---
title: "Site Studio — Epics and Stories"
status: draft 0.7; epic order and twelve product decisions confirmed by Kevin; story content and the remaining choices not yet confirmed
created: 2026-11-18
inputs: "final PRD 1.2; UX design specification 0.5; architecture 3.0"
method: BMAD Create Epics and Stories; reviewed twice with BMAD Review
---

# Site Studio — Epics and Stories

This document breaks [final PRD 1.2](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and experiments (R-numbers).

## Status

- **Draft 0.7**, 2026-11-18. {{N_EPICS}} epics, {{N_STORIES}} stories, {{N_CRITERIA}} acceptance criteria. Nothing here has been built.
- **Confirmed by Kevin:** the epic order, and the twelve decisions listed under [Decisions made](#decisions-made).
- **Not confirmed:** the story boundaries, the acceptance criteria, and the choices listed under [Decisions needed from Kevin](#decisions-needed-from-kevin).
- **Reviewed:** drafts 0.5 and 0.6 were each read by three independent reviewers ([review of 0.5](review-epics-draft-0.5.md), [review of 0.6](review-epics-draft-0.6.md)). Draft 0.7 applies the second review. Draft 0.7 itself has not been independently reviewed.
- **Not applied on purpose:** 30 of the 45 edge cases in the second review. They are handling for rarer situations, they remain listed in that review, and adding them all would grow the document again.
- Stories were split and renumbered in this draft. [Numbering changes from draft 0.6](#numbering-changes-from-draft-06) maps old numbers to new.

## Decisions needed from Kevin

Where no source document gave a rule or a value, the stories state one so that they can be built and tested. Each is marked on its criterion with an ID in brackets.

**1. New behaviour or restrictions that no source states ({{N_DECIDE}}).** Each needs a yes or a no.

{{T_DECIDE}}

**2. Values nobody specified ({{N_VALUE}}).** Durations, sizes, counts and wording, set to conventional defaults. They can be confirmed as a group; changing one changes only the criterion that carries its ID. They are listed in [Values and readings](#values-and-readings) at the end.

**3. Readings of a source ({{N_READING}}).** Places where a requirement could be read two ways and the stories follow one. Also listed at the end.

**4. Open points.**

- Whether a second independent review of draft 0.7 is wanted before building starts.
- The 30 edge cases left out (see Status): accept leaving them, or name the ones to add.

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

{{OVERVIEW}}

Each epic's own section states what it depends on.

## How to read it

- A story's criteria can be tested using only the stories before it.
- Each story has a user-story sentence, a **Covers** line naming the requirements, architecture decisions and experiments it delivers, and **acceptance criteria** grouped under up to five labels, always in the same order. Each criterion is one observable result.
- A **Notes** line, where present, says what the story leaves to a later story, or records an experiment's finding. It is not a criterion.
- An ID in brackets at the end of a criterion, such as (CA-03), marks a choice listed in this document.
- Criteria draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** apply to every story and are not repeated in them.

### Standing rules

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every server route sits behind the access gate (AD-12). From Epic 2 on, each story's write paths are tested as an Editor and shown to be refused for a Viewer and for a signed-in user who is not a member. A Viewer can read and export whatever a story adds, and cannot change it, unless the story says otherwise. The one exception to the refusal is story 4.6b: a Viewer who is the approval assignee can comment and decide. For a signed-in action, the actor recorded is always the signed-in account. An action through a reviewer link records the name the reviewer entered, marked not verified.
3. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
4. Fixed records and stored files are never modified (AD-3, AD-8).
5. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
6. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (architecture section 10, decision K6).
7. The server is one build for both hosts. Host-specific code lives only behind the file-store and update interfaces, and no platform feature outside the list in AD-16 is used. Server tests run in Cloudflare's runtime, and the self-hosted smoke suite is extended for each new area once story 2.13d has built it.
8. From the first published release onward, a changed record shape comes with its data conversion (AD-20). Before that release there is no earlier data to convert.
9. A story that adds a kind of record states, under Access and restore, whether a revision restore replaces it or leaves it unchanged.
10. Performance criteria are measured against the acceptance-size test project that story 2.7b generates. Until story 10.1 fixes the fixture's manifest with Kevin, those measurements guide development and are not acceptance evidence.
11. A save refused because something changed underneath it stays on the page, is not retried, and is labelled "not saved:" followed by the reason. Each story that adds a reason states its wording.

### Definition of done

A story is done when its criteria pass in Chrome against the locally run server, its automated tests pass, the self-hosted smoke suite passes once it exists, and the existing tests still pass. Where a criterion names a deployed Cloudflare test installation, another browser, or a real phone or tablet, it is tested there.
