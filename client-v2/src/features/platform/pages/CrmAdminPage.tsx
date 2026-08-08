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
} from "@/features/platform/api/platformProducts";

type Deal = {
  id_deal: number;
  titulo: string;
  monto: number;
  estado: string;
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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando CRM…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">CRM</h1>
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Plataforma · Oleada B
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pipeline comercial y actividades. No reemplaza el master de clientes del ERP.
        </p>
        {status && (
          <p className="mt-3 text-xs text-muted-foreground">{status.deals ?? deals.length} deals</p>
        )}
      </header>

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
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay deals.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {deals.map((d) => (
              <li key={d.id_deal} className="flex justify-between py-2">
                <span>
                  {d.titulo}{" "}
                  <span className="text-muted-foreground">S/ {Number(d.monto).toFixed(2)}</span>
                </span>
                <span className="text-xs uppercase text-muted-foreground">{d.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
