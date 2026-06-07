"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/session";
import type { ActionState } from "@/lib/admin-action-state";
import { INITIAL } from "@/lib/admin-action-state";
import type { AdminOrderResponse, OrderStatus, PaymentStatus } from "@/lib/types";

export { INITIAL };
export type { ActionState };

export async function updateOrderStatusAction(
  id: string,
  status: OrderStatus,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch<AdminOrderResponse>(`/api/admin/pedidos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
    return { status: "ok", message: `Status atualizado para ${status}.` };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updatePaymentStatusAction(
  id: string,
  paymentStatus: PaymentStatus,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch<AdminOrderResponse>(`/api/admin/pedidos/${id}/payment-status`, {
      method: "PATCH",
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
    return { status: "ok", message: `Pagamento marcado como ${paymentStatus}.` };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}
