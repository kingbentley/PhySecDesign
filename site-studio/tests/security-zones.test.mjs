import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCombinedCoverage } from '../src/coverage.js';
import { createBlankPlan, createDemoProject, exportPortableProject, normalizeProject, normalizeSecurityZone } from '../src/projectModel.js';
import { zoneCoverage } from '../src/securityZones.js';

const metresToDegrees = 180 / (Math.PI * 6371008.8);
const at = (x, y) => ({ lat: y * metresToDegrees, lng: x * metresToDegrees });
const zone = {
  id: 'zone-1', name: 'Main entrance', type: 'entrance',
  targetLevel: 'identify', targetPercent: 90,
  points: [at(-8, -6), at(8, -6), at(8, 6), at(-8, 6)],
};
const camera = {
  id: 'C-01', ...at(0, 0), lens: 4, sensorWidth: 8, aspectRatio: 1,
  height: 10, targetHeight: 0, range: 50, bearing: 0, tilt: 90, imageWidth: 5200,
};

function evaluate(cameras, walls = [], requirement = zone) {
  return zoneCoverage(requirement, computeCombinedCoverage(cameras, walls, {
    area: zone.points, targetHeight: 0, dori: true, contours: true, cellSize: 1,
  }));
}

test('Identify zone combines best unobstructed coverage and includes lower-detail area in the gaps', () => {
  const strong = evaluate([camera]);
  assert.equal(strong.meets, true);
  assert.ok(strong.percent > 99.9);
  assert.equal(strong.gapPolygons.length, 0);

  const weak = { ...camera, id: 'C-02', imageWidth: 1000 };
  assert.equal(evaluate([weak]).percent, 0);
  const detect = evaluate([camera, weak], [], { ...zone, targetLevel: 'detect' });
  assert.equal(detect.meets, true, 'higher levels also meet a Detect requirement');
  const wall = { id: 'wall', kind: 'wall', height: 9, points: [at(4, -20), at(4, 20)] };
  const obstructed = evaluate([camera, weak], [wall]);
  assert.equal(obstructed.meets, false);
  assert.ok(obstructed.percent > 0 && obstructed.percent < 90);
  assert.ok(obstructed.gapPolygons.length && obstructed.qualifyingPolygons.length);
  assert.equal(evaluate([]).percent, 0);
  assert.equal(evaluate([camera], [], { ...zone, targetLevel: null }), null);
});

test('zones round-trip independently of the floor analysis boundary and legacy projects default to no zones', async () => {
  const project = createDemoProject();
  const first = project.floors[0];
  first.plan.url = 'data:image/png;base64,iVBORw0KGgo=';
  delete first.zones;
  assert.deepEqual(normalizeProject(project).floors[0].zones, []);
  first.zones = [zone];
  first.coverageArea = { points: [at(0, 0), at(30, 0), at(10, 20)] };
  project.floors.push({ id: 'floor-other', buildingId: first.buildingId, name: 'Second floor', plan: createBlankPlan(), devices: [] });
  const exported = await exportPortableProject(project);
  const restored = normalizeProject(exported);
  assert.deepEqual(restored.floors[0].zones, [zone]);
  assert.deepEqual(restored.floors[0].coverageArea, first.coverageArea);
  assert.deepEqual(restored.floors[1].zones, []);
});

test('zone records reject crossing outlines and invalid requirements', () => {
  const [a, b, c, d] = zone.points;
  assert.throws(() => normalizeSecurityZone({ ...zone, points: [a, c, b, d] }), /crossing/);
  assert.throws(() => normalizeSecurityZone({ ...zone, targetLevel: 'track' }), /DORI target/);
  assert.throws(() => normalizeSecurityZone({ ...zone, targetPercent: 101 }), /Required zone coverage/);
  assert.throws(() => normalizeSecurityZone({ ...zone, name: '  ' }), /name/);
});
