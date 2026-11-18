# Planned future feature — project schedule (Gantt chart)

Prepared 2026-11-18 from a party-mode discussion with Kevin (John, Mary, Sally, Winston, Amelia). This is a planned feature for after the POC. It is **not** a requirement of the [final PRD 1.1](../prd.md), which still lists project scheduling among its exclusions. Nothing here has been through PRD review.

## Purpose

Give the project manager for a property a schedule of the work on that property: what is planned when, what depends on what, how far along each part is, and what is running late against the plan.

The project manager may be the installer or someone else. The chart covers one property at a time.

## Decisions Kevin made

| Subject | Decision |
| --- | --- |
| Primary user | The project manager for the project |
| Scope of one chart | One property at a time |
| Dates | The manager enters planned dates |
| Dependencies | Supported: one row can be required before another |
| Rows built by the app | Yes, from the work in scope |
| Rows typed by the manager | Yes, but only for work that is not a function of the app, so a typed row can never duplicate an app-built row |
| When work runs late | Flag it. The app never moves dates by itself. |
| Original plan | Kept, so the chart shows planned against actual |
| Default grouping of app-built rows | By subsystem, each expandable into its installation, configuration and testing phases; the manager can switch to grouping by floor |
| Freezing the plan | A separate “set baseline” action, not tied to issuing the design. Re-baselining is allowed, and every earlier baseline is kept and dated. |
| Installers | See the schedule read-only. In the narrow field layout it is a short list of what is due, late and next, not a chart. |
| Clients | Included in the Design package only if the manager opts in; off by default; labelled as planned dates, not a commitment |
| Belongs to | A work scope. Each scope has its own schedule, which is optional and freezes with that scope’s closeout record. A scope with no dates entered has no chart. |
| Late (red) | A row is past its planned end and not finished |
| At risk (amber) | A row should have started and has not, or something it depends on is not finished by the row’s planned start |
| No estimate of “percent behind” | Work does not proceed evenly across a bar, so the app does not guess how far along a row should be |
| Slipped against the plan | A separate signal from red and amber: how far the current dates have moved from the baseline. Red and amber work from current dates at all times, with or without a baseline. |
| Before a baseline is set | The chart works normally and is labelled as having no baseline |
| Typed tasks: done | A tick with name and time, and an optional note. It can be un-ticked, with the change kept in history. No photos. |
| Dependencies | One kind only: a row cannot start until another is finished. Allowed between any two rows, including typed tasks. A loop is refused when saving, with the rows named. |
| Editing dependencies | By dragging on the chart and from a plain list on the row, so the action never depends on dragging alone |
| Rows with no dates | Shown with an empty “not scheduled” track, and counted |
| Closeout package | Optional and off by default. When included, it shows final dates beside the latest baseline. |
| Finished | A phase row is finished when its required checks have passed, as PRD 1.1 defines phase completion (FR-31). A subsystem row is finished when all its phases are. |
| Progress on the bar | The fill shows recorded work, so “work recorded, checks outstanding” is visible and is not shown as finished |
| Where dates are set | On a subsystem row for a rough plan. Once any of its phases has its own dates, the subsystem row’s dates become the span of its phases. |
| Work removed from scope | A row whose work has all left scope stays visible, marked “no work in scope”, with the rows that depend on it flagged, until the manager removes it. Baselines already taken keep their copy. |
| Who sets a baseline | Anyone with edit access, recorded with display name and time as unverified attribution, the same as approvals in PRD 1.1 |
| Typed task that repeats app work | A hint beside the entry box says typed tasks are for work outside the app. No automatic detection. |

## What it can reuse from PRD 1.1

- Progress per phase from recorded work and checks (FR-30, FR-31), so app-built rows show progress without anyone setting it by hand.
- Work-scope membership and planned actions (FR-40, FR-45), which decide what work has a row.
- Subsystem grouping, already used for estimate subtotals (FR-18).
- The pattern of fixed, dated records that are never rewritten, used for issued designs and closeouts (FR-26, FR-32, FR-34), for baselines.
- Optional package content that is off by default, as prices are today (FR-33).

## What is new

- Planned start and end dates on rows.
- Dependencies between rows.
- Manager-typed tasks with a done mark.
- Baselines, and the comparison of the current schedule with a baseline.
- Late flags.

The discussion rated this a substantial feature: it reuses progress and grouping, and everything about time is new.

## Not included

- Automatic rescheduling when a row slips.
- A view across several properties.
- Individual accounts or a manager with rights over all projects. PRD 1.1 has link-based access with no accounts (FR-2, NFR-5); a cross-project manager is a separate access question.

## Open questions

None recorded. Every question raised in the discussion on 2026-11-18 was settled with Kevin and is in the table above. The feature still needs requirements and Checks written, and review, before it can be built.

## Before this can be built

- Project scheduling comes off the exclusions list in a later PRD revision, with requirements and Checks written for the items above.
- Architecture places dates, dependencies and baselines in the shared-edit and conflict rules (FR-21, FR-42).
