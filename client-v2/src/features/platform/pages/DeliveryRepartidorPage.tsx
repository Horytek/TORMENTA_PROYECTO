import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getDeliveryPortal,
  getDeliveryRepartidorToken,
  listDeliveryRepartidorPedidos,
  loginDeliveryRepartidor,
  patchDeliveryRepartidorPedido,
  setDeliveryRepartidorToken,
} from "@/features/platform/api/delivery";
import { getDemoPortalCreds, isDemoSlug } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Portal = { slug: string; nombre: string };
type Pedido = { id_pedido: number; recojo: string; entrega: string; estado: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DeliveryRepartidorPage() {
  const { slug = "" } = useParams();
  const demo = isDemoSlug(slug) ? getDemoPortalCreds("delivery", "repartidor") : null;
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getDeliveryRepartidorToken()));
  const [session, setSession] = useState(hadToken);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadToken, async () => {
    if (!demo?.telefono || !demo.password) throw new Error("Sin credenciales demo");
    const res = await loginDeliveryRepartidor({
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
        const res = await getDeliveryPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setLoadError(errMsg(e, "Operador no encontrado"));
      }
    })();
  }, [slug]);

  const refresh = async () => {
    const res = await listDeliveryRepartidorPedidos();
    if (res.success) setPedidos(res.data || []);
  };

  useEffect(() => {
    if (!session) return;
    refresh().catch(() => {
      setDeliveryRepartidorToken(null);
      setSession(false);
    });
  }, [session]);

  if (loadError || (!session && autoPhase !== "entering") || (!session && autoPhase === "failed")) {
    return <Navigate to="/login?mode=delivery" replace />;
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
      productId="delivery"
      companyName={portal.nombre}
      roleLabel="Repartidor"
      title="Pedidos"
      width="narrow"
      onLogout={() => {
        setDeliveryRepartidorToken(null);
        setSession(false);
      }}
    >
      {pedidos.length === 0 ? (
        <EmptyState title="Sin pedidos" body="Cuando te asignen encargos, aparecen aquí." />
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li key={p.id_pedido} className="rounded-lg border border-black/10 bg-white/80 px-4 py-4 text-sm">
              <p className="font-medium">
                {p.recojo} → {p.entrega}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-black/45">{p.estado}</p>
              {p.estado === "asignado" && (
                <Button
                  className="mt-3 min-h-11"
                  onClick={async () => {
                    try {
                      await patchDeliveryRepartidorPedido(p.id_pedido, { estado: "en_camino" });
                      await refresh();
                    } catch (err: unknown) {
                      toast.error(errMsg(err, "Error"));
                    }
                  }}
                >
                  En camino
                </Button>
              )}
              {p.estado === "en_camino" && (
                <Button
                  className="mt-3 min-h-11"
                  onClick={async () => {
                    try {
                      await patchDeliveryRepartidorPedido(p.id_pedido, { estado: "entregado" });
                      await refresh();
                    } catch (err: unknown) {
                      toast.error(errMsg(err, "Error"));
                    }
                  }}
                >
                  Entregado
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </OpsShell>
  );
}
