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
  return {
    name: formData.get("name")?.toString().trim(),
    address: formData.get("address")?.toString().trim(),
    city: formData.get("city")?.toString().trim(),
    state: formData.get("state")?.toString().trim().toUpperCase(),
    description: formData.get("description")?.toString().trim() || null,
    schedule: formData.get("schedule")?.toString().trim() || null,
    active: formData.get("active") === "on",
  };
}

export async function createCollectionPointAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  if (!data.name || !data.address || !data.city || !data.state) {
    return { status: "error", message: "Nome, endereço, cidade e estado são obrigatórios." };
  }
  if (data.state.length !== 2) {
    return { status: "error", message: "Estado deve ter 2 letras (UF)." };
  }
  try {
    await apiFetch("/api/admin/pontos-coleta", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/pontos-coleta");
    redirect("/admin/pontos-coleta");
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateCollectionPointAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  try {
    await apiFetch(`/api/admin/pontos-coleta/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/pontos-coleta");
    revalidatePath(`/admin/pontos-coleta/${id}`);
    return { status: "ok", message: "Ponto de coleta atualizado." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function deleteCollectionPointAction(id: string): Promise<void> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/pontos-coleta/${id}`, { method: "DELETE" });
    revalidatePath("/admin/pontos-coleta");
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.detail);
    throw e;
  }
  redirect("/admin/pontos-coleta");
}
