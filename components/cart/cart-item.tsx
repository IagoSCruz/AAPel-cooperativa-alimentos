"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency, priceToNumber } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <Link
        href={`/produtos/${product.id}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {product.image_url ? (
          <SafeImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-secondary" />
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/produtos/${product.id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {product.name}
            </Link>
            <Link
              href={`/produtores/${product.producer.id}`}
              className="mt-0.5 block text-sm text-muted-foreground hover:text-accent"
            >
              {product.producer.name}
            </Link>
          </div>
          <p className="text-right font-medium text-foreground">
            {formatCurrency(priceToNumber(product.price) * quantity)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Quantity Controls */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Price per unit */}
          <span className="text-sm text-muted-foreground">
            {formatCurrency(priceToNumber(product.price))}/{product.unit}
          </span>

          {/* Remove */}
          <button
            onClick={() => removeItem(product.id)}
            className="flex items-center gap-1.5 text-sm text-destructive hover:underline"
            aria-label="Remover item"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
