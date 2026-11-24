# HubOps Engineering Test Cases

The cases below are the acceptance baseline. `P0` cases must pass before a public demonstration. All records and names used during testing must be fictional.

## Automated and integration cases

| ID | Priority | Scenario | Steps | Expected result |
| --- | --- | --- | --- | --- |
| ASSET-01 | P0 | Asset CRUD | Create an asset with every required field; open it; edit status/location/owner; delete it with confirmation. | Each accepted change is visible immediately, logged and persists after reload; deletion removes no unrelated record. |
| ASSET-02 | P0 | Asset validation | Submit missing required fields, duplicate Asset ID/serial where prohibited, invalid dates and nonexistent relation IDs. | The form identifies invalid fields; no partial record is stored. |
| ASSET-03 | P0 | Relation safety | Attempt to delete a room/building/employee referenced by an asset or reassign the asset first. | The orphan-producing deletion is blocked with guidance; after reassignment, the valid deletion succeeds. |
| ASSET-04 | P1 | Discovery and export | Search by name/ID/serial, combine category/status/location filters, sort, switch card/table mode and export CSV. | Visible/exported rows match the active criteria; special CSV characters are escaped. |
| MON-01 | P0 | Category metrics | Inspect camera, lock, terminal, refrigerator, workstation and network device telemetry. | Only applicable metrics are shown for each category; the module is labelled simulated. |
| MON-02 | P0 | Fault detection | Trigger each of the seven fault scenarios once. | Device telemetry/status changes; severity is mapped; one notification, activity entry and active incident are created; dashboard/analytics recalculate. |
| MON-03 | P0 | Duplicate prevention | Trigger the same unresolved fault repeatedly for one device. | Exactly one active incident exists for the asset/fault pair; event/telemetry history may continue. |
| MON-04 | P0 | Recovery semantics | Recover a device with one fault, then a device with another active fault. | Recovered metrics normalize; health becomes operational only when no active simulated fault remains; the related incident is not silently falsified by UI state. |
| MON-05 | P0 | Timer lifecycle and retention | Start simulation, change frequency, stop it, unmount/remount the view and generate more than the history cap. | One interval runs at the chosen rate, all intervals are cleaned up, and retained telemetry stays within the documented cap. |
| INC-01 | P0 | Manual incident CRUD | Create, edit, assign, reprioritize, comment, move through statuses, close and reopen. | History records each material transition; board and table show the same source record. |
| INC-02 | P0 | Incident deadlines | Create an unresolved incident with a past deadline and filter/search it. | It is visibly overdue and appears in the matching filtered result. |
| MAINT-01 | P0 | Complete maintenance | Schedule from a template, assign owner, complete every checklist item and finish the record. | Completion is stored; asset last/next inspection dates update consistently and an activity entry is created. |
| MAINT-02 | P1 | Recurrence and reminders | Create recurring work and move time beyond its due date. | The next occurrence/due date is calculated and an in-app overdue reminder is derived without duplicate spam. |
| HSE-01 | P1 | Risk calculation | Create hazards across probability/severity values including matrix boundaries. | Risk score/level follows the documented matrix; building and risk filters return the correct records. |
| HSE-02 | P1 | Inspection corrective action | Complete a failed inspection, assign corrective action, pass its deadline, then resolve it. | History is retained, overdue state is shown until resolution and compliance recalculates from source data. |
| ANA-01 | P0 | Formula correctness | Evaluate empty, mixed and all-resolved datasets for every published KPI. | Values follow documented formulas; unavailable historical uptime/MTTR is `N/A`, never replaced by a misleading current ratio. |
| STORE-01 | P0 | Persistence | Change multiple modules, reload and load the workspace again. | Current schema data and relations are restored without losing new fields. |
| STORE-02 | P0 | v1 migration | Load a valid foundation v1 envelope with missing Phase 2 properties. | Migration supplies safe defaults, preserves foundation IDs/data and returns the current valid schema. |
| STORE-03 | P0 | Backup round trip | Export, reset, import the exported JSON and reload. | Valid data returns with relations intact; a migration/import activity entry is recorded where designed. |
| STORE-04 | P0 | Invalid import | Import malformed JSON, wrong version, invalid enum/date and orphaned relation examples. | Import is rejected with an actionable error; the current workspace remains unchanged. |
| STORE-05 | P1 | Save failure | Make LocalStorage throw/quota-fail during an update. | The application shows an error and does not present an unsaved change as persisted. |

## Manual browser acceptance

| ID | Priority | Check | Expected result |
| --- | --- | --- | --- |
| E2E-01 | P0 | Execute every step in `DEMO_GUIDE.md` without reloading. | Camera fault, incident, assignment, recovery, closure, analytics and activity remain synchronized. |
| A11Y-01 | P0 | Navigate shell, search, forms, table/card switch, board controls and dialogs with keyboard only. | Focus is visible, order is logical, controls have names and all core actions are operable. |
| A11Y-02 | P1 | Open and close every dialog by button and Escape. | Focus starts inside, remains contained while open and returns to the trigger on close. |
| RESP-01 | P1 | Check 360 px, 768 px and desktop widths. | No horizontal page loss; navigation, forms, charts and tables remain usable. |
| PRINT-01 | P1 | Print the analytics report. | Navigation/actions are omitted and KPI/chart/table content fits a readable report layout. |
| PAGES-01 | P0 | Open the deployed URL, refresh a hash route and load static assets. | App and assets load under `/HubOps/`; refresh does not produce a 404. |

## Traceability

Requirement IDs are defined in `REQUIREMENTS.md`. The principal mapping is:

- ENG-ASSET → ASSET-01 through ASSET-04
- ENG-MON → MON-01 through MON-05
- ENG-INC → INC-01 and INC-02
- ENG-MAINT → MAINT-01 and MAINT-02
- ENG-HSE → HSE-01 and HSE-02
- ENG-ANA → ANA-01
- ENG-DATA → STORE-01 through STORE-05
- ENG-UX/ENG-DEPLOY → A11Y, RESP, PRINT and PAGES cases

