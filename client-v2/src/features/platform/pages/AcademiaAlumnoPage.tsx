import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAcademiaPortal,
  getAcademiaToken,
  loginAcademiaAlumno,
  misCursosAcademia,
  setAcademiaToken,
} from "@/features/platform/api/academia";

type Portal = { slug: string; nombre: string };
type Curso = { id_curso: number; titulo: string; progreso_pct?: number };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function AcademiaAlumnoPage() {
  const { slug = "" } = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState(Boolean(getAcademiaToken()));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAcademiaPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setLoadError(errMsg(e, "Academia no encontrada"));
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!session) return;
    misCursosAcademia()
      .then((res) => {
        if (res.success) setCursos(res.data || []);
      })
      .catch(() => {
        setAcademiaToken(null);
        setSession(false);
      });
  }, [session]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Academia</h1>
        <p className="mt-3 text-sm text-destructive">{loadError}</p>
        <Link to="/soluciones/academia" className="mt-6 inline-block text-sm underline">
          Ver producto
        </Link>
      </div>
    );
  }

  if (!portal) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Academia · Alumno
        </p>
        <h1 className="mt-2 text-xl font-semibold">{portal.nombre}</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await loginAcademiaAlumno({
                slug,
                email,
                password,
                nombre: nombre || undefined,
              });
              if (!res.success) throw new Error(res.message);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <Label>Nombre (nuevo)</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
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
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Academia
          </p>
          <h1 className="mt-1 text-xl font-semibold">Mis cursos</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAcademiaToken(null);
            setSession(false);
          }}
        >
          Salir
        </Button>
      </header>

      {cursos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no estás inscrito en cursos.</p>
      ) : (
        <ul className="divide-y divide-border/60 text-sm">
          {cursos.map((c) => (
            <li key={c.id_curso} className="flex justify-between py-3">
              <span>{c.titulo}</span>
              <span className="text-xs text-muted-foreground">
                {c.progreso_pct ?? 0}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
