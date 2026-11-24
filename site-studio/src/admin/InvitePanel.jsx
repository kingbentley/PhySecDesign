import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { INVITE_FIELDS, submitInvite } from './invitationClient.js';
import { INVITE_FIELD_MESSAGES, checkInviteFields, expirySentence } from './invitationRules.js';
import './invitation.css';

// The invite panel (S-30 without its projects list, story 1.4, CAP-1, D-9, D-11). Opened from an
// administrator's account menu and loaded only then. A labelled dialog: focus moves into it, Tab
// stays inside, and Escape or Close returns focus to the menu trigger (`onClose`). The link is
// shown once; closing the panel discards it (D-9).

const EMPTY = { email: '', name: '', role: 'standard' };
const COPY_FAILED = 'Select the link and copy it.';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])';

function InviteForm({ onInvited, onSignedOut }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [general, setGeneral] = useState({ message: '' });
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const refs = useRef({});
  const generalRef = useRef(null);
  // Layout effects, so focus has moved before the person can start typing (story 1.5 spec 7): the
  // panel appears once its code has loaded, and the alert once a reply has come.
  useLayoutEffect(() => { refs.current.email?.focus(); }, []);
  useLayoutEffect(() => { if (general.message) generalRef.current?.focus(); }, [general]);

  const change = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    setGeneral({ message: '' });
    const { errors: found, input } = checkInviteFields(values);
    setErrors(found);
    const first = INVITE_FIELDS.find((field) => found[field]);
    if (first) { refs.current[first]?.focus(); return; }
    inFlight.current = true;
    setSending(true);
    let result;
    try {
      result = await submitInvite(input);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    if (result.kind === 'invited') return onInvited({ name: input.name.trim(), link: result.link, expiresAt: result.expiresAt });
    if (result.kind === 'signedOut') return onSignedOut();
    if (result.kind === 'field') {
      setErrors({ [result.field]: result.message ?? INVITE_FIELD_MESSAGES[result.field] });
      refs.current[result.field]?.focus();
      return;
    }
    setGeneral({ message: result.message });
  }

  const describedBy = (field) => (errors[field] ? `invite-${field}-error` : undefined);
  const fieldError = (field) => errors[field] && <p id={`invite-${field}-error`} className="invite-field-error">{errors[field]}</p>;

  return (
    <form className="invite-form" noValidate onSubmit={submit}>
      <div className="invite-field">
        <label htmlFor="invite-email">Email</label>
        <input
          id="invite-email" type="email" autoComplete="off" spellCheck={false} autoCapitalize="none"
          ref={(element) => { refs.current.email = element; }}
          value={values.email} onChange={change('email')}
          aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy('email')}
        />
        {fieldError('email')}
      </div>
      <div className="invite-field">
        <label htmlFor="invite-name">Name</label>
        <input
          id="invite-name" type="text" autoComplete="off"
          ref={(element) => { refs.current.name = element; }}
          value={values.name} onChange={change('name')}
          aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy('name')}
        />
        {fieldError('name')}
      </div>
      <fieldset className="invite-role" aria-describedby={describedBy('role')}>
        <legend>Role</legend>
        {[['standard', 'Standard user'], ['administrator', 'Administrator']].map(([value, label], index) => (
          <label key={value} className="invite-radio">
            <input
              type="radio" name="invite-role" value={value}
              ref={index === 0 ? (element) => { refs.current.role = element; } : undefined}
              checked={values.role === value} onChange={change('role')}
            />
            <span>{label}</span>
          </label>
        ))}
        {fieldError('role')}
      </fieldset>
      <div ref={generalRef} tabIndex={-1} role="alert" className={general.message ? 'invite-alert' : 'invite-alert invite-alert-empty'}>
        {general.message}
      </div>
      <button type="submit" className="invite-button" aria-disabled={sending ? true : undefined}>
        {sending ? 'Creating invitation…' : 'Create invitation'}
      </button>
    </form>
  );
}

function InviteResult({ result, onAnother }) {
  const linkRef = useRef(null);
  const headingRef = useRef(null);
  // 'idle', 'copied' or 'failed': the status line says "Copied" or how to copy by hand.
  const [copy, setCopy] = useState('idle');
  // A layout effect: the result appears after the invite's reply (story 1.5 spec 7).
  useLayoutEffect(() => { headingRef.current?.focus(); }, []);

  async function copyLink() {
    // Cleared first, so each attempt's outcome is announced afresh.
    setCopy('idle');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('No clipboard');
      await navigator.clipboard.writeText(result.link);
      setCopy('copied');
    } catch {
      setCopy('failed');
      linkRef.current?.focus();
      linkRef.current?.select();
    }
  }

  return (
    <div className="invite-result">
      <h3 ref={headingRef} tabIndex={-1} className="invite-result-heading">
        <label htmlFor="invite-link">{`Invitation link for ${result.name}`}</label>
      </h3>
      <input
        id="invite-link" ref={linkRef} className="invite-link" type="text" readOnly value={result.link}
        spellCheck={false} onFocus={(event) => event.target.select()}
      />
      <div className="invite-copy-row">
        <button type="button" className="invite-button" onClick={copyLink}>Copy link</button>
        <p role="status" className={copy === 'failed' ? 'invite-copy-status invite-copy-failed' : 'invite-copy-status'} data-testid="invite-copy-status">
          {copy === 'copied' ? 'Copied' : copy === 'failed' ? COPY_FAILED : ''}
        </p>
      </div>
      <p className="invite-expiry" data-testid="invite-expiry">{expirySentence(result.expiresAt)}</p>
      <button type="button" className="invite-secondary" onClick={onAnother}>Invite another person</button>
    </div>
  );
}

/** The panel. `onClose` closes it and returns focus to the menu trigger; `onSignedOut` shows the sign-in page. */
export default function InvitePanel({ onClose, onSignedOut }) {
  const headingId = useId();
  const dialog = useRef(null);
  // The link lives only in this state: closing the panel unmounts it and discards the link (D-9).
  const [result, setResult] = useState(null);
  const [form, setForm] = useState(0);

  // A layout effect, so Escape and the Tab trap work from the moment the panel can be seen (it
  // appears once its code has loaded; a passive effect could run after a first key press).
  useLayoutEffect(() => {
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

  // Drawn on the document's body, outside the app header, so no header style reaches it.
  return createPortal(
    // The backdrop does not close the panel: a stray press must not discard the one-time link (D-9).
    <div className="invite-backdrop">
      <div ref={dialog} className="invite-panel" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <div className="invite-header">
          <h2 id={headingId}>Invite a person</h2>
          <button type="button" className="invite-close" onClick={onClose}><X size={18} aria-hidden="true"/>Close</button>
        </div>
        {result
          ? <InviteResult result={result} onAnother={() => { setResult(null); setForm((count) => count + 1); }}/>
          : <InviteForm key={form} onInvited={setResult} onSignedOut={onSignedOut}/>}
      </div>
    </div>,
    document.body,
  );
}
