/**
 * Public-facing HTTP client for the FastAPI backend.
 *
 * Two variants:
 *  - publicFetch   — unauthenticated, uses Next.js `next.revalidate` caching.
 *  - authedFetch   — attaches a Bearer token, always `no-store`.
 *
 * Both throw a typed ApiPublicError on non-2xx so callers can try/catch or
 * bubble to Next.js error boundaries.
 *
 * Both functions run server-side only (RSC pages / Server Actions) so they
 * can use the internal service URL.
 *
 * In dev: INTERNAL_API_URL is unset → falls back to http://localhost:8000.
 * In prod: INTERNAL_API_URL=http://api:8000 (compose service name).
 */

const BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

export class ApiPublicError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public payload?: unknown,
  ) {
    super(`API ${status}: ${detail}`);
  }
}

async function _handleResponse<T>(res: Response): Promise<T> {
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
    throw new ApiPublicError(res.status, detail, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Unauthenticated — with ISR revalidation support
// ---------------------------------------------------------------------------

type PublicFetchOptions = {
  /**
   * Time in seconds to cache the response.
   * - `number` → ISR with that TTL
   * - `false`  → bypass cache entirely (always fetch fresh)
   *
   * Default: 60s.
   */
  revalidate?: number | false;
  tags?: string[];
};

export async function publicFetch<T>(
  path: string,
  { revalidate = 60, tags }: PublicFetchOptions = {},
): Promise<T> {
  // `revalidate: false` → fully bypass the Data Cache. Using `cache: "no-store"`
  // is the correct primitive — `next.revalidate: 0` means "always revalidate"
  // (still cached for the duration of the request) which has different
  // semantics than "don't cache at all".
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } =
    revalidate === false
      ? { cache: "no-store" }
      : { next: { revalidate, tags } };

  const res = await fetch(`${BASE}${path}`, init);
  return _handleResponse<T>(res);
}

// ---------------------------------------------------------------------------
// Authenticated — always fresh, Bearer from caller
// ---------------------------------------------------------------------------

type AuthedFetchOptions = RequestInit & {
  token: string;
};

export async function authedFetch<T>(
  path: string,
  { token, ...init }: AuthedFetchOptions,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  return _handleResponse<T>(res);
}
