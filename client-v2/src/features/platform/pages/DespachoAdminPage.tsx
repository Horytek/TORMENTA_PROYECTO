import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addDespachoParada,
  createDespachoRuta,
  getDespachoStatus,
  listDespachoRutas,
} from "@/features/platform/api/platformProducts";

type Ruta = {
  id_ruta: number;
  fecha: string;
  vehiculo: string;
  chofer: string;
  estado: string;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DespachoAdminPage() {
  const [status, setStatus] = useState<{ rutas: number } | null>(null);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehiculo, setVehiculo] = useState("");
  const [chofer, setChofer] = useState("");
  const [idRuta, setIdRuta] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cliente, setCliente] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [st, r] = await Promise.all([getDespachoStatus(), listDespachoRutas()]);
      if (!st.success) throw new Error(st.message || "Sin acceso");
      setStatus(st.data);
      setRutas(r.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Despacho"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Despacho…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Despacho</h1>
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
          Plataforma · Oleada C
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Despacho</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Rutas del día para flota propia. Chofer: <code>/despacho/chofer</code>.
        </p>
        {status && (
          <p className="mt-3 text-xs text-muted-foreground">{status.rutas ?? rutas.length} rutas</p>
        )}
      </header>

      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createDespachoRuta({ fecha, vehiculo, chofer });
              if (!res.success) throw new Error(res.message);
              toast.success("Ruta creada");
              setVehiculo("");
              setChofer("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva ruta</h2>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          <Label>Vehículo</Label>
          <Input value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} required />
          <Label>Chofer</Label>
          <Input value={chofer} onChange={(e) => setChofer(e.target.value)} required />
          <Button type="submit" size="sm">
            Crear ruta
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await addDespachoParada({
                id_ruta: Number(idRuta),
                direccion,
                cliente: cliente || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Parada agregada");
              setDireccion("");
              setCliente("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Agregar parada</h2>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idRuta}
            onChange={(e) => setIdRuta(e.target.value)}
            required
          >
            <option value="">Ruta…</option>
            {rutas.map((r) => (
              <option key={r.id_ruta} value={r.id_ruta}>
                {r.fecha} · {r.vehiculo} · {r.chofer}
              </option>
            ))}
          </select>
          <Input
            placeholder="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
          />
          <Input placeholder="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Rutas</h2>
        {rutas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay rutas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {rutas.map((r) => (
              <li key={r.id_ruta} className="flex justify-between py-2">
                <span>
                  {r.fecha} · {r.vehiculo} · {r.chofer}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{r.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
