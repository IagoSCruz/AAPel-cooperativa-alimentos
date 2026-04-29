/**
 * /admin/categorias — list + inline create form.
 *
 * Categorias raramente mudam e não são extensas: lista + form abaixo.
 * Edição inline via expansão de linha.
 */

import { Tags } from "lucide-react";

import { apiFetch } from "@/lib/api-server";
import { CategoryRow } from "./category-row";
import { CreateCategoryForm } from "./create-form";

type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

type Page<T> = { data: T[]; pagination: { total: number } };

export default async function CategoriasPage() {
  const result = await apiFetch<Page<Category>>("/api/admin/categorias?limit=100");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Tags className="h-7 w-7 text-primary" />
          Categorias
        </h1>
        <p className="text-muted-foreground mt-1">
          {result.pagination.total} categoria(s). Categorias são referenciadas por
          produtos — nomes podem ser editados, mas a exclusão é desabilitada.
        </p>
      </header>

      <section className="rounded-xl bg-card border p-6">
        <h2 className="text-lg font-semibold mb-4">Nova categoria</h2>
        <CreateCategoryForm />
      </section>

      <section className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
