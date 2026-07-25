import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  HelpCircle,
  Ban,
  type LucideIcon,
} from "lucide-react";
import type { ItemState } from "@/components/shared/AdaptiveCollection/types";
import type { EstadoCpe } from "../types";

/**
 * Significado de cada estado fiscal, en un solo lugar.
 *
 * La diferencia entre estados importa y por eso cada uno lleva su explicación:
 * "aceptado con observaciones" es válido pero hay reparos que corregir, y
 * "sin confirmar" NO es un error recuperable con un botón — el envío pudo
 * llegar a SUNAT, así que reenviarlo duplicaría el comprobante.
 */
export interface EstiloEstado {
  label: string;
  descripcion: string;
  icon: LucideIcon;
  className: string;
  /** Estado semántico para el rail/punto de AdaptiveCollection. */
  state: ItemState;
}

export const ESTILOS_ESTADO: Record<EstadoCpe, EstiloEstado> = {
  ACEPTADO: {
    label: "Aceptado",
    descripcion: "SUNAT aceptó el comprobante y devolvió su CDR.",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    state: "active",
  },
  ACEPTADO_CON_OBS: {
    label: "Aceptado c/ obs.",
    descripcion:
      "Válido ante SUNAT, pero el CDR trae observaciones que conviene corregir en las próximas emisiones.",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    state: "warning",
  },
  ACEPTADO_SIN_RESPALDO: {
    label: "Aceptado (sin CDR)",
    descripcion:
      "Marcado como aceptado sin CDR archivado — normalmente por una emisión del flujo antiguo.",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    state: "warning",
  },
  RECHAZADO: {
    label: "Rechazado",
    descripcion:
      "SUNAT rechazó el comprobante. Hay que corregir los datos y emitir uno nuevo: reintentar el mismo envío no cambia nada.",
    icon: XCircle,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    state: "error",
  },
  INCIERTO: {
    label: "Sin confirmar",
    descripcion:
      "El envío salió pero no llegó respuesta. NO se reenvía automáticamente: hay que consultar el estado en SUNAT antes de actuar.",
    icon: HelpCircle,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    state: "warning",
  },
  ERROR_ENVIO: {
    label: "Error de envío",
    descripcion: "Falló la comunicación con SUNAT. Se puede reintentar sin riesgo de duplicar.",
    icon: AlertTriangle,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    state: "error",
  },
  ERROR_CONFIG: {
    label: "Error de configuración",
    descripcion:
      "Faltan datos del emisor o las credenciales SOL / el certificado no son válidos. Corrígelo en Configuración antes de reintentar.",
    icon: AlertTriangle,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    state: "error",
  },
  PENDIENTE: {
    label: "Pendiente",
    descripcion: "Registrado, todavía sin enviar a SUNAT.",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    state: "neutral",
  },
  ENVIANDO: {
    label: "Enviando",
    descripcion: "Envío en curso a SUNAT.",
    icon: Loader2,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    state: "info",
  },
  ANULADO: {
    label: "Anulado",
    descripcion: "Dado de baja ante SUNAT.",
    icon: Ban,
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    state: "inactive",
  },
};

const DESCONOCIDO: EstiloEstado = {
  label: "Desconocido",
  descripcion: "Estado no reconocido.",
  icon: HelpCircle,
  className: "bg-muted text-muted-foreground",
  state: "neutral",
};

export const estiloDeEstado = (estado?: string | null): EstiloEstado =>
  ESTILOS_ESTADO[estado as EstadoCpe] ?? DESCONOCIDO;

/** Estados desde los que el backend acepta un reintento (cpeCdr.js: ESTADOS_REINTENTABLES). */
export const ESTADOS_REINTENTABLES = new Set<string>(["PENDIENTE", "ERROR_ENVIO", "ERROR_CONFIG"]);
