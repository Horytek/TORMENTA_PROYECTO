import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEnviosGuia, listEnviosGuias } from "@/features/platform/api/platformProducts";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { KpiStrip } from "@/features/platform/ui/KpiStrip";

type Guia = {
  id_guia: number;
  codigo: string;
  courier: string;
  destinatario: string;
  destino: string;
  estado: string;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function EnviosAdminPage() {
  const [guias, setGuias] = useState<Guia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [destino, setDestino] = useState("");
  const [courier, setCourier] = useState("manual");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listEnviosGuias();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setGuias(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Envíos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <PlatformShell productId="envios" title="Envíos">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="envios" title="Envíos">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  const count = (s: string) => guias.filter((g) => g.estado === s).length;

  return (
    <PlatformShell
      productId="envios"
      title="Guías y tracking"
      subtitle="Copia el link público /tracking/{codigo} para el cliente"
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/tracking/DEMO01">Ver DEMO01</Link>
        </Button>
      }
    >
      <KpiStrip
        items={[
          { label: "Creadas", value: count("creada") },
          { label: "En tránsito", value: count("en_transito") },
          { label: "Entregadas", value: count("entregada") },
          { label: "Total", value: guias.length },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-3 bg-white/70 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createEnviosGuia({ destinatario, destino, courier });
              if (!res.success) throw new Error(res.message);
              toast.success(`Guía ${res.data?.codigo || ""} creada`);
              setDestinatario("");
              setDestino("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo crear"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva guía</h2>
          <div className="space-y-1.5">
            <Label>Destinatario</Label>
            <Input value={destinatario} onChange={(e) => setDestinatario(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Destino</Label>
            <Input value={destino} onChange={(e) => setDestino(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Courier</Label>
            <Input value={courier} onChange={(e) => setCourier(e.target.value)} />
          </div>
          <Button type="submit" size="sm" style={{ backgroundColor: "var(--platform-accent)" }}>
            Crear guía
          </Button>
        </form>

        <section>
          <h2 className="text-sm font-semibold">Guías</h2>
          {guias.length === 0 ? (
            <EmptyState title="Aún no hay guías" body="Crea una o usa el seed DEMO01–DEMO05." />
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {guias.map((g) => (
                <li
                  key={g.id_guia}
                  className="flex flex-wrap items-center justify-between gap-2 bg-white/70 px-3 py-2"
                >
                  <span>
                    <Link
                      to={`/tracking/${g.codigo}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {g.codigo}
                    </Link>{" "}
                    — {g.destinatario} · {g.destino}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusChip status={g.estado} />
                    <span className="text-[11px] text-black/40">{g.courier}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PlatformShell>
  );
}
