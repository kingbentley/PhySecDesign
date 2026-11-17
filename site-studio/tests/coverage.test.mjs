import test from 'node:test';
import assert from 'node:assert/strict';
import { horizontalFov, focalLength, cameraDefaults, computeCameraCoverage, classifyCoveragePoint } from '../src/coverage.js';

const EARTH = 6371008.8, DEG = Math.PI / 180;
const camera = { id: 'C-01', lat: 41.89, lng: -87.63, bearing: 0, lens: 3.2, sensorWidth: 6.4, aspectRatio: 1, height: 3, targetHeight: 0, tilt: 25, range: 50 };
function point(east, north, origin = camera) {
  const scale = EARTH * Math.cos(origin.lat * DEG);
  const y = Math.log(Math.tan(Math.PI / 4 + origin.lat * DEG / 2)) + north / scale;
  return { lat: (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG, lng: ((origin.lng + east / scale / DEG + 180) % 360 + 360) % 360 - 180 };
}
const wall = (height, distance = 10, origin = camera) => ({ id: 'W-1', name: 'Test wall', kind: 'wall', enabled: true, height, points: [point(-10, distance, origin), point(10, distance, origin)] });
const obstacle = (height, origin = camera) => ({ id: 'O-1', name: 'Test building', kind: 'obstacle', height, enabled: true, points: [point(-2, 10, origin), point(2, 10, origin), point(2, 20, origin), point(-2, 20, origin)] });
const approx = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' != ' + expected);
function areaConsistent(result) {
  approx(result.stats.visibleArea + result.stats.blockedArea, result.stats.nominalArea, 1e-5);
  assert.ok(result.stats.blockedPercent >= 0 && result.stats.blockedPercent <= 100 + 1e-7);
}

test('rectilinear optics round-trip and lens remains the physical source of HFOV', () => {
  approx(horizontalFov(3.2, 6.4), 90);
  approx(focalLength(90, 6.4), 3.2);
  for (const lens of [0.7, 2.8, 4, 12, 80]) approx(focalLength(horizontalFov(lens, 6.4), 6.4), lens);
  assert.ok(horizontalFov(8, 6.4) < horizontalFov(4, 6.4));
  assert.ok(horizontalFov(4, 12.8) > horizontalFov(4, 6.4));
  approx(cameraDefaults({ ...camera, fov: 15 }).fov, 90);
  assert.throws(() => horizontalFov(0), RangeError);
  assert.throws(() => focalLength(180), RangeError);
});

test('bearing and lens change the actual target-plane frustum', () => {
  assert.ok(classifyCoveragePoint(camera, point(0, 20)).visible);
  assert.ok(!classifyCoveragePoint(camera, point(0, -20)).inFrustum);
  assert.ok(classifyCoveragePoint({ ...camera, bearing: 90 }, point(20, 0)).visible);
  assert.ok(!classifyCoveragePoint({ ...camera, bearing: 90 }, point(0, 20)).inFrustum);
  assert.ok(classifyCoveragePoint(camera, point(5, 10)).inFrustum);
  assert.ok(!classifyCoveragePoint({ ...camera, lens: 12.8 }, point(5, 10)).inFrustum);
  assert.ok(!classifyCoveragePoint(camera, point(0, 51)).inFrustum);
});

test('vertical frustum bounds produce the analytic near and far plane intersections', () => {
  const narrow = { ...camera, lens: 6.4, tilt: 45 };
  const result = computeCameraCoverage(narrow, []);
  approx(result.stats.nearBlindDistance, 1);
  approx(result.stats.farGroundDistance, 9);
  assert.ok(!classifyCoveragePoint(narrow, point(0, 0.9)).inFrustum);
  assert.ok(classifyCoveragePoint(narrow, point(0, 1.1)).inFrustum);
  assert.ok(classifyCoveragePoint(narrow, point(0, 8.9)).inFrustum);
  assert.ok(!classifyCoveragePoint(narrow, point(0, 9.1)).inFrustum);
  approx(result.stats.nominalArea, 32 * Math.SQRT2, 1e-5);
  const elevated = computeCameraCoverage({ ...narrow, targetHeight: 1 }, []);
  approx(elevated.stats.nearBlindDistance, 2 / 3);
  approx(elevated.stats.farGroundDistance, 6);
  assert.ok(elevated.stats.nominalArea < result.stats.nominalArea);
  areaConsistent(result);
});

test('nadir view is a centered rectangle, not a sector, with known area', () => {
  const downward = { ...camera, tilt: 90, aspectRatio: 2 };
  const result = computeCameraCoverage(downward, [], { cellSize: 0.75, maxCells: 6000 });
  approx(result.stats.nominalArea, 18, 1e-5); // 6 m x 3 m.
  approx(result.stats.nearBlindDistance, 0);
  assert.equal(result.nearBlindPolygons.length, 0);
  assert.ok(classifyCoveragePoint(downward, point(2.9, 1.4)).visible);
  assert.ok(classifyCoveragePoint(downward, point(-2.9, -1.4)).visible);
  assert.ok(!classifyCoveragePoint(downward, point(3.1, 0)).inFrustum);
  assert.ok(!classifyCoveragePoint(downward, point(0, 1.6)).inFrustum);
  areaConsistent(result);
});

test('low wall shadow ends when the ray passes above its top', () => {
  const low = wall(1);
  assert.ok(classifyCoveragePoint(camera, point(0, 12), [low]).blocked); // z=.5 at wall.
  assert.ok(classifyCoveragePoint(camera, point(0, 20), [low]).visible); // z=1.5 at wall.
  assert.ok(classifyCoveragePoint(camera, point(0, 8), [wall(4)]).visible); // Target in front.
  assert.ok(classifyCoveragePoint(camera, point(0, 20), [wall(4)]).blocked);
  const tallTarget = { ...camera, targetHeight: 1.5 };
  assert.ok(classifyCoveragePoint(tallTarget, point(0, 20), [low]).visible);
});

test('higher wall heights monotonically increase blocked sampled area', () => {
  const results = [0.5, 1, 2, 4].map(height => computeCameraCoverage(camera, [wall(height)], { cellSize: 1, maxCells: 6000 }));
  results.forEach(areaConsistent);
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i].stats.blockedArea >= results[i - 1].stats.blockedArea - 1e-6);
    approx(results[i].stats.nominalArea, results[0].stats.nominalArea, 1e-5);
  }
});

test('solid obstacle interval checks top crossings, footprint targets, and grazing corners', () => {
  const solid = obstacle(1);
  assert.ok(classifyCoveragePoint(camera, point(0, 25), [solid]).blocked); // z=.6 at exit.
  assert.ok(classifyCoveragePoint(camera, point(0, 40), [solid]).visible); // z=1.5 at exit.
  assert.ok(classifyCoveragePoint(camera, point(0, 15), [solid]).blocked);
  assert.ok(classifyCoveragePoint(camera, point(10, 25), [solid]).visible);
  assert.ok(classifyCoveragePoint(camera, point(5, 25), [obstacle(4)]).blocked); // Touches corner.
});

test('lens inside a solid blocks all nominal coverage; above the roof can see beyond it', () => {
  const around = height => ({ ...obstacle(height), points: [point(-2, -2), point(2, -2), point(2, 2), point(-2, 2)] });
  const buried = computeCameraCoverage(camera, [around(4)]);
  approx(buried.stats.blockedPercent, 100);
  assert.equal(buried.visiblePolygons.length, 0);
  assert.ok(buried.warnings.some(message => message.includes('inside')));
  const above = around(1);
  assert.ok(classifyCoveragePoint(camera, point(0, 20), [above]).visible);
  assert.ok(classifyCoveragePoint(camera, point(0, 1.5), [above]).blocked);
  assert.ok(computeCameraCoverage(camera, [above]).warnings.some(message => message.includes('above')));
});

test('duplicate obstacle vertices do not make every point count as inside', () => {
  const solid = obstacle(1);
  solid.points.splice(2, 0, { ...solid.points[1] });
  const result = computeCameraCoverage(camera, [solid]);
  assert.ok(!result.warnings.some(message => message.includes('lens is inside')));
  assert.ok(result.stats.visibleArea > 0);
  assert.ok(classifyCoveragePoint(camera, point(0, 40), [solid]).visible);
});

test('barriers near the lens can occlude even when their ground point is in the near blind zone', () => {
  const tilted = { ...camera, lens: 6.4, tilt: 45 };
  assert.ok(!classifyCoveragePoint(tilted, point(0, 0.5)).inFrustum);
  assert.ok(classifyCoveragePoint(tilted, point(0, 5), [wall(3, 0.5)]).blocked);
  const behind = wall(4, -10);
  assert.ok(classifyCoveragePoint(tilted, point(0, 5), [behind]).visible);
});

test('disabled, partial, collinear, and self-crossing drafts are safe', () => {
  const plain = computeCameraCoverage(camera, []);
  const invalid = [
    { ...wall(4), enabled: false },
    { ...wall(4), points: [point(0, 1)] },
    { ...obstacle(4), points: [point(0, 5), point(0, 10), point(0, 15)] },
    { ...obstacle(4), points: [point(-3, 10), point(3, 20), point(-3, 18), point(2, 10)] },
  ];
  const result = computeCameraCoverage(camera, invalid);
  assert.equal(result.invalid, false);
  assert.ok(result.warnings.some(message => message.includes('invalid geometry')));
  approx(result.stats.visibleArea, plain.stats.visibleArea, 1e-5);
  approx(result.stats.blockedArea, 0);
});

test('date-line wrapping preserves local coverage and obstruction intersections', () => {
  const crossing = { ...camera, lat: 20, lng: 179.9999, bearing: 90 };
  const target = point(20, 0, crossing);
  assert.ok(target.lng < 0);
  assert.ok(classifyCoveragePoint(crossing, target).visible);
  const across = { ...wall(4), points: [point(10, -5, crossing), point(10, 5, crossing)] };
  assert.ok(classifyCoveragePoint(crossing, target, [across]).blocked);
  const result = computeCameraCoverage(crossing, [across]);
  for (const polygon of [...result.visiblePolygons, ...result.blockedPolygons]) {
    assert.ok(polygon.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180));
  }
  areaConsistent(result);
});

test('sampling and edge work remain bounded for dense layouts', () => {
  const dense = Array.from({ length: 100 }, (_, i) => ({
    id: 'W-' + i, kind: 'wall', height: 0.1, enabled: true,
    points: Array.from({ length: 100 }, (_, j) => point(-20 + j * 0.4, 10 + i * 0.1 + (j % 2) * 0.02)),
  }));
  const result = computeCameraCoverage(camera, dense, { cellSize: 0.25, maxCells: 6000 });
  assert.ok(result.stats.sampledCells <= 6000);
  assert.ok(result.stats.intersectionTests <= 1_500_000);
  assert.ok(result.warnings.some(message => message.includes('sampled at')));
  assert.ok(result.visiblePolygons.length + result.blockedPolygons.length <= result.stats.sampledCells);
  areaConsistent(result);
});

test('invalid camera settings return a clear empty analysis rather than misleading coverage', () => {
  for (const change of [{ lens: 0 }, { height: 3, targetHeight: 3 }, { lat: 90 }, { tilt: 91 }, { aspectRatio: 0 }]) {
    const result = computeCameraCoverage({ ...camera, ...change }, []);
    assert.equal(result.invalid, true);
    assert.equal(result.visiblePolygons.length, 0);
    assert.equal(result.blockedPolygons.length, 0);
    assert.ok(result.warnings.length);
  }
});
