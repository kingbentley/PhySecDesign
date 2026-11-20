---
title: "Site Survey Design — Epics and Stories"
status: draft 0.7; epic order and twelve product decisions confirmed by Kevin; story content and the remaining choices not yet confirmed
created: 2026-11-18
inputs: "final PRD 1.2 with amendments 1.3 and 1.4; UX design specification 0.6; architecture 3.1"
method: BMAD Create Epics and Stories; reviewed twice with BMAD Review
---

# Site Survey Design — Epics and Stories

This document breaks [final PRD 1.2 with amendments 1.3 and 1.4](../../prds/prd-PhySecDesign-2026-11-16/prd.md) into work that can be built and checked one story at a time. It follows the [UX design specification](../../ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) for screens (S-numbers) and the [architecture](../../architecture/architecture-PhySecDesign-2026-11-18/architecture.md) for mechanisms (AD-numbers) and experiments (R-numbers).

## Status

- **Draft 0.7**, 2026-11-18, last changed 2026-11-19. {{N_EPICS}} epics, {{N_STORIES}} stories, {{N_CRITERIA}} acceptance criteria. Nothing here has been built.
- **Confirmed by Kevin:** the epic order, and the twelve decisions listed under [Decisions made](#decisions-made).
- **Ruled on Kevin's instruction:** on 2026-11-19 Kevin asked Claude to recommend a ruling on every open choice and to proceed with its recommendations. Every choice below now carries one in its decision column, marked as Claude's and accepted on that instruction: all 16 decisions yes, 207 values and readings as written, and two values changed (CB-07 and CB-17). Kevin can overrule any of them.
- **Not confirmed:** the story boundaries and the acceptance criteria.
- **Reviewed:** drafts 0.5, 0.6 and 0.7 were each read by three independent reviewers ([review of 0.5](review-epics-draft-0.5.md), [review of 0.6](review-epics-draft-0.6.md), [review of 0.7](review-epics-draft-0.7.md)). Draft 0.7 applies the second review. From the third, the findings on the update stories and on story 1.10d, and the structure findings on ruling (the decision column, the kind in each ID, tables by epic, experiment states), were applied on 2026-11-19; a second round on the update stories was applied the same day. The other structure findings are open.
- **Updates rewritten for K20 and K21:** on 2026-11-19 Kevin confirmed K20, the redesign of updates (AD-20 and AD-21), with seven fixes. The update stories were rewritten for it, then revised for the review's findings, which also produced K21, sixteen refinements to K20, confirmed by Kevin on 2026-11-19. A second review of the update stories led to K22, Claude's recommendations accepted on Kevin's instruction. Story 1.1, story 9.2 and story 9.3a to story 9.7d follow K21 and K22. Story 9.3a is now the update record and story 9.3b the conversions and the return. Story 9.1 and story 1.10d gained the two findings of experiment R13. The update stories as revised after the second round have not been reviewed a third time.
- **Not applied on purpose:** 30 of the 45 edge cases in the second review. They are handling for rarer situations and remain listed in that review. Leaving them out, and adding any that turn up when the story concerned is built, is Claude's recommendation, accepted on Kevin's instruction of 2026-11-19.
- **Agent access added (PRD amendment 1.3):** on 2026-11-19 Kevin approved the [sprint change proposal](../../sprint-change-proposal-2026-11-19.md) for AI agents. Story 1.1, story 1.3a, story 1.7a and story 1.9 gained route declarations, reason codes, route classes and the actor's `via` field; story 1.10e adds personal access tokens; Epic 11 adds the API description, the MCP endpoint, results and import for agents, set-up on both hosts and its acceptance. Standing rule 2 now covers tokens. These additions have not been independently reviewed. Their choices are CG-01 to CG-09: CG-01 to CG-03 were decided by Kevin in the proposal, and CG-04 to CG-09 are open.
- **External tickets added (PRD amendment 1.4):** on 2026-11-19 Kevin approved the [sprint change proposal on external tickets](../../sprint-change-proposal-2026-11-19-external-tickets.md). Story 6.12d adds external tickets on issues, service visits and warranties, and story 11.2 lets an agent find and add them. Choices CE-41 to CE-47 are Kevin's, made in that proposal. Not independently reviewed.
- **Epic 11 reviewed:** on 2026-11-19 Epic 11 and story 1.10e were reviewed with two lenses ([review of Epic 11](review-epic-11.md)): 28 adversarial findings and 37 edge cases. Kevin asked for all of them to be applied, including three new rules (CG-10 to CG-12). Story 1.1, standing rules 2 and 12, Epic 10's introduction, story 1.10e and every Epic 11 story were revised. A second review of all the agent-access and external-ticket material found 63 more problems, applied in full on Kevin's instruction with seven new rules (CG-27 to CG-31, CE-48 and CE-49). The material has not been reviewed a third time. On 2026-11-19 Kevin also ruled on the remaining open choices of agent access: CG-04 to CG-09, CG-13, CG-15, CG-19, CG-26 and CG-36 as written, and CG-16 changed to the PRD's 10 MiB inventory limit with no separate row limit.
- **Epic 1 reviewed:** on 2026-11-19 Epic 1 was reviewed with the adversarial lens ([review of Epic 1](review-epic-1.md)): 21 findings, mostly on sign-in, set-up, tokens and recovery. Kevin asked for all of them to be applied with Claude's recommendations. Fourteen stories from story 1.2 to story 1.10e were revised (all of Epic 1 except story 1.1, story 1.7b, story 1.8c, story 1.10b and story 1.10d), standing rule 2 extended, standing rules 13 and 14 added, CA-13 widened and CA-43 to CA-58 added, each marked as Claude's recommendation accepted on Kevin's instruction. Not reviewed a second time.
- **Browser tests added (K24):** on 2026-11-20 Kevin approved the [sprint change proposal on browser tests](../../sprint-change-proposal-2026-11-20-browser-tests.md). Standing rule 15 and the definition of done now require Playwright browser tests, in desktop Chromium and in WebKit with an iPhone viewport, with an axe check on each new screen. Story 1.2 sets them up; story 1.1's wording, and the Notes of story 3.3 and story 10.3b, were adjusted. No story was added or renumbered. Not independently reviewed.
- Stories were split and renumbered in this draft. [Numbering changes from draft 0.6](#numbering-changes-from-draft-06) maps old numbers to new.

## Decisions needed from Kevin

Where no source document gave a rule or a value, the stories state one so that they can be built and tested. Each is marked on its criterion with an ID in brackets. Each now has a ruling in its decision column (see Status); the section keeps its name so that links to it still work.

**1. New behaviour or restrictions that no source states ({{N_DECIDE}}).** Each needed a yes or a no.

{{T_DECIDE}}

**2. Values nobody specified ({{N_VALUE}}).** Durations, sizes, counts and wording, set to conventional defaults. They can be confirmed as a group; changing one changes only the criterion that carries its ID. They are listed in [Values and readings](#values-and-readings) at the end.

**3. Readings of a source ({{N_READING}}).** Places where a requirement could be read two ways and the stories follow one. Also listed at the end, grouped by epic, each with a column for Kevin's decision. They can be confirmed as a group or epic by epic; changing one changes only the criterion that carries its ID.

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

{{OVERVIEW}}

Each epic's own section states what it depends on.

## How to read it

- A story's criteria can be tested using only the stories before it.
- Each story has a user-story sentence, a **Covers** line naming the requirements, architecture decisions and experiments it delivers, and **acceptance criteria** grouped under up to five labels, always in the same order. Each criterion is one observable result.
- A **Notes** line, where present, says what the story leaves to a later story, or records an experiment's finding. It is not a criterion.
- An ID in brackets at the end of a criterion, such as (CA-03 · value), marks a choice listed in this document and says its kind: a decision (new behaviour, yes or no), a value, or a reading. The letter after C names the part of the plan it was written in: A for Epic 1, B for Epics 2 and 3, C for Epic 4, D for Epic 5, E for Epics 6 and 7, F for Epics 8 to 10, G for agent access (story 1.10e and Epic 11).
- Criteria draw on each requirement's Check in the PRD, which remains the authority. Where a story lists a requirement, its full Check applies even if the criteria here summarise it.
- **Standing rules** apply to every story and are not repeated in them.

### Standing rules

1. Every change is saved through a versioned operation or an append-only entry (AD-5). No story adds a way to edit a record without a base version.
2. Every server route sits behind the access gate (AD-12). From Epic 2 on, each story's write paths are tested as an Editor and shown to be refused for a Viewer and for a signed-in user who is not a member. A Viewer can read and export whatever a story adds, and cannot change it, unless the story says otherwise. The one exception to the refusal is story 4.6b: a Viewer who is the approval assignee can comment and decide. For a signed-in action, the actor recorded is always the signed-in account. An action through a reviewer link records the name the reviewer entered, marked not verified. Calls from the update workflow and the updater are a fourth kind of route, checked by the gate with the update secret (AD-20). Every route declares its class (AD-22). From Epic 2 on, each story's write routes are also called with a read-and-draft access token and shown to succeed, unless the route is person only, when the token is refused with "needs a person"; and called with a read-only token and shown to be refused. An action made with a token records its owner with `via` naming the token, and wherever a story shows or exports an actor, such an action shows the owner and "via agent" with the token's name. Approving or deciding a review, bypassing, issuing or designating, closing out or reopening a scope, recording a test outcome, an installed mark or a verified observation, archiving or un-archiving, restoring, creating a reviewer link, creating a project, downloading a portable backup, permanently removing files or a project, undoing a change, creating, renaming or revoking an access token, and every change to one's own account (name, password, two-step verification, recovery codes, ending sessions) are person-only routes (FR-75). An agent may request a review; its assignee is a person. A deletion made with a token can be reversed by a person. A change made with a token to any field of a verified device clears its verified state. Each new administrator-only route is shown to refuse an administrator's token, each new reviewer-link route to refuse any token, and each write route to refuse a read-and-draft token on a project where its owner is a Viewer.
3. Every status shown uses the status language (UX section 6): a label and a shape as well as a colour. Unknown, estimated, not assessed and incomplete are shown as such, never as blank or zero.
4. Fixed records and stored files are never modified (AD-3, AD-8).
5. New screens meet the visual foundation (UX section 10): text sizes, 4.5:1 text contrast, visible focus, and 44 px targets on the field shell.
6. Rules that span the browser and the server are written once in the shared module, in TypeScript, with tests (architecture section 10, decision K6).
7. The server is one build for both hosts. Host-specific code lives only behind the file-store and update interfaces, and no platform feature outside the list in AD-16 is used. Server tests run in Cloudflare's runtime, and the self-hosted smoke suite is extended for each new area once story 2.13d has built it.
8. From the first published release onward, a changed record shape comes with its data conversion (AD-20). Before that release there is no earlier data to convert, and a change of record shape re-creates development and test installations instead of converting them. A conversion is the one permitted change to the shape of a fixed record: its content and its files are unchanged.
9. A story that adds a kind of record states, under Access and restore, whether a revision restore replaces it or leaves it unchanged.
10. Performance criteria are measured against the acceptance-size test project that story 2.7b generates. Until story 10.1 fixes the fixture's manifest with Kevin, those measurements guide development and are not acceptance evidence.
11. A save refused because something changed underneath it stays on the page, is not retried, and is labelled "not saved:" followed by the reason. Each story that adds a reason states its wording. An answer of "updating, try again shortly" is not a refusal: the edit stays unsaved and is sent again automatically, as after a lost connection (AD-20). So are the refusals of data newer or older than the server during or after an update.
12. A reply value whose source is not a member of the project, or that an agent added, is returned in the entered-text wrapper of story 1.1 with its source: reviewer-link entries, imported content (which keeps the source "import" after it is applied), names of uploaded files, text read from PDF plans, and anything a token wrote. A value a member edits becomes that member's. Sources and references survive restore and backup. A refusal names a field but never repeats an entered value (AD-22).
13. Every request that changes anything with a session cookie, and every request made before a session exists that creates a session or changes an account (sign-in, set-up, accepting an invitation, using a reset link, using a recovery code), is refused unless it comes from the app's own origin and carries the header the app adds (AD-12). Each story that adds such a request tests the refusal. Token requests are exempt, as story 1.10e states.
14. A secret carried in a link (an invitation or a reset link) holds at least 32 random bytes, and the administrator recovery code of story 1.8d at least 20 random characters. The server stores only its SHA-256 hash. The page that opens a link is served with `Referrer-Policy: no-referrer` and removes the secret from the address bar once it is read, and no log, record or export contains it. (CA-55)
15. From story 1.2 on, a story that adds or changes a screen adds browser tests with Playwright, in `site-studio/browser-tests/`. They cover its Core behaviour flows on that screen and at least one refusal or error that the screen shows. They run against the built app served locally by Cloudflare's runtime, in desktop Chromium and in WebKit with an iPhone viewport, on every push and pull request. Each screen a story adds also passes an axe accessibility check with no serious or critical violations. Rules and edge cases stay in the server tests. A criterion that names a real device, another browser or a deployed installation is still checked there (story 10.3b). (Architecture K24.)

### Definition of done

A story is done when its criteria pass in Chrome against the locally run server, its automated tests pass, its browser tests pass in desktop Chromium and in WebKit with an iPhone viewport (standing rule 15), the self-hosted smoke suite passes once it exists, and the existing tests still pass. Where a criterion names a deployed Cloudflare test installation, another browser, or a real phone or tablet, it is tested there.
