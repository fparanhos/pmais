import Image from "next/image";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-1 min-h-full">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
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
        {session?.user && (
          <UserMenu
            name={session.user.name}
            email={session.user.email}
            role={session.user.role}
          />
        )}
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
