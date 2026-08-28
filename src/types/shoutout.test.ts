// Unit tests for shoutoutInputSchema, the frontend's fast-feedback mirror
// of the Edge Function's validation contract. Every case here asserts
// through .safeParse(...).success rather than a throwing .parse(), matching
// how the app itself is meant to call the schema, and checks the specific
// failing field via .error.issues so a regression that flags the wrong
// field (not just "something failed") gets caught.

import { describe, expect, it } from "vitest";
import { EMOJI_ALLOWLIST, shoutoutInputSchema, type ShoutoutInput } from "@/types/shoutout";

const validInput: ShoutoutInput = {
  from_name: "Ada",
  to_name: "Grace",
  message: "Thanks for reviewing my PR so quickly!",
  emoji: "🚀",
};

function fieldPaths(result: ReturnType<typeof shoutoutInputSchema.safeParse>): string[] {
  if (result.success) {
    return [];
  }
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("shoutoutInputSchema", () => {
  it("accepts a valid payload", () => {
    const result = shoutoutInputSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it("rejects a message over 280 characters", () => {
    const result = shoutoutInputSchema.safeParse({
      ...validInput,
      message: "a".repeat(281),
    });

    expect(result.success).toBe(false);
    expect(fieldPaths(result)).toContain("message");
  });

  it("rejects an empty from_name", () => {
    const result = shoutoutInputSchema.safeParse({
      ...validInput,
      from_name: "",
    });

    expect(result.success).toBe(false);
    expect(fieldPaths(result)).toContain("from_name");
  });

  it("rejects a whitespace-only to_name", () => {
    const result = shoutoutInputSchema.safeParse({
      ...validInput,
      to_name: "   ",
    });

    expect(result.success).toBe(false);
    expect(fieldPaths(result)).toContain("to_name");
  });

  it("rejects an emoji that isn't in EMOJI_ALLOWLIST", () => {
    const result = shoutoutInputSchema.safeParse({
      ...validInput,
      emoji: "😀",
    });

    expect(result.success).toBe(false);
    expect(fieldPaths(result)).toContain("emoji");
    expect(EMOJI_ALLOWLIST as readonly string[]).not.toContain("😀");
  });

  it("rejects a payload missing the message field", () => {
    const withoutMessage = {
      from_name: validInput.from_name,
      to_name: validInput.to_name,
      emoji: validInput.emoji,
    };

    const result = shoutoutInputSchema.safeParse(withoutMessage);

    expect(result.success).toBe(false);
    expect(fieldPaths(result)).toContain("message");
  });
});
