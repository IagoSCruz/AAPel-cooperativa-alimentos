import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";

import { ProducerForm, ProducerInitial } from "../_form";
import { updateProducerAction } from "../actions";

export default async function EditProdutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let producer: ProducerInitial;
  try {
    producer = await apiFetch<ProducerInitial>(`/api/admin/produtores/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <ProducerForm
      initial={producer}
      onSubmit={updateProducerAction.bind(null, id)}
      submitLabel="Salvar alterações"
    />
  );
}
