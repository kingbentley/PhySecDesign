# Independent review of the epics and stories, draft 0.6

Run on 2026-11-18 with the BMAD `bmad-review` skill (6.12.4). Three reviewers read [epics.md](epics.md) at draft 0.6 separately. None saw the others' findings, the [review of draft 0.5](review-epics-draft-0.5.md) or the working files of the revision. Line numbers refer to draft 0.6 as committed that day.

This file records what the reviewers reported. Nothing in it has been applied to the stories, and no finding has been accepted or rejected by Kevin. The reviewers do not rank findings.

| Lens | What it looked for | Findings |
| --- | --- | --- |
| Adversarial | Hidden dependencies on later stories, inconsistency between epics, fidelity to the sources, buildability | 14 dependency, 15 consistency, 14 fidelity, 8 buildability |
| Edge-case hunter | Cases still unhandled, and cases two stories handle in conflicting ways | 45 |
| Editorial structure | Whether the product owner can review the document, and whether the choices table supports decisions | 18 recommendations |

The adversarial reviewer read the PRD, the architecture and parts of the UX specification; it did not read the PRD addendum.

## Adversarial

### 1. Dependency

**D1. Story 1.2, last criterion**
- Trigger: "an account, a session and a project created on one are unknown to the other" needs a project, which story 1.6 creates.
- Fix: limit 1.2 to accounts and sessions; move the project case to 1.6 or 2.1.
- Consequence: 1.2 cannot be closed in order.

**D2. Stories 1.3 and 1.7 need deactivation and role demotion from 1.8**
- Trigger: 1.3 refuses an invite to a "deactivated account". 1.7 tests "a deactivated account ... refused", "deactivating an account takes effect on that person's next request" and "The last administrator cannot be demoted or deactivated", including the two-request race. Deactivate and change of installation role first appear in 1.8; 1.7 only declares membership functions.
- Fix: declare the deactivate and change-role server functions in 1.7, as it does for membership, or move those criteria to 1.8.
- Consequence: 1.7's gate tests are untestable when built in order.

**D3. Story 1.3 has no place to invite from**
- Trigger: 1.3 cites "S-30 invite panel", but Administration arrives in 1.8 and the 1.3 account menu holds only name and Sign out (choices table).
- Fix: state the interim entry point in 1.3.
- Consequence: the builder invents a throwaway screen.

**D4. Story 2.4 needs 2.7's per-device records**
- Trigger: 2.4's "two browsers edit the same camera ... different cameras ... both succeed" presumes each device is its own versioned item. Story 2.7 introduces that ("Each device is saved as its own versioned item: two people editing two different devices both succeed"), and that criterion is also a duplicate.
- Fix: define the unit of versioning in 2.2, or move the camera cases to 2.7 and delete the duplicate.
- Consequence: 2.2–2.4 are built on an undefined item granularity and then reworked.

**D5. Story 2.1 and 2.6 name things that do not exist yet**
- Trigger: 2.1 says "cannot open the project or any of its files" (files arrive in 2.6). 2.6 says the PDF password is "absent from every request, record and backup" (backups arrive in Epic 8).
- Fix: move each clause to the story that creates the thing.
- Consequence: criteria are ticked without being exercised.

**D6. Story 5.1 searches a field no story creates**
- Trigger: "search on identifier, label, name, room or model". The UX does say room (line 347), but before Epic 6 no device has a room; "room hints" first appear in 6.2. This contradicts Epic 5's "no criterion in this epic needs a story from Epics 6 to 10".
- Fix: add a room/location field to 2.7 or 4.2, or drop "room" from 5.1 until 6.4.
- Consequence: untestable search term, or an unplanned schema change in Epic 5.

**D7. Story 5.6 flags on port and power changes that 7.5 introduces**
- Trigger: "A recorded change of equipment, configuration, cable, port or power connection flags that device's settings, link and function checks". Ports arrive in 7.5, which has no criterion that a current port change flags link checks; it only adds Needs connection review.
- Fix: add the port/power flag criterion to 7.5 and trim 5.6.
- Consequence: the FR-28 row "port or power connection changed" is delivered by nobody.

**D8. Story 6.3 needs 6.4's Awaiting placement**
- Trigger: 6.3's result gives "links to the records awaiting placement". Where an applied New row with no position goes is defined only in 6.4.
- Fix: move that rule into 6.3, or reorder.
- Consequence: 6.3's apply has no defined destination for new rows.

**D9. Epic 7's dependency line is wrong**
- Trigger: it claims "Epics 1 to 5 complete. Story 7.3 also needs story 6.8, story 7.5 needs stories 6.8 and 6.9". But:
  - 7.1 uses condition and Faulty crediting ("A view marked Faulty is not credited"), from 6.1 and 6.6.
  - 7.3 uses "planned action" and "A retained door", from 6.6.
  - 7.5 uses "Undoing ... a bulk cleanup", from 6.5.
- Fix: state "Epics 1 to 6".
- Consequence: anyone pulling Epic 7 forward on the stated dependency hits missing records.

**D10. Epic 3's dependency line is incomplete**
- Trigger: 3.2 uses "analysis status (story 2.8)" and save state (2.2). 3.4 moves floor management (2.5) and builds the analysis strip (2.8). 3.6 has "Optics holds the camera controls of story 2.8". None is listed.
- Fix: say Epic 3 needs Epic 2 through 2.11.
- Consequence: same as D9.

**D11. Things used but never created**
- Trigger:
  - "Records timeline" (4.1, 4.7, 4.8): story 3.1 only re-homes the prototype's Revisions and Review dialogs "with their content unchanged".
  - The revision "identifier" shown in the frame (4.8): 4.1 records only name, scope, account and time.
  - "request a review" and the "Awaiting decision" state (4.8): 4.6 has no request action.
  - Device fields for serial number, IP and MAC (mapped in 6.2, printed as "known settings and identifiers" in 5.12).
- Fix: add one creating criterion for each.
- Consequence: each is invented ad hoc by whichever story meets it first.

**D12. Inspector placeholders are never replaced**
- Trigger: 3.6 says "Work and Checks each say plainly that the feature is not available yet". Stories 5.3 and 5.5 put marks and outcomes "on the device sheet" (screens S-F4/S-F5, the field shell). No criterion fills the desktop Work and Checks tabs, and none fills the "Connections" area that 3.1 leaves as not available.
- Fix: add desktop criteria to 5.3, 5.5 and 7.5.
- Consequence: desktop Editors keep placeholder tabs after Epic 5, while FR-68 gives Editors every action.

**D13. Prototype costs, revisions and review are in limbo from 2.1 to 4.x**
- Trigger: 2.2 saves "a building, floor, plan placement, device, route, obstruction, zone, note or analysis setting". 2.12 lists costs and named revisions as "not imported". 3.1 still shows the prototype's Materials, Capacity, Revisions and Review dialogs "with their content unchanged", and 4.7 says the review dialog used a "development-only review service".
- Fix: say whether those dialogs are hidden, read-only or browser-local until 4.1/4.4/4.6, and how a Viewer is kept from changing them.
- Consequence: unsaved browser-only data sits inside a shared project, against standing rule 1.

**D14. Benchmarks run before the manifest is fixed**
- Trigger: 10.1 says the manifest is "fixed ... before any benchmark is run", and the PRD says "Before benchmarking, record ...". Stories 2.7, 2.8, 3.5, 4.10 and 5.1 already carry 19-of-20 timing criteria on the fixture.
- Fix: label the early runs development measurements that do not count, or move the manifest and Kevin's confirmation to 2.7.
- Consequence: early passes are quoted as acceptance evidence against an unconfirmed fixture.

### 2. Consistency

**C1. The small functional project has two owners**
- Trigger: 2.7 says "The same script also generates the small functional project". 10.1 says "A small functional project of about 50 devices, built for this story". The choices table has both rows: "2.7 | The fixture script also makes the small functional project" and "10.1 | ... built in 10.1, not by the 2.7 script ... 2.7 generates only the acceptance-size project".
- Fix: pick one.
- Consequence: two different fixtures, or none.

**C2. The 8 GiB fixture is delivered twice and may not be reachable**
- Trigger: 2.7 says "a run up to 8 GiB is shown to complete". 8.2 says "The fixture script of story 2.7 is extended to add files up to the 8 GiB limit". Also 25 plans at 100 MiB per PDF is 2.5 GiB, and 2.6 stores identical content once.
- Fix: keep it in one story and say which file kinds fill the 8 GiB.
- Consequence: duplicate work, and R3/R5 are run on a project that is not really 8 GiB.

**C3. Installed and Configured are per device here, per scope in the PRD**
- Trigger: the state model stores "Work recorded" "per device for each work scope". Story 5.3 and the choices table make the mark "one fact per device" ("no second entry is created"). Story 6.6 then needs "Recording Installed on a device with a planned Relocate" on a device that may already carry a mark. Story 5.3's reversal says "The device returns to Proposed", which is wrong for a relocated Existing device (FR-55: reversal "does not apply to equipment surveyed or imported as existing"). No story defines the work-done record for Service or reconfigure.
- Fix: make marks per device per scope in 5.3, and restrict the reversal rule to add-new devices.
- Consequence: later-scope work in Epic 6 cannot be recorded, or reversal corrupts lifecycle.

**C4. "Device of the active scope" is undefined before 6.7, and 5.4's default defeats itself**
- Trigger: 5.4 says core checks are "required by default for each Proposed device of the active scope", but 5.3 turns the device Existing when Installed is recorded. 5.7 and 5.12 count "devices of the active scope not marked Installed" and "no in-scope device unmarked as installed" while hand-set or prototype-imported Existing devices (2.7, 2.12) have no mark. Story 6.7 later restates the default "for each Work now device".
- Fix: in Epic 5, define in-scope as devices that were Proposed in the scope, regardless of current lifecycle.
- Consequence: Completed is blocked forever by existing devices, or checks vanish on install.

**C5. Floor-deletion guards make three criteria unreachable**
- Trigger: 4.1 says "Deleting a floor that any saved revision contains is refused", yet also "Restored content that refers to a floor that no longer exists is left out" and "returns ... when its floor still exists". 6.8 says "A floor that holds a removed device's last location cannot be deleted", yet 6.9 says "When the original floor was deleted, the user chooses another current floor".
- Fix: say how such a floor can come to exist (for example an imported prototype revision or a legacy backup), or mark the criteria as defensive with a test-only set-up.
- Consequence: untestable criteria, or a tester concludes the guard is broken.

**C6. Closeout package source**
- Trigger: 5.12 says "generated from the closeout record, never from live records", and also "A package generated before closing is labelled Draft, In progress". Before closing there is no closeout record. Likewise the record "does not change afterwards", yet final-acceptance decisions made after closing appear "as they stood at its cutoff".
- Fix: define the pre-closeout source, and say decisions are separate append-only entries read at the cutoff. Story 4.10 needs the same statement for "review decisions recorded up to the cutoff" and for survey evidence.
- Consequence: the package generator has no defined input.

**C7. Is a bypass on the assignment or on the revision?**
- Trigger: 4.6 says assignments are "for the project" and labels a decision "after the assignment was bypassed". 4.7 makes a link read-only "When the assignment the link serves is reassigned or bypassed". 4.8 says "B's approval state comes only from decisions and bypasses recorded on B". A link is created for "one saved revision and one named reviewer" with no stated tie to an assignment.
- Fix: bypass per revision per checkpoint; link the reviewer link to an assignment explicitly.
- Consequence: bypassing revision A silently freezes a client's link to revision B.

**C8. Approval states omit two cases**
- Trigger: 4.8 and 5.1 show "Approved, Bypassed or Awaiting decision". 4.6 allows a "Request changes" decision and "no reviewer assigned".
- Fix: add Changes requested and No review to the state list and to story 3.2.
- Consequence: a rejected design is displayed as "Awaiting decision".

**C9. Standing rule 9 is not followed**
- Trigger: "A story that adds a kind of record states whether a revision restore replaces it or leaves it unchanged". No such statement appears in 4.3 (templates), 4.5, 4.6/4.7 (assignments, decisions, comments), 5.8 (site checks), 5.10, 6.2/6.3 (import batches), 7.1 (views), 7.3 (door links) or 7.6 (risers, runs, ledger).
- Fix: add one line to each.
- Consequence: restore behaviour for those records is decided at build time.

**C10. Notes pointers to stories that do not carry the item**
- Trigger:
  - 5.2 Notes: hide-layer rule "is in story 6.6". 6.6 Notes: it "is in story 5.2". Neither has it; 2.8 does ("Hiding a camera or a layer does not change any total").
  - 9.3 Notes: "stories 9.5 and 9.7 set the marker". 9.5 has no marker criterion, although AD-20 says the marker is written "before an update changes anything".
  - 9.3 Notes cite "standing rule 7" for conversions; it is rule 8.
  - 9.4 Notes: 9.5 and 9.7 each add "manual steps to the 'Update checks are off' state". Neither does.
  - 8.3 Notes: guidance on site credentials in notes "belongs to the stories that add them". Neither 2.10 nor 5.5 has it (NFR-5).
  - 4.8 Notes: "a service scope needs no issued design (story 6.12)". See F3.
- Fix: correct each pointer or add the criterion.
- Consequence: the promised behaviour falls between stories.

**C11. Duplicated criteria**
- Trigger:
  - 3.1 and 5.2 both state "The view switch offers Design and Installation" and the default basis.
  - 3.1 and 4.8 both state the chip reads "Not issued".
  - 1.10 and 2.6 both state the Maps key visibility notice.
  - 8.5 restates the 100 MiB, 25 MiB and 10 MiB refusals of 2.6, 2.10 and 6.2.
  - 9.3 and 9.7 both state "newer data and no pending-update marker refuses".
- Fix: keep each in one story and reference it.
- Consequence: wording drifts between copies.

**C12. Issue state wording in 5.9**
- Trigger: the list shows "state (Open, Deferred or Resolved)", but "A deferred issue stays open". The attention count is "open issues plus ...", which leaves unclear whether deferred issues count.
- Fix: one status (Open/Resolved) plus a disposition, and say whether deferred counts.
- Consequence: differing counts on the project list and the remaining-work list.

**C13. Refusal labels and device-menu wording**
- Trigger: stale saves get labels in 2.2, 5.12, 6.11 and 8.2 ("not saved: ..."), but 6.8's refused save onto a removed device has none. Story 4.9 says the menu "offers the one action that applies", while 5.3 and 6.8 add Reverse installed mark and Record removal to the same device.
- Fix: add "not saved: device removed"; reword 4.9.
- Consequence: an inconsistent save-status list.

**C14. Choices count**
- Trigger: the text says "There are 218"; the table has 217 choice rows (lines 2141–2357) plus a stray row "Format: `story | choice made | why`".
- Fix: correct the count and delete the stray row.
- Consequence: Kevin's confirmation list does not reconcile.

**C15. No story defines a project with no active scope**
- Trigger: after 5.12 closes the only scope, 2.10 entries and 5.9 issues still "record the active scope". 5.12 refuses only stale-tab saves "for the closed scope". Reopening arrives in 6.10.
- Fix: state what an Editor can and cannot do between closing and reopening.
- Consequence: design edits and new evidence after closeout have undefined ownership.

### 3. Fidelity to the sources

**F1. Imported devices have no lifecycle (FR-62, state model)**
- Trigger: the state model says "A surveyed or imported existing device starts at Existing", with condition Unknown. Stories 6.2–6.4 never state the lifecycle of an imported row.
- Fix: add it to 6.3.
- Consequence: imports default to Proposed (2.7), enter the estimate and become deletable drafts.

**F2. FR-28 row not delivered**
- Trigger: "Physical obstruction/scene, coverage target or criterion changed | Recompute analysis and review which current requirements lack applicable evidence; flag corresponding field checks". Story 5.6 has no obstruction or target case, and its "an edit to the proposed design that changes nothing recorded on site flags nothing" can be read to exclude it.
- Fix: add the criterion to 5.6.
- Consequence: a zone target is raised and the far-end check stays passed.

**F3. Service scope exception not carried (FR-26, FR-65)**
- Trigger: FR-65 says "field changes can be recorded in it under FR-27 without issuing one", and its Check includes "a replaced power supply". Story 5.3 prompts to issue on "the first Installed or Configured mark" when nothing is issued. Story 6.12 exempts only a re-aim.
- Fix: 6.12 suppresses the 5.3 prompt in a service scope.
- Consequence: a technician on a service visit is forced to issue a design.

**F4. Cloudflare update order contradicts FR-72**
- Trigger: FR-72 says "The same steps apply on both hosts. Verify the release's signature. Tell signed-in users ...". Story 9.7 warns users, stops changes, backs up and sets the marker before the workflow verifies the signature. The choices row for 9.5 says "PRD order puts verification first"; the 9.7 rows do not list the inversion.
- Fix: list it as a choice for Kevin, or add a pre-check of the signature in the workflow before changes stop.
- Consequence: a bad-signature release interrupts every user; an unlisted departure from a Check.

**F5. Story 9.7 does not require every project to be converted before success**
- Trigger: 9.6 has "A conversion failure for any one project ... returns the whole installation". 9.7's health check is "a project opens and a test save is acknowledged; on success the marker is cleared". Story 1.1 converts "each time an object starts", which implies conversion on first open.
- Fix: 9.7 converts all projects and the installation data before clearing the marker.
- Consequence: a project fails conversion days later; 9.3 then "opens no project for normal use" with no way back, against NFR-8.

**F6. FR-64 Check says "unpassed"**
- Trigger: the Check reads "While a required stage is unpassed, the scope can close only with outstanding items". Stories 5.11 and 5.12 use "not started, running or failed", which leaves out a stage whose only run was stopped for another reason, and one at Needs definition.
- Fix: use "has no current Pass".
- Consequence: Completed is available with an untested required stage.

**F7. FR-60 references not all guarded**
- Trigger: FR-60 says "Check ... retained revision/issue/closeout context". Story 2.5's list of later blockers is 2.6, 2.10, 4.1, 6.8 and 7.6. Nothing blocks deleting a floor that holds only a floor-level site check with attempts (5.8), annotations (7.4), a closet (7.5) or closeout context (5.12). Story 4.1 also lacks the Check's "new revision reference prevents stale deletion" case.
- Fix: add blocker criteria to those stories.
- Consequence: attempts, annotations or closets are orphaned by a floor deletion.

**F8. FR-55 "committed cost"**
- Trigger: FR-55 says remove a cancelled proposal from totals "while retaining recorded work, committed cost and outstanding disposition". Story 4.9 says "A cancelled device leaves ... the estimate" with no retention.
- Fix: state what remains.
- Consequence: money already spent disappears from the estimate.

**F9. FR-46 Include now**
- Trigger: FR-46 says "select work/checks/costs". Story 5.9 says "select the work and checks". The FR-46 Check "Unknown legacy attributes and unscoped tests do not automatically prevent completion" has no criterion in 5.9 or 5.12.
- Fix: add both.
- Consequence: partial delivery of the Check.

**F10. FR-20 and FR-34 in the prototype import**
- Trigger: FR-20 says "preserve available processed images without fabricating originals missing from older records". Story 2.12 lists what is imported ("buildings, floors, plans, devices, routes, obstructions, zones and notes") and handles plan images, but says nothing about photos or analysis settings in the file. FR-20's "installation constraints" is absent from 2.10.
- Fix: add a photo criterion with "original not available" to 2.12.
- Consequence: prototype photos are dropped, or 2.12's "Nothing is dropped without being listed" is breached.

**F11. FR-70 Users row**
- Trigger: FR-70 lists "require or reset two-step verification" under Users. Story 1.8's user detail has reset only; requirement is installation-wide in 1.10.
- Fix: confirm with Kevin that per-user "require" is not intended, and record it as a choice.
- Consequence: a silent narrowing.

**F12. FR-59 "activity record"**
- Trigger: 6.5 says the outcome "appears in the activity log". That log (1.9) is administrator-only and "separate from each project's change history" (FR-71), and 1.9's list of later additions omits 6.5.
- Fix: say project change log, or add the event to 1.9's list and to both logs.
- Consequence: the Editor who ran a cleanup cannot see its record.

**F13. File-job targets have no owning story**
- Trigger: the PRD's "Selected PDF-page preview within 30 seconds", "Photo preview/processing within 10 seconds" and "inventory preview / confirmed import within 30 seconds each" appear only in 10.2. Epic 10 "has no story for fixing what it finds; a miss goes back to the story that owns the behaviour".
- Fix: add the bounds to 2.6, 2.10, 6.2 and 6.3.
- Consequence: the first measurement is at acceptance.

**F14. iPad and Edge appear only in 10.3**
- Trigger: NFR-3 requires "iPhone/iPad Safari" and "Chrome and Edge". Every Epic 5 real-device criterion names iPhone and Android only.
- Fix: add iPad to 5.1 and 5.5; add an Edge pass to the Definition of done.
- Consequence: tablet layout defects surface at acceptance.

### 4. Buildability

**B1. Story 4.10 and 8.5 need a size before it exists**
- Trigger: 4.10 says "An edition that would exceed 1 GiB fails ... before anything is stored", but each volume "is released from memory before the next is generated" (AD-11), so the total is unknown until the last volume. Story 8.5 likewise compares a package's "declared size" before generation.
- Fix: a dry-run page count and estimate, or fail on reaching the limit and discard the stored parts.
- Consequence: the criterion cannot be met as written.

**B2. Story 4.10 terms that are undefined at that point**
- Trigger: "A package that leaves out a required photo" — required photos arrive with checks in 5.4. "do not count toward usage" — usage arrives in 8.5.
- Fix: move both to 5.4/5.12 and 8.5.
- Consequence: untestable in 4.10.

**B3. Criteria with no observable threshold**
- Trigger:
  - 3.5: "scrolling stays responsive".
  - 2.8 and 10.2: "Controls stay usable".
  - 6.2: "the page stays usable".
  - 1.1: "with no change in behaviour".
  - 3.2: "can still be told from the others".
  - 2.13: suite "covers everything in Epic 1 and stories 2.1 to 2.12 that does not store a file".
  - 10.4: "The same feature list and the same refusals".
- Fix: give each a number or an enumerated list (for example a longest-task bound; a named list of smoke cases).
- Consequence: pass or fail by opinion.

**B4. The pending-update marker lives in the object it helps restore**
- Trigger: 9.3 says the marker "is kept in the installation object" and the restore covers "the installation's own data". The backup predates the marker (9.7: "takes the complete backup, sets the pending-update marker"). An earlier build must also read it from an object whose data may be newer, which 1.1 "refuses".
- Fix: add a criterion that the marker is stored outside converted data and survives the restore of installation data.
- Consequence: the restore erases its own progress record or cannot start. This is my inference from the criteria; no source addresses it.

**B5. Story 9.7's acknowledged open hole**
- Trigger: the Notes admit "a run that deploys after the 30-minute limit has passed, when changes are being accepted again and the marker is cleared". A failed health check then rolls back to a version that "finds newer data and no pending-update marker" and "refuses to start".
- Fix: do not clear the marker until GitHub confirms cancellation, or have the workflow re-check the marker before deploying.
- Consequence: a whole-installation outage with no automatic return.

**B6. Size: "one sitting" is asserted and denied in the same document**
- Trigger: "Stories are sized to be built and verified in one sitting" versus "Story size | Not settled". Beyond the nine stories listed, these are also oversized:
  - 2.13: image, two certificate modes, proxy trust, key file, recovery command and a smoke suite over 22 stories.
  - 1.10: settings, email, forgot-password, required two-step and R13 on two hosts.
  - 5.5: 18 criteria plus R4 on two real phones.
  - 8.4: 21 criteria plus R5, three runs on each of two hosts at 10 GiB, and cross-host import.
  - 9.5 and 9.7: 17 and 21 criteria; 9.7 carries R11 and R16.
  - 4.7.
- Fix: split, or remove the one-sitting claim; put experiments in their own stories.
- Consequence: sprint tracking treats multi-day stories as single units.

**B7. Deletion of non-device records is never specified**
- Trigger: 2.9 relies on "Deleting a device that a route ends on" before Delete draft exists (2.11). No story says whether the prototype's free deletion of devices, routes, zones, obstructions or survey entries survives, or how an Existing device is deleted between 2.7 and 4.9. Story 2.10 says only "Adding an entry never changes or removes an earlier entry".
- Fix: state in 2.7–2.10 which prototype delete actions remain and for whom.
- Consequence: unrestricted deletes ship alongside the guarded ones.

**B8. Portable-backup project identity**
- Trigger: 8.4 says import "creates a new project", and "A replacement is refused ... when the backup's project identity differs from the live project's". It does not say whether an imported copy keeps the source identity.
- Fix: say whether an import mints a new identity.
- Consequence: two projects with one identity, or a legitimate replacement refused.

## Edge-case hunter

| # | Where | Case | Criterion that would handle it | If left as is |
| --- | --- | --- | --- | --- |
| 1 | line 98-105 (story 1.2) and :148 (story 1.4), with :1900-1907 (story 9.7) | Cloudflare redeploy (or update workflow deploy) runs the deploy command that generates code and key | Deploy generates the set-up code and deployment key only when none exists; a redeploy or update keeps both, and a test redeploys then reads a two-step secret | Every two-step secret and settings secret becomes unreadable after an update or redeploy |
| 2 | line 148 (story 1.4), :1710-1712 (story 8.3), :1789 (story 9.1) | Cloudflare deployment key is a write-only secret; no criterion prints or exports it | Cloudflare deploy prints the deployment key once (as the set-up code is) and the instructions say to store it off the account | Cloudflare recovery can never be done 'with the key'; always resets two-step and secrets |
| 3 | line 98-105 (story 1.2) | Set-up code lost before set-up; redeploy to an installation with no users | Deploying to an installation with no users issues a new set-up code and invalidates the old one | Fresh installation cannot be set up, or an old leaked code stays valid |
| 4 | line 117-124 (story 1.3), :197 (story 1.7) | Same email entered with different letter case at invite, sign-in or lockout counting | Emails are compared case-insensitively for accounts, invitations, reset links and failure counts | Duplicate accounts for one person; per-email lockout bypassed by changing case |
| 5 | line 123 (story 1.3), :225 (story 1.8), :540 (story 2.13) | Only administrator's email is in sign-in wait when recovery code is used | Using the recovery code clears that email's failure count and wait | Repeated wrong sign-ins by an outsider keep the only administrator locked out |
| 6 | line 579-582 (story 2.15), :127 (story 1.3), :235 (story 1.9) | Records volume full when someone signs in (session and log entry must be written) | With the records volume full, sign-in says storage is full; sessions already signed in keep working; a reserve lets an administrator sign in | Administrator cannot sign in to see the storage-full notice or free space |
| 7 | line 338-346 (story 2.4), :493-500 (story 2.11), :1330-1337 (story 6.5) | Pending or offline edit to an item another person deleted (Delete draft, floor, bulk cleanup) | A save onto a deleted item is refused, kept on the page as 'not saved: item was deleted' with values copyable, and does not recreate it | Edit silently dropped, or deleted record resurrected by a stale save |
| 8 | line 357-361 (story 2.5), :885-892 (story 4.9) | Floor whose only devices are cancelled or corrected; later reversal of the cancellation | A floor holding a cancelled or corrected device cannot be deleted (listed in refusal); or reversal is refused if its floor is gone | Reversal returns device 'to where it was' on a floor that no longer exists |
| 9 | line 724-727 (story 4.1), :871 (story 4.8), :1051 (story 5.5) | Restore of a revision that lacks proposed devices added later (issued, tested, or with evidence) | A restore removes a later-added proposed device only if it is Delete-draft eligible; otherwise it stays and is listed for review | Restore deletes devices in the issued design, or orphans their attempts and issues |
| 10 | line 995 (story 5.3), :716 (story 4.1), :1231 (story 5.13) | First Installed mark with nothing issued while phone is offline or has Unsaved/Conflict items | Offline or with pending items, the mark is kept Unsaved with 'needs an issued design'; the issue prompt runs on reconnection after pending items resolve | Technician cannot record installation in the field; revision save refused by 4.1 rule |
| 11 | line 995 (story 5.3), :868 (story 4.8) | Two technicians each accept the issue-first prompt at the same moment | The second prompt finds the scope already issued, creates no second revision or designation, and sets the mark | Two revisions issued, or second technician's mark lost to a designation conflict |
| 12 | line 995 (story 5.3) vs :1490 (story 6.12) and :876 (story 4.8 note) | Installed or Configured mark set in a service scope, which 'needs no issued design' | In a scope marked as service, setting a mark does not open the issue-first prompt | Stories conflict: service work blocked until a design is issued |
| 13 | line 993 (story 5.3), :1350 (story 6.6), :1399 (story 6.8) | Reverse installed mark on a relocated, serviced or replacement device that was Existing before | Reversing Installed on a device with a planned Relocate returns it to Existing at its earlier recorded location, not to Proposed | An existing relocated device becomes Proposed and vanishes from Current installation |
| 14 | line 1048 (story 5.5), :1091 (story 5.7), :1200 (story 5.12) | Required check holds 'Pass pending evidence' (photo Failed or discarded after 7 days) at closeout | A required check at Pass pending evidence is outstanding: it appears in remaining work and prevents Completed | 5.12's list omits it, so scope closes Completed without required evidence |
| 15 | line 1095 (story 5.7), :1200 (story 5.12), :1351 and :1370 (stories 6.6, 6.7), :1399 (story 6.8) | Work now device with planned Remove (or Service) never receives an Installed mark | For a planned Remove, remaining work clears when the removal is recorded; 'not marked Installed' applies only to Add new, Relocate and Replace successors | Scope with a planned removal can never be closed as Completed |
| 16 | line 1154-1157 and :1160 (story 5.10), :1184 (story 5.11) | Run started on a stage with no planned duration or target (Needs definition) | Start is refused on a stage showing Needs definition, with the missing value named | End cannot be classed as full-duration or stop; run has undefined outcome |
| 17 | line 1156-1157 (story 5.10) | Backdated start or end overlaps an earlier run of the same stage, or precedes scope start | A run's start must be later than the end of the stage's previous run; overlap is refused with that run named | Same hours and outages judged in two attempts of one stage |
| 18 | line 1155-1163 (story 5.10), :1181-1183 (story 5.11) | Two people record the end (or Restart) of the same open run at once | The first end is accepted; the second sees a conflict showing the recorded end and who recorded it | Two end times or two outcomes for one run; duplicate restarted runs |
| 19 | line 1152-1154 (story 5.10) | Reliability period turned off, or a stage or covered set removed, while a run is open or has outcomes | Turning the period off or deleting a stage is refused while a run is open; with past runs the stage is retired and its runs stay listed | Open run orphaned; recorded attempts disappear from site checks and closeout |
| 20 | line 1183 and :1188 (story 5.11), :1202 (story 5.12) | Required stage whose only runs were stopped for another reason (no outcome) | A required stage with no passing attempt appears in remaining work and prevents Completed, whatever its runs' states | Stage is neither 'not started, running or failed'; Completed allowed without a pass |
| 21 | line 1200-1202 vs :1207 (story 5.12) | Optional stage's run is open when scope is closed as Completed | An open run of an optional stage is stopped as 'Scope closed' and listed as not completed, without making a Completed scope show outstanding items | Completed closeout record lists an outstanding item, contradicting 'nothing is outstanding' |
| 22 | line 1204-1206 (story 5.12), contrast :716-718 (story 4.1) | Closeout record file fails to store or verify; or closer has own Unsaved/Conflict items | The scope's state changes only when the closeout record is stored and verified; a failed write shows Failed with Retry and the scope stays In progress; closing is refused while the closer has pending items | Scope closed with no fixed record, or record silently omits pending work |
| 23 | line 1209 (story 5.12), :1126 (story 5.9), :1388 (story 6.8), :1488 (story 6.12), :1437 (story 6.10) | Project has no active scope (closed, not reopened, not archived) and a fresh page sends a write | With no scope active, state which writes are accepted: e.g. raising an issue and warranty edits allowed and recorded with no scope; design edits, marks, attempts, removals and revision saves refused with 'Reopen first' | Records 'carry the active scope' when none exists; 6.12 assumes issues raisable, 5.12 refuses them |
| 24 | line 1231-1233 (story 5.13), :989 (story 5.3), :1041 (story 5.5), :1174 (story 5.11) | Mark, attempt or outage entered offline and saved hours later on reconnection | An entry made while unsaved records both the time entered on the device and the time the server saved it, and shows the first | Installation and test times, and outage ordering, show reconnection time instead of actual time |
| 25 | line 1233 (story 5.13), :885 (story 4.9), :1401 (story 6.8) | Reconnecting phone saves a mark or attempt onto a device cancelled or corrected meanwhile | A mark or attempt onto a cancelled or corrected device from a stale page is refused and kept for review, as for a removed device | Cancelled proposal silently gains an Installed mark and becomes Existing |
| 26 | line 1437-1442 (story 6.10) | Reopen after 'Closed with outstanding items' with proposed devices never installed | Uninstalled proposed devices, their planned actions and unfinished checks carry into the new scope as Proposed and are listed for a scope decision | 'Working revision from the latest installation' drops or ambiguously keeps unfinished proposals |
| 27 | line 1476-1479 (story 6.12) | Warranty start on the 29th-31st plus a term ending in a shorter month | End date is the same day-of-month after N months, or the last day of that month when it has no such day | End date and In warranty/Expired status differ by days between implementations |
| 28 | line 1658-1664 (story 8.1), :557 (story 2.14) | Live file is damaged or missing when the daily backup runs | A backup verifies each file's hash against its record; a mismatch makes the backup Failed naming the file and removes no earlier generation | Damaged file recorded as Succeeded; good generations rotate out within seven days |
| 29 | line 1662-1664 (story 8.1), :1692 (story 8.2) | Retention of the 'before restore' backup under daily rotation is unstated | The most recent 'before restore' backup per project is kept in addition to the seven until an administrator discards it | Mistaken switch cannot be reversed once rotation removes the pre-restore state |
| 30 | line 1690-1696 (story 8.2) | Two administrators act on one copy at once (Make current twice, or current versus discard) | Make current and Discard check the copy's state in one write; the second request is refused and shown what happened | Double switch, or switch to a copy being discarded |
| 31 | line 1687-1694 (story 8.2), :1456-1464 (story 6.11), :1667 (story 8.1) | Backup restored was taken in a different archive or scope state than the working project | The pre-switch confirmation states the archive state and active scope the project will return to; the switch is logged with both | Archived project silently reopens with an In progress scope, or active project becomes read-only |
| 32 | line 1694 (story 8.2), :379-383 (story 2.6), :921-925 (story 4.10), :1303 (story 6.3) | Multi-part upload, package edition or inventory apply is in flight when the copy is made current | At the switch, unfinished uploads and jobs of the working project are discarded and shown as 'not saved: project was restored'; or the switch is refused while one runs | Parts or half-applied rows from the old project land in the restored one |
| 33 | line 1709 (story 8.3) | Recovery procedure run against a destination that already holds users or projects | The procedure checks the destination is empty and refuses otherwise, changing nothing | A live installation is overwritten or merged with backup data |
| 34 | line 1709-1718 (story 8.3), :1662-1663 (story 8.1) | Several generations exist (seven daily plus 'before an update'); procedure does not say which is used | The procedure uses the latest successful generation by default, lets the operator name another, and states the chosen recovery point before starting | Recovery from an older or pre-update generation without the operator knowing |
| 35 | line 1738-1747 (story 8.4) | Portable backup imported as new while its source project exists here, or imported twice | An import as a new project gives it a new project identity and records the source identity; replace matches only the live project's own identity | Two projects share one identity; a later replace can target the wrong one |
| 36 | line 1731-1735 (story 8.4), contrast :1660 (story 8.1) | Members keep saving while a portable-backup job reads the project | A portable backup is taken from one consistent point; a save acknowledged during the job is wholly in or wholly out | File holds records referencing files or versions it does not contain |
| 37 | line 1767 (story 8.5), :382 (story 2.6), :925 (story 4.10) | Upload abandoned by a closed tab holds its reservation until discarded after 7 days | A reservation with no accepted part for 1 hour is released; resuming re-reserves or is refused with the limit named | Project near its budget refuses uploads for a week for space nobody uses |
| 38 | line 1762-1770 (story 8.5), :1206 (story 5.12), :715-718 (story 4.1) | Project at 8 GiB when an ordinary edit, attempt, revision snapshot or closeout record is saved | Record saves and appended entries are accepted at the limit (or refused as 'not saved: project storage full'); closeout and revision snapshots state which applies | Scope cannot be closed, or small saves fail with no defined status |
| 39 | line 1825 (story 9.3), :1659 (story 8.1), :1902-1908 (story 9.7) | Return restores installation data from a backup taken before the marker was set | The marker and its per-project progress are held apart from the restored data and survive the restore of the installation's own data | Restore erases its own marker; a part-way return cannot resume and looks complete |
| 40 | line 1882 (story 9.6) vs :1824-1826 (story 9.3) | Self-hosted return: updater restores the backup, and the earlier server also restores on finding a marker | State one owner: story 9.5 sets the marker, the earlier image performs the restore under 9.3, and the updater only swaps images and reports | Double restore, or neither does it; 9.5 never sets the marker 9.3 expects |
| 41 | line 1887 (story 9.6) | Return fails and neither the new nor the earlier application image is serving | The updater or bundled web server serves the failed-return warning and manual steps when the application does not answer | S-35 and sign-in page cannot show the warning; users see a bare connection error |
| 42 | line 1887 (story 9.6), :1911 (story 9.7), :1663 (story 8.1), :1865 (story 9.5) | Update pressed again after a failed return or failed attempt left data in doubt | While a failed return is unresolved, Update is disabled and the existing 'before an update' backup is not replaced until an administrator confirms recovery | New pre-update backup of the broken state replaces the only good one |
| 43 | line 1904-1906 (story 9.7) | Workflow deploys the new version but its result never arrives (distinct from the late-deploy open point) | At 30 minutes the installation compares its running version with the marker: if already the new version it runs the health check itself and returns on failure | New version accepts changes unchecked, logged as 'no result' with data already converted |
| 44 | line 1862-1868 (story 9.5), :1884-1886 (story 9.6), :921-925 (story 4.10), :1733 (story 8.4), :1696 (story 8.2) | Multi-part upload, portable-backup job or unswitched restore copy exists when changes stop, then a return | Update is refused while a portable-backup, import or package job runs; after a return, unfinished uploads resume or show Failed with Retry, and an unswitched copy is kept or listed as discarded | Parts and jobs from after the backup point attach to restored records, or vanish silently |
| 45 | line 383 (story 2.6) vs :164 (story 1.5), :381 (story 2.6), :1236 (story 5.13) | Session ends between upload parts (sign out everywhere, password change, reset) | On session end the stored parts are kept; after the same account signs in the upload resumes from the last accepted part; parts are discarded only on access change | 2.6 discards parts while 1.5 and 5.13 promise pending input is kept and saved |

## Editorial structure

**Read of the document:** this document exists to help the product owner approve the story boundaries, acceptance criteria and proposed defaults, and to help a developer or coding agent build one story at a time from final PRD 1.2.

**Structure model:** Reference/Database (89 stories on one schema, read by random access) behind a Strategic/Pyramid front (status, what is confirmed, what needs a decision). The story body fits the reference model well. The pyramid part does not hold: what Kevin must decide is at the back and scattered, and that mismatch drives the top findings.

**Word metrics (from `word_metrics.py`):**
- Total: 49,174 words. Stories: 36,691 words; choices table: 7,647 (15.5%); front matter down to the definition of done: about 1,480.
- Per story: median 383 words and 11 criteria; maximum 920 words and 28 criteria (4.10).
- 13 stories are at or above 568 words, 23 have 15 or more criteria, and 7 have 20 or more (4.10, 5.12, 2.8, 9.7, 8.4, 7.5, 6.12).
- About 1,090 criteria in all; `Notes:` lines total 3,686 words across 77 stories.
- At a careful reading pace the document is a 4 to 5 hour read with no marked shorter path.

| Pass | Original Text | Revised Text | Changes |
| --- | --- | --- | --- |
| structure | Every story's criteria list: one flat bullet list of 5 to 28 items (about 1,090 bullets) | QUESTION / restructure. Group each story's bullets under 3 to 5 plain bold label lines, the same labels in the same order everywhere. For example: **Core behaviour**, **Refusals and edge cases**, **Limits and proposed values**, **Access and restore** (Viewer, stale view, revision restore), **Evidence to record** (experiments, timings, fixtures). Use bold text lines, not headings and not bullets, so the `### Story N.M:` and `Covers:` parsing is untouched. Confirm first that the script does not count bullets or expect them to be contiguous. | Biggest barrier to review. Core behaviour sits among very different kinds: 69 bullets carrying numeric limits, 17 same-moment concurrency cases, 6 near-identical stale "Delete draft" refusals, 12 "A revision restore leaves…" bullets, 15 standalone Viewer bullets, 12 experiment bullets, 21 activity-log bullets. In 4.10 the first limit appears at bullet 16 of 28. Labels let Kevin read Core behaviour for all 89 stories and sample the rest. Adds about 1,200 words. |
| structure | §Choices made in draft 0.6 — 217 rows, 7,647 words, three columns (Story, Choice made, Why) | CONDENSE and regroup into three tables. (1) **New behaviour or a block the PRD does not state** — needs an explicit yes or no. (2) **Values and defaults nobody specified** (durations, lengths, counts, wording). (3) **Readings of a source or values the source gives** — for information. Give every row an ID (C-001…), add an "Alternative" column and an empty "Kevin's decision" column to tables 1 and 2, and shorten "Choice made" to the value plus the criterion's ID. Put the same ID on the criterion in the story. | As built, the table cannot be used to decide. Rows have no IDs, so a decision cannot be recorded or referred to. Only 8 rows are flagged for Kevin's explicit confirmation (1.8, 2.13, 3.5, 4.7, 4.9, 5.3, 6.11, plus 5.1), spread among 217. About 95 rows open their Why by citing the source that fixes or implies the value (for example "The count measured in R8 and named in AD-12", "Wording taken from FR-33", "AD-21"), so they are not open choices; about 36 say the sources are silent or the value is conventional. The three kinds look identical. "Choice made" restates the criterion in full. Estimated saving 1,500 to 1,800 words; the larger gain is that tables 1 and 2 become a decision list of roughly 100 rows with the critical 8 first. |
| structure | Decisions and open questions for Kevin, scattered: Status bullet 5; Notes of 1.8, 3.1, 4.10, 5.12, 6.6, 6.12, 7.5, 9.7; the criterion in 2.15 ("goes to Kevin"); the "Story size" row of §Order and validation; 8 rows of the choices table | MOVE into one section directly after §Status, "Decisions needed from Kevin": (a) the 8 new-behaviour choices; (b) whether to split the nine large stories (2.6, 2.8, 3.1, 4.10, 5.12, 6.6, 6.8, 6.12, 7.5), with the fact that splitting renumbers; (c) open points (9.7's 30-minute rule, the R12 fallback); (d) the remaining defaults, by link to the table. Leave a one-line pointer in each Note. | The most important information for the approving reader is buried, some of it at line 2018 of 2,375. Pyramid rule: decisions first. Adds about 250 words. |
| structure | §Choices table — about 20 rows that record sequencing or test placement, not product behaviour. Examples: 1.7 "Membership is set through administrator-only server functions in this story; the screens come in 1.8"; 2.13 "Smoke suite in 2.13 excludes file cases"; 2.2 "Plan images stay in browser storage until 2.6"; 3.2 development-only reference page; 10.2/10.3 split; 10.1 small project built in 10.1 | CUT from the decision table. They are already stated in the stories' criteria or Notes; if a record is wanted, list them as one line each under §Order and validation. | Scope violation inside the table: these are authoring decisions about story order, and they dilute the list Kevin has to rule on. Saves about 700 words. |
| structure | §Choices table — row order and stray content. First data row is `Format: story \| choice made \| why`. The text says "There are 218"; there are 217 real rows. Rows are out of story order: 1.3 before the last 1.2 row; 2.7 and three 2.13 rows after 3.5; 5.9 between 5.12 rows; 6.7 and 6.8 after 7.5; 8.1 and 10.1 after 10.2/10.3. | Remove the Format row, correct the count, sort by story within each group, and split the "10.2/10.3" row or give it one owner. | A reader looking up "what was chosen for 2.13" finds four rows and misses three more 90 lines later. The count in the text appears to include the stray row. |
| structure | References to working material a reader cannot open: "Decision 5 applies" (4.1 Notes); "shared decision 11" (6.11 and 8.2 rows); "Shared decision 8" (9.7 row); "Shared decision 10" (10.2/10.3 row); "Round 2 asks for…" (4.7 row); "The brief requires…" (9.7 row). Also 32 rows citing "review edge case N" or "review finding N" without a link. | Replace the seven working-process references with the rule itself or its source (PRD, UX or AD number). For review references, state once above the table that the numbers refer to the linked draft 0.5 review. | Dangling references: the Why column is the justification Kevin is asked to accept, and in these rows it points at something not in the document. |
| structure | §Status and §How to read it — no reading path for the approver. "Stories are sized to be built and verified in one sitting" stands unqualified, while §Order and validation says size is "Not settled" for nine stories. | Add a short "How to review this draft" paragraph (about 80 words): read Status and Decisions needed; read Core behaviour for each story; sample edge cases and limits; rule on choice tables 1 and 2. Qualify the sizing sentence with a pointer to the nine large stories. | Missing scaffolding for a document that grew four times. Without it, review means reading all 49,174 words in order. |
| structure | `Notes:` lines — 77 stories, 3,686 words, about 177 forward references of the form "X arrives in story N.M". Longest examples: 4.1 (about 150 words), 1.8, 2.11, 4.10 | CONDENSE. Keep each Note to (1) what this story deliberately leaves out and where it goes, as a short list, and (2) experiment findings. Move anything addressed to Kevin to the decisions section. Cut sentences that restate a later story's own criterion (for example, 4.1's list of nine stories that "carry their own criterion", which standing rule 9 already requires). | Notes mix three kinds of content: scope boundaries, experiment results, and decisions for Kevin. The first is useful to a developer reading one story and should stay. Estimated saving about 1,000 words. |
| structure | §The epics table, "Depends on" column (table is 764 words), and each epic's **Outcome.** and **Depends on.** paragraphs (308 and 348 words) | CONDENSE the table column to epic-level dependency only ("Epics 1 to 5; some stories need 6.8 and 6.9") and keep the story-level detail in the epic section. Keep the Outcome in both places. | The table and the epic intros are word-for-word identical. Repeating the outcome is useful reinforcement for a human reader; repeating 70-word story-level dependency lists (Epics 3, 5, 9) in an overview is premature detail. Saves about 300 words. |
| structure | Criteria in Epics 8 to 10 versus Epics 1 to 7. Semicolon-chained bullets: 53 of 203 in Epics 8 to 10, about 74 of 893 elsewhere; average 30 to 35 words a bullet against 23 to 27. Extreme cases: 10.3 "FR-72 on Cloudflare…" (128 words, about ten separate checks), 10.3 "FR-66 on Cloudflare…" (61), 8.4 "Replacing a live project…" (71), 10.2 "Each long file job…" (67) | Split so that one bullet holds one observable result, as Epics 1 to 7 mostly do. Turn the two 10.3 bullets into sub-lists under a label naming the requirement. | Inconsistent item schema across authors. A 128-word bullet cannot be ticked off as passed or failed, and a reviewer cannot tell which clause they are approving. No net word change. |
| structure | 15 standalone bullets of the form "A Viewer can read/open/export X and cannot change it" (4.1, 4.3, 4.4, 4.5, 4.8, 4.10, 5.3, 5.4, 5.5, 5.9, 5.10, 5.12 and others) | CONDENSE. Extend standing rule 2 by one sentence: a Viewer can read and export whatever a story adds unless the story says otherwise. Keep a Viewer bullet only where it says something more (3.5 export, 4.6 assignee, 8.4 portable backup, 8.5 usage). | Standing rule 2 already requires the refusal test for every story and says such rules "are not repeated". Saves about 200 words and removes one bullet from the end of many lists. |
| structure | Repeated per-story rules: 12 "A revision restore leaves…" bullets; 6 stale-view "Delete draft" bullets; upload rules repeated in 2.6, 2.10 and 2.14; "an upload in progress counts as use of the session" in 1.5, 2.6, 4.10 and 5.5 | PRESERVE, under the "Access and restore" or "Limits" label proposed above. | They look cuttable but serve the developer who reads one story only, and standing rule 9 requires the restore statement in each story. Grouping keeps them without making the core list longer. |
| structure | Experiment and fixture bullets inside criteria lists: 12 "Experiment Rn is run and recorded…" bullets (1.3, 1.10, 2.15, 4.10, 5.5, 8.2, 8.4, 9.3, 9.6, 9.7) and the fixture-script bullets in 2.7, 2.10, 6.2 and 8.2 | MOVE within each story to the "Evidence to record" group, placed last. | These are tasks with a recorded result, not behaviour of the product. Mixed in, they contradict "Every criterion is something a tester can observe" in §How to read it. |
| structure | §Order and validation — "Order, confirmed by Kevin" (3 bullets) | MERGE into §Status bullet 2, which says the same thing; keep the checks table. | True redundancy. Saves about 45 words. |
| structure | Cross-reference in story 9.3 Notes: "standing rule 7 requires each changed record shape… to bring its conversion" | Change to standing rule 8. Also drop the last sentence of 1.1's Notes, which repeats rule 8 verbatim. | Rule 7 is the one-build rule; rule 8 is the conversion rule. A reader following the reference lands on the wrong rule. |
| structure | Epic intros: **Why here.** is present for Epics 1 to 5 and 10 and absent for Epics 6 to 9 | Add one sentence each, or drop the element everywhere and rely on §Order and validation. | Inconsistent schema. Epic 7's position (after return visits) is one of the three things Kevin confirmed, and its reason is not given where the epic is introduced. Adds about 100 words. |
| structure | §Requirement coverage — the experiments table follows the requirements table with no heading or lead-in; there is no architecture-decision table, although the validation check reports AD coverage | Give the experiments table its own bold label; either add the AD table or state that AD coverage is shown by script only. | Reference sections should be findable by label. |
| structure | §Choices made in draft 0.6, as a whole — 15.5% of the file, read by the product owner and not by the developer of a story | QUESTION: after regrouping, keep tables 1 and 2 in this file, or move all three to a companion file linked from §Status? | Moving them would shorten the file a coding agent loads for one story by about 7,600 words. Keeping them holds the approval record in one place. The author's call; the anchor link in §Status and the rename rule for files containing `review-` are the only dependencies seen. |
| structure | §Status, §How to read it, standing rules and definition of done ahead of the stories; coverage and history at the end | PRESERVE. | Status first and history last is the right pyramid order, and the standing rules remove real repetition from the stories. |

Three further minor fixes (FR-10 to FR-16 as seven identical coverage rows; "Format" metadata in the front matter versus Status; validation-table wording); ask to expand.

**Summary**
- Recommendations: 18 rows (1 restructure, 5 condense, 3 move, 2 cut or merge, 2 preserve, 5 fixes or questions).
- Estimated effect if all are accepted: cuts of about 3,800 to 4,100 words (choices table 2,200 to 2,500; Notes 1,000; epics table 300; Viewer bullets 200; smaller items 100) against additions of about 1,650 (group labels 1,200; decisions section 250; review path 80; Why here 100). Net reduction about 2,100 to 2,500 words, 4 to 5% of 49,174. No length target was given.
- The gain is in reviewability, not length. The document stays near 47,000 words; what changes is that the product owner gets a marked path: decisions first, core behaviour per story, about 100 real choices with the 8 critical ones on top, in place of 217 undifferentiated rows.
- Per-story length is not fixed by any of this. The nine stories the document itself lists as large stay large unless Kevin agrees to split them; grouping labels make them reviewable but not smaller. Splitting renumbers stories, which the parsing script and sprint-status file depend on.
- Comprehension trade-offs: trimming Notes removes some forward pointers a developer may use to see where a behaviour continues; keep the "left out, goes to N.M" list to limit that. Shortening the choices table's "Choice made" column makes rows depend on the criterion ID, so IDs must be added to the criteria in the same edit.
- Not assessed: whether the criteria are correct or complete, and anything in files named `review-` or the `draft-0.6-working` folder, which were not read.
