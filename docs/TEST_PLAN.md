# HubOps Engineering Test Plan

## 1. Purpose

This plan verifies the Phase 2 engineering modules without implying that HubOps is connected to real equipment or is a certified safety system. Tests use fictional deterministic data and browser-local persistence.

## 2. Scope

In scope:

- asset create, read, update, delete, search, filter, sort, CSV export and relation safety;
- simulated telemetry, category-specific metrics, bounded history, fault detection and recovery;
- manual and monitoring-generated incident workflows, comments, assignment and duplicate prevention;
- maintenance schedules, recurring work, checklist completion, reminders and asset date updates;
- HSE hazards, inspections, corrective actions, deadlines and risk matrix calculations;
- dashboard and analytics formulas, filters, CSV export and print layout;
- versioned LocalStorage migration, validated JSON backup import/export and save failures;
- keyboard navigation, dialog focus behavior, responsive layouts and core empty/error states;
- production build and GitHub Pages path behavior.

Out of scope:

- real MQTT, SNMP, REST, WebSocket or IoT gateway connections;
- backend authorization, multi-user synchronization and production security controls;
- certification of HSE processes or replacement of professional inspection;
- load, penetration and physical-device certification testing.

## 3. Test strategy

| Level | Purpose | Tooling |
| --- | --- | --- |
| Pure unit | Domain transitions, calculations, validation, migration and fault rules | Vitest |
| Component | Forms, dialogs, lists and store-integrated interactions | Vitest, jsdom, React Testing Library, user-event |
| Integration | Telemetry-to-incident-to-dashboard state changes and persistence | Vitest with fake timers and deterministic IDs/timestamps |
| Browser acceptance | Critical 14-step demonstration, responsive and keyboard checks | Manual browser checklist in this phase |
| Build/CI | Type safety, lint, coverage execution and production bundle | TypeScript, ESLint, Vite, GitHub Actions |

Playwright is not included in the locked automated toolchain because it requires a separate browser binary installation. The same end-to-end scenario is documented for manual execution. It can be automated later when a browser-enabled CI runner is approved.

## 4. Environments

- Local: Node.js 22.13 or newer, npm, a current Chromium/Firefox/Safari browser.
- CI: GitHub-hosted Ubuntu runner, Node.js 22, clean `npm ci` installation.
- Deployment: GitHub Pages under `/HubOps/` with `HashRouter`.
- Storage: browser LocalStorage only; clear or export it between isolated test runs.

## 5. Test data and determinism

- Use only the fictional seed returned by `createSeed()`.
- Inject or fake clocks, intervals and ID generation in business-logic tests.
- Do not depend on test execution order.
- Restore mocks, timers, DOM and LocalStorage after each test.
- Prefer a fresh data aggregate for each test; never mutate shared fixtures.

## 6. Commands

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run preview
```

`npm run preview` is interactive and is not executed by CI. Use it for browser acceptance at `/#/` and verify generated asset requests resolve below `/HubOps/`.

## 7. Entry criteria

- Dependencies install from the committed lockfile.
- The current Phase 2 schema and migration are present.
- Seed relations are valid.
- The build contains explicit routes for each implemented module.

## 8. Exit criteria

- TypeScript, ESLint, Vitest and production build all exit successfully.
- All P0 test cases pass.
- No duplicate active incident is produced for the same asset and fault type.
- Recovery does not hide another active fault and closing an incident alone does not falsify device health.
- Reload preserves accepted changes and invalid imports do not replace current data.
- The complete demonstration scenario works without a page reload.
- Known limitations and any skipped checks are recorded truthfully in validation and release notes.

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Timer-based tests become flaky | Use fake timers and explicit clock advancement. |
| Persisted v1 data lacks Phase 2 fields | Test migration from a representative v1 envelope and preserve legacy data. |
| LocalStorage quota is exceeded | Cap telemetry/activity history and surface save failures. |
| Derived metrics drift from source data | Keep formulas in pure functions and test edge cases, including `N/A`. |
| UI tests pass while relations are orphaned | Add aggregate referential-integrity assertions after CRUD/import/migration. |
| Pages works locally but assets 404 | Build with `/HubOps/` base and verify the deployed hash route. |

## 10. Defect severity

- **Blocker:** data loss, application cannot start, build/deploy failure.
- **Critical:** P0 workflow broken, duplicate monitoring incidents, false recovery/safety state.
- **Major:** incorrect analytics, relation corruption, inaccessible core action.
- **Minor:** visual issue or non-blocking copy/format inconsistency.

