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
| *Implementing Physical Protection Systems: A Practical Guide* (Patterson) | 2nd, confirmed by Kevin | Highest: design, estimating, procurement, installation, testing, training, warranty and maintenance. |
| *The Design and Evaluation of Physical Protection Systems* (Garcia) | 2nd, confirmed by Kevin | Medium: detect, delay and respond with performance measures; video assessment. |
| *Introduction to Security* (Fischer and co-authors) | To be confirmed | Lowest: broad management text; survey contents. |

The expected-relevance column is from general knowledge of these titles, not from Kevin's copies, and must be verified. The books are licensed: do not copy their text into this repository. Record findings in this project's own words with title, edition and chapter.

## Reading task for Kevin

Ordered by how much the answer could change the PRD. Rough notes or pasted highlights are both fine.

1. **Patterson — acceptance testing (answered; see findings).** Which test stages does he name, in what order, and who performs each? Compare with Installation, Configuration, Testing and site-level checks (FR-29–31/43).
2. **Patterson — closeout (partly answered; see findings).** What does he list as closeout deliverables? Compare with the Closeout preset (FR-33a), which has no operating manuals, training record or warranty start date.
3. **Patterson — design package.** Which drawings and schedules does he expect in a design submission? Compare with the Design preset (FR-33a).
4. **Patterson — estimating.** Which cost components does he list beyond equipment, cable and labour? Compare with FR-17/18.
5. **Garcia — video assessment.** How does she define levels of image detail, and by what measure? Compare with the DORI convention (FR-14).
6. **Fischer — security survey.** What does a survey record about existing conditions? Compare with FR-20/39.

## Findings from the reading task

Findings are paraphrased from material Kevin shared. No book text or screenshot is stored in this repository.

### Question 1 — acceptance testing (answered, 2026-11-18)

Source: Patterson, *Implementing Physical Protection Systems: A Practical Guide*, 2nd edition, confirmed by Kevin; chapter not recorded. Kevin shared three Kindle screenshots covering the list of test stages, the site acceptance test and the reliability test.

What the page establishes:

- **Two stages in sequence.** A site acceptance test is followed by a reliability test, also called an operational availability test. The reliability test usually runs about 30 days, alternates testing and evaluation phases, and does not start until the customer confirms in writing that acceptance testing is complete.
- **Roles.** The customer side writes the acceptance test procedures. The contractor demonstrates the system against them and against the contract requirements, then delivers a test report with results and a written statement that the system is calibrated, tested and ready for reliability testing. The report includes the approved procedures.
- **Performance measures.** Acceptance includes measured performance, not only function: throughput at each portal, error rates, and nuisance and false alarm rates against specified limits.
- **Acceptance items for video and related systems.** Cabling and transmission installed and tested; remote stations communicating with the monitoring centre; software and controls working; cameras aimed and focused; cameras facing sunrise or sunset aimed so they do not view the sun; night performance where vehicle headlights may degrade the picture; alarm-to-camera call-up working for the designated alarm points; pan/tilt/zoom limits, controls and home positions set and tested. Several items concern analog video equipment (switchers, synchronization, signal bandwidth) and need a modern equivalent, not adoption as written.

Comparison with PRD draft 0.21:

| Finding | PRD position | Assessment |
| --- | --- | --- |
| Reliability period after acceptance | None. Closeout follows testing directly (FR-31/32). | Gap. Candidate: an optional, project-defined reliability period between testing and closeout. |
| Written test report and readiness statement | The Closeout package carries test attempts and evidence (FR-33a). No separate test report or readiness statement. | Partial. Possibly met by a closeout preview; to be decided. |
| Customer-written procedures, contractor demonstration | Checklists are project-defined and technician-recorded; final acceptance is optional (FR-23–25/29). | Consistent. The PRD does not record who authored a procedure. |
| Measured performance against specified limits | Supported generically: measured checks need a value, units and conditions against a project-defined expectation (FR-29/30). | Consistent. No change needed. |
| Aim and focus; cabling tested | In the camera starter and common checklist (FR-29). | Covered. |
| Sun-facing cameras | Not in the camera starter. | Gap. Candidate starter item, and possibly a design-time note for east- or west-facing cameras. |
| Night performance with headlights | Night checks are enabled only where scoped (FR-43). | Partial. Candidate optional starter item. |
| Alarm-to-camera call-up | Integration checks only where scoped (FR-43). | Partial. Candidate site-level starter item. |
| Pan/tilt/zoom limits, controls, home positions | The PRD never mentions pan/tilt/zoom cameras. FR-10 and FR-47 assume a fixed aim. | Gap in the camera model, not only in checklists. |

Further findings from the later screenshots:

- **Four stages.** Pre-delivery or factory acceptance testing, site acceptance testing, reliability or operational availability testing, and after-implementation testing. Only the heading of the last was shared.
- **Entry conditions for the reliability test.** Acceptance testing complete, any specified training complete and all outstanding deficiencies corrected, confirmed by the customer in writing.
- **Structure.** Two phases of 15 consecutive days each, running around the clock. The contractor makes no repairs during a phase without the customer’s written authorization, and the customer stops the test when the system fails to perform as specified.
- **Assessment after each phase.** The contractor identifies each failure and its cause, repairs it, and reports in writing the failure, the corrective action, the test results and a recommended restart. About a week later the parties meet on site and the contractor demonstrates each correction by repeating the relevant parts of the tests. The customer then sets a restart date or requires the phase to be repeated, and the next phase needs written permission. The cycle repeats until the target availability is reached or the project team decides to accept the system or change the design.
- **Availability measure.** Availability is the share of the test duration during which the system was not down: test duration divided by test duration plus downtime, as a percentage. The book mentions 99.99 percent as an ideal, not as a requirement.
- **Contract advice.** Put the test program in the contract documents and tie milestone payments to test completion. This is outside Site Studio’s scope.

Further comparison with PRD draft 0.21:

| Finding | PRD position | Assessment |
| --- | --- | --- |
| Factory or pre-delivery test stage | None. Phases are Installation, Configuration and Testing (FR-29–31). | Gap, low priority. A project could record it as scoped checks; no stage exists for it. |
| Failure, written cause and correction, then repeating the relevant tests | Matches targeted retest and issue records closely (FR-44/46): history is kept, a correction is recorded, and only affected checks are repeated. | Consistent. The reliability cycle could reuse this model. |
| Restart date or repeat of the phase | A repeated test adds an attempt and keeps the earlier one (FR-31). | Consistent. A repeated phase would be a further attempt. |
| No repairs during a phase without authorization | Field changes are recorded directly with a reason and flag affected checks (FR-27/28). No notion of a test in progress. | Partial. A change during a reliability period would need to be visible against that period. |
| Availability from logged downtime against a target | Measured checks take a value, units and conditions against a project-defined expectation (FR-29/30). No duration-based check with a downtime log. | Gap. The calculation is simple; the downtime log is new. |
| Entry requires all deficiencies corrected | Closeout permits explicit Closed with outstanding items (FR-32). | Difference to respect: an optional reliability period should not force this rule on projects that close honestly with open items. |
| After-implementation testing | Not covered. | Unknown: only the heading was shared. |

Shape of a possible requirement, not proposed or decided: an optional, project-defined reliability period recorded as a site-level check whose attempt has a start, a planned duration, a downtime log and a computed availability compared with a project-defined target, reusing the existing outcome, issue and retest rules.

Question 1 is answered.

### After-implementation testing, warranty and repair logs (2026-11-18)

Source: Patterson, 2nd edition, the pages that close the same chapter, shared by Kevin as a screenshot. Kevin searched the book for “closeout” and found nothing; the book’s own term on these pages is a certificate of practical completion.

- **Tests after implementation.** Six kinds are described: periodic operational tests that confirm things work without verifying specifications; performance tests that verify equipment against specifications and may need instruments; tests after preventive or remedial maintenance; subsystem tests of parts working together; limited-scope tests of one segment of a complex system; and periodic independent evaluation tests, at least yearly, that revisit overall effectiveness.
- **Warranty.** Defects are corrected for at least 12 months from the certificate of practical completion. The book also covers response time, spares, contact details and maintenance to the manufacturer’s recommendations, which are contractual matters.
- **Repair logs.** Each service visit should record when the fault was reported, what was reported, when the visit took place, the fault actually found, the parts used, the work done and the time spent, with reports available on request.

| Finding | PRD position | Assessment |
| --- | --- | --- |
| Test after maintenance or repair | A repaired, replaced or returned-to-service device flags its relevant checks (FR-28/44). | Covered. |
| Periodic operational and limited-scope tests | A later work scope can mark devices Inspect/test only with their own checks (FR-38/45). | Mechanism covered. Nothing schedules or reminds. |
| Performance tests against specifications | Measured checks with project-defined values (FR-29/30). | Covered generically. |
| Yearly independent evaluation | None. | Gap, tied to the risk-assessment gap in Domain 1. |
| Warranty period from completion | No warranty record. A closeout record has a date that could start one (FR-32). | Gap. Already an after-POC candidate. |
| Repair log fields | Issue records hold the fault, the corrective work, evidence, actor and time (FR-46); change records hold before/after values and a reason (FR-27). No reported-versus-visited times, parts used or time spent. | Partial. |
| Response times, spares, service levels | None. | Out of scope: contractual. |

The chapter’s reference list names Garcia’s 2nd edition, which Kevin holds, and a United States Department of Energy inspectors guide for physical security systems (2009). The latter is a government publication that may be publicly readable; it has not been looked for or read.

Question 2 is partly answered: warranty and repair records are covered above, but the deliverables handed over at completion are not. Search terms to try in Patterson: practical completion, as-built, record drawings, manuals, training, handover, turnover, punch list, final acceptance.

## Public source read in part: DOE assessment guide

Kevin asked for a search for the Department of Energy guide that Patterson’s chapter cites. Searched and read on 2026-11-18.

- **Found, not read:** *Physical Security Systems Inspectors Guide*, cover date November 2007, in a 2009 web-archive capture: <https://webarchive.library.unt.edu/web/20090512221941/http://www.hss.energy.gov/IndepOversight/guidedocs/2008/Physical_Security_Systems_Inspectors_Guide.pdf>. This is probably the document Patterson cites as 2009.
- **Found and read in part:** its successor, *Physical Security Systems Assessment Guide*, December 2016, 309 pages: <https://www.energy.gov/sites/prod/files/2017/02/f34/PhysicalSecuritySystemsAssessmentGuide_Dec2016.pdf>. Read: the table of contents, Section 7 (Testing and Maintenance) and the perimeter camera test procedure in Appendix A. Not read: everything else, including interior camera, sensor, access control, communications and power tests.

Boundary: the guide tells government assessors how to inspect security at high-security nuclear facilities. It is not a commissioning standard, much of it is specific to that setting, and some criteria date from analog video. It is used here as a source of test structure and field checks, not as a requirement. Whether a newer departmental guide supersedes it was not established.

Findings, in this project’s own words:

- **Two levels of testing.** Simple operability tests run frequently; comprehensive effectiveness tests run infrequently. Results of both are recorded and kept. This matches Patterson’s operational and performance tests.
- **Written procedures.** A procedure should be detailed enough for a competent technician who does not know the system. This supports the PRD’s rule that each check states its task, method and expected result (FR-29).
- **Five camera field tests.** A functional test (a clear image at the monitoring point, pan/tilt/zoom functions and recording); a field-of-view test (a person at the far end of the view must still be discernible); an obstruction test (a person hides behind an obstruction or in its shadow); a camouflage test; and a speed-of-response test (an alarm-triggered view or recording is fast enough to see the intruder).
- **Conditions.** Camera tests are run in daylight and at night, and the functional test also at sunrise or sunset. Zones are sampled, with at least two and a representative mix of lenses.
- **Site-tour observations.** Obstructions, shadows, uneven terrain, zone length, overlap between cameras, rigidity of the mount, adequacy of lighting and weather housings.
- **Record items per camera.** Location, make and model, test and calibration frequency and method, acceptance criteria, mounting method, weather protection, tamper protection and maintenance history.
- **Pan/tilt/zoom.** Limits should stop the camera facing bright light sources, and an alarm should move it to view the alarm area.
- **Maintenance chain.** A failure is reported, a request is raised, work is assigned and dated, completion is recorded with who did it, and a closing test verifies the repair. Substitute protection is put in place while critical equipment is out of service. Maintenance requests are reviewed for trends that reveal ageing or troublesome equipment. Preventive maintenance has a documented frequency.

Comparison with PRD draft 0.21:

| Finding | PRD position | Assessment |
| --- | --- | --- |
| Field-of-view test at the far end | The camera starter checks framing and focus at specified scene points (FR-29). Modeled DORI is explicitly not a field pass (FR-30). | Strong fit. This is the field test that verifies the modeled far-range detail. Candidate starter item linked to the zone or range it verifies. |
| Obstruction and shadow test | Obstructions are modeled for visibility (FR-11). No field check verifies a modeled shadow. | Gap. Candidate starter item. |
| Day, night and sunrise or sunset conditions | Each check states its conditions; night checks only where scoped (FR-29/43). | Partial. Candidate optional conditions on camera checks. |
| Speed of response to an alarm | Integration checks only where scoped (FR-43). | Partial. Same candidate as alarm-to-camera call-up. |
| Operability versus effectiveness, with a frequency | Checks have no level or recurrence. | Gap. Strengthens the periodic-test candidate. |
| Sampling of zones | A sampled site check does not pass untested devices (FR-43). | Consistent. |
| Site-tour observations: lighting, mount rigidity, housings, terrain | Survey notes are free-form; mounting details exist (FR-7/20/39). No lighting analysis; floors are modeled flat. | Partial. Candidate survey prompts, not analysis. |
| Maintenance chain with closing test | Issue and change records with retest (FR-27/44/46). | Largely consistent; same field gaps as Patterson’s repair log. |
| Substitute protection while equipment is out of service | A Faulty device is not credited in current coverage (FR-41). No note of what covers the gap. | Gap, small. |
| Trend review of troublesome equipment | Device history is retained (FR-35/46). No summary across devices. | Partial. |
| Pan/tilt/zoom limits and alarm positioning | Pan/tilt/zoom cameras are absent from the PRD. | Gap, as already noted. |

The guide mentions an analog-era criterion for the smallest usable image of a person, expressed in scan lines. It is recorded as outdated and is not adopted; reading question 5 (Garcia) and the PRD’s DORI convention cover the same subject.

## Pending decisions (proposed 2026-11-18, not confirmed)

1. Reclassify the PSP dependency in the PRD: public outline read and mapped; licensed references held but not consulted; no PSP compliance claim.
2. Add a summary of the coverage map to the addendum.
3. Keep every gap out of POC scope and list the gaps in the PRD's exclusions: risk-assessment records, bidding and procurement, personnel, training records, project scheduling, warranty tracking and backup power.
4. Note two candidates for after the POC: a reason field on a zone target, and device warranty details.
5. Add trade-term aliases to the Terms table: punch list, as-built drawings, system acceptance testing.

Decisions 3 and 4 are best held until the reading task is answered, because those answers could promote a gap into a requirement.
