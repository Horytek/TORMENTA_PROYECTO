import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCampoCheckin,
  listCampoVendedores,
} from "@/features/platform/api/platformProducts";

type Vendedor = { id_vendedor: number; nombre: string };

const PIN_KEY = "horytek_campo_pin";
const VEND_KEY = "horytek_campo_vendedor";

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function CampoVendedorPage() {
  const [unlocked, setUnlocked] = useState(
    Boolean(sessionStorage.getItem(PIN_KEY) && sessionStorage.getItem(VEND_KEY))
  );
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [idVendedor, setIdVendedor] = useState(sessionStorage.getItem(VEND_KEY) || "");
  const [pinInput, setPinInput] = useState("");
  const [nota, setNota] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listCampoVendedores()
      .then((res) => {
        if (res.success) setVendedores(res.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!unlocked || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error("No se pudo obtener ubicación")
    );
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Campo · Vendedor
        </p>
        <h1 className="mt-2 text-xl font-semibold">Check-in</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!idVendedor || pinInput.length < 4) {
              toast.error("Elige vendedor y PIN");
              return;
            }
            sessionStorage.setItem(PIN_KEY, pinInput);
            sessionStorage.setItem(VEND_KEY, idVendedor);
            setUnlocked(true);
          }}
        >
          <Label>Vendedor</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idVendedor}
            onChange={(e) => setIdVendedor(e.target.value)}
            required
          >
            <option value="">Seleccionar…</option>
            {vendedores.map((v) => (
              <option key={v.id_vendedor} value={v.id_vendedor}>
                {v.nombre}
              </option>
            ))}
          </select>
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

  return (
    <div className="mx-auto max-w-sm space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Campo
          </p>
          <h1 className="mt-1 text-xl font-semibold">Marcar asistencia</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem(PIN_KEY);
            sessionStorage.removeItem(VEND_KEY);
            setUnlocked(false);
          }}
        >
          Salir
        </Button>
      </header>

      <p className="text-sm text-muted-foreground">
        {coords
          ? `Ubicación: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
          : "Obteniendo GPS…"}
      </p>

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!coords) {
            toast.error("Espera la ubicación GPS");
            return;
          }
          setSending(true);
          try {
            const res = await createCampoCheckin({
              id_vendedor: Number(idVendedor),
              lat: coords.lat,
              lng: coords.lng,
              nota: nota || undefined,
              pin: sessionStorage.getItem(PIN_KEY) || undefined,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Check-in registrado");
            setNota("");
          } catch (err: unknown) {
            toast.error(errMsg(err, "No se pudo marcar"));
          } finally {
            setSending(false);
          }
        }}
      >
        <Input placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
        <Button type="submit" className="w-full" disabled={sending || !coords}>
          {sending ? "Enviando…" : "Marcar check-in"}
        </Button>
      </form>
    </div>
  );
}
