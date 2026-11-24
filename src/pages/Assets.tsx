import {useCallback,useMemo,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Boxes,Download,Grid2X2,List,Plus,QrCode,Search,Trash2,Wrench} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {Badge,Field,Modal,PageTitle} from '../components/Shared';
import {Button} from '../components/ui/button';
import {useWorkspace} from '../store/Workspace';
import type {Asset,AssetCategory,Status} from '../types';

const CATEGORIES:AssetCategory[]=['CCTV Cameras','Access Control Systems','Electronic Locks','Payment Terminals','Smart Refrigerators','Computers and Workstations','Network Equipment','HVAC Systems','IoT Devices','Fire Safety Equipment'];
const STATUS_ORDER:Record<Status,number>={critical:0,warning:1,operational:2};

function csvCell(value:unknown){return `"${String(value??'').replaceAll('"','""')}"`;}
function today(){return new Date().toISOString().slice(0,10);}
function futureDate(days:number){const date=new Date();date.setDate(date.getDate()+days);return date.toISOString().slice(0,10);}

function newAsset(employeeId:string,roomId:string):Asset{
 return {id:`AST-${crypto.randomUUID().slice(0,8).toUpperCase()}`,name:'',roomId,category:'CCTV Cameras',manufacturer:'',model:'',serialNumber:'',assigneeId:employeeId,status:'operational',installedAt:today(),lastInspectionAt:today(),nextMaintenanceAt:futureDate(90),faultHistory:[],notes:''};
}

export function Assets(){
 const {data,update}=useWorkspace();
 const [params,setParams]=useSearchParams();
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState<AssetCategory|'all'>('all');
 const [status,setStatus]=useState<Status|'all'>('all');
 const [sort,setSort]=useState<'name'|'status'|'maintenance'>('name');
 const [view,setView]=useState<'cards'|'table'>('cards');
 const [editor,setEditor]=useState<Asset|null>(null);
 const [error,setError]=useState('');
 const selected=data.assets.find(asset=>asset.id===params.get('asset'));

 const rooms=useMemo(()=>new Map(data.rooms.map(room=>[room.id,room])),[data.rooms]);
 const floors=useMemo(()=>new Map(data.floors.map(floor=>[floor.id,floor])),[data.floors]);
 const buildings=useMemo(()=>new Map(data.buildings.map(building=>[building.id,building])),[data.buildings]);
 const employees=useMemo(()=>new Map(data.employees.map(employee=>[employee.id,employee])),[data.employees]);
 const location=useCallback((asset:Asset)=>{const room=rooms.get(asset.roomId),floor=room?floors.get(room.floorId):undefined,building=floor?buildings.get(floor.buildingId):undefined;return [building?.name,floor?.name,room?.name].filter(Boolean).join(' · ')||'Unknown location';},[rooms,floors,buildings]);

 const filtered=useMemo(()=>[...data.assets.filter(asset=>{
  const haystack=[asset.id,asset.name,asset.manufacturer,asset.model,asset.serialNumber,location(asset),employees.get(asset.assigneeId)?.name].join(' ').toLowerCase();
  return haystack.includes(search.trim().toLowerCase())&&(category==='all'||asset.category===category)&&(status==='all'||asset.status===status);
 })].sort((a,b)=>sort==='status'?STATUS_ORDER[a.status]-STATUS_ORDER[b.status]:sort==='maintenance'?a.nextMaintenanceAt.localeCompare(b.nextMaintenanceAt):a.name.localeCompare(b.name)),[data.assets,search,category,status,sort,location,employees]);

 const counts={operational:data.assets.filter(asset=>asset.status==='operational').length,attention:data.assets.filter(asset=>asset.status!=='operational').length,due:data.assets.filter(asset=>asset.nextMaintenanceAt<futureDate(30)).length,categories:new Set(data.assets.map(asset=>asset.category)).size};

 function saveAsset(event:React.FormEvent){
  event.preventDefault();
  if(!editor)return;
  const value={...editor,id:editor.id.trim(),name:editor.name.trim(),manufacturer:editor.manufacturer.trim(),model:editor.model.trim(),serialNumber:editor.serialNumber.trim(),notes:editor.notes.trim()};
  if(!value.name||!value.id||!value.serialNumber){setError('Asset ID, name, and serial number are required.');return;}
  const original=data.assets.find(asset=>params.get('edit')===asset.id);
  if(data.assets.some(asset=>asset.id===value.id&&asset.id!==original?.id)){setError('Asset ID must be unique.');return;}
  if(data.assets.some(asset=>asset.serialNumber.toLowerCase()===value.serialNumber.toLowerCase()&&asset.id!==original?.id)){setError('Serial number must be unique.');return;}
  try{
   update(current=>({...current,assets:original?current.assets.map(asset=>asset.id===original.id?value:asset):[...current.assets,value]}),`${original?'Updated':'Created'} asset: ${value.name}`);
   setEditor(null);setParams(previous=>{previous.delete('edit');return previous;});setError('');
  }catch(cause){setError((cause as Error).message);}
 }

 function edit(asset:Asset){setEditor(structuredClone(asset));setParams(previous=>{previous.set('edit',asset.id);return previous;});setError('');}
 function remove(asset:Asset){
  const incidents=data.incidents.filter(item=>item.assetId===asset.id).length;
  const maintenance=data.maintenance.filter(item=>item.assetId===asset.id).length;
  if(incidents||maintenance){setError(`Cannot delete ${asset.name}: ${incidents} incident(s) and ${maintenance} maintenance record(s) preserve its audit history.`);return;}
  if(!confirm(`Delete ${asset.name}? Telemetry for this asset will also be removed.`))return;
  try{update(current=>({...current,assets:current.assets.filter(item=>item.id!==asset.id),telemetry:current.telemetry.filter(item=>item.assetId!==asset.id),deviceStates:current.deviceStates.filter(item=>item.assetId!==asset.id)}),`Deleted asset: ${asset.name}`);setParams({});setError('');}catch(cause){setError((cause as Error).message);}
 }
 function exportCsv(){
  const rows=[['Asset ID','Name','Category','Manufacturer','Model','Serial number','Location','Assignee','Status','Installed','Last inspection','Next maintenance','Notes'],...filtered.map(asset=>[asset.id,asset.name,asset.category,asset.manufacturer,asset.model,asset.serialNumber,location(asset),employees.get(asset.assigneeId)?.name??'',asset.status,asset.installedAt,asset.lastInspectionAt,asset.nextMaintenanceAt,asset.notes])];
  const blob=new Blob([rows.map(row=>row.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`hubops-assets-${today()}.csv`;link.click();URL.revokeObjectURL(url);
 }
 function openAsset(asset:Asset){setParams({asset:asset.id});}

 return <>
  <PageTitle eyebrow="ENGINEERING" title="Asset management" description="A traceable inventory of physical equipment, ownership, condition, and service history." action={<Button onClick={()=>setEditor(newAsset(data.employees[0]?.id??'',data.rooms[0]?.id??''))}><Plus size={16}/> Add asset</Button>}/>
  {error?<div className="alert" role="alert">{error}</div>:null}
  <div className="summary-grid">
   <section className="card stat"><div className="stat-label">Registered assets<Boxes size={18}/></div><div className="stat-value">{data.assets.length}</div><small>Across {counts.categories} categories</small></section>
   <section className="card stat"><div className="stat-label">Operational</div><div className="stat-value">{counts.operational}</div><small>{data.assets.length?Math.round(counts.operational/data.assets.length*100):0}% of inventory</small></section>
   <section className="card stat"><div className="stat-label">Needs attention</div><div className="stat-value">{counts.attention}</div><small>Warning or critical status</small></section>
   <section className="card stat"><div className="stat-label">Service due soon<Wrench size={18}/></div><div className="stat-value">{counts.due}</div><small>Within the next 30 days</small></section>
  </div>
  <div className="toolbar compact">
   <div className="search grow"><Search size={16}/><input aria-label="Search assets" placeholder="Search ID, equipment, serial, location…" value={search} onChange={event=>setSearch(event.target.value)}/></div>
   <select aria-label="Filter asset category" value={category} onChange={event=>setCategory(event.target.value as AssetCategory|'all')}><option value="all">All categories</option>{CATEGORIES.map(item=><option key={item}>{item}</option>)}</select>
   <select aria-label="Filter asset status" value={status} onChange={event=>setStatus(event.target.value as Status|'all')}><option value="all">All conditions</option><option value="operational">Operational</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
   <select aria-label="Sort assets" value={sort} onChange={event=>setSort(event.target.value as typeof sort)}><option value="name">Sort: Name</option><option value="status">Sort: Condition</option><option value="maintenance">Sort: Next service</option></select>
   <div className="button-group"><div className="view-switch" aria-label="Asset view"><Button variant="ghost" className={view==='cards'?'is-active':''} aria-pressed={view==='cards'} onClick={()=>setView('cards')}><Grid2X2 size={14}/></Button><Button variant="ghost" className={view==='table'?'is-active':''} aria-pressed={view==='table'} onClick={()=>setView('table')}><List size={14}/></Button></div><Button variant="outline" onClick={exportCsv}><Download size={14}/> CSV</Button></div>
  </div>
  {view==='cards'?<div className="asset-grid">{filtered.map(asset=><article className="card asset-card" key={asset.id}><div className="section-head"><div><span className="asset-id">{asset.id}</span><h2>{asset.name}</h2></div><Badge tone={asset.status==='critical'?'danger':asset.status==='warning'?'warning':'success'}>{asset.status}</Badge></div><p>{asset.category}</p><div className="asset-meta"><span>Location<strong>{location(asset)}</strong></span><span>Owner<strong>{employees.get(asset.assigneeId)?.name??'Unassigned'}</strong></span><span>Model<strong>{asset.manufacturer} {asset.model}</strong></span><span>Next service<strong>{asset.nextMaintenanceAt}</strong></span></div><div className="inline-actions"><Button variant="outline" onClick={()=>openAsset(asset)}>View record</Button><Button variant="ghost" onClick={()=>edit(asset)}>Edit</Button></div></article>)}</div>:<section className="card"><div className="table-scroll"><table aria-label="Equipment inventory"><thead><tr><th scope="col">Asset</th><th scope="col">Category</th><th scope="col">Location</th><th scope="col">Owner</th><th scope="col">Condition</th><th scope="col">Next service</th><th scope="col">Actions</th></tr></thead><tbody>{filtered.map(asset=><tr key={asset.id}><td><strong>{asset.name}</strong><br/><span className="asset-id">{asset.id}</span></td><td>{asset.category}</td><td>{location(asset)}</td><td>{employees.get(asset.assigneeId)?.name??'Unassigned'}</td><td><Badge tone={asset.status==='critical'?'danger':asset.status==='warning'?'warning':'success'}>{asset.status}</Badge></td><td>{asset.nextMaintenanceAt}</td><td><Button variant="ghost" onClick={()=>openAsset(asset)}>View</Button><Button variant="ghost" onClick={()=>edit(asset)}>Edit</Button></td></tr>)}</tbody></table></div></section>}
  {!filtered.length?<p className="empty">No equipment matches these filters.</p>:null}

  {selected?<Modal title={selected.name} onClose={()=>setParams({})}><div className="detail-stack"><div><Badge tone={selected.status==='critical'?'danger':selected.status==='warning'?'warning':'success'}>{selected.status}</Badge><p className="asset-id">{selected.id}</p></div><dl className="definition-grid"><div><dt>Category</dt><dd>{selected.category}</dd></div><div><dt>Location</dt><dd>{location(selected)}</dd></div><div><dt>Manufacturer / model</dt><dd>{selected.manufacturer} {selected.model}</dd></div><div><dt>Serial number</dt><dd>{selected.serialNumber}</dd></div><div><dt>Responsible employee</dt><dd>{employees.get(selected.assigneeId)?.name??'Unassigned'}</dd></div><div><dt>Installation date</dt><dd>{selected.installedAt}</dd></div><div><dt>Last inspection</dt><dd>{selected.lastInspectionAt}</dd></div><div><dt>Next maintenance</dt><dd>{selected.nextMaintenanceAt}</dd></div></dl><div className="qr-panel"><QrCode size={18}/><QRCodeSVG value={`${window.location.origin}${window.location.pathname}#/assets?asset=${encodeURIComponent(selected.id)}`} title={`QR link for ${selected.name}`}/><p>QR opens this asset record in the HubOps demonstration.</p></div><section><h3>Linked records</h3><p>{data.incidents.filter(item=>item.assetId===selected.id).length} incidents · {data.maintenance.filter(item=>item.assetId===selected.id).length} maintenance records · {selected.faultHistory.length} recorded faults</p></section>{selected.notes?<section><h3>Notes</h3><p>{selected.notes}</p></section>:null}<div className="form-actions"><Button variant="outline" onClick={()=>edit(selected)}>Edit asset</Button><Button variant="ghost" onClick={()=>remove(selected)}><Trash2 size={14}/> Delete</Button></div></div></Modal>:null}
  {editor?<Modal title={data.assets.some(asset=>asset.id===params.get('edit'))?'Edit asset':'Create asset'} onClose={()=>{setEditor(null);setParams(previous=>{previous.delete('edit');return previous;});}}><form onSubmit={saveAsset}><div className="form-grid"><Field label="Asset ID"><input required maxLength={40} value={editor.id} onChange={event=>setEditor({...editor,id:event.target.value})}/></Field><Field label="Name"><input required maxLength={120} value={editor.name} onChange={event=>setEditor({...editor,name:event.target.value})}/></Field></div><Field label="Category"><select value={editor.category} onChange={event=>setEditor({...editor,category:event.target.value as AssetCategory})}>{CATEGORIES.map(item=><option key={item}>{item}</option>)}</select></Field><div className="form-grid"><Field label="Manufacturer"><input required value={editor.manufacturer} onChange={event=>setEditor({...editor,manufacturer:event.target.value})}/></Field><Field label="Model"><input required value={editor.model} onChange={event=>setEditor({...editor,model:event.target.value})}/></Field></div><Field label="Serial number"><input required value={editor.serialNumber} onChange={event=>setEditor({...editor,serialNumber:event.target.value})}/></Field><Field label="Room"><select required value={editor.roomId} onChange={event=>setEditor({...editor,roomId:event.target.value})}>{data.rooms.map(room=><option value={room.id} key={room.id}>{location({...editor,roomId:room.id})}</option>)}</select></Field><Field label="Responsible employee"><select required value={editor.assigneeId} onChange={event=>setEditor({...editor,assigneeId:event.target.value})}>{data.employees.map(employee=><option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></Field><div className="form-grid"><Field label="Technical status"><select value={editor.status} onChange={event=>setEditor({...editor,status:event.target.value as Status})}><option value="operational">Operational</option><option value="warning">Warning</option><option value="critical">Critical</option></select></Field><Field label="Installed"><input type="date" required value={editor.installedAt} onChange={event=>setEditor({...editor,installedAt:event.target.value})}/></Field><Field label="Last inspection"><input type="date" required value={editor.lastInspectionAt} onChange={event=>setEditor({...editor,lastInspectionAt:event.target.value})}/></Field><Field label="Next maintenance"><input type="date" required value={editor.nextMaintenanceAt} onChange={event=>setEditor({...editor,nextMaintenanceAt:event.target.value})}/></Field></div><Field label="Notes"><textarea value={editor.notes} onChange={event=>setEditor({...editor,notes:event.target.value})}/></Field>{error?<span className="error-text">{error}</span>:null}<div className="form-actions"><Button type="button" variant="outline" onClick={()=>setEditor(null)}>Cancel</Button><Button>Save asset</Button></div></form></Modal>:null}
 </>;
}
