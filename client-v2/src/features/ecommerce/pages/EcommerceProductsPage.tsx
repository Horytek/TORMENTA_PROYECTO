import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ecommerceCreateProducto,
  ecommerceDeleteProducto,
  ecommerceListProductos,
  ecommerceUploadImagen,
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
  imagen_url?: string | null;
  descripcion?: string | null;
};

/** Reduce peso del data-URL para no romper el límite JSON del API. */
async function fileToCompressedDataUrl(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }
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
  });

  const createMut = useMutation({
    mutationFn: () =>
      ecommerceCreateProducto({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        stock: Number(form.stock),
        stock_min: 5,
        activo: true,
      }),
    onSuccess: () => {
      toast.success("Producto creado");
      setForm({ nombre: "", descripcion: "", precio: "49.90", stock: "10" });
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

  const onFile = async (id: number, file: File) => {
    try {
      const base64 = await fileToCompressedDataUrl(file);
      await ecommerceUploadImagen(id, base64, file.name.replace(/\.\w+$/, ".jpg") || "producto.jpg");
      toast.success("Imagen subida (ImageKit)");
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
        <p className="text-stone-500 text-sm mt-1">Catálogo de tu tienda. Imágenes vía ImageKit.</p>
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
            placeholder="Algodón peinado 24/1 · 180 g"
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
        <div className="md:col-span-2">
          <Button type="submit" disabled={createMut.isPending}>
            Agregar producto
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p) => (
            <article
              key={p.id_producto}
              className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="aspect-[4/3] bg-stone-100 relative">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-stone-300 text-sm">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded">
                  Horytek · Tag
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-semibold leading-tight">{p.nombre}</h3>
                <p className="text-xs text-stone-500 line-clamp-2">{p.descripcion}</p>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">S/ {Number(p.precio).toFixed(2)}</span>
                  <span className="text-stone-500">{p.stock} uds</span>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <span className="sr-only">Subir imagen</span>
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-xs"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFile(p.id_producto, f);
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMut.mutate(p.id_producto)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
