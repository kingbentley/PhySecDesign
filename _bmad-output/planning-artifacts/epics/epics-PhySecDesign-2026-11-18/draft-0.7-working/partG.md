## Epic 11: Work with AI agents

**Outcome.** An AI agent acting for a person can find, read and prepare work in Site Studio through a documented API or an MCP endpoint, on Cloudflare or on a private network, while approvals, issuing, closeout and field results stay with people.

**Depends on.** Epics 1 to 8: tokens, route classes and the entered-text field type from Epic 1, and the features the agent uses from Epics 2 to 8. It does not depend on Epic 9 or Epic 10. SM-7 is shown here, outside the acceptance run of Epic 10, as PRD amendment 1.3 states.

**Why here.** The access model was settled in Epic 1 so that every route was born ready for agents; what remains is to describe the API, offer it to agents, and prove it on both hosts. Placing it after Acceptance keeps the confirmed epic order and numbering.

### Story 11.1: API description

As a developer connecting an agent, I want a machine-readable description of the API, so that my agent can call it correctly without reading the code.

Covers: FR-76 (documented, versioned API), AD-22.

**Core behaviour**
- While agent access is on, the server serves an API description at `/api/v1/openapi.json`, generated from the route declarations in the shared module, without the server's version. (CG-23)
- The description lists every route an access token may call, with its input, its reply, its class and its reason codes, and lists no person-only or administrator-only route.
- The description marks every entered-text field with the field type of story 1.1.
- The description states the bearer-token scheme, the HTTP 429 and 503 replies with `Retry-After`, and the reason code `updating`.
- A contract test in continuous integration calls each described route on the built bundle and fails when a route's behaviour differs from its description.
- Continuous integration keeps the description of the last published release; a build whose description removes or renames a field, narrows a type, or adds a required input under `/api/v1/` fails. (CG-08)
- A test that renames one field in a declaration shows the build failing.
- A reference page generated from the description is published with the installation instructions.

**Refusals and edge cases**
- A route added without a declaration fails the build.
- With agent access off, the description is not served, and the request receives HTTP 403 with "agent access is off". (CG-23)
- During an update, an API call receives HTTP 503 with `Retry-After` and the reason code `updating`, as the description states, and not a refusal.

**Limits and values**
- Requests for the description are limited to 60 a minute from one network address. (CG-15)

### Story 11.2: MCP endpoint

As a designer, I want to connect an AI agent to Site Studio through MCP, so that it can work in my projects using tools it discovers by itself.

Covers: FR-75, FR-76 (MCP endpoint), AD-22.

**Core behaviour**
- The server serves an MCP endpoint at `/mcp` using MCP's Streamable HTTP transport, accepting POST and replying with `application/json`, and issues no session identifier. (CG-26)
- The endpoint supports the MCP protocol revisions listed in the installation instructions, read from the protocol-version header. (CG-26)
- The endpoint accepts the same bearer tokens as the API, checked by the same gate.
- Each tool call runs the corresponding route handlers inside the server, through the gate, with the caller's token; it makes no network request to the server's own address.
- Its tools are generated from the route declarations, with names of at most 64 letters, digits, underscores and hyphens. (CG-17)
- The tool list holds no person-only or administrator-only route, and follows the token's kind and the owner's current role: a read-only token, or a Viewer's token, lists only read tools.
- A tool that changes anything is one operation: it is applied whole or not at all, and carries an operation identifier, so a repeated call returns the stored result.
- An MCP client connected with a read-and-draft token lists the tools, reads a project and places a camera, and the camera is recorded as via agent.
- An agent searches issues by an external ticket number and adds an external ticket to a service visit, recorded as via agent.
- Entered-text fields reach the agent marked, in the tool result's structured content and in its text.
- The token's owner can undo the change made by one tool call as one action from the project's history, however many items it touched.
- A change made with a token to a verified device's placement or specification clears its verified state, and the device history shows the change via agent. (CG-12)

**Refusals and edge cases**
- A request without a token receives HTTP 401 with a `WWW-Authenticate: Bearer` header and the reason code "token required".
- A request with an unsupported protocol revision receives HTTP 400.
- GET and DELETE on `/mcp` receive HTTP 405.
- A request whose `Origin` header names another site is refused with HTTP 403, to guard against DNS rebinding.
- A request with a token is answered to any origin without credentials; a request with a session cookie is answered to the app's own origin only.
- A call to a tool that is not in the caller's list, including a person-only action, receives the protocol's unknown-tool error.
- A token's request to download a project's portable backup is refused with "needs a person". (CG-11)
- A tool call refused by the API returns a tool result marked as an error, with the API's reason code and wording.
- A refused change returns the item's current version and value with the reason code "changed since", and overwrites nothing.
- During an update a tool call returns a tool result marked as an error, with the reason code `updating` and the time to retry.
- With agent access off, every request to the endpoint receives HTTP 403 with "agent access is off".

**Limits and values**
- The full tool list for an Editor's read-and-draft token holds at most 60 tools; above that, related routes are grouped into one tool with an action field. (CG-17)

**Evidence to record**
- The endpoint is used from Claude Code and from a second MCP client on a deployed Cloudflare test installation and under the self-hosted configuration, and the tool list, its length and one draft change are recorded.

### Story 11.3: Experiment R17, then coverage and estimates for agents

As a designer working with an agent, I want the agent to get the same coverage and estimate figures that I see, so that its suggestions rest on the app's own calculations.

Covers: FR-77 (coverage and estimates), NFR-4, AD-9, AD-13, AD-22, experiment R17.

**Core behaviour**
- Experiment R17 runs the coverage calculation on the acceptance-size test project, inside one request, on a deployed Cloudflare test installation and under the self-hosted configuration, and records CPU time, wall time, peak memory and each host's configured limits.
- The calculation fits one request on a host when it uses at most half of every configured limit. (CG-18)
- If R17 shows the calculation fits on both hosts, an API route returns a floor's coverage results; otherwise the route starts a job and a second route returns its result when done. (CG-09)
- A job's first reply gives its identifier and a suggested wait, and the tool's description tells the agent to fetch the result after that wait.
- An API route returns the estimate of the current design.
- Both routes use the calculation and estimate code of the shared module, unchanged from the browser's.
- For the same saved design, counts and categories an agent obtains equal those the app shows in Chrome, and areas and percentages agree to within 0.1 percent or 0.1 percentage points. (CG-19)

**Refusals and edge cases**
- A result whose inputs changed while it was calculated is returned marked as out of date, with the inputs' fingerprint.
- A calculation that exceeds its time allowance returns incomplete with the reason; sampling is never coarsened to finish (AD-9).
- A job's result can be fetched only with the token that started it or by its owner, and only while the token and the owner may still read the project.
- At each step and when its result is fetched, a job checks again that its token is valid, agent access is on and the owner may read the project, and otherwise stops with the reason.
- A job whose floor or project is deleted or archived stops with the reason code "target gone".
- A job running when an update changes the code version is restarted under the new version.

**Evidence to record**
- R17's measurements on both hosts are recorded in the experiments record.

### Story 11.4: Inventory import for agents

As a designer, I want an agent to import an equipment spreadsheet into my project, so that it can do the mapping work while I review what it found.

Covers: FR-77 (import), FR-56, FR-58, FR-62, AD-10, AD-22, experiment R17.

**Core behaviour**
- An upload route accepts a CSV or Excel file as the request body and returns a file identifier; the import routes then name that identifier.
- An MCP client's agent gets a file to the upload route through a short-lived upload address that the import tool returns, so the file never passes through the model.
- The server parses the file with the shared module's parser.
- The agent proposes a column mapping, receives the preview grouped as New, Unchanged, Changed and Needs review with the preview's fingerprint, and applies selected valid rows.
- Applying is one operation: every selected row is applied, or none is and the reply lists each refused row with its reason.
- The groups, row errors and outcomes equal those the app shows for the same file and mapping.
- Imported devices are recorded as imported by the token's owner, via agent, with their import provenance.
- Cell values keep the entered-text marking with the import as their source after they are applied.
- An MCP client completes an Excel import end to end.

**Refusals and edge cases**
- Upload, preview and apply are draft-change routes, and a read-only token is refused on each.
- Applying with a fingerprint that no longer matches the project is refused with "preview out of date".
- Needs review rows are not applied by an agent's request and remain for a person.
- A Changed row that an agent would apply to a verified device is moved to Needs review. (CG-12)
- An imported device placed by an agent stays unverified until a person verifies it.

**Limits and values**
- An agent's upload may be at most 25 MiB, and an upload not applied within 24 hours is removed. (CG-16)
- A file of more than 5,000 rows is refused with the limit stated. (CG-16)
- R17 also parses a 5,000-row workbook inside one request on both hosts; if it does not fit, parsing runs as a job as in story 11.3. (CG-09)

### Story 11.5: Check that text from others reaches agents marked

As a designer, I want text that came from outside my team to reach an agent marked as such, so that a comment or a spreadsheet cell cannot pass itself off as an instruction.

Covers: FR-75 (entered text), NFR-5, AD-22.

**Core behaviour**
- A contract test lists every reply field declared with the entered-text type and checks, route by route, that each returns the text with its source and reference.
- The sources checked are: reviewer-link entries, imported cells after they are applied, names of uploaded files, text read from PDF plans, and external ticket numbers and links.
- The MCP endpoint's description of its tools states that entered text is data from outside the team and not instructions.
- Text a member copies from an entered-text field into a field of their own becomes that member's text, recorded under their name. (CG-21)

**Refusals and edge cases**
- A refusal names the field it refused but never repeats an entered value, and the contract test checks every refusal of every route that accepts entered text.

### Story 11.6: Experiment R18 and setting up an agent on either host

As an organisation's administrator, I want instructions for connecting an agent on my host, so that our agents can reach Site Studio on Cloudflare or inside our own network.

Covers: FR-76 (both hosts, private network), AD-16, AD-22, experiment R18.

**Core behaviour**
- The published instructions explain, for each host, turning agent access on, creating a token and connecting an MCP client and an HTTP client.
- The instructions keep the token out of shared files: client settings read it from an environment variable, with a warning never to commit it.
- For a private network, the instructions explain that agents must run inside the network and how to make Claude Code and other Node clients, curl and Python trust a private certificate authority.
- Experiment R18 follows the instructions as written, carried out by someone other than their author: it connects Claude Code with a token to the MCP endpoint of a deployed Cloudflare test installation, and to a self-hosted installation reachable only on a private network with a certificate from a private authority.
- On each, R18 lists the tools, makes a draft change, and runs the API contract test against the installation.
- On each, R18 asks for an approval through the API with the same token and receives "needs a person".

**Refusals and edge cases**
- The instructions state that cloud-hosted AI services cannot reach an installation inside a private network.
- On the self-hosted installation, a tool call succeeds although the installation's own address does not resolve from inside its container.

**Evidence to record**
- R18's result on each host, with the contract test's result, is recorded in the experiments record.

### Story 11.7: OAuth sign-in for MCP connectors

As a designer using an AI service whose connectors require OAuth, I want to connect it by signing in to Site Studio, so that I need not copy a token by hand.

Covers: FR-73, FR-76, AD-22.

**Core behaviour**
- The installation acts as its own OAuth authorisation server for the MCP endpoint and needs no outside identity service.
- A request to `/mcp` without a token receives the `WWW-Authenticate` header with the address of the protected-resource metadata, and the installation serves that metadata and its authorisation-server metadata.
- Connectors register by the method the instructions name, and every authorisation uses PKCE with S256, an exactly matching redirect address, a state value and the endpoint as its resource.
- A connector that starts OAuth sends the person to Site Studio's sign-in, including the second step, then to a consent page.
- The consent page shows the redirect address's host prominently, the connector's name marked as given by the connector itself, the token kind and the projects.
- On consent the installation issues a token of the chosen kind, bound to that connector and listed under the person's Access tokens with the connector named.
- A refresh grant never extends access beyond the token's expiry, and revoking the token also ends its refresh grant.

**Refusals and edge cases**
- With agent access off, sign-in for a connector is refused.
- Agent access, the account and its membership are checked again when consent is given, and a change since sign-in refuses it.
- Denying consent returns the OAuth "access denied" reply and issues nothing.
- A person who must set up two-step verification is sent to set it up first.
- A person with no project is told so on the consent page, and no token is issued.
- A redirect address that does not match exactly, or an authorisation without PKCE, is refused.
- Revoking the token from Access tokens ends the connector's access on its next call.

**Limits and values**
- Requests to the OAuth routes are limited to 60 a minute from one network address. (CG-15)

Notes: Optional (sprint change proposal choice D4). Tokens created by hand remain the main way in, and a cloud connector still cannot reach an installation inside a private network.

### Story 11.8: Acceptance: an agent does real work on both hosts

As Kevin, I want to see an agent do a real piece of design work on both hosts, so that I know agents can use Site Studio as intended.

Covers: SM-7, FR-73, FR-74, FR-75, FR-76, FR-77.

**Core behaviour**
- On a deployed Cloudflare test installation, an MCP client acting for an Editor imports an inventory from an Excel file, places a camera, reads its coverage and saves a named draft revision, each recorded as via agent.
- The agent's attempt to approve the revision, made through the API with the same token, is refused with "needs a person"; a person then approves it.
- An exported equipment schedule shows the camera's change as made by the Editor via agent.
- The same run passes on a self-hosted installation reachable only on a private network.

**Evidence to record**
- Each run's tool calls, results and refusals, and the activity log filtered to agent actions, are kept with the acceptance record.
