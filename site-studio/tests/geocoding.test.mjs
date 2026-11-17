import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCoordinates, searchAddresses } from '../src/geocoding.js';

const point = (lat, lng, properties = {}) => ({
  geometry: { type: 'Point', coordinates: [lng, lat] }, properties,
});
const response = features => ({ ok: true, json: async () => ({ features }) });

test('coordinates accept signed decimals and reject malformed/out-of-range pairs', () => {
  assert.deepEqual(parseCoordinates('41.8898, -87.6366'), { lat: 41.8898, lng: -87.6366 });
  assert.deepEqual(parseCoordinates(' +41.2 -87.5 '), { lat: 41.2, lng: -87.5 });
  assert.equal(parseCoordinates('233 S Wacker Drive, Chicago'), null);
  assert.equal(parseCoordinates('60606'), null);
  assert.throws(() => parseCoordinates('91, -87'), RangeError);
  assert.throws(() => parseCoordinates('41, 181'), RangeError);
  assert.throws(() => parseCoordinates('41.2,'), RangeError);
  assert.throws(() => parseCoordinates('41, 22, 33'), RangeError);
});

test('coordinates resolve without sending them to a remote geocoder', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected network request'); });
  const results = await searchAddresses('41.88, -87.63');
  assert.equal(results.length, 1);
  assert.equal(results[0].lat, 41.88);
});

test('address results are safe, deduplicated, coordinate-validated, and cached independently of caller mutations', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url.origin, 'https://photon.komoot.io');
    assert.equal(url.searchParams.get('q'), 'QA test property Chicago');
    assert.equal(url.searchParams.get('limit'), '5');
    return response([
      point(41.88, -87.63, { name: 'Test\u0000 Building', housenumber: '233', street: 'S Wacker Dr', city: 'Chicago', state: 'Illinois' }),
      point(41.88, -87.63, { name: 'Test Building' }),
      point(999, 0, { name: 'Invalid' }),
      point('41.88', -87.63, { name: 'Wrong type' }),
      { geometry: { type: 'Polygon', coordinates: [] } },
      point(41.9, -87.7, { housenumber: '42', street: 'Main St', city: 'Chicago' }),
    ]);
  });
  const first = await searchAddresses(' QA test property Chicago ');
  assert.equal(first.length, 2);
  assert.equal(first[0].label, 'Test Building');
  assert.match(first[0].detail, /233 S Wacker Dr, Chicago, Illinois/);
  assert.equal(first[1].label, '42 Main St');
  first[0].label = 'Changed by caller';
  const cached = await searchAddresses('QA TEST PROPERTY CHICAGO');
  assert.equal(cached[0].label, 'Test Building');
  assert.equal(fetchMock.mock.calls.length, 1);
});

test('unmatched addresses return an empty result list', async t => {
  t.mock.method(globalThis, 'fetch', async () => response([]));
  assert.deepEqual(await searchAddresses('unmatched QA property'), []);
});

test('remote failures, throttling, and malformed data produce useful errors', async t => {
  let reply = { ok: false, status: 429 };
  t.mock.method(globalThis, 'fetch', async () => reply);
  await assert.rejects(searchAddresses('throttled QA query'), /busy/);
  reply = { ok: false, status: 503 };
  await assert.rejects(searchAddresses('service failure QA'), /unavailable/);
  reply = { ok: true, json: async () => ({ invalid: true }) };
  await assert.rejects(searchAddresses('invalid response QA'), /unexpected response/);
});

test('aborted searches neither return late results nor populate the cache', async t => {
  let requestCount = 0;
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => {
    requestCount++;
    if (requestCount === 1) controller.abort();
    return response([point(41, -87, { name: 'Cancelled result' })]);
  });
  await assert.rejects(searchAddresses('cancelled QA query', { signal: controller.signal }), { name: 'AbortError' });
  const results = await searchAddresses('cancelled QA query');
  assert.equal(results.length, 1);
  assert.equal(requestCount, 2);
  const preAborted = new AbortController();
  preAborted.abort();
  await assert.rejects(searchAddresses('cached or not', { signal: preAborted.signal }), { name: 'AbortError' });
});

test('cache evicts older results after 30 distinct addresses', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return response([]); });
  await searchAddresses('eviction seed property');
  for (let i = 0; i < 30; i++) await searchAddresses('eviction property ' + i);
  await searchAddresses('eviction seed property');
  assert.equal(requests, 32);
});

test('timeout aborts an unresponsive upstream search', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const result = assert.rejects(searchAddresses('timeout QA query'), /timed out/);
  t.mock.timers.tick(10001);
  await result;
});
