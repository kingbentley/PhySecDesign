# Architecture experiments

Run on 2026-11-18 and 2026-11-19 to test decisions in the [architecture](../_bmad-output/planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md) before any story is built. Each folder holds the throwaway code that produced its result. Nothing here is part of the application.

**Read the limits first.** These ran in a cloud container (Intel Xeon 2.30 GHz, 4 cores, Node 22.23.5, headless Chromium), not on the reference laptop or real phones, and on synthetic test data. They show whether something is comfortably possible, clearly not, or too close to call. They are not acceptance results.

| Experiment | Question | Result |
| --- | --- | --- |
| R7 | Do Cloudflare's Vite plugin and test integration work with the prototype's versions? | **Yes.** |
| R2 | Can coverage for 60 cameras and all zones finish in 10 s at 1 m sampling or finer? | **Yes, with wide margin, but only after the prototype's work limit is replaced.** As shipped, the prototype silently falls back to 6 to 12 m sampling on this workload. |
| R1 | Can a full-size PDF package be generated in the browser within 5 minutes? | **Yes for generation (about 13 s per 250 pages). Two findings:** a 250-page volume is about 160 MiB, over the 100 MiB limit, and uploading an edition takes far longer than generating it. |
| R6 | Minimum R2 upload part size; PDF printing in Cloudflare's browser service. | **Both confirmed.** Parts are at least 5 MiB and must be equal in size; Cloudflare's browser service does produce PDFs. |
| R10 | Best trigger for a Cloudflare deployment from the interface. | **A deploy hook exists but cannot name a version.** One finding changes the update design: Cloudflare blocks rollback across a Durable Object class change. |
| R14 | Does data written by an older runtime open under a newer one? | **Yes, across almost two years of versions**, forwards, in one jump, and backwards. First run only: it is repeated for every release. |
| R9 | Does Cloudflare accept the chosen password-hashing cost? | **No.** Cloudflare refuses any PBKDF2 call above 100,000 iterations; the plan was 600,000. Two ways round it worked on both hosts; Kevin chose scrypt (decision K19). |
| R11 (part) | On Cloudflare, what happens to running code and data at a deployment and a rollback? | **Data is untouched and nothing fails, but stored-data objects that are in use keep running the old version, for up to five minutes by default.** A deployment can ask Cloudflare to replace them at once, and that worked in about 2 seconds. AD-20 and AD-21 were rewritten for this (proposal K20). The full experiment (breaking a real update at each step) is not run. |
| R13 | Can the runtime send email over SMTP? | **Yes on both hosts as far as tested.** On a server a message was delivered with both usual forms of encrypted SMTP. From Cloudflare, encrypted connections to two public mail services were made up to the point of signing in; no message was sent from there. |
| R8 | Could Cloudflare's open-source runtime host the same build on a server? | **Largely yes.** The same Worker ran on a Linux server with durable per-project SQLite storage. File storage has no built-in equivalent, and the on-disk storage format is marked experimental. |

## R7 — Cloudflare tooling with the prototype

Folder: [r7-vite-plugin](r7-vite-plugin). The Vite configuration there points at the real `site-studio` application; no application file was changed.

Versions resolved: vite 6.4.2, @vitejs/plugin-react 5.0.4, @cloudflare/vite-plugin 1.70.0, wrangler 4.164.0, workerd 1.20261116.1, vitest 5.1.1, @cloudflare/vitest-plugin 1.8.4.

| Check | Result |
| --- | --- |
| Development server through the plugin serves the prototype | The page loads; a headless browser shows the map with all 13 markers and no page errors. |
| A Worker route backed by a SQLite Durable Object, beside the app | `/api/ping` saved and read a versioned row; a second project name got separate data. |
| Unknown app route falls back to the app | Returned the app, as the current Worker does. |
| A test running inside Cloudflare's runtime | One test passed: save, a rejected stale save, and separation between two projects. |
| Production build | Produced a client folder and a Worker bundle with its resolved configuration. |

Notes:

- The plugin's stated supported Vite range is 6.1 and later, which includes the prototype's 6.4.2.
- The test package named in the architecture, `@cloudflare/vitest-pool-workers`, is deprecated and renamed `@cloudflare/vitest-plugin`. The new one worked; its configuration differs from older examples.
- `npm install` failed once with an internal npm error and succeeded with `--legacy-peer-deps`. Worth pinning versions when the real set-up is done.
- The existing bundle-size warning remains (a 1 MB main chunk), as the architecture already expects to fix with routes loaded on demand.

## R2 — Coverage analysis at acceptance size

Folder: [r2-coverage-benchmark](r2-coverage-benchmark). `bench.mjs` runs the prototype's own modules unchanged. `bench-unbudgeted.mjs` runs a copy in `patched/` with two limits lifted.

Fixture: 60 cameras, 50 to 100 walls and obstructions (280 to 940 edges), 20 zones, on plans of 140 × 100 m and 300 × 200 m. Analysis includes DORI and display contours. Times are medians.

**As shipped.** The prototype caps total work at a fixed budget (`MAX_COMBINED_WORK`, 2,000,000) and the cell count at 20,000. On this workload the budget wins and the sampling is coarsened:

| Fixture | Requested | Sampling actually used | Floor time |
| --- | --- | --- | --- |
| 140 × 100 m, 280 edges | 1 m | 6.24 m | 10 to 20 ms |
| 140 × 100 m, 940 edges | 1 m | 12.49 m | about 10 ms |
| 300 × 200 m, 280 edges | 1 m | 7.31 m | about 11 ms |

The prototype does warn when this happens. But NFR-4 requires sampling no coarser than 1 m, so the shipped limits do not meet it on the acceptance workload. The coarse result also differed from the 1 m result by about 3 percentage points of covered area on one fixture, more than the 2-point tolerance.

**With the budget lifted** (floor analysis plus all 20 zones):

| Fixture | 1 m sampling | 0.5 m sampling |
| --- | --- | --- |
| 140 × 100 m, 280 edges | 0.2 s (14,000 cells) | 0.35 s (56,000 cells) |
| 140 × 100 m, 940 edges | 0.24 s | 0.47 s |
| 300 × 200 m, 280 edges | 0.17 s (60,000 cells) | 0.48 s (240,000 cells) |

Conclusion: the 10-second target has more than twenty times headroom on this machine even at 0.5 m. The fixed work budget is a worst-case estimate that is far too cautious, because most cameras are skipped by a bounding-box test. It should be replaced by a limit based on measured time, with the calculation in a Web Worker as planned (AD-9). The fallbacks listed for R2 (incremental recomputation, several workers, a spatial index) are not needed on this evidence.

Not shown: accuracy against an independent reference, real building geometry, or a phone.

**End to end in one run (added 2026-11-19).** The table above adds two separately measured medians. `bench-unbudgeted.mjs` now also times the floor analysis and all 20 zones together in a single run, nine times per case, on a 2.10 GHz Xeon:

| Fixture | 1 m sampling: median (slowest) | 0.5 m sampling: median (slowest) |
| --- | --- | --- |
| 140 × 100 m, 280 edges | 148 ms (166 ms) | 316 ms (352 ms) |
| 140 × 100 m, 940 edges | 205 ms (220 ms) | 468 ms (569 ms) |
| 300 × 200 m, 280 edges | 217 ms (235 ms) | 513 ms (556 ms) |

The single-run figures agree with the sums and leave the conclusion unchanged: the slowest run is about one eighteenth of the 10-second target.

Two notes on the R2 scripts. The "total" they once printed was the sum of two separately measured medians (floor, then all zones), not one timed run; the scripts now label it so, and the headroom conclusion does not depend on the difference. The files in `patched/` are copies of the prototype's code with only the work budget and cell cap lifted, so they carry the prototype's behaviour elsewhere, including two points raised in review that story 2.8 now names: the contour mesh has no limit of its own once the cell cap is lifted, and the polygon clipping step tests against a small tolerance but intersects at zero.

## R1 — Generating a full-size package in the browser

To run it again: put four JPEG photographs named `p1048.jpg`, `p1067.jpg`, `p122.jpg` and `p164.jpg` in `r1-package-generation/photos/` (the folder is ignored by git, and every mix the runners use has photo pages). The R1 and R7 browser scripts import Playwright from a global installation, as the cloud session provided; elsewhere, install `playwright` and its Chromium first. A global package is not on Node's module path by default, so the scripts were run with `NODE_PATH=$(npm root -g)` set, as they were in the session that produced these results. Memory was sampled as pages were generated, not during packing and hashing, so the figures below can understate the peak of the whole operation.

Folder: [r1-package-generation](r1-package-generation). The harness uses the prototype's own page and PDF code (`reportPaper.js`, `rasterPdf.js`) in headless Chromium. Pages are Letter landscape at 216 dpi (2376 × 1836 pixels), JPEG quality 0.94, as the prototype produces them. Photo pages hold two real photographs each (four test photographs fetched from a public photo service, not kept in the repository).

| Volume of 250 pages | Time | PDF size | Peak memory while pages were generated |
| --- | --- | --- | --- |
| 30 plans, 120 schedule pages, 100 photo pages | 12.1 s | 155.7 MiB | 157 MB |
| 250 photo pages (500 photos) | 13.1 s | 173.1 MiB | 175 MB |

Per page: about 40 to 55 ms and 570 to 710 KiB. Schedule pages are nearly as large as photo pages, because text is stored as a high-quality image.

Findings:

1. **Generation time is not a problem.** A full edition of about 760 pages (the PRD's example with 1,200 photos) would take about 40 seconds here, against a 5-minute target.
2. **The 100 MiB volume limit is reached at about 150 pages, not 250.** The PRD allows splitting at whichever limit comes first, so this works, but an edition would have about five volumes, not four. At JPEG quality 0.85 a 250-page volume is about 106 MiB, and at 0.75 about 83 MiB; whether those stay legible needs a person to judge on paper. Drawing text as text instead of as an image would shrink schedule pages greatly and make them searchable; that is a larger change to the exporter.
3. **Upload, not generation, is the slow part.** An edition of about 480 MiB must be uploaded before it counts as retained. At the reference 5 Mbps uplink that is about 13 minutes. The PRD measures transfers separately from the 5-minute processing target, so this does not fail a requirement, but it is the real waiting time a user would see, and the tab must stay open throughout. Rendering on the server would avoid the upload.
4. **Memory is fine** at one volume at a time, as long as each volume is uploaded and released before the next.

Conclusion: decision K3 (generate in the desktop browser) is workable. It should be taken with finding 3 in view.

## R6 — Two unconfirmed platform facts

From Cloudflare's documentation, read 2026-11-18.

- **R2 multipart uploads.** Parts are at least 5 MiB and at most 5 GiB, up to 10,000 parts, and every part except the last must be the same size. An unfinished upload is aborted automatically after 7 days by default. Each part returns an identifier that is the MD5 of its contents. The architecture's 8 MiB parts (AD-4) fit. The equal-size rule means the browser must cut parts at fixed boundaries.
- **Cloudflare's browser service** (renamed Browser Run) renders a URL or HTML to PDF, through a REST endpoint or a Worker binding. Request bodies are limited to 50 MB. On the Workers Paid plan 10 browser hours a month are included, then 0.09 US dollars an hour. No limit on page count or output size was stated. It is a workable fallback for R1 on Cloudflare; a self-hosted server would need its own headless browser.

Not confirmed: whether the scripted-browser route can print PDFs, and any page-count or output-size limit.

## R10 — Triggering a Cloudflare deployment, and going back

From Cloudflare's and GitHub's documentation, read 2026-11-18.

**Triggers.**

| Option | What it needs stored | Can it deploy a chosen version? |
| --- | --- | --- |
| Cloudflare deploy hook | One secret URL. Anyone holding it can start a build. | No. It builds the latest commit of one fixed branch and accepts no parameters. |
| Cloudflare Builds API | A Cloudflare API token with the Workers CI Write permission. | Yes, by commit hash or branch. |
| GitHub Actions manual run | A GitHub token for that repository. The documentation states the classic `repo` scope; the narrower fine-grained permission was not confirmed. | Yes, by tag and by named inputs. |

A deploy hook holds the least dangerous secret, but it cannot ask for a particular release. It would suit a design in which each organisation's repository has a branch that always points at the release to install.

**Going back.** Cloudflare can redeploy an earlier version of a Worker (the last 100 are kept), by command line or dashboard. No REST endpoint for it was found. Two documented limits matter to the update design (AD-21, experiment R11):

- Rollback is **blocked** when a Durable Object class was added, renamed or removed between the two versions.
- Rollback does **not** undo changes to stored data. Cloudflare warns of errors if older code meets data whose structure has changed.

Consequences for the architecture:

- The return path on Cloudflare cannot rely on rollback for any release that changes a Durable Object class. Such releases need to be rare and flagged, with their own procedure.
- Restoring the pre-update backup after a failed data conversion remains the application's job on both hosts, as AD-20 and AD-21 already say.

Not confirmed: a REST rollback endpoint; whether a Worker can read its own version at run time; whether secrets are restored by a rollback.

## R8 — Cloudflare's open-source runtime as the self-hosted server

Folder and full record: [r8-workerd-server/RESULTS.md](r8-workerd-server/RESULTS.md). Run with workerd 1.20261118.1 on Linux x86-64. Nothing was deployed to Cloudflare, so identical behaviour on both hosts is not verified.

What was observed:

| Test | Result |
| --- | --- |
| A Worker with a SQLite-backed Durable Object, unmodified, served by `workerd` alone | Works, without any experimental flag. |
| Data after a normal stop and restart | Kept. One SQLite file per object on local disk. |
| Data after `kill -9`, 45 times, including mid-burst | Every acknowledged write survived (1,367 of 1,367). The runtime syncs to disk before replying. |
| A multi-statement change that throws part-way | Rolled back completely. |
| Alarms (timers on an object) | Fired on time, survived restarts, and fired at start-up when they came due while the process was down. |
| Speed | About 720 to 830 small writes a second in sequence; about 1,800 a second with 16 in flight. |
| Password hashing (PBKDF2-SHA256, 600,000 iterations) | 74 to 78 ms. |
| Writing and reading a 20 MB file through the built-in disk service | Works, with streaming and range reads. No checksum or metadata support. |
| R2 | No built-in equivalent. |
| D1, Workflows, Queues, scheduled triggers | Present only behind an `--experimental` flag. Scheduled triggers were tested and worked; the others were not tested. |
| Packaging | One 162 MB binary for Linux x64 and arm64 (needs glibc 2.35 or later; no Alpine build). No Node.js needed at run time. |

What Cloudflare says:

- The runtime's stated purposes include use "as an application server, to self-host applications designed for Cloudflare Workers", and its documentation describes running it in production under systemd.
- It is "not a hardened sandbox" for running untrusted code. Site Studio would run only its own code, so this is not the concern it first appears.
- The on-disk Durable Object storage is labelled, in the configuration schema, "EXPERIMENTAL; SUBJECT TO BACKWARDS-INCOMPATIBLE CHANGE".
- Miniflare and `wrangler dev` are described only as development and testing tools.

What this means for the architecture:

- A single server build for both hosts is feasible. The Node.js server and its separate storage adapters (then story 9.1, now story 2.13; most of AD-16) could be dropped.
- To stay off the experimental flag, the design would use only what ran without it: Durable Objects for project records **and** for the installation's own data (in place of D1), alarms for the daily backup and for long jobs (in place of scheduled triggers and Workflows), and a small file-store interface with two implementations (R2 on Cloudflare, the disk service self-hosted).
- The main risk is the experimental label on the storage format. An upgrade of the runtime could, in principle, be unable to read older data. That bears directly on safe updates (NFR-8). It can be managed by pinning the runtime version in each release, testing every release against data from the previous one, and keeping the portable backup as a format-independent way out.

Not determined: behaviour on power loss as opposed to process kill; whether the disk service syncs before replying; behaviour under real load and over long runs; whether the storage format survives a runtime upgrade; Docker and arm64 runs.

## R14 — Data written by an older runtime, opened by a newer one

Folder: [r14-runtime-upgrade](r14-runtime-upgrade). Run on 2026-11-19 with `./install.sh && node run.mjs`. The Worker is the R8 arrangement: a SQLite-backed Durable Object on local disk, started without the experimental flag.

Runtime versions used, oldest first: 1.20250109.0, 1.20250701.0, 1.20260101.0, 1.20260701.1 and 1.20261119.1 (January 2025 to November 2026).

Method: the oldest runtime wrote 2,000 rows to each of three objects (text with non-ASCII characters, numbers and binary values), one entry through the key-value interface, and an alarm set for 2030. Each newer runtime in turn then opened the same folder, and the script compared row counts, a SHA-256 digest of every row, the pending alarm and SQLite's own integrity check with what the previous runtime had reported. Each runtime then added 500 rows, so every version also wrote.

| Step | Result |
| --- | --- |
| Open with each of the four newer runtimes, one after another | Identical digests, counts and alarm each time; integrity check `ok`. |
| The next-to-last runtime killed without warning straight after writing | The newest runtime found every row. |
| Straight jump from the oldest runtime to the newest | Identical data. |
| Going back: data last written by the newest runtime, opened by the oldest | Opened and read correctly, with the same digest. |

On disk each object is one ordinary SQLite database file with its write-ahead log, named by the object's identifier.

What this does and does not show. The format did not change in a way that mattered across 22 months of releases, in either direction, for this data. It is still labelled experimental by Cloudflare, so a future release could change it; the plan to pin the runtime version and repeat this check against the previous release's data in every release (story 9.5) stands. Not covered: alarms actually firing after an upgrade, data written while a compatibility flag changed behaviour, very large databases, and the installation's own data once it exists.

## R13 — Email over SMTP from the runtime (self-hosted half)

Folder: [r13-smtp](r13-smtp). Run on 2026-11-19 with `npm install && ./run.sh`, runtime 1.20261119.1. `worker.js` is a small SMTP client written on the runtime's outbound socket interface (`connect()` from `cloudflare:sockets`). `smtp-server.mjs` is a throwaway mail server on the same machine with a certificate from a test authority that the runtime is configured to trust.

| Case | Result |
| --- | --- |
| Encrypted from the first byte (the port 465 style), signing in with a user name and password | Message delivered, content intact including a line starting with a dot and non-ASCII text. About 9 ms. |
| Starting unencrypted and upgrading with STARTTLS (the port 587 style), then signing in | Message delivered. About 50 ms. |
| Wrong password | Refused by the server; the Worker reports the server's reply. |
| No encryption | The test server refuses sign-in without encryption; the Worker reports it. Nothing sent. |
| Server certificate does not name the address used | Connection refused by the runtime, in both styles. |
| Certificate from an authority the runtime does not trust | Connection refused by the runtime, in both styles. |
| Nothing listening | Reported as a failed connection. |

Findings that affect the design:

- **It works on a server**, so SMTP can be offered on self-hosted installations as far as this half goes.
- **Reaching a mail server on a private network needs a line of runtime configuration.** By default the runtime's outbound connections may reach only public addresses. The configuration here allows private ones and lists the test authority as trusted. An organisation whose mail server uses a private certificate authority would need that authority added the same way, which is a deployment setting, not something the Settings screen can do.
- **Certificate failures reach the Worker as a generic error.** The reason ("not valid for name", "unknown issuer") appears only in the runtime's log. "Send a test message" can say the secure connection failed, but must point the administrator at the server log for why.
- **`localhost` did not resolve to the address the test server first listened on** (127.0.0.1 only); the connection failed until the server listened on all local addresses. A mail server named by host name must be reachable on whatever address that name resolves to inside the container.
- The option meant to state the expected server name when upgrading with STARTTLS is not supported by this runtime (it logs a warning), but the certificate was still checked against the host name connected to.

Not tried on a server: a real mail provider, other sign-in methods than user name and password, large messages or attachments. The Cloudflare half is in the next section.

## R9 and the Cloudflare half of R13 — on Cloudflare's hosted platform

Folder: [cloudflare-probes](cloudflare-probes). Run on 2026-11-19 against one throwaway Worker, `site-studio-experiments`, deployed to a test Cloudflare account with `deploy.sh`. `run-local.sh` runs the same `worker.js` under the open-source runtime for comparison. The account's plan could not be read with the token used, so it is not recorded here.

Times on Cloudflare are measured from the calling machine and include the network: a request that does no hashing took about 150 ms (median of 7 to 11 calls). Time measured inside a Worker does not advance during computation on Cloudflare, so it cannot be used.

### R9 — password-hashing cost

| What was tried | On Cloudflare | Under the open-source runtime |
| --- | --- | --- |
| PBKDF2-SHA256, 600,000 iterations, through Web Crypto (the plan) | **Refused:** "iteration counts above 100000 are not supported". | Works, about 105 ms. |
| The same through the Node.js-compatible interface | Refused with the same message. | Works, about 115 ms. |
| PBKDF2, exactly 100,000 iterations | Works; no measurable time beyond the bare request. 100,001 is refused. | Works, about 17 ms. |
| PBKDF2-SHA256 called six times in a row, each call 100,000 iterations and salted with the previous result | Works, about 305 ms in all (about 150 ms of work). | Works, about 100 ms. |
| scrypt (N = 131,072, r = 8, p = 1) through the Node.js-compatible interface | Works, about 510 ms in all (about 360 ms of work). | Works, about 425 ms. |
| scrypt (N = 65,536, r = 8, p = 1) | Works, about 310 ms in all. | Works, about 185 ms. |

Every method that worked on both hosts produced the same result on both, so a password stored on one host can be checked on the other.

What this means. The planned hash cannot be used on Cloudflare, and 100,000 iterations of PBKDF2-SHA256 is well below the 600,000 that current published guidance (OWASP) gives for it. The architecture named two fallbacks: a lower count within current guidance, which this result rules out, and Argon2id in WebAssembly, which was not tried. Two options that need no extra code both worked:

- **scrypt at N = 131,072, r = 8, p = 1**, which is one of the settings OWASP lists for scrypt. It is a standard algorithm designed to cost memory as well as time, and adds roughly a third of a second to a sign-in.
- **Six chained PBKDF2 calls**, the same total work as the plan. It is faster, but it is a home-made arrangement that no published guidance describes.

Not determined: Argon2id in WebAssembly; behaviour under many sign-ins at once; whether the account's plan limits computing time per request in a way that matters (none of these runs was cut off).

### R13 on Cloudflare — SMTP over outbound sockets

The Worker spoke SMTP to public mail services as far as is possible without an account: greeting, introduction, upgrade to encryption where that applies, and goodbye. No sign-in was attempted and no message was sent.

| Case | Result |
| --- | --- |
| `smtp.gmail.com`, port 465, encrypted from the first byte | Connected; the server offered sign-in. About 150 ms. |
| `smtp.gmail.com`, port 587, upgraded with STARTTLS | Upgraded; the server then offered sign-in. |
| `smtp.office365.com`, port 587, upgraded with STARTTLS | Upgraded; the server then offered sign-in. |
| Port 25 | Refused by Cloudflare: "Connections to port 25 are prohibited". |

So the socket interface and both forms of encryption work from Cloudflare, and port 25 cannot be used. Together with the delivery shown on a server, this is good evidence that SMTP can be offered on both hosts. What remains unproven is a complete delivery from Cloudflare with a real mailbox's user name and password, which needs a mail account to test with.

## R11 (first part) — deployment and rollback on Cloudflare, observed from outside

Folder: [r11-cloudflare-rollback](r11-cloudflare-rollback). Run on 2026-11-19 on the test Cloudflare account, on the Worker `site-studio-experiments` (which these runs replaced; `../cloudflare-probes/deploy.sh` puts the R9 and R13 Worker back). `worker.js` is one Worker with a SQLite-backed Durable Object. It is deployed repeatedly with a different version letter, and every row an object writes records the version of the Worker that called it, the version of the object's own code, and an identifier that changes each time the object is started. `run.py` keeps the Worker and two objects busy (a request every quarter second, an alarm every second, and one request held open for 45 seconds), changes the deployed version after 12 seconds, and reports what ran when.

This is the part of R11 that can be run before the update code exists. It does not break a real update at each step.

| Observation | Result |
| --- | --- |
| Time for a new deployment to answer requests | About 0.5 s after the API call returned, in all three runs. No answer came from the old version after the first from the new one, and no request failed. |
| Rollback to the previous version through Cloudflare's deployments interface | Behaved exactly like a deployment: about 0.5 s, nothing failed. |
| Stored data across deployment and rollback | Unchanged. 325 rows written before a rollback were identical afterwards. |
| A request held open for 45 seconds across the change | Completed normally, under the old version. |
| **Objects that were in use at the change** | **Kept running the old version's code.** In the three one-minute runs they never switched. In a longer run, one object kept busy by an alarm every second and one by a request every half second both ran the old code for between 280 and 320 seconds, then were restarted on the new version within about a second of each other. |
| An object used 5 seconds before the change and then left alone | Still the old version 3 seconds after; the new version by 15 seconds after. |
| Objects idle for some minutes, and objects never used before | The new version on their first request. |
| Mixed versions | For as long as an object stayed on the old code, every request reached it through the new version of the Worker: over a hundred such rows in each one-minute run. |
| Order of writes inside one object | Never an old-version row after a new-version row. The switch is a restart with a new start identifier. |
| An object on old code asked to stop itself (`ctx.abort()`) | Restarted on the new version on the next call, and its alarms carried on under the new version. The call that asked for it returned an error, and a row written in that same call was not kept. |

What this means for the update design (AD-20, AD-21):

- **"The new version starts" is not one moment.** The entry code changes in half a second, but each project's object, and the installation's own object, changes only when it is next restarted, which for an object in steady use took about five minutes. A conversion that runs "when the new version starts" therefore runs at a different time for every object, and the health check cannot assume it has happened.
- **Old code keeps running against live data after a deployment, and after a rollback.** This is the stale-version case recorded as an open point in AD-20, and it is the normal behaviour, not a rare race. Rules that the old version must obey after the change (stop accepting changes, do not restore) have to be enforced by data that the old code already checks, or by making each object restart.
- **A way to force the change exists.** An object that learns from its caller that a newer version is deployed can stop itself and come back on the new code at once. Since every request reaches an object through the entry code, which switches immediately, the entry code can tell each object which version it should be. This was shown for one object; it is a candidate mechanism, not a design.
- The five-minute figure is documented. Cloudflare's documentation, read after these runs, says that since 30 October 2026 an active Durable Object defers a code update until it next goes idle, for up to 300 seconds by default, and that a deployment can ask for `immediate` instead ([Durable Objects code updates](https://developers.cloudflare.com/durable-objects/deployments/durable-objects-code-updates/)). It also says code changes reach the world "in an eventually consistent manner", so a new Worker can call an object on old code.
- **A deployment in `immediate` mode was then tried** on a busy object (an alarm every half second): the object was running the newly deployed version about 2 seconds after the deployment call, with a new start identifier and no old-version row after the first new one. This is what the revised AD-20 and AD-21 use.

Not determined: what decides when Cloudflare restarts a busy object; behaviour with users in several regions; a deployment that changes a Durable Object class; whether a rollback is refused in the cases experiment R10 read about; and everything that needs the real update code.

## R11 (second part) — rollback in `immediate` mode, and secrets across a rollback

Folder: [r11-cloudflare-rollback/part2](r11-cloudflare-rollback/part2). Run on 2026-11-19 from a Windows workstation with `node run.mjs`, on the same throwaway Worker and test account as the first part, deployed with Wrangler 4.165.0 instead of the REST API. `worker.js` is the first part's probe with one added route, `/key`, which returns a short SHA-256 hash of a secret named `KEY`, never the secret itself.

Method: version A was deployed; the secret was set to one value and then to a second (each change makes a new version); version B was deployed and inherited the second value. A Durable Object was kept busy (an alarm every half second and a write request every quarter second). The run then rolled back to the version of A that held the first value, with `wrangler rollback <version> --durable-objects-code-update-mode immediate`, and afterwards rolled back to B with no mode given. Times are measured from when the Wrangler command returned; each command itself took 12 to 14 seconds.

| Observation | Result |
| --- | --- |
| Rollback with `--durable-objects-code-update-mode immediate` | Accepted. Entry code answered as A 6.7 s after the command returned; the busy object wrote as A 11.9 s after. |
| Secret after that rollback | The hash matched the one read after the first value was set, not the one read after the second; see the limits below. |
| Rollback with no mode given | Entry code answered as B 6.2 s after the command returned; the busy object was still running A at the end of the 60-second watch, as with the default deferral of a deployment. |
| Failed requests | 1 of 664. |

What this means for the update design (AD-20, AD-21):

- **A rollback accepts the `immediate` mode**, so the return can use Cloudflare's rollback as planned; redeploying the previous bundle stays as a fallback but is not needed for this reason.
- **A rollback restores the secrets of the version it returns to.** A Worker secret changed after that version would be undone. The update secret is kept in the installation's storage, not as a Worker secret (K22), and the deployment key is never changed once created, so neither is affected; no Worker secret may be changed while an update is under way.
- The times here are longer than the first part's (about 0.5 s for the entry code and 2 s for an object in `immediate` mode) because they are measured from the end of a Wrangler command, not from the REST call, and come from a single run.

Not determined: a rollback across a Durable Object class change; behaviour with users in several regions; everything that needs the real update code. The throwaway Worker was deleted after this run.

**Limits of this run, found afterwards by CodeRabbit's review of pull request 3:**
- **Polling gaps.** The script ran Wrangler synchronously, which paused both polling loops while each rollback command ran (about 14 and 12 seconds). The count of 1 failed request in 664 therefore says nothing about those two intervals.
- **Secret check.** The hashes read were real, distinct values, not missing answers, but the script did not confirm that each baseline hash belonged to the value just set, because it neither waited for the change nor compared against a hash of that value. On its own the run therefore supports, but does not establish, that a rollback restores the version's own secrets. Cloudflare's documentation agrees with it: since 2024-06-20, the rollback API asks for confirmation when a secret's value in the version rolled back to differs from the current one (Workers changelog). The plan's rule that no Worker secret may change during an update rests on both. The revised script confirms the baselines, and a rerun would settle it.
- **The revised script.** It runs Wrangler asynchronously, counts failures during each command, and confirms each secret's hash against one computed locally, stopping as inconclusive if it cannot. It also states the Node 22.12.0 prerequisite of Wrangler 4.165.0. It has not been run again.
