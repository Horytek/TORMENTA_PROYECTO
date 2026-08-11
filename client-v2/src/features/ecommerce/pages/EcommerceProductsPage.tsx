import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PackagePlus, ImagePlus, Trash2, Star } from "lucide-react";
import {
  ecommerceCreateProducto,
  ecommerceDeleteProducto,
  ecommerceListProductos,
  ecommerceUploadImagen,
  ecommerceUpdateProducto,
} from "../api/ecommerce";
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

function parseAttrs(a: Producto["attrs_json"]): Record<string, unknown> {
  if (!a) return {};
  if (typeof a === "string") {
    try {
      return JSON.parse(a);
    } catch {
      return {};
    }
  }
  return a;
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
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-productos"],
    queryFn: ecommerceListProductos,
  });
  const productos: Producto[] = data?.data || [];

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "49.90",
    stock: "10",
    categoria: "",
    destacado: false,
    story: false,
    tags: "",
  });

  const createMut = useMutation({
    mutationFn: () => {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return ecommerceCreateProducto({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        stock: Number(form.stock),
        stock_min: 5,
        activo: true,
        categoria: form.categoria.trim() || null,
        attrs_json: {
          categoria: form.categoria.trim() || undefined,
          destacado: form.destacado || undefined,
          story: form.story || undefined,
          tags: tags.length ? tags : undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Producto creado");
      setForm({
        nombre: "",
        descripcion: "",
        precio: "49.90",
        stock: "10",
        categoria: "",
        destacado: false,
        story: false,
        tags: "",
      });
      qc.invalidateQueries({ queryKey: ["ecom-productos"] });
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => ecommerceDeleteProducto(id),
    onSuccess: () => {
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["ecom-productos"] });
    },
  });

  const toggleFlag = async (p: Producto, key: "destacado" | "story") => {
    const attrs = parseAttrs(p.attrs_json);
    const next = { ...attrs, [key]: !attrs[key] };
    try {
      await ecommerceUpdateProducto(p.id_producto, { attrs_json: next });
      qc.invalidateQueries({ queryKey: ["ecom-productos"] });
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
      qc.invalidateQueries({ queryKey: ["ecom-productos"] });
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-stone-500 text-sm mt-1">
          Catálogo · categoría unificada · destacados / stories para la vitrina.
        </p>
      </div>

      <form
        className="rounded-xl border border-stone-200 bg-white p-4 grid md:grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.nombre.trim()) return;
          createMut.mutate();
        }}
      >
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
          <Label>Stock</Label>
          <Input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div>
          <Label>Categoría</Label>
          <Input
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            placeholder="Tecnología, Hogar…"
          />
        </div>
        <div>
          <Label>Tags (coma)</Label>
          <Input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="nuevo, oferta"
          />
        </div>
        <div className="flex gap-4 items-center md:col-span-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.destacado}
              onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
            />
            Destacado (Spotlight)
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
        <div className="md:col-span-2">
          <Button type="submit" disabled={createMut.isPending}>
            <PackagePlus className="size-4 mr-1" />
            Agregar producto
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
            const attrs = parseAttrs(p.attrs_json);
            return (
              <article key={p.id_producto} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                <div className="aspect-[4/3] bg-stone-100 relative">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-stone-300 text-sm">Sin foto</div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {attrs.destacado && (
                      <span className="text-[10px] bg-teal-700 text-white px-1.5 py-0.5">Destacado</span>
                    )}
                    {attrs.story && (
                      <span className="text-[10px] bg-stone-800 text-white px-1.5 py-0.5">Story</span>
                    )}
                    {p.stock <= 3 && p.stock > 0 && (
                      <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5">Stock bajo</span>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.nombre}</p>
                      <p className="text-xs text-stone-400">
                        {p.categoria || "Sin categoría"} · S/ {Number(p.precio).toFixed(2)} · stock {p.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
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
