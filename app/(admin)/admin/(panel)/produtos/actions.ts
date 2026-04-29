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
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const price = formData.get("price")?.toString().trim();
  const unit = formData.get("unit")?.toString().trim();
  const image_url = formData.get("image_url")?.toString().trim() || null;
  const stockStr = formData.get("stock")?.toString().trim();
  const stock = stockStr ? Number.parseInt(stockStr, 10) : 0;
  const product_type = formData.get("product_type")?.toString() ?? "FOOD";
  const organic = formData.get("organic") === "on";
  const premium = formData.get("premium") === "on";
  const available = formData.get("available") === "on";
  const seasonal = formData.get("seasonal") === "on";
  const category_id = formData.get("category_id")?.toString();
  const producer_id = formData.get("producer_id")?.toString();

  return {
    name,
    description,
    price,
    unit,
    image_url,
    stock,
    product_type,
    organic,
    premium,
    available,
    seasonal,
    category_id,
    producer_id,
  };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  if (!data.name || !data.price || !data.unit || !data.category_id || !data.producer_id) {
    return {
      status: "error",
      message: "Nome, preço, unidade, categoria e produtor são obrigatórios.",
    };
  }

  try {
    await apiFetch("/api/admin/produtos", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/produtos");
    redirect("/admin/produtos");
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateProductAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  if (!data.name) return { status: "error", message: "Nome é obrigatório." };

  try {
    await apiFetch(`/api/admin/produtos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/produtos");
    revalidatePath(`/admin/produtos/${id}`);
    return { status: "ok", message: "Produto atualizado." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/produtos/${id}`, { method: "DELETE" });
    revalidatePath("/admin/produtos");
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.detail);
    throw e;
  }
  redirect("/admin/produtos");
}
