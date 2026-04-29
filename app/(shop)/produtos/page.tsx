"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Leaf } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { products } from "@/lib/data";
import { cn } from "@/lib/utils";

const categories = [
  { id: "todos", name: "Todos" },
  { id: "frutas", name: "Frutas" },
  { id: "verduras", name: "Verduras" },
  { id: "legumes", name: "Legumes" },
];

export default function ProdutosPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [showOrganic, setShowOrganic] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "todos" || product.category === selectedCategory;
      const matchesOrganic = !showOrganic || product.organic;

      return matchesSearch && matchesCategory && matchesOrganic;
    });
  }, [search, selectedCategory, showOrganic]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-foreground">
          Nossos Produtos
        </h1>
        <p className="mt-4 text-muted-foreground">
          Frutas, verduras e legumes frescos direto do produtor
        </p>
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {category.name}
            </button>
          ))}

          {/* Organic Filter */}
          <button
            onClick={() => setShowOrganic(!showOrganic)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              showOrganic
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Leaf className="h-4 w-4" />
            Orgânicos
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-8 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 py-16">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-foreground">
            Nenhum produto encontrado
          </p>
          <p className="mt-2 text-muted-foreground">
            Tente ajustar os filtros ou buscar por outro termo
          </p>
        </div>
      )}
    </div>
  );
}
