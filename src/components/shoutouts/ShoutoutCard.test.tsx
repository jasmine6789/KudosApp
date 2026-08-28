// Unit coverage for ShoutoutCard, focused on the one piece of real logic it
// owns: the relative-timestamp formatter. The system clock is pinned with
// vi.setSystemTime so every threshold (just now / minutes / hours / days /
// the 7-day absolute-date fallback) is asserted deterministically rather
// than depending on wall-clock timing. Also covers the emoji theme wiring
// and the accessible "from → to" heading line.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useReducedMotion } from "framer-motion";
import { ShoutoutCard } from "@/components/shoutouts/ShoutoutCard";
import type { Shoutout } from "@/types/shoutout";

// Only useReducedMotion is mocked (defaulting to "no preference") so the
// reduced-motion branch below can be flipped on deterministically — motion,
// AnimatePresence, etc. stay real.
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

const NOW = new Date("2026-08-28T12:00:00.000Z");

function shoutoutCreatedAt(createdAt: string): Shoutout {
  return {
    id: "1",
    from_name: "Ada",
    to_name: "Grace",
    message: "Nice work on the release",
    emoji: "🔥",
    created_at: createdAt,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ShoutoutCard", () => {
  it('renders "just now" for a timestamp under a minute old', () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-28T11:59:30.000Z")} />);

    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("renders minutes-ago for a timestamp under an hour old", () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-28T11:45:00.000Z")} />);

    expect(screen.getByText("15m ago")).toBeInTheDocument();
  });

  it("renders hours-ago for a timestamp under a day old", () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-28T09:00:00.000Z")} />);

    expect(screen.getByText("3h ago")).toBeInTheDocument();
  });

  it("renders days-ago for a timestamp under 7 days old", () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-26T12:00:00.000Z")} />);

    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("falls back to an absolute date once older than 7 days", () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-01T12:00:00.000Z")} />);

    expect(screen.getByText("Aug 1")).toBeInTheDocument();
    expect(screen.queryByText(/ago$/)).not.toBeInTheDocument();
  });

  it("renders the from → to line and the message", () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-28T11:00:00.000Z")} />);

    expect(screen.getByText(/Ada/)).toBeInTheDocument();
    expect(screen.getByText(/Grace/)).toBeInTheDocument();
    expect(screen.getByText("Nice work on the release")).toBeInTheDocument();
  });

  it("labels the emoji for assistive tech using the theme's meaning, not just the glyph", () => {
    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-28T11:00:00.000Z")} />);

    expect(screen.getByRole("img", { name: "On fire / crushing it" })).toHaveTextContent("🔥");
  });
});

describe("ShoutoutCard with reduced motion preferred", () => {
  afterEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it("still renders the card content when the user has requested less motion", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);

    render(<ShoutoutCard shoutout={shoutoutCreatedAt("2026-08-28T11:00:00.000Z")} />);

    expect(screen.getByText("Nice work on the release")).toBeInTheDocument();
  });
});
