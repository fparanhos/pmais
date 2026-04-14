"use client";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import Shell from "@/components/Shell";
import { useState } from "react";

const ROLES = ["admin", "produtor", "financeiro", "cliente"];

export default function Users() {
  const { data, mutate } = useSWR<any[]>("/api/users", fetcher);
  const [form, setForm] = useState<any>({ email: "", name: "", password: "", role: "produtor" });
  const [open, setOpen] = useState(false);

  async function create() {
    await api("/api/auth/users", { method: "POST", body: JSON.stringify(form) });
    setForm({ email: "", name: "", password: "", role: "produtor" });
    setOpen(false); mutate();
  }
  async function toggle(u: any) {
    await api(`/api/users/${u.id}/${u.is_active === false ? "activate" : "deactivate"}`, { method: "PUT" });
    mutate();
  }
  async function reset(u: any) {
    const p = prompt(`Nova senha para ${u.email}:`);
    if (!p) return;
    await api(`/api/users/${u.id}/reset-password?new_password=${encodeURIComponent(p)}`, { method: "PUT" });
    alert("senha redefinida");
  }

  return (
    <Shell title="Usuários" breadcrumb="Administração" actions={<button onClick={() => setOpen(true)}>+ Novo usuário</button>}>
      {open && (
        <div className="card">
          <h3>Novo usuário</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="E-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Senha" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={create}>Criar</button>
            <button className="secondary" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
      <div className="card">
        <table className="simple">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th style={{ width: 220 }}></th></tr></thead>
          <tbody>
            {data?.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="pill aprovado" style={{ background: "var(--purple-light)", color: "var(--purple)" }}>{u.role}</span></td>
                <td>{u.is_active === false ? <span className="pill" style={{ background: "#FEE2E2", color: "#991B1B" }}>inativo</span> : <span className="pill aprovado">ativo</span>}</td>
                <td>
                  <button className="secondary" onClick={() => toggle(u)}>{u.is_active === false ? "Ativar" : "Desativar"}</button>{" "}
                  <button className="secondary" onClick={() => reset(u)}>Reset senha</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
