import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Search, PackageSearch } from "lucide-react";

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
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { getKardexProductos, getKardexAlmacenes } from "../api/kardex";
import type { KardexProducto, StockFilter } from "../types";

const money = (v: unknown) => `S/ ${Number(v ?? 0).toFixed(2)}`;

export default function KardexPage() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [almacen, setAlmacen] = useQueryState("alm", parseAsString.withDefault(""));
  const [stock, setStock] = useQueryState("stock", parseAsString.withDefault("todos"));

  const { data: almacenes = [] } = useQuery({
    queryKey: ["kardex-almacenes"],
    queryFn: getKardexAlmacenes,
  });

  const { data: productos = [], isLoading } = useQuery<KardexProducto[]>({
    queryKey: ["kardex", { almacen, stock }],
    queryFn: () => getKardexProductos({ almacen, stock: stock as StockFilter }),
  });

  // Búsqueda por texto en el cliente (sobre el máximo de 500 filas del backend).
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return productos;
    return productos.filter(
      (p) =>
        p.descripcion.toLowerCase().includes(term) ||
        (p.marca ?? "").toLowerCase().includes(term) ||
        String(p.codigo).includes(term) ||
        (p.cod_barras ?? "").toLowerCase().includes(term)
    );
  }, [productos, search]);

  const totalStock = useMemo(
    () => filtered.reduce((acc, p) => acc + Number(p.stock ?? 0), 0),
    [filtered]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Existencias · Kárdex</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stock por producto{" "}
          <span className="num">
            ({filtered.length} productos · {totalStock.toLocaleString("es-PE")} unidades)
          </span>
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, marca, código o barras…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={almacen || "all"} onValueChange={(v) => setAlmacen(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los almacenes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los almacenes</SelectItem>
            {almacenes.map((a) => (
              <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                {a.nom_almacen}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stock} onValueChange={(v) => setStock(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo el stock</SelectItem>
            <SelectItem value="con_stock">Con stock</SelectItem>
            <SelectItem value="sin_stock">Sin stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-11 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">Sin resultados</h3>
            <p className="text-sm text-muted-foreground">
              Ajusta los filtros o el término de búsqueda.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-center">U.M.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="pr-4 text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const sinStock = Number(p.stock ?? 0) <= 0;
                return (
                  <TableRow key={p.codigo}>
                    <TableCell className="num pl-4 text-xs text-muted-foreground">{p.codigo}</TableCell>
                    <TableCell className="max-w-[22rem] truncate text-sm font-medium text-foreground">
                      {p.descripcion}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.marca || "—"}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{p.um || "NIU"}</TableCell>
                    <TableCell className="num text-right text-sm text-foreground">{money(p.precio)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <Badge
                        variant={sinStock ? "destructive" : Number(p.stock) < 10 ? "warning" : "success"}
                        className={cn("num tabular-nums", sinStock && "opacity-90")}
                      >
                        {Number(p.stock ?? 0).toLocaleString("es-PE")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
