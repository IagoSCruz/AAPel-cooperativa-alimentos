/**
 * Server-side HTTP client for the FastAPI backend.
 *
 * - Reads the access token from the admin session cookie when available,
 *   attaches it as `Authorization: Bearer ...`.
 * - Always uses `cache: "no-store"` (admin data is fresh-by-default).
 * - Throws a typed `ApiError` on non-2xx so server components can `try/catch`
 *   or let it bubble to error boundaries.
 *
 * In dev: INTERNAL_API_URL is unset → falls back to http://localhost:8000.
 * In prod: INTERNAL_API_URL=http://api:8000 (compose service name).
 */

import { getSession } from "@/lib/session";

const BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public payload?: unknown,
  ) {
    super(`API ${status}: ${detail}`);
  }
}

type FetchOptions = RequestInit & {
  /** If true, skip attaching the admin session token (e.g. login). */
  noAuth?: boolean;
};

export async function apiFetch<T>(path: string, init: FetchOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!init.noAuth) {
    const session = await getSession();
    if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  if (!res.ok) {
    let detail: string;
    let payload: unknown;
    try {
      payload = await res.json();
      detail =
        (payload as { detail?: string; title?: string })?.detail ??
        (payload as { title?: string })?.title ??
        res.statusText;
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail, payload);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
