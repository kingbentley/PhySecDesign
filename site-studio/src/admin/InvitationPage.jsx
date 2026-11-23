import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandMark } from '../BrandMark.jsx';
import { isWellFormedInvitationSecret } from '../../shared/invitation.ts';
import { ACCEPT_FIELDS, INVITATION_MESSAGES, readInvitation, submitAccept } from './invitationClient.js';
import { ACCEPT_FIELD_MESSAGES, checkAcceptFields, invitedAsLine, ruleItems, signedInNotice } from './invitationRules.js';
import { readTwoStepState } from '../account/twoStepClient.js';
import './invitation.css';
import '../account/account.css';

// The invitation page (S-27, story 1.4, CAP-3, CAP-4, CAP-5, D-2, D-3, D-4, D-7, D-8, D-11). Shown
// at /invite after set-up whatever the session. The secret was taken from the address before the
// app started (`invitationAddress.js`) and is kept in memory only; with none, the page asks to open
// the link again. A secret not shaped as the server issues them gets the "no longer works" message
// without a request (review finding 11). After a successful accept the page reads the two-step
// state and, when two-step verification is available, offers to set it up in place (story 1.5,
// CAP-8, D-11); skipping, finishing, or no offer loads the app in a fresh document (D-2), signed in
// as the new account.

const [UNUSABLE_TITLE, ...UNUSABLE_REST] = INVITATION_MESSAGES.unusable.split('. ');
const UNUSABLE_DETAIL = UNUSABLE_REST.join('. ');

function useDocumentTitle() {
  useEffect(() => {
    document.body.classList.add('invitation-open');
    const previous = document.title;
    document.title = 'Invitation · Site Survey Design';
    return () => {
      document.body.classList.remove('invitation-open');
      document.title = previous;
    };
  }, []);
}

function useFocusOnMount() {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return ref;
}

function Frame({ children }) {
  return (
    <div className="invitation-page">
      <header className="invitation-brand"><BrandMark size={40}/><span>Site Survey Design</span></header>
      <main className="invitation-card">{children}</main>
    </div>
  );
}

function RuleIcon({ met }) {
  return met ? (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3 3 7-7"/></svg>
  ) : (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="5"/></svg>
  );
}

function Reopen() {
  const heading = useFocusOnMount();
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1}>{INVITATION_MESSAGES.reopen}</h1>
      <p className="invitation-lead">For your safety the link is removed from the address bar once the page has opened. The link works until it is used, replaced by a newer invitation, or expires.</p>
    </Frame>
  );
}

function Unusable() {
  const heading = useFocusOnMount();
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1} data-testid="invitation-unusable-title">{`${UNUSABLE_TITLE}.`}</h1>
      <p className="invitation-lead" data-testid="invitation-unusable-detail">{UNUSABLE_DETAIL}</p>
    </Frame>
  );
}

function CannotCheck({ onRetry, heading: title = 'The invitation cannot be checked', message = 'The server did not say whether this invitation works. Check the connection and try again.' }) {
  const heading = useFocusOnMount();
  const [checking, setChecking] = useState(false);
  async function retry() {
    if (checking) return;
    setChecking(true);
    try { await onRetry(); } finally { setChecking(false); }
  }
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      <p className="invitation-lead">{message}</p>
      <button type="button" className="invitation-button" onClick={retry} aria-disabled={checking ? true : undefined}>
        {checking ? 'Checking…' : 'Try again'}
      </button>
    </Frame>
  );
}

function Field({ id, label, error, inputRef, describedBy, ...rest }) {
  const errorId = error ? `${id}-error` : null;
  const described = [errorId, describedBy].filter(Boolean).join(' ') || undefined;
  return (
    <div className="invitation-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={inputRef} aria-invalid={error ? true : undefined} aria-describedby={described} {...rest}/>
      {error && <p id={errorId} className="invitation-field-error">{error}</p>}
    </div>
  );
}

/**
 * The offer after a successful accept (S-27, story 1.5, CAP-8, D-11): set up two-step verification
 * here, asking for the password again (CA-13), or skip. Skipping or finishing loads the app in a
 * fresh document (story 1.4's D-2). `state` is the two-step state read just after accepting.
 */
function Offer({ state }) {
  const heading = useRef(null);
  const [settingUp, setSettingUp] = useState(false);
  const [TwoStepSetup, setTwoStepSetup] = useState(null);
  const openApp = () => location.replace('/');
  // In a layout effect, so focus has moved by the time the offer can be seen or used.
  useLayoutEffect(() => { if (!settingUp) heading.current?.focus(); }, [settingUp]);

  async function setUp() {
    try {
      const module = await import('../account/TwoStepSetup.jsx');
      setTwoStepSetup(() => module.default);
      setSettingUp(true);
    } catch {
      // The set-up's code could not be loaded: the app opens, where My account offers it again.
      openApp();
    }
  }

  if (settingUp && TwoStepSetup) {
    return (
      <Frame>
        <TwoStepSetup
          email={state.email} headingLevel={1} doneLabel="Continue to Site Survey Design"
          onDone={openApp} onCancel={() => setSettingUp(false)} onSignedOut={openApp}
        />
      </Frame>
    );
  }
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1}>Protect your account</h1>
      <p className="invitation-lead">
        Turn on two-step verification now? After your password, signing in will also ask for a code from an authenticator app on your phone. You can turn it on later from My account.
      </p>
      <div className="two-step-row">
        <button type="button" className="two-step-button" onClick={setUp}>Set up two-step verification</button>
        <button type="button" className="two-step-secondary" onClick={openApp}>Skip for now</button>
      </div>
    </Frame>
  );
}

function AcceptForm({ secret, invitation, session, onUnusable, onAccepted }) {
  const [values, setValues] = useState({ name: invitation.name, password: '', passwordAgain: '' });
  const [errors, setErrors] = useState({});
  // A failure that belongs to no field; `retry` adds Try again (review finding 7).
  const [general, setGeneral] = useState({ message: '', retry: false });
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const refs = useRef({});
  const generalRef = useRef(null);
  useEffect(() => { if (general.message) generalRef.current?.focus(); }, [general]);

  const rules = ruleItems(values.password, invitation.email);

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

  async function send() {
    if (inFlight.current) return;
    setGeneral({ message: '', retry: false });
    const found = checkAcceptFields(values, invitation.email);
    setErrors(found);
    const first = ACCEPT_FIELDS.find((field) => found[field]);
    if (first) { refs.current[first]?.focus(); return; }
    inFlight.current = true;
    setSending(true);
    let result;
    try {
      // The values as typed: the server trims the name and normalises the password.
      result = await submitAccept({ secret, name: values.name, password: values.password });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    if (result.kind === 'accepted') {
      // The offer, when two-step verification is available; otherwise the app (story 1.5, D-11).
      // The button stays busy while the state is read: the link is used now.
      inFlight.current = true;
      setSending(true);
      await onAccepted();
      return;
    }
    if (result.kind === 'unusable') return onUnusable();
    if (result.kind === 'field') {
      setErrors({ [result.field]: result.field === 'password' ? ACCEPT_FIELD_MESSAGES.passwordServer : ACCEPT_FIELD_MESSAGES.name });
      refs.current[result.field]?.focus();
      return;
    }
    if (result.kind === 'busy') return setGeneral({ message: INVITATION_MESSAGES.busy, retry: false });
    setGeneral({ message: INVITATION_MESSAGES.acceptFailed, retry: true });
  }

  function submit(event) {
    event.preventDefault();
    send();
  }

  const field = (name) => ({
    id: `invitation-${name}`,
    value: values[name],
    onChange: change(name),
    error: errors[name],
    inputRef: (element) => { refs.current[name] = element; },
  });

  return (
    <Frame>
      <div>
        <h1>{`Join ${invitation.installationName}`}</h1>
        <p className="invitation-lead" data-testid="invitation-invited-as">{invitedAsLine(invitation.inviterName, invitation.role)}</p>
      </div>
      <dl className="invitation-summary">
        <div><dt>Email</dt><dd data-testid="invitation-email">{invitation.email}</dd></div>
      </dl>
      {session?.kind === 'signedIn' && (
        <p className="invitation-notice" data-testid="invitation-signed-in">{signedInNotice(session.name)}</p>
      )}
      <div ref={generalRef} tabIndex={-1} role="alert" className={general.message ? 'invitation-alert' : 'invitation-alert invitation-alert-empty'}>
        {general.message && <span>{general.message}</span>}
        {general.retry && (
          <button type="button" className="invitation-retry" onClick={send} aria-disabled={sending ? true : undefined}>Try again</button>
        )}
      </div>
      <form className="invitation-form" noValidate onSubmit={submit}>
        {/* The email beside the new password, so a password manager saves the pair. */}
        <input type="email" name="username" autoComplete="username" value={invitation.email} readOnly hidden/>
        <Field {...field('name')} label="Name" type="text" autoComplete="name"/>
        <div className="invitation-field">
          <label htmlFor="invitation-password">Password</label>
          <input
            id="invitation-password" type="password" autoComplete="new-password"
            ref={(element) => { refs.current.password = element; }}
            value={values.password} onChange={change('password')}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={[errors.password ? 'invitation-password-error' : null, 'invitation-rules'].filter(Boolean).join(' ')}
          />
          {errors.password && <p id="invitation-password-error" className="invitation-field-error">{errors.password}</p>}
          <div aria-live="polite">
            <ul id="invitation-rules" className="invitation-rules" aria-label="Password rules">
              {rules.map((rule) => (
                <li key={rule.id} className="invitation-rule" data-rule={rule.id} data-met={rule.met ? 'true' : 'false'}>
                  <RuleIcon met={rule.met}/>
                  <span>{rule.label}</span>
                  <span className="invitation-rule-state">{rule.state}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Field {...field('passwordAgain')} label="Password again" type="password" autoComplete="new-password"/>
        <button type="submit" className="invitation-button" aria-disabled={sending ? true : undefined}>
          {sending ? 'Setting password…' : 'Set password and sign in'}
        </button>
      </form>
    </Frame>
  );
}

/**
 * The page. `secret` is the one taken from the address (or null); `session` is what the session
 * read answered (`null` while it has not, or `{ kind: 'unknown' }`): the page shows whatever it is.
 */
export default function InvitationPage({ secret, session }) {
  useDocumentTitle();
  const wellFormed = typeof secret === 'string' && isWellFormedInvitationSecret(secret);
  // 'reopen', 'reading', 'unknown', 'updating', 'unusable' or 'form'.
  const [view, setView] = useState(() => (secret === null || secret === undefined ? { kind: 'reopen' } : wellFormed ? { kind: 'reading' } : { kind: 'unusable' }));
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  async function read() {
    const result = await readInvitation(secret);
    if (!live.current) return;
    if (result.kind === 'invitation') setView({ kind: 'form', invitation: result.invitation });
    else if (result.kind === 'unusable') setView({ kind: 'unusable' });
    else setView((current) => ({ kind: result.kind === 'updating' ? 'updating' : 'unknown', attempt: (current.attempt ?? 0) + 1 }));
  }

  useEffect(() => {
    if (wellFormed) read();
    // Read once when the page opens; Try again reads again.
  }, []);

  // After a successful accept (story 1.5, D-11, finding 14): the offer only when two-step
  // verification is available; otherwise, or when the read fails, the app in a fresh document, so
  // its page has the default referrer policy (story 1.4's D-2).
  async function accepted() {
    const result = await readTwoStepState();
    if (!live.current) return;
    if (result.kind === 'state' && result.state.availability === 'available' && !result.state.enabled) {
      setView({ kind: 'offer', state: result.state });
      return;
    }
    location.replace('/');
  }

  if (view.kind === 'reopen') return <Reopen/>;
  if (view.kind === 'unusable') return <Unusable/>;
  if (view.kind === 'unknown') return <CannotCheck key={view.attempt} onRetry={read}/>;
  // An update in progress: the sign-in page's updating wording, with Try again (Kevin, 2026-11-21).
  if (view.kind === 'updating') return <CannotCheck key={view.attempt} onRetry={read} heading="Invitation" message={INVITATION_MESSAGES.updating}/>;
  if (view.kind === 'reading') {
    return (
      <Frame>
        <h1>Invitation</h1>
        <p className="invitation-lead" role="status">Checking the invitation…</p>
      </Frame>
    );
  }
  if (view.kind === 'offer') return <Offer state={view.state}/>;
  return (
    <AcceptForm
      secret={secret} invitation={view.invitation} session={session}
      onUnusable={() => setView({ kind: 'unusable' })} onAccepted={accepted}
    />
  );
}
