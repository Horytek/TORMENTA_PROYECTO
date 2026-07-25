import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";
import { toast } from "sonner";
import { FileCheck2, XCircle, HelpCircle, Send, RefreshCw, Eye } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useCan } from "@/components/shared/Can";
import { EstadoSunatBadge } from "../components/EstadoSunatBadge";
import { estiloDeEstado, ESTADOS_REINTENTABLES } from "../lib/estadoCpe";
import { ComprobanteDetailDrawer } from "../components/ComprobanteDetailDrawer";
import {
  getComprobantes,
  getResumenCpe,
  getVentasSinComprobante,
  emitirComprobante,
  reintentarComprobante,
  parseErrorCpe,
} from "../api/comprobantes";
import type { Comprobante, VentaSinCpe } from "../types";

const ESTADOS_FILTRO = [
  { value: "", label: "Todos los estados" },
  { value: "ACEPTADO", label: "Aceptados" },
  { value: "ACEPTADO_CON_OBS", label: "Aceptados con observaciones" },
  { value: "RECHAZADO", label: "Rechazados" },
  { value: "INCIERTO", label: "Sin confirmar" },
  { value: "ERROR_ENVIO", label: "Error de envío" },
  { value: "ERROR_CONFIG", label: "Error de configuración" },
  { value: "PENDIENTE", label: "Pendientes" },
];

const TIPOS_FILTRO = [
  { value: "", label: "Factura y boleta" },
  { value: "01", label: "Solo facturas" },
  { value: "03", label: "Solo boletas" },
];

const PAGINA = 25;

const soles = (valor: unknown) =>
  `S/ ${Number(valor ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface KpiCardProps {
  icon: typeof FileCheck2;
  title: string;
  value: number;
  iconClassName: string;
  hint?: string;
}

function KpiCard({ icon: Icon, title, value, iconClassName, hint }: KpiCardProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="num text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
          {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComprobantesPage() {
  const queryClient = useQueryClient();
  const puedeEmitir = useCan("ventas.generate");

  const [pestania, setPestania] = useQueryState(
    "tab",
    parseAsStringLiteral(["emitidos", "por-emitir"] as const).withDefault("emitidos")
  );
  const [busqueda, setBusqueda] = useQueryState("q", parseAsString.withDefault(""));
  const [estado, setEstado] = useQueryState("estado", parseAsString.withDefault(""));
  const [tipoDoc, setTipoDoc] = useQueryState("tipo", parseAsString.withDefault(""));
  const [desde, setDesde] = useQueryState("desde", parseAsString.withDefault(""));
  const [hasta, setHasta] = useQueryState("hasta", parseAsString.withDefault(""));
  const [pagina, setPagina] = useQueryState("page", parseAsInteger.withDefault(1));

  // `detalle` se conserva mientras la hoja se cierra (solo baja `detalleAbierto`)
  // para que el contenido no desaparezca a mitad de la animación de salida.
  const [detalle, setDetalle] = useState<Comprobante | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [porEmitir, setPorEmitir] = useState<VentaSinCpe | null>(null);
  const [porReintentar, setPorReintentar] = useState<Comprobante | null>(null);

  const rango = { desde: desde || undefined, hasta: hasta || undefined };

  const { data: resumen } = useQuery({
    queryKey: ["cpe", "resumen", rango],
    queryFn: () => getResumenCpe(rango),
  });

  const { data: lista, isLoading } = useQuery({
    queryKey: ["cpe", "lista", { busqueda, estado, tipoDoc, ...rango, pagina }],
    queryFn: () =>
      getComprobantes({
        q: busqueda || undefined,
        estado: estado || undefined,
        tipo_doc: tipoDoc || undefined,
        ...rango,
        page: pagina,
        limit: PAGINA,
      }),
  });

  const { data: pendientes, isLoading: cargandoPendientes } = useQuery({
    queryKey: ["cpe", "pendientes", rango],
    queryFn: () => getVentasSinComprobante({ ...rango, limit: 200 }),
  });

  /** Refresca lista + KPIs tras emitir o reintentar. */
  const refrescar = () => queryClient.invalidateQueries({ queryKey: ["cpe"] });

  /**
   * `yaEmitido` significa que el backend devolvió el comprobante existente sin
   * volver a llamar a SUNAT — no es un error, es la idempotencia funcionando.
   */
  const anunciarResultado = (resultado: { estado: string; serie?: string; correlativo?: string; yaEmitido?: boolean }) => {
    const numero = resultado.serie ? `${resultado.serie}-${resultado.correlativo}` : "";
    const { label } = estiloDeEstado(resultado.estado);
    if (resultado.yaEmitido) {
      toast.info(`${numero} ya estaba emitido`, { description: `Estado ante SUNAT: ${label}. No se reenvió.` });
      return;
    }
    if (resultado.estado === "ACEPTADO" || resultado.estado === "ACEPTADO_CON_OBS") {
      toast.success(`${numero} ${label.toLowerCase()}`, { description: "SUNAT devolvió el CDR y quedó archivado." });
      return;
    }
    toast.warning(`${numero} · ${label}`, { description: "Abre el detalle para ver la respuesta de SUNAT." });
  };

  const emision = useMutation({
    mutationFn: (venta: VentaSinCpe) =>
      // El Idempotency-Key ata este clic a un único envío: si la respuesta se
      // pierde y el usuario reintenta, el backend reconoce el mismo intento.
      emitirComprobante(venta.id_venta, `venta-${venta.id_venta}-${Date.now()}`),
    onSuccess: (resultado) => {
      anunciarResultado(resultado);
      setPorEmitir(null);
      refrescar();
    },
    onError: (error) => {
      const { code, message } = parseErrorCpe(error);
      toast.error(message, { description: code });
      setPorEmitir(null);
      refrescar();
    },
  });

  const reintento = useMutation({
    mutationFn: (cpe: Comprobante) => reintentarComprobante(cpe.id_cpe),
    onSuccess: (resultado) => {
      anunciarResultado(resultado);
      setPorReintentar(null);
      refrescar();
    },
    onError: (error) => {
      const { code, message } = parseErrorCpe(error);
      toast.error(message, { description: code });
      setPorReintentar(null);
      refrescar();
    },
  });

  const abrirDetalle = (cpe: Comprobante) => {
    setDetalle(cpe);
    setDetalleAbierto(true);
  };

  const camposCpe: FieldDef<Comprobante>[] = [
    {
      key: "serie",
      label: "Comprobante",
      priority: "primary",
      render: (_v, item) => (
        <div className="flex items-center gap-2">
          <span className="num font-semibold">{item.serie}-{item.correlativo}</span>
          <Badge variant="outline" className="text-[10px]">
            {item.tipo_doc === "01" ? "Factura" : "Boleta"}
          </Badge>
        </div>
      ),
    },
    {
      key: "nombre_cliente",
      label: "Cliente",
      priority: "secondary",
      semantic: "subtitle",
      render: (_v, item) => (
        <span className="truncate">
          {item.nombre_cliente || "—"}
          {item.num_doc_cliente && <span className="num text-muted-foreground"> · {item.num_doc_cliente}</span>}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado SUNAT",
      priority: "secondary",
      semantic: "badge",
      render: (value) => <EstadoSunatBadge estado={String(value)} />,
    },
    {
      key: "mto_imp_venta",
      label: "Total",
      priority: "secondary",
      semantic: "number",
      format: (value) => soles(value),
    },
    {
      key: "fecha_emision",
      label: "Emisión",
      priority: "meta",
      semantic: "date",
      format: (value) => (value ? String(value).slice(0, 10) : "—"),
    },
    {
      key: "sunat_response_code",
      label: "Código",
      priority: "meta",
      semantic: "code",
      format: (value) => (value ? String(value) : "—"),
    },
  ];

  const accionesCpe: RecordAction[] = [
    {
      id: "ver",
      label: "Ver detalle",
      icon: <Eye className="h-4 w-4" />,
      persistent: true,
      onClick: (item) => abrirDetalle(item as Comprobante),
    },
    {
      id: "reintentar",
      label: "Reintentar envío",
      icon: <RefreshCw className="h-4 w-4" />,
      capability: "ventas.generate",
      // Un RECHAZADO exige corregir y emitir de nuevo; un INCIERTO exige
      // consultar en SUNAT primero. Reenviarlos duplicaría el comprobante.
      hidden: (item: Comprobante) => !ESTADOS_REINTENTABLES.has(item.estado),
      onClick: (item) => setPorReintentar(item as Comprobante),
    },
  ];

  const camposPendientes: FieldDef<VentaSinCpe>[] = [
    {
      key: "num_comprobante",
      label: "Comprobante",
      priority: "primary",
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <span className="num font-semibold">{String(value)}</span>
          <Badge variant="outline" className="text-[10px]">{item.nom_tipocomp}</Badge>
        </div>
      ),
    },
    {
      key: "f_venta",
      label: "Fecha de venta",
      priority: "secondary",
      semantic: "date",
      format: (value) => (value ? String(value).slice(0, 10) : "—"),
    },
    {
      key: "id_venta",
      label: "Venta",
      priority: "meta",
      semantic: "code",
      format: (value) => `#${value}`,
    },
  ];

  const accionesPendientes: RecordAction[] = [
    {
      id: "emitir",
      label: "Emitir a SUNAT",
      icon: <Send className="h-4 w-4" />,
      variant: "primary",
      persistent: true,
      capability: "ventas.generate",
      onClick: (item) => setPorEmitir(item as VentaSinCpe),
    },
  ];

  const totalPaginas = Math.max(1, Math.ceil((lista?.total ?? 0) / PAGINA));
  const numeroPorEmitir = porEmitir?.num_comprobante ?? "";
  const numeroPorReintentar = porReintentar ? `${porReintentar.serie}-${porReintentar.correlativo}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Comprobantes electrónicos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Facturas y boletas enviadas a SUNAT, con su CDR y el historial de cada envío.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FileCheck2}
          title="Aceptados"
          value={(resumen?.aceptados ?? 0) + (resumen?.con_observaciones ?? 0)}
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          hint={resumen?.con_observaciones ? `${resumen.con_observaciones} con observaciones` : undefined}
        />
        <KpiCard
          icon={XCircle}
          title="Rechazados"
          value={resumen?.rechazados ?? 0}
          iconClassName="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          hint={resumen?.con_error ? `${resumen.con_error} con error de envío` : undefined}
        />
        <KpiCard
          icon={HelpCircle}
          title="Sin confirmar"
          value={resumen?.inciertos ?? 0}
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          hint={resumen?.inciertos ? "Requieren consulta manual" : undefined}
        />
        <KpiCard
          icon={Send}
          title="Por emitir"
          value={resumen?.sin_emitir ?? 0}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          hint="Ventas cerradas sin comprobante"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={pestania} onValueChange={(v) => setPestania(v as "emitidos" | "por-emitir")}>
          <TabsList>
            <TabsTrigger value="emitidos">Emitidos</TabsTrigger>
            <TabsTrigger value="por-emitir">
              Por emitir
              {!!pendientes?.length && (
                <Badge variant="secondary" className="ml-2 num text-[10px]">{pendientes.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label="Desde"
            value={desde}
            onChange={(e) => { setDesde(e.target.value); setPagina(1); }}
            className="num h-9 w-[9.5rem]"
          />
          <span className="text-sm text-muted-foreground">a</span>
          <Input
            type="date"
            aria-label="Hasta"
            value={hasta}
            onChange={(e) => { setHasta(e.target.value); setPagina(1); }}
            className="num h-9 w-[9.5rem]"
          />
        </div>
      </div>

      {pestania === "emitidos" ? (
        <AdaptiveCollection<Comprobante>
          items={lista?.items ?? []}
          fields={camposCpe}
          actions={accionesCpe}
          isLoading={isLoading}
          search={busqueda}
          searchPlaceholder="Buscar por serie-correlativo, RUC/DNI o cliente…"
          onSearch={(v) => { setBusqueda(v); setPagina(1); }}
          filters={[
            {
              id: "estado",
              label: "Estado",
              options: ESTADOS_FILTRO,
              value: estado,
              onChange: (v) => { setEstado(v); setPagina(1); },
            },
            {
              id: "tipo",
              label: "Tipo",
              options: TIPOS_FILTRO,
              value: tipoDoc,
              onChange: (v) => { setTipoDoc(v); setPagina(1); },
            },
          ]}
          layout="auto"
          serverSide
          page={pagina}
          totalPages={totalPaginas}
          totalCount={lista?.total ?? 0}
          onPageChange={setPagina}
          getItemId={(c) => c.id_cpe}
          getRhythm={(c) => ({ type: "dot", state: estiloDeEstado(c.estado).state })}
          onRecordClick={abrirDetalle}
          exportFileName="comprobantes-electronicos"
          empty={{
            title: "Sin comprobantes",
            description:
              busqueda || estado || tipoDoc || desde || hasta
                ? "Ningún comprobante coincide con los filtros aplicados."
                : "Todavía no se ha emitido ningún comprobante electrónico desde este módulo.",
          }}
        />
      ) : (
        <AdaptiveCollection<VentaSinCpe>
          items={pendientes ?? []}
          fields={camposPendientes}
          actions={accionesPendientes}
          isLoading={cargandoPendientes}
          layout="auto"
          totalCount={pendientes?.length ?? 0}
          getItemId={(v) => v.id_venta}
          getRhythm={() => ({ type: "dot", state: "info" })}
          empty={{
            title: "Todo emitido",
            description: "Todas las ventas con factura o boleta ya tienen su comprobante electrónico.",
          }}
        />
      )}

      <ComprobanteDetailDrawer
        comprobante={detalle}
        isOpen={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        onReintentar={(cpe) => { setDetalleAbierto(false); setPorReintentar(cpe); }}
        reintentando={reintento.isPending}
      />

      <ConfirmDialog
        open={!!porEmitir}
        onClose={() => !emision.isPending && setPorEmitir(null)}
        onConfirm={() => porEmitir && emision.mutate(porEmitir)}
        title={`¿Emitir ${numeroPorEmitir} ante SUNAT?`}
        description={
          <>
            Se firmará y enviará el comprobante de la venta{" "}
            <span className="num font-medium">#{porEmitir?.id_venta}</span>. La respuesta de SUNAT
            puede tardar; el documento queda registrado aunque el envío falle, y volver a emitir
            esta venta no generará un comprobante duplicado.
          </>
        }
        confirmLabel="Emitir"
        isPending={emision.isPending}
      />

      <ConfirmDialog
        open={!!porReintentar}
        onClose={() => !reintento.isPending && setPorReintentar(null)}
        onConfirm={() => porReintentar && reintento.mutate(porReintentar)}
        title={`¿Reintentar el envío de ${numeroPorReintentar}?`}
        description={
          <>
            Se reenviará el mismo comprobante a SUNAT conservando su serie y correlativo. Solo se
            permite porque el envío anterior no llegó a confirmarse como recibido.
          </>
        }
        confirmLabel="Reintentar"
        isPending={reintento.isPending}
      />

      {!puedeEmitir && (
        <p className="text-xs text-muted-foreground">
          Tu rol permite consultar los comprobantes, pero no emitirlos ante SUNAT.
        </p>
      )}
    </div>
  );
}
