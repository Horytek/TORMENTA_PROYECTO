import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRight,
  ChevronRight,
  Package,
  Ban,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WarehouseNote, NoteKind } from "../types";

interface NoteRowProps {
  note: WarehouseNote;
  tipo: NoteKind;
  isSelected: boolean;
  onSelect: () => void;
  canDeactivate: boolean;
  onAnular: () => void;
}

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

export function NoteRow({ note, tipo, isSelected, onSelect, canDeactivate, onAnular }: NoteRowProps) {
  const isAnulado = Number(note.estado) === 1;
  const isIngreso = tipo === "ingreso";
  const itemCount = note.detalles?.length ?? 0;

  return (
    <div className={cn("border-b border-border/40 last:border-0", isSelected && "bg-muted/20")}>
      <button
        type="button"
        onClick={onSelect}
        className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 cursor-pointer md:grid-cols-12"
      >
        {/* Tipo + documento + fecha */}
        <div className="col-span-2 flex items-center gap-2.5 md:col-span-3">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isIngreso ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            )}
          >
            {isIngreso ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-foreground">{note.documento}</p>
            <p className="text-xs text-muted-foreground">{formatFecha(note.fecha)}</p>
          </div>
        </div>

        {/* Contraparte + usuario */}
        <div className="col-span-2 min-w-0 md:col-span-3">
          <p className="truncate text-sm font-medium text-foreground">{note.proveedor || "—"}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" /> {note.usuario || "—"}
          </p>
        </div>

        {/* Concepto */}
        <div className="hidden min-w-0 md:col-span-2 md:block">
          <Badge variant="secondary" className="max-w-full truncate font-normal">{note.concepto || "—"}</Badge>
        </div>

        {/* Almacenes */}
        <div className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground md:col-span-2 md:flex">
          <span className="truncate">{note.almacen_O || "Externo"}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate">{note.almacen_D || "Externo"}</span>
        </div>

        {/* Items + estado */}
        <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-2 md:justify-end">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> {itemCount}
          </span>
          <Badge variant={isAnulado ? "destructive" : "success"} className="font-normal">
            {isAnulado ? "Anulado" : "Activo"}
          </Badge>
          {canDeactivate && !isAnulado && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onAnular(); }}
              aria-label="Anular nota"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </div>
      </button>
    </div>
  );
}

