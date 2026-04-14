"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import Nav from "@/components/Nav";

export default function Logs() {
  const { data } = useSWR<any[]>("/api/email-logs", fetcher);
  return (
    <>
      <Nav />
      <div className="container">
        <div className="card"><h2>Logs de e-mail</h2></div>
        <div className="card">
          <table>
            <thead><tr><th>Data</th><th>Para</th><th>Assunto</th><th>Status</th><th>Erro</th></tr></thead>
            <tbody>
              {data?.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.sent_at).toLocaleString("pt-BR")}</td>
                  <td>{l.to_email}</td>
                  <td>{l.subject}</td>
                  <td>{l.status}</td>
                  <td style={{ color: "#c53030" }}>{l.error || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
