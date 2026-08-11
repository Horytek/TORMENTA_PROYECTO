import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCampoVendedor,
  listCampoCheckins,
  listCampoVendedores,
} from "@/features/platform/api/platformProducts";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Vendedor = { id_vendedor: number; nombre: string; activo: number };
type Checkin = {
  id_checkin: number;
  id_vendedor: number;
  lat: number;
  lng: number;
  nota?: string;
  creado_en: string;
  vendedor?: string;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function CampoAdminPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, c] = await Promise.all([listCampoVendedores(), listCampoCheckins()]);
      if (!v.success) throw new Error(v.message || "Sin acceso");
      setVendedores(v.data || []);
      setCheckins(c.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Campo"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <PlatformShell productId="campo" title="Campo">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="campo" title="Campo">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="campo"
      title="Campo"
      subtitle="Asistencias GPS de fuerza de ventas. App vendedor: /campo/vendedor"
    >
      <form
        className="max-w-md space-y-3 border-b border-border/60 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createCampoVendedor({ nombre, pin });
            if (!res.success) throw new Error(res.message);
            toast.success("Vendedor creado");
            setNombre("");
            setPin("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Nuevo vendedor</h2>
        <Label>Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Label>PIN</Label>
        <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required minLength={4} />
        <Button type="submit" size="sm">
          Crear
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Vendedores</h2>
        {vendedores.length === 0 ? (
          <EmptyState title="Aún no hay vendedores" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {vendedores.map((v) => (
              <li key={v.id_vendedor} className="flex justify-between py-2">
                <span>{v.nombre}</span>
                <StatusChip status={v.activo ? "ok" : "cancelado"} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Check-ins recientes</h2>
        {checkins.length === 0 ? (
          <EmptyState title="Sin check-ins" />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {checkins.slice(0, 30).map((c) => (
              <li key={c.id_checkin} className="rounded-md border border-border/50 px-3 py-2">
                <span className="font-medium">{c.vendedor || `Vendedor #${c.id_vendedor}`}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {c.lat}, {c.lng}
                </span>
                {c.nota && <p className="text-xs text-muted-foreground">{c.nota}</p>}
                <p className="text-xs text-muted-foreground">{c.creado_en}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
