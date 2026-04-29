/**
 * Shop layout — wraps customer-facing routes with Header, Footer, CartProvider.
 *
 * URLs resolved by this group: /, /produtos, /cestas, /produtores, /carrinho,
 * /checkout, /conta, /sobre. The route group `(shop)` itself is invisible in URLs.
 */

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/contexts/cart-context";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
