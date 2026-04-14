"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import Shell from "@/components/Shell";

export default function Logs() {
  const { data } = useSWR<any[]>("/api/email-logs", fetcher);
  return (
    <Shell title="Logs de e-mail" breadcrumb="Administração">
      <div className="card">
        <table className="simple">
          <thead>
            <tr>
              <th>Data</th>
              <th>Para</th>
              <th>Assunto</th>
              <th>Status</th>
              <th>Erro</th>
            </tr>
          </thead>
          <tbody>
            {data?.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Nenhum e-mail enviado ainda.</td></tr>}
            {data?.map(l => (
              <tr key={l.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(l.sent_at).toLocaleString("pt-BR")}</td>
                <td>{l.to_email}</td>
                <td>{l.subject}</td>
                <td>
                  <span className={"pill " + (l.status === "sent" ? "aprovado" : "negociacao")}>{l.status}</span>
                </td>
                <td style={{ color: "var(--err)", fontSize: 12 }}>{l.error || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
