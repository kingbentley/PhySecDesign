import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown, SignOut, UserCircle } from '@phosphor-icons/react';
import './account-menu.css';

// The account menu in the app header (story 1.3, CAP-4): the signed-in person's name and Sign out.
// A long name is cut short in the header and shown in full in the menu (E-19). Sign-out shows the
// sign-in page only once the server has confirmed it (E-6). Later stories add the role,
// My account and Administration.

/** What the menu says when the server did not confirm a sign-out (E-6). */
export const SIGN_OUT_NOT_CONFIRMED = 'You are still signed in. Try again.';

export function AccountMenu({ name, onSignedOut }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
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
        title={name}
        onClick={() => setOpen((value) => !value)}
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
          <button type="button" className="account-signout" onClick={signOut} aria-disabled={busy ? true : undefined}>
            <SignOut size={18} aria-hidden="true"/>{busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
