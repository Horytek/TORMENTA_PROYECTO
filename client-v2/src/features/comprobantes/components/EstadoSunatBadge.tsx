import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { estiloDeEstado } from "../lib/estadoCpe";

interface EstadoSunatBadgeProps {
  estado?: string | null;
  /** Muestra el ícono al costado del texto. */
  conIcono?: boolean;
  className?: string;
}

/** Estado fiscal del comprobante tal como lo devolvió SUNAT. */
export function EstadoSunatBadge({ estado, conIcono = true, className }: EstadoSunatBadgeProps) {
  const estilo = estiloDeEstado(estado);
  const Icono = estilo.icon;

  return (
    <Badge variant="ghost" className={cn("gap-1.5 whitespace-nowrap", estilo.className, className)}>
      {conIcono && (
        <Icono className={cn("h-3.5 w-3.5", estado === "ENVIANDO" && "animate-spin")} strokeWidth={2} />
      )}
      {estilo.label}
    </Badge>
  );
}
