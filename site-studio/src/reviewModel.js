import { exportPortableProject, MAX_REVISION_NAME, normalizeProject } from './projectModel.js';

export const REVIEW_MAX_BYTES = 64 * 1024 * 1024;
export const REVIEWER_LIMIT = 20;
export const COMMENT_LIMIT = 500;
export const COMMENT_MAX_LENGTH = 2000;
export const REVIEW_ID = /^[a-f0-9]{32}$/;
export const REVIEW_TOKEN = /^[a-f0-9]{64}$/;
export const DECISION_LABELS = { approved: 'Approved', 'changes-requested': 'Changes requested' };

export function normalizeReviewRevision(revision, allowLocalAssets = false) {
  const { id, savedAt, design } = revision ?? {};
  const name = typeof revision?.name === 'string' ? revision.name.trim().slice(0, MAX_REVISION_NAME) : '';
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(id) || !name ||
    !Number.isInteger(savedAt) || savedAt < 0 || savedAt > 8640000000000000 || design?.version !== 2) {
    throw new Error('Choose a named project revision.');
  }
  const clean = normalizeProject({
    format: design.format, version: design.version, id: design.id, name: design.name,
    activeFloorId: design.activeFloorId, buildings: design.buildings,
    floors: design.floors.map(floor => ({
      id: floor.id, buildingId: floor.buildingId, name: floor.name, plan: floor.plan,
      devices: floor.devices.map(device => {
        const { id, type, name, lat, lng, status, bearing } = device;
        return { id, type, name, lat, lng, status, bearing };
      }),
      routes: floor.routes, barriers: floor.barriers, zones: floor.zones,
    })),
  }, { allowLocalAssets });
  return { id, name, savedAt, design: {
    id: clean.id, name: clean.name, format: clean.format, version: clean.version, activeFloorId: clean.activeFloorId,
    buildings: clean.buildings,
    floors: clean.floors.map(({ id, buildingId, name, plan, devices, routes, barriers, zones }) => ({
      id, buildingId, name, plan, routes, barriers, zones,
      devices: devices.map(({ id, type, name, lat, lng, status, bearing }) => ({ id, type, name, lat, lng, status, bearing })),
    })),
  } };
}

export async function prepareReviewRevision(revision) {
  const clean = normalizeReviewRevision(revision, true);
  const portable = await exportPortableProject(clean.design);
  return normalizeReviewRevision({ ...clean, design: portable });
}
