// The invitation link's address (story 1.4, D-1, D-8; review finding 3). `main.jsx` imports this
// module first, so it runs before any other module of the app and before any read: at `/invite`
// or `/invite/` it takes the fragment (the invitation's secret) into memory and replaces the
// address with the bare path, so the secret is gone from the address bar on every page that may
// follow (set-up open, "cannot be checked", no server). The secret is kept in this module's memory
// only, never in storage; a reload finds no fragment and the page asks to open the link again.
//
// No imports, so the prototype's bundle carries nothing of the invitation page.

/** True for the invitation page's address, with or without a trailing slash. */
export function isInvitePath(pathname) {
  return pathname === '/invite' || pathname === '/invite/';
}

let secret = null;

if (typeof location !== 'undefined' && isInvitePath(location.pathname)) {
  const fragment = location.hash;
  secret = fragment.length > 1 ? fragment.slice(1) : null;
  history.replaceState(history.state, '', location.pathname);
}

// Opening another invitation link in a tab already at /invite changes only the fragment, so the
// page does not load again: reload it, and this module then takes and removes the new secret.
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    if (isInvitePath(location.pathname) && location.hash.length > 1) location.reload();
  });
}

/** The secret taken from the address when the page started, or null when there was none. */
export function invitationSecret() {
  return secret;
}
