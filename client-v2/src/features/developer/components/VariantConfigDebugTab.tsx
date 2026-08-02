import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAttributes, getAttributeImpact } from "@/features/content/api/content";
import { TIPO_LABELS } from "@/features/content/types";

/**
 * Diagnóstico del sistema de atributos/variantes del tenant del usuario
 * conectado. El nombre del archivo viene del plan original (pensado para el
 * `useVariantConfigStore` huérfano que se borró el 2026-08-01) — hoy muestra
 * el sistema real: `atributo.es_visible`/`orden`, sin lista fija hardcodeada.
 *
 * Solo lectura: para tocar algo, usar Configuración > Variantes y atributos
 * (`VariantesSettingsCard.tsx`) o Productos > Atributos y variantes.
 */
export default function VariantConfigDebugTab() {
  const [expandido, setExpandido] = useState<number | null>(null);

  const { data: attributes = [], isLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sliders className="h-4 w-4 text-brand" />
        <h3 className="text-base font-semibold text-foreground">Atributos y variantes — estado real</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Todos los atributos del tenant actual, incluidos los desactivados (a diferencia de la vista de Configuración, que solo deja togglear). Clic en una fila para ver su impacto.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : attributes.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No hay atributos creados en este tenant.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <div className="grid grid-cols-[2rem_3rem_1fr_1fr_5rem_4rem_4rem_5rem] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span />
            <span>ID</span>
            <span>Nombre</span>
            <span>Código</span>
            <span>Tipo</span>
            <span>Orden</span>
            <span>Visible</span>
            <span>Filtro/Oblig.</span>
          </div>
          {attributes.map((a) => (
            <div key={a.id_atributo}>
              <button
                type="button"
                onClick={() => setExpandido((prev) => (prev === a.id_atributo ? null : a.id_atributo))}
                className="grid w-full grid-cols-[2rem_3rem_1fr_1fr_5rem_4rem_4rem_5rem] items-center gap-2 border-b border-border/60 px-3 py-2 text-left text-xs hover:bg-accent/40"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/50 transition-transform", expandido === a.id_atributo && "rotate-90")} />
                <span className="num text-muted-foreground">{a.id_atributo}</span>
                <span className="truncate font-medium text-foreground">{a.nombre}</span>
                <span className="truncate font-mono text-muted-foreground">{a.codigo || "—"}</span>
                <span className="text-muted-foreground">{TIPO_LABELS[a.tipo_input] ?? a.tipo_input}</span>
                <span className="num text-muted-foreground">{a.orden ?? "—"}</span>
                <Badge variant={a.es_visible ? "success" : "secondary"} className="w-fit text-[10px]">
                  {a.es_visible ? "Sí" : "No"}
                </Badge>
                <span className="flex gap-1">
                  {!!a.es_filtro && <Badge variant="outline" className="text-[10px]">F</Badge>}
                  {!!a.es_requerido && <Badge variant="warning" className="text-[10px]">R</Badge>}
                </span>
              </button>
              {expandido === a.id_atributo && <ImpactoAtributo id={a.id_atributo} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImpactoAtributo({ id }: { id: number }) {
  const { data: impact, isLoading } = useQuery({
    queryKey: ["attribute-impact", id],
    queryFn: () => getAttributeImpact(id),
  });

  return (
    <div className="border-b border-border/60 bg-muted/20 px-8 py-2.5 text-xs">
      {isLoading ? (
        <span className="text-muted-foreground">Calculando impacto…</span>
      ) : (
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <span>Productos: <span className="num font-medium text-foreground">{impact?.productos ?? 0}</span></span>
          <span>Variantes: <span className="num font-medium text-foreground">{impact?.variantes ?? 0}</span></span>
          <span>Plantillas de categoría: <span className="num font-medium text-foreground">{impact?.categorias ?? 0}</span></span>
          <span>Líneas de venta: <span className="num font-medium text-foreground">{impact?.lineasVenta ?? 0}</span></span>
        </div>
      )}
    </div>
  );
}
