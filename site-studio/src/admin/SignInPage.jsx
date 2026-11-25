import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandMark } from '../BrandMark.jsx';
import { EMAIL_MAX } from '../../shared/setup.ts';
import { SIGNIN_PASSWORD_MAX_UNITS, signInEmailField, signInPasswordField } from '../../shared/signin.ts';
import { CODE_FIELD_MAX_LENGTH } from '../../shared/twoStep.ts';
import { SIGN_IN_FIELDS, requestSignOut, submitSecondStep, submitSignIn } from './signInClient.js';
import { SECOND_STEP_FIELD_MESSAGES, checkSecondStepCode } from './secondStepRules.js';
import './signin.css';

// The sign-in page (S-26, FR-67, story 1.3). Shown to anyone not signed in once an administrator
// exists. The fields are a real form a password manager fills (`username`, `current-password`).
// There is no "Forgot password" link until story 1.17 (D-8).
//
// Story 1.5 (spec 8, D-3, D-13): when the password is right for an account with two-step
// verification on, the page shows the second step in place, asking for a code from the
// authenticator app or a recovery code. The pending sign-in lives only in its own HttpOnly cookie,
// so a reload shows the password form again. Every focus move that follows a reply or a newly shown
// view is made in a layout effect, so focus has moved by the time the view can be used (orchestrator
// ruling, 2026-11-23; spec 7's focus race).

const KEY_MISMATCH_LINE = 'You can still sign in with a recovery code.';
const EMPTY_CODES = { code: '', recovery: '' };

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

function Field({ id, label, error, hint, inputRef, ...rest }) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="signin-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={inputRef} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest}/>
      {hint && <p id={hintId} className="signin-field-hint">{hint}</p>}
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
  useLayoutEffect(() => { heading.current?.focus(); }, []);
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
  // Which form is shown: the password form, or the second step asking for a code from the
  // authenticator app or a recovery code (story 1.5).
  const [view, setView] = useState('password');
  const [codes, setCodes] = useState(EMPTY_CODES);
  const [errors, setErrors] = useState({});
  // A refusal: shown in the alert, which takes focus once it is drawn (a new object each time, so
  // the same message shown twice is announced and focused again), unless `focus` is false.
  const [general, setGeneral] = useState({ message: '' });
  // Where focus goes once a newly shown view is drawn: 'heading', 'password', 'code' or 'recovery'.
  const [focusTo, setFocusTo] = useState(null);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  // Raised by "Back to sign in", so a second-step reply that arrives afterwards changes nothing on
  // screen, a late success included: the person has left that sign-in and may be signing in as
  // someone else; a late success's session is ended (`endLeftSession`; pull request 13, review
  // round 1; orchestrator rulings of 2026-11-24).
  const secondStepRun = useRef(0);
  // False once the page has gone (the app opened, for example because someone signed in meanwhile).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const refs = useRef({});
  const generalRef = useRef(null);
  const secondHeading = useRef(null);
  useLayoutEffect(() => { if (general.message && general.focus !== false) generalRef.current?.focus(); }, [general]);
  useLayoutEffect(() => {
    if (!focusTo) return;
    if (focusTo.to === 'heading') secondHeading.current?.focus();
    else refs.current[focusTo.to]?.focus();
  }, [focusTo]);

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
    if (result.kind === 'secondStep') {
      // The password is no longer needed: dropped from state, the email kept (D-3).
      setCodes(EMPTY_CODES);
      setErrors({});
      setView('code');
      setFocusTo({ to: 'heading' });
      return;
    }
    setGeneral({ message: result.message });
  }

  /** Back to the password form, the email kept, with `message` in the alert or focus on the password. */
  function showPasswordForm(message) {
    setView('password');
    setCodes(EMPTY_CODES);
    setErrors({});
    setValues((current) => ({ ...current, password: '' }));
    if (message) {
      setGeneral({ message });
    } else {
      setGeneral({ message: '' });
      setFocusTo({ to: 'password' });
    }
  }

  /** "Back to sign in": no request; the pending cookie simply expires or is replaced (D-3). */
  function backToSignIn() {
    secondStepRun.current += 1;
    // The abandoned request no longer holds the page: the password form can be sent at once.
    inFlight.current = false;
    setSending(false);
    showPasswordForm(null);
  }

  /**
   * A second step that succeeded after the person went back: the server has signed that account in
   * and the browser holds its session, which no page shows. It is ended with the sign-out route and
   * nothing changes on screen; if this page has already handed over to the app (someone signed in
   * meanwhile), the page reloads after the sign-out so it shows the truth. A sign-out that is not
   * confirmed leaves things as they are (pull request 13, review round 1; orchestrator ruling of
   * 2026-11-24).
   */
  async function endLeftSession() {
    let confirmed = false;
    try {
      confirmed = await requestSignOut();
    } catch {
      confirmed = false;
    }
    if (confirmed && !mounted.current) window.location.reload();
  }

  /** "Use a recovery code" and "Use a code from your authenticator app"; not while a code is being checked. */
  function switchMode(next) {
    if (inFlight.current) return;
    setView(next);
    setErrors({});
    setGeneral({ message: '' });
    setFocusTo({ to: next });
  }

  async function submitSecondStepForm(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const method = view === 'recovery' ? 'recovery' : 'code';
    setGeneral({ message: '' });
    // The server's own rules, before sending (standing rule 6); the normalised value is sent.
    const checked = checkSecondStepCode(method, codes[method]);
    if (checked.error) {
      setErrors({ [method]: checked.error });
      refs.current[method]?.focus();
      return;
    }
    setErrors({});
    const run = secondStepRun.current;
    inFlight.current = true;
    setSending(true);
    let result;
    try {
      result = await submitSecondStep({ method, code: checked.code });
    } finally {
      // After "Back to sign in" this request no longer owns the page's sending state.
      if (run === secondStepRun.current) {
        inFlight.current = false;
        setSending(false);
      }
    }
    if (run !== secondStepRun.current) {
      if (result.kind === 'signedIn') endLeftSession();
      return;
    }
    if (result.kind === 'signedIn') return onSignedIn({ name: result.name });
    switch (result.kind) {
      case 'restart':
        showPasswordForm(result.message);
        return;
      case 'keyMismatch':
        // Codes cannot be checked here, but recovery codes can (finding 26): focus goes to that field.
        setView('recovery');
        setCodes((current) => ({ ...current, code: '' }));
        setGeneral({ message: `${result.message} ${KEY_MISMATCH_LINE}`, focus: false });
        setFocusTo({ to: 'recovery' });
        return;
      case 'field':
        setErrors({ [method]: SECOND_STEP_FIELD_MESSAGES[method] });
        refs.current[method]?.focus();
        return;
      default:
        // A wrong code or any other refusal: the field keeps its value for correction.
        setGeneral({ message: result.message });
    }
  }

  const changeCode = (method) => (event) => {
    const value = event.target.value;
    setCodes((current) => ({ ...current, [method]: value }));
    setErrors((current) => (current[method] ? {} : current));
  };

  const field = (name) => ({
    id: `signin-${name}`,
    value: values[name],
    onChange: change(name),
    error: errors[name],
    inputRef: (element) => { refs.current[name] = element; },
  });

  const codeField = (method) => ({
    id: `signin-${method}`,
    value: codes[method],
    onChange: changeCode(method),
    error: errors[method],
    inputRef: (element) => { refs.current[method] = element; },
  });

  const alert = (
    <div ref={generalRef} tabIndex={-1} role="alert" className={general.message ? 'signin-alert' : 'signin-alert signin-alert-empty'}>
      {general.message}
    </div>
  );

  if (view !== 'password') {
    const recovery = view === 'recovery';
    return (
      <Frame installationName={installationName}>
        <h1 ref={secondHeading} tabIndex={-1}>Two-step verification</h1>
        <p className="signin-lead">
          {recovery
            ? 'Enter one of the recovery codes you saved when you turned on two-step verification. Each code works once.'
            : `Open your authenticator app and enter the 6-digit code for ${installationName || 'Site Survey Design'}.`}
        </p>
        {alert}
        <form className="signin-form" noValidate onSubmit={submitSecondStepForm}>
          {recovery ? (
            <Field {...codeField('recovery')} label="Recovery code" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false}/>
          ) : (
            <Field {...codeField('code')} label="Code" hint="6 digits. Spaces are ignored." type="text" inputMode="numeric"
              autoComplete="one-time-code" pattern="[0-9]*" maxLength={CODE_FIELD_MAX_LENGTH}/>
          )}
          <button type="submit" className="signin-button" aria-disabled={sending ? true : undefined}>
            {sending ? 'Checking…' : recovery ? 'Sign in with recovery code' : 'Verify and sign in'}
          </button>
        </form>
        <div className="signin-second-actions">
          <button type="button" className="signin-link-button" onClick={() => switchMode(recovery ? 'code' : 'recovery')}>
            {recovery ? 'Use a code from your authenticator app' : 'Use a recovery code'}
          </button>
          <button type="button" className="signin-link-button" onClick={backToSignIn}>Back to sign in</button>
        </div>
      </Frame>
    );
  }

  return (
    <Frame installationName={installationName}>
      <h1>{installationName ? `Sign in to ${installationName}` : 'Sign in'}</h1>
      {alert}
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
