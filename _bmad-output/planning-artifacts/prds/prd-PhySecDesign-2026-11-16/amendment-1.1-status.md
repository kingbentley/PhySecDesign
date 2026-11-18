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

## Confirmed in the parallel session but not yet ported

These need adapting to PRD 1.0 before they can be proposed, because 1.0 contains things the parallel draft never had, such as inventory import and the Awaiting placement list.

- **Device state model.** A consolidated statement of device lifecycle, condition, per-scope planning and derived roll-ups.
- **Delivery slices.** A five-slice build order. It must place FR-56 to FR-62 of this PRD, and its acceptance cut line overlaps the 1.0 acceptance profile (see below).

## Differences from PRD 1.0 — not applied, for Kevin's choice

Where the parallel session decided something PRD 1.0 also decides, 1.0 stands unless Kevin chooses otherwise. This list is provisional: an independent line-by-line comparison is still in progress and may add to it.

| # | Subject | Parallel draft 0.28 | PRD 1.0 (current) |
| --- | --- | --- | --- |
| 1 | Deleting a just-placed existing-condition record | Deletable as a draft when it has no history | Not a draft: surveyed or existing records are corrected or archived (FR-55) |
| 2 | Draft routes attached to a deleted draft device | Removed with the device when themselves eligible | Deleted only when explicitly selected and independently eligible (FR-55) |
| 3 | Scope of Cancel | Any proposed device with history, issued or not | An issued or approved proposal that will not be installed (FR-55) |
| 4 | A mistaken installed mark | Can be reversed with a reason, returning the device to Proposed | Not addressed as a reversal; erroneous records are corrected (FR-55) |
| 5 | Floor and building removal | Delete, block, Retire floor with reinstatement, and Move to another floor | Guarded deletion only; retirement and migration are outside the POC (FR-60) |
| 6 | Acceptance scale | Tested fixture of 60 devices; ceiling of 10 floors, 300 devices, 5 browsers | Small functional fixture plus a larger property of about 10 buildings and 600 devices, with one or two users |
| 7 | Layout rule | Window width decides: at least 1280 px gets the design workspace, narrower gets the field view | Real-device matrix; full desktop drafting density is not required on phones (NFR-3) |
| 8 | Browsers | Latest two versions of Chrome, Edge, Firefox and Safari on desktop; iOS Safari; Android Chrome | Windows laptop in Chrome and Edge; iPhone and iPad Safari; Android phone Chrome (NFR-3) |
| 9 | Accessibility | WCAG 2.1 AA for forms, lists, schedules and the field view, with map-canvas drawing exempt | Focused checks that do not claim full accessibility conformance (NFR-3) |
| 10 | Timing targets | Project open 5 s; combined analysis 5 s; single-camera coverage 1 s; PDF package 60 s | Project open 10 s; combined analysis and zones 10 s; complete edition 5 minutes. Shared update 5 s and save 2 s agree. |
| 11 | Photo storage | Resized to 2,048 px; originals not kept | Originals retained alongside previews (FR-20/34) |
| 12 | File limits | 50 MB PDF import; 500 MB per project; 100 MB per package | 100 MiB PDF; 8 GiB project; 250 pages and 100 MiB per volume; 1 GiB per edition |
| 13 | Backup and recovery | Nightly, kept 7 days, one demonstrated restore | Daily, seven generations, 24-hour recovery point and 60-minute recovery target (FR-34) |
| 14 | Structure of FR-33 | Split into lettered parts FR-33a to FR-33f | One requirement |
| 15 | Acceptance stages | Core acceptance after slice 4, extended after slice 5 | Two fixtures and SM-5; no staged acceptance |

Two further parallel-session decisions have no obvious counterpart in what has been read of 1.0 so far and await the comparison before being classed as new or different: what a whole-revision restore brings back, and flagging a moved device from a narrow screen.

## Not carried over

The parallel session's own versions of floor restoration (its FR-54), draft deletion (its FR-55) and floor deletion (its FR-56) are superseded by FR-54, FR-55, FR-59 and FR-60 of this PRD, apart from the differences listed above.
