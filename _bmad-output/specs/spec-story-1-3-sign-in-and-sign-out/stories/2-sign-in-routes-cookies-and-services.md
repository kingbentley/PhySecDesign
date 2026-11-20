---
title: 'Story 1.3, spec 2: Sign-in routes, cookies and services'
type: 'feature'
created: '2026-11-20'
status: 'ready-for-dev'
route: 'dispatch'
baseline_commit: ''
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
- The session read is read-only. It answers a dead cookie (ended, unknown, foreign, expired, malformed) as `{ signedIn: false, … }` and clears it (D-7 amended). Sign-out always succeeds after the origin check and always clears the session cookie (D-13).
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
| Dead cookie | expired (30 days), unknown, foreign-identifier or malformed cookie on the session read | 200 `{ signedIn: false }`, cleared with full attributes (D-7 amended, A-2, E-5) | N/A |
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
- [ ] `site-studio/shared/routes.ts` -- declare the session read (GET), sign-in (POST) and sign-out (POST), with the session-cookie flag.
- [ ] `site-studio/server/api/handlers.ts`, `router.ts`, `server/http.ts` -- cookie lists; cookie parsing; the three handlers.
- [ ] `site-studio/deploy/probe/` -- `wrangler.jsonc` copying the app's compatibility date and flags; entry importing `server/auth/password.ts`; built with `wrangler deploy --dry-run --outdir`; makes the fixture once under workerd and verifies it and a wrong password (A-22, V-3).
- [ ] The fixture file (production parameters, its origin and host recorded) and `site-studio/server-tests/password-fixture.test.ts` (verifies through `verifyPassword`; a wrong password fails).
- [ ] `site-studio/deploy/selfhost/smoke.mjs` -- sign in before the restart and find the same cookie signed in after (V-11); one wrong sign-in for an unknown email before and four after, then the wait (V-17; the smoke test's requests carry no address, so this is the email count, D-11); sign out, then the old cookie reads as not signed in; run the probe.
- [ ] `site-studio/server-tests/signin-routes.test.ts`, `signin-timing.test.ts` (own timeout), `signin-declarations.test.ts`, `signin-retry.test.ts` -- matrix rows.
- [ ] Record once in this file: the timing test fails with the stand-in check skipped (V-2).

**Acceptance Criteria:**
- Given any refusal in these tests, when its text and headers are read, then no entered email, password, token or marker appears.
- Given the set-up administrator, when they sign in and both `Set-Cookie` lines are parsed, then every attribute of the session and marker cookie lines holds and neither has `Domain`.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
