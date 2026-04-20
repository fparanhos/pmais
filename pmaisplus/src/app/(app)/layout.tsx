import Image from "next/image";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import { EventPicker } from "@/components/event-picker";
import { getActiveEvent, listEvents } from "@/lib/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, events, active] = await Promise.all([
    auth(),
    listEvents(),
    getActiveEvent(),
  ]);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <aside className="w-60 shrink-0 bg-sidebar-brand text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <Image
            src="/brand/logo.png"
            alt="Pmais"
            width={104}
            height={58}
            priority
            className="brightness-0 invert opacity-95"
          />
          <span className="ml-2 text-[10px] font-bold tracking-widest uppercase text-primary">
            +
          </span>
        </div>
        <EventPicker events={events} activeId={active?.id ?? null} />
        <Sidebar isAdmin={session?.user?.role === "ADMIN"} />
        {session?.user && (
          <UserMenu
            name={session.user.name}
            email={session.user.email}
            role={session.user.role}
          />
        )}
      </aside>
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
