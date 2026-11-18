# PSP reference coverage and reading task

Prepared 2026-11-18 during review of PRD draft 0.21. This digest records one public source that was read, three licensed references Kevin holds that have not been consulted, and the questions to take to them. It changes no requirement. Five related proposals are pending Kevin's decision and are listed at the end.

## Source read

**ASIS PSP Body of Knowledge (updated 2022)**, three pages, linked from `site-studio/POC-ROADMAP.md`: <https://www.asisonline.org/globalassets/certification/documents/physical-security-professional----bok.pdf>. Read in full on 2026-11-18.

It is the outline for the Physical Security Professional examination: three domains, each a list of tasks and knowledge topics. It names subjects. It contains no requirements, acceptance criteria, test values or procedures, so it can show what the PRD covers and omits but cannot ground checklist content or support a compliance claim. The mapping below is in this project's own words.

## Coverage of the outline by PRD draft 0.21

Covered means the PRD has requirements for the subject. Partial means it touches the subject without treating it as the outline frames it. Not covered means the PRD is silent.

### Domain 1 — Physical security assessment (34% of the examination)

| Task | Coverage | PRD basis and gap |
| --- | --- | --- |
| Plan the assessment | Not covered | No assessment plan, method or stakeholder record. |
| Identify assets, value and criticality | Not covered | No asset-value or criticality record. Devices are equipment, not protected assets. |
| Assess threats and hazards | Not covered | No threat, hazard or operating-environment record. |
| Assess vulnerabilities | Partial | Site survey notes, photos and existing-equipment condition (FR-20/39), drawing import (FR-4–6), map context (FR-3), obstructions and entrance markers (FR-11/50). No codes or standards register and no lighting analysis. |
| Analyze risk and select countermeasures | Not covered | A security zone has a coverage target (FR-15) with no recorded reason or risk. Estimates and revision comparison exist (FR-17/18/22) but no cost-benefit or total-cost-of-ownership analysis, and no privacy or legal record for video. |

### Domain 2 — Application, design and integration (35%)

| Task | Coverage | PRD basis and gap |
| --- | --- | --- |
| Establish performance requirements | Partial | Zone DORI targets (FR-15), project-defined expected results (FR-29), capacity assumptions (FR-19) and acceptance targets. No single requirements register, no codes, no operational or staffing requirements. |
| Determine countermeasures: electronic systems | Covered | Cameras, access control, intrusion, intercoms and openings (FR-7/10–16/47–49). |
| Determine countermeasures: structural and environmental | Partial | Obstructions are modeled for visibility only; lights, locks and gates are catalog records (FR-7/11/49). No environmental-design method, barrier ratings or lighting levels. |
| Determine countermeasures: storage, network, power, transmission | Partial | Storage and retention estimates, ports, PoE and uplinks (FR-19/51), copper and fiber runs (FR-9/52). No backup power, wireless links, addressing, redundancy or access-permission design. |
| Determine countermeasures: staffing, screening, monitoring centres, visitor management | Not covered | Outside a design-and-commissioning tool as currently scoped. |
| Produce design and project documentation | Partial | Drawings, calculations, schedules, review and cost estimates are covered (FR-10–19/22–26/33/34). No construction specifications, named design phases, project schedule or structured value-engineering comparison. |

### Domain 3 — Implementation (31%)

| Task | Coverage | PRD basis and gap |
| --- | --- | --- |
| Pre-bid criteria | Not covered | No bid package or evaluation record. |
| Procurement plan | Not covered | The materials CSV (FR-18) could feed procurement but is not a procurement record. |
| Manage implementation | Covered, with gaps | Installation and inspection (FR-27–31), commissioning and retest (FR-29–31/43/44), problem lists (FR-32/46), as-built records (FR-26/27/33/34). Gaps: no factory or pre-delivery test stage, no reliability or burn-in period after acceptance, and no end-user training record, although a project can add training as a site check under FR-43. |
| Personnel requirements | Not covered | Outside scope. |
| Monitor and evaluate through the life cycle | Partial | Service, replacement and return visits (FR-35–41/45/46). No preventive-maintenance schedule, service agreement or warranty record. |

## Licensed references Kevin holds (Kindle), not yet consulted

| Title | Edition | Expected relevance |
| --- | --- | --- |
| *Implementing Physical Protection Systems: A Practical Guide* (Patterson) | To be confirmed | Highest: design, estimating, procurement, installation, testing, training, warranty and maintenance. |
| *The Design and Evaluation of Physical Protection Systems* (Garcia) | 2nd, confirmed by Kevin | Medium: detect, delay and respond with performance measures; video assessment. |
| *Introduction to Security* (Fischer and co-authors) | To be confirmed | Lowest: broad management text; survey contents. |

The expected-relevance column is from general knowledge of these titles, not from Kevin's copies, and must be verified. The books are licensed: do not copy their text into this repository. Record findings in this project's own words with title, edition and chapter.

## Reading task for Kevin

Ordered by how much the answer could change the PRD. Rough notes or pasted highlights are both fine.

1. **Patterson — acceptance testing.** Which test stages does he name, in what order, and who performs each? Compare with Installation, Configuration, Testing and site-level checks (FR-29–31/43).
2. **Patterson — closeout.** What does he list as closeout deliverables? Compare with the Closeout preset (FR-33a), which has no operating manuals, training record or warranty start date.
3. **Patterson — design package.** Which drawings and schedules does he expect in a design submission? Compare with the Design preset (FR-33a).
4. **Patterson — estimating.** Which cost components does he list beyond equipment, cable and labour? Compare with FR-17/18.
5. **Garcia — video assessment.** How does she define levels of image detail, and by what measure? Compare with the DORI convention (FR-14).
6. **Fischer — security survey.** What does a survey record about existing conditions? Compare with FR-20/39.

## Pending decisions (proposed 2026-11-18, not confirmed)

1. Reclassify the PSP dependency in the PRD: public outline read and mapped; licensed references held but not consulted; no PSP compliance claim.
2. Add a summary of the coverage map to the addendum.
3. Keep every gap out of POC scope and list the gaps in the PRD's exclusions: risk-assessment records, bidding and procurement, personnel, training records, project scheduling, warranty tracking and backup power.
4. Note two candidates for after the POC: a reason field on a zone target, and device warranty details.
5. Add trade-term aliases to the Terms table: punch list, as-built drawings, system acceptance testing.

Decisions 3 and 4 are best held until the reading task is answered, because those answers could promote a gap into a requirement.
