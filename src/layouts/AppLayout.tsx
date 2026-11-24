import {useEffect,useMemo,useRef,useState} from 'react';
import {NavLink,Outlet,Link} from 'react-router-dom';
import {LayoutDashboard,Boxes,TriangleAlert,Building2,Activity,Wrench,ShieldCheck,Users,ChartNoAxesCombined,Settings,PanelLeftClose,PanelLeftOpen,Search,Bell,Sun,Moon,Menu,ArrowUpRight} from 'lucide-react';
import {useWorkspace} from '../store/Workspace';
import {useTheme} from '../hooks/useTheme';
import {Button} from '../components/ui/button';

const nav=[['Overview','/',LayoutDashboard],['Assets','/assets',Boxes],['Incidents','/incidents',TriangleAlert],['Facilities','/facilities',Building2],['Hardware Monitoring','/monitoring',Activity],['Maintenance','/maintenance',Wrench],['HSE & Safety','/safety',ShieldCheck],['Team & Tasks','/team',Users],['Analytics','/analytics',ChartNoAxesCombined],['Settings','/settings',Settings]] as const;

type LooseRecord=Record<string,unknown>;
type SearchResult={key:string;name:string;kind:string;to:string};
type NotificationItem={key:string;message:string};

function asRecord(value:unknown):LooseRecord|undefined{
 return typeof value==='object'&&value!==null?value as LooseRecord:undefined;
}

function textField(value:unknown,...keys:string[]){
 const record=asRecord(value);
 if(!record)return '';
 for(const key of keys){
  const field=record[key];
  if(typeof field==='string'&&field.trim())return field.trim();
 }
 return '';
}

function records(value:unknown){
 return Array.isArray(value)?value.map(asRecord).filter((item):item is LooseRecord=>Boolean(item)):[];
}

function normalizedStatus(value:unknown){
 return typeof value==='string'?value.toLowerCase().replaceAll('_',' ').replaceAll('-',' '):'';
}

export function AppLayout(){
 const [collapsed,setCollapsed]=useState(false);
 const [mobile,setMobile]=useState(false);
 const [query,setQuery]=useState('');
 const [searchOpen,setSearchOpen]=useState(false);
 const [notifications,setNotifications]=useState(false);
 const searchRef=useRef<HTMLDivElement>(null);
 const notificationRef=useRef<HTMLDivElement>(null);
 const {data,warning}=useWorkspace();
 const {theme,toggle}=useTheme();

 const results=useMemo<SearchResult[]>(()=>{
  const assetNames=new Map(data.assets.map(asset=>[asset.id,asset.name]));
  const roomNames=new Map(data.rooms.map(room=>[room.id,room.name]));
  const base:SearchResult[]=[
   ...data.buildings.map(item=>({key:`building-${item.id}`,name:item.name,kind:'Building',to:`/facilities?building=${encodeURIComponent(item.id)}`})),
   ...data.employees.map(item=>({key:`employee-${item.id}`,name:item.name,kind:'Team member',to:`/team?employee=${encodeURIComponent(item.id)}`})),
   ...data.tasks.map(item=>({key:`task-${item.id}`,name:item.title,kind:'Task',to:`/team?task=${encodeURIComponent(item.id)}`})),
   ...data.assets.map(item=>({key:`asset-${item.id}`,name:item.name,kind:'Asset',to:`/assets?asset=${encodeURIComponent(item.id)}`})),
   ...data.incidents.map(item=>({key:`incident-${item.id}`,name:item.title,kind:'Incident',to:`/incidents?incident=${encodeURIComponent(item.id)}`})),
   ...data.maintenance.map(item=>({key:`maintenance-${item.id}`,name:`${assetNames.get(item.assetId)??'Equipment'} maintenance · ${item.scheduledAt}`,kind:'Maintenance',to:`/maintenance?record=${encodeURIComponent(item.id)}`})),
   ...data.inspections.map(item=>({key:`inspection-${item.id}`,name:`Safety inspection · ${roomNames.get(item.roomId)??item.date}`,kind:'HSE',to:`/safety?inspection=${encodeURIComponent(item.id)}`})),
  ];
  const looseData=data as unknown as LooseRecord;
  const dynamic=[
   ['risks','Risk'],
   ['hazards','Hazard'],
   ['safetyRisks','Risk'],
   ['correctiveActions','Corrective action'],
  ] as const;
  for(const [collection,kind] of dynamic){
   for(const item of records(looseData[collection])){
    const id=textField(item,'id');
    const name=textField(item,'title','name','hazard','description');
    if(id&&name)base.push({key:`${collection}-${id}`,name,kind,to:`/safety?record=${encodeURIComponent(id)}`});
   }
  }
  const needle=query.trim().toLowerCase();
  if(!needle)return [];
  return base.filter(item=>`${item.name} ${item.kind}`.toLowerCase().includes(needle)).slice(0,8);
 },[data,query]);

 const actionableNotifications=useMemo<NotificationItem[]>(()=>{
  const looseData=data as unknown as LooseRecord;
  const items:NotificationItem[]=[];
  for(const item of records(looseData.notifications)){
   const read=item.read===true||Boolean(item.readAt);
   const actionable=item.actionable!==false;
   const message=textField(item,'message','title','description');
   const id=textField(item,'id')||message;
   if(!read&&actionable&&message)items.push({key:`notification-${id}`,message});
  }
  for(const incident of data.incidents){
   const record=incident as unknown as LooseRecord;
   const status=normalizedStatus(record.status);
   const severity=normalizedStatus(record.priority??record.severity);
   if(!['resolved','closed'].includes(status)&&['critical','high'].includes(severity))items.push({key:`incident-${incident.id}`,message:`${severity==='critical'?'Critical':'High-priority'} incident: ${incident.title}`});
  }
  const today=Date.now();
  for(const maintenance of data.maintenance){
   const record=maintenance as unknown as LooseRecord;
   const status=normalizedStatus(record.status);
   const due=textField(record,'dueDate','scheduledAt');
   const dueTime=Date.parse(due);
   if(!['completed','cancelled'].includes(status)&&Number.isFinite(dueTime)&&dueTime<today){
    const asset=data.assets.find(item=>item.id===maintenance.assetId);
    items.push({key:`maintenance-${maintenance.id}`,message:`Overdue maintenance: ${asset?.name??'Equipment'} · ${due}`});
   }
  }
  return [...new Map(items.map(item=>[item.key,item])).values()].slice(0,8);
 },[data]);

 useEffect(()=>{
  if(!searchOpen&&!notifications&&!mobile)return;
  function onPointerDown(event:PointerEvent){
   const target=event.target;
   if(!(target instanceof Node))return;
   if(searchOpen&&!searchRef.current?.contains(target))setSearchOpen(false);
   if(notifications&&!notificationRef.current?.contains(target))setNotifications(false);
  }
  function onKeyDown(event:KeyboardEvent){
   if(event.key!=='Escape')return;
   setSearchOpen(false);
   setNotifications(false);
   setMobile(false);
  }
  document.addEventListener('pointerdown',onPointerDown);
  document.addEventListener('keydown',onKeyDown);
  return ()=>{
   document.removeEventListener('pointerdown',onPointerDown);
   document.removeEventListener('keydown',onKeyDown);
  };
 },[mobile,notifications,searchOpen]);

 const collapseLabel=collapsed?'Expand sidebar':'Collapse sidebar';
 const notificationCount=actionableNotifications.length;

 return <div className={'app '+(collapsed?'collapsed ':'')+(mobile?'mobile-open':'')}>
  <a className="skip-link" href="#main">Skip to content</a>
  <aside className="sidebar">
   <Link to="/" className="brand"><span className="brand-icon">H</span><span className="nav-label">HubOps<span className="brand-dot">.</span></span></Link>
   <div className="workspace-label nav-label">ASTANA TECH PARK <span>DEMO</span></div>
   <nav aria-label="Main navigation">{nav.map(([label,to,Icon])=><NavLink key={to} to={to} end={to==='/'} title={label} onClick={()=>setMobile(false)}><Icon size={19}/><span className="nav-label">{label}</span></NavLink>)}</nav>
   <div className="sidebar-bottom"><div className="system-state"><i/> <span className="nav-label">Local demo workspace</span></div><Button variant="ghost" onClick={()=>setCollapsed(value=>!value)} aria-label={collapseLabel} aria-expanded={!collapsed}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}<span className="nav-label">{collapseLabel}</span></Button></div>
  </aside>
  {mobile?<button className="sidebar-shade" aria-label="Close menu" onClick={()=>setMobile(false)}/>:null}
  <div className="content">
   <header className="topbar">
    <Button variant="ghost" className="mobile-menu" onClick={()=>setMobile(value=>!value)} aria-label={mobile?'Close navigation':'Open navigation'} aria-expanded={mobile}><Menu size={20}/></Button>
    <span className="breadcrumb">Workspace <span>/</span> <strong>Astana campus</strong></span>
    <div className="header-actions">
     <div className="search" ref={searchRef}><Search size={16}/><input aria-label="Search workspace" aria-autocomplete="list" aria-expanded={Boolean(query&&searchOpen)} aria-controls="workspace-search-results" placeholder="Search workspace…" value={query} onFocus={()=>setSearchOpen(true)} onChange={event=>{setQuery(event.target.value);setSearchOpen(true);}}/>{query&&searchOpen?<div className="search-results" id="workspace-search-results" aria-label="Workspace search results">{results.length?results.map(result=><Link key={result.key} to={result.to} onClick={()=>{setQuery('');setSearchOpen(false);}}><span>{result.name} · {result.kind}</span><ArrowUpRight size={14}/></Link>):<p>No matching records.</p>}</div>:null}</div>
     <Button variant="ghost" aria-label={`Switch to ${theme==='light'?'dark':'light'} theme`} onClick={toggle}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</Button>
     <div className="notification-wrap" ref={notificationRef}><Button variant="ghost" aria-label={notificationCount?`Notifications, ${notificationCount} actionable`:'Notifications, none actionable'} aria-expanded={notifications} aria-controls="workspace-notifications" onClick={()=>setNotifications(value=>!value)}><Bell size={18}/>{notificationCount?<span className="notification-dot"/>:null}</Button>{notifications?<div className="notification-panel" id="workspace-notifications"><h3>Actionable notifications</h3>{actionableNotifications.length?actionableNotifications.slice(0,5).map(item=><p key={item.key}>{item.message}</p>):<p>No actionable notifications.</p>}</div>:null}</div>
     <span className="avatar" aria-label="Operations workspace">OP</span>
    </div>
   </header>
   <main id="main" tabIndex={-1}>{warning?<div role="alert" className="alert">{warning}</div>:null}<Outlet/></main>
   <footer>HubOps · Engineering demonstration workspace <span>Fictional demonstration data · Local storage</span></footer>
  </div>
 </div>;
}
