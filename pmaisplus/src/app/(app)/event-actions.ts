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

export async function deleteEvent(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await auth();
  if (!s?.user) return { ok: false, error: "Não autenticado." };
  if (s.user.role !== "ADMIN") {
    return { ok: false, error: "Apenas administradores podem excluir eventos." };
  }

  const ev = await prisma.event.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!ev) return { ok: false, error: "Evento não encontrado." };

  // Cascade apaga categorias/itens/fornecedores/receitas/tarefas/checklists.
  await prisma.event.delete({ where: { id } });

  // Se o cookie apontava pro evento deletado, limpa.
  const store = await cookies();
  if (store.get(ACTIVE_EVENT_COOKIE)?.value === id) {
    store.delete(ACTIVE_EVENT_COOKIE);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
