export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative bg-card border-b border-border flex items-center justify-between px-8 py-4 shrink-0">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary to-primary-deep text-primary-foreground px-4 py-1.5 text-sm font-semibold tracking-tight shadow-sm shadow-primary/25">
          {title}
        </span>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-tight">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/40 via-accent-solid/30 to-transparent" />
    </header>
  );
}

export function EmptyState({
  title,
  description,
  hint,
}: {
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center mb-4 ring-4 ring-primary/10">
          <span className="h-3 w-3 rounded-full bg-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {hint && (
          <p className="mt-4 text-xs text-muted-foreground/80 italic">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
