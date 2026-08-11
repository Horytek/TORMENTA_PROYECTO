import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSyncCanal,
  createSyncMapeo,
  enqueueSyncJob,
  getStockSyncStatus,
  listSyncCanales,
  listSyncJobs,
  listSyncMapeos,
} from "@/features/platform/api/stockSync";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Canal = { id_canal: number; codigo: string; nombre: string; activo: number };
type Mapeo = {
  id_mapeo: number;
  id_canal: number;
  sku_origen: string;
  sku_destino: string;
  canal: string;
};
type Job = { id_job: number; tipo: string; estado: string; mensaje: string; creado_en: string };

export default function SyncStockAdminPage() {
  const [status, setStatus] = useState<{ canales: number; mapeos: number; jobs: number } | null>(null);
  const [canales, setCanales] = useState<Canal[]>([]);
  const [mapeos, setMapeos] = useState<Mapeo[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [codigo, setCodigo] = useState("");
  const [nombreCanal, setNombreCanal] = useState("");
  const [idCanalMapeo, setIdCanalMapeo] = useState("");
  const [skuOrigen, setSkuOrigen] = useState("");
  const [skuDestino, setSkuDestino] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [st, c, m, j] = await Promise.all([
        getStockSyncStatus(),
        listSyncCanales(),
        listSyncMapeos(),
        listSyncJobs(),
      ]);
      if (!st.success) throw new Error(st.message || "Sin acceso");
      setStatus(st.data);
      setCanales(c.data || []);
      setMapeos(m.data || []);
      setJobs(j.data || []);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (e as Error).message ||
        "Error al cargar Sync Stock";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreateCanal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createSyncCanal({ codigo, nombre: nombreCanal });
      if (!res.success) throw new Error(res.message);
      toast.success("Canal creado");
      setCodigo("");
      setNombreCanal("");
      await load();
    } catch (err: unknown) {
      toast.error((err as Error).message || "No se pudo crear el canal");
    }
  };

  const onCreateMapeo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createSyncMapeo({
        id_canal: Number(idCanalMapeo),
        sku_origen: skuOrigen,
        sku_destino: skuDestino,
      });
      if (!res.success) throw new Error(res.message);
      toast.success("Mapeo creado");
      setSkuOrigen("");
      setSkuDestino("");
      await load();
    } catch (err: unknown) {
      toast.error((err as Error).message || "No se pudo crear el mapeo");
    }
  };

  const onReconcile = async () => {
    try {
      const res = await enqueueSyncJob({
        tipo: "reconcile",
        id_canal: idCanalMapeo ? Number(idCanalMapeo) : undefined,
      });
      if (!res.success) throw new Error(res.message);
      toast.success("Job de reconciliación registrado");
      await load();
    } catch (err: unknown) {
      toast.error((err as Error).message || "No se pudo encolar");
    }
  };

  if (loading) {
    return (
      <PlatformShell productId="sync" title="Sync Stock">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }

  if (error) {
    return (
      <PlatformShell productId="sync" title="Sync Stock">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="sync"
      title="Sync Stock"
      subtitle={
        status
          ? `${status.canales} canales · ${status.mapeos} mapeos · ${status.jobs} jobs`
          : "Unifica stock entre canales sin sobrevender"
      }
    >
      <section className="grid gap-8 md:grid-cols-2">
        <form onSubmit={onCreateCanal} className="space-y-3 border-b border-border/60 pb-6">
          <h2 className="text-sm font-semibold">Nuevo canal</h2>
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="ecommerce"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nombreCanal">Nombre</Label>
            <Input
              id="nombreCanal"
              value={nombreCanal}
              onChange={(e) => setNombreCanal(e.target.value)}
              placeholder="Tienda online"
              required
            />
          </div>
          <Button type="submit" size="sm">
            Crear canal
          </Button>
        </form>

        <form onSubmit={onCreateMapeo} className="space-y-3 border-b border-border/60 pb-6">
          <h2 className="text-sm font-semibold">Nuevo mapeo SKU</h2>
          <div className="space-y-1.5">
            <Label htmlFor="idCanal">Canal</Label>
            <select
              id="idCanal"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={idCanalMapeo}
              onChange={(e) => setIdCanalMapeo(e.target.value)}
              required
            >
              <option value="">Seleccionar…</option>
              {canales.map((c) => (
                <option key={c.id_canal} value={c.id_canal}>
                  {c.nombre} ({c.codigo})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="skuO">SKU origen</Label>
              <Input id="skuO" value={skuOrigen} onChange={(e) => setSkuOrigen(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skuD">SKU destino</Label>
              <Input id="skuD" value={skuDestino} onChange={(e) => setSkuDestino(e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar mapeo
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onReconcile}>
              Encolar reconcile
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Canales</h2>
        {canales.length === 0 ? (
          <EmptyState title="Aún no hay canales" body="Crea el primero arriba." />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {canales.map((c) => (
              <li key={c.id_canal} className="flex justify-between py-2">
                <span>
                  {c.nombre} <span className="text-muted-foreground">({c.codigo})</span>
                </span>
                <StatusChip status={c.activo ? "ok" : "pendiente"} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Mapeos</h2>
        {mapeos.length === 0 ? (
          <EmptyState title="Sin mapeos todavía" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {mapeos.map((m) => (
              <li key={m.id_mapeo} className="flex justify-between gap-4 py-2">
                <span>
                  {m.sku_origen} → {m.sku_destino}
                </span>
                <span className="text-xs text-muted-foreground">{m.canal}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Jobs recientes</h2>
        {jobs.length === 0 ? (
          <EmptyState title="Sin jobs" />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {jobs.slice(0, 20).map((j) => (
              <li key={j.id_job} className="rounded-md border border-border/50 px-3 py-2">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    #{j.id_job} · {j.tipo}
                  </span>
                  <StatusChip status={j.estado} />
                </div>
                {j.mensaje && <p className="mt-1 text-xs text-muted-foreground">{j.mensaje}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
