import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDeliveryClientePedido,
  getDeliveryPortal,
  getDeliveryClienteToken,
  listDeliveryClientePedidos,
  loginDeliveryCliente,
  setDeliveryClienteToken,
} from "@/features/platform/api/delivery";
import { getDemoPortalCreds, isDemoSlug } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type Portal = { slug: string; nombre: string };
type Pedido = { id_pedido: number; recojo: string; entrega: string; estado: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DeliveryClientePage() {
  const { slug = "" } = useParams();
  const demo = isDemoSlug(slug) ? getDemoPortalCreds("delivery", "cliente") : null;
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getDeliveryClienteToken()));
  const [session, setSession] = useState(hadToken);
  const [recojo, setRecojo] = useState("");
  const [entrega, setEntrega] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadToken, async () => {
    if (!demo?.telefono || !demo.password) throw new Error("Sin credenciales demo");
    const res = await loginDeliveryCliente({
      slug,
      telefono: demo.telefono,
      password: demo.password,
      nombre: demo.nombre,
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

  useEffect(() => {
    if (!session) return;
    listDeliveryClientePedidos()
      .then((res) => {
        if (res.success) setPedidos(res.data || []);
      })
      .catch(() => {
        setDeliveryClienteToken(null);
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
      roleLabel="Cliente"
      title="Nuevo encargo"
      width="narrow"
      onLogout={() => {
        setDeliveryClienteToken(null);
        setSession(false);
      }}
    >
      <PlatformMapPanel
        title="Tracking del encargo"
        footnote="Demo geo Lima"
        center={LIMA_POINTS.jesusMaria}
        route={[LIMA_POINTS.jesusMaria, LIMA_POINTS.surco]}
        markers={[
          {
            id: "r",
            label: "Recojo",
            lng: LIMA_POINTS.jesusMaria[0],
            lat: LIMA_POINTS.jesusMaria[1],
            popup: recojo || "Recojo",
          },
          {
            id: "e",
            label: "Entrega",
            lng: LIMA_POINTS.surco[0],
            lat: LIMA_POINTS.surco[1],
            popup: entrega || "Entrega",
          },
        ]}
        className="h-[220px]"
      />

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createDeliveryClientePedido({
              recojo,
              entrega,
              detalle: detalle || undefined,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Pedido creado");
            setRecojo("");
            setEntrega("");
            setDetalle("");
            const list = await listDeliveryClientePedidos();
            if (list.success) setPedidos(list.data || []);
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <Input
          className={portalInputClass}
          placeholder="Recojo"
          value={recojo}
          onChange={(e) => setRecojo(e.target.value)}
          required
        />
        <Input
          className={portalInputClass}
          placeholder="Entrega"
          value={entrega}
          onChange={(e) => setEntrega(e.target.value)}
          required
        />
        <Input
          className={portalInputClass}
          placeholder="Detalle"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />
        <Button type="submit" className={portalButtonClass}>
          Solicitar
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Mis pedidos</h2>
        {pedidos.length === 0 ? (
          <EmptyState title="Sin pedidos" body="Cuando solicites un encargo, aparece aquí." />
        ) : (
          <ul className="mt-3 divide-y divide-black/8 text-sm">
            {pedidos.map((p) => (
              <li key={p.id_pedido} className="flex justify-between py-2">
                <span>
                  {p.recojo} → {p.entrega}
                </span>
                <span className="text-xs uppercase text-black/45">{p.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OpsShell>
  );
}
