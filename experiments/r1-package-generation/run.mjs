import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch({ args: ['--enable-precise-memory-info'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 300)));
await p.goto('http://127.0.0.1:8099/experiments/r1-package-generation/harness.html'); await p.waitForFunction('window.ready');
const mib = x => (x / 1048576).toFixed(1) + ' MiB';
for (const [name, mix] of [
  ['Small check: 10 pages', { plans: 2, tables: 4, photoPages: 4 }],
  ['Volume A: 250 pages, plans and schedules heavy (30 plans, 120 tables, 100 photo pages)', { plans: 30, tables: 120, photoPages: 100 }],
  ['Volume B: 250 pages, all photo pages (500 photos)', { plans: 0, tables: 0, photoPages: 250 }],
]) {
  const r = await p.evaluate(m => window.runVolume(m), mix);
  console.log('\n## ' + name);
  console.log(`pages ${r.pages} at ${r.pixel} px; total ${(r.totalMs / 1000).toFixed(1)} s (pack ${r.packMs.toFixed(0)} ms, hash ${r.hashMs.toFixed(0)} ms); PDF ${mib(r.pdfBytes)}; peak JS heap ${r.peakHeapMB.toFixed(0)} MB`);
  for (const [k, s] of Object.entries(r.stats)) if (s.n) console.log(`  ${k}: ${s.n} pages, ${(s.ms / s.n).toFixed(0)} ms/page, ${(s.bytes / s.n / 1024).toFixed(0)} KiB/page`);
}
await b.close();
