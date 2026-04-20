"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  importPlanilhaToEvent,
  parsePlanilha,
  type ImportXlsxResult,
} from "@/lib/xlsx-import";

export type ImportPlanilhaState =
  | { status: "idle" }
  | { status: "success"; result: ImportXlsxResult }
  | { status: "error"; error: string };

export async function importPlanilhaFromUpload(
  _prev: ImportPlanilhaState,
  formData: FormData,
): Promise<ImportPlanilhaState> {
  try {
    const session = await auth();
    if (!session?.user) return { status: "error", error: "Não autenticado." };
    if (session.user.role !== "ADMIN") {
      return { status: "error", error: "Apenas administradores podem importar." };
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return { status: "error", error: "Selecione um arquivo .xlsx ou .xlsm." };
    }
    if (file.size === 0) return { status: "error", error: "Arquivo vazio." };
    if (file.size > 15 * 1024 * 1024) {
      return {
        status: "error",
        error: "Arquivo acima de 15MB — inesperado pra planilha padrão.",
      };
    }

    const buf = await file.arrayBuffer();

    let parsed: ReturnType<typeof parsePlanilha>;
    try {
      parsed = parsePlanilha(buf);
    } catch (e) {
      return {
        status: "error",
        error: e instanceof Error ? e.message : "Não foi possível ler a planilha.",
      };
    }

    const eventName = String(formData.get("eventName") ?? "").trim() || undefined;

    const result = await importPlanilhaToEvent(parsed, { eventName });

    revalidatePath("/", "layout");

    return { status: "success", result };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Erro inesperado na importação.",
    };
  }
}
