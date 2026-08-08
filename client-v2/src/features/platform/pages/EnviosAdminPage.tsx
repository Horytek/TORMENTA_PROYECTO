import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEnviosGuia, listEnviosGuias } from "@/features/platform/api/platformProducts";

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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Envíos…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Envíos</h1>
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
          Plataforma · Oleada C
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Envíos</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Guías courier. Tracking público: <code>/tracking/&#123;codigo&#125;</code>.
        </p>
      </header>

      <form
        className="max-w-md space-y-3 border-b border-border/60 pb-6"
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
        <Button type="submit" size="sm">
          Crear guía
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Guías</h2>
        {guias.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay guías.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {guias.map((g) => (
              <li key={g.id_guia} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{g.codigo}</span> — {g.destinatario} · {g.destino}
                </span>
                <span className="text-xs uppercase text-muted-foreground">
                  {g.estado} · {g.courier}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
