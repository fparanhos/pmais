"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = { ok: true } | { ok: false; error: string };

const REVENUE_TYPES = ["INSCRICAO", "PATROCINIO", "OUTRAS"] as const;
type RevenueType = (typeof REVENUE_TYPES)[number];

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

function int(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v == null) return null;
  const n = parseInt(v.replace(",", "."), 10);
  return Number.isFinite(n) ? n : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v == null) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseType(fd: FormData): RevenueType {
  const v = str(fd, "type");
  if (v && (REVENUE_TYPES as readonly string[]).includes(v)) {
    return v as RevenueType;
  }
  return "OUTRAS";
}

export async function saveRevenueItem(formData: FormData): Promise<ActionResult> {
  try {
    await requireSession();
    const id = str(formData, "id");
    const eventId = str(formData, "eventId");
    const descritivo = str(formData, "descritivo");
    if (!eventId) return { ok: false, error: "Evento obrigatório." };
    if (!descritivo) return { ok: false, error: "Informe o descritivo." };

    const data = {
      type: parseType(formData),
      descritivo,
      planejadoQtd: int(formData, "planejadoQtd"),
      planejadoValorTotal: num(formData, "planejadoValorTotal"),
      realizadoQtd: int(formData, "realizadoQtd"),
      realizadoValorTotal: num(formData, "realizadoValorTotal"),
    };

    if (id) {
      await prisma.revenueItem.update({ where: { id }, data });
    } else {
      await prisma.revenueItem.create({ data: { ...data, eventId } });
    }

    revalidatePath("/receitas");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function deleteRevenueItem(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await prisma.revenueItem.delete({ where: { id } });
    revalidatePath("/receitas");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir" };
  }
}
