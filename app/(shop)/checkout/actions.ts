"use server";

import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import { ApiPublicError, authedFetch } from "@/lib/api-public";
import { extractApiErrorMessage } from "@/lib/api-errors";
import type { OrderResponse } from "@/lib/types";

export type CheckoutState = {
  error: string | null;
  order: OrderResponse | null;
};

/** Slim cart payload — only what the API needs to compute the order. */
type CartLite = { product_id: string; quantity: number }[];

function isCartLite(value: unknown): value is CartLite {
  if (!Array.isArray(value)) return false;
  return value.every(
    (e) =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as { product_id?: unknown }).product_id === "string" &&
      typeof (e as { quantity?: unknown }).quantity === "number" &&
      (e as { quantity: number }).quantity > 0,
  );
}

export async function createOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // Auth guard — redirect to login if not authenticated
  const session = await getCustomerSession();
  if (!session) {
    redirect("/conta/login?next=/checkout");
  }

  // Parse form data
  const deliveryMethod = formData.get("delivery_method") as string;
  const deliveryZoneId = formData.get("delivery_zone_id") as string | null;
  const deliveryAddress = formData.get("delivery_address") as string | null;
  const deliveryNeighborhood = formData.get("delivery_neighborhood") as string | null;
  const collectionPointId = formData.get("collection_point_id") as string | null;
  const paymentMethod = formData.get("payment_method") as string;
  const notes = (formData.get("notes") as string) || null;
  const cartJson = formData.get("cart_items") as string;

  if (!cartJson) {
    return { error: "Carrinho vazio", order: null };
  }

  let cartItems: CartLite;
  try {
    const parsed: unknown = JSON.parse(cartJson);
    if (!isCartLite(parsed)) {
      return { error: "Formato de carrinho inválido", order: null };
    }
    cartItems = parsed;
  } catch {
    return { error: "Erro ao processar carrinho", order: null };
  }

  if (cartItems.length === 0) {
    return { error: "Adicione produtos ao carrinho antes de finalizar", order: null };
  }

  const body = {
    items: cartItems,
    delivery_method: deliveryMethod,
    delivery_zone_id: deliveryZoneId || undefined,
    delivery_address: deliveryAddress || undefined,
    delivery_neighborhood: deliveryNeighborhood || undefined,
    collection_point_id: collectionPointId || undefined,
    payment_method: paymentMethod,
    notes: notes || undefined,
  };

  try {
    const order = await authedFetch<OrderResponse>("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(body),
      token: session.accessToken,
    });
    return { error: null, order };
  } catch (err: unknown) {
    if (err instanceof ApiPublicError) {
      return {
        error: extractApiErrorMessage(err.payload, err.detail),
        order: null,
      };
    }
    return {
      error: err instanceof Error ? err.message : "Erro ao criar pedido",
      order: null,
    };
  }
}
