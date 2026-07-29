import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Coins, TriangleAlert, Save, Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/SearchInput";
import { PageLoader } from "@/components/shared/PageLoader";
import { Can } from "@/components/shared/Can";
import { getCobertura, getProductosSinCosto, cargarCostosIniciales, parseErrorCosto } from "../api/costos";
import type { ProductoSinCosto } from "../types";

const soles = (valor: number) =>
  `S/ ${valor.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const numero = (valor: number) => valor.toLocaleString("es-PE");

/**
 * Carga inicial de costos.
 *
 * El costo promedio solo se llena cuando entra mercadería, así que un negocio
 * que arranca con stock viejo no tiene ningún costo y el margen sale en cero.
 * Esta pantalla existe para ponerlo al día una vez: se declara el costo por
 * PRODUCTO (todas sus tallas y colores lo heredan) y la lista viene ordenada
 * por unidades en juego, para que cargar los primeros ya sirva de algo.
 */
export default function CostosInicialesPage() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [costos, setCostos] = useState<Record<number, string>>({});

  const { data: cobertura } = useQuery({ queryKey: ["costos", "cobertura"], queryFn: getCobertura });
  const { data: pendientes = [], isLoading } = useQuery({
    queryKey: ["costos", "pendientes"],
    queryFn: () => getProductosSinCosto(200),
  });

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pendientes;
    return pendientes.filter(
      (p) => p.descripcion.toLowerCase().includes(q) || (p.marca ?? "").toLowerCase().includes(q)
    );
  }, [pendientes, busqueda]);

  // Solo se manda lo que el usuario escribió y es un número > 0. Un campo en
  // blanco no es "costo cero": es "todavía no sé", y el backend lo rechazaría.
  const listos = useMemo(
    () =>
      Object.entries(costos)
        .map(([id, valor]) => ({ id_producto: Number(id), costo: Number(valor) }))
        .filter((x) => Number.isFinite(x.costo) && x.costo > 0),
    [costos]
  );

  // Un costo por encima del precio de venta es vender perdiendo: casi siempre
  // es un dígito de más. Se avisa, pero no se bloquea — hay liquidaciones.
  const precios = useMemo(
    () => new Map(pendientes.map((p) => [p.id_producto, p.precio])),
    [pendientes]
  );
  const sospechosos = listos.filter((x) => {
    const precio = precios.get(x.id_producto);
    return precio != null && precio > 0 && x.costo >= precio;
  });

  const guardar = useMutation({
    mutationFn: () => cargarCostosIniciales(listos),
    onSuccess: (resultado) => {
      const n = resultado?.skusActualizados ?? 0;
      const cob = resultado?.cobertura.cobertura ?? 0;
      toast.success(`${n} variante(s) con costo`, { description: `Cobertura del inventario: ${cob}%` });
      setCostos({});
      queryClient.invalidateQueries({ queryKey: ["costos"] });
    },
    onError: (error) => toast.error(parseErrorCosto(error)),
  });

  if (isLoading) return <PageLoader />;

  const pct = cobertura?.cobertura ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Costos iniciales</h1>
        <p className="text-sm text-muted-foreground">
          Declara cuánto te costó el stock que ya tienes. Sin costo no hay margen que mostrar.
        </p>
      </header>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-brand" strokeWidth={2} />
              <span className="text-sm font-semibold">Inventario con costo conocido</span>
            </div>
            <span className="num text-2xl font-bold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <div className="num flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>Valorizado: {soles(cobertura?.valor ?? 0)}</span>
            <span>{numero(cobertura?.unidadesValorizadas ?? 0)} uds con costo</span>
            <span>{numero(cobertura?.unidadesSinCosto ?? 0)} uds sin costo</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={busqueda}
          onChangeValue={setBusqueda}
          placeholder="Buscar producto o marca…"
          className="max-w-xs"
        />
        <Can capability="productos.edit">
          <Button
            onClick={() => guardar.mutate()}
            disabled={listos.length === 0 || guardar.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar {listos.length > 0 ? `(${listos.length})` : ""}
          </Button>
        </Can>
      </div>

      {sospechosos.length > 0 && (
        <div className="flex gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span>
            {sospechosos.length === 1 ? "Un producto tiene" : `${sospechosos.length} productos tienen`} un
            costo igual o mayor a su precio de venta. Revisa que no sobre un dígito — si es una liquidación,
            puedes guardarlo igual.
          </span>
        </div>
      )}

      {pendientes.length === 0 ? (
        <div className="flex gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          <span>Todos tus productos tienen costo. El margen ya se calcula sobre datos reales.</span>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Variantes</TableHead>
                  <TableHead className="text-right">Precio venta</TableHead>
                  <TableHead className="w-40">Costo unitario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((p) => (
                  <FilaProducto
                    key={p.id_producto}
                    producto={p}
                    valor={costos[p.id_producto] ?? ""}
                    onChange={(v) => setCostos((prev) => ({ ...prev, [p.id_producto]: v }))}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

interface FilaProductoProps {
  producto: ProductoSinCosto;
  valor: string;
  onChange: (valor: string) => void;
}

function FilaProducto({ producto, valor, onChange }: FilaProductoProps) {
  const costo = Number(valor);
  const precio = producto.precio;
  const sospechoso = valor !== "" && Number.isFinite(costo) && costo > 0 && precio != null && precio > 0 && costo >= precio;
  const margen = !sospechoso && costo > 0 && precio != null && precio > 0 ? precio - costo : null;

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{producto.descripcion.trim()}</p>
          {producto.marca && <p className="truncate text-xs text-muted-foreground">{producto.marca}</p>}
        </div>
      </TableCell>
      <TableCell className="num text-right font-semibold">{numero(producto.unidades)}</TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className="num text-[10px]">
          {producto.skusSinCosto} de {producto.skus}
        </Badge>
      </TableCell>
      <TableCell className="num text-right text-muted-foreground">
        {precio != null ? soles(precio) : "—"}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className={`num h-9 ${sospechoso ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
        />
        {margen != null && (
          <p className="num mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            Ganas {soles(margen)} por unidad
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
