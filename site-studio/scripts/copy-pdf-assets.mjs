import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const project = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(project, 'node_modules', 'pdfjs-dist');
const target = path.join(project, 'public', 'pdfjs');
await mkdir(target, { recursive: true });
for (const folder of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  await cp(path.join(source, folder), path.join(target, folder), { recursive: true });
}
await cp(path.join(source, 'LICENSE'), path.join(target, 'LICENSE'));
const { version } = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
await writeFile(path.join(target, 'version.json'), JSON.stringify({ package: 'pdfjs-dist', version }) + '\n');
console.log('Copied local PDF.js fonts, CMaps, image decoders, and color profiles (' + version + ').');
