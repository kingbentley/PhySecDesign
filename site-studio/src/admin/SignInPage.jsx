import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../BrandMark.jsx';
import { EMAIL_MAX } from '../../shared/setup.ts';
import { SIGNIN_PASSWORD_MAX_UNITS, signInEmailField, signInPasswordField } from '../../shared/signin.ts';
import { SIGN_IN_FIELDS, submitSignIn } from './signInClient.js';
import './signin.css';

// The sign-in page (S-26, FR-67, story 1.3). Shown to anyone not signed in once an administrator
// exists. The fields are a real form a password manager fills (`username`, `current-password`).
// There is no "Forgot password" link until story 1.17 (D-8).

const FIELD_MESSAGES = {
  email: `Enter your email address, of at most ${EMAIL_MAX} characters.`,
  password: `Enter your password, of at most ${SIGNIN_PASSWORD_MAX_UNITS} characters.`,
};

/** Checks the entered values with the server's own rules (shared/signin.ts, standing rule 6). */
function checkFields(values) {
  const errors = {};
  if (!signInEmailField.safeParse(values.email).success) errors.email = FIELD_MESSAGES.email;
  if (!signInPasswordField.safeParse(values.password).success) errors.password = FIELD_MESSAGES.password;
  return errors;
}

function useDocumentTitle(title) {
  useEffect(() => {
    document.body.classList.add('signin-open');
    const previous = document.title;
    document.title = title;
    return () => {
      document.body.classList.remove('signin-open');
      document.title = previous;
    };
  }, [title]);
}

function Field({ id, label, error, inputRef, ...rest }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="signin-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={inputRef} aria-invalid={error ? true : undefined} aria-describedby={errorId} {...rest}/>
      {error && <p id={errorId} className="signin-field-error">{error}</p>}
    </div>
  );
}

function Frame({ installationName, children }) {
  return (
    <div className="signin-page">
      <header className="signin-side">
        <div className="signin-brand"><BrandMark size={44}/><span>Site Survey Design</span></div>
        {installationName && <p className="signin-installation" data-testid="signin-installation">{installationName}</p>}
        <p className="signin-tagline">Design, install, test and look after the security systems at your properties.</p>
      </header>
      <main className="signin-main">{children}</main>
    </div>
  );
}

/** The page shown when the session read could not be checked (D-7 amended, A-3, E-5). */
export function SignInUnknown({ onRetry }) {
  useDocumentTitle('Sign in · Site Survey Design');
  const heading = useRef(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => { heading.current?.focus(); }, []);
  async function retry() {
    if (checking) return;
    setChecking(true);
    try { await onRetry(); } finally { setChecking(false); }
  }
  return (
    <Frame installationName={null}>
      <h1 ref={heading} tabIndex={-1}>Sign-in cannot be checked</h1>
      <p className="signin-lead">The server did not say whether you are signed in. Check the connection and try again.</p>
      <button type="button" className="signin-button" onClick={retry} aria-disabled={checking ? true : undefined}>
        {checking ? 'Checking…' : 'Try again'}
      </button>
    </Frame>
  );
}

/** The sign-in page. `onSignedIn({ name })` opens the app once the server has signed the person in. */
export default function SignInPage({ installationName, onSignedIn }) {
  useDocumentTitle('Sign in · Site Survey Design');
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  // A refusal: shown in the alert, which takes focus once it is drawn (a new object each time, so
  // the same message shown twice is announced and focused again).
  const [general, setGeneral] = useState({ message: '' });
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const refs = useRef({});
  const generalRef = useRef(null);
  useEffect(() => { if (general.message) generalRef.current?.focus(); }, [general]);

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
    const found = checkFields(values);
    setErrors(found);
    const first = SIGN_IN_FIELDS.find((field) => found[field]);
    if (first) { refs.current[first]?.focus(); return; }
    inFlight.current = true;
    setSending(true);
    let result;
    try {
      // The values as typed: the server trims and lower-cases the email and normalises the password.
      result = await submitSignIn({ email: values.email, password: values.password });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
    if (result.kind === 'signedIn') return onSignedIn({ name: result.name });
    if (result.kind === 'field') {
      setErrors({ [result.field]: FIELD_MESSAGES[result.field] });
      refs.current[result.field]?.focus();
      return;
    }
    setValues((current) => ({ ...current, password: '' }));
    setGeneral({ message: result.message });
  }

  const field = (name) => ({
    id: `signin-${name}`,
    value: values[name],
    onChange: change(name),
    error: errors[name],
    inputRef: (element) => { refs.current[name] = element; },
  });

  return (
    <Frame installationName={installationName}>
      <h1>{installationName ? `Sign in to ${installationName}` : 'Sign in'}</h1>
      <div ref={generalRef} tabIndex={-1} role="alert" className={general.message ? 'signin-alert' : 'signin-alert signin-alert-empty'}>
        {general.message}
      </div>
      <form className="signin-form" noValidate onSubmit={submit}>
        <Field {...field('email')} label="Email" type="email" autoComplete="username" spellCheck={false} autoCapitalize="none"/>
        <Field {...field('password')} label="Password" type="password" autoComplete="current-password"/>
        <button type="submit" className="signin-button" aria-disabled={sending ? true : undefined}>
          {sending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="signin-note">Accounts are created by invitation. If you do not have one, ask an administrator at your organisation.</p>
      <p className="signin-note">Reviewing a design for someone? Open the review link they sent you. You do not need an account.</p>
    </Frame>
  );
}
