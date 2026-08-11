import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { listDespachoRutas } from "@/features/platform/api/platformProducts";
import { getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Ruta = {
  id_ruta: number;
  fecha: string;
  vehiculo: string;
  chofer: string;
  estado: string;
  paradas?: { id_parada: number; secuencia: number; direccion: string; cliente?: string; estado: string }[];
};

const PIN_KEY = "horytek_despacho_pin";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DespachoChoferPage() {
  const demo = getDemoPortalCreds("despacho", "chofer");
  const [hadUnlock] = useState(() => Boolean(sessionStorage.getItem(PIN_KEY)));
  const [unlocked, setUnlocked] = useState(hadUnlock);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadUnlock, async () => {
    if (!demo?.pin || demo.pin.length < 4) throw new Error("Sin PIN demo");
    sessionStorage.setItem(PIN_KEY, demo.pin);
    setUnlocked(true);
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listDespachoRutas();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setRutas(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar rutas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  if ((!unlocked && autoPhase !== "entering") || (!unlocked && autoPhase === "failed")) {
    return <Navigate to="/login?mode=despacho" replace />;
  }

  if (autoPhase === "entering") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-12 text-center text-sm text-muted-foreground">
        Entrando a la demo…
      </div>
    );
  }

  return (
    <OpsShell
      productId="despacho"
      companyName="Operador Demo Despacho"
      roleLabel="Chofer"
      title="Mis rutas"
      width="default"
      onLogout={() => {
        sessionStorage.removeItem(PIN_KEY);
        setUnlocked(false);
      }}
    >
      {loading ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : rutas.length === 0 ? (
        <EmptyState title="Sin rutas" body="No hay rutas asignadas." />
      ) : (
        <ul className="space-y-6">
          {rutas.map((r) => (
            <li key={r.id_ruta} className="border-b border-black/8 pb-4">
              <p className="text-sm font-medium">
                {r.fecha} · {r.vehiculo}
              </p>
              <p className="text-xs uppercase text-black/45">{r.estado}</p>
              {(r.paradas || []).length === 0 ? (
                <p className="mt-2 text-sm text-black/50">Sin paradas.</p>
              ) : (
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                  {(r.paradas || []).map((p) => (
                    <li key={p.id_parada}>
                      {p.direccion}
                      {p.cliente ? ` (${p.cliente})` : ""} — {p.estado}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ul>
      )}
    </OpsShell>
  );
}
