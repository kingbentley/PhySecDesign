import { latLngToPlanPoint } from './alignment.js';
import { computeCombinedCoverage } from './coverage.js';
import { defaultCoverageArea } from './coverageArea.js';
import { CABLE_TYPES, routePoints } from './cables.js';
import { DEVICE_TYPES } from './catalog.js';
import { DORI_BANDS } from './dori.js';
import { surveyPosition } from './survey.js';
import { fitText, rule, textStyle, wrapText, REPORT_LINE, REPORT_MUTED, REPORT_TEAL } from './reportPaper.js';

const VISIBILITY = [
  { label: 'Unseen', color: '#ca675d', opacity: 0.26, key: 'uncoveredPolygons' },
  { label: 'One camera', color: '#168d76', opacity: 0.34, key: 'singlePolygons' },
  { label: 'Two or more cameras', color: '#7663bf', opacity: 0.41, key: 'overlapPolygons' },
];

export const refId = (prefix, index) => prefix + '-' + String(index + 1).padStart(2, '0');

function prepareCoverage(floor, mode) {
  if (mode === 'none') return null;
  const cameras = floor.devices.filter(device => device.type === 'camera');
  if (!cameras.length) return null;
  const area = (floor.coverageArea ?? defaultCoverageArea(floor.plan, cameras)).points;
  return computeCombinedCoverage(cameras, floor.barriers, {
    area, targetHeight: floor.coverageTargetHeight, dori: mode === 'dori',
    contours: true, maxCells: 10000, cellSize: 0.75,
  });
}

function floorProjection(floor, bounds, coverage) {
  const plan = floor.plan;
  const local = point => {
    const { u, v } = latLngToPlanPoint(plan, point);
    return { x: u * plan.width, y: v * plan.height };
  };

  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  function add({ x, y }) {
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (plan.url) {
    add({ x: 0, y: 0 });
    add({ x: plan.width, y: plan.height });
  }
  for (const device of floor.devices) add(local(device));
  for (const route of floor.routes) for (const point of route.via) add(local(point));
  for (const shape of [...floor.barriers, ...floor.zones]) for (const point of shape.points) add(local(point));
  for (const note of floor.surveyNotes) if (note.anchor.kind === 'point') add(local(note.anchor));
  for (const ring of coverage?.boundaryPolygons ?? []) for (const point of ring) add(local(point));
  if (!Number.isFinite(left)) {
    add({ x: plan.width / 2 - 25, y: plan.height / 2 - 25 });
    add({ x: plan.width / 2 + 25, y: plan.height / 2 + 25 });
  }

  const scale = Math.min((bounds.width - 46) / Math.max(10, right - left),
    (bounds.height - 46) / Math.max(10, bottom - top));
  const x = bounds.x + (bounds.width - (left + right) * scale) / 2;
  const y = bounds.y + (bounds.height - (top + bottom) * scale) / 2;
  return { scale, origin: { x, y }, point: point => {
    const metres = local(point);
    return { x: x + metres.x * scale, y: y + metres.y * scale };
  } };
}

function path(context, points, project, closed) {
  if (!points.length) return;
  const start = project(points[0]);
  context.moveTo(start.x, start.y);
  for (let i = 1; i < points.length; i++) {
    const point = project(points[i]);
    context.lineTo(point.x, point.y);
  }
  if (closed) context.closePath();
}

function outline(context, points, project, { color, width = 1, dash = [], closed = false, fill }) {
  if (points.length < 2) return;
  context.beginPath();
  path(context, points, project, closed);
  if (fill && closed) {
    context.fillStyle = fill;
    context.fill();
  }
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.stroke();
  context.setLineDash([]);
}

function fillCoverage(context, coverage, project, legend) {
  if (!coverage || coverage.invalid) return;
  legend.forEach((band, index) => {
    const pieces = coverage.contours?.[index] ?? (band.key ? coverage[band.key] : coverage.dori?.[index].polygons);
    if (!pieces?.length) return;
    context.beginPath();
    pieces.forEach(ring => path(context, ring, project, true));
    context.fillStyle = band.color;
    context.globalAlpha = band.opacity;
    context.fill('evenodd');
    context.globalAlpha = 1;
  });
  coverage.boundaryPolygons.forEach(ring => outline(context, ring, project, { color: '#71618a', dash: [4, 3], closed: true }));
}

function labelWriter(context, frame) {
  const labels = [];
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  return (label, point, color = '#224942') => {
    textStyle(context, 8.5, 700, color);
    const value = fitText(context, label, frame.width - 30);
    const w = context.measureText(value).width + 8, h = 13;
    const positions = [[9, -7], [-w - 9, -7], [7, 8], [-w - 7, 8], [7, -21], [-w - 7, -21]];
    const candidates = positions.map(([dx, dy]) => ({
      x: Math.min(frame.x + frame.width - w - 2, Math.max(frame.x + 2, point.x + dx)),
      y: Math.min(frame.y + frame.height - h - 2, Math.max(frame.y + 2, point.y + dy)), w, h,
    }));
    const box = candidates.find(candidate => !labels.some(other => overlaps(candidate, other))) ?? candidates[0];
    labels.push(box);
    context.fillStyle = '#fffffff2';
    context.fillRect(box.x, box.y, w, h);
    context.strokeStyle = '#cbd7d0';
    context.lineWidth = 0.6;
    context.strokeRect(box.x, box.y, w, h);
    textStyle(context, 8.5, 700, color);
    context.fillText(value, box.x + 4, box.y + 2);
  };
}

function mark(context, point, color, hollow = false, square = false) {
  context.beginPath();
  if (square) context.rect(point.x - 3.5, point.y - 3.5, 7, 7);
  else context.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
  context.fillStyle = hollow ? '#fff' : color;
  context.fill();
  context.lineWidth = hollow ? 1.5 : 1;
  context.strokeStyle = hollow ? color : '#fff';
  context.stroke();
}

function drawScale(context, frame, projection, rotation) {
  const max = 75 / projection.scale;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const distance = [5, 2, 1].map(value => value * magnitude).find(value => value <= max) ?? magnitude;
  const length = distance * projection.scale;
  const x = frame.x + 12, y = frame.y + frame.height - 27;
  context.fillStyle = '#ffffffec';
  context.fillRect(x - 4, y - 3, length + 12, 21);
  rule(context, x, y + 10, x + length, '#21453c');
  context.fillStyle = '#21453c';
  context.fillRect(x, y + 8, 0.8, 5);
  context.fillRect(x + length, y + 8, 0.8, 5);
  textStyle(context, 8, 700);
  context.fillText(new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(distance) + ' m', x, y);

  const north = { x: frame.x + frame.width - 22, y: frame.y + 25 };
  context.fillStyle = '#fffffff2';
  context.beginPath(); context.arc(north.x, north.y, 15, 0, Math.PI * 2); context.fill();
  context.save();
  context.translate(north.x, north.y);
  context.rotate(-(rotation ?? 0) * Math.PI / 180);
  context.beginPath(); context.moveTo(0, -8); context.lineTo(-4, 5); context.lineTo(4, 5); context.closePath();
  context.fillStyle = REPORT_TEAL; context.fill();
  context.restore();
  textStyle(context, 8, 700);
  context.fillText('N', north.x - 3, north.y + 16);
}

function legendBlock(context, frame, floor, mode, coverage) {
  const x = frame.x, width = frame.width;
  let y = frame.y;
  function heading(title) {
    textStyle(context, 10, 700, REPORT_TEAL);
    context.fillText(title, x, y);
    y += 17;
  }
  function item(label, color, icon = 'square', opacity = 1) {
    context.globalAlpha = opacity;
    mark(context, { x: x + 5, y: y + 4 }, color, false, icon === 'square');
    context.globalAlpha = 1;
    textStyle(context, 9, 400);
    context.fillText(fitText(context, label, width - 15), x + 14, y);
    y += 14;
  }
  function note(value) {
    textStyle(context, 8, 400, REPORT_MUTED);
    for (const line of wrapText(context, value, width)) {
      if (y + 10 > frame.y + frame.height) return;
      context.fillText(line, x, y);
      y += 10;
    }
    y += 5;
  }
  if (mode !== 'none') {
    heading(mode === 'dori' ? 'DORI coverage' : 'Camera visibility');
    if (coverage && !coverage.invalid) {
      const bands = mode === 'dori' ? DORI_BANDS : VISIBILITY;
      [...bands].reverse().forEach(band => item(
        band.minimum > 0 ? band.label + ' ≥ ' + band.minimum + ' px/m' : band.label,
        band.color, 'square', Math.min(1, band.opacity + 0.18)));
      note('Best available view at ' + floor.coverageTargetHeight + ' m above floor. ' +
        (coverage.stats.sampledCells ? coverage.stats.cellSize.toFixed(2) + ' m sample grid.' : 'No eligible coverage.'));
      if (mode === 'dori') note('IEC 62676-4:2014 pixel-density estimates.');
      if (coverage.stats.excludedCameraCount) note(coverage.stats.excludedCameraCount + ' camera(s) excluded from analysis.');
    } else {
      note(coverage?.warnings[0] ?? 'No cameras on this floor.');
    }
    y += 4;
  }
  heading('Plan key');
  for (const [type, metadata] of Object.entries(DEVICE_TYPES)) {
    if (floor.devices.some(device => device.type === type)) item(metadata.label, metadata.color, 'circle');
  }
  if (floor.devices.some(device => device.status === 'existing')) note('Hollow marker: existing device.');
  if (floor.routes.length) item('R-##  Cable route', '#42688f');
  if (floor.surveyNotes.length) item('S-##  Survey note', '#946b38');
  if (floor.zones.length) item('Z-##  Security zone', '#4d626a');
  if (floor.barriers.length) item('Wall or obstruction', '#667873');
  note('Print at actual size to use the scale bar. Coverage is a planning estimate.');
}

export function drawReportPlan(page, floor, image, mode) {
  const { context, x, width, top, bottom } = page;
  const map = { x, y: top, width: width - 173, height: bottom - top - 23 };
  const coverage = prepareCoverage(floor, mode);
  const projection = floorProjection(floor, map, coverage);
  const project = projection.point;
  context.fillStyle = '#f4f8f6';
  context.fillRect(map.x, map.y, map.width, map.height);
  context.save();
  context.beginPath(); context.rect(map.x, map.y, map.width, map.height); context.clip();
  if (image) context.drawImage(image, projection.origin.x, projection.origin.y,
    floor.plan.width * projection.scale, floor.plan.height * projection.scale);
  fillCoverage(context, coverage, project, mode === 'dori' ? DORI_BANDS : VISIBILITY);
  for (const barrier of floor.barriers) outline(context, barrier.points, project, {
    color: barrier.enabled ? '#667873' : '#a3aca8', width: barrier.kind === 'wall' ? 1.6 : 1,
    dash: barrier.enabled ? [] : [3, 2], closed: barrier.kind === 'obstacle', fill: '#ad886b3d',
  });
  const writeLabel = labelWriter(context, map);
  for (let i = 0; i < floor.routes.length; i++) {
    const route = floor.routes[i];
    const points = routePoints(route, floor.devices);
    if (points.length < 2) continue;
    const color = CABLE_TYPES[route.cableType]?.color ?? '#42688f';
    outline(context, points, project, { color, width: 1.25, dash: [4, 2] });
    const middle = Math.floor((points.length - 1) / 2);
    const a = project(points[middle]), b = project(points[middle + 1]);
    writeLabel(refId('R', i), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, color);
  }
  floor.zones.forEach((zone, index) => {
    outline(context, zone.points, project, { color: '#4d626a', dash: [5, 2], closed: true });
    writeLabel(refId('Z', index), project(zone.points[0]));
  });
  floor.devices.forEach(device => {
    const point = project(device);
    const color = DEVICE_TYPES[device.type]?.color ?? REPORT_TEAL;
    mark(context, point, color, device.status === 'existing');
    writeLabel(device.id, point, color);
  });
  floor.surveyNotes.forEach((note, index) => {
    const position = surveyPosition(note, floor.devices);
    if (!position) return;
    const point = project(position);
    if (note.anchor.kind === 'point') mark(context, point, '#946b38', false, true);
    writeLabel(refId('S', index), point, '#805a2e');
  });
  drawScale(context, map, projection, floor.plan.rotation);
  context.restore();
  context.strokeStyle = REPORT_LINE;
  context.lineWidth = 0.75;
  context.strokeRect(map.x, map.y, map.width, map.height);

  legendBlock(context, { x: map.x + map.width + 18, y: top, width: 155, height: map.height }, floor, mode, coverage);
  textStyle(context, 8.5, 400, REPORT_MUTED);
  const drawing = image ? floor.plan.filename + (floor.plan.sourcePdf ? ' · sheet ' + floor.plan.sourcePdf.pageLabel : '')
    : floor.plan.url ? 'Schematic floor view · drawing could not be rendered'
      : 'Schematic floor view · no drawing supplied';
  context.fillText(fitText(context, drawing, map.width), map.x, map.y + map.height + 8);
}
