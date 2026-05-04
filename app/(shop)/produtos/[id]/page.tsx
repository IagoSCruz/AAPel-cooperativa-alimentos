import { notFound } from "next/navigation";
import { publicFetch, ApiPublicError } from "@/lib/api-public";
import { ProductDetailClient } from "./_detail";
import type { Page, ProductItem } from "@/lib/types";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: ProductItem;
  try {
    product = await publicFetch<ProductItem>(`/api/produtos/${id}`, {
      revalidate: 120,
    });
  } catch (err) {
    if (err instanceof ApiPublicError && err.status === 404) notFound();
    throw err;
  }

  // Fetch related products from the same producer. Best-effort: if this
  // sidebar query fails the main page still works, so we log+swallow rather
  // than 500 the whole page.
  let related: ProductItem[] = [];
  try {
    const relatedPage = await publicFetch<Page<ProductItem>>(
      `/api/produtos?produtor_id=${product.producer.id}&limit=5`,
      { revalidate: 120 },
    );
    related = relatedPage.data.filter((p) => p.id !== product.id).slice(0, 4);
  } catch (err) {
    console.error("[produtos/[id]] failed to load related products", err);
  }

  return <ProductDetailClient product={product} related={related} />;
}
