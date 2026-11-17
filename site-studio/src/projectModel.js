import { imageWidth } from './dori.js';
import { ZONE_DORI_LEVELS, ZONE_TYPES } from './securityZones.js';
import { MEASUREMENT_UNITS, SURVEY_LIMITS, SURVEY_PHOTO_LIMIT_MESSAGE, surveyPhotoSize } from './survey.js';
import { normalizeCapacity, normalizeDeviceCapacity } from './capacity.js';
import { ESTIMATE_LINE_LIMIT, ESTIMATE_UNITS } from './materials.js';

export const DEVICE_TYPES = Object.freeze(['camera', 'reader', 'light', 'door', 'sensor', 'intercom', 'switch', 'cabinet']);
export const MAX_PROJECT_REVISIONS = 20;
export const MAX_REVISION_NAME = 80;
export const MAX_PROJECT_FILE_BYTES = 100 * 1024 * 1024;
const CABLE_TYPES = new Set(['cat6', 'fiber', 'security']);
const FALLBACK_CENTER = { lat: 41.8898, lng: -87.6366 };
const DEFAULT_CATALOG = { camera: 'camera-dome-4mp', reader: 'reader-standard', light: 'light-exterior', door: 'door-contact', sensor: 'sensor-motion', intercom: 'intercom-ip', switch: 'switch-poe-8', cabinet: 'cabinet-wall' };
const object = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' must be an object.');
  return value;
};
const text = (value, fallback = '', max = 240) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').trim().slice(0, max)
  : fallback;
const number = (value, label, min, max, fallback) => {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(label + ' is outside its supported range.');
  return value;
};
const id = (value, label) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(value)) throw new Error(label + ' has an invalid ID.');
  return value;
};
const list = (value, label, limit) => {
  if (!Array.isArray(value) || value.length > limit) throw new Error(label + ' must be a list of at most ' + limit + ' items.');
  return value;
};
const coordinate = (value, label) => ({
  lat: number(value.lat, label + ' latitude', -85, 85),
  lng: number(value.lng, label + ' longitude', -180, 180),
});
function uniqueId(value, label, seen) {
  const checked = id(value, label);
  if (seen.has(checked)) throw new Error(label + ' has a duplicate ID: ' + checked + '.');
  seen.add(checked);
  return checked;
}
export function makeId(prefix = 'item') {
  const safePrefix = String(prefix).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20) || 'item';
  const random = globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  return safePrefix + '-' + random;
}
export function createBlankPlan(center = FALLBACK_CENTER) {
  return {
    url: '', name: 'No plan imported', filename: '', ...coordinate(center, 'Plan'),
    width: 140, height: 105, rotation: 0, opacity: 0.65, visible: false, locked: false,
  };
}
function normalizeImageUrl(value, allowLocalAssets) {
  if (value === '') return '';
  if (typeof value !== 'string' || value.length > 32 * 1024 * 1024) throw new Error('A plan image is too large or invalid.');
  if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  if (allowLocalAssets && /^\/assets\/[A-Za-z0-9_./-]+$/.test(value) && !value.split('/').includes('..')) return value;
  throw new Error('Plan images must be embedded PNG, JPG, or WebP data.');
}
function normalizePdf(value) {
  if (value === undefined || value === null) return undefined;
  object(value, 'Source PDF');
  const pageCount = number(value.pageCount, 'PDF page count', 1, 10000);
  const pageNumber = number(value.pageNumber, 'PDF page number', 1, pageCount);
  if (!Number.isInteger(pageNumber) || !Number.isInteger(pageCount)) throw new Error('PDF page numbers must be whole numbers.');
  const result = {
    filename: text(value.filename, 'Imported PDF'), pageNumber, pageCount,
    pageLabel: text(value.pageLabel, String(pageNumber), 100),
  };
  for (const key of ['widthPoints', 'heightPoints']) {
    if (value[key] !== undefined) result[key] = number(value[key], 'PDF ' + key, 0.01, 1000000);
  }
  for (const key of ['rasterWidth', 'rasterHeight']) {
    if (value[key] !== undefined) {
      result[key] = number(value[key], 'PDF ' + key, 1, 10000);
      if (!Number.isInteger(result[key])) throw new Error('PDF raster dimensions must be whole numbers.');
    }
  }
  return result;
}
function normalizePlan(raw, allowLocalAssets) {
  const p = object(raw, 'Plan');
  const url = normalizeImageUrl(p.url, allowLocalAssets);
  const sourcePdf = normalizePdf(p.sourcePdf);
  return {
    url, name: text(p.name, url ? 'Imported plan' : 'No plan imported'), filename: text(p.filename),
    ...coordinate(p, 'Plan'),
    width: number(p.width, 'Plan width', 0.1, 100000), height: number(p.height, 'Plan height', 0.1, 100000),
    rotation: number(p.rotation, 'Plan rotation', -360, 360, 0),
    opacity: number(p.opacity, 'Plan opacity', 0, 1, 0.65),
    visible: url ? p.visible !== false : false, locked: p.locked === true,
    ...(sourcePdf ? { sourcePdf } : {}),
  };
}
function normalizeCamera(d) {
  const height = number(d.height, 'Camera mounting height', 0.5, 30, 3.2);
  const sensorWidth = number(d.sensorWidth, 'Camera sensor width', 1, 36, 6.4);
  const fov = number(d.fov, 'Camera field of view', 1, 160, 72);
  // The former lens field did not drive coverage. Preserve existing FOV when
  // upgrading older v1/v2 cameras and derive a matching focal length instead.
  const legacy = d.sensorWidth === undefined;
  const lens = legacy ? sensorWidth / (2 * Math.tan(fov * Math.PI / 360))
    : number(d.lens, 'Camera lens', 0.5, 100);
  number(lens, 'Camera lens required by the field of view', 0.5, 100);
  const derivedFov = 2 * Math.atan(sensorWidth / (2 * lens)) * 180 / Math.PI;
  if (!legacy && Math.abs(derivedFov - fov) > 0.1) {
    throw new Error('Camera field of view does not match its lens and sensor width.');
  }
  const targetHeight = number(d.targetHeight, 'Camera target height', 0, 10, 0);
  if (targetHeight >= height) throw new Error('Camera target height must be below its mounting height.');
  return {
    height, fov, lens, sensorWidth,
    imageWidth: imageWidth(d),
    range: number(d.range, 'Camera range', 1, 150, 28),
    aspectRatio: number(d.aspectRatio, 'Camera aspect ratio', 0.5, 4, 16 / 9),
    tilt: number(d.tilt, 'Camera downward tilt', 0, 90, 25),
    targetHeight,
  };
}

function normalizeDevice(raw, seen) {
  const d = object(raw, 'Device');
  if (!DEVICE_TYPES.includes(d.type)) throw new Error('A device has an unsupported type.');
  if (d.status !== undefined && !['proposed', 'existing'].includes(d.status)) throw new Error('A device has an unsupported status.');
  return {
    id: uniqueId(d.id, 'Device', seen), type: d.type, name: text(d.name, 'New ' + d.type),
    ...coordinate(d, 'Device'),
    bearing: number(d.bearing, 'Device bearing', 0, 360, 0),
    height: number(d.height, 'Device mounting height', 0, 1000, 3.2),
    fov: number(d.fov, 'Camera field of view', 1, 180, 72),
    range: number(d.range, 'Camera range', 0.1, 10000, 28),
    lens: number(d.lens, 'Camera lens', 0.1, 1000, 4),
    ...(d.type === 'camera' ? normalizeCamera(d) : {}),
    capacity: normalizeDeviceCapacity(d),
    catalogId: text(d.catalogId, DEFAULT_CATALOG[d.type], 96),
    model: text(d.model, '', 160), mounting: text(d.mounting, '', 160),
    requirement: text(d.requirement, '', 2000), notes: text(d.notes, '', 4000),
    status: d.status || 'proposed',
  };
}
function normalizeRoute(raw, floorDevices, routeIds) {
  const r = object(raw, 'Cable route');
  const fromDeviceId = id(r.fromDeviceId, 'Route start');
  const toDeviceId = id(r.toDeviceId, 'Route end');
  if (fromDeviceId === toDeviceId || !floorDevices.has(fromDeviceId) || !floorDevices.has(toDeviceId)) {
    throw new Error('Cable routes must connect two different devices on the same floor.');
  }
  if (!CABLE_TYPES.has(r.cableType)) throw new Error('A cable route has an unsupported cable type.');
  return {
    id: uniqueId(r.id, 'Cable route', routeIds), name: text(r.name, 'Cable route'),
    fromDeviceId, toDeviceId,
    via: list(r.via ?? [], 'Cable waypoints', 500).map(p => coordinate(object(p, 'Waypoint'), 'Waypoint')),
    cableType: r.cableType, slackPercent: number(r.slackPercent, 'Cable slack', 0, 100, 10),
  };
}
function barrierLocalPoints(points) {
  const first = points[0];
  const metresLng = 111320 * Math.cos(first.lat * Math.PI / 180);
  return points.map(p => {
    const longitudeDelta = ((p.lng - first.lng + 540) % 360) - 180;
    return { x: longitudeDelta * metresLng, y: (p.lat - first.lat) * 111320 };
  });
}
function barrierSegmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const side = (p, q, r) => {
    const value = cross(p, q, r);
    const tolerance = 1e-10 * Math.max(1, Math.hypot(q.x - p.x, q.y - p.y) * Math.hypot(r.x - p.x, r.y - p.y));
    return Math.abs(value) <= tolerance ? 0 : Math.sign(value);
  };
  const onSegment = (p, q, r) => r.x >= Math.min(p.x, q.x) - 1e-7 && r.x <= Math.max(p.x, q.x) + 1e-7
    && r.y >= Math.min(p.y, q.y) - 1e-7 && r.y <= Math.max(p.y, q.y) + 1e-7;
  const abC = side(a, b, c), abD = side(a, b, d), cdA = side(c, d, a), cdB = side(c, d, b);
  if (abC * abD < 0 && cdA * cdB < 0) return true;
  return (abC === 0 && onSegment(a, b, c)) || (abD === 0 && onSegment(a, b, d))
    || (cdA === 0 && onSegment(c, d, a)) || (cdB === 0 && onSegment(c, d, b));
}
function assertSimpleObstacle(points, message) {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      // Adjacent edges share their defining vertex, including first/last edges.
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      if (barrierSegmentsIntersect(points[i], points[(i + 1) % points.length], points[j], points[(j + 1) % points.length])) {
        throw new Error(message);
      }
    }
  }
}

function canonicalPolygonPoints(input, label, crossingMessage) {
  const points = [...input];
  if (points.length < 3) throw new Error(label + ' needs at least three points.');
  const local = barrierLocalPoints(points);
  // Store the unique vertices whether the input ring is open or explicitly closed.
  if (Math.hypot(local.at(-1).x, local.at(-1).y) < 0.01) {
    points.pop();
    local.pop();
  }
  if (points.length < 3) throw new Error(label + ' needs at least three distinct points.');
  for (let i = 0; i < local.length; i++) {
    const a = local[i], next = local[(i + 1) % local.length];
    if (Math.hypot(next.x - a.x, next.y - a.y) < 0.01) {
      throw new Error(label + ' edges must be at least one centimetre long.');
    }
  }
  assertSimpleObstacle(local, crossingMessage);
  let twiceArea = 0;
  for (let i = 0; i < local.length; i++) {
    const a = local[i], next = local[(i + 1) % local.length];
    twiceArea += a.x * next.y - next.x * a.y;
  }
  if (Math.abs(twiceArea) < 0.02) throw new Error(label + ' must enclose a nonzero area.');
  return points;
}
function normalizedBarrier(raw, seen) {
  const b = object(raw, 'Barrier');
  if (!['wall', 'obstacle'].includes(b.kind)) throw new Error('A barrier has an unsupported kind.');
  let points = list(b.points, 'Barrier points', 100).map(p => coordinate(object(p, 'Barrier point'), 'Barrier point'));
  if (b.kind === 'obstacle') {
    points = canonicalPolygonPoints(points, 'An obstacle', 'Draw the obstruction outline without crossing its edges.');
  } else {
    if (points.length < 2) throw new Error('A wall needs at least two points.');
    const local = barrierLocalPoints(points);
    for (let i = 0; i < local.length - 1; i++) {
      if (Math.hypot(local[i + 1].x - local[i].x, local[i + 1].y - local[i].y) < 0.01) {
        throw new Error('Barrier segments must be at least one centimetre long.');
      }
    }
  }
  if (b.enabled !== undefined && typeof b.enabled !== 'boolean') throw new Error('Barrier enabled must be true or false.');
  return {
    id: uniqueId(b.id, 'Barrier', seen), name: text(b.name, b.kind === 'wall' ? 'Wall' : 'Obstacle'),
    kind: b.kind, points, height: number(b.height, 'Barrier height', 0.1, 50), enabled: b.enabled !== false,
  };
}
function normalizeCoverageArea(raw) {
  if (raw === undefined || raw === null) return null;
  const area = object(raw, 'Coverage area');
  const points = list(area.points, 'Coverage area points', 100).map(p => coordinate(object(p, 'Coverage area point'), 'Coverage area point'));
  return {
    points: canonicalPolygonPoints(points, 'The coverage area', 'Draw the coverage area outline without crossing its edges.'),
  };
}

export const MAX_FLOOR_ZONES = 100;

export function normalizeSecurityZone(raw) {
  const zone = object(raw, 'Security zone');
  const name = text(zone.name, '', 80);
  if (!name) throw new Error('Enter a name for the security zone.');
  if (!Object.hasOwn(ZONE_TYPES, zone.type)) throw new Error('Choose a valid zone type.');
  if (zone.targetLevel !== null && !ZONE_DORI_LEVELS.some(level => level.id === zone.targetLevel)) {
    throw new Error('Choose a valid DORI target for the zone.');
  }
  const points = list(zone.points, 'Zone points', 100).map(point =>
    coordinate(object(point, 'Zone point'), 'Zone point'));
  return {
    id: id(zone.id, 'Zone'), name, type: zone.type,
    targetLevel: zone.targetLevel,
    targetPercent: number(zone.targetPercent, 'Required zone coverage', 0.1, 100),
    points: canonicalPolygonPoints(points, 'The security zone', 'Draw the zone outline without crossing its edges.'),
  };
}

export function normalizeSurveyNote(raw, floorDevices) {
  const note = object(raw, 'Survey note');
  const anchor = object(note.anchor, 'Survey note location');
  let location;
  if (anchor.kind === 'device' && floorDevices.has(anchor.deviceId)) {
    location = { kind: 'device', deviceId: anchor.deviceId };
  } else if (anchor.kind === 'point') {
    location = { kind: 'point', ...coordinate(anchor, 'Survey pin') };
  } else {
    throw new Error('A device survey note must refer to a device on the same floor.');
  }
  const title = text(note.title, '', 100);
  if (!title) throw new Error('Enter a title for the survey note.');
  const notes = typeof note.notes === 'string'
    ? note.notes.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, ' ').trim().slice(0, 5000)
    : '';
  const measurements = list(note.measurements ?? [], 'Survey measurements', SURVEY_LIMITS.measurementsPerNote).map(rawMeasurement => {
    const measurement = object(rawMeasurement, 'Survey measurement');
    const label = text(measurement.label, '', 80);
    if (!label) throw new Error('Give each measurement a label.');
    if (!MEASUREMENT_UNITS.includes(measurement.unit)) throw new Error('Choose a supported measurement unit.');
    return { label, value: number(measurement.value, 'Measurement', 0, 1000000), unit: measurement.unit };
  });
  const photos = list(note.photos ?? [], 'Survey photos', SURVEY_LIMITS.photosPerNote).map(rawPhoto => {
    const photo = object(rawPhoto, 'Survey photo');
    if (typeof photo.dataUrl !== 'string' || !photo.dataUrl || photo.dataUrl.length > SURVEY_LIMITS.encodedPhotoChars) {
      throw new Error('A survey photo is invalid or too large.');
    }
    if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl)) {
      throw new Error('Survey photos must be embedded JPG, PNG, or WebP images.');
    }
    return { name: text(photo.name, 'Survey photo', 160), dataUrl: photo.dataUrl };
  });
  return { id: id(note.id, 'Survey note'), title, anchor: location, notes, measurements, photos };
}

function normalizeCosts(raw = {}) {
  object(raw, 'Costs');
  const result = {};
  for (const group of ['equipment', 'cable']) {
    if (raw[group] === undefined) continue;
    const values = object(raw[group], 'Cost overrides');
    if (Object.keys(values).length > 500) throw new Error('Too many cost overrides.');
    result[group] = {};
    for (const [key, value] of Object.entries(values)) {
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/.test(key) || ['constructor', 'prototype'].includes(key)) throw new Error('A cost override has an invalid key.');
      if (group === 'cable' && !CABLE_TYPES.has(key)) throw new Error('A cable cost uses an unsupported cable type.');
      result[group][key] = number(value, 'Cost', 0, 1000000);
    }
  }
  return result;
}
export function normalizeEstimate(raw = {}) {
  object(raw, 'Estimate');
  if (raw.includeLabor !== undefined && typeof raw.includeLabor !== 'boolean') {
    throw new Error('Include labor must be true or false.');
  }
  const seen = new Set();
  const lines = list(raw.lines ?? [], 'Estimate lines', ESTIMATE_LINE_LIMIT).map(value => {
    const line = object(value, 'Estimate line');
    if (!Object.hasOwn(ESTIMATE_UNITS, line.category)) throw new Error('Choose an accessory or labor line.');
    if (!Object.hasOwn(ESTIMATE_UNITS[line.category], line.unit)) throw new Error('Choose a unit for this estimate line.');
    const description = text(line.description, '', 120);
    if (!description) throw new Error('Enter a description for the estimate line.');
    const quantity = number(line.quantity, 'Estimate quantity', 0.01, 1000000);
    const unitCost = number(line.unitCost, 'Estimate unit cost', 0, 1000000);
    return {
      id: uniqueId(line.id, 'Estimate line', seen), category: line.category, unit: line.unit, description,
      quantity: Math.round(quantity * 100) / 100, unitCost: Math.round(unitCost * 100) / 100,
    };
  });
  return { includeLabor: raw.includeLabor === true, lines };
}

function migrateV1(data) {
  const buildingId = 'building-a';
  const floorId = 'floor-ground';
  return {
    format: 'physec-studio', version: 2, id: makeId('project'), name: data.name || 'Imported project',
    activeFloorId: floorId, buildings: [{ id: buildingId, name: 'Building A' }],
    floors: [{ id: floorId, buildingId, name: data.plan?.name || 'Ground floor', plan: data.plan, devices: data.devices, routes: [] }],
    costs: {},
  };
}
function normalizeDesign(data, allowLocalAssets) {
  object(data, 'Project');
  if (data.format !== 'physec-studio' || ![1, 2].includes(data.version)) throw new Error('This is not a supported PhySec project file.');
  const p = data.version === 1 ? migrateV1(data) : data;
  const buildingIds = new Set(), floorIds = new Set(), deviceIds = new Set(), routeIds = new Set();
  let surveyPhotoChars = 0;
  const buildings = list(p.buildings, 'Buildings', 100).map(raw => {
    const b = object(raw, 'Building');
    return { id: uniqueId(b.id, 'Building', buildingIds), name: text(b.name, 'Building') };
  });
  if (!buildings.length) throw new Error('The project must have at least one building.');
  const floors = list(p.floors, 'Floors', 250).map(raw => {
    const f = object(raw, 'Floor');
    const floorId = uniqueId(f.id, 'Floor', floorIds);
    if (!buildingIds.has(f.buildingId)) throw new Error('A floor refers to a missing building.');
    const devices = list(f.devices ?? [], 'Devices', 5000).map(d => normalizeDevice(d, deviceIds));
    const floorDevices = new Set(devices.map(d => d.id));
    const barrierIds = new Set();
    const zoneIds = new Set();
    const zones = list(f.zones ?? [], 'Security zones', MAX_FLOOR_ZONES).map(rawZone => {
      const zone = normalizeSecurityZone(rawZone);
      uniqueId(zone.id, 'Zone', zoneIds);
      return zone;
    });
    const surveyIds = new Set();
    const surveyNotes = list(f.surveyNotes ?? [], 'Survey notes', SURVEY_LIMITS.notesPerFloor).map(rawNote => {
      const note = normalizeSurveyNote(rawNote, floorDevices);
      uniqueId(note.id, 'Survey note', surveyIds);
      return note;
    });
    surveyPhotoChars += surveyPhotoSize(surveyNotes);
    if (surveyPhotoChars > SURVEY_LIMITS.totalPhotoChars) throw new Error(SURVEY_PHOTO_LIMIT_MESSAGE);
    return {
      id: floorId, buildingId: f.buildingId, name: text(f.name, 'Floor'),
      plan: normalizePlan(f.plan, allowLocalAssets), devices,
      routes: list(f.routes ?? [], 'Cable routes', 5000).map(r => normalizeRoute(r, floorDevices, routeIds)),
      barriers: list(f.barriers ?? [], 'Barriers', 100).map(b => normalizedBarrier(b, barrierIds)),
      zones,
      surveyNotes,
      coverageArea: normalizeCoverageArea(f.coverageArea),
      coverageTargetHeight: number(f.coverageTargetHeight, 'Coverage target height', 0, 10, 0),
    };
  });
  if (!floors.length || !floorIds.has(p.activeFloorId)) throw new Error('The active floor is missing from the project.');
  return {
    format: 'physec-studio', version: 2, id: id(p.id, 'Project'), name: text(p.name, 'Untitled project'),
    activeFloorId: p.activeFloorId, buildings, floors, costs: normalizeCosts(p.costs),
    capacity: normalizeCapacity(p.capacity), estimate: normalizeEstimate(p.estimate),
  };
}

/** Rebuild known fields only. Revision designs cannot contain their own revision histories. */
export function normalizeProject(data, { allowLocalAssets = false } = {}) {
  const design = normalizeDesign(data, allowLocalAssets);
  const ids = new Set();
  const revisions = list(data.revisions ?? [], 'Revisions', MAX_PROJECT_REVISIONS).map(raw => {
    const revision = object(raw, 'Revision');
    const name = text(revision.name, '', MAX_REVISION_NAME);
    if (!name) throw new Error('Enter a name for the revision.');
    const snapshot = normalizeDesign(revision.design, allowLocalAssets);
    if (snapshot.id !== design.id) throw new Error('A revision belongs to a different project.');
    return {
      id: uniqueId(revision.id, 'Revision', ids), name,
      savedAt: number(revision.savedAt, 'Revision timestamp', 0, 8640000000000000), design: snapshot,
    };
  });
  return { ...design, revisions };
}

export function createProjectRevision(project, name) {
  const cleanedName = text(name, '', MAX_REVISION_NAME);
  if (!cleanedName) throw new Error('Enter a name for the revision.');
  return {
    id: makeId('revision'), name: cleanedName, savedAt: Date.now(),
    design: normalizeDesign(project, true),
  };
}
export function createDemoProject() {
  const plan = { ...createBlankPlan(), url: '/assets/ground-floor.png', name: 'Ground floor', filename: 'Ground floor.png', opacity: 0.94, visible: true };
  const offset = (east, north) => ({ lat: plan.lat + north / 111320, lng: plan.lng + east / (111320 * Math.cos(plan.lat * Math.PI / 180)) });
  const device = (id, type, name, east, north, bearing = 0) => ({ id, type, name, ...offset(east, north), bearing, fov: 72, range: 28, height: 3.2, lens: 4, requirement: 'Monitor the entrance approach' });
  const devices = [
    device('C-01', 'camera', 'Northwest parking', -51, 34, 90), device('C-02', 'camera', 'North approach', 38, 34, 270),
    device('C-03', 'camera', 'West entrance', -52, -8, 180), device('C-04', 'camera', 'Main entrance', 0, -30, 180),
    device('C-05', 'camera', 'Loading dock', 48, -1, 80), device('C-06', 'camera', 'South parking', 49, -38, 270),
    device('R-01', 'reader', 'Lobby reader', -6, -23), device('R-02', 'reader', 'Staff entrance', -35, 8),
    device('R-03', 'reader', 'Dock reader', 36, 8), device('L-01', 'light', 'Entry lighting', -20, -39),
    device('L-02', 'light', 'Dock lighting', 56, 20),
  ];
  return normalizeProject({
    format: 'physec-studio', version: 2, id: makeId('project'), name: 'Westbrook Campus',
    activeFloorId: 'floor-ground', buildings: [{ id: 'building-a', name: 'Building A' }],
    floors: [{ id: 'floor-ground', buildingId: 'building-a', name: 'Ground floor', plan, devices, routes: [] }], costs: {},
  }, { allowLocalAssets: true });
}
function blobDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not embed a plan image.'));
    reader.readAsDataURL(blob);
  });
}
/** Portable object suitable for JSON.stringify; local demo assets are embedded once. */
export async function exportPortableProject(project) {
  const clean = normalizeProject(project, { allowLocalAssets: true });
  const assets = new Map();
  const floors = [...clean.floors, ...clean.revisions.flatMap(revision => revision.design.floors)];
  for (const floor of floors) {
    if (!floor.plan.url.startsWith('/assets/')) continue;
    const assetUrl = floor.plan.url;
    if (!assets.has(assetUrl)) {
      const response = await fetch(assetUrl);
      if (!response.ok) throw new Error('Could not load a plan image for export.');
      assets.set(assetUrl, await blobDataUrl(await response.blob()));
    }
    floor.plan.url = assets.get(assetUrl);
  }
  return normalizeProject(clean);
}
