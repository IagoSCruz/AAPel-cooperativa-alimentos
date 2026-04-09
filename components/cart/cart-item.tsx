"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartItem as CartItemType } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <Link
        href={`/produtos/${item.id}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/produtos/${item.id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {item.name}
            </Link>
            <Link
              href={`/produtores/${item.producerId}`}
              className="mt-0.5 block text-sm text-muted-foreground hover:text-accent"
            >
              {item.producerName}
            </Link>
          </div>
          <p className="text-right font-medium text-foreground">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Quantity Controls */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Price per unit */}
          <span className="text-sm text-muted-foreground">
            {formatCurrency(item.price)}/{item.unit}
          </span>

          {/* Remove */}
          <button
            onClick={() => removeItem(item.id)}
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
