# PhySecDesign workspace

- The Site Studio proof of concept is in `site-studio/`. Read its `AGENTS.md` before changing the application.
- Existing project context is in `site-studio/README.md`, `site-studio/POC-ROADMAP.md`, and `site-studio/design-qa.md`.
- Design references and mockups are in `design-references/` and `design-mockups/`.

## BMAD planning

- BMAD Core and Method 6.12.4 are installed at this workspace root. Use this directory as `{project-root}` for BMAD commands.
- The current Codex skills are in `.agents/skills/bmad-*/SKILL.md`. Start with `bmad-help` for workflow guidance.
- Shared configuration is in `_bmad/config.toml`, with personal settings in `_bmad/config.user.toml`. Use the installed configuration resolver to merge these settings.
- Planning artifacts belong in `_bmad-output/planning-artifacts/`. The existing prototype documents provide the starting context for planning.
- The current guided PRD workspace is `_bmad-output/planning-artifacts/prds/prd-PhySecDesign-2026-11-16/`. Before continuing PRD work, read its `source-index.md` and `.memlog.md`, then check the cited source files for changes since the inventory snapshot. Keep existing capabilities, verified evidence, and future requirements distinct.
- The UX workspace is `_bmad-output/planning-artifacts/ux/ux-PhySecDesign-2026-11-18/`. Kevin confirmed the nine design decisions in section 12 of its `ux-design-specification.md` on 2026-11-18; `design-canvas.md` links the Claude Design canvas, which holds 23 screens. Read both before architecture or UI work.
- The architecture workspace is `_bmad-output/planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/`. Kevin decided on 2026-11-18 to host on Cloudflare. He also decided that new server and shared code is TypeScript, tested with Vitest in Cloudflare's runtime, while the existing application stays in JavaScript. He confirmed the remaining decisions in section 12 of its `architecture.md` the same day; they stand subject to the seven early experiments in its section 11, and nothing in it is built or measured. `cloudflare-limits.md` records the platform limits it relies on, as read that day.
- The epics workspace is `_bmad-output/planning-artifacts/epics/epics-PhySecDesign-2026-11-18/`. Its `epics.md` is a draft of 7 epics and 66 stories covering FR-1–65, awaiting Kevin's review; nothing in it is built.
- On this Windows workstation, uv is installed at `C:\Users\Kevin\.local\bin\uv.exe`. If an existing shell has a stale PATH, invoke that executable by its full path for BMAD's `uv run` commands.
