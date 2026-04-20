"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(app)/actions";

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  role: string;
}) {
  const initials = (name || email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{name || email}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {role}
          </div>
        </div>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </form>
    </div>
  );
}
