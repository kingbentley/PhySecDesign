import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto('http://127.0.0.1:5183/'); await p.waitForTimeout(5000);
const r = await p.evaluate(() => ({ markers: document.querySelectorAll('.leaflet-marker-icon').length, buttons: document.querySelectorAll('button').length, title: document.title }));
console.log(JSON.stringify({ ...r, pageErrors: errs })); await b.close();
