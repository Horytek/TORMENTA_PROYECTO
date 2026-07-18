import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/FormField";

import { getLoteDetalle } from "../api/lotes";
import { getAlmacenes } from "../api/kardex";
import type { Lote } from "../types";

interface LoteDetailDialogProps {
  lote: Lote | null;
  isApproval: boolean;
  onClose: () => void;
  onConfirm: (lote: Lote, almacenD?: string) => void;
  isPending?: boolean;
}

export function LoteDetailDialog({ lote, isApproval, onClose, onConfirm, isPending }: LoteDetailDialogProps) {
  const [almacenD, setAlmacenD] = useState("");

  const { data: detalles = [], isLoading } = useQuery({
    queryKey: ["lote-detalle", lote?.id_lote],
    queryFn: () => getLoteDetalle(lote!.id_lote),
    enabled: !!lote,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ["lote-almacenes-destino"],
    queryFn: getAlmacenes,
    enabled: isApproval && !!lote,
  });

  useEffect(() => {
    if (isApproval && almacenes.length > 0 && !almacenD) {
      setAlmacenD(String(almacenes[0].id));
    }
  }, [isApproval, almacenes, almacenD]);

  useEffect(() => {
    if (!lote) setAlmacenD("");
  }, [lote]);

  if (!lote) return null;

  return (
    <Dialog open={!!lote} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Detalle Lote #{lote.id_lote}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted/30 p-3 text-sm sm:grid-cols-2">
              <div><span className="font-semibold text-foreground">Descripción:</span> <span className="text-muted-foreground">{lote.descripcion}</span></div>
              <div><span className="font-semibold text-foreground">Creado por:</span> <span className="text-muted-foreground">{lote.creador || "—"}</span></div>
            </div>

            <div className="rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Producto</span>
                <span className="text-right">Cant.</span>
              </div>
              {detalles.map((d, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border/60 px-3 py-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{d.producto}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.marca}</p>
                  </div>
                  <Badge variant="secondary" className="justify-self-end font-normal">{d.cantidad}</Badge>
                </div>
              ))}
              {detalles.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin items registrados.</p>
              )}
            </div>

            {isApproval && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
                <h4 className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-400">Destino de Mercadería</h4>
                <FormField label="Almacén de destino">
                  <Select value={almacenD || undefined} onValueChange={setAlmacenD}>
                    <SelectTrigger className="max-w-xs"><SelectValue placeholder="Selecciona dónde ingresará el stock" /></SelectTrigger>
                    <SelectContent>
                      {almacenes.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.nom_almacen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button
            type="button"
            disabled={isLoading || isPending || (isApproval && !almacenD)}
            onClick={() => onConfirm(lote, isApproval ? almacenD : undefined)}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isApproval ? "Aprobar e ingresar stock" : "Confirmar verificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
