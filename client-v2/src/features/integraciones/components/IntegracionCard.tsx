import { Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  ShieldCheck,
  ShieldAlert,
  CalendarClock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EstadoIntegracion, EstadoCredencial, Integracion } from "../types";

/**
 * Una integración por tarjeta. El objetivo es que el dueño del negocio entienda
 * en un vistazo si puede facturar — no que lea un diagnóstico técnico. Por eso
 * el detalle por credencial solo aparece cuando hay algo que arreglar.
 */

const ESTILO_ESTADO: Record<EstadoIntegracion, { label: string; icon: LucideIcon; className: string; barra: string }> = {
  OPERATIVO: {
    label: "Funcionando",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    barra: "bg-emerald-500",
  },
  DEGRADADO: {
    label: "Con avisos",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    barra: "bg-amber-500",
  },
  NO_CONFIGURADO: {
    label: "Requiere configuración",
    icon: XCircle,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    barra: "bg-rose-500",
  },
  NO_DISPONIBLE: {
    label: "No disponible",
    icon: MinusCircle,
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    barra: "bg-slate-400",
  },
};

/** Un solo color por credencial: o está lista, o hay que reingresarla. */
const credencialLista = (estado: EstadoCredencial) => estado === "OK";

export function IntegracionCard({ integracion }: { integracion: Integracion }) {
  const estilo = ESTILO_ESTADO[integracion.estado] ?? ESTILO_ESTADO.NO_DISPONIBLE;
  const Icono = estilo.icon;
  const pendientes = integracion.detalles.filter((d) => !credencialLista(d.estado));
  const cert = integracion.certificado;
  const certEnProblema = cert && cert.estado !== "VIGENTE";

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <div className={cn("absolute inset-y-0 left-0 w-1", estilo.barra)} aria-hidden />
      <CardContent className="space-y-4 p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{integracion.nombre}</h3>
            {integracion.descripcion && (
              <p className="mt-0.5 text-sm text-muted-foreground">{integracion.descripcion}</p>
            )}
          </div>
          <Badge variant="ghost" className={cn("shrink-0 gap-1.5 whitespace-nowrap", estilo.className)}>
            <Icono className="h-3.5 w-3.5" strokeWidth={2} />
            {estilo.label}
          </Badge>
        </div>

        <p className="text-sm text-foreground">{integracion.mensaje}</p>

        {/* El entorno se muestra siempre: emitir en producción por error no se deshace. */}
        {integracion.entorno && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Entorno:</span>
            <Badge variant={integracion.entorno === "produccion" ? "destructive" : "warning"}>
              {integracion.entorno === "produccion" ? "Producción (emisión real)" : "Beta (pruebas)"}
            </Badge>
          </div>
        )}

        {cert && (
          <div
            className={cn(
              "flex gap-2.5 rounded-xl p-3 text-xs leading-relaxed",
              certEnProblema
                ? "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            {certEnProblema ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            ) : (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Certificado digital</p>
              <p className="mt-0.5">{cert.mensaje}</p>
              {cert.titular && <p className="mt-0.5 truncate">Titular: {cert.titular}</p>}
              {cert.diasRestantes !== null && cert.diasRestantes >= 0 && cert.diasRestantes <= 60 && (
                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Quedan {cert.diasRestantes} día(s) de vigencia
                </p>
              )}
            </div>
          </div>
        )}

        {integracion.ubigeoConfigurado === false && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            Falta el ubigeo de la empresa, que SUNAT exige en cada comprobante.
          </p>
        )}

        {/* Solo se enumera lo que hay que arreglar; lo que está bien no distrae. */}
        {pendientes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pendiente de configurar ({pendientes.length})
            </p>
            <ul className="space-y-1.5">
              {pendientes.map((d) => (
                <li key={d.clave} className="flex items-start gap-2 text-xs">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" strokeWidth={2} />
                  <span className="min-w-0">
                    <span className="font-medium text-foreground">{d.etiqueta}</span>
                    {d.requerido && <span className="ml-1 text-rose-600 dark:text-rose-400">(obligatorio)</span>}
                    <span className="block text-muted-foreground">{d.mensaje}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {integracion.accion && integracion.estado !== "OPERATIVO" && (
          <Button asChild variant="outline" size="sm">
            <Link to={integracion.accion.ruta}>
              {integracion.accion.texto}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
