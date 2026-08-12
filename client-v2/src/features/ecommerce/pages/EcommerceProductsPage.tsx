import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, ImagePlus, Trash2, Star, Tags, Pencil, X } from "lucide-react";
import {
  ecommerceCreateProducto,
  ecommerceDeleteProducto,
  ecommerceListProductos,
  ecommerceUploadImagen,
  ecommerceUpdateProducto,
} from "../api/ecommerce";
import {
  getProductoAtributos,
  parseProductoAttrs,
} from "../utils/productoAttrs";
import { getMarca } from "../types/storefront";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Producto = {
  id_producto: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: number;
  categoria?: string | null;
  imagen_url?: string | null;
  descripcion?: string | null;
  attrs_json?: Record<string, unknown> | string | null;
};

type ProductForm = {
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  categoria: string;
  marca: string;
  destacado: boolean;
  story: boolean;
  tags: string;
};

const emptyForm = (): ProductForm => ({
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "0",
  categoria: "",
  marca: "",
  destacado: false,
  story: false,
  tags: "",
});

function buildAttrsFromForm(
  form: ProductForm,
  base: Record<string, unknown> = {}
): Record<string, unknown> {
  const attrs_json: Record<string, unknown> = {
    ...base,
    destacado: form.destacado,
    story: form.story,
  };
  const marca = form.marca.trim();
  if (marca) attrs_json.marca = marca;
  else delete attrs_json.marca;

  if (form.tags.trim()) {
    attrs_json.tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  } else {
    delete attrs_json.tags;
  }
  return attrs_json;
}

function formFromProducto(p: Producto): ProductForm {
  const attrs = parseProductoAttrs(p.attrs_json);
  const tags = Array.isArray(attrs.tags)
    ? attrs.tags.filter((t): t is string => typeof t === "string").join(", ")
    : "";
  return {
    nombre: p.nombre || "",
    descripcion: p.descripcion || "",
    precio: String(p.precio ?? ""),
    stock: String(p.stock ?? 0),
    categoria: p.categoria || "",
    marca: typeof attrs.marca === "string" ? attrs.marca : "",
    destacado: Boolean(attrs.destacado),
    story: Boolean(attrs.story),
    tags,
  };
}

async function fileToCompressedDataUrl(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export default function EcommerceProductsPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-productos", tid],
    queryFn: ecommerceListProductos,
    enabled: Boolean(tid),
  });
  const productos = (data?.data || []) as Producto[];

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const startEdit = (p: Producto) => {
    setEditingId(p.id_producto);
    setForm(formFromProducto(p));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveMut = useMutation({
    mutationFn: () => {
      if (editingId) {
        const existing = productos.find((x) => x.id_producto === editingId);
        const base = parseProductoAttrs(existing?.attrs_json);
        return ecommerceUpdateProducto(editingId, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          precio: Number(form.precio) || 0,
          stock: Number(form.stock) || 0,
          categoria: form.categoria.trim() || null,
          attrs_json: buildAttrsFromForm(form, base),
        });
      }
      return ecommerceCreateProducto({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio) || 0,
        stock: Number(form.stock) || 0,
        categoria: form.categoria.trim() || null,
        attrs_json: buildAttrsFromForm(form),
      });
    },
    onSuccess: () => {
      toast.success(editingId ? "Producto actualizado" : "Producto creado");
      resetForm();
      qc.invalidateQueries({ queryKey: ["ecom-productos", tid] });
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => ecommerceDeleteProducto(id),
    onSuccess: (_, id) => {
      toast.success("Eliminado");
      if (editingId === id) resetForm();
      qc.invalidateQueries({ queryKey: ["ecom-productos", tid] });
    },
  });

  const toggleFlag = async (p: Producto, key: "destacado" | "story") => {
    const attrs = parseProductoAttrs(p.attrs_json);
    const next = { ...attrs, [key]: !attrs[key] };
    try {
      await ecommerceUpdateProducto(p.id_producto, { attrs_json: next });
      qc.invalidateQueries({ queryKey: ["ecom-productos", tid] });
      toast.success("Actualizado");
    } catch {
      toast.error("No se pudo actualizar");
    }
  };

  const onFile = async (id: number, file: File) => {
    try {
      const base64 = await fileToCompressedDataUrl(file);
      await ecommerceUploadImagen(id, base64, file.name.replace(/\.\w+$/, ".jpg") || "producto.jpg");
      toast.success("Imagen subida");
      qc.invalidateQueries({ queryKey: ["ecom-productos", tid] });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "No se pudo subir la imagen";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-stone-500 text-sm mt-1">
            Catálogo de la tienda. Tallas/colores de vitrina →{" "}
            <Link to="/ecommerce-admin/atributos" className="text-teal-700 hover:underline">
              Atributos
            </Link>
            ; stock por sucursal → Inventario.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/ecommerce-admin/atributos">
            <Tags className="size-3.5 mr-1.5" />
            Gestionar atributos
          </Link>
        </Button>
      </div>

      <form
        className={`rounded-xl border bg-white p-4 grid md:grid-cols-2 gap-3 ${
          editingId ? "border-teal-300 shadow-sm shadow-teal-50" : "border-stone-200"
        }`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.nombre.trim()) return;
          saveMut.mutate();
        }}
      >
        <div className="md:col-span-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-stone-700">
            {editingId ? "Editar producto" : "Nuevo producto"}
          </p>
          {editingId && (
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              <X className="size-3.5 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
        <div className="md:col-span-2">
          <Label>Nombre</Label>
          <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Descripción</Label>
          <Input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </div>
        <div>
          <Label>Precio (S/)</Label>
          <Input value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
        </div>
        <div>
          <Label>{editingId ? "Stock (referencia)" : "Stock inicial"}</Label>
          <Input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div>
          <Label>Marca</Label>
          <Input
            value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
            placeholder="Ej. Levi's, Nike…"
          />
        </div>
        <div>
          <Label>Categoría</Label>
          <Input
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            placeholder="Pantalón jeans, Polos…"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Tags (coma)</Label>
          <Input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="nuevo, oferta…"
          />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.destacado}
              onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
            />
            Destacado
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.checked })}
            />
            Story / Featured
          </label>
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <Button type="submit" disabled={saveMut.isPending}>
            {editingId ? (
              <>
                <Pencil className="size-4 mr-1" />
                Guardar cambios
              </>
            ) : (
              <>
                <PackagePlus className="size-4 mr-1" />
                Agregar producto
              </>
            )}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : productos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <PackagePlus className="size-8 mx-auto text-stone-300 mb-3" />
          <p className="font-medium">Aún no hay productos</p>
          <p className="text-sm text-stone-500 mt-1">Crea el primero para llenar tu vitrina.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => {
            const attrs = parseProductoAttrs(p.attrs_json);
            const vAttrs = getProductoAtributos(attrs);
            const marca = getMarca(p);
            const isEditing = editingId === p.id_producto;
            return (
              <article
                key={p.id_producto}
                className={`rounded-xl border bg-white overflow-hidden ${
                  isEditing ? "border-teal-400 ring-1 ring-teal-200" : "border-stone-200"
                }`}
              >
                <div className="aspect-[4/3] bg-stone-100 relative">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-stone-300 text-sm">Sin foto</div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {Boolean(attrs.destacado) && (
                      <span className="text-[10px] bg-teal-700 text-white px-1.5 py-0.5">Destacado</span>
                    )}
                    {Boolean(attrs.story) && (
                      <span className="text-[10px] bg-stone-800 text-white px-1.5 py-0.5">Story</span>
                    )}
                    {p.stock <= 3 && p.stock > 0 && (
                      <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5">Stock bajo</span>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.nombre}</p>
                    <p className="text-xs text-stone-400">
                      {marca ? `${marca} · ` : ""}
                      {p.categoria || "Sin categoría"} · S/ {Number(p.precio).toFixed(2)} · stock {p.stock}
                    </p>
                  </div>
                  {(() => {
                    const previewTallas = vAttrs.talla.slice(0, 4);
                    const previewTono = vAttrs.tonalidad.slice(0, 4);
                    if (previewTallas.length === 0 && previewTono.length === 0) {
                      return <p className="text-[11px] text-stone-400">Sin tallas/tonalidades de vitrina</p>;
                    }
                    return (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {previewTallas.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] rounded-full border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-stone-600"
                          >
                            {c}
                          </span>
                        ))}
                        {previewTono.map((t) => (
                          <span
                            key={`${t.nombre}-${t.hex}`}
                            className="inline-flex items-center gap-1 text-[10px] rounded-full border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-stone-600"
                            title={t.nombre}
                          >
                            <span
                              className="size-2.5 rounded-full border border-stone-200"
                              style={{ backgroundColor: t.hex }}
                            />
                            {t.nombre}
                          </span>
                        ))}
                        {(vAttrs.talla.length > 4 || vAttrs.tonalidad.length > 4) && (
                          <span className="text-[10px] text-stone-400">…</span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(p)}>
                      <Pencil className="size-3 mr-1" />
                      Editar
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => toggleFlag(p, "destacado")}>
                      <Star className="size-3 mr-1" />
                      Destacado
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => toggleFlag(p, "story")}>
                      Story
                    </Button>
                    <label className="inline-flex">
                      <Button type="button" size="sm" variant="outline" asChild>
                        <span>
                          <ImagePlus className="size-3 mr-1" />
                          Foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void onFile(p.id_producto, f);
                            }}
                          />
                        </span>
                      </Button>
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => deleteMut.mutate(p.id_producto)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
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
