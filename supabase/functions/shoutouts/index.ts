// Supabase Edge Function: shoutouts
// GET  -> list all shoutouts, newest first
// POST -> validate and insert a new shoutout
//
// Runs on the Deno runtime, not Node — pinned npm:/jsr: imports, Deno.env
// for secrets, and hand-rolled CORS/OPTIONS handling (no Express-style
// middleware here).

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const EMOJI_ALLOWLIST = [
  "🔥",
  "👏",
  "❤️",
  "🚀",
  "🎉",
  "🌟",
  "💡",
  "🙌",
] as const;

export const shoutoutInputSchema = z.object({
  from_name: z.string().trim().min(1, "from_name is required").max(100),
  to_name: z.string().trim().min(1, "to_name is required").max(100),
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(280, "message must be 280 characters or fewer"),
  emoji: z.enum(EMOJI_ALLOWLIST, {
    errorMap: () => ({
      message: `emoji must be one of: ${EMOJI_ALLOWLIST.join(" ")}`,
    }),
  }),
});

type ShoutoutInput = z.infer<typeof shoutoutInputSchema>;

interface Shoutout {
  id: string;
  from_name: string;
  to_name: string;
  message: string;
  emoji: string;
  created_at: string;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function jsonResponse(
  body: SuccessResponse<unknown> | ErrorResponse,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function getSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function handleGet(supabase: SupabaseClient): Promise<Response> {
  const { data, error } = await supabase
    .from("shoutouts")
    .select("id, from_name, to_name, message, emoji, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("shoutouts GET failed:", error);
    return jsonResponse(
      { success: false, error: "Failed to fetch shoutouts" },
      500,
    );
  }

  return jsonResponse({ success: true, data: data as Shoutout[] }, 200);
}

export async function handlePost(
  req: Request,
  supabase: SupabaseClient,
): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonResponse({
      success: false,
      error: "Request body must be valid JSON",
    }, 400);
  }

  const parsed = shoutoutInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonResponse(
      {
        success: false,
        error: "Invalid shoutout payload",
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const input: ShoutoutInput = parsed.data;

  const { data, error } = await supabase
    .from("shoutouts")
    .insert({
      from_name: input.from_name,
      to_name: input.to_name,
      message: input.message,
      emoji: input.emoji,
    })
    .select("id, from_name, to_name, message, emoji, created_at")
    .single();

  if (error) {
    console.error("shoutouts POST failed:", error);
    return jsonResponse(
      { success: false, error: "Failed to create shoutout" },
      500,
    );
  }

  return jsonResponse({ success: true, data: data as Shoutout }, 201);
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    console.error("shoutouts config error:", err);
    return jsonResponse(
      { success: false, error: "Server misconfiguration" },
      500,
    );
  }

  try {
    switch (req.method) {
      case "GET":
        return await handleGet(supabase);
      case "POST":
        return await handlePost(req, supabase);
      default:
        return jsonResponse(
          { success: false, error: `Method ${req.method} not allowed` },
          405,
        );
    }
  } catch (err) {
    console.error("shoutouts unhandled error:", err);
    return jsonResponse(
      { success: false, error: "Internal server error" },
      500,
    );
  }
}

// Only start the server when this module is the entrypoint (the edge
// runtime invokes it directly) — not when index_test.ts imports it, which
// would otherwise bind a real port as an import side effect.
if (import.meta.main) {
  Deno.serve(handleRequest);
}
