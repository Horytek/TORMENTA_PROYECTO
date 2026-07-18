import { useQuery } from "@tanstack/react-query";
import { Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getLotes } from "../api/lotes";
import type { Lote } from "../types";

function formatFecha(fecha: string) {
  try {
    return new Date(fecha).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return fecha;
  }
}

interface LotesTableProps {
  estado: 0 | 1;
  onAction: (lote: Lote) => void;
  isDisabled?: boolean;
}

export function LotesTable({ estado, onAction, isDisabled }: LotesTableProps) {
  const { data: lotes = [], isLoading } = useQuery({
    queryKey: ["lotes", estado],
    queryFn: () => getLotes(estado),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (lotes.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No hay solicitudes pendientes en esta etapa.</p>;
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 border-b border-border bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>ID</span>
        <span>Descripción</span>
        <span>Creado por</span>
        <span>Fecha</span>
        <span className="text-right">Acción</span>
      </div>
      {lotes.map((lote) => (
        <div key={lote.id_lote} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
          <span className="text-sm font-mono text-muted-foreground">#{lote.id_lote}</span>
          <span className="truncate text-sm font-medium text-foreground">{lote.descripcion}</span>
          <span className="text-sm text-muted-foreground">{lote.creador || "N/A"}</span>
          <span className="text-xs text-muted-foreground">{formatFecha(lote.fecha_creacion)}</span>
          <Button
            size="sm"
            variant={estado === 0 ? "outline" : "default"}
            className="gap-1.5 justify-self-end"
            onClick={() => onAction(lote)}
            disabled={isDisabled}
          >
            {estado === 0 ? <Eye className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {estado === 0 ? "Verificar" : "Aprobar"}
          </Button>
        </div>
      ))}
    </div>
  );
}
