import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePdfFile, rasterDimensions, safePageLabel, pngDataUrlBytes, MAX_PDF_BYTES, MAX_RENDER_PIXELS, waitForAbort } from '../src/pdfImportUtils.js';

const file = (overrides = {}) => ({ name: 'site.pdf', type: 'application/pdf', size: 1024, arrayBuffer: async () => new ArrayBuffer(0), ...overrides });

test('PDF input rejects empty, oversized and unrelated files but permits files with missing MIME metadata', () => {
  assert.doesNotThrow(() => validatePdfFile(file()));
  assert.doesNotThrow(() => validatePdfFile(file({ type: '', name: 'Survey.PDF' })));
  assert.throws(() => validatePdfFile(file({ size: 0 })), /empty/);
  assert.throws(() => validatePdfFile(file({ size: MAX_PDF_BYTES + 1 })), /50 MB/);
  assert.throws(() => validatePdfFile(file({ name: 'photo.png', type: 'image/png' })), /PDF drawing/);
  assert.throws(() => validatePdfFile({ size: 200 }), /Choose a PDF/);
});

test('large landscape and portrait sheets retain their orientation and aspect while respecting the pixel budget', () => {
  const landscape = rasterDimensions(3370, 2384, 3200);
  const portrait = rasterDimensions(2384, 3370, 3200);
  assert.equal(landscape.width, 3200);
  assert.equal(portrait.height, 3200);
  assert.equal(landscape.height, portrait.width);
  assert.ok(Math.abs(landscape.width / landscape.height - 3370 / 2384) < 0.001);
  assert.ok(landscape.width * landscape.height <= MAX_RENDER_PIXELS);
});

test('canvas size stays bounded for square, enormous and thin page dimensions', () => {
  for (const [width, height] of [[100000, 100000], [1e9, 1], [1, 1e9], [72, 72]]) {
    const result = rasterDimensions(width, height, 100000);
    assert.ok(result.width <= 3200 && result.height <= 3200);
    assert.ok(result.width >= 1 && result.height >= 1);
    assert.ok(result.width * result.height <= MAX_RENDER_PIXELS);
    assert.ok(Number.isFinite(result.scale) && result.scale > 0);
  }
  assert.throws(() => rasterDimensions(Infinity, 100, 100), /invalid dimensions/);
  assert.throws(() => rasterDimensions(100, 0, 100), /invalid dimensions/);
  assert.throws(() => rasterDimensions(100, 100, NaN), /invalid dimensions/);
});

test('thumbnail and preview resolutions do not allocate the final import resolution', () => {
  const thumbnail = rasterDimensions(1000, 500, 240);
  const preview = rasterDimensions(1000, 500, 1400);
  assert.deepEqual({ width: thumbnail.width, height: thumbnail.height }, { width: 240, height: 120 });
  assert.deepEqual({ width: preview.width, height: preview.height }, { width: 1400, height: 700 });
  assert.ok(preview.width * preview.height < 3200 * 1600);
});

test('PDF page labels remove control/bidi characters, stay bounded, and fall back to the page number', () => {
  assert.equal(safePageLabel('A-102', 2), 'A-102');
  assert.equal(safePageLabel('\u202eA\u0000-103\u2066', 3), 'A-103');
  assert.equal(safePageLabel('', 5), '5');
  assert.equal(safePageLabel(null, 6), '6');
  assert.equal(safePageLabel('x'.repeat(200), 7).length, 64);
});

test('embedded image size is counted as decoded bytes rather than base64 character count', () => {
  for (const size of [1, 2, 3, 1024, 65537]) {
    const data = Buffer.alloc(size, 1).toString('base64');
    assert.equal(pngDataUrlBytes('data:image/png;base64,' + data), size);
  }
  assert.throws(() => pngDataUrlBytes('data:,'), /converted/);
  assert.throws(() => pngDataUrlBytes('data:image/jpeg;base64,eA=='), /converted/);
});


test('cancelling a PDF wait stops the work and observes a late rejection', async () => {
  const controller = new AbortController();
  let rejectSource;
  let cancelled = 0;
  const source = new Promise((_, reject) => { rejectSource = reject; });
  const waiting = waitForAbort(source, controller.signal, () => { cancelled++; });
  controller.abort();
  await assert.rejects(waiting, { name: 'AbortError' });
  assert.equal(cancelled, 1);
  rejectSource(new Error('worker finished cancelling'));
  await new Promise(resolve => setImmediate(resolve));
});

test('already-cancelled PDF waits still observe the supplied operation and safely reject', async () => {
  const controller = new AbortController();
  controller.abort();
  const source = Promise.reject(new Error('late source rejection'));
  await assert.rejects(waitForAbort(source, controller.signal, () => { throw new Error('cleanup exception'); }), { name: 'AbortError' });
  await new Promise(resolve => setImmediate(resolve));
});

test('completed PDF waits remove cancellation callbacks and preserve source failures', async () => {
  const controller = new AbortController();
  let cancelled = false;
  assert.equal(await waitForAbort(Promise.resolve('ready'), controller.signal, () => { cancelled = true; }), 'ready');
  controller.abort();
  assert.equal(cancelled, false);
  const failure = new Error('bad page');
  await assert.rejects(waitForAbort(Promise.reject(failure), new AbortController().signal), error => error === failure);
});
