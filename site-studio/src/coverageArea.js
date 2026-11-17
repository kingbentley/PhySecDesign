import { planPointToLatLng } from './alignment.js';
import { createBlankPlan } from './projectModel.js';

const EARTH_METRES = 6371008.8;
const DEG = Math.PI / 180;
const MARGIN_METRES = 2;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrapLongitude = value => ((value + 180) % 360 + 360) % 360 - 180;
const validLocation = point => point && finite(point.lat) && finite(point.lng)
  && Math.abs(point.lat) <= 85 && Math.abs(point.lng) <= 180;
const mapPoint = point => ({ lat: clamp(point.lat, -85, 85), lng: wrapLongitude(point.lng) });

function planCorners(plan) {
  if (!validLocation(plan) || !finite(plan.width) || !finite(plan.height)
    || plan.width <= 0 || plan.height <= 0 || plan.width > 100000 || plan.height > 100000
    || (plan.rotation !== undefined && !finite(plan.rotation))) return null;
  return [{ u: 0, v: 0 }, { u: 1, v: 0 }, { u: 1, v: 1 }, { u: 0, v: 1 }]
    .map(point => mapPoint(planPointToLatLng(plan, point)));
}

/**
 * A fallback area for coverage analysis, independent of current camera bearings.
 * Camera bounds use the same local Mercator scale as the coverage calculation.
 * Finite out-of-range radii are clamped; malformed locations/radii are skipped.
 * Coordinates stay within the supported map limits, including at the date line.
 */
export function defaultCoverageArea(plan, cameras = []) {
  const extent = planCorners(plan);
  if (plan?.url && extent) return { points: extent, source: 'Site plan extent' };

  const usable = (Array.isArray(cameras) ? cameras : []).filter(camera => validLocation(camera)
    && (camera.range === undefined || finite(camera.range)));
  if (usable.length) {
    const originLongitude = usable[0].lng;
    let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
    for (const camera of usable) {
      const latitude = camera.lat * DEG;
      const radius = (clamp(camera.range ?? 28, 1, 150) + MARGIN_METRES) / (EARTH_METRES * Math.cos(latitude));
      // Unwrap every camera around the first one before forming the bounds.
      // A property crossing ±180° therefore retains its local footprint.
      const x = wrapLongitude(camera.lng - originLongitude) * DEG;
      const y = Math.log(Math.tan(Math.PI / 4 + latitude / 2));
      left = Math.min(left, x - radius);
      right = Math.max(right, x + radius);
      bottom = Math.min(bottom, y - radius);
      top = Math.max(top, y + radius);
    }
    const toGeo = (x, y) => mapPoint({
      lat: (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG,
      lng: originLongitude + x / DEG,
    });
    return {
      points: [toGeo(left, top), toGeo(right, top), toGeo(right, bottom), toGeo(left, bottom)],
      source: 'Camera surroundings',
    };
  }

  const fallback = extent || planCorners(createBlankPlan(validLocation(plan) ? plan : undefined));
  return { points: fallback, source: 'Map area' };
}
