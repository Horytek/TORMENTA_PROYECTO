import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bootstrapAgenda,
  createAgendaSlot,
  getAgendaToken,
  listAgendaReservas,
  listAgendaSlots,
  loginAgendaAdmin,
  setAgendaToken,
} from "@/features/platform/api/agenda";

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
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    return (
      <div className="mx-auto max-w-md space-y-6 p-6 md:p-8">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Agenda · Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {mode === "login" ? "Iniciar sesión" : "Crear profesional"}
          </h1>
        </header>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res =
                mode === "bootstrap"
                  ? await bootstrapAgenda({ slug, nombre, email, password })
                  : await loginAgendaAdmin({ slug, email, password });
              if (!res.success) throw new Error(res.message);
              if (res.data?.token) setAgendaToken(res.data.token);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          {mode === "bootstrap" && (
            <>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </>
          )}
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Label>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            {mode === "bootstrap" ? "Crear" : "Entrar"}
          </Button>
        </form>
        <button
          type="button"
          className="text-sm text-muted-foreground underline"
          onClick={() => setMode(mode === "login" ? "bootstrap" : "login")}
        >
          {mode === "login" ? "¿Primera vez? Crear profesional" : "Ya tengo cuenta"}
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Agenda…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Agenda</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-8">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Plataforma · Oleada E
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Público: <code>/agenda/&#123;slug&#125;</code>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAgendaToken(null);
            setSession(false);
          }}
        >
          Salir
        </Button>
      </header>

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
          <p className="mt-2 text-sm text-muted-foreground">Sin slots.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {slots.map((s) => (
              <li key={s.id_slot} className="flex justify-between py-2">
                <span>
                  {s.inicia_en} · {s.minutos} min
                </span>
                <span className="text-muted-foreground">
                  S/ {Number(s.precio).toFixed(2)} · {s.disponible ? "libre" : "ocupado"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Reservas</h2>
        {reservas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin reservas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {reservas.map((r) => (
              <li key={r.id_reserva} className="flex justify-between py-2">
                <span>
                  {r.cliente_nombre} · {r.cliente_email}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{r.estado_pago}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
