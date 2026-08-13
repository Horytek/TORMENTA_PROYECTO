import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminGetProductoAtributos,
  adminListAtributos,
  adminSetProductoAtributos,
} from "../../api/ecommerce";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CatalogAttr = {
  id_atributo: number;
  nombre: string;
  tipo: string;
  es_variante: boolean;
  valores: { id_valor: number; valor: string; hex?: string | null }[];
};

type Assigned = {
  id_atributo: number;
  visible_storefront: boolean;
  requiere_seleccion: boolean;
  obligatorio: boolean;
  id_valores: number[];
};

const TIPO_BADGE: Record<string, string> = {
  seleccion: "Selección",
  color: "Color",
  seleccion_multiple: "Varias",
  texto: "Texto",
  numero: "Número",
  medida: "Medida",
  booleano: "Sí / No",
  rango: "Rango",
};

function defaultRow(cat: CatalogAttr, id_valores: number[] = []): Assigned {
  return {
    id_atributo: cat.id_atributo,
    visible_storefront: true,
    requiere_seleccion: Boolean(cat.es_variante),
    obligatorio: Boolean(cat.es_variante),
    id_valores,
  };
}

export function ProductAttrsEditor({
  id_producto,
  tid,
  ensureProducto,
}: {
  id_producto: number | null;
  tid?: number;
  ensureProducto?: () => Promise<number | null>;
}) {
  const qc = useQueryClient();
  const hydratedId = useRef<number | null>(null);
  const catQ = useQuery({
    queryKey: ["ecom-atributos", tid],
    queryFn: () => adminListAtributos({ activo: "1" }),
    enabled: Boolean(tid),
  });
  const asQ = useQuery({
    queryKey: ["ecom-prod-attrs", tid, id_producto],
    queryFn: () => adminGetProductoAtributos(id_producto!),
    enabled: Boolean(id_producto),
  });
  const catalog = (catQ.data?.data || []) as CatalogAttr[];
  const [rows, setRows] = useState<Assigned[]>([]);

  useEffect(() => {
    if (id_producto == null) {
      hydratedId.current = null;
      setRows([]);
      return;
    }
    if (!asQ.isSuccess) return;
    if (hydratedId.current === id_producto) return;

    const assigned = (asQ.data?.data || []) as {
      id_atributo: number;
      visible_storefront: boolean;
      requiere_seleccion: boolean;
      obligatorio: boolean;
      valores: { id_valor: number | null }[];
    }[];
    const mapped: Assigned[] = assigned.map((a) => ({
      id_atributo: a.id_atributo,
      visible_storefront: a.visible_storefront,
      requiere_seleccion: a.requiere_seleccion,
      obligatorio: a.obligatorio,
      id_valores: a.valores.map((v) => Number(v.id_valor)).filter(Boolean),
    }));

    // Producto recién creado: no pisar el borrador local con un GET vacío
    if (hydratedId.current === null && mapped.length === 0) {
      hydratedId.current = id_producto;
      return;
    }

    hydratedId.current = id_producto;
    setRows(mapped);
  }, [id_producto, asQ.isSuccess, asQ.data]);

  const upsert = (id_atributo: number, patch: (row: Assigned, cat: CatalogAttr) => Assigned) => {
    const cat = catalog.find((c) => c.id_atributo === id_atributo);
    if (!cat) return;
    setRows((prev) => {
      const existing = prev.find((r) => r.id_atributo === id_atributo);
      const base = existing || defaultRow(cat);
      const next = patch(base, cat);
      if (existing) return prev.map((r) => (r.id_atributo === id_atributo ? next : r));
      return [...prev, next];
    });
  };

  const toggleValor = (cat: CatalogAttr, id_valor: number) => {
    upsert(cat.id_atributo, (row) => {
      const on = row.id_valores.includes(id_valor);
      const id_valores = on
        ? row.id_valores.filter((id) => id !== id_valor)
        : [...row.id_valores, id_valor];
      return { ...row, id_valores };
    });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const id = id_producto || (ensureProducto ? await ensureProducto() : null);
      if (!id) throw new Error("Pon un nombre al producto primero");
      const payload = rows.filter((r) => {
        const cat = catalog.find((c) => c.id_atributo === r.id_atributo);
        if ((cat?.valores?.length || 0) > 0) return r.id_valores.length > 0;
        return true;
      });
      return adminSetProductoAtributos(id, payload);
    },
    onSuccess: () => {
      toast.success("Características guardadas");
      qc.invalidateQueries({ queryKey: ["ecom-prod-attrs", tid] });
      qc.invalidateQueries({ queryKey: ["ecom-atributos", tid] });
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  return (
    <div className="md:col-span-2 space-y-3 rounded-xl border border-stone-200 p-3 sm:p-4 bg-stone-50/60">
      <div>
        <p className="text-sm font-medium text-stone-700">Qué elige el cliente en este producto</p>
        <p className="text-xs text-stone-500 mt-1">
          Marca las características que aplican. Si es talla o color con stock propio, cada
          combinación se vende por separado.
        </p>
      </div>
      {catalog.length === 0 ? (
        <p className="text-sm text-stone-400">Primero crea Talla, Color, etc. en el menú Atributos.</p>
      ) : (
        <div className="space-y-3">
          {catalog.map((c) => {
            const row = rows.find((r) => r.id_atributo === c.id_atributo);
            const assigned = Boolean(row && (c.valores.length === 0 || row.id_valores.length > 0));
            return (
              <div key={c.id_atributo} className="rounded-xl border border-stone-200 bg-white p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2 min-h-11">
                  <span className="font-medium text-sm">{c.nombre}</span>
                  <span className="text-[10px] uppercase tracking-wide text-stone-400">
                    {TIPO_BADGE[c.tipo] || c.tipo}
                  </span>
                  {c.es_variante && (
                    <span className="text-[10px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                      Stock por opción
                    </span>
                  )}
                </div>
                {c.es_variante && assigned && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                    Este atributo controla inventario por combinación. Al guardar se generan variantes con
                    stock 0; carga cantidades en Inventario. No afirma stock de opciones solo informativas.
                  </p>
                )}
                {c.valores.length === 0 && (
                  <label className="flex items-center gap-3 min-h-11 text-sm touch-manipulation">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={Boolean(row)}
                      onChange={() => {
                        setRows((prev) =>
                          prev.some((r) => r.id_atributo === c.id_atributo)
                            ? prev.filter((r) => r.id_atributo !== c.id_atributo)
                            : [...prev, defaultRow(c)]
                        );
                      }}
                    />
                    Usar en este producto
                  </label>
                )}
                {assigned && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {(
                      [
                        ["visible_storefront", "Visible en la tienda"],
                        ["requiere_seleccion", "El cliente elige"],
                        ["obligatorio", "Obligatorio para comprar"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="inline-flex items-center gap-2 min-h-11 px-2 rounded-lg hover:bg-stone-50 text-sm text-stone-600 touch-manipulation"
                      >
                        <input
                          type="checkbox"
                          className="size-4 shrink-0"
                          checked={Boolean(row?.[key])}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            upsert(c.id_atributo, (r) => ({ ...r, [key]: checked }));
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
                {c.valores.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-400">
                      Opciones de este producto (toca para incluir o quitar)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.valores.map((v) => {
                        const on = Boolean(row?.id_valores.includes(v.id_valor));
                        return (
                          <button
                            key={v.id_valor}
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border text-sm touch-manipulation",
                              on
                                ? "border-teal-600 bg-teal-50 text-teal-800"
                                : "border-stone-200 text-stone-500"
                            )}
                            onClick={() => toggleValor(c, v.id_valor)}
                          >
                            {v.hex && (
                              <span
                                className="size-3.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: v.hex }}
                              />
                            )}
                            {v.valor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Button
        type="button"
        className="w-full sm:w-auto min-h-11"
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
      >
        Guardar características
      </Button>
    </div>
  );
}
