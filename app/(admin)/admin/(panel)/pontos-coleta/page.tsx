import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { apiFetch } from "@/lib/api-server";

type CollectionPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  schedule: string | null;
  active: boolean;
};

type Page<T> = { data: T[]; pagination: { total: number } };

export default async function PontosColetaPage({
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
  const result = await apiFetch<Page<CollectionPoint>>(
    `/api/admin/pontos-coleta?${qs}`,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-7 w-7 text-primary" />
            Pontos de coleta
          </h1>
          <p className="text-muted-foreground mt-1">
            {result.pagination.total} ponto(s) cadastrado(s).
          </p>
        </div>
        <Link
          href="/admin/pontos-coleta/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo ponto
        </Link>
      </header>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Endereço</th>
              <th className="px-4 py-3">Cidade/UF</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum ponto de coleta cadastrado.
                </td>
              </tr>
            ) : (
              result.data.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.address}</td>
                  <td className="px-4 py-3">{p.city}/{p.state}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.schedule ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.active ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-700"
                    }`}>
                      {p.active ? "ativo" : "inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pontos-coleta/${p.id}`}
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
