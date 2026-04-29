import Link from "next/link";
import { Plus, Truck } from "lucide-react";

import { apiFetch } from "@/lib/api-server";

type Zone = {
  id: string;
  name: string;
  delivery_fee: string;
  minimum_order_value: string;
  estimated_minutes: number | null;
  active: boolean;
  neighborhoods: string[];
};

type Page<T> = { data: T[]; pagination: { total: number } };

export default async function ZonasPage({
  searchParams,
}: {
  searchParams: Promise<{ inativos?: string; deletados?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams({
    limit: "100",
    incluir_inativos: sp.inativos === "1" ? "true" : "false",
    incluir_deletados: sp.deletados === "1" ? "true" : "false",
  });
  const result = await apiFetch<Page<Zone>>(`/api/admin/zonas-entrega?${qs}`);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Truck className="h-7 w-7 text-primary" />
            Zonas de entrega
          </h1>
          <p className="text-muted-foreground mt-1">
            {result.pagination.total} zona(s).
          </p>
        </div>
        <Link
          href="/admin/zonas-entrega/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova zona
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {result.data.length === 0 ? (
          <div className="md:col-span-2 rounded-xl border bg-card p-12 text-center text-muted-foreground">
            Nenhuma zona cadastrada.
          </div>
        ) : (
          result.data.map((z) => (
            <Link
              key={z.id}
              href={`/admin/zonas-entrega/${z.id}`}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-serif text-xl font-semibold">{z.name}</h3>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    z.active ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {z.active ? "ativa" : "inativa"}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Frete:</span>{" "}
                  <strong>R$ {z.delivery_fee}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Pedido mínimo:</span>{" "}
                  R$ {z.minimum_order_value}
                </p>
                {z.estimated_minutes != null && (
                  <p>
                    <span className="text-muted-foreground">Tempo estimado:</span>{" "}
                    {z.estimated_minutes} min
                  </p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Bairros ({z.neighborhoods.length})
                </p>
                <p className="text-xs">
                  {z.neighborhoods.length === 0
                    ? "Nenhum bairro vinculado"
                    : z.neighborhoods.slice(0, 8).join(", ") +
                      (z.neighborhoods.length > 8 ? ` +${z.neighborhoods.length - 8}` : "")}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
