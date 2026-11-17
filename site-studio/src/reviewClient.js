import { useEffect, useRef, useState } from 'react';
import { REVIEW_ID, REVIEW_MAX_BYTES, REVIEW_TOKEN } from './reviewModel.js';

const keyFor = (projectId, revisionId) => 'physec-review-owner:' + projectId + ':' + revisionId;

export function randomReviewHex(length) {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(length)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function loadReviewOwner(projectId, revisionId) {
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(projectId, revisionId)));
    if (value && typeof value.id === 'string' && typeof value.token === 'string' && REVIEW_ID.test(value.id) && REVIEW_TOKEN.test(value.token)) return value;
  } catch {}
  return null;
}

export function getOrCreateReviewOwner(projectId, revisionId) {
  const owner = loadReviewOwner(projectId, revisionId) ?? { id: randomReviewHex(16), token: randomReviewHex(32) };
  try { localStorage.setItem(keyFor(projectId, revisionId), JSON.stringify(owner)); }
  catch { throw new Error('This browser must allow local storage to keep the review owner key.'); }
  return owner;
}

export function readReviewLink(hash) {
  if (!hash.startsWith('#review=')) return null;
  const [id, token, extra] = hash.slice('#review='.length).split('.');
  return extra === undefined && REVIEW_ID.test(id ?? '') && REVIEW_TOKEN.test(token ?? '') ? { id, token } : {};
}

export function makeReviewLink(id, token) {
  const url = new URL(location.pathname, location.origin);
  url.hash = 'review=' + id + '.' + token;
  return url.href;
}

export async function reviewRequest(access, action, body, { version, signal } = {}) {
  const path = '/api/reviews/' + access.id + (action ? '/' + action : '');
  const url = version === undefined ? path : path + '?version=' + encodeURIComponent(version);
  const headers = { Authorization: 'Bearer ' + access.token, Accept: 'application/json' };
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
    if (!action && new Blob([payload]).size > REVIEW_MAX_BYTES) throw new Error('This revision exceeds the 64 MB review limit. Reduce the size of its drawings, then save a new revision.');
  }
  const response = await fetch(url, { method: payload === undefined ? 'GET' : 'POST', headers, body: payload, signal, cache: 'no-store' });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('This address does not have the review service. Use the local Site Studio server.');
  }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'The review action failed.'), { status: response.status });
  return result;
}

export function useReviewSession(access) {
  const [room, setRoom] = useState(null);
  const [loadError, setLoadError] = useState('');
  const latest = useRef(null);
  const expired = useRef(false);

  function accept(next, resetAccess = false) {
    if (expired.current && !resetAccess) return;
    if (resetAccess) expired.current = false;
    const previous = latest.current;
    if (previous?.id === next.id && previous.version > next.version) return;
    const design = next.revision.design ?? (previous?.id === next.id ? previous.revision.design : null);
    if (!design) return;
    const value = { ...next, revision: { ...next.revision, design } };
    latest.current = value;
    setRoom(value);
    setLoadError('');
  }

  function expireAccess() {
    expired.current = true;
    latest.current = null;
    setRoom(null);
  }

  useEffect(() => {
    if (!access?.id || !access?.token) return;
    expired.current = false;
    const controller = new AbortController();
    let timer;
    async function refresh() {
      try {
        const value = await reviewRequest(access, null, undefined, { version: latest.current?.version, signal: controller.signal });
        if (controller.signal.aborted) return;
        if (value.room) accept(value.room);
        else setLoadError('');
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause.status === 404) expireAccess();
        setLoadError(cause.message || 'Could not connect to the review service.');
        if (cause.status === 404) return;
      }
      if (!controller.signal.aborted) timer = setTimeout(refresh, 3500);
    }
    refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [access]);

  async function act(action, body) {
    try {
      const result = await reviewRequest(access, action, body);
      accept(result.room);
      return result.invitation;
    } catch (cause) {
      if (cause.status === 404) { expireAccess(); setLoadError(cause.message); }
      throw cause;
    }
  }

  return { room, loadError, accept, act };
}
