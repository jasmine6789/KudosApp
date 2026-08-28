// Unit coverage for ThemeToggle. useTheme is mocked so each test controls
// the current theme directly rather than depending on localStorage/OS
// media-query state — this component's only job is rendering that state
// and delegating clicks to toggleTheme, so that's exactly what's asserted.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

const mockedUseTheme = vi.mocked(useTheme);

describe("ThemeToggle", () => {
  it('offers to switch to dark mode when the current theme is "light"', () => {
    mockedUseTheme.mockReturnValue({ theme: "light", toggleTheme: vi.fn() });

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it('offers to switch to light mode when the current theme is "dark"', () => {
    mockedUseTheme.mockReturnValue({ theme: "dark", toggleTheme: vi.fn() });

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("calls toggleTheme once when clicked", async () => {
    const user = userEvent.setup();
    const toggleTheme = vi.fn();
    mockedUseTheme.mockReturnValue({ theme: "light", toggleTheme });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
