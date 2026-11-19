---
title: "Review of Epic 11 and story 1.19 (agent access)"
date: 2026-11-19
method: BMAD Review (bmad-review), adversarial and edge-case-hunter lenses, each run by an independent agent
content: "Epic 11 (stories 11.1 to 11.8) and story 1.19 of epics draft 0.7, with PRD FR-73 to FR-78, AD-12, AD-20, AD-22 and the standing rules as context"
status: all findings applied on 2026-11-19 on Kevin's instruction
---

# Review of Epic 11 and story 1.19

Kevin asked for BMAD to test the new Epic 11. Nothing is built, so there is no code to test. BMAD's equivalent for a plan is `bmad-review`.

Two lenses ran, each by an independent agent:
- **adversarial:** 28 findings, numbered A1 to A28;
- **edge-case hunter:** 37 findings, numbered E1 to E37.

The verification-gap lens applies only to code, and the editorial lenses were not asked for. Overlap between the two lenses is noted in the "Also" column and is kept on purpose.

## Findings by theme

### 1. Acceptance steps that cannot be run as written

| # | Finding | Fix | Also |
| --- | --- | --- | --- |
| A1 | **The approve refusal can't be reached over MCP.** Story 11.8 and R18 expect an MCP agent's approve attempt to be refused. But person-only routes are left out of the tool list, so no approve tool exists. | Say the attempt is made over the HTTP API with the same token and expects "needs a person". Over MCP, a call to an unlisted tool gets an unknown-tool error. | |
| A2 | **The contract test can't catch removed fields.** It compares the server with a description built from the same declarations, so a removed or renamed field passes. | Continuous integration keeps the last release's description as a snapshot. A build that removes or renames a field, or narrows a type, fails, and a test seeds a rename to prove it. | E35 |
| A4 | **Spreadsheets can't travel as MCP tool arguments.** An MCP agent can't practically send an Excel or large CSV file inside a tool call, yet story 11.8 imports one. | Add an upload route that returns a file id. Specify how an MCP client gets a file to it, set a size limit per host, and test an end-to-end Excel import over MCP. | E13 |
| A22 | **FR-76's Check isn't shown on deployed installs.** It needs the API description to match the server on both hosts, but the contract test runs only in continuous integration. | Run the contract test against both deployed installations in R18 or story 11.8, and keep the result. | |
| A23 | **Agent attribution can be lost in exports.** FR-74's Check needs "via agent" in exports and in review and field records, but standing rule 2 only requires `via` to be recorded. | Extend standing rule 2: wherever a story shows or exports an actor, it shows "via agent". Add an export check to story 11.8. | |
| A28 | **SM-7's place and story 1.19's prerequisites are unstated.** It isn't said whether SM-7 is part of the proof of concept's acceptance. Story 1.19 also relies on Administration screens without naming the stories that build them. | The PRD already puts SM-7 outside the SM-1–6 run, so state that in Epic 10. In story 1.19, name stories 1.10 and 1.14. | |

### 2. MCP protocol and transport

| # | Finding | Fix | Also |
| --- | --- | --- | --- |
| A5 | **"The corresponding API calls" could mean HTTP calls to itself.** That fails on a private network, where the container can't resolve its own address, and counts calls twice. | Tool calls run in the same process, through the same gate and handlers. Add a test on a self-hosted install whose own address doesn't resolve. | |
| A6 | **The sign-in discovery MCP clients expect isn't specified.** Clients expect a 401 with `WWW-Authenticate` and the OAuth metadata documents (RFC 9728 and RFC 8414). | Story 11.2 gives a 401 with `WWW-Authenticate: Bearer`. Story 11.7 lists the discovery documents, PKCE S256, registration, exact redirect matching, the refresh lifetime and the `resource` parameter. | E18 |
| A8 | **Several transport details are undefined.** These are the protocol version header, the reply to GET and DELETE, session ids, the reply type, and the spec's `Origin` check. | List the supported protocol versions; an unsupported one gets 400. GET and DELETE get 405. Issue no session id. Reply in JSON. Refuse a disallowed `Origin` with 403 (DNS-rebinding protection). | |
| A9 | **Tool count and names are unbounded.** One tool per route could give over 100 tools, longer names than clients accept, and a large load on the agent's context. | Set a naming rule with at most 64 characters and a target tool count, grouping tools if it's exceeded. Record the count. | |
| A19 | **The update reply is unclear.** The 503 doesn't name its retry header, and the MCP form isn't specified. | The API replies 503 with `Retry-After` and reason `updating`. MCP gives a tool result with `isError`, reason `updating` and `retryAfter`. | |
| A24 | **"Agent access off" isn't testable as worded.** "Refuses every connection" has no meaning over stateless HTTP. | Give the status (403) and the reason code. Decide whether the public description is served while access is off, and whether it hides the version. | |
| A25, E36 | **Viewers get draft tools that can't work.** A Viewer's read-and-draft token lists draft tools that always fail. | The tool list follows the token kind and the owner's current role. | |
| A26 | **Interoperability is tested with one client only.** | Name the MCP protocol revisions supported, and record a second client, such as the MCP Inspector. | |
| A27 | **CORS is unstated.** | The description allows any origin. Token routes allow any origin without credentials. Cookie routes allow the same origin only. | |
| E1 | **A tool call can fail part-way.** A tool that makes several calls can fail after some have succeeded. | Each tool is one operation, or its reply lists the steps done and the reason for the one that failed. | |

### 3. Tokens

| # | Finding | Fix | Also |
| --- | --- | --- | --- |
| A10 | **The token hash isn't named.** Reusing scrypt would add about 0.4 s to every call. | Store SHA-256 of the token, look it up by that hash, and compare in constant time. Password hashing isn't used. | |
| A11 | **Tokens could leak through URLs and logs.** | Accept a token only in the `Authorization` header. A `ssat_` value in a query string is refused and never logged. | |
| A12, E23 | **"All of my projects" is undefined, and an administrator's token reaches everything.** | "All" means current membership, checked on each request. An administrator's token reaches only projects they're a member of. State whether a token may create a project. | |
| A13, E26 | **Turning access back on could revive revoked tokens.** | It restores tokens that are neither expired nor revoked. | |
| A13, E27 | **Lowering the maximum lifetime leaves longer tokens alone.** | Existing expiries are shortened to the new maximum, counted from creation, and the change is logged. | |
| E25 | **Owners can't reach their tokens while access is off.** The Access tokens page is hidden then, so an owner can't revoke a leaked token. | Keep the token list and Revoke available to owners while access is off. | |
| E28 | **An expiry can be set in the past.** | Refuse an expiry that is not later than now. | |
| E29 | **Nothing produces the expiry log entry.** | Log the expiry from an alarm at the expiry time. | |
| E30 | **Installation recovery could bring back revoked tokens.** | State that recovery keeps revoked tokens revoked (or revokes every token). | |
| E31 | **The gate's answer for a token is undefined on three route classes.** These are public, reviewer link and update secret. | Define each case: public accepts and ignores the token; reviewer link and update secret refuse it. | |
| E32, A20 | **Bad tokens aren't throttled.** Unknown or malformed tokens get no rate limit, and the limit is per token, so it multiplies with more tokens. | Refuse an unknown token with one reason code, and rate-limit failures per address. Add a cap per owner. Count calls made inside a tool call. Return 429 with `Retry-After`. | E33 |
| E34 | **Public routes have no rate limit.** These are the description and the OAuth routes. | Rate-limit them per address. | |

### 4. Jobs, retries and conflicts

| # | Finding | Fix | Also |
| --- | --- | --- | --- |
| E2, E3 | **Retried agent writes can make duplicates.** | Every draft change from a token carries an AD-5 operation identifier, scoped to the token. | |
| E4 | **Agents get no usable conflict reply.** | On a conflict, return a reason code with the current version and value, and overwrite nothing. | |
| E5, E6, E37 | **A job keeps running after access ends.** This covers revocation, expiry, access turned off, and the owner losing access while a job runs. | Re-check the token and the owner's access at each job step and when the result is fetched. | |
| E7 | **Anyone could fetch a job's result.** | Only the token that started the job, or its owner, may fetch the result, gated like a read. | |
| E8 | **A job's target can be deleted or archived mid-job.** | The job checks its target at each step and ends with a reason code if it's gone. | |
| E9 | **An update can land mid-job.** | Record the code version in the job, and restart it or mark it out of date when the version changes. | |
| A18 | **R17's "limit" is undefined.** | Record CPU time, wall time and peak memory with the configured limit. "Fits" means at most 50% of the limit. Tell the agent to poll for the result and suggest a wait. | |
| A17 | **"Equal figures" may fail across engines.** Different JavaScript engines can give slightly different maths results. | Counts and categories must be exact. Areas and percentages must agree within a stated tolerance. | |

### 5. Import by agents

| # | Finding | Fix | Also |
| --- | --- | --- | --- |
| E10 | **The project can change between preview and apply.** | Apply checks the preview's fingerprint and refuses if it's out of date. | |
| E11 | **Some rows can fail on apply.** | Apply is one operation, or it lists the rows applied and the rows refused, with reasons. | |
| E12 | **Upload and preview have no route class.** | They're draft-change routes, so a read-only token is refused. | |
| E13, E14 | **Uploads have no limits.** Upload size and the time an unapplied upload is kept are unset, and there's no row maximum. | State the limits. An unapplied upload expires, and more than 5,000 rows is refused with a reason. | A4 |
| A16 | **An agent's Changed row can overwrite a verified device and keep it verified.** | A Changed row applied by an agent to a verified device goes to Needs review. | |

### 6. Text from outside and prompt injection

| # | Finding | Fix | Also |
| --- | --- | --- | --- |
| A3 | **Marking entered text in Epic 11 would break `/api/v1/` after release.** It changes reply shapes built in Epics 4 and 7. | Put the entered-text field type into the route declarations in story 1.1, and make the stories that add outside text use it. Story 11.5 then only checks and documents it. | |
| A14, E16 | **Only two outside sources are marked, and the marking has no defined shape.** Others include imported values after they're applied, file names, PDF text, external tickets, project names and user names. | Define the marked shape: text, source and reference. Keep the marking on imported values after they're applied. List the field types in the declarations. Show the marking in MCP structured content. | |
| E15 | **A member can copy outside text into an unmarked field.** | State that text copied by a member becomes that member's text (the member is accountable). | |
| E17 | **A refusal could echo entered text back unmarked.** | A refusal names the field but never repeats an entered value. | |
| A15 | **Nothing limits what an injected agent can do.** It could mass-delete, edit verified devices, or download portable backups. | A person can reverse a token's bulk change as one grouped action. An agent's change to a verified device clears verified. Downloading a portable backup is person-only. | |
| A7 | **The OAuth consent page can be spoofed.** It shows only the name the client gives itself. | Show the redirect host prominently and mark the name as self-declared. Require the second sign-in step. Bind each token to its client. | |
| E18 to E22 | **OAuth has more gaps.** PKCE and redirect matching; denied consent or access changed during consent; refresh tokens, and revoking them with the access token; and a person without two-step verification or with no projects. | Require each, and re-check the switch and the account when consent is given. | A6 |

## Recommendation

Apply every finding, using the fixes above, with one change: for A3, add the entered-text field type to the route declarations in story 1.1 now, because it affects how every later story declares replies.

**Choices for Kevin.** Three fixes change behaviour that Kevin has not decided:
- an administrator's token reaches only the projects that administrator is a member of (A12);
- downloading a portable backup is person-only (A15);
- an agent's change to a verified device clears its verified state, or sends it to Needs review (A15, A16).

Each closes a route for a stolen or misled token, and is recommended.

## Applied (2026-11-19)

Kevin asked for every finding to be applied, including the three choices, which became CG-10 to CG-12.

- **Story 1.1:** gained the entered-text field type (A3).
- **Story 1.19** (part id 1.10e) was rewritten. Its changes cover:
  - the token hash and header-only tokens;
  - "all of my projects", and administrator tokens;
  - Viewers' tokens;
  - the answer on every route class;
  - operation identifiers;
  - revocation while agent access is off;
  - restoring tokens;
  - expiry checks and the expiry log entry;
  - the maximum lifetime;
  - recovery;
  - rate limits per token, per owner and per address;
  - the stories it builds on.
- **Epic 11:** every story was rewritten for its findings. Story 11.5 now checks entered text rather than introducing it.
- **Standing rules:**
  - rule 2 now covers showing "via agent" in exports, and adds project creation and portable backup download as person-only;
  - new rule 12 covers entered text.
- **Epic 10's introduction:** states that SM-7 is outside its acceptance.
- **Other documents:**
  - PRD: FR-73 and FR-75;
  - architecture: AD-22, with a list of refinements and the OAuth details;
  - UX: section 18 (token list while access is off, and the consent page).
- **New choices:** CG-10 to CG-26. Those whose values came from this review's fixes are marked as Kevin's. CG-13, CG-15, CG-16, CG-19 and CG-26 carry figures Claude chose while applying, and are open.
- **Checks:** the assembler reports 0 problems (175 stories, 2,323 criteria), and tracking was regenerated.

The revised stories have not been reviewed again.
