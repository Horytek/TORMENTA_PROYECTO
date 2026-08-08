import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listDespachoRutas } from "@/features/platform/api/platformProducts";

type Ruta = {
  id_ruta: number;
  fecha: string;
  vehiculo: string;
  chofer: string;
  estado: string;
  paradas?: { id_parada: number; secuencia: number; direccion: string; cliente?: string; estado: string }[];
};

const PIN_KEY = "horytek_despacho_pin";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DespachoChoferPage() {
  const [unlocked, setUnlocked] = useState(Boolean(sessionStorage.getItem(PIN_KEY)));
  const [pinInput, setPinInput] = useState("");
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listDespachoRutas();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setRutas(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar rutas"));
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
          Despacho · Chofer
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
        <h1 className="text-xl font-semibold">Chofer</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <header className="flex justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Despacho
          </p>
          <h1 className="mt-1 text-xl font-semibold">Mis rutas</h1>
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

      {rutas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay rutas asignadas.</p>
      ) : (
        <ul className="space-y-6">
          {rutas.map((r) => (
            <li key={r.id_ruta} className="border-b border-border/60 pb-4">
              <p className="text-sm font-medium">
                {r.fecha} · {r.vehiculo}
              </p>
              <p className="text-xs uppercase text-muted-foreground">{r.estado}</p>
              {(r.paradas || []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Sin paradas.</p>
              ) : (
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                  {(r.paradas || []).map((p) => (
                    <li key={p.id_parada}>
                      {p.direccion}
                      {p.cliente ? ` (${p.cliente})` : ""} — {p.estado}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
