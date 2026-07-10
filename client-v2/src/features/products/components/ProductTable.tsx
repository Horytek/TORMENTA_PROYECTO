import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Product } from "../types";
import { Edit, Trash2, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Barcode from "@/components/ui/Barcode";
import { cn } from "@/lib/utils";

import { useUserStore } from "@/store/useUserStore";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewVariants: (product: Product) => void;
  isLoading: boolean;
  searchTerm: string;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onViewVariants,
  isLoading,
  searchTerm,
}: ProductTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase().trim();
    return products.filter(
      (p) =>
        (p.descripcion || "").toLowerCase().includes(term) ||
        (p.cod_barras || "").toLowerCase().includes(term) ||
        (p.id_producto !== undefined ? p.id_producto.toString() : "").includes(term)
    );
  }, [products, searchTerm]);

  const rowVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const downloadBarcode = (product: Product) => {
    const svg = document.querySelector(`#barcode-${product.id_producto}`);
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const dataUri = "data:image/svg+xml;base64," + btoa(source);

    const a = document.createElement("a");
    a.href = dataUri;
    a.download = `${product.descripcion}-barcode.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const capabilities = useUserStore((state) => state.capabilities);
  const user = useUserStore((state) => state.user);

  const hasEditPermission = user?.roleId === 10 || capabilities.has("productos.edit") || capabilities.has("*");
  const hasDeletePermission = user?.roleId === 10 || capabilities.has("productos.delete") || capabilities.has("*");

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <Info className="mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">No se encontraron productos</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {searchTerm
            ? "Ningún producto coincide con el término de búsqueda ingresado."
            : "No hay productos registrados en el inventario actual."}
        </p>
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className="relative max-h-[65vh] overflow-y-auto rounded-lg border border-border bg-card"
    >
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md">
            <tr className="border-b border-border">
              <th scope="col" className="w-[35%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </th>
              <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Marca / Sub-Línea
              </th>
              <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Und. Med.
              </th>
              <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Precio
              </th>
              <th scope="col" className="w-[15%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cód. Barras
              </th>
              <th scope="col" className="w-[10%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th scope="col" className="w-[13%] px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="relative" style={{ height: `${totalSize}px` }}>
            {virtualItems.map((virtualRow) => {
              const product = filteredProducts[virtualRow.index];
              const isInactive = product.estado_producto === 0;

              return (
                <tr
                  key={product.id_producto}
                  className={cn(
                    "absolute left-0 flex w-full items-center border-b border-border transition-colors hover:bg-muted/50",
                    isInactive && "opacity-60"
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="w-[35%] truncate px-6 py-2 text-sm font-medium text-foreground">
                    <div className="flex flex-col truncate">
                      <span className="truncate">{product.descripcion}</span>
                      <span className="num mt-0.5 text-[10px] text-muted-foreground">ID: {product.id_producto}</span>
                    </div>
                  </td>

                  <td className="w-[15%] px-4 py-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="w-fit font-medium">
                        {product.nom_marca || "Genérico"}
                      </Badge>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {product.nom_subcat || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="w-[10%] px-4 py-2 text-sm text-muted-foreground">
                    {product.undm || "NIU"}
                  </td>

                  <td className="num w-[12%] px-4 py-2 text-sm font-semibold text-foreground">
                    S/ {Number(product.precio || 0).toFixed(2)}
                  </td>

                  <td className="w-[15%] px-4 py-2 text-center text-xs">
                    {!product.cod_barras || product.cod_barras === "-" ? (
                      <span className="num text-muted-foreground">-</span>
                    ) : (
                      <div
                        className="flex cursor-pointer justify-center transition-opacity hover:opacity-70"
                        onClick={() => downloadBarcode(product)}
                        title="Click para descargar código de barras"
                      >
                        <Barcode
                          id={`barcode-${product.id_producto}`}
                          value={product.cod_barras}
                          className="bg-transparent"
                          options={{ width: 0.9, height: 24, fontSize: 8, displayValue: true }}
                        />
                      </div>
                    )}
                  </td>

                  <td className="w-[10%] px-4 py-2 text-center">
                    <Badge variant={isInactive ? "destructive" : "success"}>
                      {isInactive ? "Inactivo" : "Activo"}
                    </Badge>
                  </td>

                  <td className="w-[13%] px-6 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewVariants(product)}
                        className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-brand"
                        title="Ver variantes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(product)}
                        disabled={!hasEditPermission}
                        className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                        title="Editar producto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(product)}
                        disabled={!hasDeletePermission}
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
