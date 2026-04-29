/**
 * /admin/curadorias/[id] — edit a single curation:
 *   - View slots and currently selected options
 *   - Bulk replace options per slot
 *   - Transition status (DRAFT → OPEN → CLOSED)
 *   - Delete (only if DRAFT)
 */

import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";
import { CurationEditor } from "./editor";

// ----------------------------------------------------------------------------
// Types matching FastAPI BasketCurationResponse
// ----------------------------------------------------------------------------

export type CurationStatus = "DRAFT" | "OPEN" | "CLOSED";

type ProductResponse = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  product_type: "FOOD" | "CRAFT";
  organic: boolean;
  premium: boolean;
  available: boolean;
  category: { id: string; name: string };
  producer: { id: string; name: string; location: string | null };
};

type SlotOption = {
  product: ProductResponse;
  upgrade_fee: string;
};

type CuratedSlot = {
  slot: {
    id: string;
    slot_label: string;
    position: number;
    item_count: number;
  };
  options: SlotOption[];
};

export type CurationDetail = {
  id: string;
  template_id: string;
  template_name: string;
  base_price: string;
  delivery_week: string;
  customization_deadline: string;
  status: CurationStatus;
  slots: CuratedSlot[];
};

type Page<T> = { data: T[]; pagination: unknown };

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default async function CurationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let curation: CurationDetail;
  try {
    curation = await apiFetch<CurationDetail>(`/api/admin/curadorias/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  // Pull all FOOD products available to be added as options.
  // (Limited to a reasonable page; if catalogo grows, switch to autocomplete.)
  const products = await apiFetch<Page<ProductResponse>>(
    "/api/admin/produtos?limit=100",
  );

  const foodProducts = products.data.filter(
    (p) => p.product_type === "FOOD" && p.available,
  );

  return <CurationEditor curation={curation} foodProducts={foodProducts} />;
}
