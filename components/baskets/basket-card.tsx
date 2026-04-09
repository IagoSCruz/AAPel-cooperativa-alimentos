import Link from "next/link";
import { Check, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Basket } from "@/lib/data";

interface BasketCardProps {
  basket: Basket;
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
        <img
          src={basket.image}
          alt={basket.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-foreground">
            {basket.frequency}
          </span>
        </div>
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
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Serve {basket.serves}</span>
        </div>

        {/* Items */}
        <ul className="mt-4 space-y-2">
          {basket.items.map((item, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Check className="h-4 w-4 text-accent" />
              {item}
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {formatCurrency(basket.price)}
            </span>
            <span className="text-muted-foreground">/semana</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="mt-4 w-full"
          size="lg"
          variant={featured ? "primary" : "outline"}
          asChild
        >
          <Link href={`/cestas/${basket.id}`}>Assinar esta cesta</Link>
        </Button>
      </div>
    </div>
  );
}
