import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFlotasCombustible,
  createFlotasConductor,
  createFlotasVehiculo,
  getFlotasToken,
  listFlotasCombustible,
  listFlotasConductores,
  listFlotasVehiculos,
  setFlotasToken,
} from "@/features/platform/api/flotas";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Vehiculo = {
  id_vehiculo: number;
  placa: string;
  marca?: string;
  modelo?: string;
  soat_vence?: string;
};
type Conductor = { id_conductor: number; nombre: string; licencia?: string };
type Comb = { id_reg: number; id_vehiculo: number; litros: number; monto: number; fecha: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function FlotasAdminPage() {
  const [session, setSession] = useState(Boolean(getFlotasToken()));
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [combustible, setCombustible] = useState<Comb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [condNombre, setCondNombre] = useState("");
  const [licencia, setLicencia] = useState("");
  const [idVehComb, setIdVehComb] = useState("");
  const [litros, setLitros] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaComb, setFechaComb] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, c, comb] = await Promise.all([
        listFlotasVehiculos(),
        listFlotasConductores(),
        listFlotasCombustible(),
      ]);
      if (!v.success) throw new Error(v.message || "Sin acceso");
      setVehiculos(v.data || []);
      setConductores(c.data || []);
      setCombustible(comb.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Flotas"));
      setFlotasToken(null);
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) {
    return <Navigate to="/login?mode=flotas" replace />;
  }

  if (loading && vehiculos.length === 0 && !error) {
    return (
      <PlatformShell productId="flotas" title="Flotas">
        <p className="text-sm text-black/50">Cargando…</p>
      </PlatformShell>
    );
  }
  if (error) {
    return (
      <PlatformShell productId="flotas" title="Flotas">
        <p className="text-sm text-destructive">{error}</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      productId="flotas"
      title="Flotas"
      onLogout={() => {
        setFlotasToken(null);
        setSession(false);
      }}
    >
      <PlatformMapPanel
        title="Patio · unidades (demo geo)"
        footnote="Pins etiquetados con placa — sin lat/lng en BD"
        center={LIMA_POINTS.sanIsidro}
        zoom={11}
        markers={(vehiculos.length
          ? vehiculos.slice(0, 6)
          : [{ id_vehiculo: 0, placa: "DEMO-01" }, { id_vehiculo: 1, placa: "DEMO-02" }, { id_vehiculo: 2, placa: "DEMO-03" }]
        ).map((v, i) => {
          const pts = [
            LIMA_POINTS.sanIsidro,
            LIMA_POINTS.callao,
            LIMA_POINTS.laMolina,
            LIMA_POINTS.miraflores,
            LIMA_POINTS.surco,
            LIMA_POINTS.jesusMaria,
          ];
          const p = pts[i % pts.length];
          return {
            id: String(v.id_vehiculo || i),
            label: v.placa,
            lng: p[0],
            lat: p[1],
            popup: `${v.placa}${v.soat_vence ? ` · SOAT ${v.soat_vence}` : ""}`,
          };
        })}
        className="h-[300px]"
      />

      <section className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createFlotasVehiculo({
                placa,
                marca: marca || undefined,
                modelo: modelo || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Vehículo creado");
              setPlaca("");
              setMarca("");
              setModelo("");
              await load();
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nuevo vehículo</h2>
          <Input placeholder="Placa" value={placa} onChange={(e) => setPlaca(e.target.value)} required />
          <Input placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          <Input placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createFlotasConductor({
                nombre: condNombre,
                licencia: licencia || undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Conductor creado");
              setCondNombre("");
              setLicencia("");
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
          <Input placeholder="Licencia" value={licencia} onChange={(e) => setLicencia(e.target.value)} />
          <Button type="submit" size="sm">
            Crear
          </Button>
        </form>
      </section>

      <form
        className="max-w-md space-y-3 border-b border-border/60 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createFlotasCombustible({
              id_vehiculo: Number(idVehComb),
              litros: Number(litros),
              monto: Number(monto),
              fecha: fechaComb,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Combustible registrado");
            setLitros("");
            setMonto("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Carga de combustible</h2>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={idVehComb}
          onChange={(e) => setIdVehComb(e.target.value)}
          required
        >
          <option value="">Vehículo…</option>
          {vehiculos.map((v) => (
            <option key={v.id_vehiculo} value={v.id_vehiculo}>
              {v.placa}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="Litros" value={litros} onChange={(e) => setLitros(e.target.value)} required />
          <Input type="number" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          <Input type="date" value={fechaComb} onChange={(e) => setFechaComb(e.target.value)} required />
        </div>
        <Button type="submit" size="sm">
          Registrar
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Vehículos</h2>
        {vehiculos.length === 0 ? (
          <EmptyState title="Sin vehículos" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {vehiculos.map((v) => (
              <li key={v.id_vehiculo} className="py-2">
                {v.placa}
                {v.marca ? ` · ${v.marca} ${v.modelo || ""}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Conductores</h2>
        {conductores.length === 0 ? (
          <EmptyState title="Sin conductores" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {conductores.map((c) => (
              <li key={c.id_conductor} className="py-2">
                {c.nombre}
                {c.licencia ? ` · ${c.licencia}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Combustible reciente</h2>
        {combustible.length === 0 ? (
          <EmptyState title="Sin registros" />
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {combustible.slice(0, 20).map((c) => (
              <li key={c.id_reg} className="flex justify-between py-2">
                <span>
                  Veh #{c.id_vehiculo} · {c.litros} L
                </span>
                <span className="text-muted-foreground">
                  S/ {Number(c.monto).toFixed(2)} · {c.fecha}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformShell>
  );
}
