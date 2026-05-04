import { Suspense } from "react";
import { Filter } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "./_filters";
import { publicFetch } from "@/lib/api-public";
import type { CategoryItem, Page, ProductItem } from "@/lib/types";

interface SearchParams {
  busca?: string;
  categoria?: string;
  organico?: string;
  page?: string;
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // Build API query string from URL search params
  const apiParams = new URLSearchParams();
  if (sp.busca) apiParams.set("busca", sp.busca);
  if (sp.categoria && sp.categoria !== "todos")
    apiParams.set("categoria", sp.categoria);
  if (sp.organico === "1") apiParams.set("organico", "true");
  apiParams.set("limit", "40");
  if (sp.page) apiParams.set("page", sp.page);

  const [productsPage, categories] = await Promise.all([
    publicFetch<Page<ProductItem>>(
      `/api/produtos?${apiParams.toString()}`,
      { revalidate: 60 },
    ),
    publicFetch<CategoryItem[]>("/api/categorias", { revalidate: 3600 }),
  ]);

  const { data: products, pagination } = productsPage;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-foreground">
          Nossos Produtos
        </h1>
        <p className="mt-4 text-muted-foreground">
          Frutas, verduras e alimentos frescos direto do produtor
        </p>
      </div>

      {/* Filters — client component that updates URL search params */}
      <div className="mt-10">
        <Suspense>
          <ProductFilters categories={categories} />
        </Suspense>
      </div>

      {/* Results count */}
      <div className="mt-8 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {pagination.total}{" "}
          {pagination.total === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 py-16">
          <Filter className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-foreground">
            Nenhum produto encontrado
          </p>
          <p className="mt-2 text-muted-foreground">
            Tente ajustar os filtros ou buscar por outro termo
          </p>
        </div>
      )}
    </div>
  );
}
