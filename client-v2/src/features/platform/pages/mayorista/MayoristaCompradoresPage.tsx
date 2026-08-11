import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMayoristaComprador,
  listMayoristaCompradores,
  listMayoristaListas,
  listMayoristaTiendas,
} from "@/features/platform/api/mayorista";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { MayoristaAdminShell, mayoristaErr } from "./MayoristaAdminShell";

type Tienda = { id_tienda: number; slug: string; nombre: string };
type Lista = {
  id_lista: number;
  id_tienda: number;
  nombre: string;
  tienda_slug: string;
};
type Comprador = {
  id_comprador: number;
  email: string;
  razon_social: string;
  ruc?: string | null;
  activo: number;
  id_lista?: number | null;
  tienda_slug: string;
  tienda_nombre: string;
  lista_nombre?: string | null;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-white/70 px-3 text-sm";

export default function MayoristaCompradoresPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [idTienda, setIdTienda] = useState("");
  const [idLista, setIdLista] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ruc, setRuc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, l, c] = await Promise.all([
        listMayoristaTiendas(),
        listMayoristaListas(),
        listMayoristaCompradores(),
      ]);
      if (!t.success) throw new Error(t.message || "Sin acceso");
      setTiendas(t.data || []);
      setListas(l.data || []);
      setCompradores(c.data || []);
    } catch (e: unknown) {
      setError(mayoristaErr(e, "Error al cargar compradores"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const listasFiltradas = useMemo(() => {
    if (!idTienda) return listas;
    return listas.filter((l) => String(l.id_tienda) === idTienda);
  }, [listas, idTienda]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return compradores;
    return compradores.filter(
      (c) =>
        c.razon_social.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.tienda_slug.toLowerCase().includes(q) ||
        (c.ruc || "").toLowerCase().includes(q)
    );
  }, [compradores, query]);

  return (
    <MayoristaAdminShell
      title="Compradores"
      subtitle="Cuentas B2B por portal. Entran en /b2b/{slug} con email y contraseña."
    >
      {loading ? <p className="text-sm text-black/50">Cargando…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <>
          <form
            className="grid gap-3 border-b border-black/8 pb-6 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const res = await createMayoristaComprador({
                  id_tienda: Number(idTienda),
                  email: email.trim(),
                  password,
                  razon_social: razonSocial.trim(),
                  ruc: ruc.trim() || undefined,
                  id_lista: idLista ? Number(idLista) : undefined,
                });
                if (!res.success) throw new Error(res.message);
                toast.success("Comprador creado");
                setEmail("");
                setPassword("");
                setRazonSocial("");
                setRuc("");
                setIdLista("");
                await load();
              } catch (err: unknown) {
                toast.error(mayoristaErr(err, "No se pudo crear el comprador"));
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label>Portal</Label>
              <select
                className={selectClass}
                value={idTienda}
                onChange={(e) => {
                  setIdTienda(e.target.value);
                  setIdLista("");
                }}
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
              <Label>Lista (opcional)</Label>
              <select
                className={selectClass}
                value={idLista}
                onChange={(e) => setIdLista(e.target.value)}
              >
                <option value="">Sin asignar…</option>
                {listasFiltradas.map((l) => (
                  <option key={l.id_lista} value={l.id_lista}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Razón social</Label>
              <Input
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>RUC (opcional)</Label>
              <Input value={ruc} onChange={(e) => setRuc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90 md:col-span-2"
            >
              {saving ? "Creando…" : "Crear comprador"}
            </Button>
          </form>

          <FilterBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar comprador, email o portal…"
            activeStatus="all"
            onStatusChange={() => {}}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="Sin compradores"
              body="Crea cuentas para que entren al portal B2B."
            />
          ) : (
            <ul className="divide-y divide-black/8 border-y border-black/8">
              {filtered.map((c) => (
                <li
                  key={c.id_comprador}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium tracking-tight">{c.razon_social}</p>
                    <p className="text-[13px] text-black/50">
                      {c.email} · /b2b/{c.tienda_slug}
                      {c.lista_nombre ? ` · ${c.lista_nombre}` : ""}
                    </p>
                  </div>
                  <StatusChip status={c.activo ? "ok" : "cancelado"} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </MayoristaAdminShell>
  );
}
