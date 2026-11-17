import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCapacityPlan, normalizeCapacity, normalizeDeviceCapacity, recordingStorageTB } from '../src/capacity.js';
import { createDemoProject, exportPortableProject, normalizeProject } from '../src/projectModel.js';

const camera = (id, capacity, extra = {}) => ({ id, name: id, type: 'camera', capacity, ...extra });
const sw = (id, capacity) => ({ id, name: id, type: 'switch', capacity });
const link = (fromDeviceId, toDeviceId, cableType = 'cat6') => ({ fromDeviceId, toDeviceId, cableType });
const projectOf = (devices, routes = [], retentionDays = 30) => ({
  capacity: { retentionDays }, buildings: [{ id: 'building', name: 'Building' }],
  floors: [{ id: 'floor', buildingId: 'building', name: 'Ground floor', devices, routes }],
});
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, actual + ' != ' + expected);

test('retention and recorded time affect storage while active bandwidth uses each full stream rate', () => {
  const project = projectOf([
    camera('C-01', { bitrateMbps: 4, recordingPercent: 100 }),
    camera('C-02', { bitrateMbps: 8, recordingPercent: 25 }),
    camera('C-03', { bitrateMbps: 2, recordingPercent: 0 }),
  ]);
  const plan = buildCapacityPlan(project);
  close(recordingStorageTB(4, 100, 30), 1.296);
  close(plan.storageTB, 1.944);
  assert.equal(plan.bandwidthMbps, 14);
  const double = buildCapacityPlan({ ...project, capacity: { retentionDays: 60 } });
  close(double.storageTB, 3.888);
  assert.equal(double.bandwidthMbps, 14);
});

test('ports and watts distinguish direct copper assignments, ambiguous links, fiber and switch uplinks', () => {
  const plan = buildCapacityPlan(projectOf([
    camera('C-01', { poeWatts: 18 }),
    camera('C-02', { poeWatts: 0 }),
    camera('C-03', { poeWatts: 15.4 }),
    camera('C-04', { poeWatts: 15.4 }),
    { id: 'R-01', type: 'reader', capacity: { networked: true, poeWatts: 5 } },
    { id: 'D-01', type: 'door' },
    sw('SW-01', { copperPorts: 2, poePorts: 1, poeBudgetWatts: 15, poePerPortWatts: 15 }),
    sw('SW-02'),
  ], [
    link('SW-01', 'C-01'), link('C-01', 'SW-01'), link('C-02', 'SW-01'),
    link('C-03', 'SW-01'), link('C-03', 'SW-02'), link('C-04', 'SW-02', 'fiber'),
    link('R-01', 'SW-01'), link('SW-01', 'SW-02'), link('SW-01', 'SW-02', 'fiber'),
  ]));
  const [first, second] = plan.switches;
  assert.equal(plan.endpointPorts, 5);
  assert.equal(plan.uplinkPorts, 2);
  assert.equal(plan.switchPorts, 7);
  assert.equal(plan.poweredPorts, 4);
  close(plan.poeWatts, 53.8);
  assert.equal(first.usedPorts, 4);
  assert.equal(first.poweredPorts, 2);
  assert.equal(first.poeWatts, 23);
  assert.deepEqual(first.limits, ['Copper ports', 'PoE ports', 'Total PoE watts', 'Per-port PoE']);
  assert.deepEqual(first.highPowerIds, ['C-01']);
  assert.equal(second.usedPorts, 1);
  assert.deepEqual(plan.unassigned.map(row => row.reason), ['Connected to multiple switches', 'No direct Cat6 switch route']);
  close(plan.unassignedPoEWatts, 30.8);
});

test('capacity settings migrate older projects and round-trip as editable project data', async () => {
  const project = createDemoProject();
  const floor = project.floors[0];
  floor.plan.url = '';
  delete project.capacity;
  delete floor.devices[0].capacity;
  const legacy = normalizeProject(project);
  assert.equal(legacy.capacity.retentionDays, 30);
  assert.equal(legacy.floors[0].devices[0].capacity.bitrateMbps, 4);
  project.capacity = { retentionDays: 45 };
  floor.devices[0].capacity = { bitrateMbps: 6.5, recordingPercent: 55, poeWatts: 22 };
  const portable = await exportPortableProject(project);
  assert.equal(portable.capacity.retentionDays, 45);
  assert.deepEqual(portable.floors[0].devices[0].capacity, { networked: true, poeWatts: 22, bitrateMbps: 6.5, recordingPercent: 55 });
  assert.throws(() => normalizeCapacity({ retentionDays: 1.5 }), /whole number/);
  assert.throws(() => normalizeDeviceCapacity(sw('SW', { copperPorts: 4, poePorts: 8 })), /cannot exceed/);
});
