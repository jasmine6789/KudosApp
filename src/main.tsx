// Application entry point. Mounts the React tree into the #root element
// declared in index.html and wraps it in StrictMode. Kept intentionally
// thin — all real UI/state logic lives in App and what it composes.

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element #root was not found in index.html.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
