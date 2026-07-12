import { Package } from "lucide-react";
import type { InventarioProducto } from "../types";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef } from "@/components/shared/AdaptiveCollection";

interface Props {
  productos: InventarioProducto[];
}

export function InventoryTable({ productos }: Props) {
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

  return (
    <AdaptiveCollection<InventarioProducto>
      items={productos}
      fields={fields}
      layout="card"
      getItemId={(item) => item.codigo}
      getRhythm={(p) => ({
        type: "dot",
        color: p.estado === 0 ? "rose" : "emerald",
      })}
      empty={{
        title: "No se encontraron productos",
        description: "No hay productos que coincidan con los filtros.",
      }}
    />
  );
}
