import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { apiFetch } from "@/lib/api-server";

type Template = {
  id: string;
  name: string;
  description: string | null;
  base_price: string;
  serves: string | null;
  customization_window_hours: number;
  active: boolean;
  slots: Array<{ id: string; slot_label: string; item_count: number }>;
};

type Page<T> = { data: T[]; pagination: { total: number } };

export default async function CestasPage({
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
  const result = await apiFetch<Page<Template>>(`/api/admin/cestas?${qs}`);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Package className="h-7 w-7 text-primary" />
            Cestas (templates)
          </h1>
          <p className="text-muted-foreground mt-1">
            {result.pagination.total} template(s). Cada template define a estrutura
            de slots — a curadoria semanal define os produtos de cada slot.
          </p>
        </div>
        <Link
          href="/admin/cestas/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova cesta
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {result.data.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 rounded-xl border bg-card p-12 text-center text-muted-foreground">
            Nenhum template de cesta cadastrado.
          </div>
        ) : (
          result.data.map((t) => (
            <Link
              key={t.id}
              href={`/admin/cestas/${t.id}`}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-serif text-lg font-semibold">{t.name}</h3>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.active ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {t.active ? "ativo" : "inativo"}
                </span>
              </div>
              {t.description && (
                <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
              )}
              <div className="flex items-center justify-between mb-3">
                <p className="text-2xl font-serif font-bold">R$ {t.base_price}</p>
                {t.serves && (
                  <p className="text-xs text-muted-foreground">{t.serves}</p>
                )}
              </div>
              <div className="pt-3 border-t space-y-1">
                <p className="text-xs text-muted-foreground">Slots ({t.slots.length})</p>
                {t.slots.map((s) => (
                  <p key={s.id} className="text-sm">
                    <strong>{s.item_count}×</strong> {s.slot_label}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Janela de customização: {t.customization_window_hours}h
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
