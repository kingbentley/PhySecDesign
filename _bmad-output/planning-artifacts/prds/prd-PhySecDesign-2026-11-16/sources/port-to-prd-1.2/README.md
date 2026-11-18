# Changes to carry into PRD 1.2

Prepared 2026-11-18 on branch `claude/wonderful-mendel-hmttcb`. Kevin accepted the recommendation to treat branch `claude/determined-curie-ugawva` (final PRD 1.2, architecture, epics, UX specification) as the baseline and to carry across only what that branch lacks.

[port-to-prd-1.2.patch](port-to-prd-1.2.patch) holds the changes. It was built on, and checked to apply cleanly to, commit `e80a7d8` of `claude/determined-curie-ugawva`. It has not been applied anywhere.

## What the patch does

| File | Change |
| --- | --- |
| `sources/future-schedule-gantt.md` | Adds the planned future feature note (project schedule, Gantt), unchanged apart from one dated paragraph near the top saying it was written against PRD 1.1 and naming the two points that amendment 1.2's accounts and roles affect. |
| `source-index.md` | Adds one row pointing to that note. |
| `prd.md`, glossary | Adds five rows after DORI: home position and stored position; reach; reliability stage and run; service visit; warranty status. |
| `prd.md`, FR-33 | Adds one sentence: the Closeout preset carries reliability runs (FR-64) and warranty details and service visits (FR-65), and analysis sheets identify a pan/tilt/zoom camera's resting view, previews and reach (FR-63). |
| `prd.md`, FR-22 | Adds to the list of things a restoration leaves alone: recorded attributes of Existing devices, and the stored positions and limits of an installed pan/tilt/zoom camera. |

## How to apply

From a checkout of `claude/determined-curie-ugawva`:

```bash
git fetch origin claude/wonderful-mendel-hmttcb
```

```bash
git show origin/claude/wonderful-mendel-hmttcb:_bmad-output/planning-artifacts/prds/prd-PhySecDesign-2026-11-16/sources/port-to-prd-1.2/port-to-prd-1.2.patch | git apply
```

If the other branch has moved on and the patch no longer applies, make the five changes above by hand; each is small.

## Deliberately not carried across

- This branch's wording where both branches fixed the same sentence (FR-55 cancellation example, FR-63 zone line, FR-64 start warning, FR-65, version and amendment labels). PRD 1.2's wording stands.
- This branch's four amendment 1.1 review files. They are history of a finalization that PRD 1.2's own joint review replaced.
- This branch's empty UX workspace under `ux-designs/`. The UX specification on the other branch governs.

## After applying

- The PRD is marked final 1.2. These are additions and clarifications that change no requirement's meaning, but the other session should decide whether to record them in its decision log as a post-finalization correction.
- The UX canvas gained 17 screens on 2026-11-18 that `ux/ux-PhySecDesign-2026-11-18/design-canvas.md` does not list yet. They are named in this branch's `ux-designs/ux-PhySecDesign-2026-11-18/.memlog.md`.
