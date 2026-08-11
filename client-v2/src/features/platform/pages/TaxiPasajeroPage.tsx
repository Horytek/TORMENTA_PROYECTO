import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTaxiViaje,
  getTaxiPasajeroToken,
  getTaxiPortal,
  listTaxiPasajeroViajes,
  loginTaxiPasajero,
  setTaxiPasajeroToken,
} from "@/features/platform/api/taxi";
import { getDemoPortalCreds, isDemoSlug } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

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
  const demo = isDemoSlug(slug) ? getDemoPortalCreds("taxi", "pasajero") : null;
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getTaxiPasajeroToken()));
  const [session, setSession] = useState(hadToken);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [viajes, setViajes] = useState<Viaje[]>([]);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadToken, async () => {
    if (!demo?.telefono || !demo.password) throw new Error("Sin credenciales demo");
    const res = await loginTaxiPasajero({
      slug,
      telefono: demo.telefono,
      password: demo.password,
    });
    if (!res.success) throw new Error(res.message || "Demo no disponible");
    setSession(true);
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getTaxiPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setLoadError(errMsg(e, "Operador no encontrado. Revisa el código en la URL."));
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!session) return;
    listTaxiPasajeroViajes()
      .then((res) => {
        if (res.success) setViajes(res.data || []);
      })
      .catch(() => {
        setTaxiPasajeroToken(null);
        setSession(false);
      });
  }, [session]);

  if (loadError || (!session && autoPhase !== "entering") || (!session && autoPhase === "failed")) {
    return <Navigate to="/login?mode=taxi" replace />;
  }

  if (!portal || autoPhase === "entering") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-12 text-center text-sm text-muted-foreground">
        {autoPhase === "entering" ? "Entrando a la demo…" : "Cargando…"}
      </div>
    );
  }

  return (
    <OpsShell
      productId="taxi"
      companyName={portal.nombre}
      roleLabel="Pasajero"
      title="Pedir viaje"
      width="narrow"
      onLogout={() => {
        setTaxiPasajeroToken(null);
        setSession(false);
      }}
    >
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
            const list = await listTaxiPasajeroViajes();
            if (list.success) setViajes(list.data || []);
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <Input
          className={portalInputClass}
          placeholder="Origen"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          required
        />
        <Input
          className={portalInputClass}
          placeholder="Destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          required
        />
        <Button type="submit" className={portalButtonClass}>
          Solicitar
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Mis viajes</h2>
        {viajes.length === 0 ? (
          <EmptyState title="Sin viajes" body="Cuando solicites un viaje, aparece aquí." />
        ) : (
          <ul className="mt-3 divide-y divide-black/8 text-sm">
            {viajes.map((v) => (
              <li key={v.id_viaje} className="flex justify-between py-2">
                <span>
                  {v.origen} → {v.destino}
                </span>
                <span className="text-xs uppercase text-black/45">{v.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OpsShell>
  );
}
