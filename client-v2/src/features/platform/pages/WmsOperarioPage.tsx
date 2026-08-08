import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listWmsTareas,
  patchWmsTarea,
} from "@/features/platform/api/platformProducts";

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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando tareas…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">WMS Operario</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          WMS · Operario
        </p>
        <h1 className="mt-1 text-xl font-semibold">Tareas pendientes</h1>
      </header>

      {tareas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>
      ) : (
        <ul className="space-y-3">
          {tareas.map((t) => (
            <li
              key={t.id_tarea}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {t.tipo} · {t.sku}
                </p>
                <p className="text-xs text-muted-foreground">
                  × {t.cantidad} · {t.estado}
                </p>
              </div>
              <Button
                size="sm"
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
    </div>
  );
}
