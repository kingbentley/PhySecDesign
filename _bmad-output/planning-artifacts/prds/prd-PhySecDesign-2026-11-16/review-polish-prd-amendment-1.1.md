# Polish review — PRD amendment 1.1 (structure, then prose)

Skill: `bmad-review`, directive `skill:bmad-review lenses=structure,prose`. Content: `prd.md` in this folder as of 2026-11-18 (737 lines, 20,080 words by `word_metrics.py`). Content class: docs. Reader type: humans. Style guide: Microsoft Writing Style Guide (configured default). Customization resolved with the installed resolver; no overrides, review guidance or report path are set. The prose lens ran after the structure lens and on top of its findings.

**Purpose and audience read.** This document exists to help the product owner and the downstream UX, architecture and test planners agree on exactly what the Site Studio proof of concept must do and how its acceptance will be judged.

**Structure model.** Strategic/Context (Pyramid). Status and conclusion lead, requirements are grouped by theme, acceptance and decision status follow. The amendment fits the model: its status is stated at the top and detailed at the end, and each new requirement sits in its thematic group.

**Scope.** PRD 1.0 text was polished earlier through this process. This pass concentrates on the 1.1 material and how it sits in the document: the Terms rows and trade-term table, the device state model, FR-63 to FR-65, the paragraphs added to FR-18/22/29/43/55, the Functional coverage row and the decision-status section. 1.0 text is mentioned only where the amendment disturbed it. No finding proposes changing what a requirement means; where a wording fix could be read that way it is phrased as “Consider”.

**Style noted and preserved.** Imperative requirement sentences without “shall”; slash-compressed lists (“notes/photos”); capitalised state values (Proposed, Existing, Needs review); cross-references as “under FR-n”; a concrete worked example in every Check; short declaratives in the 1.1 text. None of these is flagged.

Line numbers refer to `prd.md` as read. Original text is quoted exactly and is unique within its line.

## Findings (JSON)

The editorial lenses declare their own findings shape, so each entry carries `lens`, `location`, `original_text`, `revised_text` and `changes`; structure entries add `tag` and `word_impact`.

```json
[
  {
    "lens": "structure",
    "location": "L731 — Decision status › After-POC candidates",
    "original_text": " Limited external references inform discussion but do not impose contractual gates, certify calculations, or override the optional approval policy.",
    "revised_text": "MOVE: delete the sentence from L731 and append it to the end of the PSP references paragraph (L729), after “The [reference digest](sources/psp-reference-reading.md) holds the mapping and paraphrased findings.” L731 then ends at “…and a reason field on zone targets.”",
    "changes": "In 1.0 this sentence closed the PSP paragraph. The amendment inserted the After-POC list in front of it, so a statement about external references now reads as a comment on the candidate list.",
    "tag": "MOVE",
    "word_impact": 0
  },
  {
    "lens": "structure",
    "location": "L590 — FR-55, second paragraph",
    "original_text": " The same cancellation, with a reason, is available for an unissued proposal that is not eligible for Delete draft, for example because it carries installation, configuration or test evidence; it keeps its identity, history and evidence and leaves proposed membership. A proposal that is eligible for Delete draft is deleted, not cancelled.",
    "revised_text": "MOVE: take these two sentences out of their current position and place them after “Cancellation is not physical removal, a failed test, approval of changed work or a refund.” Then start a new paragraph at “Existing/installed/field-evidenced assets cannot use quick draft deletion:” and another at “A recorded installation or configuration mark made in error”.",
    "changes": "The inserted sentences separate the issued-proposal rule from its own continuation (“Preserve the issued representation…”), which does not apply to an unissued proposal. The paragraph is now about 300 words covering three rules (cancel, protect existing assets, reverse a mistaken mark); two breaks let a reader find each.",
    "tag": "MOVE",
    "word_impact": 0
  },
  {
    "lens": "structure",
    "location": "L721 — Decision status › Proposed amendment 1.1 (whole paragraph, ~190 words)",
    "original_text": "**Proposed amendment 1.1 (2026-11-18).** A parallel session",
    "revised_text": "CONDENSE into a lead plus three list items, wording otherwise kept:\n\n**Proposed amendment 1.1 (2026-11-18).** A parallel session, working from an earlier draft without knowledge of this baseline, produced additions that Kevin confirmed there. The [amendment status](amendment-1.1-status.md) records every item. The amendment has not been through the finalization review.\n\n- **New, with no counterpart here.** FR-63 (pan/tilt/zoom cameras), FR-64 (optional reliability period) and FR-65 (warranty and service-visit records), with additions to FR-7/18/20/29/43, pointer sentences in FR-10/32/38/46/47/48, a trade-term table and added exclusions.\n- **Decided by both.** This baseline stands. Kevin reviewed the differences on 2026-11-18 and kept this baseline on every one except a narrow case adopted afterwards: an unissued proposal that is not eligible for Delete draft can be cancelled with a reason (FR-55).\n- **Four clarifications that fill silences here.** Reversing a mistaken installed mark (FR-55), what a whole-revision restore may change (FR-22), un-archiving as distinct from reopening (FR-37), and listing cancelled and corrected records (FR-8/41), together with a consolidated [device state model](#device-state-model-proposed-11) and its contradiction warning (FR-30).",
    "changes": "This is the paragraph a reader uses to learn what changed, and it is one block with a sentence that says “kept this baseline on all of them, with one narrow exception” across two colons. Three labelled items match the three kinds of change and remove the all-but-one contradiction.",
    "tag": "CONDENSE",
    "word_impact": 0
  },
  {
    "lens": "structure",
    "location": "L721 — Decision status › Proposed amendment 1.1, list of touched requirements",
    "original_text": "pointer sentences in FR-10/32/38/46/47/48, a trade-term table and added exclusions",
    "revised_text": "QUESTION: the list omits the paragraph added to FR-33 (L623), the new Terms rows (L70–74) and the acceptance-profile addition (L659). If the list is meant to be complete, use: “pointer sentences in FR-10/32/33/38/46/47/48, a trade-term table, new Terms rows, added exclusions and added functional coverage in the acceptance profile”.",
    "changes": "L18 sends the reader here for “the additions listed under decision status”. A reader checking FR-33 or the acceptance profile against this list would conclude those changes are not part of the amendment.",
    "tag": "QUESTION",
    "word_impact": 12
  },
  {
    "lens": "structure",
    "location": "L101 — Heading “Device state model (proposed 1.1)” and its link at L721",
    "original_text": "### Device state model (proposed 1.1)",
    "revised_text": "QUESTION: consider “### Device state model”, with the status carried by the first sentence (“Proposed in amendment 1.1. This subsection consolidates the device states…”), and the L721 link changed to `#device-state-model`.",
    "changes": "The status is part of the anchor. When the amendment stops being proposed, the heading changes and the in-document link at L721 breaks (the same anchor is cited in review-rubric-amendment-1.1.md). Every other 1.1 addition carries its status in L18 and L721 only.",
    "tag": "QUESTION",
    "word_impact": 4
  },
  {
    "lens": "structure",
    "location": "L623 — FR-33, last paragraph before the Check (38 words)",
    "original_text": "The Closeout preset also carries reliability runs under FR-64 and warranty details and service visits under FR-65, and analysis sheets identify a pan/tilt/zoom camera’s resting view, previews and reach under FR-63.",
    "revised_text": "MERGE into the places that already list this content, then delete L623. L613, Closeout row: “…notes/photos, outstanding property issues, reliability runs (FR-64), warranty details and service visits (FR-65), and version-specific approval/bypass records.” L619: “Identify assessed camera views, a pan/tilt/zoom camera’s resting view, previews and reach (FR-63), unsupported panoramic outputs and illustrative footprints in analysis sheets.” If 1.0 sentences are to stay untouched for traceability, keep L623 and accept the split.",
    "changes": "The preset table is where a reader looks for package contents; the trailing paragraph sits after the volume-splitting rules, four paragraphs away from that table. The same content is also stated in FR-32, FR-63, FR-64 and FR-65.",
    "tag": "MERGE",
    "word_impact": -15
  },
  {
    "lens": "structure",
    "location": "L538 — FR-64, last paragraph",
    "original_text": "Treat each stage as required or optional like any other check. FR-32 is unchanged:",
    "revised_text": "CUT the first sentence: “FR-32 is unchanged:”",
    "changes": "Repeats L526 (“It is required or optional on its own”) with no added information.",
    "tag": "CUT",
    "word_impact": -12
  },
  {
    "lens": "structure",
    "location": "L75 — Terms table, Security zone row",
    "original_text": "| Security zone | Named floor area with a zone type and an optional coverage target, expressed as a DORI level and qualifying-area percentage. |",
    "revised_text": "MOVE this row up to follow the DORI row (L69), so the five 1.1 rows (L70–74) come after it.",
    "changes": "The new rows were inserted between DORI and the term that is defined in terms of DORI.",
    "tag": "MOVE",
    "word_impact": 0
  },
  {
    "lens": "structure",
    "location": "L353 — FR-63, reach paragraph (~230 words)",
    "original_text": " This is not a DORI coverage result. Without sufficient optical data,",
    "revised_text": "MOVE (split): start a new paragraph at “Without sufficient optical data, show the reach outline alone…”. The first paragraph then states what reach is and what detail it shows; the second holds the three fallback cases (optics unknown, tilt cannot reach the plane, pan or tilt limits unknown).",
    "changes": "Longest paragraph in the amendment; the fallback rules are the ones the Check tests and are hard to find at the end of it.",
    "tag": "MOVE",
    "word_impact": 0
  },
  {
    "lens": "structure",
    "location": "L659 — Acceptance profile › Functional coverage",
    "original_text": " No separate timing target is set for the reach layer.",
    "revised_text": "MOVE: Consider placing this sentence in “Confirmed performance and analysis targets”, at the end of the paragraph at L688, and removing it here.",
    "changes": "The row lists what the fixture must contain; this sentence is a statement about timing targets and a reader looking for them reads L678–688.",
    "tag": "MOVE",
    "word_impact": 0
  },
  {
    "lens": "structure",
    "location": "L101 — Placement of the device state model, and the two amendment notices (L18, L721)",
    "original_text": "### Device state model (proposed 1.1)",
    "revised_text": "PRESERVE: keep the model under “Terms and lifecycle rules”, ahead of the requirements, and keep both amendment notices.",
    "changes": "The model is 980 words of forward references, but FR-7/8/22/30/41/55 depend on its vocabulary, so defining it first is right. L18 gives status at the top and L721 the detail; the repetition serves a reader who opens only one of them.",
    "tag": "PRESERVE",
    "word_impact": 0
  },
  {
    "lens": "prose",
    "location": "L72 — Terms › Reliability stage, run",
    "original_text": "a run is one recorded attempt at a stage, with its downtime log (FR-64)",
    "revised_text": "a run is one started period of observed operation for a stage, with its downtime log; FR-64 states when a run counts as a test attempt",
    "changes": "FR-64 (L528, L534) says a run in progress is not yet an attempt and a run stopped for a reason other than failure never is one. The glossary wording says every run is an attempt."
  },
  {
    "lens": "prose",
    "location": "L419 — FR-18 Check",
    "original_text": "Subsystem subtotals sum to the same total as the ungrouped estimate, and a shared item appears under one subsystem only. A manual line with no subsystem chosen appears under Unassigned, and a contingency line appears after the subsystem groups, so the grouped view still sums to the same total.",
    "revised_text": "The grouped view sums to the same total as the ungrouped estimate, and a line that could belong to several subsystems appears under one only. A manual line with no subsystem chosen appears under Unassigned, and a contingency line appears after the subsystem groups; both are included in the grouped view’s total.",
    "changes": "Read literally, “subsystem subtotals sum to the same total” fails as soon as a percentage or Unassigned line exists, which the next sentence then has to repair. “Shared item” is not defined; the rule it tests is L417 “Assign each line to one subsystem”."
  },
  {
    "lens": "prose",
    "location": "L70 — Terms › Home position, stored position",
    "original_text": "Named pan, tilt and zoom settings of a pan/tilt/zoom camera. The home position is where it rests, and the only one counted in coverage (FR-63).",
    "revised_text": "A stored position is a named pan, tilt and zoom setting of a pan/tilt/zoom camera. The home position is the stored position where the camera rests; its view, the resting view, is the only one counted in coverage (FR-63).",
    "changes": "The entry names two terms but the first sentence defines only one, and “where it rests, and the only one counted” has no clear noun. “Resting view” is used in FR-63 and FR-33 and is defined nowhere in Terms."
  },
  {
    "lens": "prose",
    "location": "L355 — FR-63, zone paragraph",
    "original_text": "A zone shows its counted result as today and, separately,",
    "revised_text": "A zone shows its counted result under FR-15 and, separately,",
    "changes": "“As today” refers to a state of the document or product that a later reader cannot identify."
  },
  {
    "lens": "prose",
    "location": "L536 — FR-64, change during a run",
    "original_text": "Show an actual change to covered equipment recorded during a run on that run, and flag the check Needs review under FR-44, linked to that run;",
    "revised_text": "When an actual change to covered equipment is recorded during a run, show the change on that run and flag the check Needs review under FR-44, linked to that run;",
    "changes": "The original has to be read twice: “recorded during a run on that run” looks like one phrase."
  },
  {
    "lens": "prose",
    "location": "L361 — FR-63 Check",
    "original_text": "with its achievable detail; that line does not meet the target.",
    "revised_text": "with its achievable detail; reach on demand does not count toward the target.",
    "changes": "“That line” has no referent; nothing in the sentence is a line."
  },
  {
    "lens": "prose",
    "location": "L570 — FR-65, visits and resolution",
    "original_text": "and a part that is itself a replaced device follows FR-36 and FR-53",
    "revised_text": "and where a part used is itself a replacement device, that replacement follows FR-36 and FR-53",
    "changes": "The part fitted is the replacement, not the replaced device; the original reverses the two."
  },
  {
    "lens": "prose",
    "location": "L349 — FR-63, first paragraph",
    "original_text": "adds the pan range, the tilt range and the zoom range, given as the widest and narrowest field of view or the equivalent focal-length range.",
    "revised_text": "adds the pan range, the tilt range and the zoom range; the zoom range is given as the widest and narrowest field of view or the equivalent focal-length range.",
    "changes": "“Given as” attaches to all three ranges grammatically but can only apply to zoom."
  },
  {
    "lens": "prose",
    "location": "L417 — FR-18, subsystem paragraph",
    "original_text": "such as video, access control, intrusion, communications, network and power, and cabling.",
    "revised_text": "such as video; access control; intrusion; communications; network and power; and cabling.",
    "changes": "With commas a reader cannot tell whether “network and power” is one subsystem or two."
  },
  {
    "lens": "prose",
    "location": "L89 — Terms › workflow sentence; also L731",
    "original_text": "Work on different devices may be at different points in this workflow; “stage” is reserved for",
    "revised_text": "Work on different devices may be at different points in this workflow, whose parts are called phases; “stage” is reserved for",
    "changes": "The sentence reserves “stage” without saying what the workflow parts are called instead (the requirements use “phase”). L731 then breaks the reservation: change “a pre-delivery test stage” to “pre-delivery testing”."
  },
  {
    "lens": "prose",
    "location": "L117 — Device state model › ending a record; also FR-55 L590",
    "original_text": "A mistaken installed mark is reversed under FR-55, returning the device to Proposed.",
    "revised_text": "Consider: “A mistaken installed mark is reversed under FR-55, returning the device to Proposed and its work record to not installed.” And at L590, “made in error on a proposed device” → “made in error on a device that was Proposed before the mark”?",
    "changes": "The model says the reversal returns the device to Proposed; FR-55 says it returns it to not installed and calls the device “proposed” although, by L127, the mark has already made it Existing. Both are true on different axes, but nothing tells the reader so."
  },
  {
    "lens": "prose",
    "location": "L590 — FR-55, cancellation of an unissued proposal",
    "original_text": "it keeps its identity, history and evidence and leaves proposed membership.",
    "revised_text": "it keeps its identity, history and evidence and is no longer part of the Proposed design.",
    "changes": "“Proposed membership” is shorthand for a row label in the state-model table (L136) and is not used as a term anywhere else."
  },
  {
    "lens": "prose",
    "location": "L85 — Trade-term table › Commissioning, against L33",
    "original_text": "| Commissioning | The installation, configuration and testing phases through closeout. |",
    "revised_text": "Consider: the scope table at L33 describes Commissioning as “Planning, installation, configuration, testing, and closeout”. If the two are meant to agree, which one should change? No replacement proposed, since either choice is the author’s.",
    "changes": "The same word is given two extents in one document, one including planning and one not."
  },
  {
    "lens": "prose",
    "location": "L249 — FR-41, Changes view",
    "original_text": "Changes compares them and also lists cancellations and corrections under FR-55 against the current issued design.",
    "revised_text": "Changes compares them and, relative to the current issued design, also lists the cancellations and corrections made under FR-55.",
    "changes": "“Under FR-55 against the current issued design” stacks two modifiers so that the design appears to be what FR-55 is against."
  },
  {
    "lens": "prose",
    "location": "L134 — Device state model › derived table, attention indicators row",
    "original_text": "| Its checks, cable ends and port assignments, camera views and linked issues |",
    "revised_text": "| The device’s checks, cable ends and port assignments, camera views and linked issues |",
    "changes": "“Its” has no antecedent inside the row."
  },
  {
    "lens": "prose",
    "location": "L729 — Decision status › PSP references",
    "original_text": "The public ASIS PSP examination outline was read",
    "revised_text": "The public ASIS Physical Security Professional (PSP) examination outline was read",
    "changes": "PSP is never expanded in the document (also used at L502)."
  },
  {
    "lens": "prose",
    "location": "L572 — FR-65, service scope paragraph",
    "original_text": "During an open work scope, record visits in that scope. When no scope is active,",
    "revised_text": "While a work scope is active, record visits in that scope. When no scope is active,",
    "changes": "“Open” and “active” are used for the same state in adjacent sentences; “active” is the term everywhere else (FR-45, FR-38)."
  },
  {
    "lens": "prose",
    "location": "L540 — FR-64 Check",
    "original_text": "After the correction, a restarted run with no downtime passes,",
    "revised_text": "After the fault is corrected, a restarted run with no downtime passes,",
    "changes": "“Correction” is a defined record action in this document (FR-55); here it means repair."
  },
  {
    "lens": "prose",
    "location": "L659 — Acceptance profile › Functional coverage",
    "original_text": "a warranty record with a service visit opened by the one-step action (FR-65)",
    "revised_text": "a warranty record with a service visit opened by the Start service visit action (FR-65)",
    "changes": "FR-65 names the action; “the one-step action” makes a tester look it up."
  },
  {
    "lens": "prose",
    "location": "L357 — FR-63, checklist paragraph",
    "original_text": "is a meaningful change under FR-27/28 and flags the checks for that position;",
    "revised_text": "Consider: “is a meaningful change under FR-27/28 and flags the checks for that position or limit;”?",
    "changes": "The sentence covers a changed stored position or a changed limit, but only “that position” is given something to flag."
  },
  {
    "lens": "prose",
    "location": "L18 — Opening › Proposed amendment 1.1 notice",
    "original_text": "FR-1–62, NFR-1–6 and SM-1–5 keep their IDs and meaning.",
    "revised_text": "Consider: “FR-1–62, NFR-1–6 and SM-1–5 keep their IDs; their meaning is unchanged apart from the FR-55 exception and the clarifications listed there.”?",
    "changes": "L721 records one adopted exception in FR-55 and four clarifications. A reader who stops at L18 is told nothing in FR-1–62 changed."
  },
  {
    "lens": "prose",
    "location": "L74 — Terms › Warranty status",
    "original_text": "Calculated Not started, In warranty, Expired or Unknown, for information only (FR-65).",
    "revised_text": "A calculated value of Not started, In warranty, Expired or Unknown, shown for information only (FR-65).",
    "changes": "“Calculated Not started” reads as a single phrase on first pass."
  }
]
```

## Report

### Structure lens

Rows are ordered by comprehension impact.

| Pass | Line | Original Text | Revised Text | Changes |
| --- | --- | --- | --- | --- |
| structure | 731 | Decision status › After-POC candidates: “Limited external references inform discussion but do not impose contractual gates, certify calculations, or override the optional approval policy.” | MOVE: delete the sentence from L731 and append it to the end of the PSP references paragraph (L729), after “The [reference digest](sources/psp-reference-reading.md) holds the mapping and paraphrased findings.” L731 then ends at “…and a reason field on zone targets.” | In 1.0 this sentence closed the PSP paragraph. The amendment inserted the After-POC list in front of it, so a statement about external references now reads as a comment on the candidate list. (word impact +0) |
| structure | 590 | FR-55, second paragraph: “The same cancellation, with a reason, is available for an unissued proposal that is not eligible for Delete draft, for example because it carries installation, configuration or test evidence; it keeps its identity, history and evidence and leaves proposed membership. A proposal that is eligible for Delete draft is deleted, not cancelled.” | MOVE: take these two sentences out of their current position and place them after “Cancellation is not physical removal, a failed test, approval of changed work or a refund.” Then start a new paragraph at “Existing/installed/field-evidenced assets cannot use quick draft deletion:” and another at “A recorded installation or configuration mark made in error”. | The inserted sentences separate the issued-proposal rule from its own continuation (“Preserve the issued representation…”), which does not apply to an unissued proposal. The paragraph is now about 300 words covering three rules (cancel, protect existing assets, reverse a mistaken mark); two breaks let a reader find each. (word impact +0) |
| structure | 721 | Decision status › Proposed amendment 1.1 (whole paragraph, ~190 words): “**Proposed amendment 1.1 (2026-11-18).** A parallel session” | CONDENSE into a lead plus three list items, wording otherwise kept:<br><br>**Proposed amendment 1.1 (2026-11-18).** A parallel session, working from an earlier draft without knowledge of this baseline, produced additions that Kevin confirmed there. The [amendment status](amendment-1.1-status.md) records every item. The amendment has not been through the finalization review.<br><br>- **New, with no counterpart here.** FR-63 (pan/tilt/zoom cameras), FR-64 (optional reliability period) and FR-65 (warranty and service-visit records), with additions to FR-7/18/20/29/43, pointer sentences in FR-10/32/38/46/47/48, a trade-term table and added exclusions.<br>- **Decided by both.** This baseline stands. Kevin reviewed the differences on 2026-11-18 and kept this baseline on every one except a narrow case adopted afterwards: an unissued proposal that is not eligible for Delete draft can be cancelled with a reason (FR-55).<br>- **Four clarifications that fill silences here.** Reversing a mistaken installed mark (FR-55), what a whole-revision restore may change (FR-22), un-archiving as distinct from reopening (FR-37), and listing cancelled and corrected records (FR-8/41), together with a consolidated [device state model](#device-state-model-proposed-11) and its contradiction warning (FR-30). | This is the paragraph a reader uses to learn what changed, and it is one block with a sentence that says “kept this baseline on all of them, with one narrow exception” across two colons. Three labelled items match the three kinds of change and remove the all-but-one contradiction. (word impact +0) |
| structure | 721 | Decision status › Proposed amendment 1.1, list of touched requirements: “pointer sentences in FR-10/32/38/46/47/48, a trade-term table and added exclusions” | QUESTION: the list omits the paragraph added to FR-33 (L623), the new Terms rows (L70–74) and the acceptance-profile addition (L659). If the list is meant to be complete, use: “pointer sentences in FR-10/32/33/38/46/47/48, a trade-term table, new Terms rows, added exclusions and added functional coverage in the acceptance profile”. | L18 sends the reader here for “the additions listed under decision status”. A reader checking FR-33 or the acceptance profile against this list would conclude those changes are not part of the amendment. (word impact +12) |
| structure | 101 | Heading “Device state model (proposed 1.1)” and its link at L721: “### Device state model (proposed 1.1)” | QUESTION: consider “### Device state model”, with the status carried by the first sentence (“Proposed in amendment 1.1. This subsection consolidates the device states…”), and the L721 link changed to `#device-state-model`. | The status is part of the anchor. When the amendment stops being proposed, the heading changes and the in-document link at L721 breaks (the same anchor is cited in review-rubric-amendment-1.1.md). Every other 1.1 addition carries its status in L18 and L721 only. (word impact +4) |
| structure | 623 | FR-33, last paragraph before the Check (38 words): “The Closeout preset also carries reliability runs under FR-64 and warranty details and service visits under FR-65, and analysis sheets identify a pan/tilt/zoom camera’s resting view, previews and reach under FR-63.” | MERGE into the places that already list this content, then delete L623. L613, Closeout row: “…notes/photos, outstanding property issues, reliability runs (FR-64), warranty details and service visits (FR-65), and version-specific approval/bypass records.” L619: “Identify assessed camera views, a pan/tilt/zoom camera’s resting view, previews and reach (FR-63), unsupported panoramic outputs and illustrative footprints in analysis sheets.” If 1.0 sentences are to stay untouched for traceability, keep L623 and accept the split. | The preset table is where a reader looks for package contents; the trailing paragraph sits after the volume-splitting rules, four paragraphs away from that table. The same content is also stated in FR-32, FR-63, FR-64 and FR-65. (word impact -15) |
| structure | 538 | FR-64, last paragraph: “Treat each stage as required or optional like any other check. FR-32 is unchanged:” | CUT the first sentence: “FR-32 is unchanged:” | Repeats L526 (“It is required or optional on its own”) with no added information. (word impact -12) |
| structure | 75 | Terms table, Security zone row: “\| Security zone \| Named floor area with a zone type and an optional coverage target, expressed as a DORI level and qualifying-area percentage. \|” | MOVE this row up to follow the DORI row (L69), so the five 1.1 rows (L70–74) come after it. | The new rows were inserted between DORI and the term that is defined in terms of DORI. (word impact +0) |
| structure | 353 | FR-63, reach paragraph (~230 words): “This is not a DORI coverage result. Without sufficient optical data,” | MOVE (split): start a new paragraph at “Without sufficient optical data, show the reach outline alone…”. The first paragraph then states what reach is and what detail it shows; the second holds the three fallback cases (optics unknown, tilt cannot reach the plane, pan or tilt limits unknown). | Longest paragraph in the amendment; the fallback rules are the ones the Check tests and are hard to find at the end of it. (word impact +0) |
| structure | 659 | Acceptance profile › Functional coverage: “No separate timing target is set for the reach layer.” | MOVE: Consider placing this sentence in “Confirmed performance and analysis targets”, at the end of the paragraph at L688, and removing it here. | The row lists what the fixture must contain; this sentence is a statement about timing targets and a reader looking for them reads L678–688. (word impact +0) |
| structure | 101 | Placement of the device state model, and the two amendment notices (L18, L721): “### Device state model (proposed 1.1)” | PRESERVE: keep the model under “Terms and lifecycle rules”, ahead of the requirements, and keep both amendment notices. | The model is 980 words of forward references, but FR-7/8/22/30/41/55 depend on its vocabulary, so defining it first is right. L18 gives status at the top and L721 the detail; the repetition serves a reader who opens only one of them. (word impact +0) |

### Prose lens

Rows are ordered by comprehension impact.

| Pass | Line | Original Text | Revised Text | Changes |
| --- | --- | --- | --- | --- |
| prose | 72 | Terms › Reliability stage, run: “a run is one recorded attempt at a stage, with its downtime log (FR-64)” | a run is one started period of observed operation for a stage, with its downtime log; FR-64 states when a run counts as a test attempt | FR-64 (L528, L534) says a run in progress is not yet an attempt and a run stopped for a reason other than failure never is one. The glossary wording says every run is an attempt. |
| prose | 419 | FR-18 Check: “Subsystem subtotals sum to the same total as the ungrouped estimate, and a shared item appears under one subsystem only. A manual line with no subsystem chosen appears under Unassigned, and a contingency line appears after the subsystem groups, so the grouped view still sums to the same total.” | The grouped view sums to the same total as the ungrouped estimate, and a line that could belong to several subsystems appears under one only. A manual line with no subsystem chosen appears under Unassigned, and a contingency line appears after the subsystem groups; both are included in the grouped view’s total. | Read literally, “subsystem subtotals sum to the same total” fails as soon as a percentage or Unassigned line exists, which the next sentence then has to repair. “Shared item” is not defined; the rule it tests is L417 “Assign each line to one subsystem”. |
| prose | 70 | Terms › Home position, stored position: “Named pan, tilt and zoom settings of a pan/tilt/zoom camera. The home position is where it rests, and the only one counted in coverage (FR-63).” | A stored position is a named pan, tilt and zoom setting of a pan/tilt/zoom camera. The home position is the stored position where the camera rests; its view, the resting view, is the only one counted in coverage (FR-63). | The entry names two terms but the first sentence defines only one, and “where it rests, and the only one counted” has no clear noun. “Resting view” is used in FR-63 and FR-33 and is defined nowhere in Terms. |
| prose | 355 | FR-63, zone paragraph: “A zone shows its counted result as today and, separately,” | A zone shows its counted result under FR-15 and, separately, | “As today” refers to a state of the document or product that a later reader cannot identify. |
| prose | 536 | FR-64, change during a run: “Show an actual change to covered equipment recorded during a run on that run, and flag the check Needs review under FR-44, linked to that run;” | When an actual change to covered equipment is recorded during a run, show the change on that run and flag the check Needs review under FR-44, linked to that run; | The original has to be read twice: “recorded during a run on that run” looks like one phrase. |
| prose | 361 | FR-63 Check: “with its achievable detail; that line does not meet the target.” | with its achievable detail; reach on demand does not count toward the target. | “That line” has no referent; nothing in the sentence is a line. |
| prose | 570 | FR-65, visits and resolution: “and a part that is itself a replaced device follows FR-36 and FR-53” | and where a part used is itself a replacement device, that replacement follows FR-36 and FR-53 | The part fitted is the replacement, not the replaced device; the original reverses the two. |
| prose | 349 | FR-63, first paragraph: “adds the pan range, the tilt range and the zoom range, given as the widest and narrowest field of view or the equivalent focal-length range.” | adds the pan range, the tilt range and the zoom range; the zoom range is given as the widest and narrowest field of view or the equivalent focal-length range. | “Given as” attaches to all three ranges grammatically but can only apply to zoom. |
| prose | 417 | FR-18, subsystem paragraph: “such as video, access control, intrusion, communications, network and power, and cabling.” | such as video; access control; intrusion; communications; network and power; and cabling. | With commas a reader cannot tell whether “network and power” is one subsystem or two. |
| prose | 89 | Terms › workflow sentence; also L731: “Work on different devices may be at different points in this workflow; “stage” is reserved for” | Work on different devices may be at different points in this workflow, whose parts are called phases; “stage” is reserved for | The sentence reserves “stage” without saying what the workflow parts are called instead (the requirements use “phase”). L731 then breaks the reservation: change “a pre-delivery test stage” to “pre-delivery testing”. |
| prose | 117 | Device state model › ending a record; also FR-55 L590: “A mistaken installed mark is reversed under FR-55, returning the device to Proposed.” | Consider: “A mistaken installed mark is reversed under FR-55, returning the device to Proposed and its work record to not installed.” And at L590, “made in error on a proposed device” → “made in error on a device that was Proposed before the mark”? | The model says the reversal returns the device to Proposed; FR-55 says it returns it to not installed and calls the device “proposed” although, by L127, the mark has already made it Existing. Both are true on different axes, but nothing tells the reader so. |
| prose | 590 | FR-55, cancellation of an unissued proposal: “it keeps its identity, history and evidence and leaves proposed membership.” | it keeps its identity, history and evidence and is no longer part of the Proposed design. | “Proposed membership” is shorthand for a row label in the state-model table (L136) and is not used as a term anywhere else. |
| prose | 85 | Trade-term table › Commissioning, against L33: “\| Commissioning \| The installation, configuration and testing phases through closeout. \|” | Consider: the scope table at L33 describes Commissioning as “Planning, installation, configuration, testing, and closeout”. If the two are meant to agree, which one should change? No replacement proposed, since either choice is the author’s. | The same word is given two extents in one document, one including planning and one not. |
| prose | 249 | FR-41, Changes view: “Changes compares them and also lists cancellations and corrections under FR-55 against the current issued design.” | Changes compares them and, relative to the current issued design, also lists the cancellations and corrections made under FR-55. | “Under FR-55 against the current issued design” stacks two modifiers so that the design appears to be what FR-55 is against. |
| prose | 134 | Device state model › derived table, attention indicators row: “\| Its checks, cable ends and port assignments, camera views and linked issues \|” | \| The device’s checks, cable ends and port assignments, camera views and linked issues \| | “Its” has no antecedent inside the row. |
| prose | 729 | Decision status › PSP references: “The public ASIS PSP examination outline was read” | The public ASIS Physical Security Professional (PSP) examination outline was read | PSP is never expanded in the document (also used at L502). |
| prose | 572 | FR-65, service scope paragraph: “During an open work scope, record visits in that scope. When no scope is active,” | While a work scope is active, record visits in that scope. When no scope is active, | “Open” and “active” are used for the same state in adjacent sentences; “active” is the term everywhere else (FR-45, FR-38). |
| prose | 540 | FR-64 Check: “After the correction, a restarted run with no downtime passes,” | After the fault is corrected, a restarted run with no downtime passes, | “Correction” is a defined record action in this document (FR-55); here it means repair. |
| prose | 659 | Acceptance profile › Functional coverage: “a warranty record with a service visit opened by the one-step action (FR-65)” | a warranty record with a service visit opened by the Start service visit action (FR-65) | FR-65 names the action; “the one-step action” makes a tester look it up. |
| prose | 357 | FR-63, checklist paragraph: “is a meaningful change under FR-27/28 and flags the checks for that position;” | Consider: “is a meaningful change under FR-27/28 and flags the checks for that position or limit;”? | The sentence covers a changed stored position or a changed limit, but only “that position” is given something to flag. |
| prose | 18 | Opening › Proposed amendment 1.1 notice: “FR-1–62, NFR-1–6 and SM-1–5 keep their IDs and meaning.” | Consider: “FR-1–62, NFR-1–6 and SM-1–5 keep their IDs; their meaning is unchanged apart from the FR-55 exception and the clarifications listed there.”? | L721 records one adopted exception in FR-55 and four clarifications. A reader who stops at L18 is told nothing in FR-1–62 changed. |
| prose | 74 | Terms › Warranty status: “Calculated Not started, In warranty, Expired or Unknown, for information only (FR-65).” | A calculated value of Not started, In warranty, Expired or Unknown, shown for information only (FR-65). | “Calculated Not started” reads as a single phrase on first pass. |

### Overlap between the lenses

- L721: the structure pass reshapes the paragraph and asks whether its list is complete; the prose problem in it (the “all of them, with one exception” sentence) is fixed inside the structure rewrite, so there is no separate prose row.
- L590: the structure pass moves two sentences and adds paragraph breaks; the prose rows for L590 (“leaves proposed membership”, “on a proposed device”) apply to the same sentences wherever they end up.
- L623: if the MERGE is accepted, no prose fix is needed there. If L623 is kept, it reads acceptably as it stands.
- L659: one structure row (move the timing sentence) and one prose row (name the action) touch the same cell and do not conflict.

### Checked and left alone

The trade-term table and its placement; the four tables of the device state model and the “Combinations that cannot be chosen” list; the paragraphs added to FR-22, FR-29 and FR-43; the FR-64 availability rule and its worked figure (57 of 60 minutes is 95%); and the FR-65 Check. These read clearly and are consistent with the requirements they point to.

### Summary

- Structure: 11 rows (3 MOVE within a paragraph or table, 2 MOVE of a sentence, 1 CONDENSE, 1 MERGE, 1 CUT, 2 QUESTION, 1 PRESERVE). Prose: 22 rows, of which 4 are phrased as “Consider”.
- Estimated change if every structure recommendation is accepted: about -11 words on 20,080 (0.1%), from the word-metrics counts. The amendment adds little that can be cut; the recommendations are about placement and findability, not length.
- No length target was provided.
- Comprehension trade-offs: none of the recommendations removes an example, a summary or a Check. The MERGE at L623 edits two 1.0 sentences, which costs some amendment traceability; that row says how to decline it.
- Not edited: this review changed no file other than writing this report.
