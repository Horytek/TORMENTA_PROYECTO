import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Server, Database, RefreshCw, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getSystemStatus, type ServiceStatus } from "../api/health";

const isUp = (s?: ServiceStatus) => s?.status === "up";

function ServiceCard({ name, icon, service }: { name: string; icon: ReactNode; service?: ServiceStatus }) {
  const up = isUp(service);
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              up
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            )}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground">{up ? "Operativo" : "Problemas detectados"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={up ? "success" : "destructive"} className="capitalize">
            {up ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {service?.status ?? "desconocido"}
          </Badge>
          {service?.latency && <span className="num text-[10px] text-muted-foreground">{service.latency}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatusPage() {
  const { data, error, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["system-status"],
    queryFn: getSystemStatus,
    refetchInterval: 60_000,
    retry: 1,
  });

  const operational = !error && data?.status === "operational";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/horycore.svg" alt="Horytek" className="h-12 w-12 rounded-xl object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Estado del Sistema</h1>
          <p className="text-muted-foreground">Monitor de salud de los servicios de Horytek ERP</p>
        </div>

        <Card
          className={cn(
            "rounded-2xl border-l-4 shadow-md",
            operational ? "border-l-emerald-500" : "border-l-rose-500"
          )}
        >
          <CardContent className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Loader2 className="h-9 w-9 animate-spin text-brand" />
              ) : operational ? (
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-9 w-9 text-rose-500" />
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isLoading
                    ? "Comprobando…"
                    : error
                      ? "Error de conexión"
                      : operational
                        ? "Todos los sistemas operativos"
                        : "Interrupción del servicio"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dataUpdatedAt
                    ? `Última comprobación: ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                    : "Iniciando comprobación…"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Actualizar
            </Button>
          </CardContent>
        </Card>

        {data && (
          <div className="grid gap-4">
            <ServiceCard name="Base de Datos" icon={<Database className="h-4.5 w-4.5" />} service={data.services.database} />
            <ServiceCard name="Servidor API" icon={<Server className="h-4.5 w-4.5" />} service={data.services.server} />
          </div>
        )}

        <div className="border-t border-border pt-8 text-center">
          <Link to="/" className="text-sm text-brand hover:underline">
            &larr; Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
