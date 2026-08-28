// Integration coverage for ShoutoutForm: renders the real component tree
// (Input/Textarea/EmojiPicker/Button) with only "@/lib/api" mocked, so no
// network call ever happens while the real useCreateShoutout hook still owns
// in-flight/error state exactly as it does in production. Covers client-side
// validation surfacing, the live character counter, the submitting/disabled
// state, and both the success and failure paths through onCreated and the
// error banner.

import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShoutoutForm } from "@/components/shoutouts/ShoutoutForm";
import { ApiError, createShoutout } from "@/lib/api";
import type { Shoutout } from "@/types/shoutout";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    createShoutout: vi.fn(),
  };
});

const mockedCreateShoutout = vi.mocked(createShoutout);

const VALID_SHOUTOUT: Shoutout = {
  id: "a1b2c3d4-0000-4000-8000-000000000000",
  from_name: "Ada Lovelace",
  to_name: "Grace Hopper",
  message: "Shipped the new onboarding flow ahead of schedule!",
  emoji: "🔥",
  created_at: "2026-08-28T09:30:00.000Z",
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText("From"), VALID_SHOUTOUT.from_name);
  await user.type(screen.getByLabelText("To"), VALID_SHOUTOUT.to_name);
  await user.type(screen.getByLabelText("Message"), VALID_SHOUTOUT.message);
  await user.click(screen.getByRole("radio", { name: VALID_SHOUTOUT.emoji }));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("ShoutoutForm", () => {
  it("shows a validation error when submitting with an empty required field", async () => {
    const user = userEvent.setup();
    render(<ShoutoutForm onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Post shoutout" }));

    expect(await screen.findByText("From is required")).toBeInTheDocument();
    expect(mockedCreateShoutout).not.toHaveBeenCalled();
  });

  it("shows the live character counter updating as the user types", async () => {
    const user = userEvent.setup();
    render(<ShoutoutForm onCreated={vi.fn()} />);

    expect(screen.getByText("0 / 280")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Message"), "Hello team");

    expect(screen.getByText("10 / 280")).toBeInTheDocument();
  });

  it("turns the character counter bold/red once within 20 characters of the limit", async () => {
    const user = userEvent.setup();
    render(<ShoutoutForm onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText("Message"), "a".repeat(261));

    const counter = screen.getByText("261 / 280");
    expect(counter).toHaveClass("font-bold", "text-rose-600");
  });

  it("shows a loading/disabled state while submitting", async () => {
    const user = userEvent.setup();
    let resolveCreate: ((shoutout: Shoutout) => void) | undefined;
    mockedCreateShoutout.mockImplementation(
      () =>
        new Promise<Shoutout>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(<ShoutoutForm onCreated={vi.fn()} />);
    await fillValidForm(user);

    const submitButton = screen.getByRole("button", { name: "Post shoutout" });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("From")).toBeDisabled();

    resolveCreate?.(VALID_SHOUTOUT);
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it("calls onCreated with the returned shoutout on success and clears the form", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    mockedCreateShoutout.mockResolvedValue(VALID_SHOUTOUT);

    render(<ShoutoutForm onCreated={onCreated} />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Post shoutout" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(VALID_SHOUTOUT));
    expect(screen.getByLabelText("From")).toHaveValue("");
    expect(screen.getByLabelText("To")).toHaveValue("");
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("shows the server error banner without clearing field values when the mocked call rejects", async () => {
    const user = userEvent.setup();
    mockedCreateShoutout.mockRejectedValue(new ApiError("Server error — please try again", 500));

    render(<ShoutoutForm onCreated={vi.fn()} />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Post shoutout" }));

    expect(await screen.findByText("Server error — please try again")).toBeInTheDocument();
    expect(screen.getByLabelText("From")).toHaveValue(VALID_SHOUTOUT.from_name);
    expect(screen.getByLabelText("To")).toHaveValue(VALID_SHOUTOUT.to_name);
    expect(screen.getByLabelText("Message")).toHaveValue(VALID_SHOUTOUT.message);
  });
});
