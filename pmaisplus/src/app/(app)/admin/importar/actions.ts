"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { importTrelloBoard, type ImportResult, type TrelloBoard } from "@/lib/trello-import";

export type ImportState =
  | { status: "idle" }
  | { status: "success"; result: ImportResult }
  | { status: "error"; error: string };

export async function importTrelloFromUpload(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  try {
    const session = await auth();
    if (!session?.user) return { status: "error", error: "Não autenticado." };
    if (session.user.role !== "ADMIN") {
      return { status: "error", error: "Apenas administradores podem importar." };
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return { status: "error", error: "Selecione um arquivo JSON do Trello." };
    }
    if (file.size === 0) {
      return { status: "error", error: "Arquivo vazio." };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { status: "error", error: "Arquivo acima de 10MB — inesperado pra export Trello." };
    }

    const raw = await file.text();
    let parsed: TrelloBoard;
    try {
      parsed = JSON.parse(raw) as TrelloBoard;
    } catch {
      return { status: "error", error: "JSON inválido." };
    }

    const eventName = String(formData.get("eventName") ?? "").trim() || undefined;

    const result = await importTrelloBoard(parsed, { eventName });

    revalidatePath("/tarefas");
    revalidatePath("/dashboard");
    revalidatePath("/despesas");
    revalidatePath("/receitas");

    return { status: "success", result };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Erro inesperado na importação.",
    };
  }
}
