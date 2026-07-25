// ─────────────────────────────────────────────────────────────────
// Pantalla principal de devoluciones. Consume el componente global
// AdaptiveCollection vía configuración (config/collection.tsx):
// vistas por estado, búsqueda, filtros, expansión, export y acciones
// dependientes de estado + permisos.
// ─────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, RotateCcw } from "lucide-react";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCambiarEstado, useDevoluciones, useProcesarReembolso } from "../hooks/useDevoluciones";
import type { Devolucion, DevolucionEstado } from "../types";
import { devolucionActions, devolucionFields, devolucionRhythm } from "../config/collection";
import { ReturnWizard } from "../components/ReturnWizard";
import { ReturnDetailSheet } from "../components/ReturnDetailSheet";
import { printDevolucion } from "../lib/printDevolucion";
import { CONDICION_LABELS, DESTINO_LABELS, MOTIVO_LABELS, soles } from "../config/catalog";

// Vistas rápidas (chips) → estados que agrupan
const VISTAS: { id: string; label: string; estados?: DevolucionEstado[] }[] = [
  { id: "todas", label: "Todas" },
  { id: "pendientes", label: "Pendientes", estados: ["pendiente_revision", "pendiente_aprobacion"] },
  { id: "aprobadas", label: "Aprobadas", estados: ["aprobada"] },
  { id: "reembolsos", label: "Reembolsos", estados: ["procesando_reembolso"] },
  { id: "completadas", label: "Completadas", estados: ["completada", "cerrada"] },
  { id: "rechazadas", label: "Rechazadas", estados: ["rechazada", "cancelada"] },
];

const TRANSICION_COPY: Partial<Record<DevolucionEstado, { title: string; desc: string; cta: string; danger?: boolean }>> = {
  aprobada: { title: "¿Aprobar devolución?", desc: "Se autorizará el reingreso de productos y el reembolso.", cta: "Aprobar" },
  rechazada: { title: "¿Rechazar devolución?", desc: "La solicitud quedará rechazada de forma definitiva.", cta: "Rechazar", danger: true },
  completada: { title: "¿Completar devolución?", desc: "Confirma que los productos fueron recibidos y el inventario actualizado.", cta: "Completar" },
  cancelada: { title: "¿Cancelar devolución?", desc: "La operación se cancela y no genera movimientos.", cta: "Cancelar devolución", danger: true },
};

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [vista, setVista] = useQueryState("vista", parseAsString.withDefault("todas"));
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detalle, setDetalle] = useState<Devolucion | null>(null);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [transicion, setTransicion] = useState<{ d: Devolucion; a: DevolucionEstado } | null>(null);
  const [reembolso, setReembolso] = useState<Devolucion | null>(null);
  const [metodoReembolso, setMetodoReembolso] = useState("EFECTIVO");

  const { can } = usePermissions();
  const { data: devoluciones = [], isLoading, isError } = useDevoluciones();
  const cambiarEstado = useCambiarEstado();
  const procesarReembolso = useProcesarReembolso();

  const conteos = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of VISTAS) {
      map.set(v.id, v.estados ? devoluciones.filter((d) => v.estados!.includes(d.estado)).length : devoluciones.length);
    }
    return map;
  }, [devoluciones]);

  const totalDevuelto = useMemo(
    () => devoluciones.filter((d) => ["completada", "cerrada"].includes(d.estado)).reduce((acc, d) => acc + d.total, 0),
    [devoluciones]
  );

  const visibles = useMemo(() => {
    const estados = VISTAS.find((v) => v.id === vista)?.estados;
    return estados ? devoluciones.filter((d) => estados.includes(d.estado)) : devoluciones;
  }, [devoluciones, vista]);

  const fields = useMemo(() => devolucionFields(), []);
  const actions = useMemo(
    () =>
      devolucionActions({
        onVerDetalle: setDetalle,
        onContinuarBorrador: () => setWizardOpen(true),
        onTransicion: (d, a) => setTransicion({ d, a }),
        onReembolso: setReembolso,
        onImprimir: printDevolucion,
        onAuditoria: setDetalle,
      }),
    []
  );

  const copy = transicion ? TRANSICION_COPY[transicion.a] : null;

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* ── Vistas rápidas + indicador resumido ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
              vista === v.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {v.label}
            <span className="ml-1.5 text-[10px] opacity-70 num">{conteos.get(v.id) ?? 0}</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Total devuelto: <span className="font-semibold text-foreground num">{soles(totalDevuelto)}</span>
        </span>
      </div>

      <AdaptiveCollection<Devolucion>
        title="Devoluciones"
        items={visibles}
        fields={fields}
        actions={actions}
        layout="auto"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por código, comprobante, cliente…"
        onSearch={setSearchTerm}
        getItemId={(d) => d.id_devolucion}
        getRhythm={devolucionRhythm}
        exportFileName="devoluciones.csv"
        expandedId={expandedId}
        renderExpanded={(d) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-3 text-xs">
            {d.items.map((i) => (
              <div key={i.id_detalle} className="flex items-center justify-between gap-3 py-1">
                <span className="truncate">
                  {i.cantidad} × {i.descripcion}
                  <span className="text-muted-foreground"> · {MOTIVO_LABELS[i.motivo]} · {CONDICION_LABELS[i.condicion]} → {DESTINO_LABELS[i.destino]}</span>
                </span>
                <span className="num font-medium shrink-0">{soles(i.importe)}</span>
              </div>
            ))}
          </div>
        )}
        onRecordClick={(d) => setExpandedId((prev) => (prev === d.id_devolucion ? null : d.id_devolucion))}
        empty={{
          title: isError ? "No se pudo cargar devoluciones" : "Sin devoluciones registradas",
          description: isError
            ? "El servicio de devoluciones no respondió. Reintenta o verifica el backend."
            : "Registra la primera devolución buscando la venta original.",
          action: can("devoluciones.create")
            ? { label: "Nueva devolución", onClick: () => setWizardOpen(true) }
            : undefined,
        }}
        globalActions={
          can("devoluciones.create")
            ? [{ id: "nueva", label: "Nueva devolución", icon: <Plus className="h-4 w-4" />, onClick: () => setWizardOpen(true) }]
            : []
        }
      />

      {/* ── Flujo guiado de creación ── */}
      <ReturnWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* ── Detalle ── */}
      <ReturnDetailSheet devolucion={detalle} onClose={() => setDetalle(null)} />

      {/* ── Confirmación de transiciones de estado ── */}
      <ConfirmDialog
        open={!!transicion}
        onClose={() => setTransicion(null)}
        onConfirm={() =>
          transicion &&
          cambiarEstado.mutate(
            { id: transicion.d.id_devolucion, estado: transicion.a },
            { onSuccess: () => setTransicion(null) }
          )
        }
        title={copy?.title ?? ""}
        description={copy ? `${copy.desc} (${transicion?.d.codigo})` : ""}
        confirmLabel={copy?.cta ?? "Confirmar"}
        variant={copy?.danger ? "danger" : "default"}
        isPending={cambiarEstado.isPending}
      />

      {/* ── Procesar reembolso ── */}
      <Dialog open={!!reembolso} onOpenChange={(o) => !o && setReembolso(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />Procesar reembolso
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {reembolso?.codigo} · <span className="font-semibold text-foreground num">{soles(reembolso?.total)}</span>
          </p>
          <Select value={metodoReembolso} onValueChange={setMetodoReembolso}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ORIGINAL">Método de pago original</SelectItem>
              <SelectItem value="EFECTIVO">Efectivo</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
              <SelectItem value="NOTA_CREDITO">Nota de crédito</SelectItem>
              <SelectItem value="SALDO_FAVOR">Saldo a favor</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setReembolso(null)}>Cancelar</Button>
            <Button
              size="sm"
              disabled={procesarReembolso.isPending}
              onClick={() =>
                reembolso &&
                procesarReembolso.mutate(
                  { id: reembolso.id_devolucion, metodo: metodoReembolso },
                  { onSuccess: () => setReembolso(null) }
                )
              }
            >
              {procesarReembolso.isPending ? "Procesando…" : "Procesar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
