// R2: can the prototype's coverage solver handle the busiest acceptance plan
// (about 60 cameras, all targeted zones) within 10 s at 1 m sampling or finer?
// Synthetic fixture; timings are from this machine, not the reference laptop.
import { computeCombinedCoverage } from './patched/coverage.js';
import { zoneCoverage } from './patched/securityZones.js';
import os from 'node:os';

const ORIGIN = { lat: 41.8898, lng: -87.6366 };
const M_LAT = 1 / 111320, M_LNG = 1 / (111320 * Math.cos(ORIGIN.lat * Math.PI / 180));
const at = (x, y) => ({ lat: ORIGIN.lat + y * M_LAT, lng: ORIGIN.lng + x * M_LNG });
let seed = 42; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

function fixture({ width, height, cameras, walls, segmentsPerWall, obstacles, zones }) {
  const area = [at(0, 0), at(width, 0), at(width, height), at(0, height)];
  const cams = Array.from({ length: cameras }, (_, i) => ({
    id: 'C-' + i, ...at(rnd() * width, rnd() * height), bearing: rnd() * 360,
    lens: 2.8 + rnd() * 6, height: 3.2 + rnd() * 3, tilt: 15 + rnd() * 25, range: 20 + rnd() * 30, imageWidth: 2560,
  }));
  const barriers = [];
  for (let i = 0; i < walls; i++) {
    let x = rnd() * width, y = rnd() * height; const points = [at(x, y)];
    for (let s = 0; s < segmentsPerWall; s++) { if (s % 2) y += (rnd() - 0.5) * 16; else x += (rnd() - 0.5) * 16; points.push(at(x, y)); }
    barriers.push({ id: 'W-' + i, kind: 'wall', height: 3, points });
  }
  for (let i = 0; i < obstacles; i++) {
    const x = rnd() * (width - 8), y = rnd() * (height - 8), w = 2 + rnd() * 6, h = 2 + rnd() * 6;
    barriers.push({ id: 'O-' + i, kind: 'obstacle', height: 2.5, points: [at(x, y), at(x + w, y), at(x + w, y + h), at(x, y + h)] });
  }
  const zoneList = Array.from({ length: zones }, (_, i) => {
    const x = rnd() * (width - 20), y = rnd() * (height - 15), w = 8 + rnd() * 12, h = 6 + rnd() * 9;
    return { id: 'Z-' + i, targetLevel: 'recognize', targetPercent: 90, points: [at(x, y), at(x + w, y), at(x + w, y + h), at(x, y + h)] };
  });
  return { area, cams, barriers, zoneList, edges: barriers.reduce((n, b) => n + b.points.length - (b.kind === 'wall' ? 1 : 0), 0) };
}

function time(fn, runs = 5) {
  const t = []; let r;
  for (let i = 0; i < runs; i++) { const s = performance.now(); r = fn(); t.push(performance.now() - s); }
  t.sort((a, b) => a - b); return { ms: t[Math.floor(runs / 2)], max: t.at(-1), result: r };
}

const cases = [
  ['Typical busiest plan', { width: 140, height: 100, cameras: 60, walls: 40, segmentsPerWall: 6, obstacles: 10, zones: 20 }],
  ['Dense walls (limit of 100 barriers)', { width: 140, height: 100, cameras: 60, walls: 90, segmentsPerWall: 10, obstacles: 10, zones: 20 }],
  ['Large outdoor plan', { width: 300, height: 200, cameras: 60, walls: 40, segmentsPerWall: 6, obstacles: 10, zones: 20 }],
];
console.log(JSON.stringify({ node: process.version, cpu: os.cpus()[0].model, cores: os.cpus().length }));
for (const [name, spec] of cases) {
  seed = 42; const f = fixture(spec);
  console.log(`\n## ${name}: ${spec.width} x ${spec.height} m, ${spec.cameras} cameras, ${f.barriers.length} barriers (${f.edges} edges), ${spec.zones} zones`);
  for (const [cellSize, maxCells] of [[1, 5000000], [0.5, 5000000]]) {
    const floor = time(() => computeCombinedCoverage(f.cams, f.barriers, { area: f.area, targetHeight: 0, cellSize, maxCells, dori: true, contours: true }));
    const r = floor.result;
    const zones = time(() => f.zoneList.map(z => zoneCoverage(z, computeCombinedCoverage(f.cams, f.barriers, { area: z.points, targetHeight: 0, cellSize: Math.min(cellSize, 0.75), maxCells, dori: true, contours: true }))), 3);
    const coarsest = Math.max(...f.zoneList.map(z => computeCombinedCoverage(f.cams, f.barriers, { area: z.points, targetHeight: 0, cellSize: Math.min(cellSize, 0.75), maxCells, dori: true }).stats.cellSize ?? 0));
    console.log(`requested ${cellSize} m (cap ${maxCells} cells): ` + (r.invalid ? `FAILED: ${r.error ?? r.message ?? JSON.stringify(r.warnings).slice(0, 120)}` :
      `used ${r.stats.cellSize.toFixed(2)} m, ${r.stats.sampledCells} cells, floor ${floor.ms.toFixed(0)} ms (max ${floor.max.toFixed(0)}), covered ${r.stats.coveredPercent.toFixed(1)}%`) +
      `; 20 zones ${zones.ms.toFixed(0)} ms at <= ${coarsest.toFixed(2)} m; sum of the two medians ${(floor.ms + zones.ms).toFixed(0)} ms`);
  }
}
