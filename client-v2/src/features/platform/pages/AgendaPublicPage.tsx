import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAgendaPortal,
  listAgendaPublicSlots,
  reservarAgenda,
} from "@/features/platform/api/agenda";

type Portal = { slug: string; nombre: string };
type Slot = {
  id_slot: number;
  inicia_en: string;
  minutos: number;
  precio: number;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function AgendaPublicPage() {
  const { slug = "" } = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");
  const [idSlot, setIdSlot] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([
          getAgendaPortal(slug),
          listAgendaPublicSlots(slug),
        ]);
        if (!p.success) throw new Error(p.message);
        setPortal(p.data);
        setSlots(s.data || []);
      } catch (e: unknown) {
        setError(errMsg(e, "Agenda no encontrada"));
      }
    })();
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Agenda</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <Link to="/?product=agenda" className="mt-6 inline-block text-sm underline">
          Ver producto
        </Link>
      </div>
    );
  }

  if (!portal) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f7f5f1_0%,#eef2f4_45%,#f4f7f5_100%)]">
      <div className="mx-auto max-w-lg px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Agenda</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{portal.nombre}</h1>
        <p className="mt-2 text-sm text-stone-600">Reserva una cita 1-a-1</p>

        {slots.length === 0 ? (
          <p className="mt-8 text-sm text-stone-500">No hay horarios disponibles.</p>
        ) : (
          <ul className="mt-8 divide-y divide-stone-200/80 text-sm">
            {slots.map((s) => (
              <li key={s.id_slot} className="flex justify-between py-3">
                <span>
                  {s.inicia_en} · {s.minutos} min
                </span>
                <span className="font-medium">S/ {Number(s.precio).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}

        <form
          className="mt-10 space-y-3 border-t border-stone-200/80 pt-8"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await reservarAgenda(slug, {
                id_slot: Number(idSlot),
                cliente_nombre: nombre,
                cliente_email: email,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Reserva registrada");
              setNombre("");
              setEmail("");
              const s = await listAgendaPublicSlots(slug);
              if (s.success) setSlots(s.data || []);
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo reservar"));
            }
          }}
        >
          <h2 className="text-sm font-semibold text-stone-900">Reservar</h2>
          <Label>Horario</Label>
          <select
            className="flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
            value={idSlot}
            onChange={(e) => setIdSlot(e.target.value)}
            required
          >
            <option value="">Seleccionar…</option>
            {slots.map((s) => (
              <option key={s.id_slot} value={s.id_slot}>
                {s.inicia_en}
              </option>
            ))}
          </select>
          <Input placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Reservar
          </Button>
        </form>
      </div>
    </div>
  );
}
