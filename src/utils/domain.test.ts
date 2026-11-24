import {describe, expect, test} from 'vitest';
import {createSeed} from '../data/seed';
import {metrics, removeBuilding} from './domain';

describe('foundation domain behavior', () => {
  test('demo seed contains requested quantities and valid location relationships', () => {
    const data = createSeed();
    for (const [key, count] of Object.entries({
      buildings: 4,
      floors: 12,
      rooms: 30,
      assets: 60,
      employees: 10,
      tasks: 25,
      incidents: 20,
    })) {
      expect(data[key as keyof typeof data]).toHaveLength(count);
    }
    for (const floor of data.floors) {
      expect(data.buildings.some(building => building.id === floor.buildingId)).toBe(true);
    }
    for (const room of data.rooms) {
      expect(data.floors.some(floor => floor.id === room.floorId)).toBe(true);
    }
    for (const asset of data.assets) {
      expect(data.rooms.some(room => room.id === asset.roomId)).toBe(true);
    }
    for (const task of data.tasks) {
      expect(data.employees.some(employee => employee.id === task.assigneeId)).toBe(true);
    }
  });

  test('dashboard reflects task transitions and excludes resolved critical incidents', () => {
    const data = createSeed();
    data.tasks = data.tasks.map(task => ({...task, status: 'done'}));
    data.incidents = data.incidents.map(incident => ({...incident, status: 'resolved'}));
    expect(metrics(data).tasks).toBe(0);
    expect(metrics(data).critical).toBe(0);
  });

  test('deleting occupied building is blocked; empty building cascades floor and room', () => {
    const data = createSeed();
    expect(() => removeBuilding(data, data.buildings[0].id)).toThrow(/Move linked equipment/);
    data.buildings.push({id: 'new', name: 'New', address: 'Demo', managerId: data.employees[0].id});
    data.floors.push({id: 'newfloor', name: 'Floor', buildingId: 'new'});
    data.rooms.push({
      id: 'newroom',
      name: 'Room',
      floorId: 'newfloor',
      managerId: data.employees[0].id,
      status: 'operational',
    });
    const next = removeBuilding(data, 'new');
    expect(next.floors.some(floor => floor.id === 'newfloor')).toBe(false);
    expect(next.rooms.some(room => room.id === 'newroom')).toBe(false);
    expect(next.assets).toHaveLength(60);
  });
});
