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
