import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addCrmActividad,
  createCrmDeal,
  getCrmStatus,
  listCrmDeals,
  moveCrmDeal,
} from "@/features/platform/api/platformProducts";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Deal = {
  id_deal: number;
  titulo: string;
  monto: number;
  estado: string;
  id_etapa?: number;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function CrmAdminPage() {
  const [status, setStatus] = useState<{ deals: number } | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [titulo, setTitulo] = useState("");
  const [monto, setMonto] = useState("");
  const [idDeal, setIdDeal] = useState("");
  const [tipo, setTipo] = useState("llamada");
  const [nota, setNota] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [st, d] = await Promise.all([getCrmStatus(), listCrmDeals()]);
      if (!st.success) throw new Error(st.message || "Sin acceso");
      setStatus(st.data);
      setDeals(d.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar CRM"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <PlatformShell productId="crm" title="CRM">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="crm" title="CRM">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="crm"
      title="Pipeline comercial"
      subtitle={`${status?.deals ?? deals.length} deals · no reemplaza clientes del ERP`}
    >

      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createCrmDeal({ titulo, monto: Number(monto) || 0 });
              if (!res.success) throw new Error(res.message);
              toast.success("Deal creado");
              setTitulo("");
              setMonto("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo crear"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nuevo deal</h2>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Monto</Label>
            <Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <Button type="submit" size="sm">
            Crear deal
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await addCrmActividad({
                id_deal: Number(idDeal),
                tipo,
                nota,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Actividad registrada");
              setNota("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo registrar"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Actividad</h2>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idDeal}
            onChange={(e) => setIdDeal(e.target.value)}
            required
          >
            <option value="">Deal…</option>
            {deals.map((d) => (
              <option key={d.id_deal} value={d.id_deal}>
                {d.titulo}
              </option>
            ))}
          </select>
          <Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="llamada / email / visita" />
          <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota" required />
          <Button type="submit" size="sm">
            Registrar
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Deals</h2>
        {deals.length === 0 ? (
          <EmptyState title="Aún no hay deals" body="Crea el primero con el formulario." />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {deals.map((d) => (
              <li
                key={d.id_deal}
                className="flex flex-wrap items-center justify-between gap-2 bg-white/70 px-3 py-2"
              >
                <span>
                  {d.titulo}{" "}
                  <span className="text-black/45">S/ {Number(d.monto).toFixed(2)}</span>
                </span>
                <div className="flex items-center gap-2">
                  <StatusChip status={d.estado} />
                  {d.estado === "abierto" && d.id_etapa != null ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await moveCrmDeal(d.id_deal, {
                            id_etapa: Number(d.id_etapa),
                            estado: "ganado",
                          });
                          if (!res.success) throw new Error(res.message);
                          toast.success("Marcado ganado");
                          await load();
                        } catch (err: unknown) {
                          toast.error(errMsg(err, "Error"));
                        }
                      }}
                    >
                      Ganado
                    </Button>
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
