# Finalization review of amendments 1.1 and 1.2

Reviewed 2026-11-18. This is the review that amendments 1.1 and 1.2 had not yet received. It follows the method of the [PRD 1.0 finalization gate](review-rubric-finalization.md): a consistency and done-ness review of the document as a whole, and a reconciliation against the recorded decisions and the downstream documents. It is a review of requirements, not of software; nothing was built or tested.

## How it was done

- **Source check.** 148 inventoried source files: 141 unchanged; `.gitignore`, `AGENTS.md` and `site-studio/src/RevisionPanel.jsx` changed as already known; four third-party reference screenshots are absent from the cloud checkout by design. None bears on the amendments.
- **Two independent readers** reviewed the documents without access to the author's reasoning. One read the whole PRD for contradictions, leftovers from the withdrawn access model, unanswered questions created by the new roles, and Checks that do not exercise their requirement. The other compared the PRD with the decision log, both amendment status notes, the pre-amendment snapshot (by diff), the UX specification and the architecture.
- **Eight questions** that the findings raised were put to Kevin, who answered each.
- **Fixes** were applied to the PRD, addendum, UX specification, architecture and one canvas screen.
- **A third independent reader** then verified the fixes; see [Verification](#verification).

## Verdict

The amendments are a sound basis for finalization once the findings below are applied. The first reader reported 43 findings and the second 31, with overlap. Ten distinct findings were high: nine were gaps or contradictions in the amended text, one of which also showed in the architecture, and one was a gap in the architecture's Cloudflare update path. None required new product scope. Eight needed a decision from Kevin; the rest were resolved by wording that follows decisions already recorded.

## Decisions Kevin made during the review

| # | Question raised by the review | Decision | Where applied |
| --- | --- | --- | --- |
| R-1 | Can a Viewer record an approval decision? | A Viewer who is the approval assignee can comment and decide on that fixed revision. It is the only thing a Viewer can add. | FR-68, FR-24, FR-23, Terms |
| R-2 | What may a Viewer export? | Download packages and files that already exist and export schedules and estimates. No new retained package edition and no portable backup. | FR-68 |
| R-3 | On which host is acceptance demonstrated? | In full on Cloudflare first. Self-hosting is not described as supported until the same run passes there. SM-6 on both. | Acceptance section |
| R-4 | How does recovery treat links revoked and accounts changed after the recovery point? | Recovery cancels every reviewer link and ends every session. Accounts, roles and memberships return to the recovery point, with a notice asking administrators to review changes since. | FR-34 |
| R-5 | Who may archive and un-archive? | Editors of the project, and administrators. | FR-37, FR-68, FR-65 |
| R-6 | Who may download and import a portable backup? | Editors download. Importing creates a project and follows the project-creation rule. Replacing a live project is an administrator action. | FR-68 |
| R-7 | Can field changes be recorded in a service scope without issuing a design? | Yes. Issuing remains available. | FR-65 |
| R-8 | What does restoring a revision bring back? | Planned actions, scope categories, proposed routes, proposed port assignments and estimate lines, with the layout. Checklists and every recorded fact stay as they are. | FR-22 |

## Findings and disposition

High findings are listed individually. Medium and low findings are grouped.

| Finding | Severity | Disposition |
| --- | --- | --- |
| FR-61 still attributed by "the existing demo-attribution model". | High | Fixed: attributed under FR-69. |
| Viewer could and could not record a decision (FR-24 against FR-68; architecture gate). | High | Decided R-1; PRD, architecture and UX aligned. |
| Viewer "export" could mean creating a retained edition or downloading a backup. | High | Decided R-2; PRD, architecture and UX aligned. |
| Approval assignee: membership not required; no rule on deactivation or removal. | High | Fixed in FR-23: assignee must be a member or administrator; an unavailable assignment is reassigned or bypassed. Follows FR-25. |
| Backups excluded credentials yet recovery restored accounts; no installation-level backup was defined. | High | Fixed in FR-34: installation data is backed up on the same schedule; the credential exclusion applies to portable project backups only. |
| A link revoked after the recovery point would return on recovery. | High | Decided R-4. |
| Saves could be acknowledged between the pre-update backup and the update, then lost on return. | High | Fixed in FR-72: saving stops before the backup. |
| Acceptance tables did not say which host. | High | Decided R-3. |
| Architecture's Cloudflare update path had no check, no return and no signature verification. | High | Fixed in architecture AD-21 and experiment R11. FR-72 now states the same steps for both hosts. Relies on redeploying an earlier Worker version, which is unverified until R11. |
| NFR-5 had dropped two PRD 1.0 obligations without record: live site-system credentials kept out of notes and exports; anyone holding a link can use it. | High | Restored in NFR-5. |
| The withdrawal of the "sample or sanitised data only" rule had no decision-log entry. | Medium | Recorded. It was listed under "What is withdrawn" in the status note when Kevin confirmed the amendment's content; it is now also stated in the PRD's decision-status section and logged. |
| Roles: FR-2 Check failed for administrators; archive rights; member management; what an Editor may do; portable backup rights; FR-27 wording. | Medium | Fixed in FR-2, FR-27, FR-37, FR-68 (decisions R-5, R-6; only administrators manage members, as already implied by FR-70). |
| Update: Cloudflare parity; failed attempt erased by the return; "check that the installation is working" had no criteria; "supported version" undefined; "about once a day". | Medium | Fixed in FR-72: one set of steps for both hosts; the record is written after the return; three named health criteria; "any earlier released version"; "at least once every 24 hours". |
| NFR-8 allowed no outcome in which the return itself fails, while the UX had such a state. | Medium | Fixed: NFR-8 and FR-72 require the installation to say so plainly and never report success. |
| Sessions and sign-in: idle period named two ways; no rule for pending input when a session ends; no rule for a user without two-step verification when it becomes required; invitation expiry period; password-hash wording; non-disclosure of whether an email exists was only in a Check. | Medium | Fixed in FR-67, FR-70 and NFR-5. |
| FR-70 made the acceptance-table storage limits an administrator setting. | Medium | Fixed: shown, not raisable from the interface. |
| FR-69 Check narrowed "earlier records" to "fixed records". | Medium | Fixed. |
| Portable backup: whether actor names and assignments travel. | Medium | Fixed in FR-34: names travel as text; account assignments arrive unassigned. |
| Activity log: confirmed "kept for the life of the installation" was missing; event list did not cover every FR-70 control. | Medium | Fixed in FR-71. |
| Set-up step was not required to be protected; the set-up code existed only in architecture and UX. | Medium | Fixed in FR-66: protected so that only the installer can complete it. The code remains an architecture mechanism. |
| FR-66 did not point to the supported kinds of server. | Low | Fixed: the published instructions state them. |
| Amendment 1.1: FR-54 said "Reopen" where it meant un-archive; state model silent on Replace; FR-65 against FR-26 (decision R-7); FR-22 lists (decision R-8); FR-64 coverage as free text and stage order; FR-63 limit checks and zone detail summary; FR-64 mandatory issue on every outage; FR-65 suggestion rule with several warranties; FR-8 "with its reason" against an optional reason; FR-64 progress wording; FR-55 "not installed" against "Proposed". | Medium and low | All fixed in the named requirements. For FR-64, stages can run in any order with the existing warning, and an issue is linked where the outage is a fault; both follow the PRD's rule of warning without blocking. |
| Checks for FR-23, FR-34 and FR-63 to FR-72 did not exercise significant obligations. | Medium | Each Check extended to cover the listed obligations. |
| Status wording: amendment headings; the "keep their IDs and meaning" sentence contradicted by 1.2; "This is the finalized PRD 1.0"; decision-status paragraph omitted the FR-55 exception; Supporting records did not link the status notes. | Medium and low | Fixed as part of setting the PRD to final 1.2. |
| Smaller leftovers: tenancy "requires later definition"; "hosting remains an architecture choice"; counter-metric wording; inheritance paragraph; "all these roles". | Low | Fixed. |
| Downstream: UX text outside section 17 still described the withdrawn model; no assignment screen change; project restore conflated with installation recovery; "session lasts a working day"; architecture said HTTPS was optional; architecture said the repository "stays public" while K15 makes it public later; several PRD details absent from architecture. | Medium and low | Fixed in the UX specification (draft 0.5), the architecture (2.1) and the Backups canvas screen. |
| Status notes: 1.2 note and the log said the addendum was unrevised after it had been; 1.1 note and the source index said differences "have not been applied". | Medium and low | Fixed in both notes, the source index and the log. |

## Recorded without change

- **The two-level role structure.** Kevin chose the roles Administrator, Editor and Viewer. The PRD expresses them as an installation role (Administrator or standard user) and a per-project role (Editor or Viewer). This is a drafting structure for the same decision and is noted in the amendment 1.2 status.
- **Obligations covered by the general mandate.** Kevin asked for administrator login and controls, user accounts and "anything else that is needed", then confirmed the amendment's content. Details such as single-use expiring invitations, recovery codes, last-administrator protection, the activity-log event list, signed releases and the cross-host restore rest on that mandate and confirmation, and are listed in the status note.
- **Checklist wording, workload manifest and architecture mechanisms** remain downstream, as in PRD 1.0.

## Not resolved by this review

- **The epics and stories** predate amendment 1.2 and are out of date. Kevin deferred their revision.
- **Design canvas.** Screens for approval assignment, the Viewer's view and installation recovery are described in the UX specification and not drawn.
- **Unverified platform points** in the architecture: the R2 multipart minimum part size, PDF printing in Cloudflare's browser service, the best trigger for a Cloudflare deployment, redeploying an earlier Worker version for the return path, and whether Cloudflare's open-source runtime could host the Cloudflare build on a server.

## Verification

A third independent reader checked the revised documents on 2026-11-18.

- **Confirmed.** Every decision R-1 to R-8 and every disposition row is implemented in the PRD, each located by line and quotation. FR-1 to FR-72 each appear once with one Check; NFR-1 to NFR-8, SM-1 to SM-6 and UJ-1 to UJ-5 each appear once. No high contradiction remains between the PRD and the architecture or the UX specification.
- **Found and then fixed.** One dead in-page link in the PRD, left by renaming the device state model heading. Wording from before decision R-4 in the amendment 1.2 status note and the addendum. "Proposed" still attached to the amendments in the addendum, the amendment 1.1 status note, the source index, and the input lines of the architecture and UX specification. Twelve low-severity ambiguities in the PRD, the main ones being: an update now stops administrative changes as well as saves, a failure before installation stops without a return, and a return is not a recovery; the credential exclusion is worded so that live site-system passwords stay out of every backup; the recovery target covers the installation's data; the first acceptance run on Cloudflare is enough to accept the proof of concept there, and SM-6 is completed with the self-hosted run; FR-26 names the service-scope exception. Five Checks extended again. Nine small differences in the architecture and UX specification aligned.
- **Not re-verified.** These last fixes were applied after the third reader finished and were checked only by script: requirement and Check counts, and local links.
