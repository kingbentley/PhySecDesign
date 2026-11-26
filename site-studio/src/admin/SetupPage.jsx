import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandMark } from '../BrandMark.jsx';
import { FIELD_HINTS, SETUP_FIELDS, checkSetupFields, submitSetup } from './setupClient.js';
import { readSetupState } from './setupState.js';
import './setup.css';

// First-run set-up (S-25, FR-66, story 1.2). Shown only while the installation has no users; once
// an administrator exists the same address says set-up is already complete (D-5).

const EMPTY = { code: '', installationName: '', name: '', email: '', password: '', passwordAgain: '' };

function Field({ id, label, type = 'text', value, onChange, error, hint, inputRef, autoComplete, ...rest }) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="setup-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error && <p id={errorId} className="setup-field-error">{error}</p>}
      {hint && <p id={hintId} className="setup-hint">{hint}</p>}
    </div>
  );
}

function Frame({ children }) {
  return (
    <div className="setup-page">
      <header className="setup-brand">
        <BrandMark size={40}/>
        <span>Site Survey Design</span>
      </header>
      <main className="setup-card">{children}</main>
    </div>
  );
}

// Focus moves that follow a reply or a newly shown view are layout effects, so focus has moved
// before the person can start typing (story 1.5 spec 7: a passive effect can run after typing has
// begun and lose keystrokes). Focus calls made straight in a handler stay as they are.
function useFocusOnMount() {
  const ref = useRef(null);
  useLayoutEffect(() => { ref.current?.focus(); }, []);
  return ref;
}

function Finished({ installationName, email }) {
  const heading = useFocusOnMount();
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1}>Set-up is complete</h1>
      <p className="setup-lead">You are this installation's first administrator. This page is no longer available.</p>
      <dl className="setup-summary">
        <div><dt>Installation</dt><dd data-testid="setup-done-installation">{installationName}</dd></div>
        <div><dt>Administrator</dt><dd data-testid="setup-done-email">{email}</dd></div>
      </dl>
      <p className="setup-lead" data-testid="setup-done-next">Sign in with the email and password you just chose.</p>
      <a href="/">Sign in</a>
    </Frame>
  );
}

function AlreadyComplete() {
  const heading = useFocusOnMount();
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1}>Set-up is already complete</h1>
      <p className="setup-lead">This installation already has an administrator, so the set-up page is no longer available.</p>
      <a className="setup-button" href="/">Open Site Survey Design</a>
    </Frame>
  );
}

function StateUnknown({ onRetry }) {
  const heading = useFocusOnMount();
  return (
    <Frame>
      <h1 ref={heading} tabIndex={-1}>Set-up cannot be checked</h1>
      <p className="setup-lead">The server did not say whether set-up is open. Check the connection and try again.</p>
      <button type="button" className="setup-button" onClick={onRetry}>Try again</button>
    </Frame>
  );
}

function SetupForm({ onDone, onClosed }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  // A refusal that belongs to no field: shown in the alert, which takes focus once it is drawn
  // (a new object each time, so the same message shown twice is focused again).
  const [general, setGeneral] = useState({ message: '' });
  const [sending, setSending] = useState(false);
  // Set before the request is sent, so a second submit in the same moment (before the re-render
  // that `sending` causes) sends nothing.
  const inFlight = useRef(false);
  const refs = useRef({});
  const generalRef = useRef(null);
  const focusField = (field) => refs.current[field]?.focus();
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
    const { errors: found, input } = checkSetupFields(values);
    const first = SETUP_FIELDS.find((field) => found[field]);
    setErrors(found);
    if (first) { focusField(first); return; }
    inFlight.current = true;
    setSending(true);
    let result;
    try {
      result = await submitSetup(input);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    if (result.kind === 'done') return onDone(result);
    if (result.kind === 'closed') return onClosed();
    if (result.kind === 'field') {
      setErrors({ [result.field]: result.message });
      focusField(result.field);
      return;
    }
    if (result.focus) {
      setErrors({ [result.focus]: result.message });
      focusField(result.focus);
    } else {
      setGeneral({ message: result.message });
    }
  }

  const field = (name) => ({
    id: `setup-${name}`,
    value: values[name],
    onChange: change(name),
    error: errors[name],
    inputRef: (element) => { refs.current[name] = element; },
  });

  return (
    <Frame>
      <h1>Set up this installation</h1>
      <p className="setup-lead" id="setup-statement">
        This page appears because no one has an account yet. It disappears once an administrator exists.
      </p>
      <div ref={generalRef} tabIndex={-1} role="alert" className={general.message ? 'setup-alert' : 'setup-alert setup-alert-empty'}>
        {general.message}
      </div>
      <form className="setup-form" noValidate onSubmit={submit} aria-describedby="setup-statement">
        <Field {...field('code')} label="Set-up code" hint={FIELD_HINTS.code} autoComplete="off" spellCheck={false} autoCapitalize="characters"/>
        <Field {...field('installationName')} label="Name of this installation" hint={FIELD_HINTS.installationName} autoComplete="organization"/>
        <fieldset className="setup-admin">
          <legend>First administrator</legend>
          <div className="setup-grid">
            <Field {...field('name')} label="Your name" autoComplete="name"/>
            <Field {...field('email')} label="Email" type="email" autoComplete="email" spellCheck={false} autoCapitalize="none"/>
            <Field {...field('password')} label="Password" type="password" hint={FIELD_HINTS.password} autoComplete="new-password"/>
            <Field {...field('passwordAgain')} label="Password again" type="password" autoComplete="new-password"/>
          </div>
          <p className="setup-hint">An administrator manages users, projects, backups and updates. You can add more administrators later.</p>
        </fieldset>
        <div className="setup-actions">
          <button type="submit" className="setup-button" aria-disabled={sending ? true : undefined}>
            {sending ? 'Creating administrator…' : 'Create administrator and finish'}
          </button>
        </div>
      </form>
    </Frame>
  );
}

/**
 * The set-up address's page. `initialState` is what the state route said: open, closed or unknown.
 * `onStateRead`, when given, receives what Try again reads instead of this page showing it, so the
 * app can route it from whichever address the page was shown at (story 1.3, D-7 amended again).
 */
export default function SetupPage({ initialState, onStateRead }) {
  const [view, setView] = useState(() => (initialState === 'open' ? { kind: 'form' } : { kind: initialState }));

  useEffect(() => {
    document.body.classList.add('setup-open');
    const title = document.title;
    document.title = 'Set up · Site Survey Design';
    return () => {
      document.body.classList.remove('setup-open');
      document.title = title;
    };
  }, []);

  async function retry() {
    const state = await readSetupState();
    if (onStateRead) return onStateRead(state);
    setView(state === 'open' ? { kind: 'form' } : { kind: state, attempt: Date.now() });
  }

  if (view.kind === 'form') {
    return <SetupForm onDone={(result) => setView({ kind: 'done', ...result })} onClosed={() => setView({ kind: 'closed' })}/>;
  }
  if (view.kind === 'done') return <Finished installationName={view.installationName} email={view.email}/>;
  if (view.kind === 'closed') return <AlreadyComplete/>;
  return <StateUnknown key={view.attempt ?? 0} onRetry={retry}/>;
}
