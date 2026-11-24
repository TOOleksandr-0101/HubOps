export type ID = string;
export type Status = 'operational' | 'warning' | 'critical';
export interface Building {id:ID;name:string;address:string;managerId:ID}
export interface Floor {id:ID;buildingId:ID;name:string}
export interface Room {id:ID;floorId:ID;name:string;status:Status;managerId:ID}
export interface Employee {id:ID;name:string;role:string;email:string}
export interface Asset {id:ID;name:string;roomId:ID;category:string;status:Status}
export interface Incident {id:ID;assetId:ID;title:string;severity:'low'|'medium'|'critical';status:'open'|'resolved';createdAt:string}
export interface Task {id:ID;title:string;assigneeId:ID;priority:'low'|'medium'|'high';deadline:string;status:'todo'|'progress'|'done'}
export interface MaintenanceRecord {id:ID;assetId:ID;scheduledAt:string;status:'pending'|'completed'}
export interface SafetyInspection {id:ID;roomId:ID;inspectorId:ID;date:string;passed:boolean}
export interface Telemetry {id:ID;assetId:ID;timestamp:string;metric:string;value:number;unit:string}
export interface ActivityLog {id:ID;message:string;timestamp:string}
export interface Data {buildings:Building[];floors:Floor[];rooms:Room[];employees:Employee[];assets:Asset[];incidents:Incident[];tasks:Task[];maintenance:MaintenanceRecord[];inspections:SafetyInspection[];telemetry:Telemetry[];activity:ActivityLog[]}
