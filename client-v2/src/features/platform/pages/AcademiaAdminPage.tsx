import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bootstrapAcademia,
  createAcademiaAlumno,
  createAcademiaCurso,
  getAcademiaToken,
  inscribirAcademia,
  listAcademiaAlumnos,
  listAcademiaCursos,
  loginAcademiaAdmin,
  setAcademiaToken,
} from "@/features/platform/api/academia";

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
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    return (
      <div className="mx-auto max-w-md space-y-6 p-6 md:p-8">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Academia · Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {mode === "login" ? "Iniciar sesión" : "Crear organización"}
          </h1>
        </header>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res =
                mode === "bootstrap"
                  ? await bootstrapAcademia({ slug, nombre, email, password })
                  : await loginAcademiaAdmin({ slug, email, password });
              if (!res.success) throw new Error(res.message);
              if (res.data?.token) setAcademiaToken(res.data.token);
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
          {mode === "login" ? "¿Primera vez? Crear org" : "Ya tengo cuenta"}
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Academia…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Academia</h1>
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Academia</h1>
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
          <p className="mt-2 text-sm text-muted-foreground">Sin cursos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {cursos.map((c) => (
              <li key={c.id_curso} className="py-2">
                {c.titulo}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Alumnos</h2>
        {alumnos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin alumnos.</p>
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
    </div>
  );
}
