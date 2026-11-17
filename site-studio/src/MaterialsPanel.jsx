import React, { useEffect, useMemo, useState } from 'react';
import { DownloadSimple, Package, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { buildBOM, ESTIMATE_LINE_LIMIT, ESTIMATE_UNITS, estimateLineTotal, estimateTotals } from './materials.js';
import { makeId, normalizeEstimate } from './projectModel.js';
import './project-panels.css';
import './materials-estimate.css';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const quantityFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const dollars = value => currencyFormat.format(value);
const quantity = value => quantityFormat.format(value);
const EMPTY_ESTIMATE = { includeLabor: false, lines: [] };

function CostInput({ value, label, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  function commit() {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) { setDraft(String(value)); return; }
    const rounded = Math.round(parsed * 100) / 100;
    setDraft(String(rounded));
    if (rounded !== value) onCommit(rounded);
  }
  return <label className="poc-cost-input"><span>$</span><input type="number" aria-label={label} min="0" max="1000000" step="0.01" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}/></label>;
}

function EstimateLineEditor({ line, existing, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...line, quantity: String(line.quantity), unitCost: String(line.unitCost) });
  const [error, setError] = useState('');
  const item = line.category === 'labor' ? 'labor line' : 'accessory';
  const units = ESTIMATE_UNITS[line.category];
  const change = (key, value) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    setError('');
  };

  function save(event) {
    event.preventDefault();
    try {
      if (!draft.quantity.trim() || !draft.unitCost.trim()) throw new Error('Enter a quantity and unit cost.');
      const { lines: [clean] } = normalizeEstimate({
        lines: [{ ...draft, quantity: Number(draft.quantity), unitCost: Number(draft.unitCost) }],
      });
      onSave(clean);
    } catch (cause) {
      setError(cause.message);
    }
  }

  return <form className="estimate-editor" onSubmit={save} aria-label={(existing ? 'Edit ' : 'Add ') + item}>
    <h3>{existing ? 'Edit ' : 'Add '}{item}</h3>
    <div className="estimate-editor-fields">
      <label><span>Description</span><input required autoFocus maxLength={120} value={draft.description}
        placeholder={line.category === 'labor' ? 'e.g. Camera installation' : 'e.g. Junction box'}
        onChange={event => change('description', event.target.value)}/></label>
      <label><span>Quantity</span><input type="number" required min="0.01" max="1000000" step="0.01" value={draft.quantity}
        onChange={event => change('quantity', event.target.value)}/></label>
      <label><span>Unit</span><select value={draft.unit} onChange={event => change('unit', event.target.value)}>
        {Object.entries(units).map(([unit, label]) => <option value={unit} key={unit}>{label}</option>)}
      </select></label>
      <label><span>Unit cost (USD)</span><input type="number" required min="0" max="1000000" step="0.01" value={draft.unitCost}
        onChange={event => change('unitCost', event.target.value)}/></label>
    </div>
    {error && <p className="estimate-editor-error" role="alert">{error}</p>}
    <div className="estimate-editor-actions">
      <span>Line total <strong>{dollars(estimateLineTotal({ quantity: Number(draft.quantity) || 0, unitCost: Number(draft.unitCost) || 0 }))}</strong></span>
      <button className="poc-secondary" type="button" onClick={onCancel}>Cancel</button>
      <button className="poc-primary" type="submit">{existing ? 'Save changes' : 'Add line'}</button>
    </div>
  </form>;
}

export function MaterialsPanel({ project, onCostsChange, onEstimateChange, onExportCsv, onClose }) {
  const estimate = project.estimate ?? EMPTY_ESTIMATE;
  const rows = useMemo(() => buildBOM(project), [project]);
  const [editor, setEditor] = useState(null);
  const equipment = rows.filter(row => row.category === 'equipment');
  const cables = rows.filter(row => row.category === 'cable');
  const proposed = equipment.reduce((sum, row) => sum + row.quantity, 0);
  const existing = equipment.reduce((sum, row) => sum + row.existingQuantity, 0);
  const totals = estimateTotals(rows);
  const cableLength = cables.reduce((sum, row) => sum + row.quantity, 0);
  const excludedLabor = estimate.includeLabor ? [] : estimate.lines.filter(line => line.category === 'labor');
  const omittedLaborCost = excludedLabor.reduce((sum, line) => sum + estimateLineTotal(line), 0);
  const displayRows = [...rows, ...excludedLabor.map(line => ({
    ...line, key: line.category + ':' + line.id, totalCost: estimateLineTotal(line), excluded: true,
  }))];

  function changeCost(row, cost) {
    const group = row.category === 'equipment' ? 'equipment' : 'cable';
    const id = row.category === 'equipment' ? row.catalogId : row.cableType;
    onCostsChange?.({ ...(project?.costs || {}), [group]: { ...(project?.costs?.[group] || {}), [id]: cost } });
  }

  function addLine(category) {
    setEditor({ id: makeId('estimate'), category, description: '', unit: category === 'labor' ? 'hour' : 'each', quantity: 1, unitCost: '' });
  }

  function saveLine(line) {
    const exists = estimate.lines.some(item => item.id === line.id);
    const lines = exists ? estimate.lines.map(item => item.id === line.id ? line : item) : [...estimate.lines, line];
    onEstimateChange(normalizeEstimate({ ...estimate, lines }));
    setEditor(null);
  }

  function removeLine(id) {
    onEstimateChange({ ...estimate, lines: estimate.lines.filter(line => line.id !== id) });
    if (editor?.id === id) setEditor(null);
  }

  return <div className="poc-panel">
    <div className="poc-materials-overview">
      <div><span>{estimate.includeLabor ? 'Materials and installation estimate' : 'Materials estimate'}</span><strong>{dollars(totals.total)}</strong></div>
      <label className="estimate-labor-toggle"><input type="checkbox" checked={estimate.includeLabor}
        onChange={event => onEstimateChange({ ...estimate, includeLabor: event.target.checked })}/>Include installation labor</label>
    </div>
    <dl className="estimate-breakdown" aria-label="Estimate subtotals">
      <div><dt>Equipment</dt><dd>{dollars(totals.equipment)}</dd><small>{proposed} proposed · {existing} existing</small></div>
      <div><dt>Cable</dt><dd>{dollars(totals.cable)}</dd><small>{quantity(cableLength)} m with slack</small></div>
      <div><dt>Accessories</dt><dd>{dollars(totals.accessory)}</dd><small>Manual line items</small></div>
      <div><dt>Installation labor</dt><dd>{dollars(estimate.includeLabor ? totals.labor : omittedLaborCost)}</dd>
        <small>{estimate.includeLabor ? 'Included in estimate' : 'Excluded from estimate'}</small></div>
    </dl>
    <div className="estimate-toolbar">
      <h3>Estimate lines</h3>
      <button className="poc-secondary" type="button" onClick={() => addLine('accessory')} disabled={estimate.lines.length >= ESTIMATE_LINE_LIMIT}><Plus size={15}/>Add accessory</button>
      <button className="poc-secondary" type="button" onClick={() => addLine('labor')} disabled={estimate.lines.length >= ESTIMATE_LINE_LIMIT}><Plus size={15}/>Add labor</button>
    </div>
    {editor && <EstimateLineEditor key={editor.id} line={editor} existing={estimate.lines.some(line => line.id === editor.id)}
      onSave={saveLine} onCancel={() => setEditor(null)}/>}
    {!displayRows.length ? <div className="poc-empty"><Package size={34}/><strong>No estimate lines yet</strong><p>Place equipment, draw cable routes, or add accessories and labor here.</p></div> :
      <div className="poc-table-wrap"><table className="poc-materials-table">
        <thead><tr><th scope="col">Item</th><th scope="col">Proposed</th><th scope="col">Existing</th><th scope="col">Unit cost</th><th scope="col">Line total</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{displayRows.map(row => {
          const manual = row.category === 'accessory' || row.category === 'labor';
          const detail = row.category === 'cable'
            ? `${quantity(row.baseLength)} m route + ${quantity(row.slackLength)} m slack · ${row.routeCount} ${row.routeCount === 1 ? 'route' : 'routes'}`
            : row.category === 'accessory' ? 'Accessory'
              : row.category === 'labor' ? 'Installation labor' + (row.excluded ? ' · Excluded' : '') : row.model;
          return <tr key={row.key} className={row.excluded ? 'estimate-excluded' : ''}>
            <td><strong>{row.description}</strong><span>{detail}</span></td>
            <td className="poc-numeric">{quantity(row.quantity)} <span>{row.unit}</span></td>
            <td className="poc-numeric">{row.category === 'equipment' ? row.existingQuantity : '—'}</td>
            <td>{manual ? <strong>{dollars(row.unitCost)}</strong> :
              <CostInput value={row.unitCost} label={`Unit cost for ${row.description}`} onCommit={cost => changeCost(row, cost)}/>}
              <span className="poc-cost-unit">USD / {row.unit}</span></td>
            <td className="poc-numeric poc-total">{dollars(row.totalCost)}</td>
            <td>{manual && <div className="estimate-row-actions">
              <button className="icon-button" type="button" aria-label={'Edit ' + row.description} title="Edit line"
                onClick={() => setEditor(estimate.lines.find(line => line.id === row.id))}><PencilSimple size={16}/></button>
              <button className="icon-button" type="button" aria-label={'Remove ' + row.description} title="Remove line"
                onClick={() => removeLine(row.id)}><Trash size={16}/></button>
            </div>}</td>
          </tr>;
        })}</tbody>
        <tfoot><tr><th colSpan="4" scope="row">Estimate total <span>USD</span></th><td className="poc-numeric">{dollars(totals.total)}</td><td/></tr></tfoot>
      </table></div>}
    <p className="poc-context poc-materials-footnote">Prices are planning allowances in USD. Cable quantities include saved slack. Allow separately for taxes and freight.</p>
    <div className="poc-panel-footer"><button className="poc-secondary" type="button" onClick={onClose}>Close</button><button className="poc-primary" type="button" disabled={!rows.length} onClick={() => onExportCsv?.()}><DownloadSimple size={18}/>Export materials CSV</button></div>
  </div>;
}

export default MaterialsPanel;
