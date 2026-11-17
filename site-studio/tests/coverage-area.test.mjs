import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCoverageArea } from '../src/coverageArea.js';
import { planPointToLatLng, latLngToPlanPoint } from '../src/alignment.js';
import { computeCameraCoverage } from '../src/coverage.js';
import { createBlankPlan } from '../src/projectModel.js';

const EARTH = 6371008.8, DEG = Math.PI / 180;
const wrap = value => ((value + 180) % 360 + 360) % 360 - 180;
const approx = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
function localPoint(east, north, origin) {
  const factor = EARTH * Math.cos(origin.lat * DEG);
  const y = Math.log(Math.tan(Math.PI / 4 + origin.lat * DEG / 2)) + north / factor;
  return { lat: (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG, lng: wrap(origin.lng + east / factor / DEG) };
}
function localBounds(points, origin) {
  const factor = EARTH * Math.cos(origin.lat * DEG);
  const originY = Math.log(Math.tan(Math.PI / 4 + origin.lat * DEG / 2));
  const local = points.map(point => ({
    x: wrap(point.lng - origin.lng) * DEG * factor,
    y: (Math.log(Math.tan(Math.PI / 4 + point.lat * DEG / 2)) - originY) * factor,
  }));
  return {
    left: Math.min(...local.map(point => point.x)), right: Math.max(...local.map(point => point.x)),
    bottom: Math.min(...local.map(point => point.y)), top: Math.max(...local.map(point => point.y)),
  };
}
function contains(area, point, origin) {
  const bounds = localBounds(area.points, origin);
  const location = localBounds([point], origin);
  return location.left >= bounds.left - 1e-6 && location.right <= bounds.right + 1e-6
    && location.bottom >= bounds.bottom - 1e-6 && location.top <= bounds.top + 1e-6;
}
function finiteMapArea(area) {
  assert.ok(area.points.length >= 3);
  for (const point of area.points) {
    assert.ok(Number.isFinite(point.lat) && Math.abs(point.lat) <= 85);
    assert.ok(Number.isFinite(point.lng) && point.lng >= -180 && point.lng < 180);
  }
}

test('an imported plan uses its rotated, scaled corners ahead of camera surroundings', () => {
  const plan = Object.freeze({ ...createBlankPlan({ lat: 41.89, lng: -87.63 }), url: '/assets/plan.png', width: 240, height: 75, rotation: 37 });
  const cameras = Object.freeze([Object.freeze({ lat: 40, lng: -86, range: 150 })]);
  const area = defaultCoverageArea(plan, cameras);
  assert.equal(area.source, 'Site plan extent');
  const uv = [{ u: 0, v: 0 }, { u: 1, v: 0 }, { u: 1, v: 1 }, { u: 0, v: 1 }];
  area.points.forEach((point, index) => {
    const expected = planPointToLatLng(plan, uv[index]);
    approx(point.lat, expected.lat);
    approx(point.lng, expected.lng);
    const imagePoint = latLngToPlanPoint(plan, point);
    approx(imagePoint.u, uv[index].u);
    approx(imagePoint.v, uv[index].v);
  });
  assert.notEqual(area.points[0].lat, area.points[1].lat, 'Rotation must remain in the area shape.');
  finiteMapArea(area);
});

test('camera surroundings contain range circles and frusta in every direction', () => {
  const origin = { lat: 41.89, lng: -87.63 };
  const cameras = Object.freeze([
    Object.freeze({ ...origin, range: 40 }),
    Object.freeze({ ...localPoint(95, -70, origin), range: 150 }),
  ]);
  const plan = Object.freeze(createBlankPlan(origin));
  const area = defaultCoverageArea(plan, cameras);
  assert.equal(area.source, 'Camera surroundings');
  for (const camera of cameras) {
    for (let bearing = 0; bearing < 360; bearing += 15) {
      const edge = localPoint(camera.range * Math.sin(bearing * DEG), camera.range * Math.cos(bearing * DEG), camera);
      assert.ok(contains(area, edge, origin), `Range edge ${bearing}° must be inside.`);
      const coverage = computeCameraCoverage({ ...camera, bearing, tilt: 10, lens: 3.2, sensorWidth: 6.4 }, [], { maxCells: 1 });
      assert.ok(coverage.nominalPolygons.length, 'The fixture camera must intersect the target plane.');
      for (const polygon of coverage.nominalPolygons) {
        for (const point of polygon) assert.ok(contains(area, point, origin), `Frustum ${bearing}° must be inside.`);
      }
    }
  }
  const singleBounds = localBounds(defaultCoverageArea(null, [cameras[0]]).points, cameras[0]);
  approx(singleBounds.left, -42, 1e-5);
  approx(singleBounds.top, 42, 1e-5);
  finiteMapArea(area);
});

test('camera and plan areas stay local across the date line', () => {
  const origin = { lat: 10, lng: 179.9997 };
  const cameras = [{ ...origin, range: 60 }, { lat: 10.0002, lng: -179.9997, range: 80 }];
  for (const ordered of [cameras, [...cameras].reverse()]) {
    const area = defaultCoverageArea(null, ordered);
    const bounds = localBounds(area.points, origin);
    assert.ok(bounds.right - bounds.left < 500, 'Date-line wrapping must not create a world-sized area.');
    for (const camera of cameras) {
      for (const [east, north] of [[camera.range, 0], [-camera.range, 0], [0, camera.range], [0, -camera.range]]) {
        assert.ok(contains(area, localPoint(east, north, camera), origin));
      }
    }
    finiteMapArea(area);
  }
  const plan = { ...createBlankPlan(origin), url: '/assets/plan.png', width: 300, height: 150, rotation: -25 };
  const planArea = defaultCoverageArea(plan, []);
  assert.equal(planArea.source, 'Site plan extent');
  assert.ok(planArea.points.some(point => point.lng < 0) && planArea.points.some(point => point.lng > 0));
  assert.ok(localBounds(planArea.points, origin).right - localBounds(planArea.points, origin).left < 500);
  finiteMapArea(planArea);
});

test('zero cameras use the blank map extent and retain valid zero coordinates', () => {
  const blank = Object.freeze({ ...createBlankPlan({ lat: 0, lng: 0 }), width: 180, height: 90, rotation: 15 });
  const area = defaultCoverageArea(blank, []);
  assert.equal(area.source, 'Map area');
  const upperLeft = planPointToLatLng(blank, { u: 0, v: 0 });
  approx(area.points[0].lat, upperLeft.lat);
  approx(area.points[0].lng, upperLeft.lng);
  const empty = defaultCoverageArea();
  const fallback = defaultCoverageArea(createBlankPlan(), []);
  assert.deepEqual(empty, fallback);
  finiteMapArea(area);
  finiteMapArea(empty);
});

test('invalid inputs cannot produce nonfinite areas, and finite ranges are constrained', () => {
  const origin = { lat: 0, lng: 0 };
  for (const [range, expectedRadius] of [[0, 3], [-10, 3], [1000, 152], [undefined, 30]]) {
    const bounds = localBounds(defaultCoverageArea(null, [{ ...origin, range }]).points, origin);
    approx(bounds.left, -expectedRadius, 1e-5);
    approx(bounds.right, expectedRadius, 1e-5);
  }
  const invalid = Object.freeze([null, Object.freeze({ lat: 90, lng: 0, range: 20 }), Object.freeze({ lat: 0, lng: NaN, range: 20 }), Object.freeze({ ...origin, range: Infinity }), Object.freeze({ ...origin, range: '30' })]);
  const area = defaultCoverageArea({ url: 'invalid', lat: NaN, lng: 0, width: Infinity, height: 20 }, invalid);
  assert.equal(area.source, 'Map area');
  assert.deepEqual(area, defaultCoverageArea());
  for (const lat of [-85, 85]) {
    finiteMapArea(defaultCoverageArea(null, [{ lat, lng: 180, range: 150 }]));
    finiteMapArea(defaultCoverageArea({ ...createBlankPlan({ lat, lng: 180 }), url: '/assets/plan.png', rotation: 35, width: 100000, height: 100000 }, []));
  }
});
