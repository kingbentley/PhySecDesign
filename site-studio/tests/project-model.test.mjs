import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBlankPlan, createDemoProject, makeId, normalizeProject, exportPortableProject, DEVICE_TYPES as MODEL_DEVICE_TYPES } from '../src/projectModel.js';
import { DEVICE_TYPES as CATALOG_DEVICE_TYPES, EQUIPMENT_CATALOG } from '../src/catalog.js';

const image = 'data:image/png;base64,iVBORw0KGgo=';
function fixture() {
  const project = createDemoProject();
  project.floors[0].plan.url = image;
  return project;
}
function floor(project, suffix = 'second') {
  return { id: 'floor-' + suffix, buildingId: project.buildings[0].id, name: suffix, plan: createBlankPlan(), devices: [], routes: [] };
}
test('blank plans have finite geometry and remain hidden without an image', () => {
  const plan = createBlankPlan({ lat: 40, lng: -80 });
  assert.equal(plan.url, '');
  assert.equal(plan.visible, false);
  assert.equal(plan.width / plan.height, 4 / 3);
  const project = fixture();
  project.floors.push(floor(project));
  project.floors[1].plan.visible = true;
  assert.equal(normalizeProject(project).floors[1].plan.visible, false);
});
test('demo is a complete v2 project with globally unique equipment and safe IDs', () => {
  const demo = createDemoProject();
  assert.equal(demo.version, 2);
  assert.equal(demo.floors[0].devices.length, 11);
  assert.equal(new Set(demo.floors[0].devices.map(d => d.id)).size, 11);
  assert.equal(demo.floors[0].devices[0].catalogId, 'camera-dome-4mp');
  assert.notEqual(makeId('floor'), makeId('floor'));
  assert.match(makeId('../floor'), /^floor-/);
});
test('v1 exports migrate into one building and floor with existing geometry and PDF identity', () => {
  const modern = fixture();
  const old = { format: 'physec-studio', version: 1, name: 'Legacy site', plan: modern.floors[0].plan, devices: modern.floors[0].devices };
  old.plan.sourcePdf = { filename: 'Plans.pdf', pageNumber: 2, pageCount: 4, pageLabel: 'A102', widthPoints: 792, heightPoints: 612, rasterWidth: 2200, rasterHeight: 1700 };
  const migrated = normalizeProject(old);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.name, 'Legacy site');
  assert.equal(migrated.activeFloorId, migrated.floors[0].id);
  assert.equal(migrated.floors[0].devices[0].lat, old.devices[0].lat);
  assert.deepEqual(migrated.floors[0].plan.sourcePdf, old.plan.sourcePdf);
});
test('unknown fields and credentials are excluded from normal persistence and export objects', () => {
  const project = fixture();
  project.googleKey = 'secret';
  project.floors[0].plan.googleKey = 'secret';
  project.floors[0].devices[0].apiKey = 'secret';
  project.costs = { googleKey: 'secret', equipment: { 'camera-dome-4mp': 350 }, cable: { cat6: 1.25 } };
  const clean = normalizeProject(project);
  assert.equal(JSON.stringify(clean).includes('secret'), false);
  assert.deepEqual(clean.costs, { equipment: { 'camera-dome-4mp': 350 }, cable: { cat6: 1.25 } });
});
test('floor references and duplicate IDs are rejected', () => {
  let p = fixture(); p.floors[0].buildingId = 'missing';
  assert.throws(() => normalizeProject(p), /missing building/);
  p = fixture(); p.activeFloorId = 'missing';
  assert.throws(() => normalizeProject(p), /active floor/);
  p = fixture(); p.floors.push({ ...floor(p), devices: [{ ...p.floors[0].devices[0] }] });
  assert.throws(() => normalizeProject(p), /duplicate ID/);
});
test('cable routes require distinct same-floor endpoints and finite waypoints', () => {
  const p = fixture();
  p.floors[0].routes.push({ id: 'route-1', name: 'Lobby uplink', fromDeviceId: 'C-01', toDeviceId: 'R-01', via: [{ lat: 41.88, lng: -87.63 }], cableType: 'cat6', slackPercent: 10 });
  assert.equal(normalizeProject(p).floors[0].routes[0].via.length, 1);
  p.floors[0].routes[0].toDeviceId = 'C-01';
  assert.throws(() => normalizeProject(p), /same floor/);
  p.floors[0].routes[0].toDeviceId = 'missing';
  assert.throws(() => normalizeProject(p), /same floor/);
  p.floors[0].routes[0].toDeviceId = 'R-01';
  p.floors[0].routes[0].via[0].lat = NaN;
  assert.throws(() => normalizeProject(p), /latitude/);
});
test('unsupported devices, invalid coordinates, costs and image sources cannot be imported', () => {
  let p = fixture(); p.floors[0].devices[0].type = 'unknown';
  assert.throws(() => normalizeProject(p), /unsupported type/);
  p = fixture(); p.floors[0].devices[0].lat = Infinity;
  assert.throws(() => normalizeProject(p), /latitude/);
  p = fixture(); p.costs = { equipment: { 'camera-dome-4mp': -1 } };
  assert.throws(() => normalizeProject(p), /Cost/);
  p = fixture(); p.floors[0].plan.url = 'https://third-party.example/secret-tracker.png';
  assert.throws(() => normalizeProject(p), /embedded/);
  p = fixture(); p.floors[0].plan.url = '/assets/../private.png';
  assert.throws(() => normalizeProject(p, { allowLocalAssets: true }), /embedded/);
});
test('new device types retain catalog, mounting, lifecycle and notes fields', () => {
  const p = fixture();
  p.floors[0].devices = ['door', 'sensor', 'intercom', 'switch', 'cabinet'].map((type, i) => ({
    id: type + '-' + i, type, name: type, lat: 41.88, lng: -87.63, status: 'existing', mounting: 'Wall', notes: 'Verify on site', model: 'Example model',
  }));
  const clean = normalizeProject(p);
  assert.equal(clean.floors[0].devices.length, 5);
  assert.equal(clean.floors[0].devices[3].catalogId, 'switch-poe-8');
  assert.equal(clean.floors[0].devices[0].status, 'existing');
});
test('portable export embeds reused local assets once and never exports credentials', async t => {
  const project = createDemoProject();
  project.googleKey = 'secret';
  project.floors.push({ ...floor(project), plan: { ...project.floors[0].plan } });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => { calls.push(url); return { ok: true, blob: async () => ({ type: 'image/png' }) }; });
  class FakeReader {
    readAsDataURL() { this.result = image; queueMicrotask(() => this.onload()); }
  }
  const original = globalThis.FileReader;
  globalThis.FileReader = FakeReader;
  t.after(() => { if (original === undefined) delete globalThis.FileReader; else globalThis.FileReader = original; });
  const portable = await exportPortableProject(project);
  assert.equal(calls.length, 1);
  assert.equal(portable.floors[0].plan.url, image);
  assert.equal(portable.floors[1].plan.url, image);
  assert.equal('googleKey' in portable, false);
  assert.equal(project.floors[0].plan.url, '/assets/ground-floor.png');
});

test('schema accepts supported cost/slack boundaries and rejects values above UI limits', () => {
  const p = fixture();
  p.floors[0].routes.push({ id: 'route-bounds', name: 'Boundary route', fromDeviceId: 'C-01', toDeviceId: 'R-01', via: [], cableType: 'cat6', slackPercent: 0 });
  p.costs = { equipment: { 'camera-dome-4mp': 0 }, cable: { cat6: 1000000 } };
  assert.equal(normalizeProject(p).floors[0].routes[0].slackPercent, 0);
  p.floors[0].routes[0].slackPercent = 100;
  p.costs.equipment['camera-dome-4mp'] = 1000000;
  p.costs.cable.cat6 = 0;
  const upper = normalizeProject(p);
  assert.equal(upper.floors[0].routes[0].slackPercent, 100);
  assert.equal(upper.costs.equipment['camera-dome-4mp'], 1000000);
  for (const invalid of [-0.01, 100.01]) {
    p.floors[0].routes[0].slackPercent = invalid;
    assert.throws(() => normalizeProject(p), /Cable slack/);
  }
  p.floors[0].routes[0].slackPercent = 10;
  for (const group of ['equipment', 'cable']) {
    const key = group === 'equipment' ? 'camera-dome-4mp' : 'cat6';
    for (const invalid of [-0.01, 1000000.01]) {
      p.costs[group][key] = invalid;
      assert.throws(() => normalizeProject(p), /Cost/);
    }
    p.costs[group][key] = 0;
  }
});
test('model type IDs and defaults agree with the equipment catalog', () => {
  assert.deepEqual([...MODEL_DEVICE_TYPES].sort(), Object.keys(CATALOG_DEVICE_TYPES).sort());
  const p = fixture();
  p.floors[0].devices = EQUIPMENT_CATALOG.map((item, index) => ({
    id: 'catalog-' + index, type: item.type, name: item.name, catalogId: item.id,
    model: item.model, ...item.defaults, lat: 41.88, lng: -87.63,
  }));
  const normalized = normalizeProject(p);
  assert.deepEqual(normalized.floors[0].devices.map(d => d.catalogId), EQUIPMENT_CATALOG.map(item => item.id));
  for (const type of MODEL_DEVICE_TYPES) {
    const device = { id: 'default-' + type, type, lat: 41.88, lng: -87.63 };
    p.floors[0].devices = [device];
    const normalizedDevice = normalizeProject(p).floors[0].devices[0];
    assert.equal(EQUIPMENT_CATALOG.find(item => item.id === normalizedDevice.catalogId)?.type, type);
  }
});

test('portable JSON round-trip preserves multiple floors, PDF metadata, routes and cost overrides', async t => {
  const project = createDemoProject();
  project.name = 'Portable campus';
  project.floors[0].plan.sourcePdf = {
    filename: 'Campus sheet set.pdf', pageNumber: 3, pageCount: 8, pageLabel: 'A-103',
    widthPoints: 792, heightPoints: 612, rasterWidth: 2200, rasterHeight: 1700,
  };
  project.floors[0].routes = [{
    id: 'portable-route', name: 'Lobby camera cable', fromDeviceId: 'C-01', toDeviceId: 'R-01',
    via: [{ lat: 41.88985, lng: -87.63655 }], cableType: 'cat6', slackPercent: 15,
  }];
  project.floors.push(floor(project, 'level-two'));
  project.activeFloorId = 'floor-level-two';
  project.costs = { equipment: { 'camera-dome-4mp': 525.5 }, cable: { cat6: 1.35, fiber: 2.75 } };
  project.googleKey = 'excluded-secret';
  const assetBytes = await readFile(new URL('../public/assets/ground-floor.png', import.meta.url));
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, '/assets/ground-floor.png');
    return { ok: true, blob: async () => new Blob([assetBytes], { type: 'image/png' }) };
  });
  class BlobReader {
    readAsDataURL(blob) {
      blob.arrayBuffer().then(buffer => {
        this.result = 'data:' + blob.type + ';base64,' + Buffer.from(buffer).toString('base64');
        this.onload();
      }).catch(error => { this.error = error; this.onerror(); });
    }
  }
  const originalReader = globalThis.FileReader;
  globalThis.FileReader = BlobReader;
  t.after(() => { if (originalReader === undefined) delete globalThis.FileReader; else globalThis.FileReader = originalReader; });
  const portable = await exportPortableProject(project);
  const json = JSON.stringify(portable);
  const reopened = normalizeProject(JSON.parse(json));
  assert.deepEqual(reopened, portable);
  assert.equal(reopened.activeFloorId, 'floor-level-two');
  assert.equal(reopened.floors.length, 2);
  assert.deepEqual(reopened.floors[0].plan.sourcePdf, project.floors[0].plan.sourcePdf);
  assert.deepEqual(reopened.floors[0].routes, project.floors[0].routes);
  assert.deepEqual(reopened.costs, project.costs);
  assert.equal(reopened.floors[1].plan.url, '');
  assert.equal(reopened.floors[1].devices.length, 0);
  assert.equal(json.includes('excluded-secret'), false);
  assert.equal(json.includes('/assets/'), false);
  const embeddedBytes = Buffer.from(reopened.floors[0].plan.url.split(',')[1], 'base64');
  assert.deepEqual(embeddedBytes, assetBytes);
});

const wall = (id = 'wall-1', overrides = {}) => ({
  id, name: 'North wall', kind: 'wall',
  points: [{ lat: 41.8898, lng: -87.6366 }, { lat: 41.8898, lng: -87.6364 }],
  height: 3, enabled: true, ...overrides,
});
const obstacle = (id = 'obstacle-1', overrides = {}) => ({
  id, name: 'Equipment enclosure', kind: 'obstacle',
  points: [{ lat: 41.8898, lng: -87.6366 }, { lat: 41.8898, lng: -87.6364 }, { lat: 41.89, lng: -87.6364 }, { lat: 41.89, lng: -87.6366 }],
  height: 2, enabled: true, ...overrides,
});
test('legacy v1 and v2 cameras preserve FOV while adopting valid matching optics', () => {
  const p = fixture();
  const camera = p.floors[0].devices[0];
  delete camera.sensorWidth;
  delete camera.aspectRatio;
  delete camera.tilt;
  delete camera.targetHeight;
  camera.fov = 160;
  camera.lens = 6; // Formerly inert and inconsistent with the displayed coverage.
  delete p.floors[0].barriers;
  for (const source of [p, { format: 'physec-studio', version: 1, plan: p.floors[0].plan, devices: p.floors[0].devices }]) {
    const normalized = normalizeProject(source);
    const upgraded = normalized.floors[0].devices[0];
    assert.equal(upgraded.fov, 160);
    assert.equal(upgraded.sensorWidth, 6.4);
    assert.ok(Math.abs(upgraded.lens - 6.4 / (2 * Math.tan(80 * Math.PI / 180))) < 1e-10);
    assert.ok(upgraded.lens >= 0.5);
    assert.equal(upgraded.aspectRatio, 16 / 9);
    assert.equal(upgraded.tilt, 25);
    assert.equal(upgraded.targetHeight, 0);
    assert.deepEqual(normalized.floors[0].barriers, []);
    assert.deepEqual(normalizeProject(normalized), normalized);
  }
});
test('camera validation rejects inconsistent optics and target planes above the camera', () => {
  let p = fixture();
  p.floors[0].devices[0].lens = 10;
  assert.throws(() => normalizeProject(p), /does not match/);
  p = fixture();
  p.floors[0].devices[0].fov += 0.05;
  assert.doesNotThrow(() => normalizeProject(p));
  p.floors[0].devices[0].fov += 0.1;
  assert.throws(() => normalizeProject(p), /does not match/);
  p = fixture();
  p.floors[0].devices[0].targetHeight = p.floors[0].devices[0].height;
  assert.throws(() => normalizeProject(p), /below its mounting height/);
  const invalidFields = { sensorWidth: 36.1, aspectRatio: 4.1, tilt: 91, targetHeight: -0.1, height: 30.1, lens: 100.1, fov: 160.1, range: 150.1 };
  for (const [field, value] of Object.entries(invalidFields)) {
    p = fixture(); p.floors[0].devices[0][field] = value;
    assert.throws(() => normalizeProject(p), Error, field + ' outside range must be rejected');
  }
});
test('barriers and camera fields round-trip independently on each floor', async () => {
  const p = fixture();
  p.floors[0].barriers = [wall(), obstacle('obstacle-1', { enabled: false })];
  p.floors.push({ ...floor(p, 'barriers'), barriers: [wall('wall-1', { height: 5 })] });
  const camera = p.floors[0].devices[0];
  Object.assign(camera, { sensorWidth: 8, lens: 6, fov: 2 * Math.atan(8 / 12) * 180 / Math.PI, aspectRatio: 4 / 3, tilt: 45, targetHeight: 1.5, height: 4 });
  const portable = await exportPortableProject(p);
  const roundTrip = normalizeProject(JSON.parse(JSON.stringify(portable)));
  assert.deepEqual(roundTrip.floors[0].barriers, p.floors[0].barriers);
  assert.deepEqual(roundTrip.floors[1].barriers, p.floors[1].barriers);
  assert.equal(roundTrip.floors[1].devices.length, 0);
  assert.equal(roundTrip.floors[0].devices[0].sensorWidth, 8);
  assert.equal(roundTrip.floors[0].devices[0].targetHeight, 1.5);
  assert.equal(roundTrip.floors[0].devices[0].tilt, 45);
  assert.equal(roundTrip.version, 2);
});
test('invalid barrier kinds, geometry, coordinates and limits are rejected', () => {
  const invalid = [
    wall('invalid', { kind: 'unknown' }),
    wall('invalid', { height: 0 }),
    wall('invalid', { height: 50.1 }),
    wall('invalid', { enabled: 'false' }),
    wall('invalid', { points: [{ lat: 41.88, lng: -87.6 }] }),
    wall('invalid', { points: [{ lat: 41.88, lng: -87.6 }, { lat: 41.88, lng: -87.6 }] }),
    wall('invalid', { points: [{ lat: 86, lng: -87.6 }, { lat: 41.88, lng: -87.6 }] }),
    obstacle('invalid', { points: [{ lat: 41.88, lng: -87.6 }, { lat: 41.89, lng: -87.6 }, { lat: 41.90, lng: -87.6 }] }),
    wall('invalid', { points: Array.from({ length: 101 }, (_, i) => ({ lat: 41.88 + i * 0.0001, lng: -87.6 })) }),
  ];
  for (const barrier of invalid) {
    const p = fixture(); p.floors[0].barriers = [barrier];
    assert.throws(() => normalizeProject(p), Error);
  }
  const duplicate = fixture(); duplicate.floors[0].barriers = [wall(), wall()];
  assert.throws(() => normalizeProject(duplicate), /duplicate ID/);
  const tooMany = fixture(); tooMany.floors[0].barriers = Array.from({ length: 101 }, (_, i) => wall('wall-' + i));
  assert.throws(() => normalizeProject(tooMany), /at most 100/);
});
test('closed obstacle rings normalize to unique vertices and boundary heights remain valid', () => {
  const p = fixture();
  const closed = obstacle();
  closed.points.push({ ...closed.points[0] });
  p.floors[0].barriers = [closed, wall('low-wall', { height: 0.1 }), wall('high-wall', { height: 50 })];
  const clean = normalizeProject(p);
  assert.equal(clean.floors[0].barriers[0].points.length, 4);
  assert.equal(clean.floors[0].barriers[1].height, 0.1);
  assert.equal(clean.floors[0].barriers[2].height, 50);
});

const barrierGeo = points => points.map(([east, north]) => ({
  lat: 41.8898 + north / 111320,
  lng: -87.6366 + east / (111320 * Math.cos(41.8898 * Math.PI / 180)),
}));
test('obstacle outlines reject unequal-lobe crossings and repeated nonadjacent vertices', () => {
  const outlines = [
    // Unequal lobes have nonzero signed area, so an area-only check misses this.
    [[0, 0], [12, 12], [0, 10], [10, 0]],
    [[0, 0], [10, 0], [10, 10], [5, 5], [0, 10], [5, 5]],
    // A nonadjacent edge overlaps part of the first edge.
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 5], [8, 5], [8, 0], [2, 0], [2, 3]],
  ];
  for (const points of outlines) {
    const p = fixture();
    p.floors[0].barriers = [obstacle('crossed', { points: barrierGeo(points) })];
    assert.throws(() => normalizeProject(p), /Draw the obstruction outline without crossing its edges\./);
  }
});
test('simple concave and explicitly closed obstacle outlines remain supported', () => {
  const p = fixture();
  const points = barrierGeo([[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]]);
  p.floors[0].barriers = [obstacle('concave', { points })];
  assert.deepEqual(normalizeProject(p).floors[0].barriers[0].points, points);
  p.floors[0].barriers[0].points = [...points, { ...points[0] }];
  assert.deepEqual(normalizeProject(p).floors[0].barriers[0].points, points);
});
test('wall polylines may cross while solid obstacle outlines may not', () => {
  const p = fixture();
  const points = barrierGeo([[0, 0], [12, 12], [0, 10], [10, 0]]);
  p.floors[0].barriers = [wall('crossed-wall', { points })];
  assert.deepEqual(normalizeProject(p).floors[0].barriers[0].points, points);
});

test('older v1/v2 files receive independent combined coverage defaults', () => {
  const p = fixture();
  delete p.floors[0].coverageArea;
  delete p.floors[0].coverageTargetHeight;
  for (const source of [p, { format: 'physec-studio', version: 1, plan: p.floors[0].plan, devices: p.floors[0].devices }]) {
    const normalized = normalizeProject(source);
    assert.equal(normalized.floors[0].coverageArea, null);
    assert.equal(normalized.floors[0].coverageTargetHeight, 0);
    assert.equal(normalized.version, 2);
  }
});
test('coverage areas preserve concavity, canonicalize closure and reject invalid outlines', () => {
  const p = fixture();
  const concave = barrierGeo([[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]]);
  p.floors[0].coverageArea = { points: [...concave, { ...concave[0] }] };
  assert.deepEqual(normalizeProject(p).floors[0].coverageArea, { points: concave });
  const invalid = [
    { points: barrierGeo([[0, 0], [10, 0]]) },
    { points: barrierGeo([[0, 0], [5, 0], [10, 0]]) },
    { points: barrierGeo([[0, 0], [12, 12], [0, 10], [10, 0]]) },
    { points: barrierGeo([[0, 0], [10, 0], [10, 10], [5, 5], [0, 10], [5, 5]]) },
    { points: [{ lat: NaN, lng: 0 }, ...concave.slice(1)] },
    { points: [{ lat: 86, lng: 0 }, ...concave.slice(1)] },
    { points: Array.from({ length: 101 }, (_, i) => ({ lat: 41.88 + i * 0.00001, lng: -87.63 })) },
    [],
  ];
  for (const area of invalid) {
    p.floors[0].coverageArea = area;
    assert.throws(() => normalizeProject(p), Error);
  }
  p.floors[0].coverageArea = { points: barrierGeo([[0, 0], [12, 12], [0, 10], [10, 0]]) };
  assert.throws(() => normalizeProject(p), /Draw the coverage area outline without crossing its edges\./);
});
test('combined coverage target height is validated independently of camera target planes', () => {
  const p = fixture();
  const originalCamera = { ...p.floors[0].devices[0] };
  for (const height of [0, 10]) {
    p.floors[0].coverageTargetHeight = height;
    const normalized = normalizeProject(p);
    assert.equal(normalized.floors[0].coverageTargetHeight, height);
    assert.deepEqual(normalized.floors[0].devices[0], originalCamera);
  }
  for (const height of [-0.01, 10.01, NaN, '1']) {
    p.floors[0].coverageTargetHeight = height;
    assert.throws(() => normalizeProject(p), /Coverage target height/);
  }
});
test('portable export retains distinct coverage areas and target heights per floor', async () => {
  const p = fixture();
  const areaA = { points: barrierGeo([[0, 0], [15, 0], [15, 5], [5, 5], [5, 15], [0, 15]]) };
  const areaB = { points: barrierGeo([[20, 20], [30, 20], [25, 30]]) };
  p.floors[0].coverageArea = areaA;
  p.floors[0].coverageTargetHeight = 1.5;
  p.floors.push({ ...floor(p, 'coverage-level'), coverageArea: areaB, coverageTargetHeight: 4.2 });
  const sourceCameraTarget = p.floors[0].devices[0].targetHeight;
  const portable = await exportPortableProject(p);
  const reopened = normalizeProject(JSON.parse(JSON.stringify(portable)));
  assert.deepEqual(reopened.floors[0].coverageArea, areaA);
  assert.deepEqual(reopened.floors[1].coverageArea, areaB);
  assert.equal(reopened.floors[0].coverageTargetHeight, 1.5);
  assert.equal(reopened.floors[1].coverageTargetHeight, 4.2);
  assert.equal(reopened.floors[0].devices[0].targetHeight, sourceCameraTarget);
});
