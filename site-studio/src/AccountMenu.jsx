import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown, SignOut, UserCircle, UserPlus } from '@phosphor-icons/react';
import './account-menu.css';

// The account menu in the app header (story 1.3, CAP-4): the signed-in person's name and Sign out.
// A long name is cut short in the header and shown in full in the menu (E-19). Sign-out shows the
// sign-in page only once the server has confirmed it (E-6). For an administrator it also holds
// "Invite a person" (story 1.4, CAP-1, CAP-9), which loads and opens the invite panel. Later
// stories add My account and Administration.

/** What the menu says when the server did not confirm a sign-out (E-6). */
export const SIGN_OUT_NOT_CONFIRMED = 'You are still signed in. Try again.';
/** What the menu says when the invite panel's code could not be loaded. */
export const INVITE_NOT_LOADED = 'The invite panel could not be loaded. Check the connection and try again.';

export function AccountMenu({ name, role, onSignedOut }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // The invite panel's component once loaded and chosen (story 1.4); null while it is closed.
  const [InvitePanel, setInvitePanel] = useState(null);
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  const isAdministrator = role === 'administrator';

  async function openInvite() {
    setError('');
    try {
      // Loaded only when chosen, as the sign-in page is (review finding 27).
      const module = await import('./admin/InvitePanel.jsx');
      setOpen(false);
      setInvitePanel(() => module.default);
    } catch {
      setError(INVITE_NOT_LOADED);
    }
  }

  function closeInvite() {
    setInvitePanel(null);
    trigger.current?.focus();
  }

  // Opening or closing the menu clears a failed sign-out's message: it described that attempt only.
  function setMenu(next) {
    setError('');
    setOpen(next);
  }

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!root.current?.contains(event.target)) setMenu(false); };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      setMenu(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError('');
    let confirmed = false;
    try {
      // Loaded only when needed, so the prototype's bundle does not carry the sign-in client.
      const { requestSignOut } = await import('./admin/signInClient.js');
      confirmed = await requestSignOut();
    } catch {
      confirmed = false;
    }
    setBusy(false);
    if (confirmed) onSignedOut();
    else setError(SIGN_OUT_NOT_CONFIRMED);
  }

  return (
    <div className="account-menu" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="account-trigger"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Account: ${name}`}
        title={name}
        onClick={() => setMenu(!open)}
      >
        <UserCircle size={20} aria-hidden="true"/>
        <span className="account-name" data-testid="account-name">{name}</span>
        <CaretDown size={12} aria-hidden="true"/>
      </button>
      {open && (
        <div id={panelId} className="account-panel" role="group" aria-label="Account">
          <p className="account-caption">Signed in as</p>
          <p className="account-full-name" data-testid="account-full-name">{name}</p>
          {error && <p role="alert" className="account-error">{error}</p>}
          {isAdministrator && (
            <button type="button" className="account-item" onClick={openInvite}>
              <UserPlus size={18} aria-hidden="true"/>Invite a person
            </button>
          )}
          <button type="button" className="account-signout" onClick={signOut} aria-disabled={busy ? true : undefined}>
            <SignOut size={18} aria-hidden="true"/>{busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
      {InvitePanel && isAdministrator && <InvitePanel onClose={closeInvite} onSignedOut={onSignedOut}/>}
    </div>
  );
}
