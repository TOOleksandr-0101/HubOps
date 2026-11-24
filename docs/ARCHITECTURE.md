# Architecture

React + strict TypeScript + Vite, Tailwind CSS v4, shadcn-style local Button built on Radix Slot and CVA, Lucide icons, Recharts, React Router HashRouter.

## Structure

- `types/`: domain entities and aggregate `Data`.
- `data/`: deterministic fictional seed factory, returning fresh objects.
- `services/`: versioned browser persistence boundary.
- `store/`: React context, mutation pipeline, activity log, save errors.
- `utils/`: derived dashboard metrics, safe location deletion, class merging.
- `hooks/`: browser theme preference.
- `components/`: page heading, badges, labeled fields, keyboard-contained dialog, Button.
- `layouts/`: navigation, responsive shell, global search and notifications.
- `pages/`: foundation modules and explicit planned pages.

Relations: Building → Floor → Room → Asset; Employee → Task and location responsibility; Asset → Incident / MaintenanceRecord / Telemetry; Room → SafetyInspection. IDs are stable seed IDs or crypto.randomUUID for user records.

`useWorkspace().update(transform, message)` computes the next aggregate, saves it, then renders it. Failed saves preserve the current in-memory state and display an error. Data key is `hubops:workspace:v1`, envelope `{ version: 1, data }`. Read failures display a warning rather than silently overwriting saved bytes on load. Basic envelope validation is present; deep schema validation and migrations are future work.

Deleting a location with linked equipment is blocked; empty floor/room hierarchies cascade. Dependent inspections are removed. Equipment migration will belong to Asset Management.

Hash routes require no server rewrite. Browser storage is not a security boundary. A future backend must enforce permissions and validate incoming data, and should replace the persistence service with a versioned API.
