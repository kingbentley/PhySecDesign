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

- What exactly counts as late: past its planned end and unfinished, behind where it should be today, or both.
- How a manager-typed task is marked done, and whether it can carry a note or photo.
- How dependencies are drawn and edited, and what the app does when one would create a loop.
- Whether an app-built row with no dates yet is shown, and how.
- What the schedule looks like before any baseline is set.
- Whether a schedule belongs to a work scope, so that a later scope at the same property starts a new one.
- Whether the Closeout package shows the final schedule against its baseline.
- Whether the app warns when a typed task appears to describe work the app already tracks. Free text makes this unreliable; the discussion favoured a hint beside the entry box instead.

## Before this can be built

- Project scheduling comes off the exclusions list in a later PRD revision, with requirements and Checks written for the items above.
- The open questions are settled.
- Architecture places dates, dependencies and baselines in the shared-edit and conflict rules (FR-21, FR-42).
