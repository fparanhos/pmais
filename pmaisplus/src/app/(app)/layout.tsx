import Image from "next/image";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-full">
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Image
            src="/brand/logo.png"
            alt="Pmais"
            width={104}
            height={58}
            priority
          />
          <span className="ml-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            +
          </span>
        </div>
        <Sidebar />
        <div className="mt-auto px-4 py-4 border-t border-border text-xs text-muted-foreground">
          <div className="font-medium text-foreground">Pmais Eventos</div>
          <div>v0.1 · em construção</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
