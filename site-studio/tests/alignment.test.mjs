import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTwoPointAlignment,
  latLngToPlanPoint,
  planPointToLatLng,
  planProjectedSize,
} from '../src/alignment.js';

const basePlan = { lat: 41.8898, lng: -87.6366, width: 140, height: 105, rotation: 0 };
const close = (actual, expected, tolerance = 1e-7, label = '') =>
  assert.ok(Math.abs(actual - expected) <= tolerance, label + ': ' + actual + ' vs ' + expected);
const angleClose = (actual, expected) =>
  close(((actual - expected + 180) % 360 + 360) % 360 - 180, 0, 1e-7, 'rotation');
const checkSolution = (sourcePlan, expectedPlan, sources) => {
  const targets = sources.map(point => planPointToLatLng(expectedPlan, point));
  const solved = computeTwoPointAlignment(sourcePlan, sources, targets);
  close(solved.lat, expectedPlan.lat, 1e-9, 'latitude');
  close(solved.lng, expectedPlan.lng, 1e-9, 'longitude');
  close(solved.width, expectedPlan.width, 1e-5, 'width');
  close(solved.height, expectedPlan.height, 1e-5, 'height');
  angleClose(solved.rotation, expectedPlan.rotation);
  close(solved.width / solved.height, sourcePlan.width / sourcePlan.height, 1e-12, 'aspect ratio');
  sources.forEach((point, index) => {
    const result = planPointToLatLng(solved, point);
    close(result.lat, targets[index].lat, 1e-9, 'matched target latitude');
    close(result.lng, targets[index].lng, 1e-9, 'matched target longitude');
  });
  return solved;
};

test('unrotated cardinal control points have the expected geographic directions and metre width', () => {
  // Independent known equatorial longitude displacement: 50 m / mean Earth radius.
  const halfWidthDegrees = 50 / 6371008.8 * 180 / Math.PI;
  const solved = computeTwoPointAlignment(
    { ...basePlan, width: 100, height: 80 },
    [{ u: 0, v: 0.5 }, { u: 1, v: 0.5 }],
    [{ lat: 0, lng: -halfWidthDegrees }, { lat: 0, lng: halfWidthDegrees }],
  );
  close(solved.lat, 0);
  close(solved.lng, 0);
  close(solved.width, 100, 1e-7);
  close(solved.height, 80, 1e-7);
  close(solved.rotation, 0);

  const upperLeft = planPointToLatLng({ lat: 0, lng: 0, width: 100, height: 80, rotation: 0 }, { u: 0, v: 0 });
  assert.ok(upperLeft.lat > 0 && upperLeft.lng < 0, 'upper-left image corner must map northwest');
  const rightAt90 = planPointToLatLng({ lat: 0, lng: 0, width: 100, height: 80, rotation: 90 }, { u: 1, v: 0.5 });
  assert.ok(rightAt90.lat < 0, 'positive CSS rotation must turn the image right edge south');
  close(rightAt90.lng, 0);
});

test('horizontal plan baseline can match a north-to-south building edge with clockwise rotation', () => {
  const halfHeightDegrees = 50 / 6371008.8 * 180 / Math.PI;
  const solved = computeTwoPointAlignment(
    { ...basePlan, width: 100, height: 80 },
    [{ u: 0, v: 0.5 }, { u: 1, v: 0.5 }],
    [{ lat: halfHeightDegrees, lng: 0 }, { lat: -halfHeightDegrees, lng: 0 }],
  );
  close(solved.lat, 0, 1e-9);
  close(solved.lng, 0, 1e-9);
  close(solved.width, 100, 1e-5);
  angleClose(solved.rotation, 90);
});

test('translated, scaled and rotated alignment matches both selected corners', () => {
  checkSolution(basePlan, { ...basePlan, lat: 41.87874, lng: -87.63596, width: 224, height: 168, rotation: 37 },
    [{ u: 0.12, v: 0.18 }, { u: 0.83, v: 0.87 }]);
});

test('vertical source baseline works without dividing by its horizontal distance', () => {
  checkSolution({ ...basePlan, rotation: 120 }, { ...basePlan, lat: 52.52, lng: 13.405, width: 70, height: 52.5, rotation: -63 },
    [{ u: 0.4, v: 0.1 }, { u: 0.4, v: 0.9 }]);
});

test('source picking and rendered image mapping round-trip with rotation at high latitude', () => {
  const plan = { lat: 84, lng: 15.1, width: 800, height: 600, rotation: 143 };
  for (const point of [{ u: 0, v: 0 }, { u: 1, v: 1 }, { u: 0.31, v: 0.74 }, { u: 1.2, v: -0.1 }]) {
    const result = latLngToPlanPoint(plan, planPointToLatLng(plan, point));
    close(result.u, point.u, 1e-9);
    close(result.v, point.v, 1e-9);
  }
  checkSolution(basePlan, { ...plan, width: 350, height: 262.5 }, [{ u: 0.1, v: 0.2 }, { u: 0.9, v: 0.7 }]);
});

test('self alignment retains current dimensions and rotation without mutating inputs', () => {
  const plan = Object.freeze({ ...basePlan, width: 280, height: 210, rotation: -173 });
  const sources = Object.freeze([Object.freeze({ u: 0.18, v: 0.3 }), Object.freeze({ u: 0.8, v: 0.64 })]);
  const targets = Object.freeze(sources.map(point => Object.freeze(planPointToLatLng(plan, point))));
  const solved = computeTwoPointAlignment(plan, sources, targets);
  close(solved.width, plan.width, 1e-5);
  close(solved.height, plan.height, 1e-5);
  angleClose(solved.rotation, plan.rotation);
  assert.deepEqual(Object.keys(solved).sort(), ['height', 'lat', 'lng', 'rotation', 'width']);
  assert.deepEqual(plan, { ...basePlan, width: 280, height: 210, rotation: -173 });
});

test('reversing target correspondence rotates the plan by 180 degrees without mirroring', () => {
  const sources = [{ u: 0, v: 0.5 }, { u: 1, v: 0.5 }];
  const targets = sources.map(point => planPointToLatLng(basePlan, point)).reverse();
  const solved = computeTwoPointAlignment(basePlan, sources, targets);
  angleClose(solved.rotation, -180);
  close(solved.width, basePlan.width, 1e-5);
  close(solved.height, basePlan.height, 1e-5);
  assert.ok(planPointToLatLng(solved, { u: 0.5, v: 0 }).lat < solved.lat);
});

test('wrapped longitudes near the date line use the short building baseline', () => {
  const expected = { lat: 20, lng: 179.9999, width: 140, height: 105, rotation: 0 };
  const sources = [{ u: 0, v: 0.5 }, { u: 1, v: 0.5 }];
  const targets = sources.map(point => {
    const target = planPointToLatLng(expected, point);
    return { ...target, lng: ((target.lng + 180) % 360 + 360) % 360 - 180 };
  });
  const solved = computeTwoPointAlignment(basePlan, sources, targets);
  close(solved.width, expected.width, 1e-5);
  close(solved.lng, expected.lng, 1e-8);
  angleClose(solved.rotation, 0);
});

test('rejects coincident or poorly separated anchors instead of inventing a transform', () => {
  const source = [{ u: 0.1, v: 0.1 }, { u: 0.9, v: 0.9 }];
  const target = source.map(point => planPointToLatLng(basePlan, point));
  assert.throws(() => computeTwoPointAlignment(basePlan, [source[0], source[0]], target), /Plan points are too close/);
  assert.throws(() => computeTwoPointAlignment(basePlan, [{ u: 0.1, v: 0.1 }, { u: 0.10001, v: 0.10001 }], target), /Plan points are too close/);
  assert.throws(() => computeTwoPointAlignment(basePlan, source, [target[0], target[0]]), /Building points are too close/);
  assert.throws(() => computeTwoPointAlignment(basePlan, source, [{ lat: 0, lng: 0 }, { lat: 0, lng: 0.0000001 }]), /Building points are too close/);
});

test('rejects invalid coordinates, off-image anchors, and absurd resulting scales', () => {
  const source = [{ u: 0, v: 0 }, { u: 1, v: 1 }];
  const targets = source.map(point => planPointToLatLng(basePlan, point));
  for (const badPlan of [{ ...basePlan, width: NaN }, { ...basePlan, height: 0 }, { ...basePlan, lat: 90 }, { ...basePlan, rotation: Infinity }]) {
    assert.throws(() => computeTwoPointAlignment(badPlan, source, targets), RangeError);
  }
  assert.throws(() => computeTwoPointAlignment(basePlan, [], targets), /two plan points/);
  assert.throws(() => computeTwoPointAlignment(basePlan, [{ u: -0.1, v: 0 }, source[1]], targets), /inside the plan image/);
  assert.throws(() => computeTwoPointAlignment(basePlan, [{ u: NaN, v: 0 }, source[1]], targets), /valid point/);
  assert.throws(() => computeTwoPointAlignment(basePlan, source, [{ lat: 91, lng: 0 }, targets[1]]), /valid latitude/);
  assert.throws(() => computeTwoPointAlignment(basePlan, source, [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }]), /too far apart/);
  const large = { ...basePlan, width: 1500, height: 1125 };
  assert.throws(() => computeTwoPointAlignment(basePlan, source, source.map(point => planPointToLatLng(large, point))), /too small or too large/);
});

test('projected dimension helpers retain aspect ratio across map latitudes', () => {
  const equator = planProjectedSize({ ...basePlan, lat: 0 });
  const sixty = planProjectedSize({ ...basePlan, lat: 60 });
  close(sixty.width / equator.width, 2, 1e-12);
  close(sixty.height / equator.height, 2, 1e-12);
  close(sixty.width / sixty.height, basePlan.width / basePlan.height, 1e-12);
});
