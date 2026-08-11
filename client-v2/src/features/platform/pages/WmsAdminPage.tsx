import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createWmsTarea,
  createWmsUbicacion,
  listWmsTareas,
  listWmsUbicaciones,
  patchWmsTarea,
} from "@/features/platform/api/platformProducts";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Ubicacion = { id_ubicacion: number; codigo: string; nombre: string };
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

export default function WmsAdminPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"picking" | "packing" | "conteo">("picking");
  const [sku, setSku] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [idUbic, setIdUbic] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [u, t] = await Promise.all([listWmsUbicaciones(), listWmsTareas()]);
      if (!u.success) throw new Error(u.message || "Sin acceso");
      setUbicaciones(u.data || []);
      setTareas(t.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar WMS"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <PlatformShell productId="wms" title="WMS">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="wms" title="WMS">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="wms"
      title="WMS"
      subtitle="Ubicaciones y tareas de picking/packing. Operario: /wms/operario"
    >
      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createWmsUbicacion({ codigo, nombre });
              if (!res.success) throw new Error(res.message);
              toast.success("Ubicación creada");
              setCodigo("");
              setNombre("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva ubicación</h2>
          <Label>Código</Label>
          <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createWmsTarea({
                tipo,
                sku,
                cantidad: Number(cantidad) || 1,
                id_ubicacion: idUbic ? Number(idUbic) : undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Tarea creada");
              setSku("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva tarea</h2>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          >
            <option value="picking">Picking</option>
            <option value="packing">Packing</option>
            <option value="conteo">Conteo</option>
          </select>
          <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
          <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idUbic}
            onChange={(e) => setIdUbic(e.target.value)}
          >
            <option value="">Ubicación (opcional)</option>
            {ubicaciones.map((u) => (
              <option key={u.id_ubicacion} value={u.id_ubicacion}>
                {u.codigo} — {u.nombre}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm">
            Crear tarea
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Ubicaciones</h2>
        {ubicaciones.length === 0 ? (
          <EmptyState title="Sin ubicaciones" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {ubicaciones.map((u) => (
              <li key={u.id_ubicacion} className="py-2">
                {u.codigo} — {u.nombre}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Tareas</h2>
        {tareas.length === 0 ? (
          <EmptyState title="Sin tareas" />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {tareas.map((t) => (
              <li
                key={t.id_tarea}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
              >
                <span>
                  #{t.id_tarea} · {t.tipo} · {t.sku} × {t.cantidad}
                </span>
                <div className="flex items-center gap-2">
                  <StatusChip status={t.estado} />
                  {t.estado !== "hecha" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await patchWmsTarea(t.id_tarea, { estado: "hecha" });
                          if (!res.success) throw new Error(res.message);
                          toast.success("Tarea marcada");
                          await load();
                        } catch (err: unknown) {
                          toast.error(errMsg(err, "Error"));
                        }
                      }}
                    >
                      Hecha
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
