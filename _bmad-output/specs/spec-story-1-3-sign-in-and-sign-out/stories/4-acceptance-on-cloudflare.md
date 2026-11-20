---
title: 'Story 1.3, spec 4: Acceptance on Cloudflare'
type: 'chore'
created: '2026-11-20'
status: 'draft'
route: 'dispatch'
baseline_commit: ''
review_loop_iteration: 0
story_key: '1-3-sign-in-and-sign-out'
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-3-sign-in-and-sign-out/brownfield.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/4-acceptance-on-cloudflare.md'
---

> **Not ready for development.** Runs after specs 1 to 3; awaits Kevin's rulings on the held findings. Story 1.2's spec 4 found the cloud session could not reach Cloudflare; plan to run from Kevin's workstation.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Five of story 1.3's criteria name a deployed Cloudflare test installation, which local runs cannot prove.

**Approach:** Deploy the build to two test Workers on the "PhySec Site Studio" account, complete set-up on each with different administrator emails, deploy the `deploy/probe/` Worker spec 2 built, run the checks below in order, and record the results in this file and `deferred-work.md`. Covers CAP-10 across Workers, CAP-12, CAP-13's Cloudflare part, and the deployed parts of CAP-2 and CAP-3.

## Boundaries & Constraints

**Always:** Test account only. B's administrator uses a different email from A's; record both emails, never a password or set-up code (V-4). Checks 3 and 4 send no cookies (A-6). Extra Workers and the probe deleted afterwards.

**Never:** Application changes; a failure found here goes back to its spec as a follow-up. Deploying the probe is allowed; it is a test Worker, not the app (V-3).

## Checks

Run in this order; check 4 is the last check against A (V-19).

| # | Check | Pass |
|---|-------|------|
| 1 | Sign in on `https://` to test Worker A | 200; session `Set-Cookie` `__Host-` with A's identifier, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000`, no `Domain`; marker `Set-Cookie` likewise with `Max-Age=31536000` |
| 2 | scrypt on Cloudflare (R9) | no platform error in `wrangler tail` across the checks |
| 3 | 20 sign-ins in a row, timed at the client, no cookies kept | median under 1 s (CA-08) |
| 5 | A's administrator email and password on Worker B | refused with the one message |
| 6 | A's session cookie sent to B | not signed in on B |
| 6b | A's token sent under B's cookie name | not signed in on B (V-4) |
| 7 | Sign out on A, then the old cookie on A | session ended (the exact reply follows Kevin's ruling on H-1) |
| 8 | `deploy/probe/` on the test account: the fixture and a wrong password | the fixture verifies, the wrong password does not; probe deleted afterwards (D-6, V-3) |
| 9 | 25 wrong sign-ins for A's email carrying a valid marker for it, at once over 25 connections | at most 20 checked against the password (A-6) |
| 4 | After confirming A's email has no failures: 25 wrong sign-ins for it at once, no cookies, over 25 separate connections (`node:https` agents, keep-alive off) | exactly 5 `signin_failed` and 20 `signin_wait` (CA-43, V-19) |

Check 9 runs on a fresh email key: use B, or wait for A's counts to clear, and record which.

</frozen-after-approval>

## Verification

Record each check's outcome, times, Worker names and the two administrator emails here; add or close entries in `deferred-work.md`.
