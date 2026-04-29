"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/session";

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message?: string }
  | { status: "error"; message: string };

export const INITIAL: ActionState = { status: "idle" };

function readForm(formData: FormData) {
  const neighborhoodsRaw = formData.get("neighborhoods")?.toString() ?? "";
  const neighborhoods = neighborhoodsRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name: formData.get("name")?.toString().trim(),
    description: formData.get("description")?.toString().trim() || null,
    delivery_fee: formData.get("delivery_fee")?.toString().trim(),
    minimum_order_value:
      formData.get("minimum_order_value")?.toString().trim() || "0",
    estimated_minutes:
      Number.parseInt(formData.get("estimated_minutes")?.toString() ?? "", 10) ||
      null,
    active: formData.get("active") === "on",
    neighborhoods,
  };
}

export async function createZoneAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  if (!data.name || !data.delivery_fee) {
    return { status: "error", message: "Nome e taxa de entrega são obrigatórios." };
  }
  try {
    await apiFetch("/api/admin/zonas-entrega", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/zonas-entrega");
    redirect("/admin/zonas-entrega");
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateZoneAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  try {
    await apiFetch(`/api/admin/zonas-entrega/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/zonas-entrega");
    revalidatePath(`/admin/zonas-entrega/${id}`);
    return { status: "ok", message: "Zona atualizada." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function deleteZoneAction(id: string): Promise<void> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/zonas-entrega/${id}`, { method: "DELETE" });
    revalidatePath("/admin/zonas-entrega");
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.detail);
    throw e;
  }
  redirect("/admin/zonas-entrega");
}
