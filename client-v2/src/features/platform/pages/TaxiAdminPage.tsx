import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignTaxiViaje,
  createTaxiConductor,
  getTaxiAdminToken,
  listTaxiConductores,
  listTaxiViajes,
  setTaxiAdminToken,
} from "@/features/platform/api/taxi";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { KpiStrip } from "@/features/platform/ui/KpiStrip";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";

type Viaje = {
  id_viaje: number;
  origen: string;
  destino: string;
  estado: string;
  id_conductor?: number | null;
};
type Conductor = { id_conductor: number; nombre: string; telefono?: string; activo: number };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

const STATUSES = ["solicitado", "asignado", "en_curso", "finalizado", "cancelado"];

export default function TaxiAdminPage() {
  const [session, setSession] = useState(Boolean(getTaxiAdminToken()));
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [condNombre, setCondNombre] = useState("");
  const [condTel, setCondTel] = useState("");
  const [condPass, setCondPass] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [assignFor, setAssignFor] = useState<number | null>(null);
  const [pickConductor, setPickConductor] = useState<number | "">("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, c] = await Promise.all([listTaxiViajes(), listTaxiConductores()]);
      if (!v.success) throw new Error(v.message || "Sin acceso");
      setViajes(v.data || []);
      setConductores(c.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Taxi"));
      setTaxiAdminToken(null);
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 8000);
    return () => window.clearInterval(id);
  }, [session]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return viajes.filter((v) => {
      if (statusFilter !== "all" && v.estado !== statusFilter) return false;
      if (!q) return true;
      return (
        String(v.id_viaje).includes(q) ||
        v.origen.toLowerCase().includes(q) ||
        v.destino.toLowerCase().includes(q)
      );
    });
  }, [viajes, query, statusFilter]);

  const kpis = useMemo(() => {
    const count = (s: string) => viajes.filter((v) => v.estado === s).length;
    return [
      { label: "Solicitados", value: count("solicitado") },
      { label: "En curso", value: count("en_curso") + count("asignado") },
      { label: "Finalizados", value: count("finalizado") },
      { label: "Conductores", value: conductores.length },
    ];
  }, [viajes, conductores]);

  if (!session) {
    return <Navigate to="/login?mode=taxi" replace />;
  }

  if (loading && viajes.length === 0) {
    return (
      <PlatformShell productId="taxi" companyName="Operador Demo Taxi" title="Sala de control">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }

  if (error) {
    return (
      <PlatformShell productId="taxi" companyName="Operador Demo Taxi" title="Taxi">
        <p className="text-sm text-destructive">{error}</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="taxi"
      companyName="Operador Demo Taxi"
      roleLabel="Admin"
      title="Sala de control"
      subtitle="Asigna viajes y monitorea la flota"
      onLogout={() => {
        setTaxiAdminToken(null);
        setSession(false);
      }}
    >
      <KpiStrip items={kpis} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar origen, destino o #"
            statuses={STATUSES}
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="No hay viajes con este filtro"
              body="Ajusta el filtro o espera nuevas solicitudes."
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((v) => (
                <li
                  key={v.id_viaje}
                  className="flex flex-wrap items-center justify-between gap-3 bg-white/80 px-3 py-3"
                >
                  <div>
                    <p className="text-[14px] font-medium">
                      #{v.id_viaje} · {v.origen} → {v.destino}
                    </p>
                    <div className="mt-1">
                      <StatusChip status={v.estado} />
                    </div>
                  </div>
                  {v.estado === "solicitado" ? (
                    assignFor === v.id_viaje ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded border border-black/15 bg-white px-2 py-1.5 text-sm"
                          value={pickConductor}
                          onChange={(e) =>
                            setPickConductor(e.target.value ? Number(e.target.value) : "")
                          }
                        >
                          <option value="">Elegir conductor</option>
                          {conductores.map((c) => (
                            <option key={c.id_conductor} value={c.id_conductor}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!pickConductor}
                          style={{ backgroundColor: "var(--platform-accent)" }}
                          onClick={async () => {
                            try {
                              if (!pickConductor) return;
                              const res = await assignTaxiViaje(v.id_viaje, Number(pickConductor));
                              if (!res.success) throw new Error(res.message);
                              toast.success("Viaje asignado");
                              setAssignFor(null);
                              setPickConductor("");
                              await load();
                            } catch (err: unknown) {
                              toast.error(errMsg(err, "Error"));
                            }
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAssignFor(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={conductores.length === 0}
                        onClick={() => {
                          setAssignFor(v.id_viaje);
                          setPickConductor(conductores[0]?.id_conductor ?? "");
                        }}
                      >
                        Asignar
                      </Button>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <PlatformMapPanel
            title="Mapa operativo"
            footnote="Demo Lima — pins de referencia"
            markers={[
              {
                id: "base",
                label: "Base",
                lng: LIMA_POINTS.sanIsidro[0],
                lat: LIMA_POINTS.sanIsidro[1],
              },
              {
                id: "hot",
                label: "Zona caliente",
                lng: LIMA_POINTS.miraflores[0],
                lat: LIMA_POINTS.miraflores[1],
              },
            ]}
            className="h-[240px]"
          />

          <form
            className="space-y-2 bg-white/80 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await createTaxiConductor({
                  nombre: condNombre,
                  telefono: condTel || undefined,
                  password: condPass,
                });
                if (!res.success) throw new Error(res.message);
                toast.success("Conductor creado");
                setCondNombre("");
                setCondTel("");
                setCondPass("");
                await load();
              } catch (err: unknown) {
                toast.error(errMsg(err, "Error"));
              }
            }}
          >
            <h2 className="text-sm font-semibold">Nuevo conductor</h2>
            <Input
              placeholder="Nombre"
              value={condNombre}
              onChange={(e) => setCondNombre(e.target.value)}
              required
            />
            <Input
              placeholder="Teléfono"
              value={condTel}
              onChange={(e) => setCondTel(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={condPass}
              onChange={(e) => setCondPass(e.target.value)}
              required
            />
            <Button type="submit" size="sm" style={{ backgroundColor: "var(--platform-accent)" }}>
              Crear
            </Button>
          </form>

          <div className="bg-white/80 p-4">
            <h2 className="text-sm font-semibold">Conductores</h2>
            {conductores.length === 0 ? (
              <EmptyState title="Sin conductores" body="Crea uno para poder asignar viajes." />
            ) : (
              <ul className="mt-2 divide-y divide-black/8 text-sm">
                {conductores.map((c) => (
                  <li key={c.id_conductor} className="py-2">
                    {c.nombre}
                    {c.telefono ? ` · ${c.telefono}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </PlatformShell>
  );
}
