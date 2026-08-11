import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTaxiConductor,
  getTaxiAdminToken,
  listTaxiConductores,
  setTaxiConductorPassword,
  updateTaxiConductor,
} from "@/features/platform/api/taxi";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { TaxiAdminShell, taxiErr } from "./TaxiAdminShell";

type Conductor = {
  id_conductor: number;
  nombre: string;
  telefono?: string | null;
  placa?: string | null;
  vehiculo?: string | null;
  notas?: string | null;
  activo: number;
  viajes_activos?: number;
  viajes_total?: number;
};

const emptyForm = {
  nombre: "",
  telefono: "",
  password: "",
  placa: "",
  vehiculo: "",
  notas: "",
};

export default function TaxiConductoresPage() {
  const [session, setSession] = useState(Boolean(getTaxiAdminToken()));
  const [rows, setRows] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState({
    nombre: "",
    telefono: "",
    placa: "",
    vehiculo: "",
    notas: "",
  });
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTaxiConductores();
      if (!res.success) throw new Error(res.message || "Error");
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(taxiErr(e, "Error al cargar conductores"));
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
      return (
        r.nombre.toLowerCase().includes(q) ||
        (r.telefono || "").includes(q) ||
        (r.placa || "").toLowerCase().includes(q) ||
        (r.vehiculo || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  if (!session) return <Navigate to="/login?mode=taxi" replace />;

  return (
    <TaxiAdminShell
      title="Conductores"
      subtitle="Flota humana y vehículo"
      onLogout={() => setSession(false)}
    >
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Nombre, teléfono, placa…"
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={["activo", "inactivo"]}
      />

      <form
        className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createTaxiConductor({
              nombre: form.nombre.trim(),
              telefono: form.telefono.trim() || undefined,
              password: form.password,
              placa: form.placa.trim() || undefined,
              vehiculo: form.vehiculo.trim() || undefined,
              notas: form.notas.trim() || undefined,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Conductor creado");
            setForm(emptyForm);
            await load();
          } catch (err: unknown) {
            toast.error(taxiErr(err, "No se pudo crear"));
          }
        }}
      >
        <p className="sm:col-span-2 lg:col-span-3 text-[13px] font-medium">Alta rápida</p>
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
          placeholder="Contraseña portal"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
          minLength={6}
        />
        <Input
          placeholder="Placa"
          value={form.placa}
          onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))}
        />
        <Input
          placeholder="Vehículo"
          value={form.vehiculo}
          onChange={(e) => setForm((f) => ({ ...f, vehiculo: e.target.value }))}
        />
        <Input
          placeholder="Notas"
          value={form.notas}
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
        />
        <Button type="submit" className="sm:col-span-2 lg:col-span-3 w-fit">
          Crear conductor
        </Button>
      </form>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin conductores" body="Crea el primero o ajusta el filtro." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li
              key={c.id_conductor}
              className="rounded-lg border border-black/10 bg-white/70 px-3 py-3 text-sm"
            >
              {editId === c.id_conductor ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={edit.nombre}
                    onChange={(e) => setEdit((x) => ({ ...x, nombre: e.target.value }))}
                    placeholder="Nombre"
                  />
                  <Input
                    value={edit.telefono}
                    onChange={(e) => setEdit((x) => ({ ...x, telefono: e.target.value }))}
                    placeholder="Teléfono"
                  />
                  <Input
                    value={edit.placa}
                    onChange={(e) => setEdit((x) => ({ ...x, placa: e.target.value }))}
                    placeholder="Placa"
                  />
                  <Input
                    value={edit.vehiculo}
                    onChange={(e) => setEdit((x) => ({ ...x, vehiculo: e.target.value }))}
                    placeholder="Vehículo"
                  />
                  <Input
                    className="sm:col-span-2"
                    value={edit.notas}
                    onChange={(e) => setEdit((x) => ({ ...x, notas: e.target.value }))}
                    placeholder="Notas"
                  />
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await updateTaxiConductor(c.id_conductor, {
                            nombre: edit.nombre.trim(),
                            telefono: edit.telefono.trim() || null,
                            placa: edit.placa.trim() || null,
                            vehiculo: edit.vehiculo.trim() || null,
                            notas: edit.notas.trim() || null,
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
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {c.nombre}{" "}
                      <StatusChip status={Number(c.activo) === 1 ? "activo" : "inactivo"} />
                    </p>
                    <p className="text-[12px] text-black/50">
                      {[c.telefono, c.placa, c.vehiculo].filter(Boolean).join(" · ") || "Sin datos"}
                    </p>
                    {c.notas ? <p className="text-[12px] text-black/45">{c.notas}</p> : null}
                    <p className="text-[11px] text-black/40">
                      Viajes: {Number(c.viajes_activos || 0)} activos / {Number(c.viajes_total || 0)}{" "}
                      total
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(c.id_conductor);
                        setEdit({
                          nombre: c.nombre,
                          telefono: c.telefono || "",
                          placa: c.placa || "",
                          vehiculo: c.vehiculo || "",
                          notas: c.notas || "",
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await updateTaxiConductor(c.id_conductor, {
                            activo: Number(c.activo) !== 1,
                          });
                          if (!res.success) throw new Error(res.message);
                          toast.success(Number(c.activo) === 1 ? "Desactivado" : "Activado");
                          await load();
                        } catch (err: unknown) {
                          toast.error(taxiErr(err, "Error"));
                        }
                      }}
                    >
                      {Number(c.activo) === 1 ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPwdId(c.id_conductor);
                        setPwd("");
                      }}
                    >
                      Password
                    </Button>
                  </div>
                </div>
              )}
              {pwdId === c.id_conductor ? (
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
                        const res = await setTaxiConductorPassword(c.id_conductor, pwd);
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
