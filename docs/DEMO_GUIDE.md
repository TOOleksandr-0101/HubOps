# HubOps Demonstration Guide

## Scope

This guide demonstrates browser-based engineering workflows with fictional data and **simulated** telemetry. No real equipment is connected. HubOps is not a certified safety platform or a substitute for professional HSE inspection.

## Prepare the application

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Open the URL printed by Vite. For a clean repeatable run, export any wanted backup, then use **Settings → Reset demo data** and confirm. Keep the browser console closed during the presentation unless diagnostics are requested.

## Primary 14-step scenario

Complete all steps without reloading the page.

1. Open **Assets**, select a CCTV camera and note its current operational state and location.
2. Follow the asset link to **Simulated Hardware Monitoring**, or open Monitoring and filter to the same camera.
3. In the Simulation Control Panel, choose **Camera Offline** and apply it to that camera.
4. Confirm the device shows **Offline**, a new heartbeat/connection event is visible and its technical health is no longer operational.
5. Open **Incidents** and confirm one Hardware Monitoring incident was created for this camera with the expected priority/location.
6. Open the notification center and confirm the fault notification is present.
7. Open **Overview** and confirm active/critical incident and equipment-health values are derived from the updated workspace.
8. Return to the incident, assign a fictional employee and save.
9. Move the incident to **In Progress**; verify table/Kanban views agree and history records the transition.
10. Return to Monitoring and run **Device Recovery** for the same camera.
11. Confirm current telemetry and asset health return to normal only after the simulated fault clears.
12. Return to the incident and move it through **Resolved** to **Closed**. Recovery came from telemetry, not from closing the ticket.
13. Open **Analytics** and confirm incident, resolution and equipment metrics reflect the common workspace data. If there is insufficient history for an uptime/MTTR metric, point out `N/A` rather than claiming a fabricated value.
14. Open the **Activity Log** or notification/history view and show the ordered fault, assignment, status, recovery and closure events.

## Additional module tour

- **Assets:** switch card/table modes, search/filter, open a QR code, inspect linked incidents/maintenance and export CSV.
- **Maintenance:** create an inspection from a checklist template, assign an employee, complete it and show the asset inspection dates update.
- **HSE & Safety:** add or inspect a fictional hazard, explain probability × severity scoring and show overdue corrective action filtering.
- **Analytics:** change the reporting period, export CSV and open print preview.
- **Settings:** export a JSON backup, demonstrate validation with a deliberately invalid file only if a disposable workspace is in use, then restore a valid backup.

## Expected safeguards to call out

- Repeating **Camera Offline** while its active fault exists must not create a second active incident.
- Closing an incident while a fault is still active must not mark the camera healthy.
- Attempting to delete a location or employee still referenced by an asset must be blocked or require safe reassignment.
- Telemetry/activity retention is bounded to protect LocalStorage.
- All data is fictional and browser-local; authentication, server persistence and real-device integration are future work.

## Recovery if the demo state is unexpected

1. Stop the simulator.
2. Check the selected asset and active filters.
3. Export the workspace if it is useful for diagnosis.
4. Reset demo data in Settings and repeat the scenario from step 1.
5. Do not edit LocalStorage manually during a public demonstration.

## GitHub Pages publication

The workflow deploys only a successful `main` build. A repository administrator must perform the one-time setup:

1. Open **Repository Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Merge the validated engineering branch into `main` or manually dispatch the workflow from `main`.
4. Wait for both **Typecheck, lint, test and build** and **Deploy GitHub Pages** to succeed.
5. Verify `https://tooleksandr-0101.github.io/HubOps/`, a hash route, and static assets before advertising the demo.

Do not report the deployment as live until the Pages job and URL have been checked.

