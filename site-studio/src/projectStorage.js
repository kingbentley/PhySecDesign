import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createDemoProject, normalizeProject } from './projectModel.js';
import { createProjectHistory, projectHistoryReducer } from './projectHistory.js';

/** One local draft. IndexedDB stores embedded raster/PDF sheets without localStorage limits. */
export function createIndexedDbAdapter({ indexedDB = globalThis.indexedDB, databaseName = 'physec-site-studio' } = {}) {
  let connection;
  function open() {
    if (!indexedDB) return Promise.reject(new Error('This browser does not support local project storage.'));
    if (!connection) {
      connection = new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('drafts')) request.result.createObjectStore('drafts');
        };
        request.onerror = () => reject(request.error || new Error('Could not open local project storage.'));
        request.onblocked = () => reject(new Error('Local project storage is blocked by another open tab. Close it and reload.'));
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); connection = undefined; };
          resolve(db);
        };
      }).catch(error => { connection = undefined; throw error; });
    }
    return connection;
  }
  async function transaction(mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let result;
      const tx = db.transaction('drafts', mode);
      const request = operation(tx.objectStore('drafts'));
      request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || request.error || new Error('Could not access the local project draft.'));
      tx.onabort = () => reject(tx.error || request.error || new Error('The local project save was interrupted.'));
    });
  }
  return {
    read: () => transaction('readonly', store => store.get('current')),
    write: project => transaction('readwrite', store => store.put(project, 'current')),
  };
}

/** Serial writes prevent an older, slower save from replacing newer project changes. */
export function createProjectPersistence(adapter = createIndexedDbAdapter()) {
  let loadPromise;
  let writeQueue = Promise.resolve();
  function load() {
    if (!loadPromise) {
      loadPromise = Promise.resolve().then(() => adapter.read()).then(data =>
        data == null ? null : normalizeProject(data, { allowLocalAssets: true }));
    }
    return loadPromise;
  }
  function save(project) {
    let snapshot;
    try { snapshot = normalizeProject(project, { allowLocalAssets: true }); }
    catch (error) { return Promise.reject(error); }
    const next = writeQueue.catch(() => {}).then(async () => {
      await load(); // A failed initial read must never overwrite the unread draft.
      await adapter.write(snapshot);
      return snapshot;
    });
    writeQueue = next;
    return next;
  }
  return { load, save, flush: () => writeQueue };
}

/**
 * Saves only after restoration has completed. Callers use ordinary immutable
 * setProject updates; ready=false should gate edits until the initial read ends.
 */
export function useProjectStore(initial = createDemoProject) {
  const [{ project, revisions, past, future }, dispatch] = useReducer(projectHistoryReducer, initial,
    value => createProjectHistory(typeof value === 'function' ? value() : value));
  const setProject = useCallback((update, group = null) => dispatch({ type: 'edit', update, group, time: Date.now() }), []);
  const replaceProject = useCallback(value => dispatch({ type: 'load', history: createProjectHistory(value) }), []);
  const setActiveFloor = useCallback(id => dispatch({ type: 'navigate', id }), []);
  const addRevision = useCallback(revision => dispatch({ type: 'save-revision', revision }), []);
  const removeRevision = useCallback(id => dispatch({ type: 'remove-revision', id }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const [persistence] = useState(() => createProjectPersistence());
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('loading');
  const [error, setError] = useState('');
  const [readFailed, setReadFailed] = useState(false);
  const lastSaved = useRef(null);
  const saveSequence = useRef(0);

  useEffect(() => {
    let active = true;
    persistence.load().then(stored => {
      if (!active) return;
      if (stored) {
        const history = createProjectHistory(stored);
        lastSaved.current = history;
        dispatch({ type: 'load', history });
      }
      setReady(true);
      setSaveStatus(stored ? 'saved' : 'saving');
    }).catch(cause => {
      if (!active) return;
      setReadFailed(true);
      setError('Could not restore the local draft. ' + (cause?.message || 'Export your current work before reloading.'));
      setSaveStatus('error');
      setReady(true);
    });
    return () => { active = false; };
  }, [persistence]);

  useEffect(() => {
    if (!ready || readFailed) return;
    if (project === lastSaved.current?.project && revisions === lastSaved.current?.revisions) {
      setSaveStatus('saved');
      setError('');
      return;
    }
    const sequence = ++saveSequence.current;
    setSaveStatus('saving');
    setError('');
    let active = true;
    const timer = setTimeout(() => {
      // A queued write can supersede the previous disk state, even if the next edit undoes it.
      lastSaved.current = null;
      persistence.save({ ...project, revisions }).then(() => {
        if (!active || sequence !== saveSequence.current) return;
        lastSaved.current = { project, revisions };
        setSaveStatus('saved');
      }).catch(cause => {
        if (!active || sequence !== saveSequence.current) return;
        setError('Local save failed. Export your project to keep changes. ' + (cause?.message || ''));
        setSaveStatus('error');
      });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [project, revisions, ready, readFailed, persistence]);

  return {
    project, revisions, setProject, replaceProject, setActiveFloor, addRevision, removeRevision,
    undo, redo, undoTarget: past.at(-1)?.before, redoTarget: future.at(-1)?.after, ready, saveStatus, error,
  };
}
