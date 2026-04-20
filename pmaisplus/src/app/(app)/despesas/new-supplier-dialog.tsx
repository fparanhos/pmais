"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createSupplierInline } from "./actions";
import type { SupplierDTO } from "./types";

export function NewSupplierDialog({
  eventId,
  open,
  onOpenChange,
  onCreated,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (s: SupplierDTO) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [key, setKey] = useState(0); // reset form on open

  async function handleSubmit(fd: FormData) {
    fd.set("eventId", eventId);
    startTransition(async () => {
      const r = await createSupplierInline(fd);
      if (r.ok && r.data) {
        toast.success(`Fornecedor "${r.data.empresa}" criado.`);
        onCreated({
          id: r.data.id,
          empresa: r.data.empresa,
          contato: (fd.get("contato") as string) || null,
          telefone: (fd.get("telefone") as string) || null,
          email: (fd.get("email") as string) || null,
        });
        onOpenChange(false);
        setKey((k) => k + 1);
      } else if (!r.ok) {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo fornecedor</DialogTitle>
          <DialogDescription>
            Cadastro rápido. Pode ser editado depois.
          </DialogDescription>
        </DialogHeader>
        <form key={key} action={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Empresa <span className="text-destructive">*</span>
            </label>
            <input
              name="empresa"
              required
              autoFocus
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              placeholder="Ex: AV Master Eventos"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Contato
              </label>
              <input
                name="contato"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Telefone
              </label>
              <input
                name="telefone"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar fornecedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
