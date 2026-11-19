# Cloudflare limits used by the architecture

**Note for architecture 3.0.** D1, Workflows, Queues and scheduled triggers are no longer used: all records are in Durable Objects and jobs are driven by Durable Object alarms, so that the same build runs under Cloudflare's open-source runtime. Their rows below are kept for reference only. Experiment R6 has since confirmed the R2 multipart part size (at least 5 MiB, equal parts) and that Cloudflare's browser service renders PDFs; see [experiments/README.md](../../../../experiments/README.md).

Read from Cloudflare's documentation on 2026-11-18; the pages showed last-updated dates between 14 October and 13 November 2026. The figures were transcribed from the pages, not copied verbatim, and Cloudflare changes them over time. Check the source page before relying on any figure for a commitment.

| Product | Figure | Why it matters here |
| --- | --- | --- |
| Workers | Request body limit 100 MB on Free and Pro domains, 200 MB on Business | A 100 MiB plan PDF is slightly larger, so uploads go in parts (AD-4). |
| Workers | Processor time per request: 10 ms on Free; 30 s by default and up to 5 min on Paid | The Paid plan is required. |
| Workers | 128 MB memory per instance | Files are streamed, never held whole; analysis and rendering stay in the browser. |
| Workers | Static asset files up to 25 MiB each | The built application and pdf.js resources fit. |
| Workers | Scheduled jobs: up to 15 min duration | The daily trigger only starts jobs; the work runs in Workflows. |
| Workers Paid | 5 US dollars a month minimum; includes 10 million requests and 30 million processor-milliseconds | Polling by two users stays well inside this. |
| Durable Objects | 10 GB of SQLite storage per object on Paid (1 GB on Free, per the page's FAQ) | Records and history per project, estimated near 300 MiB. |
| Durable Objects | Row, string or blob up to 8 MB | Snapshots are stored in R2, not in a row. |
| Durable Objects | Point-in-time recovery for 30 days | Extra protection beside the backup job. |
| Durable Objects | After a deployment, an object in use keeps running its previous code for up to 300 seconds by default ("deferred" code updates, since 30 October 2026); a deployment can ask for `immediate` instead. Read on 2026-11-19 and observed in experiment R11. | Updates deploy in `immediate` mode, and every call carries its version so that an object on other code refuses and restarts (AD-20). |
| Durable Objects Paid | 1 million requests a month included, then 0.15 US dollars per million | Sets the cost of polling. |
| D1 | 10 GB per database on Paid; Time Travel restore for 30 days | Used only for the small registry and backup catalogue. |
| R2 | Objects up to 5 TiB; single upload up to 5 GiB; multipart up to 10,000 parts | Holds every file, including a 10 GiB portable backup. |
| R2 | 10 GB-month free, then 0.015 US dollars per GB-month; no charge for downloads | An 8 GiB project plus backups costs cents a month. |
| Workflows | Up to 10,000 steps by default; 30 s processor time per step, configurable to 5 min; no limit on elapsed time per step | Backup, restore and portable-backup jobs. |
| Queues | 128 KB messages; 15 min consumer duration | Not used in this design; noted in case jobs need it. |

Not confirmed from the pages read:

- The minimum part size for R2 multipart uploads.
- Whether Cloudflare's browser service ("Browser Run") can print a page to PDF. It allows 200 concurrent browsers on Paid.
- Whether Workflows is described as generally available.

Sources:

- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/r2/platform/limits/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/workflows/reference/limits/
- https://developers.cloudflare.com/queues/platform/limits/
- https://developers.cloudflare.com/browser-rendering/platform/limits/
