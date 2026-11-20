import React, { Suspense, lazy, useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { RevisionReviewPage } from "./RevisionReview.jsx";
import { readReviewLink } from "./reviewClient.js";
import { SETUP_PATH, readSetupState } from "./admin/setupState.js";
import "./styles.css";

// The set-up page (S-25) loads only when it is needed.
const SetupPage = lazy(() => import("./admin/SetupPage.jsx"));

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
// administrator exists, /setup says set-up is complete and the rest is the prototype as before
// (D-5). If the state cannot be read (for example in the Sites package, which has no server
// routes), the prototype opens, and /setup offers to try again.
function Start() {
  const [state, setState] = useState(null);
  useEffect(() => {
    let current = true;
    readSetupState().then((answer) => {
      if (!current) return;
      if (answer === "open" && location.pathname !== SETUP_PATH) history.replaceState(null, "", SETUP_PATH);
      setState(answer);
    });
    return () => { current = false; };
  }, []);
  if (state === null) return null;
  if (state === "open" || location.pathname === SETUP_PATH) {
    return <Suspense fallback={null}><SetupPage initialState={state}/></Suspense>;
  }
  return <Workspace/>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Start />
  </React.StrictMode>,
);
