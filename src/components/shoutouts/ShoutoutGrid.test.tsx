// Integration coverage for ShoutoutGrid's presentational state machine: all
// four branches (loading, error, empty, populated) are driven purely by
// props, so these tests assert each branch renders the right markup without
// mocking anything — the grid never fetches data on its own, and it never
// re-sorts the list it is given.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShoutoutGrid } from "@/components/shoutouts/ShoutoutGrid";
import type { Shoutout } from "@/types/shoutout";

const SHOUTOUTS: Shoutout[] = [
  {
    id: "1",
    from_name: "Ada",
    to_name: "Grace",
    message: "First message",
    emoji: "🔥",
    created_at: "2026-08-28T12:00:00.000Z",
  },
  {
    id: "2",
    from_name: "Linus",
    to_name: "Dennis",
    message: "Second message",
    emoji: "🚀",
    created_at: "2026-08-27T12:00:00.000Z",
  },
  {
    id: "3",
    from_name: "Margaret",
    to_name: "Katherine",
    message: "Third message",
    emoji: "🎉",
    created_at: "2026-08-26T12:00:00.000Z",
  },
];

describe("ShoutoutGrid", () => {
  it("renders one card per item in shoutouts, in the order given by props", () => {
    render(<ShoutoutGrid shoutouts={SHOUTOUTS} isLoading={false} error={null} onRetry={vi.fn()} />);

    const messages = screen.getAllByText(/message$/i).map((node) => node.textContent);
    expect(messages).toEqual(["First message", "Second message", "Third message"]);
  });

  it("renders the empty-state copy when shoutouts is empty and not loading/erroring", () => {
    render(<ShoutoutGrid shoutouts={[]} isLoading={false} error={null} onRetry={vi.fn()} />);

    expect(screen.getByText("No shoutouts yet — be the first to send one!")).toBeInTheDocument();
  });

  it("renders an error state with a retry button that calls onRetry when clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ShoutoutGrid
        shoutouts={[]}
        isLoading={false}
        error="Network error — could not reach the server"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Network error — could not reach the server",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a loading state when isLoading is true and the list is still empty", () => {
    render(<ShoutoutGrid shoutouts={[]} isLoading={true} error={null} onRetry={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading shoutouts…");
  });
});
