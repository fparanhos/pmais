"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const STATUS_PRODUTOR = [
  "APROVADO",
  "AGUARDANDO_APROVACAO",
  "NEGOCIACAO",
  "EM_COTACAO",
] as const;

const STATUS_FINANCEIRO = [
  "SOLICITADO",
  "RECEBIDO",
  "ENVIADO_LANCADO",
  "PAGO",
  "AGUARDANDO_APROVACAO",
] as const;

type StatusProdutor = (typeof STATUS_PRODUTOR)[number];
type StatusFinanceiro = (typeof STATUS_FINANCEIRO)[number];

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

function date(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeTotal(
  qtd: number | null,
  dias: number | null,
  unit: number | null,
): number | null {
  if (unit == null || unit === 0) return null;
  return Number(((qtd ?? 1) * (dias ?? 1) * unit).toFixed(2));
}

function parseStatus<T extends string>(
  fd: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const v = str(fd, key);
  if (v && (allowed as readonly string[]).includes(v)) return v as T;
  return fallback;
}

export async function saveExpenseItem(formData: FormData): Promise<ActionResult> {
  try {
    await requireSession();

    const id = str(formData, "id");
    const categoryId = str(formData, "categoryId");
    const servico = str(formData, "servico");

    if (!categoryId) return { ok: false, error: "Categoria obrigatória." };
    if (!servico) return { ok: false, error: "Informe o nome do serviço." };

    const planejadoQtdItens = int(formData, "planejadoQtdItens");
    const planejadoQtdDias = int(formData, "planejadoQtdDias");
    const planejadoValorUnit = num(formData, "planejadoValorUnit");
    const orcadoQtdItens = int(formData, "orcadoQtdItens");
    const orcadoQtdDias = int(formData, "orcadoQtdDias");
    const orcadoValorUnit = num(formData, "orcadoValorUnit");
    const contratadoQtdItens = int(formData, "contratadoQtdItens");
    const contratadoQtdDias = int(formData, "contratadoQtdDias");
    const contratadoValorUnit = num(formData, "contratadoValorUnit");

    const supplierIdRaw = str(formData, "supplierId");
    const supplierId =
      supplierIdRaw && supplierIdRaw !== "__none__" ? supplierIdRaw : null;

    const data = {
      categoryId,
      servico,
      descritivo: str(formData, "descritivo"),
      planejadoQtdItens,
      planejadoQtdDias,
      planejadoValorUnit,
      planejadoValorTotal: computeTotal(
        planejadoQtdItens,
        planejadoQtdDias,
        planejadoValorUnit,
      ),
      orcadoQtdItens,
      orcadoQtdDias,
      orcadoValorUnit,
      orcadoValorTotal: computeTotal(
        orcadoQtdItens,
        orcadoQtdDias,
        orcadoValorUnit,
      ),
      contratadoQtdItens,
      contratadoQtdDias,
      contratadoValorUnit,
      contratadoValorTotal: computeTotal(
        contratadoQtdItens,
        contratadoQtdDias,
        contratadoValorUnit,
      ),
      statusProdutor: parseStatus(
        formData,
        "statusProdutor",
        STATUS_PRODUTOR,
        "EM_COTACAO" as StatusProdutor,
      ),
      statusFinanceiro: parseStatus(
        formData,
        "statusFinanceiro",
        STATUS_FINANCEIRO,
        "AGUARDANDO_APROVACAO" as StatusFinanceiro,
      ),
      supplierId,
      valorPago: num(formData, "valorPago"),
      dataPagamento: date(formData, "dataPagamento"),
      obsParcelas: str(formData, "obsParcelas"),
      bvAcordado: num(formData, "bvAcordado"),
      bvRecebido: formData.get("bvRecebido") === "on",
    };

    if (id) {
      await prisma.expenseItem.update({ where: { id }, data });
    } else {
      await prisma.expenseItem.create({ data });
    }

    revalidatePath("/despesas");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function deleteExpenseItem(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await prisma.expenseItem.delete({ where: { id } });
    revalidatePath("/despesas");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir" };
  }
}

export async function createSupplierInline(formData: FormData): Promise<
  ActionResult<{ id: string; empresa: string }>
> {
  try {
    await requireSession();
    const eventId = str(formData, "eventId");
    const empresa = str(formData, "empresa");
    if (!eventId) return { ok: false, error: "Evento obrigatório." };
    if (!empresa) return { ok: false, error: "Informe o nome da empresa." };
    const s = await prisma.supplier.create({
      data: {
        eventId,
        empresa,
        contato: str(formData, "contato"),
        telefone: str(formData, "telefone"),
        email: str(formData, "email"),
      },
    });
    revalidatePath("/despesas");
    return { ok: true, data: { id: s.id, empresa: s.empresa } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao criar fornecedor" };
  }
}
