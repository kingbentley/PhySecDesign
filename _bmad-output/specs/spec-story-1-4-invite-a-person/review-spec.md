# Review of the story 1.4 spec: Invite a person

- **Reviewed:** `SPEC.md`, `acceptance-trace.md`, `brownfield.md`, `stories.yaml` and the three files under `stories/`, as committed in `e8663bb` on `story/1.4`.
- **Workflow:** `bmad-review` with three lenses: adversarial (ADV), edge cases (EDGE) and verification gaps (VER). One reviewer ran them one after another. No subagents were used, so the lenses are not independent of each other.
- **Checked against:**
  - story 1.4 in `epics.md`, with its 16 criteria, standing rules 1–15, the definition of done, and choices CA-03, CA-09, CA-10, CA-55 and CA-57;
  - AD-12, AD-16, AD-17 and AD-22 in `architecture.md`;
  - UX S-27 and S-30 (sections 17.2 and 17.4);
  - FR-67 in `prd.md`;
  - `deferred-work.md`;
  - the code in `site-studio/` at `6815a7e`, which is the same as HEAD for `site-studio/`.
- **Not read, on purpose:** the spec folder's `.memlog.md` and the sibling session's handover note. The brief asked for a review that does not know how the spec was written.
- **Severities:** blocker (fix before building), should fix, minor.

Several proposed changes fall inside the `<frozen-after-approval>` blocks of the three spec files. Kevin has to agree to those before they are applied.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Blocker | 1 | 1 |
| Should fix | 7 | 2–8 |
| Minor | 21 | 9–29 |

**Editing damage.** I scanned every file for:

- an odd number of backticks or quotation marks on a line;
- unbalanced parentheses or brackets;
- unbalanced `**`;
- repeated words;
- stray non-ASCII characters;
- unclosed `<frozen-after-approval>` tags.

Each spec file has one opening and one closing frozen tag. The only unbalanced parentheses are in `stories.yaml`, where a folded value wraps across lines. Non-ASCII characters are limited to the intended — – − … → ‹ ›. I found no missing characters or broken tags. Three sentences read as if they were changed by editing; they are in finding 22.

---

## Blocker

### 1. The declaration sweep test cannot pass unchanged (VER, ADV)

- **Where:** `SPEC.md:166`, `brownfield.md:32`; contradicted by `site-studio/server-tests/signin-declarations.test.ts:26-36`.
- **Evidence:**
  - The SPEC says "the existing sweep test must pass unchanged". `brownfield.md` says `signin-declarations.test.ts` "must pass unchanged with the new routes".
  - That file's third test pins the list of routes flagged `readsSessionCookie` to exactly `session`, `signIn` and `signOut`.
  - Spec 2 (`2-invitation-routes-and-page-header.md:30,32`) requires `invite` and `acceptInvitation` to be `readsSessionCookie`. That test will then fail.
  - Two requirements of the spec therefore cannot both be met. The definition of done says "the existing tests still pass", so a developer who keeps every existing test unchanged is stuck.
- **Proposed change:**
  - Make this the third pinned list that changes, beside the two that `brownfield.md` "Existing tests this story must touch" already names: "`signin-declarations.test.ts`: the pinned list of cookie-reading routes gains `["acceptInvitation","POST"]` and `["invite","POST"]`. The test is renamed, and the sweep itself (the first test) passes unchanged."
  - Reword `SPEC.md:166` to match.

## Should fix

### 2. The page's session read drops the new fields; the spec changes the wrong function (ADV, EDGE)

- **Where:** `SPEC.md:81` (CAP-9); spec 3 `3-invite-panel-invitation-page-and-browser-tests.md:35`; `brownfield.md:10`; code `site-studio/src/admin/setupState.js:94-117`.
- **Evidence:**
  - `isSessionReply` already ignores extra fields. The real gap is in `readSession`: it returns a new object, `{ kind: 'signedIn', name, installationName }`, so `accountId` and `role` never reach `main.jsx`.
  - Spec 3 says only "`isSessionReply` accepts the two new fields", which is already true.
  - The spec also does not say what a signed-in reply without `accountId` or `role` means. The page's start-up reads fail closed (story 1.3's D-7, amended twice), so leaving it open conflicts with that.
  - `brownfield.md:10` says "so older pages keep working". With one build and one bundle, that consequence does not apply.
- **Proposed change:** in spec 3's Always, write:
  - "`readSession` returns `accountId` and `role` for a signed-in reply."
  - "`isSessionReply` requires, for `signedIn: true`, a string `accountId` and a `role` of `administrator` or `standard`; anything else is `unknown`, which shows 'Sign-in cannot be checked'."
  - "`tests/signin-client.test.mjs` gains those cases."
  - Strike "so older pages keep working" in `brownfield.md:10`.

### 3. The secret stays in the address bar until the start-up reads finish, and indefinitely on some pages (EDGE, ADV; security)

- **Where:** spec 3 `:31`; `SPEC.md:45` (CAP-2), `:127`; code `site-studio/src/main.jsx:102-111,143-152`.
- **Evidence:**
  - `Start` waits for the set-up state read, which can take up to 5 s (`STATE_TIMEOUT_MS`). When set-up is closed it then waits for the session read before it renders any page.
  - Spec 3 has the invitation page read the fragment and call `replaceState`. A page component only mounts after those reads, which leaves these cases:
    - With a slow server, the secret sits in the address bar for up to about 10 s.
    - If the set-up state cannot be checked, "Set-up cannot be checked" shows at every address, the fragment is never removed, and Try again leads on to the page later.
    - If the session read cannot be checked, `Signed` shows "Sign-in cannot be checked" instead of the invitation page. This contradicts "whatever the session".
    - Where there is no server (`none`), the prototype opens with `#<secret>` still in the address bar.
  - The browser test checks the address bar only after the page has opened, so it passes in all of these cases.
  - Standing rule 14 requires the page to remove the secret "once it is read".
- **Proposed change:** in spec 3, write:
  - "At module start, before any read, if the path is `/invite` or `/invite/`, `main.jsx` takes the fragment into memory and calls `history.replaceState` to the bare path. On every later page (set-up open, cannot be checked, no server) the fragment is already gone."
  - "For `/invite`, a closed set-up does not wait on the session read: the invitation page renders whatever the session read answers, including `unknown`."
  - Add browser tests:
    - the set-up state read mocked to 500 at `/invite#…`, where the address bar has no fragment;
    - the session read mocked to 500, where the invitation page still shows.

### 4. Which Playwright server the invitation tests use is unstated, and the default breaks `setup.spec.mjs` (VER)

- **Where:** spec 3 `:74`, `:90`; `brownfield.md:36`; code `site-studio/browser-tests/playwright.config.mjs:23,73` and `browser-tests/setup.spec.mjs:61`.
- **Evidence:**
  - With `workers: 1` and no full parallelism, Playwright runs the spec files in name order, so `invitation.spec.mjs` runs before `setup.spec.mjs` and `signin.spec.mjs`. I took this from Playwright's documented behaviour; I did not run it.
  - The project's `baseURL` server (8791/8792) belongs to `setup.spec.mjs`, whose first test expects set-up to still be open.
  - An invitation test that uses `page.goto('/')` and completes set-up there therefore makes `setup.spec.mjs` fail.
  - `brownfield.md:36` says "set-up runs once per server, so each invitation test uses its own email", but names no server.
- **Proposed change:** in spec 3, write: "`invitation.spec.mjs` uses `signInServers(project)[0]` and `completeSetup` with `signin.spec.mjs`'s `ADMIN`, never the `baseURL` server. Accounts it creates use emails that no `signin.spec.mjs` test uses."
  - Alternatively, move the shared helpers (`completeSetup`, `signIn`, `expectAccessible`, `setVisibility`) into a helper module so both files share them.

### 5. The `/invite` header is never checked on the real asset path; D-12's reasoning rests on a fake (VER)

- **Where:** `SPEC.md:158` (D-12); spec 2 `:36`, `:58`, `:88`; spec 3 `:90`; code `site-studio/server/assets.ts:37-58`, `server-tests/api.test.ts:214`, `server-tests/worker-first.test.ts:24`, `browser-tests/serve.mjs:38-53`.
- **Evidence:**
  - The server tests run `handleRequest` against a hand-made `ASSETS` stub that answers like the self-hosted disk service: 404 for `/invite`, which `serveAsset` then turns into `/index.html`.
  - On Cloudflare (`not_found_handling: single-page-application`), `ASSETS.fetch('/invite')` answers `index.html` with 200 directly, and `/invite/` goes through `fetchPath(…/invite/index.html)` and its redirect branch.
  - So a header added only in `serveAsset`'s 404 fallback branch would pass every server test and be missing on Cloudflare. D-12 says the server tests "exercise the same code path", but they exercise the same Worker code with different asset replies.
  - The browser servers run `wrangler dev` on the built Cloudflare configuration, so they would show the real behaviour. Spec 3 asserts no header there.
  - `smoke:selfhost` is not in spec 3's Verification. Standing rule 7 and the definition of done ask for it.
- **Proposed change:**
  - Spec 2: "The header is added in `handleRequest`/`route` by request path (`/invite`, `/invite/`), on every response for that path, whichever `serveAsset` branch answered. Route tests cover both an SPA-style stub (200 `index.html`) and a disk-style stub (404, then `index.html`)."
  - Spec 3: "`page.goto('/invite')` and `page.goto('/invite/')` responses carry `referrer-policy: no-referrer`; `page.goto('/')` does not."
  - Add `npm run smoke:selfhost` to spec 3's Verification, and have the smoke suite check `GET /invite` for the header.
  - D-12 itself stands.

### 6. "No route besides set-up and accept leads to an insert into `users`": no method is given, so the test may prove nothing (VER)

- **Where:** `SPEC.md:71` (CAP-6); spec 2 `:84` (criterion 8); trace row 8.
- **Evidence:**
  - Handlers call object operations by string name (`callObject(…, "createFirstAdministrator", …)`), so nothing static ties a route to an operation.
  - Spec 2's criterion says "Given `ROUTE_LIST` and the installation object's registered operations, only `setup` and `acceptInvitation` reach an operation that inserts into `users`". Without a method, the easiest test is a hand-written map from route to operations, which proves nothing.
  - Spec 1's building block, which runs each operation with fixture input and compares `users`, is sound.
- **Proposed change:** in spec 2, write: "A route sweep calls every route in `ROUTE_LIST` with valid input, signed in as an administrator where a cookie is read, with `callObject`'s operation names recorded. It asserts that only `setup` calls `createFirstAdministrator`, only `acceptInvitation` calls the operation `acceptInvitation`, and the `users` row count changes only for those two."
  - Also give the route id and the object operation different names (for example route `acceptInvite`, operation `acceptInvitation`). Today one name means two things in CAP-6, spec 2 and the trace.

### 7. Several outcomes of the invite and accept requests have nothing on screen, including a dangerous one (EDGE)

- **Where:** spec 3 `:30`, `:33`; spec 2 `:57`.
- **Evidence:**
  - Spec 3 maps only these outcomes:
    - the read's network failure, timeout or 5xx;
    - `invitation_unusable`;
    - `signin_busy`;
    - panel refusals that name a field;
    - `not_signed_in`.
  - Nothing is said for:
    - the panel's network failure or timeout, `internal_error`, `updating`, or `administrator_only` (refusals that name no field);
    - the accept's network failure, timeout, `internal_error`, `updating`, or `invalid_input` on `password` or `name`. The page checks them, but the server is the authority;
    - a password-again mismatch on the page.
  - The worst case is an accept refused after a bare reset that came after the transaction committed (spec 2 `:57`). The account exists with the password just set, and the invitation is gone. Trying again then shows "This invitation link no longer works… Ask an administrator for a new one", although the person could simply sign in.
- **Proposed change:** in spec 3, write:
  - "Any accept failure other than a named refusal shows 'Your password may not have been set. Try again; if the link then no longer works, try signing in with your email and this password.' with Try again."
  - "`invalid_input` naming `password` or `name` shows by that field."
  - "The panel shows refusals with no field, and failures to answer, above its button."
  - Add one browser test with the accept mocked to 500.

### 8. A Node unit test for "the rule list's text" cannot load the shared rules (VER)

- **Where:** spec 3 `:73` (`tests/invitation-client.test.mjs`); trace row 5 ("U (shared rule list)"); code `site-studio/scripts/run-unit-tests.mjs:15`, `shared/signin.ts:2`, `src/admin/signInClient.js:87`.
- **Evidence:**
  - `npm test` runs `node --experimental-strip-types --test tests/*.test.mjs`. Node needs explicit `.ts` extensions in imports.
  - `shared/` files import each other without extensions (`shared/signin.ts` imports `"./setup"`). `signInClient.js` imports `shared/routes.ts` lazily for exactly this reason.
  - `passwordRules` lives in `shared/invitation.ts`, which will reuse `./setup`. A client module or Node test that imports it statically then fails to load.
  - `passwordRules` itself is tested in spec 1's `server-tests/invitation-rules.test.ts`, which is vitest (S), not U.
- **Proposed change:**
  - In spec 3, either keep `invitationClient.js` free of `shared/` imports other than `refusal.ts` (as `signInClient.js` is) and test the rule list's text in `server-tests/` as `setup-client.test.ts` does, or say that `shared/invitation.ts` imports with `.ts` extensions.
  - Change trace row 5's "U" to "S (spec 1)".

## Minor

### 9. An inactive inviter: the two spec files disagree (ADV)

- **Where:** spec 1 `:33`; `brownfield.md:21`; code `signInStore.ts:517`.
- **Evidence:** spec 1 says "account not active or not `administrator` → `administrator_only`", but also "identifies the inviter … as `sessionInfo` does". `sessionInfo`'s lookup joins `u.active = 1`, so an inactive account's session is "not signed in", which gives `not_signed_in`. Nothing can make an account inactive before story 1.9 or 1.10, but the test matrix has to pick one answer.
- **Proposed change:** "An inactive account's session is no live session: `not_signed_in` (as `sessionInfo`)." Keep `administrator_only` for an active standard account.

### 10. The fields of `acceptInput` and the hash that `acceptInvitation` accepts are not pinned (EDGE)

- **Where:** spec 1 `:35`, `:76`.
- **Evidence:**
  - `acceptInput (secret, name, password)` names no rules for its fields. CAP-4 requires NFKC and 12–128 characters, which only `passwordField` gives, and `name` needs `personNameField` (NFC, 1–80 characters).
  - `createFirstAdministratorInput` pins the scrypt parameters as literals (`setupStore.ts:150-161`). Spec 1 says only "story 1.2's columns" for `acceptInvitation`'s hash input.
- **Proposed change:** "`acceptInput` = `{ secret: invitationSecretField, name: personNameField, password: passwordField }`. `acceptInvitation`'s hash input reuses `createFirstAdministratorInput`'s `passwordHash` schema."

### 11. A secret the schema rejects gets `invalid_input`, not the one refusal D-3 promises (EDGE)

- **Where:** `SPEC.md:65`, `:124`; spec 1 `:76`; spec 3 `:33`.
- **Evidence:** a fragment longer than 256 characters, or a JSON body whose `secret` is not a string, fails `invitationSecretField` at the router and gets `invalid_input` with field `secret`. The page maps no such outcome, so a long pasted link shows nothing useful. CAP-5 says malformed links get `invitation_unusable`.
- **Proposed change:** spec 3: "The page checks `isWellFormedInvitationSecret` (shared) before any request and shows the D-3 message for a malformed fragment, without a request." `SPEC.md:65`: "malformed (as the page or the Worker checks it)".

### 12. A re-invite meets the `UNIQUE` email of an expired row that has not been pruned (EDGE)

- **Where:** spec 1 `:31-32`.
- **Evidence:** "A re-invite deletes the earlier row" reads as an unused (live) invitation. Pruning removes at most 20 rows a call, so an expired row for the same email may still exist and makes the `INSERT` fail on `UNIQUE`.
- **Proposed change:** "Creating an invitation deletes any row for the email, live or expired, before inserting." Add a matrix row: "Invite an email whose earlier invitation expired and was not pruned: the new one is created."

### 13. D-7's editable name is not shown to work (VER)

- **Where:** spec 2 `:82`; spec 3 `:51`.
- **Evidence:** both say the new account has "the new name" or "the name", but no row changes the prefilled name. A page that ignores the edit and sends the administrator's entry passes.
- **Proposed change:** in spec 3's Accept row, change the prefilled name before submitting and expect the menu to show the edited name. In spec 2's AC, accept with a name different from the invitation's and expect that name in the session read.

### 14. Only one role is followed through to the end (VER)

- **Where:** spec 1 `:53`; spec 2 `:82`; spec 3 `:51`.
- **Evidence:** every flow in the matrices invites or follows a standard user. A defect that always inserts `'standard'`, or that leaves the role out of the session read, survives with no administrator invitee tested. Criterion 2 names both roles.
- **Proposed change:** spec 1 or spec 2: "An invitation with role `administrator` creates an administrator, and the session read answers `role: administrator`." Spec 3: "An invited administrator's menu holds 'Invite a person'."

### 15. "A cancelled request releases its slot" is claimed as taken but nothing tests it (VER)

- **Where:** `SPEC.md:163`; spec 2 matrix `:41-59`.
- **Evidence:** the deferred-work item is marked taken "(CAP-4; spec 2)", but spec 2 has no row for an aborted accept. `busyOrGone` covers the code path, but no accept test exercises it.
- **Proposed change:** add a spec 2 row: "Accept whose request signal aborts while queued: `signin_busy`, the queue's waiting count falls back, the invitation stays live."

### 16. D-10's "current name" is not shown (VER)

- **Where:** spec 1 `:51`.
- **Evidence:** no row changes the inviter's name between the invite and the read. A store that copies the name into the invitation row passes. No rename feature exists before story 1.10, but a store test can update `users.name` directly, as other store tests seed rows.
- **Proposed change:** "Read live, after the inviter's `users.name` was changed directly: the read answers the changed name."

### 17. Spec 2's criteria leave out the public-address link (VER)

- **Where:** spec 2 `:81-88` (criteria), `:45` (matrix).
- **Evidence:** CA-57 and AD-12 make the link's origin the recorded public address, never the request's host. Only a matrix row says so. The trace credits spec 2 with "route: link on the public address".
- **Proposed change:** add to spec 2: "Given a request whose `Host` and `Origin` differ from the recorded public address, the invite reply's `link` starts with the recorded address + `/invite#`."

### 18. Trace row 12 credits the wrong check for "the administrator is told so" (VER)

- **Where:** `acceptance-trace.md:18`.
- **Evidence:** criterion 12 has two parts: the refusal, and the administrator being told. The second part is the panel's message, which is spec 3's browser row "Invite existing email". The trace's "Where checked" says only S.
- **Proposed change:** "Where checked: S (refusal), B (panel message)".

### 19. Keying `<App>` on `accountId` has no observable test (VER)

- **Where:** spec 3 `:35`, `:84`; `SPEC.md:81`.
- **Evidence:** the same-name test goes through the visibility path, which calls `location.reload()`. A key left on `name` would pass every listed test. The three deliberate breakages do not include comparing by name.
- **Proposed change:** either drop the key change as unobservable in this story, or make "the visibility re-read compares the name" a fourth deliberate breakage with its failing test recorded.

### 20. D-4 has no on-screen warning that accepting ends the current account's session and its marker (ADV; owner's decision)

- **Where:** `SPEC.md:126`, D-4.
- **Evidence:**
  - An administrator who opens the link in their own browser to check it, then submits, is signed out.
  - The browser's marker passes to the new account: one marker per installation (story 1.3's D-3). The administrator loses the CA-44 exemption on that browser.
  - The page gives no warning. This is Kevin's decision; I raise only the missing notice.
- **Proposed change:** if Kevin agrees, the invitation page says "You are signed in as ‹name›. Setting this password signs you out." whenever the session read answers signed in.

### 21. D-9 against AD-12's "always available for an administrator to copy" (ADV; owner's decision)

- **Where:** `SPEC.md:153`; `architecture.md:229`.
- **Evidence:** AD-12 says invitations are "always available for an administrator to copy". D-9 shows the link once and discards it. The two readings are compatible only if "always" means "whether or not email is set up", which is AD-18's sense. Story 1.11 lists pending invitations, and it will have no link to show.
- **Proposed change:** add one line under D-9: "AD-12's 'always available to copy' is read as 'with or without email' (AD-18); a lost link is replaced by inviting again (CA-10)."

### 22. Three sentences read as altered by editing (ADV)

- **Where and evidence:**
  - `SPEC.md:98`: "No secret, password, hash or session token in a log, reply other than the invite reply's link, refusal or export". The list is garbled, and the accept and sign-in replies do carry the session token, in `Set-Cookie`.
  - Spec 2 `:22`: "no page is served without a referrer". The meaning is the reverse: no page is yet served with `no-referrer`.
  - Spec 2 `:55`: "nothing counted" in the full-queue row is copied from sign-in. Accept counts nothing in any case.
- **Proposed change:**
  - `SPEC.md:98`: "…in a log, refusal or export, or in a reply body other than the invite reply's link; session tokens only in `Set-Cookie`."
  - Spec 2 `:22`: "…no page is yet served with `Referrer-Policy: no-referrer`."
  - Spec 2 `:55`: drop "nothing counted".

### 23. D-11 is "fixed exactly", yet spec 3 adds wording it does not list (ADV)

- **Where:** `SPEC.md:157`; spec 3 `:30`, `:32-33`.
- **Evidence:** spec 3 uses or needs text that D-11 does not list:
  - "Invite another person";
  - "Password", "Password again" and their mismatch message;
  - "The invitation cannot be checked" and "Try again";
  - the busy text;
  - the Close label.
- **Proposed change:** list these in spec 3 as wording outside D-11, taken from the sign-in and set-up pages where they already exist, so the browser tests pin them and nobody reads them as changes to D-11.

### 24. The expiry date has no time zone or time (EDGE)

- **Where:** D-11 "expires on ‹date›"; spec 2 `:30`; spec 3 `:47`.
- **Evidence:** `expiresAt` is ISO UTC. An invitation issued at 22:00 local time expires at 22:00 seven days later. A date alone, in local or UTC time, can be read as a day longer than it is.
- **Proposed change:** "The panel shows the expiry as local date and time (for example '28 November 2026, 22:00')", or "the date of expiry in the browser's time zone, the link working until that time of day."

### 25. A failed Copy is not handled (EDGE)

- **Where:** spec 3 `:30`, `:78`.
- **Evidence:** `navigator.clipboard.writeText` rejects without permission, or outside a user gesture in some WebKit builds. The spec defines only "Copied".
- **Proposed change:** "If writing to the clipboard fails, the link field is selected and the panel says 'Select the link and copy it.'" WebKit's test can assert this through a mocked rejection.

### 26. The address bar is only part of what standing rule 14 covers (ADV)

- **Where:** `SPEC.md:45`; D-8.
- **Evidence:** `replaceState` replaces the session-history entry. The browser's global history and synced history can still record the URL as first opened, with the fragment. That is outside what the server can control, and the link works only once. D-8 cites "no record contains it".
- **Proposed change:** add an assumption: "The browser's own history may keep the address as first opened; single use and the 7-day expiry limit the harm. No test claims otherwise."

### 27. Bundle rule for the invite panel (ADV)

- **Where:** spec 3 `:37`.
- **Evidence:** "page modules load lazily … so the prototype's bundle does not grow by the page's rules". The invite panel sits in `AccountMenu`, which `App` imports statically. If it imports `inviteInput` (zod plus the rules) statically, the prototype's bundle grows, and the rule as written does not say whether the panel counts as a page module.
- **Proposed change:** "`InvitePanel` is loaded lazily when the menu item is chosen, as the sign-in page is."

### 28. Two unspecified states of the rule list (EDGE)

- **Where:** spec 3 `:50`.
- **Evidence:**
  - "5 characters, then 12, then the email": "the email" meets the length rule only if the test's email has at least 12 characters, which the spec does not require.
  - With an empty password, "Not the same as your email" shows as met.
- **Proposed change:** pin a test email of 12 or more characters. State that with an empty password both rules show as not yet met (or say that "met" is intended).

### 29. Failure of the session read after a sign-in is unspecified (EDGE)

- **Where:** spec 3 `:35`.
- **Evidence:** after a successful sign-in the page "reads the session once to learn `accountId` and `role`". If that read fails or answers signed out (a race with another tab), the spec does not say what shows. Today the sign-in reply alone opens the app.
- **Proposed change:** "If that read is not signed in, the sign-in page shows; if it cannot be checked, 'Sign-in cannot be checked' with Try again."

---

## Checked and found consistent

- **The hash queue:** `hashQueue.hasRoom()`, `hashPassword(password, signal)`, `HashQueueBusy`, 20 waiting, and release in `finally`.
- **The busy refusal:** `busyOrGone` and `signin_busy` (503, `Retry-After: 5`).
- **Retries:** `callObject` retries a bare reset only for `idempotent` calls.
- **Session and marker helpers:** `sessionCookieLine`, `markerCookieLine`, `sha256Hex`, `newMarkerId`, `PRUNE_BATCH = 20`.
- **The `users` table:** `role` has its `CHECK`, `email` is `UNIQUE` and lower-cased, and `id` comes from `crypto.randomUUID()`.
- **Set-up:** `settings.public_address` is set from the set-up request's origin.
- **Line numbers in the brownfield notes:**
  - the pinned operation lists at `setup-store.test.ts:607` and `signin-store.test.ts:802`;
  - `App.jsx:654`;
  - `main.jsx`'s name comparison (`:129,133`) and its key (`:65`).
- **Routes:** paths are exact, the router refuses on origin before it reads the body, JSON replies are `no-store`, and the logs carry route ids only.
- **Two classes:** the accept and create transactions fit the existing pattern of awaits first, then one synchronous step. Two object classes are kept.
- **Scope:** nothing in the spec belongs to stories 1.5, 1.7, 1.8, 1.10, 1.11, 1.14, 1.15 or 1.17 beyond what its Non-goals already hand on.

## Not checked

- **The S-27 and S-30 screens on the Claude Design canvas.** I read only their text in the UX specification.
- **Runtime behaviour:** no test, build or server was run. In particular, these are unchecked:
  - the order in which Playwright runs the spec files (finding 4);
  - how Cloudflare's asset service answers `/invite/` and `/invite/index.html` (finding 5);
  - whether `vi.spyOn(console)` sees the installation object's log lines in every case. `objects.test.ts:188` suggests it does.
- **FR-67's Check text in `prd.md`.** I read only the requirement's statement.
- **The deployed Cloudflare behaviour,** which D-12 leaves out on purpose.

## Disposition

Applied on 2026-11-21 on Kevin's instruction ("Apply all 29", relayed by the orchestrator session), with the options he chose where a finding offered alternatives. Spec 1, 2 and 3 are the files under `stories/`.

| # | Applied | Where |
|---|---|---|
| 1 | Yes, with the route named `acceptInvite` (finding 6) instead of `acceptInvitation` | SPEC CAP-6 and deferred-work list; brownfield (existing tests); spec 2 Execution |
| 2 | Yes; three more existing tests whose shapes change were found while applying it (`tests/signin-client.test.mjs` lines 103, 108, 133; `signin-routes.test.ts:136`; `signin-store.test.ts:694`) | SPEC CAP-9; brownfield (table, existing tests); spec 3 Always and Execution; trace CAP-9 row |
| 3 | Yes | SPEC CAP-2; spec 3 Always, matrix, criterion 7 |
| 4 | Yes, the first option (`signInServers(project)[0]`); a shared helper module is allowed, not required | spec 3 Always; brownfield (test harness); stories.yaml |
| 5 | Yes | SPEC D-12 (reason amended); brownfield; spec 2 Always, matrix, Code Map, criteria; spec 3 matrix, Execution, criterion 7, Verification; trace row 7 |
| 6 | Yes; route id `acceptInvite`, operation `acceptInvitation` | SPEC CAP-6; spec 2 Always, Execution, criteria; trace row 8; stories.yaml |
| 7 | Yes | spec 3 Always, wording list, matrix |
| 8 | Yes, the first option (`invitationClient.js` imports only `refusal.ts`; rule-list text tested in `server-tests/`) | spec 3 Always and Execution; brownfield (test harness); trace row 5 |
| 9 | Yes | spec 1 Always and matrix |
| 10 | Yes | spec 1 Always and Execution |
| 11 | Yes | SPEC CAP-5; spec 3 Always and matrix |
| 12 | Yes | spec 1 Always and matrix |
| 13 | Yes | spec 2 matrix and criterion 4; spec 3 matrix |
| 14 | Yes, in spec 1 (store) and spec 3 (menu) | spec 1 matrix; spec 3 matrix |
| 15 | Yes | spec 2 matrix |
| 16 | Yes | spec 1 matrix |
| 17 | Yes | spec 2 criteria |
| 18 | Yes | trace row 12 |
| 19 | Yes, the second option (a fourth deliberate breakage) | SPEC CAP-10; spec 3 criteria; trace CAP-9 row; stories.yaml |
| 20 | Yes, as an addition to D-4 Kevin agreed | SPEC CAP-3 and D-4; spec 3 Always, wording list, matrix |
| 21 | Yes | SPEC D-9 |
| 22 | Yes | SPEC Constraints; spec 2 Intent and matrix |
| 23 | Yes | SPEC D-11; spec 3 wording list |
| 24 | Yes, the first option (local date and time) | SPEC CAP-1 and D-11 (amended); spec 3 Always, matrix, criterion 2 |
| 25 | Yes | spec 3 Always, wording list, matrix |
| 26 | Yes | SPEC Assumptions |
| 27 | Yes | spec 3 Always and Execution |
| 28 | Yes, the first option (both rules not yet met with an empty password) | spec 1 Execution; spec 3 Always and matrix |
| 29 | Yes | spec 3 Always and matrix |
