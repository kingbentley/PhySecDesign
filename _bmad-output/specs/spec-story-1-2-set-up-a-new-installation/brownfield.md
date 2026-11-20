# Brownfield notes: story 1.2 on top of story 1.1

What story 1.1 left in `site-studio/` that story 1.2 must change or respect, and the implementation notes the planning documents imply. These are notes for implementers. Product decisions are in SPEC.md and its open questions.

## Code map

| Path | State after story 1.1 | Story 1.2 needs |
|---|---|---|
| `shared/routes.ts` | Declarations hold `status` only. No route classes yet; classes come in story 1.8. | Declare a set-up state route (GET, reply `{ state: "open" \| "closed" }` only) and a set-up route (POST). Put the input rules there: password 12–128 and not equal to the email, installation name 1–80. Shared rules have tests (standing rule 6). |
| `shared/refusal.ts` | Codes for input, not-found, update and format refusals. | Add codes for set-up closed, wrong code, wait (carrying the seconds to wait, not an entered value), cross-origin or missing header, and code not configured. The wording for the wait says that deploying again issues a fresh code (CA-45). |
| `server/api/router.ts`, `handlers.ts` | A handler gets `(input, env)`. The router reads JSON bodies up to 1 MiB. | The handler also needs request context: `Origin`, the app header, the client address and the request URL. Widen the signature without breaking the mapped-type check. |
| `server/installation/Installation.ts` | Answers `status` only. Built on `ObjectBase`, with `_meta` and the version and format guards. | Add tables for users, installation settings (name, public address) and set-up-code counts. Add operations to raise or check the counts and to create the first administrator atomically. |
| `server/objects/call.ts` | Retries once after any `durableObjectReset`, which could repeat a write (`deferred-work.md` item 1). | Retry only on the version-stop reason; if it cannot be told apart, never retry writes (D-2). |
| `server/auth/` | Does not exist yet; architecture section 10 places accounts here. | scrypt hash and verify through `node:crypto`. Generate the code. Compare it in constant time. |
| `server/index.ts` | Sends `/api/v1/`, `/mcp` and `/.well-known/` to the router and everything else to assets. Plain `http://` on `workers.dev` answers 200 (spec 1.1 notes). | Redirect to HTTPS only when Cloudflare's request metadata marks plain HTTP (D-1). The set-up address shows "set-up is already complete" once a user exists (D-5). |
| `deploy/cloudflare/wrangler.jsonc` | No `compatibility_flags`. `preview_urls` is unset, and Wrangler warned about it. | Add `nodejs_compat` for scrypt. Do not add banned bindings; `server-tests/host-config.test.ts` checks for them. |
| `deploy/selfhost/config.capnp`, `smoke.mjs` | Compatibility date only, with no flags. The smoke test reads `createdAt`. | Add `nodejs_compat` to match, and keep the compatibility dates equal: an existing test asserts it. The smoke test must still pass. Self-hosted set-up itself is story 2.21. |
| `package.json` `deploy:cloudflare` | `npm run build && wrangler deploy`. | A deploy script that (1) builds and deploys, (2) asks the state route at the deployed address, retrying while the new Worker becomes reachable (spec 1.1 saw error 10007 on a first deploy), and (3) only if set-up is open, generates the code, supplies it as a Worker secret and prints it once. |
| `src/admin/` | Does not exist. | The S-25 set-up screen in React (JavaScript), and the app's start-up check of the set-up state. |
| `browser-tests/` | Does not exist. | Playwright configuration, the set-up specs and the axe check (CAP-12). |
| `.github/workflows/test.yml` | Runs npm ci, unit tests, typecheck, server tests, build, the Sites test and the self-hosted smoke test. | Install Chromium and WebKit, generate a local set-up code, run the browser tests after the build, allow one retry, and upload the trace on failure. |
| `.gitignore` | — | Ignore `.dev.vars` and Playwright's output folders, so that the local code is never committed. |

## Implementation notes

- **scrypt.** N = 131,072 with r = 8 needs about 128 MiB, above Node's default `maxmem` of 32 MiB. The R9 probe passed `maxmem: 256 MiB` to `scryptSync`, and that worked on both hosts. The Workers memory limit is 128 MB per instance (`cloudflare-limits.md`). R9 did not test concurrent hashing. Hash only after the code is accepted, so that a guessing attacker cannot run hashes at once.
- **Order of a set-up attempt.**
  1. Check the origin and the app header.
  2. Validate the input against the schema.
  3. Ask the installation object to raise the counts. It refuses if the address or the installation must wait, or if a user exists.
  4. Compare the code with the current secret, in the Worker, in constant time.
  5. Hash the password.
  6. Ask the installation object to create the administrator. In one synchronous storage step, it confirms there are still no users and the same code fingerprint, then inserts the user and the settings.

  Steps 3 and 6 are separate calls, because an await on hashing inside the object would let a second request interleave.
- **Secret freshness (R11).** A changed Worker secret can take minutes to reach a Durable Object that is already running. The Worker entry reads the current secret. The object stores a fingerprint, the SHA-256 of the code, so that a new code resets the counts (CA-45) and an old code cannot be used against a new fingerprint. Confirm on a deployed installation that the old code is refused at once after a redeploy.
- **Rollback (AD-21).** A Cloudflare rollback restores the secrets of the version it returns to. Before set-up this can bring back an earlier code. That is harmless while no user exists, and set-up closes for good once one does.
- **Network address.** `CF-Connecting-IP` on Cloudflare. The local runtime has none, so every local request shares one bucket. Browser tests must account for this (see below).
- **Browser-test isolation.** Set-up completes only once per installation, and five wrong codes from the shared local address impose a wait. Each Playwright project (Chromium, WebKit) therefore gets its own preview server, with its own empty `.wrangler` state directory and its own generated code. Within a project, run the wrong-code test against a separate server, or before the completion test with fewer than five failures. Do not ship any route that resets state.
- **Reference platform.** WebKit on a Windows workstation differs slightly from WebKit on CI's Linux runners; CI is the reference (browser-tests proposal, risks).
- **Unchanged parts.** The four Sites files and their outputs, the dev-only review middleware and the existing node tests stay as they are (story 1.1).

## Implementation split

Kevin's order (2026-11-20), recorded in `stories.yaml`. Playwright comes with the set-up page, so the page is never checked by hand only (D-6).

1. **Data, rules and storage.** CAP-5, CAP-6, CAP-7 (storage half) and CAP-11.
   - **Files:** `shared/` set-up rules (D-4) and route declarations, `shared/refusal.ts`, `server/auth/` (scrypt, code compare), `Installation.ts` tables and operations, and `nodejs_compat` in both host configs.
   - **Done when:** server tests cover the input rules, a hash row holding its parameters and no password, counts raised before the check and kept across a restart, the doubling, the 15-minute clearing and the rolling cap (D-3), and one administrator under concurrent creates.
2. **Routes, retry and the deploy command.** CAP-1, CAP-2, CAP-4, CAP-7 (route half), CAP-8 and CAP-9.
   - **Files:** router and handler context, the set-up and state handlers, `call.ts` (D-2), the HTTPS redirect (D-1), and the deploy script with its `package.json` entry.
   - **Done when:** API tests in Cloudflare's runtime cover the state reply's shape, a successful set-up, the refusal after set-up, wrong, missing and fingerprint-changed codes, cross-origin and missing-header requests, the recorded public address, simultaneous requests, and the redirect firing only on the plain-HTTP metadata. A unit test checks the length and randomness of the deploy script's code.
3. **Playwright and the set-up page.** CAP-3, CAP-12, and the on-screen half of CAP-4 and CAP-7.
   - **Files:** `browser-tests/`, the `package.json` scripts and pinned dependencies, `.github/workflows/test.yml`, `.gitignore`, `src/admin/` S-25, the app's start-up state check and the "already complete" state (D-5).
   - **Done when:** CI runs green in desktop Chromium and WebKit with an iPhone viewport: set-up completes with the confirmation; a wrong code shows the wait; the already-complete state shows; axe is clean. A deliberately broken set-up page and an injected axe violation each fail the run.
4. **Acceptance on Cloudflare.** CAP-10, and the deployed parts of CAP-1, CAP-4 and CAP-9.
   - **Done when:** on two test Workers deployed from one build: a first deploy prints a code; HTTPS set-up completes; a redeploy prints no code; plain HTTP is redirected; the second installation still offers set-up; redeploying with no users replaces the code at once. Also recorded: whether the version-stop reason reaches the caller (D-2), scrypt under two concurrent hashes, and the account's Workers Paid plan.
