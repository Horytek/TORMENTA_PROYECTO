import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPreventaItem,
  createPreventaCampania,
  listPreventaCampanias,
} from "@/features/platform/api/platformProducts";

type Campania = {
  id_campania: number;
  slug: string;
  nombre: string;
  anticipo_pct: number;
  activo: number;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function PreventaAdminPage() {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [anticipo, setAnticipo] = useState("30");
  const [idCampania, setIdCampania] = useState("");
  const [sku, setSku] = useState("");
  const [nombreItem, setNombreItem] = useState("");
  const [precio, setPrecio] = useState("");
  const [cupo, setCupo] = useState("100");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPreventaCampanias();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setCampanias(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Preventa"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Preventa…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Preventa</h1>
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Plataforma · Oleada B
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Preventa</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Campañas de edición limitada. Público: <code>/preventa/&#123;slug&#125;</code>.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createPreventaCampania({
                slug,
                nombre,
                anticipo_pct: Number(anticipo) || 30,
              });
              if (!res.success) throw new Error(res.message);
              toast.success(`Campaña lista: /preventa/${slug}`);
              setSlug("");
              setNombre("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo crear"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva campaña</h2>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Anticipo %</Label>
            <Input type="number" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
          </div>
          <Button type="submit" size="sm">
            Crear campaña
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await addPreventaItem({
                id_campania: Number(idCampania),
                sku,
                nombre: nombreItem,
                precio: Number(precio),
                cupo: Number(cupo) || 100,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Ítem agregado");
              setSku("");
              setNombreItem("");
              setPrecio("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo agregar"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Ítem de campaña</h2>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idCampania}
            onChange={(e) => setIdCampania(e.target.value)}
            required
          >
            <option value="">Campaña…</option>
            {campanias.map((c) => (
              <option key={c.id_campania} value={c.id_campania}>
                {c.nombre}
              </option>
            ))}
          </select>
          <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
          <Input
            placeholder="Nombre"
            value={nombreItem}
            onChange={(e) => setNombreItem(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
            <Input type="number" placeholder="Cupo" value={cupo} onChange={(e) => setCupo(e.target.value)} />
          </div>
          <Button type="submit" size="sm">
            Agregar ítem
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Campañas</h2>
        {campanias.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay campañas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {campanias.map((c) => (
              <li key={c.id_campania} className="flex justify-between py-2">
                <span>
                  {c.nombre}{" "}
                  <span className="text-muted-foreground">(/preventa/{c.slug})</span>
                </span>
                <span className="text-xs text-muted-foreground">{c.anticipo_pct}% anticipo</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
