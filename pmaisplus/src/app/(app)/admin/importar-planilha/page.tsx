import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ImportPlanilhaForm } from "./import-form";

export default async function ImportarPlanilhaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <PageHeader
        title="Importar planilha"
        subtitle="Crie ou atualize um evento a partir da planilha padrão Pmais (.xlsx / .xlsm)"
      />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <ImportPlanilhaForm />
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">O que é lido:</strong> aba{" "}
              <code className="px-1 rounded bg-card">Controle de Evento</code> (categorias, itens, receitas) e{" "}
              <code className="px-1 rounded bg-card">Configurações</code> (nome do evento,
              produtor). Macros VBA são ignoradas.
            </p>
            <p>
              <strong className="text-foreground">Idempotente por nome:</strong> se já
              existe um evento com o mesmo nome, ele é atualizado — categorias, itens,
              fornecedores e receitas são recriadas. Tarefas do kanban (Trello) são
              preservadas.
            </p>
            <p>
              <strong className="text-foreground">Status reconhecidos:</strong>{" "}
              Aprovado/Aguardando Aprovação/Negociação/Em Cotação (produtor);
              Solicitado/Recebido/Enviado-Lançado/Pago/Aguardando Aprovação (financeiro).
              Valores em qualquer formato numérico (BRL com vírgula, ponto, ou número puro).
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
