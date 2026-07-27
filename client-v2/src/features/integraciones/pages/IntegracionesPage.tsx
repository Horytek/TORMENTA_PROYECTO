import { useQuery } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, AlertTriangle, Plug } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IntegracionCard } from "../components/IntegracionCard";
import { getEstadoIntegraciones } from "../api/integraciones";

/**
 * Estado de las integraciones del negocio.
 *
 * Nace de un problema concreto: las credenciales SUNAT pueden estar guardadas y
 * aun así no servir —porque se guardó la máscara del formulario, porque quedaron
 * con el cifrado anterior, o porque el certificado venció— y hasta ahora eso solo
 * se descubría cuando fallaba una emisión. Acá se ve antes.
 */
export default function IntegracionesPage() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["integraciones"],
    queryFn: getEstadoIntegraciones,
  });

  const resumen = data?.resumen;
  const todoBien = resumen && resumen.conProblema === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Integraciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado de los servicios que tu negocio necesita para operar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Revisar de nuevo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : !data ? (
        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Plug className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-medium text-foreground">No se pudo revisar el estado</p>
            <p className="text-sm text-muted-foreground">Vuelve a intentarlo en un momento.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Titular único: o puedes operar, o esto es lo que falta. */}
          <Card
            className={
              todoBien
                ? "rounded-2xl border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                : "rounded-2xl border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
            }
          >
            <CardContent className="flex items-start gap-4 p-5">
              {todoBien ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              ) : (
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" strokeWidth={2} />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {todoBien
                    ? "Todo listo para operar"
                    : `${resumen!.requierenAccion.length || resumen!.conProblema} servicio(s) necesitan tu atención`}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {todoBien
                    ? `Los ${resumen!.total} servicios responden correctamente.`
                    : resumen!.requierenAccion.length > 0
                      ? `No podrás usar: ${resumen!.requierenAccion.join(", ")}.`
                      : "Hay avisos que conviene revisar."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.integraciones.map((integracion) => (
              <IntegracionCard key={integracion.id} integracion={integracion} />
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Última revisión: {new Date(data.generadoEn).toLocaleString("es-PE")}
          </p>
        </>
      )}
    </div>
  );
}
