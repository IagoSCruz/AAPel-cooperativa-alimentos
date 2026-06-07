/**
 * /admin/pedidos/[id] — single order detail with status management.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, ShoppingBag, Truck, User } from "lucide-react";

import { ApiError, apiFetch } from "@/lib/api-server";
import type { AdminOrderResponse } from "@/lib/types";
import { OrderActions } from "./order-actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_LABELS = {
  PICKUP: "Retirada em ponto de coleta",
  HOME_DELIVERY: "Entrega em domicílio",
} as const;

const PAYMENT_LABELS = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CARD: "Cartão",
} as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order: AdminOrderResponse;
  try {
    order = await apiFetch<AdminOrderResponse>(`/api/admin/pedidos/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para pedidos
      </Link>

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-serif text-3xl font-bold font-mono">
              {order.public_id}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Criado em {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: details + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer + delivery */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Cliente
            </h2>
            <div className="grid gap-2 text-sm">
              <Row label="Nome" value={order.customer_name} />
              <Row label="E-mail" value={order.customer_email} />
            </div>

            <h2 className="font-semibold flex items-center gap-2 pt-2 border-t">
              {order.delivery_method === "HOME_DELIVERY" ? (
                <Truck className="h-4 w-4 text-muted-foreground" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
              Entrega
            </h2>
            <div className="grid gap-2 text-sm">
              <Row label="Método" value={METHOD_LABELS[order.delivery_method]} />
              {order.delivery_method === "HOME_DELIVERY" && (
                <>
                  {order.delivery_neighborhood && (
                    <Row label="Bairro" value={order.delivery_neighborhood} />
                  )}
                  {order.delivery_address && (
                    <Row label="Endereço" value={order.delivery_address} />
                  )}
                </>
              )}
              <Row
                label="Data de entrega"
                value={formatDateTime(order.delivery_date)}
              />
            </div>

            <h2 className="font-semibold flex items-center gap-2 pt-2 border-t">
              Pagamento
            </h2>
            <div className="grid gap-2 text-sm">
              <Row label="Forma" value={PAYMENT_LABELS[order.payment_method]} />
              <Row label="Subtotal" value={`R$ ${order.subtotal}`} />
              <Row label="Frete" value={`R$ ${order.delivery_fee}`} />
              <Row
                label="Total"
                value={`R$ ${order.total_amount}`}
                bold
              />
            </div>

            {order.notes && (
              <>
                <h2 className="font-semibold pt-2 border-t">Observações</h2>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </>
            )}
          </section>

          {/* Items */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2 font-semibold">
              <Package className="h-4 w-4 text-muted-foreground" />
              Itens ({order.items.length})
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3 text-right">Qtd</th>
                  <th className="px-5 py-3 text-right">Preço unit.</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-5 py-3">
                      {item.product_name_snapshot ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      R$ {item.unit_price_snapshot}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      R$ {item.line_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* Right column: actions */}
        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-4">Ações</h2>
            <OrderActions order={order} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
