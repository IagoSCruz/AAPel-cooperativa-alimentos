"use server";

import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import { ApiPublicError, authedFetch } from "@/lib/api-public";
import { extractApiErrorMessage } from "@/lib/api-errors";
import type { BasketOrderResponse, SlotChoiceInput } from "@/lib/types";

// H2: Strict UUID guard — prevents path-injection / SSRF-style abuse where the
// hidden form field is tampered with (e.g. "../admin/users", encoded slashes).
// The backend would 404 anyway, but we fail fast before issuing the request.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export type BasketOrderState = {
  error: string | null;
  order: BasketOrderResponse | null;
};

type SlotChoices = Record<string, string>; // slot_id -> product_id

function isSlotChoices(v: unknown): v is SlotChoices {
  if (typeof v !== "object" || v === null) return false;
  return Object.entries(v).every(
    ([k, val]) => typeof k === "string" && typeof val === "string",
  );
}

export async function createBasketOrderAction(
  _prev: BasketOrderState,
  formData: FormData,
): Promise<BasketOrderState> {
  const rawTemplateId = formData.get("template_id");
  if (!isUUID(rawTemplateId)) {
    return { error: "Identificador de cesta inválido", order: null };
  }
  const templateId: string = rawTemplateId;

  const session = await getCustomerSession();
  if (!session) {
    redirect(`/conta/login?next=/cestas/${templateId}`);
  }
  const slotChoicesJson = formData.get("slot_choices") as string;
  const deliveryMethod = formData.get("delivery_method") as string;
  const deliveryZoneId = formData.get("delivery_zone_id") as string | null;
  const deliveryAddress = formData.get("delivery_address") as string | null;
  const deliveryNeighborhood = formData.get(
    "delivery_neighborhood",
  ) as string | null;
  const collectionPointId = formData.get(
    "collection_point_id",
  ) as string | null;
  const paymentMethod = formData.get("payment_method") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!slotChoicesJson) {
    return { error: "Selecione um produto para cada compartimento", order: null };
  }

  let choicesMap: SlotChoices;
  try {
    const parsed: unknown = JSON.parse(slotChoicesJson);
    if (!isSlotChoices(parsed)) {
      return { error: "Formato de seleção inválido", order: null };
    }
    choicesMap = parsed;
  } catch {
    return { error: "Erro ao processar seleções", order: null };
  }

  if (Object.keys(choicesMap).length === 0) {
    return {
      error: "Selecione um produto para cada compartimento",
      order: null,
    };
  }

  const slotChoices: SlotChoiceInput[] = Object.entries(choicesMap).map(
    ([slot_id, product_id]) => ({ slot_id, product_id }),
  );

  const body = {
    slot_choices: slotChoices,
    delivery_method: deliveryMethod,
    delivery_zone_id: deliveryZoneId || undefined,
    delivery_address: deliveryAddress || undefined,
    delivery_neighborhood: deliveryNeighborhood || undefined,
    collection_point_id: collectionPointId || undefined,
    payment_method: paymentMethod,
    notes: notes || undefined,
  };

  try {
    const order = await authedFetch<BasketOrderResponse>(
      `/api/cestas/${templateId}/personalizar`,
      {
        method: "POST",
        body: JSON.stringify(body),
        token: session.accessToken,
      },
    );
    return { error: null, order };
  } catch (err: unknown) {
    if (err instanceof ApiPublicError) {
      return {
        error: extractApiErrorMessage(err.payload, err.detail),
        order: null,
      };
    }
    return {
      error: err instanceof Error ? err.message : "Erro ao criar pedido de cesta",
      order: null,
    };
  }
}
