import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { TrendingUp, Coins, TriangleAlert, ArrowRight, Package } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/shared/PageLoader";
import { getMargen } from "../api/costos";
import { MargenBarChart } from "../components/MargenBarChart";
import { BcgMatrix } from "../components/BcgMatrix";
import type { MargenProducto } from "../types";

const soles = (valor: number | null) =>
  valor == null
    ? "—"
    : `S/ ${valor.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const numero = (valor: number) => valor.toLocaleString("es-PE");

/** Primer día del mes en curso, que es el periodo que el dueño mira por defecto. */
const inicioDeMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const hoy = () => new Date().toISOString().slice(0, 10);

/**
 * Margen del periodo: cuánto entró, cuánto costó, y cuánto queda por prenda.
 *
 * La honestidad del número es el punto: solo entran las líneas cuyo costo
 * quedó fotografiado al vender. Lo que se vendió sin costo conocido se informa
 * aparte con un enlace a la carga de costos, en vez de contarse como ganancia
 * pura — que es lo que haría cualquier resta ingenua de ingreso menos cero.
 */
export default function MargenPage() {
  const [desde, setDesde] = useQueryState("desde", parseAsString.withDefault(inicioDeMes()));
  const [hasta, setHasta] = useQueryState("hasta", parseAsString.withDefault(hoy()));

  const { data, isLoading } = useQuery({
    queryKey: ["costos", "margen", desde, hasta],
    queryFn: () => getMargen(desde, hasta),
  });

  const total = data?.total;
  const productos = data?.porProducto ?? [];

  // Qué parte del ingreso del periodo tiene costo conocido. Si es baja, el
  // margen de arriba describe solo un pedazo del negocio y hay que decirlo.
  const confiabilidad = useMemo(() => {
    if (!total || total.ingresoTotal <= 0) return 100;
    return Math.round((total.ingresoConCosto / total.ingresoTotal) * 1000) / 10;
  }, [total]);

  if (isLoading) return <PageLoader />;

  const sinVentas = !total || total.lineas === 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Margen</h1>
          <p className="text-sm text-muted-foreground">
            Cuánto ganas de verdad, prenda por prenda.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Desde</span>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="num h-9 w-36" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hasta</span>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="num h-9 w-36" />
          </label>
        </div>
      </header>

      {sinVentas ? (
        <div className="flex gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          <span>No hay ventas en este periodo. Ajusta las fechas para ver otro rango.</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Ingreso" valor={soles(total.ingresoTotal)} />
            <Kpi label="Costo de lo vendido" valor={soles(total.costo)} />
            <Kpi
              label="Margen"
              valor={soles(total.margen)}
              destacado
              icon={TrendingUp}
            />
            <Kpi label="Margen %" valor={total.porcentaje != null ? `${total.porcentaje}%` : "—"} />
          </div>

          {/* Si parte del ingreso no tiene costo, decirlo antes de que el dueño
              tome una decisión con un número que describe medio negocio. */}
          {total.lineasSinCosto > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="min-w-0 flex-1">
                {total.lineasSinCosto} de {total.lineas} líneas se vendieron sin costo conocido. El margen
                de arriba cubre {confiabilidad}% de tu ingreso — el resto no se puede calcular todavía.
              </span>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/products/costos">
                  <Coins className="h-3.5 w-3.5" />
                  Cargar costos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <MargenBarChart productos={productos} />
            <BcgMatrix productos={productos} />
          </div>

          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ingreso</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Por prenda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((p) => (
                    <FilaMargen key={p.id_producto} producto={p} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

interface KpiProps {
  label: string;
  valor: string;
  destacado?: boolean;
  icon?: typeof TrendingUp;
}

function Kpi({ label, valor, destacado, icon: Icon }: KpiProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-brand" strokeWidth={2} />}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <p className={`num mt-1 font-bold tracking-tight ${destacado ? "text-3xl text-brand" : "text-2xl"}`}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

function FilaMargen({ producto }: { producto: MargenProducto }) {
  const perdida = producto.margen < 0;

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{producto.descripcion.trim()}</p>
          <div className="flex items-center gap-2">
            {producto.marca && <span className="truncate text-xs text-muted-foreground">{producto.marca}</span>}
            {/* Parcial: parte de lo vendido no tenía costo. El número de la fila
                es real, pero describe menos unidades de las que se vendieron. */}
            {!producto.completo && (
              <Badge variant="outline" className="num text-[10px] text-amber-700 dark:text-amber-400">
                {numero(producto.unidadesConCosto)} de {numero(producto.unidades)} con costo
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="num text-right">{numero(producto.unidades)}</TableCell>
      <TableCell className="num text-right text-muted-foreground">{soles(producto.ingreso)}</TableCell>
      <TableCell className="num text-right text-muted-foreground">{soles(producto.costo)}</TableCell>
      <TableCell className="num text-right">
        <span className={`font-semibold ${perdida ? "text-rose-600 dark:text-rose-400" : ""}`}>
          {soles(producto.margen)}
        </span>
        {producto.porcentaje != null && (
          <span className="ml-1.5 text-xs text-muted-foreground">{producto.porcentaje}%</span>
        )}
      </TableCell>
      <TableCell className="num text-right">
        <span className={`font-semibold ${perdida ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {soles(producto.margenPorUnidad)}
        </span>
      </TableCell>
    </TableRow>
  );
}
