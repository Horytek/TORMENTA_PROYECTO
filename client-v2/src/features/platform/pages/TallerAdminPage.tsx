import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addTallerInsumo,
  createTallerOrden,
  getTallerStatus,
  listTallerOrdenes,
} from "@/features/platform/api/platformProducts";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Orden = {
  id_ot: number;
  codigo: string;
  titulo: string;
  estado: string;
  merma_pct: number;
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TallerAdminPage() {
  const [status, setStatus] = useState<{ ordenes: number } | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [merma, setMerma] = useState("0");
  const [idOt, setIdOt] = useState("");
  const [sku, setSku] = useState("");
  const [nombreInsumo, setNombreInsumo] = useState("");
  const [cantidad, setCantidad] = useState("1");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [st, o] = await Promise.all([getTallerStatus(), listTallerOrdenes()]);
      if (!st.success) throw new Error(st.message || "Sin acceso");
      setStatus(st.data);
      setOrdenes(o.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Taller"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <PlatformShell productId="taller" title="Taller">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="taller" title="Taller">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="taller"
      title="Taller"
      subtitle={`Órdenes de trabajo · planta: /taller/planta · ${status?.ordenes ?? ordenes.length} OT`}
    >
      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createTallerOrden({
                codigo,
                titulo,
                merma_pct: Number(merma) || 0,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("OT creada");
              setCodigo("");
              setTitulo("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo crear"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva OT</h2>
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Merma %</Label>
            <Input type="number" step="0.01" value={merma} onChange={(e) => setMerma(e.target.value)} />
          </div>
          <Button type="submit" size="sm">
            Crear OT
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await addTallerInsumo({
                id_ot: Number(idOt),
                sku,
                nombre: nombreInsumo,
                cantidad: Number(cantidad) || 1,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Insumo agregado");
              setSku("");
              setNombreInsumo("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "No se pudo agregar"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Agregar insumo</h2>
          <div className="space-y-1.5">
            <Label>OT</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={idOt}
              onChange={(e) => setIdOt(e.target.value)}
              required
            >
              <option value="">Seleccionar…</option>
              {ordenes.map((o) => (
                <option key={o.id_ot} value={o.id_ot}>
                  {o.codigo} — {o.titulo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombreInsumo} onChange={(e) => setNombreInsumo(e.target.value)} required />
          </div>
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Órdenes de trabajo</h2>
        {ordenes.length === 0 ? (
          <EmptyState title="Aún no hay OT" body="Crea la primera arriba." />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {ordenes.map((o) => (
              <li key={o.id_ot} className="flex justify-between gap-4 py-2">
                <span>
                  <span className="font-medium">{o.codigo}</span> — {o.titulo}
                </span>
                <StatusChip status={o.estado} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
