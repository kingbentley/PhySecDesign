# Floor context when restoring an archived device

Research date: 2026-11-17 (America/Chicago).

Purpose: a small official-source check supporting the next POC restoration decision. The existing identity rule remains: restoring the same physical device retains its asset ID. The proposed handling of changed or missing floors below is product-specific, not verified competitor behaviour or implemented Site Studio scope.

## Relevant precedent

- **Plan backgrounds and scale are mutable.** CCTV Design Tool lists background replacement and scale changes in its Project menu. Its setup documentation also supports cropping and rotation and uses a known dimension to establish scale for measurements, FOV and cable calculations. [Quick Start, Left toolbar](https://docs.cctvdesigntool.com/quick-start/), [Creating Project, Setting image scale and Adjusting background image](https://docs.cctvdesigntool.com/quick-start/creating-project.html)
- **A floor's display name or position can change.** CCTV Design Tool allows floor names/heights to be edited and floors to be reordered. Its deletion documentation removes the floor's objects and renumbers remaining floors. This demonstrates that a displayed name or ordinal is not necessarily durable location context; it does not establish the vendor's internal identity model. [Floors, Editing floor properties, Reordering floors and Deleting floors](https://docs.cctvdesigntool.com/ui-guide/floors.html)
- **Retain asset history separately from the current view.** SiteOwl describes updated as-built records, device modification histories and archives for inactive assets. This supports preserving historical context, but does not specify archived plan versions or restoration after a floor changes. [Physical security asset management, Detailed device histories and Historical asset archives](https://getsiteowl.com/use-cases-asset-management/)

These pages do not document an automatic alignment/remapping algorithm, stable-ID restoration contract, deleted-floor recovery workflow or connection restoration semantics. No such vendor capability is inferred.

## Recommended POC boundary

1. **Resolve the floor by stable ID.** A rename alone keeps the same floor association. Show the current floor name and retain the archived name as historical context. Do not match a different floor merely because its name or ordinal resembles the old one.
2. **Preview historical placement.** Show the former position/orientation as historical information. If the background, calibration or alignment changed, require placement confirmation on the current plan before committing the restore. Old coordinates are not proof that the device still belongs at the same visible location. If change detection is unavailable, treat placement as needing review.
3. **Handle missing floors explicitly.** Let the user select an existing floor or create one through the normal floor workflow, then place the device. Do not silently recreate a deleted floor, reuse another floor's name as identity, or manufacture calibration/alignment.
4. **Preserve the old context.** Keep prior evidence and the available historical plan reference/snapshot, floor ID/name, placement and calibration/alignment context associated with the archived record. Restoration adds a current placement and dated history entry rather than rewriting earlier evidence. If legacy plan context is unavailable, say so; do not substitute the current plan as if it were the historical one.
5. **Commit only a completed restoration.** Preview and selection remain provisional. Cancelling an incomplete restore leaves the device archived, without a partially restored placement. This concerns the device restoration; a floor independently created through the normal workflow is a separate action.
6. **Keep connection and validation rules intact.** Restoring placement does not reconnect historical cables, reclaim old ports or inherit a passing result. Review current connections separately under the existing lifecycle rules.

This is a bounded placement-confirmation workflow, not automatic plan registration, full drawing-version management, floor undelete, bulk migration, live discovery or a claim that old evidence describes the current installation.
