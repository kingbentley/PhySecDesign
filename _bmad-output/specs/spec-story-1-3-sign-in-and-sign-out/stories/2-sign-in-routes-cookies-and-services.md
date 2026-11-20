---
title: 'Story 1.3, spec 2: Sign-in routes, cookies and services'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
baseline_commit: '1513ddaaadec1171068d43318e5b63a4eca74902'
review_loop_iteration: 0
story_key: '1-3-sign-in-and-sign-out'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> Needs spec 1 done. Follows Kevin's decisions in SPEC.md (D-1 to D-7, D-11, D-13, D-15 and the amendments of D-2, D-4, D-5 and D-7) and the applied review findings.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spec 1's storage has no way in: no route signs in, reads a session or signs out, handlers cannot set cookies, and nothing shows the timing parity or a hash verifying on both hosts.

**Approach:** Declare and implement a public session read, sign-in and sign-out; let handlers return a list of cookies; apply the origin rule to sign-in and sign-out and guard it with a declaration sweep; add the timing test, the `deploy/probe/` fixture and probe (D-6), and sign-in to the self-hosted smoke test. Covers CAP-2, CAP-5, CAP-9, the cookie side of CAP-3, CAP-6's timing test, the local parts of CAP-10 and CAP-13, and the server side of CAP-1.

## Boundaries & Constraints

**Always:**
- Routes under `/api/v1/`, declared with input and reply schemas; refusals never echo a value. Sign-in and sign-out `appOriginOnly`. Routes that read the session cookie carry a declaration flag.
- Order of a sign-in: origin → schema → queue not full (else `signin_busy`, uncounted) → `signInAttempt` → verify in the Worker (queued) → `completeSignIn(ticket, outcome)` → cookies.
- The session read is read-only. It answers a dead cookie under this installation's own name (ended, expired, unknown token, malformed; "foreign" here means another installation's token presented under this name) as `{ signedIn: false, … }` and clears it (D-7 amended). Only a cookie under this installation's own name is ever cleared, by any route; a cookie named with another installation's identifier is ignored and never gets a `Set-Cookie` (criterion 17, CAP-10). Sign-out always succeeds after the origin check and always clears the session cookie (D-13).
- Cookies appended one by one with `headers.append("set-cookie", …)` (A-9). Session `__Host-<prefix>-<id>=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`; marker `__Host-<prefix>-m-<id>=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`; no `Domain`; clearing with the full attributes and `Max-Age=0` (D-1, D-3, D-4, A-5, E-15). The marker is set at sign-in and never in the sign-out reply.
- The Worker passes every cookie with the session prefix to the object; no isolate caches the identifier (A-18).
- Story 1.2's D-2 as amended: the session read and `endSession` `idempotent` and retried once after a bare reset; counting and completing not retried (V-16, E-6).
- No log line, reply or refusal holds the email, password, token or marker (V-10).

**Never:** Pages, Playwright or CI changes (spec 3). Deploying to Cloudflare (spec 4). A route that resets state. `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Session read, set-up open | no users | `{ signedIn: false, installationName: null }` (E-11) | N/A |
| Session read, signed out | no cookie, administrator exists | `{ signedIn: false, installationName }` | N/A |
| Session read, signed in | valid cookie | `{ signedIn: true, name, installationName }`; no token in the body | N/A |
| Sign in | right email and password, app origin and header | 200, body equal to the declared shape; session and marker as two `Set-Cookie` headers, both present after the HSTS copy (`getSetCookie()`) | N/A |
| Normalised input | email in another case with spaces; password in another Unicode form | signs in (V-9) | N/A |
| Long passwords | 128-emoji and NFKC-shrinking passwords set at set-up | sign in (A-10, E-10) | N/A |
| Wrong password / unknown email / inactive account / ticket fault | any | identical status, code, body and headers (D-5 amended) | `signin_failed` 401 |
| Email in another Unicode form | email that differs from the stored one only in normalisation | does not match; stand-in path, one message (D-15, E-18) | `signin_failed` |
| Waiting | over a limit | `Retry-After` = `retryAfterSeconds`; same for unknown email | `signin_wait` 429 |
| Busy | hash queue has 20 waiting | refused before counting; same for every email; `Retry-After: 5` (D-5 amended) | `signin_busy` 503 |
| Unknown address | 20+ failures with no `CF-Connecting-IP`, over different emails, then a marker holder | no address wait; the marker holder signs in (D-11, E-2) | N/A |
| Bad input | missing or empty field, email > 254 code points, password > 1,024 units | not counted, field named | `invalid_input` 400 |
| Cross-site | `Origin` absent or foreign, or header missing | refused before the body is read | `origin_refused` 403 |
| Sign in carrying X | valid session cookie X | new token Y; X then reads as `{ signedIn: false }` and is cleared (V-8) | N/A |
| Marker renewed | second sign-in | marker's expiry later than the first (V-1) | N/A |
| Marker exempts | email locked from address P; correct sign-in from address Q with the marker | signs in (CA-44) | N/A |
| Sign out | valid cookie, app origin and header | session row gone, cookie cleared with full attributes, no marker `Set-Cookie` | N/A |
| After sign out | the exact old cookie replayed on the session read and on sign-out | session read 200 `{ signedIn: false }` with a clearing cookie; sign-out 200 with a clearing cookie; the sessions row gone (V-5) | N/A |
| Dead cookie | under this installation's own name: expired (30 days), unknown token (including another installation's token under this name) or malformed, on the session read | 200 `{ signedIn: false }`, cleared with full attributes (D-7 amended, A-2, E-5) | N/A |
| Other installation's cookie | session read, sign-in or sign-out carrying a cookie named with another identifier, with or without this installation's own cookie | answered by this installation's own cookie alone; no `Set-Cookie` for the other name (criterion 17, CAP-10) | N/A |
| Sign out, no session | sign-out with an ended cookie or none, app origin and header | 200, session cookie cleared (D-13) | N/A |
| Read-only read | session read after sign-in | last use unchanged (D-4 amended) | N/A |
| Simultaneous | 25 wrong attempts for one email, no cookies | at most 5 hashed, 20 waits (A-6) | `signin_wait` |
| Retry | bare reset on `signInAttempt` / `completeSignIn` | one call each, error reaches the client (V-16) | `internal_error` |
| Retry, read and end | bare reset on the session read, and on `endSession` | each retried once (E-6) | N/A |
| Timing | 20 known and 20 unknown refusals, interleaved after a warm-up | medians within 100 ms, each ≥ 150 ms (A-21, V-2) | N/A |
| Declarations | every route in `ROUTES` | each non-GET route flagged as reading the session cookie is `appOriginOnly` (V-12) | N/A |
| Logs | sign-in, failure, wait, sign-out with `console` watched | no line holds the email, password, token or marker (V-10) | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/routes.ts` -- `ROUTES`, `declareRoute`, `appOriginOnly`, `APP_HEADER`.
- `site-studio/server/api/router.ts` -- `isFromAppOrigin`, `readInput`, reply check; append handler cookies, pass parsed cookies.
- `site-studio/server/api/handlers.ts` -- `HandlerResult`, `RequestContext`, `RouteHandlers` mapped type.
- `site-studio/server/http.ts` -- `jsonResponse`, `refusalBodyResponse` (single-value header records today, lines 9 and 25).
- `site-studio/server/httpsRedirect.ts` -- `withHsts` copy (line 63), unchanged.
- `site-studio/server/api/clientAddress.ts` -- `clientAddressKey`.
- `site-studio/deploy/selfhost/smoke.mjs` -- `completeSetup`, the restart (line 60); add sign-in, counts, sign-out, the probe.
- `site-studio/server-tests/setup-routes.test.ts` -- request-building patterns and the `wrap` hook (line 31).

## Tasks & Acceptance

**Execution:**
- [x] `site-studio/shared/routes.ts` -- declare the session read (GET), sign-in (POST) and sign-out (POST), with the session-cookie flag.
- [x] `site-studio/server/api/handlers.ts`, `router.ts`, `server/http.ts` -- cookie lists; cookie parsing; the three handlers.
- [x] `site-studio/deploy/probe/` -- `wrangler.jsonc` copying the app's compatibility date and flags; entry importing `server/auth/password.ts`; built with `wrangler deploy --dry-run --outdir`; makes the fixture once under workerd and verifies it and a wrong password (A-22, V-3).
- [x] The fixture file (production parameters, its origin and host recorded) and `site-studio/server-tests/password-fixture.test.ts` (verifies through `verifyPassword`; a wrong password fails).
- [x] `site-studio/deploy/selfhost/smoke.mjs` -- sign in before the restart and find the same cookie signed in after (V-11); one wrong sign-in for an unknown email before and four after, then the wait (V-17; the smoke test's requests carry no address, so this is the email count, D-11); sign out, then the old cookie reads as not signed in; run the probe.
- [x] `site-studio/server-tests/signin-routes.test.ts`, `signin-timing.test.ts` (own timeout), `signin-declarations.test.ts`, `signin-retry.test.ts` -- matrix rows.
- [x] Record once in this file: the timing test fails with the stand-in check skipped (V-2). The skip is temporary and is not left in the code.
- [x] Carried over from spec 1's review (last entry of `_bmad-output/implementation-artifacts/deferred-work.md`): the set-up handler in `server/api/handlers.ts` catches `HashQueueBusy` and answers `signin_busy` (503, `Retry-After: 5`) as the sign-in handler does, with a set-up route test for a full queue (in `signin-routes.test.ts` or beside the existing set-up route tests); mark that deferred entry resolved.
- [x] Spec 1's code (`shared/signin.ts`, `server/auth/*`, `server/installation/signInStore.ts`) changes only where this spec cannot work without it, as the smallest change, named in Build Notes. Existing tests stay unchanged except where this spec requires it, each change named in Build Notes. No new dependency, no lint script, no change under `src/`, `browser-tests/`, CI workflows or `experiments/`, no deploy; do not commit.

**Acceptance Criteria:**
- Given any refusal in these tests, when its text and headers are read, then no entered email, password, token or marker appears.
- Given the set-up administrator, when they sign in and both `Set-Cookie` lines are parsed, then every attribute of the session and marker cookie lines holds and neither has `Domain`.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass

## Build Notes

Built 2026-11-20 on the Windows 11 workstation; nothing deployed.

**Routes and replies.** `GET /api/v1/session` (`session`, reply `{ signedIn: false, installationName }` or `{ signedIn: true, name, installationName }`), `POST /api/v1/session/sign-in` (`signIn`, input `signInInput`, reply `{ name }`), `POST /api/v1/session/sign-out` (`signOut`, input `{}`, reply `{ signedIn: false }`). All three carry the new declaration flag `readsSessionCookie`; sign-in and sign-out are `appOriginOnly`. The router parses the `Cookie` header once (`prefixedCookies`) and gives the cookies only to a route so flagged (`requestContext`, exported for the sweep test); every other route gets `{}`.

**Cookies.** `HandlerResult` carries an optional `cookies` list of whole `Set-Cookie` lines; `jsonResponse` and `refusalBodyResponse` take it and append each line to a `Headers` object. Sign-in sets the session line then the marker line; the session read and sign-out set only the clearing line under this installation's own name, with the identifier the object returned.

**`signin_busy`'s `Retry-After: 5`** comes from `server/http.ts`, as the fixed wait of `updating` does (`SIGNIN_BUSY_RETRY_AFTER_SECONDS`); the body carries no `retryAfterSeconds`, so the busy refusal is identical for every email.

**Set-up and the queue (deferred item resolved).** The set-up handler checks `hashQueue.hasRoom()` before counting its attempt, as sign-in does (added after review, finding 1), and still wraps `hashPassword` to answer a `HashQueueBusy` that races in after counting as `signin_busy`; it now also passes `request.signal` to the queue, so a cancelled set-up frees its slot. The deferred entry is marked resolved in `deferred-work.md`.

**Task list.** The last two Execution tasks (the set-up busy carry-over and the scope rules) were added at build time by the build session, from the orchestrating session's task brief; they are not part of the approved plan.

**Sign-out when the object cannot confirm.** If `endSession` answers a refusal (for example `updating` after its one retry), sign-out returns that refusal without a clearing cookie: no isolate keeps the identifier (A-18), so the cookie name is unknown. The page then shows "You are still signed in. Try again." (spec 3).

**Spec 1's code: unchanged.** No change to `shared/signin.ts`, `server/auth/*` or `server/installation/signInStore.ts` was needed. **Existing tests: unchanged.**

**New files.** `server-tests/signin-helpers.ts` (shared request builders, cookie parsing, seeding and the refusal check used by the four new suites; not a test file). `deploy/probe/wrangler.jsonc`, `index.ts` (GET `/make`, GET `/verify`), `password-fixture.ts` (the fixture, as a TypeScript module so the server tests import it without `resolveJsonModule`), `probe.mjs` (checks the probe's compatibility date and flags equal the app's, builds with `wrangler deploy --dry-run --outdir` into a temporary folder, serves under workerd on a free port; `node deploy/probe/probe.mjs make|verify`). The smoke test imports `verifyFixtureUnderWorkerd` from it.

**The fixture.** Made once by `node deploy/probe/probe.mjs make` (Wrangler 4.164.0, workerd 1.20261117.1, compatibility date 2026-11-01, `nodejs_compat`), N = 131,072, r = 8, p = 1, 32 bytes. It verifies, and a wrong password fails, in the server tests (Cloudflare's runtime through vitest) and under workerd through the probe run by the smoke test. The Cloudflare deployment of the probe is spec 4's. workerd prints that `nodejs_compat` is now a default at this compatibility date; the flag is kept to match the app.

**V-2, recorded once.** With the stand-in check temporarily skipped (`correct = standIn ? false : await verifyPassword(...)` in the sign-in handler), `signin-timing.test.ts` failed: known median 288.5 ms, unknown median 6 ms, "expected 6 to be greater than or equal to 150". The skip was removed at once; with the check, the same file passed run alone (known 246 ms, unknown 242.5 ms) and in the full server suite. The timing file runs in parallel with the other server-test files (vitest's default); the interleaving puts that load on both kinds alike.

**Smoke test.** The administrator's password is now a per-run random constant so it can sign in. Before the restart: set-up, sign-in (two cookies, a session and a marker), the session read signed in, one wrong sign-in for `smoke-nobody@example.test`. After: the same cookie signed in, four wrong sign-ins, the sixth gets `signin_wait` with `Retry-After`, sign-out clears the session cookie alone, and the old cookie reads as not signed in. Then the probe verifies the fixture under workerd.

**Verification run (2026-11-20).** `npm test` 151 passed; `npm run typecheck` clean; `npm run test:server` 23 files, 257 tests passed; `npm run build` built; `npm run test:sites` 4 passed; `npm run smoke:selfhost` passed, including the probe.

**After the review patches (2026-11-20).** `npm test` 151 passed; `npm run typecheck` clean; `npm run test:server` 23 files, 260 tests passed (three new route tests: a queue filled after counting, the object refusing with `updating` on sign-out and on the session read, sign-in while set-up is open); `npm run build` built; `npm run test:sites` 4 passed; `npm run smoke:selfhost` passed, the probe verifying the fixture and refusing the wrong password under workerd. `sprint-status.yaml` was not synced: this build's brief keeps it out of scope.

## Review Triage Log

Review round 1 (2026-11-20): Blind Hunter (BH), Edge Case Hunter (EC) and Verification Gap (VG) layers on the diff against `1513dda`. Verdicts are the triager's.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | BH, VG | Set-up counts its attempt before it can meet a full queue, so each busy reply spends a set-up attempt; the set-up busy test does not check the count | medium | Sign-in checks `hasRoom()` before counting; set-up only caught `HashQueueBusy` after `setupAttempt` | patch: `hasRoom()` check before `setupAttempt`; the test asserts `setupAttempt` was not called |
| 2 | VG | Sign-in's catch of `HashQueueBusy` after counting is never run | medium | The busy test fills the queue before the request, so only the early check answers | patch: a test fills the queue inside the `signInAttempt` wrap (503, `Retry-After: 5`, no cookie, email count stays 1) |
| 3 | VG, BH | Sign-out and session-read refusals from the object are untested at the route | medium | Every sign-out route test had `endSession` succeeding; a false "signed out" could pass | patch: a test with `endSession` and `sessionInfo` answering `updating` on every call (503, `Retry-After`, no cookie, session row kept) |
| 4 | BH | Sign-in while set-up is open is untested at the route | low | Covered at store level in spec 1 only; a route test is a direct addition | patch: 401 `signin_failed`, no cookie, no session rows |
| 5 | BH | The log watch never presents another installation's cookie | low | Foreign-name cookies reach the object (A-18); the V-10 test used own cookies only | patch: the logs test sends a foreign-name token and checks it is never logged |
| 6 | VG | No test that handlers pass `request.signal` to the queue | low | The queue's abort behaviour is pinned in `hash-queue.test.ts`; whether the runtimes abort `request.signal` on disconnect cannot be shown under vitest; a test would only check an argument | reject |
| 7 | BH | An aborted request after counting ends as a 500 and leaves its ticket uncompleted | low | The client is gone, so nobody reads the 500; the ticket expires in 5 minutes and is pruned; a raised count after a fault is accepted (E-17); passing the signal follows "the slot is released however its request ends" | reject |
| 8 | BH | The declaration sweep does not stop a handler reading the raw `Cookie` header | low | No handler reads it; enforcing it means rebuilding the request for unflagged routes; story 1.8 replaces `appOriginOnly` with route classes | reject |
| 9 | BH | `refusalOf` checks only the entered text, not its normalised forms | false | Refusal bodies are built only from fixed messages in `REFUSALS` (`refusalBody`), which take no entered value, so no normalised form can appear | reject |
| 10 | BH | The fixture was made on Windows, not in Docker on Linux | low | SPEC asks for the fixture made "under the self-hosted runtime" by the probe; workerd is that runtime and the host is recorded truthfully in the fixture | reject |
| 11 | BH | The probe's `/make` would be public once deployed to `workers.dev` | low | Each call costs one scrypt hash on the test account; spec 4 deploys the probe for one run and deletes it afterwards | reject (noted for spec 4) |
| 12 | BH, EC | `probe.mjs` reads JSONC with regular expressions | low | Both current files are read correctly (the app's comment line holds no quoted key, no `env` blocks); a fix means a parser or comment stripping | reject |
| 13 | BH | The probe assumes Wrangler writes a single `index.js` | false | If more modules were written, workerd fails loudly and the probe reports the failure; nothing passes silently | reject |
| 14 | BH | The smoke test's cookie checks are loose (marker by `-m-`, no attributes, no V-5 clearing check) | low | Attributes, names and V-5 clearing are checked in the route tests in Cloudflare's runtime (standing rule 15); the smoke task asks only that the old cookie reads as not signed in | reject |
| 15 | BH | The timing test may be flaky under parallel load; its addresses lie outside 198.51.100.0/24 | maybe-false | Passed in three full server-suite runs on this workstation; flakiness on a slower CI runner is unshown; the addresses are only test input | defer (`deferred-work.md`) |
| 16 | BH | Two Execution tasks were added after approval without attribution | low | The fix edits this build's spec | reject (a Build Notes line now records their source) |
| 17 | BH | The deferred item's resolution is inside its `evidence` field | false | `deferred-work.md` entries have only `summary` and `evidence` by the workflow's format, and earlier resolved entries record their status the same way | reject |
| 18 | BH | The fixture test uses `hash!` without checking for `null` | low | A `null` fixture fails the test loudly with a type error; nothing passes wrongly | reject |
| 19 | EC | An own-name cookie value over 512 characters is never passed on, so never cleared by the session read | low | Needs a tampered cookie; sign-out still clears it, since it clears the own name unconditionally; the fix is in spec 1's `prefixedCookies` | reject |
| 20 | EC | A sign-in reply failing its schema after the session was written leaves an orphan session | false | The handler returns `{ name: string }` from the object's account name; the strict `signInReply` cannot fail on it | reject |
| 21 | EC | `probe.mjs` may hit `EBUSY` in `rmSync` after `SIGKILL` on Windows | low | On Windows `kill("SIGTERM")` already terminates the process, so the `SIGKILL` path is not reached; failure path only | reject |
| 22 | EC | `probe.mjs` waits 5 s for an exit that already happened when workerd died by a signal | low | A 5-second delay on a failure path only; fixing it means moving the `exited` flag out of the `try` | reject |
