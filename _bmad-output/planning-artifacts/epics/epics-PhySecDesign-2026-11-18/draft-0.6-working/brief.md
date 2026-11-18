# Brief: revise Site Studio stories to draft 0.6

You are revising one part of a planning document (epics and user stories) for a web app, Site Studio. An independent review found problems; your job is to fix the ones that concern YOUR stories. Other agents are revising the other epics at the same time, so follow the shared decisions below exactly and edit only your own part file.

## Files

- Your part file (edit in place, the only file you change besides your choices file): given in your task.
- Review findings (read all three sections; apply every finding that concerns your stories): `/home/user/PhySecDesign/_bmad-output/planning-artifacts/epics/epics-PhySecDesign-2026-11-18/review-epics-draft-0.5.md`. Line numbers in it refer to the old whole file; go by story number.
- Whole current document, for context on other epics (read-only): `/home/user/PhySecDesign/_bmad-output/planning-artifacts/epics/epics-PhySecDesign-2026-11-18/epics.md`
- Authorities (read the parts you need): PRD `/home/user/PhySecDesign/_bmad-output/planning-artifacts/prds/prd-PhySecDesign-2026-11-16/prd.md` (each FR has a `**Check:**`), its `addendum.md` beside it, UX `/home/user/PhySecDesign/_bmad-output/planning-artifacts/ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md`, architecture `/home/user/PhySecDesign/_bmad-output/planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md`.

## Hard format rules (a script parses this)

- Keep heading forms exactly: `## Epic N: Title`, `### Story N.M: Title`. Do NOT renumber or retitle existing stories. Do not delete a story. You may add new stories only at the END of an epic, and only where this brief says so.
- Each story, in this order:
  1. heading
  2. one user-story sentence: `As a <role>, I want <capability>, so that <benefit>.` (add it where missing; roles: administrator, designer (an Editor), technician (an Editor in the field), Viewer, client reviewer, organisation's administrator, Kevin as product owner for acceptance stories)
  3. a line `Covers: ...` (FR/NFR/SM numbers, AD numbers, experiments; then optional `Screens: S-..` on the same line as now). Keep it accurate after your changes: if a story newly delivers part of a requirement, add that FR to its Covers line; never remove an FR from the document's coverage.
  4. acceptance criteria as `- ` bullets. Every bullet must be something a tester can observe. Plain statements; no nested bullets.
  5. optionally one final line `Notes: ...` holding anything that is not a testable criterion: pointers to a later story that extends this one, experiment findings, context, actions for Kevin. Move existing non-criteria bullets there.
- Epic intro, in this order: `**Outcome.** ...` then `**Depends on.** ...` (state real prerequisites as story or epic numbers; say "nothing later" explicitly), then optional `**Why here.** ...`. Replace other unlabelled intro paragraphs with these.
- Plain, direct English. No new requirement numbers. Do not invent product scope beyond the PRD: a criterion must either come from the PRD/addendum/UX/architecture or be a handling rule for an edge case of something they require.
- Do not write "as in the prototype" as a criterion unless the prototype really meets the FR's Check; state the Check's behaviour instead.

## Dependency rule (the main defect to fix)

A story's criteria must be testable using only stories with a lower number. If a criterion needs a record or feature a later story introduces, remove it from your story and make sure the later story carries it (see "Cross-epic moves"). A `Notes:` pointer ("extended by story X") is allowed; a criterion that cannot yet be tested is not.

## Shared decisions (all agents follow these)

1. **Work scope.** Story 2.1 creates each new project's first work scope (named by the creator, default name "Initial design", state In progress) and every revision, estimate and evidence record carries its scope. Story 6.7 keeps scope categories, renovation/expansion scopes and one-active-scope rules for later scopes; 6.10 reopening. Stories between may refer to "the active scope".
2. **Device lifecycle.** Story 2.7 gives every device a lifecycle value (Proposed, Existing, Removed), default Proposed, and the Current/Proposed distinction. Story 5.3 adds: recording Installed on an add-new device makes it Existing, and a relocation takes its recorded location. Story 6.1 keeps existing-site inventory and the Removed handling stays in 6.8.
3. **Data-format version.** Story 1.1 makes the project room and the installation object record a data-format version and includes the conversion runner (empty list of conversions). Standing rule 7 becomes "from the first published release onward, a changed record shape comes with its conversion". Story 9.3 keeps the cross-version behaviour and tests. Story 8.4's "backup from a newer version is refused" can therefore stay.
4. **Large fixture.** Story 2.7 also delivers a script that generates the acceptance-size test project (600 devices etc. per the PRD's acceptance profile); earlier-epic performance criteria are measured against it. Story 10.1 keeps: the fixture manifest, Kevin's confirmation, and independent reference calculations for accuracy checks.
5. **Revision restore and later record types.** Story 4.1 states the principle only: restore replaces the design content held in the snapshot and nothing else, as one versioned operation limited to the active scope's revisions. Each later story that adds a record type which restore must leave alone (installed marks 5.3, checklist definitions and results 5.4/5.5, issues 5.9, cancellations and corrections 4.9, removals 6.8, PTZ presets 7.2, port assignments 7.5, archive state 6.11) carries one criterion: "a revision restore leaves <these records> unchanged".
6. **Frame save status.** Story 2.2 shows save status in a minimal status element of the existing prototype header and a list of unsaved items; story 3.1 moves it into the project frame. Epic 3 depends on: Epic 1 complete and story 2.1; 3.5 on 2.7; 3.6 on 2.3.
7. **Self-hosting split.** Story 2.13 becomes image + Compose file + HTTPS (plain HTTP redirected or refused; certificate by the bundled web server or the operator's own proxy, with the trusted-proxy setting stated). New story 2.14 "Files on the server's own disk" (disk file store, parts, range reads, hash check). New story 2.15 "Records survive crashes and power loss" (persistent volume, forced kill, experiment R12, disk-full behaviour). The self-hosted smoke suite criterion stays in 2.13.
8. **Epic 9.** Story 9.1 covers installation instructions only (both hosts); instructions for updating are criteria of 9.5 (self-hosted) and 9.7 (Cloudflare). Kevin accepted this recovery rule, which 9.3 and 9.7 must state: a server that finds data newer than itself together with a pending-update marker serves nothing except the restore of the pre-update backup, which it performs before opening any project; without the marker it refuses to start with an explanation. 9.7 also: token and release are checked before changes are stopped; if the backup fails, the run cannot be started, or no result arrives within a stated time limit, changes are accepted again and the attempt is logged; say which component verifies the signature (the workflow, per AD-21).
9. **Experiment R4** (large photo uploads on phones over poor connections) belongs to story 5.5 with a recorded result and fallback decision; 5.1 drops it.
10. **Acceptance.** The sentence "Passing stories 10.2 and 10.3 is enough to accept the proof of concept on Cloudflare" moves to the Epic 10 intro, and 10.2/10.3 gain the Cloudflare parts of the FR-66 and FR-72 Checks, the two-user conflict runs of SM-5 and NFR-4's independent arithmetic check.
11. **Access timing.** A removal, role change or deactivation takes effect on that person's next request (the architecture now says a held lookup is discarded at once). Pending edits refused for that reason stay visible as "not saved: access changed" and are not retried.
12. **Definition of done** allows, where a criterion names it, a deployed Cloudflare test installation or a real device as the place of test.

## Cross-epic moves (remove from the first story, add to the second)

| From | Criterion | To |
| --- | --- | --- |
| 1.5 | deactivating an account ends its sessions | 1.8 |
| 1.6 | project list shows scope state and last activity | 2.1 |
| 1.6 | project list shows attention count | 5.9 |
| 1.6 | update-available marker | 9.4 (as a criterion there; 1.6 gets nothing) |
| 2.5 | floor deletion blocked by a riser reference | 7.6 |
| 2.5 | floor deletion blocked by a historical (revision) reference | 4.1 |
| 2.12 | project file includes named revisions | 4.1 |
| 2.12 | project file includes costs | 4.4 |
| 4.9 | reversing a mistaken Installed mark, flagged Needs review | 5.3 (flag behaviour itself with 5.6 if it needs flags) |
| 4.7 | the unverified-name label for link decisions appears in packages | 4.10 |
| 5.13 | a save into an archived project is refused for review | 6.11 |
| 5.13 | a save onto a removed device is refused for review | 6.8 |
| 6.8, 6.9 | port dispositions on removal/restore | 7.5 |
| 5.12 | (keeps closeout) warranty details and service visits appear in the closeout record and Closeout package | 6.12 adds |
| 5.12 | removed, replaced and unresolved connection context appears in the Closeout package | 6.8 adds |
| 4.10 | Design package includes scoped checklist expectations linked by device ID | 5.4 adds |
| 5.10 | Pass/Fail outcome of a run | 5.11 (5.10 defines runs and their timing rules without an outcome) |

If you are on the receiving side, add the criterion even though the giving agent is someone else.

## Choices

Where the PRD, UX and architecture are silent and a criterion needs a concrete value or rule (password length, lock-out threshold and delay, session and invitation defaults, number of recovery codes, whether Configured requires Installed, one decision per reviewer link or several, how a partial outage counts, row limits, time limits), choose a conservative, conventional default, write it into the criterion, and record it in your choices file as one line: `story | choice made | why`. Kevin will confirm these. Prefer what the UX specification or PRD addendum implies if anything. Do not leave "a default period" style placeholders.

## What to return

Edit your part file in place. Write your choices file. Then reply with: stories changed (count), stories added (numbers and titles), criteria moved out and in under the cross-epic table (confirm each row that names your stories), any review finding for your stories that you deliberately did NOT apply and why, and anything another agent must do that the table does not cover. Do not paste the stories back.
