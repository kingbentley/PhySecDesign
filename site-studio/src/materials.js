import { catalogItemForDevice } from './catalog.js';
import { CABLE_TYPES, routeLengthMeters, routeBillableMeters } from './cables.js';

const finiteCost = (value, fallback) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000 ? value : fallback;
const list = value => Array.isArray(value) ? value : [];
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

export const ESTIMATE_UNITS = {
  accessory: { each: 'Each', kit: 'Kit', pack: 'Pack', m: 'Metre', lot: 'Lot' },
  labor: { hour: 'Hour', day: 'Day', visit: 'Visit', job: 'Job' },
};
export const ESTIMATE_LINE_LIMIT = 500;
const CATEGORY_ORDER = { equipment: 0, cable: 1, accessory: 2, labor: 3 };

export function estimateLineTotal(line) {
  const quantityHundredths = Math.round(line.quantity * 100);
  const unitCostCents = Math.round(line.unitCost * 100);
  return Math.round(quantityHundredths * unitCostCents / 100) / 100;
}

export function estimateTotals(rows) {
  const result = { equipment: 0, cable: 0, accessory: 0, labor: 0, total: 0 };
  for (const row of rows) if (Object.hasOwn(CATEGORY_ORDER, row.category)) result[row.category] += row.totalCost;
  result.total = result.equipment + result.cable + result.accessory + result.labor;
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, round(value)]));
}

/**
 * One row per catalog allowance or cable type, across all project floors.
 * Existing devices have their own count and never enter purchased quantity.
 * Route quantities include saved slack. Accessory and enabled labor lines
 * are included alongside the quantities derived from the design.
 */
export function buildBOM(project = {}) {
  const rows = new Map();
  const costs = project?.costs || {};
  for (const floor of list(project?.floors)) {
    const devices = list(floor?.devices).filter(device => device && typeof device === 'object');
    for (const device of devices) {
      const item = catalogItemForDevice(device);
      if (!item) continue;
      const key = `equipment:${item.id}`;
      if (!rows.has(key)) rows.set(key, {
        key, category: 'equipment', catalogId: item.id, type: item.type,
        description: item.name, model: item.model, quantity: 0, existingQuantity: 0,
        unit: 'each', unitCost: finiteCost(costs.equipment?.[item.id], item.unitCost),
        totalCost: 0,
      });
      const row = rows.get(key);
      if (device.status === 'existing') row.existingQuantity += 1;
      else row.quantity += 1;
    }
    for (const route of list(floor?.routes)) {
      const type = route?.cableType;
      const cable = Object.hasOwn(CABLE_TYPES, type) ? CABLE_TYPES[type] : undefined;
      if (!cable) continue;
      const baseLength = routeLengthMeters(route, devices);
      const billableLength = routeBillableMeters(route, devices);
      if (!Number.isFinite(baseLength) || !Number.isFinite(billableLength) || baseLength <= 0 || billableLength <= 0) continue;
      const key = `cable:${type}`;
      if (!rows.has(key)) rows.set(key, {
        key, category: 'cable', cableType: type, description: cable.label,
        model: '', quantity: 0, existingQuantity: 0, unit: 'm',
        unitCost: finiteCost(costs.cable?.[type], cable.unitCost), totalCost: 0,
        baseLength: 0, slackLength: 0, routeCount: 0,
      });
      const row = rows.get(key);
      row.quantity += billableLength;
      row.baseLength += baseLength;
      row.slackLength += Math.max(0, billableLength - baseLength);
      row.routeCount += 1;
    }
  }
  const derived = [...rows.values()].map(row => {
    const quantity = row.unit === 'm' ? round(row.quantity) : row.quantity;
    return { ...row, quantity, totalCost: round(quantity * row.unitCost),
      ...(row.category === 'cable' ? { baseLength: round(row.baseLength), slackLength: round(row.slackLength) } : {}),
    };
  });
  const manual = list(project?.estimate?.lines)
    .filter(row => row && (row.category === 'accessory' || (row.category === 'labor' && project.estimate.includeLabor === true)))
    .map(row => ({ ...row, key: row.category + ':' + row.id, existingQuantity: 0, totalCost: estimateLineTotal(row) }));
  return [...derived, ...manual].sort((a, b) =>
    CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] || a.description.localeCompare(b.description));
}

// Quoting alone does not prevent spreadsheet formula execution.
function csvText(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
const csvNumber = value => Number.isFinite(Number(value)) ? String(Number(value)) : '0';

export function bomToCsv(rows = []) {
  const header = ['Item', 'Category', 'Proposed quantity', 'Existing quantity', 'Unit', 'Unit cost (USD)', 'Line total (USD)'];
  const lines = [header.map(csvText).join(',')];
  for (const row of list(rows)) lines.push([
    csvText(row.description), csvText(row.category), csvNumber(row.quantity),
    csvNumber(row.existingQuantity), csvText(row.unit), csvNumber(row.unitCost), csvNumber(row.totalCost),
  ].join(','));
  return lines.join('\r\n') + '\r\n';
}
