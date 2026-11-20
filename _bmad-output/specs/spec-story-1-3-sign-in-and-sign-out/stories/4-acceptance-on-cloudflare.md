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

> **Not ready for development.** Runs after specs 1 to 3; awaits the adversarial review of the spec. Story 1.2's spec 4 found the cloud session could not reach Cloudflare; plan to run from Kevin's workstation.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Five of story 1.3's criteria name a deployed Cloudflare test installation, which local runs cannot prove.

**Approach:** Deploy the build to two test Workers on the "PhySec Site Studio" account, complete set-up on each, run the checks below, and record the results in this file and `deferred-work.md`. Covers CAP-10 across Workers, CAP-12, CAP-13's Cloudflare part, and the deployed parts of CAP-2 and CAP-3.

## Boundaries & Constraints

**Always:** Test account only. Set-up codes and passwords never committed or written into records. Extra Workers and any probe deleted afterwards unless this file says to keep one.

**Never:** Application changes; a failure found here goes back to its spec as a follow-up.

## Checks

| # | Check | Pass |
|---|-------|------|
| 1 | Sign in on `https://` to test Worker A | 200; `Set-Cookie` has `__Host-` name with A's identifier, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no `Domain` |
| 2 | scrypt on Cloudflare (R9) | no platform error in `wrangler tail` across the checks |
| 3 | 20 sign-ins in a row, timed at the client | median under 1 s (CA-08) |
| 4 | 25 wrong sign-ins for one email at once over several connections | at most 5 `signin_failed`, the rest `signin_wait` (CA-43) |
| 5 | A's account on Worker B | refused with the one message |
| 6 | A's session cookie sent to B | refused as not signed in |
| 7 | Sign out on A, then the old cookie | refused |
| 8 | D-6 fixture through a throwaway probe Worker on the test account, deleted afterwards | verifies |

</frozen-after-approval>

## Verification

Record each check's outcome, times and Worker names here; add or close entries in `deferred-work.md`.
