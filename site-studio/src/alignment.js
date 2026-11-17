// A local-metre Web Mercator plane shared by drawing, picking, and alignment.
// Coordinates use screen orientation: x east, y south; positive rotation is clockwise.
const EARTH_METRES = 6371008.8;
const MERCATOR_METRES = 6378137;
const WORLD_WIDTH = 2 * Math.PI * MERCATOR_METRES;
const TO_RAD = Math.PI / 180;
const TO_DEG = 180 / Math.PI;
const MAX_LATITUDE = 85;

const finite = value => typeof value === 'number' && Number.isFinite(value);
const normalizeLongitude = value => ((value + 180) % 360 + 360) % 360 - 180;
const normalizeRotation = value => ((value + 180) % 360 + 360) % 360 - 180;

function validateLocation(point, label = 'Point') {
  if (!point || !finite(point.lat) || !finite(point.lng) || Math.abs(point.lat) > MAX_LATITUDE || Math.abs(point.lng) > 180) {
    throw new RangeError(label + ' must have valid latitude and longitude within the map limits.');
  }
}

function validatePlan(plan) {
  validateLocation(plan, 'Plan center');
  if (!finite(plan.width) || !finite(plan.height) || plan.width <= 0 || plan.height <= 0 || plan.width > 100000 || plan.height > 100000) {
    throw new RangeError('The plan must have valid positive dimensions before it can be aligned.');
  }
  if (plan.rotation !== undefined && !finite(plan.rotation)) {
    throw new RangeError('The plan rotation must be a finite number.');
  }
}

function validateImagePoint(point) {
  if (!point || !finite(point.u) || !finite(point.v)) throw new RangeError('Choose a valid point on the plan image.');
}

function project(point) {
  return {
    x: MERCATOR_METRES * point.lng * TO_RAD,
    y: -MERCATOR_METRES * Math.log(Math.tan(Math.PI / 4 + point.lat * TO_RAD / 2)),
  };
}

function unproject(point, wrap = false) {
  const lng = point.x / MERCATOR_METRES * TO_DEG;
  return {
    lat: (2 * Math.atan(Math.exp(-point.y / MERCATOR_METRES)) - Math.PI / 2) * TO_DEG,
    lng: wrap ? normalizeLongitude(lng) : lng,
  };
}

function shortProjectedDelta(dx) {
  return dx - Math.round(dx / WORLD_WIDTH) * WORLD_WIDTH;
}

function projectionScale(latitude) {
  return MERCATOR_METRES / EARTH_METRES / Math.cos(latitude * TO_RAD);
}

/** Width and height in EPSG:3857 projected metres, before clockwise rotation. */
export function planProjectedSize(plan) {
  validatePlan(plan);
  const scale = projectionScale(plan.lat);
  return { width: plan.width * scale, height: plan.height * scale };
}

/** Map a normalized image coordinate (u right, v down) to its geographic location. */
export function planPointToLatLng(plan, point) {
  validateImagePoint(point);
  const size = planProjectedSize(plan);
  const center = project(plan);
  const rotation = (plan.rotation || 0) * TO_RAD;
  const x = (point.u - 0.5) * size.width;
  const y = (point.v - 0.5) * size.height;
  return unproject({
    x: center.x + x * Math.cos(rotation) - y * Math.sin(rotation),
    y: center.y + x * Math.sin(rotation) + y * Math.cos(rotation),
  });
}

/** Inverse image mapping. Points outside the image intentionally return UVs outside 0..1. */
export function latLngToPlanPoint(plan, point) {
  validateLocation(point);
  const size = planProjectedSize(plan);
  const center = project(plan);
  const location = project(point);
  const dx = shortProjectedDelta(location.x - center.x);
  const dy = location.y - center.y;
  const rotation = (plan.rotation || 0) * TO_RAD;
  return {
    u: 0.5 + (dx * Math.cos(rotation) + dy * Math.sin(rotation)) / size.width,
    v: 0.5 + (-dx * Math.sin(rotation) + dy * Math.cos(rotation)) / size.height,
  };
}

/**
 * Solve an orientation-preserving similarity transform from two image points
 * to two geographic targets. The source image aspect ratio is preserved.
 * Returns only the new geographic center, metre dimensions, and clockwise rotation.
 * No input is mutated; locked-plan policy belongs to the calling workflow.
 */
export function computeTwoPointAlignment(plan, sourcePoints, targetPoints) {
  validatePlan(plan);
  if (!Array.isArray(sourcePoints) || sourcePoints.length !== 2 || !Array.isArray(targetPoints) || targetPoints.length !== 2) {
    throw new RangeError('Choose two plan points and their two matching building points.');
  }
  sourcePoints.forEach(point => {
    validateImagePoint(point);
    if (point.u < 0 || point.u > 1 || point.v < 0 || point.v > 1) {
      throw new RangeError('Both plan points must be inside the plan image.');
    }
  });
  targetPoints.forEach(point => validateLocation(point, 'Building point'));

  const [a, b] = sourcePoints;
  const sourceDelta = { x: (b.u - a.u) * plan.width, y: (b.v - a.v) * plan.height };
  const sourceLength = Math.hypot(sourceDelta.x, sourceDelta.y);
  const minimumSourceDistance = Math.max(0.1, Math.hypot(plan.width, plan.height) * 0.01);
  if (sourceLength < minimumSourceDistance) {
    throw new RangeError('Plan points are too close together. Choose two corners farther apart.');
  }

  const firstTarget = project(targetPoints[0]);
  const secondTarget = project(targetPoints[1]);
  const targetDelta = {
    x: shortProjectedDelta(secondTarget.x - firstTarget.x),
    y: secondTarget.y - firstTarget.y,
  };
  const targetLength = Math.hypot(targetDelta.x, targetDelta.y);
  const midpointLatitude = (targetPoints[0].lat + targetPoints[1].lat) / 2;
  const targetGroundLength = targetLength / projectionScale(midpointLatitude);
  if (!Number.isFinite(targetGroundLength) || targetGroundLength < 0.5) {
    throw new RangeError('Building points are too close together. Choose two distinct corners at least 0.5 m apart.');
  }
  if (targetGroundLength > 3000) {
    throw new RangeError('Building points are too far apart. Choose matching corners on the same site.');
  }

  const projectedScale = targetLength / sourceLength;
  const rotationRadians = Math.atan2(targetDelta.y, targetDelta.x) - Math.atan2(sourceDelta.y, sourceDelta.x);
  const sourceOffset = { x: (a.u - 0.5) * plan.width, y: (a.v - 0.5) * plan.height };
  const center = unproject({
    x: firstTarget.x - projectedScale * (sourceOffset.x * Math.cos(rotationRadians) - sourceOffset.y * Math.sin(rotationRadians)),
    y: firstTarget.y - projectedScale * (sourceOffset.x * Math.sin(rotationRadians) + sourceOffset.y * Math.cos(rotationRadians)),
  }, true);
  validateLocation(center, 'Aligned plan center');
  const metresScale = projectedScale / projectionScale(center.lat);
  const width = plan.width * metresScale;
  const height = plan.height * metresScale;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 5 - 1e-7 || width > 1000 + 1e-7 || height < 1 - 1e-7 || height > 2000 + 1e-7) {
    throw new RangeError('That alignment would make the plan too small or too large. Choose matching points that produce a plan 5–1,000 m wide and 1–2,000 m high.');
  }
  return {
    lat: center.lat,
    lng: center.lng,
    width,
    height,
    rotation: normalizeRotation(rotationRadians * TO_DEG),
  };
}
