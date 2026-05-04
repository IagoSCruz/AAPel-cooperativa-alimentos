import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, Package, Truck, Users } from "lucide-react";
import { publicFetch, ApiPublicError } from "@/lib/api-public";
import { getCustomerSession } from "@/lib/customer-session";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BasketCustomizer } from "./_basket-customizer";
import type { BasketCuration, BasketTemplate, DeliveryZone } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

export default async function BasketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Run all fetches in parallel
  const [templateResult, sessionResult] = await Promise.allSettled([
    publicFetch<BasketTemplate>(`/api/cestas/${id}`, { revalidate: 3600 }),
    getCustomerSession(),
  ]);

  if (
    templateResult.status === "rejected" &&
    templateResult.reason instanceof ApiPublicError &&
    templateResult.reason.status === 404
  ) {
    notFound();
  }
  if (templateResult.status === "rejected") throw templateResult.reason;

  const template = templateResult.value as BasketTemplate;
  const session =
    sessionResult.status === "fulfilled" ? sessionResult.value : null;

  // Optional: current open curation — 404 is graceful, 5xx bubbles up
  let curation: BasketCuration | null = null;
  try {
    curation = await publicFetch<BasketCuration>(
      `/api/cestas/${id}/curadoria-atual`,
      { revalidate: 300 },
    );
  } catch (err) {
    if (err instanceof ApiPublicError && err.status === 404) {
      curation = null;
    } else {
      throw err;
    }
  }

  // Delivery zones — needed by the customizer form
  let zones: DeliveryZone[] = [];
  try {
    zones = await publicFetch<DeliveryZone[]>("/api/zonas-entrega", {
      revalidate: 3600,
    });
  } catch {
    // zones is optional; the customizer still renders without them
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href="/cestas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas as cestas
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        {/* Left column — template details */}
        <div>
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            {template.image_url ? (
              <SafeImage
                src={template.image_url}
                alt={template.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-secondary" />
            )}
          </div>

          {/* Meta */}
          <div className="mt-6">
            <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
              {template.name}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {template.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              {template.serves && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span>Serve {template.serves}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-5 w-5" />
                <span>Entrega semanal</span>
              </div>
            </div>

            {/* Slots overview */}
            <div className="mt-8">
              <h3 className="font-medium text-foreground">
                Compartimentos da cesta:
              </h3>
              <ul className="mt-3 space-y-2">
                {template.slots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Package className="h-4 w-4 text-accent" />
                    <span>
                      {slot.slot_label}
                      <span className="ml-1 text-xs">
                        ({slot.item_count}{" "}
                        {slot.item_count === 1 ? "item" : "itens"})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price badge when no curation open */}
            {!curation && (
              <div className="mt-8 rounded-xl bg-muted p-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Valor por entrega
                    </span>
                    <div className="mt-1">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPrice(template.base_price)}
                      </span>
                      <span className="ml-1 text-muted-foreground">/semana</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Ainda não há curadoria aberta para esta semana. Você será
                      notificado quando a seleção estiver disponível.
                    </p>
                  </div>
                </div>

                <Button className="mt-4 w-full" size="lg" asChild>
                  <Link href="/cestas">Ver outras cestas</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column — customizer (when curation is open) or CTA */}
        <div>
          {curation ? (
            <>
              {/* Curation week header */}
              <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-accent" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Curadoria aberta — semana de{" "}
                      {new Date(curation.delivery_week).toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "long" },
                      )}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Prazo:{" "}
                      {new Date(
                        curation.customization_deadline,
                      ).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <BasketCustomizer
                curation={curation}
                zones={zones}
                isAuthenticated={!!session}
              />
            </>
          ) : (
            /* No open curation — secondary CTA */
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 font-medium text-foreground">
                Curadoria em breve
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Volte quando a seleção semanal estiver aberta para personalizar
                sua cesta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
