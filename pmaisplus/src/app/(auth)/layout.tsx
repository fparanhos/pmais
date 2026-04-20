export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 h-full">
      {/* Brand panel — teal→purple gradient, hidden on mobile */}
      <aside className="hidden lg:flex relative flex-1 bg-brand-strong text-white overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-[#4C0DB3]/40 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="text-3xl font-semibold tracking-tight">
            Pmais<span className="text-white/60">+</span>
          </div>
          <div className="max-w-md space-y-6">
            <div className="text-4xl font-bold leading-tight">
              Controle financeiro de eventos, sem planilha.
            </div>
            <p className="text-base text-white/75 leading-relaxed">
              Planejado, contratado e pago em um só lugar. Receitas por cota,
              pipeline de aprovação, notificações automáticas quando um
              orçamento é aprovado ou um pagamento é confirmado.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span className="h-px w-8 bg-white/30" />
              Pmais Eventos
            </div>
          </div>
          <div className="text-xs text-white/50">
            pmaiseventos.com.br
          </div>
        </div>
      </aside>
      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        {children}
      </div>
    </div>
  );
}
