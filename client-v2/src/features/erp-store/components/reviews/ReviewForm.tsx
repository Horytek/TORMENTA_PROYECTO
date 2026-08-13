import { useState } from "react";
import { toast } from "sonner";
import { createReview, uploadReviewMedia } from "../../api/erpStore";
import { ReviewStars } from "./ReviewStars";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
  tipo: "producto" | "pedido" | "sucursal" | "general";
  id_producto?: number;
  id_orden?: number;
  id_sucursal?: number;
  allowImagenes?: boolean;
  maxImagenes?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const TEMAS = [
  { value: "", label: "Sin tema" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "pago", label: "Pago" },
  { value: "atencion", label: "Atención" },
  { value: "delivery", label: "Delivery" },
  { value: "recojo", label: "Recojo" },
  { value: "ecommerce", label: "Tienda online" },
  { value: "otro", label: "Otro" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReviewForm({
  slug,
  tipo,
  id_producto,
  id_orden,
  id_sucursal,
  allowImagenes = true,
  maxImagenes = 5,
  onSuccess,
  onCancel,
}: Props) {
  const [rating, setRating] = useState(5);
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [tema, setTema] = useState("");
  const [mediaItems, setMediaItems] = useState<{ url: string; file_id?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onPickFiles(files: FileList | null) {
    if (!files?.length || !allowImagenes) return;
    const room = maxImagenes - mediaItems.length;
    if (room <= 0) {
      toast.message(`Máximo ${maxImagenes} imágenes`);
      return;
    }
    setUploading(true);
    try {
      const next: { url: string; file_id?: string }[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        if (!file.type.startsWith("image/")) continue;
        const base64 = await fileToBase64(file);
        const res = await uploadReviewMedia(slug, {
          data_base64: base64,
          file_name: file.name,
        });
        if (res?.data?.url) {
          next.push({ url: res.data.url, file_id: res.data.file_id });
        }
      }
      if (next.length) setMediaItems((prev) => [...prev, ...next]);
    } catch {
      toast.error("No se pudieron subir las imágenes");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      toast.error("Elige una calificación");
      return;
    }
    setSaving(true);
    try {
      await createReview(slug, {
        tipo,
        rating,
        titulo: titulo.trim() || undefined,
        comentario: comentario.trim() || undefined,
        tema_general: tipo === "general" && tema ? tema : undefined,
        id_producto,
        id_orden,
        id_sucursal,
        media: mediaItems,
      });
      toast.success("¡Gracias! Tu opinión fue enviada.");
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "No se pudo enviar la opinión";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Calificación</p>
        <ReviewStars value={rating} size="lg" interactive onChange={setRating} />
      </div>
      <div>
        <label className="text-sm font-medium">Título (opcional)</label>
        <input
          className="mt-1 w-full h-10 px-3 rounded-lg border store-hairline bg-[var(--vitrina-elevated)] text-sm"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          placeholder="Resumen breve"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Comentario (opcional)</label>
        <textarea
          className="mt-1 w-full min-h-[100px] px-3 py-2 rounded-lg border store-hairline bg-[var(--vitrina-elevated)] text-sm"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={2000}
          placeholder="Cuéntanos tu experiencia"
        />
      </div>
      {tipo === "general" && (
        <div>
          <label className="text-sm font-medium">Tema</label>
          <select
            className="mt-1 w-full h-10 px-3 rounded-lg border store-hairline bg-[var(--vitrina-elevated)] text-sm"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
          >
            {TEMAS.map((t) => (
              <option key={t.value || "none"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {allowImagenes && (
        <div>
          <label className="text-sm font-medium">Fotos (opcional)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-1 block w-full text-sm"
            disabled={uploading || mediaItems.length >= maxImagenes}
            onChange={(e) => onPickFiles(e.target.files)}
          />
          {mediaItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {mediaItems.map((m) => (
                <div key={m.url} className="relative size-14 rounded overflow-hidden border store-hairline">
                  <img src={m.url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 text-[10px] bg-black/60 text-white py-0.5"
                    onClick={() => setMediaItems((prev) => prev.filter((u) => u.url !== m.url))}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Enviando…" : "Publicar opinión"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
