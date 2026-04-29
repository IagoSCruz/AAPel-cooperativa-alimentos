import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";

import { ProductForm, ProductInitial, CategoryOption, ProducerOption } from "../_form";
import { updateProductAction } from "../actions";

type Page<T> = { data: T[] };

export default async function EditProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: ProductInitial;
  try {
    product = await apiFetch<ProductInitial>(`/api/admin/produtos/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const [categories, producers] = await Promise.all([
    apiFetch<Page<CategoryOption>>("/api/admin/categorias?limit=100"),
    apiFetch<Page<ProducerOption>>("/api/admin/produtores?limit=100"),
  ]);

  return (
    <ProductForm
      initial={product}
      categories={categories.data}
      producers={producers.data}
      onSubmit={updateProductAction.bind(null, id)}
      submitLabel="Salvar alterações"
    />
  );
}
