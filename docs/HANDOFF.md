# Foundation handoff

## Implemented

Overview, Facilities, Team & Tasks, Settings; shell, themes, responsive navigation, local data, workspace export. Overview derives all six metrics from common data; facility equipment health uses room/floor relations. Room condition and equipment condition are separate fields. Kanban uses accessible status selects rather than drag-only controls. Employee cards open profiles; demo employees are read-only.

## Add a module

1. Use the existing entity interfaces in `src/types/index.ts`.
2. Read `data` via `useWorkspace()`.
3. Call `update(d => ({...d, collection: next}), 'Activity message')`; never mutate the previous object.
4. Add the page and explicit route in `main.tsx`, replacing the planned route.
5. Reuse Button, Field, Modal, Badge, PageTitle and shared CSS tokens.
6. Verify related IDs and extend deletion rules when introducing dependencies.

## Models

Asset (room/category/status), Incident (asset/severity/status/date), Building (address/manager), Floor (building), Room (floor/manager/status), Employee (name/role/demo email), Task (assignee/priority/deadline/status), MaintenanceRecord (asset/schedule/status), SafetyInspection (room/inspector/date/result), Telemetry (asset/metric/value/unit/time), ActivityLog (message/time). Full definitions are authoritative in `types/`.

## Second contributor ownership

Asset management, incident workflows, live hardware telemetry, maintenance workflows and HSE inspections remain unimplemented. Analytics is also a placeholder. Do not interpret demo incident or telemetry types as integrated infrastructure.

## Known limits and next steps

No backend, real login, RBAC, multiuser sync, employee CRUD, attachment storage, live telemetry or import. LocalStorage is device-specific and must not hold secrets. Storage payloads receive envelope checks, not full deep validation. Add schema migrations before changing persisted models. Consider server state tooling when an API is available. Add automated browser coverage and manual screen-reader testing before production. Theme, dialogs and navigation have keyboard controls; dialog focus restoration and background inert behavior need further accessibility hardening.

## Integration

Use `npm install`, `npm test`, `npm run build`. Commit package-lock.json after the first successful npm install. For GitHub Pages serve dist with base /HubOps/; enable Pages separately. Foundation PR does not publish a public deployment. Do not implement operational modules inside UI placeholders or rewrite shared types without coordinating.
