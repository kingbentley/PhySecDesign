# Addendum polish review — amendment 1.1

Review of `addendum.md` run on 2026-11-18 with `skill:bmad-review lenses=structure,prose`. Content class: document (docs). Lenses run: structure, then prose on top of the structure findings. Customization resolved with the installed resolver: reader type humans, style guide Microsoft Writing Style Guide, output format both, no review guidance, no report path (written here at the caller's request).

**Scope.** Only the material added for amendment 1.1 and how it sits in the document: the opening lines (1–16), the "Unissued proposed device" row (line 534), and the section "Proposed amendment 1.1 — reference-based additions" (lines 792–833). The rest was skimmed for context. The word "Proposed" in the section heading and intro is being changed by the parent and is not reported. `addendum.md` was not edited.

**Purpose and audience read.** This document exists to help Kevin and downstream UX, architecture and engineering collaborators look up the accepted domain models, technical detail and evidence boundaries behind the PRD's requirements.

**Structure model.** Strategic/Context (Pyramid), read by random access per section. The amendment section fits it: a status line, then the sources and their limits, then one subsection per requirement.

**Style choices preserved.** Compact declarative prose; FR cross-references in headings and bold bullet labels; tables for comparisons; explicit statements of what is not claimed; "Kevin" named as the decision maker; Patterson referred to by surname.

**Word counts (word_metrics.py).** Document 19,472 words. Amendment section 919 words: intro 48, references 151, FR-63 128, FR-64 129, FR-65 127, small additions 90, clarifications 165, device state model 81.

**Anchor note.** Replacements that link to the amendment section use `#amendment-11--reference-based-additions`, which assumes the parent renames the heading to "Amendment 1.1 — reference-based additions". If the heading keeps another wording, the anchor must follow it (the current heading's anchor is `#proposed-amendment-11--reference-based-additions`).

## Findings table

| # | Pass | Line | Original Text | Revised Text | Changes |
| --- | --- | --- | --- | --- | --- |
| 1 | structure | 15–16 (section list) and 3 | The section list at lines 5–16 has no entry for the amendment section; line 15 `- [POC acceptance and operating targets](#poc-acceptance-and-operating-targets)` is followed directly by line 16 `- [Downstream responsibilities and evidence boundaries](#downstream-responsibilities-and-evidence-boundaries)`. Line 3 mentions the section without linking it: `a section on proposed amendment 1.1 was added on 2026-11-18.` | MOVE (surface the section in the list). Insert between lines 15 and 16: `- [Amendment 1.1 — reference-based additions](#amendment-11--reference-based-additions)`. In line 3, link the mention: `a section on [amendment 1.1](#amendment-11--reference-based-additions) was added on 2026-11-18.` | The list is the document's only navigation and every other level-2 section is in it; the newest section is the one a returning reader looks for and is the only one missing. (+6 words) |
| 2 | structure | 812 | `It differs from the source deliberately: nothing is prescribed, where he describes about 30 days in two phases; it warns and records but never blocks starting or continuing a run, where he requires all deficiencies corrected first and no repairs without written permission, while a required stage that has not passed still prevents Completed under FR-32; and availability is defined as time not down divided by total elapsed time, where his printed formula can be read two ways.` | CONDENSE into a list (same content). Replace the sentence with: `It differs from the source deliberately in three ways:` then a blank line and three bullets: `- **Duration.** Nothing is prescribed; Patterson describes about 30 days in two phases.` / `- **Blocking.** The requirement warns and records but never blocks starting or continuing a run; Patterson requires all deficiencies corrected first and no repairs without written permission. A required stage that has not passed still prevents Completed under FR-32.` / `- **Formula.** Availability is defined as time not down divided by total elapsed time; Patterson’s printed formula can be read two ways.` Keep the paragraph's first two sentences before the list and its last sentence (`People enter every start, end and outage, …`) as a paragraph after it. | One 77-word sentence carries three requirement-versus-source contrasts and a fourth embedded clause (`while a required stage…`) whose attachment is unclear; "he" has only the possessive "Patterson’s" two sentences earlier as an antecedent. A list makes each contrast findable and names the source. (about +8 words) |
| 3 | structure | 534, 824 | Line 534: `(proposed amendment 1.1)` with no link. Line 824: `apart from one narrow FR-55 cancellation exception adopted afterwards,` with no pointer to where the exception is stated. | MOVE (cross-reference, no content moved). Line 534: `([amendment 1.1](#amendment-11--reference-based-additions))`. Line 824: `apart from one narrow FR-55 cancellation exception adopted afterwards (the Unissued proposed device row in [Choose the action from the record’s history](#choose-the-action-from-the-records-history)),` | The exception is defined only in the table row 290 lines earlier, and the amendment section refers to it without saying what or where it is. Links in both directions let a reader of either place reach the other. (+12 words) |
| 4 | prose | 808 | `Two sources, Patterson in two places and the government assessment guide, assumed such cameras while the requirements gave every camera one fixed aim.` | `Two sources, Patterson in two places and the Department of Energy guide, assumed pan/tilt/zoom cameras, while the requirements gave every camera one fixed aim.` | "such cameras" has no antecedent in the body text (only the heading); "the government assessment guide" is named differently from the source table eight lines above. Comma added before the contrast clause. |
| 5 | prose | 808 | `For each location it shows the best detail achievable at the narrowest field of view that can still include that location within the camera’s limits; near a pan or tilt limit only a wider view may include it.` | `For each location, the reach layer shows the best detail achievable at the narrowest field of view that can still include that location within the camera’s limits; near a pan or tilt limit, only a wider view may include the location.` | The two "it"s refer to different things (the layer, then the location). Named both; added the commas after the introductory phrases. |
| 6 | prose | 816 | `A service call after closeout reopens the project into a work scope marked as service through one action, after un-archiving it first if it was archived, so no separate service track exists; each such scope ends with its own closeout record.` | `For a service call after closeout, one action reopens the project into a work scope marked as service (an archived project is un-archived first), so no separate service track exists; each such scope ends with its own closeout record.` | "through one action" trailed the phrase it modifies and read as "marked as service through one action"; "after … first" was doubled; "it" could be the scope or the project. |
| 7 | prose | 833 | `The model in the PRD’s Terms section consolidates states that the requirements already use, for the architecture stage that the handoff asks to decide lifecycle identities.` | `The device state model in the PRD’s [Terms and lifecycle rules](prd.md#terms-and-lifecycle-rules) section consolidates states that the requirements already use. It is there for the architecture stage, which the handoff asks to decide lifecycle identities.` | The trailing "for the architecture stage that the handoff asks to decide…" clause is hard to attach. Split into two sentences, named the model and linked the PRD section by its actual title. |
| 8 | prose | 808 | `Reach is a separate reachable-on-demand layer and earns no credit.` and `Reach reuses the existing visibility calculation swept across the pan and tilt limits from the mounting point.` | `Reach is a separate reachable-on-demand layer and is never counted as covered.` and `Reach reuses the existing visibility calculation, swept from the mounting point across the pan and tilt limits.` | "earns no credit" is undefined shorthand; the PRD's Terms entry for Reach says "never counted as covered". In the second sentence the comma and reordering stop "limits from the mounting point" reading as one phrase. |
| 9 | prose | 822, 824 (depends on 794) | `### Clarifications adopted from the parallel session` and `where the parallel session disagreed with it` — "parallel session" is defined nowhere in the addendum; its only other use is line 794, `They were confirmed by Kevin in a parallel session`, which the parent is rewriting. | Consider: when rewriting line 794, keep one defining clause on first use, for example `a parallel planning session that worked from an earlier draft without knowledge of PRD 1.0 (the “parallel session”)`? Lines 822 and 824 can then stay as they are. | The term is process shorthand explained only in `prd.md` line 721 and `amendment-1.1-status.md`. If the rewrite of line 794 drops it, the heading and line 824 refer to something the document never introduces. Wording of the gloss is the parent's; the facts are taken from `prd.md` line 721. |
| 10 | prose | 534 | `As above, cancellation is not actual removal, a failed test or an approval of the changed design.` | `Cancellation is not actual removal, a failed test or an approval of the changed design.` | "As above" in a table cell depends on row order; the sentence stands alone. |
| 11 | prose | 829 | `**Cancelled and corrected records (FR-8/41).** They stay listed and searchable with their reason,` | `**Cancelled and corrected records (FR-8/41).** These records stay listed and searchable with their reason,` | A sentence opening with a pronoun whose antecedent is the bold label; the other three bullets open with a noun. |
| 12 | structure | 820 | §Small additions — one paragraph holding five unrelated per-requirement additions (`The optional camera checks in FR-29 include two … FR-43 gains … FR-7 gains … FR-20 gains … FR-18 gains …`). | Consider: CONDENSE into a five-item list keyed by requirement, matching the bold-label bullets of the next subsection? `- **FR-29.** The optional camera checks include two that complement the model in the field without verifying a DORI level: a person at the far end of the view, and a person behind an obstruction or in its shadow. They sit beside the modeled estimate and never alter it.` / `- **FR-43.** Optional checks for alarm-to-camera call-up and handover.` / `- **FR-7.** Camera enclosure type and alarm interface.` / `- **FR-20.** Survey prompts that are observations only.` / `- **FR-18.** Percentage lines with a stated base and subsystem subtotals that never change the total.` | Readers arrive here looking for one FR; four short "FR-n gains…" sentences in a row are a list written as a paragraph. Optional: the paragraph is short and readable as it is. (about −8 words) |
| 13 | structure | 792–833, 798–802 | The amendment section sits as its own level-2 section before "Downstream responsibilities and evidence boundaries", organized by provenance (one amendment) while the rest of the document is organized by domain. The source table repeats limits that the reference digest also holds. | PRESERVE both. | Folding the notes into the domain sections would hide what 1.1 changed and scatter the stated source limits; a single section is easier to audit and to cite from the PRD. The table's "Limit" column is the reason no compliance claim is made, so it is reinforcement rather than redundancy. (0 words) |

## Structure summary

Five structure recommendations: one missing navigation entry (1), one sentence reshaped as a list (2), one pair of cross-references (3), one optional list conversion (12) and one explicit preserve (13). No cuts are recommended. If all are accepted the document grows by about 18 words (under 0.1% of 19,472; about 2% of the 919-word amendment section). No length target was given. No comprehension trade-offs: nothing a human reader relies on is removed.

Overlap between lenses: finding 2 (structure) also resolves the weak "he"/"his" antecedents in line 812 that the prose pass would otherwise have reported, so the prose pass has no separate row for that sentence. Findings 3 and 10 both touch line 534 and do not conflict.

## Prose summary

Eight prose rows (4–11). None changes meaning. Rows 4–7 fix sentences a reader has to re-read; rows 8, 10 and 11 are small; row 9 is a dependency on the parent's rewrite of line 794 rather than a fix to apply now. Nothing else in the scoped material impedes comprehension: the intro to the references table, the table itself, line 804, the warranty paragraph apart from row 6, and bullets 826–828 read cleanly.

## Findings as JSON

The editorial lenses declare their own findings shape (the table above); the array carries the same rows in the same order.

```json
[
  {
    "lens": "structure",
    "location": "addendum.md:15-16 (section list), addendum.md:3",
    "tag": "MOVE",
    "original_text": "Section list at lines 5-16 has no entry for the amendment section; line 3: \"a section on proposed amendment 1.1 was added on 2026-11-18.\"",
    "revised_text": "Insert between lines 15 and 16: \"- [Amendment 1.1 — reference-based additions](#amendment-11--reference-based-additions)\". Line 3: \"a section on [amendment 1.1](#amendment-11--reference-based-additions) was added on 2026-11-18.\"",
    "changes": "Every other level-2 section is in the list; the new one is missing. Anchor must match the final heading. +6 words."
  },
  {
    "lens": "structure",
    "location": "addendum.md:812",
    "tag": "CONDENSE",
    "original_text": "It differs from the source deliberately: nothing is prescribed, where he describes about 30 days in two phases; it warns and records but never blocks starting or continuing a run, where he requires all deficiencies corrected first and no repairs without written permission, while a required stage that has not passed still prevents Completed under FR-32; and availability is defined as time not down divided by total elapsed time, where his printed formula can be read two ways.",
    "revised_text": "It differs from the source deliberately in three ways:\n\n- **Duration.** Nothing is prescribed; Patterson describes about 30 days in two phases.\n- **Blocking.** The requirement warns and records but never blocks starting or continuing a run; Patterson requires all deficiencies corrected first and no repairs without written permission. A required stage that has not passed still prevents Completed under FR-32.\n- **Formula.** Availability is defined as time not down divided by total elapsed time; Patterson’s printed formula can be read two ways.\n\n(The paragraph's last sentence, \"People enter every start, end and outage, so a recorded availability is only as complete as the log.\", follows as its own paragraph.)",
    "changes": "One 77-word sentence with three contrasts, an embedded fourth clause and a weak antecedent for \"he\" becomes a three-item list. About +8 words."
  },
  {
    "lens": "structure",
    "location": "addendum.md:534, addendum.md:824",
    "tag": "MOVE",
    "original_text": "Line 534: \"(proposed amendment 1.1)\". Line 824: \"apart from one narrow FR-55 cancellation exception adopted afterwards,\"",
    "revised_text": "Line 534: \"([amendment 1.1](#amendment-11--reference-based-additions))\". Line 824: \"apart from one narrow FR-55 cancellation exception adopted afterwards (the Unissued proposed device row in [Choose the action from the record’s history](#choose-the-action-from-the-records-history)),\"",
    "changes": "Cross-references in both directions between the table row that defines the exception and the section that mentions it. +12 words."
  },
  {
    "lens": "prose",
    "location": "addendum.md:808",
    "original_text": "Two sources, Patterson in two places and the government assessment guide, assumed such cameras while the requirements gave every camera one fixed aim.",
    "revised_text": "Two sources, Patterson in two places and the Department of Energy guide, assumed pan/tilt/zoom cameras, while the requirements gave every camera one fixed aim.",
    "changes": "Gave \"such cameras\" a referent in the body text; named the guide as the source table does; comma before the contrast clause."
  },
  {
    "lens": "prose",
    "location": "addendum.md:808",
    "original_text": "For each location it shows the best detail achievable at the narrowest field of view that can still include that location within the camera’s limits; near a pan or tilt limit only a wider view may include it.",
    "revised_text": "For each location, the reach layer shows the best detail achievable at the narrowest field of view that can still include that location within the camera’s limits; near a pan or tilt limit, only a wider view may include the location.",
    "changes": "Two \"it\"s with different referents named; commas after introductory phrases."
  },
  {
    "lens": "prose",
    "location": "addendum.md:816",
    "original_text": "A service call after closeout reopens the project into a work scope marked as service through one action, after un-archiving it first if it was archived, so no separate service track exists; each such scope ends with its own closeout record.",
    "revised_text": "For a service call after closeout, one action reopens the project into a work scope marked as service (an archived project is un-archived first), so no separate service track exists; each such scope ends with its own closeout record.",
    "changes": "Moved \"one action\" to the subject, removed the doubled \"after … first\", resolved the ambiguous \"it\"."
  },
  {
    "lens": "prose",
    "location": "addendum.md:833",
    "original_text": "The model in the PRD’s Terms section consolidates states that the requirements already use, for the architecture stage that the handoff asks to decide lifecycle identities.",
    "revised_text": "The device state model in the PRD’s [Terms and lifecycle rules](prd.md#terms-and-lifecycle-rules) section consolidates states that the requirements already use. It is there for the architecture stage, which the handoff asks to decide lifecycle identities.",
    "changes": "Split a sentence with a hard-to-attach trailing clause; named the model and linked the PRD section by its title."
  },
  {
    "lens": "prose",
    "location": "addendum.md:808",
    "original_text": "Reach is a separate reachable-on-demand layer and earns no credit. […] Reach reuses the existing visibility calculation swept across the pan and tilt limits from the mounting point.",
    "revised_text": "Reach is a separate reachable-on-demand layer and is never counted as covered. […] Reach reuses the existing visibility calculation, swept from the mounting point across the pan and tilt limits.",
    "changes": "Replaced undefined shorthand with the PRD's Terms wording; comma and reordering in the second sentence."
  },
  {
    "lens": "prose",
    "location": "addendum.md:822, addendum.md:824 (depends on addendum.md:794)",
    "original_text": "### Clarifications adopted from the parallel session / where the parallel session disagreed with it",
    "revised_text": "Consider: when rewriting line 794, keep one defining clause on first use, for example \"a parallel planning session that worked from an earlier draft without knowledge of PRD 1.0 (the “parallel session”)\"? Lines 822 and 824 then stay as they are.",
    "changes": "\"Parallel session\" is defined nowhere in the addendum; its first use is in the line the parent is rewriting."
  },
  {
    "lens": "prose",
    "location": "addendum.md:534",
    "original_text": "As above, cancellation is not actual removal, a failed test or an approval of the changed design.",
    "revised_text": "Cancellation is not actual removal, a failed test or an approval of the changed design.",
    "changes": "Removed a reference that depends on table row order."
  },
  {
    "lens": "prose",
    "location": "addendum.md:829",
    "original_text": "**Cancelled and corrected records (FR-8/41).** They stay listed and searchable with their reason,",
    "revised_text": "**Cancelled and corrected records (FR-8/41).** These records stay listed and searchable with their reason,",
    "changes": "Replaced a sentence-opening pronoun whose antecedent is the bold label."
  },
  {
    "lens": "structure",
    "location": "addendum.md:820",
    "tag": "CONDENSE",
    "original_text": "§Small additions — one paragraph holding five per-requirement additions (FR-29, FR-43, FR-7, FR-20, FR-18).",
    "revised_text": "Consider: a five-item list keyed by requirement?\n\n- **FR-29.** The optional camera checks include two that complement the model in the field without verifying a DORI level: a person at the far end of the view, and a person behind an obstruction or in its shadow. They sit beside the modeled estimate and never alter it.\n- **FR-43.** Optional checks for alarm-to-camera call-up and handover.\n- **FR-7.** Camera enclosure type and alarm interface.\n- **FR-20.** Survey prompts that are observations only.\n- **FR-18.** Percentage lines with a stated base and subsystem subtotals that never change the total.",
    "changes": "A list written as a paragraph; optional. About -8 words."
  },
  {
    "lens": "structure",
    "location": "addendum.md:792-833, addendum.md:798-802",
    "tag": "PRESERVE",
    "original_text": "Amendment notes kept as one provenance-organized level-2 section; source table with a Limit column.",
    "revised_text": "PRESERVE both.",
    "changes": "One section keeps the amendment auditable and citable; the Limit column is the basis for making no compliance claim. 0 words."
  }
]
```
