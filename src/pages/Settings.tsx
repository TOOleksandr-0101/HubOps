import {useRef,useState} from 'react';
import {Bell,Download,RotateCcw,Upload} from 'lucide-react';
import {PageTitle,Badge} from '../components/Shared';
import {Button} from '../components/ui/button';
import {useWorkspace} from '../store/Workspace';
import {createSeed} from '../data/seed';
import {CURRENT_SCHEMA_VERSION,parseWorkspace,serializeWorkspace} from '../services/storage';

export function Settings(){
 const {data,update,replace}=useWorkspace();
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const inputRef=useRef<HTMLInputElement>(null);
 function download(name:string,content:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url);}
 function exportData(){download(`hubops-workspace-v${CURRENT_SCHEMA_VERSION}-${new Date().toISOString().slice(0,10)}.json`,serializeWorkspace(data),'application/json');setMessage('Validated workspace backup exported.');setError('');}
 async function importData(event:React.ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>8_000_000){setError('Backup is larger than the 8 MB import limit.');return;}
  try{const next=parseWorkspace(await file.text());if(!confirm(`Import ${next.assets.length} assets, ${next.incidents.length} incidents, and the rest of this validated workspace? Current local data will be replaced.`))return;replace(next,`Imported validated workspace backup: ${file.name}`);setMessage(`Imported ${file.name}. Schema and entity relationships were validated.`);setError('');}catch(cause){setError((cause as Error).message);setMessage('');}
 }
 function reset(){if(!confirm('Replace all local changes with the fictional demo dataset? Export a backup first if you need these changes.'))return;try{replace(createSeed(),'Demo data restored');setMessage('Demo workspace restored.');setError('');}catch(cause){setError((cause as Error).message);}}
 function markRead(){try{update(current=>({...current,notifications:current.notifications.map(item=>({...item,read:true}))}),'Marked all notifications as read');setMessage('Notifications marked as read.');setError('');}catch(cause){setError((cause as Error).message);}}
 return <>
  <PageTitle title="Settings" description="Workspace preferences, validated backups, and local audit history."/>
  {message?<div role="status" className="alert">{message}</div>:null}{error?<div role="alert" className="alert">{error}</div>:null}
  <div className="split-panel">
   <section className="card settings-card"><h2>Workspace</h2><p>Astana campus · Fictional technology park</p><div className="inline-actions"><Badge>Engineering demo · v0.2.0</Badge><Badge>Schema v{CURRENT_SCHEMA_VERSION}</Badge></div><hr/><h2>Appearance</h2><p>Use the sun or moon button in the top navigation to switch themes. Your preference is saved in this browser.</p><hr/><h2>Data & backups</h2><p>Changes are stored only in this browser. Exports include a versioned envelope; imports are deeply validated, including entity structure and relationships, before they can replace the workspace.</p><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={importData}/><div className="inline-actions"><Button variant="outline" onClick={exportData}><Download size={16}/> Export JSON</Button><Button variant="outline" onClick={()=>inputRef.current?.click()}><Upload size={16}/> Import JSON</Button><Button variant="outline" onClick={reset}><RotateCcw size={16}/> Reset demo data</Button></div><hr/><h2>Deployment & security scope</h2><p>This is a frontend demonstration with local storage and simulated telemetry. It has no authentication, authorization, server database, collaboration sync, or real hardware connection. Do not enter confidential, production, or personal data.</p></section>
   <div className="detail-stack"><section className="card"><div className="section-head"><div><h2>Notification center</h2><p>Actionable local events from engineering workflows</p></div><Badge>{data.notifications.filter(item=>!item.read).length} unread</Badge></div><div className="event-feed">{data.notifications.slice(0,8).map(item=><div className={`event-item ${item.level}`} key={item.id}><i/><span><strong>{item.title}</strong><small>{item.message}</small></span><time>{new Date(item.createdAt).toLocaleString()}</time></div>)}{!data.notifications.length?<p className="empty">No notifications recorded.</p>:null}</div><Button variant="outline" onClick={markRead} disabled={!data.notifications.some(item=>!item.read)}><Bell size={14}/> Mark all read</Button></section><section className="card"><div className="section-head"><div><h2>Activity log</h2><p>Most recent persisted workspace actions</p></div><Badge>{data.activity.length}</Badge></div><div className="event-feed">{data.activity.slice(0,20).map(item=><div className="event-item" key={item.id}><i/><span>{item.message}</span><time>{new Date(item.timestamp).toLocaleString()}</time></div>)}</div></section></div>
  </div>
 </>;
}
