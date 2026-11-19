# Review of Epic 1 (epics draft 0.7): adversarial

- **Date:** 2026-11-19
- **Workflow:** `bmad-review`, adversarial lens only (on Kevin's request)
- **Content:** Epic 1, stories 1.1 to 1.19, with the standing rules, the definition of done and the Epic 1 rows of the values table (`epics.md` lines 115–746).
- **Checked against:** PRD 1.2 with amendments 1.3 and 1.4, architecture 3.1, UX 0.6 sections 17 and 18.
- **Excluded:** points already settled in `review-epics-draft-0.7.md` and `review-epic-11.md`, and the stale architecture passages already known (the story number in section 14, the main bullet of AD-22, section 15, the "three states" wording in AD-20).
- **Status:** 21 findings, all applied on 2026-11-19 on Kevin's instruction, with Claude's recommendations (see Disposition at the end). The lens assigns no severity, so findings are grouped by theme. Before reporting, the orchestrator checked four of the quoted passages against the text.

## Findings

### Account enumeration and brute force

**A1. Response timing reveals which accounts exist** (story 1.3 refusals; story 1.17, CA-39)
- **Problem:** Only the wording of the reply is uniform. scrypt (about 0.36 s on Cloudflare) runs only when the email has an account, and Forgot password takes longer when an email is actually sent.
- **Fix:** Verify a fixed dummy scrypt hash for emails that have no account, and test that median refusal times are within 100 ms of each other. Return the Forgot password reply before sending, or after a fixed delay.
- **Consequence:** Anyone can list the accounts on an installation by timing requests, which defeats the non-disclosure rule of NFR-5 and FR-67.

**A4. Rate counters "in memory" are not enforced on Cloudflare** (story 1.19 limits; story 1.3 "short-lived store"; story 1.2, CA-05)
- **Problem:** Each Worker isolate has its own memory, and AD-16 bans KV, so these counters do not hold across isolates. On the single self-hosted process they do, so the two hosts differ, against NFR-7.
- **Fix:** Name the store for each limit, either the installation object or a named limiter object listed in AD-16. Add a deployed Cloudflare check: 25 concurrent failed sign-ins trigger the wait after the fifth.
- **Consequence:** The brute-force limits pass locally and do nothing in production.

**A5. The set-up page can be locked out indefinitely** (story 1.2, CA-05)
- **Problem:** The lockout after 5 wrong codes is global and the set-up page is public from deployment. Anyone can keep the installer out, and nothing says whether a redeploy, which issues a new code, resets the count.
- **Fix:** A redeploy with a new code resets the count. Also count per address with a global cap, or tell the installer to redeploy when locked out.
- **Consequence:** An installation can be held hostage before its first administrator exists.

**A6. Anyone who knows an email can lock that account** (story 1.3, CA-07)
- **Problem:** The per-email wait applies even to the correct password, and recovery in story 1.13 sets a password but does not clear the lock.
- **Fix:** Exempt a browser that has signed in to the account before (a device marker), or accept the risk explicitly and have story 1.13 clear the wait. Record the choice as a CA value.
- **Consequence:** A near-free denial of service against any user, including the only administrator.

**A11. Forgot password can be used to send spam** (story 1.17, CA-39)
- **Problem:** The only limit is 3 messages per account per hour. Nothing limits requests per address or emails sent by the whole installation, and "Email it" and "Send a test message" have no limit at all.
- **Fix:** Limit requests to 10 per address per hour and the installation to 100 emails per hour, with the same uniform reply over a limit. Record the figures as CA values.
- **Consequence:** The organisation's email account is suspended, and invitations and resets silently stop arriving.

### Cross-site requests and pre-session flows

**A2. The same-origin rule is missing from flows that run before sign-in** (story 1.3 refusals; stories 1.2, 1.4, 1.11, 1.13, 1.17)
- **Problem:** AD-12 applies the origin and header rule to set-up, accepting an invitation, reset links and recovery. Epic 1 states it only for sign-in and session requests.
- **Fix:** Make it a standing rule and add a test for each of those flows.
- **Consequence:** Login CSRF, and a leaked invitation or reset link submitted by another site with a password the attacker chooses.

**A10. Reset emails can carry the attacker's address** (story 1.17)
- **Problem:** Nothing says which host name an emailed link uses. If it is taken from the Host or X-Forwarded-Host header, it can be forged.
- **Fix:** Build emailed links from the installation's configured public address, which becomes a new setting in story 1.15. Test with a forged Host header.
- **Consequence:** Password-reset poisoning leading to account takeover.

**A21. The session cookie can collide between installations** (story 1.3)
- **Problem:** The cookie's name and scope are unspecified, and cookies ignore the port, so two installations on one host name share a cookie.
- **Fix:** Use the `__Host-` prefix with a per-installation name. Test two installations on one host on different ports, both staying signed in.
- **Consequence:** Random sign-outs on self-hosted machines and a session-fixation path.

### Tokens and link secrets

**A3. Tokens can reach the routes that manage tokens and accounts** (story 1.19; standing rule 2; story 1.6)
- **Problem:** Nothing makes token creation, revocation, password change, ending sessions, two-step changes or the agent-access setting person-only.
- **Fix:** Classify all of them as person-only or administrator-only, add them to rule 2's list, and test each with a read-and-draft token.
- **Consequence:** A leaked token creates sibling tokens that survive its own revocation.

**A7. Invitation, reset and recovery secrets have no stated strength** (stories 1.4, 1.11, 1.13, 1.17)
- **Problem:** No minimum entropy, no rule to store only a hash, and no protection against the Referer header or logs. These are stated only for sessions, two-step recovery codes and tokens.
- **Fix:** Require at least 32 random bytes (at least 20 characters for the recovery code), store only the SHA-256 hash, serve the page with `Referrer-Policy: no-referrer`, strip the token from the address bar, and never log it.
- **Consequence:** Anyone with storage, backup or proxy-log access can take over accounts.

**A12. The step between password and code is undefined** (stories 1.3 and 1.5)
- **Problem:** Nothing says what carries the state after a correct password, how long it lasts, or whether showing the code page reveals that the password was correct.
- **Fix:** Issue a hashed pending-sign-in token valid for 5 minutes, bound to the browser, usable for nothing else, and discarded on success, expiry or the wait. Decide whether the password result is revealed before the code.
- **Consequence:** A reusable half-session, or a reliable way to check stolen passwords.

**A13. Turning on two-step does not ask for the password** (story 1.5, line 192 of the extract)
- **Problem:** Turning it off asks for the password, but turning it on does not.
- **Fix:** Require the password to turn it on, and add a refusal test for a wrong password.
- **Consequence:** A briefly hijacked session becomes a permanent lockout, which only story 1.13 can undo for an only administrator.

**A14. Sessions never end while they are used** (story 1.6, CA-18 and CA-19; story 1.15)
- **Problem:** There is only an idle timeout, with no absolute lifetime and no token rotation.
- **Fix:** End sessions 30 days after sign-in regardless of use, replace the token at sign-in and after the second step, and test with a test clock.
- **Consequence:** A stolen cookie lasts forever.

### Mechanisms not specified

**A8. Story 1.13 can't be built as written**
- **Problem:** It does not say how the command gets the recovery code into the installation, how long the code is, or whether wrong entries are limited. A new Worker secret runs into the R11 delay, and a route contradicts "no request issues a code".
- **Fix:** Name the delivery mechanism (update-secret class), require the code to work within 60 s on Cloudflare and to have at least 20 characters, and count wrong entries toward story 1.2's limit.
- **Consequence:** The story can't be tested, and code entry is an unlimited, unauthenticated way to reset the administrator.

**A9. How does the deploy command know there is an administrator or a key?** (story 1.2, CA-02; story 1.5)
- **Problem:** No route, class or authentication is given for the deploy command to ask.
- **Fix:** Name the mechanism. Detect an existing key and never overwrite it, and refuse a key that does not match a stored fingerprint.
- **Consequence:** Set-up reopens on a live installation, or a replaced key makes every two-step secret unreadable.

**A17. Routes built before the gate are never moved onto it** (story 1.8; stories 1.2–1.7)
- **Problem:** Story 1.8 does not require earlier routes to declare a class and rely on the gate alone, and its test routes may ship in the deployed build.
- **Fix:** Every route from stories 1.2 to 1.7 declares a class and the gate alone decides. A build fails on any route without a class, and test routes exist only in the test build (a deployed installation answers 404).
- **Consequence:** Checks drift apart, and test routes reach production.

### Data protection while project data is still in the browser

**A15. Pending input outlives Sign out on a shared device** (story 1.6, CA-20)
- **Problem:** Nothing says what a deliberate Sign out does to pending input, and there is no retention limit.
- **Fix:** Warn and clear it on sign-out, remove it after 7 days, and test the browser storage.
- **Consequence:** Data leaks between people sharing a site laptop, and story 2.3 inherits the leak.

**A16. Browser project data isn't separated per project or account** (story 1.7)
- **Problem:** Until story 2.1, the prototype's browser storage is shared by every project and account on a browser.
- **Fix:** Key the browser data by installation, account and project, or state that Epic 1 builds must not hold real data.
- **Consequence:** The epic's claimed control over who sees what is false in practice.

### Activity log, accounts and audit

**A18. The activity log can grow without limit and its export is unsafe** (story 1.14, CA-31)
- **Problem:** Unauthenticated failed sign-ins write permanent entries, the export size is untested, and CSV cells are not neutralised.
- **Fix:** Merge repeated failures from one address within a minute into one entry, stream the export in pages (test 1,000,000 entries), prefix cells that begin with `= + - @`, and count the log in story 8.14.
- **Consequence:** The installation object grows toward its storage limit, and an opened export can run an injected formula.

**A19. Administrator resets are silent and can stack up** (stories 1.11 and 1.17)
- **Problem:** Nothing says that a new reset link cancels the previous one, whether the old password keeps working, or that the owner is told.
- **Fix:** A new link cancels earlier ones and the current password works until the link is used. Email the owner when email is set up, and show a notice at the next sign-in.
- **Consequence:** Silent account takeover by an administrator, against FR-69.

**A20. An account's email can never change** (stories 1.6 and 1.10; CA-10)
- **Problem:** No story changes an email, and CA-10 reserves even a deactivated account's email.
- **Fix:** Add an administrator email change, or state that email is fixed for life and name an action that releases a deactivated account's address.
- **Consequence:** Typos and mail-domain changes can't be fixed.

## Raw findings (JSON)

The full lens output, one object per finding with the fields `lens`, `location`, `trigger_condition`, `guard_snippet` and `potential_consequence`, is kept in the session transcript. The summaries above carry each finding's location, problem, fix and consequence.

## Disposition

Applied in full on 2026-11-19 on Kevin's instruction ("apply all 21 with your recommendations"). Each new rule or value is Claude's recommendation, accepted on that instruction, and Kevin can overrule any of them. Story ids below are the published numbers; the parts use the working ids.

| Finding | Where it was applied | Choice |
|---|---|---|
| A1 | Stories 1.3 and 1.17 | CA-58 |
| A2 | Standing rule 13; refusal tests in stories 1.2, 1.3, 1.4, 1.11, 1.13 and 1.17 | AD-12 |
| A3 | Standing rule 2; story 1.19; Notes of story 1.6 | FR-75 |
| A4 | Stories 1.2, 1.3 and 1.19, with a deployed concurrency check in stories 1.3 and 1.19; AD-12 refinements; AD-22 rate-limit bullet | CA-43 |
| A5 | Story 1.2 | CA-45 |
| A6 | Stories 1.3 and 1.13 | CA-44 |
| A7 | Standing rule 14; stories 1.4, 1.11, 1.13 and 1.17 | CA-55 |
| A8 | Story 1.13 | CA-51 |
| A9 | Stories 1.2 and 1.5 | CA-52 |
| A10 | Stories 1.2, 1.15 and 1.17 | CA-57 |
| A11 | Story 1.17 | CA-53 |
| A12 | Story 1.5 | CA-46 |
| A13 | Story 1.5 | CA-13 (widened) |
| A14 | Stories 1.3, 1.5 and 1.6 | CA-47 |
| A15 | Story 1.6 | CA-48 |
| A16 | Story 1.7 | CA-49 |
| A17 | Story 1.8 | none |
| A18 | Story 1.14 (export tested at 100,000 entries, not 1,000,000; the log's size is not added to story 8.14, which counts project budgets only) | CA-56 |
| A19 | Stories 1.11 and 1.17 | CA-54 |
| A20 | Stories 1.10 and 1.14 | CA-50 |
| A21 | Story 1.3 | none |

The architecture's AD-12 gained a section listing these refinements, and AD-22's rate-limit bullet was corrected to match.

## Check of the applied fixes

An independent check of the assembled result on 2026-11-19 found six problems and three gaps in how the fixes had been applied. All were corrected the same day:

- **Counts.** They are raised before the password or code is checked. The concurrency criterion says at most 5 of 25 are checked. Failure counts are kept in storage, and token rates in memory, where a reset is accepted. CA-43 now lists the Forgot-password and email counts.
- **Set-up and recovery codes.** They are limited per address, with an installation-wide cap of 100 an hour (CA-05 revised), and running the recovery command resets the counts (CA-51). This prevents anyone from blocking an administrator's recovery.
- **Recovery-code length.** Standing rule 14 and CA-55 now apply only to the administrator recovery code of story 1.13.
- **Activity log size.** The claim that story 8.14 counts the log's size was removed.
- **Story 1.11.** It no longer depends on story 1.17. The emailed case moved to story 1.17, where an emailed link cancelling an administrator's link is accepted in CA-54.
- **Story 1.7.** The criterion that could not be tested was reduced to the notice on the projects list.
- **Gaps closed.** The second-step request in story 1.5 gained its origin test. Reset links (stories 1.11 and 1.17) now clear the sign-in wait. The refusal of a route with no class in story 1.8 now applies only in the test build.
