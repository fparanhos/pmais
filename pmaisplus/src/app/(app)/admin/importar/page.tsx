import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ImportForm } from "./import-form";

export default async function ImportarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <PageHeader
        title="Importar Trello"
        subtitle="Crie ou atualize um evento a partir de um export JSON do board"
      />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <ImportForm />
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Como exportar do Trello:</strong>{" "}
              abra o board → menu "…" → Imprimir, exportar e compartilhar →
              Exportar como JSON.
            </p>
            <p>
              <strong className="text-foreground">Idempotente:</strong> re-importar o
              mesmo board atualiza o mesmo evento (usa <code>trelloBoardId</code> como
              chave). Cards existentes são atualizados, novos são adicionados.
            </p>
            <p>
              <strong className="text-foreground">Privacidade:</strong> o arquivo é
              processado no servidor e descartado depois do upsert — não fica em
              disco.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
