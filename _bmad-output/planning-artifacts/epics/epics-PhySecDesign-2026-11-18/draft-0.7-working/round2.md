# Round 2 for draft 0.7: make the six parts agree

All six parts have been revised and many stories were split. You are finishing ONE part. Work only in this folder: `/home/user/PhySecDesign/_bmad-output/planning-artifacts/epics/epics-PhySecDesign-2026-11-18/draft-0.7-working/`. Edit only your part file and your choices file. Do not run git. Do not spawn subagents.

Read first: `brief.md` (the rules still apply, especially Format and the dependency rule) and `handovers.md` (split maps for every epic, coordinator RULINGS, and what each part needs from the others). Read other parts only as needed to agree wording.

Do these, in order:

1. **Fix references to split stories.** From the repository root run `python3 <this folder>/assemble.py`. Under "AMBIGUOUS references" every line starts with the part it is in (`partA:` … `partF:`). For each line in YOUR part, change `story N.M` to the right piece (`story N.Ma` etc.), using the split maps in `handovers.md` and, where needed, the other part's file. If a sentence really concerns two pieces, name both, each as `story …`.
2. **Fix PROBLEMS that name your stories or your choices file**, including any criterion that names a later story (move that sentence to the Notes line, or reword the criterion so it stands alone; "development measurement; the acceptance run is story X" belongs in Notes).
3. **Apply `handovers.md`:** every RULING, and every item addressed to one of your stories. Where a ruling says a story must not create or state something, remove it. Where two parts disagree and the ruling names an owner, follow it.
4. **Prune and reclass your choices file.** Kevin, the product owner, has to rule on every `decide` row, so keep that class for real product decisions only:
   - `decide` = a behaviour or restriction a user would notice, that no source states, and that a reasonable owner might want otherwise.
   - A refusal that only protects data from corruption or loss, an ordering of internal steps, a safety check on an update or restore, or anything a source implies: that is `reading`, or if it is purely an engineering detail delete the row and remove its ID from the criterion.
   - A row may be on more than one criterion; its story column names one story only (the first that states it).
   - Remove rows for anything Kevin already decided (the twelve decisions in `brief.md`).
5. **Tighten without losing content:** if two bullets in one story say the same thing, merge them. Do not add edge cases, do not split or add stories, do not renumber.
6. Run `assemble.py` again. Your part should show no AMBIGUOUS line and no PROBLEM for your stories or choices. Lines for other parts are not yours.

Reply briefly: what you changed in step 3 (by story id), the count of your choices by class after step 4 with a one-line list of the remaining `decide` rows, and anything you could not resolve.
