import React, { useState } from 'react';
import { ArrowCounterClockwise, ArrowsOutSimple, Check, Crosshair, PencilSimple, Polygon, Trash, X } from '@phosphor-icons/react';
import { ZONE_DORI_LEVELS, ZONE_TYPES, formatZonePercent } from './securityZones.js';
import './zones.css';

export function ZoneResult({ zone, result, compact = false }) {
  if (!zone.targetLevel) return <p className="zone-result-note">Choose a DORI target to highlight gaps.</p>;
  if (!result) return <p className="zone-result-note">Coverage is unavailable for this zone.</p>;

  return <div className="zone-result" aria-live="polite">
    <div className="zone-result-heading">
      <span>{result.level} coverage</span>
      <strong>{formatZonePercent(result.percent)}</strong>
    </div>
    {!compact && <div className="zone-progress" aria-hidden="true">
      <div style={{ width: result.percent + '%' }}/>
      <i style={{ left: zone.targetPercent + '%' }}/>
    </div>}
    <div className="zone-result-detail">
      <span>Target {formatZonePercent(zone.targetPercent)}</span>
      <span className={result.meets ? 'zone-met' : 'zone-short'}>{result.meets ? 'Target met' : 'Below target'}</span>
    </div>
    <div className="zone-legend">
      <span><i className="zone-good-key"/>Meets DORI level</span>
      <span><i className="zone-gap-key"/>Falls short</span>
    </div>
  </div>;
}

export default function ZoneInspector({
  zone, drawing, result, coverage, targetHeight, error, onChange,
  onUndo, onSave, onCancel, onRedraw, onFit, onRemove, onClose,
}) {
  const [name, setName] = useState(zone.name);
  const [percent, setPercent] = useState(String(zone.targetPercent));
  const [inputError, setInputError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  function commitName() {
    if (!name.trim()) {
      if (!drawing) setName(zone.name);
      setInputError('Enter a zone name.');
      return;
    }
    setInputError('');
    const trimmed = name.trim();
    setName(trimmed);
    if (trimmed !== zone.name) onChange({ name: trimmed });
  }

  function commitPercent() {
    const value = Number(percent);
    if (!percent.trim() || !Number.isFinite(value) || value < 0.1 || value > 100) {
      setPercent(String(zone.targetPercent));
      setInputError('Enter a coverage target from 0.1% to 100%.');
      return;
    }
    setInputError('');
    if (value !== zone.targetPercent) onChange({ targetPercent: value });
  }

  function commitOnEnter(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  return <section className="combined-coverage-panel zone-inspector" aria-label="Security zone settings">
    <div className="combined-panel-heading">
      <span className="combined-eyebrow">SECURITY ZONE</span>
      <h2>{drawing ? 'Draw security zone' : zone.name}</h2>
      <p>{drawing ? 'Click the map to place each corner.' : ZONE_TYPES[zone.type]}</p>
    </div>

    {!drawing && <>
      <ZoneResult zone={zone} result={result}/>
      {zone.targetLevel && <p className="zone-result-note">
        Best available camera at each point · {targetHeight} m floor target plane
        {coverage?.stats?.sampledCells > 0 && <> · {coverage.stats.cellSize.toFixed(2)} m sampling</>}
      </p>}
      {coverage?.warnings?.length > 0 && <div className="zone-analysis-notes">
        {coverage.warnings.map(message => <p key={message}>{message}</p>)}
      </div>}
    </>}

    <div className="zone-fields">
      <label className="text-field"><span>Zone name</span>
        <input value={name} maxLength={80} onChange={event => setName(event.target.value)} onBlur={commitName} onKeyDown={commitOnEnter}/>
      </label>
      <label className="text-field"><span>Zone type</span>
        <select value={zone.type} onChange={event => onChange({ type: event.target.value })}>
          {Object.entries(ZONE_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="text-field"><span>DORI target</span>
        <select value={zone.targetLevel ?? ''} onChange={event => onChange({ targetLevel: event.target.value || null })}>
          <option value="">No requirement</option>
          {ZONE_DORI_LEVELS.map(level => <option key={level.id} value={level.id}>{level.label}</option>)}
        </select>
      </label>
      {zone.targetLevel && <label className="text-field"><span>Required zone coverage (%)</span>
        <input type="number" min="0.1" max="100" step="any" value={percent}
          onChange={event => setPercent(event.target.value)} onBlur={commitPercent} onKeyDown={commitOnEnter}/>
      </label>}
      {(inputError || error) && <p className="zone-error" role="alert">{error || inputError}</p>}
    </div>

    {drawing ? <div className="combined-drawing-controls">
      <div className="combined-drawing-progress">
        <span aria-live="polite">{zone.points.length} corners · minimum 3</span>
        <button type="button" onClick={onUndo} disabled={!zone.points.length}><ArrowCounterClockwise size={14}/>Undo point</button>
      </div>
      <div className="combined-drawing-actions">
        <button type="button" className="combined-primary" onClick={onSave} disabled={zone.points.length < 3 || !name.trim()}><Check size={16}/>Save zone</button>
        <button type="button" className="combined-secondary" onClick={onCancel}><X size={16}/>Cancel</button>
      </div>
    </div> : <div className="zone-actions">
      <p className="zone-result-note">Drag a numbered corner to adjust the boundary. Select a camera to refine coverage while this zone stays on the map.</p>
      <button type="button" className="combined-secondary" onClick={onFit}><ArrowsOutSimple size={16}/>Fit zone</button>
      <button type="button" className="combined-secondary" onClick={onRedraw}><PencilSimple size={16}/>Redraw boundary</button>
      <button type="button" className="combined-secondary" onClick={onClose}><Polygon size={16}/>Close zone review</button>
      {confirmRemove ? <div className="zone-remove">
        <span>Remove this zone?</span>
        <button type="button" className="text-button" onClick={onRemove}>Remove</button>
        <button type="button" className="text-button" onClick={() => setConfirmRemove(false)}>Keep</button>
      </div> : <button type="button" className="text-button zone-remove-button" onClick={() => setConfirmRemove(true)}><Trash size={16}/>Remove zone</button>}
    </div>}
  </section>;
}

export function ZoneCameraSummary({ zone, result, onOpen }) {
  return <div className="zone-camera-summary">
    <button type="button" className="text-button" onClick={onOpen}><Crosshair size={15}/>{zone.name}</button>
    <ZoneResult zone={zone} result={result} compact/>
  </div>;
}
