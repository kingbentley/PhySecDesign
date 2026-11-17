import React, { useEffect, useId, useState } from 'react';
import { Buildings, CaretDown, CaretRight, FileImage, Plus, PencilSimple, Trash, Check, WarningCircle, Stack } from '@phosphor-icons/react';
import './floors.css';

const cleanName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const plural = (count, singular) => `${count} ${singular}${count === 1 ? '' : 's'}`;

export default function FloorManager({
  project,
  onSelectFloor,
  onAddBuilding,
  onRenameBuilding,
  onAddFloor,
  onRenameFloor,
  onRemoveFloor,
  onRenameProject,
  disabled = false,
}) {
  const [managing, setManaging] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [pending, setPending] = useState(false);
  const inputId = useId();
  const buildings = project?.buildings ?? [];
  const floors = project?.floors ?? [];
  const locked = disabled || pending;
  const activeBuildingId = floors.find((floor) => floor.id === project?.activeFloorId)?.buildingId;

  useEffect(() => {
    if (activeBuildingId) setCollapsed((state) => ({ ...state, [activeBuildingId]: false }));
  }, [project?.activeFloorId, activeBuildingId]);

  function startEditor(kind, id, name = '', buildingId) {
    setEditor({ kind, id, buildingId });
    setDraft(name);
    setError('');
    setRemoving(null);
    if (buildingId) setCollapsed((state) => ({ ...state, [buildingId]: false }));
  }

  function closeEditor() {
    setEditor(null);
    setDraft('');
    setError('');
  }

  async function saveName(event) {
    event.preventDefault();
    if (locked || !editor) return;
    const name = cleanName(draft);
    if (!name) { setError('Enter a name to continue.'); return; }
    if (name.length > 80) { setError('Use 80 characters or fewer.'); return; }
    let siblings = [];
    if (editor.kind === 'building' || editor.kind === 'newBuilding') siblings = buildings;
    if (editor.kind === 'floor' || editor.kind === 'newFloor') siblings = floors.filter((floor) => floor.buildingId === editor.buildingId);
    if (siblings.some((item) => item.id !== editor.id && cleanName(item.name).toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError(editor.kind.includes('Building') || editor.kind === 'building' ? 'A building already uses this name.' : 'A floor in this building already uses this name.');
      return;
    }
    setPending(true);
    try {
      if (editor.kind === 'project') await onRenameProject(name);
      if (editor.kind === 'building') await onRenameBuilding(editor.id, name);
      if (editor.kind === 'newBuilding') await onAddBuilding(name);
      if (editor.kind === 'floor') await onRenameFloor(editor.id, name);
      if (editor.kind === 'newFloor') await onAddFloor(editor.buildingId, name);
      closeEditor();
    } catch (reason) {
      setError(reason?.message || 'The name could not be saved. Try again.');
    } finally { setPending(false); }
  }

  async function removeFloor(id) {
    if (locked || floors.length <= 1) return;
    setPending(true);
    setError('');
    try { await onRemoveFloor(id); setRemoving(null); }
    catch (reason) { setError(reason?.message || 'This floor could not be removed. Try again.'); }
    finally { setPending(false); }
  }

  function editorForm(label, placeholder, isNew = false) {
    return <form className="floor-inline-form" onSubmit={saveName} onKeyDown={(event) => {
      if (event.key === 'Escape' && !pending) { event.stopPropagation(); closeEditor(); }
    }}>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} autoFocus autoComplete="off" maxLength={80} value={draft} placeholder={placeholder} disabled={locked} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={(event) => { setDraft(event.target.value); setError(''); }} />
      {editor?.kind === 'newFloor' && <p className="floor-form-help">Import a drawing after adding the floor.</p>}
      {error && <p id={`${inputId}-error`} className="floor-form-error" role="alert">{error}</p>}
      <div className="floor-form-actions">
        <button className="floor-action-muted" type="button" disabled={pending} onClick={closeEditor}>Cancel</button>
        <button className="floor-action-primary" type="submit" disabled={locked || !cleanName(draft)}>{pending ? 'Saving…' : isNew ? 'Add' : 'Save'}<Check size={13} weight="bold" /></button>
      </div>
    </form>;
  }

  return <section className="floor-manager" aria-label="Project buildings and floors">
    <div className="floor-heading"><h2>Project</h2><button className={'floor-manage-button' + (managing ? ' is-active' : '')} disabled={locked} aria-expanded={managing} onClick={() => {
      setManaging((value) => !value); closeEditor(); setRemoving(null);
    }}>{managing ? <><Check size={12} />Done</> : 'Manage'}</button></div>

    <div className="floor-project-title"><Buildings size={18} /><strong title={project?.name}>{project?.name || 'Untitled project'}</strong>{managing && <button className="floor-icon-button" aria-label="Rename project" title="Rename project" disabled={locked} onClick={() => startEditor('project', undefined, project?.name)}><PencilSimple size={14} /></button>}</div>
    {editor?.kind === 'project' && editorForm('Project name', 'Name this project')}

    <div className="floor-building-list">
      {buildings.map((building) => {
        const buildingFloors = floors.filter((floor) => floor.buildingId === building.id);
        const isCollapsed = Boolean(collapsed[building.id]);
        return <div className="floor-building-group" key={building.id}>
          <div className="floor-building-heading">
            <button className="floor-building-toggle" aria-expanded={!isCollapsed} disabled={locked} onClick={() => setCollapsed((state) => ({ ...state, [building.id]: !isCollapsed }))} title={building.name}>
              {isCollapsed ? <CaretRight size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}<Buildings size={16} /><span>{building.name}</span><small>{buildingFloors.length}</small>
            </button>
            {managing && <button className="floor-icon-button" aria-label={`Rename ${building.name}`} title="Rename building" disabled={locked} onClick={() => startEditor('building', building.id, building.name)}><PencilSimple size={14} /></button>}
          </div>
          {editor?.kind === 'building' && editor.id === building.id && editorForm('Building name', 'e.g. Building A')}
          {!isCollapsed && <div className="floor-list">
            {buildingFloors.map((floor) => {
              const active = floor.id === project?.activeFloorId;
              const deviceCount = floor.devices?.length ?? 0;
              const routeCount = floor.routes?.length ?? 0;
              const barrierCount = floor.barriers?.length ?? 0;
              const hasDrawing = Boolean(floor.plan?.url);
              return <div className="floor-item-wrap" key={floor.id}>
                <div className={'floor-row' + (active ? ' is-active' : '')}>
                  <button className="floor-select" aria-current={active ? 'page' : undefined} aria-label={`${floor.name}, ${hasDrawing ? 'drawing attached' : 'no drawing'}, ${plural(deviceCount, 'device')}, ${plural(barrierCount, 'barrier')}`} title={floor.name} disabled={locked} onClick={() => onSelectFloor(floor.id)}>
                    {hasDrawing ? <FileImage size={17} /> : <Stack size={17} />}
                    <span className="floor-row-copy"><strong>{floor.name}</strong><small><span className={hasDrawing ? 'floor-drawing-present' : 'floor-drawing-missing'}>{hasDrawing ? 'Drawing' : 'No drawing'}</span><span className="floor-meta-dot">·</span>{plural(deviceCount, 'device')}</small></span>
                  </button>
                  {managing && <div className="floor-row-actions"><button className="floor-icon-button" aria-label={`Rename floor ${floor.name}`} title="Rename floor" disabled={locked} onClick={() => startEditor('floor', floor.id, floor.name, building.id)}><PencilSimple size={13} /></button><button className="floor-icon-button floor-remove-button" aria-label={`Remove floor ${floor.name}`} title={floors.length <= 1 ? 'Keep at least one floor in the project' : 'Remove floor'} disabled={locked || floors.length <= 1} onClick={() => { setRemoving(floor.id); closeEditor(); }}><Trash size={13} /></button></div>}
                </div>
                {editor?.kind === 'floor' && editor.id === floor.id && editorForm('Floor name', 'e.g. Ground floor')}
                {removing === floor.id && <div className="floor-remove-confirm" role="group" aria-label={`Confirm removal of ${floor.name}`}>
                  <div className="floor-remove-title"><WarningCircle size={16} /><strong>Remove “{floor.name}”?</strong></div>
                  <p>This removes {hasDrawing ? 'its drawing, ' : ''}{plural(deviceCount, 'device')}, {plural(routeCount, 'route')}, {plural(barrierCount, 'barrier')}, and {plural(floor.surveyNotes?.length ?? 0, 'survey note')} including attached photos.</p>
                  {error && <p className="floor-form-error" role="alert">{error}</p>}
                  <div className="floor-form-actions"><button className="floor-action-muted" disabled={pending} onClick={() => { setRemoving(null); setError(''); }}>Cancel</button><button className="floor-action-danger" disabled={locked || floors.length <= 1} onClick={() => removeFloor(floor.id)}>{pending ? 'Removing…' : 'Remove floor'}</button></div>
                </div>}
              </div>;
            })}
            {buildingFloors.length === 0 && <p className="floor-empty-building">No floors added</p>}
            {managing && !(editor?.kind === 'newFloor' && editor.buildingId === building.id) && <button className="floor-add-button" disabled={locked} onClick={() => startEditor('newFloor', undefined, '', building.id)}><Plus size={13} />Add floor</button>}
            {editor?.kind === 'newFloor' && editor.buildingId === building.id && editorForm(`New floor in ${building.name}`, 'e.g. Level 2', true)}
          </div>}
        </div>;
      })}
    </div>
    {managing && <div className="floor-management-footer">
      {editor?.kind === 'newBuilding' ? editorForm('New building', 'e.g. Building B', true) : <button className="floor-add-building" disabled={locked} onClick={() => startEditor('newBuilding')}><Plus size={14} />Add building</button>}
      <p>Each floor has its own drawing, devices, cable routes, walls and obstructions.</p>
    </div>}
  </section>;
}
