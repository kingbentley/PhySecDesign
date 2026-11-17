# Asset and connection lifecycle reference

Research date: 2026-11-17 (America/Chicago).

Purpose: narrow official-source context for retirement, replacement, restoration and connection history. Existing user decisions remain the baseline: removed devices are archived; a replacement receives a new linked ID; restoration of the same physical device retains its ID; passing results are not inherited; planned actions and actual changes remain separate.

## What the sources support

- **Retain history while distinguishing active assets.** SiteOwl describes device timelines containing installation, service and modification information, alongside archives for inactive devices and updated as-built records. This supports preserving historical context without presenting removed equipment as currently active. [Physical security asset management, Detailed device histories and Historical asset archives](https://getsiteowl.com/use-cases-asset-management/)
- **Retirement should not erase the old record.** SiteOwl's asset-management guide explicitly describes archiving retired devices and retaining information about their decommissioning, removal and replacement context. [Physical Security Asset Management Software, Historical asset archives](https://getsiteowl.com/physical-security-asset-management-software/)
- **Connections need identifiable endpoints.** CCTV Design Tool documents individual connection records with start device, end device, type and length, plus grouped totals. This supports a readable connection schedule. Its page also exposes connection deletion, but does not document retirement archives, replacement identity, restoration, port release or cable-history behaviour. [Connection Manager, Individual view and Connection operations](https://docs.cctvdesigntool.com/ui-guide/connection-manager.html)

These are public product descriptions, not a verification of the vendors' underlying lifecycle implementation. The checked sources do not establish automatic port reassignment, retained-cable status, ID reuse, restoration behaviour or test-result inheritance.

## Suggested Site Studio boundary

The following are product-specific recommendations for the POC, not claims about SiteOwl or CCTV Design Tool.

1. **Preserve the physical asset and its history.** Archive the removed device with its original ID, prior details, evidence and dated change reason. Link a replacement's new ID to that record. Restore the same ID only when the same physical device returns; do not turn a replacement into a renamed historical asset.
2. **Separate cable identity from endpoint assignment.** A retained physical cable can keep its run ID while its current endpoint assignment changes. Preserve the former assignment and change history rather than overwriting the only record of the old connection. A newly installed replacement cable gets a new linked run ID; removal of a device alone does not prove its cable was removed.
3. **Reconcile affected connections explicitly.** When actual removal is recorded, end the old active device association and show the affected connection's disposition: retained/disconnected, reassigned, removed/archived, or unresolved. Retain the historical link to the archived device. Allow an unresolved outcome with a visible follow-up need rather than forcing an invented disposition.
4. **Make port availability explicit.** Historical occupancy must remain visible without counting as a current assignment. A port is not automatically declared spare because its former device was archived. Record whether it is released, reserved, assigned elsewhere or unavailable pending verification. Show unresolved capacity separately; prevent conflicting current assignments.
5. **Treat replacement and restoration as new current connection decisions.** Show prior cable/port choices as historical context. Confirm retained-cable reuse and current endpoint/port assignment before representing a working connection, including after restoring the same device. Do not silently reconnect old relationships or transfer a passing test result. Keep previous results accessible as dated evidence; new or changed relationships require their own current assessment.
6. **Keep intent separate from recorded work.** Planned retirement, replacement or reconnection changes the proposed view and forecast only. It does not archive the actual asset, free its current port or assert field work is complete. Actual actions update the current records and append history; a cancelled plan does not rewrite past installed state.

The minimum output is a current asset/connection schedule with clear unresolved states and an accessible history of changes, linked IDs and evidence. Historical runs must not inflate current cable quantities or occupied-port counts. No live connection detection, automatic discovery/configuration, full patch-panel graph, immutable audit certification, mandatory approval workflow or retention-policy obligation is implied.
