import {useMemo,useState} from 'react';
import {BarChart3,Download,Info,Printer} from 'lucide-react';
import {Bar,BarChart,CartesianGrid,Cell,Legend,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Badge,Field,PageTitle} from '../components/Shared';
import {Button} from '../components/ui/button';
import {useWorkspace} from '../store/Workspace';
import {calculateAnalytics} from '../utils/analytics';

const COLORS=['#0f766e','#5ba9a3','#d5a24b','#d07155','#78958d','#a4c7bf'];
function csv(value:unknown){return `"${String(value??'N/A').replaceAll('"','""')}"`;}
function display(value:number|null,suffix=''){return value===null?'N/A':`${value}${suffix}`;}

export function Analytics(){
 const {data}=useWorkspace();
 const [start,setStart]=useState('');
 const [end,setEnd]=useState('');
 const snapshot=useMemo(()=>calculateAnalytics(data,{start:start||undefined,end:end?`${end}T23:59:59.999`:undefined}),[data,start,end]);
 const kpis=[
  ['Total assets',snapshot.totalAssets,'Registered inventory'],
  ['Operational assets',snapshot.operationalAssets,'Current technical status'],
  ['Equipment availability',display(snapshot.equipmentAvailabilityPercent,'%'),'Current online share'],
  ['Historical uptime',display(snapshot.historicalUptimePercent,'%'),'Recorded online samples only'],
  ['Active incidents',snapshot.activeIncidents,'Open + in progress'],
  ['Critical incidents',snapshot.criticalIncidents,'Active critical priority'],
  ['Mean time to repair',display(snapshot.meanTimeToRepairHours,' h'),'Resolved records in period'],
  ['Resolution rate',display(snapshot.incidentResolutionRatePercent,'%'),'Resolved / incidents in period'],
  ['Maintenance compliance',display(snapshot.maintenanceCompliancePercent,'%'),'Completed records due by today'],
  ['Overdue maintenance',snapshot.overdueMaintenance,'Incomplete past due'],
  ['HSE compliance',display(snapshot.hseCompliancePercent,'%'),'Passed / completed inspections'],
  ['Open tasks',snapshot.openTasks,'Team tasks not done'],
 ] as const;
 function exportReport(){
  const metricRows=kpis.map(([label,value,note])=>['KPI',label,value,note]);
  const buildingRows=snapshot.buildingStats.map(item=>['Building',item.name,item.assets,item.operational,item.activeIncidents]);
  const workloadRows=snapshot.employeeWorkload.map(item=>['Employee workload',item.name,item.openItems]);
  const rows=[['Section','Metric','Value','Detail','Extra'],...metricRows,...buildingRows,...workloadRows];
  const blob=new Blob([rows.map(row=>row.map(csv).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`hubops-analytics-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url);
 }
 return <>
  <PageTitle eyebrow="REPORTING" title="Analytics & reports" description="Operational indicators calculated from the shared HubOps workspace — never from hard-coded KPI values." action={<div className="inline-actions"><Button variant="outline" onClick={exportReport}><Download size={15}/> Export CSV</Button><Button onClick={()=>window.print()}><Printer size={15}/> Print report</Button></div>}/>
  <p className="print-only">HubOps operational report · generated {new Date().toLocaleString()}</p>
  <div className="toolbar compact"><Field label="Period start"><input type="date" value={start} onChange={event=>setStart(event.target.value)}/></Field><Field label="Period end"><input type="date" min={start} value={end} onChange={event=>setEnd(event.target.value)}/></Field>{start||end?<Button variant="ghost" onClick={()=>{setStart('');setEnd('');}}>Clear period</Button>:null}<span className="filter-count">Incident and historical KPIs respect this period</span></div>
  <div className="stats-grid">{kpis.map(([label,value,note])=><section className="card stat" key={label}><div className="stat-label">{label}{label==='Historical uptime'?<Info size={15}/>:null}</div><div className={value==='N/A'?'stat-value metric-value-na':'stat-value'}>{value}</div><small>{note}</small></section>)}</div>
  <div className="engineering-notice"><BarChart3 size={20}/><div><strong>Metric interpretation</strong><p>Equipment availability is the current online share. Historical uptime is calculated only from captured online telemetry samples; it remains N/A until simulation history exists.</p></div></div>
  <div className="analytics-grid">
   <section className="card wide"><div className="section-head"><div><h2>Incident dynamics</h2><p>Created and resolved records by date in the selected period</p></div><Badge>{snapshot.incidentTrend.length} dates</Badge></div><div className="chart-panel">{snapshot.incidentTrend.length?<ResponsiveContainer width="100%" height="100%"><LineChart data={snapshot.incidentTrend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tick={{fontSize:9}}/><YAxis allowDecimals={false} tick={{fontSize:10}}/><Tooltip/><Legend/><Line type="monotone" dataKey="created" stroke="#d07155" strokeWidth={2}/><Line type="monotone" dataKey="resolved" stroke="#0f766e" strokeWidth={2}/></LineChart></ResponsiveContainer>:<p className="empty">No incident history exists for this period.</p>}</div></section>
   <section className="card"><div className="section-head"><div><h2>Faults by equipment category</h2><p>Incidents created in the selected period</p></div></div><div className="chart-panel"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.faultsByCategory} layout="vertical" margin={{left:45}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="category" width={145} tick={{fontSize:9}}/><Tooltip/><Bar dataKey="incidents" fill="#0f766e" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div></section>
   <section className="card"><div className="section-head"><div><h2>Campus by building</h2><p>Assets, operational condition, and active incidents</p></div></div><div className="chart-panel"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.buildingStats}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:9}} interval={0}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="operational" fill="#0f766e" radius={[4,4,0,0]}/><Bar dataKey="activeIncidents" fill="#d07155" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></section>
   <section className="card"><div className="section-head"><div><h2>Maintenance status</h2><p>Current maintenance record distribution</p></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height={235}><PieChart><Pie data={[{name:'Pending',value:snapshot.maintenanceStats.pending},{name:'In progress',value:snapshot.maintenanceStats.inProgress},{name:'Completed',value:snapshot.maintenanceStats.completed}]} dataKey="value" innerRadius={58} outerRadius={85}>{COLORS.slice(0,3).map(color=><Cell key={color} fill={color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="legend"><div><i style={{background:COLORS[0]}}/><span>Pending</span><strong>{snapshot.maintenanceStats.pending}</strong></div><div><i style={{background:COLORS[1]}}/><span>In progress</span><strong>{snapshot.maintenanceStats.inProgress}</strong></div><div><i style={{background:COLORS[2]}}/><span>Completed</span><strong>{snapshot.maintenanceStats.completed}</strong></div></div></div></section>
   <section className="card"><div className="section-head"><div><h2>HSE inspections</h2><p>Scheduled, in progress, completed, and passed</p></div></div><div className="chart-panel"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{name:'Scheduled',value:snapshot.hseStats.scheduled},{name:'In progress',value:snapshot.hseStats.inProgress},{name:'Completed',value:snapshot.hseStats.completed},{name:'Passed',value:snapshot.hseStats.passed}]}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" radius={[5,5,0,0]}>{COLORS.slice(0,4).map(color=><Cell key={color} fill={color}/>)}</Bar></BarChart></ResponsiveContainer></div></section>
   <section className="card"><div className="section-head"><div><h2>Employee workload</h2><p>Open tasks, incidents, maintenance, and corrective actions</p></div></div><div className="chart-panel"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.employeeWorkload.slice(0,8)} layout="vertical" margin={{left:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={100} tick={{fontSize:9}}/><Tooltip/><Bar dataKey="openItems" fill="#5ba9a3" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div></section>
   <section className="card"><div className="section-head"><div><h2>Most problematic equipment</h2><p>Ranked by active incidents and recorded fault history</p></div></div><div className="table-scroll"><table aria-label="Most problematic equipment"><thead><tr><th scope="col">Equipment</th><th scope="col">Active incidents</th><th scope="col">Recorded faults</th></tr></thead><tbody>{snapshot.problemAssets.map(item=><tr key={item.assetId}><td><strong>{item.name}</strong></td><td>{item.activeIncidents}</td><td>{item.recordedFaults}</td></tr>)}</tbody></table></div>{!snapshot.problemAssets.length?<p className="empty">No equipment has recorded fault history.</p>:null}</section>
  </div>
 </>;
}
