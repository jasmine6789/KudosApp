// Frontend mirror of the Zod schema enforced in
// supabase/functions/shoutouts/index.ts. This copy exists only for fast
// inline form feedback — the Edge Function's schema is the real security
// boundary. Any change here must be mirrored there in the same PR.

import { z } from "zod";

export const EMOJI_ALLOWLIST = ["🔥", "👏", "❤️", "🚀", "🎉", "🌟", "💡", "🙌"] as const;

export type Emoji = (typeof EMOJI_ALLOWLIST)[number];

export const shoutoutInputSchema = z.object({
  from_name: z.string().trim().min(1, "From is required").max(100),
  to_name: z.string().trim().min(1, "To is required").max(100),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(280, "Message must be 280 characters or fewer"),
  emoji: z.enum(EMOJI_ALLOWLIST, {
    errorMap: () => ({ message: "Pick an emoji from the list" }),
  }),
});

export interface ShoutoutInput {
  from_name: string;
  to_name: string;
  message: string;
  emoji: Emoji;
}

export interface Shoutout {
  id: string;
  from_name: string;
  to_name: string;
  message: string;
  emoji: Emoji;
  created_at: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[] | undefined>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
