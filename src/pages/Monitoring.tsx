import {useState} from 'react';
import {Activity, Plus} from 'lucide-react';
import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts';
import {useWorkspace} from '../store/Workspace';
import {PageTitle, Badge} from '../components/Shared';
import {Button} from '../components/ui/button';

export function Monitoring() {
  const {data, update} = useWorkspace();
  const [assetId,setAssetId] = useState(data.assets[0]?.id ?? '');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const samples = data.telemetry.filter(t => t.assetId === assetId && t.metric === 'temperature').sort((a,b) => a.timestamp.localeCompare(b.timestamp));
  const latest = samples.at(-1);
  function generate() {
    if (!data.assets.some(a => a.id === assetId)) return;
    const sample = {id:crypto.randomUUID(),assetId,timestamp:new Date().toISOString(),metric:'temperature',value:Math.round((22+Math.random()*20)*10)/10,unit:'°C'};
    try {update(d => ({...d,telemetry:[...d.telemetry,sample].slice(-2000)}),'Generated a simulated temperature sample');setError('');setMessage('Simulated sample saved. This is not a reading from real hardware.');}
    catch(e){setError((e as Error).message);}
  }
  return <><PageTitle title="Hardware monitoring" description="Explore equipment telemetry in the local demonstration workspace." action={<Badge>Simulation only</Badge>}/>
    <div className="alert"><strong>No hardware is connected.</strong> Samples are generated manually for demonstration and stored in this browser. Real monitoring requires an authenticated telemetry service.</div>
    {error && <div role="alert" className="alert">{error}</div>}{message && <div role="status" className="notice">{message}</div>}
    <div className="toolbar"><select aria-label="Select monitored asset" value={assetId} onChange={e=>setAssetId(e.target.value)}>{data.assets.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><Button disabled={!data.assets.length} onClick={generate}><Plus size={16}/> Generate sample</Button><span>{samples.length} temperature samples</span></div>
    <div className="module-summary"><section className="card"><Activity size={20}/><strong>{latest ? `${latest.value} °C`:'—'}</strong><span>Latest simulated temperature</span></section><section className="card"><strong>{samples.length}</strong><span>Saved samples for selected asset</span></section><section className="card"><strong>{latest ? new Date(latest.timestamp).toLocaleTimeString('en-GB'):'—'}</strong><span>Last sample time</span></section></div>
    <section className="card"><div className="section-head"><div><h2>Temperature history</h2><p>Latest 40 samples · simulated °C</p></div></div>{samples.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={samples.slice(-40).map(s=>({...s,time:new Date(s.timestamp).toLocaleTimeString('en-GB')}))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" tick={{fontSize:10}}/><YAxis unit="°C"/><Tooltip/><Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot/></LineChart></ResponsiveContainer> : <div className="empty"><h3>No telemetry yet</h3><p>Choose an asset and generate a simulated sample.</p></div>}</section>
    <section className="card detail-card"><h2>Recent samples</h2><div className="table-scroll"><table><thead><tr><th>Recorded at</th><th>Metric</th><th>Value</th><th>Source</th></tr></thead><tbody>{samples.slice(-10).reverse().map(s=><tr key={s.id}><td>{new Date(s.timestamp).toLocaleString('en-GB')}</td><td>{s.metric}</td><td>{s.value} {s.unit}</td><td><Badge>simulated</Badge></td></tr>)}</tbody></table></div></section>
  </>;
}
