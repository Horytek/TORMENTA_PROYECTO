import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getTaxiPortal,
  getTaxiToken,
  listTaxiViajes,
  loginTaxiConductor,
  patchTaxiViaje,
  setTaxiToken,
} from "@/features/platform/api/taxi";

type Portal = { slug: string; nombre: string };
type Viaje = { id_viaje: number; origen: string; destino: string; estado: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TaxiConductorPage() {
  const { slug = "" } = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState(Boolean(getTaxiToken()));
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
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

  const refresh = async () => {
    const res = await listTaxiViajes();
    if (res.success) setViajes(res.data || []);
  };

  useEffect(() => {
    if (!session) return;
    refresh().catch(() => {
      setTaxiToken(null);
      setSession(false);
    });
  }, [session]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Taxi Conductor</h1>
        <p className="mt-3 text-sm text-destructive">{loadError}</p>
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
          Taxi · Conductor
        </p>
        <h1 className="mt-2 text-xl font-semibold">{portal.nombre}</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await loginTaxiConductor({ slug, telefono, password });
              if (!res.success) throw new Error(res.message);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error de acceso"));
            }
          }}
        >
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
            Entrar
          </Button>
        </form>
        <Link to={`/taxi/${slug}`} className="mt-6 text-center text-sm underline">
          Soy pasajero
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Conductor
          </p>
          <h1 className="mt-1 text-xl font-semibold">Viajes</h1>
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

      {viajes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin viajes.</p>
      ) : (
        <ul className="space-y-3">
          {viajes.map((v) => (
            <li
              key={v.id_viaje}
              className="rounded-md border border-border/60 px-3 py-3 text-sm"
            >
              <p className="font-medium">
                {v.origen} → {v.destino}
              </p>
              <p className="text-xs uppercase text-muted-foreground">{v.estado}</p>
              {v.estado === "asignado" && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    try {
                      const res = await patchTaxiViaje(v.id_viaje, { estado: "en_curso" });
                      if (!res.success) throw new Error(res.message);
                      await refresh();
                    } catch (err: unknown) {
                      toast.error(errMsg(err, "Error"));
                    }
                  }}
                >
                  Iniciar
                </Button>
              )}
              {v.estado === "en_curso" && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    try {
                      const res = await patchTaxiViaje(v.id_viaje, { estado: "finalizado" });
                      if (!res.success) throw new Error(res.message);
                      await refresh();
                    } catch (err: unknown) {
                      toast.error(errMsg(err, "Error"));
                    }
                  }}
                >
                  Finalizar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
