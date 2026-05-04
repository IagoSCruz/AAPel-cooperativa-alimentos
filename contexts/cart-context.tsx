"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { CartItem, ProductItem } from "@/lib/types";
import { priceToNumber } from "@/lib/utils";

const STORAGE_KEY = "aapel_cart";
/**
 * Bump this whenever CartItem shape or storage envelope changes.
 * On mismatch we silently discard the persisted cart instead of crashing on
 * stale data.
 */
const STORAGE_VERSION = 2;

type StoredCart = {
  version: number;
  items: CartItem[];
};

interface CartContextType {
  items: CartItem[];
  hydrated: boolean;
  /**
   * Adds one unit of `product` to the cart, or increments quantity if already
   * present. Caps at `product.stock` and silently no-ops past the cap (UI may
   * also disable the button via the returned `canAddMore` helper).
   */
  addItem: (product: ProductItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  /** Computed total as a number (price strings parsed to float). */
  totalPrice: number;
  /** Returns true if the user can still add another unit of this product. */
  canAddMore: (product: ProductItem) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed as StoredCart).version === STORAGE_VERSION &&
          Array.isArray((parsed as StoredCart).items)
        ) {
          setItems((parsed as StoredCart).items);
        }
        // else: schema drift — discard silently
      }
    } catch {
      // corrupted storage — start fresh
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      const envelope: StoredCart = { version: STORAGE_VERSION, items };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // quota exceeded or private mode — silently ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: ProductItem) => {
    setItems((current) => {
      const existing = current.find((i) => i.product.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      // Cap at product stock — server enforces this too, but stop the user
      // before they discover the limit at checkout.
      if (currentQty + 1 > product.stock) return current;

      if (existing) {
        return current.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((current) =>
      current.map((i) => {
        if (i.product.id !== productId) return i;
        // Cap at the snapshotted stock at add-time. Server still re-validates.
        const capped = Math.min(quantity, i.product.stock);
        return { ...i, quantity: capped };
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const canAddMore = useCallback(
    (product: ProductItem) => {
      const existing = items.find((i) => i.product.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      return currentQty < product.stock;
    },
    [items],
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + priceToNumber(i.product.price) * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        canAddMore,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
