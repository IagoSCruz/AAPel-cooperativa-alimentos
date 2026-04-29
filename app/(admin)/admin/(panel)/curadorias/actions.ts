"use server";

/**
 * Server actions for curadoria management.
 *
 * Each action calls the FastAPI admin endpoints with the session bearer,
 * then revalidates the relevant route(s). Errors bubble as `ApiError` and
 * are surfaced to the client via `useActionState`.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/session";

// ----------------------------------------------------------------------------
// Types matching FastAPI schemas (subset, for DTO at the boundary)
// ----------------------------------------------------------------------------

export type CurationStatus = "DRAFT" | "OPEN" | "CLOSED";

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message?: string }
  | { status: "error"; message: string };

export const INITIAL: ActionState = { status: "idle" };

// ----------------------------------------------------------------------------
// createCuration
// ----------------------------------------------------------------------------

export async function createCurationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const templateId = formData.get("template_id")?.toString();
  const deliveryWeek = formData.get("delivery_week")?.toString(); // YYYY-MM-DD
  const deadline = formData.get("customization_deadline")?.toString(); // ISO datetime

  if (!templateId || !deliveryWeek || !deadline) {
    return { status: "error", message: "Preencha todos os campos." };
  }

  // Coerce deadline to UTC ISO with timezone (FastAPI requires tzinfo)
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return { status: "error", message: "Data limite inválida." };
  }

  try {
    const created = await apiFetch<{ id: string }>("/api/admin/curadorias", {
      method: "POST",
      body: JSON.stringify({
        basket_template_id: templateId,
        delivery_week: deliveryWeek,
        customization_deadline: deadlineDate.toISOString(),
        status: "DRAFT",
      }),
    });
    revalidatePath("/admin/curadorias");
    redirect(`/admin/curadorias/${created.id}`);
  } catch (e) {
    if (e instanceof ApiError) {
      return { status: "error", message: e.detail };
    }
    throw e;
  }
}

// ----------------------------------------------------------------------------
// changeStatus
// ----------------------------------------------------------------------------

export async function changeStatusAction(
  curationId: string,
  status: CurationStatus,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/curadorias/${curationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    revalidatePath(`/admin/curadorias/${curationId}`);
    revalidatePath("/admin/curadorias");
    return { status: "ok", message: `Status alterado para ${status}.` };
  } catch (e) {
    if (e instanceof ApiError) {
      return { status: "error", message: e.detail };
    }
    throw e;
  }
}

// ----------------------------------------------------------------------------
// setOptions — bulk replace
// ----------------------------------------------------------------------------

export type OptionInput = {
  basket_slot_id: string;
  product_id: string;
  upgrade_fee?: string; // decimal as string
};

export async function setOptionsAction(
  curationId: string,
  options: OptionInput[],
): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/curadorias/${curationId}/opcoes`, {
      method: "PATCH",
      body: JSON.stringify({
        options: options.map((o) => ({
          basket_slot_id: o.basket_slot_id,
          product_id: o.product_id,
          upgrade_fee: o.upgrade_fee ?? "0",
        })),
      }),
    });
    revalidatePath(`/admin/curadorias/${curationId}`);
    return { status: "ok", message: "Opções atualizadas com sucesso." };
  } catch (e) {
    if (e instanceof ApiError) {
      return { status: "error", message: e.detail };
    }
    throw e;
  }
}

// ----------------------------------------------------------------------------
// deleteCuration
// ----------------------------------------------------------------------------

export async function deleteCurationAction(curationId: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await apiFetch(`/api/admin/curadorias/${curationId}`, { method: "DELETE" });
    revalidatePath("/admin/curadorias");
    redirect("/admin/curadorias");
  } catch (e) {
    if (e instanceof ApiError) {
      return { status: "error", message: e.detail };
    }
    throw e;
  }
}
