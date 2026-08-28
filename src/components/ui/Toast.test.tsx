// Unit coverage for Toast: it's a portal, so the main thing worth verifying
// is that the message actually reaches document.body (not just some
// detached subtree) and that visible correctly gates whether it's there.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "@/components/ui/Toast";

describe("Toast", () => {
  it("renders the message into document.body when visible", () => {
    render(<Toast message="Shoutout posted! 🎉" visible={true} />);

    expect(screen.getByText("Shoutout posted! 🎉")).toBeInTheDocument();
  });

  it("renders nothing when not visible", () => {
    render(<Toast message="Shoutout posted! 🎉" visible={false} />);

    expect(screen.queryByText("Shoutout posted! 🎉")).not.toBeInTheDocument();
  });

  it("announces itself via aria-live so screen readers pick it up without scanning", () => {
    render(<Toast message="Shoutout posted! 🎉" visible={true} />);

    const message = screen.getByText("Shoutout posted! 🎉");
    expect(message.closest('[aria-live="polite"]')).not.toBeNull();
  });
});
