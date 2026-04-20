export function Bar({
  value,
  className = "h-1.5",
  fill = "var(--primary)",
}: {
  value: number;
  className?: string;
  fill?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`w-full rounded-full bg-muted overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${clamped}%`, background: fill }}
      />
    </div>
  );
}
