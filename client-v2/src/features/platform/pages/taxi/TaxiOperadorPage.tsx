import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getTaxiAdminToken,
  getTaxiOperador,
  updateTaxiOperador,
} from "@/features/platform/api/taxi";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { TaxiAdminShell, taxiErr } from "./TaxiAdminShell";

type Operador = {
  id_operador: number;
  slug: string;
  nombre: string;
  activo: number;
  plan_flag?: string | null;
  portal_pasajero: string;
  portal_conductor: string;
};

export default function TaxiOperadorPage() {
  const [session, setSession] = useState(Boolean(getTaxiAdminToken()));
  const [op, setOp] = useState<Operador | null>(null);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTaxiOperador();
      if (!res.success) throw new Error(res.message || "Error");
      setOp(res.data);
      setNombre(res.data?.nombre || "");
    } catch (e: unknown) {
      toast.error(taxiErr(e, "Error al cargar operador"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) return <Navigate to="/login?mode=taxi" replace />;

  return (
    <TaxiAdminShell
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
                  const res = await updateTaxiOperador({ nombre: nombre.trim() });
                  if (!res.success) throw new Error(res.message);
                  toast.success("Nombre actualizado");
                  await load();
                } catch (err: unknown) {
                  toast.error(taxiErr(err, "Error"));
                }
              }}
            >
              <div className="min-w-[220px] flex-1 space-y-1">
                <label className="text-[12px] text-black/50">Nombre comercial</label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <Button type="submit">Guardar</Button>
            </form>
          </section>

          <section className="space-y-2">
            <h2 className="text-[14px] font-semibold">Portales</h2>
            <ul className="space-y-2 text-sm">
              <li className="rounded-lg border border-black/10 bg-white/70 px-3 py-2.5">
                Pasajero:{" "}
                <Link
                  to={op.portal_pasajero}
                  className="font-medium text-[var(--platform-accent)] underline-offset-2 hover:underline"
                >
                  {op.portal_pasajero}
                </Link>
              </li>
              <li className="rounded-lg border border-black/10 bg-white/70 px-3 py-2.5">
                Conductor:{" "}
                <Link
                  to={op.portal_conductor}
                  className="font-medium text-[var(--platform-accent)] underline-offset-2 hover:underline"
                >
                  {op.portal_conductor}
                </Link>
              </li>
              <li className="rounded-lg border border-black/10 bg-white/70 px-3 py-2.5">
                Consola admin:{" "}
                <Link
                  to="/taxi-admin"
                  className="font-medium text-[var(--platform-accent)] underline-offset-2 hover:underline"
                >
                  /taxi-admin
                </Link>
              </li>
            </ul>
          </section>
        </div>
      ) : null}
    </TaxiAdminShell>
  );
}
