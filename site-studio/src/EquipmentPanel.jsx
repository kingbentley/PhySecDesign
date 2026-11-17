import React, { useMemo, useState } from 'react';
import { VideoCamera, CreditCard, Lightbulb, Door, Broadcast, PhoneCall, Network, HardDrives, MagnifyingGlass, Plus, MapPin } from '@phosphor-icons/react';
import { DEVICE_TYPES, EQUIPMENT_CATALOG, catalogItemForDevice } from './catalog.js';
import './project-panels.css';

const ICONS = { camera: VideoCamera, reader: CreditCard, light: Lightbulb, door: Door, sensor: Broadcast, intercom: PhoneCall, switch: Network, cabinet: HardDrives };
const safeList = value => Array.isArray(value) ? value : [];

export function EquipmentPanel({ project, onPlace, onLocate, onClose }) {
  const [tab, setTab] = useState('catalog');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const schedule = useMemo(() => safeList(project?.floors).flatMap(floor => {
    const building = safeList(project?.buildings).find(entry => entry.id === floor.buildingId);
    return safeList(floor.devices).map(device => ({ ...device, floorId: floor.id, floorName: floor.name || 'Floor', buildingName: building?.name || 'Building' }));
  }), [project]);
  const normalized = query.trim().toLowerCase();
  const matches = item => (type === 'all' || item.type === type) && [item.name, item.model, item.id, item.floorName, item.buildingName, DEVICE_TYPES[item.type]?.label].join(' ').toLowerCase().includes(normalized);
  const entries = (tab === 'catalog' ? EQUIPMENT_CATALOG : schedule).filter(matches);
  const proposed = schedule.filter(item => item.status !== 'existing').length;
  const existing = schedule.length - proposed;

  return <div className="poc-panel">
    <div className="poc-tabs" role="tablist" aria-label="Equipment views">
      <button type="button" role="tab" aria-selected={tab === 'catalog'} onClick={() => setTab('catalog')}>Equipment catalog <span>{EQUIPMENT_CATALOG.length}</span></button>
      <button type="button" role="tab" aria-selected={tab === 'schedule'} onClick={() => setTab('schedule')}>Project schedule <span>{schedule.length}</span></button>
    </div>
    <div className="poc-filter-row">
      <label className="poc-search"><MagnifyingGlass size={18}/><input aria-label="Search equipment" value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === 'catalog' ? 'Find equipment or a device type' : 'Find a device, building or floor'}/></label>
      <select aria-label="Filter equipment type" value={type} onChange={event => setType(event.target.value)}><option value="all">All equipment</option>{Object.entries(DEVICE_TYPES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select>
    </div>
    <p className="poc-context">{tab === 'catalog' ? 'Choose equipment, then click its position on the current floor. Generic models can be edited after placement.' : `${proposed} proposed · ${existing} existing · Across all buildings and floors`}</p>
    <div className="poc-equipment-list" role="tabpanel" aria-label={tab === 'catalog' ? 'Equipment catalog' : 'Project equipment schedule'}>
      {!entries.length && <div className="poc-empty"><MagnifyingGlass size={30}/><strong>{normalized || type !== 'all' ? 'No matching equipment' : 'No equipment placed yet'}</strong><p>{normalized || type !== 'all' ? 'Try another search or device type.' : 'Select a catalog item to add your first device.'}</p></div>}
      {entries.map(item => {
        const meta = DEVICE_TYPES[item.type];
        const Icon = ICONS[item.type] || HardDrives;
        const catalog = tab === 'catalog' ? item : catalogItemForDevice(item);
        return <div className="poc-equipment-row" key={tab === 'catalog' ? item.id : `${item.floorId}:${item.id}`}>
          <div className="poc-device-icon" style={{ color: meta?.color || '#65717f' }}><Icon size={24} weight="regular"/></div>
          <div className="poc-equipment-copy"><strong>{tab === 'schedule' && <span className="poc-device-id">{item.id}</span>}{item.name || meta?.singular || 'Device'}</strong><span>{tab === 'catalog' ? `${item.model} · ${item.defaults.mounting}` : `${item.buildingName} / ${item.floorName} · ${item.model || catalog?.model || meta?.singular || 'Generic device'}`}</span></div>
          {tab === 'schedule' && <span className={`poc-status ${item.status === 'existing' ? 'poc-status-existing' : ''}`}>{item.status === 'existing' ? 'Existing' : 'Proposed'}</span>}
          <button className="poc-row-action" type="button" onClick={() => tab === 'catalog' ? onPlace?.(item) : onLocate?.(item.floorId, item.id)} aria-label={tab === 'catalog' ? `Place ${item.name}` : `Locate ${item.id} on ${item.floorName}`}>{tab === 'catalog' ? <Plus size={17}/> : <MapPin size={17}/>}<span>{tab === 'catalog' ? 'Place' : 'Locate'}</span></button>
        </div>;
      })}
    </div>
    <div className="poc-panel-footer"><span>{tab === 'catalog' ? 'Generic planning equipment · Choose final manufacturer models during design.' : 'Device positions and schedules are saved with their floor.'}</span><button type="button" className="poc-secondary" onClick={onClose}>Close</button></div>
  </div>;
}

export default EquipmentPanel;
