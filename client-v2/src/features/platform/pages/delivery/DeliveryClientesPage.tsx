import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDeliveryCliente,
  getDeliveryAdminToken,
  listDeliveryClientes,
  setDeliveryClientePassword,
  updateDeliveryCliente,
} from "@/features/platform/api/delivery";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { DeliveryAdminShell, deliveryErr } from "./DeliveryAdminShell";

type Cliente = {
  id_cliente: number;
  nombre: string;
  telefono: string;
  pedidos_total?: number;
};

export default function DeliveryClientesPage() {
  const [session, setSession] = useState(Boolean(getDeliveryAdminToken()));
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ nombre: "", telefono: "", password: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState({ nombre: "", telefono: "" });
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDeliveryClientes();
      if (!res.success) throw new Error(res.message || "Error");
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(deliveryErr(e, "Error al cargar clientes"));
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
    if (!q) return rows;
    return rows.filter(
      (r) => r.nombre.toLowerCase().includes(q) || (r.telefono || "").includes(q)
    );
  }, [rows, query]);

  if (!session) return <Navigate to="/login?mode=delivery" replace />;

  return (
    <DeliveryAdminShell
      title="Clientes"
      subtitle="Cuentas del portal de encargos"
      onLogout={() => setSession(false)}
    >
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Nombre o teléfono…"
        activeStatus="all"
        onStatusChange={() => {}}
      />

      <form
        className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createDeliveryCliente({
              nombre: form.nombre.trim(),
              telefono: form.telefono.trim(),
              password: form.password,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Cliente creado");
            setForm({ nombre: "", telefono: "", password: "" });
            await load();
          } catch (err: unknown) {
            toast.error(deliveryErr(err, "No se pudo crear"));
          }
        }}
      >
        <p className="text-[13px] font-medium sm:col-span-3">Nuevo cliente</p>
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
          required
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
        <EmptyState title="Sin clientes" body="Crea el primero arriba." />
      ) : (
        <ul className="divide-y divide-black/8 border-y border-black/8">
          {filtered.map((c) => (
            <li key={c.id_cliente} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-[12px] text-black/45">
                    {c.telefono} · {c.pedidos_total ?? 0} pedidos
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setEditId(c.id_cliente);
                      setEdit({ nombre: c.nombre, telefono: c.telefono });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setPwdId(c.id_cliente);
                      setPwd("");
                    }}
                  >
                    Password
                  </Button>
                </div>
              </div>
              {editId === c.id_cliente ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await updateDeliveryCliente(c.id_cliente, {
                        nombre: edit.nombre.trim(),
                        telefono: edit.telefono.trim(),
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
                    required
                  />
                  <Button size="sm" type="submit">
                    Guardar
                  </Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : null}
              {pwdId === c.id_cliente ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await setDeliveryClientePassword(c.id_cliente, pwd);
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
