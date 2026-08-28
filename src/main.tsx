// Application entry point. Mounts the React tree into the #root element
// declared in index.html. Loading "./App" is deferred behind a dynamic
// import specifically so a startup-time failure (most commonly: missing or
// invalid VITE_* environment variables, thrown by src/config/env.ts at
// module-evaluation time) can be caught and shown on the page — a
// synchronous top-level import can't be try/caught, and would otherwise
// leave visitors looking at a silently blank #root with no clue why.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// StartupError is a one-off fallback screen for this entry point; a
// dedicated file for a single-use component here would be pure ceremony.
// eslint-disable-next-line react-refresh/only-export-components
function StartupError(props: { message: string }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-rose-700 dark:text-rose-400">
          Couldn't start the app
        </h1>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-slate-700 dark:text-slate-300">
          {props.message}
        </pre>
      </div>
    </div>
  );
}

function toStartupMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element #root was not found in index.html.");
}

const root = createRoot(rootElement);

import("./App")
  .then(({ App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console -- intentional startup diagnostic, not app logging
    console.error("Failed to start the app:", error);
    root.render(<StartupError message={toStartupMessage(error)} />);
  });
