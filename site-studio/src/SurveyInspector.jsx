import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Crosshair, MapPin, NotePencil, Plus, Ruler, Trash, X } from '@phosphor-icons/react';
import { makeId } from './projectModel.js';
import { MEASUREMENT_UNITS, prepareSurveyPhoto, SURVEY_LIMITS } from './survey.js';
import './survey.css';

export function SurveyNoteList({ notes, selectedId, onOpen, showAnchor = false }) {
  return <div className="survey-note-list">
    {notes.map(note => <button key={note.id} type="button" className={note.id === selectedId ? 'selected' : ''}
      onClick={() => onOpen(note)}>
      {note.anchor.kind === 'point' && showAnchor ? <MapPin size={16}/> : <NotePencil size={16}/>}
      <span><strong>{note.title}</strong>{showAnchor && <small>{note.anchor.kind === 'device' ? note.anchor.deviceId : 'Map pin'}</small>}</span>
      {note.photos.length > 0 && <small className="survey-note-count" title={note.photos.length + ' photos'}><Camera size={14}/>{note.photos.length}</small>}
    </button>)}
  </div>;
}

export default function SurveyInspector({ note, isNew, device, floorName, onSave, onClose, onLocate, onRemove }) {
  const [draft, setDraft] = useState(() => ({
    ...note, measurements: note.measurements.map(row => ({ ...row, rowId: makeId('measurement'), value: String(row.value) })),
    photos: note.photos.map(photo => ({ ...photo, rowId: makeId('photo') })),
  }));
  const [dirty, setDirty] = useState(isNew);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const photoInput = useRef(null);
  const photoRequest = useRef(null);

  useEffect(() => () => { photoRequest.current = null; }, []);

  function change(update) {
    setDraft(previous => ({ ...previous, ...(typeof update === 'function' ? update(previous) : update) }));
    setDirty(true);
    setError('');
  }

  function changeMeasurement(rowId, partial) {
    change(previous => ({
      measurements: previous.measurements.map(row => row.rowId === rowId ? { ...row, ...partial } : row),
    }));
  }

  async function addPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || photoRequest.current) return;
    const available = SURVEY_LIMITS.photosPerNote - draft.photos.length;
    const request = Symbol();
    photoRequest.current = request;
    setBusy(true);
    setPhotoError('');
    const errors = [];
    const photos = [];
    for (const file of files.slice(0, available)) {
      try {
        const photo = await prepareSurveyPhoto(file);
        photos.push({ ...photo, rowId: makeId('photo') });
      } catch (cause) {
        errors.push(file.name + ' — ' + cause.message);
      }
      if (photoRequest.current !== request) return;
    }
    if (files.length > available) errors.push('You can attach up to ' + SURVEY_LIMITS.photosPerNote + ' photos per note.');
    if (photos.length) change(previous => ({ photos: [...previous.photos, ...photos] }));
    setPhotoError(errors.join(' '));
    photoRequest.current = null;
    setBusy(false);
  }

  function save(event) {
    event.preventDefault();
    if (busy || !dirty) return;
    try {
      if (draft.measurements.some(row => row.value.trim() === '')) throw new Error('Enter a value for each measurement.');
      onSave({
        ...draft,
        measurements: draft.measurements.map(({ label, value, unit }) => ({ label, value: Number(value), unit })),
        photos: draft.photos.map(({ name, dataUrl }) => ({ name, dataUrl })),
      });
      setDirty(false);
      setError('');
    } catch (cause) {
      setError(cause.message);
    }
  }

  const previewPhoto = draft.photos.find(photo => photo.rowId === preview);

  return <section className="survey-inspector" aria-label="Survey note">
    <div className="inspector-header">
      <span className="eyebrow">SITE SURVEY</span>
      <div className="title-row">
        <h1>{isNew ? 'New survey note' : note.title}</h1>
        <button type="button" className="icon-button" aria-label="Close survey note" onClick={onClose}><X size={18}/></button>
      </div>
      <p>{floorName} · {device ? device.id + ' · ' + device.name : 'Map pin'}</p>
    </div>
    <form className="inspector-body survey-body" onSubmit={save}>
      <label className="text-field"><span>Survey title</span>
        <input value={draft.title} maxLength={100} required autoFocus={isNew} placeholder="e.g. Entrance mounting check" onChange={event => change({ title: event.target.value })}/>
      </label>
      <label className="text-field"><span>Installation notes</span>
        <textarea rows="4" value={draft.notes} maxLength={5000} placeholder="Access, mounting surface, cable path, or other field observations…" onChange={event => change({ notes: event.target.value })}/>
      </label>

      <div className="side-divider"/>
      <div className="survey-section-heading"><h3><Ruler size={17}/>Measurements</h3>
        <button type="button" className="text-button" aria-label="Add measurement" disabled={draft.measurements.length >= SURVEY_LIMITS.measurementsPerNote}
          onClick={() => change(previous => ({ measurements: [...previous.measurements, { rowId: makeId('measurement'), label: '', value: '', unit: 'm' }] }))}>
          <Plus size={14}/>Add
        </button>
      </div>
      {draft.measurements.map((row, index) => <div className="survey-measurement" key={row.rowId}>
        <label className="text-field survey-measurement-label"><span>Measurement {index + 1}</span>
          <input value={row.label} required maxLength={80} placeholder="e.g. Mounting height" onChange={event => changeMeasurement(row.rowId, { label: event.target.value })}/>
        </label>
        <label className="text-field"><span>Value</span>
          <input type="number" min="0" max="1000000" step="any" value={row.value} required
            onChange={event => changeMeasurement(row.rowId, { value: event.target.value })}/>
        </label>
        <label className="text-field"><span>Unit</span>
          <select value={row.unit} onChange={event => changeMeasurement(row.rowId, { unit: event.target.value })}>
            {MEASUREMENT_UNITS.map(unit => <option key={unit}>{unit}</option>)}
          </select>
        </label>
        <button type="button" className="icon-button" aria-label={'Remove measurement ' + (index + 1)}
          onClick={() => change(previous => ({ measurements: previous.measurements.filter(item => item.rowId !== row.rowId) }))}><X size={16}/></button>
      </div>)}

      <div className="side-divider"/>
      <div className="survey-section-heading"><h3><Camera size={17}/>Photos</h3>
        <button type="button" className="text-button" disabled={busy || draft.photos.length >= SURVEY_LIMITS.photosPerNote}
          onClick={() => photoInput.current?.click()}><Plus size={14}/>Add photos</button>
      </div>
      <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple hidden onChange={addPhotos}/>
      <p className="survey-help">{draft.photos.length} of {SURVEY_LIMITS.photosPerNote} · JPG, PNG or WebP · up to 20 MB each</p>
      {busy && <p className="survey-help" role="status">Preparing photos…</p>}
      {photoError && <p className="survey-error" role="alert">{photoError}</p>}
      <div className="survey-photo-list">
        {draft.photos.map((photo, index) => <div className="survey-photo" key={photo.rowId}>
          <button type="button" className="survey-photo-thumb" title={photo.name}
            aria-label={'Preview photo ' + (index + 1) + ', ' + photo.name} aria-pressed={preview === photo.rowId}
            onClick={() => setPreview(preview === photo.rowId ? null : photo.rowId)}>
            <img src={photo.dataUrl} alt={photo.name}/>
          </button>
          <span title={photo.name}>{photo.name}</span>
          <button type="button" className="icon-button" aria-label={'Remove photo ' + (index + 1)} disabled={busy}
            onClick={() => change(previous => ({ photos: previous.photos.filter(item => item.rowId !== photo.rowId) }))}><X size={14}/></button>
        </div>)}
      </div>
      {previewPhoto && <figure className="survey-photo-preview">
        <img src={previewPhoto.dataUrl} alt={previewPhoto.name}/>
        <figcaption>{previewPhoto.name}</figcaption>
      </figure>}

      {error && <p className="survey-error" role="alert">{error}</p>}
      <div className="survey-actions">
        <button type="submit" className="button primary" disabled={busy || !dirty || !draft.title.trim()}><Check size={17}/>Save survey note</button>
        <button type="button" className="button secondary" onClick={onClose}>{dirty ? 'Cancel' : 'Close'}</button>
      </div>
      {!isNew && <div className="survey-secondary-actions">
        <button type="button" className="text-button" onClick={onLocate}><Crosshair size={15}/>Locate on map</button>
        {confirmRemove ? <>
          <p>Remove this note and its photos?</p>
          <button type="button" className="text-button survey-delete" onClick={onRemove}>Remove note</button>
          <button type="button" className="text-button" onClick={() => setConfirmRemove(false)}>Keep</button>
        </> : <button type="button" className="text-button survey-delete" onClick={() => setConfirmRemove(true)}><Trash size={15}/>Delete note</button>}
      </div>}
    </form>
  </section>;
}
