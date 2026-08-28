// Unit tests for useTheme: localStorage-backed dark-mode state with a
// prefers-color-scheme fallback, per docs/TESTING_GUIDELINES.md §1.

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "@/hooks/useTheme";

function mockMatchMedia(prefersDark: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: prefersDark && query === "(prefers-color-scheme: dark)",
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to light when there is no stored preference and the OS prefers light", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back to dark when the OS prefers dark and nothing is stored", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads a previously stored theme over the OS preference", () => {
    window.localStorage.setItem("shoutout-board-theme", "dark");
    mockMatchMedia(false);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme flips the theme, updates the DOM class, and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("shoutout-board-theme")).toBe("dark");

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("shoutout-board-theme")).toBe("light");
  });

  it("ignores an unrecognized stored value and falls back to the OS preference", () => {
    window.localStorage.setItem("shoutout-board-theme", "not-a-theme");

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
  });

  it("falls back to the OS preference when reading localStorage throws (privacy mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: storage is disabled");
    });
    mockMatchMedia(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
  });

  it("still flips the in-memory theme when persisting to localStorage throws", () => {
    const { result } = renderHook(() => useTheme());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
