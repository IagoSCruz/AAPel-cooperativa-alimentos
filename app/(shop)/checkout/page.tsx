import { publicFetch } from "@/lib/api-public";
import { CheckoutClient } from "./_checkout-client";
import type { DeliveryZone } from "@/lib/types";

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
