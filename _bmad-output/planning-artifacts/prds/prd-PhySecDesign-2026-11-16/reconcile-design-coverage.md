# Reconciliation — design and coverage inputs

Compared 2026-11-17 against PRD draft 0.27 and its current addendum. Input: sources/design-and-coverage.md, site-studio/AGENTS.md, README.md, POC-ROADMAP.md, design-qa.md, and the selected design-mockups/04-map-overlay-studio.png (visually inspected). This is a document reconciliation, not a fresh application acceptance pass. Main PRD/addendum were not edited; no tests, build, browser storage or private review data were accessed.

References to prd.md, addendum.md and sources/ are relative to this PRD workspace; site-studio/ and design-mockups/ references are relative to the repository root.

## Captured themes

| Input theme | Current coverage | Reconciliation |
| --- | --- | --- |
| Persistent geographic map, drawing overlay, property lookup, optional Google/USGS | FR-3–6 (prd.md:96); addendum.md:21 | Captured. Coordinate placement, uniform alignment, cancel/undo and local PDF/password processing remain explicit. |
| Independent buildings/floors and property-wide schedule | FR-1/7/8 (prd.md:88, prd.md:114); addendum.md:25 | Captured. New guarded container deletion is intentional, not a regression to the prototype's broader removal behavior. |
| Equipment identity, placement, routes and estimates | FR-7–9/17/47/49/51–53; addendum.md:25, addendum.md:37 | Captured and deliberately expanded: model templates, additional types, closets/ports and inter-floor routes are requirements beyond existing code. |
| Height/tilt/optics, finite-height barriers, single-camera visibility and near blind areas | FR-10/11 (prd.md:128); addendum.md:29 | Captured. Rectilinear, sampled 2.5D assumptions remain distinct from real image quality or certified performance. |
| Combined union/overlap, all eligible cameras despite display visibility, full-area denominator | FR-12/13 (prd.md:136); addendum.md:29 | Captured, including the later physical-camera/view distinction and unsupported-view treatment. Minor baseline details below remain implicit. |
| Optional DORI, best unobstructed single view, Below Detect distinct from unseen | FR-14 (prd.md:144); addendum.md:31 | Captured. The 2014 threshold convention is implementation context, not an independent standards/compliance claim. |
| Named independent zones, selected DORI percentage, feedback while adjusting cameras | FR-15 (prd.md:148); addendum.md:33 | Captured. Later near-threshold uncertainty and Not assessed rules improve the original prototype semantics. |
| Cleaner vector/cone presentation without changing sampled totals | FR-16 (prd.md:152); addendum.md:33 | Captured; smooth contours are not claimed to make area calculations exact. |
| Selected white/teal map-first workspace | prd.md:553; source-index.md:105 | Captured: project/layers, central map/drawing, contextual inspector and direct placement tools. The simple, professional character should remain explicit during consolidation; detailed responsive layout is downstream UX work. |
| Local prototype evidence versus new shared/lifecycle scope | prd.md:35; addendum.md:7, addendum.md:23, addendum.md:47, addendum.md:801 | Correctly separated. New original-file retention, shared editing, inter-floor routes and lifecycle history supersede prototype-only limits; they are not already implemented or tested. |

## Genuine gaps and minimal corrections

These are narrow retention/wording gaps, not missing major feature families or new scope requests. They can be corrected inside the existing FRs/experience paragraph without new FR IDs or another product decision round.

### D1 — Analysis fallback and reset behavior is underspecified

FR-13 requires a disclosed fallback and editable boundary, but the main/addendum text no longer states the existing fallback sequence or explicit return-to-default behavior. The durable source direction is image extent (including sheet margins), else camera surroundings, else the floor's stored map area; users can draw/edit a simple polygon and restore the defaults. This is not building-interior recognition or a live-viewport denominator. Evidence: site-studio/AGENTS.md:30; site-studio/README.md:129; sources/design-and-coverage.md:33; site-studio/src/coverageArea.js:28; site-studio/src/CombinedCoveragePanel.jsx:77. Current target: prd.md:140, addendum.md:29.

Minimal correction: append to FR-13 or its addendum paragraph: “Use the drawing image extent by default; without a drawing use camera surroundings, or the floor's stored map area when empty. Allow a custom simple polygon and restoration of default bounds. These bounds do not identify the building interior.” Preserve the existing floor-specific persistence rule in FR-1. Do not promote the current 2 m margin, 100-point ceiling or 20 km solver limit into permanent requirements.

### D2 — Common-plane independence and zone linkage should be explicit

FR-13 names a common plane and FR-15 says a consistent target plane, but neither explicitly says that the floor's common plane defaults to 0 m, is shared by combined and zone analysis, and does not overwrite individual-camera target heights. General excluded-view disclosure also omits the concrete supported-model case of a lens at/below that plane. These are durable baseline decisions, not merely arbitrary code defaults. Evidence: site-studio/AGENTS.md:32, site-studio/AGENTS.md:38; site-studio/README.md:128, site-studio/design-qa.md:267; site-studio/src/App.jsx:136; site-studio/src/projectModel.js:390. Current target: prd.md:140, prd.md:148, addendum.md:29.

Minimal correction: “Persist one common target height per floor, initially 0 m, for combined coverage and zone evaluation without altering individual-camera target heights. For supported rectilinear analysis, exclude and explain invalid geometry and lenses at or below the selected plane.” Keep later panoramic Not assessed handling and accepted profile limits intact; do not reintroduce an unconditional 100% blind claim when relevant views are unsupported.

### D3 — Search navigation versus moving the drawing is only implicit

FR-3 preserves coordinates on provider/style changes, and FR-4 protects devices/barriers when the drawing moves. The distinct existing behavior that searching/selecting a property only navigates the map is not carried into the acceptance wording. A refactor could incorrectly move an existing design on result selection while satisfying the written provider-switch check. The keyless OpenStreetMap baseline is also only implicit in the provider description. Evidence: site-studio/AGENTS.md:15; sources/design-and-coverage.md:9; site-studio/src/App.jsx:530; site-studio/src/AddressSearch.jsx:54. Current target: prd.md:96, prd.md:102; addendum.md:21.

Minimal correction to FR-3/check: “Keep an OpenStreetMap option usable without a user API key. Selecting a search result moves the viewport only; relocating an unlocked drawing is a separate explicit action and retains equipment/barrier coordinates.” This preserves existing intent without requiring Photon, a particular timeout/cache, or a new geocoder contract.

### D4 — Retain the simple, professional UX character explicitly

The selected map-first white/teal structure is already captured in prd.md:553; it should not be reported as missing. The broader qualitative character can disappear as detailed lifecycle/collaboration features are consolidated because the experience paragraph describes structure but not simplicity/professional clarity. The inspected selected image, site-studio/AGENTS.md:13–16, site-studio/POC-ROADMAP.md:5 and site-studio/design-qa.md:12 support preserving the restrained editor and direct controls.

Minimal correction: describe the existing direction as “a simple, professional, map-first white/teal workspace” in the same paragraph, keeping common placement/alignment actions direct and contextual. This is a qualitative design guardrail, not a new numeric usability target or a mandate to reproduce every generated control. Leave exact spacing, component layout, interaction alternatives and responsive details to the existing UX responsibility at addendum.md:794. Historical mockup labels such as Saved must not override the confirmed durable shared-save semantics.

## Evidence boundaries and apparent discrepancies that are not gaps

- Historical QA contains real recorded checks for OpenStreetMap/USGS, lookup, alignment, PDF import, core multi-floor planning, single-camera coverage and combined coverage (site-studio/design-qa.md:69, :104, :149, :183, :227, :259). It is scoped historical evidence, not current acceptance of the expanded shared lifecycle product, mobile matrix or 600-device workload. Google live-key verification remains unestablished (site-studio/design-qa.md:281). The main/addendum correctly avoid fresh-pass claims.
- README statements that core workflow validation is pending and general undo is absent are stale (site-studio/README.md:5, :89); later roadmap/QA and source supersede them. Do not restore them as requirements or use them to invalidate the already recorded scoped QA.
- Old local-only persistence, selected-page-only PDF retention, 50 MB/12 MB file limits, same-floor route limits and deletion-cascades do not conflict with the new requirements: the PRD deliberately extends/supersedes them and the addendum distinguishes current implementation. No request to revert shared editing, retained originals, inter-floor routes, history-preserving removal or confirmed resource budgets is made.
- Current fixed catalogs, one draft, session view settings, nonpersistent API keys, fixed sampling budgets and max counts are implementation evidence. The accepted source/requirements distinction does not require every code constant, transient control or unsupported prototype affordance to become an FR.
- Existing ruler/measurement capability is represented and extended through FR-50; map/plan estimates remain separate from measured field observations and routed cable quantities (prd.md:401). No missing measurement feature was found.
- Coverage legend colors remain useful UX source material (single visible/blocked/near-blind versus combined unseen/single/overlap). Do not infer a mandatory new palette or conflate view counts with physical camera bodies; the accepted model distinction and noncolor accessibility checks control the final presentation.

No application or main planning-document edits were made. The only artifact from this pass is this reconciliation note.
