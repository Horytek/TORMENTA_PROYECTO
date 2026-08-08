import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addTallerInsumo,
  listTallerOrdenes,
} from "@/features/platform/api/platformProducts";

type Orden = { id_ot: number; codigo: string; titulo: string; estado: string };

const PIN_KEY = "horytek_taller_pin";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TallerPlantaPage() {
  const [pin, setPin] = useState(() => sessionStorage.getItem(PIN_KEY) || "");
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(Boolean(sessionStorage.getItem(PIN_KEY)));
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idOt, setIdOt] = useState("");
  const [sku, setSku] = useState("");
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("1");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTallerOrdenes();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setOrdenes(res.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "No se pudieron cargar las OT"));
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
          Taller · Planta
        </p>
        <h1 className="mt-2 text-xl font-semibold">Ingreso operador</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pinInput.length < 4) {
              toast.error("PIN de al menos 4 dígitos");
              return;
            }
            sessionStorage.setItem(PIN_KEY, pinInput);
            setPin(pinInput);
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

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando planta…</div>;
  }
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Planta</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Taller · Operador
          </p>
          <h1 className="mt-1 text-xl font-semibold">Planta</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem(PIN_KEY);
            setUnlocked(false);
            setPin("");
          }}
        >
          Salir
        </Button>
      </header>

      <form
        className="space-y-3 border-b border-border/60 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await addTallerInsumo({
              id_ot: Number(idOt),
              sku,
              nombre,
              cantidad: Number(cantidad) || 1,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Insumo registrado");
            setSku("");
            setNombre("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Registrar insumo</h2>
        <p className="text-xs text-muted-foreground">Sesión PIN · {pin ? "••••" : ""}</p>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={idOt}
          onChange={(e) => setIdOt(e.target.value)}
          required
        >
          <option value="">OT…</option>
          {ordenes.map((o) => (
            <option key={o.id_ot} value={o.id_ot}>
              {o.codigo} — {o.titulo}
            </option>
          ))}
        </select>
        <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <Button type="submit" size="sm">
          Guardar
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">OT abiertas</h2>
        {ordenes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin órdenes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {ordenes.map((o) => (
              <li key={o.id_ot} className="flex justify-between py-2">
                <span>
                  {o.codigo} — {o.titulo}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{o.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
