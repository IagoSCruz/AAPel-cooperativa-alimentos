"use client";

/**
 * Client component: dropdowns + buttons for status and payment_status transitions.
 * Server actions are called via startTransition to stay in the same RSC tree.
 */

import { useState, useTransition } from "react";
import type { AdminOrderResponse, OrderStatus, PaymentStatus } from "@/lib/types";
import { updateOrderStatusAction, updatePaymentStatusAction } from "../actions";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COLLECTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

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

export function OrderActions({ order }: { order: AdminOrderResponse }) {
  const [statusError, setStatusError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [statusPending, startStatusTransition] = useTransition();
  const [paymentPending, startPaymentTransition] = useTransition();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OrderStatus;
    if (newStatus === order.status) return;
    setStatusError(null);
    startStatusTransition(async () => {
      const result = await updateOrderStatusAction(order.id, newStatus);
      if (result.status === "error") setStatusError(result.message);
    });
  }

  function handlePaymentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPayment = e.target.value as PaymentStatus;
    if (newPayment === order.payment_status) return;
    setPaymentError(null);
    startPaymentTransition(async () => {
      const result = await updatePaymentStatusAction(order.id, newPayment);
      if (result.status === "error") setPaymentError(result.message);
    });
  }

  return (
    <div className="space-y-5">
      {/* Order status */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Status do pedido
        </label>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="text-muted-foreground text-xs">→</span>
          <select
            defaultValue={order.status}
            onChange={handleStatusChange}
            disabled={statusPending}
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {statusPending && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Salvando…
            </span>
          )}
        </div>
        {statusError && (
          <p className="mt-1.5 text-xs text-destructive" role="alert">
            {statusError}
          </p>
        )}
      </div>

      {/* Payment status */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Status de pagamento
        </label>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_COLORS[order.payment_status]}`}
          >
            {PAYMENT_LABELS[order.payment_status]}
          </span>
          <span className="text-muted-foreground text-xs">→</span>
          <select
            defaultValue={order.payment_status}
            onChange={handlePaymentChange}
            disabled={paymentPending}
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {(["PENDING", "PAID", "REFUNDED"] as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>
                {PAYMENT_LABELS[s]}
              </option>
            ))}
          </select>
          {paymentPending && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Salvando…
            </span>
          )}
        </div>
        {paymentError && (
          <p className="mt-1.5 text-xs text-destructive" role="alert">
            {paymentError}
          </p>
        )}
      </div>
    </div>
  );
}
