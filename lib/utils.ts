import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Convert an API-serialized money string (e.g. "19.90") to a number.
 * Centralised so that decimal handling can later be swapped for a
 * higher-precision lib (Decimal.js, dinero.js) without scattered changes.
 */
export function priceToNumber(price: string): number {
  return parseFloat(price);
}

/** Convenience: parse-then-format in one call. */
export function formatPrice(price: string): string {
  return formatCurrency(priceToNumber(price));
}
