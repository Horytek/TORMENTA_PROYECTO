import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTaxiPasajeroAdmin,
  getTaxiAdminToken,
  listTaxiPasajeros,
  setTaxiPasajeroPassword,
  updateTaxiPasajero,
} from "@/features/platform/api/taxi";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { TaxiAdminShell, taxiErr } from "./TaxiAdminShell";

type Pasajero = {
  id_pasajero: number;
  nombre: string;
  telefono: string;
  activo: number;
  viajes_total?: number;
};

export default function TaxiPasajerosPage() {
  const [session, setSession] = useState(Boolean(getTaxiAdminToken()));
  const [rows, setRows] = useState<Pasajero[]>([]);
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
      const res = await listTaxiPasajeros();
      if (!res.success) throw new Error(res.message || "Error");
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(taxiErr(e, "Error al cargar pasajeros"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
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

  if (!session) return <Navigate to="/login?mode=taxi" replace />;

  return (
    <TaxiAdminShell
      title="Pasajeros"
      subtitle="Cuentas cliente del operador"
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
            const res = await createTaxiPasajeroAdmin({
              nombre: form.nombre.trim(),
              telefono: form.telefono.trim(),
              password: form.password,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Pasajero creado");
            setForm({ nombre: "", telefono: "", password: "" });
            await load();
          } catch (err: unknown) {
            toast.error(taxiErr(err, "No se pudo crear"));
          }
        }}
      >
        <p className="sm:col-span-3 text-[13px] font-medium">Alta rápida</p>
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
        <Button type="submit" className="w-fit">
          Crear pasajero
        </Button>
      </form>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin pasajeros" body="Crea el primero o ajusta el filtro." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li
              key={p.id_pasajero}
              className="rounded-lg border border-black/10 bg-white/70 px-3 py-3 text-sm"
            >
              {editId === p.id_pasajero ? (
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="max-w-[180px]"
                    value={edit.nombre}
                    onChange={(e) => setEdit((x) => ({ ...x, nombre: e.target.value }))}
                  />
                  <Input
                    className="max-w-[140px]"
                    value={edit.telefono}
                    onChange={(e) => setEdit((x) => ({ ...x, telefono: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await updateTaxiPasajero(p.id_pasajero, {
                          nombre: edit.nombre.trim(),
                          telefono: edit.telefono.trim(),
                        });
                        if (!res.success) throw new Error(res.message);
                        toast.success("Actualizado");
                        setEditId(null);
                        await load();
                      } catch (err: unknown) {
                        toast.error(taxiErr(err, "Error"));
                      }
                    }}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {p.nombre}{" "}
                      <StatusChip status={Number(p.activo) === 1 ? "activo" : "inactivo"} />
                    </p>
                    <p className="text-[12px] text-black/50">{p.telefono}</p>
                    <p className="text-[11px] text-black/40">
                      Viajes: {Number(p.viajes_total || 0)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(p.id_pasajero);
                        setEdit({ nombre: p.nombre, telefono: p.telefono });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await updateTaxiPasajero(p.id_pasajero, {
                            activo: Number(p.activo) !== 1,
                          });
                          if (!res.success) throw new Error(res.message);
                          toast.success(Number(p.activo) === 1 ? "Desactivado" : "Activado");
                          await load();
                        } catch (err: unknown) {
                          toast.error(taxiErr(err, "Error"));
                        }
                      }}
                    >
                      {Number(p.activo) === 1 ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPwdId(p.id_pasajero);
                        setPwd("");
                      }}
                    >
                      Password
                    </Button>
                  </div>
                </div>
              )}
              {pwdId === p.id_pasajero ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-black/5 pt-2">
                  <Input
                    type="password"
                    className="max-w-[200px]"
                    placeholder="Nueva contraseña"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    minLength={6}
                  />
                  <Button
                    size="sm"
                    disabled={pwd.length < 6}
                    onClick={async () => {
                      try {
                        const res = await setTaxiPasajeroPassword(p.id_pasajero, pwd);
                        if (!res.success) throw new Error(res.message);
                        toast.success("Contraseña actualizada");
                        setPwdId(null);
                      } catch (err: unknown) {
                        toast.error(taxiErr(err, "Error"));
                      }
                    }}
                  >
                    Guardar pass
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPwdId(null)}>
                    Cerrar
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </TaxiAdminShell>
  );
}
