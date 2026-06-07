"use server";

/**
 * Categorias — admin CRUD actions.
 * Categorias têm apenas list/create/update (sem delete por integridade FK).
 */

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/session";
import { type ActionState, INITIAL } from "@/lib/admin-action-state";

export { INITIAL };
export type { ActionState };

function readForm(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const image_url = formData.get("image_url")?.toString().trim() || null;
  return { name, description, image_url };
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { name, description, image_url } = readForm(formData);
  if (!name) return { status: "error", message: "Nome é obrigatório." };

  try {
    await apiFetch("/api/admin/categorias", {
      method: "POST",
      body: JSON.stringify({ name, description, image_url }),
    });
    revalidatePath("/admin/categorias");
    return { status: "ok", message: "Categoria criada." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateCategoryAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { name, description, image_url } = readForm(formData);
  if (!name) return { status: "error", message: "Nome é obrigatório." };

  try {
    await apiFetch(`/api/admin/categorias/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, description, image_url }),
    });
    revalidatePath("/admin/categorias");
    return { status: "ok", message: "Categoria atualizada." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}
