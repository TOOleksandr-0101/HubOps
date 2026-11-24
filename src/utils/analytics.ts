import type {AssetCategory,Data,Incident} from '../types';
import {ACTIVE_INCIDENT_STATUSES} from './domain';

export interface AnalyticsPeriod { start?:string; end?:string }
export interface WorkloadPoint { employeeId:string; name:string; openItems:number }
export interface TrendPoint { date:string; created:number; resolved:number }
export interface CategoryFaultPoint { category:AssetCategory; incidents:number }
export interface BuildingAnalytics { buildingId:string; name:string; assets:number; operational:number; activeIncidents:number }
export interface ProblemAsset { assetId:string; name:string; activeIncidents:number; recordedFaults:number }

export interface AnalyticsSnapshot {
  totalAssets:number;
  operationalAssets:number;
  /** Current online share. This is deliberately not labelled historical uptime. */
  equipmentAvailabilityPercent:number|null;
  /** Mean of recorded online samples; null until samples exist. */
  historicalUptimePercent:number|null;
  activeIncidents:number;
  criticalIncidents:number;
  meanTimeToRepairHours:number|null;
  incidentResolutionRatePercent:number|null;
  maintenanceCompliancePercent:number|null;
  overdueMaintenance:number;
  hseCompliancePercent:number|null;
  openTasks:number;
  employeeWorkload:WorkloadPoint[];
  incidentTrend:TrendPoint[];
  faultsByCategory:CategoryFaultPoint[];
  buildingStats:BuildingAnalytics[];
  problemAssets:ProblemAsset[];
  maintenanceStats:{pending:number;inProgress:number;completed:number};
  hseStats:{scheduled:number;inProgress:number;completed:number;passed:number};
}

const round=(value:number,precision=1)=>Number(value.toFixed(precision));
const percent=(part:number,total:number)=>total?round(part/total*100):null;
const inPeriod=(iso:string,period:AnalyticsPeriod)=>{
  const value=new Date(iso).getTime();
  return (!period.start||value>=new Date(period.start).getTime())&&(!period.end||value<=new Date(period.end).getTime());
};

function incidentResolution(incidents:Incident[]) {
  const terminal=incidents.filter(incident=>(incident.status==='resolved'||incident.status==='closed')&&incident.resolvedAt);
  const hours=terminal.map(incident=>(new Date(incident.resolvedAt!).getTime()-new Date(incident.createdAt).getTime())/3_600_000).filter(value=>value>=0);
  return {
    meanHours:hours.length?round(hours.reduce((sum,value)=>sum+value,0)/hours.length,1):null,
    rate:percent(terminal.length,incidents.length),
  };
}

function trend(incidents:Incident[]):TrendPoint[] {
  const points=new Map<string,TrendPoint>();
  const ensure=(date:string)=>{const current=points.get(date)??{date,created:0,resolved:0};points.set(date,current);return current;};
  for(const incident of incidents){
    ensure(incident.createdAt.slice(0,10)).created+=1;
    if(incident.resolvedAt)ensure(incident.resolvedAt.slice(0,10)).resolved+=1;
  }
  return [...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

export function calculateAnalytics(data:Data,period:AnalyticsPeriod={},now=new Date().toISOString()):AnalyticsSnapshot {
  const active=data.incidents.filter(incident=>ACTIVE_INCIDENT_STATUSES.includes(incident.status));
  const incidents=data.incidents.filter(incident=>inPeriod(incident.createdAt,period));
  const resolution=incidentResolution(incidents);
  const states=new Map(data.deviceStates.map(state=>[state.assetId,state]));
  const online=data.assets.filter(asset=>states.get(asset.id)?.online??true).length;
  const onlineSamples=data.telemetry.filter(point=>point.metric==='online'&&inPeriod(point.timestamp,period));
  const dueMaintenance=data.maintenance.filter(record=>new Date(record.scheduledAt).getTime()<=new Date(now).getTime());
  const completedDue=dueMaintenance.filter(record=>record.status==='completed').length;
  const overdueMaintenance=data.maintenance.filter(record=>record.status!=='completed'&&new Date(record.scheduledAt).getTime()<new Date(now).getTime()).length;
  const completedInspections=data.inspections.filter(inspection=>inspection.status==='completed'&&inPeriod(inspection.completedAt??inspection.date,period));
  const employeeWorkload=data.employees.map(employee=>({
    employeeId:employee.id,name:employee.name,
    openItems:data.tasks.filter(task=>task.assigneeId===employee.id&&task.status!=='done').length+
      active.filter(incident=>incident.assigneeId===employee.id).length+
      data.maintenance.filter(record=>record.assigneeId===employee.id&&record.status!=='completed').length+
      data.correctiveActions.filter(action=>action.assigneeId===employee.id&&action.status!=='completed').length,
  })).sort((a,b)=>b.openItems-a.openItems||a.name.localeCompare(b.name));
  const faultsByCategory=[...new Set(data.assets.map(asset=>asset.category))].map(category=>({
    category,
    incidents:incidents.filter(incident=>data.assets.find(asset=>asset.id===incident.assetId)?.category===category).length,
  })).sort((a,b)=>b.incidents-a.incidents);
  const buildingStats=data.buildings.map(building=>{
    const floorIds=new Set(data.floors.filter(floor=>floor.buildingId===building.id).map(floor=>floor.id));
    const roomIds=new Set(data.rooms.filter(room=>floorIds.has(room.floorId)).map(room=>room.id));
    const assets=data.assets.filter(asset=>roomIds.has(asset.roomId));
    const assetIds=new Set(assets.map(asset=>asset.id));
    return {
      buildingId:building.id,name:building.name,assets:assets.length,
      operational:assets.filter(asset=>asset.status==='operational').length,
      activeIncidents:active.filter(incident=>assetIds.has(incident.assetId)).length,
    };
  });
  const problemAssets=data.assets.map(asset=>({
    assetId:asset.id,name:asset.name,
    activeIncidents:active.filter(incident=>incident.assetId===asset.id).length,
    recordedFaults:asset.faultHistory.length,
  })).filter(item=>item.activeIncidents||item.recordedFaults).sort((a,b)=>(b.activeIncidents+b.recordedFaults)-(a.activeIncidents+a.recordedFaults)).slice(0,10);
  return {
    totalAssets:data.assets.length,
    operationalAssets:data.assets.filter(asset=>asset.status==='operational').length,
    equipmentAvailabilityPercent:percent(online,data.assets.length),
    historicalUptimePercent:onlineSamples.length?percent(onlineSamples.filter(point=>point.value>=1).length,onlineSamples.length):null,
    activeIncidents:active.length,
    criticalIncidents:active.filter(incident=>incident.priority==='critical').length,
    meanTimeToRepairHours:resolution.meanHours,
    incidentResolutionRatePercent:resolution.rate,
    maintenanceCompliancePercent:percent(completedDue,dueMaintenance.length),
    overdueMaintenance,
    hseCompliancePercent:percent(completedInspections.filter(inspection=>inspection.passed).length,completedInspections.length),
    openTasks:data.tasks.filter(task=>task.status!=='done').length,
    employeeWorkload,
    incidentTrend:trend(incidents),
    faultsByCategory,
    buildingStats,
    problemAssets,
    maintenanceStats:{
      pending:data.maintenance.filter(record=>record.status==='pending').length,
      inProgress:data.maintenance.filter(record=>record.status==='in-progress').length,
      completed:data.maintenance.filter(record=>record.status==='completed').length,
    },
    hseStats:{
      scheduled:data.inspections.filter(inspection=>inspection.status==='scheduled').length,
      inProgress:data.inspections.filter(inspection=>inspection.status==='in-progress').length,
      completed:data.inspections.filter(inspection=>inspection.status==='completed').length,
      passed:data.inspections.filter(inspection=>inspection.status==='completed'&&inspection.passed).length,
    },
  };
}

export const analyticsMetrics=calculateAnalytics;
