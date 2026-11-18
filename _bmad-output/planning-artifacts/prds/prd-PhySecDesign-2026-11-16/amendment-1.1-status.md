# Site Studio — proposed amendment 1.1: status

Prepared 2026-11-18. The [final PRD 1.0](prd.md) remains the requirements baseline. This note tracks what a parallel session added on top of it, what is still to be ported, and where that session's decisions differ from 1.0 and have **not** been applied.

## How this arose

PRD 1.0 was finalized on 2026-11-17. A separate cloud session started minutes earlier from the repository as it then stood, at draft 0.15, and continued to its own draft 0.28 without knowledge of 1.0. Both lines made decisions on the same open questions, and both created requirements numbered FR-55 to FR-59 with different meanings. On discovering this, Kevin chose to keep PRD 1.0 as the baseline and port only what is new.

The parallel draft, its addendum and its decision-log entries are preserved unedited in [sources/parallel-session-draft-0.28](sources/parallel-session-draft-0.28/prd.md.txt). Requirement numbers in that snapshot above FR-54 do not match this PRD.

## Ported into the PRD as proposed amendment 1.1

All of these were confirmed by Kevin in the parallel session. None has been through the finalization review.

| Addition | Where in the PRD | Number in the snapshot |
| --- | --- | --- |
| Pan/tilt/zoom cameras: resting view, stored positions and reach | FR-63, with pointers in FR-10/29/47/48 | FR-57 |
| Optional reliability period with a downtime log | FR-64, with pointers in FR-32/43 | FR-58 |
| Warranty and service-visit records | FR-65, with pointers in FR-32/38/46 | FR-59 |
| Optional camera checks: sun-facing, night with bright sources, far-end view, obstruction and shadow | FR-29 | FR-29 |
| Optional site checks: alarm-to-camera call-up; handover of manuals, training, as-built records and programming list | FR-43 | FR-43 |
| Camera fields: enclosure type and alarm interface | FR-7 | FR-7 |
| Survey prompts: lighting, shadows, terrain, mount rigidity | FR-20 | FR-20 |
| Percentage estimate lines and subsystem subtotals | FR-18 | FR-18 |
| Trade-term equivalents table | Terms and lifecycle rules | Terms |
| Added exclusions | Users and POC scope | Users and POC scope |
| PSP reference statement and after-POC candidates | Decision status and downstream work | Open questions and assumptions |

Also carried over unchanged: the [PSP reference digest](sources/psp-reference-reading.md) and a one-line application fix in `site-studio/src/RevisionPanel.jsx`.

## Result of the independent comparison

On 2026-11-18 an independent reader compared every decision of the parallel session with PRD 1.0, by subject and with quoted text from both. It classified 104 items:

| Class | Count | Handling |
| --- | --- | --- |
| Same in both | 31 | Nothing to do. |
| New in the parallel session | 40 | 26 ported above; 14 not ported, listed below. |
| Different from PRD 1.0 | 32 | Not applied, except the PSP reference statement, which is a statement of fact. Listed below. |
| Explicitly excluded by PRD 1.0 | 1 | Not applied. Listed below. |

PRD 1.0 stands on every point below unless Kevin chooses otherwise. Suggested handling is a recommendation, not a decision.

### A. Deletion and floors

Suggested handling: keep PRD 1.0. Items A9 and A10 fill gaps in 1.0 and are worth considering on their own.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| A1 | Which records Delete draft covers | A just-placed existing-condition record with no history is deletable. A proposed item with any note, photo or linked issue is not; it must be cancelled with a reason. | Never offered for a record surveyed as existing. A proposed draft with notes or photos can be deleted, and the notes keep their context (FR-55). |
| A2 | Definition of “history” | One closed definition, reused for devices, cable runs and floors | No single definition; eligibility tests origin as well as history, and ambiguous cases go to review (FR-55) |
| A3 | Scope of Cancel | Any proposed device with history, issued or not | Only an issued or approved proposal that will not be installed (FR-55) |
| A4 | Dependents of a deleted draft | Eligible draft-only routes, reservations and links are removed with the device after a preview | A draft cable is deleted only when explicitly selected; only the proposal’s own reservation is released (FR-55) |
| A5 | What a deletable floor may hold | Draft-only contents are deleted with the floor | Any device or cable reference blocks deletion, even a draft; nothing cascades (FR-60) |
| A6 | Cable runs on a floor being deleted | Only a run with history blocks | Any cable or riser reference blocks (FR-60) |
| A7 | Removing a building | Apply delete, block or retire to each floor | Only an empty draft building can be deleted; a child floor is a blocker (FR-60) |
| A8 | Retire floor and reinstatement | A floor holding only history is retired, kept read-only and can be reinstated | Explicitly outside the POC; such a floor stays blocked and stays listed (FR-60) |
| A9 | Reversing a mistaken installed or configured mark | Reversible with a reason; the device returns to Proposed with its history kept | Not present |
| A10 | Move to another floor | Selected records move with IDs and history kept, as a correction or an actual relocation | Not present; automatic migration is outside the POC (FR-60) |
| A11 | Restoring a device whose floor is gone | Covers retired and unresolved floors, with reinstatement | Covers deleted or unresolved floors; no reinstatement path (FR-54) |
| A12 | Deleting a multi-view camera draft | Removes its own draft views and streams only | Not stated; lifecycle follows the general rules (FR-48) |

### B. Screens, browsers and field moves

Suggested handling: keep PRD 1.0. Its real-device matrix requires placing imported devices from a phone, which the parallel width rule would forbid.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| B1 | Layout rule | Window width decides: at least 1280 px gets the design workspace, narrower (to 360 px) gets the field view | No pixel threshold or named layouts; smaller screens, phones and desktop (NFR-3) |
| B2 | What a narrow screen can do | Nothing that needs a position on the plan; no closeout or device restoration | Must place imported devices from a phone; closeout and restoration neither required nor ruled out |
| B3 | Recording a moved device from a phone | Only a flag; the move is recorded later on a wide screen | The move itself is recorded at once, on any device (FR-27) |
| B4 | Browsers | Latest two versions of Chrome, Edge, Firefox and Safari on desktop | Chrome and Edge on a Windows laptop; mobile browsers agree (NFR-3) |
| B5 | Accessibility | WCAG 2.1 AA shown by an automated scan and a keyboard pass, with map drawing exempt | Focused checks with no conformance level, drag alternatives and 200% zoom; no automated audit (NFR-3) |

### C. Acceptance scale and timing

Suggested handling: keep PRD 1.0. Its workload is larger and its measurement rules are stricter. Item C9 could be added as one row.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| C1 | Fixtures | One fixture: 2 buildings, 5 plans, 60 devices, 30 cameras | Two: a small one of about 50 assets, and a large one of about 10 buildings, 20–30 plans, 600 devices and 150 cameras |
| C2 | Supported ceiling | 10 floors, 300 devices, 300 photos, 50 revisions | No count ceiling; the test workload already exceeds the parallel ceiling |
| C3 | Concurrent users | 3 tested, 5 supported | 1 and 2 tested |
| C4 | Combined floor analysis | 5 seconds on a 30-camera fixture | 10 seconds on the busiest plan of about 60 cameras, including all zones |
| C5 | Project open | 5 seconds | 10 seconds for first open; 5 seconds for a warm plan switch |
| C6 | PDF package generation | 60 seconds on the small fixture | 5 minutes on the full-size fixture |
| C7 | Photo upload | 10 seconds including transfer over a mobile connection | 10 seconds for processing after the bytes arrive; no transfer target |
| C8 | How timings are judged | No pass rate; hardware class and three browsers named | 19 of 20 trials; long jobs three runs; declared manifest |
| C9 | Single-camera coverage update | Within 1 second of finishing an edit | No such row; nearest is 250 ms interaction feedback |
| C10 | Acceptance stages | Core after slice 4, extended after slice 5 | No staged acceptance; SM-5 covers representative scale |

The acceptance profile of PRD 1.0 contains nothing for pan/tilt/zoom cameras, the reliability period or warranty records. Until it does, FR-63–65 are verified only by their own Checks.

### D. Storage, files and recovery

Suggested handling: keep PRD 1.0.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| D1 | Photo and drawing storage | Photos kept only as a 2,048 px copy; the original PDF is not retained | Original photos kept with previews; the source PDF is retained (FR-6/20/34) |
| D2 | File-size limits | PDF 50 MB; project 500 MB; package 100 MB | PDF 100 MiB; project 8 GiB; 100 MiB per volume and 1 GiB per edition; photo, inventory and backup limits also set |
| D3 | Backup and recovery | Nightly, 7 days, one demonstrated restore | Same frequency and retention, plus a 24-hour recovery point, a 60-minute restore target and an isolated restore check (FR-34) |

### E. Clarifications and structure

Suggested handling: E1 to E3 fill silences in PRD 1.0 and are worth adopting; E4 and E5 are optional.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| E1 | What a whole-revision restore may change | Design content only; recorded actual positions, recorded work, evidence and archive state are never rolled back. A since-deleted draft returns with its original ID. | Protects historical and fixed records; silent on whether current recorded facts can be rolled back (FR-22) |
| E2 | Leaving the archive versus starting later work | Un-archiving is a separate action that starts no work scope | “Reopen” is used for both, so the only exit from the archive starts new work (FR-37/38) |
| E3 | Cancelled and corrected records | Stay listed in schedules and the Changes view, searchable with their reason | A cancellation shows only as a scope change in comparison and closeout (FR-8/41) |
| E4 | Structure of FR-33 | Six lettered parts with six checks | One requirement; it also has a paragraph on numbered PDF volumes that the parallel draft lacks |
| E5 | Notes on words used in more than one sense | Five short notes: views, retire, archive, reopen, phase | Not present |
| E6 | PSP reference statement | Material read; dependency closed | **Applied in 1.1**, because it is a statement of what was read; no compliance claim is added |

### F. Device state model — not ported

Suggested handling: port as a consolidation adapted to PRD 1.0 if wanted. It names values that 1.0 leaves unnamed, and it would need the Awaiting placement list and import provenance added.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| F1 | Lifecycle | One stored axis: Proposed, Installed, Removed; “existing” means Installed | No named lifecycle values; existing/proposed, installation state and archive state are separate distinctions |
| F2 | Condition | Working, Faulty, Unknown; starts Unknown; changed only by a person | A condition is recorded but its values are not named |
| F3 | Planned action | Seven values including None; stored per device for each work scope | Six values; storage not stated |
| F4 | Combinations that cannot be chosen | Listed | Not present |
| F5 | Contradiction warning | Non-blocking warning when recorded work and check results disagree | Not present |

### G. Delivery slices — not ported

Suggested handling: port as a build order only, renumbered and extended to FR-56–62, or leave slicing to the epics stage named in the handoff.

| # | Subject | Parallel draft 0.28 | PRD 1.0 |
| --- | --- | --- | --- |
| G1 | Five delivery slices | Shared foundation; design and issue; install, test and close out; existing sites and return visits; extended modelling | Requirements are in thematic order with no build order |
| G2 | Requirements delivered in parts | Seven, with the part in each slice stated | Not present |
| G3 | Slice transition rules | For example: one implicit scope until slice 4; all placed devices analysed until slice 3 | Not present |

The parallel slices do not place FR-56 to FR-62 of this PRD (inventory import, Awaiting placement, duplicate preview, bulk deletion, the deletion guard, the current issued design, spreadsheet mapping) or SM-5.

## Adaptations made while porting

- FR-65 gained one sentence that the parallel draft did not have: a service scope starts with no current issued design under FR-61.
- FR-65 uses PRD 1.0’s wording for leaving the archive, pending item E2.
- FR-64 calls the parts of a reliability period “stages”, while the Terms section of PRD 1.0 also uses “stages” for points in the workflow.
- “Return to service” is used in two senses in both documents; neither settles it.

## Not carried over

The parallel session's own versions of floor restoration (its FR-54), draft deletion (its FR-55) and floor deletion (its FR-56) are superseded by FR-54, FR-55, FR-59 and FR-60 of this PRD, apart from the differences listed above.
