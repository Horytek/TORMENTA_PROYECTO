import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getProductAttributes, getProductVariants } from "@/features/products/api/products";

export interface VariantResolved {
  id_sku: number | null;
  label: string | null;
  stock: number | null;
  /** true = ya se puede agregar (sin variantes, o variante completa elegida). */
  ready: boolean;
}

interface VariantPickerProps {
  idProducto: number;
  idAlmacen?: number;
  onResolved: (result: VariantResolved) => void;
}

/**
 * Selector de variante (color/talla/…) para un producto. Si el producto no
 * tiene variantes generadas, no renderiza nada y resuelve de inmediato — cero
 * fricción para el caso común. Reusado en Notas, Guías, Compras y POS.
 */
export function VariantPicker({ idProducto, idAlmacen, onResolved }: VariantPickerProps) {
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["product-variants", idProducto, idAlmacen],
    queryFn: () => getProductVariants(idProducto, idAlmacen),
    enabled: !!idProducto,
  });

  const { data: attrsCatalog } = useQuery({
    queryKey: ["product-attributes-catalog", idProducto],
    queryFn: () => getProductAttributes(idProducto),
    enabled: variants.length > 0,
  });

  const [selection, setSelection] = useState<Record<string, string>>({});

  // Claves de atributo (id_atributo como string) presentes en las variantes.
  const attrIds = useMemo(() => {
    const ids = new Set<string>();
    variants.forEach((v) => Object.keys(v.attrs || {}).forEach((k) => ids.add(k)));
    return [...ids];
  }, [variants]);

  const nombrePorId = useMemo(() => {
    const map = new Map<string, string>();
    attrsCatalog?.attributes.forEach((a) => map.set(String(a.id_atributo), a.nombre));
    return map;
  }, [attrsCatalog]);

  // Cascada: las opciones de CADA atributo se acotan a lo que ya elegiste en
  // los demás. Con 3+ dimensiones esto es lo que evita llegar a "esa
  // combinación no tiene variante generada" — con 1-2 dimensiones simplemente
  // no filtra nada (no hay "los demás" que restrinjan).
  const valoresPorAtributo = useMemo(() => {
    const map = new Map<string, string[]>();
    attrIds.forEach((id) => {
      const otrosElegidos = attrIds.filter((otroId) => otroId !== id && selection[otroId]);
      const candidatos = otrosElegidos.length === 0
        ? variants
        : variants.filter((v) => otrosElegidos.every((otroId) => v.attrs?.[otroId] === selection[otroId]));
      const set = new Set<string>();
      candidatos.forEach((v) => { if (v.attrs?.[id]) set.add(v.attrs[id]); });
      map.set(id, [...set]);
    });
    return map;
  }, [attrIds, variants, selection]);

  const matched = useMemo(() => {
    if (attrIds.length === 0) return null;
    if (attrIds.some((id) => !selection[id])) return null;
    return variants.find((v) => attrIds.every((id) => v.attrs?.[id] === selection[id])) ?? null;
  }, [attrIds, selection, variants]);

  useEffect(() => {
    if (isLoading) return;
    if (attrIds.length === 0) {
      onResolved({ id_sku: null, label: null, stock: null, ready: true });
      return;
    }
    if (matched) {
      onResolved({
        id_sku: matched.id_sku,
        label: attrIds.map((id) => matched.attrs[id]).join(" / "),
        stock: matched.stock,
        ready: true,
      });
    } else {
      onResolved({ id_sku: null, label: null, stock: null, ready: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onResolved intencionalmente fuera: solo reaccionar a cambios reales de selección
  }, [matched, attrIds.length, isLoading]);

  if (isLoading || attrIds.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
      {attrIds.map((id) => (
        <div key={id} className="flex flex-wrap items-center gap-1.5">
          <span className="w-14 shrink-0 text-[11px] font-medium text-muted-foreground">
            {nombrePorId.get(id) ?? "Atributo"}
          </span>
          {(valoresPorAtributo.get(id) ?? []).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setSelection((s) => ({ ...s, [id]: val }))}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                selection[id] === val
                  ? "border-brand bg-brand/10 font-medium text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              )}
            >
              {val}
            </button>
          ))}
        </div>
      ))}
      {matched ? (
        <p className="text-[11px] text-muted-foreground">
          Stock disponible: <span className="num font-medium text-foreground">{matched.stock}</span>
        </p>
      ) : attrIds.every((id) => selection[id]) ? (
        <p className="text-[11px] text-destructive">Esa combinación no tiene variante generada.</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">Elige una opción de cada atributo.</p>
      )}
    </div>
  );
}
