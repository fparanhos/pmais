"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  LayoutDashboard,
  ListChecks,
  Receipt,
  TrendingUp,
  Upload,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/receitas", label: "Receitas", icon: TrendingUp },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
];

const adminItems = [
  { href: "/admin/importar-planilha", label: "Importar planilha", icon: FileSpreadsheet },
  { href: "/admin/importar", label: "Importar Trello", icon: Upload },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      <div className="px-2 pb-2 text-[10px] font-bold tracking-widest uppercase text-sidebar-muted">
        Navegação
      </div>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors " +
              (active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground")
            }
          >
            {active && (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
            )}
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      {isAdmin && (
        <>
          <div className="px-2 pt-4 pb-2 text-[10px] font-bold tracking-widest uppercase text-sidebar-muted">
            Admin
          </div>
          {adminItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground")
                }
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
