import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { listManttoOrdenes } from "@/features/platform/api/platformProducts";
import { getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Orden = {
  id_ot: number;
  tipo: string;
  titulo: string;
  estado: string;
  activo?: string;
};

const PIN_KEY = "horytek_mantto_pin";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function ManttoTecnicoPage() {
  const demo = getDemoPortalCreds("mantenimiento", "tecnico");
  const [hadUnlock] = useState(() => Boolean(sessionStorage.getItem(PIN_KEY)));
  const [unlocked, setUnlocked] = useState(hadUnlock);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
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
      const res = await listManttoOrdenes();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setOrdenes(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar OT"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  if ((!unlocked && autoPhase !== "entering") || (!unlocked && autoPhase === "failed")) {
    return <Navigate to="/login?mode=mantenimiento" replace />;
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
      productId="mantenimiento"
      companyName="Operador Demo Mantenimiento"
      roleLabel="Técnico"
      title="Órdenes asignadas"
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
      ) : ordenes.length === 0 ? (
        <EmptyState title="Sin OT" body="No hay órdenes de trabajo abiertas." />
      ) : (
        <ul className="divide-y divide-black/8 text-sm">
          {ordenes.map((o) => (
            <li key={o.id_ot} className="flex justify-between py-3">
              <span>
                {o.titulo}
                <span className="text-black/45"> · {o.tipo}</span>
              </span>
              <span className="text-xs uppercase text-black/45">{o.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </OpsShell>
  );
}
