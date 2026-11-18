# Site Studio — planning handoff

Prepared 2026-11-17. Use the [final PRD 1.0](prd.md) as the product requirements baseline. The [addendum](addendum.md) carries implementation context, examples and downstream responsibilities; the [source index](source-index.md) locates the existing prototype and evidence. Preserve FR-1–62, NFR-1–6 and SM-1–5 when deriving work. A proposed amendment 1.1, added on 2026-11-18 and not yet through finalization review, adds FR-63–65 and small additions; see the [amendment status](amendment-1.1-status.md) before relying on them.

## Recommended BMAD sequence

1. **[CU] Create UX — `bmad-ux` (recommended).** Start a fresh chat with this handoff and the finalized PRD. Extend the selected white/teal map-first workspace into desktop design, responsive field work, inventory placement, issued-reference comparison, commissioning and lifecycle flows. Use the existing prototype as evidence of current behavior, not proof of future requirements.
2. **[CA] Architecture — `bmad-architecture` (required before epics).** Decide shared persistence and concurrency, scoped demo access, camera/view/stream and lifecycle identities, geometry/analysis jobs, original-media storage, fixed package editions, and recoverable backups. Preserve accepted outcomes; record implementation tradeoffs separately.
3. **[CE] Create Epics and Stories — `bmad-create-epics-and-stories`.** Derive implementable increments and acceptance evidence from the PRD, UX and architecture. Identify existing capabilities to retain, gaps to build and prototype mechanisms to replace.
4. **[SP] Sprint Planning — `bmad-sprint-planning`.** Check planning readiness and prepare implementation tracking before `bmad-build`.

The installed BMAD catalog recommends UX when the UI is central; architecture and epics are required planning steps. Run each workflow in a fresh context with these artifact paths. This handoff does not automatically start the next workflow.

## Boundaries to retain

- One continuing project per property, optional approvals/handoff, one active scope, preserved issued designs and closeouts, and direct installer updates with history.
- Shared online POC using revocable scoped demo links and unverified display names; online field work across phones, tablets and laptops.
- Existing-site inventory and survey verification, physical-device/view/stream distinctions, honest modeled analysis, explicit unfinished work, and protected lifecycle records.
- Small functional fixture plus the agreed larger property: 10 buildings, 600 devices including 150 physical cameras, roughly 20–30 plans, about 60 cameras on the busiest plan, and 1–2 concurrent users. The PRD owns exact performance, file, export, recovery and fidelity targets.
- Architecture/engineering owns mechanisms; engineering/QA with Kevin owns representative benchmark manifests; UX/engineering owns task presentation; Kevin/domain review owns final checklist wording and project values before field use. These are role responsibilities, not external assignments.

## Evidence and acceptance

The finalized PRD establishes requirements for the POC. It does not certify the software, camera image quality, PSP compliance or capacity. No PSP documents were supplied. The existing application is a local design prototype with a limited revision-review service; shared project/field/lifecycle requirements require further work. Use the [review disposition](review-disposition.md) for reconciliation and review evidence. Software acceptance requires implementation and measured tests against the agreed criteria.
