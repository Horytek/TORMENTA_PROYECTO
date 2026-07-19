import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import { ClipboardList, UserCheck, AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef } from "@/components/shared/AdaptiveCollection/types";
import { getSystemLogs } from "../api/logs";
import type { SystemLog, LogPeriodo } from "../types";

/** Estilo visual por acción de log (label legible + color del badge). */
const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  LOGIN_OK: { label: "Ingreso exitoso", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  LOGOUT: { label: "Cierre de sesión", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  LOGIN_FAIL: { label: "Intento fallido", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  USUARIO_BLOQUEAR: { label: "Usuario bloqueado", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  USUARIO_DESBLOQUEAR: { label: "Usuario desbloqueado", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  USUARIO_CAMBIAR_CONTRASENA: { label: "Cambio de contraseña", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  VENTA_CREAR: { label: "Venta creada", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  VENTA_ANULAR: { label: "Venta anulada", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  COMPROBANTE_EMITIR: { label: "Comprobante emitido", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  SUNAT_ENVIAR: { label: "Enviado a SUNAT", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  SUNAT_ACEPTADA: { label: "SUNAT aceptó", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  SUNAT_RECHAZADA: { label: "SUNAT rechazó", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  NOTA_INGRESO_CREAR: { label: "Nota de ingreso", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  NOTA_SALIDA_CREAR: { label: "Nota de salida", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  NOTA_ANULAR: { label: "Nota anulada", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  GUIA_CREAR: { label: "Guía creada", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  GUIA_ANULAR: { label: "Guía anulada", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  CLIENTE_CREAR: { label: "Cliente creado", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CLIENTE_EDITAR: { label: "Cliente editado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PRODUCTO_CAMBIO_PRECIO: { label: "Cambio de precio", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

const PERIODOS: { value: LogPeriodo; label: string; describe: string }[] = [
  { value: "24h", label: "Últ. 24 hrs", describe: "últimas 24 horas" },
  { value: "semana", label: "Últ. semana", describe: "última semana" },
  { value: "mes", label: "Últ. mes", describe: "último mes" },
  { value: "anio", label: "Últ. año", describe: "último año" },
];

function cutoffFor(periodo: LogPeriodo): Date {
  const cutoff = new Date();
  switch (periodo) {
    case "semana": cutoff.setDate(cutoff.getDate() - 7); break;
    case "mes": cutoff.setMonth(cutoff.getMonth() - 1); break;
    case "anio": cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    default: cutoff.setHours(cutoff.getHours() - 24);
  }
  return cutoff;
}

interface KpiCardProps {
  icon: typeof ClipboardList;
  title: string;
  value: number;
  iconClassName: string;
}

function KpiCard({ icon: Icon, title, value, iconClassName }: KpiCardProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="num text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemLogsPage() {
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [periodo, setPeriodo] = useQueryState<LogPeriodo>(
    "periodo",
    parseAsStringLiteral(["24h", "semana", "mes", "anio"] as const).withDefault("24h")
  );

  const { data, isLoading } = useQuery({
    queryKey: ["system-logs"],
    queryFn: () => getSystemLogs(1, 1000),
  });

  const logs = useMemo(() => {
    const cutoff = cutoffFor(periodo).getTime();
    const now = Date.now();
    return (data?.rows ?? []).filter((log) => {
      const t = new Date(log.fecha).getTime();
      return t >= cutoff && t <= now;
    });
  }, [data, periodo]);

  const stats = useMemo(() => ({
    total: logs.length,
    logins: logs.filter((l) => l.accion?.includes("LOGIN")).length,
    errores: logs.filter((l) => l.accion?.includes("FAIL") || l.accion?.includes("RECHAZ")).length,
  }), [logs]);

  const periodoLabel = PERIODOS.find((p) => p.value === periodo)?.describe ?? "";

  const fields: FieldDef<SystemLog>[] = [
    {
      key: "accion",
      label: "Acción",
      priority: "primary",
      render: (value) => {
        const accion = String(value ?? "");
        const style = ACTION_STYLES[accion] ?? { label: accion || "—", className: "bg-muted text-muted-foreground" };
        return <Badge variant="ghost" className={style.className}>{style.label}</Badge>;
      },
    },
    {
      key: "descripcion",
      label: "Descripción",
      priority: "secondary",
      semantic: "subtitle",
      format: (value) => (value ? String(value) : "—"),
    },
    {
      key: "usua",
      label: "Usuario",
      priority: "secondary",
      semantic: "badge",
      render: (value, item) => (
        <Badge variant="outline" className="num">{String(value ?? item.id_usuario ?? "Sistema")}</Badge>
      ),
    },
    {
      key: "fecha",
      label: "Fecha/Hora",
      priority: "secondary",
      semantic: "chip",
      render: (value) => {
        const d = new Date(String(value));
        return (
          <span className="num text-xs text-muted-foreground whitespace-nowrap">
            {isNaN(d.getTime()) ? "—" : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        );
      },
    },
    {
      key: "ip",
      label: "IP",
      priority: "meta",
      semantic: "code",
      format: (value) => (value ? String(value) : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Logs del Sistema</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registros de actividad y auditoría del sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={ClipboardList}
          title={`Registros (${periodoLabel})`}
          value={stats.total}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <KpiCard
          icon={UserCheck}
          title="Inicios de sesión"
          value={stats.logins}
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <KpiCard
          icon={AlertTriangle}
          title="Errores / rechazos"
          value={stats.errores}
          iconClassName="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
        />
      </div>

      <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as LogPeriodo)}>
        <TabsList>
          {PERIODOS.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AdaptiveCollection<SystemLog>
        items={logs}
        fields={fields}
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por usuario, acción, descripción o IP…"
        onSearch={setSearchTerm}
        layout="list"
        totalCount={logs.length}
        getItemId={(l) => l.id_log}
        empty={{
          title: "Sin registros",
          description: searchTerm
            ? "Ningún log coincide con la búsqueda en este período."
            : `No hay actividad registrada en ${periodoLabel}.`,
        }}
      />
    </div>
  );
}
