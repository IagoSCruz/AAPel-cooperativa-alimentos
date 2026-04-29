"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const mockUser = {
  name: "Maria Silva",
  email: "maria@email.com",
  since: "Janeiro 2024",
};

const mockOrders = [
  {
    id: "AAP-X8K2M1",
    date: "05/04/2026",
    status: "Entregue",
    total: 87.5,
    items: 5,
  },
  {
    id: "AAP-Y9L3N2",
    date: "29/03/2026",
    status: "Entregue",
    total: 124.9,
    items: 8,
  },
  {
    id: "AAP-Z0M4O3",
    date: "22/03/2026",
    status: "Entregue",
    total: 65.0,
    items: 4,
  },
];

const menuItems = [
  { icon: Package, label: "Meus Pedidos", href: "/conta/pedidos", count: 3 },
  { icon: Repeat, label: "Minhas Assinaturas", href: "/conta/assinaturas" },
  { icon: Heart, label: "Favoritos", href: "/conta/favoritos" },
  { icon: MapPin, label: "Endereços", href: "/conta/enderecos" },
  { icon: CreditCard, label: "Formas de Pagamento", href: "/conta/pagamentos" },
  { icon: Settings, label: "Configurações", href: "/conta/configuracoes" },
];

type Tab = "pedidos" | "perfil";

export default function ContaPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pedidos");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {mockUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {mockUser.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cliente desde {mockUser.since}
                </p>
              </div>
            </div>

            {/* Menu */}
            <nav className="mt-8 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    {item.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.count && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-medium text-accent-foreground">
                        {item.count}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <button className="mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
              Sair da conta
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "pedidos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Pedidos Recentes
            </button>
            <button
              onClick={() => setActiveTab("perfil")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "perfil"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Meu Perfil
            </button>
          </div>

          {/* Content */}
          <div className="mt-8">
            {activeTab === "pedidos" && (
              <div className="space-y-4">
                {mockOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Pedido #{order.id}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {order.date}
                          </span>
                          <span>{order.items} itens</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                        {order.status}
                      </span>
                      <p className="mt-2 font-semibold text-foreground">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/conta/pedidos">Ver todos os pedidos</Link>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "perfil" && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Informações Pessoais
                </h3>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      defaultValue={mockUser.name}
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      E-mail
                    </label>
                    <input
                      type="email"
                      defaultValue={mockUser.email}
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      defaultValue="(53) 99999-0000"
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      CPF
                    </label>
                    <input
                      type="text"
                      defaultValue="000.000.000-00"
                      className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button>Salvar alterações</Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
