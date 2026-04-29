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

type SlotInput = { slot_label: string; position: number; item_count: number };

function readTemplateForm(formData: FormData) {
  return {
    name: formData.get("name")?.toString().trim(),
    description: formData.get("description")?.toString().trim() || null,
    base_price: formData.get("base_price")?.toString().trim(),
    image_url: formData.get("image_url")?.toString().trim() || null,
    serves: formData.get("serves")?.toString().trim() || null,
    customization_window_hours:
      Number.parseInt(formData.get("customization_window_hours")?.toString() ?? "24", 10) ||
      24,
    active: formData.get("active") === "on",
  };
}

function readSlotsFromForm(formData: FormData): SlotInput[] {
  // Slots are submitted as `slots[<index>][label|count]`. We collect by index.
  const map = new Map<number, Partial<SlotInput>>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^slots\[(\d+)\]\[(label|count)\]$/);
    if (!m) continue;
    const idx = Number.parseInt(m[1], 10);
    const field = m[2];
    const entry = map.get(idx) ?? { position: idx };
    if (field === "label") entry.slot_label = value.toString().trim();
    if (field === "count") entry.item_count = Number.parseInt(value.toString(), 10) || 0;
    map.set(idx, entry);
  }
  const slots: SlotInput[] = [];
  for (const [idx, entry] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
    if (!entry.slot_label || !entry.item_count) continue;
    slots.push({
      slot_label: entry.slot_label,
      item_count: entry.item_count,
      position: idx,
    });
  }
  return slots;
}

// ----------------------------------------------------------------------------
// Templates
// ----------------------------------------------------------------------------

export async function createTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readTemplateForm(formData);
  const slots = readSlotsFromForm(formData);

  if (!data.name || !data.base_price) {
    return { status: "error", message: "Nome e preço base são obrigatórios." };
  }
  if (slots.length === 0) {
    return { status: "error", message: "Adicione ao menos um slot à cesta." };
  }

  try {
    await apiFetch("/api/admin/cestas", {
      method: "POST",
      body: JSON.stringify({ ...data, slots }),
    });
    revalidatePath("/admin/cestas");
    redirect("/admin/cestas");
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateTemplateAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const data = readTemplateForm(formData);
  try {
    await apiFetch(`/api/admin/cestas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/cestas");
    revalidatePath(`/admin/cestas/${id}`);
    return { status: "ok", message: "Template atualizado." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function deleteTemplateAction(id: string): Promise<void> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/cestas/${id}`, { method: "DELETE" });
    revalidatePath("/admin/cestas");
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.detail);
    throw e;
  }
  redirect("/admin/cestas");
}

// ----------------------------------------------------------------------------
// Slots (individual updates after the template exists)
// ----------------------------------------------------------------------------

export async function addSlotAction(
  templateId: string,
  payload: SlotInput,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/cestas/${templateId}/slots`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath(`/admin/cestas/${templateId}`);
    return { status: "ok", message: "Slot adicionado." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function updateSlotAction(
  templateId: string,
  slotId: string,
  payload: Partial<SlotInput>,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/cestas/${templateId}/slots/${slotId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath(`/admin/cestas/${templateId}`);
    return { status: "ok", message: "Slot atualizado." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}

export async function deleteSlotAction(
  templateId: string,
  slotId: string,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/cestas/${templateId}/slots/${slotId}`, {
      method: "DELETE",
    });
    revalidatePath(`/admin/cestas/${templateId}`);
    return { status: "ok", message: "Slot removido." };
  } catch (e) {
    if (e instanceof ApiError) return { status: "error", message: e.detail };
    throw e;
  }
}
