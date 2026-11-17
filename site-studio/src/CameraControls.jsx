import React, { useEffect, useId, useMemo, useState } from 'react';
import { CaretDown, Info, SlidersHorizontal, WarningCircle } from '@phosphor-icons/react';
import { horizontalFov, focalLength } from './coverage.js';
import { imageWidth, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH } from './dori.js';
import { CoverageStyleControl, DoriBreakdown } from './DoriControls.jsx';
import './coverage-ui.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const formatted = (value, digits = 2) => Number(Number(value).toFixed(digits)).toString();
const ratioPreset = ratio => Math.abs(ratio - 16 / 9) < 0.0001 ? '16:9' : Math.abs(ratio - 4 / 3) < 0.0001 ? '4:3' : 'custom';

/** Intersect the schema's lens and FOV limits for this sensor width. */
export function cameraOpticsLimits(sensorWidth = 6.4) {
  const width = clamp(finite(sensorWidth, 6.4), 1, 36);
  const minLens = Math.max(0.5, focalLength(160, width));
  const maxLens = Math.min(100, focalLength(1, width));
  return {
    minLens, maxLens,
    minFov: Math.max(1, horizontalFov(maxLens, width)),
    maxFov: Math.min(160, horizontalFov(minLens, width)),
  };
}

function CameraNumberField({ label, value, min, max, step = 0.1, unit, digits = 2, onCommit, help, validationMessage, wholeNumber = false }) {
  const id = useId();
  const [draft, setDraft] = useState(formatted(value, digits));
  const [error, setError] = useState('');
  useEffect(() => { setDraft(formatted(value, digits)); setError(''); }, [value, digits, min, max]);
  function commit() {
    if (draft === formatted(value, digits)) return;
    const next = Number(draft);
    if (!draft.trim() || !Number.isFinite(next) || next < min - 1e-8 || next > max + 1e-8 || (wholeNumber && !Number.isInteger(next))) {
      setDraft(formatted(value, digits));
      setError(validationMessage || `Use ${formatted(min, 4)}–${formatted(max, 4)} ${unit || ''}. Previous value kept.`);
      return;
    }
    const bounded = clamp(next, min, max);
    setError('');
    setDraft(formatted(bounded, digits));
    if (bounded !== value) onCommit(bounded);
  }
  return <label className="coverage-number-field" htmlFor={id}>
    <span className="coverage-field-label">{label}</span>
    <span className={`coverage-number-wrap${error ? ' has-error' : ''}`}><input id={id} type="number" aria-label={label} aria-invalid={!!error} aria-describedby={error || help ? `${id}-help` : undefined} value={draft} min={min} max={max} step={step} onChange={event => { setDraft(event.target.value); setError(''); }} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}/>{unit && <span>{unit}</span>}</span>
    {(error || help) && <small id={`${id}-help`} className={error ? 'coverage-field-error' : 'coverage-field-help'}>{error || help}</small>}
  </label>;
}

/** Geometry controls only; model, mounting type, status and notes belong to the parent inspector. */
export function CameraControls({ camera, onChange, analysis, dori, reviewingZone, onOverlayChange }) {
  const sensorWidth = clamp(finite(camera?.sensorWidth, 6.4), 1, 36);
  const limits = useMemo(() => cameraOpticsLimits(sensorWidth), [sensorWidth]);
  const lens = clamp(finite(camera?.lens, focalLength(finite(camera?.fov, 77.3196), sensorWidth)), limits.minLens, limits.maxLens);
  const fov = horizontalFov(lens, sensorWidth);
  const height = clamp(finite(camera?.height, 3.2), 0.5, 30);
  const tilt = clamp(finite(camera?.tilt, 25), 0, 90);
  const maxTarget = Math.min(10, height - 0.000001);
  const storedTargetHeight = finite(camera?.targetHeight, 0);
  // Keep valid imported target planes even when the camera clearance is under 0.1 m.
  const targetHeight = storedTargetHeight >= 0 && storedTargetHeight <= 10 && storedTargetHeight < height
    ? storedTargetHeight : clamp(storedTargetHeight, 0, maxTarget);
  const distance = clamp(finite(camera?.range, 28), 1, 150);
  const bearing = clamp(finite(camera?.bearing, 180), 0, 360);
  const aspectRatio = clamp(finite(camera?.aspectRatio, 16 / 9), 0.5, 4);
  const [customRatio, setCustomRatio] = useState(ratioPreset(aspectRatio) === 'custom');
  const showCustomRatio = customRatio || ratioPreset(aspectRatio) === 'custom';
  const bearingId = useId();
  const ratioId = useId();
  useEffect(() => setCustomRatio(ratioPreset(aspectRatio) === 'custom'), [camera?.id]);
  const stats = analysis?.stats;
  const blockedPercent = stats && Number.isFinite(stats.blockedPercent) ? clamp(stats.blockedPercent, 0, 100) : null;
  const roundedBlockedPercent = blockedPercent === null ? null : Math.round(blockedPercent);
  const sampledCells = stats && Number.isFinite(stats.sampledCells) ? Math.max(0, stats.sampledCells) : 0;
  const nominalArea = stats && Number.isFinite(stats.nominalArea) ? Math.max(0, stats.nominalArea) : 0;
  const cellSize = stats && Number.isFinite(stats.cellSize) ? stats.cellSize : null;
  const nearBlind = stats && Number.isFinite(stats.nearBlindDistance) ? Math.max(0, stats.nearBlindDistance) : null;
  const warnings = Array.isArray(analysis?.warnings) ? analysis.warnings.filter(message => typeof message === 'string' && message.trim()) : [];

  function setLens(value) { onChange?.({ lens: value, fov: horizontalFov(value, sensorWidth) }); }
  function setFov(value) {
    const nextLens = clamp(focalLength(value, sensorWidth), limits.minLens, limits.maxLens);
    onChange?.({ lens: nextLens, fov: horizontalFov(nextLens, sensorWidth) });
  }
  function setSensor(value) {
    const nextLimits = cameraOpticsLimits(value);
    const nextLens = clamp(lens, nextLimits.minLens, nextLimits.maxLens);
    onChange?.({ sensorWidth: value, lens: nextLens, fov: horizontalFov(nextLens, value) });
  }

  return <section key={camera?.id} className="coverage-camera-controls" aria-label="Camera geometry">
    <div className="camera-dori-settings">
      {!reviewingZone && <CoverageStyleControl dori={dori} onChange={onOverlayChange}/>}
      {(dori || reviewingZone) && <CameraNumberField
        label="Horizontal stream resolution" value={imageWidth(camera)}
        min={MIN_IMAGE_WIDTH} max={MAX_IMAGE_WIDTH} unit="px" step={1} digits={0} wholeNumber
        help="Use the width in pixels of the configured video stream. Generic cameras start with a catalog estimate."
        validationMessage={`Enter a whole number from ${MIN_IMAGE_WIDTH} to ${MAX_IMAGE_WIDTH} px. Previous value kept.`}
        onCommit={value => onChange?.({ imageWidth: value })}
      />}
    </div>
    <div className="coverage-section-heading"><h3>Camera geometry</h3><span title="Estimated rectilinear camera coverage"><Info size={16}/></span></div>
    <div className="coverage-field-grid">
      <CameraNumberField label="Lens focal length" value={lens} min={limits.minLens} max={limits.maxLens} unit="mm" digits={3} onCommit={setLens}/>
      <CameraNumberField label="Horizontal FOV" value={fov} min={limits.minFov} max={limits.maxFov} unit="°" digits={2} onCommit={setFov}/>
    </div>
    <p className="coverage-linked-note">Lens and field of view stay linked.</p>
    <div className="coverage-field-grid">
      <CameraNumberField label="Mounting height" value={height} min={0.5} max={30} unit="m" onCommit={value => onChange?.({ height: value, targetHeight: targetHeight < value ? targetHeight : Math.max(0, value - 0.1) })}/>
      <CameraNumberField label="Tilt downward" value={tilt} min={0} max={90} unit="°" step={1} onCommit={value => onChange?.({ tilt: value })}/>
      <CameraNumberField label="Target plane height" value={targetHeight} min={0} max={maxTarget} unit="m" digits={4} help="Must be strictly below the camera." validationMessage={`Enter 0–10 m, strictly below the ${formatted(height)} m camera. Previous value kept.`} onCommit={value => onChange?.({ targetHeight: value })}/>
      <CameraNumberField label="Analysis distance" value={distance} min={1} max={150} unit="m" step={1} onCommit={value => onChange?.({ range: value })}/>
    </div>
    <p className="coverage-field-explanation">The target plane defaults to ground level (0 m). Analysis distance limits the calculation; it is not a detection guarantee.</p>
    <div className="coverage-bearing">
      <CameraNumberField label="Aim / bearing" value={bearing} min={0} max={360} unit="°" step={1} onCommit={value => onChange?.({ bearing: value })}/>
      <label className="sr-only" htmlFor={bearingId}>Adjust camera bearing</label><input id={bearingId} className="coverage-bearing-slider" type="range" min="0" max="360" step="1" value={bearing} onChange={event => onChange?.({ bearing: Number(event.target.value) })}/>
      <div className="coverage-range-labels"><span>North · 0°</span><span>South · 180°</span><span>360°</span></div>
    </div>

    <details className="coverage-advanced">
      <summary><SlidersHorizontal size={16}/><span>Advanced optics</span><CaretDown className="coverage-disclosure-caret" size={13}/></summary>
      <div className="coverage-advanced-body">
        <CameraNumberField label="Sensor width" value={sensorWidth} min={1} max={36} unit="mm" onCommit={setSensor}/>
        <label className="coverage-select-field" htmlFor={ratioId}><span>Aspect ratio</span><select id={ratioId} aria-label="Camera aspect ratio" value={showCustomRatio ? 'custom' : ratioPreset(aspectRatio)} onChange={event => { const choice = event.target.value; if (choice === 'custom') { setCustomRatio(true); return; } setCustomRatio(false); onChange?.({ aspectRatio: choice === '16:9' ? 16 / 9 : 4 / 3 }); }}><option value="16:9">16:9 · widescreen</option><option value="4:3">4:3 · standard</option><option value="custom">Custom ratio</option></select></label>
        {showCustomRatio && <CameraNumberField label="Width / height ratio" value={aspectRatio} min={0.5} max={4} step={0.01} digits={4} onCommit={value => onChange?.({ aspectRatio: value })}/>}
        <p className="coverage-field-explanation">Generic rectilinear lens model. Match sensor width and aspect ratio to the camera specification. Fisheye and lens distortion are not modeled.</p>
      </div>
    </details>

    <div className="coverage-analysis-summary">
      <h4>{dori ? 'Estimated DORI coverage' : 'Estimated visibility'}</h4>
      {dori && nominalArea > 0 ? <DoriBreakdown bands={analysis.dori} area={nominalArea}/> : sampledCells > 0 && nominalArea > 0 && blockedPercent !== null ? <>
        <div className="coverage-stats-row"><div><span>Visible</span><strong>{100 - roundedBlockedPercent}<small>%</small></strong></div><div><span>Blocked</span><strong>{roundedBlockedPercent}<small>%</small></strong></div></div>
        <p>Of the sampled field of view on the target plane.</p>
        <div className="coverage-analysis-detail"><span>Sample resolution</span><strong>{cellSize !== null ? `${formatted(cellSize, 2)} m grid` : 'Adaptive grid'}</strong></div>
        <div className="coverage-analysis-detail"><span>Samples evaluated</span><strong>{Math.round(sampledCells).toLocaleString('en-US')}</strong></div>
      </> : <p className="coverage-no-samples">{analysis ? 'No sampled target-plane footprint in this view. Adjust tilt, height or analysis distance.' : 'Select this camera on the map to calculate its estimated visibility.'}</p>}
      {dori && sampledCells > 0 && cellSize !== null && <div className="coverage-analysis-detail"><span>Sample resolution</span><strong>{formatted(cellSize, 2)} m grid</strong></div>}
      {nearBlind !== null && <div className="coverage-analysis-detail"><span>Centerline near limit</span><strong>{formatted(nearBlind, 1)} m</strong></div>}
      <p className="coverage-field-explanation">The amber near zone approximates the blind area using the centerline near limit. Obstruction height matters. Lighting, detail quality and unmodeled objects require field verification.</p>
      {warnings.length > 0 && <div className="coverage-analysis-warnings" role="status"><WarningCircle size={16}/><div>{warnings.map((warning, index) => <p key={`${index}:${warning}`}>{warning}</p>)}</div></div>}
    </div>
  </section>;
}

export default CameraControls;
