import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { CODE_FIELD_MAX_LENGTH, normaliseCode } from '../../shared/twoStep.ts';
import {
  RECOVERY_CODES_FILE_NAME,
  TWO_STEP_MESSAGES,
  confirmTwoStep,
  entryNameLine,
  groupedKey,
  qrLabel,
  recoveryCodesFile,
  startTwoStep,
} from './twoStepClient.js';
import './account.css';

// Turning two-step verification on (story 1.5, spec 7; CAP-1, CAP-2, CAP-13; D-6, D-7, D-8, D-10,
// D-11, D-21), written once and used by My account and by the invitation page's offer: step 1 the
// password, step 2 the QR code and the key with the code from the app, step 3 the recovery codes
// with Copy and Download. The QR code is drawn here by React as inline SVG from the start reply's
// `otpauth://` URI with the pinned encoder, which only this module imports (D-8): no image address,
// no `innerHTML`, no request. The secret, the URI and the codes live only in this component's state
// and are dropped when it unmounts; they are never stored, put in the address bar or logged.
//
// Also exported: the password and code fields and the recovery-codes view, which My account's fresh
// codes reuse.

/** A heading at the level the host page needs (the dialog's section, or the offer page's card). */
export function Heading({ level, headingRef, children, ...rest }) {
  const Tag = `h${Math.min(Math.max(level, 1), 6)}`;
  return <Tag ref={headingRef} tabIndex={-1} {...rest}>{children}</Tag>;
}

/**
 * The refusal area; it takes focus whenever a new message is set (`alert.at` changes). Focus moves
 * in a layout effect, in the same task that shows the message, so nothing typed or clicked in
 * between can land elsewhere (every focus move on these screens does the same).
 */
export function Alert({ alert }) {
  const ref = useRef(null);
  useLayoutEffect(() => { if (alert.message) ref.current?.focus(); }, [alert]);
  return (
    <div ref={ref} tabIndex={-1} role="alert" className={alert.message ? 'two-step-alert' : 'two-step-alert two-step-alert-empty'}>
      {alert.message}
    </div>
  );
}

function FieldError({ id, error }) {
  return error ? <p id={id} className="two-step-field-error">{error}</p> : null;
}

/** The password field (`autocomplete="current-password"`). */
export function PasswordField({ id, value, onChange, error, inputRef }) {
  return (
    <div className="two-step-field">
      <label htmlFor={id}>Password</label>
      <input
        id={id} ref={inputRef} type="password" autoComplete="current-password"
        value={value} onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
      />
      <FieldError id={`${id}-error`} error={error}/>
    </div>
  );
}

/** The code field with CAP-13's attributes: a phone's number keypad and code autofill. */
export function CodeField({ id, value, onChange, error, inputRef }) {
  const hintId = `${id}-hint`;
  return (
    <div className="two-step-field">
      <label htmlFor={id}>Code from the app</label>
      <input
        id={id} ref={inputRef} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
        maxLength={CODE_FIELD_MAX_LENGTH} spellCheck={false} autoCapitalize="none"
        value={value} onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? `${id}-error` : null, hintId].filter(Boolean).join(' ')}
      />
      <p id={hintId} className="two-step-hint">6 digits. Spaces are ignored.</p>
      <FieldError id={`${id}-error`} error={error}/>
    </div>
  );
}

/** The `otpauth://` URI as a QR code, drawn as inline SVG with a quiet zone of 4 modules (D-8). */
function QrCode({ text, label }) {
  const { size, path } = useMemo(() => {
    const code = qrcode(0, 'M');
    code.addData(text, 'Byte');
    code.make();
    const count = code.getModuleCount();
    let drawn = '';
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (code.isDark(row, column)) drawn += `M${column + 4} ${row + 4}h1v1h-1z`;
      }
    }
    return { size: count + 8, path: drawn };
  }, [text]);
  return (
    <svg
      className="two-step-qr" data-testid="two-step-qr" xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#fff"/>
      <path d={path} fill="#000"/>
    </svg>
  );
}

/** Selects an element's text, so a failed copy leaves it ready to copy by hand. */
function selectText(element) {
  const selection = window.getSelection?.();
  if (!element || !selection) return;
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.addRange(range);
}

/** Copy with "Copied" or the failure text, as the invite panel's Copy link does. */
function useCopy(failure) {
  const [copy, setCopy] = useState('idle');
  async function run(text, target) {
    // Cleared first, so each attempt's outcome is announced afresh.
    setCopy('idle');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('No clipboard');
      await navigator.clipboard.writeText(text);
      setCopy('copied');
    } catch {
      setCopy('failed');
      selectText(target.current);
    }
  }
  const status = copy === 'copied' ? 'Copied' : copy === 'failed' ? failure : '';
  return { run, status, failed: copy === 'failed', reset: () => setCopy('idle') };
}

/** Saves `text` as a file through a `Blob` link, revoked once the download has started. */
function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Step 3: the recovery codes, shown once (CAP-2), with Copy codes, Download codes and the closing
 * button (`doneLabel`). `installationName` and `email` go into the downloaded file.
 */
export function RecoveryCodes({ codes, installationName, email, headingLevel, doneLabel, onDone }) {
  const heading = useRef(null);
  const list = useRef(null);
  const copy = useCopy(TWO_STEP_MESSAGES.copyCodesFailed);
  useLayoutEffect(() => { heading.current?.focus(); }, []);

  function save() {
    download(recoveryCodesFile({ installationName, email, made: new Date(), codes }), RECOVERY_CODES_FILE_NAME);
  }

  return (
    <div className="two-step-step" data-step="codes">
      <Heading level={headingLevel} headingRef={heading} className="two-step-heading">Save your recovery codes</Heading>
      <p className="two-step-text">
        Each code signs you in once if you cannot use your authenticator app. Keep them somewhere safe, such as a password manager. They are shown only now.
      </p>
      <ol ref={list} className="two-step-codes" data-testid="two-step-codes" aria-label="Recovery codes">
        {codes.map((code) => <li key={code}><code>{code}</code></li>)}
      </ol>
      <div className="two-step-row">
        <button type="button" className="two-step-secondary" onClick={() => copy.run(codes.join('\n'), list)}>Copy codes</button>
        <button type="button" className="two-step-secondary" onClick={save}>Download codes</button>
      </div>
      <p role="status" className={copy.failed ? 'two-step-copy-status two-step-copy-failed' : 'two-step-copy-status'} data-testid="two-step-codes-copy-status">
        {copy.status}
      </p>
      <button type="button" className="two-step-button" onClick={onDone}>{doneLabel}</button>
    </div>
  );
}

const QUIET = { message: '', at: 0 };

/**
 * The set-up. `email` is the state read's (for the downloaded file); `headingLevel` the level of
 * each step's heading; `doneLabel` step 3's closing button; `onDone` closes it after step 3;
 * `onCancel` leaves steps 1 and 2; `onSignedOut` when the server answers that the session ended.
 */
export default function TwoStepSetup({ email, headingLevel, doneLabel, onDone, onCancel, onSignedOut }) {
  // 'password', 'scan' or 'codes'.
  const [step, setStep] = useState('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(QUIET);
  const [sending, setSending] = useState(false);
  // The start reply (secret, URI, set-up identifier, installation name, email), then the codes.
  const [setup, setSetup] = useState(null);
  const [codes, setCodes] = useState(null);
  const inFlight = useRef(false);
  const passwordRef = useRef(null);
  const codeRef = useRef(null);
  const heading = useRef(null);
  const keyRef = useRef(null);
  const copyKey = useCopy(TWO_STEP_MESSAGES.copyKeyFailed);

  // A new step takes focus, unless it opens with a refusal: the alert has it then. In a layout
  // effect, so focus has moved by the time the step can be seen or used (a passive effect could
  // run after a first keystroke and take focus from the field it was typed into).
  const alertNow = useRef(alert);
  alertNow.current = alert;
  useLayoutEffect(() => {
    if (alertNow.current.message) return;
    if (step === 'password') passwordRef.current?.focus();
    else if (step === 'scan') heading.current?.focus();
  }, [step]);

  const say = (message) => setAlert({ message, at: Date.now() });
  // Cancel does nothing while a request is in flight: leaving would lose codes the server made.
  const cancel = () => { if (!inFlight.current) onCancel(); };

  async function send(request) {
    if (inFlight.current) return null;
    inFlight.current = true;
    setSending(true);
    setAlert(QUIET);
    try {
      return await request();
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  function refused(result) {
    if (result.kind === 'signedOut') { onSignedOut(); return; }
    if (result.kind === 'field') {
      setErrors({ [result.field]: result.field === 'code' ? TWO_STEP_MESSAGES.codeField : TWO_STEP_MESSAGES.passwordField });
      (result.field === 'code' ? codeRef : passwordRef).current?.focus();
      return;
    }
    if (result.kind === 'expired') {
      // Replaced or expired (D-10): back to the start, with the refusal.
      setSetup(null);
      setCode('');
      setErrors({});
      setStep('password');
      say(result.message);
      return;
    }
    say(result.message);
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (password.length === 0) {
      setErrors({ password: TWO_STEP_MESSAGES.passwordField });
      passwordRef.current?.focus();
      return;
    }
    setErrors({});
    const result = await send(() => startTwoStep({ password }));
    if (!result) return;
    if (result.kind === 'started') {
      setPassword('');
      // A new key: what an earlier key's Copy said no longer applies.
      copyKey.reset();
      setSetup(result.setup);
      setStep('scan');
      return;
    }
    refused(result);
  }

  async function submitCode(event) {
    event.preventDefault();
    const normalised = normaliseCode(code);
    if (normalised === null) {
      setErrors({ code: TWO_STEP_MESSAGES.codeField });
      codeRef.current?.focus();
      return;
    }
    setErrors({});
    const result = await send(() => confirmTwoStep({ setupId: setup.setupId, code: normalised }));
    if (!result) return;
    if (result.kind === 'codes') {
      // The secret is no longer needed: only the installation's name stays, for the file.
      setSetup((current) => ({ installationName: current.installationName }));
      setCode('');
      setCodes(result.codes);
      setStep('codes');
      return;
    }
    // A wrong code keeps step 2 and what was typed.
    refused(result);
  }

  if (step === 'codes') {
    return (
      <RecoveryCodes
        codes={codes} installationName={setup.installationName} email={email}
        headingLevel={headingLevel} doneLabel={doneLabel} onDone={onDone}
      />
    );
  }

  if (step === 'scan') {
    return (
      <div className="two-step-step" data-step="scan">
        <Heading level={headingLevel} headingRef={heading} className="two-step-heading">Scan this code with your authenticator app</Heading>
        <QrCode text={setup.otpauthUri} label={qrLabel(setup.installationName)}/>
        <p className="two-step-text">Can&apos;t scan it? Enter this key in the app instead:</p>
        <p ref={keyRef} className="two-step-key" data-testid="two-step-key">{groupedKey(setup.secret)}</p>
        <div className="two-step-row">
          <button type="button" className="two-step-secondary" onClick={() => copyKey.run(setup.secret, keyRef)}>Copy key</button>
          <p role="status" className={copyKey.failed ? 'two-step-copy-status two-step-copy-failed' : 'two-step-copy-status'} data-testid="two-step-key-copy-status">
            {copyKey.status}
          </p>
        </div>
        <p className="two-step-text" data-testid="two-step-entry-name">{entryNameLine(setup.installationName, setup.email)}</p>
        <Alert alert={alert}/>
        <form className="two-step-form" noValidate onSubmit={submitCode}>
          <CodeField id="two-step-setup-code" value={code} onChange={(value) => { setCode(value); setErrors({}); }} error={errors.code} inputRef={codeRef}/>
          <div className="two-step-row">
            <button type="submit" className="two-step-button" aria-disabled={sending ? true : undefined}>Turn on</button>
            <button type="button" className="two-step-secondary" onClick={cancel} aria-disabled={sending ? true : undefined}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="two-step-step" data-step="password">
      <Heading level={headingLevel} headingRef={heading} className="two-step-heading">Confirm it is you</Heading>
      <p className="two-step-text">Enter your password to set up two-step verification.</p>
      <Alert alert={alert}/>
      <form className="two-step-form" noValidate onSubmit={submitPassword}>
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden/>
        <PasswordField id="two-step-setup-password" value={password} onChange={(value) => { setPassword(value); setErrors({}); }} error={errors.password} inputRef={passwordRef}/>
        <div className="two-step-row">
          <button type="submit" className="two-step-button" aria-disabled={sending ? true : undefined}>Continue</button>
          <button type="button" className="two-step-secondary" onClick={cancel} aria-disabled={sending ? true : undefined}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
