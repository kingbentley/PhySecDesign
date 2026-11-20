# Epic 1 Context: Install, sign in and manage people

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

An organisation can deploy Site Studio on Cloudflare, complete a protected one-time set-up, invite people, and control on the server who can see and change each project. Accounts come first because every later story needs to know who is acting and what they may do, so no temporary access scheme is built and thrown away. The epic also lays the server foundation every later epic stands on: one server build that runs on Cloudflare and under Cloudflare's open-source runtime (self-hosted), a version rule that makes future updates safe, declared routes with schemas and reason codes, and personal access tokens so AI agents can later act for a person within that person's access.

## Stories

- Story 1.1: Run the app on Cloudflare with a portable server core
- Story 1.2: Set up a new installation
- Story 1.3: Sign in and sign out
- Story 1.4: Invite a person
- Story 1.5: Two-step verification
- Story 1.6: My account and sessions
- Story 1.7: Projects list and creating a project
- Story 1.8: Project membership and the access gate
- Story 1.9: Installation roles, deactivation and the last administrator
- Story 1.10: Administration: users
- Story 1.11: Administration: reset links and two-step control
- Story 1.12: Administration: projects and members
- Story 1.13: Recovery when the only administrator is locked out
- Story 1.14: Activity log
- Story 1.15: Settings: installation, sign-in and maps
- Story 1.16: Require two-step verification for everyone
- Story 1.17: Optional email and forgotten passwords
- Story 1.18: Experiment R13: email by SMTP on both hosts
- Story 1.19: Personal access tokens for agents

## Requirements & Constraints

- **Two hosts, same product.** One installation per organisation, served over HTTPS, on Cloudflare (Workers Paid plan) or self-hosted; same features and rules on both. Two installations share no users, sessions, projects or files.
- **Set-up.** An installation with no users offers one protected set-up step (set-up code from the deploy output) creating the first administrator and naming the installation; it vanishes once an administrator exists.
- **Accounts.** Email + name + password; invitation only, no open registration; single-use expiring invitation and reset links that an administrator can always copy (email is optional, never required). Optional TOTP two-step verification with hashed single-use recovery codes; administrators can require it per user or for everyone. Sessions end after an idle period, on sign-out, sign-out-everywhere, password change and deactivation; pending page input survives re-sign-in by the same account only.
- **Roles.** Installation role Administrator or standard user; per-project Editor or Viewer. Only administrators manage members; the last administrator cannot be demoted or deactivated. Access, role and membership changes take effect on the very next request.
- **Attribution.** The actor is always the signed-in account and its name at the time, supplied by the server, never the request body; renaming never rewrites earlier records. Token actions record the owner with `via` naming the token, shown as "via agent".
- **Security.** Passwords as salted scrypt (N=131,072, r=8, p=1, 32-byte output, parameters stored with the hash). Only hashes of session, recovery, link and token values are stored. Failed sign-ins are slowed without revealing whether an email exists. No password, token, code or link ever appears in records, logs or exports. Settings secrets are encrypted with a deployment key and shown only masked (last 4 characters).
- **Activity log.** Append-only, kept for the life of the installation, filterable and exportable by administrators, never readable by standard users.
- **Agent access.** Off by default; tokens are read-only or read-and-draft, optionally limited to projects, never exceed the owner's current access, and are refused "needs a person" on person-only and administrator-only routes.
- **Definition of done.** Criteria pass in Chrome against the locally run server; automated tests pass, the existing tests still pass, and criteria naming a deployed Cloudflare test installation are checked there.

## Technical Decisions

- **One server build (TypeScript Worker)** serving the existing React app (JavaScript, unchanged language) and the API. Self-hosted, the same bundle runs under `workerd` (pinned version) in Docker on Linux.
- **Exactly two Durable Object classes, fixed from the first release**: one project room per project and one installation object (fixed name) holding users, sessions, invitations/resets, project catalogue and memberships, settings, tokens, the activity log and the job table. Both use SQLite storage. Adding, renaming or removing a class later blocks Cloudflare rollback.
- **Allowed platform features only**: Durable Objects with SQLite, Durable Object alarms, web-standard APIs (Request/Response, streams, Web Crypto, plus Node-compatible crypto for scrypt). No D1, Workflows, Queues, scheduled triggers or KV bindings on either host.
- **Host-specific code only behind two interfaces**: a file store (R2 on Cloudflare, disk service self-hosted) and an update interface. Routes never touch platform bindings directly; storage goes through the project room, the installation object or the file store.
- **Code layout**: `shared/` (TypeScript: record shapes, validation, roles, route declarations), `server/` (`api/`, `auth/`, `project-room/`, `installation/`, `jobs/`, `files/`, `update/`, `mcp/`), `deploy/cloudflare/` and `deploy/selfhost/`, `server-tests/`. A rule spanning browser and server is written once in `shared/` with tests.
- **Tooling**: local development through `@cloudflare/vite-plugin`; server tests with Vitest and `@cloudflare/vitest-plugin` (the renamed `vitest-pool-workers`) running inside Cloudflare's runtime. An early trial needed `--legacy-peer-deps` once, so pin dependency versions and prove a clean lock-file install in CI. Known-working set: vite 6.4.2, @cloudflare/vite-plugin 1.70.0, wrangler 4.164.0, vitest 5.1.1, @cloudflare/vitest-plugin 1.8.4.
- **Data-format versions and conversions**: each object records its data-format version at creation. A conversion runner applies listed conversions in order only when called (never on object start); its list starts empty. Data newer than the build is refused with an explanation; data older is refused as "update not completed". Before the first release, a changed record shape re-creates dev/test installations rather than converting.
- **One version acts at a time**: every build carries a release version; entry code attaches it to every object call and objects attach their own to calls between objects. An object receiving a different version refuses, keeps nothing the call wrote, and stops itself so it restarts on deployed code; the caller retries once, then answers "updating, try again shortly" (agents get HTTP 503 with a retry time). An object stops at most once per 30 s, writing the stop time to its own storage (in bookkeeping no conversion touches) before stopping. Each stop and refusal is logged with both versions. A version-independent call marking exists but is unused at first.
- **One alarm per object, many due times**: an object using its alarm for several kinds of work keeps a schedule table and always sets the earliest; setting one never removes another.
- **Declared routes**: everything except the app's own pages/files is under `/api/v1/`, plus `/mcp` and `/.well-known/` discovery addresses. Each route declares input and reply schemas in `shared/` (and, from story 1.8, exactly one class: public, reviewer link, read, draft change, person only, administrator only, update secret; an undeclared class is refused). Invalid input is refused with the field named; every refusal carries a reason code plus wording and never repeats an entered value. The declarations offer an entered-text type wrapping a value with its source (member, agent, reviewer link, import, file name, PDF text) and a reference, so `/api/v1/` never changes shape when it is first used.
- **Access gate**: one gate identifies the caller (session cookie, reviewer-link header, `Authorization: Bearer` token, or none), looks up account state, role and membership in the installation object on every request (any cached lookup is discarded on change), decides, and passes decision and actor to the project room, which trusts only the gate. Cookie requests that change anything, and sign-in/set-up/invite/reset requests, must come from the app's own origin and carry the app's header; token requests are exempt. A request with both a cookie and a token is refused.
- **Sessions**: random token in an HttpOnly, Secure, SameSite=Lax cookie; only its hash is stored; only deliberate user actions count as use (automatic polling does not).
- **Tokens**: `ssat_` prefix with at least 32 random bytes; stored as SHA-256 and compared in constant time; header only, a `ssat_` value in a query string is refused and never logged; per-request idempotent operation identifiers for token draft changes; rate counters in memory with per-address pre-checks before the installation object.
- **Deploy-time secrets**: the Cloudflare deploy command creates the set-up code (while no users exist) and the deployment key only when absent, printing each once; a redeploy never regenerates the key. Worker secrets must not change during an update because rollback restores the previous version's secrets.
- **Self-hosted client address** comes from `X-Forwarded-For` only when the request arrives from a configured proxy.

## UX & Interaction Patterns

- Screens: set-up (S-25), sign-in with second step and "Use a recovery code" (S-26), invitation/reset (S-27), projects list after sign-in, skipped when the user has exactly one project (S-28), My account with password, two-step and sessions (S-29), Administration as a separate area from the account menu with a left-hand list of Users, Projects, Settings, Activity (S-30, S-31, S-33, S-36), and token screens (S-38 to S-40).
- One sign-in failure message for every case: "That email and password do not match."; waits are stated on the page. Sign-in fields are labelled, 16 px and password-manager friendly; the code field requests a numeric keypad and code autofill.
- Recovery codes and new tokens are shown once, with Copy (and Download for codes); closing a token panel without copying asks for confirmation.
- The account menu shows the user's name, role, My account, Sign out; administrators also see Administration. Standard users never see administrator controls, and the server refuses them regardless.
- Status chips (label and shape as well as colour): account state Invited/Active/Deactivated, two-step On/Off/Required but not set up, token Active/Expires soon/Expired/Revoked, attribution "via agent ‹token name›" with an agent mark. Disabled last-administrator controls show their reason.
- A refused save stays on the page, is not retried, and reads "not saved:" plus the reason (for example "not saved: access changed"). An "updating, try again shortly" answer is not a refusal: the edit stays and is resent automatically.
- Visual foundation for new screens: 4.5:1 text contrast, visible focus, readable text sizes.

## Cross-Story Dependencies

- Epic 1 depends on nothing; within it each story needs only the stories before it. Story 1.1 is the foundation for all of them and for every later epic.
- Story 1.1 must deliver the version rule, data-format version and conversion runner now, because the first in-app update (Epic 9) depends on the first release already obeying them. The update record, real conversions and the return are built in Epic 9.
- Story 1.1 declares routes with schemas, reason codes and the entered-text type; story 1.8 adds route classes and the actor's `via` field; story 1.19 adds token callers on top of both. Standing rule: every later story tests its write routes with both token kinds and as Editor, Viewer and non-member.
- Story 1.1's self-hosted configuration (same bundle under `workerd`, CI smoke test: save, restart, read back) is reused by story 1.18 before the Docker image of story 2.21; the self-hosted smoke suite is extended per area once story 2.24 builds it.
- Story 1.5's deployment key is reused for settings secrets in stories 1.15, 1.17 and 9.13. Self-hosted forms of set-up and recovery come in stories 2.21 and 2.23. Project data stays in the browser until Epic 2 moves it onto the server.
- The API description and MCP endpoint come in Epic 11; installation backup of accounts and the activity log comes in Epic 8.
