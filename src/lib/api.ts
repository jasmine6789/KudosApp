// Typed client wrapper around the `shoutouts` Edge Function. All Supabase
// REST/Edge Function calls in the app must go through this module, no raw
// `fetch` calls scattered across components/hooks.

import { env } from "@/config/env";
import type { ApiResponse, Shoutout, ShoutoutInput } from "@/types/shoutout";

const SHOUTOUTS_ENDPOINT = `${env.VITE_SUPABASE_FUNCTIONS_URL}/shoutouts`;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[] | undefined>;

  constructor(message: string, status: number, details?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("apikey", env.VITE_SUPABASE_ANON_KEY);
  headers.set("Authorization", `Bearer ${env.VITE_SUPABASE_ANON_KEY}`);
  return headers;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return typeof value === "object" && value !== null && "success" in value;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: buildHeaders(init?.headers),
    });
  } catch {
    throw new ApiError("Network error: could not reach the server", 0, undefined);
  }

  const body = await parseJsonSafely(response);

  if (!isApiResponse<T>(body)) {
    throw new ApiError(
      `Unexpected response shape from server (status ${response.status})`,
      response.status,
    );
  }

  if (!response.ok || !body.success) {
    const message = !body.success ? body.error : `Request failed with status ${response.status}`;
    const details = !body.success ? body.details : undefined;

    if (response.status === 400) {
      throw new ApiError(message ?? "Invalid request", 400, details);
    }
    if (response.status >= 500) {
      throw new ApiError(message ?? "Server error, please try again", response.status, details);
    }
    throw new ApiError(message ?? "Request failed", response.status, details);
  }

  return body.data;
}

export async function getShoutouts(): Promise<Shoutout[]> {
  return request<Shoutout[]>(SHOUTOUTS_ENDPOINT, {
    method: "GET",
  });
}

export async function createShoutout(input: ShoutoutInput): Promise<Shoutout> {
  return request<Shoutout>(SHOUTOUTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}
