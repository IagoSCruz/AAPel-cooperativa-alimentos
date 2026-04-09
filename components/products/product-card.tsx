"use client";

import Link from "next/link";
import { Plus, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/data";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image: product.image,
      producerId: product.producer.id,
      producerName: product.producer.name,
    });
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/produtos/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.organic && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
              <Leaf className="h-3 w-3" />
              Orgânico
            </div>
          )}
          {product.seasonal && (
            <div className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              Da estação
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/produtores/${product.producer.id}`}>
          <p className="text-xs text-muted-foreground hover:text-accent">
            {product.producer.name}
          </p>
        </Link>
        <Link href={`/produtos/${product.id}`}>
          <h3 className="mt-1 font-serif text-lg font-semibold text-foreground hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm text-muted-foreground">
              /{product.unit}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.available}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
