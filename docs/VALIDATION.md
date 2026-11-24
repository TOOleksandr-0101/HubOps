# Validation

## Verified environment

Checks below were run locally on 2026-11-24 with Node.js 22-compatible tooling and the committed npm lockfile.

| Check | Result |
|---|---|
| `npm ci` | Passed; 326 packages installed from `package-lock.json` |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with zero warnings |
| `npm test` | Passed; 3 files, 15/15 tests |
| `npm run test:coverage` | Passed |
| `npm run build` | Passed |
| Workflow YAML / package JSON / lockfile parsing | Passed |
| `git diff --check` | Passed during QA pass |

Coverage after the final engineering test pass: 42.13% statements, 41.38% branches, 39.45% functions, and 59.48% lines overall. Storage and telemetry services exceed 85% statement coverage; analytics is fully covered for statements, functions, and lines. Coverage is not presented as exhaustive UI coverage.

The final production build uses route-level code splitting. The main application chunk is approximately 344.10 kB (109.58 kB gzip), and Vite emits no large-chunk warning.

## Automated scope

- seed quantities and base location relationships;
- dashboard metric transitions and safe location deletion;
- v2 deep validation and JSON round trip;
- foundation v1→v2 migration;
- malformed import rejection and versioned persistence;
- simulated fault detection and automatic incident creation;
- duplicate active incident prevention;
- recovery without automatic incident closure;
- bounded global/per-asset telemetry;
- incident closure without false device recovery;
- maintenance completion, asset date updates, and recurrence;
- current availability versus historical uptime semantics;
- serial-number validation and linked-history deletion guard.
- browser-like Asset create/read/update/delete and Incident create/read/update/assignment/closure flows in React Testing Library.

## Manual acceptance

The complete camera-offline-to-incident-closure flow is specified in `docs/DEMO_GUIDE.md` and `docs/TEST_CASES.md`. Playwright was not added because browser binaries are not installed in this project; no automated browser pass is claimed.

Before a public demonstration, manually verify desktop and narrow layouts, keyboard navigation, dark theme charts, all create/edit/delete confirmations, JSON import/export, and the full simulated monitoring scenario in a real browser.

## Deployment status

GitHub Actions is configured for validation and a `main`-only Pages deployment. No deployment job or public URL was verified from this branch, so the site must not yet be described as live.
