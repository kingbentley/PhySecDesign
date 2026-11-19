---
title: "Sprint change proposal: external tickets on issues, service visits and warranties"
date: 2026-11-19
workflow: BMAD Correct Course (bmad-correct-course), batch mode
status: approved by Kevin on 2026-11-19, with Claude's recommendations for E1 to E7; applied the same day
inputs: "PRD 1.2 with amendment 1.3; UX 0.6; architecture 3.1; epics draft 0.7 (174 stories)"
---

# Sprint change proposal: external tickets

Nothing here is built. This proposal changes plans only, and only once Kevin approves it.

## 1. Issue summary

**Trigger.** On 2026-11-19 Kevin asked for a way to record, on warranty and issue work, the number and web address of a ticket in a web-based issue tracker.

**Kind of change.** A new requirement from the product owner.

**Problem.** The PRD gives no record a place for a ticket held in another system:

- FR-46 issues (story 5.17);
- FR-65 service visits (story 6.18);
- FR-65 warranties (story 6.17).

People will use these trackers in two ways:

- An integrator works from the customer's service desk.
- A large organisation running Site Studio in house works from its own tracker.

**Kevin's direction (2026-11-19):**

1. **Where.** References go on all three records. Their name must suit both uses, the customer's tickets and an in-house tracker.
2. **Shape.** A reference is a ticket number and an optional link. There is no list of trackers.
3. **Integration.** Site Studio stores the references and opens the links. It never contacts a tracker. An AI agent with access to both systems can keep them in step through the Epic 11 API and MCP tools.
4. **Clients.** References are left out of PDF packages unless an option is ticked when the package is made. They never appear through reviewer links.

## 2. Proposed name

**"External ticket"** on screens and in documents, with the hint "A ticket in another system, such as your customer's service desk or your own tracker".

- It says only that the ticket lives outside Site Studio, so it fits the customer's tickets and an in-house tracker alike.
- "Customer ticket" would be wrong for in-house use. "Ticket" alone could be mistaken for Site Studio's own issues.

## 3. Impact analysis (checklist results)

**Trigger and context**
- [x] New requirement from Kevin. The evidence is FR-46, FR-65 and stories 5.17, 6.17 and 6.18 as written.

**Epics**
- [x] No epic changes scope or order.
- [!] One new story is added at the end of Epic 6, after story 6.19. It needs issues (Epic 5) and warranties and service visits (Epic 6) to exist.
- [!] Story 11.2 gains one criterion, so an agent can find an issue by its external ticket number.

**PRD**
- [!] Amendment 1.4 adds FR-78.
- [!] FR-46 and FR-65 each gain a pointer sentence.
- [!] FR-33's package options gain "Include external tickets", off by default.

**Architecture**
- [!] One rule is added to AD-22: the server never fetches an external ticket's link, so nothing changes for an intranet installation.
- [x] Records follow AD-5 and AD-8 as they are: external tickets are history entries, and fixed records keep what they held at their cutoff.

**UX**
- [!] Section 19 extends S-18 (issues), S-19 (service visits and warranties) and S-37 (packages).
- [x] No new screen is needed.

**Other**
- [x] The portable backup carries external tickets as ordinary project records. CSV exports for members include them.

**Path forward**
- [x] Direct adjustment. Effort: low, one story and a few criteria. Risk: low.

## 4. Recommended approach

Add FR-78 and one Epic 6 story.

- External tickets are plain data, so the design is the same on Cloudflare and on a private network.
- They need no outside service, key or outbound connection, which keeps intranet installs working.
- Keeping trackers in step is left to agents (Epic 11), which already have permission rules and history labels ("via agent").

### Choices (each with Claude's recommendation)

| ID | Choice | Recommendation | Why |
| --- | --- | --- | --- |
| E1 | Name | "External ticket" | Section 2 |
| E2 | How many on one record | Several. One record may relate to a customer ticket and an internal work order. | A visit often has both |
| E3 | The number | Required, 1 to 100 characters of text, kept exactly as typed | Ticket identifiers vary (INC0012345, PROJ-42, #1187) |
| E4 | The link | Optional. Only `https://` or `http://`, at most 2,000 characters. Opened in a new tab, and never fetched by the server. | Blocks script links. Never fetching keeps the server out of the tracker and works on an intranet. |
| E5 | The same number on several records | Allowed. Each record shows "also on" the others. | One customer ticket can cover several faults |
| E6 | Removing one | Removing an external ticket is a history entry. The earlier value stays in the record's history. | NFR-1 and AD-5 |
| E7 | Packages | An option "Include external tickets" when making a Design or Closeout package, off by default (Kevin's direction 4). Never shown through reviewer links. | Internal tracker addresses often should not reach a client |

## 5. Detailed change proposals

### 5.1 PRD amendment 1.4

**FR-78 — External tickets.** Let a member who can change a record add external tickets to an issue (FR-46), a service visit (FR-65) and a warranty (FR-65).

- **What an external ticket is.** A ticket in a system outside Site Studio, such as a customer's service desk or the organisation's own tracker. It holds a ticket number and an optional web link.
- **On a record.** A record may hold several. The same number may appear on several records, and each shows the others.
- **Changes.** Adding, changing and removing one are history entries with actor and time, under FR-74 when an agent acts.
- **Finding records.** Issues can be searched and filtered by ticket number.
- **Links.** Site Studio opens a link in a new tab and never contacts the tracker. Only web links are accepted.
- **Where they appear.**
  - External tickets appear wherever their record is shown to members, and in members' exports.
  - They appear in Design and Closeout packages only when "Include external tickets" is chosen for that package.
  - They never appear through reviewer links.
  - A fixed record keeps the external tickets it held at its cutoff.

**Check:** A service visit holds the customer's ticket INC0012345 with its link and an internal work-order number with none. Searching INC0012345 finds the issue. Opening the link opens the tracker in a new tab, and the server log shows no request to it. A `javascript:` link is refused. A Closeout package made with the option off shows neither ticket; one made with it on shows both. A reviewer link shows neither. Removing one leaves it in the visit's history, and a package already made is unchanged.

**Pointer sentences:**
- FR-46: "External tickets on an issue follow FR-78."
- FR-65: "External tickets on a warranty or a service visit follow FR-78."
- FR-33: "An option to include external tickets follows FR-78."

### 5.2 Architecture 3.1 (revised in place)

AD-22 gains one rule:

> The server never fetches an external ticket's link (FR-78). Links are stored and returned as data, and are accepted only with the `http` or `https` scheme.

### 5.3 UX 0.6: section 19, External tickets

- **S-18 Issues and S-19 visits and warranties.**
  - An "External tickets" list appears with Add. Add asks for the ticket number and an optional link, with the hint from section 2.
  - Each ticket shows its number, a link icon that opens in a new tab, and "also on" for other records with the same number.
- **The Issues list** gains a ticket-number search and a column showing the first external ticket.
- **S-37 Packages** gains the option "Include external tickets", off by default.

### 5.4 Epics

**New story 6.20: External tickets on issues, visits and warranties** (part id 6.12d, in `partE.md`; Covers FR-78, FR-46, FR-65, FR-33).

- Criteria follow FR-78's Check and choices E1 to E7.
- The choices are recorded as CE-33 to CE-38, with decisions marked as Kevin's where he approves them here.

**Story 11.2, added criterion:** "An agent searches issues by an external ticket number, and adds an external ticket to a service visit, recorded as via agent."

## 6. Implementation handoff

**Scope: minor.** This is a direct adjustment.

1. Kevin approves this proposal, with or without changes to E1 to E7.
2. Claude applies amendment 1.4, the AD-22 line, UX section 19 and the story.
3. Claude reassembles the epics, regenerates tracking and records the gate.

Done when the assembler reports 0 problems and FR-78 is covered.

## 7. Applied (2026-11-19)

- **PRD.** Amendment 1.4 adds FR-78 to `prd.md` and pointer sentences to FR-33, FR-46 and FR-65. Its record is `amendment-1.4-status.md`, and the earlier text is in `sources/pre-amendment-1.4/`.
- **Architecture.** AD-22 gains the rule that external ticket links are never fetched.
- **UX.** Section 19 covers external tickets.
- **Epics.**
  - The new story is published as story 6.20 (part id 6.12d), with choices CE-41 to CE-47 marked as Kevin's.
  - Story 11.2 gains the criterion for agents.
  - The assembler reports 0 problems: 11 epics and 175 stories.
- **Tracking.** Regenerated, with an addendum to the fourth gate run in `implementation-readiness.md`.

**Not done.** An independent review.
