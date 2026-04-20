"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, FileJson, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importTrelloFromUpload, type ImportState } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      <Upload className="h-4 w-4" />
      {pending ? "Importando…" : "Importar"}
    </Button>
  );
}

export function ImportForm() {
  const [state, formAction] = useActionState<ImportState, FormData>(
    importTrelloFromUpload,
    { status: "idle" },
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChosen(f: File | null) {
    setFile(f);
    setPreviewName(null);
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (typeof parsed?.name === "string") setPreviewName(parsed.name);
    } catch {
      // ignore — server action valida
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
          Arquivo JSON do Trello
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0] ?? null;
            if (f) {
              onFileChosen(f);
              if (inputRef.current) {
                const dt = new DataTransfer();
                dt.items.add(f);
                inputRef.current.files = dt.files;
              }
            }
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors " +
            (dragOver
              ? "border-primary bg-primary-soft"
              : "border-border hover:border-primary/60 hover:bg-muted/40")
          }
        >
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="application/json,.json"
            required
            className="sr-only"
            onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <FileJson className="h-10 w-10 text-primary mb-2" />
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {(file.size / 1024).toFixed(0)} KB
                {previewName && (
                  <>
                    {" · "}
                    <span className="text-foreground">Board: {previewName}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreviewName(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="mt-3 text-[11px] text-muted-foreground underline hover:text-destructive"
              >
                Trocar arquivo
              </button>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <div className="text-sm font-medium">
                Arraste o JSON ou clique para selecionar
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                .json exportado do Trello · até 10 MB
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
          Nome do evento (opcional)
        </label>
        <input
          name="eventName"
          defaultValue=""
          placeholder={previewName ?? "Se vazio, usa o nome do board"}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <SubmitButton disabled={!file} />
        {state.status === "success" && (
          <div className="flex items-start gap-2 text-xs text-[#166534] bg-success-soft border border-success/20 rounded-md px-3 py-2 flex-1">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                {state.result.created ? "Evento criado" : "Evento atualizado"}:{" "}
                {state.result.eventName}
              </div>
              <div>
                {state.result.counts.columns} colunas ·{" "}
                {state.result.counts.tasks} tasks ·{" "}
                {state.result.counts.checklists} checklists ·{" "}
                {state.result.counts.items} itens
              </div>
            </div>
          </div>
        )}
        {state.status === "error" && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive-soft border border-destructive/20 rounded-md px-3 py-2 flex-1">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>{state.error}</div>
          </div>
        )}
      </div>
    </form>
  );
}
