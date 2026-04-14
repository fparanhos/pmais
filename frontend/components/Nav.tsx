"use client";
import Link from "next/link";
import { clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Nav() {
  const router = useRouter();
  function logout() { clearToken(); router.push("/login"); }
  return (
    <div className="nav">
      <div>
        <Link href="/events"><b>Pmais Eventos</b></Link>
        <span style={{ marginLeft: 20 }}>
          <Link href="/events">Eventos</Link>
          <Link href="/admin/templates">Templates</Link>
          <Link href="/admin/logs">Logs</Link>
          <Link href="/admin/users">Usuários</Link>
        </span>
      </div>
      <button className="secondary" onClick={logout}>Sair</button>
    </div>
  );
}
