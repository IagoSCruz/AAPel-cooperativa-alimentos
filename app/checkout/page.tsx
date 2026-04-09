"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (items.length === 0 && !isComplete) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
            Seu carrinho está vazio
          </h1>
          <p className="mt-2 text-muted-foreground">
            Adicione produtos antes de finalizar a compra
          </p>
          <Button className="mt-6" asChild>
            <Link href="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
            <Check className="h-10 w-10 text-accent" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">
            Pedido Confirmado!
          </h1>
          <p className="mt-4 text-muted-foreground">
            Obrigado pela sua compra. Você receberá um e-mail com os detalhes do
            seu pedido e informações sobre a entrega.
          </p>
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Número do pedido</p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">
              #AAP-{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/conta">Ver Meus Pedidos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/produtos">Continuar Comprando</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    clearCart();
    setIsComplete(true);
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="mb-8">
        <Link
          href="/carrinho"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao carrinho
        </Link>
      </div>

      <h1 className="font-serif text-3xl font-bold text-foreground">
        Finalizar Compra
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="space-y-8 lg:col-span-2">
            {/* Contact Info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">
                Informações de Contato
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">
                Endereço de Entrega
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Endereço
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Rua, número, complemento"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Bairro
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    CEP
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Cidade
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Estado
                  </label>
                  <select
                    required
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecione</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="PR">Paraná</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">Pagamento</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                O pagamento será realizado na entrega ou retirada
              </p>
              <div className="mt-4 space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
                  <input
                    type="radio"
                    name="payment"
                    value="pix"
                    defaultChecked
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium text-foreground">PIX</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
                  <input
                    type="radio"
                    name="payment"
                    value="dinheiro"
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium text-foreground">Dinheiro</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
                  <input
                    type="radio"
                    name="payment"
                    value="cartao"
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium text-foreground">
                    Cartão (na entrega)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">Seu Pedido</h2>

              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrega</span>
                  <span>{formatCurrency(12.0)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice + 12.0)}</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
