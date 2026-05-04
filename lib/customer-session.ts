/**
 * Server-side customer session management.
 *
 * Mirrors the admin session pattern (lib/session.ts) but uses a separate
 * cookie name and only accepts CUSTOMER role tokens.
 *
 * The access token is a FastAPI-issued JWT signed with JWT_SECRET. It is
 * stored as an httpOnly cookie set by the login server action, and is
 * forwarded as `Authorization: Bearer` to protected API calls.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

export const CUSTOMER_SESSION_COOKIE = "aapel_customer_session";
export const CUSTOMER_REFRESH_COOKIE = "aapel_customer_refresh";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ??
    (() => {
      throw new Error("JWT_SECRET not set");
    })(),
);

export type CustomerSessionUser = {
  id: string;
  role: "CUSTOMER";
  exp: number;
};

export type CustomerSession = {
  /** The raw FastAPI access JWT used as Bearer in API calls. */
  accessToken: string;
  user: CustomerSessionUser;
};

/**
 * Read the customer session from cookies.
 * Returns null if the cookie is missing, invalid, expired, or belongs to an
 * ADMIN (admins use a separate session cookie — see lib/session.ts).
 *
 * This intentionally rejects ADMIN tokens even though they're cryptographically
 * valid — keeping the cookie scope tight prevents privilege bleed between the
 * customer-facing app and the admin panel.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }
    // Tight scope: this cookie is for CUSTOMERs only.
    if (payload.role !== "CUSTOMER") return null;
    return {
      accessToken: token,
      user: {
        id: payload.sub,
        role: payload.role as "CUSTOMER",
        exp: payload.exp ?? 0,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Require a CUSTOMER session in a Server Component or Server Action.
 * Redirects to /conta/login if not authenticated.
 */
export async function requireCustomer(
  redirectTo?: string,
): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) {
    const loginUrl = redirectTo
      ? `/conta/login?next=${encodeURIComponent(redirectTo)}`
      : "/conta/login";
    redirect(loginUrl);
  }
  return session;
}
