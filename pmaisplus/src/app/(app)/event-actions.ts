"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_EVENT_COOKIE } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function setActiveEvent(id: string): Promise<{ ok: boolean }> {
  const s = await auth();
  if (!s?.user) return { ok: false };

  // Valida que o evento existe antes de gravar o cookie
  const exists = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) return { ok: false };

  const store = await cookies();
  store.set(ACTIVE_EVENT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
  });

  // Revalida tudo que depende do evento ativo
  revalidatePath("/", "layout");
  return { ok: true };
}
