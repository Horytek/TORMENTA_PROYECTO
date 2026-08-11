import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDeliveryAdminToken,
  getDeliveryOperador,
  updateDeliveryOperador,
} from "@/features/platform/api/delivery";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { DeliveryAdminShell, deliveryErr } from "./DeliveryAdminShell";

type Operador = {
  id_operador: number;
  slug: string;
  nombre: string;
  activo: number;
  plan_flag?: string | null;
  portal_cliente: string;
  portal_repartidor: string;
};

export default function DeliveryOperadorPage() {
  const [session, setSession] = useState(Boolean(getDeliveryAdminToken()));
  const [op, setOp] = useState<Operador | null>(null);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDeliveryOperador();
      if (!res.success) throw new Error(res.message || "Error");
      setOp(res.data);
      setNombre(res.data?.nombre || "");
    } catch (e: unknown) {
      toast.error(deliveryErr(e, "Error al cargar operador"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void load();
  }, [session]);

  if (!session) return <Navigate to="/login?mode=delivery" replace />;

  return (
    <DeliveryAdminShell
      title="Operador"
      subtitle="Datos del entitlement y enlaces a portales"
      onLogout={() => setSession(false)}
      companyName={op?.nombre}
    >
      {loading && !op ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : op ? (
        <div className="space-y-6">
          <section className="space-y-3 rounded-lg border border-black/10 bg-white/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={Number(op.activo) === 1 ? "activo" : "inactivo"} />
              {op.plan_flag ? (
                <span className="text-[12px] text-black/45">Plan: {op.plan_flag}</span>
              ) : null}
            </div>
            <p className="text-[13px] text-black/55">
              Slug (inmutable): <span className="font-mono text-foreground">{op.slug}</span>
            </p>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await updateDeliveryOperador({ nombre: nombre.trim() });
                  if (!res.success) throw new Error(res.message);
                  toast.success("Nombre actualizado");
                  await load();
                } catch (err: unknown) {
                  toast.error(deliveryErr(err, "Error"));
                }
              }}
            >
              <div className="min-w-[200px] flex-1 space-y-1">
                <label className="text-[12px] text-black/50" htmlFor="op_nombre">
                  Nombre comercial
                </label>
                <Input
                  id="op_nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="border-0 bg-[var(--platform-accent)] text-white">
                Guardar
              </Button>
            </form>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Portales</h2>
            <ul className="divide-y divide-black/8 border-y border-black/8 text-sm">
              <li className="flex items-center justify-between py-2.5">
                <span>Cliente</span>
                <Link
                  to={op.portal_cliente}
                  className="font-mono text-[13px] text-[var(--platform-accent)] underline-offset-2 hover:underline"
                >
                  {op.portal_cliente}
                </Link>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span>Repartidor</span>
                <Link
                  to={op.portal_repartidor}
                  className="font-mono text-[13px] text-[var(--platform-accent)] underline-offset-2 hover:underline"
                >
                  {op.portal_repartidor}
                </Link>
              </li>
            </ul>
          </section>
        </div>
      ) : (
        <p className="text-sm text-destructive">No se pudo cargar el operador.</p>
      )}
    </DeliveryAdminShell>
  );
}
