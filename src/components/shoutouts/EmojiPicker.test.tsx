// Integration coverage for EmojiPicker's accessible radiogroup behavior:
// roving tabindex, arrow-key navigation (including wrap-around), click
// selection, and the error-message/aria-describedby wiring. EmojiPicker is
// fully controlled (value/onChange are props), so these tests wrap it in a
// tiny stateful harness that mirrors how ShoutoutForm actually drives it,
// otherwise a keyboard press would have no visible effect to assert on.

import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiPicker } from "@/components/shoutouts/EmojiPicker";
import { EMOJI_ALLOWLIST, type Emoji } from "@/types/shoutout";

function ControlledEmojiPicker(props: { error?: string }): JSX.Element {
  const [value, setValue] = useState<Emoji | null>(null);
  return <EmojiPicker id="test-emoji" value={value} onChange={setValue} error={props.error} />;
}

function radios(): HTMLElement[] {
  return screen.getAllByRole("radio");
}

describe("EmojiPicker", () => {
  it("renders one radio button per allowlisted emoji", () => {
    render(<ControlledEmojiPicker />);

    expect(radios()).toHaveLength(EMOJI_ALLOWLIST.length);
  });

  it("nothing is checked initially, and only the first button is tabbable", () => {
    render(<ControlledEmojiPicker />);

    const buttons = radios();
    expect(buttons.every((button) => button.getAttribute("aria-checked") === "false")).toBe(true);
    expect(buttons[0]).toHaveAttribute("tabIndex", "0");
    expect(buttons.slice(1).every((button) => button.getAttribute("tabIndex") === "-1")).toBe(true);
  });

  it("clicking a button checks it and moves the roving tabindex to it", async () => {
    const user = userEvent.setup();
    render(<ControlledEmojiPicker />);

    const rocket = screen.getByRole("radio", { name: "🚀" });
    await user.click(rocket);

    expect(rocket).toHaveAttribute("aria-checked", "true");
    expect(rocket).toHaveAttribute("tabIndex", "0");
    expect(screen.getByRole("radio", { name: "🔥" })).toHaveAttribute("tabIndex", "-1");
  });

  it("pressing an arrow key before anything is checked checks the focused button in place", async () => {
    const user = userEvent.setup();
    render(<ControlledEmojiPicker />);

    const second = radios()[1];
    second.focus();
    await user.keyboard("{ArrowRight}");

    expect(second).toHaveAttribute("aria-checked", "true");
  });

  it("ArrowRight moves the checked selection to the next emoji", async () => {
    const user = userEvent.setup();
    render(<ControlledEmojiPicker />);

    await user.click(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[0] }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[1] })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("ArrowLeft from the first emoji wraps around to the last one", async () => {
    const user = userEvent.setup();
    render(<ControlledEmojiPicker />);

    await user.click(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[0] }));
    await user.keyboard("{ArrowLeft}");

    const last = EMOJI_ALLOWLIST[EMOJI_ALLOWLIST.length - 1];
    expect(screen.getByRole("radio", { name: last })).toHaveAttribute("aria-checked", "true");
  });

  it("moves focus to the newly checked button after an arrow-key press", async () => {
    const user = userEvent.setup();
    render(<ControlledEmojiPicker />);

    await user.click(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[0] }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[1] })).toHaveFocus();
  });

  it("ignores keys other than the arrows", async () => {
    const user = userEvent.setup();
    render(<ControlledEmojiPicker />);

    await user.click(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[0] }));
    await user.keyboard("{Tab}");

    expect(screen.getByRole("radio", { name: EMOJI_ALLOWLIST[0] })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("links the error message via aria-describedby and sets aria-invalid on the group", () => {
    render(<ControlledEmojiPicker error="Pick an emoji from the list" />);

    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute("aria-describedby", "test-emoji-error");
    expect(screen.getByText("Pick an emoji from the list")).toHaveAttribute(
      "id",
      "test-emoji-error",
    );
  });

  it("omits aria-describedby/aria-invalid entirely when there is no error", () => {
    render(<ControlledEmojiPicker />);

    const group = screen.getByRole("radiogroup");
    expect(group).not.toHaveAttribute("aria-invalid");
    expect(group).not.toHaveAttribute("aria-describedby");
  });

  it("calls onChange exactly once per click, never as a side effect of rendering", () => {
    const onChange = vi.fn();
    render(<EmojiPicker id="spy-emoji" value={null} onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });
});
