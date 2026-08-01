import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAttributeImpact } from "../api/content";
import type { Attribute } from "../types";

// ─────────────────────────────────────────────────────────────────
// AttributeImpactDialog — Antes de desactivar un atributo, muestra a
// cuántos productos/variantes/ventas ya afecta. Nada se borra al
// desactivar (es reversible), pero el usuario merece saber el alcance
// antes de tocarlo.
// ─────────────────────────────────────────────────────────────────

interface AttributeImpactDialogProps {
  attribute: Attribute | null;
  onCancel: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function AttributeImpactDialog({ attribute, onCancel, onConfirm, isPending }: AttributeImpactDialogProps) {
  const { data: impact, isLoading } = useQuery({
    queryKey: ["attribute-impact", attribute?.id_atributo],
    queryFn: () => getAttributeImpact(attribute!.id_atributo),
    enabled: !!attribute,
  });

  return (
    <Dialog open={!!attribute} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Desactivar "{attribute?.nombre}"
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando impacto…
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Este atributo hoy está en uso en:</p>
            <ul className="space-y-1 rounded-lg border border-border bg-muted/30 p-3">
              <li className="flex justify-between"><span>Productos</span><span className="num font-semibold">{impact?.productos ?? 0}</span></li>
              <li className="flex justify-between"><span>Variantes (SKU)</span><span className="num font-semibold">{impact?.variantes ?? 0}</span></li>
              <li className="flex justify-between"><span>Plantillas de categoría</span><span className="num font-semibold">{impact?.categorias ?? 0}</span></li>
              <li className="flex justify-between"><span>Líneas de venta históricas</span><span className="num font-semibold">{impact?.lineasVenta ?? 0}</span></li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Nada de esto se borra: las variantes y ventas ya registradas se mantienen intactas. Solo deja de ofrecerse para productos nuevos, y puedes reactivarlo cuando quieras.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={isPending || isLoading}>
            {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Desactivar de todos modos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
