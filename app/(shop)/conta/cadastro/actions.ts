"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_REFRESH_COOKIE } from "@/lib/customer-session";
import { extractApiErrorMessage } from "@/lib/api-errors";
import type { TokenPair } from "@/lib/types";

const BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

export type RegisterState = {
  error: string | null;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const password = formData.get("password") as string;
  const consentTerms = formData.get("consent_terms") === "on";
  const consentPrivacy = formData.get("consent_privacy") === "on";
  const consentMarketing = formData.get("consent_marketing") === "on";
  const consentAnalytics = formData.get("consent_analytics") === "on";

  if (!name || !email || !password) {
    return { error: "Nome, e-mail e senha são obrigatórios" };
  }

  if (!consentTerms || !consentPrivacy) {
    return { error: "Você deve aceitar os termos de uso e a política de privacidade" };
  }

  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres" };
  }

  let tokens: TokenPair;
  try {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        consent_terms: consentTerms,
        consent_privacy: consentPrivacy,
        consent_marketing: consentMarketing,
        consent_analytics: consentAnalytics,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: extractApiErrorMessage(body, "Erro ao criar conta") };
    }

    tokens = (await res.json()) as TokenPair;
  } catch {
    return { error: "Não foi possível conectar ao servidor. Tente novamente." };
  }

  const jar = await cookies();

  jar.set(CUSTOMER_SESSION_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expires_in,
  });

  jar.set(CUSTOMER_REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/conta");
}
