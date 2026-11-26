import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown, SignOut, UserCircle, UserGear, UserPlus } from '@phosphor-icons/react';
import './account-menu.css';

// The account menu in the app header (story 1.3, CAP-4): the signed-in person's name and Sign out.
// A long name is cut short in the header and shown in full in the menu (E-19). Sign-out shows the
// sign-in page only once the server has confirmed it (E-6). For every signed-in person it holds
// "My account" (story 1.5, D-1), which loads and opens the My account dialog; for an administrator
// also "Invite a person" (story 1.4, CAP-1, CAP-9), which loads and opens the invite panel. Later
// stories add Administration.

/** What the menu says when the server did not confirm a sign-out (E-6). */
export const SIGN_OUT_NOT_CONFIRMED = 'You are still signed in. Try again.';
/** What the menu says when the invite panel's code could not be loaded. */
export const INVITE_NOT_LOADED = 'The invite panel could not be loaded. Check the connection and try again.';
/** What the menu says when My account's code could not be loaded (the dialog's own load-failure text, D-21). */
export const MY_ACCOUNT_NOT_LOADED = 'Two-step verification could not be loaded. Check the connection and try again.';

export function AccountMenu({ name, role, onSignedOut }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // The invite panel's component once loaded and chosen (story 1.4); null while it is closed.
  const [InvitePanel, setInvitePanel] = useState(null);
  // The My account dialog's component once loaded and chosen (story 1.5); null while it is closed.
  const [MyAccount, setMyAccount] = useState(null);
  const root = useRef(null);
  const trigger = useRef(null);
  // The latest dialog request: each choice of My account or Invite a person takes the next number,
  // and closing the menu takes one too, so only the latest choice still loading may open its
  // dialog, and none once the menu was dismissed (pull request 13, review round 1).
  const request = useRef(0);
  const panelId = useId();
  const isAdministrator = role === 'administrator';

  async function openInvite() {
    setError('');
    const mine = ++request.current;
    try {
      // Loaded only when chosen, as the sign-in page is (review finding 27).
      const module = await import('./admin/InvitePanel.jsx');
      if (mine !== request.current) return;
      setOpen(false);
      setInvitePanel(() => module.default);
    } catch {
      if (mine === request.current) setError(INVITE_NOT_LOADED);
    }
  }

  function closeInvite() {
    setInvitePanel(null);
    trigger.current?.focus();
  }

  async function openMyAccount() {
    setError('');
    const mine = ++request.current;
    try {
      // Loaded only when chosen, as the invite panel is.
      const module = await import('./account/MyAccount.jsx');
      if (mine !== request.current) return;
      setOpen(false);
      setMyAccount(() => module.default);
    } catch {
      if (mine === request.current) setError(MY_ACCOUNT_NOT_LOADED);
    }
  }

  function closeMyAccount() {
    setMyAccount(null);
    trigger.current?.focus();
  }

  // Opening or closing the menu clears a failed sign-out's message: it described that attempt only.
  function setMenu(next) {
    setError('');
    // Closing the menu (Escape, a press outside, the trigger) cancels a dialog still loading.
    if (!next) request.current += 1;
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
          <button type="button" className="account-item" onClick={openMyAccount}>
            <UserGear size={18} aria-hidden="true"/>My account
          </button>
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
      {MyAccount && <MyAccount onClose={closeMyAccount} onSignedOut={onSignedOut}/>}
    </div>
  );
}
