import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAgendaSlot,
  getAgendaToken,
  listAgendaReservas,
  listAgendaSlots,
  setAgendaToken,
} from "@/features/platform/api/agenda";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Slot = {
  id_slot: number;
  inicia_en: string;
  minutos: number;
  precio: number;
  disponible: number;
};
type Reserva = {
  id_reserva: number;
  cliente_nombre: string;
  cliente_email: string;
  estado_pago: string;
  inicia_en?: string;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function AgendaAdminPage() {
  const [session, setSession] = useState(Boolean(getAgendaToken()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [iniciaEn, setIniciaEn] = useState("");
  const [minutos, setMinutos] = useState("30");
  const [precio, setPrecio] = useState("0");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, r] = await Promise.all([listAgendaSlots(), listAgendaReservas()]);
      if (!s.success) throw new Error(s.message || "Sin acceso");
      setSlots(s.data || []);
      setReservas(r.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Agenda"));
      setAgendaToken(null);
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) {
    return <Navigate to="/login?mode=agenda" replace />;
  }

  if (loading && slots.length === 0 && !error) {
    return (
      <PlatformShell productId="agenda" title="Agenda">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="agenda" title="Agenda">
        <p className="text-sm text-destructive">{error}</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="agenda"
      title="Agenda"
      subtitle="Público: /agenda/{slug}"
      onLogout={() => {
        setAgendaToken(null);
        setSession(false);
      }}
    >
      <form
        className="max-w-md space-y-3 border-b border-border/60 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createAgendaSlot({
              inicia_en: iniciaEn,
              minutos: Number(minutos) || 30,
              precio: Number(precio) || 0,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Slot creado");
            setIniciaEn("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Nuevo slot</h2>
        <Label>Inicio</Label>
        <Input
          type="datetime-local"
          value={iniciaEn}
          onChange={(e) => setIniciaEn(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Minutos"
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm">
          Crear slot
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Slots</h2>
        {slots.length === 0 ? (
          <EmptyState title="Sin slots" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {slots.map((s) => (
              <li key={s.id_slot} className="flex justify-between py-2">
                <span>
                  {s.inicia_en} · {s.minutos} min
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">S/ {Number(s.precio).toFixed(2)}</span>
                  <StatusChip status={s.disponible ? "libre" : "ocupado"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Reservas</h2>
        {reservas.length === 0 ? (
          <EmptyState title="Sin reservas" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {reservas.map((r) => (
              <li key={r.id_reserva} className="flex justify-between py-2">
                <span>
                  {r.cliente_nombre} · {r.cliente_email}
                </span>
                <StatusChip status={r.estado_pago} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
