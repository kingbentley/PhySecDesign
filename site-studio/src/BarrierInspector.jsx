import React, { useEffect, useState } from 'react';
import { ArrowCounterClockwise, Check, Info, Path, PencilSimple, Trash, WarningCircle } from '@phosphor-icons/react';
import './barriers.css';

function HeightField({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const parsed = Number(draft);
    const next = draft.trim() === '' || !Number.isFinite(parsed) ? value : Math.min(50, Math.max(0.1, parsed));
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return <label className="barrier-field">
    <span>Height above floor</span>
    <div className="barrier-number-field">
      <input type="number" min="0.1" max="50" step="0.1" value={draft} onChange={event => {
        const next = event.target.value;
        setDraft(next);
        const parsed = Number(next);
        if (next.trim() !== '' && Number.isFinite(parsed) && parsed >= 0.1 && parsed <= 50) onChange(parsed);
      }} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}/>
      <span aria-hidden="true">m</span>
    </div>
    <small>From this floor level to the top. 0.1–50 m.</small>
  </label>;
}

export default function BarrierInspector({ barrier, isDraft = false, onChange, onSave, onCancel, onEditShape, onRemove, onUndoPoint, error }) {
  if (!barrier) return null;

  const isWall = barrier.kind !== 'obstacle';
  const label = isWall ? 'Wall' : 'Solid obstruction';
  const minPoints = isWall ? 2 : 3;
  const pointCount = Array.isArray(barrier.points) ? barrier.points.length : 0;
  const height = typeof barrier.height === 'number' && Number.isFinite(barrier.height)
    ? Math.min(50, Math.max(0.1, barrier.height)) : isWall ? 3 : 2;
  const blocksViews = barrier.enabled !== false;

  return <>
    <div className="inspector-header barrier-inspector-header">
      <div className="eyebrow">{label.toUpperCase()}</div>
      <div className="title-row">
        <h1>{isDraft ? isWall ? 'Trace a wall' : 'Outline an obstruction' : barrier.name?.trim() || label}</h1>
        <span className="barrier-status">{isDraft ? 'Draft' : 'Saved'}</span>
      </div>
      <p>{isWall ? 'A wall on the current floor' : 'A solid footprint on the current floor'}</p>
    </div>
    <div className="inspector-body barrier-inspector-body">
      {isDraft && <div className="barrier-guide"><Path size={20} aria-hidden="true"/><p>{isWall
        ? 'Click the map to trace the wall. Add at least two points.'
        : 'Click the map to outline the solid obstruction. Add at least three points.'}</p></div>}

      <label className="barrier-field">
        <span>{isWall ? 'Wall name' : 'Obstruction name'}</span>
        <input value={barrier.name || ''} maxLength={100} placeholder={isWall ? 'e.g. Lobby partition' : 'e.g. Storage enclosure'} onChange={event => onChange({ name: event.target.value })}/>
      </label>
      <HeightField value={height} onChange={value => onChange({ height: value })}/>

      <label className="barrier-blocking-control">
        <input type="checkbox" checked={blocksViews} onChange={event => onChange({ enabled: event.target.checked })}/>
        <span><strong>Blocks camera views</strong><small>{blocksViews ? 'Included in camera visibility checks.' : 'Outline stays visible without blocking views.'}</small></span>
      </label>

      <div className="barrier-shape-summary">
        <div><strong>{pointCount} {pointCount === 1 ? 'point' : 'points'}</strong><span>{isWall ? 'Wall trace' : 'Closed outline'} · minimum {minPoints} points</span></div>
        {isDraft && <button type="button" className="barrier-undo" onClick={onUndoPoint} disabled={!pointCount} title="Undo last point" aria-label="Undo last point"><ArrowCounterClockwise size={18}/></button>}
      </div>

      {error && <div className="barrier-error" role="alert"><WarningCircle size={17} aria-hidden="true"/><span>{error}</span></div>}
      {isDraft ? <div className="barrier-actions">
        <button type="button" className="button primary full-width" onClick={onSave} disabled={pointCount < minPoints}><Check size={17}/>{isWall ? 'Save wall' : 'Save obstruction'}</button>
        <button type="button" className="button secondary full-width" onClick={onCancel}>Cancel</button>
      </div> : <div className="barrier-actions">
        <button type="button" className="button secondary full-width" onClick={onEditShape}><PencilSimple size={17}/>Edit shape</button>
        <button type="button" className="button danger full-width" onClick={onRemove}><Trash size={17}/>{isWall ? 'Remove wall' : 'Remove obstruction'}</button>
      </div>}

      <p className="barrier-inspector-note"><Info size={16} aria-hidden="true"/><span>Visibility uses the height above this floor and the camera’s target height. Outlines stay anchored to the map when the site plan moves.</span></p>
    </div>
  </>;
}
