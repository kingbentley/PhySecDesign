## Order and validation

**Checks run on draft 0.7.**

| Check | Result |
| --- | --- |
| Every FR, NFR and SM appears in at least one story | Pass, by script. This shows each is named, not that each Check is fully met. |
| Every architecture decision and experiment is cited | Pass, by script. |
| Every story has a user-story sentence, a Covers line, grouped criteria and at most one Notes line | Pass, by script. |
| No criterion names a later story | Pass, by script. |
| No criterion silently needs a later story | Revised after the second review found 14 that did. A script cannot check this; only another independent read can. |
| Every choice ID on a criterion is listed, and every listed choice is on exactly one criterion | Pass, by script. |
| Starter template | Not applicable. The architecture names none; story 1.1 sets up the project around the existing prototype. |
| Epics deliver user value | Pass for Epics 1 to 9. Epic 10 is a verification milestone, kept deliberately. |
| Repeated changes to the same files across epics | Considered. Epics 4 to 7 all extend the device record and the plan workspace. They are kept separate because each ends in a different demonstrable outcome. |

## Requirement coverage

Generated from each story's Covers line. Where a requirement is split, the first story listed delivers its base and the later ones complete it.

{{COVERAGE}}

**Experiments**

{{EXPERIMENTS}}

**Architecture decisions**

{{ADS}}

## Values and readings

**Values nobody specified ({{N_VALUE}}).**

{{T_VALUE}}

**Readings of a source ({{N_READING}}).**

{{T_READING}}

## Numbering changes from draft 0.6

Stories that were split, added or moved down by a split. A story not listed kept its number.

{{RENUMBER}}

## Revision history

- **Draft 0.1** covered FR-1–65 for a Cloudflare-only server opened by links. It is kept beside this file as `epics-draft-0.1-pre-amendment-1.2.md.txt`.
- **Draft 0.2** was rewritten for final PRD 1.2.
- **Draft 0.3** applied the first readiness check.
- **Draft 0.4** followed architecture 3.0 and the experiments run on 2026-11-18.
- **Draft 0.5** settled the epic order with Kevin and moved the self-hosted image into Epic 2.
- **Draft 0.6** applied the first independent review: user-story sentences and Notes lines throughout, criteria moved to the stories that can test them, missing parts of requirements added, edge-case handling added.
- **Draft 0.7** applies the second independent review and Kevin's twelve decisions: contradictions between stories removed, hidden dependencies fixed, the update path on Cloudflare corrected, criteria grouped under five labels, large stories split and renumbered, and the choices reduced to those that are really open, each with an ID.
