export const UNDO_LIMIT = 40;
const EDIT_GROUP_MS = 750;

export function sameDesignValue(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && sameDesignValue(a[key], b[key]));
}

export function createProjectHistory({ revisions = [], ...project }) {
  return { project, revisions, past: [], future: [], group: null };
}

export function projectHistoryReducer(state, action) {
  switch (action.type) {
    case 'load':
      return action.history;
    case 'navigate':
      return state.project.activeFloorId === action.id ? state
        : { ...state, project: { ...state.project, activeFloorId: action.id }, group: null };
    case 'save-revision':
      return { ...state, revisions: [action.revision, ...state.revisions], group: null };
    case 'remove-revision':
      return { ...state, revisions: state.revisions.filter(revision => revision.id !== action.id), group: null };
    case 'edit': {
      const project = typeof action.update === 'function' ? action.update(state.project) : action.update;
      if (sameDesignValue(project, state.project)) return state;
      const prior = state.past.at(-1);
      const coalesce = prior && action.group && state.group === action.group && action.time - prior.time <= EDIT_GROUP_MS;
      const entry = { before: coalesce ? prior.before : state.project, after: project, time: action.time };
      const earlier = coalesce ? state.past.slice(0, -1) : state.past.slice(1 - UNDO_LIMIT);
      const past = sameDesignValue(entry.before, entry.after) ? earlier : [...earlier, entry];
      return { ...state, project, past, future: [], group: action.group };
    }
    case 'undo': {
      const entry = state.past.at(-1);
      if (!entry) return state;
      return { ...state, project: entry.before, past: state.past.slice(0, -1), future: [...state.future, entry], group: null };
    }
    case 'redo': {
      const entry = state.future.at(-1);
      if (!entry) return state;
      return { ...state, project: entry.after, past: [...state.past, entry], future: state.future.slice(0, -1), group: null };
    }
    default:
      return state;
  }
}
