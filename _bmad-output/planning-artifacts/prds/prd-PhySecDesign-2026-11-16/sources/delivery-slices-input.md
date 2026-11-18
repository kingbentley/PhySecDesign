# Delivery slices — input for the epics stage

Prepared 2026-11-18. This is a suggestion carried over from a parallel session, renumbered to the [final PRD 1.0 with proposed amendment 1.1](../prd.md). It is not a requirement and is not part of the PRD. Kevin chose to leave slicing to the epics-and-stories stage named in the [handoff](../handoff.md) and to keep this as input.

Kevin confirmed the five slices and their order in the parallel session. The placements of FR-56 to FR-62 and FR-65 below were added afterwards to fit this PRD and are unconfirmed.

| Slice | Demonstrable outcome | Requirements |
| --- | --- | --- |
| 1. Shared foundation | The existing design tool running as one shared online project | FR-1–6, FR-8, FR-10–16, FR-20–22, FR-42, FR-60; base parts of FR-7 and FR-9; draft deletion from FR-55 |
| 2. Design and issue | A design is estimated, reviewed, issued and exported as a fixed package | FR-17–19, FR-23–26, FR-34, FR-47, FR-61; the Design preset of FR-33; cancellation and correction from FR-55; the added equipment types of FR-7 |
| 3. Install, test and close out | A technician records work and tests in the field, and the scope closes honestly | FR-27–32, FR-41, FR-43, FR-44, FR-64; issue records from FR-46; the Closeout preset of FR-33; the field tasks of NFR-3 |
| 4. Existing sites and return visits | An existing building is inventoried, surveyed, upgraded and later reopened with its history | FR-35–40, FR-45, FR-53, FR-54, FR-56–59, FR-62, FR-65; issue carryover from FR-46 |
| 5. Extended modelling | Richer design detail | FR-48–52, FR-63; the inter-floor part of FR-9; the port-assignment and multi-view parts of FR-19; the matching parts of FR-33 |

Reasoning behind the order:

- Shared server-saved records come first because issued designs, field evidence, conflict checks and fixed packages all assume them, and the prototype stores a project in the browser.
- Issue records are needed from slice 3, because closeout and the reliability period depend on them; carrying issues across scopes can wait for slice 4, when a second scope first exists.
- Until field recording arrives in slice 3, every analysis can include all placed devices, as the prototype does.
- Work on existing equipment, inventory import and return visits form one slice because each depends on the surveyed starting condition.

Not carried over: the parallel session also proposed an acceptance cut line after slice 4 with a second acceptance stage after slice 5. PRD 1.0 has its own acceptance profile with two fixtures and SM-5, so that proposal is dropped. SM-5 is not placed in any slice above.
