# Independent review of the epics and stories, draft 0.5

Run on 2026-11-18 with the BMAD `bmad-review` skill (6.12.4). Three reviewers read [epics.md](epics.md) separately; none saw another's findings. Line numbers refer to draft 0.5 as committed that day.

This file records what the reviewers reported. Nothing in it has been applied to the stories, and no finding has been accepted or rejected by Kevin. The reviewers do not rank findings.

| Lens | What it looked for | Findings |
| --- | --- | --- |
| Adversarial | Criteria that do not meet the PRD's Checks, contradictions, missing or untestable content | 28 |
| Edge-case hunter | Cases the criteria leave unhandled | 76 |
| Editorial structure | How the document is organised for its readers | 13 recommendations, 3 to keep as is |

The verification-gap lens applies to code and was not run. The prose lens was not run, because this was not a copy-edit.

## Adversarial

Checked against final PRD 1.2, the UX specification 0.5 and architecture 3.0. "Absent" means a search of the epics found no such text.

**1. Forward dependencies the validation table says do not exist**
- location: "Order and validation" row "Stories depend only on earlier stories | Pass"; stories 1.5, 1.6, 1.7, 2.5, 2.12, 4.1, 4.9, 5.10, 5.13, 6.8, 6.9, 8.4
- trigger_condition: Many criteria can only be exercised with records that a later story introduces.
  - 1.5 "Deactivating an account ends its sessions" needs the deactivate control from 1.8.
  - 1.6 "sees every project with scope state, last activity and attention count" needs scopes (Epics 4–6) and checks/issues (Epic 5).
  - 1.7 "A Viewer's attempt to change anything is refused by the server… a Viewer can read" has nothing to read or change in a project until 2.1/2.2.
  - 2.5 blocks deletion on "riser reference… historical reference" (risers arrive in 7.6, revisions in 4.1).
  - 2.12 imports "costs and named revisions" (estimate is 4.4, revisions 4.1).
  - 4.1 restore must leave alone "an installed pan/tilt/zoom camera… port assignments… checklist definitions and checks… issues, cancellations, corrections or archive state" (7.2, 7.5, 5.4, 5.9, 4.9, 6.8).
  - 4.9 "A mistaken installed mark on a proposed device is reversed… flagged Needs review" needs the Installed mark (5.3) and flags (5.6).
  - 5.10 "A full run that meets its target is Pass" needs availability from 5.11.
  - 5.13 "A save into an archived project or onto a removed device is refused" needs 6.11 and 6.8.
  - 6.8/6.9 "each end and port gets a disposition… The former port is not declared free… cannot take a port now used by another device" need port schedules (FR-51, story 7.5).
  - 8.4 "A backup made by a newer version than the installation is refused" needs the data-format version from 9.3.
- guard_snippet: Move each such criterion to the later story that makes it testable (as drafts 0.3 and 0.5 already did for others), or add an explicit "verified again in story X" line; then re-run the dependency check and correct the "Pass".
- potential_consequence: Stories cannot be closed under rule 8, or are closed with untested criteria that nobody revisits (FR-22, FR-53, FR-55 and FR-42 Checks left unproved).

**2. Work scope is used from Epic 3 but never created**
- location: stories 3.1, 4.8, 5.9, 5.12, 6.7, 6.10
- trigger_condition: 3.1 shows "work scope and state", 5.12 closes a scope and FR-61 designates "for the active work scope", but the first story that defines one is 6.7 ("One active named scope links its revisions, estimate and evidence"). No story creates the initial scope for a new project.
- guard_snippet: Add a story before 4.8 (or criteria in 4.1/4.8) that creates the first named work scope with In progress state and links revisions, estimate and evidence to it; leave categories in 6.7.
- potential_consequence: Developers invent an implicit scope in Epics 4–5 that 6.7 and 6.10 must then migrate; closeout records in Epic 5 have no scope identity.

**3. Device lifecycle arrives after the stories that depend on it**
- location: story 6.1 ("A device has lifecycle (Proposed, Existing, Removed)"); stories 4.9, 5.2, 5.3
- trigger_condition: The PRD state model says "Recording installation done advances the lifecycle… an Add new device becomes Existing". No story carries that transition (no "becomes Existing" text anywhere), and 5.2's Current/Proposed basis and 4.9's "proposed device" precede the lifecycle field.
- guard_snippet: Introduce lifecycle and placement axes with the first story that distinguishes proposed from existing (4.2 or 5.2), and add to 5.3: "recording Installed on an Add-new device makes it Existing; a relocation takes its new recorded location".
- potential_consequence: The Current-installation population is wrong in Epic 5 and reworked in Epic 6; FR-30/41 Checks cannot hold.

**4. Story 2.11 contradicts the FR-55 Check on connected drafts and drops redo**
- location: story 2.11
- trigger_condition: "Given a device with evidence, an issue or a connection, then Delete draft is not offered". FR-55 requires "Preview dependencies before deleting a connected draft" and its Check says "Connected draft deletion previews effects and preserves shared cable/evidence". Story 2.9 separately says "Removing a device no longer deletes its routes silently; the route remains with its end marked for review", which implies deletion with a connection is allowed. FR-21 requires "undo/redo"; "redo" appears nowhere in the epics although the prototype has it (`site-studio/src/projectHistory.js`).
- guard_snippet: Replace with "a connected draft shows a dependency preview; shared cables and evidence are kept and unassigned ends are marked"; add "a concurrent test entry or issuance makes a stale delete ineligible", "undo cannot reclaim a reassigned port", and redo criteria.
- potential_consequence: FR-55 and FR-21 Checks fail at acceptance; 2.9 and 2.11 get built to incompatible rules.

**5. No story puts warranty, service visits or removed-equipment context into the Closeout package**
- location: stories 5.12, 6.12, 7.7; coverage row FR-33
- trigger_condition: FR-33 says "The Closeout preset also carries… warranty details and service visits under FR-65" and lists "removed/replaced equipment references" and FR-53 connection context. FR-65's Check says "the service scope's closeout shows both visits". 5.12 precedes those features; 7.7 lists only "closet and port schedules, inter-floor continuations… annotations… analysis sheets"; 6.12 has no package criterion.
- guard_snippet: Add to 6.12 "warranty details and every service visit appear in the closeout record and Closeout package"; add to 6.8/6.9 "removed, replaced and unresolved connection context appears in the Closeout package"; list 6.8 and 6.12 against FR-33.
- potential_consequence: The closeout deliverable silently omits required content while the table reports FR-33 covered.

**6. Design package contents are never specified, and its Check depends on Epic 5**
- location: story 4.10
- trigger_condition: Criteria cover identity, splitting and upload but not the preset's contents ("Proposed labeled floor plans, retained context/planned actions, equipment and cable schedules, installation notes, survey evidence and scoped checklist expectations"), coverage/DORI sheets, "captioned photos initially two per page", the "evidence-limited summary" label, or "approval/decision cutoff". FR-33's Check, "A design package links planned device IDs to schedules and installation checks", needs checklists from 5.4, and no later story adds them. 4.7 defers the unverified-name label to "later, in the package" with no owning story (FR-69 Check).
- guard_snippet: List the Design sheet set in 4.10 and add a criterion to 5.4 or 5.12: "the Design package includes scoped checklist expectations linked by device ID; link decisions are labelled not verified in both presets".
- potential_consequence: The developer invents the package layout; FR-33 and FR-69 Checks are unmet.

**7. Final acceptance of a closeout has no story**
- location: stories 4.6, 4.7, 5.12
- trigger_condition: "final acceptance" appears once ("Design and final-acceptance reviewers are assigned per project"). 4.6/4.7 review "a fixed revision"; 5.12 has no criterion to record, request by link or bypass acceptance on the closeout record, though FR-24 covers "a fixed design or closeout revision" and UJ-3 "obtains or bypasses final acceptance".
- guard_snippet: Add to 5.12: "the final-acceptance assignee, by account or reviewer link, comments and decides on the fixed closeout record; bypass is recorded as bypass; neither changes Completed or Closed with outstanding items".
- potential_consequence: UJ-3 cannot be walked in story 10.3.

**8. Rule 7 requires data conversions that the plan does not make possible until Epic 9**
- location: rule 7 ("A new record shape comes with its data conversion (AD-20)"); stories 1.1, 8.1, 9.3
- trigger_condition: The data-format version and conversion mechanism are first built in 9.3, and there is no "previous release" until 9.2. 8.1 keeps a generation "before any update or data conversion" before either exists.
- guard_snippet: Move "the project room and the installation object each record their data-format version" and the conversion runner into 1.1; restate rule 7 as "from the first release onward", or define the pre-release baseline.
- potential_consequence: Either every story in Epics 1–8 breaks a standing rule, or the conversion framework is retrofitted across all record shapes at the end.

**9. Large fixture is built last but needed from Epic 2**
- location: story 10.1; stories 2.7, 2.8, 3.5, 4.10, 8.2, 8.4
- trigger_condition: 2.7 requires "within 1 second for 600 devices", 3.5 "The table shows 600 devices", 8.2/8.4 run R3/R5 "at full size", but the 600-device fixture and manifest, and Kevin's confirmation "before any benchmark is run", are in 10.1.
- guard_snippet: Move 10.1 (or a fixture-generator story) to before 2.7, and keep only the confirmation in Epic 10.
- potential_consequence: Earlier stories pass on ad-hoc data; performance misses surface only at acceptance, where Epic 10 has no story to fix them.

**10. Performance targets have no owning build story**
- location: stories 2.1, 2.2, 10.2; PRD "Confirmed performance and analysis targets"
- trigger_condition: Only the 5 s shared update (2.3) and 1 s search (2.7) appear as criteria. 250 ms feedback, 2 s save acknowledgement, 10 s open and 5 s plan switch are measured only in 10.2. The architecture's approach, "Summaries first, then one floor; previews; routes loaded on demand", is assigned to no story.
- guard_snippet: Add timing criteria to 2.1 (open, summaries-first loading), 2.2 (2 s acknowledgement) and 2.5 (plan switch), measured against the large fixture.
- potential_consequence: The loading model is built whole-project-first and rewritten after 10.2 reports misses.

**11. "As in the prototype" hides requirements the prototype does not meet**
- location: stories 2.8 and 2.6
- trigger_condition: 2.8 says results "give the same results as the prototype for the same inputs" for FR-10–16. FR-15/NFR-4 require "refine or clearly flag the analytical uncertainty instead of claiming confident Target met", and FR-15 requires separating "an assessed shortfall from a target not demonstrated". Neither appears in the epics, and the prototype source has no uncertainty handling (search for "uncertain" in `site-studio/src` returns nothing). FR-12's "Current installation or Proposed design basis" is also absent from 2.8.
- guard_snippet: Add explicit criteria for near-target uncertainty, target-not-demonstrated and basis selection, to 2.8 or a new story after 6.6; replace "as in the prototype" with the FR Checks.
- potential_consequence: Zone results claim "Target met" at marginal sampling, the exact failure NFR-4 forbids.

**12. Map-provider key: two incompatible designs and no link between them**
- location: stories 1.10 and 2.6
- trigger_condition: 1.10 stores "optional map-provider keys… encrypted and shown only masked"; 2.6 says "optional Google mapping behave as in the prototype", where the key is typed per browser session (`App.jsx`: "The key is used only in this browser session"). No criterion delivers the stored key to members' browsers, and a Maps JavaScript key must reach the browser.
- guard_snippet: Add to 2.6: "with a key saved in Settings, Google mapping is available to every member without entering a key; the per-session key dialog is removed", and state that this key is browser-visible by nature.
- potential_consequence: The Settings key is dead configuration, or the developer decides alone how a "protected secret" is exposed.

**13. Story 9.7 disagrees with the architecture on signature verification and has no failure-to-start path**
- location: story 9.7
- trigger_condition: "The Update control verifies the signature, warns users, stops accepting changes, takes the backup and starts a run", whereas AD-21 says "The workflow verifies the release's signature, deploys it". 9.7 has no equivalent of 9.5's "If the signature or the backup fails, nothing is installed and changes are accepted again", and nothing covers a run that never starts or never reports back (bad token, GitHub outage).
- guard_snippet: State which component verifies (and how a Worker checks a keyless signature if it is the control). Add "if the backup fails, the run cannot be started, or no result arrives within N minutes, changes are accepted again and the attempt is logged".
- potential_consequence: A Cloudflare installation is left refusing all saves indefinitely; FR-72's "stop, resume accepting changes and report it" is unmet on that host.

**14. Experiment R4 is redefined and never completed**
- location: story 5.1; coverage row "R4 | 5.1"
- trigger_condition: The architecture defines R4 as "Large photo uploads on phones over poor connections". 5.1 says "Experiment R4 is started here: opening and searching on a real iPhone and Android phone over a throttled connection". "Started" is not a pass condition, and photo upload on phones is story 5.5.
- guard_snippet: Move R4 to 5.5 with the architecture's wording and a recorded result and fallback decision; if open/search on phones is also wanted, give it its own number.
- potential_consequence: The photo-upload risk is marked addressed without being tested.

**15. Epic 3's parallelism claim is false and 2.2/3.1 are circular**
- location: Epic 3 intro ("can proceed alongside Epic 2 once story 1.1 is done"); stories 2.2, 3.1, 3.5, 3.6
- trigger_condition: 3.1 needs accounts, roles and membership ("account menu with the user's name and role in this project… A Viewer sees 'View only'"), i.e. 1.3–1.8 and 2.1. 3.6 needs the change log (2.3) and 3.5 the device records (2.7). Meanwhile 2.2 needs the frame from 3.1 ("the frame status counts it… The frame's save status opens a list"). 2.1's "View only" mark duplicates 3.1.
- guard_snippet: State the real prerequisites (Epic 1 complete; 3.5 after 2.7; 3.6 after 2.3), and either move the frame save-status criteria from 2.2 to 3.1 or put 3.1 before 2.2.
- potential_consequence: Sprint planning schedules Epic 3 early and it blocks immediately.

**16. Activity-log Check for reviewer-link decisions is unowned**
- location: stories 1.9 and 4.7
- trigger_condition: FR-71 Check: "A decision made through a reviewer link appears with its name marked not verified." 4.7 only says "Link creation and revocation appear in the activity log".
- guard_snippet: Add to 4.7: "a decision through a link adds an activity-log entry with the entered name marked not verified".
- potential_consequence: FR-71 Check fails.

**17. Access-change timing conflicts with the architecture's cache allowance**
- location: story 1.7 ("takes effect on that person's next request")
- trigger_condition: AD-17 permits "The gate may hold a session's lookup for a few seconds… a removal or deactivation must still take effect within that time".
- guard_snippet: Decide one: forbid caching in 1.7, or word the criterion "on the next request, or within N seconds where the lookup is cached" and raise the PRD wording with Kevin.
- potential_consequence: A developer who follows AD-17 fails the 1.7 test, or a later optimisation quietly breaks FR-68.

**18. Sign-in criteria are untestable without values nobody has set**
- location: stories 1.2, 1.3, 1.4, 1.5
- trigger_condition: "repeated failures are slowed", "expires after a default period", "A session ends after a default period", "the password rules shown as they are met", "the set-up code produced at deployment". Architecture section 15 leaves "Password length, lock-out thresholds and default session length" undecided; how a Cloudflare deploy produces a one-time code is not stated; the number of recovery codes is not given. UX 17.3 says a password change "signs out other sessions" and S-26 "says how long to wait"; 1.5 and 1.3 omit both.
- guard_snippet: Put concrete defaults in the stories (minimum length, failure threshold and delay, invitation and session defaults, recovery-code count, set-up code generation and storage per host), and add the two UX behaviours.
- potential_consequence: Each is invented at implementation and cannot be reviewed against a criterion.

**19. Story 2.13 is oversized and lacks its own HTTPS check**
- location: story 2.13; "Story size" row (names only 2.8, 4.10, 9.5)
- trigger_condition: One story holds a multi-architecture image, the Compose file, a disk file store with multipart and range reads, crash durability, power-loss and network-disk experiments (R12), and smoke coverage of "everything in Epics 1 and 2". It says "HTTPS is required" with an "optional web server", but has no "plain HTTP is redirected or refused" criterion, no certificate approach, and no rule for trusting a proxy when the bundled server is not used.
- guard_snippet: Split into image + Compose + HTTPS, disk file store, and R12 durability; add the FR-66 HTTP criterion and the certificate/proxy decision. Review 2.6 (FR-3–6), 3.1, 5.12 and 6.6 for the same size problem.
- potential_consequence: The story does not finish in one sitting; secure cookies or the HTTP redirect break behind an operator's proxy.

**20. Requirements dropped with no story text**
- location: stories 2.10/5.5 (FR-20), 7.1 (FR-48), 7.2/5.4 (FR-63/FR-29), 6.8 (FR-35), 1.2/2.13 (FR-66)
- trigger_condition: Each of the following is absent from the epics.
  - FR-20 "optional prompts for lighting, shadows, uneven terrain and mount rigidity".
  - FR-48 stitched-panorama arrangement ("Keep source-head and composite-output profiles distinct").
  - FR-63 "Provide a pan/tilt/zoom starter under FR-29".
  - FR-35 Check "A searchable archive and optional historical plan view expose the labeled removed record" (6.8 never says removed devices appear under Historical).
  - FR-66 Check "Two installations share no users, projects or files".
- guard_snippet: Add one criterion per item to the named stories.
- potential_consequence: The table says "Every FR appears", but these parts are never built or tested.

**21. Viewer export of schedules has nothing to export**
- location: stories 3.5, 4.4, 1.7
- trigger_condition: FR-68 Check: "the same Viewer can download an existing package and export a schedule." The only export criterion is 4.4's "The estimate exports to CSV"; no story defines a schedule export.
- guard_snippet: Add to 3.5: "the filtered schedule exports as CSV; a Viewer can export and cannot change it".
- potential_consequence: FR-68 Check is untestable.

**22. Reviewer link limited to "one decision"**
- location: story 4.7 ("allows comments on the plan and one decision")
- trigger_condition: FR-24 says "Record new reviewer decisions as distinct entries… later decisions do not erase prior ones", and UX S-24 offers "two decisions (Approve, Request changes)". Whether a link holder who requested changes can later approve on the same link is not stated.
- guard_snippet: State the rule: either "each submission is a new decision entry; earlier ones remain", or "one decision per link; a replacement link is needed for another".
- potential_consequence: The developer picks one; clients are blocked from approving, or duplicates appear.

**23. Story 6.12 summarises FR-65 loosely**
- location: story 6.12
- trigger_condition: Missing from the criteria: the calculated end date; "Changing a warranty's start date or covered items is recorded with actor and time"; "A visit is recorded during an open scope without starting a new one"; the prefill being "as of the visit date"; "Unknown… or the issue concerns no device"; the optional schedule column; the warranty status shown when an issue is raised.
- guard_snippet: Add these as criteria, or split warranty records from service visits.
- potential_consequence: The under-warranty value is computed as of today, not the visit date; warranty edits leave no history.

**24. Untestable negative: "Live passwords for the site's own systems are in no backup"**
- location: story 8.3
- trigger_condition: Nothing in any story prevents a user typing a camera or recorder password into a note, and the criterion gives no mechanism or test method. NFR-5 also covers notes and exports.
- guard_snippet: Either define the control (no credential fields in device records; a warning on note fields; a test that no record shape has such a field), or reword as a design constraint verified by schema review.
- potential_consequence: The criterion is ticked without evidence.

**25. Undefined "installer", and replace-from-backup left as one sentence**
- location: stories 8.1 and 8.4
- trigger_condition: 8.1: "Self-hosted, the installer asks for a backup location". No story builds an installer; 2.13 delivers only a Compose file. Nothing provisions the second R2 bucket on Cloudflare (K5). 8.4: "Replacing a live project from a backup is an administrator action" has no behaviour (validation, isolated copy, switch, reviewer-link cancellation, relation to 8.2).
- guard_snippet: Name the component (Compose variable or set-up script, in 2.13 or 8.1) and add the bucket to the Cloudflare deploy; in 8.4 say "replace uses the 8.2 isolated-copy flow with the portable backup as its source", or remove it.
- potential_consequence: Backups land on the live disk by default; the replace path is built without the FR-34 safeguards.

**26. Story 10.3 overstates what accepts the proof of concept on Cloudflare**
- location: story 10.3 ("Passing stories 10.2 and 10.3 is enough to accept the proof of concept on Cloudflare")
- trigger_condition: The PRD says the first run "includes the Cloudflare parts of the Checks for FR-66 and FR-72". Install-from-instructions and update/return on Cloudflare are only in 10.4. 10.2 also omits SM-5's "two-user editing/review conflicts" and NFR-4's "Verify counts, units, rounding and allowance arithmetic independently", and does not say where the 1% / 2-point reference values come from.
- guard_snippet: Add the FR-66/72 Cloudflare Checks and the two-user runs to 10.2/10.3, and a criterion in 10.1 that produces independent reference calculations.
- potential_consequence: Cloudflare acceptance is declared short of the PRD's definition.

**27. Rule 8's definition of done cannot hold for several stories, and 9.1 precedes what it documents**
- location: rule 8 ("criteria pass in a browser against the locally run server"); stories 1.1, 1.2, 1.3, 5.5, 9.1, 9.7
- trigger_condition: Some criteria need a deployed host or real devices: the `workers.dev` deploy, R9 "on a deployed Worker", "A plain HTTP request is redirected or refused", "on iPhone and Android". 9.1 is first in Epic 9 but documents "one-step deployment for updates" (9.7), the updater (9.5) and installing a published image (9.2).
- guard_snippet: Extend rule 8 with "plus a deployed Cloudflare test installation or real device where a criterion names one", and move 9.1 after 9.7 or split it into install and update instructions.
- potential_consequence: Stories are closed on local evidence only; the instructions are written against features that do not exist.

**28. Format and bookkeeping**
- location: stories 4.1–8.5, 9.3–9.7, 10.1–10.4; stories 1.6 and 3.1/3.5
- trigger_condition: From 4.1 on, stories have no "As a… I want… so that" statement. 1.6 carries a non-criterion ("sees an update-available marker here once story 9.4 is built"). 3.1 "Existing dialogs for equipment, materials, capacity, revisions and review become pages" overlaps 3.5 "Equipment as a full page". The header says "checked against the BMAD epic-design and validation rules" while the document itself notes the story content has had no independent review.
- guard_snippet: Add user statements, delete or move the 1.6 bullet to 9.4, give each dialog-to-page conversion to one story, and soften the status line.
- potential_consequence: Role and intent are missing for 60-odd stories; duplicated scope is built twice.

## Edge-case hunter

| # | Where | Case | Criterion that would handle it | If left as is |
| --- | --- | --- | --- | --- |
| 1 | line 215-225 Story 1.8 (with 1.4, 1.7:212) | Sole administrator forgets password or loses authenticator and recovery codes, no email configured | AC: documented out-of-band administrator recovery run on the host (as 8.3/9.5 command line), recorded in the activity log | Installation permanently unadministrable; resets in 1.8 need another administrator |
| 2 | line 212 Story 1.7 | Two administrators demote or deactivate each other in simultaneous requests | AC: active-administrator count is checked and changed in one installation-object write; second request refused | Installation left with zero administrators |
| 3 | line 212 Story 1.7 | Only other administrators are deactivated, or invited but never accepted | AC: 'last administrator' counts only active accounts that have completed sign-up | Last usable administrator demoted while a non-usable one satisfies the rule |
| 4 | line 147-151 Story 1.2 | Repeated wrong set-up codes, or two set-up submissions at once | AC: set-up code attempts are slowed like sign-in; set-up is one atomic write, second submission refused | Set-up code guessed on an exposed fresh install; two first administrators |
| 5 | line 159-161 Story 1.3 | Invite sent to an email that already has an active, deactivated or pending account | AC: inviting an existing email is refused with the account's state; re-inviting replaces the earlier link | Duplicate accounts per email or several live invitation links |
| 6 | line 222 Story 1.8 | Administrator needs to withdraw an unused invitation or reset link | AC: Users lists pending invitations and reset links with expiry; each can be cancelled; logged | Mis-sent link, including an administrator-role invite, stays valid until expiry |
| 7 | line 159 Story 1.3 / 222 Story 1.8 | Invitation or reset link opened after its account was deactivated or role changed | AC: accepting a link re-checks the account is active; deactivation cancels its outstanding links | Deactivated person regains access through an old reset link |
| 8 | line 173-176 Story 1.4 | Repeated wrong two-step or recovery codes after a correct password | AC: failed code attempts are slowed per account like password failures and logged | Six-digit code brute-forced once the password is known |
| 9 | line 173-175 Story 1.4 | All recovery codes used, or user wants a fresh set | AC: remaining count shown; user can regenerate codes with password plus current code, voiding old ones | User has no fallback and no way to replace leaked codes |
| 10 | line 175 Story 1.4 with 250 Story 1.10 | User turns two-step off while the installation requires it; or requirement enabled mid-session | AC: turning off is refused when required; existing sessions without two-step are limited to set-up on next request | Accounts operate without two-step despite the requirement |
| 11 | line 184 Story 1.5 / 222 Story 1.8 / 248 Story 1.10 | Password changed or reset by link while other sessions are open; reset on two-step account | AC: change or reset ends all other sessions (AD-12); a reset never bypasses or clears two-step | Attacker's existing session survives the password change; reset bypasses second step |
| 12 | line 187 Story 1.5 | After session end, a different account signs in on the page holding pending input | AC: pending input is resubmitted only if the same account signs in; otherwise held and shown, not sent | One person's pending edits saved under another person's name |
| 13 | line 211 Story 1.7 (with 2.2, 2.4, 5.13:722) | Editor is demoted, removed or deactivated while holding unsaved or conflicting edits | AC: refused saves stay visible as 'not saved: access changed', can be copied out, and are not retried | Pending work vanishes or retries forever with no explanation |
| 14 | line 211 Story 1.7 (with 2.6:325, 4.10:592) | Role removed or session expires between parts of a long upload | AC: gate refuses the next part; parts already stored are discarded; uploading counts as session use | Half-stored file left behind; 13-minute package upload killed by inactivity timeout |
| 15 | line 197 Story 1.6 with 251 Story 1.10 | User allowed to create projects has exactly one project and is sent straight into it | AC: project list and Create remain reachable from the frame when auto-opened | No route to create or see a second project |
| 16 | line 245-248 Story 1.10 | Session period or invitation life set to zero, negative or huge; email send fails | AC: settings validated against stated bounds; a failed send is reported and the copy link still offered | Everyone signed out instantly; invitation silently never arrives |
| 17 | line 248 Story 1.10 | Forgotten-password request for an unknown or deactivated email | AC: same reply for every email; no link is issued for unknown or deactivated accounts; requests are slowed | Account enumeration or reset-mail flooding |
| 18 | line 315 Story 2.5 | Floor holds only a plan, zones, obstructions, routes or notes; or is the last floor | AC: state whether plan, zones, obstructions, annotations and routes block deletion, and whether the last floor/building can go | Aligned plan and zones deleted as 'unused', or behaviour undefined |
| 19 | line 325-329 Story 2.6 | Corrupt, zero-byte or truncated image/PDF of an allowed type; wrong PDF password | AC: unreadable file or wrong password is refused with a reason and nothing is stored or referenced | Plan record references an original that cannot be opened |
| 20 | line 325 Story 2.6 / 375 Story 2.10 / 645 Story 5.5 | Tab closed mid-upload, or file stored but the referencing entry fails | AC: plan and photo uploads resume from last accepted part (AD-4); unreferenced parts and files are removed and never count to usage | Orphan files consume the 8 GiB budget; large photo restarts from zero |
| 21 | line 325 Story 2.6 / 588 Story 4.10 | Stored bytes differ from the hash the browser declared | AC: server verifies hash and size of every completed upload before it can be referenced; mismatch shows Failed with Retry | Corrupted original kept as the permanent content-addressed record |
| 22 | line 396-398 Story 2.12 | Project file is malformed, truncated, an unknown version, over limits, or import fails midway | AC: file validated before creation; unknown version refused; failed import leaves no partial project; limits of 8.5 apply; importer must be allowed to create projects | Half-imported project appears in the list as if complete |
| 23 | line 408-409 Story 2.13 | Live or backup disk fills during a save, upload or backup | AC: write fails without acknowledgement, items show Unsaved, administrators see a storage-full notice | Saves acknowledged but not durable, or silent data loss |
| 24 | line 492 Story 4.1 | Named revision saved while pending edits are offline or in conflict and cannot resolve | AC: saving a revision is refused, listing unsaved and conflicting items, until none remain | Snapshot silently omits edits the author believes are included |
| 25 | line 493 Story 4.1 / 735 Story 6.1 | Snapshot file write fails or is interrupted while saving a revision or baseline | AC: revision is listed only when its snapshot is stored and hash-verified; failure shown and retryable | Revision listed with no usable snapshot behind it |
| 26 | line 495-497 Story 4.1 | Restore runs while others hold in-flight edits; restore undone after others edited since | AC: restore is one versioned operation; later stale saves conflict; undo of restore refused if affected items changed | Colleague's edits silently overwritten by restore or by its undo |
| 27 | line 495 Story 4.1 | Restore attempted in a closed scope, or of a revision from an earlier scope | AC: restore is limited to the active scope's revisions; otherwise refused with the reason | Old scope's design content written into current scope or closed record |
| 28 | line 543-546 Story 4.6 | Decision submitted after the assignment was reassigned or bypassed, or on a superseded revision | AC: decision checks the assignment version; late decisions are kept but labelled as after reassignment/bypass/supersession | Package shows an approval from someone no longer the reviewer |
| 29 | line 552-554 Story 4.7 | Link revoked or replaced while the reviewer has comments or a decision in progress | AC: next request refused with 'link no longer valid'; typed text stays on the page; nothing is recorded | Reviewer's typed decision lost without explanation, or accepted after revocation |
| 30 | line 552 Story 4.7 | Second decision through one link, or the same link open in two browsers | AC: state whether a later decision is refused or added as a new entry; simultaneous submissions yield one | Contradictory approve and reject recorded from one link |
| 31 | line 552-555 Story 4.7 (with 6.11:833, 4.8:564, 4.6:545) | Link still live after project archived, revision superseded, scope closed or assignment reassigned | AC: links have an expiry; state for each event whether the link is cancelled or stays read-only | Unverified reviewer writes a decision into an archived or superseded record |
| 32 | line 553 Story 4.7 | Reviewer submits an empty, very long or impersonating name; repeated bad tokens | AC: name required and length-bounded; invalid-token requests slowed; comment size and count bounded | Anonymous decision recorded; link endpoint used to flood a fixed revision |
| 33 | line 563-568 Story 4.8 | Superseded revision A is designated current again; or revision from another scope chosen | AC: re-designation allowed or refused explicitly; history shows A current twice; other-scope revisions refused | Designation history and Superseded marks become ambiguous |
| 34 | line 575-579 Story 4.9 | A cancellation or correction was itself a mistake; installed mark reversed with Configured mark or passes present | AC: cancellation/correction can be reversed with a reason; reversing Installed flags Configured mark and dependent checks | Wrongly cancelled device unrecoverable; Configured and passed checks remain on a not-installed device |
| 35 | line 588-592 Story 4.10 | Tab closed or crashes during generation; two people generate for one revision simultaneously | AC: abandoned edition's stored volumes are discarded and it can be restarted; edition numbers allocated by the server | Orphan volumes use storage; two editions share a number |
| 36 | line 587 Story 4.10 | No floors selected, or revision has no content for chosen floors | AC: Generate is disabled with the reason when the selection yields no pages | Empty package retained as a permanent edition |
| 37 | line 616 Story 5.2 | Installation view opened in a normal scope with no issued design | AC: device sheet shows 'Not issued — no requirements' and Compare with issued is unavailable with the reason | Technician sees blank or draft requirements as if issued |
| 38 | line 623 Story 5.3 | Configured marked before Installed; two technicians mark the same device; mark made in error | AC: state whether Configured needs Installed; second identical mark is not duplicated; Configured can be reversed with a reason | Contradictory or duplicate marks with no way to clear Configured |
| 39 | line 633-635 Story 5.4 | Check removed, made not applicable or loses its expected result after attempts exist | AC: such a change keeps attempts, shows the check as changed since tested, and never leaves a Pass under Needs definition | Counted pass on a check that now has no definition |
| 40 | line 642-645 Story 5.5 | Pass recorded while a required photo is still Uploading or Failed | AC: outcome with required evidence is not Saved until the evidence is; shown as Pass pending evidence | Check counted as passed with no evidence stored |
| 41 | line 643 Story 5.5 | Measured value is non-numeric, negative, out of range or in an unlisted unit | AC: value validated against the check's unit and range in the shared module before Pass is offered | Nonsense measurement recorded as a passing result |
| 42 | line 642-644 Story 5.5 with 635 Story 5.4 | Attempt submitted against a checklist definition changed since the page loaded | AC: attempt carries the definition version; a stale one is returned for review, not recorded as current | Pass recorded against superseded expected result |
| 43 | line 679-682 Story 5.9 | Resolved or deferred issue recurs or was resolved in error; two people resolve at once | AC: an issue can be reopened with a reason keeping history; issue state is versioned so one disposition wins | Real defect stays resolved; conflicting dispositions both recorded |
| 44 | line 688-692 Story 5.10 | Definition, coverage or target edited while a run is in progress | AC: a run is judged on the definition fixed at its start; edits apply to later runs and flag the open one | Run passes or fails against criteria changed mid-run |
| 45 | line 689-691 Story 5.10 | End before start, future or backdated times, end before duration elapsed, never ended, two runs started | AC: end must follow start; 'full run' means elapsed >= stage duration; one open run per stage; early end has no outcome | Short or overlapping run recorded as a full Pass |
| 46 | line 692 Story 5.10 (with 6.8, 5.12:713, 6.11) | Covered device removed or cancelled, scope closed, or project archived while run is open | AC: each event either flags the run or ends it with no outcome; closing lists the open run as outstanding | Open run frozen forever inside a closed or archived record |
| 47 | line 698-701 Story 5.11 | Outage starts before the run, ends after it, ends before it starts, or has no end at run end | AC: counted time is clipped to the run window; end must follow start; open entries count to the run's end | Availability below zero or wrong; Pass/Fail outcome incorrect |
| 48 | line 699-701 Story 5.11 | Downtime entry added, edited or re-marked uncounted after the run ended with an outcome | AC: after a run ends its entries change only by logged correction, and the outcome is recomputed and flagged | Recorded Pass no longer matches its downtime log |
| 49 | line 698 Story 5.11 | Outage affects only some covered devices | AC: state whether a partial outage counts as full downtime or is weighted | Two implementations compute different availability for the same log |
| 50 | line 708-711 Story 5.12 with 722 Story 5.13 | Stale or reconnecting tab saves work, results or photos after the scope is closed | AC: a write into a closed scope is refused for review, as for an archived project | Evidence added behind a fixed closeout record, contradicting it |
| 51 | line 708-711 Story 5.12 | Two Editors close the scope simultaneously with different states | AC: closing checks the scope version; the second close sees a conflict | Two closeout records, Completed and Closed with outstanding items |
| 52 | line 742-745 Story 6.2 | File has no data rows, duplicate headings, two columns mapped to one field, or exceeds a row limit | AC: each case stops at mapping with a plain reason; a stated row limit is enforced; nothing changes | Later column silently overwrites earlier; browser hangs on huge sheet |
| 53 | line 752-756 Story 6.3 | Two people apply the same inventory at once; apply interrupted midway | AC: apply re-matches New rows at commit; an interrupted apply reports what was applied and resumes without duplicates | Every new device created twice; partial batch with no record of where it stopped |
| 54 | line 801-806 Story 6.8 | Removed device has open issues, required retests, door links or covers a reliability run | AC: removal lists these dependents; issues and retests stay outstanding or get an explicit disposition | Outstanding items drop out of remaining work, allowing Completed |
| 55 | line 812-817 Story 6.9 | Restored device's label or asset ID is now used by another device | AC: restore detects the clash and requires a label decision before confirming | Two active devices share one label in schedule and packages |
| 56 | line 823 Story 6.10 / 845 Story 6.12 | Reopen or Start service visit while a scope is active, by two people, or on an archived project | AC: reopening refused while a scope is active; scope creation is versioned; 6.10 asks to un-archive first | Two active scopes, breaking the one-active-scope rule |
| 57 | line 832-836 Story 6.11 | Archived while a scope is open, a package or backup job is uploading, or an import is applying | AC: archiving lists open scope and running jobs and either waits, refuses or cancels them explicitly | Half-registered edition or half-applied import frozen in the archive |
| 58 | line 843-846 Story 6.12 | Warranty term zero or negative; scope never closed so no default start; visit before report time | AC: term must be positive; without closeout the start is required or status is Not started; time order validated | Status computed from a missing date; negative response times |
| 59 | line 932-936 Story 8.1 | Manual backup started while the daily one runs, or backup running when an update begins | AC: one backup job per project at a time; update waits for or supersedes a running backup | Two jobs interleave one generation; update backup incomplete |
| 60 | line 933 Story 8.1 / 953-958 Story 8.3 (1.10:247) | Installation recovered on a new machine without the deployment key that encrypts secrets | AC: procedure states the key is kept outside backups, is required for recovery, and what is re-entered if lost | Recovered installation cannot read two-step secrets or stored tokens |
| 61 | line 944-947 Story 8.2 | Members have the project open with pending edits when the restored copy becomes current | AC: switch changes a project epoch; saves and operation ids from before it are refused for review | Stale edits apply onto restored records whose version numbers coincide |
| 62 | line 944-946 Story 8.2 | Switch was a mistake; restored copy never made current; backup in an older data format | AC: a backup of the working project is taken before switching; unused copies can be discarded; older formats are converted | Pre-switch state unrecoverable; abandoned copies fill storage |
| 63 | line 954-956 Story 8.3 | Invitation and reset links used after the recovery point become unused again; old passwords return | AC: recovery cancels all outstanding invitation and reset links; notice states passwords and two-step reverted | Spent or leaked link works again after recovery |
| 64 | line 954-956 Story 8.3 | Project and installation backups hold different recovery points | AC: recovery reconciles catalogue with project backups, listing projects without members and memberships without projects | Project unreachable, or membership pointing at a missing project |
| 65 | line 966-968 Story 8.4 | Portable backup is corrupt, truncated, older-format, over receiving limits, or import fails midway | AC: manifest and hashes verified before creation; older formats converted; failure leaves no partial project; 8.5 limits apply | Partial or silently damaged project created from a bad archive |
| 66 | line 966 Story 8.4 | Live project replaced from a backup while members have it open and reviewer links exist | AC: replacement follows 8.2: isolated copy, verification, deliberate switch, links cancelled, stale saves refused | Replacement path bypasses the safeguards story 8.2 defines |
| 67 | line 976-978 Story 8.5 | Two uploads each pass the pre-check and together exceed the project budget | AC: space is reserved when an upload starts and released on failure; the later upload is refused before sending | Budget exceeded, or an upload fails at its last part |
| 68 | line 1024-1027 Story 9.4 | Release list unreachable or malformed; installed version newer than or absent from the list | AC: failed check shows time and reason, keeps last result; no update offered unless the release is newer | Stale or false update marker; downgrade offered as an update |
| 69 | line 1033-1034 Story 9.5 | Second administrator presses Update, or starts a restore, during a running update | AC: one update at a time; Update, backup and restore controls are disabled with the reason while one runs | Two updater runs or a restore interleave with the conversion |
| 70 | line 1034-1036 Story 9.5 | Sign-in, failed sign-in or session expiry occurs while changes are stopped | AC: state whether sign-in is blocked or allowed during an update and where its log entries go | Sign-in records written after the backup vanish on a return |
| 71 | line 1036 Story 9.5 | Page loaded before the update keeps running the old client against the new server | AC: server reports its version; an older page keeps unsaved edits, converts or holds them, and asks to reload | Old-format operations rejected or misapplied after a format-changing release |
| 72 | line 1034 Story 9.5 / 1045-1047 Story 9.6 | Server loses power, or updater is killed, between update steps | AC: updater records each step durably and on restart resumes or returns; changes are never left stopped | Installation stuck refusing changes with no version recorded as current |
| 73 | line 1045 Story 9.6 | Update passes the three health checks but is found broken afterwards | AC: documented administrator-started return to the pre-update backup, stating that later changes are lost | No defined way back once the health check has passed |
| 74 | line 1055-1056 Story 9.7 | Token invalid, repository copy lacks the release, or workflow never starts or finishes | AC: token and release checked before stopping changes; a run with no result by a time limit resumes changes and reports | Cloudflare installation stays read-only indefinitely |
| 75 | line 1056 Story 9.7 with 1015 Story 9.3 | Rolled-back earlier version starts against data the new version already converted | AC: on seeing newer data plus a pending-update marker, the earlier version restores the pre-update backup instead of refusing | Earlier version refuses to start, so the automatic return cannot run |
| 76 | line 1013-1014 Story 9.3 | Conversion fails for one project after others converted; or a project is opened before its conversion | AC: any project's conversion failure fails the update and triggers the return; unconverted project rooms refuse requests | Installation runs with projects at mixed data-format versions |

## Editorial structure

**Purpose read:** This document exists to help the product owner approve, and developers or coding agents build, Site Studio one story at a time, with every PRD requirement traceable to a story.

**Structure model:** Reference/Database for the body (87 stories, random access, consistent schema), with a Strategic/Context (pyramid) front section. The body fits the model well. Most findings concern the front and end sections, and the story schema drifting partway through.

**Word counts:** 12,978 words in total, by `word_metrics.py`. Section figures I could read from it: title section 330, How to read it 99, Rules 262, Requirement coverage 648. Other figures below are estimates and marked "est."

None of the recommendations changes a `## Epic N: Title` or `### Story N.M: Title` heading.

| Pass | Original Text | Revised Text | Changes |
| --- | --- | --- | --- |
| structure | User-story sentence ("As a…, I want…, so that…"): present in 31 stories (1.1–3.6, 9.1, 9.2), absent in 56 (4.1–8.5, 9.3–9.7, 10.1–10.4) | QUESTION: make the schema the same for all 87. Either add the sentence to the 56, or drop it from the 31 and rely on title plus epic Outcome. Adding is the better fit for readers who open one story alone. | The schema changes at Epic 4 with no explanation. Some later criteria need the missing actor: 4.1 says "Given my pending edits" with no "I" defined. Adding costs about +1,400 words (est., 25 per story); dropping saves about 800 (est.). |
| structure | Status, spread over five places: front-matter `status`, "It is a draft…" paragraph, §Order and validation "Order, confirmed by Kevin", the last line "Not done as part of this check…", and the last bullet of story 10.3 | MOVE into one status block directly under the title: what is confirmed (epic order), what is proposed (story boundaries, criteria), what has not happened (independent review, sizing), nothing built. | The opening says the epic order is a proposal; the end says Kevin confirmed it. The most important caveat for the reviewer, that story content has had no independent review, is the last sentence of the document. Roughly word-neutral. |
| structure | Four draft-history paragraphs ("What changed from draft 0.1", "Draft 0.3", "Draft 0.4", "Draft 0.5"), about 250 words (est.) of the 330-word title section | MOVE to a "Revision history" section at the end. Leave one line at the top: the current draft number and a link to that section. | A developer picking up a story reads four paragraphs of renumbering history before learning how to read the document. The history is still wanted by the reviewer, so it moves; it is not cut. Fix the validation table's "the moves described above" to point at the new section. Word-neutral. |
| structure | No overview of the ten epics; §Order and validation "Order" list (3 bullets) at the end; dependency sentences scattered in Epic 2, 3, 8 and 9 intros and repeated in the "Epics stand alone" row | MOVE the order bullets to the top and add an epic table there: epic, outcome, story count, depends on or can run beside. Give each epic a uniform "Depends on:" line in place of the unlabelled sentences. | Missing scaffolding. A reader cannot see the shape or sequence of the work without scrolling about 1,000 lines. Epics 4–7 and 10 state no dependency at all, so silence is ambiguous. About +150 words (est.) for the table; the confirmed order stops being buried. |
| structure | §Requirement coverage, three tables, 648 words, placed before Epic 1 | MOVE after Epic 10, beside the validation table that cites it ("Every FR appears in at least one story"). Keep one sentence and a link in "How to read it". If it stays in front, at least unpair the FR table into one requirement per row. | It is lookup material that delays the stories, and its paired columns put FR-1 beside FR-37, which makes scanning down one requirement series hard. PRESERVE the content in full: it is the traceability evidence. Word-neutral. |
| structure | Acceptance-criteria lists that mix testable criteria with other kinds of statement. Forward pointers: 1.4 "Reset by an administrator arrives in story 1.8", 1.6 "once story 9.4 is built", 1.9 last bullet, 2.9 "Full handling arrives in story 6.8", 3.1, 4.4. Experiment findings: 2.8 "Experiment R2 found…", 4.10 "Experiment R1 found…". Context or actions: 4.7 "This replaces the prototype's development-only review service", 9.2 "Making the repository public is Kevin's action…", 5.1 "Experiment R4 is started here" | MOVE the non-criteria into a labelled "Notes:" line (or "Extended by: story N.M") under each story's criteria, so every remaining bullet is something to verify. | "How to read it" says criteria state what must be observable; about 15 bullets (est.) are not observable. A developer cannot tell which bullets gate "done". Word-neutral. |
| structure | Story 10.3, last bullet: "Passing stories 10.2 and 10.3 is enough to accept the proof of concept on Cloudflare." | MOVE to the Epic 10 intro, beside the Outcome. | This is the acceptance rule for the whole proof of concept, placed as the sixth criterion of one story. It is not a criterion of 10.3; it is about 10.2 and 10.3 together. Word-neutral. |
| structure | Experiment status in three places: "Draft 0.4" paragraph ("R1, R2, R6, R7, R8 and R10 are done; R13 to R16 are new"), the "Early experiment" table, and "(run early)" notes in the Covers lines of 1.1, 2.8, 4.10 and 9.7 | MERGE into the experiment table by adding a Status column (done or remaining). Drop the parenthetical notes from the Covers lines. | One place to see which experiments are still to run. At present a reader of story 9.7 learns R10 is done, but a reader of the table does not. Saves about 25 words (est.). |
| structure | §Rules that apply throughout, rule 8 ("A story is done when…") | MOVE out of the numbered list into its own short "Definition of done" paragraph or heading, after the rules. | Rules 1–7 constrain how things are built; rule 8 is the finish test every story is judged by, and it is last in a list of eight. Word-neutral. |
| structure | Standing rules restated inside stories: story 1.7 bullet 3, second sentence ("Each later story that adds a way to change or download something shows the same…") against rule 2; story 1.1 bullet 5, first sentence, against rule 7; story 2.13 "From here on, every story extends it" against rule 7; story 2.1 "Every accepted change records the signed-in account as its actor" against rule 2 and 1.7's last bullet | CONDENSE: keep each statement in the rule and remove the restatement, or replace it with "(rule 2)" or "(rule 7)". | "How to read it" promises standing rules "are not repeated". These four are. Saves about 60 words (est.). |
| structure | Viewer bullets in 4.4, 4.10, 6.11 and 8.4 ("A Viewer can export the estimate and cannot change it", and similar) | PRESERVE | They look like repeats of rule 2, but each says what a Viewer is allowed to do in that feature, which the rule does not. |
| structure | Epic intros: "**Outcome.**" on every epic; "**Why first.**" on Epic 1 only; unlabelled rationale paragraphs on Epics 2, 3, 8, 9 and 10; none on Epics 4–7 | CONDENSE to one pattern: Outcome, then an optional labelled "Why here." and the "Depends on:" line from the row above. | Same kind of information, four different shapes. Word-neutral. |
| structure | Epic 10 justification, stated twice: the Epic 10 intro ("BMAD asks that every epic deliver user value…") and the "Epics deliver user value" row of the validation table | CONDENSE the table row to "Pass for Epics 1 to 9; Epic 10 is an exception, explained in its intro." | Same point twice; the intro is the right home. Saves about 5 words (est.). |
| structure | §Order and validation, validation table | PRESERVE | It reads like process residue, but it is the evidence for the front-matter claim "checked against the BMAD rules" and records two stated exceptions the reviewer needs. |
| structure | "**Outcome.**" line at the head of each epic | PRESERVE | One-sentence orientation before detail; it is also the natural source for the proposed epic table. |
| structure | Heading "Rules that apply throughout" against the bullet that points to it, "**Standing rules** below" | CONDENSE to one name; "Standing rules" is shorter. | Two names for one section. Saves 1 word. |

**Pacing (human readers):** Adequate. Short bullets, one story per screen and bold lead-ins keep it scannable. The only dense spot is the first screen, which the moves above clear. One further inconsistency is left for a prose pass: criteria use Given/when/then in Epics 1–2 and plain statements from Epic 3 on.

**Summary**

- 16 rows: 13 recommended changes (one of them a question) and 3 explicit preserves.
- Reduction if all are accepted, excluding the user-story question: about 90 words cut and about 150 added, so roughly +60 words net (under 1% of 12,978). The document is already lean; the gain is in order and consistency, not length.
- The user-story question dominates the word count either way: about +1,400 words (+11%) to add the sentence to 56 stories, or about −800 (−6%) to drop it from 31.
- No length target was given.
- Comprehension trade-offs: moving the coverage tables and the draft history to the end makes them one jump further for the reviewer; a link from the top offsets that. Dropping the user-story sentences, if chosen, removes the stated actor and purpose from stories read in isolation.
