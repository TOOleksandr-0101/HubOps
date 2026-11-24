# HubOps Phase 2 Requirements

## 1. Purpose and status convention

This document is the Phase 2 acceptance contract. A requirement is considered complete only when its behavior exists in the application and its linked checks pass. It does not claim connection to real devices, production security, or HSE certification.

Priorities: **P0** demonstration-critical, **P1** required operational depth, **P2** release quality and documentation.

## 2. Functional requirements

### Asset Management

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-ASSET-01 | P0 | Store unique Asset ID, name, category, manufacturer, model, serial, room, responsible employee, status, install/inspection/service dates, fault history and notes. | ASSET-01, ASSET-02 |
| ENG-ASSET-02 | P0 | Support create, view, edit and confirmed delete. | ASSET-01 |
| ENG-ASSET-03 | P1 | Support search, sort, multi-filter, cards and table views. | ASSET-04 |
| ENG-ASSET-04 | P1 | Generate a QR code linking to the asset card and export current asset data as CSV. | ASSET-04 |
| ENG-ASSET-05 | P0 | Show related incidents and maintenance history. | ASSET-01 |
| ENG-ASSET-06 | P0 | Preserve asset/building/floor/room/employee referential integrity; block or safely resolve orphan-producing deletion. | ASSET-03 |

### Simulated Hardware Monitoring

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-MON-01 | P0 | Clearly label monitoring as simulated; no real-device claim is permitted. | MON-01 |
| ENG-MON-02 | P0 | Model online state, heartbeat, latency, temperature, battery, uptime, connection and health, showing only category-applicable metrics. | MON-01 |
| ENG-MON-03 | P0 | Start/stop simulation, choose a safe refresh frequency, chart bounded telemetry history and clean intervals/subscriptions. | MON-05 |
| ENG-MON-04 | P0 | Provide camera offline, terminal failure, network loss, overheating, lock failure, refrigerator temperature, low battery and recovery controls. | MON-02, MON-04 |
| ENG-MON-05 | P0 | A detected fault updates asset state and produces severity, incident, notification, activity and derived KPI changes atomically. | MON-02, E2E-01 |
| ENG-MON-06 | P0 | Do not create duplicate active incidents for the same asset and fault type. | MON-03 |
| ENG-MON-07 | P0 | Recovery uses telemetry and all active faults; incident closure alone must not mark hardware healthy. | MON-04 |

### Incident Management

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-INC-01 | P0 | Store ID, title, description, asset, location, Low/Medium/High/Critical priority, Open/In Progress/Resolved/Closed status, assignee, Manual/Hardware Monitoring source, created/due/resolved dates, comments and history. | INC-01 |
| ENG-INC-02 | P0 | Create incidents manually and from monitoring; edit, assign, reprioritize, comment, close and reopen them. | INC-01, MON-02 |
| ENG-INC-03 | P1 | Provide synchronized Kanban/table views, search/filters and clear overdue treatment. | INC-02 |

### Maintenance Management

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-MAINT-01 | P1 | Provide calendar/list scheduling, periodic work, assignee, checklist, history, overdue state and in-app reminder. | MAINT-01, MAINT-02 |
| ENG-MAINT-02 | P1 | Create/edit/complete records and update asset last/next inspection dates on valid completion. | MAINT-01 |
| ENG-MAINT-03 | P1 | Include CCTV, network, terminal, access control, refrigeration and workstation checklist templates. | MAINT-01 |

### HSE and Safety

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-HSE-01 | P1 | Maintain hazard/risk records, safety inspections, checklists, assignees, corrective actions, deadlines and history. | HSE-01, HSE-02 |
| ENG-HSE-02 | P1 | Support Low/Medium/High/Critical risk and the six specified inspection categories with building/risk filters. | HSE-01 |
| ENG-HSE-03 | P1 | Calculate and display a demonstrative probability × severity risk matrix. | HSE-01 |
| ENG-HSE-04 | P0 | State that HubOps is not a certified safety system or substitute for professional HSE inspection. | Manual copy review |

### Analytics and reports

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-ANA-01 | P1 | Derive all requested asset, availability, incident, MTTR, resolution, maintenance, HSE, task and workload KPIs from workspace data. | ANA-01 |
| ENG-ANA-02 | P1 | Show incident trends, fault categories, buildings, problem assets, maintenance and HSE distributions with period filtering. | ANA-01 |
| ENG-ANA-03 | P1 | Export report data to CSV and provide a print layout. | PRINT-01 |
| ENG-ANA-04 | P0 | Document formulas; historical uptime/availability must be history-based or displayed as `N/A`/explicit demonstration metric. | ANA-01 |

### Integration, UX and data quality

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-INT-01 | P0 | Overview, Facilities, Team & Tasks and Settings consume the shared aggregate without regressing foundation behavior. | Existing regression tests, E2E-01 |
| ENG-INT-02 | P0 | Complete the 14-step camera fault scenario without a reload. | E2E-01 |
| ENG-UX-01 | P1 | Global search covers facilities, people/tasks, assets, incidents, maintenance and safety records. | Manual search check |
| ENG-UX-02 | P0 | Notification center and Activity Log expose significant operational changes. | MON-02, E2E-01 |
| ENG-UX-03 | P0 | Forms validate, destructive actions confirm, and empty/error/success states are actionable. | ASSET-02, STORE-04 |
| ENG-UX-04 | P1 | Core flows are responsive, keyboard-operable and restore focus after dialogs. | A11Y-01, A11Y-02, RESP-01 |
| ENG-DATA-01 | P0 | Persist a versioned, migrated, deeply validated aggregate in LocalStorage with backward compatibility. | STORE-01, STORE-02 |
| ENG-DATA-02 | P0 | Export and import validated JSON backups without replacing data on invalid input. | STORE-03, STORE-04 |
| ENG-DATA-03 | P0 | Cap telemetry/activity history and report save/quota errors. | MON-05, STORE-05 |
| ENG-DATA-04 | P0 | All demonstration content is fictional and contains no Astana Hub official logo or confidential data. | Manual content review |

## 3. Quality and delivery requirements

| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| ENG-QA-01 | P2 | Run strict TypeScript, ESLint, Vitest coverage execution and a production Vite build from a committed lockfile. | CI validate job |
| ENG-QA-02 | P2 | Cover CRUD, detection, duplicate prevention, recovery, analytics, maintenance, validation, persistence, migration, relations and backup behavior. | `TEST_CASES.md`, test suite |
| ENG-DEPLOY-01 | P2 | Build for `/HubOps/` with hash routing and deploy Pages only after successful validation on `main`. | PAGES-01, CI deploy job |
| ENG-DOC-01 | P2 | Keep architecture, test, requirements, integration, demo and README documentation aligned with implemented behavior. | Documentation review |

## 4. Constraints and limitations

- The current application is a single-browser frontend demonstration.
- LocalStorage is not a security boundary and must not contain confidential or personal production data.
- Authentication, authorization, backend persistence and multi-user conflict resolution are not implemented unless separately documented.
- Hardware protocols in `HARDWARE_INTEGRATION.md` are a future architecture, not current connectivity.

