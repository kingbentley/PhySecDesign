# Architecture experiments

Run on 2026-11-18 to test decisions in the [architecture](../_bmad-output/planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/architecture.md) before any story is built. Each folder holds the throwaway code that produced its result. Nothing here is part of the application.

**Read the limits first.** These ran in a cloud container (Intel Xeon 2.30 GHz, 4 cores, Node 22.23.5, headless Chromium), not on the reference laptop or real phones, and on synthetic test data. They show whether something is comfortably possible, clearly not, or too close to call. They are not acceptance results.

| Experiment | Question | Result |
| --- | --- | --- |
| R7 | Do Cloudflare's Vite plugin and test integration work with the prototype's versions? | **Yes.** |
| R2 | Can coverage for 60 cameras and all zones finish in 10 s at 1 m sampling or finer? | **Yes, with wide margin, but only after the prototype's work limit is replaced.** As shipped, the prototype silently falls back to 6 to 12 m sampling on this workload. |
| R1 | Can a full-size PDF package be generated in the browser within 5 minutes? | **Yes for generation (about 13 s per 250 pages). Two findings:** a 250-page volume is about 160 MiB, over the 100 MiB limit, and uploading an edition takes far longer than generating it. |
| R6 | Minimum R2 upload part size; PDF printing in Cloudflare's browser service. | **Both confirmed.** Parts are at least 5 MiB and must be equal in size; Cloudflare's browser service does produce PDFs. |
| R10 | Best trigger for a Cloudflare deployment from the interface. | **A deploy hook exists but cannot name a version.** One finding changes the update design: Cloudflare blocks rollback across a Durable Object class change. |
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

## R1 — Generating a full-size package in the browser

Folder: [r1-package-generation](r1-package-generation). The harness uses the prototype's own page and PDF code (`reportPaper.js`, `rasterPdf.js`) in headless Chromium. Pages are Letter landscape at 216 dpi (2376 × 1836 pixels), JPEG quality 0.94, as the prototype produces them. Photo pages hold two real photographs each (four test photographs fetched from a public photo service, not kept in the repository).

| Volume of 250 pages | Time | PDF size | Peak memory |
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

- A single server build for both hosts is feasible. The Node.js server and its separate storage adapters (story 9.1, most of AD-16) could be dropped.
- To stay off the experimental flag, the design would use only what ran without it: Durable Objects for project records **and** for the installation's own data (in place of D1), alarms for the daily backup and for long jobs (in place of scheduled triggers and Workflows), and a small file-store interface with two implementations (R2 on Cloudflare, the disk service self-hosted).
- The main risk is the experimental label on the storage format. An upgrade of the runtime could, in principle, be unable to read older data. That bears directly on safe updates (NFR-8). It can be managed by pinning the runtime version in each release, testing every release against data from the previous one, and keeping the portable backup as a format-independent way out.

Not determined: behaviour on power loss as opposed to process kill; whether the disk service syncs before replying; behaviour under real load and over long runs; whether the storage format survives a runtime upgrade; Docker and arm64 runs.
