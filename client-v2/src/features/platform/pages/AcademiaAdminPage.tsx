import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAcademiaAlumno,
  createAcademiaCurso,
  getAcademiaToken,
  inscribirAcademia,
  listAcademiaAlumnos,
  listAcademiaCursos,
  setAcademiaToken,
} from "@/features/platform/api/academia";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Curso = { id_curso: number; titulo: string; descripcion?: string; activo: number };
type Alumno = { id_alumno: number; email: string; nombre: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function AcademiaAdminPage() {
  const [session, setSession] = useState(Boolean(getAcademiaToken()));
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [alEmail, setAlEmail] = useState("");
  const [alNombre, setAlNombre] = useState("");
  const [alPass, setAlPass] = useState("");
  const [idCurso, setIdCurso] = useState("");
  const [idAlumno, setIdAlumno] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, a] = await Promise.all([listAcademiaCursos(), listAcademiaAlumnos()]);
      if (!c.success) throw new Error(c.message || "Sin acceso");
      setCursos(c.data || []);
      setAlumnos(a.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Academia"));
      setAcademiaToken(null);
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) {
    return <Navigate to="/login?mode=academia" replace />;
  }

  if (loading && cursos.length === 0 && !error) {
    return (
      <PlatformShell productId="academia" title="Academia">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="academia" title="Academia">
        <p className="text-sm text-destructive">{error}</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="academia"
      title="Academia"
      onLogout={() => {
        setAcademiaToken(null);
        setSession(false);
      }}
    >
      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createAcademiaCurso({
                titulo,
                descripcion: descripcion || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Curso creado");
              setTitulo("");
              setDescripcion("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nuevo curso</h2>
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          <Input
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createAcademiaAlumno({
                email: alEmail,
                nombre: alNombre,
                password: alPass,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Alumno creado");
              setAlEmail("");
              setAlNombre("");
              setAlPass("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nuevo alumno</h2>
          <Input
            type="email"
            placeholder="Email"
            value={alEmail}
            onChange={(e) => setAlEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Nombre"
            value={alNombre}
            onChange={(e) => setAlNombre(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={alPass}
            onChange={(e) => setAlPass(e.target.value)}
            required
          />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>
      </section>

      <form
        className="max-w-md space-y-3 border-b border-border/60 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await inscribirAcademia({
              id_curso: Number(idCurso),
              id_alumno: Number(idAlumno),
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Inscrito");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Inscribir alumno</h2>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={idCurso}
          onChange={(e) => setIdCurso(e.target.value)}
          required
        >
          <option value="">Curso…</option>
          {cursos.map((c) => (
            <option key={c.id_curso} value={c.id_curso}>
              {c.titulo}
            </option>
          ))}
        </select>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={idAlumno}
          onChange={(e) => setIdAlumno(e.target.value)}
          required
        >
          <option value="">Alumno…</option>
          {alumnos.map((a) => (
            <option key={a.id_alumno} value={a.id_alumno}>
              {a.nombre} ({a.email})
            </option>
          ))}
        </select>
        <Button type="submit" size="sm">
          Inscribir
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Cursos</h2>
        {cursos.length === 0 ? (
          <EmptyState title="Sin cursos" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {cursos.map((c) => (
              <li key={c.id_curso} className="flex items-center justify-between gap-2 py-2">
                <span>{c.titulo}</span>
                <StatusChip status={c.activo ? "ok" : "cancelado"} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Alumnos</h2>
        {alumnos.length === 0 ? (
          <EmptyState title="Sin alumnos" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {alumnos.map((a) => (
              <li key={a.id_alumno} className="py-2">
                {a.nombre} · {a.email}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
