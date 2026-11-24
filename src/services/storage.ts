import {createSeed} from '../data/seed';
import {createDeviceState} from './telemetrySimulator';
import {assertWorkspaceData,validateWorkspaceData,type ValidationResult} from '../utils/validation';
import type {AssetCategory,Data,IncidentPriority,Status,Telemetry} from '../types';

export const CURRENT_SCHEMA_VERSION=2;
export const STORAGE_KEY='hubops:workspace:v2';
export const LEGACY_STORAGE_KEY='hubops:workspace:v1';

interface WorkspaceEnvelope { version:number; data:unknown; exportedAt?:string }
const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const list=(value:unknown):Record<string,unknown>[]=>Array.isArray(value)?value.filter(isRecord):[];
const string=(value:unknown,fallback='')=>typeof value==='string'?value:fallback;
const status=(value:unknown):Status=>value==='warning'||value==='critical'?value:'operational';
const priority=(value:unknown):IncidentPriority=>value==='low'||value==='high'||value==='critical'?value:'medium';
const categoryMap:Record<string,AssetCategory>={
  Networking:'Network Equipment',Computing:'Computers and Workstations',Climate:'HVAC Systems',Sensors:'IoT Devices',
};
const validCategories=new Set<AssetCategory>(['CCTV Cameras','Access Control Systems','Electronic Locks','Payment Terminals','Smart Refrigerators','Computers and Workstations','Network Equipment','HVAC Systems','IoT Devices','Fire Safety Equipment']);
const isoDate=(offset:number)=>{const date=new Date('2026-11-24T08:00:00.000Z');date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);};

function migrateV1(input:unknown):Data {
  if(!isRecord(input))throw new Error('Legacy workspace data must be an object.');
  const employees=list(input.employees).map((item,index)=>({id:string(item.id,`employee-${index}`),name:string(item.name,`Employee ${index+1}`),role:string(item.role,'Operations specialist'),email:string(item.email,`member${index+1}@example.com`)}));
  const fallbackEmployee=employees[0]?.id??'';
  const buildings=list(input.buildings).map((item,index)=>({id:string(item.id,`building-${index}`),name:string(item.name,`Building ${index+1}`),address:string(item.address,'Fictional address'),managerId:string(item.managerId,fallbackEmployee)}));
  const floors=list(input.floors).map((item,index)=>({id:string(item.id,`floor-${index}`),buildingId:string(item.buildingId),name:string(item.name,`Floor ${index+1}`)}));
  const rooms=list(input.rooms).map((item,index)=>({id:string(item.id,`room-${index}`),floorId:string(item.floorId),name:string(item.name,`Room ${index+1}`),status:status(item.status),managerId:string(item.managerId,fallbackEmployee)}));
  const roomManagers=new Map(rooms.map(room=>[room.id,room.managerId]));
  const assets=list(input.assets).map((item,index)=>{
    const oldCategory=string(item.category,'Sensors');
    const mapped=categoryMap[oldCategory]??(validCategories.has(oldCategory as AssetCategory)?oldCategory as AssetCategory:'IoT Devices');
    const roomId=string(item.roomId);
    return {
      id:string(item.id,`asset-${index}`),name:string(item.name,`Asset ${index+1}`),roomId,category:mapped,
      manufacturer:'Legacy Demo Equipment',model:`MIGRATED-${String(index+1).padStart(3,'0')}`,
      serialNumber:`MIGRATED-${String(index+1).padStart(5,'0')}`,assigneeId:roomManagers.get(roomId)??fallbackEmployee,status:status(item.status),
      installedAt:isoDate(-365-index),lastInspectionAt:isoDate(-30+(index%20)),nextMaintenanceAt:isoDate(15+(index%45)),
      faultHistory:[],notes:'Migrated from the HubOps foundation schema.',
    };
  });
  const assetMap=new Map(assets.map(asset=>[asset.id,asset]));
  const incidents=list(input.incidents).map((item,index)=>{
    const assetId=string(item.assetId);
    const asset=assetMap.get(assetId);
    const severity=priority(item.severity);
    const oldStatus=string(item.status)==='resolved'?'resolved' as const:'open' as const;
    const createdAt=string(item.createdAt,'2026-11-24T08:00:00.000Z');
    return {
      id:string(item.id,`incident-${index}`),assetId,roomId:asset?.roomId??'',title:string(item.title,`Migrated incident ${index+1}`),
      description:'Migrated manual incident from the HubOps foundation schema.',severity,priority:severity,status:oldStatus,
      assigneeId:asset?.assigneeId??fallbackEmployee,source:'manual' as const,createdAt,deadline:isoDate(7+index),
      ...(oldStatus==='resolved'?{resolvedAt:createdAt}:{}),comments:[],
      history:[{id:`migration-history-${index}`,message:'Incident migrated to workspace schema v2.',createdAt}],
    };
  });
  const tasks:Data['tasks']=list(input.tasks).map((item,index)=>({
    id:string(item.id,`task-${index}`),title:string(item.title,`Task ${index+1}`),assigneeId:string(item.assigneeId,fallbackEmployee),
    priority:item.priority==='low'?'low':item.priority==='high'?'high':'medium',deadline:string(item.deadline,isoDate(7)),
    status:item.status==='progress'?'progress':item.status==='done'?'done':'todo',
  }));
  const maintenance=list(input.maintenance).map((item,index)=>{
    const assetId=string(item.assetId);
    const asset=assetMap.get(assetId);
    const completed=item.status==='completed';
    return {
      id:string(item.id,`maintenance-${index}`),assetId,title:`${asset?.name??'Equipment'} inspection`,scheduledAt:string(item.scheduledAt,isoDate(14)),
      status:completed?'completed' as const:'pending' as const,assigneeId:asset?.assigneeId??fallbackEmployee,checklistTemplate:'Equipment Inspection',
      checklist:[{id:`maintenance-${index}-visual`,label:'Visual condition',completed}],recurrenceDays:90,
      ...(completed?{completedAt:string(item.scheduledAt,'2026-11-24T08:00:00.000Z')}:{}),notes:'Migrated maintenance record.',
    };
  });
  const inspections=list(input.inspections).map((item,index)=>({
    id:string(item.id,`inspection-${index}`),roomId:string(item.roomId),inspectorId:string(item.inspectorId,fallbackEmployee),date:string(item.date,isoDate(14)),
    category:'Equipment Safety' as const,riskLevel:item.passed?'low' as const:'high' as const,status:'completed' as const,passed:Boolean(item.passed),
    checklist:[{id:`inspection-${index}-general`,label:'General safety condition',completed:true}],findings:item.passed?'No migrated findings.':'Review required after migration.',completedAt:string(item.date,'2026-11-24T08:00:00.000Z'),
  }));
  const telemetry=list(input.telemetry).flatMap((item,index)=>{
    const metric=string(item.metric) as Telemetry['metric'];
    if(!['online','latency','temperature','battery','uptime'].includes(metric)||typeof item.value!=='number')return [];
    return [{id:string(item.id,`telemetry-${index}`),assetId:string(item.assetId),timestamp:string(item.timestamp,'2026-11-24T08:00:00.000Z'),metric,value:item.value,unit:string(item.unit)}];
  });
  const activity=list(input.activity).map((item,index)=>({id:string(item.id,`activity-${index}`),message:string(item.message,'Migrated activity'),timestamp:string(item.timestamp,'2026-11-24T08:00:00.000Z')}));
  const deviceStates=assets.map(asset=>createDeviceState(asset,'2026-11-24T08:00:00.000Z'));
  const migrated:Data={
    buildings,floors,rooms,employees,assets,incidents,tasks,maintenance,inspections,hazards:[],correctiveActions:[],
    telemetry,deviceStates,notifications:[],activity,
    simulation:{running:false,intervalMs:5000},
  };
  assertWorkspaceData(migrated);
  return migrated;
}

export function migrateWorkspaceEnvelope(value:unknown):Data {
  if(!isRecord(value)||typeof value.version!=='number'||!('data' in value))throw new Error('Expected a versioned HubOps workspace export.');
  if(value.version===1)return migrateV1(value.data);
  if(value.version!==CURRENT_SCHEMA_VERSION)throw new Error(`Unsupported HubOps workspace version: ${value.version}.`);
  assertWorkspaceData(value.data);
  return value.data;
}

export function serializeWorkspace(data:Data,pretty=true):string {
  assertWorkspaceData(data);
  const envelope:WorkspaceEnvelope={version:CURRENT_SCHEMA_VERSION,exportedAt:new Date().toISOString(),data};
  return JSON.stringify(envelope,null,pretty?2:undefined);
}

export function parseWorkspace(raw:string):Data {
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{throw new Error('The selected file is not valid JSON.');}
  return migrateWorkspaceEnvelope(parsed);
}

export const importWorkspace=parseWorkspace;
export const exportWorkspace=serializeWorkspace;

export function validateWorkspaceImport(raw:string):ValidationResult {
  try{return validateWorkspaceData(parseWorkspace(raw));}
  catch(error){return {valid:false,errors:[error instanceof Error?error.message:'The workspace could not be imported.']};}
}

export function load():{data:Data;warning:string} {
  if(typeof localStorage==='undefined')return {data:createSeed(),warning:''};
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    const legacy=current?null:localStorage.getItem(LEGACY_STORAGE_KEY);
    if(!current&&!legacy)return {data:createSeed(),warning:''};
    const data=parseWorkspace(current??legacy!);
    if(!current&&legacy){
      try{localStorage.setItem(STORAGE_KEY,serializeWorkspace(data,false));}
      catch{return {data,warning:'Your saved workspace was migrated in memory, but the upgraded copy could not be saved.'};}
    }
    return {data,warning:''};
  }catch{
    return {data:createSeed(),warning:'Saved data could not be read. Demo data is shown; export or reset before making changes.'};
  }
}

export function save(data:Data) {
  assertWorkspaceData(data);
  if(typeof localStorage==='undefined')throw new Error('Browser storage is unavailable.');
  localStorage.setItem(STORAGE_KEY,serializeWorkspace(data,false));
}
