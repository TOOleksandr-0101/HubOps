# Architecture

HubOps is a frontend-only React application built with strict TypeScript, Vite, Tailwind CSS, React Router `HashRouter`, Recharts, Lucide, Radix Slot, and a local shadcn-style Button.

## Runtime structure

- `types/`: the version 2 domain schema and relationship identifiers.
- `data/`: a deterministic, fully fictional seed covering facilities, people, assets, incidents, maintenance, HSE, and simulated device state.
- `services/storage.ts`: versioned persistence, v1→v2 migration, deep import validation, and JSON serialization.
- `services/telemetrySimulator.ts`: pure category-capability rules, bounded telemetry generation, scenario application, fault reconciliation, incident deduplication, and recovery.
- `store/Workspace.tsx`: the immutable update boundary, persistence, activity logging, warning state, and single simulation interval owner.
- `utils/domain.ts`: relationship-safe deletion and incident/maintenance workflows.
- `utils/analytics.ts`: pure operational KPI calculations.
- `utils/validation.ts`: form, schema, and referential-integrity validation.
- `components/`: shared page heading, semantic badges, accessible modal, fields, and Button.
- `layouts/`: responsive shell, navigation, global search, and actionable notifications.
- `pages/`: overview, facilities, team/tasks, assets, monitoring, incidents, maintenance, HSE, analytics, and settings.

Routes are lazy-loaded. `main.tsx` mounts the router and provider; `App.tsx` owns the route tree. Vite uses `/HubOps/` as its production base path.

## Data and update flow

Pages read the shared aggregate through `useWorkspace()`. Mutations use:

```ts
update(current => ({...current, collection: next}), 'Activity message')
```

`Workspace.update` reads from a ref-backed latest snapshot so interval telemetry cannot overwrite a newer user action. The returned aggregate is validated and saved before it becomes visible. Meaningful actions enter the bounded Activity Log; routine telemetry ticks use `{log: false}`.

## Relationships

`Building → Floor → Room → Asset → Incident / Maintenance / DeviceState / Telemetry`

Employees own facilities and are assigned to assets, incidents, tasks, maintenance, inspections, hazards, and corrective actions. HSE uses `Room → Inspection / Hazard → CorrectiveAction`.

Location deletion is blocked while assets exist. Asset deletion is blocked while incident or maintenance history exists. Schema validation rejects missing foreign keys, duplicate IDs, duplicate device states, invalid enums, malformed dates, and unsupported records.

## Persistence and migration

The current key is `hubops:workspace:v2`, stored as `{version: 2, exportedAt, data}`. On first load without v2 data, the service reads `hubops:workspace:v1`, normalizes every legacy entity, maps the four foundation asset categories to the required taxonomy, validates all relationships, and saves a v2 copy. The v1 bytes are retained as a recovery fallback.

Imports use the same migration and validation path. Invalid JSON or structurally invalid data never replaces the active workspace.

## Simulated monitoring

One provider-owned interval samples every asset at the configured frequency. Applicable metrics are determined by category. Telemetry is capped at 40 points per asset and 600 globally; Activity Log and notifications are capped separately.

Fault reconciliation updates asset and device health, appends fault history, creates at most one active monitoring incident for an `(assetId, faultCode)` pair, and emits one notification/activity event. Recovery clears simulated faults and restores technical health but intentionally does not close the incident workflow.

## Security boundary

LocalStorage is not authentication, authorization, secure storage, or a server audit log. A production version must move validation and access control to a backend and use approved device-ingestion and database services.
