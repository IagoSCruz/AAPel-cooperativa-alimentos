import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";

import { CollectionPointForm, CollectionPointInitial } from "../_form";
import { updateCollectionPointAction } from "../actions";

export default async function EditPontoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let point: CollectionPointInitial;
  try {
    point = await apiFetch<CollectionPointInitial>(`/api/admin/pontos-coleta/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <CollectionPointForm
      initial={point}
      onSubmit={updateCollectionPointAction.bind(null, id)}
      submitLabel="Salvar alterações"
    />
  );
}
