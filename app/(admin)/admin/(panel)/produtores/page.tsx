import Link from "next/link";
import { Plus, Sprout } from "lucide-react";

import { apiFetch } from "@/lib/api-server";

type Producer = {
  id: string;
  name: string;
  location: string | null;
  since: number | null;
  active: boolean;
  specialties: string[] | null;
};

type Page<T> = { data: T[]; pagination: { total: number } };

export default async function ProdutoresPage({
  searchParams,
}: {
  searchParams: Promise<{ inativos?: string; deletados?: string }>;
}) {
  const sp = await searchParams;
  const incluirInativos = sp.inativos === "1";
  const incluirDeletados = sp.deletados === "1";
  const qs = new URLSearchParams({
    limit: "100",
    incluir_inativos: incluirInativos ? "true" : "false",
    incluir_deletados: incluirDeletados ? "true" : "false",
  });

  const result = await apiFetch<Page<Producer>>(
    `/api/admin/produtores?${qs}`,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Sprout className="h-7 w-7 text-primary" />
            Produtores
          </h1>
          <p className="text-muted-foreground mt-1">
            {result.pagination.total} produtor(es).
          </p>
        </div>
        <Link
          href="/admin/produtores/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo produtor
        </Link>
      </header>

      <div className="flex gap-4 text-sm">
        <Link
          href="/admin/produtores"
          className={!incluirInativos && !incluirDeletados ? "font-semibold" : "text-muted-foreground hover:underline"}
        >
          Apenas ativos
        </Link>
        <Link
          href="/admin/produtores?inativos=1"
          className={incluirInativos && !incluirDeletados ? "font-semibold" : "text-muted-foreground hover:underline"}
        >
          Incluir inativos
        </Link>
        <Link
          href="/admin/produtores?inativos=1&deletados=1"
          className={incluirDeletados ? "font-semibold" : "text-muted-foreground hover:underline"}
        >
          Incluir removidos
        </Link>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Localização</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Especialidades</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produtor cadastrado.
                </td>
              </tr>
            ) : (
              result.data.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.since ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.specialties?.join(", ") ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.active
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {p.active ? "ativo" : "inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/produtores/${p.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
