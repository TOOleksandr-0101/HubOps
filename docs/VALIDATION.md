# Validation

## Local environment

Dependency installation was attempted on 2026-11-24 but the execution environment could not resolve registry.npmjs.org. Offline installation also failed because Radix Slot was not cached. Therefore local build, dev-server startup and browser interaction checks have **not passed or run**. No lockfile could be generated.

## Automated checks

The foundation workflow installs dependencies, runs domain tests and builds strict TypeScript + Vite. A successful workflow is required before merge. Tests cover seed counts and relationships, derived metrics and safe building deletion. Dependency ranges are initially latest; review and commit the generated package-lock.json after a successful installation to pin the dependency graph.

## Manual acceptance checklist (pending)

- Create/edit/delete an empty building, floor and room. Verify occupied-location deletion is blocked.
- Create/edit/delete tasks, change each Kanban status, filter by assignee.
- Reload and confirm persistence and updated overview counts.
- Switch themes, collapse desktop sidebar, open mobile navigation.
- Search records, open employee profiles, read notifications.
- Export JSON, reset demo data with confirmation.
- Keyboard-only navigation and narrow-screen review.

Frontend demonstration only; not approved for production infrastructure data.
