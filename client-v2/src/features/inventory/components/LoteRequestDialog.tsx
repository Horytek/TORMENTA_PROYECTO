import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/FormField";
import { useUserStore } from "@/store/useUserStore";

import { LoteProductPicker } from "./LoteProductPicker";
import { createLote } from "../api/lotes";
import type { LoteItemInput } from "../types";

type CartItem = LoteItemInput & { uniqueKey: string; descripcion: string; marca: string };

interface LoteRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoteRequestDialog({ isOpen, onClose }: LoteRequestDialogProps) {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const [descripcion, setDescripcion] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDescripcion("");
    setItems([]);
    setError(null);
  };

  const addItem = (item: LoteItemInput & { descripcion: string; marca: string }) => {
    const uniqueKey = `PROD-${item.id_producto}`;
    setItems((prev) => {
      const existing = prev.find((p) => p.uniqueKey === uniqueKey);
      if (existing) {
        return prev.map((p) => (p.uniqueKey === uniqueKey ? { ...p, cantidad: p.cantidad + item.cantidad } : p));
      }
      return [...prev, { ...item, uniqueKey }];
    });
  };
  const removeItem = (uniqueKey: string) => setItems((prev) => prev.filter((p) => p.uniqueKey !== uniqueKey));

  const mutation = useMutation({
    mutationFn: () =>
      createLote({
        descripcion,
        id_usuario: Number(user?.id),
        productos: items.map(({ id_producto, cantidad }) => ({
          id_producto,
          cantidad,
        })),
      }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.message || "No se pudo crear la solicitud.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["lotes"] });
      reset();
      onClose();
    },
    onError: () => setError("No se pudo crear la solicitud. Intenta de nuevo."),
  });

  const isValid = !!descripcion.trim() && items.length > 0 && !!user?.id;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && (reset(), onClose())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva solicitud de inventario</DialogTitle>
          <DialogDescription>Registra un lote para ingreso de mercadería, sujeto a verificación y aprobación.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <FormField label="Descripción / Referencia" htmlFor="descripcion">
            <Textarea
              id="descripcion"
              rows={2}
              placeholder="Ej: Lote llegada Viernes 13…"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <PackageSearch className="h-4 w-4" /> Productos
            </div>
            <LoteProductPicker onAdd={addItem} />

            {items.length > 0 && (
              <div className="rounded-xl border border-border">
                {items.map((item) => (
                  <div key={item.uniqueKey} className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.marca}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-normal">{item.cantidad}</Badge>
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.uniqueKey)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="button" disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
