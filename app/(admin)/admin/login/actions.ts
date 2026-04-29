"use server";

/**
 * Login server action.
 *
 * Calls FastAPI /api/auth/login, verifies the returned access token, and
 * sets it as an httpOnly+Secure+SameSite=Lax cookie. Redirects to /admin
 * on success.
 *
 * Non-admin users are rejected with a clear error so customers don't end
 * up with admin-tagged sessions.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

import { SESSION_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const API_BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ??
    (() => {
      throw new Error("JWT_SECRET not set");
    })(),
);

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { status: "error", message: "Informe email e senha." };
  }

  // Call FastAPI
  let tokens: TokenPair;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const msg =
        (detail as { detail?: string })?.detail ?? "Credenciais inválidas.";
      return { status: "error", message: msg };
    }
    tokens = (await res.json()) as TokenPair;
  } catch (e) {
    return {
      status: "error",
      message: "Não foi possível contactar o servidor. Tente novamente.",
    };
  }

  // Verify the access token shape and admin role
  let role: string | undefined;
  try {
    const { payload } = await jwtVerify(tokens.access_token, SECRET);
    role = typeof payload.role === "string" ? payload.role : undefined;
  } catch {
    return { status: "error", message: "Token inválido recebido do servidor." };
  }

  if (role !== "ADMIN") {
    return {
      status: "error",
      message: "Esta área é exclusiva para administradores.",
    };
  }

  // Set cookies
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: tokens.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expires_in,
  });
  jar.set({
    name: REFRESH_COOKIE,
    value: tokens.refresh_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7, // 7d (matches FastAPI default)
  });

  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect("/admin/login");
}
