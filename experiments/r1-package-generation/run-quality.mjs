import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://127.0.0.1:8099/experiments/r1-package-generation/harness.html'); await p.waitForFunction('window.ready');
for (const q of [0.94, 0.85, 0.75]) {
  const r = await p.evaluate(async q => { const orig = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb, type) { return orig.call(this, cb, type, q); };
    const r = await window.runVolume({ plans: 6, tables: 12, photoPages: 12 }); HTMLCanvasElement.prototype.toBlob = orig; return r; }, q);
  console.log(`JPEG quality ${q}: ` + Object.entries(r.stats).map(([k, s]) => `${k} ${(s.bytes / s.n / 1024).toFixed(0)} KiB/page`).join(', ') + `; 250 pages of this mix = ${(r.pdfBytes / r.pages * 250 / 1048576).toFixed(0)} MiB`);
}
await b.close();
