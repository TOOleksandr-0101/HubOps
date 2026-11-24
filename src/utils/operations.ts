import type {Asset, Data, Incident, MaintenanceRecord, SafetyInspection} from '../types';

export type OperationKind = 'assets' | 'incidents' | 'maintenance' | 'inspections';
export type OperationRecord = Asset | Incident | MaintenanceRecord | SafetyInspection;
export function removeOperation(data: Data, kind: OperationKind, id: string): Data {
  if (kind === 'assets') {
    if (data.incidents.some(x => x.assetId === id) || data.maintenance.some(x => x.assetId === id) || data.telemetry.some(x => x.assetId === id)) {
      throw new Error('This asset has linked incidents, maintenance or telemetry. Keep the asset or remove its linked records first.');
    }
    return {...data, assets: data.assets.filter(x => x.id !== id)};
  }
  if (kind === 'incidents') return {...data, incidents: data.incidents.filter(x => x.id !== id)};
  if (kind === 'maintenance') return {...data, maintenance: data.maintenance.filter(x => x.id !== id)};
  return {...data, inspections: data.inspections.filter(x => x.id !== id)};
}
export function upsertOperation(data: Data, kind: OperationKind, record: OperationRecord): Data {
  const exists = (items: {id: string}[], id: string) => items.some(x => x.id === id);
  const required = (value: string) => {if (!value.trim()) throw new Error('Complete all required fields.');};
  const date = (value: string) => {if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Choose a valid date.');};
  const replace = <T extends {id: string}>(items: T[], value: T): T[] => exists(items, value.id) ? items.map(x => x.id === value.id ? value : x) : [...items, value];
  if (kind === 'assets') {
    const a = record as Asset; required(a.name); required(a.category);
    if (!exists(data.rooms, a.roomId)) throw new Error('Choose an existing room.');
    if (!['operational', 'warning', 'critical'].includes(a.status)) throw new Error('Invalid equipment status.');
    return {...data, assets: replace(data.assets, {...a, name: a.name.trim(), category: a.category.trim()})};
  }
  if (kind === 'incidents') {
    const i = record as Incident; required(i.title);
    if (!exists(data.assets, i.assetId)) throw new Error('Choose an existing asset.');
    if (!['low', 'medium', 'critical'].includes(i.severity) || !['open', 'resolved'].includes(i.status)) throw new Error('Invalid incident state.');
    return {...data, incidents: replace(data.incidents, {...i, title: i.title.trim()})};
  }
  if (kind === 'maintenance') {
    const m = record as MaintenanceRecord; date(m.scheduledAt);
    if (!exists(data.assets, m.assetId)) throw new Error('Choose an existing asset.');
    if (!['pending', 'completed'].includes(m.status)) throw new Error('Invalid maintenance status.');
    return {...data, maintenance: replace(data.maintenance, m)};
  }
  const s = record as SafetyInspection; date(s.date);
  if (!exists(data.rooms, s.roomId) || !exists(data.employees, s.inspectorId)) throw new Error('Choose an existing room and inspector.');
  return {...data, inspections: replace(data.inspections, s)};
}
export function roomPath(data: Data, roomId: string): string {
  const room = data.rooms.find(r => r.id === roomId);
  const floor = data.floors.find(f => f.id === room?.floorId);
  const building = data.buildings.find(b => b.id === floor?.buildingId);
  return [building?.name, floor?.name, room?.name].filter(Boolean).join(' / ') || 'Unknown location';
}
export function toCsv(rows: (string | number)[][]): string {
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value);
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
}
