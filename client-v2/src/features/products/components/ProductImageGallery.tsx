import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star, Trash2, Upload, AlertCircle, RotateCw, Pencil, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  listProductImages,
  uploadProductImage,
  deleteProductImage,
  setPrincipalProductImage,
  type ProductImage,
} from "../api/productImages";

interface PendingUpload {
  tempId: string;
  previewUrl: string;
  file: File;
  error?: string;
}

interface ProductImageGalleryProps {
  productId: number;
}

export function ProductImageGallery({ productId }: ProductImageGalleryProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  const [replacingImage, setReplacingImage] = useState<ProductImage | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: () => listProductImages(productId),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
    queryClient.invalidateQueries({ queryKey: ["all-product-images"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const subir = async (pendingUpload: PendingUpload) => {
    try {
      await uploadProductImage(productId, pendingUpload.file);
      setPending((prev) => prev.filter((p) => p.tempId !== pendingUpload.tempId));
      URL.revokeObjectURL(pendingUpload.previewUrl);
      toast.success("Imagen subida a ImageKit correctamente");
      invalidar();
    } catch (err) {
      setPending((prev) =>
        prev.map((p) =>
          p.tempId === pendingUpload.tempId
            ? { ...p, error: err instanceof Error ? err.message : "Error al subir la imagen" }
            : p
        )
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nuevos: PendingUpload[] = Array.from(files).map((file) => ({
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      previewUrl: URL.createObjectURL(file),
      file,
    }));
    setPending((prev) => [...prev, ...nuevos]);
    nuevos.forEach(subir);
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImage) return;

    try {
      // 1. Eliminar la imagen actual
      await deleteProductImage(productId, replacingImage.id_imagen);
      // 2. Subir la nueva imagen
      await uploadProductImage(productId, file);
      toast.success("Imagen reemplazada exitosamente en ImageKit");
      invalidar();
    } catch (err: any) {
      toast.error(err?.message || "Error al reemplazar la imagen");
    } finally {
      setReplacingImage(null);
      e.target.value = "";
    }
  };

  const eliminarMutation = useMutation({
    mutationFn: (idImagen: number) => deleteProductImage(productId, idImagen),
    onSuccess: () => {
      toast.success("Imagen eliminada");
      setImageToDelete(null);
      invalidar();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al eliminar la imagen");
    },
  });

  const principalMutation = useMutation({
    mutationFn: (idImagen: number) => setPrincipalProductImage(productId, idImagen),
    onSuccess: () => {
      toast.success("Imagen establecida como principal");
      invalidar();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al establecer imagen principal");
    },
  });

  return (
    <div className="border-t border-slate-200/80 dark:border-zinc-800 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-brand" /> Imágenes del Producto (ImageKit)
          </h4>
          <p className="text-xs text-muted-foreground">
            Sube o edita la portada del producto. La foto marcada (⭐) se mostrará en el catálogo y POS.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin text-brand" /> Cargando imágenes desde ImageKit…
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img) => (
            <div
              key={img.id_imagen}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-100 dark:bg-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300"
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/300x400?text=Sin+Imagen";
                }}
              />

              {img.es_principal && (
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-amber-400 font-medium px-2 py-0.5 rounded-full text-[9px] border border-white/10 shadow-sm flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Principal
                </div>
              )}

              {/* Minimalist Floating Overlay Actions */}
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center p-1">
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                  <button
                    type="button"
                    title="Reemplazar imagen"
                    onClick={() => {
                      setReplacingImage(img);
                      replaceInputRef.current?.click();
                    }}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {!img.es_principal && (
                    <button
                      type="button"
                      title="Marcar como principal"
                      disabled={principalMutation.isPending}
                      onClick={() => principalMutation.mutate(img.id_imagen)}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Eliminar imagen"
                    onClick={() => setImageToDelete(img)}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pending.map((p) => (
            <div key={p.tempId} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-muted">
              <img src={p.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white">
                {p.error ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-300" />
                    <button
                      type="button"
                      onClick={() => {
                        setPending((prev) => prev.map((it) => (it.tempId === p.tempId ? { ...it, error: undefined } : it)));
                        subir(p);
                      }}
                      className="flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground cursor-pointer"
                    >
                      <RotateCw className="h-2.5 w-2.5" /> Reintentar
                    </button>
                  </>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-muted-foreground hover:border-brand hover:text-brand hover:bg-brand/5 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span className="text-[11px] font-medium">Subir</span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {!isLoading && images.length === 0 && pending.length === 0 && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 mt-2" onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Subir primera imagen
        </Button>
      )}

      {/* Confirmation Modal Before Delete */}
      <ConfirmDialog
        open={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={() => imageToDelete && eliminarMutation.mutate(imageToDelete.id_imagen)}
        title="¿Eliminar imagen del producto?"
        description="Esta acción eliminará permanentemente la foto del catálogo e ImageKit."
        confirmLabel="Eliminar Imagen"
        variant="danger"
        isPending={eliminarMutation.isPending}
      />
    </div>
  );
}

export default ProductImageGallery;
