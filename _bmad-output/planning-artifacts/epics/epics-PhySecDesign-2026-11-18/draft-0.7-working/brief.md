# Brief: revise Site Studio stories to draft 0.7

You are revising one part of a planning document (epics and user stories) for a web app, Site Studio. Draft 0.6 was independently reviewed; Kevin, the product owner, then made twelve decisions. Your job is to bring YOUR part to draft 0.7. Other agents are revising the other parts at the same time, so follow this brief exactly and edit only your own part file and choices file.

All paths below are under `/home/user/PhySecDesign/_bmad-output/planning-artifacts/`.

## Files

- Your part file and choices file (the only files you edit): in `epics/epics-PhySecDesign-2026-11-18/draft-0.7-working/`, named in your task.
- The other parts, in the same folder (`partA.md` Epic 1 · `partB.md` Epics 2–3 · `partC.md` Epic 4 · `partD.md` Epic 5 · `partE.md` Epics 6–7 · `partF.md` Epics 8–10): read-only, for consistency.
- The review to apply: `epics/epics-PhySecDesign-2026-11-18/review-epics-draft-0.6.md`. Line numbers in it refer to the assembled draft 0.6; go by story number.
- Authorities: PRD `prds/prd-PhySecDesign-2026-11-16/prd.md` (each FR has a `**Check:**`) and `addendum.md` beside it; UX `ux/ux-PhySecDesign-2026-11-18/ux-design-specification.md`; architecture `architecture/architecture-PhySecDesign-2026-11-18/architecture.md` (AD-20 and AD-21 were revised today: read them if you touch updates).

## Kevin's decisions (apply wherever your stories are affected)

1. **No active scope.** After a project's only work scope is closed and before it is reopened, an Editor can raise issues and edit warranty and service-visit records. Design edits, Installed or Configured marks, test results, removals and new revisions are refused with "not saved: no active scope — reopen first".
2. **Cloudflare update order.** On Cloudflare the control warns users, stops changes and takes the backup, and then the GitHub run verifies the signature. This is a stated difference from FR-72's order, for Cloudflare only. Self-hosted verifies first.
3. **Reviewer links expire** 30 days after creation.
4. **A reviewer link accepts several decisions**, each kept as its own entry; the latest shows as current.
5. **Archiving is refused** while a scope is In progress.
6. **First Installed mark with nothing issued:** the mark is recorded at once, online or offline. The project shows a warning "Work started with no issued design" with a link for an Editor to issue one. There is no blocking prompt. (A service scope needs no issued design at all: FR-65.)
7. **A floor held in any saved revision cannot be deleted.** Remove criteria that only make sense if such a floor could be deleted.
8. **Locked-out sole administrator:** a documented command run on the host (self-hosted) or with the Cloudflare account issues a one-time recovery code, logged. Not in the PRD; confirmed by Kevin.
9. **Partial outage in a reliability period** counts weighted by the share of covered devices affected; each downtime entry therefore records which covered devices were affected (default: all).
10. **Deleted drafts are not listed** under Historical.
11. **A mistaken cancellation or correction can be reversed** with a reason; both stay on record.
12. **Large stories are split** (see "Splitting").

Decided choices are no longer open: do not list them in your choices file.

## Fixes that follow the sources (no decision needed; apply where your stories are affected)

- **Work recorded is per device per work scope** (PRD state model), not one fact per device. Reversing a mistaken Installed mark returns an add-new device to Proposed; it never changes a device that was Existing before the scope (FR-55).
- **In-scope devices** for checks, remaining work and closeout in Epic 5 are the devices that were Proposed in the active scope, whatever their lifecycle now. Hand-set or imported Existing devices are not counted as unmarked. Story 6.7's categories refine this later.
- **A planned Remove** is completed by the recorded removal, not by an Installed mark.
- **A required reliability stage** blocks Completed whenever it "has no current Pass" (FR-64), whatever its runs' states.
- **Imported or surveyed devices start at Existing** with condition Unknown (state model).
- **Updates (K20, confirmed 2026-11-19 with seven fixes, refined by K21, confirmed 2026-11-19; replaces the pending-update marker):** one version acts at a time, by a rule in every release from story 1.1; an update record with the states stopping, prepared, installing and returning is kept in a table of the installation object that no conversion touches and no restore replaces; each object converts and returns its own data, driven by the installation object; deployments and returns use Cloudflare's `immediate` mode. An update succeeds only when every project and the installation's own data have converted and the health check has passed. A deployment never regenerates the deployment key or (once an administrator exists) the set-up code. The key is shown once at creation. On both hosts the updater or the workflow swaps code and reports; it never touches the data.
- **FR-70** lists "require or reset two-step verification" per user: the user detail offers both.

## What to apply from the review

Read all three sections of `review-epics-draft-0.6.md`.

- **Adversarial:** apply every finding that concerns your stories (D, C, F and B numbers), following the decisions above where they overlap.
- **Edge cases:** apply ONLY these numbered rows, if they concern your stories: 1, 2, 3, 13, 14, 15, 20, 21, 22, 23, 25, 39, 40, 43, 45. Leave the others; they stay on record in the review. Do not add further edge cases of your own.
- **Structure:** apply the rules under "Format" below.

## The dependency rule

A story's criteria must be testable using only stories that come before it. This includes silent dependencies: if a criterion needs a record, screen, field, state or action that no earlier story creates, either move the criterion to the story that can test it, or add a criterion to the right earlier story that creates the thing. Check every criterion against this, not just the ones the review listed. Things used must be created by some story (review finding D11 lists four that were not).

## Format

Keep `## Epic N: Title` and `### Story <id>: Title` heading forms and each story's order: heading, one-line user-story sentence (`As <role>, I want …, so that …`), `Covers:` line, criteria, optional `Notes:` line.

**Group every story's criteria under bold label lines, in this order, omitting a label that would be empty:**

```
**Core behaviour**
- …
**Refusals and edge cases**
- …
**Limits and values**
- …
**Access and restore**
- …
**Evidence to record**
- …
```

- *Core behaviour*: what the feature does when used as intended. A product owner reading only these lines must understand the story.
- *Refusals and edge cases*: refusals, conflicts, stale pages, interruptions, simultaneous actions.
- *Limits and values*: numeric limits, durations, defaults, exact wording of labels.
- *Access and restore*: what a Viewer or reviewer can do beyond the standing rule; what a revision restore does to this story's records (standing rule 9 requires one line for every story that adds a kind of record); Delete-draft eligibility.
- *Evidence to record*: experiments, timings on the fixture, fixture-script changes, real-device checks.
- A label line is plain bold text on its own line, not a heading and not a bullet. Bullets stay flat `- ` items.
- **One bullet, one observable result.** Split bullets that chain several results with semicolons.
- **Thresholds, not adjectives.** Replace "stays responsive/usable" and the like with a number or a named list.
- **Viewer bullets:** the standing rule will say "a Viewer can read and export whatever a story adds, and cannot change it, unless the story says otherwise". Delete bullets that only restate that.
- **Notes:** keep only (1) what this story deliberately leaves to a later story, as a short list with story references, and (2) experiment findings. Nothing addressed to Kevin, no restating of another story's criteria, no references to working documents ("the brief", "round 2", "shared decision N", "review finding N").
- **Story references are always written `story N.M`**, one per story: write "story 9.5 and story 9.7", never "stories 9.5 and 9.7" or "(9.5)". A script renumbers them later and can only see this form. Use the current draft 0.6 numbers for stories in other parts.
- Epic intro: `**Outcome.**`, `**Depends on.**` (true and complete, including silent dependencies), `**Why here.**` (one sentence, every epic).
- Do not duplicate a criterion another story already carries; reference it in Notes if needed.

## Splitting

A story should be buildable and checkable in one sitting: aim for at most about 12 criteria and one deliverable. Split any story of yours that is clearly larger. An experiment that needs real devices or both hosts can be its own story.

- Give the pieces the old number with letter suffixes, in build order: `### Story 4.10a: …`, `### Story 4.10b: …`. Do not renumber anything; a script renumbers every epic at the end.
- Each piece is a complete story (sentence, Covers, criteria). Together the pieces carry every FR the original carried.
- Inside your own part, refer to pieces by suffixed id (`story 4.10b`). For stories in other parts you cannot know the split yet: use the old number.
- You may also add a new story where the review shows something has no home; give it the number after which it should be built plus a suffix (for example `story 2.1a`).

## Choices file

Rewrite your choices file as rows of exactly this form, one per line, no header:

`ID | story | class | choice | alternative | why`

- `ID`: your part letter and a number, e.g. `CA-01`. Put the same ID in brackets at the end of the criterion that states the choice, e.g. `… expires after 7 days. (CA-01)`.
- `class`: `decide` (new behaviour, or a block or restriction, that no source states — Kevin must say yes or no), `value` (a figure, duration, count or wording nobody specified), or `reading` (one interpretation of a source that could be read another way).
- `choice`: the value or rule in a few words. `alternative`: the most plausible other option. `why`: one short sentence naming the source or convention; no references to working documents.
- Leave out: Kevin's twelve decisions, values a source fixes outright, and authoring matters such as which story holds a criterion.

## What to return

Edit your two files in place. Then reply briefly with:
1. Stories split or added: old id → new ids, with a five-word description of each piece.
2. Anything you moved to, or need from, a story in another part (by old number), so the other agent can be told.
3. Review findings for your stories that you did not apply, and why.
4. Count of choices by class.
Do not paste the stories back.
