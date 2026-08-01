import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VariantPicker, type VariantResolved } from "@/components/shared/VariantPicker";

import { getProductosIngreso, getProductosSalida } from "../api/warehouseNotes";
import type { NoteKind, NoteFormItem, NotaProducto } from "../types";

const SIN_VARIANTE: VariantResolved = { id_sku: null, label: null, stock: null, ready: true };

interface ProductPickerPanelProps {
  tipo: NoteKind;
  /** Almacén origen (salida) o de referencia (ingreso, opcional). */
  almacen: string;
  items: NoteFormItem[];
  onAdd: (item: NoteFormItem) => void;
  disabled?: boolean;
}

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function ProductPickerPanel({ tipo, almacen, items, onAdd, disabled }: ProductPickerPanelProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [qtyByProduct, setQtyByProduct] = useState<Record<number, string>>({});
  const [variantByProduct, setVariantByProduct] = useState<Record<number, VariantResolved>>({});
  const idAlmacen = Number(almacen) || undefined;

  const { data: productos = [], isFetching } = useQuery<NotaProducto[]>({
    queryKey: ["nota-almacen-productos", tipo, almacen, debouncedSearch],
    queryFn: () =>
      tipo === "salida"
        ? getProductosSalida({ descripcion: debouncedSearch, almacen })
        // Sin almacén origen, "0" le pide al backend el catálogo completo en vez de
        // filtrar por stock en el almacén 1 (su default cuando no se manda el parámetro).
        : getProductosIngreso({ descripcion: debouncedSearch, almacen: almacen || "0" }),
    enabled: !disabled,
  });

  const qtyAlreadyInCart = (uniqueKey: string) =>
    items.filter((i) => i.uniqueKey === uniqueKey).reduce((sum, i) => sum + i.cantidad, 0);

  const isOverStock = (producto: NotaProducto, cantidad: number) => {
    if (tipo !== "salida") return false;
    const stockDisponible = producto.stock ?? 0;
    const yaEnCarrito = qtyAlreadyInCart(`PROD-${producto.codigo}`);
    return yaEnCarrito + cantidad > stockDisponible;
  };

  const handleAdd = (producto: NotaProducto) => {
    const cantidad = Number(qtyByProduct[producto.codigo] ?? "1");
    if (!cantidad || cantidad <= 0) return;
    if (isOverStock(producto, cantidad)) return;

    const variante = variantByProduct[producto.codigo] ?? SIN_VARIANTE;
    if (!variante.ready) return;

    onAdd({
      uniqueKey: `PROD-${producto.codigo}-${variante.id_sku ?? "base"}`,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      marca: producto.marca,
      stock: variante.stock ?? producto.stock ?? 0,
      cantidad,
      id_tonalidad: null,
      id_talla: null,
      id_sku: variante.id_sku,
      nombre_tonalidad: null,
      nombre_talla: null,
      sku_label: variante.label,
      costo: null,
    });

    setQtyByProduct((prev) => ({ ...prev, [producto.codigo]: "1" }));
  };

  const emptyMessage = useMemo(() => {
    if (disabled) return "Selecciona un almacén de origen para buscar productos.";
    if (isFetching) return "Buscando…";
    return search ? `Sin resultados para "${search}"` : "Escribe para buscar productos.";
  }, [disabled, isFetching, search]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descripción, código o marca…"
          disabled={disabled}
          className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        {isFetching && <Spinner size="xs" />}
      </div>

      <div className="max-h-72 overflow-y-auto px-3 pb-3">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Package className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {productos.map((producto) => {
              const cantidad = Number(qtyByProduct[producto.codigo] ?? "1") || 0;
              const overStock = isOverStock(producto, cantidad);
              const variante = variantByProduct[producto.codigo] ?? SIN_VARIANTE;
              return (
                <div key={producto.codigo} className="flex flex-col gap-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{producto.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {producto.marca}
                        {producto.stock !== undefined && ` · Stock: ${producto.stock}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={tipo === "salida" ? producto.stock : undefined}
                          value={qtyByProduct[producto.codigo] ?? "1"}
                          onChange={(e) => setQtyByProduct((prev) => ({ ...prev, [producto.codigo]: e.target.value }))}
                          className="h-8 w-16 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1"
                          disabled={!cantidad || overStock || !variante.ready}
                          onClick={() => handleAdd(producto)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar
                        </Button>
                      </div>
                      {overStock && <span className="text-xs text-destructive">Stock insuficiente</span>}
                    </div>
                  </div>
                  <VariantPicker
                    idProducto={producto.codigo}
                    idAlmacen={idAlmacen}
                    onResolved={(r) => setVariantByProduct((prev) => ({ ...prev, [producto.codigo]: r }))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
