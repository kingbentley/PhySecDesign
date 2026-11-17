import React, { useEffect, useId, useState } from 'react';
import { BoundingBox, PencilSimple, ArrowCounterClockwise, Check, X, WarningCircle, Info, CursorClick } from '@phosphor-icons/react';
import { CoverageStyleControl, DoriBreakdown } from './DoriControls.jsx';
import './combined-coverage.css';

const nonnegative = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
const number = (value, digits = 1) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(nonnegative(value));
const percent = value => number(Math.min(100, nonnegative(value)), 1);

function TargetPlaneField({ value, onCommit }) {
  const id = useId();
  const current = Math.min(10, nonnegative(value));
  const [draft, setDraft] = useState(String(current));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(String(current)); setInvalid(false); }, [current]);
  function commit() {
    const next = Number(draft);
    if (!draft.trim() || !Number.isFinite(next) || next < 0 || next > 10) {
      setDraft(String(current));
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (next !== current) onCommit?.(next);
  }
  return <div className="combined-target-field">
    <label htmlFor={id}>Common target height</label>
    <div className={`combined-target-input${invalid ? ' is-invalid' : ''}`}><input id={id} type="number" aria-label="Combined coverage target height" value={draft} min="0" max="10" step="0.1" aria-invalid={invalid} aria-describedby={`${id}-help`} onChange={event => { setDraft(event.target.value); setInvalid(false); }} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}/><span>m</span></div>
    <p id={`${id}-help`} className={invalid ? 'combined-input-error' : 'combined-target-help'}>{invalid ? 'Enter 0–10 m. The previous height was kept.' : '0 m is ground level. The same plane is used for all cameras.'}</p>
  </div>;
}

function CoverageMetric({ kind, label, percentage, area, detail }) {
  return <div className={`combined-metric combined-metric-${kind}`}>
    <div className="combined-metric-heading"><span className="combined-color-key" aria-hidden="true"/><span>{label}</span><strong>{percent(percentage)}<small>%</small></strong></div>
    <div className="combined-metric-detail"><span>{number(area)} m²</span>{detail && <span>{detail}</span>}</div>
  </div>;
}

/** Inspector content only; the parent owns map drawing state and calculation errors. */
export function CombinedCoveragePanel({ result, dori, onOverlayChange, cameraCount = 0, targetHeight = 0, onTargetHeightChange, areaSource = 'Camera surroundings', hasCustomArea = false, isDrawing = false, pointCount = 0, error, onStartDrawing, onFinishDrawing, onCancelDrawing, onUndoPoint, onEditArea, onResetArea, onFitArea }) {
  const stats = result?.stats;
  const area = nonnegative(stats?.area);
  const samples = nonnegative(stats?.sampledCells);
  const excluded = nonnegative(stats?.excludedCameraCount);
  const included = nonnegative(stats?.cameraCount);
  const totalCameras = nonnegative(cameraCount);
  const actualResolution = typeof stats?.cellSize === 'number' && Number.isFinite(stats.cellSize) && stats.cellSize > 0 ? stats.cellSize : null;
  const warnings = Array.isArray(result?.warnings) ? [...new Set(result.warnings.filter(message => typeof message === 'string' && message.trim()))] : [];
  // The solver can prove an area wholly uncovered without sampling any cells.
  const ready = area > 0 && !!stats && !result?.invalid;
  const points = Math.floor(nonnegative(pointCount));

  return <section className="combined-coverage-panel" aria-label="Combined coverage">
    <div className="combined-panel-heading"><span className="combined-eyebrow">COVERAGE ANALYSIS</span><h2>Combined coverage</h2><p>{number(totalCameras, 0)} {totalCameras === 1 ? 'camera' : 'cameras'} considered · Active floor</p></div>
    <CoverageStyleControl dori={dori} onChange={onOverlayChange}/>
    <TargetPlaneField value={targetHeight} onCommit={onTargetHeightChange}/>
    <p className="combined-common-plane-note">Includes all cameras on this floor, even hidden camera layers. This analysis overrides their individual target heights with the common plane above.</p>
    {dori && <p className="combined-common-plane-note">Set the plane to the height of the detail you want to assess, such as face height.</p>}

    <div className="combined-results" aria-live="polite">
      {isDrawing ? <div className="combined-empty combined-drawing-state"><BoundingBox size={26}/><strong>Drawing analysis area</strong><p>Finish the boundary to resume coverage analysis.</p></div> : ready ? <>
        <div className="combined-results-heading"><h3>Within the analysis area</h3><span title="Estimates from sampled camera visibility"><Info size={15}/></span></div>
        {dori ? <DoriBreakdown bands={result.dori} area={area} combined/> : <>
          <CoverageMetric kind="covered" label="Covered" percentage={stats.coveredPercent} area={stats.coveredArea} detail="Includes overlap"/>
          <CoverageMetric kind="overlap" label="Overlap · 2+ cameras" percentage={stats.overlapPercent} area={stats.overlapArea} detail="Included in covered"/>
          <CoverageMetric kind="uncovered" label="Blind spots" percentage={stats.uncoveredPercent} area={stats.uncoveredArea}/>
          <p className="combined-boundary-note">Blind spots are uncovered areas inside this boundary only, including solid obstruction footprints.</p>
        </>}
        <dl className="combined-resolution"><div><dt>Area analyzed</dt><dd>{number(area)} m²</dd></div><div><dt>Actual resolution</dt><dd>{samples === 0 ? 'No sampling needed' : actualResolution !== null ? `${number(actualResolution, 2)} m grid` : 'Adaptive grid'}</dd></div><div><dt>Samples evaluated</dt><dd>{number(samples, 0)}</dd></div><div><dt>Cameras included</dt><dd>{number(included, 0)} of {number(totalCameras, 0)}</dd></div></dl>
      </> : <div className="combined-empty"><BoundingBox size={26}/><strong>{totalCameras === 0 ? 'No cameras on this floor' : 'No analysis footprint yet'}</strong><p>{totalCameras === 0 ? 'Place cameras to compare their coverage in one view.' : 'Choose an analysis area and a target height below the cameras to calculate visibility.'}</p></div>}
    </div>

    {excluded > 0 && <div className="combined-notice"><WarningCircle size={16}/><p><strong>{number(excluded, 0)} {excluded === 1 ? 'camera excluded' : 'cameras excluded'}.</strong> Check mounting height and camera geometry for the selected target plane.</p></div>}
    {warnings.length > 0 && <div className="combined-warning-list" role="status">{warnings.map(warning => <p key={warning}><Info size={14}/><span>{warning}</span></p>)}</div>}

    <div className="combined-area-controls"><h3>Analysis boundary</h3><p className="combined-area-source"><BoundingBox size={15}/>{areaSource}</p>
      {isDrawing ? <div className="combined-drawing-controls">
        <div className="combined-drawing-help"><CursorClick size={18}/><p>Click the map to draw an area. Add at least 3 points around the space you want to evaluate.</p></div>
        <div className="combined-drawing-progress"><span aria-live="polite">{points} {points === 1 ? 'point' : 'points'} placed</span><button type="button" disabled={points === 0} onClick={onUndoPoint}><ArrowCounterClockwise size={14}/>Undo point</button></div>
        <div className="combined-drawing-actions"><button type="button" className="combined-primary" disabled={points < 3} onClick={onFinishDrawing}><Check size={16}/>Finish area</button><button type="button" className="combined-secondary" onClick={onCancelDrawing}><X size={15}/>Cancel</button></div>
        <p className="combined-draft-note">Saved boundary is kept until you finish; analysis pauses while drawing.</p>
      </div> : <div className="combined-area-actions">
        <button type="button" className="combined-primary" onClick={onStartDrawing}><BoundingBox size={17}/>{hasCustomArea ? 'Redraw area' : 'Draw area'}</button>
        <button type="button" className="combined-secondary" onClick={onFitArea} disabled={!onFitArea}><BoundingBox size={16}/>Fit area on map</button>
        {hasCustomArea && <><button type="button" className="combined-secondary" onClick={onEditArea}><PencilSimple size={16}/>Edit boundary</button><button type="button" className="combined-text-button" onClick={onResetArea}><ArrowCounterClockwise size={14}/>Use default area</button></>}
      </div>}
      {error && <div className="combined-error" role="alert"><WarningCircle size={16}/><p>{String(error)}</p></div>}
    </div>
    <p className="combined-model-note">Estimated geometry and modeled obstructions only. Confirm scale, lighting, image detail and real site conditions before implementation.</p>
  </section>;
}

export default CombinedCoveragePanel;
