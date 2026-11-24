import {useEffect,useMemo,useState} from 'react';
import {Activity,Play,RefreshCw,Radio,Square,TriangleAlert,Wifi,WifiOff} from 'lucide-react';
import {CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Badge,Field,PageTitle} from '../components/Shared';
import {Button} from '../components/ui/button';
import {useWorkspace} from '../store/Workspace';
import {applySimulationScenario,assetCapabilities,createDeviceState,SCENARIO_DEFINITIONS,type SimulationScenario} from '../services/telemetrySimulator';
import type {AssetCategory,Telemetry} from '../types';

const metricLabels:Record<Telemetry['metric'],string>={online:'Online',latency:'Network latency',temperature:'Temperature',battery:'Battery level',uptime:'Uptime'};
const metricUnits:Record<Telemetry['metric'],string>={online:'',latency:'ms',temperature:'°C',battery:'%',uptime:'h'};

export function Monitoring(){
 const {data,update}=useWorkspace();
 const [selectedId,setSelectedId]=useState(data.assets[0]?.id??'');
 const [scenario,setScenario]=useState<SimulationScenario>('camera-offline');
 const [metric,setMetric]=useState<Telemetry['metric']>('latency');
 const [category,setCategory]=useState<AssetCategory|'all'>('all');
 const [health,setHealth]=useState<'all'|'healthy'|'warning'|'critical'|'offline'>('all');
 const [message,setMessage]=useState('');
 const selected=data.assets.find(asset=>asset.id===selectedId)??data.assets[0];
 const selectedState=selected?(data.deviceStates.find(state=>state.assetId===selected.id)??createDeviceState(selected)):undefined;
 const states=useMemo(()=>new Map(data.deviceStates.map(state=>[state.assetId,state])),[data.deviceStates]);

 useEffect(()=>{
  if(!selected&&data.assets[0])setSelectedId(data.assets[0].id);
 },[data.assets,selected]);
 useEffect(()=>{
  if(!selected)return;
  const definition=SCENARIO_DEFINITIONS.find(item=>item.id===scenario);
  if(definition?.categories&&!definition.categories.includes(selected.category)){
   const fallback=SCENARIO_DEFINITIONS.find(item=>!item.categories||item.categories.includes(selected.category));
   if(fallback)setScenario(fallback.id);
  }
  const capabilities=assetCapabilities(selected.category);
  if(!capabilities.includes(metric))setMetric(capabilities.find(item=>item!=='online')??'uptime');
 },[selected,scenario,metric]);

 const devices=data.assets.filter(asset=>{
  const state=states.get(asset.id)??createDeviceState(asset);
  const matchesHealth=health==='all'||(health==='offline'?!state.online:state.health===health);
  return (category==='all'||asset.category===category)&&matchesHealth;
 });
 const online=data.assets.filter(asset=>(states.get(asset.id)??createDeviceState(asset)).online).length;
 const critical=data.assets.filter(asset=>(states.get(asset.id)??createDeviceState(asset)).health==='critical').length;
 const latencyStates=data.assets.map(asset=>states.get(asset.id)??createDeviceState(asset)).filter(state=>typeof state.networkLatencyMs==='number');
 const avgLatency=latencyStates.length?Math.round(latencyStates.reduce((sum,state)=>sum+(state.networkLatencyMs??0),0)/latencyStates.length):0;
 const capabilities=selected?assetCapabilities(selected.category):[];
 const chartData=selected?data.telemetry.filter(point=>point.assetId===selected.id&&point.metric===metric).slice(-24).map(point=>({time:new Date(point.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),value:point.value,unit:point.unit})):[];
 const categories=[...new Set(data.assets.map(asset=>asset.category))].sort();
 const applicableScenarios=selected?SCENARIO_DEFINITIONS.filter(item=>!item.categories||item.categories.includes(selected.category)):SCENARIO_DEFINITIONS;

 function toggleSimulation(){
  const running=!data.simulation.running;
  try{update(current=>({...current,simulation:{...current.simulation,running}}),`${running?'Started':'Stopped'} simulated hardware monitoring`);setMessage(running?'Simulation is running. Telemetry will update at the selected interval.':'Simulation stopped. Existing telemetry remains available.');}catch(cause){setMessage((cause as Error).message);}
 }
 function changeInterval(value:number){try{update(current=>({...current,simulation:{...current.simulation,intervalMs:value}}),`Changed telemetry frequency to ${value/1000} seconds`);setMessage(`Update frequency set to ${value/1000} seconds.`);}catch(cause){setMessage((cause as Error).message);}}
 function applyScenario(){
  if(!selected)return;
  try{update(current=>applySimulationScenario(current,selected.id,scenario),`Applied simulated scenario: ${SCENARIO_DEFINITIONS.find(item=>item.id===scenario)?.label??scenario}`,{log:false});setMessage(`${SCENARIO_DEFINITIONS.find(item=>item.id===scenario)?.label} applied to ${selected.name}.`);}catch(cause){setMessage((cause as Error).message);}
 }

 return <>
  <PageTitle eyebrow="ENGINEERING" title="Hardware monitoring" description="Live-looking telemetry and fault detection for the fictional equipment inventory."/>
  <div className="engineering-notice"><Radio size={20}/><div><strong>Simulated Hardware Monitoring</strong><p>No real devices are connected. Readings, heartbeats, failures, incidents, and recovery events are generated locally for demonstration.</p></div></div>
  <div className="summary-grid">
   <section className="card stat"><div className="stat-label">Online devices<Wifi size={18}/></div><div className="stat-value">{online}</div><small>of {data.assets.length} monitored assets</small></section>
   <section className="card stat"><div className="stat-label">Offline devices<WifiOff size={18}/></div><div className="stat-value">{data.assets.length-online}</div><small>Heartbeat unavailable</small></section>
   <section className="card stat"><div className="stat-label">Critical health<TriangleAlert size={18}/></div><div className="stat-value">{critical}</div><small>Active simulated fault state</small></section>
   <section className="card stat"><div className="stat-label">Average latency<Activity size={18}/></div><div className="stat-value">{avgLatency}<small> ms</small></div><small>Applicable connected devices</small></section>
  </div>
  <div className="monitor-layout">
   <div className="detail-stack">
    <section className="card control-panel"><div className="section-head"><div><h2>Simulation control panel</h2><p>Inject and recover deterministic device faults</p></div><Badge tone={data.simulation.running?'success':'neutral'}>{data.simulation.running?'Running':'Stopped'}</Badge></div><div className="simulation-state"><span className={`pulse ${data.simulation.running?'running':''}`}/><span>{data.simulation.running?`Sampling every ${data.simulation.intervalMs/1000} seconds`:'Automatic sampling is paused'}</span></div><Field label="Device"><select value={selected?.id??''} onChange={event=>setSelectedId(event.target.value)}>{data.assets.map(asset=><option key={asset.id} value={asset.id}>{asset.name} · {asset.category}</option>)}</select></Field><Field label="Scenario"><select value={scenario} onChange={event=>setScenario(event.target.value as SimulationScenario)}>{applicableScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><p>{SCENARIO_DEFINITIONS.find(item=>item.id===scenario)?.description}</p><Field label="Update frequency"><select value={data.simulation.intervalMs} onChange={event=>changeInterval(Number(event.target.value))}><option value={1000}>Every 1 second</option><option value={3000}>Every 3 seconds</option><option value={5000}>Every 5 seconds</option><option value={10000}>Every 10 seconds</option></select></Field><div className="form-actions"><Button onClick={toggleSimulation}>{data.simulation.running?<><Square size={14}/> Stop simulation</>:<><Play size={14}/> Start simulation</>}</Button><Button variant="outline" onClick={applyScenario}><RefreshCw size={14}/> Apply scenario</Button></div>{message?<p className="status-message" role="status" aria-live="polite">{message}</p>:null}</section>
    <section className="card"><div className="section-head"><div><h2>Device filter</h2><p>Inspect a category or health state</p></div><Badge>{devices.length}</Badge></div><div className="form-grid"><Field label="Category"><select value={category} onChange={event=>setCategory(event.target.value as AssetCategory|'all')}><option value="all">All categories</option>{categories.map(item=><option key={item}>{item}</option>)}</select></Field><Field label="Health"><select value={health} onChange={event=>setHealth(event.target.value as typeof health)}><option value="all">All states</option><option value="healthy">Healthy</option><option value="warning">Warning</option><option value="critical">Critical</option><option value="offline">Offline</option></select></Field></div><div className="device-list">{devices.map(asset=>{const state=states.get(asset.id)??createDeviceState(asset);return <button className={`device-row ${selected?.id===asset.id?'is-selected':''}`} key={asset.id} onClick={()=>setSelectedId(asset.id)}><span className="device-icon">{state.online?<Wifi size={16}/>:<WifiOff size={16}/>}</span><span><strong>{asset.name}</strong><small>{asset.category}</small></span><Badge tone={!state.online||state.health==='critical'?'danger':state.health==='warning'?'warning':'success'}>{!state.online?'offline':state.health}</Badge></button>;})}{!devices.length?<p className="empty">No devices match the filter.</p>:null}</div></section>
   </div>
   <div className="detail-stack">
    <section className="card">{selected&&selectedState?<><div className="telemetry-head"><div><span className="asset-id">{selected.id}</span><h2>{selected.name}</h2><p>{selected.category}</p></div><Badge tone={!selectedState.online||selectedState.health==='critical'?'danger':selectedState.health==='warning'?'warning':'success'}>{!selectedState.online?'offline':selectedState.health}</Badge></div><div className="telemetry-metrics"><div className="telemetry-metric"><span>Connection</span><strong>{selectedState.connectionStatus}</strong></div><div className="telemetry-metric"><span>Last heartbeat</span><strong>{new Date(selectedState.lastHeartbeat).toLocaleTimeString()}</strong></div>{typeof selectedState.networkLatencyMs==='number'?<div className="telemetry-metric"><span>Latency</span><strong>{selectedState.networkLatencyMs} ms</strong></div>:null}{typeof selectedState.temperatureC==='number'?<div className="telemetry-metric"><span>Temperature</span><strong>{selectedState.temperatureC} °C</strong></div>:null}{typeof selectedState.batteryLevel==='number'?<div className="telemetry-metric"><span>Battery</span><strong>{selectedState.batteryLevel}%</strong></div>:null}{typeof selectedState.uptimeHours==='number'?<div className="telemetry-metric"><span>Uptime</span><strong>{selectedState.uptimeHours} h</strong></div>:null}</div><div className="section-head"><div><h2>Telemetry history</h2><p>Bounded local history for this device</p></div><select aria-label="Chart metric" value={metric} onChange={event=>setMetric(event.target.value as Telemetry['metric'])}>{capabilities.filter(item=>item!=='online').map(item=><option value={item} key={item}>{metricLabels[item]}</option>)}</select></div><div className="chart-panel">{chartData.length?<ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="time" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}} unit={metricUnits[metric]} width={50}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>:<p className="empty">Start the simulation to collect {metricLabels[metric].toLowerCase()} samples.</p>}</div></>:<p className="empty">Select a device to inspect telemetry.</p>}</section>
    <section className="card"><div className="section-head"><div><h2>Device events</h2><p>Fault detection and recovery history</p></div></div><div className="event-feed">{selected?[...selected.faultHistory].sort((a,b)=>b.detectedAt.localeCompare(a.detectedAt)).map(fault=><div className={`event-item ${fault.recoveredAt?'':'critical'}`} key={fault.id}><i/><span><strong>{fault.title}</strong><small>{fault.recoveredAt?'Recovered':'Active fault'} · {fault.severity}</small></span><time>{new Date(fault.recoveredAt??fault.detectedAt).toLocaleString()}</time></div>):null}{selected&&!selected.faultHistory.length?<p className="empty">No simulated faults have been recorded for this device.</p>:null}</div></section>
   </div>
  </div>
 </>;
}
