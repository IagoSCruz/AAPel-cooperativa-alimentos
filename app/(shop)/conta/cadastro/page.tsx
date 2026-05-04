"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = { error: null };

export default function CadastroPage() {
  const [state, action, isPending] = useActionState(registerAction, initialState);

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
          Criar sua conta
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Junte-se à nossa comunidade de consumidores conscientes
        </p>

        <form action={action} className="mt-8 space-y-5">
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
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Nome completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              autoComplete="name"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Seu nome"
            />
          </div>

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
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-foreground"
            >
              Telefone <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {/* LGPD consents */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Consentimentos (LGPD)
            </p>

            {/* Obrigatórios */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent_terms"
                name="consent_terms"
                required
                className="mt-1 h-4 w-4 accent-primary"
              />
              <label htmlFor="consent_terms" className="text-sm text-foreground">
                Li e aceito os{" "}
                <Link href="/termos" className="text-primary hover:underline">
                  termos de uso
                </Link>{" "}
                <span className="text-destructive">*</span>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent_privacy"
                name="consent_privacy"
                required
                className="mt-1 h-4 w-4 accent-primary"
              />
              <label htmlFor="consent_privacy" className="text-sm text-foreground">
                Li e aceito a{" "}
                <Link href="/privacidade" className="text-primary hover:underline">
                  política de privacidade
                </Link>{" "}
                <span className="text-destructive">*</span>
              </label>
            </div>

            {/* Opcionais */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent_marketing"
                name="consent_marketing"
                defaultChecked
                className="mt-1 h-4 w-4 accent-primary"
              />
              <label htmlFor="consent_marketing" className="text-sm text-muted-foreground">
                Quero receber novidades, promoções e curadoria semanal por e-mail
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent_analytics"
                name="consent_analytics"
                defaultChecked
                className="mt-1 h-4 w-4 accent-primary"
              />
              <label htmlFor="consent_analytics" className="text-sm text-muted-foreground">
                Aceito o uso de dados para melhoria da experiência no site
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/conta/login"
            className="font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
