import React, { useEffect, useState } from 'react';
import { ArrowCounterClockwise, Check, Info, Path, PencilSimple, Trash } from '@phosphor-icons/react';
import { CABLE_TYPES, routeBillableMeters, routeLengthMeters } from './cables.js';
import './routes.css';

const formatLength = value => `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;

function SlackField({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const parsed = Number(draft);
    const next = draft.trim() === '' || !Number.isFinite(parsed) ? value : Math.min(100, Math.max(0, parsed));
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return <label className="route-field route-slack-field">
    <span>Slack allowance</span>
    <div className="route-number-field">
      <input type="number" min="0" max="100" step="1" value={draft} onChange={event => {
        const next = event.target.value;
        setDraft(next);
        if (next.trim() !== '' && Number.isFinite(Number(next)) && Number(next) >= 0 && Number(next) <= 100) onChange(Number(next));
      }} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}/>
      <span aria-hidden="true">%</span>
    </div>
    <small>Extra cable for service loops and termination.</small>
  </label>;
}

export default function RouteInspector({ route, devices = [], isDraft = false, onChange, onSave, onCancel, onEditPath, onRemove, onUndoPoint }) {
  if (!route) return null;

  const fromId = route.fromDeviceId || '';
  const toId = route.toDeviceId || '';
  const fromExists = devices.some(device => device.id === fromId);
  const toExists = devices.some(device => device.id === toId);
  const validEndpoints = fromExists && toExists && fromId !== toId;
  const pointCount = Array.isArray(route.via) ? route.via.length : 0;
  const slack = typeof route.slackPercent === 'number' && Number.isFinite(route.slackPercent) ? Math.min(100, Math.max(0, route.slackPercent)) : 10;
  const cableType = CABLE_TYPES[route.cableType] ? route.cableType : 'cat6';
  const estimateRoute = { ...route, slackPercent: slack };
  const drawnLength = validEndpoints ? routeLengthMeters(estimateRoute, devices) : null;
  const cableLength = validEndpoints ? routeBillableMeters(estimateRoute, devices) : null;

  function endpointField(label, field, value, otherId) {
    return <label className="route-field">
      <span>{label}</span>
      <select value={value} onChange={event => onChange({ [field]: event.target.value })}>
        <option value="" disabled>Choose a device</option>
        {value && !devices.some(device => device.id === value) && <option value={value} disabled>{value} — unavailable</option>}
        {devices.map(device => <option key={device.id} value={device.id} disabled={device.id === otherId}>
          {device.id}{device.name ? ` — ${device.name}` : ''}
        </option>)}
      </select>
    </label>;
  }

  return <>
    <div className="inspector-header route-inspector-header">
      <div className="eyebrow">CABLE ROUTE</div>
      <div className="title-row"><h1>{isDraft ? 'Trace a cable route' : route.name?.trim() || 'Cable route'}</h1><span className="route-status">{isDraft ? 'Draft' : 'Saved'}</span></div>
      <p>{isDraft ? 'Connect equipment on this floor' : CABLE_TYPES[cableType].label}</p>
    </div>
    <div className="inspector-body route-inspector-body">
      {isDraft && <div className="route-guide"><Path size={20} aria-hidden="true"/><p>Choose two devices, then click the map to trace the cable path.</p></div>}

      <label className="route-field">
        <span>Route name</span>
        <input value={route.name || ''} maxLength={100} placeholder="e.g. Lobby camera to network cabinet" onChange={event => onChange({ name: event.target.value })}/>
      </label>

      <div className="route-endpoints">
        {endpointField('From device', 'fromDeviceId', fromId, toId)}
        {endpointField('To device', 'toDeviceId', toId, fromId)}
      </div>
      {devices.length < 2 && <p className="route-field-message">Place at least two devices on this floor to create a route.</p>}
      {devices.length >= 2 && fromId && toId && !validEndpoints && <p className="route-field-message">Choose two different devices on this floor.</p>}

      <label className="route-field">
        <span>Cable type</span>
        <select value={cableType} onChange={event => onChange({ cableType: event.target.value })}>
          {Object.entries(CABLE_TYPES).map(([key, type]) => <option key={key} value={key}>{type.label}</option>)}
        </select>
      </label>
      <SlackField value={slack} onChange={value => onChange({ slackPercent: value })}/>

      <div className="route-length-card" aria-live="polite" aria-atomic="true">
        <div className="route-length-heading"><Path size={18} aria-hidden="true"/><span>Length estimate</span></div>
        <div className="route-length-row"><span>Drawn route</span><strong>{drawnLength === null ? '—' : formatLength(drawnLength)}</strong></div>
        <div className="route-length-row route-length-total"><span>With {slack}% slack</span><strong>{cableLength === null ? '—' : formatLength(cableLength)}</strong></div>
      </div>

      <div className="route-path-summary">
        <div><strong>{pointCount} {pointCount === 1 ? 'waypoint' : 'waypoints'}</strong><span>{pointCount ? 'Between the two devices' : 'Direct device-to-device connection'}</span></div>
        {isDraft && <button type="button" className="route-undo" onClick={onUndoPoint} disabled={!pointCount} title="Undo last waypoint" aria-label="Undo last waypoint"><ArrowCounterClockwise size={18}/></button>}
      </div>

      {isDraft ? <div className="route-actions">
        <button type="button" className="button primary full-width" onClick={onSave} disabled={!validEndpoints}><Check size={17}/>Save route</button>
        <button type="button" className="button secondary full-width" onClick={onCancel}>Cancel</button>
      </div> : <div className="route-actions">
        <button type="button" className="button secondary full-width" onClick={onEditPath}><PencilSimple size={17}/>Edit path</button>
        <button type="button" className="button danger full-width" onClick={onRemove}><Trash size={17}/>Remove route</button>
      </div>}

      <p className="route-estimate-note"><Info size={16} aria-hidden="true"/><span>Lengths are plan-view estimates. Allow separately for vertical runs and installation conditions.</span></p>
    </div>
  </>;
}
