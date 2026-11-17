export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_PLAN_PNG_BYTES = 12 * 1024 * 1024;
export const MAX_RENDER_PIXELS = 10_000_000;
export const MAX_RENDER_DIMENSION = 3200;

export function validatePdfFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Choose a PDF file to import.');
  if (!Number.isFinite(file.size) || file.size <= 0) throw new Error('This PDF is empty. Choose another drawing.');
  if (file.size > MAX_PDF_BYTES) throw new Error('Choose a PDF smaller than 50 MB, or split the drawing set into smaller files.');
  const extension = typeof file.name === 'string' && /\.pdf$/i.test(file.name);
  if (file.type !== 'application/pdf' && !extension) throw new Error('Choose a PDF drawing file.');
}

export function rasterDimensions(width, height, maxDimension = 1400) {
  if (![width, height, maxDimension].every(Number.isFinite) || width <= 0 || height <= 0 || maxDimension <= 0) {
    throw new Error('This page has invalid dimensions and cannot be rendered.');
  }
  const bound = Math.min(MAX_RENDER_DIMENSION, Math.max(32, Math.floor(maxDimension)));
  const scale = Math.min(bound / Math.max(width, height), Math.sqrt(MAX_RENDER_PIXELS / (width * height)));
  const outputWidth = Math.max(1, Math.floor(width * scale));
  const outputHeight = Math.max(1, Math.floor(height * scale));
  if (!Number.isFinite(scale) || scale <= 0 || outputWidth * outputHeight > MAX_RENDER_PIXELS) {
    throw new Error('This page is too large to render. Choose a different page.');
  }
  return { width: outputWidth, height: outputHeight, scale };
}

export function safePageLabel(value, pageNumber) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, 64) || String(pageNumber)
    : String(pageNumber);
}

export function pngDataUrlBytes(url) {
  const prefix = 'data:image/png;base64,';
  if (typeof url !== 'string' || !url.startsWith(prefix)) throw new Error('This page could not be converted to a plan image.');
  const data = url.slice(prefix.length);
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor(data.length * 3 / 4) - padding);
}


/** Observe the source promise even if cancellation wins, preventing late rejections. */
export function waitForAbort(promise, signal, onAbort) {
  const source = Promise.resolve(promise);
  const abortError = () => new DOMException('PDF import cancelled.', 'AbortError');
  const cancelSource = () => { try { onAbort?.(); } catch { /* Cancellation still settles the caller. */ } };
  if (!signal) return source;
  if (signal.aborted) {
    source.catch(() => {});
    cancelSource();
    return Promise.reject(abortError());
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', abort);
      callback(value);
    };
    const abort = () => {
      cancelSource();
      settle(reject, abortError());
    };
    signal.addEventListener('abort', abort, { once: true });
    source.then(value => settle(resolve, value), error => settle(reject, error));
  });
}
