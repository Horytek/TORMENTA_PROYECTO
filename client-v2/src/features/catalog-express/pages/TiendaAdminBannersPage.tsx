import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Image as ImageIcon } from "lucide-react";
import { adminBanners, adminSaveBanner } from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";

export default function TiendaAdminBannersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ titulo: "", subtitulo: "", imagen_url: "" });
  const { data: banners, isLoading } = useQuery({
    queryKey: ["tienda-admin-banners"],
    queryFn: adminBanners,
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <ImageIcon className="size-6" /> Banners
        </h1>
        <p className="text-sm text-stone-500 mt-1">Promos visibles en el home de la vitrina.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-4">
        <input
          className="h-10 border rounded-lg px-3 text-sm"
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
        />
        <input
          className="h-10 border rounded-lg px-3 text-sm"
          placeholder="Subtítulo"
          value={form.subtitulo}
          onChange={(e) => setForm((f) => ({ ...f, subtitulo: e.target.value }))}
        />
        <input
          className="h-10 border rounded-lg px-3 text-sm min-w-[200px]"
          placeholder="URL imagen"
          value={form.imagen_url}
          onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))}
        />
        <Button
          size="sm"
          onClick={async () => {
            try {
              await adminSaveBanner(form);
              qc.invalidateQueries({ queryKey: ["tienda-admin-banners"] });
              setForm({ titulo: "", subtitulo: "", imagen_url: "" });
              toast.success("Banner creado");
            } catch {
              toast.error("No se pudo crear");
            }
          }}
        >
          Crear banner
        </Button>
      </div>

      <ul className="text-sm space-y-1">
        {(banners || []).map((b: { id_banner: number; titulo: string; subtitulo?: string }) => (
          <li key={b.id_banner} className="border rounded-lg px-3 py-2 bg-white">
            <span className="font-medium">{b.titulo}</span>
            {b.subtitulo && <span className="text-stone-400"> · {b.subtitulo}</span>}
          </li>
        ))}
        {!isLoading && !(banners || []).length && (
          <li className="text-stone-400 text-center py-6">Sin banners.</li>
        )}
      </ul>
    </div>
  );
}
