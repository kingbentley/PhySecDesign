# Site Studio — amendment 1.2: status

Prepared 2026-11-18. Amendment 1.2 was reviewed together with amendment 1.1 on the same day and is part of the [final PRD 1.2](prd.md). The [amendment review](review-finalization-amendments.md) records the findings, the eight further decisions Kevin made during it, and the changes that followed; where this note and the PRD differ, the PRD governs.

The PRD and addendum as they stood before this amendment are preserved unedited in [sources/pre-amendment-1.2](sources/pre-amendment-1.2/prd.md.txt).

## Why

On 2026-11-18 Kevin decided:

1. Other organisations can host Site Studio themselves: on a virtual machine, on a physical server, or on Cloudflare.
2. The software can be updated from the interface, and releases are public.
3. The product needs administrator sign-in and controls, user accounts, and whatever else these require.

Asked three questions, he chose:

| Question | Choice |
| --- | --- |
| How people sign in | Email and password, with optional two-step verification. Single sign-on can be added later. |
| What happens to links | Accounts for people who edit; reviewer links kept so a client can review without an account. |
| Roles | Administrator, Editor and Viewer. Design and Installation remain views, not permissions. |

## What changed in the PRD

| Change | Detail |
| --- | --- |
| Added FR-66 | Host it yourself or on Cloudflare; one installation per organisation; first-run set-up. |
| Added FR-67 | Accounts by invitation, sign-in, two-step verification, sessions, password reset with or without email, deactivation. |
| Added FR-68 | Installation role (Administrator or standard user) and per-project membership (Editor or Viewer). |
| Added FR-69 | Attribution by account; reviewer-link names stay unverified and labelled. |
| Added FR-70 | Administrator controls: users, projects, reviewer links, settings, backups, software, activity. |
| Added FR-71 | Activity log of security and administrative events. |
| Added FR-72 | Installed version, public signed releases, update check, administrator-only update with backup, check and return to the earlier version. |
| Added NFR-7 | The same product on either host; a project can move between them by portable backup. |
| Added NFR-8 | Safe updates: no loss of acknowledged data; never run a version older than the data. |
| Added SM-6 | Installation, roles, update, failed update and cross-host restore demonstrated from published instructions alone. |
| Added UJ-5 | Set up and look after an installation. |
| Amended FR-2 | Accounts and membership replace project edit links. The Check now covers non-members, Viewers and deactivated accounts. |
| Amended FR-23 | An approval assignee is a user account that is a member or an administrator, or a named reviewer-link holder; an assignment whose account stops qualifying shows as unavailable. The phrase "without requiring individual accounts" is removed. |
| Amended FR-24 | Reviewer links are for people without accounts; signed-in members can also decide; the two kinds of decision are labelled differently; administrators can see and revoke every link. |
| Amended FR-34 | The installation's own data is backed up on the same schedule as projects. Recovering an installation restores accounts, roles and memberships as at the recovery point, ends every session and cancels every reviewer link. A portable project backup carries no accounts. The sentence about re-establishing access "under the existing model" is removed. |
| Amended NFR-3 | The device matrix also covers sign-in, two-step verification, invitations and password change, and the administrator screens on desktop. |
| Amended NFR-5 | From "demo access boundary" to an access boundary based on accounts, roles, membership and link scope, with password and secret handling. |
| Front matter, opening paragraphs, Users paragraph, decision-status paragraphs | Status and summaries updated; one sentence added on administrators. |
| Scope table, exclusions, terms | The Access row is rewritten; "production identity or enterprise access controls" is replaced in the exclusions by single sign-on, directory synchronisation, several organisations in one installation, and licensing or billing; three terms are added. |

## What is withdrawn

- **Project edit links.** Anyone who edits now signs in.
- **Unverified display names for editors.** Edits carry the account. Unverified names remain only for reviewer links.
- **Not withdrawn:** the PRD 1.0 rule that live credentials for the site's own systems, such as camera or recorder passwords, stay out of notes and exports. The first draft of this amendment dropped it from NFR-5 by mistake; the review restored it.
- **"Use sample or sanitised data" as the access rule.** Each hosting organisation is now responsible for its own data. The PRD states that the software carries no security certification and that an independent security review is needed before recommending it for confidential client data.

## Details settled while drafting, confirmed by Kevin

These details were needed to write the requirements and were not among the three questions first put to Kevin. He confirmed all eleven as written on 2026-11-18.

| # | Confirmed detail | Where |
| --- | --- | --- |
| A1 | Accounts are created only by an administrator's invitation. There is no open registration. | FR-67 |
| A2 | Sending email is optional. Without it, an administrator copies invitation and reset links and passes them on by hand. | FR-67 |
| A3 | Two-step verification is optional per user, and an administrator can require it for everyone. | FR-67 |
| A4 | Administrators create projects, and can allow standard users to create them too. | FR-68 |
| A5 | An administrator can open every project as an Editor. | FR-68 |
| A6 | A Viewer can search, download packages and files that already exist and export schedules and estimates, and cannot add notes, photos or results. As settled in the review, a Viewer creates no retained package and downloads no portable backup, and can record a decision only as the approval assignee. | FR-68 |
| A7 | One installation serves one organisation. Several organisations in one installation is out of scope. | FR-66 |
| A8 | The activity log is kept for the life of the installation; no retention period is set. | FR-71 |
| A9 | Update checks can be turned off, for servers without internet access. | FR-72 |
| A10 | On Cloudflare the Update control starts the organisation's own deployment, and shows manual steps where that is not set up. | FR-72 |
| A11 | No password-length figure, session length or lock-out figure is set in the PRD; they are left to architecture and the administrator's settings. | FR-67 |

## Not changed, but affected

- **FR-1–65 otherwise keep their text.** Wherever they say "participant with project editing access" or "display name", read "Editor" and "account" under FR-68 and FR-69.
- **The acceptance profile** still assumes one usual user and two simultaneous users per project.
- **The addendum** was revised on 2026-11-18: its access section is rewritten and a section on amendment 1.2 is added. Its earlier text is preserved in the pre-amendment snapshot.
- **The role structure.** Kevin chose Administrator, Editor and Viewer. The PRD expresses this as an installation role (Administrator or standard user) and a per-project role (Editor or Viewer). "Standard user" is a drafting term for an account that is not an administrator.
- **Details resting on the general mandate.** Kevin asked for administrator login and controls, user accounts and anything else needed, then confirmed the amendment's content. Details not individually put to him rest on that: published installation instructions and naming the installation; single-use expiring invitations; authenticator codes with recovery codes; seeing and ending sessions; last-administrator protection; attribution by the name at the time; the administrator controls for stored size, map keys and restore; the activity-log event list with filter and export; signed releases, the daily check and direct upgrade from any earlier release; the device-matrix extension; salted password hashes and the security-review statement; cross-host restore; never running a version older than the data; and SM-6.
- **The UX specification, architecture and epics** were written before this amendment. The UX specification and the architecture are revised alongside it; the epics are not, and need a further pass.

## Still to do

The finalization review and the addendum revision are done. Remaining: revision of the epics and stories, which Kevin deferred.
