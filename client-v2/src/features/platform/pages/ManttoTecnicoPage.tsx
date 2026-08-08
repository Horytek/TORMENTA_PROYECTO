import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listManttoOrdenes } from "@/features/platform/api/platformProducts";

type Orden = {
  id_ot: number;
  tipo: string;
  titulo: string;
  estado: string;
  activo?: string;
};

const PIN_KEY = "horytek_mantto_pin";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function ManttoTecnicoPage() {
  const [unlocked, setUnlocked] = useState(Boolean(sessionStorage.getItem(PIN_KEY)));
  const [pinInput, setPinInput] = useState("");
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listManttoOrdenes();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setOrdenes(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar OT"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Mantenimiento · Técnico
        </p>
        <h1 className="mt-2 text-xl font-semibold">Ingreso</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pinInput.length < 4) {
              toast.error("PIN de al menos 4 dígitos");
              return;
            }
            sessionStorage.setItem(PIN_KEY, pinInput);
            setUnlocked(true);
          }}
        >
          <Label>PIN</Label>
          <Input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Técnico</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Mantenimiento
          </p>
          <h1 className="mt-1 text-xl font-semibold">Órdenes asignadas</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem(PIN_KEY);
            setUnlocked(false);
          }}
        >
          Salir
        </Button>
      </header>

      {ordenes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay OT abiertas.</p>
      ) : (
        <ul className="divide-y divide-border/60 text-sm">
          {ordenes.map((o) => (
            <li key={o.id_ot} className="flex justify-between py-3">
              <span>
                {o.titulo}
                <span className="text-muted-foreground"> · {o.tipo}</span>
              </span>
              <span className="text-xs uppercase text-muted-foreground">{o.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
