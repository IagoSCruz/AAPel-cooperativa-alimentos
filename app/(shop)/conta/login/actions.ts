"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_REFRESH_COOKIE } from "@/lib/customer-session";
import { extractApiErrorMessage } from "@/lib/api-errors";
import type { TokenPair } from "@/lib/types";

const BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

export type LoginState = {
  error: string | null;
};

/**
 * Sanitize a redirect target to prevent open-redirect attacks.
 * Only same-origin paths (must start with "/" but not "//" or "/\\") are accepted.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/conta";
  if (!raw.startsWith("/")) return "/conta";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/conta";
  return raw;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = safeNext(formData.get("next") as string | null);

  if (!email || !password) {
    return { error: "E-mail e senha são obrigatórios" };
  }

  let tokens: TokenPair;
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: extractApiErrorMessage(body, "Credenciais inválidas") };
    }

    tokens = (await res.json()) as TokenPair;
  } catch {
    return { error: "Não foi possível conectar ao servidor. Tente novamente." };
  }

  const jar = await cookies();

  // Access token cookie — httpOnly, SameSite=Lax
  jar.set(CUSTOMER_SESSION_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expires_in,
  });

  // Refresh token cookie — httpOnly, longer-lived (7 days fallback)
  jar.set(CUSTOMER_REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next);
}
