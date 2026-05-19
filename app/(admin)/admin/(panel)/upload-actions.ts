"use server";

import { requireAdmin } from "@/lib/session";

export type UploadState =
  | { status: "idle" }
  | { status: "ok"; url: string }
  | { status: "error"; message: string };

const API_BASE = process.env.INTERNAL_API_URL ?? "http://localhost:8000";

/**
 * Upload an image to the API (admin-only). Returns a public path like /uploads/abc.jpg.
 */
export async function uploadImageAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const session = await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo de imagem." };
  }

  const body = new FormData();
  body.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/api/admin/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      let message = "Falha ao enviar imagem.";
      try {
        const payload = (await res.json()) as { detail?: string };
        if (payload.detail) message = payload.detail;
      } catch {
        /* ignore */
      }
      return { status: "error", message };
    }

    const data = (await res.json()) as { url: string };
    if (!data.url) {
      return { status: "error", message: "Resposta inválida do servidor." };
    }
    return { status: "ok", url: data.url };
  } catch {
    return {
      status: "error",
      message: "Não foi possível contactar o servidor. Tente novamente.",
    };
  }
}
