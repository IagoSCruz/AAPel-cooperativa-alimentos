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
  const story = formData.get("story")?.toString().trim() || null;
  const location = formData.get("location")?.toString().trim() || null;
  const image_url = formData.get("image_url")?.toString().trim() || null;
  const cover_image_url =
    formData.get("cover_image_url")?.toString().trim() || null;
  const sinceStr = formData.get("since")?.toString().trim();
  const since = sinceStr ? Number.parseInt(sinceStr, 10) : null;
  const active = formData.get("active") === "on";
  const specialtiesRaw = formData.get("specialties")?.toString() ?? "";
  const specialties = specialtiesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name,
    description,
    story,
    location,
    image_url,
    cover_image_url,
    since,
    active,
    specialties: specialties.length ? specialties : null,
  };
}

export async function createProducerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  if (!data.name) return { status: "error", message: "Nome é obrigatório." };

  try {
    await apiFetch("/api/admin/produtores", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/produtores");
    redirect("/admin/produtores");
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateProducerAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readForm(formData);
  if (!data.name) return { status: "error", message: "Nome é obrigatório." };

  try {
    await apiFetch(`/api/admin/produtores/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/produtores");
    revalidatePath(`/admin/produtores/${id}`);
    return { status: "ok", message: "Produtor atualizado." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function deleteProducerAction(id: string): Promise<void> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/produtores/${id}`, { method: "DELETE" });
    revalidatePath("/admin/produtores");
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(e.detail);
    }
    throw e;
  }
  redirect("/admin/produtores");
}
