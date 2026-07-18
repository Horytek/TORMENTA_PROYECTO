import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  FileText,
  PackageSearch,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  getKardexInventarioProductos as getKardexProductos,
  getKardexInventarioAlmacenes as getKardexAlmacenes,
  getKardexInventarioDetalle as getKardexDetalle,
  getKardexInventarioDetalleAnteriores as getKardexDetalleAnteriores,
  type KardexInventarioDetalleMovimiento as KardexDetalleMovimiento,
  type KardexInventarioStockAnterior as KardexStockAnterior,
} from "@/features/kardex-inventario/api/kardexInventario";

/** Convierte "YYYY-MM-DD" a string sin tirar por zona horaria. */
function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatNum(v: unknown, digits = 2): string {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("es-PE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

interface KardexDetalleProps {
  /** Filtro de almacén heredado de la página padre (opcional). */
  almacenFiltro?: string;
}

export function KardexDetalle({ almacenFiltro }: KardexDetalleProps) {
  const today = useMemo(() => new Date(), []);
  const fifteenAgo = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 14);
    return d;
  }, [today]);

  const [fechaInicio, setFechaInicio] = useState<string>(toInputDate(fifteenAgo));
  const [fechaFin, setFechaFin] = useState<string>(toInputDate(today));
  const [idProducto, setIdProducto] = useState<string>("");
  const [idAlmacen, setIdAlmacen] = useState<string>(almacenFiltro ?? "%");

  // Sync del almacén cuando el padre cambia
  useEffect(() => {
    setIdAlmacen(almacenFiltro ?? "%");
  }, [almacenFiltro]);

  /* Catálogo ligero para el select de producto (máx 500). */
  const { data: productos = [] } = useQuery({
    queryKey: ["kardex-productos-catalogo"],
    queryFn: () => getKardexProductos({ almacen: idAlmacen === "%" ? undefined : idAlmacen, stock: "con_stock" }),
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ["kardex-almacenes"],
    queryFn: getKardexAlmacenes,
  });

  /* Stock anterior al rango (idAlmacen es % o número). */
  const anterioresEnabled = !!idProducto && !!fechaInicio;
  const { data: anteriores } = useQuery<KardexStockAnterior | null>({
    queryKey: ["kardex-anteriores", fechaInicio, idProducto, idAlmacen],
    queryFn: () =>
      getKardexDetalleAnteriores(fechaInicio, Number(idProducto), idAlmacen as number | "%"),
    enabled: anterioresEnabled,
  });

  /* Detalle del rango. */
  const detalleEnabled = !!idProducto && !!fechaInicio && !!fechaFin;
  const {
    data: movimientos = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery<KardexDetalleMovimiento[]>({
    queryKey: ["kardex-detalle", fechaInicio, fechaFin, idProducto, idAlmacen],
    queryFn: () =>
      getKardexDetalle({
        fechaInicio,
        fechaFin,
        idProducto: Number(idProducto),
        idAlmacen: idAlmacen as number | "%",
      }),
    enabled: detalleEnabled,
  });

  /* Totales derivados. */
  const totales = useMemo(() => {
    const totalEntra = movimientos.reduce((a, m) => a + Number(m.entra ?? 0), 0);
    const totalSale = movimientos.reduce((a, m) => a + Number(m.sale ?? 0), 0);
    const stockIni =
      Number(anteriores?.entra ?? 0) - Number(anteriores?.sale ?? 0);
    const stockFin =
      movimientos.length > 0
        ? Number(movimientos[movimientos.length - 1].stock ?? 0)
        : stockIni;
    return { totalEntra, totalSale, stockIni, stockFin };
  }, [movimientos, anteriores]);

  const productoSel = useMemo(
    () => productos.find((p) => String(p.codigo) === idProducto),
    [productos, idProducto]
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Fecha inicio
          </label>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Fecha fin
          </label>
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div className="space-y-1 lg:col-span-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Producto
          </label>
          <Select value={idProducto || "__none__"} onValueChange={(v) => setIdProducto(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar producto…" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__none__">Seleccionar producto…</SelectItem>
              {productos.map((p) => (
                <SelectItem key={p.codigo} value={String(p.codigo)}>
                  <span className="num mr-2 text-xs text-muted-foreground">{p.codigo}</span>
                  <span className="truncate">{p.descripcion}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Almacén
          </label>
          <Select value={idAlmacen} onValueChange={setIdAlmacen}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="%">Todos los almacenes</SelectItem>
              {almacenes.map((a) => (
                <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                  {a.nom_almacen}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            onClick={() => refetch()}
            disabled={!detalleEnabled || isLoading || isFetching}
            className="w-full"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Buscar
          </Button>
        </div>
      </div>

      {/* Resumen */}
      {productoSel && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResumenCard label="Stock inicial" value={formatNum(totales.stockIni, 0)} tone="muted" />
          <ResumenCard label="Entradas" value={formatNum(totales.totalEntra, 0)} tone="success" Icon={ArrowDownToLine} />
          <ResumenCard label="Salidas" value={formatNum(totales.totalSale, 0)} tone="danger" Icon={ArrowUpFromLine} />
          <ResumenCard label="Stock final" value={formatNum(totales.stockFin, 0)} tone="brand" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">No se pudo cargar el detalle.</p>
            <p className="text-xs opacity-80">
              Verifica que el producto exista y que el rango de fechas sea válido.
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border border-border bg-card">
        {!idProducto ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">Selecciona un producto</h3>
            <p className="text-sm text-muted-foreground">
              Elige un producto y un rango de fechas para ver el detalle de movimientos.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : movimientos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">Sin movimientos</h3>
            <p className="text-sm text-muted-foreground">
              No hay movimientos en el rango de fechas seleccionado.
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Fecha</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead className="text-center">Entra</TableHead>
                  <TableHead className="text-center">Sale</TableHead>
                  <TableHead className="pr-4 text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anteriores && (
                  <TableRow className="bg-muted/40">
                    <TableCell className="pl-4 text-xs italic text-muted-foreground">
                      Saldo anterior
                    </TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">
                      {anteriores.numero} movimientos previos
                    </TableCell>
                    <TableCell className="text-center num text-xs tabular-nums">
                      {formatNum(anteriores.entra, 0)}
                    </TableCell>
                    <TableCell className="text-center num text-xs tabular-nums">
                      {formatNum(anteriores.sale, 0)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Badge variant="secondary" className="num tabular-nums">
                        {formatNum(totales.stockIni, 0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )}

                {movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="num pl-4 text-xs">{m.fecha}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="num text-xs font-medium">{m.documento}</span>
                        {m.glosa && (
                          <span className="line-clamp-1 text-[11px] text-muted-foreground">
                            {m.glosa}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{m.nombre}</span>
                        {(m.almacen_origen || m.almacen_destino) && (
                          <span className="text-[11px] text-muted-foreground">
                            {m.almacen_origen && m.almacen_destino
                              ? `${m.almacen_origen} → ${m.almacen_destino}`
                              : m.almacen_origen || m.almacen_destino}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {Number(m.entra) > 0 ? (
                        <Badge variant="success" className="num tabular-nums">
                          +{formatNum(m.entra, 0)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {Number(m.sale) > 0 ? (
                        <Badge variant="destructive" className="num tabular-nums">
                          -{formatNum(m.sale, 0)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Badge variant="secondary" className="num tabular-nums">
                        {formatNum(m.stock, 0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Subcomponente
 * ────────────────────────────────────────────────────────── */

interface ResumenCardProps {
  label: string;
  value: string;
  tone: "muted" | "success" | "danger" | "brand";
  Icon?: React.ComponentType<{ className?: string }>;
}

function ResumenCard({ label, value, tone, Icon }: ResumenCardProps) {
  const toneClass = {
    muted: "bg-muted text-foreground",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    brand: "bg-brand/10 text-brand",
  }[tone];

  return (
    <div className={cn("rounded-lg border border-border p-3", toneClass)}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide opacity-80">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="num mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}