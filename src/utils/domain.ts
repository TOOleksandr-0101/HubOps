import type {Data,IncidentStatus,MaintenanceRecord} from '../types';

export const ACTIVE_INCIDENT_STATUSES:IncidentStatus[]=['open','in-progress'];

export function removeBuilding(data:Data,id:string):Data {
 const floors=new Set(data.floors.filter(f=>f.buildingId===id).map(f=>f.id));
 const rooms=new Set(data.rooms.filter(r=>floors.has(r.floorId)).map(r=>r.id));
 if(data.assets.some(a=>rooms.has(a.roomId))) throw new Error('Move linked equipment before deleting this building.');
 const hazards=new Set(data.hazards.filter(hazard=>rooms.has(hazard.roomId)).map(hazard=>hazard.id));
 return {
  ...data,
  buildings:data.buildings.filter(b=>b.id!==id),
  floors:data.floors.filter(f=>!floors.has(f.id)),
  rooms:data.rooms.filter(r=>!rooms.has(r.id)),
  inspections:data.inspections.filter(s=>!rooms.has(s.roomId)),
  hazards:data.hazards.filter(hazard=>!hazards.has(hazard.id)),
  correctiveActions:data.correctiveActions.filter(action=>!hazards.has(action.hazardId)),
 };
}

export function removeFloor(data:Data,id:string):Data {
 const roomIds=new Set(data.rooms.filter(room=>room.floorId===id).map(room=>room.id));
 if(data.assets.some(asset=>roomIds.has(asset.roomId)))throw new Error('Move linked equipment before deleting this floor.');
 const hazardIds=new Set(data.hazards.filter(hazard=>roomIds.has(hazard.roomId)).map(hazard=>hazard.id));
 return {
  ...data,
  floors:data.floors.filter(floor=>floor.id!==id),
  rooms:data.rooms.filter(room=>!roomIds.has(room.id)),
  inspections:data.inspections.filter(inspection=>!roomIds.has(inspection.roomId)),
  hazards:data.hazards.filter(hazard=>!hazardIds.has(hazard.id)),
  correctiveActions:data.correctiveActions.filter(action=>!hazardIds.has(action.hazardId)),
 };
}

export function removeRoom(data:Data,id:string):Data {
 if(data.assets.some(asset=>asset.roomId===id))throw new Error('Move linked equipment before deleting this room.');
 const hazardIds=new Set(data.hazards.filter(hazard=>hazard.roomId===id).map(hazard=>hazard.id));
 return {
  ...data,
  rooms:data.rooms.filter(room=>room.id!==id),
  inspections:data.inspections.filter(inspection=>inspection.roomId!==id),
  hazards:data.hazards.filter(hazard=>hazard.roomId!==id),
  correctiveActions:data.correctiveActions.filter(action=>!hazardIds.has(action.hazardId)),
 };
}

export function removeAsset(data:Data,id:string):Data {
 if(data.incidents.some(incident=>incident.assetId===id))throw new Error('Preserve or reassign linked incidents before deleting this asset.');
 if(data.maintenance.some(record=>record.assetId===id))throw new Error('Preserve or reassign maintenance history before deleting this asset.');
 return {
  ...data,
  assets:data.assets.filter(asset=>asset.id!==id),
  deviceStates:data.deviceStates.filter(state=>state.assetId!==id),
  telemetry:data.telemetry.filter(point=>point.assetId!==id),
  notifications:data.notifications.filter(notification=>!(notification.entityType==='asset'&&notification.entityId===id)),
 };
}

export function removeEmployee(data:Data,id:string):Data {
 const linked=data.buildings.some(item=>item.managerId===id)||data.rooms.some(item=>item.managerId===id)||data.assets.some(item=>item.assigneeId===id)||data.incidents.some(item=>item.assigneeId===id)||data.tasks.some(item=>item.assigneeId===id)||data.maintenance.some(item=>item.assigneeId===id)||data.inspections.some(item=>item.inspectorId===id)||data.hazards.some(item=>item.ownerId===id)||data.correctiveActions.some(item=>item.assigneeId===id);
 if(linked)throw new Error('Reassign this employee’s locations and work before deleting the profile.');
 return {...data,employees:data.employees.filter(employee=>employee.id!==id)};
}

export function transitionIncident(data:Data,id:string,status:IncidentStatus,now=new Date().toISOString()):Data {
 const incident=data.incidents.find(item=>item.id===id);
 if(!incident)throw new Error('The incident no longer exists.');
 if(incident.status===status)return data;
 const terminal=status==='resolved'||status==='closed';
 const entry={id:crypto.randomUUID(),message:`Status changed from ${incident.status} to ${status}.`,createdAt:now,fromStatus:incident.status,toStatus:status};
 return {
  ...data,
  incidents:data.incidents.map(item=>item.id===id?{
   ...item,status,resolvedAt:terminal?(item.resolvedAt??now):undefined,history:[entry,...item.history],
  }:item),
 };
}

export function addIncidentComment(data:Data,id:string,message:string,authorId:string|undefined,now=new Date().toISOString()):Data {
 const text=message.trim();
 if(!text)throw new Error('Comment cannot be empty.');
 if(authorId&&!data.employees.some(employee=>employee.id===authorId))throw new Error('Choose a valid comment author.');
 if(!data.incidents.some(incident=>incident.id===id))throw new Error('The incident no longer exists.');
 return {
  ...data,
  incidents:data.incidents.map(incident=>incident.id===id?{
   ...incident,
   comments:[...incident.comments,{id:crypto.randomUUID(),authorId,message:text,createdAt:now}],
   history:[{id:crypto.randomUUID(),message:'A comment was added.',createdAt:now},...incident.history],
  }:incident),
 };
}

function addDays(date:string,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next.toISOString().slice(0,10);}

export function completeMaintenance(data:Data,id:string,completedAt=new Date().toISOString()):Data {
 const record=data.maintenance.find(item=>item.id===id);
 if(!record)throw new Error('The maintenance record no longer exists.');
 if(record.status==='completed')throw new Error('This maintenance record is already completed.');
 if(record.checklist.some(item=>!item.completed))throw new Error('Complete every checklist item before finishing maintenance.');
 const completed:MaintenanceRecord={...record,status:'completed',completedAt};
 const inspectionDate=completedAt.slice(0,10);
 const nextDate=addDays(inspectionDate,record.recurrenceDays??90);
 const recurring:MaintenanceRecord|undefined=record.recurrenceDays?{
  ...record,id:crypto.randomUUID(),scheduledAt:nextDate,status:'pending',completedAt:undefined,
  checklist:record.checklist.map(item=>({...item,id:crypto.randomUUID(),completed:false,notes:undefined})),
 }:undefined;
 return {
  ...data,
  maintenance:[...data.maintenance.map(item=>item.id===id?completed:item),...(recurring?[recurring]:[])],
  assets:data.assets.map(asset=>asset.id===record.assetId?{...asset,lastInspectionAt:inspectionDate,nextMaintenanceAt:nextDate}:asset),
 };
}

export function metrics(d:Data){
 const active=d.incidents.filter(i=>ACTIVE_INCIDENT_STATUSES.includes(i.status));
 return {
  assets:d.assets.length,
  operational:d.assets.filter(a=>a.status==='operational').length,
  incidents:active.length,
  critical:active.filter(i=>i.priority==='critical').length,
  maintenance:d.maintenance.filter(m=>m.status!=='completed').length,
  tasks:d.tasks.filter(t=>t.status!=='done').length,
 };
}
