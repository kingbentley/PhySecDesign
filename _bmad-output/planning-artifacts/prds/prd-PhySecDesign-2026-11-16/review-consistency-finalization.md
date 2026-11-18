# Finalization consistency review

Reviewed2026-11-17 against frozen PRD draft0.27 and its current addendum. Focus: performance/accuracy acceptance, original retention, edition/file/resource budgets, shared save/conflict semantics and ordinary/catastrophic recovery. Product decisions are settled; owned architecture/UX/test-manifest work is not treated as a finalization blocker. No application testing or source change was performed.

**Verdict: no critical/high findings; two medium wording issues need disposition. No additional actionable finding beyond the archive/export and timing-batch issues also identified by the parent gate.**

Source fingerprints at review: prd.md SHA-256 60a00d1c77ed7c7da4d2b7802eaa25451b648fd4bda6abd46ab8028cbc5f794d; addendum.md SHA-256 ba10d0783aaa9957a7ea66368a3b5e833940810df919a0d1b30e0990fe20a16e. Line locations below refer to this frozen version, before consolidation.

## C-1 — Separate archived business-record immutability from new export editions

**Severity:** Medium.

**Locations:** prd.md:292–294 (FR-37); prd.md:272 (FR-34); prd.md:560 (NFR-6); addendum.md:253–255.

**Conflict:** FR-37 allows archived-project export but its check says that exporting cannot change its records. FR-34/NFR-6 and the addendum require regeneration to create a new retained dated edition/manifest. A new retained edition adds property records/content, so an implementation cannot tell whether an archived export must be blocked, must implicitly reopen the project, or may append output while the working/ historical business records remain frozen. Reopening also starts new work under FR-38, which should not be an accidental consequence of regenerating a historical document.

**Minimal fix:** Explicitly distinguish immutable archived source/business records from append-only export artifacts. Permit authorized generation and retention of a new edition/manifest from the fixed archived source without reopening, starting a new work scope or changing the historical installation/approval/test/closeout records. Retained earlier package bytes remain unchanged. Apply the same wording in FR-37 and the fixed-package addendum. This is the parent gate's selected clarification; this review did not edit the main documents.

## C-2 — Make the timing denominator unambiguous above20 trials

**Severity:** Medium.

**Locations:** addendum.md:730; prd.md:588.

**Conflict:** The PRD says19 of20 trials, while the addendum says run at least20 trials and require at least19 to meet the target. Read literally, the latter permits19 passing results out of100 trials, weakening the intended acceptance threshold. This is a measurable acceptance-rule ambiguity, not a request to change the accepted speed targets.

**Minimal fix:** Define complete20-trial batches and require at least19 passing timings in **each** batch, retaining every result/outlier. Keep accuracy, integrity and access checks mandatory on every applicable trial. Preserve the separate three-run/all-pass rule for long file jobs. This is the parent gate's selected clarification; no main edit was made here.

## Checked without additional findings

-10/5-second initial/warm readiness,2-second durable metadata save,5-second post-save propagation and10-second completed active-plan analysis use distinct boundaries. Physical-camera/view/stream and geometry manifests are explicitly owned and fixed before benchmarks. Near-target uncertainty is separated from field outcomes and the2-point fixture tolerance is not misrepresented as a live error bound.
- PDF parsing/passwords remain local while new original retention is explicitly shared; legacy missing originals are not invented. Originals, required derivatives and their relationships must be durable before Saved.
-250-page/100 MiB volumes,1 GiB editions,8 GiB retained content and10 GiB backup containers are separately bounded, with safe rejection and no history truncation. The5,320/7,720 MiB examples and80 GiB maximum seven-plus-one container allowance are arithmetically consistent.
- The24-hour catastrophic recovery point does not weaken ordinary acknowledged-save durability. The60-minute recovery includes automated retrieval/validation, distinguishes slow user transfer and requires restored-point disclosure. Revoked link access cannot be silently resurrected; incomplete restores preserve the working project.
- Processing versus transport, all-volume same-source completeness, exact retained bytes and three-run file-job integrity are explicit. No current implementation, runtime acceptance or production-readiness overclaim was found in these contracts.

These are bounded document clarifications. The review does not introduce new feature discovery or require implementation benchmarks before PRD finalization.

## Focused fix verification — 2026-11-17

C-1 and C-2 are addressed. Current FR-37 preserves archived design/installation/evidence/decisions/prior packages while explicitly allowing a separately retained export edition without reopening work. The addendum now requires at least19 successes in every20-trial batch, including additional batches, with all applicable integrity/accuracy/access checks still mandatory. No remaining issue within these two fixes; no broader re-review performed.
