import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { getProductos } from "../api/kardex";
import type { LoteItemInput } from "../types";

interface LoteProductPickerProps {
  onAdd: (item: LoteItemInput & { descripcion: string; marca: string }) => void;
}

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function LoteProductPicker({ onAdd }: LoteProductPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [qtyByProduct, setQtyByProduct] = useState<Record<number, string>>({});

  const { data: productos = [], isFetching } = useQuery({
    queryKey: ["lote-productos", debouncedSearch],
    queryFn: () => getProductos({ descripcion: debouncedSearch }),
  });

  const handleAdd = (producto: { codigo: number; descripcion: string; marca: string }) => {
    const cantidad = Number(qtyByProduct[producto.codigo] ?? "1");
    if (!cantidad || cantidad <= 0) return;

    onAdd({
      id_producto: producto.codigo,
      cantidad,
      descripcion: producto.descripcion,
      marca: producto.marca,
    });

    setQtyByProduct((prev) => ({ ...prev, [producto.codigo]: "1" }));
  };

  const emptyMessage = useMemo(() => {
    if (isFetching) return "Buscando…";
    return search ? `Sin resultados para "${search}"` : "Escribe para buscar productos.";
  }, [isFetching, search]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto por descripción…"
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
            {productos.map((producto) => (
              <div key={producto.codigo} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{producto.descripcion}</p>
                  <p className="truncate text-xs text-muted-foreground">{producto.marca}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={qtyByProduct[producto.codigo] ?? "1"}
                    onChange={(e) => setQtyByProduct((prev) => ({ ...prev, [producto.codigo]: e.target.value }))}
                    className="h-8 w-16 text-sm"
                  />
                  <Button type="button" size="sm" className="h-8 gap-1" onClick={() => handleAdd(producto)}>
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
