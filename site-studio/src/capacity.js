export const CAPACITY_LIMITS = {
  retentionDays: [1, 3650],
  bitrateMbps: [0, 200],
  recordingPercent: [0, 100],
  poeWatts: [0, 100],
  copperPorts: [0, 128],
  poePorts: [0, 128],
  poeBudgetWatts: [0, 5000],
  poePerPortWatts: [0, 100],
};

function setting(value, key, fallback, label, whole = false) {
  if (value === undefined) return fallback;
  const [min, max] = CAPACITY_LIMITS[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (whole && !Number.isInteger(value))) {
    throw new Error(label + ' must be ' + (whole ? 'a whole number ' : '') + 'between ' + min + ' and ' + max + '.');
  }
  return value;
}

export function normalizeCapacity(raw) {
  return { retentionDays: setting(raw?.retentionDays, 'retentionDays', 30, 'Retention days', true) };
}

export function normalizeDeviceCapacity(device) {
  const data = device.capacity ?? {};
  if (device.type === 'switch') {
    const copperPorts = setting(data.copperPorts, 'copperPorts', 8, 'Copper ports', true);
    const poePorts = setting(data.poePorts, 'poePorts', copperPorts, 'PoE ports', true);
    if (poePorts > copperPorts) throw new Error('PoE ports cannot exceed copper ports.');
    return {
      copperPorts, poePorts,
      poeBudgetWatts: setting(data.poeBudgetWatts, 'poeBudgetWatts', 60, 'Total PoE budget'),
      poePerPortWatts: setting(data.poePerPortWatts, 'poePerPortWatts', 30, 'Maximum PoE per port'),
    };
  }
  const camera = device.type === 'camera';
  const intercom = device.type === 'intercom';
  const bullet = camera && device.catalogId === 'camera-bullet-8mp';
  if (data.networked !== undefined && typeof data.networked !== 'boolean') {
    throw new Error('Ethernet port requirement must be true or false.');
  }
  const capacity = {
    networked: camera || (data.networked ?? intercom),
    poeWatts: setting(data.poeWatts, 'poeWatts', bullet ? 30 : camera || intercom ? 15.4 : 0, 'PoE allocation'),
  };
  if (camera) {
    capacity.bitrateMbps = setting(data.bitrateMbps, 'bitrateMbps', bullet ? 8 : 4, 'Stream bitrate');
    capacity.recordingPercent = setting(data.recordingPercent, 'recordingPercent', 100, 'Recording time');
  }
  return capacity;
}

// Decimal TB: (megabits/s × seconds ÷ 8) ÷ 1,000,000.
export function recordingStorageTB(bitrateMbps, recordingPercent, days) {
  return bitrateMbps * (recordingPercent / 100) * days * 86400 / 8000000;
}

/** One copper port per endpoint, plus drawn Cat6 switch-to-switch link ends. */
export function buildCapacityPlan(project) {
  const { retentionDays } = normalizeCapacity(project.capacity);
  const cameras = [];
  const switches = [];
  const unassigned = [];
  let endpointPorts = 0, uplinkPorts = 0, poweredPorts = 0, poeWatts = 0;

  for (const floor of project.floors) {
    const building = project.buildings.find(item => item.id === floor.buildingId);
    const floorLabel = [building?.name, floor.name].filter(Boolean).join(' / ');
    const context = { floorId: floor.id, floorLabel };
    const devices = new Map(floor.devices.map(device => [device.id, device]));
    const switchRows = new Map(floor.devices.filter(device => device.type === 'switch').map(device => [
      device.id, {
        device, ...context, capacity: normalizeDeviceCapacity(device),
        endpoints: [], uplinks: 0, poeWatts: 0, poweredPorts: 0, highPowerIds: [],
      },
    ]));
    const links = new Map();
    for (const route of floor.routes ?? []) {
      if (route.cableType !== 'cat6') continue;
      const from = devices.get(route.fromDeviceId);
      const to = devices.get(route.toDeviceId);
      if (!from || !to || from.id === to.id) continue;
      const fromSwitch = switchRows.get(from.id), toSwitch = switchRows.get(to.id);
      if (fromSwitch && toSwitch) {
        fromSwitch.uplinks++;
        toSwitch.uplinks++;
        uplinkPorts += 2;
      } else if (fromSwitch || toSwitch) {
        const endpoint = fromSwitch ? to : from;
        const connectedSwitch = fromSwitch ?? toSwitch;
        if (!links.has(endpoint.id)) links.set(endpoint.id, new Set());
        links.get(endpoint.id).add(connectedSwitch.device.id);
      }
    }

    for (const device of floor.devices) {
      if (device.type === 'switch') continue;
      const capacity = normalizeDeviceCapacity(device);
      if (!capacity.networked) continue;
      endpointPorts++;
      const watts = capacity.poeWatts;
      if (watts > 0) poweredPorts++;
      poeWatts += watts;
      const candidates = links.get(device.id);
      const switchId = candidates?.size === 1 ? candidates.values().next().value : null;
      const endpoint = { device, ...context, watts, switchId };
      if (device.type === 'camera') cameras.push({
        ...endpoint, capacity,
        storageTB: recordingStorageTB(capacity.bitrateMbps, capacity.recordingPercent, retentionDays),
      });
      if (!switchId) {
        unassigned.push({ ...endpoint, reason: candidates?.size > 1 ? 'Connected to multiple switches' : 'No direct Cat6 switch route' });
        continue;
      }
      const row = switchRows.get(switchId);
      row.endpoints.push(endpoint);
      row.poeWatts += watts;
      if (watts > 0) row.poweredPorts++;
      if (watts > row.capacity.poePerPortWatts) row.highPowerIds.push(device.id);
    }

    for (const row of switchRows.values()) {
      const usedPorts = row.endpoints.length + row.uplinks;
      const limits = [];
      if (usedPorts > row.capacity.copperPorts) limits.push('Copper ports');
      if (row.poweredPorts > row.capacity.poePorts) limits.push('PoE ports');
      if (row.poeWatts - row.capacity.poeBudgetWatts > 1e-8) limits.push('Total PoE watts');
      if (row.highPowerIds.length) limits.push('Per-port PoE');
      switches.push({ ...row, usedPorts, limits });
    }
  }

  return {
    retentionDays, cameras, switches, unassigned, endpointPorts, uplinkPorts, poweredPorts, poeWatts,
    switchPorts: endpointPorts + uplinkPorts,
    bandwidthMbps: cameras.reduce((sum, row) => sum + row.capacity.bitrateMbps, 0),
    storageTB: cameras.reduce((sum, row) => sum + row.storageTB, 0),
    unassignedPoEWatts: unassigned.reduce((sum, row) => sum + row.watts, 0),
  };
}
