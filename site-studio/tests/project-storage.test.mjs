import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoProject } from '../src/projectModel.js';
import { createProjectPersistence, createIndexedDbAdapter } from '../src/projectStorage.js';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('read completes before queued writes and load is shared', async () => {
  const read = deferred();
  const events = [];
  const store = createProjectPersistence({ read: () => { events.push('read'); return read.promise; }, write: async p => { events.push('write:' + p.name); } });
  const p = createDemoProject(); p.name = 'New draft';
  const saving = store.save(p);
  const loading = store.load();
  await tick();
  assert.deepEqual(events, ['read']);
  read.resolve(null);
  assert.equal(await loading, null);
  await saving;
  assert.deepEqual(events, ['read', 'write:New draft']);
});
test('saves are serialized and snapshot state when queued', async () => {
  const firstWrite = deferred();
  const events = [];
  const store = createProjectPersistence({
    read: async () => null,
    write: async p => { events.push('start:' + p.name); if (p.name === 'first') await firstWrite.promise; events.push('end:' + p.name); },
  });
  const p = createDemoProject(); p.name = 'first';
  const first = store.save(p);
  p.name = 'second';
  const second = store.save(p);
  await tick();
  assert.deepEqual(events, ['start:first']);
  firstWrite.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(events, ['start:first', 'end:first', 'start:second', 'end:second']);
});
test('a failed write reports failure but does not poison later saves', async () => {
  const writes = [];
  let fail = true;
  const store = createProjectPersistence({ read: async () => null, write: async p => { if (fail) { fail = false; throw new Error('Quota exceeded'); } writes.push(p.name); } });
  const p = createDemoProject();
  await assert.rejects(store.save(p), /Quota exceeded/);
  p.name = 'Recovered';
  await store.save(p);
  assert.deepEqual(writes, ['Recovered']);
});
test('failed or invalid initial reads never overwrite an unread draft', async () => {
  let writes = 0;
  const adapter = { read: async () => { throw new Error('Storage unavailable'); }, write: async () => { writes++; } };
  const store = createProjectPersistence(adapter);
  await assert.rejects(store.load(), /Storage unavailable/);
  await assert.rejects(store.save(createDemoProject()), /Storage unavailable/);
  assert.equal(writes, 0);
  const invalid = createProjectPersistence({ read: async () => ({ version: 999 }), write: adapter.write });
  await assert.rejects(invalid.save(createDemoProject()), /supported/);
  assert.equal(writes, 0);
});
test('restoration migrates legacy data and removes credentials before saving', async () => {
  const p = createDemoProject();
  const legacy = { format: 'physec-studio', version: 1, name: 'Legacy draft', plan: p.floors[0].plan, devices: p.floors[0].devices, googleKey: 'secret' };
  let saved;
  const store = createProjectPersistence({ read: async () => legacy, write: async data => { saved = data; } });
  const restored = await store.load();
  assert.equal(restored.version, 2);
  assert.equal(restored.name, 'Legacy draft');
  assert.equal('googleKey' in restored, false);
  await store.save(restored);
  assert.equal(saved.version, 2);
  assert.equal(JSON.stringify(saved).includes('secret'), false);
});
test('invalid in-memory project cannot replace a good draft', async () => {
  let writes = 0;
  const store = createProjectPersistence({ read: async () => createDemoProject(), write: async () => { writes++; } });
  const broken = createDemoProject(); broken.activeFloorId = 'missing';
  await assert.rejects(store.save(broken), /active floor/);
  assert.equal(writes, 0);
});
test('unsupported storage environment yields a useful error', async () => {
  const adapter = createIndexedDbAdapter({ indexedDB: null });
  await assert.rejects(adapter.read(), /does not support/);
});

test('persisted coverage extensions restore without leaking barriers to another floor', async () => {
  let disk;
  const adapter = { read: async () => disk, write: async data => { disk = structuredClone(data); } };
  const project = createDemoProject();
  const camera = project.floors[0].devices[0];
  Object.assign(camera, { sensorWidth: 8, lens: 6, fov: 2 * Math.atan(8 / 12) * 180 / Math.PI, aspectRatio: 4 / 3, tilt: 40, targetHeight: 1, height: 4 });
  project.floors[0].barriers = [{
    id: 'wall-stored', name: 'Stored wall', kind: 'wall', height: 3.5, enabled: false,
    points: [{ lat: 41.8898, lng: -87.6366 }, { lat: 41.8898, lng: -87.6364 }],
  }];
  project.floors.push({ id: 'floor-empty', buildingId: project.buildings[0].id, name: 'Empty floor', plan: { ...project.floors[0].plan, url: '', visible: false }, devices: [], routes: [] });
  await createProjectPersistence(adapter).save(project);
  const restored = await createProjectPersistence(adapter).load();
  assert.deepEqual(restored.floors[0].barriers, project.floors[0].barriers);
  assert.deepEqual(restored.floors[1].barriers, []);
  for (const field of ['lens', 'fov', 'sensorWidth', 'aspectRatio', 'tilt', 'targetHeight', 'height']) {
    assert.equal(restored.floors[0].devices[0][field], camera[field]);
  }
});

test('saved common coverage areas and target planes restore separately for each floor', async () => {
  let disk;
  const adapter = { read: async () => disk, write: async data => { disk = structuredClone(data); } };
  const project = createDemoProject();
  const area = { points: [{ lat: 41.8898, lng: -87.6366 }, { lat: 41.8898, lng: -87.6364 }, { lat: 41.89, lng: -87.6365 }] };
  project.floors[0].coverageArea = area;
  project.floors[0].coverageTargetHeight = 1.5;
  const cameraTarget = project.floors[0].devices[0].targetHeight;
  project.floors.push({ id: 'floor-coverage-empty', buildingId: project.buildings[0].id, name: 'No analysis area', plan: { ...project.floors[0].plan, url: '', visible: false }, devices: [], routes: [], coverageArea: null, coverageTargetHeight: 0 });
  await createProjectPersistence(adapter).save(project);
  const restored = await createProjectPersistence(adapter).load();
  assert.deepEqual(restored.floors[0].coverageArea, area);
  assert.equal(restored.floors[0].coverageTargetHeight, 1.5);
  assert.equal(restored.floors[0].devices[0].targetHeight, cameraTarget);
  assert.equal(restored.floors[1].coverageArea, null);
  assert.equal(restored.floors[1].coverageTargetHeight, 0);
});
