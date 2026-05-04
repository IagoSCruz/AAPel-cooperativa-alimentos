"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, priceToNumber } from "@/lib/utils";
import {
  createBasketOrderAction,
  type BasketOrderState,
} from "./actions";
import type {
  BasketCuration,
  BasketOrderResponse,
  CuratedSlot,
  DeliveryZone,
  ProductItem,
} from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

// ---------------------------------------------------------------------------
// Slot picker — one slot section with its eligible products
// ---------------------------------------------------------------------------

function SlotSection({
  curated,
  selected,
  onSelect,
}: {
  curated: CuratedSlot;
  selected: string | null;
  onSelect: (productId: string) => void;
}) {
  const { slot, options } = curated;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-accent" />
        <h3 className="font-medium text-foreground">
          {slot.slot_label}
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            ({slot.item_count} {slot.item_count === 1 ? "item" : "itens"})
          </span>
        </h3>
        {selected && (
          <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map(({ product, upgrade_fee }) => {
          const isSelected = selected === product.id;
          const fee = priceToNumber(upgrade_fee);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={[
                "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isSelected
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border bg-card hover:border-accent/50",
              ].join(" ")}
            >
              {/* Product image */}
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {product.image_url ? (
                  <SafeImage
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-secondary" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {product.name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {product.unit}
                  {product.organic && (
                    <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">
                      orgânico
                    </span>
                  )}
                </p>
                {fee > 0 ? (
                  <p className="mt-1 text-sm font-medium text-amber-600">
                    + {formatPrice(upgrade_fee)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">incluído</p>
                )}
              </div>

              {isSelected && (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order confirmation panel
// ---------------------------------------------------------------------------

function OrderConfirmation({ order }: { order: BasketOrderResponse }) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-7 w-7 text-accent" />
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Pedido confirmado!
          </h3>
          <p className="text-sm text-muted-foreground">#{order.public_id}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Semana de entrega</span>
          <span className="font-medium">
            {new Date(order.delivery_week).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">R$ {order.total_amount}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-accent/20 pt-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
          Sua seleção
        </p>
        <ul className="space-y-1">
          {order.fulfillments.map((ff) => (
            <li key={ff.slot_id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{ff.slot_label}</span>
              <span className="font-medium text-foreground">{ff.product_name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const INITIAL_STATE: BasketOrderState = { error: null, order: null };

export function BasketCustomizer({
  curation,
  zones,
  isAuthenticated,
}: {
  curation: BasketCuration;
  zones: DeliveryZone[];
  isAuthenticated: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    createBasketOrderAction,
    INITIAL_STATE,
  );

  // slot_id -> product_id
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<"HOME_DELIVERY" | "PICKUP">(
    "HOME_DELIVERY",
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    zones[0]?.id ?? "",
  );
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const allSlotsChosen = curation.slots.every((cs) => !!choices[cs.slot.id]);
  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null;

  // Live total calculation
  const upgradeTotal = useMemo(() => {
    let sum = 0;
    for (const cs of curation.slots) {
      const chosenId = choices[cs.slot.id];
      if (!chosenId) continue;
      const opt = cs.options.find((o) => o.product.id === chosenId);
      if (opt) sum += priceToNumber(opt.upgrade_fee);
    }
    return sum;
  }, [choices, curation.slots]);

  const basePrice = priceToNumber(curation.base_price);
  const deliveryFee =
    deliveryMethod === "HOME_DELIVERY" && selectedZone
      ? priceToNumber(selectedZone.delivery_fee)
      : 0;
  const grandTotal = basePrice + upgradeTotal + deliveryFee;

  const slotChoicesJson = useMemo(
    () => JSON.stringify(choices),
    [choices],
  );

  if (state.order) {
    return <OrderConfirmation order={state.order} />;
  }

  return (
    <form action={formAction} className="space-y-10">
      {/* Hidden fields */}
      <input type="hidden" name="template_id" value={curation.template_id} />
      <input type="hidden" name="slot_choices" value={slotChoicesJson} />
      <input type="hidden" name="delivery_method" value={deliveryMethod} />
      {deliveryMethod === "HOME_DELIVERY" && (
        <>
          <input type="hidden" name="delivery_zone_id" value={selectedZoneId} />
          <input type="hidden" name="delivery_address" value={address} />
          <input type="hidden" name="delivery_neighborhood" value={neighborhood} />
        </>
      )}
      <input type="hidden" name="payment_method" value={paymentMethod} />

      {/* ── Slot pickers ── */}
      <div className="space-y-8">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Personalize sua cesta
        </h2>
        <p className="text-sm text-muted-foreground">
          Prazo:{" "}
          {new Date(curation.customization_deadline).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>

        {curation.slots.map((cs) => (
          <SlotSection
            key={cs.slot.id}
            curated={cs}
            selected={choices[cs.slot.id] ?? null}
            onSelect={(productId) =>
              setChoices((prev) => ({ ...prev, [cs.slot.id]: productId }))
            }
          />
        ))}
      </div>

      {/* ── Delivery ── */}
      <div className="space-y-4 rounded-xl border border-border p-5">
        <h3 className="font-medium text-foreground">Entrega</h3>

        <div className="flex gap-3">
          {(["HOME_DELIVERY", "PICKUP"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDeliveryMethod(m)}
              className={[
                "flex-1 rounded-lg border py-2.5 text-sm transition-all",
                deliveryMethod === m
                  ? "border-accent bg-accent/5 font-medium text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50",
              ].join(" ")}
            >
              {m === "HOME_DELIVERY" ? "Entrega em domicílio" : "Retirada"}
            </button>
          ))}
        </div>

        {deliveryMethod === "HOME_DELIVERY" && zones.length > 0 && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Zona de entrega
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — frete R$ {z.delivery_fee}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Endereço
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Rua, número, complemento"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Bairro
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Payment ── */}
      <div className="space-y-3 rounded-xl border border-border p-5">
        <h3 className="font-medium text-foreground">Pagamento</h3>
        <div className="flex gap-3">
          {(["PIX", "CASH", "CARD"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPaymentMethod(m)}
              className={[
                "flex-1 rounded-lg border py-2.5 text-sm transition-all",
                paymentMethod === m
                  ? "border-accent bg-accent/5 font-medium text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50",
              ].join(" ")}
            >
              {m === "PIX" ? "Pix" : m === "CASH" ? "Dinheiro" : "Cartão"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="rounded-xl bg-muted p-5 space-y-3">
        <h3 className="font-medium text-foreground">Resumo</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cesta base</span>
            <span>{formatPrice(curation.base_price)}</span>
          </div>
          {upgradeTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upgrades</span>
              <span className="text-amber-600">
                + R$ {upgradeTotal.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span>
              {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : "grátis"}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>R$ {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {!isAuthenticated ? (
          <a
            href={`/conta/login?next=/cestas/${curation.template_id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Entrar para personalizar
            <ChevronRight className="h-4 w-4" />
          </a>
        ) : (
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending || !allSlotsChosen}
          >
            {isPending ? (
              "Processando..."
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" />
                {allSlotsChosen
                  ? "Confirmar pedido"
                  : `Selecione ${curation.slots.filter((cs) => !choices[cs.slot.id]).length} compartimento(s)`}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
