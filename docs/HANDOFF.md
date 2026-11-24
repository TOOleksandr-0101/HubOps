# Engineering handoff

## Implemented

- Foundation modules retained: Overview, Facilities, Team & Tasks, Settings, responsive shell, themes, and local data.
- Asset Management with inventory CRUD, filters, sorting, card/table views, QR links, CSV, locations, ownership, and linked history.
- Simulated Hardware Monitoring with category-aware telemetry, eight scenarios, bounded history, automatic fault detection, deduplicated incidents, notifications, and recovery.
- Incident Management with manual/monitoring sources, assignment, comments, history, priorities, four statuses, overdue handling, Kanban/table views, close/reopen.
- Maintenance with calendar, recurring schedules, templates, checklists, completion, history, and asset date updates.
- HSE demonstration with hazards, risk scores, inspections, corrective actions, deadlines, filters, and a 5×5 matrix.
- Analytics derived from shared data, including explicit current availability versus historical uptime, CSV, and print output.
- Version 2 storage migration, deep backup validation/import/export, relationship guards, global search, notification center, and accessible modal focus management.
- Vitest/RTL tooling, ESLint, lockfile, CI validation, and main-only GitHub Pages deployment workflow.

## Add or change a workflow

1. Extend authoritative interfaces in `src/types/index.ts`.
2. Add backward-compatible normalization in `src/services/storage.ts`.
3. Extend deep and relationship validation in `src/utils/validation.ts`.
4. Keep business logic pure in `src/utils` or `src/services` and add deterministic tests.
5. Read data through `useWorkspace()` and return a fresh aggregate from `update()`.
6. Reuse Button, Field, Modal, Badge, PageTitle, and CSS tokens.
7. Verify `npm run typecheck && npm run lint && npm test && npm run build`.

## Key constraints

- Do not log routine telemetry samples to the Activity Log.
- Do not infer device recovery from an incident status change.
- Do not auto-close an incident when telemetry recovers.
- Preserve incident and maintenance audit history when deleting assets.
- Keep telemetry, notifications, and activity bounded.
- Never treat LocalStorage as a security boundary or connect real equipment without a backend ingestion layer.

## Deployment

The Pages workflow is configured but deployment is not confirmed. The repository owner must select **Settings → Pages → Source: GitHub Actions**, merge to `main`, wait for the deployment job, and verify the published URL.

## Known limits

No backend, authentication, authorization, RBAC, server audit trail, attachment storage, multi-user sync, real telemetry, or Playwright browser installation exists. HSE is demonstrative and not certified. Static screenshots have not been committed.
