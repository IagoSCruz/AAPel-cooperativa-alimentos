"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryItem } from "@/lib/types";

interface ProductFiltersProps {
  categories: CategoryItem[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const busca = searchParams.get("busca") ?? "";
  const categoria = searchParams.get("categoria") ?? "todos";
  const organico = searchParams.get("organico") === "1";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "todos") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 whenever filters change
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        isPending && "opacity-60 transition-opacity",
      )}
    >
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produtos..."
          defaultValue={busca}
          onChange={(e) => updateParams({ busca: e.target.value })}
          className="w-full rounded-lg border border-input bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category + Organic */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => updateParams({ categoria: "todos" })}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            categoria === "todos"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          Todos
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParams({ categoria: cat.name })}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              categoria === cat.name
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {cat.name}
          </button>
        ))}

        <button
          onClick={() => updateParams({ organico: organico ? null : "1" })}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            organico
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          <Leaf className="h-4 w-4" />
          Orgânicos
        </button>
      </div>
    </div>
  );
}
