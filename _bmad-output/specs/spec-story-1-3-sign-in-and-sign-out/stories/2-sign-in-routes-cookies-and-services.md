---
title: 'Story 1.3, spec 2: Sign-in routes, cookies and services'
type: 'feature'
created: '2026-11-20'
status: 'draft'
route: 'dispatch'
baseline_commit: ''
review_loop_iteration: 0
story_key: '1-3-sign-in-and-sign-out'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/brownfield.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

> **Not ready for development.** Needs spec 1 done; follows Kevin's decisions D-1 to D-6 in SPEC.md; the spec awaits an adversarial review before it is marked ready.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spec 1's storage has no way in: no route signs in, reads a session or signs out, handlers cannot set cookies, and nothing shows the timing parity or a hash verifying on both hosts.

**Approach:** Declare and implement a public session read, sign-in and sign-out; let handlers return `Set-Cookie`; apply the origin rule to sign-in and sign-out; add the timing test, the cross-host fixture (D-6) and sign-in to the self-hosted smoke test. Covers CAP-2, CAP-5, CAP-9, the cookie side of CAP-3, CAP-6's timing test, the local parts of CAP-10 and CAP-13, and the server side of CAP-1.

## Boundaries & Constraints

**Always:**
- Routes under `/api/v1/`, declared with input and reply schemas; refusals never echo a value. Sign-in and sign-out `appOriginOnly`.
- Order of a sign-in: origin → schema → `signInAttempt` → verify in the Worker (queued) → `completeSignIn` → `Set-Cookie`.
- Cookie: `__Host-<prefix>-<installation id>`, `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`, no `Domain`; cleared with `Max-Age=0` at sign-out (D-1, D-4). The marker cookie is set at sign-in and kept at sign-out (D-3).
- D-2 as amended: reads `idempotent`, writes not retried after a bare reset.

**Never:** Pages, Playwright or CI changes (spec 3). Deploying or probing Cloudflare (spec 4). A route that resets state. `experiments/`, the four Sites files, `sprint-status.yaml`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Session read, signed out | no cookie, administrator exists | `{ signedIn: false, installationName }` | N/A |
| Session read, signed in | valid cookie | `{ signedIn: true, name, installationName }` | N/A |
| Sign in | right email and password, app origin and header | 200 with account name; session and marker `Set-Cookie` | N/A |
| Wrong password / unknown email | either | identical status, code, body and headers | `signin_failed` 401 |
| Waiting | over a limit | `Retry-After` = `retryAfterSeconds`; same for unknown email | `signin_wait` 429 |
| Bad input | missing, empty or over-long field | not counted, field named | `invalid_input` 400 |
| Cross-site | `Origin` absent or foreign, or header missing | refused before the body is read | `origin_refused` 403 |
| Sign out | valid cookie, app origin and header | session ended, cookie cleared | N/A |
| After sign out | old cookie on session read or sign-out | refused | `not_signed_in` 401 |
| Foreign cookie | cookie under another identifier, or unknown token | treated as signed out | `not_signed_in` |
| Simultaneous | 25 wrong attempts for one email | at most 5 hashed, 20 waits | `signin_wait` |
| Timing | 20 known-email and 20 unknown-email refusals | medians within 100 ms | N/A |

</frozen-after-approval>

## Code Map

- `site-studio/shared/routes.ts` -- `ROUTES`, `declareRoute`, `appOriginOnly`, `APP_HEADER`.
- `site-studio/server/api/router.ts` -- `isFromAppOrigin`, `readInput`, reply check; pass handler headers and the parsed cookies.
- `site-studio/server/api/handlers.ts` -- `HandlerResult`, `RequestContext`, `RouteHandlers` mapped type.
- `site-studio/server/http.ts` -- `jsonResponse(value, status, headers)`, `refusalBodyResponse`.
- `site-studio/server/api/clientAddress.ts` -- `clientAddressKey`.
- `site-studio/deploy/selfhost/smoke.mjs` -- `completeSetup`; add sign-in, session read, sign-out.
- `site-studio/server-tests/setup-routes.test.ts` -- request-building patterns.

## Tasks & Acceptance

**Execution:**
- [ ] `site-studio/shared/routes.ts` -- declare the session read (GET), sign-in (POST) and sign-out (POST).
- [ ] `site-studio/server/api/handlers.ts`, `router.ts`, `server/http.ts` -- handler headers; cookie parsing; the three handlers.
- [ ] D-6: a committed known-answer fixture, the probe bundle run under workerd by the smoke test, and `site-studio/server-tests/password-fixture.test.ts`; the Cloudflare probe Worker is spec 4's.
- [ ] `site-studio/deploy/selfhost/smoke.mjs` -- sign in, read, sign out, old cookie refused, under workerd.
- [ ] `site-studio/server-tests/signin-routes.test.ts`, `signin-timing.test.ts` -- matrix rows.

**Acceptance Criteria:**
- Given any refusal in these tests, when its text and headers are read, then no entered email, password, token or marker appears.
- Given the set-up administrator, when they sign in and the `Set-Cookie` is parsed, then every attribute in CAP-3 holds and no `Domain` is present.

## Verification

**Commands** (in `site-studio/`):
- `npm test && npm run typecheck && npm run test:server` -- pass
- `npm run build && npm run test:sites && npm run smoke:selfhost` -- pass
