import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVICE_TYPES, EQUIPMENT_CATALOG, catalogItem } from '../src/catalog.js';
import { buildBOM, bomToCsv, estimateTotals } from '../src/materials.js';
import { createBlankPlan, createDemoProject, exportPortableProject, normalizeProject } from '../src/projectModel.js';

const device = (id, changes = {}) => ({ id, type: 'camera', catalogId: 'camera-dome-4mp', name: id, status: 'proposed', lat: 0, lng: 0, ...changes });
const project = (floors, costs = {}) => ({ name: 'Test campus', buildings: [{ id: 'b-1', name: 'Office' }], floors, costs });
const floor = (id, devices, routes = []) => ({ id, buildingId: 'b-1', name: id, devices, routes });

test('generic catalog covers all eight device types and two camera variants', () => {
  assert.equal(Object.keys(DEVICE_TYPES).length, 8);
  assert.equal(EQUIPMENT_CATALOG.filter(item => item.type === 'camera').length, 2);
  for (const [type, meta] of Object.entries(DEVICE_TYPES)) {
    assert.ok(meta.label && meta.singular && meta.prefix && meta.color);
    assert.ok(EQUIPMENT_CATALOG.some(item => item.type === type));
  }
  assert.equal(catalogItem('unknown'), undefined);
});

test('proposed quantities aggregate across floors while existing devices are counted separately', () => {
  const rows = buildBOM(project([
    floor('ground', [device('C-01'), device('C-02', { status: 'existing' })]),
    floor('upper', [device('C-01'), device('C-02')]),
  ]));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 3);
  assert.equal(rows[0].existingQuantity, 1);
  assert.equal(rows[0].totalCost, 1350);
});

test('an existing-only catalog row has no purchased quantity or cost', () => {
  const [row] = buildBOM(project([floor('ground', [device('C-01', { status: 'existing' })])]));
  assert.equal(row.quantity, 0);
  assert.equal(row.existingQuantity, 1);
  assert.equal(row.totalCost, 0);
});

test('separate catalog variants remain separate line items', () => {
  const rows = buildBOM(project([floor('ground', [device('C-01'), device('C-02', { catalogId: 'camera-bullet-8mp' })])]));
  assert.equal(rows.length, 2);
  assert.equal(rows.reduce((sum, row) => sum + row.totalCost, 0), 1100);
});

test('unit cost overrides include zero, and invalid values use catalog allowances', () => {
  const sample = [floor('ground', [device('C-01'), device('C-02')])];
  assert.equal(buildBOM(project(sample, { equipment: { 'camera-dome-4mp': 399.5 } }))[0].totalCost, 799);
  assert.equal(buildBOM(project(sample, { equipment: { 'camera-dome-4mp': 0 } }))[0].totalCost, 0);
  for (const invalid of [NaN, Infinity, -4, 1e100, '300', null]) {
    assert.equal(buildBOM(project(sample, { equipment: { 'camera-dome-4mp': invalid } }))[0].unitCost, 450);
  }
});

test('legacy devices fall back by type and malformed/missing data is safe', () => {
  for (const empty of [undefined, null, {}, { floors: null }, { floors: [null, {}, { devices: null, routes: null }] }]) assert.deepEqual(buildBOM(empty), []);
  const rows = buildBOM(project([floor('ground', [null, {}, device('C-01', { catalogId: undefined }), { id: 'bad', type: 'unsupported' }])]));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 1);
});

test('route quantities include drawn segments and route-specific slack, aggregated across floors', () => {
  const a = device('C-01');
  const b = device('SW-01', { type: 'switch', catalogId: 'switch-poe-8', lat: 0, lng: 0.001 });
  const route = { id: 'r-1', fromDeviceId: a.id, toDeviceId: b.id, via: [], cableType: 'cat6', slackPercent: 20 };
  const rows = buildBOM(project([floor('ground', [a, b], [route]), floor('upper', [a, b], [{ ...route, slackPercent: 0 }])], { cable: { cat6: 2 } }));
  const cable = rows.find(row => row.category === 'cable');
  // 0.001 degrees of longitude at the equator is about 111.195 m.
  assert.equal(cable.quantity, 244.63);
  assert.equal(cable.baseLength, 222.39);
  assert.equal(cable.slackLength, 22.24);
  assert.equal(cable.routeCount, 2);
  assert.equal(cable.totalCost, 489.26);
  assert.equal(cable.unit, 'm');
});

test('invalid routes and unknown cable types cannot add materials', () => {
  const devices = [null, device('C-01'), device('C-02', { lng: 0.001 })];
  const valid = { fromDeviceId: 'C-01', toDeviceId: 'C-02', via: [], cableType: 'cat6' };
  const routes = [{ ...valid, toDeviceId: 'missing' }, { ...valid, via: [{ lat: NaN, lng: 0 }] }, { ...valid, cableType: 'unknown' }, { ...valid, cableType: '__proto__' }, null];
  assert.equal(buildBOM(project([floor('ground', devices, routes)])).filter(row => row.category === 'cable').length, 0);
});

test('CSV escapes quotes, commas and newlines and neutralizes formula-leading text', () => {
  const csv = bomToCsv([
    { description: '=HYPERLINK("bad")', category: 'equipment', quantity: 1, existingQuantity: 0, unit: 'each', unitCost: 12, totalCost: 12 },
    { description: '  +CMD()', category: 'equipment', quantity: 1, existingQuantity: 0, unit: 'each', unitCost: 2, totalCost: 2 },
    { description: 'A, "quoted"\nitem', category: 'equipment', quantity: 1, existingQuantity: 0, unit: 'each', unitCost: 3, totalCost: 3 },
  ]);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"\'  +CMD()"'));
  assert.ok(csv.includes('"A, ""quoted""\nitem"'));
  assert.ok(csv.endsWith('\r\n'));
  assert.ok(bomToCsv().includes('Unit cost (USD)'));
});

const accessory = { id: 'estimate-1', category: 'accessory', description: 'Mounting hardware', unit: 'kit', quantity: 0.5, unitCost: 20.15 };
const labor = { id: 'estimate-2', category: 'labor', description: 'Camera installation', unit: 'hour', quantity: 6.5, unitCost: 85 };

test('accessories contribute to the estimate and CSV while labor follows the inclusion setting', () => {
  const devices = [device('C-01'), device('C-02', { lng: 0.001, status: 'existing' })];
  const route = { id: 'r-1', fromDeviceId: 'C-01', toDeviceId: 'C-02', via: [], cableType: 'cat6', slackPercent: 20 };
  const sample = {
    ...project([floor('ground', devices, [route])], { cable: { cat6: 2 } }),
    estimate: { includeLabor: false, lines: [labor, accessory] },
  };
  const withoutLabor = buildBOM(sample);
  assert.deepEqual(withoutLabor.map(row => row.category), ['equipment', 'cable', 'accessory']);
  assert.deepEqual(estimateTotals(withoutLabor), { equipment: 450, cable: 266.86, accessory: 10.08, labor: 0, total: 726.94 });
  assert.match(bomToCsv(withoutLabor), /"Mounting hardware","accessory",0.5,0,"kit",20.15,10.08/);
  assert.doesNotMatch(bomToCsv(withoutLabor), /Camera installation/);

  const withLabor = buildBOM({ ...sample, estimate: { ...sample.estimate, includeLabor: true } });
  assert.deepEqual(estimateTotals(withLabor), { equipment: 450, cable: 266.86, accessory: 10.08, labor: 552.5, total: 1279.44 });
  assert.match(bomToCsv(withLabor), /"Camera installation","labor",6.5,0,"hour",85,552.5/);
  assert.deepEqual(sample.estimate.lines, [labor, accessory]);
});

test('portable projects keep accessory and labor lines and validate older or malformed estimates', async () => {
  const demo = createDemoProject();
  demo.floors[0].plan = createBlankPlan();
  delete demo.estimate;
  assert.deepEqual(normalizeProject(demo).estimate, { includeLabor: false, lines: [] });

  const estimate = { includeLabor: true, lines: [accessory, labor] };
  const portable = await exportPortableProject({ ...demo, estimate });
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(portable))).estimate, estimate);
  for (const invalid of [{ ...labor, unit: 'kit' }, { ...labor, quantity: 0 }, { ...labor, unitCost: -1 }, { ...labor, description: '   ' }]) {
    assert.throws(() => normalizeProject({ ...demo, estimate: { includeLabor: false, lines: [invalid] } }));
  }
  assert.throws(() => normalizeProject({ ...demo, estimate: { includeLabor: false, lines: [accessory, accessory] } }));
});
