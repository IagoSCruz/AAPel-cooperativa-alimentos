"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShoppingBag, Check, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency, priceToNumber } from "@/lib/utils";
import { createOrderAction, type CheckoutState } from "./actions";
import type { DeliveryZone } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

const initialState: CheckoutState = { error: null, order: null };

export function CheckoutClient({ zones }: { zones: DeliveryZone[] }) {
  const { items, totalPrice, clearCart, hydrated } = useCart();
  const [state, action, isPending] = useActionState(createOrderAction, initialState);
  const [deliveryMethod, setDeliveryMethod] = useState<"HOME_DELIVERY" | "PICKUP">(
    zones.length > 0 ? "HOME_DELIVERY" : "PICKUP",
  );
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(
    zones[0] ?? null,
  );

  // Slim cart payload — only what the API actually consumes. Memoized so we
  // don't re-stringify on every render.
  const cartLitePayload = useMemo(
    () =>
      JSON.stringify(
        items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      ),
    [items],
  );

  // Clear cart after successful order
  useEffect(() => {
    if (state.order) {
      clearCart();
    }
  }, [state.order, clearCart]);

  if (!hydrated) return null; // Avoid SSR mismatch

  // Success state
  if (state.order) {
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
            Obrigado pela sua compra. Você receberá uma confirmação em breve.
          </p>
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Número do pedido</p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">
              {state.order.public_id}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Entrega prevista:{" "}
              {new Date(state.order.delivery_date).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
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

  // Empty cart
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
            Adicione produtos antes de finalizar a compra
          </p>
          <Button className="mt-6" asChild>
            <Link href="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const deliveryFee =
    deliveryMethod === "HOME_DELIVERY" && selectedZone
      ? priceToNumber(selectedZone.delivery_fee)
      : 0;
  const total = totalPrice + deliveryFee;

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

      <form action={action}>
        {/* Hidden: slim cart payload — only product_id + quantity. */}
        <input type="hidden" name="cart_items" value={cartLitePayload} />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="space-y-8 lg:col-span-2">
            {state.error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {state.error}
              </div>
            )}

            {/* Delivery Method */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">
                Forma de Recebimento
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {zones.length > 0 && (
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      deliveryMethod === "HOME_DELIVERY"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      value="HOME_DELIVERY"
                      checked={deliveryMethod === "HOME_DELIVERY"}
                      onChange={() => setDeliveryMethod("HOME_DELIVERY")}
                      className="h-4 w-4 accent-primary"
                    />
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      Entrega em domicílio
                    </span>
                  </label>
                )}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    deliveryMethod === "PICKUP"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_method"
                    value="PICKUP"
                    checked={deliveryMethod === "PICKUP"}
                    onChange={() => setDeliveryMethod("PICKUP")}
                    className="h-4 w-4 accent-primary"
                  />
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Retirada</span>
                </label>
              </div>

              {/* Home delivery fields */}
              {deliveryMethod === "HOME_DELIVERY" && zones.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Zona de entrega
                    </label>
                    <select
                      name="delivery_zone_id"
                      required
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(e) =>
                        setSelectedZone(
                          zones.find((z) => z.id === e.target.value) ?? null,
                        )
                      }
                    >
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} — R${" "}
                          {priceToNumber(zone.delivery_fee).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {selectedZone?.neighborhoods &&
                      selectedZone.neighborhoods.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Atende:{" "}
                          {selectedZone.neighborhoods.slice(0, 4).join(", ")}
                          {selectedZone.neighborhoods.length > 4 &&
                            ` +${selectedZone.neighborhoods.length - 4} bairros`}
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Endereço completo
                    </label>
                    <input
                      type="text"
                      name="delivery_address"
                      required
                      placeholder="Rua, número, complemento"
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Bairro
                    </label>
                    <input
                      type="text"
                      name="delivery_neighborhood"
                      required
                      placeholder="Bairro"
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">Pagamento</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                O pagamento será realizado na entrega ou retirada
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { value: "PIX", label: "PIX" },
                  { value: "CASH", label: "Dinheiro" },
                  { value: "CARD", label: "Cartão (na entrega)" },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={value}
                      defaultChecked={value === "PIX"}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">
                Observações{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  (opcional)
                </span>
              </h2>
              <textarea
                name="notes"
                rows={3}
                placeholder="Instruções de entrega, substituições, etc."
                className="mt-4 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-semibold">Seu Pedido</h2>

              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.product.image_url && (
                        <SafeImage
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-medium">
                      {formatCurrency(
                        priceToNumber(item.product.price) * item.quantity,
                      )}
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
                  <span>
                    {deliveryMethod === "PICKUP"
                      ? "Grátis (retirada)"
                      : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={isPending}
              >
                {isPending ? "Processando..." : "Confirmar Pedido"}
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Ao confirmar você concorda com nossos{" "}
                <Link href="/termos" className="underline">
                  termos
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
