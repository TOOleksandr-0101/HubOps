import {Download} from 'lucide-react';
import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts';
import {useWorkspace} from '../store/Workspace';
import {PageTitle, Badge} from '../components/Shared';
import {Button} from '../components/ui/button';
import {roomPath, toCsv} from '../utils/operations';

export function Analytics() {
  const {data} = useWorkspace();
  const percent = (part:number,total:number) => total ? Math.round(part/total*100) : 0;
  const operational = data.assets.filter(a=>a.status === 'operational').length;
  const done = data.tasks.filter(t=>t.status === 'done').length;
  const resolved = data.incidents.filter(i=>i.status === 'resolved').length;
  const passed = data.inspections.filter(i=>i.passed).length;
  const severity = ['low','medium','critical'].map(name=>({name,open:data.incidents.filter(i=>i.severity===name&&i.status==='open').length,resolved:data.incidents.filter(i=>i.severity===name&&i.status==='resolved').length}));
  const workload = data.employees.map(e=>({name:e.name.split(' ')[0],open:data.tasks.filter(t=>t.assigneeId===e.id&&t.status!=='done').length,done:data.tasks.filter(t=>t.assigneeId===e.id&&t.status==='done').length}));
  const today = new Date().toLocaleDateString('en-CA');
  const overdue = data.tasks.filter(t=>t.status!=='done'&&t.deadline<today);
  function exportAssets() {
    const csv = toCsv([['Equipment','Category','Location','Status'],...data.assets.map(a=>[a.name,a.category,roomPath(data,a.roomId),a.status])]);
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='hubops-assets.csv';link.click();URL.revokeObjectURL(url);
  }
  return <><PageTitle title="Analytics" description="Reports calculated from the current workspace records." action={<Button variant="outline" onClick={exportAssets}><Download size={16}/> Export asset report</Button>}/>
    <div className="module-summary">{[['Operational equipment',percent(operational,data.assets.length),data.assets.length],['Completed tasks',percent(done,data.tasks.length),data.tasks.length],['Resolved incidents',percent(resolved,data.incidents.length),data.incidents.length],['Passed inspections',percent(passed,data.inspections.length),data.inspections.length]].map(([name,value,total])=><section className="card" key={String(name)}><span>{name}</span><strong>{total ? `${value}%`:'—'}</strong><small>{total} total records</small></section>)}</div>
    <div className="chart-grid"><section className="card"><div className="section-head"><div><h2>Incidents by severity</h2><p>Open and resolved records</p></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={severity}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="open" fill="#d99269"/><Bar dataKey="resolved" fill="#0f766e"/></BarChart></ResponsiveContainer></section><section className="card"><div className="section-head"><div><h2>Team workload</h2><p>Open and completed tasks per employee</p></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={workload}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="open" fill="#5ba9a3"/><Bar dataKey="done" fill="#0f766e"/></BarChart></ResponsiveContainer></section></div>
    <section className="card"><div className="section-head"><div><h2>Overdue tasks</h2><p>Incomplete tasks with a deadline before today ({today})</p></div><Badge>{overdue.length} tasks</Badge></div>{overdue.length ? <div className="table-scroll"><table><thead><tr><th>Task</th><th>Assignee</th><th>Deadline</th><th>Priority</th></tr></thead><tbody>{overdue.map(t=><tr key={t.id}><td>{t.title}</td><td>{data.employees.find(e=>e.id===t.assigneeId)?.name??'Unassigned'}</td><td>{t.deadline}</td><td><Badge>{t.priority}</Badge></td></tr>)}</tbody></table></div> : <div className="empty"><h3>No overdue tasks</h3><p>All incomplete tasks have current or future deadlines.</p></div>}</section>
  </>;
}
