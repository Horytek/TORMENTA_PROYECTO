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
    return <div className="p-8 text-sm text-muted-foreground">Cargando Sync Stock…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Sync Stock</h1>
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
          Plataforma · Oleada A
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Sync Stock</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Unifica stock entre canales sin sobrevender. La cantidad maestra vive en ERP/Ecommerce;
          aquí solo mapeos, colas y logs (BD <code>db_sync</code>).
        </p>
        {status && (
          <p className="mt-3 text-xs text-muted-foreground">
            {status.canales} canales · {status.mapeos} mapeos · {status.jobs} jobs
          </p>
        )}
      </header>

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
          <p className="mt-2 text-sm text-muted-foreground">Aún no hay canales. Crea el primero arriba.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {canales.map((c) => (
              <li key={c.id_canal} className="flex justify-between py-2">
                <span>
                  {c.nombre} <span className="text-muted-foreground">({c.codigo})</span>
                </span>
                <span className="text-xs text-muted-foreground">{c.activo ? "activo" : "off"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Mapeos</h2>
        {mapeos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin mapeos todavía.</p>
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
          <p className="mt-2 text-sm text-muted-foreground">Sin jobs.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {jobs.slice(0, 20).map((j) => (
              <li key={j.id_job} className="rounded-md border border-border/50 px-3 py-2">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    #{j.id_job} · {j.tipo}
                  </span>
                  <span className="text-xs uppercase text-muted-foreground">{j.estado}</span>
                </div>
                {j.mensaje && <p className="mt-1 text-xs text-muted-foreground">{j.mensaje}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
