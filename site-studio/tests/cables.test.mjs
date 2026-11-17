import test from 'node:test';
import assert from 'node:assert/strict';
import { CABLE_TYPES, routePoints, routeLengthMeters, routeBillableMeters } from '../src/cables.js';

const devices = [{ id: 'A', lat: 0, lng: 0 }, { id: 'B', lat: 0, lng: 0.001 }];
const route = { id: 'R-1', fromDeviceId: 'A', toDeviceId: 'B', via: [], cableType: 'cat6', slackPercent: 15 };

test('route endpoint positions are derived from current devices without mutating inputs', () => {
  const points = routePoints(route, devices);
  assert.deepEqual(points, [{ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }]);
  points[0].lat = 10;
  assert.equal(devices[0].lat, 0);
  const moved = devices.map(device => device.id === 'B' ? { ...device, lng: 0.002 } : device);
  assert.ok(Math.abs(routeLengthMeters(route, moved) / routeLengthMeters(route, devices) - 2) < 1e-7);
});

test('length follows each waypoint instead of measuring a straight endpoint shortcut', () => {
  const detour = { ...route, via: [{ lat: 0.001, lng: 0 }, { lat: 0.001, lng: 0.001 }] };
  const length = routeLengthMeters(detour, devices);
  assert.ok(Math.abs(length - 333.5852407) < 0.01);
  assert.ok(length > routeLengthMeters(route, devices) * 2.99);
  assert.deepEqual(routePoints(detour, devices)[1], detour.via[0]);
});

test('geographic length takes the short segment across the date line', () => {
  const crossing = [{ id: 'A', lat: 0, lng: 179.999 }, { id: 'B', lat: 0, lng: -179.999 }];
  assert.ok(Math.abs(routeLengthMeters(route, crossing) - 222.3901605) < 0.001);
});

test('missing endpoints and malformed waypoint coordinates cannot produce a misleading partial length', () => {
  for (const bad of [
    { ...route, toDeviceId: 'missing' },
    { ...route, via: [{ lat: NaN, lng: 0 }] },
    { ...route, via: [{ lat: 91, lng: 0 }] },
    { ...route, via: [{ lat: 0, lng: 181 }] },
    { ...route, via: 'invalid' },
    null,
  ]) {
    assert.deepEqual(routePoints(bad, devices), []);
    assert.equal(routeLengthMeters(bad, devices), 0);
    assert.equal(routeBillableMeters(bad, devices), 0);
  }
  assert.equal(routeLengthMeters(route, [{ id: 'A', lat: 0, lng: 0 }]), 0);
});

test('slack is added once with a documented default and bounded finite values', () => {
  const length = routeLengthMeters(route, devices);
  assert.equal(routeBillableMeters(route, devices), length * 1.15);
  assert.equal(routeBillableMeters({ ...route, slackPercent: undefined }, devices), length * 1.1);
  assert.equal(routeBillableMeters({ ...route, slackPercent: -10 }, devices), length);
  assert.equal(routeBillableMeters({ ...route, slackPercent: Infinity }, devices), length * 1.1);
  assert.equal(routeBillableMeters({ ...route, slackPercent: 999 }, devices), length * 2);
});

test('coincident points produce a finite zero-length route and type metadata has numeric rates', () => {
  const coincident = [{ id: 'A', lat: 12, lng: 32 }, { id: 'B', lat: 12, lng: 32 }];
  assert.equal(routeLengthMeters(route, coincident), 0);
  for (const type of ['cat6', 'fiber', 'security']) {
    assert.equal(typeof CABLE_TYPES[type].label, 'string');
    assert.ok(Number.isFinite(CABLE_TYPES[type].unitCost) && CABLE_TYPES[type].unitCost > 0);
    assert.match(CABLE_TYPES[type].color, /^#[0-9a-f]{6}$/i);
  }
});
