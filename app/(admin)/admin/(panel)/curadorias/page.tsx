/**
 * /admin/curadorias — list of all weekly curations + form to open a new one.
 *
 * Uses RSC to fetch from FastAPI server-side with the admin bearer.
 */

import Link from "next/link";
import { Calendar, Plus } from "lucide-react";

import { apiFetch } from "@/lib/api-server";
import { CreateCurationForm } from "./create-form";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type BasketTemplate = {
  id: string;
  name: string;
  base_price: string;
  customization_window_hours: number;
  active: boolean;
};

type CurationStatus = "DRAFT" | "OPEN" | "CLOSED";

type CurationListItem = {
  id: string;
  template_id: string;
  template_name: string;
  delivery_week: string;
  customization_deadline: string;
  status: CurationStatus;
  slots: Array<{ slot: { id: string }; options: unknown[] }>;
};

type Page<T> = {
  data: T[];
  pagination: { total: number; page: number; limit: number; has_next: boolean };
};

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default async function CuradoriasPage() {
  const [curations, templates] = await Promise.all([
    apiFetch<Page<CurationListItem>>("/api/admin/curadorias?limit=50"),
    apiFetch<Page<BasketTemplate>>("/api/admin/cestas?limit=50"),
  ]);

  const activeTemplates = templates.data.filter((t) => t.active);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold">Curadorias</h1>
        <p className="text-muted-foreground mt-1">
          Defina os produtos elegíveis para cada cesta a cada semana de entrega.
        </p>
      </header>

      <section className="rounded-xl bg-card border p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5" />
          Abrir nova curadoria
        </h2>
        {activeTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum template de cesta ativo. Cadastre um template antes de
            abrir curadoria.
          </p>
        ) : (
          <CreateCurationForm templates={activeTemplates} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Histórico de curadorias</h2>
        {curations.data.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhuma curadoria criada ainda.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Cesta</th>
                  <th className="px-4 py-3">Semana de entrega</th>
                  <th className="px-4 py-3">Limite de customização</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Opções</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {curations.data.map((c) => (
                  <CurationRow key={c.id} curation={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Row
// ----------------------------------------------------------------------------

function CurationRow({ curation: c }: { curation: CurationListItem }) {
  const totalOptions = c.slots.reduce((sum, s) => sum + s.options.length, 0);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const fmtDeadline = (s: string) =>
    new Date(s).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <tr className="border-t hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium">{c.template_name}</td>
      <td className="px-4 py-3">{fmtDate(c.delivery_week)}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {fmtDeadline(c.customization_deadline)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={c.status} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{totalOptions}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/curadorias/${c.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Editar →
        </Link>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: CurationStatus }) {
  const variants: Record<CurationStatus, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    OPEN: "bg-green-100 text-green-800",
    CLOSED: "bg-zinc-200 text-zinc-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[status]}`}
    >
      {status}
    </span>
  );
}
