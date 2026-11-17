# First-draft review disposition

PRD draft 0.1, 2026-11-16. This is a record of drafting checks, not final product approval or an application acceptance result.

| Check | Finding or result | Disposition |
| --- | --- | --- |
| [Baseline reconciliation](reconcile-baseline.md) | Five clarifications: drawing/PDF behavior; linked optical controls; optional zones/DORI; storage versus full-stream bandwidth; CSV scope. | Applied; targeted recheck confirms all five addressed. |
| [Decision reconciliation](reconcile-decisions.md) | All grouped decisions represented. Clarify explicit autosave and confirmed evidence/outstanding-work inclusion. | Applied; targeted recheck confirms both addressed. |
| [PRD rubric](review-rubric.md) | Suitable for first-draft review; no critical/high findings. One medium finding on autosave and one low finding on parameter/footprint wording. | Applied explicit autosave and distinguished resolution/detail changes from geometric footprint changes. |
| [Structure](review-structure.md) | Condense duplicated addendum evidence context; preserve journeys, lifecycle definitions and separate FR checks. | Applied condensation; preserved the recommended structures. |
| [Prose](review-prose.md) | Four clarity fixes: later-change approval, optional zone targets, model limits, and package inclusion versus presentation. | Applied all four; product scope unchanged. |

Open product choices remain OQ-1 through OQ-9, with owner and revisit milestones in the PRD. They are not silently resolved by this review. No application files were changed and no application tests or builds were rerun.

## Guided refinement — draft 0.2, 2026-11-17

Added the user-confirmed access and existing-building workflows, preserving FR-1–38 and adding FR-39–41. OQ-1 is resolved at the product level; OQ-2 through OQ-9 remain open. A narrow [decision reconciliation](sources/confirmed-access-existing-site-extract.md) found no actionable inconsistencies in the accepted changes. Checked 41 unique consecutive FRs with 41 acceptance checks, 45 local links across the five updated context documents, and eight relevant source fingerprints with no drift. The OQ-2 shared-update/conflict model is a pending proposal, not an accepted requirement. No application changes/tests or finalization occurred.

## Guided refinement — draft 0.3, 2026-11-17

Added the accepted shared-update model: autosave/status, per-item and dependency conflicts, guarded own-session undo, separate evidence/retry handling, durable saved state and consistent snapshots/closeout. Preserved FR-1–41 and added FR-42. OQ-2 is resolved; OQ-3–9 remain open, with checklist details explicitly pending. The [focused shared-editing reconciliation](sources/confirmed-shared-editing-extract.md) found no actionable inconsistencies. Verified 42 stable consecutive IDs and checks, 44 local links across six context documents, and four relevant source fingerprints with no drift. No application changes, tests or finalization.

## Guided refinement — draft 0.4, 2026-11-17

Added confirmed OQ-3 common/type-specific checklists, observable pass criteria, required/applicable and evidence rules, independent phase progress and site-level checks. Preserved FR-1–42 and added FR-43. OQ-3 is resolved; OQ-4–9 remain open. The [focused checklist reconciliation](sources/confirmed-checklist-extract.md) found one wording ambiguity, corrected in FR-30/addendum: missing criteria are not the same as an observed failed result. Verified 43 consecutive requirement IDs/checks, 45 local links across six context documents and four source fingerprints without drift. OQ-4 retest triggers remain a proposal. No application changes/tests or finalization occurred.

## Guided refinement — draft 0.5, 2026-11-17

Added confirmed OQ-4 targeted change-to-check rules, proposed/actual/correction distinctions, retained historical outcomes, separate follow-up flags and current-condition evidence/completion safeguards. Preserved FR-1–43 and added FR-44. The [focused retest reconciliation](sources/confirmed-retest-extract.md) found no actionable discrepancies. Corrected an earlier addendum sentence that still described OQ-4 as open. Verified 44 consecutive IDs/checks, OQ-5–9 still open, 46 local links across six documents and four relevant source fingerprints without drift. OQ-5 scope/cost/issue-carryover recommendations, including treatment of out-of-scope defects at closeout, remain explicitly pending. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.6, 2026-11-17

Added confirmed OQ-5 work categories, scoped supply/accessory/labor costs, continuing issue records and explicit closeout with deferred/out-of-scope faults. Preserved FR-1–44 and added FR-45/46, with related FR-17/32/38 and lifecycle wording updated. The [focused work-scope reconciliation](sources/confirmed-work-scope-extract.md) found no actionable discrepancies. Verified 46 consecutive FR IDs/checks, OQ-6–9 still open, 52 local links across seven documents and four relevant source fingerprints without drift. OQ-6 design/closeout package contents, defaults, pagination and retained-file recommendations remain pending. Official-source export context is limited to documentation/report patterns; approvals remain optional. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.7, 2026-11-17

Added confirmed OQ-6 Design/Closeout PDF presets, evidence/detail and quantity/capacity defaults, optional costs/photos, partial/omission labels, exact package retention and dated editions. Expanded FR-33/34 and NFR-6, preserving all 46 FR IDs; OQ-6/A-1 are resolved and OQ-7–9 remain open. The [focused export reconciliation](sources/confirmed-export-package-extract.md) found no actionable discrepancies. Verified 46 consecutive IDs/checks, 59 local links across seven documents and four relevant source fingerprints without drift. Catalog/component/closet/port/vertical-run recommendations remain pending under OQ-7. Official references provide limited design-pattern context rather than a wiring/compliance model. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.8, 2026-11-17

Added Kevin’s explicit model-specific camera-template direction in FR-47, refining FR-7/10 while preserving earlier IDs. Templates support model-number selection, pixel resolution/modes, fixed or adjustable focal data, sourced H/V FoV, sufficient consistent optics and instance/history separation. OQ-7 is only partially settled; other catalog/cable additions and OQ-8/9 remain open. The [focused camera-template reconciliation](sources/camera-model-template-extract.md) found no actionable discrepancies. Verified 47 consecutive IDs/checks, 60 local links across seven documents and four relevant source fingerprints without drift. Primary optical references support the distinction between angular FoV, scene dimensions, active sensor size and capture mode; DORI thresholds are unchanged. No application changes, tests or finalization occurred.

## Panoramic-camera scope discussion — draft 0.8 retained, 2026-11-17

Recorded the user’s question and a pending OQ-7 recommendation, without adding accepted requirements: separate physical assets, optical views and configured streams; supported independent-head analysis; illustrative fisheye/stitched footprints with DORI Not assessed until a suitable profile exists. The [scope extract](sources/panoramic-camera-scope-extract.md) identifies ID deduplication, body/view overcounting and falsely conclusive uncovered-area results as current implementation gaps. [Official references](sources/panoramic-camera-reference.md) distinguish the optical arrangements and sampling limits. Verified 47 consecutive IDs/checks, OQ-7–9 open and 65 local links across seven discussion documents. Accepted FRs, DORI thresholds and approval policy are unchanged. No application changes, tests or PRD finalization occurred.

## Guided refinement — draft 0.9, 2026-11-17

Added confirmed bounded multi-view/panoramic support in FR-48 and related view/combined/zone/capacity/history/export clauses, preserving FR-1–47. The [focused panoramic reconciliation](sources/confirmed-panoramic-camera-extract.md) found no actionable discrepancies. Calibrated fisheye/stitched DORI remains follow-on scope; unsupported analysis remains distinct from field outcomes and proven blind areas. Four noncamera catalog/site/closet/cable groups remain pending under OQ-7; OQ-8/9 are unchanged. Verified 48 consecutive IDs/checks, 67 local links across seven documents and four relevant source fingerprints without drift. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.10, 2026-11-17

Added the accepted equipment types and linked opening/component records in FR-7/29/49, preserving FR-1–48. The [focused equipment reconciliation](sources/confirmed-equipment-catalog-extract.md) found no functional discrepancies and one scope-label ambiguity: an annotation paragraph remained under the confirmed catalog heading. Removed that duplicate from the confirmed section; the full annotation proposal remains explicitly pending, and closet/cable headings now say Proposed. Verified 49 consecutive IDs/checks, 74 local links across seven documents and four relevant source fingerprints without drift. Site annotations, closets/ports and inter-floor/vertical cable details remain pending under OQ-7; OQ-8/9 are unchanged. Dedicated noncamera template automation was not added. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.11, 2026-11-17

Added accepted annotations in FR-50 with linked survey/export/shared-edit clauses, preserving FR-1–49. The [focused annotation reconciliation](sources/confirmed-site-annotation-extract.md) found no actionable discrepancies: dimensions remain plan estimates, field evidence stays separate, markup has no implicit analytical semantics and linked records/issues survive hiding or deletion. Verified 50 consecutive IDs/checks, 78 local links across seven documents and four relevant source fingerprints without drift. The expanded manual closet/port recommendation and physical inter-floor/vertical cable scope remain pending under OQ-7; OQ-8/9 are unchanged. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.12, 2026-11-17

Added accepted closet/port planning in FR-51 and related route/capacity/export/conflict clauses, preserving FR-1–50. The [focused connection reconciliation](sources/confirmed-closet-port-extract.md) found no actionable discrepancies. Mechanical review also corrected earlier OQ-7 summaries that still called now-confirmed equipment/port scope open. Verified 51 consecutive IDs/checks, 82 local links across seven documents and four relevant source fingerprints without drift. Only physical inter-floor route/vertical/drop detail remains under OQ-7; its expanded manual routing and allowance formula are pending. OQ-8/9 are unchanged. No application changes, tests or finalization occurred.

## Guided refinement — draft 0.13, 2026-11-17

Added accepted inter-floor routing and allowances in FR-52 with linked FR-9/17/33/42 clauses, preserving FR-1–51. The [focused routing reconciliation](sources/confirmed-interfloor-routing-extract.md) found one stale FR-7 reference calling physical routing open; corrected it to FR-52 and rechecked the current summaries. OQ-7 is resolved; OQ-8/9 remain open. The cable/archive/replacement/restore recommendation is explicitly pending in the addendum, with changed/deleted-floor and accidental-draft-deletion details still undecided. Verified 52 consecutive IDs/checks, 89 local links across seven documents and six relevant unchanged source fingerprints. No application changes, tests or PRD finalization occurred.

## Guided refinement — draft 0.14, 2026-11-17

Added accepted cable lifecycle in FR-53 and related archive/restoration, equipment, port and export clauses, preserving FR-1–52. The [focused reconciliation](sources/confirmed-cable-lifecycle-extract.md) found accepted behavior intact and two stale addendum scope labels; corrected those plus one earlier current-route summary to reference FR-53. Floor-restoration/accidental-deletion details remain OQ-8, with the guided destination/placement proposal explicitly pending; OQ-9 is unchanged. Verified 53 consecutive requirements/checks, 97 local links across seven documents and seven unchanged relevant application fingerprints. No application changes, tests or PRD finalization occurred.
