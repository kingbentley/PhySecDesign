// Illustrative material-only USD per metre. Projects can override these rates.
export const CABLE_TYPES = Object.freeze({
  cat6: Object.freeze({ label: 'Cat6 cable', unitCost: 0.85, color: '#267cba' }),
  fiber: Object.freeze({ label: 'Fiber optic cable', unitCost: 1.8, color: '#c1841c' }),
  security: Object.freeze({ label: 'Security cable', unitCost: 0.65, color: '#9957af' }),
});

const EARTH_METRES = 6371008.8;
const toRadians = value => value * Math.PI / 180;
const validPoint = point => point && typeof point.lat === 'number' && typeof point.lng === 'number'
  && Number.isFinite(point.lat) && Number.isFinite(point.lng)
  && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
const position = point => ({ lat: point.lat, lng: point.lng });

/** Endpoints follow current device positions; invalid/incomplete routes have no path. */
export function routePoints(route, devices = []) {
  if (!route || !Array.isArray(devices)) return [];
  const from = devices.find(device => device?.id === route.fromDeviceId);
  const to = devices.find(device => device?.id === route.toDeviceId);
  const via = route.via ?? [];
  if (!validPoint(from) || !validPoint(to) || !Array.isArray(via) || !Array.from(via).every(validPoint)) return [];
  return [position(from), ...via.map(position), position(to)];
}

function segmentMeters(a, b) {
  const latitude = toRadians(b.lat - a.lat);
  const longitude = toRadians(((b.lng - a.lng + 180) % 360 + 360) % 360 - 180);
  const h = Math.sin(latitude / 2) ** 2
    + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_METRES * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}

/** Horizontal geodesic path length, without service loops or vertical rises. */
export function routeLengthMeters(route, devices = []) {
  const points = routePoints(route, devices);
  let length = 0;
  for (let index = 1; index < points.length; index++) length += segmentMeters(points[index - 1], points[index]);
  return length;
}

/** Apply an allowance while preserving precision for downstream BOM rounding. */
export function routeBillableMeters(route, devices = []) {
  const requested = typeof route?.slackPercent === 'number' && Number.isFinite(route.slackPercent) ? route.slackPercent : 10;
  const slack = Math.min(100, Math.max(0, requested));
  return routeLengthMeters(route, devices) * (1 + slack / 100);
}
