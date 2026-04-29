"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, Truck, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/components/cart/cart-item";

const deliveryOptions = [
  { id: "entrega", name: "Entrega em casa", price: 12.0, time: "Terça ou Sexta" },
  { id: "retirada", name: "Retirada no ponto", price: 0, time: "Terça ou Sexta" },
];

export default function CarrinhoPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();

  if (items.length === 0) {
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
            Explore nossos produtos e adicione itens ao carrinho
          </p>
          <Button className="mt-6" asChild>
            <Link href="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="mb-8">
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuar comprando
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Carrinho ({totalItems} {totalItems === 1 ? "item" : "itens"})
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-destructive hover:underline"
        >
          Limpar carrinho
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border px-6">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Truck className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Entrega programada
                </p>
                <p className="text-xs text-muted-foreground">
                  Terças e sextas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Sempre fresco
                </p>
                <p className="text-xs text-muted-foreground">
                  Colhido na véspera
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Shield className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Compra segura
                </p>
                <p className="text-xs text-muted-foreground">
                  Dados protegidos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-semibold">
              Resumo do Pedido
            </h2>

            {/* Delivery Options */}
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">
                Opção de entrega
              </p>
              <div className="mt-3 space-y-2">
                {deliveryOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        value={option.id}
                        defaultChecked={option.id === "entrega"}
                        className="h-4 w-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {option.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {option.time}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {option.price === 0
                        ? "Grátis"
                        : formatCurrency(option.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Totals */}
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

            <Button className="mt-6 w-full" size="lg" asChild>
              <Link href="/checkout">Finalizar Compra</Link>
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Ao finalizar, você concorda com nossos{" "}
              <Link href="/termos" className="underline hover:text-foreground">
                termos de uso
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
