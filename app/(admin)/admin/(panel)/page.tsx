/**
 * Admin home — quick-access hub for the three main areas.
 * KPIs / analytics land in Phase 4 (dashboard endpoint not yet implemented).
 */

import Link from "next/link";
import {
  Apple,
  Calendar,
  MapPin,
  Package,
  ShoppingBag,
  Sprout,
  Tags,
  Truck,
} from "lucide-react";

export default function AdminHomePage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-bold">Painel AAPel</h1>
        <p className="text-muted-foreground mt-1">
          Selecione uma área para começar.
        </p>
      </header>

      {/* Operações semanais */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Operações
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/curadorias"
            className="flex items-start gap-4 rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">Curadorias</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Defina os produtos elegíveis por slot e controle o status da
                curadoria semanal.
              </p>
            </div>
          </Link>
          <Link
            href="/admin/pedidos"
            className="flex items-start gap-4 rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">Pedidos</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Acompanhe e atualize o status de pedidos e pagamentos dos
                clientes.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Catálogo */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Catálogo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HubCard href="/admin/produtos" icon={Apple} label="Produtos" description="CRUD de produtos avulsos e sazonais" />
          <HubCard href="/admin/produtores" icon={Sprout} label="Produtores" description="Cadastro e histórico de produtores" />
          <HubCard href="/admin/categorias" icon={Tags} label="Categorias" description="Organização do catálogo por categoria" />
          <HubCard href="/admin/cestas" icon={Package} label="Cestas" description="Templates de cesta com slots e preços" />
        </div>
      </section>

      {/* Logística */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Logística
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <HubCard href="/admin/zonas-entrega" icon={Truck} label="Zonas de entrega" description="Bairros, taxa de frete e pedido mínimo" />
          <HubCard href="/admin/pontos-coleta" icon={MapPin} label="Pontos de coleta" description="Endereços e horários de retirada" />
        </div>
      </section>
    </div>
  );
}

function HubCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
