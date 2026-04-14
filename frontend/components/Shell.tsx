"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { clearToken, fetcher } from "@/lib/api";

function Item({ href, children, icon, match }: any) {
  const pathname = usePathname();
  const active = match ? pathname?.startsWith(match) : pathname === href;
  return (
    <Link href={href} className={"nav-item " + (active ? "active" : "")}>
      <span style={{ width: 16, display: "inline-block" }}>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

export default function Shell({ title, breadcrumb, actions, children }: any) {
  const { data: user } = useSWR<any>("/api/auth/me", fetcher);
  const router = useRouter();
  function logout() { clearToken(); router.push("/login"); }
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <Image src="/brand/logo.png" alt="Pmais" width={160} height={90} priority />
        </div>
        <Item href="/dashboard" icon="■">Dashboard</Item>
        <Item href="/events" match="/events" icon="◉">Eventos</Item>
        <div className="nav-section">Administração</div>
        <Item href="/admin/templates" icon="✉">Templates</Item>
        <Item href="/admin/logs" icon="≡">Logs e-mail</Item>
        <Item href="/admin/users" icon="●">Usuários</Item>
        <div className="user-box">
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>{user?.name || "…"}</div>
          <div>{user?.role}</div>
          <button className="ghost" onClick={logout} style={{ padding: "4px 0", marginTop: 6 }}>Sair →</button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
            <div className="title">{title}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>{actions}</div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
