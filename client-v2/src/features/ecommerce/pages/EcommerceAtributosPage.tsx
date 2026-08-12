import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Tags, Search, Save, RotateCcw, Package, X } from "lucide-react";
import { toast } from "sonner";
import { ecommerceListProductos, ecommerceUpdateProducto } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { TallaMultiSelect } from "../components/admin/TallaMultiSelect";
import { TonalidadEditor } from "../components/admin/TonalidadEditor";
import {
  attrsEqual,
  getProductoAtributos,
  mergeProductoAtributos,
  normalizeHex,
  parseProductoAttrs,
  type TonalidadAttr,
  type VitrinaAtributosAdmin,
} from "../utils/productoAttrs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TonosClipboard = {
  fromId: number;
  fromNombre: string;
  tonalidad: TonalidadAttr[];
};

function cloneTonalidades(list: TonalidadAttr[]): TonalidadAttr[] {
  return list
    .filter((t) => t.nombre.trim())
    .map((t) => ({ nombre: t.nombre.trim(), hex: normalizeHex(t.hex) }));
}

type Producto = {
  id_producto: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: number;
  categoria?: string | null;
  imagen_url?: string | null;
  sku?: string | null;
  attrs_json?: Record<string, unknown> | string | null;
};

type DraftMap = Record<number, VitrinaAtributosAdmin>;

export default function EcommerceAtributosPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "con" | "sin">("todos");
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [tonosClip, setTonosClip] = useState<TonosClipboard | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-productos", tid],
    queryFn: ecommerceListProductos,
    enabled: Boolean(tid),
  });

  const productos = (data?.data || []) as Producto[];

  useEffect(() => {
    const list = (data?.data || []) as Producto[];
    setDrafts((prev) => {
      const next: DraftMap = { ...prev };
      for (const p of list) {
        const saved = getProductoAtributos(parseProductoAttrs(p.attrs_json));
        const cur = prev[p.id_producto];
        if (!cur || attrsEqual(cur, saved)) {
          next[p.id_producto] = saved;
        }
      }
      return next;
    });
  }, [data?.data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return productos.filter((p) => {
      const attrs = drafts[p.id_producto] || getProductoAtributos(parseProductoAttrs(p.attrs_json));
      const has = attrs.talla.length > 0 || attrs.tonalidad.length > 0;
      if (filtro === "con" && !has) return false;
      if (filtro === "sin" && has) return false;
      if (!term) return true;
      const haystack = `${p.nombre} ${p.sku || ""} ${p.categoria || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [productos, drafts, q, filtro]);

  const saveMut = useMutation({
    mutationFn: async ({
      id,
      talla,
      tonalidad,
      attrsBase,
    }: {
      id: number;
      talla: string[];
      tonalidad: VitrinaAtributosAdmin["tonalidad"];
      attrsBase: Record<string, unknown>;
    }) => {
      const cleaned = tonalidad.filter((t) => t.nombre.trim());
      const next = mergeProductoAtributos(attrsBase, talla, cleaned);
      return ecommerceUpdateProducto(id, { attrs_json: next });
    },
    onSuccess: () => {
      toast.success("Atributos guardados");
      qc.invalidateQueries({ queryKey: ["ecom-productos", tid] });
    },
    onError: () => toast.error("No se pudieron guardar los atributos"),
  });

  const setDraft = (id: number, patch: Partial<VitrinaAtributosAdmin>) => {
    setDrafts((prev) => {
      const cur = prev[id] || { talla: [], tonalidad: [] };
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  };

  const resetDraft = (p: Producto) => {
    setDrafts((prev) => ({
      ...prev,
      [p.id_producto]: getProductoAtributos(parseProductoAttrs(p.attrs_json)),
    }));
  };

  const copyTonos = (p: Producto, tonalidad: TonalidadAttr[]) => {
    const cloned = cloneTonalidades(tonalidad);
    if (!cloned.length) {
      toast.message("Este producto no tiene tonalidades con nombre para copiar");
      return;
    }
    setTonosClip({ fromId: p.id_producto, fromNombre: p.nombre, tonalidad: cloned });
    toast.success(`Tonalidades copiadas de “${p.nombre}” (${cloned.length})`);
  };

  const pasteTonos = (p: Producto) => {
    if (!tonosClip?.tonalidad.length) {
      toast.message("Primero copia las tonalidades de otro producto");
      return;
    }
    setDraft(p.id_producto, { tonalidad: cloneTonalidades(tonosClip.tonalidad) });
    toast.success(`Tonalidades pegadas en “${p.nombre}” — recuerda Guardar`);
  };

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const p of productos) {
      const saved = getProductoAtributos(parseProductoAttrs(p.attrs_json));
      const draft = drafts[p.id_producto];
      if (draft && !attrsEqual(saved, draft)) n += 1;
    }
    return n;
  }, [productos, drafts]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Tags className="size-6 text-stone-500" />
            Atributos
          </h1>
          <p className="text-stone-500 text-sm mt-1 max-w-xl">
            Tallas (catálogo) y tonalidades (hex + nombre) para la vitrina. No parten el stock: el
            inventario se gestiona por producto y sucursal.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/ecommerce-admin/productos">
            <Package className="size-3.5 mr-1.5" />
            Ir a productos
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950/80">
        Solo informativos en la ficha del producto. El carrito y el stock usan el producto completo
        en la sucursal elegida.
        {dirtyCount > 0 && (
          <span className="ml-2 font-medium text-amber-900">
            · {dirtyCount} producto{dirtyCount === 1 ? "" : "s"} con cambios sin guardar
          </span>
        )}
      </div>

      {tonosClip && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="min-w-0 text-sm text-teal-950">
            <p className="font-medium">Tonalidades en portapapeles</p>
            <p className="text-xs text-teal-900/70 mt-0.5 truncate">
              De “{tonosClip.fromNombre}” · {tonosClip.tonalidad.length} color
              {tonosClip.tonalidad.length === 1 ? "" : "es"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tonosClip.tonalidad.map((t) => (
                <span
                  key={`${t.nombre}-${t.hex}`}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-teal-200"
                >
                  <span
                    className="size-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: t.hex }}
                  />
                  {t.nombre}
                </span>
              ))}
            </div>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => setTonosClip(null)}>
            <X className="size-3.5 mr-1" />
            Limpiar
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
          <Input
            className="pl-8 h-9"
            placeholder="Buscar producto, SKU o categoría…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs">
          {(
            [
              ["todos", "Todos"],
              ["con", "Con attrs"],
              ["sin", "Sin attrs"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                filtro === id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-50"
              }`}
              onClick={() => setFiltro(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : productos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <Tags className="size-8 mx-auto text-stone-300 mb-3" />
          <p className="font-medium">Aún no hay productos</p>
          <p className="text-sm text-stone-500 mt-1">Crea productos primero para asignar tallas y tonalidades.</p>
          <Button className="mt-4" asChild>
            <Link to="/ecommerce-admin/productos">Crear producto</Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-stone-500">Ningún producto coincide con el filtro.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const saved = getProductoAtributos(parseProductoAttrs(p.attrs_json));
            const draft = drafts[p.id_producto] || saved;
            const dirty = !attrsEqual(saved, draft);
            const saving = saveMut.isPending && saveMut.variables?.id === p.id_producto;

            return (
              <article
                key={p.id_producto}
                className={`rounded-xl border bg-white p-4 ${
                  dirty ? "border-teal-300 shadow-sm shadow-teal-50" : "border-stone-200"
                }`}
              >
                <div className="flex flex-wrap gap-4">
                  <div className="size-14 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-[10px] text-stone-300">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.nombre}</p>
                        <p className="text-xs text-stone-400">
                          {p.categoria || "Sin categoría"}
                          {p.sku ? ` · ${p.sku}` : ""} · S/ {Number(p.precio).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {dirty && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => resetDraft(p)}
                          >
                            <RotateCcw className="size-3.5 mr-1" />
                            Descartar
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          disabled={!dirty || saving}
                          onClick={() =>
                            saveMut.mutate({
                              id: p.id_producto,
                              talla: draft.talla,
                              tonalidad: draft.tonalidad,
                              attrsBase: parseProductoAttrs(p.attrs_json),
                            })
                          }
                        >
                          <Save className="size-3.5 mr-1" />
                          {saving ? "Guardando…" : "Guardar"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <TallaMultiSelect
                        values={draft.talla}
                        disabled={saving}
                        onChange={(talla) => setDraft(p.id_producto, { talla })}
                      />
                      <TonalidadEditor
                        values={draft.tonalidad}
                        disabled={saving}
                        onChange={(tonalidad) => setDraft(p.id_producto, { tonalidad })}
                        onCopy={() => copyTonos(p, draft.tonalidad)}
                        onPaste={() => pasteTonos(p)}
                        canPaste={Boolean(tonosClip?.tonalidad.length)}
                        pasteLabel={
                          tonosClip
                            ? `Pegar tonalidades de ${tonosClip.fromNombre}`
                            : "Copia tonalidades de otro producto primero"
                        }
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
