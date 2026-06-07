import { publicFetch } from "@/lib/api-public";
import { CheckoutClient } from "./_checkout-client";
import type { DeliveryZone } from "@/lib/types";

// Rendered at request time — depends on the FastAPI backend, which isn't
// available during the build/prerender step.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let zones: DeliveryZone[] = [];
  try {
    zones = await publicFetch<DeliveryZone[]>("/api/zonas-entrega", {
      revalidate: 3600,
    });
  } catch {
    // non-critical — checkout still works with PICKUP only
  }

  return <CheckoutClient zones={zones} />;
}
