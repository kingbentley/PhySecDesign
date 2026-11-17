# Product-decision reconciliation — first full PRD draft

Reviewed 2026-11-16 against [PRD draft 0.1](prd.md) and [addendum](addendum.md). This is a documentation reconciliation, not final product signoff, application verification, or authorization to implement/deploy.

## Inputs and precedence

- [.memlog.md](.memlog.md): canonical chronological decision record. Later explicit decisions supersede earlier assumptions and pending questions.
- [Preserved discovery notes](sources/discovery-notes.md): detailed rationale and previously proposed behavior; their historical labels are intentionally retained.
- [Conversation context](sources/conversation-context.md): original feature intent and confirmed guided decisions.
- [Decision extraction](sources/draft-decision-extract.md): grouped consolidation checklist.
- Latest confirmation explicitly adopts one continuing property project and the preceding later-work recommendation, and authorizes a first full draft. The current PRD correctly retains status draft and does not claim final approval.

Operational setup/tooling events were excluded from the requirement comparison. This review did not rerun application tests or independently validate implementation evidence reported by the addendum.

## Overall result

**All grouped guided-discovery product decisions are represented.** The latest property lifecycle confirmation is fully adopted rather than left as an open choice. No material contradiction was found in optional approvals, truthful test/closeout status, shared demo work, revision-specific approval, field changes, device archives, or reopened work.

One minor original-capability requirement is not explicit (autosave). One package-label ambiguity is worth tightening so a confirmed evidence outcome cannot be mistaken for an optional proposal. Neither requires restarting discovery or reopening settled decisions.

## Grouped decision coverage

| Product decision group | Representation in current draft/addendum | Result |
| --- | --- | --- |
| Physical-security professional audience; POC continues through building lifecycle | Opening, Users and POC scope, UJ-1–UJ-4; addendum distinguishes existing design capabilities from new lifecycle work | Represented; no production or compliance claim |
| End-to-end design outcome: property, plan, equipment, coverage, cables, estimate, package | FR-1–FR-20, FR-33–FR-34; UJ-1 | Represented |
| Maps/imagery, two-point alignment, PDF-page input | FR-3–FR-6; addendum Maps, plans, and equipment | Represented with baseline limits distinguished from product outcomes |
| Equipment IDs/models/mounting; broader requested catalog and network closets/ports | FR-7–FR-9; OQ-7; addendum catalog/routes boundary | Represented; broader requested capability is explicitly pending POC prioritization rather than falsely claimed implemented |
| Camera/combined coverage, DORI, walls, blind spots, zones, cleaner rendering | FR-10–FR-16; addendum Analysis conventions | Represented; estimates are not field passes, 90% is an example, sampled conventions are disclosed |
| Survey notes/photos, costs/accessories/optional labor, capacity | FR-17–FR-20; addendum cost/capacity/evidence boundaries | Represented |
| Autosave, undo/recovery, named revision comparison, existing versus proposed | FR-7, FR-21–FR-22; addendum records current local autosave | Partial only for explicit autosave requirement; see RD-1 |
| Optional installer handoff and solo participant | Users and POC scope, UJ-2, FR-2, FR-23, SM-1 | Represented; same participant can design, perform field work, and close out |
| Shared online project, phones/tablets/laptops, online-only POC | Scope table, FR-2, NFR-2/NFR-3, SM-1/SM-4; OQ-1/OQ-2/OQ-9 | Represented; shared persistence is required and offline sync excluded |
| Shared demo access without individual accounts/invitations or verified identity | Scope table, FR-2/FR-23/FR-24, NFR-5, OQ-1; addendum shared-access boundary | Represented; simplified access does not downgrade shared project requirement |
| Client/site owner approvals; project-specific assignees, same/different people, self-approval | Users and POC scope, FR-23–FR-25 | Represented |
| Every approval optional/bypassable; bypass distinct, no mandatory reason, no changed tests/access | Lifecycle rules, FR-25, FR-32 acceptance check, SM-3 | Represented; no mandatory external signoff introduced |
| Core planning/installation/configuration/testing phases; independent device progress | Lifecycle rules, FR-29–FR-31; OQ-3 keeps exact criteria open | Represented; optional approval/acceptance remains separate |
| Editable device-type/generic checklists, expected/actual outcomes, actor/time, optional project-required photos | FR-29–FR-31; OQ-3 | Represented |
| Pass/Fail/Not tested/Not applicable, explanations, preserved attempts/wording, remaining work | FR-29–FR-31; test-attempt/outstanding-item definitions, SM-2/SM-3 | Represented; Not applicable is not counted as Pass |
| Direct authorized field changes against fixed issued design, even without handoff/approval | FR-26–FR-28; issued/working definitions, UJ-2 | Represented; role/access mechanism remains intentionally open in OQ-1 |
| Before/after, IDs, actor/time/reason, optional photos; changed calculations/retest attention | FR-27–FR-28; OQ-4 | Represented; routine evidence entry does not require a design-change reason |
| Field reviews nonblocking; correction requests visible; no erased actual conditions or inherited approvals | FR-24–FR-28; SM-2 | Represented |
| In progress/Completed/Closed with outstanding items; explicit closure note, visible issues, optional owner/date | Lifecycle table, FR-32, FR-33, SM-3 | Represented; unfinished work cannot silently become Completed |
| Approval/closure never turns failed/unperformed tests into passes; retain retests and reopen | Lifecycle rules, FR-25/FR-31/FR-32/FR-38 | Represented |
| Closeout package reflects actual installation, recorded work/testing, changes, approvals/bypass, remaining work | FR-32–FR-34, NFR-6; A-1/OQ-6 | Represented; proposal labeling can be clarified under RD-2 |
| Reversible removed-device archive with recorded identity/settings/location/connections/evidence; removal metadata | FR-35; FR-20/FR-34; addendum current deletion versus new archive behavior | Represented; no absent metadata is newly required solely to archive |
| Archive excluded from current plan/schedule/coverage/counts/estimates/capacity but searchable/historical/backed up | FR-34–FR-35; NFR-1 | Represented; prior revision/report values remain preserved |
| Same-ID restoration; new linked physical replacement; no overwrite or inherited historic pass | FR-36; OQ-8 | Represented |
| One continuing project per property; fixed closeouts; read-only project archive until explicit reopening | Opening/scope, UJ-4, FR-32/FR-37/FR-38 | Represented; latest confirmation adopted |
| Reopen latest installation into named revision/new scope/In progress with stable IDs | FR-38, UJ-4, NFR-1 | Represented |
| Fresh scoped estimates/checks, no charges merely for retained equipment, historical estimates retained | FR-17/FR-32/FR-38; addendum later-work costing; OQ-5 | Represented |
| Reopening retains unresolved work/history and does not restore removed devices, inherit passes/approvals, or alter prior closeouts | FR-38 acceptance check, FR-23/FR-32/FR-37, NFR-1, SM-2/SM-3 | Represented |
| No supplied PSP source set; limited external references cannot mandate approval gates or establish compliance | PRD source caveat; addendum Source and verification boundaries | Represented |

## Actionable drafting findings

### RD-1 — State autosave explicitly in FR-21

**Type:** Minor requirement omission from original stated capability, not a missing guided lifecycle decision.

The conversation context explicitly lists autosave under Recovery and alternatives. FR-21 currently requires save status, failed-save feedback, undo/redo, and backup recovery, but a manual-save-only implementation could satisfy its wording. The addendum mentions existing local autosave only as an implementation fact.

**Action:** Add explicit automatic saving of supported working edits to FR-21 and its observable check, with shared-save status/failure behavior under NFR-2/OQ-2. Keep the autosave mechanism and concurrency design open; this does not require offline synchronization.

### RD-2 — Limit the package proposal label to the unsettled details

**Type:** Minor ambiguity; the required outcome already appears in FR-32–FR-34.

The confirmed discovery model requires completed field records and outstanding items in the closeout package. A-1 is titled Proposed package detail and says the complete package should summarize configuration/checklist evidence before saying exact content is not confirmed. OQ-6 also broadly lists configuration/test detail. Read in isolation, those passages could make inclusion of confirmed field evidence seem optional even though FR-33 correctly requires communicating installation and configuration/testing.

**Action:** Clarify that configuration/test evidence and outstanding-work communication are settled, while selection of summary versus full attached records, exact manifest, layout, pagination, and historical retention/reproduction remain OQ-6. Do not invent a detailed package schema or reopen whether evidence must be included.

## Genuine open questions correctly preserved

OQ-1/OQ-2 retain shared demo access, roles, hosting, saved-update visibility, persistence, concurrency, and shared undo/recovery. OQ-3 retains starter checks, applicability, pass criteria, phase completion, and system checks. OQ-4 retains retest triggers. OQ-5 retains scope selection, costing changed/retained assets, and carryover disposition. OQ-6 retains package/report details. OQ-7 keeps previously requested catalog/network/riser extensions visible. OQ-8 retains archive/cable/floor/draft-deletion edges. OQ-9 retains device/browser, accessibility, scale, performance, storage, and recovery acceptance targets.

The extraction's no-handoff interaction-detail question is adequately covered at first-draft level by FR-2/FR-23/SM-1 plus role and phase questions. It does not need an additional blocker or a repeat question about whether handoff is optional.

## Superseded proposals and pending questions

| Historical proposal/pending question | Superseding decision now represented |
| --- | --- |
| Approval parties/gates undecided | Client/site owner expected; project-specific assignments; every approval bypassable; self-approval allowed |
| Closeout of unfinished work/failed tests undecided | Three explicit states; brief outstanding-item closure note and list; retained tests/retests; reopening |
| Device retention/restoration undecided | Reversible archive, full captured history, current-calculation exclusions, same-ID restoration, linked physical replacements |
| Freeform versus checklist field documentation undecided | Editable type checklists plus evidence, four test outcomes, explanations, retained wording/attempts |
| Field platforms/offline needs undecided | Phones/tablets/laptops and online-only POC |
| File-based versus shared collaboration undecided | One persisted shared online project; files supplemental |
| Proposed-change-only versus direct installer editing undecided | Direct authorized field updates with immutable issued reference and optional nonblocking review |
| Individual accounts/invitations potentially required | Shared demo access sufficient; participant attribution unverified |
| New linked project versus reopened property project undecided | One continuing project, fixed closeouts, read-only archive, new named revisions, fresh scoped estimates/evidence and visible carryover |
| Full draft pending further guided discussion | First full draft authorized; final signoff not granted |

Older assumption/event entries in the chronological memory and proposal labels in preserved discovery notes are not contradictions when read with their later confirmations and historical headers. They should remain historical evidence, not be revived as open product choices.

## Finding disposition — targeted recheck, 2026-11-16

Rechecked only RD-1 and RD-2 against the updated PRD. Both are addressed; no remaining issue from these two findings.

- **RD-1 addressed:** FR-21 now explicitly says to automatically save working edits. Its acceptance check requires a supported edit to persist without a manual save command, retaining save-state and failure feedback. This closes the manual-save-only ambiguity.
- **RD-2 addressed:** A-1 is now Proposed package presentation and explicitly confirms inclusion of installation/configuration/test evidence and outstanding work. It reserves summary/detail level, section layout, photo pagination, and cost/capacity section inclusion for OQ-6. This preserves the confirmed evidence outcome while leaving presentation choices open.

This targeted disposition supersedes the two open drafting findings above. The report remains a first-draft reconciliation, not final approval or implementation verification. No main documents or application files were changed during this recheck.
