/**
 * Admin login page — full-screen, no sidebar.
 *
 * Lives outside the (panel) route group so it isn't subject to the auth
 * guard layout. Submits via Server Action `loginAction`.
 */

"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Leaf } from "lucide-react";

import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = { status: "idle" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");

  const message =
    state.status === "error"
      ? state.message
      : queryError === "forbidden"
        ? "Sessão sem permissão de administrador."
        : null;

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold">AAPel — Painel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso restrito a administradores
          </p>
        </div>

        <form
          action={formAction}
          className="rounded-xl bg-card p-6 shadow-sm space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {message && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AAPel · Cooperativa de Alimentos
        </p>
      </div>
    </div>
  );
}
