import test from 'node:test';
import assert from 'node:assert/strict';
import { packPdfPages } from '../src/rasterPdf.js';

test('PDF references use byte offsets even when the page image contains binary data', async () => {
  const binary = new Uint8Array([255, 216, 226, 0, 255, 217]);
  const pages = Array.from({ length: 2 }, () => ({ jpeg: binary, pixelWidth: 30, pixelHeight: 20 }));
  const pdf = packPdfPages(pages, 792, 612);
  assert.equal(pdf.type, 'application/pdf');
  const bytes = Buffer.from(await pdf.arrayBuffer());
  const file = bytes.toString('latin1');
  assert.ok(file.startsWith('%PDF-1.4'));
  assert.match(file, /\/Count 2\b/);
  assert.equal((file.match(/\/MediaBox \[0 0 792 612\]/g) ?? []).length, 2);
  assert.equal((file.match(/\/Length 6 >>\nstream\n/g) ?? []).length, 2);
  const xref = Number(file.match(/startxref\n(\d+)/)[1]);
  const table = file.slice(xref).match(/^xref\n0 9\n0000000000 65535 f \n((?:\d{10} 00000 n \n){8})/);
  assert.ok(table);
  table[1].trimEnd().split('\n').forEach((line, index) => {
    const offset = Number(line.slice(0, 10));
    assert.equal(file.slice(offset, offset + 7), index + 1 + ' 0 obj');
  });
  assert.ok(bytes.includes(binary));
});
