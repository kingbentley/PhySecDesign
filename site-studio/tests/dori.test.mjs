import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCameraCoverage, computeCombinedCoverage } from '../src/coverage.js';
import { doriBand } from '../src/dori.js';
import { createDemoProject, exportPortableProject, normalizeProject } from '../src/projectModel.js';

const degreesPerMetre = 180 / (Math.PI * 6371008.8);
const at = (east, north) => ({ lat: north * degreesPerMetre, lng: east * degreesPerMetre });
const camera = {
  id: 'C-01', ...at(0, 0), lens: 4, sensorWidth: 8, aspectRatio: 1,
  bearing: 0, tilt: 90, height: 10, targetHeight: 0, range: 50,
};
const area = [at(-12, -6), at(12, -6), at(12, 6), at(-12, 6)];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.0001, `${actual} != ${expected}`);

test('DORI bands include their minimum horizontal pixel density', () => {
  for (const [threshold, band] of [[25, 2], [63, 3], [125, 4], [250, 5]]) {
    assert.equal(doriBand(threshold - 0.001), band - 1);
    assert.equal(doriBand(threshold), band);
  }
});

test('camera DORI separates an occluded sample from visible detail below Detect', () => {
  const wall = { id: 'W-01', kind: 'wall', height: 9, points: [at(4, -20), at(4, 20)] };
  const result = computeCameraCoverage({ ...camera, imageWidth: 320 }, [wall], { dori: true });
  assert.equal(result.invalid, false);
  assert.ok(result.dori[0].area > 0 && result.dori[0].polygons.length > 0);
  assert.ok(result.dori[1].area > 0 && result.dori[1].polygons.length > 0);
  close(result.dori[0].area, result.stats.blockedArea);
  close(result.dori[1].area, result.stats.visibleArea);
  assert.ok(result.dori.slice(2).every(band => band.area === 0));
});

test('combined DORI takes the best unobstructed level, even after two overlaps', () => {
  const first = { ...camera, imageWidth: 1000 };
  const second = { ...first, id: 'C-02' };
  const third = { ...first, id: 'C-03', imageWidth: 5200 };
  const options = { area, dori: true, cellSize: 1 };
  const two = computeCombinedCoverage([first, second], [], options);
  assert.ok(two.stats.overlapArea > 0);
  close(two.dori[2].area, two.stats.coveredArea);
  assert.ok(two.dori.slice(3).every(band => band.area === 0));
  const three = computeCombinedCoverage([first, second, third], [], options);
  close(three.dori[5].area, two.stats.coveredArea);
  close(three.dori[0].area, three.stats.uncoveredArea);
  close(three.dori.reduce((sum, band) => sum + band.area, 0), three.stats.area);
  const wall = { id: 'W-01', kind: 'wall', height: 9, points: [at(4, -20), at(4, 20)] };
  const blocked = computeCombinedCoverage([first, second, third], [wall], options);
  assert.ok(blocked.dori[0].area > three.dori[0].area);
  assert.ok(blocked.dori[5].area < three.dori[5].area);
  close(blocked.dori[5].area, blocked.stats.coveredArea);
});

test('display contours trace diagonal camera boundaries, clip to a concave area and preserve sample totals', () => {
  const boundary = [at(0, 0), at(22, 0), at(22, 12), at(12, 12), at(12, 22), at(0, 22)];
  const diagonal = { ...camera, bearing: 50, tilt: 26, height: 4, imageWidth: 2688 };
  const options = { area: boundary, cellSize: 1.5, dori: true };
  const sampled = computeCombinedCoverage([diagonal], [], options);
  const displayed = computeCombinedCoverage([diagonal], [], { ...options, contours: true });
  assert.deepEqual(displayed.stats, sampled.stats);
  assert.deepEqual(displayed.dori.map(band => band.area), sampled.dori.map(band => band.area));
  assert.ok(displayed.contours[0].length > 0);
  const covered = displayed.contours.slice(2).flat();
  assert.ok(covered.length > 0);
  assert.ok(covered.some(polygon => polygon.some((point, i) => {
    const next = polygon[(i + 1) % polygon.length];
    return Math.abs(point.lat - next.lat) > 1e-7 && Math.abs(point.lng - next.lng) > 1e-7;
  })));

  const pieces = displayed.contours.flat();
  let totalArea = 0;
  for (const ring of pieces) {
    for (const point of ring) {
      const east = point.lng / degreesPerMetre;
      const north = point.lat / degreesPerMetre;
      assert.ok(east >= -1e-5 && east <= 22.00001 && north >= -1e-5 && north <= 22.00001);
      assert.ok(east <= 12.00001 || north <= 12.00001, 'contours must preserve the cutout');
    }
    totalArea += ring.reduce((sum, point, index) => {
      const next = ring[(index + 1) % ring.length];
      return sum + (point.lng * next.lat - next.lng * point.lat) / (2 * degreesPerMetre ** 2);
    }, 0);
  }
  close(totalArea, displayed.stats.area);
});

test('resolution defaults for older cameras and a custom stream width survives export', async () => {
  const project = createDemoProject();
  const floor = project.floors[0];
  floor.plan.url = 'data:image/png;base64,iVBORw0KGgo=';
  const [first, second] = floor.devices.filter(device => device.type === 'camera');
  delete first.imageWidth;
  delete second.imageWidth;
  second.catalogId = 'camera-bullet-8mp';
  const migrated = normalizeProject(project);
  const cameras = migrated.floors[0].devices.filter(device => device.type === 'camera');
  assert.deepEqual(cameras.slice(0, 2).map(device => device.imageWidth), [2688, 3840]);
  cameras[0].imageWidth = 1920;
  const exported = await exportPortableProject(migrated);
  assert.equal(normalizeProject(exported).floors[0].devices.find(device => device.id === first.id).imageWidth, 1920);
  cameras[0].imageWidth = 1920.5;
  assert.throws(() => normalizeProject(migrated), /whole number/);
});
