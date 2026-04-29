/**
 * Server-side session management for the admin panel.
 *
 * The admin uses bare httpOnly cookies (no NextAuth on Phase 2B) — the cookie
 * holds the FastAPI access token, which is a JWT signed by the same JWT_SECRET
 * shared between Next.js and the FastAPI backend.
 *
 * Phase 3 will replace this with NextAuth.js + customer auth in a unified flow.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

export const SESSION_COOKIE = "aapel_admin_session";
export const REFRESH_COOKIE = "aapel_admin_refresh";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ??
    (() => {
      throw new Error("JWT_SECRET not set");
    })(),
);

export type SessionUser = {
  id: string;
  role: "CUSTOMER" | "ADMIN";
  exp: number; // unix seconds
};

export type Session = {
  /** The FastAPI access JWT (used as Bearer for /api/admin/* calls). */
  accessToken: string;
  user: SessionUser;
};

/**
 * Read the session from cookies. Returns null if missing/invalid/expired.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return {
      accessToken: token,
      user: {
        id: payload.sub,
        role: payload.role as "CUSTOMER" | "ADMIN",
        exp: payload.exp ?? 0,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Require an ADMIN session in a Server Component / Server Action.
 * Redirects to /admin/login if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/admin/login?error=forbidden");
  }
  return session;
}
