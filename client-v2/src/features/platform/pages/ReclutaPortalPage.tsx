import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getReclutaPortal, postularRecluta } from "@/features/platform/api/platformProducts";

type Vacante = { id_vacante: number; titulo: string; descripcion?: string };
type Portal = { slug: string; nombre: string; vacantes?: Vacante[] };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function ReclutaPortalPage() {
  const { slug = "" } = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [error, setError] = useState("");
  const [idVacante, setIdVacante] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getReclutaPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setError(errMsg(e, "Portal no encontrado"));
      }
    })();
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Recluta</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <Link to="/soluciones/recluta" className="mt-6 inline-block text-sm underline">
          Ver producto Recluta
        </Link>
      </div>
    );
  }

  if (!portal) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Cargando portal…</div>;
  }

  const vacantes = portal.vacantes || [];

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f7f5f1_0%,#eef2f4_45%,#f4f7f5_100%)]">
      <div className="mx-auto max-w-lg px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Recluta</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{portal.nombre}</h1>

        {vacantes.length === 0 ? (
          <p className="mt-8 text-sm text-stone-500">No hay vacantes publicadas.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {vacantes.map((v) => (
              <li key={v.id_vacante} className="border-b border-stone-200/80 pb-4">
                <p className="font-medium text-stone-900">{v.titulo}</p>
                {v.descripcion && <p className="mt-1 text-sm text-stone-600">{v.descripcion}</p>}
              </li>
            ))}
          </ul>
        )}

        <form
          className="mt-10 space-y-3 border-t border-stone-200/80 pt-8"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await postularRecluta(slug, {
                id_vacante: Number(idVacante),
                nombre,
                email,
                telefono: telefono || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Postulación enviada");
              setNombre("");
              setEmail("");
              setTelefono("");
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo postular"));
            }
          }}
        >
          <h2 className="text-sm font-semibold text-stone-900">Postular</h2>
          <Label>Vacante</Label>
          <select
            className="flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm"
            value={idVacante}
            onChange={(e) => setIdVacante(e.target.value)}
            required
          >
            <option value="">Seleccionar…</option>
            {vacantes.map((v) => (
              <option key={v.id_vacante} value={v.id_vacante}>
                {v.titulo}
              </option>
            ))}
          </select>
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Enviar postulación
          </Button>
        </form>
      </div>
    </div>
  );
}
