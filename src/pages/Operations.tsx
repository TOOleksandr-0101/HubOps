import {useState, type FormEvent} from 'react';
import {Plus, Pencil, Trash2, CheckCircle2, Search, Boxes, TriangleAlert, Wrench, ShieldCheck} from 'lucide-react';
import {useWorkspace} from '../store/Workspace';
import {PageTitle, Badge, Modal, Field} from '../components/Shared';
import {Button} from '../components/ui/button';
import {removeOperation, upsertOperation, roomPath, type OperationKind, type OperationRecord} from '../utils/operations';
import type {Asset, Incident, MaintenanceRecord, SafetyInspection} from '../types';

const config = {
  assets: {title:'Asset management', description:'Track equipment, locations, categories, and operational condition.', singular:'asset', icon:Boxes},
  incidents: {title:'Incidents', description:'Record issues, set severity, and track resolution across your equipment.', singular:'incident', icon:TriangleAlert},
  maintenance: {title:'Maintenance', description:'Schedule service and record completed maintenance work.', singular:'maintenance record', icon:Wrench},
  inspections: {title:'HSE & safety', description:'Record room inspections, responsible inspectors, and inspection results.', singular:'inspection', icon:ShieldCheck},
};
export function Operations({kind}: {kind: OperationKind}) {
  const {data, update} = useWorkspace();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState<OperationRecord | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const c = config[kind];
  const Icon = c.icon;
  const assetName = (id: string) => data.assets.find(a => a.id === id)?.name ?? 'Unknown asset';
  const employeeName = (id: string) => data.employees.find(e => e.id === id)?.name ?? 'Unknown employee';
  const getStatus = (r: OperationRecord) => 'status' in r ? r.status : r.passed ? 'passed' : 'failed';
  const searchable = (r: OperationRecord) => {
    if ('category' in r) return r.name + ' ' + r.category + ' ' + roomPath(data, r.roomId);
    if ('severity' in r) return r.title + ' ' + r.severity + ' ' + assetName(r.assetId);
    if ('scheduledAt' in r) return assetName(r.assetId) + ' ' + r.scheduledAt;
    return roomPath(data, r.roomId) + ' ' + employeeName(r.inspectorId) + ' ' + r.date;
  };
  const allRecords: OperationRecord[] = data[kind];
  const records = allRecords.filter(r => searchable(r).toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || getStatus(r) === filter));
  const statuses = kind === 'assets' ? ['operational','warning','critical'] : kind === 'incidents' ? ['open','resolved'] : kind === 'maintenance' ? ['pending','completed'] : ['passed','failed'];
  function newRecord() {
    const id = crypto.randomUUID();
    const today = new Date().toLocaleDateString('en-CA');
    setError(''); setNotice('');
    if (kind === 'assets') setEditor({id, name:'', category:'Computing', roomId:data.rooms[0]?.id ?? '', status:'operational'});
    if (kind === 'incidents') setEditor({id, title:'', assetId:data.assets[0]?.id ?? '', severity:'medium', status:'open', createdAt:new Date().toISOString()});
    if (kind === 'maintenance') setEditor({id, assetId:data.assets[0]?.id ?? '', scheduledAt:today, status:'pending'});
    if (kind === 'inspections') setEditor({id, roomId:data.rooms[0]?.id ?? '', inspectorId:data.employees[0]?.id ?? '', date:today, passed:true});
  }
  function save(e: FormEvent) {
    e.preventDefault(); if (!editor) return;
    try {update(d => upsertOperation(d, kind, editor), `Saved ${c.singular}`); setEditor(null); setError(''); setNotice(`${c.singular[0].toUpperCase()+c.singular.slice(1)} saved.`);}
    catch (e) {setError((e as Error).message);}
  }
  function remove(record: OperationRecord) {
    if (!confirm(`Delete this ${c.singular}?`)) return;
    try {update(d => removeOperation(d, kind, record.id), `Deleted ${c.singular}`); setError(''); setNotice('Record deleted.');}
    catch (e) {setError((e as Error).message);}
  }
  function complete(record: OperationRecord) {
    try {
      const next = kind === 'incidents' ? {...record, status:'resolved'} as Incident : {...record, status:'completed'} as MaintenanceRecord;
      update(d => upsertOperation(d, kind, next), kind === 'incidents' ? 'Incident resolved' : 'Maintenance completed');
      setError(''); setNotice('Status updated.');
    } catch (e) {setError((e as Error).message);}
  }
  const missing = kind === 'assets' ? !data.rooms.length : kind === 'inspections' ? !data.rooms.length || !data.employees.length : !data.assets.length;
  return <>
    <PageTitle title={c.title} description={c.description} action={<Button onClick={newRecord} disabled={missing}><Plus size={16}/> Add {c.singular}</Button>}/>
    {error && !editor && <div className="alert" role="alert">{error}</div>}
    {notice && <div role="status" className="notice"><CheckCircle2 size={16}/>{notice}</div>}
    {missing && <div className="alert">{kind === 'assets' || kind === 'inspections' ? 'Create a room in Facilities before adding records.' : 'Add equipment in Assets before creating records.'}</div>}
    <div className="module-summary">
      <section className="card"><Icon size={20}/><strong>{allRecords.length}</strong><span>Total records</span></section>
      {statuses.map(status => <section className="card" key={status}><strong>{allRecords.filter(r => getStatus(r) === status).length}</strong><Badge>{status}</Badge></section>)}
    </div>
    <div className="toolbar"><div className="module-search"><Search size={16}/><input aria-label={`Search ${c.title}`} placeholder={`Search ${c.title.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)}/></div><select aria-label="Filter records by status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><span>{records.length} of {allRecords.length} records</span></div>
    <section className="card"><div className="table-scroll"><table><thead><tr>
      {kind === 'assets' ? <><th>Equipment</th><th>Category</th><th>Location</th><th>Condition</th></> : kind === 'incidents' ? <><th>Incident</th><th>Equipment</th><th>Severity</th><th>Status</th></> : kind === 'maintenance' ? <><th>Equipment</th><th>Scheduled date</th><th>Status</th></> : <><th>Location</th><th>Inspector</th><th>Date</th><th>Result</th></>}
      <th>Actions</th></tr></thead><tbody>{records.map(r => <tr key={r.id}>
        {'category' in r ? <><td><strong>{r.name}</strong></td><td>{r.category}</td><td>{roomPath(data,r.roomId)}</td><td><Badge>{r.status}</Badge></td></> : 'severity' in r ? <><td><strong>{r.title}</strong><small className="record-meta">{new Date(r.createdAt).toLocaleDateString('en-GB')}</small></td><td>{assetName(r.assetId)}</td><td><Badge>{r.severity}</Badge></td><td><Badge>{r.status}</Badge></td></> : 'scheduledAt' in r ? <><td><strong>{assetName(r.assetId)}</strong></td><td>{r.scheduledAt}</td><td><Badge>{r.status}</Badge></td></> : <><td>{roomPath(data,r.roomId)}</td><td>{employeeName(r.inspectorId)}</td><td>{r.date}</td><td><Badge>{r.passed ? 'passed':'failed'}</Badge></td></>}
        <td><div className="inline-actions">{((kind === 'incidents' && getStatus(r) === 'open') || (kind === 'maintenance' && getStatus(r) === 'pending')) && <Button variant="outline" onClick={() => complete(r)}>{kind === 'incidents' ? 'Resolve':'Complete'}</Button>}<Button variant="ghost" aria-label={`Edit ${searchable(r)}`} onClick={() => {setError(''); setEditor({...r});}}><Pencil size={15}/></Button><Button variant="ghost" aria-label={`Delete ${searchable(r)}`} onClick={() => remove(r)}><Trash2 size={15}/></Button></div></td>
      </tr>)}</tbody></table></div>{!records.length && <div className="empty"><Icon size={28} style={{margin:'0 auto 12px'}}/><h3>{allRecords.length ? 'No matching records':'No records yet'}</h3><p>{allRecords.length ? 'Try another search or status filter.' : `Add your first ${c.singular} to get started.`}</p></div>}</section>
    {editor && <Modal title={`${allRecords.some(r => r.id === editor.id) ? 'Edit':'Add'} ${c.singular}`} onClose={() => setEditor(null)}><form onSubmit={save}>
      {error && <div className="alert" role="alert">{error}</div>}
      {'category' in editor && <><Field label="Equipment name"><input required maxLength={120} pattern=".*\S.*" value={editor.name} onChange={e => setEditor({...editor,name:e.target.value})}/></Field><Field label="Category"><input required maxLength={60} pattern=".*\S.*" value={editor.category} onChange={e => setEditor({...editor,category:e.target.value})}/></Field></>}
      {'title' in editor && <Field label="Incident title"><input required maxLength={200} pattern=".*\S.*" value={editor.title} onChange={e => setEditor({...editor,title:e.target.value})}/></Field>}
      {'roomId' in editor && <Field label="Room"><select required value={editor.roomId} onChange={e => setEditor({...editor,roomId:e.target.value})}>{data.rooms.map(r => <option key={r.id} value={r.id}>{roomPath(data,r.id)}</option>)}</select></Field>}
      {'assetId' in editor && <Field label="Equipment"><select required value={editor.assetId} onChange={e => setEditor({...editor,assetId:e.target.value})}>{data.assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
      {'severity' in editor && <Field label="Severity"><select value={editor.severity} onChange={e => setEditor({...editor,severity:e.target.value as Incident['severity']})}>{['low','medium','critical'].map(s => <option key={s}>{s}</option>)}</select></Field>}
      {'scheduledAt' in editor && <Field label="Scheduled date"><input type="date" required value={editor.scheduledAt} onChange={e => setEditor({...editor,scheduledAt:e.target.value})}/></Field>}
      {'status' in editor && <Field label="Status"><select value={editor.status} onChange={e => setEditor({...editor,status:e.target.value} as OperationRecord)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></Field>}
      {'inspectorId' in editor && <><Field label="Inspector"><select required value={editor.inspectorId} onChange={e => setEditor({...editor,inspectorId:e.target.value})}>{data.employees.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field><Field label="Inspection date"><input type="date" required value={editor.date} onChange={e => setEditor({...editor,date:e.target.value})}/></Field><Field label="Result"><select value={editor.passed ? 'passed':'failed'} onChange={e => setEditor({...editor,passed:e.target.value === 'passed'})}><option value="passed">passed</option><option value="failed">failed</option></select></Field></>}
      <div className="form-actions"><Button type="button" variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button>Save {c.singular}</Button></div>
    </form></Modal>}
  </>;
}
