import { PageHeader, EmptyState } from "@/components/page-header";

export default function ReceitasPage() {
  return (
    <>
      <PageHeader
        title="Receitas"
        subtitle="Inscrições, cotas de patrocínio e outras receitas"
      />
      <EmptyState
        title="Receitas em construção"
        description="Inscrição (cortesias, estudante sócio/não sócio, sócio, não sócio), patrocínio (Platina, Ouro, Prata, Bronze, Bronze SEM STAND, cotas temáticas) e outras receitas."
        hint="Ativo após a Etapa 3 (modelagem) e Etapa 4 (importador)."
      />
    </>
  );
}
