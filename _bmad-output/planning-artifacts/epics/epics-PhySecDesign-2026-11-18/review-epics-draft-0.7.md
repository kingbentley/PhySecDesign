# Independent review of the epics and stories, draft 0.7

Run on 2026-11-19 with the BMAD `bmad-review` skill (6.12.4), installed locally. Three reviewers read [epics.md](epics.md) at draft 0.7 separately, including the rewrite of story 1.1 and the Epic 9 update stories for K20 and the R13 criteria added to story 1.18 and story 9.1. None saw the others' findings, the reviews of drafts 0.5 and 0.6, or the working files. Line numbers refer to `epics.md` as assembled on the branch `planning/k20-and-open-items` on 2026-11-19, before any of these findings was applied.

This file records what the reviewers reported. The reviewers do not rank findings.

**Applied on 2026-11-19**, at Kevin's direction to fix the update stories first: every finding on the update path, A1 to A19 and A21 to A29, and E1 to E34. Those that change the design are written into the architecture as K21 (AD-20), which awaits Kevin's confirmation. Later the same day, on Kevin's instruction to proceed with Claude's recommendations: A20 and E35 to E39 (story 1.10d, SMTP), and the structure findings that bear on ruling, S1 (the kind in each ID), S2 (a decision column for readings), S3 (tables grouped by epic) and S4 (three experiment states), with S6 (the last-changed date). **Not applied:** S5 and S7 to S11, which are optional reorganisations, and S15 (a separate reviewer view); S12 to S14 asked for no change. The findings below are left as reported, with their original line numbers.

| Lens | What it looked for | Findings |
| --- | --- | --- |
| Adversarial | Hidden dependencies on later stories, inconsistency, fidelity to the sources, buildability | 4 dependency, 11 consistency, 5 fidelity, 9 buildability |
| Edge-case hunter | Cases still unhandled, and cases two stories handle in conflicting ways | 39 |
| Editorial structure | Whether Kevin can review the document and rule on its choices | 15 recommendations (12 changes or questions, 3 keep as is) |

The adversarial reviewer read the PRD, the PRD addendum, the architecture, the UX specification and the experiment record. The edge-case hunter read the architecture.

## What the session checked

The session that ran the review checked the cited lines of the main findings against `epics.md` and the architecture. These hold as stated: the step number restarts with each attempt (A21, E1); alarm-driven conversion conflicts with the rule that alarm work only re-arms while a record exists (A6, E4); the health check needs the sign-in page while sign-in is not offered (A5); the readings table has no decision column (S2); R11 and R13 are listed as "To run" although both have recorded results (S4). A Durable Object has one alarm at a time, as E3 says. One structural point is a misreading: CA-41 comes before CA-01 in the values table because the rows are sorted by story and CA-41 is on story 1.1 (S3); the request for epic subheadings stands on its own.

## Where the reviewers agree

Overlap between lenses is signal, not duplication.

| Topic | Findings |
| --- | --- |
| The step number must not restart with a new attempt | A21, E1 |
| The update's own alarm-driven conversion and return must be exempt from "alarm work only re-arms" | A6, E4 |
| How the workflow and the updater prove who they are to the installation | A22, E16 |
| Health check on an installation with no projects | A26, E24 |
| Restore copies and imports convert older data with no update record | A11, E26 |
| Per-step activity-log entries are lost by a return | A12, E34 |
| Missing time limits: the workflow after deploying, the updater, a manual preparation, a prepared record | A24, E20, E21, E28 |
| A new deployment that lands while the record is returning | A16, E10 |
| What stops changes during the warning and the backup, before a record exists | A17, E22 |
| Self-hosted updater: identifier hand-over, image digest, pull before the yes | A23, E5, E14, E32 |
| The manual procedure for a release that changes a Durable Object class | A29, E27 |
| What counts as R13 passing; SMTP when only one host passed | A20, E35 |
| Status dates, and experiments shown as "To run" despite results | A15, A19, S4, S6 |

Most findings of the two behavioural lenses concern the update stories rewritten for K20: 26 of the 29 adversarial findings (all but A15, A19 and A20) and E1 to E34 of the edge cases.

## Adversarial

### Dependency

**A1. Story 9.3, lines 3915, 3924, 3928**
- Trigger: 9.3 converts only "while an update record is installing" and tests the record's table, which story 9.4 builds.
- Fix: swap 9.3 and 9.4; or move the record table and states into 9.3; or run 9.3 against a stub flag and add both criteria to 9.4.
- Consequence: 9.3 cannot pass on its own; a throwaway record is built and replaced.

**A2. Story 1.1, line 155**
- Trigger: "with no update in progress" depends on the record of story 9.4; in 1.1 it is always true and untestable.
- Fix: in 1.1 write "refuses requests and says that an update was not completed"; add the "unless a record is installing" exception in 9.4.
- Consequence: 1.1 checks against something that does not exist; 9.4 silently reworks the refusal.

**A3. Story 9.7 line 4026, 9.13 line 4195, 10.7 lines 4416 and 4422, 10.8 line 4436, 9.11 line 4116, 9.15 line 4226**
- Trigger: "two releases behind" needs three signed releases with data-format changes; "broken" releases must be signed by this repository's workflow, or the updater and workflow refuse them (lines 4030, 4133). No story produces them.
- Fix: add a test release channel to story 9.2 (a test repository or tag prefix, signed by the same workflow) with fixture releases N, N+1, N+2 and deliberately broken variants; name it in the Depends on lines of Epics 9 and 10.
- Consequence: the evidence is blocked until real releases exist, or broken signed releases are published publicly.

**A4. Epic 9 Depends on, line 3853; story 9.12 lines 4149–4150; story 9.13 line 4187**
- Trigger: the Cloudflare stories reuse "the warning of story 9.10", the self-hosted failure story, which the dependency line does not mention.
- Fix: add that 9.12 and 9.13 need 9.10, or move the warning into story 9.4.
- Consequence: ordering the Cloudflare work first meets an unbuilt dependency.

### Consistency

**A5. Story 9.4 line 3945 against story 9.8 line 4055 (CF-28)**
- Trigger: the health check requires "the sign-in page is served" while sign-in is not offered during an update.
- Fix: define the check exactly, for example the sign-in route answers from the version being installed and a health-check sign-in is validated without writing a session, or use an internal health-check route.
- Consequence: the check always fails, or sign-in is re-enabled during updates.

**A6. Story 9.4 line 3944 against story 9.3 line 3917 and story 9.4 line 3949 (also AD-20)**
- Trigger: alarm work "only sets its alarm again" while a record exists, yet conversion and return run "in alarm-driven steps" only while a record exists.
- Fix: exempt the update's own conversion and return steps, run by the version allowed to act; test that a conversion step proceeds and a daily backup does not.
- Consequence: conversion and return never progress, or other alarm work runs during updates.

**A7. Story 9.4 line 3952**
- Trigger: the list of writes allowed during a record omits writes the stories need: state changes of the record, withdrawal, the "first reached" time, each object's highest step number, an administrator's cancel of a manual preparation.
- Fix: add "writes to the update record table and to each object's highest-step value, made by the update itself or by an administrator's withdrawal of a prepared record".
- Consequence: a strict build refuses its own state changes; updates stick in prepared or installing.

**A8. Story 9.4 line 3953 (CF-39); story 9.8 line 4056; story 1.15 lines 551, 563**
- Trigger: with last-use times frozen, sessions with a short idle period expire during an update, contradicting "existing sessions stay valid"; nobody can sign in again, including the only administrator.
- Fix: idle time does not accrue while a record exists, or expiry is measured from the later of last use and the record's removal; test a 15-minute session across a 20-minute update.
- Consequence: people are signed out mid-update with no way back in.

**A9. Story 9.10 line 4102 (CF-31) against AD-20**
- Trigger: after power loss with the record installing, the story says the installation "returns"; AD-20 says the installation finishes or fails the update by itself, and a dead updater cannot start the earlier image.
- Fix: split by what runs after restart: the new image continues and returns only on failure; the old image with an installing record takes the CF-40 path; with no container running, the updater's durable step log decides on its restart.
- Consequence: a healthy update is rolled back, or the installation waits for an updater that never comes.

**A10. Story 9.8 line 4050 against story 9.7 line 4024, story 9.14 lines 4206 and 4212, and UX S-35**
- Trigger: "every page shows a full-page Updating notice", yet the administrator's S-35 shows progress, and a manual preparation must show its identifier and a Cancel, which UX's "no other control" excludes.
- Fix: "every page except S-35 for an administrator"; define the prepared-manual state of S-35 as identifier plus Cancel and record it as a reading.
- Consequence: the administrator cannot read the identifier or cancel.

**A11. Story 8.4 line 3587, story 8.11 line 3767, against story 9.3 line 3915, story 1.1 line 155 and AD-20**
- Trigger: restore copies and imports convert older data with no update record, which 9.3 and AD-20 forbid.
- Fix: an explicit exception: a restore copy or import not yet current converts with the runner of story 1.1 outside any record, and is never live while converting.
- Consequence: older backups are refused, or converted through an undocumented bypass.

**A12. Story 9.7 line 4027, story 9.13 line 4173, story 9.10 line 4094, story 9.4 line 3949**
- Trigger: step entries written to the activity log during an attempt are erased when a return restores the installation's data.
- Fix: keep step entries in the update record table and copy them to the log after the return, or reduce the criterion to "the attempt and its outcome".
- Consequence: after a failed update the log does not show which step failed.

**A13. Standing rule 11, line 119, against story 1.1 line 148 and story 2.3 line 718**
- Trigger: a save answered "updating, try again shortly" counts as a refusal under rule 11 and is labelled "not saved", on any deployment from Epic 1 on, while story 9.8 expects open pages to resubmit.
- Fix: classify "updating" as transient, like a lost connection; the edit stays unsaved and is resent automatically; exclude it from rule 11 by name.
- Consequence: every routine deployment strands edits as "not saved".

**A14. Story 9.3 line 3912 against story 1.1 line 145**
- Trigger: "converts directly to the current one" suggests a converter per source version; 1.1 applies conversions in order.
- Fix: "converts to the current one in one update, by applying each conversion in order".
- Consequence: duplicated, diverging N-to-latest converters.

**A15. Front matter line 3; Status lines 15 and 19; notes at lines 240, 643, 3980, 4242; coverage line 4623; Covers lines 4017, 4046, 4085, 4162, 4201**
- Trigger: the draft is dated 2026-11-18 but records events of 2026-11-19 with no revision entry; stories 9.7, 9.8, 9.10, 9.13 and 9.14 act on the update record and the sign-in rule but do not cite AD-20.
- Fix: a revision entry and status date for the K20 rewrite; add AD-20 to those Covers lines.
- Consequence: a reader cannot tell what came after K20; coverage under-reports AD-20.

### Fidelity

**A16. Story 9.12 line 4147; story 9.15 line 4226; AD-20**
- Trigger: only a deployment landing after the return has finished is covered. A deployment of the new version that lands while the record is returning leaves no version able to act.
- Fix: such a deployment answers "updating" with the steps to redeploy the previous release, after which the return completes; add the case to 9.15.
- Consequence: a deadlock with changes stopped that no test catches.

**A17. Story 9.4 line 3939; story 9.7 lines 4023, 4032; story 9.8 lines 4049, 4054; story 9.13 line 4171**
- Trigger: changes stop from the start of the backup, but the record, the only modelled stop, is written after the backup. Nothing defines what stops changes during the warning and the backup, where that lives, or what a restart mid-backup does.
- Fix: a durable "stopping" state for the warning and backup, which every object honours, cleared on backup failure, resumed or cleared and logged on restart; reconcile with AD-20's three states, as a reading if needed.
- Consequence: saves acknowledged during the backup are lost on a return (NFR-8), or a restart leaves changes stopped with no record.

**A18. Story 9.12 line 4149**
- Trigger: the installation setting returning itself after its own conversion fails with no run left is not among AD-20's listed ways to set returning, and the redeploy steps need a signed-in administrator while sign-in is off.
- Fix: cite AD-20's "fails it by itself" and log a reading; show the redeploy steps on the public Updating notice.
- Consequence: behaviour beyond the source; recovery depends on a session that may not exist.

**A19. Story 9.5 lines 3972, 3980; story 9.15 note line 4242**
- Trigger: R14 did not cover alarms firing after an upgrade or the installation's own data, which the update relies on; R11 showed an object stopping itself for one object only, as "a candidate mechanism, not a design".
- Fix: 9.5 also checks that a pending alarm fires under the new runtime and that installation data reads correctly; 9.15's note adds "shown for one object; not yet shown under load".
- Consequence: experiment results read as broader than they were.

**A20. Story 1.18 lines 627–628 (CA-40), note line 643**
- Trigger: the criteria branch on "if R13 passed on both hosts" with no definition of a pass; no delivery from Cloudflare has been shown.
- Fix: R13 passes when the evidence lines are recorded with a delivered message on both hosts; until then only the HTTP email service is offered.
- Consequence: a partial result taken as a pass.

### Buildability

**A21. Story 9.4 lines 3938, 3955, 3958**
- Trigger: nothing says whether a new attempt continues the step count; if each record restarts at 1, every object refuses every later attempt.
- Fix: the step number never decreases across attempts; a new record starts above the highest ever issued, kept beside the record table; test two attempts in a row.
- Consequence: the second update on any installation fails everywhere.

**A22. Story 9.12 lines 4134, 4138, 4143; story 9.10 line 4088; story 9.7 line 4023; story 9.14 line 4206; standing rule 2, line 110**
- Trigger: no story says how the workflow or the updater authenticates to the installation; the attempt identifier is shown on screen and passed as a workflow input, so it cannot be the secret.
- Fix: calls signed with a secret held by the installation and the repository's Actions secrets (Cloudflare) or the updater's shared secret (self-hosted); unsigned calls refused and logged; test that a bare identifier is refused.
- Consequence: anyone who sees an identifier could withdraw an attempt or force a return.

**A23. Story 9.7 line 4023; story 9.4 line 3954 (CF-40); story 2.26 line 1274 (CB-34)**
- Trigger: unspecified: how the updater learns the identifier; pinning the image to the verified digest; pulling before the yes (a slow pull can pass the 10-minute CF-40 alarm); stopping the old container before the new one starts; what pages see while no container answers.
- Fix: pass the identifier and digest to the updater after prepared; pull and verify by digest before asking; stop old then start new; pages show the Updating notice when the server is unreachable during a warned update.
- Consequence: wrong image, self-return mid-pull, a new container that cannot start, or bare proxy errors.

**A24. Story 9.12 line 4138; story 9.13 line 4190 (CF-33); stories 9.7, 9.10; story 9.14 line 4212**
- Trigger: the workflow's limit after deploying has no value and is not tied to the S-35 estimate; the updater's limit has no value; a manual preparation has no limit.
- Fix: a value with an ID for each, workflow and updater limits a stated multiple of the estimate; a manual prepared record not followed by a run within N minutes is withdrawn and logged.
- Consequence: slow healthy updates rolled back; a forgotten preparation locks the installation.

**A25. Story 9.12 line 4149; story 9.4 line 3943; story 1.1 line 148**
- Trigger: to show the redeploy steps, new-version entry code must read the record from an installation object running the other version, which refuses and stops on every call.
- Fix: a read of the update record's state is answered by either version and never triggers a stop; test it.
- Consequence: "updating" cannot be told from "return stuck, redeploy needed".

**A26. Story 9.4 line 3945**
- Trigger: "a project opens" fails on an installation with no projects or all archived.
- Fix: the first catalogue project if any, otherwise a health-check project in the installation object holding no user data.
- Consequence: fresh or empty installations can never update.

**A27. Story 9.12 line 4154; story 9.4 note line 3963**
- Trigger: "the record set by a test function" on a deployed installation implies a route that writes update records; nothing keeps it out of release builds.
- Fix: test-only routes exist only in builds with a test flag; a test fails if a release bundle exposes them.
- Consequence: a production route could force update states.

**A28. Story 9.13 line 4170**
- Trigger: "checks that the token can start the update workflow" cannot be confirmed without starting a run.
- Fix: name the call (read the workflow and the token's permissions) and say that a failed dispatch is handled by lines 4178–4181.
- Consequence: an impossible or falsely reassuring check.

**A29. Story 9.14 line 4207; story 9.15 line 4240**
- Trigger: the "manual procedure" for a release that changes a Durable Object class is never defined, yet 9.15 tests it.
- Fix: list its steps, including how the record reaches installing, how conversion runs and whether and how a return works, and what S-35 says.
- Consequence: nothing to test against; the riskiest release has no specified way back.

## Edge-case hunter

Each line gives the location, the case, the handling to add and the consequence.

**Update record, steps and alarms**

- **E1.** 9.4 lines 3937–3955. A new attempt restarts the step number at 1. Make it monotonic across attempts, or compare (attempt, step) and reset on a new attempt; test two attempts. Otherwise every later update fails.
- **E2.** 9.4 lines 3948, 3955–3956 with 9.3 line 3924. A restore switch replaces the tables holding the highest step and the last-stop time. Keep both outside converted and restored tables by name and test that they survive. Otherwise a restore resets the guard.
- **E3.** 9.4 lines 3944, 3954; 9.3 line 3917; 9.13 line 4183. The installation object needs several alarms during a record (CF-40, conversion steps, the 30-minute limit, daily backup, update check) but has one alarm slot. Keep a schedule table with a due time per reason and always set the earliest. Otherwise re-arming overwrites the return deadline.
- **E4.** 9.4 line 3944 against 3917 and 3949. Exempt the update's own conversion and return steps from "only re-arm". Otherwise conversion and return never progress.
- **E5.** 9.4 line 3954 (CF-40) and the Limits of 9.4, 9.7, 9.10, 9.12. The 10-minute wait may be shorter than an image pull, restart or deploy. Set it above times measured by R11, and pull and verify the image before the yes. Otherwise a slow pull triggers a return as the new version arrives.
- **E6.** 9.4 line 3954, 9.10 line 4103. The CF-40 alarm fires under the new version before any call. That alarm handler records arrival and starts or resumes conversion. Otherwise, after a run stops right after deploying, nothing starts conversion.
- **E7.** 9.4 lines 3943, 3954; 9.10 line 4088; 9.12 line 4138. The new version arrives, then crashes or cannot answer the return request. Let the version before accept an authenticated return command while installing, even after arrival. Otherwise, after a rollback, the old version refuses the installing record for ever.
- **E8.** 9.12 line 4138, 9.10 line 4088. The time limit fires just as the update succeeds and removes the record. Start the earlier version only after the installation confirms this attempt is returning; with no record and a success, end without rollback. Otherwise old code meets converted data and refuses everything.
- **E9.** 9.12 lines 4146–4147, 9.10 line 4103. A late deploy lands after the installation returned by itself while the workflow still polls. The workflow, finding no record or a returning one, redeploys the previous version itself. Otherwise the installation stays down until a hand redeploy.
- **E10.** 9.12 lines 4146–4149. A new deploy lands while the record is returning. New entry code that sees a returning record always shows the redeploy steps, and the workflow redeploys the previous version. Otherwise the return stalls with no warning.

**One version at a time**

- **E11.** 1.1 line 156 (CA-41) with 9.4 line 3949, 9.3 line 3917. The driver calls a project that stopped itself in the last 30 seconds. Retry a version-refused project after more than 30 seconds, up to a bound, before counting it failed. Otherwise skew causes needless or impossible returns.
- **E12.** 1.1 line 156. A last-stop time held only in memory is lost on restart. Persist it, as an exempt write, before stopping. Otherwise the restart loop the limit prevents.
- **E13.** 9.4 line 3940, 9.12 lines 4134, 4144. The reply to the yes is lost and the run asks again while installing. Answer yes again to the same identifier before arrival; make the return request idempotent too. Otherwise every lost reply forces a return.
- **E14.** 9.4 line 3940 against 9.12 line 4134 and 9.7 line 4023. The self-hosted yes does not check the release in the record. On both hosts require identifier and version to match, and swap exactly that version. Otherwise the wrong image is installed.
- **E15.** 9.12 line 4143. A stale run reports a bad signature while a newer attempt is prepared. The report carries its identifier and withdraws only that attempt. Otherwise the current attempt is withdrawn.
- **E16.** 9.12 lines 4132–4138, 9.7 line 4022, standing rule 2. Machine calls from the workflow and updater have no authentication. Require a secret on the attempt-stands, state, return and refusal calls. Otherwise anyone with an identifier forces installing or a return.
- **E17.** 9.12 lines 4138–4139. Rollback targets the previous Cloudflare deployment, which may not be the version before. Record the exact Cloudflare version identifier before deploying, roll back to it and check it; the fallback downloads and verifies the previous bundle. Otherwise the rollback lands on a version no rule accepts.
- **E18.** 9.4 line 3943; 9.12, 9.14. A third version is deployed during a record (automatic deploy on push, or by hand). Detect it, show the warning and steps; instructions turn off automatic deploys in the organisation's copy. Otherwise neither allowed version runs.
- **E19.** 9.12 lines 4136, 4138. The workflow's poll gets "updating" during the switch. Treat "updating" and version refusals as unfinished; only an explicit success or failure ends polling. Otherwise a needless return.

**Time limits and stopping**

- **E20.** 9.12 line 4138; 9.10. No value for the workflow's or the updater's limit after deploying. Derive each from the S-35 estimate with a margin, under GitHub's 6-hour job limit. Otherwise large installations return needlessly or the updater waits for ever.
- **E21.** 9.10 lines 4101, 4104; 9.4 line 3941. The updater dies after prepared and never restarts; a prepared record has no timeout. The installation withdraws a prepared record if no yes arrives in N minutes, and the stories name which component withdraws on restart. Otherwise changes stay stopped indefinitely.
- **E22.** 9.7 lines 4023, 4032–4033; 9.13 line 4171; 9.8 line 4054; 8.1 line 3516. Changes are stopped during the backup before any record exists. Define that state: where it is stored, whether it survives a restart, whether an interrupted backup resumes or aborts. Otherwise writes slip past the backup or changes stay stopped with no record.
- **E23.** 9.8 line 4062; 9.7 lines 4034–4035 (CF-27). A backup, restore, archive or second Update during the 2-minute warning. Treat the attempt as running from Update now, defer other jobs, offer Cancel during the warning. Otherwise overlapping jobs or two attempts.

**Health check, catalogue and conversion**

- **E24.** 9.4 lines 3945–3946. No projects, or all archived or not recovered. Define "a project opens" for that case, for example a health-check project. Otherwise every update of an empty installation returns.
- **E25.** 9.3 line 3917; 8.8 lines 3701–3703; 8.4 line 3599. The catalogue holds a not-recovered project, or a restore copy is outside it. Skip and report not-recovered projects; convert or discard restore copies before an update; show both on S-35. Otherwise one bad project blocks every update.
- **E26.** 8.4 line 3587, 8.11 line 3767 against 1.1 line 155, 9.3 line 3915. A backup or import at an older format. State the exception: copies and imports convert before opening, outside a record, with the same conversion list. Otherwise the rules conflict.
- **E27.** 9.3 line 3926 against 9.2 line 3892, 9.14 line 4207, 9.15 line 4240. A release that changes a Durable Object class fails 9.3's class test. Let the test allow a change marked in release metadata, or remove the class-changing path. Otherwise 9.14's procedure cannot be exercised.

**Manual and Cloudflare start**

- **E28.** 9.14 lines 4205–4212. A manual preparation never followed by a run, with sign-in off. Add a time limit that withdraws it, and a cancel path that needs no new sign-in. Otherwise nobody can cancel once the session ends.
- **E29.** 9.13 line 4178. GitHub answers 5xx or times out after creating the run. Treat only a 4xx as confirmed not started; treat 5xx and timeouts as unclear, including an installing record. Otherwise "not started" is logged while a run deploys.

**Sessions, alarms and images**

- **E30.** 9.4 lines 3942, 3952; 1.3 line 216. Sign-out or an administrator ending a session during a record. Exempt session deletion, or clear the cookie and keep the revocation pending. Otherwise a session on a shared device stays valid.
- **E31.** 9.4 line 3944. A project room's alarm cannot read the record because the call was refused for a version mismatch. Treat an unreadable record as present and only re-arm. Otherwise background writes during an update.
- **E32.** 9.7 lines 4023, 4030–4031. The image tag is re-pointed between verification and swap. Verify and swap by digest. Otherwise an unverified image is installed.

**Backups and the log**

- **E33.** 8.2 line 3545 (CF-03); 9.10 line 4095 (CF-30). An aborted attempt's backup replaces the only kept pre-update backup. Keep the last successful update's backup until the next successful one. Otherwise the manual go-back loses its backup.
- **E34.** 9.10 line 4094; 9.7 line 4027. A return drops log entries written after the backup. Rewrite the step entries from the updater's or workflow's durable step log after a return. Otherwise the log loses who started the update and how each step went.

**SMTP (story 1.18)**

- **E35.** Lines 627–629, 632. R13 passes only self-hosted. Define the partial result: offer SMTP per host, or make the private-server setting conditional on SMTP being offered. Otherwise a setting for an unoffered feature.
- **E36.** Line 635. A Cloudflare installation enters a private mail server or port 25. On Cloudflare say these cannot be reached and point to no setting. Otherwise advice to use a setting that does not exist there.
- **E37.** Lines 626–634. The mail server offers no STARTTLS or offers plain sign-in. Refuse to send the password without encryption and say why. Otherwise the password is sent in clear.
- **E38.** Lines 633–634. A generic error cannot be told apart from a reset or an unreachable server. Classify by phase: after connecting and during encryption set-up is a secure-connection failure; before connecting is "could not be reached". Otherwise the wrong message.
- **E39.** Lines 620–641. The server accepts the connection and never replies. Add connect and response time limits to Limits, reported by the test message. Otherwise the test hangs until a platform limit ends it.
## Editorial structure

The reviewer described the stories as reference material that follows a consistent schema well, and the front sections, from Status to How to read it, as the part where Kevin acts and where the shape works against him. Word counts: 71,908 in all; stories 75%; Values and readings 12.5%; Numbering changes 2.9%.

| # | Where | Recommendation | Why |
| --- | --- | --- | --- |
| S1 | Decisions needed items 2 and 3; Values and readings | Show the kind of choice in the ID (decision, value, reading), or add a Kind column to all three tables and explain the scheme under How to read it. | A bracketed ID on a criterion does not say what kind it is, and the letters do not match epics (CF covers Epics 8 to 10). |
| S2 | Readings table (142 rows) | Add the "Kevin's decision" column the other two tables have, and say how readings are ruled: as a group or by epic. | The largest table has nowhere to record a ruling. The reviewer called this the blocker. |
| S3 | Values and readings, both tables | Add subheadings by epic inside each table. | 206 rows in two unbroken tables give no place to stop and resume. (The reviewer also read the order as wrong; it is by story, as the session checked.) |
| S4 | Status; Experiments table | Add a Status line on experiment state, and give the table three states: Done, Partly run, To run. | Status never says which experiments have results; the table shows R11 and R13 as "To run" although the stories report findings from both. |
| S5 | Status, "Updates rewritten for K20" | Condense it and fold K20 into "Confirmed by Kevin"; update the front-matter status line. | Confirmation is split across two bullets, and the list of story numbers slows reading. |
| S6 | Status first bullet | Give the date of the last change. | The draft reads as older than changes it contains. |
| S7 | How to review this draft; How to read it | Put How to review straight after Status, and How to read it before The epics. | The reading guide comes after the material it explains. |
| S8 | Story notes that mix deferrals with experiment results | Separate them: "Left to later stories" and a labelled experiment finding. | Findings, the only verified evidence here, are easy to mistake for plans. |
| S9 | Epic "Depends on" paragraphs (Epics 4, 5, 8, 9) | Shorten to the rule plus exceptions. | Long story lists repeat what the epic order and the script check already guarantee; about 400 words. |
| S10 | Numbering changes from draft 0.6 | Move to its own file and link it from Status. | Needed only by someone holding draft 0.6 references; about 2,090 words. |
| S11 | Order and validation | Move its outcome next to Status and rename it Validation checks. | Its one open item, that hidden dependencies need another read, sits far below the related open point. |
| S12 | The 16-decision table | Keep as is. | Choice, Alternative and Why let a non-developer decide without opening the story. |
| S13 | Story schema | Keep as is. | The fixed schema is what makes the stories possible to sample. |
| S14 | Standing rules; Requirement coverage | Keep as is. | They prevent repetition and sit correctly at the back. |
| S15 | Whole document | Question: also generate a short reviewer view for Kevin (Status, decisions, the epics table, each story's sentence and Core behaviour, the choice tables). | How to review already asks Kevin to read only Core behaviour; a generated view would carry that out. |

The reviewer estimated that accepting all recommendations would shorten the file by about 2,400 words (3.3%).

## Second round: the update stories after the fixes

Run on 2026-11-19 on a frozen copy of `epics.md` at commit 5b0dbc9, limited to the standing rules, story 1.1 and Epic 9, with two lenses: adversarial (30 findings: 4 dependency, 7 consistency, 5 fidelity, 10 buildability) and edge-case hunter (21). The structure lens was not repeated, because the first round's structure findings were still being applied. The session checked the critical findings against the frozen copy; they hold.

**All applied on 2026-11-19**, on Kevin's instruction to proceed with Claude's recommendations, except the check for other containers mounting the data folder (part of edge case 14), which removing the old container already makes unnecessary. The design changes are recorded in the architecture as K22 (AD-20). In outline:

| Topic | What the reviewers found | What was applied |
| --- | --- | --- |
| A successful update rolled back | Once the record is removed, a late poll or a repeated request to return finds nothing and redeploys the old version | Each attempt's outcome is kept and answered (story 9.3, 9.10, 9.12) |
| States no version can leave | The arrival deadline runs under a version not allowed to act; the version before cannot accept a request to return while installing; no container answers self-hosted; restarts with the old container running; a hung conversion after arrival; a stuck record in a release build | The version before may end an installing attempt in two named ways; deadlines on every state, including after arrival; a no-container path and restart rules for the updater; a release-build command to clear a stuck record after manual recovery (story 9.3, 9.10, 9.12) |
| Timers | A timer from an earlier attempt fires in a later one; a return restores the alarm schedule; the schedule arrives after Epic 8 already shares the alarm | Timers carry their attempt and step; the schedule is kept from restores and moved to story 1.1 |
| Restored state | A return brings ended sessions back; the health-check room is left converted | Ended sessions are re-applied; the return covers the health-check room |
| Authentication | Machine calls fit no route kind; a Worker secret cannot be read back for the repository | A fourth route kind; the update secret is shown once and can be replaced |
| Self-hosted swap | The stop time can pass before the warning; the way back is not recorded; a stale updater; two containers on one store | Stop time set after the image is verified and pulled; the running digest stored at the yes; the updater ends on a refused yes; old container removed, no restart policy |
| Class-changing release | Automatic return paths remain | A class-change flag turns them off |
| Order and gaps | The first release could be cut before the update path exists; the R14 gate needs a record it may not set; 1.1's notes point at the wrong stories; missing Access and restore lines; a refusal without wording; time limit start differs between hosts | First release gated on story 9.10 and 9.13; R14 split into a release-image check and a test-build conversion; notes, restore lines, wording (CF-46) and limits corrected |
| Precisions | Health check against a sign-in page that is switched off; alarm-driven conversion; stale lower-step calls; log copy and record removal in separate steps; fixed records against conversions; test data from before the first release | Sign-in check mode; alarm steps convert; lower steps refused first; one transaction; standing rules 2, 8 and 11 extended |
