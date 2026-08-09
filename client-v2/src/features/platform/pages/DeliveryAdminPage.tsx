import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignDeliveryPedido,
  createDeliveryRepartidor,
  getDeliveryAdminToken,
  listDeliveryPedidos,
  listDeliveryRepartidores,
  setDeliveryAdminToken,
} from "@/features/platform/api/delivery";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";

type Pedido = {
  id_pedido: number;
  recojo: string;
  entrega: string;
  estado: string;
};
type Repartidor = { id_repartidor: number; nombre: string; telefono?: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DeliveryAdminPage() {
  const [session, setSession] = useState(Boolean(getDeliveryAdminToken()));
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repNombre, setRepNombre] = useState("");
  const [repTel, setRepTel] = useState("");
  const [repPass, setRepPass] = useState("");
  const [assignFor, setAssignFor] = useState<number | null>(null);
  const [pickRep, setPickRep] = useState<number | "">("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, r] = await Promise.all([listDeliveryPedidos(), listDeliveryRepartidores()]);
      if (!p.success) throw new Error(p.message || "Sin acceso");
      setPedidos(p.data || []);
      setRepartidores(r.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Delivery"));
      setDeliveryAdminToken(null);
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) {
    return <Navigate to="/login?mode=delivery" replace />;
  }

  if (loading && pedidos.length === 0) {
    return (
      <PlatformShell productId="delivery" companyName="Operador Demo Delivery" title="Control">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }

  if (error) {
    return (
      <PlatformShell productId="delivery" companyName="Operador Demo Delivery" title="Delivery">
        <p className="text-sm text-destructive">{error}</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="delivery"
      companyName="Operador Demo Delivery"
      roleLabel="Admin"
      title="Control"
      subtitle="Pedidos y repartidores"
      onLogout={() => {
        setDeliveryAdminToken(null);
        setSession(false);
      }}
    >
      <form
        className="max-w-md space-y-3 border-b border-black/10 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createDeliveryRepartidor({
              nombre: repNombre,
              telefono: repTel || undefined,
              password: repPass,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Repartidor creado");
            setRepNombre("");
            setRepTel("");
            setRepPass("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Nuevo repartidor</h2>
        <Input placeholder="Nombre" value={repNombre} onChange={(e) => setRepNombre(e.target.value)} required />
        <Input placeholder="Teléfono" value={repTel} onChange={(e) => setRepTel(e.target.value)} />
        <Input
          type="password"
          placeholder="Contraseña"
          value={repPass}
          onChange={(e) => setRepPass(e.target.value)}
          required
        />
        <Button type="submit" size="sm">
          Crear
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Repartidores</h2>
        {repartidores.length === 0 ? (
          <p className="mt-2 text-sm text-black/50">Sin repartidores.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/8 text-sm">
            {repartidores.map((r) => (
              <li key={r.id_repartidor} className="py-2">
                {r.nombre}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Pedidos</h2>
        {pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-black/50">Sin pedidos.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {pedidos.map((p) => (
              <li
                key={p.id_pedido}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-black/10 bg-white/70 px-3 py-2"
              >
                <span>
                  #{p.id_pedido} · {p.recojo} → {p.entrega}
                </span>
                <div className="flex items-center gap-2">
                  <StatusChip status={p.estado} />
                  {p.estado === "solicitado" ? (
                    assignFor === p.id_pedido ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded border px-2 py-1 text-sm"
                          value={pickRep}
                          onChange={(e) =>
                            setPickRep(e.target.value ? Number(e.target.value) : "")
                          }
                        >
                          <option value="">Repartidor…</option>
                          {repartidores.map((r) => (
                            <option key={r.id_repartidor} value={r.id_repartidor}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!pickRep}
                          onClick={async () => {
                            try {
                              if (!pickRep) return;
                              const res = await assignDeliveryPedido(p.id_pedido, Number(pickRep));
                              if (!res.success) throw new Error(res.message);
                              toast.success("Asignado");
                              setAssignFor(null);
                              await load();
                            } catch (err: unknown) {
                              toast.error(errMsg(err, "Error"));
                            }
                          }}
                        >
                          Confirmar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={repartidores.length === 0}
                        onClick={() => {
                          setAssignFor(p.id_pedido);
                          setPickRep(repartidores[0]?.id_repartidor ?? "");
                        }}
                      >
                        Asignar
                      </Button>
                    )
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
