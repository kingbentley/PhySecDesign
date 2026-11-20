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
