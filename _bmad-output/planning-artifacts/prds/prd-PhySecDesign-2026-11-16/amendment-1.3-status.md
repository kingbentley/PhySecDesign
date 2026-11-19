# Amendment 1.3 status: agent access

**Date:** 2026-11-19. **Decided by:** Kevin. **Source:** the approved [sprint change proposal](../../sprint-change-proposal-2026-11-19.md), made with BMAD Correct Course.

## What changed

| Item | Change |
| --- | --- |
| FR-73 | Added: personal access tokens (read-only or read-and-draft, optional project limit, expiry 90 days by default and at most 1 year) |
| FR-74 | Added: actions by agents recorded under the owner, marked via agent |
| FR-75 | Added: people decide; the actions an agent is refused with "needs a person" |
| FR-76 | Added: an API and an MCP endpoint on every installation, on either host and on a private network, with no outside service; off until an administrator turns it on |
| FR-77 | Added: coverage, estimates and inventory import for agents by the same rules as the app |
| NFR-5 | Amended: tokens stored as hashes, rate-limited, kept out of records, exports, logs and backups |
| SM-7 | Added: an agent does real work on both hosts, and a person approves it |

## Kevin's decisions

1. Outside agents act on a person's behalf; no AI assistant is built into the app.
2. Agents draft, people decide.
3. One documented HTTP API with personal access tokens, and an MCP endpoint built on it.
4. Access is settled before story 1.1; the agent tools come as a later epic.
5. It must work on a Cloudflare installation and on one hosted on an intranet.
6. The proposal's five choices as Claude recommended them: two token kinds; 90-day default, 1-year maximum; a new epic after Acceptance; optional OAuth sign-in for MCP connectors; agent access off by default.

## Not done

Amendment 1.3 has not been independently reviewed. Nothing in it is built.

## After the review of Epic 11 (2026-11-19)

A BMAD review of Epic 11 and story 1.19 (`review-epic-11.md` in the epics workspace) led Kevin to approve three further rules, written into FR-73 and FR-75 the same day: an administrator's token reaches only projects the administrator is a member of; creating a project and downloading a portable backup are refused to tokens; and an agent's change to a verified device clears its verified state.
