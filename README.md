# HubOps

Infrastructure operations workspace for a fictional technology park in Astana.

## Run locally

Node.js 22.12+ (or a supported newer LTS), npm.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Open the URL printed by Vite. Production assets are built into `dist/`; Vite uses `/HubOps/` as the base path. HashRouter supports direct navigation on GitHub Pages. Change `base` in `vite.config.ts` when hosting elsewhere.

## Implemented scope

- Overview with calculated metrics, Recharts charts, facility health, activity.
- Buildings, floors and rooms: create, edit, delete, manager assignment, search and manager filter.
- Employee profiles, task creation/editing/deletion, priority, deadline, assignee filter and Kanban status controls.
- Light/dark appearance, collapsible desktop navigation, mobile drawer, workspace search, activity notifications.
- Versioned LocalStorage persistence, JSON export, explicit demo reset.
- 4 buildings, 12 floors, 30 rooms, 60 assets, 10 employees, 25 tasks, 20 incidents.

## Operations modules

- Assets: create, edit, move between rooms, categorize, filter and delete equipment. Linked incident/maintenance/telemetry records block unsafe deletion.
- Incidents: record equipment issues, severity, open/resolved status and one-click resolution.
- Maintenance: schedule service, filter pending/completed records and complete work.
- HSE & Safety: room inspections with inspectors, dates and passed/failed results.
- Monitoring: explicitly simulated temperature samples, history chart and recent samples. No hardware connection.
- Analytics: equipment health, task completion, incident resolution, inspection pass rate, incident/workload charts, overdue tasks and CSV asset export.

All operational changes share the same store and activity history. The app remains a local frontend prototype; simulated telemetry is not live monitoring.

This frontend has no server, authentication, authorization or collaboration sync. Each browser has an independent workspace. Do not enter sensitive data. All seed identities and addresses are fictional.

See [architecture](docs/ARCHITECTURE.md), [handoff](docs/HANDOFF.md), and [validation](docs/VALIDATION.md).

MIT licensed. Prepared with AI assistance; contributors should review and understand changes before presenting them.
