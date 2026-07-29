import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VariantPicker, type VariantResolved } from "@/components/shared/VariantPicker";
import { getProductosIngreso } from "@/features/warehouse-notes/api/warehouseNotes";
import type { NotaProducto } from "@/features/warehouse-notes/types";
import type { PurchaseOrderFormItem } from "../types";

const SIN_VARIANTE: VariantResolved = { id_sku: null, label: null, stock: null, ready: true };

interface PurchaseProductPickerProps {
  onAdd: (item: PurchaseOrderFormItem) => void;
}

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function PurchaseProductPicker({ onAdd }: PurchaseProductPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [qtyByProduct, setQtyByProduct] = useState<Record<number, string>>({});
  const [costByProduct, setCostByProduct] = useState<Record<number, string>>({});
  const [variantByProduct, setVariantByProduct] = useState<Record<number, VariantResolved>>({});

  // "0" le pide al backend el catálogo completo sin filtrar por stock de un almacén.
  const { data: productos = [], isFetching } = useQuery<NotaProducto[]>({
    queryKey: ["compras-productos", debouncedSearch],
    queryFn: () => getProductosIngreso({ descripcion: debouncedSearch, almacen: "0" }),
  });

  const handleAdd = (producto: NotaProducto) => {
    const cantidad = Number(qtyByProduct[producto.codigo] ?? "1");
    const precio_unitario = Number(costByProduct[producto.codigo] ?? "0");
    if (!cantidad || cantidad <= 0 || !precio_unitario || precio_unitario <= 0) return;

    const variante = variantByProduct[producto.codigo] ?? SIN_VARIANTE;
    if (!variante.ready) return;

    onAdd({
      uniqueKey: `PROD-${producto.codigo}-${variante.id_sku ?? "base"}`,
      id_producto: producto.codigo,
      descripcion: producto.descripcion,
      marca: producto.marca,
      cantidad,
      precio_unitario,
      id_tonalidad: null,
      id_talla: null,
      id_sku: variante.id_sku,
    });

    setQtyByProduct((prev) => ({ ...prev, [producto.codigo]: "1" }));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descripción, código o marca…"
          className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        {isFetching && <Spinner size="xs" />}
      </div>

      <div className="max-h-72 overflow-y-auto px-3 pb-3">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Package className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">
              {isFetching ? "Buscando…" : search ? `Sin resultados para "${search}"` : "Escribe para buscar productos."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {productos.map((producto) => {
              const cantidad = Number(qtyByProduct[producto.codigo] ?? "1") || 0;
              const costo = Number(costByProduct[producto.codigo] ?? "0") || 0;
              const variante = variantByProduct[producto.codigo] ?? SIN_VARIANTE;
              return (
                <div key={producto.codigo} className="flex flex-col gap-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{producto.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">{producto.marca}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        value={qtyByProduct[producto.codigo] ?? "1"}
                        onChange={(e) => setQtyByProduct((prev) => ({ ...prev, [producto.codigo]: e.target.value }))}
                        className="h-8 w-14 text-sm"
                        title="Cantidad"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Costo"
                        value={costByProduct[producto.codigo] ?? ""}
                        onChange={(e) => setCostByProduct((prev) => ({ ...prev, [producto.codigo]: e.target.value }))}
                        className="h-8 w-20 text-sm"
                        title="Costo unitario"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-1"
                        disabled={!cantidad || !costo || !variante.ready}
                        onClick={() => handleAdd(producto)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <VariantPicker
                    idProducto={producto.codigo}
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
