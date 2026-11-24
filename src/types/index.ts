export type ID = string;

export type Status = 'operational' | 'warning' | 'critical';
export type AssetCategory =
  | 'CCTV Cameras'
  | 'Access Control Systems'
  | 'Electronic Locks'
  | 'Payment Terminals'
  | 'Smart Refrigerators'
  | 'Computers and Workstations'
  | 'Network Equipment'
  | 'HVAC Systems'
  | 'IoT Devices'
  | 'Fire Safety Equipment';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type IncidentSource = 'manual' | 'hardware-monitoring';
export type MaintenanceStatus = 'pending' | 'in-progress' | 'completed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SafetyCategory =
  | 'Fire Safety'
  | 'Emergency Exits'
  | 'Electrical Safety'
  | 'Workplace Safety'
  | 'Equipment Safety'
  | 'Environmental Conditions';
export type ConnectionStatus = 'connected' | 'degraded' | 'disconnected';
export type DeviceHealth = 'healthy' | 'warning' | 'critical';
export type FaultCode =
  | 'camera-offline'
  | 'payment-terminal-failure'
  | 'network-connection-lost'
  | 'device-overheating'
  | 'electronic-lock-failure'
  | 'refrigerator-temperature-violation'
  | 'low-battery';

export interface Building { id: ID; name: string; address: string; managerId: ID }
export interface Floor { id: ID; buildingId: ID; name: string }
export interface Room { id: ID; floorId: ID; name: string; status: Status; managerId: ID }
export interface Employee { id: ID; name: string; role: string; email: string }

export interface AssetFault {
  id: ID;
  code: FaultCode;
  title: string;
  severity: IncidentPriority;
  detectedAt: string;
  recoveredAt?: string;
}

export interface Asset {
  id: ID;
  name: string;
  roomId: ID;
  category: AssetCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  assigneeId: ID;
  status: Status;
  installedAt: string;
  lastInspectionAt: string;
  nextMaintenanceAt: string;
  faultHistory: AssetFault[];
  notes: string;
}

export interface IncidentComment { id: ID; authorId?: ID; message: string; createdAt: string }
export interface IncidentHistoryEntry {
  id: ID;
  message: string;
  createdAt: string;
  fromStatus?: IncidentStatus;
  toStatus?: IncidentStatus;
}

export interface Incident {
  id: ID;
  assetId: ID;
  roomId: ID;
  title: string;
  description: string;
  /** Compatibility alias used by the foundation overview. Mirrors priority. */
  severity: IncidentPriority;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigneeId: ID;
  source: IncidentSource;
  createdAt: string;
  deadline: string;
  resolvedAt?: string;
  comments: IncidentComment[];
  history: IncidentHistoryEntry[];
  faultCode?: FaultCode;
}

export interface Task {
  id: ID;
  title: string;
  assigneeId: ID;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  status: 'todo' | 'progress' | 'done';
}

export interface ChecklistItem { id: ID; label: string; completed: boolean; notes?: string }
export interface MaintenanceRecord {
  id: ID;
  assetId: ID;
  title: string;
  scheduledAt: string;
  status: MaintenanceStatus;
  assigneeId: ID;
  checklistTemplate: string;
  checklist: ChecklistItem[];
  recurrenceDays?: number;
  completedAt?: string;
  notes: string;
}

export interface SafetyInspection {
  id: ID;
  roomId: ID;
  inspectorId: ID;
  date: string;
  category: SafetyCategory;
  riskLevel: RiskLevel;
  status: 'scheduled' | 'in-progress' | 'completed';
  passed: boolean;
  checklist: ChecklistItem[];
  findings: string;
  completedAt?: string;
}

export interface Hazard {
  id: ID;
  title: string;
  description: string;
  roomId: ID;
  ownerId: ID;
  category: SafetyCategory;
  likelihood: 1 | 2 | 3 | 4 | 5;
  severity: 1 | 2 | 3 | 4 | 5;
  riskLevel: RiskLevel;
  status: 'open' | 'mitigating' | 'closed';
  identifiedAt: string;
  dueAt: string;
  closedAt?: string;
}

export interface CorrectiveAction {
  id: ID;
  hazardId: ID;
  title: string;
  assigneeId: ID;
  dueAt: string;
  status: 'open' | 'in-progress' | 'completed';
  completedAt?: string;
  notes: string;
}

/** A single time-series point. Current device state is stored separately. */
export interface Telemetry {
  id: ID;
  assetId: ID;
  timestamp: string;
  metric: 'online' | 'latency' | 'temperature' | 'battery' | 'uptime';
  value: number;
  unit: string;
}

export interface DeviceState {
  assetId: ID;
  online: boolean;
  lastHeartbeat: string;
  networkLatencyMs?: number;
  temperatureC?: number;
  batteryLevel?: number;
  uptimeHours?: number;
  connectionStatus: ConnectionStatus;
  health: DeviceHealth;
  activeFaults: FaultCode[];
}

export interface Notification {
  id: ID;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'critical';
  createdAt: string;
  read: boolean;
  entityType?: 'asset' | 'incident' | 'maintenance' | 'safety';
  entityId?: ID;
}

export interface ActivityLog {
  id: ID;
  message: string;
  timestamp: string;
  entityType?: 'asset' | 'incident' | 'maintenance' | 'safety';
  entityId?: ID;
}

export interface SimulationState { running: boolean; intervalMs: number; lastTick?: string }

export interface Data {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  employees: Employee[];
  assets: Asset[];
  incidents: Incident[];
  tasks: Task[];
  maintenance: MaintenanceRecord[];
  inspections: SafetyInspection[];
  hazards: Hazard[];
  correctiveActions: CorrectiveAction[];
  telemetry: Telemetry[];
  deviceStates: DeviceState[];
  notifications: Notification[];
  activity: ActivityLog[];
  simulation: SimulationState;
}
