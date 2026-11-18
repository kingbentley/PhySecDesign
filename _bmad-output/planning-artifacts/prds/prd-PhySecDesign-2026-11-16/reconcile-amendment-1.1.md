# Input reconciliation — proposed amendment 1.1

Prepared 2026-11-18. Read-only reconciliation of Kevin's amendment 1.1 decisions against `prd.md` and `addendum.md`. No existing file was edited.

Inputs: `amendment-1.1-status.md` (full), `.memlog.md` lines 221–233, `sources/psp-reference-reading.md` (full), `sources/parallel-session-draft-0.28/decision-log-entries.md.txt` (entries 20–23, 34–45, 48–51, 56–61 used for fidelity of ported items only). FR-63/64/65 and the device state model were also compared sentence by sentence with the snapshot `sources/parallel-session-draft-0.28/prd.md.txt` (its FR-57/58/59 and Device state model).

Not checked: the full bodies of FR-1–62 outside the parts the amendment touches. "PRD 1.0 stands" (decision 1) was verified by absence checks only.

## Summary

| Class | Count |
| --- | --- |
| Captured faithfully | 46 |
| Captured but altered or weakened | 8 |
| Missing | 2 |
| Present with no decision behind it | 4 |
| **Items checked** | **60** |

Most important findings:

| # | Finding | Class | Location |
| --- | --- | --- | --- |
| 1 | The FR-55 narrow exception (decision 6) is in FR-55 but absent from both summary statements, which still say the baseline was kept on every disagreement | Missing | prd.md:714; addendum.md:824 |
| 2 | FR-63 unknown-optics reach outline (three sentences) came from automated review rounds 2 and 3, has no decision by Kevin, and is not listed under the status file's "Adaptations made while porting" | No decision | prd.md:348; .memlog.md:230, 233 |
| 3 | The PRD and addendum say the additions "were confirmed by Kevin"; neither says that several texts are adaptations or review corrections he did not confirm | Qualitative drop | prd.md:18, 714; addendum.md:794 |
| 4 | Un-archiving versus reopening is applied in Terms, FR-37 and FR-65 but not in FR-54 or the addendum's restoration section, which still say "Reopen an archived project" | Altered (incomplete) | prd.md:579; addendum.md:624 |
| 5 | Reversing a mistaken *configuration* mark is given the outcome of an installation mark ("returns to not installed") | Altered | prd.md:585; addendum.md:826 |
| 6 | The confirmed fixture content for FR-63–65 was dropped and the PRD does not say these requirements have no acceptance-profile coverage | Missing | prd.md:647–655; status:111 |
| 7 | The addendum says two optional checks "verify the model in the field", the framing the digest was corrected away from | Altered | addendum.md:820; digest:217 |

## 1. Pan/tilt/zoom cameras (FR-63)

Decision source: decision-log entries 37, 38, 60; status line 169; memlog 229, 230, 233.

| # | Decided item | Class | Evidence |
| --- | --- | --- | --- |
| P1 | One physical asset with one view; template adds pan, tilt and zoom ranges; per-camera limits | Faithful | prd.md:344 |
| P2 | Named stored positions with one home; only the home (resting) view counts in combined coverage, DORI and zone targets | Faithful | prd.md:346 |
| P3 | A camera with no home position contributes no assessed coverage | Faithful | prd.md:346 |
| P4 | Other positions are previews with no credit | Faithful | prd.md:346 |
| P5 | Reach is a separate reachable-on-demand layer, never counted; an uncovered area within reach is identified as reachable on demand | Faithful | prd.md:348 |
| P6 | Reach shows best achievable detail at full zoom | **Altered** | See 1.1 |
| P7 | Reach outline when optical data is missing | **No decision** | See 1.2 |
| P8 | Zones show a separate on-demand line; the target is judged on the counted result only | Faithful | prd.md:350 |
| P9 | Starter checklist | Faithful | prd.md:352 |
| P10 | Guard tours, auto-tracking and time-share figures out of scope | Faithful | prd.md:354 (also "live control of a camera", already in the snapshot) |
| P11 | Pointers in FR-10/29/47/48 | Faithful | prd.md:294, 495, 322, 330 |

### 1.1 P6 — reach detail (altered, documented, not confirmed)

Decision (decision-log entry 38, confirmed by entry 60): "reach shows best achievable detail at full zoom (not a plain outline)".

Snapshot text (prd.md.txt:598): "Within reach, show the best detail achievable at the narrowest field of view, labeled as achievable in one place at a time."

PRD text (prd.md:348): "Within reach, show for each location the best detail achievable at the narrowest field of view that can still include that location within the camera’s pan, tilt and zoom limits, labeled as achievable in one place at a time. Near a limit, where only a wider view can include the location, show the detail of that wider view."

The change is recorded in the status file (line 169) and memlog 229 as a correction after automated review. It changes what Kevin confirmed and no entry records his agreement.

### 1.2 P7 — unknown-optics outline (no decision behind it)

Snapshot text: "Without sufficient optical data, show the reach outline alone with detail Not assessed."

PRD adds (prd.md:348): "Draw that outline from the pan and tilt limits, the analysis range and modeled obstructions only, as the locations on the target plane the camera can be pointed toward, without assuming a field of view. Where the known tilt limits cannot point the camera toward the target plane, show no reach there. Where the pan or tilt limits are unknown, show no reach and disclose the camera’s reach as unassessed under FR-13."

Source: memlog 230 and 233 (automated review rounds 2 and 3), both logged as changes, not decisions. The status file's "Adaptations made while porting" (lines 160–169) lists the P6 correction but not these three sentences. They introduce new behavior: no reach is drawn when limits are unknown.

## 2. Optional reliability period (FR-64)

Decision source: decision-log entries 40, 41, 49(4), 51, 56, 60; digest lines 98–119.

| # | Decided item | Class | Evidence |
| --- | --- | --- | --- |
| R1 | Optional, off by default, site-level check after testing | Faithful | prd.md:521 |
| R2 | Coverage, duration, stages, downtime definition and target are project-defined; nothing prescribed | Faithful | prd.md:521 "Prescribe none of these." |
| R3 | People record starts, ends and outages; the software computes availability; no monitoring | Faithful | prd.md:523, 527 |
| R4 | Each outage is a log entry, linked to an issue, marked as counting or not | Faithful | prd.md:525 |
| R5 | Availability is time not down over total elapsed time; overlaps not double-counted; an open outage counts as continuing | Faithful | prd.md:525, 527; matches digest line 104 |
| R6 | A full run that misses its target is Fail; a run stopped for a non-failure reason has no outcome; an open run is in progress; a missing duration or target shows Needs definition | Faithful | prd.md:523, 529 |
| R7 | Warn and record without blocking, for outstanding work and mid-run changes | Faithful | prd.md:531; addendum.md:812 |
| R8 | Parts are called stages; duration, target and required status belong to each stage; a required stage counts in Testing progress | Faithful | prd.md:521, 533 |
| R9 | Outcome, retest and closeout rules unchanged; pointers in FR-32/43 | Faithful | prd.md:533, 539, 509 |

Notes that are not gaps:

- Entry 41 says a mid-run change "flags Needs review on the attempt"; the PRD flags "the check ... linked to that run" (prd.md:531). This follows from entry 49(4), under which an open run is not yet an attempt.
- The Check arithmetic is consistent: 3 minutes down in 60 gives 95% (prd.md:535).
- The digest's "difference to respect" (line 116: an optional period should not force all deficiencies corrected first) is carried by R7.

## 3. Warranty and service-visit records (FR-65)

Decision source: decision-log entries 43, 44, 48, 60; digest lines 123–139.

| # | Decided item | Class | Evidence |
| --- | --- | --- | --- |
| W1 | Installation warranty on a work scope: term, start defaulting to the closeout date, provider, note; covers newly installed equipment and cable by default, adjustable | Faithful | prd.md:559 |
| W2 | Optional manufacturer warranty on a device; several warranties shown separately | Faithful | prd.md:559 |
| W3 | Calculated, informational status: Not started, In warranty, Expired, Unknown; unrecorded is always Unknown | Faithful | prd.md:561 |
| W4 | Service visits as entries on an issue with reported and visit times, fault found, work done, parts, time, attendee and an under-warranty value (Yes/No/Unknown, suggested, editable); several per issue | Faithful | prd.md:563 |
| W5 | A visit never resolves its issue; parts and time are records only | Faithful | prd.md:565 |
| W6 | A service call after closeout reopens the project into a scope marked as service through one action; no separate track; the mark is a label; estimate optional; an archived project leaves the archive first | Faithful | prd.md:567. "un-archived under FR-37 first" replaces the snapshot's "reopened", consistent with clarification E2 |
| W7 | "A service scope starts with no current issued design under FR-61." | **No decision** | prd.md:567; addendum.md:816. Documented as an adaptation (status line 162). It follows from FR-61 ("A later work scope does not automatically inherit the prior scope's issued reference", prd.md:450) but Kevin did not confirm it |
| W8 | No reminders, service-level tracking, spares or contract management; pointers in FR-32/38/46 | Faithful | prd.md:569, 539, 555, 426 |

### 3.1 X1 — acceptance content for FR-63–65 (missing)

Decided in the parallel session: "one such camera in the extended fixture" (entry 38); "a short period, one outage and one restart in the core fixture" (entry 40); "slice 4 as FR-59 with fixture additions" (entry 43); "fixture has two issued designs, two closeouts and two service visits" (entry 48).

PRD: the acceptance profile (prd.md:647–655) and success measures contain nothing for pan/tilt/zoom cameras, a reliability run, warranty records or service visits.

The status file records the consequence (line 111): "The acceptance profile of PRD 1.0 contains nothing for pan/tilt/zoom cameras, the reliability period or warranty records. Until it does, FR-63–65 are verified only by their own Checks." That statement does not appear in prd.md or addendum.md. Decision 1 keeps the 1.0 acceptance profile where the two lines disagree; these fixture items are additions for new requirements, not disagreements, and no decision records dropping them.

## 4. Small additions

Decision source: decision-log entries 34, 36, 41, 44; digest group A and groups C and D (lines 186–191).

| # | Decided item | Class | Evidence |
| --- | --- | --- | --- |
| S1 | Optional camera checks, off by default: sun-facing, night with bright sources, far-end view, obstruction and shadow; may reference what they relate to; never alter the modeled result | Faithful | prd.md:495 |
| S2 | Addendum description of those checks | **Altered** | See 4.1 |
| S3 | Optional site checks: alarm-to-camera call-up and its speed; handover of manuals, training, as-built records and programming list; a handover check records delivery only | Faithful | prd.md:509 |
| S4 | Camera fields: enclosure type and alarm interface | Faithful | prd.md:215 |
| S5 | Survey prompts: lighting, shadows, terrain, mount rigidity; observations only | Faithful | prd.md:223 |
| S6 | Percentage estimate lines: named base, compounding only when selected, incomplete over unpriced bases | Faithful | prd.md:410 |
| S7 | Subsystem subtotals, defaulted from equipment type and editable | Faithful | prd.md:412 |
| S8 | Trade-term table: five rows plus reliability test and repair log | Faithful | prd.md:72–82, seven rows |
| S9 | Added exclusions (digest group D, eight items) | Faithful | prd.md:39, all eight present |
| S10 | After-POC candidates (digest group C, nine items) | Faithful | prd.md:724, all nine present |
| S11 | PSP reference statement | **Altered (weakened)** | See 4.2 |
| S12 | Addendum: "Three sources assumed such cameras" | **Altered** | See 4.3 |

### 4.1 S2 — "verify the model in the field"

Digest, as corrected after automated review (line 217; memlog 229): "This is a complementary field check on the modeled far-range detail. A person being discernible does not by itself verify a DORI level, so a pass sits beside the modeled estimate and does not confirm it."

Addendum (addendum.md:820): "The optional camera checks in FR-29 include two that verify the model in the field: a person at the far end of the view, and a person behind an obstruction or in its shadow."

FR-29 (prd.md:495) is closer: "Its outcome is field evidence shown beside the modeled estimate; it neither changes the modeled result nor is implied by it." It also says the check "can reference the zone, range or modeled obstruction it verifies", and it does not state that a pass does not confirm the modeled DORI level.

### 4.2 S11 — what was and was not read

PRD (prd.md:722): "The public ASIS PSP examination outline was read and mapped to the requirements; it lists topics, not requirements. Kevin shared pages from Patterson, *Implementing Physical Protection Systems* (2nd edition), and a public Department of Energy assessment guide was read in part."

The "no compliance claim" point is kept in both targets (prd.md:722; addendum.md:804), and the addendum table (addendum.md:798–802) keeps the main limits of each source. The following points from the digest appear in neither target:

- "Not consulted: Garcia and Fischer, the other two licensed references Kevin holds" (digest line 5). Kevin decided to keep DORI without consulting Garcia, and found nothing relevant in Fischer (line 180).
- The Department of Energy guide that Patterson actually cites, the 2007 Inspectors Guide, was "Found, not read"; the 2016 successor was read instead (lines 197–198).
- Of the 2016 guide, only the contents, Section 7 and one perimeter camera procedure were read; "Not read: everything else, including interior camera, sensor, access control, communications and power tests" (line 198).
- "Whether a newer departmental guide supersedes it was not established" (line 200).
- For Patterson, "chapter not recorded" for the testing pages (line 75), and of after-implementation testing "Only the heading of the last was shared" at first (line 100).

### 4.3 S12 — "Three sources"

Addendum (addendum.md:808): "Three sources assumed such cameras while the requirements gave every camera one fixed aim."

Digest: the three mentions are Patterson's acceptance items (line 82), Patterson's sample estimate (line 157; decision-log entry 31 calls it "a third source") and the Department of Energy guide (lines 206, 210). Two are the same book. The sentence sits directly under a table of three sources that includes the ASIS outline, which per the digest does not mention pan/tilt/zoom cameras.

## 5. Decisions taken on 2026-11-18

| # | Decision | Class | Evidence |
| --- | --- | --- | --- |
| D1 | PRD 1.0 stands on groups A to D | Faithful (absence checks) | No width threshold, WCAG level, floor retirement, FR-33 parts or slices in prd.md |
| D2a | A9: reversing a mistaken installed or configured mark | **Altered** | See 5.1 |
| D2b | E1: a whole-revision restore changes design content only | Faithful | prd.md:203, 205. Deleted floors are not brought back (documented adaptation, status line 166; addendum.md:827). The snapshot's "Lifecycle stage" is not in the list of facts that stay as they are; it follows from recorded work and archive state |
| D2c | E2: un-archiving versus reopening | **Altered (incomplete)** | See 5.2 |
| D2d | E3: cancelled and corrected records stay listed, searchable with their reason | Faithful | prd.md:219, 221, 244; addendum.md:829 |
| D3 | Device state model ported, adapted | See section 6 | |
| D4 | Delivery slices stay out of the PRD | Faithful | No occurrence of "slice" in prd.md or addendum.md |
| D5 | FR-33 not split | Faithful | No FR-33a–f; FR-63/64 point to FR-33 |
| D6 | FR-55 narrow exception: requirement text, state model, addendum table | Faithful | prd.md:585, 591, 112, 139; addendum.md:534 |
| D6b | FR-55 narrow exception: decision-status summaries | **Missing** | See 5.3 |
| D7 | A10, A12, C9, E5 not adopted | Faithful | Absent from prd.md |

### 5.1 D2a — reversal of a mistaken mark

Decision (decision-log entry 57(1)): "an installation or configuration mark recorded in error can be reversed with a reason, returning the device to Proposed with its history kept".

Snapshot (prd.md.txt:564): "The device and its history are kept, a device marked Installed in error returns to Proposed, and its evidence and test attempts stay in place with Needs review under FR-44."

PRD (prd.md:585): "A recorded installation or configuration mark made in error on a proposed device can be reversed with a reason, actor and time: the device and its history are kept, it returns to not installed, and its evidence and test attempts stay in place with Needs review under FR-44. Reversal is a correction. It does not make the record eligible for Delete draft and does not apply to equipment surveyed or imported as existing."

Two changes:

- **Scope limited to proposed devices, and never eligible for Delete draft.** Documented (status line 165; memlog 228, "not individually confirmed").
- **Outcome of reversing a configuration mark.** The snapshot tied "returns to Proposed" to "a device marked Installed in error". The PRD applies "it returns to not installed" to either mark, so reversing only a mistaken configured mark is stated to undo installation. The addendum repeats it (addendum.md:826): "A proposed device marked installed or configured in error can be returned to not installed". The state model covers only the installed mark (prd.md:112). Not documented as an adaptation.

### 5.2 D2c — un-archiving applied in some places only

Applied: Terms (prd.md:94), FR-37 (prd.md:551, 553), FR-65 (prd.md:567), addendum.md:816, 828.

Not applied:

- FR-54 (prd.md:579): "Reopen an archived project under its existing policy before editing it."
- Addendum, device restoration (addendum.md:624): "Reopen an archived project under its existing lifecycle policy before editing it".

Under the adopted clarification (prd.md:94), "Reopening starts new current work under FR-38", so these two sentences now require a new work scope before restoring a device in an archived project. The status table lists the clarification as applied in "Terms, FR-37, FR-65" only.

### 5.3 D6b — exception missing from the summaries

Decision 6 (status line 57; memlog 232): "A narrow exception to A3 is adopted ... an unissued proposal that is not eligible for Delete draft can be cancelled with a reason."

PRD decision status (prd.md:714): "Where that session decided something this baseline also decides, this baseline stands: Kevin reviewed the differences on 2026-11-18 and kept this baseline on all of them. He adopted four clarifications that fill silences here ... together with a consolidated device state model and its contradiction warning (FR-30)."

Addendum (addendum.md:824): "Kevin kept PRD 1.0 on every point where the parallel session disagreed with it, and adopted four clarifications where 1.0 was silent."

Neither mentions the exception, and "on all of them" / "on every point" is no longer accurate: A3 (scope of Cancel) is a point of disagreement on which 1.0 was narrowly changed. The addendum's deletion table does carry the exception (addendum.md:534).

## 6. Device state model

Decision source: decision-log entries 20, 21, 23, 48, 56, 60; status lines 163–164; memlog 226–228.

| # | Item | Class | Evidence |
| --- | --- | --- | --- |
| M1 | Lifecycle Proposed → Installed → Removed | **Altered (documented)** | prd.md:104: "Proposed → Existing → Removed". Applied consistently at lines 104, 106, 108, 122, 130, 131, 137, 140. Reason given in status line 163 and addendum.md:833. Memlog 228: "not individually confirmed" |
| M2 | Placement axis (Placed, Awaiting placement) | **No decision (documented)** | prd.md:105, 130. Status line 164; memlog 228 |
| M3 | Provenance is not a device state; "Existing does not by itself mean verified" | **No decision (documented)** | prd.md:108. Status line 164; memlog 228 |
| M4 | Condition Working, Faulty, Unknown; starts Unknown; set by a person; not changed by a test outcome | Faithful | prd.md:106, 110 |
| M5 | Per scope: planned action (seven values including None), scope category, work recorded; None versus Retain | Faithful | prd.md:116–122 |
| M6 | Derived: phase progress, attention indicators, Current installation and Proposed design membership | Faithful | prd.md:126–131. Membership gained "that are not cancelled" and the Awaiting placement sentence, both consequences of M2 and FR-55 |
| M7 | Combinations that cannot be chosen, applied when an action is chosen | Faithful | prd.md:135–143 |
| M8 | Marks are recorded facts separate from phase progress; non-blocking contradiction warning, delivered by FR-30 | Faithful | prd.md:133, 501, 503 |
| M9 | Three record-ending actions | **Altered (documented)** | See 6.1 |

Also faithful: existing/proposed is the lifecycle stage, not a flag; recording removal archives in the same step; restoration returns the device to the middle stage without verifying installation (prd.md:108).

### 6.1 M9 — record-ending actions rewritten to PRD 1.0

Snapshot: "Delete draft leaves no active record; its ID is not given to a different record, and an earlier named revision keeps its copy. Cancel from design marks a never-installed device that has history as cancelled. ... Cancelled and corrected records are excluded from the current plan, totals and calculations."

PRD (prd.md:112): "Delete draft removes an eligible accidental proposed placement from working content and keeps its identity and change history for guarded recovery. Cancellation marks a proposal that will not be installed: an issued or approved one, or an unissued one that is not eligible for Delete draft. Correction marks an erroneous or duplicate record. Cancelled and corrected records are excluded from current totals and calculations and stay listed with their reason under FR-8 and FR-41."

The rewrite is the documented adaptation (status line 164) and matches decisions 1 and 6. Two details fall away without a replacement in the model: a deleted draft's ID is not given to a different record, and cancelled or corrected records are excluded from the current *plan* as well as from totals and calculations. The replacement successor's "starts Proposed with Add new" is also shortened to "starts Proposed" (prd.md:108).

## 7. Qualitative intent not carried into the requirement text

1. **Which text Kevin has not confirmed.** prd.md:18 says the additions "were confirmed by Kevin in a separate session"; prd.md:714 says the parallel session "produced additions that Kevin confirmed there"; addendum.md:794 says "They were confirmed by Kevin in a parallel session". The status file (lines 160–169) and memlog 228–230 and 233 record text that he did not confirm: the Existing naming, the Placement axis, the provenance statement, the proposed-only limit on mark reversal, the deleted-floor rule, the FR-61 sentence in FR-65, the FR-63 reach-detail correction and the unknown-optics outline. The addendum names three of these (addendum.md:833) without saying they are unconfirmed.
2. **Acceptance coverage.** The status file's statement that FR-63–65 "are verified only by their own Checks" (line 111) is not in either target. See 3.1.
3. **Limits of what was read.** See 4.2.
4. **"Stages" has two meanings.** Status line 167: "FR-64 calls the parts of a reliability period 'stages', while the Terms section of PRD 1.0 also uses 'stages' for points in the workflow." Both uses remain (prd.md:84 and 521) with no note.
5. **"Return to service" has two senses.** Status line 168 and decision-log entry 61 leave it unsettled. Both senses remain: repairing a faulty device (prd.md:246, 473) and restoring a removed one (prd.md:579, 589).
6. **Completeness of a recorded availability.** Kept in the addendum only (addendum.md:812: "a recorded availability is only as complete as the log"). FR-64 says the POC "observes nothing itself" (prd.md:523) but does not require the figure to be presented with that caveat.
7. **Closeout package contents.** FR-63, FR-64 and FR-65 each say the package shows their records "under FR-33" (prd.md:354, 533, 561), and FR-32 carries them (prd.md:539). The FR-33 preset table and its Check (prd.md:603–618) are unchanged and name none of them. The snapshot was the same, so this is not a porting loss.
