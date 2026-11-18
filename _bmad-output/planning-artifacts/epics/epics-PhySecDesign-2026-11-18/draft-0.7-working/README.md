# Working files for epics draft 0.6

The epics document was revised in six parts, one per group of epics, each against the shared decisions in `brief.md`. `round2.md` and `followups.md` drove a second pass to make the parts agree with each other.

- `partA.md` Epic 1 · `partB.md` Epics 2 and 3 · `partC.md` Epic 4 · `partD.md` Epic 5 · `partE.md` Epics 6 and 7 · `partF.md` Epics 8 to 10
- `choicesA.md` to `choicesF.md`: default values and rules chosen where no document gave one
- `front06.md`, `back06.md`: the sections before and after the stories
- `assemble.py`: checks the parts and writes `../epics.md`. Run from the repository root: `python3 <this folder>/assemble.py` to check; add `--write` to write.

State on 2026-11-18: the second pass is complete for all six parts. Edit the parts, not `epics.md`, and reassemble. Delete this folder once draft 0.6 is settled.
