// Deno tests for the shoutouts Edge Function.
//
// Run with: deno test --allow-env --allow-net supabase/functions/shoutouts/
//
// Per docs/TESTING_GUIDELINES.md §3 ("Backend"), these tests mock the
// Supabase client (never hit a live database) and cover: validation edge
// cases, GET/POST success + error mapping, and OPTIONS/CORS handling.
// `index.ts` exports `shoutoutInputSchema`, `jsonResponse`, `handleGet`,
// `handlePost`, and `handleRequest` solely so this file can exercise them
// directly — none of them change behavior.

import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import {
  handleGet,
  handlePost,
  handleRequest,
  jsonResponse,
  shoutoutInputSchema,
} from "./index.ts";

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

interface CannedResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

/** Fake client for the `.from().select().order()` chain used by handleGet. */
function fakeSupabaseForSelect(result: CannedResult): SupabaseClient {
  const fake = {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        order: (_column: string, _opts: { ascending: boolean }) =>
          Promise.resolve(result),
      }),
    }),
  };
  return fake as unknown as SupabaseClient;
}

/** Fake client for the `.from().insert().select().single()` chain used by handlePost. */
function fakeSupabaseForInsert(result: CannedResult): SupabaseClient {
  const fake = {
    from: (_table: string) => ({
      insert: (_row: Record<string, unknown>) => ({
        select: (_columns: string) => ({
          single: () => Promise.resolve(result),
        }),
      }),
    }),
  };
  return fake as unknown as SupabaseClient;
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/functions/v1/shoutouts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readJsonBody(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

const VALID_PAYLOAD = {
  from_name: "Ada Lovelace",
  to_name: "Grace Hopper",
  message: "Thanks for the code review!",
  emoji: "🔥",
};

// ---------------------------------------------------------------------------
// shoutoutInputSchema — validation branches
// ---------------------------------------------------------------------------

Deno.test("shoutoutInputSchema accepts a well-formed payload", () => {
  const result = shoutoutInputSchema.safeParse(VALID_PAYLOAD);
  assert(result.success);
});

Deno.test("shoutoutInputSchema rejects a payload missing from_name", () => {
  const { from_name: _omit, ...rest } = VALID_PAYLOAD;
  const result = shoutoutInputSchema.safeParse(rest);
  assert(!result.success);
  if (!result.success) {
    assertExists(result.error.flatten().fieldErrors.from_name);
  }
});

Deno.test("shoutoutInputSchema rejects a payload missing to_name", () => {
  const { to_name: _omit, ...rest } = VALID_PAYLOAD;
  const result = shoutoutInputSchema.safeParse(rest);
  assert(!result.success);
  if (!result.success) {
    assertExists(result.error.flatten().fieldErrors.to_name);
  }
});

Deno.test("shoutoutInputSchema rejects a message over 280 characters", () => {
  const result = shoutoutInputSchema.safeParse({
    ...VALID_PAYLOAD,
    message: "a".repeat(281),
  });
  assert(!result.success);
  if (!result.success) {
    assertExists(result.error.flatten().fieldErrors.message);
  }
});

Deno.test("shoutoutInputSchema accepts a message at exactly 280 characters", () => {
  const result = shoutoutInputSchema.safeParse({
    ...VALID_PAYLOAD,
    message: "a".repeat(280),
  });
  assert(result.success);
});

Deno.test("shoutoutInputSchema rejects an emoji outside the allowlist", () => {
  const result = shoutoutInputSchema.safeParse({
    ...VALID_PAYLOAD,
    emoji: "😀",
  });
  assert(!result.success);
  if (!result.success) {
    assertExists(result.error.flatten().fieldErrors.emoji);
  }
});

// ---------------------------------------------------------------------------
// jsonResponse
// ---------------------------------------------------------------------------

Deno.test("jsonResponse sets the status, CORS headers, and JSON content-type", async () => {
  const res = jsonResponse({ success: true, data: { ok: true } }, 200);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    res.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS",
  );
  assertEquals(res.headers.get("Content-Type"), "application/json");
  const body = await readJsonBody(res);
  assertEquals(body, { success: true, data: { ok: true } });
});

// ---------------------------------------------------------------------------
// handleGet
// ---------------------------------------------------------------------------

Deno.test("handleGet returns 200 with the fetched rows on success", async () => {
  const rows = [
    {
      id: "1",
      from_name: "Ada",
      to_name: "Grace",
      message: "Nice work",
      emoji: "🎉",
      created_at: "2026-08-28T00:00:00.000Z",
    },
  ];
  const supabase = fakeSupabaseForSelect({ data: rows, error: null });

  const res = await handleGet(supabase);

  assertEquals(res.status, 200);
  const body = await readJsonBody(res);
  assertEquals(body.success, true);
  assertEquals(body.data, rows);
});

Deno.test("handleGet returns 500 with a generic message when the select fails", async () => {
  const rawMessage = 'relation "shoutouts" does not exist';
  const supabase = fakeSupabaseForSelect({
    data: null,
    error: { message: rawMessage, code: "42P01" },
  });

  const res = await handleGet(supabase);

  assertEquals(res.status, 500);
  const body = await readJsonBody(res);
  assertEquals(body.success, false);
  assertEquals(body.error, "Failed to fetch shoutouts");
  assert(!JSON.stringify(body).includes(rawMessage));
});

// ---------------------------------------------------------------------------
// handlePost
// ---------------------------------------------------------------------------

Deno.test("handlePost returns 400 with a field-level error when to_name is missing", async () => {
  const { to_name: _omit, ...rest } = VALID_PAYLOAD;
  const supabase = fakeSupabaseForInsert({ data: null, error: null });

  const res = await handlePost(postRequest(rest), supabase);

  assertEquals(res.status, 400);
  const body = await readJsonBody(res);
  assertEquals(body.success, false);
  const details = body.details as Record<string, string[]> | undefined;
  assertExists(details?.to_name);
});

Deno.test("handlePost returns 400 when message exceeds 280 characters", async () => {
  const supabase = fakeSupabaseForInsert({ data: null, error: null });

  const res = await handlePost(
    postRequest({ ...VALID_PAYLOAD, message: "a".repeat(281) }),
    supabase,
  );

  assertEquals(res.status, 400);
  const body = await readJsonBody(res);
  assertEquals(body.success, false);
  const details = body.details as Record<string, string[]> | undefined;
  assertExists(details?.message);
});

Deno.test("handlePost returns 400 when the emoji is outside the allowlist", async () => {
  const supabase = fakeSupabaseForInsert({ data: null, error: null });

  const res = await handlePost(
    postRequest({ ...VALID_PAYLOAD, emoji: "😀" }),
    supabase,
  );

  assertEquals(res.status, 400);
  const body = await readJsonBody(res);
  assertEquals(body.success, false);
  const details = body.details as Record<string, string[]> | undefined;
  assertExists(details?.emoji);
});

Deno.test("handlePost returns 400 when the request body is not valid JSON", async () => {
  const supabase = fakeSupabaseForInsert({ data: null, error: null });
  const req = new Request("http://localhost/functions/v1/shoutouts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not json",
  });

  const res = await handlePost(req, supabase);

  assertEquals(res.status, 400);
  const body = await readJsonBody(res);
  assertEquals(body.success, false);
  assertEquals(body.error, "Request body must be valid JSON");
});

Deno.test("handlePost returns 500 with a generic message when the insert fails", async () => {
  const rawMessage =
    'duplicate key value violates unique constraint "shoutouts_pkey"';
  const supabase = fakeSupabaseForInsert({
    data: null,
    error: { message: rawMessage, code: "23505" },
  });

  const res = await handlePost(postRequest(VALID_PAYLOAD), supabase);

  assertEquals(res.status, 500);
  const body = await readJsonBody(res);
  assertEquals(body.success, false);
  assertEquals(body.error, "Failed to create shoutout");
  assert(!JSON.stringify(body).includes(rawMessage));
});

Deno.test("handlePost returns 201 with the inserted row on success", async () => {
  const insertedRow = {
    id: "42",
    from_name: VALID_PAYLOAD.from_name,
    to_name: VALID_PAYLOAD.to_name,
    message: VALID_PAYLOAD.message,
    emoji: VALID_PAYLOAD.emoji,
    created_at: "2026-08-28T00:00:00.000Z",
  };
  const supabase = fakeSupabaseForInsert({ data: insertedRow, error: null });

  const res = await handlePost(postRequest(VALID_PAYLOAD), supabase);

  assertEquals(res.status, 201);
  const body = await readJsonBody(res);
  assertEquals(body.success, true);
  assertEquals(body.data, insertedRow);
});

// ---------------------------------------------------------------------------
// handleRequest — top-level routing (OPTIONS / method not allowed / config)
// ---------------------------------------------------------------------------

Deno.test("handleRequest short-circuits an OPTIONS request to 204 with CORS headers", async () => {
  const req = new Request("http://localhost/functions/v1/shoutouts", {
    method: "OPTIONS",
  });

  const res = await handleRequest(req);

  assertEquals(res.status, 204);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    res.headers.get("Access-Control-Allow-Headers"),
    "authorization, x-client-info, apikey, content-type",
  );
  assertEquals(
    res.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS",
  );
  assertEquals(await res.text(), "");
});

Deno.test("handleRequest returns 405 for an unsupported method", async () => {
  const originalUrl = Deno.env.get("SUPABASE_URL");
  const originalKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.set("SUPABASE_URL", "http://localhost:54321");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

  try {
    const req = new Request("http://localhost/functions/v1/shoutouts", {
      method: "DELETE",
    });

    const res = await handleRequest(req);

    assertEquals(res.status, 405);
    const body = await readJsonBody(res);
    assertEquals(body.success, false);
    assertEquals(body.error, "Method DELETE not allowed");
  } finally {
    if (originalUrl === undefined) Deno.env.delete("SUPABASE_URL");
    else Deno.env.set("SUPABASE_URL", originalUrl);
    if (originalKey === undefined) Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
    else Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", originalKey);
  }
});

Deno.test("handleRequest returns 500 server misconfiguration when Supabase env vars are missing", async () => {
  const originalUrl = Deno.env.get("SUPABASE_URL");
  const originalKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const req = new Request("http://localhost/functions/v1/shoutouts", {
      method: "GET",
    });

    const res = await handleRequest(req);

    assertEquals(res.status, 500);
    const body = await readJsonBody(res);
    assertEquals(body.success, false);
    assertEquals(body.error, "Server misconfiguration");
  } finally {
    if (originalUrl !== undefined) Deno.env.set("SUPABASE_URL", originalUrl);
    if (originalKey !== undefined) {
      Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", originalKey);
    }
  }
});
