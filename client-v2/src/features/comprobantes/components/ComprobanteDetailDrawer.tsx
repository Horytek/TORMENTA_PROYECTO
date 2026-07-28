import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileCode2,
  FileCheck2,
  RefreshCw,
  Info,
  Loader2,
  ShieldAlert,
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
import { Can } from "@/components/shared/Can";
import { cn } from "@/lib/utils";
import { EstadoSunatBadge } from "./EstadoSunatBadge";
import { estiloDeEstado, ESTADOS_REINTENTABLES } from "../lib/estadoCpe";
import { getComprobante, descargarArchivoCpe, parseErrorCpe } from "../api/comprobantes";
import type { Comprobante } from "../types";

const soles = (valor: unknown) =>
  `S/ ${Number(valor ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fechaHora = (valor?: string | null) => {
  if (!valor) return "—";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return String(valor);
  return `${d.toLocaleDateString("es-PE")} ${d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
};

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate text-sm text-foreground">{children}</div>
    </div>
  );
}

interface ComprobanteDetailDrawerProps {
  comprobante: Comprobante | null;
  isOpen: boolean;
  onClose: () => void;
  onReintentar: (cpe: Comprobante) => void;
  reintentando: boolean;
}

export function ComprobanteDetailDrawer({
  comprobante,
  isOpen,
  onClose,
  onReintentar,
  reintentando,
}: ComprobanteDetailDrawerProps) {
  const [descargando, setDescargando] = useState<"xml" | "cdr" | null>(null);

  // `comprobante` sigue presente mientras la hoja se cierra: el padre solo baja
  // `isOpen` y lo limpia después, así no hace falta cachearlo acá para que el
  // contenido no parpadee durante la animación de salida.
  const visible = comprobante;

  // El detalle trae notas del CDR + bitácora de envíos: se pide solo al abrir.
  const { data: detalle, isLoading } = useQuery({
    queryKey: ["cpe", "detalle", visible?.id_cpe],
    queryFn: () => getComprobante(visible!.id_cpe),
    enabled: isOpen && !!visible?.id_cpe,
  });

  if (!visible) return null;

  const estilo = estiloDeEstado(visible.estado);
  const numero = `${visible.serie}-${visible.correlativo}`;
  const puedeReintentar = ESTADOS_REINTENTABLES.has(visible.estado);
  const bitacora = detalle?.envios ?? [];

  const descargar = async (tipo: "xml" | "cdr") => {
    setDescargando(tipo);
    try {
      await descargarArchivoCpe(visible.id_cpe, tipo, visible.nombre_archivo || numero);
    } catch (error) {
      toast.error(parseErrorCpe(error).message);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(abierto) => !abierto && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="num text-xl font-bold tracking-tight">{numero}</SheetTitle>
              <SheetDescription>
                {visible.tipo_doc === "01" ? "Factura electrónica" : "Boleta de venta electrónica"}
                {visible.sunat_env ? ` · entorno ${visible.sunat_env}` : ""}
              </SheetDescription>
            </div>
            <EstadoSunatBadge estado={visible.estado} />
          </div>

          {/* Qué significa el estado ante SUNAT — la parte que el flujo antiguo no decía. */}
          <div className={cn("flex gap-2.5 rounded-xl p-3 text-xs leading-relaxed", estilo.className)}>
            <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{estilo.descripcion}</span>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <Dato label="Cliente">{visible.nombre_cliente || "—"}</Dato>
            <Dato label="Documento">
              <span className="num">{visible.num_doc_cliente || "—"}</span>
            </Dato>
            <Dato label="Fecha de emisión">
              <span className="num">{visible.fecha_emision?.slice(0, 10) ?? "—"}</span>
            </Dato>
            <Dato label="Venta de origen">
              <span className="num">#{visible.id_venta}</span>
            </Dato>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <Dato label="Gravado">
              <span className="num">{soles(visible.mto_oper_gravadas)}</span>
            </Dato>
            <Dato label="IGV">
              <span className="num">{soles(visible.mto_igv)}</span>
            </Dato>
            <Dato label="Total">
              <span className="num font-semibold">{soles(visible.mto_imp_venta)}</span>
            </Dato>
          </div>

          <Separator />

          {/* Respuesta oficial de SUNAT: el ResponseCode es la verdad, no el HTTP status. */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Respuesta de SUNAT</h3>
            {visible.sunat_response_code || visible.sunat_descripcion ? (
              <div className="space-y-2 rounded-xl border border-border/70 bg-muted/40 p-3">
                {visible.sunat_response_code && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ResponseCode</span>
                    <Badge variant="outline" className="num">{visible.sunat_response_code}</Badge>
                  </div>
                )}
                {visible.sunat_descripcion && (
                  <p className="text-sm leading-relaxed text-foreground">{visible.sunat_descripcion}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay respuesta de SUNAT para este comprobante.
              </p>
            )}

            {visible.ultimo_error && (
              <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="font-semibold">
                    Último error{visible.ultimo_error_categoria ? ` (${visible.ultimo_error_categoria})` : ""}
                  </p>
                  <p className="mt-0.5 break-words">{visible.ultimo_error}</p>
                </div>
              </div>
            )}

            {!!detalle?.notas?.length && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Observaciones del CDR
                </p>
                <ul className="space-y-1.5">
                  {detalle.notas.map((nota, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                    >
                      {typeof nota === "string" ? nota : `${nota.codigo ?? ""} ${nota.mensaje ?? JSON.stringify(nota)}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <Separator />

          {/* Bitácora append-only: cada envío queda registrado aunque falle. */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Historial de envíos{visible.intentos ? ` (${visible.intentos})` : ""}
            </h3>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial…
              </div>
            ) : bitacora.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin intentos registrados.</p>
            ) : (
              <ol className="space-y-2">
                {bitacora.map((intento, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border/70 p-3 text-xs"
                  >
                    <Badge variant="outline" className="num shrink-0">#{intento.intento}</Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground">{intento.operacion}</span>
                        {intento.resultado && (
                          <Badge
                            variant={intento.resultado === "OK" ? "success" : "destructive"}
                            className="text-[10px]"
                          >
                            {intento.resultado}
                          </Badge>
                        )}
                        {intento.sunat_response_code && (
                          <span className="num text-muted-foreground">code {intento.sunat_response_code}</span>
                        )}
                        {intento.duracion_ms != null && (
                          <span className="num text-muted-foreground">
                            {(intento.duracion_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {intento.mensaje && (
                        <p className="mt-1 break-words text-muted-foreground">{intento.mensaje}</p>
                      )}
                      <p className="num mt-1 text-muted-foreground">{fechaHora(intento.creado_en)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => descargar("xml")}
              disabled={descargando !== null}
            >
              {descargando === "xml" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCode2 className="h-4 w-4" />
              )}
              XML firmado
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => descargar("cdr")}
              disabled={descargando !== null}
            >
              {descargando === "cdr" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck2 className="h-4 w-4" />
              )}
              CDR
            </Button>

            {/* Reintentar solo donde el backend lo permite: un RECHAZADO necesita
                corregir datos y emitir de nuevo, y un INCIERTO exige consultar
                antes — reenviarlo a ciegas duplicaría el comprobante. */}
            {puedeReintentar && (
              <Can capability="comprobantes.generate">
                <Button size="sm" onClick={() => onReintentar(visible)} disabled={reintentando}>
                  {reintentando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reintentar envío
                </Button>
              </Can>
            )}
          </div>

          {visible.estado === "INCIERTO" && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              El XML firmado sigue disponible arriba. Para resolverlo, consulta el estado del
              comprobante <span className="num">{numero}</span> en SUNAT antes de emitir cualquier
              documento nuevo.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-border/70 px-4 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
