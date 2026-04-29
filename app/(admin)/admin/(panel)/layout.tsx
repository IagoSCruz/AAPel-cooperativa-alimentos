/**
 * Protected admin panel layout.
 *
 * Server-side auth guard (defense in depth alongside middleware.ts), plus
 * the sidebar + main content chrome shared by every admin page.
 */

import Link from "next/link";
import { Calendar, LayoutDashboard, Leaf, LogOut } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { logoutAction } from "../login/actions";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-card">
        <div className="p-4 border-b">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-serif text-lg font-bold"
          >
            <Leaf className="h-5 w-5 text-primary" />
            AAPel · Admin
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          <NavItem href="/admin" icon={LayoutDashboard}>
            Início
          </NavItem>
          <NavItem href="/admin/curadorias" icon={Calendar}>
            Curadorias
          </NavItem>
        </nav>

        <form action={logoutAction} className="p-3 border-t mt-auto">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
