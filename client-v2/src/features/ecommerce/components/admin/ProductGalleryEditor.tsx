import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteImagen,
  adminListProductoImagenes,
  adminReorderImagenes,
  adminSetImagenPrincipal,
  ecommerceUploadImagen,
} from "../../api/ecommerce";

type Img = {
  id_imagen: number;
  url: string;
  es_principal: number | boolean;
  orden: number;
};

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

export function ProductGalleryEditor({
  id_producto,
  tid,
  ensureProducto,
}: {
  id_producto: number | null;
  tid?: number;
  ensureProducto?: () => Promise<number | null>;
}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["ecom-galeria", tid, id_producto],
    queryFn: () => adminListProductoImagenes(id_producto!),
    enabled: Boolean(id_producto),
  });
  const imagenes = (q.data?.data || []) as Img[];

  const invalidate = (id: number) => {
    qc.invalidateQueries({ queryKey: ["ecom-galeria", tid, id] });
    qc.invalidateQueries({ queryKey: ["ecom-productos", tid] });
  };

  const resolveId = async () => {
    if (id_producto) return id_producto;
    if (!ensureProducto) return null;
    return ensureProducto();
  };

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const id = await resolveId();
      if (!id) throw new Error("Pon un nombre al producto primero");
      for (const file of files) {
        const base64 = await fileToCompressedDataUrl(file);
        await ecommerceUploadImagen(id, base64, file.name.replace(/\.\w+$/, ".jpg"));
      }
      return id;
    },
    onSuccess: (id) => {
      toast.success("Imagen subida");
      invalidate(id);
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo subir"),
  });

  const move = async (idx: number, dir: -1 | 1) => {
    if (!id_producto) return;
    const next = idx + dir;
    if (next < 0 || next >= imagenes.length) return;
    const ids = imagenes.map((i) => i.id_imagen);
    const tmp = ids[idx];
    ids[idx] = ids[next];
    ids[next] = tmp;
    await adminReorderImagenes(id_producto, ids);
    invalidate(id_producto);
  };

  return (
    <div className="md:col-span-2 space-y-2">
      <p className="text-sm font-medium text-stone-700">Galería del producto</p>
      <p className="text-xs text-stone-500">
        {id_producto
          ? "La foto principal no se cambia al subir extras. Márcala con la estrella."
          : "Puedes subir fotos ahora. Si el producto aún no existe, se crea con el nombre de arriba."}
      </p>
      <div className="flex flex-wrap gap-3">
        {imagenes.map((img, idx) => (
          <div
            key={img.id_imagen}
            className="relative w-[calc(50%-0.375rem)] sm:w-28 aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100"
          >
            <img src={img.url} alt="" className="size-full object-cover" />
            {Boolean(img.es_principal) && (
              <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-teal-700 text-white px-1.5 py-0.5 rounded">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 bg-black/55">
              <button
                type="button"
                className="min-h-11 flex items-center justify-center text-white"
                onClick={() => move(idx, -1)}
                aria-label="Mover a la izquierda"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="min-h-11 flex items-center justify-center text-white"
                onClick={() => move(idx, 1)}
                aria-label="Mover a la derecha"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                className="min-h-11 flex items-center justify-center text-amber-300"
                onClick={async () => {
                  if (!id_producto) return;
                  await adminSetImagenPrincipal(id_producto, img.id_imagen);
                  invalidate(id_producto);
                }}
                aria-label="Marcar principal"
              >
                <Star className="size-4" />
              </button>
              <button
                type="button"
                className="min-h-11 flex items-center justify-center text-red-300"
                onClick={async () => {
                  if (!id_producto) return;
                  await adminDeleteImagen(id_producto, img.id_imagen);
                  invalidate(id_producto);
                }}
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <label
          className={`aspect-square rounded-xl border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-stone-50 touch-manipulation ${
            imagenes.length === 0
              ? "w-full max-w-[12rem] min-h-32"
              : "w-[calc(50%-0.375rem)] sm:w-28 min-h-24"
          }`}
        >
          <ImagePlus className="size-7 text-stone-400" />
          <span className="text-xs text-stone-500 px-2 text-center">Agregar fotos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = [...(e.target.files || [])];
              e.target.value = "";
              if (files.length) uploadMut.mutate(files);
            }}
          />
        </label>
      </div>
      {uploadMut.isPending && <p className="text-xs text-stone-400">Subiendo…</p>}
    </div>
  );
}
