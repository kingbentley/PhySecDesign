# Amendment 1.4 status: external tickets

**Date:** 2026-11-19. **Decided by:** Kevin. **Source:** the approved [sprint change proposal](../../sprint-change-proposal-2026-11-19-external-tickets.md), made with BMAD Correct Course.

| Item | Change |
| --- | --- |
| FR-78 | Added: external tickets (number and optional link) on issues, service visits and warranties; never fetched; in packages only when chosen; never through reviewer links |
| FR-33, FR-46, FR-65 | A pointer sentence to FR-78 |

Kevin's decisions: all three records, named so as to suit both customers' tickets and in-house trackers; number and link only; references only, with agents keeping trackers in step through Epic 11; off by default in packages. He approved the proposal's choices E1 to E7 as Claude recommended them: the name "External ticket"; several per record; a number of 1 to 100 characters kept as typed; an optional http or https link of at most 2,000 characters, opened in a new tab and never fetched; a repeated number allowed and shown as "also on"; removal kept in history; the package option off by default and never shown through reviewer links.

Not done: an independent review. Nothing is built.

## After the second review (2026-11-19)

A second BMAD review of the agent-access and external-ticket material (round two in `review-epic-11.md`) was applied in full on Kevin's instruction, with seven new rules. In FR-73: deactivation revokes tokens for good; removal from a project drops it from a token's list; connector tokens count and take an owner-chosen expiry. In FR-75: undo and permanent removal are person only; token deletions are reversible; an agent may request a review whose assignee is a person; the verified rule covers any field, and imports never change a verified device; one definition of text from outside. In FR-78 (amendment 1.4): "also on" stays within one project and out of exports and packages; links with credentials are refused; matching ignores case and spaces; search covers visits' tickets. NFR-5 gains the link warning.
