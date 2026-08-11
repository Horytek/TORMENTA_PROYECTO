import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listWmsTareas,
  patchWmsTarea,
} from "@/features/platform/api/platformProducts";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { portalSecondaryBtnClass } from "@/features/platform/ui/portalTouch";

type Tarea = {
  id_tarea: number;
  tipo: string;
  sku: string;
  cantidad: number;
  estado: string;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function WmsOperarioPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listWmsTareas();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setTareas((res.data || []).filter((t: Tarea) => t.estado !== "hecha"));
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar tareas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <OpsShell
      productId="wms"
      companyName="Operador Demo WMS"
      roleLabel="Operario"
      title="Tareas pendientes"
      width="default"
      actions={
        <>
          <Button asChild variant="outline" className="min-h-11 px-3">
            <Link to="/platform/wms">Admin WMS</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 px-3">
            <Link to="/login">Salir</Link>
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-black/50">Cargando tareas…</p>
      ) : error ? (
        <div className="space-y-4">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Link to="/login" className={portalSecondaryBtnClass}>
            Ir al login
          </Link>
        </div>
      ) : tareas.length === 0 ? (
        <EmptyState title="Sin tareas" body="No hay tareas pendientes." />
      ) : (
        <ul className="space-y-3">
          {tareas.map((t) => (
            <li
              key={t.id_tarea}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white/80 px-4 py-4 text-sm"
            >
              <div>
                <p className="font-medium">
                  {t.tipo} · {t.sku}
                </p>
                <p className="text-xs text-black/45">
                  × {t.cantidad} · {t.estado}
                </p>
              </div>
              <Button
                className="min-h-11"
                onClick={async () => {
                  try {
                    const next = t.estado === "pendiente" ? "en_curso" : "hecha";
                    const res = await patchWmsTarea(t.id_tarea, { estado: next });
                    if (!res.success) throw new Error(res.message);
                    toast.success(next === "hecha" ? "Completada" : "En curso");
                    await load();
                  } catch (err: unknown) {
                    toast.error(errMsg(err, "Error"));
                  }
                }}
              >
                {t.estado === "pendiente" ? "Iniciar" : "Completar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </OpsShell>
  );
}
