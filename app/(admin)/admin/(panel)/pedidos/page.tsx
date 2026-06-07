/**
 * /admin/pedidos — paginated order list with status/payment/search filters.
 */

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { apiFetch } from "@/lib/api-server";
import type { AdminOrderResponse, OrderStatus, Page, PaymentStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COLLECTED: "Coletado",
  OUT_FOR_DELIVERY: "Em entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COLLECTED: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Aguardando",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  REFUNDED: "bg-zinc-200 text-zinc-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos os status" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const PAYMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos os pagamentos" },
  ...Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label })),
];

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    payment_status?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.page ?? "1"));

  const qs = new URLSearchParams({ page: String(currentPage), limit: "20" });
  if (sp.status) qs.set("status", sp.status);
  if (sp.payment_status) qs.set("payment_status", sp.payment_status);
  if (sp.search?.trim()) qs.set("search", sp.search.trim());

  const result = await apiFetch<Page<AdminOrderResponse>>(
    `/api/admin/pedidos?${qs}`,
  );

  const { data: orders, pagination } = result;

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = {
      status: sp.status ?? "",
      payment_status: sp.payment_status ?? "",
      search: sp.search ?? "",
      page: String(currentPage),
      ...overrides,
    };
    if (merged.status) params.set("status", merged.status);
    if (merged.payment_status) params.set("payment_status", merged.payment_status);
    if (merged.search) params.set("search", merged.search);
    if (Number(merged.page) > 1) params.set("page", merged.page);
    const qs = params.toString();
    return `/admin/pedidos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="h-7 w-7 text-primary" />
            Pedidos
          </h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total} pedido(s) no total.
          </p>
        </div>
      </header>

      {/* Filters */}
      <form method="GET" action="/admin/pedidos" className="flex flex-wrap gap-3">
        <input
          name="search"
          type="search"
          defaultValue={sp.search ?? ""}
          placeholder="ID público, nome ou e-mail"
          className="w-60 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          name="payment_status"
          defaultValue={sp.payment_status ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filtrar
        </button>
        {(sp.status || sp.payment_status || sp.search) && (
          <Link
            href="/admin/pedidos"
            className="rounded-md border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Limpar
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {o.public_id}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.customer_email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status]}`}
                    >
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[o.payment_status]}`}
                    >
                      {PAYMENT_LABELS[o.payment_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    R$ {o.total_amount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(pagination.page > 1 || pagination.has_next) && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Página {pagination.page} de{" "}
            {Math.ceil(pagination.total / pagination.limit)}
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Link
                href={buildHref({ page: String(pagination.page - 1) })}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                ← Anterior
              </Link>
            )}
            {pagination.has_next && (
              <Link
                href={buildHref({ page: String(pagination.page + 1) })}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
