# PRD Quality Review — Site Studio draft 0.1

Reviewed 2026-11-16 against the installed BMAD PRD quality rubric. Scope: first full draft after guided discovery, not final approval or authorization to implement. Reviewed prd.md, addendum.md, source-index.md and the canonical decision log. Six representative cited implementation files match the source inventory; no application tests were run.

## Overall verdict

The draft is suitable for substantive user review: it preserves the existing design capabilities and makes the newly confirmed shared installation and property-lifecycle workflow concrete. The main product choices are coherent, and the nine owned open questions appropriately identify work needed before implementation commitments. Two small corrections would strengthen the draft now: explicitly retain autosave, and make the camera acceptance example parameter-specific; neither warrants delaying the first-draft delivery.

## Decision-readiness — strong

The introduction clearly states “first full PRD draft,” and Users and POC scope separates the current local prototype from required shared editing and lifecycle work. The decisions about shared demo access, online-only field use, optional handoff/approvals, and one continuing project per property are stated plainly. OQ-1 through OQ-9 each name an owner and a revisit milestone; these are appropriate first-draft dependencies rather than silently adopted implementation choices.

The Terms and lifecycle rules table resolves the central closeout tension: Completed is distinct from Closed with outstanding items, and approvals cannot fabricate a passing test. This gives Kevin a concrete policy to review without implying contractual certification.

## Substance over theater — strong

The draft avoids fabricated personas, market claims, production service targets and unearned certification. The four short journeys carry the product's actual workflow, and the baseline addendum explains why browser-local storage and reduced review snapshots do not already meet the new requirements. NFR-1, NFR-2 and NFR-6 address specific data-integrity, shared-save and historical-export risks rather than generic reliability boilerplate.

## Strategic coherence — strong

The thesis is a continuing property record spanning design, actual installation and later work. FR-26 through FR-38 consistently preserve issued intent, field facts, test evidence, closeouts and stable equipment identity; FR-1 through FR-25 retain the planning capabilities needed to create that record. The SMs test end-to-end completion and historical integrity, and counter-metrics explicitly prevent green indicators, greater modeled coverage or faster closure from hiding failures.

## Done-ness clarity — adequate

All 38 functional requirements have an observable Check. Coverage semantics, distinction of test outcomes, fixed historical records, archive behavior and reopening have useful negative conditions as well as happy paths. Numerical performance, supported-device testing, starter checks and exact retest rules remain incomplete, but the draft states where those decisions belong and does not call itself implementation-ready.

### Findings

- **[medium] Explicit autosave requirement was lost** (§Functional requirements, FR-21) — “Provide save status, clear failed-save feedback, undo/redo, and portable backup recovery” can be satisfied with a manual-save-only implementation. The original requested capability and current source baseline include autosave; the draft says existing capabilities are retained but does not explicitly require automatic persistence. *Fix:* State that supported working edits are automatically saved to the shared project, with visible pending/saved/failed status; keep cadence, conflict handling and retry mechanics in OQ-2.
- **[low] Camera parameter check assumes every change affects geometry** (§Functional requirements, FR-10) — “Changing a camera parameter changes the footprint and affected metrics” is too broad: changing resolution can affect DORI without changing the geometric footprint, while occlusion or constraints may leave some visible geometry unchanged. *Fix:* Use parameter-specific examples: lens/pose changes recompute affected visibility; resolution changes recompute image-detail estimates. Retain consistency requirements without demanding every parameter change move the footprint.

## Scope honesty — strong

The document labels the POC boundary and new work, distinguishes unverified demo attribution from authenticated identity, and keeps requested catalog/route extensions visible in OQ-7 rather than presenting them as implemented. A-1 and A-2 identify proposed package and fixture detail, and the addendum explicitly treats current numerical limits as evidence rather than permanent requirements. The missing PSP collection is acknowledged; no mandatory external approval or compliance regime has been invented.

## Downstream usability — adequate

The FR, UJ, NFR, SM and OQ naming is consistent, and the glossary distinguishes named revision, issued design, working installation and closeout record. The main PRD provides capability rules while the addendum holds current implementation detail. All main-document local links checked during review resolve, and FR-1 through FR-38 are unique and contiguous.

The journeys use roles instead of fictional named protagonists. That is appropriate here: they explicitly distill Kevin's described workflow rather than pretending to be researched customer sessions. Downstream work must carry OQ references into affected stories and resolve the declared dependencies; this draft is not a blanket green light to build.

## Shape fit — strong

The capability-led structure fits the user's selected vision-and-features path and the brownfield POC. Four concise journeys provide the multi-role lifecycle context without overwhelming the feature specification. The addendum and source index keep evidence, implementation history and current limits available without turning the PRD into a code inventory or a compliance traceability exercise.

## Mechanical notes

- FR-1–FR-38, UJ-1–UJ-4, NFR-1–NFR-6, SM-1–SM-4 and OQ-1–OQ-9 are present with no observed duplicate definitions.
- All local Markdown links in prd.md and addendum.md resolve.
- Assumptions A-1/A-2 have identifiable inline references and associated open questions.
- Role-based journeys are deliberate source-faithful summaries; do not invent names to satisfy a template convention.
- Finding counts: critical 0; high 0; medium 1; low 1.
