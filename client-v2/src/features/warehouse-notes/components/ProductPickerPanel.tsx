import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Plus, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import api from "@/api/axios";

import { getProductosIngreso, getProductosSalida } from "../api/warehouseNotes";
import type { NoteKind, NoteFormItem, NotaProducto } from "../types";

interface VariantOption {
  id_sku: number;
  nombre_sku: string;
  attributes_json: string | null;
  stock: number;
}

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

function formatAttributes(json: string | null): string {
  if (!json) return "";
  try {
    const parsed = JSON.parse(json) as Record<string, string>;
    return Object.values(parsed).join(" / ");
  } catch {
    return "";
  }
}

export function ProductPickerPanel({ tipo, almacen, items, onAdd, disabled }: ProductPickerPanelProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [expandedCodigo, setExpandedCodigo] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [qty, setQty] = useState("1");

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

  const { data: variants = [], isFetching: loadingVariants } = useQuery<VariantOption[]>({
    queryKey: ["nota-almacen-variantes", expandedCodigo, almacen],
    queryFn: async () => {
      const res = await api.get(`/productos/${expandedCodigo}/variants`, {
        params: almacen ? { almacen, includeZero: tipo === "ingreso" ? "true" : "false" } : { includeZero: "true" },
      });
      const data = res.data;
      return data?.data ?? (Array.isArray(data) ? data : []);
    },
    enabled: expandedCodigo !== null,
  });

  const toggleExpanded = (codigo: number) => {
    setExpandedCodigo((prev) => (prev === codigo ? null : codigo));
    setSelectedVariant(null);
    setQty("1");
  };

  const qtyAlreadyInCart = (uniqueKey: string) =>
    items.filter((i) => i.uniqueKey === uniqueKey).reduce((sum, i) => sum + i.cantidad, 0);

  const handleAdd = (producto: NotaProducto) => {
    const cantidad = Number(qty);
    if (!cantidad || cantidad <= 0) return;

    const variant = selectedVariant;
    const uniqueKey = variant ? `SKU-${variant.id_sku}` : `PROD-${producto.codigo}`;
    const stockDisponible = variant ? variant.stock : producto.stock ?? 0;

    if (tipo === "salida") {
      const yaEnCarrito = qtyAlreadyInCart(uniqueKey);
      if (yaEnCarrito + cantidad > stockDisponible) {
        return; // el botón queda deshabilitado en este caso, ver isOverStock
      }
    }

    onAdd({
      uniqueKey,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      marca: producto.marca,
      stock: stockDisponible,
      cantidad,
      id_tonalidad: null,
      id_talla: null,
      id_sku: variant?.id_sku ?? null,
      nombre_tonalidad: null,
      nombre_talla: null,
      sku_label: variant?.nombre_sku ?? formatAttributes(variant?.attributes_json ?? null) ?? null,
    });

    setExpandedCodigo(null);
    setQty("1");
    setSelectedVariant(null);
  };

  const currentUniqueKey = (producto: NotaProducto) =>
    selectedVariant ? `SKU-${selectedVariant.id_sku}` : `PROD-${producto.codigo}`;

  const isOverStock = (producto: NotaProducto) => {
    if (tipo !== "salida") return false;
    const cantidad = Number(qty) || 0;
    const stockDisponible = selectedVariant ? selectedVariant.stock : producto.stock ?? 0;
    const yaEnCarrito = qtyAlreadyInCart(currentUniqueKey(producto));
    return yaEnCarrito + cantidad > stockDisponible;
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
              const isExpanded = expandedCodigo === producto.codigo;
              return (
                <div key={producto.codigo} className="py-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(producto.codigo)}
                    className="flex w-full items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{producto.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {producto.marca}
                        {producto.stock !== undefined && ` · Stock: ${producto.stock}`}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-muted/30 p-2.5">
                      {loadingVariants ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Spinner size="xs" /> Cargando variantes…
                        </div>
                      ) : variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {variants.map((v) => {
                            const label = formatAttributes(v.attributes_json) || v.nombre_sku;
                            const selected = selectedVariant?.id_sku === v.id_sku;
                            const sinStock = tipo === "salida" && v.stock <= 0;
                            return (
                              <button
                                key={v.id_sku}
                                type="button"
                                disabled={sinStock}
                                onClick={() => setSelectedVariant(v)}
                                className={cn(
                                  "cursor-pointer",
                                  sinStock && "cursor-not-allowed opacity-40"
                                )}
                              >
                                <Badge variant={selected ? "default" : "secondary"} className="gap-1 font-normal">
                                  {label} · {v.stock}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Producto sin variantes registradas.</p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          className="h-8 w-20 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1"
                          disabled={
                            (variants.length > 0 && !selectedVariant) || !Number(qty) || isOverStock(producto)
                          }
                          onClick={() => handleAdd(producto)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar
                        </Button>
                        {isOverStock(producto) && (
                          <span className="text-xs text-destructive">Stock insuficiente</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
