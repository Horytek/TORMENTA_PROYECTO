import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDeliveryPedido,
  getDeliveryPortal,
  getDeliveryToken,
  listDeliveryPedidos,
  loginDeliveryCliente,
  setDeliveryToken,
} from "@/features/platform/api/delivery";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";

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
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState(Boolean(getDeliveryToken()));
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [recojo, setRecojo] = useState("");
  const [entrega, setEntrega] = useState("");
  const [detalle, setDetalle] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

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
    listDeliveryPedidos()
      .then((res) => {
        if (res.success) setPedidos(res.data || []);
      })
      .catch(() => {
        setDeliveryToken(null);
        setSession(false);
      });
  }, [session]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Delivery</h1>
        <p className="mt-3 text-sm text-destructive">{loadError}</p>
        <Link to="/soluciones/delivery" className="mt-6 inline-block text-sm underline">
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
          Delivery · Cliente
        </p>
        <h1 className="mt-2 text-xl font-semibold">{portal.nombre}</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await loginDeliveryCliente({
                slug,
                telefono,
                password,
                nombre: nombre || undefined,
              });
              if (!res.success) throw new Error(res.message);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <Label>Nombre (nuevo)</Label>
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
        <Link to={`/delivery/${slug}/repartidor`} className="mt-6 text-center text-sm underline">
          Soy repartidor
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Delivery
          </p>
          <h1 className="mt-1 text-xl font-semibold">Nuevo encargo</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDeliveryToken(null);
            setSession(false);
          }}
        >
          Salir
        </Button>
      </header>

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
            const res = await createDeliveryPedido({
              recojo,
              entrega,
              detalle: detalle || undefined,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Pedido creado");
            setRecojo("");
            setEntrega("");
            setDetalle("");
            const list = await listDeliveryPedidos();
            if (list.success) setPedidos(list.data || []);
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <Input placeholder="Recojo" value={recojo} onChange={(e) => setRecojo(e.target.value)} required />
        <Input
          placeholder="Entrega"
          value={entrega}
          onChange={(e) => setEntrega(e.target.value)}
          required
        />
        <Input placeholder="Detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        <Button type="submit" className="w-full">
          Solicitar
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Mis pedidos</h2>
        {pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin pedidos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {pedidos.map((p) => (
              <li key={p.id_pedido} className="flex justify-between py-2">
                <span>
                  {p.recojo} → {p.entrega}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{p.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
