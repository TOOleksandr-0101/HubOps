import type {Asset,Data,Incident,RiskLevel} from '../types';

export interface ValidationResult { valid:boolean; errors:string[] }
export type FieldErrors = Record<string,string>;

const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const isString=(value:unknown)=>typeof value==='string';
const nonBlank=(value:unknown)=>isString(value)&&value.trim().length>0;
const isBoolean=(value:unknown)=>typeof value==='boolean';
const isNumber=(value:unknown)=>typeof value==='number'&&Number.isFinite(value);
const isDate=(value:unknown)=>isString(value)&&!Number.isNaN(Date.parse(value));
const optional=(value:unknown,guard:(candidate:unknown)=>boolean)=>value===undefined||guard(value);
const oneOf=(value:unknown,values:readonly string[])=>isString(value)&&values.includes(value);
const idsUnique=(items:unknown[])=>{
  const ids=items.flatMap(item=>isRecord(item)&&isString(item.id)?[item.id]:[]);
  return ids.length===new Set(ids).size;
};

const statuses=['operational','warning','critical'] as const;
const categories=['CCTV Cameras','Access Control Systems','Electronic Locks','Payment Terminals','Smart Refrigerators','Computers and Workstations','Network Equipment','HVAC Systems','IoT Devices','Fire Safety Equipment'] as const;
const priorities=['low','medium','high','critical'] as const;
const incidentStatuses=['open','in-progress','resolved','closed'] as const;
const safetyCategories=['Fire Safety','Emergency Exits','Electrical Safety','Workplace Safety','Equipment Safety','Environmental Conditions'] as const;
const faultCodes=['camera-offline','payment-terminal-failure','network-connection-lost','device-overheating','electronic-lock-failure','refrigerator-temperature-violation','low-battery'] as const;

function validateChecklist(value:unknown){return Array.isArray(value)&&value.every(item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.label)&&isBoolean(item.completed)&&optional(item.notes,isString));}
function validateFaults(value:unknown){return Array.isArray(value)&&value.every(item=>isRecord(item)&&nonBlank(item.id)&&oneOf(item.code,faultCodes)&&nonBlank(item.title)&&oneOf(item.severity,priorities)&&isDate(item.detectedAt)&&optional(item.recoveredAt,isDate));}
function validateComments(value:unknown){return Array.isArray(value)&&value.every(item=>isRecord(item)&&nonBlank(item.id)&&optional(item.authorId,isString)&&nonBlank(item.message)&&isDate(item.createdAt));}
function validateHistory(value:unknown){return Array.isArray(value)&&value.every(item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.message)&&isDate(item.createdAt)&&optional(item.fromStatus,v=>oneOf(v,incidentStatuses))&&optional(item.toStatus,v=>oneOf(v,incidentStatuses)));}

type CollectionRule={name:keyof Data;validate:(item:unknown)=>boolean};
const collectionRules:CollectionRule[]=[
  {name:'employees',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.name)&&nonBlank(item.role)&&nonBlank(item.email)},
  {name:'buildings',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.name)&&nonBlank(item.address)&&nonBlank(item.managerId)},
  {name:'floors',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.name)&&nonBlank(item.buildingId)},
  {name:'rooms',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.name)&&nonBlank(item.floorId)&&nonBlank(item.managerId)&&oneOf(item.status,statuses)},
  {name:'assets',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.name)&&nonBlank(item.roomId)&&oneOf(item.category,categories)&&nonBlank(item.manufacturer)&&nonBlank(item.model)&&nonBlank(item.serialNumber)&&nonBlank(item.assigneeId)&&oneOf(item.status,statuses)&&isDate(item.installedAt)&&isDate(item.lastInspectionAt)&&isDate(item.nextMaintenanceAt)&&validateFaults(item.faultHistory)&&isString(item.notes)},
  {name:'incidents',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.assetId)&&nonBlank(item.roomId)&&nonBlank(item.title)&&nonBlank(item.description)&&oneOf(item.severity,priorities)&&oneOf(item.priority,priorities)&&oneOf(item.status,incidentStatuses)&&nonBlank(item.assigneeId)&&oneOf(item.source,['manual','hardware-monitoring'])&&isDate(item.createdAt)&&isDate(item.deadline)&&optional(item.resolvedAt,isDate)&&validateComments(item.comments)&&validateHistory(item.history)&&optional(item.faultCode,v=>oneOf(v,faultCodes))},
  {name:'tasks',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.title)&&nonBlank(item.assigneeId)&&oneOf(item.priority,['low','medium','high'])&&isDate(item.deadline)&&oneOf(item.status,['todo','progress','done'])},
  {name:'maintenance',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.assetId)&&nonBlank(item.title)&&isDate(item.scheduledAt)&&oneOf(item.status,['pending','in-progress','completed'])&&nonBlank(item.assigneeId)&&nonBlank(item.checklistTemplate)&&validateChecklist(item.checklist)&&optional(item.recurrenceDays,isNumber)&&optional(item.completedAt,isDate)&&isString(item.notes)},
  {name:'inspections',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.roomId)&&nonBlank(item.inspectorId)&&isDate(item.date)&&oneOf(item.category,safetyCategories)&&oneOf(item.riskLevel,priorities)&&oneOf(item.status,['scheduled','in-progress','completed'])&&isBoolean(item.passed)&&validateChecklist(item.checklist)&&isString(item.findings)&&optional(item.completedAt,isDate)},
  {name:'hazards',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.title)&&isString(item.description)&&nonBlank(item.roomId)&&nonBlank(item.ownerId)&&oneOf(item.category,safetyCategories)&&isNumber(item.likelihood)&&Number(item.likelihood)>=1&&Number(item.likelihood)<=5&&isNumber(item.severity)&&Number(item.severity)>=1&&Number(item.severity)<=5&&oneOf(item.riskLevel,priorities)&&oneOf(item.status,['open','mitigating','closed'])&&isDate(item.identifiedAt)&&isDate(item.dueAt)&&optional(item.closedAt,isDate)},
  {name:'correctiveActions',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.hazardId)&&nonBlank(item.title)&&nonBlank(item.assigneeId)&&isDate(item.dueAt)&&oneOf(item.status,['open','in-progress','completed'])&&optional(item.completedAt,isDate)&&isString(item.notes)},
  {name:'telemetry',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.assetId)&&isDate(item.timestamp)&&oneOf(item.metric,['online','latency','temperature','battery','uptime'])&&isNumber(item.value)&&isString(item.unit)},
  {name:'deviceStates',validate:item=>isRecord(item)&&nonBlank(item.assetId)&&isBoolean(item.online)&&isDate(item.lastHeartbeat)&&optional(item.networkLatencyMs,isNumber)&&optional(item.temperatureC,isNumber)&&optional(item.batteryLevel,isNumber)&&optional(item.uptimeHours,isNumber)&&oneOf(item.connectionStatus,['connected','degraded','disconnected'])&&oneOf(item.health,['healthy','warning','critical'])&&Array.isArray(item.activeFaults)&&item.activeFaults.every(code=>oneOf(code,faultCodes))},
  {name:'notifications',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.title)&&nonBlank(item.message)&&oneOf(item.level,['info','warning','critical'])&&isDate(item.createdAt)&&isBoolean(item.read)&&optional(item.entityType,v=>oneOf(v,['asset','incident','maintenance','safety']))&&optional(item.entityId,isString)},
  {name:'activity',validate:item=>isRecord(item)&&nonBlank(item.id)&&nonBlank(item.message)&&isDate(item.timestamp)&&optional(item.entityType,v=>oneOf(v,['asset','incident','maintenance','safety']))&&optional(item.entityId,isString)},
];

export function validateRelationships(data:Data):string[] {
  const errors:string[]=[];
  const employeeIds=new Set(data.employees.map(item=>item.id));
  const buildingIds=new Set(data.buildings.map(item=>item.id));
  const floorIds=new Set(data.floors.map(item=>item.id));
  const roomIds=new Set(data.rooms.map(item=>item.id));
  const assetIds=new Set(data.assets.map(item=>item.id));
  const hazardIds=new Set(data.hazards.map(item=>item.id));
  for(const building of data.buildings)if(!employeeIds.has(building.managerId))errors.push(`Building ${building.id} references a missing manager.`);
  for(const floor of data.floors)if(!buildingIds.has(floor.buildingId))errors.push(`Floor ${floor.id} references a missing building.`);
  for(const room of data.rooms){if(!floorIds.has(room.floorId))errors.push(`Room ${room.id} references a missing floor.`);if(!employeeIds.has(room.managerId))errors.push(`Room ${room.id} references a missing manager.`);}
  for(const asset of data.assets){if(!roomIds.has(asset.roomId))errors.push(`Asset ${asset.id} references a missing room.`);if(!employeeIds.has(asset.assigneeId))errors.push(`Asset ${asset.id} references a missing employee.`);}
  for(const incident of data.incidents){if(!assetIds.has(incident.assetId))errors.push(`Incident ${incident.id} references a missing asset.`);if(!roomIds.has(incident.roomId))errors.push(`Incident ${incident.id} references a missing room.`);if(!employeeIds.has(incident.assigneeId))errors.push(`Incident ${incident.id} references a missing assignee.`);}
  for(const task of data.tasks)if(!employeeIds.has(task.assigneeId))errors.push(`Task ${task.id} references a missing assignee.`);
  for(const record of data.maintenance){if(!assetIds.has(record.assetId))errors.push(`Maintenance ${record.id} references a missing asset.`);if(!employeeIds.has(record.assigneeId))errors.push(`Maintenance ${record.id} references a missing assignee.`);}
  for(const inspection of data.inspections){if(!roomIds.has(inspection.roomId))errors.push(`Inspection ${inspection.id} references a missing room.`);if(!employeeIds.has(inspection.inspectorId))errors.push(`Inspection ${inspection.id} references a missing inspector.`);}
  for(const hazard of data.hazards){if(!roomIds.has(hazard.roomId))errors.push(`Hazard ${hazard.id} references a missing room.`);if(!employeeIds.has(hazard.ownerId))errors.push(`Hazard ${hazard.id} references a missing owner.`);}
  for(const action of data.correctiveActions){if(!hazardIds.has(action.hazardId))errors.push(`Corrective action ${action.id} references a missing hazard.`);if(!employeeIds.has(action.assigneeId))errors.push(`Corrective action ${action.id} references a missing assignee.`);}
  for(const point of data.telemetry)if(!assetIds.has(point.assetId))errors.push(`Telemetry ${point.id} references a missing asset.`);
  for(const state of data.deviceStates)if(!assetIds.has(state.assetId))errors.push(`Device state references missing asset ${state.assetId}.`);
  if(new Set(data.deviceStates.map(state=>state.assetId)).size!==data.deviceStates.length)errors.push('Device states contain duplicate asset references.');
  return errors;
}

export function validateWorkspaceData(value:unknown):ValidationResult {
  const errors:string[]=[];
  if(!isRecord(value))return {valid:false,errors:['Workspace data must be an object.']};
  for(const rule of collectionRules){
    const collection=value[rule.name];
    if(!Array.isArray(collection)){errors.push(`${String(rule.name)} must be an array.`);continue;}
    if(!idsUnique(collection)&&rule.name!=='deviceStates')errors.push(`${String(rule.name)} contains duplicate IDs.`);
    collection.forEach((item,index)=>{if(!rule.validate(item))errors.push(`${String(rule.name)}[${index}] has an invalid structure.`);});
  }
  const simulation=value.simulation;
  if(!isRecord(simulation)||!isBoolean(simulation.running)||!isNumber(simulation.intervalMs)||Number(simulation.intervalMs)<500||Number(simulation.intervalMs)>60_000||!optional(simulation.lastTick,isDate))errors.push('simulation has an invalid structure or update interval.');
  if(!errors.length)errors.push(...validateRelationships(value as unknown as Data));
  return {valid:errors.length===0,errors:errors.slice(0,100)};
}

export function assertWorkspaceData(value:unknown):asserts value is Data {
  const result=validateWorkspaceData(value);
  if(!result.valid)throw new Error(`Invalid HubOps workspace: ${result.errors.join(' ')}`);
}

export function validateAssetInput(input:Partial<Asset>,data:Data,editingId?:string):FieldErrors {
  const errors:FieldErrors={};
  if(!input.name?.trim())errors.name='Name is required.';
  if(!categories.includes(input.category as typeof categories[number]))errors.category='Choose a supported category.';
  if(!input.manufacturer?.trim())errors.manufacturer='Manufacturer is required.';
  if(!input.model?.trim())errors.model='Model is required.';
  if(!input.serialNumber?.trim())errors.serialNumber='Serial number is required.';
  else if(data.assets.some(asset=>asset.id!==editingId&&asset.serialNumber.toLowerCase()===input.serialNumber!.trim().toLowerCase()))errors.serialNumber='Serial number must be unique.';
  if(!input.roomId||!data.rooms.some(room=>room.id===input.roomId))errors.roomId='Choose a valid room.';
  if(!input.assigneeId||!data.employees.some(employee=>employee.id===input.assigneeId))errors.assigneeId='Choose a valid responsible employee.';
  for(const field of ['installedAt','lastInspectionAt','nextMaintenanceAt'] as const)if(!isDate(input[field]))errors[field]='Enter a valid date.';
  if(isDate(input.installedAt)&&isDate(input.nextMaintenanceAt)&&new Date(input.nextMaintenanceAt!).getTime()<new Date(input.installedAt!).getTime())errors.nextMaintenanceAt='Next maintenance cannot be before installation.';
  return errors;
}

export function validateIncidentInput(input:Partial<Incident>,data:Data):FieldErrors {
  const errors:FieldErrors={};
  if(!input.title?.trim())errors.title='Title is required.';
  if(!input.description?.trim())errors.description='Description is required.';
  if(!input.assetId||!data.assets.some(asset=>asset.id===input.assetId))errors.assetId='Choose a valid asset.';
  if(!input.assigneeId||!data.employees.some(employee=>employee.id===input.assigneeId))errors.assigneeId='Choose a valid assignee.';
  if(!priorities.includes(input.priority as typeof priorities[number]))errors.priority='Choose a valid priority.';
  if(!incidentStatuses.includes(input.status as typeof incidentStatuses[number]))errors.status='Choose a valid status.';
  if(!isDate(input.deadline))errors.deadline='Enter a valid deadline.';
  return errors;
}

export function riskLevelFor(likelihood:number,severity:number):RiskLevel {
  const score=likelihood*severity;
  return score>=17?'critical':score>=10?'high':score>=5?'medium':'low';
}
