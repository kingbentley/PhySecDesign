import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { validatePdfFile, rasterDimensions, safePageLabel, pngDataUrlBytes, MAX_PLAN_PNG_BYTES, waitForAbort } from './pdfImportUtils.js';

let libraryPromise;
const abortError = () => new DOMException('PDF import cancelled.', 'AbortError');
const checkSignal = signal => { if (signal?.aborted) throw abortError(); };

async function getLibrary() {
  libraryPromise ||= import('pdfjs-dist/build/pdf.mjs').then(library => {
    library.GlobalWorkerOptions.workerSrc = workerUrl;
    return library;
  }).catch(error => { libraryPromise = null; throw error; });
  return libraryPromise;
}

const waitFor = waitForAbort;

function readableError(error) {
  if (error?.name === 'AbortError' || error?.name === 'RenderingCancelledException') return abortError();
  if (error?.name === 'InvalidPDFException') return new Error('This file could not be read as a PDF. Try another copy of the drawing.');
  if (error?.name === 'PasswordException') return new Error('This PDF needs a password before its pages can be opened.');
  if (error?.name === 'MissingPDFException') return new Error('The PDF file could not be opened. Choose the file again.');
  if (error instanceof Error) return error;
  return new Error('The PDF could not be opened. Try another drawing.');
}

/**
 * Parse a local PDF without uploading its contents. The caller owns the session
 * and must call destroy() on cancellation or after the selected page is imported.
 * onPassword({incorrect}) may asynchronously return a password, or null to cancel.
 */
export async function openPdf(file, { signal, onPassword } = {}) {
  validatePdfFile(file);
  checkSignal(signal);
  const library = await waitFor(getLibrary(), signal);
  const buffer = await waitFor(file.arrayBuffer(), signal);
  checkSignal(signal);
  const data = new Uint8Array(buffer);
  const header = new TextDecoder('latin1').decode(data.subarray(0, Math.min(1024, data.length)));
  if (!header.includes('%PDF-')) throw new Error('This file is not a valid PDF. Choose a PDF drawing.');
  const base = import.meta.env?.BASE_URL || '/';
  const resources = base.replace(/\/?$/, '/') + 'pdfjs/';
  const loadingTask = library.getDocument({
    data,
    cMapUrl: resources + 'cmaps/',
    cMapPacked: true,
    standardFontDataUrl: resources + 'standard_fonts/',
    wasmUrl: resources + 'wasm/',
    iccUrl: resources + 'iccs/',
    useSystemFonts: false,
    useWorkerFetch: true,
    disableWorkerRendering: true,
    stopAtErrors: true,
    canvasMaxAreaInBytes: 64 * 1024 * 1024,
    enableXfa: false,
    verbosity: library.VerbosityLevel.ERRORS,
  });

  let destroyed = false;
  let destroyPromise;
  const renderingTasks = new Set();
  const destroy = () => {
    if (destroyPromise) return destroyPromise;
    destroyed = true;
    signal?.removeEventListener('abort', abortDocument);
    renderingTasks.forEach(task => task.cancel());
    renderingTasks.clear();
    destroyPromise = Promise.resolve().then(() => loadingTask.destroy()).catch(() => {});
    return destroyPromise;
  };
  const abortDocument = () => { void destroy(); };
  signal?.addEventListener('abort', abortDocument, { once: true });
  if (signal?.aborted) void destroy();

  let rejectPassword;
  const passwordFailure = new Promise((_, reject) => { rejectPassword = reject; });
  loadingTask.onPassword = (updatePassword, reason) => {
    if (destroyed) return;
    if (!onPassword) {
      rejectPassword(new Error('This PDF is password protected. Open it with a password, or choose an unlocked copy.'));
      void destroy();
      return;
    }
    Promise.resolve().then(() => onPassword({ incorrect: reason === library.PasswordResponses.INCORRECT_PASSWORD })).then(password => {
      if (destroyed) return;
      if (password === null || password === undefined) {
        rejectPassword(abortError());
        void destroy();
      } else if (typeof password !== 'string') {
        rejectPassword(new Error('Enter the PDF password as text.'));
        void destroy();
      } else {
        updatePassword(password);
      }
    }).catch(error => { if (!destroyed) { rejectPassword(error); void destroy(); } });
  };

  let pdf;
  try {
    pdf = await waitFor(Promise.race([loadingTask.promise, passwordFailure]), signal, abortDocument);
    if (destroyed) throw abortError();
    if (!Number.isInteger(pdf.numPages) || pdf.numPages < 1 || pdf.numPages > 10000) {
      throw new Error('This PDF has no usable pages, or the drawing set is too large. Split it into smaller files.');
    }
    const labels = await waitFor(pdf.getPageLabels().catch(() => null), signal, abortDocument);
    if (destroyed) throw abortError();
    const pageLabels = Array.from({ length: pdf.numPages }, (_, index) => safePageLabel(labels?.[index], index + 1));

    async function renderPage(pageNumber, { maxDimension = 1400, signal: renderSignal } = {}) {
      checkSignal(renderSignal);
      if (destroyed) throw abortError();
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pdf.numPages) throw new Error('Choose a page within this PDF.');
      let page;
      try {
        page = await waitFor(pdf.getPage(pageNumber), renderSignal);
        if (destroyed) throw abortError();
        const baseViewport = page.getViewport({ scale: 1 });
        async function renderAt(dimension) {
          checkSignal(renderSignal);
          if (destroyed) throw abortError();
          const size = rasterDimensions(baseViewport.width, baseViewport.height, dimension);
          const viewport = page.getViewport({ scale: size.scale });
          const canvas = document.createElement('canvas');
          canvas.width = size.width;
          canvas.height = size.height;
          let task;
          try {
            task = page.render({ canvas, viewport, background: 'rgb(255,255,255)', intent: 'display', annotationMode: library.AnnotationMode.ENABLE });
            renderingTasks.add(task);
            await waitFor(task.promise, renderSignal, () => task.cancel());
            if (destroyed) throw abortError();
            checkSignal(renderSignal);
            const url = canvas.toDataURL('image/png');
            return { url, width: size.width, height: size.height, bytes: pngDataUrlBytes(url) };
          } finally {
            if (task) {
              // Cancellation rejects our waiter immediately; wait for PDF.js to
              // finish releasing this canvas before zeroing it or cleaning the page.
              await task.promise.catch(() => {});
              renderingTasks.delete(task);
            }
            canvas.width = 0;
            canvas.height = 0;
          }
        }
        let image = await renderAt(maxDimension);
        let reducedQuality = false;
        if (image.bytes > MAX_PLAN_PNG_BYTES && maxDimension > 2400) {
          image = await renderAt(2400);
          reducedQuality = true;
        }
        if (image.bytes > MAX_PLAN_PNG_BYTES) throw new Error('This page produces an image larger than 12 MB. Export a smaller-resolution image from your PDF editor and import that instead.');
        return {
          ...image, pageNumber, pageLabel: pageLabels[pageNumber - 1],
          rotation: baseViewport.rotation,
          widthPoints: baseViewport.width, heightPoints: baseViewport.height,
          reducedQuality,
        };
      } catch (error) {
        if (destroyed || renderSignal?.aborted) throw abortError();
        throw readableError(error);
      } finally {
        page?.cleanup();
      }
    }
    return { pageCount: pdf.numPages, pageLabels, renderPage, destroy };
  } catch (error) {
    void destroy();
    if (signal?.aborted) throw abortError();
    throw readableError(error);
  }
}
