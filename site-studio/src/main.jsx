import React, { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { RevisionReviewPage } from "./RevisionReview.jsx";
import { readReviewLink } from "./reviewClient.js";
import "./styles.css";

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

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Workspace />
  </React.StrictMode>,
);
