import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  assignTaxiViaje,
  getTaxiAdminToken,
  listTaxiConductores,
  listTaxiViajes,
  patchTaxiViajeAdmin,
} from "@/features/platform/api/taxi";
import { KpiStrip } from "@/features/platform/ui/KpiStrip";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";
import { TaxiAdminShell, taxiErr } from "./taxi/TaxiAdminShell";

type Viaje = {
  id_viaje: number;
  origen: string;
  destino: string;
  estado: string;
  id_conductor?: number | null;
};
type Conductor = { id_conductor: number; nombre: string; telefono?: string; activo: number };

const STATUSES = ["solicitado", "asignado", "en_curso", "finalizado", "cancelado"];

export default function TaxiAdminPage() {
  const [session, setSession] = useState(Boolean(getTaxiAdminToken()));
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      setConductores((c.data || []).filter((x: Conductor) => Number(x.activo) === 1));
    } catch (e: unknown) {
      setError(taxiErr(e, "Error al cargar Taxi"));
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

  if (!session) return <Navigate to="/login?mode=taxi" replace />;

  if (loading && viajes.length === 0) {
    return (
      <TaxiAdminShell title="Sala de control" onLogout={() => setSession(false)}>
        <p className="text-sm text-black/50">Cargando…</p>
      </TaxiAdminShell>
    );
  }

  if (error) {
    return (
      <TaxiAdminShell title="Viajes" onLogout={() => setSession(false)}>
        <p className="text-sm text-destructive">{error}</p>
      </TaxiAdminShell>
    );
  }

  return (
    <TaxiAdminShell
      title="Sala de control"
      subtitle="Asigna viajes y monitorea la flota"
      onLogout={() => setSession(false)}
    >
      <KpiStrip items={kpis} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar origen, destino o #"
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            statuses={STATUSES}
          />
          {filtered.length === 0 ? (
            <EmptyState title="Sin viajes" body="No hay viajes con ese filtro." />
          ) : (
            <ul className="space-y-2">
              {filtered.map((v) => (
                <li
                  key={v.id_viaje}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      #{v.id_viaje} · {v.origen} → {v.destino}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={v.estado} />
                    {v.estado === "solicitado" ? (
                      assignFor === v.id_viaje ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded border px-2 py-1 text-sm"
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
                            onClick={async () => {
                              try {
                                if (!pickConductor) return;
                                const res = await assignTaxiViaje(v.id_viaje, Number(pickConductor));
                                if (!res.success) throw new Error(res.message);
                                toast.success("Asignado");
                                setAssignFor(null);
                                await load();
                              } catch (err: unknown) {
                                toast.error(taxiErr(err, "Error"));
                              }
                            }}
                          >
                            Confirmar
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
                    {v.estado !== "cancelado" && v.estado !== "finalizado" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={async () => {
                          try {
                            const res = await patchTaxiViajeAdmin(v.id_viaje, {
                              estado: "cancelado",
                            });
                            if (!res.success) throw new Error(res.message);
                            toast.success("Viaje cancelado");
                            await load();
                          } catch (err: unknown) {
                            toast.error(taxiErr(err, "Error"));
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12px] text-black/45">
            Gestiona la flota en{" "}
            <Link to="/taxi-admin/conductores" className="font-medium underline-offset-2 hover:underline">
              Conductores
            </Link>
            .
          </p>
        </section>

        <PlatformMapPanel
          title="Mapa operativo"
          footnote="Demo geo Lima"
          center={LIMA_POINTS.sanIsidro}
          markers={[
            {
              id: "hub",
              label: "Hub",
              lng: LIMA_POINTS.sanIsidro[0],
              lat: LIMA_POINTS.sanIsidro[1],
              popup: "Operador demo",
            },
          ]}
        />
      </div>
    </TaxiAdminShell>
  );
}
