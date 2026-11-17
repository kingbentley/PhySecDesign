# PhySecDesign

Physical security planning workspace containing the Site Studio proof of concept, design references, and BMAD planning artifacts.

## Project layout

- [`site-studio/`](site-studio/README.md): the React/Vite prototype, with geographic site-plan overlays, equipment placement, camera coverage, cable routing, and local project storage.
- [`design-mockups/`](design-mockups/): visual design mockups.
- [`design-references/`](design-references/README.md): links to external product references.
- [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/): product planning documents.
- [`AGENTS.md`](AGENTS.md): workspace instructions for coding agents.

## Run Site Studio

Requires Node.js 22.13 or newer (or Node.js 24+) and npm.

```sh
cd site-studio
npm ci
npm run dev -- --host 127.0.0.1 --port 4174
```

Open <http://127.0.0.1:4174/>. See the [Site Studio README](site-studio/README.md) for usage, build commands, and prototype limitations. The [POC roadmap](site-studio/POC-ROADMAP.md) describes scope; [design QA notes](site-studio/design-qa.md) record verification separately.

Dependencies, generated build/PDF.js assets, local environment settings, and private review data are excluded from version control. All files under `_bmad/`, including configuration and customizations, and generated agent skills are also excluded; planning artifacts under `_bmad-output/` are retained. BMAD Core and Method 6.12.4 are used by this workspace.

## License and scope

Original project code and documentation are available under the [MIT License](LICENSE). Third-party dependencies, map data and imagery, and referenced products retain their own terms; see [third-party notices](THIRD_PARTY_NOTICES.md). Vendor reference screenshots are kept outside the public repository.

Site Studio is a proof of concept with fictional demonstration drawings. Its coverage, equipment, capacity, and cost estimates are illustrative, not certified engineering or a guarantee of security performance. Validate real designs with qualified professionals and applicable requirements.
