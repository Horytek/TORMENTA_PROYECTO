import { useEffect, useState } from "react";
import { Truck, Calendar, User, MapPin, Ban, Tag, ArrowRight } from "lucide-react";
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
import { GuideDetailPanel } from "./GuideDetailPanel";
import type { Guide } from "../types";

interface GuideDetailDrawerProps {
  guide: Guide | null;
  isOpen: boolean;
  onClose: () => void;
  canDeactivate: boolean;
  canGeneratePdf: boolean;
  onAnular: () => void;
}

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

export function GuideDetailDrawer({ guide, isOpen, onClose, canDeactivate, canGeneratePdf, onAnular }: GuideDetailDrawerProps) {
  const [lastGuide, setLastGuide] = useState<Guide | null>(null);

  useEffect(() => {
    if (guide) setLastGuide(guide);
  }, [guide]);

  const displayGuide = guide || lastGuide;
  if (!displayGuide) return null;

  const isAnulada = Number(displayGuide.estado) !== 1;
  const transportista = displayGuide.transportistapub || displayGuide.transportistapriv || "—";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-md md:max-w-lg">
        <SheetHeader className="border-b border-border/40 p-5 pr-12">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Truck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="font-mono text-base font-bold tracking-tight text-foreground truncate">
                {displayGuide.num_guia}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">Guía de Remisión</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={isAnulada ? "destructive" : "success"} className="font-normal">
              {isAnulada ? "Anulada" : "Activa"}
            </Badge>
            <Badge variant="secondary" className="font-normal flex items-center gap-1 max-w-full">
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{displayGuide.concepto || "—"}</span>
            </Badge>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Fecha:
              </span>
              <span className="font-medium text-foreground">{formatFecha(displayGuide.fecha)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Destinatario:
              </span>
              <span className="font-medium text-foreground text-right truncate max-w-[200px]" title={displayGuide.cliente}>
                {displayGuide.cliente || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Sucursal:
              </span>
              <span className="font-medium text-foreground">{displayGuide.nombre_sucursal || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Transportista:
              </span>
              <span className="font-medium text-foreground">{transportista}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 p-4 space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Ruta de Traslado</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 min-w-0 rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Partida</p>
                <p className="font-medium text-foreground truncate" title={displayGuide.dir_partida ?? "—"}>
                  {displayGuide.dir_partida ?? "—"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <div className="flex-1 min-w-0 rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Destino</p>
                <p className="font-medium text-foreground truncate" title={displayGuide.dir_destino ?? "—"}>
                  {displayGuide.dir_destino ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/40" />

          <GuideDetailPanel guide={displayGuide} canGeneratePdf={canGeneratePdf} />
        </div>

        {canDeactivate && !isAnulada && (
          <div className="border-t border-border/40 p-5 bg-card">
            <Button variant="destructive" className="w-full gap-1.5 cursor-pointer" onClick={onAnular}>
              <Ban className="h-4 w-4" /> Anular Guía de Remisión
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
