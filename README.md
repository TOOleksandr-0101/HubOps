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

## Foundation scope

- Overview with calculated metrics, Recharts charts, facility health, activity.
- Buildings, floors and rooms: create, edit, delete, manager assignment, search and manager filter.
- Employee profiles, task creation/editing/deletion, priority, deadline, assignee filter and Kanban status controls.
- Light/dark appearance, collapsible desktop navigation, mobile drawer, workspace search, activity notifications.
- Versioned LocalStorage persistence, JSON export, explicit demo reset.
- 4 buildings, 12 floors, 30 rooms, 60 assets, 10 employees, 25 tasks, 20 incidents.

Asset Management, Incident Management, Hardware Monitoring, Maintenance, HSE and Analytics are explicitly planned modules. Equipment and incident records are demo inputs, not operational implementations.

This frontend has no server, authentication, authorization or collaboration sync. Each browser has an independent workspace. Do not enter sensitive data. All seed identities and addresses are fictional.

See [architecture](docs/ARCHITECTURE.md), [handoff](docs/HANDOFF.md), and [validation](docs/VALIDATION.md).

MIT licensed. Prepared with AI assistance; contributors should review and understand changes before presenting them.
