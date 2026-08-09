import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCampoCheckin,
  listCampoVendedores,
} from "@/features/platform/api/platformProducts";
import { getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type Vendedor = { id_vendedor: number; nombre: string };

const PIN_KEY = "horytek_campo_pin";
const VEND_KEY = "horytek_campo_vendedor";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function CampoVendedorPage() {
  const demo = getDemoPortalCreds("campo", "vendedor");
  const [hadUnlock] = useState(() =>
    Boolean(sessionStorage.getItem(PIN_KEY) && sessionStorage.getItem(VEND_KEY))
  );
  const [unlocked, setUnlocked] = useState(hadUnlock);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendorsReady, setVendorsReady] = useState(false);
  const [idVendedor, setIdVendedor] = useState(sessionStorage.getItem(VEND_KEY) || "");
  const [nota, setNota] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listCampoVendedores()
      .then((res) => {
        if (!res.success) return;
        setVendedores(res.data || []);
      })
      .catch(() => {})
      .finally(() => setVendorsReady(true));
  }, []);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadUnlock && vendorsReady, async () => {
    if (!demo?.pin || demo.pin.length < 4) throw new Error("Sin PIN demo");
    let vendId = "";
    if (demo.nombre) {
      const match = vendedores.find((v) => v.nombre === demo.nombre);
      if (match) vendId = String(match.id_vendedor);
    }
    if (!vendId) throw new Error("Sin vendedor demo");
    sessionStorage.setItem(PIN_KEY, demo.pin);
    sessionStorage.setItem(VEND_KEY, vendId);
    setIdVendedor(vendId);
    setUnlocked(true);
  });

  useEffect(() => {
    if (!unlocked || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error("No se pudo obtener ubicación")
    );
  }, [unlocked]);

  if (!unlocked) {
    if (!vendorsReady || autoPhase === "entering") {
      return (
        <div className="flex min-h-dvh items-center justify-center p-12 text-center text-sm text-muted-foreground">
          {autoPhase === "entering" ? "Entrando a la demo…" : "Cargando…"}
        </div>
      );
    }
    return <Navigate to="/login?mode=campo" replace />;
  }

  return (
    <OpsShell
      productId="campo"
      companyName="Operador Demo Campo"
      roleLabel="Vendedor"
      title="Marcar asistencia"
      width="narrow"
      onLogout={() => {
        sessionStorage.removeItem(PIN_KEY);
        sessionStorage.removeItem(VEND_KEY);
        setUnlocked(false);
      }}
    >
      <p className="text-sm text-black/55">
        {coords
          ? `Ubicación: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
          : "Obteniendo GPS…"}
      </p>

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!coords) {
            toast.error("Espera la ubicación GPS");
            return;
          }
          setSending(true);
          try {
            const res = await createCampoCheckin({
              id_vendedor: Number(idVendedor),
              lat: coords.lat,
              lng: coords.lng,
              nota: nota || undefined,
              pin: sessionStorage.getItem(PIN_KEY) || undefined,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Check-in registrado");
            setNota("");
          } catch (err: unknown) {
            toast.error(errMsg(err, "No se pudo marcar"));
          } finally {
            setSending(false);
          }
        }}
      >
        <Input
          className={portalInputClass}
          placeholder="Nota (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        <Button type="submit" className={portalButtonClass} disabled={sending || !coords}>
          {sending ? "Enviando…" : "Marcar check-in"}
        </Button>
      </form>
    </OpsShell>
  );
}
