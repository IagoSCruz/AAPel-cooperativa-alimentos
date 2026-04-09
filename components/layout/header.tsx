"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Leaf,
  Search,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Início", href: "/" },
  { name: "Produtos", href: "/produtos" },
  { name: "Produtores", href: "/produtores" },
  { name: "Cestas", href: "/cestas" },
  { name: "Sobre", href: "/sobre" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-semibold text-primary">
              AAPel
            </span>
            <span className="text-xs text-muted-foreground">
              Cooperativa de Alimentos
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground lg:block"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/conta"
            className="hidden rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground lg:block"
            aria-label="Minha conta"
          >
            <User className="h-5 w-5" />
          </Link>

          <Link
            href="/carrinho"
            className="relative rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Carrinho de compras"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-card transition-all duration-300 lg:hidden",
          mobileMenuOpen ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block rounded-lg px-4 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/conta"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            <User className="h-5 w-5" />
            Minha Conta
          </Link>
        </div>
      </div>
    </header>
  );
}
