import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addTallerInsumo,
  listTallerOrdenes,
} from "@/features/platform/api/platformProducts";
import { getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { portalInputClass } from "@/features/platform/ui/portalTouch";

type Orden = { id_ot: number; codigo: string; titulo: string; estado: string };

const PIN_KEY = "horytek_taller_pin";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TallerPlantaPage() {
  const demo = getDemoPortalCreds("taller", "operador");
  const [hadUnlock] = useState(() => Boolean(sessionStorage.getItem(PIN_KEY)));
  const [pin, setPin] = useState(() => sessionStorage.getItem(PIN_KEY) || "");
  const [unlocked, setUnlocked] = useState(hadUnlock);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idOt, setIdOt] = useState("");
  const [sku, setSku] = useState("");
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("1");

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadUnlock, async () => {
    if (!demo?.pin || demo.pin.length < 4) throw new Error("Sin PIN demo");
    sessionStorage.setItem(PIN_KEY, demo.pin);
    setPin(demo.pin);
    setUnlocked(true);
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTallerOrdenes();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setOrdenes(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "No se pudieron cargar las OT"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  if ((!unlocked && autoPhase !== "entering") || (!unlocked && autoPhase === "failed")) {
    return <Navigate to="/login?mode=taller" replace />;
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
      productId="taller"
      companyName="Operador Demo Taller"
      roleLabel="Operador"
      title="Planta"
      width="default"
      onLogout={() => {
        sessionStorage.removeItem(PIN_KEY);
        setUnlocked(false);
        setPin("");
      }}
    >
      {loading ? (
        <p className="text-sm text-black/50">Cargando planta…</p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <>
          <form
            className="space-y-3 border-b border-black/8 pb-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await addTallerInsumo({
                  id_ot: Number(idOt),
                  sku,
                  nombre,
                  cantidad: Number(cantidad) || 1,
                });
                if (!res.success) throw new Error(res.message);
                toast.success("Insumo registrado");
                setSku("");
                setNombre("");
                await load();
              } catch (err: unknown) {
                toast.error(errMsg(err, "Error"));
              }
            }}
          >
            <h2 className="text-sm font-semibold">Registrar insumo</h2>
            <p className="text-xs text-black/45">Sesión PIN · {pin ? "••••" : ""}</p>
            <select
              className={`${portalInputClass} rounded-md border border-input bg-transparent px-3`}
              value={idOt}
              onChange={(e) => setIdOt(e.target.value)}
              required
            >
              <option value="">OT…</option>
              {ordenes.map((o) => (
                <option key={o.id_ot} value={o.id_ot}>
                  {o.codigo} — {o.titulo}
                </option>
              ))}
            </select>
            <Input
              className={portalInputClass}
              placeholder="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
            <Input
              className={portalInputClass}
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Input
              type="number"
              className={portalInputClass}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
            <Button type="submit" className="min-h-11">
              Guardar
            </Button>
          </form>

          <section>
            <h2 className="text-sm font-semibold">OT abiertas</h2>
            {ordenes.length === 0 ? (
              <div className="mt-2">
                <EmptyState title="Sin órdenes" body="No hay OT abiertas en planta." />
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-black/8 text-sm">
                {ordenes.map((o) => (
                  <li key={o.id_ot} className="flex justify-between py-2">
                    <span>
                      {o.codigo} — {o.titulo}
                    </span>
                    <span className="text-xs uppercase text-black/45">{o.estado}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </OpsShell>
  );
}
