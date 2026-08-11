import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPreventaItem,
  createPreventaCampania,
  listPreventaCampanias,
  listPreventaReservas,
} from "@/features/platform/api/platformProducts";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Campania = {
  id_campania: number;
  slug: string;
  nombre: string;
  anticipo_pct: number;
  activo: number;
};

type Reserva = {
  id_reserva: number;
  id_campania?: number;
  cliente_nombre?: string;
  cliente_email?: string;
  cantidad?: number;
  estado?: string;
  sku?: string;
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
  const [reservas, setReservas] = useState<Reserva[]>([]);
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
      const [camp, res] = await Promise.all([listPreventaCampanias(), listPreventaReservas()]);
      if (!camp.success) throw new Error(camp.message || "Sin acceso");
      setCampanias(camp.data || []);
      setReservas(res.success ? res.data || [] : []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Preventa"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <PlatformShell productId="preventa" title="Preventa">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="preventa" title="Preventa">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="preventa"
      title="Preventa"
      subtitle="Campañas de edición limitada. Público: /preventa/{slug}"
    >
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
          <EmptyState title="Aún no hay campañas" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {campanias.map((c) => (
              <li key={c.id_campania} className="flex justify-between py-2">
                <span>
                  {c.nombre}{" "}
                  <span className="text-muted-foreground">(/preventa/{c.slug})</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{c.anticipo_pct}% anticipo</span>
                  <StatusChip status={c.activo ? "ok" : "cancelado"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Reservas</h2>
        {reservas.length === 0 ? (
          <EmptyState title="Sin reservas" body="Las reservas públicas aparecen aquí." />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {reservas.map((r) => (
              <li key={r.id_reserva} className="flex justify-between gap-4 py-2">
                <span>
                  {r.cliente_nombre || "Cliente"}{" "}
                  <span className="text-muted-foreground">
                    ({r.cliente_email || "—"})
                    {r.sku ? ` · ${r.sku}` : ""}
                    {r.cantidad != null ? ` × ${r.cantidad}` : ""}
                  </span>
                </span>
                {r.estado ? <StatusChip status={r.estado} /> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
