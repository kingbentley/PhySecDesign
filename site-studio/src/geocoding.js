const DEFAULT_ENDPOINT = 'https://photon.komoot.io/api/';
const ENDPOINT = import.meta.env?.VITE_GEOCODING_URL || DEFAULT_ENDPOINT;
const CACHE_LIMIT = 30;
const QUERY_LIMIT = 240;
const TIMEOUT_MS = 10000;
const resultCache = new Map();

const cleanText = (value, max = 150) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
  : '';

/**
 * Coordinates are local input, not a geocoding request.
 * Non-coordinate address text returns null; malformed numeric input throws.
 */
export function parseCoordinates(query) {
  const value = String(query ?? '').trim();
  const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const pair = new RegExp('^(' + number + ')(?:\\s*,\\s*|\\s+)(' + number + ')$');
  const match = value.match(pair);
  if (!match) {
    if (value && /^[\s+\-.,\d]+$/.test(value) && /[,.]/.test(value)) {
      throw new RangeError('Enter coordinates as latitude, longitude — for example 41.8898, -87.6366.');
    }
    return null;
  }
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) {
    throw new RangeError('Latitude must be between -85 and 85, and longitude between -180 and 180.');
  }
  return { lat, lng };
}

function normalizeFeatures(features) {
  if (!Array.isArray(features)) throw new Error('The address service returned an unexpected response. Please try again.');
  const seen = new Set();
  const results = [];
  for (const feature of features.slice(0, 30)) {
    if (feature?.geometry?.type !== 'Point') continue;
    const coordinates = feature.geometry.coordinates;
    if (!Array.isArray(coordinates)) continue;
    const [lng, lat] = coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) continue;
    const p = feature.properties || {};
    const address = [cleanText(p.housenumber, 30), cleanText(p.street)].filter(Boolean).join(' ');
    const name = cleanText(p.name);
    const locality = [...new Set([p.city, p.district, p.county, p.state, p.postcode, p.country].map(v => cleanText(v, 90)).filter(Boolean))];
    const label = name || address || locality.shift() || 'Map location';
    const detail = [address && address !== label ? address : '', ...locality].filter(Boolean).join(', ').slice(0, 300);
    const key = lat.toFixed(6) + ',' + lng.toFixed(6) + ':' + label.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ id: key, label, detail, lat, lng });
    if (results.length === 5) break;
  }
  return results;
}

function copyResults(results) {
  return results.map(result => ({ ...result }));
}

function abortError() {
  return new DOMException('Address search cancelled.', 'AbortError');
}

/**
 * Moderate-use local prototype adapter for Photon (OpenStreetMap data).
 * Call on explicit submission, not on every keystroke. For production, configure
 * VITE_GEOCODING_URL to a suitable hosted or self-managed Photon endpoint.
 * See https://github.com/komoot/photon#demo-server.
 */
export async function searchAddresses(query, { signal } = {}) {
  if (signal?.aborted) throw abortError();
  const normalized = cleanText(String(query ?? ''), QUERY_LIMIT + 1);
  const coordinates = parseCoordinates(normalized);
  if (coordinates) return [{ id: 'coordinates', label: normalized, detail: 'Coordinates', ...coordinates }];
  if (normalized.length < 3) throw new Error('Enter an address or place name with at least 3 characters.');
  if (normalized.length > QUERY_LIMIT) throw new Error('Please shorten the address to 240 characters or fewer.');

  const cacheKey = normalized.toLocaleLowerCase();
  if (resultCache.has(cacheKey)) {
    const cached = resultCache.get(cacheKey);
    resultCache.delete(cacheKey);
    resultCache.set(cacheKey, cached);
    return copyResults(cached);
  }

  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort(abortError());
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Address search timed out.', 'TimeoutError'));
  }, TIMEOUT_MS);
  try {
    const url = new URL(ENDPOINT);
    url.searchParams.set('q', normalized);
    url.searchParams.set('limit', '5');
    url.searchParams.set('lang', 'en');
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) {
      if (response.status === 429) throw new Error('Address search is busy. Please wait a moment and try again.');
      throw new Error('Address search is unavailable right now. Try again or enter latitude, longitude.');
    }
    const data = await response.json();
    if (signal?.aborted) throw abortError();
    const results = normalizeFeatures(data?.features);
    resultCache.set(cacheKey, copyResults(results));
    if (resultCache.size > CACHE_LIMIT) resultCache.delete(resultCache.keys().next().value);
    return results;
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new Error('Address search timed out. Please try again.');
    if (error?.name === 'AbortError') throw error;
    if (error instanceof SyntaxError) throw new Error('The address service returned an unexpected response. Please try again.');
    if (error instanceof TypeError) throw new Error('Could not reach address search. Check your connection, or enter latitude, longitude.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
