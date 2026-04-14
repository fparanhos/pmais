"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pmaiseventos.com");
  const [password, setPassword] = useState("changeme");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const form = new FormData();
    form.set("username", email);
    form.set("password", password);
    const res = await fetch("/api/auth/login", { method: "POST", body: form });
    if (!res.ok) { setError("e-mail ou senha inválidos"); return; }
    const data = await res.json();
    setToken(data.access_token);
    router.push("/events");
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="card">
        <h2>Pmais Eventos</h2>
        <form onSubmit={submit}>
          <p><label>E-mail<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label></p>
          <p><label>Senha<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label></p>
          {error && <p style={{ color: "#c53030" }}>{error}</p>}
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
