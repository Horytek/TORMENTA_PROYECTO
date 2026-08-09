import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPreventaPublic, reservarPreventa } from "@/features/platform/api/platformProducts";

type Item = {
  id_item: number;
  sku: string;
  nombre: string;
  precio: number;
  cupo: number;
  reservados: number;
};
type Campania = { slug: string; nombre: string; anticipo_pct: number; items?: Item[] };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function PreventaPublicPage() {
  const { slug = "" } = useParams();
  const [campania, setCampania] = useState<Campania | null>(null);
  const [error, setError] = useState("");
  const [idItem, setIdItem] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cantidad, setCantidad] = useState("1");

  useEffect(() => {
    (async () => {
      try {
        const res = await getPreventaPublic(slug);
        if (!res.success) throw new Error(res.message);
        setCampania(res.data);
      } catch (e: unknown) {
        setError(errMsg(e, "Campaña no encontrada"));
      }
    })();
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Preventa</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <Link to="/?product=preventa" className="mt-6 inline-block text-sm underline">
          Ver producto Preventa
        </Link>
      </div>
    );
  }

  if (!campania) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Cargando preventa…</div>;
  }

  const items = campania.items || [];

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f7f5f1_0%,#eef2f4_45%,#f4f7f5_100%)]">
      <div className="mx-auto max-w-lg px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Preventa</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{campania.nombre}</h1>
        <p className="mt-2 text-sm text-stone-600">Anticipo {campania.anticipo_pct}%</p>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-stone-500">No hay ítems disponibles en esta campaña.</p>
        ) : (
          <ul className="mt-8 divide-y divide-stone-200/80 text-sm">
            {items.map((it) => (
              <li key={it.id_item} className="flex justify-between py-3">
                <span>
                  {it.nombre}{" "}
                  <span className="text-stone-500">
                    ({it.cupo - it.reservados} cupos)
                  </span>
                </span>
                <span className="font-medium">S/ {Number(it.precio).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}

        <form
          className="mt-10 space-y-3 border-t border-stone-200/80 pt-8"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await reservarPreventa(slug, {
                id_item: Number(idItem),
                cliente_nombre: nombre,
                cliente_email: email,
                cantidad: Number(cantidad) || 1,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Reserva registrada");
              setNombre("");
              setEmail("");
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo reservar"));
            }
          }}
        >
          <h2 className="text-sm font-semibold text-stone-900">Reservar</h2>
          <Label>Ítem</Label>
          <select
            className="flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
            value={idItem}
            onChange={(e) => setIdItem(e.target.value)}
            required
          >
            <option value="">Seleccionar…</option>
            {items.map((it) => (
              <option key={it.id_item} value={it.id_item}>
                {it.nombre}
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
          <Input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <Button type="submit" className="w-full">
            Reservar con anticipo
          </Button>
        </form>
      </div>
    </div>
  );
}
