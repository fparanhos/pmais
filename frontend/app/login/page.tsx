"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { setToken } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pmaiseventos.com");
  const [password, setPassword] = useState("changeme");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const form = new FormData();
    form.set("username", email); form.set("password", password);
    const res = await fetch("/api/auth/login", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) { setError("e-mail ou senha inválidos"); return; }
    const data = await res.json();
    setToken(data.access_token);
    router.push("/dashboard");
  }

  return (
    <div className="login-page">
      <div className="hero">
        <Image src="/brand/logo.png" alt="Pmais" width={220} height={124} style={{ filter: "brightness(0) invert(1)", marginBottom: 40 }} />
        <h1>Controle de Eventos</h1>
        <p>Substitui a planilha e o Trello. Gestão financeira, kanban de contratações, disparos automáticos de e-mail e relatório para cliente em um só lugar.</p>
      </div>
      <div className="form-area">
        <div className="box">
          <h2 style={{ marginTop: 0 }}>Entrar</h2>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>Use suas credenciais Pmais.</p>
          <form onSubmit={submit} style={{ marginTop: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>E-MAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginTop: 16, marginBottom: 4 }}>SENHA</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
            {error && <p style={{ color: "var(--err)", fontSize: 13, marginTop: 12 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ marginTop: 20, width: "100%", padding: "11px" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
