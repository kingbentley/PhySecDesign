# Confirmed checklist and pass-criteria decision extract

Recorded 2026-11-17 for guided PRD refinement. Sources: the presented OQ-3 recommendation in the [addendum](../addendum.md), [PRD draft 0.3](../prd.md), and Kevin's latest affirmative response supplied for this task.

**Decision status:** The Yes accepts the presented OQ-3 approach. Its pending/proposed labels are superseded at the product-behavior level. Preserve draft status, stable existing FR IDs, and subsequent guided discussion. OQ-4 retest triggers and OQ-5 scope/defect disposition are not resolved by this acceptance; OQ-4–OQ-9 remain open. Exact final checklist wording remains downstream implementation/domain refinement within the accepted structure. This is not implementation, a fresh test pass, or finalization.

## Accepted template and expectation model

- Provide a short common checklist plus device-type sections grouped into Installation, Configuration and Testing. Use one camera starter for dome/bullet variants and cover existing reader, door contact, motion detector, intercom, switch, cabinet and light types, with a generic fallback.
- Default applicable core identity/location, installation, key configuration and basic functional checks to required for new/changed in-scope equipment. Enable feature-specific/extended checks only when relevant. Projects may add/remove checks and adjust required/optional status, applicability and expectations without erasing attempts or unresolved issues.
- Select assets/work in scope during planning and fill expected outcomes. Each check records a task, method/conditions, expected result or value/tolerance where applicable, required/optional status, applicability and evidence requirements.
- A placeholder such as per project must have a value or reference before Pass. **Needs definition is a readiness flag, not a fifth test outcome.** Device-specific acceptance values come from selected manufacturer/site procedures and applicable requirements; no universal mounting height, frame rate, lux, voltage, alarm delay or lock fail-state is adopted.
- Common installation checks cover identity/label/location, mounting/enclosure criteria and known cable/power endpoints. Common configuration checks cover names, nonsecret settings/associations and applicable operating parameters. Common tests exercise the relevant function and observe the result at its intended receiving system/location.
- Unknown legacy serial/model/install-date data may stay unknown unless explicitly required for the scoped work. No live passwords/access codes enter the record.

## Accepted starter functional coverage

| Existing device type | Accepted starter direction; project-specific criteria still supply values/conditions |
| --- | --- |
| Camera, dome/bullet | Live image and identity, defined framing/focus, configured stream values, retrieval/playback of a test recording with correct identity/time; day/night or event-trigger checks only when applicable/in scope. |
| Reader | Valid/invalid test credentials produce defined permitted/denied behavior and receiving-system events; linked door behavior follows the project's specified sequence/scope. |
| Door contact | Open/closed state/events reach the named receiving input; tamper only when supported and selected. |
| Motion detector | Specified movement/location yields the intended zone event under recorded conditions; defined return-to-normal behavior where applicable. |
| Intercom | Correct call destination, defined two-way audio/video where fitted; release action only within the site's defined sequence/scope. |
| Switch | Intended endpoints/uplink, labels/associations, measured/reported power within chosen equipment limits under defined test load; modeled PoE does not substitute for observation. |
| Cabinet | Identity/location, mounting, enclosure/lock, arrangement and labels meet chosen criteria; power/bonding inspection evidence only through applicable procedure, with no certification implied. |
| Light | Defined manual/automatic/control operation; an illumination requirement uses specified measurement locations/conditions and values, not an invented threshold. |
| Generic | Define function, exercise method, receiving observation and acceptable result; undefined checks stay unperformed rather than automatically passing. |

These starters do not add doors, gates, controllers or other unresolved catalog equipment. Related-system observations can be attached to an existing device or project-level check. They are not a complete manufacturer, PSP, electrical or fire/egress compliance library. Technicians perform and record observations; the POC does not execute hardware tests.

## Accepted result and evidence rules

- Keep exactly **Pass, Fail, Not tested and Not applicable** as test outcomes. Not applicable is distinct from Pass and requires a reason tied to the feature/scoped work; it cannot conceal a failed or unavailable test.
- Pass requires an observed result meeting the configured expectation and all required fields/evidence. A binary observation/outcome is sufficient for a simple binary check; numeric/condition-specific checks need the requested values, units and conditions.
- Missing/unknown criteria, unperformed tests, missing required measurements and predicted DORI/PoE results cannot provide a field Pass. A performed test missing its expected result is Fail with a brief explanation.
- Photos remain optional unless the project requires them. Record actor/time and preserve wording, expected result, applicable device/design context and evidence with each attempt.
- Retests/corrections add history. Editing a criterion or changing a failed check to optional cannot erase the earlier failure or silently resolve its issue. Detailed change-to-retest and issue disposition rules remain OQ-4/OQ-5.

## Accepted progress, existing-equipment and site-level behavior

- Track Installation, Configuration and Testing independently. Show required applicable checks passed/failed/not tested, with Not applicable separately visible.
- A phase completes only when required applicable checks and required evidence are satisfied and no unresolved failure remains in that phase. A phase with no applicable checks shows **No checks in scope**, not 100% passed.
- Optional unperformed checks do not block completion. **Any recorded failure remains visible**, including an optional check's failure; resolve it or use the existing explicit outstanding-items closeout route. Other devices/phases may continue without a new approval gate.
- New/changed equipment gets relevant checks. Retained untouched equipment gets only explicitly scoped assessments/tests; inventory and old records are not current passes. Known defects stay visible. Out-of-scope-defect disposition at closeout remains OQ-5 and cannot silently weaken FR-32.
- Add a small editable project/floor checklist for applicable end-to-end functions: expected device/events at receiving systems, retrieval of selected recordings, consistent IDs/timestamps/locations, and final records that reflect actual installation.
- Link site-level checks to affected devices and identify exactly which endpoints/conditions were exercised. A sample does not prove every device passed. Extended duration, recovery, integration and night checks apply only when scoped; configured retention is not evidence of actual available recording history.
- Design approval and final acceptance remain separately optional/bypassable. Checklist readiness, test evidence and truthful completion do not establish mandatory reviewer signoff.

## Requirement mapping

| Existing requirement or suggested grouping | Accepted addition/refinement |
| --- | --- |
| **FR-29 — Editable checklists** | Common plus type-specific phase structure, core required defaults for new/changed scoped work, feature applicability, editable project criteria/evidence, readiness flag and immutable prior wording/expectations. Reference the accepted type-starter table in the addendum. |
| **FR-30 — Separate field outcomes** | Exactly four outcomes; distinguish readiness from outcomes, required from applicable, genuine Not applicable from failed/unavailable work, and recorded installation/configuration from observed testing. |
| **FR-31 — Evidence and retesting** | Define Pass in terms of observed expected results and required evidence; numeric versus binary observations; preserve actor/time, device/design context and attempts; no modeled-analysis pass or silent issue resolution after checklist edits. |
| **FR-32 — Explicit closeout** | Keep optional/unperformed checks distinct from failures; unresolved failure and missing required applicable evidence cannot silently become Completed. Preserve explicit outstanding-items route and separate optional approvals. |
| **FR-25 — Optional approvals** | Retain existing nonblocking/bypassable policy; no new gate is introduced by phase completion or the UFGS reference. |
| **FR-28 and FR-39–FR-41** | Preserve existing-site scope and legacy unknowns; apply relevant checks to new/changed work or expressly selected retained equipment. Keep exact retest triggers/out-of-scope disposition open under OQ-4/OQ-5. |
| **Potential appended phase-progress requirement** | Independent phase counts/completion, No checks in scope, optional-unperformed behavior, visible optional failures, continued work across devices/phases. Preserve FR-1–FR-42 numbering. |
| **Potential appended site-level-check requirement** | Project/floor end-to-end checks, linked devices/conditions, no sample-to-entire-site pass inference, scoped extended scenarios and manual observations. |

## Four consistency risks

1. **Outcome versus readiness and applicability.** Do not introduce Needs definition as a fifth test state or conflate required with applicable. Missing expectations/evidence cannot Pass; explained Not applicable is separate from both Pass and Not tested. No checks in scope is a progress label, not proof that work passed.
2. **Optional checks and failures versus completion.** Optional unperformed work can remain nonblocking, but making a failed check optional, removing it, or changing its criterion cannot hide the failure, alter historical evidence or yield false completion. A phase with an unresolved failure stays incomplete; explicit outstanding-items closeout remains available and approvals remain optional.
3. **Scoped legacy work versus still-open retest/defect rules.** Do not automatically recommission all inventoried assets, invent missing legacy facts, or infer a pass from history or a site sample. Keep known defects visible and defer exact changed-context retests and out-of-scope defect disposition to OQ-4/OQ-5; OQ-3 acceptance does not resolve either.
4. **Starter library versus expanded scope/compliance.** Device starter content is manual, editable and project-defined. It neither adds unresolved hardware types nor imports universal electrical/egress/PSP thresholds or mandatory contractual approvals. External guidance supports structure only; no complete PSP source review or compliance certification is established.

## Integration status cleanup

Promote OQ-3/addendum wording to confirmed direction, update PRD/context/index references and retain OQ-3's resolved ID. Keep OQ-4–OQ-9 open and label any next recommendation unaccepted until Kevin responds. Earlier pending records remain valid chronology. No main PRD/addendum/application files were changed and no application tests were run for this extraction.

## Narrow reconciliation against draft 0.4 — 2026-11-17

Reviewed the accepted checklist behavior in FR-29–31/43, related approval/closeout clauses, confirmed addendum section, source index and conversation context. This was a focused guided-refinement check, not a broad review, finalization or application test. Main documents were read only.

**Result:** the accepted model is represented, with one small wording ambiguity to correct.

### CK-1 — Distinguish failing a defined expectation from a missing expectation

FR-30 currently says: “A completed test missing its expectation is Fail with a short explanation.” The phrase missing its expectation can describe an undefined acceptance criterion, while FR-29 correctly treats undefined criteria as Needs definition readiness information. The confirmed addendum instead means an observed result that does not meet a defined expectation.

**Action:** Replace that sentence with “A completed test whose observed result does not meet its defined expected result is Fail with a short explanation.” Preserve the existing rule that undefined criteria cannot produce Pass and do not create a fifth outcome. This is a wording clarification, not a new policy or an additional test state.

### Other focused checks

- FR-29/FR-30 keep exactly four test outcomes and Needs definition as readiness information; project-specific criteria/values and legacy unknowns remain explicit.
- FR-31 separates required/applicable checks from optional unperformed work, keeps every unresolved failure relevant to phase completion, and prevents changing optionality/criteria from erasing past failure or resolving its issue. Empty/all-inapplicable phases show No checks in scope instead of 100% passed.
- FR-30 requires observed outcomes and requested measurements/evidence; modeled DORI/PoE cannot supply Pass. The addendum preserves simple binary versus numeric/condition-specific evidence and optional-by-default photos.
- Existing-device tests remain scoped; inventory and old evidence are not automatic current passes. FR-30 and the context preserve OQ-4 retest and OQ-5 out-of-scope defect disposition as open.
- FR-43 links site checks to tested endpoints/conditions, disallows universal passes from samples or configured retention, and prevents device totals from satisfying unperformed site checks. Hardware tests remain performed by technicians.
- FR-25/FR-32/FR-43 retain optional approvals and truthful explicit closeout. The accepted starters do not add unresolved hardware catalog scope or a complete PSP/compliance claim.
- PRD, addendum, source index and context mark OQ-3 resolved and OQ-4 pending; no proposed retest table or defect-disposition policy was silently accepted.

No other actionable inconsistency was found in this narrow check.

### CK-1 disposition

Applied the suggested FR-30 wording and matching addendum clarification: Fail refers to an observed result that does not meet a defined expectation. Undefined criteria remain a readiness gap and cannot produce a new Pass. Exact replacement verified by the parent; no other focused findings remained.
