// Top-level composition root: renders the page chrome (header, title, theme
// toggle), then wires the single useShoutouts() instance into the form and
// grid below it. Owns no business logic of its own — it only lifts state
// from the hook and threads the props each child already contracts for.

import { useShoutouts } from "@/hooks/useShoutouts";
import { ShoutoutForm } from "@/components/shoutouts/ShoutoutForm";
import { ShoutoutGrid } from "@/components/shoutouts/ShoutoutGrid";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function App(): JSX.Element {
  const { shoutouts, isLoading, error, addShoutout, refetch } = useShoutouts();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="bg-black">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 py-8 sm:py-10">
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
              Team Shoutout Board
            </h1>
            <p className="mt-1 text-sm text-neutral-300">
              Celebrate a teammate — post a quick shoutout for the whole team to see.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:py-10">
        <ShoutoutForm onCreated={addShoutout} />

        <ShoutoutGrid shoutouts={shoutouts} isLoading={isLoading} error={error} onRetry={refetch} />
      </div>
    </div>
  );
}
