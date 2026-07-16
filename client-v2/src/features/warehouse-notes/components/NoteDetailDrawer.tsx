import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRight,
  Ban,
  Calendar,
  User,
  Building2,
  Tag,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NoteDetailPanel } from "./NoteDetailPanel";
import type { WarehouseNote, NoteKind } from "../types";

interface NoteDetailDrawerProps {
  note: WarehouseNote | null;
  isOpen: boolean;
  onClose: () => void;
  tipo: NoteKind;
  canDeactivate: boolean;
  canGeneratePdf: boolean;
  onAnular: () => void;
}

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

export function NoteDetailDrawer({
  note,
  isOpen,
  onClose,
  tipo,
  canDeactivate,
  canGeneratePdf,
  onAnular,
}: NoteDetailDrawerProps) {
  // Use a local state to cache the note so that when it becomes null on close,
  // the content is still rendered during the sheet's exit animation.
  const [lastNote, setLastNote] = useState<WarehouseNote | null>(null);

  useEffect(() => {
    if (note) {
      setLastNote(note);
    }
  }, [note]);

  const displayNote = note || lastNote;

  if (!displayNote) return null;

  const isAnulado = Number(displayNote.estado) === 1;
  const isIngreso = tipo === "ingreso";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 sm:max-w-md md:max-w-lg"
      >
        <SheetHeader className="border-b border-border/40 p-5 pr-12">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                isIngreso
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              )}
            >
              {isIngreso ? (
                <ArrowDownCircle className="h-5 w-5" />
              ) : (
                <ArrowUpCircle className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <SheetTitle className="font-mono text-base font-bold tracking-tight text-foreground truncate">
                {displayNote.documento}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {isIngreso ? "Nota de Ingreso" : "Nota de Salida"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Badges block */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={isAnulado ? "destructive" : "success"}
              className="font-normal"
            >
              {isAnulado ? "Anulado" : "Activo"}
            </Badge>
            <Badge
              variant="secondary"
              className="font-normal flex items-center gap-1 max-w-full"
            >
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{displayNote.concepto || "—"}</span>
            </Badge>
          </div>

          {/* General Information Grid */}
          <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                Fecha:
              </span>
              <span className="font-medium text-foreground">
                {formatFecha(displayNote.fecha)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                Registrado por:
              </span>
              <span className="font-medium text-foreground">
                {displayNote.usuario || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                {isIngreso ? "Proveedor:" : "Destinatario:"}
              </span>
              <span
                className="font-medium text-foreground text-right truncate max-w-[200px]"
                title={displayNote.proveedor}
              >
                {displayNote.proveedor || "—"}
              </span>
            </div>
          </div>

          {/* Warehouse Flow */}
          <div className="rounded-xl border border-border/40 p-4 space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Ruta de Inventario
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 min-w-0 rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Origen</p>
                <p
                  className="font-medium text-foreground truncate"
                  title={displayNote.almacen_O ?? "Externo"}
                >
                  {displayNote.almacen_O ?? "Externo"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <div className="flex-1 min-w-0 rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Destino</p>
                <p
                  className="font-medium text-foreground truncate"
                  title={displayNote.almacen_D ?? "Externo"}
                >
                  {displayNote.almacen_D ?? "Externo"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Items List (PDF, Obs & Items details) */}
          <NoteDetailPanel
            note={displayNote}
            tipo={tipo}
            canGeneratePdf={canGeneratePdf}
          />
        </div>

        {/* Action Footer */}
        {canDeactivate && !isAnulado && (
          <div className="border-t border-border/40 p-5 bg-card">
            <Button
              variant="destructive"
              className="w-full gap-1.5 cursor-pointer"
              onClick={onAnular}
            >
              <Ban className="h-4 w-4" /> Anular Nota de Almacén
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
