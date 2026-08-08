import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTaxiViaje,
  getTaxiPortal,
  getTaxiToken,
  listTaxiViajes,
  loginTaxiPasajero,
  setTaxiToken,
} from "@/features/platform/api/taxi";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";

type Portal = { slug: string; nombre: string };
type Viaje = { id_viaje: number; origen: string; destino: string; estado: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TaxiPasajeroPage() {
  const { slug = "" } = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState(Boolean(getTaxiToken()));
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [viajes, setViajes] = useState<Viaje[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTaxiPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setLoadError(errMsg(e, "Operador no encontrado"));
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!session) return;
    listTaxiViajes()
      .then((res) => {
        if (res.success) setViajes(res.data || []);
      })
      .catch(() => {
        setTaxiToken(null);
        setSession(false);
      });
  }, [session]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Taxi</h1>
        <p className="mt-3 text-sm text-destructive">{loadError}</p>
        <Link to="/soluciones/taxi" className="mt-6 inline-block text-sm underline">
          Ver producto
        </Link>
      </div>
    );
  }

  if (!portal) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Taxi · Pasajero
        </p>
        <h1 className="mt-2 text-xl font-semibold">{portal.nombre}</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await loginTaxiPasajero({
                slug,
                telefono,
                password,
                nombre: nombre || undefined,
              });
              if (!res.success) throw new Error(res.message);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error de acceso"));
            }
          }}
        >
          <Label>Nombre (si es nuevo)</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Label>Teléfono</Label>
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          <Label>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Entrar / Registrarse
          </Button>
        </form>
        <Link to={`/taxi/${slug}/conductor`} className="mt-6 text-center text-sm underline">
          Soy conductor
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Taxi
          </p>
          <h1 className="mt-1 text-xl font-semibold">Pedir viaje</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setTaxiToken(null);
            setSession(false);
          }}
        >
          Salir
        </Button>
      </header>

      <PlatformMapPanel
        title="Mapa del viaje"
        footnote="Demo geo Lima"
        center={LIMA_POINTS.sanIsidro}
        route={[LIMA_POINTS.sanIsidro, LIMA_POINTS.miraflores]}
        markers={[
          {
            id: "o",
            label: "Origen",
            lng: LIMA_POINTS.sanIsidro[0],
            lat: LIMA_POINTS.sanIsidro[1],
            popup: origen || "Origen",
          },
          {
            id: "d",
            label: "Destino",
            lng: LIMA_POINTS.miraflores[0],
            lat: LIMA_POINTS.miraflores[1],
            popup: destino || "Destino",
          },
        ]}
        className="h-[220px]"
      />

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createTaxiViaje({ origen, destino });
            if (!res.success) throw new Error(res.message);
            toast.success("Viaje solicitado");
            setOrigen("");
            setDestino("");
            const list = await listTaxiViajes();
            if (list.success) setViajes(list.data || []);
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <Input placeholder="Origen" value={origen} onChange={(e) => setOrigen(e.target.value)} required />
        <Input
          placeholder="Destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Solicitar
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Mis viajes</h2>
        {viajes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin viajes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {viajes.map((v) => (
              <li key={v.id_viaje} className="flex justify-between py-2">
                <span>
                  {v.origen} → {v.destino}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{v.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
