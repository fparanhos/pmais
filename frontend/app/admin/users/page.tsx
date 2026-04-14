"use client";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import Nav from "@/components/Nav";
import { useState } from "react";

const ROLES = ["admin", "produtor", "financeiro", "cliente"];

export default function Users() {
  const { data, mutate } = useSWR<any[]>("/api/users", fetcher);
  const [form, setForm] = useState<any>({ email: "", name: "", password: "", role: "produtor" });

  async function create() {
    await api("/api/auth/users", { method: "POST", body: JSON.stringify(form) });
    setForm({ email: "", name: "", password: "", role: "produtor" });
    mutate();
  }

  async function toggle(u: any) {
    const path = u.is_active === false ? "activate" : "deactivate";
    await api(`/api/users/${u.id}/${path}`, { method: "PUT" });
    mutate();
  }

  async function reset(u: any) {
    const p = prompt(`Nova senha para ${u.email}:`);
    if (!p) return;
    await api(`/api/users/${u.id}/reset-password?new_password=${encodeURIComponent(p)}`, { method: "PUT" });
    alert("senha redefinida");
  }

  return (
    <>
      <Nav />
      <div className="container">
        <div className="card">
          <h2>Usuários</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8 }}>
            <input placeholder="nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="e-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="senha" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <button onClick={create}>Criar</button>
          </div>
        </div>
        <div className="card">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Ativo</th><th></th></tr></thead>
            <tbody>
              {data?.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active === false ? "não" : "sim"}</td>
                  <td>
                    <button className="secondary" onClick={() => toggle(u)}>{u.is_active === false ? "Ativar" : "Desativar"}</button>{" "}
                    <button className="secondary" onClick={() => reset(u)}>Reset senha</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
