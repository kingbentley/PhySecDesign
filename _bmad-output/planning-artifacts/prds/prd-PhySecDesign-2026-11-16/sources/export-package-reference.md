# Export package reference for OQ-6

Research date: **2026-11-17** (America/Chicago). Narrow official-source check to inform the design and closeout export choice; this is a recommendation for discussion, not accepted PRD scope or an implementation claim.

## Source evidence

**UFGS 28 08 10, Electronic Security System Acceptance Testing**, August 2023 edition, with references aligned to the July 2026 UMRL. This is a testing-documentation reference, not a complete handover specification.

- Procedures pair actions with expected outcomes; logs identify components by location. [Sections 3.1.3 and 3.1.5, page 7](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf#page=7).
- Inspection records combine installed equipment/software by location, updated drawings, and deficiencies. [Section 3.3.4, page 9](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf#page=9).
- Test records preserve failures, corrections, retest outcomes, and punch-list status. [Sections 3.3.5.1–3.3.5.3, pages 9–10](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf#page=9).
- The final report assembles a testing narrative, participants, and completed logs. [Sections 3.4–3.4.3, pages 11–12](https://www.wbdg.org/FFC/DOD/UFGS/UFGS%2028%2008%2010.pdf#page=11).

**CCTV Design Tool — Generating Outputs** separates plan images/PDFs, reports, material lists, and connection lists. Its plan output is an image using selected display settings. This is a useful precedent for separating the readable package from tabular exports. [Official guide, “Export to PDF/JPG,” “BOM List,” and “Connection List”](https://docs.cctvdesigntool.com/quick-start/generating-outputs.html).

## Recommended POC packages

The following is a product-design inference from those sources and the supplied POC constraints, not a requirement imposed by either source.

| Package | Readable PDF | Companion exports |
| --- | --- | --- |
| Design | Project and revision/date; site or floor plans with available labels, legend and coverage; proposed device schedule; assumptions, limitations and unresolved design notes. | Editable project JSON; cost CSV as a separate, optional commercial attachment. |
| Closeout | Updated plans and equipment record; test/checklist summary and recorded logs; deficiencies, correction/retest history and outstanding items; references to supporting evidence when present. | Editable project JSON representing the same recorded state; cost CSV when the recipient needs it. |

Use these as two presets over the same project record. Include only information the project actually contains. Mark absent test/evidence information as **Not recorded**, and unperformed checks as **Not tested**; neither implies a pass. Keep draft/incomplete closeout packages exportable with their status visible.

The existing output constraint supplied for this discussion remains: PDF plans are raster snapshots, live basemaps are not embedded, JSON is the editable archive, and CSV carries cost data. The readable package should state any background omission so a plan cannot be mistaken for a complete map export. Referenced evidence is not necessarily bundled into the export.

User review or approval fields remain optional and do not gate export. Do not import Government witnessing, mandatory signatures, contractual acceptance, prescribed test durations, or certification requirements from UFGS. An exported closeout package records available information; it does not certify the installation or establish regulatory compliance.
