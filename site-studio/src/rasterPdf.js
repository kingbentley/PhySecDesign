/**
 * Serialize print-ready RGB JPEG pages into a static PDF. Images are already
 * encoded by the browser, so the writer only owns page objects and byte offsets.
 */
export function packPdfPages(pages, width, height) {
  if (!pages.length) throw new Error('There are no pages to export.');
  const encode = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let bytes = 0;

  function append(part) {
    const chunk = typeof part === 'string' ? encode.encode(part) : part;
    parts.push(chunk);
    bytes += chunk.byteLength;
  }

  function object(id, ...content) {
    offsets[id] = bytes;
    append(id + ' 0 obj\n');
    content.forEach(append);
    append('\nendobj\n');
  }

  append('%PDF-1.4\n');
  append(new Uint8Array([37, 226, 227, 207, 211, 10]));
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const children = pages.map((_, index) => (3 + index * 3) + ' 0 R').join(' ');
  object(2, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + children + '] >>');
  pages.forEach(({ jpeg, pixelWidth, pixelHeight }, index) => {
    const page = 3 + index * 3;
    const stream = 'q\n' + width + ' 0 0 ' + height + ' 0 0 cm\n/Sheet Do\nQ\n';
    object(page, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + width + ' ' + height + '] ' +
      '/Resources << /XObject << /Sheet ' + (page + 2) + ' 0 R >> >> /Contents ' + (page + 1) + ' 0 R >>');
    object(page + 1, '<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream');
    object(page + 2, '<< /Type /XObject /Subtype /Image /Width ' + pixelWidth + ' /Height ' + pixelHeight +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.byteLength + ' >>\nstream\n',
    jpeg, '\nendstream');
  });
  const xref = bytes;
  append('xref\n0 ' + offsets.length + '\n0000000000 65535 f \n');
  for (const offset of offsets.slice(1)) append(String(offset).padStart(10, '0') + ' 00000 n \n');
  append('trailer\n<< /Size ' + offsets.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  return new Blob(parts, { type: 'application/pdf' });
}
