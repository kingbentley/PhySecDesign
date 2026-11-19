---
title: "Sprint change proposal: AI agents can use Site Studio"
date: 2026-11-19
workflow: BMAD Correct Course (bmad-correct-course), batch mode
status: approved by Kevin on 2026-11-19, with Claude's recommendations for D1 to D5
inputs: "final PRD 1.2; UX 0.5; architecture 3.0; epics draft 0.7"
---

# Sprint change proposal: AI agents can use Site Studio

Nothing in this proposal is built. It changes plans only, and only once Kevin approves it.

## 1. Issue summary

**Trigger.** On 2026-11-19, before story 1.1 started, Kevin asked that AI agents be able to use Site Studio. He wants the hooks and interfaces placed in the right parts of the app. This must work whether Site Studio runs on Cloudflare or on a server inside an organisation's private network.

**Kind of change.** A new requirement from the product owner. No story revealed it, because none has been built.

**Problem.** The current plans keep agents out:

- PRD 1.2 has no requirement for machine or agent access. The words "API" and "integration" appear only for map keys and for camera alarm interfaces.
- AD-12 and story 1.3 identify a caller only by a browser session cookie or a reviewer link. A change is refused unless it comes from the app's own page and carries the header the app adds.
- AD-9, AD-10 and AD-11 put coverage analysis, spreadsheet parsing and PDF package generation in the browser only. A program that is not a browser cannot get a coverage result or import an inventory.
- The actor recorded on an action (AD-5, story 1.8) is always the signed-in person, so the records could not show that an agent made a change.

**Kevin's direction (2026-11-19, answers to four questions; each was Claude's recommendation):**

1. **Outside agents.** AI agents, such as Claude, work in Site Studio on a person's behalf, using that person's access. No AI assistant is built into the app.
2. **Agents draft, people decide.** Agents may read and search, place and edit equipment, import inventories, run coverage and draft revisions. Only a person may approve, issue, close out, bypass or record a field result.
3. **API and MCP.** There is one documented HTTP API with per-person access tokens, and the app itself uses it too. The same server also offers an MCP endpoint built on that API.
4. **Access now, tools later.** Before story 1.1, settle the token model, how agent actions are recorded, and how routes are declared, so nothing is rebuilt later. The agent tools and the MCP endpoint come as a new epic.

**Kevin's added condition.** All of this must work for an installation on Cloudflare and for one hosted on an intranet.

## 2. What "both hosts" means for agents

| | On Cloudflare | Self-hosted on an intranet |
| --- | --- | --- |
| Where the API and MCP endpoint run | In the installation's own Worker, at its own address | In the same Worker build under `workerd` in Docker, at the intranet address |
| Outside services needed | None | None. Tokens are checked by the installation itself. No identity provider, registry or AI service is called. |
| Agents that can connect | Any MCP or HTTP client that can reach the address, including cloud-hosted AI services | Agents running inside the network, such as Claude Code or Claude Desktop on a workstation, or an agent on an internal server. A cloud-hosted service cannot reach an intranet address, and that is a property of the network, not of Site Studio. |
| How an agent signs in | A personal access token sent as a bearer header | The same |
| HTTPS | Cloudflare's certificate | The organisation's certificate, often from a private certificate authority. The instructions say how to make an agent's machine trust it. |
| Optional sign-in by OAuth for connectors that require it (section 4, D4) | Useful, because cloud connectors can reach the installation | Works for local clients, but cloud connectors still cannot reach the intranet |

One rule keeps this true: **the agent interface uses only what AD-16 already allows on both hosts.** It is plain HTTP requests and replies on the same Worker. It does not use Cloudflare's Agents SDK, its hosted OAuth provider, or any binding that `workerd` offers only behind an experimental flag.

## 3. Impact analysis (checklist results)

### Section 1: trigger and context
- 1.1 Trigger: [N/A] No story revealed it; Kevin raised it as a new requirement.
- 1.2 Problem defined: [x] Section 1.
- 1.3 Evidence: [x] AD-12, AD-9 to AD-11, story 1.3 and story 1.8 as quoted in section 1.

### Section 2: epics
- 2.1 Epic 1 can still be completed as planned: [!] Yes, with additions to story 1.1, story 1.3, story 1.6, story 1.8 and story 1.14, plus one new story for access tokens.
- 2.2 Epic-level changes: [!] One new epic, Epic 11, "Work with AI agents".
- 2.3 Later epics: [!] Epics 2 to 9 are not rewritten. Standing rule 2 gains a line that applies to every story from Epic 2 on: each write route states whether an agent may use it. Stories that add a decision, issue, closeout or field result inherit "person only" from the rule, not from new criteria.
- 2.4 Obsolete epics: [N/A] None become obsolete.
- 2.5 Order: [x] Epics 1 to 10 stay in order. Epic 11 depends on Epics 1 to 8 and can be built any time after them. Its own last story is its acceptance check (D3).

### Section 3: artifacts
- 3.1 PRD: [!] Amendment 1.3: FR-73 to FR-77, an NFR-5 addition and SM-7 (section 5.1).
- 3.2 Architecture: [!] A new AD-22, "Agent access", plus changes to AD-12, AD-5, AD-9, AD-10, AD-16 and AD-17, and experiments R17 and R18 (section 5.2).
- 3.3 UX: [!] New screens: S-38 Access tokens (My account), S-39 Agent access (Administration Settings) and S-40 the token list in Administration Users. Activity and history show "via agent" (section 5.3). The design canvas needs these three screens.
- 3.4 Other: [!] The published instructions (story 9.1) gain the agent set-up for both hosts. Continuous integration gains a contract test that the published API description matches the server. The self-hosted smoke suite gains one token call and one MCP call.

### Section 4: path forward
- 4.1 Direct adjustment: **Viable.** Effort Medium, risk Low to Medium.
- 4.2 Rollback: [N/A] Nothing is built.
- 4.3 MVP review: **Not needed.** The proof of concept keeps its scope, and agent access is added beside it.
- 4.4 Chosen: Option 1, direct adjustment (section 4).

## 4. Recommended approach

**Direct adjustment in two parts.**

**Part A, before story 1.1 (small).** Four patterns go into Epic 1 so that every later route is born agent-ready:

1. **Routes are declared once.** Each route's input and reply are declared as a schema in `shared/`, and the API description and the MCP tool list are later generated from those declarations.
2. **One versioned API prefix and coded reasons.** Every route is under `/api/v1/`, and every refusal carries a machine-readable reason code as well as its wording.
3. **Every route carries a class.** Routes are public, reviewer-link, read, draft change, person only, or administrator only, and the gate decides from the class.
4. **The actor record has a "via" field.** It is empty for a person and names the token for an agent.

Add personal access tokens as a new story in Epic 1, so that from Epic 2 on each story can show that a token is refused on person-only routes.

**Part B, later (Epic 11).** This covers the generated API description, the MCP endpoint, coverage and import results available to agents, agent-facing documentation, optional OAuth, and an acceptance story.

**Why.**

- **Cost of doing it later.** Retrofitting tokens and route classes after Epics 2 to 8 would touch every route in about 150 stories. Settling them now costs one story and a few criteria.
- **One code path.** The browser app and agents use the same API, so there is one set of access rules and one set of tests.
- **Records stay honest.** The person-only class keeps SM-3's honest outcomes. An agent's change can never be what makes something verified, installed, tested, approved, issued or closed.
- **Both hosts.** It needs nothing beyond what AD-16 already allows, so it works on Cloudflare and on an intranet.

**Risks and how they are handled.**

| Risk | Handling |
| --- | --- |
| An agent misled by text it reads (prompt injection) acts with its person's rights | Tokens can be limited to reading, or to named projects. Person-only actions are refused. Every agent action is labelled and can be undone like any other (AD-7). Text from reviewer links and imports is returned to agents marked as entered text. |
| A stolen token | Shown once and stored only as a hash. Each token expires (D2). It is revoked by its owner or an administrator, and ended by deactivation. Calls are rate-limited per token. |
| Server-side coverage exceeds processing limits | Experiment R17 measures it on both hosts before Epic 11. If it fails, coverage for agents runs as a resumable job (AD-13 pattern). |
| Updates break agents | The `/api/v1/` contract is versioned. During an update an agent receives "503, try again" with a retry time, the machine form of standing rule 11. |

**Effort.** Part A is one new story and about 15 criteria added to five Epic 1 stories. Part B is a new epic of about 8 stories. **Timeline.** Story 1.1 is delayed only by the time it takes to approve this proposal and apply Part A to the documents.

### Choices for Kevin (each with Claude's recommendation)

| ID | Choice | Recommendation | Why |
| --- | --- | --- | --- |
| D1 | Token kinds | Two: read-only, and read and draft. Either can be limited to named projects. | Read-only covers reporting agents with no risk to records. |
| D2 | Token lifetime | Default 90 days, maximum 1 year, set by the owner when creating it. Administrators can lower the maximum. | Forces renewal of forgotten tokens without daily friction. |
| D3 | Where the new epic goes | Epic 11, after Acceptance, with its own acceptance story. Epics 1 to 10 keep their numbers. | Keeps the confirmed order and every existing story reference. |
| D4 | OAuth sign-in for MCP connectors that require it | A story in Epic 11, built last and optional. Tokens remain the main way in. | It matters only for cloud connectors, which cannot reach an intranet install anyway. |
| D5 | Agent access when an installation is first set up | Off. An administrator turns it on in Settings. | An installation's owner decides whether agents may connect at all. |

## 5. Detailed change proposals

### 5.1 PRD: amendment 1.3

Add a section "Agent access" after FR-72:

- **FR-73: Personal access tokens.** A signed-in person can create named access tokens for agents acting on their behalf, as read-only or read-and-draft, optionally limited to named projects, with an expiry. A token is shown once, can be listed and revoked by its owner and by an administrator, and never grants more than its owner's current role and membership. Deactivation, removal from a project or a role change takes effect on the token's next request.
- **FR-74: Actions by agents are recorded as such.** Every change made with a token is recorded under its owner, marked "via agent" with the token's name, in the change history, the activity log and exports. Administrators can filter by it.
- **FR-75: People decide.** An agent cannot approve or decide a review, bypass, issue or designate a design, close out or reopen a scope, or record a test outcome, an installed mark or a verified observation. It also cannot archive or un-archive, restore a revision or project, create reviewer links, or use any administration function. Such a request is refused with the reason "needs a person". An agent's change never by itself establishes a verified, installed, tested, approved, issued or closed state.
- **FR-76: API and MCP endpoint on every installation.** Every installation, on Cloudflare or self-hosted including on a private network, serves:
  - a documented, versioned HTTP API covering what the app does, other than the person-only actions, with a machine-readable description;
  - an MCP endpoint offering the same operations as tools.

  Neither depends on any service outside the installation. Agent access is off until an administrator turns it on.
- **FR-77: Agents get the same results as people.** Through the API, an agent can obtain coverage results and estimates calculated by the same rules as the app, and can preview and apply an inventory import through FR-58's groups. PDF packages are still generated in a browser, and agents can download packages that already exist.
- **NFR-5 addition.** Tokens are stored only as hashes, rate-limited per token, and never written to logs.
- **SM-7: An agent does real work.** On Cloudflare and on a self-hosted private-network install, an MCP client imports an inventory, places a camera, reads coverage and saves a named draft revision. A person then approves it. Any attempt by the agent to approve is refused.

### 5.2 Architecture 3.0 → 3.1

- **AD-22, Agent access (new).**
  - **Tokens.** A token is a random value prefixed `ssat_`, kept in the installation object as a hash with its owner, kind, project limit, expiry and last use.
  - **MCP endpoint.** `/mcp` speaks MCP's Streamable HTTP transport, statelessly, on the same Worker. Its tools are generated from the route declarations, and person-only and administrator routes are left out.
  - **API description.** `/api/v1/openapi.json` is generated from the same declarations.
  - **Rate limits.** A per-token limit is held in the installation object.
  - **Constraints.** No Agents SDK, no hosted OAuth provider and no new binding are used, so both hosts and an intranet are served identically.
  - **Text that came from others.** Text that came from reviewer links or imports is returned inside a field marked as entered text.
- **AD-12.**
  - The gate's first step gains a fourth caller kind: an access token, sent as `Authorization: Bearer`.
  - The origin-and-header rule applies to cookie sessions only. A bearer header is never sent by a browser on its own, so that rule is not needed for tokens.
  - Each route declares a class (public, reviewer link, read, draft change, person only, administrator only, update secret), and the gate decides from the class and the caller kind.
- **AD-5.** The actor is the account, its name at the time, and `via`, the token's identifier and name, or empty for a person.
- **AD-9 and AD-10.**
  - The coverage calculation and the spreadsheet parser live in `shared/` and run unchanged on the server for API callers. The browser path is unchanged.
  - If R17 shows a calculation can exceed the processing limit, it runs as a resumable job.
- **AD-16.** The interface table is unchanged. The rules gain this one: "The agent interface uses only what is listed here."
- **AD-17.** The installation object also holds tokens and the agent-access setting.
- **Experiments.**
  - **R17.** Run coverage at acceptance size, and parse a 5,000-row workbook, inside a request on Cloudflare and under `workerd`. Record the processing time against the limits.
  - **R18.** Connect Claude Code to the MCP endpoint on a Cloudflare test installation, and on a self-hosted install reachable only on a private network with a certificate from a private authority. List the tools, make a draft change, and confirm that a person-only call is refused.
- **Section 13.** Add K23: Kevin's four answers of 2026-11-19 and the intranet condition.

### 5.3 UX 0.5 → 0.6

- **S-38, My account → Access tokens.** Create a token (name, kind, projects, expiry) and see it shown once with a copy button. Also show the list with last use, and Revoke.
- **S-39, Administration → Settings → Agent access.** An on/off switch, the maximum token lifetime, and the endpoint addresses to give to an agent.
- **S-40, Administration → Users → a user's tokens.** List and revoke.
- **History, Activity and change lists.** Agent changes show the owner's name followed by "via agent ‹token name›", with a distinct shape and label (status language, UX section 6).

### 5.4 Epics draft 0.7 (edit the parts, reassemble; never edit `epics.md`)

**Standing rule 2, added sentence:**

> Every route declares its class. From Epic 2 on, each story's write routes are also called with a read-and-draft token and shown to succeed, unless the route is person only, in which case the token is refused with "needs a person". Every route is also called with a read-only token and shown to be refused.

**Story 1.1: run the app with a portable server core.** Add under Core behaviour:

- Every server route is under `/api/v1/` and declares its input and reply as a schema in the shared module. A request that does not match is refused with the field named.
- Every refusal carries a reason code as well as its wording.

**Story 1.3: sign in and sign out.** Changed criterion:

- OLD: A request that changes anything is refused unless it comes from the app's own origin and carries the header the app adds.
- NEW: A request that changes anything with a session cookie is refused unless it comes from the app's own origin and carries the header the app adds.

**Story 1.8: project membership and the access gate.**

- Changed criterion:
  - OLD: A test route not marked public, reviewer-link, signed-in or administrator-only is refused.
  - NEW: A test route that declares no class (public, reviewer link, read, draft change, person only, administrator only) is refused.
- Added criterion: the actor record carries a `via` field, empty for a signed-in person.

**New story 1.19: Personal access tokens (FR-73, FR-74, AD-22; screens S-38 to S-40).**

- Create, show once, list and revoke tokens, and the agent-access switch (off by default, D5).
- The two token kinds and the project limit, with expiry (D1, D2).
- The gate's token cases:
  - a token is never more than its owner;
  - deactivation and role changes take effect on the next call;
  - an administrator route is refused to a token;
  - a person-only test route is refused with "needs a person".
- Rate limits.
- No token appears in any log.
- Activity entries for each token event.

**Story 1.14: activity log.** Add one criterion: entries made with a token show "via agent ‹name›", and the log can be filtered by it.

**New Epic 11: Work with AI agents.** Depends on Epics 1 to 8. Draft stories:

| Story | Title | What it delivers |
| --- | --- | --- |
| 11.1 | API description | Generated `openapi.json`, a contract test in continuous integration, and a published reference |
| 11.2 | MCP endpoint | `/mcp`, with tools generated from route declarations. Person-only and administrator routes are left out. |
| 11.3 | Experiment R17, then coverage and estimates for agents | Server-side results from the shared module, as a job if R17 requires it |
| 11.4 | Inventory import for agents | Preview and apply through FR-58's groups |
| 11.5 | Text from others is marked | Reviewer-link and imported text is marked as entered text in replies |
| 11.6 | Experiment R18 and agent set-up instructions | Both hosts, including an intranet with a private certificate authority |
| 11.7 | OAuth sign-in for MCP connectors | Optional (D4) |
| 11.8 | Acceptance: SM-7 on both hosts | |

Also:

- Add choice IDs for D1, D2 and D5 under a new letter, CG.
- Regenerate `sprint-status.yaml` with `bmad-sprint-planning`.

## 6. Implementation handoff

**Scope: Moderate.** It adds requirements, one AD, one epic and one story in Epic 1, and does not replan the epics.

| Who | Does | Done when |
| --- | --- | --- |
| Kevin | Approves this proposal and rules on D1 to D5 | Approval recorded here |
| Claude, as PM (`bmad-prd`, edit) | Writes amendment 1.3 | FR-73 to FR-77, NFR-5 and SM-7 are in the PRD and reviewed |
| Claude, as Architect | Writes architecture 3.1 (AD-22, the AD changes, R17, R18, K23) | Consistent with amendment 1.3 |
| Claude, as UX | Writes UX 0.6 section for S-38 to S-40 | Screens specified; the canvas updated or marked to-do |
| Claude, as PO (`bmad-create-epics-and-stories`, edit) | Edits the parts, reassembles, regenerates sprint tracking | 0 problems from the assembler; tracking in sync |
| Readiness gate (`bmad-check-implementation-readiness`) | Runs a fourth time | Nothing blocks story 1.1 |

**Then:** Kevin opens the pull request and story 1.1 starts, as already planned.

## 7. Applied (2026-11-19)

Kevin approved this proposal on 2026-11-19 with the recommendations for D1 to D5. Applied the same day:

- **PRD.** Amendment 1.3 is in `prd.md`, with its record in `amendment-1.3-status.md`. The earlier text is kept in `sources/pre-amendment-1.3/`.
- **Architecture 3.1.** AD-22 and the K23 row were added; AD-5, AD-9, AD-10, AD-12, AD-16 and AD-17 were amended; R17 and R18 were added; and sections 10, 11, 14 and 15 and the diagram were updated.
- **UX 0.6.** Section 18 specifies S-38 to S-40, and `design-canvas.md` lists those screens as not yet drawn.
- **Epics.**
  - **Story changes.** Story 1.1, story 1.3, story 1.8 and story 1.14 gained their additions. The token story was added as story 1.19 (in section 5.4 it is "new story 1.19"), and Epic 11 has eight stories.
  - **Choices.** CG-01 to CG-03 are ruled by this approval; CG-04 to CG-09 are open.
  - **Rules and tooling.** Standing rule 2 covers tokens, and the assembler was extended to part G.
  - **Result.** The assembler reports 0 problems: 11 epics, 174 stories.
- **Tracking.** `sprint-status.yaml` was regenerated, and the fourth run of the readiness gate is recorded in `implementation-readiness.md`. The verdict is CONCERNS, with nothing blocking story 1.1.

**Not done.** An independent review of the new material, rulings on CG-04 to CG-09, drawing the three screens, and experiments R17 and R18.
