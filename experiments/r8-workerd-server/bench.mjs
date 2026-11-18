// 1,000 sequential small writes over HTTP (keep-alive), then 1,000 with 16 in flight.
const B = "http://127.0.0.1:8787";
const put = (o, i) => fetch(`${B}/o/${o}/put?k=k${i}&v=${i}`, { method: "POST" }).then((r) => r.json());
for (let i = 0; i < 50; i++) await put("warm", i);
let t = performance.now(); const lat = [];
for (let i = 0; i < 1000; i++) { const s = performance.now(); const r = await put("seq", i); if (!r.ok) throw new Error("fail"); lat.push(performance.now() - s); }
let ms = performance.now() - t; lat.sort((a, b) => a - b);
console.log(`sequential: 1000 writes in ${ms.toFixed(0)} ms = ${(1e6 / ms).toFixed(0)}/s; p50 ${lat[500].toFixed(2)} ms, p99 ${lat[990].toFixed(2)} ms, max ${lat[999].toFixed(2)} ms`);
t = performance.now(); let n = 0;
await Promise.all(Array.from({ length: 16 }, async () => { while (n < 1000) await put("conc", n++); }));
ms = performance.now() - t;
console.log(`16 concurrent, one object: 1000 writes in ${ms.toFixed(0)} ms = ${(1e6 / ms).toFixed(0)}/s`);
t = performance.now(); n = 0;
await Promise.all(Array.from({ length: 16 }, async (_, w) => { while (n < 1000) await put("multi" + w, n++); }));
ms = performance.now() - t;
console.log(`16 concurrent, 16 objects: 1000 writes in ${ms.toFixed(0)} ms = ${(1e6 / ms).toFixed(0)}/s`);
