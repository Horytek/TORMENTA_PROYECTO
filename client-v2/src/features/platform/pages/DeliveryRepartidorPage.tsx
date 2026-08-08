import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDeliveryPortal,
  getDeliveryToken,
  listDeliveryPedidos,
  loginDeliveryRepartidor,
  patchDeliveryPedido,
  setDeliveryToken,
} from "@/features/platform/api/delivery";

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
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState(Boolean(getDeliveryToken()));
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
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

  const refresh = async () => {
    const res = await listDeliveryPedidos();
    if (res.success) setPedidos(res.data || []);
  };

  useEffect(() => {
    if (!session) return;
    refresh().catch(() => {
      setDeliveryToken(null);
      setSession(false);
    });
  }, [session]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Repartidor</h1>
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
          Delivery · Repartidor
        </p>
        <h1 className="mt-2 text-xl font-semibold">{portal.nombre}</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await loginDeliveryRepartidor({ slug, telefono, password });
              if (!res.success) throw new Error(res.message);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
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
        <Link to={`/delivery/${slug}`} className="mt-6 text-center text-sm underline">
          Soy cliente
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Repartidor
          </p>
          <h1 className="mt-1 text-xl font-semibold">Pedidos</h1>
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

      {pedidos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin pedidos.</p>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li key={p.id_pedido} className="rounded-md border border-border/60 px-3 py-3 text-sm">
              <p className="font-medium">
                {p.recojo} → {p.entrega}
              </p>
              <p className="text-xs uppercase text-muted-foreground">{p.estado}</p>
              {p.estado === "asignado" && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    try {
                      await patchDeliveryPedido(p.id_pedido, { estado: "en_camino" });
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
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    try {
                      await patchDeliveryPedido(p.id_pedido, { estado: "entregado" });
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
    </div>
  );
}
