import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Product } from "../types";
import { Edit, Trash2, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Barcode from "@/components/ui/Barcode";

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
  
  // Filter products based on search term in local memory
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

  // Virtualizer setup for rows
  const rowVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // estimated height of each row in px
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
      <div className="flex flex-col gap-4 w-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950 text-center">
        <Info className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No se encontraron productos</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
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
      className="relative overflow-y-auto max-h-[65vh] border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm"
    >
      <div className="min-w-full inline-block align-middle">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-900 table-fixed">
          <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-zinc-900/90 backdrop-blur-md">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[35%]">
                Descripción
              </th>
              <th scope="col" className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[15%]">
                Marca / Sub-Línea
              </th>
              <th scope="col" className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%]">
                UND. Med.
              </th>
              <th scope="col" className="px-4 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]">
                Precio
              </th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[15%]">
                Cód. Barras
              </th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%]">
                Estado
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[13%]">
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
                  className="absolute left-0 w-full hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors flex items-center border-b border-slate-100 dark:border-zinc-900"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200 truncate w-[35%]">
                    <div className="flex flex-col truncate">
                      <span className="truncate">{product.descripcion}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {product.id_producto}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-2 whitespace-nowrap text-xs w-[15%]">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="w-fit bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 hover:bg-purple-500/10">
                        {product.nom_marca || "Genérico"}
                      </Badge>
                      <span className="text-[10px] text-slate-400 truncate">
                        {product.nom_subcat || "-"}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 w-[10%]">
                    {product.undm || "NIU"}
                  </td>
                  
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300 w-[12%]">
                    S/. {Number(product.precio || 0).toFixed(2)}
                  </td>
                  
                  <td className="px-4 py-2 whitespace-nowrap text-center text-xs w-[15%]">
                    {!product.cod_barras || product.cod_barras === "-" ? (
                      <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                    ) : (
                      <div 
                        className="flex justify-center hover:opacity-75 transition-opacity"
                        onClick={() => downloadBarcode(product)}
                        title="Click para descargar código de barras"
                      >
                        <Barcode
                          value={product.cod_barras}
                          className="bg-transparent"
                          options={{
                            width: 0.9,
                            height: 24,
                            fontSize: 8,
                            displayValue: true,
                          }}
                        />
                      </div>
                    )}
                  </td>
                  
                  <td className="px-4 py-2 whitespace-nowrap text-center w-[10%]">
                    <Badge variant={isInactive ? "destructive" : "success"}>
                      {isInactive ? "Inactivo" : "Activo"}
                    </Badge>
                  </td>
                  
                  <td className="px-6 py-2 whitespace-nowrap text-center text-sm font-medium w-[13%]">
                    <div className="flex items-center justify-center gap-1">
                      {/* View Variants Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewVariants(product)}
                        className="h-8 w-8 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-purple-500/10"
                        title="Ver Variantes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(product)}
                        disabled={!hasEditPermission}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-500/10 disabled:opacity-30"
                        title="Editar Producto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(product)}
                        disabled={!hasDeletePermission}
                        className="h-8 w-8 text-slate-400 hover:text-destructive dark:hover:text-red-400 rounded-lg hover:bg-destructive/10 disabled:opacity-30"
                        title="Eliminar Producto"
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
