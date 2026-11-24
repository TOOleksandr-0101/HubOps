import type {
  Asset,
  AssetCategory,
  Data,
  DeviceState,
  FaultCode,
  IncidentPriority,
  Telemetry,
} from '../types';

export const TELEMETRY_LIMIT = 600;
export const TELEMETRY_PER_ASSET_LIMIT = 40;
export const NOTIFICATION_LIMIT = 100;
export const ACTIVITY_LIMIT = 100;

export type SimulationScenario =
  | 'camera-offline'
  | 'payment-terminal-failure'
  | 'network-connection-lost'
  | 'device-overheating'
  | 'electronic-lock-failure'
  | 'refrigerator-temperature-violation'
  | 'low-battery'
  | 'device-recovery';

export interface ScenarioDefinition {
  id: SimulationScenario;
  label: string;
  description: string;
  categories?: AssetCategory[];
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {id:'camera-offline',label:'Camera Offline',description:'Stop heartbeat and network connectivity.',categories:['CCTV Cameras']},
  {id:'payment-terminal-failure',label:'Payment Terminal Failure',description:'Report a critical terminal hardware fault.',categories:['Payment Terminals']},
  {id:'network-connection-lost',label:'Network Connection Lost',description:'Disconnect the selected device from the simulated network.'},
  {id:'device-overheating',label:'Device Overheating',description:'Raise device temperature above the safe threshold.'},
  {id:'electronic-lock-failure',label:'Electronic Lock Failure',description:'Report a critical electronic lock failure.',categories:['Electronic Locks']},
  {id:'refrigerator-temperature-violation',label:'Refrigerator Temperature Violation',description:'Move temperature outside the permitted refrigeration range.',categories:['Smart Refrigerators']},
  {id:'low-battery',label:'Low Battery',description:'Reduce the device battery below 15 percent.'},
  {id:'device-recovery',label:'Device Recovery',description:'Restore simulated readings to their normal range.'},
];

export const SCENARIOS = SCENARIO_DEFINITIONS;

const FAULTS: Record<FaultCode,{title:string;description:string;priority:IncidentPriority}> = {
  'camera-offline':{title:'Camera offline',description:'The simulated camera stopped reporting heartbeat and network connectivity.',priority:'high'},
  'payment-terminal-failure':{title:'Payment terminal failure',description:'The simulated payment terminal reported a critical hardware failure.',priority:'critical'},
  'network-connection-lost':{title:'Network connection lost',description:'The simulated device lost its network connection.',priority:'high'},
  'device-overheating':{title:'Device overheating',description:'The simulated device temperature exceeded its safe operating threshold.',priority:'critical'},
  'electronic-lock-failure':{title:'Electronic lock failure',description:'The simulated electronic lock reported a critical actuation failure.',priority:'critical'},
  'refrigerator-temperature-violation':{title:'Refrigerator temperature violation',description:'The simulated refrigerator temperature moved outside the permitted range.',priority:'critical'},
  'low-battery':{title:'Low battery',description:'The simulated device battery dropped below 15 percent.',priority:'medium'},
};

const BATTERY_CATEGORIES = new Set<AssetCategory>([
  'Electronic Locks','IoT Devices','Fire Safety Equipment','Access Control Systems','CCTV Cameras',
]);
const TEMPERATURE_CATEGORIES = new Set<AssetCategory>([
  'CCTV Cameras','Payment Terminals','Smart Refrigerators','Computers and Workstations',
  'Network Equipment','HVAC Systems','IoT Devices',
]);
const NETWORK_CATEGORIES = new Set<AssetCategory>([
  'CCTV Cameras','Access Control Systems','Electronic Locks','Payment Terminals','Smart Refrigerators',
  'Computers and Workstations','Network Equipment','HVAC Systems','IoT Devices','Fire Safety Equipment',
]);

const uid = () => crypto.randomUUID();
const clamp = (value:number,min:number,max:number) => Math.min(max,Math.max(min,value));
const round = (value:number,precision=1) => Number(value.toFixed(precision));
const plusDays = (iso:string,days:number) => {
  const date=new Date(iso);
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString();
};

export function assetCapabilities(category:AssetCategory):Telemetry['metric'][] {
  const metrics:Telemetry['metric'][]=['online','uptime'];
  if(NETWORK_CATEGORIES.has(category))metrics.push('latency');
  if(TEMPERATURE_CATEGORIES.has(category))metrics.push('temperature');
  if(BATTERY_CATEGORIES.has(category))metrics.push('battery');
  return metrics;
}

export function createDeviceState(asset:Asset,now=new Date().toISOString()):DeviceState {
  const state:DeviceState={
    assetId:asset.id,
    online:true,
    lastHeartbeat:now,
    connectionStatus:'connected',
    health:asset.status==='critical'?'critical':asset.status==='warning'?'warning':'healthy',
    activeFaults:[],
    uptimeHours:720,
  };
  if(NETWORK_CATEGORIES.has(asset.category))state.networkLatencyMs=18;
  if(TEMPERATURE_CATEGORIES.has(asset.category))state.temperatureC=asset.category==='Smart Refrigerators'?4:32;
  if(BATTERY_CATEGORIES.has(asset.category))state.batteryLevel=86;
  return state;
}

function inferredFaults(asset:Asset,state:DeviceState):FaultCode[] {
  const faults=new Set(state.activeFaults);
  if(!state.online||state.connectionStatus==='disconnected'){
    const hasConnectionFault=faults.has('camera-offline')||faults.has('network-connection-lost');
    if(!hasConnectionFault)faults.add(asset.category==='CCTV Cameras'?'camera-offline':'network-connection-lost');
  }
  if(typeof state.temperatureC==='number'){
    if(asset.category==='Smart Refrigerators'&&(state.temperatureC<2||state.temperatureC>8))faults.add('refrigerator-temperature-violation');
    else if(asset.category!=='Smart Refrigerators'&&state.temperatureC>=80)faults.add('device-overheating');
  }
  if(typeof state.batteryLevel==='number'&&state.batteryLevel<=15)faults.add('low-battery');
  return [...faults];
}

function technicalStatus(codes:FaultCode[]):Asset['status'] {
  if(!codes.length)return 'operational';
  return codes.some(code=>FAULTS[code].priority==='critical'||FAULTS[code].priority==='high')?'critical':'warning';
}

function activeIncidentExists(data:Data,assetId:string,code:FaultCode) {
  return data.incidents.some(incident=>incident.assetId===assetId&&incident.faultCode===code&&incident.source==='hardware-monitoring'&&!['resolved','closed'].includes(incident.status));
}

/**
 * Reconciles telemetry state with assets and incidents. It is intentionally pure:
 * the same fault remains one active incident until the device is recovered.
 */
export function reconcileHardwareFaults(data:Data,now=new Date().toISOString()):Data {
  let incidents=[...data.incidents];
  let notifications=[...data.notifications];
  let activity=[...data.activity];
  const assets=data.assets.map(asset=>{
    const state=data.deviceStates.find(item=>item.assetId===asset.id)??createDeviceState(asset,now);
    const codes=inferredFaults(asset,state);
    let faultHistory=[...asset.faultHistory];
    for(const code of codes){
      const existingFault=faultHistory.some(fault=>fault.code===code&&!fault.recoveredAt);
      if(!existingFault){
        const definition=FAULTS[code];
        faultHistory=[{id:uid(),code,title:definition.title,severity:definition.priority,detectedAt:now},...faultHistory].slice(0,50);
        if(!activeIncidentExists({...data,incidents},asset.id,code)){
          const incidentId=uid();
          incidents=[...incidents,{
            id:incidentId,assetId:asset.id,roomId:asset.roomId,title:definition.title,
            description:definition.description,severity:definition.priority,priority:definition.priority,
            status:'open',assigneeId:asset.assigneeId,source:'hardware-monitoring',createdAt:now,
            deadline:plusDays(now,definition.priority==='critical'?1:definition.priority==='high'?2:5),
            comments:[],history:[{id:uid(),message:'Incident created automatically by simulated hardware monitoring.',createdAt:now}],faultCode:code,
          }];
          notifications=[{id:uid(),title:definition.title,message:`${asset.name}: ${definition.description}`,level:definition.priority==='critical'?'critical' as const:'warning' as const,createdAt:now,read:false,entityType:'incident' as const,entityId:incidentId},...notifications].slice(0,NOTIFICATION_LIMIT);
          activity=[{id:uid(),message:`Simulated monitoring detected ${definition.title.toLowerCase()} on ${asset.name}.`,timestamp:now,entityType:'asset' as const,entityId:asset.id},...activity].slice(0,ACTIVITY_LIMIT);
        }
      }
    }
    return {...asset,status:technicalStatus(codes),faultHistory};
  });
  const deviceStates:DeviceState[]=data.assets.map(asset=>{
    const state=data.deviceStates.find(item=>item.assetId===asset.id)??createDeviceState(asset,now);
    const activeFaults=inferredFaults(asset,state);
    const status=technicalStatus(activeFaults);
    return {...state,activeFaults,health:status==='operational'?'healthy':status};
  });
  return {...data,assets,deviceStates,incidents,notifications,activity};
}

function normalValue(asset:Asset,state:DeviceState):DeviceState {
  return {
    ...state,
    online:true,
    connectionStatus:'connected',
    health:'healthy',
    activeFaults:[],
    networkLatencyMs:NETWORK_CATEGORIES.has(asset.category)?18:undefined,
    temperatureC:TEMPERATURE_CATEGORIES.has(asset.category)?asset.category==='Smart Refrigerators'?4:32:undefined,
    batteryLevel:BATTERY_CATEGORIES.has(asset.category)?86:undefined,
  };
}

function assertScenarioSupportsAsset(asset:Asset,scenario:SimulationScenario) {
  const definition=SCENARIO_DEFINITIONS.find(item=>item.id===scenario);
  if(definition?.categories&&!definition.categories.includes(asset.category)){
    throw new Error(`${definition.label} is not applicable to ${asset.category}.`);
  }
  if(scenario==='low-battery'&&!BATTERY_CATEGORIES.has(asset.category))throw new Error(`Low Battery is not applicable to ${asset.category}.`);
  if(scenario==='device-overheating'&&!TEMPERATURE_CATEGORIES.has(asset.category))throw new Error(`Device Overheating is not applicable to ${asset.category}.`);
}

export function applySimulationScenario(data:Data,assetId:string,scenario:SimulationScenario,now=new Date().toISOString()):Data {
  const asset=data.assets.find(item=>item.id===assetId);
  if(!asset)throw new Error('The selected asset no longer exists.');
  assertScenarioSupportsAsset(asset,scenario);
  const current=data.deviceStates.find(item=>item.assetId===assetId)??createDeviceState(asset,now);
  if(scenario==='device-recovery'){
    const hadFault=current.activeFaults.length>0||asset.faultHistory.some(fault=>!fault.recoveredAt);
    const recovered=normalValue(asset,current);
    const assets=data.assets.map(item=>item.id===assetId?{
      ...item,status:'operational' as const,
      faultHistory:item.faultHistory.map(fault=>fault.recoveredAt?fault:{...fault,recoveredAt:now}),
    }:item);
    const deviceStates=data.deviceStates.some(item=>item.assetId===assetId)
      ?data.deviceStates.map(item=>item.assetId===assetId?recovered:item)
      :[...data.deviceStates,recovered];
    if(!hadFault)return {...data,assets,deviceStates};
    return {
      ...data,assets,deviceStates,
      notifications:[{id:uid(),title:'Device recovered',message:`${asset.name} returned to normal simulated operating values. The incident remains available for workflow closure.`,level:'info' as const,createdAt:now,read:false,entityType:'asset' as const,entityId:asset.id},...data.notifications].slice(0,NOTIFICATION_LIMIT),
      activity:[{id:uid(),message:`Simulated device recovery completed for ${asset.name}.`,timestamp:now,entityType:'asset' as const,entityId:asset.id},...data.activity].slice(0,ACTIVITY_LIMIT),
    };
  }
  let next={...current,lastHeartbeat:now};
  switch(scenario){
    case 'camera-offline': next={...next,online:false,connectionStatus:'disconnected',health:'critical',activeFaults:[...new Set([...next.activeFaults,'camera-offline' as const])]};break;
    case 'payment-terminal-failure': next={...next,health:'critical',activeFaults:[...new Set([...next.activeFaults,'payment-terminal-failure' as const])]};break;
    case 'network-connection-lost': next={...next,online:false,connectionStatus:'disconnected',networkLatencyMs:0,health:'critical',activeFaults:[...new Set([...next.activeFaults,'network-connection-lost' as const])]};break;
    case 'device-overheating': next={...next,temperatureC:92,health:'critical',activeFaults:[...new Set([...next.activeFaults,'device-overheating' as const])]};break;
    case 'electronic-lock-failure': next={...next,health:'critical',activeFaults:[...new Set([...next.activeFaults,'electronic-lock-failure' as const])]};break;
    case 'refrigerator-temperature-violation': next={...next,temperatureC:12,health:'critical',activeFaults:[...new Set([...next.activeFaults,'refrigerator-temperature-violation' as const])]};break;
    case 'low-battery': next={...next,batteryLevel:8,health:'warning',activeFaults:[...new Set([...next.activeFaults,'low-battery' as const])]};break;
  }
  const deviceStates=data.deviceStates.some(item=>item.assetId===assetId)
    ?data.deviceStates.map(item=>item.assetId===assetId?next:item)
    :[...data.deviceStates,next];
  return reconcileHardwareFaults({...data,deviceStates},now);
}

function samplesForState(asset:Asset,state:DeviceState,now:string):Telemetry[] {
  const values:Partial<Record<Telemetry['metric'],[number,string]>>={
    online:[state.online?1:0,'boolean'],
    latency:typeof state.networkLatencyMs==='number'?[state.networkLatencyMs,'ms']:undefined,
    temperature:typeof state.temperatureC==='number'?[state.temperatureC,'°C']:undefined,
    battery:typeof state.batteryLevel==='number'?[state.batteryLevel,'%']:undefined,
    uptime:typeof state.uptimeHours==='number'?[state.uptimeHours,'h']:undefined,
  };
  return assetCapabilities(asset.category).flatMap(metric=>{
    const entry=values[metric];
    return entry?[{id:uid(),assetId:asset.id,timestamp:now,metric,value:entry[0],unit:entry[1]}]:[];
  });
}

function boundedTelemetry(existing:Telemetry[],incoming:Telemetry[]):Telemetry[] {
  const combined=[...existing,...incoming];
  const perAsset=new Map<string,Telemetry[]>();
  for(const point of combined){
    const points=perAsset.get(point.assetId)??[];
    points.push(point);
    perAsset.set(point.assetId,points);
  }
  const bounded=[...perAsset.values()].flatMap(points=>points.slice(-TELEMETRY_PER_ASSET_LIMIT));
  return bounded.slice(-TELEMETRY_LIMIT);
}

export function simulateTelemetryTick(
  data:Data,
  options:{now?:string;random?:()=>number}={},
):Data {
  const now=options.now??new Date().toISOString();
  const random=options.random??Math.random;
  const hours=data.simulation.intervalMs/3_600_000;
  const deviceStates=data.assets.map(asset=>{
    const current=data.deviceStates.find(item=>item.assetId===asset.id)??createDeviceState(asset,now);
    const faulty=current.activeFaults.length>0;
    return {
      ...current,
      lastHeartbeat:current.online?now:current.lastHeartbeat,
      networkLatencyMs:typeof current.networkLatencyMs==='number'&&!faulty?round(clamp(current.networkLatencyMs+(random()-.5)*8,4,120)):current.networkLatencyMs,
      temperatureC:typeof current.temperatureC==='number'&&!faulty?round(clamp(current.temperatureC+(random()-.5)*2,asset.category==='Smart Refrigerators'?2:20,asset.category==='Smart Refrigerators'?8:75)):current.temperatureC,
      batteryLevel:typeof current.batteryLevel==='number'&&!faulty?round(clamp(current.batteryLevel-.02,0,100)):current.batteryLevel,
      uptimeHours:typeof current.uptimeHours==='number'&&current.online?round(current.uptimeHours+hours,2):current.uptimeHours,
    };
  });
  const samples=data.assets.flatMap(asset=>samplesForState(asset,deviceStates.find(state=>state.assetId===asset.id)!,now));
  return reconcileHardwareFaults({
    ...data,
    deviceStates,
    telemetry:boundedTelemetry(data.telemetry,samples),
    simulation:{...data.simulation,lastTick:now},
  },now);
}
