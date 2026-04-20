"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, TrendingUp } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/receitas", label: "Receitas", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      <div className="px-2 pb-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
        Navegação
      </div>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors " +
              (active
                ? "bg-primary-soft text-primary font-semibold"
                : "text-foreground/80 hover:bg-muted hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
