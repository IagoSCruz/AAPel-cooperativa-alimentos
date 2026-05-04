import Link from "next/link";
import { Users, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { BasketTemplate } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

interface BasketCardProps {
  basket: BasketTemplate;
  featured?: boolean;
}

export function BasketCard({ basket, featured = false }: BasketCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card ${
        featured
          ? "border-accent shadow-lg ring-2 ring-accent"
          : "border-border"
      }`}
    >
      {featured && (
        <div className="absolute -right-12 top-6 rotate-45 bg-accent px-12 py-1 text-xs font-semibold text-accent-foreground">
          Mais popular
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {basket.image_url ? (
          <SafeImage
            src={basket.image_url}
            alt={basket.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-serif text-2xl font-bold text-foreground">
          {basket.name}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {basket.description}
        </p>

        {/* Serves */}
        {basket.serves && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Serve {basket.serves}</span>
          </div>
        )}

        {/* Slots */}
        {basket.slots.length > 0 && (
          <ul className="mt-4 space-y-2">
            {basket.slots.slice(0, 5).map((slot) => (
              <li
                key={slot.id}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Package className="h-4 w-4 text-accent" />
                <span>
                  {slot.slot_label}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({slot.item_count} {slot.item_count === 1 ? "item" : "itens"})
                  </span>
                </span>
              </li>
            ))}
            {basket.slots.length > 5 && (
              <li className="text-xs text-muted-foreground">
                + {basket.slots.length - 5} compartimentos
              </li>
            )}
          </ul>
        )}

        {/* Price */}
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(basket.base_price)}
            </span>
            <span className="text-muted-foreground">/semana</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Curadoria semanal de produtos frescos
          </p>
        </div>

        {/* CTA */}
        <Button
          className="mt-4 w-full"
          size="lg"
          variant={featured ? "primary" : "outline"}
          asChild
        >
          <Link href={`/cestas/${basket.id}`} className="flex items-center gap-2">
            Montar minha cesta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
