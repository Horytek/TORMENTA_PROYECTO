import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getTaxiConductorToken,
  getTaxiPortal,
  listTaxiConductorViajes,
  loginTaxiConductor,
  patchTaxiConductorViaje,
  setTaxiConductorToken,
} from "@/features/platform/api/taxi";
import { getDemoPortalCreds, isDemoSlug } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

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
  const demo = isDemoSlug(slug) ? getDemoPortalCreds("taxi", "conductor") : null;
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getTaxiConductorToken()));
  const [session, setSession] = useState(hadToken);
  const [viajes, setViajes] = useState<Viaje[]>([]);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadToken, async () => {
    if (!demo?.telefono || !demo.password) throw new Error("Sin credenciales demo");
    const res = await loginTaxiConductor({
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
        setLoadError(errMsg(e, "Operador no encontrado"));
      }
    })();
  }, [slug]);

  const refresh = async () => {
    const res = await listTaxiConductorViajes();
    if (res.success) setViajes(res.data || []);
  };

  useEffect(() => {
    if (!session) return;
    refresh().catch(() => {
      setTaxiConductorToken(null);
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
      roleLabel="Conductor"
      title="Viajes"
      width="narrow"
      onLogout={() => {
        setTaxiConductorToken(null);
        setSession(false);
      }}
    >
      {viajes.length === 0 ? (
        <EmptyState title="Sin viajes disponibles" body="Cuando el operador asigne o haya solicitudes, aparecen aquí." />
      ) : (
        <ul className="space-y-3">
          {viajes.map((v) => (
            <li key={v.id_viaje} className="rounded-lg border border-black/10 bg-white/80 px-4 py-4 text-sm">
              <p className="font-medium">
                {v.origen} → {v.destino}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-black/45">{v.estado}</p>
              {v.estado === "solicitado" && (
                <Button
                  className="mt-3 min-h-11"
                  onClick={async () => {
                    try {
                      const res = await patchTaxiConductorViaje(v.id_viaje, { estado: "asignado" });
                      if (!res.success) throw new Error(res.message);
                      await refresh();
                    } catch (err: unknown) {
                      toast.error(errMsg(err, "Error"));
                    }
                  }}
                >
                  Aceptar
                </Button>
              )}
              {v.estado === "asignado" && (
                <Button
                  className="mt-3 min-h-11"
                  onClick={async () => {
                    try {
                      const res = await patchTaxiConductorViaje(v.id_viaje, { estado: "en_curso" });
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
                  className="mt-3 min-h-11"
                  onClick={async () => {
                    try {
                      const res = await patchTaxiConductorViaje(v.id_viaje, { estado: "finalizado" });
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
    </OpsShell>
  );
}
