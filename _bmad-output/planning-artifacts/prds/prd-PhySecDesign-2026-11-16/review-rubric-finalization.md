# PRD Quality Review — Site Studio finalization gate

Reviewed 2026-11-17 against the installed BMAD PRD quality rubric. Reviewed the full frozen draft 0.27 PRD and addendum. This is the current-document requirements review, not application acceptance or a request to reopen settled product scope. Original draft-0.1 review-rubric.md remains unchanged.

## Overall verdict

The PRD is a sound basis for finalization: the property-lifecycle thesis is coherent, all known product choices have explicit dispositions, and functional checks plus measured acceptance targets make the intended POC assessable. No critical or high finding requires renewed feature discovery or software implementation before document finalization. Clarify one archive/export boundary and consolidate repeated rule/history material before the final prose pass.

## Decision-readiness — strong

The Users and POC scope section states the important choices directly: one continuing property project, shared demo links, optional handoff/approvals, online field work and preserved history. The final OQ dispositions and addendum downstream-ownership table distinguish settled product behavior from architecture, fixture construction, UX detail and project-specific checklist wording. The accepted file/recovery policy is expressed as targets rather than current capability.

## Substance over theater — strong

The document earns its detail through concrete decisions: field facts versus planned actions, scoped costs, current versus historical evidence, physical camera versus view/stream accounting, and complete versus partial outputs. It avoids fabricated research/personas, novelty claims and production assurances. The NFRs are product-specific and now have test environments, operation boundaries, accuracy conditions, byte budgets and recovery objectives rather than generic scalability language.

## Strategic coherence — strong

The four journeys and SM-1–5 support the same thesis: preserve a usable property record from survey/design through actual work and later revisions. Inventory intake, scoped upgrades, evidence, issue carryover, issued-reference designation and exact historical packages support that lifecycle rather than introducing unrelated feature families. Counter-metrics explicitly prohibit improving apparent speed, completion or coverage by dropping evidence, hiding failures or lowering fidelity.

## Done-ness clarity — adequate

All 62 FRs have observable checks. Outcome distinctions, concurrent-edit guards, intake safeguards, calculation semantics and the accepted response/file/recovery tables give engineers concrete acceptance consequences. Exact fixtures, hardware builds and storage mechanisms can remain downstream under the named owners/milestones; their absence is not a new product blocker. One archive/export statement needs a small compatibility clarification.

### Findings

- **[medium] Distinguish archived business records from appended export editions** (§FR-34 and FR-37; addendum §Fixed packages and portable recovery) — FR-34 says “regeneration or later decision information creates a new dated edition,” while FR-37 says “Reading or exporting an archived project cannot change its records.” As written, storing that new edition is both required and prohibited when exporting an archived project. *Fix:* Clarify that archival freezes design, installation, evidence, decisions and existing package bytes; redownload returns exact retained bytes, while export may append a separately identified retained output edition/manifest without editing those business records or starting new work. Content changes still require explicit reopening. This author-supplied distinction reconciles the already accepted export, retention and paused-editing behavior; it does not require a new feature or approval gate. Add the same boundary to FR-37's Check and the export/archive context.

## Scope honesty — strong

The draft separates the prototype from newly required shared editing, lifecycle records, importer, optical models and larger resource envelope. The non-goals and addendum keep automatic hardware testing, production identity, calibrated panoramic DORI and compliance certification outside scope. Old limits and missing originals are labeled historical; accepted retention and new limits do not fabricate missing data or claim measured support. OQ-1–10 and PM-1/PM-2 are resolved, with downstream details explicitly owned.

## Downstream usability — adequate

Stable FR IDs, a useful domain glossary, concrete Checks and the source index make extraction possible. All 62 FR definitions are unique and consecutive; each has a Check. Main-document local links resolve. The remaining friction is repeated authoritative wording across the PRD/addendum and a long resolved-question chronology, addressed by the Shape fit finding below. Role-based journeys are a source-faithful choice here; inventing protagonist names would not improve the requirements.

## Shape fit — adequate

The capability-led brownfield structure fits the user's guided path and broad POC. The journeys, lifecycle tables and technical/evidence separation serve the reader. However, the accumulated confirmation history and repeated full rule sets make the final handoff harder to use than necessary: the frozen PRD is approximately 16,672 whitespace-delimited words and the addendum 19,669.

### Findings

- **[medium] Consolidate duplicate rules and discovery chronology** (§PRD Open questions and assumptions; addendum repeated acceptance/shared-scope sections) — The final PRD still walks through many “Confirmed … refinement” entries and “subsequently confirmed below” references after presenting the operative FRs. The addendum repeats substantial requirements such as the FR-52 route/supply rule, export presets and browser acceptance matrix in full, alongside history explaining when each was accepted. *Fix:* Keep stable IDs and one authoritative product rule per subject in the PRD; reduce the resolved-question section to current disposition plus a decision-log link. Retain earned examples, implementation boundaries, sizing and downstream mechanisms in the addendum with FR references, and leave chronological confirmation/audit detail in the existing log/source/review records. Preserve all accepted behavior while removing repetition; no scope cut or new discovery is needed.

## Mechanical notes

- FR-1–FR-62 are consecutive and unique; 62 Check blocks are present. UJ-1–4, NFR-1–6 and SM-1–5 remain identifiable.
- Checked 51 local Markdown links across prd.md/addendum.md: none missing. External URLs were not revalidated in this review.
- Resolved A-1/A-2 and OQ dispositions are explicit; no unowned current product assumption was identified. Operational/project outstanding items are product data, not unresolved PRD questions.
- Main files remained byte-for-byte unchanged during this review. No application files/tests/builds, benchmark execution or web research were involved.
- Counts: critical 0; high 0; medium 2; low 0. The archive/export clarification is suitable for an author edit; structural consolidation was already planned before prose polish.
