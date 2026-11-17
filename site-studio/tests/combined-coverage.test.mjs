import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCombinedCoverage } from '../src/coverage.js';

const EARTH = 6371008.8, DEG = Math.PI / 180;
function location(east, north) {
  return { lat: (2 * Math.atan(Math.exp(north / EARTH)) - Math.PI / 2) / DEG, lng: east / EARTH / DEG };
}
function local(point) {
  return { x: point.lng * DEG * EARTH, y: Math.log(Math.tan(Math.PI / 4 + point.lat * DEG / 2)) * EARTH };
}
const rectangle = (left, bottom, right, top) => [[left, bottom], [right, bottom], [right, top], [left, top]].map(([x, y]) => location(x, y));
const area = rectangle(-20, -20, 20, 20);
const cameraAt = (id, x = 0, y = 0, changes = {}) => ({
  id, name: id, ...location(x, y), lens: 4, sensorWidth: 8, aspectRatio: 1,
  bearing: 0, tilt: 90, height: 10, targetHeight: 0, range: 50, ...changes,
});
const close = (actual, expected, tolerance = 0.002) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' != ' + expected);
function geographicArea(polygons) {
  return polygons.reduce((total, polygon) => {
    const points = polygon.map(local);
    let sum = 0;
    for (let i = 0; i < points.length; i++) sum += points[i].x * points[(i + 1) % points.length].y - points[i].y * points[(i + 1) % points.length].x;
    return total + Math.abs(sum) / 2;
  }, 0);
}
function conserved(result) {
  assert.equal(result.invalid, false);
  const s = result.stats;
  close(s.coveredArea, s.singleArea + s.overlapArea);
  close(s.area, s.uncoveredArea + s.singleArea + s.overlapArea);
  close(s.coveredPercent + s.uncoveredPercent, 100, 1e-7);
  close(geographicArea(result.singlePolygons), s.singleArea, 0.01);
  close(geographicArea(result.overlapPolygons), s.overlapArea, 0.01);
  close(geographicArea(result.uncoveredPolygons), s.uncoveredArea, 0.01);
}

test('two overlapping footprints count union once and overlap as a disjoint class', () => {
  const result = computeCombinedCoverage([cameraAt('A', -5), cameraAt('B', 5)], [], { area, cellSize: 1 });
  close(result.stats.area, 1600);
  close(result.stats.coveredArea, 600);
  close(result.stats.singleArea, 400);
  close(result.stats.overlapArea, 200);
  close(result.stats.uncoveredArea, 1000);
  close(result.stats.coveredPercent, 37.5);
  close(result.stats.overlapPercent, 12.5);
  assert.equal(result.stats.cameraCount, 2);
  conserved(result);
});

test('disjoint footprints remain single coverage, and outside every cone is uncovered', () => {
  const result = computeCombinedCoverage([
    cameraAt('A', -10, 0, { height: 5 }), cameraAt('B', 10, 0, { height: 5 }),
  ], [], { area, cellSize: 1 });
  close(result.stats.coveredArea, 200);
  close(result.stats.singleArea, 200);
  close(result.stats.overlapArea, 0);
  close(result.stats.uncoveredArea, 1400);
  assert.ok(result.uncoveredPolygons.length);
  conserved(result);
});

test('identical-position distinct cameras increase overlap without increasing covered area', () => {
  const one = computeCombinedCoverage([cameraAt('A')], [], { area, cellSize: 1 });
  const three = computeCombinedCoverage([cameraAt('A'), cameraAt('B'), cameraAt('C')], [], { area, cellSize: 1 });
  close(one.stats.singleArea, 400);
  close(three.stats.coveredArea, one.stats.coveredArea);
  close(three.stats.singleArea, 0);
  close(three.stats.overlapArea, 400);
  close(three.stats.uncoveredArea, 1200);
  conserved(three);
});

test('a repeated camera ID is counted once, while invalid cameras are excluded explicitly', () => {
  const result = computeCombinedCoverage([cameraAt('A'), cameraAt('A'), cameraAt('bad', 0, 0, { lens: 0 })], [], { area, cellSize: 1 });
  assert.equal(result.stats.cameraCount, 1);
  assert.equal(result.stats.excludedCameraCount, 2);
  close(result.stats.overlapArea, 0);
  assert.ok(result.warnings.some(message => message.includes('Repeated')));
  assert.ok(result.warnings.some(message => message.includes('invalid settings')));
  conserved(result);
});

test('zero eligible cameras makes the entire AOI uncovered, not an empty denominator', () => {
  const zero = computeCombinedCoverage([], [], { area });
  close(zero.stats.area, 1600);
  close(zero.stats.uncoveredArea, 1600);
  close(zero.stats.uncoveredPercent, 100);
  assert.equal(zero.stats.sampledCells, 0);
  assert.equal(zero.uncoveredPolygons.length, 1);
  conserved(zero);
  const far = computeCombinedCoverage([cameraAt('Far', 500, 500)], [], { area });
  assert.equal(far.stats.cameraCount, 1);
  close(far.stats.uncoveredPercent, 100);
  conserved(far);
});

test('common target height overrides individual settings without mutating cameras', () => {
  const camera = Object.freeze(cameraAt('A', 0, 0, { targetHeight: 9 }));
  const ground = computeCombinedCoverage([camera], [], { area, targetHeight: 0, cellSize: 1 });
  const raised = computeCombinedCoverage([camera], [], { area, targetHeight: 5, cellSize: 1 });
  close(ground.stats.coveredArea, 400);
  close(raised.stats.coveredArea, 100);
  assert.equal(camera.targetHeight, 9);
  assert.equal(raised.stats.targetHeight, 5);
  const tooHigh = computeCombinedCoverage([camera], [], { area, targetHeight: 10 });
  assert.equal(tooHigh.stats.cameraCount, 0);
  assert.equal(tooHigh.stats.excludedCameraCount, 1);
  close(tooHigh.stats.uncoveredPercent, 100);
  assert.ok(tooHigh.warnings.some(message => message.includes('not below the lens')));
  conserved(raised);
});

test('a second camera fills the first camera wall shadow', () => {
  const narrowArea = rectangle(-1, 5, 1, 7);
  const optics = { height: 3, tilt: 45, lens: 6.4, sensorWidth: 6.4, aspectRatio: 1 };
  const first = cameraAt('North', 0, 0, optics);
  const second = cameraAt('South', 0, 10, { ...optics, bearing: 180 });
  const wall = { id: 'W', name: 'Wall', kind: 'wall', height: 4, points: [location(-10, 4), location(10, 4)] };
  const blocked = computeCombinedCoverage([first], [wall], { area: narrowArea, cellSize: 0.25 });
  const filled = computeCombinedCoverage([first, second], [wall], { area: narrowArea, cellSize: 0.25 });
  close(blocked.stats.uncoveredPercent, 100);
  close(filled.stats.coveredPercent, 100);
  close(filled.stats.singleArea, 4);
  close(filled.stats.overlapArea, 0);
  conserved(filled);
});

test('finite wall height and common target plane affect combined visibility', () => {
  const targetArea = rectangle(-1, 11, 1, 14);
  const first = cameraAt('A', 0, 0, { height: 3, tilt: 25, lens: 3.2, sensorWidth: 6.4, aspectRatio: 1 });
  const wall = { id: 'W', kind: 'wall', height: 1, points: [location(-10, 10), location(10, 10)] };
  const ground = computeCombinedCoverage([first], [wall], { area: targetArea, targetHeight: 0, cellSize: 0.25 });
  const elevated = computeCombinedCoverage([first], [wall], { area: targetArea, targetHeight: 1, cellSize: 0.25 });
  close(ground.stats.uncoveredPercent, 100);
  close(elevated.stats.coveredPercent, 100);
  conserved(elevated);
});

test('concave AOI cutouts are excluded from both the denominator and polygons', () => {
  const concave = [[-20, -20], [20, -20], [20, 0], [0, 0], [0, 20], [-20, 20]].map(([x, y]) => location(x, y));
  const result = computeCombinedCoverage([cameraAt('A')], [], { area: concave, cellSize: 1 });
  close(result.stats.area, 1200);
  close(result.stats.singleArea, 300);
  close(result.stats.uncoveredArea, 900);
  conserved(result);
  for (const polygon of [...result.singlePolygons, ...result.uncoveredPolygons]) {
    const points = polygon.map(local);
    const center = { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
    assert.ok(center.x <= 1e-6 || center.y <= 1e-6, 'No returned piece may fill the NE cutout.');
  }
  const reversed = computeCombinedCoverage([cameraAt('A')], [], { area: [...concave].reverse(), cellSize: 1 });
  close(reversed.stats.coveredArea, result.stats.coveredArea);
});

test('a coarse cell uses a point inside a disconnected concave intersection', () => {
  const uShape = [[-15, -15], [15, -15], [15, 15], [5, 15], [5, -5], [-5, -5], [-5, 15], [-15, 15]].map(([x, y]) => location(x, y));
  const result = computeCombinedCoverage([cameraAt('Cutout only', 0, 0, { height: 4 })], [], { area: uShape, maxCells: 1 });
  close(result.stats.area, 700);
  close(result.stats.coveredArea, 0);
  close(result.stats.uncoveredArea, 700);
  assert.equal(result.stats.sampledCells, 1);
  assert.equal(result.uncoveredPolygons.length, 1);
  conserved(result);
});

test('cameras and occluding walls outside the AOI remain relevant', () => {
  const targetArea = rectangle(-2, 16, 2, 24);
  const camera = cameraAt('Outside', 0, 0, { height: 3, tilt: 25, lens: 3.2, sensorWidth: 6.4, aspectRatio: 1 });
  const wall = { id: 'Outside wall', kind: 'wall', height: 4, points: [location(-10, 10), location(10, 10)] };
  const clear = computeCombinedCoverage([camera], [], { area: targetArea, cellSize: 0.5 });
  const blocked = computeCombinedCoverage([camera], [wall], { area: targetArea, cellSize: 0.5 });
  close(clear.stats.coveredArea, 32);
  close(blocked.stats.uncoveredArea, 32);
  conserved(blocked);
});

test('AOI validation rejects malformed outlines and tolerates redundant boundary vertices', () => {
  const malformed = [
    [], [location(0, 0), location(1, 1)],
    [location(0, 0), location(1, 1), location(2, 2)],
    [location(-10, -10), location(10, 10), location(-10, 10), location(10, -5)],
    [{ lat: 91, lng: 0 }, location(10, 0), location(0, 10)],
  ];
  for (const badArea of malformed) {
    const result = computeCombinedCoverage([cameraAt('A')], [], { area: badArea });
    assert.equal(result.invalid, true);
    assert.equal(result.singlePolygons.length, 0);
    assert.ok(result.warnings.length);
  }
  const redundant = [area[0], location(0, -20), area[1], { ...area[1] }, area[2], area[3], { ...area[0] }];
  const valid = computeCombinedCoverage([cameraAt('A')], [], { area: redundant, cellSize: 1 });
  close(valid.stats.area, 1600);
  conserved(valid);
});

test('sampling work is bounded across all cameras and barrier edges', () => {
  const cameras = Array.from({ length: 10 }, (_, i) => cameraAt('C-' + i, (i - 5) * 0.2, 0));
  const walls = Array.from({ length: 20 }, (_, i) => ({
    id: 'W-' + i, kind: 'wall', height: 0.1,
    points: Array.from({ length: 20 }, (_, j) => location(-10 + j, -5 + i * 0.5 + (j % 2) * 0.02)),
  }));
  const result = computeCombinedCoverage(cameras, walls, { area, cellSize: 0.25, maxCells: 2000 });
  assert.equal(result.invalid, false);
  assert.ok(result.stats.sampledCells <= 2000);
  assert.ok(result.stats.cameraTests + result.stats.intersectionTests <= 2_000_000);
  assert.ok(result.warnings.some(message => message.includes('sampled at')));
  conserved(result);
});

test('dense model preparation refuses safely before unbounded edge allocations', () => {
  const cameras = Array.from({ length: 20 }, (_, i) => cameraAt('C-' + i));
  const walls = Array.from({ length: 100 }, (_, i) => ({
    id: 'W-' + i, kind: 'wall', height: 1,
    points: Array.from({ length: 100 }, (_, j) => location(-5 + j * 0.1, -5 + i * 0.1 + (j % 2) * 0.01)),
  }));
  const result = computeCombinedCoverage(cameras, walls, { area });
  assert.equal(result.invalid, true);
  assert.ok(result.warnings.some(message => message.includes('too many camera and obstacle')));
  assert.equal(result.singlePolygons.length, 0);
  assert.equal(result.stats.cameraCount, 20);
  assert.equal(result.stats.sampledCells, 0);
});
