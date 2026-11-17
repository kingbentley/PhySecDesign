# Third-party notices

The root MIT license applies to original PhySecDesign code and documentation. It does not relicense third-party software, map data or imagery, trademarks, or linked reference material. Product references do not imply affiliation or endorsement.

## Software dependencies

The following direct dependencies and versions are recorded in `site-studio/package-lock.json`. Their own license and copyright notices remain applicable.

| Package | Declared license | Upstream |
| --- | --- | --- |
| `react`, `react-dom` | MIT | https://github.com/facebook/react |
| `@phosphor-icons/react` | MIT | https://github.com/phosphor-icons/react |
| `vite` | MIT | https://github.com/vitejs/vite |
| `@vitejs/plugin-react` | MIT | https://github.com/vitejs/vite-plugin-react |
| `leaflet` | BSD-2-Clause | https://github.com/Leaflet/Leaflet |
| `pdfjs-dist` | Apache-2.0 | https://github.com/mozilla/pdf.js |

The lockfile also records transitive packages under MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, and CC-BY-4.0 terms. This table is an inventory, not a substitute for the upstream license texts and required notices. Before distributing a compiled build or bundled dependencies, retain the applicable copyright, license, attribution, and NOTICE files, including notices for bundled fonts and other assets. The PDF.js preparation script copies its LICENSE and resource directories into the generated assets.

BMAD framework code and generated skills are not included in this repository. Separately installed BMAD components retain their upstream terms.

## Maps and reference material

- OpenStreetMap data is credited to OpenStreetMap contributors and is subject to its [copyright and license terms](https://www.openstreetmap.org/copyright). Tile services have separate [usage requirements](https://operations.osmfoundation.org/policies/tiles/).
- Satellite imagery is obtained from USGS services. Consult the [USGS reuse guidance](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map) and the specific dataset metadata for attribution and any restrictions.
- Optional Google Maps use is governed by [Google Maps Platform terms](https://cloud.google.com/maps-platform/terms). The project license does not grant rights to Google imagery or remove API configuration requirements.
- QA captures may include third-party maps. Map content retains its original terms and attribution, independent of the project's MIT license. Do not remove provider attribution when reusing those captures.
- External product references are linked in [`design-references/README.md`](design-references/README.md). Their screenshots and marketing imagery are not included in the public repository.
- The demonstration site drawings are fictional. No licensed PSP reference collection or standards text is included or licensed by this project.
