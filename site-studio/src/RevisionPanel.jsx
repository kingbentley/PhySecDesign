import React, { useMemo, useState } from 'react';
import { ClockCounterClockwise, GitDiff, MapTrifold, Plus, Trash } from '@phosphor-icons/react';
import RevisionLayout from './RevisionLayout.jsx';
import { MAX_PROJECT_REVISIONS, MAX_REVISION_NAME, normalizeProject } from './projectModel.js';
import { sameDesignValue, UNDO_LIMIT } from './projectHistory.js';
import { compareFloorDevices, comparisonFloors, comparisonFrame } from './revisionComparison.js';
import './revisions.css';

const DRAFT_ID = '';
const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function revisionSummary(design) {
  const devices = design.floors.reduce((count, floor) => count + floor.devices.length, 0);
  return `${design.floors.length} ${design.floors.length === 1 ? 'floor' : 'floors'} · ${devices} ${devices === 1 ? 'device' : 'devices'}`;
}

function LayoutComparison({ entries, pair, setPair, activeFloorId }) {
  const [floorId, setFloorId] = useState(activeFloorId);
  const left = entries.find(entry => entry.id === pair.left) ?? entries[1];
  const right = entries.find(entry => entry.id === pair.right) ?? entries[0];
  const floors = useMemo(() => comparisonFloors(left.design, right.design), [left.design, right.design]);
  const selected = floors.find(floor => floor.id === floorId) ?? floors[0];
  const before = left.design.floors.find(floor => floor.id === selected.id);
  const after = right.design.floors.find(floor => floor.id === selected.id);
  const { frame, changes, states } = useMemo(() => {
    const changes = compareFloorDevices(before, after);
    return { frame: comparisonFrame(before, after), changes, states: new Map(changes.map(change => [change.id, change.state])) };
  }, [before, after]);
  const drawingChanged = before && after && !sameDesignValue(before.plan, after.plan);
  return <section className="revision-comparison" aria-label="Layout comparison">
    <div className="revision-selectors">
      <label><span>Baseline</span><select value={left.id} onChange={event => setPair({ left: event.target.value, right: right.id })}>
        {entries.map(entry => <option key={entry.id} value={entry.id} disabled={entry.id === right.id}>{entry.name}</option>)}
      </select></label>
      <label><span>Compare with</span><select value={right.id} onChange={event => setPair({ left: left.id, right: event.target.value })}>
        {entries.map(entry => <option key={entry.id} value={entry.id} disabled={entry.id === left.id}>{entry.name}</option>)}
      </select></label>
      <label><span>Floor</span><select value={selected.id} onChange={event => setFloorId(event.target.value)}>
        {floors.map(floor => <option key={floor.id} value={floor.id}>{floor.label}</option>)}
      </select></label>
    </div>
    <div className="revision-diff-summary">
      <h3>Device changes</h3>
      <div className="revision-diff-counts">
        {['Added', 'Removed', 'Changed'].map(label => <span className={label.toLowerCase()} key={label}>
          <strong>{changes.filter(change => change.state === label).length}</strong> {label.toLowerCase()}
        </span>)}
      </div>
    </div>
    <div className="revision-layouts">
      <RevisionLayout entry={left} floor={before} frame={frame} changes={states}/>
      <RevisionLayout entry={right} floor={after} frame={frame} changes={states}/>
    </div>
    <div className="revision-legend">
      <span><VideoCamera size={15}/>Camera direction</span>
      <span className="legend-route">Cable route</span><span className="legend-wall">Wall / obstruction</span><span className="legend-zone">Security zone</span>
      <span className="revision-shared-scale">Same map scale and extent</span>
    </div>
    <div className="revision-diff">
      {drawingChanged && <p className="revision-drawing-change">The drawing or its overlay settings changed.</p>}
      {changes.length > 0 && <div className="revision-change-list"><ul aria-label="Changed devices">{changes.map(change => <li key={change.id}>
        <span className={`revision-change-state ${change.state.toLowerCase()}`}>{change.state}</span>
        <strong>{change.id}</strong><span>{change.name}</span>{change.detail && <small>{change.detail}</small>}
      </li>)}</ul></div>}
    </div>
  </section>;
}

export default function RevisionPanel({ project, revisions, onSave, onRestore, onDelete, onReview, locked }) {
  const [tab, setTab] = useState('history');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [pair, setPair] = useState({ left: revisions[0]?.id, right: DRAFT_ID });
  const draft = useMemo(() => {
    try { return normalizeProject(project, { allowLocalAssets: true }); }
    catch { return project; }
  }, [project]);
  const full = revisions.length >= MAX_PROJECT_REVISIONS;
  const entries = [{ id: DRAFT_ID, name: 'Working draft', design: draft }, ...revisions];

  function save(event) {
    event.preventDefault();
    if (full || locked) return;
    try {
      if (entries.some(entry => entry.name.toLowerCase() === name.trim().toLowerCase())) {
        throw new Error('Choose a name that is different from the saved revisions.');
      }
      onSave(name);
      setName('');
      setError('');
    } catch (cause) { setError(cause.message); }
  }

  function compare(revision) {
    setPair({ left: revision.id, right: DRAFT_ID });
    setTab('compare');
  }

  return <div className="revision-panel">
    <div className="revision-tabs" role="group" aria-label="Revision view">
      <button type="button" aria-pressed={tab === 'history'} onClick={() => setTab('history')}><ClockCounterClockwise size={17}/>History</button>
      <button type="button" aria-pressed={tab === 'compare'} disabled={!revisions.length} onClick={() => setTab('compare')}><GitDiff size={17}/>Compare layouts</button>
    </div>
    {tab === 'compare' && revisions.length > 0 ? <LayoutComparison entries={entries} pair={pair} setPair={setPair} activeFloorId={project.activeFloorId}/> :
      <section aria-label="Saved revisions" className="revision-history">
        <form onSubmit={save} className="revision-save">
          <label><span>Revision name</span><input value={name} required maxLength={MAX_REVISION_NAME} disabled={full || locked}
            onChange={event => { setName(event.target.value); setError(''); }} placeholder="e.g. North entrance layout" /></label>
          <button className="poc-primary" type="submit" disabled={full || locked || !name.trim()}><Plus size={17}/>Save revision</button>
        </form>
        {error && <p role="alert" className="revision-error">{error}</p>}
        {locked && <p className="revision-error">Finish or cancel the edit on the map to save or restore a revision.</p>}
        {full && <p className="revision-error">This project has {MAX_PROJECT_REVISIONS} revisions. Delete a revision to save another.</p>}
        <div className="revision-current">
          <MapTrifold size={22}/><div><strong>Working draft</strong><span>{revisionSummary(project)}</span></div>
        </div>
        {revisions.length ? <ul className="revision-list">{revisions.map(revision => <li key={revision.id} className="revision-item">
          <div className="revision-item-copy">
            <strong>{revision.name}</strong><span>{timestamp.format(revision.savedAt)} · {revisionSummary(revision.design)}</span>
          </div>
          <div className="revision-item-actions">
            {deleting === revision.id ? <>
              <span>Delete this revision?</span>
              <button type="button" className="poc-secondary" onClick={() => setDeleting(null)}>Cancel</button>
              <button type="button" className="button danger" onClick={() => { onDelete(revision.id); setDeleting(null); setPair({ left: undefined, right: DRAFT_ID }); }}>Delete</button>
            </> : <>
              <button type="button" className="poc-secondary" aria-label={`Share and review ${revision.name}`} onClick={() => onReview(revision)}>Share &amp; review</button>
              <button type="button" className="poc-secondary" aria-label={`Compare ${revision.name}`} onClick={() => compare(revision)}><GitDiff size={16}/>Compare</button>
              <button type="button" className="poc-secondary" aria-label={`Restore ${revision.name}`} disabled={locked} onClick={() => onRestore(revision)}>Restore</button>
              <button type="button" className="icon-button" aria-label={`Delete ${revision.name}`} onClick={() => setDeleting(revision.id)}><Trash size={17}/></button>
            </>}
          </div>
        </li>)}</ul> : <div className="revision-empty"><ClockCounterClockwise size={30}/><strong>Save your first revision</strong><p>Record a baseline before you try a different layout.</p></div>}
        <p className="revision-note">Revisions save with the project and travel in project backups. Undo and redo cover the last {UNDO_LIMIT} edits in this session.</p>
      </section>}
  </div>;
}
