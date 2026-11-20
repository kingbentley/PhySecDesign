import React, { Suspense, lazy, useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { RevisionReviewPage } from "./RevisionReview.jsx";
import { readReviewLink } from "./reviewClient.js";
import { SETUP_PATH, isSetupPath, readSetupState } from "./admin/setupState.js";
import "./styles.css";

// The set-up page (S-25) loads only when it is needed.
const SetupPage = lazy(() => import("./admin/SetupPage.jsx"));

// If the set-up page's code cannot be loaded (a dropped connection, or a deploy replaced the
// files the page was built with), say so instead of leaving the page blank.
class SetupLoadBoundary extends React.Component {
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
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>The set-up page could not be loaded</h1>
        <p style={{ marginBottom: 16 }}>Check the connection, then reload the page.</p>
        <button type="button" onClick={() => location.reload()} style={{ minHeight: 44, padding: "0 20px", border: 0, borderRadius: 8, background: "#007e73", color: "#fff", fontSize: 16, fontWeight: 700 }}>
          Reload
        </button>
      </main>
    );
  }
}

const currentHash = () => location.hash;
function observeHash(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function Workspace() {
  const hash = useSyncExternalStore(observeHash, currentHash);
  const access = readReviewLink(hash);
  return access ? <RevisionReviewPage key={hash} access={access}/> : <App/>;
}

// While the installation has no users, every address shows set-up at /setup (story 1.2). Once an
// administrator exists, /setup (or /setup/) says set-up is complete and the rest is the prototype as before
// (D-5). If the state cannot be read (for example in the Sites package, which has no server
// routes), the prototype opens, and /setup offers to try again.
function Start() {
  const [state, setState] = useState(null);
  useEffect(() => {
    let current = true;
    readSetupState().then((answer) => {
      if (!current) return;
      if (answer === "open" && !isSetupPath(location.pathname)) history.replaceState(null, "", SETUP_PATH);
      setState(answer);
    });
    return () => { current = false; };
  }, []);
  if (state === null) return null;
  if (state === "open" || isSetupPath(location.pathname)) {
    return <SetupLoadBoundary><Suspense fallback={null}><SetupPage initialState={state}/></Suspense></SetupLoadBoundary>;
  }
  return <Workspace/>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Start />
  </React.StrictMode>,
);
