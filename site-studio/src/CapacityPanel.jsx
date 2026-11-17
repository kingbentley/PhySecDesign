import React, { useEffect, useMemo, useState } from 'react';
import { CellSignalFull, Crosshair, HardDrives, Info, Network, VideoCamera, WarningCircle, Lightning } from '@phosphor-icons/react';
import { buildCapacityPlan, CAPACITY_LIMITS, normalizeDeviceCapacity } from './capacity.js';
import './capacity.css';

const formatNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const number = value => formatNumber.format(value);
const storage = value => value > 0 && value < 1 ? number(value * 1000) + ' GB' : number(value) + ' TB';
const count = (value, noun) => value + ' ' + noun + (value === 1 ? '' : 's');

function CapacityInput({ name, value, onCommit, setting, whole = false, maximum, unit }) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState(false);
  const [minimum, usualMaximum] = CAPACITY_LIMITS[setting];
  const max = maximum ?? usualMaximum;
  useEffect(() => { setDraft(String(value)); setError(false); }, [value, max]);

  function commit() {
    const next = Number(draft);
    if (!draft.trim() || !Number.isFinite(next) || next < minimum || next > max || (whole && !Number.isInteger(next))) {
      setDraft(String(value));
      setError(true);
      return;
    }
    setError(false);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return <span className="capacity-field">
    <span className={'capacity-input' + (error ? ' capacity-invalid' : '')}>
      <input type="number" aria-label={name} aria-invalid={error} min={minimum} max={max} step={whole ? 1 : 'any'}
        value={draft} onChange={event => { setDraft(event.target.value); setError(false); }} onBlur={commit}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}/>
      {unit && <span>{unit}</span>}
    </span>
    {error && <span className="capacity-field-error" role="status">Enter {whole ? 'a whole number ' : ''}from {minimum} to {max}.</span>}
  </span>;
}

function LabeledInput({ label, ...props }) {
  return <label className="capacity-label"><span>{label}</span><CapacityInput {...props}/></label>;
}

function SwitchBudgetFields({ device, capacity, onChange }) {
  const id = device.id;
  return <div className="capacity-device-fields">
    <LabeledInput label="Copper ports" name={id + ' copper ports'} value={capacity.copperPorts} setting="copperPorts" whole
      onCommit={value => onChange({ copperPorts: value, poePorts: Math.min(value, capacity.poePorts) })}/>
    <LabeledInput label="PoE ports" name={id + ' PoE ports'} value={capacity.poePorts} setting="poePorts" whole maximum={capacity.copperPorts}
      onCommit={value => onChange({ poePorts: value })}/>
    <LabeledInput label="Total PoE budget" name={id + ' total PoE budget'} value={capacity.poeBudgetWatts} setting="poeBudgetWatts" unit="W"
      onCommit={value => onChange({ poeBudgetWatts: value })}/>
    <LabeledInput label="Max PoE per port" name={id + ' max PoE per port'} value={capacity.poePerPortWatts} setting="poePerPortWatts" unit="W"
      onCommit={value => onChange({ poePerPortWatts: value })}/>
  </div>;
}

export function CapacityDeviceSettings({ device, onChange }) {
  const capacity = normalizeDeviceCapacity(device);
  const camera = device.type === 'camera';
  const isSwitch = device.type === 'switch';
  return <details className="capacity-device-settings">
    <summary><Network size={16}/>{camera ? 'Recording & PoE' : isSwitch ? 'Switch capacity' : 'Network & PoE'}</summary>
    {isSwitch ? <SwitchBudgetFields device={device} capacity={capacity} onChange={onChange}/> : <>
      {!camera && <label className="capacity-checkbox">
        <input type="checkbox" checked={capacity.networked} onChange={event => onChange({ networked: event.target.checked })}/>
        Requires a switch port
      </label>}
      {capacity.networked && <div className="capacity-device-fields">
        {camera && <>
          <LabeledInput label="Stream bitrate" name={device.id + ' stream bitrate'} value={capacity.bitrateMbps} setting="bitrateMbps"
            unit="Mbps" onCommit={value => onChange({ bitrateMbps: value })}/>
          <LabeledInput label="Recording time" name={device.id + ' recording time'} value={capacity.recordingPercent} setting="recordingPercent"
            unit="%" onCommit={value => onChange({ recordingPercent: value })}/>
        </>}
        <LabeledInput label="PoE allocation" name={device.id + ' PoE allocation'} value={capacity.poeWatts} setting="poeWatts"
          unit="W" onCommit={value => onChange({ poeWatts: value })}/>
      </div>}
    </>}
    <p>{isSwitch ? 'Use the switch’s usable copper ports and rated PoE limits.' :
      capacity.networked ? 'Use the switch-side PoE allocation. Enter 0 W for a locally powered device.' :
      'Enable this for an IP device that connects directly to a switch.'}</p>
  </details>;
}

function Metric({ icon: Icon, title, value, detail }) {
  return <div className="capacity-metric">
    <div><Icon size={17}/><span>{title}</span></div>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>;
}

function DeviceCell({ row }) {
  return <div className="capacity-device-name">
    <strong>{row.device.id} · {row.device.name}</strong>
    <small>{row.floorLabel}</small>
  </div>;
}

function Locate({ row, onLocate }) {
  return <button className="text-button capacity-locate" type="button" onClick={() => onLocate(row.floorId, row.device.id)}>
    <Crosshair size={15}/>Locate
  </button>;
}

function RecordingTable({ plan, onChangeDevice, onLocate }) {
  return <>
    <p className="capacity-section-note">Enter the configured average bitrate for each camera stream. Recording time reduces storage; the bandwidth figure assumes every listed stream is active.</p>
    {!plan.cameras.length ? <p className="capacity-empty">Place cameras to estimate recording requirements.</p> :
      <div className="capacity-table-wrap"><table className="capacity-table">
        <thead><tr><th scope="col">Camera</th><th scope="col">Bitrate</th><th scope="col">Recorded time</th><th scope="col">Storage</th><th scope="col">PoE allocation</th><th scope="col">Switch</th><th scope="col"><span className="sr-only">Map</span></th></tr></thead>
        <tbody>{plan.cameras.map(row => {
          const id = row.device.id;
          const update = partial => onChangeDevice(row.floorId, id, partial);
          return <tr key={id}>
            <td><DeviceCell row={row}/></td>
            <td><CapacityInput name={id + ' stream bitrate'} value={row.capacity.bitrateMbps} setting="bitrateMbps" unit="Mbps"
              onCommit={value => update({ bitrateMbps: value })}/></td>
            <td><CapacityInput name={id + ' recording time'} value={row.capacity.recordingPercent} setting="recordingPercent" unit="%"
              onCommit={value => update({ recordingPercent: value })}/></td>
            <td className="capacity-nowrap">{storage(row.storageTB)}</td>
            <td><CapacityInput name={id + ' PoE allocation'} value={row.watts} setting="poeWatts" unit="W"
              onCommit={value => update({ poeWatts: value })}/></td>
            <td className="capacity-nowrap">{row.switchId || <span className="capacity-attention">Unassigned</span>}</td>
            <td><Locate row={row} onLocate={onLocate}/></td>
          </tr>;
        })}</tbody>
      </table></div>}
  </>;
}

function SwitchTable({ plan, onChangeDevice, onLocate }) {
  return <>
    <p className="capacity-section-note">A direct same-floor Cat6 route assigns a network endpoint to a switch. Each drawn Cat6 link between switches uses one copper port at each end. Set the available budget for each switch.</p>
    {!plan.switches.length && <p className="capacity-empty">Place switches and connect your endpoints to compare demand with available ports and power.</p>}
    <div className="capacity-switches">{plan.switches.map(row => <article className="capacity-switch" key={row.device.id}>
      <header>
        <DeviceCell row={row}/>
        <span className={'capacity-status' + (row.limits.length ? ' over' : '')}>{row.limits.length ? 'Over limit' : 'Assigned load within limits'}</span>
        <Locate row={row} onLocate={onLocate}/>
      </header>
      <dl className="capacity-switch-load">
        <div><dt>Copper ports used</dt><dd>{row.usedPorts} / {row.capacity.copperPorts}</dd></div>
        <div><dt>PoE ports used</dt><dd>{row.poweredPorts} / {row.capacity.poePorts}</dd></div>
        <div><dt>PoE allocated</dt><dd>{number(row.poeWatts)} / {number(row.capacity.poeBudgetWatts)} W</dd></div>
      </dl>
      <SwitchBudgetFields device={row.device} capacity={row.capacity}
        onChange={partial => onChangeDevice(row.floorId, row.device.id, partial)}/>
      <p className="capacity-section-note">{count(row.endpoints.length, 'endpoint')} · {count(row.uplinks, 'copper uplink port')}
        {row.endpoints.length > 0 && <> · {row.endpoints.map(endpoint => endpoint.device.id).join(', ')}</>}</p>
      {row.limits.length > 0 && <p className="capacity-switch-warning"><WarningCircle size={17}/>
        <span>Exceeded: {row.limits.join(', ')}{row.highPowerIds.length > 0 && <> · High-power endpoints: {row.highPowerIds.join(', ')}</>}</span>
      </p>}
    </article>)}</div>
  </>;
}

function UnassignedTable({ plan, onChangeDevice, onLocate }) {
  return <>
    <p className="capacity-section-note">{count(plan.unassigned.length, 'endpoint')} and {number(plan.unassignedPoEWatts)} W need a switch assignment. Their demand is included in the project totals.</p>
    {!plan.unassigned.length ? <p className="capacity-empty">All network endpoints have an unambiguous switch assignment.</p> :
      <div className="capacity-table-wrap"><table className="capacity-table">
        <thead><tr><th scope="col">Endpoint</th><th scope="col">Assignment issue</th><th scope="col">PoE allocation</th><th scope="col"><span className="sr-only">Map</span></th></tr></thead>
        <tbody>{plan.unassigned.map(row => <tr key={row.device.id}>
          <td><DeviceCell row={row}/></td>
          <td>{row.reason}</td>
          <td><CapacityInput name={row.device.id + ' PoE allocation'} value={row.watts} setting="poeWatts" unit="W"
            onCommit={value => onChangeDevice(row.floorId, row.device.id, { poeWatts: value })}/></td>
          <td><Locate row={row} onLocate={onLocate}/></td>
        </tr>)}</tbody>
      </table></div>}
  </>;
}

export default function CapacityPanel({ project, onRetentionChange, onChangeDevice, onLocate }) {
  const plan = useMemo(() => buildCapacityPlan(project), [project]);
  const [view, setView] = useState('recording');
  const overLimit = plan.switches.filter(row => row.limits.length).length;
  return <section className="capacity-panel" aria-label="Capacity estimates">
    <div className="capacity-summary">
      <Metric icon={HardDrives} title="Recording storage" value={storage(plan.storageTB)} detail={plan.retentionDays + ' days · footage only'}/>
      <Metric icon={CellSignalFull} title="Camera bandwidth" value={number(plan.bandwidthMbps) + ' Mbps'} detail={count(plan.cameras.length, 'simultaneous stream')}/>
      <Metric icon={Network} title="Copper ports needed" value={plan.switchPorts} detail={count(plan.endpointPorts, 'endpoint') + ' · ' + count(plan.uplinkPorts, 'uplink port')}/>
      <Metric icon={Lightning} title="PoE required" value={number(plan.poeWatts) + ' W'} detail={count(plan.poweredPorts, 'powered endpoint')}/>
    </div>
    <div className="capacity-controls">
      <LabeledInput label="Retention days" name="Retention days" value={plan.retentionDays} setting="retentionDays" whole unit="days"
        onCommit={onRetentionChange}/>
      <div className="capacity-tabs" role="group" aria-label="Capacity details">
        <button type="button" aria-pressed={view === 'recording'} onClick={() => setView('recording')}><VideoCamera size={16}/>Recording</button>
        <button type="button" aria-pressed={view === 'switches'} onClick={() => setView('switches')}><Network size={16}/>Switches{overLimit > 0 && <span className="capacity-tab-alert">{overLimit} over</span>}</button>
        <button type="button" aria-pressed={view === 'unassigned'} onClick={() => setView('unassigned')}>Unassigned ({plan.unassigned.length})</button>
      </div>
    </div>
    {view === 'recording' && <RecordingTable plan={plan} onChangeDevice={onChangeDevice} onLocate={onLocate}/>}
    {view === 'switches' && <SwitchTable plan={plan} onChangeDevice={onChangeDevice} onLocate={onLocate}/>}
    {view === 'unassigned' && <UnassignedTable plan={plan} onChangeDevice={onChangeDevice} onLocate={onLocate}/>}
    <div className="capacity-assumptions"><Info size={17}/><p>Cameras and IP intercoms start as network endpoints. Enable others under Network &amp; PoE in device properties. Storage uses decimal units. Allow separately for RAID, recorder overhead, peak traffic and undrawn uplinks.</p></div>
  </section>;
}
