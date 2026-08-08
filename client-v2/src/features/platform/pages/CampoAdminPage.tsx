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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Campo…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Campo</h1>
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
          Plataforma · Oleada E
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Campo</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Asistencias GPS de fuerza de ventas. App vendedor: <code>/campo/vendedor</code>.
        </p>
      </header>

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
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay vendedores.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {vendedores.map((v) => (
              <li key={v.id_vendedor} className="flex justify-between py-2">
                <span>{v.nombre}</span>
                <span className="text-xs text-muted-foreground">{v.activo ? "activo" : "off"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Check-ins recientes</h2>
        {checkins.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin check-ins.</p>
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
    </div>
  );
}
