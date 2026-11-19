---
title: "Review of Epic 11 and story 1.19 (agent access)"
date: 2026-11-19
method: BMAD Review (bmad-review), adversarial and edge-case-hunter lenses, each run by an independent agent
content: "Epic 11 (stories 11.1 to 11.8) and story 1.19 of epics draft 0.7, with PRD FR-73 to FR-78, AD-12, AD-20, AD-22 and the standing rules as context"
status: rounds one and two applied on 2026-11-19 on Kevin's instruction
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
- **New choices:** CG-10 to CG-26. Those whose values came from this review's fixes are marked as Kevin's. CG-13, CG-15, CG-16, CG-19 and CG-26 carried figures Claude chose while applying, and were open until Kevin ruled on them later that day (CG-16 changed: see the note at the end).
- **Checks:** the assembler reports 0 problems (175 stories, 2,323 criteria), and tracking was regenerated.

The revised stories have not been reviewed again.

## Second round (2026-11-19)

**What was reviewed.** All of the day's agent-access and external-ticket material, as applied after round one:

- PRD FR-73 to FR-78, NFR-5 and SM-7;
- AD-22;
- UX sections 18 and 19;
- standing rules 2 and 12;
- story 1.1, story 1.3, story 1.8, story 1.19 and story 6.20;
- all of Epic 11.

**Lenses.** The same two lenses ran again, each by an independent agent, and were told not to repeat round-one findings unless the fix was missing or wrong:

- adversarial: 33 findings, numbered B1 to B33;
- edge-case hunter: 30 findings, numbered F1 to F30.

**Status:** recorded; not yet applied.

### Contradictions and gaps between documents

| # | Finding | Fix |
| --- | --- | --- |
| B1 | Story 1.19's Notes say story 1.1 declares route classes, but story 1.1 declares only schemas. Story 1.8 lists six classes and leaves out update secret. | Story 1.8 introduces the classes and lists all seven. An update-secret route gets its class when Epic 9 builds it. Correct the Notes. |
| B2 | A token on an administrator-only route gets "administrators only" in AD-22 but "needs a person" in FR-75. | Use "needs a person" everywhere, with a criterion in story 1.19. |
| B3 | An administrator's token reaches only member projects, but administrators work without membership. It is unstated how an administrator becomes a member, or what the project list returns to that token. | The project list returns only member projects to an administrator's token. An administrator adds themselves through Projects, like anyone else. |
| B4 | The "agent change clears verified" rule lives only in Epic 11, yet tokens work from Epic 2 on. | Move it to standing rule 2, so every device-changing route follows it from the start. Story 11.2 only rechecks it. |
| B5 | A direct edit clears verified, while an import row goes to Needs review. "Placement or specification" is undefined. | FR-75 states both behaviours, and that any field of the device counts. |
| B12, F28 | Entered text is defined as text from outside the members, yet member-typed tickets are listed. FR-75, rule 12 and AD-22 list different sources. | One definition, shared by all three: text whose source is not a member of the project (reviewer links, imports, file names, PDF text), plus anything an agent added. A ticket a member types is the member's own text. |
| B22 | FR-77's download of existing packages has no story. | Add to story 11.2: a read-only token lists and downloads an existing package, and a portable backup stays refused. |
| B25 | The breaking-change check starts only in Epic 11, after releases have already shipped. | Start it with the first release (Epic 9's release story), covering token-callable routes. |
| B26 | FR-78's Check searches for a ticket on a visit and expects to find the issue. FR-78 says "filtered", but the story has only search. | Searching an issue's tickets also covers its visits' tickets. Remove "filtered", and correct the Check. |
| B32 | The refusal message says only `https://`, although `http` is accepted. | Reword it to "Enter a web address starting with https:// or http://". |
| B33 | SM-7 doesn't say who submits the revision for review, or whether the approver can be the same person. | An agent may request a review. The assignee must be a person, and the approval follows story 4.8's rules. Story 11.8 names the submitter and the approver. |

### Tokens

| # | Finding | Fix |
| --- | --- | --- |
| F14 | It's unstated whether a reactivated account's old tokens work again. | Deactivation revokes every token of the account, and the tokens stay revoked. |
| F15 | It's unstated whether removal from a chosen project and a later re-add restores the token. | Removal drops that project from the token's list. |
| F13, B21 | The 10-token cap, OAuth tokens and refresh grants interact undefined. | "Active" means not expired and not revoked. One connector grant is one listed token and counts toward the cap. A refresh rotates the value without adding a list entry. The consent page asks for an expiry, with 90 days by default. |
| F16 | A new maximum can put expiries in the past, or fall below the 90-day default. | Those tokens expire at once and are logged. The Create default is the lesser of 90 days and the maximum. |
| F18 | Recovery doesn't say what happens to refresh grants. | Recovery also ends every refresh grant. Revoked tokens stay listed. |
| F22 | An operation identifier reused with a different payload is undefined, and identifiers are kept forever. | Refuse a reused identifier with a different payload. Keep identifiers for 24 hours per token. |
| F17, B18 | Per-address limits behind NAT or a reverse proxy can block every agent. | Count only refused requests per address. Self-hosted installs take the client address from `X-Forwarded-For` only from configured proxies, and the instructions explain this, with a test behind a proxy. |
| B19 | Every token request loads the installation object. | Keep rate counters in memory, write last use at most once a minute, and run a cheap per-address check before the lookup. Load-check this in R18. |

### MCP endpoint and tool calls

| # | Finding | Fix |
| --- | --- | --- |
| B7, F21 | A tool's internal calls can cross the rate limit part-way, which breaks "all or nothing". | Charge a tool's whole cost before it runs, and refuse with 429 if it won't fit. Never interrupt an operation once it has started. |
| B8 | Grouping tools above 60 can mix read and draft actions and changes names between releases. MCP tools aren't version-checked. | Group only routes of the same class, by a fixed rule declared per route. The breaking-change check covers tool names, inputs and actions. |
| B9 | Roles are per project, so "a Viewer's token" is undefined. | The tool list shows draft tools if the owner is an Editor on at least one project in the token's scope. Each call is still decided per project. Test with an owner who has mixed roles. |
| B10, F27 | The `Origin` refusal and the any-origin CORS rule contradict each other. | `/mcp` refuses a foreign or `null` Origin only when there is no valid bearer token. CORS for any origin applies to token requests. Test both. |
| B11 | The order of refusals is undefined. | 405, then Origin 403, then access-off 403, then 401, then protocol 400. |
| B6, F19, F20 | Undo of an agent operation is undefined: who can undo, whether it overwrites later edits, and whether it brings back verified. | Undo is person-only. It is refused, with a list of the conflicting items, if people changed any of them since. It never restores verified. |
| B14 | Marking in a tool result's plain text can be forged by text that contains the marker. | The text form is JSON-serialised (value, source, reference). A contract test uses text that contains the marker syntax. |
| B13 | The marking is declared per field, but its source varies per value. A member's edit and an applied import are undefined. | The entered-text type is a per-value wrapper with a source, which can be "member". Any edit by a member re-sources the value to that member. Applying an import keeps "import", as a stated exception to CG-21. |
| F30 | References don't survive removal of the upload, restore or backup. | The source and reference survive restore and backup, and stay valid as text after the upload is removed. |
| B23 | Deletions aren't person-only, and some can't be undone. | Deletions made with a token are soft and can be reversed by a person. Permanently removing files or projects is person-only. |
| B24 | Standing rule 2 doesn't test administrator-only routes, reviewer-link routes or Viewer tokens. | Extend rule 2 to cover each of them. |

### Uploads and jobs

| # | Finding | Fix |
| --- | --- | --- |
| B15, F25 | The upload address's authentication, lifetime and binding are unstated. | A single-use, unguessable address scoped to its path, valid for 10 minutes and bound to the token and project. It is kept out of logs, re-checks the token and the switch when used, counts against the rate limit, and is refused by its declared length before the body is read. |
| F26 | Apply after the upload is removed has no reason code. | Reason code "upload gone". |
| B16 | A 25 MiB workbook can exceed memory before the row limit is checked. | R17 also measures a worst-case 25 MiB workbook. Refuse by uncompressed size before parsing, and lower the limit if R17 requires it. |
| B17 | Half of the configured limit is undefined on a self-hosted install, and story 11.3 can't be accepted before R17. | Self-hosted uses the shipped container limits, set equal to Cloudflare's. Story 11.3 writes both branches (route and job) as criteria. |
| F23 | A job loses its identifier on restart, and nothing bounds its lifetime. | Keep the job identifier through a restart. A job is given up after 1 hour, and results are kept 24 hours. |
| F24 | One agent can start unlimited jobs. | At most 3 running jobs per token and 5 per person. |

### External tickets (story 6.20)

| # | Finding | Fix |
| --- | --- | --- |
| F1 | A concurrent edit and removal of the same ticket is undefined. | A change or removal of a ticket that changed since it was read is refused with "changed since". |
| F2, B27 | The same number twice on one record, and a re-add after removal, are undefined. | Refuse a number already on the record. A re-add is a new entry in the history. |
| F3, B27 | Matching ignores case and whitespace inconsistently. | Store as typed, but match on a trimmed, case-insensitive key for search, "also on" and duplicates. A number of whitespace only is refused. |
| F4, F6, B28 | "Also on" crosses project boundaries and appears in packages. | Limit "also on" to the same project. Exports and packages never show it. |
| F5 | "Also on" can point to an archived or deleted record. | Leave deleted records out, and label archived ones. |
| F7, F8 | Link validation is loose: case, whitespace, an empty host, IDN. | Trim the link. Compare the scheme case-insensitively. Require a host. Refuse control characters. Count characters after punycode, and show the host beside the link. |
| B30 | A link can carry credentials. | Refuse links with user information. The Add form warns that a link may carry the tracker's own access. NFR-5 gains a sentence. |
| B29 | Opening a link can leak the project's address and looks trusted. | Open with `noopener` and no referrer. Show the host, and show "via agent" on entries an agent added. |
| F9 | A CSV export allows formula injection, and several tickets in one cell can't be separated. | Neutralise cells starting with `=`, `+`, `-` or `@`. Separate tickets with "; ". |
| F10, B31 | Offline use of the field shell is undefined. | Ticket changes queue like other field edits. A queued change refused on sync (fixed record, duplicate) is shown to the technician. |
| F11 | Ticket changes after closeout are undefined. | The live record accepts them, and the fixed closeout copy never changes. |
| F12 | A restore can bring in invalid links. | Links are validated on restore, and "also on" is recomputed. |

## Recommendation for round two

Apply every fix above. Seven of them are new rules, not clarifications, and each is recommended:

1. Deactivation revokes tokens permanently (F14).
2. Removal from a project drops it from a token's chosen list (F15).
3. Undo of an agent operation is person-only and never brings back verified (B6).
4. Permanent deletion of files or projects is person-only; deletions by a token can be reversed by a person (B23).
5. An agent may request a review; the assignee is a person (B33).
6. "Also on" is limited to the same project and never appears in exports or packages (F4, F6, B28).
7. Links that carry credentials are refused (B30).

### Round two applied (2026-11-19)

Kevin asked for every round-two fix to be applied, including the seven rules. These became:

- CG-27 to CG-31 (tokens, undo, deletion, review requests);
- CE-48 and CE-49 (external tickets).

The new values are CG-32 to CG-36. CG-36 (client registration limits) carries figures Claude chose while applying and is open.

**Where the fixes went:**
- **PRD:** FR-73, FR-75, FR-78 and NFR-5 (amendments 1.3 and 1.4).
- **Architecture:** AD-22 gains a second list of refinements, the external-ticket link rules and the OAuth registration method.
- **UX:** sections 18 and 19.
- **Epics:**
  - standing rules 2 and 12;
  - story 1.1 (an entered-text wrapper for each value);
  - story 1.8 (seven route classes);
  - story 1.19 (deactivation, removal, caps, the new maximum, recovery, operation identifiers, limits per address and proxy addresses);
  - story 6.20, rewritten;
  - story 9.2 (the breaking-change check from the first release);
  - every Epic 11 story.

The assembler reports 0 problems: 175 stories and 2,355 criteria. Tracking was regenerated.

The material has not been reviewed a third time.

## Later changes (2026-11-19)

The figures in this record are those of the day each round was written. After both rounds, two things changed:
- **CG-16 (E13, E14, B16):** Kevin changed the agent upload limit from 25 MiB to 10 MiB. CodeRabbit's review of pull request 3 then found that people's own 5,000-row limit (CE-01) must apply to agents too. The 25 MiB and the agent-only row limit above are superseded.
- **CG-35 (B11):** CodeRabbit's review also found that refusing a foreign `Origin` first blocked browser clients' preflight and OAuth sign-in discovery, so that step was removed from the refusal order.
