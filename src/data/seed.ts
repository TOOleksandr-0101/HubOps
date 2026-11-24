import type {AssetCategory,Data,RiskLevel,SafetyCategory,Status} from '../types';
import {createDeviceState} from '../services/telemetrySimulator';

const BASE_TIME='2026-11-24T08:00:00.000Z';
const categories:AssetCategory[]=[
  'CCTV Cameras','Access Control Systems','Electronic Locks','Payment Terminals','Smart Refrigerators',
  'Computers and Workstations','Network Equipment','HVAC Systems','IoT Devices','Fire Safety Equipment',
];
const assetNames:Record<AssetCategory,string>={
  'CCTV Cameras':'CCTV camera','Access Control Systems':'Access controller','Electronic Locks':'Electronic lock',
  'Payment Terminals':'Payment terminal','Smart Refrigerators':'Smart refrigerator',
  'Computers and Workstations':'Workstation','Network Equipment':'Network switch','HVAC Systems':'HVAC unit',
  'IoT Devices':'Environment sensor','Fire Safety Equipment':'Fire safety panel',
};
const manufacturers=['Northstar Labs','Saryarka Systems','Steppe Devices','Orion Works','Vertex Demo'];
const safetyCategories:SafetyCategory[]=['Fire Safety','Emergency Exits','Electrical Safety','Workplace Safety','Equipment Safety','Environmental Conditions'];

function dateOnly(offset:number){const d=new Date(BASE_TIME);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
function timestamp(offset:number){const d=new Date(BASE_TIME);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString();}
function riskLevel(likelihood:number,severity:number):RiskLevel {const score=likelihood*severity;return score>=17?'critical':score>=10?'high':score>=5?'medium':'low';}
function checklist(prefix:string,index:number){return ['Visual condition','Power and connectivity','Safety controls'].map((label,item)=>({id:`${prefix}-check-${index}-${item}`,label,completed:false}));}

export function createSeed():Data {
  const employees=Array.from({length:10},(_,i)=>({
    id:`employee-${i}`,
    name:['Alex Morgan','Dana Lee','Sam Patel','Robin Kim','Taylor Reed','Jamie Park','Ari Chen','Casey Noor','Jordan Blake','Riley Fox'][i],
    role:['Facility manager','Systems engineer','Operations specialist'][i%3],
    email:`member${i+1}@example.com`,
  }));
  const buildings=['North Campus','Innovation Center','Research Block','Operations House'].map((name,i)=>({
    id:`building-${i}`,name,address:`${10+i*4} Example Avenue, Astana`,managerId:employees[i].id,
  }));
  const floors=Array.from({length:12},(_,i)=>({id:`floor-${i}`,buildingId:buildings[Math.floor(i/3)].id,name:`Floor ${i%3+1}`}));
  const rooms=Array.from({length:30},(_,i)=>({
    id:`room-${i}`,floorId:floors[i%12].id,name:`Room ${100+i}`,
    status:(i%11===0?'critical':i%7===0?'warning':'operational') as Status,managerId:employees[i%10].id,
  }));
  const assets=Array.from({length:60},(_,i)=>{
    const category=categories[i%categories.length];
    return {
      id:`asset-${i}`,name:`${assetNames[category]} ${String(i+1).padStart(2,'0')}`,roomId:rooms[i%rooms.length].id,category,
      manufacturer:manufacturers[i%manufacturers.length],model:`HX-${category.split(' ').map(word=>word[0]).join('')}-${100+i}`,
      serialNumber:`DEMO-${String(i+1).padStart(5,'0')}`,assigneeId:employees[(i+1)%employees.length].id,status:'operational' as const,
      installedAt:dateOnly(-720+(i%180)),lastInspectionAt:dateOnly(-45+(i%30)),nextMaintenanceAt:dateOnly(7+(i%45)),
      faultHistory:[],notes:'Fictional demonstration equipment. No real device is connected.',
    };
  });
  const incidents=Array.from({length:20},(_,i)=>{
    const priority=i%5===0?'critical' as const:i%4===0?'high' as const:'medium' as const;
    const status=i%3===0?'resolved' as const:i%4===0?'in-progress' as const:'open' as const;
    const createdAt=timestamp(-20+i);
    return {
      id:`incident-${i}`,assetId:assets[i].id,roomId:assets[i].roomId,title:`${assets[i].name} inspection required`,
      description:'A fictional manual inspection found an operating condition that needs review.',severity:priority,priority,status,
      assigneeId:employees[(i+2)%employees.length].id,source:'manual' as const,createdAt,deadline:dateOnly(-15+i),
      ...(status==='resolved'?{resolvedAt:timestamp(-18+i)}:{}),comments:[],
      history:[{id:`incident-${i}-history`,message:'Demo incident registered manually.',createdAt}],
    };
  });
  const tasks=Array.from({length:25},(_,i)=>({
    id:`task-${i}`,title:['Inspect network cabinet','Review access inventory','Check cooling system','Update facility checklist','Prepare operations report'][i%5]+` · ${i+1}`,
    assigneeId:employees[i%10].id,priority:i%4===0?'high' as const:'medium' as const,deadline:dateOnly(7+i%20),status:(['todo','progress','done'] as const)[i%3],
  }));
  const maintenance=Array.from({length:8},(_,i)=>({
    id:`maintenance-${i}`,assetId:assets[i].id,title:`${assetNames[assets[i].category]} scheduled inspection`,scheduledAt:dateOnly(i-2),
    status:i===0?'completed' as const:'pending' as const,assigneeId:employees[(i+3)%employees.length].id,
    checklistTemplate:'Equipment Inspection',checklist:checklist('maintenance',i).map(item=>i===0?{...item,completed:true}:item),
    recurrenceDays:90,...(i===0?{completedAt:timestamp(-1)}:{}),notes:'Demonstration maintenance record.',
  }));
  const inspections=Array.from({length:8},(_,i)=>({
    id:`inspection-${i}`,roomId:rooms[(i*3)%rooms.length].id,inspectorId:employees[(i+4)%employees.length].id,date:dateOnly(i-3),
    category:safetyCategories[i%safetyCategories.length],riskLevel:(['low','medium','high','medium'] as const)[i%4],
    status:i<3?'completed' as const:'scheduled' as const,passed:i%3!==0,checklist:checklist('inspection',i).map(item=>i<3?{...item,completed:true}:item),
    findings:i%3===0?'A fictional corrective action is required.':'No unresolved demonstration findings.',...(i<3?{completedAt:timestamp(i-3)}:{}),
  }));
  const hazards=Array.from({length:6},(_,i)=>{
    const likelihood=((i%4)+1) as 1|2|3|4|5;
    const severity=(((i+1)%5)+1) as 1|2|3|4|5;
    return {
      id:`hazard-${i}`,title:['Obstructed service aisle','Loose cable cover','Warm electrical cabinet','Unmarked floor transition','Ventilation check due','Emergency light inspection'][i],
      description:'Fictional HSE observation for demonstration and training purposes only.',roomId:rooms[(i*4)%rooms.length].id,ownerId:employees[(i+5)%employees.length].id,
      category:safetyCategories[i%safetyCategories.length],likelihood,severity,riskLevel:riskLevel(likelihood,severity),
      status:i===0?'mitigating' as const:i===5?'closed' as const:'open' as const,identifiedAt:dateOnly(-12+i),dueAt:dateOnly(3+i),...(i===5?{closedAt:dateOnly(-1)}:{}),
    };
  });
  const correctiveActions=hazards.slice(0,4).map((hazard,i)=>({
    id:`action-${i}`,hazardId:hazard.id,title:`Mitigate: ${hazard.title}`,assigneeId:hazard.ownerId,dueAt:hazard.dueAt,
    status:i===0?'in-progress' as const:'open' as const,notes:'Fictional corrective action.',
  }));
  const deviceStates=assets.map(asset=>createDeviceState(asset,BASE_TIME));
  return {
    buildings,floors,rooms,employees,assets,incidents,tasks,maintenance,inspections,hazards,correctiveActions,
    telemetry:[],deviceStates,
    notifications:[
      {id:'notification-maintenance',title:'Maintenance due',message:'Several fictional equipment inspections are approaching their due date.',level:'warning',createdAt:BASE_TIME,read:false,entityType:'maintenance'},
    ],
    activity:[{id:'initial',message:'Demo workspace initialized with fictional Astana campus data.',timestamp:BASE_TIME}],
    simulation:{running:false,intervalMs:5000},
  };
}
