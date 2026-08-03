import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Search,
  Star,
  Trash2,
  ExternalLink,
  Loader2,
  Upload,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { getProducts } from "../api/products";
import {
  listAllProductImages,
  uploadProductImage,
  deleteProductImage,
  setPrincipalProductImage,
  type TenantProductImage,
} from "../api/productImages";

export function ProductImageManagerTab() {
  const queryClient = useQueryClient();
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [filterPrincipal, setFilterPrincipal] = useState<boolean | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Modals state
  const [previewImage, setPreviewImage] = useState<TenantProductImage | null>(null);
  const [imageToDelete, setImageToDelete] = useState<TenantProductImage | null>(null);
  const [replacingImage, setReplacingImage] = useState<TenantProductImage | null>(null);

  // Queries
  const { data: allImages = [], isLoading: loadingImages } = useQuery({
    queryKey: ["all-product-images"],
    queryFn: listAllProductImages,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-list-for-images"],
    queryFn: () => getProducts({ limit: 500 }),
  });

  const productsList = productsData?.data || [];

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["all-product-images"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const deleteMutation = useMutation({
    mutationFn: ({ idProducto, idImagen }: { idProducto: number; idImagen: number }) =>
      deleteProductImage(idProducto, idImagen),
    onSuccess: () => {
      toast.success("Imagen eliminada correctamente");
      setImageToDelete(null);
      invalidar();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al eliminar la imagen");
    },
  });

  const setPrincipalMutation = useMutation({
    mutationFn: ({ idProducto, idImagen }: { idProducto: number; idImagen: number }) =>
      setPrincipalProductImage(idProducto, idImagen),
    onSuccess: () => {
      toast.success("Imagen marcada como principal");
      invalidar();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al establecer imagen principal");
    },
  });

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImage) return;

    try {
      toast.loading("Reemplazando imagen en ImageKit…", { id: "replace-img" });
      await deleteProductImage(replacingImage.id_producto, replacingImage.id_imagen);
      await uploadProductImage(replacingImage.id_producto, file);
      toast.success("Imagen del producto actualizada con éxito", { id: "replace-img" });
      invalidar();
    } catch (err: any) {
      toast.error(err?.message || "Error al reemplazar la imagen", { id: "replace-img" });
    } finally {
      setReplacingImage(null);
      e.target.value = "";
    }
  };

  // Filtered images
  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      if (selectedProductId !== "all" && String(img.id_producto) !== selectedProductId) return false;
      if (filterPrincipal !== null && img.es_principal !== filterPrincipal) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = img.nom_producto?.toLowerCase().includes(q);
        const matchCode = img.cod_producto?.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [allImages, selectedProductId, filterPrincipal, searchTerm]);

  const handleBatchUpload = async () => {
    if (!targetProductId || uploadFiles.length === 0) {
      toast.error("Seleccione un producto y al menos una imagen");
      return;
    }
    const productIdNum = Number(targetProductId);
    setIsUploading(true);
    let subidasOK = 0;

    for (const file of uploadFiles) {
      try {
        await uploadProductImage(productIdNum, file);
        subidasOK++;
      } catch (err) {
        console.error("Error subiendo imagen:", err);
      }
    }

    setIsUploading(false);
    if (subidasOK > 0) {
      toast.success(`${subidasOK} imagen(es) subida(s) exitosamente a ImageKit`);
      invalidar();
      setIsUploadOpen(false);
      setUploadFiles([]);
      setTargetProductId("");
    } else {
      toast.error("Ocurrió un error al subir las imágenes");
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for replacing an image */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Minimalist Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Galería de Imágenes
          </h3>
          <p className="text-xs text-slate-400 font-normal">
            {allImages.length} fotos en el catálogo de productos (ImageKit API)
          </p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white gap-1.5 text-xs font-medium rounded-xl transition-all shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" /> Subir Imagen
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar producto o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs rounded-xl border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="w-[220px]">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="text-xs rounded-xl border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Filtrar por producto" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos los productos</SelectItem>
              {productsList.map((p) => (
                <SelectItem key={p.id_producto} value={String(p.id_producto)}>
                  {p.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800 text-xs">
          <Button
            size="xs"
            variant={filterPrincipal === null ? "secondary" : "ghost"}
            onClick={() => setFilterPrincipal(null)}
            className="rounded-lg text-xs font-normal"
          >
            Todas
          </Button>
          <Button
            size="xs"
            variant={filterPrincipal === true ? "secondary" : "ghost"}
            onClick={() => setFilterPrincipal(true)}
            className="gap-1 rounded-lg text-xs font-normal"
          >
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Principales
          </Button>
          <Button
            size="xs"
            variant={filterPrincipal === false ? "secondary" : "ghost"}
            onClick={() => setFilterPrincipal(false)}
            className="rounded-lg text-xs font-normal"
          >
            Secundarias
          </Button>
        </div>
      </div>

      {/* Minimalist Cards Grid */}
      {loadingImages ? (
        <div className="py-20 flex flex-col justify-center items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="text-xs text-slate-400">Cargando catálogo de imágenes…</span>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl py-16 text-center text-slate-400 bg-white dark:bg-zinc-950">
          <ImageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
          <p className="font-medium text-xs text-slate-600 dark:text-slate-300">No se encontraron imágenes</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {searchTerm || selectedProductId !== "all"
              ? "Prueba cambiando los filtros de búsqueda."
              : "Sube la primera foto utilizando el botón superior."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredImages.map((img) => (
            <div
              key={`${img.id_producto}-${img.id_imagen}`}
              className="group relative bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
            >
              {/* Image Container with 4:5 Fashion Aspect Ratio */}
              <div className="relative aspect-[4/5] bg-slate-100 dark:bg-zinc-900 overflow-hidden cursor-pointer">
                <img
                  src={img.url}
                  alt={img.nom_producto}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onClick={() => setPreviewImage(img)}
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/400x500?text=Sin+Imagen";
                  }}
                />

                {/* Minimalist Glass Badge for Principal */}
                {img.es_principal && (
                  <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-amber-400 font-medium px-2 py-0.5 rounded-full text-[10px] border border-white/10 shadow-sm flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Principal
                  </div>
                )}

                {/* Floating Glassmorphism Action Bar on Hover */}
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center p-2">
                  <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-white/20 flex items-center gap-1 transform scale-95 group-hover:scale-100 transition-transform">
                    <button
                      type="button"
                      title="Reemplazar foto"
                      onClick={() => {
                        setReplacingImage(img);
                        replaceInputRef.current?.click();
                      }}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {!img.es_principal && (
                      <button
                        type="button"
                        title="Marcar como Principal"
                        onClick={() => setPrincipalMutation.mutate({ idProducto: img.id_producto, idImagen: img.id_imagen })}
                        disabled={setPrincipalMutation.isPending}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Eliminar foto"
                      onClick={() => setImageToDelete(img)}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      title="Ver en HD"
                      onClick={() => window.open(img.url, "_blank")}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Minimalist Integrated Footer */}
              <div className="p-3 bg-white dark:bg-zinc-950 flex flex-col justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate text-xs tracking-tight" title={img.nom_producto}>
                    {img.nom_producto}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                    {img.cod_producto ? `Cód: ${img.cod_producto}` : `ID: #${img.id_producto}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Subir Imágenes */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md rounded-2xl border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Upload className="w-4 h-4 text-slate-500" /> Subir Imagen a Producto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Seleccionar Producto</label>
              <Select value={targetProductId} onValueChange={setTargetProductId}>
                <SelectTrigger className="mt-1.5 text-xs rounded-xl border-slate-200 dark:border-zinc-800">
                  <SelectValue placeholder="Buscar producto destino..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
                  {productsList.map((p) => (
                    <SelectItem key={p.id_producto} value={String(p.id_producto)}>
                      {p.descripcion} ({p.cod_barras || `#${p.id_producto}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Archivos de Imagen</label>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                className="mt-1.5 text-xs rounded-xl border-slate-200 dark:border-zinc-800"
              />
              {uploadFiles.length > 0 && (
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  {uploadFiles.length} archivo(s) listo(s) para subir.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button onClick={handleBatchUpload} disabled={isUploading || uploadFiles.length === 0} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-medium">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Subir a ImageKit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Before Delete */}
      <ConfirmDialog
        open={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={() => imageToDelete && deleteMutation.mutate({ idProducto: imageToDelete.id_producto, idImagen: imageToDelete.id_imagen })}
        title="¿Eliminar foto del producto?"
        description={`Se eliminará la foto de "${imageToDelete?.nom_producto}".`}
        confirmLabel="Eliminar Foto"
        variant="danger"
        isPending={deleteMutation.isPending}
      />

      {/* Fullscreen Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{previewImage?.nom_producto}</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col items-center justify-center">
            {previewImage && (
              <img src={previewImage.url} alt={previewImage.nom_producto} className="max-h-[60vh] object-contain rounded-xl border" />
            )}
          </div>
          <DialogFooter className="justify-between items-center text-xs text-muted-foreground">
            <span className="font-mono">{previewImage?.cod_producto || `ID: #${previewImage?.id_producto}`}</span>
            <Button variant="outline" size="sm" onClick={() => previewImage && window.open(previewImage.url, "_blank")} className="rounded-xl text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver URL Original
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductImageManagerTab;
