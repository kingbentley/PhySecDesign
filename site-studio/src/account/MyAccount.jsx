import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { normaliseCode } from '../../shared/twoStep.ts';
import { readSession } from '../admin/setupState.js';
import TwoStepSetup, { Alert, CodeField, Heading, PasswordField, RecoveryCodes } from './TwoStepSetup.jsx';
import { TWO_STEP_MESSAGES, freshRecoveryCodes, readTwoStepState, recoveryCodesLeftLine, turnOffTwoStep } from './twoStepClient.js';
import './account.css';

// My account (S-29, story 1.5, spec 7; D-1): a dialog from the account menu holding only the
// "Two-step verification" section in this story (story 1.6 adds the rest). It reads the two-step
// state and the session (for the installation's name in a fresh set's file) when it opens and after
// each change; it turns two-step verification on (`TwoStepSetup`), makes fresh recovery codes and
// turns it off. Recovery codes are shown once: closing the dialog unmounts them (CAP-2).
//
// Known limit (finding 33, ruled): when fresh codes are made in two tabs, the tab whose set was
// replaced keeps showing its codes until closed; the dialog does not read again on focus.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])';
const QUIET = { message: '', at: 0 };

/** The On or Off chip: a label and a shape, never colour alone (standing rule 3). */
function StateChip({ on }) {
  return (
    <span className={on ? 'two-step-chip two-step-chip-on' : 'two-step-chip two-step-chip-off'} data-testid="two-step-chip" data-state={on ? 'on' : 'off'}>
      {on ? (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M4.5 8.2l2.3 2.3 4.7-4.8" fill="none" stroke="#fff" strokeWidth="2"/></svg>
      ) : (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      )}
      {on ? 'On' : 'Off'}
    </span>
  );
}

/** "Make fresh recovery codes": the password and a current code (CA-13). */
function FreshCodesForm({ email, onCodes, onCancel, onSignedOut }) {
  const passwordRef = useRef(null);
  const codeRef = useRef(null);
  const [values, setValues] = useState({ password: '', code: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(QUIET);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  useLayoutEffect(() => { passwordRef.current?.focus(); }, []);

  const change = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
  };

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const found = {};
    if (values.password.length === 0) found.password = TWO_STEP_MESSAGES.passwordField;
    const code = normaliseCode(values.code);
    if (code === null) found.code = TWO_STEP_MESSAGES.codeField;
    setErrors(found);
    if (found.password) { passwordRef.current?.focus(); return; }
    if (found.code) { codeRef.current?.focus(); return; }
    inFlight.current = true;
    setSending(true);
    setAlert(QUIET);
    let result;
    try {
      result = await freshRecoveryCodes({ password: values.password, code });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    if (result.kind === 'codes') return onCodes(result.codes);
    if (result.kind === 'signedOut') return onSignedOut();
    if (result.kind === 'field') {
      setErrors({ [result.field]: result.field === 'code' ? TWO_STEP_MESSAGES.codeField : TWO_STEP_MESSAGES.passwordField });
      (result.field === 'code' ? codeRef : passwordRef).current?.focus();
      return;
    }
    setAlert({ message: result.message, at: Date.now() });
  }

  return (
    <div className="two-step-step" data-step="fresh">
      <Heading level={4} className="two-step-heading">Make fresh recovery codes</Heading>
      <p className="two-step-text">Your current recovery codes stop working.</p>
      <Alert alert={alert}/>
      <form className="two-step-form" noValidate onSubmit={submit}>
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden/>
        <PasswordField id="two-step-fresh-password" value={values.password} onChange={change('password')} error={errors.password} inputRef={passwordRef}/>
        <CodeField id="two-step-fresh-code" value={values.code} onChange={change('code')} error={errors.code} inputRef={codeRef}/>
        <div className="two-step-row">
          <button type="submit" className="two-step-button" aria-disabled={sending ? true : undefined}>Make fresh codes</button>
          {/* Nothing while the request is in flight: leaving would lose codes the server made. */}
          <button type="button" className="two-step-secondary" onClick={() => { if (!inFlight.current) onCancel(); }} aria-disabled={sending ? true : undefined}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/** "Turn off two-step verification": the password (CAP-7). */
function TurnOffForm({ email, onOff, onCancel, onSignedOut }) {
  const passwordRef = useRef(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(QUIET);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  useLayoutEffect(() => { passwordRef.current?.focus(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    if (password.length === 0) {
      setError(TWO_STEP_MESSAGES.passwordField);
      passwordRef.current?.focus();
      return;
    }
    setError('');
    inFlight.current = true;
    setSending(true);
    setAlert(QUIET);
    let result;
    try {
      result = await turnOffTwoStep({ password });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    if (result.kind === 'off') return onOff();
    if (result.kind === 'signedOut') return onSignedOut();
    if (result.kind === 'field') {
      setError(TWO_STEP_MESSAGES.passwordField);
      passwordRef.current?.focus();
      return;
    }
    setAlert({ message: result.message, at: Date.now() });
  }

  return (
    <div className="two-step-step" data-step="turn-off">
      <Heading level={4} className="two-step-heading">Turn off two-step verification</Heading>
      <p className="two-step-text">Signing in will need only your password, and your recovery codes stop working.</p>
      <Alert alert={alert}/>
      <form className="two-step-form" noValidate onSubmit={submit}>
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden/>
        <PasswordField id="two-step-off-password" value={password} onChange={(value) => { setPassword(value); setError(''); }} error={error} inputRef={passwordRef}/>
        <div className="two-step-row">
          <button type="submit" className="two-step-button" aria-disabled={sending ? true : undefined}>Turn off</button>
          <button type="button" className="two-step-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/** The section's resting view: the chip and what can be done, by the state read (D-21). */
function Overview({ state, notice, onTurnOn, onFresh, onTurnOff }) {
  const { enabled, recoveryCodesRemaining, availability } = state;
  return (
    <div className="two-step-overview">
      <StateChip on={enabled}/>
      {notice && <p className="two-step-notice" role="status">{notice}</p>}
      {availability === 'no_key' && <p className="two-step-text" data-testid="two-step-availability">{TWO_STEP_MESSAGES.noKey}</p>}
      {availability === 'key_mismatch' && (
        <>
          <p className="two-step-text" data-testid="two-step-availability">{TWO_STEP_MESSAGES.mismatch}</p>
          {enabled && <p className="two-step-text">{TWO_STEP_MESSAGES.recoveryStillWorks}</p>}
        </>
      )}
      {!enabled && availability === 'available' && (
        <>
          <p className="two-step-text">
            After your password, signing in will also ask for a code from an authenticator app on your phone, so a stolen password alone is not enough.
          </p>
          <div className="two-step-row">
            <button type="button" className="two-step-button" onClick={onTurnOn}>Turn on two-step verification</button>
          </div>
        </>
      )}
      {enabled && (
        <>
          <p className="two-step-text" data-testid="two-step-count">{recoveryCodesLeftLine(recoveryCodesRemaining)}</p>
          <div className="two-step-row">
            {availability === 'available' && <button type="button" className="two-step-secondary" onClick={onFresh}>Make fresh recovery codes</button>}
            <button type="button" className="two-step-secondary" onClick={onTurnOff}>Turn off two-step verification</button>
          </div>
        </>
      )}
    </div>
  );
}

/** The dialog. `onClose` closes it and returns focus to the menu trigger; `onSignedOut` shows the sign-in page. */
export default function MyAccount({ onClose, onSignedOut }) {
  const headingId = useId();
  const sectionId = useId();
  const dialog = useRef(null);
  const dialogHeading = useRef(null);
  const sectionHeading = useRef(null);
  // 'loading', 'failed', 'overview', 'setup', 'fresh', 'codes' or 'off'.
  const [view, setView] = useState('loading');
  // The two-step state and the installation's name, as last read.
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState('');
  // A fresh set, shown once; dropped when the view changes or the dialog closes.
  const [codes, setCodes] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const live = useRef(true);
  const generation = useRef(0);
  // The latest callback, so a parent's re-render never reads the state again.
  const signedOut = useRef(onSignedOut);
  signedOut.current = onSignedOut;

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  /** Reads the state and the session; answers true when the overview is shown. */
  const load = useCallback(async () => {
    const mine = ++generation.current;
    const [state, session] = await Promise.all([readTwoStepState(), readSession()]);
    if (!live.current || mine !== generation.current) return false;
    if (state.kind === 'signedOut' || session.kind === 'signedOut') { signedOut.current(); return false; }
    // The installation's name goes into a fresh set's file, so a session read without one fails.
    const ok = state.kind === 'state' && session.kind === 'signedIn' && typeof session.installationName === 'string';
    if (ok) setData({ state: state.state, installationName: session.installationName });
    setView(ok ? 'overview' : 'failed');
    return ok;
  }, []);

  // Focus moves into the dialog in the same task that shows it (a layout effect): the dialog
  // appears after its code has loaded, not straight from the click.
  useLayoutEffect(() => { dialogHeading.current?.focus(); }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function keydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll(FOCUSABLE)].filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = dialog.current.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || !inside)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !inside)) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keydown, true);
    return () => document.removeEventListener('keydown', keydown, true);
  }, [onClose]);

  /** Back to the overview after a change or a cancel: the state is read again. */
  function backToOverview(nextNotice = '') {
    setCodes(null);
    setNotice(nextNotice);
    setView('loading');
    // The button that had focus is about to go: the section heading, which stays, takes it now,
    // once (the read below moves no focus, so nothing chosen while it runs is taken away).
    sectionHeading.current?.focus();
    load();
  }

  async function retry(event) {
    if (retrying) return;
    const button = event.currentTarget;
    setRetrying(true);
    let ok = false;
    try { ok = await load(); } finally { if (live.current) setRetrying(false); }
    // Try again goes only when the overview is shown; focus then moves to the section heading,
    // and only if it is still on that button or fell to the page as the button went (not if the
    // person has moved it since).
    const active = document.activeElement;
    if (ok && live.current && (active === button || active === document.body || active === null)) sectionHeading.current?.focus();
  }

  function start(next) {
    setNotice('');
    setView(next);
  }

  let body = null;
  if (view === 'failed') {
    body = (
      <>
        <p className="two-step-text" data-testid="two-step-load-failed">{TWO_STEP_MESSAGES.loadFailed}</p>
        <div className="two-step-row">
          <button type="button" className="two-step-button" onClick={retry} aria-disabled={retrying ? true : undefined}>Try again</button>
        </div>
      </>
    );
  } else if (view === 'overview' && data) {
    body = (
      <Overview
        state={data.state} notice={notice}
        onTurnOn={() => start('setup')} onFresh={() => start('fresh')} onTurnOff={() => start('off')}
      />
    );
  } else if (view === 'setup' && data) {
    body = (
      <TwoStepSetup
        email={data.state.email} headingLevel={4} doneLabel="I have saved my codes"
        onDone={() => backToOverview()} onCancel={() => backToOverview()} onSignedOut={onSignedOut}
      />
    );
  } else if (view === 'fresh' && data) {
    body = <FreshCodesForm email={data.state.email} onCodes={(fresh) => { setCodes(fresh); setView('codes'); }} onCancel={() => backToOverview()} onSignedOut={onSignedOut}/>;
  } else if (view === 'codes' && codes && data) {
    body = (
      <RecoveryCodes
        codes={codes} installationName={data.installationName} email={data.state.email}
        headingLevel={4} doneLabel="I have saved my codes" onDone={() => backToOverview()}
      />
    );
  } else if (view === 'off' && data) {
    body = <TurnOffForm email={data.state.email} onOff={() => backToOverview(TWO_STEP_MESSAGES.turnedOff)} onCancel={() => backToOverview()} onSignedOut={onSignedOut}/>;
  }

  // Drawn on the document's body, outside the app header, so no header style reaches it.
  return createPortal(
    // A press on the backdrop does not close the dialog (Escape and Close do, as the spec rules).
    <div className="my-account-backdrop">
      <div ref={dialog} className="my-account-panel" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <div className="my-account-header">
          <h2 id={headingId} ref={dialogHeading} tabIndex={-1}>My account</h2>
          <button type="button" className="my-account-close" onClick={onClose}><X size={18} aria-hidden="true"/>Close</button>
        </div>
        <section className="two-step-section" aria-labelledby={sectionId} aria-busy={view === 'loading' ? true : undefined}>
          <h3 id={sectionId} ref={sectionHeading} tabIndex={-1} className="two-step-section-heading">Two-step verification</h3>
          {body}
        </section>
      </div>
    </div>,
    document.body,
  );
}
