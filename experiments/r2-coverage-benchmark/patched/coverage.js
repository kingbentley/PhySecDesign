// Proof-of-concept 2.5D coverage: a rectilinear camera, a flat horizontal target
// plane, and vertical barriers rising from z=0. Occlusion is sampled; it is not
// a lighting, lens-distortion, or terrain simulation. Optional DORI estimates
// use ideal horizontal image sampling.
import { DORI_BANDS, doriBand, imageWidth } from './dori.js';
import { coverageContours } from './coverageContours.js';

const emptyDoriBands = () => DORI_BANDS.map(band => ({ ...band, area: 0, polygons: [] }));
const EARTH = 6371008.8;
const DEG = Math.PI / 180;
const EPS = 1e-8;
const MAX_EDGE_WORK = 1_500_000;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const dot = (a, b) => a.x * b.x + a.y * b.y;
const cross = (a, b) => a.x * b.y - a.y * b.x;
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const wrapDegrees = value => ((value + 180) % 360 + 360) % 360 - 180;

export function horizontalFov(lens, sensorWidth = 6.4) {
  if (!finite(lens) || lens <= 0 || !finite(sensorWidth) || sensorWidth <= 0) throw new RangeError('Enter a positive focal length and sensor width.');
  return 2 * Math.atan(sensorWidth / (2 * lens)) / DEG;
}

export function focalLength(fov, sensorWidth = 6.4) {
  if (!finite(fov) || fov <= 0 || fov >= 180 || !finite(sensorWidth) || sensorWidth <= 0) throw new RangeError('Enter a field of view between 0° and 180° and a positive sensor width.');
  return sensorWidth / (2 * Math.tan(fov * DEG / 2));
}

/** Lens and sensor width are canonical; supplied HFOV is derived from them. */
export function cameraDefaults(camera = {}) {
  const sensorWidth = camera.sensorWidth ?? 6.4;
  const lens = camera.lens ?? (finite(camera.fov) ? focalLength(camera.fov, sensorWidth) : 4);
  const result = {
    ...camera,
    sensorWidth, lens, fov: horizontalFov(lens, sensorWidth),
    imageWidth: imageWidth(camera),
    aspectRatio: camera.aspectRatio ?? 16 / 9,
    height: camera.height ?? 3.2,
    targetHeight: camera.targetHeight ?? 0,
    tilt: camera.tilt ?? 25,
    range: camera.range ?? 28,
    bearing: camera.bearing ?? 0,
  };
  const limits = {
    sensorWidth: [1, 36], lens: [0.5, 100], fov: [1, 160], aspectRatio: [0.5, 4],
    height: [0.5, 30], targetHeight: [0, 10], tilt: [0, 90], range: [1, 150],
  };
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (!finite(result[key]) || result[key] < min - EPS || result[key] > max + EPS) throw new RangeError('Camera ' + key + ' is outside the supported range.');
  }
  if (!finite(result.bearing)) throw new RangeError('Enter a valid camera bearing.');
  if (result.targetHeight >= result.height) throw new RangeError('The target plane must be below the camera lens.');
  result.bearing = ((result.bearing % 360) + 360) % 360;
  return result;
}

function validLocation(point) {
  return point && finite(point.lat) && finite(point.lng) && Math.abs(point.lat) <= 85 && Math.abs(point.lng) <= 180;
}

function coordinateFrame(camera) {
  const latitude = camera.lat * DEG;
  const factor = EARTH * Math.cos(latitude);
  const originY = Math.log(Math.tan(Math.PI / 4 + latitude / 2));
  return {
    toLocal(point) {
      return {
        x: wrapDegrees(point.lng - camera.lng) * DEG * factor,
        y: (Math.log(Math.tan(Math.PI / 4 + point.lat * DEG / 2)) - originY) * factor,
      };
    },
    toGeo(point) {
      return {
        lat: (2 * Math.atan(Math.exp(originY + point.y / factor)) - Math.PI / 2) / DEG,
        lng: wrapDegrees(camera.lng + point.x / factor / DEG),
      };
    },
  };
}

function polygonArea(points) {
  let twice = 0;
  for (let i = 0; i < points.length; i++) twice += cross(points[i], points[(i + 1) % points.length]);
  return Math.abs(twice) / 2;
}

function polygonCenter(points) {
  let twice = 0, x = 0, y = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length], weight = cross(a, b);
    twice += weight; x += (a.x + b.x) * weight; y += (a.y + b.y) * weight;
  }
  if (Math.abs(twice) < EPS) return points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
  return { x: x / (3 * twice), y: y / (3 * twice) };
}

function clipPolygon(points, a, b, c) {
  if (!points.length) return [];
  const output = [];
  let previous = points[points.length - 1];
  let previousValue = a * previous.x + b * previous.y + c;
  for (const current of points) {
    const value = a * current.x + b * current.y + c;
    const inside = value >= -EPS, previousInside = previousValue >= -EPS;
    if (inside !== previousInside) {
      const t = previousValue / (previousValue - value);
      output.push({ x: previous.x + (current.x - previous.x) * t, y: previous.y + (current.y - previous.y) * t });
    }
    if (inside) output.push(current);
    previous = current; previousValue = value;
  }
  return output;
}

function clipRectangle(polygon, left, bottom, right, top) {
  let clipped = clipPolygon(polygon, 1, 0, -left);
  clipped = clipPolygon(clipped, -1, 0, right);
  clipped = clipPolygon(clipped, 0, 1, -bottom);
  return clipPolygon(clipped, 0, -1, top);
}

function convexClipper(boundary) {
  // Camera footprints and AOI triangles are counterclockwise.
  const planes = boundary.map((start, index) => {
    const end = boundary[(index + 1) % boundary.length];
    const edge = subtract(end, start);
    return [-edge.y, edge.x, -cross(edge, start)];
  });
  return polygon => {
    for (const plane of planes) {
      if (polygon.length < 3) break;
      polygon = clipPolygon(polygon, ...plane);
    }
    return polygon;
  };
}

function displayContours({ bounds, columns, rows, cellSize, budget, samples, classify, masks, frame, bandCount }) {
  const polygons = Array.from({ length: bandCount }, () => []);
  let pieces = 0;
  coverageContours({
    bounds, columns, rows, cellSize, samples, classify,
    refinementBudget: Math.min(12000, budget * 2),
    write(band, polygon) {
      if (pieces > 16000) return;
      const shapeBounds = bbox(polygon);
      for (const mask of masks) {
        if (!boundsOverlap(shapeBounds, mask.bounds)) continue;
        const piece = mask.clip(polygon);
        if (piece.length < 3 || polygonArea(piece) <= EPS) continue;
        if (++pieces > 16000) return;
        polygons[band].push(piece.map(frame.toGeo));
      }
    },
  });
  // Very intricate layouts keep the bounded sample overlay.
  return pieces <= 16000 ? polygons : undefined;
}

function bbox(points) {
  return points.reduce((box, p) => ({ left: Math.min(box.left, p.x), right: Math.max(box.right, p.x), bottom: Math.min(box.bottom, p.y), top: Math.max(box.top, p.y) }),
    { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity });
}

function boundsOverlap(a, b) {
  return a.left <= b.right + EPS && a.right >= b.left - EPS && a.bottom <= b.top + EPS && a.top >= b.bottom - EPS;
}

function pointOnSegment(point, a, b) {
  const ab = subtract(b, a), ap = subtract(point, a);
  if (dot(ab, ab) < EPS * EPS) return Math.hypot(ap.x, ap.y) <= EPS;
  return Math.abs(cross(ab, ap)) <= EPS * Math.max(1, Math.hypot(ab.x, ab.y)) &&
    dot(ap, ab) >= -EPS && dot(subtract(point, b), ab) <= EPS;
}

function inPolygon(point, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j], b = points[i];
    if (pointOnSegment(point, a, b)) return true;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// Intersections of the ray segment [origin,target] with an edge, including
// collinear overlaps. Returning the interval also handles a ray along a wall.
function edgeIntersection(target, a, b) {
  const edge = subtract(b, a);
  const denominator = cross(target, edge);
  const scale = Math.max(1, Math.hypot(target.x, target.y) * Math.hypot(edge.x, edge.y));
  if (Math.abs(denominator) > EPS * scale) {
    const t = cross(a, edge) / denominator;
    const u = cross(a, target) / denominator;
    if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
    return [clamp(t, 0, 1), clamp(t, 0, 1)];
  }
  if (Math.abs(cross(a, target)) > EPS * Math.max(1, Math.hypot(target.x, target.y))) return null;
  const lengthSquared = dot(target, target);
  if (lengthSquared < EPS) return null;
  const first = dot(a, target) / lengthSquared;
  const second = dot(b, target) / lengthSquared;
  const entry = Math.max(0, Math.min(first, second));
  const exit = Math.min(1, Math.max(first, second));
  return entry <= exit + EPS ? [entry, exit] : null;
}

function selfIntersects(points) {
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j], d = points[(j + 1) % points.length];
      if (edgeIntersection(subtract(b, a), subtract(c, a), subtract(d, a))) return true;
    }
  }
  return false;
}

function prepareBarriers(barriers, frame, camera, warnings) {
  if (!Array.isArray(barriers)) throw new RangeError('The barrier list could not be analyzed.');
  if (barriers.length > 100) throw new RangeError('Coverage supports up to 100 barriers on one floor.');
  const prepared = [];
  let ignored = false, edgeCount = 0;
  for (const barrier of barriers) {
    if (barrier?.enabled === false) continue;
    const minimum = barrier?.kind === 'wall' ? 2 : barrier?.kind === 'obstacle' ? 3 : Infinity;
    if (!Array.isArray(barrier?.points) || barrier.points.length < minimum || barrier.points.length > 100 ||
      !barrier.points.every(validLocation) || !finite(barrier.height) || barrier.height <= 0 || barrier.height > 50) { ignored = true; continue; }
    let points = barrier.points.map(frame.toLocal);
    points = points.filter((point, index) => index === 0 || Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > 1e-6);
    if (barrier.kind === 'obstacle' && points.length > 3 && Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y) < 1e-6) points = points.slice(0, -1);
    if (barrier.kind === 'obstacle' && (points.length < 3 || polygonArea(points) < 1e-5 || selfIntersects(points))) { ignored = true; continue; }
    const bounds = bbox(points);
    const region = { left: -camera.range, right: camera.range, bottom: -camera.range, top: camera.range };
    if (!boundsOverlap(bounds, region)) continue;
    const edges = [];
    for (let i = 0; i < points.length - (barrier.kind === 'wall' ? 1 : 0); i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-6) continue;
      edges.push({ a, b, bounds: bbox([a, b]) });
    }
    if (!edges.length) { ignored = true; continue; }
    edgeCount += edges.length;
    const containsCamera = barrier.kind === 'obstacle' && inPolygon({ x: 0, y: 0 }, points);
    prepared.push({ id: String(barrier.id ?? prepared.length), name: String(barrier.name || (barrier.kind === 'wall' ? 'Wall' : 'Obstacle')), kind: barrier.kind, height: barrier.height, points, edges, bounds, containsCamera });
  }
  if (ignored) warnings.push('Some barriers have invalid geometry or height and were excluded. Correct them before relying on coverage.');
  return { barriers: prepared, edgeCount };
}

function buildModel(camera, barriers, preparedInput = null) {
  if (!validLocation(camera)) throw new RangeError('Set a valid camera location to calculate coverage.');
  const normalized = cameraDefaults(camera);
  const frame = coordinateFrame(normalized);
  const bearing = normalized.bearing * DEG, tilt = normalized.tilt * DEG;
  const forward = { x: Math.sin(bearing), y: Math.cos(bearing) };
  const right = { x: Math.cos(bearing), y: -Math.sin(bearing) };
  const tanH = Math.tan(normalized.fov * DEG / 2);
  const tanV = tanH / normalized.aspectRatio;
  const verticalFov = 2 * Math.atan(tanV) / DEG;
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  const drop = normalized.height - normalized.targetHeight;
  // Each inequality a*x+b*y+c>=0 is one rectilinear frustum plane
  // intersected with z=targetHeight. This includes both vertical limits.
  const planes = [
    [forward.x * cos, forward.y * cos, drop * sin - EPS],
    [forward.x * tanH * cos - right.x, forward.y * tanH * cos - right.y, drop * tanH * sin],
    [forward.x * tanH * cos + right.x, forward.y * tanH * cos + right.y, drop * tanH * sin],
    [forward.x * (tanV * cos - sin), forward.y * (tanV * cos - sin), drop * (tanV * sin + cos)],
    [forward.x * (tanV * cos + sin), forward.y * (tanV * cos + sin), drop * (tanV * sin - cos)],
  ];
  let nominal = Array.from({ length: 96 }, (_, i) => ({ x: normalized.range * Math.cos(i * 2 * Math.PI / 96), y: normalized.range * Math.sin(i * 2 * Math.PI / 96) }));
  for (const plane of planes) nominal = clipPolygon(nominal, ...plane);
  const warnings = [];
  const prepared = preparedInput || prepareBarriers(barriers, frame, normalized, warnings);
  const solidAtCamera = prepared.barriers.find(barrier => barrier.containsCamera && normalized.height <= barrier.height + EPS);
  if (solidAtCamera) warnings.push('The camera lens is inside ' + solidAtCamera.name + '. Move it outside the obstacle or above its top.');
  else if (prepared.barriers.some(barrier => barrier.containsCamera)) warnings.push('The camera is above an obstacle footprint. Coverage accounts for its top and sides.');
  const lowerAngle = tilt + verticalFov * DEG / 2;
  const upperAngle = tilt - verticalFov * DEG / 2;
  const nearBlindDistance = lowerAngle >= Math.PI / 2 - EPS ? 0 : drop / Math.tan(lowerAngle);
  const farGroundDistance = upperAngle <= EPS ? null : drop / Math.tan(upperAngle);
  return { camera: normalized, frame, forward, right, planes, nominal, warnings, ...prepared, solidAtCamera, verticalFov, nearBlindDistance, farGroundDistance, tanH, cos, sin, drop };
}

function visibleDoriBand(model, point) {
  // A metre transverse to the view at optical depth z spans f_px / z pixels.
  const depth = dot(point, model.forward) * model.cos + model.drop * model.sin;
  const pixelsPerMetre = model.camera.imageWidth / (2 * model.tanH * Math.max(EPS, depth));
  return doriBand(pixelsPerMetre);
}

function isInFrustum(model, point) {
  return dot(point, point) <= model.camera.range ** 2 + EPS && model.planes.every(([a, b, c]) => a * point.x + b * point.y + c >= -EPS);
}

function blockedBy(model, target, work) {
  if (model.solidAtCamera) return model.solidAtCamera;
  const camera = model.camera;
  const rayBounds = bbox([{ x: 0, y: 0 }, target]);
  const heightAt = t => camera.height + (camera.targetHeight - camera.height) * t;
  for (const barrier of model.barriers) {
    if (!boundsOverlap(rayBounds, barrier.bounds)) continue;
    if (barrier.kind === 'wall') {
      for (const edge of barrier.edges) {
        if (!boundsOverlap(rayBounds, edge.bounds)) continue;
        if (work) work.intersectionTests++;
        const hit = edgeIntersection(target, edge.a, edge.b);
        // A zero-thickness wall at the lens origin is not a later ray crossing.
        if (hit && hit[1] > 1e-7 && heightAt(hit[1]) <= barrier.height + EPS && heightAt(hit[1]) >= -EPS) return barrier;
      }
      continue;
    }
    const intersections = [0, 1];
    for (const edge of barrier.edges) {
      if (!boundsOverlap(rayBounds, edge.bounds)) continue;
      if (work) work.intersectionTests++;
      const hit = edgeIntersection(target, edge.a, edge.b);
      if (hit) intersections.push(hit[0], hit[1]);
    }
    intersections.sort((a, b) => a - b);
    const stops = intersections.filter((value, index) => index === 0 || value - intersections[index - 1] > EPS);
    for (let i = 1; i < stops.length; i++) {
      const entry = stops[i - 1], exit = stops[i];
      if (exit - entry <= EPS || exit <= 1e-7) continue;
      const middle = (entry + exit) / 2;
      if (inPolygon({ x: target.x * middle, y: target.y * middle }, barrier.points) && heightAt(exit) <= barrier.height + EPS && heightAt(entry) >= -EPS) return barrier;
    }
    // A ray that only touches a solid's boundary is conservatively blocked at
    // that contact when the contact is below its top (including a target on it).
    for (const t of stops) {
      if (t <= 1e-7 || heightAt(t) > barrier.height + EPS) continue;
      if (inPolygon({ x: target.x * t, y: target.y * t }, barrier.points)) return barrier;
    }
  }
  return null;
}

/** Exact point test within the flat-plane model; useful for inspection and tests. */
export function classifyCoveragePoint(camera, point, barriers = []) {
  const model = buildModel(camera, barriers);
  if (!validLocation(point)) throw new RangeError('Choose a valid target location.');
  const local = model.frame.toLocal(point);
  const inFrustum = isInFrustum(model, local);
  const blocker = inFrustum ? blockedBy(model, local) : null;
  return { inFrustum, blocked: Boolean(blocker), visible: inFrustum && !blocker, blockerId: blocker?.id ?? null, distance: Math.hypot(local.x, local.y) };
}

function emptyResult(message, camera) {
  return {
    visiblePolygons: [], blockedPolygons: [], nominalPolygons: [], nearBlindPolygons: [],
    invalid: Boolean(message), warnings: message ? [message] : [],
    stats: { sampledCells: 0, cellSize: 0, nominalArea: 0, visibleArea: 0, blockedArea: 0, blockedPercent: 0, horizontalFov: 0, verticalFov: 0, nearBlindDistance: 0, farGroundDistance: null, range: finite(camera?.range) ? camera.range : 0, intersectionTests: 0, rangeLimited: false, barrierCount: 0 },
  };
}

/**
 * Geographic polygon arrays are suitable for Leaflet/Google polygon layers.
 * Nominal footprint is rectilinear frustum ∩ horizontal plane ∩ analysis range.
 * nearBlindDistance/farGroundDistance are forward centerline ground distances.
 * nearBlindPolygons is a conservative sector of the near blind region, not its
 * full exact outline; diagonal far corners can exceed farGroundDistance.
 * The analysis-range circle is approximated by a 96-sided polygon.
 * Occlusion uses a representative point per clipped raster cell; small gaps may
 * be missed. Adjacent cells of one class merge into row strips, preserving the
 * nominal boundary. Area statistics use clipped cell areas, not whole squares.
 */
export function computeCameraCoverage(camera, barriers = [], options = {}) {
  let model;
  try { model = buildModel(camera, barriers); }
  catch (error) { return emptyResult(error.message || 'Coverage could not be calculated.', camera); }
  const result = emptyResult(null, model.camera);
  if (options.dori) result.dori = emptyDoriBands();
  result.warnings = [...model.warnings];
  result.stats = { ...result.stats, horizontalFov: model.camera.fov, verticalFov: model.verticalFov, nearBlindDistance: model.nearBlindDistance, farGroundDistance: model.farGroundDistance, range: model.camera.range, barrierCount: model.barriers.length };
  const blindRadius = Math.min(model.camera.range, model.nearBlindDistance);
  if (blindRadius > EPS) {
    const angle = model.camera.bearing * DEG, half = model.camera.fov * DEG / 2;
    const sector = [{ x: 0, y: 0 }, ...Array.from({ length: 25 }, (_, i) => ({ x: blindRadius * Math.sin(angle - half + i * half / 12), y: blindRadius * Math.cos(angle - half + i * half / 12) }))];
    result.nearBlindPolygons = [sector.map(model.frame.toGeo)];
  }
  if (model.nominal.length < 3 || polygonArea(model.nominal) <= EPS) {
    result.warnings.push('The camera does not intersect the target plane within the analysis range. Adjust tilt, focal length, height, or range.');
    return result;
  }
  result.nominalPolygons = [model.nominal.map(model.frame.toGeo)];
  result.stats.rangeLimited = model.nominal.some(point => Math.hypot(point.x, point.y) >= model.camera.range * Math.cos(Math.PI / 96) - EPS);
  const requestedCell = finite(options.cellSize) ? clamp(options.cellSize, 0.25, 50) : 1;
  const maxCells = finite(options.maxCells) ? clamp(Math.floor(options.maxCells), 1, 5_000_000) : 6000;
  const budget = Math.max(1, Math.min(maxCells, Math.floor(MAX_EDGE_WORK / Math.max(1, model.edgeCount))));
  const bounds = bbox(model.nominal);
  const width = bounds.right - bounds.left, height = bounds.top - bounds.bottom;
  let columns = Math.max(1, Math.ceil(width / requestedCell)), rows = Math.max(1, Math.ceil(height / requestedCell)), cellSize = requestedCell;
  if (columns * rows > budget) {
    columns = Math.max(1, Math.min(budget, Math.floor(Math.sqrt(budget * width / height))));
    rows = Math.max(1, Math.floor(budget / columns));
    cellSize = Math.max(requestedCell, width / columns, height / rows);
    columns = Math.max(1, Math.min(columns, Math.ceil(width / cellSize - 1e-9)));
    rows = Math.max(1, Math.min(rows, Math.ceil(height / cellSize - 1e-9)));
  }
  result.stats.cellSize = cellSize;
  if (cellSize > requestedCell * 1.05) result.warnings.push('Coverage is sampled at ' + cellSize.toFixed(1) + ' m spacing. Small gaps or thin obstacles may be missed.');
  const work = { intersectionTests: 0 };
  const classified = { visible: [], blocked: [] };
  const samples = options.contours ? new Int8Array(columns * rows).fill(-1) : null;
  for (let row = 0; row < rows; row++) {
    const bottom = bounds.bottom + row * cellSize, top = Math.min(bounds.top, bottom + cellSize);
    let run = null;
    const finishRun = endColumn => {
      if (!run) return;
      const polygon = clipRectangle(model.nominal, bounds.left + run.start * cellSize, bottom, Math.min(bounds.right, bounds.left + endColumn * cellSize), top);
      if (polygon.length >= 3 && polygonArea(polygon) > EPS) {
        const geo = polygon.map(model.frame.toGeo);
        classified[run.kind].push(geo);
        if (result.dori) result.dori[run.band].polygons.push(geo);
      }
      run = null;
    };
    for (let column = 0; column < columns; column++) {
      const left = bounds.left + column * cellSize, right = Math.min(bounds.right, left + cellSize);
      const cell = clipRectangle(model.nominal, left, bottom, right, top);
      const area = cell.length >= 3 ? polygonArea(cell) : 0;
      if (area <= EPS) { finishRun(column); continue; }
      const point = polygonCenter(cell);
      const kind = blockedBy(model, point, work) ? 'blocked' : 'visible';
      const band = result.dori && kind === 'visible' ? visibleDoriBand(model, point) : 0;
      if (samples && Math.abs(area - (right - left) * (top - bottom)) <= EPS) {
        samples[row * columns + column] = result.dori ? band : Number(kind === 'visible');
      }
      result.stats.sampledCells++;
      result.stats.nominalArea += area;
      result.stats[kind === 'blocked' ? 'blockedArea' : 'visibleArea'] += area;
      if (result.dori) result.dori[band].area += area;
      if (run?.kind !== kind || run.band !== band) { finishRun(column); run = { kind, band, start: column }; }
    }
    finishRun(columns);
  }
  result.stats.intersectionTests = work.intersectionTests;
  result.stats.blockedPercent = result.stats.nominalArea ? result.stats.blockedArea / result.stats.nominalArea * 100 : 0;
  result.visiblePolygons = result.stats.blockedArea <= EPS ? result.nominalPolygons : classified.visible;
  result.blockedPolygons = result.stats.visibleArea <= EPS ? result.nominalPolygons : classified.blocked;
  if (samples && (result.dori || (result.stats.blockedArea > EPS && result.stats.visibleArea > EPS))) {
    result.contours = displayContours({
      bounds, columns, rows, cellSize, budget, samples, frame: model.frame,
      masks: [{ bounds, clip: convexClipper(model.nominal) }],
      bandCount: result.dori ? DORI_BANDS.length : 2,
      classify(point) {
        if (blockedBy(model, point)) return 0;
        return result.dori ? visibleDoriBand(model, point) : 1;
      },
    });
  }
  return result;
}


const MAX_COMBINED_WORK = 2_000_000_000_000; // R2 experiment: budget lifted

function emptyCombined(message, targetHeight = 0) {
  return {
    uncoveredPolygons: [], singlePolygons: [], overlapPolygons: [], boundaryPolygons: [],
    invalid: Boolean(message), warnings: message ? [message] : [],
    stats: {
      area: 0, coveredArea: 0, singleArea: 0, overlapArea: 0, uncoveredArea: 0,
      coveredPercent: 0, overlapPercent: 0, uncoveredPercent: 0,
      cellSize: 0, sampledCells: 0, cameraCount: 0, excludedCameraCount: 0, targetHeight,
      cameraTests: 0, intersectionTests: 0,
    },
  };
}

function signedPolygonArea(points) {
  let twice = 0;
  for (let i = 0; i < points.length; i++) twice += cross(points[i], points[(i + 1) % points.length]);
  return twice / 2;
}

function pointInTriangle(point, triangle) {
  return triangle.every((a, i) => cross(subtract(triangle[(i + 1) % 3], a), subtract(point, a)) >= -EPS);
}

// Ear clipping partitions a simple concave AOI into non-overlapping triangles.
// Clipping the original concave ring directly could bridge disconnected pieces.
function triangulateArea(points) {
  const remaining = points.map(point => ({ ...point }));
  if (signedPolygonArea(remaining) < 0) remaining.reverse();
  const triangles = [];
  while (remaining.length > 3) {
    let found = false;
    for (let i = 0; i < remaining.length; i++) {
      const previous = (i + remaining.length - 1) % remaining.length;
      const next = (i + 1) % remaining.length;
      const triangle = [remaining[previous], remaining[i], remaining[next]];
      if (cross(subtract(triangle[1], triangle[0]), subtract(triangle[2], triangle[1])) <= EPS) continue;
      if (remaining.some((point, index) => index !== previous && index !== i && index !== next && pointInTriangle(point, triangle))) continue;
      triangles.push({ points: triangle, bounds: bbox(triangle) });
      remaining.splice(i, 1);
      found = true;
      break;
    }
    if (!found) throw new RangeError('The coverage area could not be resolved. Remove crossing or overlapping edges.');
  }
  if (remaining.length === 3 && polygonArea(remaining) > EPS) triangles.push({ points: remaining, bounds: bbox(remaining) });
  return triangles;
}

function prepareAnalysisArea(area) {
  if (!Array.isArray(area) || area.length < 3 || area.length > 100 || !area.every(validLocation)) {
    throw new RangeError('Draw a coverage area with 3 to 100 valid map points.');
  }
  const firstLongitude = area[0].lng;
  const origin = {
    lat: area.reduce((sum, point) => sum + point.lat, 0) / area.length,
    lng: wrapDegrees(firstLongitude + area.reduce((sum, point) => sum + wrapDegrees(point.lng - firstLongitude), 0) / area.length),
  };
  const frame = coordinateFrame(origin);
  let points = area.map(frame.toLocal);
  points = points.filter((point, index) => index === 0 || Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > 1e-6);
  if (points.length > 1 && Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y) < 1e-6) points.pop();
  if (points.length < 3 || polygonArea(points) < 0.01 || selfIntersects(points)) throw new RangeError('Draw a non-crossing coverage boundary with a usable area.');
  // Remove redundant collinear vertices before ear clipping.
  let changed = true;
  while (changed && points.length > 3) {
    changed = false;
    for (let i = 0; i < points.length; i++) {
      if (pointOnSegment(points[i], points[(i + points.length - 1) % points.length], points[(i + 1) % points.length])) {
        points.splice(i, 1); changed = true; break;
      }
    }
  }
  const bounds = bbox(points);
  if (bounds.right - bounds.left > 20000 || bounds.top - bounds.bottom > 20000) throw new RangeError('Choose a site area less than 20 km across for this flat-plane analysis.');
  return { points, origin, frame, bounds, triangles: triangulateArea(points), area: polygonArea(points) };
}

function localizedBarriers(prepared, offset, ratio, cameraRange) {
  const commonRange = cameraRange / ratio;
  const rangeBounds = { left: offset.x - commonRange, right: offset.x + commonRange, bottom: offset.y - commonRange, top: offset.y + commonRange };
  const transform = point => ({ x: (point.x - offset.x) * ratio, y: (point.y - offset.y) * ratio });
  const barriers = [];
  let edgeCount = 0;
  for (const barrier of prepared.barriers) {
    if (!boundsOverlap(barrier.bounds, rangeBounds)) continue;
    const points = barrier.points.map(transform);
    const edges = barrier.edges.map(edge => {
      const a = transform(edge.a), b = transform(edge.b);
      return { a, b, bounds: bbox([a, b]) };
    });
    edgeCount += edges.length;
    barriers.push({ ...barrier, points, edges, bounds: bbox(points), containsCamera: barrier.kind === 'obstacle' && inPolygon({ x: 0, y: 0 }, points) });
  }
  return { barriers, edgeCount };
}

/**
 * Combined coverage measures the ENTIRE explicit simple area, including places
 * outside every camera's nominal footprint. Classes are disjoint: zero, one, or
 * at least two unobstructed cameras on one common horizontal target plane.
 *
 * Each clipped grid cell gets one representative point INSIDE the AOI. Boundary
 * areas are summed from clipped, non-overlapping triangles. Disconnected AOI
 * fragments within one coarse cell share a sampled class; small gaps and narrow
 * overlaps may therefore be missed. Row strips are clipped back to those
 * triangles, so returned simple polygons never fill a concave cutout.
 */
export function computeCombinedCoverage(cameras, barriers = [], options = {}) {
  const targetHeight = options.targetHeight ?? 0;
  const result = emptyCombined(null, finite(targetHeight) ? targetHeight : 0);
  let area, prepared;
  try {
    if (!finite(targetHeight) || targetHeight < 0 || targetHeight > 10) throw new RangeError('Choose a common target plane from 0 to 10 m above the floor.');
    if (!Array.isArray(cameras) || cameras.length > 500) throw new RangeError('Combined coverage supports up to 500 cameras.');
    area = prepareAnalysisArea(options.area);
    // Validate and triangulate barriers once in the AOI frame. Keep barriers
    // outside the AOI: they may occlude an outside camera looking into the area.
    prepared = prepareBarriers(barriers, area.frame, { range: Infinity }, result.warnings);
  } catch (error) { return emptyCombined(error.message || 'Combined coverage could not be calculated.', finite(targetHeight) ? targetHeight : 0); }
  const boundary = area.points.map(area.frame.toGeo);
  result.boundaryPolygons = [boundary];
  result.stats.area = area.area;
  if (options.dori) result.dori = emptyDoriBands();
  const requestedCell = finite(options.cellSize) ? clamp(options.cellSize, 0.25, 50) : 0.75;
  result.stats.cellSize = requestedCell;

  const models = [], active = [], seen = new Set();
  let excludedPlane = 0, excludedSettings = 0, duplicates = 0, disabled = 0;
  let preparedEdgeCount = 0, preparationLimit = false;
  for (const camera of cameras) {
    if (camera?.enabled === false) { disabled++; continue; }
    const id = typeof camera?.id === 'string' && camera.id ? camera.id : null;
    if (id && seen.has(id)) { duplicates++; continue; }
    const lensHeight = camera?.height ?? 3.2;
    if (finite(lensHeight) && lensHeight <= targetHeight) { excludedPlane++; continue; }
    try {
      if (!validLocation(camera)) throw new RangeError('Invalid camera location.');
      const commonCamera = cameraDefaults({ ...camera, targetHeight });
      const offset = area.frame.toLocal(commonCamera);
      const ratio = Math.cos(commonCamera.lat * DEG) / Math.cos(area.origin.lat * DEG);
      // Determine footprint relevance before allocating localized barrier data.
      const baseModel = buildModel(commonCamera, [], { barriers: [], edgeCount: 0 });
      models.push(baseModel);
      if (id) seen.add(id);
      if (baseModel.nominal.length < 3 || polygonArea(baseModel.nominal) <= EPS) continue;
      const commonNominal = baseModel.nominal.map(point => ({ x: point.x / ratio + offset.x, y: point.y / ratio + offset.y }));
      const nominalBounds = bbox(commonNominal);
      if (!boundsOverlap(nominalBounds, area.bounds) || preparationLimit) continue;
      const commonRange = commonCamera.range / ratio;
      const rangeBounds = { left: offset.x - commonRange, right: offset.x + commonRange, bottom: offset.y - commonRange, top: offset.y + commonRange };
      const relevantEdges = prepared.barriers.reduce((sum, barrier) => sum + (boundsOverlap(barrier.bounds, rangeBounds) ? barrier.edges.length : 0), 0);
      if (preparedEdgeCount + relevantEdges > 100000) { preparationLimit = true; continue; }
      preparedEdgeCount += relevantEdges;
      const local = localizedBarriers(prepared, offset, ratio, commonCamera.range);
      const model = buildModel(commonCamera, [], local);
      models[models.length - 1] = model;
      for (const warning of model.warnings) result.warnings.push((camera.name || id || 'Camera') + ': ' + warning);
      active.push({ model, offset, ratio, bounds: nominalBounds });
    } catch { excludedSettings++; }
  }
  result.stats.cameraCount = models.length;
  result.stats.excludedCameraCount = cameras.length - models.length;
  if (excludedPlane) result.warnings.push(excludedPlane + ' camera' + (excludedPlane === 1 ? ' was' : 's were') + ' excluded because the common target plane is not below the lens.');
  if (excludedSettings) result.warnings.push(excludedSettings + ' camera' + (excludedSettings === 1 ? ' has' : 's have') + ' invalid settings or location and could not be analyzed.');
  if (duplicates) result.warnings.push('Repeated camera identifiers were analyzed once to avoid counting the same camera twice.');
  if (disabled) result.warnings.push(disabled + ' disabled camera' + (disabled === 1 ? ' was' : 's were') + ' excluded.');
  result.warnings = [...new Set(result.warnings)];
  if (preparationLimit) {
    const failed = emptyCombined('This area has too many camera and obstacle combinations. Reduce the area or analyze fewer cameras.', targetHeight);
    failed.boundaryPolygons = [boundary];
    failed.stats.area = area.area;
    failed.stats.cameraCount = models.length;
    failed.stats.excludedCameraCount = cameras.length - models.length;
    return failed;
  }
  if (!active.length) {
    result.uncoveredPolygons = [boundary];
    result.stats.uncoveredArea = area.area;
    result.stats.uncoveredPercent = 100;
    if (result.dori) {
      result.dori[0].area = area.area;
      result.dori[0].polygons = [boundary];
    }
    if (!models.length) result.warnings.push('No eligible cameras cover this target plane; the entire area is uncovered.');
    return result;
  }

  const perCellWork = active.reduce((sum, entry) => sum + 1 + entry.model.edgeCount, 0);
  if (perCellWork > MAX_COMBINED_WORK) {
    const failed = emptyCombined('This camera and barrier combination exceeds the analysis budget. Reduce the cameras or use a smaller area.', targetHeight);
    failed.boundaryPolygons = [boundary];
    failed.stats.area = area.area;
    failed.stats.cameraCount = models.length;
    failed.stats.excludedCameraCount = cameras.length - models.length;
    return failed;
  }
  const maxCells = finite(options.maxCells) ? clamp(Math.floor(options.maxCells), 1, 5_000_000) : 10000;
  const budget = Math.max(1, Math.min(maxCells, Math.floor(MAX_COMBINED_WORK / Math.max(1, perCellWork))));
  const width = area.bounds.right - area.bounds.left, height = area.bounds.top - area.bounds.bottom;
  let columns = Math.max(1, Math.ceil(width / requestedCell)), rows = Math.max(1, Math.ceil(height / requestedCell)), cellSize = requestedCell;
  if (columns * rows > budget) {
    columns = Math.max(1, Math.min(budget, Math.floor(Math.sqrt(budget * width / height))));
    rows = Math.max(1, Math.floor(budget / columns));
    cellSize = Math.max(requestedCell, width / columns, height / rows);
    columns = Math.max(1, Math.min(columns, Math.ceil(width / cellSize - 1e-9)));
    rows = Math.max(1, Math.min(rows, Math.ceil(height / cellSize - 1e-9)));
  }
  result.stats.cellSize = cellSize;
  if (cellSize > requestedCell * 1.05) result.warnings.push('Combined coverage is sampled at ' + cellSize.toFixed(1) + ' m spacing. Small gaps and narrow overlaps may be missed.');
  const work = { intersectionTests: 0 };
  const polygons = { uncovered: [], single: [], overlap: [] };
  const samples = options.contours ? new Int8Array(columns * rows).fill(-1) : null;

  function classifyPoint(point, trackSample) {
    let count = 0, bestBand = 0;
    for (const entry of active) {
      if (point.x < entry.bounds.left - EPS || point.x > entry.bounds.right + EPS || point.y < entry.bounds.bottom - EPS || point.y > entry.bounds.top + EPS) continue;
      const localPoint = { x: (point.x - entry.offset.x) * entry.ratio, y: (point.y - entry.offset.y) * entry.ratio };
      if (trackSample) result.stats.cameraTests++;
      if (!isInFrustum(entry.model, localPoint) || blockedBy(entry.model, localPoint, trackSample ? work : null)) continue;
      count++;
      if (result.dori) bestBand = Math.max(bestBand, visibleDoriBand(entry.model, localPoint));
      if (count >= 2 && (!result.dori || bestBand === DORI_BANDS.length - 1)) break;
    }
    return { count: Math.min(count, 2), bestBand };
  }

  for (let row = 0; row < rows; row++) {
    const bottom = area.bounds.bottom + row * cellSize, top = row === rows - 1 ? area.bounds.top : Math.min(area.bounds.top, bottom + cellSize);
    let run = null;
    const finishRun = endColumn => {
      if (!run) return;
      const left = area.bounds.left + run.start * cellSize;
      const right = endColumn === columns ? area.bounds.right : Math.min(area.bounds.right, area.bounds.left + endColumn * cellSize);
      const rectangle = { left, right, bottom, top };
      for (const triangle of area.triangles) {
        if (!boundsOverlap(rectangle, triangle.bounds)) continue;
        const piece = clipRectangle(triangle.points, left, bottom, right, top);
        if (piece.length >= 3 && polygonArea(piece) > EPS) {
          const geo = piece.map(area.frame.toGeo);
          polygons[run.kind].push(geo);
          if (result.dori) result.dori[run.band].polygons.push(geo);
        }
      }
      run = null;
    };
    for (let column = 0; column < columns; column++) {
      const left = area.bounds.left + column * cellSize, right = column === columns - 1 ? area.bounds.right : Math.min(area.bounds.right, left + cellSize);
      const rectangle = { left, right, bottom, top };
      let clippedArea = 0, largestArea = 0, largestPiece = null;
      for (const triangle of area.triangles) {
        if (!boundsOverlap(rectangle, triangle.bounds)) continue;
        const piece = clipRectangle(triangle.points, left, bottom, right, top);
        const pieceArea = piece.length >= 3 ? polygonArea(piece) : 0;
        clippedArea += pieceArea;
        if (pieceArea > largestArea) { largestArea = pieceArea; largestPiece = piece; }
      }
      if (clippedArea <= EPS || !largestPiece) { finishRun(column); continue; }
      const center = { x: (left + right) / 2, y: (bottom + top) / 2 };
      const point = inPolygon(center, area.points) ? center : polygonCenter(largestPiece);
      const { count, bestBand } = classifyPoint(point, true);
      if (samples && point === center) samples[row * columns + column] = result.dori ? bestBand : count;
      const kind = count === 0 ? 'uncovered' : count === 1 ? 'single' : 'overlap';
      result.stats.sampledCells++;
      result.stats[kind + 'Area'] += clippedArea;
      if (result.dori) result.dori[bestBand].area += clippedArea;
      if (run?.kind !== kind || run.band !== bestBand) { finishRun(column); run = { kind, band: bestBand, start: column }; }
    }
    finishRun(columns);
  }
  result.stats.intersectionTests = work.intersectionTests;
  const sum = result.stats.uncoveredArea + result.stats.singleArea + result.stats.overlapArea;
  const residual = area.area - sum;
  if (Math.abs(residual) <= Math.max(1e-6, area.area * 1e-8)) {
    const largest = ['uncoveredArea', 'singleArea', 'overlapArea'].reduce((a, b) => result.stats[a] >= result.stats[b] ? a : b);
    result.stats[largest] += residual;
  }
  result.stats.coveredArea = result.stats.singleArea + result.stats.overlapArea;
  result.stats.coveredPercent = result.stats.coveredArea / area.area * 100;
  result.stats.overlapPercent = result.stats.overlapArea / area.area * 100;
  result.stats.uncoveredPercent = result.stats.uncoveredArea / area.area * 100;
  for (const kind of ['uncovered', 'single', 'overlap']) {
    result[kind + 'Polygons'] = result.stats[kind + 'Area'] >= area.area - 1e-6 ? [boundary] : polygons[kind];
  }
  for (const band of result.dori ?? []) {
    if (band.area >= area.area - 1e-6) band.polygons = [boundary];
  }
  if (samples) {
    result.contours = displayContours({
      bounds: area.bounds, columns, rows, cellSize, budget, samples, frame: area.frame,
      masks: area.triangles.map(triangle => ({ bounds: triangle.bounds, clip: convexClipper(triangle.points) })),
      bandCount: result.dori ? DORI_BANDS.length : 3,
      classify(point) {
        const { count, bestBand } = classifyPoint(point, false);
        return result.dori ? bestBand : count;
      },
    });
  }
  return result;
}
