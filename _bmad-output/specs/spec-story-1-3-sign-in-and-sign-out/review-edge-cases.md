# Review of the story 1.3 spec: edge-case hunter

- **Workflow:** `bmad-review`, one lens: edge-case hunter (`references/lens-edge-case-hunter.md`).
- **Reviewer:** an independent Claude Code session, 2026-11-20. It had no part in writing the spec and did not read the other reviewers' output.
- **Content reviewed:** every file in `_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/` as committed at `d7c5d84` on `story/1.3`: `SPEC.md`, `acceptance-trace.md`, `brownfield.md`, `stories.yaml`, `stories/1-…` to `stories/4-…`. This is a document review (docs that define behaviour), so the whole content was in scope. The paths it describes were traced through `site-studio/server/` (`api/router.ts`, `api/handlers.ts`, `api/clientAddress.ts`, `http.ts`, `httpsRedirect.ts`, `index.ts`, `auth/password.ts`, `objects/call.ts`, `objects/ObjectBase.ts`, `installation/Installation.ts`, `installation/setupStore.ts`), `site-studio/shared/` (`routes.ts`, `refusal.ts`, `setup.ts`), `site-studio/src/main.jsx`, `src/admin/setupState.js` and `site-studio/browser-tests/` (`playwright.config.mjs`, `serve.mjs`).
- **Measured against:** story 1.3 in `epics.md` (line 251), standing rules 13 to 15, the CA-07, CA-08, CA-43, CA-44, CA-47 and CA-58 rows, and AD-12 and AD-17 in `architecture.md`.
- **Severity:** the lens itself assigns none. Severities were added here because the task asked for them. **High** means a security property the story promises fails, or a user is locked out or wrongly let in. **Medium** means a stated behaviour is contradictory or undefined in a way an implementer will likely get wrong. **Low** means a narrower gap or a test gap.
- **Claims step:** no claims file was supplied, so the lens's step 4 did not run. The deletion step does not apply, because nothing is removed.

## Summary

| Severity | Count | Findings |
|---|---|---|
| High | 5 | 1, 2, 3, 4, 5 |
| Medium | 8 | 6 to 13 |
| Low | 9 | 14 to 22 |
| **Total** | **22** | |

## Findings

### 1. High: a browser holding the marker escapes the per-email count entirely, not only the per-email wait

- **Where:** `SPEC.md` D-2 (v) (line 136) and CAP-8 (line 62); spec 1's matrix, row "Marker valid for the email" (`stories/1-…md` line 45); brownfield implementation note 3 (line 33).
- **Unhandled case:** D-2 (v) says "An attempt carrying a valid marker for the entered email counts per address only", with no condition. CAP-8 and spec 1's matrix give the exemption only "while that email is in a wait". So the case "valid marker, email **not** waiting" is an implicit branch that the documents answer two ways. D-3 also keeps the marker after sign-out and holds it for the account last signed in, so whoever uses that browser next has it.
- **Sequence:**
  1. Person A signs in on a shared office or kiosk browser and signs out. The marker for A stays (D-3).
  2. Person B uses the same browser and tries passwords for A's email.
  3. Under D-2 (v), none of B's failures count for A's email. Only the address limit applies: about 20 attempts per 15 to 30 minutes (the gap in the spec's own Notes).
  4. B can keep guessing indefinitely, at roughly 40 to 80 guesses an hour. The 5-per-email limit of CA-07 never applies to B.
- **What goes wrong:** CA-44 was meant to stop someone from locking the owner out. As written, it also removes the per-email limit for anyone with physical access to a browser the owner once used.
- **Suggested correction:**
  - Exempt a marker holder from the email's **wait**, not from its **count**.
  - Give marker-held attempts their own count, keyed by the marker's identity (for example a random marker id inside the signed value) and using the same 5-then-doubling rule.
  - After that count's limit, treat the marker as absent.
  - State which reading applies and add the "marker valid, email not waiting" row to spec 1's matrix.

### 2. High: one shared address bucket lets anyone lock every account, marker holders included

- **Where:** `SPEC.md` assumption "The network address is set-up's `clientAddressKey` … absent gives one shared bucket" (line 122); CAP-7 and CAP-8; `server/api/clientAddress.ts` lines 1–14 and 56–58.
- **Unhandled case:** `clientAddress.ts` justifies the shared `unknown` bucket because it "only makes the count stricter". That holds for set-up, which has one user. For sign-in it makes the address limit installation-wide. The same holds where many people share one address (an office NAT, or carrier-grade NAT on IPv4). CA-44 deliberately leaves marker holders subject to the address limit, so the marker gives no protection here.
- **Sequence (self-hosted):** the bundled web server does not yet set `CF-Connecting-IP` (stories 2.21 and 2.22 are non-goals), so every request falls in `unknown`.
  1. Anyone who can reach the sign-in page sends 20 wrong sign-ins within 15 minutes.
  2. Every account now waits, administrators with markers included.
  3. The attacker sends one more wrong attempt each time the wait ends. Each one is counted, and the wait doubles to 15 minutes.
  4. The installation stays locked for as long as the attacker keeps this up, at a cost of about four requests an hour.
- **Second, related case:** where a self-hosted proxy passes a client-supplied `CF-Connecting-IP` through unchanged, an attacker gets a fresh address bucket per request. Only the per-email limit then holds, and per finding 1 a marker holder has no per-email limit at all.
- **What goes wrong:** the whole installation can be denied sign-in. The spec promises (CAP-8) that someone who knows an email cannot lock its owner out of a browser the owner has signed in from, and that promise fails.
- **Suggested correction:**
  - Do not apply the address wait to an attempt whose address is `unknown` when it carries a valid marker.
  - Or apply no address limit at all when the address is unknown, relying on the per-email and per-marker counts.
  - Record that self-hosted sign-in limits depend on story 2.22, and add a server test for 20 failures in the `unknown` bucket followed by a marker holder's sign-in.

### 3. High: installations on one host with different ports receive, and can set, each other's session cookies

- **Where:** `SPEC.md` CAP-3 intent "a session … that only this installation receives" (line 39); CAP-10 (line 68); D-1 (line 135); acceptance-trace row 17.
- **Unhandled case:** browsers scope cookies by host, not by port, and the `__Host-` prefix does not change that. D-1's identifier keeps the two installations' cookie **names** apart, but every cookie for the host is still sent to every port.
- **Sequence:**
  1. Installation A runs on `https://intranet.example:8443`; installation B, or any other service, runs on `https://intranet.example:9443`.
  2. A user signs in to A.
  3. The browser then sends A's session cookie, under A's identifier, with every request to B's port. B's operator, or anyone who has compromised B, can read A's session token and replay it to A.
  4. The other way: B's server replies with a `Set-Cookie` named `__Host-…-<A's identifier>` (`Secure; Path=/`, no `Domain`) that carries a token for the attacker's own A session. The browser stores it for the host, and the user is now silently signed in to A as the attacker. This is a login CSRF that standing rule 13's origin check does not see, because no cross-site request is made to A.
- **What goes wrong:** CAP-3's intent is false for the same-host case, which CAP-10 explicitly supports. The CAP-10 test proves only that both sessions survive, not that they are isolated.
- **Suggested correction:**
  - State in CAP-3 and CAP-10 that installations on one host name are not isolated from each other's cookies, and that separate host names are needed for isolation. Put that in the self-hosting notes.
  - Keep the CAP-10 test, renamed to what it proves.
  - Cookies cannot fix this, so do not claim more than the test shows.

### 4. High: the stand-in hash's origin is unspecified, and nothing refuses a "correct" password for an email with no account

- **Where:** `SPEC.md` CAP-6 (line 49) and assumption 1 (line 116); brownfield `server/auth/password.ts` row ("stand-in hash (fixed salt and hash, current parameters)"); spec 1's matrix, row "Unknown or inactive email"; D-6's committed known-answer fixture (line 140).
- **Unhandled case:** a "fixed stand-in hash" is most easily made by hashing some password once and committing the salt and hash, and D-6 commits exactly such a fixture with a known test password. Nothing says that a stand-in check which **succeeds** must still be treated as a failure. Nothing says that `completeSignIn` must refuse success on a stand-in ticket.
- **Sequence:**
  1. The implementer reuses the D-6 fixture, or any constant whose password is in the repository, as the stand-in.
  2. An attacker signs in with any email that has no account and that password.
  3. `verifyPassword` returns true, and the Worker calls `completeSignIn` with outcome "success" on a ticket that has no user.
  4. Depending on the code, this either creates a session for a null or garbage user id, returns 200, or throws a 500.
- **What goes wrong:** the reply distinguishes "no account" from a normal refusal, which is a disclosure NFR-5 forbids. At worst it yields a session that the story 1.8 gate later has to treat as an account.
- **Suggested correction:**
  - Make the stand-in hash 32 random bytes that are not derived from any password. A random salt with a random "hash" still costs one full scrypt run, so the timing is unchanged.
  - Mark stand-in tickets in the object, and have `completeSignIn` refuse success on them with the ordinary `signin_failed`.
  - Add a server test that sends the stand-in path a password the test claims matches, and finds `signin_failed`.
  - Forbid reusing the D-6 fixture as the stand-in.

### 5. High: a stale, unknown or expired cookie has two contradictory answers on the session read, and the page may then open the prototype

- **Where:** spec 2's matrix, rows "After sign out" (`not_signed_in` 401 on the session read) and "Foreign cookie" ("treated as signed out" with `not_signed_in`) (`stories/2-…md` lines 48–49); spec 1's matrix, row "Session read" (refused 30 days after sign-in, `not_signed_in`); `SPEC.md` CAP-1 and D-7 ("When the session cannot be read, the prototype opens", lines 34 and 141); spec 3's matrix, row "Session unknown"; `src/main.jsx` `Start()` and `src/admin/setupState.js` `askState`.
- **Unhandled case:** with no cookie, the session read answers 200 `{ signedIn: false }`. With a cookie that no longer matches a session (signed out in another browser, expired at 30 days, a token from a re-created installation, a foreign or garbled value), it answers 401. The existing start-up pattern in `askState` maps every non-OK response to "unknown", and D-7 opens the prototype on "unknown". Nothing tells the server to clear the dead cookie.
- **Sequence:**
  1. The user's session reaches 30 days. The browser drops the cookie at the same moment, but clock skew between browser and server, or a session ended on the server (a re-created test installation; later, story 1.6's "sign out everywhere"), leaves the browser sending a dead token.
  2. The session read answers 401 `not_signed_in`.
  3. A page client built like `askState` treats the 401 as "cannot be read" and opens the prototype with no account. It does this on every visit, because the cookie is never cleared.
- **What goes wrong:** a signed-out person sees the prototype instead of the sign-in page. The header has no account to show, and the account-menu behaviour for that case is not specified either.
- **Suggested correction:**
  - The public session read answers 200 `{ signedIn: false, installationName }` for an absent, unknown, foreign, malformed or expired cookie, and clears a dead cookie with the full clearing attributes (finding 15).
  - `not_signed_in` is kept for routes that need a session.
  - The page maps only network failures, timeouts and 5xx to D-7's "cannot be read".
  - State the session read's timeout, as `STATE_TIMEOUT_MS` does for set-up.
  - Add matrix rows for an expired cookie and a garbled cookie.

### 6. Medium: sign-out has unhandled failure paths that can leave a person believing they are signed out

- **Where:** spec 2's matrix, rows "Sign out" and "After sign out" (sign-out with the old cookie is refused `not_signed_in`); `SPEC.md` CAP-5 ("ends the session for good"); constraints on `callObject` (writes are retried only on the shown version-stop reason, line 92); `stories.yaml` spec 2; `server/objects/call.ts` lines 45–49; `server/index.ts` lines 38–43.
- **Unhandled cases:**
  - **Already-dead cookie.** The session ended elsewhere, and the user presses Sign out. The server refuses `not_signed_in`. If that refusal carries no clearing `Set-Cookie`, the dead cookie stays in the browser, and finding 5 follows.
  - **Object unavailable.** Sign-out meets `updating` (503) twice, or a bare object reset, which `callObject` rethrows for a non-idempotent write and `route()` turns into `internal_error` 500. The session row survives. If the page then shows the sign-in page anyway, a user on a shared computer walks away from a session that is still valid for up to 30 days.
- **Suggested correction:**
  - Sign-out always clears the cookie, whether or not a session matched, and answers success when no session matched.
  - `endSession` (deleting by token hash) is safe to run twice, so mark it retryable after a bare reset.
  - The page shows the sign-in page only after the server confirmed the sign-out. On failure it says "You are still signed in. Try again."
  - Add these rows to the spec 2 and spec 3 matrices.

### 7. Medium: the session read is a GET that writes last-use, and it is marked idempotent

- **Where:** `SPEC.md` assumption "last use is recorded at sign-in and on the session read the app makes when it opens" (line 125) and its Note on D-4; brownfield `server/objects/call.ts` row ("Mark the session read … `idempotent`"); standing rule 13 (`epics.md` line 145); `server/objects/call.ts` lines 20–23 ("True for an operation that changes nothing").
- **Unhandled case:** standing rule 13 requires every request that changes anything with a session cookie to come from the app's origin and carry its header. The session read changes the stored last-use time, yet it is public, not `appOriginOnly`, and marked idempotent.
- **Sequence:**
  1. Another site opens a top-level link to `/api/v1/session` (or whatever the route is named), and `SameSite=Lax` sends the cookie.
  2. Last use is updated without any deliberate action by the user.
  3. When story 1.6 adds the 24-hour idle limit (CA-18), any site the user visits can keep their session alive. AD-12 says only deliberate actions count as use.
- **Suggested correction:** record last use in story 1.3 only at sign-in. Or move the write to a separate `appOriginOnly` POST that the app sends when it opens. Either way, keep the GET read-only, so that marking it idempotent stays true.

### 8. Medium: when a count below the threshold clears is unspecified, and either reading has a cost

- **Where:** `SPEC.md` CAP-7 and D-2 (i) ("An email's count clears 15 minutes after its wait ends"); spec 1's matrix, row "Email cleared"; `server/installation/setupStore.ts` lines 55–63 and 254–266 (the pattern spec 1 is told to copy).
- **Unhandled case:** an email with 1 to 4 failures has no wait, so "15 minutes after its wait ends" has no defined meaning for it. There are two possible readings.
  - **Never clears** ("in a row" read literally). Every random email an attacker sends leaves a row forever: unbounded growth of installation-object storage, with no limit stated. Separately, 4 failures from months ago plus one typo today puts the owner straight into a wait.
  - **Clears 15 minutes after the last failure** (what `addressClearsAt` gives when the wait is 0). An attacker who sends 4 guesses per email every 15 minutes, from addresses that rotate under the address limit (each IPv6 /64 is its own bucket), never triggers the email wait. That is about 384 guesses per email per day.
- **Also:** `deleteClearedAddresses` reads every row on every attempt. Copied to per-email rows that an attacker can multiply, each sign-in becomes a full table scan inside the single installation object, which every request consults (AD-17).
- **Suggested correction:**
  - State the clearing rule for counts below the threshold explicitly, for example 24 hours after the last failure, which bounds both risks.
  - Store a `clears_at` column with an index and delete with `WHERE clears_at <= ?`.
  - Add matrix rows for "4 failures, then 15 minutes, then 1 failure" and "a random email's row after its clearing time".

### 9. Medium: the one-at-a-time hash queue has no length limit, no timeout, no release on cancellation, and no stated ticket lifetime

- **Where:** `SPEC.md` D-5 and constraint line 89; brownfield "Memory (D-5)" note; spec 1's matrix, row "Ticket missing, reused or expired" (`invalid_input` or `signin_failed`).
- **Unhandled cases:**
  - **A long queue.** Under workerd (self-hosted) a single isolate typically serves everything. A password-spraying run from many addresses (each IPv6 /64 is a fresh bucket, and each new email has 5 free attempts) puts hundreds of stand-in hashes of about 0.4 s each in the queue. A legitimate sign-in, and set-up's hash, waits behind all of them. 300 queued hashes means about 2 minutes.
  - **A ticket that expires behind the queue.** The spec states no ticket lifetime. If it is the 5 minutes set-up uses, a long queue expires the ticket, and a **correct** password then gets `signin_failed` ("That email and password do not match."), which is untrue and confusing.
  - **A cancelled request.** If a client disconnects while its hash is queued and the runtime cancels the request, a queue built on a promise chain without `finally` never releases its slot, and every later sign-in and set-up in that isolate hangs.
- **Suggested correction:**
  - Bound the queue, for example at 20 waiting. Beyond it, refuse with a busy refusal (503 with `Retry-After`) that is identical for every email.
  - Release the slot in `finally`.
  - Set the ticket lifetime above the longest queue wait, and give an expired ticket after a correct password a distinct internal error, not `signin_failed`.
  - Test a cancelled queued request.

### 10. Medium: "over-long" is not defined in the same measure set-up used, so a valid password can be refused

- **Where:** `SPEC.md` assumption "The sign-in schema refuses only a missing, empty or over-long email or password" (line 117); brownfield `shared/signin.ts` row; `shared/setup.ts` lines 85–92 (set-up counts code points **after** NFKC, at most 128).
- **Unhandled case:** set-up accepted any password whose NFKC form has at most 128 code points.
  - **Emoji.** A 128-emoji password is 256 UTF-16 units. A bound of `z.string().max(128)` counts UTF-16 units and refuses it.
  - **Shrinking under NFKC.** Some input shrinks under NFKC (for example decomposed Hangul jamo composing into syllables). A password of more than 128 raw code points that set-up accepted is refused by a bound on raw length.
  - **Sequence:** the administrator who set such a password gets `invalid_input` on the password field and can never sign in.
- **Suggested correction:** bound the raw input generously (for example 1,024 UTF-16 units, or 4 × `PASSWORD_MAX` code points), so that it is always at least anything set-up accepted. Test sign-in with a 128-emoji password and with an NFKC-shrinking one. Bound the email at `EMAIL_MAX` after `normaliseEmail`, as set-up does.

### 11. Medium: the session read and sign-in are undefined before set-up, when there is no settings row and no installation name

- **Where:** spec 2's matrix (both session-read rows assume "administrator exists"); `SPEC.md` assumption on the public read route (line 121); `setupStore.ts` (the `settings` row is written only by `createFirstAdministrator`).
- **Unhandled case:** the routes are public, so they can be called while set-up is open (direct API use, or a page that reads the session before or in parallel with the set-up state).
  - **Session read.** A store that reads `installation_name` with `.one()` throws, giving `internal_error` 500. If the reply schema requires a string, the router gives `reply_schema_mismatch`, also 500.
  - **Sign-in.** It counts attempts and runs stand-in hashes on an installation with no users, which is harmless, but the expected reply is unstated.
- **Suggested correction:** add matrix rows for set-up open. Either the session read answers `{ signedIn: false, installationName: null }` (a nullable schema field), or both routes refuse with `setup_closed`'s counterpart, a new `setup_open` refusal. Test both rows.

### 12. Medium: caching the installation identifier in isolate memory breaks when the object is re-created, and in the server tests

- **Where:** brownfield "Installation identifier (D-1)" note ("an isolate may keep it, as it never changes", line 42); `SPEC.md` assumption on the identifier (line 124); standing rule 8 ("Pre-release installations are re-created, not converted", line 123).
- **Unhandled case:** "never changes" holds for one object's life. Pre-release installations are re-created by deleting the object's storage, and the server tests (`@cloudflare/vitest-plugin`) reset object storage between tests while module-level state in the isolate survives.
- **Sequence:**
  1. An isolate caches identifier X.
  2. The object is re-created, with storage reset, and gets identifier Y.
  3. A cached isolate sets and reads cookies named for X. A fresh isolate uses Y.
  4. On Cloudflare, requests alternate between isolates, so users are signed out at random. In tests, the second test in a file sees cookies under the first test's name.
- **Suggested correction:** do not cache the identifier, which costs one cheap object read (and AD-17 already has one per request). Or cache it together with the object's `createdAt` and drop the cached value whenever a reply shows a different one. Add a server test across a storage reset.

### 13. Medium: the marker cookie's name and attributes are not specified, so two installations on one host overwrite each other's marker

- **Where:** `SPEC.md` D-3 and CAP-8 (an "`HttpOnly`, `Secure`, `__Host-` cookie", with no name, no `SameSite` and no `Max-Age` attribute named); brownfield `server/auth/` row; spec 2's "Always" list.
- **Unhandled case:** D-1 puts the installation identifier only in the session cookie's name. If the marker is named, say, `__Host-ssd-marker`:
  1. A user signs in to installation A on port 8443, then to installation B on port 9443 of the same host.
  2. B's marker replaces A's, because cookies are not port-isolated (finding 3).
  3. On A, the marker's signature fails, so it is treated as no marker (spec 1's matrix), and CA-44 protection is silently lost on A.
- **The same gap also leaves open:** `SameSite` (Lax or Strict), and whether the 1-year life is set as `Max-Age` or `Expires`.
- **Suggested correction:** name the marker `__Host-<prefix>-m-<installation id>` (or similar), with `Path=/`, `SameSite=Lax` and `Max-Age=31536000`. Add it to the CAP-10 browser test: after signing in to both ports, both markers verify.

### 14. Low: `jsonResponse` cannot carry two `Set-Cookie` headers

- **Where:** brownfield `server/http.ts` row ("`jsonResponse` already accepts headers … Use it for `Set-Cookie`"); `server/http.ts` lines 9–11 (`headers: Record<string, string>`).
- **Unhandled case:** a sign-in sets the session and the marker cookies. It may also need to clear a stale session cookie. A `Record` can hold one `set-cookie` value, and joining values with a comma is not valid for `Set-Cookie`. The handlers row of the brownfield does say "several at once", but the http row points at a function that cannot do it.
- **Suggested correction:** let handler results carry a `Headers` object, or a list of cookies appended with `headers.append("set-cookie", …)`. Test that both cookies survive `withHsts`'s copy (`new Response(body, response)` keeps them, but nothing tests it yet).

### 15. Low: clearing a `__Host-` cookie needs its full attributes, or the browser ignores it

- **Where:** spec 2's "Always" list ("cleared with `Max-Age=0` at sign-out"); CAP-5.
- **Unhandled case:** browsers reject a `Set-Cookie` for a `__Host-` name that lacks `Secure` or `Path=/`, or that has a `Domain`. That includes the clearing one. A clearing header written as `__Host-…=; Max-Age=0` is silently ignored, so the cookie stays in the browser, although the server row is gone.
- **Suggested correction:** state the clearing header in full (`__Host-…=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`). In spec 3, check `context.cookies()` after Sign out in both browsers.

### 16. Low: a sign-in in another tab ends the session that an open tab still shows

- **Where:** `SPEC.md` assumption "Signing in from a browser that already holds a session ends that earlier session" (line 119); CAP-4; spec 3's matrix.
- **Unhandled case:**
  1. Tab 1 is signed in as X.
  2. In tab 2, someone opens the sign-in page directly and signs in as Y. X's session ends, and the cookie jar now holds Y's token.
  3. Tab 1 still shows X in the account menu while every request it sends carries Y's cookie.
  4. Sign out in tab 1 ends Y's session.
- **Suggested correction:** re-read the session when the page becomes visible again (`visibilitychange`), and on any `not_signed_in` reply. Add a two-tab row to spec 3's matrix, or record this as accepted until story 1.6.

### 17. Low: infrastructure failures leave counts raised, and leave sessions that no cookie names

- **Where:** brownfield "Order of a sign-in attempt" (steps 3 to 6); `server/index.ts` lines 38–43; `server/objects/call.ts` lines 45–49.
- **Unhandled cases:**
  - **A correct password lost.** The attempt is counted, then scrypt throws (memory) or `completeSignIn` meets a bare reset. The owner gets 500 with the count still raised. Five such failures in a row put the owner into a wait.
  - **A session with no cookie.** If `completeSignIn` committed before the reset, a session row exists that no cookie names.
  - **No clean-up.** Nothing deletes session rows past 30 days either, so rows accumulate.
- **Suggested correction:** accept the raised count, but state it. Delete expired sessions (older than 30 days) during `completeSignIn` or `sessionInfo`, using an index on the sign-in time. State that orphaned rows expire at 30 days.

### 18. Low: emails are not Unicode-normalised, so one address typed two ways is two emails

- **Where:** `SPEC.md` CAP-2 and the `normaliseEmail` constraint; `shared/setup.ts` lines 74–76 (trim and lower-case only; D-9 normalises names and passwords, not emails).
- **Unhandled case:** an email with a non-ASCII local part or domain, entered in composed form at set-up and decomposed at sign-in (different keyboards or IMEs), does not match. That attempt takes the stand-in path and is counted under a different email key.
- **Suggested correction:** decide this explicitly. Either add NFC to `normaliseEmail` (which changes story 1.2's stored value; pre-release installations are re-created), or record that emails are compared exactly after trimming and lower-casing.

### 19. Low: no test for a long account name in the iPhone header

- **Where:** CAP-4; spec 3's matrix; brownfield `src/App.jsx` row ("Must fit the iPhone viewport").
- **Unhandled case:** a name of 80 characters, the maximum in `PERSON_NAME_MAX`, or a name in wide characters, in the account menu of the iPhone 15 viewport may overflow the header. The existing `expectNoSidewaysScroll` helper would catch it only if a test used such a name.
- **Suggested correction:** add a matrix row in which an 80-character name is truncated with its full text available in the menu and no sideways scroll, plus the same at 200% zoom.

### 20. Low: the HTTPS fallback in D-10 leaves the Playwright web-server checks on `http://`

- **Where:** `SPEC.md` D-10; spec 3's first task; `browser-tests/playwright.config.mjs` (`url: http://127.0.0.1:<port>/api/v1/setup/state`, `baseURL: http://…`).
- **Unhandled case:** if WebKit drops the `Secure` cookie and the servers move to HTTPS, three things in the config still assume plain HTTP. The `webServer.url` readiness checks still poll `http://`, and that option has its own `ignoreHTTPSErrors`, separate from the browser's. Both `baseURL`s still need changing. The new second pair of servers for CAP-10 needs the same. Otherwise the run times out after 120 s waiting for servers that are up.
- **Suggested correction:** list these three changes in spec 3's D-10 task.

### 21. Low: start-up routing misses a hash change and the done page's link

- **Where:** `SPEC.md` D-7 and D-9; spec 3's matrix, rows "Reviewer link" and "Set-up done"; `src/main.jsx` lines 36–46 and 53–67.
- **Unhandled cases:**
  - **A review link opened on the sign-in page.** Today only `Workspace` observes `hashchange`. A signed-out person on the sign-in page who opens a review link in the same tab (only the hash changes, so the page does not reload) stays on the sign-in page, contrary to D-7.
  - **The done page's Sign in link.** `SetupPage` was rendered with `initialState="open"`. If D-9's link is client-side navigation rather than a full load of `/`, `Start()` never re-reads the state, and the set-up page stays.
- **Suggested correction:** decide whether a review link applies before the session check on every `hashchange`, not only at load. Make the Sign in link a plain `<a href="/">`. Add both rows to spec 3's matrix.

### 22. Low: what a sign-in ticket is bound to is unstated

- **Where:** `SPEC.md` assumption 1 (line 116); spec 1's matrix, rows "Complete, correct" and "Ticket missing, reused or expired"; brownfield step 5.
- **Unhandled case:** to remove "its own attempt" from the address count (D-2 iv), and to clear the right email's count, `completeSignIn` must know the address, the email key, the user id or stand-in flag, and the presented session's hash from the moment the attempt was counted. If any of these comes from the Worker's second call rather than from the stored ticket, a mismatch goes undetected.
  - **Sequence:** a bug, or a future caller, completes a ticket issued for email E with E′. The wrong count is cleared, or a session is created for the wrong account.
  - **Later stories:** stories 1.6 and 1.9 will add password changes and deactivation between the two calls. A ticket that does not record which hash was checked lets a check against an old password create a session after the password has changed.
- **Suggested correction:** state that the ticket stores, inside the object, the email key, the address key, the user id or stand-in flag, the stored hash's identity, and the presented session's hash. `completeSignIn` takes only the ticket and the outcome, and re-checks that the account is still active with the same hash. Add a matrix row for a password changed between the two calls, for later stories to fill in.

## Not checked

- Whether Cloudflare routes requests sent at once from one client over several connections to one isolate or to several. Finding 9 and the deployed CA-43 check depend on this.
- Whether workerd and Cloudflare cancel a queued request's promise when the client disconnects (finding 9). This was reasoned, not run.
- Whether WebKit keeps a `Secure` or `__Host-` cookie on `http://127.0.0.1`. D-10 already defers this to spec 3.
- Browsers' handling of `__Host-` cookies across ports (findings 3 and 13). This comes from the cookie standard, not from a test run here.
- Whether any existing self-hosted configuration (`deploy/selfhost/config.capnp`) sets or strips `CF-Connecting-IP` (finding 2). Only `smoke.mjs` was searched.
- The UX specification's S-26 and section 10, `epic-1-context.md` and `deferred-work.md`. These were not read, so no finding concerns screen layout beyond what the spec states.
- Standing rules other than 12 to 15, and the definition of done. Only the parts the spec cites were read.
- Nothing was built or run. Every finding comes from reading the documents and tracing the code statically.
