import React, { Suspense, lazy, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { RevisionReviewPage } from "./RevisionReview.jsx";
import { readReviewLink } from "./reviewClient.js";
import { SETUP_PATH, isSetupPath, readSession, readSetupState } from "./admin/setupState.js";
import "./styles.css";

// The set-up page (S-25) and the sign-in page (S-26) load only when they are needed.
const SetupPage = lazy(() => import("./admin/SetupPage.jsx"));
const SignInPage = lazy(() => import("./admin/SignInPage.jsx"));
const SignInUnknown = lazy(() => import("./admin/SignInPage.jsx").then((module) => ({ default: module.SignInUnknown })));

// If a page's code cannot be loaded (a dropped connection, or a deploy replaced the files the page
// was built with), say so instead of leaving the page blank.
class PageLoadBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main role="alert" style={{ maxWidth: 560, margin: "48px auto", padding: "0 16px", fontSize: 16, lineHeight: 1.5, color: "#17231f" }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>The {this.props.page} page could not be loaded</h1>
        <p style={{ marginBottom: 16 }}>Check the connection, then reload the page.</p>
        <button type="button" onClick={() => location.reload()} style={{ minHeight: 44, padding: "0 20px", border: 0, borderRadius: 8, background: "#007e73", color: "#fff", fontSize: 16, fontWeight: 700 }}>
          Reload
        </button>
      </main>
    );
  }
}

function Lazy({ page, children }) {
  return <PageLoadBoundary page={page}><Suspense fallback={null}>{children}</Suspense></PageLoadBoundary>;
}

const currentHash = () => location.hash;
function observeHash(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

/** The reviewer link in the hash, only when it is well formed (D-14, A-23); otherwise null. */
function wellFormedReviewLink(hash) {
  const access = readReviewLink(hash);
  return access?.id && access?.token ? access : null;
}

// The app once set-up is closed (story 1.3). Signed in, or where there is no server (the Sites
// package), it is the prototype, which renders the review page for any `#review=` hash as before.
// Signed out, only a well-formed reviewer link skips sign-in, also when it arrives by a hash change
// on the sign-in page (D-14); anything else shows the sign-in page. When the session read could not
// be checked, the "Sign-in cannot be checked" page offers Try again (D-7 amended).
function Signed({ session, onSignedIn, onSignedOut, onRetry }) {
  const hash = useSyncExternalStore(observeHash, currentHash);
  if (session.kind === "signedIn" || session.kind === "none") {
    const access = readReviewLink(hash);
    if (access) return <RevisionReviewPage key={hash} access={access}/>;
    const account = session.kind === "signedIn" ? { name: session.name } : null;
    return <App key={session.kind === "signedIn" ? session.name : "none"} account={account} onSignedOut={onSignedOut}/>;
  }
  const access = wellFormedReviewLink(hash);
  if (access) return <RevisionReviewPage key={hash} access={access}/>;
  if (session.kind === "unknown") return <Lazy page="sign-in"><SignInUnknown onRetry={onRetry}/></Lazy>;
  return <Lazy page="sign-in"><SignInPage installationName={session.installationName} onSignedIn={onSignedIn}/></Lazy>;
}

// While the installation has no users, every address shows set-up at /setup (story 1.2). Once an
// administrator exists, /setup (or /setup/) says set-up is complete, whatever the session, and every
// other address reads the session (story 1.3). A set-up state or session read that answers 404, or
// a reply that is not the declared JSON, means there is no server (the Sites package): the prototype
// opens. Any other failure (a network failure, no answer within 5 seconds, a 5xx or `updating`)
// shows a page with Try again: "Set-up cannot be checked" at every address, without reading the
// session, or "Sign-in cannot be checked" (D-7 amended and amended again).
function Start() {
  // { setup: "open" | "closed" | "none" | "unknown", attempt } then, once set-up is closed away
  // from /setup, the session as `readSession` gives it.
  const [setup, setSetup] = useState(null);
  const [session, setSession] = useState(null);
  const sessionNow = useRef(null);
  const installationName = useRef(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  const applySession = useCallback((next) => {
    if (!live.current) return;
    if (next.installationName !== undefined) installationName.current = next.installationName;
    sessionNow.current = next;
    setSession(next);
  }, []);

  const applySetupState = useCallback(async (state) => {
    if (!live.current) return;
    if (state === "open" && !isSetupPath(location.pathname)) history.replaceState(null, "", SETUP_PATH);
    setSetup((current) => ({ state, attempt: (current?.attempt ?? 0) + 1 }));
    if (state === "closed" && !isSetupPath(location.pathname)) applySession(await readSession());
  }, [applySession]);

  useEffect(() => {
    readSetupState().then(applySetupState);
  }, [applySetupState]);

  // D-16: when the tab becomes visible again, read the session again. Signed out shows the sign-in
  // page; another account reloads the app as that account; signed in from another tab opens the
  // app. A read that fails leaves the page as it is.
  const signedState = session?.kind;
  useEffect(() => {
    if (signedState !== "signedIn" && signedState !== "signedOut") return undefined;
    let current = true;
    async function visible() {
      if (document.visibilityState !== "visible") return;
      const next = await readSession();
      if (!current || (next.kind !== "signedIn" && next.kind !== "signedOut")) return;
      const previous = sessionNow.current;
      if (previous?.kind === "signedIn" && next.kind === "signedIn" && previous.name !== next.name) {
        location.reload();
        return;
      }
      if (previous?.kind === next.kind && previous?.name === next.name) return;
      applySession(next);
    }
    document.addEventListener("visibilitychange", visible);
    return () => {
      current = false;
      document.removeEventListener("visibilitychange", visible);
    };
  }, [signedState, applySession]);

  if (setup === null) return null;
  if (setup.state === "open" || setup.state === "unknown" || (setup.state === "closed" && isSetupPath(location.pathname))) {
    return (
      <Lazy page="set-up">
        <SetupPage key={setup.attempt} initialState={setup.state} onStateRead={setup.state === "unknown" ? applySetupState : undefined}/>
      </Lazy>
    );
  }
  if (setup.state === "none") return <Signed session={{ kind: "none" }}/>;
  if (session === null) return null;
  return (
    <Signed
      session={session}
      onSignedIn={({ name }) => applySession({ kind: "signedIn", name, installationName: installationName.current })}
      onSignedOut={() => applySession({ kind: "signedOut", installationName: installationName.current })}
      onRetry={async () => applySession(await readSession())}
    />
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Start />
  </React.StrictMode>,
);
