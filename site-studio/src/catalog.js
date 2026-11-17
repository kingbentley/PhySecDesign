import { defaultImageWidth } from './dori.js';

/** Generic proof-of-concept equipment. Prices are editable planning allowances. */
export const DEVICE_TYPES = Object.freeze({
  camera: { label: 'Cameras', singular: 'Camera', color: '#007f74', prefix: 'C' },
  reader: { label: 'Access control', singular: 'Reader', color: '#8b5fc4', prefix: 'R' },
  light: { label: 'Lighting', singular: 'Light', color: '#b38321', prefix: 'L' },
  door: { label: 'Door contacts', singular: 'Door contact', color: '#5276a6', prefix: 'D' },
  sensor: { label: 'Intrusion sensors', singular: 'Sensor', color: '#bc6558', prefix: 'S' },
  intercom: { label: 'Intercoms', singular: 'Intercom', color: '#877b40', prefix: 'I' },
  switch: { label: 'Network switches', singular: 'Switch', color: '#487989', prefix: 'SW' },
  cabinet: { label: 'Equipment cabinets', singular: 'Cabinet', color: '#65717f', prefix: 'CAB' },
});

const defaults = (height, mounting, camera = {}) => ({
  height, bearing: 180, fov: 72, range: 28, lens: 4, mounting, ...camera,
});

const cameraOptics = lens => ({ lens, sensorWidth: 6.4, aspectRatio: 16 / 9, tilt: 25, targetHeight: 0, fov: 2 * Math.atan(6.4 / (2 * lens)) * 180 / Math.PI });

export const EQUIPMENT_CATALOG = Object.freeze([
  { id: 'camera-dome-4mp', type: 'camera', name: '4 MP varifocal dome', model: 'Generic 4 MP dome', unitCost: 450, defaults: defaults(3.2, 'Ceiling', { range: 28, imageWidth: defaultImageWidth('camera-dome-4mp'), ...cameraOptics(4) }) },
  { id: 'camera-bullet-8mp', type: 'camera', name: '8 MP outdoor bullet', model: 'Generic 8 MP bullet', unitCost: 650, defaults: defaults(4.5, 'Wall bracket', { range: 40, imageWidth: defaultImageWidth('camera-bullet-8mp'), ...cameraOptics(6) }) },
  { id: 'reader-standard', type: 'reader', name: 'Credential reader', model: 'Generic access reader', unitCost: 225, defaults: defaults(1.2, 'Wall') },
  { id: 'light-exterior', type: 'light', name: 'Exterior LED light', model: 'Generic exterior luminaire', unitCost: 180, defaults: defaults(4, 'Pole') },
  { id: 'door-contact', type: 'door', name: 'Door contact', model: 'Generic magnetic contact', unitCost: 35, defaults: defaults(2.1, 'Door frame') },
  { id: 'sensor-motion', type: 'sensor', name: 'Motion detector', model: 'Generic dual-technology sensor', unitCost: 95, defaults: defaults(2.4, 'Wall') },
  { id: 'intercom-ip', type: 'intercom', name: 'IP door intercom', model: 'Generic IP intercom', unitCost: 700, defaults: defaults(1.4, 'Wall') },
  { id: 'switch-poe-8', type: 'switch', name: '8-port PoE switch', model: 'Generic managed PoE switch', unitCost: 320, defaults: defaults(1.5, 'Equipment cabinet') },
  { id: 'cabinet-wall', type: 'cabinet', name: 'Wall equipment cabinet', model: 'Generic 9U wall cabinet', unitCost: 250, defaults: defaults(1.5, 'Wall') },
]);

/** Unknown IDs intentionally return undefined; callers can fall back by type. */
export function catalogItem(id) {
  return EQUIPMENT_CATALOG.find(item => item.id === id);
}

export function catalogItemForDevice(device) {
  const exact = catalogItem(device?.catalogId);
  if (exact?.type === device?.type) return exact;
  return EQUIPMENT_CATALOG.find(item => item.type === device?.type);
}
