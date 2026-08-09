import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  getAcademiaPortal,
  getAcademiaAlumnoToken,
  loginAcademiaAlumno,
  misCursosAcademia,
  setAcademiaAlumnoToken,
} from "@/features/platform/api/academia";
import { getDemoPortalCreds, isDemoSlug } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

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
  const demo = isDemoSlug(slug) ? getDemoPortalCreds("academia", "alumno") : null;
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getAcademiaAlumnoToken()));
  const [session, setSession] = useState(hadToken);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadToken, async () => {
    if (!demo?.email || !demo.password) throw new Error("Sin credenciales demo");
    const res = await loginAcademiaAlumno({
      slug,
      email: demo.email,
      password: demo.password,
      nombre: demo.nombre,
    });
    if (!res.success) throw new Error(res.message || "Demo no disponible");
    setSession(true);
  });

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
    misCursosAcademia(slug)
      .then((res) => {
        if (res.success) setCursos(res.data?.cursos || res.data || []);
      })
      .catch(() => {
        setAcademiaAlumnoToken(null);
        setSession(false);
      });
  }, [session, slug]);

  if (loadError || (!session && autoPhase !== "entering") || (!session && autoPhase === "failed")) {
    return <Navigate to="/login?mode=academia" replace />;
  }

  if (!portal || autoPhase === "entering") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-12 text-center text-sm text-muted-foreground">
        {autoPhase === "entering" ? "Entrando a la demo…" : "Cargando…"}
      </div>
    );
  }

  return (
    <OpsShell
      productId="academia"
      companyName={portal.nombre}
      roleLabel="Alumno"
      title="Mis cursos"
      width="default"
      onLogout={() => {
        setAcademiaAlumnoToken(null);
        setSession(false);
      }}
    >
      {cursos.length === 0 ? (
        <EmptyState title="Sin cursos" body="Aún no estás inscrito en cursos." />
      ) : (
        <ul className="divide-y divide-black/8 text-sm">
          {cursos.map((c) => (
            <li key={c.id_curso} className="flex justify-between py-3">
              <span>{c.titulo}</span>
              <span className="text-xs text-black/45">{c.progreso_pct ?? 0}%</span>
            </li>
          ))}
        </ul>
      )}
    </OpsShell>
  );
}
