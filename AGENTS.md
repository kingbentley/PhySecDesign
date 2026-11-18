# PhySecDesign workspace

- The Site Studio proof of concept is in `site-studio/`. Read its `AGENTS.md` before changing the application.
- Existing project context is in `site-studio/README.md`, `site-studio/POC-ROADMAP.md`, and `site-studio/design-qa.md`.
- Design references and mockups are in `design-references/` and `design-mockups/`.

## BMAD planning

- BMAD Core and Method 6.12.4 are installed at this workspace root. Use this directory as `{project-root}` for BMAD commands.
- The current Codex skills are in `.agents/skills/bmad-*/SKILL.md`. Start with `bmad-help` for workflow guidance.
- In Claude Code cloud sessions, BMAD 6.12.4 is installed at session start by the setup script of the personal cloud environment named "PhySecDesign" (`npx -y bmad-method@6.12.4 install --modules bmm --tools claude-code --yes`). There the skills are in `.claude/skills/bmad-*/`, not `.agents/skills/`. Both locations and `_bmad/` are gitignored, so a cloud install uses BMAD's default configuration and none of the workstation's customizations. A session started on a different environment has no BMAD until the same command is run.
- Shared configuration is in `_bmad/config.toml`, with personal settings in `_bmad/config.user.toml`. Use the installed configuration resolver to merge these settings.
- Planning artifacts belong in `_bmad-output/planning-artifacts/`. The existing prototype documents provide the starting context for planning.
- The requirements baseline is final PRD 1.2 (2026-11-18): PRD 1.0 with amendments 1.1 and 1.2, reviewed together. It covers FR-1–72, NFR-1–8 and SM-1–6, adds self-hosting, user accounts, administrator controls and in-app updates, and withdraws project edit links. `review-finalization-amendments.md` in the PRD workspace records the review and the eight decisions Kevin made during it.
- The current guided PRD workspace is `_bmad-output/planning-artifacts/prds/prd-PhySecDesign-2026-11-16/`. Before continuing PRD work, read its `source-index.md` and `.memlog.md`, then check the cited source files for changes since the inventory snapshot. Keep existing capabilities, verified evidence, and future requirements distinct.
- The UX workspace is `_bmad-output/planning-artifacts/ux/ux-PhySecDesign-2026-11-18/`. Kevin confirmed the nine design decisions in section 12 of its `ux-design-specification.md` on 2026-11-18. Section 17 covers accounts, administration and updates for amendment 1.2, with decisions D10–D14 also confirmed. `design-canvas.md` links the Claude Design canvas, which holds 34 screens. Read both before architecture or UI work.
- The architecture workspace is `_bmad-output/planning-artifacts/architecture/architecture-PhySecDesign-2026-11-18/`. Its `architecture.md` is version 2.1: a portable server core that runs on Cloudflare or as Docker on Linux, with accounts, signed public releases and in-app updates. Kevin confirmed all its decisions, K1–K3 and K5–K15, on 2026-11-18; they stand subject to its twelve early experiments, and nothing is built or measured. `cloudflare-limits.md` records the platform limits it relies on, as read that day.
- The epics workspace is `_bmad-output/planning-artifacts/epics/epics-PhySecDesign-2026-11-18/`. Its `epics.md` is draft 0.2: 10 epics and 84 stories covering FR-1–72, written against final PRD 1.2, UX 0.5 and architecture 2.1, awaiting Kevin's review. Nothing in it is built. The earlier draft is kept beside it as a `.md.txt` file.
- On this Windows workstation, uv is installed at `C:\Users\Kevin\.local\bin\uv.exe`. If an existing shell has a stale PATH, invoke that executable by its full path for BMAD's `uv run` commands.
