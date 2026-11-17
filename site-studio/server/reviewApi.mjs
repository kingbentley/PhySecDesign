import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  COMMENT_LIMIT, COMMENT_MAX_LENGTH, DECISION_LABELS, normalizeReviewRevision,
  REVIEW_ID, REVIEW_MAX_BYTES, REVIEW_TOKEN, REVIEWER_LIMIT,
} from '../src/reviewModel.js';

const API_PREFIX = '/api/reviews/';
const MATCH_ROUTE = /^\/api\/reviews\/([a-f0-9]{32})(?:\/(invite|refresh-link|revoke|comments|decision))?$/;

class ReviewError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const unavailable = () => new ReviewError(404, 'This review link is unavailable or has been revoked.');
const bad = message => new ReviewError(400, message);
const hex = count => randomBytes(count).toString('hex');
const digest = token => createHash('sha256').update(token).digest('hex');
const matches = (a, b) => timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

function requiredText(value, label, max) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > max) throw bad(`${label} must contain 1 to ${max} characters.`);
  return text;
}

async function readBody(request, limit) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) throw bad('Send JSON review data.');
  if (Number(request.headers['content-length']) > limit) throw new ReviewError(413, 'This review package is too large.');
  const parts = [];
  let bytes = 0;
  for await (const part of request.iterator({ destroyOnReturn: false })) {
    bytes += part.length;
    if (bytes > limit) throw new ReviewError(413, 'This review package is too large.');
    parts.push(part);
  }
  try {
    const value = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw bad('The review request is invalid.');
  }
}

function respond(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function actorFor(room, key) {
  if (matches(room.ownerHash, key)) return { role: 'owner' };
  const reviewer = room.reviewers.find(item => !item.revokedAt && matches(item.keyHash, key));
  if (!reviewer) throw unavailable();
  return { role: 'reviewer', reviewer };
}

function roomView(room, actor, design) {
  const owner = actor.role === 'owner';
  const names = new Map(room.reviewers.map(reviewer => [reviewer.id, reviewer.name]));
  const decisions = room.decisions.filter(decision => owner || decision.reviewerId === actor.reviewer.id)
    .map(decision => ({ ...decision, name: names.get(decision.reviewerId) }));
  return {
    id: room.id, revision: { ...room.revision, ...(design ? { design } : {}) }, version: room.version, role: actor.role, decisions,
    comments: room.comments.map(({ submissionId, ...comment }) => ({ ...comment, name: names.get(comment.reviewerId) })),
    ...(owner ? { reviewers: room.reviewers.map(({ id, name, email, invitedAt, revokedAt }) => ({ id, name, email, invitedAt, revokedAt })) }
      : { reviewer: { id: actor.reviewer.id, name: actor.reviewer.name } }),
  };
}

function mutate(room, actor, action, body) {
  const now = Date.now();
  if (action === 'invite') {
    if (room.reviewers.length >= REVIEWER_LIMIT) throw bad(`A review supports up to ${REVIEWER_LIMIT} reviewers.`);
    const name = requiredText(body.name, 'Reviewer name', 80);
    const email = requiredText(body.email, 'Reviewer email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Enter a reviewer email address.');
    if (room.reviewers.some(item => item.email === email)) throw bad('This reviewer is already in the review. Use New link to send another invitation.');
    const token = hex(32);
    const reviewer = { id: hex(16), name, email, keyHash: digest(token), invitedAt: now };
    room.reviewers.push(reviewer);
    return { changed: true, invitation: { reviewerId: reviewer.id, name, token } };
  }
  if (action === 'refresh-link' || action === 'revoke') {
    const reviewer = room.reviewers.find(item => item.id === body.reviewerId);
    if (!reviewer) throw bad('Choose a reviewer in this review.');
    if (action === 'revoke') {
      if (reviewer.revokedAt) return { changed: false };
      reviewer.revokedAt = now;
      return { changed: true };
    }
    const token = hex(32);
    reviewer.keyHash = digest(token);
    delete reviewer.revokedAt;
    return { changed: true, invitation: { reviewerId: reviewer.id, name: reviewer.name, token } };
  }
  if (action === 'comments') {
    if (typeof body.id !== 'string' || !REVIEW_ID.test(body.id)) throw bad('The comment ID is invalid.');
    const reviewerId = actor.reviewer.id;
    if (room.comments.some(comment => comment.submissionId === body.id && comment.reviewerId === reviewerId)) return { changed: false };
    if (room.comments.length >= COMMENT_LIMIT) throw bad('This review has reached its comment limit.');
    if (!room.floorIds.includes(body.floorId)) throw bad('Choose a floor in this revision.');
    const { u, v } = body;
    if (![u, v].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) throw bad('Choose a position on the floor plan.');
    room.comments.push({
      id: hex(16), submissionId: body.id, number: room.comments.length + 1, reviewerId,
      floorId: body.floorId, u, v, text: requiredText(body.text, 'Comment', COMMENT_MAX_LENGTH), createdAt: now,
    });
    return { changed: true };
  }
  if (typeof body.status !== 'string' || !Object.hasOwn(DECISION_LABELS, body.status)) throw bad('Choose a review decision.');
  const reviewerId = actor.reviewer.id;
  if (room.decisions.findLast(decision => decision.reviewerId === reviewerId)?.status === body.status) return { changed: false };
  if (room.decisions.length >= 200) throw bad('This review has reached its decision history limit.');
  room.decisions.push({ id: hex(16), reviewerId, status: body.status, createdAt: now });
  return { changed: true };
}

/** One data directory per running Site Studio server. Writes to a review are serialized and replaced atomically. */
export function createReviewApi({ directory }) {
  const pending = new Map();
  const metadataPath = id => join(directory, id + '.json');
  const designPath = id => join(directory, id + '.design.json');

  async function readRoom(id) {
    try { return JSON.parse(await readFile(metadataPath(id), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }

  const readDesign = async id => JSON.parse(await readFile(designPath(id), 'utf8'));

  async function writeJson(path, value) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = path + '.' + hex(8) + '.tmp';
    try {
      await writeFile(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
      await rename(temporary, path);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async function serial(id, operation) {
    const next = (pending.get(id) ?? Promise.resolve()).catch(() => {}).then(operation);
    pending.set(id, next);
    try { return await next; }
    finally { if (pending.get(id) === next) pending.delete(id); }
  }

  async function handle(request, response, pathname) {
    const route = pathname.match(MATCH_ROUTE);
    if (!route) throw unavailable();
    const [, id, action] = route;
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!REVIEW_TOKEN.test(token)) throw unavailable();
    const key = digest(token);

    if (request.method === 'GET' && !action) {
      const room = await readRoom(id);
      if (!room) throw unavailable();
      const actor = actorFor(room, key);
      const version = new URLSearchParams(request.url.split('?')[1]).get('version');
      const design = version === null ? await readDesign(id) : undefined;
      respond(response, 200, version === String(room.version) ? { unchanged: true } : { room: roomView(room, actor, design) });
      return;
    }
    if (request.method !== 'POST') throw new ReviewError(405, 'This review action is unavailable.');

    const result = await serial(id, async () => {
      const room = await readRoom(id);
      if (!action) {
        if (room) {
          if (!matches(room.ownerHash, key)) throw unavailable();
          request.resume();
          return { room: roomView(room, { role: 'owner' }, await readDesign(id)) };
        }
        const { revision: rawRevision } = await readBody(request, REVIEW_MAX_BYTES);
        let snapshot;
        try { snapshot = normalizeReviewRevision(rawRevision); }
        catch { throw bad('The named revision or one of its floor drawings is invalid.'); }
        const { design, ...revision } = snapshot;
        const created = { id, revision, floorIds: design.floors.map(floor => floor.id),
          ownerHash: key, version: 0, reviewers: [], comments: [], decisions: [] };
        await writeJson(designPath(id), design);
        await writeJson(metadataPath(id), created);
        return { room: roomView(created, { role: 'owner' }, design) };
      }
      if (!room) throw unavailable();
      const actor = actorFor(room, key);
      const allowed = actor.role === 'owner' ? ['invite', 'refresh-link', 'revoke'] : ['comments', 'decision'];
      if (!allowed.includes(action)) throw new ReviewError(403, 'This link does not have permission for that action.');
      const body = await readBody(request, 16 * 1024);
      const { changed, invitation } = mutate(room, actor, action, body);
      if (changed) {
        room.version += 1;
        await writeJson(metadataPath(id), room);
      }
      return { room: roomView(room, actor), ...(invitation ? { invitation } : {}) };
    });
    respond(response, 200, result);
  }

  return function reviewApi(request, response, next) {
    const pathname = (request.url ?? '').split('?')[0];
    if (!pathname.startsWith(API_PREFIX)) { next(); return; }
    handle(request, response, pathname).catch(error => {
      request.resume();
      if (response.destroyed) return;
      if (error instanceof ReviewError) respond(response, error.status, { error: error.message });
      else respond(response, 500, { error: 'The review service could not save or load this review.' });
    });
  };
}
