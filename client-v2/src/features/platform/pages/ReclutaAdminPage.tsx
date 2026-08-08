import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createReclutaVacante,
  listReclutaPostulaciones,
  listReclutaVacantes,
  patchReclutaPostulacion,
  setupReclutaPortal,
} from "@/features/platform/api/platformProducts";

type Vacante = { id_vacante: number; titulo: string; publicada: number; descripcion?: string };
type Postulacion = {
  id_postulacion: number;
  id_vacante: number;
  nombre: string;
  email: string;
  etapa: string;
  vacante?: string;
};

const ETAPAS = ["nueva", "revision", "entrevista", "oferta", "contratada", "descartada"];

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function ReclutaAdminPage() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [nombrePortal, setNombrePortal] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, p] = await Promise.all([listReclutaVacantes(), listReclutaPostulaciones()]);
      if (!v.success) throw new Error(v.message || "Sin acceso");
      setVacantes(v.data || []);
      setPostulaciones(p.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Recluta"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Recluta…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Recluta</h1>
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
          Plataforma · Oleada E
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Recluta</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Vacantes y etapas de selección. Portal: <code>/recluta/&#123;slug&#125;</code>.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await setupReclutaPortal({ slug, nombre: nombrePortal });
              if (!res.success) throw new Error(res.message);
              toast.success(`Portal /recluta/${slug}`);
              setSlug("");
              setNombrePortal("");
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Setup portal</h2>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <Label>Nombre</Label>
          <Input value={nombrePortal} onChange={(e) => setNombrePortal(e.target.value)} required />
          <Button type="submit" size="sm">
            Guardar portal
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createReclutaVacante({
                titulo,
                descripcion: descripcion || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Vacante publicada");
              setTitulo("");
              setDescripcion("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva vacante</h2>
          <Label>Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          <Label>Descripción</Label>
          <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <Button type="submit" size="sm">
            Publicar
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Vacantes</h2>
        {vacantes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay vacantes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {vacantes.map((v) => (
              <li key={v.id_vacante} className="py-2">
                {v.titulo}
                {!v.publicada && (
                  <span className="ml-2 text-xs text-muted-foreground">borrador</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Postulaciones</h2>
        {postulaciones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin postulaciones.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {postulaciones.map((p) => (
              <li
                key={p.id_postulacion}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
              >
                <span>
                  {p.nombre} <span className="text-muted-foreground">({p.email})</span>
                </span>
                <select
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                  value={p.etapa}
                  onChange={async (e) => {
                    try {
                      const res = await patchReclutaPostulacion(p.id_postulacion, {
                        etapa: e.target.value,
                      });
                      if (!res.success) throw new Error(res.message);
                      toast.success("Etapa actualizada");
                      await load();
                    } catch (err: unknown) {
                      toast.error(errMsg(err, "Error"));
                    }
                  }}
                >
                  {ETAPAS.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
