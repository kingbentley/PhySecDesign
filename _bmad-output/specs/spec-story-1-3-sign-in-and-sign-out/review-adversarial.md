# Adversarial review: story 1.3 spec (sign in and sign out)

- **Workflow:** `bmad-review`, one lens: adversarial (`references/lens-adversarial.md`). Content class: docs that define behaviour.
- **Reviewed:** every file in `_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/` as committed at `d7c5d84` on `story/1.3`: `SPEC.md`, `acceptance-trace.md`, `brownfield.md`, `stories.yaml`, `stories/1-…` to `stories/4-…`. The decisions D-1 to D-10 were reviewed like the rest.
- **Checked against:** story 1.3, the standing rules and the definition of done in `epics.md`; CA-07, CA-08, CA-43, CA-44, CA-47, CA-58; AD-12 and `cloudflare-limits.md`; the code in `site-studio/server/`, `shared/`, `src/main.jsx`, `src/admin/`, `src/reviewClient.js`, `browser-tests/`, `server-tests/vitest.config.mjs` and `deploy/selfhost/smoke.mjs`.
- **Reviewer:** an independent session with no part in writing the spec. It did not read the other reviewers' output.
- **Severity:** the lens itself does not rank findings. The task asked for a severity, so each finding has one. **High** means the spec as written would let an implementer build a security or acceptance defect while following it. **Medium** means a contradiction, a gap, or a wrong claim about the code that will cost rework or a failed check. **Low** means a wording, traceability or robustness point.

**Counts:** 3 high, 13 medium, 9 low (25 findings).

---

## High

### F1. Nothing stops a stand-in check from being completed as a success
- **Severity:** high
- **Where:** `SPEC.md`, Assumptions, first bullet; `brownfield.md`, "Order of a sign-in attempt", steps 3 to 5; `stories/1-…`, I/O matrix rows "Unknown or inactive email" and "Complete, correct".
- **What is wrong:** for an unknown email or an inactive account, the object returns "a stand-in signal with a one-time ticket". The Worker then verifies the password against the stand-in hash and calls `completeSignIn` "with the ticket and the outcome". Nothing says that the object refuses a success on a stand-in ticket, or that a ticket is tied to the account it was issued for. The stand-in is "fixed salt and hash" committed in the source (`brownfield.md`, `server/auth/password.ts` row). If it was made from a known or guessable password, entering that password for any unknown email verifies true. A completion that trusts the Worker's outcome would then create a session for an account that does not exist, or, if the ticket is not tied to an account, for whichever account the completion names.
- **Evidence:** "The object counts the attempt and returns the stored hash or a stand-in signal with a one-time ticket. The Worker verifies. A second object call consumes the ticket and, on success, lowers the counts…" (SPEC Assumptions). The matrix lists "Ticket missing, reused or expired" but has no row for "stand-in ticket, outcome success".
- **Suggested correction:** state that the ticket records, inside the object, the user id (or "stand-in"), the email key, the address key and whether a valid marker was presented. `completeSignIn` takes only the ticket and a boolean, and treats a stand-in ticket as a failure whatever the boolean says. State that the stand-in hash is made from random bytes that are thrown away, so no password is known to match it. Add a matrix row and a server test: a stand-in ticket completed with `success` creates no session and leaves the counts raised.

### F2. The session read has two different answers for "not signed in", and the page will read one of them as "cannot be read"
- **Severity:** high
- **Where:** `stories/2-…`, I/O matrix rows "Session read, signed out", "After sign out" and "Foreign cookie"; `SPEC.md`, Assumptions ("A public read route reports whether the caller is signed in"); D-7.
- **What is wrong:** with no cookie, the session read answers 200 `{ signedIn: false, installationName }`. With an ended, expired or foreign cookie, the matrix says it is "refused | `not_signed_in` 401", and the foreign-cookie row says both "treated as signed out" and `not_signed_in`. So one state, "not signed in", gives a 200 or a 401 depending on what the browser happens to hold. D-7 says that when the session "cannot be read", the prototype opens. A client that treats any non-200 as "cannot be read" opens the prototype for exactly the browsers whose session was ended: a session past its 30 days on the server, a session ended by a later sign-in, and later (story 1.6) a session ended by "sign out everywhere". That bypasses CAP-5 and the story's first criterion.
- **Evidence:** spec 2 matrix: "After sign out | old cookie on session read or sign-out | refused | `not_signed_in` 401" and "Foreign cookie | … | treated as signed out | `not_signed_in`". `src/main.jsx:52-67` today opens `<Workspace/>` whenever the set-up state is anything but "open", including an unknown state.
- **Suggested correction:** the public session read always answers 200 `{ signedIn: false, installationName }` when the cookie is absent, unknown, foreign, ended or expired, and reserves `not_signed_in` for routes that require a session (sign-out, if F15 is not taken, and later routes). Its reply clears a dead session cookie with `Max-Age=0`. Add a server test for each kind of dead cookie. Add a browser test in which an ended session's cookie is present and the sign-in page shows, not the prototype.

### F3. D-7 lets every visitor past the sign-in page whenever the session read fails, including during every update
- **Severity:** high
- **Where:** `SPEC.md`, CAP-1 success ("When the session cannot be read, the prototype opens"); D-7; `stories/3-…`, matrix row "Session unknown".
- **What is wrong:** story 1.3's first criterion is that an installation with an administrator shows the sign-in page "to anyone not signed in". D-7 fails open on any failure of the read. That covers a network error, and also the routine `updating` 503 (`shared/refusal.ts:12`, sent by `callObject` after a version stop, `server/objects/call.ts:57`), a 500, and Cloudflare's deferred code updates, during which objects keep running old code "for up to 300 seconds" after a deploy (`cloudflare-limits.md`, Durable Objects row). Every deploy therefore opens a window in which signed-out visitors get the prototype and signed-in users lose their account menu. Story 1.2's D-5 fail-open was harmless because there was nothing to protect. Here it undoes the criterion. The browser-local project data is still readable by whoever uses that browser (D-7's last sentence), but the page should not present the app as open.
- **Evidence:** D-7: "When the session cannot be read, story 1.2's D-5 behaviour stays: the prototype opens." `src/main.jsx:48-51`: the fail-open exists for "the Sites package, which has no server routes".
- **Suggested correction:** fail open only where there is no server: the session route answers 404 `not_found`, or the request fails as it does in the Sites package. On `updating`, retry after `Retry-After`. On any other failure, show a "Sign-in cannot be checked" page with Try again, like the existing "Set-up cannot be checked" page (`browser-tests/setup.spec.mjs:265-276`). If Kevin keeps D-7 as written, record in the spec that criterion 1 does not hold while the session read fails, and that this includes every update.

---

## Medium

### F4. CAP-11's acceptance criterion contradicts D-4's last-use writes
- **Severity:** medium
- **Where:** `stories/1-…`, Acceptance Criteria, third bullet; `SPEC.md`, Assumptions ("last use is recorded … on the session read the app makes when it opens"); `brownfield.md`, `server/objects/call.ts` row.
- **What is wrong:** spec 1 requires that "any operation other than sign-in completion and ending a session" leaves the sessions table unchanged. D-4 and its assumption make `sessionInfo` write the last-use time to that table. Refusing a session 30 days after sign-in may also delete its row. Separately, the brownfield marks the session read `idempotent`, which `call.ts` defines as "an operation that changes nothing". A write retried after a bare reset is harmless here, but the definition no longer fits.
- **Evidence:** `server/objects/call.ts:21`: "True for an operation that changes nothing, so running it twice is harmless."
- **Suggested correction:** reword the criterion as "no operation outside the sign-in store writes the sessions table, and no revision-restore path calls one". List the writers explicitly: completion, ending a session, the last-use update and pruning. Note that marking `sessionInfo` idempotent is a deliberate exception, because writing last use twice is harmless.

### F5. The marker cookie's name is not given, and two installations on one host will overwrite each other's marker
- **Severity:** medium
- **Where:** `SPEC.md`, CAP-8 and D-3; `brownfield.md`, `server/auth/` row; `stories/2-…`, Boundaries ("The marker cookie is set at sign-in").
- **What is wrong:** browsers do not separate cookies by port. CAP-10 relies on D-1's per-installation identifier in the session cookie's name for exactly this reason. The marker is specified only as "an `HttpOnly`, `Secure`, `__Host-` cookie", and "a browser holds one". If its name has no installation identifier, signing in to installation B on the same host replaces A's marker, and A then sees a marker whose signature fails. The marker's SameSite attribute and its `Path` are not given either, and `__Host-` requires `Path=/`.
- **Evidence:** CAP-10: "Two installations on one host name with different ports each keep their own session". CAP-8 gives no name and no SameSite value.
- **Suggested correction:** name the marker `__Host-<prefix>-m-<installation id>` (or a similar pattern) with `Path=/`, `SameSite=Lax` and `Max-Age` of one year. Extend the two-port browser test to show that both markers survive.

### F6. The simultaneous-attempt checks do not say to send them without the marker
- **Severity:** medium
- **Where:** `stories/4-…`, Checks 1 and 4; `stories/2-…`, matrix row "Simultaneous"; `brownfield.md`, "Simultaneous attempts".
- **What is wrong:** with a valid marker for the email, only the address limit applies (D-2 v), and that limit is 20. A client that signed in during check 1 and keeps its cookie jar would send the marker with check 4's 25 attempts. Up to 20 would then be checked against the password, not 5, and the check fails, or it is "fixed" by loosening the limit. The local server test has the same exposure if it reuses a signed-in client.
- **Evidence:** check 4: "25 wrong sign-ins for one email at once over several connections | at most 5 `signin_failed`, the rest `signin_wait`". Check 1 precedes it in the same table.
- **Suggested correction:** state that checks 3 and 4, and the server test for simultaneous attempts, send no cookies. Add a separate check that the same 25 attempts carrying a valid marker are limited by the address count alone (at most 20 checked), so that CA-44's widening is measured rather than assumed.

### F7. Without an address header, one shared bucket lets any 20 failures lock every account, and the marker does not help
- **Severity:** medium
- **Where:** `SPEC.md`, Assumptions ("absent gives one shared bucket"); Non-goals ("Self-hosted proxy address rules (story 2.22)"); `brownfield.md`, "Browser-test budget".
- **What is wrong:** `clientAddressKey` returns `unknown` when `CF-Connecting-IP` is absent (`server/api/clientAddress.ts:12-14, 56-58`). Under workerd, and behind any proxy that does not set the header, every request falls in that bucket. For set-up this "only makes the count stricter". For sign-in it means 20 failed sign-ins in 15 minutes from anyone, including ordinary typos by staff, put every user of the installation in a wait of up to 15 minutes. The marker exempts only the email wait (CA-44), so nobody gets in. The same happens on Cloudflare behind a large office NAT. The spec notes the effect only as a test budget, never as product behaviour, and records no follow-up.
- **Evidence:** `clientAddress.ts:6-7`: "Without the header, as on the local runtime, every request shares one bucket, which only makes the count stricter."
- **Suggested correction:** add it to "Notes for Kevin" with a `deferred-work.md` entry naming story 2.21 or 2.22. Consider letting a valid marker also exempt its holder from the address wait while that address's count stays raised, which needs a ruling on CA-44. At the least, state that the self-hosted smoke test must not depend on the bucket staying empty.

### F8. Story 1.2's D-5 is amended too, but the spec says only D-10 is; D-9 leaves the done page's links unclear
- **Severity:** medium
- **Where:** `SPEC.md`, introduction ("Story 1.2's decisions … still hold, except its D-10"); D-9; Constraints ("only the two assertions D-9 changes are updated").
- **What is wrong:** story 1.2's D-5 is "After set-up the app shows the prototype as today." CAP-1 replaces it: after set-up a signed-out visitor sees the sign-in page. D-7 cites D-5 as still holding for the unknown case, which is only part of D-5. In the existing tests, `setup.spec.mjs:297-299` asserts that the prototype opens after set-up (D-5), and `:286` asserts the D-10 text. Those are the two assertions D-9 names. Two more things are unsettled. The test at `:265-276` ("when the state cannot be read, the prototype opens") depends on whether the start-up flow reads the session when the set-up state is unknown, which the spec does not say. And the done page already has an "Open Site Survey Design" link to `/` (`src/admin/SetupPage.jsx:64-65`), but D-9 does not say whether the new "Sign in" link replaces it or where the new link points.
- **Evidence:** story 1.2 `SPEC.md`, D-5 (line 127); `SetupPage.jsx:65` `<a className="setup-button" href="/">Open Site Survey Design</a>`.
- **Suggested correction:** record that this story amends story 1.2's D-5 as well as its D-10. Say what start-up does when the set-up state is unknown (read the session or not). State that the "Sign in" link replaces "Open Site Survey Design" on the done page, and give its target (`/`).

### F9. The brownfield's claim that `jsonResponse` can carry the cookies is wrong
- **Severity:** medium
- **Where:** `brownfield.md`, `server/http.ts` row ("`jsonResponse` already accepts headers … Use it for `Set-Cookie`"); `stories/2-…`, Code Map.
- **What is wrong:** `jsonResponse` and `refusalBodyResponse` take `headers: Record<string, string>` (`server/http.ts:9, 25`). A record can hold one `set-cookie` value. A successful sign-in must set the session cookie and the marker, and, under the "ends that earlier session" assumption, may also need to clear an old cookie. Followed literally, the second cookie overwrites the first.
- **Evidence:** `export function jsonResponse(value: unknown, status = 200, headers: Record<string, string> = {})`.
- **Suggested correction:** say that handlers return a list of cookies, which the router appends with `Headers.append("set-cookie", …)`. Note that `withHsts` copies the headers with `new Response(body, response)` and keeps every cookie (`server/httpsRedirect.ts:63`). Have the server test read the cookies with `headers.getSetCookie()` and assert both.

### F10. The sign-in password bound is unspecified, and a raw-length bound can lock out a valid set-up password
- **Severity:** medium
- **Where:** `SPEC.md`, Assumptions ("refuses only a missing, empty or over-long email or password"); `stories/1-…`, task for `shared/signin.ts` ("present and bounded only").
- **What is wrong:** set-up measures 12 to 128 code points after NFKC (`shared/setup.ts:86-92`). NFKC can shorten a string: a decomposed "e" plus a combining accent becomes one code point. So set-up may have accepted a password of well over 128 raw code points. If sign-in bounds the raw string at 128, as an implementer copying `PASSWORD_MAX` would, that administrator can never sign in. No number is given for either field, nor whether the bound applies before or after normalisation.
- **Evidence:** `passwordField = z.string().transform(normalisePassword).refine(… count <= PASSWORD_MAX)`.
- **Suggested correction:** give the bounds explicitly. For example: email at most 254 after `normaliseEmail`; password at most 1,024 raw code points or 4 KiB, checked before normalisation, deliberately above anything set-up accepts. Add a test that a 200-code-point decomposed password accepted at set-up signs in.

### F11. A ticket refusal gets one of two codes, and the ticket's lifetime is not given
- **Severity:** medium
- **Where:** `stories/1-…`, matrix row "Ticket missing, reused or expired | … | `invalid_input` or `signin_failed`".
- **What is wrong:** "or" leaves the choice to the implementer. With `invalid_input` (400), a person whose correct password completes too late sees "The request is not valid.", which is different from every other outcome. No ticket lifetime is stated (set-up uses 5 minutes, `setupStore.ts:51`). With D-5's queue, the time between the attempt and the completion grows with load, so expiry can happen in practice.
- **Suggested correction:** fix the lifetime (5 minutes, as at set-up). Answer every ticket fault with `signin_failed` and its one message. Leave the counts raised.

### F12. D-5's queue rests on an unproven memory claim and has no test
- **Severity:** medium
- **Where:** `SPEC.md`, D-5 and Constraints; `brownfield.md`, "Memory (D-5)"; `stories/1-…` and `stories/2-…`, Acceptance Criteria (no queue criterion).
- **What is wrong:** the brownfield asserts that five concurrent hashes in one isolate exceed the 128 MB limit. Story 1.2's spec 4 check 9 ran two hashes at once on Cloudflare with no memory error, though it could not show that they overlapped. The figure is untested in either direction. No criterion shows that the queue serialises anything, so a broken queue would pass every listed test. Its cost is not considered either. The queue has no bound or timeout, and under workerd a single process serialises every sign-in and set-up hash for the installation, so 20 marker-holding attempts at once take about 8 seconds.
- **Evidence:** `brownfield.md`: "Five checked attempts at once mean five 128 MiB scrypt hashes, above the 128 MB Worker instance limit if they share an isolate." Story 1.2 spec 4, check 9: "pass, with a caveat … The logs do not show directly that the two hashes overlapped in time."
- **Suggested correction:** add a server test that fires several hashes at once and records the queue's peak concurrency as 1. Give the queue a waiting limit (for example 10 seconds), after which the request is refused with `updating`-style wording, or with `signin_failed` if it was a sign-in attempt, without lowering the count. Record in spec 4 whether five concurrent hashes without the queue would fail on Cloudflare, or drop the memory claim.

### F13. An unsalted SHA-256 of the email does not keep the typed addresses out of storage
- **Severity:** medium
- **Where:** `SPEC.md`, Assumptions ("stored as its SHA-256, so storage keeps no list of typed addresses"); `stories/1-…`, Boundaries.
- **What is wrong:** emails are low-entropy and guessable. An unsalted SHA-256 can be reversed by hashing a list of candidate addresses, so anyone with a storage export or a point-in-time copy can recover which emails were tried. The claim overstates the protection.
- **Suggested correction:** key the email counts with HMAC-SHA-256 under a random key held in the installation object (it can sit beside the marker key), and reword the assumption to say what this protects against.

### F14. No pruning is specified for sessions, counts or tickets, and an attacker controls how many rows there are
- **Severity:** medium
- **Where:** `stories/1-…`, tables task; `brownfield.md`, `Installation.ts`/`setupStore.ts` row.
- **What is wrong:** every new entered email adds a count row, and sessions past 30 days and used or expired tickets are never said to be removed. The only pattern to copy, `deleteClearedAddresses`, reads every address row on every attempt (`setupStore.ts:255-266`). Copied for email keys, the cost of each attempt grows with the number of distinct emails ever tried, and an attacker chooses that number. That attacker is limited per address, but on Cloudflare can rotate addresses or IPv6 /64s.
- **Suggested correction:** store an indexed "clears at" or "expires at" column for every row kind. In `signInAttempt`, prune with a bounded `DELETE … WHERE clears_at <= ? LIMIT n`, or add an alarm kind. Add a store test that 1,000 distinct email rows leave one attempt's cost unchanged.

### F15. Sign-out with a dead session is refused and leaves its cookie
- **Severity:** medium
- **Where:** `stories/2-…`, matrix row "After sign out | old cookie on session read or sign-out | refused | `not_signed_in` 401"; `SPEC.md`, CAP-5.
- **What is wrong:** a person whose session the server has already ended (30 days, a sign-in elsewhere in this browser, story 1.6 later) presses Sign out and gets 401. The matrix does not say that the cookie is cleared, so it stays in the browser.
- **Suggested correction:** make sign-out idempotent. After the origin check, it ends the session if one exists, always answers 200, and always sends `Max-Age=0` for the session cookie. Keep the origin rule.

### F16. D-10's check tests only `Secure`, but `__Host-` also requires a secure origin, and Chromium on `127.0.0.1` is not checked
- **Severity:** medium
- **Where:** D-10; `stories/3-…`, first task; `brownfield.md`, "Cookie in local runs".
- **What is wrong:** a `__Host-` cookie is accepted only if it is `Secure`, has `Path=/` and no `Domain`, and is set from a secure origin. The planned check asks only whether WebKit "keeps a `Secure` cookie". The brownfield asserts that Chromium keeps such cookies on these hosts, but the test servers use `127.0.0.1` (`browser-tests/playwright.config.mjs:48`), not `localhost`, and that is not shown. The DoD also requires the criteria to pass "in Chrome against the locally run server", which covers Kevin's own local run (`npm run dev`), not only Playwright. If the check moves to HTTPS, the Playwright readiness URL (`playwright.config.mjs:53`, `http://…/api/v1/setup/state`) and `serve.mjs`'s `wrangler dev` arguments must change too, and neither file's change is listed.
- **Suggested correction:** check the real `__Host-` session cookie in both projects, on the exact host the tests use. If HTTPS is needed, list the changes: `wrangler dev --local-protocol https`, `ignoreHTTPSErrors` in both projects and for `webServer`, and https readiness URLs. Say how a developer signs in locally in Chrome.

---

## Low

### F17. CAP-8 and D-2 (v) disagree on when a marker changes the counting
- **Severity:** low
- **Where:** `SPEC.md`, CAP-8 ("While that email is in a wait, an attempt carrying its valid marker is held and counted only per address") versus D-2 (v) ("An attempt carrying a valid marker for the entered email counts per address only").
- **What is wrong:** D-2 (v) says the email count is skipped for every marker attempt. CAP-8 says it is skipped only during a wait. The two give different email counts for an owner's own typos.
- **Suggested correction:** pick one reading and make spec 1's matrix row match. D-2 (v) is the simpler one to implement.

### F18. The brownfield claims an access gate that does not exist yet
- **Severity:** low
- **Where:** `brownfield.md`, "Installation identifier (D-1)": "It costs one object read per request, which the gate already makes (AD-17)".
- **What is wrong:** there is no gate until story 1.8 (`shared/routes.ts:7`: "Route classes … are added by story 1.8"), and no current handler reads a session. Sign-in as specified makes an identity read, an attempt call and a completion call. All three count against CA-08's one-second median, and the extra read is new cost.
- **Suggested correction:** return the identifier in the `signInAttempt` and `sessionInfo` replies, or cache it per isolate. If it is cached, note that server tests sharing an isolate must not depend on it.

### F19. The `signin_wait` wording cannot live in the static refusal table as written
- **Severity:** low
- **Where:** `stories/1-…`, task for `shared/refusal.ts` ("`signin_wait` wording 'Too many attempts. Wait ‹duration› before trying again.'").
- **What is wrong:** `REFUSALS` holds fixed messages (`shared/refusal.ts:4-40`), and `waitWording` is app JavaScript in `src/admin/setupClient.js:76`, not in `shared/`. Followed literally, API and agent callers (AD-22) receive a placeholder, or the wording rule is written twice, against standing rule 6.
- **Suggested correction:** the server message reads "Too many attempts. Wait before trying again." and carries `retryAfterSeconds`; the page composes the duration. Alternatively, move `waitWording` into `shared/` and have the server build the message with `refusalBody`'s `message` option.

### F20. The sign-in browser tests depend on another file's set-up
- **Severity:** low
- **Where:** `brownfield.md`, `browser-tests/` row ("tests set up first … and keep their order"); `stories/3-…`.
- **What is wrong:** each project has one server, shared by every spec file (`playwright.config.mjs:36-40, 50-59`). `setup.spec.mjs` already completes set-up with its own `ADMIN`. A `signin.spec.mjs` that also sets up is refused. One that does not depends on file order and on knowing another file's password.
- **Suggested correction:** give `signin.spec.mjs` its own servers, which the two-port test needs anyway, or export one fixture of test credentials that both files use, with the order stated.

### F21. The timing test is likely to be flaky, and its timeout is not set
- **Severity:** low
- **Where:** `SPEC.md`, CAP-6; `brownfield.md`, "Timing parity".
- **What is wrong:** medians of about 0.4 s hashes in Miniflare on a shared CI runner must agree within 100 ms. Running all of one case and then all of the other mixes drift with the difference being measured. `server-tests/vitest.config.mjs` sets no `testTimeout`, so the default 5 s applies unless the test file sets its own.
- **Suggested correction:** interleave known and unknown attempts (A, B, A, B), warm up first, and set a per-test timeout in the file.

### F22. D-6 does not say where the fixture was made, or that the probes use the product's code
- **Severity:** low
- **Where:** D-6; CAP-13; `stories/2-…`, D-6 task.
- **What is wrong:** "a hash made on one host verifies on the other" is proven only if the fixture was made on one of the two hosts, and if the probes call the built `verifyPassword`, not a copy of it. Neither is stated.
- **Suggested correction:** record the fixture's origin (for example, made under workerd by the probe bundle), build the probes from `server/auth/password.ts`, and record the host in the fixture file.

### F23. Any `#review=` hash passes the sign-in page, not only a valid reviewer link
- **Severity:** low
- **Where:** D-7 ("Reviewer hash links open without sign-in"); `stories/3-…`, matrix row "Reviewer link".
- **What is wrong:** `readReviewLink` returns `{}`, which is truthy, for a malformed `#review=` hash (`src/reviewClient.js:28`), and `Workspace` then renders the review page (`src/main.jsx:42-46`). Any signed-out visitor who adds `#review=x` skips the sign-in page. They reach the review page, not the prototype, but the rule should be explicit.
- **Suggested correction:** say that only a well-formed reviewer link skips sign-in, and that a malformed one shows the sign-in page.

### F24. The spec does not point to the drawn S-26 screen and leaves out the 44 px target rule
- **Severity:** low
- **Where:** `SPEC.md`, Constraints (UX section 10 bullet); `stories/3-…`, Boundaries.
- **What is wrong:** `design-canvas.md` line 32 lists a drawn "Sign in; two-step code on a phone" screen (S-26), and the spec never cites it. Standing rule 5 includes "44 px targets on the field shell", which matters for the account menu at iPhone size, but the constraint lists only contrast, focus, 16 px fields and zoom.
- **Suggested correction:** cite the canvas screen as the visual source for S-26, and add the 44 px target rule for the account menu trigger and Sign out.

### F25. The start-up flow for `/setup` after set-up, signed out, is not stated
- **Severity:** low
- **Where:** `stories/3-…`, I/O matrix; `brownfield.md`, `src/main.jsx` row.
- **What is wrong:** `src/main.jsx:64` renders the set-up page at `/setup` whatever the session. The matrix covers `/` but not `/setup` once set-up is closed: does a signed-out visitor see "Set-up is already complete" with its "Open Site Survey Design" link (`SetupPage.jsx:76`), or the sign-in page?
- **Suggested correction:** add a matrix row. Keeping "already complete" with its link leading to the sign-in page is the smallest change.

---

## Could not check

- Whether WebKit and Chromium in this repository's Playwright build keep a `Secure` `__Host-` cookie set over `http://127.0.0.1`. No browser was run.
- Whether five concurrent scrypt hashes in one Cloudflare isolate exceed the memory limit (F12). Nothing was deployed.
- Whether Wrangler 4's local HTTPS option and Playwright's `webServer.ignoreHTTPSErrors` behave as F16 assumes.
- The order in which Playwright runs spec files with `workers: 1` (F20). Not run.
- No tests, builds or smoke runs were executed. This review is from reading only.
- Not read: the spec's `.memlog.md`, `epic-1-context.md`, `deferred-work.md`, UX section 10 in full, and story 1.2's `SPEC.md` beyond its decisions list.
