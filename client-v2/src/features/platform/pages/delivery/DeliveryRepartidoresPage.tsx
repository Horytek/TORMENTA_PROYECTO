import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDeliveryRepartidor,
  getDeliveryAdminToken,
  listDeliveryRepartidores,
  setDeliveryRepartidorPassword,
  updateDeliveryRepartidor,
} from "@/features/platform/api/delivery";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { DeliveryAdminShell, deliveryErr } from "./DeliveryAdminShell";

type Repartidor = {
  id_repartidor: number;
  nombre: string;
  telefono?: string | null;
  activo: number;
  pedidos_activos?: number;
  pedidos_total?: number;
};

export default function DeliveryRepartidoresPage() {
  const [session, setSession] = useState(Boolean(getDeliveryAdminToken()));
  const [rows, setRows] = useState<Repartidor[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [form, setForm] = useState({ nombre: "", telefono: "", password: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState({ nombre: "", telefono: "" });
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDeliveryRepartidores();
      if (!res.success) throw new Error(res.message || "Error");
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(deliveryErr(e, "Error al cargar repartidores"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void load();
  }, [session]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const active = Number(r.activo) === 1;
      if (statusFilter === "activo" && !active) return false;
      if (statusFilter === "inactivo" && active) return false;
      if (!q) return true;
      return r.nombre.toLowerCase().includes(q) || (r.telefono || "").includes(q);
    });
  }, [rows, query, statusFilter]);

  if (!session) return <Navigate to="/login?mode=delivery" replace />;

  return (
    <DeliveryAdminShell
      title="Repartidores"
      subtitle="Flota activa y credenciales de portal"
      onLogout={() => setSession(false)}
    >
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Nombre o teléfono…"
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={["activo", "inactivo"]}
      />

      <form
        className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createDeliveryRepartidor({
              nombre: form.nombre.trim(),
              telefono: form.telefono.trim() || undefined,
              password: form.password,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Repartidor creado");
            setForm({ nombre: "", telefono: "", password: "" });
            await load();
          } catch (err: unknown) {
            toast.error(deliveryErr(err, "No se pudo crear"));
          }
        }}
      >
        <p className="text-[13px] font-medium sm:col-span-3">Nuevo repartidor</p>
        <Input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          required
        />
        <Input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
          minLength={6}
        />
        <Button
          type="submit"
          className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90 sm:col-span-3"
        >
          Crear
        </Button>
      </form>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin repartidores" body="Crea el primero arriba." />
      ) : (
        <ul className="divide-y divide-black/8 border-y border-black/8">
          {filtered.map((r) => (
            <li key={r.id_repartidor} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{r.nombre}</p>
                  <p className="text-[12px] text-black/45">
                    {r.telefono || "Sin teléfono"} · activos {r.pedidos_activos ?? 0} · total{" "}
                    {r.pedidos_total ?? 0}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusChip status={Number(r.activo) === 1 ? "activo" : "inactivo"} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setEditId(r.id_repartidor);
                      setEdit({ nombre: r.nombre, telefono: r.telefono || "" });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={async () => {
                      try {
                        await updateDeliveryRepartidor(r.id_repartidor, {
                          activo: Number(r.activo) !== 1,
                        });
                        await load();
                      } catch (err: unknown) {
                        toast.error(deliveryErr(err, "Error"));
                      }
                    }}
                  >
                    {Number(r.activo) === 1 ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setPwdId(r.id_repartidor);
                      setPwd("");
                    }}
                  >
                    Password
                  </Button>
                </div>
              </div>
              {editId === r.id_repartidor ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await updateDeliveryRepartidor(r.id_repartidor, {
                        nombre: edit.nombre.trim(),
                        telefono: edit.telefono.trim() || null,
                      });
                      toast.success("Actualizado");
                      setEditId(null);
                      await load();
                    } catch (err: unknown) {
                      toast.error(deliveryErr(err, "Error"));
                    }
                  }}
                >
                  <Input
                    value={edit.nombre}
                    onChange={(e) => setEdit((x) => ({ ...x, nombre: e.target.value }))}
                    required
                  />
                  <Input
                    value={edit.telefono}
                    onChange={(e) => setEdit((x) => ({ ...x, telefono: e.target.value }))}
                    placeholder="Teléfono"
                  />
                  <Button size="sm" type="submit">
                    Guardar
                  </Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : null}
              {pwdId === r.id_repartidor ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await setDeliveryRepartidorPassword(r.id_repartidor, pwd);
                      toast.success("Contraseña actualizada");
                      setPwdId(null);
                      setPwd("");
                    } catch (err: unknown) {
                      toast.error(deliveryErr(err, "Error"));
                    }
                  }}
                >
                  <Input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button size="sm" type="submit">
                    Guardar
                  </Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setPwdId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DeliveryAdminShell>
  );
}
