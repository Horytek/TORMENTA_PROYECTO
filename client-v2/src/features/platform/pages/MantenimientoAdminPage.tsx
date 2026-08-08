import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createManttoActivo,
  createManttoOrden,
  listManttoActivos,
  listManttoOrdenes,
} from "@/features/platform/api/platformProducts";

type Activo = { id_activo: number; codigo: string; nombre: string; ubicacion?: string };
type Orden = {
  id_ot: number;
  id_activo: number;
  tipo: string;
  titulo: string;
  estado: string;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function MantenimientoAdminPage() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [idActivo, setIdActivo] = useState("");
  const [tipo, setTipo] = useState<"preventivo" | "correctivo">("preventivo");
  const [titulo, setTitulo] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [a, o] = await Promise.all([listManttoActivos(), listManttoOrdenes()]);
      if (!a.success) throw new Error(a.message || "Sin acceso");
      setActivos(a.data || []);
      setOrdenes(o.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Mantenimiento"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Mantenimiento…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Mantenimiento</h1>
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Mantenimiento</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Activos y OT preventivo/correctivo. Técnico: <code>/mantenimiento/tecnico</code>.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createManttoActivo({
                codigo,
                nombre,
                ubicacion: ubicacion || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Activo creado");
              setCodigo("");
              setNombre("");
              setUbicacion("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nuevo activo</h2>
          <Label>Código</Label>
          <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <Label>Ubicación</Label>
          <Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createManttoOrden({
                id_activo: Number(idActivo),
                tipo,
                titulo,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("OT creada");
              setTitulo("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva OT</h2>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idActivo}
            onChange={(e) => setIdActivo(e.target.value)}
            required
          >
            <option value="">Activo…</option>
            {activos.map((a) => (
              <option key={a.id_activo} value={a.id_activo}>
                {a.codigo} — {a.nombre}
              </option>
            ))}
          </select>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          >
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          <Button type="submit" size="sm">
            Crear OT
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Activos</h2>
        {activos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin activos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {activos.map((a) => (
              <li key={a.id_activo} className="py-2">
                {a.codigo} — {a.nombre}
                {a.ubicacion ? ` · ${a.ubicacion}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Órdenes</h2>
        {ordenes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin OT.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {ordenes.map((o) => (
              <li key={o.id_ot} className="flex justify-between py-2">
                <span>
                  {o.titulo} <span className="text-muted-foreground">({o.tipo})</span>
                </span>
                <span className="text-xs uppercase text-muted-foreground">{o.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
