## Order and validation

**Order, confirmed by Kevin on 2026-11-18.**

- Accounts and sign-in come first (Epic 1), then the shared project (Epic 2).
- The self-hosted image is built at the end of Epic 2, not in Epic 9.
- Extended modelling (Epic 7) stays after existing sites and return visits.

**Checks run on draft 0.6.**

| Check | Result |
| --- | --- |
| Every FR, NFR and SM appears in at least one story | Pass, by script: FR-1 to FR-72, NFR-1 to NFR-8, SM-1 to SM-6. This shows each is named, not that each Check is fully met; the independent review found parts of requirements missing in draft 0.5, and draft 0.6 adds them. |
| Every architecture decision and experiment is cited | Pass, by script: AD-1 to AD-14, AD-16 to AD-21, R1 to R16. |
| Every story has a user-story sentence, a Covers line and criteria | Pass, by script. |
| Criteria testable with earlier stories only | Revised in draft 0.6 after the review found about a dozen that were not. A script confirms that no criterion names a later story; it cannot confirm that no criterion silently needs one. A second independent read is the remaining check. |
| Starter template | Not applicable. The architecture names none; story 1.1 sets up the project around the existing prototype. |
| Records created only when needed | Pass, with one stated exception: story 1.1 creates both Durable Object classes, because the architecture fixes the classes from the first release. |
| Story size | Not settled. Stories 2.6, 2.8, 3.1, 4.10, 5.12, 6.6, 6.8, 6.12 and 7.5 are large after this revision; each is a candidate for splitting, which would renumber stories and is left for Kevin to decide. |
| Epics deliver user value | Pass for Epics 1 to 9. Epic 10 is a verification milestone, kept deliberately; its intro says why. |
| Repeated changes to the same files across epics | Considered. Epics 4 to 7 all extend the device record and the plan workspace. They are kept separate because each ends in a different demonstrable outcome and field feedback from Epic 5 can change Epics 6 and 7. |

{{COVERAGE}}

## Choices made in draft 0.6

The review found criteria that could not be tested because no document gave a value or a rule. Draft 0.6 fills each with a conventional default so that the story can be built and checked. There are {{N_CHOICES}}. They are proposals: Kevin has not confirmed them, and changing one changes only the criterion that states it.

{{CHOICES}}

## Revision history

- **Draft 0.1** covered FR-1–65 for a Cloudflare-only server opened by links. It is kept beside this file as `epics-draft-0.1-pre-amendment-1.2.md.txt`.
- **Draft 0.2** was rewritten for final PRD 1.2: an epic for accounts and administration, an epic for self-hosting and updates, recovery split from acceptance, and the stories the PRD review changed. Story numbers differ from draft 0.1.
- **Draft 0.3** applied the first readiness check: criteria that depended on later epics moved out of Epic 1, three large stories split, four UX decisions cited, and the Packages screen renumbered S-37.
- **Draft 0.4** followed architecture 3.0 and the experiments run on 2026-11-18: one server build for both hosts, the coverage sampling fix, smaller package pages with resumable upload, and Cloudflare updates through a GitHub Actions run.
- **Draft 0.5** settled the epic order with Kevin, moved the self-hosted image to story 2.13, renumbered Epic 9 and swapped stories 1.6 and 1.7.
- **Draft 0.6** applies the independent review of draft 0.5 (28 adversarial findings, 76 edge cases, 13 structure recommendations) and the automated review of the pull request. Main changes:
  - every story now has a user-story sentence, and notes are separated from criteria;
  - criteria that needed later stories moved to those stories;
  - the first work scope, the device lifecycle, the data-format version and the large test project are introduced where they are first needed (stories 2.1, 2.7, 1.1 and 2.7);
  - missing parts of requirements were added, among them closeout contents, final acceptance, schedule export, redo and analysis uncertainty;
  - handling was added for the edge cases the review listed;
  - story 2.13 was split in three, giving stories 2.14 and 2.15;
  - a Cloudflare update that fails after converting data now has a defined way back;
  - status, the epic overview and the standing rules moved to the front, and coverage tables and history to the end.
  - No existing story was renumbered.
