import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMayoristaTienda,
  listMayoristaTiendas,
} from "@/features/platform/api/mayorista";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { MayoristaAdminShell, mayoristaErr } from "./MayoristaAdminShell";

type Tienda = {
  id_tienda: number;
  slug: string;
  nombre: string;
  activo: number;
  whatsapp?: string | null;
};

export default function MayoristaPortalesPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMayoristaTiendas();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setTiendas(res.data || []);
    } catch (e: unknown) {
      setError(mayoristaErr(e, "Error al cargar portales"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tiendas;
    return tiendas.filter(
      (t) =>
        t.nombre.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }, [tiendas, query]);

  return (
    <MayoristaAdminShell
      title="Portales"
      subtitle="Cada portal tiene un slug público: /b2b/{slug}."
    >
      {loading ? <p className="text-sm text-black/50">Cargando…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <>
          <form
            className="grid gap-3 border-b border-black/8 pb-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const res = await createMayoristaTienda({
                  slug: slug.trim().toLowerCase(),
                  nombre: nombre.trim(),
                  whatsapp: whatsapp.trim() || undefined,
                });
                if (!res.success) throw new Error(res.message);
                toast.success(`Portal listo: /b2b/${slug.trim().toLowerCase()}`);
                setSlug("");
                setNombre("");
                setWhatsapp("");
                await load();
              } catch (err: unknown) {
                toast.error(mayoristaErr(err, "No se pudo crear el portal"));
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="portal_slug">Slug</Label>
              <Input
                id="portal_slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="distribuidora-norte"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portal_nombre">Nombre</Label>
              <Input
                id="portal_nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Distribuidora Norte"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="portal_wa">WhatsApp (opcional)</Label>
              <Input
                id="portal_wa"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="51999900000"
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90 sm:col-span-2 lg:col-span-1"
            >
              {saving ? "Creando…" : "Crear portal"}
            </Button>
          </form>

          <FilterBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Filtrar portales…"
            activeStatus="all"
            onStatusChange={() => {}}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="Sin portales"
              body="Crea el primero con el formulario de arriba."
            />
          ) : (
            <ul className="divide-y divide-black/8 border-y border-black/8">
              {filtered.map((t) => (
                <li
                  key={t.id_tienda}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <p className="font-medium tracking-tight">{t.nombre}</p>
                    <a
                      href={`/b2b/${t.slug}`}
                      className="text-[13px] text-black/50 underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      /b2b/{t.slug}
                    </a>
                  </div>
                  <StatusChip status={t.activo ? "ok" : "cancelado"} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </MayoristaAdminShell>
  );
}
