import Link from "next/link";
import { Apple, Plus } from "lucide-react";

import { apiFetch } from "@/lib/api-server";

type Product = {
  id: string;
  name: string;
  price: string;
  unit: string;
  stock: number;
  product_type: "FOOD" | "CRAFT";
  organic: boolean;
  premium: boolean;
  available: boolean;
  category: { name: string };
  producer: { name: string };
};

type Page<T> = { data: T[]; pagination: { total: number } };

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ deletados?: string }>;
}) {
  const sp = await searchParams;
  const incluirDeletados = sp.deletados === "1";
  const qs = new URLSearchParams({
    limit: "100",
    incluir_indisponiveis: "true",
    incluir_deletados: incluirDeletados ? "true" : "false",
  });

  const result = await apiFetch<Page<Product>>(`/api/admin/produtos?${qs}`);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Apple className="h-7 w-7 text-primary" />
            Produtos
          </h1>
          <p className="text-muted-foreground mt-1">
            {result.pagination.total} produto(s).
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Link>
      </header>

      <div className="flex gap-4 text-sm">
        <Link
          href="/admin/produtos"
          className={!incluirDeletados ? "font-semibold" : "text-muted-foreground hover:underline"}
        >
          Ativos
        </Link>
        <Link
          href="/admin/produtos?deletados=1"
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
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Produtor</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-right">Estoque</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              result.data.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.product_type === "FOOD"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {p.product_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.producer.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">R$ {p.price}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                  <td className="px-4 py-3 text-xs space-x-1">
                    {!p.available && <Pill color="zinc">indisp</Pill>}
                    {p.organic && <Pill color="green">orgânico</Pill>}
                    {p.premium && <Pill color="amber">premium</Pill>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/produtos/${p.id}`}
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

function Pill({ color, children }: { color: "green" | "amber" | "zinc"; children: React.ReactNode }) {
  const map = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    zinc: "bg-zinc-200 text-zinc-700",
  };
  return (
    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] ${map[color]}`}>
      {children}
    </span>
  );
}
