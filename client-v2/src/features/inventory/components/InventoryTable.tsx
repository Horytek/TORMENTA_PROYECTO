import { useState } from "react";
import { Package, Boxes, History } from "lucide-react";
import type { InventarioProducto } from "../types";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  productos: InventarioProducto[];
  onSelectKardex?: (p: InventarioProducto) => void;
  onSelectVariants?: (p: InventarioProducto) => void;
}

export function InventoryTable({ productos, onSelectKardex, onSelectVariants }: Props) {
  const [actionProduct, setActionProduct] = useState<InventarioProducto | null>(null);

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/50 py-20 text-center">
        <Package className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No hay productos que coincidan con los filtros.</p>
      </div>
    );
  }

  const fields: FieldDef<InventarioProducto>[] = [
    {
      key: "descripcion",
      priority: "primary",
      semantic: "title",
      label: "Producto",
    },
    {
      key: "marca",
      priority: "secondary",
      semantic: "chip",
      label: "Marca",
      format: (v) => (v as string) || "Genérico",
    },
    {
      key: "codigo",
      priority: "meta",
      semantic: "code",
      label: "Código",
    },
    {
      key: "stock",
      priority: "secondary",
      semantic: "number",
      label: "Stock",
      render: (_, p) => {
        const stockNum = Number(p.stock);
        let colorClass = "text-foreground";
        if (stockNum === 0) colorClass = "text-red-600 dark:text-red-400";
        else if (stockNum < 10) colorClass = "text-orange-600 dark:text-orange-400";
        return (
          <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
            {stockNum.toLocaleString()} disp.
          </span>
        );
      },
    },
    {
      key: "um",
      priority: "meta",
      semantic: "code",
      label: "U/M",
      format: (v) => (v as string) || "NIU",
    },
    {
      key: "margen",
      priority: "secondary",
      label: "Margen",
      render: (_v, p) => {
        const costo = p.costo_promedio != null ? Number(p.costo_promedio) : null;
        const precio = Number(p.precio);
        if (costo == null || !Number.isFinite(costo) || costo <= 0) {
          return <span className="text-xs text-muted-foreground">Sin costo</span>;
        }
        const margenPct = ((precio - costo) / precio) * 100;
        const bajo = margenPct < 15;
        return (
          <span className={bajo ? "text-xs font-semibold text-destructive" : "text-xs font-semibold text-emerald-600 dark:text-emerald-400"}>
            {margenPct.toFixed(0)}%
          </span>
        );
      },
    },
    {
      key: "precio",
      priority: "secondary",
      semantic: "number",
      label: "Precio",
      format: (v) => `S/ ${Number(v).toFixed(2)}`,
    },
    {
      key: "estado",
      priority: "secondary",
      semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
  ];

  const actions: RecordAction[] = [
    {
      id: "variants",
      label: "Ver variantes de stock",
      icon: <Boxes className="h-4 w-4 text-brand" />,
      onClick: (p) => onSelectVariants?.(p as InventarioProducto),
    },
    {
      id: "kardex",
      label: "Ir a detalle Kardex",
      icon: <History className="h-4 w-4 text-brand" />,
      onClick: (p) => onSelectKardex?.(p as InventarioProducto),
    },
  ];

  return (
    <>
      <AdaptiveCollection<InventarioProducto>
        items={productos}
        fields={fields}
        actions={actions}
        layout="auto"
        getItemId={(item) => item.codigo}
        onRecordClick={(p) => setActionProduct(p)}
        getRhythm={(p) => ({
          type: "dot",
          color: p.estado === 0 ? "rose" : "emerald",
        })}
        empty={{
          title: "No se encontraron productos",
          description: "No hay productos que coincidan con los filtros.",
        }}
      />

      {actionProduct && (
        <Dialog open={!!actionProduct} onOpenChange={(open) => !open && setActionProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground">
                Opciones del producto
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                <span className="font-medium text-foreground">{actionProduct.descripcion}</span> &nbsp;·&nbsp; Código: #{actionProduct.codigo} &nbsp;·&nbsp; Stock: {actionProduct.stock} disp.
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 py-2">
              <button
                type="button"
                onClick={() => {
                  const p = actionProduct;
                  setActionProduct(null);
                  onSelectVariants?.(p);
                }}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-brand/40 hover:bg-accent/50 hover:shadow-sm group cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
                    Ver variantes de stock
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Ver el stock específico desglosado por variante, tallas, colores y SKUs.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = actionProduct;
                  setActionProduct(null);
                  onSelectKardex?.(p);
                }}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-brand/40 hover:bg-accent/50 hover:shadow-sm group cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
                    Ir a detalle Kardex
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Ver el historial completo de transacciones, entradas y salidas en el kardex.
                  </p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
