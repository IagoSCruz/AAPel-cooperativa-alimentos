"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  // Only forward same-origin paths — server action revalidates, but we clean
  // the input here so users see the safe value in the URL.
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/conta";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
        </div>

        <h1 className="mt-6 text-center font-serif text-3xl font-bold text-foreground">
          Entrar na sua conta
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Acesse seus pedidos e gerencie sua assinatura
        </p>

        <form action={action} className="mt-8 space-y-6">
          {/* Hidden: pass ?next redirect through the form */}
          <input type="hidden" name="next" value={next} />

          {state.error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Senha
              </label>
              <Link
                href="/conta/recuperar-senha"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Sua senha"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/conta/cadastro"
            className="font-medium text-primary hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
