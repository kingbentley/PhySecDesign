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
