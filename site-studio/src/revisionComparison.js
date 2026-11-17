import { latLngToPlanPoint, planProjectedSize } from './alignment.js';
import { sameDesignValue } from './projectHistory.js';

export function comparisonFloors(left, right) {
  const floors = new Map();
  for (const design of [left, right]) {
    const buildings = new Map(design.buildings.map(building => [building.id, building.name]));
    for (const floor of design.floors) floors.set(floor.id, {
      id: floor.id, label: `${buildings.get(floor.buildingId)} / ${floor.name}`,
    });
  }
  return [...floors.values()];
}

export function compareFloorDevices(before, after) {
  const left = new Map(before?.devices.map(device => [device.id, device]));
  const right = new Map(after?.devices.map(device => [device.id, device]));
  const changes = [];
  for (const id of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(id);
    const b = right.get(id);
    if (sameDesignValue(a, b)) continue;
    const state = !a ? 'Added' : !b ? 'Removed' : 'Changed';
    const { lat, lng, ...details } = b ?? a;
    const moved = a && b && (a.lat !== lat || a.lng !== lng);
    const changedFields = a && b ? Object.keys(details).filter(key => !sameDesignValue(a[key], details[key])) : [];
    const detail = moved ? ['Location'] : [];
    if (changedFields.includes('bearing')) detail.push(`Aim ${a.bearing}° → ${b.bearing}°`);
    if (changedFields.some(key => key !== 'bearing')) detail.push('Properties');
    changes.push({ id, name: (b ?? a).name, state, detail: detail.join(' · ') });
  }
  return changes.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export function comparisonFrame(left, right) {
  const floors = [left, right].filter(Boolean);
  const reference = { ...floors[0].plan, width: 1, height: 1, rotation: 0 };
  const unit = planProjectedSize(reference).width;
  const project = point => {
    const { u, v } = latLngToPlanPoint(reference, point);
    return { x: u - 0.5, y: v - 0.5 };
  };
  const drawing = plan => {
    const size = planProjectedSize(plan);
    return { ...project(plan), width: size.width / unit, height: size.height / unit };
  };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function include({ x, y }) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  for (const floor of floors) {
    include(project(floor.plan));
    if (floor.plan.url && floor.plan.visible) {
      const { x, y, width, height } = drawing(floor.plan);
      const angle = floor.plan.rotation * Math.PI / 180;
      const halfWidth = (Math.abs(Math.cos(angle) * width) + Math.abs(Math.sin(angle) * height)) / 2;
      const halfHeight = (Math.abs(Math.sin(angle) * width) + Math.abs(Math.cos(angle) * height)) / 2;
      include({ x: x - halfWidth, y: y - halfHeight });
      include({ x: x + halfWidth, y: y + halfHeight });
    }
    for (const device of floor.devices) include(project(device));
    const paths = [...floor.routes.map(route => route.via), ...(floor.barriers ?? []).map(barrier => barrier.points),
      ...(floor.zones ?? []).map(zone => zone.points)];
    for (const item of paths) {
      for (const point of item) include(project(point));
    }
  }
  const span = Math.max(maxX - minX, (maxY - minY) * 1.6, 30);
  const width = span * 1.2;
  const height = width / 1.6;
  const bounds = { x: (minX + maxX - width) / 2, y: (minY + maxY - height) / 2, width, height };
  return {
    project, drawing, bounds,
    viewBox: `${bounds.x} ${bounds.y} ${width} ${height}`,
    marker: width / 110,
  };
}
