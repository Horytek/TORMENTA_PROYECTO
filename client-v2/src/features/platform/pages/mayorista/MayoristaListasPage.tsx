import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addMayoristaItem,
  createMayoristaLista,
  listMayoristaItems,
  listMayoristaListas,
  listMayoristaTiendas,
} from "@/features/platform/api/mayorista";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { MayoristaAdminShell, mayoristaErr } from "./MayoristaAdminShell";

type Tienda = { id_tienda: number; slug: string; nombre: string };
type Lista = {
  id_lista: number;
  id_tienda: number;
  nombre: string;
  tienda_slug: string;
};
type Item = {
  sku: string;
  nombre: string;
  precio: number;
  min_cantidad: number;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-white/70 px-3 text-sm";

export default function MayoristaListasPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [idTiendaLista, setIdTiendaLista] = useState("");
  const [nombreLista, setNombreLista] = useState("");
  const [idListaActiva, setIdListaActiva] = useState("");
  const [sku, setSku] = useState("");
  const [nombreItem, setNombreItem] = useState("");
  const [precio, setPrecio] = useState("");
  const [minCantidad, setMinCantidad] = useState("1");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, l] = await Promise.all([listMayoristaTiendas(), listMayoristaListas()]);
      if (!t.success) throw new Error(t.message || "Sin acceso");
      setTiendas(t.data || []);
      setListas(l.data || []);
    } catch (e: unknown) {
      setError(mayoristaErr(e, "Error al cargar listas"));
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (idLista: string) => {
    if (!idLista) {
      setItems([]);
      return;
    }
    try {
      const res = await listMayoristaItems(Number(idLista));
      if (!res.success) throw new Error(res.message);
      setItems(res.data || []);
    } catch (e: unknown) {
      toast.error(mayoristaErr(e, "No se pudieron cargar ítems"));
      setItems([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void loadItems(idListaActiva);
  }, [idListaActiva]);

  const listaActiva = useMemo(
    () => listas.find((l) => String(l.id_lista) === idListaActiva) || null,
    [listas, idListaActiva]
  );

  return (
    <MayoristaAdminShell
      title="Listas de precio"
      subtitle="Define catálogos por volumen y asigna ítems a cada lista."
    >
      {loading ? <p className="text-sm text-black/50">Cargando…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="space-y-6">
            <form
              className="space-y-3 border-b border-black/8 pb-6"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await createMayoristaLista({
                    id_tienda: Number(idTiendaLista),
                    nombre: nombreLista.trim(),
                  });
                  if (!res.success) throw new Error(res.message);
                  toast.success("Lista creada");
                  setNombreLista("");
                  await load();
                } catch (err: unknown) {
                  toast.error(mayoristaErr(err, "No se pudo crear la lista"));
                }
              }}
            >
              <h2 className="text-sm font-semibold tracking-tight">Nueva lista</h2>
              <div className="space-y-1.5">
                <Label>Portal</Label>
                <select
                  className={selectClass}
                  value={idTiendaLista}
                  onChange={(e) => setIdTiendaLista(e.target.value)}
                  required
                >
                  <option value="">Seleccionar…</option>
                  {tiendas.map((t) => (
                    <option key={t.id_tienda} value={t.id_tienda}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={nombreLista}
                  onChange={(e) => setNombreLista(e.target.value)}
                  placeholder="Lista mayorista"
                  required
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90"
              >
                Crear lista
              </Button>
            </form>

            <div>
              <h2 className="text-sm font-semibold tracking-tight">Tus listas</h2>
              {listas.length === 0 ? (
                <EmptyState title="Sin listas" body="Crea una lista para el portal." />
              ) : (
                <ul className="mt-3 divide-y divide-black/8 border-y border-black/8">
                  {listas.map((l) => {
                    const active = String(l.id_lista) === idListaActiva;
                    return (
                      <li key={l.id_lista}>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between py-3 text-left text-sm transition-colors ${
                            active
                              ? "bg-[var(--platform-accent-soft)]"
                              : "hover:bg-black/[0.03]"
                          }`}
                          onClick={() => setIdListaActiva(String(l.id_lista))}
                        >
                          <span>
                            <span className="font-medium">{l.nombre}</span>
                            <span className="mt-0.5 block text-[12px] text-black/45">
                              /b2b/{l.tienda_slug}
                            </span>
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-black/40">
                            {active ? "Activa" : "Ver"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-tight">
              Ítems {listaActiva ? `· ${listaActiva.nombre}` : ""}
            </h2>
            {!idListaActiva ? (
              <EmptyState
                title="Elige una lista"
                body="Selecciona una lista a la izquierda para ver y agregar SKUs."
              />
            ) : (
              <>
                <form
                  className="grid gap-2 sm:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await addMayoristaItem({
                        id_lista: Number(idListaActiva),
                        sku: sku.trim(),
                        nombre: nombreItem.trim(),
                        precio: Number(precio),
                        min_cantidad: Number(minCantidad) || 1,
                      });
                      if (!res.success) throw new Error(res.message);
                      toast.success("Ítem agregado");
                      setSku("");
                      setNombreItem("");
                      setPrecio("");
                      setMinCantidad("1");
                      await loadItems(idListaActiva);
                    } catch (err: unknown) {
                      toast.error(mayoristaErr(err, "No se pudo agregar el ítem"));
                    }
                  }}
                >
                  <Input
                    placeholder="SKU"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Nombre"
                    value={nombreItem}
                    onChange={(e) => setNombreItem(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Mín. cantidad"
                    value={minCantidad}
                    onChange={(e) => setMinCantidad(e.target.value)}
                  />
                  <Button
                    type="submit"
                    className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90 sm:col-span-2"
                  >
                    Agregar ítem
                  </Button>
                </form>
                {items.length === 0 ? (
                  <EmptyState title="Lista vacía" body="Agrega el primer SKU." />
                ) : (
                  <ul className="divide-y divide-black/8 border-y border-black/8 text-sm">
                    {items.map((it) => (
                      <li
                        key={it.sku}
                        className="flex items-baseline justify-between gap-3 py-2.5"
                      >
                        <div>
                          <p className="font-medium">{it.nombre}</p>
                          <p className="text-[12px] text-black/45">
                            {it.sku}
                            {it.min_cantidad > 1
                              ? ` · mín. ${it.min_cantidad}`
                              : ""}
                          </p>
                        </div>
                        <p className="tabular-nums text-black/70">
                          S/ {Number(it.precio).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      ) : null}
    </MayoristaAdminShell>
  );
}
