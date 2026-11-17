import { DORI_BANDS } from './dori.js';

export const ZONE_TYPES = {
  entrance: 'Entrance',
  restricted: 'Restricted area',
  parking: 'Parking',
  perimeter: 'Perimeter area',
  other: 'Other area',
};

export const ZONE_DORI_LEVELS = DORI_BANDS.slice(2).map((band, index) => ({
  id: band.label.toLowerCase(), label: band.label, rank: index + 2,
}));

export function zoneCoverage(zone, coverage) {
  const level = ZONE_DORI_LEVELS.find(option => option.id === zone.targetLevel);
  if (!level || coverage?.invalid || !coverage?.dori || !(coverage.stats.area > 0)) return null;

  const qualifying = coverage.dori.slice(level.rank);
  const qualifyingArea = qualifying.reduce((total, band) => total + band.area, 0);
  const percent = Math.min(100, 100 * qualifyingArea / coverage.stats.area);
  const polygons = coverage.contours ?? coverage.dori.map(band => band.polygons);
  return {
    level: level.label,
    percent,
    meets: percent + 1e-8 >= zone.targetPercent,
    qualifyingPolygons: polygons.slice(level.rank).flat(),
    gapPolygons: polygons.slice(0, level.rank).flat(),
  };
}

export const formatZonePercent = value => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
}).format(value) + '%';
