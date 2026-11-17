import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlankPlan, createDemoProject, createProjectRevision, exportPortableProject, normalizeProject } from '../src/projectModel.js';
import { createProjectPersistence } from '../src/projectStorage.js';
import { createProjectHistory, projectHistoryReducer as reduce, UNDO_LIMIT } from '../src/projectHistory.js';
import { compareFloorDevices, comparisonFloors, comparisonFrame } from '../src/revisionComparison.js';

const edit = (history, update, group = null, time = 0) => reduce(history, { type: 'edit', update, group, time });
const rename = name => design => ({ ...design, name });
const replaceDevices = (design, update) => ({
  ...design, floors: design.floors.map((floor, index) => index === 0 ? { ...floor, devices: update(floor.devices) } : floor),
});

test('undo and redo group rapid field edits without merging discrete actions', () => {
  const original = createDemoProject();
  let history = createProjectHistory(original);
  history = edit(history, rename('N'), 'project:name', 100);
  history = edit(history, rename('North'), 'project:name', 200);
  assert.equal(history.past.length, 1);
  history = edit(history, rename('North entrance'));
  history = reduce(history, { type: 'undo' });
  assert.equal(history.project.name, 'North');
  history = reduce(history, { type: 'undo' });
  assert.equal(history.project.name, original.name);
  history = edit(history, rename(original.name));
  history = reduce(history, { type: 'redo' });
  assert.equal(history.project.name, 'North');
  history = edit(history, rename('South'));
  assert.equal(history.future.length, 0);
});

test('floor navigation and revision saves preserve undo and restore is itself undoable', () => {
  const demo = createDemoProject();
  const upper = { ...demo.floors[0], id: 'floor-upper', name: 'Upper', devices: [] };
  const original = { ...demo, floors: [...demo.floors, upper] };
  const baseline = createProjectRevision(original, 'Baseline');
  const current = 'Alternative';
  let history = createProjectHistory(original);
  history = edit(history, rename(current));
  history = reduce(history, { type: 'navigate', id: upper.id });
  history = reduce(history, { type: 'save-revision', revision: baseline });
  assert.equal(history.past.length, 1);
  history = edit(history, baseline.design);
  assert.equal(history.project.name, original.name);
  history = reduce(history, { type: 'undo' });
  assert.equal(history.project.name, current);
  assert.equal(history.project.activeFloorId, upper.id);
  assert.deepEqual(history.revisions, [baseline]);
  history = reduce(history, { type: 'load', history: createProjectHistory(demo) });
  assert.deepEqual(history.revisions, []);
  assert.deepEqual(history.past, []);
  assert.deepEqual(history.future, []);
});

test('recent edit history stays bounded', () => {
  let history = createProjectHistory(createDemoProject());
  for (let index = 0; index <= UNDO_LIMIT; index++) history = edit(history, rename(String(index)));
  assert.equal(history.past.length, UNDO_LIMIT);
});

test('revision snapshots preserve their own drawing, device, and cost data through disk and portable export', async () => {
  const demo = createDemoProject();
  demo.floors[0].plan = { ...createBlankPlan(), url: 'data:image/png;base64,AAAA', visible: true };
  demo.costs = { equipment: { 'camera-dome-4mp': 520 } };
  const baseline = createProjectRevision(demo, 'Baseline');
  const draft = replaceDevices(demo, devices => devices.slice(1));
  draft.floors[0].plan = { ...draft.floors[0].plan, rotation: 15 };
  draft.costs = { ...draft.costs, equipment: {} };
  const project = { ...draft, revisions: [baseline] };
  const portable = await exportPortableProject(project);
  const restored = normalizeProject(JSON.parse(JSON.stringify(portable)));
  assert.deepEqual(restored.revisions[0], baseline);
  assert.equal(restored.floors[0].devices.length, 10);
  assert.equal(restored.revisions[0].design.floors[0].devices.length, 11);
  assert.equal(restored.revisions[0].design.floors[0].plan.rotation, 0);
  assert.equal(restored.revisions[0].design.costs.equipment['camera-dome-4mp'], 520);
  assert.equal('revisions' in restored.revisions[0].design, false);
  assert.throws(() => normalizeProject({ ...portable, revisions: [{ ...baseline, design: { ...baseline.design, id: 'foreign' } }] }), /different project/);
  let disk;
  const adapter = { read: async () => disk, write: async value => { disk = structuredClone(value); } };
  await createProjectPersistence(adapter).save(project);
  const loaded = await createProjectPersistence(adapter).load();
  assert.deepEqual(loaded.revisions, [baseline]);
});

test('layout comparison identifies changed, removed and added devices and works with an absent floor', () => {
  const demo = createDemoProject();
  const floor = demo.floors[0];
  const [first, second, ...rest] = floor.devices;
  const newDevice = { ...second, id: 'C-99' };
  const after = replaceDevices(demo, () => [{ ...first, lng: first.lng + 0.0005 }, ...rest, newDevice]);
  after.floors = [...after.floors, { ...floor, id: 'upper', name: 'Upper', devices: [] }];
  assert.deepEqual(comparisonFloors(demo, after).map(row => row.id), [floor.id, 'upper']);
  assert.deepEqual(compareFloorDevices(floor, after.floors[0]).map(change => [change.id, change.state, change.detail]),
    [[first.id, 'Changed', 'Location'], [second.id, 'Removed', ''], [newDevice.id, 'Added', '']]);
  assert.equal(compareFloorDevices(undefined, after.floors[0]).length, after.floors[0].devices.length);
  const frame = comparisonFrame(floor, after.floors[0]);
  assert.ok(frame.project(after.floors[0].devices[0]).x > frame.project(first).x);
  assert.ok(frame.viewBox.split(' ').every(part => Number.isFinite(Number(part))));
  assert.ok(comparisonFrame(undefined, floor).marker > 0);
});
