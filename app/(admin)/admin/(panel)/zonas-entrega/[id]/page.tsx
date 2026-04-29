import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";

import { ZoneForm, ZoneInitial } from "../_form";
import { updateZoneAction } from "../actions";

export default async function EditZonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let zone: ZoneInitial;
  try {
    zone = await apiFetch<ZoneInitial>(`/api/admin/zonas-entrega/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <ZoneForm
      initial={zone}
      onSubmit={updateZoneAction.bind(null, id)}
      submitLabel="Salvar alterações"
    />
  );
}
