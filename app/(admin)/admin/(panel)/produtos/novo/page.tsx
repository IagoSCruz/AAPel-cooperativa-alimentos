import { apiFetch } from "@/lib/api-server";
import type { Page } from "@/lib/types";

import { ProductForm, CategoryOption, ProducerOption } from "../_form";
import { createProductAction } from "../actions";

export default async function NovoProdutoPage() {
  const [categories, producers] = await Promise.all([
    apiFetch<Page<CategoryOption>>("/api/admin/categorias?limit=100"),
    apiFetch<Page<ProducerOption>>("/api/admin/produtores?limit=100"),
  ]);

  return (
    <ProductForm
      categories={categories.data}
      producers={producers.data}
      onSubmit={createProductAction}
      submitLabel="Criar produto"
    />
  );
}
