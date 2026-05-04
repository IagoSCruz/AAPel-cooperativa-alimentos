"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Leaf, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency, formatPrice, priceToNumber } from "@/lib/utils";
import { ProductCard } from "@/components/products/product-card";
import type { ProductItem } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

interface ProductDetailClientProps {
  product: ProductItem;
  related: ProductItem[];
}

export function ProductDetailClient({ product, related }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setQuantity(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href="/produtos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para produtos
      </Link>

      {/* Product Details */}
      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          {product.image_url ? (
            <SafeImage
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
          {product.organic && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
              <Leaf className="h-4 w-4" />
              Orgânico
            </div>
          )}
          {product.seasonal && (
            <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              Da estação
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <Link
            href={`/produtores/${product.producer.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
          >
            <MapPin className="h-4 w-4" />
            {product.producer.name}
            {product.producer.location && ` · ${product.producer.location}`}
          </Link>

          <h1 className="mt-2 font-serif text-3xl font-bold text-foreground lg:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="text-lg text-muted-foreground">/{product.unit}</span>
          </div>

          {/* Stock badge */}
          {product.stock <= 5 && product.stock > 0 && (
            <p className="mt-2 text-sm font-medium text-amber-600">
              Apenas {product.stock} em estoque
            </p>
          )}

          {/* Quantity Selector */}
          <div className="mt-8">
            <label className="text-sm font-medium text-foreground">Quantidade</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-11 w-11 items-center justify-center text-foreground hover:bg-secondary"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="flex h-11 w-11 items-center justify-center text-foreground hover:bg-secondary"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-muted-foreground">
                Total: {formatCurrency(priceToNumber(product.price) * quantity)}
              </span>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="mt-8"
            onClick={handleAddToCart}
            disabled={!product.available || product.stock === 0}
          >
            <ShoppingCart className="h-5 w-5" />
            {product.available && product.stock > 0
              ? "Adicionar ao carrinho"
              : "Indisponível"}
          </Button>

          {/* Info Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-medium text-foreground">Colheita</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Colhido no dia ou véspera da entrega
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-medium text-foreground">Entrega</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Entregamos às terças e sextas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Mais produtos de {product.producer.name}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
