import {describe,expect,test} from 'vitest';
import {createSeed} from '../data/seed';
import {load,parseWorkspace,save,serializeWorkspace,STORAGE_KEY,validateWorkspaceImport} from '../services/storage';
import {applySimulationScenario,simulateTelemetryTick,TELEMETRY_LIMIT,TELEMETRY_PER_ASSET_LIMIT} from '../services/telemetrySimulator';
import {calculateAnalytics} from './analytics';
import {completeMaintenance,removeAsset,transitionIncident} from './domain';
import {validateAssetInput,validateWorkspaceData} from './validation';

describe('workspace schema and persistence',()=>{
 test('v2 seed passes deep validation and round trips through an export',()=>{
  const seed=createSeed();
  expect(validateWorkspaceData(seed)).toEqual({valid:true,errors:[]});
  expect(parseWorkspace(serializeWorkspace(seed))).toEqual(seed);
 });

 test('migrates the foundation v1 envelope without losing primary records',()=>{
  const seed=createSeed();
  const legacy={
   version:1,
   data:{
    buildings:seed.buildings,floors:seed.floors,rooms:seed.rooms,employees:seed.employees,
    assets:seed.assets.map(({id,name,roomId,status},index)=>({id,name,roomId,status,category:['Networking','Computing','Climate','Sensors'][index%4]})),
    incidents:seed.incidents.map(({id,assetId,title,severity,status,createdAt})=>({id,assetId,title,severity,status:status==='resolved'?'resolved':'open',createdAt})),
    tasks:seed.tasks,
    maintenance:seed.maintenance.map(({id,assetId,scheduledAt,status})=>({id,assetId,scheduledAt,status:status==='completed'?'completed':'pending'})),
    inspections:seed.inspections.map(({id,roomId,inspectorId,date,passed})=>({id,roomId,inspectorId,date,passed})),
    telemetry:[],activity:seed.activity,
   },
  };
  const migrated=parseWorkspace(JSON.stringify(legacy));
  expect(migrated.assets).toHaveLength(seed.assets.length);
  expect(migrated.assets[0].category).toBe('Network Equipment');
  expect(migrated.assets[0].serialNumber).toMatch(/^MIGRATED-/);
  expect(migrated.deviceStates).toHaveLength(seed.assets.length);
  expect(validateWorkspaceData(migrated).valid).toBe(true);
 });

 test('rejects malformed imports instead of silently replacing missing data',()=>{
  const result=validateWorkspaceImport(JSON.stringify({version:2,data:{assets:[]}}));
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/buildings|employees/);
 });

 test('persists the validated workspace in the versioned browser key',()=>{
  localStorage.clear();
  const seed=createSeed();
  const changed={...seed,tasks:seed.tasks.map((task,index)=>index===0?{...task,status:'done' as const}:task)};
  save(changed);
  expect(localStorage.getItem(STORAGE_KEY)).toContain('"version":2');
  expect(load().data.tasks[0].status).toBe('done');
  localStorage.clear();
 });
});

describe('simulated hardware monitoring',()=>{
 test('creates one monitoring incident for a repeated fault and recovers telemetry independently',()=>{
  const seed=createSeed();
  const camera=seed.assets.find(asset=>asset.category==='CCTV Cameras')!;
  const first=applySimulationScenario(seed,camera.id,'camera-offline','2026-11-24T10:00:00.000Z');
  const repeated=applySimulationScenario(first,camera.id,'camera-offline','2026-11-24T10:01:00.000Z');
  const incidents=repeated.incidents.filter(incident=>incident.assetId===camera.id&&incident.faultCode==='camera-offline');
  expect(incidents).toHaveLength(1);
  expect(repeated.assets.find(asset=>asset.id===camera.id)?.status).toBe('critical');
  expect(repeated.deviceStates.find(state=>state.assetId===camera.id)?.online).toBe(false);
  expect(repeated.notifications.some(item=>item.entityId===incidents[0].id)).toBe(true);

  const recovered=applySimulationScenario(repeated,camera.id,'device-recovery','2026-11-24T10:02:00.000Z');
  expect(recovered.assets.find(asset=>asset.id===camera.id)?.status).toBe('operational');
  expect(recovered.deviceStates.find(state=>state.assetId===camera.id)?.online).toBe(true);
  expect(recovered.incidents.find(incident=>incident.id===incidents[0].id)?.status).toBe('open');
 });

 test('caps telemetry globally and per asset',()=>{
  let data=createSeed();
  for(let index=0;index<20;index++)data=simulateTelemetryTick(data,{now:`2026-11-24T10:${String(index).padStart(2,'0')}:00.000Z`,random:()=>0.5});
  expect(data.telemetry.length).toBeLessThanOrEqual(TELEMETRY_LIMIT);
  for(const asset of data.assets)expect(data.telemetry.filter(point=>point.assetId===asset.id).length).toBeLessThanOrEqual(TELEMETRY_PER_ASSET_LIMIT);
 });
});

describe('domain workflows and analytics',()=>{
 test('closing an incident does not change the actual device state',()=>{
  const seed=createSeed();
  const camera=seed.assets.find(asset=>asset.category==='CCTV Cameras')!;
  const failed=applySimulationScenario(seed,camera.id,'camera-offline','2026-11-24T10:00:00.000Z');
  const incident=failed.incidents.find(item=>item.assetId===camera.id&&item.faultCode==='camera-offline')!;
  const closed=transitionIncident(failed,incident.id,'closed','2026-11-24T11:00:00.000Z');
  expect(closed.deviceStates.find(state=>state.assetId===camera.id)?.online).toBe(false);
  expect(closed.assets.find(asset=>asset.id===camera.id)?.status).toBe('critical');
 });

 test('maintenance completion updates asset dates and creates the next recurring record',()=>{
  const seed=createSeed();
  const target={...seed.maintenance[1],checklist:seed.maintenance[1].checklist.map(item=>({...item,completed:true}))};
  const data={...seed,maintenance:seed.maintenance.map(item=>item.id===target.id?target:item)};
  const completed=completeMaintenance(data,target.id,'2026-11-24T12:00:00.000Z');
  expect(completed.maintenance.find(item=>item.id===target.id)?.status).toBe('completed');
  expect(completed.maintenance.length).toBe(seed.maintenance.length+1);
  expect(completed.assets.find(asset=>asset.id===target.assetId)?.lastInspectionAt).toBe('2026-11-24');
 });

 test('analytics distinguishes current availability from historical uptime',()=>{
  const seed=createSeed();
  const before=calculateAnalytics(seed,{},'2026-11-24T12:00:00.000Z');
  expect(before.equipmentAvailabilityPercent).toBe(100);
  expect(before.historicalUptimePercent).toBeNull();
  const sampled=simulateTelemetryTick(seed,{now:'2026-11-24T12:00:00.000Z',random:()=>0.5});
  const after=calculateAnalytics(sampled,{},'2026-11-24T12:00:00.000Z');
  expect(after.historicalUptimePercent).toBe(100);
  expect(after.totalAssets).toBe(60);
 });

 test('form validation enforces unique serials and deletion preserves linked history',()=>{
  const seed=createSeed();
  const draft={...seed.assets[1],serialNumber:seed.assets[0].serialNumber};
  expect(validateAssetInput(draft,seed,draft.id).serialNumber).toMatch(/unique/i);
  expect(()=>removeAsset(seed,seed.assets[0].id)).toThrow(/incident|maintenance/i);
 });
});
