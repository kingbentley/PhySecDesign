import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, DownloadSimple, FileCode, FilePdf } from '@phosphor-icons/react';
import { REPORT_PAPERS } from './reportPaper.js';
import './report-export.css';

export default function ReportExportPanel({ project, floor, dori, onDownload, onBackup }) {
  const [scope, setScope] = useState('floor');
  const [paper, setPaper] = useState('letter');
  const [coverage, setCoverage] = useState(dori ? 'dori' : 'visibility');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [report, setReport] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const job = useRef(null);
  const page = report?.pages[pageIndex];
  const busy = progress !== null;

  useEffect(() => () => job.current?.abort(), []);
  useEffect(() => {
    if (!page) return;
    const url = URL.createObjectURL(new Blob([page.jpeg], { type: 'image/jpeg' }));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [page]);

  function update(setter, value) {
    setter(value);
    setReport(null);
    setPreviewUrl('');
    setError('');
    setPageIndex(0);
  }

  async function prepare(event) {
    event.preventDefault();
    if (job.current) return;
    const controller = new AbortController();
    job.current = controller;
    setReport(null);
    setPreviewUrl('');
    setPageIndex(0);
    setError('');
    setProgress(0);
    try {
      const { buildDesignReport } = await import('./designReport.js');
      const floorIds = scope === 'floor' ? [floor.id] : project.floors.map(item => item.id);
      const result = await buildDesignReport(project, { floorIds, paper, coverage, includePhotos }, {
        signal: controller.signal,
        onProgress: count => { if (!controller.signal.aborted) setProgress(count); },
      });
      if (!controller.signal.aborted) setReport(result);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message || 'The PDF could not be prepared.');
    } finally {
      if (job.current === controller) job.current = null;
      if (!controller.signal.aborted) setProgress(null);
    }
  }

  function cancel() {
    job.current?.abort();
    job.current = null;
    setProgress(null);
  }

  function download() {
    const prefix = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'physec';
    const floorSuffix = floor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'floor';
    onDownload(report.blob, prefix + (scope === 'floor' ? '-' + floorSuffix : '') + '-design-report.pdf');
  }

  return <div className="report-export">
    <form onSubmit={prepare} className="report-options">
      <fieldset disabled={busy}>
        <legend>Printable design report</legend>
        <label className="text-field"><span>Floors</span>
          <select value={scope} onChange={event => update(setScope, event.target.value)}>
            <option value="floor">Current floor · {floor.name}</option>
            <option value="project">All floors · {project.floors.length}</option>
          </select>
        </label>
        <label className="text-field"><span>Paper size</span>
          <select value={paper} onChange={event => update(setPaper, event.target.value)}>
            {Object.entries(REPORT_PAPERS).map(([id, size]) => <option value={id} key={id}>{size.label} landscape</option>)}
          </select>
        </label>
        <label className="text-field"><span>Plan coverage</span>
          <select value={coverage} onChange={event => update(setCoverage, event.target.value)}>
            <option value="visibility">Combined visibility</option>
            <option value="dori">Combined DORI</option>
            <option value="none">No coverage layer</option>
          </select>
        </label>
        <label className="report-photo-option"><input type="checkbox" checked={includePhotos}
          onChange={event => update(setIncludePhotos, event.target.checked)}/>Include survey photos</label>
      </fieldset>
      <div className="report-export-actions">
        {report ? <button type="button" className="button primary" onClick={download}><DownloadSimple size={17}/>Download PDF</button>
          : <button type="submit" className="button primary" disabled={busy}><FilePdf size={17}/>{busy ? 'Preparing PDF…' : 'Preview PDF'}</button>}
        {busy && <button type="button" className="button secondary" onClick={cancel}>Cancel</button>}
      </div>
      {busy && <p className="report-status" role="status">{progress ? progress + ' page(s) prepared' : 'Rendering floor plans…'}</p>}
      {error && <p className="report-error" role="alert">{error}</p>}
      {!!report?.warnings.length && <p className="report-error" role="status">{report.warnings.length} image(s) unavailable. The report marks missing images.</p>}
      <button type="button" className="text-button report-backup" onClick={onBackup} disabled={busy}><FileCode size={16}/>Download editable project (JSON)</button>
    </form>
    <section className="report-preview" aria-label="PDF report preview">
      {report && page ? <>
        <div className="report-preview-toolbar">
          <button type="button" className="icon-button" aria-label="Previous report page" disabled={pageIndex === 0}
            onClick={() => setPageIndex(index => index - 1)}><ArrowLeft size={16}/></button>
          <label>
            <span className="sr-only">Report page</span>
            <select aria-label="Report page" value={pageIndex} onChange={event => setPageIndex(Number(event.target.value))}>
              {report.pages.map((item, index) => <option value={index} key={index}>{index + 1}. {item.title} · {item.floorLabel}</option>)}
            </select>
          </label>
          <button type="button" className="icon-button" aria-label="Next report page" disabled={pageIndex + 1 >= report.pages.length}
            onClick={() => setPageIndex(index => index + 1)}><ArrowRight size={16}/></button>
        </div>
        {previewUrl && <img src={previewUrl} alt={page.title + ' · ' + page.floorLabel}/>}
        <p className="report-preview-count">Page {pageIndex + 1} of {report.pages.length}</p>
      </> : <div className="report-empty">
        <FilePdf size={34}/>
        <strong>Floor plans, schedules and survey records</strong>
        <p>Choose your export options to preview the pages before downloading.</p>
      </div>}
    </section>
  </div>;
}
