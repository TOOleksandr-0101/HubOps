import type {Data} from '../types';
export function removeBuilding(data:Data,id:string):Data {
 const floors=new Set(data.floors.filter(f=>f.buildingId===id).map(f=>f.id));
 const rooms=new Set(data.rooms.filter(r=>floors.has(r.floorId)).map(r=>r.id));
 if(data.assets.some(a=>rooms.has(a.roomId))) throw new Error('Move linked equipment before deleting this building.');
 return {...data,buildings:data.buildings.filter(b=>b.id!==id),floors:data.floors.filter(f=>!floors.has(f.id)),rooms:data.rooms.filter(r=>!rooms.has(r.id)),inspections:data.inspections.filter(s=>!rooms.has(s.roomId))};
}
export function metrics(d:Data){return {assets:d.assets.length,operational:d.assets.filter(a=>a.status==='operational').length,incidents:d.incidents.filter(i=>i.status==='open').length,critical:d.incidents.filter(i=>i.status==='open'&&i.severity==='critical').length,maintenance:d.maintenance.filter(m=>m.status==='pending').length,tasks:d.tasks.filter(t=>t.status!=='done').length};}
