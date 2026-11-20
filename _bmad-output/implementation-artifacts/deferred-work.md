# Deferred work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-run-the-app-on-cloudflare-with-a-portable-server-core.md`
  summary: `callObject` retries after any `durableObjectReset` error, which could run a write operation twice if the first attempt committed before the object reset for a reason other than a version stop.
  evidence: Unverified (maybe-false, medium if true). Every operation in story 1.1 is a read. Settle it with the first write operation (story 1.2): check on a deployed Cloudflare test installation whether the abort reason containing `site-studio:version-stop` reaches the caller, and if it does, retry only on that reason or only for idempotent operations.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-run-the-app-on-cloudflare-with-a-portable-server-core.md`
  summary: The data-format check in `ObjectBase.fetch` refuses every operation, including version-independent ones, so an update may have no way to reach an object whose data is not yet converted.
  evidence: Unverified (maybe-false, medium if true). Whether an exemption is needed depends on how story 9.4 (published numbering) has the update call the conversion runner; decide it there.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-run-the-app-on-cloudflare-with-a-portable-server-core.md`
  summary: Nothing checks that the local review middleware still answers `/api/reviews/` before the Worker in `npm run dev`; swapping the plugin order in `vite.config.mjs` would break development review links unnoticed.
  evidence: Real but development-only. It needs a dev-server test harness the repository does not have; until then, check by hand after any change to the Vite plugins.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/1-data-rules-and-storage.md`
  summary: Two set-up requests carrying the right code at the same moment could run two scrypt hashes (128 MiB each) in one Worker isolate, above Cloudflare's 128 MB memory limit.
  evidence: Unverified (maybe-false, medium if true). R9 ran one hash at a time. Settle it in story 1.2 spec 4 by sending two concurrent set-up requests with the right code to a deployed test installation and checking that neither fails for memory; if one does, serialise hashing (for example, one hash at a time per isolate) before the first release.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/1-data-rules-and-storage.md`
  summary: The self-hosted `nodejs_compat` flag is not yet exercised, because the built Worker bundle imports nothing from `node:crypto` until the set-up routes use `server/auth/`.
  evidence: Real but low: `host-config-flags.test.ts` checks only that both configs name the same flags. It closes in story 1.2 spec 2, when the entry imports `server/auth/` and `npm run smoke:selfhost` must load a bundle that needs the flag; confirm the smoke test still passes then.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/1-data-rules-and-storage.md`
  summary: `SetupStore`'s CREATE TABLE statements, like the META table's, run in the `Installation` constructor, before `ObjectBase.fetch` checks the release and the data format, so an older build reaching newer data would still create tables in it.
  evidence: Real but harmless before the first release (standing rule 8: a changed shape re-creates test installations). Must be fixed before Epic 9's updates: create the set-up tables only after the format check passes, or under the conversion runner.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/1-data-rules-and-storage.md`
  summary: The per-address wrong-code count keys on the address string the Worker passes, so an IPv6 client that rotates within its /64 gets a fresh count for every address.
  evidence: Real; the object cannot fix it because it only sees the string. Story 1.2 spec 2 must pass IPv6 addresses grouped by their /64 prefix (and IPv4 addresses whole) as the `address` of `setupAttempt`.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/1-data-rules-and-storage.md`
  summary: The email is trimmed before the password-not-equal-to-email check but the password is not, so a password of " a@b.c " (with spaces) passes for the email "a@b.c".
  evidence: Follows D-4's wording (passwords are taken as typed; the comparison ignores only letter case). Flag for Kevin: whether the comparison should also ignore surrounding spaces on the password side is a product choice.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/1-data-rules-and-storage.md`
  summary: During a deploy, Worker copies running the old and the new set-up code may alternate their fingerprints at the installation object, each change resetting the wrong-code counts and the tickets, and the old code keeps working briefly through the old copies.
  evidence: Real but bounded to the minutes after a deploy (experiment R11: old code keeps running for minutes). Settle in story 1.2 spec 2 (for example, the object keeps the newest fingerprint by deploy time and refuses an older one) and check on a deployed installation in spec 4.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/2-routes-retry-and-deploy-command.md`
  summary: Self-hosted, behind a web server that terminates TLS, the Worker may see `http://` and an internal host while the set-up page sends `Origin: https://<public address>`, so the origin rule (standing rule 13) would refuse every set-up and the recorded public address would be wrong.
  evidence: Unverified (maybe-false, medium if true). The set-up route compares `Origin` with the request URL's origin and records that origin (CA-57). Settle in stories 2.21/2.22: either the web server forwards the public host and scheme so the Worker's request URL is the public one, or the Worker takes them from a configured proxy only.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/2-routes-retry-and-deploy-command.md`
  summary: Self-hosted, a client can send its own `CF-Connecting-IP` header, and rotating it gives a fresh per-address wrong-code count for each value.
  evidence: Real if the bundled web server passes the header through. On Cloudflare the header is set by Cloudflare. The installation-wide cap of 100 per hour still holds, and self-hosted set-up is refused until story 2.21 issues a code. Stories 2.21/2.22 must make the web server set or strip the header (or add the configured-proxy rule).

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/2-routes-retry-and-deploy-command.md`
  summary: The deploy command's own wiring (Wrangler's output file, `wrangler secret put SETUP_CODE --name <worker>` with the code on standard input, the `--url` option) runs in no automated test.
  evidence: Real but low: only `runDeploy` and its helpers are unit-tested with Wrangler and the network stubbed, as spec 2 required. Story 1.2 spec 4 runs the command against the test account; check there that a first deploy prints a code, a redeploy with no users prints a new one, and a redeploy with an administrator prints none.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/2-routes-retry-and-deploy-command.md`
  summary: Item (d) above (old and new code fingerprints alternating during a deploy) stays open after spec 2.
  evidence: Not cheap at the routes: "keep the newest fingerprint" needs a deploy time beside the secret, and a Cloudflare rollback restores the older secret (AD-21), which would then block set-up until the next deploy. Spec 4 should measure how long old copies keep answering after a deploy and whether the old code is refused at once; decide then whether the bounded window needs handling.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/2-routes-retry-and-deploy-command.md`
  summary: Item 1 above (`callObject` retrying after any reset) is now handled as D-2 says: a write is retried only when the error carries the version-stop reason; a bare reset retries only calls marked idempotent. What remains is the deployed check that the reason reaches the caller on Cloudflare.
  evidence: In the local runtime the reason does reach the caller (`server-tests/call-retry.test.ts`). If spec 4 finds that Cloudflare drops it, writes are never retried and a version stop during a set-up request answers `internal_error`; the installer then tries again.


- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/3-playwright-and-the-set-up-page.md`
  summary: The new `browser` CI job, and with it the `webkit-iphone` Playwright project, has not run yet; the Chromium project passed locally, but the job's browser install, the WebKit run and the trace upload are unverified until the branch is pushed.
  evidence: Unverified (medium if it fails). This session has no WebKit browser and may not push. Check the first CI run of `story/1.2`: the `browser` job should pass both projects, and a failing run should upload `playwright-traces`.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/4-acceptance-on-cloudflare.md`
  summary: Story 1.2's deployed acceptance (spec 4 checks 1–11: CAP-1, CAP-2, CAP-4, CAP-7, CAP-8, CAP-9, CAP-10, the D-2 reason check, two scrypt hashes at once, the plan and item (d)) has not run, so the deployed-check items above (item 1, the scrypt-memory item, item (d) and the deploy-command wiring item) all stay open.
  evidence: Real. From the cloud session of 2026-11-20 no deployment reached Cloudflare: the proxy's injected API token most likely overwrites Wrangler's asset-upload token (every `workers/assets/upload` call answered 401), and the `site-studio-test*.physec-site-studio.workers.dev` hosts are not allowed. Run the checks from Kevin's workstation (`npm run deploy:cloudflare -- --name site-studio-test`, then `-- --name site-studio-test-b`), or from a session whose network allows those hosts and does not inject into the asset upload; the spec lists what to run.

- source_spec: `_bmad-output/specs/spec-story-1-2-set-up-a-new-installation/stories/4-acceptance-on-cloudflare.md`
  summary: Whether the "PhySec Site Studio" test account is on Workers Paid is still unconfirmed.
  evidence: Unverified. The session's token gets `Authentication error` from the subscriptions and billing endpoints; `usage_model: standard` and SQLite Durable Objects exist on the free plan too. Check the dashboard (Workers & Pages, Plans), or infer it from a deployed set-up: a free-plan Worker's CPU limit would likely stop a 128 MiB scrypt hash.
