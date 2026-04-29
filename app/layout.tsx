/**
 * Root layout — minimal chrome shared by ALL routes (shop and admin).
 *
 * Header/Footer/CartProvider are scoped to the (shop) route group; admin
 * routes have their own layout under (admin)/admin/(panel)/layout.tsx.
 */

import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "AAPel - Cooperativa de Alimentos | Do Campo à Sua Mesa",
  description:
    "Conectamos agricultores locais a consumidores conscientes. Frutas, verduras e legumes frescos direto do produtor para sua casa.",
  keywords: [
    "cooperativa",
    "alimentos orgânicos",
    "hortifruti",
    "agricultura familiar",
    "produtos frescos",
  ],
};

export const viewport: Viewport = {
  themeColor: "#1a3a2f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
