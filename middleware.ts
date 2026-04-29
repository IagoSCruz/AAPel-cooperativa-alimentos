/**
 * Edge middleware — protects /admin/* routes (except /admin/login).
 *
 * Verifies the session cookie's signature and role. The actual auth check is
 * also enforced at the (panel) layout level (defense in depth), but doing it
 * here returns 302 before any RSC work for unauthenticated requests.
 */

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { SESSION_COOKIE } from "@/lib/session";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login and its assets through
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== "ADMIN") {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
