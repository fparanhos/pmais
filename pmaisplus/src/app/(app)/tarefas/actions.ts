"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("unauthorized");
  return s;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v == null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function date(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function saveTask(formData: FormData): Promise<ActionResult> {
  try {
    await requireSession();

    const id = str(formData, "id");
    const eventId = str(formData, "eventId");
    const title = str(formData, "title");
    const listName = str(formData, "listName");
    if (!eventId) return { ok: false, error: "Evento obrigatório." };
    if (!title) return { ok: false, error: "Informe o título da tarefa." };
    if (!listName) return { ok: false, error: "Escolha a coluna." };

    // listOrder: mantém o da coluna existente (buscando da tarefa mais próxima)
    const sample = await prisma.task.findFirst({
      where: { eventId, listName },
      select: { listOrder: true },
      orderBy: { listOrder: "asc" },
    });
    const listOrder = sample?.listOrder ?? 0;

    const expenseItemIdRaw = str(formData, "expenseItemId");
    const expenseItemId =
      expenseItemIdRaw && expenseItemIdRaw !== "__none__" ? expenseItemIdRaw : null;

    const data = {
      eventId,
      title,
      description: str(formData, "description"),
      listName,
      listOrder,
      dueDate: date(formData, "dueDate"),
      expenseItemId,
    };

    if (id) {
      // Preserve position if not moving columns; recompute if switched
      const existing = await prisma.task.findUnique({
        where: { id },
        select: { listName: true, position: true },
      });
      let position = existing?.position ?? 0;
      if (existing && existing.listName !== listName) {
        const maxInNewCol = await prisma.task.aggregate({
          where: { eventId, listName },
          _max: { position: true },
        });
        position = (maxInNewCol._max.position ?? 0) + 1024;
      }
      await prisma.task.update({
        where: { id },
        data: { ...data, position },
      });
    } else {
      const maxInCol = await prisma.task.aggregate({
        where: { eventId, listName },
        _max: { position: true },
      });
      await prisma.task.create({
        data: { ...data, position: (maxInCol._max.position ?? 0) + 1024 },
      });
    }

    revalidatePath("/tarefas");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao salvar tarefa",
    };
  }
}

export async function moveTask(
  id: string,
  targetListName: string,
): Promise<ActionResult> {
  try {
    await requireSession();

    const current = await prisma.task.findUnique({
      where: { id },
      select: { eventId: true, listName: true },
    });
    if (!current) return { ok: false, error: "Tarefa não encontrada." };

    if (current.listName === targetListName) return { ok: true };

    // Descobre o listOrder da coluna destino
    const sample = await prisma.task.findFirst({
      where: { eventId: current.eventId, listName: targetListName },
      select: { listOrder: true },
    });
    const listOrder = sample?.listOrder ?? 0;

    const maxInCol = await prisma.task.aggregate({
      where: { eventId: current.eventId, listName: targetListName },
      _max: { position: true },
    });
    const position = (maxInCol._max.position ?? 0) + 1024;

    await prisma.task.update({
      where: { id },
      data: { listName: targetListName, listOrder, position },
    });
    revalidatePath("/tarefas");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao mover tarefa",
    };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await prisma.task.delete({ where: { id } });
    revalidatePath("/tarefas");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao excluir tarefa",
    };
  }
}

export async function toggleChecklistItem(
  id: string,
  done: boolean,
): Promise<ActionResult> {
  try {
    await requireSession();
    await prisma.checklistItem.update({
      where: { id },
      data: { done },
    });
    revalidatePath("/tarefas");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao atualizar item",
    };
  }
}
