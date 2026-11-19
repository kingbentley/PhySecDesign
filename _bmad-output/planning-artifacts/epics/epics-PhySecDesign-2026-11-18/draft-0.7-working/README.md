# Working files for epics draft 0.7

`../epics.md` is assembled from these files. Edit the parts, not `epics.md`, and reassemble.

- `partA.md` Epic 1 · `partB.md` Epics 2 and 3 · `partC.md` Epic 4 · `partD.md` Epic 5 · `partE.md` Epics 6 and 7 · `partF.md` Epics 8 to 10 · `partG.md` Epic 11 (agent access; story 1.10e is in `partA.md`)
- `choicesA.md` to `choicesG.md`: open choices, one per line as `ID | story | class | choice | alternative | why`, with an optional seventh field `| decision` that fills the decision column in `epics.md`
- `front.md`, `back.md`: the sections before and after the stories
- `brief.md`: the rules the parts were revised under, including Kevin's twelve decisions
- `assemble.py`: checks the parts, renumbers stories and writes `../epics.md`. Run from the repository root: `python3 <this folder>/assemble.py` to check; add `--write` to write. It refuses to write while any check fails.
- `old-to-new.json`: the story ids used inside the parts mapped to the numbers in `epics.md`

**Story ids inside the parts are not the published numbers.** The parts still use draft 0.6 numbers with a letter for each piece of a split story (`4.10a`, `4.10b`). The script numbers each epic in order when it assembles. References in the parts are always written `story N.M` so that the script can renumber them.
