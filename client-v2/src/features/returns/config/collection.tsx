// ─────────────────────────────────────────────────────────────────
// Configuración declarativa de la lista de devoluciones para el
// componente global AdaptiveCollection: campos, ritmo visual y
// acciones dependientes de estado + capability. La página solo
// consume esta config — cero condicionales de módulo en el componente.
// ─────────────────────────────────────────────────────────────────
import { Eye, Check, X, Banknote, PackageCheck, Printer, Ban, PencilLine, History } from "lucide-react";
import type { FieldDef, RecordAction, RhythmConfig } from "@/components/shared/AdaptiveCollection";
import type { Devolucion, DevolucionEstado } from "../types";
import { puedeTransicionar } from "../lib/rules";
import { ESTADO_META, MOTIVO_LABELS, RESOLUCION_LABELS, soles } from "./catalog";

export function devolucionFields(): FieldDef<Devolucion>[] {
  return [
    {
      key: "codigo",
      label: "Devolución",
      priority: "primary",
      semantic: "title",
      render: (_, d) => d.codigo,
    },
    {
      key: "nom_cliente",
      label: "Cliente",
      priority: "secondary",
      semantic: "subtitle",
      format: (v) => (v as string) || "Cliente general",
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => ESTADO_META[v as DevolucionEstado]?.label ?? String(v),
    },
    {
      key: "total",
      label: "Importe",
      priority: "secondary",
      semantic: "number",
      format: (v) => soles(v as number),
    },
    {
      key: "num_comprobante",
      label: "Venta original",
      priority: "meta",
      semantic: "code",
      format: (v, d) => (v as string) || `Venta #${d.id_venta}`,
    },
    {
      key: "fecha",
      label: "Fecha",
      priority: "meta",
      semantic: "date",
    },
    {
      key: "nombre_sucursal",
      label: "Sucursal",
      priority: "meta",
      semantic: "chip",
      format: (v) => (v as string) || "—",
      collapsible: true,
    },
    {
      key: "items",
      label: "Productos",
      priority: "meta",
      semantic: "text",
      format: (_, d) => {
        const n = d.items?.reduce((acc, i) => acc + i.cantidad, 0) ?? 0;
        return `${n} und. en ${d.items?.length ?? 0} producto(s)`;
      },
      collapsible: true,
    },
    {
      key: "resolucion",
      label: "Resolución",
      priority: "meta",
      semantic: "text",
      format: (v) => RESOLUCION_LABELS[v as keyof typeof RESOLUCION_LABELS] ?? String(v),
      collapsible: true,
    },
    {
      key: "motivo_principal",
      label: "Motivo",
      priority: "meta",
      semantic: "text",
      render: (_, d) => {
        const motivo = d.items?.[0]?.motivo;
        return motivo ? MOTIVO_LABELS[motivo] : "—";
      },
      collapsible: true,
    },
    {
      key: "responsable",
      label: "Responsable",
      priority: "meta",
      semantic: "text",
      format: (v) => (v as string) || "—",
      collapsible: true,
    },
  ];
}

export function devolucionRhythm(d: Devolucion): RhythmConfig {
  return { type: "dot", state: ESTADO_META[d.estado]?.state ?? "neutral" };
}

export interface DevolucionHandlers {
  onVerDetalle: (d: Devolucion) => void;
  onContinuarBorrador: (d: Devolucion) => void;
  onTransicion: (d: Devolucion, a: DevolucionEstado) => void;
  onReembolso: (d: Devolucion) => void;
  onImprimir: (d: Devolucion) => void;
  onAuditoria: (d: Devolucion) => void;
}

/** Acciones por registro. `capability` la filtra AdaptiveCollection; `hidden`
 *  usa la máquina de estados (rules.ts) para mostrar solo transiciones válidas. */
export function devolucionActions(h: DevolucionHandlers): RecordAction[] {
  const item = (i: unknown) => i as Devolucion;
  return [
    {
      id: "ver",
      label: "Ver detalle",
      icon: <Eye className="h-4 w-4" />,
      onClick: (i) => h.onVerDetalle(item(i)),
      persistent: true,
    },
    {
      id: "continuar",
      label: "Continuar borrador",
      icon: <PencilLine className="h-4 w-4" />,
      capability: "devoluciones.create",
      hidden: (i) => item(i).estado !== "borrador",
      onClick: (i) => h.onContinuarBorrador(item(i)),
    },
    {
      id: "aprobar",
      label: "Aprobar",
      icon: <Check className="h-4 w-4" />,
      capability: "devoluciones.aprobar",
      hidden: (i) => !puedeTransicionar(item(i).estado, "aprobada"),
      onClick: (i) => h.onTransicion(item(i), "aprobada"),
    },
    {
      id: "rechazar",
      label: "Rechazar",
      icon: <X className="h-4 w-4" />,
      capability: "devoluciones.rechazar",
      hidden: (i) => !puedeTransicionar(item(i).estado, "rechazada"),
      onClick: (i) => h.onTransicion(item(i), "rechazada"),
      variant: "destructive",
    },
    {
      id: "reembolso",
      label: "Procesar reembolso",
      icon: <Banknote className="h-4 w-4" />,
      capability: "devoluciones.reembolsar",
      hidden: (i) => !puedeTransicionar(item(i).estado, "procesando_reembolso"),
      onClick: (i) => h.onReembolso(item(i)),
    },
    {
      id: "completar",
      label: "Recibir productos / completar",
      icon: <PackageCheck className="h-4 w-4" />,
      capability: "devoluciones.edit",
      hidden: (i) => !puedeTransicionar(item(i).estado, "completada"),
      onClick: (i) => h.onTransicion(item(i), "completada"),
    },
    {
      id: "imprimir",
      label: "Imprimir documentos",
      icon: <Printer className="h-4 w-4" />,
      hidden: (i) => !["completada", "cerrada", "aprobada"].includes(item(i).estado),
      onClick: (i) => h.onImprimir(item(i)),
    },
    {
      id: "auditoria",
      label: "Consultar auditoría",
      icon: <History className="h-4 w-4" />,
      capability: "devoluciones.auditoria",
      onClick: (i) => h.onAuditoria(item(i)),
    },
    {
      id: "cancelar",
      label: "Cancelar",
      icon: <Ban className="h-4 w-4" />,
      capability: "devoluciones.cancelar",
      hidden: (i) => !puedeTransicionar(item(i).estado, "cancelada"),
      onClick: (i) => h.onTransicion(item(i), "cancelada"),
      variant: "destructive",
    },
  ];
}
