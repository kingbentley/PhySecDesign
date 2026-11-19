# Implementation readiness — 2026-11-18

Result of the readiness gate in the BMAD `bmad-sprint-planning` skill (6.12.4), run in a Claude Code cloud session. The gate asks one question: could a developer implement these epics without inventing decisions nothing records?

**Verdict of the first run: CONCERNS.** The plan is buildable. A second run, after the epic order was settled, is recorded below. Kevin chose to fix the quick items and then generate the sprint tracking file.

Artifacts read: [final PRD 1.2](prds/prd-PhySecDesign-2026-11-16/prd.md), the [UX design specification](ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md) draft 0.5, the [architecture](architecture/architecture-PhySecDesign-2026-11-18/architecture.md) 2.1 and the [epics](epics/epics-PhySecDesign-2026-11-18/epics.md). The project has no `docs` folder.

## What traced cleanly

- Every FR-1–72, NFR-1–8 and SM-1–6 is named by at least one story, and every story names what it covers (checked by script).
- Every architecture decision AD-1–21 and every early experiment R1–R12 is cited by a story.
- Every screen number the stories cite exists in the UX specification, and every UX screen is cited.

## Concerns and what was done

| # | Concern | Outcome |
| --- | --- | --- |
| 1 | The epics are a draft that Kevin has not reviewed and that has had no independent review. Their order (accounts first) differs from the architecture's suggested order (project foundation first). Three ordering questions are open. | Open. Accepted for now; the tracking file can be regenerated after any reorder. |
| 2 | Three Epic 1 stories had criteria that could only be tested after later epics (a Viewer downloading a package; stored size per project; storage usage). | Fixed in epics draft 0.3: the criteria moved to the stories that can test them. |
| 3 | The architecture defers database tables, request formats, error codes and password and session figures to the first implementation stories. Experiments R1, R6, R8, R9, R10, R11 and R12 can each change a story's approach. | Open by design. Each experiment is attached to the first story that depends on it. |
| 4 | UX decisions D8, D9, D13 and D14 were implemented by stories but not cited. Screen number S-21 was used for both revision comparison and packages. | Fixed: citations added; Packages is now S-37 in the UX specification and the stories. The canvas artboard is still titled S-21. |
| 5 | Three stories were large: approvals and reviewer links, the reliability period, and the self-hosted update. | Fixed: each split in two. The epics now hold 87 stories. |
| 6 | The design canvas held a "Doors" screen that this session did not create, and several screens were specified but not drawn. | Resolved after the gate: a second planning session had added seventeen screens, including Doors and gates, and eight screens for a planned schedule feature that is not in the PRD. They are listed in the UX workspace's `design-canvas.md`. This session has not opened them. |

## After the gate

On 2026-11-18 six architecture experiments were run early and Kevin made three decisions (one server build for both hosts; packages stay in the browser with smaller pages; Cloudflare updates through a GitHub Actions run). The architecture moved to 3.0 and the epics to draft 0.4. Concern 3 is partly discharged: experiments R1, R2, R6, R7, R8 and R10 are done, and R3 to R5, R9 and R11 to R16 remain attached to their stories. The gate was not rerun.

## Second run of the gate

Run on 2026-11-18 with the same skill, after Kevin settled the epic order and the epics moved to draft 0.5. Artifacts read: final PRD 1.2, the UX design specification draft 0.5, the architecture 3.0 and the epics draft 0.5.

**Verdict: CONCERNS, narrower than the first run.** Nothing found blocks building story 1.1.

Closed since the first run:

- Concern 1, the order. Kevin confirmed accounts first, moved the self-hosted image to story 2.13 and left extended modelling after return visits. The architecture's suggested build order (section 14) agrees on accounts and now records the move.
- Criteria that depended on later stories. Applying the BMAD epic-design and validation rules found eight; all were moved to the story that can test them. The remaining mentions of a later story say that it extends the earlier one.

Found and fixed in this run:

- The epics cited an architecture decision, AD-15, that architecture 3.0 does not contain. The rule it stood for (shared rules written once, in TypeScript) is in architecture section 10 under decision K6, and the two citations now point there. Architecture 3.0 has 20 numbered decisions: AD-1 to AD-14 and AD-16 to AD-21.

Checked by script and clean: every FR-1–72, NFR-1–8 and SM-1–6 is covered; every architecture decision and every experiment R1–R16 is cited; every screen and every UX decision D1–D14 the stories cite exists, and none is uncited; every story reference points to an existing story.

Still open:

| # | Concern | Where it lives |
| --- | --- | --- |
| A | No one other than the author has reviewed the 87 stories. Kevin confirmed their order, not their content. | The epics. `bmad-review` can give an independent read. |
| B | Ten experiments remain (R3, R4, R5, R9, R11 to R16). Each can change the approach of the story it is attached to; R11 and R14 bear on whether an update can be undone. | Architecture section 12; each is named in a story. |
| C | Tables, request formats, error codes, and password, lock-out and session figures are decided in the first stories that need them. | Architecture section 15, by design. |
| D | Epic 10 is a verification milestone, not user value, and Epics 4 to 7 all extend the same device record and plan workspace. Both are kept deliberately. | The epics, "Order and validation". |
| E | The eight screens for a planned schedule feature are on the design canvas but in no requirement or story. | UX workspace, `design-canvas.md`. Out of scope until the PRD is amended. |

## Tracking

`_bmad-output/implementation-artifacts/sprint-status.yaml` is generated by the skill's script from the epics and was regenerated after draft 0.5: 10 epics, 87 stories, all in backlog, with one optional retrospective per epic. It validates. Ten entries were renamed by the renumbering; all were in backlog, so no status was carried across.

## After the second run

An independent review of the stories was run on 2026-11-18 (concern A) and is recorded in [review-epics-draft-0.5.md](epics/epics-PhySecDesign-2026-11-18/review-epics-draft-0.5.md). It found that draft 0.5 still had criteria needing later stories, parts of requirements in no story, and many unhandled cases, so the "Pass" this report gave on story dependencies was wrong. Epics draft 0.6 was written in response and now has 89 stories; the tracking file was regenerated. Draft 0.6 is not finished (see its Status section), and the gate has not been rerun on it.

A second independent review, of draft 0.6, is recorded in [review-epics-draft-0.6.md](epics/epics-PhySecDesign-2026-11-18/review-epics-draft-0.6.md). Epics draft 0.7 answers it and Kevin's twelve decisions of 2026-11-18: 165 stories after splitting, renumbered, with the tracking file regenerated. The gate has not been rerun on draft 0.7.

## Third run of the gate

Run on 2026-11-19 with the same skill, in a local Claude Code session, on Kevin's instruction to proceed with Claude's recommendations. Artifacts read: final PRD 1.2, the UX design specification 0.5, the architecture 3.0 with K19 to K22, and the epics draft 0.7 as last changed on 2026-11-19 (165 stories, 2,155 criteria).

**Verdict: CONCERNS, narrower again.** Nothing found blocks building story 1.1.

Closed since the second run:

- Concern A, no independent review. Draft 0.7 was reviewed by three lenses ([review-epics-draft-0.7.md](epics/epics-PhySecDesign-2026-11-18/review-epics-draft-0.7.md)), and the update stories by a second round of two. The findings that bear on building were applied; the update design they needed is K21, confirmed by Kevin, and K22, accepted on his instruction.
- Open choices. Every decision, value and reading now carries a ruling: Kevin's twelve of 2026-11-18, and Claude's recommendations for the rest, accepted on Kevin's instruction of 2026-11-19 and marked as such.

Checked by script and clean: every FR-1–72, NFR-1–8 and SM-1–6 is covered; every architecture decision and experiment R1–R16 is cited; no criterion names a later story; every choice on a criterion is listed and every listed choice is on a criterion.

Still open:

| # | Concern | Where it lives |
| --- | --- | --- |
| A | The update stories as revised after the second review round have not been read a third time. Story 1.1 also changed (the version rule and the alarm schedule). | The epics; a narrow `bmad-review` of story 1.1 and Epic 9 would close it. |
| B | Experiments still to run, each attached to its story with a fallback: R3, R4, R5, R12, R15, R16, the rest of R11, a full delivery for R13, and R14 repeated each release. R11 decides whether the Update control is released. | Architecture section 12. |
| C | Tables, request formats, error codes, and password, lock-out and session figures are decided in the first stories that need them. | Architecture section 15, by design. |
| D | Most rulings on open choices are Claude's, accepted on Kevin's instruction rather than made by him item by item. He can overrule any of them; each changes only the criterion that carries its ID. | The epics, decision columns. |
| E | Epic 10 is a verification milestone, and Epics 4 to 7 extend the same records; both kept deliberately. The eight schedule screens on the design canvas are in no requirement. | The epics, "Order and validation"; UX `design-canvas.md`. |
| F | Optional structure findings S5 and S7 to S11 and S15 are not applied. | The review of draft 0.7. |

Tracking was regenerated after this run.

## Fourth run of the gate

Run on 2026-11-19 with the same skill, in a local Claude Code session, after Kevin approved the [sprint change proposal](sprint-change-proposal-2026-11-19.md) for agent access. Artifacts read: PRD 1.2 with amendment 1.3, the UX design specification 0.6, the architecture 3.1 with AD-22 and K23, and the epics draft 0.7 as changed for agent access (11 epics, 174 stories, 2,238 criteria).

**Verdict: CONCERNS, unchanged in kind.** Nothing found blocks building story 1.1.

What the change touched and how it was checked:

- The PRD's FR-73 to FR-77, NFR-5 as amended and SM-7 trace to story 1.19 and Epic 11. The architecture's AD-22 and experiments R17 and R18 are cited by stories. The assembler's checks, extended to these IDs, pass with no problem.
- Story 1.1 now also declares every route under `/api/v1/` with a schema and gives every refusal a reason code. Story 1.3 limits the origin rule to sessions. Story 1.8 adds route classes and the actor's `via` field. These agree with AD-12 and AD-22 as revised, and none depends on a later story.
- Epic 11 depends on Epics 1 to 8 only. Epic 10's acceptance of the proof of concept does not depend on it, and the PRD says SM-7 is shown in that epic.

Still open, in addition to concerns A to F of the third run:

| # | Concern | Where it lives |
| --- | --- | --- |
| G | Amendment 1.3, AD-22, UX section 18, story 1.19 and Epic 11 have not been independently reviewed. | A `bmad-review` of those parts would close it. |
| H | Choices CG-04 to CG-09 (rate limit, a request with two identities, the token format, how long revoked tokens stay listed, the API versioning rule, and jobs for long calculations) carry no ruling yet. None is needed by story 1.1. | The epics, values and readings tables. |
| I | Screens S-38 to S-40 are specified but not drawn on the design canvas. | UX `design-canvas.md`. |
| J | Experiments R17 and R18 are to run, each attached to its story in Epic 11 with a fallback. | Architecture section 12. |

Tracking was regenerated after this run: 11 epics and 174 stories, all in backlog.

### Addendum to the fourth run: external tickets

Later on 2026-11-19 Kevin approved the [sprint change proposal on external tickets](sprint-change-proposal-2026-11-19-external-tickets.md). PRD amendment 1.4 adds FR-78, traced to story 6.20 and to a criterion in story 11.2; AD-22 gains the rule that links are never fetched; UX section 19 extends existing screens. The assembler's checks, extended to FR-78, pass with no problem. The verdict is unchanged: CONCERNS, nothing blocking story 1.1. Concern G now also covers amendment 1.4, UX section 19 and story 6.20, none independently reviewed. Tracking was regenerated: 11 epics and 175 stories, all in backlog.

### Second addendum to the fourth run: review of Epic 11

Later on 2026-11-19 a BMAD review of Epic 11 and story 1.19 ([review](epics/epics-PhySecDesign-2026-11-18/review-epic-11.md)) found 65 problems, all applied on Kevin's instruction. Story 1.1 now also declares an entered-text field type, which standing rule 12 makes every later story use; this is small and blocks nothing. The verdict is unchanged: CONCERNS, nothing blocking story 1.1. Concern G narrows to the revised stories, which have not been reviewed again; concern H now covers CG-04 to CG-09 and CG-13, CG-15, CG-16, CG-19 and CG-26.
